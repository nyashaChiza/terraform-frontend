export type profileState = {
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  height?: number | null;
  weight?: number | null;
};

let state: profileState = { first_name: null, last_name: null, gender: null, height: null, weight: null };
export const ProfileStore = {
  get: () => state,
  set: (patch: Partial<profileState>) => {
    state = { ...state, ...patch };
    return state;
  },
};
