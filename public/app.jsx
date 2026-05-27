// Combined Salon frontend bundle generated from frontend/.
// Source order: image-slot.js, app-shared.jsx, app-salon.jsx, app bootstrap.

/**
 * <image-slot> — user-fillable image placeholder.
 *
 * Drop this into a deck, mockup, or page wherever you want the user to
 * supply an image. You control the slot's shape and size; the user fills it
 * by dragging an image file onto it (or clicking to browse). The dropped
 * image persists across reloads via a .image-slots.state.json sidecar —
 * same read-via-fetch / write-via-window.omelette pattern as
 * design_canvas.jsx, so the filled slot shows on share links, downloaded
 * zips, and PPTX export. Outside the omelette runtime the slot is read-only.
 *
 * The host bridge only allows sidecar writes at the project root, so the
 * HTML that uses this component is assumed to live at the project root too
 * (same constraint as design_canvas.jsx).
 *
 * Attributes:
 *   id           Persistence key. REQUIRED for the drop to survive reload —
 *                every slot on the page needs a distinct id.
 *   shape        'rect' | 'rounded' | 'circle' | 'pill'   (default 'rounded')
 *                'circle' applies 50% border-radius; on a non-square slot
 *                that's an ellipse — set equal width and height for a true
 *                circle.
 *   radius       Corner radius in px for 'rounded'.       (default 12)
 *   mask         Any CSS clip-path value. Overrides `shape` — use this for
 *                hexagons, blobs, arbitrary polygons.
 *   fit          object-fit: cover | contain | fill.       (default 'cover')
 *                With cover (the default) double-clicking the filled slot
 *                enters a reframe mode: the whole image spills past the mask
 *                (translucent outside, opaque inside), drag to reposition,
 *                corner-drag to scale. The crop persists alongside the image
 *                in the sidecar. contain/fill stay static.
 *   position     object-position for fit=contain|fill.     (default '50% 50%')
 *   placeholder  Empty-state caption.                      (default 'Drop an image')
 *   src          Optional initial/fallback image URL. A user drop overrides
 *                it; clearing the drop reveals src again.
 *
 * Size and layout come from ordinary CSS on the element — width/height
 * inline or from a parent grid — so it composes with any layout.
 *
 * Usage:
 *   <script src="image-slot.js"></script>
 *   <image-slot id="hero"   style="width:800px;height:450px" shape="rounded" radius="20"
 *               placeholder="Drop a hero image"></image-slot>
 *   <image-slot id="avatar" style="width:120px;height:120px" shape="circle"></image-slot>
 *   <image-slot id="kite"   style="width:300px;height:300px"
 *               mask="polygon(50% 0, 100% 50%, 50% 100%, 0 50%)"></image-slot>
 */

