import test from 'node:test';
import assert from 'node:assert/strict';
import { readBrowserAgentConfig } from '../dist/config.js';

test('readBrowserAgentConfig returns defaults', () => {
  const config = readBrowserAgentConfig({});
  assert.equal(config.baseUrl, 'https://turo.com');
  assert.equal(config.headless, false);
  assert.equal(config.defaultTimeoutMs, 15000);
  assert.equal(config.slowMoMs, 0);
  assert.match(config.storageStatePath, /browser-agent\/storage\/state\.json$/);
  assert.match(config.artifactsDir, /browser-agent\/artifacts$/);
});

test('readBrowserAgentConfig respects env overrides', () => {
  const config = readBrowserAgentConfig({
    TURO_BASE_URL: 'https://example.test',
    BROWSER_AGENT_HEADLESS: 'true',
    BROWSER_AGENT_TIMEOUT_MS: '9000',
    BROWSER_AGENT_SLOWMO_MS: '25',
    BROWSER_AGENT_STORAGE_STATE_PATH: 'tmp/state.json',
    BROWSER_AGENT_ARTIFACTS_DIR: 'tmp/artifacts',
  });

  assert.equal(config.baseUrl, 'https://example.test');
  assert.equal(config.headless, true);
  assert.equal(config.defaultTimeoutMs, 9000);
  assert.equal(config.slowMoMs, 25);
  assert.match(config.storageStatePath, /tmp\/state\.json$/);
  assert.match(config.artifactsDir, /tmp\/artifacts$/);
});
