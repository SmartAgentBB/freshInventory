# Figma 무료 계정 워크플로우 - 완전 가이드

## 🎯 Dev Mode 없이 모든 값 확인하기

Figma 무료 계정에서도 **Dev Mode 없이** 모든 디자인 값을 정확하게 확인할 수 있습니다!

---

## 📐 Step-by-Step 실전 가이드

### Step 1: 요소 선택 및 기본 값 확인

```
┌─────────────────────────────────────┐
│  Figma 화면 (요소 선택 시)          │
├─────────────────────────────────────┤
│                                     │
│  [선택한 요소]                       │
│     ┌─────────────┐                │
│     │  Card       │ ← 클릭          │
│     └─────────────┘                │
│                                     │
│  우측 패널 (Design) ▼               │
│  ┌────────────────────────┐        │
│  │ 📐 Position & Size      │        │
│  │  X: 20   Y: 100        │ ← 위치  │
│  │  W: 335  H: 150        │ ← 크기  │
│  │                         │        │
│  │ 🔲 Corner radius        │        │
│  │  ●●●●  12              │ ← 모서리│
│  │                         │        │
│  │ 🎨 Fill                 │        │
│  │  #FFFFFF               │ ← 배경색│
│  │                         │        │
│  │ 📏 Stroke               │        │
│  │  Inside  #E0E0E0  1px  │ ← 테두리│
│  │                         │        │
│  │ ☁️ Effects              │        │
│  │  Drop shadow           │ ← 그림자│
│  │   X:0 Y:2 Blur:8       │        │
│  │   #000000  4%          │        │
│  └────────────────────────┘        │
└─────────────────────────────────────┘
```

**이 값들을 코드로 변환:**
```typescript
const styles = StyleSheet.create({
  card: {
    width: 335,              // W: 335
    height: 150,             // H: 150
    borderRadius: 12,        // Corner radius: 12
    backgroundColor: '#FFFFFF', // Fill: #FFFFFF
    borderWidth: 1,          // Stroke: 1px
    borderColor: '#E0E0E0',  // Stroke: #E0E0E0
    shadowOffset: { width: 0, height: 2 }, // X:0 Y:2
    shadowRadius: 8,         // Blur: 8
    shadowOpacity: 0.04,     // 4%
    shadowColor: '#000000',  // #000000
  },
});
```

---

### Step 2: 거리 측정 (Dev Mode 불필요!)

**방법 1: Alt/Option 키 사용**

```
┌─────────────────────────────────────┐
│  Header 선택                         │
│  ┌───────────────┐                  │
│  │ 남은양   업데이트│                  │
│  └───────────────┘                  │
│         ↓                            │
│        [8]  ← Alt/Option 누른 채     │
│         ↓      Percentage에 hover    │
│  ┌───────────┐                      │
│  │   75%     │                      │
│  └───────────┘                      │
│                                     │
│  빨간 선과 숫자로 거리 표시됨!         │
└─────────────────────────────────────┘
```

**코드 적용:**
```typescript
header: {
  marginBottom: 8, // Alt로 측정한 거리
},
```

**방법 2: Auto Layout 패널에서 확인**

```
┌────────────────────────┐
│ Auto Layout            │
├────────────────────────┤
│ ↔️ Horizontal           │
│                        │
│ 📦 Padding:            │
│   Top:    8           │ ← paddingTop
│   Right:  20          │ ← paddingRight
│   Bottom: 8           │ ← paddingBottom
│   Left:   20          │ ← paddingLeft
│                        │
│ ↕️ Gap between items:  │
│   12                  │ ← gap
└────────────────────────┘
```

**코드 적용:**
```typescript
container: {
  paddingTop: 8,
  paddingRight: 20,
  paddingBottom: 8,
  paddingLeft: 20,
  gap: 12, // React Native 0.71+
},
```

---

### Step 3: 색상 복사하기

**방법 1: Fill 패널에서**

```
┌────────────────────────┐
│ Fill                   │
├────────────────────────┤
│ ⬛ #26A69A             │ ← 클릭
│                        │
│  [Color Picker]        │
│  ┌──────────────────┐  │
│  │  Hex: #26A69A    │ ← 드래그해서 복사
│  │  R: 38           │  │
│  │  G: 166          │  │
│  │  B: 154          │  │
│  │  A: 100%         │  │
│  └──────────────────┘  │
└────────────────────────┘
```

**방법 2: 빠른 복사 (단축키)**

1. 요소 선택
2. Fill 색상 위에 마우스 오버
3. `Ctrl+C` (Windows) / `Cmd+C` (Mac)
4. → `#26A69A` 클립보드에 복사됨!

**투명도 있는 색상:**
```
Figma: #000000 (Opacity: 4%)
코드:  rgba(0, 0, 0, 0.04) 또는 shadowOpacity: 0.04
```

---

### Step 4: 텍스트 스타일 확인

