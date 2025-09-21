# ADB (Android Debug Bridge) 완전 설정 가이드

## 🚀 빠른 설정 (Platform Tools만 설치)

가장 빠른 방법은 Platform Tools만 별도로 다운로드하는 것입니다.

### Option A: Platform Tools 단독 설치 (권장) ⭐

```bash
# 1. Platform Tools 다운로드
https://developer.android.com/studio/releases/platform-tools

# 2. 다운로드한 ZIP 파일을 C:\ 드라이브에 압축 해제
# 예: C:\platform-tools

# 3. 환경변수 추가
# Windows PowerShell (관리자 권한)에서 실행:
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\platform-tools", [EnvironmentVariableTarget]::User)

# 4. 새 명령 프롬프트 열고 확인
adb --version
```

### Option B: Android Studio 전체 설치

더 많은 기능이 필요한 경우 Android Studio를 설치합니다.

```bash
# 1. Android Studio 다운로드 및 설치
https://developer.android.com/studio

# 2. 설치 중 필수 체크 항목:
✅ Android SDK
✅ Android SDK Platform-Tools
✅ Android Virtual Device
```

## 📋 Step-by-Step 설정

### Step 1: ADB 다운로드 및 설치

#### Windows
```powershell
# PowerShell로 자동 설치 (관리자 권한)
# Chocolatey가 있는 경우
choco install adb

# 또는 수동 설치
# 1. https://dl.google.com/android/repository/platform-tools-latest-windows.zip 다운로드
# 2. C:\adb 폴더 생성
# 3. ZIP 파일 압축 해제
```

#### Mac
```bash
# Homebrew 사용
brew install android-platform-tools

# 또는 수동 설치
curl -O https://dl.google.com/android/repository/platform-tools-latest-darwin.zip
unzip platform-tools-latest-darwin.zip
sudo mv platform-tools /usr/local/
```

### Step 2: 환경변수 설정 (Windows)

#### GUI 방법
1. **시작** → "환경 변수" 검색
2. **시스템 환경 변수 편집** 클릭
3. **환경 변수** 버튼 클릭
4. 시스템 변수에서 **Path** 선택 → **편집**
5. **새로 만들기** → 다음 경로 추가:
   ```
   C:\adb
   또는
   C:\platform-tools
   또는
   C:\Users\%USERNAME%\AppData\Local\Android\Sdk\platform-tools
   ```
6. **확인** 클릭 (모든 창)

#### PowerShell 방법 (빠른 설정)
```powershell
# PowerShell 관리자 권한으로 실행
$adbPath = "C:\platform-tools"  # ADB 경로

# 사용자 환경변수에 추가
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "User") + ";$adbPath",
    "User"
)

# 시스템 환경변수에 추가 (선택사항)
[Environment]::SetEnvironmentVariable(
    "Path",
    [Environment]::GetEnvironmentVariable("Path", "Machine") + ";$adbPath",
    "Machine"
)

# 즉시 적용
$env:Path += ";$adbPath"
```

### Step 3: ADB 설치 확인

```bash
# 새 명령 프롬프트/터미널 열기 (중요!)
# 버전 확인
adb --version

# 예상 출력:
# Android Debug Bridge version 1.0.41
# Version 35.0.0-11411520
```

### Step 4: 실제 기기 연결 설정

#### Android 폰 설정
1. **설정** → **휴대전화 정보**
2. **빌드 번호** 7번 탭 → 개발자 모드 활성화
3. **설정** → **개발자 옵션**
4. 다음 항목 활성화:
   - ✅ USB 디버깅
   - ✅ USB 디버깅 (보안 설정) - 선택사항
   - ✅ 화면 잠금 상태에서 ADB 디버깅 허용

#### PC에서 기기 확인
```bash
# USB로 폰 연결
# 폰에서 "USB 디버깅 허용" 팝업 → 허용 (항상 허용 체크)

# 연결된 기기 확인
adb devices

# 예상 출력:
# List of devices attached
# RF8N30ZZZZ      device
```

### Step 5: 에뮬레이터 설정 (선택사항)

