/**
 * src/api/auth.ts — Auth API calls.
 */

import { apiClient } from "./client";
import type { LoginRequest, LoginResponse, RegisterRequest, User } from "@/types/auth";

interface DataEnvelope<T> {
  data: T;
}

export const authApi = {
  register: (body: RegisterRequest) =>
    apiClient.post<DataEnvelope<{ message: string }>>("/auth/signup", body),

  login: (body: LoginRequest) =>
    apiClient.post<DataEnvelope<LoginResponse>>("/auth/login", body),

  refresh: () =>
    apiClient.post<DataEnvelope<{ access_token: string }>>("/auth/refresh"),

  me: () => apiClient.get<DataEnvelope<User>>("/auth/me"),
};
