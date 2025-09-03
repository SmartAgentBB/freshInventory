import React from 'react';
import { ThemeProvider } from 'react-native-elements';
import { Colors } from '../constants/colors';

interface CustomThemeProviderProps {
  children: React.ReactNode;
}

const theme = {
  colors: {
    primary: Colors.primary.main,
    secondary: Colors.secondary.main,
    success: Colors.status.success,
    warning: Colors.status.warning,
    error: Colors.status.error,
    text: Colors.text.primary,
  },
  Button: {
    buttonStyle: {
      backgroundColor: Colors.primary.main,
    },
  },
};

export const CustomThemeProvider: React.FC<CustomThemeProviderProps> = ({ children }) => {
  return (
    <ThemeProvider theme={theme}>
      {children}
    </ThemeProvider>
  );
};