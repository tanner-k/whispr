/**
 * formatSurfaces.tsx — the transcript/intent surface variants and the
 * formatted-output renderer for the Capture view.
 *
 * Faithful port of `InlineChipView`, `SplitPaneView`, `ConfidenceView`
 * and `FormattedOutput` from design-reference/project/studio-views.jsx.
 * Inline styles and `var(--…)` theme references are preserved verbatim.
 */
import { FormatChip, FORMAT_META, Icon } from '../components';
import type { Format, Sample } from '../types';

/** Props for the transcript surface variants. */
export interface SurfaceProps {
  /** The capture result to render. */
  sample: Sample;
}

/* ─── Inline chip view ──────────────────────────────────────────── */

/** Trailing-command match patterns, ported verbatim from the prototype. */
const CMD_PATTERNS: RegExp[] = [
  /format (this )?as (a |an )?(markdown|md|checklist|check\s?list|list|bullet points|bullets|table|steps|email|prose).*$/i,
  /(make|create) (it |this |a |an )?(checklist|check\s?list|list|markdown|bullet points|table|todo).*$/i,
  /save (it |this )?(as|to) [^.]*$/i,
  /add (it |this )?to (my )?calendar.*$/i,
];

/** Renders the raw transcript with the trailing format command
 * highlighted inline. */
export function InlineChipView({ sample }: SurfaceProps) {
  const fullText = sample.raw;
  let cmdStart = -1;
  for (const re of CMD_PATTERNS) {
    const m = fullText.match(re);
    if (m && m.index !== undefined) {
      cmdStart = m.index;
      break;
    }
  }
  const head = cmdStart >= 0 ? fullText.slice(0, cmdStart) : fullText;
  const cmd = cmdStart >= 0 ? fullText.slice(cmdStart) : '';

  return (
    <div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-2)' }}>
        <span>{head}</span>
        {cmd && (
          <>
            <span
              style={{
                background: 'rgba(255,122,61,.12)',
                color: 'var(--accent-2)',
                borderBottom: '1px dashed var(--accent-2)',
                padding: '1px 2px',
                borderRadius: 3,
              }}
            >
              {cmd}
            </span>
            <FormatChip
              format={sample.format}
              confidence={sample.confidence}
              style={{ marginLeft: 8, verticalAlign: 'middle' }}
            />
          </>
        )}
      </div>
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px dashed var(--border)',
          fontSize: 12,
          color: 'var(--text-mute)',
          display: 'flex',
          gap: 14,
        }}
      >
        <span>
          <Icon.spark size={11} /> hybrid parser · regex matched in 0.3ms
        </span>
        <span>· content extracted, intent split off</span>
      </div>
    </div>
  );
}

/* ─── Split pane view ───────────────────────────────────────────── */

/** Renders cleaned content and parsed intent side by side. */
export function SplitPaneView({ sample }: SurfaceProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-mute)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 6,
          }}
        >
          Content
        </div>
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
            fontSize: 13.5,
            lineHeight: 1.6,
            color: 'var(--text-2)',
          }}
        >
          {sample.cleaned}
        </div>
      </div>
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-mute)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 6,
          }}
        >
          Intent
        </div>
        <div
          style={{
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)',
            padding: '10px 12px',
          }}
        >
          {/* Label strings keep their trailing spaces (verbatim from the
              prototype) so the monospace column of values stays aligned;
              `{'…'}` expressions preserve them through Prettier. */}
          <div className="mono" style={{ fontSize: 12.5, lineHeight: 1.9 }}>
            <div>
              <span style={{ color: 'var(--text-mute)' }}>{'format '}</span>
              <span style={{ color: 'var(--accent-2)' }}>{sample.format}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-mute)' }}>{'title  '}</span>
              <span style={{ color: 'var(--text)' }}>&quot;{sample.title}&quot;</span>
            </div>
            {sample.tools.length > 0 && (
              <div>
                <span style={{ color: 'var(--text-mute)' }}>{'tool   '}</span>
                <span style={{ color: 'var(--blue)' }}>{sample.tools[0].kind}</span>
              </div>
            )}
            <div>
              <span style={{ color: 'var(--text-mute)' }}>{'route  '}</span>
              <span style={{ color: 'var(--success)' }}>{sample.routedTo}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-mute)' }}>{'conf   '}</span>
              <span>{sample.confidence.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Confidence view ───────────────────────────────────────────── */

/** Props for {@link ConfidenceView}. */
export interface ConfidenceViewProps {
  /** The capture result to render. */
  sample: Sample;
  /** The currently selected format. */
  selected: Format;
  /** Called when the user picks a different format. */
  onPick: (format: Format) => void;
}

/** Renders ranked format alternates with confidence bars. */
export function ConfidenceView({ sample, selected, onPick }: ConfidenceViewProps) {
  return (
    <div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-2)',
          marginBottom: 14,
          lineHeight: 1.6,
        }}
      >
        {sample.cleaned}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {sample.alternates.map((a) => {
          const sel = selected === a.format;
          const m = FORMAT_META[a.format];
          return (
            <button
              key={a.format}
              type="button"
              onClick={() => onPick(a.format)}
              style={{
                display: 'grid',
                gridTemplateColumns: '140px 1fr 56px',
                gap: 12,
                alignItems: 'center',
                padding: '8px 10px',
                background: sel ? 'var(--bg3)' : 'transparent',
                border: '1px solid ' + (sel ? 'var(--border-hi)' : 'var(--border)'),
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all .12s',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="mono"
                  style={{ color: 'var(--text-mute)', width: 14, textAlign: 'center' }}
                >
                  {m.icon}
                </span>
                <span style={{ fontWeight: sel ? 600 : 500 }}>{m.label}</span>
              </span>
              <div
                style={{
                  height: 6,
                  borderRadius: 99,
                  background: 'var(--bg3)',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: `${a.confidence * 100}%`,
                    background: sel ? 'var(--accent)' : 'var(--border-hi)',
                  }}
                />
              </div>
              <span
                className="mono"
                style={{ textAlign: 'right', color: 'var(--text-2)', fontSize: 13 }}
              >
                {a.confidence.toFixed(2)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Formatted output ──────────────────────────────────────────── */

/** Props for {@link FormattedOutput}. */
export interface FormattedOutputProps {
  /** The capture result whose formatted text is rendered. */
  sample: Sample;
  /** The currently selected format. */
  selected: Format;
}

/** Renders the formatted output for the selected format. */
export function FormattedOutput({ sample, selected }: FormattedOutputProps) {
  const fmt = selected;
  const keys = Object.keys(sample.formatted) as Format[];
  const content = sample.formatted[fmt] || sample.formatted[keys[0]];
  const mono = fmt === 'markdown' || fmt === 'list' || fmt === 'check' || fmt === 'steps';
  return (
    <div
      style={{
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '14px 16px',
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
        fontSize: 13.5,
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
        color: 'var(--text)',
      }}
    >
      {content}
    </div>
  );
}
