import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BenchView } from './BenchView';
import { initialCapture } from '../state/capture';
import { BENCH_SAMPLES } from './benchData';
import type { BenchStats } from '../types';

const state = initialCapture;

/** Fixture stats matching the injected BENCH_SAMPLES. */
const FIXTURE_STATS: BenchStats = {
  sampleCount: BENCH_SAMPLES.length,
  ifwWer: 2.66,
  appleWer: 3.48,
  ifwMs: 370,
  appleMs: 590,
};

/** Returns prop overrides that inject fixture data for all tests. */
function fixtureProps() {
  return {
    loadSamples: () => Promise.resolve(BENCH_SAMPLES),
    loadStats: () => Promise.resolve(FIXTURE_STATS),
  };
}

describe('BenchView — tabs', () => {
  it('renders the header and tab bar immediately (before data loads)', () => {
    // Use a never-resolving promise to freeze data in loading state.
    render(
      <BenchView
        state={state}
        dispatch={vi.fn()}
        loadSamples={() => new Promise(() => {})}
        loadStats={() => new Promise(() => {})}
      />,
    );
    expect(screen.getByText('Bench')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Diff' })).toBeInTheDocument();
  });

  it('renders the Diff tab with the Samples eyebrow after data loads', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    // The "Samples" label lives inside BenchDiff which renders once data arrives.
    expect(await screen.findByText('Samples')).toBeInTheDocument();
  });

  it('switches to the Leaderboard tab', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    expect(screen.getByText('Best WER (local)')).toBeInTheDocument();
    expect(screen.getByText('whisper.cpp · large-v3')).toBeInTheDocument();
  });

  it('switches to the Grid tab', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Grid' }));
    expect(await screen.findByText('Avg WER')).toBeInTheDocument();
    // Engine column header unique to the grid.
    expect(screen.getByText('wcpp')).toBeInTheDocument();
  });

  it('switches to the Blind battle tab', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    await userEvent.click(screen.getByRole('button', { name: /Blind battle/ }));
    expect(screen.getByText('round 7 / 20')).toBeInTheDocument();
    expect(screen.getByText('option A')).toBeInTheDocument();
    expect(screen.getByText('option B')).toBeInTheDocument();
  });
});

describe('BenchView — Diff tab', () => {
  it('lists every bench sample in the picker', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    for (const s of BENCH_SAMPLES) {
      expect(await screen.findAllByText(s.title)).not.toHaveLength(0);
    }
  });

  it('shows the ground truth of the default-selected sample (b1)', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    expect(
      await screen.findByText(/the new onboarding flow, and, um, the data export feature/),
    ).toBeInTheDocument();
  });

  it('updates the diff panels when a different sample is selected', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    // Wait for the picker to appear, then click the second sample.
    await screen.findByText('grocery-list.wav');
    await userEvent.click(screen.getByText('grocery-list.wav'));
    expect(
      await screen.findByText(/grab milk, eggs, bread, and bananas if they look good/),
    ).toBeInTheDocument();
    // Both engine panels are present.
    expect(screen.getByText('insanely-fast-whisper')).toBeInTheDocument();
    expect(screen.getByText('Apple Speech')).toBeInTheDocument();
  });
});

describe('BenchView — Blind battle interaction', () => {
  it('advances the round when "Tie" is clicked', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    await userEvent.click(screen.getByRole('button', { name: /Blind battle/ }));
    expect(screen.getByText('round 7 / 20')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tie' }));
    expect(screen.getByText('round 8 / 20')).toBeInTheDocument();
  });

  it('selects an option card when clicked', async () => {
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
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
    render(<BenchView state={state} dispatch={vi.fn()} {...fixtureProps()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Leaderboard' }));
    const table = screen.getByRole('table');
    // The IFW engine appears in the leaderboard table.
    expect(within(table).getByText('insanely-fast-whisper')).toBeInTheDocument();
    expect(within(table).getByText('fastest')).toBeInTheDocument();
  });
});

describe('BenchView — loading state', () => {
  it('shows a loading indicator while samples are being fetched', () => {
    render(
      <BenchView
        state={state}
        dispatch={vi.fn()}
        loadSamples={() => new Promise(() => {})}
        loadStats={() => new Promise(() => {})}
      />,
    );
    expect(screen.getByText('Loading samples…')).toBeInTheDocument();
  });
});

describe('BenchView — empty state', () => {
  it('shows an empty message when no samples are returned', async () => {
    render(
      <BenchView
        state={state}
        dispatch={vi.fn()}
        loadSamples={() => Promise.resolve([])}
        loadStats={() => Promise.resolve(FIXTURE_STATS)}
      />,
    );
    expect(await screen.findByText('No samples found.')).toBeInTheDocument();
  });
});

describe('BenchView — error state', () => {
  it('shows an inline error message when samples fail to load', async () => {
    render(
      <BenchView
        state={state}
        dispatch={vi.fn()}
        loadSamples={() => Promise.reject(new Error('Network error'))}
        loadStats={() => Promise.resolve(FIXTURE_STATS)}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText(/Could not load samples: Network error/)).toBeInTheDocument();
    });
  });

  it('shows "Stats unavailable" in the tab bar when stats fail to load', async () => {
    render(
      <BenchView
        state={state}
        dispatch={vi.fn()}
        loadSamples={() => Promise.resolve(BENCH_SAMPLES)}
        loadStats={() => Promise.reject(new Error('Stats error'))}
      />,
    );
    await waitFor(() => {
      expect(screen.getByText('Stats unavailable')).toBeInTheDocument();
    });
  });
});
