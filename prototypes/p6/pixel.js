/* DUMMIES P3 — pixel art layer.
   The field is a 400 × 320 art grid (25 × 20 tiles): ui.playWidth ÷ ui.artScale by ui.playHeight ÷ ui.artScale.
   Rules (GDD Edit 37 §4.1.3): whole art pixels only, no anti-aliasing, 1-px outlines, ramps of three tones,
   hard shadows down-left. Translucency is SNES-style colour math on whole pixels. Exposes window.PIX. */
(function (root) {
  'use strict';
  // Field (Edit 42, D27): 400 × 320 art px, 25 × 20 tiles of 16 px, 5:4. One art px = 2 world units (ui.artScale).
  const AW = 400, AH = 320, U = 2, TAU = Math.PI * 2;
  const SUN = { x: -Math.SQRT1_2, y: Math.SQRT1_2 }; // light from 1:30, shadows fall to 7:30

  // ---------- palettes (Edit 37 §4.1.4 roles; placeholders registered as data). One is chosen at load.
  const DAY = {
    grass: '#8ED45A', grass2: '#6DBE48', grass3: '#B6E87E', road: '#B9C6CF', road2: '#A9B7C1',
    pave: '#F2EEE2', pave2: '#DCD5C2', kerb: '#FFFFFF', kerb2: '#9AA8B1', lane: '#FFFFFF', bubble: '#FFFFFF',
    water: '#4FC3E8', water2: '#8FE0F5', water3: '#2A9CC8', flower: '#FFFFFF', flower2: '#F7A8C8',
    foliage: '#5DBB46', foliageL: '#A6E06A', foliageD: '#3E9A3A', foliageO: '#1F5A2E', trunk: '#8A6A44', trunkD: '#5E4630',
    fleetTop: '#F4F8FA', fleetRoof: '#FFFFFF', fleetSide: '#C3D0D8', fleetSide2: '#A9B7C1', fleetLine: '#9AA8B1', fleetO: '#2E3A43',
    glass: '#1A7FA7', glint: '#8FE0F5', head: '#FFF1C9', tail: '#8A3A30', amber: '#F2A33A',
    podBody: '#FFFFFF', podO: '#4A6F86', pod2: '#DCE8EE', pod3: '#B9CCD6', podCrown: '#4FC3E8', podHi: '#BDEBFA',
    rail: '#E2E8EC', railSide: '#B8C4CB', railO: '#5E6F7B',
    dummy: '#F5C542', dummyD: '#C9961C', dummyL: '#FFE9A0', joint: '#1A1D1F', worn: '#9C9070',
    chrome: '#B9C3CA', chromeL: '#F4F7F9', chromeD: '#6E7C87', mod: '#4FC3E8', modL: '#BDEBFA', modD: '#1E8FB8', modGlow: '#E8FAFF', // HUD chassis: joints, modules, LED details
    cone: '#F28C28', coneO: '#7A3B12', coneW: '#FFFFFF',
    ink: '#101417', label: '#4A5A66', warn: '#E4442E', white: '#FFFFFF', fleet: '#7E8C96', structure: '#B8C4CB',
    // cue roles (reserved treatment, 4.2.2)
    cueHalo: '#1A1D1F', nose: '#1A1D1F', tyre: '#101417', roofInk: '#101417', roofLabel: '#4A5A66',
    barkFill: '#FFFFFF', barkEdge: '#1A1D1F', barkInk: '#101417', barkDim: '#4A5A66',
    tagFill: '#FFFFFF', tagInk: '#101417', tagBorder: '#1A1D1F', tagSpentFill: '#101417', tagSpentInk: '#FFFFFF',
    popInk: '#101417', popOutline: '#FFFFFF', stampFill: '#FFFFFF', stampOutline: '#1A1D1F',
    podStripes: null, reflect: null, edgeLight: null, flowers: 160,
    // city statics (proto.city): eco blocks with roof gardens by day
    bldgRoof: '#E9F1F4', bldgEdge: '#B9CCD6', bldgFace: '#DCE8EE', bldgDark: '#9FB6C2', bldgUnit: '#5DBB46', bldgUnitD: '#3E9A3A',
    bldgLed: ['#4FC3E8', '#1A7FA7', '#8FE0F5'], bldgOutline: '#4A6F86', spill: false,
    jersey: '#C9D3DA', jerseyTop: '#EEF2F4', jerseyLed: '#9AA8B1', jerseyO: '#5E6F7B',
    // surfaces (D18): puddle patches; gates (D24): edge marks in cue.secondary
    puddle: '#93BFD3', puddleRim: '#DDF3FB', puddleLip: '#6F97AB', puddleHi: '#FFFFFF', gate: '#4A5A66',
    // levels (Edit 43): the deck is pale concrete, the underground a tiled passage; car lights wash the ground
    deck: '#D9DFE3', deck2: '#C2CBD1', deckJoint: '#A9B5BD', column: '#C9D3DA', columnD: '#9AA8B1',
    beam: '#FFF6DC', brakeGlow: '#E4442E', bldgRoof1: '#F4F8FA',
  };
  // Chongqing night: dark ground, LED towers, lime-uplit planting, river reflections. Cues turn light-on-dark.
  // Yellow stays the dummy's alone; red stays the warning's alone (no red or yellow décor in the field).
  const NIGHT = {
    grass: '#0E1712', grass2: '#13211A', grass3: '#1C3024', road: '#1E222C', road2: '#272C38',
    pave: '#262B36', pave2: '#313847', kerb: '#E6F4FF', kerb2: '#3A4252', lane: '#C9E9FF', bubble: '#7FF0FF',
    water: '#08101E', water2: '#13234A', water3: '#0C1830', flower: '#5FE3FF', flower2: '#FF5FD2',
    foliage: '#5ED13A', foliageL: '#B8F25E', foliageD: '#2E7D2C', foliageO: '#0A1A0C', trunk: '#3B2A1E', trunkD: '#22180F',
    fleetTop: '#DDE6EE', fleetRoof: '#F4F8FB', fleetSide: '#8C9AA8', fleetSide2: '#5E6B78', fleetLine: '#6F7D8B', fleetO: '#05070B',
    glass: '#0E3A4F', glint: '#7FF0FF', head: '#CFF6FF', tail: '#7A2424', amber: '#FF9A1F',
    podBody: '#18213A', podO: '#05070B', pod2: '#121A2E', pod3: '#0E1424', podCrown: '#3FD0FF', podHi: '#B6F0FF',
    rail: '#2B3446', railSide: '#1A2131', railO: '#3FD0FF',
    cone: '#FF8A1F',
    ink: '#F4F8FA', label: '#7FA8BC', warn: '#FF3D3D', fleet: '#5E6B78', structure: '#3A4252',
    cueHalo: '#FFB0B0', nose: '#F4F8FA', tyre: '#05070B',
    rimLight: '#E6F4FF', rimDark: '#5E7080', // dark ground: the dummy's outer edge is a rim, lit top-right (4.1.3 light)
    barkFill: '#0B1020', barkEdge: '#6FE4FF', barkInk: '#E6F4FF', barkDim: '#7FA8BC', // bark bubbles: dark glass, LED edge
    // Dark-ground outline rule for every sprite: no black edge on dark ground. Rims lit top-right, in a value
    // hierarchy: dummy (above) > cars > cones > barriers > pods > blocks. Inner lines keep their dark inks.
    carRim: '#8FDFFF', carRimD: '#3A4A66', coneRim: '#F2A65A', coneRimD: '#7A4420', jerseyRim: '#8494B8', jerseyRimD: '#2C3550',
    podRim: '#5B6E9C', podRimD: '#262F48', bldgRim: '#46557D', bldgRimD: '#1E263B', foliageO: '#1F4A22',
    mod: '#3FD0FF', modL: '#B6F0FF', modD: '#1A6FA0', // HUD chassis modules
    chrome: '#7D8AA3', chromeL: '#D6F6FF', chromeD: '#353D52', modGlow: '#FF5FD2', // HUD chassis: gunmetal joints, neon LEDs
    tagFill: '#1840C8', tagInk: '#FFFFFF', tagBorder: '#6FE4FF', tagSpentFill: '#F4F8FA', tagSpentInk: '#1840C8',
    popInk: '#FFFFFF', popOutline: '#1840C8', stampFill: '#0B0E17', stampOutline: '#FFB0B0',
    podStripes: ['#2F6BFF', '#3FD0FF', '#9B6BFF', '#E6F4FF'], reflect: ['#2F6BFF', '#3FD0FF', '#9B6BFF', '#FF5FD2', '#E6F4FF'], edgeLight: '#E6F4FF', flowers: 40,
    bldgRoof: '#1A2133', bldgEdge: '#2C3650', bldgFace: '#0D1220', bldgDark: '#080C16', bldgUnit: '#3A4560', bldgUnitD: '#222A3C',
    bldgLed: ['#3FD0FF', '#2F6BFF', '#9B6BFF', '#FF5FD2', '#E6F4FF'], bldgOutline: '#05070B', spill: true,
    jersey: '#3A4252', jerseyTop: '#6B7894', jerseyLed: '#3FD0FF', jerseyO: '#05070B',
    puddle: '#1B2B45', puddleRim: '#5B7BB0', puddleLip: '#0E1422', puddleHi: '#BFEFFF', gate: '#7FA8BC',
    deck: '#3B4459', deck2: '#323A4D', deckJoint: '#262C3B', column: '#4A5470', columnD: '#262D40',
    beam: '#E8F7FF', brakeGlow: '#FF3A3A', bldgRoof1: '#252E44',
  };
  // Cyber: the night palette with a city instead of parkland. Decks for lawns, blocks for trees, jersey barriers for hedges.
  const CYBER = { scenery: 'city', grass: '#10141D', grass2: '#161B26', grass3: '#1D2331', flowers: 0 };
  const NAME = { day: 'day', night: 'night', cyber: 'cyber' }[root.PIX_PALETTE_NAME] || 'cyber'; // cyber is the default scheme (20 Oct)
  const PAL = Object.assign({}, DAY, NAME !== 'day' ? NIGHT : {}, NAME === 'cyber' ? CYBER : {});
  function rgb(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function c32(hex) { const [r, g, b] = rgb(hex); return (0xFF000000 | (b << 16) | (g << 8) | r) >>> 0; }
  function mixHex(a, b, k) { const p = rgb(a), q = rgb(b); return '#' + p.map((v, i) => Math.round(v + (q[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
  const K = {}; for (const k in PAL) if (typeof PAL[k] === 'string') K[k] = c32(PAL[k]);
  const KX = (k) => (PAL[k] ? PAL[k].map(c32) : null); // palette lists (LED stripes, reflections)

  // ---------- buffer
  class Buf {
    constructor(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
    put(x, y, c) { x = Math.floor(x); y = Math.floor(y); if (x < 0 || y < 0 || x >= this.w || y >= this.h) return; this.d[y * this.w + x] = c; }
    get(x, y) { x = Math.floor(x); y = Math.floor(y); return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.d[y * this.w + x]; }
    mix(x, y, c, a) { // colour math: blend c over the pixel by a (0..1)
      x = Math.floor(x); y = Math.floor(y);
      if (a <= 0 || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x;
      if (this.layer && !this.d[i]) return; // a layer buffer keeps its empty pixels empty
      if (a >= 1) { this.d[i] = c; return; }
      const s = this.d[i], r = s & 255, g = (s >>> 8) & 255, b = (s >>> 16) & 255;
      this.d[i] = (0xFF000000 | (Math.round(b + (((c >>> 16) & 255) - b) * a) << 16) | (Math.round(g + (((c >>> 8) & 255) - g) * a) << 8) | Math.round(r + ((c & 255) - r) * a)) >>> 0;
    }
    shade(x, y, k) { // multiply: hard shadow
      x = Math.floor(x); y = Math.floor(y);
      if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
      const i = y * this.w + x, s = this.d[i];
      if (this.layer && !s) return;
      this.d[i] = (0xFF000000 | (Math.round(((s >>> 16) & 255) * k) << 16) | (Math.round(((s >>> 8) & 255) * k) << 8) | Math.round((s & 255) * k)) >>> 0;
    }
    rect(x0, y0, x1, y1, c) { for (let y = Math.floor(y0); y <= y1; y++) for (let x = Math.floor(x0); x <= x1; x++) this.put(x, y, c); }
    fill(c) { this.d.fill(c); }
    copyFrom(o) { this.d.set(o.d); }
  }

  // ---------- primitives (art-pixel coordinates; floats are rounded or sampled at pixel centres)
  function line(x0, y0, x1, y1, fn, i0) { // Bresenham; fn(x, y, i) with a running index for dash patterns
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy, i = i0 || 0, guard = 0;
    for (;;) {
      fn(x0, y0, i++);
      if ((x0 === x1 && y0 === y1) || ++guard > 4000) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return i;
  }
  function polyline(pts, fn) { let i = 0; for (let k = 1; k < pts.length; k++) i = line(pts[k - 1][0], pts[k - 1][1], pts[k][0], pts[k][1], fn, i) - 1; return i; }
  const dash = (on, off) => (i) => i % (on + off) < on;
  const circCache = new Map();
  function circle(r) { // midpoint circle, points sorted clockwise from east, with angle
    r = Math.max(0, Math.round(r));
    if (circCache.has(r)) return circCache.get(r);
    const set = new Map();
    let x = r, y = 0, err = 1 - r;
    while (x >= y) {
      for (const [a, b] of [[x, y], [y, x], [-y, x], [-x, y], [-x, -y], [-y, -x], [y, -x], [x, -y]]) set.set(a + ',' + b, [a, b, Math.atan2(b, a)]);
      y++;
      if (err < 0) err += 2 * y + 1; else { x--; err += 2 * (y - x) + 1; }
    }
    const pts = [...set.values()].map((p) => [p[0], p[1], (p[2] + TAU) % TAU]).sort((a, b) => a[2] - b[2]);
    circCache.set(r, pts);
    return pts;
  }
  function disc(cx, cy, r, fn) {
    cx = Math.round(cx); cy = Math.round(cy);
    const rr = (r + 0.5) * (r + 0.5);
    for (let y = -Math.ceil(r); y <= Math.ceil(r); y++) for (let x = -Math.ceil(r); x <= Math.ceil(r); x++) if (x * x + y * y <= rr) fn(cx + x, cy + y);
  }
  function ellipse(cx, cy, rx, ry, fn) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v <= 1) fn(x, y);
    }
  }
  function fillPoly(pts, fn, W, H) { // scanline at pixel centres
    W = W || AW; H = H || AH;
    let ya = Infinity, yb = -Infinity;
    for (const p of pts) { if (p[1] < ya) ya = p[1]; if (p[1] > yb) yb = p[1]; }
    ya = Math.max(0, Math.floor(ya)); yb = Math.min(H - 1, Math.ceil(yb));
    const n = pts.length, xs = [];
    for (let y = ya; y <= yb; y++) {
      const sy = y + 0.5; xs.length = 0;
      for (let i = 0, j = n - 1; i < n; j = i++) {
        const a = pts[i], b = pts[j];
        if ((a[1] > sy) !== (b[1] > sy)) xs.push(a[0] + (sy - a[1]) / (b[1] - a[1]) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const xa = Math.max(0, Math.ceil(xs[k] - 0.5)), xb = Math.min(W - 1, Math.ceil(xs[k + 1] - 0.5) - 1);
        for (let x = xa; x <= xb; x++) fn(x, y);
      }
    }
  }
  function inPoly(pts, x, y) {
    let c = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const a = pts[i], b = pts[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c;
    }
    return c;
  }
  // outlined mark: every pixel of the mark gets an 8-neighbour outline first (reserved cue treatment)
  function stamp(B, pts, c, oc) {
    if (oc != null) for (const [x, y] of pts) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) B.put(x + i, y + j, oc);
    for (const [x, y] of pts) B.put(x, y, c);
  }
  function collectLine(x0, y0, x1, y1, pat) { const out = []; line(x0, y0, x1, y1, (x, y, i) => { if (!pat || pat(i)) out.push([x, y]); }); return out; }

  // ---------- load-bearing pixel face: 8 × 12 cell, 12-art-px caps = 24 reference units = ui.typeLoadBearing
  const G = {
    A: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XX....XX', 'XX....XX', 'XXXXXXXX', 'XXXXXXXX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX'],
    B: ['XXXXXX..', 'XXXXXXX.', 'XX...XXX', 'XX....XX', 'XX...XXX', 'XXXXXX..', 'XXXXXXX.', 'XX...XXX', 'XX....XX', 'XX...XXX', 'XXXXXXX.', 'XXXXXX..'],
    C: ['..XXXXX.', '.XXXXXXX', 'XXX...XX', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XXX...XX', '.XXXXXXX', '..XXXXX.'],
    D: ['XXXXX...', 'XXXXXX..', 'XX..XXX.', 'XX...XXX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX...XXX', 'XX..XXX.', 'XXXXXX..', 'XXXXX...'],
    E: ['XXXXXXXX', 'XXXXXXXX', 'XX......', 'XX......', 'XX......', 'XXXXXX..', 'XXXXXX..', 'XX......', 'XX......', 'XX......', 'XXXXXXXX', 'XXXXXXXX'],
    F: ['XXXXXXXX', 'XXXXXXXX', 'XX......', 'XX......', 'XX......', 'XXXXXX..', 'XXXXXX..', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......'],
    G: ['..XXXXX.', '.XXXXXXX', 'XXX...XX', 'XX......', 'XX......', 'XX..XXXX', 'XX..XXXX', 'XX....XX', 'XX....XX', 'XXX...XX', '.XXXXXXX', '..XXXXX.'],
    H: ['XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XXXXXXXX', 'XXXXXXXX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX'],
    I: ['.XXXXXX.', '.XXXXXX.', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '.XXXXXX.', '.XXXXXX.'],
    J: ['...XXXXX', '...XXXXX', '......XX', '......XX', '......XX', '......XX', '......XX', '......XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    K: ['XX....XX', 'XX...XXX', 'XX..XXX.', 'XX.XXX..', 'XXXXX...', 'XXXX....', 'XXXX....', 'XXXXX...', 'XX.XXX..', 'XX..XXX.', 'XX...XXX', 'XX....XX'],
    L: ['XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......', 'XXXXXXXX', 'XXXXXXXX'],
    M: ['XX....XX', 'XXX..XXX', 'XXXXXXXX', 'XX.XX.XX', 'XX.XX.XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX'],
    N: ['XX....XX', 'XXX...XX', 'XXXX..XX', 'XXXX..XX', 'XX.XX.XX', 'XX.XX.XX', 'XX..XXXX', 'XX..XXXX', 'XX...XXX', 'XX....XX', 'XX....XX', 'XX....XX'],
    O: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    P: ['XXXXXX..', 'XXXXXXX.', 'XX...XXX', 'XX....XX', 'XX...XXX', 'XXXXXXX.', 'XXXXXX..', 'XX......', 'XX......', 'XX......', 'XX......', 'XX......'],
    Q: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX.XX.XX', 'XXX.XXX.', '.XXXXXXX', '..XXX.XX'],
    R: ['XXXXXX..', 'XXXXXXX.', 'XX...XXX', 'XX....XX', 'XX...XXX', 'XXXXXXX.', 'XXXXXX..', 'XX.XXX..', 'XX..XXX.', 'XX...XXX', 'XX....XX', 'XX....XX'],
    S: ['.XXXXXX.', 'XXXXXXXX', 'XX....XX', 'XX......', 'XXX.....', '.XXXXX..', '..XXXXX.', '.....XXX', '......XX', 'XX....XX', 'XXXXXXXX', '.XXXXXX.'],
    T: ['XXXXXXXX', 'XXXXXXXX', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...'],
    U: ['XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    V: ['XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XXX..XXX', '.XX..XX.', '.XX..XX.', '.XXXXXX.', '..XXXX..', '..XXXX..', '...XX...'],
    W: ['XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX....XX', 'XX.XX.XX', 'XX.XX.XX', 'XXXXXXXX', 'XXX..XXX', 'XX....XX', 'X......X'],
    X: ['XX....XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..', '...XX...', '...XX...', '..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XX....XX'],
    Y: ['XX....XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...'],
    Z: ['XXXXXXXX', 'XXXXXXXX', '......XX', '.....XXX', '....XXX.', '...XXX..', '..XXX...', '.XXX....', 'XXX.....', 'XX......', 'XXXXXXXX', 'XXXXXXXX'],
    0: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XX....XX', 'XX.XX.XX', 'XX.XX.XX', 'XX....XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    1: ['...XX...', '..XXX...', '.XXXX...', 'XX.XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '...XX...', '.XXXXXX.', '.XXXXXX.'],
    2: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', '......XX', '.....XXX', '....XXX.', '...XXX..', '..XXX...', '.XXX....', 'XXXXXXXX', 'XXXXXXXX'],
    3: ['.XXXXXX.', 'XXXXXXXX', 'XX....XX', '......XX', '.....XXX', '..XXXXX.', '..XXXXX.', '.....XXX', '......XX', 'XX....XX', 'XXXXXXXX', '.XXXXXX.'],
    4: ['....XXX.', '...XXXX.', '..XXXXX.', '.XXX.XX.', 'XXX..XX.', 'XX...XX.', 'XXXXXXXX', 'XXXXXXXX', '.....XX.', '.....XX.', '.....XX.', '.....XX.'],
    5: ['XXXXXXXX', 'XXXXXXXX', 'XX......', 'XX......', 'XXXXXX..', 'XXXXXXX.', '.....XXX', '......XX', '......XX', 'XX...XXX', 'XXXXXXX.', '.XXXXX..'],
    6: ['..XXXXX.', '.XXXXXX.', 'XXX.....', 'XX......', 'XXXXXX..', 'XXXXXXX.', 'XX...XXX', 'XX....XX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    7: ['XXXXXXXX', 'XXXXXXXX', '......XX', '.....XXX', '....XXX.', '...XXX..', '...XX...', '..XXX...', '..XX....', '..XX....', '..XX....', '..XX....'],
    8: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XXX..XXX', '.XXXXXX.', '..XXXX..'],
    9: ['..XXXX..', '.XXXXXX.', 'XXX..XXX', 'XX....XX', 'XX....XX', 'XXX...XX', '.XXXXXXX', '..XXXXXX', '......XX', '.....XXX', '.XXXXXX.', '.XXXXX..'],
    '!': ['XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX', 'XX', '..', '..', 'XX', 'XX'],
    '+': ['........', '........', '...XX...', '...XX...', '...XX...', 'XXXXXXXX', 'XXXXXXXX', '...XX...', '...XX...', '...XX...', '........', '........'],
    '-': ['......', '......', '......', '......', '......', 'XXXXXX', 'XXXXXX', '......', '......', '......', '......', '......'],
    ',': ['..', '..', '..', '..', '..', '..', '..', '..', '..', 'XX', 'XX', 'X.'],
    '.': ['..', '..', '..', '..', '..', '..', '..', '..', '..', '..', 'XX', 'XX'],
    ':': ['..', '..', '..', 'XX', 'XX', '..', '..', '..', '..', 'XX', 'XX', '..'],
    '/': ['......XX', '......XX', '.....XX.', '.....XX.', '....XX..', '....XX..', '...XX...', '...XX...', '..XX....', '..XX....', '.XX.....', '.XX.....'],
  };
  // Field label face (Edit 39): 6-art-px caps = 12 screen units (ui.typeFieldLabel). Model tags and barks.
  // Half the 8 × 12 face, for the laptop viewing distance (decision 121). Capitals, digits, light punctuation.
  const SG = {
    A: ['.XX.', 'X..X', 'X..X', 'XXXX', 'X..X', 'X..X'], B: ['XXX.', 'X..X', 'XXX.', 'X..X', 'X..X', 'XXX.'],
    C: ['.XXX', 'X...', 'X...', 'X...', 'X...', '.XXX'], D: ['XXX.', 'X..X', 'X..X', 'X..X', 'X..X', 'XXX.'],
    E: ['XXXX', 'X...', 'XXX.', 'X...', 'X...', 'XXXX'], F: ['XXXX', 'X...', 'XXX.', 'X...', 'X...', 'X...'],
    G: ['.XXX', 'X...', 'X.XX', 'X..X', 'X..X', '.XXX'], H: ['X..X', 'X..X', 'XXXX', 'X..X', 'X..X', 'X..X'],
    I: ['XXX', '.X.', '.X.', '.X.', '.X.', 'XXX'], J: ['..XX', '...X', '...X', '...X', 'X..X', '.XX.'],
    K: ['X..X', 'X.X.', 'XX..', 'XX..', 'X.X.', 'X..X'], L: ['X...', 'X...', 'X...', 'X...', 'X...', 'XXXX'],
    M: ['X...X', 'XX.XX', 'X.X.X', 'X...X', 'X...X', 'X...X'], N: ['X..X', 'XX.X', 'X.XX', 'X..X', 'X..X', 'X..X'],
    O: ['.XX.', 'X..X', 'X..X', 'X..X', 'X..X', '.XX.'], P: ['XXX.', 'X..X', 'X..X', 'XXX.', 'X...', 'X...'],
    Q: ['.XX.', 'X..X', 'X..X', 'X..X', 'X.X.', '.X.X'], R: ['XXX.', 'X..X', 'X..X', 'XXX.', 'X.X.', 'X..X'],
    S: ['.XXX', 'X...', '.XX.', '...X', '...X', 'XXX.'], T: ['XXX', '.X.', '.X.', '.X.', '.X.', '.X.'],
    U: ['X..X', 'X..X', 'X..X', 'X..X', 'X..X', '.XX.'], V: ['X...X', 'X...X', 'X...X', '.X.X.', '.X.X.', '..X..'],
    W: ['X...X', 'X...X', 'X...X', 'X.X.X', 'XX.XX', 'X...X'], X: ['X..X', 'X..X', '.XX.', '.XX.', 'X..X', 'X..X'],
    Y: ['X.X', 'X.X', 'X.X', '.X.', '.X.', '.X.'], Z: ['XXXX', '...X', '..X.', '.X..', 'X...', 'XXXX'],
    0: ['.XX.', 'X..X', 'X.XX', 'XX.X', 'X..X', '.XX.'], 1: ['.X.', 'XX.', '.X.', '.X.', '.X.', 'XXX'],
    2: ['.XX.', 'X..X', '...X', '..X.', '.X..', 'XXXX'], 3: ['XXX.', '...X', '.XX.', '...X', '...X', 'XXX.'],
    4: ['X..X', 'X..X', 'XXXX', '...X', '...X', '...X'], 5: ['XXXX', 'X...', 'XXX.', '...X', '...X', 'XXX.'],
    6: ['.XX.', 'X...', 'XXX.', 'X..X', 'X..X', '.XX.'], 7: ['XXXX', '...X', '..X.', '.X..', '.X..', '.X..'],
    8: ['.XX.', 'X..X', '.XX.', 'X..X', 'X..X', '.XX.'], 9: ['.XX.', 'X..X', 'X..X', '.XXX', '...X', '.XX.'],
    '.': ['.', '.', '.', '.', '.', 'X'], ',': ['..', '..', '..', '..', '.X', 'X.'], '!': ['X', 'X', 'X', 'X', '.', 'X'],
    '?': ['XXX.', '...X', '..X.', '.X..', '....', '.X..'], "'": ['X', 'X', '.', '.', '.', '.'], '-': ['...', '...', 'XXX', '...', '...', '...'],
    ':': ['.', 'X', '.', '.', 'X', '.'], '/': ['...X', '...X', '..X.', '.X..', 'X...', 'X...'], '+': ['...', '.X.', 'XXX', '.X.', '...', '...'],
    '(': ['.X', 'X.', 'X.', 'X.', 'X.', '.X'], ')': ['X.', '.X', '.X', '.X', '.X', 'X.'], '%': ['X..X', '...X', '..X.', '.X..', 'X...', 'X..X'],
    '"': ['X.X', 'X.X', '...', '...', '...', '...'], '&': ['.X..', 'X.X.', '.X..', 'X.XX', 'X..X', '.XX.'], '·': ['.', '.', 'X', '.', '.', '.'],
  };
  const SMALL_H = 6, SGAP = 1, SSPACE = 3, SGLYPH = {};
  for (const ch in SG) { const rows = SG[ch], px = []; rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'X') px.push([x, y]); }); SGLYPH[ch] = { w: rows[0].length, px }; }
  const sNorm = (s) => String(s).toUpperCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/[—–]/g, '-');
  function smallWidth(s) { let w = 0; for (const ch of sNorm(s)) w += (ch === ' ' ? SSPACE : (SGLYPH[ch] ? SGLYPH[ch].w : 4)) + SGAP; return Math.max(0, w - SGAP); }
  function smallText(B, s, x, y, c) { // top-left at (x, y), no outline: labels sit on their own fill
    let cx = Math.round(x); y = Math.round(y);
    for (const ch of sNorm(s)) {
      if (ch === ' ') { cx += SSPACE + SGAP; continue; }
      const g = SGLYPH[ch]; if (!g) { cx += 4 + SGAP; continue; }
      for (const [gx, gy] of g.px) B.put(cx + gx, y + gy, c);
      cx += g.w + SGAP;
    }
    return cx;
  }
  const FONT_H = 12, GAP = 2, SPACE = 6;
  const GLYPH = {};
  for (const ch in G) { const rows = G[ch], px = []; rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === 'X') px.push([x, y]); }); GLYPH[ch] = { w: rows[0].length, px }; }
  function textWidth(s, sc) { sc = sc || 1; let w = 0; for (const ch of String(s).toUpperCase()) w += (ch === ' ' ? SPACE : (GLYPH[ch] ? GLYPH[ch].w : 8)) + GAP; return Math.max(0, w - GAP) * sc; }
  function text(B, s, x, y, c, oc, sc) { // top-left at (x, y); oc: 1-px outline colour
    sc = sc || 1; x = Math.round(x); y = Math.round(y);
    const pts = [];
    let cx = x;
    for (const ch of String(s).toUpperCase()) {
      if (ch === ' ') { cx += (SPACE + GAP) * sc; continue; }
      const g = GLYPH[ch]; if (!g) { cx += (8 + GAP) * sc; continue; }
      for (const [gx, gy] of g.px) for (let j = 0; j < sc; j++) for (let i = 0; i < sc; i++) pts.push([cx + gx * sc + i, y + gy * sc + j]);
      cx += (g.w + GAP) * sc;
    }
    stamp(B, pts, c, oc);
    return cx - x - GAP * sc;
  }

  // ---------- sprites: { w, h, d, ox, oy } — (ox, oy) is the anchor inside the sprite
  function spr(w, h, ox, oy) { return { w, h, d: new Uint32Array(w * h), ox, oy }; }
  function sput(S, x, y, c) { if (x >= 0 && y >= 0 && x < S.w && y < S.h) S.d[y * S.w + x] = c; }
  function blit(B, S, ax, ay, solid) {
    const x0 = Math.round(ax) - S.ox, y0 = Math.round(ay) - S.oy;
    for (let j = 0; j < S.h; j++) {
      const y = y0 + j; if (y < 0 || y >= B.h) continue;
      for (let i = 0; i < S.w; i++) {
        const c = S.d[j * S.w + i]; if (!c) continue;
        const x = x0 + i; if (x < 0 || x >= B.w) continue;
        B.d[y * B.w + x] = solid || c;
      }
    }
  }
  function fromRows(rows, keys, ox, oy, flip) {
    const h = rows.length, w = rows[0].length, S = spr(w, h, flip ? w - 1 - ox : ox, oy);
    rows.forEach((r, y) => { for (let x = 0; x < w; x++) { const k = r[x]; if (keys[k] != null) sput(S, flip ? w - 1 - x : x, y, keys[k]); } });
    return S;
  }

  // Cars: an extruded footprint at 32 headings (11.25°). Top face = footprint lifted by the extrusion; side faces below it.
  // Extrusion in art px = vehicles.<cls>.height × proto.art.extrusion ÷ ui.artScale. Colliders never change.
  const HEADINGS = 32;
  function carSprite(cls, L, W, hgt, theta, braking) {
    const hl = L / 2, hw = W / 2, rc = 2.5, ca = Math.cos(theta), sa = Math.sin(theta);
    const loc = (px, py) => [px * ca + py * sa, -px * sa + py * ca];
    const inFoot = (px, py) => {
      const [u, v] = loc(px, py), au = Math.abs(u), av = Math.abs(v);
      if (au > hl || av > hw) return false;
      const du = au - (hl - rc), dv = av - (hw - rc);
      return !(du > 0 && dv > 0 && du * du + dv * dv > rc * rc);
    };
    const R = Math.ceil(Math.hypot(hl, hw)) + 2, x0 = -R, y0 = -R - hgt, w = 2 * R + 1, h = 2 * R + 1 + hgt;
    const cl = new Uint8Array(w * h), k0 = new Int8Array(w * h).fill(-1);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = x0 + i + 0.5, y = y0 + j + 0.5;
      if (inFoot(x, y + hgt)) { cl[j * w + i] = 2; continue; }
      for (let k = 0; k < hgt; k++) if (inFoot(x, y + k)) { cl[j * w + i] = 1; k0[j * w + i] = k; break; }
    }
    const at = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : cl[j * w + i]);
    const S = spr(w, h, -x0, -y0);
    let top = h;
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const c = at(i, j), x = x0 + i + 0.5, y = y0 + j + 0.5;
      if (!c) {
        if (at(i + 1, j) || at(i - 1, j) || at(i, j + 1) || at(i, j - 1)) { // body below or left: this edge faces the light
          sput(S, i, j, K.carRim ? (at(i, j + 1) || at(i - 1, j) ? K.carRim : K.carRimD) : K.fleetO); top = Math.min(top, j);
        }
        continue;
      }
      top = Math.min(top, j);
      if (c === 2) {
        const [u, v] = loc(x, y + hgt), av = Math.abs(v);
        let col = K.fleetTop;
        const glassAt = (a, b) => av <= hw - 2 && u >= a * L && u <= b * L, roofAt = (a, b) => av <= hw - 1.5 && u > a * L && u < b * L;
        if (cls === 'sedan' || cls === 'police') {
          if (glassAt(0.18, 0.29) || glassAt(-0.23, -0.16)) col = K.glass;
          else if (roofAt(-0.16, 0.18)) col = K.fleetRoof;
          if (cls === 'police' && Math.abs(u) <= 1.2 && av <= hw - 2.5) col = v > 0 ? K.warn : K.podCrown; // P4 mock-up: light bar
        } else if (cls === 'sports') { // P4 mock-up: long bonnet, short cabin, rear deck
          if (glassAt(0.02, 0.14) || glassAt(-0.26, -0.2)) col = K.glass;
          else if (roofAt(-0.2, 0.02)) col = K.fleetRoof;
        } else if (cls === 'hatchback') { // short bonnet, roof to the tail, glass tailgate
          if (glassAt(0.16, 0.3) || glassAt(-0.47, -0.4)) col = K.glass;
          else if (roofAt(-0.4, 0.16)) col = K.fleetRoof;
        } else if (cls === 'wagon' || cls === 'suv') { // long roof with rails
          if (glassAt(0.2, 0.31)) col = K.glass;
          else if (roofAt(-0.45, 0.2)) col = av >= hw - 3 && av <= hw - 2 ? K.fleetLine : cls === 'suv' && Math.abs(u + 0.12 * L) < 3 && av < hw - 5 ? K.pod2 : K.fleetRoof;
        } else if (cls === 'bus') { // full-width screen, roof panels, two roof units, a hatch
          if (av <= hw - 1.5 && u >= hl - 4) col = K.glass;
          else if (av <= hw - 1.5 && u > -hl + 1 && u < hl - 4) col = (Math.abs(u - 0.18 * L) < 5 || Math.abs(u + 0.22 * L) < 5) && av < hw - 4 ? K.pod2 : Math.abs(((u + hl) % 12)) < 1 ? K.fleetLine : K.fleetRoof;
        } else {
          if (glassAt(0.22, 0.33)) col = K.glass;
          else if (roofAt(-0.5 + 1 / L, 0.22)) col = Math.abs(((u + hl) % 6)) < 1 ? K.pod2 : K.fleetRoof;
        }
        if (u > hl - 1.6 && av >= hw - 4.5 && av <= hw - 0.8) col = K.head;
        if (u < -hl + 1.6 && av >= hw - 4.5 && av <= hw - 0.8) col = braking ? K.warn : K.tail;
        if (at(i, j + 1) === 1) col = K.fleetLine;
        sput(S, i, j, col);
      } else {
        const bottom = !at(i, j + 1), low = bottom || !at(i, j + 2);
        let col = bottom ? K.fleetSide2 : K.fleetSide;
        const [u] = loc(x, y + Math.max(0, k0[j * w + i]));
        if (cls === 'bus' && !low && k0[j * w + i] >= 2 && k0[j * w + i] <= hgt - 3 && Math.abs(u) < hl - 4 && ((u + hl) % 10) > 2) col = K.glass; // P4 mock-up: side windows
        if (low && (Math.abs(u - (hl - 6)) <= 2 || Math.abs(u + (hl - 6)) <= 2)) col = K.joint;
        sput(S, i, j, col);
      }
    }
    S.top = top - S.oy; // first row above the anchor (negative)
    return S;
  }
  const carCache = new Map();
  function car(cls, L, W, hgt, heading, braking) {
    const idx = ((Math.round(heading / (TAU / HEADINGS)) % HEADINGS) + HEADINGS) % HEADINGS;
    const key = cls + idx + (braking ? 'b' : '') + L + 'x' + W + 'x' + hgt;
    if (!carCache.has(key)) carCache.set(key, carSprite(cls, L, W, hgt, idx * TAU / HEADINGS, braking));
    return carCache.get(key);
  }

  // The dummy: 13 × 19, anchor at its feet-centre (6, 15). West is drawn; east mirrors it.
  const DUMMY = {
    W: ['....KKKKK....', '...KWWYYYK...', '..KWWYYYYYK..', '..KWYYYYYYyK.', '..KYKYYYYYyK.', '..KYYYYYYYyK.', '...KyYYYYyK..', '....KKKKKK...', '...KWYYYYyK..', '..KKWYYYYyKK.',
      '.KYKWYYYYyKyK', '.KYKYYYYYyKyK', '.KKKYYYYYyKKK', '...KKKKKKKK..', '...KYyKKYyK..', '...KYyKKYyK..', '...KKKKKKKK..', '...KYyK.KYyK.', '..KKKKK.KKKKK'],
    S: ['....KKKKK....', '...KWYYYyK...', '..KWYYYYYyK..', '.KKWYYYYYyKK.', 'KyKYYKYKYyKyK', '.KKYYYYYYyKK.', '...KyYYYyK...', '....KKKKK....', '..KKWYYYyKK..', '.KYKWYYYyKyK.',
      '.KYKYYYYyKyK.', '.KYKYYYYyKyK.', '.KKKKKKKKKKK.', '...KYyKYyK...', '...KYyKYyK...', '...KKKKKKK...', '...KYyKYyK...', '...KYyKYyK...', '..KKKK.KKKK..'],
    N: ['....KKKKK....', '...KWYYYyK...', '..KWYYYYYyK..', '.KKYYYYYYyKK.', 'KyKYYYYYYyKyK', '.KKYYYYYYyKK.', '...KyYYYyK...', '....KKKKK....', '..KKWYYYyKK..', '.KYKWYKYyKyK.',
      '.KYKYYKYyKyK.', '.KYKYYKYyKyK.', '.KKKKKKKKKKK.', '...KYyKYyK...', '...KYyKYyK...', '...KKKKKKK...', '...KYyKYyK...', '...KYyKYyK...', '..KKKK.KKKK..'],
  };
  // Dark-ground rule: an outline must be lighter than the ground it sits on. Only the outer silhouette edge changes;
  // edges facing the light (up, right) take rimLight, the rest rimDark. Inner joints keep the black that makes a crash dummy.
  function edgeRim(S, from, hi, lo) { // outline pixels on the silhouette take hi (exposed up or right) or lo; inner ones keep from
    if (!PAL.rimLight || !hi) return S;
    const at = (x, y) => (x < 0 || y < 0 || x >= S.w || y >= S.h ? 0 : S.d[y * S.w + x]), out = new Uint32Array(S.d);
    for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) {
      if (S.d[y * S.w + x] !== from) continue;
      const up = !at(x, y - 1), right = !at(x + 1, y), down = !at(x, y + 1), left = !at(x - 1, y);
      if (up || right) out[y * S.w + x] = hi; else if (down || left) out[y * S.w + x] = lo;
    }
    S.d = out;
    return S;
  }
  function rim(S) { return edgeRim(S, K.joint, K.rimLight, K.rimDark); }
  const dummyCache = new Map();
  function dummy(facing, wearStep) { // facing: radians; wearStep 0..5 shifts the yellow toward the worn tone
    const c = Math.cos(facing), s = Math.sin(facing);
    const dir = c > 0.38 ? 'E' : c < -0.38 ? 'W' : s > 0 ? 'S' : 'N';
    const key = dir + wearStep;
    if (!dummyCache.has(key)) {
      const k = Math.min(1, wearStep / 5) * 0.75;
      const keys = { K: K.joint, Y: c32(mixHex(PAL.dummy, PAL.worn, k)), y: c32(mixHex(PAL.dummyD, PAL.worn, k * 0.8)), W: c32(mixHex(PAL.dummyL, PAL.worn, k)) };
      dummyCache.set(key, rim(fromRows(DUMMY[dir === 'E' ? 'W' : dir], keys, 6, 15, dir === 'E')));
    }
    return dummyCache.get(key);
  }
  // ---------- HUD chassis (GDD Edit 38 §4.5): a front view drawn at native art resolution, 64 × 108 art px.
  // It sits on the same grid as the field (1 px = ui.artScale screen units) and is never upscaled.
  // Every shape is a shaded rounded box tagged with a body part. Seams fall on the shape underneath; the outer
  // edge is the 1-px outline (rim on dark ground, 4.1.2). Damage: tint, dents, cracks, then a warning outline.
  // Owned modules (the 15 nodes of the tree) draw on top in the brand accent. The dummy's right is screen-left.
  const DOLL_W = 64, DOLL_H = 108, DOY = 3;
  const MODULES = [ // branch order: Head, Torso, Legs, Arms, Battery; tier 1 first
    'widerView', 'memory', 'ears', 'hips', 'spine', 'neck', 'springStart', 'jump', 'grip',
    'carry', 'throw', 'holdOn', 'bigBattery', 'kineticCharge', 'fastCharge'];
  const LIT = (() => { const v = [0.45, -0.55, 0.75], m = Math.hypot(v[0], v[1], v[2]); return v.map((a) => a / m); })(); // sun top right, front
  const DENTS = { head: [[36, 8], [24, 23], [37, 26]], torso: [[23, 46], [41, 44], [36, 55]], armR: [[14, 45], [14, 60]], armL: [[49, 47], [49, 61]],
    legR: [[26, 72], [27, 88]], legL: [[37, 74], [36, 89]] };
  const CRACK = { head: [[38, 5], [37, 7], [39, 9], [37, 11], [38, 13]], torso: [[21, 38], [24, 40], [23, 43], [26, 45], [25, 48]],
    armR: [[16, 39], [14, 42], [16, 45], [14, 48]], armL: [[48, 39], [50, 42], [48, 45], [50, 48]],
    legR: [[29, 68], [26, 71], [28, 74], [26, 77]], legL: [[35, 83], [38, 86], [36, 89], [38, 92]] };
  function doll(levels, flash, mods, reds) { // Edit 91: reds (part → 0–1) redden each part's shell by its damage
    levels = levels || {}; const has = (m) => !!mods && (mods.includes ? mods.includes(m) : mods.has(m));
    const W = DOLL_W, H = DOLL_H, N = W * H;
    const role = new Uint8Array(N), sid = new Int32Array(N).fill(-1), part = new Array(N), seamy = new Uint8Array(N), tone = new Uint8Array(N), flat = new Array(N);
    const BODY = 1, CHROME = 2, JOINT = 3, MOD = 4, FLAT = 5;
    let next = 0;
    const set = (x, y, rl, pt, t, id, sm, hex) => {
      if (x < 0 || y < 0 || x >= W || y >= H) return;
      const i = y * W + x; role[i] = rl; part[i] = pt; tone[i] = t; sid[i] = id; seamy[i] = sm; flat[i] = hex;
    };
    // blob: rounded box over [x0,x1) × [y0,y1) with corner radii rx, ry. Its own normal picks one of three tones.
    function blob(x0, y0, x1, y1, rx, ry, rl, pt, o) {
      o = o || {}; const id = next++; y0 += DOY; y1 += DOY;
      const ix0 = x0 + rx, ix1 = x1 - rx, iy0 = y0 + ry, iy1 = y1 - ry;
      for (let y = Math.floor(y0); y < Math.ceil(y1); y++) for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
        const px = x + 0.5, py = y + 0.5;
        const dx = px - Math.max(ix0, Math.min(ix1, px)), dy = py - Math.max(iy0, Math.min(iy1, py));
        const nx = rx ? dx / rx : 0, ny = ry ? dy / ry : 0, d2 = nx * nx + ny * ny;
        if (d2 > 1 || (o.ring && d2 < o.ring * o.ring)) continue;
        const I = nx * LIT[0] + ny * LIT[1] + Math.sqrt(1 - d2) * LIT[2];
        const t = o.tone != null ? o.tone : o.spec && I > 0.955 ? 3 : I > 0.8 ? 2 : I > 0.3 ? 1 : 0;
        set(x, y, rl, pt, t, id, o.seam === false ? 0 : 1, o.hex);
      }
      return id;
    }
    const dot = (x, y, rl, pt, t, hex) => set(x, y + DOY, rl, pt, t == null ? 1 : t, next++, 0, hex);
    const dots = (pts, rl, pt, t, hex) => { for (const [x, y] of pts) dot(x, y, rl, pt, t, hex); };
    // quartered crash-test decal, painted only onto the shape it marks
    const decal = (cx, cy, onSid, r2) => {
      for (let y = Math.floor(cy - 3); y <= cy + 3; y++) for (let x = Math.floor(cx - 3); x <= cx + 3; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy, i = (y + DOY) * W + x;
        if (dx * dx + dy * dy <= (r2 || 5.5) && (dx < 0) === (dy < 0) && sid[i] === onSid) { role[i] = FLAT; flat[i] = PAL.joint; }
      }
    };
    const mirror = (f) => { f(0, 1); f(64, -1); }; // f(ox, sx): x' = ox + sx·x for the dummy's right (screen-left) and left
    const M = (ox, sx, x0, x1) => (sx > 0 ? [ox + x0, ox + x1] : [ox - x1, ox - x0]);
    const side = (sx, r, l) => (sx > 0 ? r : l);

    // --- body, back to front: legs, pelvis, abdomen, chest, arms, neck, ears, head
    mirror((ox, sx) => {
      const L = side(sx, 'legR', 'legL');
      blob(...pair(M(ox, sx, 20, 31), 95, 101), 4, 3, BODY, L);           // foot
      blob(...pair(M(ox, sx, 24, 30), 92, 96), 2, 1.5, CHROME, L);        // ankle
      blob(...pair(M(ox, sx, 23, 31), 82, 94), 4, 3, BODY, L);            // shin
      blob(...pair(M(ox, sx, 22, 31), 79, 84), 3, 2, CHROME, L);          // knee
      blob(...pair(M(ox, sx, 22, 31), 65, 81), 4.5, 3, BODY, L);          // thigh
    });
    blob(21, 58, 43, 69, 5, 4, BODY, 'torso');                             // pelvis
    blob(23, 59, 41, 62, 1, 1, JOINT, 'torso');                            // lumbar joint
    blob(22, 47, 42, 60, 6, 4, BODY, 'torso');                             // abdomen
    const chest = blob(18, 34, 46, 53, 9, 7, BODY, 'torso', { spec: true }); // chest: broad, rounded shoulders
    decal(40, 40, chest);                                                  // calibration mark
    mirror((ox, sx) => {
      const A = side(sx, 'armR', 'armL');
      blob(...pair(M(ox, sx, 10, 19), 35, 54), 4.5, 4.5, BODY, A, { spec: true }); // upper arm, shoulder cap
      blob(...pair(M(ox, sx, 10, 19), 52, 56), 3, 1.5, CHROME, A);        // elbow
      blob(...pair(M(ox, sx, 10, 19), 55, 67), 4.5, 3, BODY, A);          // forearm
      blob(...pair(M(ox, sx, 11, 18), 66, 69), 2.5, 1.5, CHROME, A);      // wrist
      blob(...pair(M(ox, sx, 9, 19), 68, 77), 5, 4.5, BODY, A);           // mitten hand
    });
    blob(28, 27, 36, 35, 2, 1, JOINT, 'head');                             // neck
    blob(26, 31, 38, 36, 3, 2, CHROME, 'torso');                           // neck collar
    mirror((ox, sx) => decal(ox + sx * 19, 20, blob(...pair(M(ox, sx, 16.5, 22.5), 15, 25), 3, 4.5, BODY, 'head'), 3.2)); // ears with decals
    blob(22, 14, 42, 30, 10, 8, BODY, 'head');                             // jaw
    blob(19.5, 3, 44.5, 26, 12.5, 11.5, BODY, 'head', { spec: true, seam: false }); // cranium: an egg with the jaw
    // face: brows, eyes with a glint, a small nose shadow, a small smile
    mirror((ox, sx) => {
      const X = (x) => ox + sx * x;
      dots([[24, 14], [25, 13], [26, 13], [27, 13], [28, 14]].map(([x, y]) => [X(x), y]), FLAT, 'head', 1, PAL.joint);
      blob(...pair(M(ox, sx, 24.5, 29.5), 16, 21.5), 2.5, 2.75, FLAT, 'head', { seam: false, hex: PAL.joint, tone: 1 });
      dot(X(27) + 1, 17, FLAT, 'head', 1, '#FFFFFF'); // glint on the sun side of each eye
    });
    const lineInk = mixHex(PAL.dummyD, PAL.joint, 0.45);
    dots([[31, 23], [31, 24]], BODY, 'head', 0);
    dots([[29, 26], [30, 27], [31, 27], [32, 27], [33, 27], [34, 26]], FLAT, 'head', 1, lineInk);

    // --- modules: one visible component per node, in the brand accent
    if (has('widerView')) { // wide-angle goggles around the eyes
      mirror((ox, sx) => blob(...pair(M(ox, sx, 22.5, 31.5), 14.25, 23.25), 4.5, 4.5, MOD, 'mod', { ring: 0.62 }));
      blob(31, 17, 33, 20, 0, 0, MOD, 'mod');
      mirror((ox, sx) => blob(...pair(M(ox, sx, 19, 23), 17, 20), 0.5, 0.5, MOD, 'mod'));
    }
    if (has('memory')) { // a memory cartridge in the crown
      blob(26, -2, 38, 5, 1.5, 1.5, MOD, 'mod');
      for (const y of [0, 2]) dots(Array.from({ length: 8 }, (_, i) => [28 + i, y]), FLAT, 'mod', 1, PAL.modGlow);
    }
    if (has('ears')) { // dish ears with antenna stalks
      mirror((ox, sx) => {
        const X = (x) => ox + sx * x;
        blob(...pair(M(ox, sx, 13, 22), 12.5, 26.5), 4.5, 7, MOD, 'mod', { ring: 0.5 });
        blob(...pair(M(ox, sx, 15, 16.5), 7, 13), 0.5, 0.5, CHROME, 'mod');
        blob(...pair(M(ox, sx, 13.5, 18), 3.5, 8), 2.25, 2.25, MOD, 'mod');
      });
    }
    if (has('throw')) { // shoulder actuators, a piston down each arm
      mirror((ox, sx) => {
        blob(...pair(M(ox, sx, 8, 19), 33, 41), 5, 4, MOD, 'mod');
        blob(...pair(M(ox, sx, 7, 10), 40, 53), 1.5, 0.5, CHROME, 'mod');
      });
    }
    if (has('neck')) { // gimbal collar with pivot bolts
      blob(25, 30, 39, 37, 3, 2.5, MOD, 'mod');
      mirror((ox, sx) => blob(...pair(M(ox, sx, 23, 27), 31, 35), 2, 2, CHROME, 'mod'));
    }
    if (has('kineticCharge')) { // impact plates on the flanks, bolt glyphs
      mirror((ox, sx) => {
        const X = (x) => ox + sx * x;
        blob(...pair(M(ox, sx, 19.5, 25), 40, 51), 1.5, 1.5, MOD, 'mod');
        dots([[23, 42], [22, 43], [21, 44], [22, 45], [23, 45], [22, 46], [21, 47], [22, 47], [21, 48]].map(([x, y]) => [X(x), y]), FLAT, 'mod', 1, PAL.modGlow);
      });
    }
    if (has('bigBattery')) { // chest pack: five cells, a terminal on top
      blob(30, 36, 34, 39, 0.5, 0.5, CHROME, 'mod');
      blob(26, 38, 38, 50, 2, 2, MOD, 'mod');
      for (let c = 0; c < 5; c++) dots(Array.from({ length: 8 }, (_, i) => [28 + i, 40 + c * 2]), FLAT, 'mod', 1, PAL.modGlow);
    }
    if (has('spine')) { // flexible bellows: the lumbar segment in the accent, ribbed
      blob(25, 50, 39, 59, 2, 1.5, MOD, 'mod');
      for (const y of [51, 53, 55, 57]) dots(Array.from({ length: 12 }, (_, i) => [26 + i, y]), FLAT, 'mod', 1, PAL.modD);
    }
    if (has('hips')) { // swivel bearing with bolts
      blob(21, 58, 43, 63, 2.5, 2.5, MOD, 'mod');
      dots([[24, 60], [28, 60], [32, 60], [36, 60], [40, 60]], CHROME, 'mod', 2);
    }
    if (has('fastCharge')) { // charge port on the pelvis, a plugged cable
      blob(29, 62, 36, 69, 3.5, 3.5, MOD, 'mod');
      dots([[31, 65], [33, 65]], FLAT, 'mod', 1, PAL.joint);
      blob(31.5, 68, 33.5, 81, 1, 0.5, CHROME, 'mod');                  // the cable hangs between the legs
    }
    if (has('jump')) { // pistons on the thighs
      mirror((ox, sx) => {
        blob(...pair(M(ox, sx, 21.5, 25.5), 66, 79), 2, 1.5, MOD, 'mod');
        blob(...pair(M(ox, sx, 22.5, 24.5), 78, 86), 1, 0.5, CHROME, 'mod');
      });
    }
    if (has('springStart')) { // coil springs at the ankles
      mirror((ox, sx) => { for (let k = 0; k < 3; k++) blob(...pair(M(ox, sx, 22.5, 31.5), 89.5 + k * 2, 91.5 + k * 2), 4.5, 1, MOD, 'mod'); });
    }
    if (has('grip')) { // tread soles with cleats: no slide on oil, mud, gravel, puddles
      mirror((ox, sx) => {
        const X = (x) => ox + sx * x;
        blob(...pair(M(ox, sx, 19, 32), 99, 103), 2, 1.5, JOINT, 'mod');
        dots([[21, 102], [24, 102], [27, 102], [30, 102]].map(([x, y]) => [X(x), y]), MOD, 'mod', 2);
      });
    }
    if (has('holdOn')) { // forearm bracers with clamp jaws
      mirror((ox, sx) => {
        blob(...pair(M(ox, sx, 9, 20), 60, 65.5), 2, 2, MOD, 'mod');
        blob(...pair(M(ox, sx, 5, 9.5), 58.5, 62.5), 1, 1, CHROME, 'mod');
        blob(...pair(M(ox, sx, 5, 9.5), 63.5, 67.5), 1, 1, CHROME, 'mod');
      });
    }
    if (has('carry')) { // grip gloves: the mitts take the accent, with finger lines
      mirror((ox, sx) => {
        const X = (x) => ox + sx * x;
        blob(...pair(M(ox, sx, 9, 19), 68, 77), 5, 4.5, MOD, 'mod');
        for (const x of [12, 14, 16]) dots([[x, 73], [x, 74], [x, 75]].map(([a, y]) => [X(a), y]), FLAT, 'mod', 1, PAL.modD);
      });
    }
    // --- shade, damage, seams, outline
    const lv = (pt) => levels[pt] || 0;
    const ramps = {
      [BODY]: [PAL.dummyD, PAL.dummy, PAL.dummyL, '#FFF7D6'], [CHROME]: [PAL.chromeD, PAL.chrome, PAL.chromeL, '#FFFFFF'],
      [JOINT]: [PAL.joint, PAL.joint, '#3A4148', '#3A4148'], [MOD]: [PAL.modD, PAL.mod, PAL.modL, '#FFFFFF'] };
    const col = new Array(N);
    for (let i = 0; i < N; i++) {
      if (!role[i]) continue;
      let hex = role[i] === FLAT ? flat[i] : ramps[role[i]][tone[i]];
      const l = part[i] === 'mod' ? 0 : lv(part[i]);
      const rd = reds && part[i] !== 'mod' ? reds[part[i]] || 0 : 0;
      if (role[i] === BODY && rd > 0) hex = mixHex(hex, PAL.warn, 0.06 + 0.74 * Math.min(1, rd));
      else if (role[i] === BODY && l) hex = mixHex(hex, PAL.worn, [0, 0.18, 0.4, 0.62][l]);
      col[i] = hex;
    }
    const onPart = (x, y, pt) => { const yy = y + DOY; return x >= 0 && yy >= 0 && x < W && yy < H && part[yy * W + x] === pt && (role[yy * W + x] === BODY || role[yy * W + x] === CHROME); };
    const paint = (x, y, hex) => { col[(y + DOY) * W + x] = hex; };
    for (const pt in DENTS) {
      const l = lv(pt); if (!l) continue;
      DENTS[pt].slice(0, l).forEach(([x, y]) => {
        if (onPart(x, y, pt)) paint(x, y, mixHex(PAL.dummyD, PAL.worn, 0.4));
        if (onPart(x + 1, y, pt)) paint(x + 1, y, mixHex(PAL.dummyD, PAL.worn, 0.4));
        if (onPart(x - 1, y + 1, pt)) paint(x - 1, y + 1, mixHex(PAL.dummyL, PAL.worn, 0.3));
      });
      if (l < 2) continue;
      const pts = CRACK[pt].slice(0, l >= 3 ? 5 : 3);
      for (let k = 1; k < pts.length; k++) {
        const [a, b] = [pts[k - 1], pts[k]], n = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
        for (let s = 0; s <= n; s++) {
          const x = Math.round(a[0] + (b[0] - a[0]) * s / n), y = Math.round(a[1] + (b[1] - a[1]) * s / n);
          if (onPart(x, y, pt)) paint(x, y, PAL.joint);
        }
      }
      if (l >= 3) { const [x, y] = pts[pts.length - 1]; for (const [ax, ay] of [[1, 0], [0, 1]]) if (onPart(x + ax, y + ay, pt)) paint(x + ax, y + ay, PAL.warn); }
    }
    const S = spr(W, H, W >> 1, H - 4), dark = !!PAL.rimLight;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, nb = [[x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]].map(([a, b]) => (a < 0 || b < 0 || a >= W || b >= H ? -1 : b * W + a));
      if (role[i]) {
        let hex = col[i];
        if (flash && part[i] === flash) hex = '#FFFFFF';
        else if (role[i] !== JOINT) for (const j of nb) {
          if (j < 0 || !role[j] || sid[j] <= sid[i] || !seamy[j]) continue;
          hex = lv(part[i]) >= 3 || (part[j] !== 'mod' && lv(part[j]) >= 3) ? PAL.warn : PAL.joint; break;
        }
        S.d[i] = c32(hex);
        continue;
      }
      // empty: outline if it touches the silhouette. Dark ground takes a rim, lit from the top right.
      const hit = nb.map((j) => (j >= 0 && role[j] ? j : -1));
      if (hit.every((j) => j < 0)) continue;
      const broken = hit.some((j) => j >= 0 && part[j] !== 'mod' && lv(part[j]) >= 3);
      const litSide = hit[2] >= 0 || hit[3] >= 0; // the body is below or left: this edge faces up or right
      S.d[i] = c32(broken ? PAL.warn : !dark ? PAL.joint : litSide ? PAL.rimLight : PAL.rimDark);
    }
    return S;
  }
  function pair(xs, y0, y1) { return [xs[0], y0, xs[1], y1]; }
  const CONE = edgeRim(fromRows(['...o...', '..oWo..', '..oOo..', '..oOo..', '.oOOOo.', '.oWWWo.', 'oOOOOOo', 'ooooooo'], { o: K.coneO, O: K.cone, W: K.coneW }, 3, 6), K.coneO, K.coneRim, K.coneRimD); // Edit 71: eight rows, not seven (14% taller; proto.art.coneHeight 16)
  const DRONE = (() => {
    const S = spr(21, 15, 10, 7);
    const P = (x, y, c) => sput(S, x + 10, y + 7, c);
    for (let i = -6; i <= 6; i++) { P(i, Math.round(i * 0.5), K.label); P(i, -Math.round(i * 0.5), K.label); }
    for (const [rx, ry] of [[-7, -4], [7, -4], [-7, 4], [7, 4]]) for (const p of circle(3)) P(rx + p[0], ry + Math.round(p[1] * 0.6), K.label);
    for (let y = -2; y <= 2; y++) for (let x = -4; x <= 4; x++) P(x, y, Math.abs(y) === 2 || Math.abs(x) === 4 ? K.label : y === 0 ? K.podCrown : K.white);
    return S;
  })();
  function pod(wpx, hpx, H, idx) { // glass tower on its footprint (anchor = footprint top-left); LED stripes at night
    const S = spr(wpx + 1, hpx + H + 4, 0, H + 3), o = K.podO, st = KX('podStripes'), led = st ? st[(idx || 0) % st.length] : 0;
    const P = (x, y, c) => sput(S, x, y + H + 3, c);
    for (let y = -H; y < hpx; y++) {
      for (let x = 0; x < wpx; x++) { const f = x / (wpx - 1); P(x, y, led && x % 2 === 1 && f < 0.8 ? led : f > 0.78 ? K.pod3 : f > 0.55 ? K.pod2 : K.podBody); }
      P(0, y, o); P(wpx - 1, y, o);
    }
    for (let y = -H; y < -H + 4; y++) for (let x = 1; x < wpx - 1; x++) P(x, y, led && y === -H + 3 ? led : K.podCrown);
    for (let x = 2; x < Math.min(6, wpx - 1); x++) P(x, -H + 1, K.podHi);
    for (let x = 1; x < wpx - 1; x++) { P(x, -H - 1, o); P(x, hpx - 1, o); P(x, -H + 4, K.pod3); }
    P(wpx >> 1, -H - 2, o); P(wpx >> 1, -H - 3, o);
    return edgeRim(S, o, K.podRim, K.podRimD);
  }
  function barrier(wpx, hpx, e) { // galvanised crash barrier: rail on top, posts on the face (anchor = footprint top-left)
    const S = spr(wpx, hpx + e + 1, 0, e), o = K.railO;
    const P = (x, y, c) => sput(S, x, y + e, c);
    for (let y = -e; y < hpx; y++) for (let x = 0; x < wpx; x++) {
      const topFace = y < hpx - e, edge = x === 0 || x === wpx - 1 || y === -e || y === hpx - 1;
      P(x, y, edge ? o : topFace ? (x % 16 === 0 ? K.railSide : K.rail) : (x % 10 < 2 ? o : K.railSide));
    }
    return S;
  }

  // ---------- scenery
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function blob(B, cx, cy, rx, ry, base, light, shade, outline) {
    const pts = new Set();
    for (let y = -ry - 1; y <= ry + 1; y++) for (let x = -rx - 1; x <= rx + 1; x++) if ((x / (rx + 0.3)) ** 2 + (y / (ry + 0.3)) ** 2 <= 1) pts.add(x + ',' + y);
    for (const k of pts) {
      const [x, y] = k.split(',').map(Number), edge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => !pts.has((x + dx) + ',' + (y + dy)));
      const s = x / rx + y / ry;
      B.put(cx + x, cy + y, edge ? outline : s < -0.7 ? light : s > 0.55 ? shade : base);
    }
  }
  function tree(B, cx, cy) {
    for (let x = cx - 6; x <= cx + 2; x++) for (let y = cy + 9; y <= cy + 10; y++) B.shade(x, y, 0.72);
    B.rect(cx - 1, cy + 4, cx + 1, cy + 10, K.trunk); B.put(cx + 1, cy + 6, K.trunkD);
    for (let y = cy + 4; y <= cy + 10; y++) { B.put(cx - 2, y, K.foliageO); B.put(cx + 2, y, K.foliageO); }
    blob(B, cx, cy, 9, 7, K.foliage, K.foliageL, K.foliageD, K.foliageO);
    for (const [x, y] of [[-4, -3], [-2, -4], [3, -2], [-5, 0]]) B.put(cx + x, cy + y, K.foliageL);
  }
  function hedge(B, cx, cy) { blob(B, cx, cy, 6, 3, K.foliage, K.foliageL, K.foliageD, K.foliageO); }

  // Polyline geometry in world units: nearest distance (signed) and arc length.
  function pathGeom(center) {
    const segs = []; let acc = 0;
    for (let i = 1; i < center.length; i++) {
      const a = center[i - 1], b = center[i], dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
      segs.push({ ax: a[0], ay: a[1], tx: dx / len, ty: dy / len, len, s0: acc }); acc += len;
    }
    return {
      length: acc,
      near(x, y) {
        let best = null;
        for (const g of segs) {
          const px = x - g.ax, py = y - g.ay, t = Math.max(0, Math.min(g.len, px * g.tx + py * g.ty));
          const qx = px - g.tx * t, qy = py - g.ty * t, d = Math.hypot(qx, qy);
          if (!best || d < best.d) best = { d, sd: g.tx * py - g.ty * px, s: g.s0 + t };
        }
        return best;
      },
      at(s) {
        for (const g of segs) if (s <= g.s0 + g.len || g === segs[segs.length - 1]) { const t = s - g.s0; return { x: g.ax + g.tx * t, y: g.ay + g.ty * t, nx: -g.ty, ny: g.tx }; }
        return null;
      },
    };
  }
  // City block (Edit 43): drawn by storeys. H = storeys × the storey's extrusion. Single storey: a pale roof with plant and a
  // lit shopfront. Double: a window row over the shopfront. Tower (3+ storeys): window rows, LED crown, lit seams, a sign.
  function building(wpx, hpx, H, r, led, storeys, deck) {
    const n = Math.max(1, storeys || Math.round(H / 5)), tower = n >= 3 && !deck, sh = H / n;
    const S = spr(wpx, hpx + H, 0, H), o = K.bldgOutline;
    const P = (x, y, c) => sput(S, x, y + H, c); // y relative to the footprint top; roof spans -H .. hpx - H - 1
    const top = -H, face0 = hpx - H, roof = n === 1 ? K.bldgRoof1 : K.bldgRoof;
    for (let y = top; y < face0; y++) for (let x = 0; x < wpx; x++) P(x, y, n === 1 && (y - top) % 3 === 2 ? K.bldgEdge : roof); // single storey: a ribbed shed roof
    for (let x = 0; x < wpx; x++) { P(x, top, n === 1 ? K.bldgEdge : led); P(x, face0 - 1, K.bldgEdge); }
    for (let y = top; y < face0; y++) { P(0, y, K.bldgEdge); P(wpx - 1, y, K.bldgEdge); }
    if (n === 1) { // single storey: skylight strip and a row of AC units
      const sy = top + 2 + Math.floor(r() * Math.max(1, face0 - top - 6));
      for (let x = 3; x < wpx - 3; x++) if (x % 3) P(x, sy, K.bldgEdge);
      for (let x = 3; x + 3 < wpx - 2; x += 6) if (r() < 0.7) for (let k = 0; k < 2; k++) { P(x, sy + 2 + k, K.bldgUnit); P(x + 1, sy + 2 + k, k ? K.bldgUnitD : K.bldgUnit); }
    } else for (let k = 0, m = tower ? 1 : 1 + Math.floor(r() * 3); k < m; k++) { // rooftop plant
      const ux = 2 + Math.floor(r() * Math.max(1, wpx - 8)), uy = top + 2 + Math.floor(r() * Math.max(1, face0 - top - 6));
      for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) P(ux + x, uy + y, y === 2 ? K.bldgUnitD : K.bldgUnit);
    }
    const lit = [led, led, K.white];
    for (let y = face0; y < hpx; y++) {
      const up = hpx - 1 - y, k = Math.min(n - 1, Math.floor(up / sh)), u = up - Math.floor(k * sh); // storey k (0 = street), row u from its floor
      for (let x = 0; x < wpx; x++) {
        let c;
        if (k === 0 && !tower) c = u === 0 ? K.bldgDark : u >= Math.round(sh) - 1 ? led : x % 5 === 0 ? K.bldgDark : (x % 5 === 2 && r() < 0.4 ? K.white : mixK(led, K.bldgFace, 0.55)); // shopfront
        else if (u >= Math.round(sh) - 1) c = K.bldgEdge; // floor slab
        else c = x % 2 === 1 && u === 2 ? (r() < 0.45 ? lit[Math.floor(r() * lit.length)] : K.bldgDark) : K.bldgFace;
        P(x, y, c);
      }
    }
    if (tower) { // LED crown round the roof and lit seams down the face
      for (let x = 1; x < wpx - 1; x++) { P(x, top + 1, led); if (x % 2) P(x, top + 2, led); }
      for (let y = face0; y < hpx - 1; y += 1) if ((y - face0) % 6 < 4) { P(1, y, led); P(wpx - 2, y, led); }
    }
    if (deck) roofDeck(P, wpx, top, face0, led, deck); // Edit 44: a platform's walkable roof at Z2
    if (n >= 2 && wpx >= 20) { // vertical LED sign: glyph blocks meant as texture, not reading
      const sx = 3 + Math.floor(r() * (wpx - 10)), y0 = face0 + 1, y1 = tower ? hpx - 1 : hpx - Math.round(sh);
      for (let y = y0; y < y1; y++) for (let x = sx; x < sx + 5; x++) P(x, y, led);
      for (let gy = y0 + 1; gy + 3 < y1; gy += 5) for (let y = 0; y < 3; y++) for (let x = 0; x < 3; x++) if (r() < 0.55) P(sx + 1 + x, gy + y, K.bldgDark);
    }
    for (let y = top; y < hpx; y++) { P(0, y, y < face0 ? K.bldgEdge : o); P(wpx - 1, y, y < face0 ? K.bldgEdge : o); }
    for (let x = 0; x < wpx; x++) P(x, hpx - 1, o);
    return edgeRim(S, o, K.bldgRim, K.bldgRimD);
  }
  // Platform roof (Edit 44): rooftop tiles, a parapet with an LED line, a striped kerb (white and black: red is the warning's
  // alone) along each ledge that drops to the street, and openings where a stair arrives or a skybridge joins.
  // spec: { ledges: [side], open: [[side, a0, a1]] } in art px along the side from the footprint's top-left.
  function roofDeck(P, wpx, top, face0, led, spec) {
    const hpx = face0 - top, ledge = new Set(spec.ledges || []), open = spec.open || [];
    const isOpen = (sd, a) => open.some(([s2, a0, a1]) => s2 === sd && a >= a0 && a < a1);
    for (let j = 0; j < hpx; j++) for (let x = 0; x < wpx; x++) {
      const y = top + j, dN = j, dS = hpx - 1 - j, dW = x, dE = wpx - 1 - x, d = Math.min(dN, dS, dW, dE);
      const sd = d === dN ? 'N' : d === dS ? 'S' : d === dW ? 'W' : 'E', a = sd === 'N' || sd === 'S' ? x : j;
      let c = (x % 6 === 0 || j % 6 === 0) ? K.pave2 : K.pave; // rooftop tiles
      if (d < 3 && !isOpen(sd, a)) {
        if (ledge.has(sd)) c = d === 0 ? (Math.floor(a / 3) % 2 ? K.white : K.bldgDark) : d === 1 ? K.kerb : c; // ledge: striped kerb
        else c = d === 0 ? K.bldgOutline : d === 1 ? ((a % 4 < 2) ? led : K.jerseyTop) : K.jersey; // parapet with an LED line
      } else if (d === 0) c = K.deck2; // an opening: the roof runs to its edge
      P(x, y, c);
    }
  }
  // Skybridge (Edit 44): a walkway at Z2 between two platform roofs. Glazed rails with LED dots along both long sides, a
  // pale floor with joints, and a slim girder face below when it runs east-west. Anchor = footprint top-left.
  function skybridge(wpx, hpx, lift, alongX) {
    const face = alongX ? 3 : 0, S = spr(wpx, hpx + face, 0, lift), led = KX('bldgLed') ? KX('bldgLed')[2] || KX('bldgLed')[0] : K.lane;
    for (let j = 0; j < hpx + face; j++) for (let i = 0; i < wpx; i++) {
      const a = alongX ? i : j, b = alongX ? j : i, wide = alongX ? hpx : wpx;
      let c;
      if (b >= wide) c = b === wide + face - 1 ? K.bldgOutline : b === wide ? K.jerseyTop : K.column; // girder face
      else if (b === 0 || b === wide - 1) c = K.bldgOutline;
      else if (b === 1 || b === wide - 2) c = a % 4 === 1 ? led : K.jerseyTop; // rails
      else c = a % 8 === 0 ? K.deckJoint : K.deck;
      sput(S, i, j, c);
    }
    return S;
  }
  function mixK(a, b, k) { const p = [a & 255, (a >>> 8) & 255, (a >>> 16) & 255], q = [b & 255, (b >>> 8) & 255, (b >>> 16) & 255], m = p.map((v, i) => Math.round(v + (q[i] - v) * k)); return (0xFF000000 | (m[2] << 16) | (m[1] << 8) | m[0]) >>> 0; }
  function jersey(wpx, hpx, e) { // jersey barrier on its footprint (anchor = footprint top-left): lit top, face with LED dots
    const S = spr(wpx, hpx + e, 0, e), P = (x, y, c) => sput(S, x, y + e, c), horiz = wpx >= hpx;
    for (let y = -e; y < hpx; y++) for (let x = 0; x < wpx; x++) {
      const edge = x === 0 || x === wpx - 1 || y === -e || y === hpx - 1, face = y >= hpx - e;
      const dot = face && (horiz ? x % 3 === 1 : y % 3 === 1);
      P(x, y, edge ? K.jerseyO : face ? (dot ? K.jerseyLed : K.jersey) : K.jerseyTop);
    }
    return edgeRim(S, K.jerseyO, K.jerseyRim, K.jerseyRimD);
  }
  // Static shadow: the footprint swept down-left by its height (hard edge, multiply).
  function rectShadow(B, st, h, P) {
    const k = P['proto.art.shadowScale'], ox = SUN.x * h * k / U, oy = SUN.y * h * k / U;
    const x = st.x / U, y = st.y / U, w = st.w / U, hh = st.h / U;
    fillPoly([[x + w, y], [x + w, y + hh], [x + w + ox, y + hh + oy], [x + ox, y + hh + oy], [x + ox, y + oy], [x, y]], (px, py) => B.shade(px, py, 0.72));
  }

  // ---------- Edit 41 landmarks and flyovers
  // Monument (Riverside): a lantern obelisk on a plinth. Shaft rises H px; an LED seam runs up the lit face; a lantern crowns it.
  function monument(wpx, hpx, H) {
    const S = spr(wpx, hpx + H, 0, H), P = (x, y, c) => sput(S, x, y + H, c), o = K.bldgOutline, led = KX('bldgLed') ? KX('bldgLed')[0] : K.modGlow;
    for (let y = hpx - 6; y < hpx; y++) for (let x = 0; x < wpx; x++) P(x, y, x === 0 || x === wpx - 1 || y === hpx - 1 ? o : K.bldgFace); // plinth
    for (let y = 0; y < hpx - 6; y++) for (let x = 2; x < wpx - 2; x++) P(x, y, K.bldgRoof); // footprint top
    const sw = Math.max(6, Math.round(wpx * 0.4)), sx = Math.round((wpx - sw) / 2);
    for (let y = -H; y < hpx - 6; y++) for (let x = sx; x < sx + sw; x++) {
      const t = (y + H) / (H + hpx), inset = y < -H + 6 ? Math.round((-H + 6 - y) / 2) : 0;
      if (x < sx + inset || x >= sx + sw - inset) continue;
      P(x, y, x === sx + inset || x === sx + sw - 1 - inset ? o : x === sx + sw - 2 ? K.bldgEdge : K.bldgFace);
      if (x === sx + Math.floor(sw / 2) && y > -H + 8 && (y % 4 !== 0)) P(x, y, led);
      void t;
    }
    for (let y = -H - 4; y < -H + 2; y++) for (let x = sx - 1; x < sx + sw + 1; x++) P(x, y, (x + y) % 2 ? led : K.white); // lantern
    return edgeRim(S, o, K.bldgRim, K.bldgRimD);
  }
  // Fountain (Old Market): a round basin, a ring of water, a jet in the middle.
  function fountain(wpx, hpx, H) {
    const S = spr(wpx, hpx + H, 0, H), P = (x, y, c) => sput(S, x, y + H, c), o = K.bldgOutline;
    const cx = (wpx - 1) / 2, cy = (hpx - 1) / 2, R = Math.min(wpx, hpx) / 2 - 0.5;
    for (let y = 0; y < hpx; y++) for (let x = 0; x < wpx; x++) {
      const r = Math.hypot(x - cx, y - cy);
      if (r > R) continue;
      P(x, y, r > R - 1 ? o : r > R - 3 ? K.jerseyTop : r < 3 ? K.bldgFace : ((x * 7 + y * 3) % 11 === 0 ? K.water2 : K.water));
    }
    for (let y = -H; y < cy; y++) P(Math.round(cx), Math.round(y), (y % 3) ? K.puddleHi : K.water2); // jet
    for (let k = -2; k <= 2; k++) P(Math.round(cx) + k, Math.round(cy - H) - (2 - Math.abs(k)), K.puddleHi);
    return edgeRim(S, o, K.bldgRim, K.bldgRimD);
  }
  // Flyover deck (Edit 42): drawn on its true footprint, so actors on it sit where the sim has them. Parapet modules with an
  // LED line and a street light every world.deckLampSpacing; broken where a gap opens over a road (the lamps there are down).
  // Hard shoulders outside solid edge lines; the girder face hangs below the south edge to show the height.
  const LAMP_H = 9;
  function deck(dk, P) {
    const ext = Math.round(dk.height * P['proto.art.extrusion'] / U), wpx = Math.round(P['world.deckWidth'] / U), face = 4; // thin girder: the columns show below it
    const along = dk.hz ? AW : AH, lane = Math.round(P['world.laneWidth'] / U), pw = Math.max(2, Math.round(P['world.parapetWidth'] / U)), mid = Math.round(wpx / 2);
    const S = dk.hz ? spr(along, LAMP_H + wpx + face, 0, LAMP_H) : spr(wpx, along, 0, 0);
    const put = (a, b, c) => (dk.hz ? sput(S, a, b + LAMP_H, c) : sput(S, b, a, c)); // a along the deck, b across (0 = north / west)
    const high = (dk.z || 1) === 2, leds = KX('bldgLed'), led = leds ? leds[high ? 2 : 1] || leds[0] : K.lane, glow = c32(mixHex(PAL.deck2, PAL.head || PAL.white, 0.38)); // Edit 44: the high highway's LED line differs
    const gaps = (dk.gaps || []).map(([a0, a1, sd]) => [Math.round(a0 / U), Math.round(a1 / U), sd]);
    const opens = (dk.openings || []).map(([a0, a1, sd]) => [Math.round(a0 / U), Math.round(a1 / U), sd]); // Edit 44: a link stair's head, no parapet
    const inOpen = (a, sd) => opens.some(([g0, g1, s2]) => s2 === sd && a >= g0 && a < g1);
    const inGap = (a, sd) => gaps.some(([g0, g1, s2]) => s2 === sd && a >= g0 && a < g1);
    const nearGap = (a, sd) => gaps.some(([g0, g1, s2]) => s2 === sd && a >= g0 - 12 && a < g1 + 12);
    for (let a = 0; a < along; a++) for (let b = 0; b < wpx + (dk.hz ? face : 0); b++) {
      let c;
      const sd = b < mid ? -1 : 1, pb = sd < 0 ? b : wpx - 1 - b; // depth into the parapet from the outer edge
      if (b >= wpx) c = b === wpx + face - 1 ? K.bldgOutline : b === wpx ? K.jerseyTop : (a % 8 < 2 ? K.columnD : K.column); // girder face: lit lip, ribs
      else if (pb < pw + 1 && inGap(a, sd)) c = pb === 0 ? ((a % 3) ? (dk.gapLit ? K.podCrown : K.deckJoint) : K.bldgDark) : K.deck2; // broken parapet: the deck edge shows (Edit 85: lit cyan, a drop to read)
      else if (pb < pw + 1 && inOpen(a, sd)) c = pb === 0 ? K.deckJoint : K.deck; // opening: the deck runs onto the stair
      else if (high && pb === pw + 1) c = (a % 6 < 3) ? led : K.deck2; // high highway: a second LED line inside the parapet
      else if (pb === 0) c = K.jerseyO;
      else if (pb === 1) c = (a % 6 < 3) ? led : K.jerseyTop; // parapet LED line
      else if (pb < pw + 1) c = K.jersey;
      else if (Math.abs(b - mid) === lane) c = K.lane; // solid edge lines: the hard shoulders lie outside them
      else if (b === mid && a % 24 < 14) c = K.lane; // long highway dashes
      else if (a % 32 === 0) c = K.deckJoint; // expansion joints across the deck
      else c = Math.abs(b - mid) > lane ? K.deck2 : K.deck; // pale concrete: the highway is never the asphalt below
      put(a, b, c);
      if (pb < pw + 1 && pb > 0 && !inGap(a, sd) && (inGap(a - 1, sd) || inGap(a + 1, sd) || (dk.gapLit && (inGap(a - 2, sd) || inGap(a + 2, sd))))) put(a, b, K.white); // snapped ends (never warning red: canon); Edit 85: two px
    }
    const sp = Math.round(P['world.deckLampSpacing'] / U);
    // P5.2 (Edit 50.2): lamps in pairs, one on each parapet every world.deckLampSpacing; a pale pole, a bright head, a light pool
    if (dk.hz) for (const sd of [-1, 1]) for (let a = Math.round(sp / 2); a < along; a += sp) {
      if (inGap(a, sd) || inOpen(a, sd)) continue;
      const b0 = sd < 0 ? 1 : wpx - 2;
      if (nearGap(a, sd)) { for (let k = 0; k < 5; k++) put(a + k, b0 - k * sd, k === 4 ? K.bldgDark : K.bldgOutline); continue; } // broken: the pole lies across the shoulder, unlit
      for (let k = 1; k <= 4; k++) for (let j = -2; j <= 2; j++) if (Math.abs(j) + (k > 3 ? 1 : 0) <= 2) put(a + j, b0 - sd * (pw + k), glow); // light pool on the shoulder
      for (let k = 1; k < LAMP_H; k++) { sput(S, a, b0 + LAMP_H - k, K.jerseyTop); sput(S, a + 1, b0 + LAMP_H - k, K.bldgOutline); } // the pole rises screen-up from the parapet
      for (let j = -1; j <= 2; j++) { sput(S, a + j, b0 + 1, j === 0 || j === 1 ? K.white : K.head); sput(S, a + j, b0, K.bldgOutline); }
    }
    return { S, ext };
  }
  // Perimeter wall (anchor = footprint top-left): capped top with an LED seam, panelled face toward the viewer.
  function wall(wpx, hpx, e) {
    const S = spr(wpx, hpx + e, 0, e), P = (x, y, c) => sput(S, x, y + e, c), led = KX('bldgLed') ? KX('bldgLed')[0] : K.lane, horiz = wpx >= hpx;
    for (let y = -e; y < hpx; y++) for (let x = 0; x < wpx; x++) {
      const edge = x === 0 || x === wpx - 1 || y === -e || y === hpx - 1, face = y >= hpx - e;
      const seam = horiz ? y === -e + Math.floor((hpx) / 2) && x % 4 < 2 : x === Math.floor(wpx / 2) && y % 4 < 2;
      P(x, y, edge ? K.bldgOutline : face ? ((horiz ? x : y) % 12 === 0 ? K.bldgDark : K.bldgFace) : seam ? led : K.bldgRoof);
    }
    return edgeRim(S, K.bldgOutline, K.bldgRim, K.bldgRimD);
  }
  // Checkpoint booth: a cabin with a lit window band and an amber beacon on the roof.
  function booth(wpx, hpx, e) {
    const S = spr(wpx, hpx + e + 3, 0, e + 3), P = (x, y, c) => sput(S, x, y + e + 3, c), o = K.bldgOutline;
    for (let y = -e; y < hpx; y++) for (let x = 0; x < wpx; x++) {
      const edge = x === 0 || x === wpx - 1 || y === -e || y === hpx - 1, face = y >= hpx - e;
      P(x, y, edge ? o : face ? ((y - (hpx - e)) % 3 === 1 && x % 3 ? K.white : K.bldgFace) : K.bldgRoof);
    }
    const cx = wpx >> 1; for (let k = 1; k <= 3; k++) P(cx, -e - k, k === 3 ? K.amber : o);
    return edgeRim(S, o, K.bldgRim, K.bldgRimD);
  }
  // Stairs (Edit 44, anchor = footprint top-left): lit treads from the foot at lift0 to the head at lift1 (art px). A flight
  // along y stretches toward a head to the north and steepens toward one to the south; a flight along x shows its south
  // stringer from the treads down to its foot level.
  function stairs(st, lift0, lift1) {
    lift0 = lift0 || 0; lift1 = lift1 || 0;
    const w = Math.round(st.w / U), h = Math.round(st.h / U), ay = st.axis === 'y', top = Math.max(lift0, lift1), led = KX('bldgLed') ? KX('bldgLed')[1] : K.lane;
    const headLow = st.high < st.low, n = ay ? h : w, S = spr(w, h + top, 0, top);
    const tAt = (k) => (headLow ? 1 - k / (n - 1) : k / (n - 1)), L = (k) => Math.round(lift0 + (lift1 - lift0) * tAt(k));
    const tone = (t, k, rail) => (rail ? (k % 4 < 2 ? led : K.jerseyTop) : k % 3 === 0 ? K.jerseyO : t > 0.66 ? K.deck : t > 0.33 ? K.deck2 : K.pave2);
    if (ay) {
      for (let j = 0; j < h; j++) {
        const y0 = j - L(j), y1 = j + 1 < h ? j + 1 - L(j + 1) : y0 + 1;
        for (let y = Math.min(y0, y1 - 1); y <= Math.max(y0, y1 - 1); y++) for (let i = 0; i < w; i++) sput(S, i, y + top, tone(tAt(j), j, i === 0 || i === w - 1));
      }
    } else {
      for (let i = 0; i < w; i++) {
        const l = L(i), base = Math.min(lift0, lift1);
        for (let j = 0; j < h; j++) sput(S, i, j - l + top, tone(tAt(i), i, j === 0 || j === h - 1));
        for (let y = h - l; y < h - base; y++) sput(S, i, y + top, y === h - base - 1 ? K.bldgOutline : i % 6 === 0 ? K.columnD : K.column); // stringer face
      }
    }
    return S;
  }
  // Ground patches beyond puddles: plaza paving, rubber crash matting, calibrated impact plates.
  function patchArt(B, p, r) {
    const x0 = Math.round(p.x / U), y0 = Math.round(p.y / U), w = Math.round(p.w / U), h = Math.round(p.h / U);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      let c = null;
      if (p.kind === 'plaza') c = edge ? K.pave2 : (x % 8 === 0 || y % 8 === 0) ? K.pave2 : ((x * 13 + y * 7) % 23 === 0 ? K.kerb2 : K.pave);
      else if (p.kind === 'matting') c = edge ? K.jerseyO : ((x + y) % 4 === 0 ? K.jersey : K.bldgDark);
      else if (p.kind === 'plate') { const cx = w / 2 - 0.5, cy = h / 2 - 0.5, rr = Math.hypot(x - cx, y - cy); c = edge ? K.lane : (Math.abs(rr - w / 4) < 0.7 || Math.abs(x - cx) < 0.6 || Math.abs(y - cy) < 0.6) ? K.lane : ((x + y) % 2 ? K.road2 : K.road); }
      if (c != null) B.put(x0 + x, y0 + y, c);
    }
    void r;
  }
  // Puddle (D18): standing water on its tile rectangle. An irregular blob filling most of the patch; sheen on the
  // far (top-left) lip, a dark near lip, and broken vertical reflections of the city lights, like the river's.
  function puddle(B, p, r) {
    const x0 = Math.round(p.x / U), y0 = Math.round(p.y / U), w = Math.round(p.w / U), h = Math.round(p.h / U), ph = r() * TAU;
    const inS = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return false;
      const u = (x + 0.5 - w / 2) / (w / 2), v = (y + 0.5 - h / 2) / (h / 2), a = Math.atan2(v, u);
      return Math.abs(u) ** 2.6 + Math.abs(v) ** 2.6 <= 1 - 0.14 * (0.5 + 0.5 * Math.sin(3 * a + ph));
    };
    const refl = KX('reflect');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!inS(x, y)) continue;
      const far = !inS(x, y - 1) || !inS(x - 1, y), near = !inS(x, y + 1) || !inS(x + 1, y);
      B.put(x0 + x, y0 + y, far ? K.puddleRim : near ? K.puddleLip : K.puddle);
    }
    for (let k = 0, n = 2 + Math.round(w * h / 160); k < n; k++) { // reflections: short vertical columns
      const xx = 2 + Math.floor(r() * Math.max(1, w - 4)), yy = 2 + Math.floor(r() * Math.max(1, h - 6)), len = 2 + Math.floor(r() * 3);
      const c = refl && r() < 0.6 ? refl[Math.floor(r() * refl.length)] : K.puddleHi;
      for (let i = 0; i < len; i += 1) if (inS(xx, yy + i) && inS(xx, yy + i + 1) && inS(xx, yy + i - 1) && (i % 3 !== 2)) B.put(x0 + xx, y0 + yy + i, c);
    }
  }
  // Screen edges (D24, Edit 40.1) are open. A dotted line marks where one stops the dummy though this side looks open:
  // the district's outer edge, or a building just across it.
  function edgeMarks(B, level) {
    const c = K.gate, spans = level.blockedEdges || Object.fromEntries((level.solid || []).map((sd) => [sd, [[0, sd === 'N' || sd === 'S' ? AW * U : AH * U]]]));
    for (const sd of ['N', 'E', 'S', 'W']) for (const [a, z] of spans[sd] || []) {
      for (let i = Math.round(a / U); i < Math.round(z / U); i++) {
        if (i % 3) continue;
        const [x, y] = sd === 'W' ? [0, i] : sd === 'E' ? [AW - 1, i] : sd === 'N' ? [i, 0] : [i, AH - 1];
        B.put(x, y, c);
        B.put(sd === 'W' ? x + 1 : sd === 'E' ? x - 1 : x, sd === 'N' ? y + 1 : sd === 'S' ? y - 1 : y, c);
      }
    }
  }
  // The level's ground, drawn once: grass, canal, road from the centre line, pavement, planting, static shadows.
  function ground(level, P, seed) {
    const B = new Buf(AW, AH), r = rng(seed || 7);
    B.fill(K.grass);
    const city = PAL.scenery === 'city';
    if (city) { // deck plates with seams, grates and drains
      for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) if (x % 16 === 0 || y % 16 === 0) B.put(x, y, K.grass2);
      for (let i = 0; i < Math.round(90 * AW * AH / 120000); i++) { const x = Math.floor(r() * AW / 16) * 16 + 4, y = Math.floor(r() * Math.ceil(AH / 16)) * 16 + 4, w = 3 + Math.floor(r() * 6); for (let k = 0; k < w; k += 2) { B.put(x + k, y, K.grass3); B.put(x + k, y + 1, K.grass3); } }
    } else {
      for (let i = 0; i < 2000; i++) { const x = Math.floor(r() * AW), y = Math.floor(r() * AH); B.put(x, y, K.grass2); B.put(x + 1, y - 1, K.grass2); }
      for (let i = 0; i < 650; i++) B.put(Math.floor(r() * AW), Math.floor(r() * AH), K.grass3);
    }
    const canal = level.canal !== false, cb = canal ? Math.round(34 / U) : -3; // canal along the top edge: the river screens only (D24)
    if (canal) {
      B.rect(0, 0, AW - 1, cb, K.water);
      for (const y of [3, 7, 11, 15]) for (let x = Math.floor(r() * 8); x < AW; x += 31) for (let i = 0; i < 8; i++) B.put(x + i, y + (i > 3 ? 1 : 0), K.water2);
      B.rect(0, cb + 1, AW - 1, cb + 1, K.kerb); B.rect(0, cb + 2, AW - 1, cb + 2, K.kerb2);
    }
    const refl = KX('reflect');
    if (!canal) { /* no river on inland screens */ } else if (refl) { // night river: the towers' light falls on the water as broken vertical columns
      for (let i = 0, x = 6; x < AW; x += 17 + Math.floor(r() * 12), i++) {
        const c = refl[i % refl.length];
        for (let y = 1; y < cb; y += 2) if (r() < 0.75) { const j = Math.round((r() - 0.5) * 3), w = 2 + Math.floor(r() * 4); for (let k = 0; k < w; k++) B.put(x + j + k, y, c); }
      }
    } else for (const [bx, by, br] of [[40, 8, 2], [170, 5, 3], [300, 10, 2], [372, 4, 1]]) { for (const p of circle(br)) B.put(bx + p[0], by + p[1], K.bubble); B.put(bx - 1, by - 1, K.bubble); }
    // road and pavement from the distance to the centre line
    const geo0 = pathGeom(level.center), geoR = level.ring ? pathGeom(level.ring) : null, lw = P['world.laneWidth'], outer = lw + P['proto.shoulderWidth'];
    const geo = geoR ? { length: geo0.length, at: geo0.at, near: (x, y) => { const a = geo0.near(x, y), b2 = geoR.near(x, y); return b2.d < a.d ? b2 : a; } } : geo0; // the roundabout ring is road too
    const near = new Float32Array(AW * AH);
    const field = level.arms ? roadField([].concat(level.arms.map((pts) => ({ pts, dash: true })), level.ring ? [{ pts: level.ring, dash: true }] : [], (level.surfaces || []).map((pts) => ({ pts, dash: false }))), outer + 40) : null; // P4 (Edit 49.3): junctions
    for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
      const wx = (x + 0.5) * U, wy = (y + 0.5) * U, k = y * AW + x, n = field ? { d: field.D[k], sd: field.dash[k] ? field.SD[k] : -1, s: field.S[k] } : geo.near(wx, wy);
      near[y * AW + x] = n.d;
      if (n.d >= outer) continue;
      if (n.d < lw) {
        let c = K.road;
        if ((Math.imul(x * 73856093 ^ y * 19349663, 2654435761) >>> 0) % 100 < 7) c = K.road2;
        if (n.d >= lw - U) c = K.kerb; else if (n.d >= lw - 2 * U) c = K.kerb2;
        if (n.sd >= 0 && n.sd < U && ((n.s % 36) + 36) % 36 < 20) c = K.lane; // lane dashes
        B.put(x, y, c);
      } else if (K.edgeLight && n.d >= outer - U && ((n.s % 16) + 16) % 16 < U) B.put(x, y, K.edgeLight); // riverside light string
      else B.put(x, y, n.d >= outer - U || ((n.s % 12) + 12) % 12 < U ? K.pave2 : K.pave);
    }
    const clearOf = (wx, wy, m) => level.statics.every((st) => wx < st.x - m || wx > st.x + st.w + m || wy < st.y - m || wy > st.y + st.h + m)
      && level.spawns.every((sp) => Math.hypot(sp.x - wx, sp.y - wy) > m + 20) && (level.coneHomes || []).every((cn) => Math.hypot(cn[0] - wx, cn[1] - wy) > m);
    const roadD = (wx, wy) => { const x = Math.floor(wx / U), y = Math.floor(wy / U); return x < 0 || y < 0 || x >= AW || y >= AH ? 999 : near[y * AW + x]; };
    // flowers, never yellow
    for (let i = 0; i < PAL.flowers; i++) {
      const x = Math.floor(r() * AW), y = cb + 4 + Math.floor(r() * (AH - cb - 4));
      if (near[y * AW + x] < outer + 12) continue;
      const c = r() < 0.6 ? K.flower : K.flower2; B.put(x, y, c); B.put(x + 1, y + 1, c);
    }
    if (PAL.spill) { // neon spill on the ground in front of each block
      const leds = KX('bldgLed');
      level.statics.forEach((st, i) => {
        if (st.kind !== 'block') return;
        const x = Math.round(st.x / U), y = Math.round((st.y + st.h) / U), w = Math.round(st.w / U), led = leds[i % leds.length];
        for (let k = 0; k < 4; k++) for (let xx = x; xx < x + w; xx++) B.mix(xx, y + k, led, [0.28, 0.18, 0.1, 0.05][k]);
      });
    }
    // hedges just outside the pavement, in runs of three, kept clear of pods, spawns and cones
    if (!city) for (let s = 40; s < geo.length; s += 150) for (const side of [-1, 1]) {
      if (r() < 0.25) continue;
      for (let k = 0; k < 3; k++) {
        const q = geo.at(s + k * 22); if (!q) continue;
        const wx = q.x + q.nx * side * (outer + 12), wy = q.y + q.ny * side * (outer + 12);
        if (wx < 8 || wy < 46 || wx > AW * U - 8 || wy > AH * U - 8 || roadD(wx, wy) < outer + 6 || !clearOf(wx, wy, 14)) continue;
        hedge(B, Math.round(wx / U), Math.round(wy / U));
      }
    }
    // trees on open lawn
    const trees = [];
    for (let t = 0; t < (city ? 0 : 400) && trees.length < 12; t++) {
      const wx = 30 + r() * (AW * U - 60), wy = 70 + r() * (AH * U - 100);
      if (roadD(wx, wy) < outer + 34 || roadD(wx, wy + 24) < outer + 20 || !clearOf(wx, wy, 34) || trees.some((q) => Math.hypot(q[0] - wx, q[1] - wy) < 90)) continue;
      trees.push([wx, wy]);
    }
    trees.sort((a, b) => a[1] - b[1]).forEach(([wx, wy]) => tree(B, Math.round(wx / U), Math.round(wy / U)));
    for (const p of level.patches || []) if (p.kind === 'puddle') puddle(B, p, r); else patchArt(B, p, r);
    for (const dk of level.decks || []) { // flyover shadows: the deck band swept down-left by its height
      const band = dk.hz ? { x: 0, y: dk.off - P['world.deckWidth'] / 2, w: AW * U, h: P['world.deckWidth'] } : { x: dk.off - P['world.deckWidth'] / 2, y: 0, w: P['world.deckWidth'], h: AH * U };
      rectShadow(B, band, dk.height, P);
    }
    for (const st of level.statics) if (st.kind !== 'river' && !st.deck && (!PAL.spill || st.kind !== 'block' || st.storeys)) rectShadow(B, st, st.height || P[st.kind === 'barrier' || st.kind === 'jersey' ? 'proto.art.barrierHeight' : st.kind === 'crate' ? 'proto.art.crateHeight' : 'proto.art.pillarHeight'], P);
    for (const f of level.floors || []) if (f.kind === 'bridge') rectShadow(B, f, P['world.highHeight'], P); // skybridges cast theirs across the alley
    for (const g of level.giveWays || []) giveWayMark(B, g, P); // Edit 56: MUTCD yield line across the approach lane
    edgeMarks(B, level);
    return B;
  }
  // P4 (Edit 49.3): nearest road centre line per art pixel, stamped segment by segment within reach (junctions have many lines).
  function roadField(geoms, reach) {
    const N = AW * AH, D = new Float32Array(N).fill(1e9), SD = new Float32Array(N), S = new Float32Array(N), dash = new Uint8Array(N);
    for (const g of geoms) {
      let acc = 0;
      for (let i = 1; i < g.pts.length; i++) {
        const [ax, ay] = g.pts[i - 1], [bx, by] = g.pts[i], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1, tx = dx / len, ty = dy / len;
        const x0 = Math.max(0, Math.floor((Math.min(ax, bx) - reach) / U)), x1 = Math.min(AW - 1, Math.ceil((Math.max(ax, bx) + reach) / U));
        const y0 = Math.max(0, Math.floor((Math.min(ay, by) - reach) / U)), y1 = Math.min(AH - 1, Math.ceil((Math.max(ay, by) + reach) / U));
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const px = (x + 0.5) * U - ax, py = (y + 0.5) * U - ay, t = Math.max(0, Math.min(len, px * tx + py * ty)), ex = px - tx * t, ey = py - ty * t, d = Math.sqrt(ex * ex + ey * ey), k = y * AW + x; // P6: sqrt, not hypot (speed)
          if (d < D[k]) { D[k] = d; SD[k] = tx * py - ty * px; S[k] = acc + t; dash[k] = g.dash ? 1 : 0; }
        }
        acc += len;
      }
    }
    return { D, SD, S, dash };
  }
  // Yield line (MUTCD 3B.16; Edit 56): a row of solid white isosceles triangles across the approach lane, each pointing at
  // the approaching car. Base world.markYieldBase, height world.markYieldHeight (1 : 1.5), gaps world.markYieldGap; filled
  // pixel by pixel so the teeth stay triangles at any angle. White: yellow is the dummy's alone (Edit 37).
  // Edit 57: MUTCD 3B.16 yield line. Identical teeth, stamped at equal steps along a line square to the approach's last straight;
  // each points back up that straight. g = { x, y, ux, uy }: the lane centre on the line, the heading (a multiple of 45°).
  const TOOTH = {};
  function toothMask(diag, b, h) { // pixels of one tooth whose base centre sits on pixel (0, 0); heading +x (axis) or +x+y (diagonal)
    const key = diag + ':' + b + ':' + h; if (TOOTH[key]) return TOOTH[key];
    const r2 = (v) => Math.round(v * 2) / 2, a = r2(b / (2 * Math.SQRT2)), t = r2(h / Math.SQRT2); // diagonal: 1 : 2 edges read clean in pixels
    const [A, Bv, C] = diag ? [[a, -a], [-a, a], [-t, -t]] : [[0, -b / 2], [0, b / 2], [-h, 0]], out = [];
    const side = (P0, P1, x, y) => (P1[0] - P0[0]) * (y - P0[1]) - (P1[1] - P0[1]) * (x - P0[0]);
    for (let y = -Math.ceil(h) - 1; y <= Math.ceil(h) + 1; y++) for (let x = -Math.ceil(h) - 1; x <= Math.ceil(h) + 1; x++) {
      const s1 = side(A, Bv, x, y), s2 = side(Bv, C, x, y), s3 = side(C, A, x, y), e = 1e-9;
      if ((s1 >= -e && s2 >= -e && s3 >= -e) || (s1 <= e && s2 <= e && s3 <= e)) out.push([x, y]);
    }
    return (TOOTH[key] = out);
  }
  function giveWayMark(B, g, P) {
    const b = (P ? P['world.markYieldBase'] : 14) / U, h = (P ? P['world.markYieldHeight'] : 21) / U, gap = (P ? P['world.markYieldGap'] : 4) / U, lw = (P ? P['world.laneWidth'] : 56) / U;
    const ux = g.ux != null ? g.ux : g.tx, uy = g.uy != null ? g.uy : g.ty, diag = Math.abs(ux) > 0.1 && Math.abs(uy) > 0.1;
    const sx = Math.sign(Math.round(ux * 2)), sy = Math.sign(Math.round(uy * 2)); // heading in whole pixels
    const step = diag ? Math.round((b + gap) / Math.SQRT2) : Math.round(b + gap), across = diag ? [-sy, sx] : [-sy, sx]; // one tooth to the next, in whole pixels
    const span = diag ? step * Math.SQRT2 : step, n = Math.max(1, Math.floor((lw - 2 - b) / span) + 1);
    const mask = toothMask(diag, b, h), ox = Math.round(g.x / U), oy = Math.round(g.y / U);
    for (let i = 0; i < n; i++) {
      const k = i - (n - 1) / 2, cx = ox + Math.round(k * step) * across[0], cy = oy + Math.round(k * step) * across[1];
      for (const [mx, my] of mask) { // rotate the +x (or +x+y) mask to the heading by quarter turns
        const r = diag ? (sx > 0 ? (sy > 0 ? 0 : 3) : (sy > 0 ? 1 : 2)) : (sx > 0 ? 0 : sx < 0 ? 2 : sy > 0 ? 1 : 3);
        const [rx, ry] = r === 0 ? [mx, my] : r === 1 ? [-my, mx] : r === 2 ? [-mx, -my] : [my, -mx];
        B.put(cx + rx, cy + ry, K.lane);
      }
    }
  }

  // Deck column (Edit 43): concrete, lit on the left, from its footprint up to the deck's underside.
  // P5.2 (Edit 50.2): a round column. A cylinder of the footprint's width, lit from the left (the sun), shaded to the right,
  // standing on an elliptical base; a pier cap two pixels proud at the top meets the deck.
  function column(wpx, hpx, lift) {
    const S = spr(wpx + 2, hpx + lift, 1, lift), cx = wpx / 2, rx = wpx / 2, cy = hpx / 2, ry = Math.max(2, Math.round(hpx / 3));
    const shade = (u) => (u < -0.75 ? K.columnD : u < -0.35 ? K.jerseyTop : u < 0.35 ? K.column : u < 0.8 ? K.columnD : K.bldgOutline);
    for (let y = -lift; y < hpx; y++) for (let x = -1; x <= wpx; x++) {
      const u = (x + 0.5 - cx) / rx, cap = y < -lift + 3;
      if (Math.abs(u) > (cap ? 1 + 1.6 / rx : 1)) continue;
      if (y > cy) { const e = (y + 0.5 - cy) / ry; if (u * u + e * e > 1) continue; } // the rounded base
      sput(S, x + 1, y + lift, cap ? (y === -lift + 2 ? K.bldgOutline : u < 0 ? K.jerseyTop : K.columnD) : y > cy - 1 && u * u + ((y + 0.5 - cy) / ry) ** 2 > 0.7 ? K.columnD : shade(u));
    }
    return S;
  }
  root.PIX = {
    AW, AH, U, SUN, PAL, K, NAME, c32, mixHex, Buf, line, polyline, dash, circle, disc, ellipse, fillPoly, inPoly, stamp, collectLine,
    text, textWidth, FONT_H, smallText, smallWidth, SMALL_H, blit, car, dummy, doll, DOLL_W, DOLL_H, MODULES, CONE, DRONE, pod, barrier, building, jersey, ground, pathGeom, rng, HEADINGS,
    monument, fountain, deck, wall, booth, stairs, column, skybridge, mixK, LAMP_H, roadField, giveWayMark, tree, hedge, blob, KX, // P5.2: park art for the cityscape mock-up
  };
})(typeof window !== 'undefined' ? window : globalThis);
