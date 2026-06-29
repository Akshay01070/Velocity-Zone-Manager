/**
 * src/map/useZoneMap.ts
 *
 * React hook that creates an OpenLayers map capable of rendering and editing
 * MULTIPLE zone polygons loaded from the API.
 *
 * Responsibilities:
 *  - OSM base tile layer
 *  - Vector layer for all zone Features
 *  - Parse zone geometries using ol/format/GeoJSON
 *  - Select interaction: click a polygon to select it
 *  - Modify interaction: drag vertices of the selected polygon
 *  - Draw interaction: draw a brand-new polygon
 *  - Zoom map to the extent of all zones (falls back to India if none)
 *  - Expose getZoneGeometry(zoneId) so callers can retrieve updated geometry
 *
 * Feature convention:
 *   Every OL Feature carries:
 *     feature.set("zoneId", zone.id)  for existing zones
 *     feature.set("zoneId", "__new__") for the in-progress drawn polygon
 */

import { useEffect, useRef, useCallback, useState } from "react";

import Map          from "ol/Map";
import View         from "ol/View";
import TileLayer    from "ol/layer/Tile";
import VectorLayer  from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import OSM         from "ol/source/OSM";
import Draw        from "ol/interaction/Draw";
import Modify      from "ol/interaction/Modify";
import Snap        from "ol/interaction/Snap";
import Select      from "ol/interaction/Select";
import GeoJSON     from "ol/format/GeoJSON";
import { click }   from "ol/events/condition";
import type { Feature as OLFeature } from "ol";
import type { Geometry } from "ol/geom";
import type { Extent } from "ol/extent";
import { createEmpty, extend, isEmpty } from "ol/extent";

import type { Zone, GeoJSONGeometry } from "@/types/zones";
import {
  INDIA_CENTER,
  DEFAULT_ZOOM,
  MIN_ZOOM,
  MAX_ZOOM,
  PROJECTION,
  GEOJSON_PROJ,
} from "./mapConstants";
import { polygonStyle, sketchStyle, modifyStyle, selectedStyle } from "./mapStyles";

export type ZoneMapMode = "idle" | "drawing" | "modifying";
export const NEW_ZONE_ID = "__new__";

const geoJsonFormat = new GeoJSON();

interface UseZoneMapOptions {
  /** Called when a zone feature is selected/deselected. */
  onSelectZone?: (zoneId: string | null) => void;
  /** Called when the "new polygon" is fully drawn, with its geometry. */
  onNewPolygonDrawn?: (geometry: GeoJSONGeometry) => void;
}

interface UseZoneMapReturn {
  mapRef: React.RefObject<HTMLDivElement | null>;
  mode: ZoneMapMode;
  setMode: (m: ZoneMapMode) => void;
  selectedZoneId: string | null;
  setSelectedZoneId: (id: string | null) => void;
  /** Load (or reload) all zone features from the API response. */
  loadZones: (zones: Zone[]) => void;
  /** Zoom the view to fit all loaded zone features. Falls back to India if none. */
  zoomToZones: () => void;
  /** Zoom the view to fit a single zone feature by id. */
  zoomToZone: (zoneId: string) => void;
  /** Return the current GeoJSON geometry of a zone (after possible edits). */
  getZoneGeometry: (zoneId: string) => GeoJSONGeometry | null;
  /** Remove the "__new__" draw feature and reset to idle. */
  cancelDraw: () => void;
  /** True while a "__new__" polygon exists on the map. */
  hasNewPolygon: boolean;
}

