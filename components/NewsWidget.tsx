import React, { useRef, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  Linking,
  Pressable,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/theme';

type NewsItem = {
  date: string;
  title: string;
  body: string;
  link?: { url: string; label: string };
};

const NEWS_ITEMS: NewsItem[] = [
  {
    date: '2026-03-17',
    title: '🎉 BofferElo Beta is Live!',
    body: 'We\'ve soft-launched BofferElo to beta! Track your ELO, record matches, and climb the leaderboard. Check out the new Share button on your profile to show off your stats.\n\nFound a bug or have a feature idea? Join our Discord — we have dedicated channels for both.',
    link: { url: 'https://discord.gg/UnZV9acrfz', label: 'Join the Discord →' },
  },
];

const COMPACT_BREAKPOINT = 600;

function ContentItems({ items, colors }: { items: NewsItem[]; colors: ReturnType<typeof getThemeColors> }) {
  return (
    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
      {items.map((item, i) => (
        <View key={i}>
          {i > 0 && (
            <View style={{
              height: 1,
              backgroundColor: colors.border.primary,
              marginVertical: 12,
            }} />
          )}
          <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 2 }}>
            {item.title}
          </Text>
          <Text style={{ fontSize: 12, color: colors.text.tertiary, marginBottom: 6 }}>
            {item.date}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text.secondary, lineHeight: 20 }}>
            {item.body}
          </Text>
          {item.link && (
            <Pressable onPress={() => Linking.openURL(item.link!.url)} style={{ marginTop: 8 }}>
              <Text style={{ fontSize: 14, color: colors.brand.amber, fontWeight: '600' }}>
                {item.link.label}
              </Text>
            </Pressable>
          )}
        </View>
      ))}
    </View>
  );
}

export default function NewsWidget() {
  const { isDark } = useTheme();
  const colors = getThemeColors(isDark);
  const { width } = useWindowDimensions();
  const isCompact = width < COMPACT_BREAKPOINT;

  // Note: open and animation values are seeded at mount time; viewport resizes
  // across the breakpoint on web will not reset these (native-only is unaffected).
  const [open, setOpen] = useState(!isCompact);
  const contentHeight = useRef(0);
  const animatedHeight = useRef(new Animated.Value(!isCompact ? 1 : 0)).current;
  const animatedRotation = useRef(new Animated.Value(!isCompact ? 1 : 0)).current;
  const [measured, setMeasured] = useState(false);

  const toggle = () => {
    const toValue = open ? 0 : 1;
    setOpen(o => !o);
    Animated.timing(animatedHeight, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
    Animated.timing(animatedRotation, {
      toValue,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleContentLayout = (e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && !measured) {
      contentHeight.current = h;
      setMeasured(true);
      if (!isCompact) animatedHeight.setValue(1);
    }
  };

  const animatedHeightStyle = measured
    ? { height: animatedHeight.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight.current] }) }
    : {};

  const chevronRotation = animatedRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={{
      borderWidth: 1,
      borderColor: colors.border.primary,
      borderRadius: 12,
      backgroundColor: colors.background.secondary,
      maxWidth: 640,
      width: '100%',
      alignSelf: 'center',
      marginBottom: 16,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <Pressable
        onPress={toggle}
        style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}
      >
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '700', color: colors.text.primary }}>
          {'📣 '}
          <Text style={{ color: colors.brand.amber }}>News & Updates</Text>
        </Text>
        <Animated.Text style={{ fontSize: 14, color: colors.text.tertiary, transform: [{ rotate: chevronRotation }] }}>
          ▼
        </Animated.Text>
      </Pressable>

      {/* Measurement view — invisible, used to capture natural content height */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', opacity: 0 }}
        onLayout={handleContentLayout}
      >
        <ContentItems items={NEWS_ITEMS} colors={colors} />
      </View>

      {/* Animated content area */}
      <Animated.View style={[{ overflow: 'hidden' }, animatedHeightStyle]}>
        <ContentItems items={NEWS_ITEMS} colors={colors} />
      </Animated.View>
    </View>
  );
}
