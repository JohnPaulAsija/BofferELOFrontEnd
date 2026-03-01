import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { getUserProfileFromAPI, getOptionsFromAPI, updatePreferencesFromAPI, UserProfile, OptionsResponse } from '@/lib/apiInteractions';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';

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

function ChipPicker({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  return (
    <View style={{ marginBottom: Spacing.md }}>
      <Text style={{ fontSize: Typography.fontSize.sm, fontWeight: Typography.fontWeight.semibold, color: colors.text.secondary, marginBottom: Spacing.sm }}>
        {label}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
        {options.map((opt) => {
          const selected = value === opt;
          return (
            <Pressable
              key={opt}
              onPress={() => onSelect(selected ? null : opt)}
              style={{
                borderWidth: 1,
                borderRadius: BorderRadius.full,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.xs,
                borderColor: selected ? colors.brand.amber : colors.border.primary,
                backgroundColor: selected ? colors.brand.amber + '22' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: Typography.fontSize.sm,
                fontWeight: Typography.fontWeight.medium,
                color: selected ? colors.brand.amber : colors.text.secondary,
              }}>
                {opt}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function UserProfileComponent({ userId, isOwnProfile = false }: Props) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [options, setOptions] = useState<OptionsResponse | null>(null);
  const [draftGender, setDraftGender] = useState<string | null>(null);
  const [draftGame, setDraftGame] = useState<string | null>(null);
  const [draftWeapon, setDraftWeapon] = useState<string | null>(null);
  const [draftShield, setDraftShield] = useState<string | null>(null);
  const [modal, setModal] = useState<{ visible: boolean; title: string; message: string }>({
    visible: false, title: '', message: '',
  });

  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session } = useAuth();

  useEffect(() => {
    getUserProfileFromAPI(userId)
      .then(setProfile)
      .catch((err) => {
        console.error('[UserProfile] Failed to load profile:', err);
        setError('Failed to load profile.');
      })
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    if (isOwnProfile) {
      getOptionsFromAPI()
        .then(setOptions)
        .catch(() => {});
    }
  }, [isOwnProfile]);

  function openEdit() {
    if (!profile) return;
    setDraftGender(profile.gender ?? null);
    setDraftGame(profile.preferredGame ?? null);
    setDraftWeapon(profile.preferredWeapon ?? null);
    setDraftShield(profile.preferredShield ?? null);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  async function saveEdit() {
    if (!session) return;
    setSaving(true);
    try {
      await updatePreferencesFromAPI(session.access_token, {
        gender: draftGender,
        preferred_game: draftGame,
        preferred_weapon: draftWeapon,
        preferred_shield: draftShield,
      });
      setProfile((prev) => prev ? {
        ...prev,
        gender: draftGender,
        preferredGame: draftGame,
        preferredWeapon: draftWeapon,
        preferredShield: draftShield,
      } : prev);
      setIsEditing(false);
    } catch (err: any) {
      setModal({ visible: true, title: 'Save Failed', message: err.message || 'Could not save preferences.' });
    } finally {
      setSaving(false);
    }
  }

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
      <ErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant="error"
        onDismiss={() => setModal((m) => ({ ...m, visible: false }))}
      />
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

        {/* Preferences section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <Text style={{
            fontSize: 13,
            fontWeight: '700',
            color: colors.text.tertiary,
            letterSpacing: 0.5,
          }}>
            PREFERENCES
          </Text>
          {isOwnProfile && !isEditing && (
            <Pressable
              onPress={openEdit}
              style={{
                borderWidth: 1,
                borderRadius: BorderRadius.md,
                borderColor: colors.border.secondary,
                paddingHorizontal: Spacing.md,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.text.secondary, fontWeight: Typography.fontWeight.medium }}>
                Edit
              </Text>
            </Pressable>
          )}
        </View>

        {isEditing && options ? (
          <View style={{ marginTop: Spacing.md }}>
            <ChipPicker label="Gender" options={options.genders} value={draftGender} onSelect={setDraftGender} />
            <ChipPicker label="Preferred Game" options={options.games} value={draftGame} onSelect={setDraftGame} />
            <ChipPicker label="Preferred Weapon" options={options.weapons} value={draftWeapon} onSelect={setDraftWeapon} />
            <ChipPicker label="Preferred Shield" options={options.shields} value={draftShield} onSelect={setDraftShield} />
            <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm }}>
              <Pressable
                onPress={saveEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                  alignItems: 'center',
                  backgroundColor: colors.brand.amber,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: '#000', fontWeight: Typography.fontWeight.semibold, fontSize: Typography.fontSize.sm }}>
                  {saving ? 'Saving…' : 'Save'}
                </Text>
              </Pressable>
              <Pressable
                onPress={cancelEdit}
                disabled={saving}
                style={{
                  flex: 1,
                  borderRadius: BorderRadius.md,
                  paddingVertical: Spacing.sm,
                  alignItems: 'center',
                  borderWidth: 1,
                  borderColor: colors.border.secondary,
                }}
              >
                <Text style={{ color: colors.text.secondary, fontWeight: Typography.fontWeight.medium, fontSize: Typography.fontSize.sm }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <>
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
          </>
        )}
      </View>
    </>
  );
}
