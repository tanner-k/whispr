/**
 * SettingsView.tsx — the Settings view: a left tab rail and the active
 * settings panel.
 *
 * Faithful port of `SettingsView` from
 * design-reference/project/studio-views.jsx. Inline styles and
 * `var(--…)` theme references are preserved verbatim. Local `useState`
 * replaces the prototype's aliased `vUseState`.
 *
 * Settings are loaded from the backend on mount via the injectable
 * `loadSettings` / `saveSettings` props (defaults to the real API
 * client functions), following the same dependency-injection pattern
 * used in CaptureView.
 */
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { getSettings, patchSettings } from '../api/client';
import { Icon } from '../components';
import type { CaptureState, Dispatch } from '../state/capture';
import type { Settings, SettingsPatch } from '../types';
import {
  INITIAL_TOOLS,
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
  /** Fetch persisted settings from the backend. Injectable for tests. */
  loadSettings?: () => Promise<Settings>;
  /** Persist a partial settings update. Injectable for tests. */
  saveSettings?: (patch: SettingsPatch) => Promise<Settings>;
}

/** The Settings view — tab rail on the left, active panel on the right. */
export function SettingsView({
  state,
  dispatch,
  loadSettings = getSettings,
  saveSettings = patchSettings,
}: SettingsViewProps) {
  const [tab, setTab] = useState<SettingsTab>('tools');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadSettings()
      .then((s) => {
        if (!cancelled) setSettings(s);
      })
      .catch((err) => {
        if (!cancelled) {
          setLoadError(err instanceof Error ? err.message : 'Failed to load settings');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [loadSettings]);

  /** Apply a patch, call the API, and update local state from the response. */
  function applyPatch(patch: SettingsPatch) {
    saveSettings(patch)
      .then((updated) => setSettings(updated))
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : 'Failed to save settings');
      });
  }

  // Use loaded tools when available; fall back to INITIAL_TOOLS when null or
  // when the API returns an empty list (e.g. the backend stub in tests).
  const tools =
    settings?.tools != null && settings.tools.length > 0 ? settings.tools : INITIAL_TOOLS;

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
        {loadError && (
          <div
            role="alert"
            style={{
              marginBottom: 16,
              padding: '8px 12px',
              background: 'rgba(220,53,69,.08)',
              border: '1px solid rgba(220,53,69,.3)',
              borderRadius: 'var(--r-md)',
              color: 'var(--danger, #dc3545)',
              fontSize: 13,
            }}
          >
            {loadError}
          </div>
        )}
        {tab === 'transcription' && (
          <SettingsTranscription
            transcription={settings?.transcription ?? null}
            onSave={(patch) => applyPatch({ transcription: patch })}
          />
        )}
        {tab === 'model' && (
          <SettingsModel
            model={settings?.model ?? null}
            onSave={(patch) => applyPatch({ model: patch })}
          />
        )}
        {tab === 'hotkeys' && <SettingsHotkeys />}
        {tab === 'tools' && (
          <SettingsTools tools={tools} onSave={(updated) => applyPatch({ tools: updated })} />
        )}
        {tab === 'privacy' && (
          <SettingsPrivacy
            state={state}
            dispatch={dispatch}
            privacy={settings?.privacy ?? null}
            onSave={(patch) => applyPatch({ privacy: patch })}
          />
        )}
      </div>
    </div>
  );
}
