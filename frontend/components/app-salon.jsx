// Direction B — Salon
// Warm, friendly, rounded cards. Top navigation bar. Generous soft shadows.
// Manrope body, Fraunces display headings, peachy primary buttons.

function SalonApp({ palette }) {
  const { screen, go, reset } = useScreen('welcome');
  const [favs, toggleFav] = useFavorites(['curtain','beach','crop','waves']);
  const [quizState, setQuizState] = React.useState({ length: 'medium', texture: 'wavy' });
  const [photos, setPhotos] = React.useState({ front: true, left: true, right: false });
  const [detailId, setDetailId] = React.useState(null);

  const openDetail = (id) => { setDetailId(id); go('detail'); };

  const styles = {
    root: {
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      background:'var(--p-paper, #f7f1e8)',
      color:'var(--p-ink, #2a241d)',
      fontFamily:"'Manrope', system-ui, sans-serif",
      fontSize: 14, lineHeight: 1.5,
    },
    topbar: {
      display:'flex', alignItems:'center', gap:24,
      padding:'16px 32px',
      borderBottom:'1px solid rgba(0,0,0,.06)',
      background: 'var(--p-paper, #f7f1e8)',
    },
    main: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
  };

  const navItems = [
    { id:'welcome',   label:'Home',      icon:Icons.Home },
    { id:'quiz',      label:'Quiz',      icon:Icons.Quiz },
    { id:'upload',    label:'Photos',    icon:Icons.Camera },
    { id:'browse',    label:'Browse',    icon:Icons.Browse },
    { id:'favorites', label:'Favorites', icon:Icons.Heart, count: favs.size },
    { id:'photos',    label:'My Photos', icon:Icons.Photos },
    { id:'profile',   label:'Profile',   icon:Icons.Profile },
  ];

  return (
    <div style={styles.root}>
      <header style={styles.topbar}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginRight: 12}}>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:600,
            fontVariationSettings:'"SOFT" 100',
          }}>m</div>
          <div style={{fontFamily:"'Fraunces',serif", fontSize:19, fontWeight:600, letterSpacing:-0.3}}>
            mane
          </div>
        </div>
        <nav style={{display:'flex', gap:2, flex:1}}>
          {navItems.map((n) => {
            const active = screen === n.id || (n.id === 'browse' && screen === 'detail');
            return (
              <button key={n.id} onClick={() => reset(n.id)}
                style={{
                  appearance:'none', background: active ? 'var(--p-chip,#efe6d9)' : 'transparent',
                  border:0, padding:'8px 14px', borderRadius: 99, fontFamily:'inherit',
                  fontSize:13, fontWeight: active ? 600 : 500, color: active ? 'var(--p-ink,#2a241d)' : 'rgba(42,36,29,.6)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                }}>
                <n.icon width={16} height={16} />
                {n.label}
                {n.count != null && n.count > 0 && (
                  <span style={{
                    background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
                    fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:99,
                  }}>{n.count}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <button style={{appearance:'none', background:'transparent', border:0, padding:6, cursor:'pointer', color:'rgba(42,36,29,.55)'}}>
            <Icons.Search width={18} height={18}/>
          </button>
          <div style={{width:34, height:34, borderRadius:'50%', background:'var(--p-stripe,#eadccb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600}}>
            J
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {screen === 'welcome'   && <SalonWelcome  go={go} />}
        {screen === 'quiz'      && <SalonQuiz     go={go} state={quizState} setState={setQuizState} />}
        {screen === 'upload'    && <SalonUpload   go={go} photos={photos} setPhotos={setPhotos} />}
        {screen === 'browse'    && <SalonBrowse   go={openDetail} favs={favs} toggle={toggleFav} />}
        {screen === 'detail'    && <SalonDetail   id={detailId} favs={favs} toggle={toggleFav} go={go} />}
        {screen === 'favorites' && <SalonFavorites favs={favs} toggle={toggleFav} go={openDetail} />}
        {screen === 'photos'    && <SalonPhotos   photos={photos} go={go} />}
        {screen === 'profile'   && <SalonProfile  />}
      </main>
    </div>
  );
}

// ── Salon button ───────────────────────────────────────────────────────────
const SalonBtn = ({ children, onClick, variant = 'primary', size = 'md', ...rest }) => {
  const base = {
    primary: { bg:'var(--p-hair,#c97a55)', fg:'var(--p-paper,#f7f1e8)' },
    secondary: { bg:'var(--p-chip,#efe6d9)', fg:'var(--p-ink,#2a241d)' },
    ghost: { bg:'transparent', fg:'var(--p-ink,#2a241d)' },
    ink: { bg:'var(--p-ink,#2a241d)', fg:'var(--p-paper,#f7f1e8)' },
  }[variant];
  const sz = { sm:{ p:'8px 14px', f:12 }, md:{ p:'12px 22px', f:13 }, lg:{ p:'14px 28px', f:15 }}[size];
  return (
    <button onClick={onClick}
      style={{
        appearance:'none', border:0, borderRadius:99,
        background: base.bg, color: base.fg, padding: sz.p, fontFamily:'inherit',
        fontSize: sz.f, fontWeight: 600, cursor:'pointer', display:'inline-flex',
        alignItems:'center', gap:8, transition:'transform .15s',
      }}
      {...rest}>{children}</button>
  );
};

// ── Salon · Welcome ────────────────────────────────────────────────────────
function SalonWelcome({ go }) {
  return (
    <div style={{padding:'40px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:36, alignItems:'stretch', marginBottom:28}}>
        {/* Hero card */}
        <div style={{
          background:'linear-gradient(135deg, var(--p-hairSoft,#f1c9b3) 0%, var(--p-card,#fff) 100%)',
          borderRadius:24, padding:'40px 44px', position:'relative', overflow:'hidden',
        }}>
          <div style={{fontSize:12, fontWeight:600, letterSpacing:0.1, textTransform:'uppercase', color:'var(--p-hair,#c97a55)', marginBottom:14}}>
            Hi, Jordan ✿
          </div>
          <h1 style={{
            fontFamily:"'Fraunces',serif", fontWeight:500, fontVariationSettings:'"opsz" 144,"SOFT" 100',
            fontSize:54, lineHeight:1.0, letterSpacing:-1.6, margin:'0 0 18px', maxWidth:480,
          }}>
            Let's find a haircut you'll <em style={{fontStyle:'italic', fontWeight:400}}>actually</em> love.
          </h1>
          <p style={{fontSize:15, maxWidth:440, color:'rgba(42,36,29,.78)', margin:'0 0 24px', lineHeight:1.55}}>
            Six quick questions, three selfies, and a swipeable wall of looks tailored to your face shape and hair texture.
          </p>
          <div style={{display:'flex', gap:10}}>
            <SalonBtn onClick={() => go('quiz')} size="lg">Start the quiz <Icons.Arrow width={16} height={16}/></SalonBtn>
            <SalonBtn onClick={() => go('browse')} variant="ghost" size="lg">Just browsing</SalonBtn>
          </div>
          {/* decorative blob */}
          <div style={{position:'absolute', right:-30, bottom:-30, width:180, height:180, borderRadius:'50%', background:'var(--p-hair,#c97a55)', opacity:0.18}}/>
          <div style={{position:'absolute', right:60, top:30, width:90, height:90, borderRadius:'50%', background:'var(--p-card,#fff)', opacity:0.5}}/>
        </div>

        {/* Progress card */}
        <div style={{
          background:'var(--p-card,#fff)', borderRadius:24, padding:'28px 28px 24px',
          boxShadow:'0 1px 0 rgba(0,0,0,.03), 0 12px 28px rgba(0,0,0,.04)',
          display:'flex', flexDirection:'column', gap:14,
        }}>
          <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20, letterSpacing:-0.4}}>Your profile</div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <CircleProgress value={0.66}/>
            <div>
              <div style={{fontWeight:600, fontSize:14}}>2 of 3 steps done</div>
              <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>One more thing and you're set.</div>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:6}}>
            <StepRow done label="Quiz answered" sub="Heart shape · wavy" />
            <StepRow done label="2 photos uploaded" sub="Front & left side" />
            <StepRow done={false} label="Upload right side" sub="So we can finish recommendations"
              cta={() => go('upload')} />
          </div>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
        <h3 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:24, letterSpacing:-0.4, margin:0}}>
          Picked for you today
        </h3>
        <button onClick={() => go('browse')} style={{background:'transparent', border:0, fontFamily:'inherit', fontSize:13, color:'var(--p-hair,#c97a55)', fontWeight:600, cursor:'pointer'}}>
          See all 18 →
        </button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
        {[HAIRSTYLES[1], HAIRSTYLES[5], HAIRSTYLES[6], HAIRSTYLES[12]].map((s) => (
          <div key={s.id} style={{background:'var(--p-card,#fff)', borderRadius:18, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 6px 16px rgba(0,0,0,.04)'}}>
            <div style={{aspectRatio:'4/5'}}>
              <StripedPlaceholder style={s} showLabel={false}/>
            </div>
            <div style={{padding:'12px 14px 14px'}}>
              <div style={{fontWeight:600, fontSize:14}}>{s.name}</div>
              <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{s.length} · {s.tags[0]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CircleProgress = ({ value = 0.5, size = 52 }) => {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--p-chip,#efe6d9)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--p-hair,#c97a55)" strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c*(1-value)} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--p-ink, #2a241d)" fontFamily="inherit">{Math.round(value*100)}%</text>
    </svg>
  );
};

const StepRow = ({ done, label, sub, cta }) => (
  <div style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:'1px solid rgba(0,0,0,.05)'}}>
    <div style={{
      width:22, height:22, borderRadius:'50%',
      background: done ? 'var(--p-hair,#c97a55)' : 'transparent',
      border: done ? 0 : '1.5px dashed rgba(0,0,0,.2)',
      color:'var(--p-paper,#f7f1e8)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {done && <Icons.Check width={12} height={12}/>}
    </div>
    <div style={{flex:1}}>
      <div style={{fontSize:13, fontWeight: done ? 500 : 600, opacity: done ? 0.7 : 1, textDecoration: done ? 'line-through' : 'none'}}>{label}</div>
      <div style={{fontSize:11.5, color:'rgba(42,36,29,.55)'}}>{sub}</div>
    </div>
    {cta && <button onClick={cta} style={{appearance:'none', background:'transparent', border:0, fontFamily:'inherit', fontSize:12, color:'var(--p-hair,#c97a55)', fontWeight:600, cursor:'pointer'}}>Finish →</button>}
  </div>
);

// ── Salon · Quiz ───────────────────────────────────────────────────────────
function SalonQuiz({ go, state, setState }) {
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
    <div style={{flex:1, display:'flex', flexDirection:'column', padding:'24px 48px 24px'}}>
      {/* progress */}
      <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:24}}>
        <div style={{fontSize:12, fontWeight:600, color:'var(--p-hair,#c97a55)'}}>Step {step+1} of {QUIZ.length}</div>
        <div style={{flex:1, height:6, borderRadius:99, background:'var(--p-chip,#efe6d9)', overflow:'hidden'}}>
          <div style={{height:'100%', width:`${(step+1)/QUIZ.length*100}%`, background:'var(--p-hair,#c97a55)', borderRadius:99, transition:'width .25s'}}/>
        </div>
      </div>

      <div style={{
        background:'var(--p-card,#fff)', borderRadius:24, padding:'32px 36px',
        boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 12px 28px rgba(0,0,0,.05)',
        flex:1, display:'flex', flexDirection:'column',
      }}>
        <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:30, letterSpacing:-0.6, margin:'0 0 6px'}}>
          {q.title}
        </h2>
        {q.sub && <div style={{fontSize:14, color:'rgba(42,36,29,.6)', marginBottom:22}}>{q.sub}</div>}

        <div style={{
          display:'grid',
          gridTemplateColumns: q.options.length > 4 ? 'repeat(3, 1fr)' : `repeat(${q.options.length}, 1fr)`,
          gap:14, flex:1, alignContent:'flex-start',
        }}>
          {q.options.map((opt) => {
            const sel = isSelected(opt.value);
            return (
              <button key={opt.value} onClick={() => setAnswer(opt.value)}
                style={{
                  appearance:'none', textAlign:'left',
                  background:'var(--p-paper,#f7f1e8)',
                  border: sel ? '2px solid var(--p-hair,#c97a55)' : '2px solid transparent',
                  borderRadius:18, padding:0, cursor:'pointer', overflow:'hidden',
                  fontFamily:'inherit', position:'relative',
                  transition:'transform .15s, border-color .15s',
                }}>
                <div style={{aspectRatio:'5/4'}}>
                  <StripedPlaceholder
                    angle={(opt.value.charCodeAt(0)*37) % 80 - 40}
                    density={5 + ((opt.value.length) % 4)}
                    showLabel={false}/>
                </div>
                {sel && (
                  <div style={{position:'absolute', top:10, right:10, width:26, height:26, borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <Icons.Check width={14} height={14}/>
                  </div>
                )}
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:17, letterSpacing:-0.2}}>{opt.label}</div>
                  {opt.sub && <div style={{fontSize:12, color:'rgba(42,36,29,.55)', marginTop:2}}>{opt.sub}</div>}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18, paddingTop:16, borderTop:'1px solid rgba(0,0,0,.05)'}}>
          <SalonBtn variant="ghost" onClick={() => step > 0 ? setStep(step-1) : go('welcome')}>
            <Icons.ArrowL width={14} height={14}/> Back
          </SalonBtn>
          <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>
            {q.multi ? `${(value||[]).length} selected` : (value ? 'Looks good ✓' : 'Pick one to continue')}
          </div>
          <SalonBtn variant={canNext ? 'primary' : 'secondary'} onClick={() => canNext && (step < QUIZ.length - 1 ? setStep(step+1) : go('upload'))}>
            {step === QUIZ.length - 1 ? 'Upload photos' : 'Next'} <Icons.Arrow width={14} height={14}/>
          </SalonBtn>
        </div>
      </div>
    </div>
  );
}

// ── Salon · Upload ─────────────────────────────────────────────────────────
function SalonUpload({ go, photos, setPhotos }) {
  const slots = [
    { id:'front', label:'Front',      sub:'Hair pulled back, look straight ahead.',  emoji:'•' },
    { id:'left',  label:'Left side',  sub:'Profile view, ear showing.',              emoji:'•' },
    { id:'right', label:'Right side', sub:'Same as left but the other way.',         emoji:'•' },
  ];
  const done = Object.values(photos).filter(Boolean).length;
  return (
    <div style={{padding:'32px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:36, letterSpacing:-0.8, margin:0}}>
            Three quick photos
          </h2>
          <div style={{fontSize:14, color:'rgba(42,36,29,.6)', marginTop:6}}>
            Natural light is great. No makeup, special angle, or filter needed.
          </div>
        </div>
        <div style={{
          background:'var(--p-chip,#efe6d9)', borderRadius:99,
          padding:'8px 14px', fontSize:12, fontWeight:600,
        }}>{done}/3 uploaded</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:22}}>
        {slots.map((s, i) => {
          const filled = photos[s.id];
          return (
            <div key={s.id} style={{
              background:'var(--p-card,#fff)', borderRadius:20, padding:16,
              boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 8px 22px rgba(0,0,0,.04)',
            }}>
              <div onClick={() => setPhotos({ ...photos, [s.id]: !filled })}
                style={{
                  aspectRatio:'3/4', borderRadius:14, overflow:'hidden', cursor:'pointer',
                  background: filled ? 'var(--p-stripe,#eadccb)' : 'var(--p-paper,#f7f1e8)',
                  border: filled ? 'none' : '2px dashed rgba(0,0,0,.18)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  position:'relative', marginBottom:12,
                }}>
                {filled ? (
                  <StripedPlaceholder
                    angle={i*20} density={5}
                    bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)"
                    showLabel={false}
                  />
                ) : (
                  <div style={{textAlign:'center', color:'rgba(42,36,29,.55)'}}>
                    <div style={{
                      width:52, height:52, borderRadius:'50%', background:'var(--p-chip,#efe6d9)',
                      margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icons.Camera width={22} height={22}/>
                    </div>
                    <div style={{fontWeight:600, fontSize:14, color:'var(--p-ink,#2a241d)'}}>Tap to upload</div>
                    <div style={{fontSize:12, marginTop:4}}>or drag a photo here</div>
                  </div>
                )}
                {filled && (
                  <div style={{position:'absolute', top:10, right:10, width:28, height:28, borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <Icons.Check width={14} height={14}/>
                  </div>
                )}
              </div>
              <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:18}}>{s.label}</div>
              <div style={{fontSize:12, color:'rgba(42,36,29,.55)', marginTop:2}}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <SalonBtn variant="ghost" onClick={() => go('quiz')}><Icons.ArrowL width={14} height={14}/> Back to quiz</SalonBtn>
        <SalonBtn onClick={() => go('browse')} size="lg">See my styles <Icons.Arrow width={16} height={16}/></SalonBtn>
      </div>
    </div>
  );
}

// ── Salon · Browse ─────────────────────────────────────────────────────────
function SalonBrowse({ go, favs, toggle }) {
  const [filter, setFilter] = React.useState('All');
  const filters = ['All','Short','Medium','Long'];
  const tags = ['Classic','Edgy','Romantic','Effortless','Bold','Sleek'];
  const [activeTag, setActiveTag] = React.useState(null);
  const items = HAIRSTYLES.filter(h =>
    (filter === 'All' || h.length === filter) &&
    (!activeTag || h.tags.includes(activeTag))
  );

  return (
    <div style={{flex:1, overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <div style={{padding:'24px 48px 14px', background:'var(--p-paper,#f7f1e8)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12}}>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, letterSpacing:-0.6, margin:0}}>
            Styles for you
          </h2>
          <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{items.length} looks · refreshed daily</div>
        </div>
        <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
          <div style={{display:'flex', gap:4, padding:4, background:'var(--p-chip,#efe6d9)', borderRadius:99}}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  appearance:'none', border:0, padding:'6px 14px', borderRadius:99,
                  background: filter === f ? 'var(--p-card,#fff)' : 'transparent',
                  fontWeight: filter === f ? 600 : 500, fontSize:12, fontFamily:'inherit',
                  color:'var(--p-ink,#2a241d)', cursor:'pointer',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}>{f}</button>
            ))}
          </div>
          <div style={{width:1, height:18, background:'rgba(0,0,0,.1)'}}/>
          {tags.map(t => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
              style={{
                appearance:'none', borderRadius:99, padding:'6px 12px', fontSize:12, fontFamily:'inherit',
                border: activeTag === t ? '1px solid var(--p-hair,#c97a55)' : '1px solid rgba(0,0,0,.1)',
                background: activeTag === t ? 'var(--p-hair,#c97a55)' : 'transparent',
                color: activeTag === t ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                cursor:'pointer', fontWeight:500,
              }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1, overflow:'auto', padding:'18px 48px 36px'}}>
        <div style={{columnCount:4, columnGap:14}}>
          {items.map((s) => {
            const liked = favs.has(s.id);
            return (
              <div key={s.id} onClick={() => go(s.id)} style={{
                breakInside:'avoid', marginBottom:14, background:'var(--p-card,#fff)',
                borderRadius:18, overflow:'hidden', cursor:'pointer',
                boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 6px 14px rgba(0,0,0,.04)',
              }}>
                <div style={{position:'relative', aspectRatio: `1 / ${s.ratio}`}}>
                  <StripedPlaceholder style={s} showLabel={false}/>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{
                      position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%',
                      background: liked ? 'var(--p-hair,#c97a55)' : 'rgba(255,255,255,.92)',
                      color: liked ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                      border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 6px rgba(0,0,0,.12)',
                    }}>
                    <HeartIcon filled={liked} size={15}/>
                  </button>
                </div>
                <div style={{padding:'10px 14px 14px'}}>
                  <div style={{fontWeight:600, fontSize:14, marginBottom:4}}>{s.name}</div>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {s.tags.map(t => (
                      <span key={t} style={{fontSize:11, padding:'2px 8px', borderRadius:99, background:'var(--p-chip,#efe6d9)', color:'rgba(42,36,29,.75)'}}>{t}</span>
                    ))}
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

// ── Salon · Detail ─────────────────────────────────────────────────────────
function SalonDetail({ id, favs, toggle, go }) {
  const s = HAIRSTYLES.find((h) => h.id === id) || HAIRSTYLES[0];
  const liked = favs.has(s.id);
  return (
    <div style={{flex:1, overflow:'auto', padding:'24px 48px 36px'}}>
      <button onClick={() => go('browse')}
        style={{background:'transparent', border:0, fontFamily:'inherit', fontSize:13, color:'rgba(42,36,29,.6)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:14}}>
        <Icons.ArrowL width={14} height={14}/> Back to browse
      </button>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <div style={{aspectRatio:'5/6', borderRadius:24, overflow:'hidden', background:'var(--p-card,#fff)'}}>
            <StripedPlaceholder style={s} showLabel={false}/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
            {[0,1,2,3].map((i) => (
              <div key={i} style={{aspectRatio:'1/1', borderRadius:10, overflow:'hidden'}}>
                <StripedPlaceholder bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)" angle={s.angle + i*12} density={s.density - 1} showLabel={false}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'var(--p-card,#fff)', borderRadius:24, padding:'28px 28px', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 12px 28px rgba(0,0,0,.05)'}}>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            {s.tags.map(t => (
              <span key={t} style={{fontSize:11, padding:'2px 10px', borderRadius:99, background:'var(--p-chip,#efe6d9)'}}>{t}</span>
            ))}
          </div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:36, letterSpacing:-0.8, margin:'0 0 8px'}}>
            {s.name}
          </h2>
          <p style={{fontSize:14.5, color:'rgba(42,36,29,.7)', margin:'0 0 22px', lineHeight:1.55}}>
            A friendly, modern cut that flatters most face shapes. Softer through the lengths so it grows out nicely; you can wear it polished or undone.
          </p>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24}}>
            {[
              ['Time to style', '5–10 min', '⏱'],
              ['Trim cycle',    '6–8 weeks', '✂'],
              ['Best for',      'Heart, oval', '✿'],
              ['Texture',       'Wavy, straight', '∿'],
            ].map(([k,v,e]) => (
              <div key={k} style={{background:'var(--p-paper,#f7f1e8)', borderRadius:14, padding:'10px 12px'}}>
                <div style={{fontSize:11, color:'rgba(42,36,29,.55)', textTransform:'uppercase', letterSpacing:0.05, fontWeight:600}}>{k}</div>
                <div style={{fontSize:14, fontWeight:600, marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{fontWeight:600, fontSize:13, marginBottom:8}}>What you'll need to ask for</div>
          <ul style={{margin:0, padding:'0 0 0 18px', fontSize:13, color:'rgba(42,36,29,.75)', lineHeight:1.6}}>
            <li>Length stops at the collarbone</li>
            <li>Internal layers, not surface ones</li>
            <li>Soft, longer bangs starting at the cheekbone</li>
          </ul>

          <div style={{display:'flex', gap:10, marginTop:22}}>
            <SalonBtn variant={liked ? 'ink' : 'primary'} onClick={() => toggle(s.id)}>
              <HeartIcon filled={liked} size={14}/> {liked ? 'Saved' : 'Save'}
            </SalonBtn>
            <SalonBtn variant="secondary">Share with stylist</SalonBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Salon · Favorites ──────────────────────────────────────────────────────
function SalonFavorites({ favs, toggle, go }) {
  const items = HAIRSTYLES.filter(h => favs.has(h.id));
  return (
    <div style={{padding:'28px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, letterSpacing:-0.6, margin:0}}>Your favorites</h2>
          <div style={{fontSize:13, color:'rgba(42,36,29,.6)', marginTop:4}}>
            {items.length === 0 ? 'Save styles you love and they\'ll live here.' : `${items.length} looks · ready to share with your stylist`}
          </div>
        </div>
        {items.length > 0 && (
          <div style={{display:'flex', gap:8}}>
            <SalonBtn variant="secondary" size="sm">Export PDF</SalonBtn>
            <SalonBtn size="sm">Share collection</SalonBtn>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{
          background:'var(--p-card,#fff)', borderRadius:24, padding:'80px 24px', textAlign:'center',
          boxShadow:'0 1px 2px rgba(0,0,0,.04)',
        }}>
          <div style={{width:56, height:56, borderRadius:'50%', background:'var(--p-chip,#efe6d9)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Icons.Heart width={24} height={24}/>
          </div>
          <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20}}>No favorites yet</div>
          <div style={{fontSize:13, color:'rgba(42,36,29,.6)', marginTop:6, marginBottom:14}}>Tap the heart on any style to save it.</div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
          {items.map(s => {
            return (
              <div key={s.id} style={{background:'var(--p-card,#fff)', borderRadius:18, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 6px 14px rgba(0,0,0,.04)'}}>
                <div style={{position:'relative', aspectRatio:'4/5', cursor:'pointer'}} onClick={() => go(s.id)}>
                  <StripedPlaceholder style={s} showLabel={false}/>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <HeartIcon filled size={15}/>
                  </button>
                </div>
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontWeight:600, fontSize:14}}>{s.name}</div>
                  <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{s.length} · {s.tags.join(', ')}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Salon · Photos ─────────────────────────────────────────────────────────
function SalonPhotos({ photos, go }) {
  const slots = [
    { id:'front', label:'Front',      file:'IMG_2401.heic' },
    { id:'left',  label:'Left side',  file:'IMG_2402.heic' },
    { id:'right', label:'Right side', file:'IMG_2403.heic' },
  ];
  return (
    <div style={{padding:'28px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, letterSpacing:-0.6, margin:0}}>My photos</h2>
          <div style={{fontSize:13, color:'rgba(42,36,29,.6)', marginTop:4}}>These help us match styles to your face shape. Only you can see them.</div>
        </div>
        <SalonBtn variant="secondary" onClick={() => go('upload')}>Retake photos</SalonBtn>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
        {slots.map((s, i) => {
          const filled = photos[s.id];
          return (
            <div key={s.id} style={{background:'var(--p-card,#fff)', borderRadius:20, padding:14, boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
              <div style={{aspectRatio:'3/4', borderRadius:14, overflow:'hidden', marginBottom:10, background: filled ? 'var(--p-stripe,#eadccb)' : 'var(--p-paper,#f7f1e8)'}}>
                {filled ? (
                  <StripedPlaceholder bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)" angle={i*15} density={5} showLabel={false}/>
                ) : (
                  <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(42,36,29,.55)'}}>
                    Not uploaded yet
                  </div>
                )}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:16}}>{s.label}</div>
                  <div style={{fontSize:11.5, color:'rgba(42,36,29,.55)'}}>{filled ? s.file : 'add a photo'}</div>
                </div>
                <button style={{appearance:'none', background:'var(--p-chip,#efe6d9)', border:0, width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  ⋯
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop:24, background:'var(--p-card,#fff)', borderRadius:20, padding:'18px 22px',
        display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 2px rgba(0,0,0,.04)',
      }}>
        <div style={{width:38, height:38, borderRadius:'50%', background:'var(--p-chip,#efe6d9)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icons.Sparkle width={20} height={20}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600, fontSize:14}}>Privacy</div>
          <div style={{fontSize:12.5, color:'rgba(42,36,29,.6)'}}>Photos stay on your device — we only use them to filter recommendations locally.</div>
        </div>
      </div>
    </div>
  );
}

// ── Salon · Profile ────────────────────────────────────────────────────────
function SalonProfile() {
  return (
    <div style={{padding:'28px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:24}}>
        <div style={{background:'var(--p-card,#fff)', borderRadius:20, padding:22, boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'var(--p-stripe,#eadccb)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces',serif", fontSize:30, fontWeight:600}}>J</div>
          <div style={{textAlign:'center', fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20}}>Jordan Lee</div>
          <div style={{textAlign:'center', fontSize:12, color:'rgba(42,36,29,.6)', marginBottom:18}}>jordan@hello.co</div>
          <SalonBtn variant="secondary" size="sm" style={{width:'100%'}}>Edit profile</SalonBtn>

          <div style={{marginTop:20, paddingTop:16, borderTop:'1px solid rgba(0,0,0,.06)'}}>
            <div style={{fontSize:11, fontWeight:600, color:'rgba(42,36,29,.55)', textTransform:'uppercase', letterSpacing:0.05, marginBottom:10}}>Your tags</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {['Heart shape','Wavy','Medium','Effortless'].map(t => (
                <span key={t} style={{fontSize:12, padding:'4px 10px', borderRadius:99, background:'var(--p-chip,#efe6d9)'}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{background:'var(--p-card,#fff)', borderRadius:20, padding:'18px 22px', boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
          <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20, marginBottom:8}}>Settings</div>
          {[
            ['Notifications','New styles weekly', true],
            ['Photo backup','Off', false],
            ['Stylist sharing','Allow link sharing', true],
            ['Trim reminders','Every 8 weeks', true],
            ['Theme','Soft cream'],
          ].map(([k,v,toggle]) => (
            <div key={k} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderTop:'1px solid rgba(0,0,0,.05)'}}>
              <div>
                <div style={{fontWeight:600, fontSize:13}}>{k}</div>
                <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{v}</div>
              </div>
              {toggle !== undefined && (
                <div style={{
                  width:36, height:20, borderRadius:99,
                  background: toggle ? 'var(--p-hair,#c97a55)' : 'rgba(0,0,0,.15)',
                  position:'relative', cursor:'pointer',
                }}>
                  <div style={{
                    position:'absolute', top:2, left: toggle ? 18 : 2, width:16, height:16, borderRadius:'50%',
                    background:'var(--p-paper,#f7f1e8)', transition:'left .15s',
                  }}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.SalonApp = SalonApp;
