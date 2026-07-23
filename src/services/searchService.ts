import axios from "axios";
import { Coordinate } from "../types/route";
import { LocationResult, PlaceDetails, PlaceSuggestion } from "../types/search";

const ORS_BASE_URL = "https://api.openrouteservice.org";
const apiKey = process.env.EXPO_PUBLIC_ORS_API_KEY?.trim();
const maxSearchCacheEntries = 20;
const searchCache = new Map<string, PlaceSuggestion[]>();
const detailsCache = new Map<string, PlaceDetails>();
const reverseGeocodeCache = new Map<string, LocationResult>();

const defaultOriginLocation: Coordinate = { latitude: 13.0827, longitude: 80.2707 };

type SearchOptions = {
  locationBias?: Coordinate | null;
  signal?: AbortSignal;
};

type NearbyOptions = {
  location: Coordinate;
  query: string;
  category?: string;
  signal?: AbortSignal;
};

function isRealKey(key?: string): boolean {
  if (!key) return false;
  if (key.startsWith("AIza") || key.includes("your_") || key.endsWith("_cMY") || key.length < 25) return false;
  return true;
}

const mockPlacesList: PlaceDetails[] = [
  { id: "mock-1", placeId: "mock-1", name: "Central Railway Station & Transit Hub", address: "Periamet, City Center", coordinate: { latitude: 13.0827, longitude: 80.2707 }, category: "station", distanceKm: 0.8 },
  { id: "mock-6", placeId: "mock-6", name: "Apollo Multispeciality Hospital", address: "Thousand Lights, Main Boulevard", coordinate: { latitude: 13.0604, longitude: 80.2514 }, category: "hospital", distanceKm: 2.4 },
  { id: "mock-5", placeId: "mock-5", name: "Marina Beach & Coastal Promenade", address: "Triplicane, Coast Road", coordinate: { latitude: 13.0500, longitude: 80.2824 }, category: "landmark", distanceKm: 3.6 },
  { id: "mock-7", placeId: "mock-7", name: "Guindy National Park & Reserve", address: "Guindy, Park Avenue", coordinate: { latitude: 13.0067, longitude: 80.2206 }, category: "park", distanceKm: 6.2 },
  { id: "mock-3", placeId: "mock-3", name: "IIT Technology Institute", address: "Adyar, Campus Way", coordinate: { latitude: 12.9915, longitude: 80.2337 }, category: "college", distanceKm: 7.8 },
  { id: "mock-4", placeId: "mock-4", name: "Phoenix Grand Galleria Mall", address: "Velachery, High Street", coordinate: { latitude: 12.9922, longitude: 80.2189 }, category: "mall", distanceKm: 8.5 },
  { id: "mock-2", placeId: "mock-2", name: "International Airport Terminal 1", address: "Meenambakkam, Highway Gate", coordinate: { latitude: 12.9941, longitude: 80.1709 }, category: "airport", distanceKm: 12.4 }
];

function getMockSuggestions(query: string, origin?: Coordinate | null): PlaceSuggestion[] {
  const q = query.toLowerCase().trim();
  const matched = mockPlacesList.filter(
    (p) => p.name.toLowerCase().includes(q) || p.address.toLowerCase().includes(q) || (p.category && p.category.toLowerCase().includes(q))
  );
  const list = matched.length > 0 ? matched : mockPlacesList;
  const userLocation = origin ?? defaultOriginLocation;

  return list
    .map((details) => {
      const realDist = distanceKm(userLocation, details.coordinate) ?? details.distanceKm ?? 1.5;
      const updatedDetails: PlaceDetails = { ...details, distanceKm: realDist };
      detailsCache.set(details.placeId, updatedDetails);
      return {
        id: details.id,
        placeId: details.placeId,
        primaryText: details.name,
        secondaryText: details.address,
        description: `${details.address} (${realDist} km away)`,
        category: details.category,
        distanceKm: realDist
      };
    })
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}

