# 프로토타입 기반 UI 구현 가이드

## 개요
Flask 프로토타입(freshInventory/)의 UI/UX를 React Native로 충실히 재현하기 위한 가이드입니다.

## 핵심 UI 원칙

### 1. AI 분석 결과 화면
프로토타입의 가장 중요한 특징은 **즉시 편집 가능한 인라인 UI**입니다:

#### ✅ 올바른 구현 (프로토타입 방식)
```jsx
// 감지된 재료 목록 - 인라인 편집
<View style={styles.itemContainer}>
  {/* 썸네일 - 48x48 크기 */}
  <Image source={{uri: item.thumbnail}} style={styles.thumbnail} />
  
  {/* 이름 - 바로 편집 가능한 TextInput */}
  <TextInput 
    value={item.name}
    onChangeText={(text) => updateItem(index, 'name', text)}
    style={styles.nameInput}
  />
  
  {/* 수량 조절 - 버튼 방식 */}
  <IconButton icon="minus" onPress={() => changeQuantity(index, -1)} />
  <Text>{item.quantity}</Text>
  <IconButton icon="plus" onPress={() => changeQuantity(index, 1)} />
  
  {/* 삭제 버튼 */}
  <IconButton icon="close" onPress={() => removeItem(index)} />
</View>
```

#### ❌ 피해야 할 구현
- 편집 버튼을 눌러야 편집 모드로 전환
- 수량을 텍스트 입력으로 변경
- 썸네일 없이 아이콘만 표시
- 별도의 저장 버튼 필요

### 2. 레이아웃 구조

#### 네비게이션 위치
- **프로토타입**: 상단 고정 네비게이션
- **React Native**: 하단 탭 네비게이션 (모바일 UX 고려)
- 이것이 유일하게 허용되는 변경사항

#### 화면 구성
```
프로토타입 → React Native 매핑
/         → InventoryScreen (탭: 재고목록, 냉동보관, 지난기록)
/cooking  → CookingScreen (탭: 요리추천, 북마크)
/shopping → ShoppingScreen (탭: 장보기, 완료한쇼핑)
```

### 3. 상세 구현 체크리스트

#### AI 분석 화면
- [x] 이미지 업로드 섹션
- [x] AI 분석 중 로딩 표시
- [x] 감지된 재료별 **썸네일 표시** (boundingBox 활용)
- [x] **인라인 이름 편집** (별도 편집 모드 없음)
- [x] **수량 +/- 버튼** (1씩 증감)
- [x] 항목별 삭제 버튼
- [x] 일괄 저장 버튼

#### 재고 목록 화면
- [ ] 정렬 버튼 (최신순/오래된순/임박순)
- [ ] 검색 기능
- [ ] 아이템 카드 레이아웃
- [ ] 남은 양 슬라이더
- [ ] 플로팅 액션 버튼 (+ 버튼)

#### 상세 모달
- [ ] 아이템 정보 표시
- [ ] 남은 양 조절 슬라이더
- [ ] 사용 이력 테이블
- [ ] 보관 정보 표시
- [ ] 소비/냉동/폐기 버튼

### 4. 스타일 가이드

#### 색상 (프로토타입 기준)
- Primary: #0891b2 (cyan-600)
- Secondary: #6b7280 (gray-600)
- Background: #f9fafb (gray-50)
- Surface: #ffffff
- Border: #e5e7eb (gray-200)

#### 간격 및 크기
- 카드 border-radius: 12px (rounded-xl)
- 버튼 border-radius: 8px (rounded-lg)
- 썸네일 크기: 48x48px
- 아이콘 버튼: 32x32px
- 간격: 8px 단위 사용

### 5. 상호작용 패턴

#### 즉시 반응 원칙
- 모든 변경사항은 **즉시 UI에 반영**
- 별도의 저장/확인 단계 최소화
- 인라인 편집으로 클릭 수 감소

#### 터치 최적화
- 터치 영역 최소 44x44px
- 스와이프 제스처 고려
- 롱 프레스로 추가 옵션 제공

### 6. 구현 우선순위

1. **최우선**: AI 분석 결과의 인라인 편집 UI
2. **높음**: 재고 목록의 시각적 표현
3. **중간**: 상세 모달 및 슬라이더
4. **낮음**: 애니메이션 및 전환 효과

## 검증 방법

구현 후 다음 사항을 확인:
1. 프로토타입 스크린샷과 비교
2. 인라인 편집이 원활한지 확인
3. 썸네일이 올바르게 표시되는지 확인
4. +/- 버튼으로 수량 조절이 직관적인지 확인
5. 전체적인 사용 흐름이 프로토타입과 일치하는지 확인

## 참고 파일
- 프로토타입 HTML: `freshInventory/templates/*.html`
- 프로토타입 JS: `freshInventory/static/js/app.js`
- 프로토타입 CSS: Tailwind 클래스 참고
- 구현 파일: `src/components/AddItemWithImage.tsx`