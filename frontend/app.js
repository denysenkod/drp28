// ---------- API + persistent session ----------
const API = {
  gallery: "/api/gallery",
  favorites: "/api/favorites",
  userPhotos: "/api/user-photos"
};

const SESSION_KEY = "drp28.frontend.sessionId";

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

// ---------- Data ----------
const LABEL_OPTIONS = [
  "classic", "edgy", "bold", "sleek", "effortless",
  "fringe", "buzz cut", "crop", "mullet", "shag",
  "side part", "centre part", "short", "medium", "long",
  "straight", "wavy", "curly", "low maintenance"
];

const CATEGORIES = ["Fringe", "Buzz cut", "Crop", "Mullet", "Shag", "Side part", "Long styles"];

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

function getGroupKey(item) {
  const features = Array.isArray(item.features) ? item.features : [];
  const styleFeature = features.find((feature) => !["gq", "mens-hair-trends"].includes(feature));
  if (styleFeature) return styleFeature;
  return slugWords(item.title || item.name).replace(/\s+/g, "-");
}

function inferLength(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  if (/(buzz|crop|crew|edgar|afro|pixie|bob)/.test(text)) return "Short";
  if (/(sweep|grow out|wall street|art dealer|beard|long)/.test(text)) return "Long";
  return "Medium";
}

function inferHairType(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  if (/(afro|curl|curly|coily)/.test(text)) return "Curly Hair";
  if (/(wave|wavy|shag|mullet|fringe|grow out|sweep)/.test(text)) return "Wavy Hair";
  return "Straight Hair";
}

function inferMaintainability(title, length) {
  const text = slugWords(title);
  if (/(buzz|crew|crop|afro)/.test(text)) return 2;
  if (/(frosted|dyed|mullet|rockstar|rat tail)/.test(text)) return 4;
  if (length === "Long") return 3;
  return 3;
}

function inferLabels(title, features = []) {
  const text = `${slugWords(title)} ${features.join(" ")}`;
  const labels = [];
  const checks = [
    ["classic", /(classic|centre|side|wall street|crew)/],
    ["edgy", /(edgar|mullet|shag|mod|rockstar|rat tail|tiktok)/],
    ["bold", /(buzz|dyed|frosted|mullet|edgar|afro)/],
    ["sleek", /(crop|buzz|crew|side|centre)/],
    ["effortless", /(grow out|fringe|sweep)/],
    ["fringe", /(fringe|curtain)/],
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
    ? "Keep the outline clean with a trim every 3-5 weeks. Use a small amount of matte paste or cream to control shape without making it stiff."
    : "Refresh the shape every 6-8 weeks. Dry with fingers or a vent brush first, then add light texture or smoothing product only where needed.";

  return {
    maintenance: description || maintenance,
    products: low
      ? ["Matte styling paste", "Light hold cream", "Daily shampoo or scalp rinse"]
      : ["Texture spray", "Heat protectant", "Lightweight finishing cream"],
    hairdressers: low
      ? ["Barber confident with scissor-over-comb", "Stylist comfortable with short textured cuts"]
      : ["Stylist experienced with layered shape", "Salon comfortable with texture and face-framing"],
    barber: `Ask for ${title.toLowerCase()} with a ${length.toLowerCase()} overall length and a finish that works with ${hairType.toLowerCase()}. Bring the reference image and ask them to keep the silhouette close while adapting it to your hair density and growth pattern.`
  };
}

function galleryItemToStyle(item, index) {
  const title = item.title || item.name || `Style ${index + 1}`;
  const features = Array.isArray(item.features) ? item.features : [];
  const length = inferLength(title, features);
  const hairType = inferHairType(title, features);
  const detail = detailsForStyle(title, length, hairType, item.description || "");

  return {
    id: String(item.id || `style-${index + 1}`),
    name: title,
    imageUrl: item.imageUrl || "",
    description: item.description || "",
    labels: [...new Set([...inferLabels(title, features), length.toLowerCase()])],
    hairType,
    length,
    maintainability: inferMaintainability(title, length),
    groupKey: getGroupKey(item),
    features,
    ...detail
  };
}

// ---------- State ----------
const state = {
  sessionId: getSessionId(),
  styles: FALLBACK_STYLES.map(galleryItemToStyle),
  searchQuery: "",
  activeLabels: new Set(),
  activeCategories: new Set(),
  activeDropdownFilters: {},
  favourites: new Set(),
  filtersPanelOpen: false,
  uploadedPhotoName: null
};

// ---------- DOM refs ----------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {
  searchInput:        $("#search-input"),
  uploadInput:        $("#upload-input"),
  uploadPreview:      $("#upload-preview"),
  uploadPreviewName:  $("#upload-preview-name"),
  uploadClear:        $("#upload-clear"),
  allFiltersBtn:      $("#all-filters-btn"),
  filtersPanel:       $("#filters-panel"),
  activeFilters:      $("#active-filters"),
  labelChips:         $("#label-chips"),
  categoryChips:      $("#category-chips"),
  resultsGrid:        $("#results-grid"),
  detailOverlay:      $("#detail-overlay"),
  detailImages:       $("#detail-images"),
  detailName:         $("#detail-name"),
  detailLike:         $("#detail-like"),
  detailLabels:       $("#detail-labels"),
  detailStars:        $("#detail-stars"),
  detailLength:       $("#detail-length"),
  detailHairtype:     $("#detail-hairtype"),
  detailMaintenance:  $("#detail-maintenance"),
  detailProducts:     $("#detail-products"),
  detailHairdressers: $("#detail-hairdressers"),
  detailBarber:       $("#detail-barber"),
  similarResults:     $("#similar-results"),
  similarPrev:        $("#similar-prev"),
  similarNext:        $("#similar-next"),
  closeDetail:        $("#close-detail"),
  favouritesBtn:      $("#favourites-btn"),
  favouritesOverlay:  $("#favourites-overlay"),
  favouritesGrid:     $("#favourites-grid"),
  favouritesEmpty:    $("#favourites-empty"),
  closeFavourites:    $("#close-favourites"),
  favCount:           $("#fav-count"),
  barberOverlay:      $("#barber-overlay"),
  barberStyleName:    $("#barber-style-name"),
  barberText:         $("#barber-text"),
  closeBarber:        $("#close-barber")
};

