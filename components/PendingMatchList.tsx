import React, { useState } from 'react';
import { View, Text, ActivityIndicator, TextInput, Pressable, TouchableOpacity, ViewStyle, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { PendingMatch } from '@/lib/apiInteractions';
import { getThemeColors } from '@/constants/theme';
import { useTheme } from '@/contexts/ThemeContext';
import { useOptions } from '@/contexts/OptionsContext';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import RuleSetFilter from '@/components/ui/rule-set-filter';

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

type Props = {
  matches: PendingMatch[];
  loading: boolean;
  style?: ViewStyle;
  onConfirmSelected?: (ids: string[]) => Promise<void>;
  onRejectSelected?: (ids: string[]) => Promise<void>;
};

export default function PendingMatchList({ matches, loading, style, onConfirmSelected, onRejectSelected }: Props) {
  const { options, getRuleSetName } = useOptions();
  const [search, setSearch] = useState('');
  const [ruleSetFilter, setRuleSetFilter] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [pendingAction, setPendingAction] = useState<'confirm' | 'reject' | null>(null);
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isCompact = width < 600;

  const selectable = !!onConfirmSelected || !!onRejectSelected;

  const filtered = matches.filter((m) => {
    const q = search.toLowerCase();
    if (q && !m.winnerName.toLowerCase().includes(q) && !m.loserName.toLowerCase().includes(q) && !m.reporterName.toLowerCase().includes(q)) {
      return false;
    }
    if (ruleSetFilter && m.ruleSetId !== ruleSetFilter) {
      return false;
    }
    return true;
  });

  const allFilteredSelected = filtered.length > 0 && filtered.every((m) => selectedIds.has(m.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.delete(m.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filtered.forEach((m) => next.add(m.id));
        return next;
      });
    }
  };

  const toggleRow = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleConfirm = () => {
    if (!onConfirmSelected || selectedIds.size === 0 || confirming || rejecting) return;
    setPendingAction('confirm');
  };

  const handleReject = () => {
    if (!onRejectSelected || selectedIds.size === 0 || confirming || rejecting) return;
    setPendingAction('reject');
  };

  const handleModalConfirm = async () => {
    setPendingAction(null);
    if (pendingAction === 'confirm' && onConfirmSelected) {
      setConfirming(true);
      try {
        await onConfirmSelected(Array.from(selectedIds));
        setSelectedIds(new Set());
      } finally {
        setConfirming(false);
      }
    } else if (pendingAction === 'reject' && onRejectSelected) {
      setRejecting(true);
      try {
        await onRejectSelected(Array.from(selectedIds));
        setSelectedIds(new Set());
      } finally {
        setRejecting(false);
      }
    }
  };

  const Checkbox = ({ checked }: { checked: boolean }) => (
    <View style={{
      width: 20,
      height: 20,
      borderRadius: 4,
      borderWidth: 2,
      borderColor: checked ? colors.brand.green : colors.border.primary,
      backgroundColor: checked ? colors.brand.green : 'transparent',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 10,
      flexShrink: 0,
    }}>
      {checked && <Text style={{ color: colors.text.white, fontSize: 12, fontWeight: '700', lineHeight: 14 }}>✓</Text>}
    </View>
  );

  return (
    <View style={[{
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 12,
      padding: 16,
      backgroundColor: colors.background.secondary,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center' as const,
    }, style]}>
      {/* Title / search row */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: colors.border.primary,
        paddingBottom: 12,
        marginBottom: 12,
        gap: 8,
      }}>
        {selectable && (
          <TouchableOpacity onPress={toggleSelectAll} activeOpacity={0.7}>
            <Checkbox checked={allFilteredSelected} />
          </TouchableOpacity>
        )}
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '700', color: colors.text.primary }}>
          {'⏳ '}
          <Text style={{ color: colors.brand.amber }}>Pending Matches</Text>
        </Text>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search warrior..."
          placeholderTextColor={colors.text.tertiary}
          style={{
            minHeight: 44,
            paddingHorizontal: 10,
            borderWidth: 1,
            borderColor: colors.border.primary,
            borderRadius: 6,
            fontSize: 13,
            color: colors.text.primary,
            backgroundColor: colors.background.primary,
            minWidth: 160,
          }}
        />
        {options && (
          <RuleSetFilter
            ruleSets={options.rule_sets}
            value={ruleSetFilter}
            onChange={setRuleSetFilter}
            isCompact={isCompact}
            colors={colors}
          />
        )}
        {!!onConfirmSelected && (
          <TouchableOpacity
            onPress={handleConfirm}
            disabled={selectedIds.size === 0 || confirming || rejecting}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 6,
              backgroundColor: selectedIds.size === 0 || confirming || rejecting
                ? colors.border.secondary
                : colors.brand.green,
              opacity: selectedIds.size === 0 || confirming || rejecting ? 0.6 : 1,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            {confirming ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : (
              <Text style={{ color: colors.text.white, fontSize: 13, fontWeight: '700' }}>
                {selectedIds.size > 0 ? `Confirm (${selectedIds.size})` : 'Confirm'}
              </Text>
            )}
          </TouchableOpacity>
        )}
        {!!onRejectSelected && (
          <TouchableOpacity
            onPress={handleReject}
            disabled={selectedIds.size === 0 || confirming || rejecting}
            activeOpacity={0.7}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 6,
              backgroundColor: selectedIds.size === 0 || confirming || rejecting
                ? colors.border.secondary
                : colors.brand.red,
              opacity: selectedIds.size === 0 || confirming || rejecting ? 0.6 : 1,
              minHeight: 44,
              justifyContent: 'center',
            }}
          >
            {rejecting ? (
              <ActivityIndicator size="small" color={colors.text.white} />
            ) : (
              <Text style={{ color: colors.text.white, fontSize: 13, fontWeight: '700' }}>
                {selectedIds.size > 0 ? `Reject (${selectedIds.size})` : 'Reject'}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Column headers */}
      {!loading && filtered.length > 0 && (
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingBottom: 6,
          marginBottom: 4,
        }}>
          {selectable && <View style={{ width: 30 }} />}
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            WINNER
          </Text>
          <Text style={{ width: 28, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
          </Text>
          <Text style={{ flex: 1, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            LOSER
          </Text>
          <Text style={{ width: 80, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            RULESET
          </Text>
          <Text style={{ width: 64, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
            ELO SWING
          </Text>
          <Text style={{ width: 80, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'right' }}>
            REPORTED
          </Text>
        </View>
      )}

      {loading && (
        <ActivityIndicator size="large" color={colors.brand.amber} style={{ marginTop: 32 }} />
      )}

      {!loading && filtered.map((match) => {
        const isSelected = selectedIds.has(match.id);
        return (
          <Pressable
            key={match.id}
            onPress={() => {
              if (selectable) {
                toggleRow(match.id);
              } else {
                router.push({ pathname: '/match/[id]', params: { id: match.id } });
              }
            }}
          >
            {({ pressed }) => (
              <View style={{
                backgroundColor: isSelected ? (isDark ? '#1a2e1a' : '#e8f5e9') : colors.background.secondary,
                borderRadius: 8,
                padding: 12,
                marginBottom: 6,
                borderWidth: 1,
                borderColor: isSelected ? colors.brand.green : colors.border.primary,
                opacity: pressed ? 0.7 : 1,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
                {selectable && <Checkbox checked={isSelected} />}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text.primary, textAlign: 'center' }}>
                      {match.winnerName}
                    </Text>
                    <Text style={{ width: 28, fontSize: 11, fontWeight: '600', color: colors.text.tertiary, textAlign: 'center' }}>
                      vs
                    </Text>
                    <Text style={{ flex: 1, fontSize: 14, fontWeight: '700', color: colors.text.secondary, textAlign: 'center' }}>
                      {match.loserName}
                    </Text>
                    <Text numberOfLines={1} style={{ width: 80, fontSize: 11, color: colors.text.tertiary, textAlign: 'center' }}>
                      {match.ruleSetId ? getRuleSetName(match.ruleSetId) : '—'}
                    </Text>
                    <Text style={{ width: 64, fontSize: 13, fontWeight: '700', color: colors.brand.amber, textAlign: 'center' }}>
                      +{match.eloChange}
                    </Text>
                    <Text style={{ width: 80, fontSize: 12, color: colors.text.tertiary, textAlign: 'right' }}>
                      {timeAgo(match.reportedAt)}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: colors.text.tertiary, marginTop: 4, paddingHorizontal: 4 }}>
                    Reported by {match.reporterName}
                  </Text>
                </View>
              </View>
            )}
          </Pressable>
        );
      })}

      {!loading && filtered.length === 0 && (
        <Text style={{ color: colors.text.tertiary, textAlign: 'center', paddingVertical: 24 }}>
          {search ? 'No matches found.' : 'No pending matches.'}
        </Text>
      )}

      {pendingAction && (
        <ConfirmModal
          visible={true}
          action={pendingAction}
          matchCount={selectedIds.size}
          onCancel={() => setPendingAction(null)}
          onConfirm={handleModalConfirm}
        />
      )}
    </View>
  );
}
