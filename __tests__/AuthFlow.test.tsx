import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthFlow } from '../src/navigation/AuthFlow';
import { PaperProvider } from 'react-native-paper';
import { mintTheme } from '../src/theme/mintTheme';

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  NavigationContainer: ({ children }: any) => children,
}));

jest.mock('@react-navigation/stack', () => ({
  createStackNavigator: () => ({
    Navigator: ({ children, initialRouteName }: any) => {
      const React = require('react');
      if (initialRouteName === 'Login') {
        const { LoginScreen } = require('../src/screens/LoginScreen');
        return React.createElement(LoginScreen);
      } else if (initialRouteName === 'Main') {
        const { BottomTabNavigation } = require('../src/navigation/BottomTabNavigation');
        return React.createElement(BottomTabNavigation);
      }
      return children;
    },
    Screen: () => null,
  }),
}));

jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native/Libraries/Components/View/View');
  return {
    Swipeable: View,
    DrawerLayout: View,
    State: {},
    ScrollView: View,
    Slider: View,
    Switch: View,
    TextInput: View,
    ToolbarAndroid: View,
    ViewPagerAndroid: View,
    DrawerLayoutAndroid: View,
    WebView: View,
    NativeViewGestureHandler: View,
    TapGestureHandler: View,
    FlingGestureHandler: View,
    ForceTouchGestureHandler: View,
    LongPressGestureHandler: View,
    PanGestureHandler: View,
    PinchGestureHandler: View,
    RotationGestureHandler: View,
    /* Buttons */
    RawButton: View,
    BaseButton: View,
    RectButton: View,
    BorderlessButton: View,
    /* Other */
    FlatList: View,
    gestureHandlerRootHOC: (c: any) => c,
    Directions: {},
  };
});

// Mock the AuthService
jest.mock('../src/services/AuthService');
jest.mock('../src/services/supabaseClient');

// Mock navigation components
jest.mock('../src/screens/LoginScreen', () => ({
  LoginScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'login-screen' }, 
      React.createElement(Text, null, 'Login Screen')
    );
  }
}));

jest.mock('../src/screens/SignUpScreen', () => ({
  SignUpScreen: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'signup-screen' }, 
      React.createElement(Text, null, 'SignUp Screen')
    );
  }
}));

jest.mock('../src/navigation/BottomTabNavigation', () => ({
  BottomTabNavigation: () => {
    const React = require('react');
    const { View, Text } = require('react-native');
    return React.createElement(View, { testID: 'main-app' }, 
      React.createElement(Text, null, 'Main App')
    );
  }
}));

// Helper function to render components with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={mintTheme}>
      {component}
    </PaperProvider>
  );
};

