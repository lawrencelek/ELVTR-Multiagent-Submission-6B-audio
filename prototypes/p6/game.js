/* DUMMIES P6 (GDD Edit 62) — renderer, input, menus, audio, tuning. P6: three districts on the WORLD6 world (world6.js) when it is loaded.
   DUMMIES P3 — renderer, input, menus, audio, tuning. Reads window.DUMMIES (sim.js), window.PIX (pixel.js) and window.DUMMIES_CONTENT (content.js).
   Screen: 640 × 360 art pixels, integer-scaled. Field: 400 × 300 art pixels at (120, 30). HUD and screens: 1280 × 720 reference units. */
(function () {
  'use strict';
  const { Sim, NODES, NODES4, NODES7: NODES7_4, TRACKS: TRACKS_4, NODES9, TRACKS9, NODES10, TRACKS10, NODES10D, TRACKS10D, LEVELS, DIFFICULTIES, REG, PROTO, OVERRIDES, DEG, pathAt, DISTRICTS, zHeight } = window.DUMMIES;
  const W6 = window.WORLD6 || null; // P6 (Edit 62): Parkland, Waterfront, Monument, built by world6.js
  const LEVEL_LIST = W6 ? W6.LEVEL_LIST : window.DUMMIES.LEVEL_LIST;
  const INFO = (id) => (W6 && W6.INFO(id)) || window.DUMMIES.INFO(id);
  const PIX = window.PIX;
  const STORY = window.STORY || null; // Edit 81 (P7): Story mode (p7/story.js). The title offers ARCADE and STORY

  // Palette roles (Design §4.2 / D10.2, Trial)
  const C = {
    floor: '#EDF1F3', grid: '#D4DDE2', structure: '#B8C4CB', fleet: '#7E8C96', dummy: '#F5C542',
    joints: '#1A1D1F', primary: '#101417', secondary: '#4A5A66', warning: '#E4442E', aqua: '#4FC3E8',
    road: '#DCE3E7', shoulder: '#E5EAED', glass: 'rgba(255,255,255,0.86)', aquaDeep: '#1E8FB8', ink2: '#3C4A54',
  };
  const F_UI = '"B612", "Segoe UI", system-ui, sans-serif';
  const F_MONO = '"B612 Mono", ui-monospace, Menlo, monospace';
  const F_BRAND = '"Nunito", "Segoe UI", system-ui, sans-serif';
  // Reference canvas 1280 × 720 for the frame and HUD; RA reference units per art px. Edit 42 (D27): the 640 × 360 screen
  // holds a 400 × 320 field (25 × 20 tiles, 5:4) at (120, 20). Top and bottom strips are 20 art px.
  const VW = 1280, VH = 720, RA = VW / 640;
  const FX = 120 * RA, FY = 20 * RA, FW = PIX.AW * RA, FH = PIX.AH * RA;
  const TOPY = 31; // top-bar baseline: inside the strip above the field

  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  // Edit 76: the canvas fills the stage; the 640 × 360 screen scales to fit it, by any factor (no longer whole numbers), centred.
  // The margins beside or above it take the frame's ground; on a phone the touch controls may reach into them.
  const SW = 640, SH = 360;
  let scale = 1, kpx = 2, ox = 0, oy = 0;
  const TOUCH = { on: false, move: { x: 0, y: 0, m: 0 }, ptr: new Map(), base: null, knob: null, L: null, down: {}, portrait: false, dirs: {} }; // touch state (below)
  function resize() {
    const st = cv.parentElement, dpr = window.devicePixelRatio || 1, w = Math.max(1, Math.round(st.clientWidth * dpr)), h = Math.max(1, Math.round(st.clientHeight * dpr));
    if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
    cv.style.width = st.clientWidth + 'px'; cv.style.height = st.clientHeight + 'px';
    scale = Math.min(w / VW, h / VH); ox = Math.round((w - VW * scale) / 2); oy = Math.round((h - VH * scale) / 2);
    kpx = scale * VW / SW; // device px per art px
    TOUCH.L = null;
  }
  window.addEventListener('resize', resize);
  if (window.ResizeObserver) new ResizeObserver(resize).observe(cv.parentElement);
  resize();

  // ---------- app state
  const app = {
    screen: 'title', level: 0, difficulty: 1, sim: null, paused: false, pauseSel: 0, confirmRefuse: false,
    shopCol: 0, shopRow: 0, endSel: 0, tune: {}, lastEv: 0, toast: null, realT: 0, sound: true, tuned: false,
    device: 'keys', padCmd: null, layoutY: null, showJumpable: false, // Edit 75: the device last used; pad setup; touch zones; the jumpable outline
    mode: 'arcade', titleSel: 0, story: null, mapSel: null, // Edit 81: the game mode; the title's row; story progress; the story map's cursor
    slot: 0, saveSel: 0, slotAct: 0, saveMode: null, saveConfirm: null, nameEntry: null, // Edit 88: the slot in play; the save screen's row, action, mode, confirm; the name entry
  };
  // Edit 89 (P7.8): every menu answers a tap (touch) or a click (mouse). Each frame, the screens drawn list their targets here,
  // in reference units; a tap runs the topmost one under the finger. In play the list is empty: the field takes no taps
  const HITS = [];
  function hitbox(x, y, w, h, tag, fn) { HITS.push({ x, y, w, h, tag, fn }); }
  function uiTap(rx, ry) { for (let i = HITS.length - 1; i >= 0; i--) { const q2 = HITS[i]; if (rx >= q2.x && rx <= q2.x + q2.w && ry >= q2.y && ry <= q2.y + q2.h) { q2.fn(); return true; } } return false; }
  // Edit 88 (P7.7): three save slots (story.saveSlots), each a name (story.saveNameMax characters), a time stamp and the story's
  // progress (district, tile in test, cleared tiles, credits, points, levels, chassis). Saved in this browser after every count,
  // clear, gift and purchase, as before (Edit 81), into the slot in play. 7.1–7.6 kept one story under SAVE_KEY: it moves into
  // slot 1 once, and stays for those builds. Without storage, a slot lasts the visit.
  const SAVE_KEY = 'dummies.p7.story', SLOT_KEY = 'dummies.p7.save', MOVED_KEY = 'dummies.p7.saveMoved', memSlots = {};
  const okProgress = (v) => !!(v && v.v === 1 && STORY && STORY.districtOf(v.district));
  const slotCount = () => Math.max(1, Math.min(4, Math.round(pv('story.saveSlots') || 3)));
  const nameMax = () => Math.max(4, Math.round(pv('story.saveNameMax') || 12));
  const defaultName = (n) => ('TEST DUMMY ' + n).slice(0, nameMax());
  function readSlot(n) { let v = memSlots[n] || null; try { const raw = localStorage.getItem(SLOT_KEY + n); if (raw != null) v = JSON.parse(raw); } catch (e) { /* storage off */ } return v && v.v === 1 && okProgress(v.progress) && typeof v.name === 'string' ? v : null; }
  let slotCache = null;
  function writeSlot(n, v) { slotCache = null; memSlots[n] = v; try { localStorage.setItem(SLOT_KEY + n, JSON.stringify(v)); } catch (e) { /* storage off: the slot lasts this visit */ } }
  function eraseSlot(n) { slotCache = null; delete memSlots[n]; try { localStorage.removeItem(SLOT_KEY + n); } catch (e) { /* storage off */ } }
  function allSlots() { if (STORY && !moved) moveOldStory(); if (slotCache && slotCache.length === slotCount()) return slotCache; const out = []; for (let n = 1; n <= slotCount(); n++) out.push(readSlot(n)); return (slotCache = out); }
  function saveStory() { if (!app.story || !app.slot) return; const cur = readSlot(app.slot); writeSlot(app.slot, { v: 1, name: cur ? cur.name : defaultName(app.slot), saved: Date.now(), progress: app.story }); }
  function loadSlot(n) { const v = readSlot(n); if (!v) return false; app.slot = n; app.story = v.progress; app.mode = 'story'; return true; }
  let moved = false;
  function moveOldStory() { // the one story of 7.1–7.6, into slot 1, once
    moved = true; try { if (!localStorage.getItem(MOVED_KEY)) { const old = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (okProgress(old) && !readSlot(1)) writeSlot(1, { v: 1, name: defaultName(1), saved: Date.now(), progress: old, moved: true }); localStorage.setItem(MOVED_KEY, '1'); } } catch (e) { /* storage off */ }
  }
  const MON = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  function stamp(ms) { const d = new Date(ms), p2 = (x) => String(x).padStart(2, '0'); return p2(d.getDate()) + ' ' + MON[d.getMonth()] + ' ' + d.getFullYear() + ' · ' + p2(d.getHours()) + ':' + p2(d.getMinutes()); } // the browser's local time
  const FIELD = {};
  const previews = W6 ? [] : LEVEL_LIST.map((id) => new Sim(id, Object.assign({ 'run.appearances.road': 0 }, FIELD)));
  function preview(i) { // P6: the district's start screen, art only, built on first sight
    if (!W6) return previews[i];
    if (!previews[i]) { const D = W6.DISTRICTS[i], t = D.start[0]; previews[i] = { preview6: true, sc: W6.buildScreen(D, 'ABC'.indexOf(t[0]), +t[1] - 1) }; }
    return previews[i];
  }
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  // ---------- generated content (content/pipeline.py -> content.js). Missing parts fall back to the P1.9 literals.
  const CT = window.DUMMIES_CONTENT || {};
  const CJ = CT.juice || null, CI = CT.interface || null, CG = CT.graphics || null;
  const CB = CT.barks || null, CH = CT.hits || null, CTM = CT.terminal || null; // P2.1: humour, hit juice, FARSIGHT terminal skin
  const CP = CT.places || null, CD = CT.drops || null; // Submission 4 (P3.3): district and level copy; drop juice
  // Edit 95 (P8): the lore layer. Prototype 8 bundles window.DUMMIES_LORE (prototypes/p8/lore.js): Dummy Corporation's notices, by id,
  // for every interface text that named Farsight; and window.DUMMIES_CREDITS, the one place Farsight is named. Without them (P7.x), every
  // text is the fallback given here, as before.
  const LORE = window.DUMMIES_LORE || null, CREDITS = window.DUMMIES_CREDITS || null;
  const LT = (id, fallback, vars) => fillIn(LORE && LORE.notices && LORE.notices[id] != null ? LORE.notices[id] : fallback, vars);
  const SIM8 = window.DUMMIES_SIM || null, HS = SIM8 && SIM8['highscore.tableSize'] ? SIM8['highscore.tableSize'] : 0; // Edit 97 (P8.2): Prototype 8.2's values; the high scores
  const INTRO = !!(SIM8 && SIM8['ui.introScreen']), CARD = !!(SIM8 && SIM8['ui.levelCard']), SPLASH = !!(SIM8 && SIM8['ui.storySplash']); // Edit 98 (P8.3)
  if (INTRO) { app.screen = 'intro'; app.introT0 = 0; }
  // Fleet database (content/db/fleet.json, decision 117): model names, tags and the bark bank, separate from other text.
  const FLEET = window.FLEET_DB || null;
  const FMODEL = new Map(); // sim model id → database model
  if (FLEET) for (const m of FLEET.models) for (const sid of m.simIds) FMODEL.set(sid, m);
  const CPARAM = {};
  for (const part of [CJ, CI, CG, CB, CH, CTM, CP, CD]) if (part && part.params) for (const p of part.params) CPARAM[p.id] = p.value;
  const BUILD = LORE && LORE.build ? LORE.build : STORY ? 'P7.13' : W6 ? 'P6.10' : 'P5.3'; // Prototype 7.13 (GDD Edit 94: the finale, built by the coding agent (coder/, Assignment #5) and reviewed: the circus's monument shrouded until B2 clears, the cloth lifted, the plaque with the run, a drone to the ship at B3); 7.12 (GDD Edit 93: introduce, then test: each Story part arrives on the tile whose brief first needs it; B1 a dash, C1 a drop; the briefs and parts paced later); 7.11 (GDD Edit 92: Narrative A, Certified: tile names, tales, act lines, the ending; the story's tile art, cosmetic only); 7.10 (GDD Edit 91: every Story part by drone on its tile, Arcade parts for credits; Battery 1 the dash; a miss holds the chassis at 1; on foot, a lighter chassis; points small, top right; damage in red on the chassis, its numbers beside each part; the circus's monument); 7.9 (GDD Edit 90: the dash's jump paid by the dash; X taps a cone down; buttons named only when fitted, OK and BACK in menus); 7.8 (GDD Edit 89: touch on every menu; Story levels from points and upgrades, not credits; the workshop, around the chassis); 7.7 (GDD Edit 88: three named save slots with time stamps; the save screen; the name entry); 7.6 (GDD Edit 87: the HUD on one top edge, the objective on top, a stats box; touch controls placed and sized by the player); 7.5 (GDD Edit 86: a clean screen: options in the pause menu, controls per device, a compact BODY panel); 7.4 (GDD Edit 85: Story traffic per tile; every highway a flight and a drop gap; cones in view); 7.3 (GDD Edit 84: verbs issued by drone, the gift screen, Arcade's verbs); 7.2 (GDD Edit 83: the ricochet tamed, the drone ferry, the map, bubbles, the objective line); 7.1 (GDD Edit 82: a credit a body, story prices 3–5, write-offs per tile); 7 (Edit 81: ARCADE and STORY) // Prototype 6.10 (GDD Edit 80: Hands carry cones, two levels; Arms push off cars, the ricochet); 6.9 (GDD Edit 79: three tracks of three levels, hold X to throw, the hitch, combo variety and air time); 6.8 (GDD Edit 78: four levels with linear steps, cone stacks, Newtonian bounce); 6.7 (GDD Edit 77: ability tracks by level, wear shields, run to clear); 6.6 (GDD Edit 76: fit to screen, glass touch controls on phones and tablets, the Link's Awakening jump, the stair fix); 6.5 (GDD Edit 75: DIRECT turning, four buttons, jump, combo, ricochet, touch, any gamepad); 6.4 (GDD Edit 72: ring capacity, steady signals); 6.3 (Edit 71: driving); 6.2 (Edit 70); 6.1 (Edit 69) was the P6 release with Edits 63–68 and the release tests
  function pv(id) {
    if (id == null) return null;
    if (app.tune[id] != null) return app.tune[id];
    if (CPARAM[id] != null) return CPARAM[id];
    if (app.sim && app.sim.P[id] != null) return app.sim.P[id];
    return OVERRIDES[id] != null ? OVERRIDES[id] : REG[id] != null ? REG[id] : PROTO[id] != null ? PROTO[id] : null;
  }
  function jv(v, k) { // a parameter ID, or [minId, maxId] interpolated by k
    if (Array.isArray(v)) { const a = pv(v[0]), b = pv(v[1]); return a == null || b == null ? 0 : a + (b - a) * (k || 0); }
    const x = pv(v); return x == null ? 0 : x;
  }
  function fillIn(str, vars) { return String(str).replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m)); }
  function place(path) { const v = path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), CP); return typeof v === 'string' ? v : null; } // generated places.json
  function copy(path, fallback, vars) {
    const v = path.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), CI && CI.copy);
    return fillIn(typeof v === 'string' ? v : fallback, vars);
  }
  const RM = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const MOTION = RM ? (CJ && CJ.reducedMotion ? jv(CJ.reducedMotion) : 0.25) : 1;
  // Juice: camera shake, body flinch, field flash, write-off stamp, particles, car hit pulse, horn timers.
  const fx = { shake: { amp: 0, t0: -9, dur: 0.3 }, flinchT0: -9, flash: { t0: -9, dur: 0.18 }, stampT0: -9, parts: [], carPulse: new Map(), horn: new Map(), smokeT: 0,
    marks: [], dropT0: -9, barks: new Map(), barkT: -9, barked: new Set(),
    // P2.1
    zoom: { amt: 0, t0: -9, dur: 0.2, x: 0, y: 0 }, crumple: { amt: 0, t0: -9, dur: 0.3, ang: 0 }, stumble: { amp: 0, t0: -9, dur: 0.5 },
    rings: [], streaks: [], bubbles: new Map(), carBarkT: new Map(), cars: new Map(), nm: new Map(), nmDone: new Set(),
    lungeWatch: null, lastImpact: null, pendingNodes: [], upgradeWatch: null, barkN: 0, juiceT: new Map(),
    partWatch: null, partsSeen: new Set(), learnWatch: new Map(), pendingLearned: null };
  function kick(amp, dur) { const cur = fx.shake.amp * Math.max(0, 1 - (app.realT - fx.shake.t0) / fx.shake.dur); if (amp >= cur) fx.shake = { amp, t0: app.realT, dur }; }
  function shakeOffset() {
    const a = app.realT - fx.shake.t0;
    if (a >= fx.shake.dur) return { x: 0, y: 0 };
    const k = fx.shake.amp * Math.pow(1 - a / fx.shake.dur, 2) * MOTION;
    return { x: Math.sin(app.realT * 91) * k, y: Math.cos(app.realT * 77) * k };
  }
  function puff(x, y, n, opt) {
    for (let i = 0; i < n; i++) {
      const a = (opt.dir != null ? opt.dir + (Math.random() - 0.5) * (opt.spread || 1.2) : Math.random() * TAU), sp = (opt.speed || 40) * (0.5 + Math.random());
      fx.parts.push({ type: opt.type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, t0: app.realT, life: (opt.life || 0.5) * (0.7 + Math.random() * 0.6), size: opt.size || 3, role: opt.role, spin: Math.random() * TAU });
    }
  }
  function mix(c1, c2, k) {
    const h = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
    const a = h(c1), b = h(c2);
    return 'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * k)).join(',') + ')';
  }

  // Campaign: L1 → L2 → L3. Owned nodes, credits, points and time carry between roads.
  function startLevel(i, carry) { // P6: the district takes a moment to build; the loading panel shows first
    if (W6) { app.screen = 'loading'; app.loading = { i, carry: carry || null, frames: 0, name: INFO(LEVEL_LIST[i]).name }; app.sim = null; app.paused = false; clearEdges(); return; }
    startLevelNow(i, carry);
  }
  function startLevelNow(i, carry) {
    if (!carry) app.roads = [];
    app.level = i; app.roadCarry = carry || null;
    // Edit 41: each run plays one of the three baked layouts per district, at random (tuning: proto.layout fixes one)
    const nL = ((window.DISTRICT_DB || {}).districts || {})[LEVEL_LIST[i]], nLay = nL && nL.length ? nL.length : 1;
    const layout = app.tune['proto.layout'] != null ? app.tune['proto.layout'] : 1 + Math.floor(Math.random() * nLay);
    app.sim = W6 && app.mode === 'story' && STORY ? new STORY.StorySim(LEVEL_LIST[i], Object.assign({ 'proto.difficulty': app.difficulty }, app.tune, FIELD), app.story) // Edit 81: the district's tile in test
      : W6 && STORY ? new STORY.ArcadeSim(LEVEL_LIST[i], Object.assign({ 'proto.difficulty': app.difficulty }, app.tune, FIELD), carry) // Edit 81: Arcade plays one district a run; Edit 84: its verbs come by drone
      : W6 ? new W6.Sim6(LEVEL_LIST[i], Object.assign({ 'proto.difficulty': app.difficulty }, app.tune, FIELD), carry)
      : new Sim(LEVEL_LIST[i], Object.assign({ 'proto.difficulty': app.difficulty, 'proto.layout': layout }, app.tune, FIELD), carry);
    app.tuned = Object.keys(app.tune).length > 0;
    app.screen = 'game'; app.paused = false; app.lastEv = 0; app.shopCol = 0; app.shopRow = 0; app.endSel = 0;
    app.confirmRefuse = false; clearEdges();
    fx.marks = []; fx.fit = null; fx.unveil = null; fx.barks.clear(); fx.barked.clear(); fx.partWatch = null; fx.partsSeen.clear(); fx.learnWatch.clear(); fx.pendingLearned = null;
    fx.rings = []; fx.streaks = []; fx.bubbles.clear(); fx.carBarkT.clear(); fx.cars.clear(); fx.nm.clear(); fx.nmDone.clear();
    fx.lungeWatch = null; fx.lastImpact = null; fx.upgradeWatch = null; if (!carry) fx.pendingNodes = [];
    app.present = [];
    // D24: build every screen of the district now (a short pause at the start, none at the edges)
    const D = app.sim.district;
    if (D && !W6) {
      const all = [];
      for (let y = 0; y < D.rows; y++) for (let x = 0; x < D.cols; x++) all.push([x, y, window.DUMMIES.cellLevel(D, [x, y], app.sim.P)]);
      for (const [x, y, lv] of all) { lv.blockedEdges = window.DUMMIES.edgeSpans(D, [x, y], app.sim.P); levelArt({ level: lv, P: app.sim.P }); }
    }
    fx.seenScreens = new Set(D ? [app.sim.screenName()] : []);
  }

  function startStory() { app.mode = 'story'; if (!app.story) app.story = STORY.newProgress(); saveStory(); startLevel(LEVEL_LIST.indexOf(app.story.district)); } // Edit 81
  function toStoryMap() { saveStory(); app.screen = 'storymap'; app.sim = null; app.paused = false; app.mapSel = null; clearEdges(); }
  function toStoryStart() { if (!SPLASH) return toStoryMap(); saveStory(); app.screen = 'splash'; app.splashT0 = app.realT; app.sim = null; app.paused = false; clearEdges(); } // Edit 98 (P8.3): the parts fly, then the map
  function titleItems() { return STORY ? (INTRO ? ['STORY', 'ARCADE'] : ['ARCADE', 'STORY']).concat(HS ? ['HIGH SCORES'] : [], CREDITS ? ['CREDITS'] : []) : []; } // Edit 98 (P8.3): STORY first // Edit 88: a new story starts from the save screen. Edit 95 (P8): the Credits
  // Edit 88: the save screen. NEW GAME, then the slots. A slot: CONTINUE, RENAME, ERASE (A twice). NEW GAME takes the first empty
  // slot; with none empty, the player picks one to overwrite (A twice). A new game and RENAME open the name entry
  function toSaves() {
    app.mode = 'story'; app.screen = 'saves'; app.sim = null; app.paused = false; app.saveMode = null; app.saveConfirm = null; app.slotAct = 0; app.nameEntry = null; clearEdges();
    const S = allSlots(); let best = 0, t = -1; S.forEach((v, i) => { if (v && v.saved > t) { t = v.saved; best = i + 1; } }); app.saveSel = app.slot && S[app.slot - 1] ? app.slot : best;
  }
  const slotActs = (n) => (app.saveMode === 'overwrite' ? ['OVERWRITE'] : allSlots()[n - 1] ? ['CONTINUE', 'RENAME', 'ERASE'] : ['NEW GAME']);
  // the name entry: a Zelda-style grid for the stick, the pad and touch; a keyboard types directly
  const NAME_ROWS = ['ABCDEFGHIJKLM', 'NOPQRSTUVWXYZ', "0123456789-.'"], NAME_KEYS = ['SPACE', 'DEL', 'OK'], NAME_COLS = 13;
  const nameKeyOf = (c) => (c < 4 ? 0 : c < 9 ? 1 : 2); // the bottom row's three wide keys, by column
  // touch: a tap on the name opens the phone's own keyboard through this hidden field
  const nameInput = document.createElement('input');
  Object.assign(nameInput, { id: 'name-input', type: 'text', autocomplete: 'off', spellcheck: false }); nameInput.setAttribute('autocapitalize', 'characters'); nameInput.setAttribute('enterkeyhint', 'done'); nameInput.setAttribute('aria-label', 'Save slot name');
  nameInput.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;opacity:0;border:0;padding:0;font-size:16px;';
  document.body.appendChild(nameInput);
  const cleanName = (t) => t.toUpperCase().replace(/[^A-Z0-9 .'-]/g, '').slice(0, nameMax());
  nameInput.addEventListener('input', () => { const ne = app.nameEntry; if (!ne) return; ne.text = cleanName(nameInput.value); ne.fresh = false; if (nameInput.value !== ne.text) nameInput.value = ne.text; });
  nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); nameDone(); } else if (e.key === 'Escape') { e.preventDefault(); nameCancel(); } });
  function nameStart(slot, kind) { const cur = readSlot(slot); app.nameEntry = { slot, kind, text: kind === 'rename' && cur ? cur.name : defaultName(slot), fresh: true, r: 3, c: 10 }; nameInput.value = ''; }
  function nameCancel() { app.nameEntry = null; nameInput.blur(); }
  function nameFocus() { try { nameInput.focus({ preventScroll: true }); } catch (e) { /* not offered */ } }
  cv.addEventListener('pointerup', () => { if (app.focusName && app.nameEntry) nameFocus(); app.focusName = false; }); // some phones open the keyboard only on the finger's lift
  function nameType(ch) { const ne = app.nameEntry; if (!ne) return; if (ne.fresh) { ne.text = ''; ne.fresh = false; } if (ne.text.length < nameMax()) ne.text += ch; nameInput.value = ne.text; }
  function nameDel() { const ne = app.nameEntry; if (!ne) return; if (ne.fresh) { ne.text = ''; ne.fresh = false; } else ne.text = ne.text.slice(0, -1); nameInput.value = ne.text; }
  function nameDone() {
    const ne = app.nameEntry; if (!ne) return;
    if (ne.kind === 'score') { const nm = cleanName(ne.text).trim() || HS_DEFAULT; app.nameEntry = null; nameInput.blur(); hsRename(app.hsLast, nm); hsSetName(nm); toast('Saved: ' + nm); return; } // Edit 97 (P8.2)
    const name = cleanName(ne.text).trim() || defaultName(ne.slot); app.nameEntry = null; nameInput.blur();
    if (ne.kind === 'rename') { const cur = readSlot(ne.slot); if (cur) { cur.name = name; writeSlot(ne.slot, cur); } toast('Renamed: ' + name); return; } // a rename keeps the time stamp
    app.slot = ne.slot; app.story = STORY.newProgress(); app.mode = 'story';
    writeSlot(ne.slot, { v: 1, name, saved: Date.now(), progress: app.story }); toStoryStart();
  }
  function nameOk() { const ne = app.nameEntry; if (!ne) return; if (ne.r < 3) nameType(NAME_ROWS[ne.r][ne.c]); else { const k = NAME_KEYS[nameKeyOf(ne.c)]; if (k === 'SPACE') nameType(' '); else if (k === 'DEL') nameDel(); else nameDone(); } }
  function nameMenu(m) { // stick, pad or arrows: the grid; A presses; B deletes (on an empty name, cancels); START finishes
    const ne = app.nameEntry;
    if (m === 'left' || m === 'right') { if (ne.r < 3) ne.c = (ne.c + (m === 'right' ? 1 : NAME_COLS - 1)) % NAME_COLS; else { const k = (nameKeyOf(ne.c) + (m === 'right' ? 1 : 2)) % 3; ne.c = [1, 6, 10][k]; } }
    else if (m === 'up') ne.r = (ne.r + 3) % 4;
    else if (m === 'down') ne.r = (ne.r + 1) % 4;
    else if (m === 'ok') nameOk();
    else if (m === 'back') { if (ne.text.length && !ne.fresh) nameDel(); else nameCancel(); }
    else if (m === 'pause') nameDone();
  }
  function savesMenu(m) {
    const n = slotCount(), S = allSlots(), sel = app.saveSel, acts = sel ? slotActs(sel) : [];
    if (m === 'back' || m === 'pause') { if (app.saveConfirm) app.saveConfirm = null; else if (app.saveMode) app.saveMode = null; else app.screen = 'title'; return; }
    if (m === 'up' || m === 'down') { app.saveSel = (sel + (m === 'down' ? 1 : n)) % (n + 1); if (app.saveMode === 'overwrite' && app.saveSel === 0) app.saveSel = m === 'down' ? 1 : n; app.slotAct = 0; app.saveConfirm = null; return; }
    if (m === 'left' || m === 'right') { if (sel && acts.length > 1) { app.slotAct = (app.slotAct + (m === 'right' ? 1 : acts.length - 1)) % acts.length; app.saveConfirm = null; } return; }
    if (m !== 'ok') return;
    if (!sel) { const free = S.findIndex((v) => !v); if (free >= 0) nameStart(free + 1, 'new'); else { app.saveMode = 'overwrite'; app.saveSel = 1; app.slotAct = 0; toast('All ' + n + ' slots in use: choose one to overwrite'); } return; }
    const act = acts[Math.min(app.slotAct, acts.length - 1)];
    if (act === 'CONTINUE') { if (loadSlot(sel)) toStoryStart(); }
    else if (act === 'NEW GAME') nameStart(sel, 'new');
    else if (act === 'RENAME') nameStart(sel, 'rename');
    else if (act === 'ERASE' || act === 'OVERWRITE') {
      if (app.saveConfirm !== act + sel) { app.saveConfirm = act + sel; return; }
      app.saveConfirm = null;
      if (act === 'ERASE') { const nm = S[sel - 1] && S[sel - 1].name; eraseSlot(sel); if (app.slot === sel) { app.slot = 0; app.story = null; } app.slotAct = 0; toast('Erased: ' + nm); }
      else { app.saveMode = null; nameStart(sel, 'new'); }
    }
  }
  // a keyboard types the name directly: letters, digits, space, - . '; Backspace deletes; Enter finishes; Esc cancels
  window.addEventListener('keydown', (e) => {
    const ne = app.nameEntry; if (!ne || (app.screen !== 'saves' && app.screen !== 'scores') || e.ctrlKey || e.metaKey || e.altKey || e.target === nameInput) return; // the hidden field types for itself
    let used = true;
    if (e.key && e.key.length === 1 && /[A-Za-z0-9 .'\-]/.test(e.key)) nameType(e.key.toUpperCase());
    else if (e.key === 'Backspace') nameDel();
    else if (e.key === 'Enter') nameDone();
    else if (e.key === 'Escape') nameCancel();
    else used = false;
    if (used) { e.preventDefault(); e.stopImmediatePropagation(); app.device = 'keys'; }
  }, true);

  // ---------- input. Edit 75 (P6.5): four buttons, as on a gamepad: A dash, B jump, X grab, Y throw.
  // Keys: Space or K dash (A) · L or Shift jump (B) · J or E grab (X) · I or Q throw (Y): IJKL sits like the pad's diamond.
  // Gamepads: pads.js (every pad; hat d-pads; buttons set up by the player). Touch: an analog stick and the diamond (below).
  const FOUR = !!(W6 && W6.P6SIM && W6.P6SIM['proto.input.fourButtons']);
  const ABIL = !!(W6 && W6.P6SIM && W6.P6SIM['proto.abilities']);
  const ABIL3 = !!(W6 && W6.P6SIM && W6.P6SIM['proto.abilities'] === 2); // Edit 79 (P6.9): Battery, Legs, Arms; three levels; Y has no job
  const ABIL4 = !!(W6 && W6.P6SIM && W6.P6SIM['proto.abilities'] === 3); // Edit 80 (P6.10): Battery, Legs, Hands (two levels), Arms (the push, Y)
  const BM1 = !!(STORY && STORY.P7SIM['proto.batteryModel'] === 1 && TRACKS10D); // Edit 91 (P7.10): Battery 1 the dash, 2 a second charge, 3 a faster recharge
  const TRACKS = ABIL4 ? (BM1 ? TRACKS10D : TRACKS10) : ABIL3 ? TRACKS9 : TRACKS_4, NODES7 = ABIL4 ? (BM1 ? NODES10D : NODES10) : ABIL3 ? NODES9 : NODES7_4; // Edit 77 (P6.7): the shop sells four ability tracks by level. Edit 78 (P6.8): four levels
  const held = new Set();
  const q = { a: 0, b: 0, bUp: 0, x: 0, y: 0 };
  const menuQ = [];
  const MAP = FOUR ? {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
    Space: 'a', KeyK: 'a', Enter: 'ok', KeyL: 'b', ShiftLeft: 'b', ShiftRight: 'b', Backspace: 'b', KeyJ: 'x', KeyE: 'x', KeyI: 'y', KeyQ: 'y',
    Escape: 'pause', KeyP: 'pause', KeyT: 'tune', KeyG: 'padsetup',
  } : {
    ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down', ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right', Space: 'a', KeyJ: 'a', Enter: 'ok', KeyK: 'b', ShiftLeft: 'b',
    ShiftRight: 'b', Escape: 'pause', KeyP: 'pause', KeyT: 'tune',
  };
  function clearEdges() { q.a = q.b = q.bUp = q.x = q.y = 0; menuQ.length = 0; }
  function inUI(e) { return e.target && e.target.closest && e.target.closest('#tune, #trace, button, #name-input'); }
  window.addEventListener('keydown', (e) => {
    const k = MAP[e.code];
    if (!k || inUI(e)) return;
    e.preventDefault();
    Snd.init(); app.device = 'keys';
    if (k === 'tune') { if (!e.repeat) toggleTune(); return; }
    if (k === 'padsetup') { if (!e.repeat) app.padCmd = pad.st && pad.st.setup ? 'cancel' : 'setup'; return; }
    held.add(k);
    if (e.repeat) return;
    if (k === 'a') { q.a++; menuQ.push('ok'); }
    else if (k === 'b') { q.b++; menuQ.push('back'); }
    else if (k === 'x') q.x++;
    else if (k === 'y') q.y++;
    else if (k === 'pause' && pad.st && pad.st.setup) app.padCmd = 'cancel';
    else menuQ.push(k);
  });
  window.addEventListener('keyup', (e) => {
    const k = MAP[e.code];
    if (!k) return;
    held.delete(k);
    if (k === 'b') q.bUp++;
  });
  window.addEventListener('blur', () => { held.clear(); if (app.screen === 'game' && app.sim && !app.sim.run.ending) app.paused = true; });
  cv.addEventListener('pointerdown', (e) => { cv.focus(); Snd.init();
    if (e.pointerType === 'mouse') { const r = cv.getBoundingClientRect(), k = (window.devicePixelRatio || 1) / scale; uiTap((e.clientX - r.left) * k - ox / scale, (e.clientY - r.top) * k - oy / scale); } // Edit 89: a click on any menu
  });

  // Gamepads (Edit 75: pads.js, shared with the controls prototype). Every connected pad is read; the last one used drives.
  // Standard mapping: stick or d-pad moves; A (or RT) dash, B jump, X grab, Y throw; START pauses; hold START (or G) to set up.
  const radial = (x, y, dz, outer) => { const m = Math.hypot(x, y); if (m < dz) return { x: 0, y: 0, m: 0 }; const k = clamp((m - dz) / Math.max(1e-6, outer - dz), 0, 1); return { x: x / m * k, y: y / m * k, m: k }; };
  const PADCFG = ABIL4 ? { actions: ['a', 'b', 'x', 'y'], std: { a: [0, 7], b: [1], x: [2], y: [3] }, other: { a: [0], b: [1], x: [2], y: [3] }, store: 'p610' } : ABIL3 ? { actions: ['a', 'b', 'x'], std: { a: [0, 7], b: [1], x: [2] }, other: { a: [0], b: [1], x: [2] }, store: 'p69' } : FOUR
    ? { actions: ['a', 'b', 'x', 'y'], std: { a: [0, 7], b: [1], x: [2], y: [3] }, other: { a: [0], b: [1], x: [2], y: [3] }, store: 'p6' }
    : { actions: ['a', 'b'], std: { a: [0], b: [1] }, other: { a: [0], b: [1] }, store: 'p6' };
  Object.assign(PADCFG, { dead: pv('proto.input.deadzone'), outer: pv('proto.input.stickOuter'), aimDead: 2, holdSetup: pv('proto.input.padSetupHoldSeconds'), stick: radial });
  const pad = { st: window.PADS ? window.PADS.create() : null, mx: 0, my: 0, bHeld: false, xHeld: false, prevB: false, info: null, dirs: {}, blocked: false };
  const PAD_NAME = { a: 'DASH (A)', b: 'JUMP (B)', x: ABIL3 ? 'GRAB / THROW (X)' : 'GRAB (X)', y: ABIL4 ? 'PUSH (Y)' : 'THROW (Y)' };
  function pollPad(dt) {
    pad.mx = pad.my = 0; pad.bHeld = false; pad.xHeld = false;
    if (!pad.st) return;
    let list = null;
    try { list = navigator.getGamepads ? navigator.getGamepads() : null; pad.blocked = false; }
    catch (e) { pad.blocked = true; } // a hosting page can forbid the gamepad feature; keys and touch still work
    if (app.padCmd === 'setup') { window.PADS.startSetup(pad.st, PADCFG); toast('Pad setup: press the button for ' + PAD_NAME[PADCFG.actions[0]]); }
    else if (app.padCmd === 'cancel') pad.st.setup = null;
    app.padCmd = null;
    const was = pad.st.setup, o = window.PADS.read(pad.st, list, PADCFG, dt || 1 / 60); pad.info = o;
    if (o.setup && o.setup !== was) toast('Pad setup: press the button for ' + PAD_NAME[o.setup]);
    if (was && !o.setup) toast('Pad buttons saved for this browser');
    if (!o.id || o.setup) { pad.dirs = {}; pad.prevB = false; return; }
    if (o.move) { pad.mx = o.move.x; pad.my = o.move.y; app.device = 'pad'; }
    pad.bHeld = !!o.held.b; pad.xHeld = !!o.held.x;
    if (o.a) { q.a++; menuQ.push('ok'); Snd.init(); app.device = 'pad'; }
    if (o.b) { q.b++; menuQ.push('back'); app.device = 'pad'; }
    if (!pad.bHeld && pad.prevB) q.bUp++;
    pad.prevB = pad.bHeld;
    if (FOUR && o.x) { q.x++; app.device = 'pad'; }
    if (FOUR && o.y) { q.y++; app.device = 'pad'; }
    if (o.start) menuQ.push('pause'); // a short press; holding START opens setup
    const now = { up: pad.my < -0.6, down: pad.my > 0.6, left: pad.mx < -0.6, right: pad.mx > 0.6 };
    for (const d of ['up', 'down', 'left', 'right']) if (now[d] && !pad.dirs[d]) menuQ.push(d);
    pad.dirs = now;
  }
  function moveVec() { // keys: 8 directions; pad and touch: analog. Summed, at most 1
    let mx = (held.has('right') ? 1 : 0) - (held.has('left') ? 1 : 0) + pad.mx + TOUCH.move.x;
    let my = (held.has('down') ? 1 : 0) - (held.has('up') ? 1 : 0) + pad.my + TOUCH.move.y;
    const m = Math.hypot(mx, my);
    if (m > 1) { mx /= m; my /= m; }
    return { mx, my };
  }
  function buildCmd() {
    const v = moveVec();
    const cmd = { mx: v.mx, my: v.my, aPress: q.a > 0, bPress: q.b > 0, bRelease: q.bUp > 0, bHeld: held.has('b') || pad.bHeld, xPress: q.x > 0, yPress: q.y > 0, xHeld: held.has('x') || pad.xHeld || !!TOUCH.down.x }; // Edit 79: X held throws
    q.a = q.b = q.bUp = q.x = q.y = 0;
    return cmd;
  }

  // ---------- touch (Edit 75; Edit 76: drawn in the game's own canvas, in the FARSIGHT glass, on phones and tablets only).
  // On where the main pointer is a finger and nothing hovers: (hover: none) and (pointer: coarse); #touch in the address forces it.
  // Landscape only. The analog stick under the district map; Y, X, B, A under the chassis, as on a gamepad. Both may reach into the
  // screen's side margins. Layout in reference units from the canvas corner (the game's units), so the margins count.
  const FACE = [['y', 0, -1, 'Y', ABIL4 ? 'PUSH' : 'THROW'], ['x', -1, 0, 'X', ABIL3 ? 'GRAB' : 'GRAB'], ['b', 1, 0, 'B', 'JUMP'], ['a', 0, 1, 'A', 'DASH']].filter((f) => !(ABIL3 && f[0] === 'y')); // Edit 79: no Y in 6.9
  const FACE_NODE = { a: null, b: 'jump', x: 'carry', y: ABIL4 ? 'push' : 'throw' };
  function touchDevice() { // Edit 89: phones with a stylus (S Pen) report a fine, hovering pointer: the first touch switches touch on too (below)
    try {
      if (/(^#|[#&])touch\b/.test(location.hash) || /[?&]touch\b/.test(location.search)) return true;
      const mm = (qy) => !!(window.matchMedia && window.matchMedia(qy).matches), pts = navigator.maxTouchPoints || 0;
      return mm('(hover: none) and (pointer: coarse)') || mm('(pointer: coarse)') || (pts > 0 && mm('(any-pointer: coarse)')) || (pts > 0 && /Android|iPhone|iPad|iPod|Mobile|SamsungBrowser/i.test(navigator.userAgent || ''));
    } catch (e) { return false; }
  }
  function touchOn() {
    if (TOUCH.on) return;
    TOUCH.on = true; document.body.classList.add('touch');
    const rot = document.createElement('div'); rot.id = 'rotate'; rot.hidden = true;
    rot.innerHTML = '<div><b>Turn your phone sideways</b><br>DUMMIES plays in landscape.<br><small>Tap for full screen, where the phone allows.</small></div>';
    document.body.appendChild(rot); TOUCH.rot = rot; rot.addEventListener('pointerdown', fullscreen);
    for (const t of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel']) cv.addEventListener(t, touchEvent, { passive: false });
    resize();
  }
  function fullscreen() {
    const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) { /* not offered */ } };
    try { const el = document.documentElement; if (document.fullscreenElement) { document.exitFullscreen().catch(() => {}); return; } if (el.requestFullscreen) el.requestFullscreen({ navigationUI: 'hide' }).then(lock, () => {}); else lock(); } catch (e) { /* not offered */ }
  }
  // Edit 87 (P7.6): the player places and sizes the stick and the diamond (Pause › Controls › Adjust layout), saved in this
  // browser as fractions of the screen and a size factor (ui.touch.scaleMin–ui.touch.scaleMax). The default keeps both inside
  // the 16:9 frame, under the side panels; a wide phone's margins are free for the player's own placement.
  const TOUCH_KEY = 'dummies.p7.touch';
  app.touchCfg = (() => { try { return JSON.parse(localStorage.getItem(TOUCH_KEY) || 'null'); } catch (e) { return null; } })();
  function saveTouchCfg() { try { if (app.touchCfg) localStorage.setItem(TOUCH_KEY, JSON.stringify(app.touchCfg)); else localStorage.removeItem(TOUCH_KEY); } catch (e) { /* storage off: this visit only */ } }
  function touchLayout() {
    const dpr = window.devicePixelRatio || 1, css = dpr / scale, Wc = cv.width / scale, Hc = cv.height / scale, gx = ox / scale, gy = oy / scale, m = pv('ui.touch.margin') * css;
    const ly = app.layoutY || { left: 530, right: 450 };
    const zl = { x0: 0, x1: gx + FX, y0: gy + ly.left + 10, y1: Hc }, zr = { x0: gx + FX + FW, x1: Wc, y0: gy + ly.right + 10, y1: Hc };
    const sr0 = Math.max(36, Math.min(pv('ui.touch.stickRadius') * css * 1.15, (zl.x1 - zl.x0) / 2 - m / 2, (zl.y1 - zl.y0) / 2 - m / 2));
    let sr = sr0, home = { x: clamp(gx + FX / 2, zl.x0 + m + sr, zl.x1 - sr - 6), y: zl.y1 - m - sr };
    const gap = 6, fr0 = Math.max(22, Math.min(pv('ui.touch.faceRadius') * css * 1.15, (zr.x1 - zr.x0 - m - 2 * gap) / 4.83, (zr.y1 - zr.y0 - m - 2 * gap) / 4.83));
    let fr = fr0, sp = (2 * fr + gap) / Math.SQRT2; // round glass keys on a diamond: neighbours never touch
    let c = { x: clamp(gx + FX + FW + (VW - FX - FW) / 2, zr.x0 + sp + fr + 6, zr.x1 - m - sp - fr), y: zr.y1 - m - sp - fr };
    let sz = { x0: 0, x1: zl.x1 + sr * 0.5, y0: zl.y0 - sr * 0.5, y1: Hc }; // where a thumb takes the stick
    const cfg = app.touchCfg || {}, kOf = (q) => clamp((q && q.k) || 1, pv('ui.touch.scaleMin'), pv('ui.touch.scaleMax'));
    if (cfg.stick) { sr = sr0 * kOf(cfg.stick); home = { x: clamp(cfg.stick.fx * Wc, sr + 4, Wc - sr - 4), y: clamp(cfg.stick.fy * Hc, sr + 4, Hc - sr - 4) }; sz = { x0: Math.max(0, home.x - 1.7 * sr), x1: Math.min(Wc, home.x + 1.7 * sr), y0: Math.max(0, home.y - 1.7 * sr), y1: Math.min(Hc, home.y + 1.7 * sr) }; }
    if (cfg.face) { fr = fr0 * kOf(cfg.face); sp = (2 * fr + gap) / Math.SQRT2; const e = sp + fr + 4; c = { x: clamp(cfg.face.fx * Wc, e, Wc - e), y: clamp(cfg.face.fy * Hc, e, Hc - e) }; }
    const face = FACE.map(([id, dx, dy, l, w]) => ({ id, x: c.x + dx * sp, y: c.y + dy * sp, r: fr, l, w }));
    const side = gx >= 136, chip = STORY ? { pause: { x: gx + 16, y: gy + 4, w: 76, h: 26 }, full: { x: gx + 98, y: gy + 4, w: 64, h: 26 } } // Edit 87: small, top left, inside the frame
      : side ? { pause: { x: gx - 128, y: gy + 10, w: 120, h: 46 }, full: { x: gx - 128, y: gy + 66, w: 120, h: 46 } }
      : { pause: { x: gx + 12, y: gy + 2, w: 132, h: 40 }, full: null }; // no margin: over the brand; full screen from the upright prompt
    return { zl, zr, sz, sr, sr0, fr, fr0, sp, c, home, face, chip, css, Wc, Hc, gx, gy };
  }
  function touchLayoutCss() { // for the tests: the layout in CSS pixels of the page
    const L = touchLayout(), r = cv.getBoundingClientRect(), k = scale / (window.devicePixelRatio || 1), p = (q) => ({ x: r.left + q.x * k, y: r.top + q.y * k });
    return { sr: L.sr * k, home: p(L.home), face: L.face.map((f) => Object.assign(p(f), { id: f.id, r: f.r * k })), field: { x0: r.left + (ox / scale + FX) * k, x1: r.left + (ox / scale + FX + FW) * k }, chip: L.chip };
  }
  const inChip = (c, x, y, pad) => c && x >= c.x - (pad || 0) && x <= c.x + c.w + (pad || 0) && y >= c.y - (pad || 0) && y <= c.y + c.h + (pad || 0);
  function touchEvent(e) {
    if (!TOUCH.on || e.pointerType === 'mouse') return;
    e.preventDefault(); Snd.init(); app.device = 'touch';
    const r = cv.getBoundingClientRect(), k = (window.devicePixelRatio || 1) / scale, x = (e.clientX - r.left) * k, y = (e.clientY - r.top) * k, id = e.pointerId;
    const L = TOUCH.L || (TOUCH.L = touchLayout());
    if (app.touchEdit) { touchEditEvent(e, x, y, id, L); return; } // Edit 87: placing the controls
    if (e.type === 'pointerdown') {
      if (TOUCH.portrait) return;
      try { cv.setPointerCapture(id); } catch (err) { /* not offered */ }
      if (inChip(L.chip.pause, x, y, STORY ? 8 : 0)) { menuQ.push('pause'); return; } // Edit 87: small chips, a finger's reach
      if (inChip(L.chip.full, x, y, STORY ? 8 : 0)) { fullscreen(); return; }
      const f = L.face.slice().sort((p1, p2) => Math.hypot(x - p1.x, y - p1.y) - Math.hypot(x - p2.x, y - p2.y)).find((q2) => Math.hypot(x - q2.x, y - q2.y) <= q2.r * 1.35); // the nearest key within reach
      if (f) { TOUCH.ptr.set(id, f.id); TOUCH.down[f.id] = true; if (f.id === 'a') { q.a++; menuQ.push('ok'); } else if (f.id === 'b') { q.b++; menuQ.push('back'); } else q[f.id]++; return; }
      if (uiTap(x - L.gx, y - L.gy)) return; // Edit 89: a menu's row, card, key or button
      if (x >= L.sz.x0 && x <= L.sz.x1 && y >= L.sz.y0 && y <= L.sz.y1) { // the stick's zone takes the thumb; the stick floats to it
        TOUCH.ptr.set(id, 'stick');
        TOUCH.base = pv('proto.input.touchFloat') ? { x: clamp(x, L.sz.x0 + L.sr * 0.7, L.sz.x1 - L.sr * 0.3), y: clamp(y, L.sz.y0 + L.sr * 0.5, L.sz.y1 - L.sr * 0.7) } : { x: L.home.x, y: L.home.y };
        stickAt(x, y);
      }
      return;
    }
    const kind = TOUCH.ptr.get(id);
    if (e.type === 'pointermove') { if (kind === 'stick') stickAt(x, y); return; }
    TOUCH.ptr.delete(id);
    if (kind === 'stick') { TOUCH.base = null; TOUCH.knob = null; TOUCH.move = { x: 0, y: 0, m: 0 }; touchDirs(); }
    else if (kind) { TOUCH.down[kind] = false; if (kind === 'b') q.bUp++; }
  }
  // Edit 87: Adjust layout. Drag the stick or the diamond anywhere on the screen; − and + size the one selected; Reset; Done
  function editBar(L) { // the toolbar, centred on the field (touch units)
    const w = 520, h = 150, x = L.gx + FX + FW / 2 - w / 2, y = L.gy + FY + FH / 2 - h / 2, bw = 100, bh = 46, by = y + h - bh - 16, bx = (i) => x + 20 + i * (bw + 26);
    return { x, y, w, h, minus: { x: bx(0), y: by, w: bw, h: bh }, plus: { x: bx(1), y: by, w: bw, h: bh }, reset: { x: bx(2), y: by, w: bw, h: bh }, done: { x: bx(3), y: by, w: bw, h: bh } };
  }
  function touchEditEvent(e, x, y, id, L) {
    const ed = app.touchEdit, cfg = app.touchCfg || (app.touchCfg = {});
    const put = (what, cx, cy) => { const k = (cfg[what] && cfg[what].k) || 1; cfg[what] = { fx: clamp(cx / L.Wc, 0, 1), fy: clamp(cy / L.Hc, 0, 1), k }; TOUCH.L = touchLayout(); };
    if (e.type === 'pointerdown') {
      try { cv.setPointerCapture(id); } catch (err) { /* not offered */ }
      const bar = editBar(L);
      if (inChip(bar.done, x, y)) { touchEditEnd(); return; }
      if (inChip(bar.reset, x, y)) { app.touchCfg = null; saveTouchCfg(); TOUCH.L = touchLayout(); toast('Touch controls reset'); return; }
      if (inChip(bar.minus, x, y) || inChip(bar.plus, x, y)) { touchEditSize(inChip(bar.plus, x, y) ? 1 : -1); return; }
      const ds = Math.hypot(x - L.home.x, y - L.home.y), df = Math.hypot(x - L.c.x, y - L.c.y);
      const what = ds <= L.sr * 1.25 && (ds / L.sr <= df / (L.sp + L.fr)) ? 'stick' : df <= L.sp + L.fr * 1.25 ? 'face' : null;
      if (!what) return;
      ed.sel = what; const at = what === 'stick' ? L.home : L.c; ed.drag = { id, what, dx: at.x - x, dy: at.y - y };
      if (!cfg[what]) put(what, at.x, at.y);
      return;
    }
    const dr = ed.drag; if (!dr || dr.id !== id) return;
    if (e.type === 'pointermove') { put(dr.what, x + dr.dx, y + dr.dy); return; }
    ed.drag = null; saveTouchCfg();
  }
  function touchEditSize(dir) {
    const ed = app.touchEdit, L = TOUCH.L || touchLayout(), cfg = app.touchCfg || (app.touchCfg = {}), what = ed.sel || 'stick';
    const at = what === 'stick' ? L.home : L.c, cur = cfg[what] || { fx: at.x / L.Wc, fy: at.y / L.Hc, k: 1 };
    cur.k = clamp(Math.round(((cur.k || 1) + dir * pv('ui.touch.scaleStep')) * 100) / 100, pv('ui.touch.scaleMin'), pv('ui.touch.scaleMax'));
    cfg[what] = cur; saveTouchCfg(); TOUCH.L = touchLayout();
  }
  function touchEditStart() { app.touchEdit = { sel: 'stick', drag: null }; }
  function touchEditEnd() { saveTouchCfg(); app.touchEdit = null; TOUCH.L = touchLayout(); clearEdges(); }
  function drawTouchEdit(L) { // over the paused game: a veil, the two controls ringed, the toolbar
    const ed = app.touchEdit; if (!ed) return;
    const ring = (x, y, r, on) => { ctx.save(); ctx.setLineDash([8, 6]); ctx.lineWidth = on ? 4 : 2; ctx.strokeStyle = on ? C.dummy : FT.edge; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.restore(); };
    ring(L.home.x, L.home.y, L.sr + 10, ed.sel === 'stick'); ring(L.c.x, L.c.y, L.sp + L.fr + 10, ed.sel === 'face');
    const bar = editBar(L), cfg = app.touchCfg || {}, k = (cfg[ed.sel] && cfg[ed.sel].k) || 1;
    panel(bar.x, bar.y, bar.w, bar.h);
    txt('TOUCH LAYOUT', bar.x + 20, bar.y + 34, fLab, FT.accent);
    txt('Drag the stick or the buttons anywhere. Tap one to size it.', bar.x + 20, bar.y + 62, '400 17px ' + F_UI, FT.text);
    txt((ed.sel === 'stick' ? 'MOVE STICK' : 'Y X B A BUTTONS') + ' · ' + Math.round(k * 100) + '%', bar.x + bar.w - 20, bar.y + 34, '700 16px ' + F_UI, C.dummy, 'right');
    for (const [key, label] of [['minus', '−  SIZE'], ['plus', '+  SIZE'], ['reset', 'RESET'], ['done', 'DONE']]) { const c = bar[key]; glassKey(c.x, c.y, c.w, c.h); txt(label, c.x + c.w / 2, c.y + c.h / 2 + 6, '700 16px ' + F_UI, key === 'done' ? C.dummy : FT.text, 'center'); }
  }
  function stickAt(x, y) { // analog: any angle; speed by deflection. The base follows a thumb that runs past the rim
    const L = TOUCH.L, R = L.sr, b = TOUCH.base;
    let dx = x - b.x, dy = y - b.y; const l = Math.hypot(dx, dy);
    if (l > R) { b.x += dx / l * (l - R); b.y += dy / l * (l - R); dx = x - b.x; dy = y - b.y; }
    TOUCH.knob = { x, y };
    TOUCH.move = radial(dx / R, dy / R, pv('proto.input.touchDeadzone'), pv('proto.input.touchOuter'));
    touchDirs();
  }
  function touchDirs() { // menus: the stick's direction, as edges
    const mv = TOUCH.move, now = { up: mv.y < -0.6, down: mv.y > 0.6, left: mv.x < -0.6, right: mv.x > 0.6 };
    for (const d of ['up', 'down', 'left', 'right']) if (now[d] && !TOUCH.dirs[d]) menuQ.push(d);
    TOUCH.dirs = now;
  }
  // Edit 90 (P7.9): in a menu A reads OK and B BACK, X and Y nothing; in play a button names its verb only once fitted (X: GRAB, or DROP
  // when a cone is held and none is in reach). A button not yet fitted shows its letter alone, dimmed
  function faceWord(f, s) {
    const inPlay = app.screen === 'game' && s && !app.paused && !app.touchEdit && ['play', 'hitstop', 'writeoff', 'scroll'].includes(s.phase);
    const node = FACE_NODE[f.id], unlocked = f.id === 'a' && STORY ? !(s && s.dashFitted) || s.dashFitted() : !node || !!(s && s.has(node)); // Edit 91: A names DASH once Battery 1 is fitted
    if (!STORY) return { word: unlocked ? f.w : 'LOCKED', live: unlocked };
    if (!inPlay) return { word: { a: 'OK', b: 'BACK' }[f.id] || '', live: f.id === 'a' || f.id === 'b' };
    if (!unlocked) return { word: '', live: false };
    if (f.id === 'x') { const b = s.body, room = s.carriedCones().length < s.coneCapacity(), near = b && room && s.nearestCone ? s.nearestCone() : null; return { word: b && b.held && !near ? 'DROP' : 'GRAB', live: true }; }
    return { word: f.w, live: true };
  }
  function drawTouch() { // in canvas reference units (ctx scaled, origin at the canvas corner); the frame theme's glass
    TOUCH.portrait = window.innerHeight > window.innerWidth;
    if (TOUCH.rot) TOUCH.rot.hidden = !TOUCH.portrait;
    if (TOUCH.portrait) { TOUCH.ptr.clear(); TOUCH.move = { x: 0, y: 0, m: 0 }; TOUCH.base = null; return; }
    const L = TOUCH.L = touchLayout(), s = app.sim, R = L.sr, b = (!app.touchEdit && TOUCH.base) || L.home, mv = TOUCH.move;
    if (app.touchEdit) { ctx.fillStyle = 'rgba(5,7,13,0.62)'; ctx.fillRect(0, 0, L.Wc, L.Hc); } // Edit 87: the game dims while the controls are placed
    const glow = (fn) => { if (FT.neon) { ctx.save(); ctx.shadowColor = FT.edge; ctx.shadowBlur = 12; fn(); ctx.restore(); } else fn(); };
    const disc = (x, y, r) => { ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); };
    // the stick: a glass dial with ticks; the knob a key cap
    ctx.save(); ctx.globalAlpha = 0.94;
    disc(b.x, b.y, R); const gb = ctx.createLinearGradient(0, b.y - R, 0, b.y + R); gb.addColorStop(0, FT.panelTop); gb.addColorStop(1, FT.panelBot); ctx.fillStyle = gb; ctx.fill();
    glow(() => { disc(b.x, b.y, R - 1); ctx.strokeStyle = FT.edge; ctx.lineWidth = 2; ctx.stroke(); });
    ctx.strokeStyle = FT.dim; ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16, l0 = R * (i % 2 ? 0.88 : 0.8); ctx.lineWidth = i % 2 ? 1.5 : 2.5; ctx.beginPath(); ctx.moveTo(b.x + Math.cos(a) * l0, b.y + Math.sin(a) * l0); ctx.lineTo(b.x + Math.cos(a) * R * 0.94, b.y + Math.sin(a) * R * 0.94); ctx.stroke(); }
    ctx.setLineDash([4, 5]); ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1.5; disc(b.x, b.y, R * pv('proto.input.touchDeadzone') + 4); ctx.stroke(); ctx.setLineDash([]);
    if (mv.m > 0) { const a = Math.atan2(mv.y, mv.x); glow(() => { ctx.strokeStyle = FT.accent; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(b.x, b.y, R + 7, a - 0.32 - 0.25 * mv.m, a + 0.32 + 0.25 * mv.m); ctx.stroke(); }); }
    const kn = TOUCH.knob || b; let kx = kn.x - b.x, ky = kn.y - b.y; const kl = Math.hypot(kx, ky); if (kl > R * 0.62) { kx *= R * 0.62 / kl; ky *= R * 0.62 / kl; }
    const kr = R * 0.4, gk = ctx.createLinearGradient(0, b.y + ky - kr, 0, b.y + ky + kr); gk.addColorStop(0, mv.m > 0 ? FT.sel : FT.keyTop); gk.addColorStop(1, mv.m > 0 ? FT.sel : FT.keyBot);
    disc(b.x + kx, b.y + ky, kr); ctx.fillStyle = gk; ctx.fill(); ctx.strokeStyle = FT.edge; ctx.lineWidth = 1.5; ctx.stroke();
    txt('MOVE', b.x + kx, b.y + ky + 6, '700 ' + Math.round(kr * 0.42) + 'px ' + F_UI, mv.m > 0 ? FT.selText : FT.dim, 'center');
    // the diamond: round glass keys, as the dial; the letter in the key-cap face. A wears the dummy's yellow; an uninstalled button reads LOCKED
    for (const f of L.face) {
      const fw = faceWord(f, s), live = fw.live, dn = !!TOUCH.down[f.id], k = f.r * (dn ? 0.94 : 1), word = fw.word;
      ctx.globalAlpha = live ? 0.96 : STORY ? 0.38 : 0.5;
      disc(f.x, f.y, k); const g = ctx.createLinearGradient(0, f.y - k, 0, f.y + k); g.addColorStop(0, dn ? FT.sel : FT.keyTop); g.addColorStop(1, dn ? FT.sel : FT.keyBot); ctx.fillStyle = g; ctx.fill();
      glow(() => { disc(f.x, f.y, k - 1); ctx.strokeStyle = f.id === 'a' && live ? C.dummy : FT.edge; ctx.lineWidth = f.id === 'a' ? 3.5 : 1.75; ctx.stroke(); });
      ctx.save(); disc(f.x, f.y, k - 3); ctx.clip(); const hg = ctx.createLinearGradient(0, f.y - k, 0, f.y - k * 0.2); hg.addColorStop(0, FT.gloss); hg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hg; ctx.fillRect(f.x - k, f.y - k, 2 * k, k); ctx.restore();
      txt(f.l, f.x, f.y + k * 0.14, '700 ' + Math.round(k * 0.78) + 'px ' + F_MONO, dn ? FT.selText : live ? FT.text : FT.off, 'center');
      if (word) txt(word, f.x, f.y + k * 0.6, '700 ' + Math.max(9, Math.round(k * 0.26)) + 'px ' + F_UI, dn ? FT.selText : live ? (f.id === 'a' ? C.dummy : FT.dim) : FT.off, 'center');
    }
    ctx.globalAlpha = 1;
    // pause and full screen: glass keys
    for (const [kk, label] of [['pause', '❚❚ PAUSE'], ['full', '⤢ FULL']]) {
      const c = L.chip[kk]; if (!c || app.touchEdit) continue;
      glassKey(c.x, c.y, c.w, c.h); txt(label, c.x + c.w / 2, c.y + c.h / 2 + (STORY ? 5 : 6), (STORY ? '700 13px ' : '700 17px ') + F_UI, FT.text, 'center');
    }
    ctx.restore();
    if (app.touchEdit) drawTouchEdit(L);
  }
  if (touchDevice()) touchOn();
  for (const t of ['pointerdown', 'touchstart']) window.addEventListener(t, (e) => { if (!TOUCH.on && (t === 'touchstart' || e.pointerType === 'touch')) touchOn(); }, { capture: true, passive: true }); // Edit 89: a finger on any screen turns touch on

  // ---------- audio
  const Snd = {
    ctx: null,
    init() { if (!this.ctx) { try { this.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { this.ctx = null; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
    tone(f0, f1, dur, type, gain, delay) {
      if (!this.ctx || !app.sound) return;
      const c = this.ctx, t = c.currentTime + (delay || 0), o = c.createOscillator(), g = c.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(gain || 0.06, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.03);
    },
    noise(f0, f1, dur, gain, delay) { // band-passed noise sweep: crunch, whoosh, clatter
      if (!this.ctx || !app.sound) return;
      const c = this.ctx, t = c.currentTime + (delay || 0), n = Math.max(1, Math.floor(c.sampleRate * dur));
      if (!this.buf || this.buf.length < n) { this.buf = c.createBuffer(1, Math.max(n, c.sampleRate), c.sampleRate); const d = this.buf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      const src = c.createBufferSource(), bp = c.createBiquadFilter(), g = c.createGain();
      src.buffer = this.buf; bp.type = 'bandpass'; bp.Q.value = 1.2;
      bp.frequency.setValueAtTime(Math.max(20, f0), t); bp.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(gain || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(bp); bp.connect(g); g.connect(c.destination); src.start(t); src.stop(t + dur + 0.03);
    },
  };
  const THEME_NAME = { start: 'Start screen', flyover: 'Pillars', barrier: 'Barrier run', plain: 'Open street',
    monument: 'Lantern monument', fountain: 'Fountain square', roundabout: 'Roundabout', tower: LT('n33', 'FARSIGHT Tower'), plate: 'Test plates' }; // Edit 96 (P8.1): n33
  const LEVEL6 = { walk: 'Walkway: no traffic up here. Step off the side to drop onto cars below.', hill: 'Hilltop (Z1): streets with traffic. Step off the cliff edge to drop to the valley.',
    terrace: 'Terrace: step off the edge to drop to the beach.', ring: 'Ring deck: highway traffic gives way at the entries. Escalators lead down.' }; // P6 (Edit 62)
  const maxHP = (s) => (s && s.maxHealth ? s.maxHealth() : s.P['damage.bodyHealth']); // Edit 91: on foot, a lighter chassis
  const DENY_TEXT = { lunge: 'No lunge — charge empty or recovering', pickup: 'No cone within reach', drop: 'No room to place the cone', throw: 'No room to release the cone',
    'push.locked': 'Push needs Arms', 'push.spent': 'No pushes left: land to get them back', 'push.nothing': 'Nothing to push off: hit or touch a car', 'drop.hold': 'Hold X to put the cone down', // Edit 80
    jump: 'No jump — charge empty, or mid-action', 'jump.charge': 'No jump: the battery is empty', 'jump.locked': 'Jump needs the Jump module (Legs)', 'pickup.locked': 'Grab needs the Carry module (Arms)', 'throw.locked': 'Throw needs the Throw module (Arms)', 'throw.empty': 'Grab a cone first (X), then throw (Y)' }; // Edit 75
  // Generated juice (content/juice.json): one entry per sim event, every value a parameter ID. Returns false if absent.
  function juice(e, s) {
    const spec = CJ && CJ.events ? CJ.events.find((x) => x.event === e.type) : null;
    if (!spec) return false;
    let k = 1;
    if (spec.scale && spec.scale.by) k = clamp((+e[spec.scale.by] || 0) / (pv(spec.scale.full) || 1), 0, 1);
    if (spec.shake) kick(jv(spec.shake.amp, k), Math.max(0.02, jv(spec.shake.seconds, k)));
    if (spec.flash) fx.flash = { t0: app.realT, dur: jv(spec.flash, k) };
    if (spec.flinch) fx.flinchT0 = app.realT;
    if (spec.carPulse && e.car) fx.carPulse.set(e.car, app.realT);
    if (spec.stamp) fx.stampT0 = app.realT;
    const b = s.body;
    for (const pt of spec.particles || []) {
      const n = Math.round(jv(pt.count, k));
      if (n <= 0) continue;
      const dir = pt.dir === 'backward' ? b.facing + Math.PI : pt.dir === 'facing' ? b.facing : null;
      puff(e.x != null && e.type === 'chassis' ? e.x : b.x, e.y != null && e.type === 'chassis' ? e.y : b.y, n,
        { type: pt.type, dir, spread: 1.4, speed: jv(pt.speed, k), life: jv(pt.life, k), size: jv(pt.size, k), role: pt.role });
    }
    return true;
  }
  // ---------- P2.1 event layer: car identity, derived cases (near miss, miss, upgrade seen), hit juice, barks.
  const SENIORITY = ['New', 'Practised', 'Experienced', 'Senior'];
  function seniorityOf(c) { return c.applied >= 5 ? 3 : c.applied >= 3 ? 2 : c.applied >= 1 ? 1 : 0; } // the notches drawn beside the tag
  function trackCars(s) {
    for (const c of carsOf(s)) fx.cars.set(c.id, { id: c.id, model: c.model, cls: c.cls, slot: c.slot || 0, seniority: seniorityOf(c), x: c.x, y: c.y, h: c.h, L: c.L, W: c.W });
  }
  function upm() { return (app.sim && app.sim.P['proto.scale.unitsPerMetre']) || 12.2; }
  function whenOk(when, e) {
    for (const [k, v] of Object.entries(when || {})) {
      if (k === 'owns') { if (!(app.sim && app.sim.has(v))) return false; continue; } // the dummy's upgrades (lore tied to state, D23)
      if (k === 'broken') { if (!brokenPart(v)) return false; continue; }              // the dummy's damage
      if (Array.isArray(v)) { if (!v.includes(e[k])) return false; continue; }
      if (v && typeof v === 'object') { // bounds are numbers or parameter IDs
        const n = +e[k], lo = v.min == null ? -Infinity : typeof v.min === 'string' ? pv(v.min) : v.min, hi = v.max == null ? Infinity : typeof v.max === 'string' ? pv(v.max) : v.max;
        if (e[k] == null || !(n >= lo && n <= hi)) return false;
      }
      else if (e[k] !== v) return false;
    }
    return true;
  }
  // Every event that names a car gets the car's model, class and seniority; a write-off gets the car of the impact that caused it.
  function enrich(e) {
    const out = Object.assign({}, e);
    if (e.type === 'writeoff' && fx.lastImpact && fx.lastImpact.t === e.t) { const li = fx.lastImpact; Object.assign(out, { car: li.car, zone: li.zone, drop: li.drop, dropZ: li.dropZ, dropFrom: li.dropFrom, deck: li.deck, plate: li.plate }); }
    if (app.sim && app.sim.isCity) out.district = app.sim.levelId; // Edit 44 city barks may test the district
    const info = out.car && fx.cars.get(out.car);
    if (info) {
      const fm = FMODEL.get(info.model);
      Object.assign(out, { model: fm ? fm.id : info.model, cls: info.cls, class: fm ? fm.class : info.cls, tier: fm ? fm.tier : null, seniority: info.seniority });
    }
    const sb = app.sim && app.sim.body;
    if (sb) out.wear = +(1 - sb.health / maxHP(app.sim)).toFixed(3);
    if (e.type === 'honk') out.at = e.at === 'body' ? 'body' : 'cone';
    return out;
  }
  // Derived cases are computed from sim state and logged under 'presentation' in the exported trace.
  function present(s, type, data) {
    const e = Object.assign({ t: +s.t.toFixed(4), type }, data);
    app.present.push(e);
    const x = enrich(e);
    hitJuice(x, s);
    barkLine(x, s);
  }
  function carGap(b, c, R) { // body edge to car edge, world units
    const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b.x - c.x, dy = b.y - c.y;
    const lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca;
    return Math.hypot(Math.max(Math.abs(lx) - c.L / 2, 0), Math.max(Math.abs(ly) - c.W / 2, 0)) - R;
  }
  function deriveCases(s) {
    trackCars(s);
    const b = s.body, P = s.P;
    if (s.phase !== 'play' || !b.alive) { fx.lungeWatch = null; return; }
    const gapMax = pv('proto.barks.nearMissGap') || 26, vMin = pv('proto.barks.nearMissSpeed') || 60, R = P['body.radius'];
    for (const c of carsOf(s)) {
      if (fx.nmDone.has(c.id)) continue;
      const g = carGap(b, c, R), st = fx.nm.get(c.id);
      if (g < gapMax && Math.abs(c.v) >= vMin) {
        if (!st) fx.nm.set(c.id, { min: g, v: Math.abs(c.v), lunging: b.mode === 'lunge', contact: false });
        else if (g < st.min) { st.min = g; st.v = Math.abs(c.v); st.lunging = st.lunging || b.mode === 'lunge'; }
      } else if (st && g > gapMax * 1.6) {
        fx.nm.delete(c.id); fx.nmDone.add(c.id);
        if (!st.contact) present(s, 'near-miss', { car: c.id, gap: +(Math.max(0, st.min) / upm()).toFixed(1), speed: Math.round(st.v), lunging: st.lunging });
      }
    }
    for (const id of fx.nm.keys()) if (!carsOf(s).some((c) => c.id === id)) fx.nm.delete(id);
    const lw = fx.lungeWatch;
    if (lw && b.mode !== 'lunge') {
      fx.lungeWatch = null;
      if (!lw.contact) {
        let best = null, bd = pv('proto.barks.missRadius') || 120;
        for (const c of carsOf(s)) { const g = carGap(b, c, R); if (g < bd) { bd = g; best = c; } }
        present(s, 'miss', best ? { car: best.id, gap: +(Math.max(0, bd) / upm()).toFixed(1) } : { car: null, gap: null });
      }
    }
  }
  function noteContact(e) {
    if (!e.car) return;
    if (fx.lungeWatch) fx.lungeWatch.contact = true;
    const st = fx.nm.get(e.car); if (st) st.contact = true;
    fx.nmDone.add(e.car);
  }

  // Generated hit juice (content/hits.json): base and accent layers per event; presentation only.
  function contactOf(e, s) {
    const b = s.body, car = e.car && (carsOf(s).find((c) => c.id === e.car) || fx.cars.get(e.car));
    let x = b.x, y = b.y;
    const eff = (type) => { for (let i = s.effects.length - 1; i >= 0; i--) if (s.effects[i].type === type && Math.abs(s.effects[i].t - e.t) < 1e-3) return s.effects[i]; return null; };
    const be = e.type === 'impact' ? eff('burst') : e.type === 'writeoff' ? eff('wreck') : null;
    let nx = Math.cos(b.facing), ny = Math.sin(b.facing);
    if (car) { const dx = b.x - car.x, dy = b.y - car.y, l = Math.hypot(dx, dy) || 1; nx = dx / l; ny = dy / l; }
    if (be) { x = be.x; y = be.y; } else if (car && e.type !== 'miss') { x = b.x - nx * s.P['body.radius']; y = b.y - ny * s.P['body.radius']; }
    return { x, y, nx, ny, car, eff: be };
  }
  function hitJuice(e, s) {
    const res = { done: false, sound: false };
    const all = ((CH && CH.layers) || []).concat((CD && CD.layers) || []); // generated drop juice stacks on the hit layers
    if (!all.length) return res;
    const layers = all.filter((L) => L.event === e.type);
    if (!layers.length) return res;
    res.done = true;
    const now = app.realT, rk = e.type + ':' + (e.car || '');
    if (/^(touch-spent|knock)$/.test(e.type) && now - (fx.juiceT.get(rk) || -9) < 0.25) { res.sound = true; return res; } // the sim logs every contact frame; juice the first
    fx.juiceT.set(rk, now);
    const ct = contactOf(e, s), b = s.body, set = {};
    for (const L of layers) {
      if (!whenOk(L.when, e)) continue;
      const k = L.scale && L.scale.by ? clamp((+e[L.scale.by] || 0) / (pv(L.scale.full) || 1), 0, 1) : 1;
      for (const blk of ['shake', 'zoom', 'crumple', 'stumble', 'rays', 'popup']) if (L[blk]) set[blk] = { v: L[blk], k };
      if (L.flash != null) set.flash = { v: L.flash, k };
      if (L.ring) fx.rings.push({ x: ct.x, y: ct.y, r: jv(L.ring.radius, k), w: jv(L.ring.width, k) || 2, t0: now, dur: Math.max(0.05, jv(L.ring.seconds, k)), role: L.ring.role });
      if (L.streaks) {
        const along = e.type === 'near-miss' && ct.car ? ct.car.h : b.facing + Math.PI, n = Math.round(jv(L.streaks.count, k)), len = jv(L.streaks.length, k), lines = [];
        const ox = e.type === 'near-miss' ? -ct.nx * s.P['body.radius'] * 1.4 : 0, oy = e.type === 'near-miss' ? -ct.ny * s.P['body.radius'] * 1.4 : 0;
        for (let i = 0; i < n; i++) lines.push({ off: (Math.random() - 0.5) * 30, lag: Math.random() * 12, len: len * (0.6 + Math.random() * 0.4) });
        fx.streaks.push({ x: b.x + ox, y: b.y + oy, dir: along, lines, t0: now, dur: Math.max(0.05, jv(L.streaks.seconds, k)), role: L.streaks.role });
      }
      for (const pt of L.particles || []) {
        const n = Math.round(jv(pt.count, k));
        if (n <= 0) continue;
        const at = pt.at === 'contact' ? ct : pt.at === 'car' && ct.car ? ct.car : b;
        const dir = pt.dir === 'backward' ? b.facing + Math.PI : pt.dir === 'facing' ? b.facing : pt.dir === 'away' ? Math.atan2(ct.ny, ct.nx) : null;
        puff(at.x, at.y, n, { type: pt.type, dir, spread: 1.2, speed: jv(pt.speed, k), life: jv(pt.life, k), size: jv(pt.size, k), role: pt.role });
      }
      if (L.sound) {
        const sd = L.sound, f0 = jv(sd.from, k), f1 = jv(sd.to, k), dur = Math.max(0.02, jv(sd.seconds, k)), g = Math.min(0.25, jv(sd.gain, k));
        if (sd.type === 'noise') Snd.noise(f0, f1, dur, g); else Snd.tone(f0, f1, dur, sd.wave || 'triangle', g);
        res.sound = true;
      }
    }
    if (set.shake) kick(jv(set.shake.v.amp, set.shake.k), Math.max(0.02, jv(set.shake.v.seconds, set.shake.k)));
    if (set.zoom) fx.zoom = { amt: jv(set.zoom.v.amount, set.zoom.k), t0: now, dur: Math.max(0.05, jv(set.zoom.v.seconds, set.zoom.k)), x: ct.x, y: ct.y };
    if (set.flash) fx.flash = { t0: now, dur: jv(set.flash.v, set.flash.k) };
    if (set.crumple) { fx.crumple = { amt: jv(set.crumple.v.amount, set.crumple.k), t0: now, dur: Math.max(0.05, jv(set.crumple.v.seconds, set.crumple.k)), ang: Math.atan2(ct.ny, ct.nx) }; fx.flinchT0 = now; }
    if (set.stumble) fx.stumble = { amp: jv(set.stumble.v.amp, set.stumble.k), t0: now, dur: Math.max(0.05, jv(set.stumble.v.seconds, set.stumble.k)) };
    if (ct.eff && (set.rays || set.popup)) ct.eff._cfg = { rays: set.rays, popup: set.popup, nx: ct.nx, ny: ct.ny };
    if (e.type === 'impact' && e.car) fx.carPulse.set(e.car, now);
    if (e.type === 'writeoff') fx.stampT0 = now;
    return res;
  }
  function brokenPart(v) {
    const lv = app.sim ? partLevels(app.sim) : {};
    if (v === 'legs') return lv.legL >= 3 && lv.legR >= 3;
    if (v === 'arms') return lv.armL >= 3 && lv.armR >= 3;
    return lv[v] >= 3;
  }
  // Barks from the fleet database: highest priority wins, then the most specific line; seeded pick among equals.
  // Write-offs always speak; hits outrank chatter; chatter waits out the global and per-car cooldowns (proto.barks.*).
  function barkLine(e, s) {
    if (!FLEET || !e.car) return;
    const info = fx.cars.get(e.car);
    if (!info) return;
    const pool = FLEET.barks.filter((ln) => ln.event === e.type && whenOk(ln.when, e));
    if (!pool.length) return;
    const pr = Math.max(...pool.map((ln) => ln.priority || 1)), now = app.realT, dur = pv('proto.barks.seconds') || 2.4;
    // Submission 4: a line that names the situation (a drop, a highway, a plate, the district) outranks a generic line of the same priority
    const SIT = ['drop', 'dropZ', 'dropFrom', 'deck', 'plate', 'district'], sit = (ln) => Object.keys(ln.when || {}).some((k) => SIT.includes(k));
    const pool2 = pool.filter((ln) => (ln.priority || 1) === pr), sitPool = pool2.filter(sit), cand = sitPool.length ? sitPool : pool2;
    const spec = (ln) => Object.keys(ln.when || {}).length, top = [], best = Math.max(...cand.map(spec));
    for (const ln of cand) if (spec(ln) >= Math.min(best, 1)) { top.push(ln); if (spec(ln) >= best && best > 0) top.push(ln); }
    const cur = fx.bubbles.get(e.car), last = fx.carBarkT.get(e.car);
    if (cur && now - cur.t0 < dur && cur.priority > pr) return;
    if (pr < 3) {
      if (last && now - last.t < (pv('proto.barks.carCooldown') || 4) && last.pr >= pr) return;
      if (pr === 1) {
        if (now - fx.barkT < (pv('proto.barks.cooldown') || 0.8)) return;
        let live = 0; for (const bk of fx.bubbles.values()) if (now - bk.t0 < dur) live++;
        if (!cur && live >= (pv('proto.barks.maxOnScreen') || 3)) return;
      }
    }
    const onScreen = new Set([...fx.bubbles.values()].filter((bk) => now - bk.t0 < dur).map((bk) => bk.id));
    const fresh = top.filter((ln) => !onScreen.has(ln.id) && ln.id !== fx.lastLine), use = fresh.length ? fresh : top; // no line twice at once
    const pick = use[(Math.round(e.t * 60) + info.slot * 7 + fx.barkN++) % use.length];
    const text = fillIn(pick.text, e); fx.lastLine = pick.id;
    fx.bubbles.set(e.car, { text, style: pick.style || 'speech', priority: pr, t0: now, car: e.car, id: pick.id });
    fx.barkT = now; fx.carBarkT.set(e.car, { t: now, pr });
    app.present.push({ t: +s.t.toFixed(4), type: 'bark', car: e.car, event: e.type, line: pick.id, text });
  }
  const BUBBLES_IN_FIELD = false; // P3–P6.1 drew pixel bubbles over the field
  function wrapSmall(text, maxW) {
    const out = []; let cur = '';
    for (const word of String(text).split(/\s+/)) { const t = cur ? cur + ' ' + word : word; if (PIX.smallWidth(t) <= maxW || !cur) cur = t; else { out.push(cur); cur = word; } }
    if (cur) out.push(cur);
    return out;
  }
  // Pixel bubbles above the car's tag (or below the car), never over another car's tag. Styles: speech solid edge,
  // shout double edge, mutter dashed edge and dim ink, thought dotted edge with trailing dots.
  function drawBarks(s) { // Prototype 6.2 (Edit 70): barks show in the strip under the field (drawMessages); the field keeps clear
    const dur0 = pv('proto.barks.seconds') || 2.4;
    for (const [id, bk] of fx.bubbles) if (app.realT - bk.t0 > dur0) fx.bubbles.delete(id);
    if (BUBBLES_IN_FIELD !== true) return;
    if (!fx.bubbles.size) return;
    const dur = pv('proto.barks.seconds') || 2.4, now = app.realT, placed = [];
    for (const c of carsOf(s)) { // tags and car bodies are cues: bubbles keep off them
      const t = tagRect(c), r = Math.ceil(Math.max(c.L, c.W) / U / 2) + 1;
      placed.push({ x: t.x0 - 1, y: t.y0 - 1, w: t.w + 10, h: t.h + 2, car: c.id }, { x: Math.round(c.x / U) - r, y: Math.round(c.y / U) - r - 4, w: 2 * r, h: 2 * r + 4, car: c.id });
    }
    if (s.body.alive) placed.push({ x: Math.round(s.body.x / U) - 12, y: Math.round(s.body.y / U) - 16, w: 24, h: 26, car: '_body' }); // never over the dummy
    const hits = (r, own) => placed.some((q) => q.car !== own && r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
    const order = [...fx.bubbles.entries()].sort((a, b2) => b2[1].priority - a[1].priority || b2[1].t0 - a[1].t0);
    for (const [id, bk] of order) {
      const live = carsOf(s).find((x) => x.id === id), c = live || fx.cars.get(id), age = now - bk.t0;
      if (!c || age > dur) { fx.bubbles.delete(id); continue; }
      const lines = wrapSmall(bk.text, 92), lh = PIX.SMALL_H + 2;
      const w = Math.max(...lines.map((l) => PIX.smallWidth(l))) + 7, h = lines.length * lh + 4, cx = Math.round(c.x / U);
      const t = tagRect(c), x = clamp(cx - (w >> 1), 1, AW - w - 1);
      const up = t.y0 - 5 - h, down = Math.round(c.y / U) + Math.round(Math.max(c.L, c.W) / U / 2) + 5;
      let y = up, below = false;
      if (y < 1 || hits({ x, y, w, h }, id)) { y = Math.min(down, AH - h - 1); below = true; }
      if (y < 1 || hits({ x, y, w, h }, id)) { if (bk.priority < 2) continue; y = clamp(up, 1, AH - h - 1); below = false; }
      placed.push({ x, y, w, h, car: null });
      const st = bk.style, edge = K.barkEdge;
      for (let yy = y + 1; yy < y + h - 1; yy++) for (let xx = x + 1; xx < x + w - 1; xx++) FB.mix(xx, yy, K.barkFill, 0.94);
      const dash = st === 'mutter' ? 2 : st === 'thought' ? 3 : 0;
      let i = 0;
      const ring = (ox, oy, ww, hh, f) => {
        for (let xx = ox + 1; xx < ox + ww - 1; xx++) { f(xx, oy); f(xx, oy + hh - 1); }
        for (let yy = oy + 1; yy < oy + hh - 1; yy++) { f(ox, yy); f(ox + ww - 1, yy); }
      };
      ring(x, y, w, h, (px, py) => { if (!dash || (i++ % dash) === 0) FB.put(px, py, edge); });
      if (st === 'shout') ring(x - 1, y - 1, w + 2, h + 2, (px, py) => { if ((px + py) % 2 === 0) FB.put(px, py, edge); });
      const ax = clamp(cx, x + 3, x + w - 4);
      if (st === 'thought') { const ty = below ? y - 3 : y + h + 2; FB.put(ax, ty, edge); FB.put(ax + (below ? 0 : 1), ty + (below ? -2 : 2), edge); }
      else for (let k = 0; k < 3; k++) { const ty = below ? y - 1 - k : y + h + k; for (let xx = ax - (2 - k); xx <= ax + (2 - k); xx++) FB.put(xx, ty, xx === ax - (2 - k) || xx === ax + (2 - k) || k === 2 ? edge : K.barkFill); }
      lines.forEach((l, k) => PIX.smallText(FB, l, x + ((w - PIX.smallWidth(l)) >> 1), y + 2 + k * lh, K.barkInk)); // one ink: style lives in the edge
    }
  }
  function processEvents() {
    const s = app.sim;
    if (!s) return;
    if (fx.pendingLearned && fx.cars.has(fx.pendingLearned.car)) { const pl = fx.pendingLearned; fx.pendingLearned = null; present(s, 'learned', pl); }
    const ev = s.events;
    trackCars(s);
    for (let i = app.lastEv; i < ev.length; i++) {
      const e0 = ev[i];
      if (e0.away) continue; // P5.3: traffic on another screen makes no sound or effect here
      if (e0.type === 'lunge') fx.lungeWatch = { contact: false };
      if (/^(impact|knock|touch|touch-spent|contact-ignored)$/.test(e0.type)) noteContact(e0);
      if (e0.type === 'impact') { fx.lastImpact = e0; if (e0.part) fx.lastPart = { part: e0.part, lost: e0.lost, t: app.realT }; }
      if (e0.type === 'purchase') fx.pendingNodes.push(e0.node); // node id, as the fleet database keys it
      if (e0.type === 'chassis' && fx.pendingNodes.length) { fx.upgradeWatch = fx.pendingNodes[fx.pendingNodes.length - 1]; fx.pendingNodes = []; }
      const e = enrich(e0);
      const hj = hitJuice(e, s);
      const juiced = hj.done || juice(e0, s);
      // P3: barks are not drawn. A legible bubble at ui.typeSecondary would cover the 400 × 300 field.
      // Lore tied to state (D23): a car that notices the dummy remarks on a new module or a broken part;
      // a model that learned returns and says so. Lines come from the fleet database.
      const notices = e.car && ((e0.type === 'commit' && e0.cause === 'body') || (e0.type === 'honk' && e0.at === 'body'));
      if (FLEET && notices && fx.upgradeWatch) {
        const node = fx.upgradeWatch; fx.upgradeWatch = null;
        fx.carBarkT.delete(e.car); fx.barkT = -9;
        present(s, 'upgrade-seen', { car: e.car, node });
      } else if (FLEET && notices && fx.partWatch) {
        const part = fx.partWatch; fx.partWatch = null;
        fx.carBarkT.delete(e.car); fx.barkT = -9;
        present(s, 'part-seen', { car: e.car, part });
      }
      if (e0.type === 'learn-standoff') fx.learnWatch.set(e0.model, { from: e0.from, to: e0.to });
      if (e0.type === 'admit' && fx.learnWatch.has(e0.model)) { const lw = fx.learnWatch.get(e0.model); fx.learnWatch.delete(e0.model); fx.pendingLearned = { car: e0.car, from: lw.from, to: lw.to }; }
      if (e0.type === 'impact' && e0.part && s.body.alive) { const lv = partLevels(s)[e0.part]; if (lv >= 3 && !fx.partsSeen.has(e0.part)) { fx.partsSeen.add(e0.part); fx.partWatch = e0.part; } }
      if (e0.type === 'chassis') { fx.partsSeen.clear(); fx.partWatch = null; }
      if (FLEET && e.car) barkLine(e, s);
      switch (e0.type) {
        case 'lunge': {
          if (!hj.sound) Snd.tone(220, 90, 0.12, 'triangle', 0.12);
          if (!juiced) { kick(1.5, 0.1); const b = s.body; puff(b.x, b.y, 7, { type: 'dust', dir: b.facing + Math.PI, spread: 1.4, speed: 60, life: 0.45, size: 4 }); }
          break;
        }
        case 'impact': {
          const k = Math.min(1, e.assessed / 500);
          if (!hj.sound) { Snd.tone(160, 40, 0.28 + 0.2 * k, 'sawtooth', 0.08 + 0.12 * k); Snd.tone(900, 240, 0.07, 'square', 0.05); }
          if (!juiced) {
            kick(3 + 9 * k, 0.25 + 0.2 * k); fx.flinchT0 = app.realT; fx.carPulse.set(e.car, app.realT);
            const b = s.body; puff(b.x, b.y, 8 + Math.round(10 * k), { type: 'spark', speed: 160, life: 0.35, size: 2 });
          }
          break;
        }
        case 'knock': { if (!juiced) { const b = s.body; puff(b.x, b.y, 5, { type: 'dust', speed: 50, life: 0.4, size: 3 }); } break; }
        case 'touch-spent': if (!hj.sound) Snd.tone(260, 240, 0.06, 'sine', 0.06); if (!juiced) kick(1, 0.1); toast(copy('toast.touch-spent', 'Spent car — no reward')); break;
        case 'honk': if (e.at === 'body') horn(); else Snd.tone(880, 880, 0.05, 'sine', 0.03); fx.horn.set(e.car, app.realT); break;
        case 'learn-standoff': Snd.tone(330, 260, 0.12, 'triangle', 0.05); toast(copy('toast.learn-standoff', '{model} now stops {metres} m back', { model: e.model, metres: (e.to / s.P['proto.scale.unitsPerMetre']).toFixed(1) })); break;
        case 'unstick': if (e.how === 'reverse') { Snd.tone(1000, 1000, 0.06, 'square', 0.03); Snd.tone(1000, 1000, 0.06, 'square', 0.03, 0.25); } break;
        case 'drone-dispatch': Snd.tone(150, 210, 0.6, 'sawtooth', 0.025); toast(e.rescue ? copy('toast.rescue-dispatch', LT('n17', 'FARSIGHT drone dispatched: chassis in the river')) : copy('toast.drone-dispatch', LT('n18', 'FARSIGHT drone dispatched to clear a cone'))); break;
        case 'drone-pickup': Snd.tone(320, 200, 0.08, 'square', 0.05); break;
        case 'drone-drop': Snd.tone(240, 150, 0.1, 'square', 0.05); break;
        case 'chassis': fx.dropT0 = app.realT; fx.lastPart = null; break;
        case 'writeoff': {
          if (!hj.sound) [392, 311, 233, 155].forEach((f, j) => Snd.tone(f, f * 0.98, 0.16, 'square', 0.07, j * 0.11));
          if (!juiced) {
            kick(14, 0.6); fx.flash.t0 = app.realT; fx.flash.dur = 0.18; fx.stampT0 = app.realT;
            const b = s.body; puff(b.x, b.y, 24, { type: 'spark', speed: 220, life: 0.5, size: 2.5 }); puff(b.x, b.y, 10, { type: 'smoke', speed: 30, life: 1.2, size: 8 });
          }
          break;
        }
        case 'denied': Snd.tone(120, 110, 0.05, 'square', 0.05); Snd.tone(120, 110, 0.05, 'square', 0.05, 0.08); if (!(e.action === 'lunge' && fx.slipT === e.t)) toast(STORY && e.why === 'locked' ? 'Not fitted yet' : e.why ? DENY_TEXT[e.action + '.' + e.why] || 'Denied' : copy('denied.' + e.action, DENY_TEXT[e.action] || 'Denied')); break; // Edit 90: a locked verb is not named
        case 'jump': { if (e.clear === false && !fx.hopTold) { fx.hopTold = true; toast('A hop clears nothing. Run, then jump.'); } /* Edit 77 */ Snd.tone(330, e.kind === 'dash' ? 880 : 660, e.kind === 'dash' ? 0.18 : 0.12, 'triangle', 0.08); const b = s.body; puff(b.x, b.y + 6, e.kind === 'dash' ? 10 : 6, { type: 'dust', speed: 55, life: 0.35, size: 3 }); if (e.kind === 'dash' && !fx.longJumpSeen) { fx.longJumpSeen = true; toast('Long jump: B during a dash carries its speed'); } break; } // Edit 75–76
        case 'jump-land': { Snd.tone(160, 90, 0.08, 'square', 0.05); const b = s.body; puff(b.x, b.y + 6, 5, { type: 'dust', speed: 45, life: 0.3, size: 3 }); break; }
        case 'rail-jump': Snd.tone(520, 880, 0.1, 'triangle', 0.06); toast('Over the rail'); break;
        case 'combo': [660, 880, 1100].slice(0, Math.min(3, e.n)).forEach((f, j) => Snd.tone(f, f * 1.2, 0.08, 'triangle', 0.08, j * 0.06)); kick(2 + e.n, 0.18); toast('COMBO ' + e.n + (e.kinds && e.kinds.length > 1 ? ' · ' + e.kinds.map((k) => MOVE_NAME[k] || k).join(' › ') : '') + ' · ×' + e.mult + ' · +' + num(e.bonus)); break;
        case 'combo-end': Snd.tone(523, 784, 0.12, 'triangle', 0.06); toast('COMBO BANKED · ' + e.n + ' hits · ×' + e.mult + ' · ' + num(e.points)); break; // Edit 79
        case 'hitch': Snd.tone(300, 420, 0.08, 'square', 0.05); if (!fx.hitchTold) { fx.hitchTold = true; toast('Hitched. X lets go; A slings you off with a dash.'); } break;
        case 'sling': Snd.tone(420, 900, 0.14, 'triangle', 0.08); kick(3, 0.15); break;
        case 'push': { Snd.tone(360, 820, 0.12, 'triangle', 0.08); kick(3, 0.15); const b = s.body; puff(b.x, b.y, 6, { type: 'spark', speed: 80, life: 0.25, size: 2 }); break; } // Edit 80
        case 'cone-hit': Snd.tone(900, 600, 0.08, 'square', 0.06); toast('CONE HIT' + (e.n > 1 ? ' · COMBO ' + e.n + ' · ×' + e.mult : '') + ' · +' + num(e.points)); break;
        case 'slip': { fx.slipT = e.t; const b = s.body; puff(b.x, b.y + 8, 8, { type: 'spark', role: 'puddleHi', speed: 90, life: 0.3, size: 2 }); toast(copy('toast.slip', 'No dash on water. Step off the puddle.')); break; } // D18
        case 'skid': { const c = carsOf(s).find((q) => q.id === e.car); if (c) puff(c.x, c.y, 10, { type: 'spark', role: 'puddleHi', dir: c.h + Math.PI, spread: 2.2, speed: 120, life: 0.35, size: 2 }); Snd.tone(1800, 900, 0.18, 'sawtooth', 0.02); break; }
        case 'screen': { // D24: first visit names the screen
          Snd.tone(300, 520, 0.12, 'triangle', 0.04);
          if (!fx.seenScreens.has(e.to)) { fx.seenScreens.add(e.to); toast(e.to + ' · ' + (THEME_NAME[e.focal || e.theme] || e.landmark || '') + (e.turns === 'diagonal' ? ' · 45° road' : '')); } // P4: generated screen names were checked against P3's layouts, so P4 shows the screen's theme
          break;
        }
        case 'purchase': [523, 659, 784].forEach((f, j) => Snd.tone(f, f, 0.1, 'triangle', 0.07, j * 0.07)); Snd.tone(150, 60, 0.18, 'square', 0.06, 0.02); fx.fit = { node: e.node, t0: app.realT }; toast(e.unit === 'upgrade' ? NODE(e.node).name + ' fitted' + (e.upgrades ? ' · ' + e.upgrades + ' upgrade' + (e.upgrades === 1 ? '' : 's') + ' left' : '') : copy('toast.purchase', '{node} installed', { node: NODE(e.node).name })); break; // Edit 89: the fit lands on the workshop's chassis
        case 'purchase-denied': Snd.tone(180, 140, 0.12, 'square', 0.04); toast(e.why === 'max' ? 'That part is at its top level' : /^gift/.test(e.why) ? LT('n15', 'A Farsight drone brings that part') : e.why[0].toUpperCase() + e.why.slice(1)); break; // Edit 89
        case 'held': Snd.tone(240, 200, 0.16, 'square', 0.05); toast('Not the brief: chassis held at ' + num(e.health)); break; // Edit 91: a miss of the brief does not write the chassis off
        case 'shop-open': if (STORY && ABIL4) { const k = SHOP_GRID.findIndex((g) => { const n = nextLevel(s, g[0]); return n && s.canBuy(n).ok; }); app.shopCol = Math.max(0, k); app.shopRow = k >= 0 ? 0 : SHOP_ROWS; fx.fit = null; } break; // Edit 89: the workshop opens on a part an upgrade fits
        case 'pickup': Snd.tone(700, 950, 0.05, 'triangle', 0.06); if (ABIL && s.coneCapacity() > 1) toast('Cones ' + (e.n || 1) + ' / ' + s.coneCapacity()); break;
        case 'drop': Snd.tone(500, 380, 0.06, 'triangle', 0.05); break;
        case 'stair': Snd.tone(260, 300, 0.05, 'triangle', 0.03); break;
        case 'level': { // Edit 42, 44: first time up says what the level does
          const f = s.level.floors && s.body.floor != null ? s.level.floors[s.body.floor] : null, kind = f ? f.kind : null, key = 'level' + e.level + (kind === 'deck' ? '' : kind || '');
          if (e.level > 0 && kind !== 'bridge' && !fx.seenScreens.has(key)) {
            fx.seenScreens.add(key);
            if (LEVEL6[kind]) toast(place('levels.' + kind) || LEVEL6[kind]); // P6: walkways, the hill, terraces, the ring
            else toast(kind === 'roof' ? place('levels.roof') || copy('toast.roof', 'Roof: no traffic up here. Step off a ledge to drop on a car below.')
              : e.level === 2 ? place('levels.z2Highway') || copy('toast.highway', 'High highway: fast traffic. A broken parapet is a long drop to the street.')
              : place('levels.z1') || copy('toast.deck', 'Low highway: traffic up here. A broken parapet drops you to the road.'));
          }
          break;
        }
        case 'deck-drop': if (!hj.sound) Snd.tone(700, 200, 0.3, 'triangle', 0.06); break;
        case 'splash': { Snd.noise(900, 200, 0.4, 0.08); puff(e.x, e.y, 12, { type: 'spark', role: 'puddleHi', speed: 90, life: 0.45, size: 2 }); break; } // P6 (D37): into the river
        case 'rescued': Snd.tone(320, 480, 0.12, 'triangle', 0.05); toast(copy('toast.rescued', LT('n19', 'FARSIGHT drone: chassis recovered from the river'))); break;
        case 'land': { const b = s.body; if (!hj.sound) Snd.tone(110, 80, 0.12, 'square', 0.06); if (!hj.done) { puff(b.x, b.y + 6, 8, { type: 'dust', speed: 70, life: 0.4, size: 3 }); if (!e.car) kick(2, 0.12); } break; } // generated drop juice replaces the stub
        case 'throw': Snd.tone(620, 180, 0.16, 'triangle', 0.07); break;
        case 'punt': Snd.tone(420, 300, 0.05, 'triangle', 0.04); break;
        case 'story-enter': [392, 523, 659].forEach((f, j) => Snd.tone(f, f, 0.1, 'triangle', 0.05, j * 0.08)); break; // Edit 81
        case 'story-count': Snd.tone(660, 990, 0.12, 'triangle', 0.07); toast('COUNTED · ' + e.tile + ' ' + e.n + ' / ' + e.need); break;
        case 'story-miss': Snd.tone(200, 150, 0.12, 'square', 0.05); toast(e.why === 'task' ? 'NOT COUNTED · the brief wants ' + STORY.taskText(STORY.tileOf(s.levelId, e.tile).task, s.P).label.toLowerCase() : e.why === 'cleared' ? 'NOT COUNTED · ' + e.tile + ' is already cleared' : 'NOT COUNTED · ' + e.tile + ' is not in test'); break;
        case 'story-clear': [523, 659, 784, 1046].forEach((f, j) => Snd.tone(f, f, 0.14, 'triangle', 0.07, j * 0.09)); toast('TILE ' + e.tile + ' CLEARED' + (e.next ? ' · ' + e.next + ' OPEN' : '')); break;
        case 'story-gift': if (!e.node) toast(LT('n11', 'FARSIGHT GIFT · +{N} CREDITS', { N: e.credits }).replace(/\b1 CREDITS\b/, '1 CREDIT')); break; // Edit 84: a verb has its own screen
        case 'story-ferry': Snd.tone(150, 210, 0.6, 'sawtooth', 0.025); if (e.gift) giftChime(); toast(e.gift ? LT('n08', 'FARSIGHT DRONE · {PART} ON BOARD · THEN {TILE}', { PART: NODE(e.gift).name.toUpperCase(), TILE: e.to }) : LT('n09', 'FARSIGHT DRONE · CARRYING YOU TO {TILE}', { TILE: e.to })); break; // Edit 83
        case 'story-deliver': case 'arcade-deliver': Snd.tone(150, 210, 0.6, 'sawtooth', 0.025); giftChime(); toast(LT('n07', 'FARSIGHT DRONE · DELIVERING {PART}', { PART: NODE(e.node).name.toUpperCase() })); break; // Edit 84
        case 'gift': fx.gift = { node: e.node, t0: app.realT }; giftFanfare(Math.max(0.1, pv('ui.gift.fallSeconds'))); break; // Edit 84: the gift screen
        case 'delivered': Snd.tone(320, 480, 0.12, 'triangle', 0.05); break;
        case 'unveil': fx.unveil = null; if (app.mode === 'story') saveStory(); break; // Edit 94 (P7.13): the CERTIFIED save; the chime plays as the cloth lifts (drawUnveil)
        case 'story-ferried': Snd.tone(240, 150, 0.1, 'square', 0.05); break;
        case 'story-fence': Snd.tone(140, 120, 0.08, 'square', 0.05); toast(e.cleared ? 'Fence: ' + e.to + ' is not yet surveyed' : 'Fence: clear ' + e.tile + ' first (' + s.story.tileWO + ' / ' + STORY.needOf(s.levelId, e.tile, s.P) + ')'); break;
        case 'ending': if (e.kind === 'Licensed' || e.kind === 'Certified') [523, 659, 784, 1046].forEach((f, j) => Snd.tone(f, f, 0.16, 'triangle', 0.07, 1.1 + j * 0.09)); if (HS) hsRecord(s, e.kind); break; // Edit 97 (P8.2): the high scores
        case 'grade': toast(LT('n35', 'GRADE {G} · TOUGHER CHASSIS · DENSER TRAFFIC', { G: e.grade })); [440, 660, 880].forEach((f, j) => Snd.tone(f, f, 0.1, 'square', 0.05, j * 0.08)); break; // Edit 97 (P8.2)
        default: break;
      }
    }
    if (s.storyMode) for (let i = app.lastEv; i < ev.length; i++) if (/^story-|^purchase$/.test(ev[i].type)) { saveStory(); break; } // Edit 81
    app.lastEv = ev.length;
    deriveCases(s);
  }
  // Edit 84: the gift's sounds (original). A chime when a drone brings a module into view. On the gift screen: a rising whoosh
  // while the module falls, a thud as it lands, then a rising D-major arpeggio, a held chord over the root, and a sparkle
  function giftChime() { Snd.tone(1318.5, 1318.5, 0.14, 'sine', 0.05); Snd.tone(1760, 1760, 0.3, 'sine', 0.05, 0.12); }
  function giftFanfare(fall) {
    Snd.tone(280, 1300, fall, 'sine', 0.035); Snd.noise(500, 4200, fall, 0.03);
    Snd.tone(150, 45, 0.32, 'square', 0.09, fall); Snd.noise(4200, 900, 0.3, 0.06, fall);
    const a0 = fall + 0.06, c0 = a0 + 4 * 0.09;
    [587.33, 739.99, 880, 1174.66].forEach((f, j) => { Snd.tone(f, f, 0.18, 'triangle', 0.08, a0 + j * 0.09); Snd.tone(f * 2, f * 2, 0.08, 'square', 0.014, a0 + j * 0.09); });
    [880, 1174.66, 1479.98].forEach((f) => Snd.tone(f, f * 1.004, 1.4, 'triangle', 0.045, c0));
    Snd.tone(293.66, 293.66, 1.4, 'sine', 0.06, c0);
    [2349.3, 2959.96, 3520, 2637].forEach((f, j) => Snd.tone(f, f, 0.07, 'sine', 0.02, c0 + 0.12 + j * 0.13));
  }

  function horn() { Snd.tone(440, 430, 0.16, 'square', 0.05); Snd.tone(349, 340, 0.22, 'square', 0.05, 0.18); }
  function dashify(str) { return String(str).replace(/lunge/gi, (m) => (m[0] === 'L' ? (m === 'LUNGE' ? 'DASH' : 'Dash') : 'dash')); } // display name only
  function toast(msg) { app.toast = { msg: dashify(msg), t: app.realT }; }

  // ---------- menus
  const PAUSE_ITEMS = STORY ? ['Resume', 'Restart level', 'Refuse testing', 'Options', 'Controls', 'Show trace', 'Quit to title'] : ['Resume', 'Restart level', 'Refuse testing', 'Show trace', 'Quit to title']; // Edit 86: options and controls live here, not under the screen
  const PAUSE_STORY = ['Resume', 'Story map', 'Options', 'Controls', 'Show trace', 'Quit to title']; // Edit 81: no restart or refusal in the story
  const pauseItems = () => (app.mode === 'story' ? PAUSE_STORY : PAUSE_ITEMS);
  const END_ITEMS = ['Play again from district 1', 'Choose a district', 'Show trace'];
  const SHOP_GRID = ABIL ? Object.keys(TRACKS).map((t) => [t]) // Edit 78: one card per track (Battery A, Legs B, Arms X, Throw Y); A buys its next level
    : FOUR ? [['spine'], ['jump', 'ricochet'], ['carry', 'throw'], ['bigBattery']] : [['hips', 'spine'], ['carry', 'throw'], ['bigBattery']]; // Edit 75: Legs (Jump, Ricochet); Hips leaves (DIRECT, D48)
  const SHOP_ROWS = ABIL ? 1 : 2; // the deploy row sits below the last card row
  const nextLevel = (s, t) => { const L = s.tier(t) + 1; return L <= (ABIL4 ? s.trackMax(t) : s.P['abilities.maxLevel']) ? t + L : null; }; // Edit 78: the node a track's card sells
  const NODE = (n) => (ABIL && NODES7[n]) || NODES[n];
  const nodeDesc = (n) => (ABIL && NODES7[n] && NODES7[n].desc) || (FOUR && NODES4 && NODES4[n] && NODES4[n].desc) || NODES[n].desc;
  function handleMenus() {
    const s = app.sim;
    const live = app.screen === 'game' && !app.paused && s && (s.phase === 'play' || s.phase === 'hitstop' || s.phase === 'writeoff' || s.phase === 'scroll');
    if (live) {
      for (const m of menuQ) if (m === 'pause' && s.phase === 'play') { app.paused = true; app.pauseSel = 0; app.confirmRefuse = false; app.pausePage = null; }
      menuQ.length = 0;
      return;
    }
    if (app.screen === 'loading') { menuQ.length = 0; return; }
    while (menuQ.length) {
      const m = menuQ.shift();
      if (app.credits) { if (m === 'ok' || m === 'back' || m === 'pause') app.credits = false; continue; } // Edit 95 (P8): the Credits card closes on A, B or Start
      if (app.screen === 'intro') { if (m === 'ok' || m === 'pause') { app.screen = 'title'; app.titleSel = 0; } continue; } // Edit 98 (P8.3): START
      if (app.screen === 'splash') { if ((m === 'ok' || m === 'pause' || m === 'back') && app.realT - app.splashT0 > 0.4) { toStoryMap(); return; } continue; } // Edit 98 (P8.3)
      if (app.screen === 'title' && STORY) { // Edit 81: ARCADE or STORY. Edit 88: STORY opens the save screen
        const items = titleItems();
        if (m === 'back' && INTRO) { app.screen = 'intro'; continue; } // Edit 98 (P8.3): back to the intro screen
        if (m === 'up' || m === 'left') app.titleSel = (app.titleSel + items.length - 1) % items.length;
        else if (m === 'down' || m === 'right') app.titleSel = (app.titleSel + 1) % items.length;
        else if (m === 'ok') { const it = items[app.titleSel] || 'ARCADE'; if (it === 'CREDITS') app.credits = true; else if (it === 'HIGH SCORES') openScores('title', 0); else if (it === 'ARCADE') { app.mode = 'arcade'; app.screen = 'arcade'; } else toSaves(); } // Edit 97 (P8.2): the high scores
        continue;
      }
      if (app.screen === 'saves') { if (app.nameEntry) nameMenu(m); else savesMenu(m); if (app.screen !== 'saves') return; continue; } // Edit 88
      if (app.screen === 'scores') { if (app.nameEntry) nameMenu(m); else scoresMenu(m); if (app.screen !== 'scores') return; continue; } // Edit 97 (P8.2)
      if (app.screen === 'storymap') { // Edit 81: the Test City; the cursor reads any tile's tale; A deploys to the tile in test
        const cur = app.mapSel || storyCursor(), pr = app.story;
        if (m === 'back') { toSaves(); continue; } // Edit 88: back to the save screen
        if (m === 'left' || m === 'right') app.mapSel = [(cur[0] + (m === 'right' ? 1 : 8)) % 9, cur[1]];
        else if (m === 'up' || m === 'down') app.mapSel = [cur[0], (cur[1] + (m === 'down' ? 1 : 2)) % 3];
        else if (m === 'ok' && pr && !pr.complete) { startStory(); return; }
        continue;
      }
      if (app.screen === (STORY ? 'arcade' : 'title')) {
        if (m === 'back' && STORY) { app.screen = 'title'; continue; }
        if (m === 'up') app.level = (app.level + LEVEL_LIST.length - 1) % LEVEL_LIST.length;
        else if (m === 'down') app.level = (app.level + 1) % LEVEL_LIST.length;
        else if (m === 'left') app.difficulty = Math.max(0, app.difficulty - 1);
        else if (m === 'right') app.difficulty = Math.min(DIFFICULTIES.length - 1, app.difficulty + 1);
        else if (m === 'ok') { startLevel(app.level); return; }
        continue;
      }
      if (app.paused && app.touchEdit) { if (m === 'pause' || m === 'back' || m === 'ok') touchEditEnd(); continue; } // Edit 87: placing the touch controls
      if (app.paused && app.pausePage) { // Edit 86: a page of the pause menu (Options, Controls); B or ESC returns
        if (m === 'pause' || m === 'back') { app.pausePage = null; continue; }
        if (app.pausePage === 'controls') { // Edit 87: on touch, adjust or reset the layout here
          const CI = controlItems();
          if (m === 'up') app.ctlSel = ((app.ctlSel || 0) + CI.length - 1) % CI.length;
          else if (m === 'down') app.ctlSel = ((app.ctlSel || 0) + 1) % CI.length;
          else if (m === 'ok') { const it = CI[app.ctlSel || 0]; if (it === 'Adjust layout') touchEditStart(); else if (it === 'Reset layout') { app.touchCfg = null; saveTouchCfg(); TOUCH.L = null; toast('Touch controls reset'); } else app.pausePage = null; }
          continue;
        }
        const OI = optionItems();
        if (m === 'up') app.optSel = (app.optSel + OI.length - 1) % OI.length;
        else if (m === 'down') app.optSel = (app.optSel + 1) % OI.length;
        else if (m === 'ok') optionDo(OI[app.optSel]);
        continue;
      }
      if (app.paused) {
        const PI = pauseItems();
        if (m === 'up') { app.pauseSel = (app.pauseSel + PI.length - 1) % PI.length; app.confirmRefuse = false; }
        else if (m === 'down') { app.pauseSel = (app.pauseSel + 1) % PI.length; app.confirmRefuse = false; }
        else if (m === 'pause' || m === 'back') { app.paused = false; }
        else if (m === 'ok') {
          const item = PI[app.pauseSel];
          if (item === 'Resume') app.paused = false;
          else if (item === 'Story map') { toStoryMap(); return; }
          else if (item === 'Restart level') { startLevel(app.level); return; }
          else if (item === 'Refuse testing') {
            if (s.run.writeOffs < 1) toast(copy('toast.refusal-locked', 'Refusal opens after one completed body'));
            else if (!app.confirmRefuse) app.confirmRefuse = true;
            else { s.withdraw(); app.paused = false; }
          } else if (item === 'Show trace') showTrace();
          else if (item === 'Options') { app.pausePage = 'options'; app.optSel = 0; }
          else if (item === 'Controls') { app.pausePage = 'controls'; app.ctlSel = 0; }
          else if (item === 'Quit to title') { if (app.mode === 'story') saveStory(); app.screen = 'title'; app.sim = null; app.paused = false; }
        }
        continue;
      }
      if (!s) continue;
      if (s.phase === 'brief' && m === 'ok') { s.continueBrief(); clearEdges(); return; } // Edit 81: the tile card
      if (s.phase === 'unveil') { if (m === 'ok' && unveilReady()) { s.continueUnveil(); fx.unveil = null; app.endSel = 0; clearEdges(); Snd.tone(660, 990, 0.1, 'triangle', 0.05); return; } continue; } // Edit 94 (P7.13): A goes on to the ship; manual review: once the cloth is off
      if (s.phase === 'gift') { if (m === 'ok' && giftReady()) { s.continueGift(); fx.gift = null; clearEdges(); Snd.tone(660, 990, 0.1, 'triangle', 0.05); return; } continue; } // Edit 84: the gift screen
      if (s.phase === 'report' && m === 'ok') s.continueReport();
      else if (s.phase === 'shop') {
        const nc = SHOP_GRID.length, colLen = () => SHOP_GRID[app.shopCol].length;
        if (STORY && ABIL4 && (m === 'left' || m === 'right' || m === 'up' || m === 'down')) wsMove(m); // Edit 89: the workshop, around the chassis
        else if (m === 'left' || m === 'right') { app.shopCol = (app.shopCol + (m === 'right' ? 1 : -1) + nc) % nc; if (app.shopRow < SHOP_ROWS && app.shopRow >= colLen()) app.shopRow = colLen() - 1; }
        else if (m === 'up') app.shopRow = app.shopRow === SHOP_ROWS ? colLen() - 1 : Math.max(0, app.shopRow - 1);
        else if (m === 'down') app.shopRow = app.shopRow + 1 >= colLen() ? SHOP_ROWS : app.shopRow + 1;
        else if (m === 'back') { s.leaveShop(); clearEdges(); return; }
        else if (m === 'ok') {
          if (app.shopRow === SHOP_ROWS) { s.leaveShop(); clearEdges(); return; }
          if (ABIL) { const t = SHOP_GRID[app.shopCol][0], n = nextLevel(s, t); if (n) s.buy(n); else s.emit('purchase-denied', { node: t, why: 'max' }); }
          else s.buy(SHOP_GRID[app.shopCol][app.shopRow]);
        }
      } else if (s.phase === 'ending') {
        const items = endItems(s);
        if (m === 'up') app.endSel = (app.endSel + items.length - 1) % items.length;
        else if (m === 'down') app.endSel = (app.endSel + 1) % items.length;
        else if (m === 'ok') {
          const it = items[app.endSel];
          if (it === 'Retry this district') { const rs = app.roads.slice(); startLevel(app.level, app.roadCarry); app.roads = rs; return; }
          if (it === 'Play this district again') { startLevel(app.level); return; } // Edit 81: Arcade, one district a run
          if (it === 'Credits') { app.credits = true; return; } // Edit 95 (P8)
          if (it === 'High scores') { openScores('game', hsTabOf(app.hsLast ? app.hsLast.key : app.mode === 'story' ? 'story' : 'arcade:' + s.levelId)); return; } // Edit 97 (P8.2)
          if (it === 'Name this score') { openScores('game', hsTabOf(app.hsLast.key)); nameStartScore(); return; }
          if (it === 'Story map') { toStoryMap(); return; }
          if (it === 'Quit to title') { app.screen = 'title'; app.sim = null; return; }
          if (it === 'Play again from district 1') { startLevel(0); return; }
          if (it === 'Choose a district') { app.screen = STORY ? 'arcade' : 'title'; app.sim = null; return; }
          if (it === 'Replay this level') { startLevel(app.level); return; }
          if (it === 'Choose another level') { app.screen = 'title'; app.sim = null; return; }
          showTrace();
        }
      }
    }
    q.a = q.b = q.bUp = 0;
  }


  // ---------- type budget (GDD §4.2.3). Reference units: the 1280 × 720 canvas. B612 cap height = 0.75 em (measured).
  const CAP = 0.75;
  const TY = { lb: Math.round(pv('ui.typeLoadBearing') / CAP), sec: Math.ceil(pv('ui.typeSecondary') / CAP) };
  const fNum = '700 ' + TY.lb + 'px ' + F_MONO, fBig = '700 ' + TY.lb + 'px ' + F_UI;
  const fLab = '700 ' + TY.sec + 'px ' + F_UI, fTxt = '400 ' + TY.sec + 'px ' + F_UI, fKey = '700 ' + TY.sec + 'px ' + F_MONO;

  // ---------- frame theme: FARSIGHT glass by day; dark glass and LED edges by night (same layout, same type)
  const FT = PIX.NAME !== 'day' ? {
    bg: ['#05070D', '#0A0F1C', '#121B33'], glow: 'rgba(63,208,255,0.22)', glow2: 'rgba(155,107,255,0.18)', panelTop: 'rgba(20,30,56,0.94)', panelBot: 'rgba(8,12,24,0.94)',
    edge: 'rgba(63,208,255,0.85)', gloss: 'rgba(255,255,255,0.12)', text: '#F4F8FA', dim: '#9FB8C8', accent: '#3FD0FF', brand: '#3FD0FF', bezel: '#0B0F1A',
    keyTop: '#1C2A4A', keyBot: '#0E1528', veil: 'rgba(5,8,16,0.62)', track: '#1E2638', sel: '#1840C8', selText: '#FFFFFF', item: 'rgba(255,255,255,0.06)',
    itemEdge: 'rgba(127,168,188,0.5)', off: '#5E7080', banner: 'rgba(10,16,32,0.94)', toast: 'rgba(24,64,200,0.92)', credit: 'rgba(245,197,66,0.16)', neon: true,
  } : {
    bg: ['#EAF6FB', '#D6ECF4', '#C3E1EC'], glow: 'rgba(255,255,255,0.8)', glow2: null, panelTop: 'rgba(255,255,255,0.97)', panelBot: 'rgba(236,247,252,0.95)',
    edge: 'rgba(79,195,232,0.8)', gloss: 'rgba(255,255,255,0.9)', text: C.primary, dim: C.ink2, accent: C.aquaDeep, brand: C.aquaDeep, bezel: '#F7FBFD',
    keyTop: '#FFFFFF', keyBot: '#DCEFF6', veil: 'rgba(232,244,249,0.62)', track: '#E2EAEE', sel: C.aqua, selText: '#06202B', item: 'rgba(255,255,255,0.8)',
    itemEdge: '#C9D5DB', off: '#8C9AA4', banner: 'rgba(255,255,255,0.94)', toast: 'rgba(16,20,23,0.86)', credit: 'rgba(245,197,66,0.3)', neon: false,
  };
  // ---------- drawing helpers (frame layer, reference units)
  function rr(x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function txt(s, x, y, font, color, align, base) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.textBaseline = base || 'alphabetic'; ctx.fillText(s, x, y);
  }
  function rgba(hex, a) { const h = (i) => parseInt(hex.slice(i, i + 2), 16); return 'rgba(' + h(1) + ',' + h(3) + ',' + h(5) + ',' + Math.max(0, a) + ')'; }
  function roleC(r) { return r === 'glass' ? '#FFFFFF' : r === 'aquaDeep' ? FT.accent : C[r] || null; }
  function panel(x, y, w, h, opts) { // FARSIGHT glass (frame layer only)
    const R = 12;
    ctx.save();
    ctx.shadowColor = 'rgba(16,40,56,0.16)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
    rr(x, y, w, h, R);
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, FT.panelTop); g.addColorStop(1, (opts && opts.tint && !FT.neon && opts.tint) || FT.panelBot);
    ctx.fillStyle = g; ctx.fill(); ctx.restore();
    if (FT.neon) { ctx.save(); ctx.shadowColor = FT.edge; ctx.shadowBlur = 10; }
    rr(x + 0.75, y + 0.75, w - 1.5, h - 1.5, R); ctx.strokeStyle = FT.edge; ctx.lineWidth = 1.5; ctx.stroke();
    if (FT.neon) ctx.restore();
    ctx.save(); rr(x + 2, y + 2, w - 4, Math.min(22, h / 3), R - 2); ctx.clip();
    const hg = ctx.createLinearGradient(0, y, 0, y + 22); hg.addColorStop(0, FT.gloss); hg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = hg; ctx.fillRect(x, y, w, 24); ctx.restore();
  }
  function glassKey(x, y, w, h) {
    rr(x, y, w, h, 8);
    const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, FT.keyTop); g.addColorStop(1, FT.keyBot);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = FT.edge; ctx.lineWidth = 1.5; ctx.stroke();
  }
  function fmtT(t) { const m = Math.floor(t / 60), s = Math.floor(t % 60); return m + ':' + String(s).padStart(2, '0'); }
  function num(v) { return Math.round(v).toLocaleString('en-GB'); }
  function wrapLines(str, w, font) {
    ctx.font = font; const out = []; let line = '';
    for (const wd of String(str).split(' ')) { const t = line ? line + ' ' + wd : wd; if (ctx.measureText(t).width > w && line) { out.push(line); line = wd; } else line = t; }
    if (line) out.push(line);
    return out;
  }
  function wrapText(str, x, y, w, lh, font, color, max, align) {
    const lines = wrapLines(str, w, font).slice(0, max || 9);
    lines.forEach((l, i) => txt(l, x, y + i * lh, font, color, align));
    return lines.length;
  }
  function drawKeys(items, cx, y) { // key caps and actions at ui.typeSecondary
    ctx.font = fKey; const kw = items.map((it) => ctx.measureText(it[0]).width + 20);
    ctx.font = fLab; const aw = items.map((it) => ctx.measureText(it[1]).width);
    const gap = 10, sep = 30, total = kw.reduce((a, b) => a + b, 0) + aw.reduce((a, b) => a + b, 0) + items.length * gap + (items.length - 1) * sep;
    let x = cx - total / 2;
    items.forEach((it, i) => {
      glassKey(x, y, kw[i], 32); txt(it[0], x + kw[i] / 2, y + 24, fKey, FT.text, 'center'); x += kw[i] + gap;
      txt(it[1], x, y + 24, fLab, FT.dim); x += aw[i] + sep;
    });
  }

  // ---------- pixel field: 400 × 300 art grid, composited at ×2 reference units, so whole device pixels per art pixel
  const U = PIX.U, K = PIX.K, AW = PIX.AW, AH = PIX.AH;
  if (pv('ui.artScale') !== U || pv('ui.playWidth') / U !== AW) console.warn('P3 art grid expects ui.artScale = 2 and a 400 × 320 field');
  const art = document.createElement('canvas'); art.width = AW; art.height = AH;
  const actx = art.getContext('2d'), aimg = actx.createImageData(AW, AH), a32 = new Uint32Array(aimg.data.buffer);
  const MAIN = new PIX.Buf(AW, AH), DL = new PIX.Buf(AW, AH); // DL: the deck layer, drawn on the footprint and lifted on composite
  let FB = MAIN; DL.layer = true;
  const ALL = () => true;
  const toA = (pts) => pts.map((q) => [q[0] / U, q[1] / U]);
  const EXT = (h) => Math.round(h * pv('proto.art.extrusion') / U); // object height drawn as a screen-up offset, art px
  const artCache = new Map();
  function levelArt(s) {
    const id = (s.level.key || s.level.id) + (s.P['proto.city'] ? ':city' : '') + ':' + (s.P['proto.district.seed'] || 0) + ':' + (s.P['world.puddleShare']) + (s.level.blockedEdges ? ':edges' : '');
    if (!artCache.has(id)) {
      const P = s.P, L = s.level, gen = L.cell && L.theme !== 'start';
      const gr = PIX.ground(L, P, gen ? 1000 + L.cell[0] * 37 + L.cell[1] * 101 + LEVEL_LIST.indexOf(L.id) * 7 : 7 + LEVEL_LIST.indexOf(id) * 31), leds = PIX.PAL.bldgLed;
      const zL = (z) => EXT(zHeight(P, z)), fl = L.floors || [], half = P['world.deckWidth'] / 2;
      const roofSpec = (st) => { // Edit 44: a platform's ledges and openings (stair heads, skybridges), art px along each side
        const ri = fl.findIndex((f) => f.kind === 'roof' && f.bx === st.x && f.by === st.y);
        if (ri < 0) return null;
        const f = fl[ri], open = [], rel = (sd, a0, a1) => { const o = sd === 'N' || sd === 'S' ? st.x : st.y; open.push([sd, Math.round((a0 - o) / U), Math.round((a1 - o) / U)]); };
        for (const q of L.stairs || []) if (q.head === ri) { const sd = q.axis === 'x' ? (q.high <= st.x + 1 ? 'W' : 'E') : (q.high <= st.y + 1 ? 'N' : 'S'); if (q.axis === 'x') rel(sd, q.y, q.y + q.h); else rel(sd, q.x, q.x + q.w); }
        for (const g of fl) if (g.kind === 'bridge' && (g.ends || []).includes(ri)) { if (g.axis === 'x') rel(g.x < st.x ? 'W' : 'E', g.y, g.y + g.h); else rel(g.y < st.y ? 'N' : 'S', g.x, g.x + g.w); }
        return { ledges: f.ledges.map((lg) => lg.side), open };
      };
      const sprite = (st, i0) => {
        const w = Math.round(st.w / U), h = Math.round(st.h / U), i = st.art != null ? st.art : i0; // Edit 48: a building across a shared edge draws the same on both screens
        if (st.kind === 'block' && st.platform) return PIX.building(w, h, zL(2), PIX.rng(311 + i * 17), PIX.c32(leds[i % leds.length]), st.storeys, roofSpec(st) || { ledges: [], open: [] }); // Edit 44: roof at Z2
        if (st.kind === 'block') return st.storeys ? PIX.building(w, h, st.storeys * EXT(P['world.storeyHeight']), PIX.rng(311 + i * 17), PIX.c32(leds[i % leds.length]), st.storeys) // Edit 43: by storeys
          : PIX.building(w, h, EXT(st.height), PIX.rng(311 + i * 17), PIX.c32(leds[i % leds.length]));
        if (st.deck) return null; // deck columns are drawn with their deck
        if (st.kind === 'monument') return PIX.monument(w, h, EXT(st.height));
        if (st.kind === 'fountain') return PIX.fountain(w, h, EXT(st.height));
        if (st.kind === 'jersey') return PIX.jersey(w, h, EXT(P['proto.art.barrierHeight']));
        if (st.kind === 'barrier') return PIX.barrier(w, h, EXT(P['proto.art.barrierHeight']));
        if (st.kind === 'wall') return PIX.wall(w, h, EXT(st.height)); // Edit 42: the district's bounds
        if (st.kind === 'booth') return PIX.booth(w, h, EXT(st.height));
        if (st.kind === 'river') return null; // the canal in the ground art is the river
        return PIX.pod(w, h, EXT(P[st.kind === 'crate' ? 'proto.art.crateHeight' : 'proto.art.pillarHeight']), i);
      };
      const deckAt = (st) => (L.decks || []).find((dk) => (dk.hz ? Math.abs(st.y + st.h / 2 - dk.off) : Math.abs(st.x + st.w / 2 - dk.off)) < half);
      const blockOf = (ri) => L.statics.find((q) => q.kind === 'block' && fl[ri] && q.x === fl[ri].bx && q.y === fl[ri].by);
      artCache.set(id, { ground: gr, statics: L.statics.map((st, i) => ({ st, spr: sprite(st, i) })).filter((o) => o.spr), decks: (L.decks || []).map((dk) => Object.assign({ dk }, PIX.deck(dk, P))),
        up: (L.stairs || []).map((st) => ({ st, spr: PIX.stairs(st, zL(st.from), zL(st.to)) })), // Edit 44: every flight, foot to head
        cols: L.statics.filter((st) => st.deck && st.kind === 'pillar').map((st) => { const dk = deckAt(st); return { st, spr: PIX.column(Math.round(st.w / U), Math.round(st.h / U), EXT(dk ? dk.height : P['world.deckHeight'])) }; }),
        bridges: fl.map((f, i) => ({ f, i })).filter((o) => o.f.kind === 'bridge').map(({ f, i }) => ({ f, i, key: Math.max(...(f.ends || []).map((ri) => { const q = blockOf(ri); return q ? q.y + q.h : f.y + f.h; })) + 0.5,
          spr: PIX.skybridge(Math.round(f.w / U), Math.round(f.h / U), zL(2), f.axis === 'x') })) });
    }
    return artCache.get(id);
  }
  function flush() { a32.set(FB.d); actx.putImageData(aimg, 0, 0); }
  function carSpr(s, c, braking) { return PIX.car(c.cls, Math.round(c.L / U), Math.round(c.W / U), EXT(s.P['vehicles.' + c.cls + '.height']), c.h, braking); }
  function shortId(m) { const fm = FMODEL.get(m); if (fm) return fm.tag; const t = String(m).toUpperCase(), a = t.match(/[A-Z]/), d = t.match(/\d+/); return ((a ? a[0] : '') + (d ? d[0] : '')).slice(0, 3); } // GDD 4.2.2: three characters
  function coneLift(cn) { return cn.state === 'flight' ? 10 * Math.sin(Math.PI * clamp(1 - cn.flightT / (cn.flightDur || 1), 0, 1)) : 0; }
  function coneFn(s) { // the dummy's view cone, as an art-pixel predicate
    const P = s.P, b = s.body, R = P['sensing.coneReach'], hw = s.coneWidth() * DEG / 2; // head damage narrows it
    return (x, y) => {
      const dx = (x + 0.5) * U - b.x, dy = (y + 0.5) * U - b.y;
      if (dx * dx + dy * dy > R * R) return false;
      const a = Math.atan2(dy, dx) - b.facing;
      return Math.abs(Math.atan2(Math.sin(a), Math.cos(a))) <= hw;
    };
  }
  function rotRect(x, y, h, L, W) { const ca = Math.cos(h), sa = Math.sin(h); return [[-L / 2, -W / 2], [L / 2, -W / 2], [L / 2, W / 2], [-L / 2, W / 2]].map(([u, v]) => [x + u * ca - v * sa, y + u * sa + v * ca]); }
  function arcPoly(cx, cy, R, a0, a1, n) { const out = [[cx, cy]]; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } return out; }
  function mixOnce(pts, c, a) { const seen = new Set(); for (const [x, y] of pts) { const k = x + y * 1024; if (!seen.has(k)) { seen.add(k); FB.mix(x, y, c, a); } } }

  function corridorPts(s, c) {
    const P = s.P, hw = c.W / 2 + P['body.radius'];
    if (P['proto.sensorStraight']) {
      const ca = Math.cos(c.h), sa = Math.sin(c.h);
      return [[c.L / 2, -hw], [c.L / 2 + c.fwdLen, -hw], [c.L / 2 + c.fwdLen, hw], [c.L / 2, hw]].map(([u, v]) => [c.x + u * ca - v * sa, c.y + u * sa + v * ca]);
    }
    const s0 = c.s + c.L / 2, s1 = Math.min(c.path.length, s0 + c.fwdLen);
    if (s1 <= s0) return null;
    const left = [], right = [];
    for (let sv = s0; ; sv += 10) {
      const sx = Math.min(sv, s1), p = pathAt(c.path, sx);
      left.push([p.x + p.nx * (c.d - hw), p.y + p.ny * (c.d - hw)]); right.push([p.x + p.nx * (c.d + hw), p.y + p.ny * (c.d + hw)]);
      if (sx >= s1) break;
    }
    return left.concat(right.reverse());
  }
  function blindSpots(s, c) {
    const nx = c.x + Math.cos(c.h) * c.L / 2, ny = c.y + Math.sin(c.h) * c.L / 2, out = [], reach = c.fwdLen + 160;
    const add = (pts) => {
      let lo = null, hi = null;
      for (const p of pts) {
        let a = Math.atan2(p[1] - ny, p[0] - nx) - c.h; while (a > Math.PI) a -= TAU; while (a < -Math.PI) a += TAU;
        if (Math.abs(a) > Math.PI * 0.92) return;
        if (!lo || a < lo.a) lo = { a, p }; if (!hi || a > hi.a) hi = { a, p };
      }
      const far = (p) => { const dx = p[0] - nx, dy = p[1] - ny, l = Math.hypot(dx, dy) || 1; return [nx + dx / l * 700, ny + dy / l * 700]; };
      out.push([lo.p, hi.p, far(hi.p), far(lo.p)]);
    };
    for (const st of s.level.statics) {
      if (Math.hypot(st.x + st.w / 2 - nx, st.y + st.h / 2 - ny) > reach) continue;
      add([[st.x, st.y], [st.x + st.w, st.y], [st.x + st.w, st.y + st.h], [st.x, st.y + st.h]]);
    }
    for (const o of carsOf(s)) {
      if (o === c || (o.cls !== 'van' && o.cls !== 'bus') || Math.hypot(o.x - nx, o.y - ny) > reach) continue; // P5: a bus casts a sensor shadow too
      add(rotRect(o.x, o.y, o.h, o.L, o.W));
    }
    return out;
  }
  // Scanners: forward corridor hatched, side sensors outlined; sensor shadows stay clear (the scan cannot reach there).
  function drawZones(s, c, clip) {
    const P = s.P, hot = !!c.det.fwd || !!(c.hz && c.hz.inPath), cor = corridorPts(s, c);
    const R = P['perception.sideRadius'], ha = P['perception.sideHalfAngle'] * DEG;
    const nx = c.x + Math.cos(c.h) * c.L / 2, ny = c.y + Math.sin(c.h) * c.L / 2;
    const sides = [1, -1].map((sg) => toA(arcPoly(nx, ny, R, c.h + sg * Math.PI / 2 - ha, c.h + sg * Math.PI / 2 + ha, 16)));
    const corA = cor ? toA(cor) : null, blinds = blindSpots(s, c).map(toA);
    const open = (x, y) => clip(x, y) && !blinds.some((bp) => PIX.inPoly(bp, x + 0.5, y + 0.5));
    if (corA) {
      const m = hot ? 3 : 4;
      PIX.fillPoly(corA, (x, y) => { if ((x + y) % m === 0 && open(x, y)) FB.put(x, y, K.label); });
      PIX.polyline(corA.concat([corA[0]]), (x, y) => { if (open(x, y)) FB.put(x, y, hot ? K.ink : K.label); });
    }
    for (const sp of sides) {
      if (c.det.side) PIX.fillPoly(sp, (x, y) => { if (x % 3 === 0 && y % 3 === 0 && open(x, y)) FB.put(x, y, K.label); });
      PIX.polyline(sp.concat([sp[0]]), (x, y, i) => { if (i % 4 < 2 && open(x, y)) FB.put(x, y, K.label); });
    }
    if (!blinds.length || P['ui.cueKey.simple']) return; // Edit 99 (P8.4): sensor shadows stay clear of hatch, without an outline
    const inSensor = (x, y) => (corA && PIX.inPoly(corA, x + 0.5, y + 0.5)) || sides.some((sp) => PIX.inPoly(sp, x + 0.5, y + 0.5));
    for (const bp of blinds) PIX.polyline(bp.concat([bp[0]]), (x, y, i) => { if (i % 3 === 0 && x >= 0 && y >= 0 && x < AW && y < AH && clip(x, y) && inSensor(x, y)) FB.put(x, y, K.ink); });
  }
  function drawPath(s, c, clip) {
    let pts = null, provisional = false;
    if (c.man && c.state === 'committed') pts = s.predict(c, c.man, s.t, c.man.until);
    else if (c.intent && c.state === 'intention') {
      provisional = true;
      const span = c.intent.type === 'shift' ? c.intent.len / Math.max(c.v, 40) + 0.3 : s.P['traffic.commitHorizon'];
      pts = s.predict(c, Object.assign({ t0: s.t }, c.intent), s.t, s.t + span);
    }
    if (!pts || pts.length < 2) return;
    PIX.polyline(pts.map((p) => [p.x / U, p.y / U]), (x, y, i) => {
      if (!clip(x, y)) return;
      if (provisional ? i % 4 === 0 : i % 5 < 3) FB.put(x, y, provisional ? K.label : K.ink);
    });
    if (!provisional && c.man && c.man.standoff) { // STOP line: warning ink with a dark outline (Edit 37 §4.1.4)
      const q = pathAt(c.path, c.man.sStop + c.L / 2), hw = c.W / 2 + 10;
      const pa = PIX.collectLine((q.x + q.nx * (c.d - hw)) / U, (q.y + q.ny * (c.d - hw)) / U, (q.x + q.nx * (c.d + hw)) / U, (q.y + q.ny * (c.d + hw)) / U);
      PIX.stamp(FB, pa.filter(([x, y]) => clip(x, y)), K.warn, K.cueHalo);
    }
  }
  // P2.2 stop bracket: where the nose stops if the dummy steps in now and the car sees it.
  function drawStopCue(s, c) {
    const P = s.P;
    if (!P['proto.stopCue'] || c.v < 5 || (c.man && (c.man.type === 'reverse' || c.man.standoff))) return;
    const braking = !!(c.man && c.man.type === 'brake');
    const covering = (c.nearT || 0) - (c.pathT || 0) >= P['perception.reactionDelay'] - 1e-9;
    const react = braking ? 0 : Math.max(0, (covering ? P['proto.driver.coveredReaction'] : P['perception.reactionDelay']) - (c.pathT || 0));
    const sN = c.s + c.L / 2 + c.v * react + c.v * c.v / (2 * P['traffic.hardBraking']);
    if (sN > c.path.length) return;
    const q = pathAt(c.path, sN), d = s.plannedD(c, sN), hw = c.W / 2 + 4, k = 6, cx = q.x + q.nx * d, cy = q.y + q.ny * d;
    if (cx < -10 || cx > FW + 10 || cy < -10 || cy > FH + 10) return;
    PIX.polyline([[cx + q.nx * hw - q.tx * k, cy + q.ny * hw - q.ty * k], [cx + q.nx * hw, cy + q.ny * hw], [cx - q.nx * hw, cy - q.ny * hw], [cx - q.nx * hw - q.tx * k, cy - q.ny * hw - q.ty * k]]
      .map((p) => [p[0] / U, p[1] / U]), (x, y) => FB.put(x, y, K.label));
  }
  function drawViewEdges(s) {
    const b = s.body, hw = s.coneWidth() * DEG / 2;
    for (const sg of [-1, 1]) PIX.line(b.x / U, b.y / U, (b.x + Math.cos(b.facing + sg * hw) * 1200) / U, (b.y + Math.sin(b.facing + sg * hw) * 1200) / U,
      (x, y, i) => { if (i > 9 && i % 4 === 0) FB.mix(x, y, K.ink, 0.45); });
  }
  // Generated tyre marks (content/juice.json states.brakeMarks): matte, under every cue.
  function markCar(c, braking) {
    const bm = CJ && CJ.states && CJ.states.brakeMarks;
    if (!bm) return;
    const ca = Math.cos(c.h), sa = Math.sin(c.h), wheels = [-1, 1].map((sd) => { const u = -c.L / 2 + 6, v = sd * (c.W / 2 - 4); return [c.x + u * ca - v * sa, c.y + u * sa + v * ca]; });
    if (braking && c.v > jv(bm.minSpeed) && c._mk && Math.hypot(wheels[0][0] - c._mk[0][0], wheels[0][1] - c._mk[0][1]) > 1.5) {
      for (let i = 0; i < 2; i++) fx.marks.push({ a: c._mk[i], b: wheels[i], t: app.realT });
      const mx = Math.max(2, Math.round(jv(bm.max)));
      if (fx.marks.length > mx) fx.marks.splice(0, fx.marks.length - mx);
    }
    c._mk = wheels;
  }
  function drawMarks() {
    const bm = CJ && CJ.states && CJ.states.brakeMarks;
    if (!bm || !fx.marks.length) return;
    const fade = jv(bm.fadeSeconds) || 1, al = jv(bm.alpha);
    fx.marks = fx.marks.filter((m) => app.realT - m.t < fade);
    for (const m of fx.marks) PIX.line(m.a[0] / U, m.a[1] / U, m.b[0] / U, m.b[1] / U, (x, y) => FB.mix(x, y, K.tyre, al * (1 - (app.realT - m.t) / fade)));
  }
  // ----- Edit 44 levels: Z0 ground, Z1 low highway, Z2 high highway, platform roofs and skybridges
  const carsOf = (s) => s.view || s.cars; // P5.3: the screen's cars and those next door reaching onto it
  const lay = (c) => (c.layer == null ? 0 : c.layer);
  const zLift = (s, z) => EXT(zHeight(s.P, z || 0)); // art px a level is drawn above its footprint
  function bodyFloor(s) { const b = s.body; return b.floor != null ? (s.level.floors || [])[b.floor] || null : null; }
  function onFloor(s, kind) { const b = s.body, f = bodyFloor(s); return b.alive && !b.stair && b.mode !== 'drop' && b.level > 0 && !!f && (!kind || f.kind === kind); }
  function onDeck(s) { return onFloor(s, 'deck'); }
  function onGroundDraw(s) { const b = s.body; return b.alive && b.level === 0 && !b.stair && b.mode !== 'drop'; }
  function stairDeck(s, st) { const fl = s.level.floors || []; return st.deck != null ? st.deck : st.foot != null && fl[st.foot] ? fl[st.foot].deck : null; } // the deck a flight is drawn with
  function cueLevel(s) { // cues and tags show for cars on the dummy's level; on a stair, the level it is nearer; falling, where it lands
    const b = s.body;
    if (!b.alive) return 0;
    if (b.stair) return s.stairT(b.stair, b.x, b.y) > 0.5 ? b.stair.to : b.stair.from;
    return b.mode === 'drop' && b.drop ? b.drop.toZ : b.level;
  }
  function cueDeck(s) { // the deck whose traffic can meet the dummy, if any
    const b = s.body, fl = s.level.floors || [];
    let f = null;
    if (b.stair) f = s.stairT(b.stair, b.x, b.y) > 0.5 ? fl[b.stair.head] : b.stair.foot != null ? fl[b.stair.foot] : null;
    else if (b.mode === 'drop' && b.drop) f = b.drop.toFloor != null ? fl[b.drop.toFloor] : null;
    else f = bodyFloor(s);
    return f && f.kind === 'deck' ? f.deck : null;
  }
  function bodyLift(s) {
    const b = s.body;
    if (!b.alive) return 0;
    if (b.mode === 'drop' && b.drop) { const f = clamp(b.drop.t / b.drop.T, 0, 1), hi = zLift(s, b.drop.fromZ), lo = zLift(s, b.drop.toZ); return Math.round(lo + (hi - lo) * (1 - f * f)); } // falls
    if (b.stair) { const a = zLift(s, b.stair.from), c = zLift(s, b.stair.to); return Math.round(a + (c - a) * clamp(s.stairT(b.stair, b.x, b.y), 0, 1)); }
    return zLift(s, b.level);
  }
  function deckOf(s, c) { const ln = s.level.deckLanes && s.level.deckLanes[c.lane - 2]; return ln ? ln.deck : -1; }
  function carShadow(s, c) { const P = s.P, k = P['proto.art.shadowScale'], h = P['vehicles.' + c.cls + '.height']; PIX.fillPoly(toA(rotRect(c.x + PIX.SUN.x * h * k, c.y + PIX.SUN.y * h * k, c.h, c.L, c.W)), (x, y) => FB.shade(x, y, 0.72)); }
  function dynShadows(s) { // hard shadows, down-left (multiply); deck actors cast theirs on the deck (drawDeck)
    const P = s.P, k = P['proto.art.shadowScale'], b = s.body, sh = (x, y) => FB.shade(x, y, 0.72);
    const off = (h) => [PIX.SUN.x * h * k, PIX.SUN.y * h * k];
    for (const cn of s.cones) {
      if (cn.state !== 'free' && cn.state !== 'flight') continue;
      const o = off(P['proto.art.coneHeight'] + coneLift(cn)); PIX.disc((cn.x + o[0]) / U, (cn.y + o[1]) / U, Math.round(P['props.cone.radius'] / U), sh);
    }
    for (const c of carsOf(s)) if (lay(c) === 0) carShadow(s, c);
    if (onGroundDraw(s) || (b.alive && b.mode === 'drop' && b.drop && b.drop.toZ === 0)) { const o = off(P['proto.art.dummyHeight']); PIX.ellipse(b.x / U + o[0] / U, b.y / U + 3, 5.5, 2.2, sh); } // falling: the shadow marks the landing
    for (const d of s.drones) {
      const o = off(P['proto.art.droneHeight'] * d.alt), x = (d.x + o[0]) / U, y = (d.y + o[1]) / U, pts = [];
      PIX.line(x - 7, y - 4, x + 7, y + 4, (px, py) => pts.push([px, py])); PIX.line(x - 7, y + 4, x + 7, y - 4, (px, py) => pts.push([px, py]));
      const seen = new Set(); for (const [px, py] of pts) { const kk = px + py * 1024; if (!seen.has(kk)) { seen.add(kk); sh(px, py); } }
    }
  }
  function dropK() { // replacement-chassis drop: 1 at delivery start, 0 on the floor
    const rd = CJ && CJ.states && CJ.states.replacementDrop;
    if (!rd) return 0;
    const dur = jv(rd.seconds) || 0.5, age = app.realT - fx.dropT0;
    return age >= 0 && age < dur ? 1 - age / dur : 0;
  }
  function reachEnd(s) {
    const b = s.body, R = s.reach(), r = s.P['body.radius'], cx = Math.cos(b.facing), cy = Math.sin(b.facing);
    let d = 0;
    for (; d < R; d += 3) {
      const x = b.x + cx * d, y = b.y + cy * d;
      if (s.onGround() && s.level.statics.some((st) => x + r > st.x && x - r < st.x + st.w && y + r > st.y && y - r < st.y + st.h)) { d = Math.max(0, d - 3); break; }
    }
    d = Math.min(d, R);
    return { x: b.x + cx * d, y: b.y + cy * d, short: d < R - 1 };
  }
  // Under the dummy: lunge trace or reach tick, then the charge ring (battery glow, 4.2.2).
  function drawBodyGround(s, lift) {
    const b = s.body, P = s.P, L = lift || 0;
    if (!b.alive) return;
    const cx = Math.round(b.x / U), cy = Math.round(b.y / U) - L;
    if (b.mode === 'lunge' && b.lunge) {
      const pts = []; PIX.line(b.lunge.x0 / U, b.lunge.y0 / U - L, cx, cy, (x, y) => { for (const [i, j] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) pts.push([x + i, y + j]); });
      mixOnce(pts, K.ink, 0.28);
    } else {
      const e = reachEnd(s), nx = -Math.sin(b.facing), ny = Math.cos(b.facing);
      PIX.line((e.x - nx * 6) / U, (e.y - ny * 6) / U - L, (e.x + nx * 6) / U, (e.y + ny * 6) / U - L, (x, y) => FB.put(x, y, K.label));
      if (e.short) for (const p of PIX.circle(2)) FB.put(Math.round(e.x / U) + p[0], Math.round(e.y / U) - L + p[1], K.label);
    }
    const cap = P['battery.capacity'], seg = TAU / cap, gap = 0.28;
    for (const [x, y, a] of PIX.circle(10)) {
      const t = (a + Math.PI / 2) % TAU, i = Math.floor(t / seg), w = t - i * seg;
      if (w < gap / 2 || w > seg - gap / 2) continue;
      const f = clamp(b.charge - i, 0, 1), on = f > 0 && (w - gap / 2) / (seg - gap) <= f;
      if (on) FB.put(cx + x, cy + y, f >= 1 ? K.ink : K.label); else FB.mix(cx + x, cy + y, K.ink, 0.18);
    }
    if (b.denied > 0) for (const p of PIX.circle(12)) FB.put(cx + p[0], cy + p[1], K.warn);
  }
  function drawBodySprite(s, ghostOnly, liftPx) {
    const b = s.body, P = s.P;
    const wear = clamp(1 - b.health / maxHP(s), 0, 1), fl = app.realT - fx.flinchT0;
    let jx = 0, jy = 0;
    if (fl < 0.3) { const k = (1 - fl / 0.3) * 2 * MOTION; jx += Math.round(Math.sin(app.realT * 97) * k); jy += Math.round(Math.cos(app.realT * 83) * k); }
    if (wear > 0.6) jx += Math.round(Math.sin(app.realT * 41) * (wear - 0.6) * 2.5 * MOTION);
    const sb = fx.stumble, sa0 = app.realT - sb.t0;
    if (sa0 < sb.dur && sb.amp) jx += Math.round(Math.sin(sa0 * 22) * sb.amp * 4 * (1 - sa0 / sb.dur) * MOTION);
    if (b.mode === 'knock') jx += Math.round(Math.sin(b.knockT * 38) * 1.5 * MOTION);
    if (b.mode === 'lunge') { jx += Math.round(Math.cos(b.facing)); jy += Math.round(Math.sin(b.facing)); }
    const dk = dropK(), lift = dk ? Math.round(jv(CJ.states.replacementDrop.height) * dk / U / 2) : 0;
    const hop = (liftPx || 0) + (b.mode === 'jump' ? EXT(b.z || 0) : 0); // above the ground: on a deck, a stair, falling from a deck, or in a jump (Edit 75)
    const cx = Math.round(b.x / U) + jx, cy = Math.round(b.y / U) + jy - lift - hop;
    if (dk) PIX.line(cx, cy - 16, cx, -1, (x, y) => FB.mix(x, y, K.ink, 0.5 * dk));
    const S = PIX.dummy(b.facing, Math.min(5, Math.round(wear * 5)));
    b._spr = S; b._sx = cx; b._sy = cy;
    if (ghostOnly) return;
    PIX.blit(FB, S, cx, cy, fl < 0.12 ? K.white : 0);
    if (fl >= 0.12) {
      for (let i = 0; i < Math.floor(wear * 5); i++) { const a = (b.chassis * 2.1 + i * 1.9) % TAU; FB.put(cx + Math.round(Math.cos(a) * 3), cy - 5 + Math.round(Math.sin(a) * 2), K.joint); } // dents
      if (wear > 0.7) { FB.put(cx + 1, cy - 13, K.joint); FB.put(cx, cy - 12, K.joint); FB.put(cx + 1, cy - 11, K.joint); } // cracked head
    }
  }
  // Facing: the single most important mark (4.2.4). Nose vector 1.5 × body width (4.2.2) from the charge ring out,
  // two pixels wide, drawn over everything so the tip clears the sprite in every direction.
  function drawNose(s) {
    const b = s.body;
    if (!b.alive) return;
    const cx = b.x / U, cy = b.y / U - bodyLift(s), ca = Math.cos(b.facing), sa = Math.sin(b.facing), pts = [];
    const add = (x0, y0, x1, y1) => PIX.line(x0, y0, x1, y1, (x, y) => { pts.push([x, y]); pts.push([x + Math.round(-sa), y + Math.round(ca)]); });
    const len = 1.5 * 2 * s.P['body.radius'] / U, tx = cx + ca * len, ty = cy + sa * len;
    add(cx + ca * 11, cy + sa * 11, tx, ty);
    for (const sg of [-1, 1]) add(tx, ty, tx - ca * 5 - sa * sg * 4, ty - sa * 5 + ca * sg * 4);
    for (const [x, y] of pts) FB.put(x, y, K.nose);
  }
  // Edit 99 (P8.4): a car that has noticed the dummy flashes its headlights (proto.art.noticeFlashHz). Noticed: the dummy in its
  // caution zone for perception.reactionDelay (c.nearT), the moment the driver starts to plan round it
  function noticed(s, c) { return !!(c.hz && (c.nearT || 0) >= s.P['perception.reactionDelay'] - 1e-9 && !c.spent); }
  function flashOn(s, c) { const hz = s.P['proto.art.noticeFlashHz']; return hz > 0 && noticed(s, c) && Math.floor((app.realT + ((parseInt(String(c.id).replace(/\D+/g, ''), 10) || 0) % 7) * 0.05) * hz * 2) % 2 === 0; } // cars out of step
  // Edit 99: a car that has hit the dummy is spent: grey outline, body dimmed (proto.art.spentGrey)
  const spentArt = new Map(), SPENT_RIM = PIX.c32('#7C8696'), SPENT_RIM_D = PIX.c32('#3A3F48');
  function greyCar(S) {
    if (spentArt.has(S)) return spentArt.get(S);
    const mix = (c, t) => { const r = c & 255, g = (c >>> 8) & 255, b = (c >>> 16) & 255, g0 = 0x8A, k = t; return (0xFF000000 | (Math.round(b + (g0 - b) * k) << 16) | (Math.round(g + (g0 - g) * k) << 8) | Math.round(r + (g0 - r) * k)) >>> 0; };
    const d = new Uint32Array(S.d.length);
    for (let i = 0; i < d.length; i++) { const c = S.d[i]; d[i] = !c ? 0 : c === K.carRim || (!K.carRim && c === K.fleetO) ? SPENT_RIM : c === K.carRimD ? SPENT_RIM_D : mix(c, 0.38); }
    const G = Object.assign(Object.create(Object.getPrototypeOf(S)), S, { d });
    spentArt.set(S, G); return G;
  }
  const carArt = (s, c) => { const S = carSpr(s, c, c._brk); return c.spent && s.P['proto.art.spentGrey'] ? greyCar(S) : S; };
  function drawCarSprite(s, c) {
    const S = carArt(s, c), cx = c.x / U, cy = c.y / U;
    const pulse = app.realT - (fx.carPulse.has(c.id) ? fx.carPulse.get(c.id) : -9);
    PIX.blit(FB, S, cx, cy, pulse < 0.12 ? K.white : 0);
    c._top = Math.round(cy) + S.top;
    const hgt = EXT(s.P['vehicles.' + c.cls + '.height']), ca = Math.cos(c.h), sa = Math.sin(c.h);
    const roof = (u, v) => [Math.round(cx + (u * ca - v * sa) / U), Math.round(cy - hgt + (u * sa + v * ca) / U)];
    const sig = s.signalSide(c), blink = c.honking ? Math.floor(app.realT * 5) % 2 === 0 : sig && Math.floor(app.realT * 3) % 2 === 0;
    const SL = s.P['proto.art.signalLength'] || 2; // Edit 71: each light runs proto.art.signalLength art px along the car from its corner (was 2)
    c._lights = null;
    if (blink) { c._lights = []; c._lightsT = app.realT; for (const sd of c.honking ? [-1, 1] : [sig]) for (const e of [1, -1]) for (let j = 0; j < SL; j += 2) { const [x, y] = roof(e * (c.L / 2 - 3 - j * U), sd * (c.W / 2 - 2)); FB.rect(x - 1, y - 1, x, y, K.amber); c._lights.push([x, y]); } }
    if (c.v < -1) for (const sd of [-1, 1]) { const [x, y] = roof(-c.L / 2 + 1, sd * (c.W / 2 - 5)); FB.put(x, y, K.white); }
    if (flashOn(s, c)) for (const sd of [-1, 1]) { // Edit 99: headlamps, just ahead of the bumper, with a glow on the road
      const u = c.L / 2 + 3, v = sd * (c.W / 2 - 4), x = Math.round((c.x + u * ca - v * sa) / U), y = Math.round((c.y + u * sa + v * ca) / U) - Math.round(hgt / 2);
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) <= 3) FB.mix(x + i, y + j, K.beam, 0.55);
      FB.rect(x - 1, y - 1, x, y, K.white);
    }
  }
  // Roof marks (4.2.2): state pip and spent slash, drawn after every sprite so nothing occludes them.
  function pip(Bf, cue, cx, cy, loc, f, side) {
    if (cue === 'committed' || cue === 'expiring') {
      PIX.disc(cx, cy, 3, (x, y) => Bf.put(x, y, K.white));
      for (const [x, y, a] of PIX.circle(3)) if ((a + Math.PI / 2) % TAU <= f * TAU + 1e-6) Bf.put(cx + x, cy + y, K.roofInk);
    } else if (cue === 'intention') {
      const pts = side ? [[-6, -side * 2], [0, side * 6], [6, -side * 2]] : [[-3, -6], [4, 0], [-3, 6]];
      PIX.polyline(pts.map(([u, v]) => loc(u, v)), (x, y) => Bf.put(x, y, K.roofLabel));
    } else if (cue === 'caution') {
      PIX.polyline([[cx, cy - 4], [cx + 4, cy + 3], [cx - 4, cy + 3], [cx, cy - 4]], (x, y) => Bf.put(x, y, K.roofLabel));
      Bf.put(cx, cy - 1, K.roofLabel); Bf.put(cx, cy, K.roofLabel); Bf.put(cx, cy + 2, K.roofLabel);
    } else if (cue === 'interrupted') {
      PIX.stamp(Bf, PIX.circle(5).filter((p) => Math.floor(p[2] / (TAU / 12)) % 2 === 0).map((p) => [cx + p[0], cy + p[1]]), K.warn, K.roofInk);
      Bf.put(cx, cy - 2, K.roofInk); Bf.put(cx, cy - 1, K.roofInk); Bf.put(cx, cy, K.roofInk); Bf.put(cx, cy + 2, K.roofInk);
    }
  }
  function drawCarMarks(s, c) {
    const P = s.P, hgt = EXT(P['vehicles.' + c.cls + '.height']), ca = Math.cos(c.h), sa = Math.sin(c.h);
    const lf = c._lift || 0, loc = (u, v) => [c.x / U + (u * ca - v * sa) / U, c.y / U - hgt - lf + (u * sa + v * ca) / U];
    const simple = P['ui.cueKey.simple']; // Edit 99 (P8.4): a spent car is grey (no slash); noticed and slowing read from its lights (no chevron, no triangle)
    if (c.spent && !simple) { const a = loc(-c.L / 2 + 6, c.W / 2 - 3), e = loc(c.L / 2 - 6, -c.W / 2 + 3); PIX.line(a[0], a[1], e[0], e[1], (x, y) => { FB.put(x, y, K.roofInk); FB.put(x, y + 1, K.roofInk); }); }
    const cue = s.carCue(c);
    if (simple && (cue === 'intention' || cue === 'caution')) return;
    let f = 1, side = 0;
    if (cue === 'expiring') f = Math.max(0, (c.man.until - s.t) / (P['movement.lungeDuration'] + P['movement.lungeRecovery']));
    if (cue === 'intention') { if (!c.intent) return; side = c.intent.type === 'shift' ? Math.sign(c.intent.d1 - c.intent.d0) : 0; }
    pip(FB, cue, Math.round(c.x / U), Math.round(c.y / U) - hgt - lf, loc, f, side);
  }
  // Model ID tag: three characters in the field label face (6-art-px caps = ui.typeFieldLabel 12 units, Edit 39);
  // seniority as square pips beside it. Half the old 24-unit tag: the laptop sits at arm's length (decision 121).
  function tagRect(c) {
    const id = shortId(c.model), w = PIX.smallWidth(id) + 5, h = PIX.SMALL_H + 4;
    const top = c._top != null ? c._top : Math.round(c.y / U) - 12 - (c._lift || 0);
    return { id, w, h, x0: clamp(Math.round(c.x / U) - (w >> 1), 1, AW - w - 1), y0: clamp(top - 2 - h, 1, AH - h - 1) };
  }
  function drawTag(s, c) {
    const { id, w, h, x0, y0 } = tagRect(c);
    FB.rect(x0 + 1, y0 + 1, x0 + w - 2, y0 + h - 2, c.spent ? K.tagSpentFill : K.tagFill);
    for (let x = x0 + 1; x < x0 + w - 1; x++) { FB.put(x, y0, K.tagBorder); FB.put(x, y0 + h - 1, K.tagBorder); }
    for (let y = y0 + 1; y < y0 + h - 1; y++) { FB.put(x0, y, K.tagBorder); FB.put(x0 + w - 1, y, K.tagBorder); }
    PIX.smallText(FB, id, x0 + 3, y0 + 2, c.spent ? K.tagSpentInk : K.tagInk);
    let rx = x0 + w + 1;
    if (s.P['proto.learningEnabled']) for (let j = 0; j < seniorityOf(c); j++) { FB.rect(rx, y0 + 4, rx + 1, y0 + 5, K.ink); rx += 3; }
    if (c.honking) {
      if (Math.floor(app.realT * 5) % 2 === 0) {
        FB.rect(rx, y0, rx + 4, y0 + h - 1, K.tagBorder); FB.rect(rx + 1, y0 + 1, rx + 3, y0 + h - 2, K.tagFill);
        PIX.smallText(FB, '!', rx + 2, y0 + 2, K.tagInk);
      }
      const last = fx.horn.get(c.id) || 0; if (c.honkAt === 'body' && app.realT - last > 1.4) { horn(); fx.horn.set(c.id, app.realT); }
    }
  }
  function drawDrone(s, d) {
    const x = Math.round(d.x / U), y = Math.round(d.y / U - d.alt * 4);
    if (d.state === 'carry' && s.cones.some((c) => c.id === d.cone)) { PIX.line(x, y, x - 2, y + 9, (px, py) => FB.put(px, py, K.label)); PIX.blit(FB, PIX.CONE, x - 2, y + 13); }
    PIX.blit(FB, PIX.DRONE, x, y);
    FB.put(x, y - 1, Math.floor(app.realT * 4) % 2 ? K.warn : K.podCrown);
    for (const [rx, ry] of [[-7, -4], [7, -4], [-7, 4], [7, 4]]) { const a = app.realT * 40 + rx; FB.put(Math.round(x + rx + Math.cos(a) * 2), Math.round(y + ry + Math.sin(a) * 1.2), K.ink); }
  }
  // A flyover (Edit 43, 44): its columns from the ground up, then the deck layer (deck, boom, lights, shadows, the cues when the
  // dummy is up here, its actors) drawn on the footprint and lifted by its level's height × proto.art.extrusion (Z1 18 art px,
  // Z2 32), then its stairs (from the ground, and link stairs up to platform roofs) and a dummy climbing them.
  function drawDeck(s, d, k, cues, la) {
    const P = s.P, half = P['world.deckWidth'] / 2, b = s.body, still = cues === false, lift = d.ext, top = Math.round((d.dk.off - half) / U);
    for (const c of la.cols) if (Math.abs(c.st.y + c.st.h / 2 - d.dk.off) < half) PIX.blit(FB, c.spr, Math.round(c.st.x / U), Math.round(c.st.y / U));
    DL.d.fill(0); FB = DL;
    PIX.blit(FB, d.S, 0, top);
    (s.level.checkpoints || []).forEach((cp, i) => { if (cp.deck && cp.off === d.dk.off) drawBoom(s, cp, i); }); // the deck's own checkpoint
    const cars = still ? [] : carsOf(s).filter((c) => lay(c) >= 1 && c.deckIdx === k), mine = !still && onDeck(s) && bodyFloor(s).deck === k;
    if (!still) {
      drawLights(s, cars);
      for (const c of cars) carShadow(s, c);
      if (mine) { const o = P['proto.art.dummyHeight'] * P['proto.art.shadowScale']; PIX.ellipse((b.x + PIX.SUN.x * o) / U, b.y / U + 3, 5.5, 2.2, (x, y) => FB.shade(x, y, 0.72)); }
      if (cues) cues();
      if (mine) drawBodyGround(s);
      const list = cars.map((c) => [c.y + Math.abs(Math.sin(c.h)) * c.L / 2 + Math.abs(Math.cos(c.h)) * c.W / 2, () => drawCarSprite(s, c)]);
      if (mine) list.push([b.y + P['body.radius'], () => drawBodySprite(s)]);
      list.sort((p, q) => p[0] - q[0]); for (const it of list) it[1]();
    }
    FB = MAIN;
    const y0 = Math.max(0, top - PIX.LAMP_H), y1 = Math.min(AH - 1, top + d.S.h - PIX.LAMP_H); // composite the layer, lifted
    for (let y = y0; y <= y1; y++) { const ty = y - lift; if (ty < 0 || ty >= AH) continue; for (let x = 0; x < AW; x++) { const c = DL.d[y * AW + x]; if (c) MAIN.d[ty * AW + x] = c; } }
    for (const c of cars) { c._lift = lift; if (c._top != null) c._top -= lift; }
    if (mine && b._sy != null) b._sy -= lift;
    for (const u of d.up || []) PIX.blit(FB, u.spr, Math.round(u.st.x / U), Math.round(u.st.y / U));
    if (!still && b.alive && b.stair && stairDeck(s, b.stair) === k) { const L = bodyLift(s); drawBodyGround(s, L); drawBodySprite(s, false, L); }
  }
  // Car lights (Edit 43). Headlight beams follow the route ahead for proto.art.beamLength and reach the screen before the car
  // does; the dummy and other cars in a beam cast its shadow. Braking washes the ground behind red (proto.art.brakeLength).
  // Colour math on whole pixels, three bands of falloff, drawn under every cue.
  function drawLights(s, cars) {
    const P = s.P, len = P['proto.art.beamLength'], day = PIX.NAME === 'day' ? 0.45 : 1, aB = P['proto.art.beamAlpha'] * day, aR = P['proto.art.brakeAlpha'] * day, b = s.body, br = P['body.radius'];
    for (const c of cars) {
      const ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2;
      const occ = [];
      if (b.alive && s.meets(c)) occ.push([b.x, b.y, br]);
      for (const o of cars) if (o !== c && Math.hypot(o.x - nx, o.y - ny) < len + o.L) occ.push([o.x, o.y, o.W / 2]);
      const left = [], right = [], straight = P['proto.art.beamStraight'] > 0; // Edit 99 (P8.4): straight ahead from the nose, as the sensor sees
      for (let k = 0; k <= 8; k++) {
        const hw = c.W / 2 - 4 + len * 0.2 * k / 8;
        if (straight) { const u = len * k / 8, x = nx + ca * u, y = ny + sa * u; left.push([(x + sa * hw) / U, (y - ca * hw) / U]); right.push([(x - sa * hw) / U, (y + ca * hw) / U]); continue; }
        const sv = c.s + c.L / 2 + len * k / 8, p = pathAt(c.path, sv), dd = s.plannedD(c, sv);
        left.push([(p.x + p.nx * (dd - hw)) / U, (p.y + p.ny * (dd - hw)) / U]); right.push([(p.x + p.nx * (dd + hw)) / U, (p.y + p.ny * (dd + hw)) / U]);
      }
      const fl = P['proto.art.noticeFlashHz'] > 0 && noticed(s, c) ? (flashOn(s, c) ? 1.8 : 0.35) : 1; // Edit 99: noticed, the beam flashes
      const R = len / U;
      PIX.fillPoly(left.concat(right.reverse()), (x, y) => {
        const dx = x + 0.5 - nx / U, dy = y + 0.5 - ny / U, dist = Math.hypot(dx, dy), t = dist / R;
        if (t > 1) return;
        for (const [ox, oy, orr] of occ) { // shadow: an occluder nearer the lamp on this ray
          const qx = ox / U - nx / U, qy = oy / U - ny / U, along = (qx * dx + qy * dy) / (dist || 1);
          if (along > 0 && along < dist && Math.abs(qx * dy - qy * dx) / (dist || 1) < orr / U) return;
        }
        FB.mix(x, y, K.beam, Math.min(0.9, aB * fl * (t < 0.33 ? 1 : t < 0.66 ? 0.6 : 0.3)));
      });
      const held = P['proto.art.brakeGlowStopped'] > 0 && (c.state === 'interrupted' || (c.man && c.man.type === 'brake')); // Edit 99: braking for safety shows its brake lights at a standstill too
      if (c._brk && (c.v > 1 || held)) {
        const bl = P['proto.art.brakeLength'], pts = [[-c.L / 2, -c.W / 2 - 2], [-c.L / 2, c.W / 2 + 2], [-c.L / 2 - bl, c.W / 2 + 8], [-c.L / 2 - bl, -c.W / 2 - 8]].map(([u, v]) => [(c.x + u * ca - v * sa) / U, (c.y + u * sa + v * ca) / U]);
        PIX.fillPoly(pts, (x, y) => { const u = ((x + 0.5) * U - c.x) * ca + ((y + 0.5) * U - c.y) * sa, t = clamp((-c.L / 2 - u) / bl, 0, 1); FB.mix(x, y, K.brakeGlow, aR * (t < 0.4 ? 1 : t < 0.75 ? 0.55 : 0.25)); });
      }
    }
  }
  // Checkpoint boom (Edit 42): a striped arm across both lanes from the booth's side. It swings up for a car.
  function drawBoom(s, cp, i) {
    const P = s.P, lw = P['world.laneWidth'], p = s.boomPoint(cp), lift = (s.booms && s.booms[i]) || 0, th = lift * Math.PI / 2 * 0.92;
    const hz = cp.side === 'N' || cp.side === 'S'; // the arm runs along x when the road leaves north or south
    const px = (hz ? p.x + lw : p.x) / U, py = (hz ? p.y : p.y + lw) / U - 3, L = 2 * lw / U * Math.cos(th), up = 2 * lw / U * Math.sin(th) * 0.6;
    const tx = hz ? px - L : px, ty = (hz ? py : py - L) - up;
    FB.rect(Math.round(px) - 1, Math.round(py), Math.round(px), Math.round(py) + 4, K.bldgOutline);
    PIX.line(px, py, tx, ty, (x, y, j) => { const c = Math.floor(j / 3) % 2 ? K.white : K.bldgOutline; FB.put(x, y, c); FB.put(x, y + 1, K.bldgOutline); }); // white and black: red is the warning alone
  }
  function drawSprites(s, la, still, deckCues) { // depth-sorted by the ground line of each object
    const list = [], b = s.body, P = s.P, fl = s.level.floors || [], r = P['body.radius'];
    for (const o of la.statics) list.push([o.st.y + o.st.h, () => PIX.blit(FB, o.spr, Math.round(o.st.x / U), Math.round(o.st.y / U))]);
    (la.decks || []).forEach((d, k) => { d.up = la.up.filter((u) => stairDeck(s, u.st) === k); list.push([d.dk.hz ? d.dk.off + P['world.deckWidth'] / 2 : P['world.height'] + d.dk.height / 1000, () => drawDeck(s, d, k, still ? false : (cueDeck(s) === k ? deckCues : null), la)]); }); // flyovers sort by their south edge
    for (const u of la.up) if (stairDeck(s, u.st) == null) list.push([u.st.y + u.st.h + 0.25, () => PIX.blit(FB, u.spr, Math.round(u.st.x / U), Math.round(u.st.y / U))]); // Edit 44: platform stairs, after their building
    for (const g of la.bridges || []) list.push([g.key, () => PIX.blit(FB, g.spr, Math.round(g.f.x / U), Math.round(g.f.y / U))]);
    (s.level.checkpoints || []).forEach((cp, i) => { if (!cp.deck) list.push([s.boomPoint(cp).y + 2, () => drawBoom(s, cp, i)]); });
    for (const cn of s.cones) if (cn.state === 'free' || cn.state === 'flight') list.push([cn.y + 6, () => PIX.blit(FB, PIX.CONE, cn.x / U, (cn.y - coneLift(cn) * 1.2) / U)]);
    if (!still) {
      for (const c of carsOf(s)) if (lay(c) === 0) list.push([c.y + Math.abs(Math.sin(c.h)) * c.L / 2 + Math.abs(Math.cos(c.h)) * c.W / 2, () => drawCarSprite(s, c)]);
      if (b.alive) { // the dummy, unless its deck draws it: on the ground or falling by its feet; on a roof or skybridge after it; on a platform stair after the flight
        const L = () => bodyLift(s), me = () => { const l = L(); if (l) drawBodyGround(s, l); drawBodySprite(s, false, l); }, f = bodyFloor(s);
        if (b.stair) { if (stairDeck(s, b.stair) == null) list.push([b.stair.y + b.stair.h + 0.26, me]); }
        else if (b.mode === 'drop') { const over = s.level.statics.find((q) => q.kind === 'block' && b.x > q.x - r && b.x < q.x + q.w + r && b.y > q.y - r && b.y < q.y + q.h + r); list.push([Math.max(b.y + r, over ? over.y + over.h + 0.6 : -1), me]); } // still over the roof it left: drawn above it
        else if (b.level === 0) list.push([b.y + r, () => drawBodySprite(s, false, 0)]);
        else if (f && f.kind === 'roof') list.push([f.by + f.bh + 0.6, me]);
        else if (f && f.kind === 'bridge') { const g = (la.bridges || []).find((q) => q.i === b.floor); list.push([(g ? g.key : f.y + f.h) + 0.1, me]); }
      }
    }
    list.sort((a, b2) => a[0] - b2[0]);
    for (const it of list) it[1]();
    if (!still) { // x-ray pass: a checker of each actor's own pixels, so an occluded car or dummy still reads (4.2.4 tier 1)
      for (const c of carsOf(s)) {
        ghost(carSpr(s, c, c._brk), c.x / U, c.y / U - (c._lift || 0));
        relight(c);
      }
      if (b.alive && b._spr) ghost(b._spr, b._sx, b._sy);
    }
  }
  function relight(c) { // Edit 71: after the x-ray checker, the checker's own cells of a lit turn signal again, so a car's signal stays whole (and an occluded car's reads as a checker)
    if (c._lights && c._lightsT === app.realT) for (const [x, y0] of c._lights) { const y = y0 - Math.round(c._lift || 0); for (let j = y - 1; j <= y; j++) for (let i = x - 1; i <= x; i++) if (((i + j) & 1) === 0) FB.put(i, j, K.amber); }
  }
  function ghost(S, ax, ay) {
    const x0 = Math.round(ax) - S.ox, y0 = Math.round(ay) - S.oy;
    for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) { const c = S.d[j * S.w + i]; if (c && ((x0 + i + y0 + j) & 1) === 0) FB.put(x0 + i, y0 + j, c); }
  }
  function drawEffects(s, popups) { // popups: second pass, above tags, so the value is never covered
    for (const e of s.effects) {
      if (e._w == null) e._w = app.realT;
      const age = app.realT - e._w, cf = e._cfg || {}, ry = cf.rays, pu = cf.popup;
      const rayDur = ry ? Math.max(0.1, jv(ry.v.seconds, ry.k)) : 0.9, popDur = pu ? Math.max(0.2, jv(pu.v.seconds, pu.k)) : 0.9;
      const ex = e.x / U, ey = e.y / U - zLift(s, e.layer);
      if (e.type === 'burst' && age < Math.max(rayDur, popDur)) {
        const big = Math.min(1, e.v / 500);
        if (!popups && age < rayDur) { // impact burst (4.2.2): radial rays at the contact
          const k = Math.min(1, age / (rayDur * 0.4)), n = ry ? Math.max(4, Math.round(jv(ry.v.count, ry.k))) : 10, len = ry ? jv(ry.v.length, ry.k) : 8 + 18 * big;
          for (let i = 0; i < n; i++) {
            const a = i * TAU / n + (n % 2 ? 0 : 0.1), r0 = (6 + 14 * k) / U, r1 = r0 + len * (i % 2 ? 0.7 : 1) / U;
            PIX.line(ex + Math.cos(a) * r0, ey + Math.sin(a) * r0, ex + Math.cos(a) * r1, ey + Math.sin(a) * r1, (x, y, j) => { if (age < rayDur * 0.5 || j % 2 === 0) FB.put(x, y, K.ink); });
          }
          if (age < 0.09) PIX.disc(ex, ey, Math.round((12 + 14 * big) / U), (x, y) => FB.put(x, y, K.white));
        }
        if (popups && age < popDur) { // value popup at ui.typeLoadBearing, white-outlined
          const sc = age < 0.12 ? 2 : 1, label = '+' + num(e.v), w = PIX.textWidth(label, sc);
          const rise = (pu ? jv(pu.v.rise, pu.k) : 30 * popDur) * Math.min(1, age / popDur);
          const bd = s.body, axp = bd.alive ? bd.x / U : ex, ayp = bd.alive ? bd.y / U - 16 - bodyLift(s) : ey; // beside the dummy's head, away from the car and its tag
          const x = clamp(axp + (cf.nx || 0) * (w / 2 + 8) - w / 2, 2, AW - w - 2), y = clamp(ayp - rise / U - PIX.FONT_H * sc, 2, AH - PIX.FONT_H * sc - 2);
          if (age < popDur * 0.8 || Math.floor(app.realT * 20) % 2) {
            PIX.text(FB, label, x, y, K.popInk, K.popOutline, sc);
            if (e.combo > 1) { const t3 = 'COMBO ' + e.combo + ' X' + e.cmult, w3 = PIX.smallWidth(t3), x3 = clamp(x + w / 2 - w3 / 2, 2, AW - w3 - 2), y3 = y - PIX.SMALL_H - 3; FB.rect(x3 - 1, y3 - 1, x3 + w3, y3 + PIX.SMALL_H, K.popOutline); PIX.smallText(FB, t3, x3, y3, K.popInk); } // Edit 75
            if (e.mult > 1) { const t2 = 'HIGHWAY X' + e.mult, w2 = PIX.smallWidth(t2), x2 = clamp(x + w / 2 - w2 / 2, 2, AW - w2 - 2), y2 = y + PIX.FONT_H * sc + 2; FB.rect(x2 - 1, y2 - 1, x2 + w2, y2 + PIX.SMALL_H, K.popOutline); PIX.smallText(FB, t2, x2, y2, K.popInk); } // P5 (Edit 50): damage.deckMultiplier
          }
        }
      } else if (popups) continue;
      else if (e.type === 'touch' && age < 0.5) {
        for (const p of PIX.circle((6 + age * 20) / U)) if (age < 0.25 || p[2] * 6 % 1 < 0.5) FB.put(Math.round(ex) + p[0], Math.round(ey) + p[1], K.label);
      } else if (e.type === 'wreck' && age < 1.6) {
        for (let i = 0; i < 9; i++) {
          if (age > 1.1 && (i + Math.floor(app.realT * 12)) % 2) continue;
          const a = i * 0.7 + 0.3, d = (6 + age * (40 + i * 6)) / U, x = Math.round(ex + Math.cos(a) * d), y = Math.round(ey + Math.sin(a) * d);
          FB.rect(x - 1, y, x + 1, y + 1, i % 3 === 0 ? K.joint : K.dummy);
        }
      }
    }
  }
  function drawRingsStreaks() { // P2.1 hit juice, matte ink, whole pixels
    const now = app.realT;
    fx.rings = fx.rings.filter((r) => now - r.t0 < r.dur);
    for (const r of fx.rings) {
      const u = (now - r.t0) / r.dur, rad = r.r * (0.25 + 0.75 * (1 - Math.pow(1 - u, 3))) / U, col = roleK(r.role, K.ink);
      for (const p of PIX.circle(rad)) if (u < 0.5 || Math.floor(p[2] * 8) % 2 === 0) FB.put(Math.round(r.x / U) + p[0], Math.round(r.y / U) + p[1], col);
    }
    fx.streaks = fx.streaks.filter((st) => now - st.t0 < st.dur);
    for (const st of fx.streaks) {
      const u = (now - st.t0) / st.dur, cx = Math.cos(st.dir), cy = Math.sin(st.dir), px = -cy, py = cx, col = roleK(st.role, K.label);
      for (const ln of st.lines) {
        const s0 = 10 + ln.lag + u * 26, x0 = st.x + px * ln.off + cx * s0, y0 = st.y + py * ln.off + cy * s0, L = ln.len * (1 - u * 0.5);
        PIX.line(x0 / U, y0 / U, (x0 + cx * L) / U, (y0 + cy * L) / U, (x, y) => FB.put(x, y, col));
      }
    }
  }
  const ROLE_K = { primary: 'ink', secondary: 'label', warning: 'warn', dummy: 'dummy', joints: 'joint', structure: 'structure', fleet: 'fleet', aqua: 'podCrown' };
  function roleK(r, fb) { return (r && K[ROLE_K[r] || r]) || fb; }
  function lowHealth(key, fallback) { const st = CJ && CJ.states && CJ.states.lowHealth; return st && st[key] ? jv(st[key]) : fallback; }
  function drawParts(s) {
    const b = s.body, P = s.P, now = app.realT;
    if (b.alive && s.phase === 'play') {
      const wear = 1 - b.health / maxHP(s);
      if (wear > lowHealth('smokeFrom', 0.45) && now - fx.smokeT > 0.32 - wear * 0.15) { fx.smokeT = now; puff(b.x, b.y - 20, 1, { type: 'smoke', dir: -2.36, spread: 0.6, speed: 18, life: 1.1, size: 4 + 4 * wear }); }
      if (wear > lowHealth('sparkFrom', 0.7) && Math.random() < 0.05) puff(b.x, b.y - 10, 3, { type: 'spark', speed: 110, life: 0.25, size: 1.6 });
    }
    const dt = Math.min(0.05, now - (fx.lastPartT || now)); fx.lastPartT = now;
    fx.parts = fx.parts.filter((p) => now - p.t0 < p.life);
    for (const p of fx.parts) {
      const a = (now - p.t0) / p.life, col = p.role ? roleK(p.role, null) : null;
      p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.93; p.vy *= 0.93;
      const x = Math.round(p.x / U), y = Math.round(p.y / U), r = Math.max(0, Math.round(p.size * (1 + a * 1.5) / U / 2));
      if (p.type === 'dust') mixRect(x - r, y - r, x + r, y + r, col || K.fleet, 0.4 * (1 - a));
      else if (p.type === 'smoke') mixRect(x - r - 1, y - r - 1, x + r + 1, y + r + 1, col || K.label, 0.35 * (1 - a));
      else if (p.type === 'debris') { if (a < 0.7 || Math.floor(now * 15) % 2) FB.rect(x - 1, y, x + 1, y, col || K.dummy); }
      else if (p.type === 'ring') { for (const q of PIX.circle(p.size * (1 + a * 2) / U)) if (a < 0.5 || q[2] * 5 % 1 < 0.5) FB.put(x + q[0], y + q[1], col || K.label); }
      else PIX.line(x, y, (p.x - p.vx * 0.03) / U, (p.y - p.vy * 0.03) / U, (px, py) => FB.put(px, py, col || (a < 0.5 ? K.dummyL : K.dummy)));
    }
  }
  function mixRect(x0, y0, x1, y1, c, a) { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) FB.mix(x, y, c, a); }
  function drawStamp(s) {
    const sa = app.realT - fx.stampT0, dur = (CJ && CJ.writeOff ? jv(CJ.writeOff) : 1.1) + 0.2;
    if (sa >= dur || (dur - sa < 0.25 && Math.floor(app.realT * 20) % 2)) return;
    const sc = sa < 0.15 ? 2 : 1, label = 'WRITTEN OFF', w = PIX.textWidth(label, sc) + 10 * sc, h = (PIX.FONT_H + 10) * sc;
    const wr = s.effects.find((e) => e.type === 'wreck'), cx = wr ? wr.x / U : AW / 2, cy = wr ? wr.y / U - 32 - zLift(s, wr.layer) : AH / 2;
    const x0 = Math.round(clamp(cx - w / 2, 3, AW - w - 3)), y0 = Math.round(clamp(cy - h / 2, 3, AH - h - 3));
    FB.rect(x0 - 1, y0 - 1, x0 + w, y0 + h, K.stampOutline); FB.rect(x0, y0, x0 + w - 1, y0 + h - 1, K.warn); FB.rect(x0 + 2 * sc, y0 + 2 * sc, x0 + w - 1 - 2 * sc, y0 + h - 1 - 2 * sc, K.stampFill);
    PIX.text(FB, label, x0 + 5 * sc, y0 + 5 * sc, K.warn, K.stampOutline, sc);
  }
  function drawLive(s, la) {
    const P = s.P, b = s.body;
    for (const c of carsOf(s)) { c._brk = (c.man && c.man.type === 'brake') || c.state === 'interrupted' || (c._pv != null && c.v < c._pv - 0.4); c._pv = c.v; markCar(c, c._brk); }
    drawMarks();
    for (const c of carsOf(s)) c._lift = 0;
    drawLights(s, carsOf(s).filter((c) => lay(c) === 0)); // ground traffic; deck traffic lights its own deck (drawDeck)
    const inCone = coneFn(s), lvl = cueLevel(s), dq = cueDeck(s), mine = carsOf(s).filter((c) => lay(c) === lvl && (lvl === 0 || c.deckIdx === dq)); // Edit 42, 44: cues for cars that can meet the dummy
    const cues = () => {
      if (b.alive || P['proto.zonesEverywhere']) for (const c of mine) drawZones(s, c, P['proto.zonesEverywhere'] ? ALL : inCone);
      if (b.alive || P['proto.pathsEverywhere']) for (const c of mine) drawPath(s, c, P['proto.pathsEverywhere'] ? ALL : inCone);
      if (b.alive) { for (const c of mine) drawStopCue(s, c); drawViewEdges(s); }
    };
    if (lvl === 0) cues(); // on a deck they are drawn on its surface (drawDeck); a roof has no traffic
    dynShadows(s);
    if (onGroundDraw(s)) drawBodyGround(s);
    drawSprites(s, la, false, lvl > 0 ? cues : null);
    if (b.alive && b.held) { const p = s.releasePoint(), n = s.carriedCones().length; for (let i = 0; i < n; i++) PIX.blit(FB, PIX.CONE, p.x / U, p.y / U - 4 - 3 * i); } // Edit 78: a stack
    for (const c of mine) drawCarMarks(s, c);
    drawNose(s);
    drawEffects(s); drawRingsStreaks(); drawParts(s);
    for (const d of s.drones) drawDrone(s, d);
    for (const c of mine) drawTag(s, c);
    drawBarks(s);
    drawEffects(s, true);
    const fa = app.realT - fx.flash.t0;
    if (fa < fx.flash.dur) { const a = 0.55 * (1 - fa / fx.flash.dur) * (RM ? 0.4 : 1); for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) FB.mix(x, y, K.white, a); }
    drawStamp(s);
    if (b.alive) { // low health: a pulsing warning band on the field edge (colour math, whole pixels)
      const wear = 1 - b.health / maxHP(s), vf = lowHealth('vignetteFrom', 0.7);
      if (wear > vf) {
        const pulse = (0.5 + 0.5 * Math.sin(app.realT * 6)) * (wear - vf) / Math.max(0.05, 1 - vf), band = 8;
        for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) {
          const d = Math.min(x, y, AW - 1 - x, AH - 1 - y); if (d >= band) { x = AW - 1 - band; continue; }
          if ((x + y) % 2 === 0 || d < 3) FB.mix(x, y, K.warn, (0.12 + 0.3 * pulse) * (1 - d / band));
        }
      }
    }
  }
  // D24 screen flip: the old screen slides out as the new one slides in (world.flipSeconds; play is paused).
  const prevFB = new Uint32Array(AW * AH), scrollBuf = new Uint32Array(AW * AH);
  let prevOk = false;
  function composeScroll(s) {
    const sd = s.district.lastFlip.side, f = clamp(1 - s.phaseT / s.P['world.flipSeconds'], 0, 1), k = (1 - Math.cos(Math.PI * f)) / 2;
    const old = prevFB, nw = FB.d, out = scrollBuf;
    if (sd === 'E' || sd === 'W') {
      const o = Math.round(k * AW);
      for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) { const sx = sd === 'E' ? x + o : x - o; out[y * AW + x] = sx >= 0 && sx < AW ? old[y * AW + sx] : nw[y * AW + (sd === 'E' ? sx - AW : sx + AW)]; }
    } else {
      const o = Math.round(k * AH);
      for (let y = 0; y < AH; y++) { const sy = sd === 'S' ? y + o : y - o; for (let x = 0; x < AW; x++) out[y * AW + x] = sy >= 0 && sy < AH ? old[sy * AW + x] : nw[(sd === 'S' ? sy - AH : sy + AH) * AW + x]; }
    }
    nw.set(out);
  }
  // ----- P6 (GDD Edit 62): the world's screens. WORLD6.compose draws the ground, props and lifted layers (decks, the ring,
  // walkways, the hill) in one depth-sorted pass. Here: lights, cues and shadows on the dummy's level, the dummy wherever it
  // stands (on the ground, inside a layer, on a roof or terrace, on a stair, falling, hanging from a rescue drone), then the
  // x-ray pass, marks, tags and juice. Cars meet the dummy by elevation (car.elev).
  const elevOf = (c) => c.elev || 0;
  function where6(s) { // where the dummy draws
    const b = s.body, f = bodyFloor(s), r = s.P['body.radius'];
    if (!b.alive) return { at: 'none' };
    if (b.mode === 'rescue') return { at: 'rescue', key: 2e6, rescue: true };
    if (b.mode === 'drop') return { at: 'item', key: 2e6 }; // falling: above everything, so the landing reads
    if (b.stair) return { at: 'item', key: (b.stair.key != null ? b.stair.key : b.stair.y + b.stair.h) + 0.01 };
    if (b.level === 0) return { at: 'ground', key: b.y + r + (b.mode === 'jump' && b.z > 8 ? 120 : 0) }; // Edit 75: in a jump, over the cars
    if (f && f.layer) return { at: 'layer', layer: f.layer, key: b.y + r };
    return { at: 'item', key: f && f.key != null ? f.key : b.y + r + 0.5 };
  }
  function shadows6(s, cars, onLayer) { // hard shadows down-left on the surface being drawn
    const P = s.P, k = P['proto.art.shadowScale'], b = s.body, sh = (x, y) => FB.shade(x, y, 0.72), off = (h) => [PIX.SUN.x * h * k, PIX.SUN.y * h * k];
    if (!onLayer) for (const cn of s.cones) { if (cn.state !== 'free' && cn.state !== 'flight') continue; const o = off(P['proto.art.coneHeight'] + coneLift(cn)); PIX.disc((cn.x + o[0]) / U, (cn.y + o[1]) / U, Math.round(P['props.cone.radius'] / U), sh); }
    for (const c of cars) carShadow(s, c);
    const me = onLayer ? onLayer === true : (onGroundDraw(s) || (b.alive && b.mode === 'drop' && b.drop && b.drop.toZ === 0));
    if (me && b.mode !== 'rescue') { const o = off(P['proto.art.dummyHeight']); PIX.ellipse(b.x / U + o[0] / U, b.y / U + 3, 5.5, 2.2, sh); }
  }
  function drawLive6(s) {
    const P = s.P, b = s.body, sc = s.sc, cars = carsOf(s);
    for (const c of cars) { c._brk = (c.man && c.man.type === 'brake') || c.state === 'interrupted' || (c._pv != null && c.v < c._pv - 0.4); c._pv = c.v; markCar(c, c._brk); c._lift = 0; c._top = null; c._layer = W6.layerOf(sc, c); }
    const inCone = coneFn(s), lvl = b.mode === 'rescue' ? -1 : cueLevel(s), mine = cars.filter((c) => elevOf(c) === lvl), wh = where6(s);
    const cues = () => {
      if (b.alive || P['proto.zonesEverywhere']) for (const c of mine) drawZones(s, c, P['proto.zonesEverywhere'] ? ALL : inCone);
      if (b.alive || P['proto.pathsEverywhere']) for (const c of mine) drawPath(s, c, P['proto.pathsEverywhere'] ? ALL : inCone);
      if (b.alive) { for (const c of mine) drawStopCue(s, c); drawViewEdges(s); }
    };
    const cueLayer = lvl > 0 ? (wh.at === 'layer' ? wh.layer : (mine.find((c) => c._layer) || {})._layer || null) : null;
    const into = (buf, fn) => { const keep = FB; FB = buf; try { fn(); } finally { FB = keep; } };
    const meItem = () => { const l = wh.rescue ? rescueLift(s) : bodyLift(s); if (l && !wh.rescue) drawBodyGround(s, l); drawBodySprite(s, false, l); };
    const items = [];
    for (const cn of s.cones) if (cn.state === 'free' || cn.state === 'flight') items.push([cn.y + 6, () => PIX.blit(FB, PIX.CONE, cn.x / U, (cn.y - coneLift(cn) * 1.2) / U)]);
    if (wh.at === 'ground') items.push([wh.key, () => drawBodySprite(s, false, 0)]);
    else if (wh.at === 'item') items.push([wh.key, meItem]);
    else if (wh.at === 'rescue') items.push([wh.key, () => drawRescue6(s)]);
    (s.level.checkpoints || []).forEach((cp, i) => { if (!cp.deck && !cp.z) items.push([s.boomPoint(cp).y + 2, () => drawBoom(s, cp, i)]); }); // P6.1: a road leaving the district
    W6.compose(sc, MAIN, DL, {
      cars, layerOf: (c) => c._layer, items, extendLayers: !!P['ui.layerEdgeFix'], // Edit 99 (P8.4)
      car: (c, buf, lift) => { into(buf, () => drawCarSprite(s, c)); if (lift) { c._lift = lift; if (c._top != null) c._top -= lift; } },
      under: () => { drawMarks(); if (lvl === 0) { drawLights(s, mine); cues(); } shadows6(s, cars.filter((c) => !elevOf(c)), false); if (wh.at === 'ground') drawBodyGround(s); }, // P6.1: headlights and cues for the dummy's level only
      bodyOn: wh.at === 'layer' ? wh.layer : null, bodyKey: wh.key,
      body: (buf, lift) => { into(buf, () => { drawBodyGround(s, 0); drawBodySprite(s, false, 0); }); if (b._sy != null) b._sy -= lift; },
      layerUnder: (l, buf, lcars, me) => into(buf, () => {
        (s.level.checkpoints || []).forEach((cp, i) => { if ((cp.deck && l.dk && l.dk.off === cp.off && l.z === cp.z) || (cp.hill && l.hill)) drawBoom(s, cp, i); }); // a highway or hill street leaving the district
        if (l === cueLayer) drawLights(s, lcars.filter((c) => elevOf(c) === lvl)); shadows6(s, lcars, me ? true : 'no'); if (l === cueLayer) cues(); }),
    });
    { const dm = sc.dummyMonument, up = dm && dm.shroud ? shroudLift(s) : null; if (up != null) { PIX.blit(FB, dm.shroud, dm.x, dm.y - up); if (up > 0) drawDrone(s, { x: dm.x * U, y: (dm.y - dm.shroud.oy - up - 2) * U, alt: 0, state: 'lift' }); } } // Edit 94 (P7.13): the circus's monument, shrouded until B2 clears; manual review: a drone lifts the cloth away at the unveiling
    drawStoryFence(s); // Edit 81: a tile in test is fenced
    for (const c of cars) { ghost(carArt(s, c), c.x / U, c.y / U - (c._lift || 0)); relight(c); } // x-ray: a checker of each actor's own pixels, so an occluded car or dummy still reads
    if (b.alive && b._spr) ghost(b._spr, b._sx, b._sy);
    if (b.alive && b.held) { const p = s.releasePoint(), n = s.carriedCones().length; for (let i = 0; i < n; i++) PIX.blit(FB, PIX.CONE, p.x / U, p.y / U - 4 - 3 * i - bodyLift(s)); } // Edit 78: a stack
    for (const c of mine) drawCarMarks(s, c);
    if (b.mode !== 'rescue') drawNose(s);
    drawEffects(s); drawRingsStreaks(); drawParts(s);
    for (const d of s.drawDrones()) { // P6.1 (D37): the rescue drone flies in from the edge, then carries the dummy below it
      const rs = s.rescue, mine = d.rescue && rs && rs.drone === d, deliv = mine && (rs.gift || rs.given !== undefined);
      const held = mine && (rs.phase === 'lift' || rs.phase === 'carry' || rs.phase === 'in' || rs.phase === 'drop' || rs.phase === 'give'); // Edit 83: the ferry's 'in'; Edit 84: 'give'
      if (!held) { // Edit 84: a drone with a gift flies high, the module hanging under it, glowing
        if (!deliv) { drawDrone(s, d); continue; }
        drawDrone(s, Object.assign({}, d, { alt: GIFT_ALT / 4 }));
        if (rs.gift) { const x = Math.round(d.x / U), y = Math.round(d.y / U) - GIFT_ALT; PIX.line(x, y + 2, x, y + 6, (px, py) => FB.put(px, py, K.label)); drawGiftBox(x, y + 11); }
        continue;
      }
      if (rs.phase === 'give') { // Edit 84: the drone hovers and lowers the module onto the dummy on a cable (rs.item 0 → 1)
        const x = Math.round(d.x / U), y = Math.round(d.y / U) - GIFT_ALT, k = rs.item, e = k * k * (3 - 2 * k), by = Math.round(b.y / U) - 9, my = Math.round(y + 11 + (by - y - 11) * e);
        PIX.line(x, y + 2, x, my - 5, (px, py) => FB.put(px, py, K.label)); drawGiftBox(x, my);
        drawDrone(s, Object.assign({}, d, { alt: GIFT_ALT / 4 }));
        continue;
      }
      const dip = rs.given !== undefined && rs.phase === 'lift' ? Math.round((GIFT_ALT - 20) * Math.max(0, 1 - rs.k / 0.3)) : 0; // after a gift: down from the hover to the tether
      const up = rs.up + 20 + dip, x = Math.round(d.x / U), y = Math.round(d.y / U) - up; PIX.line(x, y + 2, x, y + 7 + dip, (px, py) => FB.put(px, py, K.label));
      drawDrone(s, Object.assign({}, d, { y: d.y - up * U + d.alt * 4 * U }));
    }
    for (const c of mine) drawTag(s, c);
    drawBarks(s);
    drawEffects(s, true);
    const fa = app.realT - fx.flash.t0;
    if (fa < fx.flash.dur) { const a = 0.55 * (1 - fa / fx.flash.dur) * (RM ? 0.4 : 1); for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) FB.mix(x, y, K.white, a); }
    if (app.showJumpable) for (const q of s.level.statics) if (q.jumpable) { const x0 = Math.round(q.x / U), y0 = Math.round(q.y / U), x1 = Math.round((q.x + q.w) / U) - 1, y1 = Math.round((q.y + q.h) / U) - 1; for (let x = x0; x <= x1; x++) { FB.put(x, y0, K.label); FB.put(x, y1, K.label); } for (let y = y0; y <= y1; y++) { FB.put(x0, y, K.label); FB.put(x1, y, K.label); } } // Edit 75 (tuning): what a jump clears
    drawStamp(s);
    if (b.alive) { const wear = 1 - b.health / maxHP(s), vf = lowHealth('vignetteFrom', 0.7); if (wear > vf) { const pulse = (0.5 + 0.5 * Math.sin(app.realT * 6)) * (wear - vf) / Math.max(0.05, 1 - vf), band = 8; for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) { const d = Math.min(x, y, AW - 1 - x, AH - 1 - y); if (d >= band) { x = AW - 1 - band; continue; } if ((x + y) % 2 === 0 || d < 3) FB.mix(x, y, K.warn, (0.12 + 0.3 * pulse) * (1 - d / band)); } } }
  }
  // Edit 84: the module a drone brings: a small aqua case with a pulsing halo (art pixels)
  const GIFT_ALT = 36;
  const GIFT_BOX = (() => { const n = 9, m = n - 1, S = { w: n, h: n, d: new Uint32Array(n * n), ox: 4, oy: 4 }; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const edge = x === 0 || y === 0 || x === m || y === m, corner = (x === 0 || x === m) && (y === 0 || y === m); S.d[y * n + x] = corner ? 0 : edge ? K.label : x === 4 || y === 4 ? K.white : K.podCrown; } return S; })();
  function drawGiftBox(x, y) {
    const t = app.realT, r = 7 + (Math.floor(t * 8) % 2);
    for (const [dx, dy] of PIX.circle(r)) FB.mix(x + dx, y + dy, K.podCrown, 0.5);
    PIX.blit(FB, GIFT_BOX, x, y);
    if (Math.floor(t * 5) % 3 === 0) { FB.put(x + 4, y - 6, K.white); FB.put(x - 6, y + 3, K.white); FB.put(x + 6, y + 5, K.white); }
  }
  function rescueLift(s) { const rs = s.rescue; return rs ? Math.round(rs.up) : 0; }
  function drawRescue6(s) { // P6.1 (D37): the dummy sinks below the waterline, a drone lifts it out and sets it down on land
    const rs = s.rescue, b = s.body; if (!rs) return;
    const cx = Math.round(b.x / U), wl = Math.round(b.y / U) + 2, t = app.realT, wet = !rs.voyage && !rs.ferry && !rs.gift && rs.given === undefined && (rs.phase === 'sink' || rs.phase === 'inbound' || rs.phase === 'lift'); // Edit 84: a ferry or a delivery is on land
    if (wet) for (let k = 0; k < 2; k++) { const r = 3 + ((t * 7 + k * 5) % 10); for (const [x, y] of PIX.circle(r)) FB.mix(cx + x, wl + Math.round(y * 0.45), K.white, 0.4 * (1 - r / 13)); } // ripples
    if (rs.under >= 0.999) { if (Math.floor(t * 5) % 2) FB.put(cx + (Math.floor(t * 9) % 3) - 1, wl - 1 - (Math.floor(t * 12) % 4), K.white); return; } // bubbles: under the surface
    const wear = clamp(1 - b.health / maxHP(s), 0, 1), S = PIX.dummy(b.facing, Math.min(5, Math.round(wear * 5)));
    const ay = Math.round(b.y / U) + Math.round(rs.under * 18) - Math.round(rs.up), x0 = cx - S.ox, y0 = ay - S.oy;
    for (let j = 0; j < S.h; j++) { const yy = y0 + j; if (wet && yy > wl) break; for (let i = 0; i < S.w; i++) { const c = S.d[j * S.w + i]; if (c) FB.put(x0 + i, yy, c); } }
  }
  function drawLoading() {
    const ld = app.loading || { name: '' }, x = FX + 60, y = FY + FH / 2 - 70, w = FW - 120;
    ctx.fillStyle = FT.veil; ctx.fillRect(FX, FY, FW, FH);
    panel(x, y, w, 140);
    txt('BUILDING DISTRICT', x + 30, y + 48, fLab, FT.accent);
    txt(ld.name, x + 30, y + 100, '900 40px ' + F_BRAND, FT.text);
  }
  function drawField(s, still) {
    if (s.p6 || s.preview6) return drawField6(s, still);
    const la = levelArt(s), scroll = !still && s.phase === 'scroll' && s.district && s.district.lastFlip;
    FB.copyFrom(la.ground);
    if (still || scroll) { drawSprites(s, la, true); if (scroll && s.body.alive) drawBodySprite(s); } else drawLive(s, la);
    if (scroll && prevOk) composeScroll(s); else if (!still) { prevFB.set(FB.d); prevOk = true; }
    blitField(s, still);
  }
  function drawField6(s, still) {
    const scroll = !still && s.phase === 'scroll' && s.district && s.district.lastFlip;
    FB = MAIN;
    if (still) W6.compose(s.sc, MAIN, DL, {}); else drawLive6(s);
    if (scroll && prevOk) composeScroll(s); else if (!still) { prevFB.set(FB.d); prevOk = true; }
    blitField(s, still);
  }
  function blitField(s, still) {
    flush();
    const sh = still ? { x: 0, y: 0 } : shakeOffset(), ox = Math.round(sh.x / RA) * RA, oy = Math.round(sh.y / RA) * RA;
    ctx.save(); ctx.beginPath(); ctx.rect(FX, FY, FW, FH); ctx.clip();
    ctx.fillStyle = PIX.PAL.grass; ctx.fillRect(FX, FY, FW, FH);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(art, FX + ox, FY + oy, FW, FH);
    ctx.restore();
    if (!still) drawFieldHD(s);
  }
  // Frame-layer messages over the field: road intro and toasts, at ui.typeSecondary.
  function drawFieldHD(s) {
    const P = s.P;
    drawBubblesHD(s); // Edit 83: barks are speech bubbles on the cars again
    const since = s.t - (s.tStart || 0);
    if (since < 4 && s.phase === 'play' && !s.storyMode && !CARD) { // Edit 81: the story's tile card replaces the banner. Edit 98: the level card replaces it in Arcade too
      const iv = { road: s.roadIndex + 1, roads: s.list.length, roadName: INFO(s.levelId).name, quota: s.quota, difficulty: s.difficulty, health: P['damage.bodyHealth'] };
      const intro = CI && CI.copy && CI.copy.intro;
      const msg = s.isCity ? 'District ' + iv.road + ' of ' + iv.roads + ': ' + iv.roadName + '. ' + (place('districts.' + s.levelId + '.intro') || INFO(s.levelId).blurb) + ' Write-offs required: ' + iv.quota + '.'
        : (intro ? fillIn(intro[0], iv) : 'Road ' + iv.road + ' of ' + iv.roads + ': ' + iv.roadName + '. Write-offs required: ' + iv.quota + '.') +
        (s.district ? ' ' + s.district.cols * s.district.rows + ' screens: walk off a marked edge to explore.' : '');
      const nid = LORE && s.isCity ? ({ monument: 'n24', parkland: 'n25', waterfront: 'n26' })[s.levelId] : null; // Edit 95: a label, then the district's line
      const lines = nid ? ['DISTRICT ' + iv.road + ' OF ' + iv.roads + ' · ' + iv.roadName.toUpperCase() + ' · ' + (s.grade ? 'A GRADE EVERY ' : '') + iv.quota + ' WRITE-OFF' + (iv.quota === 1 ? '' : 'S')].concat(wrapLines(LT(nid, INFO(s.levelId).blurb), FW - 88, fLab)) : wrapLines(msg, FW - 88, fLab), h = 22 + lines.length * 30;
      ctx.globalAlpha = Math.min(1, (4 - since) / 0.6);
      rr(FX + 20, FY + 16, FW - 40, h, 12); ctx.fillStyle = FT.banner; ctx.fill(); ctx.strokeStyle = FT.edge; ctx.lineWidth = 1.5; ctx.stroke();
      lines.forEach((l, i) => txt(l, FX + FW / 2, FY + 16 + 38 + i * 30, fLab, nid && !i ? FT.accent : FT.text, 'center'));
      ctx.globalAlpha = 1;
    }
  }
  // Prototype 6.2 (Edit 70): toasts and car barks never sit over the field. They run in the strip under it: one line each;
  // a toast and a bark together share the strip in smaller type (never under ui.typeFieldLabel). A bark carries its car's tag.
  const kMin = () => Math.ceil(pv('ui.typeFieldLabel') / CAP), kCss = (k) => 'rgb(' + (k & 255) + ',' + ((k >>> 8) & 255) + ',' + ((k >>> 16) & 255) + ')';
  function liveBark(s) {
    const dur = pv('proto.barks.seconds') || 2.4, now = app.realT;
    let best = null;
    for (const [id, bk] of fx.bubbles) {
      const age = now - bk.t0; if (age > dur) continue;
      const live = carsOf(s).find((c) => c.id === id), info = live || fx.cars.get(id); if (!info) continue;
      if (!best || bk.priority > best.bk.priority || (bk.priority === best.bk.priority && bk.t0 > best.bk.t0)) best = { bk, tag: shortId(info.model), spent: !!(live && live.spent), a: Math.min(1, 3 * (dur - age)) };
    }
    return best;
  }
  // Edit 83 (P7.2): car barks are speech bubbles on the cars, drawn at a legible size in the frame layer: speech solid, shout
  // doubled, mutter dashed, thought dotted. Above the car's tag, else below; never over the dummy or another bubble.
  function drawBubblesHD(s) {
    if (!STORY || !fx.bubbles.size) return;
    const dur = pv('proto.barks.seconds') || 2.4, now = app.realT, size = Math.max(kMin(), 16), font = '700 ' + size + 'px ' + F_UI, lh = size + 3, pad = 8, maxW = 230;
    const toC = (ax, ay) => [FX + ax * RA, FY + ay * RA], placed = [], cars = carsOf(s);
    if (s.body.alive) { const [bx, by] = toC(s.body.x / U - 10, s.body.y / U - 16); placed.push({ x: bx, y: by, w: 20 * RA, h: 24 * RA }); }
    const hit = (r) => placed.some((q) => r.x < q.x + q.w && r.x + r.w > q.x && r.y < q.y + q.h && r.y + r.h > q.y);
    const order = [...fx.bubbles.entries()].sort((a, b2) => b2[1].priority - a[1].priority || b2[1].t0 - a[1].t0);
    for (const [id, bk] of order) {
      const c = cars.find((q) => q.id === id), age = now - bk.t0; if (!c || age > dur) continue;
      const lines = wrapLines(bk.text, maxW - 2 * pad, font).slice(0, 3); ctx.font = font;
      const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + 2 * pad, h = lines.length * lh + 2 * pad - 2;
      const t = tagRect(c), [cx, top] = toC(c.x / U, t.y0), [, bot] = toC(0, c.y / U - (c._lift || 0) + Math.max(c.L, c.W) / U / 2);
      let x = clamp(cx - w / 2, FX + 4, FX + FW - w - 4), y = top - 10 - h, below = false;
      if (y < FY + 4 || hit({ x, y, w, h })) { y = bot + 10; below = true; }
      if (y + h > FY + FH - 4 || hit({ x, y, w, h })) { if (bk.priority < 2) continue; y = clamp(top - 10 - h, FY + 4, FY + FH - h - 4); below = false; }
      placed.push({ x, y, w, h }); app.bubblesDrawn = (app.bubblesDrawn || 0) + 1;
      const st = bk.style, edge = kCss(K.barkEdge), fill = kCss(K.barkFill), ink = kCss(K.barkInk), ax = clamp(cx, x + 16, x + w - 16);
      ctx.save(); ctx.globalAlpha = Math.min(1, 3 * (dur - age));
      if (st === 'thought') { const ty = below ? y - 6 : y + h + 6; [[0, 0, 4], [3, below ? -7 : 7, 2.5]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(ax + dx, ty + dy, r, 0, TAU); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.5; ctx.stroke(); }); }
      else { ctx.beginPath(); const by = below ? y : y + h; ctx.moveTo(ax - 7, by); ctx.lineTo(ax, by + (below ? -10 : 10)); ctx.lineTo(ax + 7, by); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.stroke(); }
      rr(x, y, w, h, 10); ctx.fillStyle = fill; ctx.fill();
      ctx.setLineDash(st === 'mutter' ? [6, 4] : st === 'thought' ? [2, 4] : []); ctx.lineWidth = 2; ctx.strokeStyle = edge; ctx.stroke(); ctx.setLineDash([]);
      if (st === 'shout') { rr(x - 3, y - 3, w + 6, h + 6, 12); ctx.lineWidth = 1.5; ctx.stroke(); }
      if (st !== 'thought') { ctx.beginPath(); const by = below ? y + 1 : y + h - 1; ctx.moveTo(ax - 5, by); ctx.lineTo(ax + 5, by); ctx.strokeStyle = fill; ctx.lineWidth = 3; ctx.stroke(); }
      lines.forEach((l, k) => txt(l, x + w / 2, y + pad + size * 0.82 + k * lh, font, ink, 'center'));
      ctx.restore();
    }
  }
  // Edit 83 (P7.2): the bottom line carries the objective: the story's brief for the tile in test, or the Arcade district's quota.
  // A toast takes the line while it lives.
  function objective(s) {
    if (!s) return null;
    if (s.storyMode) {
      const pr = s.story, id = s.levelId, act = STORY.activeTile(pr, id), here = s.screenName();
      const rs = s.rescue, gn = rs && (rs.gift || rs.given);
      if (rs && gn && !rs.ferry) return [LT('n06', 'FARSIGHT DRONE'), 'Delivering ' + NODE(gn).name + '.']; // Edit 84
      if (rs && rs.gift) return [LT('n06', 'FARSIGHT DRONE'), 'Bringing ' + NODE(rs.gift).name + ', then on to ' + rs.tile + '.'];
      if (rs && rs.ferry) return [LT('n06', 'FARSIGHT DRONE'), 'Carrying the chassis to ' + rs.tile + '.'];
      if (rs && rs.voyage) return [LT('n06', 'FARSIGHT DRONE'), 'Carrying the certified model to the ship at ' + rs.tile + '.']; // Edit 94 (manual review): the voyage
      if (!act) return ['STORY', INFO(id).name + ' is cleared.'];
      const task = STORY.tileOf(id, act).task, need = STORY.needOf(id, act, s.P), lab = STORY.taskText(task, s.P).label.toLowerCase(), cnt = ' (' + pr.tileWO + ' of ' + need + ')';
      const what = (need === 1 ? 'Write off a body' : 'Write off ' + need + ' bodies') + (task.kind === 'any' ? '' : '. Last hit: ' + lab);
      if (here === act) return ['OBJECTIVE · ' + act, what + cnt + '.'];
      return ['OBJECTIVE · ' + act, 'Back to ' + act + ': ' + what.charAt(0).toLowerCase() + what.slice(1) + cnt + '.'];
    }
    if (s.isCity && s.quota) {
      const rs = s.rescue; if (rs && (rs.gift || rs.given)) return [LT('n06', 'FARSIGHT DRONE'), 'Delivering ' + NODE(rs.gift || rs.given).name + '.']; // Edit 84
      let line = 'Write off ' + s.quota + ' bodies (' + s.run.writeOffs + ' of ' + s.quota + ').';
      if (s.grade) line = s.grade >= s.P['arcade.grade.max'] ? 'Grade ' + s.grade + ', the top grade: write off all you can.' // Edit 97 (P8.2): the grades
        : 'Grade ' + s.grade + ': write off ' + s.quota + ' bodies for grade ' + (s.grade + 1) + ' (' + (s.run.writeOffs - (s.grade - 1) * s.quota) + ' of ' + s.quota + ').';
      return ['OBJECTIVE · ' + INFO(s.levelId).name.toUpperCase(), line];
    }
    return null;
  }
  function drawMessages(s) {
    const items = [];
    if (app.toast && app.realT - app.toast.t < 1.6) items.push({ kind: 'toast', text: app.toast.msg, a: Math.min(1, 3 * (1.6 - (app.realT - app.toast.t))) });
    if (!STORY) { const bk = s && liveBark(s); if (bk) items.push({ kind: 'bark', text: bk.bk.text, tag: bk.tag, spent: bk.spent, dim: bk.bk.style === 'mutter', a: bk.a }); }
    if (STORY && !items.length) { // Edit 83: the objective line
      const ob = objective(s); if (!ob) return;
      const top = 3, bot = FY - 9, cy = (top + bot) / 2, MIN = kMin(); let size = TY.sec; // Edit 87: the objective sits on the top strip, from the field's left edge
      const fit = () => { ctx.font = '700 ' + size + 'px ' + F_UI; const lw = ctx.measureText(ob[0]).width + 24; ctx.font = '400 ' + size + 'px ' + F_UI; return lw + 12 + ctx.measureText(ob[1]).width <= FW - 16; };
      while (!fit() && size > MIN) size--;
      ctx.font = '700 ' + size + 'px ' + F_UI; const lw = ctx.measureText(ob[0]).width + 24; ctx.font = '400 ' + size + 'px ' + F_UI;
      let text = ob[1]; while (text.length > 8 && lw + 12 + ctx.measureText(text).width > FW - 16) text = text.slice(0, -2);
      if (text !== ob[1]) text = text.replace(/\s+\S*$/, '') + '…';
      const total = lw + 12 + ctx.measureText(text).width, x0 = FX - 6, ph = size + 10;
      rr(x0, cy - ph / 2, lw, ph, 10); ctx.fillStyle = C.dummy; ctx.fill(); if (app.hud) app.hud.objective = { x: x0, y: cy - ph / 2, w: total, h: ph, text: ob[0] + ' ' + text };
      txt(ob[0], x0 + 12, cy + size * 0.36, '700 ' + size + 'px ' + F_UI, C.primary);
      txt(text, x0 + lw + 12, cy + size * 0.36, '400 ' + size + 'px ' + F_UI, FT.text);
      return;
    }
    if (!items.length) return;
    const top = STORY ? 3 : FY + FH + 8, bot = STORY ? FY - 9 : VH - 2, GAP = 28; // Edit 87: toasts take the top strip in turn
    const widthOf = (it, size, pill) => { ctx.font = '700 ' + size + 'px ' + F_UI; const tw = ctx.measureText(it.text).width; if (it.kind === 'toast') return tw + (pill ? 24 : 0); ctx.font = '700 ' + size + 'px ' + F_MONO; return ctx.measureText(it.tag).width + 14 + 10 + tw; };
    const lineW = (size, pill) => items.reduce((a, it) => a + widthOf(it, size, pill), 0) + (items.length - 1) * GAP;
    // one line if it fits (the field's width, else the canvas's), at the secondary size down to ui.typeFieldLabel; else a line each at that size
    let size = TY.sec, span = FW - 16, cx = FX + FW / 2, rows = 1; const MIN = kMin();
    const fits = () => lineW(size, true) <= span;
    while (!fits() && size > MIN) size--;
    if (!fits()) { span = VW - 32; cx = VW / 2; size = TY.sec; while (!fits() && size > MIN) size--; }
    if (!fits() && items.length > 1) { rows = 2; size = MIN; span = VW - 32; cx = VW / 2; }
    const clip = (it, sz, room) => { ctx.font = '700 ' + sz + 'px ' + F_UI; let t = it.text; if (widthOf(it, sz, rows === 1) <= room) return t; while (t.length > 4 && widthOf(Object.assign({}, it, { text: t + '…' }), sz, rows === 1) > room) t = t.slice(0, -1); return t.replace(/\s+\S*$/, '') + '…'; };
    const drawItem = (it, x0, cy, sz, pill) => { // returns the width used
      const font = '700 ' + sz + 'px ' + F_UI, base = cy + sz * 0.36, ph = sz + 10;
      ctx.globalAlpha = it.a;
      if (it.kind === 'toast') {
        ctx.font = font; const tw = ctx.measureText(it.text).width;
        if (pill) { rr(x0, cy - ph / 2, tw + 24, ph, 10); ctx.fillStyle = FT.toast; ctx.fill(); txt(it.text, x0 + 12, base, font, '#FFFFFF'); ctx.globalAlpha = 1; return tw + 24; }
        txt(it.text, x0, base, font, FT.accent); ctx.globalAlpha = 1; return tw;
      }
      const mf = '700 ' + sz + 'px ' + F_MONO; ctx.font = mf; const cw = ctx.measureText(it.tag).width + 14, chh = Math.min(ph, (bot - top) / rows - 1);
      rr(x0, cy - chh / 2, cw, chh, 4); ctx.fillStyle = kCss(it.spent ? K.tagSpentFill : K.tagFill); ctx.fill(); ctx.strokeStyle = kCss(K.tagBorder); ctx.lineWidth = 1.5; ctx.stroke();
      txt(it.tag, x0 + cw / 2, base, mf, kCss(it.spent ? K.tagSpentInk : K.tagInk), 'center');
      txt(it.text, x0 + cw + 10, base, font, it.dim ? FT.dim : FT.text); ctx.font = font;
      const w = cw + 10 + ctx.measureText(it.text).width; ctx.globalAlpha = 1; return w;
    };
    if (rows === 1) {
      for (const it of items) it.text = clip(it, size, span - (items.length - 1) * GAP - items.filter((q) => q !== it).reduce((a, q) => a + widthOf(q, size, true), 0));
      let x = cx - lineW(size, true) / 2; const cy = (top + bot) / 2;
      for (const it of items) x += drawItem(it, x, cy, size, true) + GAP;
    } else items.forEach((it, i) => { it.text = clip(it, MIN, span); const cy = top + (bot - top) * (i + 0.5) / 2; drawItem(it, cx - widthOf(it, MIN, false) / 2, cy, MIN, false); });
  }
  // ---------- frame + essentials HUD (V29 D10.3: only facts the player acts on, at registry type size)
  function roadLabel(id) { if (W6) return (LEVEL_LIST.indexOf(id) + 1) + ' · ' + INFO(id).name.toUpperCase(); const d = !!DISTRICTS[id]; return (d ? '' : 'ROAD ') + ((d ? LEVEL_LIST : window.DUMMIES.ROADS).indexOf(id) + 1) + ' · ' + INFO(id).name.replace(/^L\d+\s*/, '').replace('Central Business District', 'CBD').toUpperCase(); }
  function drawFrame() {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, FT.bg[0]); g.addColorStop(0.5, FT.bg[1]); g.addColorStop(1, FT.bg[2]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    for (const [gx, gy, gr, gc] of [[1140, 20, 300, FT.glow], [120, 700, 320, FT.glow2]]) {
      if (!gc) continue;
      const o = ctx.createRadialGradient(gx, gy, 10, gx, gy, gr); o.addColorStop(0, gc); o.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = o; ctx.fillRect(0, 0, VW, VH);
    }
    const brand = !STORY || (app.screen !== 'game' && !TOUCH.on); // Edit 86 (P7.5): in play the corner stays clear (the touch pause chip sits there); menus keep the brand. Edit 88: on touch the chips keep that corner on every screen
    if (brand && FT.neon) { ctx.save(); ctx.shadowColor = FT.brand; ctx.shadowBlur = 14; }
    if (brand) { // Edit 95 (P8): the wordmark is the company in the game, no wider than FARSIGHT was
      const wm = LT('n22', 'FARSIGHT'); ctx.font = '900 30px ' + F_BRAND; const w0 = ctx.measureText('FARSIGHT').width, w1 = ctx.measureText(wm).width;
      txt(wm, 24, TOPY + 1, '900 ' + Math.max(16, Math.min(30, Math.floor(30 * Math.max(w0, 230) / Math.max(1, w1)))) + 'px ' + F_BRAND, FT.brand);
    }
    if (brand && FT.neon) ctx.restore();
    const s = app.sim;
    if (STORY && app.screen === 'game' && s) { /* Edit 87: the objective and toasts own the top strip (drawMessages); facts sit in the side boxes */ }
    else if (app.screen === 'title' || app.screen === 'scores' || !s) txt(app.screen === 'loading' ? 'BUILDING DISTRICT' : app.screen === 'storymap' ? 'STORY · THE TEST CITY' : app.screen === 'saves' ? 'STORY · SAVE GAMES' : app.screen === 'scores' ? 'HIGH SCORES' : app.screen === 'arcade' ? 'ARCADE · SELECT A DISTRICT' : STORY ? 'SELECT A MODE' : 'SELECT A DISTRICT', FX + FW / 2, TOPY - 3, fLab, FT.dim, 'center');
    else drawTopBar(s);
    ctx.save(); ctx.shadowColor = 'rgba(16,40,56,0.22)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 4;
    rr(FX - 6, FY - 6, FW + 12, FH + 12, 10); ctx.fillStyle = FT.bezel; ctx.fill(); ctx.restore();
    rr(FX - 6.5, FY - 6.5, FW + 13, FH + 13, 10); ctx.strokeStyle = FT.edge; ctx.lineWidth = 1.5; ctx.stroke();
  }
  // Prototype 6.2 (Edit 70): the controls sit in the right column, under the chassis, only while they apply.
  // The strip under the field is the message line.
  function playKeys(s) {
    if (!s || app.screen !== 'game' || app.paused || s.phase !== 'play' || TOUCH.on) return null; // touch: the diamond is the legend
    if (!FOUR) { const keys = [['WASD', 'MOVE'], ['SPACE', 'DASH']]; if (s.has('carry') || s.has('throw')) keys.push(['K', 'CONE']); return keys; }
    const pd = app.device === 'pad', keys = [[pd ? 'STICK' : 'WASD', 'MOVE']].concat(s.dashFitted && !s.dashFitted() ? [] : [[pd ? 'A' : 'SPACE', 'DASH']]); // Edit 75: A, B, X, Y as installed. Edit 91: DASH once Battery 1 is fitted
    if (s.has('jump')) keys.push([pd ? 'B' : 'L', 'JUMP']);
    if (ABIL4) { // Edit 80: X grabs, a hold puts down; Y pushes off a car
      const b = s.body, n = s.carriedCones().length, room = n < s.coneCapacity();
      if (s.has('carry')) keys.push([pd ? 'X' : 'J', b.held ? (room ? 'GRAB · HOLD: DOWN' : 'HOLD: PUT DOWN') : 'GRAB']);
      if (s.has('push')) keys.push([pd ? 'Y' : 'I', 'PUSH ×' + (b.pushes || 0)]);
      return keys;
    }
    if (ABIL3) { // Edit 79: X does it all; a hitched body lets go with X, slings with A
      const b = s.body;
      if (b.mode === 'hitch') { keys[1] = [pd ? 'A' : 'SPACE', 'SLING']; keys.push([pd ? 'X' : 'J', 'LET GO']); }
      else if (s.has('carry')) keys.push([pd ? 'X' : 'J', b.held ? (s.has('throw') ? 'DROP · HOLD THROW' : 'DROP') : s.has('hitch') ? 'GRAB · HITCH' : 'GRAB']);
      return keys;
    }
    if (s.has('carry')) keys.push([pd ? 'X' : 'J', s.body.held && s.carriedCones().length >= s.coneCapacity() ? 'PLACE' : s.body.held ? 'GRAB/PLACE' : 'GRAB']);
    if (s.has('throw')) keys.push([pd ? 'Y' : 'I', 'THROW']);
    return keys;
  }
  function drawKeysPanel(s, above) { // a glass panel, one key a row; its foot level with the field's, else just under the chassis
    const keys = playKeys(s); if (!keys) return;
    const X = FX + FW + 16, W = VW - X - 16, n = keys.length;
    let pitch = 40, h = n * pitch + 20, y = FY + FH - h;
    if (y < above + 10) { y = above + 10; const room = VH - 4 - y; if (h > room) { pitch = Math.max(28, Math.floor((room - 20) / n)); h = n * pitch + 20; } }
    panel(X, y, W, h);
    const kh = Math.min(32, pitch - 6);
    ctx.font = fKey; const kw = Math.max(...keys.map((it) => ctx.measureText(it[0]).width + 20));
    keys.forEach(([k, a], i) => {
      const ky = y + 10 + i * pitch + (pitch - 6 - kh) / 2;
      glassKey(X + 14, ky, kw, kh); txt(k, X + 14 + kw / 2, ky + kh / 2 + 8, fKey, FT.text, 'center');
      txt(a, X + 14 + kw + 12, ky + kh / 2 + 8, fLab, FT.dim);
    });
  }
  const WHERE6 = { walk: 'WALKWAY', hill: 'HILLTOP', terrace: 'TERRACE', ring: 'RING', deck: 'HIGHWAY', roof: 'ROOF' }; // P6 floors
  // Top bar: where you are and how the shift stands. Cars left is the shift's clock.
  function whereOf(s) { // the body's level, as the top bar named it (Edit 44, P6 floors)
    const b = s.body, f = bodyFloor(s);
    return b.mode === 'rescue' ? (s.rescue && (s.rescue.ferry || s.rescue.voyage || s.rescue.dropIn) ? ' · DRONE' : ' · RESCUE') : !b.alive || b.level === 0 && !b.stair ? '' : b.stair ? ' · STAIRS' : b.mode === 'drop' ? ' · FALLING' : ' · Z' + b.level;
  }
  function fitTextR(t, x, y, w, size, min, color) { while (size > min) { ctx.font = '700 ' + size + 'px ' + F_UI; if (ctx.measureText(t).width <= w) break; size--; } txt(t, x, y, '700 ' + size + 'px ' + F_UI, color, 'right'); }
  function fitNumR(t, x, y, w, size, color) { let z = size; while (z > 14) { ctx.font = '700 ' + z + 'px ' + F_MONO; if (ctx.measureText(t).width <= w) break; z--; } txt(t, x, y, '700 ' + z + 'px ' + F_MONO, color, 'right'); } // Edit 89: a number that keeps clear of its label
  function fitText(t, x, y, w, size, min, color) { while (size > min) { ctx.font = '700 ' + size + 'px ' + F_UI; if (ctx.measureText(t).width <= w) break; size--; } txt(t, x, y, '700 ' + size + 'px ' + F_UI, color); }
  function drawScore(s) { // Edit 91: top right, small, on the strip above the boxes: POINTS (Arcade: and CARS LEFT, its clock)
    const R = VW - 16, X = FX + FW + 16, W = R - X, r = s.run, rows = s.storyMode ? [['POINTS', num(r.points)]] : [['POINTS', num(r.points)], ['CARS LEFT', String(s.carsLeft ? s.carsLeft() : 0)]]; // Edit 97 (P8.2): the grade is on the objective strip
    const one = rows.length === 1, fL = '700 ' + (one ? 14 : 12) + 'px ' + F_UI, nz = one ? 20 : 15;
    rows.forEach(([k, v], i) => {
      const y = one ? TOPY - 4 : 14 + i * 16; ctx.font = fL; const kw = ctx.measureText(k).width;
      ctx.font = '700 ' + nz + 'px ' + F_MONO; let z = nz; while (z > 10 && ctx.measureText(v).width > W - kw - 10) { z--; ctx.font = '700 ' + z + 'px ' + F_MONO; }
      const vw = ctx.measureText(v).width; txt(v, R, y + 1, '700 ' + z + 'px ' + F_MONO, FT.text, 'right'); txt(k, R - vw - 8, y, fL, FT.dim, 'right');
    });
    if (app.hud) app.hud.score = { x: X, y: 0, w: W, h: FY - 6, rows: rows.map((q) => q[0]).join(' '), points: Math.round(r.points) };
  }
  function drawTopBar(s) {
    const r = s.run, left = s.carsLeft ? s.carsLeft() : Math.max(0, s.schedule.length - (r.admitted - (s.allCars ? s.allCars() : s.cars).filter((c) => !c.deck).length)); // P6.1: shift cars still to appear // deck traffic is off the shift's clock; P5.3: every car still in the district
    const b = s.body, f = bodyFloor(s), where = b.mode === 'rescue' ? (s.rescue && (s.rescue.ferry || s.rescue.voyage || s.rescue.dropIn) ? ' · DRONE' : ' · RIVER RESCUE') : !b.alive || b.level === 0 && !b.stair ? '' : b.stair ? ' · STAIRS' : b.mode === 'drop' ? ' · FALLING' : ' · Z' + b.level + ' ' + (f && WHERE6[f.kind] ? WHERE6[f.kind] : f && f.kind === 'roof' ? 'ROOF' : f && f.kind === 'bridge' ? 'BRIDGE' : 'HIGHWAY'); // Edit 44; P6 floors
    const items = s.storyMode ? [[null, INFO(s.levelId).name.toUpperCase() + ' · ' + s.screenName() + where], ['TILE', s.story.tileWO + ' / ' + STORY.needOf(s.levelId, STORY.activeTile(s.story, s.levelId) || s.screenName(), s.P)], ['POINTS', num(r.points)], ['CREDITS', String(r.credits)]] // Edit 81
      : [[null, roadLabel(s.p6 ? s.levelId : s.level.id) + (s.district ? ' · ' + s.screenName() : '') + where], ['WRITE-OFFS', r.writeOffs + ' / ' + s.quota], ['POINTS', num(r.points)], ['CARS LEFT', String(left)]];
    const w = items.map(([k, v]) => { ctx.font = fLab; const kw = k ? ctx.measureText(k).width + 10 : 0; ctx.font = k ? fNum : fLab; return kw + ctx.measureText(v).width; });
    const gap = (1264 - FX - w.reduce((a, b) => a + b, 0)) / (items.length - 1);
    let x = FX;
    items.forEach(([k, v], i) => {
      if (k) { txt(k, x, TOPY - 1, fLab, FT.dim); ctx.font = fLab; x += ctx.measureText(k).width + 10; txt(v, x, TOPY + 1, fNum, FT.text); ctx.font = fNum; x += ctx.measureText(v).width + gap; }
      else { txt(v, x, TOPY - 1, fLab, FT.text); ctx.font = fLab; x += ctx.measureText(v).width + gap; }
    });
  }
  // Left: the body's numbers. Health first and largest; dash beneath.
  function drawHUD(s) {
    const b = s.body, P = s.P, hp = b.alive ? b.health : 0, frac = clamp(hp / maxHP(s), 0, 1); // Edit 91: on foot, a lighter chassis
    const X = 16, W = FX - 32, TX = 30, BW = W - 28; // left column: as wide as the space beside the field
    const BY = STORY ? FY - 6 : 62, BH = STORY ? 86 : 150, DY = BY + BH + 10; // Edit 87: on the field's top edge // Edit 86 (P7.5): BODY as tall as DASH: the number on the label's row, the bar beneath
    panel(X, BY, W, BH); app.hud = { body: { x: X, y: BY, w: W, h: BH } }; // Edit 87: the boxes as drawn, for the tests
    if (STORY) { txt('BODY', TX, BY + 36, fLab, FT.dim); txt(num(hp), X + W - 14, BY + 40, '700 36px ' + F_MONO, frac < 0.3 && b.alive ? C.warning : FT.text, 'right'); }
    else { txt('BODY', TX, 92, fLab, FT.dim); txt(num(hp), TX, 146, '700 48px ' + F_MONO, frac < 0.3 && b.alive ? C.warning : FT.text); }
    const barY = STORY ? BY + 52 : 164, barH = STORY ? 22 : 26;
    rr(TX, barY, BW, barH, 6); ctx.fillStyle = FT.track; ctx.fill();
    if (frac > 0) {
      const low = frac < 0.3 && Math.floor(app.realT * 4) % 2 === 0;
      rr(TX, barY, Math.max(12, BW * frac), barH, 6); ctx.fillStyle = low ? C.warning : C.dummy; ctx.fill(); ctx.strokeStyle = C.joints; ctx.lineWidth = 2; ctx.stroke();
    }
    panel(X, DY, W, 86);
    txt('DASH', TX, DY + 30, fLab, FT.dim);
    if (s.dashFitted && !s.dashFitted()) { txt('NOT FITTED', X + W - 14, DY + 30, '700 15px ' + F_UI, FT.dim, 'right'); rr(TX, DY + 44, BW, 28, 6); ctx.fillStyle = FT.track; ctx.globalAlpha = 0.5; ctx.fill(); ctx.globalAlpha = 1; } // Edit 91: Battery 1 is the dash
    const cap = s.dashFitted && !s.dashFitted() ? 0 : s.capacity(), pw = (BW - (cap - 1) * 10) / cap; // Big battery: 3 (D26)
    for (let i = 0; i < cap; i++) {
      const x = TX + i * (pw + 10), f = clamp(b.charge - i, 0, 1);
      rr(x, DY + 44, pw, 28, 6); ctx.fillStyle = FT.track; ctx.fill();
      if (f > 0) { rr(x, DY + 44, Math.max(6, pw * f), 28, 6); ctx.fillStyle = f >= 1 ? FT.text : FT.dim; ctx.fill(); }
    }
    drawDistrict(s);
    if (STORY) drawScore(s);
    const cb = drawBodyPanel(s);
    drawKeysPanel(s, cb);
    app.layoutY = { left: s.district ? (() => { const G = mapGeom(s.district); return G.Y + 66 + G.mh + (s.storyMode ? STORY_FOOT : 0); })() : MAPY, right: cb }; // Edit 75: the touch zones start below these
    drawMessages(s);
  }
  // Left, below the dash: the district map (D24). Visited screens lit; the dummy's dot.
  // Prototype 6.2 (Edit 70): the map draws the district's real roads, from its linked lanes, by level, at one line weight:
  // Z0 white and solid; Z1 blue, dashed, over Z0; Z2 magenta, dashed, over Z1. Each lane moves to its road's centre line, so
  // both directions of a road are one line; a stretch already drawn at its level is not drawn again, so dashes stay clean
  // where junction and ring routes repeat it. Drawn once a district, at the canvas's scale.
  const MAP_Z = [null, '#3D7BFF', '#FF4FD8'], MAP_LW = 3, MAP_DASH = [6, 4];
  const MAPY = STORY ? FY - 6 + 192 : 318; // Edit 86–87: the map rises with the compact BODY panel, on the field's top edge
  const mapCache = { key: null, cv: null };
  function mapGeom(D) {
    const X = 16, Y = MAPY, W = FX - 32, g = 6, cw = Math.min(56, Math.floor((W - 16 - (D.cols - 1) * g) / D.cols)), ch = Math.round(cw * 0.75), gx = X + (W - (D.cols * cw + (D.cols - 1) * g)) / 2, gy = Y + 50;
    return { X, Y, W, g, cw, ch, gx, gy, mw: D.cols * cw + (D.cols - 1) * g, mh: D.rows * ch + (D.rows - 1) * g };
  }
  function mapRoads(s, G) { // per screen and level: road centre lines as runs of map points (unique within the screen and level)
    const Wd = s.P['world.width'], Hd = s.P['world.height'], half = s.P['world.laneWidth'] / 2, kx = G.cw / Wd, ky = G.ch / Hd, out = [];
    const off = (pts, d) => pts.map((p, i) => { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return [p[0] - dy / l * d, p[1] + dx / l * d]; });
    const byKey = new Map();
    for (const r of s.W6.recs) { const k = r.sc.col + ',' + r.sc.row + ',' + Math.min(2, r.elev); if (!byKey.has(k)) byKey.set(k, { sc: r.sc, z: Math.min(2, r.elev), recs: [] }); byKey.get(k).recs.push(r); }
    for (const grp of byKey.values()) {
      const seen = new Set(), cell = 1.5, near = (mx, my) => { const i = Math.floor(mx / cell), j = Math.floor(my / cell); for (let b = -1; b <= 1; b++) for (let a = -1; a <= 1; a++) if (seen.has((i + a) + ',' + (j + b))) return true; return false; };
      const runs = [];
      for (const r of grp.recs) {
        const pts = off(r.path.pts, -half), samp = [];
        for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(1, Math.ceil(Math.hypot((x1 - x0) * kx, (y1 - y0) * ky) / 0.75)); for (let t = i === 1 ? 0 : 1; t <= n; t++) samp.push([x0 + (x1 - x0) * t / n, y0 + (y1 - y0) * t / n]); }
        let run = null; const marks = [];
        for (const [wx, wy] of samp) {
          const inside = wx > -60 && wy > -60 && wx < Wd + 60 && wy < Hd + 60, mx = wx * kx, my = wy * ky, dup = !inside || near(mx, my);
          if (!dup) { if (!run) { run = []; runs.push(run); } run.push([mx, my]); marks.push([mx, my]); } else run = null;
        }
        for (const [mx, my] of marks) seen.add(Math.floor(mx / cell) + ',' + Math.floor(my / cell));
      }
      out.push({ sc: grp.sc, z: grp.z, runs: runs.filter((q) => q.length > 1) });
    }
    return out;
  }
  function mapCanvas(s, G) {
    const k = Math.max(2, Math.ceil(scale)), key = s.levelId + '|' + k + '|' + FT.text + '|' + G.cw;
    if (mapCache.key === key) return mapCache.cv;
    const cv = document.createElement('canvas'); cv.width = Math.ceil(G.mw * k); cv.height = Math.ceil(G.mh * k);
    const c2 = cv.getContext('2d'); c2.scale(k, k); c2.lineCap = 'round'; c2.lineJoin = 'round';
    const groups = mapRoads(s, G);
    for (const z of [0, 1, 2]) for (const grp of groups.filter((q) => q.z === z)) {
      const ox = grp.sc.col * (G.cw + G.g), oy = grp.sc.row * (G.ch + G.g);
      c2.save(); c2.beginPath(); c2.rect(ox, oy, G.cw, G.ch); c2.clip();
      c2.strokeStyle = z ? MAP_Z[z] : FT.text; c2.lineWidth = MAP_LW; c2.setLineDash(z ? MAP_DASH : []);
      for (const run of grp.runs) { c2.beginPath(); run.forEach(([x, y], i) => (i ? c2.lineTo(ox + x, oy + y) : c2.moveTo(ox + x, oy + y))); c2.stroke(); }
      c2.restore();
    }
    mapCache.key = key; mapCache.cv = cv;
    return cv;
  }
  function drawDistrict(s) {
    const D = s.district;
    if (!D) return;
    const G = mapGeom(D), { X, Y, W, g, cw, ch, gx, gy } = G;
    const sm = s.storyMode, foot = sm ? STORY_FOOT : 0; // Edit 81: the story reveals tiles as they open; the brief sits under the map
    panel(X, Y, W, 50 + D.rows * ch + (D.rows - 1) * g + 16 + foot);
    if (STORY) { const t = INFO(s.levelId).name.toUpperCase() + ' · ' + s.screenName() + whereOf(s); fitText(t, X + 14, Y + 32, W - 28, 24, 14, FT.text); if (app.hud) app.hud.map = { x: X, y: Y, w: W, title: t }; } // Edit 87: [map] · [tile]
    else { txt('DISTRICT', 30, Y + 32, fLab, FT.dim); txt(s.screenName(), X + W - 14, Y + 32, fLab, FT.text, 'right'); }
    const Wd = s.P['world.width'], Hd = s.P['world.height'], lanes = !!(s.W6 && s.W6.recs), mc = lanes ? mapCanvas(s, G) : null;
    for (let iy = 0; iy < D.rows; iy++) for (let ix = 0; ix < D.cols; ix++) {
      const x = gx + ix * (cw + g), y = gy + iy * (ch + g), cur = D.cur[0] === ix && D.cur[1] === iy, cell = D.cells[iy][ix];
      const st = sm ? STORY.tileState(s.story, s.levelId, 'ABC'[ix] + (iy + 1)) : null, seen = sm ? st === 'cleared' : D.visited.has(iy * D.cols + ix); // Edit 83: only cleared tiles at full strength
      rr(x, y, cw, ch, 5); ctx.fillStyle = lanes ? (seen || cur ? FT.item : FT.track) : cur ? FT.sel : seen ? FT.item : FT.track; ctx.fill();
      ctx.save(); rr(x, y, cw, ch, 5); ctx.clip();
      if (iy === 0 && !W6) { ctx.fillStyle = rgba(PIX.PAL.water.length === 7 ? PIX.PAL.water : '#4FC3E8', 0.9); ctx.fillRect(x, y, cw, 4); }
      if (W6 && s.levelId === 'waterfront' && iy === 2) { ctx.fillStyle = rgba('#4FC3E8', 0.24); ctx.fillRect(x, y + ch * 0.8, cw, ch * 0.2); } // P6: the river along the bottom row, as water
      if (lanes) { ctx.globalAlpha = seen || cur ? 1 : 0.35; ctx.imageSmoothingEnabled = true; ctx.drawImage(mc, ix * (cw + g) * mc.width / G.mw, iy * (ch + g) * mc.height / G.mh, cw * mc.width / G.mw, ch * mc.height / G.mh, x, y, cw, ch); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 1; }
      else {
        ctx.beginPath(); (cell.center || []).forEach(([px, py], i) => { const qx = x + px / Wd * cw, qy = y + py / Hd * ch; if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); });
        if (cell.ring) cell.ring.forEach(([px, py], i) => { const qx = x + px / Wd * cw, qy = y + py / Hd * ch; if (i) ctx.lineTo(qx, qy); else ctx.moveTo(qx, qy); });
        ctx.strokeStyle = seen ? (cur ? FT.selText : FT.text) : FT.off; ctx.lineWidth = seen ? 5 : 3; ctx.lineJoin = 'round'; ctx.stroke();
        for (const dk of cell.decks || []) { // flyovers: a dashed line; the high highway (Z2) a heavier one
          const hi = (dk.z || 1) === 2;
          ctx.beginPath(); if (dk.hz) { ctx.moveTo(x, y + dk.off / Hd * ch); ctx.lineTo(x + cw, y + dk.off / Hd * ch); } else { ctx.moveTo(x + dk.off / Wd * cw, y); ctx.lineTo(x + dk.off / Wd * cw, y + ch); }
          ctx.strokeStyle = FT.accent; ctx.lineWidth = hi ? 4 : 2; ctx.setLineDash(hi ? [6, 2] : [3, 2]); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      if (cell.focal) { ctx.beginPath(); ctx.arc(x + cw / 2, y + ch / 2, 3, 0, TAU); ctx.fillStyle = FT.accent; ctx.fill(); }
      ctx.restore();
      if (sm && st === 'active') { rr(x - 1.5, y - 1.5, cw + 3, ch + 3, 6); ctx.strokeStyle = C.dummy; ctx.lineWidth = 3; ctx.stroke(); } // Edit 83: the live tile, ringed in yellow
      else if (sm && !cur) { rr(x, y, cw, ch, 5); ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1; ctx.stroke(); }
      if (sm && st === 'hidden') { rr(x, y, cw, ch, 5); ctx.fillStyle = 'rgba(40,46,56,0.55)'; ctx.fill(); } // greyed out until cleared
      if (!sm || (cur && st !== 'active')) { rr(x, y, cw, ch, 5); ctx.strokeStyle = cur ? FT.accent : FT.itemEdge; ctx.lineWidth = cur ? 3 : 1;
        if (cur && FT.neon) { ctx.save(); ctx.shadowColor = FT.accent; ctx.shadowBlur = 8; ctx.stroke(); ctx.restore(); } else ctx.stroke(); }
    }
    const b = s.body; // Edit 83: the objective sits on the bottom line; the live tile's yellow ring marks its fences
    if (b.alive) { const x = gx + D.cur[0] * (cw + g) + clamp(b.x / Wd, 0, 1) * cw, y = gy + D.cur[1] * (ch + g) + clamp(b.y / Hd, 0, 1) * ch; ctx.beginPath(); ctx.arc(x, y, 5, 0, TAU); ctx.fillStyle = C.dummy; ctx.fill(); ctx.strokeStyle = C.joints; ctx.lineWidth = 2; ctx.stroke(); }
  }
  // Right: the chassis. Each part shows the damage it took (sim: impact.part, body.parts); installed modules glow aqua.
  const PART_NAME = { head: 'HEAD', torso: 'TORSO', armL: 'L ARM', armR: 'R ARM', legL: 'L LEG', legR: 'R LEG' };
  const dollArt = new Map();
  function partLevels(s) {
    const P = s.P, H = maxHP(s), out = {};
    for (const [k, v] of Object.entries(s.body.parts || {})) { const sh = v / H; out[k] = v <= 0 ? 0 : sh >= P['proto.parts.brokenShare'] ? 3 : sh >= P['proto.parts.crackedShare'] ? 2 : 1; }
    return out;
  }
  // Owned nodes; in the shop the selected node is tried on (blinking); the tuning preview shows all 15.
  const DOLL_MODS = ABIL4 ? { battery: ['fastCharge', 'kineticCharge', 'bigBattery'], legs: ['jump', 'springStart', 'grip'], hands: ['carry', 'holdOn'], arms: ['throw', 'spine', 'hips'] } // Edit 80
    : ABIL3 ? { battery: ['fastCharge', 'kineticCharge', 'bigBattery'], legs: ['jump', 'springStart', 'grip'], arms: ['carry', 'throw', 'holdOn'] } // Edit 79
    : { battery: ['fastCharge', 'kineticCharge', 'bigBattery', 'spine'], legs: ['jump', 'springStart', 'grip', 'hips'], arms: ['carry', 'holdOn', 'neck', 'ears'], throw: ['throw', 'widerView', 'memory'] }; // Edit 77–78: a piece per level
  function dollMods(s) {
    if (app.previewMods) return PIX.MODULES;
    if (ABIL) {
      const out = []; for (const t of Object.keys(TRACKS)) out.push(...DOLL_MODS[t].slice(0, s.tier(t)));
      const nn = s.phase === 'shop' && app.shopRow < SHOP_ROWS ? nextLevel(s, SHOP_GRID[app.shopCol][0]) : null, sel = nn && !s.storyMode ? NODES7[nn] : null; // Edit 89: a part not yet issued is not tried on
      if (sel && s.tier(sel.track) < sel.level && Math.floor(app.realT * 3) % 2 === 0) out.push(...DOLL_MODS[sel.track].slice(s.tier(sel.track), sel.level));
      return out;
    }
    const sel = s.phase === 'shop' && app.shopRow < 2 ? SHOP_GRID[app.shopCol][app.shopRow] || null : null;
    const tryOn = sel && !s.has(sel) && Math.floor(app.realT * 3) % 2 === 0;
    const own = (m) => s.has(m) || (m === 'springStart' && s.has('ricochet')), tried = (m) => tryOn && (m === sel || (m === 'springStart' && sel === 'ricochet')); // Edit 75: Ricochet wears the spring legs
    return PIX.MODULES.filter((m) => own(m) || tried(m));
  }
  function dollCanvas(levels, flash, mods, reds) {
    const key = JSON.stringify(levels) + flash + mods.join() + (reds ? JSON.stringify(reds) : '');
    if (dollArt.has(key)) return dollArt.get(key);
    if (dollArt.size > 64) dollArt.clear();
    const S = PIX.doll(levels, flash, mods, reds), cv2 = document.createElement('canvas'); cv2.width = S.w; cv2.height = S.h;
    const c2 = cv2.getContext('2d'), id = c2.createImageData(S.w, S.h); new Uint32Array(id.data.buffer).set(S.d); c2.putImageData(id, 0, 0);
    dollArt.set(key, cv2);
    return cv2;
  }
  function partEffects(s) { // the abilities the damage has cut, as shown on the chassis panel
    const out = [], pc = (v) => Math.round(v * 100) + '%';
    const sp = s.partEffect('speed'), tu = s.partEffect('turn'), vw = s.partEffect('view'), th = s.partEffect('throw');
    const da = s.partEffect('dash'), rc = ABIL ? s.partEffect('recharge') : 1;
    if (sp < 0.995) out.push(['SPEED', pc(sp)]);
    if (da < 0.995) out.push(['DASH', pc(da)]);
    if (rc < 0.995) out.push(['RECHARGE', pc(rc)]); // Edit 77: torso damage slows the battery
    if (tu < 0.995 && !ABIL) out.push(['TURN', pc(tu)]);
    if (vw < 0.995) out.push(['VIEW', Math.round(s.coneWidth()) + '°']);
    if (s.armsBroken() && (s.has('carry') || s.has('throw'))) out.push(['CONE', 'NO GRIP']);
    else if (th < 0.995 && s.has('throw')) out.push(['THROW', pc(th)]);
    return out;
  }
  // The chassis doll is drawn at ui.artScale like the field: one doll pixel = one art pixel, on the art grid.
  // Edit 91 (P7.10): Story's chassis: each part reddens with its damage (its share of the chassis, to proto.parts.brokenShare);
  // its damage beside it. Head and torso on the part; arms and legs in the margins. No rows of effects beneath
  const PART_TAG = { head: [32, 7, 'on'], torso: [32, 47, 'on'], armR: [9, 60, 'L'], armL: [55, 60, 'R'], legR: [20, 88, 'L'], legL: [44, 88, 'R'] };
  function partReds(s) { const out = {}, br = s.P['proto.parts.brokenShare'], H = maxHP(s); for (const [k, v] of Object.entries(s.body.parts || {})) if (v > 0) out[k] = Math.round(Math.min(1, v / H / br) * 20) / 20; return out; }
  function redText(f) { const a = [244, 248, 250], b = [255, 61, 61], m = (i) => Math.round(a[i] + (b[i] - a[i]) * f); return 'rgb(' + m(0) + ',' + m(1) + ',' + m(2) + ')'; }
  function drawBodyPanel(s) {
    const X = FX + FW + 16, W = VW - X - 16, Y = STORY ? FY - 6 : 62, b = s.body, U = RA, eff = b.alive && !STORY ? partEffects(s) : []; // U here: reference units per art px; Edit 91: on the top edge; no effect rows in P7
    const DW = PIX.DOLL_W * U, DH = PIX.DOLL_H * U, top = Y + 44, yHit = top + DH + (STORY ? 26 : 36), dV = STORY ? 0 : 38; // Edit 86–87: LAST HIT on one row
    const ph = yHit - Y + (STORY ? 20 : 66) + (eff.length ? 16 + eff.length * 32 : 0);
    panel(X, Y, W, ph); if (app.hud) app.hud.chassis = { x: X, y: Y, w: W, h: ph };
    txt('CHASSIS ' + String(b.chassis).padStart(2, '0'), X + 14, Y + 30, fLab, FT.dim);
    const lp = fx.lastPart, flash = lp && app.realT - lp.t < 0.3 && Math.floor(app.realT * 16) % 2 === 0 ? lp.part : '';
    const dx = Math.round((X + W / 2 - DW / 2) / U) * U, dy = Math.round(top / U) * U, reds = STORY && b.alive ? partReds(s) : null;
    ctx.imageSmoothingEnabled = false; ctx.globalAlpha = b.alive ? 1 : 0.35;
    ctx.drawImage(dollCanvas(partLevels(s), flash, dollMods(s), reds), dx, dy, DW, DH);
    ctx.globalAlpha = 1;
    if (reds) { // the numbers beside the parts
      const tags = []; ctx.font = '700 14px ' + F_MONO;
      for (const [k, [px, py, side]] of Object.entries(PART_TAG)) {
        const v = Math.round(b.parts[k] || 0); if (v <= 0) continue;
        const t = num(v), tw = ctx.measureText(t).width, ty = dy + (py + 3) * U, col = redText(reds[k] || 0);
        if (side === 'on') { const bw = tw + 10; rr(dx + px * U - bw / 2, ty - 10, bw, 20, 6); ctx.fillStyle = 'rgba(10,14,22,0.78)'; ctx.fill(); txt(t, dx + px * U, ty + 5, '700 14px ' + F_MONO, col, 'center'); }
        else if (side === 'L') txt(t, Math.min(dx - 2, dx + px * U - 12), ty + 5, '700 14px ' + F_MONO, col, 'right');
        else txt(t, Math.max(dx + DW + 2, dx + px * U + 12), ty + 5, '700 14px ' + F_MONO, col);
        tags.push(k + ' ' + v);
      }
      if (app.hud) app.hud.chassis.tags = tags.join(', ');
    }
    txt('LAST HIT', X + 14, yHit, STORY ? '700 15px ' + F_UI : fTxt, FT.dim);
    if (STORY) fitTextR(lp ? PART_NAME[lp.part] + '  −' + num(lp.lost) : '—', X + W - 14, yHit, W - 110, 20, 13, lp ? FT.text : FT.dim);
    else txt(lp ? PART_NAME[lp.part] + '  −' + num(lp.lost) : '—', X + 14, yHit + dV, fLab, lp ? FT.text : FT.dim);
    eff.forEach(([k2, v], i) => { const y = yHit + dV + 48 + i * 32; txt(k2, X + 14, y, fTxt, FT.dim); txt(v, X + W - 14, y, fLab, C.warning, 'right'); });
    return Y + ph;
  }

  // ---------- screens (frame layer). Facts at ui.typeLoadBearing, labels and lines at ui.typeSecondary.
  function veil() { ctx.fillStyle = FT.veil; ctx.fillRect(FX, FY, FW, FH); }
  function menuList(items, sel, x, y, w, disabled, rowH, pick) { // Edit 89: pick(i) moves the cursor; a tap picks the row and presses A
    rowH = rowH || 54;
    items.forEach((it, i) => {
      const yy = y + i * rowH, on = i === sel, off = disabled && disabled(i);
      if (pick) hitbox(x, yy, w, rowH - 10, 'menu:' + it, () => { pick(i); menuQ.push('ok'); });
      rr(x, yy, w, rowH - 10, 10); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill();
      ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
      txt(it, x + 18, yy + (rowH - 10) / 2 + 8, fLab, off ? FT.off : on ? FT.selText : FT.text);
    });
  }
  function difficultyHealth(i) { const k = 'proto.health.' + DIFFICULTIES[i].key; return app.tune[k] != null ? app.tune[k] : PROTO[k]; }
  function endItems(s) {
    const hs = HS ? ['High scores'] : [], ranked = HS && app.hsLast && app.hsLast.rank && app.hsLast.key !== 'story' ? ['Name this score'] : []; // Edit 97 (P8.2)
    if (app.mode === 'story') return (CREDITS && s.run.ending && s.run.ending.kind === 'Certified' ? ['Credits'] : []).concat(['Story map'], hs, ['Quit to title', 'Show trace']); // Edit 81. Edit 95 (P8): after CERTIFIED, the Credits first
    const won = !(s.run.ending && s.run.ending.kind !== 'Licensed');
    if (STORY) return ranked.concat([won ? 'Play this district again' : 'Retry this district', 'Choose a district'], hs, ['Show trace']); // Edit 81: Arcade, one district a run
    return won ? END_ITEMS : ['Retry this district', ...END_ITEMS];
  }
  function quotaOf(id) { const k = W6 || DISTRICTS[id] ? 'world.district.' + id + '.quota' : 'proto.quota.' + id; return app.tune[k] != null ? app.tune[k] : REG[k] != null ? REG[k] : PROTO[k]; }
  function drawTitle() {
    drawField(preview(app.level), true);
    veil();
    const x = FX + 30, y = FY + 22, w = FW - 60, h = FH - 44;
    panel(x, y, w, h);
    const TT = CTM && CTM.title, tv = { roads: LEVEL_LIST.length, q1: quotaOf(LEVEL_LIST[0]), q2: quotaOf(LEVEL_LIST[1]), q3: quotaOf(LEVEL_LIST[2]) };
    txt('DUMMIES', x + 30, y + 76, '900 64px ' + F_BRAND, FT.text);
    wrapText(TT && TT.lines ? fillIn(TT.lines[0], tv) : LT('n01', 'You are a FARSIGHT crash-test subject. Cars avoid you. Fool them into hitting you.'), x + 32, y + 116, w - 64, 30, fTxt, FT.dim, 2);
    LEVEL_LIST.forEach((id, i) => { // Edit 41: five districts, in order (P6: three)
      const yy = y + 160 + i * 46, on = i === app.level, q = quotaOf(id);
      hitbox(x + 28, yy, w - 56, 40, 'district:' + id, () => { if (app.level === i) menuQ.push('ok'); else app.level = i; }); // Edit 89: tap to choose; tap again to start
      rr(x + 28, yy, w - 56, 40, 10); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill();
      ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
      txt((i + 1) + '  ' + INFO(id).name, x + 48, yy + 30, fLab, on ? FT.selText : FT.text);
      txt(q + ' WRITE-OFF' + (q === 1 ? '' : 'S'), x + w - 48, yy + 28, fLab, on ? FT.selText : FT.dim, 'right');
    });
    const dname = DIFFICULTIES[app.difficulty].name.toUpperCase(), dt = '◀  ' + dname + ' · ' + difficultyHealth(app.difficulty) + ' HEALTH  ▶';
    ctx.font = fKey; const dw = ctx.measureText(dt).width + 36;
    hitbox(x + w / 2 - dw / 2 - 30, y + 386, dw / 2 + 30, 52, 'difficulty:-', () => menuQ.push('left')); hitbox(x + w / 2, y + 386, dw / 2 + 30, 52, 'difficulty:+', () => menuQ.push('right')); // Edit 89: tap ◀ or ▶
    rr(x + w / 2 - dw / 2, y + 392, dw, 40, 20); ctx.fillStyle = app.difficulty === 1 ? FT.item : 'rgba(245,197,66,0.35)'; ctx.fill();
    ctx.strokeStyle = FT.accent; ctx.lineWidth = 1.5; ctx.stroke();
    txt(dt, x + w / 2, y + 420, fKey, FT.text, 'center');
    drawKeys(TOUCH.on ? [['STICK', 'MOVE'], ['A', 'DASH'], ['❚❚', 'PAUSE']] : app.device === 'pad' ? [['STICK', 'MOVE'], ['A', 'DASH'], ['START', 'PAUSE']] : [['WASD', 'MOVE'], ['SPACE', 'DASH'], ['ESC', 'PAUSE']], x + w / 2, y + 450);
    if (TOUCH.on) { const bw = 340; rr(x + w / 2 - bw / 2, y + h - 56, bw, 44, 12); ctx.fillStyle = FT.sel; ctx.fill(); ctx.strokeStyle = FT.accent; ctx.lineWidth = 1.5; ctx.stroke(); txt('START · ' + INFO(LEVEL_LIST[app.level]).name.toUpperCase(), x + w / 2, y + h - 26, fLab, FT.selText, 'center'); hitbox(x + w / 2 - bw / 2, y + h - 56, bw, 44, 'start', () => menuQ.push('ok')); } // Edit 89
    else txt(app.device === 'pad' ? 'PRESS A TO START' : TT && TT.start ? TT.start.toUpperCase() : 'PRESS SPACE TO START', x + w / 2, y + h - 22, fLab, FT.accent, 'center');
  }
  // ---------- Edit 81 (P7): the title's two modes; the story map; the tile card; the brief under the district map; fences
  const STORY_FOOT = 0; // Edit 83: the brief moved from under the district map to the bottom line
  const plural = (n, w) => n + ' ' + w + (n === 1 ? '' : 'S');
  function storyCursor() { // the tile in test (or the last one, once certified), as [column 0–8, row 0–2] on the story map
    const pr = app.story, D = STORY.DIST, did = pr.complete ? D[D.length - 1].id : pr.district, di = D.findIndex((d) => d.id === did);
    const t = STORY.activeTile(pr, did) || D[di].order[D[di].order.length - 1], [c, r] = STORY.cellOf(t);
    return [di * 3 + c, r];
  }
  function giftText(g) {
    if (!g) return null;
    if (g.node) { const nd = NODE(g.node); return (nd ? nd.name : g.node) + (nd && nd.desc ? ': ' + nd.desc : ''); }
    if (g.credits) { const n = pv(g.credits); return '+' + n + ' credit' + (n === 1 ? '' : 's') + ', to spend in the shop.'; }
    return null;
  }
  function drawModeTitle() {
    drawField(preview(Math.max(0, LEVEL_LIST.indexOf('monument'))), true);
    veil();
    const x = FX + 30, y = FY + 22, w = FW - 60, h = FH - 44;
    panel(x, y, w, h);
    if (!INTRO) { txt('DUMMIES', x + 30, y + 76, '900 64px ' + F_BRAND, FT.text); wrapText(LT('n01', 'You are a FARSIGHT crash-test subject. Cars avoid you. Fool them into hitting you.'), x + 32, y + 116, w - 64, 30, fTxt, FT.dim, 2); } // Edit 98 (P8.3): the intro screen carries the line
    const items = titleItems(), S = allSlots(), last = S.filter(Boolean).sort((a, b) => b.saved - a.saved)[0], pr = last && last.progress; // Edit 88: the latest save
    const sub = !last ? slotCount() + ' save slots · a new game begins in Monument A1' : last.name + ' · ' + (pr.complete ? 'certified' : INFO(pr.district).name + ' ' + STORY.activeTile(pr, pr.district) + ' · ' + STORY.clearedCount(pr) + ' of ' + STORY.TOTAL);
    const cardOf = { ARCADE: ['ARCADE', LT('n34', 'Pick one district and write off its quota. The score is the run.'), 'Parkland · Waterfront · Monument'], // Edit 97 (P8.2): n34, the grades
      STORY: ['STORY', LT('n03', 'The Test City, tile by tile. Each tile wants its write-offs to Farsight\'s brief.'), sub] };
    const cards = items.filter((it) => cardOf[it]).map((it) => cardOf[it]); // Edit 98 (P8.3): in the menu's order, STORY first
    const cw = (w - 56 - 20) / 2, chh = INTRO ? 250 : 206, top = INTRO ? Math.round(y + (h - 40 - (chh + 18 + 42)) / 2) : y + 162;
    cards.forEach(([name, line, foot], k) => {
      const i = items.indexOf(name), cx = x + 28 + k * (cw + 20), on = (app.titleSel % items.length) === i;
      hitbox(cx, top, cw, chh, 'title:' + name, () => { app.titleSel = i; menuQ.push('ok'); }); // Edit 89
      rr(cx, top, cw, chh, 14); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      txt(name, cx + 22, top + 50, '900 34px ' + F_BRAND, on ? FT.selText : FT.text);
      wrapText(line, cx + 22, top + 88, cw - 44, 27, '400 19px ' + F_UI, on ? FT.selText : FT.text, 3);
      fitText(foot, cx + 22, top + chh - 22, cw - 44, 17, 12, on ? FT.selText : FT.dim); // Edit 89: shrink to fit, never cut
    });
    const extra = items.filter((it) => it === 'HIGH SCORES' || it === 'CREDITS'); // Edit 95 (P8): the Credits; Edit 97 (P8.2): the high scores. Pills under the two modes
    extra.forEach((it, k) => {
      const i = items.indexOf(it), on = (app.titleSel % items.length) === i, bw = 220, gap = 20, by = top + chh + 18, bx = x + w / 2 - (extra.length * bw + (extra.length - 1) * gap) / 2 + k * (bw + gap);
      hitbox(bx, by, bw, 42, 'title:' + it, () => { app.titleSel = i; menuQ.push('ok'); });
      rr(bx, by, bw, 42, 21); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      txt(it, bx + bw / 2, by + 28, fLab, on ? FT.selText : FT.text, 'center');
    });
    const pd = TOUCH.on || app.device === 'pad';
    txt(TOUCH.on ? 'TAP A MODE' : pd ? 'STICK CHOOSE · A SELECT' : 'ARROWS CHOOSE · SPACE SELECT', x + w / 2, y + h - 22, fLab, FT.accent, 'center');
  }
  // Edit 88: the save screen. NEW GAME; then each slot: its number, name, time stamp; where the story stands (district, tile in
  // test, tiles cleared); points, credits, levels, chassis. The chosen slot shows its actions; ERASE and OVERWRITE ask twice
  function slotLines(v) {
    const pr = v.progress, cl = STORY.clearedCount(pr), t = pr.complete ? null : STORY.activeTile(pr, pr.district);
    return [pr.complete ? 'CERTIFIED · ALL ' + STORY.TOTAL + ' TILES' : INFO(pr.district).name.toUpperCase() + ' · ' + t + ' · TILE ' + STORY.tileNumber(pr.district, t) + ' OF ' + STORY.TOTAL + (pr.tileWO ? ' · ' + pr.tileWO + ' OF ' + STORY.needOf(pr.district, t) + ' WRITE-OFFS' : ''),
      cl + ' / ' + STORY.TOTAL + ' TILES · ' + num(pr.points || 0) + ' POINTS · ' + STORY.partsOwned(pr.owned) + ' / ' + STORY.VERBS.length + ' PARTS · CHASSIS ' + String(pr.chassis || 0).padStart(2, '0')]; // Edit 91: parts, not levels
  }
  function drawSaves() {
    drawField(preview(Math.max(0, LEVEL_LIST.indexOf('monument'))), true);
    veil();
    const x = FX + 16, y = FY + 14, w = FW - 32, h = FH - 28, n = slotCount(), S = allSlots(), over = app.saveMode === 'overwrite';
    panel(x, y, w, h);
    if (app.nameEntry) { drawNameEntry(x, y, w, h); return; }
    txt('SAVE GAMES', x + 24, y + 40, fLab, FT.accent);
    txt('SAVED IN THIS BROWSER', x + w - 24, y + 40, '700 15px ' + F_UI, FT.dim, 'right');
    const ny = y + 56, nh = 48, onN = app.saveSel === 0, free = S.findIndex((v) => !v);
    rr(x + 24, ny, w - 48, nh, 12); ctx.fillStyle = onN && !over ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = onN && !over ? FT.accent : FT.itemEdge; ctx.lineWidth = onN ? 3 : 1.5; ctx.stroke();
    txt('NEW GAME', x + 44, ny + 33, '900 24px ' + F_BRAND, onN && !over ? FT.selText : FT.text);
    txt(over ? 'CHOOSE A SLOT TO OVERWRITE · B CANCELS' : free >= 0 ? 'Monument A1 · into slot ' + (free + 1) : 'All ' + n + ' slots in use · overwrite one', x + w - 44, ny + 31, '700 16px ' + F_UI, over ? C.warning : onN ? FT.selText : FT.dim, 'right');
    hitbox(x + 24, ny, w - 48, nh, 'save:new', () => { if (app.saveMode) { app.saveMode = null; return; } app.saveSel = 0; app.slotAct = 0; app.saveConfirm = null; savesMenu('ok'); });
    const top = ny + nh + 12, gap = 10, ch = Math.min(148, Math.floor((y + h - 34 - top - (n - 1) * gap) / n));
    for (let i = 0; i < n; i++) {
      const v = S[i], cy = top + i * (ch + gap), on = app.saveSel === i + 1, cx = x + 24, cw = w - 48;
      rr(cx, cy, cw, ch, 12); ctx.fillStyle = on ? FT.keyTop : FT.item; ctx.fill(); ctx.strokeStyle = on ? (over ? C.warning : FT.accent) : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      hitbox(cx, cy, cw, ch, 'save:' + (i + 1), () => { if (app.saveSel !== i + 1) { app.saveSel = i + 1; app.slotAct = 0; app.saveConfirm = null; } });
      rr(cx + 16, cy + 14, 44, 44, 10); ctx.fillStyle = v ? C.dummy : FT.track; ctx.fill(); txt(String(i + 1), cx + 38, cy + 46, '900 28px ' + F_BRAND, v ? C.primary : FT.dim, 'center');
      if (v) {
        txt(v.name, cx + 76, cy + 42, '900 28px ' + F_MONO, FT.text);
        txt(stamp(v.saved), cx + cw - 18, cy + 30, '700 16px ' + F_UI, FT.dim, 'right');
        if (app.slot === i + 1) txt('IN PLAY', cx + cw - 18, cy + 52, '700 14px ' + F_UI, C.dummy, 'right');
        const [l1, l2] = slotLines(v);
        fitText(l1, cx + 76, cy + 72, cw - 94, 18, 13, FT.text);
        wrapText(l2, cx + 76, cy + 96, cw - 94, 20, '400 16px ' + F_UI, FT.dim, 1);
      } else {
        txt('EMPTY', cx + 76, cy + 42, '900 28px ' + F_MONO, FT.off);
        wrapText('No story saved here.', cx + 76, cy + 72, cw - 94, 20, '400 16px ' + F_UI, FT.dim, 1);
      }
      if (on) { // the actions
        const acts = slotActs(i + 1); let ax = cx + 76; const ay = cy + ch - 38;
        acts.forEach((a, j) => {
          const conf = app.saveConfirm === a + (i + 1), label = conf ? a + '? A AGAIN' : a, sj = j === Math.min(app.slotAct, acts.length - 1);
          ctx.font = '700 16px ' + F_UI; const aw = ctx.measureText(label).width + 30;
          rr(ax, ay, aw, 30, 8); ctx.fillStyle = conf ? C.warning : sj ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = sj ? FT.accent : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
          txt(label, ax + aw / 2, ay + 21, '700 16px ' + F_UI, conf ? '#FFFFFF' : sj ? FT.selText : FT.text, 'center');
          hitbox(ax, ay, aw, 30, 'act:' + (i + 1) + ':' + a, () => { app.saveSel = i + 1; app.slotAct = j; savesMenu('ok'); });
          ax += aw + 10;
        });
      }
    }
    const pd = TOUCH.on || app.device === 'pad';
    txt(TOUCH.on ? 'TAP A SLOT, THEN WHAT TO DO · B BACK' : pd ? 'STICK CHOOSE · A SELECT · B BACK' : 'ARROWS CHOOSE · SPACE SELECT · SHIFT BACK', x + w / 2, y + h - 12, '700 15px ' + F_UI, FT.dim, 'center');
  }
  function nameKeyRects(x, y, w) { // the grid, in reference units: 13 × 3 letters, then SPACE · DEL · OK
    const kw = 50, kh = 58, g = 5, gw = NAME_COLS * kw + (NAME_COLS - 1) * g, gx = x + (w - gw) / 2, gy = y + 196, out = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < NAME_COLS; c++) out.push({ r, c, x: gx + c * (kw + g), y: gy + r * (kh + 8), w: kw, h: kh, label: NAME_ROWS[r][c] });
    [[0, 3], [4, 8], [9, 12]].forEach(([c0, c1], k) => out.push({ r: 3, c: [1, 6, 10][k], x: gx + c0 * (kw + g), y: gy + 3 * (kh + 8), w: (c1 - c0 + 1) * kw + (c1 - c0) * g, h: kh, label: NAME_KEYS[k] }));
    return out;
  }
  function drawNameEntry(x, y, w, h) {
    const ne = app.nameEntry, M = nameMax();
    txt(ne.kind === 'score' ? 'HIGH SCORE · RANK ' + (app.hsLast ? app.hsLast.rank : '') + ' · ' + (app.hsLast ? hsTableName(app.hsLast.key) : '') : (ne.kind === 'rename' ? 'RENAME SLOT ' : 'NEW GAME · SLOT ') + ne.slot, x + 24, y + 40, fLab, FT.accent); // Edit 97 (P8.2): a high score's name
    txt(ne.text.length + ' / ' + M, x + w - 24, y + 40, '700 15px ' + F_UI, FT.dim, 'right');
    const cw = 44, fx0 = x + (w - M * cw) / 2, fy = y + 78, blink = Math.floor(app.realT * 2.5) % 2 === 0;
    hitbox(fx0 - 10, fy - 10, M * cw + 20, 76, 'name', () => { if (app.nameEntry) { nameInput.value = app.nameEntry.fresh ? '' : app.nameEntry.text; app.focusName = true; nameFocus(); } }); // touch: the phone's own keyboard
    for (let i = 0; i < M; i++) {
      const cx = fx0 + i * cw, ch = ne.text[i] || '';
      if (ne.fresh && ch) { ctx.fillStyle = FT.sel; ctx.fillRect(cx + 2, fy, cw - 4, 56); }
      txt(ch, cx + cw / 2, fy + 40, '700 32px ' + F_MONO, ne.fresh ? FT.selText : FT.text, 'center');
      ctx.fillStyle = i === ne.text.length && !ne.fresh && blink ? C.dummy : FT.itemEdge; ctx.fillRect(cx + 5, fy + 54, cw - 10, i === ne.text.length && !ne.fresh ? 4 : 2);
    }
    wrapText(TOUCH.on && document.activeElement !== nameInput ? 'Tap the name for the phone\'s keyboard, or use the keys below.' : ne.fresh ? 'Type to replace the name, or OK to keep it.' : 'Up to ' + M + ' characters: letters, digits, space, - . \'', x + 24, y + 166, w - 48, 22, '400 17px ' + F_UI, FT.dim, 1);
    for (const k of nameKeyRects(x, y, w)) {
      const on = k.r === ne.r && (k.r < 3 ? k.c === ne.c : nameKeyOf(k.c) === nameKeyOf(ne.c)), ok = k.label === 'OK';
      rr(k.x, k.y, k.w, k.h, 8); ctx.fillStyle = on ? FT.sel : ok ? FT.credit : FT.item; ctx.fill(); ctx.strokeStyle = on ? FT.accent : ok ? C.dummy : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      txt(k.label, k.x + k.w / 2, k.y + k.h / 2 + 9, (k.r < 3 ? '700 26px ' + F_MONO : '700 19px ' + F_UI), on ? FT.selText : FT.text, 'center');
      hitbox(k.x, k.y, k.w, k.h, 'key:' + k.label, () => { const ne2 = app.nameEntry; if (!ne2) return; ne2.r = k.r; ne2.c = k.c; nameOk(); });
    }
    const pd = TOUCH.on || app.device === 'pad';
    txt(TOUCH.on ? 'TAP A KEY · STICK AND A · B DELETES' : pd ? 'STICK CHOOSE · A TYPE · B DELETE · START OK' : 'TYPE THE NAME · ENTER OK · BACKSPACE DELETE · ESC CANCEL', x + w / 2, y + h - 12, '700 15px ' + F_UI, FT.dim, 'center');
  }
  function drawStoryMap() {
    const pr = app.story; if (!pr) { app.screen = 'title'; return; }
    drawField(preview(Math.max(0, LEVEL_LIST.indexOf(pr.district))), true);
    veil();
    const x = FX + 16, y = FY + 14, w = FW - 32, h = FH - 28, needT = (id, t) => pv('story.writeOffs.' + id + '.' + t); // Edit 82: a count per tile
    panel(x, y, w, h);
    const sv = app.slot && allSlots()[app.slot - 1], stat = STORY.clearedCount(pr) + ' / ' + STORY.TOTAL + ' TILES · ' + num(pr.points) + ' POINTS · ' + STORY.partsOwned(pr.owned) + ' / ' + STORY.VERBS.length + ' PARTS'; // Edit 91
    ctx.font = '700 18px ' + F_UI; const sw = ctx.measureText(stat).width;
    txt(stat, x + w - 24, y + 40, '700 18px ' + F_UI, FT.text, 'right');
    fitText(sv ? 'SLOT ' + app.slot + ' · ' + sv.name : 'THE TEST CITY', x + 24, y + 40, w - 48 - sw - 24, TY.sec, 14, FT.accent); // Edit 88: the slot in play
    const sel = app.mapSel || storyCursor(), gap = 24, gw = (w - 48 - 2 * gap) / 3, g = 6, cw = (gw - 2 * g) / 3, ch = Math.round(cw * 0.8), top = y + 86;
    STORY.DIST.forEach((d, di) => {
      const gx = x + 24 + di * (gw + gap), here = !pr.complete && pr.district === d.id, dn = STORY.doneIn(pr, d.id);
      fitText((d.act ? d.act.split(' · ')[0].replace('ACT ', '') + ' · ' : '') + d.name.toUpperCase(), gx, top - 12, gw - 48, TY.sec, 13, here ? FT.accent : dn.length ? FT.text : FT.dim); // Edit 92: the act's numeral
      txt(dn.length + '/' + d.order.length, gx + gw, top - 12, fLab, FT.dim, 'right');
      const at = (t) => { const [c, r] = STORY.cellOf(t); return [gx + c * (cw + g), top + r * (ch + g)]; };
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
        const t = 'ABC'[c] + (r + 1), st = STORY.tileState(pr, d.id, t), [cx, cy] = at(t), on = sel[0] === di * 3 + c && sel[1] === r, pulse = st === 'active' && Math.floor(app.realT * 2) % 2 === 0;
        hitbox(cx, cy, cw, ch, 'tile:' + d.id + ':' + t, () => { if (on && st === 'active') menuQ.push('ok'); else app.mapSel = [di * 3 + c, r]; }); // Edit 89: tap to read; the tile in test, tapped again, deploys
        rr(cx, cy, cw, ch, 6); ctx.fillStyle = st === 'cleared' ? 'rgba(79,195,232,0.30)' : st === 'active' ? FT.keyTop : 'rgba(40,46,56,0.55)'; ctx.fill(); // Edit 83: uncleared greyed out
        ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1; ctx.stroke();
        if (st === 'active') { rr(cx - 2, cy - 2, cw + 4, ch + 4, 8); ctx.strokeStyle = C.dummy; ctx.lineWidth = pulse ? 4 : 3; ctx.stroke(); } // the live tile, ringed in yellow
        txt(t, cx + 8, cy + 22, '700 17px ' + F_UI, st === 'hidden' ? FT.off : FT.text);
        if (st !== 'hidden') txt(st === 'cleared' ? '✓' : pr.tileWO + '/' + needT(d.id, t), cx + cw - 8, cy + ch - 9, '700 15px ' + F_UI, st === 'cleared' ? FT.accent : C.dummy, 'right');
      }
      // the route between revealed tiles, a dot in the gap where one leads to the next
      for (let i = 1; i < d.order.length; i++) {
        const a = d.order[i - 1], b = d.order[i];
        if (STORY.tileState(pr, d.id, a) === 'hidden' || STORY.tileState(pr, d.id, b) === 'hidden') continue;
        const [ax, ay] = at(a), [bx, by] = at(b);
        const mx = ax === bx ? ax + cw / 2 : Math.max(ax, bx) - g / 2, my = ay === by ? ay + ch / 2 : Math.max(ay, by) - g / 2;
        ctx.beginPath(); ctx.arc(mx, my, 4, 0, TAU); ctx.fillStyle = FT.accent; ctx.fill();
      }
    });
    // the tile under the cursor: its tale and brief, once revealed
    const d = STORY.DIST[Math.floor(sel[0] / 3)], t = 'ABC'[sel[0] % 3] + (sel[1] + 1), st = STORY.tileState(pr, d.id, t), tile = d.tiles[t];
    const iy = top + 3 * ch + 2 * g + 22, ih = y + h - 82 - iy, ix = x + 24, iw = w - 48;
    rr(ix, iy, iw, ih, 12); ctx.fillStyle = FT.item; ctx.fill(); ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1; ctx.stroke();
    const pts = pr.tilePoints[d.id + ':' + t];
    txt(d.name.toUpperCase() + ' · ' + t + ' · TILE ' + STORY.tileNumber(d.id, t) + ' OF ' + STORY.TOTAL + (st === 'cleared' ? ' · CLEARED' + (pts != null ? ' · ' + num(pts) + ' POINTS' : '') : st === 'active' ? ' · IN TEST · ' + pr.tileWO + ' OF ' + needT(d.id, t) : st === 'hidden' ? '' : ''), ix + 18, iy + 30, '700 16px ' + F_UI, FT.accent);
    if (st === 'hidden') {
      txt('Not yet surveyed', ix + 18, iy + 70, '900 26px ' + F_BRAND, FT.dim);
      wrapText('Clear the tiles before it. The map opens one tile at a time.', ix + 18, iy + 104, iw - 36, 26, '400 19px ' + F_UI, FT.dim, 2);
    } else {
      txt(tile.title, ix + 18, iy + 68, '900 26px ' + F_BRAND, FT.text);
      const n = wrapText(CARD ? d.intro : tile.tale, ix + 18, iy + 100, iw - 36, 24, '400 18px ' + F_UI, CARD ? FT.dim : FT.text, 4); // Edit 98 (P8.3): the tale is on the level card; the act line here
      const tx = STORY.taskText(tile.task, null), gt = giftText(tile.gift);
      wrapText(LT('n05', 'FARSIGHT BRIEF · {LABEL}', { LABEL: tx.label }) + (gt ? ' · GIFT: ' + gt.split(':')[0] : ''), ix + 18, iy + 100 + n * 24 + 12, iw - 36, 24, '700 17px ' + F_UI, FT.accent, 2);
    }
    const on = !pr.complete, bt = pr.complete ? 'THE TEST CITY IS CERTIFIED' : 'DEPLOY · ' + INFO(pr.district).name.toUpperCase() + ' ' + STORY.activeTile(pr, pr.district);
    rr(x + 24, y + h - 72, w - 48, 44, 12); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = FT.accent; ctx.lineWidth = 1.5; ctx.stroke();
    if (on) hitbox(x + 24, y + h - 72, w - 48, 44, 'deploy', () => menuQ.push('ok')); // Edit 89
    txt(bt, x + w / 2, y + h - 42, fLab, on ? FT.selText : FT.text, 'center');
    const pd = TOUCH.on || app.device === 'pad';
    txt(TOUCH.on ? 'TAP A TILE TO READ IT · TAP DEPLOY · B BACK' : pd ? 'STICK READ A TILE · A DEPLOY · B BACK' : 'ARROWS READ A TILE · SPACE DEPLOY · SHIFT BACK', x + w / 2, y + h - 8, '700 15px ' + F_UI, FT.dim, 'center');
  }
  function drawBrief(s) { // the tile card: where you are, how it came to be, what Farsight wants
    veil();
    const pr = s.story, t = s.screenName(), d = STORY.districtOf(s.levelId), tile = d.tiles[t], P = s.P, tx = STORY.taskText(tile.task, P), need = STORY.needOf(d.id, t, P);
    const x = FX + 36, y = FY + 26, w = FW - 72, h = FH - 52;
    panel(x, y, w, h); hitbox(x, y, w, h, 'brief', () => menuQ.push('ok')); // Edit 89: a tap begins
    fitText((d.act ? d.act + ' · ' : '') + d.name.toUpperCase() + ' · TILE ' + t + ' · ' + STORY.tileNumber(d.id, t) + ' OF ' + STORY.TOTAL, x + 30, y + 44, w - 60, TY.sec, 13, FT.accent); // Edit 92: the act
    txt(tile.title, x + 30, y + 96, '900 40px ' + F_BRAND, FT.text);
    let yy = y + 138;
    if (d.order[0] === t && !STORY.doneIn(pr, d.id).length) { yy += 28 * wrapText(d.intro, x + 32, yy, w - 64, 28, '700 19px ' + F_UI, FT.dim, 2) + 8; }
    yy += 30 * wrapText(tile.tale, x + 32, yy, w - 64, 30, fTxt, FT.text, 5) + 12;
    ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x + 30, yy); ctx.lineTo(x + w - 30, yy); ctx.stroke();
    yy += 38;
    txt(LT('n04', 'FARSIGHT BRIEF'), x + 30, yy, fLab, FT.accent); txt(tx.label, x + w - 30, yy, fLab, FT.text, 'right');
    if (LORE) { // Edit 95: the brief stays at two sentences; the count is a label
      yy += 32; yy += 28 * wrapText(tx.brief, x + 32, yy, w - 64, 28, '400 19px ' + F_UI, FT.text, 2);
      txt('TO CLEAR · ' + need + ' COUNTED WRITE-OFF' + (need === 1 ? '' : 'S') + (pr.tileWO ? ' · ' + pr.tileWO + ' SO FAR' : ''), x + 32, yy, '700 15px ' + F_UI, FT.dim); yy += 24;
    } else { yy += 32; yy += 28 * wrapText(tx.brief + ' ' + (need === 1 ? 'One counted write-off clears the tile.' : need + ' counted write-offs clear the tile' + (pr.tileWO ? ' (' + pr.tileWO + ' so far).' : '.')), x + 32, yy, w - 64, 28, '400 19px ' + F_UI, FT.text, 3); }
    const gt = tile.gift && pr.gifts[d.id + ':' + t] ? giftText(tile.gift) : null;
    if (gt) { yy += 12; rr(x + 28, yy, w - 56, 48, 12); ctx.fillStyle = FT.credit; ctx.fill(); ctx.strokeStyle = C.dummy; ctx.lineWidth = 1.5; ctx.stroke(); wrapText('GIFT · ' + gt, x + 46, yy + 31, w - 92, 24, '700 18px ' + F_UI, FT.text, 1); }
    txt(TOUCH.on ? 'TAP TO BEGIN THE TEST' : app.device === 'pad' ? 'A  BEGIN THE TEST' : 'SPACE  BEGIN THE TEST', x + w - 30, y + h - 24, fLab, FT.accent, 'right');
    txt('Fenced until cleared. Cleared tiles stay open.', x + 30, y + h - 24, '400 17px ' + F_UI, FT.dim);
  }
  // Edit 84: the gift screen, as in Zelda's item fanfare. The chassis, lit. A drone brings the module down over its part and lets go;
  // it falls (ui.gift.fallSeconds) and lands with a flash, a ring, sparks and the fanfare. Then the verb: its name, its button,
  // what it does, and what the shop now sells on the same track. A continues after ui.gift.holdSeconds.
  const giftArt = new Map(), sprArt = new Map();
  function sprCanvas(S) {
    if (sprArt.has(S)) return sprArt.get(S);
    const cv2 = document.createElement('canvas'); cv2.width = S.w; cv2.height = S.h;
    const c2 = cv2.getContext('2d'), id = c2.createImageData(S.w, S.h); new Uint32Array(id.data.buffer).set(S.d); c2.putImageData(id, 0, 0);
    sprArt.set(S, cv2); return cv2;
  }
  function giftArtOf(s, node) { // the chassis without the new module (base), the module's own pixels (mod), the same in white (white), its centre
    const nd = NODES7[node], lv = partLevels(s), own = dollMods(s), m = nd && DOLL_MODS[nd.track] ? DOLL_MODS[nd.track][nd.level - 1] : null;
    const key = node + JSON.stringify(lv) + own.join();
    if (giftArt.has(key)) return giftArt.get(key);
    const before = own.filter((q) => q !== m), after = m && !own.includes(m) ? own.concat(m) : own;
    const A = PIX.doll(lv, '', before), B = PIX.doll(lv, '', after), W = A.w, H = A.h, N = W * H;
    const mk = (fill) => { const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; const c2 = cv2.getContext('2d'), id = c2.createImageData(W, H); fill(new Uint32Array(id.data.buffer)); c2.putImageData(id, 0, 0); return cv2; };
    let n = 0, sx = 0, sy = 0, x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let i = 0; i < N; i++) if (A.d[i] !== B.d[i] && B.d[i]) { const px = i % W, py = Math.floor(i / W); n++; sx += px; sy += py; x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
    const out = { base: mk((u) => u.set(A.d)), mod: mk((u) => { for (let i = 0; i < N; i++) if (A.d[i] !== B.d[i]) u[i] = B.d[i]; }),
      white: mk((u) => { for (let i = 0; i < N; i++) if (A.d[i] !== B.d[i] && B.d[i]) u[i] = 0xFFFFFFFF; }), cx: n ? sx / n : W / 2, cy: n ? sy / n : H / 2, n, box: n ? [x0, y0, x1 + 1, y1 + 1] : [0, 0, W, H] };
    if (giftArt.size > 8) giftArt.clear();
    giftArt.set(key, out); return out;
  }
  function giftReady() { return !!fx.gift && app.realT - fx.gift.t0 >= pv('ui.gift.holdSeconds'); }
  function drawGiftPopup(s) {
    const g = fx.gift, nd = g && NODES7[g.node], tr = nd && TRACKS[nd.track]; if (!nd || !tr) return;
    const t = g.pin != null ? g.pin : app.realT - g.t0, fall = Math.max(0.1, pv('ui.gift.fallSeconds')), land = t - fall, P = s.P, art = giftArtOf(s, g.node);
    const clamp01 = (v) => Math.max(0, Math.min(1, v)), back = (u) => 1 + 2.70158 * Math.pow(u - 1, 3) + 1.70158 * Math.pow(u - 1, 2);
    ctx.save(); ctx.globalAlpha = clamp01(t / 0.18); veil(); veil(); ctx.restore();
    const x = FX + 36, y = FY + 26, w = FW - 72, h = FH - 52, k = RM ? 1 : 0.86 + 0.14 * back(clamp01(t / 0.3));
    const sh = !RM && land >= 0 && land < 0.35 ? 8 * Math.pow(1 - land / 0.35, 2) : 0, ox = sh * Math.sin(t * 93), oy = sh * Math.cos(t * 71);
    ctx.save(); ctx.translate(x + w / 2 + ox, y + h / 2 + oy); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
    panel(x, y, w, h);
    const SC = 4, DW = PIX.DOLL_W * SC, DH = PIX.DOLL_H * SC, dx = x + 40, dy = Math.round(y + (h - DH) / 2 + 18), mx = dx + (art.cx + 0.5) * SC, my = dy + (art.cy + 0.5) * SC, rx = dx + DW / 2, ry = dy + DH * 0.42;
    ctx.save(); rr(x + 2, y + 2, w - 4, h - 4, 14); ctx.clip();
    { const gl = ctx.createRadialGradient(rx, ry, 20, rx, ry, 260); gl.addColorStop(0, 'rgba(63,208,255,0.22)'); gl.addColorStop(1, 'rgba(63,208,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y, w, h); }
    if (land >= 0) { // rays, turning
      const a = clamp01(land / 0.3), rot = RM ? 0.3 : app.realT * 0.5, R = 360, N = 14, gr = ctx.createRadialGradient(mx, my, 8, mx, my, R);
      gr.addColorStop(0, 'rgba(245,197,66,' + (0.6 * a) + ')'); gr.addColorStop(1, 'rgba(245,197,66,0)');
      ctx.fillStyle = gr; ctx.beginPath();
      for (let i = 0; i < N; i++) { const a0 = rot + i * TAU / N; ctx.moveTo(mx, my); ctx.arc(mx, my, R, a0, a0 + TAU / N * 0.42); ctx.closePath(); }
      ctx.fill();
    }
    ctx.imageSmoothingEnabled = false;
    ctx.globalAlpha = land < 0 ? 0.6 : Math.min(1, 0.6 + land / 0.15); ctx.drawImage(art.base, dx, dy, DW, DH); ctx.globalAlpha = 1; // dimmed until the module lands
    if (land < 0) { // where it goes: brackets on the module's seat, pulsing
      const [bx0, by0, bx1, by1] = art.box, X0 = dx + bx0 * SC - 8, Y0 = dy + by0 * SC - 8, X1 = dx + bx1 * SC + 8, Y1 = dy + by1 * SC + 8, L = 14;
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(app.realT * 12); ctx.strokeStyle = C.dummy; ctx.lineWidth = 3; ctx.beginPath();
      for (const [cx2, cy2, sx2, sy2] of [[X0, Y0, 1, 1], [X1, Y0, -1, 1], [X0, Y1, 1, -1], [X1, Y1, -1, -1]]) { ctx.moveTo(cx2 + sx2 * L, cy2); ctx.lineTo(cx2, cy2); ctx.lineTo(cx2, cy2 + sy2 * L); }
      ctx.stroke(); ctx.globalAlpha = 1;
    }
    const p = clamp01(t / fall), q1 = clamp01(p / 0.45), q2 = clamp01((p - 0.45) / 0.55), hover = dy - 46;
    if (land < 0 && !RM) { // the drone brings it down over the head, lets go, and climbs away; the module falls onto its part
      const dTop = y - 70, dY = dTop + (hover - dTop) * (1 - Math.pow(1 - q1, 2)) - 260 * q2 * q2, hang = hover + 40;
      const modY = (q2 > 0 ? hang + (my - hang) * q2 * q2 : dY + 40) - my;
      const D = sprCanvas(PIX.DRONE), DS = 4;
      if (q2 === 0) { ctx.strokeStyle = FT.dim; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(mx, dY + 14); ctx.lineTo(mx, my + modY - 14); ctx.stroke(); }
      ctx.drawImage(D, Math.round(mx - PIX.DRONE.ox * DS), Math.round(dY - PIX.DRONE.oy * DS), PIX.DRONE.w * DS, PIX.DRONE.h * DS);
      if (q2 > 0) for (let j = 3; j >= 1; j--) { ctx.globalAlpha = 0.16 * (4 - j) * q2; ctx.drawImage(art.mod, dx, dy + modY - j * 22 * q2, DW, DH); }
      ctx.globalAlpha = 1; ctx.shadowColor = FT.accent; ctx.shadowBlur = 24; ctx.drawImage(art.mod, dx, dy + modY, DW, DH); ctx.shadowBlur = 0;
    } else if (land < 0) { ctx.globalAlpha = p; ctx.drawImage(art.mod, dx, dy, DW, DH); ctx.globalAlpha = 1; } // reduced motion: it fades in
    else {
      const bob = !RM && land < 0.22 ? -10 * Math.sin(Math.PI * land / 0.22) : 0;
      ctx.shadowColor = FT.accent; ctx.shadowBlur = 14 + 10 * Math.sin(app.realT * 5); ctx.drawImage(art.mod, dx, dy + bob, DW, DH); ctx.shadowBlur = 0;
      if (land < 0.5 && Math.floor(land * 14) % 2 === 0) ctx.drawImage(art.white, dx, dy + bob, DW, DH); // the flash
      for (const [d0, col, wd] of [[0, C.dummy, 5], [0.1, FT.accent, 3]]) { const u = clamp01((land - d0) / 0.6); if (u <= 0 || u >= 1) continue; const e = 1 - Math.pow(1 - u, 3); ctx.globalAlpha = 1 - u; ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.arc(mx, my, 16 + 230 * e, 0, TAU); ctx.stroke(); }
      const u = clamp01(land / 0.55); if (u < 1) { const e = 1 - Math.pow(1 - u, 2); ctx.globalAlpha = 1 - u; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + 0.2, r0 = 22 + 250 * e, r1 = r0 + 26 * (1 - e) + 4; ctx.moveTo(mx + Math.cos(a) * r0, my + Math.sin(a) * r0); ctx.lineTo(mx + Math.cos(a) * r1, my + Math.sin(a) * r1); } ctx.stroke(); }
      ctx.globalAlpha = 1;
      if (land < 0.3 && !RM) { const fa = 0.32 * (1 - land / 0.3); ctx.fillStyle = 'rgba(255,255,255,' + fa + ')'; ctx.fillRect(x, y, w, h); } // the whole screen flashes once
    }
    ctx.restore();
    const tx = dx + DW + 44, tw = x + w - 30 - tx, pd = TOUCH.on || app.device === 'pad', rs = s.rescue;
    txt(land < 0 ? LT('n10', 'FARSIGHT DRONE · INCOMING') : 'NEW PART FITTED', tx, y + 62, fLab, land < 0 && Math.floor(t * 4) % 2 ? FT.dim : FT.accent);
    if (land >= 0) {
      const a1 = clamp01(land / 0.15), pop = RM ? 1 : 1 + 0.4 * Math.pow(clamp01(1 - land / 0.28), 2);
      ctx.save(); ctx.globalAlpha = a1; ctx.translate(tx, y + 140); ctx.scale(pop, pop); txt(nd.name.toUpperCase(), 0, 0, '900 64px ' + F_BRAND, C.dummy); ctx.restore();
      ctx.save(); ctx.globalAlpha = clamp01((land - 0.12) / 0.2);
      const br = 24, bx = tx + br, by = y + 196;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = FT.keyTop; ctx.fill(); ctx.strokeStyle = BADGE[tr.button]; ctx.lineWidth = 3; ctx.stroke();
      txt(tr.button, bx, by + 9, '700 26px ' + F_MONO, FT.text, 'center'); txt(tr.verb, bx + br + 16, by + 12, '900 34px ' + F_BRAND, FT.text);
      let yy = y + 262; yy += 30 * wrapText(nd.desc, tx, yy, tw, 30, '400 22px ' + F_UI, FT.text, 4) + 18;
      const ng = s.story ? STORY.nextGift(s.story) : null; // Edit 91: the next part on the schedule, and where it arrives
      ctx.globalAlpha = clamp01((land - 0.45) / 0.3);
      ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(tx, yy - 6); ctx.lineTo(tx + tw, yy - 6); ctx.stroke();
      if (ng) { txt(LT('n12', 'NEXT FROM FARSIGHT'), tx, yy + 26, fLab, FT.accent); wrapText(NODE(ng.node).name + ' · ' + INFO(ng.district).name + ' ' + ng.tile + ' (tile ' + ng.n + ' of ' + STORY.TOTAL + ').', tx, yy + 58, tw, 26, '400 19px ' + F_UI, FT.dim, 2); }
      else txt(s.story ? 'EVERY PART FITTED' : 'THE ONLY LEVEL OF ' + tr.name.toUpperCase(), tx, yy + 26, fLab, FT.accent);
      ctx.restore();
    }
    hitbox(x, y, w, h, 'gift', () => menuQ.push('ok')); // Edit 89: a tap continues, once the hold is over
    if (giftReady() && Math.floor(app.realT * 2.5) % 3) txt((TOUCH.on ? 'TAP · ' : pd ? 'A  ' : 'SPACE  ') + (rs && rs.ferry ? 'ON TO ' + rs.tile : 'CONTINUE'), x + w - 30, y + h - 26, fLab, FT.accent, 'right');
    ctx.restore();
  }
  function drawBriefFoot(s, X, y, W) { // under the district map: the brief and the tile's count
    const pr = s.story, t = STORY.activeTile(pr, s.levelId), tile = t ? STORY.districtOf(s.levelId).tiles[t] : null, need = t ? STORY.needOf(s.levelId, t, s.P) : 0;
    if (!tile) return;
    const tx = STORY.taskText(tile.task, s.P), here = s.screenName() === t;
    txt('BRIEF · ' + t, 30, y + 18, '700 15px ' + F_UI, here ? FT.accent : FT.dim);
    for (let i = 0; i < need; i++) { ctx.beginPath(); ctx.arc(X + W - 20 - (need - 1 - i) * 16, y + 13, 5, 0, TAU); ctx.fillStyle = i < pr.tileWO ? C.dummy : FT.track; ctx.fill(); ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1; ctx.stroke(); }
    wrapText(tx.label, 30, y + 44, W - 28, 20, '700 17px ' + F_UI, FT.text, 1);
  }
  function drawMapFences(s, G) { // hazard dashes on the district map where a fence stands
    const pr = s.story, id = s.levelId, dn = STORY.doneIn(pr, id), act = STORY.activeTile(pr, id);
    const open = (a, b) => (dn.includes(a) && dn.includes(b)) || (!s.entered && ((a === act && dn.includes(b)) || (b === act && dn.includes(a))));
    const seen = (t) => STORY.tileState(pr, id, t) !== 'hidden';
    ctx.save(); ctx.lineWidth = 3; ctx.setLineDash([4, 3]); ctx.strokeStyle = C.dummy;
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) for (const [dc, dr] of [[1, 0], [0, 1]]) {
      const c2 = c + dc, r2 = r + dr; if (c2 > 2 || r2 > 2) continue;
      const a = 'ABC'[c] + (r + 1), b = 'ABC'[c2] + (r2 + 1);
      if (!(seen(a) || seen(b)) || open(a, b)) continue;
      ctx.beginPath();
      if (dc) { const x = G.gx + c2 * (G.cw + G.g) - G.g / 2, y = G.gy + r * (G.ch + G.g); ctx.moveTo(x, y); ctx.lineTo(x, y + G.ch); }
      else { const x = G.gx + c * (G.cw + G.g), y = G.gy + r2 * (G.ch + G.g) - G.g / 2; ctx.moveTo(x, y); ctx.lineTo(x + G.cw, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  const c32 = (hex) => { const n = parseInt(hex.slice(1), 16); return (0xFF000000 | ((n & 255) << 16) | (n & 0xFF00) | ((n >> 16) & 255)) >>> 0; };
  const FENCE = { rail: c32('#F5C542'), band: c32('#1A1F24'), post: c32('#3A4550'), mesh: c32('#E8F0F4') };
  function drawStoryFence(s) { // Edit 83: a bounded edge, as in Zelda: no barrier across the road, a yellow glow at the screen's edge. Art pixels
    if (!s.storyMode || !s.fenceSides) return;
    const sides = s.fenceSides(); if (!sides.length) return;
    const at = (sd, i, d) => (sd === 'N' ? [i, d] : sd === 'S' ? [i, AH - 1 - d] : sd === 'W' ? [d, i] : [AW - 1 - d, i]);
    const pulse = RM ? 1 : 0.8 + 0.2 * Math.sin(app.realT * 4), A = [0.9, 0.6, 0.36, 0.18, 0.08, 0.03];
    for (const sd of sides) {
      const len = sd === 'N' || sd === 'S' ? AW : AH;
      for (let i = 0; i < len; i++) for (let d = 0; d < A.length; d++) { const [x, y] = at(sd, i, d); FB.mix(x, y, FENCE.rail, A[d] * pulse); }
    }
  }
  function drawReport(s) {
    veil();
    const rp = s.report, x = FX + 40, y = FY + 36, w = FW - 80, h = FH - 72;
    panel(x, y, w, h); hitbox(x, y, w, h, 'report', () => menuQ.push('ok')); // Edit 89: a tap continues
    const sr = rp.story; // Edit 81: the story's count and the brief. Edit 82: a credit a body
    txt(sr ? (sr.districtDone ? INFO(s.levelId).name.toUpperCase() + ' CLEARED · NEXT ' + INFO(rp.nextRoad).name.toUpperCase() : sr.cleared ? 'TILE ' + sr.tile + ' CLEARED' : 'WRITE-OFF REPORT · ' + sr.tile)
      : rp.gradeUp ? LT('n35', 'GRADE {G} · TOUGHER CHASSIS · DENSER TRAFFIC', { G: rp.grade }) : rp.roadCleared ? roadLabel(s.level.id) + ' CLEARED' : copy('report.eyebrow', 'WRITE-OFF REPORT').toUpperCase(), x + 30, y + 44, fLab, FT.accent);
    const chs = String(rp.chassis).padStart(2, '0');
    txt(copy('report.title', 'Chassis {chassis} written off.', { chassis: chs }), x + 30, y + 92, '900 36px ' + F_BRAND, FT.text);
    if (sr) {
      const task = STORY.tileOf(s.levelId, sr.tile), lab = task ? STORY.taskText(task.task, s.P).label : '';
      txt((sr.counted ? 'Counted for ' + sr.tile + ': ' + sr.n + ' of ' + sr.need : sr.why === 'task' ? 'Not counted: the brief wants ' + lab.toLowerCase() : sr.why === 'cleared' ? 'Not counted: ' + sr.tile + ' is already cleared' : 'Not counted: ' + sr.tile + ' is not in test') + ' · points this body ' + num(rp.points), x + 30, y + 132, fTxt, sr.counted ? FT.text : C.warning);
    } else if (s.grade) txt('Grade ' + rp.grade + ' · write-off ' + s.run.writeOffs + ' · points this body ' + num(rp.points), x + 30, y + 132, fTxt, FT.dim); // Edit 97 (P8.2)
    else txt('Write-off ' + s.run.writeOffs + ' of ' + s.quota + ' · points this body ' + num(rp.points), x + 30, y + 132, fTxt, FT.dim);
    const cols = [['CAR', 0], ['ANGLE', 130], ['POINTS', 290], ['HEALTH LOST', 470]];
    cols.forEach(([c, dx]) => txt(c, x + 30 + dx, y + 190, fLab, FT.dim));
    rp.hits.slice(-3).forEach((hh, j) => {
      const yy = y + 236 + j * 44;
      [shortId(hh.model), hh.angle != null ? Math.round(hh.angle) + '°' : '—', num(hh.assessed), num(hh.lost)].forEach((v, i) => txt(String(v), x + 30 + cols[i][1], yy, fNum, FT.text));
    });
    rr(x + 28, y + h - 116, w - 56, 52, 12); ctx.fillStyle = FT.credit; ctx.fill(); ctx.strokeStyle = C.dummy; ctx.lineWidth = 1.5; ctx.stroke();
    if (sr && sr.parts != null) { // Edit 91: the parts fitted, and the next one's tile. No shop in Story
      const ng = sr.nextGift, line = sr.parts + ' / ' + STORY.VERBS.length + ' PARTS FITTED' + (ng ? ' · NEXT: ' + NODE(ng.node).name.toUpperCase() + ' AT ' + INFO(ng.district).name.toUpperCase() + ' ' + ng.tile : ' · EVERY PART FITTED');
      fitText(line, x + 46, y + h - 82, w - 92, TY.sec, 13, FT.text);
    } else if (sr) { const c = sr.cheapest;
      txt('+' + plural(sr.gained, 'credit').toLowerCase() + ' for the body. Balance: ' + s.run.credits + '.' + (c ? (s.run.credits >= c.price ? ' ' + NODE(c.node).name + ' is yours for ' + c.price + '.' : ' ' + NODE(c.node).name + ' at ' + c.price + '.') : ' Every track is full.'), x + 46, y + h - 82, fLab, FT.text); }
    else txt(copy('report.credit', 'One body credit granted. Balance: {credits}.', { credits: s.run.credits }), x + 46, y + h - 82, fLab, FT.text);
    txt(TOUCH.on ? 'TAP TO CONTINUE' : app.device === 'pad' ? 'A  CONTINUE' : 'SPACE  CONTINUE', x + w - 30, y + h - 26, fLab, FT.accent, 'right');
  }
  function drawShop(s) {
    if (STORY && ABIL4) return drawWorkshop(s); // Edit 89
    if (ABIL) return drawAbilityShop(s);
    veil();
    const x = FX + 22, y = FY + 18, w = FW - 44, h = FH - 36;
    panel(x, y, w, h);
    txt(copy('shop.eyebrow', 'MODIFICATION SERVICES').toUpperCase(), x + 28, y + 46, fLab, FT.accent);
    const CUR = 'CREDIT', ct = s.run.credits + ' ' + CUR + (s.run.credits === 1 ? '' : 'S'); // Edit 82: credits in both modes
    ctx.font = fLab; const cw = ctx.measureText(ct).width + 36;
    rr(x + w - 28 - cw, y + 16, cw, 44, 12); ctx.fillStyle = C.dummy; ctx.fill(); ctx.strokeStyle = C.joints; ctx.lineWidth = 1.5; ctx.stroke();
    txt(ct, x + w - 28 - cw / 2, y + 46, fLab, C.primary, 'center'); // dark on safety yellow in both palettes
    const nc = SHOP_GRID.length, gap = nc > 3 ? 18 : 28, colW = (w - 56 - gap * (nc - 1)) / nc; // Torso, Arms, Battery (D26); P6.5: Torso, Legs, Arms, Battery
    SHOP_GRID.forEach((col, ci) => {
      const cx = x + 28 + ci * (colW + gap);
      col.forEach((n, ri) => {
        const yy = y + 78 + ri * 150, node = NODES[n], own = s.has(n), chk = s.canBuy(n), on = app.shopCol === ci && app.shopRow === ri;
        rr(cx, yy, colW, 140, 12);
        ctx.fillStyle = own ? 'rgba(79,195,232,0.28)' : on ? FT.keyTop : FT.item; ctx.fill();
        ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
        txt(node.name, cx + 18, yy + 34, '900 ' + (nc > 3 ? 23 : 26) + 'px ' + F_BRAND, FT.text);
        const price = s.P[node.price];
        txt(own ? 'OWNED' : chk.ok ? price + ' CREDIT' + (price === 1 ? '' : 'S') : chk.why.toUpperCase(), cx + 18, yy + 60, fLab, own ? FT.accent : chk.ok ? FT.text : FT.off);
        wrapText(dashify(nodeDesc(n).split('. ')[0].replace(/\.?$/, '.')), cx + 18, yy + 86, colW - 36, 24, fTxt, FT.dim, 3);
        if (ri === 0 && col.length > 1) { ctx.strokeStyle = '#9FB0BA'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx + 34, yy + 140); ctx.lineTo(cx + 34, yy + 150); ctx.stroke(); }
      });
    });
    if (app.shopRow < SHOP_ROWS && SHOP_GRID[app.shopCol][app.shopRow]) {
      const n = SHOP_GRID[app.shopCol][app.shopRow], chk = s.canBuy(n);
      let msg = '';
      if (s.has(n)) msg = NODES[n].name + ' is installed.';
      else if (!chk.ok) msg = NODES[n].name + ': ' + chk.why + '.';
      else { const left = s.run.credits - chk.price; msg = 'Buying ' + NODES[n].name + ' leaves ' + left + ' credit' + (left === 1 ? '' : 's') + '.'; }
      wrapText(msg, x + 28, y + 400, w - 56, 28, fLab, FT.text, 2);
    }
    const on = app.shopRow === SHOP_ROWS;
    rr(x + 28, y + h - 118, w - 56, 52, 12); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill();
    ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
    txt(s.run.credits ? copy('shop.bank', 'Keep {credits} in credit. Deploy next chassis', { credits: s.run.credits }) : copy('shop.deploy', 'Deploy next chassis'), x + w / 2, y + h - 84, fLab, on ? FT.selText : FT.text, 'center');
    txt(FOUR ? (TOUCH.on ? 'STICK SELECT · A BUY · B DEPLOY' : app.device === 'pad' ? 'STICK SELECT · A BUY · B DEPLOY' : 'ARROWS SELECT · SPACE BUY · SHIFT DEPLOY') : 'ARROWS SELECT · SPACE BUY · K DEPLOY', x + w / 2, y + h - 24, fLab, FT.dim, 'center');
  }
  // Edit 77 (P6.7): the ability shop. Four tracks, one per button (A Battery, B Legs, X Arms, Y Throw); levels 1–3 down each.
  // A card: its level, its price or state, and what it does in a few words. The selected card's full text sits below.
  const BADGE = { A: C.dummy, B: FT.accent, X: FT.accent, Y: FT.accent };
  // Edit 78: what a track does at level L (0–4): its step, and the share of wear its level stops
  function abilityStats(s, t, L) {
    const P = s.P, cut = Math.round(P['abilities.wearCut'] * L * 100), wear = L ? 'WEAR −' + cut + '%' : 'FULL WEAR';
    if (ABIL4) { // Edit 80
      if (t === 'battery' && BM1) { const n = L >= 2 ? P['battery.capacity'] : P['abilities.battery.dashCharges'], sec = (L >= 3 ? P['abilities.battery.level3Seconds'] : P['battery.secondsPerCharge']).toFixed(1); return [L ? 'DASH · ' + n + ' CHARGE' + (n === 1 ? '' : 'S') + ' · ' + sec + ' s' : 'NO DASH', L ? wear : '']; } // Edit 91
      if (t === 'battery') return ['CHARGE ' + (L ? P['abilities.battery.level' + L + 'Seconds'] : P['battery.secondsPerCharge']).toFixed(1) + ' s', wear];
      if (t === 'hands') return [L ? P['abilities.hands.conesPerLevel'] * L + ' CONE' + (P['abilities.hands.conesPerLevel'] * L === 1 ? '' : 'S') : 'NO GRAB', L ? wear : ''];
      if (t === 'arms') return [L ? 'PUSH +' + (P['abilities.arms.pushSpeed'] + P['abilities.arms.pushStep'] * (L - 1)) + ' ×' + P['abilities.arms.pushesPerLevel'] * L : 'BOUNCE ONLY', L ? wear : ''];
    }
    if (ABIL3) { // Edit 79
      if (t === 'battery') return ['CHARGE ' + (L ? P['abilities.battery.level' + L + 'Seconds'] : P['battery.secondsPerCharge']).toFixed(1) + ' s', wear];
      if (t === 'arms') return [['NO GRAB', 'CARRY A CONE', 'HOLD X: THROW', 'HITCH A CAR'][L], L ? wear : ''];
    }
    if (t === 'battery') return ['CHARGE ' + Math.max(0.05, P['battery.secondsPerCharge'] - P['abilities.battery.rechargeCut'] * L).toFixed(2) + ' s', wear];
    if (!L) return [{ legs: 'NO JUMP', arms: 'NO GRAB', throw: 'NO THROW' }[t], ''];
    if (t === 'legs') return ['AIR ' + (P['abilities.legs.airtimeBase'] + P['abilities.legs.airtimeStep'] * (L - 1)).toFixed(1) + ' s', wear];
    if (t === 'arms') return [P['abilities.arms.conesPerLevel'] * L + ' CONE' + (P['abilities.arms.conesPerLevel'] * L === 1 ? '' : 'S'), wear];
    return ['RANGE ' + Math.round(P['upgrades.throwDistance'] + P['abilities.throw.distanceStep'] * (L - 1)), wear];
  }
  function drawAbilityShop(s) {
    veil();
    const x = FX + 22, y = FY + 18, w = FW - 44, h = FH - 36, P = s.P; let max = P['abilities.maxLevel'];
    panel(x, y, w, h);
    txt(copy('shop.eyebrow', 'MODIFICATION SERVICES').toUpperCase(), x + 28, y + 46, fLab, FT.accent);
    const CUR = 'CREDIT', ct = s.run.credits + ' ' + CUR + (s.run.credits === 1 ? '' : 'S'); // Edit 82: credits in both modes
    ctx.font = fLab; const cw = ctx.measureText(ct).width + 36;
    rr(x + w - 28 - cw, y + 16, cw, 44, 12); ctx.fillStyle = C.dummy; ctx.fill(); ctx.strokeStyle = C.joints; ctx.lineWidth = 1.5; ctx.stroke();
    txt(ct, x + w - 28 - cw / 2, y + 46, fLab, C.primary, 'center');
    const nc = SHOP_GRID.length, gap = 16, colW = (w - 56 - gap * (nc - 1)) / nc, top = y + 76, cardH = 262;
    SHOP_GRID.forEach((col, ci) => {
      const t = col[0], tr = TRACKS[t], lv = s.tier(t), _m = (max = ABIL4 ? s.trackMax(t) : P['abilities.maxLevel']), n = nextLevel(s, t), chk = n ? s.canBuy(n) : { ok: false, why: 'max' }, on = app.shopCol === ci && app.shopRow === 0, cx = x + 28 + ci * (colW + gap);
      rr(cx, top, colW, cardH, 12);
      ctx.fillStyle = on ? FT.keyTop : lv ? 'rgba(79,195,232,0.16)' : FT.item; ctx.fill();
      ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      txt(tr.name.toUpperCase(), cx + 14, top + 34, '900 20px ' + F_BRAND, FT.text);
      const br = 13, bx = cx + colW - br - 10, by = top + 27; // the button this track serves, as on the pad
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = FT.keyTop; ctx.fill(); ctx.strokeStyle = BADGE[tr.button]; ctx.lineWidth = 2; ctx.stroke();
      txt(tr.button, bx, by + 6, '700 16px ' + F_MONO, FT.text, 'center');
      const pw = (colW - 28 - 6 * (max - 1)) / max; // level pips: owned filled; the next one blinks while selected
      for (let L = 1; L <= max; L++) {
        const px = cx + 14 + (L - 1) * (pw + 6), own = L <= lv, nxt = L === lv + 1 && on && Math.floor(app.realT * 3) % 2 === 0;
        rr(px, top + 50, pw, 14, 4); ctx.fillStyle = own ? FT.accent : nxt ? 'rgba(79,195,232,0.45)' : 'rgba(159,176,186,0.18)'; ctx.fill();
      }
      txt(lv ? 'LEVEL ' + lv : 'LOCKED', cx + 14, top + 96, fLab, lv ? FT.text : FT.dim);
      const st = abilityStats(s, t, lv);
      txt(st[0], cx + 14, top + 126, '400 18px ' + F_UI, FT.text); if (st[1]) txt(st[1], cx + 14, top + 152, '400 18px ' + F_UI, FT.dim);
      ctx.strokeStyle = FT.itemEdge; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cx + 14, top + 172); ctx.lineTo(cx + colW - 14, top + 172); ctx.stroke();
      if (n) {
        const nst = abilityStats(s, t, lv + 1), price = P[NODES7[n].price];
        txt('NEXT · ' + (chk.ok ? price + ' ' + CUR + (price === 1 ? '' : 'S') : chk.why.toUpperCase()), cx + 14, top + 200, '700 16px ' + F_UI, chk.ok ? FT.accent : FT.off);
        txt(nst[0], cx + 14, top + 226, '400 17px ' + F_UI, FT.dim); if (nst[1]) txt(nst[1], cx + 14, top + 250, '400 17px ' + F_UI, FT.dim);
      } else txt('MAXED', cx + 14, top + 200, '700 16px ' + F_UI, FT.accent);
    });
    if (app.shopRow === 0) {
      const t = SHOP_GRID[app.shopCol][0], n = nextLevel(s, t);
      let msg;
      if (!n) msg = TRACKS[t].name + ' is at level ' + s.tier(t) + ', the top.';
      else {
        const nd = NODES7[n], chk = s.canBuy(n), st = abilityStats(s, t, nd.level);
        msg = nd.name + ': ' + nd.desc + ' ' + st.filter(Boolean).map((q) => q[0] + q.slice(1).toLowerCase()).join('. ') + '.';
        if (!chk.ok) msg += ' ' + chk.why[0].toUpperCase() + chk.why.slice(1) + '.';
        else { const left = s.run.credits - chk.price; msg += ' Leaves ' + left + ' ' + CUR.toLowerCase() + (left === 1 ? '' : 's') + '.'; }
      }
      wrapText(msg, x + 28, top + cardH + 34, w - 56, 26, fLab, FT.text, 2);
    }
    const on = app.shopRow === SHOP_ROWS;
    rr(x + 28, y + h - 118, w - 56, 52, 12); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill();
    ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
    txt(s.run.credits ? copy('shop.bank', 'Keep {credits} in credit. Deploy next chassis', { credits: s.run.credits }) : copy('shop.deploy', 'Deploy next chassis'), x + w / 2, y + h - 84, fLab, on ? FT.selText : FT.text, 'center');
    txt(TOUCH.on || app.device === 'pad' ? 'STICK SELECT · A BUY NEXT LEVEL · B DEPLOY' : 'ARROWS SELECT · SPACE BUY NEXT LEVEL · SHIFT DEPLOY', x + w / 2, y + h - 24, fLab, FT.dim, 'center');
  }
  const PART_WORD = { battery: 'Torso', legs: 'Leg', arms: 'Grip', throw: 'Throw' };
  // Edit 89 (P7.8): the workshop. The next chassis, large, in the middle; its four parts around it, each a card wired to its seat on
  // the chassis: the part, its button, its level pips, what it does now, what the next level adds and costs (Story: an upgrade;
  // Arcade: credits). A part whose verb is not yet issued stays dark: no name, no levels, "a drone brings it". A fits; B deploys
  const WS_POS = { arms: [0, 0], hands: [0, 1], battery: [1, 0], legs: [1, 1] }; // column, row around the chassis
  const seatArt = {};
  function seatOf(t) { // a track's first module on the chassis: its centre, in art pixels
    if (seatArt[t]) return seatArt[t];
    const m = DOLL_MODS[t] && DOLL_MODS[t][0], A = PIX.doll({}, '', []), B = PIX.doll({}, '', m ? [m] : []);
    let n = 0, sx = 0, sy = 0; for (let i = 0; i < A.d.length; i++) if (A.d[i] !== B.d[i] && B.d[i]) { n++; sx += i % A.w; sy += Math.floor(i / A.w); }
    return (seatArt[t] = n ? { x: sx / n + 0.5, y: sy / n + 0.5 } : { x: A.w / 2, y: A.h / 2 });
  }
  const wsLocked = () => false; // Edit 91: Arcade sells every part; Story has no workshop (its parts come by drone)
  const wsCost = (s, n) => (s.storyMode ? '1 UPGRADE' : plural(s.P[NODES7[n].price], 'CREDIT'));
  function wsMove(m) { // the four cards around the chassis, DONE beneath
    const t = SHOP_GRID[app.shopCol][0], [c, r] = WS_POS[t] || [0, 0], at = (c2, r2) => SHOP_GRID.findIndex((g) => WS_POS[g[0]] && WS_POS[g[0]][0] === c2 && WS_POS[g[0]][1] === r2);
    if (app.shopRow === SHOP_ROWS) { if (m === 'up') app.shopRow = 0; return; }
    if (m === 'left' || m === 'right') { const k = at(1 - c, r); if (k >= 0) app.shopCol = k; }
    else if (m === 'up') { const k = at(c, r - 1); if (k >= 0) app.shopCol = k; }
    else if (m === 'down') { const k = at(c, r + 1); if (k >= 0) app.shopCol = k; else app.shopRow = SHOP_ROWS; }
  }
  function drawWorkshop(s) {
    veil(); veil();
    const x = FX + 22, y = FY + 18, w = FW - 44, h = FH - 36, story = false, r0 = s.run; // Edit 91: Arcade only
    panel(x, y, w, h);
    const nextCh = String((s.report ? s.report.chassis : r0.chassis) + 1).padStart(2, '0');
    txt('WORKSHOP · CHASSIS ' + nextCh, x + 28, y + 44, fLab, FT.accent);
    const left = r0.credits, lvN = null, pill = plural(left, 'CREDIT');
    ctx.font = fLab; const pw = ctx.measureText(pill).width + 32;
    rr(x + w - 28 - pw, y + 16, pw, 40, 12); ctx.fillStyle = left > 0 ? C.dummy : FT.item; ctx.fill(); ctx.strokeStyle = left > 0 ? C.joints : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
    txt(pill, x + w - 28 - pw / 2, y + 44, fLab, left > 0 ? C.primary : FT.dim, 'center');
    // the chassis
    const SC = 3, DW = PIX.DOLL_W * SC, DH = PIX.DOLL_H * SC, dx = Math.round(x + w / 2 - DW / 2), dy = y + 66, fit = fx.fit && app.realT - fx.fit.t0 < 0.9 ? fx.fit : null;
    { const gl = ctx.createRadialGradient(x + w / 2, dy + DH * 0.45, 20, x + w / 2, dy + DH * 0.45, 230); gl.addColorStop(0, 'rgba(63,208,255,0.20)'); gl.addColorStop(1, 'rgba(63,208,255,0)'); ctx.fillStyle = gl; ctx.fillRect(x, y + 60, w, DH + 20); }
    ctx.imageSmoothingEnabled = false; ctx.drawImage(dollCanvas({}, '', dollMods(s)), dx, dy, DW, DH);
    const seatAt = (t) => { const q2 = seatOf(t); return { x: dx + q2.x * SC, y: dy + q2.y * SC }; };
    const selT = app.shopRow < SHOP_ROWS ? SHOP_GRID[app.shopCol][0] : null, cw = 236, chh = 152;
    for (const [t] of SHOP_GRID) {
      const pos = WS_POS[t]; if (!pos) continue;
      const [c, r] = pos, cx = c === 0 ? x + 22 : x + w - 22 - cw, cy = y + 70 + r * (chh + 18), tr = TRACKS[t], locked = wsLocked(s, t), lv = s.tier(t), max = s.trackMax(t), n = nextLevel(s, t), chk = n ? s.canBuy(n) : null, on = selT === t, sp = seatAt(t);
      const k = SHOP_GRID.findIndex((g) => g[0] === t);
      hitbox(cx, cy, cw, chh, 'part:' + t, () => { if (app.shopCol === k && app.shopRow < SHOP_ROWS) menuQ.push('ok'); else { app.shopCol = k; app.shopRow = 0; } });
      hitbox(sp.x - 26, sp.y - 26, 52, 52, 'seat:' + t, () => { if (app.shopCol === k && app.shopRow < SHOP_ROWS) menuQ.push('ok'); else { app.shopCol = k; app.shopRow = 0; } });
      // the wire to its seat
      const ex = c === 0 ? cx + cw : cx, ey = cy + chh / 2;
      ctx.strokeStyle = on ? C.dummy : locked ? 'rgba(127,168,188,0.25)' : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.setLineDash(locked ? [4, 4] : []);
      ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo((ex + sp.x) / 2, ey); ctx.lineTo(sp.x, sp.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.arc(sp.x, sp.y, on ? 7 : 5, 0, TAU); ctx.fillStyle = on ? C.dummy : locked ? FT.off : FT.accent; ctx.fill();
      if (on) { ctx.strokeStyle = C.dummy; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(app.realT * 6); ctx.beginPath(); ctx.arc(sp.x, sp.y, 18 + 3 * Math.sin(app.realT * 6), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1; }
      // the card
      rr(cx, cy, cw, chh, 12); ctx.fillStyle = on ? FT.keyTop : locked ? 'rgba(40,46,56,0.55)' : FT.item; ctx.fill(); ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      const br = 14, bx = cx + cw - br - 12, by = cy + 26;
      ctx.beginPath(); ctx.arc(bx, by, br, 0, TAU); ctx.fillStyle = FT.keyTop; ctx.fill(); ctx.strokeStyle = locked ? FT.off : BADGE[tr.button]; ctx.lineWidth = 2; ctx.stroke();
      txt(tr.button, bx, by + 6, '700 16px ' + F_MONO, locked ? FT.off : FT.text, 'center');
      if (locked) { txt('???', cx + 16, cy + 40, '900 26px ' + F_BRAND, FT.off); wrapText(LT('n13', 'A Farsight drone brings this part.'), cx + 16, cy + 82, cw - 32, 22, '400 17px ' + F_UI, FT.dim, 3); continue; }
      txt(tr.name.toUpperCase(), cx + 16, cy + 34, '900 22px ' + F_BRAND, FT.text);
      const pw2 = (cw - 32 - 6 * (max - 1)) / max;
      for (let L = 1; L <= max; L++) { const px = cx + 16 + (L - 1) * (pw2 + 6), own = L <= lv, nxt = L === lv + 1 && on && Math.floor(app.realT * 3) % 2 === 0; rr(px, cy + 48, pw2, 12, 4); ctx.fillStyle = own ? (fit && NODES7[fit.node] && NODES7[fit.node].track === t && L === lv && Math.floor(app.realT * 12) % 2 === 0 ? '#FFFFFF' : FT.accent) : nxt ? 'rgba(245,197,66,0.6)' : 'rgba(159,176,186,0.18)'; ctx.fill(); }
      const st = abilityStats(s, t, lv); txt(lv ? st[0] : st[0], cx + 16, cy + 86, '700 17px ' + F_UI, lv ? FT.text : FT.dim);
      if (n) { const nst = abilityStats(s, t, lv + 1); txt('NEXT · ' + nst[0], cx + 16, cy + 112, '400 16px ' + F_UI, FT.dim); txt(chk && chk.ok ? wsCost(s, n) : (chk ? chk.why : '').toUpperCase(), cx + 16, cy + 138, '700 16px ' + F_UI, chk && chk.ok ? C.dummy : FT.off); }
      else txt('FULL', cx + 16, cy + 112, '700 16px ' + F_UI, FT.accent);
    }
    if (fit) { // the module lands: a white flash, rings, sparks
      const nd = NODES7[fit.node], sp = nd ? seatAt(nd.track) : null, u = (app.realT - fit.t0) / 0.9;
      if (sp) { ctx.save(); for (const [d0, col, wd] of [[0, C.dummy, 5], [0.12, FT.accent, 3]]) { const v = Math.max(0, Math.min(1, (u - d0) / 0.8)); if (v <= 0 || v >= 1) continue; ctx.globalAlpha = 1 - v; ctx.strokeStyle = col; ctx.lineWidth = wd; ctx.beginPath(); ctx.arc(sp.x, sp.y, 10 + 120 * (1 - Math.pow(1 - v, 3)), 0, TAU); ctx.stroke(); }
        if (!RM) { ctx.globalAlpha = Math.max(0, 1 - u); ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 2.5; ctx.beginPath(); for (let i = 0; i < 12; i++) { const an = i * TAU / 12 + 0.3, r1 = 16 + 90 * u, r2 = r1 + 14 * (1 - u) + 4; ctx.moveTo(sp.x + Math.cos(an) * r1, sp.y + Math.sin(an) * r1); ctx.lineTo(sp.x + Math.cos(an) * r2, sp.y + Math.sin(an) * r2); } ctx.stroke(); }
        ctx.globalAlpha = Math.max(0, 0.8 * (1 - u * 2)); const gw = ctx.createRadialGradient(sp.x, sp.y, 2, sp.x, sp.y, 40); gw.addColorStop(0, '#FFFFFF'); gw.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gw; ctx.fillRect(sp.x - 40, sp.y - 40, 80, 80); ctx.restore(); }
    }
    // what the selection means
    let msg = '';
    if (!selT) msg = story ? (left > 0 ? 'Keep ' + left + ' upgrade' + (left === 1 ? '' : 's') + ' for later, or fit ' + (left === 1 ? 'it' : 'them') + ' now.' : 'Chassis ' + nextCh + ' is ready.') : (left > 0 ? 'Keep ' + left + ' credit' + (left === 1 ? '' : 's') + '.' : 'Chassis ' + nextCh + ' is ready.');
    else if (wsLocked(s, selT)) msg = LT('n14', 'A Farsight drone brings this part. Keep testing.');
    else { const n = nextLevel(s, selT); if (!n) msg = TRACKS[selT].name + ' is at its top level.'; else { const nd = NODES7[n], chk = s.canBuy(n); msg = nd.name + ': ' + nd.desc; if (story && !chk.ok && chk.why === 'level up first' && lvN.next) msg += ' Level ' + (lvN.level + 1) + ' at ' + num(lvN.next) + ' points.'; } }
    wrapText(msg, x + 28, y + 424, w - 56, 24, '400 18px ' + F_UI, FT.text, 2);
    // FIT and DONE
    const by2 = y + h - 80, bh = 50, bw = (w - 56 - 16) / 2, n0 = selT ? nextLevel(s, selT) : null, c0 = n0 && !wsLocked(s, selT) ? s.canBuy(n0) : null, can = !!(c0 && c0.ok), onD = app.shopRow === SHOP_ROWS;
    rr(x + 28, by2, bw, bh, 12); ctx.fillStyle = can && !onD ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = can ? C.dummy : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
    fitText(can ? 'FIT ' + NODES7[n0].name.toUpperCase() + ' · ' + wsCost(s, n0) : !selT ? 'CHOOSE A PART' : wsLocked(s, selT) ? 'NOT YET ISSUED' : !n0 ? 'FULL' : (c0 ? c0.why : '').toUpperCase(), x + 46, by2 + 32, bw - 36, TY.sec, 13, can && !onD ? FT.selText : can ? FT.text : FT.off);
    hitbox(x + 28, by2, bw, bh, 'fit', () => { if (app.shopRow === SHOP_ROWS) app.shopRow = 0; menuQ.push('ok'); });
    rr(x + 28 + bw + 16, by2, bw, bh, 12); ctx.fillStyle = onD ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = onD ? FT.accent : FT.itemEdge; ctx.lineWidth = 1.5; ctx.stroke();
    fitText('DONE · DEPLOY CHASSIS ' + nextCh, x + 46 + bw + 16, by2 + 32, bw - 36, TY.sec, 13, onD ? FT.selText : FT.text);
    hitbox(x + 28 + bw + 16, by2, bw, bh, 'done', () => { app.shopRow = SHOP_ROWS; menuQ.push('ok'); });
    txt(TOUCH.on ? 'TAP A PART · TAP FIT · TAP DONE' : app.device === 'pad' ? 'STICK A PART · A FIT · B DONE' : 'ARROWS A PART · SPACE FIT · SHIFT DONE', x + w / 2, y + h - 12, '700 15px ' + F_UI, FT.dim, 'center');
    if (app.hud) app.hud.workshop = { sel: selT, left, pill };
  }
  // Cue key: the field's own pixel marks, shown at field scale, with what each means.
  const CUE_KEY = [
    ['intention', 'Has noticed you'], ['committed', 'Route fixed'], ['expiring', 'Commitment ending'], ['interrupted', 'Braking for safety'],
    ['caution', 'Slowing past you'], ['braking', 'Slowing'], ['stoppoint', 'Where it can stop'], ['spent', 'No more points'],
    ['honk', 'Blocked, warning you'], ['blind', 'Cannot sense you'], ['view', 'What you can see'],
  ];
  const CUE_KEY8 = [ // Edit 99 (P8.4, ui.cueKey.simple): seven rows. Noticed and slowing read from the car's own lights
    ['notice', 'Has noticed you'], ['committed', 'Route fixed'], ['braking8', 'Slowing'], ['interrupted8', 'Braking for safety'],
    ['spent8', 'Already hit you'], ['honk', 'Blocked, warning you'], ['view', 'What you can see'],
  ];
  const cueArt = new Map();
  function cueCanvas(cue) {
    if (cueArt.has(cue)) return cueArt.get(cue);
    const w = 40, h = 20, B = new PIX.Buf(w, h);
    B.fill(K.road);
    const car = (brk) => { const S = PIX.car('sedan', 28, 14, EXT(22), 0, brk); PIX.blit(B, S, 16, 12); return { cx: 16, cy: 12 - EXT(22) }; };
    const loc = (cx, cy) => (u, v) => [cx + u / U, cy + v / U];
    if (['intention', 'committed', 'expiring', 'interrupted', 'caution'].includes(cue)) { const r = car(false); pip(B, cue, r.cx, r.cy, loc(r.cx, r.cy), cue === 'expiring' ? 0.6 : 1, 0); }
    else if (cue === 'braking') car(true);
    else if (cue === 'interrupted8' || cue === 'braking8') { // Edit 99: brake lights and their glow on the road behind
      const S = PIX.car('sedan', 28, 14, EXT(22), 0, true); PIX.blit(B, S, 24, 12);
      for (let x = 0; x < 10; x++) for (let y = 6; y < 19; y++) B.mix(x, y, K.brakeGlow, x > 5 ? 0.55 : x > 2 ? 0.35 : 0.18);
      if (cue === 'interrupted8') { const cy = 12 - EXT(22); pip(B, 'interrupted', 24, cy, loc(24, cy), 1, 0); }
    }
    else if (cue === 'spent8') { const S = greyCar(PIX.car('sedan', 28, 14, EXT(22), 0, false)); PIX.blit(B, S, 16, 12); }
    else if (cue === 'notice' || cue === 'notice0') {
      car(false); if (cue === 'notice') { for (const yy of [8, 14]) B.rect(29, yy, 30, yy + 1, K.white); for (let x = 31; x < 40; x++) for (let y = 6; y <= 16; y++) if (Math.abs(y - 11) <= 3 + (x - 31) * 0.5) B.mix(x, y, K.beam, 0.55); }
    }
    else if (cue === 'stoppoint') { car(false); PIX.polyline([[33, 4], [36, 4], [36, 18], [33, 18]], (x, y) => B.put(x, y, K.label)); }
    else if (cue === 'spent') { const r = car(false); PIX.line(r.cx - 4, r.cy + 3, r.cx + 4, r.cy - 3, (x, y) => { B.put(x, y, K.roofInk); B.put(x, y + 1, K.roofInk); }); }
    else if (cue === 'honk') { B.rect(15, 1, 24, 18, K.tagBorder); B.rect(16, 2, 23, 17, K.tagFill); PIX.text(B, '!', 19, 4, K.tagInk); }
    else if (cue === 'blind') {
      PIX.fillPoly([[2, 3], [38, 3], [38, 17], [2, 17]], (x, y) => { if ((x + y) % 4 === 0 && !(x > 16 && y > 6 && y < 14)) B.put(x, y, K.label); }, w, h);
      PIX.polyline([[16, 7], [38, 7]], (x, y, i) => { if (i % 3 === 0) B.put(x, y, K.ink); }); PIX.polyline([[16, 13], [38, 13]], (x, y, i) => { if (i % 3 === 0) B.put(x, y, K.ink); });
    } else if (cue === 'view') { for (const [x1, y1] of [[38, 1], [38, 19]]) PIX.line(4, 10, x1, y1, (x, y, i) => { if (i % 4 === 0) B.mix(x, y, K.ink, 0.6); }); B.rect(3, 9, 4, 10, K.nose); }
    const cvs = document.createElement('canvas'); cvs.width = w; cvs.height = h;
    const c2 = cvs.getContext('2d'), id = c2.createImageData(w, h); new Uint32Array(id.data.buffer).set(B.d); c2.putImageData(id, 0, 0);
    cueArt.set(cue, cvs);
    return cvs;
  }
  function drawCueKey(x, y, w, h) {
    panel(x, y, w, h);
    txt(copy('cueKeyTitle', 'CUE KEY').toUpperCase(), x + 22, y + 40, fLab, FT.accent);
    const simple = !!(app.sim && app.sim.P['ui.cueKey.simple']), hz = app.sim ? app.sim.P['proto.art.noticeFlashHz'] : 0;
    const keys = simple ? CUE_KEY8 : CUE_KEY.filter(([c]) => c !== 'stoppoint' || (app.sim && app.sim.P['proto.stopCue']));
    keys.forEach(([cue, meaning], i) => {
      const yy = y + 58 + i * 44, art = cue === 'notice' && hz > 0 && Math.floor(app.realT * hz * 2) % 2 ? 'notice0' : cue;
      ctx.imageSmoothingEnabled = false; ctx.drawImage(cueCanvas(art), x + 20, yy, 80, 40);
      txt(meaning, x + 116, yy + 28, fLab, FT.text);
    });
  }
  // Edit 86 (P7.5): the screen stays clean. Options (sound, palette, full screen, tuning, pad setup) and the controls for the
  // device in hand live in the pause menu (ESC, START, the ❚❚ chip), not in a row under the screen
  const PAL_NAME = window.PIX_PALETTE_NAME || 'cyber', PAL_NEXT = { cyber: 'day', day: 'night', night: 'cyber' };
  const deviceOf = () => (TOUCH.on ? 'touch' : app.device === 'pad' ? 'pad' : 'keys');
  function optionItems() {
    const out = ['Sound: ' + (app.sound ? 'on' : 'off'), 'Palette: ' + PAL_NAME + ' → ' + PAL_NEXT[PAL_NAME], 'Full screen: ' + (document.fullscreenElement ? 'on' : 'off')];
    if (!TOUCH.on) out.push('Tuning panel', 'Gamepad setup');
    out.push('Back');
    return out;
  }
  function optionDo(it) {
    if (it.startsWith('Sound')) { app.sound = !app.sound; Snd.init(); const b = document.getElementById('btn-sound'); if (b) { b.textContent = app.sound ? 'Sound on' : 'Sound off'; b.setAttribute('aria-pressed', String(app.sound)); } }
    else if (it.startsWith('Palette')) { if (app.mode === 'story') saveStory(); const b = document.getElementById('btn-pal'); if (b) b.click(); }
    else if (it.startsWith('Full screen')) { if (TOUCH.on) fullscreen(); else { const b = document.getElementById('btn-full'); if (b) b.click(); } }
    else if (it === 'Tuning panel') toggleTune();
    else if (it === 'Gamepad setup') { app.padCmd = 'setup'; app.paused = false; app.pausePage = null; }
    else if (it === 'Back') app.pausePage = null;
  }
  const controlItems = () => (TOUCH.on ? ['Adjust layout', 'Reset layout', 'Back'] : ['Back']); // Edit 87
  function controlRows(s) { // the device in hand: keys, a gamepad, or touch; a locked verb names what unlocks it
    const d = deviceOf(), lock = (n, label) => (s.has(n) ? '' : STORY ? LT('n16', 'A Farsight drone brings it') : 'Locked: ' + label + ', by drone'), K3 = { keys: 0, pad: 1, touch: 2 }[d];
    const nm = (n, w) => (STORY && !s.has(n) ? '???' : w); // Edit 90: a verb not yet fitted is not named
    const rows = [
      ['MOVE', ['WASD / arrows', 'Stick / d-pad', 'Stick, left'][K3], ''],
      [STORY && s.dashFitted && !s.dashFitted() ? '???' : 'DASH', ['Space / K', 'A', 'A'][K3], STORY && s.dashFitted && !s.dashFitted() ? LT('n16', 'A Farsight drone brings it') : '', STORY ? 'Out of a dash, the jump is free' : ''], // Edit 91: Battery 1 is the dash
      [nm('jump', 'JUMP'), ['L / Shift', 'B', 'B'][K3], lock('jump', 'Legs 1')],
      [nm('carry', 'GRAB'), ['J / E', 'X', 'X'][K3], lock('carry', 'Hands 1'), s.P['abilities.hands.tapDrop'] ? 'Tap: pick up a cone. Tap with none in reach: put one down' : 'Hold to put a cone down'],
      [nm('push', 'PUSH OFF A CAR'), ['I / Q', 'Y', 'Y'][K3], lock('push', 'Arms 1')],
      ['PAUSE', ['Esc / P', 'Start', '❚❚'][K3], ''],
    ];
    if (d === 'keys') rows.push(['TUNING', 'T', ''], ['GAMEPAD SETUP', 'G', '']);
    if (d === 'pad') rows.push(['GAMEPAD SETUP', 'Hold Start', '']);
    if (d === 'touch') rows.push(['FULL SCREEN', '⤢', '', app.touchCfg ? 'Your layout: Adjust layout to change' : 'Adjust layout: move and size the stick and buttons']);
    return { d, rows };
  }
  function drawControls(s, x, y, w, h) {
    panel(x, y, w, h);
    const { d, rows } = controlRows(s);
    txt('CONTROLS · ' + { keys: 'KEYBOARD', pad: 'GAMEPAD', touch: 'TOUCH' }[d], x + 20, y + 40, fLab, FT.accent);
    ctx.font = fKey; const kw = Math.min(196, Math.max(...rows.map((r) => ctx.measureText(r[1]).width + 24))), tw = w - 40 - kw - 14;
    rows.forEach(([what, key, why, how], i) => { // the verb; beneath it how it works, or what unlocks it
      const yy = y + 60 + i * 50, off = !!why, sub = why || how || '';
      ctx.globalAlpha = off ? 0.5 : 1;
      glassKey(x + 20, yy, kw, 34); txt(key, x + 20 + kw / 2, yy + 25, fKey, FT.text, 'center');
      txt(what, x + 20 + kw + 14, yy + (sub ? 16 : 25), '700 19px ' + F_UI, off ? FT.dim : FT.text);
      if (sub) wrapText(sub, x + 20 + kw + 14, yy + 38, tw, 18, '400 15px ' + F_UI, FT.dim, 1);
      ctx.globalAlpha = 1;
    });
    wrapText(d === 'touch' ? 'A gamepad or keyboard shows its own controls here once used.' : d === 'pad' ? 'Any pad works. Press G or hold Start to map its buttons.' : 'A gamepad shows its own buttons here once pressed.', x + 20, y + h - 44, w - 40, 22, '400 17px ' + F_UI, FT.dim, 2);
  }
  function drawPause(s) {
    veil();
    const x = FX + 18, y = FY + 18, w = 300, h = FH - 36, page = STORY ? app.pausePage : null;
    panel(x, y, w, h);
    txt(page === 'options' ? 'OPTIONS' : page === 'controls' ? 'CONTROLS' : 'PAUSED', x + 22, y + 40, fLab, FT.accent);
    if (page === 'options') menuList(optionItems(), app.optSel, x + 18, y + 62, w - 36, null, 0, (i) => { app.optSel = i; });
    else if (page === 'controls') menuList(controlItems(), app.ctlSel || 0, x + 18, y + 62, w - 36, null, 0, (i) => { app.ctlSel = i; });
    else {
      const items = pauseItems().slice(), story = app.mode === 'story';
      if (app.confirmRefuse && !story) items[2] = 'Confirm refusal';
      menuList(items, app.pauseSel, x + 18, y + 62, w - 36, (i) => !story && i === 2 && s.run.writeOffs < 1, 0, (i) => { if (app.pauseSel !== i) app.confirmRefuse = false; app.pauseSel = i; });
      const ny = STORY ? y + 62 + items.length * 54 + 16 : y + 362;
      wrapText(story ? 'The story map saves this tile\'s count. The body in play is lost.' : s.run.writeOffs < 1 ? 'Refusal opens after one completed body.' : 'Refusal is a deliberate ending.', x + 22, ny, w - 44, 26, STORY ? '400 17px ' + F_UI : fTxt, FT.dim, 3);
    }
    if (pad.info && pad.info.monitor) wrapText('GAMEPAD ' + pad.info.monitor + ' · hold START to set up', x + 22, y + h - 92, w - 44, 22, fTxt, FT.dim, 4); // Edit 75: what the pad sends
    if (STORY) wrapText(appStatus(), x + 22, y + h - 18, w - 44, 18, '400 13px ' + F_MONO, FT.dim, 1); // Edit 86: the build line, off the page
    if (page === 'controls') drawControls(s, x + w + 16, y, FW - 36 - w - 16, h);
    else drawCueKey(x + w + 16, y, FW - 36 - w - 16, h);
  }
  function drawEnding(s) {
    veil();
    const e = s.run.ending, x = FX + 22, y = FY + 18, w = FW - 44, h = FH - 36;
    panel(x, y, w, h, { tint: e.kind === 'Licensed' || e.kind === 'Certified' ? 'rgba(232,248,238,0.95)' : 'rgba(236,247,252,0.95)' });
    txt('CONTRACT RESULT', x + 28, y + 44, fLab, FT.accent);
    const title = { Licensed: 'LICENSED', 'Failed test': 'FAILED TEST', 'Non-compliant': 'NON-COMPLIANT', Certified: 'CERTIFIED' }[e.kind] || e.kind; // Edit 81: the story's end
    txt(title, x + 26, y + 104, '900 54px ' + F_BRAND, e.kind === 'Licensed' ? FT.text : e.kind === 'Failed test' ? C.warning : FT.dim);
    wrapText(e.kind === 'Certified' ? (STORY.DATA.ending || 'All ' + STORY.TOTAL + ' tiles of the Test City are tested and certified complete.') : copy('endings.' + e.kind, ''), x + 28, y + 146, w - 56, 28, fTxt, FT.dim, e.kind === 'Certified' ? 3 : 2); // Edit 92: Narrative A's ending
    const imp = s.events.filter((v) => v.type === 'impact');
    const stats = [['TIME', fmtT(e.t)], ['WRITE-OFFS', String(e.writeOffs)], ['POINTS', num(e.points)], e.grade ? ['GRADE', String(e.grade)] : ['BEST HIT', imp.length ? num(Math.max(...imp.map((v) => v.assessed))) : '—']]; // Edit 97 (P8.2): the grade reached
    const cw = (w - 56) / stats.length;
    const sy = e.kind === 'Certified' ? 30 : 0; // Edit 92: the ending's third line
    stats.forEach(([k, v], i) => { txt(k, x + 28 + i * cw, y + 222 + sy, fLab, FT.dim); txt(v, x + 28 + i * cw, y + 262 + sy, fNum, FT.text); });
    const items = endItems(s), hl = HS && app.hsLast; // Edit 97 (P8.2): the score's place in its table, beside the menu
    if (hl) {
      const bx = x + 28 + 460 + 28, by = y + h - 20 - items.length * 54 + 10, bw = x + w - 28 - bx;
      txt(hl.rank ? 'HIGH SCORE' : 'NOT IN THE TOP ' + HS, bx, by + 18, fLab, hl.rank ? C.dummy : FT.dim);
      if (hl.rank) { txt('RANK ' + hl.rank + ' OF ' + HS, bx, by + 58, fNum, FT.text); fitText(hsEntry(hl).name + ' · ' + hsTableName(hl.key), bx, by + 90, bw, 18, 12, FT.dim); }
      else fitText(hsTableName(hl.key), bx, by + 46, bw, 18, 12, FT.dim);
    }
    menuList(items, app.endSel, x + 28, y + h - 20 - items.length * 54, 460, null, 0, (i) => { app.endSel = i; });
  }

  function render() {
    if (!app.nameEntry && document.activeElement === nameInput) nameInput.blur(); // Edit 88: the hidden name field never keeps the keys
    ctx.setTransform(scale, 0, 0, scale, ox, oy);
    ctx.imageSmoothingEnabled = false;
    { const g = ctx.createLinearGradient(0, 0, 0, VH); g.addColorStop(0, FT.bg[0]); g.addColorStop(0.5, FT.bg[1]); g.addColorStop(1, FT.bg[2]); ctx.fillStyle = g; ctx.fillRect(-ox / scale - 1, -oy / scale - 1, cv.width / scale + 2, cv.height / scale + 2); } // Edit 76: the margins
    renderScreen();
    if (TOUCH.on) { ctx.setTransform(scale, 0, 0, scale, 0, 0); drawTouch(); }
  }
  // Edit 94 (P7.13): the unveiling (D76). The circus's monument stands uncovered; its plaque shows the run.
  // Manual review: a drone lifts the cloth away over ui.finale.unveilSeconds, then the plaque fades in. It uses the game's panel and
  // type inside the field, the device's own prompt and a tap target (the agent's version drew its own text below the field)
  function unveilK() { const u = fx.unveil; return u ? Math.min(1, (app.realT - u.t0) / Math.max(0.1, pv('ui.finale.unveilSeconds'))) : 0; }
  function unveilReady() { return !!fx.unveil && unveilK() >= 1; }
  function shroudLift(s) { // art px the cloth has risen: 0 while it covers the monument; null once it is gone
    if (s.monumentShrouded && s.monumentShrouded()) return 0;
    if (!s.unveil || s.unveil.done) return null;
    if (s.phase === 'writeoff' && s.pendingPhase === 'unveil') return 0; // the last write-off plays under the cloth
    if (s.phase !== 'unveil' || RM) return null;
    const k = unveilK(); return k >= 1 ? null : Math.round(180 * k * k);
  }
  function drawUnveil(s) {
    const p = s.unveil && s.unveil.plaque; if (!p) return;
    if (!fx.unveil) { fx.unveil = { t0: app.realT }; [392, 523, 659, 784].forEach((f, j) => Snd.tone(f, f, 0.2, 'triangle', 0.06, 0.3 + j * 0.14)); } // the chime as the cloth lifts
    const a = RM ? 1 : Math.max(0, Math.min(1, (unveilK() - 0.55) / 0.45)); if (a <= 0) return;
    const w = FW - 72, h = 214, x = FX + 36, y = FY + FH - h - 16, pd = TOUCH.on || app.device === 'pad';
    ctx.save(); ctx.globalAlpha = a;
    panel(x, y, w, h);
    txt('THE DUMMY MONUMENT · UNVEILED', x + 26, y + 38, fLab, FT.accent);
    txt('ZERO ACCIDENTS (EXCLUDING TESTS)', x + 24, y + 80, '900 30px ' + F_BRAND, FT.text);
    const stats = [['CHASSIS SPENT', num(p.chassis || 0)], ['POINTS', num(p.points || 0)], ['BEST COMBO', '×' + (p.bestCombo || 0)], ['TIME', fmtT(p.t || 0)]], cw = (w - 52) / stats.length;
    stats.forEach(([k, v], i) => { txt(k, x + 26 + i * cw, y + 122, '700 17px ' + F_UI, FT.dim); txt(v, x + 26 + i * cw, y + 160, fNum, FT.text); });
    ctx.restore();
    hitbox(x, y, w, h, 'unveil', () => menuQ.push('ok')); // a tap goes on to the ship, once the cloth is off
    if (unveilReady() && Math.floor(app.realT * 2.5) % 3) txt((TOUCH.on ? 'TAP · ' : pd ? 'A  ' : 'SPACE  ') + 'ON TO THE SHIP', x + w - 26, y + h - 20, fLab, FT.accent, 'right');
  }
  function renderScreen() {
    HITS.length = 0; // Edit 89: this frame's tap targets
    if (app.screen === 'intro') { drawIntro(); return; } // Edit 98 (P8.3)
    if (app.screen === 'splash') { drawSplash(); return; }
    drawFrame();
    if (app.screen === 'title') { if (STORY) drawModeTitle(); else drawTitle(); if (app.credits) drawCredits(); return; } // Edit 95 (P8)
    if (app.screen === 'arcade') { drawTitle(); return; } // Edit 81
    if (app.screen === 'storymap') { drawStoryMap(); return; }
    if (app.screen === 'saves') { drawSaves(); return; } // Edit 88
    if (app.screen === 'scores') { drawScores(); return; } // Edit 97 (P8.2)
    if (app.screen === 'loading') { drawLoading(); return; }
    const s = app.sim;
    drawField(s);
    drawHUD(s);
    drawComboMeter(s);
    if (app.paused) { if (!app.touchEdit) drawPause(s); } // Edit 87: placing the touch controls shows the game, dimmed, not the menu
    else if (s.phase === 'brief') { if (CARD) drawLevelCard(s); else drawBrief(s); } // Edit 81: the tile card. Edit 98 (P8.3): the level card, both modes
    else if (s.phase === 'gift') drawGiftPopup(s); // Edit 84
    else if (s.phase === 'unveil') drawUnveil(s); // Edit 94 (P7.13): the plaque
    else if (s.phase === 'report') drawReport(s);
    else if (s.phase === 'shop') drawShop(s);
    else if (s.phase === 'ending') drawEnding(s);
    if (app.credits) drawCredits(); // Edit 95 (P8): after CERTIFIED
    drawPadSetup();
  }
  // Edit 98 (P8.3): three full-screen pieces in the gift screen's front-on style. The intro: the dummy steps into the road and a car
  // comes on, front-on, then the hit (ui.intro.loopSeconds). The level card, both modes: ACT I: MONUMENT. Tile A1. Level 1 of 27; the
  // tale; >>> the goal. The Story splash: the dummy's parts fly apart and back (ui.splash.cycleSeconds)
  const ease = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u * u * (3 - 2 * u)), clampU = (u) => Math.max(0, Math.min(1, u));
  let dollArt8 = null;
  function dollBase() { if (!dollArt8) { const S = PIX.doll({}, null, []); dollArt8 = { S, cv: sprCanvas(S) }; } return dollArt8; }
  function startPrompt(verb) { const pd = TOUCH.on || app.device === 'pad'; return TOUCH.on ? 'TAP TO ' + verb : (pd ? 'A  ' : 'SPACE  ') + verb; }
  const introCv = document.createElement('canvas'); introCv.width = 320; introCv.height = 180;
  const introCtx = introCv.getContext('2d');
  function introCity(c) { // the skyline at the horizon, windows lit at fixed places
    for (let i = 0, x = 0; x < 320; i++) {
      const w = 10 + ((i * 37) % 17), h = 18 + ((i * 53) % 34); c.fillStyle = i % 3 ? '#141B33' : '#1A2342'; c.fillRect(x, 80 - h, w, h);
      for (let wy = 80 - h + 3; wy < 78; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (((wx * 7 + wy * 13 + i) % 5) === 0) { c.fillStyle = (wx + wy) % 2 ? '#3FD0FF' : '#FF5FD2'; c.fillRect(wx, wy, 1, 1); }
      x += w + 1;
    }
  }
  function introCar(c, cx, by, k) { // front-on: roof, windscreen, body, grille, headlights, wheels; k scales it
    const W = Math.round(96 * k), H = Math.round(44 * k), x0 = Math.round(cx - W / 2), y0 = Math.round(by - H);
    c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x0 - 2, by - 2, W + 4, Math.max(2, Math.round(5 * k)));
    c.fillStyle = '#141820'; c.fillRect(x0 + Math.round(4 * k), by - Math.round(9 * k), Math.round(14 * k), Math.round(10 * k)); c.fillRect(x0 + W - Math.round(18 * k), by - Math.round(9 * k), Math.round(14 * k), Math.round(10 * k));
    c.fillStyle = '#DDE6EE'; c.fillRect(x0 + Math.round(14 * k), y0, W - Math.round(28 * k), Math.round(18 * k));
    c.fillStyle = '#0E3A4F'; c.fillRect(x0 + Math.round(18 * k), y0 + Math.round(3 * k), W - Math.round(36 * k), Math.round(12 * k));
    c.fillStyle = '#6FE4FF'; c.fillRect(x0 + Math.round(20 * k), y0 + Math.round(4 * k), Math.max(1, Math.round(10 * k)), Math.max(1, Math.round(2 * k)));
    c.fillStyle = '#C9D3DA'; c.fillRect(x0, y0 + Math.round(17 * k), W, H - Math.round(25 * k));
    c.fillStyle = '#F4F8FA'; c.fillRect(x0 + Math.round(2 * k), y0 + Math.round(17 * k), W - Math.round(4 * k), Math.max(1, Math.round(3 * k)));
    c.fillStyle = '#262B36'; c.fillRect(x0 + Math.round(30 * k), y0 + Math.round(26 * k), W - Math.round(60 * k), Math.round(8 * k));
    c.fillStyle = '#F4F8FA'; c.fillRect(Math.round(cx - 7 * k), y0 + Math.round(36 * k), Math.max(2, Math.round(14 * k)), Math.max(1, Math.round(4 * k)));
    for (const sx of [-1, 1]) { const hx = Math.round(cx + sx * 34 * k - 6 * k), hy = y0 + Math.round(23 * k); c.fillStyle = '#FFF6DC'; c.fillRect(hx, hy, Math.max(2, Math.round(12 * k)), Math.max(1, Math.round(6 * k))); }
  }
  function drawIntro() {
    if (!app.introT0) app.introT0 = app.realT;
    const L = Math.max(2, (SIM8 && SIM8['ui.intro.loopSeconds']) || 6.5), t = (app.realT - app.introT0) % L, u = RM ? 0.62 : t / L, c = introCtx;
    c.imageSmoothingEnabled = false;
    const sky = c.createLinearGradient(0, 0, 0, 90); sky.addColorStop(0, '#05070F'); sky.addColorStop(1, '#2A1440'); c.fillStyle = sky; c.fillRect(0, 0, 320, 180);
    introCity(c);
    c.fillStyle = '#10141D'; c.fillRect(0, 80, 320, 100);
    c.fillStyle = '#1E222C'; c.beginPath(); c.moveTo(150, 80); c.lineTo(170, 80); c.lineTo(300, 180); c.lineTo(20, 180); c.closePath(); c.fill();
    c.fillStyle = '#E6F4FF'; for (const sx of [-1, 1]) { c.beginPath(); c.moveTo(160 + sx * 10, 80); c.lineTo(160 + sx * 11, 80); c.lineTo(160 + sx * 141, 180); c.lineTo(160 + sx * 138, 180); c.closePath(); c.fill(); }
    for (let i = 0; i < 7; i++) { const z = ((i / 7) + (RM ? 0 : app.realT * 0.35)) % 1, y = 80 + 100 * z * z, h = Math.max(1, 6 * z * z), w = Math.max(1, 3 * z); c.fillStyle = '#E6F4FF'; c.fillRect(Math.round(160 - w / 2), Math.round(y), Math.round(w), Math.round(h)); }
    const hit = 0.66, carK = 0.12 + 1.15 * ease(clampU(u / hit)), carY = 82 + 76 * ease(clampU(u / hit)); // the car, from the horizon to the dummy
    const lit = c.createRadialGradient(160, carY - 10 * carK, 2, 160, carY - 10 * carK, 60 * carK + 6); lit.addColorStop(0, 'rgba(255,246,220,0.35)'); lit.addColorStop(1, 'rgba(255,246,220,0)'); c.fillStyle = lit; c.fillRect(0, 60, 320, 120);
    const D = dollBase(), dk = 0.92, dw = D.S.w * dk, dh = D.S.h * dk;
    const walk = clampU((u - 0.05) / 0.3), dx = 330 - (330 - 160) * ease(walk), bob = walk > 0 && walk < 1 && !RM ? Math.abs(Math.sin(walk * 18)) * 3 : 0;
    if (u < hit) { introCar(c, 160, carY, carK); c.drawImage(D.cv, Math.round(dx - dw / 2), Math.round(176 - dh - bob), Math.round(dw), Math.round(dh)); }
    else { // the hit: the dummy flies at us, turning; the car behind it
      const f = clampU((u - hit) / 0.2); introCar(c, 160, carY, carK);
      c.save(); c.globalAlpha = 1 - clampU((u - hit - 0.12) / 0.12); c.translate(160 + 40 * f, 176 - dh / 2 - 60 * f); c.rotate(2.4 * f); const g = 1 + 2.2 * f; c.drawImage(D.cv, -dw * g / 2, -dh * g / 2, dw * g, dh * g); c.restore();
    }
    const flash = u >= hit ? 1 - clampU((u - hit) / 0.08) : 0, fade = clampU((u - 0.9) / 0.1);
    ctx.save(); ctx.imageSmoothingEnabled = false;
    const sh = !RM && u >= hit && u < hit + 0.06 ? 10 * (1 - (u - hit) / 0.06) : 0;
    const OY = -130; // the scene sits high; the line and START on a band of road below the dummy's feet
    ctx.drawImage(introCv, Math.round(sh * Math.sin(app.realT * 90)), OY, VW, VH);
    ctx.fillStyle = '#0B0E16'; ctx.fillRect(0, VH + OY, VW, -OY); ctx.fillStyle = C.dummy; ctx.fillRect(0, VH + OY, VW, 3);
    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,' + flash + ')'; ctx.fillRect(0, 0, VW, VH); }
    if (fade > 0) { ctx.fillStyle = 'rgba(5,7,15,' + fade + ')'; ctx.fillRect(0, 0, VW, VH); }
    ctx.restore();
    const g2 = ctx.createLinearGradient(0, 0, 0, 220); g2.addColorStop(0, 'rgba(5,7,15,0.85)'); g2.addColorStop(1, 'rgba(5,7,15,0)'); ctx.fillStyle = g2; ctx.fillRect(0, 0, VW, 220);
    ctx.save(); ctx.shadowColor = C.dummy; ctx.shadowBlur = 24; txt('DUMMIES', VW / 2, 128, '900 112px ' + F_BRAND, C.dummy, 'center'); ctx.restore();
    wrapText(LT('n36', 'Find new ways to make the cars hit you. Combo bonuses and upgrades await. Make Dummy Corporation proud.'), VW / 2, VH - 94, 900, 34, '700 26px ' + F_UI, '#FFFFFF', 2, 'center');
    if (RM || Math.floor(app.realT * 2) % 2 === 0) txt(startPrompt('START'), VW / 2, VH - 24, '900 26px ' + F_BRAND, C.dummy, 'center');
    hitbox(0, 0, VW, VH, 'intro:start', () => menuQ.push('ok'));
  }
  let partArt = null;
  function dollParts() { // the doll cut into its six parts along pixel.js's blobs: head, torso, two arms, two legs
    if (partArt) return partArt;
    const D = dollBase(), W = D.S.w, H = D.S.h, src = D.cv.getContext('2d').getImageData(0, 0, W, H);
    const which = (x, y) => (y < 39 ? 'head' : (x < 20 || x > 43) && y < 82 ? (x < 32 ? 'armR' : 'armL') : y >= 72 ? (x < 32 ? 'legR' : 'legL') : 'torso');
    const dir = { head: [0, -1.1], torso: [0, 0.15], armR: [-1.1, -0.35], armL: [1.1, -0.35], legR: [-0.7, 0.95], legL: [0.7, 0.95] }, spin = { head: 0.9, torso: 0, armR: -1.6, armL: 1.6, legR: -1.1, legL: 1.1 };
    partArt = Object.keys(dir).map((k) => {
      const cv2 = document.createElement('canvas'); cv2.width = W; cv2.height = H; const c2 = cv2.getContext('2d'), out = c2.createImageData(W, H);
      let sx = 0, sy = 0, n = 0;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (!src.data[i + 3] || which(x, y) !== k) continue; for (let j = 0; j < 4; j++) out.data[i + j] = src.data[i + j]; sx += x; sy += y; n++; }
      c2.putImageData(out, 0, 0);
      return { k, cv: cv2, cx: n ? sx / n : W / 2, cy: n ? sy / n : H / 2, dir: dir[k], spin: spin[k] };
    });
    return partArt;
  }
  function drawSplash() {
    const T = Math.max(1, (SIM8 && SIM8['ui.splash.cycleSeconds']) || 3.6), t = app.realT - app.splashT0, u = RM ? 0 : (t % T) / T;
    const bg = ctx.createLinearGradient(0, 0, 0, VH); bg.addColorStop(0, '#05070F'); bg.addColorStop(1, '#141B33'); ctx.fillStyle = bg; ctx.fillRect(0, 0, VW, VH);
    ctx.save(); ctx.beginPath(); ctx.rect(0, 0, VW, VH); ctx.clip();
    const mx = VW / 2, my = 280, rot = RM ? 0.3 : app.realT * 0.4, N = 16, R = 760, gr = ctx.createRadialGradient(mx, my, 10, mx, my, R);
    gr.addColorStop(0, 'rgba(245,197,66,0.55)'); gr.addColorStop(1, 'rgba(245,197,66,0)'); ctx.fillStyle = gr; ctx.beginPath();
    for (let i = 0; i < N; i++) { const a0 = rot + i * TAU / N; ctx.moveTo(mx, my); ctx.arc(mx, my, R, a0, a0 + TAU / N * 0.42); ctx.closePath(); }
    ctx.fill();
    const out = u < 0.12 ? 0 : u < 0.42 ? ease((u - 0.12) / 0.3) : u < 0.62 ? 1 : 1 - ease((u - 0.62) / 0.33), wob = u >= 0.42 && u < 0.62 ? Math.sin((u - 0.42) * 30) * 0.04 : 0;
    const SC = 3.2, D = dollBase(), x0 = mx - D.S.w * SC / 2, y0 = my - D.S.h * SC / 2;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    for (const pt of dollParts()) {
      const ox = pt.dir[0] * 180 * out, oy = pt.dir[1] * (pt.k === 'head' ? 70 : 110) * out, a = (pt.spin + wob) * out, px = x0 + pt.cx * SC, py = y0 + pt.cy * SC;
      ctx.save(); ctx.translate(px + ox, py + oy); ctx.rotate(a); ctx.drawImage(pt.cv, -pt.cx * SC, -pt.cy * SC, D.S.w * SC, D.S.h * SC); ctx.restore();
    }
    ctx.restore();
    const fl = u >= 0.12 && u < 0.17 ? 1 - (u - 0.12) / 0.05 : 0;
    if (fl > 0) { ctx.fillStyle = 'rgba(255,255,255,' + (0.7 * fl) + ')'; ctx.fillRect(0, 0, VW, VH); }
    ctx.save(); ctx.shadowColor = C.dummy; ctx.shadowBlur = 20; txt('STORY', VW / 2, VH - 112, '900 72px ' + F_BRAND, C.dummy, 'center'); ctx.restore();
    txt('SHENZHEN SMART CITY', VW / 2, VH - 74, '900 24px ' + F_BRAND, FT.accent, 'center');
    if (RM || Math.floor(app.realT * 2) % 2 === 0) txt(startPrompt('CONTINUE'), VW / 2, VH - 30, '900 22px ' + F_BRAND, C.dummy, 'center');
    ctx.restore();
    hitbox(0, 0, VW, VH, 'splash:continue', () => menuQ.push('ok'));
  }
  function hazard(y, h) { ctx.save(); ctx.beginPath(); ctx.rect(0, y, VW, h); ctx.clip(); ctx.fillStyle = '#111317'; ctx.fillRect(0, y, VW, h); ctx.fillStyle = C.dummy; for (let x = -h * 2; x < VW + h; x += 2 * h) { ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x + h, y); ctx.lineTo(x + 2 * h, y); ctx.lineTo(x + h, y + h); ctx.closePath(); ctx.fill(); } ctx.restore(); }
  function drawLevelCard(s) {
    const key = s.levelId + ':' + s.screenName() + ':' + (s.storyMode ? STORY.activeTile(s.story, s.levelId) : 'arcade');
    if (fx.cardKey !== key) { fx.cardKey = key; fx.cardT0 = app.realT; }
    const t = app.realT - fx.cardT0, inK = RM ? 1 : ease(clampU(t / 0.35)), P = s.P;
    ctx.fillStyle = 'rgba(5,7,15,0.95)'; ctx.fillRect(0, 0, VW, VH);
    hazard(0, 22); hazard(VH - 22, 22);
    const D = dollBase(), SC = 3, dw = D.S.w * SC, dh = D.S.h * SC, ddx = VW - 120 - dw, ddy = (VH - dh) / 2 + 10, rx = ddx + dw / 2, ry = ddy + dh * 0.42;
    { const rot = RM ? 0.3 : app.realT * 0.4, gr = ctx.createRadialGradient(rx, ry, 8, rx, ry, 360); gr.addColorStop(0, 'rgba(245,197,66,0.38)'); gr.addColorStop(1, 'rgba(245,197,66,0)'); ctx.fillStyle = gr; ctx.beginPath(); for (let i = 0; i < 14; i++) { const a0 = rot + i * TAU / 14; ctx.moveTo(rx, ry); ctx.arc(rx, ry, 360, a0, a0 + TAU / 14 * 0.42); ctx.closePath(); } ctx.fill(); }
    ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = inK; ctx.drawImage(D.cv, ddx, ddy + (RM ? 0 : Math.sin(app.realT * 2.4) * 6), dw, dh); ctx.restore();
    let head, sub, story, goal, extra = '';
    if (s.storyMode) {
      const d = STORY.districtOf(s.levelId), tn = STORY.activeTile(s.story, s.levelId) || s.screenName(), tile = d.tiles[tn], need = STORY.needOf(d.id, tn, P);
      head = (d.act ? d.act.split(' · ')[0] : 'ACT') + ': ' + d.name.toUpperCase();
      sub = 'Tile ' + tn + '. Level ' + STORY.tileNumber(d.id, tn) + ' of ' + STORY.TOTAL + '.';
      story = tile.tale; goal = STORY.taskText(tile.task, P).brief;
      if (need > 1) extra = need + ' WRITE-OFFS TO CLEAR';
    } else {
      const nid = ({ monument: 'n24', parkland: 'n25', waterfront: 'n26' })[s.levelId];
      head = 'ARCADE: ' + INFO(s.levelId).name.toUpperCase();
      sub = s.grade ? 'Grade ' + s.grade + ' of ' + P['arcade.grade.max'] + '.' : '';
      story = nid ? LT(nid, INFO(s.levelId).blurb) : INFO(s.levelId).blurb;
      goal = LT('n37', 'Write off {Q} bodies to raise the grade. The shift ends when the vehicles run out.', { Q: s.quota });
    }
    const x = 96 - 60 * (1 - inK), w = Math.min(760, ddx - 40 - 96);
    ctx.save(); ctx.globalAlpha = inK;
    txt(head, x, 150, '900 64px ' + F_BRAND, C.dummy);
    txt(sub, x + 2, 196, '700 28px ' + F_UI, FT.accent);
    let yy = 270; yy += 42 * wrapText(story, x, yy, w, 42, '400 31px ' + F_UI, '#FFFFFF', 3) + 26;
    txt('>>>', x, yy, '900 31px ' + F_BRAND, C.dummy);
    yy += 42 * wrapText(goal, x + 74, yy, w - 74, 42, '700 31px ' + F_UI, '#FFFFFF', 4);
    if (extra) txt(extra, x + 74, yy + 6, '700 20px ' + F_UI, FT.dim);
    ctx.restore();
    if (t > 0.35 && (RM || Math.floor(app.realT * 2) % 2 === 0)) txt(startPrompt('START'), VW - 60, VH - 48, '900 28px ' + F_BRAND, C.dummy, 'right');
    hitbox(0, 0, VW, VH, 'card:start', () => menuQ.push('ok'));
  }
  // Edit 97 (P8.2): the high scores, kept in this browser. A table per Arcade district (points; grade, write-offs, time beside) and
  // one for Story's Certified runs (points; chassis spent, time). highscore.tableSize rows each. A new Arcade score takes the last
  // name used (TRAINEE at first); the ending offers to name it. A Story score takes the save slot's name
  const HS_KEY = 'dummies.p8.highscores.v1', HS_NAME_KEY = 'dummies.p8.highscoreName', HS_DEFAULT = 'TRAINEE';
  let hsMem = null, hsNameMem = null;
  function hsRead() { let v = hsMem; try { const raw = localStorage.getItem(HS_KEY); if (raw != null) v = JSON.parse(raw); } catch (e) { /* storage off */ } return v && v.v === 1 && v.tables ? v : { v: 1, tables: {} }; }
  function hsWrite(v) { hsMem = v; try { localStorage.setItem(HS_KEY, JSON.stringify(v)); } catch (e) { /* storage off: this visit only */ } }
  function hsName() { let n = hsNameMem; try { n = localStorage.getItem(HS_NAME_KEY) || n; } catch (e) { /* storage off */ } return n || HS_DEFAULT; }
  function hsSetName(n) { hsNameMem = n; try { localStorage.setItem(HS_NAME_KEY, n); } catch (e) { /* storage off */ } }
  function hsTables() { return LEVEL_LIST.map((id) => ({ key: 'arcade:' + id, name: INFO(id).name.toUpperCase(), arcade: true })).concat(STORY ? [{ key: 'story', name: 'STORY', arcade: false }] : []); }
  function hsTabOf(key) { return Math.max(0, hsTables().findIndex((t) => t.key === key)); }
  function hsTableName(key) { const t = hsTables().find((q) => q.key === key); return t ? t.name : ''; }
  function hsEntry(L) { const t = (hsRead().tables[L.key] || []); return t.find((q) => q.at === L.at) || { name: '' }; }
  function hsAdd(key, entry) { // the entry's rank, 1 to highscore.tableSize; 0 when it misses the table
    const v = hsRead(), t = (v.tables[key] || []).concat([entry]).sort((a, b) => b.points - a.points || a.at - b.at).slice(0, HS);
    v.tables[key] = t; hsWrite(v); return t.indexOf(entry) + 1;
  }
  function hsRename(L, name) { if (!L || !L.rank) return; const v = hsRead(), q = (v.tables[L.key] || []).find((e) => e.at === L.at); if (q) { q.name = name; hsWrite(v); } }
  function hsRecord(s, kind) {
    if (s.hsDone) return; s.hsDone = true; app.hsLast = null;
    const en = s.run.ending; if (!en || !(en.points > 0)) return;
    if (s.storyMode) {
      if (kind !== 'Certified') return;
      const sv = app.slot && allSlots()[app.slot - 1], e = { name: sv ? sv.name : hsName(), points: en.points, chassis: (s.story && s.story.chassis) || 0, t: en.t, at: Date.now() };
      app.hsLast = { key: 'story', at: e.at, rank: hsAdd('story', e) }; return;
    }
    const key = 'arcade:' + s.levelId, e = { name: hsName(), points: en.points, grade: en.grade || 0, writeOffs: en.writeOffs, t: en.t, at: Date.now() };
    app.hsLast = { key, at: e.at, rank: hsAdd(key, e) };
  }
  function openScores(from, tab) { app.scoresFrom = from; app.scoreTab = tab || 0; app.screen = 'scores'; }
  function nameStartScore() { if (!app.hsLast || !app.hsLast.rank) return; app.nameEntry = { kind: 'score', slot: 0, text: hsEntry(app.hsLast).name || hsName(), fresh: true, r: 3, c: 10 }; nameInput.value = ''; }
  function scoresMenu(m) {
    const n = hsTables().length;
    if (m === 'left' || m === 'up') app.scoreTab = (app.scoreTab + n - 1) % n;
    else if (m === 'right' || m === 'down') app.scoreTab = (app.scoreTab + 1) % n;
    else if (m === 'ok' || m === 'back' || m === 'pause') app.screen = app.scoresFrom === 'game' && app.sim ? 'game' : 'title';
  }
  function drawScores() {
    drawField(preview(Math.max(0, LEVEL_LIST.indexOf('monument'))), true);
    veil();
    const x = FX + 16, y = FY + 14, w = FW - 32, h = FH - 28, T = hsTables(), ti = app.scoreTab % T.length, tab = T[ti];
    panel(x, y, w, h);
    if (app.nameEntry) { drawNameEntry(x, y, w, h); return; }
    txt('HIGH SCORES', x + 24, y + 40, fLab, FT.accent);
    txt('SAVED IN THIS BROWSER', x + w - 24, y + 40, '700 15px ' + F_UI, FT.dim, 'right');
    const tw = (w - 48 - (T.length - 1) * 10) / T.length;
    T.forEach((t, i) => {
      const tx = x + 24 + i * (tw + 10), on = i === ti;
      rr(tx, y + 56, tw, 40, 10); ctx.fillStyle = on ? FT.sel : FT.item; ctx.fill(); ctx.strokeStyle = on ? FT.accent : FT.itemEdge; ctx.lineWidth = on ? 3 : 1.5; ctx.stroke();
      txt(t.name, tx + tw / 2, y + 83, fLab, on ? FT.selText : FT.text, 'center');
      hitbox(tx, y + 56, tw, 40, 'scores:' + t.key, () => { app.scoreTab = i; });
    });
    const rows = hsRead().tables[tab.key] || [], L = app.hsLast;
    const cols = tab.arcade ? [['#', 0, 'left'], ['NAME', 36, 'left'], ['POINTS', 330, 'right'], ['GRADE', 410, 'right'], ['WRITE-OFFS', 530, 'right'], ['TIME', 610, 'right']]
      : [['#', 0, 'left'], ['NAME', 36, 'left'], ['POINTS', 330, 'right'], ['CHASSIS', 450, 'right'], ['TIME', 560, 'right']];
    const cx = x + 40, hy = y + 132, rh = Math.min(42, Math.floor((h - 132 - 70) / HS)), day = (ms) => { const d = new Date(ms); return d.getDate() + ' ' + MON[d.getMonth()]; };
    cols.forEach(([k, dx, al]) => txt(k, cx + dx, hy, '700 15px ' + F_UI, FT.dim, al));
    txt('DATE', x + w - 40, hy, '700 15px ' + F_UI, FT.dim, 'right');
    if (!rows.length) wrapText(tab.arcade ? 'No scores yet. Play a shift in ' + INFO(tab.key.slice(7)).name + '.' : 'No scores yet. A Certified story run sets the first.', cx, hy + 48, w - 80, 26, fTxt, FT.dim, 2);
    rows.forEach((q, i) => {
      const yy = hy + 16 + i * rh, me = L && L.key === tab.key && L.at === q.at;
      if (me) { rr(x + 28, yy, w - 56, rh - 4, 8); ctx.fillStyle = FT.credit; ctx.fill(); ctx.strokeStyle = C.dummy; ctx.lineWidth = 1.5; ctx.stroke(); }
      const by = yy + rh / 2 + 6, col = me ? FT.text : i ? FT.text : C.dummy;
      const vals = tab.arcade ? [String(i + 1), q.name, num(q.points), q.grade ? String(q.grade) : '—', String(q.writeOffs), fmtT(q.t)] : [String(i + 1), q.name, num(q.points), String(q.chassis), fmtT(q.t)];
      vals.forEach((v, j) => txt(v, cx + cols[j][1], by, '700 20px ' + F_MONO, col, cols[j][2]));
      txt(day(q.at), x + w - 40, by, '700 15px ' + F_UI, FT.dim, 'right');
    });
    const pd = TOUCH.on || app.device === 'pad';
    hitbox(x, y + h - 40, w, 40, 'scores:back', () => menuQ.push('back'));
    txt(TOUCH.on ? 'TAP A TABLE · TAP HERE TO GO BACK' : pd ? 'STICK A TABLE · A OR B BACK' : 'ARROWS A TABLE · SPACE OR SHIFT BACK', x + w / 2, y + h - 12, '700 15px ' + F_UI, FT.dim, 'center');
  }
  // Edit 95 (P8): the Credits card. Extra-diegetic: the only text that names the publisher (prototypes/p8/lore.js)
  function drawCredits() {
    if (!CREDITS) return;
    veil();
    const L0 = CREDITS.lines || [], w = Math.min(760, FW - 120), h = 150 + 46 * Math.max(0, L0.length - 1) + 70, x = FX + (FW - w) / 2, y = FY + (FH - h) / 2;
    panel(x, y, w, h);
    hitbox(FX, FY, FW, FH, 'credits:close', () => menuQ.push('ok'));
    txt('CREDITS', x + w / 2, y + 44, fLab, FT.accent, 'center');
    if (L0[0]) txt(L0[0], x + w / 2, y + 112, '900 54px ' + F_BRAND, FT.text, 'center');
    L0.slice(1).forEach((ln, i) => txt(ln, x + w / 2, y + 162 + i * 46, '400 26px ' + F_UI, FT.text, 'center'));
    const pd = TOUCH.on ? 'TAP · BACK' : app.device === 'pad' ? 'A · BACK' : 'SPACE · BACK';
    txt(pd, x + w / 2, y + h - 22, fLab, FT.dim, 'center');
  }
  // Edit 79: the combo meter, top of the field while a chain is live: hits, multiplier, the moves so far; the bar is the clock
  // (scoring.comboWindow), held while the dummy is in the air, flying or hitched
  const MOVE_NAME = { dash: 'DASH', jump: 'JUMP', bounce: 'BOUNCE', push: 'PUSH', sling: 'SLING', drop: 'DROP', cone: 'CONE', struck: 'STRUCK' };
  function drawComboMeter(s) {
    const b = s.body, cb = b && b.combo, P = s.P;
    if (!cb || cb.ended || !P['proto.combo'] || s.phase !== 'play') return;
    const w = 460, h = 58, x = FX + FW / 2 - w / 2, y = FY + FH - h - 14, left = Math.max(0, 1 - (cb.clock || 0) / P['scoring.comboWindow']);
    const air = b.mode === 'jump' || b.mode === 'knock' || b.mode === 'hitch' || b.mode === 'drop';
    rr(x, y, w, h, 12); ctx.fillStyle = 'rgba(11,16,22,0.78)'; ctx.fill(); ctx.strokeStyle = cb.n > 1 ? C.dummy : FT.accent; ctx.lineWidth = 2; ctx.stroke();
    txt((cb.n > 1 ? 'COMBO ' + cb.n : 'HIT') + '  ×' + (+cb.mult.toFixed(2)), x + 14, y + 26, fLab, cb.n > 1 ? C.dummy : FT.text);
    txt(cb.kinds.map((k) => MOVE_NAME[k] || k).join(' › '), x + w - 14, y + 26, '700 15px ' + F_UI, FT.dim, 'right');
    if (ABIL4 && s.has('push')) { const n = P['abilities.arms.pushesPerLevel'] * s.tier('arms'); for (let i = 0; i < n; i++) { ctx.beginPath(); ctx.arc(x + w / 2 - (n - 1) * 9 + i * 18, y + 20, 5.5, 0, TAU); ctx.fillStyle = i < (b.pushes || 0) ? FT.accent : 'rgba(159,176,186,0.25)'; ctx.fill(); } } // Edit 80: pushes left
    rr(x + 14, y + 38, w - 28, 10, 5); ctx.fillStyle = 'rgba(159,176,186,0.22)'; ctx.fill();
    if (left > 0) { rr(x + 14, y + 38, Math.max(10, (w - 28) * left), 10, 5); ctx.fillStyle = air && P['scoring.comboAirPause'] ? FT.accent : C.dummy; ctx.fill(); }
  }
  function drawPadSetup() { // Edit 75: pad setup, over everything
    const st = pad.st && pad.st.setup; if (!st) return;
    const w = 640, h = 150, x = VW / 2 - w / 2, y = VH / 2 - h / 2;
    panel(x, y, w, h);
    txt('GAMEPAD SETUP', x + w / 2, y + 44, fLab, FT.accent, 'center');
    txt('Press the button for ' + PAD_NAME[st], x + w / 2, y + 92, '700 30px ' + F_UI, FT.text, 'center');
    txt((ABIL3 ? 'DASH, JUMP, GRAB in turn' : ABIL4 ? 'DASH, JUMP, GRAB, PUSH in turn' : 'DASH, JUMP, GRAB, THROW in turn') + ' · ESC or G cancels', x + w / 2, y + 128, fTxt, FT.dim, 'center');
  }

  // ---------- tuning panel
  const TUNE = [
    ['movement.walkSpeed', 30, 200, 1], ['movement.runSpeed', 60, 320, 1], ['movement.rampSeconds', 0, 3, 0.05],
    ['movement.turnRate', 45, 720, 5], ['upgrades.hipsTurnRate', 90, 1080, 5], ['movement.lungeDistance', 60, 320, 2],
    ['movement.lungeDuration', 0.1, 0.8, 0.01], ['movement.lungeRecovery', 0, 1, 0.01], ['movement.wearFloor', 0.2, 1, 0.01],
    ['battery.capacity', 1, 6, 1], ['battery.secondsPerCharge', 0.2, 3, 0.05],
    ['proto.quota.straight', 1, 5, 1], ['proto.quota.barrier', 1, 5, 1], ['proto.quota.corner', 1, 5, 1],
    ['proto.traffic.straight.interval', 1, 12, 0.5], ['proto.traffic.barrier.interval', 1, 12, 0.5], ['proto.traffic.corner.interval', 1, 12, 0.5], ['proto.traffic.jitter', 0, 0.9, 0.05],
    ['proto.health.fragile', 50, 2400, 25], ['proto.health.standard', 50, 2400, 25], ['proto.health.reinforced', 50, 2400, 25],
    ['damage.referenceSpeed', 40, 400, 2], ['run.admissionInterval', 2, 20, 0.5], ['traffic.commitHorizon', 0.3, 2, 0.05],
    ['perception.forwardLength', 100, 600, 10], ['perception.reactionDelay', 0, 1.5, 0.01], ['proto.standoffDistance', 20, 400, 5],
    ['proto.learn.standoffStep', 0, 100, 5], ['proto.learn.standoffMax', 20, 400, 5], ['traffic.deadlockTimeout', 0.5, 10, 0.5],
    ['proto.sensorStraight', 0, 1, 1], ['proto.unstick.reverseSpeed', 5, 80, 1], ['proto.unstick.reverseGap', 40, 300, 5], ['proto.unstick.reverseSeconds', 1, 10, 0.5],
    ['proto.driver.coveredReaction', 0, 1.5, 0.01], ['proto.driver.cautionZone', 0, 400, 5], ['proto.driver.cautionSpeed', 20, 200, 2],
    ['proto.driver.passClearance', 0, 80, 2], ['proto.driver.passSpeed', 10, 160, 2], ['proto.driver.patienceSeconds', 0, 30, 0.5],
    ['traffic.comfortBraking', 10, 200, 1], ['traffic.hardBraking', 20, 300, 1], ['traffic.acceleration', 10, 200, 1], ['traffic.timeGap', 0.5, 4, 0.1], ['proto.swerveLength', 40, 300, 5], ['proto.returnSignalSeconds', 0, 2, 0.05],
    ['vehicles.sedan.cruiseSpeed', 60, 260, 2], ['vehicles.van.cruiseSpeed', 60, 260, 2], ['upgrades.throwDistance', 40, 300, 5],
    ['traffic.deckSpeedScale', 1, 2, 0.05], ['traffic.deckGapScale', 0.5, 3, 0.1], ['damage.deckMultiplier', 1, 3, 0.1], ['vehicles.bus.minRadius', 64, 320, 8], ['damage.walkShare', 0, 1, 0.05],
    ['traffic.share.hatchback', 0, 0.5, 0.01], ['traffic.share.police', 0, 0.3, 0.01], ['traffic.share.bus', 0, 0.4, 0.01], // P5 (Edit 50)
    ['upgrades.spineLimit', 10, 90, 1], ['upgrades.bigCapacity', 2, 6, 1], ['world.puddleShare', 0, 0.1, 0.005], ['proto.district.seed', 0, 20, 1], ['world.flipSeconds', 0, 1, 0.05],
    ['proto.damageExponent', 1, 3, 0.1], ['proto.dummyStrikeSpeed', 0, 400, 5], ['proto.dummyMass', 0.01, 1, 0.005],
    ['proto.restitution', 0, 1, 0.05], ['proto.contactFriction', 0, 1, 0.05], ['proto.recoilScale', 0, 2, 0.05], ['proto.recoilSeconds', 0, 1, 0.05],
    // Edit 75 (P6.5): DIRECT turning, the jump, Ricochet, combos
    ['proto.turnModel', 1, 2, 1], ['movement.directTurnRate', 180, 1440, 30], ['upgrades.jumpAirtime', 0.2, 1, 0.05], ['upgrades.jumpMaxSpeed', 100, 600, 4], ['upgrades.jumpAirAccel', 0, 1200, 12], ['upgrades.jumpHeight', 10, 80, 1],
    ['battery.jumpCost', 0, 2, 0.5], ['upgrades.ricochetScale', 1, 4, 0.25],
    // Edit 77 (P6.7): ability tracks; run to clear
    ['abilities.wearCut', 0, 0.25, 0.01], ['abilities.battery.rechargeCut', 0, 0.19, 0.01], ['abilities.legs.airtimeBase', 0.1, 1, 0.05], ['abilities.legs.airtimeStep', 0, 0.3, 0.05],
    ['abilities.arms.conesPerLevel', 1, 3, 1], ['abilities.throw.distanceStep', 0, 120, 5], ['economy.price.ability.level4', 0, 8, 1],
    // Edit 79 (P6.9): Battery's seconds a charge per level; the throw hold; the hitch and sling; combos
    ['abilities.battery.level1Seconds', 0.2, 2, 0.05], ['abilities.battery.level2Seconds', 0.2, 2, 0.05], ['abilities.battery.level3Seconds', 0.2, 2, 0.05],
    ['input.throwHoldSeconds', 0.1, 1, 0.05], ['input.dropHoldSeconds', 0.1, 1, 0.05], ['abilities.hands.conesPerLevel', 1, 3, 1],
    ['abilities.arms.pushSpeed', 0, 400, 10], ['abilities.arms.pushStep', 0, 200, 5], ['abilities.arms.pushesPerLevel', 1, 3, 1], ['abilities.arms.pushReach', 0, 40, 1], ['abilities.arms.pushWindow', 0, 1, 0.05],
    ['proto.parts.armPushLoss', 0, 3, 0.1], ['abilities.arms.hitchReach', 0, 40, 1], ['abilities.arms.hitchSeconds', 0.3, 4, 0.1], ['abilities.arms.hitchMinSpeed', 0, 120, 5],
    ['abilities.arms.slingScale', 0.5, 2, 0.05], ['abilities.arms.slingDash', 0, 300, 10], ['abilities.arms.hitchEdge', 0, 120, 5],
    ['scoring.comboVariety', 0, 2, 0.1], ['scoring.comboAirPause', 0, 1, 1], ['scoring.coneLink', 0, 1, 1], ['scoring.coneHitPoints', 0, 100, 5],
    // Edit 78 (P6.8): the bounce off a car, Newtonian. Restitution, the dummy's mass, contact friction, the slide
    ['proto.bounce.newton', 0, 1, 1], ['physics.slideFriction', 0.1, 3, 0.05], ['proto.parts.torsoRechargeLoss', 0, 3, 0.1], ['proto.jump.runToClear', 0, 1, 1],
    ['economy.price.ability.level1', 0, 5, 1], ['economy.price.ability.level2', 0, 5, 1], ['economy.price.ability.level3', 0, 6, 1], ['scoring.comboWindow', 0.2, 4, 0.1], ['scoring.comboStep', 0, 2, 0.1], ['scoring.comboMax', 1, 6, 0.5],
  ];
  if (ABIL4) { // Edit 80: P6.10 drops the sliders it does not use (the throw, the hitch and sling, the cone link, the old tree, level 4)
    const gone = new Set(['input.throwHoldSeconds', 'abilities.arms.hitchReach', 'abilities.arms.hitchSeconds', 'abilities.arms.hitchMinSpeed', 'abilities.arms.slingScale', 'abilities.arms.slingDash', 'abilities.arms.hitchEdge',
      'scoring.coneLink', 'scoring.coneHitPoints', 'upgrades.ricochetScale', 'upgrades.throwDistance', 'upgrades.spineLimit', 'upgrades.hipsTurnRate', 'upgrades.bigCapacity', 'abilities.battery.rechargeCut', 'abilities.arms.conesPerLevel', 'abilities.throw.distanceStep', 'economy.price.ability.level4']);
    for (let i = TUNE.length - 1; i >= 0; i--) if (gone.has(TUNE[i][0])) TUNE.splice(i, 1);
  }
  if (STORY) { // Edit 81–82: the story (from the next deploy): a credit a body, its prices, the gift, the brief's combos, each tile's write-offs
    TUNE.push(['proto.bounce.maxThrow', 0, 200, 4], ['story.ferryDepth', 40, 400, 10], ['economy.creditsPerWriteOff', 0, 3, 1], ['story.missFloor', 0, 50, 1], ['damage.bodyHealthOnFoot', 100, 2000, 50], ['abilities.battery.dashCharges', 1, 3, 1], ['ui.gift.fallSeconds', 0.1, 3, 0.05], ['ui.gift.holdSeconds', 0, 5, 0.1], ['ui.finale.unveilSeconds', 0.1, 5, 0.1], ['story.task.comboEasy', 2, 5, 1], ['story.task.comboHard', 2, 6, 1]);
    for (const d of STORY.DIST) for (const t of d.order) TUNE.push(['story.writeOffs.' + d.id + '.' + t, 1, 6, 1]);
    for (const d of STORY.DIST) for (const t of d.order) TUNE.push(['story.traffic.' + d.id + '.' + t, 0.5, 3, 0.25]); // Edit 85: each tile's traffic
  }
  for (const id of Object.keys(CPARAM)) { const v = CPARAM[id]; TUNE.push([id, 0, Math.max(1, Math.ceil(v * 3)), v >= 10 ? 1 : 0.01]); } // generated presentation IDs
  const tuneEl = document.getElementById('tune'), grid = document.getElementById('tune-grid');
  function current(id) {
    if (app.tune[id] != null) return app.tune[id];
    if (app.sim && app.sim.P[id] != null) return app.sim.P[id];
    return CPARAM[id] != null ? CPARAM[id] : REG[id] != null ? REG[id] : PROTO[id];
  }
  function setParam(id, v) {
    app.tune[id] = v;
    if (app.sim) { app.sim.P[id] = v; app.tuned = true; if (id === 'proto.health.' + DIFFICULTIES[Math.round(app.sim.P['proto.difficulty'])].key) app.sim.P['damage.bodyHealth'] = v; }
    syncTune();
  }
  function buildTune() {
    grid.innerHTML = '';
    for (const [id, mn, mx, st] of TUNE) {
      const row = document.createElement('label'); row.className = 'trow';
      const inp = document.createElement('input'); inp.type = 'range'; inp.min = mn; inp.max = mx; inp.step = st; inp.id = 't-' + id.replace(/\./g, '-');
      const out = document.createElement('output'); const nm = document.createElement('span'); nm.className = 'pid'; nm.textContent = id;
      inp.addEventListener('input', () => setParam(id, parseFloat(inp.value)));
      row.append(nm, out, inp); grid.append(row);
    }
    for (const [id, text] of [['proto.damageModel', 'Newtonian impulse damage and recoil (off = V29 formula)'], ['proto.pathsEverywhere', 'Show committed car paths outside the view cone'], ['proto.zonesEverywhere', 'Show car scanners outside the view cone'], ['proto.learningEnabled', 'Cars learn from player hits'], ['proto.stopCue', 'Show each car\'s stop bracket'], ['proto.city', 'City blocks and jersey barriers are solid (next road or restart)'], ['proto.parts.effects', 'Damaged parts cut abilities (legs speed, torso turn, head view, arms throw)'], ['proto.district', '3 × 3 screens per road, Zelda-style (next road or restart)']]) {
      const row = document.createElement('label'); row.className = 'tcheck';
      const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = 't-' + id.replace(/\./g, '-');
      inp.addEventListener('change', () => setParam(id, inp.checked ? 1 : 0));
      const sp = document.createElement('span'); sp.innerHTML = text + ' <code>' + id + '</code>';
      row.append(inp, sp); grid.append(row);
    }
    if (FOUR) { // Edit 75: install modules for a test run (marks the run as tuned); outline what a jump clears; set up a gamepad
      const head = document.createElement('p'); head.className = 'note'; head.style.gridColumn = '1 / -1'; head.textContent = ABIL ? 'Test run: install ability levels now (the run is marked tuned). A Battery, B Legs (jump), X Arms (grab), Y Throw. Each level cuts wear by abilities.wearCut.' : 'Test run: install modules now (the run is marked tuned). Start = DASH (A). Then JUMP (B), GRAB (X), THROW (Y).'; grid.append(head);
      for (const n of ABIL ? Object.keys(NODES7) : [].concat(...SHOP_GRID)) {
        const row = document.createElement('label'); row.className = 'tcheck';
        const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = 't-own-' + n; inp.dataset.node = n;
        inp.addEventListener('change', () => {
          const sm = app.sim; if (!sm) { inp.checked = false; toast('Start a district first'); return; }
          const nd = ABIL && NODES7[n];
          if (nd) { for (let L = 1; L <= 4; L++) { if (!NODES7[nd.track + L]) continue; const k = nd.track + L; if (inp.checked ? L <= nd.level : L >= nd.level) { if (inp.checked) sm.run.owned[k] = true; else delete sm.run.owned[k]; } const el = document.getElementById('t-own-' + k); if (el) el.checked = !!sm.run.owned[k]; } } // Edit 77: a level brings the levels below it
          else if (inp.checked) sm.run.owned[n] = true; else delete sm.run.owned[n];
          app.tuned = true; sm.emit('debug-module', { node: n, on: inp.checked });
        });
        const sp = document.createElement('span'); sp.innerHTML = 'Install <b>' + NODE(n).name + '</b> <code>' + n + '</code>';
        row.append(inp, sp); grid.append(row);
      }
      const row = document.createElement('label'); row.className = 'tcheck';
      const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = 't-show-jumpable';
      inp.addEventListener('change', () => { app.showJumpable = inp.checked; });
      const sp = document.createElement('span'); sp.innerHTML = 'Outline what a jump clears (tagged jumpable) <code>world.jumpableHeight</code>';
      row.append(inp, sp); grid.append(row);
    }
    { // display only: dress the chassis doll in every module of the tree (not a parameter; the run is untouched)
      const row = document.createElement('label'); row.className = 'tcheck';
      const inp = document.createElement('input'); inp.type = 'checkbox'; inp.id = 't-preview-mods'; inp.checked = !!app.previewMods;
      inp.addEventListener('change', () => { app.previewMods = inp.checked; });
      const sp = document.createElement('span'); sp.textContent = 'Preview all 15 modules on the chassis doll (display only)';
      row.append(inp, sp); grid.append(row);
    }
    syncTune();
  }
  function syncTune() {
    for (const [id] of TUNE) {
      const inp = document.getElementById('t-' + id.replace(/\./g, '-')); if (!inp) continue;
      const v = current(id); if (document.activeElement !== inp) inp.value = v;
      inp.nextSibling; inp.parentNode.querySelector('output').textContent = (+v).toFixed(v % 1 ? 2 : 0) + (REG[id] != null && v !== REG[id] ? '  (registry ' + REG[id] + ')' : '');
    }
    for (const id of ['proto.damageModel', 'proto.pathsEverywhere', 'proto.zonesEverywhere', 'proto.learningEnabled', 'proto.stopCue', 'proto.city', 'proto.parts.effects', 'proto.district']) { const inp = document.getElementById('t-' + id.replace(/\./g, '-')); if (inp) inp.checked = !!current(id); }
    for (const inp of grid.querySelectorAll('input[data-node]')) inp.checked = !!(app.sim && app.sim.has(inp.dataset.node));
  }
  function toggleTune() { tuneEl.open = !tuneEl.open; if (tuneEl.open) { syncTune(); tuneEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } }
  document.getElementById('btn-tune').addEventListener('click', toggleTune);
  document.getElementById('t-credit').addEventListener('click', () => { if (app.sim) { app.sim.run.credits++; app.tuned = true; app.sim.emit('debug-credit', {}); toast('Debug credit granted'); } });
  document.getElementById('t-reset').addEventListener('click', () => { app.tune = {}; if (app.sim) { for (const k of Object.keys(REG)) app.sim.P[k] = REG[k]; for (const k of Object.keys(PROTO)) app.sim.P[k] = PROTO[k]; Object.assign(app.sim.P, OVERRIDES, W6 && W6.P6SIM ? W6.P6SIM : {}); } syncTune(); }); // Edit 75: P6's own values too
  { const bp = document.getElementById('t-pad'); if (bp) bp.addEventListener('click', () => { app.padCmd = 'setup'; cv.focus(); }); }
  const sndBtn = document.getElementById('btn-sound');
  sndBtn.addEventListener('click', () => { app.sound = !app.sound; sndBtn.textContent = app.sound ? 'Sound on' : 'Sound off'; sndBtn.setAttribute('aria-pressed', String(app.sound)); Snd.init(); });
  buildTune();

  // ---------- trace modal
  const traceEl = document.getElementById('trace'), traceTxt = document.getElementById('trace-text');
  function showTrace() {
    if (!app.sim) return;
    traceTxt.value = JSON.stringify(Object.assign({}, app.sim.trace(), { presentation: app.present || [] }), null, 1);
    traceEl.hidden = false; traceTxt.focus(); traceTxt.select();
  }
  document.getElementById('trace-close').addEventListener('click', () => { traceEl.hidden = true; cv.focus(); });
  document.getElementById('trace-copy').addEventListener('click', () => {
    const btn = document.getElementById('trace-copy');
    const done = (ok) => { btn.textContent = ok ? 'Copied' : 'Select and copy manually'; setTimeout(() => { btn.textContent = 'Copy trace'; }, 1600); };
    try { navigator.clipboard.writeText(traceTxt.value).then(() => done(true), () => { traceTxt.select(); done(false); }); }
    catch (e) { traceTxt.select(); done(false); }
  });

  const statusEl = document.getElementById('status');
  function appStatus() { return BUILD + ' · ' + (app.tuned ? 'TUNED RUN' : 'registry values'); } // Edit 86: the build line in the pause menu
  // ---------- loop
  let last = performance.now(), acc = 0;
  function frame(now) {
    const dt = clamp((now - last) / 1000, 0, 0.1); last = now; app.realT += dt; // rAF can stamp the first frame before load time
    pollPad(dt);
    handleMenus();
    if (app.screen === 'loading' && app.loading && app.loading.frames++ >= 2) { const ld = app.loading; app.loading = null; const rs = (app.roads || []).slice(); startLevelNow(ld.i, ld.carry); if (ld.carry) app.roads = rs; }
    const s = app.sim;
    if (app.screen === 'game' && s && !app.paused && traceEl.hidden) {
      acc += dt;
      while (acc >= 1 / 60) { s.step(s.phase === 'play' ? buildCmd() : {}); acc -= 1 / 60; }
      if (s.phase === 'next' && app.mode === 'story') { saveStory(); startLevel(LEVEL_LIST.indexOf(app.story.district)); } // Edit 81: the next district of the story
      else if (s.phase === 'next') { const rs = (app.roads || []).concat([s.trace()]); startLevel(app.level + 1, s.carryOut()); app.roads = rs; }
      if (app.screen === 'loading') { acc = 0; }
    } else acc = 0;
    processEvents();
    render();
    const pi = pad.info, padTxt = pad.blocked ? 'gamepads blocked on this page: open the downloaded file' : pi && pi.id ? 'pad: ' + pi.id.slice(0, 40) + (pi.mapping === 'standard' ? '' : ' (no standard mapping: hold START or G to set up)') : 'pad: none seen — press any button on it';
    const st = BUILD + ' · ' + SW + ' × ' + SH + ' ×' + kpx.toFixed(2) + ' · ' + (app.tuned ? 'TUNED RUN · UNRANKED' : 'registry values') + ' · ' + padTxt; app.statusLine = st;
    if (statusEl && statusEl.textContent !== st) statusEl.textContent = st;
    const mon = document.getElementById('padmon'), mt = pi && pi.monitor ? pi.monitor : '';
    if (mon && mon.textContent !== mt) mon.textContent = mt;
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {});
  requestAnimationFrame(frame);
  window.__dummies = app;
  window.__dummiesScale = () => ({ kpx, scale, ox, oy, width: cv.width, height: cv.height });
  window.__dummiesInput = { faceWords: () => Object.fromEntries(FACE.map((f) => [f[0], faceWord({ id: f[0], w: f[4] }, app.sim).word])), TOUCH, pad, touchLayout, touchLayoutCss, FOUR, touchEditStart, touchEditEnd, touchEditSize, editBar, saveTouchCfg }; // Edit 75–76: for the tests
  window.__dummiesUI = { carLook: () => (app.sim ? carsOf(app.sim).filter((c) => !c.ghost).map((c) => ({ id: c.id, noticed: noticed(app.sim, c), flash: flashOn(app.sim, c), spent: !!c.spent, grey: !!(c.spent && app.sim.P['proto.art.spentGrey']), brk: !!c._brk, state: c.state, v: +c.v.toFixed(1) })) : []), // Edit 99 (P8.4)
    titleItems, pauseItems, credits: () => !!app.credits, scores: () => hsRead(), scoreTables: () => hsTables().map((t) => t.key), hsLast: () => app.hsLast, saves: () => allSlots().map((v, i) => v && { n: i + 1, name: v.name, saved: v.saved, stamp: stamp(v.saved), lines: slotLines(v), progress: JSON.parse(JSON.stringify(v.progress)) }), hits: () => HITS.map((q2) => ({ x: q2.x, y: q2.y, w: q2.w, h: q2.h, tag: q2.tag })), slotActs, // Edit 88. Edit 97 (P8.2): scores, scoreTables, hsLast. Edit 98 (P8.3): saves, hits and slotActs restored (8.2 had commented them out)
    controlItems: () => controlItems(), hud: () => app.hud && JSON.parse(JSON.stringify(Object.assign({ field: { x: FX - 6, y: FY - 6, w: FW + 12, h: FH + 12 } }, app.hud))), objective, optionItems, controlRows: () => app.sim && controlRows(app.sim), deviceOf, giftReady, gift: () => fx.gift && { node: fx.gift.node, age: app.realT - fx.gift.t0 }, pinGift: (a) => { if (fx.gift) fx.gift.pin = a; } }; // Edit 83–84: for the tests
})();
