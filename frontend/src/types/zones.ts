/**
 * src/types/zones.ts — Velocity Zone domain types.
 */

/** GeoJSON Geometry (simplified for our use case) */
export interface GeoJSONGeometry {
  type: "Polygon" | "MultiPolygon";
  coordinates: number[][][] | number[][][][];
}

export interface Zone {
  id: string;
  name: string;
  description: string | null;
  geometry: GeoJSONGeometry;
  speed_limit_kmh: number;
  is_active: boolean;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateZoneRequest {
  name: string;
  description?: string;
  geometry: GeoJSONGeometry;
  speed_limit_kmh: number;
}

export interface UpdateZoneRequest {
  name?: string;
  description?: string;
  geometry?: GeoJSONGeometry;
  speed_limit_kmh?: number;
  is_active?: boolean;
}
