// ---------- Sharing the brief ----------
// Every edit auto-saves to the server so the share link always reflects the
// latest state ("live brief"). Saves are debounced to avoid a request per
// keystroke; the server upserts by session so the share id (link) stays stable.
let briefSyncTimer = null;
let briefSyncInFlight = false;
let briefSyncQueued = false;

function scheduleBriefSync() {
  if (briefSyncTimer) clearTimeout(briefSyncTimer);
  const delay = state.briefId ? 800 : 160;
  briefSyncTimer = setTimeout(() => {
    briefSyncTimer = null;
    syncBrief();
  }, delay);
}

async function syncBrief() {
  if (briefSyncInFlight) {
    briefSyncQueued = true;
    return null;
  }
  briefSyncInFlight = true;
  try {
    const data = await apiJson(API.briefs, {
      method: "POST",
      body: JSON.stringify({ id: state.briefId || undefined, sessionId: state.sessionId, items: state.brief, details: briefDetailsPayload() })
    });
    if (data.item?.id && data.item.id !== state.briefId) {
      state.briefId = data.item.id;
      writeStored(BRIEF_ID_KEY, state.briefId);
    }
    if (Array.isArray(data.item?.feedback)) {
      state.ownerFeedback = data.item.feedback;
    }
    return data.item;
  } catch {
    return null;
  } finally {
    briefSyncInFlight = false;
    if (briefSyncQueued) {
      briefSyncQueued = false;
      syncBrief();
    }
  }
}

// Force a save (flushing any pending debounce) and return the share id. Used by
// the Share button so the link reflects the very latest edits before copying.
async function flushBriefSync() {
  if (briefSyncTimer) {
    clearTimeout(briefSyncTimer);
    briefSyncTimer = null;
  }
  const item = await syncBrief();
  return item?.id || null;
}

function briefShareLink() {
  if (!state.briefId) return "";
  return `${window.location.origin}/?brief=${encodeURIComponent(state.briefId)}&review=1`;
}

function prefersNativeBriefShare() {
  const uaDataMobile = navigator.userAgentData?.mobile;
  if (typeof uaDataMobile === "boolean") return uaDataMobile;
  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "");
}

async function handleBriefComplete() {
  setShareStatus("Completing your profile...");
  let id = state.briefId;
  try {
    id = await flushBriefSync();
  } catch {
    id = state.briefId;
  }
  if (!id) {
    setShareStatus("Couldn't complete your profile. Check your connection and try again.");
    return;
  }
  const link = briefShareLink();
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && !state.briefPickerOpen && !state.briefRefAddOpen) {
    document.body.style.overflow = "";
  }
  setShareStatus("Style complete", link);
  renderBrief();
}

function fallbackCopyText(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "0";
  textarea.style.top = "0";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }
  textarea.remove();
  return copied;
}

async function writeClipboardText(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext !== false) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to the legacy selection-based copy path.
    }
  }
  return fallbackCopyText(text);
}

async function copyBriefShareLink(link) {
  if (!link) {
    setShareStatus("Complete your profile first to create a share URL.");
    return false;
  }

  setShareStatus("Copying share URL...", link);
  const copied = await writeClipboardText(link);
  if (copied) {
    setShareStatus("Share URL copied to clipboard.", link);
    return true;
  }

  setShareStatus(`Share URL ready. Copy this URL: ${link}`, link);
  return false;
}

function ensureBriefShareId() {
  if (state.briefId) return state.briefId;
  state.briefId = window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `brief-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  writeStored(BRIEF_ID_KEY, state.briefId);
  return state.briefId;
}

function ensureShareableBriefLink() {
  if (!briefHasContent()) {
    setShareStatus("Add a photo, reference, colour detail, or note before sharing.");
    return "";
  }
  ensureBriefShareId();
  const link = briefShareLink();
  setShareStatus("Preparing share URL...", link);
  return link;
}

async function persistShareableBrief(link) {
  const id = await flushBriefSync();
  if (!id) {
    setShareStatus("Couldn't save your share URL. Check your connection and try again.", link);
    return false;
  }
  state.shareLink = link;
  return true;
}

async function handleBriefCopyLink() {
  const link = ensureShareableBriefLink();
  if (!link) return false;

  const savePromise = persistShareableBrief(link);
  const copied = await copyBriefShareLink(link);
  const saved = await savePromise;
  if (copied && saved) setShareStatus("Share URL copied to clipboard.", link);
  return Boolean(saved && copied);
}

async function handleBriefUrlShare() {
  const link = ensureShareableBriefLink();
  if (!link) {
    return false;
  }

  const savePromise = persistShareableBrief(link);
  if (prefersNativeBriefShare() && typeof navigator.share === "function") {
    const shareData = {
      title: "HairMatch style profile",
      text: "Here's my HairMatch style profile.",
      url: link
    };
    try {
      if (typeof navigator.canShare === "function" && !navigator.canShare(shareData)) {
        throw new Error("Share data is not supported.");
      }
      await navigator.share(shareData);
      const saved = await savePromise;
      if (saved) setShareStatus("Share URL ready.", link);
      return Boolean(saved);
    } catch (error) {
      if (error?.name === "AbortError") {
        if (await savePromise) setShareStatus("Share URL ready.", link);
        return false;
      }
    }
  }

  const copied = await copyBriefShareLink(link);
  const saved = await savePromise;
  if (copied && saved) setShareStatus("Share URL copied to clipboard.", link);
  return Boolean(saved && copied);
}

function startNewBriefDraft() {
  state.briefId = null;
  writeStored(BRIEF_ID_KEY, state.briefId);
}

function rememberCompletedBrief(id = state.briefId) {
  const briefId = String(id || "").trim();
  if (!briefId) return;
  const ids = Array.isArray(state.completedBriefIds) ? state.completedBriefIds : [];
  state.completedBriefIds = [briefId, ...ids.filter((item) => item !== briefId)].slice(0, 30);
  writeStored(COMPLETED_BRIEF_IDS_KEY, state.completedBriefIds);
}

function setShareStatus(message, link = "") {
  state.shareStatus = message;
  state.shareLink = link;
  const node = $("#brief-share-status");
  if (node) {
    const label = node.querySelector("span");
    if (label) label.textContent = message;
    else node.textContent = message;
    node.hidden = !message;
    if (link) node.dataset.link = link;
    else delete node.dataset.link;
  }

  const completeNode = $("#brief-complete-share-status");
  if (completeNode) {
    const label = completeNode.querySelector("span");
    if (label) label.textContent = message;
    else completeNode.textContent = message;
    completeNode.hidden = !message;
  }

  if (link) {
    const field = document.querySelector(".profile-link-field > span");
    if (field) field.textContent = link;
    const copyBtn = $("#brief-url-share-btn");
    if (copyBtn) copyBtn.disabled = false;
  }
}

