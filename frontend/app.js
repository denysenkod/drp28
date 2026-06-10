// ---------- API + persistent session ----------
const API = {
  gallery: "/api/gallery",
  favorites: "/api/favorites",
  userPhotos: "/api/user-photos",
  briefs: "/api/briefs"
};

const SESSION_KEY = "drp28.frontend.sessionId";
const VIEW_KEY = "drp28.frontend.view";
const ANSWERS_KEY = "drp28.frontend.answers";
const STEP_KEY = "drp28.frontend.quizStep";
const PREV_VIEW_KEY = "drp28.frontend.prevView";
const BRIEF_KEY = "drp28.frontend.brief";
const BRIEF_ID_KEY = "drp28.frontend.briefId";
const BRIEF_DETAILS_KEY = "drp28.frontend.briefDetails";
const REVIEWER_NAME_KEY = "drp28.frontend.reviewerName";

// Colour & consultation info that travels with the brief. "No colour treatment"
// is the default so an untouched brief reads as natural/virgin hair.
const NO_COLOUR_TREATMENT = "No colour treatment";
const HAIR_COLOUR_OPTIONS = [
  NO_COLOUR_TREATMENT,
  "Jet black",
  "Soft black",
  "Darkest brown",
  "Dark brown",
  "Medium brown",
  "Light brown",
  "Chestnut brown",
  "Ash brown",
  "Dark blonde",
  "Medium blonde",
  "Light blonde",
  "Ash blonde",
  "Platinum blonde",
  "Honey blonde",
  "Strawberry blonde",
  "Auburn",
  "Copper / ginger",
  "Bright red",
  "Burgundy",
  "Mahogany",
  "Rose gold",
  "Pastel pink",
  "Hot pink",
  "Lavender",
  "Purple",
  "Blue",
  "Teal",
  "Green",
  "Silver / grey",
  "Highlights",
  "Balayage",
  "Ombré",
  "Bleached / lightened",
  "Other (describe in notes)"
];

function defaultBriefDetails() {
  return {
    colour: NO_COLOUR_TREATMENT,
    allergies: "",
    previousTreatments: "",
    damage: "",
    notes: ""
  };
}

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

function iconMale() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="15" r="5.5"/><line x1="13" y1="11" x2="21" y2="3"/><polyline points="16,3 21,3 21,8"/></svg>`;
}

function iconFemale() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5.5"/><line x1="12" y1="13.5" x2="12" y2="21"/><line x1="8.5" y1="17.5" x2="15.5" y2="17.5"/></svg>`;
}

function iconArrow() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" ${iconAttrs}/></svg>`;
}

function iconCheck() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" ${iconAttrs}/></svg>`;
}

function iconPlus() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" ${iconAttrs}/></svg>`;
}

function iconStar() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.6l2.6 5.27 5.82.85-4.21 4.1.99 5.79L12 16.86l-5.2 2.75.99-5.79-4.21-4.1 5.82-.85z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
}

function iconShare() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" ${iconAttrs}/><circle cx="6" cy="12" r="3" ${iconAttrs}/><circle cx="18" cy="19" r="3" ${iconAttrs}/><path d="m8.6 13.5 6.8 3.98M15.4 6.5 8.6 10.49" ${iconAttrs}/></svg>`;
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

// ---------- Hair products ----------
// Each styling product mentioned across the app (quiz copy, maintenance tips,
// hairstyle popups) gets its own page. `matchTerms` are the phrases linkified in
// free text; `images` are the product shots and `after` is the result image.
// Image paths are placeholders under /Images/products/ - drop the real photos in
// at those paths and they replace the labelled boxes.
const PRODUCTS = {
  "curl-cream": {
    id: "curl-cream",
    name: "Curl Cream",
    description: "A leave-in styling cream that defines and softens curls, fights frizz, and keeps coils springy without the crunch of a gel.",
    matchTerms: ["curl creams", "curl cream"],
    howToUse: [
      "Work a coin-sized amount through soaking-wet hair, root to tip.",
      "Scrunch upward toward the scalp to encourage the curl pattern.",
      "Air-dry or diffuse on low heat - don't touch it while it sets."
    ],
    images: ["https://www.boucleme.co.uk/cdn/shop/products/Texture-Resize-New-Website_0000s_0008_Curl-Cream_38362f76-0fcd-4fb6-96db-d48e34789a26.png?v=1718805205&width=1946"],
    after: "https://slickgorilla.co.uk/cdn/shop/files/slick-gorilla-curl-cream-1228741454.jpg?v=1774957054&width=1080"
  },
  "sea-salt-spray": {
    id: "sea-salt-spray",
    name: "Sea Salt Spray",
    description: "A spritz that mimics the tousled, lived-in texture of a day at the beach. Adds grip and matte volume to limp or fine hair.",
    matchTerms: ["sea salt spray", "salt spray"],
    howToUse: [
      "Mist evenly over damp or dry hair from a few inches away.",
      "Scrunch with your hands to build piece-y texture.",
      "Leave it natural or rough-dry for extra lift."
    ],
    images: ["https://honorinitiative.com/cdn/shop/files/Sea_Salt_Spray_Lifestyle_1080x.jpg?v=1718452261"],
    after: "https://poseidonhair.com/cdn/shop/products/Before_and_after_styling_with_Poseidon_Hair_Sea_Salt_Spray.jpg?v=1772621538&width=1946"
  },
  "texture-powder": {
    id: "texture-powder",
    name: "Texture Powder",
    description: "A weightless powder that instantly adds volume and a matte, gritty finish at the roots. Great for fine hair that falls flat.",
    matchTerms: ["texture powders", "texture powder", "texturising powder", "texturizing powder"],
    howToUse: [
      "Tap a small amount directly onto dry roots.",
      "Massage in with your fingertips to lift and separate.",
      "Build up gradually - a little goes a long way."
    ],
    images: ["https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcTlNgTsG7gKamdDyDSprJHK2FEJuzPL2Z2DQhpI1DoOw3LukIslWSO6d4ugw3wwG-OdUBfkxykXWLptoYF9O5xsBIsE4GmM48b0--IABp6TrBDXGN4vB84OebxMSi-W8zt5Yhq3iUS6_g&usqp=CAc"],
    after: "https://poseidonhair.com/cdn/shop/products/Before_and_after_Poseidon_Hair_Texture_Powder.jpg?v=1760989538&width=1946"
  },
  "matte-paste": {
    id: "matte-paste",
    name: "Matte Paste",
    description: "A pliable, low-shine paste that shapes and holds short to medium styles with a natural, never-greasy finish.",
    matchTerms: ["matte paste", "paste", "clay"],
    howToUse: [
      "Warm a fingertip of paste between your palms.",
      "Push through towel-dried or dry hair to shape the silhouette.",
      "Restyle through the day - it stays workable."
    ],
    images: ["https://ultimategrooming.co.uk/wp-content/uploads/2020/11/F139E730-A7D3-4170-B220-548C613B72A6.jpeg"],
    after: "https://blumaan.com/cdn/shop/files/UGC-3.webp?v=1742848247"
  },
  "pomade": {
    id: "pomade",
    name: "Pomade",
    description: "A classic styling pomade for slick, polished looks with a glossy finish and firm, restylable hold.",
    matchTerms: ["pomade"],
    howToUse: [
      "Emulsify a small amount between your hands.",
      "Comb through damp hair for a sleek finish, or dry hair for more texture.",
      "Shape the parting and edges with a fine comb."
    ],
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR-FroBgNrW3TliLIi_S1T7dvCKS_gBAO7Ydg&s"],
    after: "https://slickgorilla.co.uk/cdn/shop/files/slick-gorilla-clay-pomade-1228741436.jpg?v=1774957257&width=1080"
  },
  "gel": {
    id: "gel",
    name: "Styling Gel",
    description: "A firm-hold gel for slick, structured looks with a wet-to-glossy finish. Locks a parting or a swept-back shape in place and keeps it there all day.",
    matchTerms: ["styling gel", "gel"],
    howToUse: [
      "Rake a small amount through damp hair, root to tip.",
      "Comb it into the shape you want - a parting, a slick back, or height at the front.",
      "Let it set undisturbed; scrunch it out later for a softer, broken finish."
    ],
    images: ["https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTKpx-s2fppsC16eQyovrWNoDPswl6fHon7uQ&s"],
    after: "https://sammcknight.com/cdn/shop/products/SELFCONTROLBEFORE_AFTERHARRY_450x.jpg?v=1757606877"
  },
  "heat-protectant": {
    id: "heat-protectant",
    name: "Heat Protectant",
    description: "A lightweight shield that guards strands from heat damage before you reach for straighteners, curlers, or a blow-dryer.",
    matchTerms: ["heat protection spray", "heat protection", "heat protectant"],
    howToUse: [
      "Mist evenly over damp or dry hair before any heat styling.",
      "Comb through so every section is coated.",
      "Then straighten, curl, or blow-dry as usual."
    ],
    images: ["https://m.media-amazon.com/images/I/511R8f-IS4L.jpg"],
    after: "https://i0.wp.com/www.makeupandbeautyhome.com/wp-content/uploads/2014/12/diy-hair-spray-before-after.jpg?fit=650%2C650"
  },
  "hair-oil": {
    id: "hair-oil",
    name: "Hair Oil",
    description: "A nourishing finishing oil that tames frizz, adds healthy shine, and smooths split ends on longer or dry hair.",
    matchTerms: ["hair oil", "smoothing product", "serum"],
    howToUse: [
      "Warm a few drops between your palms.",
      "Smooth over the mid-lengths and ends, avoiding the roots.",
      "Use on damp hair before drying or dry hair to finish."
    ],
    images: ["https://img.freepik.com/premium-photo/transparent-glass-bottle-with-body-oil-unbranded-container-with-dispenser-shadow-background-moisturizing-repair-damaged-hair-cosmetology-beauty-concept-place-text-right-side_97916-1062.jpg"],
    after: "https://rehabyourhair.com/cdn/shop/files/BeforeAfters-HairOil1.jpg?v=1744718230&width=2480"
  },
  "diffuser": {
    id: "diffuser",
    name: "Diffuser",
    description: "A bowl-shaped blow-dryer attachment that spreads the airflow gently across the hair. It dries curls and coils without blasting them into frizz, keeping the curl pattern intact.",
    matchTerms: ["diffuser", "diffuse"],
    howToUse: [
      "Clip the diffuser onto your dryer and set it to low heat and low speed.",
      "Cup sections of damp, product-coated hair into the bowl and push up toward the scalp.",
      "Dry without raking through, then break the cast with your fingers once it's cool."
    ],
    images: ["https://uk.curlsmith.com/cdn/shop/files/4L7A2591-Edit-2-2000x2000_b3e5a559-d4d2-4f7a-9b56-0c01379c8ae9.jpg?v=1765374406&width=1600"],
    after: "https://cdn.shopify.com/s/files/1/0550/9860/5649/files/11809_Diffon_DF_1000_1080x1080_before_after_1_uk_600x600.jpg?v=1661345075"
  },
  "straighteners": {
    id: "straighteners",
    name: "Hair Straighteners",
    description: "Heated flat-iron plates that smooth and straighten the hair for a sleek, blunt, frizz-free finish. Best used on dry hair after a heat protectant.",
    matchTerms: ["straighteners", "straightener", "flat iron", "straighten"],
    howToUse: [
      "Start on dry hair with a heat protectant already combed through.",
      "Work in small sections, gliding the plates slowly from root to tip.",
      "Finish with a drop of hair oil to smooth any flyaways."
    ],
    images: ["https://upload.wikimedia.org/wikipedia/commons/7/75/GHDhairiron1.JPG"],
    after: "https://upload.wikimedia.org/wikipedia/commons/f/f2/Woman_Using_Hair_Straighteners_01.jpg"
  },
  "curling-iron": {
    id: "curling-iron",
    name: "Curling Iron",
    description: "A heated barrel (or wand) that adds bends, waves, or defined curls to dry hair. Swap barrel sizes for tighter coils or loose, romantic waves.",
    matchTerms: ["curling iron", "curling wand", "curling tongs", "curling tong", "curlers", "curler"],
    howToUse: [
      "Prep dry hair with a heat protectant first.",
      "Wrap small sections around the barrel away from your face, holding for a few seconds.",
      "Let each curl cool in your hand, then loosen with your fingers for a softer finish."
    ],
    images: ["https://www.littlebirdhairdesign.co.uk/wp-content/uploads/2020/08/445.jpg"],
    after: "https://www.chrisandsons.co.uk/media/catalog/product/cache/e0358b30d0de2768ca35679123775195/6/1/61135_61135fz.jpg"
  }
};

