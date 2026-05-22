import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CaptureView } from './CaptureView';
import { initialCapture } from '../state/capture';
import type { CaptureState } from '../state/capture';
import { DEMO_SAMPLES } from './captureData';

/** Builds a capture state with overrides applied. */
function makeState(overrides: Partial<CaptureState> = {}): CaptureState {
  return { ...initialCapture, ...overrides };
}

const prefs = { zeroUI: true };

describe('CaptureView — idle', () => {
  it('renders the idle prompt and section header', () => {
    render(<CaptureView state={makeState()} dispatch={vi.fn()} prefs={prefs} />);
    expect(screen.getByText('Capture')).toBeInTheDocument();
    expect(screen.getByText('Ready when you are.')).toBeInTheDocument();
  });

  it('does not render the ready-state pipeline when idle', () => {
    render(<CaptureView state={makeState()} dispatch={vi.fn()} prefs={prefs} />);
    expect(screen.queryByText('Transcript & intent')).not.toBeInTheDocument();
    expect(screen.queryByText('Formatted output')).not.toBeInTheDocument();
  });

  it('shows the zero-UI subtitle when prefs.zeroUI is true', () => {
    render(<CaptureView state={makeState()} dispatch={vi.fn()} prefs={{ zeroUI: true }} />);
    expect(screen.getByText(/Zero-UI menubar capture is on/)).toBeInTheDocument();
  });

  it('shows the confirm subtitle when prefs.zeroUI is false', () => {
    render(<CaptureView state={makeState()} dispatch={vi.fn()} prefs={{ zeroUI: false }} />);
    expect(screen.getByText('Preview & confirm before paste.')).toBeInTheDocument();
  });

  it('dispatches demo:next when "Run demo" is clicked', async () => {
    const dispatch = vi.fn();
    render(<CaptureView state={makeState()} dispatch={dispatch} prefs={prefs} />);
    await userEvent.click(screen.getByRole('button', { name: /Run demo/ }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'demo:next' });
  });

  it('dispatches rec:start when the mic button is clicked', async () => {
    const dispatch = vi.fn();
    render(<CaptureView state={makeState()} dispatch={dispatch} prefs={prefs} />);
    await userEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'rec:start' });
  });
});

