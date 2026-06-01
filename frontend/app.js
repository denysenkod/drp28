// ---------- API + persistent session ----------
const API = {
  gallery: "/api/gallery",
  favorites: "/api/favorites",
  userPhotos: "/api/user-photos",
  galleryLabels: (id) => `/api/gallery/${encodeURIComponent(id)}/labels`,
  galleryAttributes: (id) => `/api/gallery/${encodeURIComponent(id)}/attributes`
};

const SESSION_KEY = "drp28.frontend.sessionId";
const VIEW_KEY = "drp28.frontend.view";
const ANSWERS_KEY = "drp28.frontend.answers";
const STEP_KEY = "drp28.frontend.quizStep";

const ADMIN_ATTRIBUTE_OPTIONS = {
  gender: ["Men", "Women", "Unisex"],
  length: ["Short", "Medium", "Long"],
  hairType: ["Straight Hair", "Wavy Hair", "Curly Hair"],
  maintenanceLevel: ["Low", "Medium", "Higher"]
};

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

const QUIZ = [
  {
    id: "style",
    title: "What style are you looking for?",
    sub: "Pick any that feel right. Show me everything selects all three style directions.",
    layout: "image",
    options: [
      { value: "masculine", label: "Masculine styles", gender: "Men", image: "/Images/MasculineStyles.webp" },
      { value: "feminine", label: "Feminine styles", gender: "Women", image: "/Images/FeminineStyles.jpg" },
      { value: "androgynous", label: "Androgynous / gender-neutral styles", gender: "Unisex", image: "/Images/androgynous.avif" },
      { value: "__all", label: "Show me everything", selectAll: true }
    ]
  },
  {
    id: "texture",
    title: "What is your natural hair texture?",
    layout: "icon",
    options: [
      { value: "straight", label: "Straight", icon: textureIcon("straight"), hairType: "Straight Hair", image: "/Images/StraightHair.jpg" },
      { value: "wavy", label: "Wavy", icon: textureIcon("wavy"), hairType: "Wavy Hair", image: "/Images/WavyHair.jpg" },
      { value: "curly", label: "Curly", icon: textureIcon("curly"), hairType: "Curly Hair", image: "/Images/Curly.jpg" },
      { value: "coily", label: "Coily / kinky", icon: textureIcon("coily"), hairType: "Curly Hair", image: "/Images/CoilyHair.jpg" },
      { value: "fine", label: "Fine / thin", icon: textureIcon("fine"), image: "/Images/ThinHair.jpg" },
      { value: "thick", label: "Thick / dense", icon: textureIcon("thick"), image: "/Images/ThickDenseHair.webp" },
      { value: "unsure", label: "Not sure", icon: textureIcon("unsure"), exclusive: true }
    ]
  },
  {
    id: "ethnicity",
    title: "Would you like photos featuring people of a specific ethnicity for inspiration?",
    sub: "This only affects reference inspiration. You can skip it.",
    layout: "image",
    options: [
      { value: "black", label: "Black / African descent", image: "/Images/BlackAfrican.webp" },
      { value: "asian", label: "Asian / East Asian", image: "/Images/AsianEastAsian.webp" },
      { value: "south-asian", label: "South Asian", image: "/Images/SouthAsian.jpg" },
      { value: "latino", label: "Latino / Hispanic", image: "/Images/LatinoHispanic.webp" },
      { value: "middle-eastern", label: "Middle Eastern", image: "/Images/MiddleEastern.jpg" },
      { value: "white", label: "White / Caucasian", image: "/Images/WhiteCaucasian.jpg" },
      { value: "mixed", label: "Mixed / Multiracial" },
      { value: "none", label: "No preference", exclusive: true }
    ]
  },
  {
    id: "face",
    title: "What is your face shape?",
    sub: "Not sure? Choose the helper option and we will show a quick guide.",
    layout: "icon",
    options: [
      { value: "oval", label: "Oval", icon: faceIcon("oval"), image: "/Images/Oval.jpg" },
      { value: "round", label: "Round", icon: faceIcon("round"), image: "/Images/RoundFace.jpg" },
      { value: "square", label: "Square", icon: faceIcon("square"), image: "/Images/Square.png" },
      { value: "heart", label: "Heart / inverted triangle", icon: faceIcon("heart"), image: "/Images/Heart.jpg" },
      { value: "diamond", label: "Diamond", icon: faceIcon("diamond"), image: "/Images/Diamond.jpg" },
      { value: "oblong", label: "Oblong / rectangle", icon: faceIcon("oblong"), image: "/Images/Oblong.avif" },
      { value: "triangle", label: "Triangle / pear", icon: faceIcon("triangle"), image: "/Images/Triangle.jpg" },
      { value: "unknown", label: "I do not know my face shape", icon: faceIcon("unknown"), exclusive: true }
    ]
  },
  {
    id: "length",
    title: "How long are you thinking?",
    layout: "icon",
    options: [
      { value: "buzz", label: "Buzz / very short", desc: "Skin-close to 1 inch", icon: lengthIcon(0), length: "Short", image: "/Images/veryShortHair.png" },
      { value: "short", label: "Short", desc: "Above the ears", icon: lengthIcon(1), length: "Short", image: "/Images/ShortHair.jpg" },
      { value: "medium-short", label: "Medium-short", desc: "Ear to chin length", icon: lengthIcon(2), length: "Medium", image: "/Images/MediumShort.png" },
      { value: "medium", label: "Medium", desc: "Chin to shoulder", icon: lengthIcon(3), length: "Medium", image: "/Images/medium.jpg" },
      { value: "long", label: "Long", desc: "Shoulder to mid-back", icon: lengthIcon(4), length: "Long", image: "/Images/LongHair.webp" },
      { value: "very-long", label: "Very long", desc: "Below mid-back", icon: lengthIcon(5), length: "Long", image: "/Images/VeryLongHair.avif" },
      { value: "open", label: "I am open to anything", desc: "No preference", icon: lengthIcon(6), exclusive: true }
    ]
  },
  {
    id: "lifestyle",
    title: "What best describes your lifestyle?",
    layout: "text",
    options: [
      { value: "active", label: "Very active / sporty", keywords: ["low maintenance", "buzz", "crew"] },
      { value: "professional", label: "Professional / corporate", keywords: ["classic", "side part", "centre part", "polished"] },
      { value: "creative", label: "Creative / artistic", keywords: ["edgy", "bold", "shag", "mullet"] },
      { value: "casual", label: "Casual / relaxed", keywords: ["effortless", "grow out", "fringe"] },
      { value: "mixed", label: "Mixed / varies", exclusive: true }
    ]
  },
  {
    id: "vibe",
    title: "Which words best describe the vibe you are going for?",
    layout: "text",
    options: [
      { value: "classic", label: "Classic & timeless", keywords: ["classic", "side part", "centre part"] },
      { value: "trendy", label: "Trendy & modern", keywords: ["modern", "mod", "crop"] },
      { value: "bold", label: "Bold & edgy", keywords: ["bold", "edgy", "mullet", "dyed", "frosted"] },
      { value: "soft", label: "Soft & romantic", keywords: ["soft", "curtain", "fringe", "long"] },
      { value: "natural", label: "Natural & effortless", keywords: ["natural", "effortless", "grow out", "wavy"] },
      { value: "professional", label: "Professional & polished", keywords: ["professional", "classic", "crew", "side"] },
      { value: "playful", label: "Playful & fun", keywords: ["playful", "frosted", "dyed", "shag"] }
    ]
  }
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
  if (normalized === "short") return "Short";
  if (normalized === "medium") return "Medium";
  if (normalized === "long") return "Long";
  return "";
}

