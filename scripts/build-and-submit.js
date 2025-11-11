#!/usr/bin/env node

/**
 * 빌드 및 제출 자동화 스크립트
 * Usage:
 *   node scripts/build-and-submit.js ios       # iOS 빌드 및 제출
 *   node scripts/build-and-submit.js android   # Android 빌드 및 제출
 *   node scripts/build-and-submit.js check     # 현재 상태 확인
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, '..', 'version.json');
const APP_JSON_FILE = path.join(__dirname, '..', 'app.json');

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

// 커맨드 실행
function runCommand(command, silent = false) {
  try {
    if (!silent) {
      console.log(`${colors.blue}▶ Running:${colors.reset} ${command}`);
    }
    const result = execSync(command, { encoding: 'utf8', stdio: silent ? 'pipe' : 'inherit' });
    return result;
  } catch (error) {
    console.error(`${colors.red}✗ Command failed:${colors.reset} ${command}`);
    throw error;
  }
}

// 버전 정보 읽기
function readVersionInfo() {
  return JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
}

// 버전 정보 업데이트
function updateVersionInfo(platform, status) {
  const versionData = readVersionInfo();
  const history = platform === 'ios' ? versionData.ios.history : versionData.android.history;
  if (history.length > 0) {
    history[history.length - 1].status = status;
  }
  fs.writeFileSync(VERSION_FILE, JSON.stringify(versionData, null, 2) + '\n');
}

// 버전 동기화 검증 (2025-11-11 추가)
function verifyVersionSync(platform) {
  console.log(`${colors.yellow}🔍 Verifying version synchronization...${colors.reset}`);

  const versionData = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
  const appJson = JSON.parse(fs.readFileSync(APP_JSON_FILE, 'utf8'));

  if (platform === 'ios') {
    const versionJsonBuild = versionData.ios.buildNumber;
    const appJsonBuild = parseInt(appJson.expo.ios.buildNumber);

    if (versionJsonBuild !== appJsonBuild) {
      console.error(`${colors.red}❌ Version mismatch detected!${colors.reset}`);
      console.error(`   version.json buildNumber: ${colors.bright}${versionJsonBuild}${colors.reset}`);
      console.error(`   app.json buildNumber: ${colors.bright}${appJsonBuild}${colors.reset}`);
      throw new Error('iOS buildNumber mismatch between version.json and app.json!');
    }
    console.log(`${colors.green}✓ iOS buildNumber verified: ${versionJsonBuild}${colors.reset}`);
  } else if (platform === 'android') {
    const versionJsonCode = versionData.android.versionCode;
    const appJsonCode = appJson.expo.android.versionCode;

    if (versionJsonCode !== appJsonCode) {
      console.error(`${colors.red}❌ Version mismatch detected!${colors.reset}`);
      console.error(`   version.json versionCode: ${colors.bright}${versionJsonCode}${colors.reset}`);
      console.error(`   app.json versionCode: ${colors.bright}${appJsonCode}${colors.reset}`);
      throw new Error('Android versionCode mismatch between version.json and app.json!');
    }
    console.log(`${colors.green}✓ Android versionCode verified: ${versionJsonCode}${colors.reset}`);
  }

  // 앱 버전도 검증
  const versionJsonVersion = versionData.version;
  const appJsonVersion = appJson.expo.version;
  if (versionJsonVersion !== appJsonVersion) {
    console.error(`${colors.red}❌ App version mismatch detected!${colors.reset}`);
    console.error(`   version.json version: ${colors.bright}${versionJsonVersion}${colors.reset}`);
    console.error(`   app.json version: ${colors.bright}${appJsonVersion}${colors.reset}`);
    throw new Error('App version mismatch between version.json and app.json!');
  }
  console.log(`${colors.green}✓ App version verified: ${versionJsonVersion}${colors.reset}`);
}

// 현재 상태 확인
function checkStatus() {
  const versionData = readVersionInfo();

  console.log(`\n${colors.bright}📱 Ez2Cook Build Status${colors.reset}`);
  console.log('═'.repeat(50));

  console.log(`\n${colors.green}📦 Current Versions:${colors.reset}`);
  console.log(`  App Version: ${colors.bright}${versionData.version}${colors.reset}`);
  console.log(`  iOS Build Number: ${colors.bright}${versionData.ios.buildNumber}${colors.reset}`);
  console.log(`  Android Version Code: ${colors.bright}${versionData.android.versionCode}${colors.reset}`);

  console.log(`\n${colors.blue}📅 Last Builds:${colors.reset}`);
  if (versionData.ios.lastBuildDate) {
    console.log(`  iOS: ${versionData.ios.lastBuildDate} (Build ${versionData.ios.buildNumber})`);
  }
  if (versionData.android.lastBuildDate) {
    console.log(`  Android: ${versionData.android.lastBuildDate} (Code ${versionData.android.versionCode})`);
  }

  console.log(`\n${colors.yellow}📜 Recent History:${colors.reset}`);
  const recentIOS = versionData.ios.history.slice(-3);
  recentIOS.forEach(item => {
    const statusEmoji = item.status === 'submitted' ? '✅' : item.status === 'failed' ? '❌' : '🔄';
    console.log(`  ${statusEmoji} iOS #${item.buildNumber} - ${item.date} - ${item.status}`);
    if (item.notes) console.log(`     ${colors.bright}"${item.notes}"${colors.reset}`);
  });

  console.log('\n' + '═'.repeat(50));
}

// iOS 빌드 및 제출
async function buildAndSubmitIOS() {
  console.log(`\n${colors.bright}🍎 Starting iOS Build & Submit Process${colors.reset}\n`);

  try {
    // 0. 환경 변수 검증
    console.log(`${colors.yellow}🔐 Step 0: Validating environment variables...${colors.reset}`);
    try {
      runCommand('node scripts/validate-env.js');
    } catch (error) {
      console.error(`\n${colors.red}❌ Environment validation failed!${colors.reset}`);
      console.error(`${colors.yellow}Please set required environment variables before building.${colors.reset}`);
      throw error;
    }

    // 1. 빌드 번호 증가
    console.log(`\n${colors.yellow}📝 Step 1: Incrementing build number...${colors.reset}`);
    runCommand('node scripts/bump-version.js ios "Automated build"');

    // 1.5. 버전 동기화 검증
    console.log(`\n${colors.yellow}🔍 Step 1.5: Verifying version synchronization...${colors.reset}`);
    verifyVersionSync('ios');

    // 2. Git 커밋
    console.log(`\n${colors.yellow}📝 Step 2: Committing version changes...${colors.reset}`);
    runCommand('git add app.json version.json');
    runCommand('git commit -m "chore: bump iOS build number"');

    // 3. 빌드 실행
    console.log(`\n${colors.yellow}🔨 Step 3: Building for iOS...${colors.reset}`);
    runCommand('eas build --platform ios --profile production --non-interactive');

    // 4. 제출
    console.log(`\n${colors.yellow}🚀 Step 4: Submitting to App Store...${colors.reset}`);
    runCommand('eas submit --platform ios --latest --non-interactive');

    // 5. 상태 업데이트
    updateVersionInfo('ios', 'submitted');

    console.log(`\n${colors.green}✅ iOS build and submission completed successfully!${colors.reset}`);
    console.log(`${colors.yellow}⚠️  IMPORTANT: Test AI features in TestFlight before releasing!${colors.reset}`);

  } catch (error) {
    updateVersionInfo('ios', 'failed');
    console.error(`\n${colors.red}❌ iOS build/submit failed!${colors.reset}`);
    throw error;
  }
}

// Android 빌드 및 제출
async function buildAndSubmitAndroid() {
  console.log(`\n${colors.bright}🤖 Starting Android Build & Submit Process${colors.reset}\n`);

  try {
    // 0. 환경 변수 검증
    console.log(`${colors.yellow}🔐 Step 0: Validating environment variables...${colors.reset}`);
    try {
      runCommand('node scripts/validate-env.js');
    } catch (error) {
      console.error(`\n${colors.red}❌ Environment validation failed!${colors.reset}`);
      console.error(`${colors.yellow}Please set required environment variables before building.${colors.reset}`);
      throw error;
    }

    // 1. 버전 코드 증가
    console.log(`\n${colors.yellow}📝 Step 1: Incrementing version code...${colors.reset}`);
    runCommand('node scripts/bump-version.js android "Automated build"');

    // 1.5. 버전 동기화 검증 (2025-11-11 추가)
    console.log(`\n${colors.yellow}🔍 Step 1.5: Verifying version synchronization...${colors.reset}`);
    verifyVersionSync('android');

    // 2. Git 커밋
    console.log(`\n${colors.yellow}📝 Step 2: Committing version changes...${colors.reset}`);
    runCommand('git add app.json version.json');
    runCommand('git commit -m "chore: bump Android version code"');

    // 3. 빌드 실행
    console.log(`\n${colors.yellow}🔨 Step 3: Building for Android...${colors.reset}`);
    runCommand('eas build --platform android --profile production --non-interactive');

    // 4. 제출 (Play Store)
    console.log(`\n${colors.yellow}🚀 Step 4: Submitting to Play Store...${colors.reset}`);
    runCommand('eas submit --platform android --latest --non-interactive');

    // 5. 상태 업데이트
    updateVersionInfo('android', 'submitted');

    console.log(`\n${colors.green}✅ Android build and submission completed successfully!${colors.reset}`);
    console.log(`${colors.yellow}⚠️  IMPORTANT: Test AI features in Internal Testing before releasing!${colors.reset}`);

  } catch (error) {
    updateVersionInfo('android', 'failed');
    console.error(`\n${colors.red}❌ Android build/submit failed!${colors.reset}`);
    throw error;
  }
}

// 메인 실행
async function main() {
  const action = process.argv[2] || 'check';

  switch (action) {
    case 'ios':
      await buildAndSubmitIOS();
      break;
    case 'android':
      await buildAndSubmitAndroid();
      break;
    case 'check':
      checkStatus();
      break;
    default:
      console.error(`${colors.red}Invalid action. Use: ios, android, or check${colors.reset}`);
      process.exit(1);
  }
}

// 실행
main().catch(error => {
  console.error(`${colors.red}Build process failed:${colors.reset}`, error.message);
  process.exit(1);
});