async function searchPlacesPhoton(query: string, options: SearchOptions = {}): Promise<PlaceSuggestion[]> {
  try {
    const params: Record<string, string | number> = {
      q: query,
      limit: 10
    };
    if (options.locationBias) {
      params.lat = options.locationBias.latitude;
      params.lon = options.locationBias.longitude;
    }

    const { data } = await axios.get("https://photon.komoot.io/api/", {
      params,
      signal: options.signal,
      timeout: 10000
    });

    const features = data?.features ?? [];
    if (!features.length) return [];

    const userLocation = options.locationBias ?? defaultOriginLocation;

    return features
      .map((feature: any, index: number): PlaceSuggestion => {
        const props = feature.properties || {};
        const coords = feature.geometry?.coordinates || [0, 0];
        const longitude = coords[0];
        const latitude = coords[1];

        const name = props.name || props.street || props.district || props.city || query;
        const addressParts = [props.street, props.district, props.city, props.state, props.country].filter(Boolean);
        const address = addressParts.join(", ") || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

        const placeId = props.osm_id ? `osm-${props.osm_type || "node"}-${props.osm_id}` : `photon-${index}-${latitude}-${longitude}`;
        const coord = { latitude, longitude };
        const realDist = distanceKm(userLocation, coord) ?? 2.5;

        const details: PlaceDetails = {
          id: placeId,
          placeId,
          name,
          address,
          coordinate: coord,
          category: props.osm_value || props.type || "place",
          distanceKm: realDist
        };

        detailsCache.set(placeId, details);

        return {
          id: placeId,
          placeId,
          primaryText: name,
          secondaryText: address,
          description: `${address} (${realDist} km away)`,
          category: details.category,
          distanceKm: realDist
        };
      })
      .sort((a: PlaceSuggestion, b: PlaceSuggestion) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
  } catch (error) {
    console.warn("[RoadSense Photon Search] Live search error:", error);
    return [];
  }
}

export async function searchPlaces(query: string, options: SearchOptions = {}): Promise<PlaceSuggestion[]> {
  const normalizedQuery = normalizeQuery(query);
  if (normalizedQuery.length < 2) return [];

  const cacheKey = `search:${normalizedQuery.toLowerCase()}:${coordinateCacheKey(options.locationBias)}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached;

  if (isRealKey(apiKey)) {
    try {
      const { data } = await axios.get(`${ORS_BASE_URL}/geocode/autocomplete`, {
        params: buildSearchParams(normalizedQuery, options.locationBias, 8),
        signal: options.signal,
        timeout: 12000
      });

      const suggestions = rankFeatures(data.features ?? [], normalizedQuery, options.locationBias)
        .map((feature): PlaceSuggestion => {
          const details = featureToPlaceDetails(feature, options.locationBias);
          detailsCache.set(details.placeId, details);
          return {
            id: details.id,
            placeId: details.placeId,
            primaryText: details.name,
            secondaryText: details.address,
            description: `${details.address} (${details.distanceKm ?? 0} km away)`,
            category: details.category,
            distanceKm: details.distanceKm
          };
        })
        .sort((a: PlaceSuggestion, b: PlaceSuggestion) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

      if (suggestions.length > 0) {
        setSearchCache(cacheKey, suggestions);
        return suggestions;
      }
    } catch (error) {
      console.warn("[RoadSense ORS Search] Search request failed, attempting Photon live search", error);
    }
  }

  // Live place search via OpenStreetMap Photon API
  const liveSuggestions = await searchPlacesPhoton(normalizedQuery, options);
  if (liveSuggestions.length > 0) {
    setSearchCache(cacheKey, liveSuggestions);
    return liveSuggestions;
  }

  const mockRes = getMockSuggestions(normalizedQuery, options.locationBias);
  setSearchCache(cacheKey, mockRes);
  return mockRes;
}

export async function getPlaceDetails(placeId: string, _signal?: AbortSignal): Promise<PlaceDetails> {
  const cached = detailsCache.get(placeId);
  if (cached) return cached;
  const mockFound = mockPlacesList.find((p) => p.placeId === placeId || p.id === placeId);
  if (mockFound) return mockFound;

  return {
    id: placeId,
    placeId,
    name: "Selected Location",
    address: "Nearby Location",
    coordinate: defaultOriginLocation,
    distanceKm: 1.2
  };
}

export async function searchNearbyPlaces(options: NearbyOptions): Promise<LocationResult[]> {
  const normalizedQuery = normalizeQuery(options.query);
  const cacheKey = `nearby:${normalizedQuery.toLowerCase()}:${coordinateCacheKey(options.location)}`;
  const cached = searchCache.get(cacheKey);
  if (cached) return cached.map(suggestionToLocationResult);

  if (!isRealKey(apiKey)) {
    const mockRes = getMockSuggestions(normalizedQuery, options.location).map(suggestionToLocationResult);
    return mockRes;
  }

  try {
    const { data } = await axios.get(`${ORS_BASE_URL}/geocode/search`, {
      params: buildSearchParams(normalizedQuery, options.location, 10),
      signal: options.signal,
      timeout: 12000
    });

    const results = rankFeatures(data.features ?? [], normalizedQuery, options.location)
      .map((feature): LocationResult => {
        const details = featureToPlaceDetails(feature, options.location);
        detailsCache.set(details.placeId, details);
        return {
          id: details.id,
          placeId: details.placeId,
          label: details.name,
          address: details.address,
          coordinate: details.coordinate,
          category: options.category ?? details.category,
          distanceKm: details.distanceKm
        };
      })
      .sort((a: LocationResult, b: LocationResult) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    setSearchCache(cacheKey, results.map(locationResultToSuggestion));
    return results;
  } catch (error) {
    console.warn("[RoadSense Search] searchNearbyPlaces request failed, using nearby places", error);
    return getMockSuggestions(normalizedQuery, options.location).map(suggestionToLocationResult);
  }
}

export async function reverseGeocode(coordinate: Coordinate, signal?: AbortSignal): Promise<LocationResult> {
  const cacheKey = coordinateCacheKey(coordinate);
  const cached = reverseGeocodeCache.get(cacheKey);
  if (cached) return cached;

  if (!isRealKey(apiKey)) {
    const mockRes: LocationResult = {
      id: cacheKey,
      placeId: cacheKey,
      label: `Location (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      address: "Nearby Location",
      coordinate,
      distanceKm: 0.5
    };
    reverseGeocodeCache.set(cacheKey, mockRes);
    return mockRes;
  }

  try {
    const { data } = await axios.get(`${ORS_BASE_URL}/geocode/reverse`, {
      params: {
        api_key: apiKey,
        "point.lat": coordinate.latitude,
        "point.lon": coordinate.longitude,
        size: 1
      },
      signal,
      timeout: 12000
    });

    const feature = data.features?.[0];
    const label = feature?.properties?.label ?? `${coordinate.latitude.toFixed(6)},${coordinate.longitude.toFixed(6)}`;
    const result: LocationResult = {
      id: feature?.properties?.id ?? cacheKey,
      placeId: feature?.properties?.id,
      label: feature?.properties?.name ?? label,
      address: label,
      coordinate,
      category: categoryFromFeature(feature)
    };

    reverseGeocodeCache.set(cacheKey, result);
    return result;
  } catch (error) {
    console.warn("[RoadSense Search] reverseGeocode request failed, using coordinate fallback", error);
    const mockRes: LocationResult = {
      id: cacheKey,
      placeId: cacheKey,
      label: `Location (${coordinate.latitude.toFixed(4)}, ${coordinate.longitude.toFixed(4)})`,
      address: "Nearby Location",
      coordinate,
      distanceKm: 0.5
    };
    reverseGeocodeCache.set(cacheKey, mockRes);
    return mockRes;
  }
}

