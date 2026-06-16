// ---------- API + persistent session ----------
const API = {
  gallery: "/api/gallery",
  favorites: "/api/favorites",
  userPhotos: "/api/user-photos",
  briefs: "/api/briefs",
  tryOn: "/api/try-on",
  tryOnUsage: "/api/try-on/usage"
};

const SESSION_KEY = "drp28.frontend.sessionId";
const VIEW_KEY = "drp28.frontend.view";
const ANSWERS_KEY = "drp28.frontend.answers";
const STEP_KEY = "drp28.frontend.quizStep";
const QUIZ_COMPLETE_KEY = "drp28.frontend.quizComplete";
const PREV_VIEW_KEY = "drp28.frontend.prevView";
const BRIEF_KEY = "drp28.frontend.brief";
const BRIEF_ID_KEY = "drp28.frontend.briefId";
const COMPLETED_BRIEF_IDS_KEY = "drp28.frontend.completedBriefIds";
const BRIEF_DETAILS_KEY = "drp28.frontend.briefDetails";
const BRIEF_DETAILS_OPEN_KEY = "drp28.frontend.briefDetailsOpen";
const REVIEWER_NAME_KEY = "drp28.frontend.reviewerName";
const FEED_ONBOARDING_DISMISSED_KEY = "drp28.frontend.feedOnboardingDismissed";

// Hair colour details that travel with the brief. "None" is the default and
// means the colour-treatment fields should stay out of the stylist share.
const NO_COLOUR_TREATMENT = "None";
// Each option carries a solid hex swatch shown next to its label in the
// dropdown. The field is still free-text (users can type a colour we don't
// list); a typed value only gets a swatch when it matches one of these names.
const HAIR_COLOUR_OPTIONS = [
  { name: NO_COLOUR_TREATMENT, none: true },
  { name: "Jet black", hex: "#0a0a0a" },
  { name: "Soft black", hex: "#1c1a19" },
  { name: "Darkest brown", hex: "#2a1d13" },
  { name: "Dark brown", hex: "#3b2417" },
  { name: "Medium brown", hex: "#5c3b22" },
  { name: "Light brown", hex: "#7d5333" },
  { name: "Chestnut brown", hex: "#6a3f2a" },
  { name: "Ash brown", hex: "#6f5d4e" },
  { name: "Dark blonde", hex: "#8c6a3f" },
  { name: "Medium blonde", hex: "#b08d57" },
  { name: "Light blonde", hex: "#d9bd7e" },
  { name: "Ash blonde", hex: "#c2b291" },
  { name: "Platinum blonde", hex: "#ece5d0" },
  { name: "Honey blonde", hex: "#d2a85a" },
  { name: "Strawberry blonde", hex: "#c97f4e" },
  { name: "Auburn", hex: "#7a3520" },
  { name: "Copper / ginger", hex: "#b06030" },
  { name: "Bright red", hex: "#b21e1e" },
  { name: "Burgundy", hex: "#5c1a2b" },
  { name: "Mahogany", hex: "#4a1c1c" },
  { name: "Rose gold", hex: "#d8a39a" },
  { name: "Pastel pink", hex: "#f4c2d0" },
  { name: "Hot pink", hex: "#e83e8c" },
  { name: "Lavender", hex: "#b9a7d6" },
  { name: "Purple", hex: "#6a3fa0" },
  { name: "Blue", hex: "#2f5bb7" },
  { name: "Teal", hex: "#1f8a8a" },
  { name: "Green", hex: "#2e8b57" },
  { name: "Silver / grey", hex: "#b8bcc0" },
  { name: "Highlights", hex: "#c9a76a" },
  { name: "Balayage", hex: "#b8895a" },
  { name: "Ombre", hex: "#6b4a2f" },
  { name: "Bleached / lightened", hex: "#ece0c0" },
  { name: "Other", hex: "#9aa0a6" }
];

function normalizeBriefColour(value) {
  const text = String(value || "").trim();
  const key = text.toLowerCase();
  if (!key || key === "none" || key === "natural / undyed") return NO_COLOUR_TREATMENT;
  return text;
}

function isNoColourTreatment(value) {
  return normalizeBriefColour(value) === NO_COLOUR_TREATMENT;
}

// Hex for a colour name (case-insensitive), or null if it isn't one we list.
function hairColourHex(name) {
  if (isNoColourTreatment(name)) return null;
  const key = normalizeBriefColour(name).toLowerCase();
  if (!key) return null;
  const match = HAIR_COLOUR_OPTIONS.find((c) => c.name.toLowerCase() === key);
  return match ? match.hex : null;
}

