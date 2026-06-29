/**
 * src/map/geoJsonHelpers.ts — Converters between OL features and GeoJSON.
 */

import GeoJSON from "ol/format/GeoJSON";
import type { Feature as OLFeature } from "ol";
import type { Geometry } from "ol/geom";
import type { GeoJSONGeometry } from "@/types/zones";

import { GEOJSON_PROJ, PROJECTION } from "./mapConstants";

const fmt = new GeoJSON();

/**
 * Serialise a single OL Feature to a GeoJSON Geometry object (EPSG:4326).
 * Returns null if the feature has no geometry.
 */
export function featureToGeoJSON(feature: OLFeature<Geometry>): GeoJSONGeometry | null {
  const geom = feature.getGeometry();
  if (!geom) return null;
  const gj = fmt.writeGeometryObject(geom, {
    dataProjection:   GEOJSON_PROJ,
    featureProjection: PROJECTION,
  });
  return gj as GeoJSONGeometry;
}

/**
 * Deserialise a GeoJSON Geometry into an OL Feature (reprojected to EPSG:3857).
 */
export function geoJSONToFeature(geometry: GeoJSONGeometry): OLFeature<Geometry> {
  return fmt.readFeature(
    { type: "Feature", geometry, properties: {} },
    { dataProjection: GEOJSON_PROJ, featureProjection: PROJECTION }
  ) as OLFeature<Geometry>;
}
