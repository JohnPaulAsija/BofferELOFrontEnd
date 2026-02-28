import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getUserProfileFromAPI, UserProfile } from '@/lib/apiInteractions';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';

type Props = {
  userId: string;
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

function InfoRow({ label, value }: { label: string; value: string }) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.primary,
    }}>
      <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.tertiary }}>{label}</Text>
      <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text.primary }}>{value}</Text>
    </View>
  );
}

export default function UserProfileComponent({ userId }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  useEffect(() => {
    getUserProfileFromAPI(userId)
      .then(setProfile)
      .catch((err) => {
        console.error('[UserProfile] Failed to load profile:', err);
        setError('Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

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
      <Text style={{
        fontSize: 13,
        fontWeight: '700',
        color: colors.text.tertiary,
        letterSpacing: 0.5,
        marginBottom: 4,
      }}>
        PREFERENCES
      </Text>
      <InfoRow label="Gender" value={profile.gender ?? '—'} />
      <InfoRow label="Preferred Game" value={profile.preferredGame ?? '—'} />
      <InfoRow label="Preferred Weapon" value={profile.preferredWeapon ?? '—'} />
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
      }}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text.tertiary }}>Preferred Shield</Text>
        <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text.primary }}>{profile.preferredShield ?? '—'}</Text>
      </View>
    </View>
  );
}