let currentDetailId = null;

// ---------- Data loading ----------
async function loadGallery() {
  try {
    const data = await apiJson(API.gallery);
    if (Array.isArray(data.items) && data.items.length > 0) {
      state.styles = data.items.map(galleryItemToStyle);
      renderResults();
      if (!els.favouritesOverlay.hidden) renderFavourites();
    }
  } catch {
    // Keep bundled fallback styles when the API is unavailable.
  }
}

async function loadFavourites() {
  try {
    const data = await apiJson(`${API.favorites}?sessionId=${encodeURIComponent(state.sessionId)}`);
    if (Array.isArray(data.items)) {
      state.favourites = new Set(data.items.map((item) => String(item.imageId)).filter(Boolean));
      updateFavouriteCount();
      renderResults();
    }
  } catch {
    updateFavouriteCount();
  }
}

function updateFavouriteCount() {
  els.favCount.textContent = state.favourites.size;
}

// ---------- Rendering ----------
function renderLabelChips() {
  els.labelChips.innerHTML = "";
  for (const label of LABEL_OPTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "label-chip" + (state.activeLabels.has(label) ? " is-active" : "");
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (state.activeLabels.has(label)) state.activeLabels.delete(label);
      else state.activeLabels.add(label);
      renderLabelChips();
      renderActiveFilters();
      renderResults();
    });
    els.labelChips.appendChild(btn);
  }
}

function renderCategoryChips() {
  els.categoryChips.innerHTML = "";
  for (const cat of CATEGORIES) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "category-chip" + (state.activeCategories.has(cat) ? " is-active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      if (state.activeCategories.has(cat)) state.activeCategories.delete(cat);
      else state.activeCategories.add(cat);
      renderCategoryChips();
      renderActiveFilters();
      renderResults();
    });
    els.categoryChips.appendChild(btn);
  }
}

