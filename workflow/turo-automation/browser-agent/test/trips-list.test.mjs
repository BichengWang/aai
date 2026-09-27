import test from 'node:test';
import assert from 'node:assert/strict';
import { extractTripsFromHtml } from '../dist/browser.js';

test('extractTripsFromHtml returns conservative trip summaries', () => {
  const trips = extractTripsFromHtml(`
    <main>
      <a href="/us/en/trips/abc123">
        <h3>Trip to SFO</h3>
        <span>Mar 22 - Mar 25</span>
      </a>
      <a href="/us/en/trips/def456">
        <div>Guest pickup</div>
      </a>
      <a href="/vehicles/ignore-me">Vehicle</a>
    </main>
  `, 'https://turo.com/us/en/host/trips');

  assert.deepEqual(trips, [
    {
      id: 'abc123',
      href: 'https://turo.com/us/en/trips/abc123',
      label: 'Trip to SFO Mar 22 - Mar 25',
    },
    {
      id: 'def456',
      href: 'https://turo.com/us/en/trips/def456',
      label: 'Guest pickup',
    },
  ]);
});

test('extractTripsFromHtml deduplicates repeated trip links', () => {
  const trips = extractTripsFromHtml(`
    <a href="/us/en/trips/abc123">Trip one</a>
    <a href="https://turo.com/us/en/trips/abc123">Trip one duplicate</a>
  `, 'https://turo.com/us/en/host/trips');

  assert.equal(trips.length, 1);
  assert.equal(trips[0].id, 'abc123');
});

