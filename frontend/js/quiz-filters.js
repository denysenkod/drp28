// ---------- Quiz helpers ----------
function getQuestionById(id) {
  return DISCOVERY_FILTER_QUESTIONS.find((q) => q.id === id);
}

function getOptionLabel(questionId, value) {
  const question = getQuestionById(questionId);
  const option = question?.options.find((item) => item.value === value);
  return option?.label || value;
}

function preferenceOptions(question) {
  return (question?.options || []).filter((option) => !option.exclusive && !option.selectAll);
}

function selectedPreferenceValues(question) {
  const allowed = new Set(preferenceOptions(question).map((option) => option.value));
  return selectedFor(question).filter((value) => allowed.has(value));
}

function selectedFor(question) {
  return Array.isArray(state.answers[question.id]) ? state.answers[question.id] : [];
}

function selectQuizOption(question, option) {
  const current = new Set(selectedFor(question));
  const realValues = question.options
    .filter((item) => !item.selectAll && !item.exclusive)
    .map((item) => item.value);

  let next;
  if (option.selectAll) {
    const allOn = realValues.every((value) => current.has(value)) && current.has(option.value);
    next = allOn ? [] : [...realValues, option.value];
  } else if (option.exclusive) {
    next = current.has(option.value) ? [] : [option.value];
  } else {
    current.delete("__all");
    question.options.filter((item) => item.exclusive).forEach((item) => current.delete(item.value));
    if (current.has(option.value)) current.delete(option.value);
    else current.add(option.value);
    next = [...current];
  }

  setAnswers({ ...state.answers, [question.id]: next });

  // The length options depend on the chosen gender, so changing the style answer
  // can leave previously picked length values pointing at options that no longer
  // exist. Remap them to the new gender's options.
  if (question.id === "style") {
    setAnswers({ ...state.answers, length: reconcileLengthAnswers() });
  }
}

// Reconciles stored length answers with the options available for the current
// survey gender: switching to "both" expands a plain length to both genders,
// switching to a single gender strips the gender prefix back to the base length.
function reconcileLengthAnswers() {
  const current = selectedFor(getQuestionById("length"));
  if (!current.length) return current;

  const validValues = new Set(buildLengthOptions().map((option) => option.value));
  const expandToBoth = selectedSurveyGender() === "both";
  const next = [];

  for (const value of current) {
    if (validValues.has(value)) {
      next.push(value);
    } else if (expandToBoth) {
      for (const variant of LENGTH_GENDER_VARIANTS) {
        const expanded = `${variant.prefix}:${value}`;
        if (validValues.has(expanded)) next.push(expanded);
      }
    } else {
      const base = value.includes(":") ? value.split(":")[1] : value;
      if (validValues.has(base)) next.push(base);
    }
  }

  return [...new Set(next)];
}

function toggleQuizOption(question, option) {
  selectQuizOption(question, option);
  // Always update card states in-place; never a full re-render here.
  // A full re-render resets scroll position to 0 which causes visible jumping.
  // Length options for later steps are computed fresh when those steps render,
  // so there's no need to re-render the current step when style changes.
  const selected = selectedFor(question);
  document.querySelectorAll("[data-option-value]").forEach((btn) => {
    const on = selected.includes(btn.dataset.optionValue);
    btn.classList.toggle("is-on", on);
    btn.setAttribute("aria-pressed", String(on));
    const checkEl = btn.querySelector(".option-check");
    if (checkEl) checkEl.innerHTML = on ? iconCheck() : "";
  });
  const footerSpan = document.querySelector(".quiz-footer > span");
  if (footerSpan) {
    const count = selected.filter((v) => v !== "__all").length || selected.length;
    footerSpan.innerHTML = selected.length ? `<b>${count}</b> selected` : "";
  }
  const labelEl = document.querySelector("#quiz-next-label");
  if (labelEl) {
    const isLast = state.quizStep === QUIZ.length - 1;
    labelEl.textContent = selected.length ? (isLast ? "Show me results" : "Continue") : "Skip";
  }
}

// Returns the survey gender picked in the style question:
//  - "masculine" / "feminine" when exactly one gender is chosen
//  - "both" when nothing, "everything", or multiple genders are chosen.
//    "both" is the mixed-gender sentinel that drives a male/female mix in
//    later questions (e.g. length), so "Show me everything" shows both.
function selectedSurveyGender() {
  const styleQuestion = getQuestionById("style");
  if (!styleQuestion) return null;
  const selected = selectedFor(styleQuestion);
  const everything = selected.includes("__all");
  const picked = selected.filter((value) => value !== "__all");
  if (everything || picked.length === 0) return "both";
  return picked.length === 1 ? picked[0] : "both";
}

