# og-screenshot-grabber-js

TypeScript/Bun rewrite of the og-screenshot-grabber tool. Grab screenshots from URLs with automatic cookie banner handling and metadata footer.

## Features

- ✅ **Automated Cookie Handling**: Multi-frame detection for Facebook and other sites
- ✅ **Metadata Footer**: Adds timestamp and URL to screenshots
- ✅ **Parallel Processing**: Configurable concurrent browser tabs
- ✅ **Multiple Output Modes**: Human-readable, plain paths, or JSON
- ✅ **Viewport Configuration**: Custom size, scale, and full-page options
- ✅ **Single Executable**: Compile to standalone binary with `bun build --compile`

## Quick Start

### Installation

```bash
# Install dependencies
bun install

# Install Playwright browser (required once)
bun run install-browser
```

### Usage

```bash
# Development mode (no compilation needed)
bun run dev https://example.com

# Build single executable
bun run build

# Run compiled binary
./og-screenshot https://example.com
```

## CLI Reference

### Basic Usage

```bash
og-screenshot [OPTIONS] [URL...]
cat urls.txt | og-screenshot [OPTIONS]
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `-h, --help` | Show help | |
| `--version` | Show version | |
| `-o, --output <dir>` | Output directory | `output` |
| `--parallel <n>` | Max parallel browser tabs | `10` |
| `--timeout <ms>` | Navigation timeout in milliseconds | `45000` |
| `--width <n>` | Viewport width in pixels | `1200` |
| `--height <n>` | Viewport height in pixels | `2000` |
| `--scale <factor>` | Device scale factor (smaller = more content) | `0.8` |
| `--full-page` | Capture full page instead of viewport only | `false` |
| `--plain` | Output only PNG paths (one per line) | `false` |
| `--json` | Output JSON Lines format | `false` |
| `-q, --quiet` | No output except errors | `false` |
| `-v, --verbose` | Show detailed progress | `false` |

### Examples

```bash
# Single URL
./og-screenshot https://facebook.com/post123

# Multiple URLs
./og-screenshot url1 url2 url3

# From stdin (pipe-friendly)
cat urls.txt | ./og-screenshot
echo "https://example.com" | ./og-screenshot

# Script mode (only paths for parsing)
./og-screenshot --plain url1 url2 > paths.txt

# JSON output for processing
./og-screenshot --json url1 | jq -r '.png'

# Custom output directory
./og-screenshot -o ./screenshots url1

# Taller viewport (more content)
./og-screenshot --height 3000 url1

# More content via zoom (50% scale)
./og-screenshot --scale 0.5 url1

# Custom size
./og-screenshot --width 1920 --height 1080 url1

# Full page capture
./og-screenshot --full-page url1

# Legacy OG-Image format (1200x630)
./og-screenshot --height 630 --scale 1.0 url1

# Verbose debugging
./og-screenshot --verbose url1

# Quiet mode (only errors)
./og-screenshot --quiet url1 url2

# Combine options
cat urls.txt | ./og-screenshot --parallel 20 --quiet --plain > results.txt

# Timeout for slow sites
./og-screenshot --timeout 120000 https://slow-site.com

# Environment variable defaults
export OG_SCREENSHOT_PARALLEL=20
export OG_SCREENSHOT_TIMEOUT=60000
./og-screenshot url1 url2
```

## Output Modes

### Default (Human-readable)

```
[1/3] ➡ https://example.com... ✅ output/abc123.png
[2/3] ➡ https://example2.com... ✅ output/def456.png
[3/3] ➡ https://bad-url.com... ❌ Navigation timeout
---
✅ 2 success  ❌ 1 failed
```

### `--plain` (Script-friendly)

```
output/abc123.png
output/def456.png
```

Perfect for piping:
```bash
./og-screenshot --plain url1 url2 | xargs -I {} cp {} /backup/
```

### `--json` (Machine-readable)

```json
{"status":"success","url":"https://example.com","finalUrl":"https://example.com/","png":"output/abc123.png","json":"output/abc123.json","timestamp":"2026-01-08T00:00:00Z","uuid":"abc123"}
{"status":"error","url":"https://bad-url.com","error":"Navigation timeout"}
```

Process with `jq`:
```bash
./og-screenshot --json url1 url2 | jq -r 'select(.status=="success") | .png'
```

## Exit Codes

- `0` - All URLs processed successfully
- `1` - Some URLs failed
- `2` - All URLs failed or invalid arguments

Use in scripts:
```bash
if ./og-screenshot --quiet url1 url2; then
  echo "All screenshots captured"
