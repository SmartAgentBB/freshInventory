# React Native Paper UI Development Guidelines

## 🎯 Core Principles
You are a React Native developer specializing in creating **consistent, simple, and elegant mobile applications** using React Native Paper. Always follow these principles:

### 📐 Design Philosophy
- **Prototype-First**: Always reference the Flask prototype (`freshInventory/`) for layout and UX patterns
- **Simplicity First**: Keep interfaces clean and uncluttered
- **Consistency**: Use React Native Paper components exclusively for UI elements
- **Material Design**: Strictly adhere to Material Design 3 principles
- **Korean-First**: All text and UI labels must be in Korean (한국어)
- **Accessibility**: Ensure all components are accessible by default
- **Performance**: Optimize for smooth 60fps performance

### 🎨 Prototype Reference Principle
**MANDATORY**: Before implementing any screen or component:
1. Check the corresponding Flask prototype in `freshInventory/templates/*.html`
2. Analyze the prototype's JavaScript in `freshInventory/static/js/app.js`
3. Follow the exact layout structure (except navigation placement)
4. Implement the same interaction patterns (inline editing, +/- buttons, etc.)
5. Match the visual hierarchy and component spacing

## 🎨 Theme Configuration - White Base with Mint Accents

### Colors System
```typescript
export const Colors = {
  // Primary Mint Colors (포인트 색상으로만 사용)
  primary: {
    main: '#26A69A',        // Main mint green - buttons, key actions
    light: '#4DB6AC',       // Light mint - hover states
    dark: '#00897B',        // Dark mint - pressed states
    container: '#E8F5F2',   // Light mint for selected/active items
    onContainer: '#1a1a1a', // Text on primary container
  },
  
  // Soft mint tints for subtle backgrounds
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
  },
  
  divider: '#E0F2F1',       // Subtle mint divider line
  
  // Text hierarchy (black base)
  text: {
    primary: '#1a1a1a',     // Almost black - main text
    secondary: '#5f6368',   // Medium gray - secondary text
    disabled: '#9AA0A6',    // Light gray - disabled text
    onPrimary: '#FFFFFF',   // White text on primary color
  },
  
  // Status colors
  status: {
    success: '#4CAF50',     // Green
    warning: '#FFA726',     // Orange
    error: '#EF5350',       // Red
    info: '#26A69A',        // Mint
  },
};
```

### 📱 Navigation Structure

#### Bottom Tab Navigation (항상 표시)
```typescript
// 하단 네비게이션은 모든 화면에서 항상 표시됩니다
const BottomTabNavigation = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: {
          backgroundColor: Colors.background.paper,  // 순수 흰색 배경
          borderTopColor: Colors.border.light,      // 연한 민트 보더
          height: 84,
          paddingBottom: 20,
          paddingTop: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 10,
        },
        tabBarActiveTintColor: Colors.primary.main,    // 선택된 탭: 민트색
        tabBarInactiveTintColor: Colors.text.secondary, // 선택 안된 탭: 회색
      }}
    >
      <Tab.Screen name="Inventory" component={InventoryStackNavigator} />
      <Tab.Screen name="Cooking" component={CookingScreen} />
      <Tab.Screen name="Shopping" component={ShoppingScreen} />
    </Tab.Navigator>
  );
};
```

## 🧩 Component Patterns

