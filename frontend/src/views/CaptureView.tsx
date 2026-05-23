/**
 * CaptureView.tsx — the Capture view, the heart of Whispr Studio.
 *
 * Faithful port of `CaptureView` from
 * design-reference/project/studio-views.jsx. Drives the capture flow:
 * idle → recording → transcribing → ready. Sub-components live in
 * sibling files (CaptureCard, formatSurfaces, ToolCardStack,
 * RoutingBar). Inline styles and `var(--…)` theme references are
 * preserved verbatim.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { transcribeCapture } from '../api/client';
import { Btn, Chip, Icon, Panel, SectionHeader, Segmented } from '../components';
import type { CaptureAction, CaptureState, Dispatch, FormatView } from '../state/capture';
import type { Sample } from '../types';
import { CaptureCard } from './CaptureCard';
import { ConfidenceView, FormattedOutput, InlineChipView, SplitPaneView } from './formatSurfaces';
import { RoutingBar } from './RoutingBar';
import { ToolCardStack } from './ToolCardStack';

/** Format-surface options for the {@link Segmented} control. */
const FORMAT_VIEW_OPTIONS: ReadonlyArray<{ value: FormatView; label: string }> = [
  { value: 'inline', label: 'Inline chip' },
  { value: 'split', label: 'Split pane' },
  { value: 'confidence', label: 'Confidence' },
];

/** Props for {@link CaptureView}. */
export interface CaptureViewProps {
  /** The current capture state. */
  state: CaptureState;
  /** Action dispatcher. */
  dispatch: Dispatch;
  /** User preferences surfaced in the header copy. */
  prefs: { zeroUI: boolean };
  /** Audio upload implementation, injectable for tests. */
  transcribeAudio?: (audio: Blob) => Promise<Sample>;
}

/** The Capture view — capture card plus the ready-state pipeline. */
export function CaptureView({
  state,
  dispatch,
  prefs,
  transcribeAudio = transcribeCapture,
}: CaptureViewProps) {
  const sample = state.current;
  const fmtView = state.formatView || 'inline';
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const finishTranscription = useCallback(
    async (blob: Blob) => {
      try {
        const result = await transcribeAudio(blob);
        dispatch({ type: 'rec:done', sample: result });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Transcription failed';
        setCaptureError(message);
        dispatch({ type: 'rec:cancel' });
      }
    },
    [dispatch, transcribeAudio],
  );

  const startRecording = useCallback(async () => {
    setCaptureError(null);
    cancelledRef.current = false;
    dispatch({ type: 'rec:start' });

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Microphone capture is not available in this browser');
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = createRecorder(stream);
      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const chunks = [...chunksRef.current];
        chunksRef.current = [];
        stopStream();
        if (cancelledRef.current) {
          cancelledRef.current = false;
          return;
        }
        const mimeType = recorder.mimeType || chunks[0]?.type || 'audio/webm';
        const blob = new Blob(chunks, { type: mimeType });
        void finishTranscription(blob);
      };

      recorder.start();
    } catch (error) {
      stopStream();
      const message = error instanceof Error ? error.message : 'Unable to start microphone capture';
      setCaptureError(message);
      dispatch({ type: 'rec:cancel' });
    }
  }, [dispatch, finishTranscription, stopStream]);

  const captureDispatch = useCallback(
    (action: CaptureAction) => {
      if (action.type === 'rec:start') {
        void startRecording();
        return;
      }
      if (action.type === 'rec:stop') {
        dispatch(action);
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        return;
      }
      if (action.type === 'rec:cancel') {
        cancelledRef.current = true;
        const recorder = recorderRef.current;
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        dispatch(action);
        stopStream();
        return;
      }
      dispatch(action);
    },
    [dispatch, startRecording, stopStream],
  );

  useEffect(() => {
    return () => {
      cancelledRef.current = true;
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== 'inactive') recorder.stop();
      stopStream();
    };
  }, [stopStream]);

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <SectionHeader
        title="Capture"
        subtitle={
          prefs.zeroUI
            ? 'Zero-UI menubar capture is on. Studio mirrors every clip you take.'
            : 'Preview & confirm before paste.'
        }
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Chip tone="neutral" dot icon={null}>
              <span className="mono" style={{ fontSize: 11 }}>
                gemma 4 · e4b · ud-q4_k_xl
              </span>
            </Chip>
            <Chip tone="success" dot>
              local · llama.cpp
            </Chip>
            <Btn
              icon={<Icon.spark size={14} />}
              variant="ghost"
              onClick={() => captureDispatch({ type: 'demo:next' })}
            >
              Run demo
            </Btn>
          </div>
        }
      />

      {/* Big capture card */}
      <CaptureCard state={state} dispatch={captureDispatch} />
      {captureError && (
        <div style={{ marginTop: 10 }}>
          <Chip tone="danger">{captureError}</Chip>
        </div>
      )}

      {state.phase === 'ready' && sample && (
        <div className="fade-up" style={{ marginTop: 20 }}>
          {/* Transcript + format pipeline */}
          <Panel
            title="Transcript & intent"
            action={
              <Segmented
                size="sm"
                value={fmtView}
                onChange={(v) => captureDispatch({ type: 'fmtView:set', v })}
                options={FORMAT_VIEW_OPTIONS}
              />
            }
          >
            {fmtView === 'inline' && <InlineChipView sample={sample} />}
            {fmtView === 'split' && <SplitPaneView sample={sample} />}
            {fmtView === 'confidence' && (
              <ConfidenceView
                sample={sample}
                selected={state.selectedFormat || sample.format}
                onPick={(f) => captureDispatch({ type: 'format:pick', f })}
              />
            )}
          </Panel>

          {/* Formatted output */}
          <div style={{ marginTop: 14 }}>
            <Panel
              title="Formatted output"
              action={
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                    stt {sample.sttMs}ms · llm {sample.llmMs}ms
                  </span>
                  <Btn size="sm" icon={<Icon.copy size={13} />} variant="ghost">
                    Copy
                  </Btn>
                </div>
              }
            >
              <FormattedOutput sample={sample} selected={state.selectedFormat || sample.format} />
            </Panel>
          </div>

          {/* Tool calls */}
          {sample.tools.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <ToolCardStack tools={sample.tools} dispatch={captureDispatch} />
            </div>
          )}

          {/* Routing bar */}
          <div style={{ marginTop: 14 }}>
            <RoutingBar sample={sample} dispatch={captureDispatch} />
          </div>
        </div>
      )}
    </div>
  );
}

function createRecorder(stream: MediaStream): MediaRecorder {
  const preferred = 'audio/webm;codecs=opus';
  if (
    typeof MediaRecorder.isTypeSupported === 'function' &&
    MediaRecorder.isTypeSupported(preferred)
  ) {
    return new MediaRecorder(stream, { mimeType: preferred });
  }
  return new MediaRecorder(stream);
}
