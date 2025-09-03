import { Spacing } from '../src/constants/spacing';
import { BorderRadius } from '../src/constants/borderRadius';

describe('Spacing', () => {
  it('should export correct values (xs:4, sm:8, md:16, lg:24, xl:32, xxl:48)', () => {
    expect(Spacing.xs).toBe(4);
    expect(Spacing.sm).toBe(8);
    expect(Spacing.md).toBe(16);
    expect(Spacing.lg).toBe(24);
    expect(Spacing.xl).toBe(32);
    expect(Spacing.xxl).toBe(48);
  });
});

describe('BorderRadius', () => {
  it('should export correct values (sm:4, md:8, lg:12, xl:16, full:999)', () => {
    expect(BorderRadius.sm).toBe(4);
    expect(BorderRadius.md).toBe(8);
    expect(BorderRadius.lg).toBe(12);
    expect(BorderRadius.xl).toBe(16);
    expect(BorderRadius.full).toBe(999);
  });
});