import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BenchView } from './BenchView';
import { initialCapture } from '../state/capture';
import { BENCH_SAMPLES } from './benchData';

const state = initialCapture;

describe('BenchView — tabs', () => {
  it('renders the header and tab bar, defaulting to the Diff tab', () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    expect(screen.getByText('Bench')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diff' })).toBeInTheDocument();
    // Diff tab content: the sample picker eyebrow.
    expect(screen.getByText('Samples')).toBeInTheDocument();
  });

  it('switches to the Leaderboard tab', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    expect(screen.getByText('Best WER (local)')).toBeInTheDocument();
    expect(screen.getByText('whisper.cpp · large-v3')).toBeInTheDocument();
  });

  it('switches to the Grid tab', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(screen.getByText('Avg WER')).toBeInTheDocument();
    // Engine column header unique to the grid.
    expect(screen.getByText('wcpp')).toBeInTheDocument();
  });

  it('switches to the Blind battle tab', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Blind battle/ }));
    expect(screen.getByText('round 7 / 20')).toBeInTheDocument();
    expect(screen.getByText('option A')).toBeInTheDocument();
    expect(screen.getByText('option B')).toBeInTheDocument();
  });
});

describe('BenchView — Diff tab', () => {
  it('lists every bench sample in the picker', () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    for (const s of BENCH_SAMPLES) {
      expect(screen.getAllByText(s.title).length).toBeGreaterThan(0);
    }
  });

  it('shows the ground truth of the default-selected sample (b1)', () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    expect(
      screen.getByText(/the new onboarding flow, and, um, the data export feature/),
    ).toBeInTheDocument();
  });

  it('updates the diff panels when a different sample is selected', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    // grocery-list.wav appears as a picker button; clicking it selects b2.
    await userEvent.click(screen.getByText('grocery-list.wav'));
    expect(
      screen.getByText(/grab milk, eggs, bread, and bananas if they look good/),
    ).toBeInTheDocument();
    // Both engine panels are present.
    expect(screen.getByText('insanely-fast-whisper')).toBeInTheDocument();
    expect(screen.getByText('Apple Speech')).toBeInTheDocument();
  });
});

describe('BenchView — Blind battle interaction', () => {
  it('advances the round when "Tie" is clicked', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Blind battle/ }));
    expect(screen.getByText('round 7 / 20')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tie' }));
    expect(screen.getByText('round 8 / 20')).toBeInTheDocument();
  });

  it('selects an option card when clicked', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: /Blind battle/ }));
    const optionA = screen.getByText('option A').closest('button');
    expect(optionA).not.toBeNull();
    await userEvent.click(optionA as HTMLButtonElement);
    // Selecting highlights with the accent border.
    expect(optionA).toHaveStyle({ border: '1px solid var(--accent)' });
  });
});

describe('BenchView — Leaderboard table', () => {
  it('renders the IFW row highlighted as fastest', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    const table = screen.getByRole('table');
    // The IFW engine appears in the leaderboard table.
    expect(within(table).getByText('insanely-fast-whisper')).toBeInTheDocument();
    expect(within(table).getByText('fastest')).toBeInTheDocument();
  });
});
