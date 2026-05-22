// studio-views.jsx — main views for Whispr Studio

const {
  Icon, Btn, Kbd, Chip, Panel, SectionHeader,
  Waveform, RecDot, Spinner, Segmented, Switch,
  FORMAT_META, FormatChip, diffTokens, DiffText, Empty,
} = window;

const { useState: vUseState, useEffect: vUseEffect, useRef: vUseRef, useMemo: vUseMemo } = React;

/* ─────────────────────────────────────────────────────────────────
   CAPTURE VIEW — the heart of Studio
   States: idle → recording → transcribing → ready
───────────────────────────────────────────────────────────────── */

const DEMO_SAMPLES = [
  {
    id:'s1',
    raw: "Okay so I need to head out tonight and grab milk, eggs, bread, and bananas if they look good. Also pick up some coffee filters and trash bags. Format this as a checklist please.",
    cleaned: "Milk, eggs, bread, and bananas if they look good. Also pick up some coffee filters and trash bags.",
    duration: 11.4,
    sttMs: 380,
    llmMs: 470,
    format: 'check',
    confidence: 0.94,
    title: 'Grocery run',
    formatted: {
      check: "- [ ] Milk\n- [ ] Eggs\n- [ ] Bread\n- [ ] Bananas (if they look good)\n- [ ] Coffee filters\n- [ ] Trash bags",
      list:  "- Milk\n- Eggs\n- Bread\n- Bananas (if they look good)\n- Coffee filters\n- Trash bags",
      markdown: "# Grocery run\n\n- Milk\n- Eggs\n- Bread\n- Bananas (if they look good)\n- Coffee filters\n- Trash bags",
      prose: "Need to pick up milk, eggs, bread, and bananas if they look good — plus coffee filters and trash bags.",
    },
    alternates: [
      {format:'check', confidence:0.94},
      {format:'list', confidence:0.71},
      {format:'markdown', confidence:0.32},
      {format:'prose', confidence:0.08},
    ],
    tools: [],
    routedTo: 'clipboard',
  },
  {
    id:'s2',
    raw: "Set up a sync with the design team next Tuesday at two pm for ninety minutes to review the new onboarding flow. Loop in Priya and Marco. Add it to my calendar.",
    cleaned: "Sync with the design team next Tuesday at 2:00 PM for 90 minutes to review the new onboarding flow. Loop in Priya and Marco.",
    duration: 9.8,
    sttMs: 320,
    llmMs: 540,
    format: 'calendar',
    confidence: 0.97,
    title: 'Design sync — onboarding',
    formatted: {
      calendar: "Design team sync — onboarding review\nTuesday, May 27 · 2:00–3:30 PM\nAttendees: Priya, Marco",
      prose: "Schedule a 90-minute design team sync next Tuesday at 2pm to review the new onboarding flow. Invite Priya and Marco.",
      markdown: "## Design sync — onboarding\n\n- **When:** Tue May 27, 2:00–3:30 PM\n- **Who:** Priya, Marco\n- **Topic:** Review new onboarding flow",
    },
    alternates: [
      {format:'calendar', confidence:0.97},
      {format:'markdown', confidence:0.42},
      {format:'prose', confidence:0.18},
    ],
    tools: [
      {
        kind:'calendar.create_event',
        args:{ title:'Design sync — onboarding', start:'2026-05-27T14:00', end:'2026-05-27T15:30', invitees:['Priya','Marco']},
        status:'pending', // needs ask
        result: null,
      },
    ],
    routedTo: 'calendar',
  },
  {
    id:'s3',
    raw: "Shipped the new onboarding yesterday, working on the data export job today, blocked on the schema review for the billing rewrite. Format as markdown and save to today's daily note.",
    cleaned: "Shipped the new onboarding yesterday. Working on the data export job today. Blocked on the schema review for the billing rewrite.",
    duration: 14.2,
    sttMs: 510,
    llmMs: 620,
    format: 'markdown',
    confidence: 0.91,
    title: 'Standup notes',
    formatted: {
      markdown: "## Standup — May 21\n\n**Yesterday**\n- Shipped the new onboarding flow\n\n**Today**\n- Data export job\n\n**Blockers**\n- Schema review for the billing rewrite",
      list: "- Yesterday: shipped onboarding\n- Today: data export job\n- Blocker: schema review (billing rewrite)",
      prose: "Yesterday I shipped the new onboarding. Today I'm working on the data export job. I'm blocked on the schema review for the billing rewrite.",
    },
    alternates: [
      {format:'markdown', confidence:0.91},
      {format:'list', confidence:0.56},
      {format:'prose', confidence:0.31},
    ],
    tools: [
      { kind:'obsidian.append', args:{path:'daily/2026-05-21.md'}, status:'done', result:'Appended 217 chars' },
    ],
    routedTo: 'obsidian',
  },
];

function CaptureView({state, dispatch, prefs}){
  // state.phase: idle | recording | transcribing | ready
  // state.elapsed: seconds (during recording)
  // state.current: sample object (when ready)
  // state.streamedChars: int (typewriter effect)
  // state.selectedFormat: format key
  // state.formatView: 'inline' | 'split' | 'confidence'

  const sample = state.current;
  const fmtView = state.formatView || 'inline';

  return (
    <div style={{padding:'24px 32px', height:'100%', overflowY:'auto'}}>
      <SectionHeader
        title="Capture"
        subtitle={prefs.zeroUI ? "Zero-UI menubar capture is on. Studio mirrors every clip you take." : "Preview & confirm before paste."}
        action={
          <div style={{display:'flex', gap:8, alignItems:'center'}}>
            <Chip tone="neutral" dot icon={null}><span className="mono" style={{fontSize:11}}>gemma 3 · 4b · q4_k_m</span></Chip>
            <Chip tone="success" dot>local · llama.cpp</Chip>
            <Btn icon={<Icon.spark size={14}/>} variant="ghost" onClick={()=>dispatch({type:'demo:next'})}>Run demo</Btn>
          </div>
        }
      />

      {/* Big capture card */}
      <CaptureCard state={state} dispatch={dispatch}/>

      {state.phase === 'ready' && sample && (
        <div className="fade-up" style={{marginTop:20}}>
          {/* Transcript + format pipeline */}
          <Panel
            title="Transcript & intent"
            action={
              <Segmented
                size="sm"
                value={fmtView}
                onChange={(v)=>dispatch({type:'fmtView:set', v})}
                options={[
                  {value:'inline', label:'Inline chip'},
                  {value:'split',  label:'Split pane'},
                  {value:'confidence', label:'Confidence'},
                ]}
              />
            }
          >
            {fmtView === 'inline'   && <InlineChipView sample={sample}/>}
            {fmtView === 'split'    && <SplitPaneView sample={sample}/>}
            {fmtView === 'confidence' && <ConfidenceView sample={sample} selected={state.selectedFormat||sample.format} onPick={(f)=>dispatch({type:'format:pick', f})}/>}
          </Panel>

          {/* Formatted output */}
          <div style={{marginTop:14}}>
            <Panel
              title="Formatted output"
              action={
                <div style={{display:'flex', gap:8, alignItems:'center'}}>
                  <span className="mono" style={{fontSize:11, color:'var(--text-mute)'}}>
                    stt {sample.sttMs}ms · llm {sample.llmMs}ms
                  </span>
                  <Btn size="sm" icon={<Icon.copy size={13}/>} variant="ghost">Copy</Btn>
                </div>
              }
            >
              <FormattedOutput sample={sample} selected={state.selectedFormat||sample.format}/>
            </Panel>
          </div>

          {/* Tool calls */}
          {sample.tools.length > 0 && (
            <div style={{marginTop:14}}>
              <ToolCardStack tools={sample.tools} dispatch={dispatch}/>
            </div>
          )}

          {/* Routing bar */}
          <div style={{marginTop:14}}>
            <RoutingBar sample={sample} dispatch={dispatch}/>
          </div>
        </div>
      )}
    </div>
  );
}

