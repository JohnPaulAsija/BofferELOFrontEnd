import React, { useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ErrorModal } from "@/components/ui/error-modal";
import { getThemeColors, BorderRadius, Spacing, Typography } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{
    visible: boolean;
    title: string;
    message: string;
    variant: "error" | "info";
    onAfterDismiss?: () => void;
  }>({ visible: false, title: "", message: "", variant: "error" });

  function showError(title: string, message: string) {
    setModal({ visible: true, title, message, variant: "error" });
  }

  function showInfo(title: string, message: string, onAfterDismiss?: () => void) {
    setModal({ visible: true, title, message, variant: "info", onAfterDismiss });
  }

  function hideModal() {
    const afterDismiss = modal.onAfterDismiss;
    setModal(prev => ({ ...prev, visible: false, onAfterDismiss: undefined }));
    afterDismiss?.();
  }

  async function sendReset() {
    if (!email.trim()) {
      showError("Email Required", "Please enter your email address.");
      return;
    }

    setLoading(true);
    const redirectTo =
      Platform.OS === "web"
        ? window.location.origin + "/reset-password"
        : "supabasetest://reset-password";

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    setLoading(false);

    if (error) {
      showError("Request Failed", "Unable to send a reset email. Please try again.");
      return;
    }

    // Always show success to avoid leaking which emails are registered
    showInfo(
      "Check Your Email",
      "If an account exists for that address, you'll receive a password reset link shortly.",
      () => router.replace("/auth")
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
          <Text style={[styles.title, { color: colors.text.primary }]}>Reset Password</Text>
          <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
            Enter your email and we'll send you a reset link
          </Text>

          <View style={[styles.section, { borderColor: colors.border.primary }]}>
            <Input
              label="Email"
              onChangeText={setEmail}
              value={email}
              placeholder="email@address.com"
              autoCapitalize="none"
            />
          </View>

          <Button
            title="Send Reset Link"
            onPress={sendReset}
            disabled={loading}
            loading={loading}
          />

          <Pressable onPress={() => router.push("/auth")} style={styles.backLink}>
            <Text style={[styles.backLinkText, { color: colors.text.secondary }]}>
              Back to{" "}
              <Text style={{ color: colors.brand.amber, fontWeight: "600" }}>Sign In</Text>
            </Text>
          </Pressable>
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
  backLink: {
    alignItems: "center",
    paddingVertical: Spacing.lg,
  },
  backLinkText: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
});
