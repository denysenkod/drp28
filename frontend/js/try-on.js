// ---------- Hair try-on ----------
function latestProfileSelfPhoto() {
  return briefItemsFor("me").find((item) => item.imageUrl) || null;
}

function openTryOn() {
  const style = state.styles.find((item) => item.id === String(currentDetailId));
  if (!style) return;

  const profilePhoto = latestProfileSelfPhoto();
  state.tryOn = {
    styleId: style.id,
    userImageData: profilePhoto?.imageUrl || "",
    userImageName: profilePhoto?.name || "Profile selfie",
    sourceBriefItemId: profilePhoto?.id || null,
    resultImageData: "",
    resultSaved: false,
    usageLimit: null,
    usageUsed: null,
    usageRemaining: null,
    status: "idle",
    error: "",
    askProfileUpdate: false
  };

  renderTryOn();
  els.tryOnOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  loadTryOnUsage(style.id);
}

function closeTryOn() {
  els.tryOnOverlay.hidden = true;
  state.tryOn.status = "idle";
  state.tryOn.error = "";
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden) {
    document.body.style.overflow = "";
  }
}

function renderTryOn() {
  const style = state.styles.find((item) => item.id === String(state.tryOn.styleId));
  if (!style) {
    els.tryOnBody.innerHTML = "";
    return;
  }

  const hasSelfie = Boolean(state.tryOn.userImageData);
  const isGenerating = state.tryOn.status === "generating";
  const limit = Number.isFinite(Number(state.tryOn.usageLimit)) ? Number(state.tryOn.usageLimit) : null;
  const remaining = Number.isFinite(Number(state.tryOn.usageRemaining)) ? Number(state.tryOn.usageRemaining) : null;
  const used = Number.isFinite(Number(state.tryOn.usageUsed)) ? Number(state.tryOn.usageUsed) : null;
  const canApply = hasSelfie && style.imageUrl && !isGenerating && !state.tryOn.askProfileUpdate && (remaining === null || remaining > 0);
  const usageText = limit === null
    ? "Checking try-on limit..."
    : remaining === null
      ? `${limit} total try-ons per session`
    : `${remaining} of ${limit} try-ons left`;
  const resultReady = Boolean(state.tryOn.resultImageData);
  const hairstyleFrame = isGenerating
    ? `
      <div class="try-on-image try-on-image--result is-loading">
        <div class="try-on-loading">
          <span></span>
          <strong>Creating your try-on</strong>
          <em>This can take a moment.</em>
        </div>
      </div>
    `
    : resultReady
      ? `
        <div class="try-on-image try-on-image--result">
          <img src="${escapeAttr(state.tryOn.resultImageData)}" alt="Generated haircut try-on">
        </div>
      `
      : `
        <label class="try-on-image try-on-selfie-target" title="${hasSelfie ? "Use a different selfie" : "Upload selfie"}">
          ${hasSelfie ? `<img src="${escapeAttr(state.tryOn.userImageData)}" alt="Your selfie">` : `<span>Add a selfie</span>`}
          <input class="brief-file-input try-on-selfie-input" type="file" accept="image/*">
        </label>
      `;

  els.tryOnBody.innerHTML = `
    <div class="try-on-popup">
      <div class="overlay-heading">
        <p class="eyebrow">Try on</p>
        <h2>Current hairstyle</h2>
      </div>
      <p class="try-on-usage">${escapeHtml(usageText)}${used === null ? "" : ` <span>${escapeHtml(String(used))} used</span>`}</p>

      <div class="try-on-frames">
        <figure class="try-on-frame">
          <div class="try-on-image">
            ${style.imageUrl ? `<img src="${escapeAttr(style.imageUrl)}" alt="${escapeAttr(style.name)}" referrerpolicy="no-referrer">` : `<span>No reference image</span>`}
          </div>
          <figcaption>Reference haircut</figcaption>
        </figure>

        <figure class="try-on-frame">
          ${hairstyleFrame}
          <figcaption>Your hairstyle</figcaption>
        </figure>
      </div>

      ${resultReady ? `
        <div class="try-on-result-actions">
          <button class="secondary-btn" id="try-on-download" type="button">Download image</button>
          <button class="primary-btn" id="try-on-save-result" type="button" ${state.tryOn.resultSaved ? "disabled" : ""}>
            ${state.tryOn.resultSaved ? "Saved" : "Save to favourites"}
          </button>
        </div>
      ` : ""}

      ${state.tryOn.status === "idle" ? `
        <div class="try-on-controls">
          <button class="primary-btn" id="try-on-apply" type="button" ${canApply ? "" : "disabled"}>
            Apply haircut
          </button>
        </div>
      ` : ""}

      ${state.tryOn.askProfileUpdate ? `
        <div class="try-on-profile-choice">
          <p>Use this selfie in Profile too?</p>
          <div>
            <button class="primary-btn" type="button" data-try-on-profile="yes">Yes, update Profile</button>
            <button class="secondary-btn" type="button" data-try-on-profile="no">No, just try on</button>
          </div>
        </div>
      ` : ""}

      ${state.tryOn.error ? `<p class="try-on-error">${escapeHtml(state.tryOn.error)}</p>` : ""}
    </div>
  `;

  wireTryOn();
}

