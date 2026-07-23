import AsyncStorage from "@react-native-async-storage/async-storage";
import { SearchHistory } from "../types/search";

const recentSearchesBaseKey = "roadsense_recent_searches";
const favoriteLocationsBaseKey = "roadsense_favorite_locations";

function getRecentSearchesKey(userId?: string): string {
  return userId ? `${recentSearchesBaseKey}:${userId}` : recentSearchesBaseKey;
}

function getFavoriteLocationsKey(userId?: string): string {
  return userId ? `${favoriteLocationsBaseKey}:${userId}` : favoriteLocationsBaseKey;
}

async function readHistory(key: string): Promise<SearchHistory[]> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.warn(`[RoadSense Storage] Read failed for ${key}`, error);
    return [];
  }
}

export async function getRecentSearches(userId?: string): Promise<SearchHistory[]> {
  const key = getRecentSearchesKey(userId);
  const searches = await readHistory(key);
  return searches.sort((a, b) => b.searchedAt - a.searchedAt).slice(0, 10);
}

export async function saveRecentSearch(search: Omit<SearchHistory, "searchedAt">, userId?: string): Promise<void> {
  const key = getRecentSearchesKey(userId);
  const current = await readHistory(key);
  const normalizedLabel = search.label.trim().toLowerCase();
  const next: SearchHistory[] = [
    {
      ...search,
      label: search.label.trim(),
      searchedAt: Date.now()
    },
    ...current.filter((item) => item.label.trim().toLowerCase() !== normalizedLabel && item.placeId !== search.placeId)
  ].slice(0, 10);

  await AsyncStorage.setItem(key, JSON.stringify(next)).catch((error) => {
    console.warn("[RoadSense Storage] Recent searches save failed", error);
  });
}

export async function getFavoriteLocations(userId?: string): Promise<SearchHistory[]> {
  const key = getFavoriteLocationsKey(userId);
  return readHistory(key);
}

export async function saveFavoriteLocation(favorite: Omit<SearchHistory, "searchedAt">, userId?: string): Promise<void> {
  const key = getFavoriteLocationsKey(userId);
  const current = await getFavoriteLocations(userId);
  const normalizedLabel = favorite.label.trim().toLowerCase();
  const next: SearchHistory[] = [
    {
      ...favorite,
      label: favorite.label.trim(),
      searchedAt: Date.now()
    },
    ...current.filter((item) => item.label.trim().toLowerCase() !== normalizedLabel && item.placeId !== favorite.placeId)
  ].slice(0, 10);

  await AsyncStorage.setItem(key, JSON.stringify(next)).catch((error) => {
    console.warn("[RoadSense Storage] Favorite location save failed", error);
  });
}
