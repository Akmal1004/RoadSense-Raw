import React, { useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/hooks/useTheme";

type AuthMode = "login" | "signup" | "forgot";

interface AuthModalProps {
  visible: boolean;
  initialMode?: AuthMode;
  onClose: () => void;
  onSuccess?: (mode: AuthMode) => void;
}

export default function AuthModal({ visible, initialMode = "login", onClose, onSuccess }: AuthModalProps) {
  const { theme } = useTheme();
  const { login, register, requestResetCode, resetPassword } = useAuth();

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleModel, setVehicleModel] = useState("");

  // Forgot Password state
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCodeInput, setResetCodeInput] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  const resetState = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(false);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setName("");
    setPhone("");
    setVehicleModel("");
    setResetStep(1);
    setResetCodeInput("");
    setGeneratedCode(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const switchMode = (newMode: AuthMode) => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setMode(newMode);
  };

  // Actions
  const handleLogin = async () => {
    if (!email) {
      setErrorMessage("Please enter your email address.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter your password.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await login({ email, password });
      setSuccessMessage("Welcome back! Sign-in successful.");
      setTimeout(() => {
        onSuccess?.("login");
        handleClose();
      }, 1000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to sign in.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name.trim()) {
      setErrorMessage("Full Name is required.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Email address is required.");
      return;
    }
    if (!password) {
      setErrorMessage("Password is required.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await register({
        name,
        email,
        password,
        phone,
        vehicleModel
      });
      setSuccessMessage("Account created successfully! Welcome to RoadSense.");
      setTimeout(() => {
        onSuccess?.("signup");
        handleClose();
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Account registration failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your email to receive a reset code.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const code = await requestResetCode(email);
      setGeneratedCode(code);
      setResetStep(2);
      setSuccessMessage(`Reset code generated: ${code}. Enter this code below to set a new password.`);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to request password reset code.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetCodeInput.trim()) {
      setErrorMessage("Please enter the 4-digit verification code.");
      return;
    }
    if (!password) {
      setErrorMessage("Please enter a new password.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("New password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      await resetPassword({
        email,
        code: resetCodeInput,
        newPassword: password
      });
      setSuccessMessage("Password reset successful! You can now sign in with your new password.");
      setTimeout(() => {
        switchMode("login");
      }, 1500);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContainer}>
          <GlassCard style={styles.card}>
            {/* Header / Close button */}
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <MaterialCommunityIcons
                  name={mode === "login" ? "login" : mode === "signup" ? "account-plus" : "lock-reset"}
                  size={24}
                  color={theme.primary}
                />
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  {mode === "login" ? "Sign In" : mode === "signup" ? "Create Account" : "Reset Password"}
                </Text>
              </View>
              <Pressable
                onPress={handleClose}
                style={[styles.closeButton, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            {/* Error & Success Feedback Alerts */}
            {errorMessage ? (
              <Animated.View entering={FadeInDown.duration(200)} style={[styles.alert, styles.errorAlert]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color="#FF5252" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </Animated.View>
            ) : null}

            {successMessage ? (
              <Animated.View entering={FadeInDown.duration(200)} style={[styles.alert, styles.successAlert]}>
                <MaterialCommunityIcons name="check-circle-outline" size={18} color="#39FF14" />
                <Text style={styles.successText}>{successMessage}</Text>
              </Animated.View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {/* LOGIN MODE */}
              {mode === "login" && (
                <View style={styles.form}>
                  <InputField
                    label="Email Address"
                    icon="email-outline"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="alex.morgan@roadsense.ai"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    theme={theme}
                  />

                  <InputField
                    label="Password"
                    icon="lock-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    theme={theme}
                  />

                  <Pressable onPress={() => switchMode("forgot")} style={styles.forgotBtn}>
                    <Text style={[styles.forgotText, { color: theme.primary }]}>Forgot Password?</Text>
                  </Pressable>

                  <GradientButton
                    label={loading ? "Signing In..." : "Sign In"}
                    icon="login"
                    onPress={handleLogin}
                    disabled={loading}
                    style={styles.submitBtn}
                  />

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchPrompt, { color: theme.textSecondary }]}>Don't have an account?</Text>
                    <Pressable onPress={() => switchMode("signup")}>
                      <Text style={[styles.switchLink, { color: theme.primary }]}>Create Account</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* CREATE ACCOUNT (SIGNUP) MODE */}
              {mode === "signup" && (
                <View style={styles.form}>
                  <InputField
                    label="Full Name"
                    icon="account-outline"
                    value={name}
                    onChangeText={setName}
                    placeholder="Alex Morgan"
                    theme={theme}
                  />

                  <InputField
                    label="Email Address"
                    icon="email-outline"
                    value={email}
                    onChangeText={setEmail}
                    placeholder="alex@roadsense.ai"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    theme={theme}
                  />

                  <InputField
                    label="Phone Number"
                    icon="phone-outline"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+91 98765 43210"
                    keyboardType="phone-pad"
                    theme={theme}
                  />

                  <InputField
                    label="Vehicle Model"
                    icon="car-sports"
                    value={vehicleModel}
                    onChangeText={setVehicleModel}
                    placeholder="Tesla Model 3 / Hyundai Ioniq 5"
                    theme={theme}
                  />

                  <InputField
                    label="Password"
                    icon="lock-outline"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    secureTextEntry={!showPassword}
                    rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                    onRightIconPress={() => setShowPassword(!showPassword)}
                    theme={theme}
                  />

                  <InputField
                    label="Confirm Password"
                    icon="lock-check-outline"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter password"
                    secureTextEntry={!showPassword}
                    theme={theme}
                  />

                  <GradientButton
                    label={loading ? "Creating Account..." : "Register Account"}
                    icon="account-plus"
                    onPress={handleRegister}
                    disabled={loading}
                    style={styles.submitBtn}
                  />

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchPrompt, { color: theme.textSecondary }]}>Already registered?</Text>
                    <Pressable onPress={() => switchMode("login")}>
                      <Text style={[styles.switchLink, { color: theme.primary }]}>Sign In</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* FORGOT PASSWORD MODE */}
              {mode === "forgot" && (
                <View style={styles.form}>
                  <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                    {resetStep === 1
                      ? "Enter your account email to receive a 4-digit verification code."
                      : `Enter the 4-digit code sent to ${email} and your new password.`}
                  </Text>

                  {resetStep === 1 ? (
                    <>
                      <InputField
                        label="Email Address"
                        icon="email-outline"
                        value={email}
                        onChangeText={setEmail}
                        placeholder="alex.morgan@roadsense.ai"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        theme={theme}
                      />

                      <GradientButton
                        label={loading ? "Sending Code..." : "Request Reset Code"}
                        icon="email-send-outline"
                        onPress={handleRequestCode}
                        disabled={loading}
                        style={styles.submitBtn}
                      />
                    </>
                  ) : (
                    <>
                      <InputField
                        label="4-Digit Verification Code"
                        icon="shield-key-outline"
                        value={resetCodeInput}
                        onChangeText={setResetCodeInput}
                        placeholder="e.g. 8492"
                        keyboardType="number-pad"
                        theme={theme}
                      />

                      <InputField
                        label="New Password"
                        icon="lock-reset"
                        value={password}
                        onChangeText={setPassword}
                        placeholder="New password (min 6 chars)"
                        secureTextEntry={!showPassword}
                        rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
                        onRightIconPress={() => setShowPassword(!showPassword)}
                        theme={theme}
                      />

                      <GradientButton
                        label={loading ? "Updating Password..." : "Reset Password"}
                        icon="check-decagram"
                        onPress={handleResetPassword}
                        disabled={loading}
                        style={styles.submitBtn}
                      />
                    </>
                  )}

                  <View style={styles.switchRow}>
                    <Text style={[styles.switchPrompt, { color: theme.textSecondary }]}>Remembered your password?</Text>
                    <Pressable onPress={() => switchMode("login")}>
                      <Text style={[styles.switchLink, { color: theme.primary }]}>Back to Sign In</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
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
          <Pressable onPress={onRightIconPress} style={styles.rightIconPressable}>
            <MaterialCommunityIcons name={rightIcon as any} size={18} color={theme.textSecondary} />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.70)",
    flex: 1,
    justifyContent: "center",
    padding: 20
  },
  modalContainer: {
    maxHeight: "90%",
    width: "100%",
    maxWidth: 440
  },
  card: {
    padding: 22
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16
  },
  titleWrap: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900"
  },
  closeButton: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    height: 34,
    justifyContent: "center",
    width: 34
  },
  scroll: {
    maxHeight: 460
  },
  form: {
    paddingVertical: 4
  },
  instructionText: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  fieldGroup: {
    marginBottom: 14
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
  rightIconPressable: {
    padding: 4
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 16,
    marginTop: -4
  },
  forgotText: {
    fontSize: 12,
    fontWeight: "800"
  },
  submitBtn: {
    marginTop: 8
  },
  switchRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    marginTop: 18
  },
  switchPrompt: {
    fontSize: 13
  },
  switchLink: {
    fontSize: 13,
    fontWeight: "900"
  },
  alert: {
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 14,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  errorAlert: {
    backgroundColor: "rgba(255, 82, 82, 0.12)",
    borderColor: "rgba(255, 82, 82, 0.35)"
  },
  errorText: {
    color: "#FF5252",
    flex: 1,
    fontSize: 12,
    fontWeight: "700"
  },
  successAlert: {
    backgroundColor: "rgba(57, 255, 20, 0.12)",
    borderColor: "rgba(57, 255, 20, 0.35)"
  },
  successText: {
    color: "#39FF14",
    flex: 1,
    fontSize: 12,
    fontWeight: "700"
  }
});
