import { FIXTURE_NOW, FIXTURE_TODAY } from "@turo-automation/shared";

/**
 * Fixture data is pinned to FIXTURE_NOW, so fixture mode keeps that clock;
 * with Supabase configured the worker uses the system clock. WORKER_CLOCK
 * ("system" or "fixture") overrides the choice.
 */
function useSystemClock(): boolean {
  const override = process.env["WORKER_CLOCK"];
  if (override === "system") return true;
  if (override === "fixture") return false;
  return Boolean(process.env["SUPABASE_URL"] && process.env["SUPABASE_KEY"]);
}

export function getWorkerNowIso(): string {
  return useSystemClock() ? new Date().toISOString() : FIXTURE_NOW;
}

/** Current date (UTC) as YYYY-MM-DD. */
export function getWorkerToday(): string {
  return useSystemClock() ? new Date().toISOString().slice(0, 10) : FIXTURE_TODAY;
}
