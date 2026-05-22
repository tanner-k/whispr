// studio-components.jsx — shared UI building blocks for Whispr Studio

const { useState, useEffect, useRef, useMemo, useCallback } = React;

/* ─── Icons (inline SVG, single stroke) ─────────────────────────── */
const Icon = {
  mic: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.sw||1.6} strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="12" rx="3"/>
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>
    </svg>
  ),
  history: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M12 7v5l3 2"/>
    </svg>
  ),
  bench: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h18M5 4v6a7 7 0 0 0 14 0V4"/>
      <path d="M9 21h6M12 17v4"/>
    </svg>
  ),
  vocab: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h12a4 4 0 0 1 4 4v12"/>
      <path d="M4 4v14a2 2 0 0 0 2 2h14"/>
      <path d="M8 9h6M8 13h4"/>
    </svg>
  ),
  settings: (p={}) => (
    <svg width={p.size||16} height={p.size||16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1A2 2 0 1 1 4.4 17l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.4l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1A2 2 0 1 1 19.6 7l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>
    </svg>
  ),
  search: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>
    </svg>
  ),
  star: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill={p.filled?'currentColor':'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 3 2.6 5.6 6 .7-4.5 4.2 1.2 6L12 16.8 6.7 19.5 8 13.5 3.5 9.3l6-.7z"/>
    </svg>
  ),
  check: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 12 5 5L20 6"/>
    </svg>
  ),
  x: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6 6 18"/>
    </svg>
  ),
  plus: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14"/>
    </svg>
  ),
  copy: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="11" height="11" rx="2"/>
      <path d="M5 15V5a2 2 0 0 1 2-2h10"/>
    </svg>
  ),
  paste: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="5" width="14" height="16" rx="2"/>
      <path d="M9 5V3h6v2M8 11h8M8 15h5"/>
    </svg>
  ),
  file: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/>
      <path d="M14 3v5h5"/>
    </svg>
  ),
  calendar: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="2"/>
      <path d="M3 10h18M8 3v4M16 3v4"/>
    </svg>
  ),
  obsidian: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3 4 9v10l8 2 8-2V9z"/>
      <path d="M12 3v8M4 9l8 2 8-2"/>
    </svg>
  ),
  undo: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 14 4 9l5-5"/>
      <path d="M4 9h11a5 5 0 0 1 5 5v0a5 5 0 0 1-5 5h-5"/>
    </svg>
  ),
  chevR: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 6 6 6-6 6"/>
    </svg>
  ),
  chevD: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m6 9 6 6 6-6"/>
    </svg>
  ),
  bolt: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2 4 14h7l-1 8 9-12h-7z"/>
    </svg>
  ),
  trash: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    </svg>
  ),
  filter: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 5h18l-7 9v5l-4 2v-7z"/>
    </svg>
  ),
  cpu: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="6" y="6" width="12" height="12" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <path d="M3 10h3M3 14h3M18 10h3M18 14h3M10 3v3M14 3v3M10 18v3M14 18v3"/>
    </svg>
  ),
  play: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M6 4v16l14-8z"/>
    </svg>
  ),
  pause: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="currentColor">
      <rect x="6" y="4" width="4" height="16" rx="1"/>
      <rect x="14" y="4" width="4" height="16" rx="1"/>
    </svg>
  ),
  spark: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6 8.4 8.4M15.6 15.6l2.8 2.8M5.6 18.4 8.4 15.6M15.6 8.4l2.8-2.8"/>
    </svg>
  ),
  info: (p={}) => (
    <svg width={p.size||14} height={p.size||14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M12 8h.01M11 12h1v5h1"/>
    </svg>
  ),
};

/* ─── Compact button ──────────────────────────────────────────── */
const compStyles = {
  btn: {
    display:'inline-flex', alignItems:'center', gap:6,
    padding:'6px 10px',
    border:'1px solid var(--border)',
    background:'var(--bg2)',
    borderRadius:'var(--r-md)',
    color:'var(--text)',
    fontSize:13, fontWeight:500,
    transition:'all .12s ease',
    whiteSpace:'nowrap',
    userSelect:'none',
  },
};

