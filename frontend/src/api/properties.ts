/**
 * src/api/properties.ts — Properties API calls.
 *
 * Routes mirror the backend: /api/v1/properties
 */

import { apiClient } from "./client";
import type {
  Property,
  CreatePropertyRequest,
  UpdatePropertyRequest,
  ZoneSummary,
} from "@/types/property";

/** Backend wraps data in { data: ... } */
interface DataEnvelope<T> {
  data: T;
}

export const propertiesApi = {
  list: () =>
    apiClient.get<DataEnvelope<{ properties: Property[] }>>("/properties/"),

  get: (id: string) =>
    apiClient.get<DataEnvelope<{ property: Property }>>(`/properties/${id}`),

  create: (body: CreatePropertyRequest) =>
    apiClient.post<DataEnvelope<{ property: Property }>>("/properties/", body),

  update: (id: string, body: UpdatePropertyRequest) =>
    apiClient.put<DataEnvelope<{ property: Property }>>(
      `/properties/${id}`,
      body
    ),

  delete: (id: string) =>
    apiClient.delete<DataEnvelope<{ message: string }>>(`/properties/${id}`),

  summary: (id: string) =>
    apiClient.get<DataEnvelope<ZoneSummary>>(
      `/properties/${id}/zones/summary`
    ),
};
