import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BofferEloStyles, BofferEloColors } from '@/constants/theme';

// Placeholder icons - you can replace with lucide-react-native if installed
const Sword = ({ style }: any) => <Text style={[{ fontSize: 24 }, style]}>⚔️</Text>;
const Swords = ({ style }: any) => <Text style={[{ fontSize: 16 }, style]}>⚔️</Text>;
const LogIn = ({ style }: any) => <Text style={[{ fontSize: 16 }, style]}>→</Text>;
const LogOut = ({ style }: any) => <Text style={[{ fontSize: 20 }, style]}>←</Text>;
const Bell = ({ style }: any) => <Text style={[{ fontSize: 20 }, style]}>🔔</Text>;
const Crown = ({ style }: any) => <Text style={[{ fontSize: 12 }, style]}>👑</Text>;
const UserCog = ({ style }: any) => <Text style={[{ fontSize: 20 }, style]}>⚙️</Text>;

const styles = BofferEloStyles;

export default function HomeScreen() {
  const router = useRouter();

  // Placeholder states - set to null for logged out, or mock user for logged in
  const [currentUser, setCurrentUser] = useState<any>({
    id: '1',
    name: 'TestUser',
    isAdmin: false,
    isSuperAdmin: true
  }); // Change to null to test logged out state
  const [pendingMatchesCount] = useState(3); // Placeholder count

  const handleRecordMatchClick = () => {
    // Placeholder - will navigate when pages are built
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const handleLogin = () => {
    router.push('/auth');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Custom Header - Fixed at top */}
      <View style={styles.headerContainer}>
        <View style={styles.headerInner}>
          {/* Logo Section */}
          <Pressable style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Sword style={{ transform: [{ rotate: '-45deg' }] }} />
            </View>
            <Text style={styles.logoText}>
              Boffer<Text style={styles.logoAccent}>Elo</Text>
            </Text>
          </Pressable>

          {/* Right Section - Actions */}
          <View style={styles.headerRight}>
            {/* Record Match Button - Hidden on small screens */}
            {Platform.OS !== 'ios' && Platform.OS !== 'android' && (
              <Pressable
                style={[styles.button, styles.primaryButton]}
                onPress={handleRecordMatchClick}
              >
                <Swords />
                <Text style={styles.buttonText}>Record Match</Text>
              </Pressable>
            )}

            {currentUser ? (
              <View style={styles.userSection}>
                <View style={styles.userActions}>
                  {/* Super Admin Button */}
                  {currentUser?.isSuperAdmin && (
                    <Pressable style={styles.iconButton}>
                      <UserCog />
                    </Pressable>
                  )}

                  {/* Pending Matches Notification */}
                  {pendingMatchesCount > 0 && (
                    <View style={styles.notificationButton}>
                      <Bell />
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{pendingMatchesCount}</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.userInfo}>
                  <Pressable style={styles.userNameButton}>
                    <Text style={styles.userName}>{currentUser.name}</Text>
                    {currentUser.isSuperAdmin ? (
                      <Crown style={{ color: BofferEloColors.status.purple }} />
                    ) : currentUser.isAdmin ? (
                      <Crown style={{ color: BofferEloColors.status.amber }} />
                    ) : null}
                  </Pressable>

                  <Pressable style={styles.iconButton} onPress={handleLogout}>
                    <LogOut />
                  </Pressable>
                </View>
              </View>
            ) : (
              <Pressable
                style={[styles.button, styles.outlineButton]}
                onPress={handleLogin}
              >
                <LogIn />
                <Text style={[styles.buttonText, styles.outlineButtonText]}>Sign In</Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>

      {/* Coming Soon Message */}
      <View style={styles.comingSoonContainer}>
        <Text style={styles.comingSoonTitle}>Coming Soon</Text>
        <Text style={styles.comingSoonSubtitle}>BofferElo is under construction</Text>
      </View>
    </View>
  );
}
