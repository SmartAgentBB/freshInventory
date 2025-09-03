import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const mintLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    // Primary Mint Colors
    primary: '#26A69A',
    onPrimary: '#FFFFFF',
    primaryContainer: '#B2DFDB',
    onPrimaryContainer: '#004D40',
    
    // Secondary Colors
    secondary: '#4DB6AC',
    onSecondary: '#FFFFFF', 
    secondaryContainer: '#E0F2F1',
    onSecondaryContainer: '#00695C',
    
    // Tertiary Colors
    tertiary: '#00695C',
    onTertiary: '#FFFFFF',
    tertiaryContainer: '#B2DFDB',
    onTertiaryContainer: '#004D40',
    
    // Background Colors
    background: '#E0F2F1',
    onBackground: '#004D40',
    surface: '#FFFBFE',
    onSurface: '#00695C',
    surfaceVariant: '#B2DFDB',
    onSurfaceVariant: '#004D40',
    
    // Text Colors for Korean content
    onSurfaceDisabled: '#80CBC4',
    outline: '#4DB6AC',
    outlineVariant: '#B2DFDB',
    
    // Success/Error states
    error: '#FF5252',
    onError: '#FFFFFF',
    errorContainer: '#FFEBEE',
    onErrorContainer: '#C62828',
    
    // Surface elevations
    elevation: {
      level0: 'transparent',
      level1: '#F1F8F6',
      level2: '#E8F5F0',
      level3: '#E0F2F1',
      level4: '#D4EDDA',
      level5: '#C8E6C9',
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
    primary: '#4DB6AC',
    onPrimary: '#00251A',
    primaryContainer: '#00695C',
    onPrimaryContainer: '#B2DFDB',
    
    // Secondary Colors  
    secondary: '#80CBC4',
    onSecondary: '#00251A',
    secondaryContainer: '#004D40',
    onSecondaryContainer: '#E0F2F1',
    
    // Background Colors
    background: '#0F1419',
    onBackground: '#E0F2F1',
    surface: '#191C20',
    onSurface: '#C8E6C9',
    
    // Text Colors
    onSurfaceDisabled: '#4DB6AC',
    outline: '#80CBC4',
    outlineVariant: '#00695C',
  },
  fonts: mintLightTheme.fonts,
};