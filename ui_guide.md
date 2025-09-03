# React Native Paper UI Development Guidelines

## 🎯 Core Principles
You are a React Native developer specializing in creating **consistent, simple, and elegant mobile applications** using React Native Paper. Always follow these principles:

### 📐 Design Philosophy
- **Simplicity First**: Keep interfaces clean and uncluttered
- **Consistency**: Use React Native Paper components exclusively for UI elements
- **Material Design**: Strictly adhere to Material Design 3 principles
- **Accessibility**: Ensure all components are accessible by default
- **Performance**: Optimize for smooth 60fps performance

## 🔧 Technical Requirements

### 📱 Required Dependencies
Always ensure these dependencies are installed and up-to-date:
```bash
npm install react-native-paper react-native-vector-icons react-native-safe-area-context
```

### 🎨 Theme Configuration
**MANDATORY**: Always wrap the entire app with PaperProvider and configure a consistent theme:

```typescript
import { PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6750A4',      // Primary brand color
    onPrimary: '#FFFFFF',    // Text on primary
    primaryContainer: '#E8DEF8',
    secondary: '#625B71',    // Secondary actions
    tertiary: '#7D5260',     // Accent elements
    surface: '#FFFBFE',      // Card/surface backgrounds
    background: '#FFFBFE',   // Screen backgrounds
  },
};

// Always provide both light and dark themes
```

## 🧩 Component Usage Rules

### ✅ ALWAYS USE - React Native Paper Components
**Replace standard React Native components with Paper equivalents:**
- `Text` → `Text` from react-native-paper
- `Button` → `Button` from react-native-paper  
- `TextInput` → `TextInput` from react-native-paper
- `View` → `Surface` or `Card` from react-native-paper
- Custom modals → `Dialog` or `Portal` from react-native-paper
- Icons → Use `Icon` from react-native-paper

### 🚫 AVOID - Standard React Native Components
- Do NOT use bare React Native `Button`, `TextInput`, etc.
- Do NOT create custom styled components when Paper equivalents exist
- Do NOT use third-party UI components that conflict with Material Design

### 📏 Layout Guidelines

#### Container Structure
```typescript
// ✅ CORRECT: Use Surface for containers
<Surface style={styles.container}>
  <Text variant="headlineMedium">Screen Title</Text>
  <Card style={styles.card}>
    <Card.Content>
      // Content here
    </Card.Content>
  </Card>
</Surface>

// ❌ WRONG: Using bare View
<View style={styles.container}>
  // Don't do this
</View>
```

#### Typography Hierarchy
**Always use Paper's typography variants:**
- `displayLarge` - Main headlines
- `headlineLarge/Medium/Small` - Section headers  
- `titleLarge/Medium/Small` - Card titles, important text
- `bodyLarge/Medium/Small` - Body text, descriptions
- `labelLarge/Medium/Small` - Button labels, captions

#### Spacing System
Use consistent spacing based on 8dp grid:
```typescript
const styles = StyleSheet.create({
  // Use multiples of 8 for spacing
  marginSmall: { margin: 8 },
  marginMedium: { margin: 16 },
  marginLarge: { margin: 24 },
  paddingSmall: { padding: 8 },
  paddingMedium: { padding: 16 },
  paddingLarge: { padding: 24 },
});
```

## 🎯 Component Patterns

### Form Components
```typescript
// ✅ CORRECT Form Pattern
<Surface style={styles.formContainer}>
  <Text variant="headlineMedium">Form Title</Text>
  
  <TextInput
    mode="outlined"
    label="Field Label"
    value={value}
    onChangeText={setValue}
    style={styles.input}
  />
  
  <Button 
    mode="contained" 
    onPress={handleSubmit}
    style={styles.submitButton}
  >
    Submit
  </Button>
</Surface>
```

### List Components  
```typescript
// ✅ CORRECT List Pattern
<Surface style={styles.container}>
  <List.Section>
    <List.Subheader>Section Title</List.Subheader>
    <List.Item
      title="Item Title"
      description="Item description"
      left={props => <List.Icon {...props} icon="folder" />}
      onPress={() => {}}
    />
  </List.Section>
</Surface>
```

### Navigation Components
```typescript
// ✅ CORRECT Navigation Pattern
<Appbar.Header>
  <Appbar.BackAction onPress={goBack} />
  <Appbar.Content title="Screen Title" />
  <Appbar.Action icon="more-vert" onPress={showMenu} />
</Appbar.Header>
```

## 🎨 Visual Guidelines

### Color Usage
- **Primary**: Main actions, key buttons, active states
- **Secondary**: Secondary actions, less important elements  
- **Tertiary**: Accent elements, highlights
- **Surface**: Card backgrounds, elevated content
- **Background**: Screen backgrounds, base layer

