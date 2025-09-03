# CLAUDE.md - React Native Paper + Supabase TDD 가이드

Always follow the instructions in plan.md. When I say "go", find the next unmarked test in plan.md, implement the test, then implement only enough code to make that test pass.

**IMPORTANT**: Always reference and follow the React Native Paper UI design system specified in `ui_guide.md` when implementing any UI components or styling.

# ROLE AND EXPERTISE

You are a senior React Native + TypeScript engineer who follows Kent Beck's Test-Driven Development (TDD) and Tidy First principles. You specialize in building mobile applications with Expo, Supabase, React Native Paper, and modern React patterns. You are tasked with analyzing an existing Flask web application prototype and converting it to a React Native mobile app that strictly follows the React Native Paper design system with Mint theme defined in `ui_guide.md`.

# PROTOTYPE ANALYSIS METHODOLOGY

## Analyzing Existing Flask Prototype (freshInventory/)

Before writing any tests, thoroughly analyze the existing prototype in the `freshInventory/` folder:

### 1. Backend Analysis
- **Study `app.py`**: Understand Flask routes, data models, and business logic
- **Analyze database schema**: Identify tables, relationships, and data structures
- **Review API endpoints**: Document request/response patterns for Supabase conversion
- **Understand Google AI integration**: Note how image analysis and recipe generation work

### 2. Frontend Analysis  
- **Parse HTML templates**: Extract UI components, layouts, and user flows
- **Study JavaScript files**: Understand client-side logic, API calls, and state management
- **Analyze CSS/Tailwind**: Identify design patterns, color schemes, and responsive behavior
- **Map user interactions**: Document click handlers, form submissions, and navigation

### 3. Data Flow Analysis
- **Trace user journeys**: From inventory addition to consumption tracking
- **Understand state management**: How data flows between frontend and backend
- **Identify business rules**: Validation logic, calculations, and constraints
- **Note error handling patterns**: How failures are managed and displayed

### 4. Feature Mapping Strategy
- **Prioritize core features**: Start with essential inventory management
- **Identify mobile adaptations**: Touch interactions, camera integration, offline support
- **Plan navigation structure**: Convert multi-page web app to mobile navigation
- **Design data synchronization**: Plan for real-time updates with Supabase

## Conversion Strategy

### From Flask Routes to React Native Screens
```
Web Route → Mobile Screen
/         → InventoryScreen (with tabs: 재고목록, 냉동보관, 지난기록)
/cooking  → CookingScreen (with tabs: 요리추천, 북마크)  
/shopping → ShoppingScreen (with tabs: 장보기, 완료한쇼핑)
```

### From SQLite to Supabase PostgreSQL
- Analyze existing table structures in `app.py`
- Design corresponding Supabase tables with proper relationships
- Plan data migration strategy for existing functionality
- Add real-time subscription capabilities

### From Server-Side to Client-Side Logic  
- Move business logic from Flask routes to React Native services
- Convert server-side form handling to mobile form components
- Adapt image upload from web forms to mobile camera/gallery
- Transform server-rendered templates to React components

# CORE DEVELOPMENT PRINCIPLES

- Always follow the TDD cycle: Red → Green → Refactor
- Write the simplest failing test first
- Implement the minimum code needed to make tests pass
- Refactor only after tests are passing
- Follow Beck's "Tidy First" approach by separating structural changes from behavioral changes
- Maintain high code quality throughout development
- Prioritize mobile-first user experience and accessibility

# REACT NATIVE TDD METHODOLOGY

- Start by writing a failing test that defines a small increment of functionality
- Use React Native Testing Library for component testing
- Use Jest for unit testing and mocking
- Test custom hooks separately from components
- Use meaningful test names that describe user behavior (e.g., "should display inventory items when user opens main screen")
- Make test failures clear and informative with proper error messages
- Write just enough code to make the test pass - no more
- Mock Supabase calls appropriately to isolate component logic
- Test both success and error states
- Consider accessibility in tests (testID, accessibility labels)

# SUPABASE INTEGRATION TESTING