describe('AuthFlow - 인증 플로우', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication state management', () => {
    it('should redirect to login when user is not authenticated', async () => {
      // Test that unauthenticated users are directed to login screen
      
      // Mock AuthService to return unauthenticated state
      const mockAuthService = {
        getCurrentUser: jest.fn().mockResolvedValue(null),
        getCurrentSession: jest.fn().mockResolvedValue(null),
        isAuthenticated: jest.fn().mockResolvedValue(false),
        onAuthStateChange: jest.fn().mockImplementation((callback) => {
          // Simulate no user state
          callback('SIGNED_OUT', null);
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId, queryByTestId } = renderWithTheme(<AuthFlow />);
      
      // Should show loading initially
      expect(getByTestId('auth-loading')).toBeTruthy();
      
      // Should redirect to login screen when not authenticated
      await waitFor(() => {
        expect(getByTestId('login-screen')).toBeTruthy();
      });
      
      // Should not show main app
      expect(queryByTestId('main-app')).toBeFalsy();
    });

    it('should show main app when user is authenticated', async () => {
      // Test that authenticated users are directed to main app
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer'
      };

      // Mock AuthService to return authenticated state
      const mockAuthService = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
        getCurrentSession: jest.fn().mockResolvedValue(mockSession),
        isAuthenticated: jest.fn().mockResolvedValue(true),
        onAuthStateChange: jest.fn().mockImplementation((callback) => {
          // Simulate authenticated user state
          callback('SIGNED_IN', mockSession);
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId, queryByTestId } = renderWithTheme(<AuthFlow />);
      
      // Should show loading initially
      expect(getByTestId('auth-loading')).toBeTruthy();
      
      // Should show main app when authenticated
      await waitFor(() => {
        expect(getByTestId('main-app')).toBeTruthy();
      });
      
      // Should not show login screen
      expect(queryByTestId('login-screen')).toBeFalsy();
    });

    it('should handle logout correctly', async () => {
      // Test logout flow from authenticated to unauthenticated state
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer'
      };

      let authCallback: any = null;
      
      // Mock AuthService with logout functionality
      const mockAuthService = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
        getCurrentSession: jest.fn().mockResolvedValue(mockSession),
        isAuthenticated: jest.fn().mockResolvedValue(true),
        signOut: jest.fn().mockResolvedValue(undefined),
        onAuthStateChange: jest.fn().mockImplementation((callback) => {
          authCallback = callback;
          // Start with authenticated state
          callback('SIGNED_IN', mockSession);
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId, queryByTestId } = renderWithTheme(<AuthFlow />);
      
      // Should show main app initially (authenticated)
      await waitFor(() => {
        expect(getByTestId('main-app')).toBeTruthy();
      });
      
      // Simulate logout (auth state change to signed out)
      if (authCallback) {
        authCallback('SIGNED_OUT', null);
      }
      
      // Should redirect to login screen after logout
      await waitFor(() => {
        expect(getByTestId('login-screen')).toBeTruthy();
      });
      
      // Should not show main app after logout
      expect(queryByTestId('main-app')).toBeFalsy();
    });

    it('should persist authentication state across app restarts', async () => {
      // Test that authentication state is restored on app startup
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      };

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer'
      };

      // Mock AuthService to simulate persistent session
      const mockAuthService = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
        getCurrentSession: jest.fn().mockResolvedValue(mockSession),
        isAuthenticated: jest.fn().mockResolvedValue(true),
        onAuthStateChange: jest.fn().mockImplementation(() => {
          // Don't immediately trigger callback to allow initial auth check
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId } = renderWithTheme(<AuthFlow />);
      
      // Should show loading initially
      expect(getByTestId('auth-loading')).toBeTruthy();
      
      // Should restore authenticated state and show main app
      await waitFor(() => {
        expect(getByTestId('main-app')).toBeTruthy();
      }, { timeout: 1000 });
      
      // Should have called isAuthenticated method to restore state
      expect(mockAuthService.isAuthenticated).toHaveBeenCalled();
    });

    it('should show loading screen during authentication check', () => {
      // Test loading state during initial authentication check
      
      // Mock AuthService with slow response
      const mockAuthService = {
        getCurrentUser: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(null), 100))),
        getCurrentSession: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(null), 100))),
        isAuthenticated: jest.fn(() => new Promise(resolve => setTimeout(() => resolve(false), 100))),
        onAuthStateChange: jest.fn().mockImplementation(() => {
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId, getByText } = renderWithTheme(<AuthFlow />);
      
      // Should show loading screen immediately
      expect(getByTestId('auth-loading')).toBeTruthy();
      expect(getByText('Fresh Inventory')).toBeTruthy();
      expect(getByText('잠시만 기다려주세요...')).toBeTruthy();
    });

    it('should handle authentication errors gracefully', async () => {
      // Test error handling during authentication check
      
      // Mock AuthService to throw error
      const mockAuthService = {
        getCurrentUser: jest.fn().mockRejectedValue(new Error('Network error')),
        getCurrentSession: jest.fn().mockRejectedValue(new Error('Network error')),
        isAuthenticated: jest.fn().mockRejectedValue(new Error('Network error')),
        onAuthStateChange: jest.fn().mockImplementation((callback) => {
          // Simulate auth error
          callback('SIGNED_OUT', null);
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId, queryByTestId } = renderWithTheme(<AuthFlow />);
      
      // Should default to login screen on authentication errors
      await waitFor(() => {
        expect(getByTestId('login-screen')).toBeTruthy();
      });
      
      // Should not show main app on error
      expect(queryByTestId('main-app')).toBeFalsy();
    });

    it('should handle token refresh correctly', async () => {
      // Test token refresh functionality
      
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      };

      const mockSession = {
        access_token: 'refreshed-access-token',
        refresh_token: 'mock-refresh-token',
        user: mockUser,
        expires_at: Date.now() + 3600000,
        token_type: 'bearer'
      };

      // Mock AuthService with token refresh
      const mockAuthService = {
        getCurrentUser: jest.fn().mockResolvedValue(mockUser),
        getCurrentSession: jest.fn().mockResolvedValue(mockSession),
        isAuthenticated: jest.fn().mockResolvedValue(true),
        onAuthStateChange: jest.fn().mockImplementation((callback) => {
          // Simulate token refresh
          callback('TOKEN_REFRESHED', mockSession);
          return { unsubscribe: jest.fn() };
        })
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      const { getByTestId, queryByTestId } = renderWithTheme(<AuthFlow />);
      
      // Should show main app after token refresh
      await waitFor(() => {
        expect(getByTestId('main-app')).toBeTruthy();
      });
      
      // Should have maintained authenticated state
      expect(queryByTestId('login-screen')).toBeFalsy();
    });
  });
});