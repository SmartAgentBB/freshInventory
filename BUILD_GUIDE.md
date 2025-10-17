# 📱 Ez2Cook 빌드 가이드

## 🎯 빌드 버전 관리 시스템

Ez2Cook은 체계적인 빌드 번호 관리 시스템을 사용합니다.

## 📋 버전 관리 파일

### `version.json`
- 모든 빌드 번호와 버전 정보를 중앙에서 관리
- iOS buildNumber와 Android versionCode를 별도 관리
- 빌드 히스토리 자동 기록

### `app.json`
- Expo 설정 파일
- 자동 스크립트로 version.json과 동기화

## 🚀 빌드 명령어

### 기본 명령어

```bash
# 현재 빌드 상태 확인
npm run build:status

# iOS 빌드 번호만 증가
npm run bump:ios

# Android 버전 코드만 증가
npm run bump:android

# 앱 버전 증가 (1.0.0 -> 1.0.1)
npm run bump:version

# 환경 변수 검증 (빌드 전 필수!)
npm run validate-env
```

### 자동 빌드 및 제출

```bash
# iOS 자동 빌드 및 App Store 제출
npm run build:ios

# Android 자동 빌드 및 Play Store 제출
npm run build:android
```

## 📝 수동 빌드 프로세스

### 🔒 사전 준비 (필수!)

**프로덕션 빌드 전 반드시 확인:**

1. **환경 변수 검증**
   ```bash
   npm run validate-env
   ```

2. **EAS Secret 확인**
   ```bash
   # 등록된 Secret 목록 확인
   eas secret:list

   # 필수 Secret이 없다면 추가
   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string
   ```

3. **테스트 실행**
   ```bash
   npm test
   npm run type-check
   ```

### iOS 빌드

1. **빌드 번호 증가**
   ```bash
   npm run bump:ios
   ```

2. **변경사항 커밋**
   ```bash
   git add app.json version.json
   git commit -m "chore: bump iOS build number to X"
   ```

3. **환경 변수 재확인** ⚠️
   ```bash
   npm run validate-env
   ```

4. **프로덕션 빌드**
   ```bash
   eas build --platform ios --profile production
   ```

5. **App Store 제출**
   ```bash
   eas submit --platform ios --latest
   ```

6. **제출 후 검증** (TestFlight)
   - TestFlight에서 빌드 다운로드
   - AI 이미지 인식 기능 테스트
   - 레시피 생성 기능 테스트
   - 주요 기능 정상 작동 확인

### Android 빌드

1. **버전 코드 증가**
   ```bash
   npm run bump:android
   ```

2. **변경사항 커밋**
   ```bash
   git add app.json version.json
   git commit -m "chore: bump Android version code to X"
   ```

3. **환경 변수 재확인** ⚠️
   ```bash
   npm run validate-env
   ```

4. **프로덕션 빌드**
   ```bash
   eas build --platform android --profile production
   ```

5. **Play Store 제출**
   ```bash
   eas submit --platform android --latest
   ```

6. **제출 후 검증** (Internal Testing)
   - Internal Testing 트랙에서 빌드 다운로드
   - AI 이미지 인식 기능 테스트
   - 레시피 생성 기능 테스트
   - 주요 기능 정상 작동 확인

## 🔄 버전 정책

### 앱 버전 (Semantic Versioning)
- **Major (1.x.x)**: 큰 기능 변경, 호환성 깨짐
- **Minor (x.1.x)**: 새 기능 추가
- **Patch (x.x.1)**: 버그 수정

### 빌드 번호
- **iOS buildNumber**: 매 제출마다 증가 (1, 2, 3...)
- **Android versionCode**: 매 제출마다 증가 (1, 2, 3...)

## ⚠️ 주의사항

1. **빌드 번호 중복 방지**
   - 이미 제출한 빌드 번호는 재사용 불가
   - 실패한 빌드도 번호 증가 필요

2. **커밋 순서**
   - 빌드 전 반드시 버전 변경사항 커밋
   - 빌드 후 성공/실패 상태 기록

3. **환경 변수 관리** 🔐
   - `.env` 파일은 개발 환경에서만 사용됨
   - 프로덕션 빌드는 **반드시 EAS Secret 사용**
   - 빌드 전 `npm run validate-env` 실행 필수
   - API 키 누락 시 AI 기능 완전 차단됨

