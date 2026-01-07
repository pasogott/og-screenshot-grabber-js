# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with this project.

## Project Overview

**Name**: `og-screenshot-grabber-js`  
**Type**: CLI tool for automated screenshot grabbing with cookie handling  
**Tech Stack**: TypeScript + Bun + Playwright + Sharp + Canvas  
**Use Case**: Capture Facebook posts/comments as visual evidence (hate speech detection)

---

## Architecture

### Modular Design

```
src/
├── cli.ts              # Entry point (Commander.js setup)
├── types/index.ts      # TypeScript interfaces
└── lib/
    ├── browser.ts      # Playwright browser context setup
    ├── cookies.ts      # Multi-frame cookie banner detection
    ├── footer.ts       # Image metadata footer (Sharp + Canvas)
    ├── screenshot.ts   # Core screenshot pipeline
    ├── semaphore.ts    # Concurrency control (max N parallel tabs)
    ├── input.ts        # URL collection (args/stdin) + validation
    └── output.ts       # Formatting (default/plain/json) + NO_COLOR
```

### Key Design Principles

1. **Separation of Concerns**: Each lib module has single responsibility
2. **Type Safety**: All functions typed, no `any`
3. **CLI Guidelines Compliance**: Follows [clig.dev](https://clig.dev)
4. **Async/Await**: Consistent async patterns throughout
5. **Error Handling**: Early validation, graceful failures

---

## Code Conventions

### TypeScript Style

- **Strict mode**: Enabled in tsconfig.json
- **No `any`**: Use `unknown` if truly needed
- **Explicit return types**: On all exported functions
- **Import paths**: Use `.js` extension (ESM requirement)

### Naming

- **Functions**: `camelCase`
- **Types/Interfaces**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.ts`

### Async Patterns

```typescript
// ✅ Good: Semaphore wrapper
return semaphore.use(async () => {
  const result = await doWork();
  return result;
});

// ❌ Bad: Manual acquire/release
await semaphore.acquire();
try {
  const result = await doWork();
  return result;
} finally {
  semaphore.release();
}
```

---

## CLI Guidelines Compliance

This project follows [Command Line Interface Guidelines](https://clig.dev).

### Standard Flags (DO NOT CHANGE)

- `-h, --help` - Always shows help
- `--version` - Version to stdout
- `-v, --verbose` - Detailed progress to stderr
- `-q, --quiet` - Suppress all output except errors
- `--json` - Machine-readable JSON Lines output
- `--plain` - Stable line-based output (one path per line)

### Output Rules

1. **Primary data** → stdout
2. **Diagnostics/progress** → stderr
3. **TTY detection**: Auto-format for humans, stable for scripts
4. **NO_COLOR**: Respect environment variable
5. **Exit codes**:
   - `0` = all success
   - `1` = some failed
   - `2` = all failed or invalid args

### Stdin Handling

```bash
# Auto-detect when piped
cat urls.txt | og-screenshot

# Explicit stdin marker
og-screenshot - url1 url2  # Mix stdin + args
```

---

## Common Tasks

### Add New CLI Flag

```typescript
// 1. Add to cli.ts
program.option('--my-flag <value>', 'Description', defaultValue);

// 2. Add to ScreenshotOptions interface (types/index.ts)
export interface ScreenshotOptions {
  // ... existing
  myFlag: string;
}

// 3. Map in cli.ts main()
const options: ScreenshotOptions = {
  // ... existing
  myFlag: cliOptions.myFlag,
};

// 4. Use in relevant lib (e.g., screenshot.ts)
if (options.myFlag) {
  // ... implementation
}
```

### Add New Output Mode

```typescript
// 1. Add to OutputMode type (lib/output.ts)
export type OutputMode = 'default' | 'plain' | 'json' | 'my-mode';

// 2. Add CLI flag (cli.ts)
.option('--my-mode', 'My new output mode', false)

// 3. Implement in handleOutput() (lib/output.ts)
if (mode === 'my-mode') {
  // ... custom formatting
  return;
}

// 4. Update README.md examples
```

### Add New Screenshot Feature

```typescript
// 1. Add option to ScreenshotOptions (types/index.ts)
// 2. Implement in processUrl() (lib/screenshot.ts)
// 3. Update CLI flag (cli.ts)
// 4. Document in README.md
```

---

## Testing (Future)

```typescript
// Use Bun's built-in test runner
import { test, expect } from 'bun:test';

test('validateUrl rejects invalid URLs', () => {
  expect(validateUrl('invalid')).toBe(false);
  expect(validateUrl('https://valid.com')).toBe(true);
});
```

Run tests:
```bash
bun test
```

---

## Known Issues

### 1. GNotificationCenterDelegate Warning

**Symptom**: macOS warning about duplicate class implementations

**Cause**: Sharp + Canvas both bundle libgio

**Impact**: None (cosmetic warning only)

**Fix**: Not needed (upstream issue)

---

### 2. No Standalone Binary

**Why**: Playwright uses dynamic `require()` which Bun's `--compile` cannot bundle

**Workarounds**:
- Use `bun link` for global install
- Distribute via npm/bun package
- Use Docker container

See `BUILD.md` for details.

---

## Dependencies

### Core

- **playwright** (1.57+): Browser automation
- **sharp** (0.34+): Image processing (resize, composite)
- **canvas** (3.2+): Text rendering for footer
- **commander** (14+): CLI argument parsing

### Dev

- **@types/bun**: Bun TypeScript types
- **typescript**: Type checking

### Why These?

- **Playwright**: Best browser automation (official by Microsoft)
- **Sharp**: Fastest image processing (libvips)
- **Canvas**: Native text rendering (node-canvas)
- **Commander**: Battle-tested CLI parser

---

## Environment Variables

Currently supported:

- `NO_COLOR` - Disable colored/emoji output (standard)

Future (planned):

- `OG_SCREENSHOT_OUTPUT_DIR` - Default output directory
- `OG_SCREENSHOT_PARALLEL` - Default parallelism
- `OG_SCREENSHOT_TIMEOUT` - Default navigation timeout

---

## Debugging

### Verbose Mode

```bash
bun run dev --verbose https://example.com
```

Shows:
- Browser startup
- Page navigation
- Cookie banner detection
- Screenshot saving
- Footer generation

### Playwright in Headed Mode

```typescript
// src/lib/browser.ts
const browser = await chromium.launch({ 
  headless: false  // <-- Change this
});
```

### TypeScript Errors

```bash
bun run --bun tsc --noEmit  # Type check without build
```

---

## Performance Notes

### Concurrency

- Default: 10 parallel browser tabs
- Configurable: `--parallel N`
- Controlled by Semaphore (lib/semaphore.ts)

### Viewport Settings

- Default: 1200x2000 @ 0.8 scale
- Rationale: More content visible (smaller zoom)
- Resulting: ~960x1690px + 90px footer

---

## Git Workflow

### Branches

- `main` - Production-ready code
- Feature branches: `feat/my-feature`
- Bugfix branches: `fix/my-bug`

### Commit Messages

Follow Conventional Commits:

```
feat: add new screenshot mode
fix: correct URL validation regex
docs: update CLI examples
refactor: extract footer logic
```

---

## Future Enhancements

See `REFACTORING.md` for detailed roadmap.

**High Priority**:
- [ ] Test suite (unit + integration)
- [ ] Environment variable support
- [ ] Timeout configuration
- [ ] Config file (.og-screenshot.json)

**Low Priority**:
- [ ] Webhook callbacks
- [ ] S3 integration
- [ ] Browser session caching

---

## Support Resources

- **Playwright Docs**: https://playwright.dev/
- **Sharp Docs**: https://sharp.pixelplumbing.com/
- **Canvas API**: https://github.com/Automattic/node-canvas
- **CLI Guidelines**: https://clig.dev/
- **Bun Docs**: https://bun.sh/docs

---

## Agent Tips

When working on this codebase:

1. **Always** check existing patterns in other lib modules
2. **Never** use `any` - prefer `unknown` if unsure
3. **Follow** CLI guidelines for any new flags/output
4. **Test** both TTY and non-TTY modes
5. **Document** new features in README.md
6. **Validate** early (in input.ts, not during processing)
7. **Clean up** resources (browser context) on exit

---

**Last Updated**: 2026-01-08  
**Maintainer**: Pascal  
**Version**: 1.0.0
