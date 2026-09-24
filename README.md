# Web Assistant

AI-powered chat widget for websites. Built with React + Assistant UI + Dify.

## Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server for local development |
| `pnpm build` | Full TypeScript check + production build |
| `pnpm build:lib` | Build library mode (UMD bundle) |
| `pnpm build:fab` | Build FAB entry (lightweight floating button, loads core on demand) |
| `pnpm build:core` | Build core chat widget |
| `pnpm build:dist` | Build both FAB + core for production distribution |
| `pnpm lint` | Run Oxlint code analysis |
| `pnpm preview` | Preview production build |
| `pnpm postinstall` | Apply patch-package patches after install |

### Build Modes

- **`fab`** — Floating Action Button entry point. Lightweight script loaded on every page. Handles FAB button rendering, form field detection, and dynamic loading of the core bundle.
- **`core`** — Full React chat widget. Loaded on demand when the user clicks the FAB or triggers an action. Contains the conversation UI, tool execution, and form fill capabilities.
- **`dist`** — Combined production bundle (fab + core).

## Tech Stack

| Technology | Purpose |
|-----------|---------|
| React 19 | UI Framework |
| TypeScript 6 | Type Safety |
| HeroUI v3 | UI Components |
| Assistant UI | AI Chat UI Components |
| Dify | AI Backend (SSE streaming) |
| Vite | Build Tool |
| Tailwind CSS v4 | Styling |

## Environment Variables

Create `.env.local` file:

```
VITE_DIFY_API_KEY=app-xxxxxxxxxxxxxxxxx
VITE_DIFY_APP_ID=your-app-id
```
