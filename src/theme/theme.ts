export interface Theme {
  bg: string;
  pageBg: string;
  card: string;
  text: string;
  secondaryText: string;
  border: string;
  accent: string;
  accentText: string;
  accentShadow: string;
  gold: string;
  danger: string;
  dark: boolean;
}

export const lightTheme: Theme = {
  bg: '#FAFAF8',
  pageBg: '#EDEDEA',
  card: '#FFFFFF',
  text: '#1A1A1A',
  secondaryText: '#8A8A8E',
  border: 'rgba(0,0,0,0.08)',
  accent: '#1C2B4A',
  accentText: '#FFFFFF',
  accentShadow: 'rgba(28,43,74,0.28)',
  gold: '#B08D57',
  danger: '#B3392C',
  dark: false,
};

export const darkTheme: Theme = {
  bg: '#0D0D0D',
  pageBg: '#050505',
  card: '#1A1A1C',
  text: '#F5F5F3',
  secondaryText: '#9A9A9E',
  border: 'rgba(255,255,255,0.10)',
  accent: '#33456E',
  accentText: '#F5F5F3',
  accentShadow: 'rgba(51,69,110,0.4)',
  gold: '#C7A06B',
  danger: '#E0685C',
  dark: true,
};

export function themeFor(darkMode: boolean): Theme {
  return darkMode ? darkTheme : lightTheme;
}

export const onboardingTint = {
  light: '#F2F0F7',
  dark: '#12172A',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  pill: 999,
};
