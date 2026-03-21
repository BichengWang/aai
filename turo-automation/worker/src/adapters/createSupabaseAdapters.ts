import {
  createEnvSlackNotifier,
  createSupabaseClient,
  createSupabaseGuestRepository,
  createSupabaseIncidentRepository,
  createSupabaseJobRunRepository,
  createSupabaseMessageRepository,
  createSupabaseTaskRepository,
  createSupabaseTripRepository,
  createSupabaseVehicleRepository,
  type Guest,
  type Vehicle,
} from "@turo-automation/shared";
import { createEnvCsvTripImportSource } from "./csv/tripImportSource.js";

export async function createSupabaseAdapters() {
  const client = createSupabaseClient();

  // Create repository instances
  const vehicleRepository = createSupabaseVehicleRepository(client);
  const guestRepository = createSupabaseGuestRepository(client);

  // Fetch lookup arrays needed by existing use-cases that take arrays
  const [vehicles, guests] = await Promise.all([
    vehicleRepository.listVehicles(),
    guestRepository.listGuests(),
  ]);

  const guestLookup: Pick<Guest, "id" | "fullName">[] = guests.map((g) => ({
    id: g.id,
    fullName: g.fullName,
  }));

  const vehicleLookup: Vehicle[] = vehicles;

  return {
    vehicles: vehicleLookup,
    guests: guestLookup,
    vehicleRepository,
    guestRepository,
    tripRepository: createSupabaseTripRepository(client),
    taskRepository: createSupabaseTaskRepository(client),
    incidentRepository: createSupabaseIncidentRepository(client),
    messageRepository: createSupabaseMessageRepository(client),
    jobRunRepository: createSupabaseJobRunRepository(client),
    // Real Slack notifier — no-op when SLACK_WEBHOOK_URL is absent
    notifier: createEnvSlackNotifier(),
    // CSV trip import source — no-op when TRIP_IMPORT_CSV_PATH is absent
    tripImportSource: createEnvCsvTripImportSource(),
  };
}
