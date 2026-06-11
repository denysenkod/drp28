// ---------- Reviewing a shared brief (read-only + feedback) ----------
// When the app is opened with a foreign ?brief=<id>, it loads that brief from
// the server. The reviewer can read the owner's photos, favourites and notes,
// and leave their own feedback per item.
async function loadSharedBrief(id) {
  state.sharedBrief = null;
  state.sharedBriefError = false;
  if (state.view === "shared") render();
  try {
    const data = await apiJson(`${API.briefs}/${encodeURIComponent(id)}`);
    state.sharedBrief = data.item || null;
    state.sharedBriefError = !state.sharedBrief;
  } catch {
    state.sharedBriefError = true;
  }
  if (state.view === "shared") render();
}

// The owner's own view of any feedback their stylist has left. Fetched from the
// shared-brief endpoint (which returns the brief plus its feedback) so it stays
// in sync with what reviewers have submitted.
async function loadOwnerFeedback() {
  if (!state.briefId) {
    state.ownerFeedback = [];
    return;
  }
  try {
    const data = await apiJson(`${API.briefs}/${encodeURIComponent(state.briefId)}`);
    state.ownerFeedback = Array.isArray(data.item?.feedback) ? data.item.feedback : [];
  } catch {
    // Leave whatever we had; a failed refresh shouldn't blank the profile.
  }
  if (state.view === "brief") renderBrief();
}

// Read-only feedback panel shown at the top of the owner's profile, just under
// the intro. Hidden entirely until a stylist has left something.
function renderOwnerFeedback() {
  const comments = state.ownerFeedback || [];
  if (!comments.length) return "";
  return `
    <section class="profile-feedback">
      <p class="profile-feedback-kicker">Feedback from your stylist</p>
      <ul class="profile-feedback-list">
        ${comments.map((entry) => `
          <li class="profile-feedback-entry">
            <span class="profile-feedback-author">${escapeHtml(entry.author || "Reviewer")}</span>
            ${entry.note ? `<p class="profile-feedback-note">${escapeHtml(entry.note)}</p>` : ""}
          </li>
        `).join("")}
      </ul>
    </section>
  `;
}

function renderFirstChoicePill(item) {
  return "";
}

function renderColourCareTab(bodyHtml, details = state.briefDetails, options = {}) {
  const isOpen = typeof options.isOpen === "boolean" ? options.isOpen : briefDetailsIsOpen();
  const title = "Hair colour treatment";
  const addLabel = "Add hair colour treatment";
  const showRemoveButton = Boolean(options.removable && isOpen);
  const action = options.actionLabel ?? "";
  const detailsClass = `brief-details brief-details-accordion${!isOpen && options.showGhostAdd ? " brief-details--ghost" : ""}`;
  const summaryClass = `brief-details-summary${!isOpen && options.showGhostAdd ? " brief-details-summary--ghost" : ""}`;

  if (showRemoveButton) {
    return `
      <section class="${detailsClass} is-open" id="brief-details-accordion">
        <div class="brief-details-summary brief-details-summary--static">
          <span class="brief-details-summary-title">${escapeHtml(title)}</span>
          <button class="brief-details-remove-btn" type="button" data-remove-brief-details>Remove</button>
        </div>
        <div class="brief-details-panel">
          ${bodyHtml}
        </div>
      </section>
    `;
  }

  return `
    <details class="${detailsClass}" id="brief-details-accordion"${isOpen ? " open" : ""}>
      <summary class="${summaryClass}">
        ${!isOpen && options.showGhostAdd
          ? `<span class="brief-details-summary-add">${escapeHtml(addLabel)}</span>`
          : `<span class="brief-details-summary-title">${escapeHtml(title)}</span>`
        }
        ${action ? `<span class="brief-details-summary-state">${escapeHtml(action)}</span>` : ""}
      </summary>
      <div class="brief-details-panel">
        ${bodyHtml}
      </div>
    </details>
  `;
}

// Read-only hair-colour readout for the reviewer. Shows only the fields the
// client explicitly filled in.
function renderBriefDetailsReview(details) {
  const d = details || {};
  if (!briefDetailsShouldShare(d)) return "";

  const rows = [
    ["Hair colour treatment", d.colour],
    ["Allergies or sensitivities", d.allergies],
    ["Previous colour treatments", d.previousTreatments],
    ["Damage or breakage", d.damage]
  ].filter(([, value]) => value && String(value).trim());

  if (!rows.length) return "";

  return renderColourCareTab(`
      <dl class="brief-details-readout">
        ${rows.map(([label, value]) => `
          <div class="brief-detail-row">
            <dt>${escapeHtml(label)}</dt>
            <dd>${escapeHtml(String(value))}</dd>
          </div>
        `).join("")}
      </dl>
  `, d, { isOpen: true, actionLabel: "" });
}

// Read-only general notes for the reviewer, shown as its own section so it
// stands apart from the hair-colour treatment details.
function renderBriefNotesReview(details) {
  const notes = briefNotesValue(details);
  if (!notes) return "";
  return `
    <section class="brief-details brief-details--notes">
      <div class="brief-details-summary brief-details-summary--static">
        <span class="brief-details-summary-title">General notes</span>
      </div>
      <div class="brief-details-panel">
        <p class="brief-owner-note">${escapeHtml(notes)}</p>
      </div>
    </section>
  `;
}

// Read-only card: the client's photo with their favourite flag and note. The
// stylist no longer comments per photo; feedback is a single high-level summary
// below.
// Helpers for the "Your hair" partition: it is a single current-hair photo.
function selfHairstyleStatus(item) {
  const value = String(item?.hairstyleStatus || "").trim().toLowerCase();
  return value === "current" || value === "past" ? value : "current";
}

function selfHairstyleLabel(status) {
  return "Current hair";
}

function renderSelfHairstyleStatus(item, isReadOnly = false) {
  const status = "current";

  return `<p class="brief-self-style-pill brief-self-style-pill--${escapeAttr(status)}">${escapeHtml(selfHairstyleLabel(status))}</p>`;
}

