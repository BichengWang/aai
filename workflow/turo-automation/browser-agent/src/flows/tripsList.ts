import { listTripsFromPage } from '../browser.js';
import { classifyBrowserPage } from '../classify.js';
import { readBrowserAgentConfig } from '../config.js';
import { exists } from '../fs.js';
import { createResult } from '../results.js';
import { openBasePage } from '../runtime.js';
import type { TripListData } from '../types.js';

export async function runTripsList() {
  const config = readBrowserAgentConfig();
  const hasStateFile = await exists(config.storageStatePath);
  const tripsUrl = new URL('/us/en/host/trips', config.baseUrl).toString();

  const { browser, page, usingStorageState } = await openBasePage(config, tripsUrl);

  try {
    const snapshot = await listTripsFromPage(page);
    const pageKind = classifyBrowserPage(snapshot);
    const warnings: string[] = [];

    if (!hasStateFile) {
      warnings.push('No storage state found; trip listing will usually require an authenticated browser session.');
    }

    if (pageKind !== 'authenticated') {
      warnings.push('Trip list page did not classify as authenticated; extracted items may be incomplete or empty.');
    }

    return createResult<TripListData>('trips:list', {
      implemented: true,
      baseUrl: config.baseUrl,
      tripsUrl,
      storageStatePath: config.storageStatePath,
      hasStateFile,
      usingStorageState,
      pageKind,
      pageTitle: snapshot.title,
      finalUrl: snapshot.url,
      count: snapshot.trips.length,
      trips: snapshot.trips,
    }, warnings.length ? warnings : undefined);
  } finally {
    await browser.close();
  }
}
