import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VocabView } from './VocabView';
import { initialCapture } from '../state/capture';
import { VOCAB_INITIAL } from './vocabData';
import type { VocabItem } from '../types';

const state = initialCapture;

/** Returns a resolved loader seeded with VOCAB_INITIAL. */
function makeLoader(items: VocabItem[] = VOCAB_INITIAL) {
  return vi.fn().mockResolvedValue(items);
}

/** Returns a create spy that resolves with the item passed to it. */
function makeCreator() {
  return vi.fn().mockImplementation((item: VocabItem) => Promise.resolve(item));
}

/** Returns a remove spy that resolves with `{ id }`. */
function makeRemover() {
  return vi.fn().mockImplementation((id: number) => Promise.resolve({ id }));
}

describe('VocabView — table', () => {
  it('renders the header and every seed phrase', async () => {
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    const table = screen.getByRole('table');
    for (const it of VOCAB_INITIAL) {
      // "file an issue" also appears in the info box, so scope to the table.
      expect(await within(table).findByText(`"${it.phrase}"`)).toBeInTheDocument();
    }
  });

  it('marks built-in phrases with a built-in chip', async () => {
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    // Five format built-ins + two tool built-ins = seven built-in chips.
    const builtinCount = VOCAB_INITIAL.filter((it) => it.builtin).length;
    expect(await screen.findAllByText('built-in')).toHaveLength(builtinCount);
  });
});

describe('VocabView — add phrase', () => {
  it('opens the add-phrase form when "Add phrase" is clicked', async () => {
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    // Wait for load to settle before interacting.
    await screen.findByText(`"${VOCAB_INITIAL[0].phrase}"`);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    expect(screen.getByPlaceholderText('e.g. "log it as a bug"')).toBeInTheDocument();
  });

  it('adds a new phrase to the table via the form', async () => {
    const creator = makeCreator();
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={creator}
        removeVocab={makeRemover()}
      />,
    );
    await screen.findByText(`"${VOCAB_INITIAL[0].phrase}"`);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    await userEvent.type(
      screen.getByPlaceholderText('e.g. "log it as a bug"'),
      'shout it out loud',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add ↵' }));
    expect(await screen.findByText('"shout it out loud"')).toBeInTheDocument();
    // Form closes after a successful add.
    await waitFor(() => {
      expect(screen.queryByPlaceholderText('e.g. "log it as a bug"')).not.toBeInTheDocument();
    });
    // The injected creator was called once.
    expect(creator).toHaveBeenCalledTimes(1);
    const [calledWith] = creator.mock.calls[0] as [VocabItem];
    expect(calledWith.phrase).toBe('shout it out loud');
    expect(calledWith.builtin).toBe(false);
  });

  it('ignores an empty phrase submission', async () => {
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    await screen.findByText(`"${VOCAB_INITIAL[0].phrase}"`);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add ↵' }));
    // Form stays open because the phrase was blank.
    expect(screen.getByPlaceholderText('e.g. "log it as a bug"')).toBeInTheDocument();
  });

  it('closes the form on Cancel without adding a row', async () => {
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    await screen.findByText(`"${VOCAB_INITIAL[0].phrase}"`);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    await userEvent.type(screen.getByPlaceholderText('e.g. "log it as a bug"'), 'never added');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('"never added"')).not.toBeInTheDocument();
  });
});

describe('VocabView — remove phrase', () => {
  it('removes a non-builtin phrase when its trash button is clicked', async () => {
    const remover = makeRemover();
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={remover}
      />,
    );
    const table = screen.getByRole('table');
    // "file an issue" is a non-builtin row (id 8) and removable.
    const cell = await within(table).findByText('"file an issue"');
    const row = cell.closest('tr');
    expect(row).not.toBeNull();
    const trashBtn = row?.querySelector('button');
    expect(trashBtn).not.toBeNull();
    await userEvent.click(trashBtn as HTMLButtonElement);
    await waitFor(() => {
      expect(within(table).queryByText('"file an issue"')).not.toBeInTheDocument();
    });
    // The injected remover was called with the correct id.
    expect(remover).toHaveBeenCalledTimes(1);
    expect(remover).toHaveBeenCalledWith(8);
  });

  it('does not render a remove button for built-in phrases', async () => {
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={makeLoader()}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    // "format as markdown" is a built-in row — no trash button.
    const cell = await screen.findByText('"format as markdown"');
    const row = cell.closest('tr');
    expect(row?.querySelector('button')).toBeNull();
  });
});

describe('VocabView — loading and error states', () => {
  it('shows a loading indicator while the API call is in-flight', () => {
    // Never-resolving promise keeps the view in loading state.
    const neverLoader = vi.fn().mockReturnValue(new Promise<VocabItem[]>(() => {}));
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={neverLoader}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    // Header must be visible immediately (App-level nav test relies on this text).
    expect(screen.getByText(/Trigger phrases the parser listens for/)).toBeInTheDocument();
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an inline error message when the loader rejects', async () => {
    const failLoader = vi.fn().mockRejectedValue(new Error('Network error'));
    render(
      <VocabView
        state={state}
        dispatch={vi.fn()}
        loadVocab={failLoader}
        createVocab={makeCreator()}
        removeVocab={makeRemover()}
      />,
    );
    expect(await screen.findByText('Network error')).toBeInTheDocument();
    // Header remains visible — no crash.
    expect(screen.getByText(/Trigger phrases the parser listens for/)).toBeInTheDocument();
  });
});