function renderActiveFilters() {
  els.activeFilters.innerHTML = "";

  const items = [];
  for (const label of state.activeLabels) items.push({ kind: "label", value: label });
  for (const cat of state.activeCategories) items.push({ kind: "category", value: cat });
  for (const [k, v] of Object.entries(state.activeDropdownFilters)) {
    if (v) items.push({ kind: "dropdown", key: k, value: v });
  }

  for (const item of items) {
    const chip = document.createElement("span");
    chip.className = "active-filter-chip";
    chip.innerHTML = `${item.value} <span class="x" aria-label="Remove">x</span>`;
    chip.querySelector(".x").addEventListener("click", () => {
      if (item.kind === "label") state.activeLabels.delete(item.value);
      else if (item.kind === "category") state.activeCategories.delete(item.value);
      else if (item.kind === "dropdown") {
        delete state.activeDropdownFilters[item.key];
        const sel = document.querySelector(`select[data-filter="${item.key}"]`);
        if (sel) sel.value = "";
      }
      renderLabelChips();
      renderCategoryChips();
      renderActiveFilters();
      renderResults();
    });
    els.activeFilters.appendChild(chip);
  }
}

function styleMatches(style) {
  const haystack = [
    style.name,
    style.description,
    style.length,
    style.hairType,
    ...(style.labels || []),
    ...(style.features || [])
  ].join(" ").toLowerCase();

  const q = state.searchQuery.trim().toLowerCase();
  if (q && !haystack.includes(q)) return false;

  for (const label of state.activeLabels) {
    if (!haystack.includes(label.toLowerCase())) return false;
  }

  if (state.activeCategories.size > 0) {
    const inCat = [...state.activeCategories].some((cat) => {
      const c = cat.toLowerCase().replace(" styles", "");
      return haystack.includes(c) || (c === "fringe" && haystack.includes("curtain"));
    });
    if (!inCat) return false;
  }

  for (const [key, value] of Object.entries(state.activeDropdownFilters)) {
    if (!value) continue;
    const v = value.toLowerCase();
    if (key === "length" && style.length.toLowerCase() !== v) return false;
    if (key === "hair-type" && style.hairType.toLowerCase() !== v) return false;
    if (key !== "length" && key !== "hair-type" && !haystack.includes(v)) return false;
  }

  return true;
}

function appendImage(frame, style, label = "") {
  frame.innerHTML = "";

  if (style.imageUrl) {
    const image = document.createElement("img");
    image.src = style.imageUrl;
    image.alt = style.name;
    image.loading = "lazy";
    image.referrerPolicy = "no-referrer";
    image.addEventListener("error", () => {
      image.remove();
      frame.classList.add("image-failed");
      const fallback = document.createElement("span");
      fallback.className = "image-fallback-label";
      fallback.textContent = label || style.name;
      frame.appendChild(fallback);
    });
    frame.appendChild(image);
  } else {
    const fallback = document.createElement("span");
    fallback.className = "image-fallback-label";
    fallback.textContent = label || style.name;
    frame.appendChild(fallback);
  }
}

function buildStyleCard(style, { compact = false, showBarber = false } = {}) {
  const card = document.createElement("article");
  card.className = "style-card";
  card.dataset.id = style.id;

  const img = document.createElement("div");
  img.className = "style-card-image";
  appendImage(img, style, compact ? "" : style.name);
  card.appendChild(img);

  if (!compact) {
    const footer = document.createElement("div");
    footer.className = "style-card-footer";

    const name = document.createElement("span");
    name.className = "style-card-name";
    name.textContent = style.name;
    footer.appendChild(name);

    const actions = document.createElement("div");

    if (showBarber) {
      const barberBtn = document.createElement("button");
      barberBtn.type = "button";
      barberBtn.className = "icon-btn icon-btn-barber";
      barberBtn.textContent = "✂";
      barberBtn.setAttribute("aria-label", "What to tell the barber");
      barberBtn.title = "What to tell the barber";
      barberBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openBarber(style.id);
      });
      actions.appendChild(barberBtn);
    }

    const like = document.createElement("button");
    like.type = "button";
    like.className = "icon-btn icon-btn-heart" + (state.favourites.has(style.id) ? " is-liked" : "");
    like.textContent = state.favourites.has(style.id) ? "♥" : "♡";
    like.setAttribute("aria-label", "Save to favourites");
    like.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleFavourite(style.id);
    });
    actions.appendChild(like);

    footer.appendChild(actions);
    card.appendChild(footer);
  }

  card.addEventListener("click", () => openDetail(style.id));
  return card;
}