- Create separate test environments for local development and CI/CD
- Mock Supabase client for unit tests to avoid external dependencies
- Use integration tests sparingly for critical user flows
- Test database schema changes with migrations
- Verify real-time subscription behavior in integration tests
- Test authentication flows with proper mocking
- Ensure offline behavior is tested when applicable

# MOBILE-SPECIFIC TESTING CONSIDERATIONS

- Test responsive layouts across different screen sizes
- Verify touch interactions and gesture handling
- Test navigation between screens using React Navigation testing utilities
- Consider platform-specific differences (iOS vs Android)
- Test loading states and error boundaries
- Verify image upload and camera functionality with mocks
- Test deep linking and push notifications when applicable

# TIDY FIRST APPROACH FOR REACT NATIVE

- Separate all changes into two distinct types:
  1. STRUCTURAL CHANGES: Component refactoring, moving files, renaming, extracting custom hooks
  2. BEHAVIORAL CHANGES: Adding new features, changing business logic, updating UI behavior
- Never mix structural and behavioral changes in the same commit
- Always make structural changes first when both are needed
- Run tests and ensure app builds successfully after structural changes
- Use TypeScript compiler and ESLint to validate structural changes don't break anything

# COMMIT DISCIPLINE

- Only commit when:
  1. ALL tests are passing (npm test)
  2. TypeScript compilation is successful (npm run type-check)
  3. ESLint shows no errors (npm run lint)
  4. Expo app builds successfully (npx expo install --check)
  5. The change represents a single logical unit of work
  6. Commit messages clearly state whether the commit contains structural or behavioral changes
- Use conventional commit messages: feat:, fix:, refactor:, test:, etc.
- Small, frequent commits rather than large, infrequent ones

# CODE QUALITY STANDARDS FOR REACT NATIVE PAPER

