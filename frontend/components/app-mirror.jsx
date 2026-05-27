// Direction C — Mirror
// Bold, modern, graphic. Heavy display type. Big numerals. Sharp corners.
// Edge-bleed imagery. Compressed icon-only side rail.

function MirrorApp({ palette }) {
  const { screen, go, reset } = useScreen('welcome');
  const [favs, toggleFav] = useFavorites(['wolf','mullet','crop','curlshag','pixie']);
  const [quizState, setQuizState] = React.useState({ vibes: ['edgy','bold'] });
  const [photos, setPhotos] = React.useState({ front: true, left: true, right: true });
  const [detailId, setDetailId] = React.useState(null);

  const openDetail = (id) => { setDetailId(id); go('detail'); };

  const navItems = [
    { id:'welcome',   label:'Home',  icon:Icons.Home,    n:'01' },
    { id:'quiz',      label:'Quiz',  icon:Icons.Quiz,    n:'02' },
    { id:'upload',    label:'Shoot', icon:Icons.Camera,  n:'03' },
    { id:'browse',    label:'Wall',  icon:Icons.Browse,  n:'04' },
    { id:'favorites', label:'Saved', icon:Icons.Heart,   n:'05', count: favs.size },
    { id:'photos',    label:'Me',    icon:Icons.Photos,  n:'06' },
    { id:'profile',   label:'You',   icon:Icons.Profile, n:'07' },
  ];

  return (
    <div style={{
      width:'100%', height:'100%', display:'flex',
      background:'var(--p-paper,#f7f1e8)',
      color:'var(--p-ink,#2a241d)',
      fontFamily:"'Manrope', system-ui, sans-serif",
      fontSize: 14,
    }}>
      {/* slim icon rail */}
      <aside style={{
        width:64, flexShrink:0, background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)',
        display:'flex', flexDirection:'column', alignItems:'center', padding:'18px 0 14px',
      }}>
        <div style={{
          width:36, height:36, background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:18, letterSpacing:-0.5,
        }}>M</div>
        <div style={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:2, marginTop:22, width:'100%'}}>
          {navItems.map((n) => {
            const active = screen === n.id || (n.id === 'browse' && screen === 'detail');
            return (
              <button key={n.id} onClick={() => reset(n.id)}
                title={n.label}
                style={{
                  appearance:'none', background:'transparent', border:0, width:'100%', padding:'12px 0',
                  cursor:'pointer', color: active ? 'var(--p-paper,#f7f1e8)' : 'rgba(247,241,232,.4)',
                  position:'relative', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  borderLeft: active ? `3px solid var(--p-hair,#c97a55)` : '3px solid transparent',
                }}>
                <n.icon width={20} height={20}/>
                <span style={{fontFamily:"'Archivo', sans-serif", fontSize:9, fontWeight:700, letterSpacing:0.06}}>{n.n}</span>
                {n.count != null && n.count > 0 && (
                  <span style={{
                    position:'absolute', top:6, right:10, minWidth:16, height:16, padding:'0 4px',
                    borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
                    fontSize:9, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{n.count}</span>
                )}
              </button>
            );
          })}
        </div>
        <div style={{
          fontFamily:"'Archivo', sans-serif", fontSize:9, fontWeight:600, color:'rgba(247,241,232,.4)',
          writingMode:'vertical-rl', transform:'rotate(180deg)', letterSpacing:0.1, padding:6,
        }}>v0.4 · 2026</div>
      </aside>

      <main style={{flex:1, overflow:'hidden', display:'flex', flexDirection:'column'}}>
        {screen === 'welcome'   && <MirrorWelcome  go={go}/>}
        {screen === 'quiz'      && <MirrorQuiz     go={go} state={quizState} setState={setQuizState}/>}
        {screen === 'upload'    && <MirrorUpload   go={go} photos={photos} setPhotos={setPhotos}/>}
        {screen === 'browse'    && <MirrorBrowse   go={openDetail} favs={favs} toggle={toggleFav}/>}
        {screen === 'detail'    && <MirrorDetail   id={detailId} favs={favs} toggle={toggleFav} go={go}/>}
        {screen === 'favorites' && <MirrorFavorites favs={favs} toggle={toggleFav} go={openDetail}/>}
        {screen === 'photos'    && <MirrorPhotos   photos={photos} go={go}/>}
        {screen === 'profile'   && <MirrorProfile/>}
      </main>
    </div>
  );
}

