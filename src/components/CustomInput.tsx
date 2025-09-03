import React from 'react';
import { TextInput, TextInputProps, useTheme } from 'react-native-paper';
import { Colors } from '../constants/colors';

type InputVariant = 'outlined' | 'filled';

interface CustomInputProps extends Omit<TextInputProps, 'mode'> {
  variant?: InputVariant;
}

export const CustomInput: React.FC<CustomInputProps> = ({
  variant = 'outlined',
  style,
  contentStyle,
  outlineStyle,
  activeOutlineColor,
  outlineColor,
  activeUnderlineColor,
  underlineColor,
  textColor,
  ...props
}) => {
  const theme = useTheme();

  // Map variant to Paper's mode
  const getPaperMode = (variant: InputVariant): TextInputProps['mode'] => {
    switch (variant) {
      case 'outlined':
        return 'outlined';
      case 'filled':
        return 'flat';
      default:
        return 'outlined';
    }
  };

  // Get colors based on variant and theme
  const getInputColors = (variant: InputVariant) => {
    return {
      activeOutlineColor: activeOutlineColor || Colors.primary.main,
      outlineColor: outlineColor || Colors.border.outline,
      activeUnderlineColor: activeUnderlineColor || Colors.primary.main,
      underlineColor: underlineColor || Colors.border.outline,
      textColor: textColor || Colors.text.primary,
      placeholderTextColor: Colors.text.hint,
    };
  };

  const colors = getInputColors(variant);

  return (
    <TextInput
      mode={getPaperMode(variant)}
      activeOutlineColor={colors.activeOutlineColor}
      outlineColor={colors.outlineColor}
      activeUnderlineColor={colors.activeUnderlineColor}
      underlineColor={colors.underlineColor}
      textColor={colors.textColor}
      placeholderTextColor={colors.placeholderTextColor}
      style={[
        {
          backgroundColor: variant === 'filled' ? Colors.background.level1 : Colors.background.paper,
        },
        style,
      ]}
      contentStyle={[
        {
          fontFamily: 'OpenSans-Regular',
          fontSize: 16,
          color: Colors.text.primary,
        },
        contentStyle,
      ]}
      outlineStyle={[
        {
          borderRadius: 8,
        },
        outlineStyle,
      ]}
      theme={{
        ...theme,
        fonts: {
          ...theme.fonts,
          bodyLarge: {
            ...theme.fonts.bodyLarge,
            fontFamily: 'OpenSans-Regular',
          },
          labelLarge: {
            ...theme.fonts.labelLarge,
            fontFamily: 'OpenSans-SemiBold',
          },
        },
      }}
      testID="custom-input"
      {...props}
    />
  );
};