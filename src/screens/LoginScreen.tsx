import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { AuthService } from '../services/AuthService';

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
      const result = await authService.signInWithPassword(email.trim(), password.trim());

      // AuthFlow will automatically handle navigation when authentication state changes
      // No need to manually navigate
    } catch (error) {
      setLoginError('로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.');
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
            {emailError && (
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
            )}
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
            {passwordError && (
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
            )}
          </View>

          {/* Login Error */}
          {loginError && (
            <Text 
              variant="bodyMedium"
              style={{
                color: Colors.error,
                fontFamily: 'OpenSans-Regular',
                textAlign: 'center',
                marginBottom: 16
              }}
            >
              {loginError}
            </Text>
          )}

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