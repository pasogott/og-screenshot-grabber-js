# og-screenshot-grabber-js Dockerfile
# Multi-stage build for optimized image size

# Build stage
FROM oven/bun:1-debian AS builder

WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package.json bun.lock ./

# Install dependencies
RUN bun install --frozen-lockfile --production

# Runtime stage
FROM oven/bun:1-debian

WORKDIR /app

# Install Playwright system dependencies
# Uses Playwright's official dependency list for Debian
RUN apt-get update && \
    apt-get install -y \
    # Chromium dependencies
    libnss3 \
    libnspr4 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdrm2 \
    libdbus-1-3 \
    libxkbcommon0 \
    libatspi2.0-0 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libgbm1 \
    libpango-1.0-0 \
    libcairo2 \
    libasound2 \
    # Additional dependencies for Sharp/Canvas
    libvips42 \
    libglib2.0-0 \
    libexpat1 \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy source code
COPY package.json bun.lock tsconfig.json ./
COPY src ./src

# Install Playwright browsers (chromium only)
# Install as root but set PLAYWRIGHT_BROWSERS_PATH to shared location
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN bunx playwright install chromium --with-deps && \
    chmod -R 755 /ms-playwright

# Create output directory with proper permissions
# Note: This will be overridden by volume mount, but sets default
RUN mkdir -p /app/output && chmod 777 /app/output

# Set default environment variables
ENV OG_SCREENSHOT_OUTPUT_DIR=/app/output
ENV OG_SCREENSHOT_PARALLEL=10
ENV NODE_ENV=production

# Note: We don't switch to non-root user because output directory
# needs write permissions which can vary with volume mounts
# If security is critical, mount volume with correct permissions

# Default output directory as volume
VOLUME ["/app/output"]

# Health check (optional)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD bun --version || exit 1

# Entry point
ENTRYPOINT ["bun", "run", "src/cli.ts"]

# Default help command
CMD ["--help"]
