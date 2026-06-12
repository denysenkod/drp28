// ---------- Pinterest integration ----------
function pinterestSearchQuery() {
  const typed = String(state.searchQuery || "").trim();
  if (typed) return `${typed} haircut`;

  const parts = summarizeAnswers()
    .flatMap((chip) => String(chip.value || "").split(","))
    .map((part) => part.trim())
    .filter(Boolean);
  const unique = [...new Set(parts.map((part) => part.toLowerCase()))];
  return `${unique.slice(0, 5).join(" ")} haircut hairstyle`.trim();
}

function pinterestSearchUrl() {
  const query = pinterestSearchQuery() || "haircut hairstyle ideas";
  const url = new URL("https://www.pinterest.com/search/pins/");
  url.searchParams.set("q", query);
  return url.toString();
}

function renderPinterestResultsFooter(results) {
  if (!results.length) return "";
  return `
    <section class="pinterest-results-footer" aria-label="Continue with Pinterest">
      <a class="pinterest-action pinterest-action--search" href="${escapeAttr(pinterestSearchUrl())}" target="_blank" rel="noopener noreferrer">
        <span class="pinterest-action-mark" aria-hidden="true">P</span>
        <span>Continue on Pinterest</span>
      </a>
      <button class="pinterest-action" id="pinterest-import-btn" type="button">
        <span class="pinterest-action-mark" aria-hidden="true">P</span>
        <span>Import from Pinterest</span>
      </button>
    </section>
  `;
}

function wirePinterestResultsFooter() {
  const importBtn = $("#pinterest-import-btn");
  if (importBtn) importBtn.addEventListener("click", connectPinterestAndOpen);
}

async function loadPinterestStatus() {
  try {
    const data = await apiJson(`${API.pinterest}/status`);
    state.pinterest.configured = Boolean(data.configured);
    state.pinterest.connected = Boolean(data.connected);
  } catch {
    state.pinterest.configured = false;
    state.pinterest.connected = false;
  }
}

async function connectPinterestAndOpen() {
  await loadPinterestStatus();
  if (state.pinterest.connected) {
    openPinterestOverlay();
    return;
  }

  startPinterestAuth();
}

async function startPinterestAuth() {
  state.pinterest.status = "authenticating";
  state.pinterest.error = "";
  renderPinterestOverlay();

  try {
    const data = await apiJson(`${API.pinterest}/auth/start`);
    const popup = window.open(data.authUrl, "pinterest-auth", "width=620,height=760,menubar=no,toolbar=no");
    state.pinterest.authPopup = popup;
    if (!popup) window.location.href = data.authUrl;
  } catch (err) {
    state.pinterest.status = "idle";
    state.pinterest.error = err instanceof Error ? err.message : "Could not start Pinterest.";
    openPinterestOverlay();
  }
}

function handlePinterestAuthMessage(event) {
  if (event.origin !== window.location.origin) return;
  if (!event.data || event.data.type !== "pinterest-auth") return;

  state.pinterest.authPopup = null;
  state.pinterest.connected = Boolean(event.data.ok);
  state.pinterest.error = event.data.ok ? "" : (event.data.message || "Pinterest authorization failed.");
  openPinterestOverlay();
  if (event.data.ok) loadPinterestBoards();
}

window.addEventListener("message", handlePinterestAuthMessage);

function openPinterestOverlay() {
  els.pinterestOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  renderPinterestOverlay();

  if (state.pinterest.connected && !state.pinterest.boards.length && state.pinterest.status !== "loading") {
    loadPinterestBoards();
  }
}

function closePinterestOverlay() {
  els.pinterestOverlay.hidden = true;
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && els.tryOnOverlay.hidden) {
    document.body.style.overflow = "";
  }
}

