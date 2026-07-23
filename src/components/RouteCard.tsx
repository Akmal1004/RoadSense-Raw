import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { routeColor } from "../constants/routeDisplay";
import { RouteOption } from "../types/route";
import GlassCard from "./GlassCard";
import { useTheme } from "../theme/hooks/useTheme";

import { formatArrivalTime, getDepartureAndArrivalTimes } from "../utils/timeFormat";

export default function RouteCard({ route, active = false, index = 0 }: { route: RouteOption; active?: boolean; index?: number }) {
  const { theme } = useTheme();
  const color = routeColor(route.id, index);
  const { arrivalTime, departureTime } = getDepartureAndArrivalTimes(route.eta);

  return (
    <GlassCard
      style={[
        styles.card,
        { borderColor: active ? color : theme.border, shadowColor: active ? color : "transparent" },
        active && styles.activeCardGlow
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={[styles.colorBar, { backgroundColor: color, shadowColor: color }]} />
          <View>
            <Text style={[styles.name, { color: theme.text }]}>{route.name}</Text>
            <Text style={[styles.score, { color: theme.textSecondary }]}>
              AI Score: <Text style={{ color: theme.primary, fontWeight: "900" }}>{route.score}/100</Text>
            </Text>
          </View>
        </View>
        <View style={[styles.badge, { borderColor: color, backgroundColor: `${color}1F` }]}>
          <Text style={[styles.badgeText, { color }]}>{route.badge}</Text>
        </View>
      </View>

      {/* Arrival & Departure Timing Banner */}
      <View style={[styles.timingBanner, { backgroundColor: "rgba(245, 158, 11, 0.08)", borderColor: "rgba(245, 158, 11, 0.25)" }]}>
        <MaterialCommunityIcons name="clock-fast" size={16} color={theme.primary} />
        <Text style={[styles.timingText, { color: theme.text }]}>
          ETA: <Text style={{ color: theme.primary, fontWeight: "900" }}>{route.eta} mins</Text> ({departureTime} ➔ <Text style={{ color: "#10B981", fontWeight: "900" }}>{arrivalTime}</Text>)
        </Text>
      </View>

      {active ? (
        <View style={styles.selectedRow}>
          <MaterialCommunityIcons name="check-circle" size={15} color={color} />
          <Text style={[styles.selectedText, { color }]}>Active Selected Route</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        <Metric icon="shield-check" label="Safety Index" value={`${route.safetyScore}/100`} color="#10B981" />
        <Metric icon="map-marker-distance" label="Total Distance" value={`${route.distance} km`} color="#00F0FF" />
        <Metric icon="car-speed-limiter" label="Traffic Condition" value={route.trafficStatus} color="#FACC15" />
        <Metric icon="gas-station" label="Fuel Estimate" value={`${route.fuelUsage.toFixed(2)} L`} color="#8B5CF6" />
        <Metric icon="cash" label="Est. Fuel Cost" value={`Rs ${route.fuelCost}`} color="#EC4899" />
        <Metric icon="weather-cloudy-alert" label="Weather Impact" value={route.weatherImpact} color="#3B82F6" />
      </View>
    </GlassCard>
  );
}

function Metric({ icon, label, value, color }: { icon: string; label: string; value: string; color?: string }) {
  const { theme } = useTheme();

  return (
    <View style={[styles.metric, { backgroundColor: "rgba(255, 255, 255, 0.03)", borderColor: "rgba(255, 255, 255, 0.07)" }]}>
      <MaterialCommunityIcons name={icon as any} size={16} color={color || theme.primary} />
      <View>
        <Text style={[styles.metricValue, { color: theme.text }]}>{value}</Text>
        <Text style={[styles.metricLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    marginBottom: 16
  },
  activeCardGlow: {
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 18
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  titleRow: {
    alignItems: "center",
    flexDirection: "row",
    flex: 1,
    gap: 10
  },
  colorBar: {
    borderRadius: 999,
    height: 38,
    width: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6
  },
  name: {
    fontSize: 18,
    fontWeight: "900"
  },
  score: {
    marginTop: 4,
    fontSize: 12
  },
  badge: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5
  },
  timingBanner: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  timingText: {
    fontSize: 13,
    fontWeight: "600"
  },
  selectedRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    marginTop: 12
  },
  selectedText: {
    fontSize: 12,
    fontWeight: "900"
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16
  },
  metric: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    minWidth: "47%",
    padding: 10
  },
  metricValue: {
    fontSize: 13,
    fontWeight: "900"
  },
  metricLabel: {
    fontSize: 11
  }
});
