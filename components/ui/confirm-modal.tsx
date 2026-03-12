import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

interface ConfirmModalProps {
  visible: boolean;
  action: 'confirm' | 'reject';
  matchCount: number;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmModal({ visible, action, matchCount, onCancel, onConfirm }: ConfirmModalProps) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const isConfirm = action === 'confirm';
  const accentColor = isConfirm ? colors.brand.green : colors.brand.red;
  const iconSymbol = isConfirm ? '✓' : '✕';
  const title = isConfirm ? 'Confirm Match?' : 'Reject Match?';
  const matchLabel = matchCount === 1 ? '1 match' : `${matchCount} matches`;
  const message = isConfirm
    ? `You are about to confirm ${matchLabel}.`
    : `You are about to reject ${matchLabel}.`;
  const actionLabel = isConfirm ? 'Confirm' : 'Reject';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onCancel}>
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

            {/* Warning */}
            <Text style={[styles.warning, { color: colors.text.tertiary }]}>
              This action cannot be undone.
            </Text>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.border.primary }]} />

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  {
                    borderColor: colors.border.primary,
                    backgroundColor: colors.background.primary,
                    opacity: pressed ? 0.75 : 1,
                  },
                ]}
                onPress={onCancel}
              >
                <Text style={[styles.cancelButtonText, { color: colors.text.secondary }]}>Cancel</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionButton,
                  { backgroundColor: accentColor, opacity: pressed ? 0.85 : 1 },
                ]}
                onPress={onConfirm}
              >
                <Text style={styles.actionButtonText}>{actionLabel}</Text>
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
  warning: {
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    color: '#ffffff',
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    letterSpacing: Typography.letterSpacing.wide,
  },
});
