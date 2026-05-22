/**
 * BenchView.tsx — the Bench view: an A/B lab comparing
 * insanely-fast-whisper against Apple Speech over the bench corpus.
 *
 * Faithful port of `BenchView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * / `useMemo` replace the prototype's aliased `vUseState` / `vUseMemo`.
 */
import { useMemo, useState } from 'react';
import { Btn, Chip, Icon, SectionHeader } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import { BENCH_SAMPLES } from './benchData';
import { BenchBlind, BenchDiff, BenchGrid, BenchLeaderboard, type BenchStats } from './BenchPanels';

/** Which Bench tab is showing. */
type BenchTab = 'diff' | 'lead' | 'grid' | 'blind';

/** A Bench tab definition. */
interface BenchTabDef {
  id: BenchTab;
  label: string;
  badge: string | null;
}

/** The Bench tabs, in display order. */
const BENCH_TABS: ReadonlyArray<BenchTabDef> = [
  { id: 'diff', label: 'Diff', badge: null },
  { id: 'lead', label: 'Leaderboard', badge: null },
  { id: 'grid', label: 'Grid', badge: null },
  { id: 'blind', label: 'Blind battle', badge: 'wip' },
];

/** Props for {@link BenchView}. */
export interface BenchViewProps {
  /** The current capture state. Unused by the view today, kept for
   * parity with the prototype's prop signature (App passes it). */
  state: CaptureState;
  /** Action dispatcher. Unused by the view today, kept for parity. */
  dispatch: Dispatch;
}

/** The Bench view — tabbed A/B lab over the bench corpus. */
export function BenchView({ state: _state, dispatch: _dispatch }: BenchViewProps) {
  const [tab, setTab] = useState<BenchTab>('diff');
  const [sel, setSel] = useState('b1');
  const sample = BENCH_SAMPLES.find((s) => s.id === sel) || BENCH_SAMPLES[0];

  // Aggregate stats
  const stats = useMemo<BenchStats>(() => {
    const avg = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
    return {
      ifwWer: avg(BENCH_SAMPLES.map((s) => s.ifwWer)).toFixed(2),
      appleWer: avg(BENCH_SAMPLES.map((s) => s.appleWer)).toFixed(2),
      ifwMs: Math.round(avg(BENCH_SAMPLES.map((s) => s.ifwMs))),
      appleMs: Math.round(avg(BENCH_SAMPLES.map((s) => s.appleMs))),
    };
  }, []);

  return (
    <div style={{ padding: '24px 32px', height: '100%', overflowY: 'auto' }}>
      <SectionHeader
        title="Bench"
        subtitle="A/B lab — insanely-fast-whisper × Apple Speech, over a 24-clip corpus."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Chip tone="blue" dot>
              corpus · 24 clips
            </Chip>
            <Btn size="sm" variant="ghost" icon={<Icon.plus size={13} />}>
              Add sample
            </Btn>
            <Btn size="sm" variant="primary" icon={<Icon.play size={12} />}>
              Run full sweep
            </Btn>
          </div>
        }
      />

      <div
        style={{
          display: 'flex',
          gap: 0,
          borderBottom: '1px solid var(--border)',
          marginBottom: 20,
        }}
      >
        {BENCH_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: '10px 16px',
              color: tab === t.id ? 'var(--text)' : 'var(--text-mute)',
              borderBottom: '2px solid ' + (tab === t.id ? 'var(--accent)' : 'transparent'),
              marginBottom: -1,
              fontSize: 14,
              fontWeight: tab === t.id ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            {t.label}
            {t.badge && (
              <Chip tone="warning" style={{ fontSize: 10, padding: '1px 6px' }}>
                {t.badge}
              </Chip>
            )}
          </button>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            paddingBottom: 8,
            fontSize: 12,
            color: 'var(--text-mute)',
          }}
          className="mono"
        >
          <span>Last run: 14 min ago</span>
          <span>·</span>
          <span style={{ color: 'var(--success)' }}>IFW {stats.ifwWer}% WER</span>
          <span>vs</span>
          <span style={{ color: 'var(--success)' }}>Apple {stats.appleWer}% WER</span>
        </div>
      </div>

      {tab === 'diff' && (
        <BenchDiff samples={BENCH_SAMPLES} sel={sel} setSel={setSel} sample={sample} />
      )}
      {tab === 'lead' && <BenchLeaderboard stats={stats} />}
      {tab === 'grid' && <BenchGrid samples={BENCH_SAMPLES} />}
      {tab === 'blind' && <BenchBlind />}
    </div>
  );
}
