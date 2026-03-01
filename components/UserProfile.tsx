import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserProfileFromAPI, getOptionsFromAPI, updatePreferencesFromAPI, getMyMatchesFromAPI, getUserMatchesFromAPI, UserProfile, OptionsResponse, MyMatchesResponse, UserMatch, Match } from '@/lib/apiInteractions';
import MatchList from '@/components/MatchList';
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

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
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

  const [myMatches, setMyMatches] = useState<MyMatchesResponse | null>(null);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'confirmed' | 'unconfirmed'>('confirmed');

  const [userMatches, setUserMatches] = useState<Match[]>([]);
  const [userMatchesLoading, setUserMatchesLoading] = useState(false);

  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session } = useAuth();
  const router = useRouter();

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

  useEffect(() => {
    if (isOwnProfile && session) {
      setMatchesLoading(true);
      getMyMatchesFromAPI(session.access_token)
        .then(setMyMatches)
        .catch((err) => console.error('[UserProfile] Failed to load matches:', err))
        .finally(() => setMatchesLoading(false));
    }
  }, [isOwnProfile, session]);

  useEffect(() => {
    if (!isOwnProfile) {
      setUserMatchesLoading(true);
      getUserMatchesFromAPI(userId)
        .then((data) => setUserMatches(data.matches))
        .catch((err) => console.error('[UserProfile] Failed to load user matches:', err))
        .finally(() => setUserMatchesLoading(false));
    }
  }, [userId, isOwnProfile]);

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
      {isOwnProfile && (
        <View style={{
          borderWidth: 1,
          borderColor: colors.border.primary,
          borderRadius: 12,
          backgroundColor: colors.background.secondary,
          maxWidth: 640,
          width: '100%',
          alignSelf: 'center',
          marginTop: 16,
          overflow: 'hidden',
        }}>
          {/* Tab bar */}
          <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border.primary }}>
            {(['confirmed', 'unconfirmed'] as const).map((tab) => {
              const active = activeTab === tab;
              const label = tab === 'confirmed' ? 'Confirmed' : 'Pending';
              const count = myMatches ? myMatches[tab].length : null;
              return (
                <Pressable
                  key={tab}
                  onPress={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    alignItems: 'center',
                    borderBottomWidth: 2,
                    borderBottomColor: active ? colors.brand.amber : 'transparent',
                  }}
                >
                  <Text style={{
                    fontSize: Typography.fontSize.sm,
                    fontWeight: Typography.fontWeight.semibold,
                    color: active ? colors.brand.amber : colors.text.tertiary,
                  }}>
                    {label}{count !== null ? ` (${count})` : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Tab content */}
          <View style={{ padding: 12 }}>
            {matchesLoading && (
              <ActivityIndicator size="small" color={colors.brand.amber} style={{ marginVertical: 24 }} />
            )}

            {!matchesLoading && myMatches && (() => {
              const list: UserMatch[] = myMatches[activeTab];
              if (list.length === 0) {
                return (
                  <Text style={{ color: colors.text.tertiary, textAlign: 'center', paddingVertical: 24 }}>
                    {activeTab === 'confirmed' ? 'No confirmed matches yet.' : 'No pending matches.'}
                  </Text>
                );
              }
              return list.map((match) => {
                const isWinner = match.winnerId === userId;
                const opponent = isWinner ? match.loserName : match.winnerName;
                const timestamp = activeTab === 'confirmed' && match.confirmedAt
                  ? timeAgo(match.confirmedAt)
                  : match.reportedAt
                    ? timeAgo(match.reportedAt)
                    : null;
                return (
                  <Pressable
                    key={match.id}
                    onPress={() => router.push(`/match/${match.id}`)}
                  >
                    {({ pressed }) => (
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 6,
                        borderWidth: 1,
                        borderColor: colors.border.primary,
                        backgroundColor: colors.background.primary,
                        opacity: pressed ? 0.7 : 1,
                      }}>
                        {/* Result badge */}
                        <View style={{
                          width: 36,
                          height: 22,
                          borderRadius: 4,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: isWinner ? '#4ade8022' : colors.brand.red + '22',
                          marginRight: 10,
                        }}>
                          <Text style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: isWinner ? '#4ade80' : colors.brand.red,
                          }}>
                            {isWinner ? 'WIN' : 'LOSS'}
                          </Text>
                        </View>

                        {/* Opponent */}
                        <Text style={{ flex: 1, fontSize: 14, fontWeight: '600', color: colors.text.primary }}>
                          vs {opponent}
                        </Text>

                        {/* ELO change */}
                        <Text style={{
                          fontSize: 13,
                          fontWeight: '700',
                          color: isWinner ? '#4ade80' : colors.brand.red,
                          marginRight: 10,
                        }}>
                          {isWinner ? `+${match.eloChange}` : `-${match.eloChange}`}
                        </Text>

                        {/* Timestamp */}
                        {timestamp && (
                          <Text style={{ fontSize: 12, color: colors.text.tertiary, minWidth: 56, textAlign: 'right' }}>
                            {timestamp}
                          </Text>
                        )}
                      </View>
                    )}
                  </Pressable>
                );
              });
            })()}
          </View>
        </View>
      )}
    </>
  );
}
