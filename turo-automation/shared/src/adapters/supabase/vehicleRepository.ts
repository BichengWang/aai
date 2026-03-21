import type { SupabaseClient } from "@supabase/supabase-js";
import type { Vehicle } from "../../domain/index.js";
import type { VehicleRepository } from "../../ports/index.js";

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

function rowToVehicle(r: VehicleRow): Vehicle {
  return {
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
  };
}

function vehicleToRow(
  v: Vehicle
): Omit<VehicleRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: v.id,
    vin: v.vin,
    plate: v.plate,
    nickname: v.nickname,
    make: v.make,
    model: v.model,
    year: v.year,
    status: v.status,
    location: v.location,
    odometer: v.odometer,
    fuel_type: v.fuelType,
    notes: v.notes,
  };
}

export function createSupabaseVehicleRepository(
  client: SupabaseClient
): VehicleRepository {
  return {
    async listVehicles() {
      const { data, error } = await client
        .from("vehicles")
        .select("*")
        .order("nickname", { ascending: true });
      if (error) throw new Error(`listVehicles: ${error.message}`);
      return (data as VehicleRow[]).map(rowToVehicle);
    },

    async saveVehicles(vehicles) {
      if (vehicles.length === 0) return [];
      const rows = vehicles.map(vehicleToRow);
      const { data, error } = await client
        .from("vehicles")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveVehicles: ${error.message}`);
      return (data as VehicleRow[]).map(rowToVehicle);
    },
  };
}
