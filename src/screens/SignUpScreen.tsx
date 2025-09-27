import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { AuthService } from '../services/AuthService';
import { supabaseClient } from '../services/supabaseClient';

interface SignUpScreenProps {
  navigation: any; // In real app, this would be properly typed with React Navigation
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [signupError, setSignupError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const authService = new AuthService();

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Password strength calculation
  const getPasswordStrength = (password: string): string => {
    if (password.length < 6) return '약함';
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    
    if (score >= 3) return '강함';
    if (score >= 1) return '보통';
    return '약함';
  };

  // Form validation
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setSignupError('');

    // Email validation
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요');
      isValid = false;
    } else if (!validateEmail(email.trim())) {
      setEmailError('올바른 이메일 주소를 입력해주세요');
      isValid = false;
    }

    // Password validation
    if (!password.trim()) {
      setPasswordError('비밀번호를 입력해주세요');
      isValid = false;
    } else if (password.trim().length < 6) {
      setPasswordError('비밀번호는 최소 6자 이상이어야 합니다');
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword.trim()) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요');
      isValid = false;
    } else if (password.trim() !== confirmPassword.trim()) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다');
      isValid = false;
    }

    return isValid;
  };

  // Handle signup
  const handleSignUp = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      // 먼저 삭제된 계정인지 확인
      const { data: deletedAccount, error: checkError } = await supabaseClient
        .from('deleted_accounts')
        .select('email')
        .eq('email', email.trim())
        .single();

      // 에러가 '레코드를 찾을 수 없음'이 아니면 테이블 문제
      if (checkError && checkError.code !== 'PGRST116') {
        // deleted_accounts 테이블 확인 실패 무시
      }

      if (deletedAccount) {
        setSignupError('이 이메일은 탈퇴한 계정입니다. 다른 이메일을 사용해 주세요.');
        setLoading(false);
        return;
      }

      const result = await authService.signUp(email.trim(), password.trim());


      if (result.error) {

        // Check for specific error types
        const errorMessage = result.error.message || result.error.msg || '';
        const errorCode = result.error.code || result.error.status || '';

        if (errorMessage.toLowerCase().includes('already registered') ||
            errorMessage.toLowerCase().includes('already exists') ||
            errorMessage.toLowerCase().includes('user already registered') ||
            errorCode === 'user_already_exists' ||
            (result.error.status === 400 && errorMessage.includes('email'))) {
          setSignupError('이미 등록된 이메일입니다. 다른 이메일을 사용해주세요.');
        } else if (errorMessage.toLowerCase().includes('invalid email')) {
          setSignupError('유효하지 않은 이메일 주소입니다.');
        } else if (errorMessage.toLowerCase().includes('weak password')) {
          setSignupError('비밀번호가 너무 약합니다. 더 강한 비밀번호를 사용해주세요.');
        } else {
          setSignupError(errorMessage || '회원가입에 실패했습니다. 다시 시도해주세요.');
        }
        return;
      }

      // Show success message only if signup was successful
      if (result.data?.user) {
        setSuccessMessage('회원가입이 완료되었습니다. 이메일을 확인해주세요.');

        // Navigate to login after delay
        setTimeout(() => {
          navigation.navigate('Login');
        }, 2000);
      } else {
        // If no error but also no user, something went wrong
        setSignupError('회원가입 처리 중 문제가 발생했습니다. 다시 시도해주세요.');
      }

    } catch (error: any) {

      // This should not happen now, but keep as fallback
      setSignupError('회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Navigate to login
  const handleLoginPress = () => {
    navigation.navigate('Login');
  };

  // Clear errors when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (signupError) setSignupError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (signupError) setSignupError('');
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) setConfirmPasswordError('');
    if (signupError) setSignupError('');
  };

  return (
    <Surface 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default 
      }}
      testID="signup-screen"
    >
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          flexGrow: 1,
          justifyContent: 'center',
          padding: 24
        }}
      >
        <View 
          style={{ 
            maxWidth: 400,
            alignSelf: 'center',
            width: '100%'
          }}
          testID="signup-form"
        >
          {/* Header */}
          <Text 
            variant="headlineMedium"
            style={{
              color: Colors.text.primary,
              fontFamily: 'OpenSans-Bold',
              textAlign: 'center',
              marginBottom: 8
            }}
          >
            회원가입
          </Text>

          <Text 
            variant="bodyLarge"
            style={{
              color: Colors.text.secondary,
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center',
              marginBottom: 32
            }}
          >
            냉프로 회원가입
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 16 }}>
            <Text 
              variant="bodySmall"
              style={{
                color: Colors.text.secondary,
                fontFamily: 'OpenSans-Regular',
                marginBottom: 4
              }}
            >
              이메일
            </Text>
            <RNTextInput
              placeholder="이메일"
              value={email}
              onChangeText={handleEmailChange}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={{
                borderWidth: 1,
                borderColor: emailError ? Colors.status.error : Colors.primary.main,
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background.paper,
                color: Colors.text.primary,
                fontFamily: 'OpenSans-Regular'
              }}
            />
            {emailError ? (
              <Text
                variant="bodySmall"
                style={{
                  color: Colors.status.error,
                  fontFamily: 'OpenSans-Regular',
                  marginTop: 4
                }}
              >
                {emailError}
              </Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={{ marginBottom: 16 }}>
            <Text 
              variant="bodySmall"
              style={{
                color: Colors.text.secondary,
                fontFamily: 'OpenSans-Regular',
                marginBottom: 4
              }}
            >
              비밀번호
            </Text>
            <RNTextInput
              placeholder="비밀번호"
              value={password}
              onChangeText={handlePasswordChange}
              secureTextEntry
              autoComplete="password-new"
              style={{
                borderWidth: 1,
                borderColor: passwordError ? Colors.status.error : Colors.primary.main,
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background.paper,
                color: Colors.text.primary,
                fontFamily: 'OpenSans-Regular'
              }}
            />
            {passwordError ? (
              <Text
                variant="bodySmall"
                style={{
                  color: Colors.status.error,
                  fontFamily: 'OpenSans-Regular',
                  marginTop: 4
                }}
              >
                {passwordError}
              </Text>
            ) : null}
            {/* Password strength indicator */}
            {password && !passwordError ? (
              <Text
                variant="bodySmall"
                style={{
                  color: getPasswordStrength(password) === '강함' ? Colors.status.success :
                        getPasswordStrength(password) === '보통' ? Colors.status.warning : Colors.status.error,
                  fontFamily: 'OpenSans-Regular',
                  marginTop: 4
                }}
              >
                {getPasswordStrength(password)}
              </Text>
            ) : null}
          </View>

          {/* Confirm Password Input */}
          <View style={{ marginBottom: 24 }}>
            <Text 
              variant="bodySmall"
              style={{
                color: Colors.text.secondary,
                fontFamily: 'OpenSans-Regular',
                marginBottom: 4
              }}
            >
              비밀번호 확인
            </Text>
            <RNTextInput
              placeholder="비밀번호 확인"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              secureTextEntry
              autoComplete="password-new"
              style={{
                borderWidth: 1,
                borderColor: confirmPasswordError ? Colors.status.error : Colors.primary.main,
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background.paper,
                color: Colors.text.primary,
                fontFamily: 'OpenSans-Regular'
              }}
            />
            {confirmPasswordError ? (
              <Text
                variant="bodySmall"
                style={{
                  color: Colors.status.error,
                  fontFamily: 'OpenSans-Regular',
                  marginTop: 4
                }}
              >
                {confirmPasswordError}
              </Text>
            ) : null}
          </View>

          {/* Signup Error */}
          {signupError ? (
            <Text
              variant="bodyMedium"
              style={{
                color: Colors.status.error,
                fontFamily: 'OpenSans-Regular',
                textAlign: 'center',
                marginBottom: 16
              }}
            >
              {signupError}
            </Text>
          ) : null}

          {/* Success Message */}
          {successMessage ? (
            <Text
              variant="bodyMedium"
              style={{
                color: Colors.status.success,
                fontFamily: 'OpenSans-Regular',
                textAlign: 'center',
                marginBottom: 16
              }}
            >
              {successMessage}
            </Text>
          ) : null}

          {/* Signup Button */}
          <TouchableOpacity
            onPress={handleSignUp}
            disabled={loading}
            style={{
              backgroundColor: Colors.primary.main,
              borderRadius: 28, // Pill shape
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 24,
              opacity: loading ? 0.7 : 1
            }}
            activeOpacity={0.8}
          >
            {loading ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text
                  variant="bodyLarge"
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'OpenSans-SemiBold'
                  }}
                >
                  회원가입 중...
                </Text>
              </View>
            ) : (
              <Text
                variant="bodyLarge"
                style={{
                  color: '#FFFFFF',
                  fontFamily: 'OpenSans-SemiBold'
                }}
              >
                회원가입하기
              </Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <TouchableOpacity
            onPress={handleLoginPress}
            style={{
              alignItems: 'center'
            }}
          >
            <Text 
              variant="bodyMedium"
              style={{
                color: Colors.primary.main,
                fontFamily: 'OpenSans-Regular',
                textDecorationLine: 'underline'
              }}
            >
              이미 계정이 있으신가요? 로그인
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Surface>
  );
};