# 단순화된 앱 색상 팔레트 가이드

## 📊 색상 최적화 요약
- **기존**: 20개 색상 (Status 4개 포함)
- **개선**: 13개 색상 (Status 4개 포함)
- **감소율**: 44% 색상 감소 (Status 제외 시)

## 🎨 핵심 색상 팔레트 (9개 + Status 4개)

### 1️⃣ Primary Colors (3개)
```css
/* 주요 브랜드 색상 */
--color-primary: #26A69A;      /* 메인 민트 - 버튼, CTA, 주요 액션 */
--color-primary-dark: #00897B;  /* 다크 민트 - 눌린 상태, 헤더 */
--color-primary-light: #E8F5F2; /* 라이트 민트 - 선택/호버 배경, 연한 테두리 */
```

### 2️⃣ Text Colors (3개)
```css
/* 텍스트 계층 구조 */
--color-text-primary: #1a1a1a;   /* 제목, 본문 */
--color-text-secondary: #5f6368; /* 보조 설명, 라벨 */
--color-text-disabled: #9AA0A6;  /* 비활성, 플레이스홀더 */
```

### 3️⃣ Background & Surface (3개)
```css
/* 배경 및 표면 색상 */
--color-surface: #FFFFFF;      /* 카드, 모달, Primary 위 텍스트 */
--color-background: #F8FDFC;   /* 앱 전체 배경 */
--color-border: #D0E8E6;       /* 테두리, 구분선 */
```

### 4️⃣ Status Colors (4개 - 유지)
```css
/* 상태 표시 색상 */
--color-success: #4CAF50;  /* 성공 */
--color-warning: #FFA726;  /* 경고 */
--color-error: #EF5350;    /* 오류 */
--color-info: #26A69A;     /* 정보 (Primary와 동일) */
```

## 🔄 색상 통합 매핑

### 제거된 색상 → 대체 색상
```
#4DB6AC (Light mint - 호버)     → #26A69A 사용 (opacity: 0.8)
#F0F9F8 (Container background)  → #F8FDFC 사용
#E0F2F1 (Light border)          → #E8F5F2 사용
#FFFFFF 중복 (텍스트/배경)       → #FFFFFF 하나로 통합
#E8F5F2 중복 (컨테이너/테두리)   → #E8F5F2 하나로 통합
```

## 💡 사용 가이드

### 버튼 스타일 예시
```css
.button-primary {
  background: var(--color-primary);      /* 기본 상태 */
  color: var(--color-surface);
}
.button-primary:hover {
  background: var(--color-primary);      /* 호버는 opacity로 처리 */
  opacity: 0.85;
}
.button-primary:active {
  background: var(--color-primary-dark); /* 눌린 상태 */
}
```

### 카드 컴포넌트 예시
```css
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}
.card.selected {
  background: var(--color-primary-light);
  border-color: var(--color-primary);
}
```

### 텍스트 계층 구조
```css
h1, h2, h3 {
  color: var(--color-text-primary);
}
.subtitle, .description {
  color: var(--color-text-secondary);
}
.hint, input::placeholder {
  color: var(--color-text-disabled);
}
```

## 🎯 구현 우선순위

### 1단계: CSS 변수 정의
```css
:root {
  /* Primary */
  --color-primary: #26A69A;
  --color-primary-dark: #00897B;
  --color-primary-light: #E8F5F2;
  
  /* Text */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #5f6368;
  --color-text-disabled: #9AA0A6;
  
  /* Background */
  --color-surface: #FFFFFF;
  --color-background: #F8FDFC;
  --color-border: #D0E8E6;
  
  /* Status */
  --color-success: #4CAF50;
  --color-warning: #FFA726;
  --color-error: #EF5350;
  --color-info: #26A69A;
}
```

### 2단계: 기존 색상 교체
1. 모든 `#4DB6AC` → `#26A69A` + opacity 조정
2. 모든 `#F0F9F8` → `#F8FDFC`
3. 모든 `#E0F2F1` → `#E8F5F2`
4. 중복된 `#FFFFFF` 참조 통합
5. 중복된 `#E8F5F2` 참조 통합

### 3단계: 컴포넌트별 적용
- **버튼**: Primary 3개 색상만 사용
- **입력 필드**: Border + Text 색상 활용
- **카드/모달**: Surface + Border 조합
- **배경**: Background 기본, Surface로 레이어링

## ✅ 체크리스트

- [ ] CSS 변수로 모든 색상 정의
- [ ] 하드코딩된 색상 값 제거
- [ ] 중복 색상 통합 완료
- [ ] 호버 효과는 opacity로 처리
- [ ] 다크모드 대응 변수 준비 (선택사항)

## 📝 추가 권장사항

### 투명도 활용
```css
/* 호버, 비활성 상태에 투명도 활용 */
--color-primary-hover: rgba(38, 166, 154, 0.85);
--color-disabled-bg: rgba(154, 160, 166, 0.1);
```

### 그림자 정의
```css
/* 일관된 그림자 효과 */
--shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
```

## 🚀 마이그레이션 스크립트 예시

```javascript
// 색상 매핑 객체
const colorMigration = {
  '#4DB6AC': 'var(--color-primary)',  // with opacity: 0.85
  '#F0F9F8': 'var(--color-background)',
  '#E0F2F1': 'var(--color-primary-light)',
  // ... 기타 매핑
};

// CSS 파일에서 일괄 교체
function migrateColors(cssContent) {
  let updated = cssContent;
  for (const [old, replacement] of Object.entries(colorMigration)) {
    updated = updated.replace(new RegExp(old, 'gi'), replacement);
  }
  return updated;
}
```

---

이 가이드를 참고하여 색상 시스템을 단순화하고 일관성 있는 디자인 시스템을 구축하세요!
