// ---------- Icons ----------
const iconAttrs = 'fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"';

function iconSearch() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" ${iconAttrs}/><path d="M16 16l4 4" ${iconAttrs}/></svg>`;
}

function iconMale() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="15" r="5.5"/><line x1="13" y1="11" x2="21" y2="3"/><polyline points="16,3 21,3 21,8"/></svg>`;
}

function iconFemale() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5.5"/><line x1="12" y1="13.5" x2="12" y2="21"/><line x1="8.5" y1="17.5" x2="15.5" y2="17.5"/></svg>`;
}

function iconArrow() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" ${iconAttrs}/></svg>`;
}

function iconQuizHome() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4.5h8a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2Z" ${iconAttrs}/><path d="M9 9h6M9 12h6M9 15h3" ${iconAttrs}/></svg>`;
}

function iconGalleryHome() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" ${iconAttrs}/><path d="m7 16 3.2-3.2a1.5 1.5 0 0 1 2.1 0L15 15.5l1-1a1.5 1.5 0 0 1 2.1 0L20 16.4" ${iconAttrs}/><circle cx="15.5" cy="9.5" r="1.4" ${iconAttrs}/></svg>`;
}

function iconProductsHome() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M10 25h12v28H10V25zM13 19h6v6h-6v-6zM9 15h14v4H9v-4zM29 25h10v28H29V25zM31.5 17h5v8h-5v-8zM47 25h10v28H47V25zM49.5 17h5v8h-5v-8z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/><path d="M12 44h8M31 44h6M49 44h6" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>`;
}

function iconVisualProfileHome() {
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M18 52c2.2-9 8.2-14 14-14s11.8 5 14 14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><path d="M32 34c-6.1 0-10.5-5-10.5-11.4S25.9 11 32 11s10.5 5.2 10.5 11.6S38.1 34 32 34z" fill="none" stroke="currentColor" stroke-width="2.5"/></svg>`;
}

function iconCamera() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 6.5 10 4.5h4l1.5 2H18a2.5 2.5 0 0 1 2.5 2.5v8A2.5 2.5 0 0 1 18 19.5H6A2.5 2.5 0 0 1 3.5 17V9A2.5 2.5 0 0 1 6 6.5h2.5Z" ${iconAttrs}/><circle cx="12" cy="13" r="3.5" ${iconAttrs}/></svg>`;
}

function iconImage() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" ${iconAttrs}/><path d="m6.5 16 3.6-3.5a1.4 1.4 0 0 1 2 0l2.2 2.2.9-.9a1.4 1.4 0 0 1 2 0l2.3 2.2" ${iconAttrs}/><circle cx="15.5" cy="9.5" r="1.4" ${iconAttrs}/></svg>`;
}

function iconCheck() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.2 4.2L19 7" ${iconAttrs}/></svg>`;
}

function iconClipboard() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="6" width="11" height="15" rx="2" ${iconAttrs}/><path d="M9.5 6V4.8A1.8 1.8 0 0 1 11.3 3h3.4a1.8 1.8 0 0 1 1.8 1.8V6M10 10h5M10 14h5M10 18h3" ${iconAttrs}/></svg>`;
}

function iconInfo() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" ${iconAttrs}/><path d="M12 11v5M12 8h.01" ${iconAttrs}/></svg>`;
}

function iconPlus() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" ${iconAttrs}/></svg>`;
}

function iconComment() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14a1.5 1.5 0 0 1 1.5 1.5v8A1.5 1.5 0 0 1 19 16H9l-4 4v-4H5a1.5 1.5 0 0 1-1.5-1.5v-8A1.5 1.5 0 0 1 5 5z" ${iconAttrs}/></svg>`;
}

function iconEnvelope() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2" ${iconAttrs}/><path d="m4.5 7 7.5 6 7.5-6" ${iconAttrs}/></svg>`;
}

function iconShare() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3" ${iconAttrs}/><circle cx="6" cy="12" r="3" ${iconAttrs}/><circle cx="18" cy="19" r="3" ${iconAttrs}/><path d="m8.6 13.5 6.8 3.98M15.4 6.5 8.6 10.49" ${iconAttrs}/></svg>`;
}

