import React, { useState } from "react";
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import Animated, { FadeInDown, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";
import AnimatedBackground from "../src/components/AnimatedBackground";
import GlassCard from "../src/components/GlassCard";
import GradientButton from "../src/components/GradientButton";
import { useAppState } from "../src/context/AppStateContext";
import { useAuth } from "../src/context/AuthContext";
import { useTheme } from "../src/theme/hooks/useTheme";

type PortalTab = "signup" | "login" | "forgot";

const VEHICLE_TAGS = ["Tesla / EV", "Hybrid Drive", "Turbo Sedan", "Adventure SUV", "City Compact"];

export default function GetStartedScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { register, login, requestResetCode, resetPassword } = useAuth();
  const { preferences, setPreferences } = useAppState();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768 || Platform.OS === "web";

  // Tab State
  const [activeTab, setActiveTab] = useState<PortalTab>("signup");

  // Signup State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedVehicleTag, setSelectedVehicleTag] = useState("Tesla / EV");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot Password State
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Feedback State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pulse animation for radar status
  const pulseScale = useSharedValue(1);
  React.useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 900 }),
        withTiming(1, { duration: 900 })
      ),
      -1
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }]
  }));

  const handleSwitchTab = (tab: PortalTab) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setActiveTab(tab);
  };

  const handleRegisterSubmit = async () => {
    if (!name.trim()) {
      setErrorMessage("Please enter your Full Name.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter your Email Address.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        vehicleModel: selectedVehicleTag
      });

      setSuccessMessage("Account created! Launching Dashboard...");
      setTimeout(() => {
        router.replace("/(tabs)/dashboard");
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    if (!loginEmail.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!loginPassword) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await login({
        email: loginEmail,
        password: loginPassword
      });

      setSuccessMessage("Authentication successful! Opening Dashboard...");
      setTimeout(() => {
        router.replace("/(tabs)/dashboard");
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Sign in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async () => {
    if (!resetEmail.trim()) {
      setErrorMessage("Please enter your email to receive a reset code.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const code = await requestResetCode(resetEmail);
      setResetStep(2);
      setSuccessMessage(`Reset code generated: ${code}. Enter the code below.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to request reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCode.trim() || !newPassword) {
      setErrorMessage("Please enter the verification code and new password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await resetPassword({
        email: resetEmail,
        code: resetCode,
        newPassword
      });

      setSuccessMessage("Password reset successful! Switching to Sign In...");
      setTimeout(() => {
        handleSwitchTab("login");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <AnimatedBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Cyber Status Bar */}
        <Animated.View entering={FadeInUp.duration(400)} style={styles.header}>
          <View style={styles.brandGroup}>
            <View style={[styles.logoIcon, { backgroundColor: theme.chipBackground, borderColor: theme.primary }]}>
              <MaterialCommunityIcons name="navigation-variant" size={26} color={theme.primary} />
            </View>
            <View>
              <Text style={[styles.brandTitle, { color: theme.text }]}>
                Road<Text style={{ color: theme.primary }}>Sense AI</Text>
              </Text>
              <Text style={[styles.brandSubtitle, { color: theme.textSecondary }]}>
                Cyber-Deck Navigation Intelligence
              </Text>
            </View>
          </View>

          <View style={styles.rightGroup}>
            <View style={[styles.statusBadge, { backgroundColor: "rgba(57, 255, 20, 0.10)", borderColor: "rgba(57, 255, 20, 0.30)" }]}>
              <Animated.View style={[styles.liveDot, pulseStyle]} />
              <Text style={styles.liveText}>SYSTEM ONLINE</Text>
            </View>

            <Pressable
              onPress={() => router.replace("/(tabs)/dashboard")}
              style={[styles.guestBtn, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}
            >
              <Text style={[styles.guestText, { color: theme.textSecondary }]}>Explore as Guest</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color={theme.textSecondary} />
            </Pressable>
          </View>
        </Animated.View>

        {/* Main Split Cyber-Deck Body */}
        <View style={[styles.deckBody, isDesktop && styles.deckBodyDesktop]}>
          {/* Left Column: Live HUD Telemetry Simulator */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={[styles.hudWrap, isDesktop && { flex: 1 }]}>
            <GlassCard style={styles.hudCard}>
              <View style={styles.hudHeader}>
                <MaterialCommunityIcons name="radar" size={22} color={theme.primary} />
                <Text style={[styles.hudTitle, { color: theme.text }]}>AI Route Telemetry Radar</Text>
              </View>

              {/* Radar Circle Simulation */}
              <View style={styles.radarSimBox}>
                <View style={[styles.radarRingOuter, { borderColor: theme.primary + "30" }]}>
                  <View style={[styles.radarRingInner, { borderColor: theme.primary + "50" }]}>
                    <MaterialCommunityIcons name="navigation-variant" size={32} color={theme.primary} />
                  </View>
                </View>
                <View style={styles.radarMarkerOne}>
                  <MaterialCommunityIcons name="alert-decagram" size={16} color="#FF5252" />
                  <Text style={styles.markerText}>Hazard Avoided</Text>
                </View>
                <View style={styles.radarMarkerTwo}>
                  <MaterialCommunityIcons name="leaf" size={16} color="#39FF14" />
                  <Text style={styles.markerText}>Eco Route active</Text>
                </View>
              </View>

              {/* Telemetry Stats Grid */}
              <View style={styles.telemetryGrid}>
                <View style={[styles.telemetryCell, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}>
                  <Text style={[styles.telemetryNumber, { color: theme.primary }]}>99.8%</Text>
                  <Text style={[styles.telemetryLabel, { color: theme.textSecondary }]}>Route Accuracy</Text>
                </View>
                <View style={[styles.telemetryCell, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}>
                  <Text style={[styles.telemetryNumber, { color: "#39FF14" }]}>+32%</Text>
                  <Text style={[styles.telemetryLabel, { color: theme.textSecondary }]}>Fuel Savings</Text>
                </View>
                <View style={[styles.telemetryCell, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}>
                  <Text style={[styles.telemetryNumber, { color: "#FFB300" }]}>0 Hazard</Text>
                  <Text style={[styles.telemetryLabel, { color: theme.textSecondary }]}>Traffic Shield</Text>
                </View>
              </View>

              {/* Feature Pills */}
              <View style={styles.pillsRow}>
                <View style={[styles.pill, { backgroundColor: theme.chipBackground }]}>
                  <MaterialCommunityIcons name="map-search-outline" size={14} color={theme.primary} />
                  <Text style={[styles.pillText, { color: theme.text }]}>MapLibre Vector</Text>
                </View>
                <View style={[styles.pill, { backgroundColor: theme.chipBackground }]}>
                  <MaterialCommunityIcons name="brain" size={14} color="#39FF14" />
                  <Text style={[styles.pillText, { color: theme.text }]}>Gemini AI Copilot</Text>
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* Right Column: Embedded Interactive Auth Portal */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={[styles.portalWrap, isDesktop && { flex: 1.1 }]}>
            <GlassCard style={styles.portalCard}>
              {/* Tab Switcher */}
              <View style={[styles.tabBar, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}>
                <Pressable
                  onPress={() => handleSwitchTab("signup")}
                  style={[styles.tabItem, activeTab === "signup" && { backgroundColor: theme.primary, borderRadius: 10 }]}
                >
                  <Text style={[styles.tabText, { color: activeTab === "signup" ? "#FFFFFF" : theme.textSecondary }]}>
                    Create Account
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSwitchTab("login")}
                  style={[styles.tabItem, activeTab === "login" && { backgroundColor: theme.primary, borderRadius: 10 }]}
                >
                  <Text style={[styles.tabText, { color: activeTab === "login" ? "#FFFFFF" : theme.textSecondary }]}>
                    Sign In
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleSwitchTab("forgot")}
                  style={[styles.tabItem, activeTab === "forgot" && { backgroundColor: theme.primary, borderRadius: 10 }]}
                >
                  <Text style={[styles.tabText, { color: activeTab === "forgot" ? "#FFFFFF" : theme.textSecondary }]}>
                    Reset Code
                  </Text>
                </Pressable>
              </View>

              {/* Feedback Banners */}
              {errorMessage ? (
                <View style={styles.errorAlert}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF5252" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              ) : null}

              {successMessage ? (
                <View style={styles.successAlert}>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#39FF14" />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* PORTAL TAB 1: CREATE ACCOUNT */}
              {activeTab === "signup" && (
                <View style={styles.formStack}>
                  <Text style={[styles.portalTitle, { color: theme.text }]}>Initialize Driver Profile</Text>
                  <Text style={[styles.portalSub, { color: theme.textSecondary }]}>
                    Create your account to enable personalized trip logs and route analytics.
                  </Text>

                  <InputField label="Full Name" icon="account-outline" value={name} onChangeText={setName} placeholder="Alex Morgan" theme={theme} />
                  <InputField label="Email Address" icon="email-outline" value={email} onChangeText={setEmail} placeholder="alex@roadsense.ai" keyboardType="email-address" autoCapitalize="none" theme={theme} />
                  <InputField label="Phone Number" icon="phone-outline" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" theme={theme} />

                  <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Vehicle Type</Text>
                  <View style={styles.tagsRow}>
                    {VEHICLE_TAGS.map((tag) => {
                      const active = selectedVehicleTag === tag;
                      return (
                        <Pressable
                          key={tag}
                          onPress={() => setSelectedVehicleTag(tag)}
                          style={[
                            styles.tagChip,
                            { backgroundColor: theme.chipBackground, borderColor: theme.border },
                            active && { borderColor: theme.primary, borderWidth: 1.5 }
                          ]}
                        >
                          <Text style={[styles.tagText, { color: active ? theme.primary : theme.textSecondary }]}>{tag}</Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <InputField label="Password" icon="lock-outline" value={password} onChangeText={setPassword} placeholder="At least 6 characters" secureTextEntry={!showPassword} rightIcon={showPassword ? "eye-off-outline" : "eye-outline"} onRightIconPress={() => setShowPassword(!showPassword)} theme={theme} />

                  <GradientButton
                    label={loading ? "Registering..." : "Create Account & Open Dashboard"}
                    icon="rocket-launch"
                    onPress={handleRegisterSubmit}
                    disabled={loading}
                    style={styles.submitBtn}
                  />
                </View>
              )}

              {/* PORTAL TAB 2: SIGN IN */}
              {activeTab === "login" && (
                <View style={styles.formStack}>
                  <Text style={[styles.portalTitle, { color: theme.text }]}>Welcome Back Driver</Text>
                  <Text style={[styles.portalSub, { color: theme.textSecondary }]}>
                    Sign in to sync your saved preferences and trip intelligence.
                  </Text>

                  <InputField label="Email Address" icon="email-outline" value={loginEmail} onChangeText={setLoginEmail} placeholder="alex.morgan@roadsense.ai" keyboardType="email-address" autoCapitalize="none" theme={theme} />
                  <InputField label="Password" icon="lock-outline" value={loginPassword} onChangeText={setLoginPassword} placeholder="••••••••" secureTextEntry={!showPassword} rightIcon={showPassword ? "eye-off-outline" : "eye-outline"} onRightIconPress={() => setShowPassword(!showPassword)} theme={theme} />

                  <GradientButton
                    label={loading ? "Authenticating..." : "Sign In & Open Dashboard"}
                    icon="login"
                    onPress={handleLoginSubmit}
                    disabled={loading}
                    style={styles.submitBtn}
                  />
                </View>
              )}

              {/* PORTAL TAB 3: FORGOT PASSWORD */}
              {activeTab === "forgot" && (
                <View style={styles.formStack}>
                  <Text style={[styles.portalTitle, { color: theme.text }]}>Password Recovery</Text>
                  <Text style={[styles.portalSub, { color: theme.textSecondary }]}>
                    {resetStep === 1
                      ? "Enter your account email address to generate a 4-digit reset code."
                      : "Enter the code and setup your new account password."}
                  </Text>

                  {resetStep === 1 ? (
                    <>
                      <InputField label="Registered Email" icon="email-outline" value={resetEmail} onChangeText={setResetEmail} placeholder="alex@roadsense.ai" keyboardType="email-address" autoCapitalize="none" theme={theme} />
                      <GradientButton
                        label={loading ? "Requesting..." : "Generate Reset Code"}
                        icon="email-send-outline"
                        onPress={handleRequestCode}
                        disabled={loading}
                        style={styles.submitBtn}
                      />
                    </>
                  ) : (
                    <>
                      <InputField label="4-Digit Code" icon="shield-key-outline" value={resetCode} onChangeText={setResetCode} placeholder="e.g. 8492" keyboardType="number-pad" theme={theme} />
                      <InputField label="New Password" icon="lock-reset" value={newPassword} onChangeText={setNewPassword} placeholder="New password (min 6 chars)" secureTextEntry={!showPassword} theme={theme} />
                      <GradientButton
                        label={loading ? "Updating..." : "Reset Password & Sign In"}
                        icon="check-decagram"
                        onPress={handleResetPassword}
                        disabled={loading}
                        style={styles.submitBtn}
                      />
                    </>
                  )}
                </View>
              )}
            </GlassCard>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}

function InputField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  rightIcon,
  onRightIconPress,
  theme
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  autoCapitalize?: any;
  rightIcon?: string;
  onRightIconPress?: () => void;
  theme: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View style={[styles.inputBox, { backgroundColor: theme.input, borderColor: theme.border }]}>
        <MaterialCommunityIcons name={icon as any} size={18} color={theme.primary} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary + "80"}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          style={[styles.textInput, { color: theme.text }]}
        />
        {rightIcon ? (
          <Pressable onPress={onRightIconPress} style={{ padding: 4 }}>
            <MaterialCommunityIcons name={rightIcon as any} size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
  scroll: {
    flex: 1
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 44,
    paddingBottom: 48,
    gap: 20
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12
  },
  brandGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12
  },
  logoIcon: {
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    height: 48,
    justifyContent: "center",
    width: 48
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: "600"
  },
  rightGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  statusBadge: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  liveDot: {
    backgroundColor: "#39FF14",
    borderRadius: 999,
    height: 8,
    width: 8
  },
  liveText: {
    color: "#39FF14",
    fontSize: 11,
    fontWeight: "800"
  },
  guestBtn: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  guestText: {
    fontSize: 12,
    fontWeight: "700"
  },
  deckBody: {
    gap: 20
  },
  deckBodyDesktop: {
    flexDirection: "row",
    alignItems: "flex-start"
  },
  hudWrap: {
    width: "100%"
  },
  hudCard: {
    padding: 20
  },
  hudHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
    marginBottom: 16
  },
  hudTitle: {
    fontSize: 16,
    fontWeight: "900"
  },
  radarSimBox: {
    alignItems: "center",
    height: 180,
    justifyContent: "center",
    marginBottom: 16,
    position: "relative"
  },
  radarRingOuter: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    height: 160,
    justifyContent: "center",
    width: 160
  },
  radarRingInner: {
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1.5,
    height: 100,
    justifyContent: "center",
    width: 100
  },
  radarMarkerOne: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    left: 10,
    position: "absolute",
    top: 20
  },
  radarMarkerTwo: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
    position: "absolute",
    right: 10,
    bottom: 20
  },
  markerText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700"
  },
  telemetryGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14
  },
  telemetryCell: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingVertical: 12
  },
  telemetryNumber: {
    fontSize: 16,
    fontWeight: "900"
  },
  telemetryLabel: {
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2
  },
  pillsRow: {
    flexDirection: "row",
    gap: 8
  },
  pill: {
    alignItems: "center",
    borderRadius: 12,
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700"
  },
  portalWrap: {
    width: "100%"
  },
  portalCard: {
    padding: 20
  },
  tabBar: {
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    marginBottom: 16,
    padding: 4
  },
  tabItem: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingVertical: 10
  },
  tabText: {
    fontSize: 12,
    fontWeight: "800"
  },
  formStack: {
    paddingVertical: 2
  },
  portalTitle: {
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4
  },
  portalSub: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14
  },
  fieldGroup: {
    marginBottom: 12
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 6
  },
  inputBox: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 12
  },
  tagChip: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  tagText: {
    fontSize: 11,
    fontWeight: "800"
  },
  submitBtn: {
    marginTop: 8
  },
  errorAlert: {
    alignItems: "center",
    backgroundColor: "rgba(255, 82, 82, 0.12)",
    borderColor: "rgba(255, 82, 82, 0.35)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  errorText: {
    color: "#FF5252",
    flex: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  successAlert: {
    alignItems: "center",
    backgroundColor: "rgba(57, 255, 20, 0.12)",
    borderColor: "rgba(57, 255, 20, 0.35)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  successText: {
    color: "#39FF14",
    flex: 1,
    fontSize: 12,
    fontWeight: "700"
  }
});
