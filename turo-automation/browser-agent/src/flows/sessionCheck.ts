import { readBrowserAgentConfig } from '../config.js';
import { exists } from '../fs.js';
import { createResult } from '../results.js';
import type { SessionCheckData } from '../types.js';

export async function runSessionCheck() {
  const config = readBrowserAgentConfig();
  const stateFileExists = await exists(config.storageStatePath);

  return createResult<SessionCheckData>('session:check', {
    implemented: false,
    stateFileExists,
    status: stateFileExists ? 'ready_for_browser_check' : 'missing_state',
    storageStatePath: config.storageStatePath,
  }, stateFileExists ? undefined : ['No storage state found; run session:bootstrap first.']);
}
