// studio-app.jsx — root App component, navigation, state machine

const {
  Icon, Btn, Kbd, Chip, Panel, Waveform, RecDot, Spinner,
} = window;
const { CaptureView, HistoryView, BenchView, VocabView, SettingsView, DEMO_SAMPLES } = window;

const { useState, useEffect, useRef, useReducer, useCallback } = React;

/* ─── Capture reducer (recording → transcribing → ready) ──────────── */
const initialCapture = {
  phase: 'idle',     // idle | recording | transcribing | ready
  elapsed: 0,        // seconds
  current: null,     // sample object
  selectedFormat: null,
  formatView: 'inline',
  demoIdx: 0,
};

function captureReducer(state, action){
  switch(action.type){
    case 'rec:start':
      return {...state, phase:'recording', elapsed:0, current:null, selectedFormat:null};
    case 'rec:tick':
      return {...state, elapsed: state.elapsed + 0.1};
    case 'rec:stop':
      return {...state, phase:'transcribing'};
    case 'rec:cancel':
      return {...initialCapture, demoIdx: state.demoIdx};
    case 'rec:done': {
      const sample = action.sample || DEMO_SAMPLES[state.demoIdx % DEMO_SAMPLES.length];
      return {...state, phase:'ready', current:sample, selectedFormat: sample.format, demoIdx:(state.demoIdx+1)%DEMO_SAMPLES.length, elapsed:0};
    }
    case 'reset':
      return {...initialCapture, demoIdx: state.demoIdx};
    case 'demo:next': {
      const sample = DEMO_SAMPLES[state.demoIdx % DEMO_SAMPLES.length];
      return {...state, phase:'ready', current:sample, selectedFormat: sample.format, demoIdx:(state.demoIdx+1)%DEMO_SAMPLES.length, elapsed: sample.duration};
    }
    case 'format:pick':
      return {...state, selectedFormat: action.f};
    case 'fmtView:set':
      return {...state, formatView: action.v};
    case 'tool:approve': {
      if (!state.current) return state;
      const tools = state.current.tools.map((t,i)=> i===action.idx ? {...t, status:'done', result:'Created event ✓'} : t);
      return {...state, current: {...state.current, tools}};
    }
    case 'tool:deny': {
      if (!state.current) return state;
      const tools = state.current.tools.filter((_,i)=> i!==action.idx);
      return {...state, current: {...state.current, tools}};
    }
    case 'route:set':
      if (!state.current) return state;
      return {...state, current: {...state.current, routedTo: action.v}};
    case 'commit':
      // Pretend we committed — just reset
      return {...initialCapture, demoIdx: state.demoIdx};
    default:
      return state;
  }
}

