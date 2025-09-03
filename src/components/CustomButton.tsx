import React from 'react';
import { Button, ButtonProps, useTheme } from 'react-native-paper';
import { Colors } from '../constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'outlined' | 'text';
type ButtonSize = 'small' | 'medium' | 'large';

interface CustomButtonProps extends Omit<ButtonProps, 'mode' | 'children'> {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const CustomButton: React.FC<CustomButtonProps> = ({
  title,
  variant = 'primary',
  size = 'medium',
  loading = false,
  style,
  labelStyle,
  buttonColor,
  textColor,
  ...props
}) => {
  const theme = useTheme();
  
  // Map variant to Paper's mode
  const getPaperMode = (variant: ButtonVariant): ButtonProps['mode'] => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'contained';
      case 'outlined':
        return 'outlined';
      case 'text':
      default:
        return 'text';
    }
  };

  // Get button colors based on variant
  const getButtonColors = (variant: ButtonVariant) => {
    switch (variant) {
      case 'primary':
        return {
          buttonColor: buttonColor || Colors.primary.main,
          textColor: textColor || Colors.text.onPrimary,
        };
      case 'secondary':
        return {
          buttonColor: buttonColor || Colors.secondary.main,
          textColor: textColor || Colors.text.onSecondary,
        };
      case 'outlined':
        return {
          buttonColor: buttonColor || 'transparent',
          textColor: textColor || Colors.primary.main,
        };
      case 'text':
      default:
        return {
          buttonColor: buttonColor || 'transparent',
          textColor: textColor || Colors.primary.main,
        };
    }
  };

  // Get size-based styles
  const getSizeStyle = (size: ButtonSize) => {
    switch (size) {
      case 'small':
        return {
          height: 32,
          paddingHorizontal: 12,
        };
      case 'medium':
        return {
          height: 40,
          paddingHorizontal: 16,
        };
      case 'large':
        return {
          height: 48,
          paddingHorizontal: 24,
        };
      default:
        return {
          height: 40,
          paddingHorizontal: 16,
        };
    }
  };

  const colors = getButtonColors(variant);
  const sizeStyle = getSizeStyle(size);

  return (
    <Button
      mode={getPaperMode(variant)}
      buttonColor={colors.buttonColor}
      textColor={colors.textColor}
      loading={loading}
      style={[sizeStyle, style]}
      labelStyle={[
        {
          fontFamily: 'OpenSans-SemiBold',
          fontSize: size === 'small' ? 12 : size === 'large' ? 16 : 14,
        },
        labelStyle,
      ]}
      testID="custom-button"
      {...props}
    >
      {title}
    </Button>
  );
};