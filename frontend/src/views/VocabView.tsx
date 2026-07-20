/**
 * VocabView.tsx — the Vocabulary view: the list of trigger phrases the
 * parser listens for, plus an inline add-phrase form.
 *
 * Faithful port of `VocabView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * replaces the prototype's aliased `vUseState`.
 *
 * API integration: loads vocab from the backend on mount via
 * injectable props (same pattern as CaptureView's `transcribeAudio`),
 * so the running app uses live data while tests inject fixtures.
 */
import { useEffect, useState } from 'react';
import { addVocab, deleteVocab, listVocab } from '../api/client';
import {
  Btn,
  Chip,
  FORMAT_META,
  FormatChip,
  Icon,
  Panel,
  SectionHeader,
  Segmented,
} from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import type { Format, VocabItem, VocabTargetType } from '../types';

/** The add-phrase form draft. */
interface VocabDraft {
  /** The trigger phrase being typed. */
  phrase: string;
  /** The target kind, `'format'` or `'tool'`. */
  type: VocabTargetType;
  /** The selected format key or tool id. */
  value: string;
}

/** The starting draft for a new phrase. */
const EMPTY_DRAFT: VocabDraft = { phrase: '', type: 'format', value: 'list' };

/** Tool ids selectable when adding a `tool`-targeted phrase. */
const TOOL_OPTS: ReadonlyArray<string> = [
  'clipboard.copy',
  'file.write',
  'obsidian.append',
  'calendar.create_event',
  'github.create_issue',
];

/** Props for {@link VocabView}. */
export interface VocabViewProps {
  /** The current capture state. Unused by the view today, kept for
   * parity with the prototype's prop signature (App passes it). */
  state: CaptureState;
  /** Action dispatcher. Unused by the view today, kept for parity. */
  dispatch: Dispatch;
  /** Vocab list loader, injectable for tests. Defaults to {@link listVocab}. */
  loadVocab?: () => Promise<VocabItem[]>;
  /** Phrase creator, injectable for tests. Defaults to {@link addVocab}. */
  createVocab?: (item: VocabItem) => Promise<VocabItem>;
  /** Phrase remover, injectable for tests. Defaults to {@link deleteVocab}. */
  removeVocab?: (id: number) => Promise<{ id: number }>;
}

