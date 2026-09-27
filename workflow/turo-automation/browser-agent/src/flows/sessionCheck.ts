import { snapshotPage } from '../browser.js';
import { classifyBrowserPage, type BrowserPageKind } from '../classify.js';
import { readBrowserAgentConfig } from '../config.js';
import { exists } from '../fs.js';
import { createResult } from '../results.js';
import { openBasePage } from '../runtime.js';
import type { SessionCheckData } from '../types.js';

export function classifySessionStatus(hasStateFile: boolean, pageKind?: BrowserPageKind) {
  if (!hasStateFile) {
    return 'missing_state' as const;
  }

  if (pageKind === 'authenticated') {
    return 'authenticated' as const;
  }

  if (pageKind === 'unauthenticated') {
    return 'stale_state' as const;
  }

  return 'unknown' as const;
}

export async function runSessionCheck(
  inspectSession: () => Promise<{ pageKind: BrowserPageKind; pageTitle: string; finalUrl: string; usingStorageState: boolean }> = async () => {
    const config = readBrowserAgentConfig();
    const { browser, page, usingStorageState } = await openBasePage(config);

    try {
      const snapshot = await snapshotPage(page);
      return {
        pageKind: classifyBrowserPage(snapshot),
        pageTitle: snapshot.title,
        finalUrl: snapshot.url,
        usingStorageState,
      };
    } finally {
      await browser.close();
    }
  },
) {
  const config = readBrowserAgentConfig();
  const stateFileExists = await exists(config.storageStatePath);

  if (!stateFileExists) {
    return createResult<SessionCheckData>('session:check', {
      implemented: true,
      stateFileExists,
      usingStorageState: false,
      status: classifySessionStatus(false),
      storageStatePath: config.storageStatePath,
      pageKind: 'unknown',
      pageTitle: null,
      finalUrl: null,
    }, ['No storage state found; run session:bootstrap first.']);
  }

  const inspection = await inspectSession();
  const status = classifySessionStatus(stateFileExists, inspection.pageKind);
  const warnings = status === 'stale_state'
    ? ['Saved storage state exists, but the live browser check landed on an unauthenticated page. Re-bootstrap the session.']
    : status === 'unknown'
      ? ['Saved storage state exists, but the live browser check could not confidently classify the session.']
      : undefined;

  return createResult<SessionCheckData>('session:check', {
    implemented: true,
    stateFileExists,
    usingStorageState: inspection.usingStorageState,
    status,
    storageStatePath: config.storageStatePath,
    pageKind: inspection.pageKind,
    pageTitle: inspection.pageTitle,
    finalUrl: inspection.finalUrl,
  }, warnings);
}
