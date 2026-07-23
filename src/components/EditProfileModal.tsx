import React, { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import GlassCard from "./GlassCard";
import GradientButton from "./GradientButton";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../theme/hooks/useTheme";
import { UserAvatar, UserProfile } from "../types/auth";

const AVATAR_OPTIONS: Array<{ icon: UserAvatar; label: string }> = [
  { icon: "account-circle", label: "Classic" },
  { icon: "account-cowboy-hat", label: "Explorer" },
  { icon: "account-tie", label: "Executive" },
  { icon: "account-hard-hat", label: "Engineer" },
  { icon: "shield-account", label: "Guardian" },
  { icon: "racing-helmet", label: "Racer" }
];

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ visible, onClose }: EditProfileModalProps) {
  const { theme } = useTheme();
  const { user, updateProfile } = useAuth();

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [vehicleModel, setVehicleModel] = useState(user?.vehicleModel || "");
  const [emergencyContact, setEmergencyContact] = useState(user?.emergencyContact || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [selectedAvatar, setSelectedAvatar] = useState<UserAvatar>((user?.avatar as UserAvatar) || "account-circle");
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setVehicleModel(user.vehicleModel || "");
      setEmergencyContact(user.emergencyContact || "");
      setBio(user.bio || "");
      setSelectedAvatar((user.avatar as UserAvatar) || "account-circle");
    }
  }, [user, visible]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        vehicleModel: vehicleModel.trim(),
        emergencyContact: emergencyContact.trim(),
        bio: bio.trim(),
        avatar: selectedAvatar
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1000);
    } catch (error) {
      console.warn("[EditProfile] Failed to save changes", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animated.View entering={FadeInUp.duration(300)} style={styles.modalContainer}>
          <GlassCard style={styles.card}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View style={styles.titleWrap}>
                <MaterialCommunityIcons name="account-edit-outline" size={24} color={theme.primary} />
                <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile Details</Text>
              </View>
              <Pressable
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.chipBackground, borderColor: theme.border }]}
              >
                <MaterialCommunityIcons name="close" size={20} color={theme.textSecondary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
              {/* Avatar Selector */}
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Choose Avatar Style</Text>
              <View style={styles.avatarGrid}>
                {AVATAR_OPTIONS.map((item) => {
                  const active = selectedAvatar === item.icon;
                  return (
                    <Pressable
                      key={item.icon}
                      onPress={() => setSelectedAvatar(item.icon)}
                      style={[
                        styles.avatarItem,
                        { backgroundColor: theme.chipBackground, borderColor: theme.border },
                        active && { borderColor: theme.primary, borderWidth: 2, backgroundColor: theme.chipBackground }
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={item.icon as any}
                        size={28}
                        color={active ? theme.primary : theme.textSecondary}
                      />
                      <Text style={[styles.avatarLabel, { color: active ? theme.primary : theme.textSecondary }]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              {/* Form Fields */}
              <EditField label="Full Name" icon="account-outline" value={name} onChangeText={setName} placeholder="Alex Morgan" theme={theme} />
              <EditField label="Phone Number" icon="phone-outline" value={phone} onChangeText={setPhone} placeholder="+91 98765 43210" keyboardType="phone-pad" theme={theme} />
              <EditField label="Vehicle Model" icon="car-sports" value={vehicleModel} onChangeText={setVehicleModel} placeholder="Hyundai Ioniq 5 / Tata Nexon EV" theme={theme} />
              <EditField label="Emergency Contact" icon="phone-alert-outline" value={emergencyContact} onChangeText={setEmergencyContact} placeholder="+91 98765 00911" keyboardType="phone-pad" theme={theme} />
              <EditField label="Bio / Driver Note" icon="text-short" value={bio} onChangeText={setBio} multiline theme={theme} />

              {savedSuccess ? (
                <View style={styles.savedBanner}>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color="#39FF14" />
                  <Text style={styles.savedText}>Profile details updated successfully!</Text>
                </View>
              ) : null}

              <GradientButton
                label={loading ? "Saving Changes..." : "Save Profile Details"}
                icon="content-save-check"
                onPress={handleSave}
                disabled={loading}
                style={styles.saveButton}
              />
            </ScrollView>
          </GlassCard>
        </Animated.View>
      </View>
    </Modal>
  );
}

function EditField({
  label,
  icon,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  multiline,
  theme
}: {
  label: string;
  icon: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: any;
  multiline?: boolean;
  theme: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</Text>
      <View
        style={[
          styles.inputBox,
          { backgroundColor: theme.input, borderColor: theme.border },
          multiline && { alignItems: "flex-start", paddingTop: 10 }
        ]}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color={theme.primary} style={multiline ? { marginTop: 2 } : undefined} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={multiline ? 3 : 1}
          style={[styles.textInput, { color: theme.text }, multiline && { minHeight: 60, textAlignVertical: "top" }]}
        />
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
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 10
  },
  avatarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 16
  },
  avatarItem: {
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "column",
    gap: 4,
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: "30%"
  },
  avatarLabel: {
    fontSize: 11,
    fontWeight: "800"
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
  saveButton: {
    marginTop: 10
  },
  savedBanner: {
    alignItems: "center",
    backgroundColor: "rgba(57, 255, 20, 0.12)",
    borderColor: "rgba(57, 255, 20, 0.35)",
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  savedText: {
    color: "#39FF14",
    flex: 1,
    fontSize: 12,
    fontWeight: "700"
  }
});
