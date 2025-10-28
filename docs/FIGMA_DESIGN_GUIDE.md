# Figma 디자인 가이드 - 남은양 카드 (무료 계정용)

## 🎨 Figma 무료 계정으로 디자인 수정하기

### Step 1: Figma 파일 생성

1. **새 디자인 파일 생성**
   - Figma 웹 접속: https://figma.com
   - `+` 버튼 → "Design file" 생성
   - 파일명: `ez2cook - ItemDetail Remains Card`

2. **프레임 생성**
   - 툴바에서 `F` (Frame 도구) 선택
   - 우측 패널에서 크기 설정:
     - Width: `335`
     - Height: `150`
   - 프레임명: `Remains Card`

---

## 📐 남은양 카드 디자인 스펙

### 전체 카드 컨테이너

```
📦 Frame: "Remains Card"
크기: W 335 × H 150

[Fill]
색상: #FFFFFF

[Stroke]
위치: Inside
색상: #E0E0E0
두께: 1px

[Corner Radius]
모든 모서리: 12px

[Effects - Drop Shadow]
X: 0, Y: 2
Blur: 8
Color: #000000 (Opacity: 4%)
```

**Figma에서 설정하는 방법:**
1. 프레임 선택
2. 우측 패널에서:
   - Fill → `+` → `#FFFFFF`
   - Stroke → `+` → Inside, `#E0E0E0`, 1px
   - Corner radius → 12
   - Effects → `+` → Drop shadow → X:0, Y:2, Blur:8, `#000000` 4%

---

### 헤더 영역 (Auto Layout)

```
📦 Frame: "Header"
Auto Layout: Horizontal
Padding: 20px(horizontal), 8px(top)
Spacing: Auto (Space between)
Width: Fill container (335px)
Height: Hug contents

  ├─ 📝 Text: "남은양"
  │   Font: Open Sans
  │   Style: SemiBold
  │   Size: 12px
  │   Color: #616161
  │
  └─ 🔘 Button: "업데이트"
      Frame with Auto Layout
      Padding: 16px(horizontal), 10px(vertical)
      Corner Radius: 18px

      [기본 상태]
      Fill: Transparent
      Stroke: #E0E0E0, 1px
      Text Color: #616161

      [활성 상태] - 별도 컴포넌트
      Fill: #26A69A
      Stroke: #26A69A, 1px
      Text Color: #FFFFFF
```

**Figma에서 설정하는 방법:**
1. `F` → Header 프레임 생성
2. 프레임 선택 → 우측 패널 `+` (Auto layout) 클릭
3. Auto Layout 설정:
   - Direction: Horizontal (→)
   - Padding: Left 20, Top 8, Right 20, Bottom 8
   - Gap: 0 (Space between 사용)
   - Alignment: Space between
4. `T` (텍스트 도구) → "남은양" 입력
5. 버튼 프레임 생성 → 텍스트 "업데이트" 추가

---

### 퍼센트 표시

```
📝 Text: "75%"
Font: Open Sans
Style: Bold
Size: 16px
Line Height: Auto
Color: #26A69A (일반) / #4A90E2 (냉동)

위치: 카드 중앙 정렬
Margin Top: 8px
```

**Figma에서 설정하는 방법:**
1. `T` → "75%" 입력
2. 우측 패널:
   - Font: Open Sans
   - Weight: Bold
   - Size: 16
   - Fill: `#26A69A`
3. Align: Horizontal center

---

### 슬라이더 디자인

#### 트랙 배경 (Background Track)

```
🔲 Rectangle: "Track Background"
크기: W 295 × H 10
Corner Radius: 5px
Fill: #E8F5F2

위치: 카드 내 중앙 정렬
Margin: 20px(horizontal), 16px(bottom)
```

**Figma에서 설정하는 방법:**
1. `R` (Rectangle) → 드래그
2. 우측 패널:
   - W: 295, H: 10
   - Corner radius: 5
   - Fill: `#E8F5F2`
3. Align: Horizontal center

---

#### 활성 트랙 (Active Fill)

```
🔲 Rectangle: "Active Track"
크기: W [동적 - 75%면 221px] × H 10
Corner Radius: 5px
Fill: #26A69A (일반) / #4A90E2 (냉동)

위치: Track Background와 좌측 정렬
```