export function useZoneMap({
  onSelectZone,
  onNewPolygonDrawn,
}: UseZoneMapOptions = {}): UseZoneMapReturn {
  const mapRef    = useRef<HTMLDivElement>(null);
  const mapInst   = useRef<Map | null>(null);
  const sourceRef = useRef<VectorSource<OLFeature<Geometry>> | null>(null);
  const drawRef   = useRef<Draw | null>(null);
  const modRef    = useRef<Modify | null>(null);
  const snapRef   = useRef<Snap | null>(null);
  const selectRef = useRef<Select | null>(null);

  const [mode, setModeState] = useState<ZoneMapMode>("idle");
  const [selectedZoneId, setSelectedZoneIdState] = useState<string | null>(null);
  const [hasNewPolygon, setHasNewPolygon] = useState(false);

  // Keep callback refs stable so effects don't re-run on every render
  const onSelectZoneRef      = useRef(onSelectZone);
  const onNewPolygonDrawnRef = useRef(onNewPolygonDrawn);
  useEffect(() => { onSelectZoneRef.current = onSelectZone; }, [onSelectZone]);
  useEffect(() => { onNewPolygonDrawnRef.current = onNewPolygonDrawn; }, [onNewPolygonDrawn]);

  // ── Expose setSelectedZoneId so parent can imperatively select ───────────
  const setSelectedZoneId = useCallback((id: string | null) => {
    setSelectedZoneIdState(id);
    onSelectZoneRef.current?.(id);
  }, []);

  // ── Remove all interactions ──────────────────────────────────────────────
  const removeInteractions = useCallback(() => {
    const map = mapInst.current;
    if (!map) return;
    for (const ref of [drawRef, modRef, snapRef, selectRef]) {
      if (ref.current) {
        map.removeInteraction(ref.current);
        ref.current = null;
      }
    }
  }, []);

  // ── Activate Select interaction (idle mode) ──────────────────────────────
  const activateSelect = useCallback(() => {
    const map    = mapInst.current;
    const source = sourceRef.current;
    if (!map || !source) return;

    removeInteractions();

    // Restore normal style for all features
    source.getFeatures().forEach((f) => {
      const zid = f.get("zoneId") as string;
      f.setStyle(zid === selectedZoneId ? selectedStyle : polygonStyle);
    });

    const select = new Select({
      condition: click,
      style: selectedStyle,
    });

    select.on("select", (evt) => {
      const selected = evt.selected[0];
      const id = selected ? (selected.get("zoneId") as string) : null;
      setSelectedZoneIdState(id);
      onSelectZoneRef.current?.(id);
    });

    map.addInteraction(select);
    selectRef.current = select;
  }, [removeInteractions, selectedZoneId]);

  // ── Activate Modify interaction ──────────────────────────────────────────
  const activateModify = useCallback(() => {
    const map    = mapInst.current;
    const source = sourceRef.current;
    if (!map || !source) return;

    removeInteractions();

    // Apply modify style only to the selected feature
    source.getFeatures().forEach((f) => {
      const zid = f.get("zoneId") as string;
      f.setStyle(zid === selectedZoneId ? modifyStyle : polygonStyle);
    });

    const modify = new Modify({ source });
    const snap   = new Snap({ source });

    map.addInteraction(modify);
    map.addInteraction(snap);
    modRef.current  = modify;
    snapRef.current = snap;
  }, [removeInteractions, selectedZoneId]);

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
      const feature = evt.feature as OLFeature<Geometry>;
      feature.set("zoneId", NEW_ZONE_ID);
      feature.setStyle(selectedStyle);
      setHasNewPolygon(true);

      // Emit the geometry to the parent
      const geom = feature.getGeometry();
      if (geom) {
        const gj = geoJsonFormat.writeGeometryObject(geom, {
          dataProjection: GEOJSON_PROJ,
          featureProjection: PROJECTION,
        }) as GeoJSONGeometry;
        onNewPolygonDrawnRef.current?.(gj);
      }

      // Auto-switch back to idle
      setTimeout(() => setModeState("idle"), 0);
    });

    map.addInteraction(draw);
    drawRef.current = draw;
  }, [removeInteractions]);

  // ── Expose setMode ───────────────────────────────────────────────────────
  const setMode = useCallback((next: ZoneMapMode) => {
    setModeState(next);
  }, []);

  // ── React to mode changes ────────────────────────────────────────────────
  useEffect(() => {
    if (!mapInst.current) return;
    if (mode === "drawing")   activateDraw();
    else if (mode === "modifying") activateModify();
    else activateSelect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Load zones into the vector source ───────────────────────────────────
  const loadZones = useCallback((zones: Zone[]) => {
    const source = sourceRef.current;
    if (!source) return;

    // Keep the "__new__" feature if it exists
    const newFeature = source.getFeatures().find(
      (f) => f.get("zoneId") === NEW_ZONE_ID
    );

    source.clear();

    // Re-add any in-progress new polygon
    if (newFeature) source.addFeature(newFeature);

    zones.forEach((zone) => {
      if (!zone.geometry) return;
      try {
        const feature = geoJsonFormat.readFeature(
          { type: "Feature", geometry: zone.geometry, properties: {} },
          { dataProjection: GEOJSON_PROJ, featureProjection: PROJECTION }
        ) as OLFeature<Geometry>;
        feature.set("zoneId", zone.id);
        feature.setStyle(
          zone.id === selectedZoneId ? selectedStyle : polygonStyle
        );
        source.addFeature(feature);
      } catch (e) {
        console.warn(`useZoneMap: failed to parse geometry for zone ${zone.id}`, e);
      }
    });
  }, [selectedZoneId]);

  // ── Zoom to all zone extents ─────────────────────────────────────────────
  const zoomToZones = useCallback(() => {
    const map    = mapInst.current;
    const source = sourceRef.current;
    if (!map || !source) return;

    const combined: Extent = createEmpty();
    source.getFeatures().forEach((f) => {
      const ext = f.getGeometry()?.getExtent();
      if (ext) extend(combined, ext);
    });

    if (!isEmpty(combined)) {
      map.getView().fit(combined, {
        padding: [60, 60, 60, 60],
        duration: 600,
        maxZoom: 18,
      });
    } else {
      // No zones — center on India
      map.getView().animate({
        center: INDIA_CENTER,
        zoom: DEFAULT_ZOOM,
        duration: 500,
      });
    }
  }, []);

  // ── Zoom to a single zone by id ──────────────────────────────────────────
  const zoomToZone = useCallback((zoneId: string) => {
    const map    = mapInst.current;
    const source = sourceRef.current;
    if (!map || !source) return;

    const feature = source.getFeatures().find(
      (f) => f.get("zoneId") === zoneId
    );
    const ext = feature?.getGeometry()?.getExtent();
    if (ext && !isEmpty(ext)) {
      map.getView().fit(ext, {
        padding: [80, 80, 80, 80],
        duration: 550,
        maxZoom: 19,
      });
    }
  }, []);

  // ── Get current geometry for a zone (after editing) ─────────────────────
  const getZoneGeometry = useCallback((zoneId: string): GeoJSONGeometry | null => {
    const source = sourceRef.current;
    if (!source) return null;
    const feature = source.getFeatures().find(
      (f) => f.get("zoneId") === zoneId
    );
    if (!feature) return null;
    const geom = feature.getGeometry();
    if (!geom) return null;
    return geoJsonFormat.writeGeometryObject(geom, {
      dataProjection: GEOJSON_PROJ,
      featureProjection: PROJECTION,
    }) as GeoJSONGeometry;
  }, []);

  // ── Cancel / remove the in-progress new polygon ──────────────────────────
  const cancelDraw = useCallback(() => {
    const source = sourceRef.current;
    if (!source) return;
    const newFeature = source.getFeatures().find(
      (f) => f.get("zoneId") === NEW_ZONE_ID
    );
    if (newFeature) source.removeFeature(newFeature);
    setHasNewPolygon(false);
    setModeState("idle");
  }, []);

  // ── Initialise the OL map (once) ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInst.current) return;

    const source = new VectorSource<OLFeature<Geometry>>();
    sourceRef.current = source;

    const vectorLayer = new VectorLayer({
      source,
      style: polygonStyle,
      zIndex: 10,
    });

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

    // Activate idle select by default
    activateSelect();

    return () => {
      removeInteractions();
      map.setTarget(undefined);
      mapInst.current  = null;
      sourceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    mapRef,
    mode,
    setMode,
    selectedZoneId,
    setSelectedZoneId,
    loadZones,
    zoomToZones,
    zoomToZone,
    getZoneGeometry,
    cancelDraw,
    hasNewPolygon,
  };
}
