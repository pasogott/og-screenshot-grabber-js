# GitHub Actions Workflows

This directory contains CI/CD workflows for the og-screenshot-grabber-js project.

## Workflows

### 1. CI (`ci.yml`)

**Triggers**: Push/PR to `main` or `development`

**Jobs**:
- **lint**: TypeScript type checking and linting
- **test**: Functional test with example.com screenshot
- **build**: Verify package and CLI

**Artifacts**: Test screenshots (7 days retention)

---

### 2. Docker Build & Test (`docker-build.yml`)

**Triggers**: 
- Push to `main`/`development`
- Tags `v*.*.*`
- Pull requests
- Manual dispatch

**Jobs**:
- **build**: Build Docker image with Buildx
- Push to GitHub Container Registry (ghcr.io)
- Test image functionality
- Multi-platform support (AMD64)

**Registry**: `ghcr.io/${{ github.repository }}`

**Tags**:
- `latest` (main branch)
- `v1.0.0` (semver tags)
- `main-abc1234` (commit SHA)
- `pr-123` (pull requests)

**Artifacts**: Test screenshots

---

### 3. Release (`release.yml`)

**Triggers**: Git tags `v*.*.*`

**Jobs**:

#### create-release
- Generate changelog from commits
- Create GitHub Release with notes
- Include installation instructions

#### docker-release
- Build multi-platform image (AMD64 + ARM64)
- Push to GitHub Container Registry
- Tag as `v1.0.0` and `latest`
- Test released image

---

## Usage

### Running CI locally

```bash
# Lint
bun run --bun tsc --noEmit

# Functional test
mkdir -p output
bun run src/cli.ts --json https://example.com
```

### Testing Docker build

```bash
# Build
docker build -t og-screenshot-test .

# Test
mkdir -p output
docker run --rm -v $(pwd)/output:/app/output og-screenshot-test https://example.com
```

---

## Creating a Release

1. **Update version** in `package.json`
2. **Update CHANGELOG.md**
3. **Commit changes**:
   ```bash
   git add package.json CHANGELOG.md
   git commit -m "chore: bump version to 1.0.1"
   ```

4. **Create tag**:
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

5. **Automated actions**:
   - ✅ CI runs
   - ✅ Docker image built (AMD64 + ARM64)
   - ✅ Pushed to ghcr.io
   - ✅ GitHub Release created

6. **Verify release**:
   ```bash
   docker pull ghcr.io/$USER/og-screenshot-grabber-js:v1.0.1
   docker run --rm ghcr.io/$USER/og-screenshot-grabber-js:v1.0.1 --version
   ```

---

## GitHub Container Registry

### Public Package

Make package public (required once):
1. Go to https://github.com/users/$USER/packages
2. Find `og-screenshot-grabber-js`
3. Package Settings → Change visibility → Public

### Pull Image

```bash
# Latest
docker pull ghcr.io/$USER/og-screenshot-grabber-js:latest

# Specific version
docker pull ghcr.io/$USER/og-screenshot-grabber-js:v1.0.0

# Use in docker-compose
services:
  og-screenshot:
    image: ghcr.io/$USER/og-screenshot-grabber-js:latest
    volumes:
      - ./output:/app/output
```

---

## Badges

Add to main README.md:

```markdown
![CI](https://github.com/$USER/og-screenshot-grabber-js/workflows/CI/badge.svg)
![Docker](https://github.com/$USER/og-screenshot-grabber-js/workflows/Docker%20Build%20%26%20Test/badge.svg)
![Release](https://github.com/$USER/og-screenshot-grabber-js/workflows/Release/badge.svg)
```

---

## Secrets Required

### GitHub Token
Automatically provided by GitHub Actions (`${{ secrets.GITHUB_TOKEN }}`).

No additional secrets needed for basic setup.

### Optional: Docker Hub

To also push to Docker Hub, add secrets:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`

Then add to `docker-build.yml`:
```yaml
- name: Log in to Docker Hub
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

---

## Troubleshooting

### Build fails with "bun: not found"

Ensure Dockerfile installs Bun correctly. Our Dockerfile uses `oven/bun:1-debian` which includes Bun.

### Permission denied on ghcr.io

1. Check workflow permissions:
   - Settings → Actions → General → Workflow permissions
   - Enable "Read and write permissions"

2. Make package public (see above)

### Multi-arch build hangs

QEMU can be slow for ARM64 on AMD64 runners. Consider:
- Using native ARM64 runners (GitHub larger runners)
- Building separately per platform
- Accepting longer build times (~10-15 min)

---

## Performance Optimization

### Cache Dependencies

Workflows use GitHub Actions cache (`cache-from: type=gha`):
- Subsequent builds are faster (~2-3 min)
- First build: ~8-10 min (includes Playwright install)

### Parallel Jobs

CI workflow runs `lint`, `test`, `build` in parallel where possible.

### Conditional Workflows

- PRs: Run CI + Docker build (no push)
- Main branch: Run CI + Docker build + push
- Tags: Run all workflows + create release

---

## Future Improvements

- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Code coverage reporting
- [ ] Performance benchmarks
- [ ] Security scanning (Snyk, Trivy)
- [ ] Automated dependency updates (Dependabot)
- [ ] Publish to npm registry
- [ ] Matrix testing (multiple Node/Bun versions)
