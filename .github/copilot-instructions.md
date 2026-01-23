# AI Agent Instructions for Azure DevOps PR Customization Extension

## Project Overview
This is a browser extension (Chrome/Firefox) that automates Azure DevOps pull request completion by:
1. Detecting the PR completion dialog on dev.azure.com
2. Enabling the "Customize merge commit message" checkbox
3. Removing the default "Merged PR #:" prefix from the commit title

**Key distribution:** Chrome Web Store, Firefox Add-ons marketplace | **Manifest v3**

## Architecture

### Three-Part Extension Design
- **[src/background.ts](src/background.ts)**: Service worker handling permissions and dynamic content script registration
- **[src/client.ts](src/client.ts)**: Content script injected into Azure DevOps pages, implements DOM mutation watching and UI automation
- **[src/common.ts](src/common.ts)**: Shared types for messaging between background and client

### Data Flow
1. User clicks extension icon → `background.ts` requests permission for `dev.azure.com/*` URLs
2. On permission grant, content script ([src/client.ts](src/client.ts)) injects via `executeScript()`
3. Client observes DOM mutations and tracks state machine: `-` (idle) → `pr` (on PR page) → `dg` (dialog detected) → `rm` (completed)
4. When ready to automate, interval polling begins; on success, automation stops and state reverts

### Cross-Browser Compatibility
- Uses `webextension-polyfill` for unified API
- [src/manifest.json](src/manifest.json) uses template variables: `{{chrome}}` and `{{firefox}}` processed by Vite
- Separate builds: `build:chrome` and `build:firefox` controlled by `BROWSER` env var in Vite

## Build & Release Process

**Build commands** (from [package.json](package.json)):
```bash
npm run build:chrome    # Compile TS → dist/chrome
npm run build:firefox   # Compile TS → dist/firefox  
npm run start          # Full pipeline: lint → format → build all → package
npm run start:chrome   # Chrome only
```

**Pipeline steps:**
1. ESLint + Prettier (pre-commit code quality)
2. TypeScript compilation
3. Vite bundling (manifest injection, dynamic permissions registration)
4. web-ext packaging (creates `.zip` artifacts in `web-ext-artifacts/`)

**Key tools:** Vite handles manifest generation via `generateManifest()` in [vite.config.ts](vite.config.ts); `vite-plugin-web-extension` manages browser-specific builds.

## Code Patterns & Conventions

### DOM Selection Strategy
Uses ARIA attributes and roles for stable selectors (resilient to Azure DevOps UI changes):
- Dialog detection: `div[role='dialog'][aria-modal='true'][aria-labelledby]`
- Checkbox: `div[role='checkbox'][aria-checked]`
- Input: `input[aria-label='Title']`

Avoid class/id selectors—these frequently change on SaaS platforms.

### State Machine States
Defined in [src/common.ts](src/common.ts):
- `-`: Not on PR page or no dialog
- `pr`: On PR page, no dialog yet
- `dg`: Dialog visible, waiting for automation
- `rm`: Automation complete (remove message)

### Async/Promise Patterns
Uses `.catch()` for error handling in background script; content script disconnects observer on permission revocation.

### Message Protocol
Single message type for background ↔ client communication:
```typescript
{command: 'set-state', state: State}
```

Extend [src/common.ts](src/common.ts) if adding new message types.

## TypeScript & Linting

- **Strict mode enabled** in [tsconfig.json](tsconfig.json)
- **ESLint config** ([eslint.config.mjs](eslint.config.mjs)): `@eslint/js` + `typescript-eslint` strict + stylistic rules
- **No external frontend libraries** (no React, Vue, etc.) — browser API only
- Target: `ESNext` (modern Chrome/Firefox)

**Note:** `// NOSONARCHECK` comments in [src/background.ts](src/background.ts) suppress SonarCloud warnings for intentional patterns.

## Critical Integration Points

- **Host permissions:** Initially optional; becomes `dev.azure.com/*` (and on-prem URLs) after user consent
- **Content script injection:** Two paths: automatic via registered scripts OR manual via action click
- **Permissions lifecycle:** `onAdded`/`onRemoved` listeners trigger re-registration
- **Azure DevOps URL parsing:** Regex pattern in `getOrigin()` ([src/background.ts](src/background.ts) line ~45) extracts organization + project; URL must match PR page pattern

## Common Tasks

**Adding new automation steps:** Extend `next()` function ([src/client.ts](src/client.ts) line ~22); add new state if needed.

**Supporting on-premises Azure DevOps:** Already supported via optional host permissions; ensure URL regex in `getOrigin()` matches your domain pattern.

**Testing locally:** After `npm run build:chrome`, load `dist/chrome/` as unpacked extension in Chrome dev mode. Use `console.debug()` (shows in extension DevTools) for logging.

## Dependencies

- **webextension-polyfill**: Unifies Chrome/Firefox WebExtension APIs
- **Vite**: Build bundler + manifest templating
- **TypeScript/ESLint**: Code quality
- **web-ext**: Official Mozilla tool for packaging and linting
