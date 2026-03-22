import { readBrowserAgentConfig } from '../config.js';
import { ensureDir, ensureParentDir } from '../fs.js';
import { createResult } from '../results.js';
import type { SessionBootstrapData } from '../types.js';

export async function runSessionBootstrap() {
  const config = readBrowserAgentConfig();
  await ensureParentDir(config.storageStatePath);
  await ensureDir(config.artifactsDir);

  return createResult<SessionBootstrapData>('session:bootstrap', {
    implemented: false,
    prepared: true,
    storageStatePath: config.storageStatePath,
    artifactsDir: config.artifactsDir,
    next: [
      'launch headed Playwright browser',
      'navigate to login',
      'wait for manual authentication',
      'save storage state',
    ],
  });
}
