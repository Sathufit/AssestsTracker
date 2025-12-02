/**
 * Theme Configuration
 * React Native Paper theme with light/dark modes
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// Custom color palette - Professional, sophisticated, business-grade
const lightColors = {
  primary: '#1565C0', // Professional Deep Blue
  secondary: '#455A64', // Blue Grey - Sophisticated
  success: '#2E7D32', // Professional Green
  warning: '#F57C00', // Refined Orange
  danger: '#C62828', // Professional Red
  info: '#0288D1', // Info Blue
  background: '#FAFAFA', // Clean White
  surface: '#FFFFFF',
  text: '#212121', // Pure Black Text
  textSecondary: '#757575', // Medium Gray
  border: '#E0E0E0',
  disabled: '#BDBDBD',
  accent: '#00838F', // Cyan Accent
  gradient1: '#1565C0', // Deep Blue
  gradient2: '#0D47A1', // Darker Blue
};

const darkColors = {
  primary: '#42A5F5', // Bright Blue
  secondary: '#78909C', // Light Blue Grey
  success: '#66BB6A', // Light Green
  warning: '#FFA726', // Bright Orange
  danger: '#EF5350', // Bright Red
  info: '#29B6F6', // Light Blue
  background: '#121212', // Material Dark
  surface: '#1E1E1E', // Dark Surface
  text: '#FFFFFF', // Pure White Text
  textSecondary: '#B0BEC5', // Light Grey
  border: '#424242',
  disabled: '#616161',
  accent: '#26C6DA', // Cyan Accent
  gradient1: '#42A5F5', // Bright Blue
  gradient2: '#1976D2', // Deep Blue
};

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
};

// Typography scale
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    lineHeight: 36,
  },
  h3: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  h4: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 28,
  },
  h5: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  body2: {
    fontSize: 14,
    fontWeight: 'normal' as const,
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
};

// Spacing scale
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  round: 9999,
};

// Shadows
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
};
