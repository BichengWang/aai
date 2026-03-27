import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface WebSupabaseConfig {
  url: string;
  key: string;
}

function readWebEnvFromRecord(
  env: Record<string, string | undefined>,
  name: string
): string | null {
  return env[name]?.trim() || null;
}

export function readWebSupabaseConfigFromEnv(
  env: Record<string, string | undefined>
): WebSupabaseConfig | null {
  const url = readWebEnvFromRecord(env, "VITE_SUPABASE_URL");
  const key = readWebEnvFromRecord(env, "VITE_SUPABASE_KEY");

  if (!url || !key) {
    return null;
  }

  return { url, key };
}

export function hasWebSupabaseConfigFromEnv(
  env: Record<string, string | undefined>
): boolean {
  return readWebSupabaseConfigFromEnv(env) !== null;
}

export function readWebSupabaseConfig(): WebSupabaseConfig | null {
  return readWebSupabaseConfigFromEnv(
    (import.meta as unknown as { env: Record<string, string | undefined> }).env
  );
}

export function createWebSupabaseClientFromEnv(
  env: Record<string, string | undefined>
): SupabaseClient | null {
  const config = readWebSupabaseConfigFromEnv(env);
  if (!config) {
    return null;
  }

  return createClient(config.url, config.key);
}

export function createWebSupabaseClient(): SupabaseClient | null {
  return createWebSupabaseClientFromEnv(
    (import.meta as unknown as { env: Record<string, string | undefined> }).env
  );
}

export function hasWebSupabaseConfig(): boolean {
  return readWebSupabaseConfig() !== null;
}
