/**
 * SettingsPanels.tsx — the five Settings panels (Transcription, Model,
 * Hotkeys, Tools, Privacy) plus the shared `Field` row.
 *
 * Faithful port of the corresponding components in
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * replaces the prototype's aliased `vUseState`.
 *
 * NOTE — the Model panel's `<select>` deliberately departs from the
 * prototype: it lists quants of `unsloth/gemma-4-E4B-it-GGUF` (a GGUF
 * build run via llama.cpp), not the prototype's Gemma 3 / Qwen / Llama
 * / Phi options. This is the one intentional content change in T4b.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Chip, Icon, Kbd, Panel, SectionHeader, Segmented, Switch } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import type { PermissionLevel, ToolPermission } from '../types';

/* ─── Field ───────────────────────────────────────────────────────── */

/** Props for {@link Field}. */
export interface FieldProps {
  /** The setting label. */
  label: ReactNode;
  /** Optional muted sub-caption below the label. */
  sub?: ReactNode;
  /** The control rendered on the right. */
  children?: ReactNode;
}

/** A two-column settings row: label/sub on the left, a control on the right. */
export function Field({ label, sub, children }: FieldProps) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: 24,
        alignItems: 'center',
        padding: '14px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        {sub && (
          <div style={{ color: 'var(--text-mute)', fontSize: 12.5, marginTop: 2 }}>{sub}</div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

/* ─── SettingsTranscription ───────────────────────────────────────── */

/** The Transcription panel — STT engine configuration. */
export function SettingsTranscription() {
  return (
    <div>
      <SectionHeader
        title="Transcription"
        subtitle="STT engines used by capture, and the shadow engine running for the bench corpus."
      />
      <Field label="Primary engine" sub="Used for every capture, results go to the cursor.">
        <Chip tone="accent" dot>
          insanely-fast-whisper · large-v3
        </Chip>
      </Field>
      <Field
        label="Shadow engine"
        sub="Runs in parallel on every clip. Results feed the bench tab."
      >
        <Chip tone="blue" dot>
          Apple Speech
        </Chip>
      </Field>
      <Field label="Compute" sub="Apple Silicon Metal backend, fp16 weights.">
        <span className="mono" style={{ color: 'var(--text-2)', fontSize: 13 }}>
          Metal · fp16 · 8 threads
        </span>
      </Field>
      <Field
        label="Initial prompt"
        sub="Optional text passed to whisper as context (improves accuracy on jargon)."
      >
        <input className="field" placeholder="(none)" style={{ width: 280 }} />
      </Field>
      <Field label="Language" sub="Detected per clip, override here.">
        <select className="field" style={{ width: 140 }} defaultValue="auto">
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
        </select>
      </Field>
    </div>
  );
}

/* ─── SettingsModel ───────────────────────────────────────────────── */

/** The Model panel — the LLM that cleans transcripts and drives tools.
 *
 * The model `<select>` lists quants of `unsloth/gemma-4-E4B-it-GGUF`,
 * with `UD-Q4_K_XL` selected by default. */
export function SettingsModel() {
  return (
    <div>
      <SectionHeader
        title="Model"
        subtitle="The LLM that cleans transcripts, detects format intent, and drives tool calls."
      />
      <Field label="Runtime">
        <Chip tone="accent" dot icon={<Icon.cpu size={11} />}>
          llama.cpp
        </Chip>
      </Field>
      <Field label="Model" sub="GGUF, quantized.">
        <select className="field" style={{ width: 240 }} defaultValue="UD-Q4_K_XL">
          <option value="UD-Q4_K_XL">gemma-4-E4B-it · UD-Q4_K_XL (5.13 GB)</option>
          <option value="Q4_K_M">gemma-4-E4B-it · Q4_K_M (4.98 GB)</option>
          <option value="UD-Q3_K_XL">gemma-4-E4B-it · UD-Q3_K_XL (4.59 GB)</option>
          <option value="UD-Q5_K_XL">gemma-4-E4B-it · UD-Q5_K_XL (6.66 GB)</option>
          <option value="Q8_0">gemma-4-E4B-it · Q8_0 (8.19 GB)</option>
        </select>
      </Field>
      <Field label="Context window" sub="Tokens — larger = slower but handles longer clips.">
        <input
          type="range"
          min="2048"
          max="32768"
          step="1024"
          defaultValue="8192"
          style={{ width: 200 }}
        />
      </Field>
      <Field label="Temperature" sub="Lower = more deterministic formatting.">
        <input type="range" min="0" max="1" step="0.05" defaultValue="0.2" style={{ width: 200 }} />
      </Field>
      <Field
        label="Multi-agent (experimental)"
        sub="Routes through transcriber → cleaner → formatter → router agents via CrewAI."
      >
        <Switch on={false} onChange={() => {}} />
      </Field>
    </div>
  );
}