// Mirror screen header — large left number, page title beside it.
const MirrorHead = ({ n, eyebrow, title, right }) => (
  <div style={{padding:'24px 36px 18px', display:'flex', alignItems:'flex-end', gap:18, borderBottom:'1px solid rgba(0,0,0,.08)'}}>
    <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:64, lineHeight:0.85, letterSpacing:-3, color:'var(--p-hair,#c97a55)'}}>
      {n}
    </div>
    <div style={{flex:1, paddingBottom:6}}>
      <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.15, textTransform:'uppercase', color:'rgba(42,36,29,.55)', marginBottom:4}}>{eyebrow}</div>
      <h1 style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:38, letterSpacing:-1.4, margin:0, lineHeight:1, textTransform:'uppercase'}}>
        {title}
      </h1>
    </div>
    {right}
  </div>
);

// Mirror button — sharp, heavy
const MirrorBtn = ({ children, onClick, variant='primary', ...rest }) => {
  const v = {
    primary: { bg:'var(--p-ink,#2a241d)', fg:'var(--p-paper,#f7f1e8)' },
    accent:  { bg:'var(--p-hair,#c97a55)', fg:'var(--p-paper,#f7f1e8)' },
    outline: { bg:'transparent', fg:'var(--p-ink,#2a241d)' },
  }[variant];
  return (
    <button onClick={onClick}
      style={{
        appearance:'none', border: variant === 'outline' ? '1.5px solid var(--p-ink,#2a241d)' : 0,
        background: v.bg, color: v.fg, padding:'12px 18px', fontFamily:"'Archivo', sans-serif",
        fontSize:12, fontWeight:700, letterSpacing:0.1, textTransform:'uppercase', cursor:'pointer',
        display:'inline-flex', alignItems:'center', gap:10,
      }}
      {...rest}>{children}</button>
  );
};

