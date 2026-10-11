import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import { createSeed, reducer, sanitizeState, type Action, type AppState } from "./pm";

export const STORAGE_KEY = "pm-dashboard:v1";

interface StoreValue {
  state: AppState;
  ready: boolean;
  dispatch: (a: Action) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

// State lives in a single reducer; it is hydrated from localStorage after mount
// (avoids SSR hydration mismatch) and written back on every change.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, undefined, () => createSeed());
  const [ready, setReady] = useState(false);
  const skipFirstWrite = useRef(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw)
        rawDispatch({ type: "hydrate", state: sanitizeState(JSON.parse(raw), createSeed()) });
    } catch {
      toast.error("Saved data could not be read, so sample data was restored.");
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      toast.error("Changes could not be saved on this device.");
    }
  }, [state, ready]);

  const dispatch = useCallback((a: Action) => rawDispatch(a), []);
  const resetData = useCallback(() => rawDispatch({ type: "reset", state: createSeed() }), []);

  const value = useMemo(
    () => ({ state, ready, dispatch, resetData }),
    [state, ready, dispatch, resetData],
  );
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}

export function useMember(id: string | null | undefined) {
  const { state } = useStore();
  return state.members.find((m) => m.id === id) ?? null;
}
