import {
  createActOnIncidentUseCase,
  createSupabaseIncidentRepository,
  type ActOnIncidentData,
  type Incident,
  type UseCaseResult,
} from "@turo-automation/shared";
import { createClient } from "@supabase/supabase-js";
import { getWebOperatorIdentity } from "./operatorIdentity";

const SUPABASE_URL = (import.meta as unknown as { env: Record<string, string> })
  .env["VITE_SUPABASE_URL"];
const SUPABASE_KEY = (import.meta as unknown as { env: Record<string, string> })
  .env["VITE_SUPABASE_KEY"];

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

export async function actOnIncident(
  incidentId: string,
  status: Incident["status"],
  actedBy: string | null = getWebOperatorIdentity(),
): Promise<UseCaseResult<ActOnIncidentData> | null> {
  if (!useSupabase || !actedBy) return null;

  const client = createClient(SUPABASE_URL, SUPABASE_KEY);
  const incidentRepository = createSupabaseIncidentRepository(client);
  const useCase = createActOnIncidentUseCase({
    incidentRepository,
  });

  return useCase.execute({
    incidentId,
    status,
    actedBy,
    actedAt: new Date().toISOString(),
  });
}
