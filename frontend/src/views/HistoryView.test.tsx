import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HistoryView } from './HistoryView';
import { initialCapture } from '../state/capture';
import { HISTORY_ITEMS } from './historyData';

const state = initialCapture;

/** Fixture loader — resolves synchronously with the demo data. */
const fixtureLoader = () => Promise.resolve(HISTORY_ITEMS);

describe('HistoryView — list', () => {
  it('renders every history row title', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    for (const item of HISTORY_ITEMS) {
      // The default-selected row (h1) also appears as the detail-pane
      // heading, so getAllByText covers both placements.
      expect((await screen.findAllByText(item.title)).length).toBeGreaterThan(0);
    }
  });

  it('renders the search box and filter chips immediately (before data arrives)', () => {
    // Use a loader that never resolves so we can assert on the static shell.
    const neverResolves = () => new Promise<typeof HISTORY_ITEMS>(() => undefined);
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={neverResolves} />);
    expect(screen.getByPlaceholderText('Search transcripts…')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Corpus ★' })).toBeInTheDocument();
  });
});

describe('HistoryView — search filtering', () => {
  it('filters the list to rows matching the query', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    // Wait for data to load
    await screen.findByText('Standup — May 21');
    await userEvent.type(screen.getByPlaceholderText('Search transcripts…'), 'standup');
    // "Standup — May 21" matches; "Parser idea" is filtered out of the
    // list. (The detail pane keeps the prior selection, mirroring the
    // prototype, so we assert on a non-selected non-match.)
    expect(screen.getByText('Standup — May 21')).toBeInTheDocument();
    expect(screen.queryByText('Parser idea')).not.toBeInTheDocument();
  });

  it('matches against the preview text, not only the title', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    // Wait for data to load
    await screen.findByText('Trip checklist');
    // "passport" only appears in the Trip checklist preview.
    await userEvent.type(screen.getByPlaceholderText('Search transcripts…'), 'passport');
    expect(screen.getByText('Trip checklist')).toBeInTheDocument();
    expect(screen.queryByText('Reading list')).not.toBeInTheDocument();
  });

  it('shows the empty state when nothing matches', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    // Wait for data to load — search box is always present; wait for a list
    // row that is *only* in the list region (not the detail pane heading).
    await screen.findByRole('heading', { name: 'Grocery run', level: 2 });
    await userEvent.type(screen.getByPlaceholderText('Search transcripts…'), 'zzzznomatch');
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('restores the full list when the search is cleared', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    // Wait for data to load
    await screen.findByText('Parser idea');
    const input = screen.getByPlaceholderText('Search transcripts…');
    await userEvent.type(input, 'standup');
    expect(screen.queryByText('Parser idea')).not.toBeInTheDocument();
    await userEvent.clear(input);
    expect(screen.getByText('Parser idea')).toBeInTheDocument();
  });
});

describe('HistoryView — detail pane', () => {
  it('shows the first item detail by default', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    // The default selection is h1 (Grocery run). Its title appears as
    // an <h2> heading in the detail pane.
    await screen.findByRole('heading', { name: 'Grocery run', level: 2 });
    expect(screen.getByRole('heading', { name: 'Grocery run', level: 2 })).toBeInTheDocument();
  });

  it('updates the detail pane when a different row is selected', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    await userEvent.click(await screen.findByText('Parser idea'));
    expect(screen.getByRole('heading', { name: 'Parser idea', level: 2 })).toBeInTheDocument();
  });

  it('shows the raw transcript from a matching demo sample', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    // h2 "Standup — May 21" matches no demo sample by title, but
    // selecting "Design sync — onboarding" (h4) does match DEMO_SAMPLES.
    await userEvent.click(await screen.findByText('Design sync — onboarding'));
    expect(screen.getByText(/Set up a sync with the design team next Tuesday/)).toBeInTheDocument();
  });

  it('shows a fallback notice for rows without a stored transcript', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    await userEvent.click(await screen.findByText('Bug report draft'));
    expect(screen.getByText(/full transcript not stored/)).toBeInTheDocument();
  });
});

describe('HistoryView — starred filter', () => {
  it('shows only starred rows when the Corpus filter is active', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Corpus ★' }));
    // Starred: Grocery run, Standup, Design sync, Trip checklist.
    expect(screen.getByText('Trip checklist')).toBeInTheDocument();
    // Not starred: Parser idea.
    expect(screen.queryByText('Parser idea')).not.toBeInTheDocument();
  });
});

describe('HistoryView — today filter', () => {
  it('shows only Today-prefixed rows when the Today filter is active', async () => {
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={fixtureLoader} />);
    await userEvent.click(await screen.findByRole('button', { name: 'Today' }));
    // Today: Grocery run, Standup — May 21, Parser idea.
    expect(screen.getByText('Parser idea')).toBeInTheDocument();
    // Not today: Reading list (Mon May 19), Trip checklist (Sun May 18).
    expect(screen.queryByText('Reading list')).not.toBeInTheDocument();
    expect(screen.queryByText('Trip checklist')).not.toBeInTheDocument();
  });
});

describe('HistoryView — loading and error states', () => {
  it('shows a loading indicator while the fetch is in flight', () => {
    const neverResolves = () => new Promise<typeof HISTORY_ITEMS>(() => undefined);
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={neverResolves} />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an inline error message when the fetch fails', async () => {
    const failLoader = () => Promise.reject(new Error('Network error'));
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={failLoader} />);
    await screen.findByRole('alert');
    expect(screen.getByRole('alert')).toHaveTextContent('Network error');
    // Static shell must still be present
    expect(screen.getByPlaceholderText('Search transcripts…')).toBeInTheDocument();
  });

  it('shows an empty state when the API returns an empty list', async () => {
    const emptyLoader = () => Promise.resolve([]);
    render(<HistoryView state={state} dispatch={vi.fn()} loadHistory={emptyLoader} />);
    await waitFor(() => {
      expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    });
    expect(screen.getByText('No matches')).toBeInTheDocument();
  });

  it('invokes deleteHistory with the selected item id when the trash button is clicked', async () => {
    const deleteStub = vi.fn().mockResolvedValue({ id: 'h1' });
    render(
      <HistoryView
        state={state}
        dispatch={vi.fn()}
        loadHistory={fixtureLoader}
        deleteHistory={deleteStub}
      />,
    );
    // Wait for the default-selected row (h1 — Grocery run) detail pane to appear.
    await screen.findByRole('heading', { name: 'Grocery run', level: 2 });
    // The detail pane renders the heading then a row of action buttons
    // (star, copy, trash). The trash button is the last one in that header row.
    // HistoryDetail renders it as a Btn with no text — we can find it by its
    // position: all icon-only buttons in the detail pane header.
    const buttons = screen.getAllByRole('button');
    // Find buttons that are children of the detail pane (right column).
    // The trash button is the last icon-only button rendered by HistoryDetail.
    const iconOnlyButtons = buttons.filter((btn) => btn.textContent?.trim() === '');
    const trashButton = iconOnlyButtons[iconOnlyButtons.length - 1];
    await userEvent.click(trashButton);
    expect(deleteStub).toHaveBeenCalledWith('h1');
  });
});
