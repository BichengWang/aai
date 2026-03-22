export function baseResult(workflow: string) {
  return {
    ok: true,
    workflow,
    timestamp: new Date().toISOString()
  };
}