function normalizeHairType(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "straight" || normalized === "straight hair") return "Straight Hair";
  if (normalized === "wavy" || normalized === "wavy hair") return "Wavy Hair";
  if (normalized === "curly" || normalized === "curly hair") return "Curly Hair";
  return "";
}

function normalizeMaintenanceLevel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "low") return "Low";
  if (normalized === "medium") return "Medium";
  if (normalized === "higher" || normalized === "high") return "Higher";
  return "";
}

function inferHairType(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  if (/(afro|curl|curly|coily|kinky)/.test(text)) return "Curly Hair";
  if (/(wave|wavy|shag|mullet|fringe|grow out|sweep)/.test(text)) return "Wavy Hair";
  return "Straight Hair";
}

function inferMaintainability(title, length) {
  const text = slugWords(title);
  if (/(buzz|crew|crop|afro)/.test(text)) return "Low";
  if (/(frosted|dyed|mullet|rockstar|rat tail|bang)/.test(text)) return "Higher";
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
  const length = normalizeLength(item.length) || inferLength(title, features);
  const hairType = normalizeHairType(item.hairType || item.texture) || inferHairType(title, features);
  const gender = normalizeGender(item.gender) || inferGender(title, features);
  const maintenanceLevel = normalizeMaintenanceLevel(item.maintenanceLevel || item.upkeep) || inferMaintainability(title, length);
  const detail = detailsForStyle(title, length, hairType, item.description || "");
  const defaultLabels = [...new Set([...inferLabels(title, features), length.toLowerCase(), hairType.toLowerCase(), gender.toLowerCase()])];
  const labels = Array.isArray(item.labels) ? normalizeLabelList(item.labels) : defaultLabels;

  return {
    id: String(item.id || `style-${index + 1}`),
    name: title,
    imageUrl: item.imageUrl || "",
    description: item.description || "",
    labels,
    hairType,
    length,
    gender,
    maintenanceLevel,
    features,
    ...detail
  };
}

