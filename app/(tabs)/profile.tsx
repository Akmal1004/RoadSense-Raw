import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import GlassCard from "../../src/components/GlassCard";
import GradientButton from "../../src/components/GradientButton";
import AuthModal from "../../src/components/AuthModal";
import EditProfileModal from "../../src/components/EditProfileModal";
import { spacing } from "../../src/constants/theme";
import { useAppState } from "../../src/context/AppStateContext";
import { useAuth } from "../../src/context/AuthContext";
import { useTheme } from "../../src/theme/hooks/useTheme";
import { useRouter } from "expo-router";
import { TravelPreference } from "../../src/types/route";
import { useIsFocused } from "@react-navigation/native";

const routeTypes: Array<{ value: TravelPreference; icon: string; label: string }> = [
  { value: "safest", icon: "shield-check", label: "Safest" },
  { value: "fastest", icon: "lightning-bolt", label: "Fastest" },
  { value: "eco", icon: "leaf", label: "Eco" }
];

export default function ProfileScreen() {
  const isFocused = useIsFocused();
  const router = useRouter();
  const { preferences, setPreferences } = useAppState();
  const { user, isAuthenticated, logout } = useAuth();
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768 || Platform.OS === "web";

  // Modals
  const [authModalVisible, setAuthModalVisible] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "signup" | "forgot">("login");
  const [editProfileVisible, setEditProfileVisible] = useState(false);

  // App preferences state
  const [mileage, setMileage] = useState(String(preferences.vehicleMileage));
  const [fuelPrice, setFuelPrice] = useState(String(preferences.fuelPrice));
  const [routeType, setRouteType] = useState<TravelPreference>(preferences.defaultRouteType);
  const [savedPreferencesFeedback, setSavedPreferencesFeedback] = useState(false);

  async function savePreferences() {
    await setPreferences({
      ...preferences,
      defaultRouteType: routeType,
      vehicleMileage: Number(mileage) || 15,
      fuelPrice: Number(fuelPrice) || 100
    });
    setSavedPreferencesFeedback(true);
    setTimeout(() => setSavedPreferencesFeedback(false), 2400);
  }

  const openAuthModal = (mode: "login" | "signup" | "forgot") => {
    setAuthModalMode(mode);
    setAuthModalVisible(true);
  };

  if (!isFocused) return null;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: "transparent" }]}
      contentContainerStyle={[styles.content, { paddingTop: isDesktop ? 84 : 34 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View style={styles.titleRow}>
        <View
          style={[
            styles.avatarWrap,
            { backgroundColor: theme.chipBackground, borderColor: theme.chipBorder, shadowColor: theme.primary }
          ]}
        >
          <MaterialCommunityIcons
            name={(user?.avatar as any) || "account-circle"}
            size={36}
            color={theme.primary}
          />
        </View>
        <View style={styles.titleTextContainer}>
          <Text style={[styles.title, { color: theme.text }]}>
            My <Text style={{ color: theme.primary }}>Profile</Text>
          </Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Account details, preferences & security
          </Text>
        </View>
      </View>

      {/* USER IDENTITY CARD / AUTH CTA */}
      {isAuthenticated && user ? (
        <Animated.View entering={FadeInUp.delay(40).duration(380)}>
          <GlassCard style={styles.userCard}>
            <View style={styles.userCardHeader}>
              <View style={styles.userInfoCol}>
                <View style={styles.nameRow}>
                  <Text style={[styles.userName, { color: theme.text }]}>{user.name}</Text>
                  <View style={[styles.badge, { backgroundColor: theme.primary + "22", borderColor: theme.primary + "66" }]}>
                    <MaterialCommunityIcons name="certificate" size={12} color={theme.primary} />
                    <Text style={[styles.badgeText, { color: theme.primary }]}>{user.memberTier || "Pro Driver"}</Text>
                  </View>
                </View>
                <Text style={[styles.userEmail, { color: theme.textSecondary }]}>{user.email}</Text>
                <Text style={[styles.userJoined, { color: theme.textSecondary }]}>
                  Member since {user.joinedDate || "2024"}
                </Text>
              </View>
            </View>

            {/* Quick Action Buttons */}
            <View style={styles.actionButtonsRow}>
              <Pressable
                onPress={() => setEditProfileVisible(true)}
                style={[styles.actionBtn, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}
              >
                <MaterialCommunityIcons name="account-edit" size={16} color={theme.primary} />
                <Text style={[styles.actionBtnText, { color: theme.primary }]}>Edit Profile</Text>
              </Pressable>

              <Pressable
                onPress={async () => {
                  await logout();
                  router.replace("/get-started");
                }}
                style={[styles.actionBtn, { backgroundColor: "rgba(255, 82, 82, 0.10)", borderColor: "rgba(255, 82, 82, 0.35)" }]}
              >
                <MaterialCommunityIcons name="logout-variant" size={16} color="#FF5252" />
                <Text style={[styles.actionBtnText, { color: "#FF5252" }]}>Log Out</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInUp.delay(40).duration(380)}>
          <GlassCard style={styles.loggedOutCard}>
            <View style={styles.loggedOutHeader}>
              <MaterialCommunityIcons name="account-lock-outline" size={32} color={theme.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.loggedOutTitle, { color: theme.text }]}>Welcome to RoadSense</Text>
                <Text style={[styles.loggedOutSubtitle, { color: theme.textSecondary }]}>
                  Sign in or create an account to view profile details & sync preferences.
                </Text>
              </View>
            </View>

            <View style={styles.authCtaRow}>
              <GradientButton
                label="Sign In"
                icon="login"
                onPress={() => openAuthModal("login")}
                style={{ flex: 1 }}
              />
              <Pressable
                onPress={() => openAuthModal("signup")}
                style={[styles.signupOutlineBtn, { borderColor: theme.primary, backgroundColor: theme.chipBackground }]}
              >
                <MaterialCommunityIcons name="account-plus" size={16} color={theme.primary} />
                <Text style={[styles.signupOutlineText, { color: theme.primary }]}>Create Account</Text>
              </Pressable>
            </View>
          </GlassCard>
        </Animated.View>
      )}

      {/* ACCOUNT DETAILS SECTION */}
      {isAuthenticated && user ? (
        <Animated.View entering={FadeInUp.delay(80).duration(380)}>
          <GlassCard style={styles.sectionCard}>
            <SectionTitle title="Account Details" icon="card-account-details-outline" theme={theme} />
            <InfoRow label="Full Name" value={user.name} icon="account" theme={theme} />
            <InfoRow label="Email Address" value={user.email} icon="email-outline" theme={theme} />
            <InfoRow label="Phone Number" value={user.phone || "Not configured"} icon="phone-outline" theme={theme} />
            <InfoRow label="Vehicle Model" value={user.vehicleModel} icon="car-sports" theme={theme} />
            <InfoRow label="Emergency Contact" value={user.emergencyContact || "Not configured"} icon="phone-alert-outline" theme={theme} />
            <InfoRow label="Driver Bio" value={user.bio || "No bio added yet"} icon="text" theme={theme} />
          </GlassCard>
        </Animated.View>
      ) : null}

      {/* SECURITY & ACCOUNT CONTROLS */}
      {isAuthenticated && (
        <Animated.View entering={FadeInUp.delay(100).duration(380)}>
          <GlassCard style={styles.sectionCard}>
            <SectionTitle title="Security & Account" icon="shield-lock-outline" theme={theme} />

            <Pressable
              onPress={() => openAuthModal("forgot")}
              style={[styles.securityRow, { borderColor: theme.border }]}
            >
              <View style={styles.securityRowLeft}>
                <MaterialCommunityIcons name="key-change" size={18} color={theme.primary} />
                <Text style={[styles.securityLabel, { color: theme.text }]}>Change / Reset Password</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable
              onPress={() => openAuthModal("login")}
              style={[styles.securityRow, { borderColor: theme.border }]}
            >
              <View style={styles.securityRowLeft}>
                <MaterialCommunityIcons name="swap-horizontal" size={18} color={theme.primary} />
                <Text style={[styles.securityLabel, { color: theme.text }]}>Switch Account / Sign In</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </GlassCard>
        </Animated.View>
      )}

      {/* DRIVING PREFERENCES */}
      <Animated.View entering={FadeInUp.delay(120).duration(380)}>
        <GlassCard style={styles.sectionCard}>
          <SectionTitle title="Trip Preferences" icon="tune" theme={theme} />

          {/* Route type selector */}
          <Text style={[styles.label, { color: theme.textSecondary }]}>Default Route Type</Text>
          <View style={styles.segment}>
            {routeTypes.map((item) => {
              const active = routeType === item.value;
              return (
                <Pressable
                  key={item.value}
                  onPress={() => setRouteType(item.value)}
                  style={[
                    styles.segmentItem,
                    active && {
                      backgroundColor: theme.chipBackground,
                      borderColor: theme.primary,
                      borderWidth: 1
                    },
                    !active && { borderColor: theme.border, borderWidth: 1 }
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as any}
                    size={18}
                    color={active ? theme.primary : theme.textSecondary}
                  />
                  <Text style={[styles.segmentText, { color: active ? theme.primary : theme.textSecondary }]}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Fields */}
          <Field
            label="Vehicle Mileage"
            value={mileage}
            onChangeText={setMileage}
            suffix="km/L"
            icon="car-speed-limiter"
            theme={theme}
          />
          <Field
            label="Fuel Price"
            value={fuelPrice}
            onChangeText={setFuelPrice}
            suffix="Rs/L"
            icon="currency-inr"
            theme={theme}
          />
          <InfoRow label="Distance Units" value="Metric (km, km/h)" icon="ruler" theme={theme} />

          {/* Save feedback */}
          {savedPreferencesFeedback ? (
            <View
              style={[
                styles.savedBanner,
                { backgroundColor: "rgba(57,255,20,0.10)", borderColor: "rgba(57,255,20,0.30)" }
              ]}
            >
              <MaterialCommunityIcons name="check-circle" size={16} color="#39FF14" />
              <Text style={styles.savedText}>Preferences saved successfully!</Text>
            </View>
          ) : null}

          <GradientButton
            label="Save Preferences"
            icon="content-save"
            onPress={savePreferences}
            style={styles.save}
          />
        </GlassCard>
      </Animated.View>

      {/* ABOUT APP */}
      <Animated.View entering={FadeInUp.delay(160).duration(380)}>
        <GlassCard style={styles.about}>
          <SectionTitle title="About RoadSense" icon="information-outline" theme={theme} />
          <InfoRow label="App Name" value="RoadSense AI Navigation Assistant" icon="rocket-launch-outline" theme={theme} />
          <InfoRow label="Version" value="1.2.0 (Neon Edition)" icon="tag-outline" theme={theme} />
          <InfoRow label="AI Model Engine" value="Gemini AI & MapLibre Vector" icon="brain" theme={theme} />
          <InfoRow label="Terms & Privacy" value="Protected with local encryption." icon="file-document-outline" theme={theme} />

          <Pressable
            onPress={() => router.push("/get-started")}
            style={[styles.getStartedOutlineBtn, { borderColor: theme.primary, backgroundColor: theme.chipBackground }]}
          >
            <MaterialCommunityIcons name="rocket-launch-outline" size={16} color={theme.primary} />
            <Text style={[styles.getStartedOutlineText, { color: theme.primary }]}>View Get Started Onboarding</Text>
          </Pressable>
        </GlassCard>
      </Animated.View>

      {/* Auth Modal component */}
      <AuthModal
        visible={authModalVisible}
        initialMode={authModalMode}
        onClose={() => setAuthModalVisible(false)}
      />

      {/* Edit Profile Modal component */}
      <EditProfileModal
        visible={editProfileVisible}
        onClose={() => setEditProfileVisible(false)}
      />
    </ScrollView>
  );
}

function SectionTitle({ title, icon, theme }: { title: string; icon: string; theme: any }) {
  return (
    <View style={styles.sectionRow}>
      <View style={[styles.sectionIcon, { backgroundColor: theme.chipBackground }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={theme.primary} />
      </View>
      <Text style={[styles.section, { color: theme.text }]}>{title}</Text>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  suffix,
  icon,
  theme
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  suffix: string;
  icon: string;
  theme: any;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrap, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={theme.primary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType="numeric"
          style={[styles.input, { color: theme.text }]}
        />
        <Text style={[styles.suffix, { color: theme.textSecondary }]}>{suffix}</Text>
      </View>
    </View>
  );
}

function InfoRow({ label, value, icon, theme }: { label: string; value: string; icon: string; theme: any }) {
  return (
    <View style={[styles.info, { borderBottomColor: theme.border }]}>
      <View style={styles.infoLeft}>
        <MaterialCommunityIcons name={icon as any} size={15} color={theme.textSecondary} />
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: spacing.screen, paddingBottom: 128, paddingTop: 34 },

  titleRow: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 20 },
  avatarWrap: {
    alignItems: "center",
    borderRadius: 22,
    borderWidth: 1,
    height: 58,
    justifyContent: "center",
    width: 58,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12
  },
  titleTextContainer: { flex: 1 },
  title: { fontSize: 30, fontWeight: "900", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },

  // User Identity Card
  userCard: { marginBottom: 16, padding: 18 },
  userCardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  userInfoCol: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  userName: { fontSize: 20, fontWeight: "900" },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1
  },
  badgeText: { fontSize: 11, fontWeight: "800" },
  userEmail: { fontSize: 13, marginTop: 4 },
  userJoined: { fontSize: 11, marginTop: 2 },

  actionButtonsRow: { flexDirection: "row", gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1
  },
  actionBtnText: { fontSize: 13, fontWeight: "800" },

  // Logged out CTA card
  loggedOutCard: { marginBottom: 16, padding: 18 },
  loggedOutHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  loggedOutTitle: { fontSize: 18, fontWeight: "900" },
  loggedOutSubtitle: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  authCtaRow: { flexDirection: "row", gap: 10 },
  signupOutlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12
  },
  signupOutlineText: { fontSize: 14, fontWeight: "800" },

  // Section cards
  sectionCard: { marginBottom: 16, padding: 18 },
  sectionRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionIcon: { alignItems: "center", borderRadius: 10, height: 28, justifyContent: "center", width: 28 },
  section: { fontSize: 16, fontWeight: "900" },

  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1
  },
  securityRowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  securityLabel: { fontSize: 14, fontWeight: "700" },

  label: { fontSize: 12, fontWeight: "700", marginBottom: 8 },
  segment: { flexDirection: "row", gap: 8, marginBottom: 18, marginTop: 2 },
  segmentItem: {
    alignItems: "center",
    borderRadius: 16,
    flex: 1,
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    paddingVertical: 12
  },
  segmentText: { fontSize: 12, fontWeight: "800" },

  fieldRow: { marginBottom: 16 },
  inputWrap: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
    paddingHorizontal: 14
  },
  input: { flex: 1, minHeight: 48, fontSize: 14 },
  suffix: { fontSize: 12, fontWeight: "700" },

  info: { borderBottomWidth: 1, paddingVertical: 11 },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: "800" },

  savedBanner: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  savedText: { color: "#39FF14", fontSize: 13, fontWeight: "800" },
  save: { marginTop: 8 },
  about: { marginTop: 4 },
  getStartedOutlineBtn: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginTop: 14,
    paddingVertical: 12
  },
  getStartedOutlineText: {
    fontSize: 13,
    fontWeight: "800"
  }
});
