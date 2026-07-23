import { useEffect, useMemo, useState } from "react";
import { Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import GlassCard from "../../src/components/GlassCard";
import GradientButton from "../../src/components/GradientButton";
import MapLibreRoutePreview from "../../src/components/MapLibreRoutePreview";
import RouteCard from "../../src/components/RouteCard";
import { spacing } from "../../src/constants/theme";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useAppState } from "../../src/context/AppStateContext";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/theme/hooks/useTheme";
import { getDepartureAndArrivalTimes } from "../../src/utils/timeFormat";

export default function RoutesScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { routePlan } = useAppState();
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [compareOpen, setCompareOpen] = useState(false);
  const [navigationOpen, setNavigationOpen] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = width > 768 || Platform.OS === "web";

  const selectedRoute = useMemo(
    () => routePlan?.routes.find((route) => route.id === selectedRouteId) ?? routePlan?.routes[0],
    [routePlan, selectedRouteId]
  );

  const selectedTiming = useMemo(() => {
    if (!selectedRoute) return null;
    return getDepartureAndArrivalTimes(selectedRoute.eta);
  }, [selectedRoute]);

  useEffect(() => {
    if (routePlan?.routes[0]) {
      setSelectedRouteId(routePlan.routes[0].id);
    } else {
      setSelectedRouteId(null);
    }
  }, [routePlan]);

  async function openGoogleMaps() {
    if (!routePlan || !selectedRoute) return;
    const origin = `${routePlan.sourceCoordinate.latitude},${routePlan.sourceCoordinate.longitude}`;
    const destination = `${routePlan.destinationCoordinate.latitude},${routePlan.destinationCoordinate.longitude}`;
    let waypointsParam = "";
    const coords = selectedRoute.coordinates;
    if (coords && coords.length >= 6) {
      const p1 = coords[Math.floor(coords.length * 0.25)];
      const p2 = coords[Math.floor(coords.length * 0.5)];
      const p3 = coords[Math.floor(coords.length * 0.75)];
      waypointsParam = `&waypoints=${p1.latitude},${p1.longitude}|${p2.latitude},${p2.longitude}|${p3.latitude},${p3.longitude}`;
    }
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypointsParam}&travelmode=driving`;
    await Linking.openURL(url).catch((err) => {
      console.warn("[RoadSense Navigation] Google Maps launch failed", err);
    });
  }

  if (!isFocused) return null;

  return (
    <View style={[styles.root, { backgroundColor: "transparent" }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          isDesktop ? { paddingTop: 84 } : { paddingTop: spacing.screen },
          isDesktop && styles.desktopContent
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: theme.text }]}>
              Route <Text style={{ color: theme.primary }}>Planner</Text>
            </Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              AI-ranked routes with live timing & safety scores.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.avatarButton, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}
          >
            <MaterialCommunityIcons name={(user?.avatar as any) || "account-circle"} size={22} color={theme.primary} />
          </Pressable>
        </View>

        {isDesktop ? (
          <View style={styles.desktopLayout}>
            {/* Left column */}
            <View style={styles.desktopLeftCol}>
              <SectionHeader title="Route Options" theme={theme}>
                <Pressable
                  style={[styles.compare, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}
                  onPress={() => setCompareOpen(true)}
                >
                  <MaterialCommunityIcons name="compare-horizontal" color={theme.primary} size={15} />
                  <Text style={[styles.compareText, { color: theme.primary }]}>Compare</Text>
                </Pressable>
              </SectionHeader>

              {routePlan?.routes.map((route, index) => (
                <Pressable key={route.id} onPress={() => setSelectedRouteId(route.id)}>
                  <RouteCard route={route} active={selectedRoute?.id === route.id} index={index} />
                </Pressable>
              )) ?? (
                <GlassCard>
                  <EmptyRoutes theme={theme} />
                </GlassCard>
              )}

              {selectedRoute && selectedTiming ? (
                <AnalysisCard route={selectedRoute} timing={selectedTiming} theme={theme} />
              ) : null}
            </View>

            {/* Right column */}
            <View style={styles.desktopRightCol}>
              <GlassCard style={{ flex: 1, minHeight: 620, padding: 12 }}>
                <SectionHeader title="Interactive Route Map" theme={theme} />
                <View style={{ flex: 1, minHeight: 480, borderRadius: 16, overflow: "hidden" }}>
                  <MapLibreRoutePreview
                    plan={routePlan}
                    compact
                    selectedRouteId={selectedRoute?.id}
                    onSelectRoute={setSelectedRouteId}
                  />
                </View>
                {selectedRoute ? (
                  <GradientButton
                    label="Open Navigation in Google Maps"
                    icon="google-maps"
                    onPress={openGoogleMaps}
                    style={{ marginTop: 14 }}
                  />
                ) : null}
              </GlassCard>
            </View>
          </View>
        ) : (
          <>
            {/* Mobile map */}
            <MapLibreRoutePreview
              plan={routePlan}
              compact
              selectedRouteId={selectedRoute?.id}
              onSelectRoute={setSelectedRouteId}
            />

            {selectedRoute && selectedTiming ? (
              <AnalysisCard route={selectedRoute} timing={selectedTiming} theme={theme} />
            ) : null}

            <SectionHeader title="Route Options" theme={theme}>
              <Pressable
                style={[styles.compare, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}
                onPress={() => setCompareOpen(true)}
              >
                <MaterialCommunityIcons name="compare-horizontal" color={theme.primary} size={15} />
                <Text style={[styles.compareText, { color: theme.primary }]}>Compare</Text>
              </Pressable>
            </SectionHeader>

            {routePlan?.routes.map((route, index) => (
              <Pressable key={route.id} onPress={() => setSelectedRouteId(route.id)}>
                <RouteCard route={route} active={selectedRoute?.id === route.id} index={index} />
              </Pressable>
            )) ?? (
              <GlassCard>
                <EmptyRoutes theme={theme} />
              </GlassCard>
            )}
          </>
        )}
      </ScrollView>

      {/* Start Navigation sticky button */}
      <View style={styles.sticky}>
        <GradientButton
          label="Start Navigation"
          icon="navigation-variant"
          onPress={() => routePlan && setNavigationOpen(true)}
        />
      </View>

      {/* Compare Modal */}
      <Modal visible={compareOpen} transparent animationType="slide" onRequestClose={() => setCompareOpen(false)}>
        <View style={[styles.modalWrap, { backgroundColor: theme.modalOverlay }]}>
          <GlassCard style={[styles.modal, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Route Comparison</Text>
              <Pressable
                onPress={() => setCompareOpen(false)}
                style={[styles.closeBtn, { backgroundColor: theme.iconButton }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Table header */}
            <View style={[styles.compareHeaderRow, { borderBottomColor: theme.border }]}>
              {["Route", "ETA", "Dist.", "Score"].map((h) => (
                <Text key={h} style={[styles.compareHeaderCell, { color: theme.textSecondary }]}>{h}</Text>
              ))}
            </View>

            {routePlan?.routes.map((route) => {
              const timing = getDepartureAndArrivalTimes(route.eta);
              return (
                <View key={route.id} style={[styles.compareRow, { borderBottomColor: theme.border }]}>
                  <View style={{ flex: 2 }}>
                    <Text style={[styles.compareName, { color: theme.text }]}>{route.name}</Text>
                    <Text style={{ fontSize: 10, color: theme.textSecondary }}>~{timing.arrivalTime}</Text>
                  </View>
                  <Text style={[styles.compareMetric, { color: theme.primary }]}>{route.eta}m</Text>
                  <Text style={[styles.compareMetric, { color: theme.textSecondary }]}>{route.distance}km</Text>
                  <Text style={[styles.compareMetric, { color: theme.success }]}>{route.score}</Text>
                </View>
              );
            })}
          </GlassCard>
        </View>
      </Modal>

      {/* Navigation Modal */}
      <Modal visible={navigationOpen} animationType="slide" onRequestClose={() => setNavigationOpen(false)}>
        <View style={[styles.navRoot, { backgroundColor: theme.background }]}>
          <View style={styles.navHeader}>
            <Pressable
              onPress={() => setNavigationOpen(false)}
              style={[styles.navIcon, { backgroundColor: theme.iconButton, borderColor: theme.border }]}
            >
              <MaterialCommunityIcons name="close" size={22} color={theme.text} />
            </Pressable>
            <View style={styles.navTitleWrap}>
              <Text style={[styles.navTitle, { color: theme.text }]}>Navigation <Text style={{ color: theme.primary }}>Preview</Text></Text>
              <Text style={[styles.navSubtitle, { color: theme.textSecondary }]}>{selectedRoute?.name ?? "Choose a route"}</Text>
            </View>
          </View>

          <MapLibreRoutePreview
            plan={routePlan}
            compact
            selectedRouteId={selectedRoute?.id}
            onSelectRoute={setSelectedRouteId}
          />

          <GlassCard style={styles.navCard}>
            <Text style={[styles.navRoute, { color: theme.primary }]}>{selectedRoute?.name}</Text>
            {[
              { label: "Origin", value: routePlan?.source || "Current Location", icon: "crosshairs-gps" },
              { label: "Destination", value: routePlan?.destination ?? "—", icon: "map-marker" },
              { label: "Departure", value: selectedTiming?.departureTime ?? "—", icon: "clock-outline" },
              { label: "Expected Arrival", value: `${selectedTiming?.arrivalTime} (${selectedRoute?.eta} mins)`, icon: "flag-checkered", highlight: true },
              { label: "Distance", value: `${selectedRoute?.distance} km`, icon: "road-variant" },
              { label: "Fuel Estimate", value: `${selectedRoute?.fuelUsage?.toFixed(2)} L (Rs ${selectedRoute?.fuelCost})`, icon: "gas-station" }
            ].map((row) => (
              <View key={row.label} style={[styles.navRow, { borderBottomColor: theme.border }]}>
                <MaterialCommunityIcons name={row.icon as any} size={15} color={row.highlight ? theme.success : theme.textSecondary} />
                <Text style={[styles.navLabel, { color: theme.textSecondary }]}>{row.label}:</Text>
                <Text style={[styles.navValue, { color: row.highlight ? theme.success : theme.text }]}>{row.value}</Text>
              </View>
            ))}
            <GradientButton label="Open in Google Maps" icon="google-maps" onPress={openGoogleMaps} style={styles.mapsButton} />
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title,
  theme,
  children
}: {
  title: string;
  theme: any;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.sectionRow}>
      <Text style={[styles.section, { color: theme.text }]}>{title}</Text>
      <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
      {children}
    </View>
  );
}

function EmptyRoutes({ theme }: { theme: any }) {
  return (
    <View style={styles.emptyState}>
      <View style={[styles.emptyIcon, { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder }]}>
        <MaterialCommunityIcons name="map-search-outline" size={28} color={theme.primary} />
      </View>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>No Routes Planned</Text>
      <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
        Go to the Home tab to search a destination and unlock route visualization.
      </Text>
    </View>
  );
}

function AnalysisCard({ route, timing, theme }: { route: any; timing: any; theme: any }) {
  return (
    <Animated.View entering={FadeInUp.duration(350)}>
      <GlassCard style={styles.analysisCard}>
        <View style={styles.analysisHeader}>
          <View style={[styles.analysisIconWrap, { backgroundColor: theme.chipBackground }]}>
            <MaterialCommunityIcons name="clock-check-outline" size={18} color={theme.primary} />
          </View>
          <Text style={[styles.analysisTitle, { color: theme.text }]}>Route Analysis & Timing</Text>
        </View>
        <View style={styles.analysisGrid}>
          {[
            { label: "Departure", value: timing.departureTime, color: theme.text },
            { label: "Est. Arrival", value: timing.arrivalTime, color: theme.success },
            { label: "Drive Duration", value: `${route.eta} mins`, color: theme.primary },
            { label: "Traffic Impact", value: route.trafficStatus, color: theme.text }
          ].map((box) => (
            <View key={box.label} style={[styles.analysisBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
              <Text style={[styles.boxLabel, { color: theme.textSecondary }]}>{box.label}</Text>
              <Text style={[styles.boxValue, { color: box.color }]}>{box.value}</Text>
            </View>
          ))}
        </View>
      </GlassCard>
    </Animated.View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.screen, paddingBottom: 166, paddingTop: 34 },
  desktopContent: {
    paddingTop: 80,
    paddingHorizontal: 32,
    maxWidth: 1440,
    alignSelf: "center",
    width: "100%"
  },
  desktopLayout: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
    marginTop: 10
  },
  desktopLeftCol: { width: 460 },
  desktopRightCol: { flex: 1 },

  titleRow: { marginBottom: 18 },
  title: { fontSize: 34, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { marginTop: 6, fontSize: 13 },

  sectionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    marginTop: 22
  },
  section: { fontSize: 18, fontWeight: "900" },
  sectionLine: { flex: 1, height: 1, borderRadius: 1, opacity: 0.5 },

  compare: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  compareText: { fontWeight: "900", fontSize: 12 },

  emptyState: { alignItems: "center", gap: 12, paddingVertical: 16 },
  emptyIcon: {
    alignItems: "center", borderRadius: 22, borderWidth: 1,
    height: 56, justifyContent: "center", width: 56
  },
  emptyTitle: { fontSize: 17, fontWeight: "900" },
  emptyText: { lineHeight: 20, textAlign: "center", fontSize: 13 },

  analysisCard: { marginTop: 14 },
  analysisHeader: { alignItems: "center", flexDirection: "row", gap: 10, marginBottom: 14 },
  analysisIconWrap: { alignItems: "center", borderRadius: 12, height: 34, justifyContent: "center", width: 34 },
  analysisTitle: { fontSize: 15, fontWeight: "900" },
  analysisGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  analysisBox: {
    borderRadius: 14, borderWidth: 1,
    minWidth: "47%", padding: 12, flex: 1
  },
  boxLabel: { fontSize: 11, marginBottom: 5, fontWeight: "600" },
  boxValue: { fontSize: 13, fontWeight: "900" },

  sticky: { bottom: 104, left: 16, position: "absolute", right: 16 },

  modalWrap: { flex: 1, justifyContent: "flex-end", padding: 16 },
  modal: { marginBottom: 90 },
  modalHeader: { alignItems: "center", flexDirection: "row", justifyContent: "space-between", marginBottom: 14 },
  avatarButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  modalTitle: { fontSize: 18, fontWeight: "900" },
  closeBtn: { alignItems: "center", borderRadius: 14, height: 36, justifyContent: "center", width: 36 },
  compareHeaderRow: {
    borderBottomWidth: 1, flexDirection: "row",
    gap: 8, paddingBottom: 8, marginBottom: 4
  },
  compareHeaderCell: { flex: 1, fontSize: 11, fontWeight: "800", textAlign: "center" },
  compareRow: {
    alignItems: "center", borderBottomWidth: 1,
    flexDirection: "row", gap: 8, paddingVertical: 12
  },
  compareName: { fontWeight: "800", fontSize: 13 },
  compareMetric: { flex: 1, textAlign: "center", fontWeight: "700", fontSize: 13 },

  navRoot: { flex: 1, padding: spacing.screen, paddingTop: 52 },
  navHeader: { alignItems: "center", flexDirection: "row", gap: 12, marginBottom: 18 },
  navIcon: {
    alignItems: "center", borderRadius: 16, borderWidth: 1,
    height: 42, justifyContent: "center", width: 42
  },
  navTitleWrap: { flex: 1 },
  navTitle: { fontSize: 24, fontWeight: "900" },
  navSubtitle: { marginTop: 2, fontSize: 13 },
  navCard: { marginTop: 16 },
  navRoute: { fontSize: 18, fontWeight: "900", marginBottom: 14 },
  navRow: {
    alignItems: "center", borderBottomWidth: 1,
    flexDirection: "row", gap: 8, paddingVertical: 10
  },
  navLabel: { fontSize: 12, fontWeight: "600", width: 110 },
  navValue: { flex: 1, fontSize: 13, fontWeight: "800" },
  mapsButton: { marginTop: 16 }
});
