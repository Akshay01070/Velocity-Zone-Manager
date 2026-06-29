/**
 * src/types/property.ts — Property domain types (mirrors backend schema).
 */

export interface Property {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
}

export interface CreatePropertyRequest {
  name: string;
  address?: string;
}

export interface UpdatePropertyRequest {
  name?: string;
  address?: string;
}

/** Shape returned by GET /properties/:id/zones/summary */
export interface ZoneSummary {
  totalZones: number;
  totalArea: number;
  totalMowers: number;
  understaffedCount: number;
}