function renderSharedItem(item) {
  const isOwnHair = itemPartition(item) === "me";
  return `
    <article class="brief-card brief-card--review">
      <div class="brief-card-image">
        ${item.imageUrl
          ? `<img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.name || "Reference image")}" loading="lazy" referrerpolicy="no-referrer">`
          : `<span>${escapeHtml(item.name || "Reference")}</span>`}
      </div>
      ${isOwnHair
        ? ""
        : `<div class="brief-card-body">${renderFirstChoicePill(item)}${item.annotation ? `<p class="brief-owner-note">${escapeHtml(item.annotation)}</p>` : `<p class="brief-owner-note brief-owner-note--empty">No notes from the client.</p>`}</div>`
      }
    </article>
  `;
}

// One high-level summary for the whole brief: any previously-left comments,
// plus a single box for the stylist to add their overall feedback.
function renderFeedbackEntry(entry) {
  if (state.editingFeedbackId === entry.id) {
    return `
      <li class="brief-feedback-entry brief-feedback-entry--editing">
        <form class="brief-feedback-form brief-feedback-edit-form" data-feedback-edit-form="${escapeAttr(entry.id)}">
          <textarea class="brief-annotation" rows="4" data-feedback-edit-note>${escapeHtml(entry.note || "")}</textarea>
          <div class="brief-feedback-edit-actions">
            <button class="secondary-btn" type="button" data-feedback-cancel>Cancel</button>
            <button class="primary-btn brief-feedback-submit" type="submit">Save</button>
          </div>
        </form>
      </li>
    `;
  }
  return `
    <li class="brief-feedback-entry">
      <div class="brief-feedback-meta">
        <span class="brief-feedback-author">${escapeHtml(entry.author || "Reviewer")}</span>
        <span class="brief-feedback-actions">
          <button class="brief-feedback-action" type="button" data-feedback-edit="${escapeAttr(entry.id)}">Edit</button>
          <button class="brief-feedback-action brief-feedback-action--danger" type="button" data-feedback-delete="${escapeAttr(entry.id)}">Delete</button>
        </span>
      </div>
      ${entry.note ? `<p class="brief-feedback-note">${escapeHtml(entry.note)}</p>` : ""}
    </li>
  `;
}

function renderStylistSummary() {
  const comments = state.sharedBrief?.feedback || [];
  const list = comments.length
    ? `<ul class="brief-feedback-list">
        ${comments.map(renderFeedbackEntry).join("")}
      </ul>`
    : "";
  return `
    <section class="brief-summary">
      <div class="brief-partition-head">
        <p class="eyebrow">Stylist</p>
        <h2>Overall feedback</h2>
        <p class="brief-partition-copy">Leave a high-level summary of your thoughts for the client.</p>
      </div>
      ${list}
      <form class="brief-feedback-form brief-summary-form" id="brief-summary-form">
        <textarea class="brief-annotation" id="brief-summary-note" rows="4" placeholder="Share your overall thoughts on this brief..."></textarea>
        <button class="primary-btn brief-feedback-submit" type="submit">Add feedback</button>
      </form>
    </section>
  `;
}

function renderSharedBrief() {
  if (state.sharedBriefError) {
    els.app.innerHTML = `
      <section class="brief-screen brief-screen--review">
        <div class="screen-heading"><div>
          <p class="eyebrow">Style brief</p>
          <h1>Brief not found</h1>
          <p>This link may be incorrect or the brief is no longer available.</p>
        </div></div>
      </section>
    `;
    return;
  }

  if (!state.sharedBrief) {
    els.app.innerHTML = `
      <section class="brief-screen brief-screen--review">
        <div class="screen-heading"><div>
          <p class="eyebrow">Style brief</p>
          <h1>Loading brief...</h1>
        </div></div>
      </section>
    `;
    return;
  }

  const items = Array.isArray(state.sharedBrief.items) ? state.sharedBrief.items : [];
  const meItems = items.filter((item) => itemPartition(item) === "me");
  const refItems = sortReferencesForDisplay(items.filter((item) => itemPartition(item) === "references"));

  els.app.innerHTML = `
    <section class="brief-screen brief-screen--review">
      <div class="screen-heading">
        <div>
          <p class="eyebrow">Style brief - for review</p>
          <h1>A client's style brief</h1>
          <p>Photos of the client's own hair and the references they love, with their favourites and notes. Leave one overall summary at the end.</p>
        </div>
        <label class="brief-reviewer-name">
          <span>Your name</span>
          <input type="text" id="reviewer-name" placeholder="e.g. Alex at the salon" value="${escapeAttr(state.reviewerName)}" maxlength="80">
        </label>
      </div>

      ${renderBriefDetailsReview(state.sharedBrief.details)}

      <div class="brief-partitions">
        <section class="brief-partition brief-partition--me">
          <div class="brief-partition-head"><h2>Their hair</h2></div>
          <div class="brief-grid">
            ${meItems.length ? meItems.map(renderSharedItem).join("") : `<p class="brief-picker-empty">No photos of their own hair.</p>`}
          </div>
        </section>

        <section class="brief-partition brief-partition--references">
          <div class="brief-partition-head">
            <p class="eyebrow">Inspiration</p>
            <h2>References</h2>
          </div>
          <div class="brief-grid">
            ${refItems.length ? refItems.map(renderSharedItem).join("") : `<p class="brief-picker-empty">No references added.</p>`}
          </div>
        </section>
      </div>

      ${renderBriefNotesReview(state.sharedBrief.details)}

      ${renderStylistSummary()}
    </section>
  `;

  wireSharedBrief();
}

function wireSharedBrief() {
  const nameInput = $("#reviewer-name");
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      state.reviewerName = nameInput.value;
      writeStored(REVIEWER_NAME_KEY, state.reviewerName);
    });
  }

  const summaryForm = $("#brief-summary-form");
  if (summaryForm) {
    summaryForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitBriefSummary(summaryForm);
    });
  }

  document.querySelectorAll("[data-feedback-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingFeedbackId = button.dataset.feedbackEdit;
      render();
    });
  });
  document.querySelectorAll("[data-feedback-cancel]").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingFeedbackId = null;
      render();
    });
  });
  document.querySelectorAll("[data-feedback-delete]").forEach((button) => {
    button.addEventListener("click", () => deleteBriefFeedbackEntry(button.dataset.feedbackDelete));
  });
  const editForm = document.querySelector("[data-feedback-edit-form]");
  if (editForm) {
    editForm.addEventListener("submit", (event) => {
      event.preventDefault();
      submitBriefFeedbackEdit(editForm, editForm.dataset.feedbackEditForm);
    });
  }
}

// Submit one brief-level summary comment (no rating, no per-image target).
async function submitBriefSummary(form) {
  const noteInput = $("#brief-summary-note");
  const note = noteInput ? noteInput.value.trim() : "";
  const submitBtn = form.querySelector(".brief-feedback-submit");

  if (!note) {
    form.classList.add("is-invalid");
    return;
  }
  form.classList.remove("is-invalid");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = await apiJson(`${API.briefs}/${encodeURIComponent(state.sharedBriefId)}/feedback`, {
      method: "POST",
      body: JSON.stringify({
        author: state.reviewerName.trim() || "Reviewer",
        note
      })
    });
    if (state.sharedBrief && data.item) {
      state.sharedBrief.feedback = [...(state.sharedBrief.feedback || []), data.item];
    }
    render();
  } catch {
    if (submitBtn) submitBtn.disabled = false;
    form.classList.add("is-invalid");
  }
}

// Save an edit to an existing feedback entry. Mirrors the new-feedback flow but
// PUTs to the entry's endpoint and replaces the entry in place.
async function submitBriefFeedbackEdit(form, feedbackId) {
  const noteInput = form.querySelector("[data-feedback-edit-note]");
  const note = noteInput ? noteInput.value.trim() : "";
  const submitBtn = form.querySelector(".brief-feedback-submit");

  if (!note) {
    form.classList.add("is-invalid");
    return;
  }
  form.classList.remove("is-invalid");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const data = await apiJson(`${API.briefs}/${encodeURIComponent(state.sharedBriefId)}/feedback/${encodeURIComponent(feedbackId)}`, {
      method: "PUT",
      body: JSON.stringify({
        author: state.reviewerName.trim() || "Reviewer",
        note
      })
    });
    if (state.sharedBrief && data.item) {
      state.sharedBrief.feedback = (state.sharedBrief.feedback || []).map((entry) =>
        entry.id === feedbackId ? data.item : entry
      );
    }
    state.editingFeedbackId = null;
    render();
  } catch {
    if (submitBtn) submitBtn.disabled = false;
    form.classList.add("is-invalid");
  }
}

// Delete a feedback entry, then drop it from the local copy and re-render.
async function deleteBriefFeedbackEntry(feedbackId) {
  if (!window.confirm("Delete this feedback?")) return;
  try {
    await apiJson(`${API.briefs}/${encodeURIComponent(state.sharedBriefId)}/feedback/${encodeURIComponent(feedbackId)}`, {
      method: "DELETE"
    });
    if (state.sharedBrief) {
      state.sharedBrief.feedback = (state.sharedBrief.feedback || []).filter((entry) => entry.id !== feedbackId);
    }
    if (state.editingFeedbackId === feedbackId) state.editingFeedbackId = null;
    render();
  } catch {
    // Leave the entry in place if the delete failed.
  }
}

function updateBriefCount() {
  if (els.briefCount) els.briefCount.textContent = state.brief.length;
}

function briefItemId() {
  return window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `brief-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Items saved before partitions existed (and any future stragglers) are treated
