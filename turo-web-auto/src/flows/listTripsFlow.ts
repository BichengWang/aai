import { baseResult } from '../core/result.js';

export async function listTripsFlow() {
  return {
    ...baseResult('trips:list'),
    status: 'planned',
    data: [],
    note: 'Upcoming trips extraction flow to be implemented after session bootstrap.'
  };
}
