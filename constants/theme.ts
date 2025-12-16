/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

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
    background: '#0A1F1C',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

// AQI Theme Colors
export const AqiColors = {
  background: '#0A1F1C',
  card: '#0F2922',
  cardBorder: '#1A3D32',
  accent: '#22C55E',
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textMuted: '#6B7280',
};

export const Fonts = Platform.select({
  ios: {
    sans: 'Poppins_400Regular',
    serif: 'Poppins_400Regular',
    rounded: 'Poppins_400Regular',
    mono: 'Poppins_400Regular',
  },
  default: {
    sans: 'Poppins_400Regular',
    serif: 'Poppins_400Regular',
    rounded: 'Poppins_400Regular',
    mono: 'Poppins_400Regular',
  },
  web: {
    sans: "Poppins_400Regular, system-ui, sans-serif",
    serif: "Poppins_400Regular, serif",
    rounded: "Poppins_400Regular, sans-serif",
    mono: "Poppins_400Regular, monospace",
  },
});