function Btn({children, onClick, variant='default', size='md', icon, disabled, title, kbd, style, active}){
  const base = {
    ...compStyles.btn,
    padding: size==='sm' ? '4px 8px' : size==='lg' ? '9px 14px' : '6px 10px',
    fontSize: size==='sm' ? 12 : 14,
    opacity: disabled ? .5 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
    ...style,
  };
  if (variant === 'primary') Object.assign(base, {
    background:'var(--accent)', borderColor:'var(--accent)',
    color:'#1a0f08', fontWeight:600,
  });
  if (variant === 'ghost') Object.assign(base, {
    background:'transparent', borderColor:'transparent',
    color:'var(--text-2)',
  });
  if (variant === 'subtle') Object.assign(base, {
    background:'var(--bg3)', borderColor:'transparent',
  });
  if (variant === 'danger') Object.assign(base, {
    background:'var(--bg2)', borderColor:'var(--danger-dim)',
    color:'var(--danger)',
  });
  if (active) Object.assign(base, {
    background:'var(--bg3)', borderColor:'var(--border-hi)',
    color:'var(--text)',
  });
  return (
    <button
      title={title}
      onClick={disabled?undefined:onClick}
      style={base}
      onMouseEnter={e=>{ if(!disabled){
        if(variant==='primary') e.currentTarget.style.background='var(--accent-2)';
        else if(variant==='ghost') e.currentTarget.style.background='var(--bg2)';
        else e.currentTarget.style.borderColor='var(--border-hi)';
      }}}
      onMouseLeave={e=>{
        if(variant==='primary') e.currentTarget.style.background='var(--accent)';
        else if(variant==='ghost') e.currentTarget.style.background='transparent';
        else e.currentTarget.style.borderColor= active?'var(--border-hi)':'var(--border)';
      }}
    >
      {icon}
      {children && <span>{children}</span>}
      {kbd && <Kbd>{kbd}</Kbd>}
    </button>
  );
}

function Kbd({children, style}){
  return (
    <span className="mono" style={{
      display:'inline-block', padding:'1px 5px', minWidth:18, textAlign:'center',
      borderRadius:4, fontSize:11,
      background:'rgba(255,255,255,.04)',
      border:'1px solid var(--border)',
      color:'var(--text-2)',
      marginLeft:4,
      ...style,
    }}>{children}</span>
  );
}

/* ─── Chip / Pill ─────────────────────────────────────────────── */
function Chip({children, tone='neutral', icon, style, dot, onClick}){
  const tones = {
    neutral: {bg:'var(--bg3)', fg:'var(--text-2)', bd:'var(--border)'},
    accent:  {bg:'rgba(255,122,61,.12)', fg:'var(--accent-2)', bd:'rgba(255,122,61,.25)'},
    success: {bg:'rgba(92,199,138,.10)', fg:'var(--success)', bd:'rgba(92,199,138,.25)'},
    warning: {bg:'rgba(245,193,80,.10)', fg:'var(--warning)', bd:'rgba(245,193,80,.25)'},
    danger:  {bg:'rgba(232,92,92,.10)', fg:'var(--danger)', bd:'rgba(232,92,92,.25)'},
    blue:    {bg:'rgba(122,174,255,.10)', fg:'var(--blue)', bd:'rgba(122,174,255,.25)'},
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span onClick={onClick} style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'2px 8px',
      background:t.bg, color:t.fg,
      border:`1px solid ${t.bd}`,
      borderRadius:999, fontSize:12, fontWeight:500,
      cursor: onClick?'pointer':'default',
      whiteSpace:'nowrap',
      ...style,
    }}>
      {dot && <span style={{width:6,height:6,borderRadius:99,background:t.fg,display:'inline-block'}}/>}
      {icon}
      {children}
    </span>
  );
}

/* ─── Panel ───────────────────────────────────────────────────── */
function Panel({children, title, action, style, padding=true}){
  return (
    <div style={{
      background:'var(--panel)',
      border:'1px solid var(--border)',
      borderRadius:'var(--r-lg)',
      overflow:'hidden',
      boxShadow:'var(--shadow-1)',
      ...style,
    }}>
      {(title||action) && (
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'10px 14px',
          borderBottom:'1px solid var(--border)',
          background:'var(--bg2)',
        }}>
          <div style={{fontSize:12, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.06em'}}>{title}</div>
          <div>{action}</div>
        </div>
      )}
      <div style={padding?{padding:14}:{}}>{children}</div>
    </div>
  );
}