describe('CaptureView — ready', () => {
  /** A ready state holding the grocery-run sample (no tools). */
  const groceryReady = makeState({
    phase: 'ready',
    current: DEMO_SAMPLES[0],
    selectedFormat: DEMO_SAMPLES[0].format,
  });

  it('renders the transcript, formatted output, and routing panels', () => {
    render(<CaptureView state={groceryReady} dispatch={vi.fn()} prefs={prefs} />);
    expect(screen.getByText('Transcript & intent')).toBeInTheDocument();
    expect(screen.getByText('Formatted output')).toBeInTheDocument();
    expect(screen.getByText('Send to')).toBeInTheDocument();
  });

  it('shows the sample title and the formatted check-list output', () => {
    render(<CaptureView state={groceryReady} dispatch={vi.fn()} prefs={prefs} />);
    // Title appears in the capture card.
    expect(screen.getByText('Grocery run')).toBeInTheDocument();
    // Formatted output renders the check-list content.
    expect(screen.getByText(/- \[ \] Milk/, { exact: false })).toBeInTheDocument();
  });

  it('renders the inline-chip surface by default with the raw transcript', () => {
    render(<CaptureView state={groceryReady} dispatch={vi.fn()} prefs={prefs} />);
    expect(screen.getByText(/hybrid parser · regex matched in 0.3ms/)).toBeInTheDocument();
  });

  it('dispatches commit when "Paste & save" is clicked', async () => {
    const dispatch = vi.fn();
    render(<CaptureView state={groceryReady} dispatch={dispatch} prefs={prefs} />);
    await userEvent.click(screen.getByRole('button', { name: /Paste & save/ }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'commit' });
  });

  it('renders a tool card when the sample has a pending tool', () => {
    const calendarReady = makeState({
      phase: 'ready',
      current: DEMO_SAMPLES[1],
      selectedFormat: DEMO_SAMPLES[1].format,
    });
    render(<CaptureView state={calendarReady} dispatch={vi.fn()} prefs={prefs} />);
    expect(screen.getByText('calendar.create_event')).toBeInTheDocument();
    expect(screen.getByText('needs permission')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Allow' })).toBeInTheDocument();
  });
});

describe('CaptureView — format-view Segmented', () => {
  const groceryReady = makeState({
    phase: 'ready',
    current: DEMO_SAMPLES[0],
    selectedFormat: DEMO_SAMPLES[0].format,
  });

  it('dispatches fmtView:set when "Split pane" is chosen', async () => {
    const dispatch = vi.fn();
    render(<CaptureView state={groceryReady} dispatch={dispatch} prefs={prefs} />);
    await userEvent.click(screen.getByRole('button', { name: 'Split pane' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'fmtView:set', v: 'split' });
  });

  it('renders the split-pane surface when formatView is "split"', () => {
    render(
      <CaptureView
        state={{ ...groceryReady, formatView: 'split' }}
        dispatch={vi.fn()}
        prefs={prefs}
      />,
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
    expect(screen.getByText('Intent')).toBeInTheDocument();
  });

  it('renders the confidence surface with format alternates when formatView is "confidence"', () => {
    render(
      <CaptureView
        state={{ ...groceryReady, formatView: 'confidence' }}
        dispatch={vi.fn()}
        prefs={prefs}
      />,
    );
    // The grocery sample has four ranked alternates; confidences shown to 2dp.
    expect(screen.getByText('0.94')).toBeInTheDocument();
    expect(screen.getByText('0.71')).toBeInTheDocument();
  });

  it('dispatches format:pick when an alternate is clicked in the confidence view', async () => {
    const dispatch = vi.fn();
    render(
      <CaptureView
        state={{ ...groceryReady, formatView: 'confidence' }}
        dispatch={dispatch}
        prefs={prefs}
      />,
    );
    // "List" is one of the alternate rows.
    await userEvent.click(screen.getByText('List'));
    expect(dispatch).toHaveBeenCalledWith({ type: 'format:pick', f: 'list' });
  });
});

describe('CaptureView — recording', () => {
  it('renders the recording status and elapsed time', () => {
    render(
      <CaptureView
        state={makeState({ phase: 'recording', elapsed: 42 })}
        dispatch={vi.fn()}
        prefs={prefs}
      />,
    );
    expect(screen.getByText('Recording')).toBeInTheDocument();
    expect(screen.getByText('0:42')).toBeInTheDocument();
  });

  it('dispatches rec:stop when the mic is clicked while recording', async () => {
    const dispatch = vi.fn();
    render(
      <CaptureView state={makeState({ phase: 'recording' })} dispatch={dispatch} prefs={prefs} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Stop recording' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'rec:stop' });
  });

  it('dispatches rec:cancel when "Cancel" is clicked', async () => {
    const dispatch = vi.fn();
    render(
      <CaptureView state={makeState({ phase: 'recording' })} dispatch={dispatch} prefs={prefs} />,
    );
    await userEvent.click(screen.getByRole('button', { name: /Cancel/ }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'rec:cancel' });
  });
});

describe('CaptureView — transcribing', () => {
  it('renders the transcribing status', () => {
    render(
      <CaptureView
        state={makeState({ phase: 'transcribing', elapsed: 6 })}
        dispatch={vi.fn()}
        prefs={prefs}
      />,
    );
    expect(screen.getByText('Transcribing')).toBeInTheDocument();
  });

  it('disables the mic button while transcribing', () => {
    render(
      <CaptureView state={makeState({ phase: 'transcribing' })} dispatch={vi.fn()} prefs={prefs} />,
    );
    expect(screen.getByRole('button', { name: 'Start recording' })).toBeDisabled();
  });
});
