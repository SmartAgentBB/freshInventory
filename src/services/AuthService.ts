import { supabaseClient } from './supabaseClient';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';

export interface AuthStateChangeCallback {
  (event: AuthChangeEvent, session: Session | null): void;
}

export interface AuthSubscription {
  unsubscribe: () => void;
}

export class AuthService {
  private supabase = supabaseClient;

  constructor() {
    // AuthService is initialized with supabase client
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: AuthStateChangeCallback): AuthSubscription {
    if (!this.supabase?.auth) {
      console.warn('Supabase auth not initialized');
      return { unsubscribe: () => {} };
    }
    
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback);
    return {
      unsubscribe: () => subscription.unsubscribe()
    };
  }

  /**
   * Get the current user session
   */
  async getCurrentSession(): Promise<Session | null> {
    const { data: { session }, error } = await this.supabase.auth.getSession();
    
    if (error) {
      throw error;
    }
    
    return session;
  }

  /**
   * Get the current authenticated user
   */
  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    
    if (error) {
      throw error;
    }
    
    return user;
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const user = await this.getCurrentUser();
      return user !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    
    if (error) {
      throw error;
    }
  }

  /**
   * Sign in with email and password
   */
  async signInWithPassword(email: string, password: string): Promise<{ user: User | null; session: Session | null }> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      throw error;
    }
    
    return {
      user: data.user,
      session: data.session
    };
  }

  /**
   * Sign up with email and password
   */
  async signUp(email: string, password: string): Promise<{ data?: { user: User | null; session: Session | null }; error?: any }> {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      return { error };
    }

    return {
      data: {
        user: data.user,
        session: data.session
      }
    };
  }

  /**
   * Sign up with email and password (alias for signUp)
   */
  async signUpWithPassword(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: '회원가입 중 오류가 발생했습니다.' };
    }
  }

  /**
   * Reset password for email
   */
  async resetPassword(email: string): Promise<void> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      throw error;
    }
  }
}