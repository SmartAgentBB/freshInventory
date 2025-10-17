# 🍳 ez2cook - 스마트 식재료 관리 앱

AI 기반 식재료 인식과 스마트한 재고 관리로 요리를 더 쉽고 즐겁게 만들어주는 모바일 앱입니다.

## 📱 주요 기능

### 1. 🥕 스마트 재고 관리
- **AI 식재료 인식**: 사진 한 장으로 여러 식재료를 자동으로 인식하고 등록
- **실시간 재고 추적**: 식재료의 신선도와 남은 양을 한눈에 확인
- **D-day 알림**: 유통기한이 임박한 식재료를 색상으로 구분하여 표시
  - 🟩 안전 (3일 이상)
  - 🟨 주의 (1-2일)
  - 🟥 위험 (당일 또는 경과)
- **냉동/냉장 관리**: 보관 방법별로 식재료를 분류하여 관리
- **소비 기록**: 사용 완료한 식재료의 히스토리 추적
- **이미지 확대 보기**: 등록된 식재료 이미지를 전체 화면으로 확인

### 2. 🛒 스마트 장보기 리스트
- **자동 완료 처리**: AI로 인식된 식재료가 장보기 목록에 있으면 자동으로 완료 처리
- **체크박스 관리**: 구매할 항목과 완료한 항목을 쉽게 관리
- **재구매 추천**: 소비 완료된 항목을 쉽게 장보기 목록에 추가
- **실시간 배지**: 활성 장보기 항목 수를 배지로 표시
- **완료 항목 자동 정리**: 완료된 항목을 별도 탭에서 관리

### 3. 👨‍🍳 AI 요리 추천
- **레시피 추천**: 보유한 식재료를 기반으로 만들 수 있는 요리 추천
- **상세 레시피**: 단계별 조리법과 필요한 재료 목록 제공
- **북마크 기능**: 마음에 드는 레시피를 저장하고 관리
- **부족 재료 알림**: 레시피에 필요한 재료 중 부족한 것을 장보기 목록에 추가
- **재료 매칭 표시**: 보유/미보유 재료를 색상으로 구분

### 4. 📊 소비 분석
- **사용/폐기 비율**: 각 식재료의 활용도를 시각적으로 표시
- **월별 히스토리**: 과거 소비 패턴 분석
- **낭비 최소화**: 폐기율이 높은 식재료 파악 및 개선
- **날짜별 기록**: 언제 어떤 식재료를 사용했는지 추적

### 5. 🔐 사용자 관리
- **이메일 인증 회원가입**: 안전한 계정 생성
- **소셜 로그인**: Google, GitHub 계정으로 간편 로그인
- **비밀번호 재설정**: 이메일을 통한 비밀번호 복구
- **자동 로그인**: 로그인 상태 유지

## 🛠 기술 스택

### Frontend
- **React Native** + **Expo SDK 54**
- **TypeScript**: 타입 안정성 보장
- **React Native Paper**: Material Design 3 기반 UI 컴포넌트
- **React Navigation**: 화면 간 네비게이션
- **Date-fns**: 날짜 처리 라이브러리

### Backend & Services
- **Supabase**:
  - PostgreSQL 데이터베이스
  - 실시간 데이터 동기화
  - 이미지 스토리지
  - 사용자 인증 (Email, OAuth)
- **Google Gemini AI** (`gemini-2.5-flash-lite`):
  - 이미지 기반 식재료 인식
  - 레시피 생성 및 추천
  - 식재료 보관 정보 제공

### 주요 라이브러리
- **expo-image-picker**: 카메라/갤러리 접근
- **expo-file-system**: 파일 시스템 관리
- **@react-native-async-storage/async-storage**: 로컬 데이터 저장
- **react-native-vector-icons**: 아이콘 시스템
- **react-native-gesture-handler**: 제스처 처리
- **react-native-image-zoom-viewer**: 이미지 확대 기능

## 🎨 디자인 특징

### 민트 테마
- **Primary Color**: #26A69A (민트 그린)
- **Material Design 3** 가이드라인 준수
- **Open Sans** 폰트 패밀리
- 직관적이고 깔끔한 한국어 UI

