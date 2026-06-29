/**
 * src/types/property.ts — Property domain types (mirrors backend schema).
 */

export type PropertyType =
  | "Golf Course"
  | "Airport"
  | "Corporate Campus"
  | "Other";

export const PROPERTY_TYPES: PropertyType[] = [
  "Golf Course",
  "Airport",
  "Corporate Campus",
  "Other",
];

export interface Property {
  id: string;
  name: string;
  type: PropertyType;
  total_acreage: number | null;
  notes: string | null;
  user_id: string;
  zone_count: number;
}

export interface CreatePropertyRequest {
  name: string;
  type: PropertyType;
  total_acreage?: number | null;
  notes?: string | null;
}

export interface UpdatePropertyRequest {
  name?: string;
  type?: PropertyType;
  total_acreage?: number | null;
  notes?: string | null;
}

export interface PropertyListParams {
  search?: string;
  type?: PropertyType | "";
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

/** Shape returned by GET /properties/:id/zones/summary */
export interface ZoneSummary {
  totalZones: number;
  totalArea: number;
  totalMowers: number;
  understaffedCount: number;
}
