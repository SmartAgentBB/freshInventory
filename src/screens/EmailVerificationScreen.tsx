import React, { useState } from 'react';
import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Surface, Text, ActivityIndicator } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

interface EmailVerificationScreenProps {
  navigation: any;
  route: any;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  navigation,
  route
}) => {
  const [loading, setLoading] = useState(false);
  const email = route?.params?.email || '';

  const handleVerificationComplete = () => {
    setLoading(true);

    // 2초 후 로그인 화면으로 이동
    setTimeout(() => {
      setLoading(false);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }, 500);
  };

  return (
    <Surface
      style={{
        flex: 1,
        backgroundColor: Colors.background.default
      }}
      testID="email-verification-screen"
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
            width: '100%',
            alignItems: 'center'
          }}
          testID="email-verification-content"
        >
          {/* Icon */}
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: Colors.primary.light,
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 32
            }}
          >
            <MaterialCommunityIcons
              name="email-check-outline"
              size={56}
              color={Colors.primary.main}
            />
          </View>

          {/* Header */}
          <Text
            variant="headlineMedium"
            style={{
              color: Colors.text.primary,
              fontFamily: 'OpenSans-Bold',
              textAlign: 'center',
              marginBottom: 16
            }}
          >
            이메일을 인증해주세요
          </Text>

          {/* Subheader */}
          <Text
            variant="bodyLarge"
            style={{
              color: Colors.text.secondary,
              fontFamily: 'OpenSans-Regular',
              textAlign: 'center',
              marginBottom: 32,
              lineHeight: 24
            }}
          >
            {email}로 발송된 {'\n'}
            확인 링크를 클릭해주세요
          </Text>

          {/* Instructions */}
          <View
            style={{
              backgroundColor: Colors.background.paper,
              borderRadius: 12,
              padding: 16,
              marginBottom: 32,
              width: '100%',
              borderLeftWidth: 4,
              borderLeftColor: Colors.primary.main
            }}
          >
            <Text
              variant="bodyMedium"
              style={{
                color: Colors.text.primary,
                fontFamily: 'OpenSans-SemiBold',
                marginBottom: 8
              }}
            >
              인증 절차:
            </Text>

            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text
                  style={{
                    color: Colors.primary.main,
                    fontFamily: 'OpenSans-Bold',
                    marginRight: 8,
                    lineHeight: 20
                  }}
                >
                  1.
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: Colors.text.secondary,
                    fontFamily: 'OpenSans-Regular',
                    flex: 1,
                    lineHeight: 20
                  }}
                >
                  이메일 받은편지함을 확인해주세요
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text
                  style={{
                    color: Colors.primary.main,
                    fontFamily: 'OpenSans-Bold',
                    marginRight: 8,
                    lineHeight: 20
                  }}
                >
                  2.
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: Colors.text.secondary,
                    fontFamily: 'OpenSans-Regular',
                    flex: 1,
                    lineHeight: 20
                  }}
                >
                  "이메일 확인" 버튼을 클릭해주세요
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <Text
                  style={{
                    color: Colors.primary.main,
                    fontFamily: 'OpenSans-Bold',
                    marginRight: 8,
                    lineHeight: 20
                  }}
                >
                  3.
                </Text>
                <Text
                  variant="bodySmall"
                  style={{
                    color: Colors.text.secondary,
                    fontFamily: 'OpenSans-Regular',
                    flex: 1,
                    lineHeight: 20
                  }}
                >
                  아래 "인증 완료" 버튼을 누르면 로그인할 수 있습니다
                </Text>
              </View>
            </View>
          </View>

          {/* Tips */}
          <View
            style={{
              backgroundColor: '#E0F2F1',
              borderRadius: 12,
              padding: 12,
              marginBottom: 32,
              width: '100%'
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={20}
                color={Colors.primary.main}
                style={{ marginRight: 8, marginTop: 2 }}
              />
              <Text
                variant="bodySmall"
                style={{
                  color: Colors.text.primary,
                  fontFamily: 'OpenSans-Regular',
                  flex: 1,
                  lineHeight: 18
                }}
              >
                이메일이 보이지 않으면 스팸 폴더를 확인해주세요
              </Text>
            </View>
          </View>

          {/* Verification Complete Button */}
          <TouchableOpacity
            onPress={handleVerificationComplete}
            disabled={loading}
            style={{
              backgroundColor: Colors.primary.main,
              borderRadius: 28,
              paddingVertical: 16,
              alignItems: 'center',
              width: '100%',
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
                  처리 중...
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
                인증 완료
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Surface>
  );
};