### Modern Food Item Card (home_list_sample.html 기반)
```typescript
const FoodItemCard = ({ item }) => {
  return (
    <Surface style={styles.container} elevation={2}>
      {/* Delete button - inside card */}
      <IconButton
        icon="close"
        size={20}
        style={styles.deleteButton}  // position: absolute, top: 8, right: 8
        iconColor={Colors.text.secondary}
        onPress={handleDelete}
      />
      
      <TouchableOpacity style={styles.content}>
        {/* Thumbnail - 128x128 */}
        <View style={styles.thumbnailContainer}>
          {item.thumbnail ? (
            <Image source={{ uri: item.thumbnail }} style={styles.thumbnail} />
          ) : (
            <View style={styles.placeholderThumbnail}>
              <Text style={styles.placeholderText}>{item.name.charAt(0)}</Text>
            </View>
          )}
        </View>
        
        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text variant="titleMedium" style={styles.name}>{item.name}</Text>
          
          {/* Registration date and D-day badge */}
          <View style={styles.infoRow}>
            <Text variant="bodySmall">등록: {formattedDate}</Text>
            <View style={[styles.dDayBadge, { backgroundColor: dDayBackgroundColor }]}>
              <Text style={styles.dDayText}>{dDayText}</Text>
            </View>
          </View>
          
          {/* Quantity and Percentage */}
          <View style={styles.infoRow}>
            <Text variant="bodySmall">수량: {item.quantity}{item.unit}</Text>
            <Text variant="bodySmall">{Math.round(remainsPercent)}%</Text>
          </View>
          
          {/* Progress Bar */}
          <ProgressBar 
            progress={item.remains || 1} 
            color={Colors.primary.main}
            style={styles.progressBar}
          />
        </View>
      </TouchableOpacity>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.paper,
    borderRadius: 16,
    marginBottom: 2,  // 최소 간격
    marginHorizontal: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.light,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
  },
  thumbnail: {
    width: 128,
    height: 128,
    borderRadius: 12,
  },
  placeholderThumbnail: {
    backgroundColor: Colors.background.level3,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 1,
  },
  dDayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border.light,
    marginTop: 8,
    overflow: 'hidden',
  },
});
```

### Enhanced Visual Effects (그라데이션 효과)

#### FAB Button with Shadow
```typescript
const fabStyle = {
  backgroundColor: Colors.primary.main,
  shadowColor: Colors.primary.main,  // 민트색 그림자
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.4,
  shadowRadius: 24,
  elevation: 8,
};
```

#### Active Filter Chip
```typescript
const activeSortChip = {
  backgroundColor: Colors.primary.main,
  borderColor: Colors.primary.main,
  shadowColor: Colors.primary.main,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 8,
  elevation: 3,
};
```

### Tab Navigation Pattern (강화된 탭)
```typescript
const tabStyles = {
  tabButton: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTabButton: {
    borderBottomColor: Colors.primary.main,
  },
  activeTabButtonText: {
    color: Colors.primary.main,
    fontFamily: 'OpenSans-Bold',
    fontWeight: '600',
  },
};
```

## 📏 Spacing System (정밀 조정됨)

```typescript
export const Spacing = {
  xs: 4,   // 카드 간 최소 간격 (marginBottom: 2 사용)
  sm: 8,   // 작은 간격
  md: 12,  // 중간 간격
  lg: 16,  // 큰 간격 (패딩)
  xl: 24,  // 특대 간격
  xxl: 32, // 최대 간격
};
```

### 카드 간격 규칙
- **카드와 카드 사이**: `marginBottom: 2` (최소 간격)
- **카드 좌우 여백**: `marginHorizontal: Spacing.sm`
- **카드 내부 패딩**: `padding: Spacing.lg`
- **썸네일 크기**: 128x128px 고정
- **Progress Bar 위 간격**: `marginTop: 8` (적당한 간격)

## 🎨 D-day Badge System (색상 시스템)

```typescript
// storage_days 대비 남은 비율로 색상 결정
const getDDayBackgroundColor = (daysUntilExpiry, percentRemaining) => {
  if (daysUntilExpiry < 0) {
    return '#F44336';  // Red - 만료됨
  } else if (daysUntilExpiry === 0) {
    return '#FF9800';  // Orange - D-Day
  } else {
    if (percentRemaining > 50) {
      return '#4CAF50';  // Green - 신선함
    } else if (percentRemaining > 20) {
      return '#FFC107';  // Yellow - 주의
    } else {
      return '#FF9800';  // Orange - 경고
    }
  }
};

// 노란색 배경일 때는 검은색 텍스트
const getDDayTextColor = (backgroundColor) => {
  return backgroundColor === '#FFC107' ? '#000000' : '#FFFFFF';
};
```

