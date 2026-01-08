# Docker Usage Guide

## Quick Start

### Build the Image

```bash
docker build -t og-screenshot .
```

### Run a Single Screenshot

```bash
docker run --rm -v $(pwd)/output:/app/output og-screenshot https://example.com
```

---

## Using Docker Compose (Recommended)

### Basic Usage

```bash
# Single URL
docker-compose run --rm og-screenshot https://example.com

# Multiple URLs
docker-compose run --rm og-screenshot https://example.com https://another.com

# With flags
docker-compose run --rm og-screenshot --parallel 5 --verbose https://example.com

# From stdin
echo "https://example.com" | docker-compose run --rm og-screenshot
```

### Batch Processing from File

1. Create `urls.txt` with one URL per line:
```
https://example.com
https://another-site.com
https://third-site.com
```

2. Run batch service:
```bash
docker-compose up og-screenshot-batch
```

Or customize:
```bash
docker-compose run --rm og-screenshot --file urls.txt --parallel 10
```

---

## Docker Run Examples

### Basic Screenshot

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  https://facebook.com/post/123
```

### Verbose Mode

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  --verbose \
  https://example.com
```

### Custom Parallelism

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  -e OG_SCREENSHOT_PARALLEL=20 \
  og-screenshot \
  https://example.com
```

### JSON Output

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  --json \
  https://example.com
```

### Plain Output (for scripts)

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  --plain \
  https://example.com
```

### No Color Output

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  -e NO_COLOR=1 \
  og-screenshot \
  https://example.com
```

---

## Environment Variables

Set via `-e` flag or in `docker-compose.yml`:

| Variable | Default | Description |
|----------|---------|-------------|
| `OG_SCREENSHOT_OUTPUT_DIR` | `/app/output` | Output directory path |
| `OG_SCREENSHOT_PARALLEL` | `10` | Max parallel browser tabs |
| `OG_SCREENSHOT_TIMEOUT` | `30000` | Navigation timeout (ms) |
| `NO_COLOR` | `0` | Disable colored output |

Example:
```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  -e OG_SCREENSHOT_PARALLEL=5 \
  -e OG_SCREENSHOT_TIMEOUT=60000 \
  og-screenshot \
  https://slow-site.com
```

---

## Volume Mounts

### Output Directory (Required)

Always mount an output directory to persist screenshots:

```bash
-v $(pwd)/output:/app/output
```

Or use absolute path:
```bash
-v /Users/pascal/screenshots:/app/output
```

### Input File (Optional)

Mount a URLs file for batch processing:

```bash
-v $(pwd)/urls.txt:/app/urls.txt:ro
```

Then use:
```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/urls.txt:/app/urls.txt:ro \
  og-screenshot \
  --file /app/urls.txt
```

---

## Advanced Usage

### Stdin from Host

```bash
cat urls.txt | docker run --rm -i \
  -v $(pwd)/output:/app/output \
  og-screenshot
```

### Mix Stdin + Args

```bash
echo "https://first.com" | docker run --rm -i \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  - \
  https://second.com \
  https://third.com
```

### Dry Run

```bash
docker run --rm \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  --dry-run \
  https://example.com
```

### Show Config

```bash
docker run --rm og-screenshot --show-config
```

---

## Troubleshooting

### Permission Issues

If you get permission errors on output files:

```bash
# Linux: Use your UID/GID
docker run --rm \
  --user $(id -u):$(id -g) \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  https://example.com
```

### Browser Crashes

If Chromium crashes inside container:

```bash
# Increase shared memory
docker run --rm \
  --shm-size=2gb \
  -v $(pwd)/output:/app/output \
  og-screenshot \
  https://example.com
```

### Slow Performance

```bash
# Reduce parallelism
docker run --rm \
  -v $(pwd)/output:/app/output \
  -e OG_SCREENSHOT_PARALLEL=3 \
  og-screenshot \
  https://example.com
```

### Debug Container

Enter container for debugging:

```bash
docker run --rm -it \
  -v $(pwd)/output:/app/output \
  --entrypoint /bin/bash \
  og-screenshot
```

Then inside:
```bash
bun run src/cli.ts --verbose https://example.com
```

---

## Image Size Optimization

Current image size: ~1.2GB (due to Chromium)

To check:
```bash
docker images og-screenshot
```

### Multi-arch Build (Optional)

For ARM64 (Apple Silicon) + AMD64:

```bash
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t og-screenshot:latest \
  --load \
  .
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Screenshot Test

on: [push]

jobs:
  screenshot:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build Docker Image
        run: docker build -t og-screenshot .
      
      - name: Run Screenshot
        run: |
          docker run --rm \
            -v ${{ github.workspace }}/output:/app/output \
            og-screenshot \
            --json \
            https://example.com
      
      - name: Upload Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: output/*.png
```

### GitLab CI Example

```yaml
screenshot:
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t og-screenshot .
    - mkdir -p output
    - docker run --rm -v $(pwd)/output:/app/output og-screenshot https://example.com
  artifacts:
    paths:
      - output/
```

---

## Production Deployment

### Docker Registry

```bash
# Tag for registry
docker tag og-screenshot registry.example.com/og-screenshot:latest

# Push
docker push registry.example.com/og-screenshot:latest

# Pull and run on server
docker pull registry.example.com/og-screenshot:latest
docker run --rm -v /data/screenshots:/app/output \
  registry.example.com/og-screenshot:latest \
  https://example.com
```

### Kubernetes Deployment

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: og-screenshot-job
spec:
  template:
    spec:
      containers:
      - name: og-screenshot
        image: og-screenshot:latest
        args: ["https://example.com"]
        volumeMounts:
        - name: output
          mountPath: /app/output
        env:
        - name: OG_SCREENSHOT_PARALLEL
          value: "10"
      volumes:
      - name: output
        persistentVolumeClaim:
          claimName: screenshot-pvc
      restartPolicy: Never
```

---

## Comparison with Local Install

| Aspect | Docker | Local (Bun) |
|--------|--------|-------------|
| **Setup** | Build once | `bun install` |
| **Portability** | ✅ Works anywhere | Requires Bun + Playwright |
| **Performance** | ~5% slower | Native speed |
| **Disk Space** | ~1.2GB image | ~500MB node_modules |
| **Updates** | Rebuild image | `bun install` |
| **CI/CD** | ✅ Perfect fit | Requires Bun setup |

**Recommendation**:
- **Local development**: Use Bun directly (`bun run dev`)
- **CI/CD/Production**: Use Docker for consistency

---

## Next Steps

1. **Build the image**: `docker build -t og-screenshot .`
2. **Test locally**: `docker run --rm -v $(pwd)/output:/app/output og-screenshot https://example.com`
3. **Use docker-compose**: `docker-compose run --rm og-screenshot https://example.com`
4. **Deploy to production**: Push to registry or use Kubernetes

See `README.md` for CLI usage details.
