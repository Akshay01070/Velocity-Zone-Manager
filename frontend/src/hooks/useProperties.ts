/**
 * src/hooks/useProperties.ts — Fetch and manage the user's properties list.
 */

import { useState, useEffect, useCallback } from "react";
import { propertiesApi } from "@/api/properties";
import type { Property } from "@/types/property";

interface UsePropertiesResult {
  properties: Property[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useProperties(): UsePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(() => {
    setIsLoading(true);
    setError(null);
    propertiesApi
      .list()
      .then((res) => setProperties(res.data.data.properties))
      .catch((err: unknown) => {
        const msg =
          err instanceof Error ? err.message : "Failed to load properties.";
        setError(msg);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { properties, isLoading, error, refetch: fetch };
}
