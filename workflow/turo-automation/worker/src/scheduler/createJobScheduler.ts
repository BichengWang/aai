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

export interface JobScheduler {
  start(): void;
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
    try {
      logWorkerEvent("scheduler.job_start", { name: job.name });
      await withRetry(() => job.run(), job.name, {
        maxAttempts: job.maxAttempts ?? 3,
        delayMs: job.retryDelayMs ?? 2_000,
      });
      logWorkerEvent("scheduler.job_done", { name: job.name });
    } catch (error) {
      logWorkerEvent("scheduler.job_error", {
        name: job.name,
        error: error instanceof Error ? error.message : String(error),
      });
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
        });
      }
      return finished;
    },
  };
}
