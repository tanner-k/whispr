// App.tsx — root App component, navigation, and capture state machine wiring.
import { useCallback, useEffect, useReducer, useState } from 'react';
import { Chip, Icon, Kbd, RecDot, Spinner, Waveform } from './components';
import {
  createCaptureReducer,
  initialCapture,
  type CaptureAction,
  type CaptureState,
  type NavTarget,
} from './state/capture';
import { BenchView } from './views/BenchView';
import { CaptureView } from './views/CaptureView';
import { DEMO_SAMPLES } from './views/captureData';
import { HistoryView } from './views/HistoryView';
import { SettingsView } from './views/SettingsView';
import { VocabView } from './views/VocabView';

const appCaptureReducer = createCaptureReducer(DEMO_SAMPLES);

const NAV_ITEMS: ReadonlyArray<{
  id: NavTarget;
  label: string;
  icon: JSX.Element;
}> = [
  { id: 'capture', label: 'Capture', icon: <Icon.mic size={18} /> },
  { id: 'history', label: 'History', icon: <Icon.history size={18} /> },
  { id: 'bench', label: 'Bench', icon: <Icon.bench size={18} /> },
  { id: 'vocab', label: 'Vocab', icon: <Icon.vocab size={18} /> },
  { id: 'settings', label: 'Settings', icon: <Icon.settings size={18} /> },
];

export default function App() {
  const [nav, setNav] = useState<NavTarget>('capture');
  const [cap, dispatchCap] = useReducer(appCaptureReducer, initialCapture);
  const [prefs] = useState({ zeroUI: true });

  useEffect(() => {
    if (cap.phase === 'recording') {
      const recTimer = setInterval(() => dispatchCap({ type: 'rec:tick' }), 100);
      return () => clearInterval(recTimer);
    }
    return undefined;
  }, [cap.phase]);

  const dispatch = useCallback((action: CaptureAction) => {
    if (action.type === 'nav:go') {
      setNav(action.v);
      return;
    }
    dispatchCap(action);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.matches('input, textarea, select')) {
        return;
      }
      if (event.key === 'Escape' && cap.phase === 'recording') dispatchCap({ type: 'rec:cancel' });
      if (event.key === 'Enter' && cap.phase === 'ready') dispatchCap({ type: 'commit' });
      if (event.altKey && event.key.toLowerCase() === 'b') setNav('bench');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cap.phase]);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <WindowChrome cap={cap} />
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        <NavRail nav={nav} setNav={setNav} />
        <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
          {nav === 'capture' && <CaptureView state={cap} dispatch={dispatch} prefs={prefs} />}
          {nav === 'history' && <HistoryView state={cap} dispatch={dispatch} />}
          {nav === 'bench' && <BenchView state={cap} dispatch={dispatch} />}
          {nav === 'vocab' && <VocabView state={cap} dispatch={dispatch} />}
          {nav === 'settings' && <SettingsView state={cap} dispatch={dispatch} />}
        </div>
      </div>
      <MenubarPreview />
    </div>
  );
}

function WindowChrome({ cap }: { cap: CaptureState }) {
  const isRec = cap.phase === 'recording';
  return (
    <div
      style={{
        height: 42,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: 14,
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}
    >
      <div style={{ display: 'flex', gap: 8 }}>
        {[
          { c: '#ff5f57', b: '#e0443e' },
          { c: '#febc2e', b: '#c79727' },
          { c: '#28c840', b: '#1aab29' },
        ].map((d, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              borderRadius: 99,
              background: d.c,
              border: `1px solid ${d.b}`,
            }}
          />
        ))}
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginLeft: 6,
          whiteSpace: 'nowrap',
        }}
      >
        <div
          style={{
            width: 18,
            height: 18,
            borderRadius: 5,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#1a0f08',
            fontWeight: 700,
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
          }}
        >
          W
        </div>
        <span style={{ fontWeight: 600, fontSize: 13 }}>Whispr Studio</span>
        <span style={{ color: 'var(--text-dim)' }}>·</span>
        <span style={{ color: 'var(--text-mute)', fontSize: 12.5 }}>v0.4.2-dev</span>
      </div>

      <div
        style={{
          marginLeft: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          whiteSpace: 'nowrap',
        }}
      >
        {isRec && (
          <Chip tone="accent" dot>
            recording · {cap.elapsed.toFixed(1)}s
          </Chip>
        )}
        {cap.phase === 'transcribing' && (
          <Chip tone="warning" icon={<Spinner size={10} />}>
            transcribing
          </Chip>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--text-mute)',
            fontSize: 12,
          }}
          className="mono"
        >
          <span
            style={{
              display: 'inline-block',
              width: 6,
              height: 6,
              borderRadius: 99,
              background: 'var(--success)',
            }}
          />
          <span>3.2 GB · M3 Pro · GPU active</span>
        </div>
      </div>
    </div>
  );
}

