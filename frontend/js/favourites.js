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
  if (els.favCount) els.favCount.textContent = state.favourites.size;
}

function renderFavourites() {
  const items = state.styles.filter((style) => state.favourites.has(style.id));
  els.favouritesGrid.innerHTML = items.map((style) => buildStyleCardHtml(style)).join("");
  els.favouritesEmpty.hidden = items.length > 0;
  wireCards(els.favouritesGrid);
}

