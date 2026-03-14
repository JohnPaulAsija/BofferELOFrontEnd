import React from 'react';
import { View, Text, Pressable } from 'react-native';

type ThemeColors = {
  text: { primary: string; secondary: string; tertiary: string; white: string };
  background: { primary: string; secondary: string; tertiary: string };
  border: { primary: string; secondary: string };
  brand: { amber: string };
};

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

type Props = {
  page: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  colors: ThemeColors;
  hidePageSize?: boolean;
};

export default function Pagination({ page, totalItems, pageSize, onPageChange, onPageSizeChange, colors, hidePageSize = false }: Props) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border.primary }}>
      {/* Page size selector */}
      {!hidePageSize && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginRight: 4 }}>Show:</Text>
          {PAGE_SIZE_OPTIONS.map((size) => (
            <Pressable
              key={size}
              onPress={() => onPageSizeChange(size)}
              style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 4,
                backgroundColor: size === pageSize ? colors.brand.amber : 'transparent',
                borderWidth: size === pageSize ? 0 : 1,
                borderColor: colors.border.primary,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: size === pageSize ? colors.text.white : colors.text.secondary }}>
                {size}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Page info + navigation */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 12, color: colors.text.tertiary }}>
          {totalItems > 0 ? `${start}-${end} of ${totalItems}` : '0 items'}
        </Text>
        <Pressable
          onPress={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border.primary,
            opacity: page <= 1 ? 0.3 : 1,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary }}>{'<'}</Text>
        </Pressable>
        <Pressable
          onPress={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{
            paddingHorizontal: 8,
            paddingVertical: 4,
            borderRadius: 4,
            borderWidth: 1,
            borderColor: colors.border.primary,
            opacity: page >= totalPages ? 0.3 : 1,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '600', color: colors.text.secondary }}>{'>'}</Text>
        </Pressable>
      </View>
    </View>
  );
}