function CaptureCard({state, dispatch}){
  const recording = state.phase === 'recording';
  const transcribing = state.phase === 'transcribing';
  const ready = state.phase === 'ready';
  const idle = state.phase === 'idle';

  return (
    <div style={{
      background:'var(--panel)',
      border:'1px solid var(--border)',
      borderRadius:'var(--r-xl)',
      padding:24,
      display:'flex', alignItems:'center', gap:24,
      boxShadow:'var(--shadow-1)',
      position:'relative', overflow:'hidden',
    }}>
      {/* subtle glow when recording */}
      {recording && (
        <div style={{
          position:'absolute', inset:0, pointerEvents:'none',
          background:'radial-gradient(ellipse at center, rgba(255,122,61,.07), transparent 60%)',
        }}/>
      )}

      <button
        onClick={()=>{
          if (idle) dispatch({type:'rec:start'});
          else if (recording) dispatch({type:'rec:stop'});
          else if (ready) dispatch({type:'reset'});
        }}
        style={{
          width:78, height:78, borderRadius:99,
          background: recording ? 'var(--accent)' : ready ? 'var(--bg3)' : 'var(--bg2)',
          border:'1px solid '+ (recording ? 'var(--accent)' : 'var(--border-hi)'),
          color: recording ? '#1a0f08' : 'var(--text)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'pointer',
          transition:'all .2s',
          flexShrink:0,
          animation: recording ? 'pulse 1.6s infinite' : 'none',
        }}
        title={recording?'Stop recording':'Start recording'}
        disabled={transcribing}
      >
        {recording ? <Icon.pause size={28}/> : transcribing ? <Spinner size={28}/> : <Icon.mic size={28} sw={1.8}/>}
      </button>

      <div style={{flex:1, minWidth:0}}>
        {idle && (
          <>
            <div style={{fontSize:18, fontWeight:500}}>Ready when you are.</div>
            <div style={{color:'var(--text-mute)', marginTop:4, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
              <span style={{whiteSpace:'nowrap'}}>Click the mic, or hold</span><Kbd>⌥</Kbd><Kbd>Space</Kbd><span style={{whiteSpace:'nowrap'}}>anywhere.</span>
            </div>
          </>
        )}
        {recording && (
          <>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:8}}>
              <RecDot/>
              <span style={{fontWeight:500}}>Recording</span>
              <span className="mono" style={{color:'var(--text-mute)'}}>{formatTime(state.elapsed)}</span>
              <span style={{marginLeft:'auto', fontSize:12, color:'var(--text-mute)'}}>insanely-fast-whisper · large-v3</span>
            </div>
            <Waveform active={true} height={42}/>
          </>
        )}
        {transcribing && (
          <>
            <div style={{fontSize:16, fontWeight:500, display:'flex', alignItems:'center', gap:8}}>
              Transcribing<span className="caret"></span>
            </div>
            <div style={{display:'flex', gap:12, marginTop:8, color:'var(--text-mute)', fontSize:12}}>
              <span>insanely-fast-whisper · {state.elapsed.toFixed(1)}s audio</span>
              <span>·</span>
              <span>Gemma cleanup queued</span>
            </div>
          </>
        )}
        {ready && state.current && (
          <>
            <div style={{display:'flex', alignItems:'center', gap:10, flexWrap:'wrap'}}>
              <FormatChip format={state.selectedFormat||state.current.format} confidence={state.current.confidence}/>
              <span style={{color:'var(--text)', fontWeight:500, whiteSpace:'nowrap'}}>{state.current.title}</span>
              <span className="mono" style={{color:'var(--text-mute)', fontSize:12, whiteSpace:'nowrap'}}>{formatTime(state.current.duration)} · {((state.current.sttMs+state.current.llmMs)/1000).toFixed(2)}s end-to-end</span>
            </div>
            <div style={{color:'var(--text-mute)', marginTop:6, fontSize:13}}>
              Ready to send. Routing → <strong style={{color:'var(--text)', fontWeight:500}}>{state.current.routedTo}</strong>.
            </div>
          </>
        )}
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:6, alignItems:'flex-end'}}>
        {(idle || ready) && <Btn variant="ghost" size="sm" kbd="⌥B" onClick={()=>dispatch({type:'nav:go', v:'bench'})}>Bench →</Btn>}
        {recording && <Btn variant="ghost" size="sm" kbd="esc" onClick={()=>dispatch({type:'rec:cancel'})}>Cancel</Btn>}
        {ready && <Btn variant="primary" size="md" kbd="↵" icon={<Icon.paste size={14}/>} onClick={()=>dispatch({type:'commit'})}>Paste & save</Btn>}
      </div>
    </div>
  );
}

/* ─── Format surface variants ───────────────────────────────────── */
function InlineChipView({sample}){
  // Highlight the trailing command words inline
  const fullText = sample.raw;
  // find trailing format command words
  const cmdPatterns = [
    /format (this )?as (a |an )?(markdown|md|checklist|check\s?list|list|bullet points|bullets|table|steps|email|prose).*$/i,
    /(make|create) (it |this |a |an )?(checklist|check\s?list|list|markdown|bullet points|table|todo).*$/i,
    /save (it |this )?(as|to) [^.]*$/i,
    /add (it |this )?to (my )?calendar.*$/i,
  ];
  let cmdStart = -1;
  for (const re of cmdPatterns){
    const m = fullText.match(re);
    if (m && m.index !== undefined){ cmdStart = m.index; break; }
  }
  const head = cmdStart >= 0 ? fullText.slice(0, cmdStart) : fullText;
  const cmd  = cmdStart >= 0 ? fullText.slice(cmdStart) : '';

  return (
    <div>
      <div style={{fontSize:14, lineHeight:1.65, color:'var(--text-2)'}}>
        <span>{head}</span>
        {cmd && (
          <>
            <span style={{
              background:'rgba(255,122,61,.12)',
              color:'var(--accent-2)',
              borderBottom:'1px dashed var(--accent-2)',
              padding:'1px 2px',
              borderRadius:3,
            }}>{cmd}</span>
            <FormatChip format={sample.format} confidence={sample.confidence} style={{marginLeft:8, verticalAlign:'middle'}}/>
          </>
        )}
      </div>
      <div style={{marginTop:12, paddingTop:12, borderTop:'1px dashed var(--border)', fontSize:12, color:'var(--text-mute)', display:'flex', gap:14}}>
        <span><Icon.spark size={11}/> hybrid parser · regex matched in 0.3ms</span>
        <span>· content extracted, intent split off</span>
      </div>
    </div>
  );
}

