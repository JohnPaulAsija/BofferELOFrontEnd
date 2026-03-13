import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

const Swords = ({ style }: { style?: object }) => (
  <Text accessible={false} style={[{ fontSize: 16 }, style]}>⚔️</Text>
);

export default function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { session, signOut, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);
  const { height } = useWindowDimensions();

  const navigate = (path: string) => {
    setIsOpen(false);
    router.push(path as never);
  };

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    router.push('/');
  };

  return (
    <>
      <Pressable
        style={({ pressed }) => [
          styles.hamburgerButton,
          { borderColor: colors.border.secondary, opacity: pressed ? 0.7 : 1 },
        ]}
        onPress={() => setIsOpen(true)}
        accessibilityLabel="Open navigation menu"
        accessibilityRole="button"
      >
        <Text style={[styles.hamburgerIcon, { color: colors.text.primary }]}>☰</Text>
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
        statusBarTranslucent
        accessibilityViewIsModal
      >
        <Pressable style={styles.backdrop} onPress={() => setIsOpen(false)}>
          <Pressable
            style={[
              styles.menuPanel,
              {
                maxHeight: height * 0.8,
                backgroundColor: colors.background.secondary,
                borderTopColor: colors.border.primary,
              },
            ]}
            onPress={() => {}}
          >
            {/* Header Row */}
            <View style={styles.menuHeader}>
              <Text style={[styles.menuTitle, { color: colors.text.primary }]}>
                Boffer<Text style={{ color: colors.brand.amber }}>Elo</Text>
              </Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => setIsOpen(false)}
                accessibilityLabel="Close navigation menu"
                accessibilityRole="button"
              >
                <Text style={[styles.closeIcon, { color: colors.text.secondary }]}>✕</Text>
              </Pressable>
            </View>

            <View style={[styles.menuDivider, { backgroundColor: colors.border.primary }]} />

            {/* Record Match — Primary Action */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItemPrimary,
                { backgroundColor: colors.brand.red, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => navigate('/record-match')}
              accessibilityLabel="Record a match"
              accessibilityRole="button"
            >
              <Swords style={{ color: '#ffffff' }} />
              <Text style={styles.menuItemTextPrimary}>Record Match</Text>
            </Pressable>

            {/* My Profile — session only */}
            {session && (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => navigate(`/user/${session.user.id}`)}
                accessibilityLabel="Go to my profile"
                accessibilityRole="button"
              >
                <Text style={[styles.menuItemIcon, { color: colors.text.secondary }]}>👤</Text>
                <Text style={[styles.menuItemText, { color: colors.text.primary }]}>My Profile</Text>
              </Pressable>
            )}

            {/* About */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={() => navigate('/about')}
              accessibilityLabel="About BofferElo"
              accessibilityRole="button"
            >
              <Text style={[styles.menuItemIcon, { color: colors.text.secondary }]}>ℹ</Text>
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>About</Text>
            </Pressable>

            {/* Admin Panel — superAdmin only */}
            {isSuperAdmin && (
              <>
                <View style={[styles.menuDivider, { backgroundColor: colors.border.primary }]} />
                <Pressable
                  style={({ pressed }) => [
                    styles.menuItem,
                    { opacity: pressed ? 0.7 : 1 },
                  ]}
                  onPress={() => navigate('/admin')}
                  accessibilityLabel="Open admin panel"
                  accessibilityRole="button"
                >
                  <Text style={[styles.menuItemIcon, { color: colors.brand.amber }]}>⚙</Text>
                  <Text style={[styles.menuItemText, { color: colors.brand.amber }]}>Admin Panel</Text>
                </Pressable>
              </>
            )}

            <View style={[styles.menuDivider, { backgroundColor: colors.border.primary }]} />

            {/* Theme Toggle */}
            <Pressable
              style={({ pressed }) => [
                styles.menuItem,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              onPress={toggleTheme}
              accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              accessibilityRole="button"
            >
              <Text style={[styles.menuItemIcon, { color: colors.text.secondary }]}>
                {isDark ? '☀' : '☾'}
              </Text>
              <Text style={[styles.menuItemText, { color: colors.text.primary }]}>
                {isDark ? 'Switch to Light' : 'Switch to Dark'}
              </Text>
            </Pressable>

            {/* Sign In / Sign Out */}
            {session ? (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={handleSignOut}
                accessibilityLabel="Sign out"
                accessibilityRole="button"
              >
                <Text style={[styles.menuItemIcon, { color: colors.brand.amber }]}>←</Text>
                <Text style={[styles.menuItemText, { color: colors.brand.amber }]}>Sign Out</Text>
              </Pressable>
            ) : (
              <Pressable
                style={({ pressed }) => [
                  styles.menuItem,
                  { opacity: pressed ? 0.7 : 1 },
                ]}
                onPress={() => navigate('/auth')}
                accessibilityLabel="Sign in"
                accessibilityRole="button"
              >
                <Text style={[styles.menuItemIcon, { color: colors.brand.amber }]}>→</Text>
                <Text style={[styles.menuItemText, { color: colors.brand.amber }]}>Sign In</Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  hamburgerButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  hamburgerIcon: {
    fontSize: Typography.fontSize.xl,
    lineHeight: 24,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  menuPanel: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    borderTopWidth: 1,
    paddingBottom: Spacing.xl,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
  },
  menuTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    letterSpacing: Typography.letterSpacing.wide,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  closeIcon: {
    fontSize: Typography.fontSize.xl,
    lineHeight: 24,
  },
  menuDivider: {
    height: 1,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    minHeight: 52,
  },
  menuItemPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginVertical: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    minHeight: 52,
  },
  menuItemIcon: {
    fontSize: Typography.fontSize.xl,
    width: 28,
    textAlign: 'center',
  },
  menuItemText: {
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.medium,
  },
  menuItemTextPrimary: {
    color: '#ffffff',
    fontSize: Typography.fontSize.md,
    fontWeight: Typography.fontWeight.semibold,
  },
});
