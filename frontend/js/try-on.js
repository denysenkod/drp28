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
    status: "idle",
    error: "",
    askProfileUpdate: false
  };

  renderTryOn();
  els.tryOnOverlay.hidden = false;
  document.body.style.overflow = "hidden";
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
  const canApply = hasSelfie && style.imageUrl && !isGenerating && !state.tryOn.askProfileUpdate;

  els.tryOnBody.innerHTML = `
    <div class="try-on-popup">
      <div class="overlay-heading">
        <p class="eyebrow">Try on</p>
        <h2>${escapeHtml(style.name)}</h2>
      </div>

      <div class="try-on-frames">
        <figure class="try-on-frame">
          <div class="try-on-image">
            ${style.imageUrl ? `<img src="${escapeAttr(style.imageUrl)}" alt="${escapeAttr(style.name)}" referrerpolicy="no-referrer">` : `<span>No reference image</span>`}
          </div>
          <figcaption>Reference haircut</figcaption>
        </figure>

        <figure class="try-on-frame">
          <label class="try-on-image try-on-selfie-target" title="${hasSelfie ? "Use a different selfie" : "Upload selfie"}">
            ${hasSelfie ? `<img src="${escapeAttr(state.tryOn.userImageData)}" alt="Your selfie">` : `<span>Add a selfie</span>`}
            <input class="brief-file-input try-on-selfie-input" type="file" accept="image/*">
          </label>
          <figcaption>${hasSelfie ? escapeHtml(state.tryOn.userImageName || "Your selfie") : "Your selfie"}</figcaption>
        </figure>
      </div>

      <div class="try-on-controls">
        <button class="primary-btn" id="try-on-apply" type="button" ${canApply ? "" : "disabled"}>
          ${isGenerating ? "Applying..." : "Apply haircut"}
        </button>
      </div>

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

      ${state.tryOn.resultImageData ? `
        <figure class="try-on-result">
          <div class="try-on-result-image">
            <img src="${escapeAttr(state.tryOn.resultImageData)}" alt="Generated haircut try-on">
          </div>
          <figcaption>Your realistic try-on</figcaption>
        </figure>
      ` : ""}
    </div>
  `;

  wireTryOn();
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

async function applyTryOn() {
  const style = state.styles.find((item) => item.id === String(state.tryOn.styleId));
  if (!style || !state.tryOn.userImageData || !style.imageUrl || state.tryOn.askProfileUpdate) return;

  state.tryOn.status = "generating";
  state.tryOn.error = "";
  state.tryOn.resultImageData = "";
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
    state.tryOn.status = "done";
    if (state.tryOn.resultImageData) {
      addTryOnResultToReferences(style, state.tryOn.resultImageData);
      flushBriefSync();
    } else {
      state.tryOn.error = "Try-on generation did not return an image.";
    }
  } catch (err) {
    state.tryOn.status = "idle";
    state.tryOn.error = err instanceof Error ? err.message : "Try-on generation failed.";
  }

  renderTryOn();
}

