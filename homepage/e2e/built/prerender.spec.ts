import { expect, test, type Page } from "@playwright/test";

// Runs against the production build (playwright.built.config.ts).

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

async function sitemapPaths(page: Page) {
  const response = await page.request.get("/sitemap.xml");
  expect(response.ok()).toBe(true);
  return [...(await response.text()).matchAll(/<loc>https?:\/\/[^/<]+(\/[^<]*)<\/loc>/g)].map(([, path]) => path);
}

test("every sitemap page arrives with its content and its own head", async ({ browser, page }) => {
  const paths = await sitemapPaths(page);
  expect(paths).toEqual(
    expect.arrayContaining(["/", "/services", "/services/legal-services", "/enquiry"])
  );

  const context = await browser.newContext({ javaScriptEnabled: false });
  const noScript = await context.newPage();
  const titles = new Set<string>();

  for (const path of paths) {
    await noScript.goto(path);
    await expect(noScript.locator("h1")).toBeVisible();
    await expect(noScript.locator("main")).not.toBeEmpty();
    const canonical = new URL((await noScript.locator('link[rel="canonical"]').getAttribute("href")) ?? "");
    expect(canonical.protocol).toBe("https:");
    expect(canonical.pathname).toBe(path);
    await expect(noScript.locator('meta[property="og:image"]')).toHaveAttribute("content", /\/og-image\.png$/);
    titles.add(await noScript.title());
  }

  expect(titles.size).toBe(paths.length);
  await noScript.goto("/services/legal-services");
  await expect(noScript).toHaveTitle("Legal Services Discovery | Altair");
  await expect(noScript.locator('meta[name="description"]')).toHaveAttribute(
    "content",
    /connect you with vetted attorneys/
  );
  await context.close();
});

test("prerendered pages hydrate without errors and navigate in the browser", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/");
  await expect(page.locator("#root")).toHaveAttribute("data-prerendered", "/");
  await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible();
  await page.evaluate(() => ((window as Window & { marker?: boolean }).marker = true));

  await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page).toHaveTitle("Services | Altair");
  await expect(page.getByRole("heading", { level: 1, name: "Find the right local service" })).toBeVisible();
  // Same document: the router handled the click, no full page load.
  expect(await page.evaluate(() => (window as Window & { marker?: boolean }).marker)).toBe(true);

  await page.goto("/enquiry");
  await page.getByLabel("Name").fill("Ada");
  await expect(page.getByLabel("Name")).toHaveValue("Ada");

  expect(errors).toEqual([]);
});

test("workspace URLs replace the prerendered marketing page", async ({ page }) => {
  const errors = collectErrors(page);

  await page.goto("/?app=workspace");

  await expect(page).toHaveURL(/\/login\?app=workspace$/);
  await expect(page.getByRole("heading", { name: /welcome back to altair/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /applied ai for the services/i })).toHaveCount(0);
  await expect(page.locator("html")).not.toHaveAttribute("data-app", "workspace");
  expect(errors).toEqual([]);
});

test("paths without a page still render the app", async ({ page }) => {
  await page.goto("/no-such-page");
  await expect(page.getByRole("heading", { name: "This page is not on the chart." })).toBeVisible();
  await expect(page).toHaveTitle("Page not found | Altair");

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /welcome back to altair/i })).toBeVisible();
});
