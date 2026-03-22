import { baseResult } from '../core/result.js';

export async function listMessagesFlow() {
  return {
    ...baseResult('messages:list'),
    status: 'planned',
    data: [],
    note: 'Message listing flow to be implemented after session and trip workflows.'
  };
}