// ── Mirror · Welcome ───────────────────────────────────────────────────────
function MirrorWelcome({ go }) {
  return (
    <div style={{flex:1, overflow:'auto', display:'flex', flexDirection:'column'}}>
      {/* HERO row */}
      <div style={{display:'grid', gridTemplateColumns:'1.4fr 1fr', minHeight: 420}}>
        <div style={{padding:'56px 48px', display:'flex', flexDirection:'column', justifyContent:'center', position:'relative', overflow:'hidden'}}>
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.2, textTransform:'uppercase', color:'var(--p-hair,#c97a55)', marginBottom:18}}>
            Hair · Studio · Index
          </div>
          <h1 style={{
            fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:110, lineHeight:0.86,
            letterSpacing:-4.5, margin:0, textTransform:'uppercase',
          }}>
            Cut <span style={{color:'var(--p-hair,#c97a55)'}}>like<br/>you</span><br/>mean<br/>it.
          </h1>
          <div style={{
            position:'absolute', bottom:32, right:24,
            fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:220, lineHeight:0.8,
            color:'var(--p-ink,#2a241d)', opacity:0.06, letterSpacing:-10, pointerEvents:'none',
          }}>26</div>
        </div>
        <div style={{
          position:'relative', background:'var(--p-ink,#2a241d)',
        }}>
          <StripedPlaceholder
            bg="var(--p-ink,#2a241d)" stripe="var(--p-hair,#c97a55)" angle={-12} density={4}
            showLabel={false}
          />
          <div style={{position:'absolute', left:0, right:0, bottom:0, padding:'20px 24px', background:'linear-gradient(transparent, rgba(0,0,0,0.6))', color:'var(--p-paper,#f7f1e8)'}}>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.15, opacity:0.75, marginBottom:4, textTransform:'uppercase'}}>Featured · 04</div>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:28, letterSpacing:-1, textTransform:'uppercase', lineHeight:0.95}}>The Mod Mullet</div>
          </div>
        </div>
      </div>

      {/* CTA strip */}
      <div style={{display:'flex', alignItems:'stretch', borderTop:'1px solid rgba(0,0,0,.08)', borderBottom:'1px solid rgba(0,0,0,.08)'}}>
        <button onClick={() => go('quiz')} style={{
          appearance:'none', border:0, flex:2, background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
          padding:'24px 36px', textAlign:'left', cursor:'pointer', fontFamily:'inherit', borderRight:'1px solid rgba(0,0,0,.1)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:16,
        }}>
          <div>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.2, opacity:0.85, textTransform:'uppercase', marginBottom:4}}>Start here →</div>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:28, letterSpacing:-1, textTransform:'uppercase'}}>Take the quiz</div>
          </div>
          <Icons.Arrow width={28} height={28}/>
        </button>
        <button onClick={() => go('browse')} style={{
          appearance:'none', border:0, flex:1.4, background:'var(--p-paper,#f7f1e8)', color:'var(--p-ink,#2a241d)',
          padding:'24px 36px', textAlign:'left', cursor:'pointer', fontFamily:'inherit', borderRight:'1px solid rgba(0,0,0,.08)',
          display:'flex', justifyContent:'space-between', alignItems:'center', gap:16,
        }}>
          <div>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.2, color:'rgba(42,36,29,.55)', textTransform:'uppercase', marginBottom:4}}>Or skip ahead →</div>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:24, letterSpacing:-1, textTransform:'uppercase'}}>Browse 18 looks</div>
          </div>
          <Icons.Arrow width={24} height={24}/>
        </button>
        <div style={{flex:1, padding:'24px 36px', display:'flex', flexDirection:'column', justifyContent:'center'}}>
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:42, color:'var(--p-hair,#c97a55)', letterSpacing:-2, lineHeight:1}}>+18k</div>
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.15, color:'rgba(42,36,29,.55)', textTransform:'uppercase'}}>Cuts indexed</div>
        </div>
      </div>

      {/* lower grid */}
      <div style={{padding:'30px 36px 40px'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:24, letterSpacing:-0.8, textTransform:'uppercase'}}>Trending now</div>
          <button onClick={() => go('browse')} style={{background:'transparent', border:0, fontFamily:'inherit', fontSize:11, fontWeight:700, letterSpacing:0.1, textTransform:'uppercase', color:'var(--p-hair,#c97a55)', cursor:'pointer'}}>
            All →
          </button>
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:8}}>
          {[HAIRSTYLES[4], HAIRSTYLES[7], HAIRSTYLES[2], HAIRSTYLES[15], HAIRSTYLES[12]].map((s, i) => (
            <div key={s.id} style={{aspectRatio:'4/5', background:'var(--p-ink,#2a241d)', position:'relative', overflow:'hidden'}}>
              <StripedPlaceholder style={s} showLabel={false}/>
              <div style={{position:'absolute', top:8, left:8, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:18, color:'var(--p-paper,#f7f1e8)', textShadow:'0 1px 3px rgba(0,0,0,.4)'}}>
                {String(i+1).padStart(2,'0')}
              </div>
              <div style={{position:'absolute', bottom:0, left:0, right:0, padding:'10px 10px 8px', background:'linear-gradient(transparent, rgba(0,0,0,0.7))'}}>
                <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:13, color:'var(--p-paper,#f7f1e8)', textTransform:'uppercase', letterSpacing:-0.2, lineHeight:1.1}}>{s.name}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Mirror · Quiz ──────────────────────────────────────────────────────────
function MirrorQuiz({ go, state, setState }) {
  const [step, setStep] = React.useState(0);
  const q = QUIZ[step];
  const value = state[q.id];
  const setAnswer = (val) => {
    if (q.multi) {
      const cur = new Set(state[q.id] || []);
      cur.has(val) ? cur.delete(val) : cur.add(val);
      setState({ ...state, [q.id]: [...cur] });
    } else setState({ ...state, [q.id]: val });
  };
  const isSelected = (v) => q.multi ? (value || []).includes(v) : value === v;
  const canNext = q.multi ? (value && value.length) : !!value;

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
      <MirrorHead n={String(step+1).padStart(2,'0')}
        eyebrow={`Question · ${step+1} of ${QUIZ.length}`}
        title={q.title}
        right={
          <div style={{display:'flex', gap:3, alignItems:'center', paddingBottom:10}}>
            {QUIZ.map((_, i) => (
              <div key={i} style={{
                width:i === step ? 26 : 8, height:8,
                background: i <= step ? 'var(--p-hair,#c97a55)' : 'rgba(0,0,0,.12)',
                transition:'width .2s',
              }}/>
            ))}
          </div>
        }/>

      <div style={{flex:1, padding:'24px 36px 24px', overflow:'auto'}}>
        {q.sub && (
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:600, fontSize:13, letterSpacing:0.05, color:'rgba(42,36,29,.6)', marginBottom:18, textTransform:'uppercase'}}>
            // {q.sub}
          </div>
        )}
        <div style={{
          display:'grid',
          gridTemplateColumns: q.options.length > 4 ? 'repeat(3, 1fr)' : `repeat(${q.options.length}, 1fr)`,
          gap:10,
        }}>
          {q.options.map((opt, i) => {
            const sel = isSelected(opt.value);
            return (
              <button key={opt.value} onClick={() => setAnswer(opt.value)}
                style={{
                  appearance:'none', textAlign:'left', cursor:'pointer',
                  background: sel ? 'var(--p-ink,#2a241d)' : 'var(--p-card,#fff)',
                  color: sel ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                  border: sel ? '2px solid var(--p-hair,#c97a55)' : '2px solid rgba(0,0,0,.08)',
                  padding:0, fontFamily:'inherit',
                  position:'relative', transition:'border-color .15s',
                }}>
                <div style={{aspectRatio:'5/4', position:'relative'}}>
                  <StripedPlaceholder
                    bg={sel ? 'var(--p-ink,#2a241d)' : 'var(--p-stripe,#eadccb)'}
                    stripe={sel ? 'var(--p-hair,#c97a55)' : 'var(--p-hairSoft,#f1c9b3)'}
                    angle={(opt.value.charCodeAt(0)*53) % 80 - 40}
                    density={5 + ((opt.value.length) % 4)}
                    showLabel={false}/>
                  <div style={{position:'absolute', top:8, left:10, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:22, letterSpacing:-1, color: sel ? 'var(--p-paper,#f7f1e8)' : 'var(--p-paper,#f7f1e8)', textShadow:'0 1px 3px rgba(0,0,0,.3)'}}>
                    {String.fromCharCode(65 + i)}
                  </div>
                  {sel && <div style={{position:'absolute', top:10, right:10, width:26, height:26, background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', display:'flex', alignItems:'center', justifyContent:'center'}}><Icons.Check width={14} height={14}/></div>}
                </div>
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:18, letterSpacing:-0.5, textTransform:'uppercase', lineHeight:1.05}}>{opt.label}</div>
                  {opt.sub && <div style={{fontSize:11, opacity:0.7, marginTop:4}}>{opt.sub}</div>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{borderTop:'1px solid rgba(0,0,0,.08)', padding:'14px 36px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <MirrorBtn variant="outline" onClick={() => step > 0 ? setStep(step-1) : go('welcome')}>
          <Icons.ArrowL width={14} height={14}/> Back
        </MirrorBtn>
        <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.1, color:'rgba(42,36,29,.55)', textTransform:'uppercase'}}>
          {q.multi
            ? `${(value||[]).length} picked${q.multi ? ' · pick any' : ''}`
            : (value ? 'Picked ✓' : 'Choose one')}
        </div>
        <MirrorBtn variant="accent" disabled={!canNext}
          onClick={() => canNext && (step < QUIZ.length - 1 ? setStep(step+1) : go('upload'))}
          style={{opacity: canNext ? 1 : 0.4, cursor: canNext ? 'pointer' : 'not-allowed'}}>
          {step === QUIZ.length - 1 ? 'Photos' : 'Next'} <Icons.Arrow width={14} height={14}/>
        </MirrorBtn>
      </div>
    </div>
  );
}

// ── Mirror · Upload ────────────────────────────────────────────────────────
function MirrorUpload({ go, photos, setPhotos }) {
  const slots = [
    { id:'front', label:'Front', sub:'01 — Face the camera. Hair clipped back.' },
    { id:'left',  label:'Left',  sub:'02 — Profile, full ear visible.' },
    { id:'right', label:'Right', sub:'03 — Mirror of the previous shot.' },
  ];
  const done = Object.values(photos).filter(Boolean).length;
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
      <MirrorHead n="03" eyebrow="Upload · Reference shots"
        title="Three photos, no fuss"
        right={
          <div style={{paddingBottom:8, fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:28, letterSpacing:-1}}>
            {done}<span style={{color:'rgba(42,36,29,.4)'}}>/3</span>
          </div>
        }/>

      <div style={{flex:1, padding:'24px 36px', overflow:'auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
          {slots.map((s, i) => {
            const filled = photos[s.id];
            return (
              <div key={s.id} onClick={() => setPhotos({ ...photos, [s.id]: !filled })}
                style={{
                  cursor:'pointer',
                  border: filled ? '2px solid var(--p-ink,#2a241d)' : '2px dashed rgba(0,0,0,.2)',
                  background: filled ? 'var(--p-card,#fff)' : 'transparent',
                  padding:6,
                }}>
                <div style={{aspectRatio:'3/4', position:'relative', overflow:'hidden'}}>
                  {filled ? (
                    <StripedPlaceholder
                      bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)"
                      angle={i*22} density={5} showLabel={false}
                    />
                  ) : (
                    <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:10}}>
                      <Icons.Plus width={34} height={34}/>
                      <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.1, textTransform:'uppercase', color:'rgba(42,36,29,.6)'}}>Drop · Click · Snap</div>
                    </div>
                  )}
                  <div style={{position:'absolute', top:8, left:8, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:42, lineHeight:0.85, color: filled ? 'var(--p-paper,#f7f1e8)' : 'rgba(42,36,29,.18)', letterSpacing:-2, textShadow: filled ? '0 1px 4px rgba(0,0,0,.3)' : 'none'}}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  {filled && (
                    <div style={{position:'absolute', top:8, right:8, padding:'3px 8px', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', fontFamily:"'Archivo', sans-serif", fontSize:10, fontWeight:800, letterSpacing:0.1, textTransform:'uppercase'}}>✓ in</div>
                  )}
                </div>
                <div style={{padding:'10px 4px 4px', display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                  <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:18, textTransform:'uppercase', letterSpacing:-0.4}}>{s.label}</div>
                  <div style={{fontSize:10.5, fontFamily:"'Archivo', sans-serif", fontWeight:600, letterSpacing:0.06, color:'rgba(42,36,29,.55)', textTransform:'uppercase'}}>{filled ? 'Uploaded' : 'Pending'}</div>
                </div>
                <div style={{padding:'0 4px 6px', fontSize:11.5, color:'rgba(42,36,29,.6)'}}>{s.sub}</div>
              </div>
            );
          })}
        </div>

        <div style={{
          marginTop:18, background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)',
          padding:'14px 18px', display:'flex', alignItems:'center', gap:14,
        }}>
          <Icons.Sparkle width={22} height={22}/>
          <div style={{flex:1, fontSize:13, lineHeight:1.4}}>
            <b style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, letterSpacing:0.05}}>PRIVATE.</b> &nbsp;
            Photos stay on your device. We only use them to filter recommendations.
          </div>
        </div>
      </div>

      <div style={{borderTop:'1px solid rgba(0,0,0,.08)', padding:'14px 36px', display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <MirrorBtn variant="outline" onClick={() => go('quiz')}><Icons.ArrowL width={14} height={14}/> Back</MirrorBtn>
        <MirrorBtn variant="accent" onClick={() => go('browse')}>
          Show the wall <Icons.Arrow width={14} height={14}/>
        </MirrorBtn>
      </div>
    </div>
  );
}

