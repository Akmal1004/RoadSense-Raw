import { useEffect, useRef, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Coordinate } from "../types/route";
import { PlaceSuggestion } from "../types/search";
import { getCurrentLocation, getDefaultLocation } from "../services/locationService";
import { getPlaceDetails, reverseGeocode, searchPlaces } from "../services/searchService";
import GradientButton from "./GradientButton";
import LoadingSkeleton from "./LoadingSkeleton";
import SearchBar from "./SearchBar";
import SearchResultsList from "./SearchResultsList";
import { useTheme } from "../theme/hooks/useTheme";

type Props = {
  visible: boolean;
  title: string;
  initialLabel?: string;
  initialCoordinate?: Coordinate;
  locationBias?: Coordinate | null;
  onCancel: () => void;
  onConfirm: (value: { label: string; coordinate: Coordinate }) => void;
};

function generatePickerMapHtml(title: string, coordinate: Coordinate): string {
  const isSource = title.toLowerCase().includes("source") || title.toLowerCase().includes("pick");
  const pinColor = isSource ? "#22C55E" : "#EF4444";
  const pinText = isSource ? "A" : "B";

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
    
    .picker-pin { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 900; font-size: 13px; box-shadow: 0 0 16px rgba(0,0,0,0.6); border: 2.5px solid white; background: ${pinColor}; }
    .map-controls-overlay { position: absolute; top: 12px; right: 12px; z-index: 1000; display: flex; flex-direction: column; gap: 8px; }
    .map-btn { width: 38px; height: 38px; border-radius: 50%; background: rgba(15, 23, 42, 0.92); border: 1px solid rgba(255,255,255,0.2); color: #00D4FF; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.5); font-size: 16px; outline: none; transition: transform 0.2s; }
    .map-btn:active { transform: scale(0.92); }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="map-controls-overlay">
    <button class="map-btn" id="locateBtn" title="Locate My Live Position">🎯</button>
    <button class="map-btn" id="layerBtn" title="Switch Map View">🗺️</button>
  </div>
  <script>
    const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([${coordinate.latitude}, ${coordinate.longitude}], 14);

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

    const pinIcon = L.divIcon({
      className: 'custom-picker-pin',
      html: "<div class='picker-pin'>${pinText}</div>",
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    function notifyPinMoved(lat, lng) {
      try {
        if (window.parent) {
          window.parent.postMessage({ type: 'PICKER_PIN_MOVED', lat: lat, lng: lng }, '*');
        }
      } catch (e) {}
    }

    let marker = L.marker([${coordinate.latitude}, ${coordinate.longitude}], { icon: pinIcon, draggable: true }).addTo(map);

    map.on('click', (e) => {
      marker.setLatLng(e.latlng);
      notifyPinMoved(e.latlng.lat, e.latlng.lng);
    });

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      notifyPinMoved(pos.lat, pos.lng);
    });

    document.getElementById('locateBtn').addEventListener('click', () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition((pos) => {
          const latlng = [pos.coords.latitude, pos.coords.longitude];
          marker.setLatLng(latlng);
          map.flyTo(latlng, 15);
          notifyPinMoved(pos.coords.latitude, pos.coords.longitude);
        });
      }
    });
  </script>