// as references unless explicitly marked as the user.
function itemPartition(item) {
  return item.partition === "me" ? "me" : "references";
}

function briefItemsFor(partition) {
  return state.brief.filter((item) => itemPartition(item) === partition);
}

// Favourited references lead the list to signal importance. This is a stable
// partition: it preserves array order within each group, so the favourites keep
// the recency order that setBriefFirstChoice maintains (newest = rightmost
// favourite) and the rest stay in insertion order.
function sortReferencesForDisplay(items) {
  const favourites = items.filter((item) => item.firstChoice);
  const rest = items.filter((item) => !item.firstChoice);
  return [...favourites, ...rest];
}

function openBriefPicker() {
  state.briefPickerOpen = true;
  state.briefRefAddOpen = false;
  document.body.style.overflow = "hidden";
  renderBrief();
}

function closeBriefPicker() {
  if (!state.briefPickerOpen) return;
  state.briefPickerOpen = false;
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && els.tryOnOverlay.hidden) {
    document.body.style.overflow = "";
  }
  if (state.view === "brief") renderBrief();
}

function openBriefRefAdd() {
  state.briefRefAddOpen = true;
  document.body.style.overflow = "hidden";
  renderBrief();
}

function closeBriefRefAdd() {
  if (!state.briefRefAddOpen) return;
  state.briefRefAddOpen = false;
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && els.tryOnOverlay.hidden && !state.briefPickerOpen) {
    document.body.style.overflow = "";
  }
  if (state.view === "brief") renderBrief();
}

function openBriefCompletePrompt() {
  state.briefCompletePromptOpen = true;
  state.briefPickerOpen = false;
  state.briefRefAddOpen = false;
  document.body.style.overflow = "hidden";
  renderBrief();
}

function closeBriefCompletePrompt() {
  if (!state.briefCompletePromptOpen) return;
  state.briefCompletePromptOpen = false;
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && !state.briefPickerOpen && !state.briefRefAddOpen) {
    document.body.style.overflow = "";
  }
  if (state.view === "brief") renderBrief();
}

async function completeBriefFromPrompt(useNotes = true) {
  const notes = useNotes ? ($("#brief-complete-notes")?.value || "") : "";
  setBriefDetails({ ...state.briefDetails, notes });
  await handleBriefComplete();
}

