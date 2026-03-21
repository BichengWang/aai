import {
  createSupabaseClient,
  createSupabaseIncidentRepository,
  createSupabaseJobRunRepository,
  createSupabaseMessageRepository,
  createSupabaseTaskRepository,
  createSupabaseTripRepository,
  type Guest,
  type OpsNotifier,
  type TripImportSource,
  type Vehicle,
} from "@turo-automation/shared";

// ---------------------------------------------------------------------------
// Minimal Supabase row types for vehicles and guests (read-only lookup data)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Stub implementations for adapters not yet wired to real services.
// These are replaced by real integrations in future slices.
// ---------------------------------------------------------------------------
function createNoopNotifier(): OpsNotifier {
  return {
    async publishDigest() {
      return { accepted: false, externalId: null };
    },
    async notifyApprovalRequested() {
      return { accepted: false, externalId: null };
    },
    async notifyIncidentDetected() {
      return { accepted: false, externalId: null };
    },
  };
}

function createNoopTripImportSource(): TripImportSource {
  return {
    async readTripImportRows() {
      return [];
    },
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export async function createSupabaseAdapters() {
  const client = createSupabaseClient();

  // Fetch lookup arrays needed by use-cases
  const [vehiclesRes, guestsRes] = await Promise.all([
    client.from("vehicles").select("*").eq("status", "active"),
    client.from("guests").select("id, full_name"),
  ]);

  if (vehiclesRes.error) {
    throw new Error(`createSupabaseAdapters: vehicles – ${vehiclesRes.error.message}`);
  }
  if (guestsRes.error) {
    throw new Error(`createSupabaseAdapters: guests – ${guestsRes.error.message}`);
  }

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

  return {
    vehicles,
    guests,
    tripRepository: createSupabaseTripRepository(client),
    taskRepository: createSupabaseTaskRepository(client),
    incidentRepository: createSupabaseIncidentRepository(client),
    messageRepository: createSupabaseMessageRepository(client),
    jobRunRepository: createSupabaseJobRunRepository(client),
    // Real implementations planned in upcoming slices
    tripImportSource: createNoopTripImportSource(),
    notifier: createNoopNotifier(),
  };
}
