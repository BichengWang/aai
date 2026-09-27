import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSessionBootstrap } from '../dist/flows/sessionBootstrap.js';
import { classifySessionStatus, runSessionCheck } from '../dist/flows/sessionCheck.js';

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

test('classifySessionStatus reports missing state first', () => {
  assert.equal(classifySessionStatus(false), 'missing_state');
});

test('classifySessionStatus reports authenticated when live page is authenticated', () => {
  assert.equal(classifySessionStatus(true, 'authenticated'), 'authenticated');
});

test('classifySessionStatus reports stale_state when live page is unauthenticated', () => {
  assert.equal(classifySessionStatus(true, 'unauthenticated'), 'stale_state');
});

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

test('runSessionCheck reports authenticated when injected live inspection is authenticated', async () => {
  await withTempEnv(async (tempDir) => {
    const statePath = join(tempDir, 'storage', 'state.json');
    await runSessionBootstrap();
    await writeFile(statePath, JSON.stringify({ cookies: [] }), 'utf8');
    const result = await runSessionCheck(async () => ({
      pageKind: 'authenticated',
      pageTitle: 'Host dashboard',
      finalUrl: 'https://turo.com/us/en/host/dashboard',
      usingStorageState: true,
    }));
    assert.equal(result.data.stateFileExists, true);
    assert.equal(result.data.status, 'authenticated');
    assert.equal(result.data.pageKind, 'authenticated');
  });
});

test('runSessionCheck reports stale_state when injected live inspection is unauthenticated', async () => {
  await withTempEnv(async (tempDir) => {
    const statePath = join(tempDir, 'storage', 'state.json');
    await runSessionBootstrap();
    await writeFile(statePath, JSON.stringify({ cookies: [] }), 'utf8');
    const result = await runSessionCheck(async () => ({
      pageKind: 'unauthenticated',
      pageTitle: 'Log in | Turo',
      finalUrl: 'https://turo.com/us/en/login',
      usingStorageState: true,
    }));
    assert.equal(result.data.status, 'stale_state');
    assert.match(result.warnings[0], /re-bootstrap/i);
  });
});