function renderBrief() {
  syncFavouriteReferencesToBrief();
  const normalizedBrief = normalizeBriefItems(state.brief);
  if (JSON.stringify(normalizedBrief) !== JSON.stringify(state.brief)) {
    setBrief(normalizedBrief);
  }
  const savedStyles = state.styles.filter((style) => state.favourites.has(style.id));
  const pickerOpen = state.briefPickerOpen;
  const refAddOpen = state.briefRefAddOpen;
  const completePromptOpen = state.briefCompletePromptOpen;
  const meItems = briefItemsFor("me");
  const refItems = sortReferencesForDisplay(briefItemsFor("references"));
  const counts = profileBriefCounts(meItems, refItems);

  els.app.innerHTML = `
    <section class="profile-screen">
      <div class="profile-wrap">
        <div class="profile-page">
          <header class="profile-hero">
            <p class="eyebrow">Your profile</p>
            <h1 class="profile-title">Your hair <em>brief</em></h1>
            <p class="profile-lede">Gather photos of your hair today and the looks you're after, add the colour you have in mind and a few notes, then share one link with your stylist.</p>
            ${renderOwnerFeedback()}
          </header>

          <div class="profile-work">
            <section class="profile-section">
              <div class="profile-section-head">
                <h2>Your hair</h2>
                <p>Photos of your hair right now.</p>
              </div>
              <div class="profile-photo-grid profile-photo-grid--hair" id="brief-me-grid">
                ${renderBriefAddSelf()}
                ${meItems.map(renderBriefItem).join("")}
              </div>
            </section>

            <section class="profile-section">
              <div class="profile-section-head">
                <h2>References</h2>
                <p>Looks on other people you'd like to take cues from. Haircuts you save appear here automatically.</p>
              </div>
              <div class="profile-photo-grid profile-photo-grid--references" id="brief-ref-grid">
                ${renderBriefAddRef()}
                ${refItems.map(renderBriefItem).join("")}
              </div>
            </section>

            ${renderBriefDetails()}

            ${renderBriefNotes()}
          </div>

          ${renderProfileBriefAside(counts)}
        </div>
      </div>
      ${renderProfileMobileShare(counts)}
    </section>

    ${completePromptOpen ? renderBriefCompletePrompt() : ""}
    ${pickerOpen ? renderBriefPicker(savedStyles) : ""}
  `;

  wireBrief();
}

function profileBriefCounts(meItems = briefItemsFor("me"), refItems = briefItemsFor("references")) {
  const colourAdded = briefDetailsHasContent(state.briefDetails);
  const notesAdded = Boolean(briefNotesValue());
  const completed = [
    meItems.length > 0,
    refItems.length > 0,
    colourAdded,
    notesAdded
  ].filter(Boolean).length;
  return {
    hair: meItems.length,
    references: refItems.length,
    referenceFavourites: refItems.filter((item) => item.firstChoice).length,
    colourAdded,
    notesAdded,
    percent: Math.round((completed / 4) * 100)
  };
}

function renderProfileBriefAside(counts) {
  const link = state.shareLink || briefShareLink() || "Complete profile to create a link";
  const canShare = briefHasContent();
  return `
    <aside class="profile-brief-card">
      <div class="profile-brief-top">
        <span class="profile-brief-kicker">Your brief</span>
        <span class="profile-brief-ref">${state.briefId ? `REF ${escapeHtml(String(state.briefId).slice(0, 4).toUpperCase())}` : "Draft"}</span>
      </div>
      <h2>${counts.percent >= 75 ? "Almost ready" : "In progress"}</h2>

      <div class="profile-meter">
        <div class="profile-meter-head"><span>Completeness</span><b>${counts.percent}%</b></div>
        <div class="profile-meter-bar"><div style="width:${counts.percent}%"></div></div>
      </div>

      <ul class="profile-brief-list">
        ${renderProfileBriefListItem("Your hair", `${counts.hair} ${counts.hair === 1 ? "photo" : "photos"}`, counts.hair > 0)}
        ${renderProfileBriefListItem("References", `${counts.references} ${counts.references === 1 ? "reference" : "references"}`, counts.references > 0)}
        ${renderProfileBriefListItem("Colour & treatment", counts.colourAdded ? "Added" : "Optional", counts.colourAdded)}
        ${renderProfileBriefListItem("General notes", counts.notesAdded ? "Added" : "Optional", counts.notesAdded)}
      </ul>

      <div class="profile-share-block">
        <p>Shareable link</p>
        <div class="profile-link-field">
          <span>${escapeHtml(link)}</span>
          <button class="profile-link-copy" id="brief-url-share-btn" type="button" ${canShare ? "" : "disabled"}>
            ${iconCheck()}<span>Copy</span>
          </button>
        </div>
        <button class="profile-share-btn" id="brief-share-btn" data-brief-share-direct type="button" ${canShare ? "" : "disabled"}>
          ${iconShare()}<span>Share with stylist</span>
        </button>
        <div class="profile-share-status" id="brief-share-status" ${state.shareStatus ? "" : "hidden"}>
          <span>${escapeHtml(state.shareStatus)}</span>
        </div>
        <p class="profile-share-note">${iconCheck()}Anyone with the link can view your brief - no account needed.</p>
      </div>
    </aside>
  `;
}

function renderProfileBriefListItem(label, count, done) {
  return `
    <li>
      <span class="profile-brief-check ${done ? "is-done" : "is-todo"}">${done ? iconCheck() : ""}</span>
      <span class="profile-brief-label">${escapeHtml(label)}</span>
      <span class="profile-brief-count">${escapeHtml(count)}</span>
    </li>
  `;
}

function renderProfileMobileShare(counts) {
  const canShare = briefHasContent();
  return `
    <div class="profile-mobile-share">
      <div>
        <div class="profile-mobile-title">Brief ${counts.percent}% ready</div>
        <div class="profile-mobile-sub">${counts.hair} ${counts.hair === 1 ? "photo" : "photos"} - ${counts.references} ${counts.references === 1 ? "reference" : "references"}</div>
      </div>
      <button class="profile-share-btn" id="profile-mobile-share-btn" data-brief-share-direct type="button" ${canShare ? "" : "disabled"}>
        ${iconShare()}<span>Share</span>
      </button>
    </div>
  `;
}

function handleProfileShareDirect() {
  handleBriefUrlShare();
}