4. **프로덕션 체크리스트**
   - [ ] 환경 변수 검증 (`npm run validate-env`)
   - [ ] EAS Secret 등록 확인 (`eas secret:list`)
   - [ ] 테스트 완료 (`npm test`, `npm run type-check`)
   - [ ] 빌드 번호 증가
   - [ ] 변경사항 커밋
   - [ ] 빌드 실행
   - [ ] TestFlight/Internal Testing에서 AI 기능 검증 ⚠️
   - [ ] 주요 기능 정상 작동 확인
   - [ ] 스토어 제출

## 🔧 트러블슈팅

### 🚨 AI 기능이 작동하지 않을 때

**증상**: "AI 서비스를 사용할 수 없습니다" 에러

**원인**: 프로덕션 빌드에 Gemini API 키가 포함되지 않음

**해결 방법**:
```bash
# 1. 환경 변수 검증
npm run validate-env

# 2. EAS Secret 등록
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string

# 3. Secret 등록 확인
eas secret:list

# 4. 재빌드 및 재배포
npm run bump:ios  # 또는 npm run bump:android
npm run build:ios  # 또는 npm run build:android
```

### 빌드 번호 오류
```bash
# version.json 직접 수정 후
git add version.json app.json
git commit -m "fix: correct build numbers"
```

### EAS 인증 문제
```bash
# 재로그인
eas login
eas whoami
```

### 환경 변수 확인
```bash
# 로컬 환경 변수 확인
npm run validate-env

# EAS Secret 목록 확인
eas secret:list

# 특정 Secret 삭제 후 재등록
eas secret:delete --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string
```

### 빌드 실패 시
1. `npm run build:status`로 현재 상태 확인
2. `version.json`에서 실패한 빌드 상태 확인
3. 필요시 수동으로 빌드 번호 조정
4. 환경 변수 누락 여부 확인 (`npm run validate-env`)

## 📊 빌드 히스토리

`version.json` 파일의 `history` 섹션에서 모든 빌드 기록 확인 가능:
- 빌드 번호/버전 코드
- 날짜
- 상태 (building, submitted, failed)
- 메모

## 🎯 Best Practices

1. **환경 변수 관리**
   - 모든 API 키는 EAS Secret으로 관리
   - `.env` 파일은 개발용으로만 사용
   - 빌드 전 반드시 `npm run validate-env` 실행

2. **정기 빌드**
   - 주 1회 정기 빌드 권장
   - 빌드 전 체크리스트 철저히 확인

3. **테스트**
   - 제출 전 TestFlight/Internal Testing 필수
   - **AI 이미지 인식 기능 필수 테스트** ⚠️
   - 레시피 생성 기능 필수 테스트
   - 주요 기능 E2E 테스트

4. **문서화**
   - 각 빌드의 주요 변경사항 기록
   - `version.json` 히스토리에 상세 노트 작성

5. **백업**
   - 빌드 전 코드 백업 (git push)
   - EAS Secret 백업 (안전한 곳에 별도 보관)

## 🔐 환경 변수 관리 가이드

### 개발 환경
- `.env` 파일 사용
- 로컬 개발 및 테스트용

### 프로덕션 환경
- **EAS Secret 사용 (필수)**
- 빌드 시 자동으로 환경 변수 주입

### 필수 환경 변수
```
EXPO_PUBLIC_SUPABASE_URL           # Supabase 프로젝트 URL
EXPO_PUBLIC_SUPABASE_ANON_KEY      # Supabase Anon Key
EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY  # Gemini API Key (AI 기능 필수!)
```

### EAS Secret 등록 방법
```bash
# 1. 프로젝트 레벨로 등록 (권장)
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string

# 2. 등록 확인
eas secret:list

# 3. 값 업데이트가 필요한 경우
eas secret:delete --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY
eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value NEW_API_KEY --type string
```

## 📚 관련 문서

- [Expo EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
- [EAS Secrets 가이드](https://docs.expo.dev/build-reference/variables/)
- [환경 변수 모범 사례](https://docs.expo.dev/guides/environment-variables/)

---

*Last Updated: 2025-10-17*