function isAdminRoute() {
  return window.location.pathname.replace(/\/+$/, "") === "/admin";
}

function isAdminContext() {
  return isAdminRoute();
}

// ---------- State ----------
const state = {
  sessionId: getSessionId(),
  styles: FALLBACK_STYLES.map(galleryItemToStyle),
  dbStyles: [],
  galleryLoaded: false,
  galleryLoadError: false,
  view: isAdminRoute() ? "admin" : readStored(VIEW_KEY, "welcome"),
  quizStep: readStored(STEP_KEY, 0),
  answers: readStored(ANSWERS_KEY, {}),
  searchQuery: "",
  favourites: new Set(),
  uploadedPhotoName: null,
  filterPanelOpen: false,
  openFilterGroups: new Set()
};

const pendingFavouriteOps = new Map();
let currentDetailId = null;

const $ = (sel) => document.querySelector(sel);

const els = {
  app: $("#app"),
  homeBtn: $("#home-btn"),
  searchNavBtn: $("#search-nav-btn"),
  favouritesBtn: $("#favourites-btn"),
  favCount: $("#fav-count"),
  detailOverlay: $("#detail-overlay"),
  detailImage: $("#detail-image"),
  detailMeta: $("#detail-meta"),
  detailName: $("#detail-name"),
  detailDescription: $("#detail-description"),
  detailLike: $("#detail-like"),
  detailBarberOpen: $("#detail-barber-open"),
  detailLength: $("#detail-length"),
  detailHairtype: $("#detail-hairtype"),
  detailGender: $("#detail-gender"),
  detailMaintenanceLevel: $("#detail-maintenance-level"),
  detailMaintenance: $("#detail-maintenance"),
  detailAttributeAdmin: $("#detail-attribute-admin"),
  detailLabels: $("#detail-labels"),
  detailLabelAdmin: $("#detail-label-admin"),
  similarResults: $("#similar-results"),
  closeDetail: $("#close-detail"),
  favouritesOverlay: $("#favourites-overlay"),
  favouritesGrid: $("#favourites-grid"),
  favouritesEmpty: $("#favourites-empty"),
  closeFavourites: $("#close-favourites"),
  barberOverlay: $("#barber-overlay"),
  barberStyleName: $("#barber-style-name"),
  barberText: $("#barber-text"),
  closeBarber: $("#close-barber")
};

