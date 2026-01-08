/**
 * Input handling (stdin, args, file)
 */
import { createInterface } from 'readline';
import { readFile, access } from 'fs/promises';

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
 * Read URLs from a file (one per line)
 */
export async function readUrlsFromFile(filePath: string): Promise<string[]> {
  // Check if file exists
  try {
    await access(filePath);
  } catch {
    console.error(`Error: File not found: ${filePath}\n`);
    console.error('Make sure the file exists and is readable.');
    process.exit(2);
  }

  // Read and parse file
  try {
    const content = await readFile(filePath, 'utf-8');
    return content
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'));
  } catch (error) {
    console.error(`Error: Failed to read file: ${filePath}\n`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(2);
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
 * Collect URLs from args and/or stdin and/or file
 */
export async function collectUrls(args: string[], filePath?: string): Promise<string[]> {
  let urls: string[] = [];
  let shouldReadStdin = false;

  // 1. Read from file if specified
  if (filePath) {
    const fileUrls = await readUrlsFromFile(filePath);
    urls.push(...fileUrls);
  }

  // 2. Check for explicit stdin marker `-`
  if (args.includes('-')) {
    urls.push(...args.filter((arg) => arg !== '-'));
    shouldReadStdin = true;
  } else if (args.length === 0 && !process.stdin.isTTY && !filePath) {
    // Auto-detect stdin when no args and no file
    shouldReadStdin = true;
  } else {
    urls.push(...args);
  }

  // 3. Read from stdin if needed
  if (shouldReadStdin) {
    const stdinUrls = await readUrlsFromStdin();
    urls.push(...stdinUrls);
  }

  // 4. Validate all URLs
  const invalid = urls.filter((url) => !validateUrl(url));
  if (invalid.length > 0) {
    console.error('Error: Invalid URLs detected:');
    invalid.forEach((url) => console.error(`  ${url}`));
    process.exit(2);
  }

  return urls;
}
