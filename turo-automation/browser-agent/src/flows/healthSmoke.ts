import { readBrowserAgentConfig } from '../config.js';
import { createResult } from '../results.js';

export async function runHealthSmoke() {
  const config = readBrowserAgentConfig();
  return createResult('health:smoke', {
    baseUrl: config.baseUrl,
    headless: config.headless,
    defaultTimeoutMs: config.defaultTimeoutMs,
    slowMoMs: config.slowMoMs,
    storageStatePath: config.storageStatePath,
    artifactsDir: config.artifactsDir,
    implemented: false,
  });
}
