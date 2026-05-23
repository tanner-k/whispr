import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VocabView } from './VocabView';
import { initialCapture } from '../state/capture';
import { VOCAB_INITIAL } from './vocabData';

const state = initialCapture;

describe('VocabView — table', () => {
  it('renders the header and every seed phrase', () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    expect(screen.getByText('Vocabulary')).toBeInTheDocument();
    const table = screen.getByRole('table');
    for (const it of VOCAB_INITIAL) {
      // "file an issue" also appears in the info box, so scope to the table.
      expect(within(table).getByText(`"${it.phrase}"`)).toBeInTheDocument();
    }
  });

  it('marks built-in phrases with a built-in chip', () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    // Five format built-ins + two tool built-ins = seven built-in chips.
    const builtinCount = VOCAB_INITIAL.filter((it) => it.builtin).length;
    expect(screen.getAllByText('built-in')).toHaveLength(builtinCount);
  });
});

describe('VocabView — add phrase', () => {
  it('opens the add-phrase form when "Add phrase" is clicked', async () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    expect(screen.getByPlaceholderText('e.g. "log it as a bug"')).toBeInTheDocument();
  });

  it('adds a new phrase to the table via the form', async () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    await userEvent.type(
      screen.getByPlaceholderText('e.g. "log it as a bug"'),
      'shout it out loud',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add ↵' }));
    expect(screen.getByText('"shout it out loud"')).toBeInTheDocument();
    // Form closes after a successful add.
    expect(screen.queryByPlaceholderText('e.g. "log it as a bug"')).not.toBeInTheDocument();
  });

  it('ignores an empty phrase submission', async () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    await userEvent.click(screen.getByRole('button', { name: 'Add ↵' }));
    // Form stays open because the phrase was blank.
    expect(screen.getByPlaceholderText('e.g. "log it as a bug"')).toBeInTheDocument();
  });

  it('closes the form on Cancel without adding a row', async () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Add phrase' }));
    await userEvent.type(screen.getByPlaceholderText('e.g. "log it as a bug"'), 'never added');
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('"never added"')).not.toBeInTheDocument();
  });
});

describe('VocabView — remove phrase', () => {
  it('removes a non-builtin phrase when its trash button is clicked', async () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    const table = screen.getByRole('table');
    // "file an issue" is a non-builtin row (id 8) and removable.
    const row = within(table).getByText('"file an issue"').closest('tr');
    expect(row).not.toBeNull();
    const trashBtn = row?.querySelector('button');
    expect(trashBtn).not.toBeNull();
    await userEvent.click(trashBtn as HTMLButtonElement);
    expect(within(table).queryByText('"file an issue"')).not.toBeInTheDocument();
  });

  it('does not render a remove button for built-in phrases', () => {
    render(<VocabView state={state} dispatch={vi.fn()} />);
    // "format as markdown" is a built-in row — no trash button.
    const row = screen.getByText('"format as markdown"').closest('tr');
    expect(row?.querySelector('button')).toBeNull();
  });
});