async function loadTryOnUsage(styleId) {
  try {
    const data = await apiJson(`${API.tryOnUsage}?sessionId=${encodeURIComponent(state.sessionId)}`);
    if (state.tryOn.styleId !== styleId || els.tryOnOverlay.hidden) return;
    state.tryOn.usageLimit = Number(data.limit);
    state.tryOn.usageUsed = Number(data.used);
    state.tryOn.usageRemaining = Number(data.remaining);
  } catch {
    if (state.tryOn.styleId !== styleId || els.tryOnOverlay.hidden) return;
    state.tryOn.usageLimit = null;
    state.tryOn.usageUsed = null;
    state.tryOn.usageRemaining = null;
  }
  renderTryOn();
}

function wireTryOn() {
  document.querySelectorAll(".try-on-selfie-input").forEach((input) => {
    input.addEventListener("change", (event) => {
      handleTryOnSelfieUpload(event.target.files);
      event.target.value = "";
    });
  });

  const apply = $("#try-on-apply");
  if (apply) {
    apply.addEventListener("click", applyTryOn);
  }
  const download = $("#try-on-download");
  if (download) {
    download.addEventListener("click", downloadTryOnResult);
  }
  const saveResult = $("#try-on-save-result");
  if (saveResult) {
    saveResult.addEventListener("click", saveTryOnResult);
  }

  document.querySelectorAll("[data-try-on-profile]").forEach((button) => {
    button.addEventListener("click", () => answerTryOnProfileUpdate(button.dataset.tryOnProfile === "yes"));
  });
}

async function handleTryOnSelfieUpload(fileList) {
  const file = Array.from(fileList || []).find((item) => item.type.startsWith("image/"));
  if (!file) return;

  try {
    const imageData = await imageFileToDataUrl(file);
    state.tryOn.userImageData = imageData;
    state.tryOn.userImageName = file.name || "Try-on selfie";
    state.tryOn.resultImageData = "";
    state.tryOn.resultSaved = false;
    state.tryOn.status = "idle";
    state.tryOn.error = "";
    state.tryOn.askProfileUpdate = true;
  } catch (err) {
    state.tryOn.error = err instanceof Error ? err.message : "Could not read that image.";
  }

  renderTryOn();
}

async function answerTryOnProfileUpdate(shouldSave) {
  if (shouldSave) {
    await saveTryOnSelfieToProfile();
  }
  state.tryOn.askProfileUpdate = false;
  renderTryOn();
}

