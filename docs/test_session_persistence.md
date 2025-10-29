# 세션 유지 기능 테스트 가이드

## 📱 테스트 환경
- Expo Go (iOS/Android)
- 개발 빌드
- 실제 기기 (권장)

## ✅ 테스트 체크리스트

### 1. 기본 세션 유지
- [ ] 로그인
- [ ] 앱 완전 종료 (멀티태스킹에서 제거)
- [ ] 앱 재실행
- [ ] 로그인 상태 유지 확인

### 2. 앱 업데이트 시나리오
- [ ] 로그인
- [ ] Expo 개발 서버 재시작 (Ctrl+C → npx expo start)
- [ ] 앱 새로고침 (개발 모드에서 r 키)
- [ ] 로그인 상태 유지 확인

### 3. 백그라운드 전환
- [ ] 로그인
- [ ] 앱을 백그라운드로 이동 (홈 버튼)
- [ ] 5분 대기
- [ ] 앱 다시 열기
- [ ] 로그인 상태 유지 확인

### 4. 장시간 방치
- [ ] 로그인
- [ ] 앱 종료
- [ ] 24시간 대기
- [ ] 앱 재실행
- [ ] 로그인 상태 유지 확인 (토큰 자동 갱신)

### 5. 네트워크 변경
- [ ] 로그인 (WiFi)
- [ ] WiFi → 모바일 데이터 전환
- [ ] 앱 정상 작동 확인
- [ ] 로그인 상태 유지 확인

### 6. 로그아웃 테스트
- [ ] 로그인
- [ ] 프로필에서 로그아웃 버튼 클릭
- [ ] 앱 재시작
- [ ] 로그인 화면으로 이동하는지 확인

## 🐛 디버깅 방법

### AsyncStorage 내용 확인
ProfileScreen에 임시 버튼 추가:

\`\`\`typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const debugSession = async () => {
  const keys = await AsyncStorage.getAllKeys();
  const supabaseKeys = keys.filter(k => k.includes('supabase'));

  console.log('=== Supabase Session Debug ===');
  for (const key of supabaseKeys) {
    const value = await AsyncStorage.getItem(key);
    console.log(\`\${key}:\`, value?.substring(0, 100));
  }
};

// 버튼에 연결
<Button onPress={debugSession}>세션 디버그</Button>
\`\`\`

### 콘솔 로그 확인
useAuth 훅에서 다음 이벤트 로그 확인:
- `SIGNED_IN`: 로그인 성공
- `TOKEN_REFRESHED`: 토큰 자동 갱신
- `INITIAL_SESSION`: 저장된 세션 복원
- `SIGNED_OUT`: 로그아웃

## 📊 예상 결과

### ✅ 성공
- 앱 재시작 후 자동으로 메인 화면 표시
- 로딩 화면이 잠깐 표시된 후 바로 로그인 상태
- 알림 설정이 계속 유지됨

### ❌ 실패
- 앱 재시작 시 로그인 화면으로 이동
- "잠시만 기다려주세요..." 로딩 후 로그인 화면
- 알림이 오지 않음

## 🔧 문제 해결

### 세션이 유지되지 않는 경우
1. AsyncStorage 권한 확인
2. Supabase 프로젝트 설정 확인
3. 네트워크 연결 확인
4. 콘솔 로그에서 에러 확인

### 토큰 갱신 실패
1. Supabase 프로젝트 JWT 만료 시간 확인
2. `autoRefreshToken: true` 설정 확인
3. 네트워크 연결 상태 확인
