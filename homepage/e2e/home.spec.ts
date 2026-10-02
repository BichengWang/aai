import { expect, test } from "@playwright/test";

test("homepage renders with auth entry points", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: /applied ai for the services people rely on/i })
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Register" }).first()).toBeVisible();
});

test("account route redirects guests to login", async ({ page }) => {
  await page.goto("/account");

  await expect(page).toHaveURL(/\/login\?next=%2Faccount$/);
  await expect(page.getByRole("heading", { name: /welcome back to altair/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(page.getByLabel("Email")).toHaveCount(0);
  await expect(page.getByLabel("Password")).toHaveCount(0);
});

test("workspace preview mode redirects guests into the workspace login", async ({ page }) => {
  await page.goto("/?app=workspace");

  await expect(page).toHaveURL(/\/login\?app=workspace$/);
  await expect(page.getByRole("heading", { name: /welcome back to altair/i })).toBeVisible();
  await expect(page.locator(".workspace-app-shell")).toBeHidden();
});

test("register route uses OAuth-only account creation", async ({ page }) => {
  await page.goto("/register");

  await expect(page.getByRole("heading", { name: /create your altair account/i })).toBeVisible();
  await expect(page.getByRole("button", { name: "Register with Google" })).toBeEnabled();
  await expect(page.getByLabel("Full name")).toHaveCount(0);
  await expect(page.getByLabel("Email")).toHaveCount(0);
  await expect(page.getByLabel("Password")).toHaveCount(0);
});

test("consent route asks the user to authenticate before authorization", async ({ page }) => {
  await page.goto("/oauth/consent?authorization_id=auth-123");

  await expect(
    page.getByRole("heading", { name: /sign in to review this authorization request/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeEnabled();
  await expect(page.getByText(/authenticate the user first, then collect consent/i)).toBeVisible();
});

test("homepage lab layout holds at 360px and links every service", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: /applied ai for the services people rely on/i })
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth
    )
  ).toBeLessThanOrEqual(0);
  await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();

  for (const slug of ["financial-planning", "legal-services", "local-car-rental", "pet-sitting"]) {
    await expect(page.locator(`.home-lab a[href$="/services/${slug}"]`)).toHaveCount(1);
  }

  await expect(page.getByRole("link", { name: "Visit website" })).toHaveAttribute(
    "href",
    "https://bichengwang.github.io/TradingAgents/"
  );
});

test("homepage dark chrome stays scoped to the homepage", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#0b0c10");
  await expect(page.locator("header.site-header")).toHaveClass(/site-header--home/);

  await page.getByRole("link", { name: "Open the review tool" }).click();
  await expect(page).toHaveURL(/\/review$/);

  await page.goto("/");
  await page.getByRole("link", { name: "Browse services" }).click();
  await expect(page).toHaveURL(/\/services$/);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#f5efe6");
  await expect(page.locator(".page--home")).toHaveCount(0);
  await expect(page.locator("header.site-header")).not.toHaveClass(/site-header--home/);
});

test("homepage motion respects reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const names = await page.evaluate(() =>
    [".lab-display", ".lab-halo-pulse", ".lab-con-line", ".lab-reveal"].map(
      (selector) => getComputedStyle(document.querySelector(selector)!).animationName
    )
  );
  expect(names).toEqual(["none", "none", "none", "none"]);
});