function buildSearchParams(query: string, locationBias: Coordinate | null | undefined, size: number) {
  const params: Record<string, string | number> = {
    api_key: apiKey as string,
    text: query,
    size
  };

  if (locationBias) {
    params["focus.point.lat"] = locationBias.latitude;
    params["focus.point.lon"] = locationBias.longitude;
  }

  return params;
}

function featureToPlaceDetails(feature: any, origin?: Coordinate | null): PlaceDetails {
  const coordinates = feature.geometry?.coordinates;
  if (!Array.isArray(coordinates)) {
    throw new Error("This place does not include map coordinates. Try another result.");
  }

  const coordinate = { latitude: coordinates[1], longitude: coordinates[0] };
  const properties = feature.properties ?? {};
  const name = properties.name ?? properties.label ?? "Selected location";
  const address = properties.label ?? [properties.locality, properties.region, properties.country].filter(Boolean).join(", ");
  const dist = distanceKm(origin, coordinate);

  return {
    id: properties.id ?? `${coordinate.latitude},${coordinate.longitude}`,
    placeId: properties.id ?? `${coordinate.latitude},${coordinate.longitude}`,
    name,
    address,
    coordinate,
    category: categoryFromFeature(feature),
    distanceKm: dist
  };
}

function rankFeatures(features: any[], query: string, origin?: Coordinate | null): any[] {
  return [...features].sort((a, b) => scoreFeature(b, query, origin) - scoreFeature(a, query, origin));
}

