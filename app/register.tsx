import React, { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import {
  getOptionsFromAPI,
  setupUserFromAPI,
  updatePreferencesFromAPI,
  OptionsResponse,
} from "@/lib/apiInteractions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getThemeColors, Spacing, Typography, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

function OptionPicker({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <View style={styles.pickerGroup}>
      <Text style={[styles.pickerLabel, { color: colors.text.secondary }]}>{label}</Text>
      <View style={styles.chipsRow}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(selected ? null : opt)}
              style={[
                styles.chip,
                { borderColor: selected ? colors.brand.amber : colors.border.primary },
                selected && { backgroundColor: colors.brand.amber + "22" },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: selected ? colors.brand.amber : colors.text.secondary },
                ]}
              >
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function RegisterScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");

  const [gender, setGender] = useState<string | null>(null);
  const [preferredGame, setPreferredGame] = useState<string | null>(null);
  const [preferredWeapon, setPreferredWeapon] = useState<string | null>(null);
  const [preferredShield, setPreferredShield] = useState<string | null>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<OptionsResponse | null>(null);

  useEffect(() => {
    getOptionsFromAPI()
      .then(setOptions)
      .catch(() => {
        // Options are cosmetic — sign-up still works without them
      });
  }, []);

  async function handleRegister() {
    if (!email.trim() || !password || !confirmPassword || !username.trim()) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (username.trim().length < 3) {
      Alert.alert("Username Too Short", "Username must be at least 3 characters.");
      return;
    }
    if (!termsAccepted) {
      Alert.alert("Terms Required", "You must accept the Terms & Conditions to continue.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { session },
        error: signUpError,
      } = await supabase.auth.signUp({ email: email.trim(), password });

      if (signUpError) {
        Alert.alert("Sign Up Failed", signUpError.message);
        setLoading(false);
        return;
      }

      if (!session) {
        Alert.alert(
          "Verify Your Email",
          "Please check your inbox and verify your email address before signing in."
        );
        router.replace("/auth");
        return;
      }

      await setupUserFromAPI(session.access_token, username.trim());

      if (gender || preferredGame || preferredWeapon || preferredShield) {
        await updatePreferencesFromAPI(session.access_token, {
          gender,
          preferred_game: preferredGame,
          preferred_weapon: preferredWeapon,
          preferred_shield: preferredShield,
        });
      }

      router.replace("/");
    } catch (err: any) {
      Alert.alert("Registration Failed", err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background.primary }}
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.card}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.text.primary }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
          Join BofferElo and start tracking your ELO
        </Text>

        {/* Account Section */}
        <View style={[styles.section, { borderColor: colors.border.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>ACCOUNT</Text>
          <Input
            label="Email *"
            onChangeText={setEmail}
            value={email}
            placeholder="email@address.com"
            autoCapitalize="none"
          />
          <Input
            label="Password *"
            onChangeText={setPassword}
            value={password}
            placeholder="Password"
            autoCapitalize="none"
            secureTextEntry
          />
          <Input
            label="Confirm Password *"
            onChangeText={setConfirmPassword}
            value={confirmPassword}
            placeholder="Confirm password"
            autoCapitalize="none"
            secureTextEntry
          />
        </View>

        {/* Username Section */}
        <View style={[styles.section, { borderColor: colors.border.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>USERNAME</Text>
          <Input
            label="Username *"
            onChangeText={setUsername}
            value={username}
            placeholder="Your display name (min. 3 characters)"
            autoCapitalize="none"
          />
        </View>

        {/* Profile Section */}
        {options && (
          <View style={[styles.section, { borderColor: colors.border.primary }]}>
            <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
              PROFILE{" "}
              <Text style={{ fontWeight: "400", textTransform: "none" }}>(Optional)</Text>
            </Text>
            <OptionPicker
              label="Gender"
              options={options.genders}
              value={gender}
              onSelect={setGender}
            />
            <OptionPicker
              label="Preferred Game"
              options={options.games}
              value={preferredGame}
              onSelect={setPreferredGame}
            />
            <OptionPicker
              label="Preferred Weapon"
              options={options.weapons}
              value={preferredWeapon}
              onSelect={setPreferredWeapon}
            />
            <OptionPicker
              label="Preferred Shield"
              options={options.shields}
              value={preferredShield}
              onSelect={setPreferredShield}
            />
          </View>
        )}

        {/* Terms Section */}
        <View style={[styles.section, { borderColor: colors.border.primary }]}>
          <Text style={[styles.sectionTitle, { color: colors.text.tertiary }]}>
            TERMS & CONDITIONS
          </Text>
          <Pressable
            style={styles.termsRow}
            onPress={() => setTermsAccepted(!termsAccepted)}
          >
            <View
              style={[
                styles.checkbox,
                {
                  borderColor: termsAccepted ? colors.brand.amber : colors.border.secondary,
                  backgroundColor: termsAccepted ? colors.brand.amber : "transparent",
                },
              ]}
            >
              {termsAccepted && (
                <Text style={[styles.checkmark, { color: colors.text.white }]}>✓</Text>
              )}
            </View>
            <Text style={[styles.termsText, { color: colors.text.secondary }]}>
              I agree that match reports and ELO ratings are public, and that I will only report
              matches I participated in.
            </Text>
          </Pressable>
        </View>

        {/* Submit */}
        <View style={styles.submitSection}>
          <Button
            title="Create Account"
            onPress={handleRegister}
            disabled={loading}
            loading={loading}
          />
          <Pressable onPress={() => router.push("/auth")} style={styles.signInLink}>
            <Text style={[styles.signInText, { color: colors.text.secondary }]}>
              Already have an account?{" "}
              <Text style={{ color: colors.brand.amber, fontWeight: "600" }}>Sign In</Text>
            </Text>
          </Pressable>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xxl,
  },
  card: {
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    textAlign: "center",
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  section: {
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: Spacing.md,
  },
  pickerGroup: {
    marginBottom: Spacing.md,
  },
  pickerLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    marginBottom: Spacing.sm,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  chip: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "bold",
    lineHeight: 16,
  },
  termsText: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    lineHeight: 20,
  },
  submitSection: {
    gap: Spacing.lg,
  },
  signInLink: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  signInText: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
});
