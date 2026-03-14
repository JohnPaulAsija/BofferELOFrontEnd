import React, { useState, useRef } from 'react';
import { View, Text, Pressable, Modal, TouchableOpacity } from 'react-native';
import { RuleSet } from '@/lib/types';

type Props = {
  ruleSets: RuleSet[];
  value: string | null;
  onChange: (id: string | null) => void;
  isCompact: boolean;
  colors: any;
};

export default function RuleSetFilter({ ruleSets, value, onChange, isCompact, colors }: Props) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const triggerRef = useRef<View>(null);

  if (ruleSets.length <= 1) return null;

  const selectedLabel = value
    ? ruleSets.find((rs) => rs.id === value)?.name ?? 'All'
    : 'All';

  if (isCompact) {
    return (
      <>
        <Pressable
          onPress={() => {
            triggerRef.current?.measureInWindow((x, y, width, height) => {
              setAnchor({ x, y, width, height });
              setOpen(true);
            });
          }}
        >
          <View
            ref={triggerRef}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 10,
              paddingVertical: 10,
              minHeight: 44,
              borderWidth: 1,
              borderColor: colors.border.primary,
              borderRadius: 6,
              backgroundColor: colors.background.primary,
              gap: 4,
            }}
          >
            <Text style={{ fontSize: 13, color: colors.brand.amber, fontWeight: '700' }}>
              {selectedLabel}
            </Text>
            <Text style={{ fontSize: 10, color: colors.text.tertiary }}>▼</Text>
          </View>
        </Pressable>

        <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
          <Pressable style={{ flex: 1 }} onPress={() => setOpen(false)}>
            <View
              style={{
                position: 'absolute',
                top: anchor.y + anchor.height + 4,
                left: anchor.x,
                minWidth: anchor.width,
                backgroundColor: colors.background.primary,
                borderWidth: 1,
                borderColor: colors.border.primary,
                borderRadius: 8,
                overflow: 'hidden',
                // shadow
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <DropdownItem
                label="All"
                active={value === null}
                onPress={() => { onChange(null); setOpen(false); }}
                colors={colors}
              />
              {ruleSets.map((rs) => (
                <DropdownItem
                  key={rs.id}
                  label={rs.name}
                  active={value === rs.id}
                  onPress={() => { onChange(rs.id); setOpen(false); }}
                  colors={colors}
                />
              ))}
            </View>
          </Pressable>
        </Modal>
      </>
    );
  }

  // Desktop: segmented buttons
  return (
    <View style={{
      flexDirection: 'row',
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 6,
      backgroundColor: colors.background.primary,
      overflow: 'hidden',
    }}>
      <Pressable
        onPress={() => onChange(null)}
        style={{
          paddingHorizontal: 10,
          paddingVertical: 10,
          minHeight: 44,
          justifyContent: 'center',
          backgroundColor: value === null ? colors.brand.amber + '22' : 'transparent',
        }}
      >
        <Text style={{
          fontSize: 13,
          fontWeight: value === null ? '700' : '400',
          color: value === null ? colors.brand.amber : colors.text.tertiary,
        }}>
          All
        </Text>
      </Pressable>
      {ruleSets.map((rs) => (
        <Pressable
          key={rs.id}
          onPress={() => onChange(rs.id)}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 10,
            minHeight: 44,
            justifyContent: 'center',
            backgroundColor: value === rs.id ? colors.brand.amber + '22' : 'transparent',
          }}
        >
          <Text style={{
            fontSize: 13,
            fontWeight: value === rs.id ? '700' : '400',
            color: value === rs.id ? colors.brand.amber : colors.text.tertiary,
          }}>
            {rs.name}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

function DropdownItem({ label, active, onPress, colors }: {
  label: string;
  active: boolean;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 12,
        backgroundColor: active ? colors.brand.amber + '22' : 'transparent',
      }}
    >
      <Text style={{
        fontSize: 14,
        fontWeight: active ? '700' : '400',
        color: active ? colors.brand.amber : colors.text.primary,
      }}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}
