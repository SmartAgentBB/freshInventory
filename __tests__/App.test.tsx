import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('should render without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });

  it('should display correct title "Fresh Inventory"', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Fresh Inventory')).toBeTruthy();
    }, { timeout: 3000 });
  });
});