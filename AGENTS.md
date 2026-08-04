# AGENTS.md

Pharmacy management SPA for Farmacias Melbo (Guatemala). React 18 + TypeScript + Vite + Tailwind, Firebase backend.

## Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build → dist/
npm run lint         # ESLint (--max-warnings 0, zero warnings allowed)
npm run test         # Vitest in watch mode
npm run test:run     # Vitest single run
```

Functions (separate package in `functions/`):
```bash
cd functions && npm install
cd functions && npm run build   # tsc
cd functions && npm run deploy  # firebase deploy --only functions
```

Deploy hosting: `npm run build && firebase deploy --only hosting`

## Gotchas

- **Firebase config is hardcoded** in `src/config/firebase.ts` (not env vars). Do not commit secrets; the project ID is `melbosys`.
- **Path alias**: `@` → `./src` (configured in both `vite.config.ts` and `vitest.config.ts`).
- **Lint is strict**: `--max-warnings 0` means any warning fails the build. Fix all warnings before committing.
- **No `.eslintrc` file** — ESLint runs via CLI flags only (`--ext ts,tsx`). Plugins like `@typescript-eslint` are installed but not explicitly configured; lint coverage may be limited.
- **Timezone**: Guatemala (UTC-6) is hardcoded in `functions/src/index.ts` and `src/lib/timezone.ts`. All date logic assumes Guatemala time.
- **Only 2 test files exist** (`src/utils/format.test.ts`, `src/features/products/productValidation.test.ts`). Test infrastructure is set up but sparse.
- **`functions/`** has its own `package.json`, `node_modules`, and `tsconfig.json`. It uses Node 22 runtime and Firebase Admin SDK. Do not install root-level deps for functions.

## Architecture

- **Single-package SPA** — not a monorepo. `functions/` is a separate Firebase Cloud Functions package.
- **Feature modules** in `src/features/` — each domain (auth, products, sales, reports, stats, users, promotions, audit, notifications) has its own `pages/`, `components/`, and `services/`.
- **Shared UI** in `src/components/` (layout, base components like `BaseModal`, `Pagination`).
- **Firestore services** in `src/lib/api.ts` — all API calls go through Firestore directly (no REST backend).
- **Auth**: Firebase Auth with three roles — `admin`, `admin_ubicacion`, `employee`. Role gating in `ProtectedRoute` component.
- **Routing**: `react-router-dom` v6 with role-based route guards. All routes except `/login` are protected.
- **Firebase Cloud Functions**: Scheduled functions that auto-create/close daily reports per ubicacion at midnight/Guatemala time.

## Conventions

- UI language is **Spanish** — component names, page labels, Firestore field names, user-facing strings.
- Firestore data model uses **subcollections**: `ubicaciones/{id}/reports/{id}`, `ubicaciones/{id}/products/{id}`.
- Charts use **Nivo** (`@nivo/bar`, `@nivo/line`), not Recharts (despite README).
- Tailwind custom tokens: `primary-*` (indigo), `surface-*`, custom shadows (`card`, `elevated`, `glow`), custom animations.
- Font: Inter.
