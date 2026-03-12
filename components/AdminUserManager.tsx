import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { getThemeColors, BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { ErrorModal } from '@/components/ui/error-modal';
import { Input } from '@/components/ui/input';
import { useErrorModal } from '@/hooks/useErrorModal';
import {
  UserListEntry,
  adminChangeUsernameFromAPI,
  adminChangeEmailFromAPI,
  adminDeleteUserFromAPI,
} from '@/lib/apiInteractions';

interface Props {
  users: UserListEntry[];
  jwt: string;
  onUserDeleted: (userId: string) => void;
}

export default function AdminUserManager({ users, jwt, onUserDeleted }: Props) {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);

  const [filter, setFilter] = useState('');
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [draftUsername, setDraftUsername] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [usernameOverrides, setUsernameOverrides] = useState<Record<string, string>>({});
  const [savedEmails, setSavedEmails] = useState<Record<string, string>>({});
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [saving, setSaving] = useState<'username' | 'email' | 'delete' | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { modal, showError, hideModal } = useErrorModal();

  const s = styles(colors);

  const filteredUsers = users.filter((u) =>
    (usernameOverrides[u.id] ?? u.username).toLowerCase().includes(filter.toLowerCase())
  );

  const handleToggleExpand = (user: UserListEntry) => {
    if (expandedUserId === user.id) {
      setExpandedUserId(null);
      setConfirmDeleteId(null);
    } else {
      setExpandedUserId(user.id);
      setDraftUsername(usernameOverrides[user.id] ?? user.username);
      setDraftEmail('');
      setUsernameError(null);
      setConfirmDeleteId(null);
    }
  };

  const handleSaveUsername = async (userId: string) => {
    if (!draftUsername.trim()) return;
    setUsernameError(null);
    setSaving('username');
    try {
      const result = await adminChangeUsernameFromAPI(jwt, userId, draftUsername.trim());
      setUsernameOverrides((prev) => ({ ...prev, [userId]: result.username }));
      setDraftUsername(result.username);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to change username.';
      if (msg === 'Username already taken') {
        setUsernameError('Username already taken');
      } else {
        showError('Error', msg);
      }
    } finally {
      setSaving(null);
    }
  };

  const handleSaveEmail = async (userId: string) => {
    if (!draftEmail.trim()) return;
    setSaving('email');
    try {
      const result = await adminChangeEmailFromAPI(jwt, userId, draftEmail.trim());
      setSavedEmails((prev) => ({ ...prev, [userId]: result.email }));
      setDraftEmail('');
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to change email.');
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteConfirm = async (userId: string) => {
    setSaving('delete');
    try {
      await adminDeleteUserFromAPI(jwt, userId);
      onUserDeleted(userId);
      setExpandedUserId(null);
      setConfirmDeleteId(null);
    } catch (err) {
      showError('Error', err instanceof Error ? err.message : 'Failed to delete user.');
      setConfirmDeleteId(null);
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={s.card}>
      <ErrorModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        variant={modal.variant}
        onDismiss={hideModal}
      />

      <Text style={s.cardTitle}>User Management</Text>

      <Input
        placeholder="Filter by username..."
        value={filter}
        onChangeText={setFilter}
        autoCapitalize="none"
      />

      {filteredUsers.length === 0 ? (
        <Text style={s.emptyText}>No users found</Text>
      ) : (
        filteredUsers.map((user) => {
          const displayName = usernameOverrides[user.id] ?? user.username;
          const isExpanded = expandedUserId === user.id;
          const isSavingUsername = saving === 'username' && isExpanded;
          const isSavingEmail = saving === 'email' && isExpanded;
          const isSavingDelete = saving === 'delete' && isExpanded;

          return (
            <View key={user.id} style={s.userBlock}>
              {/* Row header */}
              <View style={s.userRow}>
                <Text style={s.userName}>{displayName}</Text>
                <TouchableOpacity
                  style={[s.editButton, isExpanded && s.editButtonActive]}
                  onPress={() => handleToggleExpand(user)}
                  activeOpacity={0.7}
                >
                  <Text style={[s.editButtonText, isExpanded && s.editButtonTextActive]}>
                    {isExpanded ? 'Close' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Expanded panel */}
              {isExpanded && (
                <View style={s.panel}>
                  {/* Username section */}
                  <Text style={s.sectionLabel}>Username</Text>
                  <Input
                    value={draftUsername}
                    onChangeText={(v) => {
                      setDraftUsername(v);
                      setUsernameError(null);
                    }}
                    autoCapitalize="none"
                    placeholder="New username"
                  />
                  {usernameError && (
                    <Text style={s.inlineError}>{usernameError}</Text>
                  )}
                  <TouchableOpacity
                    style={[s.saveButton, isSavingUsername && s.saveButtonDisabled]}
                    onPress={() => handleSaveUsername(user.id)}
                    disabled={isSavingUsername}
                    activeOpacity={0.8}
                  >
                    {isSavingUsername ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={s.saveButtonText}>Save Username</Text>
                    )}
                  </TouchableOpacity>

                  <View style={s.divider} />

                  {/* Email section */}
                  <Text style={s.sectionLabel}>Email</Text>
                  <Text style={s.emailWarning}>Applied immediately — no confirmation email sent</Text>
                  <Input
                    value={draftEmail}
                    onChangeText={setDraftEmail}
                    autoCapitalize="none"
                    placeholder="New email address"
                  />
                  {savedEmails[user.id] && (
                    <Text style={s.savedEmail}>Current: {savedEmails[user.id]}</Text>
                  )}
                  <TouchableOpacity
                    style={[s.saveButton, isSavingEmail && s.saveButtonDisabled]}
                    onPress={() => handleSaveEmail(user.id)}
                    disabled={isSavingEmail}
                    activeOpacity={0.8}
                  >
                    {isSavingEmail ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <Text style={s.saveButtonText}>Save Email</Text>
                    )}
                  </TouchableOpacity>

                  <View style={s.divider} />

                  {/* Delete section */}
                  {confirmDeleteId === user.id ? (
                    <View style={s.deleteConfirmRow}>
                      <Text style={s.deleteConfirmText}>
                        Delete {displayName}? This cannot be undone.
                      </Text>
                      <View style={s.deleteConfirmButtons}>
                        <TouchableOpacity
                          style={s.cancelButton}
                          onPress={() => setConfirmDeleteId(null)}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.cancelButtonText, { color: colors.text.secondary }]}>
                            Cancel
                          </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[s.deleteButton, isSavingDelete && s.saveButtonDisabled]}
                          onPress={() => handleDeleteConfirm(user.id)}
                          disabled={isSavingDelete}
                          activeOpacity={0.8}
                        >
                          {isSavingDelete ? (
                            <ActivityIndicator color="#fff" size="small" />
                          ) : (
                            <Text style={s.deleteButtonText}>Delete</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={s.deleteButton}
                      onPress={() => setConfirmDeleteId(user.id)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.deleteButtonText}>Delete User</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = (colors: ReturnType<typeof getThemeColors>) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.background.secondary,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: colors.border.primary,
      padding: Spacing.md,
      marginTop: Spacing.lg,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
    },
    cardTitle: {
      fontSize: Typography.fontSize.base,
      fontWeight: Typography.fontWeight.bold,
      color: colors.text.primary,
      marginBottom: Spacing.md,
    },
    emptyText: {
      textAlign: 'center',
      padding: Spacing.md,
      color: colors.text.tertiary,
      fontSize: Typography.fontSize.sm,
    },
    userBlock: {
      borderTopWidth: 1,
      borderTopColor: colors.border.secondary,
    },
    userRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: Spacing.sm,
    },
    userName: {
      fontSize: Typography.fontSize.base,
      color: colors.text.primary,
      flex: 1,
    },
    editButton: {
      paddingHorizontal: Spacing.sm,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
      borderWidth: 1,
      borderColor: colors.border.primary,
    },
    editButtonActive: {
      borderColor: colors.brand.amber,
    },
    editButtonText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.secondary,
    },
    editButtonTextActive: {
      color: colors.brand.amber,
    },
    panel: {
      paddingBottom: Spacing.md,
      paddingTop: Spacing.xs,
    },
    sectionLabel: {
      fontSize: Typography.fontSize.xs,
      fontWeight: Typography.fontWeight.semibold,
      color: colors.text.secondary,
      textTransform: 'uppercase',
      letterSpacing: Typography.letterSpacing.wide,
      marginBottom: Spacing.xs,
      marginTop: Spacing.xs,
    },
    inlineError: {
      fontSize: Typography.fontSize.sm,
      color: colors.brand.red,
      marginTop: -Spacing.xs,
      marginBottom: Spacing.xs,
    },
    saveButton: {
      backgroundColor: colors.brand.amber,
      borderRadius: BorderRadius.md,
      paddingVertical: 10,
      alignItems: 'center',
      marginTop: Spacing.xs,
    },
    saveButtonDisabled: {
      opacity: 0.4,
    },
    saveButtonText: {
      color: '#ffffff',
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border.secondary,
      marginVertical: Spacing.md,
    },
    emailWarning: {
      fontSize: Typography.fontSize.sm,
      color: colors.brand.amber,
      fontStyle: 'italic',
      marginBottom: Spacing.xs,
    },
    savedEmail: {
      fontSize: Typography.fontSize.sm,
      color: colors.text.secondary,
      marginTop: -Spacing.xs,
      marginBottom: Spacing.xs,
    },
    deleteConfirmRow: {
      gap: Spacing.sm,
    },
    deleteConfirmText: {
      fontSize: Typography.fontSize.sm,
      color: colors.text.secondary,
      textAlign: 'center',
    },
    deleteConfirmButtons: {
      flexDirection: 'row',
      gap: Spacing.sm,
    },
    cancelButton: {
      flex: 1,
      height: 40,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: colors.border.primary,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background.primary,
    },
    cancelButtonText: {
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
    deleteButton: {
      flex: 1,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: colors.brand.red,
      alignItems: 'center',
      justifyContent: 'center',
    },
    deleteButtonText: {
      color: '#ffffff',
      fontSize: Typography.fontSize.sm,
      fontWeight: Typography.fontWeight.semibold,
    },
  });