const PRODUCT_LIST = Object.values(PRODUCTS);

// Base length choices, shared across all genders. When the survey targets a
// single gender these are shown as-is; when it targets both genders each one is
// expanded into a male and a female variant (see buildLengthOptions).
const LENGTH_OPTIONS_BASE = [
  { value: "buzz", label: "Very short", icon: lengthIcon(0), length: "Very Short", image: "/Images/LongHair.webp", images: { 
    masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/Crew-Cut-Fade.webp?v=1755505078", 
    feminine: "https://hairstyles.thehairstyler.com/hairstyle_views/front_view_images/14295/original/blonde-pixie-hair-cut.jpg"} },
  { value: "short", label: "Short", icon: lengthIcon(1), length: "Short", image: "/Images/LongHair.webp", images: { 
    masculine: "https://static.wixstatic.com/media/63282f_94724ec44c744bdc8bba3da51359d31c~mv2.png/v1/fill/w_980,h_1179,al_c,q_90,usm_0.66_1.00_0.01,enc_avif,quality_auto/63282f_94724ec44c744bdc8bba3da51359d31c~mv2.png", 
    feminine: "https://i.pinimg.com/originals/87/a8/23/87a823af57c7965000c03a93df9406d7.jpg"} },
  { value: "medium", label: "Medium", icon: lengthIcon(2), length: "Medium", image: "/Images/LongHair.webp", images: { 
    masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/medium-length-fluffy-haircut-men_600x600.webp?v=1774622719", 
    feminine: "https://www.southernliving.com/thmb/3xQCbUDxtOwSx9Zr_dv7_yIYoX8=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/classic-mid-length-7447d02832af48a4982f72671dce722b.jpg"} },
  { value: "long", label: "Long", icon: lengthIcon(4), length: "Long", image: "/Images/LongHair.webp", images: { 
    masculine: "https://www.deauvilleaumasculin.com/cdn/shop/articles/thumbnail_d1aef075-6693-446d-9449-56536037a9cb_1100x.jpg?v=1745886543", 
    feminine: "https://ladyandthehair.com.au/wp-content/uploads/2025/04/Long-Wavy-Hair-with-Bangs-1.jpg"} }
];


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
          label: base.label,
          gender: variant.gender,
          image: base.images?.[variant.imageKey] || base.image
        });
      }
    }
    return [...gendered];
  }
  return [...LENGTH_OPTIONS_BASE];
}

