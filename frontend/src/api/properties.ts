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
  PropertyListParams,
  PaginationMeta,
  ZoneSummary,
} from "@/types/property";

/** Backend wraps data in { data: ... } */
interface DataEnvelope<T> {
  data: T;
}

export const propertiesApi = {
  list: (params?: PropertyListParams) => {
    const query: Record<string, string | number> = {};
    if (params?.search) query.search = params.search;
    if (params?.type) query.type = params.type;
    if (params?.page) query.page = params.page;
    if (params?.limit) query.limit = params.limit;
    return apiClient.get<
      DataEnvelope<{ properties: Property[]; pagination: PaginationMeta }>
    >("/properties/", { params: query });
  },

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
