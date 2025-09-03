// Mint Theme Color Palette for React Native Paper
export const Colors = {
  // Primary Mint Colors
  primary: {
    main: '#26A69A',        // Main mint green
    light: '#4DB6AC',       // Light mint
    dark: '#00695C',        // Dark mint
    container: '#B2DFDB',   // Primary container
    onContainer: '#004D40', // Text on primary container
  },
  secondary: {
    main: '#4DB6AC',        // Secondary mint
    light: '#80CBC4',       // Light secondary
    dark: '#00695C',        // Dark secondary  
    container: '#E0F2F1',   // Secondary container
    onContainer: '#00695C', // Text on secondary container
  },
  tertiary: {
    main: '#00695C',        // Tertiary dark mint
    light: '#26A69A',       // Light tertiary
    dark: '#004D40',        // Dark tertiary
    container: '#B2DFDB',   // Tertiary container
    onContainer: '#004D40', // Text on tertiary container
  },
  status: {
    success: '#4CAF50',     // Success green (mint compatible)
    warning: '#FF9800',     // Warning orange
    error: '#FF5252',       // Error red
    info: '#26A69A',        // Info using primary mint
  },
  text: {
    primary: '#004D40',     // Primary text (dark mint)
    secondary: '#00695C',   // Secondary text (medium mint)
    disabled: '#80CBC4',    // Disabled text (light mint)
    hint: '#B2DFDB',        // Hint text (very light mint)
    onPrimary: '#FFFFFF',   // Text on primary surfaces
    onSecondary: '#FFFFFF', // Text on secondary surfaces
  },
  background: {
    default: '#E0F2F1',     // Default background (very light mint)
    paper: '#FFFFFF',       // Paper/card background
    surface: '#FFFBFE',     // Surface background
    level1: '#F1F8F6',      // Elevated surface level 1
    level2: '#E8F5F0',      // Elevated surface level 2
    level3: '#E0F2F1',      // Elevated surface level 3
  },
  border: {
    light: '#B2DFDB',       // Light border (mint tint)
    medium: '#80CBC4',      // Medium border
    dark: '#4DB6AC',        // Dark border
    outline: '#4DB6AC',     // Outline color
    outlineVariant: '#B2DFDB', // Outline variant
  },
  // Material Design 3 elevation colors
  elevation: {
    level0: 'transparent',
    level1: '#F1F8F6',
    level2: '#E8F5F0', 
    level3: '#E0F2F1',
    level4: '#D4EDDA',
    level5: '#C8E6C9',
  },
} as const;