#### Android Studio 에뮬레이터
```bash
# Android Studio에서 AVD Manager 열기
# Tools → AVD Manager → Create Virtual Device

# 또는 명령줄에서
# 에뮬레이터 목록 확인
emulator -list-avds

# 에뮬레이터 실행
emulator -avd Pixel_5_API_33

# ADB로 확인
adb devices
```

## 🧪 ADB 기본 명령어

### 기기 관리
```bash
# 연결된 기기 목록
adb devices

# 특정 기기 지정
adb -s <device_id> shell

# 무선 연결 (같은 Wi-Fi)
adb tcpip 5555
adb connect 192.168.1.100:5555
```

### 앱 관리
```bash
# 앱 설치
adb install app.apk

# 앱 제거
adb uninstall com.package.name

# 실행 중인 앱 확인
adb shell pm list packages

# 앱 실행
adb shell am start -n com.package.name/.MainActivity
```

### 파일 전송
```bash
# PC → 기기
adb push local_file.txt /sdcard/

# 기기 → PC
adb pull /sdcard/file.txt ./

# 스크린샷 캡처
adb shell screencap /sdcard/screenshot.png
adb pull /sdcard/screenshot.png
```

### 디버깅
```bash
# 로그 확인
adb logcat

# 특정 앱 로그만
adb logcat | grep "com.shinysun0.naengpago"

# 시스템 정보
adb shell getprop
```

## 🔧 문제 해결

### "adb는 내부 또는 외부 명령이 아닙니다"
```bash
# 해결책:
1. 환경변수 Path 다시 확인
2. 새 명령 프롬프트 열기 (필수!)
3. PC 재시작
```

### "device unauthorized"
```bash
# 해결책:
1. USB 케이블 재연결
2. 폰에서 USB 디버깅 재승인
3. ADB 재시작:
   adb kill-server
   adb start-server
```

### "no devices/emulators found"
```bash
# 해결책:
1. USB 드라이버 설치
   - Samsung: Samsung USB Driver
   - LG: LG Mobile Driver
   - Google: Google USB Driver

2. USB 연결 모드 변경 (MTP → PTP)

3. 다른 USB 포트 시도
```

## 🚀 Expo/React Native와 함께 사용

### Expo Go 앱으로 테스트
```bash
# 1. 기기에 Expo Go 설치
adb install expo-go.apk

# 2. Metro 서버 시작
npx expo start

# 3. 기기에서 QR 스캔 또는
adb shell am start -a android.intent.action.VIEW -d exp://192.168.1.100:8081
```

### 개발 빌드 테스트
```bash
# APK 설치
adb install -r app-debug.apk

# 로그 확인
adb logcat | grep "ReactNative"

# 앱 재시작
adb shell am force-stop com.shinysun0.naengpago
adb shell am start -n com.shinysun0.naengpago/.MainActivity
```

## 📝 냉파고 앱 전용 명령어

```bash
# 냉파고 앱 설치
adb install naengpago.apk

# 냉파고 앱 실행
adb shell am start -n com.shinysun0.naengpago/.MainActivity

# 냉파고 앱 로그
adb logcat | grep "naengpago"

# 캐시 삭제
adb shell pm clear com.shinysun0.naengpago

# 권한 부여
adb shell pm grant com.shinysun0.naengpago android.permission.CAMERA
adb shell pm grant com.shinysun0.naengpago android.permission.READ_EXTERNAL_STORAGE
```

## ✅ 설정 완료 체크리스트

- [ ] ADB 다운로드 및 압축 해제
- [ ] 환경변수 Path 추가
- [ ] 새 터미널에서 `adb --version` 확인
- [ ] Android 폰 개발자 모드 활성화
- [ ] USB 디버깅 활성화
- [ ] USB로 연결 및 승인
- [ ] `adb devices`로 기기 확인
- [ ] 테스트 앱 설치 성공

## 🎯 다음 단계

1. **Mobile-MCP 설치**: Claude와 연동하여 자동 테스트
2. **Expo 개발**: `npx expo start`로 실시간 개발
3. **APK 빌드**: `eas build`로 테스트 앱 생성

---

문제가 있으면 다음 명령으로 초기화:
```bash
adb kill-server
adb start-server
adb devices
```