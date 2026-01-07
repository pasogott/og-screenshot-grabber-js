#!/usr/bin/env bun
/**
 * CLI entry point for og-screenshot
 */
import { Command } from 'commander';
import { mkdir } from 'fs/promises';
import { setupBrowser } from './lib/browser.js';
import { Semaphore } from './lib/semaphore.js';
import { processUrlWithProgress } from './lib/screenshot.js';
import { collectUrls } from './lib/input.js';
import { handleOutput, getExitCode, type OutputMode } from './lib/output.js';
import type { ScreenshotOptions } from './types/index.js';

const VERSION = '1.0.0';

// Cleanup function for graceful shutdown
let cleanupFn: (() => Promise<void>) | null = null;

// Handle Ctrl-C gracefully
process.on('SIGINT', async () => {
  console.error('\n⚠️  Interrupted. Cleaning up...');
  if (cleanupFn) {
    await cleanupFn().catch(() => {
      // Ignore cleanup errors on interrupt
    });
  }
  process.exit(130); // Standard SIGINT exit code
});

async function main() {
  const program = new Command();

  program
    .name('og-screenshot')
    .description('Grab screenshots from URLs with cookie handling and metadata footer')
    .version(VERSION)
    .argument('[urls...]', 'URLs to screenshot (use - for stdin, or pipe directly)')
    .option('-o, --output <dir>', 'Output directory', 'output')
    .option('--parallel <n>', 'Max parallel browser tabs', (val) => parseInt(val, 10), 10)
    .option('--timeout <ms>', 'Navigation timeout in milliseconds', (val) => parseInt(val, 10), 45000)
    .option('--width <n>', 'Viewport width in pixels', (val) => parseInt(val, 10), 1200)
    .option('--height <n>', 'Viewport height in pixels', (val) => parseInt(val, 10), 2000)
    .option('--scale <factor>', 'Device scale factor / zoom', (val) => parseFloat(val), 0.8)
    .option('--full-page', 'Capture full page instead of viewport only', false)
    .option('--plain', 'Output only PNG paths (one per line)', false)
    .option('--json', 'Output JSON Lines format', false)
    .option('-q, --quiet', 'No output except errors', false)
    .option('-v, --verbose', 'Show detailed progress', false)
    .addHelpText(
      'after',
      `
Examples:
  $ og-screenshot https://example.com
  $ og-screenshot url1 url2 url3
  $ cat urls.txt | og-screenshot
  $ cat urls.txt | og-screenshot - https://extra.com
  $ og-screenshot --quiet --plain url1 url2 > paths.txt
  $ og-screenshot --json url | jq -r '.png'
  $ og-screenshot --height 3000 --scale 0.5 url

Output Modes:
  --plain   Stable line-based output (one path per line, for scripts)
  --json    JSON Lines format (one JSON object per result)

Exit Codes:
  0   All URLs processed successfully
  1   Some URLs failed
  2   All URLs failed or invalid usage

Environment Variables:
  NO_COLOR                   Disable colored/emoji output
  OG_SCREENSHOT_OUTPUT_DIR   Default output directory
  OG_SCREENSHOT_PARALLEL     Default parallel browser tabs
  OG_SCREENSHOT_TIMEOUT      Default navigation timeout (ms)
  OG_SCREENSHOT_WIDTH        Default viewport width
  OG_SCREENSHOT_HEIGHT       Default viewport height

Repository: https://github.com/user/og-screenshot-grabber-js
    `
    );

  program.parse();

  const cliOptions = program.opts();
  const urls = await collectUrls(program.args);

  if (urls.length === 0) {
    console.error('Error: No URLs provided');
    console.error('Usage: og-screenshot [OPTIONS] [URL...]');
    console.error('   or: cat urls.txt | og-screenshot [OPTIONS]');
    process.exit(2);
  }

  // Environment variable support with precedence: CLI flags > Env vars > Defaults
  const options: ScreenshotOptions = {
    output: cliOptions.output || process.env.OG_SCREENSHOT_OUTPUT_DIR || 'output',
    parallel: cliOptions.parallel || parseInt(process.env.OG_SCREENSHOT_PARALLEL || '10', 10),
    timeout: cliOptions.timeout || parseInt(process.env.OG_SCREENSHOT_TIMEOUT || '45000', 10),
    width: cliOptions.width || parseInt(process.env.OG_SCREENSHOT_WIDTH || '1200', 10),
    height: cliOptions.height || parseInt(process.env.OG_SCREENSHOT_HEIGHT || '2000', 10),
    scale: cliOptions.scale,
    fullPage: cliOptions.fullPage,
    verbose: cliOptions.verbose,
    quiet: cliOptions.quiet,
  };

  // Setup output directory
  await mkdir(options.output, { recursive: true });

  const isTTY = process.stdout.isTTY || false;

  if (options.verbose) {
    console.error('Starting browser...');
    console.error(
      `Viewport: ${options.width}x${options.height}, Scale: ${options.scale}, Full-page: ${options.fullPage}`
    );
  }

  // Setup browser
  const { context, cleanup } = await setupBrowser(options);
  
  // Store cleanup function for SIGINT handler
  cleanupFn = cleanup;
  
  const semaphore = new Semaphore(options.parallel);

  // Process URLs
  const tasks = urls.map((url, i) =>
    processUrlWithProgress(url, i + 1, urls.length, context, semaphore, options, isTTY)
  );

  const results = await Promise.all(tasks);

  // Cleanup
  await cleanup();
  cleanupFn = null;

  // Output handling
  const mode: OutputMode = cliOptions.json ? 'json' : cliOptions.plain ? 'plain' : 'default';
  handleOutput(results, mode, options.quiet, isTTY);

  // Exit with proper code
  process.exit(getExitCode(results));
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(2);
});