### 사용자 경험
- 인라인 편집 기능으로 빠른 수정
- +/- 버튼으로 간편한 수량 조절
- 커스텀 슬라이더로 직관적인 수량 조절
- 썸네일 이미지로 시각적 인식 향상
- 전체 화면 이미지 뷰어로 상세 확인
- 로딩 상태 및 에러 처리 최적화

## 📂 프로젝트 구조

```
ez2cook/
├── src/
│   ├── components/      # 재사용 가능한 UI 컴포넌트
│   │   ├── CustomSlider.tsx  # 커스텀 수량 조절 슬라이더
│   │   ├── HistoryCard.tsx   # 히스토리 카드 컴포넌트
│   │   └── ...
│   ├── screens/         # 주요 화면 컴포넌트
│   │   ├── InventoryScreen.tsx
│   │   ├── ShoppingScreen.tsx
│   │   ├── CookingScreen.tsx
│   │   ├── SignUpScreen.tsx
│   │   └── ...
│   ├── services/        # API 및 비즈니스 로직
│   │   ├── AuthService.ts     # 인증 서비스
│   │   ├── InventoryService.ts
│   │   └── ...
│   ├── navigation/      # 네비게이션 설정
│   ├── models/          # 데이터 모델 타입 정의
│   ├── constants/       # 색상, 간격 등 상수
│   └── utils/          # 유틸리티 함수
├── assets/             # 이미지, 폰트 등 정적 자원
├── freshInventory/     # Flask 프로토타입 (참고용)
└── __tests__/         # 테스트 파일
```

## 🚀 시작하기

### 필수 요구사항
- Node.js 18 이상
- Expo Go 앱 (iOS/Android)
- Supabase 계정
- Google Cloud 계정 (Gemini API)

### 설치 및 실행

1. **저장소 클론**
```bash
git clone https://github.com/yourusername/ez2cook.git
cd ez2cook
```

2. **의존성 설치**
```bash
npm install
```

3. **환경 변수 설정**
`.env` 파일을 생성하고 다음 변수들을 설정:
```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EXPO_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

4. **개발 서버 실행**
```bash
npx expo start
```

5. **모바일에서 테스트**

**방법 1: QR 코드 스캔 (권장)**
- PC와 모바일이 같은 Wi-Fi에 연결되어 있어야 합니다
- Android: Expo Go 앱 실행 → "Scan QR Code" → 터미널의 QR 코드 스캔
- iOS: Expo Go 앱 설치 → iPhone 카메라로 QR 코드 스캔 → "Expo Go에서 열기"

**방법 2: 터널 모드 (다른 네트워크)**
```bash
npx expo start --tunnel
```

**방법 3: 수동 QR 코드 생성**
```bash
# IP 주소 확인
ipconfig  # Windows
ifconfig  # Mac/Linux

# QR 코드 생성 (YOUR_IP를 실제 IP로 변경)
npx qrcode-terminal "exp://YOUR_IP:8081"
```

## 🔧 주요 서비스

### InventoryService
- 식재료 CRUD 작업
- 재고 상태 업데이트
- 이미지 업로드 및 삭제
- 카테고리별 필터링

### ShoppingService
- 장보기 목록 관리
- 완료/미완료 상태 토글
- 대량 항목 추가
- 히스토리 추적

### AIService
- 이미지 분석 및 식재료 인식
- 레시피 생성
- 요리 추천
- 영양 정보 분석

### AuthService
- 이메일 회원가입 및 인증
- 소셜 로그인 (Google, GitHub)
- 비밀번호 재설정
- 세션 관리

### StorageService
- 이미지 업로드/다운로드
- 썸네일 생성
- 스토리지 최적화
- 이미지 삭제 관리

## 🧪 테스트

```bash
# 단위 테스트 실행
npm test

# 타입 체크
npm run type-check

# 린트 검사
npm run lint
```

## 🏗️ 빌드 및 배포

### 빌드 번호 관리
```bash
# 현재 빌드 상태 확인
npm run build:status

