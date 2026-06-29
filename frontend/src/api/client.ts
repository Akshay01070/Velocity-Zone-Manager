/**
 * src/api/client.ts — Axios instance.
 *
 * All API calls use this client so that:
 *  - The base URL is consistent across environments (VITE_API_BASE_URL)
 *  - Bearer tokens are injected automatically via request interceptor
 *  - 401 responses redirect to /login and clear stored tokens
 */

import axios, { type InternalAxiosRequestConfig } from "axios";
import { tokenStorage } from "@/utils/token";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Request interceptor — attach Bearer token ──────────────────────────────
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = tokenStorage.getAccess();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor — handle 401 globally ────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenStorage.clearAll();
      // Navigate to login without a hard reload so SPA state is preserved.
      // The router's ProtectedRoute will also redirect when auth state updates.
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);
