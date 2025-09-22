# Supabase 이메일 템플릿 커스터마이징 가이드

## 🎯 Supabase 대시보드에서 이메일 템플릿 설정하기

### 1. Supabase 프로젝트 대시보드 접속
1. https://app.supabase.com 로그인
2. Ez2Cook 프로젝트 선택

### 2. 이메일 템플릿 설정 경로
```
Authentication → Email Templates
```

### 3. 커스터마이징 가능한 이메일 유형

#### 📧 회원가입 확인 이메일 (Confirm signup)
**기본 제목:**
```
Confirm Your Signup
```

**Ez2Cook 커스텀 제목:**
```
[Ez2Cook] 회원가입을 완료해주세요 🍳
```

**커스텀 본문:**
```html
<h2>Ez2Cook에 오신 것을 환영합니다! 🎉</h2>

<p>안녕하세요!</p>

<p>Ez2Cook 회원가입을 진행해 주셔서 감사합니다.</p>
<p>아래 버튼을 클릭하여 이메일 인증을 완료해주세요:</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #26A69A;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;">
    이메일 인증하기
  </a>
</p>

<p>또는 아래 링크를 복사하여 브라우저에 붙여넣으세요:</p>
<p>{{ .ConfirmationURL }}</p>

<p style="color: #666; font-size: 14px;">
  이 링크는 24시간 동안 유효합니다.<br>
  본인이 가입하지 않으셨다면 이 메일을 무시하셔도 됩니다.
</p>

<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">

<p style="color: #999; font-size: 12px;">
  Ez2Cook - 스마트한 주방 관리의 시작<br>
  문의: support@ez2cook.com
</p>
```

#### 🔐 비밀번호 재설정 이메일 (Reset Password)
**커스텀 제목:**
```
[Ez2Cook] 비밀번호 재설정 요청 🔒
```

**커스텀 본문:**
```html
<h2>비밀번호 재설정</h2>

<p>안녕하세요, Ez2Cook 사용자님!</p>

<p>비밀번호 재설정을 요청하셨습니다.</p>
<p>아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요:</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #26A69A;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;">
    비밀번호 재설정하기
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  이 링크는 1시간 동안 유효합니다.<br>
  본인이 요청하지 않으셨다면 이 메일을 무시하셔도 됩니다.
</p>
```

#### ✨ Magic Link 로그인 이메일
**커스텀 제목:**
```
[Ez2Cook] 로그인 링크가 도착했습니다 📱
```

**커스텀 본문:**
```html
<h2>Ez2Cook 간편 로그인</h2>

<p>안녕하세요!</p>

<p>아래 버튼을 클릭하여 Ez2Cook에 로그인하세요:</p>

<p>
  <a href="{{ .ConfirmationURL }}"
     style="background-color: #26A69A;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 4px;
            display: inline-block;">
    Ez2Cook 로그인하기
  </a>
</p>

<p style="color: #666; font-size: 14px;">
  이 링크는 1시간 동안 유효합니다.
</p>
```

## 🛠️ Supabase 대시보드 설정 방법

### 1단계: Authentication 설정
1. Supabase 대시보드 → Authentication → Email Templates
2. 각 템플릿 유형 선택 (Confirm signup, Reset password 등)
3. "Enable custom email" 토글 켜기

### 2단계: 템플릿 수정
1. Subject 필드에 한국어 제목 입력
2. Message body에 HTML 템플릿 붙여넣기
3. Save 클릭

### 3단계: SMTP 설정 (선택사항 - 더 나은 전송률)
고급 설정으로 자체 SMTP 서버 사용 가능:

1. Settings → Project Settings → Auth
2. "Enable Custom SMTP" 켜기
3. SMTP 정보 입력:
   ```
   Host: smtp.gmail.com (Gmail 예시)
   Port: 587
   Username: your-email@gmail.com
   Password: 앱 비밀번호
   Sender email: Ez2Cook <noreply@ez2cook.com>
   Sender name: Ez2Cook
   ```

## 📝 사용 가능한 변수

이메일 템플릿에서 사용 가능한 Supabase 변수:

- `{{ .ConfirmationURL }}` - 인증/확인 링크
- `{{ .Token }}` - 인증 토큰
- `{{ .TokenHash }}` - 토큰 해시
- `{{ .SiteURL }}` - 사이트 URL
- `{{ .Email }}` - 사용자 이메일

## ⚠️ 주의사항

1. **HTML 이메일 작성 시**
   - 인라인 스타일 사용 (외부 CSS 지원 안됨)
   - 이미지는 절대 URL 사용
   - 모바일 친화적 디자인

2. **스팸 방지**
   - SPF, DKIM 설정 권장
   - 과도한 이미지나 링크 피하기
   - 명확한 발신자 정보 표시

3. **다국어 지원**
   - 한국어 사용 시 UTF-8 인코딩
   - 이모지 사용 가능하나 일부 클라이언트에서 미지원

## 🎨 브랜드 일관성 유지

Ez2Cook 브랜드 가이드라인:
- 주 색상: #26A69A (민트)
- 보조 색상: #B2DFDB (라이트 민트)
- 폰트: Open Sans
- 톤: 친근하고 간결한 한국어

## 📱 테스트 방법

1. **테스트 계정으로 회원가입**
2. **각 이메일 유형 트리거**
   - 회원가입 → 인증 메일
   - 비밀번호 재설정 요청 → 재설정 메일
3. **다양한 이메일 클라이언트에서 확인**
   - Gmail, Naver, Daum
   - 모바일 앱 (iOS Mail, Gmail 앱)
   - 데스크톱 클라이언트

## 🚀 적용 후 체크리스트

- [ ] 모든 이메일 템플릿에 Ez2Cook 브랜딩 적용
- [ ] 한국어 제목과 내용으로 변경
- [ ] 모바일에서 이메일 레이아웃 확인
- [ ] 스팸 폴더 체크
- [ ] 링크 클릭 테스트
- [ ] 24시간 유효기간 안내 포함

이렇게 설정하면 사용자가 Ez2Cook 앱의 이메일임을 명확히 인지할 수 있습니다!