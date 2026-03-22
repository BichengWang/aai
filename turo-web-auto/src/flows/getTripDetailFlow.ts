import { baseResult } from '../core/result.js';

export async function getTripDetailFlow(tripId: string) {
  return {
    ...baseResult('trips:get'),
    status: 'planned',
    tripId,
    note: 'Trip detail extraction flow to be implemented after trips:list.'
  };
}
