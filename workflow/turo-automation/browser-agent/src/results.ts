export interface BrowserAgentResult<T> {
  ok: boolean;
  workflow: string;
  timestamp: string;
  data: T;
  warnings?: string[];
}

export function createResult<T>(workflow: string, data: T, warnings?: string[]): BrowserAgentResult<T> {
  return {
    ok: true,
    workflow,
    timestamp: new Date().toISOString(),
    data,
    warnings,
  };
}
