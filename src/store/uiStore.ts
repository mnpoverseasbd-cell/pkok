import { useSyncExternalStore } from "react";

/**
 * Minimal dependency-free UI store for cross-component ephemeral state
 * (open modals, active drawer, mobile menu). Server state stays in
 * TanStack Query.
 */
type UIState = {
  loginModalOpen: boolean;
  mobileMenuOpen: boolean;
  activeSearchQuery: string;
};

const initial: UIState = {
  loginModalOpen: false,
  mobileMenuOpen: false,
  activeSearchQuery: "",
};

let state: UIState = initial;
const listeners = new Set<() => void>();

function setState(patch: Partial<UIState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

export const uiStore = {
  get: () => state,
  set: setState,
  subscribe: (l: () => void) => {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};

export function useUIStore<T>(selector: (s: UIState) => T): T {
  return useSyncExternalStore(
    uiStore.subscribe,
    () => selector(state),
    () => selector(initial),
  );
}