const QUIZ = [
  {
    id: "style",
    title: "What gendered styles are you looking for?",
    sub: "",
    layout: "image",
    options: [
      { value: "masculine", label: "Masculine styles", gender: "Men", image: "https://cdn.shopify.com/s/files/1/2384/0833/files/Textured_Crop.png?v=1771863492" },
      { value: "feminine", label: "Feminine styles", gender: "Women", image: "https://i.pinimg.com/736x/02/60/fb/0260fb8291cebe7d8ba355c9befaa81c.jpg" }
    ]
  },
  {
    id: "texture",
    title: "What are your desired hair textures?",
    sub: "Your actual texture will be factored in during our hair maintanence plans.",
    layout: "icon",
    options: [
      { value: "straight", label: "Straight", icon: textureIcon("straight"), hairType: "Straight Hair", image: "/Images/LongHair.webp", images: { 
        masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/textured-fringe-straight-hair-men.webp?v=1768222652", 
        feminine: "https://i0.wp.com/therighthairstyles.com/wp-content/uploads/2024/01/12-straight-hair-with-curled-locks.jpg?resize=1440%2C1698&ssl=1" }},
      { value: "wavy", label: "Wavy", icon: textureIcon("wavy"), hairType: "Wavy Hair", image: "/Images/LongHair.webp", images: { 
        masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/medium-length-wavy-hairstyle-men.webp?v=1767878793", 
        feminine: "https://content.latest-hairstyles.com/wp-content/uploads/best-hairstyles-for-thick-wavy-hair-1x1-1.jpg"} },
      { value: "curly", label: "Curly", icon: textureIcon("curly"), hairType: "Curly Hair", image: "/Images/LongHair.webp", images: { 
        masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/taper-fade-curly-hair-men.webp?v=1767776997", 
        feminine: "https://ucarecdn.com/2c12cace-f519-415a-adeb-fe89f9d123e7/-/format/auto/-/preview/3000x3000/-/quality/lighter/3422432_qdw2.jpg"} },
      { value: "coily", label: "Coily", icon: textureIcon("coily"), hairType: "Coily Hair", image: "/Images/LongHair.webp", images: { 
        masculine: "https://theorganibrands.com/cdn/shop/articles/IMG_1611-5085105.jpg?v=1774982816", 
        feminine: "https://onlycurls.com/cdn/shop/files/wcc-coily2.jpg?v=1759275541&width=1400"} }
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
        ? "Pick a male and/or female lengths - you can mix and match across genders."
        : "Pick the options which best resembles your desired length.";
    },
    get options() {
      return buildLengthOptions();
    }
  },
  {
    id: "vibe",
    title: "Which words best describe the look you are going for?",
    layout: "collage",
    sub: "Feel free to pick multiple options. This will help inform your recommendations.",
    options: [
      { value: "classic", label: "Classic", vibe: "classic", keywords: ["classic", "side part", "centre part"], images: {
        masculine: "https://cdn.thecoolist.com/wp-content/uploads/2017/05/Slicked-Back-classic-mens-hairstyle-762x999.jpg", 
        feminine: "https://www.instyle.com/thmb/KdwsVUom4JWPeqkoDsiOV7_j0wI=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1477697852-dc20ae570d684c6d8772bf1051736ff4.jpg"} },
      { value: "trendy", label: "Trendy", keywords: ["modern", "mod", "crop", "trendy"], images: {
        masculine: "https://www.the5thelement.uk/wp-content/uploads/2025/06/men-perm-in-reading.jpg", 
        feminine: "https://media.glamour.com/photos/5f0e32bc9f970c720ce36ec6/master/w_1024%2Cc_limit/Screen%2520Shot%25202020-07-14%2520at%25206.33.11%2520PM.png"}  },
      { value: "bold", label: "Edgy", vibe: "bold", keywords: ["bold", "edgy", "mullet", "dyed", "frosted"], images: {
        masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/liberty-spikes-hairstyle-men.webp?v=1758794959", 
        feminine: "https://content.latest-hairstyles.com/wp-content/uploads/edgy-haircuts-for-women-1200x900.jpg"}  },
      { value: "soft", label: "Romantic", vibe: "soft", keywords: ["soft", "curtain", "fringe", "long"], images: {
        masculine: "https://i.pinimg.com/236x/0d/4a/0a/0d4a0a65aa47fc1010e099c67b54bd90.jpg", 
        feminine: "https://nubihair.com/wp-content/uploads/Nubi-Hair-Romantic-Hairstyles.jpg"}  },
      { value: "low-maintanence", label: "Effortless", vibe: "low-maintanence", keywords: ["natural", "effortless", "grow out", "wavy", "low-maintanence"], images: {
        masculine: "https://www.byrdie.com/thmb/u4lP1HcP1E12OnhYVHq4H56lowM=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc():format(webp)/Ryan-Gosling-Lead-c41f2cebb31d405ebd197955987481d9-a0f47d9bbc3f4dd88fe4cdffbbb24f36.jpeg", 
        feminine: "https://media.glamour.com/photos/641b144fe20117d5137216b4/master/w_1024%2Cc_limit/IMG_1383.jpg"}  },
      { value: "professional", label: "Professional", vibe: "professional", keywords: ["professional", "classic", "crew", "side"], images: {
        masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/brushed-back-hairstyle-for-men.webp?v=1765268282", 
        feminine: "https://media.lovelyish.com/wp-content/uploads/2026/04/Blunt-Bob-Haircut-20.jpg"}  },
      { value: "playful", label: "Playful", vibe: "playful", keywords: ["playful", "frosted", "dyed", "shag"], images: {
        masculine: "https://cdn.shopify.com/s/files/1/0029/0868/4397/files/curly-mullet-hairstyle-men.webp?v=1767776997", 
        feminine: "https://content.latest-hairstyles.com/wp-content/uploads/galleries/10/07/playful-y2k-double-bun-hairstyle-with-curly-bangs.jpg"}  },
      { value: "sporty", label: "Sporty", vibe: "sporty", keywords: ["sporty", "athletic", "active", "gym", "practical", "short"], images: {
        masculine: "https://www.kaya.in/media/.renditions/wysiwyg/crew-cut-with-fade-men-short-hairstyle.png", 
        feminine: "https://www.byrdie.com/thmb/vUYwHo0_s3BtdiDaO_Uycv3mV-s=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-2148179033-da1fb4768c944392b21f7be1f91b5488.jpg"}  }
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
    title: "How much maintenance?",
    layout: "slider",
    options: [
      { value: "low", label: "Low", upkeep: "Low" },
      { value: "medium", label: "Medium", products: ["sea-salt-spray", "texture-powder", "matte-paste"], upkeep: "Medium" },
      { value: "high", label: "High", products: ["curl-cream", "sea-salt-spray", "texture-powder", "matte-paste", "pomade", "gel", "heat-protectant", "hair-oil", "diffuser", "straighteners", "curling-iron"], upkeep: "High" }
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

const HAIR_COLOUR_FILTER = {
  id: "hair_colour",
  title: "Which hair colour should the reference photos show?",
  sub: "Uses the hair-colour labels stored in the hairstyle database.",
  layout: "text",
  options: [
    { value: "black", label: "Black" },
    { value: "brown", label: "Brown" },
    { value: "blonde", label: "Blonde" },
    { value: "red", label: "Red" },
    { value: "grey", label: "Grey" },
    { value: "other", label: "Other" },
    { value: "none", label: "No preference", exclusive: true }
  ]
};

const HAIR_THICKNESS_FILTER = {
  id: "hair_thickness",
  title: "Which hair thickness should the reference photos show?",
  sub: "Uses the hair-thickness labels stored in the hairstyle database.",
  layout: "text",
  options: [
    { value: "especially thin", label: "Especially thin" },
    { value: "thin", label: "Thin" },
    { value: "thick", label: "Thick" },
    { value: "especially thick", label: "Especially thick" },
    { value: "none", label: "No preference", exclusive: true }
  ]
};

const DISCOVERY_FILTER_QUESTIONS = [
  ...QUIZ.slice(0, 3),
  FACE_SHAPE_FILTER,
  HAIR_COLOUR_FILTER,
  HAIR_THICKNESS_FILTER,
  ...QUIZ.slice(3)
];

const REFINE_FILTERS = [
  {
    id: "face_shape",
    label: "✧ Specify a face shape",
    noun: "face shape",
    question: "Which face shape are you?",
    options: [
      { value: "oval", label: "Oval" },
      { value: "round", label: "Round" },
      { value: "square", label: "Square" },
      { value: "heart", label: "Heart" },
      { value: "diamond", label: "Diamond" },
      { value: "triangle", label: "Triangle" },
      { value: "rectangle", label: "Rectangle" }
    ]
  },
  {
    id: "hair_colour",
    label: "✧ Specify a hair colour",
    noun: "hair colour",
    question: "What is your hair colour?",
    options: [
      { value: "black", label: "Black" },
      { value: "brown", label: "Brown" },
      { value: "blonde", label: "Blonde" },
      { value: "red", label: "Red" },
      { value: "grey", label: "Grey" },
      { value: "other", label: "Other" }
    ]
  },
  {
    id: "thickness",
    label: "✧ Specify a hair thickness",
    noun: "hair thickness",
    question: "What is your hair thickness?",
    options: [
      { value: "especially thin", label: "Especially thin" },
      { value: "thin", label: "Thin" },
      { value: "thick", label: "Thick" },
      { value: "especially thick", label: "Especially thick" }
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

// Cut-specific maintenance advice. The first matching pattern wins, so protective
// styles (locs, braids, twists) and colour treatments are checked before the
// generic cuts - otherwise they'd fall through to curl-cream-and-diffuse advice
// that doesn't apply to them. When nothing matches, the routine falls back to the
// hair type and length. Product names in the copy are linkified into the product
// popups when the text is rendered.
const CUT_MAINTENANCE = [
  [/(dreadlock|dread|\blocs?\b)/,
    "Locs thrive on a clean, dry scalp and tidy roots. Wash with a residue-free shampoo so nothing builds up inside the locs, then dry them all the way through to avoid mildew. Palm-roll or retwist the new growth at the roots as it loosens, and work a drop of hair oil into the scalp to keep the skin from drying out - steer clear of heavy waxes and creams, which only leave buildup."],
  [/(braid|cornrow)/,
    "Braided styles are really about caring for the scalp underneath. Cleanse it with a diluted shampoo and your fingertips, then run a little hair oil along the partings so the skin doesn't dry out and flake. Sleep in a satin scarf or on a satin pillowcase to keep them neat, and take the braids down after six to eight weeks so the tension doesn't strain your hairline."],
  [/(twist)/,
    "Twists are set on damp hair: smooth a little hair oil through each section and two-strand twist, then let them dry fully - wear them as they are or unravel for a twist-out. Refresh with a spritz of water and a touch of oil between days, and re-twist at night under a satin scarf to hold the pattern."],
  [/(frosted|dyed|bleach|bleached|highlight|platinum|colou?r)/,
    "Coloured hair needs babying: always use a heat protectant before styling and a colour-safe shampoo to slow fading. Top up the tone whenever you notice regrowth at the roots or the colour starting to fade, and keep the ends soft with a little hair oil."],
  [/(mullet|shag|rockstar|rat tail)/,
    "The short-top, long-back contrast is the whole look. Scrunch sea salt spray through damp hair and let it air-dry for that lived-in texture, or tap in a little texture powder at the roots for extra grit."],
  [/(curtain|fringe)/,
    "Rough-dry it forwards, work in a little sea salt spray for separation, then split the parting with your fingers."],
  [/(edgar|caesar|french crop|\bcrop\b)/,
    "Keep the fringe blunt and the sides tight. Push a pea-sized scoop of matte paste through dry hair and forward at the fringe for that flat finish, or tap in some texture powder at the roots if it falls flat."],
  [/(buzz|induction|\bcrew\b)/,
    "Massage a drop of hair oil into the scalp so the skin doesn't look dry, and that's about it."],
  [/(quiff|pompadour|pomp|slick|undercut)/,
    "Build height at the front with a blow-dry, then lock it in - gel or pomade for a high-shine hold, or matte paste for a drier finish. For fine hair, tap texture powder into the roots first for lift."],
  [/(side part|side parting|centre part|center part|classic|wall street|art dealer)/,
    "A clean parting is everything here. Comb gel or pomade through damp hair, set the part with the comb, and blow-dry to one side for a polished finish."],
  [/(grow out|grown out|grow-out|\bmod\b|mod-ish|sweep|\bflow\b)/,
    "This one is about length. Work sea salt spray through damp hair for body, then sweep it back with your fingers."],
  [/(pixie)/,
    "Warm a little matte paste between your fingers and piece out the top, or tap in some texture powder at the roots for lift and movement."],
  [/(\bbob\b|\blob\b)/,
    "Blow-dry with a round brush for body, add texture powder at the roots if it falls flat, smooth flyaways with a touch of hair oil, and reach for a heat protectant whenever you use straighteners."]
];

function maintenanceForStyle(title, length, hairType, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`.toLowerCase();
  for (const [pattern, copy] of CUT_MAINTENANCE) {
    if (pattern.test(text)) return copy;
  }

  // Fall back to the hair type, then the overall length.
  if (hairType === "Coily Hair") {
    return "Coils love moisture: work curl cream through soaking-wet hair, scrunch upwards, then air-dry or diffuse on low. Refresh with water and a little hair oil between wash days.";
  }
  if (hairType === "Curly Hair") {
    return "Define the curls with curl cream on soaking-wet hair, scrunching upward, then diffuse or air-dry without touching it while it sets. A little hair oil on day two tames frizz.";
  }
  if (hairType === "Wavy Hair") {
    return "Encourage the wave with sea salt spray on damp hair, scrunching as it dries, or add looser bends with a curling iron over a heat protectant. Finish with a drop of hair oil.";
  }
  if (length === "Short" || length === "Very Short") {
    return "A small amount of matte paste through dry hair controls the shape without making it stiff.";
  }
  return "Blow-dry with a brush for movement, then smooth the ends with a little hair oil only where you need it.";
}

function detailsForStyle(title, length, hairType, features = []) {
  return {
    maintenance: maintenanceForStyle(title, length, hairType, features),
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
  const detail = detailsForStyle(title, length, hairType, features);
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
    hairThickness: String(item.hairThickness || analysis.hairThickness || "").trim().toLowerCase(),
    length,
    gender,
    ethnicity: String(item.ethnicity || analysis.ethnicity || "").trim().toLowerCase(),
    celebrity: String(item.celebrity || analysis.celebrity || "none").trim(),
    maintenanceLevel,
    faceShape: normalizeFaceShape(item.faceShape || analysis.faceShape),
    vibe: String(item.vibe || analysis.vibe || "").trim().toLowerCase(),
    hairColour: String(item.hairColour || analysis.hairColour || "").trim(),
    haircutName: String(item.haircutName || analysis.haircutName || "").trim(),
    classifiedAt: String(item.classifiedAt || analysis.updatedAt || "").trim(),
    analysisModel: String(item.analysisModel || analysis.model || "").trim(),
    createdAt: String(item.createdAt || "").trim(),
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
  view: readStored(VIEW_KEY, "welcome") === "search" ? "results" : readStored(VIEW_KEY, "welcome"),
  previousView: readStored(PREV_VIEW_KEY, "welcome"),
  quizStep: readStored(STEP_KEY, 0),
  answers: readStored(ANSWERS_KEY, {}),
  searchQuery: "",
  favourites: new Set(),
  brief: readStored(BRIEF_KEY, []),
  briefId: readStored(BRIEF_ID_KEY, null),
  briefDetails: { ...defaultBriefDetails(), ...readStored(BRIEF_DETAILS_KEY, {}) },
  briefPickerOpen: false,
  shareStatus: "",
  sharedBriefId: null,
  sharedBrief: null,
  sharedBriefError: false,
  reviewerName: readStored(REVIEWER_NAME_KEY, ""),
  uploadedPhotoName: null,
  filterPanelOpen: false,
  openFilterGroups: new Set(),
  openPreferenceMenu: null,
  openRefineFilter: null,
  refineFilters: { face_shape: new Set(), hair_colour: new Set(), thickness: null },
  lengthGenderFilter: "masculine"
};

const pendingFavouriteOps = new Map();
let currentDetailId = null;
let currentProductId = null;

const $ = (sel) => document.querySelector(sel);

const els = {
  app: $("#app"),
  homeBtn: $("#home-btn"),
  topbarSearchInput: $("#topbar-search-input"),
  favouritesBtn: $("#favourites-btn"),
  favCount: $("#fav-count"),
  briefBtn: $("#brief-btn"),
  briefCount: $("#brief-count"),
  detailOverlay: $("#detail-overlay"),
  detailImage: $("#detail-image"),
  detailMeta: $("#detail-meta"),
  detailName: $("#detail-name"),
  detailLike: $("#detail-like"),
  detailMaintenance: $("#detail-maintenance"),
  detailProductsSection: $("#detail-products-section"),
  detailProducts: $("#detail-products"),
  similarResults: $("#similar-results"),
  closeDetail: $("#close-detail"),
  favouritesOverlay: $("#favourites-overlay"),
  favouritesGrid: $("#favourites-grid"),
  favouritesEmpty: $("#favourites-empty"),
  closeFavourites: $("#close-favourites"),
  productOverlay: $("#product-overlay"),
  productName: $("#product-name"),
  productDescription: $("#product-description"),
  productPhotos: $("#product-photos"),
  productHowtoSection: $("#product-howto-section"),
  productHowto: $("#product-howto"),
  productTransition: $("#product-transition"),
  closeProduct: $("#close-product")
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
  if (view === "results") {
    window.history.pushState({ view: "results", previousView: state.previousView }, "", "?results");
  }
  if (view === "brief") {
    window.history.pushState({ view: "brief", previousView: state.previousView }, "", "?brief");
  }
  if (view === "welcome") {
    window.history.pushState({ view: "welcome", previousView: state.previousView }, "", "/");
  }
  if (view !== "results") {
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
  state.lengthGenderFilter = "masculine";
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

function preferenceOptions(question) {
  return (question?.options || []).filter((option) => !option.exclusive && !option.selectAll);
}

function selectedPreferenceValues(question) {
  const allowed = new Set(preferenceOptions(question).map((option) => option.value));
  return selectedFor(question).filter((value) => allowed.has(value));
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
  // Always update card states in-place — never a full re-render here.
  // A full re-render resets scroll position to 0 which causes visible jumping.
  // Length options for later steps are computed fresh when those steps render,
  // so there's no need to re-render the current step when style changes.
  const selected = selectedFor(question);
  document.querySelectorAll("[data-option-value]").forEach((btn) => {
    const on = selected.includes(btn.dataset.optionValue);
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    const checkEl = btn.querySelector(".option-check");
    if (checkEl) checkEl.innerHTML = on ? iconCheck() : "";
  });
  const footerSpan = document.querySelector(".quiz-footer > span");
  if (footerSpan) {
    const count = selected.filter((v) => v !== "__all").length || selected.length;
    footerSpan.innerHTML = selected.length ? `<b>${count}</b> selected` : "";
  }
  const labelEl = document.querySelector("#quiz-next-label");
  if (labelEl) {
    const isLast = state.quizStep === QUIZ.length - 1;
    labelEl.textContent = selected.length ? (isLast ? "Show me results" : "Continue") : "Skip";
  }
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
    const selected = selectedPreferenceValues(question);
    if (!selected.length) continue;
    const values = selected.map((value) => getOptionLabel(question.id, value));
    if (values.length) chips.push({ questionId: question.id, label: shortQuestionLabel(question.id), value: values.join(", ") });
  }
  return chips;
}

function selectedAnswerCount() {
  return DISCOVERY_FILTER_QUESTIONS.reduce((total, question) => total + selectedPreferenceValues(question).length, 0);
}

function shortQuestionLabel(id) {
  return {
    style: "Style",
    texture: "Texture",
    ethnicity: "Ethnicity",
    hair_colour: "Hair Colour",
    hair_thickness: "Thickness",
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
  const fields = [
    style.id,
    style.name,
    style.imageUrl,
    style.description,
    style.length,
    style.hairType,
    style.hairSubtype,
    style.hairThickness,
    style.ethnicity,
    style.celebrity,
    style.gender,
    style.maintenanceLevel,
    style.faceShape,
    style.vibe,
    style.hairColour,
    style.haircutName,
    style.maintenance,
    style.classifiedAt,
    style.analysisModel,
    style.createdAt,
    ...(style.labels || []),
    ...(style.features || [])
  ];

  return normalizeSearchText(fields.join(" "));
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

function optionEthnicityMatch(style, option) {
  return Boolean(option.value && option.value !== "none" && style.ethnicity === option.value);
}

function hairColourKey(value) {
  const text = normalizeSearchText(value);
  if (!text) return "";
  if (text.includes("black")) return "black";
  if (text.includes("brown") || text.includes("brunette")) return "brown";
  if (text.includes("blonde") || text.includes("blond")) return "blonde";
  if (text.includes("red") || text.includes("auburn") || text.includes("ginger")) return "red";
  if (text.includes("grey") || text.includes("gray") || text.includes("silver")) return "grey";
  return "other";
}

function optionHairColourMatch(style, option) {
  return Boolean(option.value && option.value !== "none" && hairColourKey(style.hairColour) === option.value);
}

function optionHairThicknessMatch(style, option) {
  return Boolean(option.value && option.value !== "none" && style.hairThickness === option.value);
}

function optionLengthMatch(style, option) {
  if (!option.length) return true;
  if (style.length !== option.length) return false;
  // Gendered length variants (from a "both" survey) only match their own
  // gender; Unisex styles fit either a male or female length request.
  if (option.gender && style.gender !== option.gender && style.gender !== "Unisex") return false;
  return true;
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function answerSeed() {
  const key = Object.entries(state.answers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join("|");
  return hashStr(key);
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
    if (optionEthnicityMatch(style, option)) score += 5;
  }

  for (const option of answerOptions("hair_colour")) {
    if (optionHairColourMatch(style, option)) score += 4;
  }

  for (const option of answerOptions("hair_thickness")) {
    if (optionHairThicknessMatch(style, option)) score += 4;
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
  const seed = answerSeed();
  return [...source].sort((a, b) => {
    const scoreDiff = scoreStyle(b) - scoreStyle(a);
    if (scoreDiff !== 0) return scoreDiff;
    return hashStr(a.id + seed) - hashStr(b.id + seed);
  });
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

  if (!optionGroupPasses(style, "ethnicity", (option) => optionEthnicityMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "hair_colour", (option) => optionHairColourMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "hair_thickness", (option) => optionHairThicknessMatch(style, option))) {
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
  updateBriefCount();

  if (state.view === "quiz") renderQuiz();
  else if (state.view === "results") renderResultsPage();
  else if (state.view === "brief") renderBrief();
  else if (state.view === "shared") renderSharedBrief();
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
        <button class="choice-card" id="build-brief-btn" type="button">
          <span class="choice-icon">${iconStar()}</span>
          <span class="choice-title">Build a style brief</span>
          <span class="choice-copy">Collect photos of your own hair and references you love, rate them, and bring the brief to your stylist.</span>
          <span class="choice-action">Start your brief ${iconArrow()}</span>
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
  $("#have-mind-btn").addEventListener("click", () => setView("results"));
  $("#build-brief-btn").addEventListener("click", () => setView("brief"));
}

function renderQuiz() {
  const question = QUIZ[state.quizStep] || QUIZ[0];
  const selected = selectedFor(question);
  const progress = Math.round(((state.quizStep + 1) / QUIZ.length) * 100);
  const isLast = state.quizStep === QUIZ.length - 1;
  const isScale = question.layout === "scale";
  const isSlider = question.layout === "slider";
  const hasSelection = isSlider || isScale || selected.length > 0;
  const nextLabel = hasSelection ? (isLast ? "Show me results" : "Continue") : "Skip";
  const showLengthGenderToggle = question.id === "length" && selectedSurveyGender() === "both";
  const visibleOptions = showLengthGenderToggle
    ? question.options.filter((o) => o.gender === (state.lengthGenderFilter === "masculine" ? "Men" : "Women"))
    : question.options;
  const quizContentClass = [
    "quiz-content",
    isSlider ? "is-slider" : isScale ? "is-scale" : "is-options"
  ].join(" ");

  els.app.innerHTML = `
    <section class="quiz-screen">
      <div class="quiz-top">
        <button class="quiz-logo-btn" id="quiz-start-over-btn" type="button" aria-label="Start over">HairMatch</button>
        <div class="progress-wrap" aria-label="Question ${state.quizStep + 1} of ${QUIZ.length}">
          <div class="progress-meta">
            <span>Question <b>${state.quizStep + 1}</b> of ${QUIZ.length}</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-track"><div style="width: ${progress}%"></div></div>
        </div>
      </div>

      <div class="${quizContentClass}">
        <div class="quiz-question">
          <h1>${question.title}</h1>
          ${question.sub ? `<p>${question.sub}</p>` : ""}
          <div class="quiz-question-buttons">
            ${state.quizStep > 0 ? `<button class="secondary-btn" id="quiz-back-btn" type="button">Back</button>` : ""}
            <button class="primary-btn" id="quiz-next-btn" type="button"><span id="quiz-next-label">${nextLabel}</span> ${iconArrow()}</button>
            ${showLengthGenderToggle ? `
              <div class="length-gender-toggle">
                <button class="length-gender-btn ${state.lengthGenderFilter === "masculine" ? "is-active" : ""}" type="button" data-length-gender="masculine" aria-label="Men">${iconMale()}</button>
                <button class="length-gender-btn ${state.lengthGenderFilter === "feminine" ? "is-active" : ""}" type="button" data-length-gender="feminine" aria-label="Women">${iconFemale()}</button>
              </div>
            ` : ""}
          </div>
        </div>

        <div class="quiz-response">
          ${isSlider ? renderSliderQuestion(question, selected) : isScale ? renderScaleQuestion(question, selected) : `
            <div class="option-grid ${question.layout === "text" ? "is-text" : question.layout === "collage" ? "is-collage" : ""}">
              ${visibleOptions.map((option) => renderOption(question, option, isQuizOptionSelected(question, option, selected))).join("")}
            </div>
          `}

          ${question.id === "face" && selected.includes("unknown") ? renderFaceHelper() : ""}
        </div>
      </div>

      <div class="quiz-footer">
        <span>${selected.length ? `<b>${selected.filter((value) => value !== "__all").length || selected.length}</b> selected` : ""}</span>
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
    document.querySelectorAll("[data-length-gender]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lengthGenderFilter = btn.dataset.lengthGender;
        renderQuiz();
      });
    });
    wireCarouselDots(question);
  }
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function wireCarouselDots(question) {
  if (!isMobileViewport() || question.layout === "text" || question.layout === "collage" || question.layout === "slider" || question.layout === "scale") return;

  const grid = document.querySelector(".option-grid:not(.is-text)");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".option-card"));
  if (cards.length < 2) return;

  // Insert dot container right after the grid
  const dotsEl = document.createElement("div");
  dotsEl.className = "carousel-dots";
  dotsEl.setAttribute("aria-hidden", "true");
  cards.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
    dotsEl.appendChild(dot);
  });
  grid.after(dotsEl);

  const dots = Array.from(dotsEl.querySelectorAll(".carousel-dot"));

  function updateDots() {
    const scrollLeft = grid.scrollLeft;
    const cardWidth = cards[0].offsetWidth + 12; // gap = 12px
    const index = Math.round(scrollLeft / cardWidth);
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  grid.addEventListener("scroll", updateDots, { passive: true });
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

// Product image thumbnails shown under the maintenance slider. They open the
// matching product page when tapped.
// Column count for the product grid: one column per product up to 4, so 3
// products read as a single 3-wide row and 8 wrap into a 2x4 grid.
function sliderProductsColsClass(products) {
  const cols = Math.min((products || []).length || 1, 4);
  return `slider-products--cols-${cols}`;
}

// For the maintenance slider: "Some is fine" highlights a lightweight starter
// trio, "All of it" highlights everything, and "I'd rather not" highlights none.
function maintenanceActiveProductIds(optionValue) {
  if (optionValue === "medium") {
    return new Set(["hair-oil", "gel", "sea-salt-spray"]);
  }
  if (optionValue === "high") {
    return null; // null means all products are active/visible.
  }
  if (optionValue === "low") {
    return new Set();
  }
  return null;
}

function sliderProductsHtml(products, activeIds) {
  return (products || []).map((product) => {
    const src = (product.images && product.images[0]) || "";
    const isActive = !activeIds || activeIds.has(product.id);
    return `
      <a class="slider-product${isActive ? "" : " is-greyed"}" href="?product=${product.id}" data-product="${product.id}">
        <span class="slider-product-thumb">
          ${src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(product.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
        </span>
        <span class="slider-product-name">${escapeHtml(product.name)}</span>
      </a>
    `;
  }).join("");
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
  // Always show the full product catalog in the final maintenance question.
  const allProducts = PRODUCT_LIST
    .slice()
    .sort((a, b) => a.name.length - b.name.length);
  const activeIds = maintenanceActiveProductIds(hasSelection ? regularOptions[selectedIndex].value : null);

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
      <p class="slider-product-hint">Tap a product to learn more about it</p>
      <div class="slider-products ${sliderProductsColsClass(allProducts)}">${sliderProductsHtml(allProducts, activeIds)}</div>
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
  const productsDiv = document.querySelector(".slider-products");

  // Make the (possibly pre-selected) answer's product thumbnails tappable.
  if (productsDiv) wireProductLinks(productsDiv);

  if (slider) {
    slider.addEventListener("input", () => {
      const option = regularOptions[parseInt(slider.value, 10)];
      if (option && display) {
        display.textContent = option.label;
        display.classList.remove("is-placeholder");
        const activeIds = maintenanceActiveProductIds(option.value);
        if (productsDiv) {
          productsDiv.querySelectorAll(".slider-product").forEach((el) => {
            el.classList.toggle("is-greyed", activeIds ? !activeIds.has(el.dataset.product) : false);
          });
        }
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

function applyTextSearch(styles) {
  const q = normalizeSearchText(state.searchQuery);
  if (!q) return styles;
  const tokens = q.split(/[\s,]+/).filter(Boolean);
  return styles.filter((style) => {
    const haystack = styleHaystack(style);
    return tokens.every((token) => haystack.includes(token));
  });
}

function applyRefineFilters(styles) {
  const faceShapes = state.refineFilters.face_shape;
  if (faceShapes.size > 0) {
    styles = styles.filter((style) => faceShapes.has(style.faceShape));
  }

  const hairColours = state.refineFilters.hair_colour;
  if (hairColours.size > 0) {
    styles = styles.filter((style) => hairColours.has(hairColourKey(style.hairColour)));
  }

  const thickness = state.refineFilters.thickness;
  if (thickness) {
    styles = styles.filter((style) => style.hairThickness === thickness);
  }

  return styles;
}

function refinePillLabel(filter) {
  const val = state.refineFilters[filter.id];
  if (filter.id === "thickness") {
    return val ? titleCase(val) : filter.label;
  }
  if (val.size === 0) return filter.label;
  if (val.size === 1) {
    const v = [...val][0];
    return filter.options.find((o) => o.value === v)?.label || titleCase(v);
  }
  return `${val.size} ${filter.noun}s`;
}

function refineHasSelection(filter) {
  const val = state.refineFilters[filter.id];
  return filter.id === "thickness" ? val !== null : val.size > 0;
}

function renderRefineRow() {
  const open = state.openRefineFilter;
  const openFilter = open ? REFINE_FILTERS.find((f) => f.id === open) : null;
  return `
    <div class="refine-filters">
      <div class="refine-row">
        ${REFINE_FILTERS.map((filter) => {
          const hasSelection = refineHasSelection(filter);
          const isOpen = open === filter.id;
          return `
            <button
              class="refine-pill${hasSelection ? " is-active" : ""}${isOpen ? " is-open" : ""}"
              type="button"
              data-refine="${escapeAttr(filter.id)}"
              aria-expanded="${isOpen}"
            >${hasSelection ? escapeHtml(refinePillLabel(filter)) : `✧ Specify a <b>${escapeHtml(filter.noun)}</b>`}</button>
          `;
        }).join("")}
      </div>
      ${openFilter ? `
        <div class="refine-panel">
          <p class="refine-question">${escapeHtml(openFilter.question)}</p>
          <div class="refine-options">
            ${openFilter.options.map((option) => {
              const val = state.refineFilters[openFilter.id];
              const isOn = openFilter.id === "thickness"
                ? val === option.value
                : val.has(option.value);
              return `
                <button
                  class="refine-option${isOn ? " is-on" : ""}"
                  type="button"
                  data-refine-select="${escapeAttr(openFilter.id)}"
                  data-refine-value="${escapeAttr(option.value)}"
                >${escapeHtml(option.label)}</button>
              `;
            }).join("")}
          </div>
        </div>
      ` : ""}
    </div>
  `;
}

function renderResultsPage() {
  const filtered = selectedAnswerCount() ? answerFilteredStyles() : state.styles;
  const textFiltered = applyTextSearch(filtered);
  const refined = applyRefineFilters(textFiltered);
  const results = scoredStyles(refined);
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

      ${state.filterPanelOpen ? renderAnswerFilterDrawer(selectedCount) : ""}

      ${renderRefineRow()}

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
  const options = preferenceOptions(question);
  return `
    <div class="preference-menu" role="menu" aria-label="${escapeAttr(shortQuestionLabel(question.id))} preferences">
      <p>${escapeHtml(question.title)}</p>
      ${options.map((option) => renderPreferenceOption(question, option, isQuizOptionSelected(question, option, selected))).join("")}
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
  document.querySelectorAll("[data-refine]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const filterId = button.dataset.refine;
      state.openRefineFilter = state.openRefineFilter === filterId ? null : filterId;
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView();
    });
  });
  document.querySelectorAll("[data-refine-select][data-refine-value]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const filterId = button.dataset.refineSelect;
      const value = button.dataset.refineValue;
      if (filterId === "thickness") {
        state.refineFilters.thickness = state.refineFilters.thickness === value ? null : value;
      } else {
        const set = state.refineFilters[filterId];
        if (set.has(value)) set.delete(value);
        else set.add(value);
      }
      renderCurrentDiscoveryView();
    });
  });
  const discoveryScreen = $(".results-screen");
  if (discoveryScreen) {
    discoveryScreen.addEventListener("click", () => {
      if (!state.openPreferenceMenu && !state.openRefineFilter) return;
      state.openPreferenceMenu = null;
      state.openRefineFilter = null;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  }
}

function renderCurrentDiscoveryView({ preserveFilterScroll = false } = {}) {
  const panel = $(".answer-filter-panel");
  const scrollTop = preserveFilterScroll && panel ? panel.scrollTop : null;
  const refineRow = $(".refine-row");
  const refineScrollLeft = refineRow ? refineRow.scrollLeft : 0;
  renderResultsPage();
  if (scrollTop !== null) {
    const nextPanel = $(".answer-filter-panel");
    if (nextPanel) nextPanel.scrollTop = scrollTop;
  }
  if (refineScrollLeft > 0) {
    const nextRefineRow = $(".refine-row");
    if (nextRefineRow) nextRefineRow.scrollTo({ left: refineScrollLeft, behavior: "instant" });
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
  const options = preferenceOptions(question);
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
        ${options.map((option) => renderFilterOption(question, option, selected.includes(option.value))).join("")}
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

// ---------- My style brief ----------
// A working mood board the user assembles for their stylist, split into two
// partitions so they can separate themselves from their inspiration:
//   - "me"          photos of the user's own hair
//   - "references"  styles on other people (uploads or saved gallery favourites)
// Every item is classified with the same rubric (a 5-star rating and free-text
// notes). Photos are added straight into a partition via that partition's own
// add tile, so the source of the upload decides where it lands.
// The brief lives in localStorage so it survives reloads, and is mirrored to the
// backend (debounced) so the owner can share a link that a stylist can review.
function setBrief(next) {
  state.brief = next;
  writeStored(BRIEF_KEY, next);
  updateBriefCount();
  scheduleBriefSync();
}

// Colour & consultation info (colour treatment, allergies, previous treatments,
// damage, general notes). Persisted alongside the brief items and synced so it
// reaches the stylist who opens the share link.
function setBriefDetails(next) {
  state.briefDetails = next;
  writeStored(BRIEF_DETAILS_KEY, next);
  scheduleBriefSync();
}

function updateBriefDetail(key, value) {
  setBriefDetails({ ...state.briefDetails, [key]: value });
  refreshShareButton();
}

// A brief is worth sharing once it has any item, a colour treatment other than
// the default, or any consultation notes filled in.
function briefHasContent() {
  if (state.brief.length) return true;
  const d = state.briefDetails || {};
  if (d.colour && d.colour !== NO_COLOUR_TREATMENT) return true;
  return Boolean(
    String(d.allergies || "").trim() ||
    String(d.previousTreatments || "").trim() ||
    String(d.damage || "").trim() ||
    String(d.notes || "").trim()
  );
}

function refreshShareButton() {
  const btn = $("#brief-share-btn");
  if (btn) btn.disabled = !briefHasContent();
}

// ---------- Sharing the brief ----------
// Every edit auto-saves to the server so the share link always reflects the
// latest state ("live brief"). Saves are debounced to avoid a request per
// keystroke; the server upserts by session so the share id (link) stays stable.
let briefSyncTimer = null;
let briefSyncInFlight = false;
let briefSyncQueued = false;

function scheduleBriefSync() {
  if (briefSyncTimer) clearTimeout(briefSyncTimer);
  briefSyncTimer = setTimeout(() => {
    briefSyncTimer = null;
    syncBrief();
  }, 800);
}

async function syncBrief() {
  if (briefSyncInFlight) {
    briefSyncQueued = true;
    return null;
  }
  briefSyncInFlight = true;
  try {
    const data = await apiJson(API.briefs, {
      method: "POST",
      body: JSON.stringify({ sessionId: state.sessionId, items: state.brief, details: state.briefDetails })
    });
    if (data.item?.id && data.item.id !== state.briefId) {
      state.briefId = data.item.id;
      writeStored(BRIEF_ID_KEY, state.briefId);
    }
    return data.item;
  } catch {
    return null;
  } finally {
    briefSyncInFlight = false;
    if (briefSyncQueued) {
      briefSyncQueued = false;
      syncBrief();
    }
  }
}

// Force a save (flushing any pending debounce) and return the share id. Used by
// the Share button so the link reflects the very latest edits before copying.
async function flushBriefSync() {
  if (briefSyncTimer) {
    clearTimeout(briefSyncTimer);
    briefSyncTimer = null;
  }
  await syncBrief();
  return state.briefId;
}

function briefShareLink() {
  if (!state.briefId) return "";
  return `${window.location.origin}/?brief=${encodeURIComponent(state.briefId)}`;
}

async function handleBriefShare() {
  setShareStatus("Saving…");
  let id = state.briefId;
  try {
    id = await flushBriefSync();
  } catch {
    id = state.briefId;
  }
  if (!id) {
    setShareStatus("Couldn't create a link. Check your connection and try again.");
    return;
  }
  const link = briefShareLink();
  let copied = false;
  try {
    await navigator.clipboard.writeText(link);
    copied = true;
  } catch {
    copied = false;
  }
  setShareStatus(copied ? "Link copied to clipboard." : link, link);
}

function setShareStatus(message, link = "") {
  state.shareStatus = message;
  const node = $("#brief-share-status");
  if (node) {
    node.textContent = message;
    node.hidden = !message;
    if (link) node.dataset.link = link;
  }
}

// ---------- Reviewing a shared brief (read-only + feedback) ----------
// When the app is opened with a foreign ?brief=<id>, it loads that brief from
// the server. The reviewer can read the owner's photos, ratings and notes, and
// leave their own feedback per item.
async function loadSharedBrief(id) {
  state.sharedBrief = null;
  state.sharedBriefError = false;
  if (state.view === "shared") render();
  try {
    const data = await apiJson(`${API.briefs}/${encodeURIComponent(id)}`);
    state.sharedBrief = data.item || null;
    state.sharedBriefError = !state.sharedBrief;
  } catch {
    state.sharedBriefError = true;
  }
  if (state.view === "shared") render();
}

function renderStaticStars(rating) {
  const value = Number(rating) || 0;
  if (!value) return "";
  return `
    <div class="brief-stars brief-stars--static" role="img" aria-label="Rated ${value} out of 5">
      ${[1, 2, 3, 4, 5].map((n) => `<span class="brief-star ${n <= value ? "is-on" : ""}" aria-hidden="true">${iconStar()}</span>`).join("")}
    </div>
  `;
}

// Read-only colour & consultation readout for the reviewer. Shows any field the
// client filled in; colour always shows since the default is still useful.
function renderBriefDetailsReview(details) {
  const d = details || {};
  const rows = [
    ["Colour treatment", d.colour || NO_COLOUR_TREATMENT],
    ["Allergies or sensitivities", d.allergies],
    ["Previous colour treatments", d.previousTreatments],
    ["Damage or breakage", d.damage],
    ["General notes", d.notes]
  ].filter(([, value]) => value && String(value).trim());

  if (!rows.length) return "";

  return `
    <section class="brief-details brief-details--review">
      <div class="brief-partition-head">
        <p class="eyebrow">Colour &amp; care</p>
        <h2>Colour &amp; consultation</h2>
      </div>
      <dl class="brief-details-readout">
        ${rows.map(([label, value]) => `
          <div class="brief-detail-row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(String(value))}</dd>
          </div>
        `).join("")}
      </dl>
    </section>
  `;
}

// Read-only card: the client's photo with their own rating and note. The stylist
// no longer comments per photo — feedback is a single high-level summary below.
function renderSharedItem(item) {
  return `
    <article class="brief-card brief-card--review">
      <div class="brief-card-image">
        ${item.imageUrl
          ? `<img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.name || "Reference image")}" loading="lazy" referrerpolicy="no-referrer">`
          : `<span>${escapeHtml(item.name || "Reference")}</span>`}
      </div>
      <div class="brief-card-body">
        ${renderStaticStars(item.rating)}
        ${item.annotation ? `<p class="brief-owner-note">${escapeHtml(item.annotation)}</p>` : `<p class="brief-owner-note brief-owner-note--empty">No notes from the client.</p>`}
      </div>
    </article>
  `;
}

// One high-level summary for the whole brief: any previously-left comments,
// plus a single box for the stylist to add their overall feedback.
function renderStylistSummary() {
  const comments = state.sharedBrief?.feedback || [];
  const list = comments.length
    ? `<ul class="brief-feedback-list">
        ${comments.map((entry) => `
          <li class="brief-feedback-entry">
            <div class="brief-feedback-meta">
              <span class="brief-feedback-author">${escapeHtml(entry.author || "Reviewer")}</span>
            </div>
            ${entry.note ? `<p class="brief-feedback-note">${escapeHtml(entry.note)}</p>` : ""}
          </li>
        `).join("")}
      </ul>`
    : "";
  return `
    <section class="brief-summary">
      <div class="brief-partition-head">
        <p class="eyebrow">Stylist</p>
        <h2>Overall feedback</h2>
        <p class="brief-partition-copy">Leave a high-level summary of your thoughts for the client.</p>
      </div>
      ${list}
      <form class="brief-feedback-form brief-summary-form" id="brief-summary-form">
        <textarea class="brief-annotation" id="brief-summary-note" rows="4" placeholder="Share your overall thoughts on this brief…"></textarea>
        <button class="primary-btn brief-feedback-submit" type="submit">Add feedback</button>
      </form>
    </section>
  `;
}

function renderSharedBrief() {
  if (state.sharedBriefError) {
    els.app.innerHTML = `
      <section class="brief-screen brief-screen--review">
        <div class="screen-heading"><div>
          <p class="eyebrow">Style brief</p>
          <h1>Brief not found</h1>
          <p>This link may be incorrect or the brief is no longer available.</p>
        </div></div>
      </section>
    `;
    return;
  }

  if (!state.sharedBrief) {
    els.app.innerHTML = `
      <section class="brief-screen brief-screen--review">
        <div class="screen-heading"><div>
          <p class="eyebrow">Style brief</p>
          <h1>Loading brief…</h1>
        </div></div>
      </section>
    `;
    return;
  }

  const items = Array.isArray(state.sharedBrief.items) ? state.sharedBrief.items : [];
  const meItems = items.filter((item) => itemPartition(item) === "me");
  const refItems = items.filter((item) => itemPartition(item) === "references");

  els.app.innerHTML = `
    <section class="brief-screen brief-screen--review">
      <div class="screen-heading">
        <div>
          <p class="eyebrow">Style brief · for review</p>
          <h1>A client's style brief</h1>
          <p>Photos of the client's own hair and the references they love, with their ratings and notes. Leave one overall summary at the end.</p>
        </div>
        <label class="brief-reviewer-name">
          <span>Your name</span>
          <input type="text" id="reviewer-name" placeholder="e.g. Alex at the salon" value="${escapeAttr(state.reviewerName)}" maxlength="80">
        </label>
      </div>

      ${renderBriefDetailsReview(state.sharedBrief.details)}

      <div class="brief-partitions">
        <section class="brief-partition brief-partition--me">
          <div class="brief-partition-head"><h2>Their hair</h2></div>
          <div class="brief-grid">
            ${meItems.length ? meItems.map(renderSharedItem).join("") : `<p class="brief-picker-empty">No photos of their own hair.</p>`}
          </div>
        </section>

        <section class="brief-partition brief-partition--references">
          <div class="brief-partition-head">
            <p class="eyebrow">Inspiration</p>
            <h2>References</h2>
          </div>
          <div class="brief-grid">
            ${refItems.length ? refItems.map(renderSharedItem).join("") : `<p class="brief-picker-empty">No references added.</p>`}
          </div>
        </section>
      </div>

      ${renderStylistSummary()}
    </section>
  `;

  wireSharedBrief();
}

function wireSharedBrief() {
  const nameInput = $("#reviewer-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      state.reviewerName = nameInput.value;
      writeStored(REVIEWER_NAME_KEY, state.reviewerName);
    });
  }

  const summaryForm = $("#brief-summary-form");
  if (summaryForm) {
    summaryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitBriefSummary(summaryForm);
    });
  }
}

// Submit one brief-level summary comment (no rating, no per-image target).
async function submitBriefSummary(form) {
  const noteInput = $("#brief-summary-note");
  const note = noteInput ? noteInput.value.trim() : "";
  const submitBtn = form.querySelector(".brief-feedback-submit");

  if (!note) {
    form.classList.add("is-invalid");
    return;
  }
  form.classList.remove("is-invalid");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = await apiJson(`${API.briefs}/${encodeURIComponent(state.sharedBriefId)}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        author: state.reviewerName.trim() || "Reviewer",
        note
      })
    });
    if (state.sharedBrief && data.item) {
      state.sharedBrief.feedback = [...(state.sharedBrief.feedback || []), data.item];
    }
    render();
  } catch {
    if (submitBtn) submitBtn.disabled = false;
    form.classList.add("is-invalid");
  }
}

function updateBriefCount() {
  if (els.briefCount) els.briefCount.textContent = state.brief.length;
}

function briefItemId() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `brief-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Items saved before partitions existed (and any future stragglers) are treated
// as references unless explicitly marked as the user.
function itemPartition(item) {
  return item.partition === "me" ? "me" : "references";
}

function briefItemsFor(partition) {
  return state.brief.filter((item) => itemPartition(item) === partition);
}

function renderBrief() {
  const savedStyles = state.styles.filter((style) => state.favourites.has(style.id));
  const pickerOpen = state.briefPickerOpen;
  const meItems = briefItemsFor("me");
  const refItems = briefItemsFor("references");

  els.app.innerHTML = `
    <section class="brief-screen">
      <div class="screen-heading">
        <div>
          <p class="eyebrow">Design</p>
          <h1>My style brief</h1>
          <p>Gather photos of your own hair and references on other people, pull in styles you've saved, then rate and annotate each one.</p>
        </div>
        <div class="brief-share">
          <button class="primary-btn brief-share-btn" id="brief-share-btn" type="button" ${briefHasContent() ? "" : "disabled"}>
            ${iconShare()}<span>Share with stylist</span>
          </button>
          <p class="brief-share-status" id="brief-share-status" ${state.shareStatus ? "" : "hidden"}>${escapeHtml(state.shareStatus)}</p>
        </div>
      </div>

      ${pickerOpen ? renderBriefPicker(savedStyles) : ""}

      <div class="brief-partitions">
        <section class="brief-partition brief-partition--me">
          <div class="brief-partition-head">
            <h2>Your hair</h2>
          </div>
          <div class="brief-grid">
            ${meItems.map(renderBriefItem).join("")}
            ${renderBriefAddSelf()}
          </div>
        </section>

        <section class="brief-partition brief-partition--references">
          <div class="brief-partition-head">
            <p class="eyebrow">Inspiration</p>
            <h2>References</h2>
            <p class="brief-partition-copy">Looks on other people you'd like to take cues from.</p>
          </div>
          <div class="brief-grid">
            ${refItems.map(renderBriefItem).join("")}
            ${renderBriefAddRef()}
          </div>
        </section>
      </div>

      ${renderBriefDetails()}
    </section>
  `;

  wireBrief();
}

// Colour & consultation section: a searchable colour dropdown (native datalist,
// so the user can pick a shade or type their own) plus consultation prompts. All
// fields update state silently on input (no re-render) so focus is preserved.
function renderBriefDetails() {
  const d = state.briefDetails || defaultBriefDetails();
  return `
    <section class="brief-details">
      <div class="brief-partition-head">
        <p class="eyebrow">Colour &amp; care</p>
        <h2>Colour &amp; consultation</h2>
        <p class="brief-partition-copy">Tell your stylist about colour, sensitivities, and your hair's history.</p>
      </div>
      <div class="brief-details-grid">
        <label class="brief-field">
          <span>Colour treatment</span>
          <input type="text" id="brief-colour" list="brief-colour-list" autocomplete="off" placeholder="Search hair colours…" value="${escapeAttr(d.colour || "")}">
          <datalist id="brief-colour-list">
            ${HAIR_COLOUR_OPTIONS.map((c) => `<option value="${escapeAttr(c)}"></option>`).join("")}
          </datalist>
        </label>
        <label class="brief-field">
          <span>Allergies or sensitivities</span>
          <textarea id="brief-allergies" rows="2" placeholder="e.g. PPD allergy, sensitive scalp — or none">${escapeHtml(d.allergies || "")}</textarea>
        </label>
        <label class="brief-field">
          <span>Previous colour treatments</span>
          <textarea id="brief-previous" rows="2" placeholder="e.g. box dye 3 months ago, balayage last year">${escapeHtml(d.previousTreatments || "")}</textarea>
        </label>
        <label class="brief-field">
          <span>Damage or breakage</span>
          <textarea id="brief-damage" rows="2" placeholder="e.g. dry ends, breakage from bleach, heat damage">${escapeHtml(d.damage || "")}</textarea>
        </label>
        <label class="brief-field brief-field--wide">
          <span>General notes</span>
          <textarea id="brief-notes" rows="3" placeholder="Anything else you'd like your stylist to know">${escapeHtml(d.notes || "")}</textarea>
        </label>
      </div>
    </section>
  `;
}

// A placeholder tile that keeps the "Me" partition occupying at least one grid
// space when empty and lets the user add more photos of themselves. Uploads from
// here go straight into the Me partition.
function renderBriefAddSelf() {
  return `
    <label class="brief-add-self" title="Add a photo of yourself">
      <span class="brief-add-self-icon" aria-hidden="true">${iconPlus()}</span>
      <span class="brief-add-self-text">Add a photo of you</span>
      <input type="file" id="brief-self-input" accept="image/*" multiple hidden>
    </label>
  `;
}

// The matching tile for the References partition. Hovering (or focusing) it
// reveals two ways to add a reference: upload from the device, or pull one in
// from the user's saved styles.
function renderBriefAddRef() {
  return `
    <div class="brief-add-self brief-add-ref" tabindex="0" title="Add a reference">
      <span class="brief-add-self-icon" aria-hidden="true">${iconPlus()}</span>
      <span class="brief-add-self-text">Add a reference</span>
      <div class="brief-add-ref-menu">
        <label class="brief-add-ref-btn">
          Upload from device
          <input type="file" id="brief-ref-input" accept="image/*" multiple hidden>
        </label>
        <button class="brief-add-ref-btn" type="button" id="brief-ref-saved">Add from saved</button>
      </div>
    </div>
  `;
}

function renderBriefPicker(savedStyles) {
  const inBrief = new Set(state.brief.map((item) => item.styleId).filter(Boolean));
  return `
    <div class="brief-picker">
      <div class="brief-picker-head">
        <p>Add from your saved styles</p>
        <button class="text-btn" id="brief-picker-close" type="button">Done</button>
      </div>
      ${savedStyles.length ? `
        <div class="brief-picker-grid">
          ${savedStyles.map((style) => {
            const added = inBrief.has(style.id);
            return `
              <button
                class="brief-picker-item ${added ? "is-added" : ""}"
                type="button"
                data-brief-add-saved="${escapeAttr(style.id)}"
                ${added ? "disabled" : ""}
                aria-label="${added ? "Already in brief" : "Add to brief"}: ${escapeAttr(style.name)}"
              >
                <span class="brief-picker-thumb">
                  ${style.imageUrl ? `<img src="${escapeAttr(style.imageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
                </span>
                <span class="brief-picker-name">${escapeHtml(style.name)}</span>
                <span class="brief-picker-flag">${added ? "Added" : "Add"}</span>
              </button>
            `;
          }).join("")}
        </div>
      ` : `<p class="brief-picker-empty">No saved styles yet. Save styles from search or results and they'll show up here.</p>`}
    </div>
  `;
}

function renderBriefStars(item) {
  const rating = Number(item.rating) || 0;
  return `
    <div class="brief-stars" role="group" aria-label="Rate this look out of 5">
      ${[1, 2, 3, 4, 5].map((n) => `
        <button
          class="brief-star ${n <= rating ? "is-on" : ""}"
          type="button"
          data-brief-star="${escapeAttr(item.id)}"
          data-star-value="${n}"
          aria-label="${n} star${n > 1 ? "s" : ""}"
          aria-pressed="${n <= rating}"
        >${iconStar()}</button>
      `).join("")}
    </div>
  `;
}

function renderBriefItem(item) {
  const notePlaceholder = itemPartition(item) === "references"
    ? "What did you like about this?"
    : "Is this your hair currently? A past style you liked?";
  return `
    <article class="brief-card" data-brief-id="${escapeAttr(item.id)}">
      <div class="brief-card-image">
        ${item.imageUrl
          ? `<img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.name || "Reference image")}" loading="lazy" referrerpolicy="no-referrer">`
          : `<span>${escapeHtml(item.name || "Reference")}</span>`}
        <button class="brief-remove-btn" type="button" data-brief-remove="${escapeAttr(item.id)}" aria-label="Remove from brief">&times;</button>
      </div>
      <div class="brief-card-body">
        ${renderBriefStars(item)}
        <label class="brief-annotation-label">
          <span>Notes</span>
          <textarea
            class="brief-annotation"
            data-brief-note="${escapeAttr(item.id)}"
            rows="2"
            placeholder="${escapeAttr(notePlaceholder)}"
          >${escapeHtml(item.annotation || "")}</textarea>
        </label>
      </div>
    </article>
  `;
}

function wireBrief() {
  const shareBtn = $("#brief-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", handleBriefShare);
  }
  // Colour & consultation fields update state silently (no re-render) so the
  // input keeps focus while the user types or searches the colour list.
  const detailFields = [
    ["brief-colour", "colour"],
    ["brief-allergies", "allergies"],
    ["brief-previous", "previousTreatments"],
    ["brief-damage", "damage"],
    ["brief-notes", "notes"]
  ];
  detailFields.forEach(([id, key]) => {
    const node = $(`#${id}`);
    if (node) node.addEventListener("input", () => updateBriefDetail(key, node.value));
  });
  // Uploads from the "Me" tile go straight into the Me partition.
  const selfInput = $("#brief-self-input");
  if (selfInput) {
    selfInput.addEventListener("change", (event) => {
      handleBriefUpload(event.target.files, "me");
      event.target.value = "";
    });
  }
  // The References tile's "Upload from device" option files into References.
  const refInput = $("#brief-ref-input");
  if (refInput) {
    refInput.addEventListener("change", (event) => {
      handleBriefUpload(event.target.files, "references");
      event.target.value = "";
    });
  }
  const refSaved = $("#brief-ref-saved");
  if (refSaved) {
    refSaved.addEventListener("click", () => {
      state.briefPickerOpen = true;
      renderBrief();
    });
  }
  const pickerClose = $("#brief-picker-close");
  if (pickerClose) {
    pickerClose.addEventListener("click", () => {
      state.briefPickerOpen = false;
      renderBrief();
    });
  }
  document.querySelectorAll("[data-brief-add-saved]").forEach((button) => {
    button.addEventListener("click", () => addSavedToBrief(button.dataset.briefAddSaved));
  });
  document.querySelectorAll("[data-brief-remove]").forEach((button) => {
    button.addEventListener("click", () => removeBriefItem(button.dataset.briefRemove));
  });
  document.querySelectorAll("[data-brief-star]").forEach((button) => {
    button.addEventListener("click", () => {
      setBriefRating(button.dataset.briefStar, parseInt(button.dataset.starValue, 10));
    });
  });
  // Notes update state silently (no re-render) so the textarea keeps focus and
  // the caret position while the user types.
  document.querySelectorAll("[data-brief-note]").forEach((area) => {
    area.addEventListener("input", () => updateBriefNote(area.dataset.briefNote, area.value));
  });
}

