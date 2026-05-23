import { describe, expect, it } from 'vitest';
import { createCaptureReducer, initialCapture, type CaptureState } from './capture';
import { DEMO_SAMPLES } from '../views/captureData';

const reducer = createCaptureReducer(DEMO_SAMPLES);

function readyState(overrides: Partial<CaptureState> = {}): CaptureState {
  return {
    ...initialCapture,
    phase: 'ready',
    current: DEMO_SAMPLES[1],
    selectedFormat: DEMO_SAMPLES[1].format,
    ...overrides,
  };
}

describe('capture reducer', () => {
  it('moves through idle → recording → transcribing → ready', () => {
    let state = reducer(initialCapture, { type: 'rec:start' });
    expect(state.phase).toBe('recording');
    expect(state.elapsed).toBe(0);
    expect(state.current).toBeNull();
    expect(state.selectedFormat).toBeNull();

    state = reducer(state, { type: 'rec:tick' });
    expect(state.elapsed).toBeCloseTo(0.1);

    state = reducer(state, { type: 'rec:stop' });
    expect(state.phase).toBe('transcribing');

    state = reducer(state, { type: 'rec:done' });
    expect(state.phase).toBe('ready');
    expect(state.current).toBe(DEMO_SAMPLES[0]);
    expect(state.selectedFormat).toBe('check');
    expect(state.demoIdx).toBe(1);
    expect(state.elapsed).toBe(0);
  });

  it('cycles demo samples and preserves the next demo index across reset actions', () => {
    let state = reducer(initialCapture, { type: 'demo:next' });
    expect(state.phase).toBe('ready');
    expect(state.current).toBe(DEMO_SAMPLES[0]);
    expect(state.elapsed).toBe(DEMO_SAMPLES[0].duration);
    expect(state.demoIdx).toBe(1);

    state = reducer(state, { type: 'commit' });
    expect(state).toEqual({ ...initialCapture, demoIdx: 1 });

    state = reducer(state, { type: 'demo:next' });
    expect(state.current).toBe(DEMO_SAMPLES[1]);
    expect(state.selectedFormat).toBe('calendar');
    expect(state.demoIdx).toBe(2);

    state = reducer(state, { type: 'reset' });
    expect(state).toEqual({ ...initialCapture, demoIdx: 2 });
  });

  it('cancels recording without advancing the demo cycle', () => {
    const recording = reducer({ ...initialCapture, demoIdx: 2 }, { type: 'rec:start' });
    const cancelled = reducer(recording, { type: 'rec:cancel' });
    expect(cancelled).toEqual({ ...initialCapture, demoIdx: 2 });
  });

  it('updates selected format, format view, route, and tool decisions', () => {
    let state = readyState();
    state = reducer(state, { type: 'format:pick', f: 'markdown' });
    expect(state.selectedFormat).toBe('markdown');

    state = reducer(state, { type: 'fmtView:set', v: 'confidence' });
    expect(state.formatView).toBe('confidence');

    state = reducer(state, { type: 'route:set', v: 'clipboard' });
    expect(state.current?.routedTo).toBe('clipboard');

    state = reducer(state, { type: 'tool:approve', idx: 0 });
    expect(state.current?.tools[0]?.status).toBe('done');
    expect(state.current?.tools[0]?.result).toBe('Created event ✓');

    state = reducer(state, { type: 'tool:deny', idx: 0 });
    expect(state.current?.tools).toHaveLength(0);
  });

  it('ignores route and tool actions when there is no current sample', () => {
    expect(reducer(initialCapture, { type: 'route:set', v: 'calendar' })).toBe(initialCapture);
    expect(reducer(initialCapture, { type: 'tool:approve', idx: 0 })).toBe(initialCapture);
    expect(reducer(initialCapture, { type: 'tool:deny', idx: 0 })).toBe(initialCapture);
  });
});
