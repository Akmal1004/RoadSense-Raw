import { memo } from "react";
import { isMapLibreNativeAvailable } from "../utils/mapLibreNative";
import type { MapLibreRoutePreviewProps } from "./MapLibreRoutePreviewImpl";
import RouteMapFallback from "./RouteMapFallback";

function MapLibreRoutePreview(props: MapLibreRoutePreviewProps) {
  if (!isMapLibreNativeAvailable()) {
    return <RouteMapFallback plan={props.plan} compact={props.compact} selectedRouteId={props.selectedRouteId} onSelectRoute={props.onSelectRoute} />;
  }

  try {
    const MapLibreRoutePreviewImpl = require("./MapLibreRoutePreviewImpl").default;
    return <MapLibreRoutePreviewImpl {...props} />;
  } catch (error) {
    console.warn("[MapLibre] Failed to render native map module, using fallback", error);
    return <RouteMapFallback plan={props.plan} compact={props.compact} selectedRouteId={props.selectedRouteId} onSelectRoute={props.onSelectRoute} />;
  }
}

export type { MapLibreRoutePreviewProps };
export default memo(MapLibreRoutePreview);
