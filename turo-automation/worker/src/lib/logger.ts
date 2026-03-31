import type { UseCaseResult } from "@turo-automation/shared";

const isProduction = process.env["NODE_ENV"] === "production";

/**
 * logWorkerEvent
 *
 * Development: human-readable two-line output.
 * Production (NODE_ENV=production): single JSON line per event for log aggregators.
 *
 * JSON schema: { level, ts, event, ...payload }
 */
export function logWorkerEvent(label: string, payload: unknown) {
  if (isProduction) {
    const line = JSON.stringify({
      level: "info",
      ts: new Date().toISOString(),
      event: label,
      ...(typeof payload === "object" && payload !== null ? payload : { data: payload }),
    });
    process.stdout.write(line + "\n");
  } else {
    console.log(`[worker] ${label}`);
    console.log(JSON.stringify(payload, null, 2));
  }
}

export function logUseCaseResult<T>(label: string, result: UseCaseResult<T>) {
  logWorkerEvent(label, {
    ok: result.ok,
    issues: result.issues,
    meta: result.meta,
    data: result.data,
  });
}
