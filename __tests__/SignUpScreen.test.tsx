import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { SignUpScreen } from '../src/screens/SignUpScreen';
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

describe('SignUpScreen - 회원가입 화면', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock AuthService
    const mockAuthService = {
      signUp: jest.fn(),
      getCurrentUser: jest.fn(),
      onAuthStateChange: jest.fn()
    };

    const { AuthService } = require('../src/services/AuthService');
    AuthService.mockImplementation(() => mockAuthService);
  });

  describe('Rendering', () => {
    it('should render signup form', () => {
      // Test that SignUpScreen renders with all necessary form elements
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      // Should have screen title
      expect(screen.getByText('회원가입')).toBeTruthy();
      
      // Should have email input field
      expect(screen.getByPlaceholderText('이메일')).toBeTruthy();
      expect(screen.getByText('이메일')).toBeTruthy();
      
      // Should have password input field
      expect(screen.getByPlaceholderText('비밀번호')).toBeTruthy();
      expect(screen.getByText('비밀번호')).toBeTruthy();
      
      // Should have confirm password input field
      expect(screen.getByPlaceholderText('비밀번호 확인')).toBeTruthy();
      expect(screen.getByText('비밀번호 확인')).toBeTruthy();
      
      // Should have signup button
      expect(screen.getByText('회원가입하기')).toBeTruthy();
      
      // Should have login link
      expect(screen.getByText('이미 계정이 있으신가요? 로그인')).toBeTruthy();
    });

    it('should render with proper Material Design styling', () => {
      // Test that form uses proper Material Design components and styling
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      // Should use Paper components properly
      expect(screen.getByTestId('signup-screen')).toBeTruthy();
      expect(screen.getByTestId('signup-form')).toBeTruthy();
      
      // Should have proper Korean labels
      expect(screen.getByText('Fresh Inventory 회원가입')).toBeTruthy();
    });

    it('should show password inputs as secure', () => {
      // Test that password fields are properly secured
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호 확인');
      
      expect(passwordInput.props.secureTextEntry).toBe(true);
      expect(confirmPasswordInput.props.secureTextEntry).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate password confirmation', async () => {
      // Test password confirmation validation
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호 확인');
      const signupButton = screen.getByText('회원가입하기');
      
      // Enter valid email and passwords that don't match
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password456');
      fireEvent.press(signupButton);
      
      // Should show password confirmation error
      await waitFor(() => {
        expect(screen.getByText('비밀번호가 일치하지 않습니다')).toBeTruthy();
      });
    });

    it('should validate required fields', async () => {
      // Test that required fields are validated
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const signupButton = screen.getByText('회원가입하기');
      
      // Try to signup without filling fields
      fireEvent.press(signupButton);
      
      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('이메일을 입력해주세요')).toBeTruthy();
        expect(screen.getByText('비밀번호를 입력해주세요')).toBeTruthy();
        expect(screen.getByText('비밀번호 확인을 입력해주세요')).toBeTruthy();
      });
    });

    it('should validate email format', async () => {
      // Test email format validation
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const signupButton = screen.getByText('회원가입하기');
      
      // Enter invalid email
      fireEvent.changeText(emailInput, 'invalid-email');
      fireEvent.press(signupButton);
      
      // Should show email validation error
      await waitFor(() => {
        expect(screen.getByText('올바른 이메일 주소를 입력해주세요')).toBeTruthy();
      });
    });

    it('should validate password minimum length', async () => {
      // Test password length validation
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const signupButton = screen.getByText('회원가입하기');
      
      // Enter valid email but short password
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, '123');
      fireEvent.press(signupButton);
      
      // Should show password validation error
      await waitFor(() => {
        expect(screen.getByText('비밀번호는 최소 6자 이상이어야 합니다')).toBeTruthy();
      });
    });

    it('should clear validation errors when user types', () => {
      // Test that validation errors clear when user starts typing
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const signupButton = screen.getByText('회원가입하기');
      
      // Trigger validation error first
      fireEvent.press(signupButton);
      
      // Start typing in email field
      fireEvent.changeText(emailInput, 't');
      
      // Error should be cleared
      expect(screen.queryByText('이메일을 입력해주세요')).toBeFalsy();
    });

    it('should show password strength indicator', () => {
      // Test password strength feedback
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      
      // Enter weak password
      fireEvent.changeText(passwordInput, '123');
      expect(screen.getByText('약함')).toBeTruthy();
      
      // Enter medium password
      fireEvent.changeText(passwordInput, 'password');
      expect(screen.getByText('보통')).toBeTruthy();
      
      // Enter strong password
      fireEvent.changeText(passwordInput, 'Password123!');
      expect(screen.getByText('강함')).toBeTruthy();
    });
  });

  describe('Authentication', () => {
    it('should create new user account', async () => {
      // Test that signup function is called with proper credentials
      const mockAuthService = {
        signUp: jest.fn().mockResolvedValue({
          user: { id: 'new-user', email: 'test@example.com' },
          session: { access_token: 'mock-token' }
        }),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호 확인');
      const signupButton = screen.getByText('회원가입하기');
      
      // Fill in valid credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      
      // Submit signup form
      fireEvent.press(signupButton);
      
      // Should call AuthService with correct credentials
      await waitFor(() => {
        expect(mockAuthService.signUp).toHaveBeenCalledWith(
          'test@example.com',
          'password123'
        );
      });
    });

    it('should handle signup errors', async () => {
      // Test error handling for failed signup
      const mockAuthService = {
        signUp: jest.fn().mockRejectedValue(new Error('Email already exists')),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호 확인');
      const signupButton = screen.getByText('회원가입하기');
      
      // Fill in credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText('회원가입에 실패했습니다. 다시 시도해주세요.')).toBeTruthy();
      });
      
      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should show loading state during signup', async () => {
      // Test loading state during authentication
      const mockAuthService = {
        signUp: jest.fn(() => new Promise(resolve => setTimeout(resolve, 100))),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호 확인');
      const signupButton = screen.getByText('회원가입하기');
      
      // Fill in credentials and submit
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);
      
      // Should show loading state
      expect(screen.getByText('회원가입 중...')).toBeTruthy();
      
      // Should hide loading after completion
      await waitFor(() => {
        expect(screen.getByText('회원가입하기')).toBeTruthy();
      }, { timeout: 3000 });
    });

    it('should show success message and navigate to login', async () => {
      // Test successful signup flow
      const mockAuthService = {
        signUp: jest.fn().mockResolvedValue({
          user: null, // Supabase may return null user if email confirmation is required
          session: null
        }),
        getCurrentUser: jest.fn(),
        onAuthStateChange: jest.fn()
      };

      const { AuthService } = require('../src/services/AuthService');
      AuthService.mockImplementation(() => mockAuthService);
      
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const emailInput = screen.getByPlaceholderText('이메일');
      const passwordInput = screen.getByPlaceholderText('비밀번호');
      const confirmPasswordInput = screen.getByPlaceholderText('비밀번호 확인');
      const signupButton = screen.getByText('회원가입하기');
      
      // Fill in and submit valid credentials
      fireEvent.changeText(emailInput, 'test@example.com');
      fireEvent.changeText(passwordInput, 'password123');
      fireEvent.changeText(confirmPasswordInput, 'password123');
      fireEvent.press(signupButton);
      
      // Should show success message
      await waitFor(() => {
        expect(screen.getByText('회원가입이 완료되었습니다. 이메일을 확인해주세요.')).toBeTruthy();
      });
      
      // Should navigate to login after delay
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('Login');
      }, { timeout: 3000 });
    });
  });

  describe('Navigation', () => {
    it('should navigate to login when login link is pressed', () => {
      // Test navigation to login screen
      renderWithTheme(<SignUpScreen navigation={mockNavigation} />);
      
      const loginLink = screen.getByText('이미 계정이 있으신가요? 로그인');
      fireEvent.press(loginLink);
      
      // Should navigate to Login screen
      expect(mockNavigate).toHaveBeenCalledWith('Login');
    });
  });
});