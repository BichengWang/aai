import { expect, test } from "@playwright/test";

test("a signed-in handoff opens Keys on the workspace origin", async ({ page, baseURL }) => {
  const marketingOrigin = "https://altairworld.com";
  const workspaceOrigin = "https://llm.altairworld.com";
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const user = {
    id: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    email: "member@example.test",
    app_metadata: { provider: "google" },
    user_metadata: { full_name: "Workspace member" },
    created_at: "2026-01-01T00:00:00.000Z",
  };
  const accessToken = [
    { alg: "HS256", typ: "JWT" },
    { sub: user.id, aud: user.aud, role: "authenticated", exp: expiresAt },
  ].map((value) => Buffer.from(JSON.stringify(value)).toString("base64url")).join(".") + ".test-signature";
  const session = {
    access_token: accessToken,
    refresh_token: "e2e-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: expiresAt,
    user,
  };
  const keys = {
    credentials: [{
      id: "e2e-credential",
      user_id: user.id,
      provider: "openai",
      label: "Workspace test key",
      secret_mask: "masked-test-key",
      status: "valid",
      validation_error: null,
      last_validated_at: user.created_at,
      monthly_token_cap: 250000,
      created_at: user.created_at,
      updated_at: user.created_at,
    }],
    managedKey: null,
    usageSummary: [],
  };
  const calls: Array<{ path: string; origin: string | undefined; authorization: string | undefined; body: unknown }> = [];

  // Serve both browser origins from the development server without contacting the hosted sites.
  await page.routeWebSocket(/^wss:\/\/(?:altairworld\.com|llm\.altairworld\.com)\//, () => {});
  await page.route(/^https:\/\/(?:altairworld\.com|llm\.altairworld\.com)\//, async (route) => {
    const url = new URL(route.request().url());
    const response = await route.fetch({ url: `${baseURL}${url.pathname}${url.search}` });
    await route.fulfill({ response });
  });
  await page.route(/^https:\/\/example\.com\//, async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const headers = {
      "Access-Control-Allow-Origin": request.headers().origin ?? marketingOrigin,
      "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    };
    if (request.method() === "OPTIONS") {
      await route.fulfill({ status: 204, headers });
      return;
    }
    if (url.pathname === "/auth/v1/user") {
      await route.fulfill({ json: user, headers });
      return;
    }
    if (url.pathname === "/rest/v1/profiles") {
      await route.fulfill({ json: {
        user_id: user.id, email: user.email, full_name: user.user_metadata.full_name,
        avatar_url: null, auth_provider: "google", created_at: user.created_at, updated_at: user.created_at,
      }, headers });
      return;
    }
    const path = url.pathname.replace("/functions/v1/workspace-api", "");
    calls.push({ path, origin: request.headers().origin, authorization: request.headers().authorization, body: request.postDataJSON() });
    if (path === "/sso-handoff/create") {
      await route.fulfill({ json: { token: "e2e-handoff" }, headers });
    } else if (path === "/sso-handoff/consume") {
      await route.fulfill({ json: {
        accessToken, refreshToken: session.refresh_token, expiresAt: new Date(expiresAt * 1000).toISOString(),
      }, headers });
    } else if (path === "/credentials/list" || path === "/managed-key/bootstrap") {
      await route.fulfill({ json: keys, headers });
    } else if (path === "/conversations") {
      await route.fulfill({ json: { conversations: [] }, headers });
    } else {
      throw new Error(`Unexpected Supabase request: ${request.method()} ${url.pathname}`);
    }
  });
  await page.addInitScript(({ marketingOrigin, session }) => {
    if (window.location.origin === marketingOrigin) {
      window.localStorage.setItem("sb-example-auth-token", JSON.stringify(session));
    }
  }, { marketingOrigin, session });

  await page.goto(`${marketingOrigin}/account`);
  await expect(page.getByRole("heading", { name: "Your Altair profile" })).toBeVisible();
  const consumed = page.waitForResponse((response) => response.url().endsWith("/sso-handoff/consume"));
  await page.getByRole("button", { name: "Open LLM workspace" }).first().click();
  expect((await consumed).ok()).toBe(true);
  expect(new URL(page.url()).origin).toBe(workspaceOrigin);
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("sb-example-auth-token") ?? "null")?.access_token)).toBe(accessToken);
  await page.goto(`${workspaceOrigin}/keys`);
  await expect(page).toHaveURL(`${workspaceOrigin}/keys`);
  await expect(page.getByRole("heading", { name: "Provider credentials", exact: true })).toBeVisible();
  await expect(page.getByText("Workspace test key", { exact: true })).toBeVisible();
  await expect(page.getByText("openai • masked-test-key")).toBeVisible();

  expect(calls.filter((call) => call.path === "/sso-handoff/create")).toEqual([
    { path: "/sso-handoff/create", origin: marketingOrigin, authorization: `Bearer ${accessToken}`,
      body: { accessToken, refreshToken: session.refresh_token } },
  ]);
  const consumes = calls.filter((call) => call.path === "/sso-handoff/consume");
  expect(consumes.length).toBeGreaterThan(0);
  for (const call of consumes) {
    expect(call).toEqual({ path: "/sso-handoff/consume", origin: workspaceOrigin,
      authorization: undefined, body: { token: "e2e-handoff" } });
  }
  expect(calls.findIndex((call) => call.path === "/sso-handoff/create")).toBeLessThan(calls.findIndex((call) => call.path === "/sso-handoff/consume"));
  expect(calls.find((call) => call.path === "/managed-key/bootstrap" && call.origin === workspaceOrigin)?.authorization).toBe(`Bearer ${accessToken}`);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("sb-example-auth-token") ?? "null")?.user.id)).toBe(user.id);
});