async function saveTryOnSelfieToProfile() {
  if (!state.tryOn.userImageData) return;

  const existingId = state.tryOn.sourceBriefItemId;
  let savedId = existingId;
  let found = false;
  const next = state.brief.map((item) => {
    if (item.id !== existingId || itemPartition(item) !== "me") return item;
    found = true;
    return {
      ...item,
      source: "upload",
      imageUrl: state.tryOn.userImageData,
      name: state.tryOn.userImageName || item.name || "Try-on selfie"
    };
  });

  if (!found) {
    savedId = briefItemId();
    next.unshift({
      id: savedId,
      source: "upload",
      imageUrl: state.tryOn.userImageData,
      name: state.tryOn.userImageName || "Try-on selfie",
      partition: "me",
      firstChoice: false,
      annotation: "",
      hairstyleStatus: "current"
    });
  }

  state.tryOn.sourceBriefItemId = savedId;
  setBrief(next);

  await mirrorSelfPhotoToApi(
    state.tryOn.userImageData,
    state.tryOn.userImageName || "Try-on selfie",
    "Selfie used for haircut try-on"
  );
}

function addTryOnResultToReferences(style, imageData) {
  if (!style || !imageData) return null;
  const existing = state.brief.find((item) =>
    item.source === "try-on" &&
    item.referenceStyleId === style.id &&
    item.imageUrl === imageData
  );
  if (existing) return existing;
  const item = {
    id: briefItemId(),
    source: "try-on",
    referenceStyleId: style.id,
    imageUrl: imageData,
    name: `Try-on: ${style.name}`,
    partition: "references",
    firstChoice: false,
    annotation: `Generated try-on based on ${style.name}.`
  };
  setBrief([item, ...state.brief]);
  return item;
}

function tryOnDownloadName(style) {
  const name = String(style?.name || "current-hairstyle")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return `hairmatch-try-on-${name || "current-hairstyle"}.png`;
}

function downloadTryOnResult() {
  const style = state.styles.find((item) => item.id === String(state.tryOn.styleId));
  if (!state.tryOn.resultImageData) return;
  const link = document.createElement("a");
  link.href = state.tryOn.resultImageData;
  link.download = tryOnDownloadName(style);
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function saveTryOnResult() {
  const style = state.styles.find((item) => item.id === String(state.tryOn.styleId));
  if (!style || !state.tryOn.resultImageData) return;
  addTryOnResultToReferences(style, state.tryOn.resultImageData);
  if (!state.favourites.has(style.id)) {
    await toggleFavourite(style.id);
  }
  state.tryOn.resultSaved = true;
  flushBriefSync();
  renderTryOn();
}

async function applyTryOn() {
  const style = state.styles.find((item) => item.id === String(state.tryOn.styleId));
  if (!style || !state.tryOn.userImageData || !style.imageUrl || state.tryOn.askProfileUpdate) return;

  state.tryOn.status = "generating";
  state.tryOn.error = "";
  state.tryOn.resultImageData = "";
  state.tryOn.resultSaved = false;
  renderTryOn();

  try {
    const data = await apiJson(API.tryOn, {
      method: "POST",
      body: JSON.stringify({
        sessionId: state.sessionId,
        styleId: style.id,
        styleName: style.name,
        userImageData: state.tryOn.userImageData,
        referenceImageUrl: style.imageUrl
      })
    });
    state.tryOn.resultImageData = data.imageData || "";
    if (data.limit !== undefined) state.tryOn.usageLimit = Number(data.limit);
    if (data.used !== undefined) state.tryOn.usageUsed = Number(data.used);
    if (data.remaining !== undefined) state.tryOn.usageRemaining = Number(data.remaining);
    state.tryOn.status = "done";
    if (!state.tryOn.resultImageData) {
      state.tryOn.error = "Try-on generation did not return an image.";
    }
  } catch (err) {
    const data = err?.data || {};
    if (data.limit !== undefined) state.tryOn.usageLimit = Number(data.limit);
    if (data.used !== undefined) state.tryOn.usageUsed = Number(data.used);
    if (data.remaining !== undefined) state.tryOn.usageRemaining = Number(data.remaining);
    state.tryOn.status = "idle";
    state.tryOn.error = err instanceof Error ? err.message : "Try-on generation failed.";
  }

  renderTryOn();
}