/* ─── SettingsHotkeys ─────────────────────────────────────────────── */

/** A single hotkey binding. */
interface HotkeyBinding {
  label: string;
  keys: string[];
}

/** The Hotkeys panel — hold-modifier bindings that override voice commands. */
export function SettingsHotkeys() {
  const keys: HotkeyBinding[] = [
    { label: 'Record (hold to talk)', keys: ['⌥', 'Space'] },
    { label: 'Record (toggle)', keys: ['⌥', '⇧', 'Space'] },
    { label: 'Force format: Markdown', keys: ['⌥', 'M'] },
    { label: 'Force format: Checklist', keys: ['⌥', 'K'] },
    { label: 'Open last', keys: ['⌥', 'L'] },
    { label: 'Open Bench', keys: ['⌥', 'B'] },
    { label: 'Discard / undo last', keys: ['⌥', '⌫'] },
  ];
  return (
    <div>
      <SectionHeader
        title="Hotkeys"
        subtitle="Hold-modifier hotkeys override voice commands when held — useful when you want to force a format the parser missed."
      />
      {keys.map((k, i) => (
        <Field key={i} label={k.label}>
          <div style={{ display: 'flex', gap: 4 }}>
            {k.keys.map((kk, j) => (
              <Kbd key={j}>{kk}</Kbd>
            ))}
          </div>
        </Field>
      ))}
    </div>
  );
}

/* ─── SettingsTools ───────────────────────────────────────────────── */

/** The initial per-tool permission rows. */
const INITIAL_TOOLS: ToolPermission[] = [
  {
    id: 'clipboard.copy',
    label: 'Copy to clipboard',
    desc: 'Always-available; how outputs reach you in the menubar flow.',
    perm: 'auto',
  },
  {
    id: 'format.markdown',
    label: 'Format → Markdown',
    desc: 'Write .md output. No side effects beyond text.',
    perm: 'auto',
  },
  {
    id: 'format.list',
    label: 'Format → List / check',
    desc: 'Format-only transformations.',
    perm: 'auto',
  },
  {
    id: 'file.write.inbox',
    label: 'Write to inbox folder',
    desc: 'Writes into ~/Whispr/inbox/ only. You picked this folder.',
    perm: 'auto',
  },
  {
    id: 'file.write.any',
    label: 'Write to other folders',
    desc: 'Any path the agent specifies.',
    perm: 'ask',
  },
  {
    id: 'obsidian.append.daily',
    label: 'Append to daily note',
    desc: "Adds to today's note in your configured vault.",
    perm: 'auto',
  },
  {
    id: 'obsidian.append.other',
    label: 'Append to other notes',
    desc: 'Any path in the Obsidian vault.',
    perm: 'ask',
  },
  {
    id: 'calendar.create_event',
    label: 'Create calendar event',
    desc: 'Adds events to your default macOS Calendar.',
    perm: 'ask',
  },
  {
    id: 'reminders.create',
    label: 'Create reminder',
    desc: 'Adds items to macOS Reminders.',
    perm: 'ask',
  },
  {
    id: 'github.create_issue',
    label: 'File a GitHub issue',
    desc: 'Repos must be allowlisted below.',
    perm: 'ask',
  },
  {
    id: 'shell.run',
    label: 'Run a shell command',
    desc: 'Allowlist-restricted. Off by default.',
    perm: 'off',
  },
  {
    id: 'web.search',
    label: 'Web search',
    desc: 'DuckDuckGo / Brave. Sends the query off-device.',
    perm: 'off',
  },
];

