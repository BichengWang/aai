import { chromium, type LaunchOptions } from 'playwright';
import { readBrowserAgentConfig, type BrowserAgentConfig } from './config.js';
import { ensureDir, ensureParentDir } from './fs.js';

export function toLaunchOptions(config: BrowserAgentConfig): LaunchOptions {
  return {
    headless: config.headless,
    slowMo: config.slowMoMs || undefined,
  };
}

export async function prepareRuntime(config: BrowserAgentConfig = readBrowserAgentConfig()) {
  await ensureParentDir(config.storageStatePath);
  await ensureDir(config.artifactsDir);
  return {
    config,
    launchOptions: toLaunchOptions(config),
  };
}

export async function openBasePage(config: BrowserAgentConfig = readBrowserAgentConfig()) {
  const runtime = await prepareRuntime(config);
  const browser = await chromium.launch(runtime.launchOptions);
  const page = await browser.newPage();
  page.setDefaultTimeout(config.defaultTimeoutMs);
  await page.goto(config.baseUrl, { waitUntil: 'domcontentloaded' });
  return { browser, page, runtime };
}