function iconFaceShapeControl() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5c4.1 0 7 3.3 7 8.2 0 4.7-3 8.8-7 8.8s-7-4.1-7-8.8c0-4.9 2.9-8.2 7-8.2z" ${iconAttrs}/><path d="M9 11.2h.01M15 11.2h.01M9.5 15.6c1.5 1.1 3.5 1.1 5 0" ${iconAttrs}/></svg>`;
}

function iconHairColourControl() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5s6 6.1 6 10.2a6 6 0 0 1-12 0c0-4.1 6-10.2 6-10.2z" ${iconAttrs}/><path d="M9.4 15.8c1.5 1 3.7 1 5.2 0" ${iconAttrs}/></svg>`;
}

function iconHairDensityControl() {
  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7.2 4.5c-1.5 4.2-1.5 10.8 0 15M12 4.5c-2 4.2-2 10.8 0 15M16.8 4.5c-1.5 4.2-1.5 10.8 0 15" ${iconAttrs}/></svg>`;
}

function refineControlIcon(id) {
  if (id === "face_shape") return iconFaceShapeControl();
  if (id === "hair_colour") return iconHairColourControl();
  if (id === "thickness") return iconHairDensityControl();
  return iconCheck();
}

function textureIcon(kind) {
  const columns = [8, 16, 24].map((x) => x * 2);
  if (kind === "straight") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="54" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "wavy") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<path d="M${x} 10 q7 8 0 16 q-7 8 0 16 q7 8 0 12" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "curly") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<path d="M${x} 11 c9 3 9 11 0 13 c-9 2 -9 10 0 13 c9 3 9 11 0 13" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "coily") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${columns.map((x) => `<path d="M${x - 4} 11 l8 5 l-8 5 l8 5 l-8 5 l8 5 l-8 5 l8 5" ${iconAttrs}/>`).join("")}</svg>`;
  }
  if (kind === "fine") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><line x1="26" y1="10" x2="26" y2="54" ${iconAttrs} stroke-width="1"/><line x1="38" y1="10" x2="38" y2="54" ${iconAttrs} stroke-width="1"/></svg>`;
  }
  if (kind === "thick") {
    return `<svg viewBox="0 0 64 64" aria-hidden="true">${[14, 22, 30, 38, 46].map((x) => `<line x1="${x}" y1="10" x2="${x}" y2="54" ${iconAttrs} stroke-width="2.4"/>`).join("")}</svg>`;
  }
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="20" ${iconAttrs}/><path d="M28 25a5 5 0 1 1 6 4.8c-1.5.7-2 1.8-2 4.2M32 43h.01" ${iconAttrs}/></svg>`;
}

function faceIcon(kind) {
  const shapes = {
    oval: `<ellipse cx="32" cy="32" rx="16" ry="22" ${iconAttrs}/>`,
    round: `<circle cx="32" cy="32" r="20" ${iconAttrs}/>`,
    square: `<rect x="13" y="13" width="38" height="38" rx="7" ${iconAttrs}/>`,
    heart: `<path d="M32 52C16 40 12 28 12 22a9 9 0 0 1 20-3 9 9 0 0 1 20 3c0 6-4 18-20 30Z" ${iconAttrs}/>`,
    diamond: `<path d="M32 10l20 22-20 22-20-22Z" ${iconAttrs}/>`,
    oblong: `<rect x="17" y="9" width="30" height="46" rx="13" ${iconAttrs}/>`,
    triangle: `<path d="M32 11l19 42H13Z" ${iconAttrs}/>`,
    unknown: `<circle cx="32" cy="32" r="20" ${iconAttrs}/><path d="M28 26a5 5 0 1 1 6 4.8c-1.5.7-2 1.8-2 4.2M32 43h.01" ${iconAttrs}/>`
  };
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${shapes[kind] || shapes.unknown}</svg>`;
}

function lengthIcon(level) {
  if (level >= 6) {
    return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="16" r="8" ${iconAttrs}/><path d="M16 40q16-12 32 0M16 48q16-12 32 0" ${iconAttrs}/></svg>`;
  }
  const len = [4, 12, 20, 28, 38, 48][level] || 20;
  return `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="16" r="8" ${iconAttrs}/><path d="M24 16q-6 4-6 ${len}M40 16q6 4 6 ${len}" ${iconAttrs}/></svg>`;
}
