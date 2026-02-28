import { getThemeColors } from "@/constants/theme";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

function RootLayoutInner() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background.primary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth"
          options={{
            title: "Sign In",
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.background.secondary,
            },
            headerTintColor: colors.text.primary,
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      </Stack>
      <StatusBar style={isDark ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
    </ThemeProvider>
  );
}
