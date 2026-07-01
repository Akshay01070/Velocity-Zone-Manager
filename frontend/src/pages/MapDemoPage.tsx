/**
 * src/pages/MapDemoPage.tsx
 *
 * Zone Boundary Editor sandbox page.
 * Route: /map  (protected, visible in sidebar)
 *
 * Features:
 *  - Full-height DrawableMap for polygon draw/edit
 *  - Location search bar (OpenStreetMap Nominatim) to jump to any place
 */

import { useRef, useState, type FormEvent } from "react";
import { DrawableMap } from "@/components/map/MapView";

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function MapDemoPage() {
  const flyToRef = useRef<((lon: number, lat: number, zoom?: number) => void) | null>(null);

  const [query, setQuery]         = useState("");
  const [results, setResults]     = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;

    setSearching(true);
    setSearchError(null);
    setResults([]);

    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en", "User-Agent": "VelocityZoneManager/1.0" },
      });
      if (!res.ok) throw new Error("Search failed");
      const data: NominatimResult[] = await res.json();
      setResults(data);
      setShowResults(true);
      if (data.length === 0) setSearchError("No locations found. Try a different search.");
    } catch {
      setSearchError("Search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  }

  function handleSelectResult(result: NominatimResult) {
    flyToRef.current?.(parseFloat(result.lon), parseFloat(result.lat), 14);
    setQuery(result.display_name);
    setShowResults(false);
    setResults([]);
  }

  return (
    <div className="map-demo-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="map-demo-header">
        <div>
          <h2 className="properties-title">Zone Boundary Editor</h2>
          <p className="properties-subtitle">
            Draw, reshape, and delete polygon boundaries. Search for a location to navigate the map.
          </p>
        </div>
      </div>

      {/* ── Location Search ─────────────────────────────────────────── */}
      <div className="map-search-bar-wrap">
        <form id="map-location-search-form" onSubmit={handleSearch} className="map-search-form">
          <div className="map-search-input-wrap">
            <span className="map-search-icon" aria-hidden="true">🔍</span>
            <input
              id="map-location-search-input"
              type="search"
              className="map-search-input"
              placeholder="Search for a city, address, or landmark…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (showResults) setShowResults(false);
              }}
              autoComplete="off"
            />
            <button
              id="map-search-submit"
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={searching || !query.trim()}
            >
              {searching ? "…" : "Go"}
            </button>
          </div>

          {/* Results dropdown */}
          {showResults && results.length > 0 && (
            <ul className="map-search-results" role="listbox" id="map-search-results-list">
              {results.map((r, i) => (
                <li
                  key={i}
                  role="option"
                  aria-selected={false}
                  className="map-search-result-item"
                  onClick={() => handleSelectResult(r)}
                >
                  <span className="map-search-result-icon" aria-hidden="true">📍</span>
                  <span className="map-search-result-text">{r.display_name}</span>
                </li>
              ))}
            </ul>
          )}

          {searchError && (
            <p className="map-search-error" role="alert">{searchError}</p>
          )}
        </form>
      </div>

      {/* ── Map ────────────────────────────────────────────────────── */}
      <div className="map-demo-map-wrap">
        <DrawableMap
          flyToRef={flyToRef}
          height="100%"
        />
      </div>
    </div>
  );
}