/* ─── App ─────────────────────────────────────────────────────────── */
function App(){
  const [nav, setNav] = useState('capture');
  const [cap, dispatchCap] = useReducer(captureReducer, initialCapture);
  const recTimerRef = useRef(null);
  const transcribeTimerRef = useRef(null);
  const [prefs] = useState({zeroUI:true});

  // ─── Side-effect: ticking + auto-progress through the recording flow
  useEffect(()=>{
    if (cap.phase === 'recording'){
      // tick elapsed
      recTimerRef.current = setInterval(()=> dispatchCap({type:'rec:tick'}), 100);
      // auto-stop after ~6s (demo nicety) — but user can stop earlier
      const autoStop = setTimeout(()=> dispatchCap({type:'rec:stop'}), 6000);
      return ()=> {
        clearInterval(recTimerRef.current);
        clearTimeout(autoStop);
      };
    }
    if (cap.phase === 'transcribing'){
      // pretend ~1.2s of transcription work, then progress to ready
      transcribeTimerRef.current = setTimeout(()=>{
        dispatchCap({type:'rec:done'});
      }, 1200);
      return ()=> clearTimeout(transcribeTimerRef.current);
    }
  }, [cap.phase]);

  // Augment dispatch to also handle nav changes from inside views
  const dispatch = useCallback((action)=>{
    if (action.type === 'nav:go'){ setNav(action.v); return; }
    dispatchCap(action);
  }, []);

  // Keyboard shortcuts
  useEffect(()=>{
    const onKey = (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'Escape' && cap.phase === 'recording'){ dispatchCap({type:'rec:cancel'}); }
      if (e.key === 'Enter' && cap.phase === 'ready'){ dispatchCap({type:'commit'}); }
      if (e.altKey && e.key.toLowerCase() === 'b'){ setNav('bench'); }
    };
    window.addEventListener('keydown', onKey);
    return ()=> window.removeEventListener('keydown', onKey);
  }, [cap.phase]);

  return (
    <div style={{height:'100%', display:'flex', flexDirection:'column'}}>
      <WindowChrome cap={cap}/>
      <div style={{flex:1, display:'flex', minHeight:0}}>
        <NavRail nav={nav} setNav={setNav}/>
        <div style={{flex:1, minWidth:0, position:'relative'}}>
          {nav === 'capture'  && <CaptureView  state={cap} dispatch={dispatch} prefs={prefs}/>}
          {nav === 'history'  && <HistoryView  state={cap} dispatch={dispatch}/>}
          {nav === 'bench'    && <BenchView    state={cap} dispatch={dispatch}/>}
          {nav === 'vocab'    && <VocabView    state={cap} dispatch={dispatch}/>}
          {nav === 'settings' && <SettingsView state={cap} dispatch={dispatch}/>}
        </div>
      </div>
      {/* Menubar preview overlay, top-right */}
      <MenubarPreview/>
    </div>
  );
}

/* ─── Window chrome (faux traffic lights + status) ──────────────────── */
function WindowChrome({cap}){
  const isRec = cap.phase === 'recording';
  return (
    <div style={{
      height:42, display:'flex', alignItems:'center',
      padding:'0 14px', gap:14,
      background:'var(--bg2)',
      borderBottom:'1px solid var(--border)',
      flexShrink:0,
    }}>
      <div style={{display:'flex', gap:8}}>
        {[
          {c:'#ff5f57', b:'#e0443e'},
          {c:'#febc2e', b:'#c79727'},
          {c:'#28c840', b:'#1aab29'},
        ].map((d,i)=>(
          <div key={i} style={{width:12, height:12, borderRadius:99, background:d.c, border:`1px solid ${d.b}`}}/>
        ))}
      </div>
      <div style={{display:'flex', alignItems:'center', gap:8, marginLeft:6, whiteSpace:'nowrap'}}>
        <div style={{
          width:18, height:18, borderRadius:5,
          background:'var(--accent)', display:'flex', alignItems:'center', justifyContent:'center',
          color:'#1a0f08', fontWeight:700, fontSize:11, fontFamily:'var(--font-mono)',
        }}>W</div>
        <span style={{fontWeight:600, fontSize:13}}>Whispr Studio</span>
        <span style={{color:'var(--text-dim)'}}>·</span>
        <span style={{color:'var(--text-mute)', fontSize:12.5}}>v0.4.2-dev</span>
      </div>

      <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:12, whiteSpace:'nowrap'}}>
        {isRec && <Chip tone="accent" dot>recording · {cap.elapsed.toFixed(1)}s</Chip>}
        {cap.phase === 'transcribing' && <Chip tone="warning" icon={<Spinner size={10}/>}>transcribing</Chip>}
        <div style={{display:'flex', alignItems:'center', gap:6, color:'var(--text-mute)', fontSize:12}} className="mono">
          <span style={{display:'inline-block', width:6, height:6, borderRadius:99, background:'var(--success)'}}/>
          <span>3.2 GB · M3 Pro · GPU active</span>
        </div>
      </div>
    </div>
  );
}