```
┌────────────────────────┐
│ Text                   │
├────────────────────────┤
│ Font:     Open Sans    │ ← fontFamily
│ Weight:   SemiBold     │ ← fontWeight
│ Size:     12           │ ← fontSize
│ Height:   Auto         │ ← lineHeight
│                        │
│ Fill:     #616161      │ ← color
│                        │
│ Alignment:             │
│  [■ ▢ ▢]  Left        │ ← textAlign
└────────────────────────┘
```

**코드 적용:**
```typescript
headerText: {
  fontFamily: 'OpenSans-SemiBold', // Font + Weight
  fontSize: 12,                     // Size
  color: '#616161',                 // Fill
  textAlign: 'left',                // Alignment
},
```

---

### Step 5: 그림자 설정 변환

**Figma Effects 패널:**
```
┌────────────────────────┐
│ Effects                │
├────────────────────────┤
│ ☁️ Drop shadow          │
│   X: 0                 │
│   Y: 2                 │
│   Blur: 8              │
│   Spread: 0            │
│   #000000  4%          │
└────────────────────────┘
```

**React Native 코드 (iOS):**
```typescript
shadowColor: '#000000',
shadowOffset: { width: 0, height: 2 }, // X, Y
shadowRadius: 8,                        // Blur
shadowOpacity: 0.04,                    // 4% → 0.04
```

**React Native 코드 (Android):**
```typescript
elevation: 2, // 대략적 변환: Y값 사용
```

**주의:** React Native는 Spread를 지원하지 않습니다!

---

## 🎨 실전 예시: 슬라이더 Thumb 디자인 확인

### Figma에서 Thumb 선택 시

```
┌─────────────────────────────────────┐
│  Thumb (Rectangle)                  │
│  ┌────┐  ← 선택한 요소              │
│  │    │                             │
│  │    │                             │
│  └────┘                             │
│                                     │
│  우측 패널:                          │
│  ┌────────────────────────┐        │
│  │ 📐 Size                 │        │
│  │  W: 16   H: 32         │        │
│  │                         │        │
│  │ 🔲 Corner radius        │        │
│  │  ●●●●  8               │        │
│  │                         │        │
│  │ 🎨 Fill                 │        │
│  │  #26A69A               │        │
│  │                         │        │
│  │ 📏 Stroke               │        │
│  │  Inside  #FFFFFF  2px  │        │
│  │                         │        │
│  │ ☁️ Effects              │        │
│  │  Drop shadow           │        │
│  │   X:0 Y:1 Blur:3       │        │
│  │   #000000  15%         │        │
│  └────────────────────────┘        │
└─────────────────────────────────────┘
```

### 코드 변환

```typescript
thumb: {
  width: 16,                           // W: 16
  height: 32,                          // H: 32
  borderRadius: 8,                     // Corner radius: 8
  backgroundColor: '#26A69A',          // Fill: #26A69A
  borderWidth: 2,                      // Stroke: 2px
  borderColor: '#FFFFFF',              // Stroke: #FFFFFF
  shadowColor: '#000000',              // Shadow color
  shadowOffset: { width: 0, height: 1 }, // X:0 Y:1
  shadowRadius: 3,                     // Blur: 3
  shadowOpacity: 0.15,                 // 15% → 0.15
  elevation: 3,                        // Android
},
```

---

## 🔢 값 변환 치트시트

### Figma → React Native 빠른 변환

| Figma 용어 | React Native 속성 | 변환 방법 |
|-----------|------------------|----------|
| W / H | `width` / `height` | 그대로 사용 |
| Corner radius | `borderRadius` | 그대로 사용 |
| Fill | `backgroundColor` | Hex 코드 사용 |
| Stroke (Inside) | `borderWidth`, `borderColor` | 두께와 색상 분리 |
| Drop shadow X/Y | `shadowOffset: { width, height }` | X→width, Y→height |
| Drop shadow Blur | `shadowRadius` | 그대로 사용 |
| Opacity (%) | `opacity` 또는 `shadowOpacity` | % ÷ 100 (예: 4% → 0.04) |
| Auto Layout Padding | `padding` 계열 | Top/Right/Bottom/Left |
| Auto Layout Gap | `gap` (RN 0.71+) | 그대로 사용 |
| Font | `fontFamily` | 'FontName-Weight' |
| Size (Font) | `fontSize` | 그대로 사용 |
| Weight | `fontFamily` 일부 | 'OpenSans-SemiBold' |

### 특별한 경우

**Figma의 Stroke 위치:**
- Inside → `borderWidth` (기본)
- Outside → React Native 미지원 (별도 wrapper 필요)
- Center → React Native 미지원

**Figma의 Blend mode:**
- Normal 외 대부분 React Native 미지원

**Figma의 Effects:**
- Drop shadow → iOS: `shadow*`, Android: `elevation`
- Inner shadow → React Native 미지원
- Layer blur → React Native 미지원 (react-native-blur 라이브러리 필요)

---

## 💡 Figma 무료 계정 활용 팁

### 1. Color Styles로 일관성 유지

