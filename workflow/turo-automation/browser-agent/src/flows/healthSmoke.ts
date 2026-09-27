import { snapshotPage } from '../browser.js';
import { classifyBrowserPage } from '../classify.js';
import { readBrowserAgentConfig } from '../config.js';
import { exists } from '../fs.js';
import { createResult } from '../results.js';
import { openBasePage } from '../runtime.js';

export async function runHealthSmoke() {
  const config = readBrowserAgentConfig();
  const hasStateFile = await exists(config.storageStatePath);

  const { browser, page } = await openBasePage(config);

  try {
    const snapshot = await snapshotPage(page);
    const pageKind = classifyBrowserPage(snapshot);

    return createResult('health:smoke', {
      baseUrl: config.baseUrl,
      headless: config.headless,
      defaultTimeoutMs: config.defaultTimeoutMs,
      slowMoMs: config.slowMoMs,
      storageStatePath: config.storageStatePath,
      artifactsDir: config.artifactsDir,
      hasStateFile,
      pageKind,
      pageTitle: snapshot.title,
      finalUrl: snapshot.url,
      implemented: true,
      liveBrowserCheck: true,
    }, pageKind === 'unknown' ? ['Live browser check completed, but auth state could not be confidently classified.'] : undefined);
  } finally {
    await browser.close();
  }
}
