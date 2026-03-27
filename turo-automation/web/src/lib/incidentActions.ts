import {
  createActOnIncidentUseCase,
  createSupabaseIncidentRepository,
  type ActOnIncidentData,
  type Incident,
  type UseCaseResult,
} from "@turo-automation/shared";
import { getWebOperatorIdentity } from "./operatorIdentity";
import { createWebSupabaseClient } from "./supabaseClient";

export async function actOnIncident(
  incidentId: string,
  status: Incident["status"],
  actedBy: string | null = getWebOperatorIdentity(),
): Promise<UseCaseResult<ActOnIncidentData> | null> {
  const client = createWebSupabaseClient();
  if (!client || !actedBy) return null;

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
