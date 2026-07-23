import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withRepeat, withTiming, Easing } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/hooks/useTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PropsWithChildren<{
  label: string;
  icon?: string;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  variant?: "primary" | "outline";
}>;

export default function GradientButton({
  label,
  icon = "star-four-points",
  loading,
  loadingLabel = "Planning...",
  disabled,
  onPress,
  style,
  variant = "primary"
}: Props) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const glow = useSharedValue(0.45);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: glow.value
  }));

  function handlePressIn() {
    scale.value = withSpring(0.95, { damping: 15 });
    glow.value = withTiming(0.75, { duration: 120 });
  }

  function handlePressOut() {
    scale.value = withSpring(1, { damping: 12 });
    glow.value = withTiming(0.45, { duration: 200 });
  }

  const gradientColors: [string, string, string] =
    variant === "outline"
      ? [theme.secondary, theme.primary, theme.primary]
      : [theme.primary, theme.secondary, theme.secondary];

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={loading || disabled}
      style={[animatedStyle, glowStyle, styles.shadow, { shadowColor: theme.primary }, style]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <MaterialCommunityIcons
          name={(loading ? "loading" : icon) as any}
          size={20}
          color="#FFFFFF"
        />
        <Text style={styles.label}>{loading ? loadingLabel : label}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20
  },
  button: {
    alignItems: "center",
    borderRadius: 20,
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    minHeight: 56,
    paddingHorizontal: 22
  },
  label: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.4
  }
});