function setView(view) {
  state.view = view;
  if (view === "admin" && !isAdminRoute()) {
    window.history.pushState({}, "", "/admin");
  }
  if (view !== "admin" && isAdminRoute()) {
    window.history.pushState({}, "", "/");
  }
  if (!["admin", "results", "search"].includes(view)) {
    state.filterPanelOpen = false;
    state.openFilterGroups.clear();
  }
  if (view !== "admin") writeStored(VIEW_KEY, view);
  render();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateAdminChrome() {
  document.body.dataset.adminContext = isAdminContext() ? "true" : "false";
}

function fallbackStyles() {
  return FALLBACK_STYLES.map(galleryItemToStyle);
}

function syncStylesForCurrentRoute() {
  if (!state.galleryLoaded) return;

  if (isAdminContext()) {
    state.styles = state.dbStyles;
    return;
  }

  state.styles = state.dbStyles.length ? state.dbStyles : fallbackStyles();
}

function setQuizStep(step) {
  state.quizStep = Math.max(0, Math.min(QUIZ.length - 1, step));
  writeStored(STEP_KEY, state.quizStep);
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
    if (isAdminContext()) state.styles = [];
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
  return QUIZ.find((q) => q.id === id);
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
}

function toggleQuizOption(question, option) {
  selectQuizOption(question, option);
  render();
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
  if (option.image) {
    return `<img src="${option.image}" alt="" loading="lazy">`;
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
  for (const question of QUIZ) {
    const selected = selectedFor(question);
    if (!selected.length) continue;
    if (question.id === "style" && selected.includes("__all")) {
      chips.push({ label: "Style", value: "Everything" });
      continue;
    }
    const values = selected.filter((value) => value !== "__all").map((value) => getOptionLabel(question.id, value));
    if (values.length) chips.push({ label: shortQuestionLabel(question.id), value: values.join(", ") });
  }
  return chips;
}

function selectedAnswerCount() {
  return QUIZ.reduce((total, question) => total + selectedFor(question).filter((value) => value !== "__all").length, 0);
}

function shortQuestionLabel(id) {
  return {
    style: "Style",
    texture: "Texture",
    ethnicity: "Inspiration",
    face: "Face",
    length: "Length",
    lifestyle: "Lifestyle",
    vibe: "Vibe"
  }[id] || id;
}

function answerOptions(questionId) {
  const question = getQuestionById(questionId);
  const selected = state.answers[questionId] || [];
  return selected.map((value) => question?.options.find((option) => option.value === value)).filter(Boolean);
}

function scoreStyle(style) {
  let score = 0;
  const haystack = [
    style.name,
    style.description,
    style.length,
    style.hairType,
    style.gender,
    style.maintenanceLevel,
    ...(style.labels || []),
    ...(style.features || [])
  ].join(" ").toLowerCase();

  for (const option of answerOptions("style")) {
    if (option.selectAll) score += 1;
    else if (style.gender === option.gender || style.gender === "Unisex") score += 8;
  }

  for (const option of answerOptions("texture")) {
    if (option.hairType && style.hairType === option.hairType) score += 5;
    if (["fine", "thick"].includes(option.value) && haystack.includes(option.value)) score += 2;
  }

  for (const option of answerOptions("length")) {
    if (option.length && style.length === option.length) score += 5;
  }

  for (const option of answerOptions("lifestyle")) {
    for (const keyword of option.keywords || []) {
      if (haystack.includes(keyword)) score += 2;
    }
  }

  for (const option of answerOptions("vibe")) {
    for (const keyword of option.keywords || []) {
      if (haystack.includes(keyword)) score += 2;
    }
  }

  for (const option of answerOptions("ethnicity")) {
    if (option.value !== "none" && haystack.includes(option.value.replace("-", " "))) score += 2;
  }

  return score;
}

function scoredStyles() {
  const styleAnswers = answerOptions("style").filter((option) => !option.selectAll);
  const hardFiltered = styleAnswers.length
    ? state.styles.filter((style) => styleAnswers.some((option) => style.gender === option.gender || style.gender === "Unisex"))
    : state.styles;
  const source = hardFiltered.length ? hardFiltered : state.styles;
  return [...source].sort((a, b) => scoreStyle(b) - scoreStyle(a));
}

function stylePassesAnswerFilters(style) {
  const styleAnswers = answerOptions("style").filter((option) => !option.selectAll);
  if (styleAnswers.length && !styleAnswers.some((option) => style.gender === option.gender || style.gender === "Unisex")) {
    return false;
  }

  const textureAnswers = answerOptions("texture").map((option) => option.hairType).filter(Boolean);
  if (textureAnswers.length && !textureAnswers.includes(style.hairType)) {
    return false;
  }

  const lengthAnswers = answerOptions("length").map((option) => option.length).filter(Boolean);
  if (lengthAnswers.length && !lengthAnswers.includes(style.length)) {
    return false;
  }

  return true;
}

// ---------- Rendering ----------
function render() {
  if (isAdminRoute() && state.view !== "admin") {
    state.view = "admin";
  }
  syncStylesForCurrentRoute();
  document.body.dataset.view = state.view;
  els.searchNavBtn.classList.toggle("is-active", state.view === "search");
  updateAdminChrome();
  updateFavouriteCount();

  if (state.view === "admin") renderAdmin();
  else if (state.view === "quiz") renderQuiz();
  else if (state.view === "search") renderSearch();
  else if (state.view === "results") renderResultsPage();
  else renderWelcome();
}

function renderAdmin() {
  const labelCount = state.styles.reduce((total, style) => total + (style.labels || []).length, 0);
  const galleryMessage = !state.galleryLoaded
    ? "Loading database gallery..."
    : state.galleryLoadError
      ? "Could not load database gallery. Check the API and database binding."
      : "No database-backed gallery pictures loaded.";
  els.app.innerHTML = `
    <section class="admin-screen">
      <div class="admin-heading">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Label studio</h1>
        </div>
      </div>

      <div class="admin-stats">
        <span><b>${state.styles.length}</b> pictures</span>
        <span><b>${labelCount}</b> labels</span>
        <span>Editing enabled</span>
      </div>

      <div class="admin-actions">
        <button class="primary-btn" id="admin-search-btn" type="button">Browse gallery</button>
        <button class="secondary-btn" id="admin-results-btn" type="button">View results</button>
      </div>

      <section class="results-grid admin-gallery-grid">
        ${state.galleryLoaded && state.styles.length ? state.styles.map((style) => buildStyleCardHtml(style)).join("") : `<p class="empty-state">${galleryMessage}</p>`}
      </section>
    </section>
  `;

  $("#admin-search-btn").addEventListener("click", () => setView("search"));
  $("#admin-results-btn").addEventListener("click", () => setView("results"));
  wireCards();
}

function renderWelcome() {
  els.app.innerHTML = `
    <section class="welcome-screen">
      <div class="welcome-logo">HairMatch</div>
      <p class="eyebrow">Let's begin</p>
      <h1><span>Find a haircut that's </span><em>actually you.</em></h1>
      <p class="welcome-copy">No endless scrolling. Tell us a little about yourself, or dive straight in and save what catches your eye.</p>
      <div class="welcome-options">
        <button class="choice-card" id="find-style-btn" type="button">
          <span class="choice-icon">${iconCheck()}</span>
          <span class="choice-title">Find me a style</span>
          <span class="choice-copy">Answer a few quick questions. We'll narrow thousands of looks down to the ones that suit you.</span>
          <span class="choice-action">7 quick questions ${iconArrow()}</span>
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

  els.app.innerHTML = `
    <section class="quiz-screen">
      <div class="quiz-top">
        <button class="text-btn" id="quiz-back-btn" type="button">${state.quizStep === 0 ? "Welcome" : "Back"}</button>
        <div class="progress-wrap" aria-label="Question ${state.quizStep + 1} of ${QUIZ.length}">
          <div class="progress-meta">
            <span>Question <b>${state.quizStep + 1}</b> of ${QUIZ.length}</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-track"><div style="width: ${progress}%"></div></div>
        </div>
        <div class="quiz-top-actions">
          <button class="text-btn" id="quiz-start-over-btn" type="button">Start over</button>
          <button class="text-btn" id="quiz-skip-btn" type="button">Skip</button>
        </div>
      </div>

      <div class="quiz-question">
        <p class="eyebrow">${String(state.quizStep + 1).padStart(2, "0")} / ${String(QUIZ.length).padStart(2, "0")}</p>
        <h1>${question.title}</h1>
        ${question.sub ? `<p>${question.sub}</p>` : ""}
      </div>

      <div class="option-grid ${question.layout === "text" ? "is-text" : ""}">
        ${question.options.map((option) => renderOption(question, option, selected.includes(option.value))).join("")}
      </div>

      ${question.id === "face" && selected.includes("unknown") ? renderFaceHelper() : ""}

      <div class="quiz-footer">
        <span>${selected.length ? `<b>${selected.filter((value) => value !== "__all").length || selected.length}</b> selected` : "Select any that apply, or skip"}</span>
        <button class="primary-btn" id="quiz-next-btn" type="button">${isLast ? "Show me results" : "Continue"} ${iconArrow()}</button>
      </div>
    </section>
  `;

  $("#quiz-back-btn").addEventListener("click", () => {
    if (state.quizStep === 0) setView("welcome");
    else setQuizStep(state.quizStep - 1);
  });
  $("#quiz-start-over-btn").addEventListener("click", startOver);
  $("#quiz-skip-btn").addEventListener("click", () => {
    if (isLast) setView("results");
    else setQuizStep(state.quizStep + 1);
  });
  $("#quiz-next-btn").addEventListener("click", () => {
    if (isLast) setView("results");
    else setQuizStep(state.quizStep + 1);
  });
  document.querySelectorAll("[data-option-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = question.options.find((item) => item.value === button.dataset.optionValue);
      if (option) toggleQuizOption(question, option);
    });
  });
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

function renderSearch() {
  const matches = filteredSearchStyles();
  const chips = summarizeAnswers();
  const selectedCount = selectedAnswerCount();
  els.app.innerHTML = `
    <section class="search-screen">
      <div class="screen-heading discovery-heading">
        <div>
          <p class="eyebrow">Search</p>
          <h1>I have something in mind</h1>
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
        <label class="search-input-wrap">
          <span aria-hidden="true">${iconSearch()}</span>
          <input type="search" id="search-input" placeholder="Search by length, texture, vibe, or style name" value="${escapeAttr(state.searchQuery)}" autocomplete="off">
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

  $("#search-input").addEventListener("input", (event) => {
    state.searchQuery = event.target.value;
    renderSearchGrid();
  });
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
  const results = scoredStyles();
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
        Filters
        ${selectedCount ? `<span class="filter-count">${selectedCount}</span>` : ""}
      </button>
      <button class="secondary-btn" id="refine-btn" type="button">Edit step by step</button>
      <button class="secondary-btn" id="restart-btn" type="button">Start over</button>
    </div>
  `;
}

function renderSummaryChips(chips) {
  return `<div class="summary-chips">${chips.map((chip) => `<span><b>${chip.label}:</b> ${escapeHtml(chip.value)}</span>`).join("")}</div>`;
}

function wireDiscoveryControls() {
  $("#filters-btn").addEventListener("click", () => {
    state.filterPanelOpen = !state.filterPanelOpen;
    if (state.filterPanelOpen) state.openFilterGroups.clear();
    renderCurrentDiscoveryView();
  });
  $("#refine-btn").addEventListener("click", () => setView("quiz"));
  $("#restart-btn").addEventListener("click", startOver);
  const closeFilters = $("#close-filters-btn");
  if (closeFilters) {
    closeFilters.addEventListener("click", () => {
      state.filterPanelOpen = false;
      state.openFilterGroups.clear();
      renderCurrentDiscoveryView();
    });
  }
  const clearFilters = $("#clear-filters-btn");
  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      setAnswers({});
      state.openFilterGroups.clear();
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
          <p class="eyebrow">Filters</p>
          <h2>Modify your answers</h2>
        </div>
        <button class="close-filter-btn" id="close-filters-btn" type="button" aria-label="Close filters">&times;</button>
      </div>
      <p class="answer-filter-copy">Adjust the profile from one place. Results update as soon as you change an answer.</p>
      <div class="answer-filter-actions">
        <button class="secondary-btn" id="clear-filters-btn" type="button">Clear answers</button>
        <button class="secondary-btn" id="drawer-start-over-btn" type="button">Start over</button>
      </div>
      <div class="answer-filter-count">${selectedCount || 0} selected</div>
      <div class="answer-filter-groups">
        ${QUIZ.map(renderFilterGroup).join("")}
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
  const source = answerMatches.length ? answerMatches : queryMatches;
  return [...source].sort((a, b) => scoreStyle(b) - scoreStyle(a));
}

function renderLabelChips(labels) {
  const normalized = normalizeLabelList(labels);
  return normalized.length
    ? normalized.map((label) => `<span>${escapeHtml(label)}</span>`).join("")
    : `<span class="label-empty">No labels</span>`;
}

function renderAdminCardPanel(style) {
  if (!isAdminContext()) return "";
  return `
    <div class="admin-card-panel">
      <div class="admin-card-labels" data-admin-card-labels>${renderLabelChips(style.labels)}</div>
      <button class="text-btn admin-edit-labels-btn" type="button" data-admin-edit-style="${style.id}">Edit labels</button>
    </div>
  `;
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
            <p>${style.length} - ${style.hairType}</p>
          </div>
          <button class="heart-btn ${liked ? "is-liked" : ""}" type="button" data-like-style="${style.id}" aria-label="${liked ? "Remove from saved" : "Save style"}">${liked ? "&hearts;" : "&#9825;"}</button>
        </div>
        ${renderAdminCardPanel(style)}
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
  scope.querySelectorAll("[data-admin-edit-style]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openDetail(button.dataset.adminEditStyle);
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

function findStyleIndex(id) {
  return state.styles.findIndex((item) => item.id === String(id));
}

function refreshVisibleStyleLabels(id, statusText = "", statusKind = "") {
  const style = state.styles.find((item) => item.id === String(id));
  if (!style) return;

  document.querySelectorAll(".style-card").forEach((card) => {
    if (card.dataset.styleId !== style.id) return;
    const labels = card.querySelector("[data-admin-card-labels]");
    if (labels) labels.innerHTML = renderLabelChips(style.labels);
  });

  if (currentDetailId === style.id && !els.detailOverlay.hidden) {
    els.detailLabels.innerHTML = renderLabelChips(style.labels);
    renderAdminLabelEditor(style, statusText, statusKind);
  }
}

function refreshVisibleStyleAttributes(id, statusText = "", statusKind = "") {
  const style = state.styles.find((item) => item.id === String(id));
  if (!style) return;

  document.querySelectorAll(".style-card").forEach((card) => {
    if (card.dataset.styleId !== style.id) return;
    const meta = card.querySelector(".style-card-footer p");
    if (meta) meta.textContent = `${style.length} - ${style.hairType}`;
  });

  if (currentDetailId === style.id && !els.detailOverlay.hidden) {
    els.detailMeta.textContent = `${style.gender} - ${style.length}`;
    els.detailLength.textContent = style.length;
    els.detailHairtype.textContent = style.hairType;
    els.detailGender.textContent = style.gender;
    els.detailMaintenanceLevel.textContent = style.maintenanceLevel;
    els.detailMaintenance.textContent = style.maintenance;
    renderAdminAttributeEditor(style, statusText, statusKind);
  }
}

async function saveStyleAttributes(id, nextAttributes) {
  const index = findStyleIndex(id);
  if (index < 0) return;

  const previous = { ...state.styles[index] };
  const detail = detailsForStyle(
    state.styles[index].name,
    nextAttributes.length,
    nextAttributes.hairType,
    state.styles[index].description
  );
  state.styles[index] = {
    ...state.styles[index],
    ...nextAttributes,
    ...detail
  };
  refreshVisibleStyleAttributes(id, "Saving...");

  try {
    const data = await apiJson(API.galleryAttributes(id), {
      method: "PUT",
      body: JSON.stringify(nextAttributes)
    });

    if (data.item) {
      state.styles[index] = galleryItemToStyle(data.item, index);
    }
    refreshVisibleStyleAttributes(id, "Saved");
  } catch (error) {
    state.styles[index] = previous;
    refreshVisibleStyleAttributes(id, error.message || "Could not save attributes.", "error");
  }
}

function renderAdminAttributeEditor(style, statusText = "", statusKind = "") {
  if (!els.detailAttributeAdmin) return;
  els.detailAttributeAdmin.hidden = !isAdminContext();
  if (!isAdminContext()) {
    els.detailAttributeAdmin.innerHTML = "";
    return;
  }

  els.detailAttributeAdmin.innerHTML = `
    <div class="admin-attribute-grid">
      ${renderAdminAttributeSelect("gender", "Gender", style.gender)}
      ${renderAdminAttributeSelect("length", "Length", style.length)}
      ${renderAdminAttributeSelect("hairType", "Texture", style.hairType)}
      ${renderAdminAttributeSelect("maintenanceLevel", "Upkeep", style.maintenanceLevel)}
    </div>
    <p class="admin-attribute-status ${statusKind === "error" ? "is-error" : ""}" id="admin-attribute-status">${escapeHtml(statusText)}</p>
  `;

  wireAdminAttributeEditor(style.id);
}

function renderAdminAttributeSelect(name, label, value) {
  const options = ADMIN_ATTRIBUTE_OPTIONS[name] || [];
  return `
    <label class="admin-attribute-field">
      <span>${escapeHtml(label)}</span>
      <select data-admin-attribute="${name}" aria-label="${escapeAttr(label)}">
        ${options.map((option) => `<option value="${escapeAttr(option)}" ${option === value ? "selected" : ""}>${escapeHtml(option)}</option>`).join("")}
      </select>
    </label>
  `;
}

function wireAdminAttributeEditor(styleId) {
  const editor = els.detailAttributeAdmin;
  if (!editor) return;

  editor.querySelectorAll("[data-admin-attribute]").forEach((select) => {
    select.addEventListener("change", () => {
      const style = state.styles.find((item) => item.id === String(styleId));
      if (!style) return;
      saveStyleAttributes(styleId, {
        gender: style.gender,
        length: style.length,
        hairType: style.hairType,
        maintenanceLevel: style.maintenanceLevel,
        [select.dataset.adminAttribute]: select.value
      });
    });
  });
}

async function saveStyleLabels(id, nextLabels) {
  const index = findStyleIndex(id);
  if (index < 0) return;

  const previous = [...(state.styles[index].labels || [])];
  const labels = normalizeLabelList(nextLabels);
  state.styles[index] = { ...state.styles[index], labels };
  refreshVisibleStyleLabels(id, "Saving...");

  try {
    const data = await apiJson(API.galleryLabels(id), {
      method: "PUT",
      body: JSON.stringify({ labels })
    });

    if (data.item) {
      state.styles[index] = galleryItemToStyle(data.item, index);
    }
    refreshVisibleStyleLabels(id, "Saved");
  } catch (error) {
    state.styles[index] = { ...state.styles[index], labels: previous };
    refreshVisibleStyleLabels(id, error.message || "Could not save labels.", "error");
  }
}

function renderAdminLabelEditor(style, statusText = "", statusKind = "") {
  if (!els.detailLabelAdmin) return;
  els.detailLabelAdmin.hidden = !isAdminContext();
  if (!isAdminContext()) {
    els.detailLabelAdmin.innerHTML = "";
    return;
  }

  const labels = normalizeLabelList(style.labels);
  els.detailLabelAdmin.innerHTML = `
    <div class="admin-label-list">
      ${labels.length ? labels.map((label, index) => `
        <label class="admin-label-row">
          <input type="text" value="${escapeAttr(label)}" data-label-index="${index}" aria-label="Label ${index + 1}">
          <button class="admin-label-remove" type="button" data-remove-label-index="${index}" aria-label="Remove ${escapeAttr(label)}">&times;</button>
        </label>
      `).join("") : `<p class="admin-label-empty">No labels assigned.</p>`}
    </div>
    <form class="admin-label-add-form" id="admin-label-add-form">
      <input type="text" id="admin-label-add-input" placeholder="New label" autocomplete="off">
      <button class="secondary-btn" type="submit">Add label</button>
    </form>
    <p class="admin-label-status ${statusKind === "error" ? "is-error" : ""}" id="admin-label-status">${escapeHtml(statusText)}</p>
  `;

  wireAdminLabelEditor(style.id);
}

function wireAdminLabelEditor(styleId) {
  const editor = els.detailLabelAdmin;
  if (!editor) return;

  editor.querySelectorAll("[data-label-index]").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        input.blur();
      }
    });
    input.addEventListener("change", () => {
      const style = state.styles.find((item) => item.id === String(styleId));
      if (!style) return;
      const labels = [...(style.labels || [])];
      labels[Number(input.dataset.labelIndex)] = input.value;
      saveStyleLabels(styleId, labels);
    });
  });

  editor.querySelectorAll("[data-remove-label-index]").forEach((button) => {
    button.addEventListener("click", () => {
      const style = state.styles.find((item) => item.id === String(styleId));
      if (!style) return;
      const labels = [...(style.labels || [])];
      labels.splice(Number(button.dataset.removeLabelIndex), 1);
      saveStyleLabels(styleId, labels);
    });
  });

  const form = $("#admin-label-add-form");
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const style = state.styles.find((item) => item.id === String(styleId));
      const input = $("#admin-label-add-input");
      if (!style || !input) return;
      saveStyleLabels(styleId, [...(style.labels || []), input.value]);
    });
  }
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
  els.detailMeta.textContent = `${style.gender} - ${style.length}`;
  els.detailName.textContent = style.name;
  els.detailDescription.textContent = style.description || "A reference style from the current gallery.";
  els.detailLength.textContent = style.length;
  els.detailHairtype.textContent = style.hairType;
  els.detailGender.textContent = style.gender;
  els.detailMaintenanceLevel.textContent = style.maintenanceLevel;
  els.detailMaintenance.textContent = style.maintenance;
  renderAdminAttributeEditor(style);
  els.detailLabels.innerHTML = renderLabelChips(style.labels);
  renderAdminLabelEditor(style);

  const similar = state.styles
    .filter((item) => item.id !== style.id && (item.length === style.length || item.hairType === style.hairType || item.gender === style.gender))
    .slice(0, 8);
  els.similarResults.innerHTML = similar.map((item) => buildStyleCardHtml(item, true)).join("");
  wireCards(els.similarResults);

  updateDetailLike(style.id);
  els.detailBarberOpen.onclick = () => openBarber(style.id);
  els.detailOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  els.detailOverlay.hidden = true;
  currentDetailId = null;
  if (els.favouritesOverlay.hidden && els.barberOverlay.hidden) document.body.style.overflow = "";
}

function updateDetailLike(id) {
  const liked = state.favourites.has(id);
  els.detailLike.classList.toggle("is-saved", liked);
  els.detailLike.textContent = liked ? "Saved" : "Save style";
}

function openBarber(id) {
  const style = state.styles.find((item) => item.id === String(id));
  if (!style) return;
  els.barberStyleName.textContent = style.name;
  els.barberText.textContent = style.barber;
  els.barberOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeBarber() {
  els.barberOverlay.hidden = true;
  if (els.favouritesOverlay.hidden && els.detailOverlay.hidden) document.body.style.overflow = "";
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
  for (const question of QUIZ) {
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
  els.searchNavBtn.addEventListener("click", () => setView("search"));
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
    if (els.detailOverlay.hidden && els.barberOverlay.hidden) document.body.style.overflow = "";
  });
  els.favouritesOverlay.addEventListener("click", (event) => {
    if (event.target === els.favouritesOverlay) {
      els.favouritesOverlay.hidden = true;
      if (els.detailOverlay.hidden && els.barberOverlay.hidden) document.body.style.overflow = "";
    }
  });

  els.closeBarber.addEventListener("click", closeBarber);
  els.barberOverlay.addEventListener("click", (event) => {
    if (event.target === els.barberOverlay) closeBarber();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!els.barberOverlay.hidden) closeBarber();
    else if (!els.detailOverlay.hidden) closeDetail();
    else if (!els.favouritesOverlay.hidden) {
      els.favouritesOverlay.hidden = true;
      document.body.style.overflow = "";
    }
  });

  window.addEventListener("popstate", () => {
    state.view = isAdminRoute() ? "admin" : readStored(VIEW_KEY, "welcome");
    render();
  });

  render();
  loadGallery();
  loadFavourites();
}

init();
