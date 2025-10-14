import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { PasswordResetService } from '../services/PasswordResetService';

interface VerifyResetCodeScreenProps {
  navigation: any;
  route: any;
}

export const VerifyResetCodeScreen: React.FC<VerifyResetCodeScreenProps> = ({ navigation, route }) => {
  const { email } = route.params;
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [codeError, setCodeError] = useState('');

  // Handle verify code
  const handleVerifyCode = async () => {
    // Clear previous messages
    setCodeError('');

    // Validate code
    if (!code.trim()) {
      setCodeError('재설정 코드를 입력해주세요');
      return;
    }

    if (code.trim().length !== 6) {
      setCodeError('6자리 코드를 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const result = await PasswordResetService.verifyResetCode(email, code.trim());

      if (!result.success) {
        setCodeError(result.error || '코드 인증에 실패했습니다');
        return;
      }

      // OTP verification successful - user is now logged in
      // AuthFlow will automatically detect the password_reset_required flag
      // and show the ResetPasswordScreen

    } catch (error: any) {
      setCodeError(error?.message || '코드 인증에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setCodeError('');
    setLoading(true);

    try {
      const result = await PasswordResetService.sendResetCode(email);

      if (!result.success) {
        setCodeError(result.error || '코드 재전송에 실패했습니다');
        return;
      }

      // Show success message briefly
      setCodeError('');
      alert('재설정 코드가 다시 전송되었습니다.');

    } catch (error: any) {
      setCodeError(error?.message || '코드 재전송에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // Clear error when user starts typing
  const handleCodeChange = (text: string) => {
    // Only allow numbers
    const numericText = text.replace(/[^0-9]/g, '');
    setCode(numericText);
    if (codeError) setCodeError('');
  };

  return (
    <Surface
      style={{
        flex: 1,
        backgroundColor: Colors.background.default
      }}
      testID="verify-reset-code-screen"
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
            재설정 코드 입력
          </Text>

          <Text
            variant="bodyMedium"
            style={{
              color: Colors.text.secondary,
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center',
              marginBottom: 8
            }}
          >
            {email}로 전송된{'\n'}6자리 재설정 코드를 입력하세요
          </Text>

          <Text
            variant="bodySmall"
            style={{
              color: Colors.text.hint,
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center',
              marginBottom: 32
            }}
          >
            이메일이 도착하지 않았다면 스팸 폴더를 확인해주세요
          </Text>

          {/* Code Input */}
          <View style={{ marginBottom: 24 }}>
            <Text
              variant="bodySmall"
              style={{
                color: Colors.text.secondary,
                fontFamily: 'OpenSans-Regular',
                marginBottom: 4
              }}
            >
              재설정 코드
            </Text>
            <RNTextInput
              placeholder="000000"
              value={code}
              onChangeText={handleCodeChange}
              keyboardType="number-pad"
              maxLength={6}
              editable={!loading}
              style={{
                borderWidth: 1,
                borderColor: codeError ? Colors.status.error : Colors.primary.main,
                borderRadius: 8,
                padding: 12,
                backgroundColor: Colors.background.paper,
                color: Colors.text.primary,
                fontFamily: 'OpenSans-Bold',
                fontSize: 24,
                textAlign: 'center',
                letterSpacing: 8
              }}
            />
            {codeError ? (
              <Text
                variant="bodySmall"
                style={{
                  color: Colors.status.error,
                  fontFamily: 'OpenSans-Regular',
                  marginTop: 4
                }}
              >
                {codeError}
              </Text>
            ) : null}
          </View>

          {/* Verify Code Button */}
          <TouchableOpacity
            onPress={handleVerifyCode}
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
                  확인 중...
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
                확인
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Code Link */}
          <TouchableOpacity
            onPress={handleResendCode}
            disabled={loading}
            style={{
              alignItems: 'center',
              marginBottom: 16
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
              코드 재전송
            </Text>
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
                color: Colors.text.secondary,
                fontFamily: 'OpenSans-Regular'
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
