# 에뮬레이터 실행 문제 해결 가이드

## ❌ 문제: "No development build for this project is installed"

에뮬레이터에서 `a` 키를 입력했을 때 다음 에러가 발생하는 경우:

```
CommandError: No development build (com.smartagent.nengpro) for this project is installed.
Install a development build on the target device and try again.
```

### 원인
Expo SDK 54부터는 네이티브 모듈을 사용하는 경우 **개발 빌드(Development Build)**가 필요합니다. 이전처럼 Expo Go 앱으로는 실행할 수 없습니다.

---

## ✅ 해결 방법

### 방법 1: 개발 빌드 생성 및 설치 (권장)

#### Step 1: Android 네이티브 코드 생성
```bash
# 프로젝트 루트 디렉토리에서 실행
npx expo prebuild --platform android
```

이 명령은 `android/` 폴더를 생성하고 네이티브 Android 프로젝트를 준비합니다.

#### Step 2: 개발 서버 시작
```bash
# 개발 서버 시작
npx expo start --dev-client
```

**중요**: `--dev-client` 플래그를 반드시 포함해야 합니다!

#### Step 3: 에뮬레이터에서 개발 빌드 실행
새 터미널을 열고 다음 명령 실행:
```bash
# Android 개발 빌드 실행 및 설치
npx expo run:android
```

이 명령은:
1. Android 프로젝트를 빌드
2. 개발 빌드 APK를 생성
3. 에뮬레이터에 자동 설치
4. 앱을 실행

#### Step 4: 앱 확인
- 에뮬레이터에 "냉프로" 앱이 설치됨
- 앱이 자동으로 실행되고 개발 서버에 연결됨
- Hot Reload 및 Fast Refresh 사용 가능

---

### 방법 2: Android Studio로 빌드 (대안)

#### Step 1: prebuild 실행 (아직 안 했다면)
```bash
npx expo prebuild --platform android
```

#### Step 2: Android Studio에서 프로젝트 열기
1. Android Studio 실행
2. "Open an Existing Project" 선택
3. `[프로젝트경로]/android` 폴더 선택
4. Gradle 동기화 대기 (최초 실행 시 5-10분 소요)

#### Step 3: Gradle 동기화 확인
- 하단에 "Gradle sync finished" 메시지 확인
- 에러 발생 시:
  ```bash
  # 프로젝트 루트에서 Gradle 의존성 재설치
  cd android
  ./gradlew clean
  ./gradlew build
  cd ..
  ```

#### Step 4: 에뮬레이터 선택 및 실행
1. 상단 툴바에서 타블렛 에뮬레이터 선택 (예: Tablet_7inch_API34)
2. ▶️ (Run 'app') 버튼 클릭
3. 빌드 완료 후 에뮬레이터에 앱 설치 및 실행

#### Step 5: Expo 개발 서버 연결
별도 터미널에서:
```bash
npx expo start --dev-client
```

앱이 자동으로 개발 서버를 찾아 연결합니다.

---

## 🔄 이후 개발 워크플로우

개발 빌드를 한 번 설치한 후에는 다음과 같이 사용합니다:

### 일반적인 코드 변경 시
```bash
# 1. 개발 서버만 시작
npx expo start --dev-client

# 2. 에뮬레이터에서 이미 설치된 앱 실행
# (Hot Reload로 자동 업데이트됨)
```

### 네이티브 코드 변경 시 (새로운 패키지 설치 등)
```bash
# 1. 네이티브 코드 재생성
npx expo prebuild --platform android --clean

# 2. 개발 빌드 재설치
npx expo run:android

# 3. 개발 서버 시작
npx expo start --dev-client
```

---

## 🔍 자주 발생하는 문제

### 문제 1: "Could not connect to development server"

**원인**: 개발 서버가 실행되지 않았거나 연결할 수 없음

**해결**:
```bash
# 1. 개발 서버 확인
npx expo start --dev-client

# 2. 에뮬레이터에서 앱의 개발 메뉴 열기
# - Android: Ctrl+M (에뮬레이터에서) 또는 디바이스 흔들기
# - "Configure Bundler" → "localhost:8081" 입력
```

### 문제 2: "Task :app:installDebug FAILED"

**원인**: Gradle 빌드 실패 또는 ADB 연결 문제

