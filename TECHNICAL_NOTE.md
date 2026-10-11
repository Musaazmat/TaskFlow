# Technical note

## State management

One `useReducer` store exposed through React context (`StoreProvider`). Every change is an explicit action (`task/create`, `project/update`, …) handled by a pure reducer in `src/lib/pm.ts`, so updates are predictable and unit testable. The reducer also appends activity entries, which feed the dashboard's “Recent activity”.

## Data flow

1. Store initialises with seed data so server render and first client render match.
2. After mount it reads `localStorage`, runs `sanitizeState` (drops/repairs malformed records, falls back to seed), and dispatches `hydrate`. Until then screens show a loading skeleton.
3. Every state change is serialised back to `localStorage`; write failures surface as a toast.
4. Screens derive everything (counts, progress, overdue, filters, sorting) from the store with `useMemo` — no duplicated derived state.
5. Forms keep local draft state, validate with shared pure validators on submit, show inline errors (linked via `aria-describedby`) plus a toast, then dispatch.

## Trade-offs

- **Context + reducer vs. a library** (Redux/Zustand/React Query): enough for this size and avoids dependencies; a whole-tree re-render on change is acceptable here.
- **localStorage vs. a mock API:** simplest way to persist across refreshes; no simulated latency or network errors beyond read/write failures.
- **Native `<select>`** for filters and forms: best keyboard/screen-reader support with zero extra code.
- **CSS bar charts** instead of a chart library: lighter and fully accessible as text lists.
