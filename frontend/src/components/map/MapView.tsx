/**
 * src/components/map/DrawableMap.tsx
 *
 * Reusable OpenLayers map component with full polygon draw/edit/delete support.
 *
 * Props:
 *   onGeometryChange  — fires with GeoJSON geometry (EPSG:4326) on every change
 *   initialGeometry   — optional seed geometry to display on mount
 *   height            — CSS height of the map container (default "500px")
 *   className         — extra class names for the outer wrapper
 *
 * Usage:
 *   <DrawableMap onGeometryChange={(g) => setGeometry(g)} height="400px" />
 */

import type React from "react";
import { useDrawableMap } from "@/map/useDrawableMap";
import type { GeoJSONGeometry } from "@/types/zones";

interface DrawableMapProps {
  onGeometryChange?: (geometry: GeoJSONGeometry | null) => void;
  initialGeometry?:  GeoJSONGeometry | null;
  height?:           string;
  className?:        string;
  readOnly?:         boolean;
  /** Optional ref to receive the flyTo function after mount */
  flyToRef?:         React.MutableRefObject<((lon: number, lat: number, zoom?: number) => void) | null>;
}

export function DrawableMap({
  onGeometryChange,
  initialGeometry,
  height     = "500px",
  className  = "",
  readOnly   = false,
  flyToRef,
}: DrawableMapProps) {
  const { mapRef, mode, setMode, clearPolygon, hasPolygon, flyTo } = useDrawableMap({
    onGeometryChange,
    initialGeometry,
  });

  // Expose flyTo to parent via ref
  if (flyToRef) flyToRef.current = flyTo;

  return (
    <div className={`drawable-map-wrapper ${className}`} style={{ height }}>
      {/* ── Toolbar ─────────────────────────────────────────────────── */}
      {!readOnly && (
        <div className="map-toolbar" role="toolbar" aria-label="Map drawing tools">
          {/* Draw */}
          <button
            id="map-draw-btn"
            type="button"
            className={`map-tool-btn ${mode === "drawing" ? "map-tool-btn--active" : ""}`}
            onClick={() => setMode(mode === "drawing" ? "idle" : "drawing")}
            title={mode === "drawing" ? "Cancel drawing" : "Draw polygon"}
            aria-pressed={mode === "drawing"}
          >
            <span className="map-tool-icon" aria-hidden="true">✏️</span>
            <span className="map-tool-label">
              {mode === "drawing" ? "Cancel" : "Draw"}
            </span>
          </button>

          {/* Modify */}
          <button
            id="map-edit-btn"
            type="button"
            className={`map-tool-btn ${mode === "modifying" ? "map-tool-btn--active" : ""}`}
            onClick={() => setMode(mode === "modifying" ? "idle" : "modifying")}
            title={hasPolygon ? "Edit vertices" : "Draw a polygon first"}
            disabled={!hasPolygon}
            aria-pressed={mode === "modifying"}
          >
            <span className="map-tool-icon" aria-hidden="true">⬡</span>
            <span className="map-tool-label">
              {mode === "modifying" ? "Done" : "Edit"}
            </span>
          </button>

          {/* Delete */}
          <button
            id="map-delete-btn"
            type="button"
            className="map-tool-btn map-tool-btn--danger"
            onClick={clearPolygon}
            title="Delete polygon"
            disabled={!hasPolygon}
            aria-label="Delete polygon"
          >
            <span className="map-tool-icon" aria-hidden="true">🗑️</span>
            <span className="map-tool-label">Delete</span>
          </button>

          {/* Status chip */}
          <div className="map-status-chip" aria-live="polite">
            {mode === "drawing"   && "Click to place vertices · Double-click to close"}
            {mode === "modifying" && "Drag vertices to reshape · Click Done when finished"}
            {mode === "idle" && !hasPolygon && "Use Draw to define this zone's boundary"}
            {mode === "idle" && hasPolygon  && "Polygon saved ✓"}
          </div>
        </div>
      )}

      {/* ── Map canvas ──────────────────────────────────────────────── */}
      <div ref={mapRef} className="ol-map" style={{ height: readOnly ? "100%" : `calc(100% - 52px)` }} />
    </div>
  );
}
