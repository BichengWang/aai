import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSessionBootstrap } from '../dist/flows/sessionBootstrap.js';
import { runSessionCheck } from '../dist/flows/sessionCheck.js';

async function withTempEnv(fn) {
  const tempDir = await mkdtemp(join(tmpdir(), 'browser-agent-'));
  const priorEnv = {
    BROWSER_AGENT_STORAGE_STATE_PATH: process.env.BROWSER_AGENT_STORAGE_STATE_PATH,
    BROWSER_AGENT_ARTIFACTS_DIR: process.env.BROWSER_AGENT_ARTIFACTS_DIR,
  };

  process.env.BROWSER_AGENT_STORAGE_STATE_PATH = join(tempDir, 'storage', 'state.json');
  process.env.BROWSER_AGENT_ARTIFACTS_DIR = join(tempDir, 'artifacts');

  try {
    await fn(tempDir);
  } finally {
    if (priorEnv.BROWSER_AGENT_STORAGE_STATE_PATH === undefined) delete process.env.BROWSER_AGENT_STORAGE_STATE_PATH;
    else process.env.BROWSER_AGENT_STORAGE_STATE_PATH = priorEnv.BROWSER_AGENT_STORAGE_STATE_PATH;

    if (priorEnv.BROWSER_AGENT_ARTIFACTS_DIR === undefined) delete process.env.BROWSER_AGENT_ARTIFACTS_DIR;
    else process.env.BROWSER_AGENT_ARTIFACTS_DIR = priorEnv.BROWSER_AGENT_ARTIFACTS_DIR;

    await rm(tempDir, { recursive: true, force: true });
  }
}

test('runSessionBootstrap prepares storage and artifacts directories', async () => {
  await withTempEnv(async () => {
    const result = await runSessionBootstrap();
    assert.equal(result.ok, true);
    assert.equal(result.data.prepared, true);
  });
});

test('runSessionCheck reports missing state when state file is absent', async () => {
  await withTempEnv(async () => {
    const result = await runSessionCheck();
    assert.equal(result.data.stateFileExists, false);
    assert.equal(result.data.status, 'missing_state');
    assert.match(result.warnings[0], /run session:bootstrap first/i);
  });
});

test('runSessionCheck reports ready_for_browser_check when state file exists', async () => {
  await withTempEnv(async (tempDir) => {
    const statePath = join(tempDir, 'storage', 'state.json');
    await runSessionBootstrap();
    await writeFile(statePath, JSON.stringify({ cookies: [] }), 'utf8');
    const result = await runSessionCheck();
    assert.equal(result.data.stateFileExists, true);
    assert.equal(result.data.status, 'ready_for_browser_check');
  });
});