/* ─── Left nav rail ──────────────────────────────────────────────── */
function NavRail({nav, setNav}){
  const items = [
    {id:'capture',  label:'Capture',  icon:<Icon.mic size={18}/>,      kbd:'1'},
    {id:'history',  label:'History',  icon:<Icon.history size={18}/>,  kbd:'2'},
    {id:'bench',    label:'Bench',    icon:<Icon.bench size={18}/>,    kbd:'3'},
    {id:'vocab',    label:'Vocab',    icon:<Icon.vocab size={18}/>,    kbd:'4'},
    {id:'settings', label:'Settings', icon:<Icon.settings size={18}/>, kbd:'5'},
  ];
  return (
    <div style={{
      width:78, flexShrink:0,
      borderRight:'1px solid var(--border)',
      background:'var(--bg2)',
      display:'flex', flexDirection:'column',
      padding:'12px 6px',
    }}>
      {items.map(it=>{
        const active = nav === it.id;
        return (
          <button key={it.id} onClick={()=>setNav(it.id)} title={it.label} style={{
            width:'100%', padding:'10px 4px',
            display:'flex', flexDirection:'column', alignItems:'center', gap:5,
            borderRadius:'var(--r-md)',
            background: active ? 'var(--bg3)' : 'transparent',
            color: active ? 'var(--accent)' : 'var(--text-mute)',
            cursor:'pointer',
            transition:'all .12s',
            marginBottom:3,
            position:'relative',
          }}
            onMouseEnter={e=>{if(!active){e.currentTarget.style.background='var(--bg3)'; e.currentTarget.style.color='var(--text-2)';}}}
            onMouseLeave={e=>{if(!active){e.currentTarget.style.background='transparent'; e.currentTarget.style.color='var(--text-mute)';}}}
          >
            {active && <span style={{
              position:'absolute', left:-6, top:'50%', transform:'translateY(-50%)',
              width:3, height:18, borderRadius:'0 3px 3px 0',
              background:'var(--accent)',
            }}/>}
            {it.icon}
            <span style={{fontSize:11, fontWeight:500}}>{it.label}</span>
          </button>
        );
      })}
      <div style={{marginTop:'auto', display:'flex', flexDirection:'column', alignItems:'center', gap:6, paddingTop:12}}>
        <div style={{fontSize:10, color:'var(--text-dim)', textAlign:'center', lineHeight:1.4}} className="mono">
          ⌘K<br/>cmd
        </div>
      </div>
    </div>
  );
}

/* ─── Menubar preview (corner widget showing the other surface) ──── */
function MenubarPreview(){
  const [open, setOpen] = useState(true);
  const [hidden, setHidden] = useState(false);
  if (hidden) {
    return (
      <button onClick={()=>setHidden(false)} style={{
        position:'fixed', bottom:18, right:18,
        width:32, height:32, borderRadius:99,
        background:'var(--bg2)', border:'1px solid var(--border-hi)',
        color:'var(--text-2)', display:'flex', alignItems:'center', justifyContent:'center',
        cursor:'pointer', boxShadow:'var(--shadow-2)',
      }} title="Show menubar preview">
        <Icon.mic size={14}/>
      </button>
    );
  }
  return (
    <div style={{
      position:'fixed', bottom:18, right:18, zIndex:50,
      width: open ? 260 : 'auto',
      background:'var(--panel)',
      border:'1px solid var(--border-hi)',
      borderRadius:'var(--r-lg)',
      boxShadow:'var(--shadow-2)',
      overflow:'hidden',
      fontSize:12,
    }}>
      <div style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'8px 10px', borderBottom: open ? '1px solid var(--border)' : 'none',
        background:'var(--bg2)',
        cursor:'pointer',
      }} onClick={()=>setOpen(o=>!o)}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span style={{
            width:14, height:14, borderRadius:4, background:'var(--accent)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#1a0f08', fontFamily:'var(--font-mono)', fontSize:9, fontWeight:700,
          }}>W</span>
          <span style={{fontWeight:600, fontSize:12}}>Menubar preview</span>
        </div>
        <div style={{display:'flex', gap:4, alignItems:'center'}}>
          <button onClick={(e)=>{e.stopPropagation(); setHidden(true);}} style={{color:'var(--text-mute)', padding:2}}><Icon.x size={11}/></button>
        </div>
      </div>
      {open && <MenubarBody/>}
    </div>
  );
}

