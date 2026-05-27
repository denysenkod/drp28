// Shared atoms + data for all three Hairstyle Finder directions.

// ── Hairstyle catalog ──────────────────────────────────────────────────────
// Gender-inclusive. Aspect ratio drives masonry variety.
const HAIRSTYLES = [
  { id: 'curtain',    name: 'Soft Curtain Bangs',  length: 'Medium', tags: ['Romantic','Wavy'],   ratio: 1.35, angle: 12,  density: 7 },
  { id: 'shag',       name: 'Shoulder Shag',       length: 'Medium', tags: ['Edgy','Tousled'],    ratio: 1.10, angle: -8,  density: 6 },
  { id: 'pixie',      name: 'Pixie Crop',          length: 'Short',  tags: ['Bold','Classic'],    ratio: 0.95, angle: 0,   density: 9 },
  { id: 'longlayers', name: 'Long Layered',        length: 'Long',   tags: ['Effortless'],         ratio: 1.55, angle: 6,   density: 5 },
  { id: 'wolf',       name: 'Wolf Cut',            length: 'Medium', tags: ['Edgy','Wavy'],       ratio: 1.20, angle: -14, density: 6 },
  { id: 'bluntbob',   name: 'Blunt Bob',           length: 'Short',  tags: ['Classic','Sleek'],   ratio: 1.00, angle: 90,  density: 8 },
  { id: 'lob',        name: 'Tousled Lob',         length: 'Medium', tags: ['Effortless'],         ratio: 1.15, angle: 18,  density: 6 },
  { id: 'mullet',     name: 'Mod Mullet',          length: 'Medium', tags: ['Bold','Edgy'],       ratio: 1.05, angle: -22, density: 7 },
  { id: 'buzz',       name: 'Buzz Fade',           length: 'Short',  tags: ['Bold','Minimal'],    ratio: 0.90, angle: 0,   density: 11 },
  { id: 'quiff',      name: 'Side-Part Quiff',     length: 'Short',  tags: ['Classic'],            ratio: 1.05, angle: 30,  density: 8 },
  { id: 'waves',      name: 'Mid-Length Waves',    length: 'Medium', tags: ['Romantic','Wavy'],   ratio: 1.30, angle: 22,  density: 6 },
  { id: 'frenchbob',  name: 'Sleek French Bob',    length: 'Short',  tags: ['Classic','Sleek'],   ratio: 0.92, angle: 90,  density: 10 },
  { id: 'crop',       name: 'Textured Crop',       length: 'Short',  tags: ['Edgy','Tousled'],    ratio: 1.00, angle: -6,  density: 9 },
  { id: 'beach',      name: 'Beach Curls',         length: 'Long',   tags: ['Effortless','Wavy'],  ratio: 1.45, angle: 16,  density: 5 },
  { id: 'ballet',     name: 'Ballet Bun',          length: 'Long',   tags: ['Classic','Sleek'],   ratio: 1.25, angle: 0,   density: 7 },
  { id: 'curlshag',   name: 'Curly Shag',          length: 'Medium', tags: ['Edgy','Curly'],      ratio: 1.18, angle: -18, density: 6 },
  { id: 'pageboy',    name: 'Soft Pageboy',        length: 'Short',  tags: ['Classic','Sleek'],   ratio: 0.98, angle: 90,  density: 8 },
  { id: 'curtaincurl',name: 'Curtain + Curls',     length: 'Long',   tags: ['Romantic'],           ratio: 1.50, angle: 24,  density: 5 },
];