function SplitPaneView({sample}){
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
      <div>
        <div style={{fontSize:11, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6}}>Content</div>
        <div style={{
          background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)',
          padding:'10px 12px', fontSize:13.5, lineHeight:1.6, color:'var(--text-2)',
        }}>
          {sample.cleaned}
        </div>
      </div>
      <div>
        <div style={{fontSize:11, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6}}>Intent</div>
        <div style={{
          background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)',
          padding:'10px 12px',
        }}>
          <div className="mono" style={{fontSize:12.5, lineHeight:1.9}}>
            <div><span style={{color:'var(--text-mute)'}}>format </span><span style={{color:'var(--accent-2)'}}>{sample.format}</span></div>
            <div><span style={{color:'var(--text-mute)'}}>title  </span><span style={{color:'var(--text)'}}>"{sample.title}"</span></div>
            {sample.tools.length>0 && <div><span style={{color:'var(--text-mute)'}}>tool   </span><span style={{color:'var(--blue)'}}>{sample.tools[0].kind}</span></div>}
            <div><span style={{color:'var(--text-mute)'}}>route  </span><span style={{color:'var(--success)'}}>{sample.routedTo}</span></div>
            <div><span style={{color:'var(--text-mute)'}}>conf   </span><span>{sample.confidence.toFixed(2)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ConfidenceView({sample, selected, onPick}){
  return (
    <div>
      <div style={{fontSize:13, color:'var(--text-2)', marginBottom:14, lineHeight:1.6}}>
        {sample.cleaned}
      </div>
      <div style={{display:'flex', flexDirection:'column', gap:6}}>
        {sample.alternates.map(a=>{
          const sel = selected === a.format;
          const m = FORMAT_META[a.format];
          return (
            <button
              key={a.format}
              onClick={()=>onPick(a.format)}
              style={{
                display:'grid', gridTemplateColumns:'140px 1fr 56px',
                gap:12, alignItems:'center',
                padding:'8px 10px',
                background: sel ? 'var(--bg3)' : 'transparent',
                border:'1px solid '+ (sel?'var(--border-hi)':'var(--border)'),
                borderRadius:'var(--r-md)',
                cursor:'pointer', textAlign:'left',
                transition:'all .12s',
              }}
            >
              <span style={{display:'flex', alignItems:'center', gap:8}}>
                <span className="mono" style={{color:'var(--text-mute)', width:14, textAlign:'center'}}>{m.icon}</span>
                <span style={{fontWeight: sel?600:500}}>{m.label}</span>
              </span>
              <div style={{height:6, borderRadius:99, background:'var(--bg3)', overflow:'hidden', position:'relative'}}>
                <div style={{
                  position:'absolute', left:0, top:0, bottom:0,
                  width: `${a.confidence*100}%`,
                  background: sel ? 'var(--accent)' : 'var(--border-hi)',
                }}/>
              </div>
              <span className="mono" style={{textAlign:'right', color:'var(--text-2)', fontSize:13}}>{a.confidence.toFixed(2)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FormattedOutput({sample, selected}){
  const fmt = selected || sample.format;
  const content = sample.formatted[fmt] || sample.formatted[Object.keys(sample.formatted)[0]];
  return (
    <div style={{
      background:'var(--bg2)',
      border:'1px solid var(--border)',
      borderRadius:'var(--r-md)',
      padding:'14px 16px',
      fontFamily: fmt === 'markdown' || fmt === 'list' || fmt === 'check' || fmt === 'steps' ? 'var(--font-mono)' : 'var(--font-sans)',
      fontSize: 13.5,
      lineHeight: 1.65,
      whiteSpace:'pre-wrap',
      color:'var(--text)',
    }}>
      {content}
    </div>
  );
}

/* ─── Tool card stack ───────────────────────────────────────────── */
function ToolCardStack({tools, dispatch}){
  return (
    <div style={{display:'flex', flexDirection:'column', gap:8}}>
      {tools.map((t,i)=> <ToolCard key={i} tool={t} dispatch={dispatch} idx={i}/>)}
    </div>
  );
}

function ToolCard({tool, dispatch, idx}){
  const toneByStatus = {pending:'warning', done:'success', error:'danger'};
  const iconFor = {
    'calendar.create_event': <Icon.calendar size={14}/>,
    'obsidian.append': <Icon.obsidian size={14}/>,
    'file.write': <Icon.file size={14}/>,
    'clipboard.copy': <Icon.copy size={14}/>,
  };
  return (
    <div style={{
      background:'var(--panel)',
      border:'1px solid '+ (tool.status==='pending' ? 'rgba(245,193,80,.4)' : 'var(--border)'),
      borderRadius:'var(--r-lg)',
      padding:'12px 14px',
      display:'flex', alignItems:'center', gap:14,
    }}>
      <div style={{
        width:32, height:32, borderRadius:8,
        background:'var(--bg2)', border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center',
        color:'var(--text-2)',
      }}>{iconFor[tool.kind] || <Icon.bolt size={14}/>}</div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:8}}>
          <span className="mono" style={{fontSize:13, fontWeight:500}}>{tool.kind}</span>
          <Chip tone={toneByStatus[tool.status]} dot>{tool.status === 'pending' ? 'needs permission' : tool.status === 'done' ? 'completed' : 'failed'}</Chip>
        </div>
        <div className="mono" style={{fontSize:11.5, color:'var(--text-mute)', marginTop:3, lineHeight:1.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis'}}>
          {Object.entries(tool.args).map(([k,v])=>(
            <span key={k} style={{marginRight:10}}>
              <span style={{color:'var(--text-dim)'}}>{k}=</span>
              <span>{JSON.stringify(v)}</span>
            </span>
          ))}
        </div>
        {tool.result && <div style={{fontSize:12, color:'var(--success)', marginTop:3}}>→ {tool.result}</div>}
      </div>
      <div style={{display:'flex', gap:6}}>
        {tool.status === 'pending' && (
          <>
            <Btn size="sm" variant="ghost" onClick={()=>dispatch({type:'tool:deny', idx})}>Deny</Btn>
            <Btn size="sm" variant="primary" onClick={()=>dispatch({type:'tool:approve', idx})}>Allow</Btn>
          </>
        )}
        {tool.status === 'done' && (
          <Btn size="sm" variant="ghost" icon={<Icon.undo size={12}/>}>Undo</Btn>
        )}
      </div>
    </div>
  );
}

/* ─── Routing bar ───────────────────────────────────────────────── */
function RoutingBar({sample, dispatch}){
  const targets = [
    {id:'clipboard', label:'Clipboard',  icon:<Icon.copy size={14}/>},
    {id:'paste',     label:'Paste at cursor', icon:<Icon.paste size={14}/>},
    {id:'file',      label:'File (.md)',  icon:<Icon.file size={14}/>},
    {id:'obsidian',  label:'Obsidian',    icon:<Icon.obsidian size={14}/>},
    {id:'calendar',  label:'Calendar',    icon:<Icon.calendar size={14}/>},
  ];
  return (
    <div style={{
      display:'flex', gap:8, padding:10,
      background:'var(--panel)',
      border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)',
      alignItems:'center', flexWrap:'wrap',
    }}>
      <span style={{fontSize:12, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.06em', marginRight:6, whiteSpace:'nowrap'}}>Send to</span>
      {targets.map(t=>{
        const active = sample.routedTo === t.id;
        return (
          <Btn
            key={t.id}
            size="sm"
            icon={t.icon}
            active={active}
            onClick={()=>dispatch({type:'route:set', v:t.id})}
          >{t.label}</Btn>
        );
      })}
    </div>
  );
}

function formatTime(s){
  const m = Math.floor(s/60); const sec = Math.floor(s%60);
  return `${m}:${String(sec).padStart(2,'0')}`;
}

/* ─────────────────────────────────────────────────────────────────
   HISTORY VIEW
───────────────────────────────────────────────────────────────── */

const HISTORY_ITEMS = [
  { id:'h1', when:'Today · 10:14',   title:'Grocery run',             format:'check',    preview:'Milk, eggs, bread, bananas if they look good…', durationS:11, totalMs:850, starred:true,  route:'clipboard' },
  { id:'h2', when:'Today · 09:48',   title:'Standup — May 21',         format:'markdown', preview:'Shipped onboarding yesterday. Working on…',     durationS:14, totalMs:1130, starred:true,  route:'obsidian' },
  { id:'h3', when:'Today · 09:02',   title:'Parser idea',              format:'prose',    preview:'The parser should also handle the case where…', durationS:23, totalMs:1420, starred:false, route:'file' },
  { id:'h4', when:'Yesterday · 17:31', title:'Design sync — onboarding', format:'calendar', preview:'Set up a sync with the design team next…',     durationS:10, totalMs:860, starred:true,  route:'calendar' },
  { id:'h5', when:'Yesterday · 14:08', title:'Bug report draft',         format:'markdown', preview:'Repro: open settings, toggle dark mode twice…', durationS:34, totalMs:2010, starred:false, route:'clipboard' },
  { id:'h6', when:'Yesterday · 11:22', title:'Quick thank-you note',     format:'email',    preview:'Hey Jordan — thanks again for the intro to…',   durationS:18, totalMs:1300, starred:false, route:'clipboard' },
  { id:'h7', when:'Mon May 19',      title:'Reading list',             format:'list',     preview:'Designing data-intensive applications, the…',  durationS:12, totalMs:980,  starred:false, route:'file' },
  { id:'h8', when:'Sun May 18',      title:'Trip checklist',           format:'check',    preview:'Passport, phone charger, neck pillow, eye…',    durationS:21, totalMs:1610, starred:true,  route:'obsidian' },
];

function HistoryView({state, dispatch}){
  const [q, setQ] = vUseState('');
  const [filter, setFilter] = vUseState('all');
  const [sel, setSel] = vUseState('h1');

  const items = HISTORY_ITEMS.filter(it=>{
    if (filter === 'starred' && !it.starred) return false;
    if (filter === 'today' && !it.when.startsWith('Today')) return false;
    if (q && !(it.title.toLowerCase()+it.preview.toLowerCase()).includes(q.toLowerCase())) return false;
    return true;
  });
  const selected = HISTORY_ITEMS.find(i=>i.id===sel) || items[0];

  return (
    <div style={{height:'100%', display:'grid', gridTemplateColumns:'380px 1fr'}}>
      <div style={{borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', minHeight:0}}>
        <div style={{padding:'18px 18px 12px', borderBottom:'1px solid var(--border)'}}>
          <div style={{fontSize:18, fontWeight:600, marginBottom:10}}>History</div>
          <div style={{
            display:'flex', alignItems:'center', gap:8,
            background:'var(--bg2)', border:'1px solid var(--border)',
            borderRadius:'var(--r-md)', padding:'6px 10px',
          }}>
            <Icon.search size={13}/>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search transcripts…" style={{flex:1, background:'transparent'}}/>
            {q && <button onClick={()=>setQ('')} style={{color:'var(--text-mute)'}}><Icon.x size={12}/></button>}
          </div>
          <div style={{display:'flex', gap:6, marginTop:10}}>
            {[{id:'all',label:'All'},{id:'today',label:'Today'},{id:'starred',label:'Corpus ★'}].map(f=>(
              <Btn key={f.id} size="sm" variant={filter===f.id?'subtle':'ghost'} active={filter===f.id} onClick={()=>setFilter(f.id)}>{f.label}</Btn>
            ))}
          </div>
        </div>
        <div style={{flex:1, overflowY:'auto'}}>
          {items.length === 0 ? (
            <div style={{padding:20}}>
              <Empty title="No matches" hint="Try a different filter or search term." icon={<Icon.search size={20}/>}/>
            </div>
          ) : items.map(it=>(
            <button key={it.id} onClick={()=>setSel(it.id)} style={{
              width:'100%', textAlign:'left',
              padding:'12px 16px',
              borderBottom:'1px solid var(--border)',
              background: sel===it.id ? 'var(--bg2)' : 'transparent',
              borderLeft:'2px solid '+ (sel===it.id ? 'var(--accent)' : 'transparent'),
              cursor:'pointer',
              display:'flex', flexDirection:'column', gap:4,
              transition:'background .12s',
            }}
              onMouseEnter={e=>{if(sel!==it.id) e.currentTarget.style.background='var(--bg2)'}}
              onMouseLeave={e=>{if(sel!==it.id) e.currentTarget.style.background='transparent'}}
            >
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <span className="mono" style={{fontSize:11, color:'var(--text-mute)'}}>{it.when}</span>
                <span style={{color: it.starred ? 'var(--accent)' : 'var(--text-dim)'}}><Icon.star filled={it.starred}/></span>
              </div>
              <div style={{display:'flex', alignItems:'center', gap:8}}>
                <span style={{fontWeight:500, fontSize:14}}>{it.title}</span>
                <FormatChip format={it.format} compact/>
              </div>
              <div style={{color:'var(--text-mute)', fontSize:12.5, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{it.preview}</div>
              <div style={{display:'flex', gap:10, fontSize:11, color:'var(--text-dim)', marginTop:2}} className="mono">
                <span>{it.durationS}s</span>
                <span>·</span>
                <span>{(it.totalMs/1000).toFixed(2)}s e2e</span>
                <span>·</span>
                <span>→ {it.route}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div style={{padding:'28px 32px', overflowY:'auto'}}>
        {selected && <HistoryDetail item={selected}/>}
      </div>
    </div>
  );
}

function HistoryDetail({item}){
  // Use a sample if matching, else fabricate
  const sample = DEMO_SAMPLES.find(s=>s.title === item.title) || null;
  return (
    <div className="fade-in">
      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:6, flexWrap:'wrap'}}>
        <FormatChip format={item.format}/>
        <span className="mono" style={{fontSize:12, color:'var(--text-mute)'}}>{item.when}</span>
        <span className="mono" style={{fontSize:12, color:'var(--text-mute)'}}>· {item.durationS}s · {(item.totalMs/1000).toFixed(2)}s e2e</span>
        <span style={{marginLeft:'auto', display:'flex', gap:8}}>
          <Btn size="sm" icon={<Icon.star size={13} filled={item.starred}/>} variant="ghost">{item.starred?'In corpus':'Add to corpus'}</Btn>
          <Btn size="sm" icon={<Icon.copy size={13}/>} variant="ghost">Copy</Btn>
          <Btn size="sm" icon={<Icon.trash size={13}/>} variant="ghost"/>
        </span>
      </div>
      <h2 style={{fontSize:26, fontWeight:600, margin:'4px 0 18px', letterSpacing:'-.01em'}}>{item.title}</h2>

      <div style={{display:'grid', gap:14}}>
        <Panel title="Raw transcript" padding={true}>
          <div style={{fontSize:13.5, lineHeight:1.65, color:'var(--text-2)'}}>
            {sample ? sample.raw : `${item.preview} (full transcript not stored — enable in Settings › Privacy)`}
          </div>
        </Panel>
        <Panel title={`Formatted · ${FORMAT_META[item.format].label}`} padding={true}
          action={<Btn size="sm" icon={<Icon.copy size={12}/>} variant="ghost">Copy</Btn>}>
          <div style={{
            background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-md)',
            padding:'12px 14px', fontFamily:'var(--font-mono)', fontSize:13, lineHeight:1.65,
            whiteSpace:'pre-wrap',
          }}>
            {sample?.formatted?.[item.format] || `(formatted output for ${item.format})`}
          </div>
        </Panel>
        <div style={{display:'flex', gap:8}}>
          <Chip tone="success" icon={<Icon.check size={11}/>}>Routed to {item.route}</Chip>
          <Chip tone="blue">Replay through bench</Chip>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   BENCH VIEW — A/B Lab
───────────────────────────────────────────────────────────────── */

const BENCH_SAMPLES = [
  { id:'b1', title:'meeting-clip-3.wav', durationS:14.2,
    truth: "So I think the main thing we want to ship by Friday is the new onboarding flow, and, um, the data export feature.",
    ifw:   "So I think the main thing we want to ship by Friday is the new onboarding flow, and the data export feature.",
    apple: "so I think the main thing we want to ship by Friday is the new onboarding flow and um the data export feature",
    ifwMs: 410, appleMs: 620,
    ifwWer: 4.1, appleWer: 2.7,
  },
  { id:'b2', title:'grocery-list.wav', durationS:11.4,
    truth: "I need to grab milk, eggs, bread, and bananas if they look good.",
    ifw:   "I need to grab milk eggs bread and bananas if they look good",
    apple: "I need to grab milk, eggs, bread, and bananas if they look good.",
    ifwMs: 280, appleMs: 510,
    ifwWer: 5.4, appleWer: 1.9,
  },
  { id:'b3', title:'standup-may-21.wav', durationS:14.2,
    truth: "Shipped the new onboarding flow yesterday. Working on the data export job today. Blocked on the schema review for billing.",
    ifw:   "Shipped the new onboarding flow yesterday. Working on the data export job today. Blocked on the schema review for billing.",
    apple: "shipped the new onboarding flow yesterday working on the data export job today blocked on the schema review for billing",
    ifwMs: 380, appleMs: 590,
    ifwWer: 1.8, appleWer: 2.2,
  },
  { id:'b4', title:'noisy-cafe.wav', durationS:9.7,
    truth: "Let's get the proposal out before the call on Friday.",
    ifw:   "Let's get the proposal out before the call on Friday.",
    apple: "let's get the proposal out before the call Friday",
    ifwMs: 320, appleMs: 540,
    ifwWer: 0, appleWer: 6.2,
  },
  { id:'b5', title:'accented-en-1.wav', durationS:17.3,
    truth: "The library uses a custom tokenizer that handles code blocks and inline markup.",
    ifw:   "The library uses a custom tokenizer that handles code blocks and inline markup.",
    apple: "the library uses a custom tokeniser that handles code blocks an inline markup",
    ifwMs: 460, appleMs: 690,
    ifwWer: 2.0, appleWer: 4.4,
  },
];

function BenchView({state, dispatch}){
  const [tab, setTab] = vUseState('diff');
  const [sel, setSel] = vUseState('b1');
  const sample = BENCH_SAMPLES.find(s=>s.id===sel) || BENCH_SAMPLES[0];

  // Aggregate stats
  const stats = vUseMemo(()=>{
    const avg = (arr) => arr.reduce((a,b)=>a+b,0)/arr.length;
    return {
      ifwWer: avg(BENCH_SAMPLES.map(s=>s.ifwWer)).toFixed(2),
      appleWer: avg(BENCH_SAMPLES.map(s=>s.appleWer)).toFixed(2),
      ifwMs: Math.round(avg(BENCH_SAMPLES.map(s=>s.ifwMs))),
      appleMs: Math.round(avg(BENCH_SAMPLES.map(s=>s.appleMs))),
    };
  },[]);

  return (
    <div style={{padding:'24px 32px', height:'100%', overflowY:'auto'}}>
      <SectionHeader
        title="Bench"
        subtitle="A/B lab — insanely-fast-whisper × Apple Speech, over a 24-clip corpus."
        action={
          <div style={{display:'flex', gap:8}}>
            <Chip tone="blue" dot>corpus · 24 clips</Chip>
            <Btn size="sm" variant="ghost" icon={<Icon.plus size={13}/>}>Add sample</Btn>
            <Btn size="sm" variant="primary" icon={<Icon.play size={12}/>}>Run full sweep</Btn>
          </div>
        }
      />

      <div style={{display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:20}}>
        {[
          {id:'diff',  label:'Diff',         badge:null},
          {id:'lead',  label:'Leaderboard',  badge:null},
          {id:'grid',  label:'Grid',         badge:null},
          {id:'blind', label:'Blind battle', badge:'wip'},
        ].map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            padding:'10px 16px',
            color: tab===t.id ? 'var(--text)' : 'var(--text-mute)',
            borderBottom:'2px solid '+ (tab===t.id ? 'var(--accent)' : 'transparent'),
            marginBottom:-1, fontSize:14, fontWeight: tab===t.id?600:500,
            display:'flex', alignItems:'center', gap:8,
            cursor:'pointer',
          }}>
            {t.label}
            {t.badge && <Chip tone="warning" style={{fontSize:10, padding:'1px 6px'}}>{t.badge}</Chip>}
          </button>
        ))}
        <div style={{marginLeft:'auto', display:'flex', alignItems:'center', gap:10, paddingBottom:8, fontSize:12, color:'var(--text-mute)'}} className="mono">
          <span>Last run: 14 min ago</span>
          <span>·</span>
          <span style={{color:'var(--success)'}}>IFW {stats.ifwWer}% WER</span>
          <span>vs</span>
          <span style={{color:'var(--success)'}}>Apple {stats.appleWer}% WER</span>
        </div>
      </div>

      {tab === 'diff' && <BenchDiff samples={BENCH_SAMPLES} sel={sel} setSel={setSel} sample={sample}/>}
      {tab === 'lead' && <BenchLeaderboard stats={stats}/>}
      {tab === 'grid' && <BenchGrid samples={BENCH_SAMPLES}/>}
      {tab === 'blind' && <BenchBlind/>}
    </div>
  );
}

function BenchDiff({samples, sel, setSel, sample}){
  const diffIfw = vUseMemo(()=>diffTokens(sample.truth, sample.ifw), [sample.id]);
  const diffApple = vUseMemo(()=>diffTokens(sample.truth, sample.apple), [sample.id]);
  return (
    <div style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:18}}>
      {/* sample picker */}
      <div>
        <div style={{fontSize:11, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8}}>Samples</div>
        <div style={{display:'flex', flexDirection:'column', gap:4}}>
          {samples.map(s=>(
            <button key={s.id} onClick={()=>setSel(s.id)} style={{
              textAlign:'left', padding:'8px 10px',
              background: sel===s.id ? 'var(--bg2)' : 'transparent',
              border:'1px solid '+ (sel===s.id ? 'var(--border-hi)' : 'transparent'),
              borderRadius:'var(--r-md)', cursor:'pointer',
              transition:'all .12s',
            }}>
              <div className="mono" style={{fontSize:12.5, color: sel===s.id ? 'var(--text)' : 'var(--text-2)'}}>{s.title}</div>
              <div style={{fontSize:11, color:'var(--text-mute)', marginTop:2}}>{s.durationS}s</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{display:'flex', flexDirection:'column', gap:14}}>
        <div style={{
          background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)',
          padding:14, display:'flex', alignItems:'center', gap:14,
        }}>
          <Btn size="md" variant="subtle" icon={<Icon.play size={14}/>}>Play</Btn>
          <Waveform amplitudes={null} dim height={34}/>
          <span className="mono" style={{fontSize:12, color:'var(--text-mute)', whiteSpace:'nowrap'}}>{sample.durationS}s</span>
        </div>

        <Panel
          title="Ground truth"
          padding={true}
        >
          <div style={{fontSize:14, lineHeight:1.7, color:'var(--text)'}}>{sample.truth}</div>
        </Panel>

        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
          <Panel title="insanely-fast-whisper"
            action={
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <Chip tone={sample.ifwWer < sample.appleWer ? 'success':'neutral'} dot>WER {sample.ifwWer}%</Chip>
                <span className="mono" style={{fontSize:11, color:'var(--text-mute)'}}>{sample.ifwMs}ms</span>
              </div>
            }>
            <div style={{fontSize:13.5}}><DiffText tokens={diffIfw.b}/></div>
          </Panel>
          <Panel title="Apple Speech"
            action={
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <Chip tone={sample.appleWer < sample.ifwWer ? 'success':'neutral'} dot>WER {sample.appleWer}%</Chip>
                <span className="mono" style={{fontSize:11, color:'var(--text-mute)'}}>{sample.appleMs}ms</span>
              </div>
            }>
            <div style={{fontSize:13.5}}><DiffText tokens={diffApple.b}/></div>
          </Panel>
        </div>
      </div>
    </div>
  );
}

function BenchLeaderboard({stats}){
  const rows = [
    {rank:1, name:'Apple Speech',           wer:stats.appleWer, latency:stats.appleMs, size:'OS',   local:true,  badge:'on-device'},
    {rank:2, name:'insanely-fast-whisper',  wer:stats.ifwWer,   latency:stats.ifwMs,   size:'1.5GB',local:true,  badge:'fastest',  highlight:true},
    {rank:3, name:'whisper.cpp · large-v3', wer:3.9,            latency:540,           size:'1.5GB',local:true},
    {rank:4, name:'faster-whisper · large', wer:3.3,            latency:480,           size:'1.5GB',local:true},
    {rank:5, name:'MLX whisper · large',    wer:3.7,            latency:430,           size:'1.5GB',local:true},
    {rank:6, name:'OpenAI Whisper (cloud)', wer:1.8,            latency:1400,          size:'—',     local:false, badge:'baseline'},
  ];
  return (
    <div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20}}>
        <Stat label="Best WER (local)" value="2.20%" sub="Apple Speech" tone="success"/>
        <Stat label="Fastest (local)"  value="0.41s" sub="insanely-fast-whisper" tone="accent"/>
        <Stat label="Corpus size"      value="24" sub="clips · 4m 22s total" />
        <Stat label="Avg clip length"  value="10.9s" sub="0.6s std dev" />
      </div>
      <Panel padding={false}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13.5}}>
          <thead>
            <tr style={{background:'var(--bg2)', borderBottom:'1px solid var(--border)'}}>
              {['#','Engine','WER ↓','Latency','Model','Local','','—'].map((h,i)=>(
                <th key={i} style={{textAlign:'left', padding:'10px 14px', fontWeight:600, color:'var(--text-mute)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'.06em'}}>{h==='—'?'':h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.rank} style={{
                borderBottom:'1px solid var(--border)',
                background: r.highlight ? 'rgba(255,122,61,.04)' : 'transparent',
              }}>
                <td style={{padding:'12px 14px'}}><span className="mono" style={{color:'var(--text-mute)'}}>{r.rank}</span></td>
                <td style={{padding:'12px 14px', fontWeight:500}}>{r.name}</td>
                <td style={{padding:'12px 14px'}} className="mono"><span style={{color: r.wer<3?'var(--success)':r.wer<5?'var(--text)':'var(--warning)'}}>{r.wer.toString().includes('.')?r.wer:r.wer+'.00'}%</span></td>
                <td style={{padding:'12px 14px'}} className="mono">{r.latency}ms</td>
                <td style={{padding:'12px 14px', color:'var(--text-mute)'}} className="mono">{r.size}</td>
                <td style={{padding:'12px 14px'}}>{r.local ? <Chip tone="success">local</Chip> : <Chip tone="warning">cloud</Chip>}</td>
                <td style={{padding:'12px 14px'}}>{r.badge && <Chip tone="accent">{r.badge}</Chip>}</td>
                <td style={{padding:'12px 14px', textAlign:'right'}}><Btn size="sm" variant="ghost" icon={<Icon.chevR size={12}/>}/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}

function Stat({label, value, sub, tone='neutral'}){
  const tones = {success:'var(--success)', accent:'var(--accent)', warning:'var(--warning)', neutral:'var(--text)'};
  return (
    <div style={{
      background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)',
      padding:'14px 16px',
    }}>
      <div style={{fontSize:11, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.06em'}}>{label}</div>
      <div className="mono" style={{fontSize:26, fontWeight:600, marginTop:4, color:tones[tone], letterSpacing:'-.02em'}}>{value}</div>
      <div style={{fontSize:12, color:'var(--text-mute)', marginTop:2}}>{sub}</div>
    </div>
  );
}

function BenchGrid({samples}){
  const engines = ['IFW','Apple','wcpp','faster','MLX','cloud'];
  // synthesize WER per sample × engine
  function werFor(s, e){
    if (e==='IFW') return s.ifwWer;
    if (e==='Apple') return s.appleWer;
    if (e==='wcpp') return Math.max(.5, s.ifwWer*1.1 + 0.4);
    if (e==='faster') return Math.max(.5, s.ifwWer*0.95);
    if (e==='MLX') return Math.max(.5, s.ifwWer*1.05);
    if (e==='cloud') return Math.max(.4, s.appleWer*0.7);
  }
  function cellColor(v, vs){
    const min = Math.min(...vs), max = Math.max(...vs);
    if (v === min) return 'rgba(92,199,138,.18)';
    if (v === max) return 'rgba(232,92,92,.15)';
    return 'rgba(245,193,80,.10)';
  }
  return (
    <Panel padding={false}>
      <table style={{width:'100%', borderCollapse:'collapse', fontSize:13}}>
        <thead>
          <tr style={{background:'var(--bg2)', borderBottom:'1px solid var(--border)'}}>
            <th style={{padding:'10px 14px', textAlign:'left', color:'var(--text-mute)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'.06em'}}>Sample</th>
            {engines.map(e=>(
              <th key={e} style={{padding:'10px 14px', textAlign:'center', color:'var(--text-mute)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'.06em'}}>{e}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {samples.map(s=>{
            const vs = engines.map(e=>werFor(s,e));
            return (
              <tr key={s.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={{padding:'10px 14px'}}><span className="mono" style={{color:'var(--text-2)'}}>{s.title}</span></td>
                {engines.map((e,i)=>(
                  <td key={e} className="mono" style={{
                    padding:'10px 14px', textAlign:'center',
                    background: cellColor(vs[i], vs),
                  }}>{vs[i].toFixed(1)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{background:'var(--bg2)', borderTop:'1px solid var(--border)'}}>
            <td style={{padding:'10px 14px', fontWeight:600, color:'var(--text-mute)', fontSize:12}}>Avg WER</td>
            {engines.map(e=>{
              const avg = samples.reduce((a,s)=>a+werFor(s,e),0)/samples.length;
              return <td key={e} className="mono" style={{padding:'10px 14px', textAlign:'center', fontWeight:600}}>{avg.toFixed(1)}</td>;
            })}
          </tr>
        </tfoot>
      </table>
    </Panel>
  );
}

function BenchBlind(){
  const [picked, setPicked] = vUseState(null);
  const [round, setRound] = vUseState(7);
  const elo = {ifw:1042, apple:1058};
  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <span className="mono" style={{color:'var(--text-mute)', fontSize:12}}>round {round} / 20</span>
        <span className="mono" style={{color:'var(--text-mute)', fontSize:12}}>elo so far · A {elo.ifw} · B {elo.apple}</span>
      </div>
      <div style={{
        background:'var(--panel)', border:'1px solid var(--border)', borderRadius:'var(--r-lg)',
        padding:16, marginBottom:18, display:'flex', alignItems:'center', gap:14,
      }}>
        <Btn size="md" variant="subtle" icon={<Icon.play size={14}/>}>Play clip #7</Btn>
        <Waveform dim/>
        <span className="mono" style={{color:'var(--text-mute)', fontSize:12}}>13.4s</span>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:14}}>
        <BlindOption letter="A" selected={picked==='A'} onClick={()=>setPicked('A')} text="So I think the main thing we wanna ship by Friday is the new onboarding flow and, um, the data export feature."/>
        <BlindOption letter="B" selected={picked==='B'} onClick={()=>setPicked('B')} text="so I think the main thing we wanna ship by Friday is the new onboarding flow and the data export feature"/>
      </div>
      <div style={{display:'flex', gap:10, marginTop:18, justifyContent:'center'}}>
        <Btn size="lg" variant={picked==='A'?'primary':'default'} onClick={()=>{setPicked('A'); setTimeout(()=>{setRound(r=>r+1); setPicked(null);}, 600);}}>A better</Btn>
        <Btn size="lg" variant="subtle" onClick={()=>{setRound(r=>r+1); setPicked(null);}}>Tie</Btn>
        <Btn size="lg" variant={picked==='B'?'primary':'default'} onClick={()=>{setPicked('B'); setTimeout(()=>{setRound(r=>r+1); setPicked(null);}, 600);}}>B better</Btn>
      </div>
    </div>
  );
}
function BlindOption({letter, text, selected, onClick}){
  return (
    <button onClick={onClick} style={{
      textAlign:'left',
      padding:16,
      background: selected ? 'var(--bg3)' : 'var(--panel)',
      border:'1px solid '+ (selected?'var(--accent)':'var(--border)'),
      borderRadius:'var(--r-lg)',
      cursor:'pointer',
      transition:'all .12s',
    }}>
      <div className="mono" style={{fontSize:11, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>option {letter}</div>
      <div style={{fontSize:14, lineHeight:1.65, color:'var(--text)'}}>{text}</div>
    </button>
  );
}

/* ─────────────────────────────────────────────────────────────────
   VOCAB VIEW — learnable format commands
───────────────────────────────────────────────────────────────── */

const VOCAB_INITIAL = [
  {id:1, phrase:'format as markdown',     target:{type:'format', value:'markdown'}, builtin:true,  hits:142},
  {id:2, phrase:'make a checklist',       target:{type:'format', value:'check'},    builtin:true,  hits:88},
  {id:3, phrase:'make a list / bullet points', target:{type:'format', value:'list'}, builtin:true,  hits:61},
  {id:4, phrase:'numbered steps',         target:{type:'format', value:'steps'},    builtin:true,  hits:24},
  {id:5, phrase:'draft an email',         target:{type:'format', value:'email'},    builtin:true,  hits:11},
  {id:6, phrase:'add to my calendar',     target:{type:'tool',   value:'calendar.create_event'}, builtin:true, hits:14},
  {id:7, phrase:'save to inbox',          target:{type:'tool',   value:'obsidian.append'},        builtin:true, hits:33},
  {id:8, phrase:'file an issue',          target:{type:'tool',   value:'github.create_issue'},    builtin:false,hits:2},
  {id:9, phrase:'log it in my journal',   target:{type:'tool',   value:'obsidian.append'},        builtin:false,hits:7},
];

function VocabView({state, dispatch}){
  const [items, setItems] = vUseState(VOCAB_INITIAL);
  const [adding, setAdding] = vUseState(false);
  const [draft, setDraft] = vUseState({phrase:'', type:'format', value:'list'});

  const formatOpts = Object.keys(FORMAT_META);
  const toolOpts = ['clipboard.copy','file.write','obsidian.append','calendar.create_event','github.create_issue'];

  function add(){
    if (!draft.phrase.trim()) return;
    setItems(arr => [...arr, {id:Date.now(), phrase:draft.phrase.trim(), target:{type:draft.type, value:draft.value}, builtin:false, hits:0}]);
    setDraft({phrase:'', type:'format', value:'list'});
    setAdding(false);
  }
  function remove(id){
    setItems(arr => arr.filter(i=>i.id!==id));
  }

  return (
    <div style={{padding:'24px 32px', height:'100%', overflowY:'auto'}}>
      <SectionHeader
        title="Vocabulary"
        subtitle="Trigger phrases the parser listens for at the end of every transcript. Add your own — they sit alongside built-ins."
        action={
          <Btn icon={<Icon.plus size={13}/>} variant="primary" onClick={()=>setAdding(true)}>Add phrase</Btn>
        }
      />

      {adding && (
        <div className="fade-up" style={{
          marginBottom:16,
          background:'var(--panel)', border:'1px solid var(--border-hi)',
          borderRadius:'var(--r-lg)', padding:16,
        }}>
          <div style={{display:'grid', gridTemplateColumns:'1fr auto auto auto', gap:10, alignItems:'center'}}>
            <input
              autoFocus
              className="field"
              placeholder='e.g. "log it as a bug"'
              value={draft.phrase}
              onChange={e=>setDraft({...draft, phrase:e.target.value})}
              onKeyDown={e=>{if(e.key==='Enter') add(); if(e.key==='Escape') setAdding(false);}}
            />
            <span className="mono" style={{fontSize:12, color:'var(--text-mute)'}}>→</span>
            <Segmented
              value={draft.type}
              onChange={(v)=>setDraft({...draft, type:v, value: v==='format'?'list':'obsidian.append'})}
              options={[
                {value:'format', label:'Format'},
                {value:'tool', label:'Tool'},
              ]}
            />
            <select
              className="field"
              style={{width:170}}
              value={draft.value}
              onChange={e=>setDraft({...draft, value:e.target.value})}
            >
              {(draft.type==='format'?formatOpts:toolOpts).map(o=>(
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div style={{display:'flex', gap:8, marginTop:10, justifyContent:'flex-end'}}>
            <Btn variant="ghost" onClick={()=>setAdding(false)}>Cancel</Btn>
            <Btn variant="primary" onClick={add} kbd="↵">Add</Btn>
          </div>
        </div>
      )}

      <Panel padding={false}>
        <table style={{width:'100%', borderCollapse:'collapse', fontSize:13.5}}>
          <thead>
            <tr style={{background:'var(--bg2)', borderBottom:'1px solid var(--border)'}}>
              <th style={{padding:'10px 14px', textAlign:'left', color:'var(--text-mute)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'.06em'}}>Phrase</th>
              <th style={{padding:'10px 14px', textAlign:'left', color:'var(--text-mute)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'.06em'}}>→ Maps to</th>
              <th style={{padding:'10px 14px', textAlign:'right', color:'var(--text-mute)', fontSize:11.5, textTransform:'uppercase', letterSpacing:'.06em'}}>Hits</th>
              <th style={{padding:'10px 14px', textAlign:'right'}}></th>
            </tr>
          </thead>
          <tbody>
            {items.map(it=>(
              <tr key={it.id} style={{borderBottom:'1px solid var(--border)'}}>
                <td style={{padding:'12px 14px'}}>
                  <div style={{display:'flex', alignItems:'center', gap:8}}>
                    <span className="mono" style={{color:'var(--text)'}}>"{it.phrase}"</span>
                    {it.builtin && <Chip tone="neutral" style={{fontSize:10}}>built-in</Chip>}
                  </div>
                </td>
                <td style={{padding:'12px 14px'}}>
                  {it.target.type === 'format' ?
                    <FormatChip format={it.target.value} compact/> :
                    <Chip tone="blue" icon={<Icon.bolt size={11}/>}><span className="mono" style={{fontSize:12}}>{it.target.value}</span></Chip>
                  }
                </td>
                <td className="mono" style={{padding:'12px 14px', textAlign:'right', color:'var(--text-mute)'}}>{it.hits}</td>
                <td style={{padding:'12px 14px', textAlign:'right'}}>
                  {!it.builtin && <Btn size="sm" variant="ghost" icon={<Icon.trash size={12}/>} onClick={()=>remove(it.id)}/>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <div style={{marginTop:18, padding:14, background:'var(--bg2)', border:'1px dashed var(--border)', borderRadius:'var(--r-lg)', display:'flex', gap:12, color:'var(--text-mute)', fontSize:13}}>
        <Icon.info size={16}/>
        <span><strong style={{color:'var(--text-2)'}}>How matching works:</strong> the hybrid parser tries an exact regex match first (microseconds). If nothing matches, Gemma classifies the trailing words against the vocab list — so close paraphrases like <em>"log this as a bug ticket"</em> still hit your <em>"file an issue"</em> rule.</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SETTINGS VIEW — including per-tool permissions
───────────────────────────────────────────────────────────────── */

const SETTINGS_TABS = [
  {id:'transcription', label:'Transcription', icon:<Icon.mic size={14}/>},
  {id:'model',         label:'Model',         icon:<Icon.cpu size={14}/>},
  {id:'hotkeys',       label:'Hotkeys',       icon:<Icon.bolt size={14}/>},
  {id:'tools',         label:'Tools',         icon:<Icon.bench size={14}/>},
  {id:'privacy',       label:'Privacy',       icon:<Icon.info size={14}/>},
];

function SettingsView({state, dispatch}){
  const [tab, setTab] = vUseState('tools');
  return (
    <div style={{height:'100%', display:'grid', gridTemplateColumns:'200px 1fr'}}>
      <div style={{borderRight:'1px solid var(--border)', padding:'18px 12px'}}>
        <div style={{fontSize:11, fontWeight:600, color:'var(--text-mute)', textTransform:'uppercase', letterSpacing:'.06em', padding:'4px 10px 10px'}}>Settings</div>
        {SETTINGS_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)} style={{
            width:'100%', textAlign:'left',
            padding:'8px 10px', borderRadius:'var(--r-md)',
            background: tab===t.id ? 'var(--bg2)' : 'transparent',
            color: tab===t.id ? 'var(--text)' : 'var(--text-mute)',
            display:'flex', alignItems:'center', gap:9,
            cursor:'pointer', marginBottom:2, fontSize:13.5,
            fontWeight: tab===t.id ? 600 : 500,
          }}
          onMouseEnter={e=>{if(tab!==t.id) e.currentTarget.style.background='var(--bg2)'}}
          onMouseLeave={e=>{if(tab!==t.id) e.currentTarget.style.background='transparent'}}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <div style={{padding:'24px 32px', overflowY:'auto'}}>
        {tab==='transcription' && <SettingsTranscription/>}
        {tab==='model'         && <SettingsModel/>}
        {tab==='hotkeys'       && <SettingsHotkeys/>}
        {tab==='tools'         && <SettingsTools/>}
        {tab==='privacy'       && <SettingsPrivacy state={state} dispatch={dispatch}/>}
      </div>
    </div>
  );
}

function Field({label, sub, children}){
  return (
    <div style={{display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center', padding:'14px 0', borderBottom:'1px solid var(--border)'}}>
      <div>
        <div style={{fontWeight:500, fontSize:14}}>{label}</div>
        {sub && <div style={{color:'var(--text-mute)', fontSize:12.5, marginTop:2}}>{sub}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function SettingsTranscription(){
  return (
    <div>
      <SectionHeader title="Transcription" subtitle="STT engines used by capture, and the shadow engine running for the bench corpus."/>
      <Field label="Primary engine" sub="Used for every capture, results go to the cursor.">
        <Chip tone="accent" dot>insanely-fast-whisper · large-v3</Chip>
      </Field>
      <Field label="Shadow engine" sub="Runs in parallel on every clip. Results feed the bench tab.">
        <Chip tone="blue" dot>Apple Speech</Chip>
      </Field>
      <Field label="Compute" sub="Apple Silicon Metal backend, fp16 weights.">
        <span className="mono" style={{color:'var(--text-2)', fontSize:13}}>Metal · fp16 · 8 threads</span>
      </Field>
      <Field label="Initial prompt" sub="Optional text passed to whisper as context (improves accuracy on jargon).">
        <input className="field" placeholder="(none)" style={{width:280}}/>
      </Field>
      <Field label="Language" sub="Detected per clip, override here.">
        <select className="field" style={{width:140}} defaultValue="auto">
          <option value="auto">Auto-detect</option>
          <option value="en">English</option>
        </select>
      </Field>
    </div>
  );
}

function SettingsModel(){
  return (
    <div>
      <SectionHeader title="Model" subtitle="The LLM that cleans transcripts, detects format intent, and drives tool calls."/>
      <Field label="Runtime">
        <Chip tone="accent" dot icon={<Icon.cpu size={11}/>}>llama.cpp</Chip>
      </Field>
      <Field label="Model" sub="GGUF, quantized.">
        <select className="field" style={{width:240}} defaultValue="gemma3-4b-q4">
          <option value="gemma3-4b-q4">gemma-3-4b-it · Q4_K_M (2.6 GB)</option>
          <option value="gemma3-12b-q4">gemma-3-12b-it · Q4_K_M (7.3 GB)</option>
          <option value="qwen2.5-7b-q4">qwen2.5-7b-instruct · Q4_K_M (4.4 GB)</option>
          <option value="llama3.1-8b-q4">llama-3.1-8b-instruct · Q4_K_M (4.7 GB)</option>
          <option value="phi4-14b-q4">phi-4-14b · Q4_K_M (8.4 GB)</option>
        </select>
      </Field>
      <Field label="Context window" sub="Tokens — larger = slower but handles longer clips.">
        <input type="range" min="2048" max="32768" step="1024" defaultValue="8192" style={{width:200}}/>
      </Field>
      <Field label="Temperature" sub="Lower = more deterministic formatting.">
        <input type="range" min="0" max="1" step="0.05" defaultValue="0.2" style={{width:200}}/>
      </Field>
      <Field label="Multi-agent (experimental)" sub="Routes through transcriber → cleaner → formatter → router agents via CrewAI.">
        <Switch on={false} onChange={()=>{}}/>
      </Field>
    </div>
  );
}

function SettingsHotkeys(){
  const keys = [
    {label:'Record (hold to talk)', keys:['⌥','Space']},
    {label:'Record (toggle)',       keys:['⌥','⇧','Space']},
    {label:'Force format: Markdown',keys:['⌥','M']},
    {label:'Force format: Checklist',keys:['⌥','K']},
    {label:'Open last',             keys:['⌥','L']},
    {label:'Open Bench',            keys:['⌥','B']},
    {label:'Discard / undo last',   keys:['⌥','⌫']},
  ];
  return (
    <div>
      <SectionHeader title="Hotkeys" subtitle="Hold-modifier hotkeys override voice commands when held — useful when you want to force a format the parser missed."/>
      {keys.map((k,i)=>(
        <Field key={i} label={k.label}>
          <div style={{display:'flex', gap:4}}>{k.keys.map((kk,j)=><Kbd key={j}>{kk}</Kbd>)}</div>
        </Field>
      ))}
    </div>
  );
}

function SettingsTools(){
  const initial = [
    {id:'clipboard.copy',         label:'Copy to clipboard',     desc:'Always-available; how outputs reach you in the menubar flow.', perm:'auto'},
    {id:'format.markdown',        label:'Format → Markdown',     desc:'Write .md output. No side effects beyond text.',                perm:'auto'},
    {id:'format.list',            label:'Format → List / check', desc:'Format-only transformations.',                                  perm:'auto'},
    {id:'file.write.inbox',       label:'Write to inbox folder', desc:'Writes into ~/Whispr/inbox/ only. You picked this folder.',     perm:'auto'},
    {id:'file.write.any',         label:'Write to other folders',desc:'Any path the agent specifies.',                                 perm:'ask'},
    {id:'obsidian.append.daily',  label:'Append to daily note',  desc:"Adds to today's note in your configured vault.",                perm:'auto'},
    {id:'obsidian.append.other',  label:'Append to other notes', desc:'Any path in the Obsidian vault.',                               perm:'ask'},
    {id:'calendar.create_event',  label:'Create calendar event', desc:'Adds events to your default macOS Calendar.',                   perm:'ask'},
    {id:'reminders.create',       label:'Create reminder',       desc:'Adds items to macOS Reminders.',                                perm:'ask'},
    {id:'github.create_issue',    label:'File a GitHub issue',   desc:'Repos must be allowlisted below.',                              perm:'ask'},
    {id:'shell.run',              label:'Run a shell command',   desc:'Allowlist-restricted. Off by default.',                         perm:'off'},
    {id:'web.search',             label:'Web search',            desc:'DuckDuckGo / Brave. Sends the query off-device.',               perm:'off'},
  ];
  const [perms, setPerms] = vUseState(initial);
  function set(id, perm){
    setPerms(arr => arr.map(p => p.id===id ? {...p, perm} : p));
  }
  return (
    <div>
      <SectionHeader
        title="Tools"
        subtitle="Decide which tool calls the agent can run on its own, which need a confirm, and which are off."
        action={
          <div style={{display:'flex', gap:6, fontSize:11, color:'var(--text-mute)'}} className="mono">
            <Chip tone="success">{perms.filter(p=>p.perm==='auto').length} auto</Chip>
            <Chip tone="warning">{perms.filter(p=>p.perm==='ask').length} ask</Chip>
            <Chip tone="danger">{perms.filter(p=>p.perm==='off').length} off</Chip>
          </div>
        }
      />
      <Panel padding={false}>
        {perms.map((p,i)=>(
          <div key={p.id} style={{
            display:'grid', gridTemplateColumns:'1fr auto', gap:14, alignItems:'center',
            padding:'14px 18px',
            borderBottom: i<perms.length-1 ? '1px solid var(--border)' : 'none',
          }}>
            <div>
              <div style={{display:'flex', alignItems:'center', gap:10}}>
                <span style={{fontWeight:500}}>{p.label}</span>
                <span className="mono" style={{fontSize:11, color:'var(--text-dim)'}}>{p.id}</span>
              </div>
              <div style={{color:'var(--text-mute)', fontSize:12.5, marginTop:2}}>{p.desc}</div>
            </div>
            <Segmented
              size="sm"
              value={p.perm}
              onChange={(v)=>set(p.id, v)}
              options={[
                {value:'auto', label:'Auto',  tone:'success', icon:<Icon.check size={11}/>},
                {value:'ask',  label:'Ask',   tone:'warning'},
                {value:'off',  label:'Off',   tone:'danger'},
              ]}
            />
          </div>
        ))}
      </Panel>
      <div style={{marginTop:16, padding:14, background:'var(--bg2)', border:'1px dashed var(--border)', borderRadius:'var(--r-lg)', display:'flex', gap:12, color:'var(--text-mute)', fontSize:13}}>
        <Icon.info size={16}/>
        <span><strong style={{color:'var(--text-2)'}}>Auto</strong> runs without prompt. <strong style={{color:'var(--text-2)'}}>Ask</strong> shows an inline confirm on the tool card with a "remember this choice" toggle. <strong style={{color:'var(--text-2)'}}>Off</strong> hides the tool from the model entirely.</span>
      </div>
    </div>
  );
}

function SettingsPrivacy({state, dispatch}){
  return (
    <div>
      <SectionHeader title="Privacy & data" subtitle="Whispr is local-first. Nothing leaves your machine unless you turn on a tool that explicitly does."/>
      <Field label="Keep raw audio" sub="Retains .wav files alongside transcripts. Needed for re-running through the bench.">
        <Switch on={true} onChange={()=>{}}/>
      </Field>
      <Field label="Audio retention" sub="Auto-delete clips after this long.">
        <select className="field" style={{width:140}} defaultValue="30d">
          <option value="never">Never</option>
          <option value="30d">30 days</option>
          <option value="7d">7 days</option>
          <option value="1d">24 hours</option>
        </select>
      </Field>
      <Field label="Anonymous error reports" sub="Sends stack traces only — no transcripts.">
        <Switch on={false} onChange={()=>{}}/>
      </Field>
      <Field label="Allow cloud fallback" sub="If a tool requires the internet (e.g. web.search), allow it.">
        <Switch on={false} onChange={()=>{}}/>
      </Field>
      <div style={{marginTop:20, padding:18, background:'rgba(92,199,138,.04)', border:'1px solid rgba(92,199,138,.2)', borderRadius:'var(--r-lg)', display:'flex', gap:14}}>
        <div style={{color:'var(--success)', flexShrink:0}}><Icon.check size={20}/></div>
        <div>
          <div style={{fontWeight:600, color:'var(--success)'}}>100% local right now</div>
          <div style={{color:'var(--text-2)', fontSize:13, marginTop:4, lineHeight:1.6}}>insanely-fast-whisper, Apple Speech, llama.cpp, and Gemma 3 are all on-device. No tool with cloud fallback is enabled.</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  CaptureView, HistoryView, BenchView, VocabView, SettingsView,
  DEMO_SAMPLES, HISTORY_ITEMS, BENCH_SAMPLES, SETTINGS_TABS,
});
