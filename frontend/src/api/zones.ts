/**
 * src/api/zones.ts — Zones API calls.
 *
 * Zones are nested under properties: /api/v1/properties/:propertyId/zones
 */

import { apiClient } from "./client";
import type {
  Zone,
  CreateZoneRequest,
  UpdateZoneRequest,
  ZoneFeatureCollection,
  ImportZonesResponse,
} from "@/types/zones";

interface DataEnvelope<T> {
  data: T;
}

const base = (propertyId: string) => `/properties/${propertyId}/zones`;

export const zonesApi = {
  list: (propertyId: string) =>
    apiClient.get<DataEnvelope<{ property_id: string; zones: Zone[] }>>(
      `${base(propertyId)}/`
    ),

  create: (propertyId: string, body: CreateZoneRequest) =>
    apiClient.post<DataEnvelope<{ zone: Zone }>>(
      `${base(propertyId)}/`,
      body
    ),

  update: (propertyId: string, zoneId: string, body: UpdateZoneRequest) =>
    apiClient.put<DataEnvelope<{ zone: Zone }>>(
      `${base(propertyId)}/${zoneId}`,
      body
    ),

  delete: (propertyId: string, zoneId: string) =>
    apiClient.delete<DataEnvelope<{ message: string }>>(
      `${base(propertyId)}/${zoneId}`
    ),

  /**
   * Bulk-import zones from a GeoJSON FeatureCollection.
   * Returns the list of created zones + import count.
   */
  import: (propertyId: string, featureCollection: ZoneFeatureCollection) =>
    apiClient.post<DataEnvelope<ImportZonesResponse>>(
      `${base(propertyId)}/import`,
      featureCollection
    ),

  /**
   * Export all zones as a downloadable GeoJSON Blob.
   * Using responseType: "blob" so the browser can trigger Save-As.
   */
  exportBlob: (propertyId: string) =>
    apiClient.get<Blob>(`${base(propertyId)}/export`, {
      responseType: "blob",
    }),

  /** Returns parsed GeoJSON FeatureCollection (for programmatic use). */
  export: (propertyId: string) =>
    apiClient.get<ZoneFeatureCollection>(
      `${base(propertyId)}/export`,
      { responseType: "json" }
    ),
};
