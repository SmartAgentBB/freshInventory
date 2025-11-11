// 크래시 시뮬레이션 테스트 파일
// iOS 26.0에서 발생한 크래시를 로컬에서 재현하기 위한 테스트

console.log('=== 크래시 시뮬레이션 시작 ===\n');

// 테스트 1: null 객체 속성 접근 (크래시 원인 1)
console.log('테스트 1: null 객체 속성 접근');
try {
  const obj = null;
  console.log('Accessing:', obj.property);
  console.log('❌ 크래시가 발생해야 하는데 발생하지 않음');
} catch (error) {
  console.log('✅ 에러 포착됨:', error.message);
}

// 테스트 2: undefined 배열 매핑 (크래시 원인 2)
console.log('\n테스트 2: undefined 배열 매핑');
try {
  const items = undefined;
  const result = items.map(item => item.name);
  console.log('❌ 크래시가 발생해야 하는데 발생하지 않음');
} catch (error) {
  console.log('✅ 에러 포착됨:', error.message);
}

// 테스트 3: 중첩된 undefined 접근 (크래시 원인 3)
console.log('\n테스트 3: 중첩된 undefined 접근');
try {
  const recipe = {};
  console.log('Accessing:', recipe.ingredients[0].name);
  console.log('❌ 크래시가 발생해야 하는데 발생하지 않음');
} catch (error) {
  console.log('✅ 에러 포착됨:', error.message);
}

// 테스트 4: 잘못된 타입의 메서드 호출
console.log('\n테스트 4: 잘못된 타입의 메서드 호출');
try {
  const notAFunction = "string";
  notAFunction();
  console.log('❌ 크래시가 발생해야 하는데 발생하지 않음');
} catch (error) {
  console.log('✅ 에러 포착됨:', error.message);
}

// 테스트 5: 수정된 안전한 코드 (크래시 방지)
console.log('\n테스트 5: 안전한 코드 패턴');
try {
  // Optional chaining 사용
  const obj = null;
  console.log('Safe access:', obj?.property || 'default value');

  // 배열 검증
  const items = undefined;
  const safeResult = (items || []).map(item => item?.name || '');
  console.log('Safe mapping:', safeResult);

  // 중첩된 안전 접근
  const recipe = {};
  const ingredientName = recipe?.ingredients?.[0]?.name || 'N/A';
  console.log('Safe nested access:', ingredientName);

  console.log('✅ 모든 안전한 패턴이 정상 작동');
} catch (error) {
  console.log('❌ 안전한 코드에서 에러 발생:', error.message);
}

console.log('\n=== 시뮬레이션 완료 ===');