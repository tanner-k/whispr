/**
 * Chip.tsx — pill/badge (`Chip`), the format metadata map (`FORMAT_META`)
 * and the format-specialized chip (`FormatChip`).
 *
 * Faithful port of the corresponding components in
 * design-reference/project/studio-components.jsx. `FORMAT_META` is
 * typed against the {@link Format} union from `../types`.
 */
import type { CSSProperties, ReactNode } from 'react';
import type { Format } from '../types';

/** Chip color tone. */
export type ChipTone = 'neutral' | 'accent' | 'success' | 'warning' | 'danger' | 'blue';

/** Resolved color triple for a tone. */
interface ToneColors {
  /** Background. */
  bg: string;
  /** Foreground (text & dot). */
  fg: string;
  /** Border. */
  bd: string;
}

/** Props for {@link Chip}. */
export interface ChipProps {
  /** Chip content. */
  children?: ReactNode;
  /** Color tone. Defaults to `'neutral'`. */
  tone?: ChipTone;
  /** Leading icon node. */
  icon?: ReactNode;
  /** Style overrides merged onto the base style. */
  style?: CSSProperties;
  /** Renders a small leading status dot in the tone color. */
  dot?: boolean;
  /** Click handler. When set, the chip shows a pointer cursor. */
  onClick?: () => void;
}

const TONES: Record<ChipTone, ToneColors> = {
  neutral: { bg: 'var(--bg3)', fg: 'var(--text-2)', bd: 'var(--border)' },
  accent: { bg: 'rgba(255,122,61,.12)', fg: 'var(--accent-2)', bd: 'rgba(255,122,61,.25)' },
  success: { bg: 'rgba(92,199,138,.10)', fg: 'var(--success)', bd: 'rgba(92,199,138,.25)' },
  warning: { bg: 'rgba(245,193,80,.10)', fg: 'var(--warning)', bd: 'rgba(245,193,80,.25)' },
  danger: { bg: 'rgba(232,92,92,.10)', fg: 'var(--danger)', bd: 'rgba(232,92,92,.25)' },
  blue: { bg: 'rgba(122,174,255,.10)', fg: 'var(--blue)', bd: 'rgba(122,174,255,.25)' },
};

/** A pill/badge with tone, optional icon and status dot. */
export function Chip({ children, tone = 'neutral', icon, style, dot, onClick }: ChipProps) {
  const t = TONES[tone] || TONES.neutral;
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        background: t.bg,
        color: t.fg,
        border: `1px solid ${t.bd}`,
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 99,
            background: t.fg,
            display: 'inline-block',
          }}
        />
      )}
      {icon}
      {children}
    </span>
  );
}

/** Display metadata for a {@link Format}. */
export interface FormatMeta {
  /** Human-readable label. */
  label: string;
  /** Single-glyph icon. */
  icon: string;
  /** Chip tone used to render the format. */
  tone: ChipTone;
}

/** Per-format display metadata. Keyed by every member of {@link Format}. */
// Co-located with FormatChip by design (see T3 file-grouping spec); it is a
// data table, not a component, so Fast Refresh's component-only rule is moot.
// eslint-disable-next-line react-refresh/only-export-components
export const FORMAT_META: Record<Format, FormatMeta> = {
  prose: { label: 'Prose', icon: '¶', tone: 'neutral' },
  markdown: { label: 'Markdown', icon: '#', tone: 'blue' },
  list: { label: 'List', icon: '•', tone: 'accent' },
  check: { label: 'Checklist', icon: '☐', tone: 'success' },
  steps: { label: 'Steps', icon: '1.', tone: 'warning' },
  table: { label: 'Table', icon: '⊞', tone: 'neutral' },
  email: { label: 'Email', icon: '✉', tone: 'blue' },
  calendar: { label: 'Calendar', icon: '📅', tone: 'accent' },
};

/** Props for {@link FormatChip}. */
export interface FormatChipProps {
  /** The format to display. */
  format: Format;
  /** Optional parser confidence (0–1). Rendered as a percentage. */
  confidence?: number;
  /** Style overrides forwarded to the underlying {@link Chip}. */
  style?: CSSProperties;
  /** Click handler forwarded to the underlying {@link Chip}. */
  onClick?: () => void;
  /** When true, suppresses the confidence percentage. */
  compact?: boolean;
}

/** A {@link Chip} specialized for a {@link Format}, using {@link FORMAT_META}. */
export function FormatChip({ format, confidence, style, onClick, compact }: FormatChipProps) {
  const m = FORMAT_META[format] || FORMAT_META.prose;
  return (
    <Chip tone={m.tone} onClick={onClick} style={style}>
      <span className="mono" style={{ opacity: 0.8, fontWeight: 600, fontSize: 11 }}>
        {m.icon}
      </span>
      <span style={{ fontWeight: 600 }}>{m.label}</span>
      {!compact && confidence !== undefined && (
        <span className="mono" style={{ opacity: 0.6, fontSize: 11, marginLeft: 2 }}>
          {Math.round(confidence * 100)}%
        </span>
      )}
    </Chip>
  );
}
