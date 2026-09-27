import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { classifyBrowserPage } from '../dist/classify.js';

test('health smoke classification signals unauthenticated login page shape', () => {
  const result = classifyBrowserPage({
    url: 'https://turo.com/login',
    title: 'Sign in | Turo',
    bodyText: 'Sign in to continue',
  });

  assert.equal(result, 'unauthenticated');
});

test('health smoke runtime can detect whether storage state exists before browser launch', async () => {
  const tempDir = await mkdtemp(join(tmpdir(), 'browser-agent-health-'));
  try {
    const statePath = join(tempDir, 'state.json');
    await writeFile(statePath, JSON.stringify({ cookies: [] }), 'utf8');
    const exists = await import('../dist/fs.js').then((m) => m.exists(statePath));
    assert.equal(exists, true);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});
