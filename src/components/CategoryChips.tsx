import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/hooks/useTheme";
import { SearchCategory } from "../types/search";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = {
  categories: SearchCategory[];
  activeCategoryId?: string | null;
  onSelect: (category: SearchCategory) => void;
};

export default function CategoryChips({ categories, activeCategoryId, onSelect }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.root}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {categories.map((category) => {
          const active = activeCategoryId === category.id;
          return <ChipItem key={category.id} category={category} active={active} onSelect={onSelect} theme={theme} />;
        })}
      </ScrollView>
    </View>
  );
}

function ChipItem({ category, active, onSelect, theme }: { category: SearchCategory; active: boolean; onSelect: (c: SearchCategory) => void; theme: any }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  return (
    <AnimatedPressable
      onPress={() => onSelect(category)}
      onPressIn={() => (scale.value = withSpring(0.93))}
      onPressOut={() => (scale.value = withSpring(1))}
      style={[
        animatedStyle,
        styles.chip,
        {
          backgroundColor: active ? theme.primary : theme.input,
          borderColor: active ? theme.primary : theme.border,
          shadowColor: active ? theme.primary : "transparent"
        },
        active && styles.activeGlow
      ]}
    >
      <MaterialCommunityIcons name={category.icon as any} size={16} color={active ? "#FFFFFF" : theme.primary} />
      <Text style={[styles.text, { color: active ? "#FFFFFF" : theme.text }]}>{category.label}</Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  root: { marginTop: 12 },
  chip: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 7,
    height: 38,
    marginRight: 8,
    paddingHorizontal: 14
  },
  activeGlow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10
  },
  text: { fontSize: 12, fontWeight: "800" }
});
