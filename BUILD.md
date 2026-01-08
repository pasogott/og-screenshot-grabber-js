# Build & Distribution Notes

## Why No Compiled Binary?

Playwright is too complex for Bun's `--compile` feature:
- Uses dynamic `require()` for browser binaries
- Has native dependencies (chromium-bidi, electron stubs)
- Loads browser executables at runtime

## Distribution Options

### Option 1: Bun Link (Recommended for Development)

```bash
# In project directory
bun link

# Now use globally
og-screenshot https://example.com
```

**Pros**: Fast, uses project dependencies
**Cons**: Requires Bun installed on target system

---

### Option 2: NPM/Bun Package

Publish to npm registry:

```bash
bun publish
```

Users install:
```bash
bun add -g og-screenshot-grabber-js
# or
npm install -g og-screenshot-grabber-js
```

**Pros**: Standard distribution
**Cons**: Requires npm/bun on user system

---

### Option 3: Docker Container (Recommended for Production)

A production-ready `Dockerfile` is included with multi-stage build and optimized layer caching.

**Build:**
```bash
docker build -t og-screenshot .
```

**Run:**
```bash
# Single URL
docker run --rm -v $(pwd)/output:/app/output og-screenshot https://example.com

# Or use docker-compose
docker-compose run --rm og-screenshot https://example.com

# Test the setup
./docker-test.sh
```

**Pros**: 
- Fully self-contained, works anywhere
- No Bun/Node.js required on host
- Perfect for CI/CD
- Optimized multi-stage build

**Cons**: 
- Requires Docker
- ~1.2GB image size (due to Chromium)

📖 **See [DOCKER.md](DOCKER.md)** for detailed usage, environment variables, and CI/CD examples.

---

### Option 4: Bundler + Shell Wrapper

Create a shell wrapper:

```bash
#!/bin/sh
# og-screenshot
exec bun run /path/to/og-screenshot-grabber-js/src/cli.ts "$@"
```

Install to `/usr/local/bin`:
```bash
chmod +x og-screenshot
sudo mv og-screenshot /usr/local/bin/
```

**Pros**: Simple, works anywhere with Bun
**Cons**: Requires Bun, path hardcoded

---

## Recommended Setup for Users

### macOS/Linux

```bash
# Clone repo
git clone https://github.com/user/og-screenshot-grabber-js.git
cd og-screenshot-grabber-js

# Install dependencies
bun install

# Install browser
bun run install-browser

# Link globally
bun link

# Use anywhere
og-screenshot https://example.com
```

### Windows

```powershell
# Clone repo
git clone https://github.com/user/og-screenshot-grabber-js.git
cd og-screenshot-grabber-js

# Install dependencies  
bun install

# Install browser
bun run install-browser

# Run directly
bun run src/cli.ts https://example.com

# Or create alias
New-Alias -Name og-screenshot -Value "bun run $PWD\src\cli.ts"
```

---

## Why Not Single Binary Solutions?

### pkg (Node.js)
- Doesn't support ESM well
- Playwright issues similar to Bun

### deno compile
- Would require full rewrite to Deno runtime
- Playwright has no official Deno support

### nexe
- Same issues as pkg
- Unmaintained

---

## Future: WebAssembly Build?

Theoretically possible with:
1. Playwright WASM port (doesn't exist yet)
2. Browser automation via WebDriver BiDi (emerging standard)

Currently not practical.

---

## Bottom Line

**For now**: Use Bun directly with `bun link` or Docker for distribution.

The trade-off:
- ✅ Fast development (TypeScript + Bun)
- ✅ Modular codebase
- ✅ Full Playwright features
- ❌ No standalone binary
