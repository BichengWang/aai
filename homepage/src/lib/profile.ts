import type { User } from "@supabase/supabase-js";
import { loadSupabase } from "./supabase";
import type { AppUserProfile, Database } from "../types/auth";

function resolveAuthProvider(user: User) {
  return user.app_metadata?.provider ?? user.identities?.[0]?.provider ?? null;
}

export function deriveProfileFromUser(user: User): AppUserProfile {
  return {
    user_id: user.id,
    email: user.email ?? null,
    full_name:
      (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name) ||
      (typeof user.user_metadata?.name === "string" && user.user_metadata.name) ||
      null,
    avatar_url: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null,
    auth_provider: resolveAuthProvider(user),
    created_at: user.created_at,
    updated_at: user.updated_at ?? user.created_at,
  };
}

export async function fetchProfile(userId: string): Promise<AppUserProfile | null> {
  const supabase = await loadSupabase();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data as AppUserProfile | null;
}

export async function upsertProfileFromUser(user: User): Promise<AppUserProfile | null> {
  const supabase = await loadSupabase();

  if (!supabase) {
    return deriveProfileFromUser(user);
  }

  const profile = deriveProfileFromUser(user);
  const payload: Database["public"]["Tables"]["profiles"]["Insert"] = {
    user_id: profile.user_id,
    email: profile.email,
    full_name: profile.full_name,
    avatar_url: profile.avatar_url,
    auth_provider: profile.auth_provider,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "user_id" })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data as AppUserProfile | null;
}

export async function loadProfileForUser(user: User): Promise<AppUserProfile> {
  try {
    const upsertedProfile = await upsertProfileFromUser(user);
    if (upsertedProfile) {
      return upsertedProfile;
    }
    const storedProfile = await fetchProfile(user.id);
    return storedProfile ?? deriveProfileFromUser(user);
  } catch {
    const storedProfile = await fetchProfile(user.id);
    return storedProfile ?? deriveProfileFromUser(user);
  }
}
