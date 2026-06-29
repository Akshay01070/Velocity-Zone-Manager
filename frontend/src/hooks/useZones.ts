/**
 * src/hooks/useZones.ts — Fetch zones for a given property.
 */

import { useState, useEffect, useCallback } from "react";
import { zonesApi } from "@/api/zones";
import type { Zone } from "@/types/zones";

interface UseZonesResult {
  zones: Zone[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useZones(propertyId: string): UseZonesResult {
  const [zones, setZones] = useState<Zone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    if (!propertyId) return;
    setIsLoading(true);
    setError(null);
    zonesApi
      .list(propertyId)
      .then((res) => setZones(res.data.data.zones))
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load zones.";
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, [propertyId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { zones, isLoading, error, refetch: fetch };
}
