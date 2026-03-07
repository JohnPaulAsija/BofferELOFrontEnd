import React from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface TermsModalProps {
  visible: boolean;
  onDismiss: () => void;
}

const TERMS_TEXT = `BofferElo Terms and Conditions

1. BETA STATUS AND WARRANTY DISCLAIMER
This software is currently in BETA. BofferElo is provided as-is without warranties of any kind, express or implied. We do not guarantee that the software will be error-free, uninterrupted, or suitable for any particular purpose.

2. DATA STORAGE AND PRIVACY
- Your account data (email and password) is stored securely via Supabase
- Your username is permanent and publicly visible
- Match reports, ELO ratings, win/loss records, and any optional profile details (gender, preferred game, weapon, and shield) are public and permanently recorded
- Confirmed matches cannot be removed or deleted

3. YOUR RESPONSIBILITIES
- You will only report matches that you personally participated in
- You agree not to use this software for any nefarious purpose
- You agree not to use this software to harass, threaten, or harm other users
- You are responsible for maintaining the confidentiality of your account credentials

4. INFRASTRUCTURE
Your account is hosted on Google Cloud infrastructure.

5. CONDUCT AND ACCEPTABLE USE
You agree to use BofferElo in compliance with all applicable laws and regulations. Any violation of these terms may result in account suspension or termination.`;

export function TermsModal({ visible, onDismiss }: TermsModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.background.secondary,
              borderColor: colors.border.primary,
            },
          ]}
          onPress={() => {}}
        >
          {/* Top accent bar */}
          <View style={[styles.accentBar, { backgroundColor: colors.brand.amber }]} />

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Terms and Conditions
            </Text>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.scrollContent}
            contentContainerStyle={styles.scrollContentInner}
            showsVerticalScrollIndicator={true}
          >
            <Text style={[styles.termsText, { color: colors.text.secondary }]}>
              {TERMS_TEXT}
            </Text>
          </ScrollView>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

          {/* Close button */}
          <Pressable
            style={({ pressed }) => [
              styles.closeButton,
              { backgroundColor: colors.brand.amber, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={onDismiss}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContentInner: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  termsText: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  closeButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    margin: Spacing.lg,
    borderRadius: BorderRadius.md,
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
});
