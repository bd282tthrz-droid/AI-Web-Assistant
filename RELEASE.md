# Release Process

## Overview

This project is published as an npm package `@whitenight_5/web-assistant` and served via jsdelivr CDN:

```
https://cdn.jsdelivr.net/npm/@whitenight_5/web-assistant@{version}/dist/web-assistant.umd.js
https://cdn.jsdelivr.net/npm/@whitenight_5/web-assistant@{version}/dist/web-assistant.umd.css
https://cdn.jsdelivr.net/npm/@whitenight_5/web-assistant@{version}/dist/web-assistant-core.umd.js
https://cdn.jsdelivr.net/npm/@whitenight_5/web-assistant@{version}/dist/web-assistant-fab.umd.js
```

## Prerequisites

- Node.js 18+
- pnpm
- npm account (`whitenight_5`) with 2FA enabled
- Logged in: `npm login`

## Release Steps

### 1. Bump version

```bash
# Patch bump (0.0.4 → 0.0.5)
npm version patch

# Or manually specify version
npm version 0.0.5
```

### 2. Build and publish

```bash
# Build fab + core modes (generates dist/)
# Note: prepublishOnly script runs build:dist automatically before publish
npm publish

# If 2FA is enabled, follow the browser-based authentication prompt
# or pass OTP directly:
npm publish --otp=xxxxxx
```

### 3. Verify

```bash
# Check published version
npm view @whitenight_5/web-assistant

# Or check specific version
npm view @whitenight_5/web-assistant@0.0.5
```

Wait 1-2 minutes for jsdelivr to sync, then verify CDN URLs:

```
https://cdn.jsdelivr.net/npm/@whitenight_5/web-assistant@0.0.5/dist/web-assistant.umd.js
```

## Build Output

The `build:dist` command produces the following files in `dist/`:

| File | Size | Description |
|------|------|-------------|
| `web-assistant.umd.js` | ~1.2 MB | Main entry: React + assistant-ui + Tailwind bundled |
| `web-assistant.umd.css` | ~488 KB | Compiled styles (Tailwind + HeroUI) |
| `web-assistant-core.umd.js` | ~3.2 MB | Core package (on-demand loaded) |
| `web-assistant-fab.umd.js` | ~3 KB | Lightweight FAB bootstrap (no React) |
| `web-assistant-core.umd.css` | ~466 KB | Core styles |
| `embed-demo.html` | ~4 KB | Demo page referencing CDN files |

## Published Files

Only the `dist/` directory is published to npm (as specified in `package.json` `"files"` field).