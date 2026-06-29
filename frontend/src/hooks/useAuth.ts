/**
 * src/hooks/useAuth.ts — Auth state hook stub.
 *
 * Will be implemented with React Context in a future iteration.
 */

export function useAuth() {
  // TODO: Implement via AuthContext
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: async (_email: string, _password: string) => {},
    logout: () => {},
  };
}
