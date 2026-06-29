/**
 * src/contexts/AuthContext.tsx — Auth state provider.
 *
 * Persists access/refresh tokens in localStorage via tokenStorage.
 * Exposes user, isAuthenticated, isLoading, login, register, and logout.
 *
 * On mount, if an access token exists, /auth/me is called to rehydrate
 * the user object without requiring another login.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { authApi } from "@/api/auth";
import { tokenStorage } from "@/utils/token";
import type { User, LoginRequest, RegisterRequest } from "@/types/auth";

// ── Shape ──────────────────────────────────────────────────────────────────

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
}

// ── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // On mount: rehydrate from stored token
  useEffect(() => {
    const token = tokenStorage.getAccess();
    if (!token) {
      setIsLoading(false);
      return;
    }
    authApi
      .me()
      .then((res) => setUser(res.data.data))
      .catch(() => tokenStorage.clearAll())
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    const res = await authApi.login(credentials);
    const { access_token, refresh_token, user: authUser } = res.data.data;
    tokenStorage.setAccess(access_token);
    tokenStorage.setRefresh(refresh_token);
    setUser(authUser);
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authApi.register(data);
    // Registration doesn't auto-login; caller should redirect to /login.
  }, []);

  const logout = useCallback(() => {
    tokenStorage.clearAll();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: user !== null,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── Consumer hook ──────────────────────────────────────────────────────────

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used inside <AuthProvider>");
  }
  return ctx;
}
