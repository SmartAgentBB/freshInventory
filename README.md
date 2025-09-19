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

### 2. 🛒 스마트 장보기 리스트
- **자동 완료 처리**: AI로 인식된 식재료가 장보기 목록에 있으면 자동으로 완료 처리
- **체크박스 관리**: 구매할 항목과 완료한 항목을 쉽게 관리
- **재구매 추천**: 소비 완료된 항목을 쉽게 장보기 목록에 추가
- **실시간 배지**: 활성 장보기 항목 수를 배지로 표시

### 3. 👨‍🍳 AI 요리 추천
- **레시피 추천**: 보유한 식재료를 기반으로 만들 수 있는 요리 추천
- **상세 레시피**: 단계별 조리법과 필요한 재료 목록 제공
- **북마크 기능**: 마음에 드는 레시피를 저장하고 관리
- **부족 재료 알림**: 레시피에 필요한 재료 중 부족한 것을 장보기 목록에 추가

### 4. 📊 소비 분석
- **사용/폐기 비율**: 각 식재료의 활용도를 시각적으로 표시
- **월별 히스토리**: 과거 소비 패턴 분석
- **낭비 최소화**: 폐기율이 높은 식재료 파악 및 개선

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
  - 사용자 인증
- **Google Gemini AI**:
  - 이미지 기반 식재료 인식
  - 레시피 생성 및 추천

### 주요 라이브러리
- **expo-image-picker**: 카메라/갤러리 접근
- **expo-file-system**: 파일 시스템 관리
- **@react-native-async-storage/async-storage**: 로컬 데이터 저장
- **react-native-vector-icons**: 아이콘 시스템

## 🎨 디자인 특징

### 민트 테마
- **Primary Color**: #26A69A (민트 그린)
- **Material Design 3** 가이드라인 준수
- **Open Sans** 폰트 패밀리
- 직관적이고 깔끔한 한국어 UI

### 사용자 경험
- 인라인 편집 기능으로 빠른 수정
- +/- 버튼으로 간편한 수량 조절
- 드래그 앤 드롭 없이 터치로 모든 작업 처리
- 썸네일 이미지로 시각적 인식 향상

## 📂 프로젝트 구조

```
ez2cook/
├── src/
│   ├── components/      # 재사용 가능한 UI 컴포넌트
│   ├── screens/         # 주요 화면 컴포넌트
│   ├── services/        # API 및 비즈니스 로직
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
- Expo Go 앱에서 QR 코드 스캔
- 또는 터미널에 표시된 URL 직접 입력

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

## 📱 지원 플랫폼

- iOS 13.0 이상
- Android 6.0 (API 23) 이상
- Web (제한적 지원)

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 👥 팀

- 개발: [Your Name]
- 디자인: Material Design 3 가이드라인 기반
- AI: Google Gemini, Claude

## 📞 문의

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요.

---

Made with ❤️ and React Native