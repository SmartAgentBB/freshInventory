#!/usr/bin/env node

/**
 * 환경 변수 검증 스크립트
 * 프로덕션 빌드 전 필수 환경 변수가 설정되어 있는지 확인
 */

// .env 파일 로드 (로컬 개발 환경)
require('dotenv').config();

const requiredEnvVars = [
  'EXPO_PUBLIC_SUPABASE_URL',
  'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  'EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY'
];

const optionalEnvVars = [
  'EXPO_PUBLIC_GEMINI_API_KEY',
  'GOOGLE_GENERATIVE_AI_KEY'
];

console.log('\n🔍 환경 변수 검증 시작...\n');

let hasErrors = false;
const missingVars = [];
const presentVars = [];

// 필수 환경 변수 검증
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];

  if (!value) {
    console.error(`❌ [필수] ${varName}: 설정되지 않음`);
    missingVars.push(varName);
    hasErrors = true;
  } else if (value.includes('YourDemoKeyForTesting') || value.includes('your-') || value.length < 10) {
    console.error(`❌ [필수] ${varName}: 유효하지 않은 값 (데모 키 또는 플레이스홀더)`);
    missingVars.push(varName);
    hasErrors = true;
  } else {
    console.log(`✅ [필수] ${varName}: 설정됨 (${value.substring(0, 20)}...)`);
    presentVars.push(varName);
  }
});

// 선택적 환경 변수 확인
console.log('\n📋 선택적 환경 변수:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && !value.includes('your-')) {
    console.log(`✅ [선택] ${varName}: 설정됨`);
  } else {
    console.log(`⚠️  [선택] ${varName}: 설정되지 않음 (선택 사항)`);
  }
});

// 결과 요약
console.log('\n' + '='.repeat(60));
console.log('📊 검증 결과:');
console.log('='.repeat(60));
console.log(`✅ 설정된 필수 변수: ${presentVars.length}/${requiredEnvVars.length}`);

if (hasErrors) {
  console.log(`❌ 누락된 필수 변수: ${missingVars.length}`);
  console.log('\n누락된 변수:');
  missingVars.forEach(varName => {
    console.log(`  - ${varName}`);
  });

  console.log('\n🔧 해결 방법:');
  console.log('1. .env 파일에 환경 변수 추가');
  console.log('2. EAS Secret으로 등록:');
  console.log('   eas secret:create --scope project --name EXPO_PUBLIC_GOOGLE_GENERATIVE_AI_KEY --value YOUR_API_KEY --type string');
  console.log('3. eas.json에 환경 변수 매핑 추가\n');

  process.exit(1);
}

console.log('✅ 모든 필수 환경 변수가 올바르게 설정되었습니다!\n');
process.exit(0);