function renderPinterestOverlay() {
  if (!els.pinterestBody) return;

  const connected = state.pinterest.connected;
  const loading = state.pinterest.status === "loading" || state.pinterest.status === "authenticating";
  const selectedBoard = state.pinterest.selectedBoardId;

  els.pinterestBody.innerHTML = `
    <div class="pinterest-popup">
      <div class="overlay-heading">
        <p class="eyebrow">Pinterest</p>
        <h2>${selectedBoard ? escapeHtml(state.pinterest.selectedBoardName || "Album") : "Albums"}</h2>
      </div>

      ${state.pinterest.error ? `<p class="pinterest-error">${escapeHtml(state.pinterest.error)}</p>` : ""}

      ${!connected ? `
        <div class="pinterest-connect-panel">
          <button class="primary-btn" id="pinterest-connect-btn" type="button" ${loading ? "disabled" : ""}>
            ${loading ? "Connecting..." : "Connect Pinterest"}
          </button>
        </div>
      ` : selectedBoard ? renderPinterestPins() : renderPinterestBoards()}
    </div>
  `;

  const connectBtn = $("#pinterest-connect-btn");
  if (connectBtn) connectBtn.addEventListener("click", startPinterestAuth);

  const backBtn = $("#pinterest-back-btn");
  if (backBtn) backBtn.addEventListener("click", () => {
    state.pinterest.selectedBoardId = null;
    state.pinterest.selectedBoardName = "";
    state.pinterest.pins = [];
    state.pinterest.pinsBookmark = null;
    renderPinterestOverlay();
  });

  document.querySelectorAll("[data-pinterest-board]").forEach((button) => {
    button.addEventListener("click", () => openPinterestBoard(button.dataset.pinterestBoard));
  });
  document.querySelectorAll("[data-pinterest-pin]").forEach((button) => {
    button.addEventListener("click", () => openPinterestPin(button.dataset.pinterestPin));
  });

  const moreBoards = $("#pinterest-more-boards");
  if (moreBoards) moreBoards.addEventListener("click", () => loadPinterestBoards(state.pinterest.bookmark));

  const morePins = $("#pinterest-more-pins");
  if (morePins) morePins.addEventListener("click", () => loadPinterestPins(state.pinterest.selectedBoardId, state.pinterest.pinsBookmark));
}

