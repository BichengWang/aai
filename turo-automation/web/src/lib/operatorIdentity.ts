const OPERATOR_IDENTITY = (
  import.meta as unknown as { env: Record<string, string> }
).env["VITE_OPERATOR_IDENTITY"]?.trim() || null;

export function getWebOperatorIdentity(): string | null {
  return OPERATOR_IDENTITY;
}