// ── Mirror · Browse ────────────────────────────────────────────────────────
function MirrorBrowse({ go, favs, toggle }) {
  const [filter, setFilter] = React.useState('All');
  const filters = ['All','Short','Medium','Long'];
  const items = filter === 'All' ? HAIRSTYLES : HAIRSTYLES.filter(h => h.length === filter);

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'hidden'}}>
      <MirrorHead n="04" eyebrow="The wall · Curated for Jordan"
        title={`${items.length} looks`}
        right={
          <div style={{display:'flex', gap:0, alignItems:'center', paddingBottom:8, border:'1px solid var(--p-ink,#2a241d)'}}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  appearance:'none', border:0, padding:'8px 14px', cursor:'pointer', fontFamily:"'Archivo', sans-serif",
                  fontSize:11, fontWeight:700, letterSpacing:0.08, textTransform:'uppercase',
                  background: filter === f ? 'var(--p-ink,#2a241d)' : 'transparent',
                  color: filter === f ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                }}>{f}</button>
            ))}
          </div>
        }/>

      <div style={{flex:1, overflow:'auto', padding:'18px 28px 36px'}}>
        <div style={{columnCount:4, columnGap:8}}>
          {items.map((s, i) => {
            const liked = favs.has(s.id);
            return (
              <div key={s.id} onClick={() => go(s.id)}
                style={{breakInside:'avoid', marginBottom:8, position:'relative', cursor:'pointer', background:'var(--p-ink,#2a241d)'}}>
                <div style={{aspectRatio:`1 / ${s.ratio}`, position:'relative', overflow:'hidden'}}>
                  <StripedPlaceholder style={s} showLabel={false}/>
                  <div style={{position:'absolute', top:8, left:10, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:24, letterSpacing:-1, color:'var(--p-paper,#f7f1e8)', textShadow:'0 1px 3px rgba(0,0,0,.3)'}}>
                    {String(i+1).padStart(3,'0')}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{
                      position:'absolute', top:8, right:8, width:32, height:32,
                      background: liked ? 'var(--p-hair,#c97a55)' : 'rgba(0,0,0,.7)',
                      color:'var(--p-paper,#f7f1e8)',
                      border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                    <HeartIcon filled={liked} size={14}/>
                  </button>
                </div>
                <div style={{padding:'8px 10px 12px', color:'var(--p-paper,#f7f1e8)'}}>
                  <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:14, letterSpacing:-0.3, textTransform:'uppercase', lineHeight:1.05}}>{s.name}</div>
                  <div style={{fontSize:11, fontFamily:"'Archivo', sans-serif", fontWeight:600, letterSpacing:0.06, opacity:0.7, textTransform:'uppercase', marginTop:3}}>{s.length} · {s.tags[0]}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Mirror · Detail ────────────────────────────────────────────────────────
function MirrorDetail({ id, favs, toggle, go }) {
  const s = HAIRSTYLES.find((h) => h.id === id) || HAIRSTYLES[0];
  const liked = favs.has(s.id);
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', overflow:'auto'}}>
      <div style={{
        padding:'12px 28px', display:'flex', alignItems:'center',
        borderBottom:'1px solid rgba(0,0,0,.08)',
      }}>
        <button onClick={() => go('browse')} style={{appearance:'none', background:'transparent', border:0, fontFamily:"'Archivo', sans-serif", fontSize:11, fontWeight:700, letterSpacing:0.1, textTransform:'uppercase', cursor:'pointer', color:'rgba(42,36,29,.6)', display:'flex', alignItems:'center', gap:6}}>
          <Icons.ArrowL width={14} height={14}/> Back to wall
        </button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', flex:1}}>
        {/* full-bleed image left */}
        <div style={{background:'var(--p-ink,#2a241d)', position:'relative', minHeight: 500}}>
          <StripedPlaceholder style={s} showLabel={false}/>
          <div style={{position:'absolute', top:18, left:24, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:90, lineHeight:0.85, color:'var(--p-paper,#f7f1e8)', letterSpacing:-3.5, mixBlendMode:'difference', opacity:0.95}}>
            {String(HAIRSTYLES.findIndex(h => h.id === s.id)+1).padStart(2,'0')}
          </div>
          <div style={{position:'absolute', bottom:18, left:24, color:'var(--p-paper,#f7f1e8)', display:'flex', gap:6}}>
            {s.tags.map(t => (
              <span key={t} style={{fontFamily:"'Archivo', sans-serif", fontSize:10, fontWeight:700, letterSpacing:0.1, textTransform:'uppercase', padding:'4px 8px', background:'rgba(0,0,0,.55)'}}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{padding:'28px 32px', display:'flex', flexDirection:'column'}}>
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.15, color:'var(--p-hair,#c97a55)', textTransform:'uppercase', marginBottom:8}}>
            Look · {s.length} · {s.tags[0]}
          </div>
          <h2 style={{fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:52, letterSpacing:-2, margin:'0 0 14px', lineHeight:0.92, textTransform:'uppercase'}}>
            {s.name}
          </h2>
          <p style={{fontSize:14, lineHeight:1.55, color:'rgba(42,36,29,.75)', margin:'0 0 22px', maxWidth:420}}>
            Strong silhouette, deliberate texture, low-effort styling. A high-impact change that grows out gracefully because the shape is built on the bones, not the surface.
          </p>

          <div style={{borderTop:'2px solid var(--p-ink,#2a241d)', borderBottom:'1px solid rgba(0,0,0,.1)', padding:'12px 0', marginBottom:20}}>
            {[
              ['Time', '5–10 min'],
              ['Trim', '6–8 wks'],
              ['Faces', 'Heart · Oval'],
              ['Texture', 'Wavy · Straight'],
            ].map(([k,v]) => (
              <div key={k} style={{display:'flex', justifyContent:'space-between', padding:'7px 0', borderTop:'1px solid rgba(0,0,0,.08)'}}>
                <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.08, textTransform:'uppercase', color:'rgba(42,36,29,.55)'}}>{k}</div>
                <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:14, letterSpacing:-0.2, textTransform:'uppercase'}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{display:'flex', gap:8}}>
            <MirrorBtn variant={liked ? 'accent' : 'primary'} onClick={() => toggle(s.id)}>
              <HeartIcon filled={liked} size={14}/> {liked ? 'Saved' : 'Save it'}
            </MirrorBtn>
            <MirrorBtn variant="outline">For my stylist</MirrorBtn>
          </div>

          {/* thumb strip */}
          <div style={{marginTop:'auto', paddingTop:18, borderTop:'1px solid rgba(0,0,0,.08)'}}>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.12, textTransform:'uppercase', color:'rgba(42,36,29,.55)', marginBottom:8}}>More angles</div>
            <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:6}}>
              {[0,1,2,3].map((i) => (
                <div key={i} style={{aspectRatio:'1/1'}}>
                  <StripedPlaceholder bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)" angle={s.angle + i*18} density={s.density - 1} showLabel={false}/>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Mirror · Favorites ─────────────────────────────────────────────────────
function MirrorFavorites({ favs, toggle, go }) {
  const items = HAIRSTYLES.filter(h => favs.has(h.id));
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
      <MirrorHead n="05" eyebrow="Saved · Your collection"
        title={items.length === 0 ? "Empty" : `${items.length} saved`}
        right={
          items.length > 0 && (
            <div style={{display:'flex', gap:8, paddingBottom:8}}>
              <MirrorBtn variant="outline">Export</MirrorBtn>
              <MirrorBtn variant="primary">For stylist</MirrorBtn>
            </div>
          )
        }/>
      <div style={{flex:1, padding:'18px 28px 36px', overflow:'auto'}}>
        {items.length === 0 ? (
          <div style={{padding:'80px 0', textAlign:'center'}}>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:60, color:'rgba(42,36,29,.12)', letterSpacing:-3, marginBottom:8}}>00</div>
            <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:24, letterSpacing:-0.6, textTransform:'uppercase'}}>Nothing here yet</div>
            <div style={{fontSize:13, color:'rgba(42,36,29,.55)', marginTop:6}}>Heart looks on the wall to keep them.</div>
          </div>
        ) : (
          <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
            {items.map((s, i) => (
              <div key={s.id} style={{position:'relative', background:'var(--p-ink,#2a241d)', cursor:'pointer'}} onClick={() => go(s.id)}>
                <div style={{aspectRatio:'4/5', position:'relative', overflow:'hidden'}}>
                  <StripedPlaceholder style={s} showLabel={false}/>
                  <div style={{position:'absolute', top:8, left:10, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:28, color:'var(--p-paper,#f7f1e8)', letterSpacing:-1, textShadow:'0 1px 3px rgba(0,0,0,.3)'}}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{position:'absolute', top:10, right:10, width:32, height:32, background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <HeartIcon filled size={14}/>
                  </button>
                </div>
                <div style={{padding:'10px 12px 14px', color:'var(--p-paper,#f7f1e8)'}}>
                  <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:14, textTransform:'uppercase', letterSpacing:-0.3}}>{s.name}</div>
                  <div style={{fontSize:11, fontFamily:"'Archivo', sans-serif", fontWeight:600, letterSpacing:0.06, opacity:0.65, textTransform:'uppercase', marginTop:2}}>{s.length} · {s.tags[0]}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Mirror · Photos ────────────────────────────────────────────────────────
function MirrorPhotos({ photos, go }) {
  const slots = [
    { id:'front', label:'Front',      file:'IMG_3001.heic', meta:'2058 × 2745 · 1.7 MB' },
    { id:'left',  label:'Left side',  file:'IMG_3002.heic', meta:'2058 × 2745 · 1.6 MB' },
    { id:'right', label:'Right side', file:'IMG_3003.heic', meta:'2058 × 2745 · 1.8 MB' },
  ];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
      <MirrorHead n="06" eyebrow="Reference · Jordan Lee"
        title="My photos"
        right={<MirrorBtn variant="outline" onClick={() => go('upload')} style={{marginBottom:8}}>Retake</MirrorBtn>}/>
      <div style={{flex:1, padding:'18px 28px 36px', overflow:'auto'}}>
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:10}}>
          {slots.map((s, i) => {
            const filled = photos[s.id];
            return (
              <div key={s.id} style={{background:'var(--p-card,#fff)', border:'1px solid rgba(0,0,0,.08)'}}>
                <div style={{aspectRatio:'3/4', position:'relative'}}>
                  {filled ? (
                    <StripedPlaceholder bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)" angle={i*18} density={5} showLabel={false}/>
                  ) : (
                    <div style={{height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(42,36,29,.55)'}}>Not uploaded</div>
                  )}
                  <div style={{position:'absolute', top:8, left:10, fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:38, color:'var(--p-paper,#f7f1e8)', letterSpacing:-1.5, textShadow:'0 1px 4px rgba(0,0,0,.3)'}}>
                    {String(i+1).padStart(2,'0')}
                  </div>
                </div>
                <div style={{padding:'10px 12px 12px', borderTop:'1px solid rgba(0,0,0,.08)'}}>
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline'}}>
                    <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:14, textTransform:'uppercase', letterSpacing:-0.3}}>{s.label}</div>
                    <div style={{fontSize:10, fontFamily:"'Archivo', sans-serif", fontWeight:600, letterSpacing:0.06, color:'rgba(42,36,29,.55)', textTransform:'uppercase'}}>{filled ? 'Stored' : '—'}</div>
                  </div>
                  <div style={{fontSize:11, color:'rgba(42,36,29,.55)', marginTop:3}}>
                    {filled ? `${s.file} · ${s.meta}` : 'no file'}
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

// ── Mirror · Profile ───────────────────────────────────────────────────────
function MirrorProfile() {
  const items = [
    ['Name', 'Jordan Lee'],
    ['Email', 'jordan@hello.co'],
    ['Plan', 'Free tier'],
    ['Joined', 'Mar 2026'],
  ];
  const tags = ['Heart · shape', 'Wavy', 'Medium', 'Edgy', 'Bold'];
  return (
    <div style={{flex:1, display:'flex', flexDirection:'column'}}>
      <MirrorHead n="07" eyebrow="Account · v0.4" title="You"/>
      <div style={{flex:1, padding:'24px 36px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, overflow:'auto'}}>
        <div>
          <div style={{
            background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)',
            padding:'24px 24px 22px', display:'flex', alignItems:'center', gap:18, marginBottom:16,
          }}>
            <div style={{width:54, height:54, background:'var(--p-hair,#c97a55)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Archivo', sans-serif", fontWeight:900, fontSize:26}}>J</div>
            <div>
              <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:22, letterSpacing:-0.6}}>Jordan Lee</div>
              <div style={{fontSize:12, opacity:0.7}}>jordan@hello.co</div>
            </div>
          </div>
          <div style={{background:'var(--p-card,#fff)', border:'1px solid rgba(0,0,0,.08)'}}>
            {items.map(([k,v]) => (
              <div key={k} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', borderBottom:'1px solid rgba(0,0,0,.06)'}}>
                <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:10, letterSpacing:0.1, color:'rgba(42,36,29,.55)', textTransform:'uppercase'}}>{k}</div>
                <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:13, letterSpacing:-0.2, textTransform:'uppercase'}}>{v}</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:13, letterSpacing:0.06, textTransform:'uppercase', marginBottom:10}}>Tags from your quiz</div>
          <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:24}}>
            {tags.map(t => (
              <span key={t} style={{
                fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.08, textTransform:'uppercase',
                padding:'5px 10px', background:'var(--p-ink,#2a241d)', color:'var(--p-paper,#f7f1e8)',
              }}>{t}</span>
            ))}
          </div>

          <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:800, fontSize:13, letterSpacing:0.06, textTransform:'uppercase', marginBottom:10}}>Settings</div>
          <div style={{background:'var(--p-card,#fff)', border:'1px solid rgba(0,0,0,.08)'}}>
            {[
              ['Notifications','New looks weekly', true],
              ['Photo backup','Off', false],
              ['Stylist sharing','Allow link', true],
              ['Theme','Mocha cream'],
            ].map(([k, v, t]) => (
              <div key={k} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 18px', borderBottom:'1px solid rgba(0,0,0,.06)'}}>
                <div>
                  <div style={{fontFamily:"'Archivo', sans-serif", fontWeight:700, fontSize:11, letterSpacing:0.06, textTransform:'uppercase'}}>{k}</div>
                  <div style={{fontSize:11.5, color:'rgba(42,36,29,.55)', marginTop:2}}>{v}</div>
                </div>
                {t !== undefined && (
                  <div style={{
                    width:34, height:18,
                    background: t ? 'var(--p-hair,#c97a55)' : 'rgba(0,0,0,.15)',
                    position:'relative', cursor:'pointer',
                  }}>
                    <div style={{position:'absolute', top:2, left: t ? 18 : 2, width:14, height:14, background:'var(--p-paper,#f7f1e8)', transition:'left .15s'}}/>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

window.MirrorApp = MirrorApp;
