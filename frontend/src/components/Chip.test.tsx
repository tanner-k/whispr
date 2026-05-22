import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Chip, FormatChip, FORMAT_META } from './Chip';
import type { Format } from '../types';

describe('Chip', () => {
  it('renders its content', () => {
    render(<Chip>Badge</Chip>);
    expect(screen.getByText('Badge')).toBeInTheDocument();
  });

  it('applies the neutral tone by default', () => {
    render(<Chip>Neutral</Chip>);
    expect(screen.getByText('Neutral')).toHaveStyle({ background: 'var(--bg3)' });
  });

  it('applies the success tone color', () => {
    render(<Chip tone="success">OK</Chip>);
    expect(screen.getByText('OK')).toHaveStyle({ color: 'var(--success)' });
  });

  it('applies the blue tone color', () => {
    render(<Chip tone="blue">Info</Chip>);
    expect(screen.getByText('Info')).toHaveStyle({ color: 'var(--blue)' });
  });

  it('shows a pointer cursor when clickable', () => {
    render(<Chip onClick={() => {}}>Click</Chip>);
    expect(screen.getByText('Click')).toHaveStyle({ cursor: 'pointer' });
  });

  it('shows a default cursor when not clickable', () => {
    render(<Chip>Static</Chip>);
    expect(screen.getByText('Static')).toHaveStyle({ cursor: 'default' });
  });

  it('fires onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<Chip onClick={onClick}>Click</Chip>);
    await userEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders a leading icon node', () => {
    render(<Chip icon={<svg data-testid="chip-icon" />}>With icon</Chip>);
    expect(screen.getByTestId('chip-icon')).toBeInTheDocument();
  });
});

describe('FormatChip', () => {
  it('renders the correct label and icon for each format', () => {
    (Object.keys(FORMAT_META) as Format[]).forEach((format) => {
      const meta = FORMAT_META[format];
      const { unmount } = render(<FormatChip format={format} />);
      expect(screen.getByText(meta.label)).toBeInTheDocument();
      expect(screen.getByText(meta.icon)).toBeInTheDocument();
      unmount();
    });
  });

  it('renders the rounded confidence percentage', () => {
    render(<FormatChip format="markdown" confidence={0.873} />);
    expect(screen.getByText('87%')).toBeInTheDocument();
  });

  it('omits the confidence when compact', () => {
    render(<FormatChip format="markdown" confidence={0.873} compact />);
    expect(screen.queryByText('87%')).not.toBeInTheDocument();
  });

  it('forwards onClick', async () => {
    const onClick = vi.fn();
    render(<FormatChip format="prose" onClick={onClick} />);
    await userEvent.click(screen.getByText('Prose'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
