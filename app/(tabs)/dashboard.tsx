import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import GlassCard from "../../src/components/GlassCard";
import StatCard from "../../src/components/StatCard";
import { routeColor } from "../../src/constants/routeDisplay";
import { spacing } from "../../src/constants/theme";
import { useAppState } from "../../src/context/AppStateContext";
import { useAuth } from "../../src/context/AuthContext";
import { useStats } from "../../src/hooks/useStats";
import { useWeather } from "../../src/hooks/useWeather";
import { useTheme } from "../../src/theme/hooks/useTheme";
import { useIsFocused } from "@react-navigation/native";

const ROUTE_TYPES = [
  { id: "safest", label: "Safest", color: "#39FF14" },
  { id: "fastest", label: "Fastest", color: "#00E5FF" },
  { id: "eco", label: "Eco", color: "#7C3AED" }
];

export default function DashboardScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768 || Platform.OS === "web";
  const stats = useStats();
  const { routePlan } = useAppState();
  const weather = useWeather(routePlan?.sourceCoordinate);
  const bestRoute = routePlan?.routes[0];

  const safetyAnalytics = ROUTE_TYPES.map((type, index) => {
    const route = routePlan?.routes[index];
    return route
      ? {
          id: route.id,
          label: route.name.replace(" Route", ""),
          score: route.safetyScore,
          color: routeColor(route.id, index)
        }
      : { id: type.id, label: type.label, score: 0, color: type.color };
  });

  if (!isFocused) return null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: "transparent" }]}
      contentContainerStyle={[styles.content, isDesktop && { paddingTop: 84 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>
            Trip <Text style={{ color: theme.primary }}>Intelligence</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            {user ? `${user.name}'s driving analytics center` : "Your driving analytics center"}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View style={[styles.liveBadge, { backgroundColor: "rgba(57,255,20,0.10)", borderColor: "rgba(57,255,20,0.30)" }]}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>Live</Text>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.avatarButton, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}
          >
            <MaterialCommunityIcons name={(user?.avatar as any) || "account-circle"} size={22} color={theme.primary} />
          </Pressable>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.grid}>
        <StatCard label="Distance Driven" value={stats.distanceDriven} icon="speedometer" />
        <StatCard label="Trips Completed" value={stats.completedTrips} icon="check-decagram" />
      </View>
      <View style={styles.grid}>
        <StatCard label="Fuel Saved" value={stats.fuelSaved} icon="leaf" />
        <StatCard label="Safety Score" value={stats.safetyScore} icon="shield-star" />
      </View>

      {/* Driving Insights */}
      <Section title="Driving Insights" icon="route" />
      <GlassCard>
        {[
          { label: "Active Destination", value: routePlan?.destination ?? "No route planned yet", icon: "map-marker-radius" },
          { label: "Best Route", value: bestRoute?.name ?? "Plan a route to calculate", icon: "navigation-variant" },
          { label: "Current ETA", value: bestRoute ? `${bestRoute.eta} minutes` : "Unavailable", icon: "clock-fast" },
          { label: "Est. Fuel Usage", value: bestRoute ? `${bestRoute.fuelUsage.toFixed(2)} L` : "Unavailable", icon: "gas-station" }
        ].map((row) => (
          <View key={row.label} style={[styles.insightRow, { borderBottomColor: theme.border }]}>
            <View style={[styles.insightIcon, { backgroundColor: theme.chipBackground }]}>
              <MaterialCommunityIcons name={row.icon as any} size={16} color={theme.primary} />
            </View>
            <View style={styles.insightContent}>
              <Text style={[styles.insightLabel, { color: theme.textSecondary }]}>{row.label}</Text>
              <Text style={[styles.insightValue, { color: theme.text }]}>{row.value}</Text>
            </View>
          </View>
        ))}
      </GlassCard>

      {/* Live Hazards */}
      <Section title="Live Hazards Feed" icon="alert-circle-outline" />
      <GlassCard>
        <View style={styles.emptyState}>
          <View style={[styles.shieldWrap, { backgroundColor: "rgba(57,255,20,0.10)", borderColor: "rgba(57,255,20,0.30)" }]}>
            <MaterialCommunityIcons name="shield-check" size={28} color={theme.success} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>All Clear — No Hazards</Text>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Traffic incident feeds are not connected in this MVP. Sensors report clear conditions.
          </Text>
        </View>
      </GlassCard>

      {/* Weather Intelligence */}
      <Section title="Weather Intelligence" icon="weather-partly-cloudy" />
      <GlassCard>
        <View style={styles.weatherTop}>
          <View>
            <Text style={[styles.weatherTemp, { color: theme.text }]}>
              {weather ? `${weather.temperature}°C` : "29°C"}
            </Text>
            <Text style={[styles.weatherCondition, { color: theme.primary }]}>
              {weather?.conditions ?? "Partly cloudy"}
            </Text>
          </View>
          <View style={[styles.weatherIconWrap, { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder }]}>
            <MaterialCommunityIcons name="weather-cloudy" size={34} color={theme.primary} />
          </View>
        </View>
        <View style={styles.weatherGrid}>
          {[
            { label: "Visibility", value: weather?.visibility ?? "Good", icon: "eye-outline" },
            { label: "Rain Chance", value: `${weather?.rainProbability ?? 22}%`, icon: "weather-rainy" },
            { label: "Road Condition", value: weather?.roadCondition ?? "Normal grip", icon: "road-variant" },
            { label: "Impact Score", value: `${weather?.impactScore ?? 24}/100`, icon: "gauge" }
          ].map((item) => (
            <View key={item.label} style={[styles.weatherCell, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <MaterialCommunityIcons name={item.icon as any} size={18} color={theme.primary} />
              <Text style={[styles.weatherCellValue, { color: theme.text }]}>{item.value}</Text>
              <Text style={[styles.weatherCellLabel, { color: theme.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      </GlassCard>

      {/* Safety Analytics */}
      <Section title="Safety Analytics" icon="shield-star-outline" />
      <GlassCard>
        <Text style={[styles.rowText, { color: theme.textSecondary }]}>
          Routes compared: {routePlan?.routes.length ?? 0}
        </Text>
        <View style={styles.circleRow}>
          {safetyAnalytics.map((item) => (
            <View key={item.id} style={styles.circleWrap}>
              <View style={[styles.safetyCircle, { borderColor: item.color, shadowColor: item.color }]}>
                <Text style={[styles.circleScore, { color: theme.text }]}>{item.score || "--"}</Text>
                <Text style={[styles.circleUnit, { color: theme.textSecondary }]}>/100</Text>
              </View>
              <View style={[styles.circleLabelBadge, { backgroundColor: `${item.color}18`, borderColor: `${item.color}40` }]}>
                <Text style={[styles.circleLabel, { color: item.color }]}>{item.label}</Text>
              </View>
            </View>
          ))}
        </View>
      </GlassCard>
    </ScrollView>
  );
}

function Section({ title, icon }: { title: string; icon: string }) {
  const { theme } = useTheme();
  return (
    <View style={styles.section}>
      <View style={[styles.sectionIcon, { backgroundColor: theme.chipBackground }]}>
        <MaterialCommunityIcons name={icon as any} size={15} color={theme.primary} />
      </View>
      <Text style={[styles.sectionText, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.screen, paddingBottom: 128, paddingTop: 34 },

  titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 22 },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { marginTop: 5, fontSize: 13 },
  liveBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 7
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#39FF14" },
  liveText: { color: "#39FF14", fontSize: 12, fontWeight: "800" },
  avatarButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },

  grid: { flexDirection: "row", gap: 12, marginBottom: 12 },

  section: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 26, marginBottom: 12 },
  sectionIcon: { alignItems: "center", borderRadius: 10, height: 28, justifyContent: "center", width: 28 },
  sectionText: { fontSize: 18, fontWeight: "900" },
  sectionLine: { flex: 1, height: 1, borderRadius: 1, opacity: 0.5 },

  insightRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 11, borderBottomWidth: 1 },
  insightIcon: { alignItems: "center", borderRadius: 12, height: 34, justifyContent: "center", width: 34 },
  insightContent: { flex: 1 },
  insightLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  insightValue: { fontSize: 14, fontWeight: "800" },

  emptyState: { alignItems: "center", gap: 10, paddingVertical: 12 },
  shieldWrap: { alignItems: "center", borderRadius: 24, borderWidth: 1, height: 54, justifyContent: "center", width: 54 },
  emptyTitle: { fontSize: 16, fontWeight: "900" },
  emptyText: { lineHeight: 20, textAlign: "center", fontSize: 13 },

  weatherTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  weatherTemp: { fontSize: 42, fontWeight: "900", letterSpacing: -1 },
  weatherCondition: { fontSize: 14, fontWeight: "700", marginTop: 2 },
  weatherIconWrap: { alignItems: "center", borderRadius: 20, borderWidth: 1, height: 64, justifyContent: "center", width: 64 },
  weatherGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  weatherCell: {
    alignItems: "center", borderRadius: 16, borderWidth: 1,
    flex: 1, minWidth: "45%", gap: 4, paddingVertical: 12, paddingHorizontal: 10
  },
  weatherCellValue: { fontSize: 15, fontWeight: "900" },
  weatherCellLabel: { fontSize: 11, fontWeight: "600" },

  rowText: { fontSize: 13, lineHeight: 22, marginBottom: 6 },
  circleRow: { flexDirection: "row", gap: 12, justifyContent: "space-between", marginTop: 14 },
  circleWrap: { alignItems: "center", flex: 1, gap: 10 },
  safetyCircle: {
    alignItems: "center", borderRadius: 999, borderWidth: 4,
    height: 92, justifyContent: "center", width: 92,
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 12
  },
  circleScore: { fontSize: 26, fontWeight: "900" },
  circleUnit: { fontSize: 11, fontWeight: "800", marginTop: -2 },
  circleLabelBadge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 },
  circleLabel: { fontSize: 11, fontWeight: "800" }
});
