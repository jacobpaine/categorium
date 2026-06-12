/**
 * Debug mode toggle. Enabled by `?debug=true` in the URL (and sticky for the session via
 * sessionStorage). `?debug=false` turns it off. Drives the dev unlock + the DebugPanel.
 */
import { create } from 'zustand';

const KEY = 'categorium-debug';

function initialEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  const q = new URLSearchParams(window.location.search).get('debug');
  if (q === 'true') {
    sessionStorage.setItem(KEY, '1');
    return true;
  }
  if (q === 'false') {
    sessionStorage.removeItem(KEY);
    return false;
  }
  return sessionStorage.getItem(KEY) === '1';
}

type DebugState = {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export const useDebugStore = create<DebugState>((set) => ({
  enabled: initialEnabled(),
  setEnabled: (enabled) => {
    if (typeof window !== 'undefined') {
      if (enabled) sessionStorage.setItem(KEY, '1');
      else sessionStorage.removeItem(KEY);
    }
    set({ enabled });
  },
}));
