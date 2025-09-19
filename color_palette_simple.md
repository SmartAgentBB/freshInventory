# 단순화된 색상 팔레트 (13개)

## 🎨 Primary Colors (3개)
- `#26A69A` - Primary (메인 민트) - 버튼, CTA, 주요 액션
- `#00897B` - Primary Dark (다크 민트) - 눌린 상태, 헤더
- `#E8F5F2` - Primary Light (라이트 민트) - 선택/호버 배경, 연한 테두리

## ✏️ Text Colors (3개)
- `#1a1a1a` - Text Primary - 제목, 본문
- `#5f6368` - Text Secondary - 보조 설명, 라벨
- `#9AA0A6` - Text Disabled - 비활성, 플레이스홀더

## 🎯 Background & Surface (3개)
- `#FFFFFF` - Surface - 카드, 모달, Primary 위 텍스트
- `#F8FDFC` - Background - 앱 전체 배경
- `#D0E8E6` - Border - 테두리, 구분선

## 🚦 Status Colors (4개)
- `#4CAF50` - Success (성공)
- `#FFA726` - Warning (경고)
- `#EF5350` - Error (오류)
- `#26A69A` - Info (정보) - Primary와 동일

---

## CSS 변수 정의 (복사용)

```css
:root {
  /* Primary Colors */
  --color-primary: #26A69A;
  --color-primary-dark: #00897B;
  --color-primary-light: #E8F5F2;
  
  /* Text Colors */
  --color-text-primary: #1a1a1a;
  --color-text-secondary: #5f6368;
  --color-text-disabled: #9AA0A6;
  
  /* Background & Surface */
  --color-surface: #FFFFFF;
  --color-background: #F8FDFC;
  --color-border: #D0E8E6;
  
  /* Status Colors */
  --color-success: #4CAF50;
  --color-warning: #FFA726;
  --color-error: #EF5350;
  --color-info: #26A69A;
}
```

---

## 제거된 색상 매핑

| 기존 색상 | 대체 방법 |
|---------|----------|
| `#4DB6AC` (Light mint) | `#26A69A` + opacity 0.85 |
| `#F0F9F8` (Container bg) | `#F8FDFC` 사용 |
| `#E0F2F1` (Light border) | `#E8F5F2` 사용 |
| `#FFFFFF` 중복 | 하나로 통합 |
| `#E8F5F2` 중복 | 하나로 통합 |

---

## 빠른 적용 예시

```css
/* 버튼 */
.btn-primary {
  background: var(--color-primary);
  color: var(--color-surface);
}

/* 카드 */
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
}

/* 텍스트 */
.text-primary { color: var(--color-text-primary); }
.text-secondary { color: var(--color-text-secondary); }
.text-disabled { color: var(--color-text-disabled); }

/* 상태 */
.alert-success { background: var(--color-success); }
.alert-warning { background: var(--color-warning); }
.alert-error { background: var(--color-error); }
.alert-info { background: var(--color-info); }
```
