import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginScreen } from '../src/screens/LoginScreen';
import { PaperProvider } from 'react-native-paper';
import { mintTheme } from '../src/theme/mintTheme';

// Mock the AuthService
jest.mock('../src/services/AuthService');
jest.mock('../src/services/supabaseClient');

// Mock navigation
const mockNavigate = jest.fn();
const mockNavigation = {
  navigate: mockNavigate,
  goBack: jest.fn(),
  canGoBack: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  isFocused: jest.fn()
};

// Helper function to render components with theme
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <PaperProvider theme={mintTheme}>
      {component}
    </PaperProvider>
  );
};

describe('LoginScreen - 로그인 화면', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AuthService
    const mockAuthService = {
      signInWithPassword: jest.fn(),
      getCurrentUser: jest.fn(),
      onAuthStateChange: jest.fn()
    };

    const { AuthService } = require('../src/services/AuthService');
    AuthService.mockImplementation(() => mockAuthService);
  });

  describe('Rendering', () => {
    it('should render login form', () => {
      // Test that LoginScreen renders with all necessary form elements
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      // Should have screen title
      expect(screen.getByText('로그인')).toBeTruthy();
      
      // Should have email input field
      expect(screen.getByPlaceholderText('이메일')).toBeTruthy();
      expect(screen.getByText('이메일')).toBeTruthy();
      
      // Should have password input field
      expect(screen.getByPlaceholderText('비밀번호')).toBeTruthy();
      expect(screen.getByText('비밀번호')).toBeTruthy();
      
      // Should have login button
      expect(screen.getByText('로그인하기')).toBeTruthy();
      
      // Should have sign up link
      expect(screen.getByText('계정이 없으신가요? 회원가입')).toBeTruthy();
    });

    it('should render with proper Material Design styling', () => {
      // Test that form uses proper Material Design components and styling
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      // Should use Paper components properly
      expect(screen.getByTestId('login-screen')).toBeTruthy();
      expect(screen.getByTestId('login-form')).toBeTruthy();
      
      // Should have proper Korean labels
      expect(screen.getByText('Fresh Inventory에 로그인')).toBeTruthy();
    });

    it('should show password input as secure', () => {
      // Test that password field is properly secured
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      expect(passwordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate email format', async () => {
      // Test email format validation
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const loginButton = screen.getByText('로그인하기');
      
      // Enter invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(loginButton);
      
      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 주소를 입력해주세요')).toBeTruthy();
      });
    });

    it('should validate required fields', async () => {
      // Test that required fields are validated
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const loginButton = screen.getByText('로그인하기');
      
      // Try to login without filling fields
      fireEvent.press(loginButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요')).toBeTruthy();
        expect(screen.getByText('비밀번호를 입력해주세요')).toBeTruthy();
      });
    });

    it('should validate password minimum length', async () => {
      // Test password length validation
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const loginButton = screen.getByText('로그인하기');
      
      // Enter valid email but short password
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(loginButton);
      
      // Should show password validation error
      await waitFor(() => {
        expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다')).toBeTruthy();
      });
    });

    it('should clear validation errors when user types', () => {
      // Test that validation errors clear when user starts typing
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const loginButton = screen.getByText('로그인하기');
      
      // Trigger validation error first
      fireEvent.press(loginButton);
      
      // Start typing in email field
      fireEvent.changeText(emailInput, 't');
      
      // Error should be cleared (we'll test this by ensuring no error text)
      expect(screen.queryByText('이메일을 입력해주세요')).toBeFalsy();
    });
  });

  describe('Authentication', () => {
    it('should call login with correct credentials', async () => {
      // Test that login function is called with proper credentials
      const mockAuthService = {
        signInWithPassword: jest.fn().mockResolvedValue({
          user: { id: 'test-user', email: 'test@example.com' },
          session: { access_token: 'mock-token' }
        }),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const loginButton = screen.getByText('로그인하기');
      
      // Fill in valid credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      
      // Submit login form
      fireEvent.press(loginButton);
      
      // Should call AuthService with correct credentials
      await waitFor(() => {
        expect(mockAuthService.signInWithPassword).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should navigate to main app after successful login', async () => {
      // Test navigation after successful authentication
      const mockAuthService = {
        signInWithPassword: jest.fn().mockResolvedValue({
          user: { id: 'test-user', email: 'test@example.com' },
          session: { access_token: 'mock-token' }
        }),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const loginButton = screen.getByText('로그인하기');
      
      // Fill in and submit valid credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      // Should navigate to main app
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Main');
      });
    });

    it('should display error message on login failure', async () => {
      // Test error handling for failed login
      const mockAuthService = {
        signInWithPassword: jest.fn().mockRejectedValue(new Error('Invalid credentials')),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const loginButton = screen.getByText('로그인하기');
      
      // Fill in credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'wrongpassword');
      fireEvent.press(loginButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.')).toBeTruthy();
      });
      
      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during login', async () => {
      // Test loading state during authentication
      const mockAuthService = {
        signInWithPassword: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100))),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const loginButton = screen.getByText('로그인하기');
      
      // Fill in credentials and submit
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.press(loginButton);
      
      // Should show loading state
      expect(screen.getByText('로그인 중...')).toBeTruthy();
      
      // Should hide loading after completion
      await waitFor(() => {
        expect(screen.getByText('로그인하기')).toBeTruthy();
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate to signup when signup link is pressed', () => {
      // Test navigation to signup screen
      renderWithTheme(<LoginScreen navigation={mockNavigation} />);
      
      const signupLink = screen.getByText('계정이 없으신가요? 회원가입');
      fireEvent.press(signupLink);
      
      // Should navigate to SignUp screen
      expect(mockNavigate).toHaveBeenCalledWith('SignUp');
    });
  });
});