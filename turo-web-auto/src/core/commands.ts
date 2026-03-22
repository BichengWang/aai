import { bootstrapSessionFlow } from '../flows/bootstrapSessionFlow.js';
import { checkSessionFlow } from '../flows/checkSessionFlow.js';
import { healthSmokeFlow } from '../flows/healthSmokeFlow.js';
import { getTripDetailFlow } from '../flows/getTripDetailFlow.js';
import { listMessagesFlow } from '../flows/listMessagesFlow.js';
import { listTripsFlow } from '../flows/listTripsFlow.js';

export async function runCommand(command: string, args: string[]) {
  switch (command) {
    case 'session:bootstrap':
      return bootstrapSessionFlow();
    case 'session:check':
      return checkSessionFlow();
    case 'health:smoke':
      return healthSmokeFlow();
    case 'trips:list':
      return listTripsFlow();
    case 'trips:get': {
      const tripId = args[0];
      if (!tripId) throw new Error('tripId is required');
      return getTripDetailFlow(tripId);
    }
    case 'messages:list':
      return listMessagesFlow();
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