function NavRail({ nav, setNav }: { nav: NavTarget; setNav: (nav: NavTarget) => void }) {
  return (
    <div
      style={{
        width: 78,
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--bg2)',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 6px',
      }}
    >
      {NAV_ITEMS.map((it) => {
        const active = nav === it.id;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => setNav(it.id)}
            title={it.label}
            style={{
              width: '100%',
              padding: '10px 4px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 5,
              borderRadius: 'var(--r-md)',
              background: active ? 'var(--bg3)' : 'transparent',
              color: active ? 'var(--accent)' : 'var(--text-mute)',
              cursor: 'pointer',
              transition: 'all .12s',
              marginBottom: 3,
              position: 'relative',
            }}
            onMouseEnter={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'var(--bg3)';
                e.currentTarget.style.color = 'var(--text-2)';
              }
            }}
            onMouseLeave={(e) => {
              if (!active) {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-mute)';
              }
            }}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  left: -6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 18,
                  borderRadius: '0 3px 3px 0',
                  background: 'var(--accent)',
                }}
              />
            )}
            {it.icon}
            <span style={{ fontSize: 11, fontWeight: 500 }}>{it.label}</span>
          </button>
        );
      })}
      <div
        style={{
          marginTop: 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
          paddingTop: 12,
        }}
      >
        <div
          style={{ fontSize: 10, color: 'var(--text-dim)', textAlign: 'center', lineHeight: 1.4 }}
          className="mono"
        >
          ⌘K
          <br />
          cmd
        </div>
      </div>
    </div>
  );
}

function MenubarPreview() {
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(false);
  if (hidden) {
    return (
      <button
        type="button"
        onClick={() => setHidden(false)}
        style={{
          position: 'fixed',
          bottom: 18,
          right: 18,
          width: 32,
          height: 32,
          borderRadius: 99,
          background: 'var(--bg2)',
          border: '1px solid var(--border-hi)',
          color: 'var(--text-2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-2)',
        }}
        title="Show menubar preview"
      >
        <Icon.mic size={14} />
      </button>
    );
  }
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 18,
        right: 18,
        zIndex: 50,
        width: open ? 260 : 'auto',
        background: 'var(--panel)',
        border: '1px solid var(--border-hi)',
        borderRadius: 'var(--r-lg)',
        boxShadow: 'var(--shadow-2)',
        overflow: 'hidden',
        fontSize: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 10px',
          borderBottom: open ? '1px solid var(--border)' : 'none',
          background: 'var(--bg2)',
          cursor: 'pointer',
        }}
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              width: 14,
              height: 14,
              borderRadius: 4,
              background: 'var(--accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#1a0f08',
              fontFamily: 'var(--font-mono)',
              fontSize: 9,
              fontWeight: 700,
            }}
          >
            W
          </span>
          <span style={{ fontWeight: 600, fontSize: 12 }}>Menubar preview</span>
        </div>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button
            type="button"
            aria-label="Hide menubar preview"
            onClick={(event) => {
              event.stopPropagation();
              setHidden(true);
            }}
            style={{ color: 'var(--text-mute)', padding: 2 }}
          >
            <Icon.x size={11} />
          </button>
        </div>
      </div>
      {open && <MenubarBody />}
    </div>
  );
}

function MenubarBody() {
  const [phase, setPhase] = useState<'idle' | 'rec' | 'result'>('idle');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (phase !== 'rec') return undefined;
    const interval = setInterval(() => setElapsed((value) => +(value + 0.1).toFixed(1)), 100);
    const timer = setTimeout(() => {
      setPhase('result');
    }, 4000);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [phase]);

  function reset() {
    setPhase('idle');
    setElapsed(0);
  }

  if (phase === 'idle') {
    return (
      <div style={{ padding: '12px 12px' }}>
        <div style={{ color: 'var(--text-mute)', fontSize: 11, lineHeight: 1.6, marginBottom: 10 }}>
          The menubar surface. Click below to simulate a hold-to-talk capture.
        </div>
        <button
          type="button"
          onClick={() => {
            setPhase('rec');
            setElapsed(0);
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontSize: 12,
          }}
        >
          <Icon.mic size={14} />
          <span>Hold</span>
          <Kbd style={{ fontSize: 10 }}>⌥</Kbd>
          <Kbd style={{ fontSize: 10 }}>Space</Kbd>
        </button>
      </div>
    );
  }
  if (phase === 'rec') {
    return (
      <div style={{ padding: '10px 12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <RecDot size={7} />
          <span style={{ fontSize: 11, fontWeight: 500 }}>Recording</span>
          <span
            className="mono"
            style={{ fontSize: 11, color: 'var(--text-mute)', marginLeft: 'auto' }}
          >
            {elapsed.toFixed(1)}s
          </span>
        </div>
        <Waveform active height={28} />
        <div
          style={{ marginTop: 8, color: 'var(--text-dim)', fontSize: 10.5, textAlign: 'center' }}
        >
          release to commit · esc to cancel
        </div>
      </div>
    );
  }
  return (
    <div style={{ padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Chip tone="success" style={{ fontSize: 10 }} icon={<Icon.check size={9} />}>
          pasted at cursor
        </Chip>
      </div>
      <div
        style={{
          background: 'var(--bg2)',
          border: '1px solid var(--border)',
          borderRadius: 6,
          padding: '8px 10px',
          fontFamily: 'var(--font-mono)',
          fontSize: 11,
          lineHeight: 1.55,
          color: 'var(--text-2)',
          whiteSpace: 'pre-wrap',
          maxHeight: 90,
          overflow: 'hidden',
        }}
      >{`- [ ] Milk
- [ ] Eggs
- [ ] Bread
- [ ] Bananas`}</div>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          type="button"
          onClick={reset}
          style={{
            flex: 1,
            padding: '5px 8px',
            borderRadius: 6,
            background: 'var(--bg2)',
            border: '1px solid var(--border)',
            color: 'var(--text-2)',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          ↺ redo
        </button>
        <button
          type="button"
          onClick={reset}
          style={{
            flex: 1,
            padding: '5px 8px',
            borderRadius: 6,
            background: 'var(--accent)',
            border: '1px solid var(--accent)',
            color: '#1a0f08',
            fontSize: 11,
            cursor: 'pointer',
            fontWeight: 600,
          }}
        >
          ✓ done
        </button>
      </div>
    </div>
  );
}