(() => {
  const STATE_FILE = '.image-slots.state.json';
  // 2× a ~600px slot in a 1920-wide deck — retina-sharp without making the
  // sidecar enormous. A 1200px WebP at q=0.85 is ~150-300KB.
  const MAX_DIM = 1200;
  // Raster formats only. SVG is excluded (can carry script; createImageBitmap
  // on SVG blobs is inconsistent). GIF is excluded because the canvas
  // re-encode keeps only the first frame, so an animated GIF would silently
  // go still — better to reject than surprise.
  const ACCEPT = ['image/png', 'image/jpeg', 'image/webp', 'image/avif'];

  // ── Shared sidecar store ────────────────────────────────────────────────
  // One fetch + immediate write-on-change for every <image-slot> on the
  // page. Reads via fetch() so viewing works anywhere the HTML and sidecar
  // are served together; writes go through window.omelette.writeFile, which
  // the host allowlists to *.state.json basenames only.
  const subs = new Set();
  let slots = {};
  // ids explicitly cleared before the sidecar fetch resolved — otherwise
  // the merge below can't tell "never set" from "just deleted" and would
  // resurrect the sidecar's stale value.
  const tombstones = new Set();
  let loaded = false;
  let loadP = null;

  function load() {
    if (loadP) return loadP;
    loadP = fetch(STATE_FILE)
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        // Merge: sidecar loses to any in-memory change that raced ahead of
        // the fetch (drop or clear) so neither is clobbered by hydration.
        if (j && typeof j === 'object') {
          const merged = Object.assign({}, j, slots);
          // A framing-only write that raced ahead of hydration must not
          // drop a user image that's only on disk — inherit u from the
          // sidecar for any in-memory entry that lacks one.
          for (const k in slots) {
            if (merged[k] && !merged[k].u && j[k]) {
              merged[k].u = typeof j[k] === 'string' ? j[k] : j[k].u;
            }
          }
          for (const id of tombstones) delete merged[id];
          slots = merged;
        }
        tombstones.clear();
      })
      .catch(() => {})
      .then(() => { loaded = true; subs.forEach((fn) => fn()); });
    return loadP;
  }

  // Serialize writes so two near-simultaneous drops on different slots
  // can't reorder at the backend and leave the sidecar with only the
  // first. A save requested mid-flight just marks dirty and re-fires on
  // completion with the then-current slots.
  let saving = false;
  let saveDirty = false;
  function save() {
    if (saving) { saveDirty = true; return; }
    const w = window.omelette && window.omelette.writeFile;
    if (!w) return;
    saving = true;
    Promise.resolve(w(STATE_FILE, JSON.stringify(slots)))
      .catch(() => {})
      .then(() => { saving = false; if (saveDirty) { saveDirty = false; save(); } });
  }

  const S_MAX = 5;
  const clampS = (s) => Math.max(1, Math.min(S_MAX, s));

  // Normalize a stored slot value. Pre-reframe sidecars stored a bare
  // data-URL string; newer ones store {u, s, x, y}. Either shape is valid.
  function getSlot(id) {
    const v = slots[id];
    if (!v) return null;
    return typeof v === 'string' ? { u: v, s: 1, x: 0, y: 0 } : v;
  }

  function setSlot(id, val) {
    if (!id) return;
    if (val) { slots[id] = val; tombstones.delete(id); }
    else { delete slots[id]; if (!loaded) tombstones.add(id); }
    subs.forEach((fn) => fn());
    // A drop is rare + high-value — write immediately so nav-away can't lose
    // it. Gate on the initial read so we don't overwrite a sidecar we haven't
    // merged yet; the merge in load() keeps this change once the read lands.
    if (loaded) save(); else load().then(save);
  }

  // ── Image downscale ─────────────────────────────────────────────────────
  // Encode through a canvas so the sidecar carries resized bytes, not the
  // raw upload. Longest side is capped at 2× the slot's rendered width
  // (retina) and at MAX_DIM. WebP keeps alpha and is ~10× smaller than PNG
  // for photos, so there's no need for per-image format picking.
  async function toDataUrl(file, targetW) {
    const bitmap = await createImageBitmap(file);
    try {
      const cap = Math.min(MAX_DIM, Math.max(1, Math.round(targetW * 2)) || MAX_DIM);
      const scale = Math.min(1, cap / Math.max(bitmap.width, bitmap.height));
      const w = Math.max(1, Math.round(bitmap.width * scale));
      const h = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
      return canvas.toDataURL('image/webp', 0.85);
    } finally {
      bitmap.close && bitmap.close();
    }
  }

  // ── Custom element ──────────────────────────────────────────────────────
  const stylesheet =
    ':host{display:inline-block;position:relative;vertical-align:top;' +
    '  font:13px/1.3 system-ui,-apple-system,sans-serif;color:rgba(0,0,0,.55);width:240px;height:160px}' +
    '.frame{position:absolute;inset:0;overflow:hidden;background:rgba(0,0,0,.04)}' +
    // .frame img (clipped) and .spill (unclipped ghost + handles) share the
    // same left/top/width/height in frame-%, computed by _applyView(), so the
    // inside-mask crop and the outside-mask spill stay pixel-aligned.
    '.frame img{position:absolute;max-width:none;transform:translate(-50%,-50%);' +
    '  -webkit-user-drag:none;user-select:none;touch-action:none}' +
    // Reframe mode (double-click): the full image spills past the mask. The
    // spill layer is sized to the IMAGE bounds so its corners are where the
    // resize handles belong. The ghost <img> inside is translucent; the real
    // clipped <img> underneath shows the opaque in-mask crop.
    '.spill{position:absolute;transform:translate(-50%,-50%);display:none;z-index:1;' +
    '  cursor:grab;touch-action:none}' +
    ':host([data-panning]) .spill{cursor:grabbing}' +
    '.spill .ghost{position:absolute;inset:0;width:100%;height:100%;opacity:.35;' +
    '  pointer-events:none;-webkit-user-drag:none;user-select:none;' +
    '  box-shadow:0 0 0 1px rgba(0,0,0,.2),0 12px 32px rgba(0,0,0,.2)}' +
    '.spill .handle{position:absolute;width:12px;height:12px;border-radius:50%;' +
    '  background:#fff;box-shadow:0 0 0 1.5px #c96442,0 1px 3px rgba(0,0,0,.3);' +
    '  transform:translate(-50%,-50%)}' +
    '.spill .handle[data-c=nw]{left:0;top:0;cursor:nwse-resize}' +
    '.spill .handle[data-c=ne]{left:100%;top:0;cursor:nesw-resize}' +
    '.spill .handle[data-c=sw]{left:0;top:100%;cursor:nesw-resize}' +
    '.spill .handle[data-c=se]{left:100%;top:100%;cursor:nwse-resize}' +
    ':host([data-reframe]){z-index:10}' +
    ':host([data-reframe]) .spill{display:block}' +
    ':host([data-reframe]) .frame{box-shadow:0 0 0 2px #c96442}' +
    '.empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;' +
    '  justify-content:center;gap:6px;text-align:center;padding:12px;box-sizing:border-box;' +
    '  cursor:pointer;user-select:none}' +
    '.empty svg{opacity:.45}' +
    '.empty .cap{max-width:90%;font-weight:500;letter-spacing:.01em}' +
    '.empty .sub{font-size:11px}' +
    '.empty .sub u{text-underline-offset:2px;text-decoration-color:rgba(0,0,0,.25)}' +
    '.empty:hover .sub u{color:rgba(0,0,0,.75);text-decoration-color:currentColor}' +
    ':host([data-over]) .frame{outline:2px solid #c96442;outline-offset:-2px;' +
    '  background:rgba(201,100,66,.10)}' +
    '.ring{position:absolute;inset:0;pointer-events:none;border:1.5px dashed rgba(0,0,0,.25);' +
    '  transition:border-color .12s}' +
    ':host([data-over]) .ring{border-color:#c96442}' +
    ':host([data-filled]) .ring{display:none}' +
    // Controls sit BELOW the mask (top:100%), absolutely positioned so the
    // author-declared slot height is unaffected. The gap is padding, not a
    // top offset, so the hover target stays contiguous with the frame.
    '.ctl{position:absolute;top:100%;left:50%;transform:translateX(-50%);padding-top:8px;' +
    '  display:flex;gap:6px;opacity:0;pointer-events:none;transition:opacity .12s;z-index:2;' +
    '  white-space:nowrap}' +
    ':host([data-filled][data-editable]:hover) .ctl,:host([data-reframe]) .ctl' +
    '  {opacity:1;pointer-events:auto}' +
    '.ctl button{appearance:none;border:0;border-radius:6px;padding:5px 10px;cursor:pointer;' +
    '  background:rgba(0,0,0,.65);color:#fff;font:11px/1 system-ui,-apple-system,sans-serif;' +
    '  backdrop-filter:blur(6px)}' +
    '.ctl button:hover{background:rgba(0,0,0,.8)}' +
    '.err{position:absolute;left:8px;bottom:8px;right:8px;color:#b3261e;font-size:11px;' +
    '  background:rgba(255,255,255,.85);padding:4px 6px;border-radius:5px;pointer-events:none}';

  const icon =
    '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>' +
    '<path d="m21 15-5-5L5 21"/></svg>';

  class ImageSlot extends HTMLElement {
    static get observedAttributes() {
      return ['shape', 'radius', 'mask', 'fit', 'position', 'placeholder', 'src', 'id'];
    }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      // .spill and .ctl sit OUTSIDE .frame so overflow:hidden + border-radius
      // on the frame (circle, pill, rounded) can't clip them.
      root.innerHTML =
        '<style>' + stylesheet + '</style>' +
        '<div class="frame" part="frame">' +
        '  <img part="image" alt="" draggable="false" style="display:none">' +
        '  <div class="empty" part="empty">' + icon +
        '    <div class="cap"></div>' +
        '    <div class="sub">or <u>browse files</u></div></div>' +
        '  <div class="ring" part="ring"></div>' +
        '</div>' +
        '<div class="spill">' +
        '  <img class="ghost" alt="" draggable="false">' +
        '  <div class="handle" data-c="nw"></div><div class="handle" data-c="ne"></div>' +
        '  <div class="handle" data-c="sw"></div><div class="handle" data-c="se"></div>' +
        '</div>' +
        '<div class="ctl"><button data-act="replace" title="Replace image">Replace</button>' +
        '  <button data-act="clear" title="Remove image">Remove</button></div>' +
        '<input type="file" accept="' + ACCEPT.join(',') + '" hidden>';
      this._frame = root.querySelector('.frame');
      this._ring = root.querySelector('.ring');
      this._img = root.querySelector('.frame img');
      this._empty = root.querySelector('.empty');
      this._cap = root.querySelector('.cap');
      this._sub = root.querySelector('.sub');
      this._spill = root.querySelector('.spill');
      this._ghost = root.querySelector('.ghost');
      this._err = null;
      this._input = root.querySelector('input');
      this._depth = 0;
      this._gen = 0;
      this._view = { s: 1, x: 0, y: 0 };
      this._subFn = () => this._render();
      // Shadow-DOM listeners live with the shadow DOM — bound once here so
      // disconnect/reconnect (e.g. React remount) doesn't stack handlers.
      this._empty.addEventListener('click', () => this._input.click());
      root.addEventListener('click', (e) => {
        const act = e.target && e.target.getAttribute && e.target.getAttribute('data-act');
        if (act === 'replace') { this._exitReframe(true); this._input.click(); }
        if (act === 'clear') {
          this._exitReframe(false);
          this._gen++;
          this._local = null;
          if (this.id) setSlot(this.id, null); else this._render();
        }
      });
      this._input.addEventListener('change', () => {
        const f = this._input.files && this._input.files[0];
        if (f) this._ingest(f);
        this._input.value = '';
      });
      // naturalWidth/Height aren't known until load — re-apply so the cover
      // baseline is computed from real dimensions, not the 100%×100% fallback.
      this._img.addEventListener('load', () => this._applyView());
      // Gated on editable + fit=cover so share links and contain/fill slots
      // stay static.
      this.addEventListener('dblclick', (e) => {
        if (!this.hasAttribute('data-editable') || !this._reframes()) return;
        e.preventDefault();
        if (this.hasAttribute('data-reframe')) this._exitReframe(true);
        else this._enterReframe();
      });
      // Pan + resize both originate on the spill layer. A handle pointerdown
      // drives an aspect-locked resize anchored at the opposite corner; any
      // other pointerdown on the spill pans. Offsets are frame-% so a
      // reframed slot survives responsive resize / PPTX export.
      this._spill.addEventListener('pointerdown', (e) => {
        if (e.button !== 0 || !this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        e.stopPropagation();
        this._spill.setPointerCapture(e.pointerId);
        const rect = this.getBoundingClientRect();
        const fw = rect.width || 1, fh = rect.height || 1;
        const corner = e.target.getAttribute && e.target.getAttribute('data-c');
        let move;
        if (corner) {
          // Resize about the OPPOSITE corner. Viewport-px throughout (rect
          // fw/fh, not clientWidth) so the math survives a transform:scale()
          // ancestor — deck_stage renders slides scaled-to-fit.
          const iw = this._img.naturalWidth || 1, ih = this._img.naturalHeight || 1;
          const base = Math.max(fw / iw, fh / ih);
          const sx = corner.includes('e') ? 1 : -1;
          const sy = corner.includes('s') ? 1 : -1;
          const s0 = this._view.s;
          const w0 = iw * base * s0, h0 = ih * base * s0;
          const cx0 = (50 + this._view.x) / 100 * fw;
          const cy0 = (50 + this._view.y) / 100 * fh;
          const ox = cx0 - sx * w0 / 2, oy = cy0 - sy * h0 / 2;
          const diag0 = Math.hypot(w0, h0);
          const ux = sx * w0 / diag0, uy = sy * h0 / diag0;
          move = (ev) => {
            const proj = (ev.clientX - rect.left - ox) * ux +
                         (ev.clientY - rect.top - oy) * uy;
            const s = clampS(s0 * proj / diag0);
            const d = diag0 * s / s0;
            this._view.s = s;
            this._view.x = (ox + ux * d / 2) / fw * 100 - 50;
            this._view.y = (oy + uy * d / 2) / fh * 100 - 50;
            this._clampView();
            this._applyView();
          };
        } else {
          this.setAttribute('data-panning', '');
          const start = { px: e.clientX, py: e.clientY, x: this._view.x, y: this._view.y };
          move = (ev) => {
            this._view.x = start.x + (ev.clientX - start.px) / fw * 100;
            this._view.y = start.y + (ev.clientY - start.py) / fh * 100;
            this._clampView();
            this._applyView();
          };
        }
        const up = () => {
          try { this._spill.releasePointerCapture(e.pointerId); } catch {}
          this._spill.removeEventListener('pointermove', move);
          this._spill.removeEventListener('pointerup', up);
          this._spill.removeEventListener('pointercancel', up);
          this.removeAttribute('data-panning');
          this._dragUp = null;
        };
        // Stashed so _exitReframe (Escape / outside-click mid-drag) can
        // tear the capture + listeners down synchronously.
        this._dragUp = up;
        this._spill.addEventListener('pointermove', move);
        this._spill.addEventListener('pointerup', up);
        this._spill.addEventListener('pointercancel', up);
      });
      // Wheel zoom stays available inside reframe mode as a trackpad nicety —
      // zooms toward the cursor (offset' = cursor·(1-k) + offset·k).
      this.addEventListener('wheel', (e) => {
        if (!this.hasAttribute('data-reframe')) return;
        e.preventDefault();
        const r = this.getBoundingClientRect();
        const cx = (e.clientX - r.left) / r.width * 100 - 50;
        const cy = (e.clientY - r.top) / r.height * 100 - 50;
        const prev = this._view.s;
        const next = clampS(prev * Math.pow(1.0015, -e.deltaY));
        if (next === prev) return;
        const k = next / prev;
        this._view.s = next;
        this._view.x = cx * (1 - k) + this._view.x * k;
        this._view.y = cy * (1 - k) + this._view.y * k;
        this._clampView();
        this._applyView();
      }, { passive: false });
    }

    connectedCallback() {
      // Warn once per page — an id-less slot works for the session but
      // cannot persist, and two id-less slots would share nothing.
      if (!this.id && !ImageSlot._warned) {
        ImageSlot._warned = true;
        console.warn('<image-slot> without an id will not persist its dropped image.');
      }
      this.addEventListener('dragenter', this);
      this.addEventListener('dragover', this);
      this.addEventListener('dragleave', this);
      this.addEventListener('drop', this);
      subs.add(this._subFn);
      // width%/height% in _applyView encode the frame aspect at call time —
      // a host resize (responsive grid, pane divider) would stretch the
      // image until the next _render. Re-render on size change: _render()
      // re-seeds _view from stored before clamp/apply, so a shrink→grow
      // cycle round-trips instead of ratcheting x/y toward the narrower
      // frame's clamp range.
      this._ro = new ResizeObserver(() => this._render());
      this._ro.observe(this);
      load();
      this._render();
    }

    disconnectedCallback() {
      subs.delete(this._subFn);
      this.removeEventListener('dragenter', this);
      this.removeEventListener('dragover', this);
      this.removeEventListener('dragleave', this);
      this.removeEventListener('drop', this);
      if (this._ro) { this._ro.disconnect(); this._ro = null; }
      this._exitReframe(false);
    }

    _enterReframe() {
      if (this.hasAttribute('data-reframe')) return;
      this.setAttribute('data-reframe', '');
      this._applyView();
      // Close on click outside (the spill handler stopPropagation()s so
      // in-image drags don't reach this) and on Escape. Listeners are held
      // on the instance so _exitReframe / disconnectedCallback can detach
      // exactly what was attached.
      this._outside = (e) => {
        if (e.composedPath && e.composedPath().includes(this)) return;
        this._exitReframe(true);
      };
      this._esc = (e) => { if (e.key === 'Escape') this._exitReframe(true); };
      document.addEventListener('pointerdown', this._outside, true);
      document.addEventListener('keydown', this._esc, true);
    }

    _exitReframe(commit) {
      if (!this.hasAttribute('data-reframe')) return;
      if (this._dragUp) this._dragUp();
      this.removeAttribute('data-reframe');
      this.removeAttribute('data-panning');
      if (this._outside) document.removeEventListener('pointerdown', this._outside, true);
      if (this._esc) document.removeEventListener('keydown', this._esc, true);
      this._outside = this._esc = null;
      if (commit) this._commitView();
    }

    attributeChangedCallback() { if (this.shadowRoot) this._render(); }

    // handleEvent — one listener object for all four drag events keeps the
    // add/remove symmetric and the depth counter correct.
    handleEvent(e) {
      if (e.type === 'dragenter' || e.type === 'dragover') {
        // Without preventDefault the browser never fires 'drop'.
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy';
        if (e.type === 'dragenter') this._depth++;
        this.setAttribute('data-over', '');
      } else if (e.type === 'dragleave') {
        // dragenter/leave fire for every descendant crossing — count depth
        // so hovering the icon inside the empty state doesn't flicker.
        if (--this._depth <= 0) { this._depth = 0; this.removeAttribute('data-over'); }
      } else if (e.type === 'drop') {
        e.preventDefault();
        e.stopPropagation();
        this._depth = 0;
        this.removeAttribute('data-over');
        const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (f) this._ingest(f);
      }
    }

    async _ingest(file) {
      this._setError(null);
      if (!file || ACCEPT.indexOf(file.type) < 0) {
        this._setError('Drop a PNG, JPEG, WebP, or AVIF image.');
        return;
      }
      // toDataUrl can take hundreds of ms on a large photo. A Clear or a
      // newer drop during that window would be clobbered when this await
      // resumes — bump + capture a generation so stale encodes bail.
      const gen = ++this._gen;
      try {
        const w = this.clientWidth || this.offsetWidth || MAX_DIM;
        const url = await toDataUrl(file, w);
        if (gen !== this._gen) return;
        // Only exit reframe once the new image is in hand — a rejected type
        // or decode failure leaves the in-progress crop untouched.
        this._exitReframe(false);
        const val = { u: url, s: 1, x: 0, y: 0 };
        setSlot(this.id || '', val);
        // Keep a session-local copy for id-less slots so the drop still
        // shows, even though it cannot persist.
        if (!this.id) { this._local = val; this._render(); }
      } catch (err) {
        if (gen !== this._gen) return;
        this._setError('Could not read that image.');
        console.warn('<image-slot> ingest failed:', err);
      }
    }

    _setError(msg) {
      if (this._err) { this._err.remove(); this._err = null; }
      if (!msg) return;
      const d = document.createElement('div');
      d.className = 'err'; d.textContent = msg;
      this.shadowRoot.appendChild(d);
      this._err = d;
      setTimeout(() => { if (this._err === d) { d.remove(); this._err = null; } }, 3000);
    }

    // Reframing (pan/resize) is only meaningful for fit=cover — contain/fill
    // keep the old object-fit path and double-click is a no-op.
    _reframes() {
      return this.hasAttribute('data-filled') &&
        (this.getAttribute('fit') || 'cover') === 'cover';
    }

    // Cover-baseline geometry, shared by clamp/apply/resize. Null until the
    // img has loaded (naturalWidth is 0 before that) or when the slot has no
    // layout box — ResizeObserver fires with a 0×0 rect under display:none,
    // and clamping against a degenerate 1×1 frame would silently pull the
    // stored pan toward zero.
    _geom() {
      const iw = this._img.naturalWidth, ih = this._img.naturalHeight;
      const fw = this.clientWidth, fh = this.clientHeight;
      if (!iw || !ih || !fw || !fh) return null;
      return { iw, ih, fw, fh, base: Math.max(fw / iw, fh / ih) };
    }

    _clampView() {
      // Pan range on each axis is half the overflow past the frame edge.
      const g = this._geom();
      if (!g) return;
      const mx = Math.max(0, (g.iw * g.base * this._view.s / g.fw - 1) * 50);
      const my = Math.max(0, (g.ih * g.base * this._view.s / g.fh - 1) * 50);
      this._view.x = Math.max(-mx, Math.min(mx, this._view.x));
      this._view.y = Math.max(-my, Math.min(my, this._view.y));
    }

    _applyView() {
      const g = this._geom();
      const fit = this.getAttribute('fit') || 'cover';
      if (fit !== 'cover' || !g) {
        // Non-cover, or dimensions not known yet (before img load).
        this._img.style.width = '100%';
        this._img.style.height = '100%';
        this._img.style.left = '50%';
        this._img.style.top = '50%';
        this._img.style.objectFit = fit;
        this._img.style.objectPosition = this.getAttribute('position') || '50% 50%';
        return;
      }
      // Cover baseline: img fills the frame on its tighter axis at s=1, so
      // pan works immediately on the overflowing axis without zooming first.
      // Width/height and left/top are all frame-% — depends only on the
      // frame aspect ratio, so a responsive resize keeps the same crop. The
      // spill layer mirrors the same box so its corners = image corners.
      const k = g.base * this._view.s;
      const w = (g.iw * k / g.fw * 100) + '%';
      const h = (g.ih * k / g.fh * 100) + '%';
      const l = (50 + this._view.x) + '%';
      const t = (50 + this._view.y) + '%';
      this._img.style.width = w; this._img.style.height = h;
      this._img.style.left = l; this._img.style.top = t;
      this._img.style.objectFit = '';
      this._spill.style.width = w; this._spill.style.height = h;
      this._spill.style.left = l; this._spill.style.top = t;
    }

    _commitView() {
      const v = { s: this._view.s, x: this._view.x, y: this._view.y };
      if (this._userUrl) v.u = this._userUrl;
      // Framing-only (no u) persists too so an author-src slot remembers its
      // crop; clearing the sidecar still falls through to src=.
      if (this.id) setSlot(this.id, v);
      else { this._local = v; }
    }

    _render() {
      // Shape / mask. Presets use border-radius so the dashed ring can
      // follow the rounded outline; clip-path is only applied for an
      // explicit `mask` (the ring is hidden there since a rectangle
      // dashed border chopped by an arbitrary polygon looks broken).
      const mask = this.getAttribute('mask');
      const shape = (this.getAttribute('shape') || 'rounded').toLowerCase();
      let radius = '';
      if (shape === 'circle') radius = '50%';
      else if (shape === 'pill') radius = '9999px';
      else if (shape === 'rounded') {
        const n = parseFloat(this.getAttribute('radius'));
        radius = (Number.isFinite(n) ? n : 12) + 'px';
      }
      this._frame.style.borderRadius = mask ? '' : radius;
      this._frame.style.clipPath = mask || '';
      this._ring.style.borderRadius = mask ? '' : radius;
      this._ring.style.display = mask ? 'none' : '';

      // Controls and reframe entry gate on this so share links stay read-only.
      const editable = !!(window.omelette && window.omelette.writeFile);
      this.toggleAttribute('data-editable', editable);
      this._sub.style.display = editable ? '' : 'none';

      // Content. The sidecar is also writable by the agent's write_file
      // tool, so its value isn't guaranteed canvas-originated — only accept
      // data:image/ URLs from it. The `src` attribute is author-controlled
      // (Claude wrote it into the HTML) so it passes through unchanged.
      let stored = this.id ? getSlot(this.id) : this._local;
      if (stored && stored.u && !/^data:image\//i.test(stored.u)) stored = null;
      const srcAttr = this.getAttribute('src') || '';
      this._userUrl = (stored && stored.u) || null;
      const url = this._userUrl || srcAttr;
      // Don't clobber an in-flight reframe with a store-triggered re-render.
      if (!this.hasAttribute('data-reframe')) {
        this._view = {
          s: stored && Number.isFinite(stored.s) ? clampS(stored.s) : 1,
          x: stored && Number.isFinite(stored.x) ? stored.x : 0,
          y: stored && Number.isFinite(stored.y) ? stored.y : 0,
        };
      }
      this._cap.textContent = this.getAttribute('placeholder') || 'Drop an image';
      // Toggle via style.display — the [hidden] attribute alone loses to
      // the display:flex / display:block rules in the stylesheet above.
      if (url) {
        if (this._img.getAttribute('src') !== url) {
          this._img.src = url;
          this._ghost.src = url;
        }
        this._img.style.display = 'block';
        this._empty.style.display = 'none';
        this.setAttribute('data-filled', '');
        this._clampView();
        this._applyView();
      } else {
        this._img.style.display = 'none';
        this._img.removeAttribute('src');
        this._ghost.removeAttribute('src');
        this._empty.style.display = 'flex';
        this.removeAttribute('data-filled');
      }
    }
  }

  if (!customElements.get('image-slot')) {
    customElements.define('image-slot', ImageSlot);
  }
})();

