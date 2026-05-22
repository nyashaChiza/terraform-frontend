import * as SecureStore from 'expo-secure-store';
import { useSyncExternalStore } from 'react';

const KEYS = {
  token: 'auth_token',
  refresh_token: 'auth_refresh_token',
  token_type: 'auth_token_type',
  user: 'auth_user',
} as const;

export type AuthState = {
  token?: string | null;
  refresh_token?: string | null;
  token_type?: string | null;
  user?: any | null;
};

let state: AuthState = { token: null, refresh_token: null, token_type: 'Bearer', user: null };

// ── Subscriber list for reactive reads via useAuth() ─────────────────────────
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const notify = () => listeners.forEach(l => l());

/** Fire-and-forget: persist fields to SecureStore whenever they change. */
function persistAsync(patch: Partial<AuthState>): void {
  const persistField = (key: string, value: unknown) => {
    if (value === undefined) return;
    if (value === null || value === '') {
      SecureStore.deleteItemAsync(key).catch(() => {});
    } else {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      SecureStore.setItemAsync(key, stringValue).catch(() => {});
    }
  };

  if ('token' in patch) persistField(KEYS.token, patch.token);
  if ('refresh_token' in patch) persistField(KEYS.refresh_token, patch.refresh_token);
  if ('token_type' in patch) persistField(KEYS.token_type, patch.token_type);
  if ('user' in patch) persistField(KEYS.user, patch.user);
}

export const authStore = {
  get: () => state,

  /** Update state and notify all React subscribers. Persists to SecureStore. */
  set: (patch: Partial<AuthState>) => {
    state = { ...state, ...patch };
    persistAsync(patch);
    notify();
    return state;
  },

  /** Clear everything — used on logout / token revocation. */
  clear: () => {
    state = { token: null, refresh_token: null, token_type: 'Bearer', user: null };
    SecureStore.deleteItemAsync(KEYS.token).catch(() => {});
    SecureStore.deleteItemAsync(KEYS.refresh_token).catch(() => {});
    SecureStore.deleteItemAsync(KEYS.token_type).catch(() => {});
    SecureStore.deleteItemAsync(KEYS.user).catch(() => {});
    notify();
  },

  /** Read tokens + user persisted from a previous session and restore them. */
  hydrate: async (): Promise<void> => {
    try {
      const [token, refresh_token, token_type, userStr] = await Promise.all([
        SecureStore.getItemAsync(KEYS.token),
        SecureStore.getItemAsync(KEYS.refresh_token),
        SecureStore.getItemAsync(KEYS.token_type),
        SecureStore.getItemAsync(KEYS.user),
      ]);

      let user: any = null;
      if (userStr) {
        try {
          user = JSON.parse(userStr);
        } catch {
          // corrupted user data — clear it so we don't keep failing
          SecureStore.deleteItemAsync(KEYS.user).catch(() => {});
        }
      }

      state = {
        ...state,
        token: token ?? null,
        refresh_token: refresh_token ?? null,
        token_type: token_type ?? 'Bearer',
        user,
      };
      notify();
    } catch {
      // SecureStore unavailable (web / some simulators) — continue with no persisted auth
    }
  },

  subscribe,
};

/**
 * Reactive React hook — re-renders components when authStore changes.
 *
 *   const { token, user } = useAuth();
 *
 * Uses React 18's useSyncExternalStore so updates from outside React (like
 * the apiFetch 401-refresh flow) properly trigger re-renders.
 */
export function useAuth(): AuthState {
  return useSyncExternalStore(subscribe, authStore.get, authStore.get);
}
