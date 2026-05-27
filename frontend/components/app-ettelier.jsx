// Direction A — Atelier
// Editorial, serif, slow. Slim left rail. Generous whitespace. Hairlines.
// Magazine-style step numbers. One accent color.

function AtelierApp({ palette }) {
  const { screen, go, reset } = useScreen('welcome');
  const [favs, toggleFav] = useFavorites(['lob','waves','frenchbob']);
  const [quizState, setQuizState] = React.useState({});
  const [photos, setPhotos] = React.useState({ front: true, left: false, right: false });
  const [detailId, setDetailId] = React.useState(null);

  const openDetail = (id) => { setDetailId(id); go('detail'); };

  const styles = {
    root: {
      width:'100%', height:'100%', display:'flex',
      background:'var(--p-paper, #f7f1e8)',
      color:'var(--p-ink, #2a241d)',
      fontFamily: "'Inter', system-ui, sans-serif",
      fontSize: 14, lineHeight: 1.5,
    },
    rail: {
      width: 200, flexShrink: 0, borderRight: '1px solid rgba(0,0,0,.08)',
      padding: '28px 22px', display:'flex', flexDirection:'column', gap: 4,
    },
    brand: {
      fontFamily:"'Fraunces', serif", fontSize: 22, fontWeight: 400,
      fontVariationSettings: '"opsz" 144, "SOFT" 100',
      letterSpacing:-0.5, marginBottom: 28, lineHeight: 1.05,
    },
    main: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
  };

  const navItems = [
    { id:'welcome',   label:'Atelier', sub:'Home' },
    { id:'quiz',      label:'The Quiz' },
    { id:'upload',    label:'Photo Brief' },
    { id:'browse',    label:'Styles' },
    { id:'favorites', label:'Saved', count: favs.size },
    { id:'photos',    label:'My Photos' },
    { id:'profile',   label:'Account' },
  ];

  return (
    <div style={styles.root}>
      {/* RAIL */}
      <aside style={styles.rail}>
        <div style={styles.brand}>
          Atelier<br/>
          <span style={{fontStyle:'italic', fontFamily:"'Instrument Serif',serif", fontSize:20, color:'var(--p-muted,#a89c8c)'}}>Hair Studio</span>
        </div>
        {navItems.map((n) => {
          const active = screen === n.id || (n.id === 'browse' && screen === 'detail');
          return (
            <button key={n.id} onClick={() => reset(n.id)}
              style={{
                appearance:'none', background:'transparent', border:0, padding:'8px 0',
                textAlign:'left', cursor:'pointer', fontFamily:'inherit', fontSize:13,
                color: active ? 'var(--p-ink,#2a241d)' : 'var(--p-muted,#a89c8c)',
                fontWeight: active ? 600 : 400,
                letterSpacing: 0.02, display:'flex', justifyContent:'space-between', alignItems:'center',
                borderLeft: active ? `2px solid var(--p-accent,#d98a5f)` : '2px solid transparent',
                paddingLeft: 10, marginLeft: -10,
              }}>
              <span>{n.label}</span>
              {n.count != null && n.count > 0 && (
                <span style={{
                  fontFamily:"'DM Mono',monospace", fontSize:10, color:'var(--p-muted,#a89c8c)',
                  border:'1px solid currentColor', borderRadius:99, padding:'1px 6px',
                }}>{String(n.count).padStart(2,'0')}</span>
              )}
            </button>
          );
        })}
        <div style={{flex:1}} />
        <div style={{fontSize:10.5, color:'var(--p-muted,#a89c8c)', fontFamily:"'DM Mono',monospace", letterSpacing:0.04, textTransform:'uppercase'}}>
          Iss. 04 · 26
        </div>
      </aside>

      {/* MAIN */}
      <main style={styles.main}>
        {screen === 'welcome'   && <AtelierWelcome  go={go} />}
        {screen === 'quiz'      && <AtelierQuiz     go={go} state={quizState} setState={setQuizState} />}
        {screen === 'upload'    && <AtelierUpload   go={go} photos={photos} setPhotos={setPhotos} />}
        {screen === 'browse'    && <AtelierBrowse   go={openDetail} favs={favs} toggle={toggleFav} />}
        {screen === 'detail'    && <AtelierDetail   id={detailId} favs={favs} toggle={toggleFav} go={go} />}
        {screen === 'favorites' && <AtelierFavorites favs={favs} toggle={toggleFav} go={openDetail} />}
        {screen === 'photos'    && <AtelierPhotos   photos={photos} go={go} />}
        {screen === 'profile'   && <AtelierProfile  />}
      </main>
    </div>
  );
}

