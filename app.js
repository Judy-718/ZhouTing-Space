const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function prefersReducedMotion() {
  return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function setCSSVar(name, value) {
  document.documentElement.style.setProperty(name, value);
}

function initYear() {
  const y = $("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
}

function initAccentFromPage() {
  const accent = document.body?.dataset?.accent;
  if (accent) setCSSVar("--accent", accent);
}

function initCursor() {
  if (!window.matchMedia || !window.matchMedia("(pointer:fine)").matches) return;

  const cursor = $(".cursor");
  if (!cursor) return;

  const label = $(".cursor__label", cursor);
  const avatar = $(".cursor__avatar", cursor);
  let x = -100;
  let y = -100;
  let tx = x;
  let ty = y;
  let raf = 0;

  const speed = 0.16;

  const tick = () => {
    tx += (x - tx) * speed;
    ty += (y - ty) * speed;
    cursor.style.transform = `translate3d(${tx - 26}px, ${ty - 26}px, 0)`;
    raf = requestAnimationFrame(tick);
  };

  const onMove = (e) => {
    x = e.clientX;
    y = e.clientY;
    if (!cursor.classList.contains("is-on")) cursor.classList.add("is-on");
  };

  const setLabel = (text) => {
    const t = (text || "").trim();
    cursor.classList.toggle("has-label", Boolean(t));
    if (label) label.textContent = t;
  };

  const activate = (on) => cursor.classList.toggle("is-active", on);

  window.addEventListener("mousemove", onMove, { passive: true });
  window.addEventListener("mousedown", () => activate(true));
  window.addEventListener("mouseup", () => activate(false));
  window.addEventListener("blur", () => cursor.classList.remove("is-on"));

  $$("[data-cursor]").forEach((el) => {
    el.addEventListener("mouseenter", () => setLabel(el.getAttribute("data-cursor")));
    el.addEventListener("mouseleave", () => setLabel(""));
  });

  raf = requestAnimationFrame(tick);
}

function initAppleCursorStages() {
  const cursor = $(".cursor");
  const avatar = cursor ? $(".cursor__avatar", cursor) : null;
  if (!avatar) return;

  const assetPrefix = window.location.pathname.includes("/work/") ? "../assets/" : "./assets/";
  const stages = [
    `${assetPrefix}cursor-apple-0.svg`,
    `${assetPrefix}cursor-apple-1.svg`,
    `${assetPrefix}cursor-apple-2.svg`,
    `${assetPrefix}cursor-apple-core.svg`,
  ];

  const clamp01 = (n) => Math.max(0, Math.min(1, n));

  const stageFromScroll = () => {
    const base = Number(document.body?.dataset?.cursorStage || 0);
    const d = document.documentElement;
    const max = Math.max(1, d.scrollHeight - window.innerHeight);
    const t = clamp01(window.scrollY / max);
    // 0..3
    return Math.max(base, Math.floor(t * (stages.length - 0.001)));
  };

  const setStage = (i) => {
    const idx = clamp(i, 0, stages.length - 1);
    const src = stages[idx];
    if (avatar.getAttribute("src") !== src) avatar.setAttribute("src", src);
  };

  // Helper: clamp for setStage
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  const onUpdate = () => setStage(stageFromScroll());
  window.addEventListener("scroll", onUpdate, { passive: true });
  window.addEventListener("resize", onUpdate);
  onUpdate();
}

function getAnchorClickTarget(e) {
  const a = e.target?.closest?.("a[href]");
  if (!a) return null;
  const href = a.getAttribute("href") || "";
  if (!href || href.startsWith("#")) return null;
  if (a.target === "_blank") return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  if (a.hasAttribute("download")) return null;
  return a;
}

function transitionStyleFrom(el) {
  const transition = el?.dataset?.transition || "iris";
  const accent = el?.dataset?.accent || null;
  return { transition, accent };
}

function playTransition({ transition, accent }, originEl) {
  const overlay = $(".transition");
  const layer = $(".transition__layer");
  if (!overlay || !layer) return Promise.resolve();

  if (accent) setCSSVar("--accent", accent);

  overlay.classList.add("is-on");

  if (prefersReducedMotion()) {
    layer.style.clipPath = "inset(0% round 0px)";
    layer.style.background = `radial-gradient(900px 520px at 20% 30%, color-mix(in oklab, var(--accent) 20%, transparent), transparent 65%), var(--bg)`;
    return Promise.resolve();
  }

  const rect = originEl?.getBoundingClientRect?.();
  const ox = rect ? rect.left + rect.width * 0.5 : window.innerWidth * 0.5;
  const oy = rect ? rect.top + rect.height * 0.45 : window.innerHeight * 0.5;
  const at = `${Math.round(ox)}px ${Math.round(oy)}px`;

  // Reset
  layer.style.transform = "translate3d(0,0,0)";
  layer.style.borderRadius = "0px";
  layer.style.background = `radial-gradient(900px 520px at 25% 20%, color-mix(in oklab, var(--accent) 26%, transparent), transparent 70%), var(--bg)`;

  const d = 620;

  if (transition === "wipe") {
    layer.style.clipPath = "polygon(0 0, 0 0, 0 100%, 0 100%)";
    return layer
      .animate(
        [
          { clipPath: "polygon(0 0, 0 0, 0 100%, 0 100%)" },
          { clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)" },
        ],
        { duration: d, easing: "cubic-bezier(.12,.9,.2,1)", fill: "forwards" },
      )
      .finished;
  }

  if (transition === "shard") {
    layer.style.clipPath = "polygon(48% 48%, 52% 48%, 52% 52%, 48% 52%)";
    return layer
      .animate(
        [
          { clipPath: "polygon(48% 48%, 52% 48%, 52% 52%, 48% 52%)", filter: "contrast(1.05) saturate(1.1)" },
          { clipPath: "polygon(0 6%, 100% 0, 96% 100%, 8% 94%)", filter: "contrast(1.1) saturate(1.25)" },
        ],
        { duration: d + 80, easing: "cubic-bezier(.2,.95,.2,1)", fill: "forwards" },
      )
      .finished;
  }

  if (transition === "pulse") {
    layer.style.clipPath = `circle(0% at ${at})`;
    const anim = layer.animate(
      [
        { clipPath: `circle(0% at ${at})`, transform: "scale(1)" },
        { clipPath: `circle(120% at ${at})`, transform: "scale(1.03)" },
      ],
      { duration: d + 120, easing: "cubic-bezier(.12,.95,.1,1)", fill: "forwards" },
    );
    return anim.finished;
  }

  // default: iris
  layer.style.clipPath = `circle(0% at ${at})`;
  return layer
    .animate(
      [{ clipPath: `circle(0% at ${at})` }, { clipPath: `circle(120% at ${at})` }],
      { duration: d, easing: "cubic-bezier(.14,.9,.2,1)", fill: "forwards" },
    )
    .finished;
}

function initTransitions() {
  const overlay = $(".transition");
  const layer = $(".transition__layer");
  if (!overlay || !layer) return;

  // On history navigation, we want page visible immediately.
  window.addEventListener("pageshow", (e) => {
    if (e.persisted) {
      overlay.classList.remove("is-on");
      layer.style.clipPath = "circle(0% at 50% 50%)";
    }
  });

  document.addEventListener("click", async (e) => {
    const a = getAnchorClickTarget(e);
    if (!a) return;
    const url = new URL(a.href, window.location.href);
    // Support local preview via file:// (origin is "null")
    const isFile = window.location.protocol === "file:";
    if (!isFile && url.origin !== window.location.origin) return;

    e.preventDefault();

    if (a.dataset && a.dataset.enter === "1") {
      try {
        sessionStorage.setItem("portfolio_entered", "1");
      } catch (_) {}
    }

    const style = transitionStyleFrom(a);
    try {
      await playTransition(style, a);
    } catch (_) {
      // ignore; navigate anyway
    }
    window.location.href = a.href;
  });
}

function initCardAccentHover() {
  const cards = $$(".card[data-accent]");
  if (!cards.length) return;

  let base = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#B7FF5A";
  let t = 0;
  const to = (hex) => (hex && hex.startsWith("#") ? hex : base);

  const set = (hex) => setCSSVar("--accent", to(hex));

  const scheduleRestore = () => {
    window.clearTimeout(t);
    t = window.setTimeout(() => set(base), 120);
  };

  cards.forEach((c) => {
    c.addEventListener("mouseenter", () => set(c.dataset.accent));
    c.addEventListener("mouseleave", scheduleRestore);
  });
}

function initParallaxHint() {
  // Subtle parallax on cards without heavy libs.
  const cards = $$(".card");
  if (!cards.length || prefersReducedMotion()) return;

  const onMove = (e) => {
    const cx = e.clientX / window.innerWidth - 0.5;
    const cy = e.clientY / window.innerHeight - 0.5;
    cards.forEach((card) => {
      const media = $(".card__media", card);
      if (!media) return;
      const amt = 10;
      const tx = clamp(cx * amt, -amt, amt);
      const ty = clamp(cy * amt, -amt, amt);
      media.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
    });
  };
  window.addEventListener("mousemove", onMove, { passive: true });
}

function initCoverStickers() {
  const stage = $("[data-sticker-stage]");
  if (!stage) return;

  const stickers = $$(".sticker", stage);
  if (!stickers.length) return;

  const storageKey = "portfolio_stickers_v1";
  let z = 3;

  const load = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const saved = JSON.parse(raw);
      stickers.forEach((el) => {
        const s = saved[el.getAttribute("href")];
        if (!s) return;
        el.style.left = `${s.left}px`;
        el.style.top = `${s.top}px`;
        el.style.transform = `translate3d(0,0,0) rotate(${s.rot}deg)`;
      });
    } catch (_) {}
  };

  const save = () => {
    try {
      const out = {};
      stickers.forEach((el) => {
        const href = el.getAttribute("href") || "";
        const rect = el.getBoundingClientRect();
        const sRect = stage.getBoundingClientRect();
        const left = rect.left - sRect.left;
        const top = rect.top - sRect.top;
        const m = el.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
        const rot = m ? Number(m[1]) : 0;
        out[href] = { left, top, rot };
      });
      localStorage.setItem(storageKey, JSON.stringify(out));
    } catch (_) {}
  };

  const resetBtn = $("[data-reset-stickers]");
  if (resetBtn) {
    resetBtn.addEventListener("click", () => {
      try {
        localStorage.removeItem(storageKey);
      } catch (_) {}
      window.location.reload();
    });
  }

  const stageRect = () => stage.getBoundingClientRect();

  const initAbsolute = (el) => {
    // Convert percentage positioning to absolute within stage for easier dragging.
    const rect = el.getBoundingClientRect();
    const s = stageRect();
    const left = rect.left - s.left;
    const top = rect.top - s.top;
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  };

  stickers.forEach(initAbsolute);
  load();

  stickers.forEach((el) => {
    let pid = null;
    let startX = 0;
    let startY = 0;
    let originLeft = 0;
    let originTop = 0;
    let moved = false;
    let lastX = 0;
    let lastY = 0;

    const getRot = () => {
      const m = el.style.transform.match(/rotate\(([-0-9.]+)deg\)/);
      return m ? Number(m[1]) : 0;
    };

    const setRot = (deg) => {
      el.style.transform = `translate3d(0,0,0) rotate(${deg}deg)`;
    };

    el.addEventListener("pointerdown", (e) => {
      pid = e.pointerId;
      el.setPointerCapture(pid);
      el.classList.add("is-dragging");
      el.style.zIndex = String(z++);

      const s = stageRect();
      const r = el.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      originLeft = r.left - s.left;
      originTop = r.top - s.top;
      lastX = e.clientX;
      lastY = e.clientY;
      moved = false;
    });

    el.addEventListener("pointermove", (e) => {
      if (pid !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.hypot(dx, dy) > 6) moved = true;

      const s = stageRect();
      const w = el.getBoundingClientRect().width;
      const h = el.getBoundingClientRect().height;
      const left = clamp(originLeft + dx, -w * 0.35, s.width - w * 0.65);
      const top = clamp(originTop + dy, -h * 0.35, s.height - h * 0.65);
      el.style.left = `${left}px`;
      el.style.top = `${top}px`;

      // Slight rotation based on movement for absurd feel.
      const vx = e.clientX - lastX;
      const vy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      const rot = clamp(getRot() + (vx - vy) * 0.02, -22, 22);
      setRot(rot);
    });

    el.addEventListener("pointerup", (e) => {
      if (pid !== e.pointerId) return;
      el.classList.remove("is-dragging");
      try {
        el.releasePointerCapture(pid);
      } catch (_) {}
      pid = null;
      save();

      // If dragged, prevent navigation on this tap.
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    el.addEventListener("click", (e) => {
      // If it was a drag, ignore click.
      if (el.classList.contains("is-dragging")) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });
}

function initWheelGalleries() {
  const galleries = $$("[data-wheel-gallery]");
  if (!galleries.length) return;

  galleries.forEach((gallery) => {
    const img = $(".wheelGallery__img", gallery);
    if (!img) return;

    const list = (gallery.getAttribute("data-images") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.length) return;

    let idx = Math.max(0, list.indexOf(img.getAttribute("src") || ""));
    let lock = false;

    const caption = $("[data-only-first]");
    const syncCaption = () => {
      if (!caption) return;
      caption.classList.toggle("is-hidden", idx !== 0);
    };
    syncCaption();

    const swap = async (next) => {
      if (lock) return;
      lock = true;
      gallery.classList.add("is-switching");
      await new Promise((r) => window.setTimeout(r, 150));
      img.setAttribute("src", list[next]);
      syncCaption();
      await new Promise((r) => window.setTimeout(r, 30));
      gallery.classList.remove("is-switching");
      window.setTimeout(() => {
        lock = false;
      }, 220);
    };

    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      if (Math.abs(delta) < 6) return;
      const dir = delta > 0 ? 1 : -1;
      const next = clamp(idx + dir, 0, list.length - 1);
      if (next === idx) return;
      idx = next;
      swap(next);
    };

    gallery.addEventListener("wheel", onWheel, { passive: false });
  });
}

function initLightboxPhotoGrid() {
  const grid = $("[data-lightbox-grid]");
  if (!grid) return;

  const folder = grid.getAttribute("data-folder") || "./assets/projects/photo/";
  const count = Number(grid.getAttribute("data-count") || "0");
  if (!count) return;

  const ext = grid.getAttribute("data-ext") || "jpg";

  const files = Array.from({ length: count }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return `${folder}${n}.${ext}`;
  });

  // Manual metadata override (preferred over EXIF).
  // Index 0 => 01.jpg, index 11 => 12.jpg
  const manualMeta = [
    { place: "Hong Kong Disneyland", time: "2025-07-01" },
    { place: "Hong Kong Park", time: "2025-07-03" },
    { place: "Xiamen Seaside", time: "2024-08-20" },
    { place: "Guangzhou", time: "2024-08-22" },
    { place: "Gannan Prairie", time: "2024-07-20" },
    { place: "Wuxi", time: "2023-08-30" },
    { place: "Southeast University, Nanjing", time: "2023-06-20" },
    { place: "Xuanwu Lake, Nanjing", time: "2025-06-26" },
    { place: "Universal Studios Beijing", time: "2025-12-31" },
    { place: "Costco, Nanjing", time: "2025-04-03" },
    { place: "Quanzhou, Fujian", time: "2025-08-16" },
    { place: "Mochou Lake Park, Nanjing", time: "2025-07-18" },
  ];

  const escapeHtml = (s) =>
    String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

  grid.innerHTML = files
    .map(
      (src, i) => `
      <button class="photoThumb" type="button" data-idx="${i}" aria-label="Open photo ${i + 1}">
        <div class="photoCard">
          <div class="photoFace photoFace--front">
            <img class="photoThumb__img" src="${escapeHtml(src)}" alt="" loading="lazy" />
          </div>
          <div class="photoFace photoFace--back">
            <div class="photoMeta" data-photo-meta="1">
              <div class="photoMeta__row"><span class="photoMeta__k">Time</span><span class="photoMeta__v" data-time>—</span></div>
              <div class="photoMeta__row"><span class="photoMeta__k">Place</span><span class="photoMeta__v" data-place>—</span></div>
              <div class="photoMeta__note">Hover to read · Click to zoom</div>
            </div>
          </div>
        </div>
      </button>
    `,
    )
    .join("");

  const lb = $(".lightbox");
  const lbImg = lb ? $(".lightbox__img", lb) : null;
  const btnClose = lb ? $(".lightbox__close", lb) : null;
  const btnPrev = lb ? $(".lightbox__prev", lb) : null;
  const btnNext = lb ? $(".lightbox__next", lb) : null;
  if (!lb || !lbImg || !btnClose || !btnPrev || !btnNext) return;

  let idx = 0;
  const open = (i) => {
    idx = clamp(i, 0, files.length - 1);
    lbImg.src = files[idx];
    lb.classList.add("is-open");
  };
  const close = () => lb.classList.remove("is-open");
  const prev = () => open(idx - 1);
  const next = () => open(idx + 1);

  grid.addEventListener("click", (e) => {
    const btn = e.target?.closest?.("[data-idx]");
    if (!btn) return;
    const i = Number(btn.getAttribute("data-idx") || "0");
    open(i);
  });

  btnClose.addEventListener("click", close);
  btnPrev.addEventListener("click", prev);
  btnNext.addEventListener("click", next);

  lb.addEventListener("click", (e) => {
    if (e.target === lb) close();
  });

  window.addEventListener("keydown", (e) => {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  });

  const toDecimal = (d, m, s, ref) => {
    let v = d + m / 60 + s / 3600;
    if (ref === "S" || ref === "W") v *= -1;
    return v;
  };

  const parseExifFromJpeg = (buf) => {
    const u8 = new Uint8Array(buf);
    const dv = new DataView(buf);
    if (u8[0] !== 0xff || u8[1] !== 0xd8) return null;

    let offset = 2;
    while (offset + 4 < u8.length) {
      if (u8[offset] !== 0xff) break;
      const marker = u8[offset + 1];
      const size = dv.getUint16(offset + 2, false);
      if (marker === 0xe1) {
        const start = offset + 4;
        const sig = String.fromCharCode(...u8.slice(start, start + 6));
        if (sig !== "Exif\u0000\u0000") return null;
        const tiff = start + 6;
        const le = u8[tiff] === 0x49 && u8[tiff + 1] === 0x49;
        const getU16 = (o) => dv.getUint16(o, le);
        const getU32 = (o) => dv.getUint32(o, le);
        const getI32 = (o) => dv.getInt32(o, le);
        const base = tiff;

        const readAscii = (o, len) => {
          const bytes = u8.slice(o, o + len);
          return String.fromCharCode(...bytes).replaceAll("\u0000", "").trim();
        };

        const readRational = (o) => {
          const num = getU32(o);
          const den = getU32(o + 4) || 1;
          return num / den;
        };

        const readSRational = (o) => {
          const num = getI32(o);
          const den = getI32(o + 4) || 1;
          return num / den;
        };

        const readIFD = (ifdOffset) => {
          const count = getU16(base + ifdOffset);
          const entries = [];
          let p = base + ifdOffset + 2;
          for (let i = 0; i < count; i++) {
            const tag = getU16(p);
            const type = getU16(p + 2);
            const n = getU32(p + 4);
            const valueOffset = base + getU32(p + 8);
            const valueInline = p + 8;
            entries.push({ tag, type, n, valueOffset, valueInline });
            p += 12;
          }
          return entries;
        };

        const valueAs = (e) => {
          // types: 2 ASCII, 5 RATIONAL, 10 SRATIONAL
          if (e.type === 2) {
            const len = e.n;
            const off = len <= 4 ? e.valueInline : e.valueOffset;
            return readAscii(off, len);
          }
          if (e.type === 5) {
            const off = e.valueOffset;
            if (e.n === 1) return readRational(off);
            return Array.from({ length: e.n }, (_, i) => readRational(off + i * 8));
          }
          if (e.type === 10) {
            const off = e.valueOffset;
            if (e.n === 1) return readSRational(off);
            return Array.from({ length: e.n }, (_, i) => readSRational(off + i * 8));
          }
          return null;
        };

        // IFD0 starts at offset in TIFF header (bytes 4..7)
        const ifd0 = getU32(base + 4);
        const ifd0Entries = readIFD(ifd0);

        const exifPtr = ifd0Entries.find((e) => e.tag === 0x8769);
        const gpsPtr = ifd0Entries.find((e) => e.tag === 0x8825);

        let date = null;
        if (exifPtr) {
          const exifIFD = getU32(exifPtr.valueInline);
          const exifEntries = readIFD(exifIFD);
          const dto = exifEntries.find((e) => e.tag === 0x9003) || exifEntries.find((e) => e.tag === 0x0132);
          if (dto) date = valueAs(dto);
        }

        let coords = null;
        if (gpsPtr) {
          const gpsIFD = getU32(gpsPtr.valueInline);
          const gpsEntries = readIFD(gpsIFD);
          const latRef = gpsEntries.find((e) => e.tag === 0x0001);
          const lat = gpsEntries.find((e) => e.tag === 0x0002);
          const lonRef = gpsEntries.find((e) => e.tag === 0x0003);
          const lon = gpsEntries.find((e) => e.tag === 0x0004);
          if (latRef && lat && lonRef && lon) {
            const lr = valueAs(latRef);
            const lnR = valueAs(lonRef);
            const latArr = valueAs(lat);
            const lonArr = valueAs(lon);
            if (Array.isArray(latArr) && Array.isArray(lonArr)) {
              const latDec = toDecimal(latArr[0], latArr[1], latArr[2], lr);
              const lonDec = toDecimal(lonArr[0], lonArr[1], lonArr[2], lnR);
              coords = { lat: latDec, lon: lonDec };
            }
          }
        }

        return { date, coords };
      }
      // move to next segment
      offset += 2 + size;
    }
    return null;
  };

  const formatDate = (s) => {
    if (!s) return null;
    // common format: YYYY:MM:DD HH:MM:SS
    const m = String(s).match(/^(\d{4}):(\d{2}):(\d{2})\s+(\d{2}):(\d{2})/);
    if (!m) return String(s);
    return `${m[1]}-${m[2]}-${m[3]} ${m[4]}:${m[5]}`;
  };

  const formatPlace = (coords) => {
    if (!coords) return null;
    const lat = coords.lat.toFixed(4);
    const lon = coords.lon.toFixed(4);
    return `${lat}, ${lon}`;
  };

  const hydrateMeta = async (src, metaEl) => {
    try {
      const res = await fetch(src, { cache: "no-store" });
      if (!res.ok) return;
      const buf = await res.arrayBuffer();
      const exif = parseExifFromJpeg(buf);
      const timeEl = metaEl.querySelector("[data-time]");
      const placeEl = metaEl.querySelector("[data-place]");
      const date = exif ? formatDate(exif.date) : null;
      const place = exif ? formatPlace(exif.coords) : null;
      if (timeEl && date) timeEl.textContent = date;
      if (placeEl && place) placeEl.textContent = place;
    } catch (_) {
      // ignore
    }
  };

  // Hydrate metadata lazily (doesn't block rendering)
  $$("[data-idx]", grid).forEach((btn) => {
    const i = Number(btn.getAttribute("data-idx") || "0");
    const meta = btn.querySelector("[data-photo-meta]");
    if (!meta) return;
    const timeEl = meta.querySelector("[data-time]");
    const placeEl = meta.querySelector("[data-place]");

    const manual = manualMeta[i];
    if (manual) {
      if (timeEl) timeEl.textContent = manual.time;
      if (placeEl) placeEl.textContent = manual.place;
      return;
    }

    // fallback to EXIF (if no manual metadata)
    hydrateMeta(files[i], meta);
  });
}

initYear();
initAccentFromPage();
initCursor();
initAppleCursorStages();
initTransitions();
initCardAccentHover();
initParallaxHint();
initCoverStickers();
initWheelGalleries();
initLightboxPhotoGrid();

// (old home intro removed; now home uses the apple drop layout)
function initHomeDropFreeze() {
  const root = document.querySelector("[data-home-drop]");
  if (!root) return;
  // Static home: no animation.
}

initHomeDropFreeze();

function initHomeAppleBounce() {
  if (!document.body.hasAttribute("data-home-bounce")) return;
  if (prefersReducedMotion()) return;

  const apples = $$(".dropApple");
  if (apples.length < 2) return;

  // Seed positions from current layout
  const states = apples.map((el, i) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const speed = 1.2 + i * 0.25;
    const angle = (Math.PI * 2 * (0.18 + i * 0.29)) % (Math.PI * 2);
    return {
      el,
      w: r.width,
      h: r.height,
      x,
      y,
      vx: Math.cos(angle) * 220 * speed,
      vy: Math.sin(angle) * 200 * speed,
    };
  });

  let last = performance.now();

  const step = (now) => {
    const dt = Math.min(0.032, (now - last) / 1000);
    last = now;

    const W = window.innerWidth;
    const H = window.innerHeight;

    states.forEach((s) => {
      // refresh size occasionally (in case responsive)
      const rect = s.el.getBoundingClientRect();
      s.w = rect.width;
      s.h = rect.height;

      s.x += s.vx * dt;
      s.y += s.vy * dt;

      const pad = 6;
      const minX = s.w / 2 + pad;
      const maxX = W - s.w / 2 - pad;
      const minY = s.h / 2 + pad;
      const maxY = H - s.h / 2 - pad;

      if (s.x < minX) {
        s.x = minX;
        s.vx *= -1;
      } else if (s.x > maxX) {
        s.x = maxX;
        s.vx *= -1;
      }

      if (s.y < minY) {
        s.y = minY;
        s.vy *= -1;
      } else if (s.y > maxY) {
        s.y = maxY;
        s.vy *= -1;
      }

      s.el.style.setProperty("--bx", `${s.x}px`);
      s.el.style.setProperty("--by", `${s.y}px`);
    });

    requestAnimationFrame(step);
  };

  // Kick initial CSS vars so transform uses physics coords immediately
  states.forEach((s) => {
    s.el.style.setProperty("--bx", `${s.x}px`);
    s.el.style.setProperty("--by", `${s.y}px`);
  });

  requestAnimationFrame(step);
}

initHomeAppleBounce();
