import React from 'react';
import { View, Text, Pressable, StyleProp, TextStyle, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import HamburgerMenu from './HamburgerMenu';

// Placeholder icons - you can replace with lucide-react-native if installed
const Sword = ({ style }: { style?: StyleProp<TextStyle> }) => <Text accessible={false} style={[{ fontSize: 24 }, style]}>⚔️</Text>;
const Swords = ({ style }: { style?: StyleProp<TextStyle> }) => <Text accessible={false} style={[{ fontSize: 16 }, style]}>⚔️</Text>;
const LogIn = ({ style }: { style?: StyleProp<TextStyle> }) => <Text accessible={false} style={[{ fontSize: 16 }, style]}>→</Text>;
const LogOut = ({ style }: { style?: StyleProp<TextStyle> }) => <Text accessible={false} style={[{ fontSize: 20 }, style]}>←</Text>;

const styles = BofferEloStyles;

export default function AppHeader() {
  const router = useRouter();
  const { session, signOut, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);
  const { width } = useWindowDimensions();
  const isCompact = width < 600;

  const handleRecordMatchClick = () => {
    router.push('/record-match');
  };

  const handleLogin = () => {
    router.push('/auth');
  };

  return (
    <View style={[
      styles.headerContainer,
      { backgroundColor: colors.background.secondary, borderBottomColor: colors.border.primary },
    ]}>
      <View style={styles.headerInner}>
        {/* Logo Section */}
        <Pressable
          style={styles.logoSection}
          onPress={() => router.push('/')}
          accessibilityLabel="BofferElo — go to home"
          accessibilityRole="button"
        >
          <View style={[styles.logoIcon, { backgroundColor: colors.brand.amber }]}>
            <Sword style={{ transform: [{ rotate: '-45deg' }] }} />
          </View>
          <Text style={[styles.logoText, { color: colors.text.primary }]}>
            Boffer<Text style={[styles.logoAccent, { color: colors.brand.amber }]}>Elo</Text>
          </Text>
        </Pressable>

        {isCompact ? (
          /* Compact: hamburger menu only */
          <HamburgerMenu />
        ) : (
          /* Desktop: full header buttons */
          <>
            {/* Admin Panel Button - left of right section, superAdmin only */}
            {isSuperAdmin && (
              <Pressable
                style={[styles.button, styles.outlineButton, { borderColor: colors.brand.amber }]}
                onPress={() => router.push('/admin')}
              >
                <Text style={[styles.buttonText, { color: colors.brand.amber }]}>Admin Panel</Text>
              </Pressable>
            )}

            {/* Right Section - Actions */}
            <View style={styles.headerRight}>
              {/* Record Match Button - only when logged in */}
              {session && (
                <Pressable
                  style={[styles.button, styles.primaryButton]}
                  onPress={handleRecordMatchClick}
                  accessibilityLabel="Record a match"
                  accessibilityRole="button"
                >
                  <Swords />
                  <Text style={styles.buttonText}>Record Match</Text>
                </Pressable>
              )}

              {/* My Profile Button - only when logged in */}
              {session && (
                <Pressable
                  style={[styles.button, styles.outlineButton, { borderColor: colors.border.secondary }]}
                  onPress={() => router.push(`/user/${session.user.id}`)}
                  accessibilityLabel="My profile"
                  accessibilityRole="button"
                >
                  <Text style={[styles.buttonText, { color: colors.text.secondary }]}>My Profile</Text>
                </Pressable>
              )}

              {/* About */}
              <Pressable
                style={[styles.button, styles.outlineButton, { borderColor: colors.border.secondary }]}
                onPress={() => router.push('/about')}
                accessibilityLabel="About BofferElo"
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, { color: colors.text.secondary }]}>About</Text>
              </Pressable>

              {/* Theme Toggle */}
              <Pressable
                style={[styles.button, styles.outlineButton, { borderColor: colors.border.secondary }]}
                onPress={toggleTheme}
                accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                accessibilityRole="button"
              >
                <Text style={[styles.buttonText, { color: colors.text.secondary }]}>
                  {isDark ? '☀ Light' : '☾ Dark'}
                </Text>
              </Pressable>

              {session ? (
                <Pressable
                  style={[styles.button, styles.outlineButton, { borderColor: colors.brand.amber }]}
                  onPress={signOut}
                  accessibilityLabel="Sign out"
                  accessibilityRole="button"
                >
                  <LogOut />
                  <Text style={[styles.buttonText, styles.outlineButtonText, { color: colors.brand.amber }]}>Sign Out</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.button, styles.outlineButton, { borderColor: colors.brand.amber }]}
                  onPress={handleLogin}
                  accessibilityLabel="Sign in"
                  accessibilityRole="button"
                >
                  <LogIn />
                  <Text style={[styles.buttonText, styles.outlineButtonText, { color: colors.brand.amber }]}>Sign In</Text>
                </Pressable>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
}
