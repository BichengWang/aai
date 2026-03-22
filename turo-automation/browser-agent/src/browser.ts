import type { Page } from 'playwright';
import type { TripListItem } from './types.js';

export async function snapshotPage(page: Page) {
  const title = await page.title();
  const url = page.url();
  const bodyText = await page.locator('body').innerText().catch(() => '');
  return { title, url, bodyText };
}

export function extractTripsFromHtml(html: string, pageUrl: string): TripListItem[] {
  const trips = new Map<string, TripListItem>();
  const anchorPattern = /<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorPattern)) {
    const hrefValue = match[1];

    if (!hrefValue) {
      continue;
    }

    const href = new URL(hrefValue, pageUrl).toString();
    const idMatch = href.match(/\/trips\/([^/?#]+)/i);

    if (!idMatch) {
      continue;
    }

    const label = match[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const id = idMatch[1];

    if (!trips.has(id)) {
      trips.set(id, {
        id,
        href,
        label: label || `Trip ${id}`,
      });
    }
  }

  return [...trips.values()];
}

export async function listTripsFromPage(page: Page) {
  const snapshot = await snapshotPage(page);
  const html = await page.content();
  return {
    ...snapshot,
    trips: extractTripsFromHtml(html, snapshot.url),
  };
}
