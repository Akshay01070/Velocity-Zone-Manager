/**
 * src/map/mapConstants.ts — Shared map constants.
 */

import { fromLonLat } from "ol/proj";

/** India geographic center (lon, lat) */
export const INDIA_CENTER_LONLAT: [number, number] = [78.9629, 20.5937];

/** India center in Web-Mercator (EPSG:3857) for OL views */
export const INDIA_CENTER = fromLonLat(INDIA_CENTER_LONLAT);

export const DEFAULT_ZOOM     = 5;
export const MIN_ZOOM         = 3;
export const MAX_ZOOM         = 20;

export const PROJECTION       = "EPSG:3857";
export const GEOJSON_PROJ     = "EPSG:4326";

/** Styles (hex colours that match the app's design system) */
export const STYLE = {
  STROKE:          "#4f83f7",
  STROKE_WIDTH:    2.5,
  FILL:            "rgba(79, 131, 247, 0.18)",
  VERTEX:          "#fff",
  VERTEX_STROKE:   "#4f83f7",
  VERTEX_RADIUS:   5,

  MODIFY_STROKE:   "#a78bfa",
  MODIFY_FILL:     "rgba(167, 139, 250, 0.18)",

  SKETCH_STROKE:   "#fbbf24",
  SKETCH_FILL:     "rgba(251, 191, 36, 0.12)",
} as const;