// Collapsible hair-colour section: the user can open it if they want to note
// their colour, treatments, or related care notes, or leave it collapsed if it
// is not relevant. The fields update state silently on input (no re-render) so
// focus is preserved.
function renderBriefDetails() {
  const d = state.briefDetails || defaultBriefDetails();
  const colourValue = String(d.colour || "");
  const knownColour = HAIR_COLOUR_OPTIONS.some((c) => c.name === colourValue);
  const selectedColour = colourValue && knownColour ? colourValue : (colourValue ? "Other" : "");
  const otherColour = colourValue && !knownColour ? colourValue : "";
  return `
    <section class="profile-section">
      <div class="profile-section-head">
        <h2>Colour &amp; treatment</h2>
        <p>What you've got now and where you'd like it to go.</p>
      </div>
      <div class="profile-colour-card">
        <div class="profile-colour-grid">
          <label class="profile-colour-row profile-colour-row--wide" for="brief-colour">
            <span class="profile-colour-key" id="brief-colour-label">Hair colour treatment</span>
              <span class="profile-colour-value">
                <span class="hair-colour-swatch-slot" id="brief-colour-swatch">${hairColourSwatch(d.colour || "")}</span>
                <span class="hair-colour-select" id="brief-colour-select">
                  <button class="hair-colour-input-wrap profile-colour-trigger" id="brief-colour" type="button" aria-haspopup="listbox" aria-expanded="false" aria-labelledby="brief-colour-label brief-colour-value">
                    <span class="profile-colour-trigger-text" id="brief-colour-value">${escapeHtml(colourValue || "Pick a colour")}</span>
                    <svg class="hair-colour-caret" viewBox="0 0 24 24" aria-hidden="true"><polyline points="6 9 12 15 18 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <ul class="hair-colour-menu profile-colour-menu" id="brief-colour-menu" role="listbox" aria-labelledby="brief-colour-label" hidden>
                    ${HAIR_COLOUR_OPTIONS.map((c) => `
                    <li class="hair-colour-option" role="option" data-value="${escapeAttr(c.name)}" aria-selected="${selectedColour === c.name ? "true" : "false"}">
                      ${hairColourSwatch(c.name)}
                      <span class="hair-colour-option-label">${escapeHtml(c.name)}</span>
                    </li>`).join("")}
                  </ul>
                  <input class="profile-colour-other-input" id="brief-colour-other" type="text" placeholder="Type colour" value="${escapeAttr(otherColour)}" ${selectedColour === "Other" ? "" : "hidden"}>
              </span>
            </span>
          </label>
          ${renderProfileTextRow("Allergies or sensitivities", "brief-allergies", d.allergies, "e.g. PPD allergy, sensitive scalp - or none")}
          ${renderProfileTextRow("Previous colour treatments", "brief-previous", d.previousTreatments, "e.g. box dye 3 months ago")}
          ${renderProfileTextRow("Damage or breakage", "brief-damage", d.damage, "e.g. dry ends, breakage from bleach")}
        </div>
      </div>
    </section>
  `;
}

function renderProfileTextRow(label, id, value, placeholder) {
  return `
    <label class="profile-colour-row" for="${escapeAttr(id)}">
      <span class="profile-colour-key">${escapeHtml(label)}</span>
      <textarea class="profile-row-input" id="${escapeAttr(id)}" rows="1" placeholder="${escapeAttr(placeholder)}">${escapeHtml(value || "")}</textarea>
    </label>
  `;
}

// Wire the hair-colour combobox. The input stays free-text (type anything),
// and the dropdown below shows the listed colours, each with a solid hex
// swatch, filtered to what's typed. The swatch left of the input tracks the
// current value, so it lights up when the text matches a known colour. State
// updates silently on input (no re-render) so the field keeps focus.
function wireHairColourSelect() {
  const select = $("#brief-colour-select");
  if (!select) return;
  const trigger = $("#brief-colour");
  const swatchSlot = $("#brief-colour-swatch");
  const menu = $("#brief-colour-menu");
  const valueLabel = $("#brief-colour-value");
  const otherInput = $("#brief-colour-other");
  if (!trigger || !swatchSlot || !menu || !valueLabel || !otherInput) return;
  const options = Array.from(menu.querySelectorAll(".hair-colour-option"));

  const closeMenu = () => {
    if (menu.hidden) return;
    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onDocClick, true);
  };
  const openMenu = () => {
    if (menu.hidden) {
      menu.hidden = false;
      trigger.setAttribute("aria-expanded", "true");
      document.addEventListener("click", onDocClick, true);
    }
  };
  function onDocClick(event) {
    if (!select.contains(event.target)) closeMenu();
  }

  const setSwatch = (value) => {
    swatchSlot.innerHTML = hairColourSwatch(value);
  };

  const selectValue = (value) => {
    const isOther = value === "Other";
    const next = isOther ? (otherInput.value.trim() || "Other") : value;
    updateBriefDetail("colour", next);
    valueLabel.textContent = next || "Pick a colour";
    setSwatch(next);
    otherInput.hidden = !isOther;
    options.forEach((option) => {
      option.setAttribute("aria-selected", option.getAttribute("data-value") === value ? "true" : "false");
    });
    closeMenu();
    if (isOther) otherInput.focus();
  };

  trigger.addEventListener("click", () => {
    if (menu.hidden) openMenu();
    else closeMenu();
  });
  trigger.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (menu.hidden) openMenu();
      else closeMenu();
    }
  });

  options.forEach((option) => {
    option.addEventListener("mousedown", (event) => {
      event.preventDefault();
      const value = option.getAttribute("data-value") || "";
      selectValue(value);
      if (value !== "Other") trigger.focus();
    });
  });

  otherInput.addEventListener("input", () => {
    const value = otherInput.value.trim();
    updateBriefDetail("colour", value || "Other");
    valueLabel.textContent = value || "Other";
    setSwatch(value || "Other");
    refreshShareButton();
  });
}

// General notes is a brief-wide free-text box, kept separate from the optional
// hair-colour treatment section so it always shows and isn't cleared when the
// colour section is removed. The value still lives on briefDetails.notes.
function renderBriefNotes() {
  const d = state.briefDetails || defaultBriefDetails();
  return `
    <section class="profile-section">
      <div class="profile-section-head">
        <h2>General notes</h2>
        <p>Anything else you'd like your stylist to know.</p>
      </div>
      <div class="profile-notes-card">
        <textarea id="brief-notes" class="profile-notes-field" rows="5" aria-label="General notes" placeholder="Anything else you'd like your stylist to know...">${escapeHtml(d.notes || "")}</textarea>
      </div>
    </section>
  `;
}

