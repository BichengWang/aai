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
import { createWebSupabaseClient } from "./supabaseClient";

export async function loadTripTimeline(
  tripId: string
): Promise<UseCaseResult<GetTripTimelineData>> {
  const generatedAt = new Date().toISOString();

  const client = createWebSupabaseClient();
  if (client) {
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
