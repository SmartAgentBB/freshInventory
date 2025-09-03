import { AuthService } from '../src/services/AuthService';

// Mock the Supabase client
jest.mock('../src/services/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
      getUser: jest.fn(),
      signOut: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      resetPasswordForEmail: jest.fn()
    }
  }
}));

// Import after mocking
const { supabase } = require('../src/services/supabaseClient');
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

describe('AuthService - 인증 서비스 설정', () => {
  let authService: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    authService = new AuthService();
  });

  describe('Initialization', () => {
    it('should initialize Supabase auth correctly', () => {
      // Test that AuthService properly initializes with Supabase client
      expect(authService).toBeDefined();
      expect(authService).toBeInstanceOf(AuthService);
      
      // Should have access to Supabase client
      expect(mockSupabase).toBeDefined();
      expect(mockSupabase.auth).toBeDefined();
    });

    it('should handle auth state changes', async () => {
      // Test that AuthService can listen to auth state changes
      const mockCallback = jest.fn();
      
      // Mock onAuthStateChange
      const mockUnsubscribe = jest.fn();
      mockSupabase.auth.onAuthStateChange = jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      });
      
      // Subscribe to auth state changes
      const subscription = authService.onAuthStateChange(mockCallback);
      
      // Should call Supabase's onAuthStateChange
      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalledWith(mockCallback);
      expect(subscription).toBeDefined();
      expect(subscription.unsubscribe).toBeInstanceOf(Function);
      
      // Test that unsubscribe calls the underlying function
      subscription.unsubscribe();
      expect(mockUnsubscribe).toHaveBeenCalled();
    });

    it('should store user session securely', async () => {
      // Test that AuthService can retrieve and store user sessions
      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          email: 'test@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: '2025-01-01T00:00:00Z'
        },
        expires_at: Date.now() + 3600000, // 1 hour from now
        token_type: 'bearer'
      };
      
      // Mock getSession
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: mockSession },
        error: null
      });
      
      // Get current session
      const session = await authService.getCurrentSession();
      
      // Should call Supabase's getSession
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(session).toEqual(mockSession);
    });

    it('should handle missing session gracefully', async () => {
      // Test behavior when no session exists
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: null
      });
      
      const session = await authService.getCurrentSession();
      
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
      expect(session).toBeNull();
    });

    it('should handle session retrieval errors', async () => {
      // Test error handling during session retrieval
      const mockError = new Error('Session retrieval failed');
      
      mockSupabase.auth.getSession = jest.fn().mockResolvedValue({
        data: { session: null },
        error: mockError
      });
      
      await expect(authService.getCurrentSession()).rejects.toThrow('Session retrieval failed');
      expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    });
  });

  describe('User management', () => {
    it('should get current user', async () => {
      // Test getting current authenticated user
      const mockUser = {
        id: 'mock-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      };
      
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      const user = await authService.getCurrentUser();
      
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(user).toEqual(mockUser);
    });

    it('should handle missing user gracefully', async () => {
      // Test behavior when no user is authenticated
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });
      
      const user = await authService.getCurrentUser();
      
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(user).toBeNull();
    });

    it('should check if user is authenticated', async () => {
      // Test authentication status check
      const mockUser = {
        id: 'mock-user-id',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2025-01-01T00:00:00Z'
      };
      
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: mockUser },
        error: null
      });
      
      const isAuthenticated = await authService.isAuthenticated();
      
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(isAuthenticated).toBe(true);
    });

    it('should return false when user is not authenticated', async () => {
      // Test authentication status when no user
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: null
      });
      
      const isAuthenticated = await authService.isAuthenticated();
      
      expect(mockSupabase.auth.getUser).toHaveBeenCalled();
      expect(isAuthenticated).toBe(false);
    });
  });

  describe('Sign out', () => {
    it('should sign out user successfully', async () => {
      // Test user sign out
      mockSupabase.auth.signOut = jest.fn().mockResolvedValue({
        error: null
      });
      
      await authService.signOut();
      
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });

    it('should handle sign out errors', async () => {
      // Test error handling during sign out
      const mockError = new Error('Sign out failed');
      
      mockSupabase.auth.signOut = jest.fn().mockResolvedValue({
        error: mockError
      });
      
      await expect(authService.signOut()).rejects.toThrow('Sign out failed');
      expect(mockSupabase.auth.signOut).toHaveBeenCalled();
    });
  });
});