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
   eas env:list

   # 필수 Secret이 없다면 추가
   eas env:create --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string
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

2. **버전 동기화 검증** ⚠️ (중요: 2025-11-11 버그 수정)
   ```bash
   # version.json과 app.json의 versionCode가 일치하는지 확인
   echo "version.json:"
   grep -A 1 '"android"' version.json | grep versionCode
   echo "app.json:"
   grep '"versionCode"' app.json
   # 위 두 값이 반드시 같아야 함!
   ```

3. **변경사항 커밋**
   ```bash
   git add app.json version.json
   git commit -m "chore: bump Android version code to X"
   ```

4. **환경 변수 재확인** ⚠️
   ```bash
   npm run validate-env
   ```

5. **프로덕션 빌드**
   ```bash
   eas build --platform android --profile production
   ```

6. **Play Store 제출**
   ```bash
   eas submit --platform android --latest
   ```

7. **제출 후 검증** (Internal Testing)
   - Internal Testing 트랙에서 빌드 다운로드
   - AI 이미지 인식 기능 테스트
   - 레시피 생성 기능 테스트
   - 주요 기능 정상 작동 확인

## 🔄 버전 정책

### 세 가지 버전의 역할

| 항목 | 설정 위치 | 사용자 화면 | 증가 시기 |
|------|---------|----------|---------|
| **expo.version** | app.json | "버전 1.0.1" (iOS/Android 공통) | **새 릴리스마다** |
| **iOS buildNumber** | app.json + version.json | 내부 식별용 | **매 제출마다** |
| **Android versionCode** | app.json + version.json | 내부 식별용 | **매 제출마다** |

### 앱 버전 (expo.version) - iOS & Android 공통
**Semantic Versioning 사용:**
- **Major (1.x.x)**: 큰 기능 변경, 호환성 깨짐
- **Minor (x.1.x)**: 새 기능 추가
- **Patch (x.x.1)**: 버그 수정

**중요**: expo.version은 iOS/Android 모두 동일하게 표시됩니다
```json
{
  "expo": {
    "version": "1.0.1"  // iOS와 Android 모두 이 값 사용
  }
}
```

### 빌드 번호 - 플랫폼별 독립 관리
- **iOS buildNumber**: 매 제출마다 증가 (1, 2, 3...) - iOS만 관리
- **Android versionCode**: 매 제출마다 증가 (1, 2, 3...) - Android만 관리

**권장**: iOS와 Android의 빌드 번호를 동기화 유지
```json
{
  "version": "1.0.1",
  "ios": {
    "buildNumber": 8
  },
  "android": {
    "versionCode": 8  // iOS와 동일하게 유지
  }
}
```

## ⚠️ 주의사항

1. **Android versionCode 동기화 필수** 🚨 (2025-11-11 버그 수정)
   - **문제**: version.json의 versionCode와 app.json의 versionCode가 불일치
   - **증상**: `npm run bump:android` 실행 후에도 app.json이 업데이트되지 않음
   - **원인**: bump-version.js 스크립트의 조건부 업데이트 로직 버그 (2025-11-11 수정됨)
   - **확인**: 빌드 전 `version.json`과 `app.json`의 `android.versionCode` 값이 일치하는지 확인
     ```bash
     # version.json에서 Android versionCode 확인
     grep -A 1 '"android"' version.json | grep versionCode

     # app.json에서 Android versionCode 확인
     grep '"versionCode"' app.json
     ```

2. **expo.version 중복 제출 금지** 🚨
   - **문제**: "You've already submitted this version of the app" 에러
   - **원인**: 같은 expo.version으로 중복 제출 시도
   - **해결**: 새 릴리스 전 반드시 `npm run bump:version` 또는 수동으로 version 증가
   - **예시**:
     ```bash
     npm run bump:version  # 1.0.0 → 1.0.1 (버그 수정)
     npm run bump:version  # 1.0.1 → 1.1.0 (새 기능)
     ```

3. **buildNumber와 versionCode 중복 방지**
   - 이미 제출한 buildNumber/versionCode는 재사용 불가
   - 실패한 빌드도 번호 증가 필요 (App Store/Play Store 규정)
   - **권장**: iOS와 Android의 빌드 번호를 동기화 유지

4. **커밋 순서**
   - 빌드 전 반드시 버전 변경사항 커밋
   - buildNumber만 올림 (새 릴리스 아님):
     ```bash
     npm run bump:ios
     git commit -m "chore: bump iOS build number to X"
     ```
   - 새 버전으로 릴리스할 때 (버그 수정, 신기능 등):
     ```bash
     npm run bump:version  # 버전과 buildNumber 동시 증가
     git commit -m "chore: bump version to X.X.X"
     ```
   - 빌드 후 성공/실패 상태 기록

