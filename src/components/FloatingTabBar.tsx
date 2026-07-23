import { LinearGradient } from "expo-linear-gradient";
import { Platform, Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/hooks/useTheme";

const icons: Record<string, string> = {
  home: "home-variant",
  dashboard: "view-dashboard",
  routes: "map-marker-path",
  assistant: "robot-happy",
  profile: "account-circle"
};

type FloatingTabBarProps = {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  descriptors: Record<string, { options: { title?: string } }>;
  navigation: {
    navigate: (name: string) => void;
  };
};

function TabItem({
  route,
  focused,
  label,
  theme,
  onPress
}: {
  route: { key: string; name: string };
  focused: boolean;
  label: string;
  theme: any;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  function handlePressIn() {
    scale.value = withSpring(0.88, { damping: 12 });
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 10 });
  }

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <Pressable
      style={styles.item}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View style={[styles.iconWrap, animStyle]}>
        {focused ? (
          <Animated.View entering={FadeIn.duration(200)} style={styles.activeWrap}>
            <LinearGradient
              colors={[theme.primary, theme.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.active, { shadowColor: theme.primary }]}
            >
              <MaterialCommunityIcons
                name={icons[route.name] as any}
                size={20}
                color="#FFFFFF"
              />
            </LinearGradient>
          </Animated.View>
        ) : (
          <MaterialCommunityIcons
            name={icons[route.name] as any}
            size={22}
            color={theme.muted}
          />
        )}
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: focused ? theme.primary : theme.textSecondary }
        ]}
        numberOfLines={1}
      >
        {String(label)}
      </Text>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, descriptors, navigation }: FloatingTabBarProps) {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768 || Platform.OS === "web";

  if (isDesktop) {
    return (
      <View
        style={[
          styles.desktopNav,
          {
            backgroundColor: theme.surface,
            borderBottomColor: theme.border
          }
        ]}
      >
        {/* Brand */}
        <View style={styles.brandRow}>
          <LinearGradient
            colors={[theme.primary, theme.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.logoBadge}
          >
            <MaterialCommunityIcons name="navigation-variant" size={20} color="#FFFFFF" />
          </LinearGradient>
          <View>
            <Text style={[styles.brandTitle, { color: theme.text }]}>
              Road<Text style={{ color: theme.primary }}>Sense</Text>
            </Text>
            <Text style={[styles.brandSub, { color: theme.textSecondary }]}>
              AI Route Intelligence
            </Text>
          </View>
        </View>

        {/* Nav items */}
        <View style={styles.desktopTabs}>
          {state.routes.map((route, index) => {
            const focused = state.index === index;
            const label = descriptors[route.key].options.title ?? route.name;
            return (
              <Pressable
                key={route.key}
                style={[
                  styles.desktopTabItem,
                  focused && {
                    backgroundColor: theme.chipBackground,
                    borderColor: theme.primary
                  },
                  { borderColor: focused ? theme.primary : "transparent" }
                ]}
                onPress={() => navigation.navigate(route.name)}
              >
                <MaterialCommunityIcons
                  name={icons[route.name] as any}
                  size={17}
                  color={focused ? theme.primary : theme.textSecondary}
                />
                <Text
                  style={[
                    styles.desktopTabLabel,
                    { color: focused ? theme.primary : theme.textSecondary }
                  ]}
                >
                  {String(label)}
                </Text>
                {focused && (
                  <View style={[styles.desktopActiveDot, { backgroundColor: theme.primary }]} />
                )}
              </Pressable>
            );
          })}
        </View>

        {/* Status */}
        <View style={styles.statusGroup}>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: "rgba(57,255,20,0.10)",
                borderColor: "rgba(57,255,20,0.30)"
              }
            ]}
          >
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>GPS Active</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.shell}>
      <View
        style={[
          styles.bar,
          {
            backgroundColor: theme.tabBar,
            borderColor: theme.border,
            shadowColor: theme.primary
          }
        ]}
      >
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const label = descriptors[route.key].options.title ?? route.name;
          return (
            <TabItem
              key={route.key}
              route={route}
              focused={focused}
              label={label ?? route.name}
              theme={theme}
              onPress={() => navigation.navigate(route.name)}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  desktopNav: {
    alignItems: "center",
    borderBottomWidth: 1,
    flexDirection: "row",
    height: 64,
    justifyContent: "space-between",
    paddingHorizontal: 28,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000
  },
  brandRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  logoBadge: {
    alignItems: "center",
    borderRadius: 13,
    height: 38,
    justifyContent: "center",
    width: 38
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: "900",
    letterSpacing: 0.3
  },
  brandSub: {
    fontSize: 11,
    marginTop: 1
  },
  desktopTabs: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6
  },
  desktopTabItem: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 9,
    position: "relative"
  },
  desktopActiveDot: {
    borderRadius: 999,
    height: 5,
    width: 5
  },
  desktopTabLabel: {
    fontSize: 13,
    fontWeight: "800"
  },
  statusGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7
  },
  liveDot: {
    backgroundColor: "#39FF14",
    borderRadius: 999,
    height: 8,
    width: 8,
    shadowColor: "#39FF14",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4
  },
  liveText: {
    color: "#39FF14",
    fontSize: 12,
    fontWeight: "800"
  },
  shell: {
    bottom: 18,
    left: 14,
    position: "absolute",
    right: 14
  },
  bar: {
    borderRadius: 30,
    borderWidth: 1,
    flexDirection: "row",
    height: 76,
    paddingHorizontal: 6,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 28
  },
  item: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    gap: 3
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  activeWrap: {
    alignItems: "center",
    justifyContent: "center"
  },
  active: {
    alignItems: "center",
    borderRadius: 16,
    height: 38,
    justifyContent: "center",
    width: 44,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.7,
    shadowRadius: 12
  },
  label: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.2
  }
});
