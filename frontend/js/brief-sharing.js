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
      body: JSON.stringify({ sessionId: state.sessionId, items: state.brief, details: briefDetailsPayload() })
    });
    if (data.item?.id && data.item.id !== state.briefId) {
      state.briefId = data.item.id;
      writeStored(BRIEF_ID_KEY, state.briefId);
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
  await syncBrief();
  return state.briefId;
}

function briefShareLink() {
  if (!state.briefId) return "";
  return `${window.location.origin}/?brief=${encodeURIComponent(state.briefId)}`;
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
  state.briefCompletePromptOpen = false;
  if (els.detailOverlay.hidden && els.favouritesOverlay.hidden && els.productOverlay.hidden && !state.briefPickerOpen && !state.briefRefAddOpen) {
    document.body.style.overflow = "";
  }
  setShareStatus("Style complete", link);
  renderBrief();
}

async function copyBriefShareLink(link) {
  let copied = false;
  try {
    await navigator.clipboard?.writeText(link);
    copied = true;
  } catch {
    copied = false;
  }
  setShareStatus(copied ? "Style complete. URL copied to clipboard." : `Style complete. Copy this URL: ${link}`, link);
}

async function handleBriefUrlShare() {
  const link = state.shareLink || briefShareLink();
  if (!link) {
    setShareStatus("Complete your profile first to create a share URL.");
    return;
  }

  if (prefersNativeBriefShare() && typeof navigator.share === "function") {
    try {
      await navigator.share({
        title: "HairMatch style profile",
        text: "Here's my HairMatch style profile.",
        url: link
      });
      setShareStatus("Style complete", link);
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }

  await copyBriefShareLink(link);
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
}

