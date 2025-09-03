import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import * as Font from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import App from '../App';

// Mock expo modules
jest.mock('expo-font');
jest.mock('expo-splash-screen');

const mockFont = Font as jest.Mocked<typeof Font>;
const mockSplashScreen = SplashScreen as jest.Mocked<typeof SplashScreen>;

describe('Loading Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSplashScreen.preventAutoHideAsync.mockResolvedValue(false);
    mockSplashScreen.hideAsync.mockResolvedValue(false);
  });

  it('should display loading screen while fonts are loading', async () => {
    // Mock font loading to take some time
    mockFont.loadAsync.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(), 100))
    );

    render(<App />);
    
    // Should show loading text initially
    expect(screen.getByText(/loading/i)).toBeTruthy();
    
    // Wait for fonts to load
    await waitFor(() => {
      expect(screen.getByText('Fresh Inventory')).toBeTruthy();
    }, { timeout: 1000 });
  });
});