import { chromium, type BrowserContextOptions, type LaunchOptions } from 'playwright';
import { readBrowserAgentConfig, type BrowserAgentConfig } from './config.js';
import { ensureDir, ensureParentDir, exists } from './fs.js';

export function toLaunchOptions(config: BrowserAgentConfig): LaunchOptions {
  return {
    headless: config.headless,
    slowMo: config.slowMoMs || undefined,
  };
}

export async function toContextOptions(config: BrowserAgentConfig): Promise<BrowserContextOptions> {
  const hasStateFile = await exists(config.storageStatePath);
  return hasStateFile ? { storageState: config.storageStatePath } : {};
}

export async function prepareRuntime(config: BrowserAgentConfig = readBrowserAgentConfig()) {
  await ensureParentDir(config.storageStatePath);
  await ensureDir(config.artifactsDir);
  return {
    config,
    launchOptions: toLaunchOptions(config),
    contextOptions: await toContextOptions(config),
  };
}

export async function openBasePage(
  config: BrowserAgentConfig = readBrowserAgentConfig(),
  targetUrl: string = config.baseUrl,
) {
  const runtime = await prepareRuntime(config);
  const browser = await chromium.launch(runtime.launchOptions);
  const context = await browser.newContext(runtime.contextOptions);
  const page = await context.newPage();
  page.setDefaultTimeout(config.defaultTimeoutMs);
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
  return {
    browser,
    context,
    page,
    runtime,
    usingStorageState: 'storageState' in runtime.contextOptions,
  };
}
