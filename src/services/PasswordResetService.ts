import { supabaseClient } from './supabaseClient';

/**
 * Password Reset Service
 * Handles password reset functionality using email OTP codes
 */

export interface PasswordResetResult {
  success: boolean;
  error?: string;
}

export class PasswordResetService {
  /**
   * Send password reset OTP code to user's email
   * @param email - User's email address
   * @returns Promise with result
   */
  static async sendResetCode(email: string): Promise<PasswordResetResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Send OTP code via email using Supabase
      const { error } = await supabaseClient.auth.signInWithOtp({
        email: normalizedEmail,
        options: {
          shouldCreateUser: false,
        }
      });

      if (error) {
        if (error.message.toLowerCase().includes('user not found') ||
            error.message.toLowerCase().includes('invalid email')) {
          return {
            success: false,
            error: '등록되지 않은 이메일입니다'
          };
        }

        return {
          success: false,
          error: error.message || '재설정 코드 전송에 실패했습니다'
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || '재설정 코드 전송에 실패했습니다'
      };
    }
  }

  /**
   * Verify OTP code and mark user for password reset
   * @param email - User's email address
   * @param code - 6-digit OTP code from email
   * @returns Promise with result
   */
  static async verifyResetCode(
    email: string,
    code: string
  ): Promise<PasswordResetResult> {
    try {
      const normalizedEmail = email.trim().toLowerCase();

      // Verify OTP and create session
      const { data, error } = await supabaseClient.auth.verifyOtp({
        email: normalizedEmail,
        token: code.trim(),
        type: 'email'
      });

      if (error) {
        if (error.message.toLowerCase().includes('invalid') ||
            error.message.toLowerCase().includes('expired')) {
          return {
            success: false,
            error: '잘못되었거나 만료된 코드입니다'
          };
        }

        return {
          success: false,
          error: error.message || '코드 인증에 실패했습니다'
        };
      }

      if (!data.session) {
        return {
          success: false,
          error: '세션 생성에 실패했습니다'
        };
      }

      // Mark user as requiring password reset
      const { error: updateError } = await supabaseClient.auth.updateUser({
        data: {
          password_reset_required: true
        }
      });

      if (updateError) {
        console.warn('Failed to set password_reset_required flag:', updateError);
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || '코드 인증에 실패했습니다'
      };
    }
  }

  /**
   * Update user's password and remove reset flag
   * @param newPassword - New password
   * @returns Promise with result
   */
  static async updatePassword(newPassword: string): Promise<PasswordResetResult> {
    try {
      // Update password and remove reset flag
      const { error } = await supabaseClient.auth.updateUser({
        password: newPassword,
        data: {
          password_reset_required: false
        }
      });

      if (error) {
        return {
          success: false,
          error: error.message || '비밀번호 변경에 실패했습니다'
        };
      }

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || '비밀번호 변경에 실패했습니다'
      };
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result and error message
   */
  static validatePassword(password: string): { isValid: boolean; error?: string } {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        error: '비밀번호는 최소 6자 이상이어야 합니다'
      };
    }

    if (password.length > 72) {
      return {
        isValid: false,
        error: '비밀번호는 최대 72자까지 가능합니다'
      };
    }

    // Check for at least one letter and one number
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasLetter || !hasNumber) {
      return {
        isValid: false,
        error: '비밀번호는 영문자와 숫자를 포함해야 합니다'
      };
    }

    return { isValid: true };
  }

  /**
   * Sign out current user
   */
  static async signOut(): Promise<void> {
    await supabaseClient.auth.signOut();
  }
}
