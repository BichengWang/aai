import { logWorkerEvent } from "./logger.js";

// setInterval/setTimeout treat delays above this as 1ms.
const MAX_TIMER_DELAY_MS = 2_147_483_647;

/**
 * Read a positive integer from an env var, falling back to the default when
 * the value is missing, non-numeric, not positive, or above `max` (by default
 * the largest timer delay). A bad value is logged so a typo cannot silently
 * turn a 5-minute interval into a tight loop.
 */
export function readPositiveIntEnv(
  name: string,
  defaultValue: number,
  max = MAX_TIMER_DELAY_MS
): number {
  const raw = process.env[name];
  if (raw === undefined || raw.trim() === "") return defaultValue;

  const value = Number(raw);
  if (Number.isInteger(value) && value > 0 && value <= max) return value;

  logWorkerEvent("boot.config.warning", {
    message: `${name}="${raw}" is not a positive integer up to ${max} — using default ${defaultValue}.`,
  }, "warn");
  return defaultValue;
}
