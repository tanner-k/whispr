/**
 * HistoryView.tsx — the History view: searchable transcript list plus
 * a detail pane.
 *
 * Faithful port of `HistoryView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * replaces the prototype's aliased `vUseState`.
 */
import { useState } from 'react';
import { Btn, Empty, FormatChip, Icon } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import { HISTORY_ITEMS } from './historyData';
import { HistoryDetail } from './HistoryDetail';

/** A list-filter chip. */
type HistoryFilter = 'all' | 'today' | 'starred';

/** The filter chip definitions, in display order. */
const FILTERS: ReadonlyArray<{ id: HistoryFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'today', label: 'Today' },
  { id: 'starred', label: 'Corpus ★' },
];

/** Props for {@link HistoryView}. */
export interface HistoryViewProps {
  /** The current capture state. Unused by the view today, but kept
   * for parity with the prototype's prop signature (App passes it). */
  state: CaptureState;
  /** Action dispatcher. Unused by the view today, kept for parity. */
  dispatch: Dispatch;
}

/** The History view — transcript list on the left, detail on the right. */
export function HistoryView({ state: _state, dispatch: _dispatch }: HistoryViewProps) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<HistoryFilter>('all');
  const [sel, setSel] = useState('h1');

  const items = HISTORY_ITEMS.filter((it) => {
    if (filter === 'starred' && !it.starred) return false;
    if (filter === 'today' && !it.when.startsWith('Today')) return false;
    if (q && !(it.title.toLowerCase() + it.preview.toLowerCase()).includes(q.toLowerCase()))
      return false;
    return true;
  });
  const selected = HISTORY_ITEMS.find((i) => i.id === sel) || items[0];

  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '380px 1fr' }}>
      <div
        style={{
          borderRight: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
        }}
      >
        <div style={{ padding: '18px 18px 12px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 10 }}>History</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '6px 10px',
            }}
          >
            <Icon.search size={13} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search transcripts…"
              style={{ flex: 1, background: 'transparent' }}
            />
            {q && (
              <button type="button" onClick={() => setQ('')} style={{ color: 'var(--text-mute)' }}>
                <Icon.x size={12} />
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {FILTERS.map((f) => (
              <Btn
                key={f.id}
                size="sm"
                variant={filter === f.id ? 'subtle' : 'ghost'}
                active={filter === f.id}
                onClick={() => setFilter(f.id)}
              >
                {f.label}
              </Btn>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {items.length === 0 ? (
            <div style={{ padding: 20 }}>
              <Empty
                title="No matches"
                hint="Try a different filter or search term."
                icon={<Icon.search size={20} />}
              />
            </div>
          ) : (
            items.map((it) => (
              <button
                key={it.id}
                type="button"
                onClick={() => setSel(it.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border)',
                  background: sel === it.id ? 'var(--bg2)' : 'transparent',
                  borderLeft: '2px solid ' + (sel === it.id ? 'var(--accent)' : 'transparent'),
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 4,
                  transition: 'background .12s',
                }}
                onMouseEnter={(e) => {
                  if (sel !== it.id) e.currentTarget.style.background = 'var(--bg2)';
                }}
                onMouseLeave={(e) => {
                  if (sel !== it.id) e.currentTarget.style.background = 'transparent';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <span className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                    {it.when}
                  </span>
                  <span
                    style={{
                      color: it.starred ? 'var(--accent)' : 'var(--text-dim)',
                    }}
                  >
                    <Icon.star filled={it.starred} />
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{it.title}</span>
                  <FormatChip format={it.format} compact />
                </div>
                <div
                  style={{
                    color: 'var(--text-mute)',
                    fontSize: 12.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {it.preview}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    fontSize: 11,
                    color: 'var(--text-dim)',
                    marginTop: 2,
                  }}
                  className="mono"
                >
                  <span>{it.durationS}s</span>
                  <span>·</span>
                  <span>{(it.totalMs / 1000).toFixed(2)}s e2e</span>
                  <span>·</span>
                  <span>→ {it.route}</span>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      <div style={{ padding: '28px 32px', overflowY: 'auto' }}>
        {selected && <HistoryDetail item={selected} />}
      </div>
    </div>
  );
}