/** The Tools panel — per-tool permission rows with an Auto/Ask/Off control. */
export function SettingsTools() {
  const [perms, setPerms] = useState<ToolPermission[]>(INITIAL_TOOLS);
  function set(id: string, perm: PermissionLevel) {
    setPerms((arr) => arr.map((p) => (p.id === id ? { ...p, perm } : p)));
  }
  return (
    <div>
      <SectionHeader
        title="Tools"
        subtitle="Decide which tool calls the agent can run on its own, which need a confirm, and which are off."
        action={
          <div
            style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--text-mute)' }}
            className="mono"
          >
            <Chip tone="success">{perms.filter((p) => p.perm === 'auto').length} auto</Chip>
            <Chip tone="warning">{perms.filter((p) => p.perm === 'ask').length} ask</Chip>
            <Chip tone="danger">{perms.filter((p) => p.perm === 'off').length} off</Chip>
          </div>
        }
      />
      <Panel padding={false}>
        {perms.map((p, i) => (
          <div
            key={p.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 14,
              alignItems: 'center',
              padding: '14px 18px',
              borderBottom: i < perms.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontWeight: 500 }}>{p.label}</span>
                <span className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {p.id}
                </span>
              </div>
              <div style={{ color: 'var(--text-mute)', fontSize: 12.5, marginTop: 2 }}>
                {p.desc}
              </div>
            </div>
            <Segmented<PermissionLevel>
              size="sm"
              value={p.perm}
              onChange={(v) => set(p.id, v)}
              options={[
                { value: 'auto', label: 'Auto', tone: 'success', icon: <Icon.check size={11} /> },
                { value: 'ask', label: 'Ask', tone: 'warning' },
                { value: 'off', label: 'Off', tone: 'danger' },
              ]}
            />
          </div>
        ))}
      </Panel>
      <div
        style={{
          marginTop: 16,
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
          <strong style={{ color: 'var(--text-2)' }}>Auto</strong> runs without prompt.{' '}
          <strong style={{ color: 'var(--text-2)' }}>Ask</strong> shows an inline confirm on the
          tool card with a &quot;remember this choice&quot; toggle.{' '}
          <strong style={{ color: 'var(--text-2)' }}>Off</strong> hides the tool from the model
          entirely.
        </span>
      </div>
    </div>
  );
}

/* ─── SettingsPrivacy ─────────────────────────────────────────────── */

/** Props for {@link SettingsPrivacy}. */
export interface SettingsPrivacyProps {
  /** The current capture state. Unused today, kept for prototype parity. */
  state: CaptureState;
  /** Action dispatcher. Unused today, kept for prototype parity. */
  dispatch: Dispatch;
}

/** The Privacy panel — data-retention and cloud-fallback toggles. */
export function SettingsPrivacy({ state: _state, dispatch: _dispatch }: SettingsPrivacyProps) {
  return (
    <div>
      <SectionHeader
        title="Privacy & data"
        subtitle="Whispr is local-first. Nothing leaves your machine unless you turn on a tool that explicitly does."
      />
      <Field
        label="Keep raw audio"
        sub="Retains .wav files alongside transcripts. Needed for re-running through the bench."
      >
        <Switch on={true} onChange={() => {}} />
      </Field>
      <Field label="Audio retention" sub="Auto-delete clips after this long.">
        <select className="field" style={{ width: 140 }} defaultValue="30d">
          <option value="never">Never</option>
          <option value="30d">30 days</option>
          <option value="7d">7 days</option>
          <option value="1d">24 hours</option>
        </select>
      </Field>
      <Field label="Anonymous error reports" sub="Sends stack traces only — no transcripts.">
        <Switch on={false} onChange={() => {}} />
      </Field>
      <Field
        label="Allow cloud fallback"
        sub="If a tool requires the internet (e.g. web.search), allow it."
      >
        <Switch on={false} onChange={() => {}} />
      </Field>
      <div
        style={{
          marginTop: 20,
          padding: 18,
          background: 'rgba(92,199,138,.04)',
          border: '1px solid rgba(92,199,138,.2)',
          borderRadius: 'var(--r-lg)',
          display: 'flex',
          gap: 14,
        }}
      >
        <div style={{ color: 'var(--success)', flexShrink: 0 }}>
          <Icon.check size={20} />
        </div>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--success)' }}>100% local right now</div>
          <div style={{ color: 'var(--text-2)', fontSize: 13, marginTop: 4, lineHeight: 1.6 }}>
            insanely-fast-whisper, Apple Speech, llama.cpp, and Gemma 3 are all on-device. No tool
            with cloud fallback is enabled.
          </div>
        </div>
      </div>
    </div>
  );
}