function scoreFeature(feature: any, query: string, origin?: Coordinate | null): number {
  const properties = feature.properties ?? {};
  const label = `${properties.name ?? ""} ${properties.label ?? ""}`.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  let score = Number(properties.confidence ?? 0) * 100;

  if ((properties.name ?? "").toLowerCase() === normalizedQuery) score += 120;
  if (label.startsWith(normalizedQuery)) score += 80;
  if (label.includes(normalizedQuery)) score += 45;
  if (/(airport|railway|station|hospital|college|university|metro|bus stand|landmark)/i.test(label)) score += 24;

  const coordinates = feature.geometry?.coordinates;
  if (origin && Array.isArray(coordinates)) {
    const distance = distanceKm(origin, { latitude: coordinates[1], longitude: coordinates[0] });
    if (typeof distance === "number") score += Math.max(0, 100 - distance * 2);
  }

  return score;
}

function categoryFromFeature(feature: any): string | undefined {
  const properties = feature?.properties;
  return properties?.category ?? properties?.layer;
}

function setSearchCache(key: string, value: PlaceSuggestion[]) {
  if (searchCache.size >= maxSearchCacheEntries) {
    const oldestKey = searchCache.keys().next().value;
    if (oldestKey) searchCache.delete(oldestKey);
  }
  searchCache.set(key, value);
}

function suggestionToLocationResult(suggestion: PlaceSuggestion): LocationResult {
  const details = detailsCache.get(suggestion.placeId);
  return {
    id: suggestion.id,
    placeId: suggestion.placeId,
    label: suggestion.primaryText,
    address: suggestion.secondaryText,
    coordinate: details?.coordinate ?? defaultOriginLocation,
    category: suggestion.category,
    distanceKm: suggestion.distanceKm
  };
}

function locationResultToSuggestion(result: LocationResult): PlaceSuggestion {
  return {
    id: result.id,
    placeId: result.placeId ?? result.id,
    primaryText: result.label,
    secondaryText: result.address,
    description: `${result.address} (${result.distanceKm ?? 0} km away)`,
    category: result.category,
    distanceKm: result.distanceKm
  };
}

function normalizeQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function coordinateCacheKey(coordinate?: Coordinate | null): string {
  if (!coordinate) return "none";
  return `${coordinate.latitude.toFixed(4)},${coordinate.longitude.toFixed(4)}`;
}

function distanceKm(origin: Coordinate | null | undefined, destination: Coordinate): number | undefined {
  if (!origin) return undefined;
  const earthRadiusKm = 6371;
  const dLat = degreesToRadians(destination.latitude - origin.latitude);
  const dLon = degreesToRadians(destination.longitude - origin.longitude);
  const lat1 = degreesToRadians(origin.latitude);
  const lat2 = degreesToRadians(destination.latitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return Math.round(earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

function degreesToRadians(value: number): number {
  return (value * Math.PI) / 180;
}
