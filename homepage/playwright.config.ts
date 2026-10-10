import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  // e2e/built runs against the production build: playwright.built.config.ts
  testIgnore: "built/**",
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4174",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "on-first-retry",
  },
  webServer: {
    command:
      "RESEND_API_KEY= ENQUIRY_FROM_EMAIL= VITE_LLM_API_KEY=playwright-test-key VITE_LLM_MODEL=gpt-5.4 VITE_SUPABASE_URL=https://example.com VITE_SUPABASE_PUBLISHABLE_KEY=playwright-publishable-key VITE_WORKSPACE_ORIGIN=https://llm.altairworld.com npm run dev -- --host 127.0.0.1 --port 4174",
    url: "http://127.0.0.1:4174",
    reuseExistingServer: false,
  },
});
