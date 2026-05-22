/**
 * ToolCardStack.tsx — the tool-call review stack for the Capture view.
 *
 * Faithful port of `ToolCardStack` and `ToolCard` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim.
 */
import type { ReactNode } from 'react';
import { Btn, Chip, Icon } from '../components';
import type { ChipTone } from '../components';
import type { ToolCall, ToolStatus } from '../types';
import type { Dispatch } from '../state/capture';

/** Chip tone per tool status. */
const TONE_BY_STATUS: Record<ToolStatus, ChipTone> = {
  pending: 'warning',
  done: 'success',
  error: 'danger',
};

/** Icon node per known tool kind. */
const ICON_FOR: Record<string, ReactNode> = {
  'calendar.create_event': <Icon.calendar size={14} />,
  'obsidian.append': <Icon.obsidian size={14} />,
  'file.write': <Icon.file size={14} />,
  'clipboard.copy': <Icon.copy size={14} />,
};

/** Status-label text per tool status. */
const STATUS_LABEL: Record<ToolStatus, string> = {
  pending: 'needs permission',
  done: 'completed',
  error: 'failed',
};

/** Props for {@link ToolCard}. */
export interface ToolCardProps {
  /** The tool call to render. */
  tool: ToolCall;
  /** Action dispatcher. */
  dispatch: Dispatch;
  /** Index of this tool within the sample's tools array. */
  idx: number;
}

/** A single tool-call card with approve/deny controls. */
export function ToolCard({ tool, dispatch, idx }: ToolCardProps) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border:
          '1px solid ' + (tool.status === 'pending' ? 'rgba(245,193,80,.4)' : 'var(--border)'),
        borderRadius: 'var(--r-lg)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-2)',
        }}
      >
        {ICON_FOR[tool.kind] || <Icon.bolt size={14} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="mono" style={{ fontSize: 13, fontWeight: 500 }}>
            {tool.kind}
          </span>
          <Chip tone={TONE_BY_STATUS[tool.status]} dot>
            {STATUS_LABEL[tool.status]}
          </Chip>
        </div>
        <div
          className="mono"
          style={{
            fontSize: 11.5,
            color: 'var(--text-mute)',
            marginTop: 3,
            lineHeight: 1.5,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {Object.entries(tool.args).map(([k, v]) => (
            <span key={k} style={{ marginRight: 10 }}>
              <span style={{ color: 'var(--text-dim)' }}>{k}=</span>
              <span>{JSON.stringify(v)}</span>
            </span>
          ))}
        </div>
        {tool.result && (
          <div style={{ fontSize: 12, color: 'var(--success)', marginTop: 3 }}>→ {tool.result}</div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {tool.status === 'pending' && (
          <>
            <Btn size="sm" variant="ghost" onClick={() => dispatch({ type: 'tool:deny', idx })}>
              Deny
            </Btn>
            <Btn
              size="sm"
              variant="primary"
              onClick={() => dispatch({ type: 'tool:approve', idx })}
            >
              Allow
            </Btn>
          </>
        )}
        {tool.status === 'done' && (
          <Btn size="sm" variant="ghost" icon={<Icon.undo size={12} />}>
            Undo
          </Btn>
        )}
      </div>
    </div>
  );
}

/** Props for {@link ToolCardStack}. */
export interface ToolCardStackProps {
  /** The tool calls to render. */
  tools: ToolCall[];
  /** Action dispatcher. */
  dispatch: Dispatch;
}

/** A vertical stack of {@link ToolCard}s. */
export function ToolCardStack({ tools, dispatch }: ToolCardStackProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {tools.map((t, i) => (
        <ToolCard key={i} tool={t} dispatch={dispatch} idx={i} />
      ))}
    </div>
  );
}
