import { resolve } from 'node:path';

export interface BrowserAgentConfig {
  baseUrl: string;
  headless: boolean;
  defaultTimeoutMs: number;
  slowMoMs: number;
  storageStatePath: string;
  artifactsDir: string;
}

export function readBrowserAgentConfig(env: NodeJS.ProcessEnv = process.env): BrowserAgentConfig {
  return {
    baseUrl: env.TURO_BASE_URL ?? 'https://turo.com',
    headless: env.BROWSER_AGENT_HEADLESS === 'true',
    defaultTimeoutMs: Number(env.BROWSER_AGENT_TIMEOUT_MS ?? '15000'),
    slowMoMs: Number(env.BROWSER_AGENT_SLOWMO_MS ?? '0'),
    storageStatePath: resolve(env.BROWSER_AGENT_STORAGE_STATE_PATH ?? 'browser-agent/storage/state.json'),
    artifactsDir: resolve(env.BROWSER_AGENT_ARTIFACTS_DIR ?? 'browser-agent/artifacts'),
  };
}
