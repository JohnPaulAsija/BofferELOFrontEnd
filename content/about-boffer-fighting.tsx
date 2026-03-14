import { getThemeColors, Typography } from "@/constants/theme";
import { useTheme } from "@/contexts/ThemeContext";
import React from "react";
import { Linking, Text } from "react-native";

// ─── Local primitives ─────────────────────────────────────────────────────────

function Para({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <Text
      style={{
        fontSize: Typography.fontSize.base,
        lineHeight: 24,
        color: colors.text.secondary,
      }}
    >
      {children}
    </Text>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontWeight: "700" }}>{children}</Text>;
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <Text
      style={{ color: colors.brand.amber, textDecorationLine: "underline" }}
      onPress={() => Linking.openURL(href).catch(() => {})}
      accessibilityRole="link"
    >
      {children}
    </Text>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────

export function BofferFightingContent() {
  return (
    <>
      <Para>
        <Bold>Boffer fighting</Bold> (also called <Bold>foam fighting</Bold> or
        LARP combat) is a full-contact martial sport in which participants
        strike each other with padded foam weapons. Hits to limbs are treated as
        wounds; hits to the torso end the bout. Weapons are constructed to
        strict padding standards to ensure safety at full speed.
      </Para>

      <Para>
        The practice spans a wide range of communities — from dedicated combat
        sports groups like{" "}
        <Link href="https://www.hearthlightgame.org/">Hearthlight</Link> and{" "}
        <Link href="https://dagorhir.com">Dagorhir</Link>, to broader LARP
        systems where combat is one element of a larger game. Tournaments may be
        singles, team melees, or scenario-based events.
      </Para>

      <Para>
        BofferElo focuses on individual <Bold>1v1 duels</Bold>, making it easy
        to track personal skill progression across informal pickup fights and
        organised events alike.
      </Para>
    </>
  );
}
