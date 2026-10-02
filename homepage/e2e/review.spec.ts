import { expect, test } from "@playwright/test";

test("legacy /review URL moves into the workspace and asks guests to sign in", async ({ page }) => {
  await page.goto("/review");

  await expect(page).toHaveURL(/\/login\?app=workspace&next=%2Freview%3Fapp%3Dworkspace$/);
  await expect(page.getByRole("heading", { name: /welcome back to altair/i })).toBeVisible();
});

test("homepage top bar links to the workspace instead of a standalone review page", async ({ page }) => {
  await page.goto("/");

  const nav = page.getByRole("navigation", { name: "Primary" });
  await expect(nav.getByRole("link", { name: "Workspace" })).toHaveAttribute("href", "/?app=workspace");
  await expect(nav.getByRole("link", { name: "Review" })).toHaveCount(0);

  await page.getByRole("link", { name: "Open the review tool" }).click();
  await expect(page).toHaveURL(/\/login\?app=workspace&next=%2Freview%3Fapp%3Dworkspace$/);
});
