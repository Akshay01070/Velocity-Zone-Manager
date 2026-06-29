/**
 * src/types/zones.ts — Velocity Zone domain types (mirrors backend schema).
 */

/** GeoJSON Geometry stored as JSONB */
export interface GeoJSONGeometry {
  type: "Polygon" | "MultiPolygon" | "Point" | string;
  coordinates: unknown;
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
