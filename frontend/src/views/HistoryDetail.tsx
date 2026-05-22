/**
 * HistoryDetail.tsx — the detail pane of the History view.
 *
 * Faithful port of `HistoryDetail` from
 * design-reference/project/studio-views.jsx. Looks the selected row
 * up in DEMO_SAMPLES by title to show the full transcript when one is
 * available. Inline styles and `var(--…)` theme references are
 * preserved verbatim.
 */
import { Btn, Chip, FormatChip, FORMAT_META, Icon, Panel } from '../components';
import type { HistoryItem } from '../types';
import { DEMO_SAMPLES } from './captureData';

/** Props for {@link HistoryDetail}. */
export interface HistoryDetailProps {
  /** The history row to render in detail. */
  item: HistoryItem;
}

/** The detail pane for a single history entry. */
export function HistoryDetail({ item }: HistoryDetailProps) {
  // Use a matching demo sample if one exists, else fabricate.
  const sample = DEMO_SAMPLES.find((s) => s.title === item.title) || null;
  return (
    <div className="fade-in">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
          flexWrap: 'wrap',
        }}
      >
        <FormatChip format={item.format} />
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>
          {item.when}
        </span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--text-mute)' }}>
          · {item.durationS}s · {(item.totalMs / 1000).toFixed(2)}s e2e
        </span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn size="sm" icon={<Icon.star size={13} filled={item.starred} />} variant="ghost">
            {item.starred ? 'In corpus' : 'Add to corpus'}
          </Btn>
          <Btn size="sm" icon={<Icon.copy size={13} />} variant="ghost">
            Copy
          </Btn>
          <Btn size="sm" icon={<Icon.trash size={13} />} variant="ghost" />
        </span>
      </div>
      <h2
        style={{
          fontSize: 26,
          fontWeight: 600,
          margin: '4px 0 18px',
          letterSpacing: '-.01em',
        }}
      >
        {item.title}
      </h2>

      <div style={{ display: 'grid', gap: 14 }}>
        <Panel title="Raw transcript" padding={true}>
          <div style={{ fontSize: 13.5, lineHeight: 1.65, color: 'var(--text-2)' }}>
            {sample
              ? sample.raw
              : `${item.preview} (full transcript not stored — enable in Settings › Privacy)`}
          </div>
        </Panel>
        <Panel
          title={`Formatted · ${FORMAT_META[item.format].label}`}
          padding={true}
          action={
            <Btn size="sm" icon={<Icon.copy size={12} />} variant="ghost">
              Copy
            </Btn>
          }
        >
          <div
            style={{
              background: 'var(--bg2)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              padding: '12px 14px',
              fontFamily: 'var(--font-mono)',
              fontSize: 13,
              lineHeight: 1.65,
              whiteSpace: 'pre-wrap',
            }}
          >
            {sample?.formatted?.[item.format] || `(formatted output for ${item.format})`}
          </div>
        </Panel>
        <div style={{ display: 'flex', gap: 8 }}>
          <Chip tone="success" icon={<Icon.check size={11} />}>
            Routed to {item.route}
          </Chip>
          <Chip tone="blue">Replay through bench</Chip>
        </div>
      </div>
    </div>
  );
}
