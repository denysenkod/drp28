// ---------- API + persistent session ----------
const API = {
  gallery: "/api/gallery",
  favorites: "/api/favorites",
  userPhotos: "/api/user-photos"
};

const SESSION_KEY = "drp28.frontend.sessionId";
const VIEW_KEY = "drp28.frontend.view";
const ANSWERS_KEY = "drp28.frontend.answers";
const STEP_KEY = "drp28.frontend.quizStep";
const PREV_VIEW_KEY = "drp28.frontend.prevView";

function readStored(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

function getSessionId() {
  try {
    const existing = window.localStorage.getItem(SESSION_KEY);
    if (existing) return existing;

    const next = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    window.localStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}

async function apiJson(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json" } : {}),
      ...options.headers
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || "Request failed.");
  }
  return data;
}

// ---------- Icons ----------
const iconAttrs = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

function iconSearch() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" ${iconAttrs}/><path d="M16 16l4 4" ${iconAttrs}/></svg>`;
}

function iconArrow() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" ${iconAttrs}/></svg>`;
}

function iconCheck() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" ${iconAttrs}/></svg>`;
}

function textureIcon(kind) {
  const columns = [8, 16, 24].map((x) => x * 2);
  if (kind === "straight") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="54" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "wavy") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<path d="M${x} 10 q7 8 0 16 q-7 8 0 16 q7 8 0 12" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "curly") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<path d="M${x} 11 c9 3 9 11 0 13 c-9 2 -9 10 0 13 c9 3 9 11 0 13" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "coily") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<path d="M${x - 4} 11 l8 5 l-8 5 l8 5 l-8 5 l8 5 l-8 5 l8 5" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "fine") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><line x1="26" y1="10" x2="26" y2="54" ${iconAttrs} stroke-width="1"/><line x1="38" y1="10" x2="38" y2="54" ${iconAttrs} stroke-width="1"/></svg>`;
  }
  if (kind === "thick") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${[14, 22, 30, 38, 46].map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="54" ${iconAttrs} stroke-width="2.4"/>`).join("")}</svg>`;
  }
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" ${iconAttrs}/><path d="M28 25a5 5 0 1 1 6 4.8c-1.5.7-2 1.8-2 4.2M32 43h.01" ${iconAttrs}/></svg>`;
}

