import test from "node:test";
import assert from "node:assert/strict";
import {
  createWebSupabaseClientFromEnv,
  hasWebSupabaseConfigFromEnv,
  readWebSupabaseConfigFromEnv,
} from "../src/lib/supabaseClient.ts";

test("readWebSupabaseConfigFromEnv trims values and requires both fields", () => {
  assert.deepEqual(
    readWebSupabaseConfigFromEnv({
      VITE_SUPABASE_URL: " https://example.supabase.co ",
      VITE_SUPABASE_KEY: " anon-key ",
    }),
    {
      url: "https://example.supabase.co",
      key: "anon-key",
    }
  );
  assert.equal(readWebSupabaseConfigFromEnv({ VITE_SUPABASE_URL: "https://x" }), null);
  assert.equal(readWebSupabaseConfigFromEnv({ VITE_SUPABASE_KEY: "anon" }), null);
});

test("hasWebSupabaseConfigFromEnv reflects the same gating as the reader", () => {
  assert.equal(
    hasWebSupabaseConfigFromEnv({
      VITE_SUPABASE_URL: "https://example.supabase.co",
      VITE_SUPABASE_KEY: "anon-key",
    }),
    true
  );
  assert.equal(hasWebSupabaseConfigFromEnv({}), false);
});

test("createWebSupabaseClientFromEnv returns a client only when config is present", () => {
  assert.equal(createWebSupabaseClientFromEnv({}), null);

  const client = createWebSupabaseClientFromEnv({
    VITE_SUPABASE_URL: "https://example.supabase.co",
    VITE_SUPABASE_KEY: "anon-key",
  });

  assert.ok(client);
  assert.equal(typeof client.from, "function");
});
