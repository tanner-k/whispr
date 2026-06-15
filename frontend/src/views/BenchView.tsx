/**
 * BenchView.tsx — the Bench view: an A/B lab comparing
 * insanely-fast-whisper against Apple Speech over the bench corpus.
 *
 * Faithful port of `BenchView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * / `useEffect` replace the prototype's aliased `vUseState`.
 *
 * Data is loaded from the backend on mount via optional injectable
 * props (`loadSamples` / `loadStats`) — mirroring the
 * `transcribeAudio` pattern in CaptureView. The running app uses the
 * live API by default; tests inject fixtures.
 */
import { useEffect, useState } from 'react';
import { getBenchStats, listBenchSamples } from '../api/client';
import { Btn, Chip, Icon, SectionHeader } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import type { BenchSample, BenchStats as ApiBenchStats } from '../types';
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

/** Derives panel-local BenchStats from the API BenchStats shape. */
function toPanelStats(api: ApiBenchStats): BenchStats {
  return {
    ifwWer: api.ifwWer.toFixed(2),
    appleWer: api.appleWer.toFixed(2),
    ifwMs: Math.round(api.ifwMs),
    appleMs: Math.round(api.appleMs),
  };
}

/** Derives panel-local BenchStats from raw samples (fallback). */
function statsFromSamples(samples: BenchSample[]): BenchStats {
  if (samples.length === 0) {
    return { ifwWer: '0.00', appleWer: '0.00', ifwMs: 0, appleMs: 0 };
  }
  const avg = (arr: number[]): number => arr.reduce((a, b) => a + b, 0) / arr.length;
  return {
    ifwWer: avg(samples.map((s) => s.ifwWer)).toFixed(2),
    appleWer: avg(samples.map((s) => s.appleWer)).toFixed(2),
    ifwMs: Math.round(avg(samples.map((s) => s.ifwMs))),
    appleMs: Math.round(avg(samples.map((s) => s.appleMs))),
  };
}

/** Props for {@link BenchView}. */
export interface BenchViewProps {
  /** The current capture state. Unused by the view today, kept for
   * parity with the prototype's prop signature (App passes it). */
  state: CaptureState;
  /** Action dispatcher. Unused by the view today, kept for parity. */
  dispatch: Dispatch;
  /** Injectable samples loader — defaults to `listBenchSamples`. */
  loadSamples?: () => Promise<BenchSample[]>;
  /** Injectable stats loader — defaults to `getBenchStats`. */
  loadStats?: () => Promise<ApiBenchStats>;
}

/** The Bench view — tabbed A/B lab over the bench corpus. */
export function BenchView({
  state: _state,
  dispatch: _dispatch,
  loadSamples = listBenchSamples,
  loadStats = getBenchStats,
}: BenchViewProps) {
  const [tab, setTab] = useState<BenchTab>('diff');
  const [sel, setSel] = useState('b1');

  const [samples, setSamples] = useState<BenchSample[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [samplesError, setSamplesError] = useState<string | null>(null);

  const [stats, setStats] = useState<BenchStats | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    setSamplesLoading(true);
    setSamplesError(null);

    void loadSamples()
      .then((data) => {
        if (!cancelled) {
          setSamples(data);
          setSamplesLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load samples';
          setSamplesError(msg);
          setSamplesLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadSamples]);

  useEffect(() => {
    let cancelled = false;

    setStatsError(null);

    void loadStats()
      .then((data) => {
        if (!cancelled) {
          setStats(toPanelStats(data));
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'Failed to load stats';
          setStatsError(msg);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [loadStats]);

  // Use backend stats when available; fall back to computing from loaded samples.
  const panelStats: BenchStats = stats ?? statsFromSamples(samples);

  const sample = samples.find((s) => s.id === sel) ?? samples[0];

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
          {statsError ? (
            <span style={{ color: 'var(--warning)' }}>Stats unavailable</span>
          ) : (
            <>
              <span style={{ color: 'var(--success)' }}>IFW {panelStats.ifwWer}% WER</span>
              <span>vs</span>
              <span style={{ color: 'var(--success)' }}>Apple {panelStats.appleWer}% WER</span>
            </>
          )}
        </div>
      </div>

      {tab === 'diff' && (
        <>
          {samplesError && (
            <div
              style={{
                marginBottom: 14,
                padding: '10px 14px',
                background: 'rgba(232,92,92,.08)',
                border: '1px solid rgba(232,92,92,.25)',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                color: 'var(--warning)',
              }}
            >
              Could not load samples: {samplesError}
            </div>
          )}
          {samplesLoading && (
            <div style={{ color: 'var(--text-mute)', fontSize: 13, padding: '12px 0' }}>
              Loading samples…
            </div>
          )}
          {!samplesLoading && !samplesError && samples.length === 0 && (
            <div style={{ color: 'var(--text-mute)', fontSize: 13, padding: '12px 0' }}>
              No samples found.
            </div>
          )}
          {!samplesLoading && sample && (
            <BenchDiff samples={samples} sel={sel} setSel={setSel} sample={sample} />
          )}
        </>
      )}
      {tab === 'lead' && <BenchLeaderboard stats={panelStats} />}
      {tab === 'grid' && (
        <>
          {samplesLoading && (
            <div style={{ color: 'var(--text-mute)', fontSize: 13, padding: '12px 0' }}>
              Loading samples…
            </div>
          )}
          {samplesError && (
            <div
              style={{
                padding: '10px 14px',
                background: 'rgba(232,92,92,.08)',
                border: '1px solid rgba(232,92,92,.25)',
                borderRadius: 'var(--r-md)',
                fontSize: 13,
                color: 'var(--warning)',
              }}
            >
              Could not load samples: {samplesError}
            </div>
          )}
          {!samplesLoading && !samplesError && samples.length === 0 && (
            <div style={{ color: 'var(--text-mute)', fontSize: 13, padding: '12px 0' }}>
              No samples found.
            </div>
          )}
          {!samplesLoading && samples.length > 0 && <BenchGrid samples={samples} />}
        </>
      )}
      {tab === 'blind' && <BenchBlind />}
    </div>
  );
}
