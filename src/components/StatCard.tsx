import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GlassCard from "./GlassCard";
import { useTheme } from "../theme/hooks/useTheme";

type Props = {
  label: string;
  value: string | number;
  icon: string;
};

export default function StatCard({ label, value, icon }: Props) {
  const { theme } = useTheme();

  return (
    <GlassCard style={styles.card}>
      {/* Left accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: theme.primary }]} />

      <View style={[styles.iconWrap, { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder }]}>
        <MaterialCommunityIcons
          name={icon as any}
          size={22}
          color={theme.primary}
          style={{ textShadowColor: theme.primary, textShadowRadius: 8 } as any}
        />
      </View>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 130,
    paddingLeft: 22
  },
  accentStripe: {
    position: "absolute",
    top: 16,
    bottom: 16,
    left: 0,
    width: 3,
    borderRadius: 3,
    opacity: 0.85
  },
  iconWrap: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 44,
    justifyContent: "center",
    width: 44
  },
  value: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 14,
    letterSpacing: -0.5
  },
  label: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: "600",
    letterSpacing: 0.3
  }
});