else
  echo "Some failed (exit code: $?)"
fi
```

## Output Structure

Each URL generates two files:

```
output/
├── abc123def456.png      # Screenshot with footer
└── abc123def456.json     # Metadata
```

### JSON Metadata Format

```json
{
  "uuid": "abc123def456",
  "timestamp": "2026-01-08T00:00:00Z",
  "url": "https://www.example.com/actual-page",     
  "input_url": "https://example.com/redirect",       
  "visibleHTML": "<html>...</html>",
  "image_filename": "abc123def456.png"
}
```

## Technical Details

### Viewport Configuration

- **Default**: 1200x2000px with Scale 0.8
- **Scale 0.8**: Smaller text → more content fits
- **Resulting Resolution**: ~960x1690px (1600px viewport + 90px footer)

### Cookie Handling

- Searches **all frames** (important for Facebook iframes)
- German + English button texts
- Two passes: "initial" + "final" (800ms apart)
- Continues if no banner found

### Footer

- 90px high footer bar
- Timestamp (UTC) + final URL
- Gray background (`#F5F5F5`)

## Project Structure

```
og-screenshot-grabber-js/
├── src/
│   ├── cli.ts                  # CLI entry point
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   └── lib/
│       ├── browser.ts          # Browser context setup
│       ├── cookies.ts          # Cookie banner handling
│       ├── footer.ts           # Image footer generation
│       ├── screenshot.ts       # Core screenshot logic
│       ├── semaphore.ts        # Concurrency control
│       ├── input.ts            # URL input handling
│       └── output.ts           # Result output formatting
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Run in dev mode
bun run dev https://example.com

# Build executable
bun run build

# Install browser (one-time)
bun run install-browser
```

## Comparison with Python Version

| Feature | Python UV | TypeScript/Bun |
|---------|-----------|----------------|
| **Single File** | ✅ UV inline script | ✅ Compiled binary |
| **Performance** | Python async | ✅ Bun (faster) |
| **Image Processing** | Pillow | Sharp + Canvas |
| **Playwright** | ✅ Native | ✅ Native |
| **Lockfile** | uv.lock | bun.lockb |
| **Modular Code** | Single file | ✅ Modular + compiled |

## Environment Variables

Configure defaults via environment variables. CLI flags take precedence.

| Variable | Description | Default |
|----------|-------------|---------|
| `NO_COLOR` | Disable colored/emoji output | (not set) |
| `OG_SCREENSHOT_OUTPUT_DIR` | Default output directory | `output` |
| `OG_SCREENSHOT_PARALLEL` | Default parallel browser tabs | `10` |
| `OG_SCREENSHOT_TIMEOUT` | Default navigation timeout (ms) | `45000` |
| `OG_SCREENSHOT_WIDTH` | Default viewport width | `1200` |
| `OG_SCREENSHOT_HEIGHT` | Default viewport height | `2000` |

**Example**:
```bash
export OG_SCREENSHOT_PARALLEL=20
export OG_SCREENSHOT_TIMEOUT=60000
og-screenshot url1 url2  # Uses env var defaults
og-screenshot --parallel 5 url  # CLI flag overrides env var
```

## Troubleshooting

### Playwright browser not found

```bash
bun run install-browser
```

### Canvas/Sharp build errors

Ensure native dependencies:
```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Linux
apt-get install libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

## License

MIT