**너비 계산 공식:**
```
Active Track Width = Track Background Width × (퍼센트 / 100)
예: 295px × (75 / 100) = 221px
```

**Figma에서 설정하는 방법:**
1. `R` → Active Track 생성
2. Track Background 위에 배치 (좌측 정렬)
3. 우측 패널:
   - W: 221 (75%일 경우)
   - H: 10
   - Corner radius: 5
   - Fill: `#26A69A`

---

#### Thumb (슬라이더 핸들)

```
🔲 Rectangle: "Thumb"
크기: W 16 × H 32
Corner Radius: 8px
Fill: #26A69A (일반) / #4A90E2 (냉동)

[Stroke]
위치: Inside
색상: #FFFFFF
두께: 2px

[Effects - Drop Shadow]
X: 0, Y: 1
Blur: 3
Color: #000000 (Opacity: 15%)

위치: Active Track 우측 끝
```

**Figma에서 설정하는 방법:**
1. `R` → Thumb 생성
2. 우측 패널:
   - W: 16, H: 32
   - Corner radius: 8
   - Fill: `#26A69A`
   - Stroke: Inside, `#FFFFFF`, 2px
   - Effects: Drop shadow → X:0, Y:1, Blur:3, `#000000` 15%
3. Active Track 우측 끝에 배치 (중앙 정렬)

---

## 🎨 컬러 팔레트

프로젝트에서 사용하는 색상들:

```
Primary (민트):
- Main: #26A69A
- Light: #E8F5F2

Frozen (블루):
- Main: #4A90E2

Neutral:
- Background: #FFFFFF
- Border: #E0E0E0
- Text Primary: #212121
- Text Secondary: #616161

Accent:
- Error/Dispose: #F44336
```

**Figma에서 색상 저장:**
1. 색상 선택 → Fill 패널에서 색상 클릭
2. 좌측 하단 `+` (Create style) 클릭
3. 이름: `Primary/Main` 등으로 저장
4. 재사용 시 Style 탭에서 선택

---

## 📏 디자인 값 확인 및 코드 적용 방법

### 1. Figma에서 값 읽기

**요소 선택 시 우측 패널에서 확인:**

| Figma 항목 | React Native 코드 |
|-----------|------------------|
| Width: 335 | `width: 335` |
| Height: 150 | `height: 150` |
| Corner radius: 12 | `borderRadius: 12` |
| Fill: #FFFFFF | `backgroundColor: '#FFFFFF'` |
| Stroke: Inside, #E0E0E0, 1px | `borderWidth: 1, borderColor: '#E0E0E0'` |
| Drop shadow: X:0 Y:2 Blur:8 | `shadowOffset: { width: 0, height: 2 }, shadowRadius: 8` |
| Auto Layout Padding: 20 | `paddingHorizontal: 20` |
| Auto Layout Gap: 8 | `gap: 8` |

### 2. 거리 측정하기 (Dev Mode 없이)

**방법:**
1. 요소 선택
2. `Alt` (Windows) / `Option` (Mac) 누른 상태로 다른 요소에 마우스 오버
3. 빨간색 선과 숫자로 거리 표시됨

**예시:**
- Header와 Percentage 사이 거리 → `marginBottom: 8`
- 카드 좌우 여백 → `marginHorizontal: 20`

### 3. 색상 복사하기

**방법 1: Fill 패널에서 복사**
1. 요소 선택 → Fill 클릭
2. Hex 코드 복사 (`#26A69A`)

**방법 2: 빠른 복사**
1. 요소 선택
2. Fill 위에 마우스 오버
3. `Ctrl+C` / `Cmd+C` → Hex 코드 복사됨

---

## 🔄 디자인 수정 후 코드 적용 예시

### Figma에서 슬라이더 트랙 높이를 10px → 12px로 변경한 경우

**Figma 작업:**
1. Track Background 선택
2. Height: `12` 입력
3. Active Track 선택
4. Height: `12` 입력