function MenubarBody(){
  // Simulate a tiny menubar popover state: idle, then recording, then result
  const [phase, setPhase] = useState('idle'); // idle | rec | result
  const [elapsed, setElapsed] = useState(0);
  useEffect(()=>{
    if (phase !== 'rec') return;
    const i = setInterval(()=> setElapsed(e => +(e+0.1).toFixed(1)), 100);
    const t = setTimeout(()=> { setPhase('result'); }, 4000);
    return ()=> { clearInterval(i); clearTimeout(t); };
  }, [phase]);

  function reset(){ setPhase('idle'); setElapsed(0); }

  if (phase === 'idle') {
    return (
      <div style={{padding:'12px 12px'}}>
        <div style={{color:'var(--text-mute)', fontSize:11, lineHeight:1.6, marginBottom:10}}>
          The menubar surface. Click below to simulate a hold-to-talk capture.
        </div>
        <button onClick={()=>{setPhase('rec'); setElapsed(0);}} style={{
          width:'100%', display:'flex', alignItems:'center', gap:8,
          padding:'8px 10px', borderRadius:8,
          background:'var(--bg2)', border:'1px solid var(--border)',
          color:'var(--text)', cursor:'pointer', fontSize:12,
        }}>
          <Icon.mic size={14}/>
          <span>Hold</span><Kbd style={{fontSize:10}}>⌥</Kbd><Kbd style={{fontSize:10}}>Space</Kbd>
        </button>
      </div>
    );
  }
  if (phase === 'rec'){
    return (
      <div style={{padding:'10px 12px'}}>
        <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8}}>
          <RecDot size={7}/>
          <span style={{fontSize:11, fontWeight:500}}>Recording</span>
          <span className="mono" style={{fontSize:11, color:'var(--text-mute)', marginLeft:'auto'}}>{elapsed.toFixed(1)}s</span>
        </div>
        <Waveform active height={28}/>
        <div style={{marginTop:8, color:'var(--text-dim)', fontSize:10.5, textAlign:'center'}}>release to commit · esc to cancel</div>
      </div>
    );
  }
  // result
  return (
    <div style={{padding:'10px 12px'}}>
      <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:6}}>
        <Chip tone="success" style={{fontSize:10}} icon={<Icon.check size={9}/>}>pasted at cursor</Chip>
      </div>
      <div style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        borderRadius:6, padding:'8px 10px',
        fontFamily:'var(--font-mono)', fontSize:11, lineHeight:1.55,
        color:'var(--text-2)',
        whiteSpace:'pre-wrap',
        maxHeight:90, overflow:'hidden',
      }}>{`- [ ] Milk
- [ ] Eggs
- [ ] Bread
- [ ] Bananas`}</div>
      <div style={{display:'flex', gap:6, marginTop:8}}>
        <button onClick={reset} style={{
          flex:1, padding:'5px 8px', borderRadius:6,
          background:'var(--bg2)', border:'1px solid var(--border)',
          color:'var(--text-2)', fontSize:11, cursor:'pointer',
        }}>↺ redo</button>
        <button onClick={reset} style={{
          flex:1, padding:'5px 8px', borderRadius:6,
          background:'var(--accent)', border:'1px solid var(--accent)',
          color:'#1a0f08', fontSize:11, cursor:'pointer', fontWeight:600,
        }}>✓ done</button>
      </div>
    </div>
  );
}

/* ─── Mount ──────────────────────────────────────────────────────── */
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App/>);