function faceIcon(kind) {
  const shapes = {
    oval: `<ellipse cx="32" cy="32" rx="16" ry="22" ${iconAttrs}/>`,
    round: `<circle cx="32" cy="32" r="20" ${iconAttrs}/>`,
    square: `<rect x="13" y="13" width="38" height="38" rx="7" ${iconAttrs}/>`,
    heart: `<path d="M32 52C16 40 12 28 12 22a9 9 0 0 1 20-3 9 9 0 0 1 20 3c0 6-4 18-20 30Z" ${iconAttrs}/>`,
    diamond: `<path d="M32 10l20 22-20 22-20-22Z" ${iconAttrs}/>`,
    oblong: `<rect x="17" y="9" width="30" height="46" rx="13" ${iconAttrs}/>`,
    triangle: `<path d="M32 11l19 42H13Z" ${iconAttrs}/>`,
    unknown: `<circle cx="32" cy="32" r="20" ${iconAttrs}/><path d="M28 26a5 5 0 1 1 6 4.8c-1.5.7-2 1.8-2 4.2M32 43h.01" ${iconAttrs}/>`
  };
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${shapes[kind] || shapes.unknown}</svg>`;
}

function lengthIcon(level) {
  if (level >= 6) {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="16" r="8" ${iconAttrs}/><path d="M16 40q16-12 32 0M16 48q16-12 32 0" ${iconAttrs}/></svg>`;
  }
  const len = [4, 12, 20, 28, 38, 48][level] || 20;
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="16" r="8" ${iconAttrs}/><path d="M24 16q-6 4-6 ${len}M40 16q6 4 6 ${len}" ${iconAttrs}/></svg>`;
}

// ---------- Data ----------
const FALLBACK_STYLES = [
  {
    id: "gq-2026-clean-grow-out-1",
    name: "The clean grow-out 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888c63c5f26c0fd7f500abf/2:3/w_1600%2Cc_limit/1245571484",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-clean-grow-out"]
  },
  {
    id: "gq-2026-classic-centre-part-1",
    name: "The classic centre part 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888cb98252c3996a45213e0/2:3/w_1600%2Cc_limit/1542850327",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-classic-centre-part"]
  },
  {
    id: "gq-2026-curtain-fringe-1",
    name: "The curtain fringe 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888cbd15f26c0fd7f500ac4/2:3/w_1600%2Cc_limit/1816600139",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-curtain-fringe"]
  },
  {
    id: "gq-2026-edgar",
    name: "The Edgar",
    imageUrl: "https://media.gq-magazine.co.uk/photos/65d768e3788f1850a51b058f/master/w_1600%2Cc_limit/Edgar%20Hair.jpeg",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-edgar"]
  },
  {
    id: "gq-2026-mod-ish-1",
    name: "The mod-ish 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888cc175a1f3d25cbc5eab2/2:3/w_1600%2Cc_limit/85365226",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-mod-ish"]
  },
  {
    id: "gq-2026-baby-mullet-1",
    name: "The baby mullet 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888ccbe5f26c0fd7f500ac6/2:3/w_1600%2Cc_limit/2018437016",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-baby-mullet"]
  },
  {
    id: "gq-2026-frosted-tips-1",
    name: "The frosted tips 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888cd650592e7fecb6bb65b/2:3/w_1600%2Cc_limit/2199812533",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-frosted-tips"]
  },
  {
    id: "gq-2026-dyed-buzz-cut-1",
    name: "The dyed buzz cut 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888ce505a1f3d25cbc5eaba/2:3/w_1600%2Cc_limit/1326358860",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-dyed-buzz-cut"]
  },
  {
    id: "gq-2026-rockstar-shag-1",
    name: "The rockstar shag 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888ce935f26c0fd7f500aca/2:3/w_1600%2Cc_limit/2077467372",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-rockstar-shag"]
  },
  {
    id: "gq-2026-crew-cut-1",
    name: "The crew cut 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888cec15f26c0fd7f500ace/master/w_1600%2Cc_limit/2192560558",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-crew-cut"]
  },
  {
    id: "gq-2026-side-parting-1",
    name: "The side parting 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888cee95f26c0fd7f500ad2/2:3/w_1600%2Cc_limit/899012366",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-side-parting"]
  },
  {
    id: "gq-2026-tailored-buzz-1",
    name: "The tailored buzz 1",
    imageUrl: "https://media.gq-magazine.co.uk/photos/6888d0c2a3a4119d1a416a7d/master/w_1600%2Cc_limit/2221717034",
    description: "Source: British GQ article The 2026 hair trends for an extremely advanced cut.",
    features: ["gq", "mens-hair-trends", "the-tailored-buzz"]
  }
];

// Base length choices, shared across all genders. When the survey targets a
// single gender these are shown as-is; when it targets both genders each one is
// expanded into a male and a female variant (see buildLengthOptions).
const LENGTH_OPTIONS_BASE = [
  { value: "buzz", label: "Very short", icon: lengthIcon(0), length: "Very Short", image: "/Images/LongHair.webp", images: { masculine: "https://www.kaya.in/media/.renditions/wysiwyg/crew-cut-with-fade-men-short-hairstyle.png", feminine: "https://www.copenhagenfashionsummit.com/wp-content/uploads/2025/12/Undercut-Pixie.png"} },
  { value: "short", label: "Short", icon: lengthIcon(1), length: "Short", image: "/Images/LongHair.webp", images: { masculine: "https://9f8e62d4.delivery.rocketcdn.me/wp-content/uploads/2023/10/Messy-Textured-Crop-2.jpg", feminine: "https://www.southernliving.com/thmb/Deu04ZuiLAL-3r_BkHo8AgRqrnI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/Screenshot2024-02-02at1.35.11PM-5e651e05e7e34546ab7c6e554e959acf.png"} },
  { value: "medium", label: "Medium", icon: lengthIcon(2), length: "Medium", image: "/Images/LongHair.webp", images: { masculine: "https://cdn.prod.website-files.com/6691f4c15ef1cd5c89763f60/68ea41b5fa7494900d4cc32c_Medium%20Length%20Hairstyles%20for%20Men.webp", feminine: "https://hips.hearstapps.com/hmg-prod/images/hbz-medium-length-hair-gettyimages-1203448672.jpg"} },
  { value: "long", label: "Long", icon: lengthIcon(4), length: "Long", image: "/Images/LongHair.webp", images: { masculine: "https://manforhimself.com/wp-content/uploads/2020/06/mens-hairstyle-haircut-long-grown-out-MFH7-man-for-himself.jpg", feminine: "https://www.fabmood.com/inspiration/wp-content/uploads/2025/02/97425740572471240.jpg"} }
];

const LENGTH_OPEN_OPTION = { value: "open", label: "No preference", icon: lengthIcon(6), exclusive: true };

// The genders a "both" survey can pick a length for. The value prefix keeps the
// gendered options distinct in stored answers (e.g. "men:short", "women:long").
const LENGTH_GENDER_VARIANTS = [
  { prefix: "men", gender: "Men", imageKey: "masculine" },
  { prefix: "women", gender: "Women", imageKey: "feminine" }
];

// Builds the length question's options for the current survey gender. For a
// single gender the plain length choices are used (gender is already fixed by
// the style question). For "both" each length is split into a male and a female
// option so the user can ask for, say, short men's hair and long women's hair.
function buildLengthOptions() {
  if (selectedSurveyGender() === "both") {
    const gendered = [];
    for (const variant of LENGTH_GENDER_VARIANTS) {
      for (const base of LENGTH_OPTIONS_BASE) {
        gendered.push({
          ...base,
          value: `${variant.prefix}:${base.value}`,
          label: `${base.label} (${variant.gender})`,
          gender: variant.gender,
          image: base.images?.[variant.imageKey] || base.image
        });
      }
    }
    return [...gendered, LENGTH_OPEN_OPTION];
  }
  return [...LENGTH_OPTIONS_BASE, LENGTH_OPEN_OPTION];
}

const QUIZ = [
  {
    id: "style",
    title: "What style are you looking for?",
    sub: "",
    layout: "image",
    options: [
      { value: "masculine", label: "Masculine styles", gender: "Men", image: "/Images/MasculineStyles.webp" },
      { value: "feminine", label: "Feminine styles", gender: "Women", image: "/Images/FeminineStyles.jpg" },
      { value: "__all", label: "Show me everything", selectAll: true }
    ]
  },
  {
    id: "texture",
    title: "What is your desired hair texture?",
    sub: "Your actual texture will be factored in during our hair maintanence plans.",
    layout: "icon",
    options: [
      { value: "straight", label: "Straight", icon: textureIcon("straight"), hairType: "Straight Hair", image: "/Images/LongHair.webp", images: { masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/textured-fringe-straight-hair-men.webp?v=1768222652", feminine: "https://i0.wp.com/therighthairstyles.com/wp-content/uploads/2014/12/1-short-classy-style-with-curtain-bangs.jpg?resize=500%2C556&ssl=1" }},
      { value: "wavy", label: "Wavy", icon: textureIcon("wavy"), hairType: "Wavy Hair", image: "/Images/LongHair.webp", images: { masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/medium-length-wavy-hairstyle-men.webp?v=1767878793", feminine: "https://scottj.com/wp-content/uploads/2026/03/3-897x1024.webp"} },
      { value: "curly", label: "Curly", icon: textureIcon("curly"), hairType: "Curly Hair", image: "/Images/LongHair.webp", images: { masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/taper-fade-curly-hair-men.webp?v=1767776997", feminine: "https://ucarecdn.com/2c12cace-f519-415a-adeb-fe89f9d123e7/-/format/auto/-/preview/3000x3000/-/quality/lighter/3422432_qdw2.jpg"} },
      { value: "coily", label: "Coily", icon: textureIcon("coily"), hairType: "Coily Hair", image: "/Images/LongHair.webp", images: { masculine: "https://theorganibrands.com/cdn/shop/articles/IMG_1611-5085105.jpg?v=1774982816", feminine: "https://mooandyoo.com/cdn/shop/articles/4A_landscape_3.jpg?v=1729522577"} },
      { value: "unsure", label: "Not sure", icon: textureIcon("unsure"), exclusive: true }
    ]
  },
  {
    id: "length",
    title: "How long are you thinking?",
    layout: "icon",
    // Options and helper copy depend on whether the survey targets one gender or
    // both, so they are computed on access rather than fixed up front.
    get sub() {
      return selectedSurveyGender() === "both"
        ? "Pick a male and/or female length - you can mix and match across genders."
        : "Pick the option which best resembles your desired length.";
    },
    get options() {
      return buildLengthOptions();
    }
  },
  {
    id: "vibe",
    title: "Which words best describe the vibe you are going for?",
    layout: "icon",
    sub: "Feel free to pick multiple options. This will help inform your recommendations.",
    options: [
      { value: "classic", label: "Classic & timeless", vibe: "classic", keywords: ["classic", "side part", "centre part"], images: {masculine: "https://cdn.thecoolist.com/wp-content/uploads/2017/05/Slicked-Back-classic-mens-hairstyle-762x999.jpg", feminine: "https://www.southernliving.com/thmb/LlL4kY3i6nVCQae0jn-sfug9mqg=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/layers-abe96a8b1e114f65bc44bf97b74ebb3b.jpg"} },
      { value: "trendy", label: "Trendy & modern", keywords: ["modern", "mod", "crop", "trendy"], images: {masculine: "https://lowtaperfades.com/wp-content/uploads/2026/02/Untitled-design-2026-02-28T063037.589.webp", feminine: "https://media.glamour.com/photos/5f0e32bc9f970c720ce36ec6/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-14%2520at%25206.33.11%2520PM.png"}  },
      { value: "bold", label: "Bold & edgy", vibe: "bold", keywords: ["bold", "edgy", "mullet", "dyed", "frosted"], images: {masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/liberty-spikes-hairstyle-men.webp?v=1758794959", feminine: "https://content.latest-hairstyles.com/wp-content/uploads/edgy-haircuts-for-women-1200x900.jpg"}  },
      { value: "soft", label: "Soft & romantic", vibe: "soft", keywords: ["soft", "curtain", "fringe", "long"], images: {masculine: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSs5qo7QQxOuinGP4_1XF1hRbFV8lGF_VOf6A&s", feminine: "https://hairstyles.thehairstyler.com/hairstyle_views/front_view_images/14314/original/long-hairstyle-with-curls.jpg"}  },
      { value: "low-maintanence", label: "Low-maintanence", vibe: "low-maintanence", keywords: ["natural", "effortless", "grow out", "wavy", "low-maintanence"], images: {masculine: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNjrYo63_OuWFHS-uO8mlpl07AXuGmtHY7sg&s", feminine: "https://www.byrdie.com/thmb/RfIQsk03xD-ZRGZuObOci6z7-No=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/natural-hair-hairstyle-cd6cfd0c08794b33b485c40c9e324be2.png"}  },
      { value: "professional", label: "Professional & polished", vibe: "professional", keywords: ["professional", "classic", "crew", "side"], images: {masculine: "https://i0.wp.com/therighthairstyles.com/wp-content/uploads/2024/11/20-professional-mens-brushed-back-long-hairstyle.jpg?resize=863%2C913&ssl=1", feminine: "https://i.pinimg.com/736x/35/66/a0/3566a02c87a625fec8af5765fc637247.jpg"}  },
      { value: "playful", label: "Playful & fun", vibe: "playful", keywords: ["playful", "frosted", "dyed", "shag"], images: {masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/curly-mullet-hairstyle-men.webp?v=1767776997", feminine: "https://content.latest-hairstyles.com/wp-content/uploads/galleries/10/07/playful-y2k-double-bun-hairstyle-with-curly-bangs.jpg"}  },
      { value: "sporty", label: "Sporty", vibe: "sporty", keywords: ["sporty", "athletic", "active", "gym", "practical", "short"], images: {masculine: "https://www.kaya.in/media/.renditions/wysiwyg/crew-cut-with-fade-men-short-hairstyle.png", feminine: "https://www.copenhagenfashionsummit.com/wp-content/uploads/2025/12/Undercut-Pixie.png"}  }
    ]
  },
  {
    id: "ethnicity",
    title: "Would you like photos featuring people of a specific ethnicity for inspiration?",
    sub: "This only affects reference inspiration. You can skip it.",
    layout: "text",
    options: [
      { value: "black", label: "Black / African descent"},
      { value: "south east asian", label: "South East Asian"},
      { value: "asian", label: "East Asian"},
      { value: "south-asian", label: "South Asian"},
      { value: "latino", label: "Latino / Hispanic"},
      { value: "middle-eastern", label: "Middle Eastern"},
      { value: "white", label: "White / Caucasian"},
      { value: "none", label: "No preference", exclusive: true }
    ]
  },
  {
    id: "maintenance",
    title: "How much maintenance are you thinking of?",
    layout: "slider",
    options: [
      { value: "low", label: "I'd rather not", upkeep: "Low" },
      { value: "medium", label: "Some is fine", desc: "Curl creams, texture powders, sea salt spray, and more", upkeep: "Medium" },
      { value: "high", label: "All the stops", desc: "Hair straighteners, curlers, dyes, treatments, and so on", upkeep: "High" }
    ]
  },
];

const FACE_SHAPE_FILTER = {
  id: "face",
  title: "Which face shape should these styles suit?",
  sub: "Filter by the face-shape labels stored in the hairstyle database.",
  layout: "text",
  options: [
    { value: "oval", label: "Oval", faceShape: "oval" },
    { value: "round", label: "Round", faceShape: "round" },
    { value: "square", label: "Square", faceShape: "square" },
    { value: "heart", label: "Heart", faceShape: "heart" },
    { value: "diamond", label: "Diamond", faceShape: "diamond" },
    { value: "rectangle", label: "Rectangle", faceShape: "rectangle" },
    { value: "triangle", label: "Triangle", faceShape: "triangle" },
    { value: "none", label: "No preference", exclusive: true }
  ]
};

const DISCOVERY_FILTER_QUESTIONS = [
  ...QUIZ.slice(0, 3),
  FACE_SHAPE_FILTER,
  ...QUIZ.slice(3)
];

function slugWords(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^the\s+/, "")
    .replace(/\s+\d+$/, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function titleCase(value) {
  return String(value || "")
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function normalizeLabelList(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const labels = [];

  for (const item of value) {
    const label = String(item || "").trim();
    const key = label.toLowerCase();
    if (!label || seen.has(key)) continue;
    seen.add(key);
    labels.push(label);
  }

  return labels;
}

function inferLength(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  if (/(buzz|crop|crew|edgar|afro|pixie|bob)/.test(text)) return "Short";
  if (/(sweep|grow out|wall street|art dealer|beard|long|layer)/.test(text)) return "Long";
  return "Medium";
}

function inferGender(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`.toLowerCase();
  if (/(mens-hair|men-hair|\bmens\b|\bmen\b|\bmale\b|barber|beard|edgar|crew cut|buzz)/.test(text)) return "Men";
  if (/(glamour|womens-hair|women-hair|\bwomens\b|\bwomen\b|\bfemale\b|pixie|bob|bang|lob)/.test(text)) return "Women";
  return "Unisex";
}

