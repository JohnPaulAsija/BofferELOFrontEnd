import React, { useEffect, useState } from "react";
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorModal } from "@/components/ui/error-modal";
import { getThemeColors, BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [sessionReady, setSessionReady] = useState(Platform.OS === "web");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: "error" | "info";
    onAfterDismiss?: () => void;
  }>({ visible: false, title: "", message: "", variant: "error" });

  function showError(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: "error", onAfterDismiss });
  }

  function showInfo(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: "info", onAfterDismiss });
  }

  function hideModal() {
    const afterDismiss = modal.onAfterDismiss;
    setModal(prev => ({ ...prev, visible: false, onAfterDismiss: undefined }));
    afterDismiss?.();
  }

  // On native, parse the deep-link URL for the recovery tokens and set the session
  useEffect(() => {
    if (Platform.OS === "web") return;

    async function handleNativeDeepLink() {
      const url = await Linking.getInitialURL();
      if (!url) {
        showError(
          "Invalid Link",
          "No reset link was detected. Please request a new password reset.",
          () => router.replace("/auth")
        );
        return;
      }

      try {
        const hash = new URL(url).hash.substring(1); // strip the leading #
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken || !refreshToken) {
          showError(
            "Invalid Link",
            "The reset link appears to be invalid or expired. Please request a new one.",
            () => router.replace("/auth")
          );
          return;
        }

        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) {
          showError(
            "Link Expired",
            "The reset link has expired. Please request a new password reset.",
            () => router.replace("/auth")
          );
          return;
        }

        setSessionReady(true);
      } catch {
        showError(
          "Invalid Link",
          "Unable to process the reset link. Please request a new one.",
          () => router.replace("/auth")
        );
      }
    }

    handleNativeDeepLink();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On web, verify that Supabase has established a recovery session
  useEffect(() => {
    if (Platform.OS !== "web") return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        showError(
          "Invalid Link",
          "The reset link is invalid or has expired. Please request a new password reset.",
          () => router.replace("/auth")
        );
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleReset() {
    if (!password || !confirmPassword) {
      showError("Missing Fields", "Please fill in both password fields.");
      return;
    }
    if (password !== confirmPassword) {
      showError("Password Mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      showError("Update Failed", "Unable to update your password. Please request a new reset link.");
      return;
    }

    showInfo(
      "Password Updated",
      "Your password has been changed. Please sign in with your new password.",
      () => {
        supabase.auth.signOut();
        router.replace("/auth");
      }
    );
  }

  return (
    <>
      <ErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        onDismiss={hideModal}
      />
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background.primary }}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={[styles.title, { color: colors.text.primary }]}>New Password</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Choose a new password for your account
          </Text>

          {!sessionReady ? (
            <ActivityIndicator color={colors.brand.amber} style={{ marginTop: Spacing.xl }} />
          ) : (
            <>
              <View style={[styles.section, { borderColor: colors.border.primary }]}>
                <Input
                  label="New Password"
                  onChangeText={setPassword}
                  value={password}
                  placeholder="New password"
                  autoCapitalize="none"
                  secureTextEntry
                />
                <Input
                  label="Confirm New Password"
                  onChangeText={setConfirmPassword}
                  value={confirmPassword}
                  placeholder="Confirm new password"
                  autoCapitalize="none"
                  secureTextEntry
                />
              </View>

              <Button
                title="Update Password"
                onPress={handleReset}
                disabled={loading}
                loading={loading}
              />
            </>
          )}
        </View>
      </ScrollView>
    </>
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
});
