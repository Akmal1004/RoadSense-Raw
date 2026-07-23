import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { defaultTripStats, LocalTripStats, storageService } from "../services/storageService";
import { useAuth } from "../context/AuthContext";

export function useStats() {
  const { user } = useAuth();
  const [stats, setStats] = useState<LocalTripStats>(defaultTripStats);

  const fetchStats = useCallback(() => {
    storageService.getTripStats(user?.id).then(setStats);
  }, [user?.id]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useFocusEffect(
    useCallback(() => {
      fetchStats();
    }, [fetchStats])
  );

  return {
    raw: stats,
    trips: stats.plannedTrips,
    avgSafety: stats.plannedTrips ? stats.bestSafetyScore : 0,
    savedTime: stats.plannedTrips ? `${Math.max(0, Math.round(stats.totalEta * 0.08))}m` : "0m",
    fuelSaved: `Rs ${Math.round(stats.fuelCost * 0.08)}`,
    distanceDriven: `${stats.totalDistance.toFixed(1)} km`,
    completedTrips: stats.plannedTrips,
    safetyScore: stats.plannedTrips ? stats.bestSafetyScore : 0,
    fuelUsed: `${stats.fuelUsed.toFixed(2)} L`,
    totalFuelCost: `Rs ${Math.round(stats.fuelCost)}`
  };
}
