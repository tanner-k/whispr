/**
 * state/capture.ts — capture-state machine types.
 *
 * Derived from the `captureReducer` in
 * design-reference/project/studio-app.jsx. The reducer drives the
 * Capture and History views through the recording lifecycle:
 * `idle → recording → transcribing → ready`.
 *
 * This module defines only the *types* and the initial state. The
 * reducer implementation lands in T5 (App shell), which imports
 * {@link CaptureState}, {@link CaptureAction} and {@link initialCapture}
 * from here so the wiring stays a clean import.
 */
import type { Format, RouteTarget, Sample } from '../types';

/* ─── Phase ───────────────────────────────────────────────────────
 * The recording lifecycle stage. */
export type CapturePhase = 'idle' | 'recording' | 'transcribing' | 'ready';

/* ─── FormatView ──────────────────────────────────────────────────
 * Which of the three transcript/intent surfaces the Capture view
 * currently shows. */
export type FormatView = 'inline' | 'split' | 'confidence';

/* ─── CaptureState ────────────────────────────────────────────────
 * The full reducer state. Mirrors `initialCapture` in studio-app.jsx. */
export interface CaptureState {
  /** Current recording lifecycle stage. */
  phase: CapturePhase;
  /** Elapsed recording time in seconds. */
  elapsed: number;
  /** The capture result once `phase` is `'ready'`; null otherwise. */
  current: Sample | null;
  /** The format the user has selected, or null to fall back to
   * `current.format`. */
  selectedFormat: Format | null;
  /** Which transcript/intent surface is shown. */
  formatView: FormatView;
  /** Index into DEMO_SAMPLES used to cycle demo data. */
  demoIdx: number;
}

/* ─── CaptureAction ───────────────────────────────────────────────
 * Discriminated union of every action the capture reducer accepts,
 * plus the App-level `nav:go`. Discriminated on `type`. */
export type CaptureAction =
  /** Begin recording — resets elapsed time and current sample. */
  | { type: 'rec:start' }
  /** Advance the elapsed-time counter by one tick. */
  | { type: 'rec:tick' }
  /** Stop recording and move to transcription. */
  | { type: 'rec:stop' }
  /** Abandon the recording and return to idle. */
  | { type: 'rec:cancel' }
  /** Transcription finished — show the result. Optionally supplies
   * the sample; otherwise the reducer falls back to demo data. */
  | { type: 'rec:done'; sample?: Sample }
  /** Reset the capture state back to idle. */
  | { type: 'reset' }
  /** Jump straight to a ready demo sample. */
  | { type: 'demo:next' }
  /** Pick a different output format. */
  | { type: 'format:pick'; f: Format }
  /** Switch the transcript/intent surface. */
  | { type: 'fmtView:set'; v: FormatView }
  /** Approve the pending tool call at the given index. */
  | { type: 'tool:approve'; idx: number }
  /** Deny (remove) the tool call at the given index. */
  | { type: 'tool:deny'; idx: number }
  /** Change where the current sample is routed. */
  | { type: 'route:set'; v: RouteTarget }
  /** Commit the current sample (paste & save) — resets state. */
  | { type: 'commit' }
  /** App-level navigation to another view. */
  | { type: 'nav:go'; v: string };

/* ─── Dispatch ────────────────────────────────────────────────────
 * The dispatch function passed down to the views. */
export type Dispatch = (action: CaptureAction) => void;

/* ─── initialCapture ──────────────────────────────────────────────
 * The reducer's initial state, verbatim from studio-app.jsx. */
export const initialCapture: CaptureState = {
  phase: 'idle',
  elapsed: 0,
  current: null,
  selectedFormat: null,
  formatView: 'inline',
  demoIdx: 0,
};