// Shared atoms + data for the Salon frontend.

// ── Hairstyle catalog ──────────────────────────────────────────────────────
// Gender-inclusive. Aspect ratio drives masonry variety.
const HAIRSTYLES = [
  { id: 'curtain',    name: 'Soft Curtain Bangs',  length: 'Medium', tags: ['Romantic','Wavy'],   ratio: 1.35, angle: 12,  density: 7 },
  { id: 'shag',       name: 'Shoulder Shag',       length: 'Medium', tags: ['Edgy','Tousled'],    ratio: 1.10, angle: -8,  density: 6 },
  { id: 'pixie',      name: 'Pixie Crop',          length: 'Short',  tags: ['Bold','Classic'],    ratio: 0.95, angle: 0,   density: 9 },
  { id: 'longlayers', name: 'Long Layered',        length: 'Long',   tags: ['Effortless'],         ratio: 1.55, angle: 6,   density: 5 },
  { id: 'wolf',       name: 'Wolf Cut',            length: 'Medium', tags: ['Edgy','Wavy'],       ratio: 1.20, angle: -14, density: 6 },
  { id: 'bluntbob',   name: 'Blunt Bob',           length: 'Short',  tags: ['Classic','Sleek'],   ratio: 1.00, angle: 90,  density: 8 },
  { id: 'lob',        name: 'Tousled Lob',         length: 'Medium', tags: ['Effortless'],         ratio: 1.15, angle: 18,  density: 6 },
  { id: 'mullet',     name: 'Mod Mullet',          length: 'Medium', tags: ['Bold','Edgy'],       ratio: 1.05, angle: -22, density: 7 },
  { id: 'buzz',       name: 'Buzz Fade',           length: 'Short',  tags: ['Bold','Minimal'],    ratio: 0.90, angle: 0,   density: 11 },
  { id: 'quiff',      name: 'Side-Part Quiff',     length: 'Short',  tags: ['Classic'],            ratio: 1.05, angle: 30,  density: 8 },
  { id: 'waves',      name: 'Mid-Length Waves',    length: 'Medium', tags: ['Romantic','Wavy'],   ratio: 1.30, angle: 22,  density: 6 },
  { id: 'frenchbob',  name: 'Sleek French Bob',    length: 'Short',  tags: ['Classic','Sleek'],   ratio: 0.92, angle: 90,  density: 10 },
  { id: 'crop',       name: 'Textured Crop',       length: 'Short',  tags: ['Edgy','Tousled'],    ratio: 1.00, angle: -6,  density: 9 },
  { id: 'beach',      name: 'Beach Curls',         length: 'Long',   tags: ['Effortless','Wavy'],  ratio: 1.45, angle: 16,  density: 5 },
  { id: 'ballet',     name: 'Ballet Bun',          length: 'Long',   tags: ['Classic','Sleek'],   ratio: 1.25, angle: 0,   density: 7 },
  { id: 'curlshag',   name: 'Curly Shag',          length: 'Medium', tags: ['Edgy','Curly'],      ratio: 1.18, angle: -18, density: 6 },
  { id: 'pageboy',    name: 'Soft Pageboy',        length: 'Short',  tags: ['Classic','Sleek'],   ratio: 0.98, angle: 90,  density: 8 },
  { id: 'curtaincurl',name: 'Curtain + Curls',     length: 'Long',   tags: ['Romantic'],           ratio: 1.50, angle: 24,  density: 5 },
];