// ── Quiz (card-by-card visual choices) ─────────────────────────────────────
const QUIZ = [
  { id:'face', title:'Pick the face shape closest to yours', sub:'You can change this later.',
    multi:false, options:[
      {value:'oval',    label:'Oval',    sub:'Balanced length & width'},
      {value:'round',   label:'Round',   sub:'Soft, full cheeks'},
      {value:'square',  label:'Square',  sub:'Defined jaw'},
      {value:'heart',   label:'Heart',   sub:'Wider forehead, narrow chin'},
      {value:'long',    label:'Long',    sub:'Length greater than width'},
      {value:'diamond', label:'Diamond', sub:'Narrow forehead & jaw'},
    ]
  },
  { id:'length', title:'Where do you want to land?', sub:'Your target length.',
    multi:false, options:[
      {value:'short',  label:'Short',  sub:'Above the jaw'},
      {value:'medium', label:'Medium', sub:'Shoulder area'},
      {value:'long',   label:'Long',   sub:'Below the collarbone'},
    ]
  },
  { id:'texture', title:'What is your natural texture?',
    multi:false, options:[
      {value:'straight', label:'Straight'},
      {value:'wavy',     label:'Wavy'},
      {value:'curly',    label:'Curly'},
      {value:'coily',    label:'Coily'},
    ]
  },
  { id:'lifestyle', title:'How much time do you want to spend on it?', sub:'Daily styling reality.',
    multi:false, options:[
      {value:'low',  label:'Almost none', sub:'< 5 min'},
      {value:'med',  label:'A little',    sub:'5–15 min'},
      {value:'high', label:'I enjoy it',  sub:'15+ min'},
    ]
  },
  { id:'vibes', title:'Pick the vibes that feel like you', sub:'Choose any number.',
    multi:true, options:[
      {value:'classic',    label:'Classic'},
      {value:'edgy',       label:'Edgy'},
      {value:'romantic',   label:'Romantic'},
      {value:'effortless', label:'Effortless'},
      {value:'minimal',    label:'Minimal'},
      {value:'bold',       label:'Bold'},
    ]
  },
];

