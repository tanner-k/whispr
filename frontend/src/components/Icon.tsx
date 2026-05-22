/**
 * Icon.tsx — inline-SVG icon set for Whispr Studio.
 *
 * Faithful port of the `Icon` object in
 * design-reference/project/studio-components.jsx. Each icon is a
 * function component taking optional `size` (px, applied to width &
 * height) and `sw` (stroke width) props. Single-stroke line icons
 * inherit color via `currentColor`.
 */
import type { JSX } from 'react';

/** Props accepted by every icon component. */
export interface IconProps {
  /** Width & height in pixels. Each icon carries its own default. */
  size?: number;
  /** Stroke width. Only honored by icons that read it (e.g. `mic`). */
  sw?: number;
  /** Render the glyph filled (only honored by `star`). */
  filled?: boolean;
}

/** A single icon component. */
export type IconComponent = (props?: IconProps) => JSX.Element;

/** The full icon set, keyed by name. */
export type IconSet = Record<string, IconComponent>;

export const Icon: IconSet = {
  mic: (p = {}) => (
    <svg
      width={p.size || 16}
      height={p.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={p.sw || 1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  ),
  history: (p = {}) => (
    <svg
      width={p.size || 16}
      height={p.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  bench: (p = {}) => (
    <svg
      width={p.size || 16}
      height={p.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 4h18M5 4v6a7 7 0 0 0 14 0V4" />
      <path d="M9 21h6M12 17v4" />
    </svg>
  ),
  vocab: (p = {}) => (
    <svg
      width={p.size || 16}
      height={p.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 4h12a4 4 0 0 1 4 4v12" />
      <path d="M4 4v14a2 2 0 0 0 2 2h14" />
      <path d="M8 9h6M8 13h4" />
    </svg>
  ),
  settings: (p = {}) => (
    <svg
      width={p.size || 16}
      height={p.size || 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.6 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
    </svg>
  ),
  search: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  ),
  star: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill={p.filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3 2.6 5.6 6 .7-4.5 4.2 1.2 6L12 16.8 6.7 19.5 8 13.5 3.5 9.3l6-.7z" />
    </svg>
  ),
  check: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m4 12 5 5L20 6" />
    </svg>
  ),
  x: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  plus: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  copy: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  ),
  paste: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="5" width="14" height="16" rx="2" />
      <path d="M9 5V3h6v2M8 11h8M8 15h5" />
    </svg>
  ),
  file: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5" />
    </svg>
  ),
  calendar: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  ),
  obsidian: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3 4 9v10l8 2 8-2V9z" />
      <path d="M12 3v8M4 9l8 2 8-2" />
    </svg>
  ),
  undo: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M9 14 4 9l5-5" />
      <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-5" />
    </svg>
  ),
  chevR: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  chevD: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  bolt: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M13 2 4 14h7l-1 8 9-12h-7z" />
    </svg>
  ),
  trash: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  ),
  filter: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 5h18l-7 9v5l-4 2v-7z" />
    </svg>
  ),
  cpu: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="6" y="6" width="12" height="12" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M3 10h3M3 14h3M18 10h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3" />
    </svg>
  ),
  play: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4v16l14-8z" />
    </svg>
  ),
  pause: (p = {}) => (
    <svg width={p.size || 14} height={p.size || 14} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  ),
  spark: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8.4 8.4M15.6 15.6l2.8 2.8M5.6 18.4 8.4 15.6M15.6 8.4l2.8-2.8" />
    </svg>
  ),
  info: (p = {}) => (
    <svg
      width={p.size || 14}
      height={p.size || 14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01M11 12h1v5h1" />
    </svg>
  ),
};
