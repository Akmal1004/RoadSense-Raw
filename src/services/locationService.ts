import { Coordinate } from "../types/route";

const defaultCurrentLocation: Coordinate = { latitude: 13.0827, longitude: 80.2707 };

export async function getCurrentLocation(): Promise<Coordinate> {
  if (typeof window !== "undefined" && navigator && navigator.geolocation) {
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 7000,
          maximumAge: 10000
        });
      });
      return {
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude
      };
    } catch (error) {
      console.warn("[RoadSense Location] Browser Geolocation failed/denied", error);
    }
  }

  try {
    const Location = await import("expo-location");
    const permission = await Location.requestForegroundPermissionsAsync().catch(() => null);
    if (permission && permission.status === "granted") {
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
    }
  } catch (error) {
    console.warn("[RoadSense Location] expo-location failed", error);
  }

  return defaultCurrentLocation;
}

export function getDefaultLocation(): Coordinate {
  return defaultCurrentLocation;
}