function addSavedToBrief(styleId) {
  const style = state.styles.find((item) => item.id === String(styleId));
  if (!style) return;
  if (state.brief.some((item) => item.styleId === style.id)) return;
  const item = {
    id: briefItemId(),
    source: "saved",
    styleId: style.id,
    imageUrl: style.imageUrl,
    name: style.name,
    partition: "references",
    rating: 0,
    annotation: ""
  };
  setBrief([item, ...state.brief]);
  renderBrief();
}

function addBriefImage(imageUrl, name, partition) {
  const item = {
    id: briefItemId(),
    source: "upload",
    imageUrl,
    name,
    partition,
    rating: 0,
    annotation: ""
  };
  setBrief([item, ...state.brief]);
  if (state.view === "brief") renderBrief();
}

// Reads the uploaded files and files each one into the given partition ("me" or
// "references"), which is decided by the tile the upload came from.
async function handleBriefUpload(fileList, partition) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  for (const file of files) {
    try {
      const imageData = await imageFileToDataUrl(file);
      addBriefImage(imageData, file.name, partition);
    } catch {
      // Skip files that can't be read as an image.
    }
  }
}

function removeBriefItem(id) {
  setBrief(state.brief.filter((item) => item.id !== id));
  renderBrief();
}

// The 5-star rating is optional: clicking the star that already marks the
// current rating clears it back to unrated.
function setBriefRating(id, value) {
  setBrief(state.brief.map((item) => {
    if (item.id !== id) return item;
    return { ...item, rating: item.rating === value ? 0 : value };
  }));
  renderBrief();
}

