import {
  createFixtureContext,
  createGetVehicleUtilizationUseCase,
  createSupabaseTripRepository,
  createSupabaseVehicleRepository,
  type GetVehicleUtilizationData,
  type UseCaseResult,
} from "@turo-automation/shared";
import { createWebSupabaseClient } from "./supabaseClient";

export async function loadVehicleUtilization(
  windowDays = 30
): Promise<UseCaseResult<GetVehicleUtilizationData>> {
  const now = new Date();
  const windowEnd = now.toISOString();
  const windowStart = new Date(
    now.getTime() - windowDays * 24 * 60 * 60 * 1000
  ).toISOString();
  const generatedAt = now.toISOString();

  const client = createWebSupabaseClient();
  if (client) {
    const vehicleRepo = createSupabaseVehicleRepository(client);
    const vehicles = await vehicleRepo.listVehicles();
    const useCase = createGetVehicleUtilizationUseCase({
      tripRepository: createSupabaseTripRepository(client),
      vehicles,
    });
    return useCase.execute({ windowStart, windowEnd, generatedAt });
  }

  const ctx = createFixtureContext();
  const useCase = createGetVehicleUtilizationUseCase({
    tripRepository: ctx.tripRepository,
    vehicles: ctx.vehicles,
  });
  return useCase.execute({ windowStart, windowEnd, generatedAt });
}
