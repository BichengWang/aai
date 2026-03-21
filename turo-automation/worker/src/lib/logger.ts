import type { UseCaseResult } from "@turo-automation/shared";

export function logWorkerEvent(label: string, payload: unknown) {
  console.log(`[worker] ${label}`);
  console.log(JSON.stringify(payload, null, 2));
}

export function logUseCaseResult<T>(label: string, result: UseCaseResult<T>) {
  logWorkerEvent(label, {
    ok: result.ok,
    issues: result.issues,
    meta: result.meta,
    data: result.data,
  });
}
