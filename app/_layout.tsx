import { getThemeColors } from "@/constants/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import AppHeader from "@/components/AppHeader";
import { OptionsProvider } from "@/contexts/OptionsContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AppState, Platform, View } from "react-native";
import React, { useEffect } from "react";
import { supabase } from "@/lib/supabase";

function RootLayoutInner() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    document.title = 'BofferElo';
    const existing = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
    const link = existing ?? document.createElement('link');
    link.rel = 'icon';
    link.type = 'image/svg+xml';
    link.href = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚔️</text></svg>')}`;
    if (!existing) document.head.appendChild(link);
  }, []);

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
        <Stack.Screen name="about" options={{ headerShown: false }} />
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
        <OptionsProvider>
          <ErrorBoundary>
            <RootLayoutInner />
          </ErrorBoundary>
        </OptionsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
