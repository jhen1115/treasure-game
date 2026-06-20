# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install      # install dependencies
npm run dev      # start dev server at http://localhost:3000 (opens browser automatically)
npm run build    # production build → output in build/
```

There is no test suite or lint command configured.

## Architecture

This is a single-page React + TypeScript app built with Vite. The main source files are `src/App.tsx`, `src/api.ts`, and `src/components/AuthScreen.tsx`.

### User flow

The `user` state in `App.tsx` drives the top-level render:
- `null` → renders `<AuthScreen>` (sign in / sign up / guest choice)
- `'guest'` → game is shown; scores are not persisted
- `{ token, username }` → game is shown; scores are saved to the backend and history is displayed on game end

The token is persisted to `localStorage` under the key `treasureUser` and restored on mount.

### API layer (`src/api.ts`)

All network calls go through `src/api.ts`, which proxies to `/api` (expected to be provided by a backend or Vite dev proxy). Endpoints used:
- `POST /api/auth/signup` / `POST /api/auth/login` — returns `{ token, username }`
- `POST /api/scores` — saves a completed game (requires `Authorization: Bearer <token>`)
- `GET /api/scores/me` — fetches the authenticated user's score history

### Game mechanics

3 treasure chests are rendered; one randomly contains treasure. Clicking a chest opens it (+$100 for treasure, −$50 for skeleton). The game ends when the treasure chest is found or all boxes are opened. On game end, authenticated users have their score saved automatically and a history panel appears.

### Key directories

- `src/assets/` — chest and key PNG images imported directly into `App.tsx`
- `src/audios/` — MP3 sound effects (`chest_open.mp3`, `chest_open_with_evil_laugh.mp3`)
- `src/components/ui/` — shadcn/ui component library (auto-generated, treat as read-only)
- `src/components/figma/` — `ImageWithFallback.tsx`, a wrapper that shows a placeholder SVG on image load error
- `src/styles/globals.css` — CSS custom properties defining the design token system (colors, radius, typography)
- `src/results/` — result images (e.g. `key_hover.png`)

**Path alias:** `@` resolves to `src/` (configured in `vite.config.ts`).

**Styling:** Tailwind CSS v4 with shadcn/ui. Design tokens are defined as CSS custom properties in `src/styles/globals.css` and bridged into Tailwind via `@theme inline`. Dark mode is supported via the `.dark` class.

**Animations:** Uses `motion/react` (the React entry point of the Motion library) for chest open/hover animations.

**Form handling:** `AuthScreen` uses `react-hook-form` for validation (username min 3 chars, password min 6 chars on signup).

**Vite config notes:** The `vite.config.ts` contains version-pinned aliases for every dependency — this is generated tooling boilerplate. The build output directory is `build/` (not the default `dist/`).
