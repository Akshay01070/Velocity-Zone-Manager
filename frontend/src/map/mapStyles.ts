/**
 * src/map/mapStyles.ts — Reusable OL Style objects.
 *
 * Keeps style logic out of the component tree.
 */

import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import CircleStyle from "ol/style/Circle";
import { STYLE } from "./mapConstants";

/** Default polygon style (neutral / idle). */
export const polygonStyle = new Style({
  stroke: new Stroke({ color: STYLE.STROKE, width: STYLE.STROKE_WIDTH }),
  fill:   new Fill({ color: STYLE.FILL }),
  image:  new CircleStyle({
    radius: STYLE.VERTEX_RADIUS,
    fill:   new Fill({ color: STYLE.VERTEX }),
    stroke: new Stroke({ color: STYLE.VERTEX_STROKE, width: 1.5 }),
  }),
});

/** Style used during active draw interaction (sketch polygon). */
export const sketchStyle = new Style({
  stroke: new Stroke({ color: STYLE.SKETCH_STROKE, width: 2, lineDash: [6, 4] }),
  fill:   new Fill({ color: STYLE.SKETCH_FILL }),
  image:  new CircleStyle({
    radius: STYLE.VERTEX_RADIUS,
    fill:   new Fill({ color: STYLE.VERTEX }),
    stroke: new Stroke({ color: STYLE.SKETCH_STROKE, width: 1.5 }),
  }),
});

/** Style when polygon is being modified (vertex drag). */
export const modifyStyle = new Style({
  stroke: new Stroke({ color: STYLE.MODIFY_STROKE, width: STYLE.STROKE_WIDTH }),
  fill:   new Fill({ color: STYLE.MODIFY_FILL }),
  image:  new CircleStyle({
    radius: STYLE.VERTEX_RADIUS + 1,
    fill:   new Fill({ color: STYLE.VERTEX }),
    stroke: new Stroke({ color: STYLE.MODIFY_STROKE, width: 1.5 }),
  }),
});
