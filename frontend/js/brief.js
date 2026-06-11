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

// Optional hair-colour details. Persisted alongside the brief items and synced
// so they reach the stylist who opens the share link.
function setBriefDetails(next) {
  const cleaned = {
    colour: String(next?.colour || ""),
    allergies: String(next?.allergies || ""),
    previousTreatments: String(next?.previousTreatments || ""),
    damage: String(next?.damage || ""),
    notes: String(next?.notes || "")
  };
  state.briefDetails = cleaned;
  writeStored(BRIEF_DETAILS_KEY, cleaned);
  scheduleBriefSync();
}

function updateBriefDetail(key, value) {
  setBriefDetails({ ...state.briefDetails, [key]: value });
  refreshShareButton();
}

// A brief is worth sharing once it has any item, general notes, or hair-colour
// details.
function briefHasContent() {
  if (state.brief.length) return true;
  if (briefNotesValue()) return true;
  return briefDetailsIsOpen() && briefDetailsHasContent(state.briefDetails);
}

function refreshShareButton() {
  const btn = $("#brief-share-btn");
  if (btn) btn.disabled = !briefHasContent();
}