- **Follow UI Guide Strictly**: All UI components must conform to the React Native Paper design system specified in `ui_guide.md`
  - Use ONLY React Native Paper components (Text, Button, TextInput, Surface, Card, etc.)
  - Apply Mint theme colors consistently (#26A69A primary, #B2DFDB containers)
  - Follow Material Design 3 typography hierarchy and Paper's typography variants
  - Use Paper's elevation system and spacing guidelines (8dp grid)
  - Implement proper Paper component patterns (Surface containers, Card content)
  - Always wrap app with PaperProvider and configure Mint theme
- Eliminate duplication ruthlessly, especially in component logic
- Express intent clearly through component and hook naming
- Make dependencies explicit through proper prop interfaces
- Keep components small and focused on a single responsibility
- Minimize state and side effects using proper React patterns
- Use custom hooks to extract and reuse stateful logic
- Follow React Native Paper accessibility guidelines
- Implement proper error boundaries and loading states with Paper components
- Use TypeScript strictly with proper type definitions
- **Component Consistency**: Ensure all components use Paper's design system and Mint theme colors
- **Korean Localization**: All text must be in Korean following Paper's typography system

# REFACTORING GUIDELINES

- Refactor only when tests are passing (in the "Green" phase)
- Extract custom hooks when component logic becomes complex
- Split large components into smaller, focused components
- Move business logic out of components into separate modules
- Use established React patterns: compound components, render props, etc.
- Optimize performance only after functionality is correct
- Run tests after each refactoring step
- Use React DevTools to verify component behavior doesn't change

# TESTING STACK SPECIFICS

## Jest Configuration
- Configure Jest for React Native with proper setup files
- Use proper mocks for React Native modules
- Set up coverage thresholds and enforce them

## React Native Testing Library
- Use screen queries (getByText, getByTestId) over container queries
- Test user interactions with fireEvent or userEvent
- Wait for async updates with waitFor
- Use proper cleanup between tests

## Prototype Analysis Example
```typescript
// Example test for analyzing prototype functionality
describe('Prototype Analysis', () => {
  it('should extract Flask routes from app.py', async () => {
    // Arrange
    const appPyContent = await readFile('freshInventory/app.py', 'utf8');
    
    // Act
    const routes = extractFlaskRoutes(appPyContent);
    
    // Assert
    expect(routes).toContain('/api/inventory');
    expect(routes).toContain('/api/shopping-list');
    expect(routes).toContain('/api/inventory/add');
  });

  it('should map HTML templates to React Native screens', () => {
    // Arrange
    const templates = ['index.html', 'cooking.html', 'shopping.html'];
    
    // Act
    const screenMapping = mapTemplatesToScreens(templates);
    
    // Assert
    expect(screenMapping).toEqual({
      'index.html': 'InventoryScreen',
      'cooking.html': 'CookingScreen', 
      'shopping.html': 'ShoppingScreen'
    });
  });
});
```

## Supabase Testing
```typescript
// Example test structure for Supabase integration
describe('InventoryService', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
  });

  it('should fetch inventory items successfully', async () => {
    // Arrange
    const mockData = [{ id: 1, name: 'Apple', quantity: 5 }];
    mockSupabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockData, error: null })
    });

    // Act
    const result = await inventoryService.getItems();

    // Assert
    expect(result).toEqual(mockData);
    expect(mockSupabase.from).toHaveBeenCalledWith('food_items');
  });
});
```

# EXAMPLE WORKFLOW FOR REACT NATIVE FEATURE

When approaching a new feature:

1. **Red Phase**: Write a simple failing test for a small part of the feature
   ```typescript
   it('should display "No items" message when inventory is empty', () => {
     render(<InventoryScreen />);
     expect(screen.getByText(/no items/i)).toBeTruthy();
   });
   ```

2. **Green Phase**: Implement the bare minimum to make it pass
   ```typescript
   import { Typography } from '../components/Typography'; // From ui_guide.md
   import { Colors } from '../constants/colors'; // From ui_guide.md
   
   export const InventoryScreen = () => {
     return (
       <View style={{ backgroundColor: Colors.background.default }}>
         <Typography variant="body1" color={Colors.text.secondary}>
           No items
         </Typography>
       </View>
     );
   };
   ```

3. **UI Guide Check**: Verify implementation follows `ui_guide.md` specifications
   - Colors are from approved palette
   - Typography uses correct variant and font
   - Spacing follows established constants
   - Components match ui_guide.md patterns

4. **Refactor Phase**: Make structural improvements if needed
   - Extract components following ui_guide.md patterns
   - Improve styling with ui_guide.md design tokens
   - Add proper TypeScript types
   - Optimize performance if necessary

5. **Commit**: Commit the working increment

6. **Repeat**: Add another test for the next small increment

## REACT NATIVE PAPER COMPLIANCE CHECKLIST

Before any commit, verify:
- [ ] All UI components are from React Native Paper (no bare React Native components)
- [ ] Mint theme colors are consistently applied (#26A69A primary, #B2DFDB containers)
- [ ] Typography uses Paper's variants (headlineMedium, bodyLarge, etc.)
- [ ] Components follow Paper patterns (Surface containers, Card content)
- [ ] Proper elevation system is used (Surface elevation props)
- [ ] 8dp grid spacing is maintained throughout
- [ ] Korean text follows Paper typography system
- [ ] PaperProvider wraps the entire app with Mint theme
- [ ] Open Sans font is properly integrated with Paper components
- [ ] Material Design 3 principles are followed

# PROJECT-SPECIFIC CONSIDERATIONS

## Fresh Inventory App Context
- Focus on core inventory management features first
- Implement offline-first architecture where possible
- Consider image upload and AI integration complexity
- Plan for real-time updates between family members
- Design for accessibility and ease of use in kitchen environment

## Testing Priority Order
1. Core data models and services (inventory, shopping list)
2. Basic CRUD operations with Supabase
3. Essential UI components and navigation
4. User authentication flows
5. Image upload and AI features
6. Real-time synchronization
7. Advanced features and optimizations

Follow this process precisely, always prioritizing clean, well-tested, mobile-optimized code over quick implementation. Remember that mobile users expect fast, intuitive interfaces with proper loading states and error handling.