// ── Striped placeholder ────────────────────────────────────────────────────
// Deterministic stripe pattern keyed off a hairstyle. Looks like a fabric
// swatch; we vary angle + density per item so the masonry has rhythm.
// Optional small label in mono.
function StripedPlaceholder({
  style, bg, stripe, label, mono = false,
  angle = null, density = null, ratio = null,
  showLabel = true, labelPlacement = 'br', children,
}) {
  const a = angle ?? style?.angle ?? 12;
  const d = density ?? style?.density ?? 7;
  // CSS repeating-linear-gradient — soft, painterly. Two-stop stripes that
  // alternate paper/hair-soft so the result reads as a tonal swatch rather
  // than barcode.
  const spacing = Math.max(4, 18 - d);
  const bgC = bg || 'var(--p-stripe, #eadccb)';
  const stC = stripe || 'var(--p-hairSoft, #f1c9b3)';
  const bgImg = `repeating-linear-gradient(${a}deg, ${bgC} 0 ${spacing}px, ${stC} ${spacing}px ${spacing*1.6}px)`;
  const pos = {
    br: { right: 8, bottom: 8 },
    bl: { left: 8, bottom: 8 },
    tl: { left: 8, top: 8 },
    tr: { right: 8, top: 8 },
  }[labelPlacement] || { right: 8, bottom: 8 };
  return (
    <div style={{
      position:'relative', width:'100%', height:'100%',
      backgroundImage: bgImg, overflow:'hidden',
    }}>
      {/* a subtle vignette so it doesn't feel flat */}
      <div style={{position:'absolute', inset:0, background:'radial-gradient(120% 80% at 50% 40%, transparent 50%, rgba(0,0,0,.08))'}} />
      {showLabel && (label || style?.name) && (
        <div style={{
          position:'absolute', ...pos,
          padding:'4px 8px',
          background:'rgba(255,255,255,.82)',
          color: 'var(--p-ink, #2a241d)',
          fontFamily: mono ? "'DM Mono', ui-monospace, monospace" : 'inherit',
          fontSize: 10.5, letterSpacing: mono ? 0.04 : 0,
          fontWeight: 500, borderRadius: 2,
          textTransform: mono ? 'uppercase' : 'none',
          whiteSpace:'nowrap',
        }}>
          {mono ? 'IMG · ' : ''}{label || style?.name}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Image slots wrapper ───────────────────────────────────────────────────
// React wrapper around <image-slot>. The slot id is keyed by hairstyle so
// a photo dropped once shows everywhere that style appears.
function HairImage({ style, suffix = '', radius = 0 }) {
  const a = style?.angle ?? 12;
  const d = style?.density ?? 7;
  const spacing = Math.max(4, 18 - d);
  const bg = `repeating-linear-gradient(${a}deg, var(--p-stripe, #e6d6b8) 0 ${spacing}px, var(--p-hairSoft, #e8b39b) ${spacing}px ${spacing*1.6}px)`;
  // image-slot is a custom element — React passes string attributes through
  // as-is. We also stamp the host with the striped pattern so the empty
  // state shows the textured fallback through ::part(frame){background:transparent}.
  return (
    <div style={{
      width:'100%', height:'100%', position:'relative',
      backgroundImage: bg,
      borderRadius: radius || undefined, overflow: radius ? 'hidden' : undefined,
    }}>
      <image-slot
        id={`hair-${style.id}${suffix ? '-' + suffix : ''}`}
        shape={radius ? 'rounded' : 'rect'}
        radius={radius || undefined}
        placeholder={`Drop a "${style.name}" photo`}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }}
      />
    </div>
  );
}

// Face upload slot — each slot has its own persistent id.
function FaceSlot({ slot, label, instructions }) {
  return (
    <image-slot
      id={`face-${slot}`}
      shape="rect"
      placeholder={`${label} — drop photo`}
      style={{ width:'100%', height:'100%', display:'block', background:'var(--p-stripe, #e6d6b8)' }}
    />
  );
}


const HeartIcon = ({ filled, size = 16, color = 'currentColor', stroke = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? color : 'none'} stroke={color} strokeWidth={stroke} strokeLinejoin="round">
    <path d="M10 17s-6.5-4.2-6.5-9A3.5 3.5 0 0 1 10 5.5 3.5 3.5 0 0 1 16.5 8c0 4.8-6.5 9-6.5 9z" />
  </svg>
);

// ── Generic icon set (line) ────────────────────────────────────────────────
const Icons = {
  Home: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>,
  Quiz: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 9a4 4 0 1 1 5.5 3.7c-1 .4-1.5 1-1.5 2v.3"/><circle cx="12" cy="18" r=".5" fill="currentColor"/></svg>,
  Camera: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  Browse: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  Heart: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>,
  Photos: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-4 4 3 4-3 5 5"/></svg>,
  Profile: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>,
  Arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  ArrowL: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  Plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l4 4 10-10"/></svg>,
  Sparkle: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4z" opacity=".8"/><path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"/></svg>,
  Search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></svg>,
  X: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
};

// ── Hook: shared favorites state per-app ───────────────────────────────────
// Each direction calls this independently — they don't share favorites across
// the canvas (so each one demos "empty -> save -> populated" cleanly).
function useFavorites(initial = []) {
  const [favs, setFavs] = React.useState(new Set(initial));
  const toggle = React.useCallback((id) => {
    setFavs((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);
  return [favs, toggle];
}

// ── Hook: simple screen router with history ────────────────────────────────
function useScreen(initial) {
  const [screen, setScreen] = React.useState(initial);
  const [stack, setStack] = React.useState([]);
  const go = (s) => { setStack((st) => [...st, screen]); setScreen(s); };
  const back = () => setStack((st) => { if (!st.length) return st; setScreen(st[st.length - 1]); return st.slice(0, -1); });
  const reset = (s) => { setStack([]); setScreen(s); };
  return { screen, go, back, reset };
}

// Make everything global so other JSX files pick it up.
Object.assign(window, {
  HAIRSTYLES, QUIZ,
  StripedPlaceholder, HairImage, FaceSlot, HeartIcon, Icons,
  useFavorites, useScreen,
});
