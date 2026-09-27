import { baseResult } from '../core/result.js';

export async function bootstrapSessionFlow() {
  return {
    ...baseResult('session:bootstrap'),
    status: 'planned',
    next: [
      'Launch headed Playwright browser',
      'Navigate to Turo login',
      'Wait for manual authentication',
      'Persist storage state to storage/state.json'
    ]
  };
}
