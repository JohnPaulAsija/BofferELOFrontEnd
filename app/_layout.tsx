import { BofferEloColors } from "@/constants/theme";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";

export default function RootLayout() {
  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: BofferEloColors.background.primary },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="auth"
          options={{
            title: "Sign In",
            headerShown: true,
            headerStyle: {
              backgroundColor: BofferEloColors.background.secondary,
            },
            headerTintColor: BofferEloColors.text.primary,
            headerTitleStyle: {
              fontWeight: "bold",
            },
          }}
        />
      </Stack>
      <StatusBar style="light" />
    </>
  );
}
