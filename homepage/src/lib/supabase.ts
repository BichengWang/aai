import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/auth";
import { appendNextSearchParam, buildAppPath } from "./runtime";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function isValidUrl(value: string | undefined) {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function isLikelyInvalidSupabasePath(url: URL) {
  const isSupabaseHost = /(^|\.)supabase\.co$/i.test(url.hostname);
  const leadingPathSegment = url.pathname.replace(/^\/+/, "").split("/")[0];
  const looksLikeDomainSegment = /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(leadingPathSegment);

  return isSupabaseHost && looksLikeDomainSegment;
}

function isPlaceholderSupabaseUrl(value: string | undefined) {
  if (!isValidUrl(value)) {
    return false;
  }

  const url = new URL(value!);
  return url.hostname === "your-project-ref.supabase.co";
}

function isPlaceholderPublishableKey(value: string | undefined) {
  if (!value) {
    return false;
  }

  return value.trim() === "your-publishable-key";
}

type SupabasePublicEnv = Pick<
  ImportMetaEnv,
  | "VITE_SUPABASE_URL"
  | "VITE_SUPABASE_PUBLISHABLE_KEY"
  | "NEXT_PUBLIC_SUPABASE_URL"
  | "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
>;

export function getConfiguredSupabaseUrl(env: SupabasePublicEnv = import.meta.env) {
  const viteUrl = env.VITE_SUPABASE_URL?.trim();

  if (viteUrl && !isPlaceholderSupabaseUrl(viteUrl)) {
    return viteUrl;
  }

  return env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

export function getConfiguredSupabasePublishableKey(env: SupabasePublicEnv = import.meta.env) {
  const viteKey = env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (viteKey && !isPlaceholderPublishableKey(viteKey)) {
    return viteKey;
  }

  return env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
}

const supabaseUrl = getConfiguredSupabaseUrl();
const supabasePublishableKey = getConfiguredSupabasePublishableKey();
const hasValidSupabaseConfig =
  isValidUrl(supabaseUrl) &&
  !isPlaceholderSupabaseUrl(supabaseUrl) &&
  Boolean(supabasePublishableKey?.trim()) &&
  !isPlaceholderPublishableKey(supabasePublishableKey);

export const supabase = hasValidSupabaseConfig
  ? createClient<Database>(supabaseUrl!, supabasePublishableKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;
export const isSupabaseConfigured = Boolean(supabase);

export function getMissingConfigMessage() {
  return "Supabase authentication is not configured. Replace the placeholder VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY values, or provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.";
}

export function getGoogleRedirectUrl(nextPath?: string) {
  return getAuthCallbackUrl(nextPath).toString();
}

export function getAuthCallbackUrl(nextPath?: string) {
  const configuredRedirectUrl = import.meta.env.VITE_AUTH_CALLBACK_URL?.trim();
  return resolveAuthCallbackUrl(configuredRedirectUrl, window.location, nextPath);
}

export function resolveAuthCallbackUrl(
  configuredRedirectUrl: string | undefined,
  locationLike: Pick<Location, "origin" | "hostname">,
  nextPath?: string
) {
  const fallbackCallback = appendNextSearchParam(
    buildAppPath("/auth/callback", { locationLike }),
    nextPath
  );

  if (configuredRedirectUrl) {
    const configuredUrl = new URL(configuredRedirectUrl);

    if (nextPath) {
      const safeNextPath = appendNextSearchParam(configuredUrl.pathname + configuredUrl.search + configuredUrl.hash, nextPath);
      const nextUrl = new URL(safeNextPath, configuredUrl.origin);
      configuredUrl.search = nextUrl.search;
      configuredUrl.hash = nextUrl.hash;
    }

    if (isLikelyInvalidSupabasePath(configuredUrl)) {
      return new URL(fallbackCallback, locationLike.origin);
    }

    if (
      LOCAL_HOSTS.has(locationLike.hostname) &&
      LOCAL_HOSTS.has(configuredUrl.hostname) &&
      configuredUrl.origin !== locationLike.origin
    ) {
      return new URL(configuredUrl.pathname + configuredUrl.search + configuredUrl.hash, locationLike.origin);
    }

    if (!LOCAL_HOSTS.has(locationLike.hostname) && LOCAL_HOSTS.has(configuredUrl.hostname)) {
      return new URL(configuredUrl.pathname + configuredUrl.search + configuredUrl.hash, locationLike.origin);
    }

    return configuredUrl;
  }

  return new URL(fallbackCallback, locationLike.origin);
}

export function getAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (typeof error === "string" && error.trim()) {
    return error;
  }

  return "Something went wrong while communicating with Supabase. Please try again.";
}
