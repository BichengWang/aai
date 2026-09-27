import { logWorkerEvent } from "../lib/logger.js";

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffFactor?: number;
}

/**
 * Wraps an async function with linear-backoff retry logic.
 * Each attempt waits `delayMs * attempt` before retrying (1x, 2x, 3x...).
 *
 * @param fn - The async function to retry
 * @param label - Name used in log events for observability
 * @param opts - Retry configuration
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  opts: RetryOptions = {},
): Promise<T> {
  const maxAttempts = opts.maxAttempts ?? 3;
  const delayMs = opts.delayMs ?? 1_000;
  const backoffFactor = opts.backoffFactor ?? 2;

  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const isLast = attempt === maxAttempts;

      logWorkerEvent("retry.attempt_failed", {
        label,
        attempt,
        maxAttempts,
        error: error instanceof Error ? error.message : String(error),
        willRetry: !isLast,
      });

      if (!isLast) {
        const waitMs = delayMs * Math.pow(backoffFactor, attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }
  }

  throw lastError;
}
