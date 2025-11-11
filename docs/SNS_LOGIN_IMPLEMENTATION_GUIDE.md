# SNS 로그인 구현 가이드

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [전체 개발 일정](#전체-개발-일정)
3. [구글 로그인 (기존)](#1-구글-로그인-기존)
4. [카카오 로그인](#2-카카오-로그인)
5. [Apple 로그인](#3-apple-로그인)

---

## 프로젝트 개요

### 목표
기존 Google 로그인에 **카카오**, **Apple** 로그인을 추가하여 한국 사용자의 90% 이상 커버

### 우선순위
| 순번 | 서비스 | 예상 난이도 | 예상 기간 | 상태 |
|------|---------|-----------|---------|------|
| 1 | Google | ✅ 완료 | - | 기존 구현 |
| 2 | Kakao | 중 | 3-4시간 | 예정 |
| 3 | Apple | 중 | 2-3시간 | 예정 |

---

## 전체 개발 일정

### 일정 개요
```
Week 1
├─ Day 1: Google 개발자 센터 설정 (1-2시간)
├─ Day 2: Google 로그인 코드 구현 (2-3시간)
├─ Day 3: Google 로그인 테스트 및 수정
├─ Day 4: 카카오/Apple 개발자 센터 설정 병렬 진행 (1-2시간)
└─ Day 5: 카카오 로그인 코드 구현 (2-3시간)

Week 2
├─ Day 1: Apple 로그인 코드 구현 (2-3시간)
├─ Day 2: 통합 테스트 (모든 SNS)
├─ Day 3: 버그 수정 및 최적화
├─ Day 4: 배포 준비 및 최종 검증
└─ Day 5: 모니터링 및 사후 처리
```

### 병렬 처리 가능 작업
- Google 개발자 센터 설정 진행 중 app.json과 기본 함수 구조 작성 가능
- Google 코드 구현 중 카카오와 Apple 개발자 센터 설정 동시 진행 가능
- 각 개발자 센터에서 필요한 인증서/키 준비 중 다른 작업 진행 가능

### 우선순위
1. **Google 로그인** (1순위) - 가장 기본적이고 일반적
2. **카카오 로그인** (2순위) - 한국 사용자 중심
3. **Apple 로그인** (3순위) - iOS 사용자 편의성

---

## 1. 구글 로그인 (개발 필요)

### 현재 상태
- ❌ Supabase Google OAuth 연동 **미구현**
- ❌ React Native 구현 **미구현**
- ✅ 기본 `src/services/AuthService.ts` 구조 존재
- ✅ `src/screens/LoginScreen.tsx` 기본 이메일/비밀번호 로그인 구현됨

### 코드 위치
- **AuthService**: `src/services/AuthService.ts` (이메일/비밀번호만 구현)
- **로그인 화면**: `src/screens/LoginScreen.tsx` (SNS 버튼 없음)

### 📍 Step 1: Google Cloud 설정

#### 1-1. Google Cloud Project 생성
1. https://console.cloud.google.com 접속
2. "새 프로젝트" 클릭
3. 프로젝트 이름: `ez2cook` 또는 원하는 이름
4. 생성 클릭

#### 1-2. OAuth 2.0 인증 정보 생성
**위치**: APIs & Services > Credentials

**작업**:
1. "OAuth 동의 화면" 탭 > "외부" 선택 > 만들기
2. 앱 정보 입력:
   - 앱 이름: `ez2cook`
   - 사용자 지원 이메일: 본인 이메일
   - 개발자 연락처: 본인 이메일
3. 저장 및 계속
4. 범위(Scopes) 추가:
   - `email` 선택
   - `profile` 선택
   - `openid` 선택
5. 저장 및 계속
6. 테스트 사용자 추가 (선택사항)

#### 1-3. OAuth 2.0 Client ID 생성
**위치**: Credentials 탭 > 인증정보 만들기

**작업**:
1. "인증정보 만들기" > "OAuth 클라이언트 ID"
2. 애플리케이션 유형: **웹 애플리케이션** 선택
3. 이름: `ez2cook Web` (또는 구분 가능한 이름)
4. 승인된 JavaScript 원본(URIs) 추가:
   - `http://localhost:3000`
   - `http://localhost:8080`
5. 승인된 리다이렉션 URI 추가:
   - Supabase 콜백: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - 예: `https://abcdefghijk.supabase.co/auth/v1/callback`
6. 생성 클릭

**결과**:
- **Client ID** (필수 - Supabase에서 필요)
- **Client Secret** (필수 - Supabase에서 필요)

#### 1-4. iOS 앱용 OAuth Client ID (선택)
앱 배포 시 필요:

**작업**:
1. "인증정보 만들기" > "OAuth 클라이언트 ID"
2. 애플리케이션 유형: **iOS** 선택
3. 이름: `ez2cook iOS`
4. 번들 ID: `com.smartagent.nengpro`
5. 생성 클릭

#### 1-5. Android 앱용 OAuth Client ID (선택)
앱 배포 시 필요:

**작업**:
1. "인증정보 만들기" > "OAuth 클라이언트 ID"
2. 애플리케이션 유형: **Android** 선택
3. 이름: `ez2cook Android`
4. 패키지명: `com.smartagent.nengpro`
5. SHA-1 인증서 지문 입력 (나중에 필요)
6. 생성 클릭

### 📍 Step 2: Supabase 설정

#### 2-1. 대시보드 접속
1. Supabase 대시보드 (https://supabase.com/dashboard)
2. 프로젝트 선택
3. Authentication > Providers

#### 2-2. Google OAuth 활성화
**위치**: Authentication > Providers > Google

**입력 정보**:
- **Client ID**: Google Cloud의 "Client ID"
- **Client Secret**: Google Cloud의 "Client Secret"
- ✅ Enabled: ON으로 설정

**저장** 버튼 클릭

#### 2-3. 콜백 URL 확인
- Supabase의 Google 설정 페이지에 표시된 콜백 URL
- 이 URL이 Google Cloud의 승인된 리다이렉션 URI에 등록되어 있는지 확인

### 📍 Step 3: React Native 코드 구현

#### 3-1. 필요한 라이브러리 설치
```bash
# Google 로그인 라이브러리
npx expo install @react-native-google-signin/google-signin

# iOS 의존성
npx expo install expo-build-properties
```

#### 3-2. app.json 설정
```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-google-signin/google-signin",
        {
          "webClientId": "YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com",
          "iosClientId": "YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com"
        }
      ]
    ]
  }
}
```

**주의**:
- `webClientId`: Google Cloud의 웹 애플리케이션 Client ID
- `iosClientId`: Google Cloud의 iOS 애플리케이션 Client ID

#### 3-3. AuthService.ts 업데이트 (필수)
다음 함수를 `AuthService` 클래스에 추가:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export class AuthService {
  // ... 기존 코드 ...

  /**
   * Initialize Google Sign-In
   */
  initializeGoogleSignIn(webClientId: string): void {
    GoogleSignin.configure({
      webClientId: webClientId,
      offlineAccess: true,
      hostedDomain: undefined,
      forceCodeForRefreshToken: true,
      accountName: '',
    });
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<{ user: User | null; session: Session | null }> {
    try {
      // 1. Google 로그인 시도
      await GoogleSignin.signIn();
      const tokens = await GoogleSignin.getTokens();

      // 2. ID Token을 사용하여 Supabase와 연동
      const { data, error } = await this.supabase.auth.signInWithIdToken({
        provider: 'google',
        token: tokens.idToken,
      });

      if (error) throw error;

      return {
        user: data.user,
        session: data.session,
      };
    } catch (error) {
      console.error('Google login error:', error);
      throw error;
    }
  }

  /**
   * Sign out from Google
   */
  async signOutFromGoogle(): Promise<void> {
    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.error('Google sign out error:', error);
    }
  }
}
```

#### 3-4. LoginScreen.tsx 업데이트 (필수)
Google 로그인 버튼을 추가:

```typescript
// 파일 상단에 추가
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// LoginScreen 컴포넌트 내부에 추가

// 초기화 useEffect
useEffect(() => {
  const initGoogle = async () => {
    try {
      const config = require('../config/googleSignInConfig'); // 별도 설정 파일
      authService.initializeGoogleSignIn(config.webClientId);
    } catch (error) {
      console.error('Failed to initialize Google Sign-In:', error);
    }
  };
  initGoogle();
}, []);

// Google 로그인 핸들러
const handleGoogleLogin = async () => {
  setLoading(true);
  try {
    const result = await authService.signInWithGoogle();
    // AuthFlow가 자동으로 navigation을 처리합니다
    console.log('Google login successful:', result.user?.email);
  } catch (error: any) {
    setLoginError(
      error?.message || '구글 로그인에 실패했습니다. 다시 시도해주세요.'
    );
  } finally {
    setLoading(false);
  }
};

// UI에 버튼 추가 (기존 로그인 버튼 위에)
<TouchableOpacity
  onPress={handleGoogleLogin}
  disabled={loading}
  style={{
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.primary.main,
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'center',
  }}
>
  <MaterialCommunityIcons name="google" size={20} color="#1F2937" />
  <Text
    variant="bodyLarge"
    style={{
      color: Colors.text.primary,
      fontFamily: 'OpenSans-SemiBold',
      marginLeft: 8,
    }}
  >
    Google로 로그인
  </Text>
</TouchableOpacity>
```

### 📍 Step 4: 테스트

#### 4-1. 개발 단계 테스트
```bash
# Expo 개발 서버 시작
npx expo start

# iOS 시뮬레이터 또는 Android 에뮬레이터에서 테스트
```

#### 4-2. 테스트 항목
- ✅ Google 로그인 버튼 노출
- ✅ Google 로그인 화면 정상 표시
- ✅ 사용자 정보 수신 확인
- ✅ Supabase 사용자 생성 확인
- ✅ 로그아웃 후 재로그인 가능 확인
- ✅ 기존 이메일/비밀번호 로그인과 통합 작동

### 📍 주의사항

| 항목 | 내용 |
|------|------|
| **Client Secret** | 안전하게 관리, 외부 노출 금지 |
| **Client ID** | app.json에 입력, Git에 커밋 가능 (일반 정보) |
| **콜백 URL** | Google Cloud와 Supabase에서 정확히 일치해야 함 |
| **iOS 인증서** | 실제 iPhone에서 테스트 시 필요 |
| **Android SHA-1** | 실제 Android 기기 테스트 시 필요 |

---

## 2. 카카오 로그인

### 📍 Step 1: 카카오 개발자 센터 설정

#### 1-1. 카카오 개발자 계정 생성
1. https://developers.kakao.com 접속
2. 회원가입 (또는 로그인)
3. 실명 인증 완료

#### 1-2. 애플리케이션 등록
**위치**: 내 애플리케이션 > 애플리케이션 추가

**필수 입력 정보**:
- **앱 이름**: `ez2cook` (또는 프로젝트명)
- **사업자명**: 개인인 경우 본인 이름
- **앱 아이콘**: 준비된 아이콘 업로드

**등록 후**:
- 앱이 생성되고 **앱 ID**(숫자)가 발급됨
- 이 ID는 이후 모든 설정에서 필요

#### 1-3. 앱 설정 - 기본 정보
**위치**: 내 애플리케이션 > [등록한 앱] > 앱 설정 > 기본 정보

**확인 항목**:
- ✅ 앱 ID (나중에 필요)
- ✅ REST API 키 (필수 - Supabase에서 필요)
- ❌ JavaScript 키는 사용하지 않음

#### 1-4. 카카오 로그인 활성화 (매우 중요!)
**위치**: 내 애플리케이션 > [등록한 앱] > 제품 설정 > 카카오 로그인

**필수 설정**:

1. **카카오 로그인 활성화**
   - 상단의 토글 스위치를 **ON**으로 변경

2. **Redirect URI 등록**
   - 추가 > URI 입력
   - Supabase 콜백 URI: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - 예: `https://abcdefghijk.supabase.co/auth/v1/callback`
   - ✅ 저장

3. **보안 > Client Secret Code 생성**
   - "코드 생성" 버튼 클릭
   - Client Secret이 생성됨 (이후 Supabase에서 필요)

#### 1-5. 동의항목 설정 (선택사항이지만 권장)
**위치**: 내 애플리케이션 > [등록한 앱] > 제품 설정 > 카카오 로그인 > 동의항목

**필수 동의항목** (Supabase 연동 시 필요):
- ✅ `nickname` (닉네임) - 필수
- ✅ `profile_image` (프로필 사진) - 필수
- ✅ `account_email` (이메일) - 필수

각 항목의 "필수 선택" 옆 토글을 ON으로 설정

#### 1-6. 앱 심사 (선택사항)
**개발 단계**에서는 불필요하지만, **실제 배포** 전에는 필수:
- 위치: 내 애플리케이션 > [등록한 앱] > 제품 설정 > 카카오 로그인 > 앱 심사
- 사용할 기능들을 선택하여 심사 신청

### 📍 Step 2: Supabase 설정

#### 2-1. 대시보드 접속
1. Supabase 대시보드 (https://supabase.com/dashboard)
2. 프로젝트 선택
3. Authentication > Providers

#### 2-2. 카카오 OAuth 활성화
**위치**: Authentication > Providers > Kakao

**입력 정보**:
- **Client ID**: 카카오의 "REST API 키"
- **Client Secret**: 카카오의 "Client Secret Code"
- ✅ Enabled: ON으로 설정

**저장** 버튼 클릭

#### 2-3. 콜백 URL 확인
- Supabase의 Kakao 설정 페이지에 표시된 콜백 URL
- 이 URL이 카카오 개발자 센터의 Redirect URI에 등록되어 있는지 확인

### 📍 Step 3: React Native 코드 구현

#### 3-1. 필요한 라이브러리 설치
```bash
# Kakao 로그인 라이브러리
npx expo install @react-native-seoul/kakao-login

# iOS 의존성
npx expo install expo-build-properties
```

#### 3-2. app.json 설정
```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-seoul/kakao-login",
        {
          "kakaoNativeAppKey": "YOUR_KAKAO_NATIVE_APP_KEY",
          "kakaoOAuthHost": "https://kauth.kakao.com"
        }
      ]
    ]
  }
}
```

**주의**: `YOUR_KAKAO_NATIVE_APP_KEY`는 카카오 개발자 센터의 앱 ID (숫자)

#### 3-3. AuthService.ts 업데이트
```typescript
// 카카오 로그인 함수 추가
export const signInWithKakao = async (): Promise<void> => {
  try {
    // 1. Kakao 로그인 시도
    const token = await login();

    // 2. 토큰을 사용하여 Supabase와 연동
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'kakao',
      token: token.accessToken,
    });

    if (error) throw error;

    console.log('Kakao login successful:', data);
  } catch (error) {
    console.error('Kakao login error:', error);
    throw error;
  }
};
```

#### 3-4. 로그인 화면에 버튼 추가
- 기존 Google 로그인 버튼 옆에 "카카오로 로그인" 버튼 추가
- 버튼 클릭 시 `signInWithKakao()` 호출

### 📍 Step 4: 테스트

#### 4-1. 개발 단계 테스트
```bash
# Expo 개발 서버 시작
npx expo start

# iOS 시뮬레이터 또는 Android 에뮬레이터에서 테스트
# 카카오톡 앱이 설치되어 있지 않으면 카카오 계정으로 로그인
```

#### 4-2. 테스트 항목
- ✅ 카카오 로그인 버튼 노출
- ✅ 로그인 화면 정상 표시
- ✅ 사용자 정보 수신 확인
- ✅ Supabase 사용자 생성 확인
- ✅ 로그아웃 후 재로그인 가능 확인

### 📍 주의사항

| 항목 | 내용 |
|------|------|
| **Native App Key** | 앱 ID (숫자) 사용, REST API 키와 혼동하지 않기 |
| **Redirect URI** | Supabase 콜백 URL과 정확히 일치해야 함 |
| **Client Secret** | 안전하게 관리, 외부 노출 금지 |
| **테스트 기기** | 카카오톡 미설치 시 카카오 계정으로 로그인 (자동 전환) |
| **앱 심사** | 개발 단계에서는 불필요, 배포 전 필수 |

---

## 3. Apple 로그인

### 📍 Step 1: Apple Developer 설정

#### 1-1. Apple Developer 계정 준비
1. https://developer.apple.com 접속
2. 로그인 (Apple ID 필요)
3. "Account" > "Membership" 확인 (유료 회원만 가능)

**비용**: 연 $99 (개발자 프로그램)

#### 1-2. Certificates, Identifiers & Profiles 접속
**위치**: https://developer.apple.com/account/resources

### 📍 Step 2: 앱 ID 생성 (App ID)

#### 2-1. Identifiers 등록
**위치**: Certificates, Identifiers & Profiles > Identifiers

**작업**:
1. 좌측 상단 "+" 버튼 클릭
2. 리소스 타입에서 "App IDs" 선택
3. Type에서 "App" 선택

#### 2-2. App ID 설정
**필수 정보**:
- **Description**: `ez2cook` (또는 앱 이름)
- **Bundle ID**: `com.smartagent.nengpro` (프로젝트 번들 ID)
- **Capabilities**: "Sign in with Apple" 체크 ✅

**저장**: Register 버튼 클릭

**결과**:
- App ID가 생성됨
- 이후 "Services ID" 생성 시 연결됨

#### 2-3. Identifiers 목록에서 앱 ID 확인
- 새로 등록된 `com.smartagent.nengpro` 확인
- 이 앱 ID는 나중에 Team ID와 함께 필요

### 📍 Step 3: Services ID 생성 (웹 리다이렉션용)

#### 3-1. Services ID 등록
**위치**: Certificates, Identifiers & Profiles > Identifiers

**작업**:
1. 좌측 상단 "+" 버튼 클릭
2. 리소스 타입에서 "Services IDs" 선택

#### 3-2. Services ID 설정
**필수 정보**:
- **Description**: `ez2cook Web` (또는 구분 가능한 이름)
- **Identifier**: `com.smartagent.nengpro.web` (유니크한 ID)
- **Sign in with Apple**: 체크 ✅

**저장**: Register 버튼 클릭

#### 3-3. Redirect URI 설정
**등록 후**:
1. 방금 생성한 Services ID 클릭
2. "Sign in with Apple" 옆 "Configure" 버튼
3. Primary App ID: `com.smartagent.nengpro` 선택
4. Return URLs 추가:
   - Supabase 콜백 URL: `https://<PROJECT_REF>.supabase.co/auth/v1/callback`
   - 예: `https://abcdefghijk.supabase.co/auth/v1/callback`
5. **Save** 버튼 클릭

**결과**:
- Services ID: `com.smartagent.nengpro.web` (나중에 필요)

### 📍 Step 4: 서명 키 생성 (Private Key)

#### 4-1. Keys 페이지 접속
**위치**: Certificates, Identifiers & Profiles > Keys

#### 4-2. 새 키 생성
**작업**:
1. 좌측 상단 "+" 버튼 클릭
2. Key Name: `ez2cook Apple Login Key` (구분 가능한 이름)
3. **"Sign in with Apple" 체크** ✅
4. Configure 버튼 클릭

#### 4-3. 앱 ID 선택
- Primary App ID: `com.smartagent.nengpro` 선택
- **Save** 버튼 클릭

#### 4-4. 키 다운로드 (중요!)
1. 다시 "Keys" 페이지에서 생성한 키 확인
2. **다운로드** 버튼 클릭
3. `.p8` 파일 저장 (절대 삭제 금지!)
   - 파일명: `AuthKey_<KEY_ID>.p8`
   - 이 KEY_ID도 나중에 필요

**주의**: 이 파일은 한 번만 다운로드 가능! 잃어버리면 다시 생성해야 함

#### 4-5. Key ID 확인
- Keys 목록에서 생성한 키의 "Key ID" 확인
- 형식: `ABC123DEF4` (10자)

### 📍 Step 5: 필수 정보 정리

**다음 정보들을 정리해서 저장** (Supabase 설정 시 필요):

```
Apple Developer 정보
├─ Team ID: XXXXXXXXXX (10자, Apple Developer > Account Settings > Membership)
├─ App ID: com.smartagent.nengpro
├─ Services ID: com.smartagent.nengpro.web
├─ Key ID: ABC123DEF4 (10자)
└─ Private Key: AuthKey_ABC123DEF4.p8 (파일)
```

### 📍 Step 6: Supabase 설정

#### 6-1. 대시보드 접속
1. Supabase 대시보드 (https://supabase.com/dashboard)
2. 프로젝트 선택
3. Authentication > Providers

#### 6-2. Apple OAuth 활성화
**위치**: Authentication > Providers > Apple

**입력 정보**:
- **Team ID**: Apple Developer Team ID (10자)
- **Bundle ID**: `com.smartagent.nengpro`
- **Client ID (Services ID)**: `com.smartagent.nengpro.web`
- **Key ID**: `ABC123DEF4` (10자)
- **Private Key**: `.p8` 파일의 전체 내용 (-----BEGIN ... END-----까지)

**저장** 버튼 클릭

#### 6-3. 콜백 URL 확인
- Supabase의 Apple 설정 페이지에 표시된 콜백 URL
- 이 URL이 Apple Developer의 Return URLs에 등록되어 있는지 확인

### 📍 Step 7: React Native 코드 구현

#### 7-1. 필수 설정 - app.json 수정
```json
{
  "expo": {
    "ios": {
      "usesAppleSignIn": true,
      "bundleIdentifier": "com.smartagent.nengpro"
    }
  }
}
```

#### 7-2. 라이브러리 설치
```bash
# Apple 인증 라이브러리
npx expo install expo-apple-authentication

# 또는 대안
npx expo install @invertase/react-native-apple-authentication
```

#### 7-3. AuthService.ts 업데이트
```typescript
import * as AppleAuthentication from 'expo-apple-authentication';

export const signInWithApple = async (): Promise<void> => {
  try {
    // 1. Apple 로그인 시도
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    // 2. ID Token을 사용하여 Supabase와 연동
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken!,
    });

    if (error) throw error;

    console.log('Apple login successful:', data);
  } catch (error) {
    if (error.code === 'ERR_CANCELED') {
      console.log('Apple login was cancelled');
    } else {
      console.error('Apple login error:', error);
      throw error;
    }
  }
};
```

#### 7-4. 로그인 화면에 버튼 추가
- Google, Kakao 버튼 옆에 "Apple로 로그인" 버튼 추가
- 버튼 클릭 시 `signInWithApple()` 호출
- Apple 권장 버튼 스타일 사용 (검은 배경, 흰 글자)

### 📍 Step 8: 테스트

#### 8-1. 개발 단계 테스트
```bash
# Expo 개발 서버 시작
npx expo start

# iOS 시뮬레이터 또는 실제 iPhone에서 테스트
# (Android에서는 Apple 로그인 불가)
```

#### 8-2. 테스트 항목
- ✅ Apple 로그인 버튼 노출 (iOS만)
- ✅ 로그인 화면 정상 표시
- ✅ Touch ID/Face ID 또는 계정 선택 화면
- ✅ 사용자 정보 수신 확인
- ✅ Supabase 사용자 생성 확인
- ✅ 로그아웃 후 재로그인 가능 확인

### 📍 주의사항

| 항목 | 내용 |
|------|------|
| **Private Key 관리** | `.p8` 파일은 안전하게 보관, 외부 노출 금지 |
| **Key 유효기간** | 별도 만료기간 없으나, Apple이 주기적으로 갱신 권장 |
| **Team ID** | Apple Developer 계정 > Account Settings에서 확인 |
| **Bundle ID** | 앱 ID와 정확히 일치해야 함 |
| **iOS 전용** | Android는 미지원 |
| **첫 로그인 시** | 사용자의 이름/이메일이 `null`로 반환될 수 있음 (Apple 정책) |

### 📍 Apple 로그인 일반적 흐름

```
사용자 선택 (또는 Touch ID/Face ID)
           ↓
Apple 로그인 화면
           ↓
ID Token 발급
           ↓
Supabase 검증
           ↓
사용자 생성 또는 기존 사용자 로그인
           ↓
앱 진입
```

---

## 🔄 전체 통합 플로우

### 1. 로그인 화면 UI 구조
```
┌─────────────────────────────────┐
│      ez2cook 로그인            │
├─────────────────────────────────┤
│  [Google로 로그인]              │
│  [카카오로 로그인]              │
│  [Apple로 로그인]               │
│                                 │
│  또는 이메일로 로그인            │
│  [회원가입 / 로그인]            │
└─────────────────────────────────┘
```

### 2. 인증 흐름
```
사용자 클릭
  ↓
선택한 SNS 로그인 함수 호출
  ↓
SNS 인증 서버 (Google/Kakao/Apple)
  ↓
Token/ID Token 발급
  ↓
Supabase signInWithIdToken() 또는 signInWithOAuth()
  ↓
Supabase 검증 및 사용자 관리
  ↓
AuthContext 업데이트
  ↓
앱 진입
```

### 3. 코드 조직화
```
src/
├── services/
│   └── AuthService.ts
│       ├── signInWithGoogle()
│       ├── signInWithKakao()
│       └── signInWithApple()
├── screens/
│   └── LoginScreen.tsx
│       ├── Google 버튼
│       ├── Kakao 버튼
│       └── Apple 버튼
└── context/
    └── AuthContext.tsx (기존)
```

---

## 📱 환경 변수 (.env)

추가로 필요한 환경 변수는 **없음** (모두 Supabase에서 관리)

기존 환경 변수만 유지:
```
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY=...
```

---

## ✅ 체크리스트

### Google 로그인
- [ ] Google Cloud 계정 및 프로젝트 생성
- [ ] OAuth 2.0 동의 화면 설정
- [ ] 웹 애플리케이션 Client ID 생성
- [ ] iOS 애플리케이션 Client ID 생성 (선택)
- [ ] Android 애플리케이션 Client ID 생성 (선택)
- [ ] Supabase에서 Google 활성화
- [ ] app.json에 Google Sign-In 플러그인 설정
- [ ] React Native 라이브러리 설치
- [ ] AuthService.ts에 Google 함수 구현
  - [ ] `initializeGoogleSignIn()`
  - [ ] `signInWithGoogle()`
  - [ ] `signOutFromGoogle()`
- [ ] LoginScreen.tsx에 Google 로그인 버튼 추가
- [ ] Google 로그인 테스트
  - [ ] iOS 시뮬레이터
  - [ ] Android 에뮬레이터
- [ ] 에러 처리 확인

### 카카오 로그인
- [ ] 카카오 개발자 계정 생성
- [ ] 애플리케이션 등록
- [ ] REST API 키 및 Client Secret 확인
- [ ] Redirect URI 등록
- [ ] Supabase에서 Kakao 활성화
- [ ] React Native 라이브러리 설치
- [ ] app.json에 Kakao Sign-In 플러그인 설정
- [ ] AuthService.ts에 Kakao 함수 구현
  - [ ] `signInWithKakao()`
  - [ ] `signOutFromKakao()`
- [ ] LoginScreen.tsx에 Kakao 로그인 버튼 추가
- [ ] 카카오 로그인 테스트
  - [ ] iOS 시뮬레이터
  - [ ] Android 에뮬레이터
- [ ] 에러 처리 확인

### Apple 로그인
- [ ] Apple Developer 계정 확인 (유료)
- [ ] App ID 생성
- [ ] Services ID 생성
- [ ] Private Key (.p8) 다운로드 및 보관
- [ ] 필수 정보 정리 (Team ID, Key ID 등)
- [ ] Supabase에서 Apple 활성화
- [ ] app.json에 Apple Sign-In 설정 추가
- [ ] React Native 라이브러리 설치
- [ ] AuthService.ts에 Apple 함수 구현
  - [ ] `signInWithApple()`
  - [ ] `signOutFromApple()`
- [ ] LoginScreen.tsx에 Apple 로그인 버튼 추가
- [ ] Apple 로그인 테스트
  - [ ] iOS 실제 기기 (필수)
  - [ ] iOS 시뮬레이터 (선택)
- [ ] 에러 처리 확인

### 통합 테스트
- [ ] Google 로그인 정상 작동
- [ ] 카카오 로그인 정상 작동
- [ ] Apple 로그인 정상 작동
- [ ] 세 가지 로그인 방식 모두 사용자 생성 확인
- [ ] 로그인/로그아웃 반복 테스트
- [ ] 기존 이메일/비밀번호 로그인과 호환성 확인
- [ ] SNS 로그인 후 기존 사용자로 로그인 시 동일 계정 처리 확인
- [ ] 에러 처리 및 사용자 메시지 확인
- [ ] 네트워크 오류 처리 확인

### 최종 배포
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 보안 검토 완료 (Client Secret 노출 확인)
- [ ] 환경 변수 설정 확인
- [ ] 앱 스토어 배포 전 최종 검증

---

## 📞 문제 해결

### Google 로그인
| 문제 | 원인 | 해결방법 |
|------|------|--------|
| "OAuth 스크린 구성 오류" | OAuth 동의 화면 미설정 | Google Cloud Console > APIs & Services > OAuth 동의 화면 설정 |
| "리다이렉트 URI 불일치" | Google Cloud 설정 오류 | Google Cloud와 Supabase의 콜백 URL이 정확히 동일한지 확인 |
| "Client ID를 찾을 수 없음" | app.json 설정 오류 | `webClientId`가 올바른 Google Client ID인지 확인 |
| "로그인 화면이 나타나지 않음" | GoogleSignin 초기화 미흡 | `initializeGoogleSignIn()`이 호출되는지 확인 |
| "토큰 오류" | 라이브러리 버전 호환성 | `@react-native-google-signin/google-signin` 버전 확인 |

### 카카오 로그인
| 문제 | 원인 | 해결방법 |
|------|------|--------|
| "리다이렉트 URL이 일치하지 않음" | Redirect URI 오타 | 카카오와 Supabase에서 정확히 동일한 URL 확인 |
| 로그인 후 앱으로 돌아오지 않음 | 딥링크 설정 미흡 | app.json의 scheme 설정 확인 |
| "앱이 등록되지 않음" | Native App Key 오류 | 앱 ID (숫자)를 REST API 키와 혼동하지 않기 |
| "카카오 로그인 활성화 안됨" | 개발자 센터 설정 미흡 | 제품 설정 > 카카오 로그인 > 토글 ON 확인 |

### Apple 로그인
| 문제 | 원인 | 해결방법 |
|------|------|--------|
| "Invalid client_id" | Services ID 오류 | `com.smartagent.nengpro.web` 정확히 확인 |
| Private Key 오류 | 파일 내용 복사 오류 | `.p8` 파일 전체 내용 (-----BEGIN...END-----) 포함 |
| iOS 시뮬레이터에서 작동 안함 | 시뮬레이터 제한 | 실제 iPhone에서 테스트 |
| "The authorization request failed with error code: invalid_request" | Supabase 설정 불완전 | Team ID, Client ID, Key ID 모두 정확히 입력 확인 |
| "Key ID를 찾을 수 없음" | Private Key 다운로드 오류 | Apple Developer Console에서 Keys 페이지에서 Key ID 재확인 |

### 일반적인 에러
| 문제 | 원인 | 해결방법 |
|------|------|--------|
| "모든 SNS 로그인 버튼이 작동 안함" | Supabase 연결 오류 | Supabase 프로젝트가 올바르게 연결되었는지 확인 |
| "로그인은 되지만 사용자 정보 없음" | Scope 설정 오류 | 각 SNS에서 email, profile 등 필요한 scope가 활성화되었는지 확인 |
| "개발 중에는 되지만 배포 후 안됨" | 번들 ID/패키지 명 불일치 | iOS 번들 ID, Android 패키지명이 앱 설정과 일치하는지 확인 |

---

## 📚 참고 자료

### Google 로그인
- [Google Cloud Console](https://console.cloud.google.com)
- [Google OAuth 2.0 문서](https://developers.google.com/identity/protocols/oauth2)
- [React Native Google Sign-In](https://github.com/react-native-google-signin/google-signin)
- [Supabase Google 로그인](https://supabase.com/docs/guides/auth/social-login/auth-google)

### 카카오 로그인 문서
- [카카오 로그인 문서](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Supabase 카카오 로그인](https://supabase.com/docs/guides/auth/social-login/auth-kakao)
- [React Native Seoul Kakao Login](https://github.com/crossplatformkorea/react-native-kakao-login)

### Apple 로그인
- [Apple Sign in with Apple 문서](https://developer.apple.com/sign-in-with-apple/)
- [Supabase Apple 로그인](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- [Expo Apple Authentication](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)

### React Native / Expo
- [Expo 인증 문서](https://docs.expo.dev/develop/authentication/)
- [Expo 빌드 설정](https://docs.expo.dev/build-reference/app-config/)
- [Supabase React Native 가이드](https://supabase.com/docs/guides/auth/quickstarts/with-expo-react-native-social-auth)

---

## 🎯 다음 단계

### 즉시 실행 항목 (오늘)
1. **이 문서 검토** - 전체 내용 이해
2. **Google Cloud 계정 및 프로젝트 생성** - console.cloud.google.com

### Week 1 계획
1. **Google 로그인 개발자 센터 설정 완료** (1-2시간)
2. **Google 로그인 코드 구현** (2-3시간)
   - AuthService.ts에 함수 추가
   - LoginScreen.tsx에 버튼 추가
   - app.json 설정
3. **Google 로그인 테스트** (1시간)
4. **카카오/Apple 개발자 센터 설정 병렬 진행** (1-2시간)

### Week 2 계획
1. **카카오 로그인 코드 구현** (2-3시간)
2. **Apple 로그인 코드 구현** (2-3시간)
3. **통합 테스트 및 버그 수정** (2시간)
4. **배포 준비** (1시간)

### 우선순위
```
1순위: Google 로그인 (기초 구현)
       ↓
2순위: 카카오 로그인 (한국 사용자)
       ↓
3순위: Apple 로그인 (iOS 사용자)
```

### 필수 준비물
- [ ] Google Cloud 계정
- [ ] 카카오 개발자 계정
- [ ] Apple Developer 계정 (유료 - $99/년)
- [ ] 각 서비스의 Client ID/Secret 정보
- [ ] Supabase 프로젝트 접근 권한

---

**작성일**: 2025년 10월 31일
**버전**: 1.0
**담당자**: (개발팀)
