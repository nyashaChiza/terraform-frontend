import * as SecureStore from 'expo-secure-store';

const KEYS = {
  token: 'auth_token',
  refresh_token: 'auth_refresh_token',
  token_type: 'auth_token_type',
} as const;

export type AuthState = {
  token?: string | null;
  refresh_token?: string | null;
  token_type?: string | null;
  user?: any | null;
};

let state: AuthState = { token: null, refresh_token: null, token_type: 'Bearer', user: null };

/** Fire-and-forget: persist token fields to SecureStore whenever they change. */
function persistAsync(patch: Partial<AuthState>): void {
  if (patch.token !== undefined) {
    patch.token
      ? SecureStore.setItemAsync(KEYS.token, patch.token).catch(() => {})
      : SecureStore.deleteItemAsync(KEYS.token).catch(() => {});
  }
  if (patch.refresh_token !== undefined) {
    patch.refresh_token
      ? SecureStore.setItemAsync(KEYS.refresh_token, patch.refresh_token).catch(() => {})
      : SecureStore.deleteItemAsync(KEYS.refresh_token).catch(() => {});
  }
  if (patch.token_type !== undefined) {
    patch.token_type
      ? SecureStore.setItemAsync(KEYS.token_type, patch.token_type).catch(() => {})
      : SecureStore.deleteItemAsync(KEYS.token_type).catch(() => {});
  }
}

export const authStore = {
  get: () => state,

  set: (patch: Partial<AuthState>) => {
    state = { ...state, ...patch };
    persistAsync(patch);
    return state;
  },

  /** Read tokens persisted from a previous session and restore them into memory. */
  hydrate: async (): Promise<void> => {
    try {
      const [token, refresh_token, token_type] = await Promise.all([
        SecureStore.getItemAsync(KEYS.token),
        SecureStore.getItemAsync(KEYS.refresh_token),
        SecureStore.getItemAsync(KEYS.token_type),
      ]);
      state = {
        ...state,
        token: token ?? null,
        refresh_token: refresh_token ?? null,
        token_type: token_type ?? 'Bearer',
      };
    } catch {
      // SecureStore unavailable (web / some simulators) — continue with no persisted auth
    }
  },
};