function isQuizOptionSelected(question, option, selected) {
  return selected.includes(option.value);
}

function getRepresentativeImages() {
  const men = state.styles.find((style) => style.gender === "Men")?.imageUrl;
  const women = state.styles.find((style) => style.gender === "Women")?.imageUrl;
  const unisex = state.styles.find((style) => style.gender === "Unisex")?.imageUrl;
  const backup = state.styles.map((style) => style.imageUrl).filter(Boolean);
  return {
    masculine: men || backup[0],
    feminine: women || backup[1] || backup[0],
    androgynous: unisex || backup[2] || backup[0],
    collage: [men, women, unisex, backup[3], backup[4]].filter(Boolean)
  };
}

function getQuizOptionMedia(question, option) {
  const gender = selectedSurveyGender();
  let genderedImage = "";
  if (option.images) {
    if (option.gender) {
      // The option is already pinned to a gender (e.g. a "both" length variant).
      const key = option.gender === "Men" ? "masculine" : "feminine";
      genderedImage = option.images[key] || "";
    } else if (gender === "both") {
      // Alternate male/female across the option grid so the survey shows a mix.
      const index = question.options.indexOf(option);
      const order = index % 2 === 0 ? ["masculine", "feminine"] : ["feminine", "masculine"];
      genderedImage = option.images[order[0]] || option.images[order[1]] || "";
    } else if (gender) {
      genderedImage = option.images[gender] || "";
    }
  }
  const image = genderedImage || option.image;
  if (image) {
    return `<img src="${image}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }
  if (question.id === "style") {
    const reps = getRepresentativeImages();
    if (option.selectAll) {
      const images = reps.collage.length ? reps.collage : state.styles.slice(0, 4).map((style) => style.imageUrl).filter(Boolean);
      return `<div class="option-collage">${images.slice(0, 4).map((src) => `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`).join("")}</div>`;
    }
    const src = reps[option.value];
    if (src) return `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
  }
  if (option.icon) return option.icon;
  return iconCheck();
}

function summarizeAnswers() {
  const chips = [];
  for (const question of DISCOVERY_FILTER_QUESTIONS) {
    const selected = selectedPreferenceValues(question);
    if (!selected.length) continue;
    const values = selected.map((value) => getOptionLabel(question.id, value));
    if (values.length) chips.push({ questionId: question.id, label: shortQuestionLabel(question.id), value: values.join(", ") });
  }
  return chips;
}

function selectedAnswerCount() {
  return DISCOVERY_FILTER_QUESTIONS.reduce((total, question) => total + selectedPreferenceValues(question).length, 0);
}

function shortQuestionLabel(id) {
  return {
    style: "Style",
    texture: "Texture",
    ethnicity: "Ethnicity",
    hair_colour: "Hair Colour",
    hair_thickness: "Thickness",
    face: "Face",
    length: "Length",
    maintenance: "Maintenance",
    vibe: "Vibe"
  }[id] || id;
}

function answerOptions(questionId) {
  const question = getQuestionById(questionId);
  const selected = state.answers[questionId] || [];
  return selected.map((value) => question?.options.find((option) => option.value === value)).filter(Boolean);
}

function styleHaystack(style) {
  const fields = [
    style.id,
    style.name,
    style.imageUrl,
    style.description,
    style.length,
    style.hairType,
    style.hairSubtype,
    style.hairThickness,
    style.ethnicity,
    style.celebrity,
    style.gender,
    style.maintenanceLevel,
    style.faceShape,
    style.vibe,
    style.hairColour,
    style.haircutName,
    style.maintenance,
    style.classifiedAt,
    style.analysisModel,
    style.createdAt,
    ...(style.labels || []),
    ...(style.features || [])
  ];

  return normalizeSearchText(fields.join(" "));
}

function normalizeSearchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function optionKeywordMatch(style, option) {
  const haystack = styleHaystack(style);
  return (option.keywords || []).some((keyword) => haystack.includes(String(keyword).toLowerCase()));
}

function optionVibeMatch(style, option) {
  return Boolean(option.vibe && style.vibe === option.vibe);
}

function optionUpkeepMatch(style, option) {
  return Boolean(option.upkeep && style.maintenanceLevel === option.upkeep);
}

function optionEthnicityMatch(style, option) {
  return Boolean(option.value && option.value !== "none" && style.ethnicity === option.value);
}

