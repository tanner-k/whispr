/**
 * formatTime.ts — duration formatting helper.
 *
 * Ported verbatim from `formatTime` in
 * design-reference/project/studio-views.jsx.
 */

/** Formats a number of seconds as `m:ss`, e.g. `formatTime(74)` → `'1:14'`. */
export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${String(sec).padStart(2, '0')}`;
}
