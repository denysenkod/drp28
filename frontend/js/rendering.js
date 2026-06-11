// ---------- Rendering ----------
function render() {
  syncStylesForCurrentRoute();
  document.body.dataset.view = state.view;
  syncNav();
  updateFavouriteCount();
  updateBriefCount();

  if (state.view === "quiz") renderQuiz();
  else if (state.view === "results") renderResultsPage();
  else if (state.view === "brief") renderBrief();
  else if (state.view === "messages") renderMessages();
  else if (state.view === "shared") renderSharedBrief();
  else renderHome();
}

// Highlight the active destination in the top (desktop) and bottom (mobile) nav.
function syncNav() {
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    btn.classList.toggle("is-active", btn.dataset.nav === state.view);
  });
}

// Home: the "Find me a style" call-to-action that opens the survey, followed by
// a doomscroll feed of the results matching the user's search so far (and
// nothing else -- searching and filtering live on the Search page.
function renderHome() {
  const personalizedResults = computeResults();
  const broadResults = personalizedResults.length
    ? personalizedResults
    : scoredStyles(applyTextSearch(state.styles));
  const emptyMessage = state.galleryLoaded ? "No styles available yet." : "Loading styles...";
  els.app.innerHTML = `
    <section class="home-screen">
      ${state.quizComplete ? "" : `
        <button class="home-cta choice-card" id="find-style-btn" type="button">
          <span class="home-cta-close" id="home-cta-close" role="button" tabindex="0" aria-label="Hide survey prompt">&times;</span>
          <span class="choice-title">Tell us about you</span>
          <span class="choice-action">${QUIZ.length} quick questions ${iconArrow()}</span>
        </button>
      `}

      <section class="results-grid home-feed" id="results-grid">
        ${broadResults.length ? broadResults.map((style) => buildStyleCardHtml(style, false, { hideFooter: true })).join("") : `<p class="empty-state">${emptyMessage}</p>`}
      </section>
    </section>
  `;
  const findStyleBtn = $("#find-style-btn");
  const homeCtaClose = $("#home-cta-close");
  if (findStyleBtn) {
    findStyleBtn.addEventListener("click", () => {
      setAnswers({});
      state.quizComplete = false;
      writeStored(QUIZ_COMPLETE_KEY, state.quizComplete);
      state.quizStep = 0;
      writeStored(STEP_KEY, state.quizStep);
      setView("quiz");
    });
  }
  if (homeCtaClose) {
    const hideHomeCta = (event) => {
      event.preventDefault();
      event.stopPropagation();
      state.quizComplete = true;
      writeStored(QUIZ_COMPLETE_KEY, state.quizComplete);
      renderHome();
    };
    homeCtaClose.addEventListener("click", hideHomeCta);
    homeCtaClose.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") hideHomeCta(event);
    });
  }
  wireCards();
}

