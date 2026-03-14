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

export function AboutAuthorContent() {
  return (
    <>
      <Para>
        BofferElo was built by <Bold>John Paul Asija</Bold>, a software
        developer, U.S. Navy veteran, and boffer fighter based in Norwalk,
        Connecticut. John Paul enlisted in the Navy at 17 — helming a warship
        before he ever drove a car — and later earned a B.S. in Modeling and
        Simulation Engineering from Old Dominion University, a Master of Liberal
        Arts from St. John's College in Annapolis, and is currently pursuing a
        M.B.A at the University of Connecticut.
      </Para>

      <Para>
        John Paul currently fights with{" "}
        <Link href="https://www.facebook.com/groups/ctbattlegames">
          Citadel Hearthlight (CT Battle Sports)
        </Link>{" "}
        in Connecticut and{" "}
        <Link href="https://www.facebook.com/groups/122324600478">
          NYC Dagorhir (Novi Antiqui)
        </Link>{" "}
        in New York City. Being active across multiple communities showed him
        first-hand how hard it is to track skill progression between different
        groups and events — and that frustration became the motivation behind
        BofferElo.
      </Para>

      <Para>
        The goal of this app is to give fighters a fair, data-driven way to
        measure improvement over time, fuel friendly rivalries, and bring a
        little more structure to the competitive side of the sport. Whether you
        are a seasoned veteran or picking up a foam sword for the first time,
        BofferElo is here to track your journey.
      </Para>
    </>
  );
}