// ── Atelier · Welcome ──────────────────────────────────────────────────────
function AtelierWelcome({ go }) {
  return (
    <div style={{padding:'56px 64px', flex:1, display:'flex', flexDirection:'column', gap:36, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)'}}>
          Welcome ·  No. 01
        </div>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--p-muted,#a89c8c)'}}>
          May 27, 2026
        </div>
      </div>

      <h1 style={{
        fontFamily:"'Fraunces', serif", fontWeight: 300,
        fontVariationSettings:'"opsz" 144, "SOFT" 100',
        fontSize: 88, lineHeight: 0.95, letterSpacing:-2.4, margin:0,
        maxWidth: 820,
      }}>
        Find the cut <em style={{fontFamily:"'Instrument Serif',serif", fontWeight:400, fontStyle:'italic'}}>that already fits you.</em>
      </h1>

      <p style={{fontSize:17, lineHeight:1.55, maxWidth:560, color:'var(--p-ink,#2a241d)', opacity:0.85, margin:0}}>
        Six small questions. Three reference photos. A slow scroll of styles we think you'd love.
        Save the ones you want to bring to your stylist.
      </p>

      <div style={{display:'flex', gap:14, alignItems:'center', marginTop:8}}>
        <button onClick={() => go('quiz')}
          style={{
            background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)',
            border:0, padding:'14px 24px', fontFamily:'inherit', fontSize:14,
            letterSpacing:0.04, cursor:'pointer', display:'flex', alignItems:'center', gap:10,
          }}>
          Begin the quiz <Icons.Arrow width={16} height={16} />
        </button>
        <button onClick={() => go('browse')}
          style={{background:'transparent', color:'var(--p-ink,#2a241d)', border:0, padding:'14px 4px',
            fontFamily:'inherit', fontSize:14, cursor:'pointer', textDecoration:'underline', textUnderlineOffset:4}}>
          Just let me browse
        </button>
      </div>

      {/* hairline + featured grid */}
      <div style={{borderTop:'1px solid rgba(0,0,0,.1)', marginTop:24, paddingTop:28}}>
        <div style={{display:'flex', justifyContent:'space-between', marginBottom:14}}>
          <div style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:22}}>
            This month's editorial selection
          </div>
          <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--p-muted,#a89c8c)', textTransform:'uppercase', letterSpacing:0.06}}>
            04 looks
          </div>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
          {[HAIRSTYLES[0], HAIRSTYLES[10], HAIRSTYLES[13], HAIRSTYLES[15]].map((s, i) => (
            <div key={s.id} style={{display:'flex', flexDirection:'column', gap:8}}>
              <div style={{aspectRatio: '4/5'}}>
                <HairImage style={s} suffix="feat" />
              </div>
              <div style={{fontFamily:"'DM Mono',monospace", fontSize:10, color:'var(--p-muted,#a89c8c)', letterSpacing:0.06, textTransform:'uppercase'}}>
                No. {String(i+1).padStart(2,'0')}
              </div>
              <div style={{fontFamily:"'Fraunces', serif", fontSize:16, fontVariationSettings:'"opsz" 14, "SOFT" 100', lineHeight:1.15}}>{s.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Atelier · Quiz ─────────────────────────────────────────────────────────
function AtelierQuiz({ go, state, setState }) {
  const [step, setStep] = React.useState(0);
  const q = QUIZ[step];
  const total = QUIZ.length;
  const value = state[q.id];

  const setAnswer = (val) => {
    if (q.multi) {
      const cur = new Set(state[q.id] || []);
      if (cur.has(val)) cur.delete(val); else cur.add(val);
      setState({ ...state, [q.id]: [...cur] });
    } else {
      setState({ ...state, [q.id]: val });
    }
  };
  const isSelected = (v) => q.multi ? (value || []).includes(v) : value === v;
  const canNext = q.multi ? (value && value.length) : !!value;

  return (
    <div style={{padding:'48px 64px', flex:1, display:'flex', flexDirection:'column', overflow:'auto'}}>
      {/* step header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:36}}>
        <div>
          <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:8}}>
            Step {String(step+1).padStart(2,'0')} / {String(total).padStart(2,'0')}
          </div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144, "SOFT" 100', fontSize:42, letterSpacing:-1, lineHeight:1.05, margin:0, maxWidth:780}}>
            {q.title}
          </h2>
          {q.sub && <div style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:18, color:'var(--p-muted,#a89c8c)', marginTop:8}}>{q.sub}</div>}
        </div>
      </div>

      {/* options */}
      <div style={{display:'grid', gridTemplateColumns: q.options.length > 4 ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap:14, flex:1, alignContent:'flex-start'}}>
        {q.options.map((opt) => {
          const sel = isSelected(opt.value);
          return (
            <button key={opt.value} onClick={() => setAnswer(opt.value)}
              style={{
                appearance:'none', textAlign:'left',
                background: sel ? 'var(--p-ink,#2a241d)' : 'var(--p-card,#fff)',
                color: sel ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                border: '1px solid rgba(0,0,0,.1)',
                padding: 0, cursor:'pointer', display:'flex', flexDirection:'column',
                fontFamily:'inherit',
                transition:'background .15s, color .15s',
              }}>
              <div style={{aspectRatio:'5/4', position:'relative'}}>
                <StripedPlaceholder
                  bg={sel ? 'var(--p-ink,#2a241d)' : 'var(--p-stripe,#eadccb)'}
                  stripe={sel ? 'var(--p-muted,#a89c8c)' : 'var(--p-hairSoft,#f1c9b3)'}
                  angle={Math.random()*40 - 20} density={6}
                  showLabel={false}
                />
                {sel && <div style={{position:'absolute', top:10, right:10, color:'var(--p-paper,#f7f1e8)'}}><Icons.Check width={18} height={18} /></div>}
              </div>
              <div style={{padding:'14px 14px 16px'}}>
                <div style={{fontFamily:"'Fraunces',serif", fontSize:20, lineHeight:1.1, fontVariationSettings:'"opsz" 24'}}>{opt.label}</div>
                {opt.sub && <div style={{fontSize:12, marginTop:4, opacity:0.7}}>{opt.sub}</div>}
              </div>
            </button>
          );
        })}
      </div>

      {/* footer */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'1px solid rgba(0,0,0,.1)', paddingTop:16, marginTop:24}}>
        <button onClick={() => step > 0 ? setStep(step-1) : go('welcome')}
          style={{background:'transparent', border:0, padding:'8px 0', fontFamily:'inherit', fontSize:13, color:'var(--p-muted,#a89c8c)', cursor:'pointer', display:'flex', alignItems:'center', gap:8}}>
          <Icons.ArrowL width={14} height={14} /> Back
        </button>
        <div style={{display:'flex', gap:6}}>
          {QUIZ.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 28 : 14, height:2,
              background: i <= step ? 'var(--p-ink,#2a241d)' : 'rgba(0,0,0,.15)',
              transition:'width .2s',
            }} />
          ))}
        </div>
        <button disabled={!canNext}
          onClick={() => step < total - 1 ? setStep(step+1) : go('upload')}
          style={{
            background: canNext ? 'var(--p-ink,#2a241d)' : 'rgba(0,0,0,.08)',
            color: canNext ? 'var(--p-paper,#f7f1e8)' : 'var(--p-muted,#a89c8c)',
            border:0, padding:'12px 22px', fontFamily:'inherit', fontSize:13,
            cursor: canNext ? 'pointer' : 'default', display:'flex', alignItems:'center', gap:10,
          }}>
          {step === total - 1 ? 'Continue to photos' : 'Next'} <Icons.Arrow width={14} height={14} />
        </button>
      </div>
    </div>
  );
}