**코드 적용:**
```typescript
// src/screens/ItemDetailScreen.tsx (Line 909)

track: {
  height: 12,  // 10에서 12로 변경
  backgroundColor: '#E8F5F2',
  borderRadius: 5,
  overflow: 'hidden',
},
activeFill: {
  position: 'absolute',
  left: 0,
  height: 12,  // 10에서 12로 변경
  borderRadius: 5,
},
```

---

## 💡 자주 수정하는 디자인 요소들

### 1. 슬라이더 Thumb 모양 변경

**원형 → 타원형:**
- Figma: W 16 → 20, Corner radius: 8 → 10
- 코드: `width: 20, borderRadius: 10`

### 2. 카드 그림자 강도 조정

**Figma:**
- Effects → Drop shadow
- Blur: 8 → 12
- Opacity: 4% → 8%

**코드:**
```typescript
shadowRadius: 12,  // 8에서 12로
shadowOpacity: 0.08,  // 0.04에서 0.08로
```

### 3. 색상 변경 (예: Primary 색상)

**Figma:**
- Color style `Primary/Main` 수정: #26A69A → #00BFA5

**코드:**
```typescript
// src/constants/colors.ts
primary: {
  main: '#00BFA5',  // 변경
  // ...
}
```

---

## 📱 반응형 디자인 고려사항

### 화면 너비에 따른 카드 너비 조정

**Figma에서 여러 버전 만들기:**
```
Frame 1: "Remains Card - Small (320px)"
Frame 2: "Remains Card - Medium (375px)"
Frame 3: "Remains Card - Large (414px)"
```

**코드에서 동적 계산:**
```typescript
const screenWidth = Dimensions.get('window').width;
const cardWidth = screenWidth - (Spacing.lg * 2); // 좌우 여백 제외
```

---

## 🎓 Figma 학습 팁 (무료 계정)

### 유용한 단축키

| 작업 | Windows | Mac |
|------|---------|-----|
| 프레임 생성 | `F` | `F` |
| 사각형 | `R` | `R` |
| 텍스트 | `T` | `T` |
| Auto Layout | `Shift + A` | `Shift + A` |
| 거리 측정 | `Alt` 누른 채 hover | `Option` 누른 채 hover |
| 복제 | `Ctrl + D` | `Cmd + D` |
| 그룹화 | `Ctrl + G` | `Cmd + G` |

### 추천 무료 리소스

1. **Figma 공식 튜토리얼**: https://help.figma.com/
2. **Figma Community**: 무료 UI Kit 검색 (React Native, Material Design)
3. **YouTube**: "Figma tutorial for developers"

---

## 📤 디자인 완성 후 공유 방법

### 개발자에게 Figma 파일 공유

1. **파일 공유 링크 생성**
   - 우측 상단 `Share` 버튼 클릭
   - "Anyone with the link can view" 선택
   - 링크 복사

2. **주석 추가하기**
   - `C` (Comment 도구)
   - 수정이 필요한 부분에 코멘트 추가
   - 예: "이 슬라이더 높이를 12px로 변경해주세요"

3. **Inspect 모드 (무료 계정도 가능!)**
   - 우측 상단 사용자 아이콘 옆 코드 아이콘 클릭
   - 요소 선택 시 CSS 값 자동 표시 (제한적)

---

## 🔧 코드 연동 체크리스트

Figma에서 디자인 수정 후 코드에 적용할 때:

- [ ] 모든 크기 값 확인 (W, H)
- [ ] 색상 Hex 코드 복사
- [ ] Border radius 확인
- [ ] Padding/Margin 값 측정
- [ ] 그림자 설정 확인 (offset, blur, opacity)
- [ ] 텍스트 스타일 확인 (font, size, weight, color)
- [ ] 요소 간 간격 측정 (Alt/Option 사용)

---

## 🎯 다음 단계

1. **Figma 파일 생성** - 위 스펙대로 남은양 카드 디자인
2. **원하는 대로 디자인 수정** - 색상, 크기, 간격 등
3. **우측 패널에서 값 확인** - 숫자 복사
4. **코드에 적용** - StyleSheet 수정
5. **앱에서 테스트** - `npx expo start`

---

## 📞 도움이 필요하면

- Figma 디자인 완성 후 스크린샷 공유
- 어떤 값을 코드에 적용해야 할지 질문
- 코드 수정 도움 요청

Happy Designing! 🎨
