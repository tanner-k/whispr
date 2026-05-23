import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from './App';
import { DEMO_SAMPLES } from './views/captureData';

const originalMediaDevices = navigator.mediaDevices;

class MockMediaRecorder {
  static instances: MockMediaRecorder[] = [];
  static isTypeSupported = vi.fn(() => true);

  ondataavailable: ((event: BlobEvent) => void) | null = null;
  onstop: (() => void) | null = null;
  state: RecordingState = 'inactive';
  mimeType = 'audio/webm;codecs=opus';

  constructor() {
    MockMediaRecorder.instances.push(this);
  }

  start() {
    this.state = 'recording';
  }

  stop() {
    this.state = 'inactive';
    this.ondataavailable?.({
      data: new Blob(['audio'], { type: this.mimeType }),
    } as BlobEvent);
    this.onstop?.();
  }
}

function mockBrowserRecording(sample = DEMO_SAMPLES[0]) {
  MockMediaRecorder.instances = [];
  let resolveUpload: () => void = () => {};
  const upload = new Promise<void>((resolve) => {
    resolveUpload = resolve;
  });
  vi.stubGlobal('MediaRecorder', MockMediaRecorder);
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: {
      getUserMedia: vi.fn().mockResolvedValue({
        getTracks: () => [{ stop: vi.fn() }],
      }),
    },
  });
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(async () => {
      await upload;
      return {
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: sample, error: null }),
      };
    }),
  );
  return { resolveUpload };
}

describe('App', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: originalMediaDevices,
    });
  });

  it('renders the app shell on the Capture view', () => {
    render(<App />);
    expect(screen.getByText('Whispr Studio')).toBeInTheDocument();
    expect(screen.getByText('Ready when you are.')).toBeInTheDocument();
    expect(screen.getByText('Menubar preview')).toBeInTheDocument();
  });

  it('reaches all five views from the nav rail', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'History' }));
    expect(screen.getByPlaceholderText('Search transcripts…')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Bench' }));
    expect(screen.getByText('Samples')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Vocab' }));
    expect(screen.getByText(/Trigger phrases the parser listens for/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Settings' }));
    expect(screen.getByText('Copy to clipboard')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Capture' }));
    expect(screen.getByText('Ready when you are.')).toBeInTheDocument();
  });

  it('supports the Alt+B shortcut to open Bench', () => {
    render(<App />);
    fireEvent.keyDown(window, { key: 'b', altKey: true });
    expect(screen.getByText('Samples')).toBeInTheDocument();
  });

  it('runs the capture flow from recording to ready', async () => {
    const recording = mockBrowserRecording();
    render(<App />);

    await userEvent.click(screen.getByTitle('Start recording'));
    expect(screen.getAllByText(/recording/i).length).toBeGreaterThan(0);
    await waitFor(() => expect(MockMediaRecorder.instances).toHaveLength(1));

    await userEvent.click(screen.getByTitle('Stop recording'));
    expect(await screen.findAllByText(/transcribing/i)).toHaveLength(2);

    recording.resolveUpload();
    expect(await screen.findByText('Grocery run')).toBeInTheDocument();
    expect(screen.getByText(/Ready to send/)).toBeInTheDocument();
  });

  it('runs the demo sample and commits it back to idle', async () => {
    render(<App />);
    await userEvent.click(screen.getByRole('button', { name: 'Run demo' }));
    expect(screen.getByText('Grocery run')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Paste & save ↵' }));
    expect(screen.getByText('Ready when you are.')).toBeInTheDocument();
  });
});
