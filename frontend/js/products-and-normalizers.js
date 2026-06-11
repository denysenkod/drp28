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
    title: "What hair texture do you like?",
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
      return ""
    },
    get options() {
      return buildLengthOptions();
    }
  },
  {
    id: "vibe",
    title: "Which looks do you like?",
    layout: "collage",
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
    label: "Specify a face shape",
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
    label: "Specify a hair colour",
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
    label: "Specify a hair thickness",
    noun: "hair density",
    question: "What is your hair density?",
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