function normalizeGender(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "men" || normalized === "man" || normalized === "male") return "Men";
  if (normalized === "women" || normalized === "woman" || normalized === "female") return "Women";
  if (normalized === "unisex") return "Unisex";
  return "";
}

function normalizeLength(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "very short") return "Very Short";
  if (normalized === "short") return "Short";
  if (normalized === "medium") return "Medium";
  if (normalized === "long") return "Long";
  if (normalized === "very long") return "Very Long";
  return "";
}

function normalizeHairType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "straight" || normalized === "straight hair") return "Straight Hair";
  if (normalized === "wavy" || normalized === "wavy hair") return "Wavy Hair";
  if (normalized === "curly" || normalized === "curly hair") return "Curly Hair";
  if (normalized === "coily" || normalized === "coily hair") return "Coily Hair";
  return "";
}

function normalizeMaintenanceLevel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "medium") return "Medium";
  if (normalized === "higher" || normalized === "high") return "High";
  return "";
}

function normalizeFaceShape(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["oval", "round", "square", "heart", "diamond", "rectangle", "triangle"].includes(normalized)) return normalized;
  if (normalized === "oblong") return "rectangle";
  return "";
}

function inferHairType(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  if (/(coily|kinky)/.test(text)) return "Coily Hair";
  if (/(afro|curl|curly)/.test(text)) return "Curly Hair";
  if (/(wave|wavy|shag|mullet|fringe|grow out|sweep)/.test(text)) return "Wavy Hair";
  return "Straight Hair";
}

function inferMaintainability(title, length) {
  const text = slugWords(title);
  if (/(buzz|crew|crop|afro)/.test(text)) return "Low";
  if (/(frosted|dyed|mullet|rockstar|rat tail|bang)/.test(text)) return "High";
  if (length === "Long") return "Medium";
  return "Medium";
}

function inferLabels(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  const labels = [];
  const checks = [
    ["classic", /(classic|centre|side|wall street|crew)/],
    ["edgy", /(edgar|mullet|shag|mod|rockstar|rat tail|tiktok)/],
    ["bold", /(buzz|dyed|frosted|mullet|edgar|afro)/],
    ["sleek", /(crop|buzz|crew|side|centre)/],
    ["effortless", /(grow out|fringe|sweep|layer)/],
    ["fringe", /(fringe|curtain|bang)/],
    ["buzz cut", /(buzz)/],
    ["crop", /(crop|crew|edgar)/],
    ["mullet", /(mullet)/],
    ["shag", /(shag)/],
    ["side part", /(side part|side parting)/],
    ["centre part", /(centre part|center part)/]
  ];

  for (const [label, pattern] of checks) {
    if (pattern.test(text)) labels.push(label);
  }

  for (const feature of features) {
    const normalized = titleCase(feature);
    if (!/^Gq$|^Mens Hair Trends$/i.test(normalized)) labels.push(normalized.toLowerCase());
  }

  return [...new Set(labels)].slice(0, 8);
}

function detailsForStyle(title, length, hairType, description) {
  const low = length === "Short";
  const maintenance = low
    ? "Keep the outline clean with a trim every 3 to 5 weeks. Use a small amount of matte paste or cream to control shape without making it stiff."
    : "Refresh the shape every 6 to 8 weeks. Dry with fingers or a vent brush first, then add light texture or smoothing product only where needed.";

  return {
    maintenance,
    barber: `Ask for ${title.toLowerCase()} with a ${length.toLowerCase()} overall length and a finish that works with ${hairType.toLowerCase()}. Bring the reference image and ask them to adapt the silhouette to your density and growth pattern.`
  };
}

function galleryItemToStyle(item, index) {
  const title = item.title || item.name || `Style ${index + 1}`;
  const features = Array.isArray(item.features) ? item.features : [];
  const analysis = item.analysis && typeof item.analysis === "object" ? item.analysis : {};
  const length = normalizeLength(item.length) || inferLength(title, features);
  const hairType = normalizeHairType(item.hairType || item.texture) || inferHairType(title, features);
  const gender = normalizeGender(item.gender) || inferGender(title, features);
  const maintenanceLevel = normalizeMaintenanceLevel(item.maintenanceLevel || item.upkeep) || inferMaintainability(title, length);
  const detail = detailsForStyle(title, length, hairType, item.description || "");
  const defaultLabels = [...new Set([...inferLabels(title, features), length.toLowerCase(), hairType.toLowerCase(), gender.toLowerCase()])];
  const labels = Array.isArray(item.labels) ? normalizeLabelList(item.labels) : defaultLabels;
  const maintenance = item.maintenance || analysis.maintenance || detail.maintenance;

  return {
    id: String(item.id || `style-${index + 1}`),
    name: title,
    imageUrl: item.imageUrl || "",
    description: item.description || "",
    labels,
    hairType,
    hairSubtype: String(item.hairSubtype || analysis.hairSubtype || "").trim(),
    length,
    gender,
    maintenanceLevel,
    faceShape: normalizeFaceShape(item.faceShape || analysis.faceShape),
    vibe: String(item.vibe || analysis.vibe || "").trim().toLowerCase(),
    hairColour: String(item.hairColour || analysis.hairColour || "").trim(),
    haircutName: String(item.haircutName || analysis.haircutName || "").trim(),
    classifiedAt: String(item.classifiedAt || analysis.updatedAt || "").trim(),
    analysisModel: String(item.analysisModel || analysis.model || "").trim(),
    features,
    ...detail,
    maintenance
  };
}

// ---------- State ----------
const state = {
  sessionId: getSessionId(),
  styles: FALLBACK_STYLES.map(galleryItemToStyle),
  dbStyles: [],
  galleryLoaded: false,
  galleryLoadError: false,
  view: readStored(VIEW_KEY, "welcome"),
  previousView: readStored(PREV_VIEW_KEY, "welcome"),
  quizStep: readStored(STEP_KEY, 0),
  answers: readStored(ANSWERS_KEY, {}),
  searchQuery: "",
  favourites: new Set(),
  uploadedPhotoName: null,
  filterPanelOpen: false,
  openFilterGroups: new Set(),
  openPreferenceMenu: null
};

const pendingFavouriteOps = new Map();
let currentDetailId = null;

const $ = (sel) => document.querySelector(sel);

const els = {
  app: $("#app"),
  homeBtn: $("#home-btn"),
  topbarSearchInput: $("#topbar-search-input"),
  favouritesBtn: $("#favourites-btn"),
  favCount: $("#fav-count"),
  detailOverlay: $("#detail-overlay"),
  detailImage: $("#detail-image"),
  detailMeta: $("#detail-meta"),
  detailName: $("#detail-name"),
  detailLike: $("#detail-like"),
  detailMaintenance: $("#detail-maintenance"),
  similarResults: $("#similar-results"),
  closeDetail: $("#close-detail"),
  favouritesOverlay: $("#favourites-overlay"),
  favouritesGrid: $("#favourites-grid"),
  favouritesEmpty: $("#favourites-empty"),
  closeFavourites: $("#close-favourites")
};

