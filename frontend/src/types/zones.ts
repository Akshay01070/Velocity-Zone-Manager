/**
 * src/types/zones.ts — Velocity Zone domain types (mirrors backend schema).
 */

/** GeoJSON Geometry stored as JSONB */
export interface GeoJSONGeometry {
  type: "Polygon" | "MultiPolygon" | "Point" | string;
  coordinates: unknown;
  /** Numeric area in m² if set by the backend */
  area?: number;
}

export type ZoneType = "Fairway" | "Rough" | "Perimeter" | "Exclusion";
export type ZoneStatus = "Active" | "Inactive";

export interface Zone {
  id: string;
  name: string;
  type: ZoneType;
  status: ZoneStatus;
  mower_count: number;
  geometry: GeoJSONGeometry;
  property_id: string;
  created_at: string;
  /** Computed by backend: true when area > mower_count * 2 */
  understaffed?: boolean;
}

export interface CreateZoneRequest {
  name: string;
  type: ZoneType;
  status?: ZoneStatus;
  mower_count: number;
  geometry: GeoJSONGeometry;
}

export interface UpdateZoneRequest {
  name?: string;
  type?: ZoneType;
  status?: ZoneStatus;
  mower_count?: number;
  geometry?: GeoJSONGeometry;
}

/** GeoJSON FeatureCollection returned by the export endpoint */
export interface ZoneFeature {
  type: "Feature";
  properties: {
    name: string;
    type: ZoneType;
    status: ZoneStatus;
    mower_count: number;
  };
  geometry: GeoJSONGeometry;
}

export interface ZoneFeatureCollection {
  type: "FeatureCollection";
  features: ZoneFeature[];
}

/** Per-feature validation error returned by POST /zones/import */
export interface ImportFeatureError {
  featureIndex: number;
  errors: string[];
}

/** Shape of the error.message when the backend returns 400 on /import */
export interface ImportValidationErrors {
  features?: ImportFeatureError[];
  [key: string]: unknown;
}

/** Successful 201 response body from POST /zones/import */
export interface ImportZonesResponse {
  imported: number;
  zones: Zone[];
}
