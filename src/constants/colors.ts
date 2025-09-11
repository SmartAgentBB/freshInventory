// White Base with Soft Mint Accent Theme
export const Colors = {
  // Primary Mint Colors
  primary: {
    main: '#26A69A',        // Main mint green - buttons, key actions
    light: '#4DB6AC',       // Light mint - hover states
    dark: '#00897B',        // Dark mint - pressed states
    container: '#E8F5F2',   // Light mint for selected/active items
    onContainer: '#1a1a1a', // Text on primary container
  },
  
  // Secondary colors (subtle mint tints)
  secondary: {
    main: '#5f6368',        // Secondary gray
    light: '#9AA0A6',       // Light gray
    dark: '#3C4043',        // Dark gray
    container: '#F0F9F8',   // Very light mint container
    onContainer: '#1a1a1a', // Text on secondary container
  },
  
  // Tertiary colors (accent)
  tertiary: {
    main: '#26A69A',        // Mint accent
    light: '#E0F2F1',       // Light mint accent
    dark: '#00897B',        // Dark mint
    container: '#F8FDFC',   // Almost white with mint hint
    onContainer: '#1a1a1a', // Text on tertiary container
  },
  
  // Status colors (semantic)
  status: {
    success: '#4CAF50',     // Green for success
    warning: '#FFA726',     // Orange for warning
    error: '#EF5350',       // Red for error
    info: '#26A69A',        // Mint for info
  },
  
  // Text hierarchy (black base)
  text: {
    primary: '#1a1a1a',     // Almost black - main text
    secondary: '#5f6368',   // Medium gray - secondary text
    disabled: '#9AA0A6',    // Light gray - disabled text
    hint: '#9AA0A6',        // Hint text
    onPrimary: '#FFFFFF',   // White text on primary color
    onSecondary: '#1a1a1a', // Dark text on light backgrounds
  },
  
  // Background colors (white with mint tints)
  background: {
    default: '#F8FDFC',     // Almost white with subtle mint hint
    paper: '#FFFFFF',       // Pure white for cards
    surface: '#F8FDFC',     // Soft mint-tinted surface
    container: '#F0F9F8',   // Light mint for containers
    level1: '#FFFFFF',      // Pure white
    level2: '#F8FDFC',      // Subtle mint tint
    level3: '#F0F9F8',      // Light mint
  },
  
  // Border and divider colors (mint tinted)
  border: {
    light: '#E0F2F1',       // Light mint border
    medium: '#E8F5F2',      // Very light mint border
    dark: '#D0E8E6',        // Slightly darker mint border
    outline: '#E0F2F1',     // Mint outline color
    outlineVariant: '#F0F9F8', // Lighter mint outline
  },
  
  // Simplified divider color
  divider: '#E0F2F1',       // Subtle mint divider line
  
  // Material elevation colors with mint tint
  elevation: {
    level0: 'transparent',
    level1: '#FFFFFF',      // Pure white
    level2: '#F8FDFC',      // Hint of mint
    level3: '#F0F9F8',      // Light mint
    level4: '#E8F5F2',      // Soft mint
    level5: '#E0F2F1',      // Mint tint
  },
} as const;