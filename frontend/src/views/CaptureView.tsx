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
import { Btn, Chip, Icon, Panel, SectionHeader, Segmented } from '../components';
import type { CaptureState, Dispatch, FormatView } from '../state/capture';
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
}

/** The Capture view — capture card plus the ready-state pipeline. */
export function CaptureView({ state, dispatch, prefs }: CaptureViewProps) {
  const sample = state.current;
  const fmtView = state.formatView || 'inline';

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
              onClick={() => dispatch({ type: 'demo:next' })}
            >
              Run demo
            </Btn>
          </div>
        }
      />

      {/* Big capture card */}
      <CaptureCard state={state} dispatch={dispatch} />

      {state.phase === 'ready' && sample && (
        <div className="fade-up" style={{ marginTop: 20 }}>
          {/* Transcript + format pipeline */}
          <Panel
            title="Transcript & intent"
            action={
              <Segmented
                size="sm"
                value={fmtView}
                onChange={(v) => dispatch({ type: 'fmtView:set', v })}
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
                onPick={(f) => dispatch({ type: 'format:pick', f })}
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
              <ToolCardStack tools={sample.tools} dispatch={dispatch} />
            </div>
          )}

          {/* Routing bar */}
          <div style={{ marginTop: 14 }}>
            <RoutingBar sample={sample} dispatch={dispatch} />
          </div>
        </div>
      )}
    </div>
  );
}
