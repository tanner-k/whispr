/**
 * state/capture.ts — capture-state machine types.
 *
 * Derived from the `captureReducer` in
 * design-reference/project/studio-app.jsx. The reducer drives the
 * Capture and History views through the recording lifecycle:
 * `idle → recording → transcribing → ready`.
 *
 * This module defines the reducer contract shared by the App shell and
 * tests. App injects the demo sample list so the state machine stays
 * deterministic while cycling through prototype captures.
 */
import type { Reducer } from 'react';
import type { Format, RouteTarget, Sample } from '../types';

/* ─── Phase ───────────────────────────────────────────────────────
 * The recording lifecycle stage. */
export type CapturePhase = 'idle' | 'recording' | 'transcribing' | 'ready';

/* ─── FormatView ──────────────────────────────────────────────────
 * Which of the three transcript/intent surfaces the Capture view
 * currently shows. */
export type FormatView = 'inline' | 'split' | 'confidence';

/* ─── NavTarget ───────────────────────────────────────────────────
 * The five top-level views reachable from the nav rail. */
export type NavTarget = 'capture' | 'history' | 'bench' | 'vocab' | 'settings';

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
  | { type: 'nav:go'; v: NavTarget };

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

/* ─── reduceCapture ───────────────────────────────────────────────
 * Pure reducer body. Mirrors `captureReducer` from studio-app.jsx; the
 * sample list is supplied by the App shell and tests. */
export function reduceCapture(
  state: CaptureState,
  action: CaptureAction,
  demoSamples: readonly Sample[],
): CaptureState {
  const nextDemoIdx =
    demoSamples.length > 0 ? (state.demoIdx + 1) % demoSamples.length : state.demoIdx;

  switch (action.type) {
    case 'rec:start':
      return {
        ...state,
        phase: 'recording',
        elapsed: 0,
        current: null,
        selectedFormat: null,
      };
    case 'rec:tick':
      return { ...state, elapsed: state.elapsed + 0.1 };
    case 'rec:stop':
      return { ...state, phase: 'transcribing' };
    case 'rec:cancel':
      return { ...initialCapture, demoIdx: state.demoIdx };
    case 'rec:done': {
      const sample = action.sample || demoSamples[state.demoIdx % demoSamples.length];
      if (!sample) return state;
      return {
        ...state,
        phase: 'ready',
        current: sample,
        selectedFormat: sample.format,
        demoIdx: nextDemoIdx,
        elapsed: 0,
      };
    }
    case 'reset':
      return { ...initialCapture, demoIdx: state.demoIdx };
    case 'demo:next': {
      const sample = demoSamples[state.demoIdx % demoSamples.length];
      if (!sample) return state;
      return {
        ...state,
        phase: 'ready',
        current: sample,
        selectedFormat: sample.format,
        demoIdx: nextDemoIdx,
        elapsed: sample.duration,
      };
    }
    case 'format:pick':
      return { ...state, selectedFormat: action.f };
    case 'fmtView:set':
      return { ...state, formatView: action.v };
    case 'tool:approve': {
      if (!state.current) return state;
      const tools = state.current.tools.map((tool, index) =>
        index === action.idx
          ? { ...tool, status: 'done' as const, result: 'Created event ✓' }
          : tool,
      );
      return { ...state, current: { ...state.current, tools } };
    }
    case 'tool:deny': {
      if (!state.current) return state;
      const tools = state.current.tools.filter((_, index) => index !== action.idx);
      return { ...state, current: { ...state.current, tools } };
    }
    case 'route:set':
      if (!state.current) return state;
      return { ...state, current: { ...state.current, routedTo: action.v } };
    case 'commit':
      return { ...initialCapture, demoIdx: state.demoIdx };
    case 'nav:go':
      return state;
    default:
      return state;
  }
}

/** Creates the reducer App passes to `useReducer`. */
export function createCaptureReducer(
  demoSamples: readonly Sample[],
): Reducer<CaptureState, CaptureAction> {
  return (state, action) => reduceCapture(state, action, demoSamples);
}
