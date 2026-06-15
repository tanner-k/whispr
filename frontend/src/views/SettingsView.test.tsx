import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsView } from './SettingsView';
import { SettingsModel } from './SettingsPanels';
import { initialCapture } from '../state/capture';
import type { Settings, SettingsPatch } from '../types';
import { INITIAL_TOOLS } from './SettingsPanels';

const state = initialCapture;

/** A complete Settings fixture that matches the INITIAL_TOOLS defaults. */
const FIXTURE_SETTINGS: Settings = {
  transcription: {
    primaryEngine: 'insanely-fast-whisper',
    shadowEngine: 'Apple Speech',
    initialPrompt: '',
    language: 'auto',
  },
  model: {
    runtime: 'llama.cpp',
    model: 'UD-Q4_K_XL',
    contextWindow: 8192,
    temperature: 0.2,
    multiAgent: false,
  },
  privacy: {
    keepRawAudio: true,
    audioRetention: '30d',
    anonymousErrorReports: false,
    allowCloudFallback: false,
  },
  tools: INITIAL_TOOLS,
};

/** Default fixture load function — returns the standard settings fixture. */
function makeLoadSettings(override?: Partial<Settings>) {
  return vi.fn(async (): Promise<Settings> => ({ ...FIXTURE_SETTINGS, ...override }));
}

/** Default no-op save spy — returns whatever is currently loaded. */
function makeSaveSettings() {
  return vi.fn(async (_patch: SettingsPatch): Promise<Settings> => FIXTURE_SETTINGS);
}

describe('SettingsView — tabs', () => {
  it('renders the tab rail and defaults to the Tools panel', async () => {
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={makeSaveSettings()}
      />,
    );
    expect(screen.getByRole('button', { name: 'Tools' })).toBeInTheDocument();
    // Tools panel content — must render immediately from the fallback list.
    expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();
  });

  it('switches to the Transcription panel', async () => {
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={makeSaveSettings()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Transcription' }));
    expect(screen.getByText('Primary engine')).toBeInTheDocument();
    expect(screen.getByText('Shadow engine')).toBeInTheDocument();
  });

  it('switches to the Model panel', async () => {
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={makeSaveSettings()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Model' }));
    expect(screen.getByText('Context window')).toBeInTheDocument();
  });

  it('switches to the Hotkeys panel', async () => {
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={makeSaveSettings()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Hotkeys' }));
    expect(screen.getByText('Record (hold to talk)')).toBeInTheDocument();
  });

  it('switches to the Privacy panel', async () => {
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={makeSaveSettings()}
      />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Privacy' }));
    expect(screen.getByText('Privacy & data')).toBeInTheDocument();
    expect(screen.getByText('100% local right now')).toBeInTheDocument();
  });
});

describe('SettingsView — Tools panel', () => {
  it('updates a permission row via its Segmented control', async () => {
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={makeSaveSettings()}
      />,
    );
    // Wait for the fixture to load (replaces the fallback list).
    await waitFor(() => expect(screen.getByText('5 auto')).toBeInTheDocument());
    // The header summary shows the running tallies (5 auto / 5 ask / 2 off).
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

  it('calls saveSettings with the updated tools list when a permission changes', async () => {
    const saveSettings = makeSaveSettings();
    render(
      <SettingsView
        state={state}
        dispatch={vi.fn()}
        loadSettings={makeLoadSettings()}
        saveSettings={saveSettings}
      />,
    );
    // Wait for the fixture tools to load.
    await waitFor(() => expect(screen.getByText('shell.run')).toBeInTheDocument());
    const idCell = screen.getByText('shell.run');
    const segRow = idCell.parentElement!.parentElement!.parentElement!;
    await userEvent.click(within(segRow).getByRole('button', { name: 'Auto' }));
    // saveSettings should have been called with a tools patch.
    expect(saveSettings).toHaveBeenCalled();
    const [patch] = saveSettings.mock.calls[0] as [SettingsPatch];
    expect(patch.tools).toBeDefined();
    const shellTool = patch.tools!.find((t) => t.id === 'shell.run');
    expect(shellTool?.perm).toBe('auto');
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
