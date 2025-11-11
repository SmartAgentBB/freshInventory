#!/usr/bin/env node

/**
 * 빌드 번호 자동 증가 스크립트
 * Usage:
 *   node scripts/bump-version.js ios       # iOS 빌드 번호 증가
 *   node scripts/bump-version.js android   # Android 버전 코드 증가
 *   node scripts/bump-version.js both      # 둘 다 증가
 *   node scripts/bump-version.js version   # 앱 버전 증가 (1.0.0 -> 1.0.1)
 */

const fs = require('fs');
const path = require('path');

// 파일 경로
const VERSION_FILE = path.join(__dirname, '..', 'version.json');
const APP_JSON_FILE = path.join(__dirname, '..', 'app.json');

// 명령줄 인자 파싱
const action = process.argv[2] || 'ios';
const notes = process.argv[3] || '';

// 파일 읽기
function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// 파일 쓰기
function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

// 버전 증가 함수
function incrementVersion(version) {
  const parts = version.split('.');
  parts[2] = String(parseInt(parts[2]) + 1);
  return parts.join('.');
}

// 메인 실행
function main() {
  const versionData = readJSON(VERSION_FILE);
  const appJson = readJSON(APP_JSON_FILE);

  const today = new Date().toISOString().split('T')[0];
  let changes = [];

  switch (action) {
    case 'ios':
      // iOS 빌드 번호 증가
      versionData.ios.buildNumber++;
      versionData.ios.lastBuildDate = today;
      versionData.ios.lastBuildType = 'production';

      // 히스토리 추가
      versionData.ios.history.push({
        buildNumber: versionData.ios.buildNumber,
        date: today,
        type: 'production',
        status: 'building',
        notes: notes || 'Build number incremented'
      });

      // app.json 업데이트
      appJson.expo.ios.buildNumber = String(versionData.ios.buildNumber);
      changes.push(`iOS build number: ${versionData.ios.buildNumber - 1} → ${versionData.ios.buildNumber}`);
      break;

    case 'android':
      // Android 버전 코드 증가
      versionData.android.versionCode++;
      versionData.android.lastBuildDate = today;
      versionData.android.lastBuildType = 'production';

      // 히스토리 추가
      versionData.android.history.push({
        versionCode: versionData.android.versionCode,
        date: today,
        type: 'production',
        status: 'building',
        notes: notes || 'Version code incremented'
      });

      // app.json 업데이트 (항상 동기화)
      appJson.expo.android.versionCode = versionData.android.versionCode;
      changes.push(`Android version code: ${versionData.android.versionCode - 1} → ${versionData.android.versionCode}`);
      break;

    case 'both':
      // iOS와 Android 둘 다 증가
      versionData.ios.buildNumber++;
      versionData.android.versionCode++;

      appJson.expo.ios.buildNumber = String(versionData.ios.buildNumber);
      if (!appJson.expo.android.versionCode) {
        appJson.expo.android.versionCode = versionData.android.versionCode;
      }

      changes.push(`iOS build number: ${versionData.ios.buildNumber - 1} → ${versionData.ios.buildNumber}`);
      changes.push(`Android version code: ${versionData.android.versionCode - 1} → ${versionData.android.versionCode}`);
      break;

    case 'version':
      // 앱 버전 증가 (patch version)
      const oldVersion = versionData.version;
      versionData.version = incrementVersion(oldVersion);
      appJson.expo.version = versionData.version;
      changes.push(`App version: ${oldVersion} → ${versionData.version}`);
      break;

    default:
      console.error('Invalid action. Use: ios, android, both, or version');
      process.exit(1);
  }

  // 파일 저장
  writeJSON(VERSION_FILE, versionData);
  writeJSON(APP_JSON_FILE, appJson);

  // 결과 출력
  console.log('✅ Version bumped successfully!');
  changes.forEach(change => console.log(`   ${change}`));
  console.log('\n📋 Current versions:');
  console.log(`   App Version: ${versionData.version}`);
  console.log(`   iOS Build Number: ${versionData.ios.buildNumber}`);
  console.log(`   Android Version Code: ${versionData.android.versionCode}`);
  console.log('\n💡 Don\'t forget to commit these changes!');
}

// 실행
try {
  main();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}