function renderQuiz() {
  const question = QUIZ[state.quizStep] || QUIZ[0];
  const selected = selectedFor(question);
  const progress = Math.round(((state.quizStep + 1) / QUIZ.length) * 100);
  const isLast = state.quizStep === QUIZ.length - 1;
  const isScale = question.layout === "scale";
  const isSlider = question.layout === "slider";
  const hasSelection = isSlider || isScale || selected.length > 0;
  const nextLabel = hasSelection ? (isLast ? "Show me results" : "Continue") : "Skip";
  const showLengthGenderToggle = question.id === "length" && selectedSurveyGender() === "both";
  const visibleOptions = showLengthGenderToggle
    ? question.options.filter((o) => o.gender === (state.lengthGenderFilter === "masculine" ? "Men" : "Women"))
    : question.options;
  const quizContentClass = [
    "quiz-content",
    isSlider ? "is-slider" : isScale ? "is-scale" : "is-options"
  ].join(" ");

  els.app.innerHTML = `
    <section class="quiz-screen">
      <div class="quiz-top">
        <div class="progress-wrap" aria-label="Question ${state.quizStep + 1} of ${QUIZ.length}">
          <div class="progress-meta">
            <span>Question <b>${state.quizStep + 1}</b> of ${QUIZ.length}</span>
            <span>${progress}%</span>
          </div>
          <div class="progress-track"><div style="width: ${progress}%"></div></div>
        </div>
      </div>

      <div class="${quizContentClass}">
        <div class="quiz-question">
          <h1>${question.title}</h1>
          ${question.sub ? `<p>${question.sub}</p>` : ""}
          <div class="quiz-question-buttons">
            ${state.quizStep > 0 ? `<button class="secondary-btn" id="quiz-back-btn" type="button">Back</button>` : ""}
            <button class="primary-btn" id="quiz-next-btn" type="button"><span id="quiz-next-label">${nextLabel}</span> ${iconArrow()}</button>
            ${showLengthGenderToggle ? `
              <div class="length-gender-toggle">
                <button class="length-gender-btn ${state.lengthGenderFilter === "masculine" ? "is-active" : ""}" type="button" data-length-gender="masculine" aria-label="Men">${iconMale()}</button>
                <button class="length-gender-btn ${state.lengthGenderFilter === "feminine" ? "is-active" : ""}" type="button" data-length-gender="feminine" aria-label="Women">${iconFemale()}</button>
              </div>
            ` : ""}
          </div>
        </div>

        <div class="quiz-response">
          ${isSlider ? renderSliderQuestion(question, selected) : isScale ? renderScaleQuestion(question, selected) : `
            <div class="option-grid ${question.layout === "text" ? "is-text" : question.layout === "collage" ? "is-collage" : ""}">
              ${visibleOptions.map((option) => renderOption(question, option, isQuizOptionSelected(question, option, selected))).join("")}
            </div>
          `}

          ${question.id === "face" && selected.includes("unknown") ? renderFaceHelper() : ""}
        </div>
      </div>

      <div class="quiz-footer">
        <span>${selected.length ? `<b>${selected.filter((value) => value !== "__all").length || selected.length}</b> selected` : ""}</span>
      </div>
    </section>
  `;

  $("#quiz-next-btn").addEventListener("click", () => {
    if (isLast) {
      state.quizComplete = true;
      writeStored(QUIZ_COMPLETE_KEY, state.quizComplete);
      setView("results");
    } else {
      setQuizStep(state.quizStep + 1);
    }
  });
  const backBtn = $("#quiz-back-btn");
  if (backBtn) {
    backBtn.addEventListener("click", () => setQuizStep(state.quizStep - 1));
  }

  if (isSlider) {
    wireSliderQuestion(question);
  } else if (isScale) {
    wireScaleQuestion(question);
  } else {
    document.querySelectorAll("[data-option-value]").forEach((button) => {
      button.addEventListener("click", () => {
        const option = question.options.find((item) => item.value === button.dataset.optionValue);
        if (option) toggleQuizOption(question, option);
      });
    });
    document.querySelectorAll("[data-length-gender]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.lengthGenderFilter = btn.dataset.lengthGender;
        renderQuiz();
      });
    });
    wireCarouselDots(question);
  }
}

function isMobileViewport() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function wireCarouselDots(question) {
  if (!isMobileViewport() || question.layout === "text" || question.layout === "collage" || question.layout === "slider" || question.layout === "scale") return;

  const grid = document.querySelector(".option-grid:not(.is-text)");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll(".option-card"));
  if (cards.length < 2) return;

  // Insert dot container right after the grid
  const dotsEl = document.createElement("div");
  dotsEl.className = "carousel-dots";
  dotsEl.setAttribute("aria-hidden", "true");
  cards.forEach((_, i) => {
    const dot = document.createElement("span");
    dot.className = "carousel-dot" + (i === 0 ? " is-active" : "");
    dotsEl.appendChild(dot);
  });
  grid.after(dotsEl);

  const dots = Array.from(dotsEl.querySelectorAll(".carousel-dot"));

  function updateDots() {
    const scrollLeft = grid.scrollLeft;
    const cardWidth = cards[0].offsetWidth + 12; // gap = 12px
    const index = Math.round(scrollLeft / cardWidth);
    dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
  }

  grid.addEventListener("scroll", updateDots, { passive: true });
}

