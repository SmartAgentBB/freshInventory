import React from 'react';
import { Text, TextProps as PaperTextProps, useTheme } from 'react-native-paper';
import { Colors } from '../constants/colors';

// Map custom variants to Material Design 3 typography variants
type TypographyVariant = 
  | 'displayLarge' | 'displayMedium' | 'displaySmall'
  | 'headlineLarge' | 'headlineMedium' | 'headlineSmall' 
  | 'titleLarge' | 'titleMedium' | 'titleSmall'
  | 'bodyLarge' | 'bodyMedium' | 'bodySmall'
  | 'labelLarge' | 'labelMedium' | 'labelSmall'
  // Legacy variants for backward compatibility
  | 'h1' | 'h2' | 'h3' | 'h4' | 'subtitle1' | 'subtitle2' | 'body1' | 'body2' | 'caption';

interface TypographyProps extends Omit<PaperTextProps<any>, 'variant'> {
  children: React.ReactNode;
  variant?: TypographyVariant;
  color?: string;
}

export const Typography: React.FC<TypographyProps> = ({ 
  children, 
  style, 
  variant = 'bodyMedium',
  color,
  ...props 
}) => {
  const theme = useTheme();
  
  // Map legacy variants to Material Design 3 variants
  const getMappedVariant = (variant: TypographyVariant): PaperTextProps<any>['variant'] => {
    switch (variant) {
      // Legacy mappings
      case 'h1': return 'displayLarge';
      case 'h2': return 'headlineLarge';
      case 'h3': return 'headlineMedium';
      case 'h4': return 'headlineSmall';
      case 'subtitle1': return 'titleLarge';
      case 'subtitle2': return 'titleMedium';
      case 'body1': return 'bodyLarge';
      case 'body2': return 'bodyMedium';
      case 'caption': return 'bodySmall';
      
      // Material Design 3 variants (direct mapping)
      case 'displayLarge':
      case 'displayMedium':
      case 'displaySmall':
      case 'headlineLarge':
      case 'headlineMedium':
      case 'headlineSmall':
      case 'titleLarge':
      case 'titleMedium':
      case 'titleSmall':
      case 'bodyLarge':
      case 'bodyMedium':
      case 'bodySmall':
      case 'labelLarge':
      case 'labelMedium':
      case 'labelSmall':
        return variant;
        
      default:
        return 'bodyMedium';
    }
  };

  const mappedVariant = getMappedVariant(variant);
  const textColor = color || Colors.text.primary;

  return (
    <Text
      variant={mappedVariant}
      style={[
        { 
          color: textColor,
          // Ensure Open Sans fonts are applied
          fontFamily: getFontFamily(variant),
        },
        style,
      ]}
      theme={{
        ...theme,
        fonts: {
          ...theme.fonts,
          // Override theme fonts to use Open Sans
          displayLarge: { ...theme.fonts.displayLarge, fontFamily: 'OpenSans-Bold' },
          displayMedium: { ...theme.fonts.displayMedium, fontFamily: 'OpenSans-Bold' },
          displaySmall: { ...theme.fonts.displaySmall, fontFamily: 'OpenSans-Bold' },
          headlineLarge: { ...theme.fonts.headlineLarge, fontFamily: 'OpenSans-Bold' },
          headlineMedium: { ...theme.fonts.headlineMedium, fontFamily: 'OpenSans-SemiBold' },
          headlineSmall: { ...theme.fonts.headlineSmall, fontFamily: 'OpenSans-SemiBold' },
          titleLarge: { ...theme.fonts.titleLarge, fontFamily: 'OpenSans-SemiBold' },
          titleMedium: { ...theme.fonts.titleMedium, fontFamily: 'OpenSans-SemiBold' },
          titleSmall: { ...theme.fonts.titleSmall, fontFamily: 'OpenSans-SemiBold' },
          bodyLarge: { ...theme.fonts.bodyLarge, fontFamily: 'OpenSans-Regular' },
          bodyMedium: { ...theme.fonts.bodyMedium, fontFamily: 'OpenSans-Regular' },
          bodySmall: { ...theme.fonts.bodySmall, fontFamily: 'OpenSans-Regular' },
          labelLarge: { ...theme.fonts.labelLarge, fontFamily: 'OpenSans-SemiBold' },
          labelMedium: { ...theme.fonts.labelMedium, fontFamily: 'OpenSans-SemiBold' },
          labelSmall: { ...theme.fonts.labelSmall, fontFamily: 'OpenSans-SemiBold' },
        },
      }}
      {...props}
    >
      {children}
    </Text>
  );
};

// Helper function to get appropriate font family for Korean text
const getFontFamily = (variant: TypographyVariant): string => {
  switch (variant) {
    case 'displayLarge':
    case 'displayMedium':
    case 'displaySmall':
    case 'headlineLarge':
    case 'h1':
    case 'h2':
      return 'OpenSans-Bold';
      
    case 'headlineMedium':
    case 'headlineSmall':
    case 'titleLarge':
    case 'titleMedium':
    case 'titleSmall':
    case 'labelLarge':
    case 'labelMedium':
    case 'labelSmall':
    case 'h3':
    case 'h4':
    case 'subtitle1':
    case 'subtitle2':
      return 'OpenSans-SemiBold';
      
    case 'bodyLarge':
    case 'bodyMedium':
    case 'bodySmall':
    case 'body1':
    case 'body2':
    case 'caption':
    default:
      return 'OpenSans-Regular';
  }
};