import Animated, { FadeInUp } from "react-native-reanimated";
import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ChatMessage } from "../types/chat";
import { useTheme } from "../theme/hooks/useTheme";

export default function ChatBubble({ message }: { message: ChatMessage }) {
  const { theme } = useTheme();
  const user = message.role === "user";

  return (
    <Animated.View
      entering={FadeInUp.duration(260).springify()}
      style={[
        styles.bubble,
        user
          ? {
              alignSelf: "flex-end",
              backgroundColor: theme.secondary,
              shadowColor: theme.secondary
            }
          : {
              alignSelf: "flex-start",
              backgroundColor: theme.card,
              borderColor: theme.border,
              borderWidth: 1,
              shadowColor: theme.primary
            }
      ]}
    >
      {!user && (
        <View style={[styles.aiIcon, { backgroundColor: theme.chipBackground }]}>
          <MaterialCommunityIcons name="robot-happy" size={12} color={theme.primary} />
        </View>
      )}
      <Text style={[styles.text, { color: user ? "#FFFFFF" : theme.text }]}>
        {message.content}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderRadius: 22,
    marginBottom: 10,
    maxWidth: "86%",
    padding: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10
  },
  aiIcon: {
    alignItems: "center",
    borderRadius: 8,
    height: 20,
    justifyContent: "center",
    marginBottom: 6,
    width: 20
  },
  text: {
    fontSize: 14,
    lineHeight: 21
  }
});
