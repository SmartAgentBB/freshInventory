import fs from 'fs';
import path from 'path';

describe('TypeScript Configuration', () => {
  it('should have valid TypeScript configuration', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const exists = fs.existsSync(tsconfigPath);
    expect(exists).toBe(true);
    
    if (exists) {
      const tsconfigContent = fs.readFileSync(tsconfigPath, 'utf8');
      expect(() => JSON.parse(tsconfigContent)).not.toThrow();
      
      const tsconfig = JSON.parse(tsconfigContent);
      expect(tsconfig).toHaveProperty('compilerOptions');
      expect(tsconfig.compilerOptions).toHaveProperty('strict');
    }
  });
});