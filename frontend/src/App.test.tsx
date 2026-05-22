import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('renders the Whispr Studio placeholder heading', () => {
    render(<App />);
    expect(screen.getByRole('heading', { name: /whispr studio/i })).toBeInTheDocument();
  });
});