function updateBriefNote(id, value) {
  setBrief(state.brief.map((item) => (item.id === id ? { ...item, annotation: value } : item)));
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
  const maintenanceText = style.maintenance;
  els.detailMaintenance.innerHTML = linkifyProducts(escapeHtml(maintenanceText));

  // The chips mirror exactly the products highlighted in the text above, in the
  // same reading order, so the two lists always stay consistent.
  const products = productsInText(maintenanceText);
  if (products.length) {
    els.detailProducts.innerHTML = products.map((product) => `
      <a class="product-chip" href="?product=${product.id}" data-product="${product.id}">
        <span class="product-chip-name">${escapeHtml(product.name)}</span>
        <span class="product-chip-go" aria-hidden="true">${iconArrow()}</span>
      </a>
    `).join("");
    els.detailProductsSection.hidden = false;
  } else {
    els.detailProducts.innerHTML = "";
    els.detailProductsSection.hidden = true;
  }
  wireProductLinks(els.detailOverlay);

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

// ---------- Hair product pages ----------
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Turns product mentions inside already-escaped HTML-safe text into links that
// open the matching product popup. Each product is linked at most once.
function linkifyProducts(safeText) {
  let result = safeText;
  const linked = new Set();
  // Longer phrases first so "curl cream" wins over a bare "cream"-style alias.
  const terms = PRODUCT_LIST
    .flatMap((product) => product.matchTerms.map((term) => ({ product, term })))
    .sort((a, b) => b.term.length - a.term.length);

  for (const { product, term } of terms) {
    if (linked.has(product.id)) continue;
    const re = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "i");
    if (!re.test(result)) continue;
    result = result.replace(re, `<a class="product-link" href="?product=${product.id}" data-product="${product.id}">$1</a>`);
    linked.add(product.id);
  }

  return result;
}