// ── Quiz (card-by-card visual choices) ─────────────────────────────────────
const QUIZ = [
  { id:'face', title:'Pick the face shape closest to yours', sub:'You can change this later.',
    multi:false, options:[
      {value:'oval',    label:'Oval',    sub:'Balanced length & width'},
      {value:'round',   label:'Round',   sub:'Soft, full cheeks'},
      {value:'square',  label:'Square',  sub:'Defined jaw'},
      {value:'heart',   label:'Heart',   sub:'Wider forehead, narrow chin'},
      {value:'long',    label:'Long',    sub:'Length greater than width'},
      {value:'diamond', label:'Diamond', sub:'Narrow forehead & jaw'},
    ]
  },
  { id:'length', title:'Where do you want to land?', sub:'Your target length.',
    multi:false, options:[
      {value:'short',  label:'Short',  sub:'Above the jaw'},
      {value:'medium', label:'Medium', sub:'Shoulder area'},
      {value:'long',   label:'Long',   sub:'Below the collarbone'},
    ]
  },
  { id:'texture', title:'What is your natural texture?',
    multi:false, options:[
      {value:'straight', label:'Straight'},
      {value:'wavy',     label:'Wavy'},
      {value:'curly',    label:'Curly'},
      {value:'coily',    label:'Coily'},
    ]
  },
  { id:'lifestyle', title:'How much time do you want to spend on it?', sub:'Daily styling reality.',
    multi:false, options:[
      {value:'low',  label:'Almost none', sub:'< 5 min'},
      {value:'med',  label:'A little',    sub:'5–15 min'},
      {value:'high', label:'I enjoy it',  sub:'15+ min'},
    ]
  },
  { id:'vibes', title:'Pick the vibes that feel like you', sub:'Choose any number.',
    multi:true, options:[
      {value:'classic',    label:'Classic'},
      {value:'edgy',       label:'Edgy'},
      {value:'romantic',   label:'Romantic'},
      {value:'effortless', label:'Effortless'},
      {value:'minimal',    label:'Minimal'},
      {value:'bold',       label:'Bold'},
    ]
  },
];

