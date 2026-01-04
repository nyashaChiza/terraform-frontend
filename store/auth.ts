export type AuthState = {
  token?: string | null;
  user?: any | null;
};

let state: AuthState = { token: null, user: null };

export const authStore = {
  get: () => state,
  set: (patch: Partial<AuthState>) => {
    state = { ...state, ...patch };
    return state;
  },
};
