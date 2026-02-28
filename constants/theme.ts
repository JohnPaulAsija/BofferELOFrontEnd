/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform, StyleSheet } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

// BofferElo Theme
export const BofferEloColors = {
  // Background colors
  background: {
    primary: '#0f172a',    // Dark slate
    secondary: '#1e293b',  // Slate 800
    tertiary: '#334155',   // Slate 700
  },

  // Brand colors
  brand: {
    amber: '#f59e0b',      // Amber 500
    red: '#dc2626',        // Red 600
    orange: '#ea580c',     // Orange 600
    amberDark: '#78350f',  // Amber 900
  },

  // Text colors
  text: {
    primary: '#f1f5f9',    // Slate 100
    secondary: '#94a3b8',  // Slate 400
    tertiary: '#64748b',   // Slate 500
    white: '#ffffff',
  },

  // Border colors
  border: {
    primary: '#334155',    // Slate 700
    secondary: '#475569',  // Slate 600
  },

  // Status colors
  status: {
    purple: '#a78bfa',     // Purple 400 (super admin)
    amber: '#f59e0b',      // Amber 500 (admin)
  },

  // Utility
  black: '#000000',
  shadow: '#000',
};

// Spacing
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

// Border Radius
export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  full: 9999,
};

// Typography
export const Typography = {
  fontSize: {
    xs: 8,
    sm: 12,
    base: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 48,
  },
  fontWeight: {
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: 'bold' as const,
  },
  letterSpacing: {
    normal: 0,
    wide: 0.5,
  },
};

// Shadows
export const Shadows = {
  sm: Platform.select({
    ios: {
      shadowColor: BofferEloColors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
    },
    android: {
      elevation: 2,
    },
  }),
  md: Platform.select({
    ios: {
      shadowColor: BofferEloColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
  }),
  lg: Platform.select({
    ios: {
      shadowColor: BofferEloColors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
    },
    android: {
      elevation: 5,
    },
  }),
  xl: Platform.select({
    ios: {
      shadowColor: BofferEloColors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 8,
    },
  }),
};

// BofferElo Styles
export const BofferEloStyles = StyleSheet.create({
  // Layout
  stackContent: {
    backgroundColor: BofferEloColors.background.primary,
    paddingTop: 72,
  },
  comingSoonContainer: {
    flex: 1,
    backgroundColor: BofferEloColors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 72,
  },
  comingSoonTitle: {
    fontSize: Typography.fontSize.xxxl,
    fontWeight: Typography.fontWeight.bold,
    color: BofferEloColors.brand.amber,
    marginBottom: Spacing.lg,
  },
  comingSoonSubtitle: {
    fontSize: Typography.fontSize.lg,
    color: BofferEloColors.text.secondary,
    fontWeight: Typography.fontWeight.medium,
  },

  // Header
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: BofferEloColors.background.secondary,
    borderBottomWidth: 1,
    borderBottomColor: BofferEloColors.border.primary,
    zIndex: 50,
    ...Shadows.lg,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 50 : Spacing.lg,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },

  // Logo
  logoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoIcon: {
    width: 40,
    height: 40,
    backgroundColor: BofferEloColors.brand.amber,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.md,
  },
  logoText: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: BofferEloColors.text.primary,
    letterSpacing: Typography.letterSpacing.wide,
  },
  logoAccent: {
    color: BofferEloColors.brand.amber,
  },

  // Buttons
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  primaryButton: {
    backgroundColor: BofferEloColors.brand.red,
    ...Shadows.sm,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: BofferEloColors.brand.amber,
  },
  buttonText: {
    color: BofferEloColors.text.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
  },
  outlineButtonText: {
    color: BofferEloColors.brand.amber,
  },
  iconButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },

  // User Section
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  userActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingLeft: Spacing.sm,
    borderLeftWidth: 1,
    borderLeftColor: BofferEloColors.border.secondary,
  },
  userNameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    padding: 6,
    borderRadius: BorderRadius.md,
  },
  userName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: BofferEloColors.text.primary,
  },

  // Notifications
  notificationButton: {
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: BofferEloColors.brand.amberDark,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: BofferEloColors.brand.red,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BofferEloColors.background.secondary,
  },
  badgeText: {
    color: BofferEloColors.text.white,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});