function hairColourKey(value) {
  const text = normalizeSearchText(value);
  if (!text) return "";
  if (text.includes("black")) return "black";
  if (text.includes("brown") || text.includes("brunette")) return "brown";
  if (text.includes("blonde") || text.includes("blond")) return "blonde";
  if (text.includes("red") || text.includes("auburn") || text.includes("ginger")) return "red";
  if (text.includes("grey") || text.includes("gray") || text.includes("silver")) return "grey";
  return "other";
}

function optionHairColourMatch(style, option) {
  return Boolean(option.value && option.value !== "none" && hairColourKey(style.hairColour) === option.value);
}

function optionHairThicknessMatch(style, option) {
  return Boolean(option.value && option.value !== "none" && style.hairThickness === option.value);
}

function optionLengthMatch(style, option) {
  if (!option.length) return true;
  if (style.length !== option.length) return false;
  // Gendered length variants (from a "both" survey) only match their own
  // gender; Unisex styles fit either a male or female length request.
  if (option.gender && style.gender !== option.gender && style.gender !== "Unisex") return false;
  return true;
}

function hashStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

function seededShuffle(arr, seed) {
  const result = [...arr];
  let s = seed >>> 0;
  for (let i = result.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function answerSeed() {
  const key = Object.entries(state.answers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
    .join("|");
  return hashStr(key);
}

function scoreStyle(style) {
  let score = 0;
  const haystack = styleHaystack(style);

  for (const option of answerOptions("style")) {
    if (option.selectAll) score += 1;
    else if (style.gender === option.gender) score += 8;
  }

  for (const option of answerOptions("texture")) {
    if (option.hairType && style.hairType === option.hairType) score += 5;
    if (["fine", "thick"].includes(option.value) && haystack.includes(option.value)) score += 2;
  }

  for (const option of answerOptions("length")) {
    if (option.length && optionLengthMatch(style, option)) score += 5;
  }

  for (const option of answerOptions("vibe")) {
    if (optionVibeMatch(style, option)) score += 5;
    for (const keyword of option.keywords || []) {
      if (haystack.includes(keyword)) score += 2;
    }
  }

  for (const option of answerOptions("ethnicity")) {
    if (optionEthnicityMatch(style, option)) score += 5;
  }

  for (const option of answerOptions("hair_colour")) {
    if (optionHairColourMatch(style, option)) score += 4;
  }

  for (const option of answerOptions("hair_thickness")) {
    if (optionHairThicknessMatch(style, option)) score += 4;
  }

  for (const option of answerOptions("face")) {
    if (option.faceShape && style.faceShape === option.faceShape) score += 4;
  }

  return score;
}

function answerFilteredStyles() {
  return state.styles.filter(stylePassesAnswerFilters);
}

function scoredStyles(styles = state.styles) {
  const styleAnswers = answerOptions("style").filter((option) => !option.selectAll);
  const hardFiltered = styleAnswers.length
    ? styles.filter((style) => styleAnswers.some((option) => style.gender === option.gender))
    : styles;
  const source = hardFiltered.length ? hardFiltered : styles;
  const seed = answerSeed();
  return [...source].sort((a, b) => {
    const scoreDiff = scoreStyle(b) - scoreStyle(a);
    if (scoreDiff !== 0) return scoreDiff;
    return hashStr(a.id + seed) - hashStr(b.id + seed);
  });
}

function optionGroupPasses(style, questionId, matcher) {
  const options = answerOptions(questionId).filter((option) => !option.exclusive && !option.selectAll);
  if (!options.length) return true;
  return options.some((option) => matcher(option));
}

function stylePassesAnswerFilters(style) {
  const styleAnswers = answerOptions("style").filter((option) => !option.selectAll);
  if (styleAnswers.length && !styleAnswers.some((option) => style.gender === option.gender)) {
    return false;
  }

  if (!optionGroupPasses(style, "texture", (option) => {
    if (option.hairType) return style.hairType === option.hairType;
    if (["fine", "thick"].includes(option.value)) return styleHaystack(style).includes(option.value);
    return true;
  })) {
    return false;
  }

  if (!optionGroupPasses(style, "length", (option) => optionLengthMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "face", (option) => option.faceShape ? style.faceShape === option.faceShape : true)) {
    return false;
  }

  if (!optionGroupPasses(style, "ethnicity", (option) => optionEthnicityMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "hair_colour", (option) => optionHairColourMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "hair_thickness", (option) => optionHairThicknessMatch(style, option))) {
    return false;
  }

  if (!optionGroupPasses(style, "vibe", (option) => optionVibeMatch(style, option) || optionKeywordMatch(style, option))) {
    return false;
  }

  return true;
}

