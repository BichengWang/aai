import type { UseCaseResult } from "@turo-automation/shared";

const isProduction = process.env["NODE_ENV"] === "production";

export type LogLevel = "info" | "warn" | "error";

/**
 * logWorkerEvent
 *
 * Development: human-readable two-line output (warn/error go to stderr).
 * Production (NODE_ENV=production): single JSON line per event on stdout for log aggregators.
 *
 * JSON schema: { level, ts, event, ...payload }
 */
export function logWorkerEvent(label: string, payload: unknown, level: LogLevel = "info") {
  if (isProduction) {
    const line = JSON.stringify({
      level,
      ts: new Date().toISOString(),
      event: label,
      ...(typeof payload === "object" && payload !== null ? payload : { data: payload }),
    });
    process.stdout.write(line + "\n");
  } else {
    const write = level === "error" ? console.error : level === "warn" ? console.warn : console.log;
    write(`[worker] ${label}`);
    write(JSON.stringify(payload, null, 2));
  }
}

/** Logged at the level of the most severe issue: error, warn (for warnings), else info. */
export function logUseCaseResult<T>(label: string, result: UseCaseResult<T>) {
  const level: LogLevel = !result.ok
    ? "error"
    : result.issues.some((issue) => issue.severity === "warning")
      ? "warn"
      : "info";
  logWorkerEvent(
    label,
    {
      ok: result.ok,
      issues: result.issues,
      meta: result.meta,
      data: result.data,
    },
    level
  );
}
