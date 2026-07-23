import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useTheme } from "../theme/hooks/useTheme";

type Props = {
  value: string;
  placeholder?: string;
  loading?: boolean;
  onChangeText: (value: string) => void;
  onClear: () => void;
  onChooseOnMap?: () => void;
  onSubmit?: () => void;
};

export default function SearchBar({
  value,
  placeholder = "Search destination...",
  loading = false,
  onChangeText,
  onClear,
  onChooseOnMap,
  onSubmit
}: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.input,
          borderColor: focused ? theme.primary : theme.border,
          shadowColor: theme.primary
        },
        focused && styles.focusedGlow
      ]}
    >
      <MaterialCommunityIcons
        name="magnify"
        size={22}
        color={focused ? theme.primary : theme.textSecondary}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        returnKeyType="search"
        style={[styles.input, { color: theme.text }]}
      />
      {loading ? <ActivityIndicator color={theme.primary} size="small" /> : null}
      {value.length ? (
        <Pressable onPress={onClear} style={[styles.iconButton, { backgroundColor: theme.iconButton }]}>
          <MaterialCommunityIcons name="close" size={18} color={theme.text} />
        </Pressable>
      ) : null}
      {onChooseOnMap ? (
        <Pressable onPress={onChooseOnMap} style={[styles.iconButton, { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder, borderWidth: 1 }]}>
          <MaterialCommunityIcons name="map-marker-plus-outline" size={19} color={theme.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: "row",
    gap: 10,
    minHeight: 58,
    paddingHorizontal: 14,
    marginBottom: 12
  },
  focusedGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14
  },
  input: { flex: 1, fontSize: 15, minHeight: 54 },
  iconButton: { alignItems: "center", borderRadius: 14, height: 36, justifyContent: "center", width: 36 }
});
