import { getThemeColors } from "@/constants/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import AppHeader from "@/components/AppHeader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppState, View } from "react-native";
import React, { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function RootLayoutInner() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        router.replace("/reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }, [router]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <AppHeader />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="record-match" options={{ headerShown: false }} />
<Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="match/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
        <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </View>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <RootLayoutInner />
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}
