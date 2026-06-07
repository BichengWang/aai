import { describe, expect, it } from "vitest";
import {
  getConfiguredSupabasePublishableKey,
  getConfiguredSupabaseUrl,
  getMissingConfigMessage,
  resolveAuthCallbackUrl,
} from "../lib/supabase";

describe("resolveAuthCallbackUrl", () => {
  it("rewrites a configured localhost callback to the current local origin", () => {
    const callbackUrl = resolveAuthCallbackUrl("http://localhost:3000/auth/callback", {
      origin: "http://localhost:5173",
      hostname: "localhost",
    });

    expect(callbackUrl.toString()).toBe("http://localhost:5173/auth/callback");
  });

  it("preserves next when the configured callback url is absolute", () => {
    const callbackUrl = resolveAuthCallbackUrl(
      "http://localhost:5173/auth/callback",
      {
        origin: "http://localhost:5173",
        hostname: "localhost",
      },
      "/account"
    );

    expect(callbackUrl.toString()).toBe("http://localhost:5173/auth/callback?next=%2Faccount");
  });

  it("rewrites a localhost callback to the current production origin", () => {
    const callbackUrl = resolveAuthCallbackUrl("http://localhost:3000/auth/callback", {
      origin: "https://altairworld.com",
      hostname: "altairworld.com",
    });

    expect(callbackUrl.toString()).toBe("https://altairworld.com/auth/callback");
  });

  it("rewrites a localhost callback to the current local origin when using 127.0.0.1", () => {
    const callbackUrl = resolveAuthCallbackUrl("http://localhost:3000/auth/callback", {
      origin: "http://127.0.0.1:5173",
      hostname: "127.0.0.1",
    });

    expect(callbackUrl.toString()).toBe("http://127.0.0.1:5173/auth/callback");
  });

  it("uses the current origin callback when no explicit env override is set", () => {
    const callbackUrl = resolveAuthCallbackUrl(undefined, {
      origin: "https://altairworld.com",
      hostname: "altairworld.com",
    });

    expect(callbackUrl.toString()).toBe("https://altairworld.com/auth/callback");
  });

  it("falls back to the app callback when configured url points to an invalid Supabase path", () => {
    const callbackUrl = resolveAuthCallbackUrl("https://project-ref.supabase.co/altairworld.com", {
      origin: "https://altairworld.com",
      hostname: "altairworld.com",
    });

    expect(callbackUrl.toString()).toBe("https://altairworld.com/auth/callback");
  });

  it("explains how to fix missing or placeholder Supabase values", () => {
    expect(getMissingConfigMessage()).toMatch(/replace the placeholder/i);
  });

  it("falls back to Next.js-style public Supabase env vars", () => {
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: "https://josejutfsgvlqrlmrqgl.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    };

    expect(getConfiguredSupabaseUrl(env)).toBe("https://josejutfsgvlqrlmrqgl.supabase.co");
    expect(getConfiguredSupabasePublishableKey(env)).toBe("sb_publishable_test_key");
  });

  it("uses Next.js-style public Supabase env vars when Vite values are placeholders", () => {
    const env = {
      VITE_SUPABASE_URL: "https://your-project-ref.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "your-publishable-key",
      NEXT_PUBLIC_SUPABASE_URL: "https://josejutfsgvlqrlmrqgl.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test_key",
    };

    expect(getConfiguredSupabaseUrl(env)).toBe("https://josejutfsgvlqrlmrqgl.supabase.co");
    expect(getConfiguredSupabasePublishableKey(env)).toBe("sb_publishable_test_key");
  });
});
