import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Build a Supabase client from environment variables.
 *
 * Expected env vars:
 *   SUPABASE_URL  – project URL, e.g. https://<project>.supabase.co
 *   SUPABASE_KEY  – service-role or anon key
 *
 * Throws at call time (not import time) when either variable is absent,
 * so fixture-only builds still compile and run without real credentials.
 */
export function createSupabaseClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_KEY"];
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_KEY must be set to use Supabase adapters"
    );
  }
  return createClient(url, key);
}
