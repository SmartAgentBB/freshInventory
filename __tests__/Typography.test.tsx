import React from 'react';
import { render } from '@testing-library/react-native';
import { Typography } from '../src/components/Typography';

describe('Typography', () => {
  it('should use Open Sans-Regular by default', () => {
    const { getByText } = render(<Typography>Test Text</Typography>);
    const textElement = getByText('Test Text');
    
    // Style can be an array, so check if it contains the expected fontFamily
    const styleArray = Array.isArray(textElement.props.style) 
      ? textElement.props.style 
      : [textElement.props.style];
      
    const hasCorrectFont = styleArray.some(style => 
      style && style.fontFamily === 'OpenSans-Regular'
    );
    
    expect(hasCorrectFont).toBe(true);
  });

  it('should use Open Sans-Bold for bold text', () => {
    const { getByText } = render(<Typography weight="bold">Bold Text</Typography>);
    const textElement = getByText('Bold Text');
    
    // Style can be an array, so check if it contains the expected fontFamily
    const styleArray = Array.isArray(textElement.props.style) 
      ? textElement.props.style 
      : [textElement.props.style];
      
    const hasCorrectFont = styleArray.some(style => 
      style && style.fontFamily === 'OpenSans-Bold'
    );
    
    expect(hasCorrectFont).toBe(true);
  });

  it('should use OpenSans-SemiBold for semibold text', () => {
    const { getByText } = render(<Typography weight="semibold">SemiBold Text</Typography>);
    const textElement = getByText('SemiBold Text');
    
    // Style can be an array, so check if it contains the expected fontFamily
    const styleArray = Array.isArray(textElement.props.style) 
      ? textElement.props.style 
      : [textElement.props.style];
      
    const hasCorrectFont = styleArray.some(style => 
      style && style.fontFamily === 'OpenSans-SemiBold'
    );
    
    expect(hasCorrectFont).toBe(true);
  });

  it('should render h1 variant with correct font and size (OpenSans-Bold, 32px)', () => {
    const { getByText } = render(<Typography variant="h1">Heading 1</Typography>);
    const textElement = getByText('Heading 1');
    
    // Style can be an array, so check if it contains the expected properties
    const styleArray = Array.isArray(textElement.props.style) 
      ? textElement.props.style 
      : [textElement.props.style];
      
    const hasCorrectFont = styleArray.some(style => 
      style && style.fontFamily === 'OpenSans-Bold'
    );
    
    const hasCorrectSize = styleArray.some(style => 
      style && style.fontSize === 32
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasCorrectSize).toBe(true);
  });

  it('should render h2 variant with correct font and size (OpenSans-Bold, 28px)', () => {
    const { getByText } = render(<Typography variant="h2">Heading 2</Typography>);
    const textElement = getByText('Heading 2');
    
    const styleArray = Array.isArray(textElement.props.style) 
      ? textElement.props.style 
      : [textElement.props.style];
      
    const hasCorrectFont = styleArray.some(style => 
      style && style.fontFamily === 'OpenSans-Bold'
    );
    
    const hasCorrectSize = styleArray.some(style => 
      style && style.fontSize === 28
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasCorrectSize).toBe(true);
  });

  it('should render body1 variant with correct font and size (OpenSans-Regular, 16px)', () => {
    const { getByText } = render(<Typography variant="body1">Body text</Typography>);
    const textElement = getByText('Body text');
    
    const styleArray = Array.isArray(textElement.props.style) 
      ? textElement.props.style 
      : [textElement.props.style];
      
    const hasCorrectFont = styleArray.some(style => 
      style && style.fontFamily === 'OpenSans-Regular'
    );
    
    const hasCorrectSize = styleArray.some(style => 
      style && style.fontSize === 16
    );
    
    expect(hasCorrectFont).toBe(true);
    expect(hasCorrectSize).toBe(true);
  });

  it('should accept custom color prop', () => {
    const customColor = '#FF5733';
    const { getByText } = render(<Typography color={customColor}>Colored text</Typography>);
    const textElement = getByText('Colored text');
    
    // Style can be nested arrays, so flatten and check
    const flattenStyle = (style: any): any[] => {
      if (!style) return [];
      if (Array.isArray(style)) {
        return style.flatMap(flattenStyle);
      }
      return [style];
    };
    
    const allStyles = flattenStyle(textElement.props.style);
    const hasCorrectColor = allStyles.some(style => 
      style && style.color === customColor
    );
    
    expect(hasCorrectColor).toBe(true);
  });
});