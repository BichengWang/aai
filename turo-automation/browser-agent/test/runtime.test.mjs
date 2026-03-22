import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareRuntime, toLaunchOptions } from '../dist/runtime.js';
import { readBrowserAgentConfig } from '../dist/config.js';

test('toLaunchOptions maps config into Playwright launch options', () => {
  const config = readBrowserAgentConfig({
    BROWSER_AGENT_HEADLESS: 'true',
    BROWSER_AGENT_SLOWMO_MS: '75',
  });

  const launchOptions = toLaunchOptions(config);
  assert.equal(launchOptions.headless, true);
  assert.equal(launchOptions.slowMo, 75);
});

test('prepareRuntime creates runtime directories', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'browser-agent-runtime-'));
  try {
    const config = readBrowserAgentConfig({
      BROWSER_AGENT_STORAGE_STATE_PATH: join(tempDir, 'storage', 'state.json'),
      BROWSER_AGENT_ARTIFACTS_DIR: join(tempDir, 'artifacts'),
    });

    const runtime = await prepareRuntime(config);
    assert.equal(runtime.config.storageStatePath.endsWith('state.json'), true);
    assert.equal(runtime.config.artifactsDir.endsWith('artifacts'), true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
