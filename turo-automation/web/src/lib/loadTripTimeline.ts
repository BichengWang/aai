import {
  createFixtureContext,
  createGetTripTimelineUseCase,
  createSupabaseIncidentRepository,
  createSupabaseMessageRepository,
  createSupabaseTaskRepository,
  createSupabaseTripRepository,
  type GetTripTimelineData,
  type UseCaseResult,
} from "@turo-automation/shared";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = (import.meta as unknown as { env: Record<string, string> })
  .env["VITE_SUPABASE_URL"];
const SUPABASE_KEY = (import.meta as unknown as { env: Record<string, string> })
  .env["VITE_SUPABASE_KEY"];

const useSupabase = Boolean(SUPABASE_URL && SUPABASE_KEY);

export async function loadTripTimeline(
  tripId: string
): Promise<UseCaseResult<GetTripTimelineData>> {
  const generatedAt = new Date().toISOString();

  if (useSupabase) {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);
    const useCase = createGetTripTimelineUseCase({
      tripRepository: createSupabaseTripRepository(client),
      taskRepository: createSupabaseTaskRepository(client),
      incidentRepository: createSupabaseIncidentRepository(client),
      messageRepository: createSupabaseMessageRepository(client),
    });
    return useCase.execute({ tripId, generatedAt });
  }

  const ctx = createFixtureContext();
  const useCase = createGetTripTimelineUseCase({
    tripRepository: ctx.tripRepository,
    taskRepository: ctx.taskRepository,
    incidentRepository: ctx.incidentRepository,
    messageRepository: ctx.messageRepository,
  });
  return useCase.execute({ tripId, generatedAt });
}
