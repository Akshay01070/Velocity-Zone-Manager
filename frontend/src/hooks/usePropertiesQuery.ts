/**
 * src/hooks/usePropertiesQuery.ts — React Query hooks for properties CRUD.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { propertiesApi } from "@/api/properties";
import type {
  CreatePropertyRequest,
  UpdatePropertyRequest,
  PropertyListParams,
} from "@/types/property";

export const PROPERTIES_KEY = ["properties"] as const;

/** List properties with optional search/type/pagination params. */
export function usePropertiesList(params?: PropertyListParams) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, params],
    queryFn: () => propertiesApi.list(params).then((r) => r.data.data),
    placeholderData: keepPreviousData,
  });
}

/** Fetch a single property by ID. */
export function useProperty(id: string) {
  return useQuery({
    queryKey: [...PROPERTIES_KEY, id],
    queryFn: () => propertiesApi.get(id).then((r) => r.data.data.property),
    enabled: !!id,
  });
}

/** Create a new property. */
export function useCreateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePropertyRequest) =>
      propertiesApi.create(body).then((r) => r.data.data.property),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
    },
  });
}

/** Update an existing property. */
export function useUpdateProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: string;
      body: UpdatePropertyRequest;
    }) => propertiesApi.update(id, body).then((r) => r.data.data.property),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
    },
  });
}

/** Delete a property. */
export function useDeleteProperty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      propertiesApi.delete(id).then((r) => r.data.data.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: PROPERTIES_KEY });
    },
  });
}
