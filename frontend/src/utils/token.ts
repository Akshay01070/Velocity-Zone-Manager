/**
 * src/utils/token.ts — JWT storage helpers.
 *
 * All token reads/writes go through these helpers so that the storage key
 * lives in exactly one place and is easy to swap (e.g. sessionStorage).
 */

const ACCESS_KEY = "vzm_access_token";
const REFRESH_KEY = "vzm_refresh_token";

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  setAccess: (token: string): void => localStorage.setItem(ACCESS_KEY, token),
  removeAccess: (): void => localStorage.removeItem(ACCESS_KEY),

  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setRefresh: (token: string): void =>
    localStorage.setItem(REFRESH_KEY, token),
  removeRefresh: (): void => localStorage.removeItem(REFRESH_KEY),

  clearAll: (): void => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
