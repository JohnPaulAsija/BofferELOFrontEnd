import React from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, getThemeColors } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

// Placeholder icons - you can replace with lucide-react-native if installed
const Sword = ({ style }: any) => <Text style={[{ fontSize: 24 }, style]}>⚔️</Text>;
const Swords = ({ style }: any) => <Text style={[{ fontSize: 16 }, style]}>⚔️</Text>;
const LogIn = ({ style }: any) => <Text style={[{ fontSize: 16 }, style]}>→</Text>;
const LogOut = ({ style }: any) => <Text style={[{ fontSize: 20 }, style]}>←</Text>;

const styles = BofferEloStyles;

export default function AppHeader() {
  const router = useRouter();
  const { session, signOut, isSuperAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const colors = getThemeColors(isDark);

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
        <Pressable style={styles.logoSection} onPress={() => router.push('/')}>
          <View style={[styles.logoIcon, { backgroundColor: colors.brand.amber }]}>
            <Sword style={{ transform: [{ rotate: '-45deg' }] }} />
          </View>
          <Text style={[styles.logoText, { color: colors.text.primary }]}>
            Boffer<Text style={[styles.logoAccent, { color: colors.brand.amber }]}>Elo</Text>
          </Text>
        </Pressable>

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
          {/* Record Match Button - Hidden on mobile, only when logged in */}
          {session && Platform.OS !== 'ios' && Platform.OS !== 'android' && (
            <Pressable
              style={[styles.button, styles.primaryButton]}
              onPress={handleRecordMatchClick}
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
            >
              <Text style={[styles.buttonText, { color: colors.text.secondary }]}>My Profile</Text>
            </Pressable>
          )}

          {/* Theme Toggle */}
          <Pressable
            style={[styles.button, styles.outlineButton, { borderColor: colors.border.secondary }]}
            onPress={toggleTheme}
          >
            <Text style={[styles.buttonText, { color: colors.text.secondary }]}>
              {isDark ? '☀ Light' : '☾ Dark'}
            </Text>
          </Pressable>

          {session ? (
            <Pressable
              style={[styles.button, styles.outlineButton, { borderColor: colors.brand.amber }]}
              onPress={signOut}
            >
              <LogOut />
              <Text style={[styles.buttonText, styles.outlineButtonText, { color: colors.brand.amber }]}>Sign Out</Text>
            </Pressable>
          ) : (
            <Pressable
              style={[styles.button, styles.outlineButton, { borderColor: colors.brand.amber }]}
              onPress={handleLogin}
            >
              <LogIn />
              <Text style={[styles.buttonText, styles.outlineButtonText, { color: colors.brand.amber }]}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}
