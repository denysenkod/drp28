// ---------- Detail overlay ----------
function appendImage(frame, style) {
  frame.innerHTML = style.imageUrl
    ? `<img src="${style.imageUrl}" alt="${escapeAttr(style.name)}" loading="lazy" referrerpolicy="no-referrer">`
    : `<span>${escapeHtml(style.name)}</span>`;
}

function styleAttributeValue(style, key) {
  return String(style?.[key] || "").trim().toLowerCase();
}

function styleSimilarityScore(base, candidate) {
  return [
    styleAttributeValue(base, "gender") && styleAttributeValue(base, "gender") === styleAttributeValue(candidate, "gender"),
    styleAttributeValue(base, "length") && styleAttributeValue(base, "length") === styleAttributeValue(candidate, "length"),
    styleAttributeValue(base, "hairType") && styleAttributeValue(base, "hairType") === styleAttributeValue(candidate, "hairType")
  ].filter(Boolean).length;
}

function moreLikeThis(style) {
  const scored = state.styles
    .filter((item) => item.id !== style.id)
    .map((item, index) => ({ item, index, score: styleSimilarityScore(style, item) }));

  const sortBySimilarity = (a, b) => b.score - a.score || a.index - b.index;
  const closeMatches = scored.filter((entry) => entry.score >= 2).sort(sortBySimilarity);
  const fallbackMatches = scored.filter((entry) => entry.score < 2).sort(sortBySimilarity);
  return [...closeMatches, ...fallbackMatches].slice(0, 4).map((entry) => entry.item);
}

function detailShareUrl(styleId) {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("style", styleId);
  return url.toString();
}

function ensureDetailShareButton() {
  let button = $("#detail-share-style");
  if (button) return button;
  button = document.createElement("button");
  button.className = "detail-hero-btn detail-share-btn";
  button.id = "detail-share-style";
  button.type = "button";
  button.innerHTML = iconShare();
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    shareCurrentStyle();
  });
  return button;
}

function mountDetailHeroButtons(style) {
  const shareButton = ensureDetailShareButton();
  shareButton.dataset.styleId = style.id;
  shareButton.setAttribute("aria-label", `Share ${style.name}`);
  els.closeDetail.classList.add("detail-hero-btn", "detail-close-btn");
  els.detailImage.append(shareButton, els.closeDetail);
}

async function shareCurrentStyle() {
  const style = state.styles.find((item) => item.id === String(currentDetailId));
  if (!style) return;
  const url = detailShareUrl(style.id);
  const shareData = {
    title: style.name,
    text: style.name,
    url
  };
  if (typeof navigator.share === "function") {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
    }
  }
  try {
    if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(url);
    else window.prompt("Copy style link", url);
  } catch {
    window.prompt("Copy style link", url);
  }
}

function openStyleFromUrl() {
  const styleId = new URLSearchParams(window.location.search).get("style");
  if (styleId) openDetail(styleId);
}

function openDetail(id) {
  const style = state.styles.find((item) => item.id === String(id));
  if (!style) return;
  currentDetailId = style.id;

  appendImage(els.detailImage, style);
  mountDetailHeroButtons(style);
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

  const similar = moreLikeThis(style);
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
