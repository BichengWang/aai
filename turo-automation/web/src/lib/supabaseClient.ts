import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface WebSupabaseConfig {
  url: string;
  key: string;
}

function readWebEnv(name: string): string | null {
  return (
    (import.meta as unknown as { env: Record<string, string> }).env[name]?.trim() || null
  );
}

export function readWebSupabaseConfig(): WebSupabaseConfig | null {
  const url = readWebEnv("VITE_SUPABASE_URL");
  const key = readWebEnv("VITE_SUPABASE_KEY");

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function createWebSupabaseClient(): SupabaseClient | null {
  const config = readWebSupabaseConfig();
  if (!config) {
    return null;
  }

  return createClient(config.url, config.key);
}

export function hasWebSupabaseConfig(): boolean {
  return readWebSupabaseConfig() !== null;
}
