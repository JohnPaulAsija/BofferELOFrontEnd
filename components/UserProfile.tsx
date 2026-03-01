import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getUserProfileFromAPI, getUserMatchesFromAPI, UserProfile, Match } from '@/lib/apiInteractions';
import MatchList from '@/components/MatchList';
import ProfilePreferences from '@/components/ProfilePreferences';
import MyMatchHistory from '@/components/MyMatchHistory';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  userId: string;
  isOwnProfile?: boolean;
};

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <View style={{
      flex: 1,
      alignItems: 'center',
      backgroundColor: colors.background.primary,
      borderRadius: 8,
      padding: 12,
      borderWidth: 1,
      borderColor: colors.border.primary,
    }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color }}>{value}</Text>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.text.tertiary, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

export default function UserProfileComponent({ userId, isOwnProfile = false }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [userMatchesLoading, setUserMatchesLoading] = useState(false);

  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    let cancelled = false;
    getUserProfileFromAPI(userId)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((err) => {
        if (!cancelled) {
          console.error('[UserProfile] Failed to load profile:', err);
          setError('Failed to load profile.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [userId]);

  useEffect(() => {
    if (!isOwnProfile) {
      let cancelled = false;
      setUserMatchesLoading(true);
      getUserMatchesFromAPI(userId)
        .then((data) => { if (!cancelled) setUserMatches(data.matches); })
        .catch((err) => { if (!cancelled) console.error('[UserProfile] Failed to load user matches:', err); })
        .finally(() => { if (!cancelled) setUserMatchesLoading(false); });
      return () => { cancelled = true; };
    }
  }, [userId, isOwnProfile]);

  const handleProfileUpdate = (updates: Partial<UserProfile>) => {
    setProfile((prev) => prev ? { ...prev, ...updates } : prev);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.brand.amber} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.brand.red, fontSize: 15 }}>{error ?? 'Profile not found.'}</Text>
      </View>
    );
  }

  const totalGames = profile.wins + profile.losses;
  const winRate = totalGames > 0 ? Math.round((profile.wins / totalGames) * 100) : 0;

  return (
    <>
      <View style={{
        borderWidth: 1,
        borderColor: colors.border.primary,
        borderRadius: 12,
        padding: 16,
        backgroundColor: colors.background.secondary,
        maxWidth: 640,
        width: '100%',
        alignSelf: 'center',
      }}>
        {/* Header */}
        <View style={{
          borderBottomWidth: 1,
          borderBottomColor: colors.border.primary,
          paddingBottom: 12,
          marginBottom: 16,
        }}>
          <Text style={{ fontSize: 22, fontWeight: '700', color: colors.text.primary }}>
            {'👤 '}
            <Text style={{ color: colors.brand.amber }}>{profile.username}</Text>
          </Text>
        </View>

        {/* Stat boxes */}
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <StatBox label="ELO" value={String(profile.elo)} color={colors.brand.amber} />
          <StatBox label="WINS" value={String(profile.wins)} color="#4ade80" />
          <StatBox label="LOSSES" value={String(profile.losses)} color={colors.brand.red} />
          <StatBox label="WIN RATE" value={`${winRate}%`} color={colors.text.primary} />
        </View>

        {/* Preferences */}
        <ProfilePreferences
          profile={profile}
          isOwnProfile={isOwnProfile}
          onProfileUpdate={handleProfileUpdate}
        />
      </View>

      {/* Confirmed match history — shown on other users' profiles */}
      {!isOwnProfile && (
        <MatchList
          title="Match History"
          matches={userMatches}
          loading={userMatchesLoading}
          searchable
          style={{ marginTop: 16 }}
          emptyText="No confirmed matches yet."
        />
      )}

      {/* Match history tabs — only shown on own profile */}
      {isOwnProfile && <MyMatchHistory userId={userId} />}
    </>
  );
}