function renderOption(question, option, on) {
  const media = question.layout === "text"
    ? ""
    : `<span class="option-media ${option.icon && !option.image ? "is-icon" : ""}">${getQuizOptionMedia(question, option)}</span>`;
  return `
    <button class="option-card ${question.layout === "text" ? "is-text" : ""} ${on ? "is-on" : ""}" type="button" data-option-value="${option.value}" aria-pressed="${on}">
      ${media}
      <span class="option-body">
        <span class="option-label">${option.label}</span>
        ${option.desc ? `<span class="option-desc">${option.desc}</span>` : ""}
      </span>
      <span class="option-check">${on ? iconCheck() : ""}</span>
    </button>
  `;
}

function renderFaceHelper() {
  return `
    <section class="helper-panel">
      <h2>Quick face shape guide</h2>
      <p>Pull your hair back, face a mirror, and compare the widest part of your face with your jaw and overall length.</p>
      <ul>
        <li><b>Oval:</b> longer than wide, gently rounded jaw.</li>
        <li><b>Round:</b> similar width and length with softer angles.</li>
        <li><b>Square:</b> forehead and jaw are similar widths with a stronger jawline.</li>
        <li><b>Heart:</b> wider forehead tapering toward the chin.</li>
        <li><b>Oblong:</b> noticeably longer than it is wide.</li>
      </ul>
    </section>
  `;
}

function renderScaleQuestion(question, selected) {
  const regularOptions = question.options.filter((o) => !o.exclusive);
  const exclusiveOption = question.options.find((o) => o.exclusive);
  const isExclusiveSelected = exclusiveOption && selected.includes(exclusiveOption.value);

  return `
    <div class="scale-question-wrap">
      <div class="scale-options">
        ${regularOptions.map((option) => {
          const isOn = selected.includes(option.value);
          return `
            <button
              class="scale-btn ${isOn ? "is-on" : ""}"
              type="button"
              data-scale-value="${escapeAttr(option.value)}"
              aria-pressed="${isOn}"
            >
              <span class="scale-btn-label">${escapeHtml(option.label)}</span>
              <span class="scale-btn-dot" aria-hidden="true"></span>
            </button>
          `;
        }).join("")}
      </div>
      ${exclusiveOption ? `
        <div class="scale-skip-row">
          <button
            class="scale-skip-btn ${isExclusiveSelected ? "is-selected" : ""}"
            type="button"
            data-scale-value="${escapeAttr(exclusiveOption.value)}"
            aria-pressed="${isExclusiveSelected}"
          >
            ${escapeHtml(exclusiveOption.label)}
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function wireScaleQuestion(question) {
  document.querySelectorAll("[data-scale-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const option = question.options.find((item) => item.value === button.dataset.scaleValue);
      if (!option) return;
      const current = selectedFor(question);
      const isOn = current.includes(option.value);
      if (option.exclusive) {
        setAnswers({ ...state.answers, [question.id]: isOn ? [] : [option.value] });
      } else {
        setAnswers({ ...state.answers, [question.id]: isOn ? [] : [option.value] });
      }
      render();
    });
  });
}

// Product image thumbnails shown under the maintenance selector. They open the
// matching product page when tapped.
// Column count for the product grid: one column per product up to 4, so 3
// products read as a single 3-wide row and 8 wrap into a 2x4 grid.
function sliderProductsColsClass(products) {
  const cols = Math.min((products || []).length || 1, 4);
  return `slider-products--cols-${cols}`;
}

// For the maintenance selector: "Some is fine" highlights a lightweight starter
// trio, "All of it" highlights everything, and "I'd rather not" highlights none.
function maintenanceActiveProductIds(optionValue) {
  if (optionValue === "medium") {
    return new Set(["hair-oil", "gel", "sea-salt-spray"]);
  }
  if (optionValue === "high") {
    return null; // null means all products are active/visible.
  }
  if (optionValue === "low") {
    return new Set();
  }
  return null;
}

