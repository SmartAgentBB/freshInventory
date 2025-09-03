import { Colors } from '../src/constants/colors';

describe('Mint Theme Colors', () => {
  it('should export correct primary mint colors (#26A69A)', () => {
    expect(Colors.primary).toBeDefined();
    expect(Colors.primary.main).toBe('#26A69A');
    expect(Colors.primary.light).toBe('#4DB6AC');
    expect(Colors.primary.dark).toBe('#00695C');
    expect(Colors.primary.container).toBe('#B2DFDB');
    expect(Colors.primary.onContainer).toBe('#004D40');
  });

  it('should export correct secondary mint colors (#4DB6AC)', () => {
    expect(Colors.secondary).toBeDefined();
    expect(Colors.secondary.main).toBe('#4DB6AC');
    expect(Colors.secondary.light).toBe('#80CBC4');
    expect(Colors.secondary.dark).toBe('#00695C');
    expect(Colors.secondary.container).toBe('#E0F2F1');
    expect(Colors.secondary.onContainer).toBe('#00695C');
  });

  it('should export tertiary mint colors', () => {
    expect(Colors.tertiary).toBeDefined();
    expect(Colors.tertiary.main).toBe('#00695C');
    expect(Colors.tertiary.light).toBe('#26A69A');
    expect(Colors.tertiary.dark).toBe('#004D40');
  });

  it('should export status colors compatible with mint theme', () => {
    expect(Colors.status).toBeDefined();
    expect(Colors.status.success).toBe('#4CAF50');
    expect(Colors.status.warning).toBe('#FF9800');
    expect(Colors.status.error).toBe('#FF5252');
    expect(Colors.status.info).toBe('#26A69A');
  });

  it('should export mint-themed text colors', () => {
    expect(Colors.text).toBeDefined();
    expect(Colors.text.primary).toBe('#004D40');
    expect(Colors.text.secondary).toBe('#00695C');
    expect(Colors.text.disabled).toBe('#80CBC4');
    expect(Colors.text.hint).toBe('#B2DFDB');
    expect(Colors.text.onPrimary).toBe('#FFFFFF');
    expect(Colors.text.onSecondary).toBe('#FFFFFF');
  });

  it('should export mint-themed background colors', () => {
    expect(Colors.background).toBeDefined();
    expect(Colors.background.default).toBe('#E0F2F1');
    expect(Colors.background.paper).toBe('#FFFFFF');
    expect(Colors.background.surface).toBe('#FFFBFE');
    expect(Colors.background.level1).toBe('#F1F8F6');
    expect(Colors.background.level2).toBe('#E8F5F0');
    expect(Colors.background.level3).toBe('#E0F2F1');
  });

  it('should export mint-themed border colors', () => {
    expect(Colors.border).toBeDefined();
    expect(Colors.border.light).toBe('#B2DFDB');
    expect(Colors.border.medium).toBe('#80CBC4');
    expect(Colors.border.dark).toBe('#4DB6AC');
    expect(Colors.border.outline).toBe('#4DB6AC');
    expect(Colors.border.outlineVariant).toBe('#B2DFDB');
  });

  it('should export Material Design 3 elevation colors', () => {
    expect(Colors.elevation).toBeDefined();
    expect(Colors.elevation.level0).toBe('transparent');
    expect(Colors.elevation.level1).toBe('#F1F8F6');
    expect(Colors.elevation.level2).toBe('#E8F5F0');
    expect(Colors.elevation.level3).toBe('#E0F2F1');
  });
});