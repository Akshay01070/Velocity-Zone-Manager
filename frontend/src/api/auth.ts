/**
 * src/api/auth.ts — Auth API service stubs.
 *
 * Business logic will be implemented in a future iteration.
 */

import { apiClient } from "./client";
import type { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/auth";

export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<{ message: string }>("/auth/register", data),

  login: (data: LoginRequest) =>
    apiClient.post<LoginResponse>("/auth/login", data),

  refresh: () =>
    apiClient.post<{ access_token: string }>("/auth/refresh"),

  me: () => apiClient.get<User>("/auth/me"),
};
