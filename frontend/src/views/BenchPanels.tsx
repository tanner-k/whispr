/**
 * BenchPanels.tsx — Bench-view sub-panels: the Diff, Leaderboard, Grid
 * and Blind-battle tabs plus the `Stat` tile and `BlindOption` card.
 *
 * Faithful port of the corresponding components in
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * / `useMemo` replace the prototype's aliased `vUseState` / `vUseMemo`.
 */
import { useMemo, useState } from 'react';
import { Btn, Chip, DiffText, Icon, Panel, Waveform, diffTokens } from '../components';
import type { BenchSample } from '../types';

/* ─── Aggregate stats ─────────────────────────────────────────────── */

/** Corpus-aggregate WER / latency figures shown across the Bench tabs. */
export interface BenchStats {
  /** Mean insanely-fast-whisper WER, fixed to 2 decimals. */
  ifwWer: string;
  /** Mean Apple Speech WER, fixed to 2 decimals. */
  appleWer: string;
  /** Mean insanely-fast-whisper latency in ms (rounded). */
  ifwMs: number;
  /** Mean Apple Speech latency in ms (rounded). */
  appleMs: number;
}

/* ─── BenchDiff ───────────────────────────────────────────────────── */

/** Props for {@link BenchDiff}. */
export interface BenchDiffProps {
  /** The full corpus, for the sample picker. */
  samples: BenchSample[];
  /** The selected sample id. */
  sel: string;
  /** Selects a sample by id. */
  setSel: (id: string) => void;
  /** The resolved selected sample. */
  sample: BenchSample;
}

/** The Diff tab — ground truth against both engines, token-diffed. */
export function BenchDiff({ samples, sel, setSel, sample }: BenchDiffProps) {
  // The prototype keys these on `sample.id`; depending on the whole
  // `sample` object is equivalent (its fields are immutable per id) and
  // keeps the dependency array exhaustive.
  const diffIfw = useMemo(() => diffTokens(sample.truth, sample.ifw), [sample]);
  const diffApple = useMemo(() => diffTokens(sample.truth, sample.apple), [sample]);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 18 }}>
      {/* sample picker */}
      <div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-mute)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginBottom: 8,
          }}
        >
          Samples
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {samples.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSel(s.id)}
              style={{
                textAlign: 'left',
                padding: '8px 10px',
                background: sel === s.id ? 'var(--bg2)' : 'transparent',
                border: '1px solid ' + (sel === s.id ? 'var(--border-hi)' : 'transparent'),
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                transition: 'all .12s',
              }}
            >
              <div
                className="mono"
                style={{ fontSize: 12.5, color: sel === s.id ? 'var(--text)' : 'var(--text-2)' }}
              >
                {s.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 2 }}>
                {s.durationS}s
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div
          style={{
            background: 'var(--panel)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <Btn size="md" variant="subtle" icon={<Icon.play size={14} />}>
            Play
          </Btn>
          <Waveform dim height={34} />
          <span
            className="mono"
            style={{ fontSize: 12, color: 'var(--text-mute)', whiteSpace: 'nowrap' }}
          >
            {sample.durationS}s
          </span>
        </div>

        <Panel title="Ground truth" padding={true}>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }}>{sample.truth}</div>
        </Panel>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Panel
            title="insanely-fast-whisper"
            action={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Chip tone={sample.ifwWer < sample.appleWer ? 'success' : 'neutral'} dot>
                  WER {sample.ifwWer}%
                </Chip>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                  {sample.ifwMs}ms
                </span>
              </div>
            }
          >
            <div style={{ fontSize: 13.5 }}>
              <DiffText tokens={diffIfw.b} />
            </div>
          </Panel>
          <Panel
            title="Apple Speech"
            action={
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Chip tone={sample.appleWer < sample.ifwWer ? 'success' : 'neutral'} dot>
                  WER {sample.appleWer}%
                </Chip>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>
                  {sample.appleMs}ms
                </span>
              </div>
            }
          >
            <div style={{ fontSize: 13.5 }}>
              <DiffText tokens={diffApple.b} />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

/* ─── Stat ────────────────────────────────────────────────────────── */

/** Tone applied to a {@link Stat} value. */
export type StatTone = 'success' | 'accent' | 'warning' | 'neutral';

/** Props for {@link Stat}. */
export interface StatProps {
  /** Eyebrow label. */
  label: string;
  /** Large value text. */
  value: string;
  /** Muted sub-caption. */
  sub: string;
  /** Value color tone. Defaults to `'neutral'`. */
  tone?: StatTone;
}

