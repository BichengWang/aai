import type { SupabaseClient } from "@supabase/supabase-js";
import type { Guest } from "../../domain/index.js";
import type { GuestRepository } from "../../ports/index.js";

interface GuestRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string;
  phone: string | null;
  email: string | null;
  driver_license_last4: string | null;
  rating: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function rowToGuest(r: GuestRow): Guest {
  return {
    id: r.id,
    firstName: r.first_name ?? "",
    lastName: r.last_name ?? "",
    fullName: r.full_name,
    phone: r.phone,
    email: r.email,
    driverLicenseLast4: r.driver_license_last4,
    rating: r.rating,
    notes: r.notes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function guestToRow(
  g: Guest
): Omit<GuestRow, "created_at" | "updated_at"> & {
  created_at?: string;
  updated_at?: string;
} {
  return {
    id: g.id,
    first_name: g.firstName,
    last_name: g.lastName,
    full_name: g.fullName,
    phone: g.phone,
    email: g.email,
    driver_license_last4: g.driverLicenseLast4,
    rating: g.rating,
    notes: g.notes,
  };
}

export function createSupabaseGuestRepository(
  client: SupabaseClient
): GuestRepository {
  return {
    async listGuests() {
      const { data, error } = await client
        .from("guests")
        .select("*")
        .order("full_name", { ascending: true });
      if (error) throw new Error(`listGuests: ${error.message}`);
      return (data as GuestRow[]).map(rowToGuest);
    },

    async saveGuests(guests) {
      if (guests.length === 0) return [];
      const rows = guests.map(guestToRow);
      const { data, error } = await client
        .from("guests")
        .upsert(rows, { onConflict: "id" })
        .select();
      if (error) throw new Error(`saveGuests: ${error.message}`);
      return (data as GuestRow[]).map(rowToGuest);
    },
  };
}