// ── Atelier · Upload ───────────────────────────────────────────────────────
function AtelierUpload({ go, photos, setPhotos }) {
  const slots = [
    { id:'front', label:'Front', sub:'Look straight ahead, hair back.' },
    { id:'left',  label:'Left side', sub:'Profile view, ear visible.' },
    { id:'right', label:'Right side', sub:'Other profile.' },
  ];
  const done = Object.values(photos).filter(Boolean).length;
  return (
    <div style={{padding:'48px 64px', flex:1, display:'flex', flexDirection:'column', overflow:'auto'}}>
      <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:8}}>
        Photo Brief · 03 of 03
      </div>
      <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144,"SOFT" 100', fontSize:42, letterSpacing:-1, margin:'0 0 8px'}}>
        Three reference photos.
      </h2>
      <div style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:18, color:'var(--p-muted,#a89c8c)', marginBottom:32}}>
        Natural light, hair off the face. Nothing fancy.
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20, marginBottom:24}}>
        {slots.map((s, i) => (
          <div key={s.id} style={{display:'flex', flexDirection:'column', gap:10}}>
            <div style={{aspectRatio:'3/4', position:'relative', background:'var(--p-stripe,#eadccb)'}}>
              <FaceSlot slot={s.id} label={s.label} />
            </div>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
              <div style={{fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)'}}>
                No. {String(i+1).padStart(2,'0')} · {s.label}
              </div>
            </div>
            <div style={{fontSize:12, color:'var(--p-muted,#a89c8c)'}}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{borderTop:'1px solid rgba(0,0,0,.1)', paddingTop:16, display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'auto'}}>
        <button onClick={() => go('quiz')} style={{background:'transparent', border:0, padding:'8px 0', fontSize:13, color:'var(--p-muted,#a89c8c)', cursor:'pointer', fontFamily:'inherit'}}>← Back</button>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, color:'var(--p-muted,#a89c8c)'}}>
          Drop any photo. Skip if you'd like to browse first.
        </div>
        <button onClick={() => go('browse')}
          style={{background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)', border:0, padding:'12px 22px', fontFamily:'inherit', fontSize:13, cursor:'pointer'}}>
          Show me styles →
        </button>
      </div>
    </div>
  );
}

