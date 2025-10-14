import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity, TextInput as RNTextInput } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { Colors } from '../constants/colors';
import { PasswordResetService } from '../services/PasswordResetService';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

interface ResetPasswordScreenProps {
  navigation: any;
  route: any;
}

export const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validate passwords match
  const validatePasswords = (): boolean => {
    setPasswordError('');
    setConfirmPasswordError('');

    // Validate password strength
    const validation = PasswordResetService.validatePassword(password);
    if (!validation.isValid) {
      setPasswordError(validation.error || '');
      return false;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다');
      return false;
    }

    return true;
  };

  // Handle reset password
  const handleResetPassword = async () => {
    if (!validatePasswords()) {
      return;
    }

    setLoading(true);

    try {
      const result = await PasswordResetService.updatePassword(password);

      if (!result.success) {
        setPasswordError(result.error || '비밀번호 변경에 실패했습니다');
        return;
      }

      // Show success message
      alert('비밀번호가 성공적으로 변경되었습니다.');

      // Sign out and navigate to login
      await PasswordResetService.signOut();
      // Navigation will happen automatically when user is signed out

    } catch (error: any) {
      setPasswordError(error?.message || '비밀번호 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // Clear errors when user starts typing
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError('');
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    if (confirmPasswordError) setConfirmPasswordError('');
  };

  // Check if form is valid
  const isFormValid = () => {
    return password.length >= 6 &&
           confirmPassword.length >= 6 &&
           password === confirmPassword;
  };

  return (
    <Surface
      style={{
        flex: 1,
        backgroundColor: Colors.background.default
      }}
      testID="reset-password-screen"
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
            새 비밀번호 설정
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
            새로운 비밀번호를 입력해주세요
          </Text>

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
              새 비밀번호
            </Text>
            <View style={{ position: 'relative' }}>
              <RNTextInput
                placeholder="비밀번호 (6자 이상, 영문+숫자)"
                value={password}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showPassword}
                editable={!loading}
                style={{
                  borderWidth: 1,
                  borderColor: passwordError ? Colors.status.error : Colors.primary.main,
                  borderRadius: 8,
                  padding: 12,
                  paddingRight: 50,
                  backgroundColor: Colors.background.paper,
                  color: Colors.text.primary,
                  fontFamily: 'OpenSans-Regular'
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12
                }}
              >
                <MaterialCommunityIcons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={Colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
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
            ) : (
              <Text
                variant="bodySmall"
                style={{
                  color: Colors.text.hint,
                  fontFamily: 'OpenSans-Regular',
                  marginTop: 4
                }}
              >
                영문자와 숫자를 포함하여 6자 이상 입력하세요
              </Text>
            )}
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
              새 비밀번호 확인
            </Text>
            <View style={{ position: 'relative' }}>
              <RNTextInput
                placeholder="비밀번호 확인"
                value={confirmPassword}
                onChangeText={handleConfirmPasswordChange}
                secureTextEntry={!showConfirmPassword}
                editable={!loading}
                style={{
                  borderWidth: 1,
                  borderColor: confirmPasswordError ? Colors.status.error : Colors.primary.main,
                  borderRadius: 8,
                  padding: 12,
                  paddingRight: 50,
                  backgroundColor: Colors.background.paper,
                  color: Colors.text.primary,
                  fontFamily: 'OpenSans-Regular'
                }}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 12
                }}
              >
                <MaterialCommunityIcons
                  name={showConfirmPassword ? 'eye-off' : 'eye'}
                  size={24}
                  color={Colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
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

          {/* Reset Password Button */}
          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={loading || !isFormValid()}
            style={{
              backgroundColor: Colors.primary.main,
              borderRadius: 28,
              paddingVertical: 16,
              alignItems: 'center',
              opacity: (loading || !isFormValid()) ? 0.5 : 1
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
                  변경 중...
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
                비밀번호 재설정
              </Text>
            )}
          </TouchableOpacity>

          <Text
            variant="bodySmall"
            style={{
              color: Colors.text.hint,
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center',
              marginTop: 16
            }}
          >
            비밀번호를 재설정해야 앱을 사용할 수 있습니다
          </Text>
        </View>
      </ScrollView>
    </Surface>
  );
};
