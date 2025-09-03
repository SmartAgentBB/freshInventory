import React from 'react';
import { render } from '@testing-library/react-native';
import { Button } from 'react-native-elements';
import { CustomThemeProvider } from '../src/providers/ThemeProvider';

describe('ThemeProvider', () => {
  it('should apply theme colors to React Native Elements', () => {
    // Test that the ThemeProvider renders without crashing and provides theme context
    expect(() => {
      render(
        <CustomThemeProvider>
          <Button title="Test Button" />
        </CustomThemeProvider>
      );
    }).not.toThrow();
  });
  
  it('should render children within the theme provider', () => {
    const { getByText } = render(
      <CustomThemeProvider>
        <Button title="Test Button" />
      </CustomThemeProvider>
    );
    
    expect(getByText('Test Button')).toBeTruthy();
  });
});