// ── Atelier · Browse (Pinterest masonry) ───────────────────────────────────
function AtelierBrowse({ go, favs, toggle }) {
  const [filter, setFilter] = React.useState('All');
  const filters = ['All','Short','Medium','Long'];
  const items = filter === 'All' ? HAIRSTYLES : HAIRSTYLES.filter(h => h.length === filter);
  // CSS columns gives true masonry with variable-aspect items
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <div style={{padding:'40px 56px 20px', borderBottom:'1px solid rgba(0,0,0,.08)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:18}}>
          <div>
            <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:6}}>
              Curated for you
            </div>
            <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144,"SOFT" 100', fontSize:38, margin:0, letterSpacing:-0.8}}>
              <em style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic'}}>Eighteen</em> styles, soft-matched.
            </h2>
          </div>
          <div style={{display:'flex', gap:4, padding:4, border:'1px solid rgba(0,0,0,.1)'}}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  appearance:'none', border:0, padding:'7px 14px', fontFamily:'inherit', fontSize:12,
                  background: filter === f ? 'var(--p-ink,#2a241d)' : 'transparent',
                  color: filter === f ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                  cursor:'pointer',
                }}>{f}</button>
            ))}
          </div>
        </div>
      </div>

      <div style={{flex:1, padding:'24px 56px 40px', overflow:'auto'}}>
        <div style={{columnCount:4, columnGap:18}}>
          {items.map((s, i) => {
            const liked = favs.has(s.id);
            // give each tile a slightly different aspect for masonry rhythm
            const aspect = 1/s.ratio;
            return (
              <div key={s.id} style={{breakInside:'avoid', marginBottom:18}}>
                <div onClick={() => go(s.id)} style={{position:'relative', cursor:'pointer'}}>
                  <div style={{aspectRatio: `1 / ${s.ratio}`}}>
                    <HairImage style={s} />
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{
                      position:'absolute', top:10, right:10, width:32, height:32, borderRadius:'50%',
                      background: liked ? 'var(--p-ink,#2a241d)' : 'rgba(255,255,255,.92)',
                      color: liked ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                      border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                    <HeartIcon filled={liked} size={15} />
                  </button>
                </div>
                <div style={{padding:'10px 2px 4px'}}>
                  <div style={{fontFamily:"'Fraunces',serif", fontSize:16, fontVariationSettings:'"opsz" 18', lineHeight:1.1, marginBottom:3}}>
                    {s.name}
                  </div>
                  <div style={{fontSize:11, color:'var(--p-muted,#a89c8c)', display:'flex', gap:6, fontFamily:"'DM Mono',monospace", letterSpacing:0.04, textTransform:'uppercase'}}>
                    <span>{s.length}</span><span>·</span><span>{s.tags[0]}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Atelier · Detail ───────────────────────────────────────────────────────
function AtelierDetail({ id, favs, toggle, go }) {
  const s = HAIRSTYLES.find((h) => h.id === id) || HAIRSTYLES[0];
  const liked = favs.has(s.id);
  return (
    <div style={{flex:1, overflow:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'1.1fr 1fr', gap:48, padding:'40px 56px'}}>
        <div>
          <div style={{aspectRatio:'4/5', marginBottom:14}}>
            <HairImage style={s} />
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8}}>
            {[0.9, 1.1, 1.3].map((r, i) => (
              <div key={i} style={{aspectRatio:'1/1'}}>
                <StripedPlaceholder
                  bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)"
                  angle={s.angle + i*15} density={s.density - 1} showLabel={false}
                />
              </div>
            ))}
          </div>
        </div>
        <div>
          <button onClick={() => go('browse')}
            style={{background:'transparent', border:0, padding:'0 0 14px', fontFamily:'inherit', fontSize:12, color:'var(--p-muted,#a89c8c)', cursor:'pointer', display:'flex', alignItems:'center', gap:6}}>
            <Icons.ArrowL width={12} height={12}/> Back to styles
          </button>
          <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:6}}>
            {s.length} · {s.tags.join(' · ')}
          </div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144, "SOFT" 100', fontSize:52, letterSpacing:-1.4, lineHeight:1, margin:'0 0 18px'}}>
            {s.name}
          </h2>
          <p style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:19, lineHeight:1.4, color:'var(--p-muted,#a89c8c)', margin:'0 0 24px'}}>
            A modern reading of a classic shape — soft layering through the lengths, a forgiving bang line, equally good worn straight or undone.
          </p>

          <div style={{borderTop:'1px solid rgba(0,0,0,.1)', paddingTop:18, display:'grid', gridTemplateColumns:'1fr 1fr', rowGap:14, columnGap:24, marginBottom:24}}>
            {[
              ['Time to style', '5–10 min'],
              ['Maintenance', 'Trim every 8 wks'],
              ['Best for face', 'Oval, heart, long'],
              ['Texture', 'Straight, wavy'],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{fontFamily:"'DM Mono',monospace", fontSize:10, textTransform:'uppercase', letterSpacing:0.06, color:'var(--p-muted,#a89c8c)'}}>{k}</div>
                <div style={{fontFamily:"'Fraunces',serif", fontSize:18, marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex', gap:10}}>
            <button onClick={() => toggle(s.id)}
              style={{flex:1, background: liked ? 'var(--p-ink,#2a241d)' : 'transparent', color: liked ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                border:'1px solid var(--p-ink,#2a241d)', padding:'12px 16px', fontFamily:'inherit', fontSize:13,
                cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10}}>
              <HeartIcon filled={liked} size={15} /> {liked ? 'Saved to favorites' : 'Save to favorites'}
            </button>
            <button style={{flex:1, background:'transparent', color:'var(--p-ink,#2a241d)', border:'1px solid rgba(0,0,0,.15)', padding:'12px 16px', fontFamily:'inherit', fontSize:13, cursor:'pointer'}}>
              Bring to my stylist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Atelier · Favorites ────────────────────────────────────────────────────
function AtelierFavorites({ favs, toggle, go }) {
  const items = HAIRSTYLES.filter(h => favs.has(h.id));
  return (
    <div style={{padding:'40px 56px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28, borderBottom:'1px solid rgba(0,0,0,.08)', paddingBottom:18}}>
        <div>
          <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:6}}>Your saved looks</div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144,"SOFT" 100', fontSize:38, margin:0, letterSpacing:-0.8}}>
            Favorites <span style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', color:'var(--p-muted,#a89c8c)'}}>({items.length})</span>
          </h2>
        </div>
        <button style={{background:'transparent', border:'1px solid rgba(0,0,0,.15)', padding:'10px 16px', fontFamily:'inherit', fontSize:12, cursor:'pointer'}}>
          Send to stylist
        </button>
      </div>

      {items.length === 0 ? (
        <div style={{padding:'80px 0', textAlign:'center', color:'var(--p-muted,#a89c8c)'}}>
          <div style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:22}}>Nothing saved yet.</div>
          <div style={{fontSize:13, marginTop:8}}>Tap the heart on any style to keep it here.</div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:20}}>
          {items.map((s, i) => (
            <div key={s.id} style={{display:'flex', flexDirection:'column', gap:10}}>
              <div onClick={() => go(s.id)} style={{aspectRatio:'4/5', cursor:'pointer', position:'relative'}}>
                <HairImage style={s} />
                <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                  style={{position:'absolute', top:10, right:10, width:32, height:32, borderRadius:'50%', background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)', border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  <HeartIcon filled size={15} />
                </button>
              </div>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div>
                  <div style={{fontFamily:"'Fraunces',serif", fontSize:18, lineHeight:1.1}}>{s.name}</div>
                  <div style={{fontFamily:"'DM Mono',monospace", fontSize:10, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginTop:2}}>
                    Saved no. {String(i+1).padStart(2,'0')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Atelier · Photos ───────────────────────────────────────────────────────
function AtelierPhotos({ photos, go }) {
  const slots = [
    { id:'front', label:'Front', file:'IMG_1830.heic' },
    { id:'left',  label:'Left side', file:'IMG_1831.heic' },
    { id:'right', label:'Right side', file:'IMG_1832.heic' },
  ];
  return (
    <div style={{padding:'40px 56px', flex:1, overflow:'auto'}}>
      <div style={{borderBottom:'1px solid rgba(0,0,0,.08)', paddingBottom:18, marginBottom:28, display:'flex', justifyContent:'space-between', alignItems:'flex-end'}}>
        <div>
          <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:6}}>Your reference shoot</div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144,"SOFT" 100', fontSize:38, margin:0, letterSpacing:-0.8}}>My photos</h2>
        </div>
        <button onClick={() => go('upload')} style={{background:'transparent', border:'1px solid rgba(0,0,0,.15)', padding:'10px 16px', fontFamily:'inherit', fontSize:12, cursor:'pointer'}}>
          Re-shoot
        </button>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:22}}>
        {slots.map((s, i) => (
          <figure key={s.id} style={{margin:0}}>
            <div style={{aspectRatio:'3/4', marginBottom:12, background:'var(--p-stripe,#eadccb)'}}>
              <FaceSlot slot={s.id} label={s.label} />
            </div>
            <figcaption style={{display:'flex', justifyContent:'space-between', fontFamily:"'DM Mono',monospace", fontSize:10.5, letterSpacing:0.05, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)'}}>
              <span>No. {String(i+1).padStart(2,'0')} · {s.label}</span>
              <span>{s.file}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div style={{marginTop:36, fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:18, color:'var(--p-muted,#a89c8c)', maxWidth:540}}>
        These photos help us narrow recommendations by face shape and hair texture. They never leave your account.
      </div>
    </div>
  );
}

// ── Atelier · Profile ──────────────────────────────────────────────────────
function AtelierProfile() {
  return (
    <div style={{padding:'40px 56px', flex:1, overflow:'auto'}}>
      <div style={{borderBottom:'1px solid rgba(0,0,0,.08)', paddingBottom:18, marginBottom:28}}>
        <div style={{fontFamily:"'DM Mono',monospace", fontSize:11, letterSpacing:0.06, textTransform:'uppercase', color:'var(--p-muted,#a89c8c)', marginBottom:6}}>The Account</div>
        <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:300, fontVariationSettings:'"opsz" 144,"SOFT" 100', fontSize:38, margin:0, letterSpacing:-0.8}}>Hello, Mira.</h2>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:48}}>
        <div>
          <div style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:20, marginBottom:14}}>Your profile</div>
          {[
            ['Name','Mira Tanaka'],
            ['Email','mira@studio.co'],
            ['Face shape','Heart'],
            ['Hair texture','Wavy'],
            ['Target length','Medium'],
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(0,0,0,.06)'}}>
              <span style={{fontFamily:"'DM Mono',monospace", fontSize:10.5, color:'var(--p-muted,#a89c8c)', textTransform:'uppercase', letterSpacing:0.05}}>{k}</span>
              <span style={{fontSize:14}}>{v}</span>
            </div>
          ))}
        </div>
        <div>
          <div style={{fontFamily:"'Instrument Serif',serif", fontStyle:'italic', fontSize:20, marginBottom:14}}>Settings</div>
          {[
            ['Notifications','New styles weekly'],
            ['Photo privacy','Visible to me only'],
            ['Stylist sharing','On'],
            ['Theme','Soft cream'],
          ].map(([k,v]) => (
            <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid rgba(0,0,0,.06)'}}>
              <span style={{fontFamily:"'DM Mono',monospace", fontSize:10.5, color:'var(--p-muted,#a89c8c)', textTransform:'uppercase', letterSpacing:0.05}}>{k}</span>
              <span style={{fontSize:14}}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.AtelierApp = AtelierApp;