function renderBriefCompletePanel() {
  return `
    <section class="brief-share brief-share--bottom">
      <button class="primary-btn brief-share-btn" id="brief-share-btn" type="button">
        ${iconCheck()}<span>Complete profile</span>
      </button>
      <div class="brief-share-status" id="brief-share-status" ${state.shareStatus ? "" : "hidden"}>
        <span>${escapeHtml(state.shareStatus)}</span>
        ${state.shareLink ? `<button class="secondary-btn brief-url-share-btn" id="brief-url-share-btn" type="button">${iconShare()}<span>Share URL</span></button>` : ""}
      </div>
    </section>
  `;
}

function renderBriefCompletePrompt() {
  const d = state.briefDetails || defaultBriefDetails();
  return `
    <div class="overlay brief-complete-overlay" id="brief-complete-overlay" role="dialog" aria-modal="true" aria-labelledby="brief-complete-title">
      <div class="overlay-card brief-complete-card">
        <button class="close-btn close-btn--text" id="brief-complete-close" type="button" aria-label="Close">Close</button>
        <div class="brief-picker-head">
          <div class="overlay-heading">
            <p class="eyebrow">Profile</p>
            <h2 id="brief-complete-title">Is there anything else you would like to tell your barber?</h2>
          </div>
        </div>
        <label class="brief-field brief-field--wide">
          <span>Optional notes</span>
          <textarea id="brief-complete-notes" rows="5" placeholder="Anything else you'd like your barber to know">${escapeHtml(d.notes || "")}</textarea>
        </label>
        <div class="brief-complete-actions">
          <button class="secondary-btn" id="brief-complete-skip" type="button">Skip</button>
          <button class="primary-btn" id="brief-complete-confirm" type="button">${iconCheck()}<span>Complete profile</span></button>
        </div>
      </div>
    </div>
  `;
}

// A placeholder tile that keeps the "Me" partition occupying at least one grid
// space when empty and lets the user add more photos of themselves. Uploads from
// here go straight into the Me partition.
function renderBriefAddSelf() {
  return `
    <label class="profile-add-card brief-add-self brief-add-self--upload" title="Upload current hair photos">
      <span class="profile-add-plus" aria-hidden="true">${iconPlus()}</span>
      <span class="profile-add-title">Add a photo of you</span>
      <span class="profile-add-hint">Upload from device</span>
      <input class="brief-file-input" type="file" id="brief-self-input" accept="image/*" multiple>
    </label>
  `;
}

// The matching tile for the References partition. It opens a modal choice so
// upload controls never sit directly inside the grid card.
function renderBriefAddRef() {
  return `
    <label class="profile-add-card brief-add-ref" title="Add a reference">
      <span class="profile-add-plus" aria-hidden="true">${iconPlus()}</span>
      <span class="profile-add-title">Add a reference</span>
      <span class="profile-add-hint">Upload from device</span>
      <input class="brief-file-input" type="file" id="brief-ref-input" accept="image/*" multiple>
    </label>
  `;
}

function renderBriefRefAddPopup() {
  return `
    <div class="overlay brief-ref-add-overlay" id="brief-ref-add-overlay" role="dialog" aria-modal="true" aria-labelledby="brief-ref-add-title">
      <div class="overlay-card brief-ref-add-card">
        <button class="close-btn close-btn--text" id="brief-ref-add-close" type="button" aria-label="Close">Close</button>
        <div class="brief-picker-head">
          <div class="overlay-heading">
            <p class="eyebrow">References</p>
            <h2 id="brief-ref-add-title">Add a reference</h2>
          </div>
        </div>
        <div class="brief-ref-add-actions">
          <label class="brief-ref-add-choice">
            <span class="brief-ref-add-choice-title">Upload photo</span>
            <span class="brief-ref-add-choice-copy">Choose an image from this device.</span>
            <input class="brief-file-input" type="file" id="brief-ref-input" accept="image/*" multiple>
          </label>
        </div>
      </div>
    </div>
  `;
}