// ── Striped placeholder ────────────────────────────────────────────────────
// Deterministic stripe pattern keyed off a hairstyle. Looks like a fabric
// swatch; we vary angle + density per item so the masonry has rhythm.
// Optional small label in mono.
function StripedPlaceholder({
  style, bg, stripe, label, mono = false,
  angle = null, density = null, ratio = null,
  showLabel = true, labelPlacement = 'br', children,
}) {
  const a = angle ?? style?.angle ?? 12;
  const d = density ?? style?.density ?? 7;
  // CSS repeating-linear-gradient — soft, painterly. Two-stop stripes that
  // alternate paper/hair-soft so the result reads as a tonal swatch rather
  // than barcode.
  const spacing = Math.max(4, 18 - d);
  const bgC = bg || 'var(--p-stripe, #eadccb)';
  const stC = stripe || 'var(--p-hairSoft, #f1c9b3)';
  const bgImg = `repeating-linear-gradient(${a}deg, ${bgC} 0 ${spacing}px, ${stC} ${spacing}px ${spacing*1.6}px)`;
  const pos = {
    br: { right: 8, bottom: 8 },
    bl: { left: 8, bottom: 8 },
    tl: { left: 8, top: 8 },
    tr: { right: 8, top: 8 },
  }[labelPlacement] || { right: 8, bottom: 8 };
  return (
    <div style={{
      position:'relative', width:'100%', height:'100%',
      backgroundImage: bgImg, overflow:'hidden',
    }}>
      {/* a subtle vignette so it doesn't feel flat */}
      <div style={{position:'absolute', inset:0, background:'radial-gradient(120% 80% at 50% 40%, transparent 50%, rgba(0,0,0,.08))'}} />
      {showLabel && (label || style?.name) && (
        <div style={{
          position:'absolute', ...pos,
          padding:'4px 8px',
          background:'rgba(255,255,255,.82)',
          color: 'var(--p-ink, #2a241d)',
          fontFamily: mono ? "'DM Mono', ui-monospace, monospace" : 'inherit',
          fontSize: 10.5, letterSpacing: mono ? 0.04 : 0,
          fontWeight: 500, borderRadius: 2,
          textTransform: mono ? 'uppercase' : 'none',
          whiteSpace:'nowrap',
        }}>
          {mono ? 'IMG · ' : ''}{label || style?.name}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Image slots wrapper ───────────────────────────────────────────────────
// React wrapper around <image-slot>. The slot id is keyed by hairstyle so
// a photo dropped once shows everywhere that style appears.
function HairImage({ style, suffix = '', radius = 0 }) {
  const a = style?.angle ?? 12;
  const d = style?.density ?? 7;
  const spacing = Math.max(4, 18 - d);
  const bg = `repeating-linear-gradient(${a}deg, var(--p-stripe, #e6d6b8) 0 ${spacing}px, var(--p-hairSoft, #e8b39b) ${spacing}px ${spacing*1.6}px)`;
  // image-slot is a custom element — React passes string attributes through
  // as-is. We also stamp the host with the striped pattern so the empty
  // state shows the textured fallback through ::part(frame){background:transparent}.
  return (
    <div style={{
      width:'100%', height:'100%', position:'relative',
      backgroundImage: bg,
      borderRadius: radius || undefined, overflow: radius ? 'hidden' : undefined,
    }}>
      <image-slot
        id={`hair-${style.id}${suffix ? '-' + suffix : ''}`}
        shape={radius ? 'rounded' : 'rect'}
        radius={radius || undefined}
        placeholder={`Drop a "${style.name}" photo`}
        style={{ position:'absolute', inset:0, width:'100%', height:'100%', display:'block' }}
      />
    </div>
  );
}

// Face upload slot — each slot has its own persistent id.
function FaceSlot({ slot, label, instructions }) {
  return (
    <image-slot
      id={`face-${slot}`}
      shape="rect"
      placeholder={`${label} — drop photo`}
      style={{ width:'100%', height:'100%', display:'block', background:'var(--p-stripe, #e6d6b8)' }}
    />
  );
}


const HeartIcon = ({ filled, size = 16, color = 'currentColor', stroke = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 20 20" fill={filled ? color : 'none'} stroke={color} strokeWidth={stroke} strokeLinejoin="round">
    <path d="M10 17s-6.5-4.2-6.5-9A3.5 3.5 0 0 1 10 5.5 3.5 3.5 0 0 1 16.5 8c0 4.8-6.5 9-6.5 9z" />
  </svg>
);

// ── Generic icon set (line) ────────────────────────────────────────────────
const Icons = {
  Home: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/></svg>,
  Quiz: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M8 9a4 4 0 1 1 5.5 3.7c-1 .4-1.5 1-1.5 2v.3"/><circle cx="12" cy="18" r=".5" fill="currentColor"/></svg>,
  Camera: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 8h3l2-3h8l2 3h3v11H3z"/><circle cx="12" cy="13" r="3.5"/></svg>,
  Browse: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
  Heart: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/></svg>,
  Photos: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="1"/><circle cx="9" cy="10" r="1.5"/><path d="M3 17l5-4 4 3 4-3 5 5"/></svg>,
  Profile: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="4"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6"/></svg>,
  Arrow: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  ArrowL: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>,
  Plus: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>,
  Check: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12l4 4 10-10"/></svg>,
  Sparkle: (p) => <svg viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.4 4.6L18 8l-4.6 1.4L12 14l-1.4-4.6L6 8l4.6-1.4z" opacity=".8"/><path d="M19 14l.7 2.3L22 17l-2.3.7L19 20l-.7-2.3L16 17l2.3-.7z"/></svg>,
  Search: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="6"/><path d="M20 20l-4.3-4.3"/></svg>,
  X: (p) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
};

// ── Hook: shared favorites state per-app ───────────────────────────────────
// Each direction calls this independently — they don't share favorites across
// the canvas (so each one demos "empty -> save -> populated" cleanly).
function useFavorites(initial = []) {
  const [favs, setFavs] = React.useState(new Set(initial));
  const toggle = React.useCallback((id) => {
    setFavs((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }, []);
  return [favs, toggle];
}

// ── Hook: simple screen router with history ────────────────────────────────
function useScreen(initial) {
  const [screen, setScreen] = React.useState(initial);
  const [stack, setStack] = React.useState([]);
  const go = (s) => { setStack((st) => [...st, screen]); setScreen(s); };
  const back = () => setStack((st) => { if (!st.length) return st; setScreen(st[st.length - 1]); return st.slice(0, -1); });
  const reset = (s) => { setStack([]); setScreen(s); };
  return { screen, go, back, reset };
}

// Make everything global so other JSX files pick it up.
Object.assign(window, {
  HAIRSTYLES, QUIZ,
  StripedPlaceholder, HairImage, FaceSlot, HeartIcon, Icons,
  useFavorites, useScreen,
});

// Direction B — Salon
// Warm, friendly, rounded cards. Top navigation bar. Generous soft shadows.
// Manrope body, Fraunces display headings, peachy primary buttons.

function SalonApp({ palette }) {
  const { screen, go, reset } = useScreen('welcome');
  const [favs, toggleFav] = useFavorites(['curtain','beach','crop','waves']);
  const [quizState, setQuizState] = React.useState({ length: 'medium', texture: 'wavy' });
  const [photos, setPhotos] = React.useState({ front: true, left: true, right: false });
  const [detailId, setDetailId] = React.useState(null);

  const openDetail = (id) => { setDetailId(id); go('detail'); };

  const styles = {
    root: {
      width:'100%', height:'100%', display:'flex', flexDirection:'column',
      background:'var(--p-paper, #f7f1e8)',
      color:'var(--p-ink, #2a241d)',
      fontFamily:"'Manrope', system-ui, sans-serif",
      fontSize: 14, lineHeight: 1.5,
    },
    topbar: {
      display:'flex', alignItems:'center', gap:24,
      padding:'16px 32px',
      borderBottom:'1px solid rgba(0,0,0,.06)',
      background: 'var(--p-paper, #f7f1e8)',
    },
    main: { flex:1, overflow:'hidden', display:'flex', flexDirection:'column' },
  };

  const navItems = [
    { id:'welcome',   label:'Home',      icon:Icons.Home },
    { id:'quiz',      label:'Quiz',      icon:Icons.Quiz },
    { id:'upload',    label:'Photos',    icon:Icons.Camera },
    { id:'browse',    label:'Browse',    icon:Icons.Browse },
    { id:'favorites', label:'Favorites', icon:Icons.Heart, count: favs.size },
    { id:'photos',    label:'My Photos', icon:Icons.Photos },
    { id:'profile',   label:'Profile',   icon:Icons.Profile },
  ];

  return (
    <div style={styles.root}>
      <header style={styles.topbar}>
        <div style={{display:'flex', alignItems:'center', gap:10, marginRight: 12}}>
          <div style={{
            width:34, height:34, borderRadius:'50%',
            background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontFamily:"'Fraunces',serif", fontSize:18, fontWeight:600,
            fontVariationSettings:'"SOFT" 100',
          }}>m</div>
          <div style={{fontFamily:"'Fraunces',serif", fontSize:19, fontWeight:600, letterSpacing:-0.3}}>
            mane
          </div>
        </div>
        <nav style={{display:'flex', gap:2, flex:1}}>
          {navItems.map((n) => {
            const active = screen === n.id || (n.id === 'browse' && screen === 'detail');
            return (
              <button key={n.id} onClick={() => reset(n.id)}
                style={{
                  appearance:'none', background: active ? 'var(--p-chip,#efe6d9)' : 'transparent',
                  border:0, padding:'8px 14px', borderRadius: 99, fontFamily:'inherit',
                  fontSize:13, fontWeight: active ? 600 : 500, color: active ? 'var(--p-ink,#2a241d)' : 'rgba(42,36,29,.6)',
                  cursor:'pointer', display:'flex', alignItems:'center', gap:8,
                }}>
                <n.icon width={16} height={16} />
                {n.label}
                {n.count != null && n.count > 0 && (
                  <span style={{
                    background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)',
                    fontSize:10, fontWeight:600, padding:'1px 6px', borderRadius:99,
                  }}>{n.count}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div style={{display:'flex', alignItems:'center', gap:14}}>
          <button style={{appearance:'none', background:'transparent', border:0, padding:6, cursor:'pointer', color:'rgba(42,36,29,.55)'}}>
            <Icons.Search width={18} height={18}/>
          </button>
          <div style={{width:34, height:34, borderRadius:'50%', background:'var(--p-stripe,#eadccb)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:600}}>
            J
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {screen === 'welcome'   && <SalonWelcome  go={go} />}
        {screen === 'quiz'      && <SalonQuiz     go={go} state={quizState} setState={setQuizState} />}
        {screen === 'upload'    && <SalonUpload   go={go} photos={photos} setPhotos={setPhotos} />}
        {screen === 'browse'    && <SalonBrowse   go={openDetail} favs={favs} toggle={toggleFav} />}
        {screen === 'detail'    && <SalonDetail   id={detailId} favs={favs} toggle={toggleFav} go={go} />}
        {screen === 'favorites' && <SalonFavorites favs={favs} toggle={toggleFav} go={openDetail} />}
        {screen === 'photos'    && <SalonPhotos   photos={photos} go={go} />}
        {screen === 'profile'   && <SalonProfile  />}
      </main>
    </div>
  );
}

// ── Salon button ───────────────────────────────────────────────────────────
const SalonBtn = ({ children, onClick, variant = 'primary', size = 'md', ...rest }) => {
  const base = {
    primary: { bg:'var(--p-hair,#c97a55)', fg:'var(--p-paper,#f7f1e8)' },
    secondary: { bg:'var(--p-chip,#efe6d9)', fg:'var(--p-ink,#2a241d)' },
    ghost: { bg:'transparent', fg:'var(--p-ink,#2a241d)' },
    ink: { bg:'var(--p-ink,#2a241d)', fg:'var(--p-paper,#f7f1e8)' },
  }[variant];
  const sz = { sm:{ p:'8px 14px', f:12 }, md:{ p:'12px 22px', f:13 }, lg:{ p:'14px 28px', f:15 }}[size];
  return (
    <button onClick={onClick}
      style={{
        appearance:'none', border:0, borderRadius:99,
        background: base.bg, color: base.fg, padding: sz.p, fontFamily:'inherit',
        fontSize: sz.f, fontWeight: 600, cursor:'pointer', display:'inline-flex',
        alignItems:'center', gap:8, transition:'transform .15s',
      }}
      {...rest}>{children}</button>
  );
};

// ── Salon · Welcome ────────────────────────────────────────────────────────
function SalonWelcome({ go }) {
  return (
    <div style={{padding:'40px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:36, alignItems:'stretch', marginBottom:28}}>
        {/* Hero card */}
        <div style={{
          background:'linear-gradient(135deg, var(--p-hairSoft,#f1c9b3) 0%, var(--p-card,#fff) 100%)',
          borderRadius:24, padding:'40px 44px', position:'relative', overflow:'hidden',
        }}>
          <div style={{fontSize:12, fontWeight:600, letterSpacing:0.1, textTransform:'uppercase', color:'var(--p-hair,#c97a55)', marginBottom:14}}>
            Hi, Jordan ✿
          </div>
          <h1 style={{
            fontFamily:"'Fraunces',serif", fontWeight:500, fontVariationSettings:'"opsz" 144,"SOFT" 100',
            fontSize:54, lineHeight:1.0, letterSpacing:-1.6, margin:'0 0 18px', maxWidth:480,
          }}>
            Let's find a haircut you'll <em style={{fontStyle:'italic', fontWeight:400}}>actually</em> love.
          </h1>
          <p style={{fontSize:15, maxWidth:440, color:'rgba(42,36,29,.78)', margin:'0 0 24px', lineHeight:1.55}}>
            Six quick questions, three selfies, and a swipeable wall of looks tailored to your face shape and hair texture.
          </p>
          <div style={{display:'flex', gap:10}}>
            <SalonBtn onClick={() => go('quiz')} size="lg">Start the quiz <Icons.Arrow width={16} height={16}/></SalonBtn>
            <SalonBtn onClick={() => go('browse')} variant="ghost" size="lg">Just browsing</SalonBtn>
          </div>
          {/* decorative blob */}
          <div style={{position:'absolute', right:-30, bottom:-30, width:180, height:180, borderRadius:'50%', background:'var(--p-hair,#c97a55)', opacity:0.18}}/>
          <div style={{position:'absolute', right:60, top:30, width:90, height:90, borderRadius:'50%', background:'var(--p-card,#fff)', opacity:0.5}}/>
        </div>

        {/* Progress card */}
        <div style={{
          background:'var(--p-card,#fff)', borderRadius:24, padding:'28px 28px 24px',
          boxShadow:'0 1px 0 rgba(0,0,0,.03), 0 12px 28px rgba(0,0,0,.04)',
          display:'flex', flexDirection:'column', gap:14,
        }}>
          <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20, letterSpacing:-0.4}}>Your profile</div>
          <div style={{display:'flex', alignItems:'center', gap:12}}>
            <CircleProgress value={0.66}/>
            <div>
              <div style={{fontWeight:600, fontSize:14}}>2 of 3 steps done</div>
              <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>One more thing and you're set.</div>
            </div>
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:10, marginTop:6}}>
            <StepRow done label="Quiz answered" sub="Heart shape · wavy" />
            <StepRow done label="2 photos uploaded" sub="Front & left side" />
            <StepRow done={false} label="Upload right side" sub="So we can finish recommendations"
              cta={() => go('upload')} />
          </div>
        </div>
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:14}}>
        <h3 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:24, letterSpacing:-0.4, margin:0}}>
          Picked for you today
        </h3>
        <button onClick={() => go('browse')} style={{background:'transparent', border:0, fontFamily:'inherit', fontSize:13, color:'var(--p-hair,#c97a55)', fontWeight:600, cursor:'pointer'}}>
          See all 18 →
        </button>
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:14}}>
        {[HAIRSTYLES[1], HAIRSTYLES[5], HAIRSTYLES[6], HAIRSTYLES[12]].map((s) => (
          <div key={s.id} style={{background:'var(--p-card,#fff)', borderRadius:18, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 6px 16px rgba(0,0,0,.04)'}}>
            <div style={{aspectRatio:'4/5'}}>
              <StripedPlaceholder style={s} showLabel={false}/>
            </div>
            <div style={{padding:'12px 14px 14px'}}>
              <div style={{fontWeight:600, fontSize:14}}>{s.name}</div>
              <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{s.length} · {s.tags[0]}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const CircleProgress = ({ value = 0.5, size = 52 }) => {
  const r = (size - 6) / 2, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--p-chip,#efe6d9)" strokeWidth="4"/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--p-hair,#c97a55)" strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c*(1-value)} strokeLinecap="round" transform={`rotate(-90 ${size/2} ${size/2})`}/>
      <text x="50%" y="50%" dominantBaseline="central" textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--p-ink, #2a241d)" fontFamily="inherit">{Math.round(value*100)}%</text>
    </svg>
  );
};

const StepRow = ({ done, label, sub, cta }) => (
  <div style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:'1px solid rgba(0,0,0,.05)'}}>
    <div style={{
      width:22, height:22, borderRadius:'50%',
      background: done ? 'var(--p-hair,#c97a55)' : 'transparent',
      border: done ? 0 : '1.5px dashed rgba(0,0,0,.2)',
      color:'var(--p-paper,#f7f1e8)', flexShrink:0,
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      {done && <Icons.Check width={12} height={12}/>}
    </div>
    <div style={{flex:1}}>
      <div style={{fontSize:13, fontWeight: done ? 500 : 600, opacity: done ? 0.7 : 1, textDecoration: done ? 'line-through' : 'none'}}>{label}</div>
      <div style={{fontSize:11.5, color:'rgba(42,36,29,.55)'}}>{sub}</div>
    </div>
    {cta && <button onClick={cta} style={{appearance:'none', background:'transparent', border:0, fontFamily:'inherit', fontSize:12, color:'var(--p-hair,#c97a55)', fontWeight:600, cursor:'pointer'}}>Finish →</button>}
  </div>
);

// ── Salon · Quiz ───────────────────────────────────────────────────────────
function SalonQuiz({ go, state, setState }) {
  const [step, setStep] = React.useState(0);
  const q = QUIZ[step];
  const value = state[q.id];
  const setAnswer = (val) => {
    if (q.multi) {
      const cur = new Set(state[q.id] || []);
      cur.has(val) ? cur.delete(val) : cur.add(val);
      setState({ ...state, [q.id]: [...cur] });
    } else setState({ ...state, [q.id]: val });
  };
  const isSelected = (v) => q.multi ? (value || []).includes(v) : value === v;
  const canNext = q.multi ? (value && value.length) : !!value;

  return (
    <div style={{flex:1, display:'flex', flexDirection:'column', padding:'24px 48px 24px'}}>
      {/* progress */}
      <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:24}}>
        <div style={{fontSize:12, fontWeight:600, color:'var(--p-hair,#c97a55)'}}>Step {step+1} of {QUIZ.length}</div>
        <div style={{flex:1, height:6, borderRadius:99, background:'var(--p-chip,#efe6d9)', overflow:'hidden'}}>
          <div style={{height:'100%', width:`${(step+1)/QUIZ.length*100}%`, background:'var(--p-hair,#c97a55)', borderRadius:99, transition:'width .25s'}}/>
        </div>
      </div>

      <div style={{
        background:'var(--p-card,#fff)', borderRadius:24, padding:'32px 36px',
        boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 12px 28px rgba(0,0,0,.05)',
        flex:1, display:'flex', flexDirection:'column',
      }}>
        <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:30, letterSpacing:-0.6, margin:'0 0 6px'}}>
          {q.title}
        </h2>
        {q.sub && <div style={{fontSize:14, color:'rgba(42,36,29,.6)', marginBottom:22}}>{q.sub}</div>}

        <div style={{
          display:'grid',
          gridTemplateColumns: q.options.length > 4 ? 'repeat(3, 1fr)' : `repeat(${q.options.length}, 1fr)`,
          gap:14, flex:1, alignContent:'flex-start',
        }}>
          {q.options.map((opt) => {
            const sel = isSelected(opt.value);
            return (
              <button key={opt.value} onClick={() => setAnswer(opt.value)}
                style={{
                  appearance:'none', textAlign:'left',
                  background:'var(--p-paper,#f7f1e8)',
                  border: sel ? '2px solid var(--p-hair,#c97a55)' : '2px solid transparent',
                  borderRadius:18, padding:0, cursor:'pointer', overflow:'hidden',
                  fontFamily:'inherit', position:'relative',
                  transition:'transform .15s, border-color .15s',
                }}>
                <div style={{aspectRatio:'5/4'}}>
                  <StripedPlaceholder
                    angle={(opt.value.charCodeAt(0)*37) % 80 - 40}
                    density={5 + ((opt.value.length) % 4)}
                    showLabel={false}/>
                </div>
                {sel && (
                  <div style={{position:'absolute', top:10, right:10, width:26, height:26, borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <Icons.Check width={14} height={14}/>
                  </div>
                )}
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:17, letterSpacing:-0.2}}>{opt.label}</div>
                  {opt.sub && <div style={{fontSize:12, color:'rgba(42,36,29,.55)', marginTop:2}}>{opt.sub}</div>}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:18, paddingTop:16, borderTop:'1px solid rgba(0,0,0,.05)'}}>
          <SalonBtn variant="ghost" onClick={() => step > 0 ? setStep(step-1) : go('welcome')}>
            <Icons.ArrowL width={14} height={14}/> Back
          </SalonBtn>
          <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>
            {q.multi ? `${(value||[]).length} selected` : (value ? 'Looks good ✓' : 'Pick one to continue')}
          </div>
          <SalonBtn variant={canNext ? 'primary' : 'secondary'} onClick={() => canNext && (step < QUIZ.length - 1 ? setStep(step+1) : go('upload'))}>
            {step === QUIZ.length - 1 ? 'Upload photos' : 'Next'} <Icons.Arrow width={14} height={14}/>
          </SalonBtn>
        </div>
      </div>
    </div>
  );
}

// ── Salon · Upload ─────────────────────────────────────────────────────────
function SalonUpload({ go, photos, setPhotos }) {
  const slots = [
    { id:'front', label:'Front',      sub:'Hair pulled back, look straight ahead.',  emoji:'•' },
    { id:'left',  label:'Left side',  sub:'Profile view, ear showing.',              emoji:'•' },
    { id:'right', label:'Right side', sub:'Same as left but the other way.',         emoji:'•' },
  ];
  const done = Object.values(photos).filter(Boolean).length;
  return (
    <div style={{padding:'32px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:36, letterSpacing:-0.8, margin:0}}>
            Three quick photos
          </h2>
          <div style={{fontSize:14, color:'rgba(42,36,29,.6)', marginTop:6}}>
            Natural light is great. No makeup, special angle, or filter needed.
          </div>
        </div>
        <div style={{
          background:'var(--p-chip,#efe6d9)', borderRadius:99,
          padding:'8px 14px', fontSize:12, fontWeight:600,
        }}>{done}/3 uploaded</div>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16, marginBottom:22}}>
        {slots.map((s, i) => {
          const filled = photos[s.id];
          return (
            <div key={s.id} style={{
              background:'var(--p-card,#fff)', borderRadius:20, padding:16,
              boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 8px 22px rgba(0,0,0,.04)',
            }}>
              <div onClick={() => setPhotos({ ...photos, [s.id]: !filled })}
                style={{
                  aspectRatio:'3/4', borderRadius:14, overflow:'hidden', cursor:'pointer',
                  background: filled ? 'var(--p-stripe,#eadccb)' : 'var(--p-paper,#f7f1e8)',
                  border: filled ? 'none' : '2px dashed rgba(0,0,0,.18)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  position:'relative', marginBottom:12,
                }}>
                {filled ? (
                  <StripedPlaceholder
                    angle={i*20} density={5}
                    bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)"
                    showLabel={false}
                  />
                ) : (
                  <div style={{textAlign:'center', color:'rgba(42,36,29,.55)'}}>
                    <div style={{
                      width:52, height:52, borderRadius:'50%', background:'var(--p-chip,#efe6d9)',
                      margin:'0 auto 12px', display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <Icons.Camera width={22} height={22}/>
                    </div>
                    <div style={{fontWeight:600, fontSize:14, color:'var(--p-ink,#2a241d)'}}>Tap to upload</div>
                    <div style={{fontSize:12, marginTop:4}}>or drag a photo here</div>
                  </div>
                )}
                {filled && (
                  <div style={{position:'absolute', top:10, right:10, width:28, height:28, borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <Icons.Check width={14} height={14}/>
                  </div>
                )}
              </div>
              <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:18}}>{s.label}</div>
              <div style={{fontSize:12, color:'rgba(42,36,29,.55)', marginTop:2}}>{s.sub}</div>
            </div>
          );
        })}
      </div>

      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <SalonBtn variant="ghost" onClick={() => go('quiz')}><Icons.ArrowL width={14} height={14}/> Back to quiz</SalonBtn>
        <SalonBtn onClick={() => go('browse')} size="lg">See my styles <Icons.Arrow width={16} height={16}/></SalonBtn>
      </div>
    </div>
  );
}

// ── Salon · Browse ─────────────────────────────────────────────────────────
function SalonBrowse({ go, favs, toggle }) {
  const [filter, setFilter] = React.useState('All');
  const filters = ['All','Short','Medium','Long'];
  const tags = ['Classic','Edgy','Romantic','Effortless','Bold','Sleek'];
  const [activeTag, setActiveTag] = React.useState(null);
  const items = HAIRSTYLES.filter(h =>
    (filter === 'All' || h.length === filter) &&
    (!activeTag || h.tags.includes(activeTag))
  );

  return (
    <div style={{flex:1, overflow:'hidden', display:'flex', flexDirection:'column'}}>
      <div style={{padding:'24px 48px 14px', background:'var(--p-paper,#f7f1e8)'}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:12}}>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, letterSpacing:-0.6, margin:0}}>
            Styles for you
          </h2>
          <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{items.length} looks · refreshed daily</div>
        </div>
        <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
          <div style={{display:'flex', gap:4, padding:4, background:'var(--p-chip,#efe6d9)', borderRadius:99}}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  appearance:'none', border:0, padding:'6px 14px', borderRadius:99,
                  background: filter === f ? 'var(--p-card,#fff)' : 'transparent',
                  fontWeight: filter === f ? 600 : 500, fontSize:12, fontFamily:'inherit',
                  color:'var(--p-ink,#2a241d)', cursor:'pointer',
                  boxShadow: filter === f ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                }}>{f}</button>
            ))}
          </div>
          <div style={{width:1, height:18, background:'rgba(0,0,0,.1)'}}/>
          {tags.map(t => (
            <button key={t} onClick={() => setActiveTag(activeTag === t ? null : t)}
              style={{
                appearance:'none', borderRadius:99, padding:'6px 12px', fontSize:12, fontFamily:'inherit',
                border: activeTag === t ? '1px solid var(--p-hair,#c97a55)' : '1px solid rgba(0,0,0,.1)',
                background: activeTag === t ? 'var(--p-hair,#c97a55)' : 'transparent',
                color: activeTag === t ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                cursor:'pointer', fontWeight:500,
              }}>{t}</button>
          ))}
        </div>
      </div>

      <div style={{flex:1, overflow:'auto', padding:'18px 48px 36px'}}>
        <div style={{columnCount:4, columnGap:14}}>
          {items.map((s) => {
            const liked = favs.has(s.id);
            return (
              <div key={s.id} onClick={() => go(s.id)} style={{
                breakInside:'avoid', marginBottom:14, background:'var(--p-card,#fff)',
                borderRadius:18, overflow:'hidden', cursor:'pointer',
                boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 6px 14px rgba(0,0,0,.04)',
              }}>
                <div style={{position:'relative', aspectRatio: `1 / ${s.ratio}`}}>
                  <StripedPlaceholder style={s} showLabel={false}/>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{
                      position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%',
                      background: liked ? 'var(--p-hair,#c97a55)' : 'rgba(255,255,255,.92)',
                      color: liked ? 'var(--p-paper,#f7f1e8)' : 'var(--p-ink,#2a241d)',
                      border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center',
                      boxShadow:'0 2px 6px rgba(0,0,0,.12)',
                    }}>
                    <HeartIcon filled={liked} size={15}/>
                  </button>
                </div>
                <div style={{padding:'10px 14px 14px'}}>
                  <div style={{fontWeight:600, fontSize:14, marginBottom:4}}>{s.name}</div>
                  <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {s.tags.map(t => (
                      <span key={t} style={{fontSize:11, padding:'2px 8px', borderRadius:99, background:'var(--p-chip,#efe6d9)', color:'rgba(42,36,29,.75)'}}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Salon · Detail ─────────────────────────────────────────────────────────
function SalonDetail({ id, favs, toggle, go }) {
  const s = HAIRSTYLES.find((h) => h.id === id) || HAIRSTYLES[0];
  const liked = favs.has(s.id);
  return (
    <div style={{flex:1, overflow:'auto', padding:'24px 48px 36px'}}>
      <button onClick={() => go('browse')}
        style={{background:'transparent', border:0, fontFamily:'inherit', fontSize:13, color:'rgba(42,36,29,.6)', cursor:'pointer', display:'flex', alignItems:'center', gap:6, marginBottom:14}}>
        <Icons.ArrowL width={14} height={14}/> Back to browse
      </button>
      <div style={{display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:28}}>
        <div style={{display:'flex', flexDirection:'column', gap:10}}>
          <div style={{aspectRatio:'5/6', borderRadius:24, overflow:'hidden', background:'var(--p-card,#fff)'}}>
            <StripedPlaceholder style={s} showLabel={false}/>
          </div>
          <div style={{display:'grid', gridTemplateColumns:'repeat(4, 1fr)', gap:8}}>
            {[0,1,2,3].map((i) => (
              <div key={i} style={{aspectRatio:'1/1', borderRadius:10, overflow:'hidden'}}>
                <StripedPlaceholder bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)" angle={s.angle + i*12} density={s.density - 1} showLabel={false}/>
              </div>
            ))}
          </div>
        </div>
        <div style={{background:'var(--p-card,#fff)', borderRadius:24, padding:'28px 28px', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 12px 28px rgba(0,0,0,.05)'}}>
          <div style={{display:'flex', gap:6, marginBottom:10}}>
            {s.tags.map(t => (
              <span key={t} style={{fontSize:11, padding:'2px 10px', borderRadius:99, background:'var(--p-chip,#efe6d9)'}}>{t}</span>
            ))}
          </div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:36, letterSpacing:-0.8, margin:'0 0 8px'}}>
            {s.name}
          </h2>
          <p style={{fontSize:14.5, color:'rgba(42,36,29,.7)', margin:'0 0 22px', lineHeight:1.55}}>
            A friendly, modern cut that flatters most face shapes. Softer through the lengths so it grows out nicely; you can wear it polished or undone.
          </p>

          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:24}}>
            {[
              ['Time to style', '5–10 min', '⏱'],
              ['Trim cycle',    '6–8 weeks', '✂'],
              ['Best for',      'Heart, oval', '✿'],
              ['Texture',       'Wavy, straight', '∿'],
            ].map(([k,v,e]) => (
              <div key={k} style={{background:'var(--p-paper,#f7f1e8)', borderRadius:14, padding:'10px 12px'}}>
                <div style={{fontSize:11, color:'rgba(42,36,29,.55)', textTransform:'uppercase', letterSpacing:0.05, fontWeight:600}}>{k}</div>
                <div style={{fontSize:14, fontWeight:600, marginTop:2}}>{v}</div>
              </div>
            ))}
          </div>

          <div style={{fontWeight:600, fontSize:13, marginBottom:8}}>What you'll need to ask for</div>
          <ul style={{margin:0, padding:'0 0 0 18px', fontSize:13, color:'rgba(42,36,29,.75)', lineHeight:1.6}}>
            <li>Length stops at the collarbone</li>
            <li>Internal layers, not surface ones</li>
            <li>Soft, longer bangs starting at the cheekbone</li>
          </ul>

          <div style={{display:'flex', gap:10, marginTop:22}}>
            <SalonBtn variant={liked ? 'ink' : 'primary'} onClick={() => toggle(s.id)}>
              <HeartIcon filled={liked} size={14}/> {liked ? 'Saved' : 'Save'}
            </SalonBtn>
            <SalonBtn variant="secondary">Share with stylist</SalonBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Salon · Favorites ──────────────────────────────────────────────────────
function SalonFavorites({ favs, toggle, go }) {
  const items = HAIRSTYLES.filter(h => favs.has(h.id));
  return (
    <div style={{padding:'28px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, letterSpacing:-0.6, margin:0}}>Your favorites</h2>
          <div style={{fontSize:13, color:'rgba(42,36,29,.6)', marginTop:4}}>
            {items.length === 0 ? 'Save styles you love and they\'ll live here.' : `${items.length} looks · ready to share with your stylist`}
          </div>
        </div>
        {items.length > 0 && (
          <div style={{display:'flex', gap:8}}>
            <SalonBtn variant="secondary" size="sm">Export PDF</SalonBtn>
            <SalonBtn size="sm">Share collection</SalonBtn>
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div style={{
          background:'var(--p-card,#fff)', borderRadius:24, padding:'80px 24px', textAlign:'center',
          boxShadow:'0 1px 2px rgba(0,0,0,.04)',
        }}>
          <div style={{width:56, height:56, borderRadius:'50%', background:'var(--p-chip,#efe6d9)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Icons.Heart width={24} height={24}/>
          </div>
          <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20}}>No favorites yet</div>
          <div style={{fontSize:13, color:'rgba(42,36,29,.6)', marginTop:6, marginBottom:14}}>Tap the heart on any style to save it.</div>
        </div>
      ) : (
        <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:14}}>
          {items.map(s => {
            return (
              <div key={s.id} style={{background:'var(--p-card,#fff)', borderRadius:18, overflow:'hidden', boxShadow:'0 1px 2px rgba(0,0,0,.04), 0 6px 14px rgba(0,0,0,.04)'}}>
                <div style={{position:'relative', aspectRatio:'4/5', cursor:'pointer'}} onClick={() => go(s.id)}>
                  <StripedPlaceholder style={s} showLabel={false}/>
                  <button onClick={(e) => { e.stopPropagation(); toggle(s.id); }}
                    style={{position:'absolute', top:10, right:10, width:34, height:34, borderRadius:'50%', background:'var(--p-hair,#c97a55)', color:'var(--p-paper,#f7f1e8)', border:0, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                    <HeartIcon filled size={15}/>
                  </button>
                </div>
                <div style={{padding:'12px 14px 14px'}}>
                  <div style={{fontWeight:600, fontSize:14}}>{s.name}</div>
                  <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{s.length} · {s.tags.join(', ')}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Salon · Photos ─────────────────────────────────────────────────────────
function SalonPhotos({ photos, go }) {
  const slots = [
    { id:'front', label:'Front',      file:'IMG_2401.heic' },
    { id:'left',  label:'Left side',  file:'IMG_2402.heic' },
    { id:'right', label:'Right side', file:'IMG_2403.heic' },
  ];
  return (
    <div style={{padding:'28px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:32, letterSpacing:-0.6, margin:0}}>My photos</h2>
          <div style={{fontSize:13, color:'rgba(42,36,29,.6)', marginTop:4}}>These help us match styles to your face shape. Only you can see them.</div>
        </div>
        <SalonBtn variant="secondary" onClick={() => go('upload')}>Retake photos</SalonBtn>
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:16}}>
        {slots.map((s, i) => {
          const filled = photos[s.id];
          return (
            <div key={s.id} style={{background:'var(--p-card,#fff)', borderRadius:20, padding:14, boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
              <div style={{aspectRatio:'3/4', borderRadius:14, overflow:'hidden', marginBottom:10, background: filled ? 'var(--p-stripe,#eadccb)' : 'var(--p-paper,#f7f1e8)'}}>
                {filled ? (
                  <StripedPlaceholder bg="var(--p-stripe,#eadccb)" stripe="var(--p-hairSoft,#f1c9b3)" angle={i*15} density={5} showLabel={false}/>
                ) : (
                  <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', color:'rgba(42,36,29,.55)'}}>
                    Not uploaded yet
                  </div>
                )}
              </div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                <div>
                  <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:16}}>{s.label}</div>
                  <div style={{fontSize:11.5, color:'rgba(42,36,29,.55)'}}>{filled ? s.file : 'add a photo'}</div>
                </div>
                <button style={{appearance:'none', background:'var(--p-chip,#efe6d9)', border:0, width:28, height:28, borderRadius:'50%', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
                  ⋯
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        marginTop:24, background:'var(--p-card,#fff)', borderRadius:20, padding:'18px 22px',
        display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 2px rgba(0,0,0,.04)',
      }}>
        <div style={{width:38, height:38, borderRadius:'50%', background:'var(--p-chip,#efe6d9)', display:'flex', alignItems:'center', justifyContent:'center'}}>
          <Icons.Sparkle width={20} height={20}/>
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:600, fontSize:14}}>Privacy</div>
          <div style={{fontSize:12.5, color:'rgba(42,36,29,.6)'}}>Photos stay on your device — we only use them to filter recommendations locally.</div>
        </div>
      </div>
    </div>
  );
}

// ── Salon · Profile ────────────────────────────────────────────────────────
function SalonProfile() {
  return (
    <div style={{padding:'28px 48px', flex:1, overflow:'auto'}}>
      <div style={{display:'grid', gridTemplateColumns:'1fr 2fr', gap:24}}>
        <div style={{background:'var(--p-card,#fff)', borderRadius:20, padding:22, boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
          <div style={{width:72, height:72, borderRadius:'50%', background:'var(--p-stripe,#eadccb)', margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Fraunces',serif", fontSize:30, fontWeight:600}}>J</div>
          <div style={{textAlign:'center', fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20}}>Jordan Lee</div>
          <div style={{textAlign:'center', fontSize:12, color:'rgba(42,36,29,.6)', marginBottom:18}}>jordan@hello.co</div>
          <SalonBtn variant="secondary" size="sm" style={{width:'100%'}}>Edit profile</SalonBtn>

          <div style={{marginTop:20, paddingTop:16, borderTop:'1px solid rgba(0,0,0,.06)'}}>
            <div style={{fontSize:11, fontWeight:600, color:'rgba(42,36,29,.55)', textTransform:'uppercase', letterSpacing:0.05, marginBottom:10}}>Your tags</div>
            <div style={{display:'flex', flexWrap:'wrap', gap:6}}>
              {['Heart shape','Wavy','Medium','Effortless'].map(t => (
                <span key={t} style={{fontSize:12, padding:'4px 10px', borderRadius:99, background:'var(--p-chip,#efe6d9)'}}>{t}</span>
              ))}
            </div>
          </div>
        </div>
        <div style={{background:'var(--p-card,#fff)', borderRadius:20, padding:'18px 22px', boxShadow:'0 1px 2px rgba(0,0,0,.04)'}}>
          <div style={{fontFamily:"'Fraunces',serif", fontWeight:600, fontSize:20, marginBottom:8}}>Settings</div>
          {[
            ['Notifications','New styles weekly', true],
            ['Photo backup','Off', false],
            ['Stylist sharing','Allow link sharing', true],
            ['Trim reminders','Every 8 weeks', true],
            ['Theme','Soft cream'],
          ].map(([k,v,toggle]) => (
            <div key={k} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 0', borderTop:'1px solid rgba(0,0,0,.05)'}}>
              <div>
                <div style={{fontWeight:600, fontSize:13}}>{k}</div>
                <div style={{fontSize:12, color:'rgba(42,36,29,.55)'}}>{v}</div>
              </div>
              {toggle !== undefined && (
                <div style={{
                  width:36, height:20, borderRadius:99,
                  background: toggle ? 'var(--p-hair,#c97a55)' : 'rgba(0,0,0,.15)',
                  position:'relative', cursor:'pointer',
                }}>
                  <div style={{
                    position:'absolute', top:2, left: toggle ? 18 : 2, width:16, height:16, borderRadius:'50%',
                    background:'var(--p-paper,#f7f1e8)', transition:'left .15s',
                  }}/>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

window.SalonApp = SalonApp;

const PALETTE = {
  paper: '#f7f1e8',
  ink: '#2a241d',
  muted: '#a89c8c',
  hair: '#c97a55',
  hairSoft: '#f1c9b3',
  stripe: '#eadccb',
  chip: '#efe6d9',
  card: '#ffffff',
  accent: '#d98a5f'
};

function cssVars(palette) {
  return {
    '--p-paper': palette.paper,
    '--p-ink': palette.ink,
    '--p-muted': palette.muted,
    '--p-hair': palette.hair,
    '--p-hairSoft': palette.hairSoft,
    '--p-stripe': palette.stripe,
    '--p-chip': palette.chip,
    '--p-card': palette.card,
    '--p-accent': palette.accent
  };
}

function RootApp() {
  return (
    <div className="page" style={cssVars(PALETTE)}>
      <main className="app-frame">
        <window.SalonApp palette={PALETTE} />
      </main>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<RootApp />);
