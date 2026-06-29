/**
 * src/pages/MapDemoPage.tsx
 *
 * Demonstration / sandbox page for the DrawableMap component.
 * Route: /map  (protected, visible in sidebar)
 *
 * Shows:
 *  - DrawableMap at full height
 *  - Live GeoJSON output panel underneath
 */

import { useState } from "react";
import { DrawableMap } from "@/components/map/MapView";
import type { GeoJSONGeometry } from "@/types/zones";

export function MapDemoPage() {
  const [geometry, setGeometry] = useState<GeoJSONGeometry | null>(null);
  const [copied, setCopied] = useState(false);

  const geoJsonText = geometry
    ? JSON.stringify(geometry, null, 2)
    : null;

  function handleCopy() {
    if (!geoJsonText) return;
    navigator.clipboard.writeText(geoJsonText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="map-demo-page">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="map-demo-header">
        <div>
          <h2 className="properties-title">Zone Boundary Editor</h2>
          <p className="properties-subtitle">
            Draw, reshape, and delete polygon boundaries. Geometry is stored as
            GeoJSON (EPSG:4326).
          </p>
        </div>
        {geometry && (
          <span className="map-geometry-badge">
            ✅ Polygon captured
          </span>
        )}
      </div>

      {/* ── Map ────────────────────────────────────────────────────── */}
      <div className="map-demo-map-wrap">
        <DrawableMap
          onGeometryChange={setGeometry}
          height="100%"
        />
      </div>

      {/* ── GeoJSON output ─────────────────────────────────────────── */}
      <div className="map-geojson-panel">
        <div className="map-geojson-header">
          <span className="map-geojson-label">GeoJSON Output (React state)</span>
          {geometry ? (
            <button
              id="copy-geojson-btn"
              className="btn btn-ghost btn-sm"
              onClick={handleCopy}
            >
              {copied ? "✓ Copied" : "Copy JSON"}
            </button>
          ) : null}
        </div>
        <pre className="map-geojson-pre">
          {geoJsonText ?? (
            <span className="map-geojson-empty">
              No polygon drawn yet. Use the Draw tool above.
            </span>
          )}
        </pre>
      </div>
    </div>
  );
}
