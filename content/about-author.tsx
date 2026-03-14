import React from 'react';
import { Linking, Text } from 'react-native';
import { getThemeColors, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

// ─── Local primitives ─────────────────────────────────────────────────────────

function Para({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <Text style={{ fontSize: Typography.fontSize.base, lineHeight: 24, color: colors.text.secondary }}>
      {children}
    </Text>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={{ fontWeight: '700' }}>{children}</Text>;
}

function Link({ href, children }: { href: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <Text
      style={{ color: colors.brand.amber, textDecorationLine: 'underline' }}
      onPress={() => Linking.openURL(href).catch(() => {})}
      accessibilityRole="link"
    >
      {children}
    </Text>
  );
}

// ─── Content ──────────────────────────────────────────────────────────────────
// TODO: Replace the placeholder paragraphs below with your real bio.
// Use <Para> for paragraphs, <Bold> for emphasis, and <Link href="…"> for links.

export function AboutAuthorContent() {
  return (
    <>
      <Para>
        {/* TODO: Write a short paragraph about yourself — your background, how you got into boffer
            fighting, and what inspired you to build BofferElo. */}
        [TODO: Write a short paragraph about yourself — your background, how you got into boffer
        fighting, and what inspired you to build BofferElo.]
      </Para>

      <Para>
        {/* TODO: Add any additional context — the community you fight with, how long you've been
            doing it, or what you hope this tool will do for the boffer scene. */}
        [TODO: Add any additional context — the community you fight with, how long you've been doing
        it, or what you hope this tool will do for the boffer scene.]
      </Para>
    </>
  );
}
