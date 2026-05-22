import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Btn, Kbd } from './Button';

describe('Btn', () => {
  it('renders its label', () => {
    render(<Btn>Save</Btn>);
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('renders a leading icon node', () => {
    render(<Btn icon={<svg data-testid="icon" />}>Save</Btn>);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('renders a kbd shortcut hint', () => {
    render(<Btn kbd="⌘S">Save</Btn>);
    expect(screen.getByText('⌘S')).toBeInTheDocument();
  });

  it('fires the click handler when clicked', async () => {
    const onClick = vi.fn();
    render(<Btn onClick={onClick}>Click</Btn>);
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not fire the click handler when disabled', async () => {
    const onClick = vi.fn();
    render(
      <Btn onClick={onClick} disabled>
        Click
      </Btn>,
    );
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('applies a dimmed not-allowed style when disabled', () => {
    render(<Btn disabled>Click</Btn>);
    const btn = screen.getByRole('button');
    expect(btn).toHaveStyle({ opacity: '0.5', cursor: 'not-allowed' });
  });

  it('applies the primary variant background', () => {
    render(<Btn variant="primary">Go</Btn>);
    expect(screen.getByRole('button')).toHaveStyle({ background: 'var(--accent)' });
  });

  it('applies the danger variant color', () => {
    render(<Btn variant="danger">Delete</Btn>);
    expect(screen.getByRole('button')).toHaveStyle({ color: 'var(--danger)' });
  });

  it('applies the active state border', () => {
    render(<Btn active>Tab</Btn>);
    expect(screen.getByRole('button')).toHaveStyle({ borderColor: 'var(--border-hi)' });
  });

  it('honors the sm size with a smaller font', () => {
    render(<Btn size="sm">Small</Btn>);
    expect(screen.getByRole('button')).toHaveStyle({ fontSize: '12px' });
  });
});

describe('Kbd', () => {
  it('renders its key label', () => {
    render(<Kbd>Esc</Kbd>);
    expect(screen.getByText('Esc')).toBeInTheDocument();
  });
});
