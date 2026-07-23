import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInUp } from "react-native-reanimated";
import AIChip from "../../src/components/AIChip";
import ChatBubble from "../../src/components/ChatBubble";
import GlassCard from "../../src/components/GlassCard";
import { spacing } from "../../src/constants/theme";
import { useAuth } from "../../src/context/AuthContext";
import { askRoadSenseAI, cancelGeminiRequest } from "../../src/services/aiService";
import { storageService } from "../../src/services/storageService";
import { useTheme } from "../../src/theme/hooks/useTheme";
import { ChatMessage } from "../../src/types/chat";
import { useIsFocused } from "@react-navigation/native";

const prompts = [
  "Travel from Chennai to Bangalore",
  "Delhi to Jaipur trip plan",
  "Safest route avoiding highways",
  "Find famous food pitstops nearby",
  "Weather & hazard alerts"
];

const welcome: ChatMessage = {
  id: "welcome",
  role: "assistant",
  createdAt: Date.now(),
  content: "Hi! I'm your RoadSense AI co-pilot. I can help with route planning, traffic information, weather impact, fuel savings, and travel recommendations."
};

export default function AssistantScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768 || Platform.OS === "web";

  const [messages, setMessages] = useState<ChatMessage[]>([welcome]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    async function loadSavedChat() {
      const history = await storageService.getChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      }
    }
    loadSavedChat();
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      storageService.saveChatHistory(messages);
    }
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  useEffect(() => () => cancelGeminiRequest("assistant"), []);

  async function send(text = input) {
    if (!text.trim() || loading) return;
    const userMsgContent = text.trim();
    const userMessage: ChatMessage = { id: `${Date.now()}-u`, role: "user", content: userMsgContent, createdAt: Date.now() };

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Pass driver profile context for personalized responses
      const driverContext = user
        ? `[Driver Profile: Name=${user.name}, Vehicle=${user.vehicleModel}, EmergencyContact=${user.emergencyContact || 'None'}] `
        : "";
      const fullPrompt = `${driverContext}${userMsgContent}`;

      const response = await askRoadSenseAI(fullPrompt, "assistant");
      const assistantMsg: ChatMessage = { id: `${Date.now()}-a`, role: "assistant", content: response, createdAt: Date.now() };

      setMessages((current) => [...current, assistantMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: `${Date.now()}-e`,
        role: "assistant",
        content: error instanceof Error ? error.message : "AI Co-Pilot is unavailable at the moment. Please try again.",
        createdAt: Date.now()
      };
      setMessages((current) => [...current, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  const clearChat = async () => {
    await storageService.clearChatHistory();
    setMessages([welcome]);
  };

  if (!isFocused) return null;

  return (
    <View style={[styles.root, { backgroundColor: "transparent" }]}>
      {/* Header */}
      <Animated.View
        entering={FadeInUp.duration(400)}
        style={[styles.header, isDesktop && { paddingTop: 78 }]}
      >
        <View style={[styles.robotWrap, { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder, shadowColor: theme.primary }]}>
          <MaterialCommunityIcons name="robot-happy" size={26} color={theme.primary} />
        </View>

        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text }]}>
            AI <Text style={{ color: theme.primary }}>Co-Pilot</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Conversational navigation & trip assistance
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pressable
            onPress={clearChat}
            style={[styles.clearBtn, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}
          >
            <MaterialCommunityIcons name="delete-outline" size={18} color={theme.textSecondary} />
          </Pressable>

          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.clearBtn, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}
          >
            <MaterialCommunityIcons name={(user?.avatar as any) || "account-circle"} size={20} color={theme.primary} />
          </Pressable>
        </View>
      </Animated.View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
      >
        {/* Quick prompts */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips}>
          {prompts.map((prompt) => (
            <AIChip key={prompt} label={prompt} onPress={() => send(prompt)} />
          ))}
        </ScrollView>

        {messages.map((message) => (
          <ChatBubble key={message.id} message={message} />
        ))}

        {loading ? (
          <View style={[styles.typingBubble, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ActivityIndicator color={theme.primary} size="small" />
            <Text style={[styles.typingText, { color: theme.textSecondary }]}>Analyzing route & conditions...</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Input Bar */}
      <GlassCard style={[styles.inputBar, { shadowColor: theme.primary }]}>
        <View style={[styles.micButton, { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder }]}>
          <MaterialCommunityIcons name="microphone-outline" size={20} color={theme.textSecondary} />
        </View>

        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send()}
          placeholder="Ask RoadSense AI anything..."
          placeholderTextColor={theme.textSecondary + "80"}
          style={[styles.input, { color: theme.text }]}
          returnKeyType="send"
        />

        <Pressable
          onPress={() => send()}
          disabled={loading || !input.trim()}
          style={[
            styles.sendButton,
            { backgroundColor: input.trim() ? theme.primary : theme.border }
          ]}
        >
          <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
        </Pressable>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.screen },
  header: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    paddingTop: 34,
    marginBottom: 12
  },
  robotWrap: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10
  },
  headerText: { flex: 1 },
  title: { fontSize: 24, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 12, marginTop: 2 },
  clearBtn: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 36,
    justifyContent: "center",
    width: 36
  },

  messages: { paddingBottom: 160 },
  chips: { marginBottom: 16 },
  typingBubble: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start"
  },
  typingText: { fontSize: 12, fontWeight: "700" },

  inputBar: {
    bottom: 96,
    left: spacing.screen,
    position: "absolute",
    right: spacing.screen,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 10
  },
  micButton: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40
  },
  input: { flex: 1, fontSize: 14, minHeight: 40 },
  sendButton: {
    alignItems: "center",
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    width: 40
  }
});
