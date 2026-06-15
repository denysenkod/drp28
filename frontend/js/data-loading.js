// ---------- Data loading ----------
async function loadGallery() {
  try {
    const data = await apiJson(API.gallery);
    if (Array.isArray(data.items)) {
      state.dbStyles = data.items.map(galleryItemToStyle);
      state.galleryLoaded = true;
      state.galleryLoadError = false;
      syncStylesForCurrentRoute();
      syncFavouriteReferencesToBrief();
      render();
      openStyleFromUrl();
      if (!els.favouritesOverlay.hidden) renderFavourites();
    }
  } catch {
    state.galleryLoaded = true;
    state.galleryLoadError = true;
    render();
    openStyleFromUrl();
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
      syncFavouriteReferencesToBrief();
    }
  } catch {
    // The local memory fallback and D1 both support this, but do not block UI if it fails.
  }
  updateFavouriteCount();
  render();
}
