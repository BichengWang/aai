import { logWorkerEvent } from "../lib/logger.js";
import { withRetry } from "./withRetry.js";

export interface ScheduledJob {
  name: string;
  intervalMs: number;
  run: () => Promise<void>;
  /** Max retry attempts on failure (default: 3). Set to 1 to disable retries. */
  maxAttempts?: number;
  /** Base delay in ms between retries with exponential backoff (default: 2000). */
  retryDelayMs?: number;
}

/** Last-run state of a scheduled job, as reported by /healthz. Timestamps are wall-clock ISO strings. */
export interface ScheduledJobStatus {
  running: boolean;
  lastStartedAt: string | null;
  lastSucceededAt: string | null;
  lastFailedAt: string | null;
  lastError: string | null;
  /** Runs in a row that failed after all retries; 0 after a success. */
  consecutiveFailures: number;
}

export interface JobScheduler {
  start(): void;
  status(): Record<string, ScheduledJobStatus>;
  /**
   * Stop scheduling new runs and wait for in-flight jobs to finish, up to
   * `timeoutMs`. Resolves `true` if every job finished, `false` on timeout.
   */
  stop(options?: { timeoutMs?: number }): Promise<boolean>;
}

/**
 * Minimal interval-based job scheduler.
 * Each job runs immediately on start, then repeats at its configured interval.
 * Ticks are skipped while that job is still running, including its retries.
 * Failed jobs are retried with exponential backoff up to maxAttempts.
 * Job failures after all retries are logged but do not affect other jobs.
 * stop() drains in-flight jobs so a shutdown does not cut a job_runs write short.
 */
export function createJobScheduler(jobs: ScheduledJob[]): JobScheduler {
  const handles: ReturnType<typeof setInterval>[] = [];
  const runningJobs = new Map<ScheduledJob, Promise<void>>();
  const statuses = new Map<ScheduledJob, ScheduledJobStatus>(
    jobs.map((job) => [
      job,
      {
        running: false,
        lastStartedAt: null,
        lastSucceededAt: null,
        lastFailedAt: null,
        lastError: null,
        consecutiveFailures: 0,
      },
    ])
  );

  async function safeRun(job: ScheduledJob) {
    if (runningJobs.has(job)) {
      logWorkerEvent("scheduler.job_skip", { name: job.name, reason: "already_running" });
      return;
    }

    const run = runJob(job);
    runningJobs.set(job, run);
    try {
      await run;
    } finally {
      runningJobs.delete(job);
    }
  }

  async function runJob(job: ScheduledJob) {
    const status = statuses.get(job)!;
    status.running = true;
    status.lastStartedAt = new Date().toISOString();
    try {
      logWorkerEvent("scheduler.job_start", { name: job.name });
      await withRetry(() => job.run(), job.name, {
        maxAttempts: job.maxAttempts ?? 3,
        delayMs: job.retryDelayMs ?? 2_000,
      });
      status.lastSucceededAt = new Date().toISOString();
      status.consecutiveFailures = 0;
      logWorkerEvent("scheduler.job_done", { name: job.name });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status.lastFailedAt = new Date().toISOString();
      status.lastError = message;
      status.consecutiveFailures++;
      logWorkerEvent("scheduler.job_error", {
        name: job.name,
        error: message,
      }, "error");
    } finally {
      status.running = false;
    }
  }

  return {
    start() {
      logWorkerEvent("scheduler.start", {
        jobs: jobs.map((j) => ({ name: j.name, intervalMs: j.intervalMs })),
      });

      for (const job of jobs) {
        // Run immediately, then on interval
        void safeRun(job);
        const handle = setInterval(() => void safeRun(job), job.intervalMs);
        handles.push(handle);
      }
    },

    status() {
      return Object.fromEntries(jobs.map((job) => [job.name, { ...statuses.get(job)! }]));
    },

    async stop({ timeoutMs = 8_000 } = {}) {
      for (const handle of handles) {
        clearInterval(handle);
      }
      handles.length = 0;

      const inFlight = [...runningJobs.keys()].map((job) => job.name);
      logWorkerEvent("scheduler.stop", { inFlight, timeoutMs });
      if (inFlight.length === 0) return true;

      let timer: ReturnType<typeof setTimeout> | undefined;
      const timedOut = new Promise<false>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      });
      const drained = Promise.allSettled(runningJobs.values()).then(() => true as const);
      const finished = await Promise.race([drained, timedOut]);
      clearTimeout(timer);

      if (!finished) {
        logWorkerEvent("scheduler.stop_timeout", {
          stillRunning: [...runningJobs.keys()].map((job) => job.name),
        }, "error");
      }
      return finished;
    },
  };
}