// Swatch markup for a colour. A known colour renders its solid hex square;
// anything else (blank, or a typed value we don't recognise) renders an empty
// placeholder square.
function hairColourSwatch(name) {
  if (isNoColourTreatment(name)) {
    return '<span class="hair-colour-swatch hair-colour-swatch--none" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"></circle><path d="M6.4 6.4l11.2 11.2"></path></svg></span>';
  }
  const hex = hairColourHex(name);
  if (!hex) {
    return '<span class="hair-colour-swatch hair-colour-swatch--empty" aria-hidden="true"></span>';
  }
  return `<span class="hair-colour-swatch" style="background:${escapeAttr(hex)}" aria-hidden="true"></span>`;
}

function defaultBriefDetails() {
  return {
    colour: NO_COLOUR_TREATMENT,
    allergies: "",
    previousTreatments: "",
    chemicalHistory: "",
    damage: "",
    budgetMax: 200,
    timeAtBarber: 60,
    maintenancePreference: "",
    notes: ""
  };
}

// Whether the optional hair-colour treatment section holds anything. General
// notes are intentionally excluded; they live in their own section, so they
// must not drive the colour section's auto-open/share/remove behaviour.
function briefDetailsHasContent(details = {}) {
  const d = details || {};
  if (isNoColourTreatment(d.colour)) return false;
  return ["colour", "allergies", "previousTreatments", "chemicalHistory", "damage"]
    .some((key) => Boolean(String(d[key] || "").trim()));
}

function briefNotesValue(details = state.briefDetails) {
  return String((details || {}).notes || "").trim();
}

function briefBudgetDetailsHasContent(details = state.briefDetails) {
  const d = details || {};
  const defaults = defaultBriefDetails();
  return Number(d.budgetMax ?? defaults.budgetMax) !== defaults.budgetMax
    || Number(d.timeAtBarber ?? defaults.timeAtBarber) !== defaults.timeAtBarber
    || Boolean(briefMaintenancePreferenceValue(d));
}

function briefQuizMaintenancePreference() {
  const values = typeof state !== "undefined" && Array.isArray(state.answers?.maintenance)
    ? state.answers.maintenance
    : [];
  return values.find((value) => ["Low", "Medium", "High"].includes(value)) || "";
}

function briefMaintenancePreferenceValue(details = null) {
  const d = details || (typeof state !== "undefined" ? state.briefDetails : null) || {};
  return String(d.maintenancePreference || "").trim() || briefQuizMaintenancePreference();
}

function briefDetailsShouldShare(details = {}) {
  const d = details || {};
  if (isNoColourTreatment(d.colour)) return false;
  if (typeof d.detailsOpen === "boolean") return d.detailsOpen;
  return briefDetailsHasContent(d);
}

function briefDetailsIsOpen() {
  if (isNoColourTreatment(state.briefDetails?.colour)) return false;
  if (typeof state.briefDetailsOpen === "boolean") return state.briefDetailsOpen;
  return briefDetailsHasContent(state.briefDetails);
}

function setBriefDetailsOpen(open) {
  state.briefDetailsOpen = Boolean(open);
  writeStored(BRIEF_DETAILS_OPEN_KEY, state.briefDetailsOpen);
  refreshShareButton();
  scheduleBriefSync();
}

function removeBriefDetails() {
  // Clear the colour-treatment fields only; general notes live in their own
  // section and should survive removing the colour section.
  const defaults = defaultBriefDetails();
  state.briefDetails = {
    ...defaults,
    budgetMax: state.briefDetails.budgetMax ?? defaults.budgetMax,
    timeAtBarber: state.briefDetails.timeAtBarber ?? defaults.timeAtBarber,
    maintenancePreference: state.briefDetails.maintenancePreference || "",
    notes: state.briefDetails.notes || ""
  };
  state.briefDetailsOpen = false;
  writeStored(BRIEF_DETAILS_KEY, state.briefDetails);
  writeStored(BRIEF_DETAILS_OPEN_KEY, state.briefDetailsOpen);
  refreshShareButton();
  scheduleBriefSync();
  renderBrief();
}

function briefDetailsPayload() {
  // detailsOpen tracks only the colour-treatment section; general notes ride
  // along independently so they sync even when that section is collapsed.
  const payload = briefDetailsIsOpen() && briefDetailsHasContent(state.briefDetails)
    ? { ...state.briefDetails, colour: normalizeBriefColour(state.briefDetails.colour), detailsOpen: true }
    : { detailsOpen: false };
  const notes = briefNotesValue();
  if (notes) payload.notes = notes;
  const defaults = defaultBriefDetails();
  const budgetMax = Number(state.briefDetails?.budgetMax ?? defaults.budgetMax);
  const timeAtBarber = Number(state.briefDetails?.timeAtBarber ?? defaults.timeAtBarber);
  const maintenancePreference = briefMaintenancePreferenceValue(state.briefDetails);
  if (Number.isFinite(budgetMax)) payload.budgetMax = budgetMax;
  if (Number.isFinite(timeAtBarber)) payload.timeAtBarber = timeAtBarber;
  if (maintenancePreference) payload.maintenancePreference = maintenancePreference;
  return payload;
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
    const err = new Error(data.error || "Request failed.");
    err.data = data;
    throw err;
  }
  return data;
}
