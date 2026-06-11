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
  if (!els.tryOnOverlay.hidden) closeTryOn();
  currentDetailId = null;
  if (els.favouritesOverlay.hidden) document.body.style.overflow = "";
}

function updateDetailLike(id) {
  const liked = state.favourites.has(id);
  els.detailLike.classList.toggle("is-saved", liked);
  els.detailLike.textContent = liked ? "Saved" : "Save style";
}

