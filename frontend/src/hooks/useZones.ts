/**
 * src/hooks/useZones.ts — Zones data hook stub.
 *
 * Will be implemented with data-fetching logic in a future iteration.
 */

import type { Zone } from "@/types/zones";

export function useZones() {
  // TODO: Implement with useEffect + zonesApi
  const zones: Zone[] = [];
  return {
    zones,
    isLoading: false,
    error: null as Error | null,
    refetch: async () => {},
  };
}