function renderBriefPicker(savedStyles) {
  const inBrief = new Set(state.brief.map((item) => item.styleId).filter(Boolean));
  return `
    <div class="overlay brief-picker-overlay" id="brief-picker-overlay" role="dialog" aria-modal="true" aria-labelledby="brief-picker-title">
      <div class="overlay-card brief-picker-card">
        <button class="close-btn close-btn--text" id="brief-picker-close" type="button" aria-label="Close">Close</button>
        <div class="brief-picker-head">
          <div class="overlay-heading">
            <p class="eyebrow">References</p>
            <h2 id="brief-picker-title">Saved references</h2>
          </div>
          <p class="brief-picker-copy">Favourites are added to your reference board automatically.</p>
        </div>
        <div class="brief-picker-body">
          ${savedStyles.length ? `
            <div class="brief-picker-grid">
              ${savedStyles.map((style) => {
                const added = inBrief.has(style.id);
                return `
                  <button
                    class="brief-picker-item ${added ? "is-added" : ""}"
                    type="button"
                    data-brief-add-saved="${escapeAttr(style.id)}"
                    ${added ? "disabled" : ""}
                    aria-label="${added ? "Already in brief" : "Add to brief"}: ${escapeAttr(style.name)}"
                  >
                    <span class="brief-picker-thumb">
                      ${style.imageUrl ? `<img src="${escapeAttr(style.imageUrl)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ""}
                    </span>
                    <span class="brief-picker-name">${escapeHtml(style.name)}</span>
                    <span class="brief-picker-flag">${added ? "Added" : "Add"}</span>
                  </button>
                `;
              }).join("")}
            </div>
          ` : `<p class="brief-picker-empty">No saved styles yet. Save styles from search or results and they'll show up here.</p>`}
        </div>
      </div>
    </div>
  `;
}

// A reference's controls: a "Favourite" toggle and a comment icon that reveals
// a notes textarea. The note panel is collapsed by default; the icon shows an
// active dot whenever a note exists so it's discoverable while hidden.
// The note toggle is overlaid on the reference image (like the remove button),
// so the card carries no body and leaves no empty padding behind.
function renderBriefNoteToggle(item) {
  return "";
}

// The note panel lives directly under the image and collapses fully (display:
// none) until the overlay toggle opens it, so there's no whitespace by default.
function renderBriefNotePanel(item) {
  const notePlaceholder = "Leave a note for your stylist";
  return `
    <label class="brief-annotation-label" data-brief-note-panel="${escapeAttr(item.id)}" hidden>
      <span>Notes</span>
      <textarea
        class="brief-annotation"
        data-brief-note="${escapeAttr(item.id)}"
        rows="2"
        placeholder="${escapeAttr(notePlaceholder)}"
      >${escapeHtml(item.annotation || "")}</textarea>
    </label>`;
}

function renderBriefItem(item) {
  const isOwnHair = itemPartition(item) === "me";
  return `
    <article class="profile-photo-card brief-card" data-brief-id="${escapeAttr(item.id)}">
      <div class="profile-photo-frame brief-card-image">
        ${item.imageUrl
          ? `<img src="${escapeAttr(item.imageUrl)}" alt="${escapeAttr(item.name || "Reference image")}" loading="lazy" referrerpolicy="no-referrer">`
          : `<span>${escapeHtml(item.name || "Reference")}</span>`}
        <button class="profile-photo-remove brief-remove-btn" type="button" data-brief-remove="${escapeAttr(item.id)}" aria-label="Remove from brief">&times;</button>
      </div>
      ${isOwnHair ? "" : renderReferenceCaption(item)}
    </article>
  `;
}

function profileHeartIcon(filled = false) {
  return filled
    ? `<svg viewBox="0 0 24 24" aria-hidden="true" fill="currentColor"><path d="M12 21s-7.5-4.9-10-9.4C.4 8.3 1.9 4.8 5.3 4.8c2 0 3.4 1.2 4.2 2.5C10.3 6 11.7 4.8 13.7 4.8c3.4 0 4.9 3.5 3.3 6.8C16.5 16.1 12 21 12 21z"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7.5-4.9-10-9.4C.4 8.3 1.9 4.8 5.3 4.8c2 0 3.4 1.2 4.2 2.5C10.3 6 11.7 4.8 13.7 4.8c3.4 0 4.9 3.5 3.3 6.8C16.5 16.1 12 21 12 21z"/></svg>`;
}

function renderReferenceCaption(item) {
  const isSaved = item.source === "saved";
  const title = isSaved ? (item.name || "Saved haircut") : "Uploaded";
  return `
    <div class="profile-ref-caption">
      <b>${escapeHtml(title)}</b>
    </div>
  `;
}

function wireBriefItemCard(card) {
  if (!card) return;

  card.querySelectorAll("[data-brief-remove]").forEach((button) => {
    button.addEventListener("click", () => removeBriefItem(button.dataset.briefRemove));
  });
  card.querySelectorAll("[data-brief-self-style]").forEach((button) => {
    button.addEventListener("click", () => {
      setBriefSelfStyle(button.dataset.briefSelfStyle, button.dataset.selfStyleValue);
    });
  });
  card.querySelectorAll("[data-brief-first-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      setBriefFirstChoice(button.dataset.briefFirstChoice);
    });
  });
  card.querySelectorAll("[data-brief-note-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.briefNoteToggle;
      const panel = card.querySelector(`[data-brief-note-panel="${CSS.escape(id)}"]`);
      if (!panel) return;
      const open = panel.hasAttribute("hidden");
      panel.toggleAttribute("hidden", !open);
      button.setAttribute("aria-expanded", String(open));
      if (open) panel.querySelector("textarea")?.focus();
    });
  });
  card.querySelectorAll("[data-brief-note]").forEach((area) => {
    area.addEventListener("input", () => {
      updateBriefNote(area.dataset.briefNote, area.value);
      // Keep the comment icon's active dot in sync without a re-render.
      const toggle = card.querySelector(`[data-brief-note-toggle="${CSS.escape(area.dataset.briefNote)}"]`);
      if (toggle) toggle.classList.toggle("has-note", Boolean(area.value.trim()));
    });
  });
}

function insertBriefItemCard(item) {
  const container = itemPartition(item) === "me" ? $("#brief-me-grid") : $("#brief-ref-grid");
  if (!container) return false;

  const marker = itemPartition(item) === "me" ? container.querySelector(".brief-add-self") : container.querySelector(".brief-add-ref");
  const host = document.createElement("div");
  host.innerHTML = renderBriefItem(item).trim();
  const card = host.firstElementChild;
  if (!card) return false;

  if (marker) container.insertBefore(card, marker);
  else container.appendChild(card);

  wireBriefItemCard(card);
  return true;
}

function wireBrief() {
  const shareBtn = $("#brief-share-btn");
  if (shareBtn) {
    shareBtn.addEventListener("click", () => {
      if (shareBtn.dataset.briefShareDirect !== undefined) handleProfileShareDirect();
      else openBriefCompletePrompt();
    });
  }
  const mobileShareBtn = $("#profile-mobile-share-btn");
  if (mobileShareBtn) {
    mobileShareBtn.addEventListener("click", handleProfileShareDirect);
  }
  const shareUrlBtn = $("#brief-url-share-btn");
  if (shareUrlBtn) {
    shareUrlBtn.addEventListener("click", handleBriefCopyLink);
  }
  const completeOverlay = $("#brief-complete-overlay");
  if (completeOverlay) {
    completeOverlay.addEventListener("click", (event) => {
      if (event.target === completeOverlay) closeBriefCompletePrompt();
    });
  }
  const completeClose = $("#brief-complete-close");
  if (completeClose) {
    completeClose.addEventListener("click", closeBriefCompletePrompt);
  }
  const completeSkip = $("#brief-complete-skip");
  if (completeSkip) {
    completeSkip.addEventListener("click", () => completeBriefFromPrompt(false));
  }
  const completeConfirm = $("#brief-complete-confirm");
  if (completeConfirm) {
    completeConfirm.addEventListener("click", () => completeBriefFromPrompt(true));
  }
  // Hair-colour fields update state silently (no re-render) so the current
  // input keeps focus while the user types.
  const detailFields = [
    ["brief-allergies", "allergies"],
    ["brief-previous", "previousTreatments"],
    ["brief-damage", "damage"],
    ["brief-notes", "notes"]
  ];
  detailFields.forEach(([id, key]) => {
    const node = $(`#${id}`);
    if (node) node.addEventListener("input", () => updateBriefDetail(key, node.value));
  });
  wireHairColourSelect();
  const colourCareTab = $("#brief-details-accordion");
  if (colourCareTab && colourCareTab.tagName === "DETAILS") {
    colourCareTab.addEventListener("toggle", () => {
      setBriefDetailsOpen(colourCareTab.open);
      renderBrief();
    });
  }
  const removeBriefDetailsBtn = $("[data-remove-brief-details]");
  if (removeBriefDetailsBtn) {
    removeBriefDetailsBtn.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      removeBriefDetails();
    });
  }
  // Uploads from the "Me" tile go straight into the Me partition.
  const selfInput = $("#brief-self-input");
  if (selfInput) {
    selfInput.addEventListener("change", (event) => {
      handleBriefUpload(event.target.files, "me");
      event.target.value = "";
    });
  }
  // The References tile's "Upload from device" option files into References.
  const refInput = $("#brief-ref-input");
  if (refInput) {
    refInput.addEventListener("change", (event) => {
      handleBriefUpload(event.target.files, "references");
      event.target.value = "";
      closeBriefRefAdd();
    });
  }
  const refAddOverlay = $("#brief-ref-add-overlay");
  if (refAddOverlay) {
    refAddOverlay.addEventListener("click", (event) => {
      if (event.target === refAddOverlay) closeBriefRefAdd();
    });
  }
  const refAddClose = $("#brief-ref-add-close");
  if (refAddClose) {
    refAddClose.addEventListener("click", closeBriefRefAdd);
  }
  const pickerOverlay = $("#brief-picker-overlay");
  if (pickerOverlay) {
    pickerOverlay.addEventListener("click", (event) => {
      if (event.target === pickerOverlay) closeBriefPicker();
    });
  }
  const pickerClose = $("#brief-picker-close");
  if (pickerClose) {
    pickerClose.addEventListener("click", closeBriefPicker);
  }
  document.querySelectorAll("[data-brief-add-saved]").forEach((button) => {
    button.addEventListener("click", () => addSavedToBrief(button.dataset.briefAddSaved, button));
  });
  // Reference notes update state silently (no re-render) so the textarea keeps
  // focus and the caret position while the user types.
  document.querySelectorAll(".brief-card").forEach(wireBriefItemCard);
}