**해결**:
```bash
# 1. ADB 재시작
adb kill-server
adb start-server

# 2. 에뮬레이터 연결 확인
adb devices

# 3. Gradle 캐시 삭제
cd android
./gradlew clean
cd ..

# 4. node_modules 재설치 (필요시)
rm -rf node_modules
npm install
```

### 문제 3: "INSTALL_FAILED_UPDATE_INCOMPATIBLE"

**원인**: 이전 버전의 앱이 다른 서명으로 설치되어 있음

**해결**:
```bash
# 기존 앱 완전 삭제
adb uninstall com.smartagent.nengpro

# 개발 빌드 재설치
npx expo run:android
```

### 문제 4: prebuild 실행 시 에러

**원인**: package.json의 의존성과 네이티브 코드 불일치

**해결**:
```bash
# 1. android 폴더 삭제
rm -rf android

# 2. node_modules 재설치
rm -rf node_modules
npm install

# 3. prebuild 재실행
npx expo prebuild --platform android --clean
```

### 문제 5: 에뮬레이터에서 앱이 계속 크래시

**원인**: 네이티브 모듈 초기화 실패

**해결**:
```bash
# Logcat으로 에러 확인
adb logcat *:E

# 자주 발생하는 원인:
# - 환경 변수 누락 (.env 파일 확인)
# - Supabase 연결 실패 (EXPO_PUBLIC_SUPABASE_* 확인)
# - Google AI API 키 오류 (EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY 확인)
```

---

## 📊 명령어 비교표

| 목적 | 명령어 | 사용 시기 |
|------|--------|-----------|
| 네이티브 코드 생성 | `npx expo prebuild` | 최초 설정 또는 새 패키지 설치 후 |
| 개발 빌드 설치 | `npx expo run:android` | prebuild 후 또는 네이티브 코드 변경 시 |
| 개발 서버 시작 | `npx expo start --dev-client` | 일반적인 개발 작업 시 |
| 일반 Expo 시작 | `npx expo start` | Expo Go 사용 시 (현재 프로젝트는 불가) |

---

## 🎯 권장 워크플로우

### 최초 설정 (새로운 PC에서)
```bash
# 1. 프로젝트 클론
git clone [repo-url]
cd ez2cook

# 2. 의존성 설치
npm install

# 3. 환경 변수 설정
# .env 파일 생성 및 API 키 입력

# 4. 네이티브 코드 생성
npx expo prebuild --platform android

# 5. 에뮬레이터 시작 (Android Studio에서)

# 6. 개발 빌드 설치
npx expo run:android

# 7. 완료! 이후 개발 서버만 시작
npx expo start --dev-client
```

### 일상적인 개발
```bash
# 1. 에뮬레이터 시작

# 2. 개발 서버 시작
npx expo start --dev-client

# 3. 코드 수정 → Hot Reload 자동 적용
```

### 새 패키지 설치 후
```bash
# 1. 패키지 설치
npm install [package-name]

# 2. iOS 네이티브 의존성 추가 (필요시)
npx pod-install

# 3. 네이티브 코드 재생성
npx expo prebuild --platform android --clean

# 4. 개발 빌드 재설치
npx expo run:android

# 5. 개발 서버 시작
npx expo start --dev-client
```

---

## 💡 추가 팁

### 빠른 재시작
에뮬레이터에서 앱 실행 중:
- **Android**: `r` 키 (Reload) 또는 `d` 키 (Dev Menu)

### 개발 메뉴 접근
- **에뮬레이터**: Ctrl+M
- **실제 기기**: 디바이스 흔들기

### 로그 확인
```bash
# Expo 로그
npx expo start --dev-client

# Android 네이티브 로그
adb logcat | grep "ReactNativeJS"

# 특정 앱만 로그
adb logcat | grep "com.smartagent.nengpro"
```

### 성능 프로파일링
```bash
# Release 빌드로 성능 테스트
npx expo run:android --variant release
```

---

## 📚 참고 자료
- [Expo Development Builds 공식 문서](https://docs.expo.dev/develop/development-builds/introduction/)
- [Expo Prebuild 가이드](https://docs.expo.dev/workflow/prebuild/)
- [React Native 디버깅](https://reactnative.dev/docs/debugging)

---

**작성일**: 2025-10-22
**버전**: 1.0
**프로젝트**: ez2cook v1.0.0
