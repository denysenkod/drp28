// Public JavaScript entrypoint. The feature code lives in /js/* and is loaded
// sequentially so the classic-script globals keep the same execution order as
// the previous single-file app.
const FRONTEND_SCRIPT_FILES = [
  "/js/storage.js?v=2026-06-11-colour-inline",
  "/js/icons.js?v=2026-06-11-colour-inline",
  "/js/fallback-styles.js?v=2026-06-11-colour-inline",
  "/js/products-and-normalizers.js?v=2026-06-11-colour-inline",
  "/js/state.js?v=2026-06-11-colour-inline",
  "/js/data-loading.js?v=2026-06-11-colour-inline",
  "/js/quiz-filters.js?v=2026-06-11-colour-inline",
  "/js/rendering.js?v=2026-06-11-colour-inline",
  "/js/favourites.js?v=2026-06-11-colour-inline",
  "/js/brief.js?v=2026-06-11-colour-inline",
  "/js/brief-sharing.js?v=2026-06-11-colour-inline",
  "/js/shared-brief.js?v=2026-06-11-colour-inline",
  "/js/try-on.js?v=2026-06-11-colour-inline",
  "/js/detail-overlay.js?v=2026-06-11-colour-inline",
  "/js/product-overlay.js?v=2026-06-11-colour-inline",
  "/js/uploads.js?v=2026-06-11-colour-inline",
  "/js/utilities.js?v=2026-06-11-colour-inline",
  "/js/init.js?v=2026-06-11-colour-inline"
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