// Returns the products mentioned in a piece of text, in the order they first
// appear. Uses the same term matching as linkifyProducts, so the chips shown in
// the popup are exactly the products highlighted in the description.
function productsInText(text) {
  const matches = [];
  for (const product of PRODUCT_LIST) {
    let firstIndex = -1;
    for (const term of product.matchTerms) {
      const match = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").exec(text);
      if (match && (firstIndex === -1 || match.index < firstIndex)) firstIndex = match.index;
    }
    if (firstIndex !== -1) matches.push({ product, index: firstIndex });
  }
  return matches.sort((a, b) => a.index - b.index).map((entry) => entry.product);
}

// A labelled image frame. The placeholder caption shows until a real photo is
// dropped in at the product's image path (a missing image removes the <img>).
function productPhoto(src, label, extraClass = "") {
  return `
    <figure class="product-photo ${extraClass}">
      <div class="product-photo-frame">
        ${src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
        <span class="product-photo-placeholder">${escapeHtml(label)}</span>
      </div>
      <figcaption>${escapeHtml(label)}</figcaption>
    </figure>
  `;
}

// Opens the product popup. It can sit on top of the hairstyle popup it was
// launched from, so closing it reveals the hairstyle again.
function openProduct(id) {
  const product = PRODUCTS[id];
  if (!product) return;
  currentProductId = product.id;

  els.productName.textContent = product.name;
  els.productDescription.textContent = product.description;
  els.productPhotos.innerHTML = (product.images || []).map((src, index) =>
    productPhoto(src, index === 0 ? "Product photo" : "Another angle")
  ).join("");

  if (Array.isArray(product.howToUse) && product.howToUse.length) {
    els.productHowto.innerHTML = product.howToUse.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    els.productHowtoSection.hidden = false;
  } else {
    els.productHowto.innerHTML = "";
    els.productHowtoSection.hidden = true;
  }

  els.productTransition.innerHTML = productPhoto(product.after, "Result");

  els.productOverlay.hidden = false;
  els.productOverlay.scrollTop = 0;
  document.body.style.overflow = "hidden";
}