function setView(view) {
  // Track previous view before changing
  if (view !== state.view) {
    state.previousView = state.view;
    writeStored(PREV_VIEW_KEY, state.previousView);
  }

  state.view = view;
  if (view === "quiz") {
    window.history.pushState({ view: "quiz", quizStep: state.quizStep, previousView: state.previousView }, "", `?quiz=${state.quizStep}`);
  }
  if (view === "search") {
    window.history.pushState({ view: "search", previousView: state.previousView }, "", "?search");
  }
  if (view === "results") {
    window.history.pushState({ view: "results", previousView: state.previousView }, "", "?results");
  }
  if (view === "welcome") {
    window.history.pushState({ view: "welcome", previousView: state.previousView }, "", "/");
  }
  if (!["results", "search"].includes(view)) {
    state.filterPanelOpen = false;
    state.openFilterGroups.clear();
    state.openPreferenceMenu = null;
  }
  writeStored(VIEW_KEY, view);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function fallbackStyles() {
  return FALLBACK_STYLES.map(galleryItemToStyle);
}

function syncStylesForCurrentRoute() {
  if (!state.galleryLoaded) return;

  state.styles = state.dbStyles.length ? state.dbStyles : fallbackStyles();
}

function setQuizStep(step, skipHistoryPush = false) {
  state.quizStep = Math.max(0, Math.min(QUIZ.length - 1, step));
  writeStored(STEP_KEY, state.quizStep);
  if (!skipHistoryPush && state.view === "quiz") {
    window.history.pushState({ view: "quiz", quizStep: state.quizStep, previousView: state.previousView }, "", `?quiz=${state.quizStep}`);
  }
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setAnswers(next) {
  state.answers = next;
  writeStored(ANSWERS_KEY, next);
}

function startOver() {
  setAnswers({});
  state.quizStep = 0;
  state.filterPanelOpen = false;
  state.openFilterGroups.clear();
  state.openPreferenceMenu = null;
  writeStored(STEP_KEY, state.quizStep);
  setView("welcome");
}

// ---------- Data loading ----------
async function loadGallery() {
  try {
    const data = await apiJson(API.gallery);
    if (Array.isArray(data.items)) {
      state.dbStyles = data.items.map(galleryItemToStyle);
      state.galleryLoaded = true;
      state.galleryLoadError = false;
      syncStylesForCurrentRoute();
      render();
      if (!els.favouritesOverlay.hidden) renderFavourites();
    }
  } catch {
    state.galleryLoaded = true;
    state.galleryLoadError = true;
    render();
    // Regular pages keep bundled fallback styles when the API is unavailable.
  }
}

async function loadFavourites() {
  try {
    const data = await apiJson(`${API.favorites}?sessionId=${encodeURIComponent(state.sessionId)}`);
    if (Array.isArray(data.items)) {
      const serverSet = new Set(data.items.map((item) => String(item.imageId)).filter(Boolean));
      for (const [imageId, op] of pendingFavouriteOps) {
        if (op === "add") serverSet.add(imageId);
        else serverSet.delete(imageId);
      }
      state.favourites = serverSet;
    }
  } catch {
    // The local memory fallback and D1 both support this, but do not block UI if it fails.
  }
  updateFavouriteCount();
  render();
}

// ---------- Quiz helpers ----------
function getQuestionById(id) {
  return DISCOVERY_FILTER_QUESTIONS.find((q) => q.id === id);
}

function getOptionLabel(questionId, value) {
  const question = getQuestionById(questionId);
  const option = question?.options.find((item) => item.value === value);
  return option?.label || value;
}

function selectedFor(question) {
  return Array.isArray(state.answers[question.id]) ? state.answers[question.id] : [];
}

function selectQuizOption(question, option) {
  const current = new Set(selectedFor(question));
  const realValues = question.options
    .filter((item) => !item.selectAll && !item.exclusive)
    .map((item) => item.value);

  let next;
  if (option.selectAll) {
    const allOn = realValues.every((value) => current.has(value)) && current.has(option.value);
    next = allOn ? [] : [...realValues, option.value];
  } else if (option.exclusive) {
    next = current.has(option.value) ? [] : [option.value];
  } else {
    current.delete("__all");
    question.options.filter((item) => item.exclusive).forEach((item) => current.delete(item.value));
    if (current.has(option.value)) current.delete(option.value);
    else current.add(option.value);
    next = [...current];
  }

  setAnswers({ ...state.answers, [question.id]: next });

  // The length options depend on the chosen gender, so changing the style answer
  // can leave previously picked length values pointing at options that no longer
  // exist. Remap them to the new gender's options.
  if (question.id === "style") {
    setAnswers({ ...state.answers, length: reconcileLengthAnswers() });
  }
}

// Reconciles stored length answers with the options available for the current
// survey gender: switching to "both" expands a plain length to both genders,
// switching to a single gender strips the gender prefix back to the base length.
function reconcileLengthAnswers() {
  const current = selectedFor(getQuestionById("length"));
  if (!current.length) return current;

  const validValues = new Set(buildLengthOptions().map((option) => option.value));
  const expandToBoth = selectedSurveyGender() === "both";
  const next = [];

  for (const value of current) {
    if (validValues.has(value)) {
      next.push(value);
    } else if (expandToBoth) {
      for (const variant of LENGTH_GENDER_VARIANTS) {
        const expanded = `${variant.prefix}:${value}`;
        if (validValues.has(expanded)) next.push(expanded);
      }
    } else {
      const base = value.includes(":") ? value.split(":")[1] : value;
      if (validValues.has(base)) next.push(base);
    }
  }

  return [...new Set(next)];
}

function toggleQuizOption(question, option) {
  selectQuizOption(question, option);
  render();
}

// Returns the survey gender picked in the style question:
//  - "masculine" / "feminine" when exactly one gender is chosen
//  - "both" when nothing, "everything", or multiple genders are chosen.
//    "both" is the mixed-gender sentinel that drives a male/female mix in
//    later questions (e.g. length), so "Show me everything" shows both.
function selectedSurveyGender() {
  const styleQuestion = getQuestionById("style");
  if (!styleQuestion) return null;
  const selected = selectedFor(styleQuestion);
  const everything = selected.includes("__all");
  const picked = selected.filter((value) => value !== "__all");
  if (everything || picked.length === 0) return "both";
  return picked.length === 1 ? picked[0] : "both";
}

function isQuizOptionSelected(question, option, selected) {
  return selected.includes(option.value);
}

function getRepresentativeImages() {
  const men = state.styles.find((style) => style.gender === "Men")?.imageUrl;
  const women = state.styles.find((style) => style.gender === "Women")?.imageUrl;
  const unisex = state.styles.find((style) => style.gender === "Unisex")?.imageUrl;
  const backup = state.styles.map((style) => style.imageUrl).filter(Boolean);
  return {
    masculine: men || backup[0],
    feminine: women || backup[1] || backup[0],
    androgynous: unisex || backup[2] || backup[0],
    collage: [men, women, unisex, backup[3], backup[4]].filter(Boolean)
  };
}

function getQuizOptionMedia(question, option) {
  const gender = selectedSurveyGender();
  let genderedImage = "";
  if (option.images) {
    if (option.gender) {
      // The option is already pinned to a gender (e.g. a "both" length variant).
      const key = option.gender === "Men" ? "masculine" : "feminine";
      genderedImage = option.images[key] || "";
    } else if (gender === "both") {
      // Alternate male/female across the option grid so the survey shows a mix.
      const index = question.options.indexOf(option);
      const order = index % 2 === 0 ? ["masculine", "feminine"] : ["feminine", "masculine"];
      genderedImage = option.images[order[0]] || option.images[order[1]] || "";
    } else if (gender) {
      genderedImage = option.images[gender] || "";
    }
  }
  const image = genderedImage || option.image;
  if (image) {
    return `<img src="${image}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }
  if (question.id === "style") {
    const reps = getRepresentativeImages();
    if (option.selectAll) {
      const images = reps.collage.length ? reps.collage : state.styles.slice(0, 4).map((style) => style.imageUrl).filter(Boolean);
      return `<div class="option-collage">${images.slice(0, 4).map((src) => `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join("")}</div>`;
    }
    const src = reps[option.value];
    if (src) return `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }
  if (option.icon) return option.icon;
  return iconCheck();
}

function summarizeAnswers() {
  const chips = [];
  for (const question of DISCOVERY_FILTER_QUESTIONS) {
    const selected = selectedFor(question);
    if (!selected.length) continue;
    if (question.id === "style" && selected.includes("__all")) {
      chips.push({ questionId: question.id, label: "Style", value: "Everything" });
      continue;
    }
    const values = selected.filter((value) => value !== "__all").map((value) => getOptionLabel(question.id, value));
    if (values.length) chips.push({ questionId: question.id, label: shortQuestionLabel(question.id), value: values.join(", ") });
  }
  return chips;
}

function selectedAnswerCount() {
  return DISCOVERY_FILTER_QUESTIONS.reduce((total, question) => total + selectedFor(question).filter((value) => value !== "__all").length, 0);
}

function shortQuestionLabel(id) {
  return {
    style: "Style",
    texture: "Texture",
    ethnicity: "Ethnicity",
    face: "Face",
    length: "Length",
    maintenance: "Maintenance",
    vibe: "Vibe"
  }[id] || id;
}

function answerOptions(questionId) {
  const question = getQuestionById(questionId);
  const selected = state.answers[questionId] || [];
  return selected.map((value) => question?.options.find((option) => option.value === value)).filter(Boolean);
}

function styleHaystack(style) {
  return [
    style.name,
    style.description,
    style.length,
    style.hairType,
    style.hairSubtype,
    style.gender,
    style.maintenanceLevel,
    style.faceShape,
    style.vibe,
    style.hairColour,
    style.haircutName,
    style.maintenance,
    ...(style.labels || []),
    ...(style.features || [])
  ].join(" ").toLowerCase();
}

function optionKeywordMatch(style, option) {
  const haystack = styleHaystack(style);
  return (option.keywords || []).some((keyword) => haystack.includes(String(keyword).toLowerCase()));
}

function optionVibeMatch(style, option) {
  return Boolean(option.vibe && style.vibe === option.vibe);
}

function optionUpkeepMatch(style, option) {
  return Boolean(option.upkeep && style.maintenanceLevel === option.upkeep);
}

function optionLengthMatch(style, option) {
  if (!option.length) return true;
  if (style.length !== option.length) return false;
  // Gendered length variants (from a "both" survey) only match their own
  // gender; Unisex styles fit either a male or female length request.
  if (option.gender && style.gender !== option.gender && style.gender !== "Unisex") return false;
  return true;
}

function scoreStyle(style) {
  let score = 0;
  const haystack = styleHaystack(style);

  for (const option of answerOptions("style")) {
    if (option.selectAll) score += 1;
    else if (style.gender === option.gender) score += 8;
  }

  for (const option of answerOptions("texture")) {
    if (option.hairType && style.hairType === option.hairType) score += 5;
    if (["fine", "thick"].includes(option.value) && haystack.includes(option.value)) score += 2;
  }

  for (const option of answerOptions("length")) {
    if (option.length && optionLengthMatch(style, option)) score += 5;
  }

  for (const option of answerOptions("vibe")) {
    if (optionVibeMatch(style, option)) score += 5;
    for (const keyword of option.keywords || []) {
      if (haystack.includes(keyword)) score += 2;
    }
  }

  for (const option of answerOptions("ethnicity")) {
    if (option.value !== "none" && optionKeywordMatch(style, option)) score += 2;
  }

  for (const option of answerOptions("face")) {
    if (option.faceShape && style.faceShape === option.faceShape) score += 4;
  }

  return score;
}

function answerFilteredStyles() {
  return state.styles.filter(stylePassesAnswerFilters);
}

function scoredStyles(styles = state.styles) {
  const styleAnswers = answerOptions("style").filter((option) => !option.selectAll);
  const hardFiltered = styleAnswers.length
    ? styles.filter((style) => styleAnswers.some((option) => style.gender === option.gender))
    : styles;
  const source = hardFiltered.length ? hardFiltered : styles;
  return [...source].sort((a, b) => scoreStyle(b) - scoreStyle(a));
}

function optionGroupPasses(style, questionId, matcher) {
  const options = answerOptions(questionId).filter((option) => !option.exclusive && !option.selectAll);
  if (!options.length) return true;
  return options.some((option) => matcher(option));
}

function stylePassesAnswerFilters(style) {
  const styleAnswers = answerOptions("style").filter((option) => !option.selectAll);
  if (styleAnswers.length && !styleAnswers.some((option) => style.gender === option.gender)) {
    return false;
  }

  if (!optionGroupPasses(style, "texture", (option) => {
    if (option.hairType) return style.hairType === option.hairType;
    if (["fine", "thick"].includes(option.value)) return styleHaystack(style).includes(option.value);
    return true;
  })) {
    return false;
  }

  if (!optionGroupPasses(style, "length", (option) => optionLengthMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "face", (option) => option.faceShape ? style.faceShape === option.faceShape : true)) {
    return false;
  }

  if (!optionGroupPasses(style, "ethnicity", (option) => optionKeywordMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "vibe", (option) => optionVibeMatch(style, option) || optionKeywordMatch(style, option))) {
    return false;
  }

  return true;
}

// ---------- Rendering ----------
function render() {
  syncStylesForCurrentRoute();
  document.body.dataset.view = state.view;
  if (els.topbarSearchInput && els.topbarSearchInput.value !== state.searchQuery) {
    els.topbarSearchInput.value = state.searchQuery;
  }
  updateFavouriteCount();

  if (state.view === "quiz") renderQuiz();
  else if (state.view === "search") renderSearch();
  else if (state.view === "results") renderResultsPage();
  else renderWelcome();
}

function renderWelcome() {
  els.app.innerHTML = `
    <section class="welcome-screen">
      <div class="welcome-logo-row">
        <div class="welcome-logo">HairMatch</div>
      </div>
      <p class="eyebrow">Let's begin</p>
      <h1><span>Find a haircut that's </span><em>actually you.</em></h1>
      <p class="welcome-copy">No endless scrolling. Tell us a little about yourself, or dive straight in and save what catches your eye.</p>
      <div class="welcome-options">
        <button class="choice-card" id="find-style-btn" type="button">
          <span class="choice-icon">${iconCheck()}</span>
          <span class="choice-title">Find me a style</span>
          <span class="choice-copy">Answer a few quick questions. We'll narrow thousands of looks down to the ones that suit you.</span>
          <span class="choice-action">${QUIZ.length} quick questions ${iconArrow()}</span>
        </button>
        <button class="choice-card" id="have-mind-btn" type="button">
          <span class="choice-icon">${iconSearch()}</span>
          <span class="choice-title">I have something in mind</span>
          <span class="choice-copy">Jump into the gallery and search freely. Like the photos that speak to you to build your profile.</span>
          <span class="choice-action">Browse the gallery ${iconArrow()}</span>
        </button>
      </div>
    </section>
  `;
  $("#find-style-btn").addEventListener("click", () => {
    setAnswers({});
    state.quizStep = 0;
    writeStored(STEP_KEY, state.quizStep);
    setView("quiz");
  });
  $("#have-mind-btn").addEventListener("click", () => setView("search"));
}

function renderQuiz() {
  const question = QUIZ[state.quizStep] || QUIZ[0];
  const selected = selectedFor(question);
  const progress = Math.round(((state.quizStep + 1) / QUIZ.length) * 100);
  const isLast = state.quizStep === QUIZ.length - 1;
  const isScale = question.layout === "scale";
  const isSlider = question.layout === "slider";

  els.app.innerHTML = `
    <section class="quiz-screen">
      <div class="quiz-top">
        <div class="progress-wrap" aria-label="Question ${state.quizStep + 1} of ${QUIZ.length}">
          <div class="progress-meta">
            <span>Question <b>${state.quizStep + 1}</b> of ${QUIZ.length}</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-track"><div style="width: ${progress}%"></div></div>
        </div>
        <div class="quiz-top-actions">
          <button class="text-btn" id="quiz-start-over-btn" type="button">Start over</button>
        </div>
      </div>

      <div class="quiz-question">
        <p class="eyebrow">${String(state.quizStep + 1).padStart(2, "0")} / ${String(QUIZ.length).padStart(2, "0")}</p>
        <h1>${question.title}</h1>
        ${question.sub ? `<p>${question.sub}</p>` : ""}
      </div>

      ${isSlider ? renderSliderQuestion(question, selected) : isScale ? renderScaleQuestion(question, selected) : `
        <div class="option-grid ${question.layout === "text" ? "is-text" : ""}">
          ${question.options.map((option) => renderOption(question, option, isQuizOptionSelected(question, option, selected))).join("")}
        </div>
      `}

      ${question.id === "face" && selected.includes("unknown") ? renderFaceHelper() : ""}

      <div class="quiz-footer">
        <span>${selected.length ? `<b>${selected.filter((value) => value !== "__all").length || selected.length}</b> selected` : (isScale || isSlider) ? "Select your answer" : "Select any that apply"}</span>
        <div class="quiz-footer-buttons">
          ${state.quizStep > 0 ? `<button class="secondary-btn" id="quiz-back-btn" type="button">Back</button>` : ""}
          <button class="primary-btn" id="quiz-next-btn" type="button">${isLast ? "Show me results" : "Continue"} ${iconArrow()}</button>
        </div>
      </div>
    </section>
  `;

  $("#quiz-start-over-btn").addEventListener("click", startOver);
  $("#quiz-next-btn").addEventListener("click", () => {
    if (isLast) setView("results");
    else setQuizStep(state.quizStep + 1);
  });
  const backBtn = $("#quiz-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => setQuizStep(state.quizStep - 1));
  }

  if (isSlider) {
    wireSliderQuestion(question);
  } else if (isScale) {
    wireScaleQuestion(question);
  } else {
    document.querySelectorAll("[data-option-value]").forEach((button) => {
      button.addEventListener("click", () => {
        const option = question.options.find((item) => item.value === button.dataset.optionValue);
        if (option) toggleQuizOption(question, option);
      });
    });
  }
}

function renderOption(question, option, on) {
  const media = question.layout === "text"
    ? ""
    : `<span class="option-media ${option.icon && !option.image ? "is-icon" : ""}">${getQuizOptionMedia(question, option)}</span>`;
  return `
    <button class="option-card ${question.layout === "text" ? "is-text" : ""} ${on ? "is-on" : ""}" type="button" data-option-value="${option.value}" aria-pressed="${on}">
      ${media}
      <span class="option-body">
        <span class="option-label">${option.label}</span>
        ${option.desc ? `<span class="option-desc">${option.desc}</span>` : ""}
      </span>
      <span class="option-check">${on ? iconCheck() : ""}</span>
    </button>
  `;
}

function renderFaceHelper() {
  return `
    <section class="helper-panel">
      <h2>Quick face shape guide</h2>
      <p>Pull your hair back, face a mirror, and compare the widest part of your face with your jaw and overall length.</p>
      <ul>
        <li><b>Oval:</b> longer than wide, gently rounded jaw.</li>
        <li><b>Round:</b> similar width and length with softer angles.</li>
        <li><b>Square:</b> forehead and jaw are similar widths with a stronger jawline.</li>
        <li><b>Heart:</b> wider forehead tapering toward the chin.</li>
        <li><b>Oblong:</b> noticeably longer than it is wide.</li>
      </ul>
    </section>
  `;
}

function renderScaleQuestion(question, selected) {
  const regularOptions = question.options.filter((o) => !o.exclusive);
  const exclusiveOption = question.options.find((o) => o.exclusive);
  const isExclusiveSelected = exclusiveOption && selected.includes(exclusiveOption.value);

  return `
    <div class="scale-question-wrap">
      <div class="scale-options">
        ${regularOptions.map((option) => {
          const isOn = selected.includes(option.value);
          return `
            <button
              class="scale-btn ${isOn ? "is-on" : ""}"
              type="button"
              data-scale-value="${escapeAttr(option.value)}"
              aria-pressed="${isOn}"
            >
              <span class="scale-btn-label">${escapeHtml(option.label)}</span>
              <span class="scale-btn-dot" aria-hidden="true"></span>
            </button>
          `;
        }).join("")}
      </div>
      ${exclusiveOption ? `
        <div class="scale-skip-row">
          <button
            class="scale-skip-btn ${isExclusiveSelected ? "is-selected" : ""}"
            type="button"
            data-scale-value="${escapeAttr(exclusiveOption.value)}"
            aria-pressed="${isExclusiveSelected}"
          >
            ${escapeHtml(exclusiveOption.label)}
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function wireScaleQuestion(question) {
  document.querySelectorAll("[data-scale-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = question.options.find((item) => item.value === button.dataset.scaleValue);
      if (!option) return;
      const current = selectedFor(question);
      const isOn = current.includes(option.value);
      if (option.exclusive) {
        setAnswers({ ...state.answers, [question.id]: isOn ? [] : [option.value] });
      } else {
        setAnswers({ ...state.answers, [question.id]: isOn ? [] : [option.value] });
      }
      render();
    });
  });
}

function renderSliderQuestion(question, selected) {
  const regularOptions = question.options.filter((o) => !o.exclusive);
  const exclusiveOption = question.options.find((o) => o.exclusive);
  const isExclusiveSelected = exclusiveOption && selected.includes(exclusiveOption.value);
  const selectedIndex = (!isExclusiveSelected && selected.length)
    ? regularOptions.findIndex((o) => o.value === selected[0])
    : -1;
  const hasSelection = selectedIndex !== -1;
  const sliderValue = hasSelection ? selectedIndex : Math.floor((regularOptions.length - 1) / 2);
  const displayLabel = hasSelection ? regularOptions[selectedIndex].label : "Slide to answer";
  const displayDesc = hasSelection ? regularOptions[selectedIndex].desc : "";

  return `
    <div class="slider-question-wrap">
      <div class="slider-value-display ${!hasSelection ? "is-placeholder" : ""}">
        ${escapeHtml(displayLabel)}
      </div>
      <div class="slider-track-wrap">
        <span class="slider-end-label">${escapeHtml(regularOptions[0].label)}</span>
        <input
          type="range"
          class="quiz-slider"
          id="quiz-slider-input"
          min="0"
          max="${regularOptions.length - 1}"
          step="1"
          value="${sliderValue}"
          ${isExclusiveSelected ? "disabled" : ""}
        >
        <span class="slider-end-label">${escapeHtml(regularOptions[regularOptions.length - 1].label)}</span>
      </div>
      ${displayDesc ? `<p class="slider-description" style="margin-top: 16px; font-size: 18px; color: #666; text-align: center;">${escapeHtml(displayDesc)}</p>` : ""}
      ${exclusiveOption ? `
        <div class="scale-skip-row">
          <button
            class="scale-skip-btn ${isExclusiveSelected ? "is-selected" : ""}"
            type="button"
            data-slider-skip="${escapeAttr(exclusiveOption.value)}"
            aria-pressed="${isExclusiveSelected}"
          >
            ${escapeHtml(exclusiveOption.label)}
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function wireSliderQuestion(question) {
  const regularOptions = question.options.filter((o) => !o.exclusive);
  const slider = document.getElementById("quiz-slider-input");
  const display = document.querySelector(".slider-value-display");
  const descDiv = document.querySelector(".slider-description");

  if (slider) {
    slider.addEventListener("input", () => {
      const option = regularOptions[parseInt(slider.value, 10)];
      if (option && display) {
        display.textContent = option.label;
        display.classList.remove("is-placeholder");
        if (descDiv) descDiv.textContent = option.desc || "";
      }
    });
    slider.addEventListener("change", () => {
      const option = regularOptions[parseInt(slider.value, 10)];
      if (option) {
        setAnswers({ ...state.answers, [question.id]: [option.value] });
        render();
      }
    });
  }

  const skipBtn = document.querySelector("[data-slider-skip]");
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      const option = question.options.find((o) => o.exclusive);
      if (!option) return;
      const isOn = selectedFor(question).includes(option.value);
      setAnswers({ ...state.answers, [question.id]: isOn ? [] : [option.value] });
      render();
    });
  }
}

function renderSearch() {
  const matches = filteredSearchStyles();
  const chips = summarizeAnswers();
  const selectedCount = selectedAnswerCount();
  els.app.innerHTML = `
    <section class="search-screen">
      <div class="screen-heading discovery-heading">
        <div>
          <p class="eyebrow">Search</p>
          <h1>Hair Styles</h1>
          <p>Browse freely and like photos. Each save gives your profile a clearer direction.</p>
        </div>
        ${renderDiscoveryActions(selectedCount)}
      </div>

      <div class="search-tools">
        <label class="upload-btn" title="Upload a photo to inform search">
          <span aria-hidden="true">${iconCheck()}</span>
          <span>Upload photo</span>
          <input type="file" id="upload-input" accept="image/*" hidden>
        </label>
      </div>

      ${state.uploadedPhotoName ? `<div class="upload-preview"><span>Photo saved:</span><b>${escapeHtml(state.uploadedPhotoName)}</b><button id="upload-clear" type="button" aria-label="Clear uploaded photo">&times;</button></div>` : ""}

      ${chips.length ? renderSummaryChips(chips) : ""}

      ${state.filterPanelOpen ? renderAnswerFilterDrawer(selectedCount) : ""}

      <div class="profile-strip">
        <span><b>${state.favourites.size}</b> saved styles</span>
        <span>Saved photos become your working profile.</span>
      </div>

      <section class="results-grid" id="search-results-grid">
        ${matches.length ? matches.map((style) => buildStyleCardHtml(style)).join("") : `<p class="empty-state">No styles match that search. Try a shorter keyword.</p>`}
      </section>
    </section>
  `;

  $("#upload-input").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    handleUpload(file);
  });
  const clear = $("#upload-clear");
  if (clear) {
    clear.addEventListener("click", () => {
      state.uploadedPhotoName = null;
      renderSearch();
    });
  }
  wireDiscoveryControls();
  wireCards();
}

function renderSearchGrid() {
  const grid = $("#search-results-grid");
  if (!grid) return;
  const matches = filteredSearchStyles();
  grid.innerHTML = matches.length
    ? matches.map((style) => buildStyleCardHtml(style)).join("")
    : `<p class="empty-state">No styles match that search. Try a shorter keyword.</p>`;
  wireCards(grid);
}

function renderResultsPage() {
  const filtered = selectedAnswerCount() ? answerFilteredStyles() : state.styles;
  const results = scoredStyles(filtered);
  const chips = summarizeAnswers();
  const selectedCount = selectedAnswerCount();

  els.app.innerHTML = `
    <section class="results-screen">
      <div class="results-summary">
        <div>
          <p class="eyebrow">Curated for you</p>
          <h1>${results.length} styles to try</h1>
          <p>These are ranked from the answers you gave. Like anything that feels close.</p>
        </div>
        ${renderDiscoveryActions(selectedCount)}
      </div>

      ${chips.length ? renderSummaryChips(chips) : ""}

      ${state.filterPanelOpen ? renderAnswerFilterDrawer(selectedCount) : ""}

      <section class="results-grid" id="results-grid">
        ${results.length ? results.map((style) => buildStyleCardHtml(style)).join("") : `<p class="empty-state">No exact matches yet. Search all styles instead.</p>`}
      </section>
    </section>
  `;

  wireDiscoveryControls();
  wireCards();
}

function renderDiscoveryActions(selectedCount) {
  return `
    <div class="results-actions">
      <button class="secondary-btn filter-toggle-btn" id="filters-btn" type="button" aria-expanded="${state.filterPanelOpen}">
        Preferences
        ${selectedCount ? `<span class="filter-count">${selectedCount}</span>` : ""}
      </button>
    </div>
  `;
}

function renderSummaryChips(chips) {
  return `<div class="summary-chips">${chips.map(renderPreferenceChip).join("")}</div>`;
}

function renderPreferenceChip(chip) {
  const question = getQuestionById(chip.questionId);
  const open = state.openPreferenceMenu === chip.questionId;
  return `
    <div class="summary-chip-wrap">
      <button
        class="summary-chip"
        type="button"
        data-preference-chip="${escapeAttr(chip.questionId)}"
        aria-expanded="${open}"
        aria-haspopup="menu"
      >
        <span><b>${escapeHtml(chip.label)}:</b> ${escapeHtml(chip.value)}</span>
        <span class="summary-chip-caret" aria-hidden="true"></span>
      </button>
      ${open && question ? renderPreferenceMenu(question) : ""}
    </div>
  `;
}

function renderPreferenceMenu(question) {
  const selected = selectedFor(question);
  return `
    <div class="preference-menu" role="menu" aria-label="${escapeAttr(shortQuestionLabel(question.id))} preferences">
      <p>${escapeHtml(question.title)}</p>
      ${question.options.map((option) => renderPreferenceOption(question, option, isQuizOptionSelected(question, option, selected))).join("")}
    </div>
  `;
}

function renderPreferenceOption(question, option, isSelected) {
  return `
    <button
      class="preference-option ${isSelected ? "is-on" : ""}"
      type="button"
      role="menuitemcheckbox"
      aria-checked="${isSelected}"
      data-preference-question="${escapeAttr(question.id)}"
      data-preference-value="${escapeAttr(option.value)}"
    >
      <span>${escapeHtml(option.label)}</span>
      ${isSelected ? iconCheck() : ""}
    </button>
  `;
}

function wireDiscoveryControls() {
  $("#filters-btn").addEventListener("click", () => {
    state.filterPanelOpen = !state.filterPanelOpen;
    state.openPreferenceMenu = null;
    if (state.filterPanelOpen) state.openFilterGroups.clear();
    renderCurrentDiscoveryView();
  });
  const closeFilters = $("#close-filters-btn");
  if (closeFilters) {
    closeFilters.addEventListener("click", () => {
      state.filterPanelOpen = false;
      state.openFilterGroups.clear();
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView();
    });
  }
  const clearFilters = $("#clear-filters-btn");
  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      setAnswers({});
      state.openFilterGroups.clear();
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView({ preserveFilterScroll: true });
    });
  }
  const drawerStartOver = $("#drawer-start-over-btn");
  if (drawerStartOver) drawerStartOver.addEventListener("click", startOver);
  document.querySelectorAll("[data-filter-group]").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (details.open) state.openFilterGroups.add(details.dataset.filterGroup);
      else state.openFilterGroups.delete(details.dataset.filterGroup);
    });
  });
  document.querySelectorAll("[data-filter-question][data-filter-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const question = getQuestionById(button.dataset.filterQuestion);
      const option = question?.options.find((item) => item.value === button.dataset.filterValue);
      if (!question || !option) return;
      selectQuizOption(question, option);
      renderCurrentDiscoveryView({ preserveFilterScroll: true });
    });
  });
  document.querySelectorAll("[data-preference-chip]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const nextMenu = button.dataset.preferenceChip;
      state.openPreferenceMenu = state.openPreferenceMenu === nextMenu ? null : nextMenu;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  });
  document.querySelectorAll("[data-preference-question][data-preference-value]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const question = getQuestionById(button.dataset.preferenceQuestion);
      const option = question?.options.find((item) => item.value === button.dataset.preferenceValue);
      if (!question || !option) return;
      selectQuizOption(question, option);
      state.openPreferenceMenu = question.id;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  });
  document.querySelectorAll(".summary-chip-wrap").forEach((wrap) => {
    wrap.addEventListener("click", (event) => event.stopPropagation());
  });
  const discoveryScreen = $(".search-screen, .results-screen");
  if (discoveryScreen) {
    discoveryScreen.addEventListener("click", () => {
      if (!state.openPreferenceMenu) return;
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  }
}

function renderCurrentDiscoveryView({ preserveFilterScroll = false } = {}) {
  const panel = $(".answer-filter-panel");
  const scrollTop = preserveFilterScroll && panel ? panel.scrollTop : null;
  if (state.view === "search") renderSearch();
  else renderResultsPage();
  if (scrollTop !== null) {
    const nextPanel = $(".answer-filter-panel");
    if (nextPanel) nextPanel.scrollTop = scrollTop;
  }
}

function renderAnswerFilterDrawer(selectedCount) {
  return `
    <aside class="answer-filter-panel" aria-label="Modify answers">
      <div class="answer-filter-head">
        <div>
          <p class="eyebrow">Preferences</p>
          <h2>Modify your answers</h2>
        </div>
        <button class="close-filter-btn" id="close-filters-btn" type="button" aria-label="Close preferences">&times;</button>
      </div>
      <p class="answer-filter-copy">Adjust the profile from one place. Results update as soon as you change an answer.</p>
      <div class="answer-filter-actions">
        <button class="secondary-btn" id="clear-filters-btn" type="button">Clear answers</button>
        <button class="secondary-btn" id="drawer-start-over-btn" type="button">Start over</button>
      </div>
      <div class="answer-filter-count">${selectedCount || 0} selected</div>
      <div class="answer-filter-groups">
        ${DISCOVERY_FILTER_QUESTIONS.map(renderFilterGroup).join("")}
      </div>
    </aside>
  `;
}

function renderFilterGroup(question) {
  const selected = selectedFor(question);
  return `
    <details class="answer-filter-group" data-filter-group="${question.id}" ${state.openFilterGroups.has(question.id) ? "open" : ""}>
      <summary>
        <span>
          <span class="answer-filter-group-title">${escapeHtml(shortQuestionLabel(question.id))}</span>
          <span class="answer-filter-group-question">${escapeHtml(question.title)}</span>
        </span>
        <span class="answer-filter-group-icon" aria-hidden="true"></span>
      </summary>
      <div class="answer-filter-options">
        ${question.options.map((option) => renderFilterOption(question, option, selected.includes(option.value))).join("")}
      </div>
    </details>
  `;
}

function renderFilterOption(question, option, isSelected) {
  return `
    <button
      class="filter-option ${isSelected ? "is-on" : ""}"
      type="button"
      data-filter-question="${question.id}"
      data-filter-value="${option.value}"
      aria-pressed="${isSelected}"
    >
      <span class="filter-option-box">${isSelected ? iconCheck() : ""}</span>
      <span>
        <span class="filter-option-label">${escapeHtml(option.label)}</span>
        ${option.desc ? `<span class="filter-option-desc">${escapeHtml(option.desc)}</span>` : ""}
      </span>
    </button>
  `;
}

function filteredSearchStyles() {
  const q = state.searchQuery.trim().toLowerCase();
  const tokens = q.split(/[\s,]+/).filter(Boolean);
  const queryMatches = state.styles.filter((style) => {
    const haystack = [
      style.name,
      style.description,
      style.gender,
      style.length,
      style.hairType,
      style.maintenanceLevel,
      ...(style.labels || []),
      ...(style.features || [])
    ].join(" ").toLowerCase();
    if (!q) return true;
    return tokens.every((token) => haystack.includes(token));
  });

  if (!selectedAnswerCount()) return queryMatches;

  const answerMatches = queryMatches.filter(stylePassesAnswerFilters);
  return scoredStyles(answerMatches);
}

function buildStyleCardHtml(style, compact = false) {
  const liked = state.favourites.has(style.id);
  return `
    <article class="style-card ${compact ? "is-compact" : ""}" data-style-id="${style.id}">
      <button class="style-card-image" type="button" data-open-style="${style.id}" aria-label="Open ${escapeAttr(style.name)}">
        ${style.imageUrl ? `<img src="${style.imageUrl}" alt="${escapeAttr(style.name)}" loading="lazy" referrerpolicy="no-referrer">` : `<span>${escapeHtml(style.name)}</span>`}
      </button>
      ${compact ? "" : `
        <div class="style-card-footer">
          <div>
            <h2>${escapeHtml(style.name)}</h2>
            <p>${style.length} length - ${style.hairType}</p>
          </div>
          <button class="heart-btn ${liked ? "is-liked" : ""}" type="button" data-like-style="${style.id}" aria-label="${liked ? "Remove from saved" : "Save style"}">${liked ? "&hearts;" : "&#9825;"}</button>
        </div>
      `}
    </article>
  `;
}

function wireCards(scope = document) {
  scope.querySelectorAll("[data-open-style]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.openStyle));
  });
  scope.querySelectorAll("[data-like-style]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavourite(button.dataset.likeStyle);
    });
  });
}

// ---------- Favourites ----------
async function toggleFavourite(id) {
  const imageId = String(id);
  const shouldSave = !state.favourites.has(imageId);

  if (shouldSave) state.favourites.add(imageId);
  else state.favourites.delete(imageId);
  pendingFavouriteOps.set(imageId, shouldSave ? "add" : "delete");

  updateFavouriteCount();
  render();
  if (!els.favouritesOverlay.hidden) renderFavourites();
  if (currentDetailId === imageId) updateDetailLike(imageId);

  try {
    await apiJson(API.favorites, {
      method: shouldSave ? "POST" : "DELETE",
      body: JSON.stringify({ sessionId: state.sessionId, imageId })
    });
    pendingFavouriteOps.delete(imageId);
  } catch {
    pendingFavouriteOps.delete(imageId);
    if (shouldSave) state.favourites.delete(imageId);
    else state.favourites.add(imageId);
    updateFavouriteCount();
    render();
    if (!els.favouritesOverlay.hidden) renderFavourites();
    if (currentDetailId === imageId) updateDetailLike(imageId);
  }
}

function updateFavouriteCount() {
  els.favCount.textContent = state.favourites.size;
}

function renderFavourites() {
  const items = state.styles.filter((style) => state.favourites.has(style.id));
  els.favouritesGrid.innerHTML = items.map((style) => buildStyleCardHtml(style)).join("");
  els.favouritesEmpty.hidden = items.length > 0;
  wireCards(els.favouritesGrid);
}

// ---------- Detail overlay ----------
function appendImage(frame, style) {
  frame.innerHTML = style.imageUrl
    ? `<img src="${style.imageUrl}" alt="${escapeAttr(style.name)}" loading="lazy" referrerpolicy="no-referrer">`
    : `<span>${escapeHtml(style.name)}</span>`;
}

function openDetail(id) {
  const style = state.styles.find((item) => item.id === String(id));
  if (!style) return;
  currentDetailId = style.id;

  appendImage(els.detailImage, style);
  els.detailMeta.textContent = `${style.gender} - ${style.length} length`;
  els.detailName.textContent = style.name;
  els.detailMaintenance.textContent = `This is a ${style.maintenanceLevel.toLowerCase()} maintenance hairstyle. ${style.maintenance}`;

  const similar = state.styles
    .filter((item) => item.id !== style.id && (item.length === style.length || item.hairType === style.hairType || item.gender === style.gender))
    .slice(0, 8);
  els.similarResults.innerHTML = similar.map((item) => buildStyleCardHtml(item, true)).join("");
  wireCards(els.similarResults);

  updateDetailLike(style.id);
  els.detailOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  els.detailOverlay.hidden = true;
  currentDetailId = null;
  if (els.favouritesOverlay.hidden) document.body.style.overflow = "";
}

function updateDetailLike(id) {
  const liked = state.favourites.has(id);
  els.detailLike.classList.toggle("is-saved", liked);
  els.detailLike.textContent = liked ? "Saved" : "Save style";
}


// ---------- Upload handler ----------
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error));
    reader.readAsDataURL(file);
  });
}

async function imageFileToDataUrl(file) {
  if (!file.type.startsWith("image/")) throw new Error("Please upload an image file.");

  try {
    const bitmap = await createImageBitmap(file);
    const maxDim = 1200;
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    return canvas.toDataURL("image/webp", 0.84);
  } catch {
    return fileToDataUrl(file);
  }
}

function selectedFeatures() {
  const features = [];
  for (const question of DISCOVERY_FILTER_QUESTIONS) {
    for (const value of selectedFor(question)) {
      if (value !== "__all") features.push(value);
    }
  }
  return features;
}

async function handleUpload(file) {
  if (!file) return;
  state.uploadedPhotoName = file.name;
  renderSearch();

  try {
    const imageData = await imageFileToDataUrl(file);
    await apiJson(API.userPhotos, {
      method: "POST",
      body: JSON.stringify({
        sessionId: state.sessionId,
        label: file.name,
        imageData,
        description: "Uploaded from the hairstyle search page.",
        features: selectedFeatures()
      })
    });
  } catch {
    // Keep the selected filename visible even if upload persistence fails.
  }
}

// ---------- Utilities ----------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value);
}

// ---------- Wire up ----------
function init() {
  els.homeBtn.addEventListener("click", () => setView("welcome"));
  els.topbarSearchInput.addEventListener("focus", () => {
    if (state.view !== "search") setView("search");
  });
  els.topbarSearchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value;
    if (state.view !== "search") {
      setView("search");
      return;
    }
    renderSearchGrid();
  });
  els.favouritesBtn.addEventListener("click", () => {
    renderFavourites();
    els.favouritesOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  });

  els.closeDetail.addEventListener("click", closeDetail);
  els.detailOverlay.addEventListener("click", (event) => {
    if (event.target === els.detailOverlay) closeDetail();
  });
  els.detailLike.addEventListener("click", () => {
    if (currentDetailId) toggleFavourite(currentDetailId);
  });

  els.closeFavourites.addEventListener("click", () => {
    els.favouritesOverlay.hidden = true;
    if (els.detailOverlay.hidden) document.body.style.overflow = "";
  });
  els.favouritesOverlay.addEventListener("click", (event) => {
    if (event.target === els.favouritesOverlay) {
      els.favouritesOverlay.hidden = true;
      if (els.detailOverlay.hidden) document.body.style.overflow = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!els.detailOverlay.hidden) closeDetail();
    else if (!els.favouritesOverlay.hidden) {
      els.favouritesOverlay.hidden = true;
      document.body.style.overflow = "";
    }
  });

  window.addEventListener("popstate", (event) => {
    // Handle navigation back through history
    if (event.state?.view === "quiz") {
      state.view = "quiz";
      state.quizStep = event.state.quizStep ?? 0;
      state.previousView = event.state.previousView ?? "welcome";
      writeStored(STEP_KEY, state.quizStep);
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (event.state?.view === "search") {
      state.view = "search";
      state.previousView = event.state.previousView ?? "welcome";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    } else if (event.state?.view === "results") {
      state.view = "results";
      state.previousView = event.state.previousView ?? "welcome";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    } else if (event.state?.view === "welcome") {
      state.view = "welcome";
      state.previousView = event.state.previousView ?? "welcome";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    } else {
      // Fallback for navigation to root or unknown state
      state.view = "welcome";
      state.previousView = "welcome";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    }
  });

  // Initialize from URL parameters if landing from external link
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("quiz")) {
    const step = Math.max(0, Math.min(QUIZ.length - 1, parseInt(urlParams.get("quiz"), 10) || 0));
    state.view = "quiz";
    state.quizStep = step;
    writeStored(VIEW_KEY, "quiz");
    writeStored(STEP_KEY, step);
  } else if (urlParams.has("search")) {
    state.view = "search";
    writeStored(VIEW_KEY, "search");
  } else if (urlParams.has("results")) {
    state.view = "results";
    writeStored(VIEW_KEY, "results");
  } else {
    state.view = "welcome";
    writeStored(VIEW_KEY, "welcome");
  }

  render();
  loadGallery();
  loadFavourites();
}

init();
