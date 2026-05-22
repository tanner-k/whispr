/**
 * VocabView.tsx — the Vocabulary view: the list of trigger phrases the
 * parser listens for, plus an inline add-phrase form.
 *
 * Faithful port of `VocabView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * replaces the prototype's aliased `vUseState`.
 */
import { useState } from 'react';
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
import { VOCAB_INITIAL } from './vocabData';

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
}

/** The Vocabulary view — phrase table plus inline add-phrase form. */
export function VocabView({ state: _state, dispatch: _dispatch }: VocabViewProps) {
  const [items, setItems] = useState<VocabItem[]>(VOCAB_INITIAL);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<VocabDraft>(EMPTY_DRAFT);

  const formatOpts = Object.keys(FORMAT_META);

  function add() {
    if (!draft.phrase.trim()) return;
    setItems((arr) => [
      ...arr,
      {
        id: Date.now(),
        phrase: draft.phrase.trim(),
        target: { type: draft.type, value: draft.value },
        builtin: false,
        hits: 0,
      },
    ]);
    setDraft(EMPTY_DRAFT);
    setAdding(false);
  }
  function remove(id: number) {
    setItems((arr) => arr.filter((i) => i.id !== id));
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
                if (e.key === 'Enter') add();
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
            <Btn variant="primary" onClick={add} kbd="↵">
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
                      onClick={() => remove(it.id)}
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
