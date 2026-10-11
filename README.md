# TaskFlow Projects — SaaS Project Management Dashboard

A responsive project management app with five screens: Dashboard, Projects, Project Details, Tasks and Settings. All data is mock data persisted in `localStorage`; there is no backend or real authentication.

## Setup

```bash
npm install        # install dependencies (creates/uses package-lock.json)
npm run dev        # start dev server (http://localhost:8080)
npm run test       # run unit tests (Vitest)
npm run build      # production build
npm run lint       # ESLint
```

The project uses **npm** as its package manager (Windows-friendly); no Bun setup is required.

## Architecture

- **Framework:** React 19 + TypeScript + Vite + Tailwind CSS v4 (plain client-side SPA, no server framework).
  Routing uses **TanStack Router** with the root route, child routes, route tree, router creation, and TypeScript registration centralized in `src/router.tsx`, mounted via `RouterProvider` in `src/main.tsx`. Page components are imported directly from `src/pages/`; no file-based routing, TanStack Start, lazy loading, or Suspense is used.
- `src/lib/pm.ts` — domain types, seed data, validation, pure reducer, safe parsing of persisted data. Framework-free and unit tested.
- `src/lib/store.tsx` — React context + `useReducer`; hydrates from and writes to `localStorage`.
- `src/components/pm/` — reusable UI: `AppShell` (responsive nav), `ui.tsx` (Panel, Pill, ProgressBar, Field, EmptyState, LoadingState…), `forms.tsx` (Project/Task dialogs), `TaskTable`.
- `src/pages/` — `Dashboard`, `Projects`, `ProjectDetails`, `Tasks`, `Settings`; wired to URLs in `src/router.tsx`.

## Assumptions

- Single user workspace; team members are fixed mock data.
- Project progress = share of its tasks with status _Done_.
- A task is overdue when not done and its due date is before today.
- Seed dates are generated relative to the first visit so the dashboard always looks realistic.

## Known limitations

- Data lives only in the current browser; “Reset sample data” in Settings restores the seed.
- Projects cannot be deleted (not required); deleting tasks asks for confirmation.
- Filters are not reflected in the URL.
- Tests cover domain logic and routing, not full browser flows.

See [TECHNICAL_NOTE.md](./TECHNICAL_NOTE.md) for state management and trade-offs.
