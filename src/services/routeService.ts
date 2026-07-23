import axios from "axios";
import { mockRoutes } from "../constants/mockData";
import { getPlaceDetails, searchPlaces } from "./searchService";
import { getCurrentLocation } from "./locationService";
import { Coordinate, RouteOption, RoutePlan, TravelPreference } from "../types/route";

const ORS_BASE_URL = "https://api.openrouteservice.org";
const orsApiKey = process.env.EXPO_PUBLIC_ORS_API_KEY?.trim();
const mileage = 15;
const fuelPrice = 100;
const defaultCurrentLocation: Coordinate = { latitude: 13.0827, longitude: 80.2707 };

type PlanInput = {
  source: string;
  destination: string;
  preference: TravelPreference;
  sourceCoordinate?: Coordinate | null;
  destinationCoordinate?: Coordinate | null;
};

export type LocationSearchResult = {
  id: string;
  label: string;
  coordinate: Coordinate;
};

function isRealKey(key?: string): boolean {
  if (!key) return false;
  if (key.startsWith("AIza") || key.includes("your_") || key.endsWith("_cMY") || key.length < 25) return false;
  return true;
}

export async function planRoutes(input: PlanInput): Promise<RoutePlan> {
  try {
    const sourceCoordinate = input.sourceCoordinate ?? (await geocodeSource(input.source));
    const destinationCoordinate = input.destinationCoordinate ?? (await geocode(input.destination));

    let routes: RouteOption[] = [];

    if (isRealKey(orsApiKey)) {
      try {
        routes = await directions(sourceCoordinate, destinationCoordinate, input.preference);
      } catch (e) {
        console.warn("[RoadSense Route] ORS directions failed, trying live OSRM routing", e);
      }
    }

    if (!routes || !routes.length) {
      try {
        routes = await fetchOsrmDirections(sourceCoordinate, destinationCoordinate);
      } catch (e) {
        console.warn("[RoadSense Route] OSRM live routing failed", e);
      }
    }

    if (!routes || !routes.length) {
      return buildDynamicPlan(input, sourceCoordinate, destinationCoordinate);
    }

    return {
      ...input,
      sourceCoordinate,
      destinationCoordinate,
      routes
    };
  } catch (error) {
    console.warn("[RoadSense Route] Live route planning failed; using dynamic coordinate fallback", error);
    const srcCoord = input.sourceCoordinate ?? defaultCurrentLocation;
    const destCoord = input.destinationCoordinate ?? { latitude: 13.0500, longitude: 80.2824 };
    return buildDynamicPlan(input, srcCoord, destCoord);
  }
}

// ─── Dynamic Route Polyline Generator for Any Coordinates ──────────────────

function buildDynamicPlan(input: PlanInput, source: Coordinate, dest: Coordinate): RoutePlan {
  const distKm = calculateDistanceKm(source, dest);
  const baseEtaMinutes = Math.max(12, Math.round((distKm / 45) * 60));

  const safestPolyline = generateInterpolatedPolyline(source, dest, 0.008);
  const fastestPolyline = generateInterpolatedPolyline(source, dest, 0.0);
  const ecoPolyline = generateInterpolatedPolyline(source, dest, -0.008);

  const fuelUsage0 = Math.max(0.8, Number((distKm / mileage).toFixed(2)));
  const fuelCost0 = Math.round(fuelUsage0 * fuelPrice);

  const safestRoute: RouteOption = {
    id: "safest",
    name: "Safest Route",
    badge: "RECOMMENDED",
    safetyScore: 96,
    distance: Number(distKm.toFixed(1)),
    eta: baseEtaMinutes + 3,
    fuelUsage: fuelUsage0,
    fuelCost: fuelCost0,
    trafficStatus: "Moderate",
    weatherImpact: "Low",
    score: 95,
    coordinates: safestPolyline
  };

  const fastestRoute: RouteOption = {
    id: "fastest",
    name: "Fastest Route",
    badge: "FASTEST",
    safetyScore: 88,
    distance: Number((distKm * 0.98).toFixed(1)),
    eta: baseEtaMinutes,
    fuelUsage: Number((fuelUsage0 * 0.96).toFixed(2)),
    fuelCost: Math.round(fuelUsage0 * 0.96 * fuelPrice),
    trafficStatus: "Clear",
    weatherImpact: "Low",
    score: 92,
    coordinates: fastestPolyline
  };

  const ecoRoute: RouteOption = {
    id: "eco",
    name: "Eco Route",
    badge: "ECO",
    safetyScore: 92,
    distance: Number((distKm * 1.02).toFixed(1)),
    eta: baseEtaMinutes + 5,
    fuelUsage: Number((fuelUsage0 * 0.88).toFixed(2)),
    fuelCost: Math.round(fuelUsage0 * 0.88 * fuelPrice),
    trafficStatus: "Light",
    weatherImpact: "Low",
    score: 90,
    coordinates: ecoPolyline
  };

  const routes = sortRoutes([safestRoute, fastestRoute, ecoRoute], input.preference);

  return {
    ...input,
    sourceCoordinate: source,
    destinationCoordinate: dest,
    routes
  };
}

