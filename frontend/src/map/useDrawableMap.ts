/**
 * src/map/useDrawableMap.ts
 *
 * React hook that creates and manages an OpenLayers map with:
 *  - OSM tile base layer
 *  - Vector layer for polygon features
 *  - Draw interaction  (draw a single polygon)
 *  - Modify interaction (drag vertices of the drawn polygon)
 *  - Delete ability    (programmatic — called from toolbar)
 *
 * The hook manages one polygon at a time.
 * When a polygon is committed or modified it fires onGeometryChange
 * with the GeoJSON geometry (EPSG:4326).
 *
 * Usage:
 *   const { mapRef, mode, setMode, clearPolygon } = useDrawableMap({ onGeometryChange });
 */

import { useEffect, useRef, useCallback, useState } from "react";

import Map            from "ol/Map";
import View           from "ol/View";
import TileLayer      from "ol/layer/Tile";
import VectorLayer    from "ol/layer/Vector";
import VectorSource   from "ol/source/Vector";
import OSM            from "ol/source/OSM";
import Draw           from "ol/interaction/Draw";
import Modify         from "ol/interaction/Modify";
import Snap           from "ol/interaction/Snap";
import type { Feature as OLFeature } from "ol";
import type { Geometry } from "ol/geom";

import {
  INDIA_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  PROJECTION,
} from "./mapConstants";
import { polygonStyle, sketchStyle, modifyStyle } from "./mapStyles";
import { featureToGeoJSON, geoJSONToFeature } from "./geoJsonHelpers";
import type { GeoJSONGeometry } from "@/types/zones";

export type DrawMode = "idle" | "drawing" | "modifying";

interface UseDrawableMapOptions {
  /** Called every time the polygon geometry changes (draw complete or vertex drag). */
  onGeometryChange?: (geometry: GeoJSONGeometry | null) => void;
  /** Initial geometry to seed the map with (EPSG:4326). */
  initialGeometry?: GeoJSONGeometry | null;
}

interface UseDrawableMapReturn {
  /** Attach this ref to the map container <div>. */
  mapRef: React.RefObject<HTMLDivElement | null>;
  /** Current interaction mode. */
  mode: DrawMode;
  /** Switch the map between modes. */
  setMode: (mode: DrawMode) => void;
  /** Remove the polygon and reset to idle. */
  clearPolygon: () => void;
  /** True while an active polygon exists on the map. */
  hasPolygon: boolean;
}

export function useDrawableMap({
  onGeometryChange,
  initialGeometry,
}: UseDrawableMapOptions = {}): UseDrawableMapReturn {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<Map | null>(null);
  const sourceRef = useRef<VectorSource<OLFeature<Geometry>> | null>(null);
  const drawRef   = useRef<Draw | null>(null);
  const modRef    = useRef<Modify | null>(null);
  const snapRef   = useRef<Snap | null>(null);

  const [mode, setModeState] = useState<DrawMode>("idle");
  const [hasPolygon, setHasPolygon] = useState(false);

  const onGeometryChangeRef = useRef(onGeometryChange);
  useEffect(() => { onGeometryChangeRef.current = onGeometryChange; }, [onGeometryChange]);

  // ── Emit geometry whenever source changes ────────────────────────────────
  const emitGeometry = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return;
    const features = source.getFeatures();
    if (features.length === 0) {
      onGeometryChangeRef.current?.(null);
      setHasPolygon(false);
    } else {
      const gj = featureToGeoJSON(features[0]);
      onGeometryChangeRef.current?.(gj);
      setHasPolygon(true);
    }
  }, []);

  // ── Remove all interactions from map ────────────────────────────────────
  const removeInteractions = useCallback(() => {
    const map = mapInst.current;
    if (!map) return;
    [drawRef, modRef, snapRef].forEach((r) => {
      if (r.current) { map.removeInteraction(r.current); r.current = null; }
    });
  }, []);

  // ── Activate Draw interaction ────────────────────────────────────────────
  const activateDraw = useCallback(() => {
    const map    = mapInst.current;
    const source = sourceRef.current;
    if (!map || !source) return;

    removeInteractions();

    const draw = new Draw({
      source,
      type: "Polygon",
      style: sketchStyle,
    });

    draw.on("drawend", (evt) => {
      // Remove any previous polygon — one at a time rule
      const existing = source.getFeatures();
      existing.forEach((f) => {
        if (f !== evt.feature) source.removeFeature(f);
      });

      // Switch to modify mode after drawing
      setTimeout(() => {
        setModeState("modifying");
      }, 0);
    });

    map.addInteraction(draw);
    drawRef.current = draw;
  }, [removeInteractions]);

  // ── Activate Modify interaction ──────────────────────────────────────────
  const activateModify = useCallback(() => {
    const map    = mapInst.current;
    const source = sourceRef.current;
    if (!map || !source) return;

    removeInteractions();

    // Apply modify style to features
    source.getFeatures().forEach((f) => f.setStyle(modifyStyle));

    const modify = new Modify({ source });
    modify.on("modifyend", () => emitGeometry());

    const snap = new Snap({ source });

    map.addInteraction(modify);
    map.addInteraction(snap);
    modRef.current  = modify;
    snapRef.current = snap;
  }, [removeInteractions, emitGeometry]);

  // ── Restore idle (no interaction) ───────────────────────────────────────
  const activateIdle = useCallback(() => {
    removeInteractions();
    // Restore normal polygon style
    sourceRef.current?.getFeatures().forEach((f) => f.setStyle(polygonStyle));
  }, [removeInteractions]);

  // ── Expose setMode so toolbar can switch modes ───────────────────────────
  const setMode = useCallback(
    (next: DrawMode) => {
      setModeState(next);
      // Interaction activation happens via useEffect below
    },
    []
  );

  // ── React to mode changes ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current) return;
    if (mode === "drawing")   activateDraw();
    else if (mode === "modifying") activateModify();
    else activateIdle();
  }, [mode, activateDraw, activateModify, activateIdle]);

  // ── Clear polygon ────────────────────────────────────────────────────────
  const clearPolygon = useCallback(() => {
    sourceRef.current?.clear();
    emitGeometry();
    setModeState("idle");
  }, [emitGeometry]);

  // ── Initialise OL map (once) ─────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const source = new VectorSource<OLFeature<Geometry>>();
    sourceRef.current = source;

    // Seed with initial geometry if provided
    if (initialGeometry) {
      const f = geoJSONToFeature(initialGeometry);
      f.setStyle(polygonStyle);
      source.addFeature(f);
      setHasPolygon(true);
    }

    const vectorLayer = new VectorLayer({
      source,
      style: polygonStyle,
      zIndex: 10,
    });

    // Emit geometry when features are added
    source.on("addfeature", () => emitGeometry());
    source.on("removefeature", () => emitGeometry());

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        vectorLayer,
      ],
      view: new View({
        center:     INDIA_CENTER,
        zoom:       DEFAULT_ZOOM,
        minZoom:    MIN_ZOOM,
        maxZoom:    MAX_ZOOM,
        projection: PROJECTION,
      }),
    });

    mapInst.current = map;

    return () => {
      removeInteractions();
      map.setTarget(undefined);
      mapInst.current  = null;
      sourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { mapRef, mode, setMode, clearPolygon, hasPolygon };
}
