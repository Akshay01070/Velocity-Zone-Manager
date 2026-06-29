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

  /** Returns a downloadable GeoJSON FeatureCollection. */
  export: (propertyId: string) =>
    apiClient.get<ZoneFeatureCollection>(
      `${base(propertyId)}/export`,
      { responseType: "json" }
    ),
};