/** A single stat tile used by the Leaderboard summary row. */
export function Stat({ label, value, sub, tone = 'neutral' }: StatProps) {
  const tones: Record<StatTone, string> = {
    success: 'var(--success)',
    accent: 'var(--accent)',
    warning: 'var(--warning)',
    neutral: 'var(--text)',
  };
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '14px 16px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--text-mute)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {label}
      </div>
      <div
        className="mono"
        style={{
          fontSize: 26,
          fontWeight: 600,
          marginTop: 4,
          color: tones[tone],
          letterSpacing: '-.02em',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-mute)', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

/* ─── BenchLeaderboard ────────────────────────────────────────────── */

/** A single engine row in the Leaderboard table. */
interface LeaderboardRow {
  rank: number;
  name: string;
  wer: number;
  latency: number;
  size: string;
  local: boolean;
  badge?: string;
  highlight?: boolean;
}

/** Props for {@link BenchLeaderboard}. */
export interface BenchLeaderboardProps {
  /** Corpus-aggregate stats — fill the IFW / Apple rows. */
  stats: BenchStats;
}

/** The Leaderboard tab — summary stats and a ranked engine table. */
export function BenchLeaderboard({ stats }: BenchLeaderboardProps) {
  const rows: LeaderboardRow[] = [
    {
      rank: 1,
      name: 'Apple Speech',
      wer: Number(stats.appleWer),
      latency: stats.appleMs,
      size: 'OS',
      local: true,
      badge: 'on-device',
    },
    {
      rank: 2,
      name: 'insanely-fast-whisper',
      wer: Number(stats.ifwWer),
      latency: stats.ifwMs,
      size: '1.5GB',
      local: true,
      badge: 'fastest',
      highlight: true,
    },
    { rank: 3, name: 'whisper.cpp · large-v3', wer: 3.9, latency: 540, size: '1.5GB', local: true },
    { rank: 4, name: 'faster-whisper · large', wer: 3.3, latency: 480, size: '1.5GB', local: true },
    { rank: 5, name: 'MLX whisper · large', wer: 3.7, latency: 430, size: '1.5GB', local: true },
    {
      rank: 6,
      name: 'OpenAI Whisper (cloud)',
      wer: 1.8,
      latency: 1400,
      size: '—',
      local: false,
      badge: 'baseline',
    },
  ];
  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        <Stat label="Best WER (local)" value="2.20%" sub="Apple Speech" tone="success" />
        <Stat label="Fastest (local)" value="0.41s" sub="insanely-fast-whisper" tone="accent" />
        <Stat label="Corpus size" value="24" sub="clips · 4m 22s total" />
        <Stat label="Avg clip length" value="10.9s" sub="0.6s std dev" />
      </div>
      <Panel padding={false}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)' }}>
              {['#', 'Engine', 'WER ↓', 'Latency', 'Model', 'Local', '', '—'].map((h, i) => (
                <th
                  key={i}
                  style={{
                    textAlign: 'left',
                    padding: '10px 14px',
                    fontWeight: 600,
                    color: 'var(--text-mute)',
                    fontSize: 11.5,
                    textTransform: 'uppercase',
                    letterSpacing: '.06em',
                  }}
                >
                  {h === '—' ? '' : h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.rank}
                style={{
                  borderBottom: '1px solid var(--border)',
                  background: r.highlight ? 'rgba(255,122,61,.04)' : 'transparent',
                }}
              >
                <td style={{ padding: '12px 14px' }}>
                  <span className="mono" style={{ color: 'var(--text-mute)' }}>
                    {r.rank}
                  </span>
                </td>
                <td style={{ padding: '12px 14px', fontWeight: 500 }}>{r.name}</td>
                <td style={{ padding: '12px 14px' }} className="mono">
                  <span
                    style={{
                      color:
                        r.wer < 3 ? 'var(--success)' : r.wer < 5 ? 'var(--text)' : 'var(--warning)',
                    }}
                  >
                    {r.wer.toString().includes('.') ? r.wer : r.wer + '.00'}%
                  </span>
                </td>
                <td style={{ padding: '12px 14px' }} className="mono">
                  {r.latency}ms
                </td>
                <td style={{ padding: '12px 14px', color: 'var(--text-mute)' }} className="mono">
                  {r.size}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.local ? <Chip tone="success">local</Chip> : <Chip tone="warning">cloud</Chip>}
                </td>
                <td style={{ padding: '12px 14px' }}>
                  {r.badge && <Chip tone="accent">{r.badge}</Chip>}
                </td>
                <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                  <Btn size="sm" variant="ghost" icon={<Icon.chevR size={12} />} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

/* ─── BenchGrid ───────────────────────────────────────────────────── */

/** Props for {@link BenchGrid}. */
export interface BenchGridProps {
  /** The corpus — one row per sample. */
  samples: BenchSample[];
}

/** The Grid tab — a sample × engine WER heatmap with an average footer. */
export function BenchGrid({ samples }: BenchGridProps) {
  const engines = ['IFW', 'Apple', 'wcpp', 'faster', 'MLX', 'cloud'];
  // synthesize WER per sample × engine
  function werFor(s: BenchSample, e: string): number {
    if (e === 'IFW') return s.ifwWer;
    if (e === 'Apple') return s.appleWer;
    if (e === 'wcpp') return Math.max(0.5, s.ifwWer * 1.1 + 0.4);
    if (e === 'faster') return Math.max(0.5, s.ifwWer * 0.95);
    if (e === 'MLX') return Math.max(0.5, s.ifwWer * 1.05);
    return Math.max(0.4, s.appleWer * 0.7);
  }
  function cellColor(v: number, vs: number[]): string {
    const min = Math.min(...vs),
      max = Math.max(...vs);
    if (v === min) return 'rgba(92,199,138,.18)';
    if (v === max) return 'rgba(232,92,92,.15)';
    return 'rgba(245,193,80,.10)';
  }
  return (
    <Panel padding={false}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
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
              Sample
            </th>
            {engines.map((e) => (
              <th
                key={e}
                style={{
                  padding: '10px 14px',
                  textAlign: 'center',
                  color: 'var(--text-mute)',
                  fontSize: 11.5,
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                {e}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {samples.map((s) => {
            const vs = engines.map((e) => werFor(s, e));
            return (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 14px' }}>
                  <span className="mono" style={{ color: 'var(--text-2)' }}>
                    {s.title}
                  </span>
                </td>
                {engines.map((e, i) => (
                  <td
                    key={e}
                    className="mono"
                    style={{
                      padding: '10px 14px',
                      textAlign: 'center',
                      background: cellColor(vs[i], vs),
                    }}
                  >
                    {vs[i].toFixed(1)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)' }}>
            <td
              style={{
                padding: '10px 14px',
                fontWeight: 600,
                color: 'var(--text-mute)',
                fontSize: 12,
              }}
            >
              Avg WER
            </td>
            {engines.map((e) => {
              const avg = samples.reduce((a, s) => a + werFor(s, e), 0) / samples.length;
              return (
                <td
                  key={e}
                  className="mono"
                  style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600 }}
                >
                  {avg.toFixed(1)}
                </td>
              );
            })}
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}

/* ─── BenchBlind ──────────────────────────────────────────────────── */

/** A picked side in the blind battle, or `null` before a choice. */
type BlindPick = 'A' | 'B' | null;

/** The Blind-battle tab — pick the better of two anonymized transcripts. */
export function BenchBlind() {
  const [picked, setPicked] = useState<BlindPick>(null);
  const [round, setRound] = useState(7);
  const elo = { ifw: 1042, apple: 1058 };
  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <span className="mono" style={{ color: 'var(--text-mute)', fontSize: 12 }}>
          round {round} / 20
        </span>
        <span className="mono" style={{ color: 'var(--text-mute)', fontSize: 12 }}>
          elo so far · A {elo.ifw} · B {elo.apple}
        </span>
      </div>
      <div
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: 16,
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
        }}
      >
        <Btn size="md" variant="subtle" icon={<Icon.play size={14} />}>
          Play clip #7
        </Btn>
        <Waveform dim />
        <span className="mono" style={{ color: 'var(--text-mute)', fontSize: 12 }}>
          13.4s
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <BlindOption
          letter="A"
          selected={picked === 'A'}
          onClick={() => setPicked('A')}
          text="So I think the main thing we wanna ship by Friday is the new onboarding flow and, um, the data export feature."
        />
        <BlindOption
          letter="B"
          selected={picked === 'B'}
          onClick={() => setPicked('B')}
          text="so I think the main thing we wanna ship by Friday is the new onboarding flow and the data export feature"
        />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 18, justifyContent: 'center' }}>
        <Btn
          size="lg"
          variant={picked === 'A' ? 'primary' : 'default'}
          onClick={() => {
            setPicked('A');
            setTimeout(() => {
              setRound((r) => r + 1);
              setPicked(null);
            }, 600);
          }}
        >
          A better
        </Btn>
        <Btn
          size="lg"
          variant="subtle"
          onClick={() => {
            setRound((r) => r + 1);
            setPicked(null);
          }}
        >
          Tie
        </Btn>
        <Btn
          size="lg"
          variant={picked === 'B' ? 'primary' : 'default'}
          onClick={() => {
            setPicked('B');
            setTimeout(() => {
              setRound((r) => r + 1);
              setPicked(null);
            }, 600);
          }}
        >
          B better
        </Btn>
      </div>
    </div>
  );
}

/** Props for {@link BlindOption}. */
export interface BlindOptionProps {
  /** The option label, `'A'` or `'B'`. */
  letter: 'A' | 'B';
  /** The transcript text. */
  text: string;
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Click handler. */
  onClick: () => void;
}

/** A single anonymized transcript card in the blind battle. */
export function BlindOption({ letter, text, selected, onClick }: BlindOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        textAlign: 'left',
        padding: 16,
        background: selected ? 'var(--bg3)' : 'var(--panel)',
        border: '1px solid ' + (selected ? 'var(--accent)' : 'var(--border)'),
        borderRadius: 'var(--r-lg)',
        cursor: 'pointer',
        transition: 'all .12s',
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          color: 'var(--text-mute)',
          textTransform: 'uppercase',
          letterSpacing: '.08em',
          marginBottom: 8,
        }}
      >
        option {letter}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text)' }}>{text}</div>
    </button>
  );
}
