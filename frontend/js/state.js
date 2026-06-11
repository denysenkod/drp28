// ---------- State ----------
const state = {
  sessionId: getSessionId(),
  styles: FALLBACK_STYLES.map(galleryItemToStyle),
  dbStyles: [],
  galleryLoaded: false,
  galleryLoadError: false,
  view: ((v) => (v === "search" || v === "welcome" ? (v === "search" ? "results" : "home") : v))(readStored(VIEW_KEY, "home")),
  previousView: ((v) => (v === "welcome" ? "home" : v))(readStored(PREV_VIEW_KEY, "home")),
  quizStep: readStored(STEP_KEY, 0),
  quizComplete: readStored(QUIZ_COMPLETE_KEY, false),
  answers: readStored(ANSWERS_KEY, {}),
  searchQuery: "",
  favourites: new Set(),
  brief: readStored(BRIEF_KEY, []),
  briefId: readStored(BRIEF_ID_KEY, null),
  briefDetails: { ...defaultBriefDetails(), ...readStored(BRIEF_DETAILS_KEY, {}) },
  briefDetailsOpen: readStored(BRIEF_DETAILS_OPEN_KEY, null),
  briefPickerOpen: false,
  briefRefAddOpen: false,
  briefCompletePromptOpen: false,
  shareStatus: "",
  shareLink: "",
  sharedBriefId: null,
  sharedBrief: null,
  sharedBriefError: false,
  tryOn: {
    styleId: null,
    userImageData: "",
    userImageName: "",
    sourceBriefItemId: null,
    resultImageData: "",
    status: "idle",
    error: "",
    askProfileUpdate: false
  },
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
  navButtons: document.querySelectorAll("[data-nav]"),
  favCount: $("#fav-count"),
  briefCount: $("#brief-count"),
  detailOverlay: $("#detail-overlay"),
  detailImage: $("#detail-image"),
  detailMeta: $("#detail-meta"),
  detailName: $("#detail-name"),
  detailLike: $("#detail-like"),
  detailTryOn: $("#detail-try-on"),
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
  closeProduct: $("#close-product"),
  tryOnOverlay: $("#try-on-overlay"),
  tryOnBody: $("#try-on-body"),
  closeTryOn: $("#close-try-on")
};

function setView(view) {
  // Track previous view before changing
  if (view !== state.view) {
    state.previousView = state.view;
    writeStored(PREV_VIEW_KEY, state.previousView);
  }

  if (view !== "brief") {
    state.briefPickerOpen = false;
    state.briefRefAddOpen = false;
    state.briefCompletePromptOpen = false;
    if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && els.tryOnOverlay.hidden) {
      document.body.style.overflow = "";
    }
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
  if (view === "home") {
    window.history.pushState({ view: "home", previousView: state.previousView }, "", "/");
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
  setView("home");
}

