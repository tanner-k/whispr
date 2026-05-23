/**
 * Feedback.tsx — recording/loading affordances: `Waveform`, `RecDot`
 * and `Spinner`.
 *
 * Faithful port of the corresponding components in
 * design-reference/project/studio-components.jsx. Animations are wired
 * to the keyframes (`waveBar`, `blinkDot`, `spin`) defined in
 * `index.css`.
 */
import { useMemo } from 'react';
import type { CSSProperties } from 'react';

/** Props for {@link Waveform}. */
export interface WaveformProps {
  /** When true, bars animate (recording state). Defaults to `false`. */
  active?: boolean;
  /** Explicit bar heights (0–1). When omitted, deterministic heights are generated. */
  amplitudes?: number[];
  /** Container height in pixels. Defaults to `44`. */
  height?: number;
  /** Bar color. Defaults to `'var(--accent)'`. */
  color?: string;
  /** Number of generated bars when `amplitudes` is omitted. Defaults to `64`. */
  barCount?: number;
  /** Renders bars dimmed (uses the border-highlight color). */
  dim?: boolean;
}

/** An animated (recording) or static (from `amplitudes`) bar waveform. */
export function Waveform({
  active = false,
  amplitudes,
  height = 44,
  color = 'var(--accent)',
  barCount = 64,
  dim = false,
}: WaveformProps) {
  // Use stable seed so wave bars don't reshuffle each render.
  const bars = useMemo<number[]>(() => {
    if (amplitudes) return amplitudes;
    // pseudo-random heights, deterministic
    return Array.from({ length: barCount }, (_, i) => {
      const s = Math.sin(i * 0.4) * 0.4 + Math.sin(i * 0.13) * 0.35 + Math.cos(i * 0.27) * 0.25;
      return Math.max(0.18, Math.abs(s) * 0.9 + 0.1);
    });
  }, [amplitudes, barCount]);
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        height,
        width: '100%',
      }}
    >
      {bars.map((h, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            maxWidth: 4,
            height: `${h * 100}%`,
            background: dim ? 'var(--border-hi)' : color,
            borderRadius: 2,
            transformOrigin: 'center',
            animation: active
              ? `waveBar ${0.6 + (i % 9) * 0.06}s ease-in-out ${(i % 17) * 0.04}s infinite`
              : 'none',
            opacity: active ? 0.9 : dim ? 0.65 : 1,
          }}
        />
      ))}
    </div>
  );
}

/** Props for {@link RecDot}. */
export interface RecDotProps {
  /** Diameter in pixels. Defaults to `8`. */
  size?: number;
  /** Style overrides merged onto the base style. */
  style?: CSSProperties;
}

/** A pulsing recording-indicator dot. */
export function RecDot({ size = 8, style }: RecDotProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: 99,
        background: 'var(--accent)',
        boxShadow: '0 0 8px rgba(255,122,61,.7)',
        animation: 'blinkDot 1.1s infinite',
        ...style,
      }}
    />
  );
}

/** Props for {@link Spinner}. */
export interface SpinnerProps {
  /** Width & height in pixels. Defaults to `14`. */
  size?: number;
}

/** A spinning loading indicator. */
export function Spinner({ size = 14 }: SpinnerProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={{ animation: 'spin 0.9s linear infinite' }}
    >
      <circle cx="12" cy="12" r="9" stroke="var(--border-hi)" strokeWidth="2.4" fill="none" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="var(--accent)"
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
