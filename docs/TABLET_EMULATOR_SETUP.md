# 타블렛 에뮬레이터 설정 가이드

다른 PC에서 ez2cook 앱을 7인치/10인치 타블렛 에뮬레이터로 실행하는 방법을 안내합니다.

## 📋 목차
1. [사전 준비](#사전-준비)
2. [Android Studio 설치](#android-studio-설치)
3. [타블렛 에뮬레이터 생성](#타블렛-에뮬레이터-생성)
4. [프로젝트 설정](#프로젝트-설정)
5. [앱 실행](#앱-실행)
6. [문제 해결](#문제-해결)

---

## 🔧 사전 준비

### 시스템 요구사항
- **OS**: Windows 10/11 (64비트)
- **RAM**: 최소 8GB (권장 16GB)
- **디스크 공간**: 최소 10GB
- **CPU**: Intel VT-x 또는 AMD-V 가상화 지원 필수

### 필수 소프트웨어
- Node.js (LTS 버전, 18.x 이상)
- Git
- Android Studio (최신 버전)

---

## 📥 Android Studio 설치

### Step 1: Android Studio 다운로드
1. [Android Studio 공식 사이트](https://developer.android.com/studio) 접속
2. "Download Android Studio" 클릭
3. 약관 동의 후 다운로드

### Step 2: 설치 및 초기 설정
1. 다운로드한 설치 파일 실행
2. 설치 마법사에서 다음 옵션 선택:
   - ✅ Android Studio
   - ✅ Android SDK
   - ✅ Android Virtual Device (AVD)
3. 설치 경로 설정 (기본값 권장)
4. "Finish" 클릭하여 설치 완료

### Step 3: SDK 및 도구 설치
1. Android Studio 실행
2. "More Actions" → "SDK Manager" 선택
3. **SDK Platforms** 탭:
   - ✅ Android 14.0 (API 34) - 최신 버전
   - ✅ Android 13.0 (API 33)
   - ✅ Android 12.0 (API 31)
4. **SDK Tools** 탭:
   - ✅ Android SDK Build-Tools
   - ✅ Android SDK Command-line Tools
   - ✅ Android Emulator
   - ✅ Android SDK Platform-Tools
   - ✅ Intel x86 Emulator Accelerator (HAXM) - Intel CPU 사용 시
5. "Apply" 클릭하여 설치

### Step 4: 환경 변수 설정
1. "내 PC" 우클릭 → "속성" → "고급 시스템 설정"
2. "환경 변수" 클릭
3. 사용자 변수에 추가:
   ```
   ANDROID_HOME=C:\Users\[사용자명]\AppData\Local\Android\Sdk
   ```
4. Path 변수에 추가:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```
5. 명령 프롬프트를 열고 확인:
   ```bash
   adb --version
   ```

---

## 📱 타블렛 에뮬레이터 생성

### Step 1: AVD Manager 열기
1. Android Studio 실행
2. "More Actions" → "Virtual Device Manager" 선택
3. "Create Virtual Device" 클릭

### Step 2: 7인치 타블렛 생성

#### 하드웨어 선택
1. Category: **Tablet** 선택
2. 다음 중 하나 선택:
   - **Nexus 7 (2013)** (7.0", 1920×1200, 323 dpi)
   - **Generic 7" Tablet** - 커스텀 설정 가능
3. "Next" 클릭

#### 시스템 이미지 선택
1. Release Name: **UpsideDownCake (API 34)** 또는 **Tiramisu (API 33)** 선택
2. ABI: **x86_64** 선택 (Intel CPU) 또는 **arm64-v8a** (Apple Silicon)
3. "Download" 클릭하여 시스템 이미지 다운로드
4. 다운로드 완료 후 "Next" 클릭

#### AVD 구성
1. AVD Name: `Tablet_7inch_API34` (식별하기 쉬운 이름)
2. Startup orientation: **Portrait** 또는 **Landscape**
3. **Advanced Settings** 클릭:
   - RAM: 2048 MB (2GB)
   - VM heap: 256 MB
   - Internal Storage: 2048 MB
   - SD card: 512 MB (선택)
   - Graphics: **Automatic** (문제 시 Software로 변경)
4. "Finish" 클릭

### Step 3: 10인치 타블렛 생성

#### 하드웨어 선택
1. Category: **Tablet** 선택
2. 다음 중 하나 선택:
   - **Nexus 10** (10.1", 2560×1600, 300 dpi)
   - **Pixel Tablet** (10.95", 2560×1600, 276 dpi)
3. "Next" 클릭

#### 시스템 이미지 및 구성
- 7인치와 동일한 방법으로 설정
- AVD Name: `Tablet_10inch_API34`
- RAM: 3072 MB (3GB) - 더 큰 화면이므로 메모리 증가

### Step 4: 에뮬레이터 실행 테스트
1. Virtual Device Manager에서 생성된 AVD 확인
2. ▶️ (Run) 버튼 클릭하여 에뮬레이터 실행
3. 정상적으로 부팅되는지 확인 (최초 실행 시 3-5분 소요)

---

## 🚀 프로젝트 설정

### Step 1: 프로젝트 클론
```bash
# 프로젝트를 저장할 폴더로 이동
cd C:\Users\[사용자명]\Documents

# Git 클론
git clone https://github.com/[your-username]/ez2cook.git
cd ez2cook
```

### Step 2: 의존성 설치
```bash
# Node.js 의존성 설치
npm install

# Expo CLI 전역 설치 (선택)
npm install -g expo-cli
```

### Step 3: 환경 변수 설정
1. 프로젝트 루트에 `.env` 파일 생성 (`.env.example` 참고)
2. 다음 내용 입력:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://fwoykfbumwsbodrconeo.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3b3lrZmJ1bXdzYm9kcmNvbmVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5MTQxMDEsImV4cCI6MjA3MTQ5MDEwMX0.rxwnJK2xqYSqohmaRJq0x5n9RMOGEchF4r7XifqO2h0
   EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY=[Google AI API 키]
   ```
3. Google AI API 키는 [Google AI Studio](https://makersuite.google.com/app/apikey)에서 발급

### Step 4: 프로젝트 검증
```bash
# TypeScript 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 테스트 실행 (선택)
npm test
```

---

## ▶️ 앱 실행

### Method 1: Expo CLI 사용 (권장)

#### Step 1: 개발 서버 시작
```bash
npx expo start
```

#### Step 2: 에뮬레이터에서 실행
1. Android Studio에서 원하는 타블렛 에뮬레이터 실행 (7인치 또는 10인치)
2. 에뮬레이터가 완전히 부팅될 때까지 대기
3. Expo 터미널에서 `a` 키 입력 (Android에서 실행)
4. 앱이 자동으로 에뮬레이터에 설치 및 실행됨

### Method 2: 직접 빌드 및 설치

#### Step 1: Android 프로젝트 생성
```bash
# Expo 프리빌드 (Android 네이티브 코드 생성)
npx expo prebuild --platform android
```

#### Step 2: Android Studio에서 열기
1. Android Studio 실행
2. "Open an Existing Project" 선택
3. `ez2cook/android` 폴더 선택
4. Gradle 동기화 대기

#### Step 3: 빌드 및 실행
1. 상단 툴바에서 실행할 AVD 선택 (Tablet_7inch_API34 또는 Tablet_10inch_API34)
2. ▶️ (Run) 버튼 클릭
3. 빌드 완료 후 에뮬레이터에 앱 설치 및 실행

### 실행 확인 사항
- ✅ 앱 아이콘이 에뮬레이터 홈 화면에 표시됨
- ✅ 로그인 화면이 정상적으로 로드됨
- ✅ 타블렛 해상도에 맞게 UI가 표시됨
- ✅ 하단 네비게이션 바가 정상적으로 작동함

---

## 🔍 문제 해결

### 에뮬레이터가 느리거나 실행되지 않는 경우

#### 가상화 활성화 확인 (Intel CPU)
1. BIOS/UEFI 설정 진입 (부팅 시 F2, Del 등)
2. CPU 설정에서 "Intel VT-x" 또는 "Virtualization Technology" 활성화
3. 저장 후 재부팅

#### Windows Hyper-V 비활성화
```bash
# PowerShell을 관리자 권한으로 실행
bcdedit /set hypervisorlaunchtype off
```
재부팅 후 에뮬레이터 다시 실행

#### HAXM 재설치
1. SDK Manager → SDK Tools → "Intel x86 Emulator Accelerator (HAXM)" 제거
2. [HAXM 공식 사이트](https://github.com/intel/haxm/releases)에서 최신 버전 다운로드
3. 설치 후 에뮬레이터 재실행

### `adb` 연결 실패

#### ADB 재시작
```bash
# ADB 서버 종료
adb kill-server

# ADB 서버 재시작
adb start-server

# 연결된 디바이스 확인
adb devices
```

#### 에뮬레이터 직접 연결
```bash
# 기본 포트로 연결 (5554는 첫 번째 에뮬레이터)
adb connect localhost:5554
```

### Expo 앱이 설치되지 않는 경우

#### Metro Bundler 재시작
1. Expo 개발 서버 종료 (Ctrl+C)
2. 캐시 삭제 후 재시작:
   ```bash
   npx expo start --clear
   ```

#### 수동으로 Expo Go 설치
```bash
# Expo Go APK 다운로드 및 설치
adb install [다운로드한 Expo Go APK 경로]
```

### 키보드가 입력창을 가리는 경우
- 에뮬레이터 설정에서 "Show touch data" 활성화
- CLAUDE.md의 "키보드 처리" 섹션 참고하여 코드 수정

### 그래픽 성능 이슈
1. AVD 설정 → "Graphics" 옵션 변경:
   - **Automatic** → **Hardware** (성능 우선)
   - **Automatic** → **Software** (안정성 우선)

### 앱이 크래시되는 경우

#### Logcat 확인
1. Android Studio → "Logcat" 탭 열기
2. 필터: `com.smartagent.nengpro` 입력
3. 에러 메시지 확인

#### 앱 데이터 삭제 후 재실행
```bash
# 앱 데이터 삭제
adb shell pm clear com.smartagent.nengpro

# 앱 재실행
```

---

## 📊 타블렛별 테스트 체크리스트

### 7인치 타블렛
- [ ] 세로 모드에서 UI 정상 표시
- [ ] 가로 모드에서 UI 정상 표시
- [ ] 하단 네비게이션 바 터치 가능
- [ ] 식재료 추가 사진 촬영/선택 가능
- [ ] 키보드 입력 시 입력창 가려지지 않음

### 10인치 타블렛
- [ ] 넓은 화면에서 레이아웃 깨짐 없음
- [ ] 터치 타겟 크기 적절함
- [ ] 텍스트 가독성 양호
- [ ] 이미지 비율 유지됨
- [ ] 모달 및 다이얼로그 중앙 정렬

---

## 🎯 추가 팁

### 에뮬레이터 스냅샷 활용
- AVD 설정에서 "Quick Boot" 활성화
- 에뮬레이터 종료 시 현재 상태 저장
- 다음 실행 시 빠른 부팅 (3-5초)

### 여러 에뮬레이터 동시 실행
```bash
# 7인치와 10인치 동시 실행하여 테스트
emulator -avd Tablet_7inch_API34 &
emulator -avd Tablet_10inch_API34 &
```

### 화면 녹화
```bash
# 에뮬레이터 화면 녹화 (최대 3분)
adb shell screenrecord /sdcard/demo.mp4

# 녹화 중지 (Ctrl+C)

# 녹화 파일 다운로드
adb pull /sdcard/demo.mp4 C:\Users\[사용자명]\Downloads\
```

### 스크린샷 캡처
- 에뮬레이터 우측 툴바 → 카메라 아이콘 클릭
- 또는 명령어:
  ```bash
  adb exec-out screencap -p > screenshot.png
  ```

---

## 📚 참고 자료
- [Android Studio 공식 문서](https://developer.android.com/studio)
- [Expo 공식 문서](https://docs.expo.dev/)
- [ez2cook CLAUDE.md](../CLAUDE.md)
- [ez2cook README](../README.md)

---

## 💡 자주 묻는 질문

**Q: 에뮬레이터가 너무 느려요.**
A: HAXM/Hyper-V 설정 확인, RAM 증가, Graphics를 Hardware로 변경하세요.

**Q: 실제 기기와 차이가 있나요?**
A: 카메라, 센서, 성능 등 일부 차이가 있습니다. 최종 테스트는 실제 기기 권장.

**Q: 다른 해상도 타블렛도 테스트하고 싶어요.**
A: AVD Manager에서 "New Hardware Profile" 생성 후 원하는 해상도 설정 가능.

**Q: 인터넷 연결이 안 돼요.**
A: 에뮬레이터는 PC의 네트워크를 공유합니다. 방화벽 설정 확인 필요.

---

**작성일**: 2025-10-22
**버전**: 1.0
**프로젝트**: ez2cook v2.0.1
