// ---------- My style brief ----------
// A working mood board the user assembles for their stylist, split into two
// partitions so they can separate themselves from their inspiration:
//   - "me"          photos of the user's own hair
//   - "references"  styles on other people (uploads or saved gallery favourites)
// References can be marked as a "Favourite" and carry free-text notes.
// Photos are added straight into a partition via that partition's own add
// tile, so the source of the upload decides where it lands.
// The brief lives in localStorage so it survives reloads, and is mirrored to the
// backend (debounced) so the owner can share a link that a stylist can review.
function normalizeBriefItems(items = []) {
  return (items || []).map((item) => (
    itemPartition(item) === "me"
      ? { ...item, partition: "me", hairstyleStatus: "current" }
      : { ...item, firstChoice: false }
  ));
}

function setBrief(next) {
  const normalized = normalizeBriefItems(next);
  state.brief = normalized;
  writeStored(BRIEF_KEY, normalized);
  updateBriefCount();
  scheduleBriefSync();
}

function savedReferenceId(styleId) {
  return `saved-${String(styleId)}`;
}

function savedReferenceItem(style) {
  return {
    id: savedReferenceId(style.id),
    source: "saved",
    styleId: style.id,
    imageUrl: style.imageUrl,
    name: style.name,
    partition: "references",
    firstChoice: true,
    annotation: ""
  };
}

function syncFavouriteReferencesToBrief() {
  const favouriteIds = new Set([...state.favourites].map(String));
  const favouriteStyles = state.styles.filter((style) => favouriteIds.has(style.id));
  if (!favouriteStyles.length && !state.brief.some((item) => item.source === "saved" && item.styleId)) return;

  const byStyleId = new Map(favouriteStyles.map((style) => [style.id, style]));
  const existing = new Set();
  const next = [];
  let changed = false;

  for (const item of state.brief) {
    if (item.source === "saved" && item.styleId) {
      const style = byStyleId.get(String(item.styleId));
      if (!style) {
        changed = true;
        continue;
      }
      existing.add(style.id);
      const updated = {
        ...item,
        id: item.id || savedReferenceId(style.id),
        source: "saved",
        styleId: style.id,
        imageUrl: style.imageUrl,
        name: style.name,
        partition: "references",
        firstChoice: Boolean(item.firstChoice)
      };
      if (JSON.stringify(updated) !== JSON.stringify(item)) changed = true;
      next.push(updated);
    } else {
      next.push(item);
    }
  }

  for (const style of favouriteStyles) {
    if (existing.has(style.id)) continue;
    next.push(savedReferenceItem(style));
    changed = true;
  }

  if (changed) setBrief(next);
}

// Optional hair-colour details. Persisted alongside the brief items and synced
// so they reach the stylist who opens the share link.
function setBriefDetails(next) {
  const colour = normalizeBriefColour(next?.colour);
  const noColourTreatment = isNoColourTreatment(colour);
  const cleaned = {
    colour,
    allergies: noColourTreatment ? "" : String(next?.allergies || ""),
    previousTreatments: noColourTreatment ? "" : String(next?.previousTreatments || ""),
    chemicalHistory: noColourTreatment ? "" : String(next?.chemicalHistory || ""),
    damage: noColourTreatment ? "" : String(next?.damage || ""),
    budgetRange: String(next?.budgetRange || ""),
    desiredMaintenance: String(next?.desiredMaintenance || ""),
    desiredMaintenanceAuto: Boolean(next?.desiredMaintenanceAuto),
    salonTime: String(next?.salonTime || ""),
    notes: String(next?.notes || "")
  };
  state.briefDetails = cleaned;
  writeStored(BRIEF_DETAILS_KEY, cleaned);
  if (noColourTreatment) {
    state.briefDetailsOpen = false;
    writeStored(BRIEF_DETAILS_OPEN_KEY, state.briefDetailsOpen);
  } else if (briefDetailsHasContent(cleaned)) {
    state.briefDetailsOpen = true;
    writeStored(BRIEF_DETAILS_OPEN_KEY, state.briefDetailsOpen);
  }
  scheduleBriefSync();
}

function updateBriefDetail(key, value) {
  setBriefDetails({
    ...state.briefDetails,
    [key]: value,
    ...(key === "desiredMaintenance" ? { desiredMaintenanceAuto: false } : {})
  });
  refreshShareButton();
}

// A brief is worth sharing once it has any item, brief preference, or
// hair-colour details.
function briefHasContent() {
  if (state.brief.length) return true;
  if (briefPreferenceHasContent()) return true;
  return briefDetailsIsOpen() && briefDetailsHasContent(state.briefDetails);
}

function refreshShareButton() {
  const disabled = !briefHasContent();
  document
    .querySelectorAll("#brief-share-btn, #profile-mobile-share-btn, #brief-url-share-btn")
    .forEach((btn) => {
      btn.disabled = disabled;
    });
}

