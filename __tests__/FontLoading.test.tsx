import * as Font from 'expo-font';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('Font Loading', () => {
  it('should load Open Sans font family successfully', async () => {
    const fontMap = {
      'OpenSans-Regular': require('../assets/fonts/OpenSans-Regular.ttf'),
      'OpenSans-Bold': require('../assets/fonts/OpenSans-Bold.ttf'),
      'OpenSans-SemiBold': require('../assets/fonts/OpenSans-SemiBold.ttf'),
      'OpenSans-Light': require('../assets/fonts/OpenSans-Light.ttf'),
    };

    await expect(Font.loadAsync(fontMap)).resolves.not.toThrow();
    
    // Verify fonts are loaded
    expect(Font.isLoaded('OpenSans-Regular')).toBe(true);
    expect(Font.isLoaded('OpenSans-Bold')).toBe(true);
    expect(Font.isLoaded('OpenSans-SemiBold')).toBe(true);
    expect(Font.isLoaded('OpenSans-Light')).toBe(true);
  });

  it('should not crash when Open Sans fonts are not loaded', () => {
    // App should render without crashing even when fonts are not loaded
    expect(() => render(<App />)).not.toThrow();
  });
});