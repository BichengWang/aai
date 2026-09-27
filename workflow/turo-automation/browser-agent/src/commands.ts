import { runHealthSmoke } from './flows/healthSmoke.js';
import { runSessionBootstrap } from './flows/sessionBootstrap.js';
import { runSessionCheck } from './flows/sessionCheck.js';
import { runTripsList } from './flows/tripsList.js';

export async function runCommand(command: string) {
  switch (command) {
    case 'health:smoke':
      return runHealthSmoke();
    case 'session:bootstrap':
      return runSessionBootstrap();
    case 'session:check':
      return runSessionCheck();
    default:
      throw new Error(`Unknown command: ${command}`);
  }
}
