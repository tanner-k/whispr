/**
 * SettingsView.tsx — the Settings view: a left tab rail and the active
 * settings panel.
 *
 * Faithful port of `SettingsView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * replaces the prototype's aliased `vUseState`.
 */
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Icon } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import {
  SettingsHotkeys,
  SettingsModel,
  SettingsPrivacy,
  SettingsTools,
  SettingsTranscription,
} from './SettingsPanels';

/** Which Settings tab is showing. */
type SettingsTab = 'transcription' | 'model' | 'hotkeys' | 'tools' | 'privacy';

/** A Settings tab definition. */
interface SettingsTabDef {
  id: SettingsTab;
  label: string;
  icon: ReactNode;
}

/** The Settings tabs, in display order. */
const SETTINGS_TABS: ReadonlyArray<SettingsTabDef> = [
  { id: 'transcription', label: 'Transcription', icon: <Icon.mic size={14} /> },
  { id: 'model', label: 'Model', icon: <Icon.cpu size={14} /> },
  { id: 'hotkeys', label: 'Hotkeys', icon: <Icon.bolt size={14} /> },
  { id: 'tools', label: 'Tools', icon: <Icon.bench size={14} /> },
  { id: 'privacy', label: 'Privacy', icon: <Icon.info size={14} /> },
];

/** Props for {@link SettingsView}. */
export interface SettingsViewProps {
  /** The current capture state. Forwarded to the Privacy panel for
   * parity with the prototype's prop signature (App passes it). */
  state: CaptureState;
  /** Action dispatcher. Forwarded to the Privacy panel for parity. */
  dispatch: Dispatch;
}

/** The Settings view — tab rail on the left, active panel on the right. */
export function SettingsView({ state, dispatch }: SettingsViewProps) {
  const [tab, setTab] = useState<SettingsTab>('tools');
  return (
    <div style={{ height: '100%', display: 'grid', gridTemplateColumns: '200px 1fr' }}>
      <div style={{ borderRight: '1px solid var(--border)', padding: '18px 12px' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: 'var(--text-mute)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            padding: '4px 10px 10px',
          }}
        >
          Settings
        </div>
        {SETTINGS_TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 10px',
              borderRadius: 'var(--r-md)',
              background: tab === t.id ? 'var(--bg2)' : 'transparent',
              color: tab === t.id ? 'var(--text)' : 'var(--text-mute)',
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              cursor: 'pointer',
              marginBottom: 2,
              fontSize: 13.5,
              fontWeight: tab === t.id ? 600 : 500,
            }}
            onMouseEnter={(e) => {
              if (tab !== t.id) e.currentTarget.style.background = 'var(--bg2)';
            }}
            onMouseLeave={(e) => {
              if (tab !== t.id) e.currentTarget.style.background = 'transparent';
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>
      <div style={{ padding: '24px 32px', overflowY: 'auto' }}>
        {tab === 'transcription' && <SettingsTranscription />}
        {tab === 'model' && <SettingsModel />}
        {tab === 'hotkeys' && <SettingsHotkeys />}
        {tab === 'tools' && <SettingsTools />}
        {tab === 'privacy' && <SettingsPrivacy state={state} dispatch={dispatch} />}
      </div>
    </div>
  );
}
