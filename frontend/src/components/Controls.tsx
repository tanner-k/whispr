/**
 * Controls.tsx — interactive toggles: `Segmented` control and `Switch`.
 *
 * Faithful port of the corresponding components in
 * design-reference/project/studio-components.jsx. `Segmented` is
 * generic over its option value type so callers stay type-safe.
 */
import type { CSSProperties, ReactNode } from 'react';

/** Tone applied to a selected segmented option. */
export type SegmentedTone = 'success' | 'warning' | 'danger';

/** A single option in a {@link Segmented} control. */
export interface SegmentedOption<V extends string = string> {
  /** Discriminating value, also used as React key. */
  value: V;
  /** Visible label. */
  label: ReactNode;
  /** Optional leading icon node. */
  icon?: ReactNode;
  /** Optional tone applied when this option is selected. */
  tone?: SegmentedTone;
}

/** Segmented control size — controls padding and font size. */
export type SegmentedSize = 'sm' | 'md';

/** Props for {@link Segmented}. */
export interface SegmentedProps<V extends string = string> {
  /** Available options. */
  options: ReadonlyArray<SegmentedOption<V>>;
  /** Currently selected value. */
  value: V;
  /** Called with the value of a newly selected option. */
  onChange: (value: V) => void;
  /** Size preset. Defaults to `'md'`. */
  size?: SegmentedSize;
  /** Style overrides merged onto the outer container. */
  style?: CSSProperties;
}

/** A segmented control — used for 2-state and 3-state toggles. */
export function Segmented<V extends string = string>({
  options,
  value,
  onChange,
  size = 'md',
  style,
}: SegmentedProps<V>) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--bg2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: 2,
        gap: 2,
        ...style,
      }}
    >
      {options.map((opt) => {
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            style={{
              padding: size === 'sm' ? '3px 8px' : '5px 12px',
              fontSize: size === 'sm' ? 12 : 13,
              fontWeight: 500,
              borderRadius: 6,
              background: sel
                ? opt.tone === 'success'
                  ? 'rgba(92,199,138,.15)'
                  : opt.tone === 'warning'
                    ? 'rgba(245,193,80,.15)'
                    : opt.tone === 'danger'
                      ? 'rgba(232,92,92,.12)'
                      : 'var(--bg3)'
                : 'transparent',
              color: sel
                ? opt.tone === 'success'
                  ? 'var(--success)'
                  : opt.tone === 'warning'
                    ? 'var(--warning)'
                    : opt.tone === 'danger'
                      ? 'var(--danger)'
                      : 'var(--text)'
                : 'var(--text-mute)',
              cursor: 'pointer',
              transition: 'all .12s',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              whiteSpace: 'nowrap',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

/** Props for {@link Switch}. */
export interface SwitchProps {
  /** Whether the switch is on. */
  on: boolean;
  /** Called with the new state when the switch is toggled. */
  onChange: (on: boolean) => void;
}

/** An on/off toggle switch. */
export function Switch({ on, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 34,
        height: 20,
        borderRadius: 99,
        background: on ? 'var(--accent)' : 'var(--bg3)',
        border: '1px solid ' + (on ? 'var(--accent)' : 'var(--border)'),
        position: 'relative',
        cursor: 'pointer',
        padding: 0,
        transition: 'all .15s',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 1,
          left: on ? 15 : 1,
          width: 16,
          height: 16,
          borderRadius: 99,
          background: on ? '#1a0f08' : 'var(--text-mute)',
          transition: 'left .15s ease',
        }}
      />
    </button>
  );
}