function addSavedToBrief(styleId, button = null) {
  const style = state.styles.find((item) => item.id === String(styleId));
  if (!style) return;
  if (state.brief.some((item) => item.styleId === style.id)) return;
  const item = savedReferenceItem(style);
  setBrief([item, ...state.brief]);
  refreshShareButton();

  if (button) {
    button.disabled = true;
    button.classList.add("is-added");
    const flag = button.querySelector(".brief-picker-flag");
    if (flag) flag.textContent = "Added";
  }

  if (state.view === "brief" && state.briefPickerOpen && insertBriefItemCard(item)) return;
  renderBrief();
}

function addBriefImage(imageUrl, name, partition) {
  const item = {
    id: briefItemId(),
    source: "upload",
    imageUrl,
    name,
    partition,
    firstChoice: false,
    annotation: "",
    hairstyleStatus: partition === "me" ? "current" : ""
  };
  setBrief([item, ...state.brief]);
  if (state.view === "brief") renderBrief();
  return item;
}

// Reads the uploaded files and files each one into the given partition ("me" or
// "references"), which is decided by the tile the upload came from.
async function handleBriefUpload(fileList, partition) {
  const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
  for (const file of files) {
    try {
      const imageData = await imageFileToDataUrl(file);
      addBriefImage(imageData, file.name, partition);
      if (partition === "me") {
        mirrorSelfPhotoToApi(imageData, file.name || "Profile selfie", "Profile selfie");
      }
    } catch {
      // Skip files that can't be read as an image.
    }
  }
}

function removeBriefItem(id) {
  const item = state.brief.find((entry) => entry.id === id);
  if (item?.source === "saved" && item.styleId) {
    const imageId = String(item.styleId);
    state.favourites.delete(imageId);
    pendingFavouriteOps.set(imageId, "delete");
    updateFavouriteCount();
    apiJson(API.favorites, {
      method: "DELETE",
      body: JSON.stringify({ sessionId: state.sessionId, imageId })
    }).catch(() => {}).finally(() => pendingFavouriteOps.delete(imageId));
  }
  setBrief(state.brief.filter((item) => item.id !== id));
  renderBrief();
}

function setBriefSelfStyle(id, value) {
  setBrief(state.brief.map((item) => {
    if (item.id !== id) return item;
    if (itemPartition(item) !== "me") return item;
    const nextValue = value === "current" || value === "past" ? value : "";
    return {
      ...item,
      hairstyleStatus: selfHairstyleStatus(item) === nextValue ? "" : nextValue
    };
  }));
  renderBrief();
}

// "Favourite" is a per-reference toggle: clicking it on a marked reference
// clears the flag again. Multiple references can be flagged independently.
// Toggling repositions the item to the favourites/non-favourites boundary among
// references, so a newly-favourited item becomes the rightmost favourite (and an
// un-favourited one becomes the leftmost non-favourite).
function setBriefFirstChoice(id) {
  const target = state.brief.find((item) => item.id === id);
  if (!target) return;
  const nowFavourite = !target.firstChoice;

  const refs = state.brief
    .filter((item) => itemPartition(item) === "references")
    .map((item) => (item.id === id ? { ...item, firstChoice: nowFavourite } : item));
  const toggled = refs.find((item) => item.id === id);
  const others = refs.filter((item) => item.id !== id);
  const orderedRefs = [
    ...others.filter((item) => item.firstChoice),
    toggled,
    ...others.filter((item) => !item.firstChoice)
  ];

  // Splice the reordered references back into their slots, leaving "me" items put.
  let refIndex = 0;
  const next = state.brief.map((item) =>
    itemPartition(item) === "references" ? orderedRefs[refIndex++] : item
  );
  setBrief(next);
  renderBrief();
}

function updateBriefNote(id, value) {
  setBrief(state.brief.map((item) => (item.id === id ? { ...item, annotation: value } : item)));
}

async function mirrorSelfPhotoToApi(imageData, label, description) {
  try {
    await apiJson(API.userPhotos, {
      method: "POST",
      body: JSON.stringify({
        sessionId: state.sessionId,
        label,
        imageData,
        description,
        features: ["profile-selfie"]
      })
    });
  } catch {
    // Profile is local-first; API mirroring should not block the visible card.
  }
}

