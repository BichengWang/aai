import type { Page } from 'playwright';

export async function snapshotPage(page: Page) {
  const title = await page.title();
  const url = page.url();
  const bodyText = await page.locator('body').innerText().catch(() => '');
  return { title, url, bodyText };
}
