/**
 * src/api/zones.ts — Zones API service stubs.
 *
 * Business logic will be implemented in a future iteration.
 */

import { apiClient } from "./client";
import type { Zone, CreateZoneRequest, UpdateZoneRequest } from "@/types/zones";

export const zonesApi = {
  list: () => apiClient.get<Zone[]>("/zones/"),

  get: (id: string) => apiClient.get<Zone>(`/zones/${id}`),

  create: (data: CreateZoneRequest) =>
    apiClient.post<Zone>("/zones/", data),

  update: (id: string, data: UpdateZoneRequest) =>
    apiClient.put<Zone>(`/zones/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<{ message: string }>(`/zones/${id}`),
};
