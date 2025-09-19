// colors.js - JavaScript 색상 정의
export const colors = {
  // Primary Colors (3개)
  primary: '#26A69A',      // 메인 민트 - 버튼, CTA, 주요 액션
  primaryDark: '#00897B',  // 다크 민트 - 눌린 상태, 헤더
  primaryLight: '#E8F5F2', // 라이트 민트 - 선택/호버 배경, 연한 테두리
  
  // Text Colors (3개)
  textPrimary: '#1a1a1a',   // 제목, 본문
  textSecondary: '#5f6368', // 보조 설명, 라벨
  textDisabled: '#9AA0A6',  // 비활성, 플레이스홀더
  
  // Background & Surface (3개)
  surface: '#FFFFFF',      // 카드, 모달, Primary 위 텍스트
  background: '#F8FDFC',   // 앱 전체 배경
  border: '#D0E8E6',       // 테두리, 구분선
  
  // Status Colors (4개)
  success: '#4CAF50',  // 성공
  warning: '#FFA726',  // 경고
  error: '#EF5350',    // 오류
  info: '#26A69A',     // 정보 (Primary와 동일)
};

// colors.ts - TypeScript 색상 정의
export const colors = {
  // Primary Colors
  primary: '#26A69A',
  primaryDark: '#00897B',
  primaryLight: '#E8F5F2',
  
  // Text Colors
  textPrimary: '#1a1a1a',
  textSecondary: '#5f6368',
  textDisabled: '#9AA0A6',
  
  // Background & Surface
  surface: '#FFFFFF',
  background: '#F8FDFC',
  border: '#D0E8E6',
  
  // Status Colors
  success: '#4CAF50',
  warning: '#FFA726',
  error: '#EF5350',
  info: '#26A69A',
} as const;

// TypeScript 타입 정의
export type ColorKey = keyof typeof colors;
export type ColorValue = typeof colors[ColorKey];

// Tailwind CSS config 예시
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#26A69A',
          dark: '#00897B',
          light: '#E8F5F2',
        },
        text: {
          primary: '#1a1a1a',
          secondary: '#5f6368',
          disabled: '#9AA0A6',
        },
        surface: '#FFFFFF',
        background: '#F8FDFC',
        border: '#D0E8E6',
        success: '#4CAF50',
        warning: '#FFA726',
        error: '#EF5350',
        info: '#26A69A',
      }
    }
  }
}

// React Native 스타일
export const colorTheme = {
  colors: {
    primary: '#26A69A',
    primaryDark: '#00897B',
    primaryLight: '#E8F5F2',
    textPrimary: '#1a1a1a',
    textSecondary: '#5f6368',
    textDisabled: '#9AA0A6',
    surface: '#FFFFFF',
    background: '#F8FDFC',
    border: '#D0E8E6',
    success: '#4CAF50',
    warning: '#FFA726',
    error: '#EF5350',
    info: '#26A69A',
  }
};

// SCSS/SASS 변수
$color-primary: #26A69A;
$color-primary-dark: #00897B;
$color-primary-light: #E8F5F2;

$color-text-primary: #1a1a1a;
$color-text-secondary: #5f6368;
$color-text-disabled: #9AA0A6;

$color-surface: #FFFFFF;
$color-background: #F8FDFC;
$color-border: #D0E8E6;

$color-success: #4CAF50;
$color-warning: #FFA726;
$color-error: #EF5350;
$color-info: #26A69A;

// Material-UI Theme 예시
const muiTheme = createTheme({
  palette: {
    primary: {
      main: '#26A69A',
      dark: '#00897B',
      light: '#E8F5F2',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#5f6368',
      disabled: '#9AA0A6',
    },
    background: {
      default: '#F8FDFC',
      paper: '#FFFFFF',
    },
    success: { main: '#4CAF50' },
    warning: { main: '#FFA726' },
    error: { main: '#EF5350' },
    info: { main: '#26A69A' },
  },
});

// Flutter/Dart 색상 정의
class AppColors {
  static const Color primary = Color(0xFF26A69A);
  static const Color primaryDark = Color(0xFF00897B);
  static const Color primaryLight = Color(0xFFE8F5F2);
  
  static const Color textPrimary = Color(0xFF1A1A1A);
  static const Color textSecondary = Color(0xFF5F6368);
  static const Color textDisabled = Color(0xFF9AA0A6);
  
  static const Color surface = Color(0xFFFFFFFF);
  static const Color background = Color(0xFFF8FDFC);
  static const Color border = Color(0xFFD0E8E6);
  
  static const Color success = Color(0xFF4CAF50);
  static const Color warning = Color(0xFFFFA726);
  static const Color error = Color(0xFFEF5350);
  static const Color info = Color(0xFF26A69A);
}
