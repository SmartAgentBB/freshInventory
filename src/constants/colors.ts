// Simplified Color Palette - 13 colors total
export const Colors = {
  // Primary Colors (3)
  primary: {
    main: '#26A69A',        // Main mint - buttons, CTA, key actions
    dark: '#00897B',        // Dark mint - pressed states, headers
    light: '#E8F5F2',       // Light mint - selected/hover backgrounds, light borders
    container: '#E8F5F2',   // Same as light for simplicity
    onContainer: '#1a1a1a', // Text on primary container
  },

  // Text Colors (3)
  text: {
    primary: '#1a1a1a',     // Main text - titles, body
    secondary: '#5f6368',   // Secondary text - descriptions, labels
    disabled: '#9AA0A6',    // Disabled text - inactive, placeholders
    hint: '#9AA0A6',        // Same as disabled for simplicity
    onPrimary: '#FFFFFF',   // White text on primary color
    onSecondary: '#1a1a1a', // Same as primary for simplicity
  },

  // Background & Surface (3)
  background: {
    default: '#F8FDFC',     // App background
    paper: '#FFFFFF',       // Cards, modals, surfaces
    surface: '#FFFFFF',     // Same as paper for simplicity
    container: '#F8FDFC',   // Same as default for simplicity
    level1: '#FFFFFF',      // Same as paper
    level2: '#F8FDFC',      // Same as default
    level3: '#F8FDFC',      // Same as default
  },

  // Border (1)
  border: {
    light: '#E8F5F2',       // Same as primary.light
    medium: '#D0E8E6',      // Main border color
    dark: '#D0E8E6',        // Same as medium for simplicity
    outline: '#D0E8E6',     // Same as medium
    outlineVariant: '#E8F5F2', // Same as light
  },

  // Divider - using border color
  divider: '#D0E8E6',       // Border/divider lines

  // Status Colors (4)
  status: {
    success: '#4CAF50',     // Success green
    warning: '#FFA726',     // Warning orange
    error: '#EF5350',       // Error red
    info: '#26A69A',        // Info - same as primary
  },

  // Simplified elevation using existing colors
  elevation: {
    level0: 'transparent',
    level1: '#FFFFFF',      // Surface color
    level2: '#F8FDFC',      // Background color
    level3: '#F8FDFC',      // Background color
    level4: '#E8F5F2',      // Primary light
    level5: '#E8F5F2',      // Primary light
  },

  // Legacy mappings for compatibility (will be removed later)
  secondary: {
    main: '#5f6368',        // Maps to text.secondary
    light: '#9AA0A6',       // Maps to text.disabled
    dark: '#1a1a1a',        // Maps to text.primary
    container: '#F8FDFC',   // Maps to background.default
    onContainer: '#1a1a1a', // Maps to text.primary
  },

  tertiary: {
    main: '#26A69A',        // Maps to primary.main
    light: '#E8F5F2',       // Maps to primary.light
    dark: '#00897B',        // Maps to primary.dark
    container: '#F8FDFC',   // Maps to background.default
    onContainer: '#1a1a1a', // Maps to text.primary
  },
} as const;