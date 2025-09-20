import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const mintLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary Mint Colors
    primary: '#26A69A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#E8F5F2',
    onPrimaryContainer: '#1a1a1a',

    // Secondary Colors (using text colors)
    secondary: '#5f6368',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#E8F5F2',
    onSecondaryContainer: '#1a1a1a',

    // Tertiary Colors (same as primary)
    tertiary: '#26A69A',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#E8F5F2',
    onTertiaryContainer: '#1a1a1a',

    // Background Colors
    background: '#F8FDFC',
    onBackground: '#1a1a1a',
    surface: '#FFFFFF',
    onSurface: '#1a1a1a',
    surfaceVariant: '#F8FDFC',
    onSurfaceVariant: '#5f6368',
    
    // Text Colors for Korean content
    onSurfaceDisabled: '#9AA0A6',
    outline: '#D0E8E6',
    outlineVariant: '#E8F5F2',
    
    // Success/Error states
    error: '#EF5350',
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#1a1a1a',
    
    // Surface elevations
    elevation: {
      level0: 'transparent',
      level1: '#FFFFFF',
      level2: '#F8FDFC',
      level3: '#F8FDFC',
      level4: '#E8F5F2',
      level5: '#E8F5F2',
    },
  },
  fonts: {
    ...MD3LightTheme.fonts,
    default: {
      fontFamily: 'OpenSans-Regular',
    },
    displayLarge: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 57,
      fontWeight: '400' as const,
      letterSpacing: -0.25,
      lineHeight: 64,
    },
    displayMedium: {
      fontFamily: 'OpenSans-Bold', 
      fontSize: 45,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 52,
    },
    displaySmall: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 36,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 44,
    },
    headlineLarge: {
      fontFamily: 'OpenSans-Bold',
      fontSize: 32,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 40,
    },
    headlineMedium: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 28,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 36,
    },
    headlineSmall: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 24,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 32,
    },
    titleLarge: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 22,
      fontWeight: '400' as const,
      letterSpacing: 0,
      lineHeight: 28,
    },
    titleMedium: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 16,
      fontWeight: '500' as const,
      letterSpacing: 0.15,
      lineHeight: 24,
    },
    titleSmall: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    bodyLarge: {
      fontFamily: 'OpenSans-Regular',
      fontSize: 16,
      fontWeight: '400' as const,
      letterSpacing: 0.5,
      lineHeight: 24,
    },
    bodyMedium: {
      fontFamily: 'OpenSans-Regular',
      fontSize: 14,
      fontWeight: '400' as const,
      letterSpacing: 0.25,
      lineHeight: 20,
    },
    bodySmall: {
      fontFamily: 'OpenSans-Regular',
      fontSize: 12,
      fontWeight: '400' as const,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    labelLarge: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 14,
      fontWeight: '500' as const,
      letterSpacing: 0.1,
      lineHeight: 20,
    },
    labelMedium: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
    labelSmall: {
      fontFamily: 'OpenSans-SemiBold',
      fontSize: 11,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
      lineHeight: 16,
    },
  },
};

export const mintDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    // Primary Mint Colors (adjusted for dark mode)
    primary: '#26A69A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#00897B',
    onPrimaryContainer: '#E8F5F2',

    // Secondary Colors
    secondary: '#5f6368',
    onSecondary: '#FFFFFF',
    secondaryContainer: '#00897B',
    onSecondaryContainer: '#E8F5F2',

    // Background Colors
    background: '#0F1419',
    onBackground: '#E8F5F2',
    surface: '#191C20',
    onSurface: '#E8F5F2',

    // Text Colors
    onSurfaceDisabled: '#9AA0A6',
    outline: '#D0E8E6',
    outlineVariant: '#00897B',
  },
  fonts: mintLightTheme.fonts,
};