function renderResults() {
  els.resultsGrid.innerHTML = "";
  const matches = state.styles.filter(styleMatches);
  if (matches.length === 0) {
    const msg = document.createElement("p");
    msg.className = "empty-state";
    msg.textContent = "No styles match your filters. Try removing some.";
    els.resultsGrid.appendChild(msg);
    return;
  }
  for (const style of matches) {
    els.resultsGrid.appendChild(buildStyleCard(style));
  }
}

// ---------- Favourites ----------
async function toggleFavourite(id) {
  const imageId = String(id);
  const shouldSave = !state.favourites.has(imageId);

  if (shouldSave) state.favourites.add(imageId);
  else state.favourites.delete(imageId);

  updateFavouriteCount();
  renderResults();
  if (!els.favouritesOverlay.hidden) renderFavourites();
  if (currentDetailId === imageId) updateDetailLike(imageId);

  try {
    await apiJson(API.favorites, {
      method: shouldSave ? "POST" : "DELETE",
      body: JSON.stringify({ sessionId: state.sessionId, imageId })
    });
  } catch {
    if (shouldSave) state.favourites.delete(imageId);
    else state.favourites.add(imageId);
    updateFavouriteCount();
    renderResults();
    if (!els.favouritesOverlay.hidden) renderFavourites();
    if (currentDetailId === imageId) updateDetailLike(imageId);
  }
}

function renderFavourites() {
  els.favouritesGrid.innerHTML = "";
  const items = state.styles.filter((s) => state.favourites.has(s.id));
  els.favouritesEmpty.hidden = items.length > 0;
  for (const s of items) {
    els.favouritesGrid.appendChild(buildStyleCard(s, { showBarber: true }));
  }
}

function updateDetailLike(id) {
  const liked = state.favourites.has(id);
  els.detailLike.classList.toggle("is-liked", liked);
  els.detailLike.textContent = liked ? "♥" : "♡";
}

// ---------- Stars helper ----------
function renderStars(container, score) {
  container.innerHTML = "";
  const max = 5;
  for (let i = 1; i <= max; i++) {
    const span = document.createElement("span");
    if (i <= score) span.textContent = "★";
    else {
      span.textContent = "★";
      span.className = "star-empty";
    }
    container.appendChild(span);
  }
}

// ---------- Detail overlay ----------
function openDetail(id) {
  const style = state.styles.find((s) => s.id === String(id));
  if (!style) return;
  currentDetailId = style.id;

  if (!els.favouritesOverlay.hidden) els.favouritesOverlay.hidden = true;

  els.detailName.textContent = style.name;

  els.detailImages.innerHTML = "";
  const front = document.createElement("div");
  front.className = "detail-img";
  appendImage(front, style, "Front");
  els.detailImages.appendChild(front);
  for (let i = 0; i < 2; i++) {
    const d = document.createElement("div");
    d.className = "detail-img";
    els.detailImages.appendChild(d);
  }

  els.detailLabels.innerHTML = "";
  for (const l of style.labels) {
    const chip = document.createElement("span");
    chip.className = "detail-label-chip";
    chip.textContent = l;
    els.detailLabels.appendChild(chip);
  }

  renderStars(els.detailStars, style.maintainability);
  els.detailLength.textContent = style.length;
  els.detailHairtype.textContent = style.hairType;
  els.detailMaintenance.textContent = style.maintenance;

  els.detailProducts.innerHTML = "";
  for (const p of style.products) {
    const li = document.createElement("li");
    li.textContent = p;
    els.detailProducts.appendChild(li);
  }

  els.detailHairdressers.innerHTML = "";
  for (const h of style.hairdressers) {
    const li = document.createElement("li");
    li.textContent = h;
    els.detailHairdressers.appendChild(li);
  }

  els.detailBarber.textContent = style.barber;

  els.detailOverlay.querySelectorAll("details").forEach((d) => { d.open = false; });
  updateDetailLike(style.id);

  els.similarResults.innerHTML = "";
  const similar = state.styles.filter((s) => s.id !== style.id && (
    s.groupKey === style.groupKey ||
    s.hairType === style.hairType ||
    s.length === style.length
  ));
  for (const s of similar.slice(0, 12)) {
    els.similarResults.appendChild(buildStyleCard(s, { compact: true }));
  }

  els.detailOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  els.detailOverlay.hidden = true;
  document.body.style.overflow = "";
  currentDetailId = null;
}

