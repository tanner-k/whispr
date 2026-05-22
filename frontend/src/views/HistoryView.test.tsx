import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryView } from './HistoryView';
import { initialCapture } from '../state/capture';
import { HISTORY_ITEMS } from './historyData';

const state = initialCapture;

describe('HistoryView — list', () => {
  it('renders every history row title', () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    for (const item of HISTORY_ITEMS) {
      // The default-selected row (h1) also appears as the detail-pane
      // heading, so getAllByText covers both placements.
      expect(screen.getAllByText(item.title).length).toBeGreaterThan(0);
    }
  });

  it('renders the search box and filter chips', () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    expect(screen.getByPlaceholderText('Search transcripts…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Corpus ★' })).toBeInTheDocument();
  });
});

describe('HistoryView — search filtering', () => {
  it('filters the list to rows matching the query', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Search transcripts…'), 'standup');
    // "Standup — May 21" matches; "Parser idea" is filtered out of the
    // list. (The detail pane keeps the prior selection, mirroring the
    // prototype, so we assert on a non-selected non-match.)
    expect(screen.getByText('Standup — May 21')).toBeInTheDocument();
    expect(screen.queryByText('Parser idea')).not.toBeInTheDocument();
  });

  it('matches against the preview text, not only the title', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    // "passport" only appears in the Trip checklist preview.
    await userEvent.type(screen.getByPlaceholderText('Search transcripts…'), 'passport');
    expect(screen.getByText('Trip checklist')).toBeInTheDocument();
    expect(screen.queryByText('Reading list')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    await userEvent.type(screen.getByPlaceholderText('Search transcripts…'), 'zzzznomatch');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('restores the full list when the search is cleared', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    const input = screen.getByPlaceholderText('Search transcripts…');
    await userEvent.type(input, 'standup');
    expect(screen.queryByText('Parser idea')).not.toBeInTheDocument();
    await userEvent.clear(input);
    expect(screen.getByText('Parser idea')).toBeInTheDocument();
  });
});

describe('HistoryView — detail pane', () => {
  it('shows the first item detail by default', () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    // The default selection is h1 (Grocery run). Its title appears as
    // an <h2> heading in the detail pane.
    expect(screen.getByRole('heading', { name: 'Grocery run', level: 2 })).toBeInTheDocument();
  });

  it('updates the detail pane when a different row is selected', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByText('Parser idea'));
    expect(screen.getByRole('heading', { name: 'Parser idea', level: 2 })).toBeInTheDocument();
  });

  it('shows the raw transcript from a matching demo sample', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    // h2 "Standup — May 21" matches no demo sample by title, but
    // selecting "Design sync — onboarding" (h4) does match DEMO_SAMPLES.
    await userEvent.click(screen.getByText('Design sync — onboarding'));
    expect(screen.getByText(/Set up a sync with the design team next Tuesday/)).toBeInTheDocument();
  });

  it('shows a fallback notice for rows without a stored transcript', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByText('Bug report draft'));
    expect(screen.getByText(/full transcript not stored/)).toBeInTheDocument();
  });
});

describe('HistoryView — starred filter', () => {
  it('shows only starred rows when the Corpus filter is active', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Corpus ★' }));
    // Starred: Grocery run, Standup, Design sync, Trip checklist.
    expect(screen.getByText('Trip checklist')).toBeInTheDocument();
    // Not starred: Parser idea.
    expect(screen.queryByText('Parser idea')).not.toBeInTheDocument();
  });
});
