import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { getUserProfileFromAPI, getUserMatchesFromAPI, changeUsernameFromAPI, changeEmailFromAPI, deleteAccountFromAPI, UserProfile, Match } from '@/lib/apiInteractions';
import MatchList from '@/components/MatchList';
import ProfilePreferences from '@/components/ProfilePreferences';
import MyMatchHistory from '@/components/MyMatchHistory';
import { Input } from '@/components/ui/input';
import { useErrorModal } from '@/hooks/useErrorModal';
import { getThemeColors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

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

  // Username editing
  const [editingUsername, setEditingUsername] = useState(false);
  const [draftUsername, setDraftUsername] = useState('');
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [savingUsername, setSavingUsername] = useState(false);

  // Email editing
  const [editingEmail, setEditingEmail] = useState(false);
  const [draftEmail, setDraftEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [savingEmail, setSavingEmail] = useState(false);

  // Delete account
  const [showDeletePanel, setShowDeletePanel] = useState(false);
  const [deleteText, setDeleteText] = useState('');
  const [deletePending, setDeletePending] = useState(false);

  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { session, signOut } = useAuth();
  const { modal, showError, showInfo } = useErrorModal();
  const router = useRouter();

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

  async function saveUsername() {
    const trimmed = draftUsername.trim();
    if (!/^[a-zA-Z0-9_-]{3,24}$/.test(trimmed)) {
      setUsernameError('Username must be 3–24 characters: letters, numbers, _ or -');
      return;
    }
    setUsernameError(null);
    setSavingUsername(true);
    try {
      const jwt = session?.access_token;
      if (!jwt) return;
      await changeUsernameFromAPI(jwt, trimmed);
      setProfile((prev) => prev ? { ...prev, username: trimmed } : prev);
      setEditingUsername(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change username.';
      if (msg === 'Username already taken') {
        setUsernameError('Username already taken');
      } else {
        showError('Error', msg);
      }
    } finally {
      setSavingUsername(false);
    }
  }

  async function saveEmail() {
    const trimmed = draftEmail.trim();
    setEmailError(null);
    setSavingEmail(true);
    try {
      const jwt = session?.access_token;
      if (!jwt) return;
      const result = await changeEmailFromAPI(jwt, trimmed);
      showInfo('Email Change Requested', result.message);
      setEditingEmail(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change email.';
      if (msg === 'Invalid email address') {
        setEmailError('Invalid email address');
      } else {
        showError('Error', msg);
      }
    } finally {
      setSavingEmail(false);
    }
  }

  async function confirmDelete() {
    const jwt = session?.access_token;
    if (!jwt) return;
    setDeletePending(true);
    try {
      await deleteAccountFromAPI(jwt);
      await signOut();
      router.replace('/auth');
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to delete account.');
      setDeletePending(false);
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
      {modal}
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

        {/* Account section — own profile only */}
        {isOwnProfile && (
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: colors.border.primary, paddingTop: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text.tertiary, letterSpacing: 1, marginBottom: 12 }}>ACCOUNT</Text>

            {/* Username row */}
            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.text.secondary }}>Username</Text>
                {!editingUsername && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.text.primary }}>{profile.username}</Text>
                    <TouchableOpacity onPress={() => { setDraftUsername(profile.username); setUsernameError(null); setEditingUsername(true); }}>
                      <Text style={{ fontSize: 13, color: colors.brand.amber }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {editingUsername && (
                <View style={{ marginTop: 8 }}>
                  <Input
                    value={draftUsername}
                    onChangeText={setDraftUsername}
                    autoCapitalize="none"
                  />
                  {usernameError && (
                    <Text style={{ fontSize: 12, color: colors.brand.red, marginTop: 4 }}>{usernameError}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={saveUsername}
                      disabled={savingUsername}
                      style={{ backgroundColor: colors.brand.amber, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, opacity: savingUsername ? 0.6 : 1 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#000' }}>{savingUsername ? 'Saving…' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEditingUsername(false); setUsernameError(null); }} disabled={savingUsername}>
                      <Text style={{ fontSize: 13, color: colors.text.secondary, paddingVertical: 6 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Email row */}
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 13, color: colors.text.secondary }}>Email</Text>
                {!editingEmail && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 14, color: colors.text.primary }}>{session?.user.email ?? ''}</Text>
                    <TouchableOpacity onPress={() => { setDraftEmail(session?.user.email ?? ''); setEmailError(null); setEditingEmail(true); }}>
                      <Text style={{ fontSize: 13, color: colors.brand.amber }}>Edit</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {editingEmail && (
                <View style={{ marginTop: 8 }}>
                  <Input
                    value={draftEmail}
                    onChangeText={setDraftEmail}
                    autoCapitalize="none"
                  />
                  <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 4 }}>
                    Applied after you confirm via email — no immediate change.
                  </Text>
                  {emailError && (
                    <Text style={{ fontSize: 12, color: colors.brand.red, marginTop: 4 }}>{emailError}</Text>
                  )}
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity
                      onPress={saveEmail}
                      disabled={savingEmail}
                      style={{ backgroundColor: colors.brand.amber, borderRadius: 6, paddingVertical: 6, paddingHorizontal: 14, opacity: savingEmail ? 0.6 : 1 }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '600', color: '#000' }}>{savingEmail ? 'Saving…' : 'Save'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => { setEditingEmail(false); setEmailError(null); }} disabled={savingEmail}>
                      <Text style={{ fontSize: 13, color: colors.text.secondary, paddingVertical: 6 }}>Cancel</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Danger Zone — own profile only */}
        {isOwnProfile && (
          <View style={{
            marginTop: 16,
            borderWidth: 1,
            borderColor: colors.brand.red,
            borderRadius: 8,
            padding: 12,
          }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.brand.red, letterSpacing: 1, marginBottom: 10 }}>DANGER ZONE</Text>
            {!showDeletePanel ? (
              <TouchableOpacity
                onPress={() => { setDeleteText(''); setShowDeletePanel(true); }}
                style={{ backgroundColor: colors.brand.red, borderRadius: 6, paddingVertical: 8, paddingHorizontal: 14, alignSelf: 'flex-start' }}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>Delete Account</Text>
              </TouchableOpacity>
            ) : (
              <View>
                <Text style={{ fontSize: 13, color: colors.text.secondary, marginBottom: 10 }}>
                  This is permanent. Your match history will be preserved under a [deleted] account.
                </Text>
                <Input
                  value={deleteText}
                  onChangeText={setDeleteText}
                  placeholder="Type your username to confirm"
                  autoCapitalize="none"
                />
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={confirmDelete}
                    disabled={deleteText !== profile.username || deletePending}
                    style={{
                      backgroundColor: colors.brand.red,
                      borderRadius: 6,
                      paddingVertical: 8,
                      paddingHorizontal: 14,
                      opacity: (deleteText !== profile.username || deletePending) ? 0.4 : 1,
                    }}
                  >
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#fff' }}>{deletePending ? 'Deleting…' : 'Delete Account'}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setShowDeletePanel(false); setDeleteText(''); }} disabled={deletePending}>
                    <Text style={{ fontSize: 13, color: colors.text.secondary }}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
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
      {isOwnProfile && <MyMatchHistory userId={userId} />}
    </>
  );
}
