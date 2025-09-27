import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput, Alert } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { AuthService } from '../services/AuthService';
import { supabaseClient } from '../services/supabaseClient';

interface LoginScreenProps {
  navigation: any; // In real app, this would be properly typed with React Navigation
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [loginError, setLoginError] = useState('');

  const authService = new AuthService();

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Form validation
  const validateForm = (): boolean => {
    let isValid = true;

    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setLoginError('');

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

    return isValid;
  };

  // Handle login
  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // 먼저 삭제된 계정인지 확인 (테이블이 없어도 안전하게 처리)
      try {
        const { data: deletedAccount, error: checkError } = await supabaseClient
          .from('deleted_accounts')
          .select('email')
          .eq('email', email.trim())
          .single();

        // 에러가 '레코드를 찾을 수 없음'이 아니면 테이블이 없거나 다른 문제
        if (checkError && checkError.code !== 'PGRST116') {
          // deleted_accounts 테이블 확인 건너뜀
        }

        if (deletedAccount) {
          setLoginError('이 계정은 탈퇴 처리되었습니다. 다른 이메일로 새로운 계정을 만들어 주세요.');
          setLoading(false);
          return;
        }
      } catch (deletedCheckError) {
        // deleted_accounts 테이블 체크 실패는 무시하고 계속 진행
        // deleted_accounts 확인 중 오류 무시
      }

      // 먼저 로그인을 시도하여 사용자 정보를 가져옴
      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      });

      if (authError) {
        throw authError;
      }

      // 로그인 성공했지만 메타데이터 확인
      if (authData.user) {
        const userData = authData.user.user_metadata;

        // 계정이 삭제 표시된 경우
        if (userData?.deleted === true || userData?.account_status === 'deleted') {
          // 즉시 로그아웃
          await supabaseClient.auth.signOut();

          // Alert로 명확하게 알림
          Alert.alert(
            '탈퇴한 계정',
            '이 계정은 탈퇴 처리되었습니다.\n다른 이메일로 새로운 계정을 만들어 주세요.',
            [{ text: '확인' }],
            { cancelable: false }
          );

          setLoginError('이 계정은 탈퇴 처리되었습니다.');
          setLoading(false);
          return;
        }
      }

      // 메타데이터 확인 통과 - 정상 로그인 처리
      // AuthFlow will automatically handle navigation when authentication state changes
    } catch (error: any) {

      // Check error message for email verification requirement
      const errorMessage = error?.message || error?.msg || '';
      const errorCode = error?.code || '';

      // 먼저 계정이 삭제된 경우를 확인 (Supabase Auth 에러 메시지에서)
      if (errorMessage.toLowerCase().includes('deleted') ||
          errorMessage.toLowerCase().includes('deactivated') ||
          errorMessage.toLowerCase().includes('account has been deleted')) {
        setLoginError('이 계정은 탈퇴 처리되었습니다. 다른 이메일로 새로운 계정을 만들어 주세요.');
      } else if (errorMessage.toLowerCase().includes('email not confirmed') ||
          errorMessage.toLowerCase().includes('email verification') ||
          errorMessage.toLowerCase().includes('confirm your email') ||
          errorMessage.toLowerCase().includes('email_not_confirmed') ||
          errorCode === 'email_not_confirmed') {
        setLoginError('이메일 인증을 진행해주세요. 가입 시 입력한 이메일을 확인해주세요.');
      } else if (errorMessage.toLowerCase().includes('invalid login credentials') ||
                 errorMessage.toLowerCase().includes('invalid email or password') ||
                 errorCode === 'invalid_credentials') {
        setLoginError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
      } else if (errorMessage.toLowerCase().includes('user not found')) {
        setLoginError('등록되지 않은 이메일입니다. 회원가입을 먼저 진행해주세요.');
      } else {
        setLoginError(errorMessage || '로그인에 실패했습니다. 다시 시도해주세요.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Navigate to signup
  const handleSignUpPress = () => {
    navigation.navigate('SignUp');
  };

  // Clear errors when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
    if (loginError) setLoginError('');
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
    if (loginError) setLoginError('');
  };

  return (
    <Surface 
      style={{ 
        flex: 1, 
        backgroundColor: Colors.background.default 
      }}
      testID="login-screen"
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
          testID="login-form"
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
            로그인
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
          <View style={{ marginBottom: 24 }}>
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
              autoComplete="password"
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
          </View>

          {/* Login Error */}
          {loginError ? (
            <Text
              variant="bodyMedium"
              style={{
                color: Colors.status.error,
                fontFamily: 'OpenSans-Regular',
                textAlign: 'center',
                marginBottom: 16
              }}
            >
              {loginError}
            </Text>
          ) : null}

          {/* Login Button */}
          <TouchableOpacity
            onPress={handleLogin}
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
                  로그인 중...
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
                로그인하기
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            onPress={handleSignUpPress}
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
              계정이 없으신가요? 회원가입
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Surface>
  );
};