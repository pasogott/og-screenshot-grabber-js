/**
 * Core screenshot processing logic
 */
import type { BrowserContext } from 'playwright';
import { randomUUID } from 'crypto';
import { join } from 'path';
import { writeFile } from 'fs/promises';
import { acceptCookies } from './cookies.js';
import { addFooterWithMetadata } from './footer.js';
import { Semaphore } from './semaphore.js';
import type { ScreenshotOptions, ScreenshotResult, ScreenshotMetadata } from '../types/index.js';

/**
 * Process a single URL: navigate, handle cookies, screenshot, add footer
 */
export async function processUrl(
  inputUrl: string,
  context: BrowserContext,
  semaphore: Semaphore,
  options: ScreenshotOptions
): Promise<ScreenshotResult> {
  const uid = randomUUID().replace(/-/g, '');
  const pngPath = join(options.output, `${uid}.png`);
  const jsonPath = join(options.output, `${uid}.json`);

  return semaphore.use(async () => {
    const utcTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    let page;

    try {
      page = await context.newPage();

      if (options.verbose) {
        console.error(`  Opening: ${inputUrl}`);
      }

      await page.goto(inputUrl, { waitUntil: 'networkidle', timeout: options.timeout });

      if (options.verbose) {
        console.error(`  After goto: ${page.url()}`);
      }

      // Cookie handling
      await acceptCookies(page, 'initial', options.verbose);
      await page.waitForTimeout(800);
      await acceptCookies(page, 'final', options.verbose);
      await page.waitForTimeout(1000);

      const finalUrl = page.url();
      const fullHTML = await page.content();

      // Screenshot
      await page.screenshot({
        path: pngPath,
        fullPage: options.fullPage,
      });

      if (options.verbose) {
        console.error(`  Screenshot saved: ${pngPath}`);
      }

      await page.close();

      // Add footer
      await addFooterWithMetadata(pngPath, finalUrl, utcTime);

      // Save metadata
      const metadata: ScreenshotMetadata = {
        uuid: uid,
        timestamp: utcTime,
        url: finalUrl,
        input_url: inputUrl,
        visibleHTML: fullHTML,
        image_filename: `${uid}.png`,
      };

      await writeFile(jsonPath, JSON.stringify(metadata, null, 2));

      return {
        status: 'success',
        url: inputUrl,
        finalUrl: finalUrl,
        png: pngPath,
        json: jsonPath,
        timestamp: utcTime,
        uuid: uid,
      };
    } catch (error) {
      if (page) {
        await page.close();
      }
      return {
        status: 'error',
        url: inputUrl,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });
}

/**
 * Process URL with progress output
 */
export async function processUrlWithProgress(
  url: string,
  index: number,
  total: number,
  context: BrowserContext,
  semaphore: Semaphore,
  options: ScreenshotOptions,
  isTTY: boolean
): Promise<ScreenshotResult> {
  // NO_COLOR support
  const useColor = !process.env.NO_COLOR && isTTY;
  const arrow = useColor ? '➡' : '->';
  const success = useColor ? '✅' : '[OK]';
  const error = useColor ? '❌' : '[FAIL]';

  if (isTTY && !options.quiet) {
    process.stdout.write(`[${index}/${total}] ${arrow} ${url}... `);
  }

  const result = await processUrl(url, context, semaphore, options);

  if (isTTY && !options.quiet) {
    if (result.status === 'success') {
      console.log(`${success} ${result.png}`);
    } else {
      console.log(`${error} ${result.error}`);
    }
  }

  return result;
}
