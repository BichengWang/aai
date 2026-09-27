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
  stop(): void;
}

/**
 * Minimal interval-based job scheduler.
 * Each job runs immediately on start, then repeats at its configured interval.
 * Failed jobs are retried with exponential backoff up to maxAttempts.
 * Job failures after all retries are logged but do not affect other jobs.
 */
export function createJobScheduler(jobs: ScheduledJob[]): JobScheduler {
  const handles: ReturnType<typeof setInterval>[] = [];

  async function safeRun(job: ScheduledJob) {
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

    stop() {
      logWorkerEvent("scheduler.stop", { jobCount: handles.length });
      for (const handle of handles) {
        clearInterval(handle);
      }
      handles.length = 0;
    },
  };
}
