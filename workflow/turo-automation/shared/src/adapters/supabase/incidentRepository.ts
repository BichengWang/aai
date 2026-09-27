import type { SupabaseClient } from "@supabase/supabase-js";
import type { Incident } from "../../domain/index.js";
import type { IncidentRepository } from "../../ports/index.js";

interface IncidentRow {
  id: string;
  trip_id: string | null;
  vehicle_id: string | null;
  type: string;
  severity: string;
  status: string;
  summary: string;
  details: string | null;
  owner_id: string | null;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToIncident(r: IncidentRow): Incident {
  return {
    id: r.id,
    tripId: r.trip_id,
    vehicleId: r.vehicle_id,
    type: r.type as Incident["type"],
    severity: r.severity as Incident["severity"],
    status: r.status as Incident["status"],
    summary: r.summary,
    details: r.details,
    ownerId: r.owner_id,
    openedAt: r.opened_at,
    resolvedAt: r.resolved_at,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function incidentToRow(
  i: Incident
): Omit<IncidentRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: i.id,
    trip_id: i.tripId,
    vehicle_id: i.vehicleId,
    type: i.type,
    severity: i.severity,
    status: i.status,
    summary: i.summary,
    details: i.details,
    owner_id: i.ownerId,
    opened_at: i.openedAt,
    resolved_at: i.resolvedAt,
  };
}

export function createSupabaseIncidentRepository(
  client: SupabaseClient
): IncidentRepository {
  return {
    async listIncidents() {
      const { data, error } = await client
        .from("incidents")
        .select("*")
        .order("opened_at", { ascending: false });
      if (error) throw new Error(`listIncidents: ${error.message}`);
      return (data as IncidentRow[]).map(rowToIncident);
    },

    async saveIncidents(incidents) {
      if (incidents.length === 0) return [];
      const rows = incidents.map(incidentToRow);
      const { data, error } = await client
        .from("incidents")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveIncidents: ${error.message}`);
      return (data as IncidentRow[]).map(rowToIncident);
    },
  };
}
