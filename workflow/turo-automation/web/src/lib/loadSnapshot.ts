import {
  createGetTodayOpsSnapshotUseCase,
  createSupabaseIncidentRepository,
  createSupabaseJobRunRepository,
  createSupabaseMessageRepository,
  createSupabaseTaskRepository,
  createSupabaseTripRepository,
  getFixtureTodayOpsSnapshot,
  type Guest,
  type UseCaseResult,
  type TodayOpsSnapshot,
  type Vehicle,
} from "@turo-automation/shared";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createWebSupabaseClient } from "./supabaseClient";

interface VehicleRow {
  id: string;
  vin: string | null;
  plate: string | null;
  nickname: string;
  make: string;
  model: string;
  year: number | null;
  status: string;
  location: string | null;
  odometer: number | null;
  fuel_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface GuestRow {
  id: string;
  full_name: string;
}

async function loadSupabaseSnapshot(
  client: SupabaseClient
): Promise<
  UseCaseResult<TodayOpsSnapshot>
> {
  const [vehiclesRes, guestsRes] = await Promise.all([
    client.from("vehicles").select("*").eq("status", "active"),
    client.from("guests").select("id, full_name"),
  ]);

  if (vehiclesRes.error) throw new Error(vehiclesRes.error.message);
  if (guestsRes.error) throw new Error(guestsRes.error.message);

  const vehicles: Vehicle[] = (vehiclesRes.data as VehicleRow[]).map((r) => ({
    id: r.id,
    vin: r.vin,
    plate: r.plate,
    nickname: r.nickname,
    make: r.make,
    model: r.model,
    year: r.year,
    status: r.status as Vehicle["status"],
    location: r.location,
    odometer: r.odometer,
    fuelType: r.fuel_type,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const guests: Pick<Guest, "id" | "fullName">[] = (
    guestsRes.data as GuestRow[]
  ).map((r) => ({ id: r.id, fullName: r.full_name }));

  const tripRepository = createSupabaseTripRepository(client);
  const taskRepository = createSupabaseTaskRepository(client);
  const incidentRepository = createSupabaseIncidentRepository(client);
  const messageRepository = createSupabaseMessageRepository(client);
  const jobRunRepository = createSupabaseJobRunRepository(client);

  const useCase = createGetTodayOpsSnapshotUseCase({
    tripRepository,
    taskRepository,
    incidentRepository,
    messageRepository,
    jobRunRepository,
    guests,
    vehicles,
  });

  const today = new Date().toISOString().slice(0, 10);
  const generatedAt = new Date().toISOString();
  return useCase({ today, generatedAt });
}

export async function loadSnapshot(): Promise<UseCaseResult<TodayOpsSnapshot>> {
  const client = createWebSupabaseClient();
  if (client) {
    return loadSupabaseSnapshot(client);
  }
  return getFixtureTodayOpsSnapshot();
}
