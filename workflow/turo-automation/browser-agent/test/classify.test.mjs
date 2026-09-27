import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyBrowserPage } from '../dist/classify.js';

test('classifyBrowserPage detects unauthenticated pages', () => {
  const result = classifyBrowserPage({
    url: 'https://turo.com/us/en/login',
    title: 'Log in | Turo',
    bodyText: 'Log in to your Turo account',
  });

  assert.equal(result, 'unauthenticated');
});

test('classifyBrowserPage detects authenticated-like host pages', () => {
  const result = classifyBrowserPage({
    url: 'https://turo.com/us/en/host/dashboard',
    title: 'Host dashboard',
    bodyText: 'Calendar Inbox Earnings Vehicles',
  });

  assert.equal(result, 'authenticated');
});

test('classifyBrowserPage falls back to unknown when signals are weak', () => {
  const result = classifyBrowserPage({
    url: 'https://turo.com',
    title: 'Turo',
    bodyText: 'Car sharing marketplace',
  });

  assert.equal(result, 'unknown');
});
