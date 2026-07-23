import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { useTheme } from "../theme/hooks/useTheme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function AIChip({ label, onPress }: { label: string; onPress?: () => void }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.92); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.chip,
        animStyle,
        {
          backgroundColor: theme.chipBackground,
          borderColor: theme.chipBorder,
          shadowColor: theme.primary
        }
      ]}
    >
      <Text style={[styles.text, { color: theme.primary }]}>{label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.2
  }
});
