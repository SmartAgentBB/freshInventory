import React from 'react';
import { render } from '@testing-library/react-native';
import { CustomButton } from '../src/components/CustomButton';

describe('CustomButton', () => {
  it('should render primary variant with correct colors and fonts', () => {
    const { getByText, getByTestId } = render(<CustomButton variant="primary" title="Test Button" />);
    const buttonElement = getByText('Test Button');
    const touchableElement = getByTestId('custom-button');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check button text font
    const textStyles = flattenStyle(buttonElement.props.style);
    const hasCorrectFont = textStyles.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    // Check button background color (primary main color)
    const touchableStyles = flattenStyle(touchableElement.props.style);
    const hasCorrectBackground = touchableStyles.some(style =>
      style && style.backgroundColor === '#007AFF'
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasCorrectBackground).toBe(true);
  });

  it('should render secondary variant with correct styling', () => {
    const { getByText, getByTestId } = render(<CustomButton variant="secondary" title="Secondary Button" />);
    const buttonElement = getByText('Secondary Button');
    const touchableElement = getByTestId('custom-button');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check button text font (should use OpenSans-SemiBold)
    const textStyles = flattenStyle(buttonElement.props.style);
    const hasCorrectFont = textStyles.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    // Check button background color (secondary main color)
    const touchableStyles = flattenStyle(touchableElement.props.style);
    const hasCorrectBackground = touchableStyles.some(style =>
      style && style.backgroundColor === '#5856D6'
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasCorrectBackground).toBe(true);
  });

  it('should render outlined variant with transparent background and border', () => {
    const { getByText, getByTestId } = render(<CustomButton variant="outlined" title="Outlined Button" />);
    const buttonElement = getByText('Outlined Button');
    const touchableElement = getByTestId('custom-button');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check button text font (should use OpenSans-SemiBold)
    const textStyles = flattenStyle(buttonElement.props.style);
    const hasCorrectFont = textStyles.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    // Check button styling (transparent background and border)
    const touchableStyles = flattenStyle(touchableElement.props.style);
    const hasTransparentBackground = touchableStyles.some(style =>
      style && (style.backgroundColor === 'transparent' || !style.backgroundColor)
    );
    const hasBorder = touchableStyles.some(style =>
      style && style.borderWidth && style.borderColor
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasTransparentBackground).toBe(true);
    expect(hasBorder).toBe(true);
  });

  it('should render text variant with transparent background', () => {
    const { getByText, getByTestId } = render(<CustomButton variant="text" title="Text Button" />);
    const buttonElement = getByText('Text Button');
    const touchableElement = getByTestId('custom-button');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check button text font (should use OpenSans-SemiBold)
    const textStyles = flattenStyle(buttonElement.props.style);
    const hasCorrectFont = textStyles.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    // Check button styling (transparent background, no border)
    const touchableStyles = flattenStyle(touchableElement.props.style);
    const hasTransparentBackground = touchableStyles.some(style =>
      style && (style.backgroundColor === 'transparent' || !style.backgroundColor)
    );
    const hasNoBorder = !touchableStyles.some(style =>
      style && style.borderWidth
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasTransparentBackground).toBe(true);
    expect(hasNoBorder).toBe(true);
  });

  it('should handle different sizes (small, medium, large) correctly', () => {
    // Test small size
    const { getByText: getByTextSmall, getByTestId: getByTestIdSmall } = render(<CustomButton size="small" title="Small Button" />);
    const smallTouchable = getByTestIdSmall('custom-button');
    
    // Test medium size (default)
    const { getByText: getByTextMedium, getByTestId: getByTestIdMedium } = render(<CustomButton size="medium" title="Medium Button" />);
    const mediumTouchable = getByTestIdMedium('custom-button');
    
    // Test large size
    const { getByText: getByTextLarge, getByTestId: getByTestIdLarge } = render(<CustomButton size="large" title="Large Button" />);
    const largeTouchable = getByTestIdLarge('custom-button');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check padding for different sizes
    const smallStyles = flattenStyle(smallTouchable.props.style);
    const mediumStyles = flattenStyle(mediumTouchable.props.style);
    const largeStyles = flattenStyle(largeTouchable.props.style);
    
    const getStyleProperty = (styles: any[], property: string) => {
      for (const style of styles) {
        if (style && style[property] !== undefined) {
          return style[property];
        }
      }
      return undefined;
    };
    
    const smallPadding = getStyleProperty(smallStyles, 'padding');
    const mediumPadding = getStyleProperty(mediumStyles, 'padding');
    const largePadding = getStyleProperty(largeStyles, 'padding');
    
    // Verify that sizes have different padding values
    expect(smallPadding).toBeDefined();
    expect(mediumPadding).toBeDefined();
    expect(largePadding).toBeDefined();
    
    // Small should be smaller than medium, medium smaller than large
    expect(smallPadding).toBeLessThan(mediumPadding);
    expect(mediumPadding).toBeLessThan(largePadding);
  });

  it('should use OpenSans-SemiBold for title text', () => {
    const { getByText } = render(<CustomButton title="Test Title" />);
    const buttonTextElement = getByText('Test Title');
    
    // Style can be an array, so check if it contains the expected font family
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    const textStyles = flattenStyle(buttonTextElement.props.style);
    const hasCorrectFont = textStyles.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    expect(hasCorrectFont).toBe(true);
  });
});