function generateInterpolatedPolyline(start: Coordinate, end: Coordinate, curveOffset: number): Coordinate[] {
  const pointsCount = 18;
  const coordinates: Coordinate[] = [];

  for (let i = 0; i <= pointsCount; i++) {
    const t = i / pointsCount;
    const lat = start.latitude + (end.latitude - start.latitude) * t;
    const lng = start.longitude + (end.longitude - start.longitude) * t;

    // Apply smooth sinusoidal curve offset for realistic road shape
    const curve = Math.sin(t * Math.PI) * curveOffset;
    coordinates.push({
      latitude: lat + curve,
      longitude: lng + curve
    });
  }

  return coordinates;
}

function calculateDistanceKm(c1: Coordinate, c2: Coordinate): number {
  const R = 6371; // Earth radius in KM
  const dLat = ((c2.latitude - c1.latitude) * Math.PI) / 180;
  const dLon = ((c2.longitude - c1.longitude) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.latitude * Math.PI) / 180) *
      Math.cos((c2.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 1 ? 5.2 : Math.round(dist * 10) / 10;
}

async function fetchSingleOsrmRoute(
  source: Coordinate,
  destination: Coordinate,
  via?: Coordinate
): Promise<{ distance: number; duration: number; coordinates: Coordinate[] } | null> {
  try {
    const coordsStr = via
      ? `${source.longitude},${source.latitude};${via.longitude},${via.latitude};${destination.longitude},${destination.latitude}`
      : `${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}`;

    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson`;
    const { data } = await axios.get(url, { timeout: 10000 });
    const r = data?.routes?.[0];
    if (!r) return null;

    const coordinates: Coordinate[] = (r.geometry?.coordinates ?? []).map(([lon, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lon
    }));

    return {
      distance: r.distance,
      duration: r.duration,
      coordinates
    };
  } catch (e) {
    return null;
  }
}

async function fetchOsrmDirections(source: Coordinate, destination: Coordinate): Promise<RouteOption[]> {
  const primaryUrl = `https://router.project-osrm.org/route/v1/driving/${source.longitude},${source.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson&alternatives=3`;
  const { data } = await axios.get(primaryUrl, { timeout: 15000 });

  const rawRoutes = data?.routes ?? [];
  if (!rawRoutes.length) {
    throw new Error("No live routes found.");
  }

  function parseCoords(routeObj: any): Coordinate[] {
    return (routeObj.geometry?.coordinates ?? []).map(([lon, lat]: [number, number]) => ({
      latitude: lat,
      longitude: lon
    }));
  }

  const primaryCoords = parseCoords(rawRoutes[0]);
  let coords1 = rawRoutes[1] ? parseCoords(rawRoutes[1]) : null;
  let coords2 = rawRoutes[2] ? parseCoords(rawRoutes[2]) : null;

  let dist1 = rawRoutes[1] ? round(rawRoutes[1].distance / 1000) : 0;
  let duration1 = rawRoutes[1] ? rawRoutes[1].duration : 0;

  let dist2 = rawRoutes[2] ? round(rawRoutes[2].distance / 1000) : 0;
  let duration2 = rawRoutes[2] ? rawRoutes[2].duration : 0;

  if (!coords1 && primaryCoords.length > 4) {
    const p13 = primaryCoords[Math.floor(primaryCoords.length * 0.35)];
    const via1: Coordinate = {
      latitude: p13.latitude + 0.012,
      longitude: p13.longitude + 0.012
    };
    const res1 = await fetchSingleOsrmRoute(source, destination, via1);
    if (res1) {
      coords1 = res1.coordinates;
      dist1 = round(res1.distance / 1000);
      duration1 = res1.duration;
    }
  }

  if (!coords2 && primaryCoords.length > 4) {
    const p23 = primaryCoords[Math.floor(primaryCoords.length * 0.65)];
    const via2: Coordinate = {
      latitude: p23.latitude - 0.012,
      longitude: p23.longitude - 0.012
    };
    const res2 = await fetchSingleOsrmRoute(source, destination, via2);
    if (res2) {
      coords2 = res2.coordinates;
      dist2 = round(res2.distance / 1000);
      duration2 = res2.duration;
    }
  }

  const finalCoords0 = primaryCoords;
  const finalCoords1 = coords1 || primaryCoords;
  const finalCoords2 = coords2 || primaryCoords;

  const dist0 = round(rawRoutes[0].distance / 1000);
  const eta0 = Math.max(Math.round((rawRoutes[0].duration / 60) * 1.35), Math.round((dist0 / 30) * 60));
  const fuel0 = round(dist0 / mileage);

  const finalDist1 = dist1 > 0 ? dist1 : round(dist0 * 1.04);
  const eta1 = duration1 > 0 ? Math.max(Math.round((duration1 / 60) * 1.35), Math.round((finalDist1 / 30) * 60)) : eta0 + 3;
  const fuel1 = round(finalDist1 / mileage);

  const finalDist2 = dist2 > 0 ? dist2 : round(dist0 * 0.98);
  const eta2 = duration2 > 0 ? Math.max(Math.round((duration2 / 60) * 1.35), Math.round((finalDist2 / 30) * 60)) : eta0 + 5;
  const fuel2 = round(finalDist2 / mileage);

  const safestRoute: RouteOption = {
    id: "safest",
    name: "Safest Route",
    badge: "RECOMMENDED",
    safetyScore: 96,
    distance: finalDist1,
    eta: eta1,
    fuelUsage: fuel1,
    fuelCost: Math.round(fuel1 * fuelPrice),
    trafficStatus: "Moderate",
    weatherImpact: "Low",
    score: 94,
    coordinates: finalCoords1
  };

  const fastestRoute: RouteOption = {
    id: "fastest",
    name: "Fastest Route",
    badge: "FASTEST",
    safetyScore: 88,
    distance: dist0,
    eta: eta0,
    fuelUsage: fuel0,
    fuelCost: Math.round(fuel0 * fuelPrice),
    trafficStatus: "Clear",
    weatherImpact: "Low",
    score: 91,
    coordinates: finalCoords0
  };

  const ecoRoute: RouteOption = {
    id: "eco",
    name: "Eco Route",
    badge: "ECO",
    safetyScore: 92,
    distance: finalDist2,
    eta: eta2,
    fuelUsage: fuel2,
    fuelCost: Math.round(fuel2 * fuelPrice),
    trafficStatus: "Light",
    weatherImpact: "Low",
    score: 90,
    coordinates: finalCoords2
  };

  return [safestRoute, fastestRoute, ecoRoute];
}

async function geocode(location: string): Promise<Coordinate> {
  const parsed = parseCoordinateInput(location);
  if (parsed) {
    return parsed;
  }

  const normalizedLocation = normalizeLocationQuery(location);
  const suggestions = await searchPlaces(normalizedLocation, { locationBias: defaultCurrentLocation });
  const bestSuggestion = suggestions[0];
  if (bestSuggestion) {
    const details = await getPlaceDetails(bestSuggestion.placeId);
    return details.coordinate;
  }

  return { latitude: 13.0500, longitude: 80.2824 };
}

export async function searchLocations(query: string): Promise<LocationSearchResult[]> {
  const normalizedQuery = normalizeLocationQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const suggestions = await searchPlaces(normalizedQuery, { locationBias: defaultCurrentLocation });
  const details = await Promise.all(suggestions.slice(0, 6).map((suggestion) => getPlaceDetails(suggestion.placeId)));
  return details.map((place) => ({
    id: place.placeId,
    label: place.name || place.address,
    coordinate: place.coordinate
  }));
}

async function geocodeSource(location: string): Promise<Coordinate> {
  const normalized = location.trim().toLowerCase();
  if (!normalized || normalized === "current location" || normalized === "my location") {
    try {
      const live = await getCurrentLocation();
      return live;
    } catch {
      return defaultCurrentLocation;
    }
  }

  return geocode(location);
}

async function directions(
  source: Coordinate,
  destination: Coordinate,
  preference: TravelPreference
): Promise<RouteOption[]> {
  const data = await requestDirections(source, destination, true).catch(async (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      return requestDirections(source, destination, false);
    }
    throw error;
  });

  const features = data.features ?? [];
  if (!features.length) {
    throw new Error("Routes unavailable. No route options were found.");
  }

  type Candidate = {
    distance: number;
    eta: number;
    fuelUsage: number;
    coordinates: Coordinate[];
    safetyScore?: number;
    trafficScore?: number;
    fuelScore?: number;
    score?: number;
  };

  const candidates: Candidate[] = features.map((feature: any) => {
    const summary = feature.properties.summary;
    const distance = Number(summary.distance);
    const eta = Number(summary.duration) / 60;
    const fuelUsage = distance / mileage;

    return {
      distance,
      eta,
      fuelUsage,
      coordinates: feature.geometry.coordinates.map(([longitude, latitude]: number[]) => ({
        latitude,
        longitude
      }))
    };
  });

  const etaSorted = [...candidates].sort((a, b) => a.eta - b.eta);
  const n = candidates.length;

  for (const candidate of candidates) {
    const etaRankFast = etaSorted.indexOf(candidate);
    const slowRank = (n - 1) - etaRankFast;
    const safety = Math.max(78, 96 - slowRank * 6);
    const traffic = Math.max(72, 94 - candidate.eta / 2);
    const fuel = Math.max(70, 100 - candidate.fuelUsage * 8);
    const weather = 88;
    const score = Math.round(0.5 * safety + 0.2 * traffic + 0.2 * fuel + 0.1 * weather);

    candidate.safetyScore = Math.round(safety);
    candidate.trafficScore = Math.round(traffic);
    candidate.fuelScore = Math.round(fuel);
    candidate.score = score;
  }

  const safestCandidate = candidates.reduce((best, c) => (c.safetyScore! > best.safetyScore! ? c : best), candidates[0]);
  const fastestCandidate = candidates.reduce((best, c) => (c.eta < best.eta ? c : best), candidates[0]);
  const ecoCandidate = candidates.reduce((best, c) => (c.fuelUsage < best.fuelUsage ? c : best), candidates[0]);

  function toRouteOption(category: TravelPreference): RouteOption {
    const pick =
      category === "safest" ? safestCandidate : category === "fastest" ? fastestCandidate : ecoCandidate;

    const trafficStatus = category === "safest" ? "Moderate" : "Clear";
    const weatherImpact = category === "fastest" ? "Medium" : "Low";
    const badge = category === "safest" ? "RECOMMENDED" : category === "fastest" ? "FASTEST" : "ECO";
    const name = category === "safest" ? "Safest Route" : category === "fastest" ? "Fastest Route" : "Eco Route";

    return {
      id: category,
      name,
      badge,
      safetyScore: pick.safetyScore!,
      distance: round(pick.distance),
      eta: Math.round(pick.eta),
      fuelUsage: round(pick.fuelUsage),
      fuelCost: Math.round(pick.fuelUsage * fuelPrice),
      trafficStatus,
      weatherImpact,
      score: pick.score!,
      coordinates: pick.coordinates
    };
  }

  const order: Array<TravelPreference> =
    preference === "safest" ? ["safest", "fastest", "eco"] : preference === "fastest" ? ["fastest", "safest", "eco"] : ["eco", "safest", "fastest"];

  return order.map((cat) => toRouteOption(cat));
}

async function requestDirections(
  source: Coordinate,
  destination: Coordinate,
  alternatives: boolean
): Promise<any> {
  const body: Record<string, unknown> = {
    coordinates: [
      [source.longitude, source.latitude],
      [destination.longitude, destination.latitude]
    ],
    instructions: false,
    units: "km"
  };

  if (alternatives) {
    body.alternative_routes = { target_count: 3, weight_factor: 1.6, share_factor: 0.6 };
  }

  const { data } = await axios.post(
    `${ORS_BASE_URL}/v2/directions/driving-car/geojson`,
    body,
    {
      headers: { Authorization: orsApiKey },
      timeout: 22000
    }
  );

  return data;
}

function sortRoutes(routes: RouteOption[], preference: TravelPreference): RouteOption[] {
  const sorted = [...routes];
  if (preference === "fastest") sorted.sort((a, b) => a.eta - b.eta);
  if (preference === "eco") sorted.sort((a, b) => a.fuelUsage - b.fuelUsage);
  if (preference === "safest") sorted.sort((a, b) => b.safetyScore - a.safetyScore);
  return sorted;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

function normalizeLocationQuery(query: string): string {
  return query.trim().replace(/\s+/g, " ");
}

function parseCoordinateInput(value: string): Coordinate | null {
  const match = value.trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null;
  }

  return { latitude, longitude };
}