// ---------- Barber overlay ----------
function openBarber(id) {
  const style = state.styles.find((s) => s.id === String(id));
  if (!style) return;
  els.barberStyleName.textContent = style.name;
  els.barberText.textContent = style.barber;
  els.barberOverlay.hidden = false;
  document.body.style.overflow = "hidden";
}

function closeBarber() {
  els.barberOverlay.hidden = true;
  if (els.favouritesOverlay.hidden && els.detailOverlay.hidden) {
    document.body.style.overflow = "";
  }
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
  return [
    ...state.activeLabels,
    ...state.activeCategories,
    ...Object.values(state.activeDropdownFilters).filter(Boolean)
  ];
}

async function handleUpload(file) {
  if (!file) return;

  state.uploadedPhotoName = file.name;
  els.uploadPreviewName.textContent = `${file.name} - saving`;
  els.uploadPreview.hidden = false;

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
    els.uploadPreviewName.textContent = `${file.name} - saved`;
  } catch {
    els.uploadPreviewName.textContent = `${file.name} - not saved`;
  }
}

function clearUpload() {
  state.uploadedPhotoName = null;
  els.uploadInput.value = "";
  els.uploadPreview.hidden = true;
}

// ---------- Wire up ----------
function init() {
  renderLabelChips();
  renderCategoryChips();
  renderActiveFilters();
  renderResults();
  updateFavouriteCount();
  loadGallery();
  loadFavourites();

  els.searchInput.addEventListener("input", (e) => {
    state.searchQuery = e.target.value;
    renderResults();
  });

  els.uploadInput.addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    handleUpload(file);
  });

  els.uploadClear.addEventListener("click", clearUpload);

  els.allFiltersBtn.addEventListener("click", () => {
    state.filtersPanelOpen = !state.filtersPanelOpen;
    els.filtersPanel.hidden = !state.filtersPanelOpen;
    els.allFiltersBtn.classList.toggle("is-open", state.filtersPanelOpen);
  });

  $$("select[data-filter]").forEach((sel) => {
    sel.addEventListener("change", () => {
      const key = sel.dataset.filter;
      state.activeDropdownFilters[key] = sel.value;
      renderActiveFilters();
      renderResults();
    });
  });

  els.closeDetail.addEventListener("click", closeDetail);
  els.detailOverlay.addEventListener("click", (e) => {
    if (e.target === els.detailOverlay) closeDetail();
  });

  els.detailLike.addEventListener("click", () => {
    if (currentDetailId == null) return;
    toggleFavourite(currentDetailId);
  });

  els.similarPrev.addEventListener("click", () => {
    els.similarResults.scrollBy({ left: -160, behavior: "smooth" });
  });
  els.similarNext.addEventListener("click", () => {
    els.similarResults.scrollBy({ left: 160, behavior: "smooth" });
  });

  els.favouritesBtn.addEventListener("click", () => {
    renderFavourites();
    els.favouritesOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  });
  els.closeFavourites.addEventListener("click", () => {
    els.favouritesOverlay.hidden = true;
    if (els.barberOverlay.hidden) document.body.style.overflow = "";
  });
  els.favouritesOverlay.addEventListener("click", (e) => {
    if (e.target === els.favouritesOverlay) {
      els.favouritesOverlay.hidden = true;
      if (els.barberOverlay.hidden) document.body.style.overflow = "";
    }
  });

  els.closeBarber.addEventListener("click", closeBarber);
  els.barberOverlay.addEventListener("click", (e) => {
    if (e.target === els.barberOverlay) closeBarber();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.barberOverlay.hidden) closeBarber();
      else if (!els.detailOverlay.hidden) closeDetail();
      else if (!els.favouritesOverlay.hidden) {
        els.favouritesOverlay.hidden = true;
        document.body.style.overflow = "";
      }
    }
  });
}

init();