```
1. 색상 선택 → Fill 패널
2. 색상 클릭 → 좌측 하단 "+" (Create style)
3. 이름 입력: "Primary/Main"
4. 저장

→ 이후 재사용 시 Style 탭에서 선택
→ 색상 변경 시 모든 곳에 일괄 적용!
```

### 2. Components로 재사용

```
1. Button 디자인 완성
2. 선택 → 우클릭 → "Create component"
3. 이름: "Button/Primary"

→ 같은 버튼 여러 개 필요 시 Component 복사
→ Main component 수정 → 모든 Instance 자동 업데이트!
```

### 3. Variants로 상태 관리

```
Button Component:
├─ Default (기본 상태)
├─ Hover (호버 상태)
├─ Active (활성 상태)
└─ Disabled (비활성 상태)

→ 하나의 Component에 여러 상태 정의
→ Property 패널에서 상태 전환 가능
```

### 4. Plugin 활용 (무료!)

**추천 플러그인:**

1. **Content Reel** - 더미 텍스트/이미지 자동 생성
2. **Stark** - 접근성 검사 (색상 대비 등)
3. **Remove BG** - 이미지 배경 제거
4. **Iconify** - 무료 아이콘 검색
5. **Chart** - 차트/그래프 생성

**설치 방법:**
1. 상단 메뉴 → Plugins → Browse plugins
2. 플러그인 검색 → Install

---

## 🎓 학습 리소스 (무료)

### 공식 문서
- **Figma Learn**: https://help.figma.com/
- **YouTube - Figma 공식**: https://www.youtube.com/c/Figma

### React Native 개발자용 튜토리얼
- **"Figma for Developers"** 검색
- **"Design to Code workflow"** 검색

### Community 파일 참고
1. Figma 홈 → Community 탭
2. 검색: "React Native", "Mobile UI Kit"
3. 무료 파일 복제 → 구조 학습

---

## 🔄 실전 워크플로우 요약

### 디자인 수정 → 코드 적용 프로세스

```
1️⃣ Figma에서 디자인 수정
   ├─ 요소 선택
   ├─ 우측 패널에서 값 변경
   │  (크기, 색상, 간격 등)
   └─ 변경사항 기록

2️⃣ 변경된 값 확인
   ├─ 우측 패널에서 숫자 복사
   ├─ Alt/Option으로 거리 측정
   └─ 색상 Hex 코드 복사

3️⃣ 코드에 적용
   ├─ src/constants/remainsCardDesign.ts 수정
   │  (또는 직접 StyleSheet 수정)
   ├─ Figma 값 → React Native 속성 변환
   └─ 저장

4️⃣ 앱에서 확인
   ├─ npx expo start
   ├─ 디자인 비교
   └─ 필요시 미세 조정

5️⃣ 반복
   └─ 만족할 때까지 1-4 반복
```

---

## 📱 실전 예시: 슬라이더 트랙 높이 변경

### Before
```
Figma: Track Height = 10px
코드: slider.track.height = 10
```

### After (12px로 변경)

**1. Figma 작업:**
```
1. Track Background 선택
2. 우측 패널 → Height: 12 입력
3. Active Track 선택
4. 우측 패널 → Height: 12 입력
```

**2. 코드 수정:**
```typescript
// src/constants/remainsCardDesign.ts

slider: {
  track: {
    height: 12,  // 10 → 12
    // ...
  },
  activeTrack: {
    height: 12,  // 10 → 12
    // ...
  },
}
```

**3. 앱 확인:**
```bash
npx expo start
```

**4. 결과:**
- 슬라이더 트랙이 10px → 12px로 두꺼워짐
- 터치 영역도 함께 증가하여 사용성 개선!

---

## ✅ 체크리스트

Figma에서 디자인 완성 후:

- [ ] 모든 크기 값 확인 (W, H)
- [ ] 색상 Hex 코드 복사
- [ ] Border radius 값 확인
- [ ] Padding/Margin 값 측정 (Alt/Option)
- [ ] 그림자 설정 확인 (X, Y, Blur, Opacity)
- [ ] 텍스트 스타일 확인 (Font, Size, Weight, Color)
- [ ] 요소 간 간격 측정
- [ ] 반응형 고려 (여러 화면 크기)
- [ ] 상태별 디자인 확인 (일반/활성/비활성 등)

---

## 🎯 다음 단계

1. **Figma 파일 생성** - `FIGMA_DESIGN_GUIDE.md` 참고
2. **디자인 수정** - 원하는 대로 값 변경
3. **값 확인** - 우측 패널에서 복사
4. **코드 적용** - `remainsCardDesign.ts` 수정
5. **테스트** - 앱에서 확인

---

## 💬 질문이 있다면?

- Figma 특정 값 확인 방법 모르겠음 → 스크린샷 공유
- 코드 변환 방법 모르겠음 → Figma 값 공유
- 디자인 구현 안 됨 → 앱 스크린샷과 Figma 비교

Happy Designing! 🎨
