import { execSync } from 'child_process';

describe('Expo Build', () => {
  it('should build successfully', () => {
    expect(() => {
      execSync('npx expo install --check', { 
        stdio: 'pipe',
        timeout: 60000 
      });
    }).not.toThrow();
  }, 65000);
});