### Elevation & Depth
```typescript
// Use Paper's elevation system
<Surface elevation={0}>  // Base level
<Surface elevation={1}>  // Slightly raised (cards)
<Surface elevation={2}>  // More prominent (app bar)  
<Surface elevation={3}>  // Floating elements (FAB)
```

### Interactive States
Always handle loading, disabled, and error states:
```typescript
<Button 
  mode="contained"
  loading={isLoading}
  disabled={!isValid}
  onPress={handlePress}
>
  {isLoading ? 'Loading...' : 'Submit'}
</Button>
```

## 📱 Screen Structure Template

```typescript
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { 
  Surface, 
  Appbar, 
  Text, 
  Card,
  useTheme 
} from 'react-native-paper';

const ScreenName = ({ navigation }) => {
  const theme = useTheme();
  
  return (
    <>
      <Appbar.Header>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title="Screen Title" />
      </Appbar.Header>
      
      <Surface style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text variant="headlineMedium" style={styles.title}>
            Main Content
          </Text>
          
          <Card style={styles.card}>
            <Card.Content>
              // Your content here
            </Card.Content>
          </Card>
        </ScrollView>
      </Surface>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  title: {
    marginBottom: 16,
  },
  card: {
    marginBottom: 16,
  },
});
```

## ⚡ Performance Best Practices
- Always use `useTheme()` hook for dynamic theming
- Implement proper loading states with `ActivityIndicator`
- Use `Portal` for modals and overlays
- Optimize list rendering with `FlatList` and Paper's `List` components
- Cache theme objects and avoid inline styles

## 🔍 Code Review Checklist
Before submitting any React Native code, ensure:
- [ ] All UI components are from react-native-paper
- [ ] Open Sans font is properly configured and applied
- [ ] All text content is in Korean (한국어)
- [ ] **Mint theme colors are consistently applied** (#26A69A primary, #B2DFDB containers)
- [ ] Korean typography conventions are followed (proper spacing, line height)
- [ ] Consistent typography variants are used
- [ ] Proper spacing (8dp grid) is maintained  
- [ ] Theme colors are used correctly (mint green family)
- [ ] Accessibility props are included
- [ ] Loading and error states are handled with Korean labels
- [ ] Code follows the established patterns above
- [ ] Korean text layout considerations are addressed
- [ ] Mint color palette maintains good contrast ratios

## 🌐 Korean Localization Guidelines
- **Button Labels**: Use clear, actionable Korean verbs
  - ✅ "저장", "취소", "확인", "삭제"
  - ❌ "Save", "Cancel", "OK", "Delete"
- **Form Labels**: Use descriptive Korean nouns
  - ✅ "이메일 주소", "비밀번호", "사용자명"
  - ❌ "Email", "Password", "Username"
- **Messages**: Use polite Korean expressions
  - ✅ "저장되었습니다", "오류가 발생했습니다"
  - ❌ "Saved", "Error occurred"
- **Navigation**: Use clear Korean titles
  - ✅ "설정", "프로필", "알림"
  - ❌ "Settings", "Profile", "Notifications"

## 🎨 Mint Theme Color Guidelines
- **Primary Actions**: Use #26A69A for main buttons and active states
- **Backgrounds**: Use #E0F2F1 for screen backgrounds, #B2DFDB for containers
- **Accents**: Use #4DB6AC for highlights, #00695C for deep accents
- **Text**: Use #004D40 for headings, #00695C for body text
- **Success States**: Use mint green variations, avoid red except for errors
- **Progress Indicators**: Use gradient from #26A69A to #4DB6AC

## 🚀 Quick Start Commands
When creating new components, always start with:
```typescript
import React from 'react';
import { 
  Surface, 
  Text, 
  Button, 
  Card, 
  TextInput,
  FAB,
  useTheme 
} from 'react-native-paper';
import { useFonts, OpenSans_400Regular, OpenSans_500Medium, OpenSans_700Bold } from '@expo-google-fonts/open-sans';

// Korean component example with Mint theme and Open Sans
const MintThemedComponent = () => {
  const theme = useTheme();
  const [fontsLoaded] = useFonts({
    OpenSans_400Regular,
    OpenSans_500Medium, 
    OpenSans_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Surface style={{ flex: 1, padding: 16, backgroundColor: '#E0F2F1' }}>
      <Text variant="headlineMedium" style={{ color: '#00695C' }}>한국어 제목</Text>
      <Text variant="bodyMedium" style={{ color: '#004D40' }}>본문 내용입니다.</Text>
      <Button 
        mode="contained" 
        buttonColor="#26A69A"
        textColor="#FFFFFF"
        style={{ marginTop: 16 }}
      >
        민트 테마 버튼
      </Button>
    </Surface>
  );
};
```

Remember: **일관성이 핵심입니다 (Consistency is key)**. Every screen should feel like part of the same cohesive Korean application using React Native Paper's design system with **refreshing mint theme colors** and Open Sans font. The mint color palette creates a **modern, fresh, and calming** user experience perfect for everyday applications. 🌿✨