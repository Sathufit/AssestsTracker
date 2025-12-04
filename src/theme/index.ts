/**
 * Theme Configuration
 * React Native Paper theme with light/dark modes
 */

import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

// World-Class 60-30-10 Color Palette
// 60% - Neutral Foundation (backgrounds, surfaces)
// 30% - Primary Brand (headers, key elements)
// 10% - Accent (CTAs, important actions)
const lightColors = {
  // 30% - Primary Brand Color (Deep Slate)
  primary: '#2C3E50', // Sophisticated slate blue - main brand color
  primaryLight: '#34495E', // Lighter variant
  primaryDark: '#1A252F', // Darker variant
  
  // 10% - Accent Color (Vibrant Coral)
  accent: '#FF6B6B', // Eye-catching coral - for CTAs and important actions
  accentLight: '#FF8787', // Lighter variant for hover states
  accentDark: '#E85555', // Darker variant
  
  // 60% - Neutral Foundation
  background: '#F8F9FA', // 60% - Soft off-white for main backgrounds
  surface: '#FFFFFF', // Pure white for cards and elevated surfaces
  surfaceVariant: '#F1F3F5', // Subtle variant
  
  // Supporting Colors (minimal usage)
  success: '#51CF66', // Fresh green
  warning: '#FFA94D', // Warm orange
  danger: '#FF6B6B', // Same as accent for consistency
  info: '#4DABF7', // Sky blue
  
  // Text Colors
  text: '#2C3E50', // Primary text matches brand
  textSecondary: '#6C757D', // Muted gray for secondary text
  textTertiary: '#ADB5BD', // Light gray for hints
  
  // Borders & Dividers
  border: '#DEE2E6',
  borderLight: '#E9ECEF',
  disabled: '#CED4DA',
  
  // Gradients (Primary to Primary Dark)
  gradient1: '#2C3E50',
  gradient2: '#1A252F',
  
  // Status Colors (subtle, professional)
  statusActive: '#51CF66',
  statusSpare: '#4DABF7',
  statusOutOfOrder: '#FFA94D',
  statusRetired: '#ADB5BD',
};

const darkColors = {
  // 30% - Primary Brand Color (Lighter for dark mode)
  primary: '#4A5F7F', // Muted slate for dark backgrounds
  primaryLight: '#5C7599',
  primaryDark: '#3A4F6F',
  
  // 10% - Accent Color (Vibrant Coral)
  accent: '#FF6B6B',
  accentLight: '#FF8787',
  accentDark: '#E85555',
  
  // 60% - Neutral Foundation (Dark)
  background: '#1A1D23', // 60% - Rich dark background
  surface: '#25282E', // Elevated surface
  surfaceVariant: '#2E3138',
  
  // Supporting Colors
  success: '#51CF66',
  warning: '#FFA94D',
  danger: '#FF6B6B',
  info: '#4DABF7',
  
  // Text Colors
  text: '#F8F9FA', // Light text on dark
  textSecondary: '#ADB5BD',
  textTertiary: '#6C757D',
  
  // Borders & Dividers
  border: '#343A40',
  borderLight: '#3E444A',
  disabled: '#495057',
  
  // Gradients
  gradient1: '#4A5F7F',
  gradient2: '#3A4F6F',
  
  // Status Colors
  statusActive: '#51CF66',
  statusSpare: '#4DABF7',
  statusOutOfOrder: '#FFA94D',
  statusRetired: '#6C757D',
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
