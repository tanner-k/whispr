/**
 * CaptureCard.tsx — the big capture card at the top of the Capture view.
 *
 * Faithful port of `CaptureCard` from
 * design-reference/project/studio-views.jsx. Renders the idle /
 * recording / transcribing / ready states of the mic control. Inline
 * styles and `var(--…)` theme references are preserved verbatim.
 */
import { Btn, Kbd, FormatChip, Icon, Waveform, RecDot, Spinner } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import { formatTime } from './formatTime';

/** Props for {@link CaptureCard}. */
export interface CaptureCardProps {
  /** The current capture state. */
  state: CaptureState;
  /** Action dispatcher. */
  dispatch: Dispatch;
}

/** The primary capture card — mic button plus phase-dependent status. */
export function CaptureCard({ state, dispatch }: CaptureCardProps) {
  const recording = state.phase === 'recording';
  const transcribing = state.phase === 'transcribing';
  const ready = state.phase === 'ready';
  const idle = state.phase === 'idle';

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-xl)',
        padding: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 24,
        boxShadow: 'var(--shadow-1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* subtle glow when recording */}
      {recording && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: 'radial-gradient(ellipse at center, rgba(255,122,61,.07), transparent 60%)',
          }}
        />
      )}

      <button
        type="button"
        onClick={() => {
          if (idle) dispatch({ type: 'rec:start' });
          else if (recording) dispatch({ type: 'rec:stop' });
          else if (ready) dispatch({ type: 'reset' });
        }}
        style={{
          width: 78,
          height: 78,
          borderRadius: 99,
          background: recording ? 'var(--accent)' : ready ? 'var(--bg3)' : 'var(--bg2)',
          border: '1px solid ' + (recording ? 'var(--accent)' : 'var(--border-hi)'),
          color: recording ? '#1a0f08' : 'var(--text)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all .2s',
          flexShrink: 0,
          animation: recording ? 'pulse 1.6s infinite' : 'none',
        }}
        title={recording ? 'Stop recording' : 'Start recording'}
        disabled={transcribing}
      >
        {recording ? (
          <Icon.pause size={28} />
        ) : transcribing ? (
          <Spinner size={28} />
        ) : (
          <Icon.mic size={28} sw={1.8} />
        )}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        {idle && (
          <>
            <div style={{ fontSize: 18, fontWeight: 500 }}>Ready when you are.</div>
            <div
              style={{
                color: 'var(--text-mute)',
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ whiteSpace: 'nowrap' }}>Click the mic, or hold</span>
              <Kbd>⌥</Kbd>
              <Kbd>Space</Kbd>
              <span style={{ whiteSpace: 'nowrap' }}>anywhere.</span>
            </div>
          </>
        )}
        {recording && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <RecDot />
              <span style={{ fontWeight: 500 }}>Recording</span>
              <span className="mono" style={{ color: 'var(--text-mute)' }}>
                {formatTime(state.elapsed)}
              </span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-mute)' }}>
                insanely-fast-whisper · large-v3
              </span>
            </div>
            <Waveform active={true} height={42} />
          </>
        )}
        {transcribing && (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Transcribing
              <span className="caret"></span>
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                marginTop: 8,
                color: 'var(--text-mute)',
                fontSize: 12,
              }}
            >
              <span>insanely-fast-whisper · {state.elapsed.toFixed(1)}s audio</span>
              <span>·</span>
              <span>Gemma cleanup queued</span>
            </div>
          </>
        )}
        {ready && state.current && (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <FormatChip
                format={state.selectedFormat || state.current.format}
                confidence={state.current.confidence}
              />
              <span style={{ color: 'var(--text)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {state.current.title}
              </span>
              <span
                className="mono"
                style={{ color: 'var(--text-mute)', fontSize: 12, whiteSpace: 'nowrap' }}
              >
                {formatTime(state.current.duration)} ·{' '}
                {((state.current.sttMs + state.current.llmMs) / 1000).toFixed(2)}s end-to-end
              </span>
            </div>
            <div style={{ color: 'var(--text-mute)', marginTop: 6, fontSize: 13 }}>
              Ready to send. Routing →{' '}
              <strong style={{ color: 'var(--text)', fontWeight: 500 }}>
                {state.current.routedTo}
              </strong>
              .
            </div>
          </>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          alignItems: 'flex-end',
        }}
      >
        {(idle || ready) && (
          <Btn
            variant="ghost"
            size="sm"
            kbd="⌥B"
            onClick={() => dispatch({ type: 'nav:go', v: 'bench' })}
          >
            Bench →
          </Btn>
        )}
        {recording && (
          <Btn variant="ghost" size="sm" kbd="esc" onClick={() => dispatch({ type: 'rec:cancel' })}>
            Cancel
          </Btn>
        )}
        {ready && (
          <Btn
            variant="primary"
            size="md"
            kbd="↵"
            icon={<Icon.paste size={14} />}
            onClick={() => dispatch({ type: 'commit' })}
          >
            Paste & save
          </Btn>
        )}
      </div>
    </div>
  );
}
