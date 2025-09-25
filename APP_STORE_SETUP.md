# App Store 제출을 위한 설정 정보

## Apple Developer 정보
등록 완료 후 아래 정보를 기록하세요:

### Team ID 확인 방법:
1. https://developer.apple.com/account 접속
2. 우측 상단 계정명 아래에 표시됨
3. 형식: XXXXXXXXXX (10자리 영숫자)

### App Store Connect App ID 확인 방법:
1. https://appstoreconnect.apple.com 접속
2. "My Apps" → 생성한 앱 선택
3. "앱 정보" 섹션
4. Apple ID 확인 (숫자)

### 필요한 정보:
- Apple ID (이메일): _______________
- Team ID: _______________
- App Store Connect App ID: _______________
- Bundle ID: com.smartagent.nengpro

## EAS 빌드 명령어

### 1. 첫 번째 빌드 (인증서 자동 생성)
```bash
eas build --platform ios --profile production
```

### 2. 빌드 상태 확인
```bash
eas build:list --platform ios
```

### 3. 빌드 완료 후 제출
```bash
eas submit --platform ios --profile production
```

## 체크리스트
- [ ] Bundle ID 등록 완료 (com.smartagent.nengpro)
- [ ] App Store Connect에 앱 생성 완료
- [ ] eas.json에 Apple 정보 입력
- [ ] 앱 아이콘 1024x1024 준비
- [ ] 스크린샷 준비
- [ ] 개인정보 처리방침 URL 준비