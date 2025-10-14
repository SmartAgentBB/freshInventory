import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { PasswordResetService } from '../services/PasswordResetService';

interface ForgotPasswordScreenProps {
  navigation: any;
}

export const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  // Email validation helper
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle send reset code
  const handleSendResetCode = async () => {
    // Clear previous messages
    setEmailError('');

    // Validate email
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요');
      return;
    }

    if (!validateEmail(email.trim())) {
      setEmailError('올바른 이메일 주소를 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const result = await PasswordResetService.sendResetCode(email.trim());

      if (!result.success) {
        setEmailError(result.error || '재설정 코드 전송에 실패했습니다');
        return;
      }

      // Navigate to verify code screen with email
      navigation.navigate('VerifyResetCode', { email: email.trim() });

    } catch (error: any) {
      setEmailError(error?.message || '재설정 코드 전송에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Clear error when user starts typing
  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError('');
  };

  return (
    <Surface
      style={{
        flex: 1,
        backgroundColor: Colors.background.default
      }}
      testID="forgot-password-screen"
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
            비밀번호 찾기
          </Text>

          <Text
            variant="bodyMedium"
            style={{
              color: Colors.text.secondary,
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center',
              marginBottom: 32
            }}
          >
            가입하신 이메일 주소를 입력하시면{'\n'}비밀번호 재설정 코드를 보내드립니다
          </Text>

          {/* Email Input */}
          <View style={{ marginBottom: 24 }}>
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
              editable={!loading}
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

          {/* Send Reset Code Button */}
          <TouchableOpacity
            onPress={handleSendResetCode}
            disabled={loading}
            style={{
              backgroundColor: Colors.primary.main,
              borderRadius: 28,
              paddingVertical: 16,
              alignItems: 'center',
              marginBottom: 16,
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
                  전송 중...
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
                재설정 코드 보내기
              </Text>
            )}
          </TouchableOpacity>

          {/* Back to Login Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Login')}
            disabled={loading}
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
              로그인으로 돌아가기
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Surface>
  );
};