/** The Vocabulary view — phrase table plus inline add-phrase form. */
export function VocabView({
  state: _state,
  dispatch: _dispatch,
  loadVocab = listVocab,
  createVocab = addVocab,
  removeVocab = deleteVocab,
}: VocabViewProps) {
  const [items, setItems] = useState<VocabItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<VocabDraft>(EMPTY_DRAFT);
  const [actionError, setActionError] = useState<string | null>(null);

  const formatOpts = Object.keys(FORMAT_META);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    loadVocab()
      .then((data) => {
        if (!cancelled) {
          setItems(data);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Failed to load vocabulary';
          setLoadError(message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadVocab]);

  async function add() {
    if (!draft.phrase.trim()) return;
    setActionError(null);
    const newItem: VocabItem = {
      id: Date.now(),
      phrase: draft.phrase.trim(),
      target: { type: draft.type, value: draft.value },
      builtin: false,
      hits: 0,
    };
    try {
      const created = await createVocab(newItem);
      setItems((arr) => [...arr, created]);
      setDraft(EMPTY_DRAFT);
      setAdding(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add phrase';
      setActionError(message);
    }
  }

  async function remove(id: number) {
    setActionError(null);
    try {
      await removeVocab(id);
      setItems((arr) => arr.filter((i) => i.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove phrase';
      setActionError(message);
    }
  }

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <SectionHeader
        title="Vocabulary"
        subtitle="Trigger phrases the parser listens for at the end of every transcript. Add your own — they sit alongside built-ins."
        action={
          <Btn icon={<Icon.plus size={13} />} variant="primary" onClick={() => setAdding(true)}>
            Add phrase
          </Btn>
        }
      />

      {actionError && (
        <div style={{ marginBottom: 12 }}>
          <Chip tone="danger">{actionError}</Chip>
        </div>
      )}

      {adding && (
        <div
          className="fade-up"
          style={{
            marginBottom: 16,
            background: 'var(--panel)',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--r-lg)',
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto auto auto',
              gap: 10,
              alignItems: 'center',
            }}
          >
            <input
              autoFocus
              className="field"
              placeholder='e.g. "log it as a bug"'
              value={draft.phrase}
              onChange={(e) => setDraft({ ...draft, phrase: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void add();
                if (e.key === 'Escape') setAdding(false);
              }}
            />
            <span className="mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>
              →
            </span>
            <Segmented<VocabTargetType>
              value={draft.type}
              onChange={(v) =>
                setDraft({
                  ...draft,
                  type: v,
                  value: v === 'format' ? 'list' : 'obsidian.append',
                })
              }
              options={[
                { value: 'format', label: 'Format' },
                { value: 'tool', label: 'Tool' },
              ]}
            />
            <select
              className="field"
              style={{ width: 170 }}
              value={draft.value}
              onChange={(e) => setDraft({ ...draft, value: e.target.value })}
            >
              {(draft.type === 'format' ? formatOpts : TOOL_OPTS).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10, justifyContent: 'flex-end' }}>
            <Btn variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Btn>
            <Btn variant="primary" onClick={() => void add()} kbd="↵">
              Add
            </Btn>
          </div>
        </div>
      )}

      <Panel padding={false}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              <th
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: 'var(--text-mute)',
                  fontSize: 11.5,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                Phrase
              </th>
              <th
                style={{
                  padding: '10px 14px',
                  textAlign: 'left',
                  color: 'var(--text-mute)',
                  fontSize: 11.5,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                → Maps to
              </th>
              <th
                style={{
                  padding: '10px 14px',
                  textAlign: 'right',
                  color: 'var(--text-mute)',
                  fontSize: 11.5,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                Hits
              </th>
              <th style={{ padding: '10px 14px', textAlign: 'right' }}></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '20px 14px',
                    textAlign: 'center',
                    color: 'var(--text-mute)',
                    fontSize: 13,
                  }}
                >
                  Loading…
                </td>
              </tr>
            )}
            {!loading && loadError && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '20px 14px',
                    textAlign: 'center',
                    color: 'var(--danger)',
                    fontSize: 13,
                  }}
                >
                  {loadError}
                </td>
              </tr>
            )}
            {!loading && !loadError && items.length === 0 && (
              <tr>
                <td
                  colSpan={4}
                  style={{
                    padding: '20px 14px',
                    textAlign: 'center',
                    color: 'var(--text-mute)',
                    fontSize: 13,
                  }}
                >
                  No trigger phrases yet. Add one above.
                </td>
              </tr>
            )}
            {items.map((it) => (
              <tr key={it.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="mono" style={{ color: 'var(--text)' }}>
                      {`"${it.phrase}"`}
                    </span>
                    {it.builtin && (
                      <Chip tone="neutral" style={{ fontSize: 10 }}>
                        built-in
                      </Chip>
                    )}
                  </div>
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {it.target.type === 'format' ? (
                    <FormatChip format={it.target.value as Format} compact />
                  ) : (
                    <Chip tone="blue" icon={<Icon.bolt size={11} />}>
                      <span className="mono" style={{ fontSize: 12 }}>
                        {it.target.value}
                      </span>
                    </Chip>
                  )}
                </td>
                <td
                  className="mono"
                  style={{ padding: '12px 14px', textAlign: 'right', color: 'var(--text-mute)' }}
                >
                  {it.hits}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  {!it.builtin && (
                    <Btn
                      size="sm"
                      variant="ghost"
                      icon={<Icon.trash size={12} />}
                      onClick={() => void remove(it.id)}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div
        style={{
          marginTop: 18,
          padding: 14,
          background: 'var(--bg2)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-lg)',
          display: 'flex',
          gap: 12,
          color: 'var(--text-mute)',
          fontSize: 13,
        }}
      >
        <Icon.info size={16} />
        <span>
          <strong style={{ color: 'var(--text-2)' }}>How matching works:</strong> the hybrid parser
          tries an exact regex match first (microseconds). If nothing matches, Gemma classifies the
          trailing words against the vocab list — so close paraphrases like{' '}
          <em>&quot;log this as a bug ticket&quot;</em> still hit your{' '}
          <em>&quot;file an issue&quot;</em> rule.
        </span>
      </div>
    </div>
  );
}
