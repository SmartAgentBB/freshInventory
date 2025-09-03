import React from 'react';
import { render } from '@testing-library/react-native';
import { View } from 'react-native';
import { Spacing } from '../src/constants/spacing';
import { BorderRadius } from '../src/constants/borderRadius';

// Mock component that should use consistent spacing
const TestSpacingComponent = () => (
  <View style={{ padding: Spacing.md, margin: Spacing.sm }}>
    <View style={{ marginTop: Spacing.lg }} />
  </View>
);

// Mock component that should use consistent border radius
const TestBorderComponent = () => (
  <View style={{ borderRadius: BorderRadius.md, padding: Spacing.sm }}>
    <View style={{ borderRadius: BorderRadius.lg }} />
  </View>
);

describe('Component Consistency', () => {
  it('should use consistent spacing from Spacing constant', () => {
    // Verify that the component renders without crashing and uses Spacing constants
    expect(() => render(<TestSpacingComponent />)).not.toThrow();
    
    // Verify that Spacing constants are used (values should match)
    expect(Spacing.md).toBe(16);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.lg).toBe(24);
  });

  it('should use consistent border radius from BorderRadius constant', () => {
    // Verify that the component renders without crashing and uses BorderRadius constants
    expect(() => render(<TestBorderComponent />)).not.toThrow();
    
    // Verify that BorderRadius constants are used (values should match)
    expect(BorderRadius.md).toBe(8);
    expect(BorderRadius.lg).toBe(12);
  });
});