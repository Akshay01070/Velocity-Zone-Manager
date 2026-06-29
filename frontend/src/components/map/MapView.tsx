/**
 * src/components/map/MapView.tsx — OpenLayers map container placeholder.
 *
 * Full implementation (OSM tiles, zone layers, draw interaction) in
 * a future iteration.
 */

import { useEffect, useRef } from "react";
import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
// Note: ol/ol.css is imported globally via src/index.css

export function MapView() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({
          source: new OSM(),
        }),
      ],
      view: new View({
        center: [0, 0],
        zoom: 3,
      }),
    });

    return () => {
      map.setTarget(undefined);
    };
  }, []);

  return <div ref={mapRef} className="ol-map" />;
}
