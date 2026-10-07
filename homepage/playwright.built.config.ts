import { defineConfig } from "@playwright/test";

// End-to-end checks of the production build: prerendered pages, hydrated in
// the browser. `npm run test:e2e:built` builds first.
export default defineConfig({
  testDir: "./e2e/built",
  retries: 0,
  use: {
    baseURL: "http://127.0.0.1:4175",
    channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
    trace: "on-first-retry",
  },
  webServer: {
    command: "npx vite preview --host 127.0.0.1 --port 4175 --strictPort",
    url: "http://127.0.0.1:4175",
    reuseExistingServer: false,
  },
});
