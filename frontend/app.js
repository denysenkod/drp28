// Public JavaScript entrypoint. The feature code lives in /js/* and is loaded
// sequentially so the classic-script globals keep the same execution order as
// the previous single-file app.
const FRONTEND_SCRIPT_FILES = [
  "/js/storage.js?v=2026-06-11-complete-profile",
  "/js/icons.js?v=2026-06-11-complete-profile",
  "/js/fallback-styles.js?v=2026-06-11-complete-profile",
  "/js/products-and-normalizers.js?v=2026-06-11-complete-profile",
  "/js/state.js?v=2026-06-11-complete-profile",
  "/js/data-loading.js?v=2026-06-11-complete-profile",
  "/js/quiz-filters.js?v=2026-06-11-complete-profile",
  "/js/rendering.js?v=2026-06-11-complete-profile",
  "/js/favourites.js?v=2026-06-11-complete-profile",
  "/js/brief.js?v=2026-06-11-complete-profile",
  "/js/brief-sharing.js?v=2026-06-11-complete-profile",
  "/js/shared-brief.js?v=2026-06-11-complete-profile",
  "/js/try-on.js?v=2026-06-11-complete-profile",
  "/js/detail-overlay.js?v=2026-06-11-complete-profile",
  "/js/product-overlay.js?v=2026-06-11-complete-profile",
  "/js/uploads.js?v=2026-06-11-complete-profile",
  "/js/utilities.js?v=2026-06-11-complete-profile",
  "/js/init.js?v=2026-06-11-complete-profile"
];

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.onload = resolve;
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

FRONTEND_SCRIPT_FILES
  .reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve())
  .catch((err) => {
    console.error(err);
    const app = document.querySelector("#app");
    if (app) app.innerHTML = '<p class="empty-state">Could not load HairMatch. Please refresh.</p>';
  });
