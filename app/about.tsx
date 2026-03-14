import React, { useEffect, useState } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BofferEloStyles, BorderRadius, getThemeColors, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { getBackendVersionFromAPI } from '@/lib/apiInteractions';
import { TermsModal } from '@/components/ui/terms-modal';
// Frontend version is the authoritative source of truth for the app release
import { version as APP_VERSION } from '../package.json';
import { BofferFightingContent } from '@/content/about-boffer-fighting';
import { AboutAuthorContent } from '@/content/about-author';

// TODO: Replace with actual repository URLs once repos are public
const FRONTEND_GITHUB_URL = 'https://github.com/TODO/bofferelo-frontend';
const BACKEND_GITHUB_URL = 'https://github.com/TODO/bofferelo-backend';

// ─── Section component ────────────────────────────────────────────────────────

function Section({
  title,
  accentColor,
  children,
  colors,
}: {
  title: string;
  accentColor: string;
  children: React.ReactNode;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <View style={[styles.section, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}>
      <View style={[styles.sectionAccent, { backgroundColor: accentColor }]} />
      <View style={styles.sectionBody}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>{title}</Text>
        {children}
      </View>
    </View>
  );
}

function BodyText({ children, colors }: { children: React.ReactNode; colors: ReturnType<typeof getThemeColors> }) {
  return <Text style={[styles.bodyText, { color: colors.text.secondary }]}>{children}</Text>;
}

function LinkButton({
  label,
  onPress,
  colors,
}: {
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof getThemeColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.linkButton, { borderColor: colors.brand.amber }]}
      onPress={onPress}
      accessibilityRole="link"
    >
      <Text style={[styles.linkButtonText, { color: colors.brand.amber }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AboutScreen() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const [backendVersion, setBackendVersion] = useState<string | null>(null);
  const [versionError, setVersionError] = useState(false);
  const [termsVisible, setTermsVisible] = useState(false);

  useEffect(() => {
    getBackendVersionFromAPI()
      .then((res) => setBackendVersion(res.version))
      .catch(() => setVersionError(true));
  }, []);

  const openUrl = (url: string) => Linking.openURL(url).catch(() => {});

  return (
    <>
      <ScrollView
        style={[BofferEloStyles.stackContent, { backgroundColor: colors.background.primary }]}
        contentContainerStyle={styles.container}
      >
        {/* ── Page header ── */}
        <Text style={[styles.pageTitle, { color: colors.text.primary }]}>About BofferElo</Text>
        <Text style={[styles.pageSubtitle, { color: colors.text.secondary }]}>
          Everything you need to know about this app
        </Text>

        {/* ── Versions & Links ── */}
        <Section title="App Info" accentColor={colors.brand.amber} colors={colors}>
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: colors.text.tertiary }]}>Frontend</Text>
            <Text style={[styles.versionValue, { color: colors.text.primary }]}>v{APP_VERSION}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />
          <View style={styles.versionRow}>
            <Text style={[styles.versionLabel, { color: colors.text.tertiary }]}>Backend</Text>
            <Text style={[styles.versionValue, { color: colors.text.primary }]}>
              {versionError ? 'Unavailable' : backendVersion ? `v${backendVersion}` : 'Loading…'}
            </Text>
          </View>
          <View style={styles.linkRow}>
            <LinkButton label="Terms & Conditions" onPress={() => setTermsVisible(true)} colors={colors} />
            <LinkButton label="Frontend on GitHub" onPress={() => openUrl(FRONTEND_GITHUB_URL)} colors={colors} />
            <LinkButton label="Backend on GitHub" onPress={() => openUrl(BACKEND_GITHUB_URL)} colors={colors} />
          </View>
        </Section>

        {/* ── ELO ── */}
        <Section title="How ELO Works" accentColor={colors.brand.red} colors={colors}>
          <BodyText colors={colors}>
            ELO is a method for calculating the relative skill levels of players in zero-sum games like chess —
            and boffer combat. Every player starts with a baseline rating (1000). After each confirmed match,
            points transfer from the loser to the winner.
          </BodyText>
          <BodyText colors={colors}>
            The amount transferred depends on the expected outcome. Beating a much stronger opponent earns
            more points than beating a weaker one; losing to a weaker opponent costs more. The formula:
          </BodyText>
          <View style={[styles.formulaBox, { backgroundColor: colors.background.tertiary, borderColor: colors.border.secondary }]}>
            <Text style={[styles.formulaText, { color: colors.brand.amber }]}>
              Expected = 1 / (1 + 10^((opponentRating − yourRating) / 400)){'\n\n'}
              NewRating = OldRating + K × (Actual − Expected)
            </Text>
            <Text style={[styles.formulaNote, { color: colors.text.tertiary }]}>
              K = 32 (sensitivity factor). Actual = 1 for a win, 0 for a loss.
            </Text>
          </View>
          <BodyText colors={colors}>
            This means a single upset victory can shift ratings significantly, while expected results cause
            only modest changes — keeping the ladder accurate as skill levels evolve.
          </BodyText>
        </Section>

        {/* ── Boffer fighting ── */}
        <Section title="What is Boffer Fighting?" accentColor={colors.brand.orange} colors={colors}>
          <BofferFightingContent />
        </Section>

        {/* ── About the Author ── */}
        <Section title="About the Author" accentColor={colors.brand.green} colors={colors}>
          <AboutAuthorContent />
        </Section>

        <Text style={[styles.footer, { color: colors.text.tertiary }]}>
          BofferElo v{APP_VERSION} · {new Date().getFullYear()}
        </Text>
      </ScrollView>

      <TermsModal visible={termsVisible} onDismiss={() => setTermsVisible(false)} />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.lg,
  },
  pageTitle: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },
  pageSubtitle: {
    fontSize: Typography.fontSize.base,
    marginBottom: Spacing.sm,
  },

  // Section
  section: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionAccent: {
    height: 4,
  },
  sectionBody: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    marginBottom: Spacing.xs,
  },

  // Body text
  bodyText: {
    fontSize: Typography.fontSize.base,
    lineHeight: 24,
  },

  // Version rows
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  versionLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  versionValue: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
  },

  // Link buttons
  linkRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  linkButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  linkButtonText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },

  // Formula box
  formulaBox: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  formulaText: {
    fontFamily: 'monospace',
    fontSize: Typography.fontSize.sm,
    lineHeight: 22,
  },
  formulaNote: {
    fontSize: Typography.fontSize.xs,
  },

  // Footer
  footer: {
    textAlign: 'center',
    fontSize: Typography.fontSize.xs,
    marginTop: Spacing.md,
  },
});