# iOS 빌드 번호 증가
npm run bump:ios

# Android 버전 코드 증가
npm run bump:android

# 앱 버전 증가
npm run bump:version
```

### 자동 빌드 및 제출
```bash
# iOS 자동 빌드 및 App Store 제출
npm run build:ios

# Android 자동 빌드 및 Play Store 제출
npm run build:android
```

상세한 빌드 가이드는 [BUILD_GUIDE.md](./BUILD_GUIDE.md)를 참고하세요.

## 📚 문서

프로젝트의 상세한 문서들:

- **[CLAUDE.md](./CLAUDE.md)**: 개발 가이드 및 아키텍처 설명
- **[BUILD_GUIDE.md](./BUILD_GUIDE.md)**: 빌드 및 배포 프로세스
- **[FAQ.md](./FAQ.md)**: 사용자를 위한 자주 묻는 질문
- **[iOS_26_CRASH_FIX.md](./iOS_26_CRASH_FIX.md)**: iOS 26.0 크래시 문제 해결
- **[PRIVACY_POLICY.md](./PRIVACY_POLICY.md)**: 개인정보 보호정책
- **[USER_GUIDE.md](./USER_GUIDE.md)**: 사용자 매뉴얼

## 📱 지원 플랫폼

- iOS 13.0 이상
- Android 6.0 (API 23) 이상
- Web (제한적 지원)

## 🔐 보안 기능

- Supabase Row Level Security (RLS)
- 사용자별 데이터 격리
- 안전한 이미지 업로드
- OAuth 2.0 소셜 로그인

## ⚠️ 알려진 이슈 및 해결

### 해결된 이슈
1. **iOS 26.0 크래시**: null/undefined 객체 접근 → 방어적 프로그래밍으로 해결
2. **키보드 입력창 가림**: KeyboardAvoidingView 문제 → measureInWindow + 자동 스크롤로 해결
3. **계정 전환 시 로그아웃**: 식재료 삭제 버그 → 서비스 초기화 개선으로 해결
4. **레시피 매칭 오류**: 재료 데이터 구조 개선으로 해결

### 현재 제한사항
- Expo Go에서 알림 기능은 실제 기기에서만 작동
- 터널 모드는 느리고 타임아웃 발생 가능
- iOS 26.0 베타 버전 일부 기능 제한 가능

## 📈 최근 업데이트

### v1.0.0 (2025.10)
- 🔐 **비밀번호 재설정 기능**: 이메일 OTP 기반 비밀번호 복구
- 🗑️ **회원 탈퇴 기능**: 다국어 지원 포함
- 🤖 **AI 모델 개선**: Gemini 2.5 Flash Lite로 전환
- ⌨️ **키보드 처리 개선**: iOS/Android 일관성 향상
- 🍳 **레시피 시스템 개선**: 재료 데이터 구조 최적화
- 🐛 **iOS 26.0 크래시 수정**: null 체크 및 에러 처리 강화
- 🔧 **계정 전환 버그 수정**: 식재료 삭제 시 로그아웃 문제 해결
- 📱 **Expo Go 호환성 개선**: Android 플랫폼 안정화

### 이전 버전
- v1.1.0: 요리 추천 기능, 장보기 리스트 자동 완료
- v1.2.0: 커스텀 슬라이더, 이미지 전체 화면 보기, 소셜 로그인

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 팀

- 개발: SmartAgent Team
- 디자인: Material Design 3 가이드라인 기반
- AI: Google Gemini 2.5 Flash Lite, Claude

## 📊 프로젝트 통계

- **앱 버전**: 1.0.0
- **iOS 빌드**: 4 (App Store 제출 완료)
- **Android 빌드**: 2 (개발 중)
- **지원 언어**: 한국어
- **패키지명**: com.smartagent.nengpro

## 📞 문의

- **이메일**: nengpro.contact@gmail.com
- **버그 리포트**: [GitHub Issues](https://github.com/yourusername/ez2cook/issues)
- **피드백**: https://forms.gle/EvWcgNRqpMRXYei59

---

Made with ❤️ and React Native