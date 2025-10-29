# 냉파고 앱 자동화 테스트 시나리오

## 🚀 Mobile-MCP 설정

### 1. 사전 준비
```bash
# Android 환경
- Android Studio 설치
- ADB (Android Debug Bridge) 설정
- 에뮬레이터 또는 실제 기기 연결

# iOS 환경 (Mac only)
- Xcode 설치
- Command Line Tools 설치
- 시뮬레이터 실행
```

### 2. Claude Desktop 설정
```json
{
  "mcpServers": {
    "mobile-mcp": {
      "command": "npx",
      "args": ["-y", "@mobilenext/mobile-mcp@latest"]
    }
  }
}
```

## 📱 테스트 시나리오

### Scenario 1: 회원가입 및 로그인
```
1. 앱 실행
2. 로그인 화면 확인
3. "회원가입" 버튼 탭
4. 이메일 입력: test@example.com
5. 비밀번호 입력: Test123!
6. "가입하기" 버튼 탭
7. 로그인 성공 확인
8. 메인 화면 진입 확인
```

### Scenario 2: 재고 추가 (AI 이미지 인식)
```
1. 재고 화면 이동
2. 카메라(+) 버튼 탭
3. 갤러리에서 이미지 선택
4. AI 분석 로딩 확인
5. 인식된 재료 목록 확인
6. 수량 조정 (+/- 버튼)
7. "저장" 버튼 탭
8. 재고 목록에 추가 확인
```

### Scenario 3: 요리 추천 받기
```
1. 요리 화면 이동
2. "요리 추천" 탭 선택
3. 재료 5개 선택
4. 스타일 입력: "맥주 안주"
5. "요리 추천받기" 버튼 탭
6. 로딩 중 광고 표시 확인 (향후)
7. 추천 레시피 3개 이상 확인
8. 레시피 카드 탭하여 상세 보기
```

### Scenario 4: 장보기 리스트
```
1. 장보기 화면 이동
2. "항목 추가" 버튼 탭
3. 텍스트 입력: "우유 1L"
4. 수량: 2개 설정
5. "추가" 버튼 탭
6. 리스트에 표시 확인
7. 체크박스 탭하여 완료 처리
8. 완료 탭으로 이동 확인
```

### Scenario 5: 유통기한 알림
```
1. 재고 화면에서 만료 임박 아이템 확인
2. 빨간색 표시 항목 확인
3. 아이템 탭하여 상세 정보
4. 유통기한 날짜 확인
5. 알림 설정 확인
```

## 🧪 성능 테스트

### 응답 시간 측정
```javascript
const performanceTests = {
  "앱 시작": "< 3초",
  "화면 전환": "< 1초",
  "AI 이미지 분석": "< 5초",
  "요리 추천 생성": "< 4초",
  "데이터 동기화": "< 2초"
};
```

### 메모리 사용량 체크
```javascript
const memoryLimits = {
  "idle": "< 100MB",
  "active": "< 200MB",
  "imageProcessing": "< 300MB"
};
```

## 🐛 엣지 케이스 테스트

### 네트워크 관련
```
1. 오프라인 상태에서 앱 실행
2. 느린 네트워크에서 이미지 업로드
3. 네트워크 전환 중 데이터 저장
```

### 데이터 관련
```
1. 대량 데이터 (100개 이상) 처리
2. 특수 문자 입력
3. 긴 텍스트 입력 (500자 이상)
4. 동시 다중 작업
```

### 권한 관련
```
1. 카메라 권한 거부 상태
2. 갤러리 접근 권한 없음
3. 알림 권한 비활성화
```

## 🤖 Claude 명령 예시

### 기본 테스트
```
"냉파고 앱을 열고 로그인 화면이 나타나는지 확인해줘"
"test@example.com으로 로그인하고 메인 화면으로 이동해줘"
"재고 추가 버튼을 눌러서 카메라가 열리는지 테스트해줘"
```

### 복잡한 시나리오
```
"재고에서 만료 임박한 재료 3개를 선택하고,
요리 추천을 받은 다음,
첫 번째 레시피를 북마크하고,
유튜브 검색 버튼이 작동하는지 확인해줘"
```

### 성능 테스트
```
"각 화면 전환 시간을 측정하고 3초 이상 걸리는 화면을 찾아줘"
"이미지 업로드부터 AI 분석 완료까지 시간을 10번 측정해줘"
```

## 📊 테스트 리포트 템플릿

```markdown
### 테스트 실행 결과
- 날짜: 2024-XX-XX
- 기기: [Android/iOS] [버전]
- 앱 버전: 1.0.0

#### ✅ 성공한 테스트 (X/Y)
- [ ] 로그인/회원가입
- [ ] 재고 CRUD
- [ ] AI 이미지 인식
- [ ] 요리 추천
- [ ] 장보기 리스트

#### ❌ 실패한 테스트
- 테스트명:
- 실패 이유:
- 스크린샷:

#### ⚠️ 개선 필요 사항
- UI 반응 속도
- 에러 메시지
- 접근성
```

## 🔄 CI/CD 통합

### GitHub Actions 연동
```yaml
name: Mobile App Test
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install Mobile-MCP
        run: npm install -g @mobilenext/mobile-mcp

      - name: Run Tests
        run: |
          # Start simulator
          xcrun simctl boot "iPhone 15"

          # Run test scenarios
          npx mobile-mcp test --config test-config.json
```

## 💡 Best Practices

1. **테스트 데이터 격리**
   - 테스트 전용 계정 사용
   - 테스트 후 데이터 정리

2. **안정적인 셀렉터**
   - testID 속성 활용
   - 접근성 라벨 사용

3. **대기 전략**
   - 명시적 대기 사용
   - 암묵적 대기 피하기

4. **스크린샷 활용**
   - 실패 시 자동 캡처
   - 단계별 스크린샷

5. **병렬 테스트**
   - 여러 기기 동시 테스트
   - 테스트 시간 단축