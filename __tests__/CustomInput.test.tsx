import React from 'react';
import { render } from '@testing-library/react-native';
import { CustomInput } from '../src/components/CustomInput';

describe('CustomInput', () => {
  it('should render outlined variant with border and background', () => {
    const { getByTestId } = render(<CustomInput variant="outlined" placeholder="Test Input" />);
    const inputContainer = getByTestId('custom-input-container');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check input container styling (border and background)
    const containerStyles = flattenStyle(inputContainer.props.style);
    const hasBorder = containerStyles.some(style =>
      style && style.borderWidth && style.borderColor
    );
    const hasBackground = containerStyles.some(style =>
      style && style.backgroundColor
    );
    
    expect(hasBorder).toBe(true);
    expect(hasBackground).toBe(true);
  });

  it('should render filled variant with level1 background', () => {
    const { getByTestId } = render(<CustomInput variant="filled" placeholder="Filled Input" />);
    const inputContainer = getByTestId('custom-input-container');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    // Check input container styling (level1 background, no border)
    const containerStyles = flattenStyle(inputContainer.props.style);
    const hasLevel1Background = containerStyles.some(style =>
      style && style.backgroundColor === '#EFEFF4'
    );
    const hasNoBorder = !containerStyles.some(style =>
      style && style.borderWidth
    );
    
    expect(hasLevel1Background).toBe(true);
    expect(hasNoBorder).toBe(true);
  });

  it('should use OpenSans-Regular for input text', () => {
    const { getByDisplayValue } = render(<CustomInput value="Test Input Text" />);
    const textInputElement = getByDisplayValue('Test Input Text');
    
    // Style can be an array, so check if it contains the expected font family
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    const inputStyles = flattenStyle(textInputElement.props.style);
    const hasCorrectFont = inputStyles.some(style => 
      style && style.fontFamily === 'OpenSans-Regular'
    );
    
    expect(hasCorrectFont).toBe(true);
  });

  it('should use OpenSans-SemiBold for label text', () => {
    const { getByText } = render(<CustomInput label="Test Label" />);
    const labelElement = getByText('Test Label');
    
    // Style can be an array, so check if it contains the expected font family
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    const labelStyles = flattenStyle(labelElement.props.style);
    const hasCorrectFont = labelStyles.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    expect(hasCorrectFont).toBe(true);
  });

  it('should apply consistent border radius and padding', () => {
    const { getByTestId } = render(<CustomInput variant="outlined" />);
    const inputContainer = getByTestId('custom-input-container');
    
    // Style can be an array, so check if it contains the expected properties
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    const containerStyles = flattenStyle(inputContainer.props.style);
    
    // Check for consistent border radius (BorderRadius.md = 8)
    const hasBorderRadius = containerStyles.some(style =>
      style && style.borderRadius === 8
    );
    
    // Check for padding (should use Spacing constants)
    const hasPadding = containerStyles.some(style =>
      style && (style.padding !== undefined || style.paddingHorizontal !== undefined || style.paddingVertical !== undefined)
    );
    
    expect(hasBorderRadius).toBe(true);
    expect(hasPadding).toBe(true);
  });
});