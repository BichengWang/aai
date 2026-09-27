import type { SupabaseClient } from "@supabase/supabase-js";
import type { Trip, TripEvent } from "../../domain/index.js";
import type { TripRepository } from "../../ports/index.js";

// ---------------------------------------------------------------------------
// Row types (snake_case columns → camelCase domain entities)
// ---------------------------------------------------------------------------
interface TripRow {
  id: string;
  external_trip_id: string;
  vehicle_id: string;
  guest_id: string;
  status: string;
  pickup_at: string;
  return_at: string;
  actual_return_at: string | null;
  pickup_location: string;
  return_location: string;
  trip_total_amount: number | null;
  delivery_required: boolean;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

interface TripEventRow {
  id: string;
  trip_id: string;
  event_type: string;
  event_time: string;
  source: string;
  payload: Record<string, string | number | boolean | null>;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Mappers
// ---------------------------------------------------------------------------
function rowToTrip(r: TripRow): Trip {
  return {
    id: r.id,
    externalTripId: r.external_trip_id,
    vehicleId: r.vehicle_id,
    guestId: r.guest_id,
    status: r.status as Trip["status"],
    pickupAt: r.pickup_at,
    returnAt: r.return_at,
    actualReturnAt: r.actual_return_at,
    pickupLocation: r.pickup_location,
    returnLocation: r.return_location,
    tripTotalAmount: r.trip_total_amount,
    deliveryRequired: r.delivery_required,
    source: r.source,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function tripToRow(t: Trip): Omit<TripRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: t.id,
    external_trip_id: t.externalTripId,
    vehicle_id: t.vehicleId,
    guest_id: t.guestId,
    status: t.status,
    pickup_at: t.pickupAt,
    return_at: t.returnAt,
    actual_return_at: t.actualReturnAt,
    pickup_location: t.pickupLocation,
    return_location: t.returnLocation,
    trip_total_amount: t.tripTotalAmount,
    delivery_required: t.deliveryRequired,
    source: t.source,
    notes: t.notes,
  };
}

function rowToTripEvent(r: TripEventRow): TripEvent {
  return {
    id: r.id,
    tripId: r.trip_id,
    eventType: r.event_type,
    eventTime: r.event_time,
    source: r.source,
    payload: r.payload,
    createdAt: r.created_at,
  };
}

function tripEventToRow(
  e: TripEvent
): Omit<TripEventRow, "created_at"> & { created_at?: string } {
  return {
    id: e.id,
    trip_id: e.tripId,
    event_type: e.eventType,
    event_time: e.eventTime,
    source: e.source,
    payload: e.payload,
  };
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------
export function createSupabaseTripRepository(
  client: SupabaseClient
): TripRepository {
  return {
    async listTrips() {
      const { data, error } = await client
        .from("trips")
        .select("*")
        .order("pickup_at", { ascending: false });
      if (error) throw new Error(`listTrips: ${error.message}`);
      return (data as TripRow[]).map(rowToTrip);
    },

    async getTripById(tripId) {
      const { data, error } = await client
        .from("trips")
        .select("*")
        .eq("id", tripId)
        .maybeSingle();
      if (error) throw new Error(`getTripById: ${error.message}`);
      return data ? rowToTrip(data as TripRow) : null;
    },

    async saveTrips(trips) {
      if (trips.length === 0) return [];
      const rows = trips.map(tripToRow);
      const { data, error } = await client
        .from("trips")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveTrips: ${error.message}`);
      return (data as TripRow[]).map(rowToTrip);
    },

    async listTripEvents() {
      const { data, error } = await client
        .from("trip_events")
        .select("*")
        .order("event_time", { ascending: false });
      if (error) throw new Error(`listTripEvents: ${error.message}`);
      return (data as TripEventRow[]).map(rowToTripEvent);
    },

    async saveTripEvents(events) {
      if (events.length === 0) return [];
      const rows = events.map(tripEventToRow);
      const { data, error } = await client
        .from("trip_events")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveTripEvents: ${error.message}`);
      return (data as TripEventRow[]).map(rowToTripEvent);
    },
  };
}