/* ─── Section header (within views) ───────────────────────────── */
function SectionHeader({title, subtitle, action}){
  return (
    <div style={{
      display:'flex', alignItems:'flex-end', justifyContent:'space-between',
      gap:16, marginBottom:18,
    }}>
      <div>
        <div style={{fontSize:22, fontWeight:600, letterSpacing:'-.01em'}}>{title}</div>
        {subtitle && <div style={{color:'var(--text-mute)', fontSize:13, marginTop:2}}>{subtitle}</div>}
      </div>
      {action}
    </div>
  );
}

/* ─── Waveform ────────────────────────────────────────────────── */
// Either: animated (recording) or static (rendered from amplitudes array)
function Waveform({active=false, amplitudes, height=44, color='var(--accent)', barCount=64, dim=false}){
  // Use stable seed so wave bars don't reshuffle each render
  const bars = useMemo(()=>{
    if (amplitudes) return amplitudes;
    // pseudo-random heights, deterministic
    return Array.from({length:barCount}, (_,i)=>{
      const s = Math.sin(i*0.4)*.4 + Math.sin(i*0.13)*.35 + Math.cos(i*0.27)*.25;
      return Math.max(.18, Math.abs(s)*.9 + .1);
    });
  }, [amplitudes, barCount]);
  return (
    <div style={{display:'flex', alignItems:'center', justifyContent:'center', gap:2, height, width:'100%'}}>
      {bars.map((h,i)=>(
        <div key={i} style={{
          flex:1, maxWidth:4,
          height: `${h*100}%`,
          background: dim ? 'var(--border-hi)' : color,
          borderRadius:2,
          transformOrigin:'center',
          animation: active ? `waveBar ${0.6+(i%9)*0.06}s ease-in-out ${(i%17)*0.04}s infinite` : 'none',
          opacity: active ? .9 : dim ? .65 : 1,
        }}/>
      ))}
    </div>
  );
}

/* ─── Recording dot ───────────────────────────────────────────── */
function RecDot({size=8, style}){
  return <span style={{
    display:'inline-block', width:size, height:size, borderRadius:99,
    background:'var(--accent)',
    boxShadow:'0 0 8px rgba(255,122,61,.7)',
    animation:'blinkDot 1.1s infinite',
    ...style,
  }}/>
}

/* ─── Spinner ─────────────────────────────────────────────────── */
function Spinner({size=14}){
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{animation:'spin 0.9s linear infinite'}}>
      <circle cx="12" cy="12" r="9" stroke="var(--border-hi)" strokeWidth="2.4" fill="none"/>
      <path d="M21 12a9 9 0 0 0-9-9" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