function renderPinterestBoards() {
  if (state.pinterest.status === "loading" && !state.pinterest.boards.length) {
    return `<p class="empty-state">Loading albums...</p>`;
  }

  if (!state.pinterest.boards.length) {
    return `<p class="empty-state">No Pinterest albums found.</p>`;
  }

  return `
    <div class="pinterest-board-grid">
      ${state.pinterest.boards.map((board) => `
        <button class="pinterest-board" type="button" data-pinterest-board="${escapeAttr(board.id)}">
          <span class="pinterest-board-cover">
            ${board.coverImageUrl ? `<img src="${escapeAttr(board.coverImageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
          </span>
          <span class="pinterest-board-name">${escapeHtml(board.name)}</span>
          <span class="pinterest-board-meta">${formatPinterestPinCount(board.pinCount)}</span>
        </button>
      `).join("")}
    </div>
    ${state.pinterest.bookmark ? `<button class="secondary-btn pinterest-load-more" id="pinterest-more-boards" type="button">Load more</button>` : ""}
  `;
}

function renderPinterestPins() {
  const loading = state.pinterest.status === "loading";
  return `
    <div class="pinterest-toolbar">
      <button class="secondary-btn" id="pinterest-back-btn" type="button">Albums</button>
    </div>
    ${loading && !state.pinterest.pins.length ? `<p class="empty-state">Loading pictures...</p>` : ""}
    ${state.pinterest.pins.length ? `
      <div class="pinterest-pin-grid">
        ${state.pinterest.pins.map((pin) => `
          <button class="pinterest-pin" type="button" data-pinterest-pin="${escapeAttr(pin.id)}" aria-label="Open ${escapeAttr(pin.title)}">
            <img src="${escapeAttr(pin.imageUrl)}" alt="${escapeAttr(pin.title)}" loading="lazy" referrerpolicy="no-referrer">
          </button>
        `).join("")}
      </div>
    ` : (!loading ? `<p class="empty-state">No pictures found in this album.</p>` : "")}
    ${state.pinterest.pinsBookmark ? `<button class="secondary-btn pinterest-load-more" id="pinterest-more-pins" type="button">Load more</button>` : ""}
  `;
}

function formatPinterestPinCount(count) {
  const value = Number(count || 0);
  if (!value) return "Pinterest album";
  return `${value} ${value === 1 ? "pin" : "pins"}`;
}

async function loadPinterestBoards(bookmark = "") {
  state.pinterest.status = "loading";
  state.pinterest.error = "";
  renderPinterestOverlay();

  try {
    const url = `${API.pinterest}/boards?page_size=50${bookmark ? `&bookmark=${encodeURIComponent(bookmark)}` : ""}`;
    const data = await apiJson(url);
    const nextBoards = Array.isArray(data.items) ? data.items : [];
    state.pinterest.boards = bookmark ? [...state.pinterest.boards, ...nextBoards] : nextBoards;
    state.pinterest.bookmark = data.bookmark || null;
    state.pinterest.connected = true;
    state.pinterest.status = "idle";
  } catch (err) {
    state.pinterest.status = "idle";
    state.pinterest.error = err instanceof Error ? err.message : "Could not load Pinterest albums.";
    if (/not connected|expired/i.test(state.pinterest.error)) state.pinterest.connected = false;
  }

  renderPinterestOverlay();
}

function openPinterestBoard(boardId) {
  const board = state.pinterest.boards.find((item) => item.id === boardId);
  state.pinterest.selectedBoardId = boardId;
  state.pinterest.selectedBoardName = board?.name || "Album";
  state.pinterest.pins = [];
  state.pinterest.pinsBookmark = null;
  loadPinterestPins(boardId);
}

async function loadPinterestPins(boardId, bookmark = "") {
  if (!boardId) return;

  state.pinterest.status = "loading";
  state.pinterest.error = "";
  renderPinterestOverlay();

  try {
    const url = `${API.pinterest}/boards/${encodeURIComponent(boardId)}/pins?page_size=50${bookmark ? `&bookmark=${encodeURIComponent(bookmark)}` : ""}`;
    const data = await apiJson(url);
    const nextPins = Array.isArray(data.items) ? data.items : [];
    state.pinterest.pins = bookmark ? [...state.pinterest.pins, ...nextPins] : nextPins;
    state.pinterest.pinsBookmark = data.bookmark || null;
    state.pinterest.status = "idle";
  } catch (err) {
    state.pinterest.status = "idle";
    state.pinterest.error = err instanceof Error ? err.message : "Could not load Pinterest pictures.";
  }

  renderPinterestOverlay();
}

function pinterestPinToStyle(pin) {
  const style = galleryItemToStyle({
    id: `pinterest-${pin.id}`,
    title: pin.title || "Pinterest style",
    description: pin.description || "",
    imageUrl: pin.imageUrl || "",
    labels: ["pinterest", state.pinterest.selectedBoardName].filter(Boolean),
    features: ["pinterest", state.pinterest.selectedBoardName].filter(Boolean),
    createdAt: pin.createdAt || ""
  });
  style.source = "pinterest";
  style.pinterestPinId = pin.id;
  style.pinterestBoardId = state.pinterest.selectedBoardId;
  style.pinterestLink = pin.link || "";
  return style;
}

function rememberPinterestPin(pin) {
  const style = pinterestPinToStyle(pin);
  const existingIndex = state.pinterestStyles.findIndex((item) => item.id === style.id);
  if (existingIndex >= 0) state.pinterestStyles[existingIndex] = style;
  else state.pinterestStyles.unshift(style);

  writeStored(PINTEREST_STYLES_KEY, state.pinterestStyles);
  syncStylesForCurrentRoute();
  if (!state.styles.some((item) => item.id === style.id)) state.styles.push(style);
  return style;
}

function openPinterestPin(pinId) {
  const pin = state.pinterest.pins.find((item) => item.id === pinId);
  if (!pin) return;
  const style = rememberPinterestPin(pin);
  openDetail(style.id);
}