</body>
</html>`;
}

export default function LocationPickerModal({
  visible,
  title,
  initialLabel,
  initialCoordinate,
  locationBias,
  onCancel,
  onConfirm
}: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState(initialLabel ?? "");
  const [marker, setMarker] = useState<Coordinate>(initialCoordinate ?? locationBias ?? getDefaultLocation());
  const [selectedLabel, setSelectedLabel] = useState(
    initialLabel ?? coordinateLabel(initialCoordinate ?? locationBias ?? getDefaultLocation())
  );
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    async function handleMessage(event: MessageEvent) {
      if (event.data && event.data.type === "PICKER_PIN_MOVED") {
        const { lat, lng } = event.data;
        if (typeof lat === "number" && typeof lng === "number") {
          const newCoord = { latitude: lat, longitude: lng };
          setMarker(newCoord);
          try {
            const res = await reverseGeocode(newCoord);
            const labelText = res.label || res.address || coordinateLabel(newCoord);
            setSelectedLabel(labelText);
            setQuery(labelText);
          } catch {
            setSelectedLabel(coordinateLabel(newCoord));
          }
        }
      }
    }

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const initialMarker = initialCoordinate ?? locationBias ?? getDefaultLocation();
    setQuery(initialLabel ?? "");
    setMarker(initialMarker);
    setSelectedLabel(initialLabel ?? coordinateLabel(initialMarker));
    setSuggestions([]);
    setSearchError(null);
    setHasSearched(false);
  }, [initialCoordinate, initialLabel, locationBias, visible]);

  useEffect(() => {
    if (!visible) return;
    const normalizedQuery = query.trim().replace(/\s+/g, " ");
    if (normalizedQuery.length < 2) {
      requestRef.current?.abort();
      setSuggestions([]);
      setSearchError(null);
      setHasSearched(false);
      return;
    }

    const timeout = setTimeout(() => {
      search(normalizedQuery);
    }, 500);

    return () => clearTimeout(timeout);
  }, [query, visible]);

  async function search(value = query) {
    const normalizedQuery = value.trim().replace(/\s+/g, " ");
    if (!normalizedQuery) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setSearching(true);
    setSearchError(null);
    setHasSearched(true);
    try {
      const next = await searchPlaces(normalizedQuery, { locationBias, signal: controller.signal });
      setSuggestions(next);
    } catch (error) {
      if (controller.signal.aborted) return;
      setSuggestions([]);
      setSearchError(error instanceof Error ? error.message : "Location search failed.");
    } finally {
      if (!controller.signal.aborted) setSearching(false);
    }
  }

  async function useMyCurrentLocation() {
    setLocating(true);
    setSearchError(null);
    try {
      const liveCoord = await getCurrentLocation();
      setMarker(liveCoord);
      const res = await reverseGeocode(liveCoord);
      const labelText = res.label || res.address || "My Live Location";
      setSelectedLabel(labelText);
      setQuery(labelText);
      setSuggestions([]);
    } catch (error) {
      setSearchError("Could not fetch current GPS location.");
    } finally {
      setLocating(false);
    }
  }

  async function chooseSuggestion(suggestion: PlaceSuggestion) {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setResolving(true);
    setSearchError(null);
    try {
      const details = await getPlaceDetails(suggestion.placeId, controller.signal);
      setMarker(details.coordinate);
      setSelectedLabel(details.name || details.address);
      setQuery(details.name || details.address);
      setSuggestions([]);
    } catch (error) {
      if (controller.signal.aborted) return;
      setSearchError(error instanceof Error ? error.message : "Could not load place details.");
    } finally {
      if (!controller.signal.aborted) setResolving(false);
    }
  }

  function confirm() {
    onConfirm({
      label: selectedLabel || coordinateLabel(marker),
      coordinate: marker
    });
  }

  const isWeb = Platform.OS === "web";
  const htmlContent = generatePickerMapHtml(title, marker);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCancel}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onCancel} style={[styles.iconButton, { backgroundColor: theme.iconButton }]}>
            <MaterialCommunityIcons name="close" size={24} color={theme.text} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Pick on map or search location</Text>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar
            value={query}
            onChangeText={setQuery}
            onClear={() => {
              setQuery("");
              setSuggestions([]);
            }}
            onSubmit={() => search()}
            placeholder="Search a place, address, or landmark..."
            loading={searching || resolving || locating}
          />

          <Pressable
            style={[styles.liveLocButton, { backgroundColor: theme.chipBackground }]}
            onPress={useMyCurrentLocation}
          >
            <MaterialCommunityIcons name="crosshairs-gps" size={18} color={theme.primary} />
            <Text style={[styles.liveLocText, { color: theme.primary }]}>
              {locating ? "Fetching GPS Location..." : "Use My Live Location"}
            </Text>
          </Pressable>

          {searching ? <LoadingSkeleton rows={2} /> : null}
          <SearchResultsList
            title="Suggested Places"
            suggestions={suggestions}
            emptyText={
              !searching && hasSearched && !suggestions.length && !searchError
                ? "No results found. Try a more specific place."
                : undefined
            }
            onSelectSuggestion={chooseSuggestion}
          />
          {searchError ? <Text style={[styles.searchError, { color: theme.danger }]}>{searchError}</Text> : null}
        </View>

        <View style={styles.mapContainer}>
          {isWeb ? (
            <iframe
              srcDoc={htmlContent}
              title="Location Picker Map"
              style={{
                width: "100%",
                height: "100%",
                border: "none"
              }}
            />
          ) : (
            <View style={styles.nativeMapPlaceholder}>
              <MaterialCommunityIcons name="map-marker-radius" size={48} color={theme.primary} />
              <Text style={[styles.nativeMapText, { color: theme.text }]}>Selected Coordinates</Text>
              <Text style={[styles.nativeMapSub, { color: theme.textSecondary }]}>{coordinateLabel(marker)}</Text>
            </View>
          )}
        </View>

        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <View style={styles.selectedRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color={theme.primary} />
            <Text style={[styles.selectedLabel, { color: theme.text }]} numberOfLines={2}>
              {selectedLabel}
            </Text>
          </View>
          <GradientButton label="Confirm Location" icon="check" loading={resolving} onPress={confirm} />
        </View>
      </View>
    </Modal>
  );
}

function coordinateLabel(coordinate: Coordinate): string {
  return `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { alignItems: "center", flexDirection: "row", gap: 12, padding: 18, paddingTop: 44 },
  iconButton: { alignItems: "center", borderRadius: 18, height: 42, justifyContent: "center", width: 42 },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "900" },
  subtitle: { marginTop: 2 },
  searchWrap: { paddingHorizontal: 18, zIndex: 2 },
  searchError: { fontSize: 12, marginTop: 8 },
  liveLocButton: {
    alignItems: "center",
    borderRadius: 14,
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  liveLocText: { fontSize: 13, fontWeight: "800" },
  mapContainer: {
    backgroundColor: "#030B18",
    flex: 1,
    marginTop: 12,
    overflow: "hidden"
  },
  nativeMapPlaceholder: { alignItems: "center", flex: 1, gap: 8, justifyContent: "center", padding: 24 },
  nativeMapText: { fontSize: 18, fontWeight: "800" },
  nativeMapSub: { fontSize: 14 },
  footer: { borderTopWidth: 1, gap: 12, padding: 18, paddingBottom: 24 },
  selectedRow: { alignItems: "center", flexDirection: "row", gap: 8, justifyContent: "center" },
  selectedLabel: { fontSize: 14, fontWeight: "700", textAlign: "center" }
});
