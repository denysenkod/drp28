// ---------- Hair product pages ----------
function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Turns product mentions inside already-escaped HTML-safe text into links that
// open the matching product popup. Each product is linked at most once.
function linkifyProducts(safeText) {
  let result = safeText;
  const linked = new Set();
  // Longer phrases first so "curl cream" wins over a bare "cream"-style alias.
  const terms = PRODUCT_LIST
    .flatMap((product) => product.matchTerms.map((term) => ({ product, term })))
    .sort((a, b) => b.term.length - a.term.length);

  for (const { product, term } of terms) {
    if (linked.has(product.id)) continue;
    const re = new RegExp(`\\b(${escapeRegExp(term)})\\b`, "i");
    if (!re.test(result)) continue;
    result = result.replace(re, `<a class="product-link" href="?product=${product.id}" data-product="${product.id}">$1</a>`);
    linked.add(product.id);
  }

  return result;
}

// Returns the products mentioned in a piece of text, in the order they first
// appear. Uses the same term matching as linkifyProducts, so the chips shown in
// the popup are exactly the products highlighted in the description.
function productsInText(text) {
  const matches = [];
  for (const product of PRODUCT_LIST) {
    let firstIndex = -1;
    for (const term of product.matchTerms) {
      const match = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i").exec(text);
      if (match && (firstIndex === -1 || match.index < firstIndex)) firstIndex = match.index;
    }
    if (firstIndex !== -1) matches.push({ product, index: firstIndex });
  }
  return matches.sort((a, b) => a.index - b.index).map((entry) => entry.product);
}

// A labelled image frame. The placeholder caption shows until a real photo is
// dropped in at the product's image path (a missing image removes the <img>).
function productPhoto(src, label, extraClass = "") {
  return `
    <figure class="product-photo ${extraClass}">
      <div class="product-photo-frame">
        ${src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(label)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
        <span class="product-photo-placeholder">${escapeHtml(label)}</span>
      </div>
      <figcaption>${escapeHtml(label)}</figcaption>
    </figure>
  `;
}

// Opens the product popup. It can sit on top of the hairstyle popup it was
// launched from, so closing it reveals the hairstyle again.
function openProduct(id) {
  const product = PRODUCTS[id];
  if (!product) return;
  currentProductId = product.id;

  els.productName.textContent = product.name;
  els.productDescription.textContent = product.description;
  els.productPhotos.innerHTML = (product.images || []).map((src, index) =>
    productPhoto(src, index === 0 ? "Product photo" : "Another angle")
  ).join("");

  if (Array.isArray(product.howToUse) && product.howToUse.length) {
    els.productHowto.innerHTML = product.howToUse.map((step) => `<li>${escapeHtml(step)}</li>`).join("");
    els.productHowtoSection.hidden = false;
  } else {
    els.productHowto.innerHTML = "";
    els.productHowtoSection.hidden = true;
  }

  els.productTransition.innerHTML = productPhoto(product.after, "Result");

  els.productOverlay.hidden = false;
  els.productOverlay.scrollTop = 0;
  document.body.style.overflow = "hidden";
}

function closeProduct() {
  els.productOverlay.hidden = true;
  currentProductId = null;
  // The hairstyle or favourites popup may still be open underneath.
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.tryOnOverlay.hidden) document.body.style.overflow = "";
}

// Wires product links inside a given scope to open the product popup instead of
// doing a full navigation.
function wireProductLinks(scope = document) {
  scope.querySelectorAll("[data-product]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openProduct(link.dataset.product);
    });
  });
}