function sliderProductsHtml(products, activeIds) {
  return (products || []).map((product) => {
    const src = (product.images && product.images[0]) || "";
    const isActive = !activeIds || activeIds.has(product.id);
    return `
      <a class="slider-product${isActive ? "" : " is-greyed"}" href="?product=${product.id}" data-product="${product.id}">
        <span class="slider-product-thumb">
          ${src ? `<img src="${escapeAttr(src)}" alt="${escapeAttr(product.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ""}
        </span>
        <span class="slider-product-name">${escapeHtml(product.name)}</span>
      </a>
    `;
  }).join("");
}

function maintenanceLevelCopy(value) {
  if (value === "low") return "Minimal styling, easiest upkeep.";
  if (value === "medium") return "A small product routine is fine.";
  if (value === "high") return "Open to tools, products, and styling.";
  return "";
}

function maintenanceProductPageHtml(option, products, isSelected) {
  const activeIds = maintenanceActiveProductIds(option.value);
  return `
    <section
      class="maintenance-product-page${isSelected ? " is-selected" : ""}"
      data-maintenance-value="${escapeAttr(option.value)}"
      aria-label="${escapeAttr(option.label)} upkeep"
    >
      <div class="maintenance-page-heading">
        <span>${escapeHtml(option.label)}</span>
        <small>${escapeHtml(maintenanceLevelCopy(option.value))}</small>
      </div>
      <div class="slider-products ${sliderProductsColsClass(products)}">${sliderProductsHtml(products, activeIds)}</div>
    </section>
  `;
}

function renderSliderQuestion(question, selected) {
  const regularOptions = question.options.filter((o) => !o.exclusive);
  const exclusiveOption = question.options.find((o) => o.exclusive);
  const isExclusiveSelected = exclusiveOption && selected.includes(exclusiveOption.value);
  const selectedIndex = (!isExclusiveSelected && selected.length)
    ? regularOptions.findIndex((o) => o.value === selected[0])
    : -1;
  const hasSelection = selectedIndex !== -1;
  const selectedValue = hasSelection ? regularOptions[selectedIndex].value : "";
  // Always show the full product catalog in the final maintenance question.
  const allProducts = PRODUCT_LIST
    .slice()
    .sort((a, b) => a.name.length - b.name.length);

  return `
    <div class="slider-question-wrap">
      <p class="slider-product-hint">Tap a product to learn more about it</p>
      <div class="maintenance-product-pager" data-maintenance-picker>
        ${regularOptions.map((option) => maintenanceProductPageHtml(option, allProducts, selectedValue === option.value)).join("")}
      </div>
      ${exclusiveOption ? `
        <div class="scale-skip-row">
          <button
            class="scale-skip-btn ${isExclusiveSelected ? "is-selected" : ""}"
            type="button"
            data-slider-skip="${escapeAttr(exclusiveOption.value)}"
            aria-pressed="${isExclusiveSelected}"
          >
            ${escapeHtml(exclusiveOption.label)}
          </button>
        </div>
      ` : ""}
    </div>
  `;
}

function wireSliderQuestion(question) {
  const regularOptions = question.options.filter((o) => !o.exclusive);
  const picker = document.querySelector("[data-maintenance-picker]");

  // Make the (possibly pre-selected) answer's product thumbnails tappable.
  if (picker) wireProductLinks(picker);

  if (picker) {
    const selectedValue = selectedFor(question).find((value) => regularOptions.some((option) => option.value === value));
    const selectedPage = selectedValue
      ? [...picker.querySelectorAll("[data-maintenance-value]")].find((card) => card.dataset.maintenanceValue === selectedValue)
      : null;
    if (selectedPage) {
      requestAnimationFrame(() => selectedPage.scrollIntoView({ behavior: "instant", block: "nearest", inline: "center" }));
    }

    picker.querySelectorAll("[data-maintenance-value]").forEach((page) => {
      page.addEventListener("click", (event) => {
        if (event.target.closest("[data-product]")) return;
        setAnswers({ ...state.answers, [question.id]: [page.dataset.maintenanceValue] });
        render();
      });
    });

    let scrollTimer = null;
    picker.addEventListener("scroll", () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        const pages = [...picker.querySelectorAll("[data-maintenance-value]")];
        if (!pages.length) return;
        const pickerCenter = picker.getBoundingClientRect().left + picker.clientWidth / 2;
        const closest = pages.reduce((best, page) => {
          const rect = page.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - pickerCenter);
          return distance < best.distance ? { page, distance } : best;
        }, { page: pages[0], distance: Infinity }).page;
        const value = closest?.dataset.maintenanceValue;
        if (value && selectedFor(question)[0] !== value) {
          setAnswers({ ...state.answers, [question.id]: [value] });
          render();
        }
      }, 160);
    }, { passive: true });
  }

  const skipBtn = document.querySelector("[data-slider-skip]");
  if (skipBtn) {
    skipBtn.addEventListener("click", () => {
      const option = question.options.find((o) => o.exclusive);
      if (!option) return;
      const isOn = selectedFor(question).includes(option.value);
      setAnswers({ ...state.answers, [question.id]: isOn ? [] : [option.value] });
      render();
    });
  }
}

function applyTextSearch(styles) {
  const q = normalizeSearchText(state.searchQuery);
  if (!q) return styles;
  const tokens = q.split(/[\s,]+/).filter(Boolean);
  return styles.filter((style) => {
    const haystack = styleHaystack(style);
    return tokens.every((token) => haystack.includes(token));
  });
}

function applyRefineFilters(styles) {
  const faceShapes = state.refineFilters.face_shape;
  if (faceShapes.size > 0) {
    styles = styles.filter((style) => faceShapes.has(style.faceShape));
  }

  const hairColours = state.refineFilters.hair_colour;
  if (hairColours.size > 0) {
    styles = styles.filter((style) => hairColours.has(hairColourKey(style.hairColour)));
  }

  const thickness = state.refineFilters.thickness;
  if (thickness) {
    styles = styles.filter((style) => style.hairThickness === thickness);
  }

  return styles;
}

function refinePillLabel(filter) {
  const val = state.refineFilters[filter.id];
  if (filter.id === "thickness") {
    return val ? titleCase(val) : filter.label;
  }
  if (val.size === 0) return filter.label;
  if (val.size === 1) {
    const v = [...val][0];
    return filter.options.find((o) => o.value === v)?.label || titleCase(v);
  }
  return `${val.size} ${filter.noun}s`;
}

function refineTriggerLabel(filter) {
  if (filter.id === "face_shape") return "Face";
  if (filter.id === "hair_colour") return "Colour";
  if (filter.id === "thickness") return "Density";
  return filter.label;
}

function refineControlTitle(filter) {
  if (filter.id === "face_shape") return "Shape";
  if (filter.id === "hair_colour") return "Colour";
  if (filter.id === "thickness") return "Density";
  return filter.noun || filter.label;
}

function refineHasSelection(filter) {
  const val = state.refineFilters[filter.id];
  return filter.id === "thickness" ? val !== null : val.size > 0;
}

function renderRefineControls() {
  const open = state.openRefineFilter;
  return `
    <div class="refine-icon-group" aria-label="Extra style filters">
      ${REFINE_FILTERS.map((filter) => {
        const hasSelection = refineHasSelection(filter);
        const isOpen = open === filter.id;
        const label = refineTriggerLabel(filter);
        const title = refineControlTitle(filter);
        return `
          <span class="refine-icon-control">
            <span class="refine-icon-title">${escapeHtml(title)}</span>
            <button
              class="refine-icon-btn${hasSelection ? " is-active" : ""}${isOpen ? " is-open" : ""}"
              type="button"
              data-refine="${escapeAttr(filter.id)}"
              aria-label="${escapeAttr(title)} filter"
              aria-expanded="${isOpen}"
              title="${escapeAttr(hasSelection ? refinePillLabel(filter) : `${title} filter`)}"
            >
              ${refineControlIcon(filter.id)}
            </button>
          </span>
        `;
      }).join("")}
    </div>
  `;
}

function renderRefineRow() {
  const open = state.openRefineFilter;
  const openFilter = open ? REFINE_FILTERS.find((f) => f.id === open) : null;
  if (!openFilter) return "";
  return `
    <div class="refine-filters">
      <div class="refine-panel">
        <p class="refine-question">${escapeHtml(openFilter.question)}</p>
        <div class="refine-options">
          ${openFilter.options.map((option) => {
            const val = state.refineFilters[openFilter.id];
            const isOn = openFilter.id === "thickness"
              ? val === option.value
              : val.has(option.value);
            return `
              <button
                class="refine-option${isOn ? " is-on" : ""}"
                type="button"
                data-refine-select="${escapeAttr(openFilter.id)}"
                data-refine-value="${escapeAttr(option.value)}"
              >${escapeHtml(option.label)}</button>
            `;
          }).join("")}
        </div>
      </div>
    </div>
  `;
}
// Shared results pipeline: narrow by quiz answers, then text search, then the
// refine pills, then rank. Used by both the Search page and the Home feed.
function computeResults() {
  const filtered = selectedAnswerCount() ? answerFilteredStyles() : state.styles;
  const textFiltered = applyTextSearch(filtered);
  const refined = applyRefineFilters(textFiltered);
  return scoredStyles(refined);
}

function renderResultsPage() {
  const results = computeResults();
  const selectedCount = selectedAnswerCount();

  els.app.innerHTML = `
    <section class="results-screen">
      <label class="search-bar">
        <span aria-hidden="true">${iconSearch()}</span>
        <input type="search" id="search-input" placeholder="Search by length, texture, vibe, or style name" value="${escapeAttr(state.searchQuery)}" autocomplete="off">
      </label>

      <div class="results-summary">
        <div>
          <p class="eyebrow">Curated for you</p>
          <h1 id="results-count">${results.length} styles to try</h1>
        </div>
        ${renderDiscoveryActions(selectedCount)}
      </div>

      ${state.filterPanelOpen ? renderAnswerFilterDrawer(selectedCount) : ""}

      ${renderRefineRow()}

      <section class="results-grid" id="results-grid">
        ${results.length ? results.map((style) => buildStyleCardHtml(style, false, { hideFooter: true })).join("") : `<p class="empty-state">No exact matches yet. Search all styles instead.</p>`}
      </section>
    </section>
  `;

  const searchInput = $("#search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (event) => {
      state.searchQuery = event.target.value;
      refreshResultsGrid();
    });
  }

  wireDiscoveryControls();
  wireCards();
}

// Re-render only the grid (and result count) so the search field keeps focus
// while the user is typing.
function refreshResultsGrid() {
  const grid = $("#results-grid");
  if (!grid) return;
  const results = computeResults();
  grid.innerHTML = results.length
    ? results.map((style) => buildStyleCardHtml(style, false, { hideFooter: true })).join("")
    : `<p class="empty-state">No exact matches yet. Search all styles instead.</p>`;
  const count = $("#results-count");
  if (count) count.textContent = `${results.length} styles to try`;
  wireCards();
}

function renderDiscoveryActions(selectedCount) {
  return `
    <div class="results-actions">
      <button class="secondary-btn filter-toggle-btn" id="filters-btn" type="button" aria-expanded="${state.filterPanelOpen}">
        Preferences
        ${selectedCount ? `<span class="filter-count">${selectedCount}</span>` : ""}
      </button>
      ${renderRefineControls()}
    </div>
  `;
}

function renderSummaryChips(chips) {
  return `<div class="summary-chips">${chips.map(renderPreferenceChip).join("")}</div>`;
}

function renderPreferenceChip(chip) {
  const question = getQuestionById(chip.questionId);
  const open = state.openPreferenceMenu === chip.questionId;
  return `
    <div class="summary-chip-wrap">
      <button
        class="summary-chip"
        type="button"
        data-preference-chip="${escapeAttr(chip.questionId)}"
        aria-expanded="${open}"
        aria-haspopup="menu"
      >
        <span><b>${escapeHtml(chip.label)}:</b> ${escapeHtml(chip.value)}</span>
        <span class="summary-chip-caret" aria-hidden="true"></span>
      </button>
      ${open && question ? renderPreferenceMenu(question) : ""}
    </div>
  `;
}

function renderPreferenceMenu(question) {
  const selected = selectedFor(question);
  const options = preferenceOptions(question);
  return `
    <div class="preference-menu" role="menu" aria-label="${escapeAttr(shortQuestionLabel(question.id))} preferences">
      <p>${escapeHtml(question.title)}</p>
      ${options.map((option) => renderPreferenceOption(question, option, isQuizOptionSelected(question, option, selected))).join("")}
    </div>
  `;
}

function renderPreferenceOption(question, option, isSelected) {
  return `
    <button
      class="preference-option ${isSelected ? "is-on" : ""}"
      type="button"
      role="menuitemcheckbox"
      aria-checked="${isSelected}"
      data-preference-question="${escapeAttr(question.id)}"
      data-preference-value="${escapeAttr(option.value)}"
    >
      <span>${escapeHtml(option.label)}</span>
      ${isSelected ? iconCheck() : ""}
    </button>
  `;
}

function wireDiscoveryControls() {
  $("#filters-btn").addEventListener("click", () => {
    state.filterPanelOpen = !state.filterPanelOpen;
    state.openPreferenceMenu = null;
    if (state.filterPanelOpen) state.openFilterGroups.clear();
    renderCurrentDiscoveryView();
  });
  const closeFilters = $("#close-filters-btn");
  if (closeFilters) {
    closeFilters.addEventListener("click", () => {
      state.filterPanelOpen = false;
      state.openFilterGroups.clear();
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView();
    });
  }
  const clearFilters = $("#clear-filters-btn");
  if (clearFilters) {
    clearFilters.addEventListener("click", () => {
      setAnswers({});
      state.openFilterGroups.clear();
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView({ preserveFilterScroll: true });
    });
  }
  document.querySelectorAll("[data-filter-group]").forEach((details) => {
    details.addEventListener("toggle", () => {
      if (details.open) state.openFilterGroups.add(details.dataset.filterGroup);
      else state.openFilterGroups.delete(details.dataset.filterGroup);
    });
  });
  document.querySelectorAll("[data-filter-question][data-filter-value]").forEach((button) => {
    button.addEventListener("click", () => {
      const question = getQuestionById(button.dataset.filterQuestion);
      const option = question?.options.find((item) => item.value === button.dataset.filterValue);
      if (!question || !option) return;
      selectQuizOption(question, option);
      renderCurrentDiscoveryView({ preserveFilterScroll: true });
    });
  });
  document.querySelectorAll("[data-preference-chip]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const nextMenu = button.dataset.preferenceChip;
      state.openPreferenceMenu = state.openPreferenceMenu === nextMenu ? null : nextMenu;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  });
  document.querySelectorAll("[data-preference-question][data-preference-value]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const question = getQuestionById(button.dataset.preferenceQuestion);
      const option = question?.options.find((item) => item.value === button.dataset.preferenceValue);
      if (!question || !option) return;
      selectQuizOption(question, option);
      state.openPreferenceMenu = question.id;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  });
  document.querySelectorAll(".summary-chip-wrap").forEach((wrap) => {
    wrap.addEventListener("click", (event) => event.stopPropagation());
  });
  document.querySelectorAll("[data-refine]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const filterId = button.dataset.refine;
      state.openRefineFilter = state.openRefineFilter === filterId ? null : filterId;
      state.openPreferenceMenu = null;
      renderCurrentDiscoveryView();
    });
  });
  document.querySelectorAll("[data-refine-select][data-refine-value]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      const filterId = button.dataset.refineSelect;
      const value = button.dataset.refineValue;
      if (filterId === "thickness") {
        state.refineFilters.thickness = state.refineFilters.thickness === value ? null : value;
      } else {
        const set = state.refineFilters[filterId];
        if (set.has(value)) set.delete(value);
        else set.add(value);
      }
      renderCurrentDiscoveryView();
    });
  });
  const discoveryScreen = $(".results-screen");
  if (discoveryScreen) {
    discoveryScreen.addEventListener("click", () => {
      if (!state.openPreferenceMenu && !state.openRefineFilter) return;
      state.openPreferenceMenu = null;
      state.openRefineFilter = null;
      renderCurrentDiscoveryView({ preserveFilterScroll: state.filterPanelOpen });
    });
  }
}

function renderCurrentDiscoveryView({ preserveFilterScroll = false } = {}) {
  const panel = $(".answer-filter-panel");
  const scrollTop = preserveFilterScroll && panel ? panel.scrollTop : null;
  const refineRow = $(".refine-row");
  const refineScrollLeft = refineRow ? refineRow.scrollLeft : 0;
  renderResultsPage();
  if (scrollTop !== null) {
    const nextPanel = $(".answer-filter-panel");
    if (nextPanel) nextPanel.scrollTop = scrollTop;
  }
  if (refineScrollLeft > 0) {
    const nextRefineRow = $(".refine-row");
    if (nextRefineRow) nextRefineRow.scrollTo({ left: refineScrollLeft, behavior: "instant" });
  }
}

function renderAnswerFilterDrawer(selectedCount) {
  return `
    <aside class="answer-filter-panel" aria-label="Modify answers">
      <div class="answer-filter-head">
        <div>
          <p class="eyebrow">Preferences</p>
          <h2>Modify your answers</h2>
        </div>
        <button class="close-filter-btn" id="close-filters-btn" type="button" aria-label="Close preferences">&times;</button>
      </div>
      <p class="answer-filter-copy">Adjust the profile from one place. Results update as soon as you change an answer.</p>
      <div class="answer-filter-actions">
        <button class="secondary-btn" id="clear-filters-btn" type="button">Clear answers</button>
      </div>
      <div class="answer-filter-count">${selectedCount || 0} selected</div>
      <div class="answer-filter-groups">
        ${DISCOVERY_FILTER_QUESTIONS.map(renderFilterGroup).join("")}
      </div>
    </aside>
  `;
}

function renderFilterGroup(question) {
  const selected = selectedFor(question);
  const options = preferenceOptions(question);
  return `
    <details class="answer-filter-group" data-filter-group="${question.id}" ${state.openFilterGroups.has(question.id) ? "open" : ""}>
      <summary>
        <span>
          <span class="answer-filter-group-title">${escapeHtml(shortQuestionLabel(question.id))}</span>
          <span class="answer-filter-group-question">${escapeHtml(question.title)}</span>
        </span>
        <span class="answer-filter-group-icon" aria-hidden="true"></span>
      </summary>
      <div class="answer-filter-options">
        ${options.map((option) => renderFilterOption(question, option, selected.includes(option.value))).join("")}
      </div>
    </details>
  `;
}

function renderFilterOption(question, option, isSelected) {
  return `
    <button
      class="filter-option ${isSelected ? "is-on" : ""}"
      type="button"
      data-filter-question="${question.id}"
      data-filter-value="${option.value}"
      aria-pressed="${isSelected}"
    >
      <span class="filter-option-box">${isSelected ? iconCheck() : ""}</span>
      <span>
        <span class="filter-option-label">${escapeHtml(option.label)}</span>
        ${option.desc ? `<span class="filter-option-desc">${escapeHtml(option.desc)}</span>` : ""}
      </span>
    </button>
  `;
}

function buildStyleCardHtml(style, compact = false, options = {}) {
  const liked = state.favourites.has(style.id);
  const hideFooter = Boolean(options.hideFooter);
  return `
    <article class="style-card ${compact ? "is-compact" : ""}" data-style-id="${style.id}">
      <button class="style-card-image" type="button" data-open-style="${style.id}" aria-label="Open ${escapeAttr(style.name)}">
        ${style.imageUrl ? `<img src="${style.imageUrl}" alt="${escapeAttr(style.name)}" loading="lazy" referrerpolicy="no-referrer">` : `<span>${escapeHtml(style.name)}</span>`}
      </button>
      ${compact || hideFooter ? "" : `
        <div class="style-card-footer">
          <div>
            <h2>${escapeHtml(style.name)}</h2>
            <p>${style.length} length - ${style.hairType}</p>
          </div>
          <button class="heart-btn ${liked ? "is-liked" : ""}" type="button" data-like-style="${style.id}" aria-label="${liked ? "Remove from saved" : "Save style"}">${liked ? "&hearts;" : "&#9825;"}</button>
        </div>
      `}
    </article>
  `;
}

function wireCards(scope = document) {
  scope.querySelectorAll("[data-open-style]").forEach((button) => {
    button.addEventListener("click", () => openDetail(button.dataset.openStyle));
  });
  scope.querySelectorAll("[data-like-style]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleFavourite(button.dataset.likeStyle);
    });
  });
}