function closeProduct() {
  els.productOverlay.hidden = true;
  currentProductId = null;
  // The hairstyle or favourites popup may still be open underneath.
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden) document.body.style.overflow = "";
}

// Wires product links inside a given scope to open the product popup instead of
// doing a full navigation.
function wireProductLinks(scope = document) {
  scope.querySelectorAll("[data-product]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openProduct(link.dataset.product);
    });
  });
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
    if (state.view !== "results") setView("results");
  });
  els.topbarSearchInput.addEventListener("input", (event) => {
    state.searchQuery = event.target.value;
    if (state.view !== "results") {
      setView("results");
      return;
    }
    renderResultsPage();
  });
  els.favouritesBtn.addEventListener("click", () => {
    renderFavourites();
    els.favouritesOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  });
  els.briefBtn.addEventListener("click", () => setView("brief"));

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

  els.closeProduct.addEventListener("click", closeProduct);
  els.productOverlay.addEventListener("click", (event) => {
    if (event.target === els.productOverlay) closeProduct();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    // The product popup can sit on top of the others, so close it first.
    if (!els.productOverlay.hidden) closeProduct();
    else if (!els.detailOverlay.hidden) closeDetail();
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
    } else if (event.state?.view === "results") {
      state.view = "results";
      state.previousView = event.state.previousView ?? "welcome";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    } else if (event.state?.view === "brief") {
      state.view = "brief";
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
  } else if (urlParams.has("search") || urlParams.has("results")) {
    state.view = "results";
    writeStored(VIEW_KEY, "results");
  } else if (urlParams.get("brief") && urlParams.get("brief") !== state.briefId) {
    // A shared link to someone else's brief: open it read-only for review.
    state.view = "shared";
    state.sharedBriefId = urlParams.get("brief");
  } else if (urlParams.has("brief")) {
    state.view = "brief";
    writeStored(VIEW_KEY, "brief");
  } else {
    state.view = "welcome";
    writeStored(VIEW_KEY, "welcome");
  }

  render();
  loadGallery();
  loadFavourites();
  if (state.view === "shared") loadSharedBrief(state.sharedBriefId);
}

init();
