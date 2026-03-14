import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  onDismiss: () => void;
  variant?: 'error' | 'info';
  actionLabel?: string;
  onAction?: () => void;
}

export function ErrorModal({
  visible,
  title,
  message,
  onDismiss,
  variant = 'error',
  actionLabel,
  onAction,
}: ErrorModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const accentColor = variant === 'error' ? colors.brand.red : colors.brand.amber;
  const iconSymbol = variant === 'error' ? '✕' : 'i';

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
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          <View style={styles.body}>
            {/* Icon circle */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: accentColor + '20',
                  borderColor: accentColor,
                },
              ]}
            >
              <Text style={[styles.iconText, { color: accentColor }]}>{iconSymbol}</Text>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: colors.text.primary }]}>{title}</Text>

            {/* Message */}
            <Text style={[styles.message, { color: colors.text.secondary }]}>{message}</Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

            {/* Buttons */}
            <View style={[styles.buttonRow, actionLabel ? styles.buttonRowSplit : null]}>
              {actionLabel && onAction && (
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    { borderColor: accentColor, opacity: pressed ? 0.85 : 1 },
                  ]}
                  onPress={onAction}
                >
                  <Text style={[styles.actionButtonText, { color: accentColor }]}>
                    {actionLabel}
                  </Text>
                </Pressable>
              )}
              <Pressable
                style={({ pressed }) => [
                  styles.dismissButton,
                  actionLabel ? styles.dismissButtonFlex : null,
                  { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={onDismiss}
              >
                <Text style={styles.dismissButtonText}>Dismiss</Text>
              </Pressable>
            </View>
          </View>
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
    paddingHorizontal: Spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  body: {
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  iconText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    lineHeight: 24,
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    letterSpacing: Typography.letterSpacing.wide,
  },
  message: {
    fontSize: Typography.fontSize.base,
    textAlign: 'center',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  buttonRow: {
    width: '100%',
  },
  buttonRowSplit: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dismissButton: {
    width: '100%',
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissButtonFlex: {
    width: undefined,
    flex: 1,
  },
  dismissButtonText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
});
