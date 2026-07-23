import { Tabs } from "expo-router";
import { View, StyleSheet } from "react-native";
import FloatingTabBar from "../../src/components/FloatingTabBar";
import AnimatedBackground from "../../src/components/AnimatedBackground";
import { useTheme } from "../../src/theme/hooks/useTheme";

export default function TabsLayout() {
  const { theme } = useTheme();

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      {/* Animated background rendered once behind all tab screens */}
      <AnimatedBackground />

      <Tabs
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: "transparent" }
        }}
      >
        <Tabs.Screen name="home" options={{ title: "Home" }} />
        <Tabs.Screen name="dashboard" options={{ title: "Dashboard" }} />
        <Tabs.Screen name="routes" options={{ title: "Routes" }} />
        <Tabs.Screen name="assistant" options={{ title: "Assistant" }} />
        <Tabs.Screen name="profile" options={{ title: "Profile" }} />
      </Tabs>
    </View>
  );
}
