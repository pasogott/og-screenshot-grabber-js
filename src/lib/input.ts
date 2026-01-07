/**
 * Input handling (stdin, args, file)
 */
import { createInterface } from 'readline';

/**
 * Validate URL format
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Read URLs from stdin
 */
export async function readUrlsFromStdin(): Promise<string[]> {
  const urls: string[] = [];

  const rl = createInterface({
    input: process.stdin,
    crlfDelay: Infinity,
  });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      urls.push(trimmed);
    }
  }

  return urls;
}

/**
 * Collect URLs from args and/or stdin
 */
export async function collectUrls(args: string[]): Promise<string[]> {
  let urls: string[] = [];
  let shouldReadStdin = false;

  // Check for explicit stdin marker `-`
  if (args.includes('-')) {
    urls = args.filter((arg) => arg !== '-');
    shouldReadStdin = true;
  } else if (args.length === 0 && !process.stdin.isTTY) {
    // Auto-detect stdin when no args
    shouldReadStdin = true;
  } else {
    urls = [...args];
  }

  // Read from stdin if needed
  if (shouldReadStdin) {
    const stdinUrls = await readUrlsFromStdin();
    urls.push(...stdinUrls);
  }

  // Validate all URLs
  const invalid = urls.filter((url) => !validateUrl(url));
  if (invalid.length > 0) {
    console.error('Error: Invalid URLs detected:');
    invalid.forEach((url) => console.error(`  ${url}`));
    process.exit(2);
  }

  return urls;
}
