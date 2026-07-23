import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useTheme } from "../theme/hooks/useTheme";

export default function FloatingAIButton({ onPress }: { onPress?: () => void }) {
  const { theme } = useTheme();
  const router = useRouter();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.40);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1
    );
    glow.value = withRepeat(
      withSequence(
        withTiming(0.70, { duration: 1000 }),
        withTiming(0.35, { duration: 1000 })
      ),
      -1
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value
  }));

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/(tabs)/assistant");
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        animStyle,
        { shadowColor: theme.primary }
      ]}
    >
      <Pressable onPress={handlePress}>
        <LinearGradient
          colors={[theme.primary, theme.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <MaterialCommunityIcons name="robot-happy" size={20} color="#000000" />
          <Text style={styles.text}>Ask AI Co-Pilot</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    bottom: 104,
    position: "absolute",
    right: 16,
    zIndex: 10,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20
  },
  button: {
    alignItems: "center",
    borderRadius: 999,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 14
  },
  text: {
    color: "#000000",
    fontSize: 13,
    fontWeight: "900",
    letterSpacing: 0.3
  }
});
