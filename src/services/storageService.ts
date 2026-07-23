import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatMessage } from "../types/chat";
import { RoutePlan, TravelPreference } from "../types/route";
import { apiService } from "./apiService";

const keys = {
  recentDestinations: "roadsense:recent-destinations",
  routePlan: "roadsense:route-plan",
  preferences: "roadsense:preferences",
  chat: "roadsense:chat",
  stats: "roadsense:stats"
};

export type LocalTripStats = {
  plannedTrips: number;
  totalDistance: number;
  totalEta: number;
  fuelUsed: number;
  fuelCost: number;
  bestSafetyScore: number;
  lastUpdated?: number;
};

export type UserPreferences = {
  defaultRouteType: TravelPreference;
  vehicleMileage: number;
  fuelPrice: number;
  units: "metric" | "imperial";
};

export const defaultPreferences: UserPreferences = {
  defaultRouteType: "safest",
  vehicleMileage: 15,
  fuelPrice: 100,
  units: "metric"
};

export const defaultTripStats: LocalTripStats = {
  plannedTrips: 0,
  totalDistance: 0,
  totalEta: 0,
  fuelUsed: 0,
  fuelCost: 0,
  bestSafetyScore: 0
};

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const value = await AsyncStorage.getItem(key);
    if (!value) return fallback;
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn(`[RoadSense Storage] Failed to read ${key}; using fallback`, error);
    return fallback;
  }
}

async function writeJson<T>(key: string, value: T): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`[RoadSense Storage] Failed to write ${key}`, error);
  }
}

export const storageService = {
  getRecentDestinations: () => readJson<string[]>(keys.recentDestinations, []),
  async addRecentDestination(destination: string) {
    const current = await storageService.getRecentDestinations();
    const next = [destination, ...current.filter((item) => item !== destination)].slice(0, 8);
    await writeJson(keys.recentDestinations, next);
  },
  getRoutePlan: () => readJson<RoutePlan | null>(keys.routePlan, null),
  saveRoutePlan: (plan: RoutePlan | null) => writeJson(keys.routePlan, plan),

  async getTripStats(userId?: string): Promise<LocalTripStats> {
    if (userId) {
      try {
        const stats = await apiService.fetchTripStats(userId);
        if (stats) return stats;
      } catch (err) {
        console.info("[Storage] DB stats fetch offline, using user-scoped local storage.");
      }
    }
    const userKey = userId ? `${keys.stats}:${userId}` : keys.stats;
    return readJson<LocalTripStats>(userKey, defaultTripStats);
  },

  async recordPlannedTrip(plan: RoutePlan, userId?: string) {
    const bestRoute = plan.routes[0];

    // Attempt DB record save
    if (userId) {
      try {
        await apiService.saveTripHistory(userId, {
          sourceName: plan.source || "Current Location",
          destinationName: plan.destination || "Destination",
          sourceLat: plan.sourceCoordinate?.latitude || 0,
          sourceLng: plan.sourceCoordinate?.longitude || 0,
          destLat: plan.destinationCoordinate?.latitude || 0,
          destLng: plan.destinationCoordinate?.longitude || 0,
          distanceKm: bestRoute.distance,
          etaMinutes: bestRoute.eta,
          fuelCost: bestRoute.fuelCost,
          safetyScore: bestRoute.safetyScore,
          preferredRouteType: plan.preference || "safest"
        });
      } catch (err) {
        console.info("[Storage] Save trip to DB offline, updating local stats.");
      }
    }

    const current = await this.getTripStats(userId);
    const next: LocalTripStats = {
      plannedTrips: current.plannedTrips + 1,
      totalDistance: current.totalDistance + bestRoute.distance,
      totalEta: current.totalEta + bestRoute.eta,
      fuelUsed: current.fuelUsed + bestRoute.fuelUsage,
      fuelCost: current.fuelCost + bestRoute.fuelCost,
      bestSafetyScore: Math.max(current.bestSafetyScore, bestRoute.safetyScore),
      lastUpdated: Date.now()
    };

    const userKey = userId ? `${keys.stats}:${userId}` : keys.stats;
    await writeJson(userKey, next);
  },

  async getPreferences(userId?: string): Promise<UserPreferences> {
    const userKey = userId ? `${keys.preferences}:${userId}` : keys.preferences;
    return readJson<UserPreferences>(userKey, defaultPreferences);
  },

  async savePreferences(preferences: UserPreferences, userId?: string) {
    const userKey = userId ? `${keys.preferences}:${userId}` : keys.preferences;
    await writeJson(userKey, preferences);
  },

  async getChatHistory(userId?: string): Promise<ChatMessage[]> {
    if (userId) {
      try {
        const messages = await apiService.fetchChatHistory(userId);
        if (messages && messages.length > 0) return messages;
      } catch (err) {
        console.info("[Storage] DB chat fetch offline, using local storage.");
      }
    }
    const userKey = userId ? `${keys.chat}:${userId}` : keys.chat;
    return readJson<ChatMessage[]>(userKey, []);
  },

  async saveChatHistory(messages: ChatMessage[], userId?: string) {
    const userKey = userId ? `${keys.chat}:${userId}` : keys.chat;
    await writeJson(userKey, messages.slice(-40));
  },

  async clearChatHistory(userId?: string) {
    if (userId) {
      try {
        await apiService.clearChatHistory(userId);
      } catch (err) {
        console.info("[Storage] DB chat clear offline.");
      }
    }
    const userKey = userId ? `${keys.chat}:${userId}` : keys.chat;
    await AsyncStorage.removeItem(userKey).catch((error) => {
      console.warn("[RoadSense Storage] Chat clear failed", error);
    });
  }
};