5. **환경 변수 관리** 🔐
   - `.env` 파일은 개발 환경에서만 사용됨
   - 프로덕션 빌드는 **반드시 EAS Secret 사용**
   - 빌드 전 `npm run validate-env` 실행 필수
   - API 키 누락 시 AI 기능 완전 차단됨

6. **프로덕션 체크리스트**
   - [ ] 환경 변수 검증 (`npm run validate-env`)
   - [ ] EAS Secret 등록 확인 (`eas env:list`)
   - [ ] 테스트 완료 (`npm test`, `npm run type-check`)
   - [ ] **expo.version 확인** - 새 릴리스인가? 아니면 내부 빌드만?
   - [ ] 버전/빌드 번호 증가 (`npm run bump:version` 또는 `npm run bump:ios`/`npm run bump:android`)
   - [ ] 변경사항 커밋
   - [ ] 빌드 실행
   - [ ] TestFlight/Internal Testing에서 AI 기능 검증 ⚠️
   - [ ] 주요 기능 정상 작동 확인
   - [ ] 스토어 제출

## 🔧 트러블슈팅

### 🚨 Play Store 제출 시 "이미 제출한 버전" 에러 (Android versionCode)

**증상**: `You've already submitted this version of the app. Versions are identified by Android version code.`

**원인**: version.json과 app.json의 android.versionCode가 불일치하거나, 이미 제출된 versionCode로 재제출 시도

**해결 방법** (2025-11-11 버그 수정됨):
```bash
# 1. 현재 버전 코드 확인
echo "version.json versionCode:"
grep -A 1 '"android"' version.json | grep versionCode
echo "app.json versionCode:"
grep '"versionCode"' app.json

# 2. 값이 불일치하면 app.json을 version.json 값으로 동기화
# (이제 npm run bump:android가 자동으로 동기화함)
npm run bump:android

# 3. 변경사항 커밋
git add app.json version.json
git commit -m "fix: sync Android versionCode"

# 4. 재빌드 및 재제출
eas build --platform android --profile production
eas submit --platform android --latest
```

### 🚨 App Store 제출 시 "이미 제출한 버전" 에러 (iOS buildNumber)

**증상**: `You've already submitted this version of the app.`

**원인**: expo.version이 변경되지 않았는데 제출 시도

**해결 방법**:
```bash
# 현재 app.json의 expo.version 확인
cat app.json | grep '"version"'

# 새 릴리스라면 버전 증가
npm run bump:version  # 또는 수동으로 version 변경

# 버전만 올리고 buildNumber도 함께 증가하려면
npm run bump:version

# 변경사항 커밋
git add app.json version.json
git commit -m "chore: bump version to X.X.X"

# 재빌드
eas build --platform ios --profile production

# 재제출
eas submit --platform ios --latest
```

### 🚨 AI 기능이 작동하지 않을 때

**증상**: "AI 서비스를 사용할 수 없습니다" 에러

**원인**: 프로덕션 빌드에 Gemini API 키가 포함되지 않음

**해결 방법**:
```bash
# 1. 환경 변수 검증
npm run validate-env

# 2. EAS Secret 등록
eas env:create --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string

# 3. Secret 등록 확인
eas env:list

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
# 로컬 환경 변수 확인 (.env 파일 자동 로드)
npm run validate-env

# EAS Secret 목록 확인 (새 명령어 사용)
eas env:list

# 특정 Secret 삭제 후 재등록 (새 명령어 사용)
eas env:delete EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY
eas env:create --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string
```

**참고**:
- `validate-env` 스크립트는 `.env` 파일의 환경 변수를 자동으로 로드합니다.
- `eas secret:*` 명령어는 deprecated되었으며, `eas env:*` 명령어를 사용하세요.

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
eas env:create --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string

# 2. 등록 확인
eas env:list

# 3. 값 업데이트가 필요한 경우
eas env:delete EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY
eas env:create --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value NEW_API_KEY --type string
```

## 📚 관련 문서

- [Expo EAS Build 공식 문서](https://docs.expo.dev/build/introduction/)
- [EAS Secrets 가이드](https://docs.expo.dev/build-reference/variables/)
- [환경 변수 모범 사례](https://docs.expo.dev/guides/environment-variables/)

---

*Last Updated: 2025-10-29*