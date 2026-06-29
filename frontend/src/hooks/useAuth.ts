/**
 * src/hooks/useAuth.ts — Convenience re-export of AuthContext consumer.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 */

export { useAuthContext as useAuth } from "@/contexts/AuthContext";
