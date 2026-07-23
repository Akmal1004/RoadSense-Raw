import { memo, useMemo } from "react";
import { Platform, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { routeLegend } from "../constants/routeDisplay";
import { Coordinate, RoutePlan } from "../types/route";
import GlassCard from "./GlassCard";

type Props = {
  hasPlan?: boolean;
  plan?: RoutePlan | null;
  compact?: boolean;
  selectedRouteId?: string | null;
  onSelectRoute?: (routeId: string) => void;
};

const routeColors: Record<string, string> = {
  safest: "#22C55E",
  fastest: "#06B6D4",
  eco: "#A855F7"
};

function generateLeafletHtml(plan?: RoutePlan | null, selectedRouteId?: string | null): string {
  const source = plan?.sourceCoordinate ?? { latitude: 13.0827, longitude: 80.2707 };
  const dest = plan?.destinationCoordinate ?? { latitude: 12.9941, longitude: 80.1709 };
  const routesData = (plan?.routes ?? []).map((r, i) => ({
    id: r.id,
    name: r.name,
    color: routeColors[r.id] ?? routeLegend[i % routeLegend.length]?.color ?? "#00D4FF",
    isSelected: selectedRouteId ? r.id === selectedRouteId : i === 0,
    coords: r.coordinates.map((c) => [c.latitude, c.longitude])
  }));

  const safeSource = (plan?.source || "Source").replace(/'/g, "\\'");
  const safeDest = (plan?.destination || "Destination").replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map { width: 100%; height: 100%; margin: 0; padding: 0; background: #030B18; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; overflow: hidden; }
    .leaflet-control-attribution { display: none !important; }
    .leaflet-bar { border: none !important; box-shadow: 0 4px 14px rgba(0,0,0,0.4) !important; }
    .leaflet-bar a { background-color: rgba(15, 23, 42, 0.92) !important; color: #00D4FF !important; border-color: rgba(255,255,255,0.15) !important; }
    .marker-pin { width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px; box-shadow: 0 0 12px rgba(0,0,0,0.6); border: 2px solid white; }
    .source-pin { background: linear-gradient(135deg, #22C55E, #16A34A); }
    .dest-pin { background: linear-gradient(135deg, #EF4444, #DC2626); }

    /* Live Location Pulsing Blue Dot */
    .user-live-container { position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; }
    .user-live-dot { width: 14px; height: 14px; background: #007AFF; border: 2px solid #FFFFFF; border-radius: 50%; box-shadow: 0 0 12px rgba(0,122,255,0.9); position: relative; z-index: 2; }
    .user-live-pulse { width: 24px; height: 24px; border-radius: 50%; background: rgba(0, 122, 255, 0.4); position: absolute; top: 0; left: 0; animation: pulseRing 2s infinite ease-out; z-index: 1; }
    @keyframes pulseRing {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.2); opacity: 0; }
    }

    /* Floating Map Controls */
    .map-controls-overlay { position: absolute; top: 12px; right: 12px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
    .map-btn { width: 38px; height: 38px; border-radius: 50%; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(255,255,255,0.2); color: #00D4FF; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 16px; outline: none; transition: transform 0.2s; }
    .map-btn:active { transform: scale(0.92); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="map-controls-overlay">
    <button class="map-btn" id="locateBtn" title="Locate My Live GPS Position">🎯</button>
    <button class="map-btn" id="layerBtn" title="Switch Google Map / Satellite View">🗺️</button>
  </div>
  <script>
    const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${source.latitude}, ${source.longitude}], 13);

    const tileLayers = {
      googleRoad: L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', { maxZoom: 20 }),
      googleSatellite: L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', { maxZoom: 20 }),
      dark: L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19, subdomains: 'abcd' })
    };

    let currentLayerKey = 'googleRoad';
    tileLayers[currentLayerKey].addTo(map);

    document.getElementById('layerBtn').addEventListener('click', () => {
      map.removeLayer(tileLayers[currentLayerKey]);
      if (currentLayerKey === 'googleRoad') currentLayerKey = 'dark';
      else if (currentLayerKey === 'dark') currentLayerKey = 'googleSatellite';
      else currentLayerKey = 'googleRoad';
      tileLayers[currentLayerKey].addTo(map);
    });

    let liveMarker = null;
    let liveCircle = null;

    function updateLiveLocation(lat, lng, accuracy) {
      const liveIcon = L.divIcon({
        className: 'user-live-wrapper',
        html: "<div class='user-live-container'><div class='user-live-pulse'></div><div class='user-live-dot'></div></div>",
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      if (!liveMarker) {
        liveMarker = L.marker([lat, lng], { icon: liveIcon, zIndexOffset: 1000 }).addTo(map).bindPopup("<b>Your Live Location</b>");
      } else {
        liveMarker.setLatLng([lat, lng]);
      }

      if (accuracy && accuracy < 500) {
        if (!liveCircle) {
          liveCircle = L.circle([lat, lng], { radius: accuracy, color: '#007AFF', weight: 1, opacity: 0.4, fillColor: '#007AFF', fillOpacity: 0.12 }).addTo(map);
        } else {
          liveCircle.setLatLng([lat, lng]).setRadius(accuracy);
        }
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => updateLiveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        (err) => console.log('Location error:', err),
        { enableHighAccuracy: true }
      );
      navigator.geolocation.watchPosition(
        (pos) => updateLiveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        null,
        { enableHighAccuracy: true, maximumAge: 10000 }
      );
    }

    document.getElementById('locateBtn').addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          updateLiveLocation(latitude, longitude, accuracy);
          map.flyTo([latitude, longitude], 15, { animate: true, duration: 1.2 });
        });
      }
    });

    const routes = ${JSON.stringify(routesData)};
    const bounds = L.latLngBounds();

    if (routes.length > 0) {
      // Render unselected routes first, then selected route on top
      const sortedRoutes = [...routes].sort((a, b) => (a.isSelected ? 1 : 0) - (b.isSelected ? 1 : 0));

      sortedRoutes.forEach(r => {
        if (r.coords && r.coords.length) {
          const polyline = L.polyline(r.coords, {
            color: r.isSelected ? '#FACC15' : r.color,
            weight: r.isSelected ? 7 : 5,
            opacity: r.isSelected ? 1.0 : 0.75,
            lineCap: 'round',
            lineJoin: 'round'
          }).addTo(map);

          polyline.bindPopup("<b>" + r.name + "</b><br/>" + (r.isSelected ? "<span style='color:#FACC15;font-weight:bold;'>Selected Route</span>" : "Tap to select this route"));
          r.coords.forEach(c => bounds.extend(c));
        }
      });
    }

    if (${Boolean(plan?.sourceCoordinate)}) {
      const srcIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='marker-pin source-pin'>A</div>",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([${source.latitude}, ${source.longitude}], { icon: srcIcon }).addTo(map).bindPopup("<b>Pick-Up (Source):</b> ${safeSource}");
      bounds.extend([${source.latitude}, ${source.longitude}]);
    }

    if (${Boolean(plan?.destinationCoordinate)}) {
      const destIcon = L.divIcon({
        className: 'custom-div-icon',
        html: "<div class='marker-pin dest-pin'>B</div>",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });
      L.marker([${dest.latitude}, ${dest.longitude}], { icon: destIcon }).addTo(map).bindPopup("<b>Drop-Off (Destination):</b> ${safeDest}");
      bounds.extend([${dest.latitude}, ${dest.longitude}]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  </script>
</body>
</html>`;
}

function RouteMapFallback({ plan, compact = false, selectedRouteId }: Props) {
  const isWeb = Platform.OS === "web";
  const hasPlan = Boolean(plan && plan.routes && plan.routes.length > 0);

  const htmlContent = useMemo(() => generateLeafletHtml(plan, selectedRouteId), [plan, selectedRouteId]);

  if (isWeb) {
    return (
      <GlassCard style={[styles.card, compact && styles.compact]}>
        <View style={styles.webMapContainer}>
          <iframe
            srcDoc={htmlContent}
            title="RoadSense Interactive Map"
            style={{
              width: "100%",
              height: "100%",
              border: "none",
              borderRadius: 16
            }}
          />
          {hasPlan && <RouteLegend />}
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={[styles.card, compact && styles.compact]}>
      {hasPlan ? (
        <View style={styles.svgMapShell}>
          <SvgMapCanvas plan={plan!} selectedRouteId={selectedRouteId} />
          <RouteLegend />
        </View>
      ) : (
        <View style={styles.placeholder}>
          <MaterialCommunityIcons name="map-search-outline" size={38} color="#00D4FF" />
          <Text style={styles.placeholderText}>Enter a destination to see AI-optimized route options.</Text>
        </View>
      )}
    </GlassCard>
  );
}

function SvgMapCanvas({ plan, selectedRouteId }: { plan: RoutePlan; selectedRouteId?: string | null }) {
  const width = 340;
  const height = 210;
  const padding = 35;

  const { minLat, maxLat, minLng, maxLng } = useMemo(() => {
    let minLt = Infinity;
    let maxLt = -Infinity;
    let minLg = Infinity;
    let maxLg = -Infinity;

    for (const route of plan.routes) {
      for (const coord of route.coordinates) {
        if (coord.latitude < minLt) minLt = coord.latitude;
        if (coord.latitude > maxLt) maxLt = coord.latitude;
        if (coord.longitude < minLg) minLg = coord.longitude;
        if (coord.longitude > maxLg) maxLg = coord.longitude;
      }
    }

    if (minLt === Infinity) {
      minLt = 13.0;
      maxLt = 13.1;
      minLg = 80.2;
      maxLg = 80.3;
    }

    const dLat = maxLt - minLt || 0.02;
    const dLng = maxLg - minLg || 0.02;

    return {
      minLat: minLt - dLat * 0.15,
      maxLat: maxLt + dLat * 0.15,
      minLng: minLg - dLng * 0.15,
      maxLng: maxLg + dLng * 0.15
    };
  }, [plan]);

  function project(coord: Coordinate): { x: number; y: number } {
    const dLng = maxLng - minLng || 0.01;
    const dLat = maxLat - minLat || 0.01;
    const x = padding + ((coord.longitude - minLng) / dLng) * (width - 2 * padding);
    const y = height - padding - ((coord.latitude - minLat) / dLat) * (height - 2 * padding);
    return { x, y };
  }

  const srcPt = project(plan.sourceCoordinate ?? plan.routes[0]?.coordinates[0]);
  const destPt = project(
    plan.destinationCoordinate ?? plan.routes[0]?.coordinates[plan.routes[0].coordinates.length - 1]
  );

  return (
    <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
      <Rect width={width} height={height} fill="#030B18" rx={14} />

      {/* Background Map Gridlines */}
      <Line x1={0} y1={50} x2={width} y2={50} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      <Line x1={0} y1={105} x2={width} y2={105} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      <Line x1={0} y1={160} x2={width} y2={160} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      <Line x1={80} y1={0} x2={80} y2={height} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      <Line x1={170} y1={0} x2={170} y2={height} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
      <Line x1={260} y1={0} x2={260} y2={height} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />

      {/* Polylines for each route */}
      {plan.routes.map((route, i) => {
        const isSelected = selectedRouteId ? route.id === selectedRouteId : i === 0;
        const color = isSelected ? "#FACC15" : routeColors[route.id] ?? "#00D4FF";
        const strokeWidth = isSelected ? 4.5 : 2.5;
        const opacity = isSelected ? 1.0 : 0.45;

        const pathD = route.coordinates
          .map((c, idx) => {
            const p = project(c);
            return `${idx === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          })
          .join(" ");

        return (
          <Path
            key={route.id}
            d={pathD}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeOpacity={opacity}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        );
      })}

      {/* Source Marker */}
      <Circle cx={srcPt.x} cy={srcPt.y} r={10} fill="#22C55E" stroke="#FFFFFF" strokeWidth={2} />
      <SvgText x={srcPt.x} y={srcPt.y + 3.5} fill="#FFFFFF" fontSize={9} fontWeight="bold" textAnchor="middle">
        A
      </SvgText>

      {/* Destination Marker */}
      <Circle cx={destPt.x} cy={destPt.y} r={10} fill="#EF4444" stroke="#FFFFFF" strokeWidth={2} />
      <SvgText x={destPt.x} y={destPt.y + 3.5} fill="#FFFFFF" fontSize={9} fontWeight="bold" textAnchor="middle">
        B
      </SvgText>
    </Svg>
  );
}

function RouteLegend() {
  return (
    <View style={styles.legend}>
      {routeLegend.map((item) => (
        <View key={item.id} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
    height: 230,
    overflow: "hidden",
    padding: 0
  },
  compact: {
    height: 320
  },
  webMapContainer: {
    backgroundColor: "#030B18",
    borderRadius: 16,
    flex: 1,
    overflow: "hidden",
    position: "relative"
  },
  svgMapShell: {
    backgroundColor: "#030B18",
    borderRadius: 16,
    flex: 1,
    overflow: "hidden",
    position: "relative"
  },
  placeholder: {
    alignItems: "center",
    backgroundColor: "#030B18",
    flex: 1,
    gap: 12,
    justifyContent: "center",
    padding: 22
  },
  placeholderText: {
    color: "#FFFFFF",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  legend: {
    backgroundColor: "rgba(3,11,24,0.88)",
    borderColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    borderWidth: 1,
    bottom: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    left: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    position: "absolute",
    zIndex: 10
  },
  legendItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  legendDot: {
    borderRadius: 4,
    height: 8,
    width: 8
  },
  legendText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700"
  }
});

export default memo(RouteMapFallback);
