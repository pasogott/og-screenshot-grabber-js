/**
 * Browser context management
 */
import { chromium, type BrowserContext } from 'playwright';
import type { ScreenshotOptions } from '../types/index.js';

export interface BrowserSetup {
  context: BrowserContext;
  cleanup: () => Promise<void>;
}

/**
 * Setup browser context with proper configuration
 */
export async function setupBrowser(options: ScreenshotOptions): Promise<BrowserSetup> {
  try {
    const browser = await chromium.launch({ headless: true });

    const context = await browser.newContext({
      viewport: { width: options.width, height: options.height },
      deviceScaleFactor: options.scale,
      userAgent:
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      locale: 'de-DE',
    });

    const cleanup = async () => {
      await context.close();
      await browser.close();
    };

    return { context, cleanup };
  } catch (error) {
    console.error('\n❌ Error: Playwright browser not installed\n');
    console.error('Please run this command first:');
    console.error('  bunx playwright install chromium\n');
    throw error;
  }
}
