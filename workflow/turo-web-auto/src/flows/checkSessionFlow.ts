import { baseResult } from '../core/result.js';

export async function checkSessionFlow() {
  return {
    ...baseResult('session:check'),
    status: 'planned',
    checks: [
      'Load saved storage state',
      'Open host dashboard or trips page',
      'Detect authenticated vs expired session',
      'Return actionable health response'
    ]
  };
}
