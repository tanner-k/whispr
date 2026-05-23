import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Segmented, Switch } from './Controls';
import type { SegmentedOption } from './Controls';

const OPTIONS: SegmentedOption<'a' | 'b' | 'c'>[] = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma' },
];

describe('Segmented', () => {
  it('renders every option', () => {
    render(<Segmented options={OPTIONS} value="a" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Alpha' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Beta' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeInTheDocument();
  });

  it('calls onChange with the selected value', async () => {
    const onChange = vi.fn();
    render(<Segmented options={OPTIONS} value="a" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('highlights the selected option', () => {
    render(<Segmented options={OPTIONS} value="b" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveStyle({
      background: 'var(--bg3)',
    });
  });

  it('applies a tone color to the selected toned option', () => {
    const toned: SegmentedOption<'on' | 'off'>[] = [
      { value: 'on', label: 'On', tone: 'success' },
      { value: 'off', label: 'Off', tone: 'danger' },
    ];
    render(<Segmented options={toned} value="on" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: 'On' })).toHaveStyle({
      color: 'var(--success)',
    });
  });
});

describe('Switch', () => {
  it('renders a button', () => {
    render(<Switch on={false} onChange={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('toggles from off to on', async () => {
    const onChange = vi.fn();
    render(<Switch on={false} onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('toggles from on to off', async () => {
    const onChange = vi.fn();
    render(<Switch on onChange={onChange} />);
    await userEvent.click(screen.getByRole('button'));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('shows the accent background when on', () => {
    render(<Switch on onChange={() => {}} />);
    expect(screen.getByRole('button')).toHaveStyle({ background: 'var(--accent)' });
  });
});
