import React, { useState, useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import { getOptionsFromAPI, updatePreferencesFromAPI, UserProfile, OptionsResponse } from '@/lib/apiInteractions';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { ErrorModal } from '@/components/ui/error-modal';

type ProfilePreferencesProps = {
  profile: UserProfile;
  isOwnProfile: boolean;
  onProfileUpdate: (updates: Partial<UserProfile>) => void;
};

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

export default function ProfilePreferences({ profile, isOwnProfile, onProfileUpdate }: ProfilePreferencesProps) {
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
    if (isOwnProfile) {
      let cancelled = false;
      getOptionsFromAPI()
        .then((data) => { if (!cancelled) setOptions(data); })
        .catch(() => {});
      return () => { cancelled = true; };
    }
  }, [isOwnProfile]);

  function openEdit() {
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
      onProfileUpdate({
        gender: draftGender,
        preferredGame: draftGame,
        preferredWeapon: draftWeapon,
        preferredShield: draftShield,
      });
      setIsEditing(false);
    } catch (err: any) {
      setModal({ visible: true, title: 'Save Failed', message: err.message || 'Could not save preferences.' });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <ErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant="error"
        onDismiss={() => setModal((m) => ({ ...m, visible: false }))}
      />

      {/* Preferences header */}
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
    </>
  );
}
