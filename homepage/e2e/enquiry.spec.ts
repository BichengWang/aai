import { expect, test, type Page } from "@playwright/test";
import { createEnquiryHandler } from "../server/enquiry.mjs";

const env = { RESEND_API_KEY: "server-test-key", ENQUIRY_FROM_EMAIL: "Altair <enquiries@example.com>" };
type OutgoingEmail = { from: string; to: string[]; reply_to: string; subject: string; text: string };

async function routeToHandler(page: Page, fetchEmail: typeof fetch) {
  const handler = createEnquiryHandler({ env, fetchEmail });
  await page.route("**/api/enquiry", async (route) => {
    const incoming = route.request();
    const response = await handler(new Request(incoming.url(), {
      method: incoming.method(), headers: incoming.headers(), body: incoming.postData(),
    }));
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
}

for (const path of ["/", "/enquiry"]) {
  test(`${path} submits the complete form through the email handler`, async ({ page }) => {
    let outgoing: OutgoingEmail | undefined;
    let idempotencyKey = "";
    let sends = 0;
    let release: () => void = () => {};
    const providerResponse = new Promise<void>((resolve) => { release = resolve; });
    await routeToHandler(page, async (url, init) => {
      expect(url).toBe("https://api.resend.com/emails");
      expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer server-test-key");
      expect(new Headers(init?.headers).get("User-Agent")).toBe("altair-enquiry/1.0");
      idempotencyKey = new Headers(init?.headers).get("Idempotency-Key")!;
      outgoing = JSON.parse(init?.body as string);
      sends++;
      await providerResponse;
      return Response.json({ id: "email-test-id" });
    });
    await page.goto(path);
    const form = page.locator(path === "/" ? "#contact form" : "main form");
    await form.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
    await form.getByLabel("Email", { exact: true }).fill("ada@example.com");
    if (path === "/enquiry") {
      await form.getByLabel("Tell us what you need").selectOption("other");
      await form.getByLabel("Service needed").selectOption("pet-sitting");
      await form.getByLabel("Timeline").selectOption("week");
    }
    await form.locator("textarea").fill("Please help me find a local provider.\nI am available next week.");
    await form.getByRole("button").click();
    await expect(form.getByRole("button", { name: "Sending..." })).toBeDisabled();
    await expect(form.getByRole("status")).toHaveCount(0);
    await expect.poll(() => sends).toBe(1);
    release();
    await expect(form.getByRole("status")).toContainText("has been sent to the Altair team");
    await expect(form.getByRole("button")).toBeDisabled();
    expect(sends).toBe(1);
    expect(outgoing?.to).toEqual(["qx@altairworld.com"]);
    expect(outgoing?.from).toBe(env.ENQUIRY_FROM_EMAIL);
    expect(outgoing?.reply_to).toBe("ada@example.com");
    expect(outgoing?.text).toContain("Name: Ada Lovelace");
    expect(outgoing?.text).toContain("I am available next week.");
    expect(idempotencyKey).toMatch(/^altair-enquiry\/[0-9a-f-]{36}$/);
    if (path === "/enquiry") {
      expect(outgoing?.text).not.toContain("Postcode:");
      expect(outgoing?.text).toContain("Service: pet-sitting");
      expect(outgoing?.text).toContain("Timeline: week");
    }
  });
}

test("an enquiry can be sent with only name and email using the default choices", async ({ page }) => {
  let outgoing: OutgoingEmail | undefined;
  await routeToHandler(page, async (_url, init) => {
    outgoing = JSON.parse(init?.body as string);
    return Response.json({ id: "default-enquiry-id" });
  });
  await page.goto("/enquiry");
  const form = page.locator("main form");
  await expect(form.getByLabel("Postcode")).toHaveCount(0);
  await expect(form.locator("textarea")).toHaveCount(0);
  await expect(form.getByLabel("Service needed")).toHaveValue("financial-planning");
  await expect(form.getByLabel("Timeline")).toHaveValue("24-hours");
  await expect(form.getByLabel("Tell us what you need")).toHaveValue("Please help me find a local provider.");
  await form.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
  await form.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await form.getByRole("button", { name: "Submit enquiry" }).click();
  await expect(form.getByRole("status")).toContainText("has been sent to the Altair team");
  expect(outgoing?.text).toContain("Please help me find a local provider.");
  expect(outgoing?.text).toContain("Service: financial-planning");
  expect(outgoing?.text).toContain("Timeline: 24-hours");
  expect(outgoing?.text).not.toContain("Postcode:");
});

test("failed delivery preserves the form and reuses the retry key; edits get a new key", async ({ page }) => {
  const keys: string[] = [];
  await routeToHandler(page, async (_url, init) => {
    keys.push(new Headers(init?.headers).get("Idempotency-Key")!);
    return keys.length < 3 ? Response.json({ message: "Private provider error" }, { status: 500 }) : Response.json({ id: "retry-id" });
  });
  await page.goto("/enquiry");
  const form = page.locator("main form");
  await form.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
  await form.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await form.getByLabel("Service needed").selectOption("other");
  await form.getByLabel("Timeline").selectOption("other");
  await form.getByLabel("Tell us what you need").selectOption("other");
  await form.getByLabel("Your message").fill("Please help.");
  const submit = form.getByRole("button", { name: "Submit enquiry" });
  await submit.click();
  await expect(form.getByRole("alert")).toContainText("couldn't send");
  await expect(form.getByRole("status")).toHaveCount(0);
  await expect(form.getByLabel("Your message")).toHaveValue("Please help.");
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect.poll(() => keys.length).toBe(2);
  await expect(submit).toBeEnabled();
  expect(keys[1]).toBe(keys[0]);
  await form.getByLabel("Your message").fill("Updated request.");
  await submit.click();
  await expect(form.getByRole("status")).toBeVisible();
  await expect(form.getByRole("alert")).toHaveCount(0);
  expect(keys[2]).not.toBe(keys[0]);
});

test("/contact redirects to the single intake form", async ({ page }) => {
  await page.goto("/contact");
  await expect(page).toHaveURL(/\/enquiry$/);
  await expect(page.getByLabel("Tell us what you need")).toBeVisible();
  await expect(page.getByLabel("Postcode")).toHaveCount(0);
});

test("homepage enquiry link opens the service enquiry form", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /Start an enquiry/ }).click();
  await expect(page).toHaveURL(/\/enquiry$/);
  await expect(page.getByLabel("Email", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Tell us what you need")).toBeVisible();
});

test("unconfigured delivery reports an error through the local server", async ({ page }) => {
  await page.goto("/enquiry");
  const form = page.locator("main form");
  await form.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
  await form.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await form.getByRole("button", { name: "Submit enquiry" }).click();
  await expect(form.getByRole("alert")).toContainText("temporarily unavailable");
  await expect(form.getByRole("status")).toHaveCount(0);
  await expect(form.getByRole("button", { name: "Submit enquiry" })).toBeEnabled();
});

test("rate limited and non-JSON responses never show success", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/enquiry", (route) => route.fulfill({
    status: ++attempts === 1 ? 429 : 200, contentType: "text/html", body: "<html>Unavailable</html>",
  }));
  await page.goto("/enquiry");
  const form = page.locator("main form");
  await form.getByLabel("Name", { exact: true }).fill("Ada Lovelace");
  await form.getByLabel("Email", { exact: true }).fill("ada@example.com");
  await form.getByRole("button").click();
  await expect(form.getByRole("alert")).toContainText("wait a minute");
  await form.getByRole("button").click();
  await expect(form.getByRole("alert")).toContainText("couldn't send");
  await expect(form.getByRole("status")).toHaveCount(0);
});
