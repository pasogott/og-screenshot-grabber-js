/**
 * Output formatting and handling
 */
import type { ScreenshotResult } from '../types/index.js';

export type OutputMode = 'default' | 'plain' | 'json';

// Respect NO_COLOR environment variable (clig.dev)
const useColor = !process.env.NO_COLOR && process.stdout.isTTY;

// Unicode symbols with NO_COLOR fallback
const symbols = {
  success: useColor ? '✅' : '[OK]',
  error: useColor ? '❌' : '[FAIL]',
  arrow: useColor ? '➡' : '->',
};

export { symbols };

/**
 * Handle output based on mode
 */
export function handleOutput(
  results: ScreenshotResult[],
  mode: OutputMode,
  quiet: boolean,
  isTTY: boolean
): void {
  const successes = results.filter((r) => r.status === 'success');
  const failures = results.filter((r) => r.status === 'error');

  // JSON output
  if (mode === 'json') {
    results.forEach((result) => {
      console.log(JSON.stringify(result));
    });
    return;
  }

  // Plain output (only successful PNG paths)
  if (mode === 'plain') {
    successes.forEach((result) => {
      if (result.png) console.log(result.png);
    });
    return;
  }

  // Default human-readable output
  if (!quiet) {
    if (isTTY) {
      console.log('---');
      const parts: string[] = [];
      if (successes.length) parts.push(`${symbols.success} ${successes.length} success`);
      if (failures.length) parts.push(`${symbols.error} ${failures.length} failed`);
      console.log(parts.join('  '));
    } else {
      // Not a TTY but not --plain/--json - still show paths
      successes.forEach((result) => {
        if (result.png) console.log(result.png);
      });
    }
  }

  // Print errors to stderr (not in JSON mode)
  if (failures.length) {
    failures.forEach((failure) => {
      console.error(`Error processing ${failure.url}: ${failure.error}`);
    });
  }
}

/**
 * Determine exit code based on results
 */
export function getExitCode(results: ScreenshotResult[]): number {
  const successes = results.filter((r) => r.status === 'success');
  const failures = results.filter((r) => r.status === 'error');

  if (!successes.length && failures.length) return 2; // All failed
  if (failures.length) return 1; // Some failed
  return 0; // All success
}
