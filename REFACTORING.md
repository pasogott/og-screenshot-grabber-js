# CLI Refactoring - create-cli Guidelines Compliance

## Current State vs. Guidelines

### ✅ Already Good

- [x] `-h/--help` and `--version` implemented
- [x] Stdout for data, stderr for diagnostics
- [x] `--json` and `--plain` for machine output
- [x] TTY detection for formatting
- [x] Exit codes: 0 (success), 1 (partial), 2 (all failed)
- [x] Stdin support (pipe-friendly)
- [x] `--quiet` and `--verbose` flags

### 🔧 Recommended Improvements

#### 1. **NO_COLOR Support** (clig.dev/robustness)

**Issue**: Currently uses emojis/color without checking `NO_COLOR` env var

**Fix**:
```typescript
// src/lib/output.ts
const useColor = !process.env.NO_COLOR && process.stdout.isTTY;
const checkmark = useColor ? '✅' : '[OK]';
const cross = useColor ? '❌' : '[FAIL]';
```

**Why**: Respect `NO_COLOR` convention for CI/logs

---

#### 2. **Progress Indicators Only on TTY** (clig.dev/output)

**Issue**: Progress output `[1/3] ➡ ...` even when not interactive

**Current**:
```typescript
if (isTTY && !options.quiet) {
  process.stdout.write(`[${index}/${total}] ➡ ${url}... `);
}
```

**Already correct!** ✅

---

#### 3. **Add `-` for stdin explicitly** (clig.dev/arguments-and-flags)

**Issue**: Stdin works implicitly, but not when URLs are provided

**Proposal**: Support `og-screenshot - url1 url2` to mix stdin + args

**Implementation**:
```typescript
// src/lib/input.ts
export async function collectUrls(args: string[]): Promise<string[]> {
  let urls: string[] = [];
  let shouldReadStdin = false;

  if (args.length === 0 && !process.stdin.isTTY) {
    shouldReadStdin = true;
  } else {
    urls = args.filter(arg => arg !== '-');
    shouldReadStdin = args.includes('-');
  }

  if (shouldReadStdin) {
    const stdinUrls = await readUrlsFromStdin();
    urls.push(...stdinUrls);
  }

  return urls;
}
```

**Example**:
```bash
# Mix stdin + args
cat batch.txt | ./og-screenshot - https://extra-url.com
```

---

#### 4. **Better Help Text with Examples** (clig.dev/help)

**Issue**: Commander default help is bare-bones

**Fix**: Add `.addHelpText()` with examples

```typescript
program
  .addHelpText('after', `
Examples:
  $ og-screenshot https://example.com
  $ og-screenshot url1 url2 url3
  $ cat urls.txt | og-screenshot --quiet --plain > paths.txt
  $ og-screenshot --json url | jq -r '.png'
  $ og-screenshot --height 3000 --scale 0.5 url  # More content

Output modes:
  --plain   Stable line-based output (one path per line)
  --json    JSON Lines format for parsing

Exit codes:
  0  All succeeded
  1  Some failed
  2  All failed or invalid usage

Docs: https://github.com/user/og-screenshot-grabber-js
`);
```

---

#### 5. **Responsiveness Indicator** (clig.dev/robustness)

**Issue**: Long-running URLs might seem "stuck"

**Fix**: Show activity within 100ms

```typescript
// src/lib/screenshot.ts
export async function processUrl(...) {
  return semaphore.use(async () => {
    // Immediate feedback
    if (options.verbose) {
      console.error(`  Processing: ${inputUrl}`);
    }
    
    const utcTime = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    let page;
    // ... rest
  });
}
```

**Already present with verbose mode!** ✅

---

#### 6. **Timeout Configuration** (clig.dev/robustness)

**Issue**: Hardcoded 45s timeout might be too short/long

**Proposal**: Add `--timeout` flag

```typescript
.option('--timeout <ms>', 'Navigation timeout in milliseconds', (val) => parseInt(val, 10), 45000)
```

**Implementation**:
```typescript
await page.goto(inputUrl, { 
  waitUntil: 'networkidle', 
  timeout: options.timeout 
});
```

---

#### 7. **Config File Support** (clig.dev/configuration) - OPTIONAL

**Not needed now**, but future: `.og-screenshot.json`

```json
{
  "output": "screenshots",
  "parallel": 20,
  "width": 1920,
  "height": 1080
}
```

**Precedence**: Flags > Env > Project config > User config

---

#### 8. **Environment Variables** (clig.dev/environment-variables)

**Proposal**: Support common config via env

```bash
OG_SCREENSHOT_OUTPUT_DIR=./out
OG_SCREENSHOT_PARALLEL=20
OG_SCREENSHOT_TIMEOUT=60000
```

**Implementation**:
```typescript
const options: ScreenshotOptions = {
  output: cliOptions.output || process.env.OG_SCREENSHOT_OUTPUT_DIR || 'output',
  parallel: cliOptions.parallel || parseInt(process.env.OG_SCREENSHOT_PARALLEL || '10', 10),
  timeout: cliOptions.timeout || parseInt(process.env.OG_SCREENSHOT_TIMEOUT || '45000', 10),
  // ...
};
```

---

#### 9. **Ctrl-C Handling** (clig.dev/signals-and-control-characters)

**Issue**: Playwright might leave browser processes on interrupt

**Fix**: Graceful shutdown

```typescript
// src/cli.ts
let cleanupFn: (() => Promise<void>) | null = null;

process.on('SIGINT', async () => {
  console.error('\n⚠️ Interrupted. Cleaning up...');
  if (cleanupFn) {
    await cleanupFn();
  }
  process.exit(130); // Standard SIGINT exit code
});

// Store cleanup function
const { context, cleanup } = await setupBrowser(options);
cleanupFn = cleanup;
```

---

#### 10. **Validate URLs Early** (clig.dev/robustness)

**Issue**: Invalid URLs fail during processing (slow)

**Fix**: Pre-validate

```typescript
// src/lib/input.ts
import { URL } from 'url';

export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function collectUrls(args: string[]): Promise<string[]> {
  const urls = /* ... existing logic ... */;
  
  const invalid = urls.filter(url => !validateUrl(url));
  if (invalid.length > 0) {
    console.error('Error: Invalid URLs detected:');
    invalid.forEach(url => console.error(`  - ${url}`));
    process.exit(2);
  }
  
  return urls;
}
```

---

## Priority Implementation Order

### High Priority (Now)

1. **NO_COLOR support** - 5 min
2. **Better help text with examples** - 10 min
3. **Ctrl-C handling** - 10 min
4. **URL validation** - 5 min

### Medium Priority (Soon)

5. **`-` for stdin mixing** - 15 min
6. **Timeout configuration** - 5 min
7. **Environment variables** - 15 min

### Low Priority (Future)

8. **Config file support** - 30 min

---

## Implementation Checklist

- [ ] Add NO_COLOR support to output.ts
- [ ] Add .addHelpText() to cli.ts
- [ ] Add SIGINT handler to cli.ts
- [ ] Add URL validation to input.ts
- [ ] Add `--timeout` flag
- [ ] Add env var support
- [ ] Add `-` for stdin mixing
- [ ] Update README with new features
- [ ] Update tests (if any)

---

## Compatibility Notes

- All changes are **backwards compatible**
- New flags are optional
- Existing scripts won't break
- Exit codes unchanged