## 🔍 Design System Summary

### Visual Hierarchy
1. **Base**: 흰색 베이스 (#FFFFFF) - 카드, 주요 컨테이너
2. **Subtle Backgrounds**: 연한 민트 틴트 (#F8FDFC, #F0F9F8) - 배경, 서피스
3. **Accent Colors**: 민트 그린 (#26A69A) - 버튼, 액티브 상태, 포인트
4. **Borders**: 매우 연한 민트 (#E0F2F1) - 구분선, 테두리

### Shadow System
- **카드**: `shadowOpacity: 0.04, shadowRadius: 12` (부드러운 그림자)
- **FAB**: `shadowOpacity: 0.4, shadowRadius: 24` (강한 그림자, 민트색)
- **뱃지**: `shadowOpacity: 0.15, shadowRadius: 8` (중간 그림자)
- **네비게이션**: `shadowOpacity: 0.05, shadowRadius: 10` (상단 그림자)

### Typography (Open Sans)
- **제목**: OpenSans-Bold, 크기 크게
- **본문**: OpenSans-Regular, 표준 크기
- **강조**: OpenSans-SemiBold 또는 Bold
- **캡션**: OpenSans-Regular, 작은 크기

### Interactive Elements
- **삭제 버튼**: 카드 내부 우상단 (top: 8, right: 8)
- **터치 영역**: 카드 전체가 터치 가능
- **FAB**: 화면 우하단 고정, 민트색 그림자
- **탭 네비게이션**: 항상 하단에 표시

## ⚡ Performance Best Practices
- Always use `useTheme()` hook for dynamic theming
- Implement proper loading states with `ActivityIndicator`
- Use `Portal` for modals and overlays
- Optimize list rendering with `FlatList` and Paper's `List` components
- Cache theme objects and avoid inline styles

## 🚀 Quick Start Template

```typescript
import React from 'react';
import { View, ScrollView, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { 
  Surface, 
  Text, 
  Button, 
  IconButton,
  ProgressBar,
  FAB,
  useTheme 
} from 'react-native-paper';
import { Colors } from '../constants/colors';
import { Spacing } from '../constants/spacing';

const ScreenTemplate = () => {
  const theme = useTheme();
  
  return (
    <View style={styles.container}>
      {/* Content */}
      <ScrollView style={styles.scrollView}>
        {/* Your components here */}
      </ScrollView>
      
      {/* FAB - Always visible */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAdd}
        color="white"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.surface,
  },
  scrollView: {
    flex: 1,
  },
  fab: {
    position: 'absolute',
    margin: Spacing.lg,
    right: 0,
    bottom: 20,
    backgroundColor: Colors.primary.main,
    shadowColor: Colors.primary.main,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 8,
  },
});
```

## 📋 Code Review Checklist
- [ ] 모든 UI 컴포넌트가 React Native Paper 사용
- [ ] 흰색 베이스에 민트 포인트 색상 적용
- [ ] 카드 간격 최소화 (marginBottom: 2)
- [ ] 썸네일 크기 128x128 유지
- [ ] 삭제 버튼이 카드 내부에 위치
- [ ] D-day 뱃지 색상 시스템 적용
- [ ] FAB 버튼에 민트색 그림자 적용
- [ ] 하단 네비게이션이 모든 화면에 표시
- [ ] Open Sans 폰트 적용
- [ ] 모든 텍스트가 한국어로 작성
- [ ] 그림자 효과가 적절히 적용됨
- [ ] Progress Bar 높이 6px 유지

Remember: **일관성이 핵심입니다**. 모든 화면이 동일한 디자인 시스템을 따라야 하며, 흰색 베이스에 민트색 포인트가 조화롭게 어우러진 **모던하고 깔끔한** 인터페이스를 유지해야 합니다. 🌿✨