/* ─── Toggle (3-state segmented for permissions, 2-state otherwise) ── */
function Segmented({options, value, onChange, size='md', style}){
  return (
    <div style={{
      display:'inline-flex',
      background:'var(--bg2)',
      border:'1px solid var(--border)',
      borderRadius:'var(--r-md)',
      padding:2,
      gap:2,
      ...style,
    }}>
      {options.map(opt=>{
        const sel = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={()=>onChange(opt.value)}
            style={{
              padding: size==='sm' ? '3px 8px' : '5px 12px',
              fontSize: size==='sm' ? 12 : 13,
              fontWeight:500,
              borderRadius:6,
              background: sel ? (opt.tone === 'success' ? 'rgba(92,199,138,.15)' : opt.tone === 'warning' ? 'rgba(245,193,80,.15)' : opt.tone==='danger' ? 'rgba(232,92,92,.12)' : 'var(--bg3)') : 'transparent',
              color: sel ? (opt.tone==='success'?'var(--success)':opt.tone==='warning'?'var(--warning)':opt.tone==='danger'?'var(--danger)':'var(--text)') : 'var(--text-mute)',
              cursor:'pointer',
              transition:'all .12s',
              display:'inline-flex', alignItems:'center', gap:5,
              whiteSpace:'nowrap',
            }}
          >
            {opt.icon}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function Switch({on, onChange}){
  return (
    <button onClick={()=>onChange(!on)} style={{
      width:34, height:20, borderRadius:99,
      background: on ? 'var(--accent)' : 'var(--bg3)',
      border:'1px solid '+(on?'var(--accent)':'var(--border)'),
      position:'relative', cursor:'pointer', padding:0,
      transition:'all .15s',
    }}>
      <span style={{
        position:'absolute', top:1, left: on?15:1,
        width:16, height:16, borderRadius:99,
        background: on ? '#1a0f08' : 'var(--text-mute)',
        transition:'left .15s ease',
      }}/>
    </button>
  );
}

/* ─── Format → human display ───────────────────────────────────── */
const FORMAT_META = {
  prose:    {label:'Prose',     icon:'¶',  tone:'neutral'},
  markdown: {label:'Markdown',  icon:'#',  tone:'blue'},
  list:     {label:'List',      icon:'•',  tone:'accent'},
  check:    {label:'Checklist', icon:'☐',  tone:'success'},
  steps:    {label:'Steps',     icon:'1.', tone:'warning'},
  table:    {label:'Table',     icon:'⊞',  tone:'neutral'},
  email:    {label:'Email',     icon:'✉',  tone:'blue'},
  calendar: {label:'Calendar',  icon:'📅', tone:'accent'},
};

function FormatChip({format, confidence, style, onClick, compact}){
  const m = FORMAT_META[format] || FORMAT_META.prose;
  return (
    <Chip tone={m.tone} onClick={onClick} style={style}>
      <span className="mono" style={{opacity:.8, fontWeight:600, fontSize:11}}>{m.icon}</span>
      <span style={{fontWeight:600}}>{m.label}</span>
      {!compact && confidence!==undefined && (
        <span className="mono" style={{opacity:.6, fontSize:11, marginLeft:2}}>{Math.round(confidence*100)}%</span>
      )}
    </Chip>
  );
}

/* ─── Word-level diff (simple) ─────────────────────────────────── */
// produces tokens with status: same / add / rem
function diffTokens(a, b){
  // very rough LCS-style diff at word level
  const A = a.split(/(\s+|[,.!?;:])/);
  const B = b.split(/(\s+|[,.!?;:])/);
  // Build LCS table
  const m=A.length, n=B.length;
  const dp = Array.from({length:m+1}, ()=>new Uint16Array(n+1));
  for(let i=m-1;i>=0;i--) for(let j=n-1;j>=0;j--){
    if (A[i].toLowerCase() === B[j].toLowerCase()) dp[i][j] = dp[i+1][j+1]+1;
    else dp[i][j] = Math.max(dp[i+1][j], dp[i][j+1]);
  }
  const outA=[], outB=[];
  let i=0,j=0;
  while(i<m && j<n){
    if (A[i].toLowerCase()===B[j].toLowerCase()){ outA.push({t:A[i],s:'same'}); outB.push({t:B[j],s:'same'}); i++;j++; }
    else if (dp[i+1][j] >= dp[i][j+1]){ outA.push({t:A[i],s:'rem'}); i++; }
    else { outB.push({t:B[j],s:'add'}); j++; }
  }
  while(i<m){ outA.push({t:A[i],s:'rem'}); i++; }
  while(j<n){ outB.push({t:B[j],s:'add'}); j++; }
  return {a:outA, b:outB};
}

function DiffText({tokens}){
  return (
    <span style={{lineHeight:1.7}}>
      {tokens.map((tok,i)=>{
        if (tok.s==='same') return <span key={i}>{tok.t}</span>;
        if (tok.s==='add') return <span key={i} style={{background:'rgba(92,199,138,.16)', color:'var(--success)', borderRadius:3, padding:'0 2px'}}>{tok.t}</span>;
        return <span key={i} style={{background:'rgba(232,92,92,.16)', color:'var(--danger)', borderRadius:3, padding:'0 2px', textDecoration:'line-through', textDecorationColor:'rgba(232,92,92,.5)'}}>{tok.t}</span>;
      })}
    </span>
  );
}

/* ─── Empty state ──────────────────────────────────────────────── */
function Empty({title, hint, icon}){
  return (
    <div style={{
      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
      gap:8, padding:'40px 20px', color:'var(--text-mute)',
      border:'1px dashed var(--border)', borderRadius:'var(--r-lg)',
      background:'var(--bg2)',
    }}>
      {icon}
      <div style={{fontSize:14, fontWeight:500, color:'var(--text-2)'}}>{title}</div>
      {hint && <div style={{fontSize:12}}>{hint}</div>}
    </div>
  );
}

/* ─── Export to window ─────────────────────────────────────────── */
Object.assign(window, {
  Icon, Btn, Kbd, Chip, Panel, SectionHeader,
  Waveform, RecDot, Spinner, Segmented, Switch,
  FORMAT_META, FormatChip, diffTokens, DiffText, Empty,
});
