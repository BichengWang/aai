import { env } from '../config/env.js';
import { baseResult } from '../core/result.js';

export async function healthSmokeFlow() {
  return {
    ...baseResult('health:smoke'),
    runtime: {
      baseUrl: env.TURO_BASE_URL,
      headless: env.HEADLESS,
      defaultTimeoutMs: env.DEFAULT_TIMEOUT_MS,
      slowMoMs: env.SLOW_MO_MS
    },
    note: 'Scaffold only. Browser automation not implemented yet.'
  };
}
