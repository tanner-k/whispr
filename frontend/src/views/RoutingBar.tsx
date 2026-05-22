/**
 * RoutingBar.tsx — the "Send to" routing selector for the Capture view.
 *
 * Faithful port of `RoutingBar` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim.
 */
import type { ReactNode } from 'react';
import { Btn, Icon } from '../components';
import type { RouteTarget, Sample } from '../types';
import type { Dispatch } from '../state/capture';

/** A single routing target. */
interface RoutingTarget {
  id: RouteTarget;
  label: string;
  icon: ReactNode;
}

/** The available routing targets, in display order. */
const TARGETS: RoutingTarget[] = [
  { id: 'clipboard', label: 'Clipboard', icon: <Icon.copy size={14} /> },
  { id: 'paste', label: 'Paste at cursor', icon: <Icon.paste size={14} /> },
  { id: 'file', label: 'File (.md)', icon: <Icon.file size={14} /> },
  { id: 'obsidian', label: 'Obsidian', icon: <Icon.obsidian size={14} /> },
  { id: 'calendar', label: 'Calendar', icon: <Icon.calendar size={14} /> },
];

/** Props for {@link RoutingBar}. */
export interface RoutingBarProps {
  /** The capture result being routed. */
  sample: Sample;
  /** Action dispatcher. */
  dispatch: Dispatch;
}

/** A horizontal bar of routing-target buttons. */
export function RoutingBar({ sample, dispatch }: RoutingBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        gap: 8,
        padding: 10,
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text-mute)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          marginRight: 6,
          whiteSpace: 'nowrap',
        }}
      >
        Send to
      </span>
      {TARGETS.map((t) => {
        const active = sample.routedTo === t.id;
        return (
          <Btn
            key={t.id}
            size="sm"
            icon={t.icon}
            active={active}
            onClick={() => dispatch({ type: 'route:set', v: t.id })}
          >
            {t.label}
          </Btn>
        );
      })}
    </div>
  );
}
