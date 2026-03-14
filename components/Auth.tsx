import React, { useState } from "react";
import { Text, View, Pressable, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { supabase } from "../lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ErrorModal } from "./ui/error-modal";
import { getThemeColors, Typography, Spacing, BorderRadius } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import { useErrorModal } from "@/hooks/useErrorModal";

export default function Auth() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { modal, showError, showInfo, hideModal } = useErrorModal();

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      const isUnverified = error.message === "Email not confirmed";
      if (isUnverified) {
        showError(
          "Email Not Verified",
          "Please verify your email address before signing in. Check your inbox for a confirmation link.",
          { actionLabel: "Resend Email", onAction: resendVerification }
        );
      } else {
        showError("Sign In Failed", "Invalid email or password. Please try again.");
      }
    } else {
      router.replace("/");
    }
    setLoading(false);
  }

  async function resendVerification() {
    hideModal();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      showError("Resend Failed", "Could not resend verification email. Please try again.");
    } else {
      showInfo("Email Sent", "A new verification link has been sent to your inbox.");
    }
  }

  return (
    <View style={styles.container}>
      <ErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        onDismiss={hideModal}
        variant={modal.variant}
        actionLabel={modal.action?.actionLabel}
        onAction={modal.action?.onAction}
      />
      <Text style={[styles.title, { color: colors.text.primary }]}>Sign In</Text>
      <Text style={[styles.subtitle, { color: colors.text.secondary }]}>
        Welcome back to BofferElo
      </Text>

      <View style={styles.fields}>
        <Input
          label="Email"
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
        />
        <Input
          label="Password"
          onChangeText={setPassword}
          value={password}
          placeholder="Password"
          autoCapitalize="none"
          secureTextEntry
        />
      </View>

      <Button title="Sign In" disabled={loading} loading={loading} onPress={signInWithEmail} />

      <Pressable onPress={() => router.push("/forgot-password")} style={styles.forgotPassword}>
        <Text style={[styles.forgotPasswordText, { color: colors.brand.amber }]}>
          Forgot password?
        </Text>
      </Pressable>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
        <Text style={[styles.dividerText, { color: colors.text.tertiary }]}>or</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border.primary }]} />
      </View>

      <Pressable
        style={[styles.registerButton, { borderColor: colors.border.secondary }]}
        onPress={() => router.push("/register")}
      >
        <Text style={[styles.registerButtonText, { color: colors.text.secondary }]}>
          New to BofferElo?{" "}
          <Text style={{ color: colors.brand.amber, fontWeight: "600" }}>Create an account</Text>
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
    textAlign: "center",
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  fields: {
    marginBottom: Spacing.lg,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: Spacing.xl,
    gap: Spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: Typography.fontSize.sm,
  },
  forgotPassword: {
    alignItems: "flex-end",
    paddingVertical: Spacing.sm,
  },
  forgotPasswordText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
  },
  registerButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  registerButtonText: {
    fontSize: Typography.fontSize.base,
    textAlign: "center",
  },
});
