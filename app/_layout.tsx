import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppStateProvider } from "../src/context/AppStateContext";
import { AuthProvider } from "../src/context/AuthContext";
import { paperTheme } from "../src/constants/theme";
import { ThemeProvider } from "../src/theme/ThemeProvider";
import { useTheme } from "../src/theme/hooks/useTheme";
import GlobalErrorBoundary from "../src/components/GlobalErrorBoundary";

SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn("[RoadSense Startup] Splash preventAutoHideAsync failed", error);
});

export default function RootLayout() {
  useEffect(() => {
    console.info("[RoadSense Startup] Root layout mounted");
    SplashScreen.hideAsync().catch((error) => {
      console.warn("[RoadSense Startup] Splash hideAsync failed", error);
    });
  }, []);

  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedAppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}

function ThemedAppShell() {
  const { isDark, theme } = useTheme();

  // Keep html/body in sync for web so there's no bare white flash on load
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const bg = theme.background;
    document.documentElement.style.setProperty("background-color", bg, "important");
    document.body.style.setProperty("background-color", bg, "important");
    const root = document.getElementById("root");
    if (root) root.style.setProperty("background-color", bg, "important");
  }, [theme.background]);

  return (
    /*
     * Root View sets the base background for the whole app.
     * AnimatedBackground is intentionally NOT rendered here — it lives
     * inside (tabs)/_layout.tsx so it is scoped to the tab navigator and
     * does not interfere with any future modal/stack screens.
     */
    <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.background }]}>
      <PaperProvider theme={paperTheme}>
        <AuthProvider>
          <AppStateProvider>
            <StatusBar style={isDark ? "light" : "dark"} />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: "transparent" }
              }}
            >
              <Stack.Screen name="get-started" />
              <Stack.Screen name="(tabs)" />
            </Stack>
          </AppStateProvider>
        </AuthProvider>
      </PaperProvider>
    </View>
  );
}
