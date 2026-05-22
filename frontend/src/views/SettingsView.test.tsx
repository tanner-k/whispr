import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsView } from './SettingsView';
import { SettingsModel } from './SettingsPanels';
import { initialCapture } from '../state/capture';

const state = initialCapture;

describe('SettingsView — tabs', () => {
  it('renders the tab rail and defaults to the Tools panel', () => {
    render(<SettingsView state={state} dispatch={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Tools' })).toBeInTheDocument();
    // Tools panel content.
    expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();
  });

  it('switches to the Transcription panel', async () => {
    render(<SettingsView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Transcription' }));
    expect(screen.getByText('Primary engine')).toBeInTheDocument();
    expect(screen.getByText('Shadow engine')).toBeInTheDocument();
  });

  it('switches to the Model panel', async () => {
    render(<SettingsView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));
    expect(screen.getByText('Context window')).toBeInTheDocument();
  });

  it('switches to the Hotkeys panel', async () => {
    render(<SettingsView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Hotkeys' }));
    expect(screen.getByText('Record (hold to talk)')).toBeInTheDocument();
  });

  it('switches to the Privacy panel', async () => {
    render(<SettingsView state={state} dispatch={vi.fn()} />);
    await userEvent.click(screen.getByRole('button', { name: 'Privacy' }));
    expect(screen.getByText('Privacy & data')).toBeInTheDocument();
    expect(screen.getByText('100% local right now')).toBeInTheDocument();
  });
});

describe('SettingsView — Tools panel', () => {
  it('updates a permission row via its Segmented control', async () => {
    render(<SettingsView state={state} dispatch={vi.fn()} />);
    // The header summary shows the running tallies (5 auto / 5 ask / 2 off).
    expect(screen.getByText('5 auto')).toBeInTheDocument();
    expect(screen.getByText('5 ask')).toBeInTheDocument();
    expect(screen.getByText('2 off')).toBeInTheDocument();
    // "shell.run" (Run a shell command) starts at "off". Walk up from
    // the unique tool-id text to the row that owns the Segmented control.
    const idCell = screen.getByText('shell.run');
    // text → label/id wrapper → left column → grid row.
    const segRow = idCell.parentElement!.parentElement!.parentElement!;
    await userEvent.click(within(segRow).getByRole('button', { name: 'Auto' }));
    // The tallies update: one more auto, one fewer off.
    expect(screen.getByText('6 auto')).toBeInTheDocument();
    expect(screen.getByText('1 off')).toBeInTheDocument();
  });
});

describe('SettingsModel — Gemma 4 model list', () => {
  it('lists the Gemma 4 quants with UD-Q4_K_XL selected by default', () => {
    render(<SettingsModel />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('UD-Q4_K_XL');
    expect(
      screen.getByRole('option', { name: 'gemma-4-E4B-it · UD-Q4_K_XL (5.13 GB)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'gemma-4-E4B-it · Q4_K_M (4.98 GB)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'gemma-4-E4B-it · UD-Q3_K_XL (4.59 GB)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'gemma-4-E4B-it · UD-Q5_K_XL (6.66 GB)' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('option', { name: 'gemma-4-E4B-it · Q8_0 (8.19 GB)' }),
    ).toBeInTheDocument();
  });

  it('does not list the prototype Gemma 3 / Qwen / Llama / Phi models', () => {
    render(<SettingsModel />);
    expect(screen.queryByText(/gemma-3-4b-it/)).not.toBeInTheDocument();
    expect(screen.queryByText(/qwen2.5-7b-instruct/)).not.toBeInTheDocument();
    expect(screen.queryByText(/llama-3.1-8b-instruct/)).not.toBeInTheDocument();
    expect(screen.queryByText(/phi-4-14b/)).not.toBeInTheDocument();
  });
});
