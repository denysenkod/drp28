// ---------- Wire up ----------
function init() {
  // Top nav (desktop) and bottom nav (mobile) share the same data-nav buttons.
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.addEventListener("click", () => setView(btn.dataset.nav));
  });

  els.closeDetail.addEventListener("click", closeDetail);
  els.detailOverlay.addEventListener("click", (event) => {
    if (event.target === els.detailOverlay) closeDetail();
  });
  els.detailLike.addEventListener("click", () => {
    if (currentDetailId) toggleFavourite(currentDetailId);
  });
  els.detailTryOn.addEventListener("click", openTryOn);

  els.closeFavourites.addEventListener("click", () => {
    els.favouritesOverlay.hidden = true;
    if (els.detailOverlay.hidden && els.tryOnOverlay.hidden) document.body.style.overflow = "";
  });
  els.favouritesOverlay.addEventListener("click", (event) => {
    if (event.target === els.favouritesOverlay) {
      els.favouritesOverlay.hidden = true;
      if (els.detailOverlay.hidden && els.tryOnOverlay.hidden) document.body.style.overflow = "";
    }
  });

  els.closeProduct.addEventListener("click", closeProduct);
  els.productOverlay.addEventListener("click", (event) => {
    if (event.target === els.productOverlay) closeProduct();
  });
  els.closeTryOn.addEventListener("click", closeTryOn);
  els.tryOnOverlay.addEventListener("click", (event) => {
    if (event.target === els.tryOnOverlay) closeTryOn();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    // Stacked popups close from the highest layer down.
    if (!els.tryOnOverlay.hidden) closeTryOn();
    else if (!els.productOverlay.hidden) closeProduct();
    else if (!els.detailOverlay.hidden) closeDetail();
    else if (!els.favouritesOverlay.hidden) {
      els.favouritesOverlay.hidden = true;
      document.body.style.overflow = "";
    }
    else if (state.briefPickerOpen) closeBriefPicker();
    else if (state.briefRefAddOpen) closeBriefRefAdd();
    else if (state.view === "complete") setView("brief");
  });

  window.addEventListener("popstate", (event) => {
    if (state.briefShareSuccessOpen) {
      window.history.pushState({ view: "complete", shareSuccess: true, previousView: "brief" }, "", "?complete=sent");
      renderBriefCompletePage();
      return;
    }
    if (state.briefPickerOpen || state.briefRefAddOpen) {
      state.briefPickerOpen = false;
      state.briefRefAddOpen = false;
      if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && els.tryOnOverlay.hidden) {
        document.body.style.overflow = "";
      }
    }
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
      loadOwnerFeedback();
    } else if (event.state?.view === "complete") {
      state.view = "complete";
      state.previousView = event.state.previousView ?? "brief";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    } else if (event.state?.view === "messages") {
      state.view = "messages";
      state.previousView = event.state.previousView ?? "welcome";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
      loadOwnerFeedback();
    } else if (event.state?.view === "shared" && event.state.briefId) {
      state.view = "shared";
      state.sharedBriefId = event.state.briefId;
      state.sharedBriefClientView = Boolean(event.state.clientView);
      state.previousView = event.state.previousView ?? "messages";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
      loadSharedBrief(state.sharedBriefId);
    } else if (event.state?.view === "home" || event.state?.view === "welcome") {
      state.view = "home";
      state.previousView = event.state.previousView ?? "home";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    } else {
      // Fallback for navigation to root or unknown state
      state.view = "home";
      state.previousView = "home";
      writeStored(PREV_VIEW_KEY, state.previousView);
      render();
    }
  });

  // Initialize from URL parameters if landing from external link
  const urlParams = new URLSearchParams(window.location.search);
  const reviewBriefId = urlParams.get("brief");
  const forceReview = urlParams.get("review") === "1";
  const clientView = urlParams.get("client") === "1";
  if (urlParams.has("quiz")) {
    const step = Math.max(0, Math.min(QUIZ.length - 1, parseInt(urlParams.get("quiz"), 10) || 0));
    state.view = "quiz";
    state.quizStep = step;
    writeStored(VIEW_KEY, "quiz");
    writeStored(STEP_KEY, step);
  } else if (urlParams.has("search") || urlParams.has("results")) {
    state.view = "results";
    writeStored(VIEW_KEY, "results");
  } else if (reviewBriefId && (forceReview || clientView || reviewBriefId !== state.briefId)) {
    // Shared links open a stored brief snapshot. review=1 is the stylist
    // feedback page; client=1 is the client's read-only view from Messages.
    state.view = "shared";
    state.sharedBriefId = reviewBriefId;
    state.sharedBriefClientView = clientView && !forceReview;
  } else if (urlParams.has("complete")) {
    state.view = "complete";
    writeStored(VIEW_KEY, "complete");
  } else if (urlParams.has("brief")) {
    state.view = "brief";
    writeStored(VIEW_KEY, "brief");
  } else if (urlParams.has("messages")) {
    state.view = "messages";
    writeStored(VIEW_KEY, "messages");
  } else {
    state.view = "home";
    writeStored(VIEW_KEY, "home");
  }

  render();
  startOwnerMessageStream();
  loadGallery();
  loadFavourites();
  if (state.view === "shared") loadSharedBrief(state.sharedBriefId);
  if (state.view === "brief" || state.view === "messages") loadOwnerFeedback();
}

init();
