/**
 * src/hooks/useZonesQuery.ts — React Query hooks for zones CRUD.
 *
 * Mirrors the pattern in usePropertiesQuery.ts.
 * All mutations invalidate the zones list automatically.
 */

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { zonesApi } from "@/api/zones";
import type {
  CreateZoneRequest,
  UpdateZoneRequest,
  ZoneFeatureCollection,
} from "@/types/zones";

export const zonesKey = (propertyId: string) =>
  ["zones", propertyId] as const;

/** List all zones for a property. */
export function useZonesList(propertyId: string) {
  return useQuery({
    queryKey: zonesKey(propertyId),
    queryFn: () =>
      zonesApi.list(propertyId).then((r) => r.data.data.zones),
    enabled: !!propertyId,
  });
}

/** Create a zone inside a property. */
export function useCreateZone(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateZoneRequest) =>
      zonesApi.create(propertyId, body).then((r) => r.data.data.zone),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zonesKey(propertyId) });
    },
  });
}

/** Update an existing zone. */
export function useUpdateZone(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ zoneId, body }: { zoneId: string; body: UpdateZoneRequest }) =>
      zonesApi.update(propertyId, zoneId, body).then((r) => r.data.data.zone),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zonesKey(propertyId) });
    },
  });
}

/** Delete a zone. */
export function useDeleteZone(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (zoneId: string) =>
      zonesApi.delete(propertyId, zoneId).then((r) => r.data.data.message),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zonesKey(propertyId) });
    },
  });
}

/**
 * Bulk-import zones from a GeoJSON FeatureCollection.
 * On success, invalidates the zone list so the map refreshes.
 */
export function useImportZones(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (fc: ZoneFeatureCollection) =>
      zonesApi.import(propertyId, fc).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: zonesKey(propertyId) });
    },
  });
}

/**
 * Export zones as a downloadable .geojson file.
 * Triggers a browser Save-As dialog using a temporary object URL.
 */
export function useExportZones(propertyId: string, propertyName?: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await zonesApi.exportBlob(propertyId);
      const blob = res.data as Blob;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName = (propertyName ?? propertyId)
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_-]/g, "");
      a.href = url;
      a.download = `zones_${safeName}.geojson`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
  });
}
