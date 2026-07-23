import { PropsWithChildren } from "react";
import { StyleProp, StyleSheet, ViewStyle } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../theme/hooks/useTheme";

type Props = PropsWithChildren<{
  style?: StyleProp<ViewStyle>;
  delay?: number;
}>;

export default function GlassCard({ children, style, delay = 0 }: Props) {
  const { theme } = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.delay(delay).duration(380).springify()}
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          shadowColor: theme.primary
        },
        style
      ]}
    >
      {/* Multi-Color Gradient Edge Accent Stripe */}
      <LinearGradient
        colors={theme.gradientPrimary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.innerGradientHighlight}
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 20,
    marginBottom: 4,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.40,
    shadowRadius: 28,
    overflow: "hidden"
  },
  innerGradientHighlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    opacity: 0.90
  }
});
