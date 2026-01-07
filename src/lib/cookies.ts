/**
 * Cookie banner handling for Facebook and other sites
 */
import type { Page, Frame } from 'playwright';

const COOKIE_TEXTS = [
  'Alle Cookies erlauben',
  'Alle Cookies zulassen',
  'Alle Cookies akzeptieren',
  'Optionale Cookies ablehnen',
  'Allow all cookies',
  'Accept all',
];

/**
 * Try to click a cookie button in a single frame
 */
async function clickCookieButtonInFrame(frame: Frame): Promise<boolean> {
  for (const label of COOKIE_TEXTS) {
    // Try ARIA role
    try {
      const btn = frame.getByRole('button', { name: label, exact: false });
      if ((await btn.count()) > 0) {
        await btn.first().click();
        return true;
      }
    } catch {
      // Continue to next method
    }

    // Try text selector
    try {
      const loc = frame.locator(`text=${label}`);
      if ((await loc.count()) > 0) {
        await loc.first().click();
        return true;
      }
    } catch {
      // Continue to next label
    }
  }

  return false;
}

/**
 * Search all frames for cookie banner and dismiss it
 */
export async function acceptCookies(
  page: Page,
  stage: string,
  verbose: boolean = false
): Promise<boolean> {
  if (verbose) {
    console.error(`  Checking cookie banner (${stage})...`);
  }

  await page.waitForTimeout(1000);

  for (const frame of page.frames()) {
    try {
      if (await clickCookieButtonInFrame(frame)) {
        await page.waitForTimeout(500);
        if (verbose) {
          console.error(`  ✓ Cookie banner dismissed (${stage})`);
        }
        return true;
      }
    } catch {
      // Continue with next frame
    }
  }

  return false;
}
