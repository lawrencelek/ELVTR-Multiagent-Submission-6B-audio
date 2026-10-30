// P6 world (GDD Edit 62): the three districts of the game (1 Parkland, 2 Waterfront, 3 Monument), built from the P5
// district mock-up (Edits 51–57) and the Waterfront valley plan (Edits 58–61). Each district is 3 × 3 screens of 800 × 640
// in district coordinates. Per screen: game art (ground buffer, depth-sorted props, lifted layers), linked traffic (one or
// more sims per screen, one per level plane), and play data (solids, floors, stairs, water, spawns) for the player sim.
// Rule (Edit 51.2): every highway screen has two escalators, on opposite sides, at opposite ends. No trees, no flower beds:
// brutalist planters, monoliths and public sculptures (Edit 51.3). Node-loadable for tests (art is plain buffers).
(function (root) {
  'use strict';
  const NODE = typeof module !== 'undefined' && module.exports;
  const X = root.DUMMIES || require('./sim.js');
  const PIX = root.PIX || (require('./pixel.js'), root.PIX);
  const L = root.TURNLAB || require('./lab.js');
  const V = root.CIRCUS_VALLEY || require('./circus_valley.js'); // the Waterfront plan (Edits 58–61): one source of truth for its layout
  const P = Object.assign({}, X.REG, X.PROTO, X.OVERRIDES), U = PIX.U, K = PIX.K, AW = PIX.AW, AH = PIX.AH;
  // P6's registry values over the shared sim's (which keeps P2–6.2's). Edit 71: the cone drone; the ring lane change; the ring
  // entry gap; turn signals.
  // Edit 72: every vehicle vehicles.scale (0.9) of its class's size in all three dimensions.
  // Edit 75 (Prototype 6.5): DIRECT turning; A dash, B jump, X grab, Y throw; combo scoring.
  const P6SIM = { 'proto.droneConeSeconds': 5, 'traffic.ringLaneChange': 150, 'traffic.ringEntryGap': 2.0, 'traffic.signalDistance': 140, 'vehicles.scale': X.OVERRIDES['vehicles.scale'] != null ? X.OVERRIDES['vehicles.scale'] : 0.9,
    'proto.turnModel': 2, 'proto.input.fourButtons': 1, 'proto.combo': 1,
    'proto.abilities': 1, 'proto.jump.runToClear': 1, // Edit 77 (Prototype 6.7): ability tracks by level; run to clear
    'proto.bounce.newton': 1, 'proto.recoilScale': 1, // Edit 78 (Prototype 6.8): the bounce off a car is Newtonian: full post-impact velocity, then a slide
    'proto.abilities': 2, 'abilities.maxLevel': 3, 'abilities.wearCut': 0.25, 'battery.secondsPerCharge': 1, // Edit 79 (Prototype 6.9): Battery, Legs, Arms; three levels
    'scoring.comboVariety': 0.5, 'scoring.comboAirPause': 1, 'scoring.coneLink': 1, 'scoring.comboMax': 5, // Edit 79: combos
    'proto.abilities': 3, 'input.dropHoldSeconds': 0.3 }; // Edit 80 (Prototype 6.10): Battery, Legs, Hands (two levels), Arms (the push); hold X to put a cone down
  for (const k of Object.keys(P)) if (/^vehicles\.[a-z]+\.(length|width|height)$/.test(k)) P6SIM[k] = Math.round(P[k] * P6SIM['vehicles.scale'] * 10) / 10;
  Object.assign(P, P6SIM);
  const W = P['world.width'], H = P['world.height'], LW = P['world.laneWidth'], OUTER = LW + P['proto.shoulderWidth'], HALF = P['world.deckWidth'] / 2, PW = P['world.parapetWidth'];
  const EXT = (h) => Math.round(h * P['proto.art.extrusion'] / U), C = P['world.deckColumn'], c32 = PIX.c32, mixK = PIX.mixK, LEDS = PIX.KX('bldgLed') || [K.lane], hyp = (a, b) => Math.sqrt(a * a + b * b); // P6: Math.hypot is slow
  const N = { grass: c32('#0E1712'), grass2: c32('#13211A'), grass3: c32('#1C3024'), water: c32('#08101E'), water2: c32('#13234A'), pave: c32('#2C3243'), pave2: c32('#384056'),
    magenta: c32('#FF5FD2'), cyan: c32('#3FD0FF'), stone: c32('#C9D3DA'), stoneD: c32('#8C98A6'), stoneL: c32('#EEF2F4'), tile: c32('#262C3C'), tile2: c32('#30374B') };
  const CON = { m: c32('#4A5160'), d: c32('#363C49'), l: c32('#7D8799'), x: c32('#22262F'), g: c32('#1F3A27'), g2: c32('#2A4A32'), t: c32('#3B4250'), t2: c32('#444B5A') }; // board-marked concrete
  const ISL = c32('#5F6878'); // the monument's island paving
  const Z1 = EXT(P['world.deckHeight']), Z2 = EXT(P['world.highHeight']), SWD = P['world.stairWidth'], INSET = P['world.deckEscalatorInset'];
  const APRON = P['world.stairApron'], SEM = P['world.stairEdgeMargin']; // P6.3 (Edit 65)
  const FORE = P['world.stairForecourt'], foreOf = (st) => { const a = apronOf(st), d = Math.sign(st.high - st.low); return st.axis === 'y' ? [a.x, d < 0 ? a.y + a.h : a.y - FORE, a.w, FORE] : [d < 0 ? a.x + a.w : a.x - FORE, a.y, FORE, a.h]; }; // 6.2 (Edit 70): a flight's forecourt, beyond its apron: nothing stands in it
  const apronOf = (st) => { const dir = Math.sign(st.high - st.low); return st.axis === 'y' ? { x: st.x - 8, y: dir < 0 ? st.low : st.low - APRON, w: st.w + 16, h: APRON } : { x: dir < 0 ? st.low : st.low - APRON, y: st.y - 8, w: APRON, h: st.h + 16 }; }; // clear ground beyond a flight's foot
  // P6: solids captured while a screen is built. Every mass, pool and sculpture drawn into the ground records its footprint
  // (16-unit cells, merged into row runs) as a level-0 solid of the screen being built.
  let TRAFFIC = null; // Edit 99 (P8.4): the drivers' values a player sim passes to every screen's traffic (TRAFFIC_KEYS); null: as before
  const TRAFFIC_KEYS = ['proto.droneConeSeconds', 'proto.driver.coneSteepPass'];
  let ACCESS = null; // Edit 85 (P7.4): { dropGaps, flightsMin, coneVisible } for a P7 world (world.deckDropGaps, world.deckFlightsMin, props.cone.minVisible); null: 6.x. Edit 91: monument (world.dummyMonument)
  let CAP = null, CAPH = null; // CAPH: the drawn top (art px) of the mass being captured (Edit 75: the jumpable tag)
  function capture(fp, x0, y0, x1, y1, world) { // fp in art px (or world units when world), the box in the same units
    if (!CAP) return;
    const s = world ? 1 : U, step = 4 / s, out = CAP; // P6.3 (Edit 65): 4-unit cells, so a solid follows its drawn plan
    for (let y = y0; y <= y1; y += step) {
      let run = null;
      for (let x = x0; x <= x1 + 1e-9; x += step) {
        const cx = x + step / 2, cy = y + step / 2, on = fp(cx, cy);
        if (on && !run) run = { x: x * s, y: y * s, w: 0, h: 4 };
        if (on) run.w = x * s + 4 - run.x;
        if ((!on || x + step > x1) && run) { out.push({ x: run.x, y: run.y, w: run.w, h: run.h, kind: 'mass', ht: CAPH }); run = null; }
      }
    }
  }
  const captureRect = (x, y, w, h, kind) => { if (CAP) CAP.push({ x, y, w, h, kind: kind || 'block' }); };
  // ---------- small helpers
  function each(fn) { for (let y = 0; y < AH; y++) for (let x = 0; x < AW; x++) fn(x, y, (x + 0.5) * U, (y + 0.5) * U, y * AW + x); }
  function walk(pts, step, fn) { let acc = step / 2; for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = hyp(x1 - x0, y1 - y0); if (l < 1e-6) continue; while (acc <= l) { const t = acc / l; fn(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (x1 - x0) / l, (y1 - y0) / l); acc += step; } acc -= l; } }
  function clipRun(pts, x0, y0, x1, y1) { // the polyline's longest run inside a box, cut at its edges (Liang–Barsky per segment)
    const runs = []; let cur = null;
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], dx = pts[i][0] - ax, dy = pts[i][1] - ay; let t0 = 0, t1 = 1, ok = true;
      for (const [pp, qq] of [[-dx, ax - x0], [dx, x1 - ax], [-dy, ay - y0], [dy, y1 - ay]]) {
        if (pp === 0) { if (qq < 0) ok = false; continue; }
        const r = qq / pp; if (pp < 0) t0 = Math.max(t0, r); else t1 = Math.min(t1, r);
      }
      if (!ok || t0 > t1) { cur = null; continue; }
      const A = [ax + dx * t0, ay + dy * t0], Bp = [ax + dx * t1, ay + dy * t1];
      if (!cur || t0 > 0) { cur = [A]; runs.push(cur); }
      cur.push(Bp); if (t1 < 1) cur = null;
    }
    const onScreen = (r) => { let s = 0; for (let i = 1; i < r.length; i++) for (let k = 0; k < 16; k++) { const f = (k + 0.5) / 16, mx = r[i - 1][0] + (r[i][0] - r[i - 1][0]) * f, my = r[i - 1][1] + (r[i][1] - r[i - 1][1]) * f; if (mx >= 0 && mx <= W && my >= 0 && my <= H) s += hyp(r[i][0] - r[i - 1][0], r[i][1] - r[i - 1][1]) / 16; } return s; }; // Edit 56: sampled, so a short run ending inside the screen counts
    return runs.filter((r) => r.length > 1 && onScreen(r) > 0).sort((a, b) => onScreen(b) - onScreen(a))[0] || null;
  }
  const shift = (pts, dx, dy) => pts.map(([x, y]) => [x + dx, y + dy]);
  const chamf = (x0, y0, x1, y1, k) => (x, y, ins) => { ins = ins || 0; const c = k + ins * 0.6; return x >= x0 + ins && x <= x1 - ins && y >= y0 + ins && y <= y1 - ins && x - x0 + y - y0 >= c && x1 - x + y - y0 >= c && x - x0 + y1 - y >= c && x1 - x + y1 - y >= c; };
  function lawn(B, x, y) { B.put(x, y, ((x * 7 + y * 13) % 29 === 0) ? N.grass3 : (Math.floor((x + y) / 6) % 2 ? N.grass : N.grass2)); }
  function pathLine(B, ok, x0, y0, x1, y1, w) {
    const dx = x1 - x0, dy = y1 - y0, l = hyp(dx, dy);
    each((x, y, wx, wy) => { if (!ok(wx, wy)) return; const t = Math.max(0, Math.min(1, ((wx - x0) * dx + (wy - y0) * dy) / (l * l))), d = hyp(wx - x0 - dx * t, wy - y0 - dy * t); if (d < w / 2) B.put(x, y, d > w / 2 - 2 ? CON.d : (x + y) % 8 === 0 ? CON.t2 : CON.t); });
  }
  function tiles(B, ok, lattice) { // concrete paving on a 16 grid; an LED lattice at 45° where asked
    each((x, y, wx, wy) => { if (!ok(wx, wy)) return; let c = (x % 8 === 0 || y % 8 === 0) ? N.tile2 : N.tile; if (lattice && ((x + y) % 24 === 0 || ((x - y) % 24 + 24) % 24 === 0)) c = (x + y) % 48 === 0 ? mixK(N.tile, N.cyan, 0.5) : mixK(N.tile, N.magenta, 0.4); B.put(x, y, c); });
  }
  function pool(B, ok, x0, y0, x1, y1, k) { // a reflecting pool: 90° sides, 45° corners, concrete coping and a shadowed inner wall
    captureRect(x0, y0, x1 - x0, y1 - y0, 'pool');
    const inR = chamf(x0, y0, x1, y1, k);
    each((x, y, wx, wy) => {
      if (!ok(wx, wy) || !inR(wx, wy, -6)) return;
      if (!inR(wx, wy, 0)) B.put(x, y, CON.l);
      else if (!inR(wx, wy, 4)) B.put(x, y, wy < y0 + 8 ? CON.x : CON.d); // inner wall, the north one in shade
      else { let c = N.water; if (y % 4 === 0 && ((x * 5 + y) % 11) < 4) c = N.water2; if ((x * 3 + y * 7) % 97 === 0) c = LEDS[(x + y) % LEDS.length]; B.put(x, y, c); }
    });
  }
  // ---------- brutalist pieces (art px): a concrete mass with board marks, LED under the coping, hard shadow down-left
  const HG = { x: c32('#0D1F15'), d: c32('#16301F'), m: c32('#1E3F29'), l: c32('#2A5536'), lime: c32('#7CC24A') }, REED = [c32('#2C6B3C'), c32('#3E8A4A'), c32('#9BD86A'), c32('#3FD0A8')];
  const SOIL = c32('#1B1E17'), MOSS = [c32('#10241A'), c32('#173222'), c32('#1F3D29'), c32('#7CC24A')];
  const hsh = (x, y) => Math.imul((x * 73856093) ^ (y * 19349663), 2654435761) >>> 0;
  const hedgeC = (x, y) => { const n = hsh(x >> 1, y >> 1) % 9; return n < 3 ? HG.d : n < 6 ? HG.m : n < 8 ? HG.l : (hsh(x, y) % 5 ? HG.l : HG.lime); };
  const lawnC = (x, y) => ((x * 7 + y * 13) % 29 === 0) ? N.grass3 : (Math.floor((x + y) / 6) % 2 ? N.grass : N.grass2);
  const TURF = [c32('#1D3826'), c32('#22412C'), c32('#3A6E40')]; // P6.4 (Edit 66): Parkland's cyber turf: mown stripes, a grid of LED studs
  const turfC = (x, y) => (x % 12 === 6 && y % 12 === 6 ? ((x / 12 + y / 12) % 2 < 1 ? mixK(TURF[1], N.cyan, 0.75) : mixK(TURF[1], N.magenta, 0.65)) : hsh(x, y) % 41 === 0 ? TURF[2] : TURF[Math.floor(y / 6) % 2]);
  const mossC = (x, y) => hsh(x, y) % 31 === 0 ? MOSS[3] : MOSS[hsh(x >> 1, y >> 1) % 3];
  function mass(B, fp, x0, y0, x1, y1, base, h, top, led, shadow, faceKind) { // fp(x, y, ins): the footprint in art px within [x0..x1]×[y0..y1]
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    CAPH = base + h; capture((x, y) => fp(Math.floor(x), Math.floor(y)), x0, y0, x1, y1); CAPH = null; // P6: the mass is solid at Z0 (Edit 75: with its drawn top)
    if (shadow) {
      const M = new Uint8Array(AW * AH);
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (fp(x, y)) for (let t = 1; t <= base + h; t++) { const sx = Math.round(x - t * 0.7), sy = Math.round(y + t * 0.7); if (sx >= 0 && sy >= 0 && sx < AW && sy < AH && !fp(sx, sy)) M[sy * AW + sx] = 1; }
      for (let q = 0; q < M.length; q++) if (M[q]) B.shade(q % AW, Math.floor(q / AW), 0.68);
    }
    const mid = (x0 + x1) / 2;
    for (let x = x0; x <= x1; x++) {
      let yb = -1; for (let y = y1; y >= y0; y--) if (fp(x, y)) { yb = y; break; }
      if (yb < 0) continue;
      const slant = yb < y1, face = slant ? (x < mid ? CON.d : CON.l) : (x % 4 === 0 ? CON.d : CON.m);
      for (let t = 0; t < h; t++) B.put(x, yb - base - t, faceKind === 'hedge' && t >= 2 ? (t === h - 1 ? HG.m : x % 3 === 0 ? HG.x : HG.d) : t === 0 && base === 0 ? CON.x : t === h - 1 && led ? led : face);
    }
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      if (!fp(x, y)) continue;
      let c;
      if (top === 'hedge') c = !fp(x, y, 1) ? HG.x : hedgeC(x, y);
      else if (!fp(x, y, 1)) c = CON.l;
      else if (top === 'reeds') c = led && hsh(x, y) % 61 === 0 ? led : SOIL;
      else if (top === 'grass') c = fp(x, y, 2) ? ((x * 3 + y * 5) % 7 ? CON.g : CON.g2) : CON.m;
      else c = !fp(x, y, 2) ? CON.m : ((x - x0) % 6 === 0 || (y - y0) % 6 === 0) ? CON.d : CON.m;
      B.put(x, y - base - h, c);
    }
    if (top === 'reeds') for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { // grasses in clumps, tips lit
      if (!fp(x, y, 1) || hsh(x, y) % 6) continue;
      const len = 3 + hsh(y, x) % 4, q = hsh(x + 3, y); for (let j = 0; j < len; j++) B.put(x, y - base - h - 1 - j, j === len - 1 ? (q % 5 === 0 ? REED[2] : q % 11 === 0 ? REED[3] : REED[1]) : REED[0]);
    }
  }
  function block(B, x0, y0, x1, y1, k, base, h, top, led, shadow) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); mass(B, chamf(x0, y0, x1, y1, k), x0, y0, x1, y1, base, h, top, led, shadow); }
  // ---------- garden kit (Edit 51.3): running-bond paving, light lines on the path centres, a grid of beds at 90° and 45°
  const GW = P['world.gardenCellWidth'], GH = P['world.gardenCellHeight'], GP = P['world.gardenPath'];
  const paveC = (x, y) => { const i = Math.floor(x / 12), j = Math.floor(y / 12); if (x % 12 === 0 || y % 12 === 0) return CON.d; if ((x % 12 === 6 && y % 12 === 6) && hsh(i, j) % 5 === 0) return N.cyan; return hsh(i, j) % 6 === 0 ? CON.t2 : CON.t; }; // large square slabs, an LED stud at some centres
  const slabC = (x, y, vert) => { const a = vert ? y : x, b = vert ? x : y, row = b >> 2, aa = a + (row & 1) * 8; if ((b & 3) === 0 || (aa & 15) === 0) return CON.d; return hsh(aa >> 4, row) % 7 === 0 ? CON.t2 : CON.t; }; // long slabs along a path
  const diagC = (x, y) => { const u = x + y, v = x - y + 1200; if (u % 6 === 0 || v % 12 === 0) return CON.d; return hsh(Math.floor(u / 6), Math.floor(v / 12)) % 5 === 0 ? CON.t2 : CON.m; };
  // Prototype 6.2 (Edit 70): the garden grid's own edges. EDGE: the cell inset from each screen edge (a seam path runs whole
  // inside the screen, world.gardenPath wide; at the district's bound it runs inside the wall). DIAG(wx, wy): the distance to
  // a 45° Z0 road's centre line; along it a verge and a footpath run parallel, and the grid starts behind them.
  let EDGE = null, DIAG = null, PARKGRID = null; // PARKGRID: the screen's path lines while a Parkland screen is built (deck and walkway columns keep off the paths)
  const onPath = (x, y, m) => !!PARKGRID && (PARKGRID.xs.some((v) => Math.abs(v - x) < GP / 2 + m) || PARKGRID.ys.some((v) => Math.abs(v - y) < GP / 2 + m));
  const DV = P['world.gardenVerge'], SETBACK = () => OUTER + DV + GP; // verge, then a footpath as wide as a garden path
  const pathMX = (wx) => { const gx = ((wx % GW) + GW) % GW; let m = Math.min(gx, GW - gx); if (EDGE) { const a = EDGE.W - GP / 2, b = W - EDGE.E + GP / 2; m = wx < a || wx > b ? 0 : Math.min(m, Math.abs(wx - a), Math.abs(wx - b)); } return m; };
  const pathMY = (wy) => { const gy = ((wy % GH) + GH) % GH; let m = Math.min(gy, GH - gy); if (EDGE) { const a = EDGE.N - GP / 2, b = H - EDGE.S + GP / 2; m = wy < a || wy > b ? 0 : Math.min(m, Math.abs(wy - a), Math.abs(wy - b)); } return m; };
  function gardenPave(B, ok, diag, turf, verge) { // P6.4: turf in the cells where asked; P6.6: a grass verge this wide along every path
    const line = mixK(CON.t, N.cyan, 0.5), line2 = mixK(CON.t, N.magenta, 0.45);
    each((x, y, wx, wy) => {
      if (!ok(wx, wy)) return;
      const ad = DIAG ? DIAG(wx, wy) : 1e9;
      if (ad < OUTER + DV) { B.put(x, y, TURF[(x + y) % 5 ? 0 : 1]); return; } // 6.2: the verge along a 45° road
      if (ad < SETBACK()) { B.put(x, y, ad > SETBACK() - 2 ? CON.d : diagC(x, y)); return; } // 6.2: its footpath
      const onD = diag && Math.abs(wx + wy - diag.c) < diag.w / 2;
      const gx = ((wx % GW) + GW) % GW, gy = ((wy % GH) + GH) % GH, mx = pathMX(wx), my = pathMY(wy), pw = GP / 2 + 4;
      let c = onD ? diagC(x, y) : mx < pw && my < pw ? diagC(x, y) : my < pw ? slabC(x, y, 0) : mx < pw ? slabC(x, y, 1) : turf ? turfC(x, y) : (verge && (mx < pw + verge || my < pw + verge) && !(mx < pw + verge && my < pw + verge)) ? TURF[(x + y) % 5 ? 0 : 1] : paveC(x, y); // P6.6: grass verges frame the paths
      const on1 = (v, L) => v - L >= 0 && v - L < U, lxs = EDGE ? [EDGE.W - GP / 2, W - EDGE.E + GP / 2] : [], lys = EDGE ? [EDGE.N - GP / 2, H - EDGE.S + GP / 2] : [];
      if (!onD && (((gx < U && wx > U) || lxs.some((L) => on1(wx, L))) && wy % 32 < 24 || ((gy < U && wy > U) || lys.some((L) => on1(wy, L))) && wx % 32 < 24)) c = (Math.floor(wx / GW) + Math.floor(wy / GH)) % 2 ? line : line2; // light lines on the path centres (6.2: the seam paths' too)
      B.put(x, y, c);
    });
  }
  function drawBed(B, type, fpA, fpW, ax0, ay0, ax1, ay1, w0, led) {
    const [x0, y0, x1, y1] = w0;
    if (type === 'lawn' || type === 'moss') { for (let y = ay0; y <= ay1; y++) for (let x = ax0; x <= ax1; x++) if (fpA(x, y)) B.put(x, y, !fpA(x, y, 1) ? CON.l : type === 'lawn' ? lawnC(x, y) : mossC(x, y)); return; }
    if (type === 'hedge') { mass(B, fpA, ax0, ay0, ax1, ay1, 0, 5, 'hedge', null, true, 'hedge'); return; }
    if (type === 'reeds') { mass(B, fpA, ax0, ay0, ax1, ay1, 0, 3, 'reeds', led, true); return; }
    if (type === 'terrace') { mass(B, fpA, ax0, ay0, ax1, ay1, 0, 2, 'conc', null, true); mass(B, (x, y, i) => fpA(x, y, (i || 0) + 4), ax0, ay0, ax1, ay1, 2, 2, 'grass', led, false); mass(B, (x, y, i) => fpA(x, y, (i || 0) + 10), ax0, ay0, ax1, ay1, 4, 3, 'hedge', null, false, 'hedge'); return; }
    if (type === 'pool') { pool(B, () => true, x0, y0, x1, y1, 24); return; }
    tiles(B, (wx, wy) => fpW(wx, wy), true); monolith(B, (x0 + x1) / 2 / U, (y0 + y1) / 2 / U + 2, 0, 22, led); // plaza
  }
  // Edit 55: planting in three sizes. Large: a great lawn over the largest free block of cells, at least
  // world.gardenLargeCells square and at most one cell more each way; inner paths go. Medium: one-cell beds only where they
  // frame the lawn or the tile's set piece, in at most world.gardenBedTypes types. Small: planters world.gardenPlanter across,
  // two to each open square and one at each corner of the lawn. Returns the path crossings left free (for sculptures).
  const GLC = P['world.gardenLargeCells'], GBT = P['world.gardenBedTypes'], GPL = P['world.gardenPlanter'];
  const MED = [['hedge', 'reeds'], ['terrace', 'hedge'], ['reeds', 'moss'], ['hedge', 'terrace']];
  const GREAT = [c32('#23432C'), c32('#2A5034'), c32('#5E9E4A')], greatC = (x, y) => (hsh(x, y) % 47 === 0 ? GREAT[2] : GREAT[Math.floor(x / 8) % 2]);
  function smallPlanter(B, wx, wy) { // a concrete box with a clipped hedge top
    const a = GPL / U / 2, b = a * 0.7, x = wx / U, y = wy / U, fp = chamf(Math.round(x - a), Math.round(y - b), Math.round(x + a), Math.round(y + b), 3);
    mass(B, fp, x - a, y - b, x + a, y + b, 0, 3, 'conc', LEDS[1], true); mass(B, (px, py, i) => fp(px, py, (i || 0) + 2), x - a, y - b, x + a, y + b, 3, 4, 'hedge', null, false, 'hedge');
  }
  // ---------- P6.5 (Edit 67): an Expo site. Every open garden cell takes a programme in a fixed rotation: a parterre (a framed lawn
  // with a lit edge and a light at its centre), a plaza (planters, lit bollards), a fountain (a basin with jets) or a pavilion (a
  // drum, an LED box or a canopy on pilotis; solid to its plan). The great lawn takes a reflecting rill with jets on its long axis.
  const PROG = ['pavilion', 'parterre', 'fountain', 'plaza', 'parterre', 'pavilion', 'fountain', 'parterre']; // two pavilions, three parterres, two fountains, a court in eight
  const PAV = ['tower', 'box', 'canopy', 'dome', 'box', 'shell'], BIGPAV = ['shell', 'dome']; let PAVN = 0, PAVB = 0; // counts across the district's screens, so every type and size appears; a large hall wherever two open cells adjoin // P6.6 (Edit 68): five pavilion types, three sizes (S kiosk, M a cell, L two cells across their path)
  function jet(B, x, y, h) { // art px: a ripple ring at its foot, a fine column, a soft plume (a cloud of spray, never an arrow)
    for (let i = -3; i <= 3; i++) for (const j of [-1, 1]) if (Math.abs(i) + Math.abs(j) * 2 <= 4) B.mix(x + i, y + j, N.cyan, 0.45);
    for (let t = 1; t < h; t++) B.mix(x, y - t, K.white, 0.55 + 0.35 * t / h);
    for (let j = -2; j <= 1; j++) for (let i = -2; i <= 2; i++) { const d = i * i / 4 + j * j / 2.2; if (d <= 1) B.mix(x + i, y - h + j, d < 0.45 ? K.white : mixK(K.white, N.cyan, 0.5), d < 0.45 ? 0.95 : 0.6); }
  }
  function shellSprite(w, h, led) { // art px: an Expo hall under a row of shell vaults: lit and shaded halves, a glazed front, an LED eave
    const Hh = STY + 4, bump = 5, top = Hh + bump + 1, S = { w, h: h + top, ox: 0, oy: top, d: new Uint32Array(w * (h + top)) }, bw = Math.max(8, Math.round(w / Math.max(2, Math.round(w / 12))));
    const put = (x, y, c) => { const Y0 = y + top; if (x >= 0 && Y0 >= 0 && x < S.w && Y0 < S.h) S.d[Y0 * S.w + x] = c; };
    for (let x = 0; x < w; x++) {
      const p = (x % bw) / bw, lift = Math.round(bump * Math.sin(Math.PI * p)), edge = x % bw === 0 || x === w - 1;
      for (let y = -Hh - lift; y < h - Hh; y++) put(x, y, edge ? CON.l : y < -Hh - lift + 2 ? K.white : p < 0.5 ? N.stoneL : N.stone); // the vault seen from above
      put(x, h - Hh - 1, (x % 3) ? led : K.white); // the lit eave
      for (let y = h - Hh; y < h; y++) put(x, y, y === h - 1 ? CON.d : x < 2 || x >= w - 2 ? N.stoneD : (x % 5 === 0 ? K.white : y < h - Hh + 2 ? mixK(N.cyan, K.white, 0.3) : N.cyan)); // the glazed front
    }
    return S;
  }
  function towerSprite(w, h, led) { // art px: an observation tower: a plinth, a slender shaft, a lit pod, a mast
    const Hs = 7 * STY, pod = 6, mast = 8, top = Hs + pod + mast + 2, S = { w, h: h + top, ox: 0, oy: top, d: new Uint32Array(w * (h + top)) }, cx = Math.floor(w / 2);
    const put = (x, y, c) => { const Y0 = y + top; if (x >= 0 && Y0 >= 0 && x < S.w && Y0 < S.h) S.d[Y0 * S.w + x] = c; };
    for (let y = -2; y < h; y++) for (let x = 0; x < w; x++) put(x, y, y < h - 4 ? (x === 0 || x === w - 1 || y === -2 ? CON.l : CON.m) : y === h - 1 ? CON.x : CON.d); // the plinth, its top and front
    for (let z = 2; z < Hs; z++) for (let i = -2; i <= 2; i++) put(cx + i, h - 4 - z, i === -2 ? N.stoneL : i === 2 ? N.stoneD : z % 6 === 0 ? led : N.stone); // the shaft
    for (let j = 0; j < pod; j++) for (let i = -6; i <= 6; i++) if (Math.abs(i) <= 6 - (j === 0 || j === pod - 1 ? 1 : 0)) put(cx + i, h - 4 - Hs - j, j === 2 ? (i % 2 ? N.cyan : K.white) : j === pod - 1 ? N.stoneL : i < 0 ? N.stoneL : N.stone); // the pod, a band of glazing
    for (let z = 0; z < mast; z++) put(cx, h - 4 - Hs - pod - z, z === mast - 1 ? led : K.white);
    return S;
  }
  function domeSprite(rx, ry, wallH, led) { // art px: an Expo dome: a white drum with a glazed band, a ribbed dome, a lit oculus
    const dh = Math.round(ry * 1.4), top = wallH + dh + 2, S = { w: 2 * rx + 3, h: 2 * ry + top + 3, ox: rx + 1, oy: ry + top + 1 }; S.d = new Uint32Array(S.w * S.h);
    const put = (x, y, c) => { const X0 = x + S.ox, Y0 = y + S.oy; if (X0 >= 0 && Y0 >= 0 && X0 < S.w && Y0 < S.h) S.d[Y0 * S.w + X0] = c; };
    for (let x = -rx; x <= rx; x++) { const yb = Math.round(ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)))), u = x / rx; for (let z = 0; z < wallH; z++) put(x, yb - z, z === 0 ? CON.d : z >= wallH - 3 && z < wallH - 1 ? (x % 3 ? N.cyan : K.white) : u < -0.5 ? N.stoneD : u > 0.4 ? N.stoneL : N.stone); }
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const e = (x * x) / (rx * rx) + (y * y) / (ry * ry); if (e > 1) continue; const lift = Math.round(dh * Math.sqrt(Math.max(0, 1 - e))), rib = Math.abs(Math.atan2(y * rx / ry, x) * 8 / Math.PI % 1) < 0.12; put(x, y - wallH - lift, e < 0.05 ? led : e > 0.85 ? N.stoneD : rib ? N.stoneD : x < 0 ? N.stoneL : N.stone); }
    return S;
  }
  function lawnPanel(B, r, led, inset) { // P6.6: a framed grass square, a lit edge (frames a pavilion, fills a part-free cell)
    const [x0, y0, x1, y1] = r, i = inset == null ? 8 : inset, f = chamf(x0 + i, y0 + i, x1 - i, y1 - i, 12);
    each((x, y, wx, wy) => { if (!f(wx, wy)) return; B.put(x, y, !f(wx, wy, 3) ? CON.l : !f(wx, wy, 6) ? ((x + y) % 4 < 2 ? led : CON.m) : TURF[Math.floor(y / 6) % 2]); });
  }
  function parterre(B, r, led) {
    const [x0, y0, x1, y1] = r, f = chamf(x0 + 8, y0 + 8, x1 - 8, y1 - 8, 16);
    each((x, y, wx, wy) => { if (!f(wx, wy)) return; B.put(x, y, !f(wx, wy, 4) ? CON.l : !f(wx, wy, 8) ? ((x + y) % 4 < 2 ? led : CON.m) : (x % 16 === 8 && y % 16 === 8) ? mixK(TURF[1], led, 0.7) : TURF[Math.floor(y / 6) % 2]); });
    monolith(B, (x0 + x1) / 2 / U, (y0 + y1) / 2 / U + 2, 0, 14, led);
  }
  function fountainCell(B, r, led) { // P6.6: the basin on a framed lawn
    if (led) lawnPanel(B, r, led, 6);
    const [x0, y0, x1, y1] = r, f = chamf(x0 + 18, y0 + 14, x1 - 18, y1 - 14, 18), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    poolFP(B, f); for (const dx of [-28, 0, 28]) jet(B, Math.round((cx + dx) / U), Math.round(cy / U) + 2, dx ? 6 : 10);
  }
  function plazaCell(B, r, led, i) { // a sculpture court, as B3 and C3: a lit kerb, paving, a sculpture on the axis, planters, a bollard at each corner
    const [x0, y0, x1, y1] = r, f = chamf(x0 + 6, y0 + 6, x1 - 6, y1 - 6, 12), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    each((x, y, wx, wy) => { if (!f(wx, wy)) return; B.put(x, y, !f(wx, wy, 2) ? CON.l : !f(wx, wy, 4) ? ((x + y) % 4 < 2 ? led : CON.m) : (x % 8 === 0 || y % 8 === 0) ? N.tile2 : (x % 16 === 4 && y % 16 === 4) ? mixK(N.tile, led, 0.5) : N.tile); });
    sculpture(B, cx / U, cy / U + 2, SCULPT[i % SCULPT.length], led);
    for (const sx of [-1, 1]) smallPlanter(B, cx + sx * (x1 - x0) * 0.32, cy);
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) bollard(B, (cx + sx * ((x1 - x0) / 2 - 16)) / U, (cy + sy * ((y1 - y0) / 2 - 14)) / U, led);
  }
  function fountainSmall(B, cx, cy, r) { // a round basin with one jet, for a cell the paths and flights leave part free
    capture((wx, wy) => ((wx - cx) / r) ** 2 + ((wy - cy) / (r * 0.6)) ** 2 <= 1, cx - r, cy - r, cx + r, cy + r, true);
    each((x, y, wx, wy) => { const e = ((wx - cx) / r) ** 2 + ((wy - cy) / (r * 0.6)) ** 2; if (e > 1) return; B.put(x, y, e > 0.72 ? CON.l : e > 0.55 ? CON.d : (x * 3 + y * 7) % 41 === 0 ? N.cyan : y % 4 === 0 && (x * 5 + y) % 11 < 4 ? N.water2 : N.water); });
    jet(B, Math.round(cx / U), Math.round(cy / U), 9);
  }
  function pavilion(sc, B, r, kind, size, led, i) { // P6.6 (Edit 68): on a framed lawn; 6.2 (Edit 70): S a kiosk, M a hall, L the whole cell; never across a path
    lawnPanel(B, r, led, size === 'L' ? 2 : 6);
    const [x0, y0, x1, y1] = r, rw = x1 - x0, rh = y1 - y0, u = (v) => v / U;
    const pw = kind === 'tower' ? 40 : size === 'S' ? Math.min(48, rw - 48) : size === 'M' ? rw - 56 : rw - 20, ph = kind === 'tower' ? 28 : size === 'S' ? Math.min(32, rh - 44) : size === 'M' ? rh - 48 : rh - 24; // 6.2: S a kiosk, M a hall, L the whole cell
    const px = Math.round(x0 + (rw - pw) / 2), py = Math.round(y0 + (rh - ph) / 2 + 4);
    if (kind === 'dome') {
      const cx = px + pw / 2, cy = py + ph / 2, rx = Math.min(pw / 2, size === 'L' ? 60 : 40), ry = Math.min(ph / 2, size === 'L' ? 34 : 24);
      capture((wx, wy) => ((wx - cx) / rx) ** 2 + ((wy - cy) / ry) ** 2 <= 1, cx - rx, cy - ry, cx + rx, cy + ry, true);
      sc.props.push({ spr: domeSprite(Math.round(rx / U), Math.round(ry / U), STY, led), x: u(cx), y: u(cy), by: cy + ry + 2, bldg: 'pavilion', plan: [cx - rx * 0.7, cy - ry * 0.7, rx * 1.4, ry * 1.4] });
      brutalShadow(B, u(cx - rx), u(cy - ry), u(2 * rx), u(2 * ry), 2 * STY, null); return;
    }
    captureRect(px, py, pw, ph);
    const spr = kind === 'box' ? ledPanel(PIX.building(Math.round(u(pw)), Math.round(u(ph)), 2 * STY, PIX.rng(301 + i), led, 2), 2 * STY, [N.magenta, N.cyan])
      : kind === 'canopy' ? terraceSprite(Math.round(u(pw)), Math.round(u(ph)), true, led) : kind === 'shell' ? shellSprite(Math.round(u(pw)), Math.round(u(ph)), led) : towerSprite(Math.round(u(pw)), Math.round(u(ph)), led);
    sc.props.push({ spr, x: u(px), y: u(py), by: py + ph, bldg: 'pavilion', plan: [px, py, pw, ph] });
    brutalShadow(B, u(px), u(py), u(pw), u(ph), kind === 'tower' ? 7 * STY : kind === 'canopy' ? Z1 : 2 * STY, null);
  }
  function cellRect(c0, r0, c1, r1) { // the garden cells c0..c1 × r0..r1 as one rect, inside their paths (6.2: EDGE at the screen's edges)
    return [c0 === 0 && EDGE ? EDGE.W : c0 * GW + GP / 2, r0 === 0 && EDGE ? EDGE.N : r0 * GH + GP / 2, (c1 + 1) * GW >= W ? (EDGE ? W - EDGE.E : W - 8) : (c1 + 1) * GW - GP / 2, (r1 + 1) * GH >= H ? (EDGE ? H - EDGE.S : H - 8) : (r1 + 1) * GH - GP / 2];
  }
  function gardenPlan(B, o) { // o: { bedOk(wx, wy), rng, leds, pools, anchor: [x, y, w, h] or null }
    const nc = Math.ceil(W / GW), nr = Math.ceil(H / GH), rect = (gx, gy, nx, ny) => cellRect(gx, gy, gx + nx - 1, gy + ny - 1);
    const okR = ([x0, y0, x1, y1]) => { for (let x = x0; x <= x1; x += 16) for (let y = y0; y <= y1; y += 16) if (!o.bedOk(x, y)) return false; return o.bedOk(x1, y1) && o.bedOk(x1, y0) && o.bedOk(x0, y1); };
    const used = Array.from({ length: nr }, (_, gy) => Array.from({ length: nc }, (_, gx) => (okR(rect(gx, gy, 1, 1)) ? 0 : -1))); // -1 not free, 0 free, 1 bed, 2 lawn, 3 open square
    let best = null; // the largest free block: area first, then nearest the screen's centre
    for (let ny = GLC; ny <= GLC + 1; ny++) for (let nx = GLC; nx <= GLC + 1; nx++) for (let gy = 0; gy + ny <= nr; gy++) for (let gx = 0; gx + nx <= nc; gx++) {
      let all = true; for (let j = 0; j < ny && all; j++) for (let i = 0; i < nx; i++) if (used[gy + j][gx + i] !== 0) { all = false; break; }
      if (!all) continue;
      const r = rect(gx, gy, nx, ny), a = nx * ny, d = hyp((r[0] + r[2]) / 2 - W / 2, (r[1] + r[3]) / 2 - H / 2);
      if (!best || a > best.a || (a === best.a && d < best.d)) best = { gx, gy, nx, ny, r, a, d };
    }
    const lawn = best ? [best.r[0], best.r[1], best.r[2] - best.r[0], best.r[3] - best.r[1]] : null;
    if (best) {
      for (let j = 0; j < best.ny; j++) for (let i = 0; i < best.nx; i++) used[best.gy + j][best.gx + i] = 2;
      const [x0, y0, x1, y1] = best.r;
      { const cw = chamf(x0, y0, x1, y1, 24), fpA = (x, y, ins) => cw((x + 0.5) * U, (y + 0.5) * U, (ins || 0) * U), ax0 = Math.floor(x0 / U), ay0 = Math.floor(y0 / U), ax1 = Math.ceil(x1 / U), ay1 = Math.ceil(y1 / U);
        for (let y = ay0; y <= ay1; y++) for (let x = ax0; x <= ax1; x++) if (fpA(x, y)) B.put(x, y, !fpA(x, y, 1) ? CON.l : greatC(x, y)); // the great lawn, mown in broad stripes
        const gapW = (x, y) => (x1 - x0 >= y1 - y0 ? Math.abs((x + 0.5) * U - (x0 + x1) / 2) : Math.abs((y + 0.5) * U - (y0 + y1) / 2)) <= 18; // Prototype 6.1: the hedge opens where the cross-walk meets it
        mass(B, (x, y) => fpA(x, y, 1) && !fpA(x, y, 4) && !gapW(x, y), ax0, ay0, ax1, ay1, 0, 3, 'hedge', o.leds[0], true, 'hedge'); } // a clipped hedge frames it
      { // P6.5 (Edit 67): the great lawn in four panels: a paved cross-walk on its short axis, a reflecting rill with jets either side on its long axis
        const wide = x1 - x0 >= y1 - y0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, L = (wide ? x1 - x0 : y1 - y0) * 0.36, inL = chamf(x0, y0, x1, y1, 24);
        each((x, y, wx, wy) => { if (!inL(wx, wy, 6)) return; const d = Math.abs(wide ? wx - cx : wy - cy); if (d > 14) return; B.put(x, y, d > 12 ? CON.l : d > 10 ? ((x + y) % 4 < 2 ? N.cyan : CON.m) : slabC(x, y, wide ? 1 : 0)); });
        for (const sg of [-1, 1]) { const a0 = sg < 0 ? -L : 22, a1 = sg < 0 ? -22 : L, f = wide ? chamf(cx + a0, cy - 12, cx + a1, cy + 12, 8) : chamf(cx - 12, cy + a0, cx + 12, cy + a1, 8);
          poolFP(B, f); for (let t = a0 + 16; t <= a1 - 12; t += 36) jet(B, Math.round((wide ? cx + t : cx) / U), Math.round((wide ? cy : cy + t) / U) + 1, 6); } }
    }
    const pair = MED[Math.floor(o.rng() * MED.length)].slice(0, Math.max(1, GBT)), m = GP + 8;
    const touch = (r, A) => !!A && r[0] <= A[0] + A[2] + m && r[2] >= A[0] - m && r[1] <= A[1] + A[3] + m && r[3] >= A[1] - m;
    const open = [];
    for (let gy = 0; gy < nr; gy++) for (let gx = 0; gx < nc; gx++) {
      if (used[gy][gx] !== 0) continue;
      const r = rect(gx, gy, 1, 1), [x0, y0, x1, y1] = r, type = touch(r, lawn) ? pair[0] : touch(r, o.anchor) ? pair[pair.length - 1] : null;
      if (!type) { used[gy][gx] = 3; open.push({ r, gx, gy }); continue; } // an open square: a programme (P6.5)
      const cw = chamf(x0, y0, x1, y1, 16), fpA = (x, y, ins) => cw((x + 0.5) * U, (y + 0.5) * U, (ins || 0) * U);
      drawBed(B, type, fpA, cw, Math.floor(x0 / U), Math.floor(y0 / U), Math.ceil(x1 / U), Math.ceil(y1 / U), r, o.leds[(gx + gy * 2) % o.leds.length]); used[gy][gx] = 1;
    }
    const seed = o.seed || 0, prog = open.map((c) => PROG[(c.gx * 3 + c.gy * 5 + seed) % PROG.length]);
    if (open.length && !prog.includes('pavilion')) { const k = open.reduce((a, c, i) => (hyp((c.r[0] + c.r[2]) / 2 - W / 2, (c.r[1] + c.r[3]) / 2 - H / 2) < hyp((open[a].r[0] + open[a].r[2]) / 2 - W / 2, (open[a].r[1] + open[a].r[3]) / 2 - H / 2) ? i : a), 0); prog[k] = 'pavilion'; } // at least one pavilion a screen
    const at = new Map(open.map((c, i) => [c.gx + ',' + c.gy, i])), done = new Set();
    open.forEach((c, i) => {
      if (done.has(i)) return;
      const t = prog[i], led = o.leds[(c.gx + c.gy * 2) % o.leds.length];
      if (t === 'pavilion' && o.sc) { // P6.6: five types in rotation, three sizes. 6.2 (Edit 70): every size inside its cell; nothing spans a path
        const kind = PAV[PAVN % PAV.length], size = kind === 'tower' ? 'S' : kind === 'box' ? (PAVN % 2 ? 'S' : 'M') : BIGPAV.includes(kind) ? (PAVB++ % 2 ? 'M' : 'L') : 'M'; PAVN++;
        pavilion(o.sc, B, c.r, kind, size, led, i + seed);
      } else if (t === 'parterre') parterre(B, c.r, led); else if (t === 'fountain') fountainCell(B, c.r, led); else plazaCell(B, c.r, led, c.gx + c.gy + seed);
    });
    for (let gy = 0; gy < nr; gy++) for (let gx = 0; gx < nc; gx++) { // P6.5: a cell the roads, decks or flights leave part free takes a small fountain at its centre
      if (used[gy][gx] !== -1) continue;
      const r = rect(gx, gy, 1, 1), cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
      if (r[2] - r[0] < 96 || r[3] - r[1] < 72) continue;
      let ok = true; for (let a = 0; a < 16 && ok; a++) { const t = a * Math.PI / 8; for (const rr of [0, 20, 40]) if (!o.bedOk(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr * 0.75)) { ok = false; break; } }
      if (!ok) continue;
      if ((gx + gy + seed) % 2) { const ld = o.leds[(gx + gy) % o.leds.length]; lawnPanel(B, [cx - 44, cy - 32, cx + 44, cy + 32], ld, 0); sculpture(B, cx / U, cy / U + 2, SCULPT[(gx * 2 + gy + seed) % SCULPT.length], ld); used[gy][gx] = 5; } // P6.6: else a grass square; 6.2 (Edit 70): a lit sculpture on it (never on a path crossing)
      else { fountainSmall(B, cx, cy, 26); used[gy][gx] = 4; }
    }
    if (best && o.sc) (o.sc.pieces = o.sc.pieces || []).push({ kind: 'great lawn', rect: [best.r[0], best.r[1], best.r[2] - best.r[0], best.r[3] - best.r[1]] }); // 6.2: its inner paths go; no planter on a crossing
    const crossings = []; // the crossings left for sculptures: away from the lawn's corners
    for (let j = 1; j < nr; j++) for (let i = 1; i < nc; i++) { const x = i * GW, y = j * GH; if (o.bedOk(x, y) && !(best && touch([x - 1, y - 1, x + 1, y + 1], lawn))) crossings.push([x, y]); }
    return crossings;
  }
  function gardenSculptures(B, ok, diag, rng, n, free) { // medium sculptures on path crossings (Edit 55: those the planters leave)
    const c = []; for (let gy = 1; gy < Math.ceil(H / GH); gy++) for (let gx = 1; gx < Math.ceil(W / GW); gx++) { const x = gx * GW, y = gy * GH; if (ok(x, y) && (!diag || Math.abs(x + y - diag.c) > diag.w / 2 + 16) && (!free || free.some((q) => q[0] === x && q[1] === y))) c.push([x, y]); }
    for (let i = 0; i < n && c.length; i++) { const [x, y] = c.splice(Math.floor(rng() * c.length), 1)[0]; sculpture(B, x / U, y / U + 1, SCULPT[Math.floor(rng() * SCULPT.length)], LEDS[Math.floor(rng() * LEDS.length)]); }
  }
  // ---------- brutalist towers (Edit 51.3): a podium on pilotis, then a ziggurat, a cantilevered crown, a finned slab or twin towers and a bridge.
  // Slab bands every storey, deep window slots, fins, LED banners and crowns, a 45° cut to the street, hard shadows.
  const STY = EXT(P['world.storeyHeight']);
  function brutal(w, h, H, rng, led, cut, rear, style0) {
    w = Math.round(w); h = Math.round(h); H = Math.round(H);
    const pad = 2, top = H + 18, S = { w: w + 2 * pad, h: h + top + 2, ox: pad, oy: top }; S.d = new Uint32Array(S.w * S.h);
    const put = (x, y, c) => { const X0 = x + pad, Y0 = y + top; if (X0 >= 0 && Y0 >= 0 && X0 < S.w && Y0 < S.h) S.d[Y0 * S.w + X0] = c; };
    const half = (x, y, ins) => { if (!cut) return true; const u = cut.c[1] === 'e' ? x : w - 1 - x, v = cut.c[0] === 's' ? y : h - 1 - y; return u + v <= w + h - 2 - cut.k - (ins || 0) * 1.42; };
    const V = [], vol = (x0, y0, x1, y1, k, b, t, o) => {
      x0 = Math.round(x0); x1 = Math.round(x1); y0 = Math.round(y0); y1 = Math.round(y1);
      if (x1 - x0 < 6 || y1 - y0 < 4 || t <= b) return;
      if (rear === 's' && !(o && o.kind === 'podium')) { const a = h - 1 - y1; y1 = h - 1 - y0; y0 = a; }
      V.push(Object.assign({ x0, y0, x1, y1, k, b: Math.round(b), t: Math.round(t), seed: Math.floor(rng() * 997) }, o || {}));
    };
    const pH = Math.max(STY * 2, Math.round(H * (0.16 + rng() * 0.08) / STY) * STY), style = style0 || ['ziggurat', 'cantilever', 'slab', 'twin'][Math.floor(rng() * 4)];
    const s = Math.max(3, Math.round(w * 0.1)), back = Math.max(4, Math.round(h * 0.2)), up = (f) => pH + Math.round((H - pH) * f / STY) * STY;
    vol(0, 0, w - 1, h - 1, 2, 0, pH, { kind: 'podium' });
    if (style === 'ziggurat') { const m = up(0.55); vol(s, 2, w - 1 - s, h - 1 - back, 3, pH, m, { fins: true }); vol(2 * s, 4, w - 1 - 2 * s, h - 1 - back - s, 3, m, H, { crown: true, mast: true }); }
    else if (style === 'cantilever') { const n = up(0.35); vol(w * 0.3, h * 0.2, w * 0.7, h * 0.6, 2, pH, n, {}); vol(2, 2, w - 3, h - 1 - back, 3, n, H, { over: true, crown: true, fins: true }); }
    else if (style === 'slab') { const d = Math.max(8, Math.round(h * 0.34)); vol(s, 3, w - 1 - s, 3 + d, 2, pH, H, { fins: true, crown: true, banner: true, mast: true }); }
    else { const a = Math.round(w * 0.42), b2 = Math.round(w * 0.58), d = Math.round(h * 0.62); vol(2, 2, a, d, 3, pH, H, { crown: true, banner: true, mast: true }); vol(b2, 2, w - 3, d, 3, pH, up(0.8), { crown: true, fins: true }); vol(a + 1, h * 0.16, b2 - 1, h * 0.36, 1, up(0.55), up(0.68), { over: true }); }
    const inV = (v, x, y, ins) => { ins = ins || 0; const c = v.k + ins * 0.6; return x >= v.x0 + ins && x <= v.x1 - ins && y >= v.y0 + ins && y <= v.y1 - ins && x - v.x0 + y - v.y0 >= c && v.x1 - x + y - v.y0 >= c && x - v.x0 + v.y1 - y >= c && v.x1 - x + v.y1 - y >= c && half(x, y, ins); };
    const darker = (c) => c === CON.l ? CON.m : c === CON.m ? CON.d : CON.x;
    const face = (v, x, z, sl) => {
      const base = sl < 0 ? CON.d : sl > 0 ? CON.l : CON.m, f = z - v.b, fl = Math.floor(f / STY), r = f % STY;
      if (z === 0) return CON.x;
      if (v.kind === 'podium' && f < STY) return x % 6 === 0 ? base : f === STY - 1 ? led : CON.x; // pilotis, a lit shop line
      if (v.banner && x >= v.x0 + 3 && x <= v.x0 + 4 && f >= STY && z < v.t - 2) return fl % 2 ? led : mixK(led, K.white, 0.45); // an LED banner
      if (r === STY - 1) return sl > 0 ? CON.l : mixK(base, CON.l, 0.5); // slab edge
      if (v.fins && x % 3 === 0) return base;
      if (r === 1 || r === 2) { const q = hsh(x + v.seed, fl * 7 + v.y0) % 17; return q === 0 ? mixK(CON.x, led, 0.7) : q === 1 ? mixK(CON.x, K.white, 0.3) : CON.x; } // deep window slots
      return x % 4 === 0 ? darker(base) : base;
    };
    const drawVol = (v) => {
      const mid = (v.x0 + v.x1) / 2;
      for (let x = v.x0; x <= v.x1; x++) {
        let yb = -1; for (let y = v.y1; y >= v.y0; y--) if (inV(v, x, y)) { yb = y; break; }
        if (yb < 0) continue;
        const sl = yb < v.y1 ? (x < mid ? -1 : 1) : 0;
        for (let z = v.b; z < v.t; z++) put(x, yb - z, v.plain ? (z === v.b ? CON.x : sl < 0 ? CON.d : x % 4 === 0 ? CON.d : CON.m) : face(v, x, z, sl));
        if (v.over) for (let d = 1; d <= 2; d++) put(x, yb - v.b + d, CON.x); // soffit shadow under a cantilever
      }
      for (let y = v.y0; y <= v.y1; y++) for (let x = v.x0; x <= v.x1; x++) {
        if (!inV(v, x, y)) continue;
        const edge = !inV(v, x, y, 1), front = edge && !inV(v, x, y + 1);
        const roof = mixK(CON.t, CON.l, Math.min(0.45, v.t / Math.max(1, H) * 0.45));
        put(x, y - v.t, v.crown && front ? led : edge ? CON.l : v.plain ? CON.t2 : ((x - v.x0) % 8 === 0 || (y - v.y0) % 8 === 0) ? mixK(roof, CON.d, 0.5) : roof);
      }
      if (v.mast) { const mx = v.x0 + 4, my = v.y0 + 3; for (let j = 0; j < 10; j++) put(mx, my - v.t - j, CON.l); put(mx, my - v.t - 10, led); put(mx - 1, my - v.t - 6, CON.l); put(mx + 1, my - v.t - 6, CON.l); }
    };
    const shadeRoof = (lo, hi) => { // a higher volume casts a hard shadow on a lower roof
      const L2 = Math.round((hi.t - lo.t) * 0.6), M = new Set();
      for (let y = hi.y0; y <= hi.y1; y++) for (let x = hi.x0; x <= hi.x1; x++) if (inV(hi, x, y)) for (let t = 1; t <= L2; t++) { const px = Math.round(x - t * 0.7), py = Math.round(y + t * 0.7); if (inV(lo, px, py, 1) && !inV(hi, px, py)) M.add(px + ',' + py); }
      for (const q of M) { const [px, py] = q.split(',').map(Number), X0 = px + pad, Y0 = py - lo.t + top; if (X0 >= 0 && Y0 >= 0 && X0 < S.w && Y0 < S.h && S.d[Y0 * S.w + X0]) S.d[Y0 * S.w + X0] = mixK(S.d[Y0 * S.w + X0], CON.x, 0.5); }
    };
    V.forEach((v, i) => { drawVol(v); for (const u of V.slice(i + 1)) if (u.t > v.t && u.b >= v.t - 1) shadeRoof(v, u); });
    // roofscape: plant cores on the highest roof, skylights on the podium roof, an LED billboard on the front edge
    const topV = V.reduce((a, v) => (v.t > a.t ? v : a), V[0]), towers = V.slice(1), coveredAt = (x, y) => towers.some((v) => inV(v, x, y, -1));
    for (let i = 0; i < 2; i++) {
      const cw = 4 + Math.floor(rng() * 4), ch = 3 + Math.floor(rng() * 2), cx = topV.x0 + 3 + Math.floor(rng() * Math.max(1, topV.x1 - topV.x0 - cw - 6)), cy = topV.y0 + 2 + Math.floor(rng() * Math.max(1, topV.y1 - topV.y0 - ch - 4));
      if ([[cx, cy], [cx + cw, cy], [cx, cy + ch], [cx + cw, cy + ch]].every(([x, y]) => inV(topV, x, y, 2))) drawVol({ x0: cx, y0: cy, x1: cx + cw, y1: cy + ch, k: 0, b: topV.t, t: topV.t + 3 + Math.floor(rng() * 4), plain: true });
    }
    const pod = V[0];
    for (let i = 0; i < 6; i++) {
      const x = pod.x0 + 4 + Math.floor(rng() * (pod.x1 - pod.x0 - 10)), y = pod.y0 + 3 + Math.floor(rng() * (pod.y1 - pod.y0 - 6));
      if (![[x, y], [x + 5, y], [x, y + 2], [x + 5, y + 2]].every(([a, b2]) => inV(pod, a, b2, 2) && !coveredAt(a, b2) && !coveredAt(a, b2 + 6))) continue;
      for (let j = 0; j < 2; j++) for (let i2 = 0; i2 <= 5; i2++) put(x + i2, y + j - pod.t, i2 === 0 || i2 === 5 ? CON.x : mixK(CON.x, N.cyan, j ? 0.25 : 0.5));
    }
    if (rng() < 0.6 && topV.x1 - topV.x0 > 16) { // a billboard on legs, lit
      const bw = Math.min(16, topV.x1 - topV.x0 - 8), bx = topV.x0 + 4 + Math.floor(rng() * (topV.x1 - topV.x0 - bw - 8)); let by = topV.y1 - 2; while (by > topV.y0 && !inV(topV, bx, by, 1)) by--;
      for (const lx of [bx + 1, bx + bw - 1]) for (let z = 0; z < 3; z++) put(lx, by - topV.t - z, CON.l);
      for (let z = 3; z < 10; z++) for (let x = bx; x <= bx + bw; x++) put(x, by - topV.t - z, z === 3 || z === 9 || x === bx || x === bx + bw ? CON.x : z % 2 ? led : mixK(led, K.white, 0.35));
    }
    return S;
  }
  function brutalShadow(B, ax, ay, w, h, L, cut) {
    w = Math.round(w); h = Math.round(h); ax = Math.round(ax); ay = Math.round(ay);
    const fp = (x, y) => { if (x < 0 || y < 0 || x >= w || y >= h) return false; if (!cut) return true; const u = cut.c[1] === 'e' ? x : w - 1 - x, v = cut.c[0] === 's' ? y : h - 1 - y; return u + v <= w + h - 2 - cut.k; };
    const M = new Uint8Array(AW * AH), mark = (x, y) => { const sx = ax + x, sy = ay + y; if (sx >= 0 && sy >= 0 && sx < AW && sy < AH) M[sy * AW + sx] = 1; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!fp(x, y)) continue;
      const rim = !fp(x - 1, y) || !fp(x + 1, y) || !fp(x, y - 1) || !fp(x, y + 1);
      if (rim) for (let t = 1; t <= L; t++) { const px = Math.round(x - t * 0.7), py = Math.round(y + t * 0.7); if (!fp(px, py)) mark(px, py); }
      const px = Math.round(x - L * 0.7), py = Math.round(y + L * 0.7); if (!fp(px, py)) mark(px, py);
    }
    for (let q = 0; q < M.length; q++) if (M[q]) B.shade(q % AW, Math.floor(q / AW), 0.62);
  }
  function monolith(B, ax, ay, base, h, led) { // a concrete slab with a lit slot
    block(B, ax - 2, ay - 1, ax + 2, ay + 1, 0, base, h, 'conc', null, base === 0);
    for (let t = 3; t < h - 2; t++) B.put(Math.round(ax), Math.round(ay) + 1 - base - t, led);
    B.put(Math.round(ax), Math.round(ay) - 1 - base - h, K.white);
  }
  function planter(B, wx, wy, hw, hh, kind, led) { // world centre and half-size; a raised lawn in a concrete box, or tiers, with a monolith
    const x = wx / U, y = wy / U, a = hw / U, b = hh / U, k = Math.round(Math.min(a, b) * 0.5);
    if (kind === 'tiers') { block(B, x - a, y - b, x + a, y + b, k, 0, 3, 'conc', null, true); block(B, x - a + 4, y - b + 3, x + a - 4, y + b - 3, Math.max(1, k - 3), 3, 3, 'grass', led, false); monolith(B, x, y, 6, 18, led); }
    else { block(B, x - a, y - b, x + a, y + b, k, 0, 5, 'grass', led, true); if (kind === 'monolith') monolith(B, x + a * 0.4, y, 5, 20, led); }
  }
  // ---------- public sculptures (art px; anchored at the footprint centre)
  // Edit 55: three sizes. k = 1 medium; world.sculptureScaleLarge for a court's centrepiece; small pieces are lit bollards.
  function sculpture(B, ax, ay, kind, led, k) {
    { const kk = k || 1; captureRect((ax - 6 * kk) * U, (ay - 3 * kk) * U, 12 * kk * U, 6 * kk * U, 'sculpture'); }
    k = k || 1; const R = (v) => Math.max(1, Math.round(v * k)), x0 = Math.round(ax), y0 = Math.round(ay), put = (x, y, c) => B.put(x0 + x, y0 + y, c), sh = (n, w) => { for (let t = 0; t < n; t++) for (let j = -w; j <= w; j++) B.shade(x0 - t * 0.7 + j * 0.7, y0 + t * 0.7 + j * 0.7, 0.72); };
    for (let x = -R(5); x <= R(5); x++) for (let y = -R(2); y <= R(2); y++) if (Math.abs(x) + Math.abs(y) * 2 <= R(6)) put(x, y, y > 0 ? CON.d : CON.l); // chamfered plinth
    if (kind === 'obelisk') { sh(R(16), R(2)); for (let h = 1; h < R(26); h++) { const w = h > R(20) ? R(1) : R(2); for (let i = -w; i <= w; i++) put(i, -h, i === -w ? CON.l : i === w ? led : CON.m); } put(0, -R(26), K.white); put(0, -R(26) - 1, led); }
    else if (kind === 'ring') { sh(R(12), R(3)); for (let h = 1; h < R(6); h++) for (let i = 0; i < R(1); i++) put(i, -h, CON.m); const n = Math.round(64 * k); for (let a = 0; a < n; a++) { const t = a / n * Math.PI * 2; for (let w = 0; w < R(1); w++) put(Math.round(Math.cos(t) * (R(6) - w)), Math.round(-R(14) + Math.sin(t) * (R(9) - w)), a % 8 < 5 ? led : K.white); } }
    else if (kind === 'cubes') { sh(R(12), R(4)); for (const [s0, ox, h0] of [[8, -1, 0], [6, 1, 8], [4, 0, 14]]) { const sz = R(s0); for (let y = 0; y < sz; y++) for (let x = 0; x < sz; x++) put(R(ox) + x - Math.floor(sz / 2), -R(h0) - y - 1, x === 0 || y === sz - 1 ? led : y === 0 ? CON.l : CON.m); } }
    else if (kind === 'arch') { sh(R(14), R(5)); for (let h = 1; h < R(20); h++) for (const px of [-R(6), R(5)]) for (let i = 0; i < R(2); i++) put(px + i, -h, i === 0 ? CON.l : CON.m); for (let x = -R(6); x <= R(6); x++) for (let t = 0; t < R(2); t++) put(x, -R(20) + t, t === 0 ? CON.l : led); }
    else { sh(R(10), R(4)); for (let q = 0; q < 5; q++) for (let h = 1; h < R(10 + q * 3); h++) for (let i = 0; i < R(1); i++) put(-R(6) + R(q * 3) + i, -h, h > R(6 + q * 3) ? led : CON.m); } // light fins
  }
  function bollard(B, ax, ay, led) { monolith(B, ax, ay, 0, Math.round(16 * P['world.sculptureScaleSmall']), led); } // the small piece: a lit post
  // A sculpture court at grade: lattice paving and a low kerb; one large piece on the axis, two medium either side,
  // world.courtSmallCount lit bollards along the front edge (art px box).
  function sculptureCourt(B, x0, y0, x1, y1, k, big, mids, led) {
    const fp = chamf(x0, y0, x1, y1, k);
    each((x, y) => { if (!fp(x, y, -2)) return; B.put(x, y, !fp(x, y, 0) ? CON.l : !fp(x, y, 1) ? CON.m : ((x + y) % 12 === 0 || ((x - y) % 12 + 12) % 12 === 0) ? mixK(N.tile, N.cyan, 0.45) : (x % 6 === 0 || y % 6 === 0) ? N.tile2 : N.tile); });
    const cx = (x0 + x1) / 2, n = P['world.courtSmallCount'], L2 = P['world.sculptureScaleLarge'];
    sculpture(B, cx, y0 + (y1 - y0) * 0.42, big, led, L2);
    mids.forEach((kd, i) => sculpture(B, i ? x1 - (x1 - x0) * 0.2 : x0 + (x1 - x0) * 0.2, y0 + (y1 - y0) * 0.6, kd, LEDS[(i + 1) % LEDS.length], 1));
    for (let i = 0; i < n; i++) bollard(B, x0 + k * 0.5 + (x1 - x0 - k) * i / (n - 1), y1 - 4, LEDS[i % 2 ? 0 : 3 % LEDS.length]);
  }
  const SCULPT = ['obelisk', 'ring', 'cubes', 'arch', 'fins'];
  // ---------- escalators: two per highway screen, on opposite sides, at opposite ends (Edit 51.2)
  function escalators(off, z, half, x0, x1) { // north at the west end, south at the east end
    const run = X.stairRun(P, 0, z), a = x0 === undefined ? INSET : x0, b = x1 === undefined ? W - INSET - SWD : x1;
    return [{ x: a, y: off - half - run, w: SWD, h: run, axis: 'y', low: off - half - run, high: off - half, side: -1, z },
      { x: b, y: off + half, w: SWD, h: run, axis: 'y', low: off + half + run, high: off + half, side: 1, z }];
  }
  const stairProp = (st, lift) => ({ spr: PIX.stairs(st, 0, lift), x: st.x / U, y: st.y / U, by: st.y + st.h, over: st.side > 0 || st.axis === 'x', stair: st }); // P6: the flight, for play
  // ---------- decks in their own layer: straight highways (the game's PIX.deck) or rings (distance field)
  function ringRoutes(cx, cy, Rc, Rf) {
    const a = { ang: Math.PI, pt: [-200, cy] }, b = { ang: 0, pt: [W + 200, cy] }, r = () => 0.9, phi = Math.asin(Rf / (Rc + Rf)), D = (Rc + Rf) * Math.cos(phi);
    return { WE: X.roundaboutCenter(a, b, 2 * cx, 2 * cy, 200, Rc, r, Rf), EW: X.roundaboutCenter(b, a, 2 * cx, 2 * cy, 200, Rc, r, Rf), ring: X.arcPts(cx, cy, Rc, 0, 2 * Math.PI, 96), armW: [[-200, cy], [cx - D, cy]], armE: [[cx + D, cy], [W + 200, cy]] };
  }
  function ringLayer(rr, z, cx, cy, Rc, avoid, openings, verge) { // P6.4: verge(x, y): planting on the ring's own shoulders // a curved deck from its centre lines: parapets, lane lines, dashes, girder face, paired lamps (outer), columns
    const geoms = rr.geoms || [{ pts: rr.ring, dash: true }, { pts: rr.armW, dash: true }, { pts: rr.armE, dash: true }, { pts: rr.WE }, { pts: rr.EW }];
    const f = PIX.roadField(geoms, HALF + 6), Lr = new PIX.Buf(AW, AH), led = LEDS[z === 2 ? 2 : 1], inB = (x, y) => x >= 0 && y >= 0 && x < AW && y < AH && f.D[y * AW + x] <= HALF;
    const inner = rr.inner || [], rIn = Rc - HALF, endC = led === N.cyan ? N.magenta : N.cyan;
    const inArc = (wx, wy, pad) => inner.some(({ a0, a1 }) => { const t = Math.atan2(wy - cy, wx - cx), c = (a0 + a1) / 2; return Math.abs(Math.atan2(Math.sin(t - c), Math.cos(t - c))) <= (a1 - a0) / 2 + (pad || 0); });
    each((x, y, wx, wy, k) => {
      const d = f.D[k]; if (d > HALF) return;
      const pb = HALF - d, s = f.S[k], m = ((s % 6) + 6) % 6 < 3;
      if (pb < PW + 1 && inner.length && hyp(wx - cx, wy - cy) < Rc) { // 6.2 (Edit 70): the hole's parapet open over the road below; its ends in the LED's contrast
        if (inArc(wx, wy)) { Lr.put(x, y, pb < 1.5 ? ((x + y) % 3 ? K.deckJoint : K.bldgDark) : K.deck2); return; }
        if (inArc(wx, wy, 5 / rIn)) { Lr.put(x, y, endC); return; }
      }
      if (pb < PW + 1 && (openings || []).some(([a, b, sd]) => wx > a && wx < b && (sd > 0 ? wy > cy : wy < cy))) { Lr.put(x, y, K.deck2); return; } // an escalator head: no parapet
      Lr.put(x, y, pb < 2 ? K.jerseyO : pb < 4 ? (m ? led : K.jerseyTop) : pb < PW + 1 ? K.jersey : Math.abs(d - LW) < 1.2 ? K.lane : f.dash[k] && d < 1.2 && ((s % 48) + 48) % 48 < 28 ? K.lane : f.dash[k] && ((s % 64) + 64) % 64 < 1.5 ? K.deckJoint : verge && d > LW + 2 && pb >= PW + 2 && Math.abs(hyp(wx - cx, wy - cy) - Rc) > LW + 2 ? verge(x, y) : d > LW ? K.deck2 : K.deck);
    });
    each((x, y) => { if (inB(x, y)) return; for (let k = 1; k <= 4; k++) if (inB(x, y - k)) { Lr.put(x, y, k === 1 ? K.jerseyTop : k === 4 ? K.bldgOutline : (x % 4 < 1 ? K.columnD : K.column)); break; } });
    const lift = z === 2 ? Z2 : Z1, glow = mixK(K.deck2, K.white, 0.38), cols = [];
    const lamps = [], LS = P['world.deckLampSpacing'];
    for (const g of geoms) walk(g.pts, g.dash ? LS : LS / 2, (x, y, tx, ty) => { for (const sd of [-1, 1]) {
      const wx = x - ty * sd * (HALF - 3), wy = y + tx * sd * (HALF - 3); if (hyp(wx - cx, wy - cy) < Rc) continue; // lamps on the outer parapet
      const kl = Math.floor(wy / U) * AW + Math.floor(wx / U); if (kl < 0 || kl >= AW * AH || f.D[kl] < HALF - 5) continue; // 6.2 (Edit 70): only where this is the deck's own edge, never on the carriageway where flares meet
      if (lamps.some(([a, b]) => hyp(a - wx, b - wy) < LS * 0.6)) continue;
      if ((openings || []).some(([a, b]) => wx > a - 12 && wx < b + 12 && Math.abs(Math.abs(wy - cy) - HALF) < 8)) continue;
      lamps.push([wx, wy]);
      const bx = Math.round(wx / U), by = Math.round(wy / U), ix = Math.round((x - ty * sd * (HALF - 9)) / U), iy = Math.round((y + tx * sd * (HALF - 9)) / U);
      if (bx < 1 || by < 1 || bx >= AW - 2 || by >= AH) continue;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) <= 2 && inB(ix + i, iy + j)) Lr.put(ix + i, iy + j, glow);
      for (let h = 1; h < PIX.LAMP_H; h++) { Lr.put(bx, by - h, K.jerseyTop); Lr.put(bx + 1, by - h, K.bldgOutline); }
      for (let i = -1; i <= 2; i++) { Lr.put(bx + i, by - PIX.LAMP_H + 1, i === 0 || i === 1 ? K.white : K.head); Lr.put(bx + i, by - PIX.LAMP_H, K.bldgOutline); }
    } });
    for (const g of geoms.filter((q) => q.dash)) walk(g.pts, 120, (x, y, tx, ty) => { for (const sd of [-1, 1]) {
      const off = HALF - 4 - C / 2, ccx = x - ty * sd * off, ccy = y + tx * sd * off;
      if (ccx < C || ccy < C || ccx > W - C || ccy > H - C || avoid(ccx, ccy) || onPath(ccx, ccy, C / 2 + 2) || cols.some((q) => hyp(q.cx - ccx, q.cy - ccy) < C + 24)) continue;
      cols.push({ cx: ccx, cy: ccy, key: ccy + C / 2, x: ccx - C / 2, y: ccy - C / 2, spr: PIX.column(Math.round(C / U), Math.round(C / U), lift) });
    } });
    return { L: Lr, lift, z, field: f, openings: openings || [], cols, front: cy + Rc + HALF, ring: { cx, cy, Rc, geoms, inner }, inBand: (wx, wy) => { const k = Math.floor(wy / U) * AW + Math.floor(wx / U); return k >= 0 && k < AW * AH && f.D[k] <= HALF + 12; }, shadeOn: (B) => {
      const k = P['proto.art.shadowScale'], hgt = z === 2 ? P['world.highHeight'] : P['world.deckHeight'], ox = PIX.SUN.x * hgt * k / U, oy = PIX.SUN.y * hgt * k / U;
      each((x, y) => { for (const t of [0, 0.5, 1]) { const sx = Math.round(x - ox * t), sy = Math.round(y - oy * t); if (sx >= 0 && sy >= 0 && sx < AW && sy < AH && f.D[sy * AW + sx] <= HALF) { B.shade(x, y, 0.72); break; } } });
    } };
  }
  function straightDeck(off, z, roadOk, stairs, gaps) { // the game's own highway sprite, lamps and round columns, with escalator heads open; Edit 85: drop gaps
    gaps = gaps || [];
    const dk = { hz: true, off, z, height: z === 2 ? P['world.highHeight'] : P['world.deckHeight'], gaps: gaps.map((g) => [g.a0, g.a1, g.side]), gapLit: !!ACCESS, openings: stairs.map((st) => [st.x, st.x + st.w, st.side]) }, { S, ext } = PIX.deck(dk, P), cols = [];
    const ein = PARKGRID ? 20 : 4; // 6.2 (Edit 70): in Parkland the columns stand in under the deck, between the garden's paths
    for (let p = P['world.deckPillarSpacing'] / 2; p < W; p += P['world.deckPillarSpacing']) for (const e of [off - HALF + ein, off + HALF - ein - C]) {
      if (!roadOk(p, e + C / 2, OUTER + C + 4) || onPath(p, e + C / 2, C / 2 + 2) || (PARKGRID && stairs.some((st) => p > st.x - C - 24 && p < st.x + st.w + C + 24 && Math.abs(e + C / 2 - (st.y + st.h / 2)) < st.h / 2 + C + 24))) continue; // 6.2: and never in a flight's lee (no gap narrower than the body)
      cols.push({ cx: p, cy: e + C / 2, key: e + C, x: p - C / 2, y: e, spr: PIX.column(Math.round(C / U), Math.round(C / U), ext) });
    }
    const Lr = new PIX.Buf(AW, AH); PIX.blit(Lr, S, 0, Math.round((off - HALF) / U));
    return { dk, L: Lr, lift: ext, z, cols, front: off + HALF, openings: stairs.map((st) => ({ a0: st.x, a1: st.x + st.w, side: st.side })), gapSpans: gaps.map((g) => ({ a0: g.a0, a1: g.a1, side: g.side })), inBand: (wx, wy) => Math.abs(wy - off) < HALF + 12 };
  }
  // Edit 85 (P7.4): a highway with no planned drop breaks its parapet once over each Z0 road it crosses: one world.tileSize
  // module, centred where the road's centre line meets the parapet; south on an east–west deck, east on a north–south one (as
  // walkways, Edit 64); the other parapet where a flight's head or a link stands there. roadC: distance to a Z0 road centre line.
  function deckDropGaps(off, hz, opens, roadC) {
    const T = P['world.tileSize'], L = hz ? W : H, out = [];
    const opened = (sd, a0, a1) => opens.some((q) => q.side === sd && a1 > q.a0 - 12 && a0 < q.a1 + 12) || out.some((q) => q.side === sd && a1 > q.a0 - 12 && a0 < q.a1 + 12);
    const crossings = (sd) => { const res = []; let a0 = -1; for (let a = 0; a <= L + 2; a += 2) { const on = a <= L && roadC(hz ? a : off + sd * HALF, hz ? off + sd * HALF : a) < 8; if (on && a0 < 0) a0 = a; if (!on && a0 >= 0) { if (a - a0 <= 120) res.push((a0 + a - 2) / 2); a0 = -1; } } return res; }; // across a road, not along it
    const other = crossings(-1);
    for (const c of crossings(1)) {
      let sd = 1, cc = c;
      if (opened(1, c - T / 2, c + T / 2)) { const alt = other.reduce((b, q) => (Math.abs(q - c) < Math.abs(b - c) ? q : b), Infinity); if (Math.abs(alt - c) > 120 || opened(-1, alt - T / 2, alt + T / 2)) continue; sd = -1; cc = alt; }
      if (cc - T / 2 < SEM || cc + T / 2 > L - SEM) continue;
      out.push({ a0: cc - T / 2, a1: cc + T / 2, side: sd });
    }
    return out;
  }
  // Edit 85 (P7.4): one flight to a highway that has none (Waterfront's bridges over the valley): the side and where along the deck
  function deckFlight(off, z, side, a) {
    const run = X.stairRun(P, 0, z);
    return side > 0 ? { x: off + HALF, y: a, w: run, h: SWD, axis: 'x', low: off + HALF + run, high: off + HALF, side: 1, z } : { x: off - HALF - run, y: a, w: run, h: SWD, axis: 'x', low: off - HALF - run, high: off - HALF, side: -1, z };
  }
  // P6.4 (Edit 66): a flight's apron drawn as a mat: lit corner brackets, two chevrons pointing into the flight
  function apronMat(B, st) {
    const a = apronOf(st), x0 = Math.round(a.x / U), y0 = Math.round(a.y / U), x1 = Math.round((a.x + a.w) / U) - 1, y1 = Math.round((a.y + a.h) / U) - 1, br = mixK(CON.l, N.cyan, 0.55);
    for (const [cx, cy, sx, sy] of [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]]) for (let i = 0; i < 4; i++) { B.put(cx + sx * i, cy, br); B.put(cx, cy + sy * i, br); }
    const dir = Math.sign(st.high - st.low), ay = st.axis === 'y', mid = Math.round(ay ? (x0 + x1) / 2 : (y0 + y1) / 2), lo = ay ? y0 : x0, hi = ay ? y1 : x1;
    for (const t of [0.33, 0.66]) { const tip = Math.round(dir < 0 ? lo + (hi - lo) * t : hi - (hi - lo) * t); for (let i = 0; i < 4; i++) for (const sd of [-1, 1]) { const al = tip - dir * i, la = mid + sd * i; if (ay) B.put(la, al, N.cyan); else B.put(al, la, N.cyan); } }
  }
  // ---------- the walkway at Z1: a union of polygons, square ends where it meets a podium roof or an escalator head
  // P6.2 (Edit 64): one opening per road crossing, one world.tileSize module, centred on the road's centre line, one side only:
  // south on an east–west walkway, east on a north–south one. A straight drop lands on the centre line; steer to a lane.
  // roadC(x, y): distance to the nearest Z0 road centre line (each carriageway of a split road). P6.4 (Edit 66): the opening
  // slides along the spine (up to a lane's half) until its ends, as drawn at Z1, stand clear of the road's markings below
  // (marks: distances from the centre line: the centre line and the edge lines).
  function walkGaps(polys, roadC, marks) {
    const T = P['world.tileSize'], lift = Z1 * U, mk = marks || [0, LW];
    return polys.filter((p) => p.spine).map((p) => {
      const path = X.makePath(p.spine), gaps = [];
      if (roadC) {
        const ds = []; for (let a = 0; a <= path.length; a += 2) { const q = X.pathAt(path, a); ds.push(roadC(q.x, q.y)); }
        const clear = (a) => { const q = X.pathAt(path, a), d = roadC(q.x, q.y - lift); return Math.min(...mk.map((m) => Math.abs(d - m))); };
        for (let i = 0; i < ds.length; i++) {
          if (!(ds[i] < 8) || (i > 0 && ds[i - 1] < 8)) continue; // the start of a run over the centre line
          let j = i; while (j + 1 < ds.length && ds[j + 1] < 8) j++;
          if ((j - i) * 2 > 120) continue; // along a road, not across it
          let m = Infinity; for (let k = i; k <= j; k++) m = Math.min(m, ds[k]);
          const at = []; for (let k = i; k <= j; k++) if (ds[k] === m) at.push(k * 2);
          let c = (at[0] + at[at.length - 1]) / 2;
          let best = 0, bs = -1; for (let sft = -LW / 2 + T / 2; sft <= LW / 2 - T / 2; sft += 2) { const v = Math.min(clear(c + sft - T / 2), clear(c + sft + T / 2)); if (v > bs + 0.5 || (Math.abs(v - bs) <= 0.5 && Math.abs(sft) < Math.abs(best))) { bs = v; best = sft; } }
          c += best;
          if (c <= T || c >= path.length - T || gaps.some(([a0, a1]) => c > a0 - T && c < a1 + T)) continue;
          const q0 = X.pathAt(path, c - 2), q1 = X.pathAt(path, c + 2), tl = hyp(q1.x - q0.x, q1.y - q0.y) || 1, nx = -(q1.y - q0.y) / tl, ny = (q1.x - q0.x) / tl;
          gaps.push([c - T / 2, c + T / 2, ny + 0.5 * nx >= 0 ? 1 : -1]); // the open side, as a sign of the spine's lateral offset
        }
      }
      p.gaps = gaps;
      return { p, path, gaps };
    });
  }
  // P6.4 (Edit 66): the layer runs Z1 rows past the bottom edge, so a walkway lifted by Z1 still reaches the screen's edge; the
  // screen's edges are not the walkway's ends (it runs on next door). The handrail is magenta; an opening's ends contrast in cyan.
  const RAIL = N.magenta, RAIL_END = RAIL === N.magenta ? N.cyan : N.magenta;
  function walkwayLayer(polys, roofs, joins, colOk, roadC, under, marks) {
    const GX = 4, AHX = AH + Z1, GW2 = AW + 2 * GX, GH2 = AHX + 2 * GX, gi = (x, y) => (y + GX) * GW2 + (x + GX);
    const M = new Uint8Array(GW2 * GH2), R = new Uint8Array(GW2 * GH2), Lr = new PIX.Buf(AW, AHX), inRect = (r, wx, wy) => wx >= r[0] && wx <= r[0] + r[2] && wy >= r[1] && wy <= r[1] + r[3];
    const spines = walkGaps(polys, roadC, marks), HW = P['world.walkwayWidth'] / 2;
    const gapAt = (wx, wy) => { for (const sp of spines) { if (!sp.gaps.length) continue; const pr = X.pathProject(sp.path, wx, wy); if (Math.abs(pr.lat) < HW + 6 && sp.gaps.some(([a0, a1, sd]) => pr.s >= a0 && pr.s <= a1 && pr.lat * sd > 0)) return true; } return false; };
    for (let y = -GX; y < AHX + GX; y++) for (let x = -GX; x < AW + GX; x++) { // P6.3: the slab stops at a roof, the hill or a terrace: a clean joint at 90° or 45°
      const wx = (x + 0.5) * U, wy = (y + 0.5) * U, k = gi(x, y);
      if (polys.some((p) => PIX.inPoly(p, wx, wy))) M[k] = 1;
      if (roofs.some((r) => inRect(r, wx, wy)) || (under && under(wx, wy))) R[k] = 1; else if (joins.some((r) => inRect(r, wx, wy))) R[k] = 2;
    }
    const out = (x, y) => x < -GX || y < -GX || x >= AW + GX || y >= AHX + GX || (!M[gi(x, y)] && !R[gi(x, y)]), on = (x, y) => { const k = gi(x, y); return M[k] && !R[k]; };
    const edgeOf = (x, y) => { let edge = 9; for (let j = -3; j <= 3; j++) for (let i = -3; i <= 3; i++) if (out(x + i, y + j)) edge = Math.min(edge, Math.max(Math.abs(i), Math.abs(j))); return edge; };
    for (let y = 0; y < AHX; y++) for (let x = 0; x < AW; x++) {
      const wx = (x + 0.5) * U, wy = (y + 0.5) * U;
      if (on(x, y)) {
        const edge = edgeOf(x, y);
        if (edge <= 3 && gapAt(wx, wy)) { Lr.put(x, y, edge === 1 ? ((x + y) % 3 ? K.deckJoint : K.bldgDark) : K.deck2); continue; } // broken parapet: the slab edge shows
        if (edge <= 3 && (gapAt(wx + U, wy) !== gapAt(wx - U, wy) || gapAt(wx, wy + U) !== gapAt(wx, wy - U))) { Lr.put(x, y, RAIL_END); continue; } // snapped handrail ends, in the rail's contrast
        Lr.put(x, y, edge === 1 ? K.jerseyO : edge === 2 ? (((x + y) % 6) < 3 ? RAIL : K.jerseyTop) : edge === 3 ? K.jersey : (x + y) % 10 === 0 ? K.deckJoint : (((x >> 2) + (y >> 2)) % 2 ? K.deck : K.deck2));
        continue;
      }
      if (M[gi(x, y)] && !R[gi(x, y)]) continue;
      for (let d = 1; d <= 4; d++) if (on(x, y - d)) { Lr.put(x, y, d === 1 ? K.jerseyTop : d === 2 ? CON.m : d === 3 ? N.cyan : K.bldgOutline); break; } // fascia with an LED strip
    }
    // round columns under the walkway, on pavements and the island, never in a lane
    const cols = [], cw = P['world.walkwayColumn'];
    for (const p of polys.filter((q) => q.spine)) walk(p.spine, P['world.deckPillarSpacing'] / 2, (x, y) => {
      if (!colOk(x, y) || onPath(x, y, cw / 2 + 2) || roofs.concat(joins).some((r) => inRect([r[0] - 16, r[1] - 16, r[2] + 32, r[3] + 32], x, y)) || cols.some((q) => hyp(q.cx - x, q.cy - y) < 64)) return;
      cols.push({ cx: x, cy: y, key: y + cw / 2, x: x - cw / 2, y: y - cw / 2, spr: PIX.column(Math.round(cw / U), Math.round(cw / U), Z1) });
    });
    return { L: Lr, lift: Z1, z: 1, cols, front: 1e6, walk: true, polys, roofs, joins, under, spines, gapAt, inBand: (wx, wy) => { const x = Math.floor(wx / U), y = Math.floor(wy / U); return x >= 0 && y >= 0 && x < AW && y < AH && M[gi(x, y)] === 1; }, shadeOn: (B) => {
      const k = P['proto.art.shadowScale'], hgt = P['world.deckHeight'], ox = PIX.SUN.x * hgt * k / U, oy = PIX.SUN.y * hgt * k / U;
      each((x, y) => { for (const t of [0.5, 1]) { const sx = Math.round(x - ox * t), sy = Math.round(y - oy * t); if (sx >= -GX && sy >= -GX && sx < AW + GX && sy < AHX + GX && M[gi(sx, sy)] && !R[gi(sx, sy)]) { B.shade(x, y, 0.66); break; } } });
    } };
  }
  // the monument (art px): stepped base, banded white shaft, clock face, crown and spire, a ring of lamp posts
  function drawMonument(Bf, cx, cy) {
    const x0 = Math.round(cx / U), y0 = Math.round(cy / U), Ht = 58;
    for (let t = 0; t < 40; t++) for (let j = -4; j <= 4; j++) Bf.shade(x0 - t * 0.7 + j * 0.7, y0 + t * 0.7 + j * 0.7, 0.75);
    for (const [rx, ry, lift, c] of [[16, 7, 0, N.stoneD], [13, 6, 2, N.stone], [10, 5, 4, N.stoneL]]) PIX.ellipse(x0, y0 - lift, rx, ry, (x, y) => Bf.put(x, y, c));
    for (let h = 4; h < Ht; h++) for (let i = -4; i <= 4; i++) { const u = i / 4.5; Bf.put(x0 + i, y0 - h, h % 10 === 0 ? N.stoneD : u < -0.4 ? N.stoneL : u < 0.4 ? N.stone : N.stoneD); }
    for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) if (i * i + j * j <= 5) Bf.put(x0 + i, y0 - Ht + 8 + j, i * i + j * j <= 1 ? K.white : N.cyan);
    for (let h = 0; h < 6; h++) for (let i = -5 + Math.floor(h / 2); i <= 5 - Math.floor(h / 2); i++) Bf.put(x0 + i, y0 - Ht - h, h < 2 ? N.stoneD : N.stoneL);
    for (let h = 6; h < 12; h++) Bf.put(x0, y0 - Ht - h, h > 9 ? N.cyan : N.stoneL);
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, lx = Math.round(x0 + Math.cos(a) * 20), ly = Math.round(y0 + Math.sin(a) * 9); for (let h = 0; h < 6; h++) Bf.put(lx, ly - h, K.jerseyTop); Bf.put(lx, ly - 6, K.white); }
  }
  // Monument B2: the road splits round the monument's island. Two one-way lanes, 45° tapers, fillets 96 (no buses).
  function splitRoad(cy) {
    const o = P['world.splitLaneOffset'], h = LW / 2, d = o - h, xa = 120, xb = W - 120;
    const E = fil([[-200, cy + h], [xa, cy + h], [xa + d, cy + o], [xb - d, cy + o], [xb, cy + h], [W + 200, cy + h]]);
    const Wl = fil([[W + 200, cy - h], [xb, cy - h], [xb - d, cy - o], [xa + d, cy - o], [xa, cy - h], [-200, cy - h]]);
    return { E, Wl };
  }
  function paintSplit(B, E, Wl) { // asphalt, kerbs, centre dashes on the shared stretch, hatched gores, pavements; returns the margin field
    const fE = PIX.roadField([{ pts: E }], 240), fW = PIX.roadField([{ pts: Wl }], 240), m = new Float32Array(AW * AH), h = LW / 2;
    each((x, y, wx, wy, k) => {
      const a = fE.D[k], b = fW.D[k], lane = Math.max(h - a, h - b), pair = LW - (a + b) / 2, mm = Math.max(lane, pair); m[k] = mm;
      if (mm <= -P['proto.shoulderWidth']) return;
      if (mm < 0) { B.put(x, y, mm > -U || ((fE.S[k] % 12) + 12) % 12 < U ? N.pave2 : N.pave); return; }
      let c = (Math.imul(x * 73856093 ^ y * 19349663, 2654435761) >>> 0) % 100 < 7 ? K.road2 : K.road;
      if (mm < U) c = K.kerb; else if (mm < 2 * U) c = K.kerb2;
      else if (lane < 0 && pair > 0) { if (((x - y) % 6 + 6) % 6 < 2) c = K.lane; } // gore: hatched where the lanes part
      else if (Math.abs(a - b) < U && a + b < LW + 2 && ((fE.S[k] % 36) + 36) % 36 < 20) c = K.lane;
      B.put(x, y, c);
    });
    return m;
  }
  // ---------- level design (Edit 52). Each district is planned in district coordinates (3 × 3 screens of 800 × 640).
  // Every tile reveals its own mechanic and landmark. Roads and highways cross at 90° or 45°; highways may run across,
  // down or at 45°. Every roundabout has three or more arms, and its inner lane is the orbit lane (traffic.ringOrbit).
  const R96 = P['world.roundaboutEntryRadius'], RB = P['vehicles.bus.minRadius'];
  const fil = (pts, r) => X.filletAny(pts, r || R96, 0);
  const loop2 = (pts) => pts.concat(pts.slice(1)); // a closed road twice round: every screen clips one unbroken run
  const DISTRICTS = [
    { id: 'parkland', name: 'Parkland', quota: P['world.district.parkland.quota'], storeys: [2, 5], start: ['B2', 'center'], // P6.1: every district starts in its centre tile
      mood: 'Calm, water, concrete and planting. Two Z1 highways meet at a four-arm ring over the pools; a 45° boulevard passes beneath.',
      roads: [{ id: 'boulevard', pts: [[40, -200], [2360, 2120]] }, { id: 'loop', pts: fil([[527, 287], [400, 414], [400, 1736], [1636, 1736], [1806, 1566], [2206, 1166], [1760, 720], [1760, -200]], [0, RB, RB, 96, RB, RB, RB, 0]) }], // Edit 56: joins the boulevard at 90° in A1; meets it at a roundabout in C3
      junctions: [{ tile: 'A1', at: [527, 287], major: 'boulevard' }],
      roundabouts: [{ tile: 'C3', at: [206, 286], arms: ['NW', 'NE', 'SE', 'SW'], bends: { SW: { dir: [-1, 0], at: 240.3, Rb: 96 } } }], // Edit 56: the four-way takes a street roundabout; the street's SW arm turns west outside it
      ring: { tile: 'B2', z: 1, arms: ['W', 'N', 'E', 'S'] },
      decks: [{ hz: true, at: 996, z: 1 }, { hz: false, at: 1200, z: 1 }], park: true, // Edit 55.2: row 2 at 996 so the lifted B2 ring draws at the screen's centre
      deckLinks: { B1: [{ y: 304, h: 32, side: -1 }, { y: 304, h: 32, side: 1 }] }, // Edit 55.2: the Z1 walkway joins the B1 highway at both parapets (P6: at the walkway's footprint; the deck lifts as every floor)
      tiles: {
        A1: ['Start, top edge. The 45° boulevard; the avenue curves to join it at 90° and gives way. The Z1 walkway from B1 lands by escalator', 'Reservoir terraces: three stepped pools', 'both'],
        B1: ['The Z1 highway runs north–south; escalators west (north end) and east (south end). A Z1 walkway crosses the garden and joins the highway at both parapets. The boulevard cuts the corner', 'Cascade: water steps beside the highway', 'both'],
        C1: ['The avenue under a Z1 footbridge that runs west to the B1 highway; escalator at its east end; drop onto cars', 'Lantern pavilion', 'both'],
        A2: ['The avenue passes under the Z1 highway at 90°; escalators north (west end) and south (east end)', 'Canal along the highway', 'both'],
        B2: ['Four-arm Z1 roundabout (W, N, E, S). Give way to the ring; the inner lane is the orbit lane. The boulevard passes beneath, through the hole', 'Reflecting pools under the ring', 'both'],
        C2: ['The avenue comes up from the C3 roundabout at 45°, turns 90° and passes under the Z1 highway at 45°', 'Amphitheatre terraces', 'both'],
        A3: ['A wide R160 bend (buses may use it)', 'Belvedere: four tiers and a stair up to a lawn, the monolith orchard on top', 'both'],
        B3: ['The garden street passes under the Z1 highway at 90°; escalators', 'Sculpture court: a large obelisk, two rings, a row of lit bollards', 'both'],
        C3: ['Street roundabout where the street meets the boulevard: four arms at 90°, the street turning west outside it', 'Sculpture court at grade: a large arch, two medium pieces, a row of lit bollards', 'scenery'] } },
    { id: 'monument', name: 'Monument', quota: P['world.district.monument.quota'], storeys: [6, 12], start: ['B2', 'center'],
      mood: 'Neon commerce, LED walls. One road snakes under two north–south highways and splits round the monument.',
      roads: [{ id: 'snake', pts: fil([[-200, 320], [2240, 320], [2240, 864], [2144, 960], [240, 960], [240, 1504], [336, 1600], [1120, 1600], [1280, 1760], [2600, 1760]]) }],
      split: { tile: 'B2' },
      decks: [{ hz: false, at: 560, z: 1 }, { hz: false, at: 1840, z: 2, escY: { C1: [80, 184] } }], // P6.3: C1's flights both north of the road (east side), clear of the drum
      chongqing: { tile: 'C2', tower: [112, 140, 256, 90], storeys: 12, plaza: [16, 530, 144, 100], link: [554, 610] }, // P6: the link at the plaza's footprint (the deck lifts by Z2) // Edit 54: the Z2 highway runs through a tower; a roof plaza opens off it
      tiles: {
        A1: ['Start, west edge. The road passes under the Z1 highway (north–south) at 90°; escalators', 'LED-wall tower facing the entry', 'both'],
        B1: ['A Z1 skybridge crosses the road at 90°, from a podium roof to the walkway ring', 'Podium and tower at the bridge head', 'both'],
        C1: ['Under the Z2 highway at 90°, then an R96 bend south; Z2 escalators (run 112)', 'LED drum tower in the bend', 'both'],
        A2: ['Under the Z1 highway at 90°, then an R96 bend south', 'Neon arcade along the road', 'both'],
        B2: ['The road splits round the monument\'s island; the walkway ring bridges both lanes at Z1; skybridge north', 'The monument', 'both'],
        C2: ['A 45° corner cut, then under the Z2 highway at 90°. The highway runs through a tower; a roof plaza at Z2 opens off its parapet, and an escalator drops from the plaza to the street', 'Portal tower and roof plaza (Chongqing)', 'both'],
        A3: ['A 45° corner cut, then under the Z1 highway at 90°', 'Stacked LED cubes, each cantilevered off the one below', 'both'],
        B3: ['A 45° jog between two LED walls; a Z1 skybridge crosses the jog at 90°', 'LED canyon and its skybridge', 'both'],
        C3: ['Under the Z2 highway at 90°; the exit through an LED gateway', 'LED gateway arch over the road', 'both'] } },
  ];
  const TILE = (c, r) => 'ABC'[c] + (r + 1);
  // ---------- 2 Waterfront (P6, Edit 62): the valley by the river, built from its plan (circus_valley.js, Edits 58–61).
  // A hill at Z1 walled by towers along the top edge; the valley avenue through the circus; a tunnel north from the cove;
  // two bridges from the ridge road straight south over the valley, the beach, the coastal drive and the river.
  const VG = V.geo, VP = V.PLAN, VR = V.check(VP), ZH = P['world.deckHeight'], RZ = VG.RIVER * ZH, RIV = EXT(-RZ); // the river surface, RIV art px below Z0
  const HILLP = VG.NORTH_POLY, RIVERP = VG.RIVER_POLY, LANDP = VG.LAND_POLY, MOUTH = VP.mouth, SUNX = PIX.SUN.x, SUNY = PIX.SUN.y, SHK = P['proto.art.shadowScale'];
  function polyMask(poly) { // P6: the polygon rasterised once at art-px centres in district coordinates (scanline, even-odd)
    const x0 = -W, y0 = -H, nw = Math.round(5 * W / U), nh = Math.round(5 * H / U), M = new Uint8Array(nw * nh);
    for (let j = 0; j < nh; j++) {
      const y = y0 + (j + 0.5) * U, xs = [];
      for (let i = 0, k = poly.length - 1; i < poly.length; k = i++) { const a = poly[i], c = poly[k]; if ((a[1] > y) !== (c[1] > y)) xs.push((c[0] - a[0]) * (y - a[1]) / (c[1] - a[1]) + a[0]); }
      xs.sort((p, q) => p - q);
      for (let n = 0; n + 1 < xs.length; n += 2) { const i0 = Math.max(0, Math.ceil((xs[n] - x0) / U - 0.5)), i1 = Math.min(nw - 1, Math.ceil((xs[n + 1] - x0) / U - 0.5) - 1); for (let i = i0; i <= i1; i++) M[j * nw + i] = 1; }
    }
    return (dx, dy) => { const i = Math.floor((dx - x0) / U), j = Math.floor((dy - y0) / U); return i < 0 || j < 0 || i >= nw || j >= nh ? PIX.inPoly(poly, dx, dy) : M[j * nw + i] === 1; };
  }
  const inHill = polyMask(HILLP), inRiver = polyMask(RIVERP);
  const HILL_SOLID = (() => { // the hill as a Z0 solid, the tunnel cut through it from the cove head to beyond the top edge
    const out = [[-200, -260], [2600, -260]];
    for (const p of VG.NORTH.slice().reverse()) { out.push(p); if (p[0] === 1360 && p[1] === 360) out.push([MOUTH[0] + OUTER, 360], [MOUTH[0] + OUTER, -400], [MOUTH[0] - OUTER, -400], [MOUTH[0] - OUTER, 360]); }
    return out;
  })();
  const WROAD = (id) => VP.roads.find((r) => r.id === id), RIDGE = WROAD('North Ridge Road');
  const BRIDGE_GAPS = [[920, 1000], [1400, 1480], [1740, 1820]]; // broken parapets: over the avenue, over the drive, over the river (drops)
  const WATER = { id: 'waterfront', name: 'Waterfront', quota: P['world.district.waterfront.quota'], storeys: [4, 10], start: ['B2', 'center'],
    mood: 'A hill walled by towers; a river below. The valley avenue meets the tunnel and the beach road at the circus; the hill\'s bridges cross the drive and the river.',
    roads: VP.roads.filter((r) => r.z === 0).map((r) => ({ id: r.id, pts: r.pts })), // Valley Avenue, North Tunnel, Beach Road, Coastal Drive
    junctions: [{ tile: 'B3', at: [400, 320], major: 'Coastal Drive' }],
    roundabouts: [{ tile: 'B2', at: [400, 320], arms: ['W', 'N', 'E', 'S'] }],
    decks: ['West Bridge', 'East Bridge'].map((id) => ({ hz: false, at: WROAD(id).pts[0][0], z: 1, rows: [1, 2], from: 760, noEsc: true, gaps: BRIDGE_GAPS, esc1: id === 'West Bridge' ? { A2: [-1, 552] } : { C2: [1, 552] } })), // Edit 85: a flight up from the beach
    hill: { roads: [{ id: RIDGE.id, pts: RIDGE.pts }].concat(['West Bridge', 'East Bridge'].map((id) => ({ id, pts: [WROAD(id).pts[0], [WROAD(id).pts[0][0], 900]] }))),
      junctions: [{ tile: 'A1', at: [400, 240], major: RIDGE.id }, { tile: 'C1', at: [400, 240], major: RIDGE.id }], sims: ['A1', 'B1', 'C1'] },
    tiles: Object.fromEntries(Object.entries(VP.tiles).map(([k, v]) => [k, [v[0], v[1], 'both']])) };
  // the plan's stairs as the kit's flights (district → screen coordinates): x/y/w/h, axis, low (foot) and high (head), z
  function flight(head, foot, z) {
    const ax = head[1] === foot[1] ? 'x' : 'y', a = ax === 'x' ? Math.min(head[0], foot[0]) : head[0] - SWD / 2, b = ax === 'x' ? head[1] - SWD / 2 : Math.min(head[1], foot[1]);
    return { x: a, y: b, w: ax === 'x' ? Math.abs(head[0] - foot[0]) : SWD, h: ax === 'y' ? Math.abs(head[1] - foot[1]) : SWD, axis: ax, low: ax === 'x' ? foot[0] : foot[1], high: ax === 'x' ? head[0] : head[1], side: ax === 'x' ? 0 : 1, z: z || 1 };
  }
  const WSTAIRS = (() => { // every flight in the district: cliff escalators (A2, C2 from the plan; B2 on the straight wall), bridge escalators (A3, C3), the cove's two stairs, terrace and landing stairs
    const R1 = X.stairRun(P, 0, 1), out = [];
    for (const e of VR.esc) if (['A2', 'C2'].includes(e.tile)) out.push(flight(e.head, e.foot));
    for (const x of [840, 1560]) out.push(flight([x, 760], [x, 760 + R1])); // B2: on the straight wall either side of the flares
    for (const bx of [400, 2000]) { out.push(flight([bx - HALF, 1348], [bx - HALF - R1, 1348])); out.push(flight([bx + HALF, 1348], [bx + HALF + R1, 1348])); } // A3, C3: up to the bridge from the beach, one each side (P6.3: drawn inside A3, C3)
    for (const st of VP.coveStairs) out.push(flight(st.head, st.foot));
    for (const b of VP.buildings) if (b.stair) out.push(flight(b.stair.head, b.stair.foot));
    return out;
  })();
  const lvl0 = (c, extra) => Object.assign({ center: c, ring: null, statics: [], spawns: [], coneHomes: [], patches: [], decks: [], floors: [], canal: false, solid: [] }, extra || {});
  const SAND = [c32('#4B4946'), c32('#5C5A57'), c32('#3E3C3A')], WAT = [N.water, N.water2, c32('#0C1830')];
  // a deck on pilotis (beach terrace, beach landing): slab at Z1, columns to the sand, an optional canopy, a planter; art px
  function terraceSprite(w, h, canopy, led) {
    const top = Z1 + (canopy ? 7 : 0) + 2, S = { w: w + 2, h: h + top + 2, ox: 0, oy: top, d: new Uint32Array((w + 2) * (h + top + 2)) };
    const put = (x, y, c) => { const X0 = x, Y0 = y + top; if (X0 >= 0 && Y0 >= 0 && X0 < S.w && Y0 < S.h) S.d[Y0 * S.w + X0] = c; };
    for (let y = h - Z1 + 3; y < h - 1; y++) for (let x = 2; x < w - 2; x++) put(x, y, y === h - 2 ? CON.x : (x % 6 === 0 ? CON.x : (y - h + Z1) % 5 === 4 ? CON.d : c32('#2A2F3A'))); // P6.3: the recessed ground floor (solid)
    for (const cx of [3, Math.round(w / 2), w - 5]) for (let z = 2; z < Z1; z++) for (let i = 0; i < 3; i++) put(cx + i, h - 3 - z, i === 2 ? K.columnD : K.column); // pilotis under the front edge
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) put(x, y - Z1, x === 0 || x === w - 1 || y === 0 ? CON.l : (x % 8 === 0 || y % 8 === 0) ? N.pave2 : N.pave); // the deck, lifted
    for (let x = 0; x < w; x++) { put(x, h - Z1, led); put(x, h - Z1 + 1, CON.m); put(x, h - Z1 + 2, CON.x); } // its LED front edge and slab face
    const px = 4, py = h - 14; for (let y = 0; y < 8; y++) for (let x = 0; x < 12; x++) put(px + x, py + y - Z1 - 2, y === 7 ? CON.m : x === 0 || x === 11 || y === 0 ? CON.l : (x * 3 + y) % 5 ? CON.g : CON.g2); // a planter on the deck
    if (canopy) { const x0 = Math.round(w * 0.5), y1 = Math.round(h * 0.62); for (const cx of [x0 + 1, w - 3]) for (let z = 0; z < 6; z++) put(cx, y1 - Z1 - z, CON.l); for (let y = 4; y < y1; y++) for (let x = x0; x < w - 2; x++) put(x, y - Z1 - 7, y === y1 - 1 ? N.magenta : (x - x0) % 5 === 0 ? N.stoneD : c32('#B9C2C8')); }
    return S;
  }
  // a Chongqing hanging house over the water: braced stilts from the river, three storeys with balconies, a roof terrace at Z1 under a canopy
  function stiltSprite(w, h, led) {
    const base = RIV, top = Z1 + 8, S = { w: w + 2, h: h + top + base + 2, ox: 0, oy: top, d: new Uint32Array((w + 2) * (h + top + base + 2)) };
    const put = (x, y, c) => { const Y0 = y + top; if (x >= 0 && Y0 >= 0 && x < S.w && Y0 < S.h) S.d[Y0 * S.w + x] = c; };
    const z12 = EXT(12), floorZ = (k) => z12 + k * EXT(P['world.storeyHeight']); // house floors from Z0 + 12
    for (let x = 2; x < w - 2; x += Math.max(4, Math.round((w - 4) / 5))) for (let y = h - 1 + base; y > h - 1 - z12; y--) { put(x, y, K.columnD); put(x + 1, y, K.column); } // stilts from the water
    for (let x = 2; x + 6 < w - 2; x += 6) for (let t = 0; t < 6; t++) { put(x + t, h - 1 + base - t, CON.l); put(x + 6 - t, h - 1 + base - t, CON.l); } // bracing
    const roofY = h - Z1; // the roof (terrace) at Z1
    for (let y = h - 1 - z12; y >= roofY; y--) for (let x = 1; x < w - 1; x++) { const k = h - 1 - z12 - y, f = k % EXT(P['world.storeyHeight']); put(x, y, f === 0 ? CON.l : f < 3 && (x * 7 + y) % 9 < 5 ? (x % 4 ? N.cyan : K.white) : c32('#2A3245')); } // the front face: balconies and lit windows
    for (let y = 0; y < h - 10; y++) for (let x = 0; x < w; x++) put(x, y - Z1, x === 0 || x === w - 1 || y === 0 ? CON.l : (x % 6 === 0 || y % 6 === 0) ? N.pave2 : N.pave); // roof terrace
    for (let x = 0; x < w; x++) put(x, h - 10 - Z1, led);
    const cx0 = Math.round(w * 0.45); for (const cx of [cx0, w - 3]) for (let z = 0; z < 6; z++) put(cx, h - 16 - Z1 - z, CON.l);
    for (let y = 3; y < h - 16; y++) for (let x = cx0; x < w - 2; x++) put(x, y - Z1 - 7, y === h - 17 ? N.magenta : (x - cx0) % 5 === 0 ? N.stoneD : c32('#B9C2C8')); // the canopy
    return S;
  }
  // the tunnel portal (Edit 61): a concrete frame 8 proud of the cove head wall, flush with the hilltop; its opening transparent
  function portalSprite() {
    const pw = 8, wO = Math.round(2 * OUTER / U), w = wO + 2 * pw, hFace = Z1 + 4, S = { w, h: hFace + 6, ox: Math.round(w / 2), oy: hFace + 2, d: new Uint32Array(w * (hFace + 6)) };
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < S.w && y < S.h) S.d[y * S.w + x] = c; }, open = EXT(0.7 * ZH);
    for (let y = 0; y < 6; y++) for (let x = 0; x < w; x++) put(x, y, y === 0 ? N.stoneL : CON.l); // coping
    for (let y = 6; y < hFace + 6; y++) for (let x = 0; x < w; x++) {
      const inOpen = x >= pw && x < w - pw && y >= hFace + 6 - open;
      if (inOpen) continue;
      put(x, y, x % 4 === 0 ? CON.d : y === hFace + 6 - open - 1 && x >= pw && x < w - pw ? N.cyan : CON.m);
    }
    for (const lx of [Math.round(pw / 2), w - Math.round(pw / 2) - 1]) { put(lx, hFace - 6, K.white); put(lx + 1, hFace - 6, K.white); put(lx, hFace - 5, N.cyan); put(lx + 1, hFace - 5, N.cyan); } // lamps on the pillars
    return S;
  }
  // the Waterfront's terrain, Z1 layer, Z1 streets and their traffic, and every flight, before the kit draws stairs
  function waterPre(sc, B, name, roadOk, runs) {
    const ox = sc.ox, oy = sc.oy, D = sc.D, hrun = [];
    for (const r of D.hill.roads) { const run = clipRun(shift(r.pts, -ox, -oy), -200, -200, W + 200, H + 200); if (run) hrun.push({ id: r.id, pts: run }); }
    const J = D.hill.junctions.find((j) => j.tile === name), simHere = D.hill.sims.includes(name);
    let hb = null, hroads = [];
    if (J) { const { arms, major } = junctionArms(hrun, J.at, J.major), geo = L.junction(X, P, arms, major, P['world.junctionTurnRadius']), s = labSim(geo, 'nobus', {}); sc.hillSim = s; hb = PIX.ground(lvl0(geo.center, { arms: geo.arms, surfaces: geo.roads, giveWays: s.lab.geo.stops }), P, 61 + sc.col); hroads = geo.roads; }
    else if (hrun.length) { const center = hrun[0].pts, lanes = hrun.length > 1 ? [].concat(...hrun.map((r) => X.lanesOf(r.pts, P))) : null; if (simHere) sc.hillSim = sceneSim(center, [], [], lanes, false); hb = PIX.ground(lvl0(center, { arms: hrun.length > 1 ? hrun.map((r) => r.pts) : undefined, surfaces: hrun.length > 1 ? [] : undefined }), P, 63 + sc.col); hroads = hrun.map((r) => r.pts); }
    const rf = hroads.length ? PIX.roadField(hroads.map((pts) => ({ pts, dash: false })), OUTER + 40) : null;
    sc.hillRuns = hrun; sc.hillOk = (wx, wy, m) => { if (!rf) return true; const k = Math.floor(wy / U) * AW + Math.floor(wx / U); return k < 0 || k >= AW * AH || rf.D[k] > m; };
    // ground (Z0): valley paving, the beach, the river and its seawall face, the cliff faces, the tunnel's mouth; shadows (option 2)
    const face = EXT(ZH), mouthY = MOUTH[1], inMouth = (dx, dy) => dx > MOUTH[0] - OUTER && dx < MOUTH[0] + OUTER && dy <= mouthY + 2 && dy > mouthY - ZH;
    each((x, y, wx, wy) => {
      const dx = wx + ox, dy = wy + oy;
      if (inHill(dx, dy)) {
        const below = dy + face * U; // the south face shows where the hill ends within a lift below
        if (!inHill(dx, below)) {
          if (inMouth(dx, dy)) { B.shade(x, y, 0.35 + 0.5 * Math.max(0, Math.min(1, (mouthY - dy) / (face * U)))); return; } // the tunnel floor, darkening inward
          B.put(x, y, (x % 6 === 0) ? CON.x : (y % 12 === 0 ? CON.x : ((x * 5 + y * 3) % 23 === 0 ? CON.t : CON.d)));
        }
        return;
      }
      if (inRiver(dx, dy)) {
        if (!inRiver(dx, dy - RIV * U)) { B.put(x, y, x % 5 === 0 ? CON.x : CON.d); return; } // the seawall's front, the river below it
        let c = (y % 4 === 0 && (x * 5 + y) % 11 < 4) ? WAT[1] : WAT[0]; if ((x * 3 + y * 7) % 97 === 0) c = LEDS[(x + y) % LEDS.length];
        B.put(x, y, c);
        for (const t of [0.5, 1]) if (!inRiver(dx - SUNX * (-RZ) * SHK * t, dy - SUNY * (-RZ) * SHK * t)) { B.shade(x, y, 0.62); break; } // the land's shadow on the water
        return;
      }
      if (roadOk(wx, wy, OUTER)) B.put(x, y, dy >= VG.BEACH ? SAND[(x * 7 + y * 13) % 11 === 0 ? 1 : (x * 3 + y * 5) % 17 === 0 ? 2 : 0] : (x % 8 === 0 || y % 8 === 0) ? N.tile2 : N.tile);
      for (const t of [0.5, 1]) if (inHill(dx - SUNX * ZH * SHK * t, dy - SUNY * ZH * SHK * t)) { B.shade(x, y, 0.62); break; } // the hill's shadow at the cliff foot
    });
    // the hill: a layer at Z1. Plaza paving, the Z1 streets, a stone coping and an LED line along every edge
    const HB = new PIX.Buf(AW, AH);
    each((x, y, wx, wy, k) => {
      const dx = wx + ox, dy = wy + oy; if (!inHill(dx, dy)) return;
      let c = rf && rf.D[k] <= OUTER + 1 ? hb.d[k] : paveC(x, y);
      const e = [[2 * U, 0], [-2 * U, 0], [0, 2 * U], [0, -2 * U]].some(([a, b]) => !inHill(dx + a, dy + b) && dx + a > 0 && dx + a < 3 * W && dy + b > 0);
      if (e) c = [[U, 0], [-U, 0], [0, U], [0, -U]].some(([a, b]) => !inHill(dx + a, dy + b)) ? ((x + y) % 4 < 2 ? N.cyan : K.jerseyTop) : N.stoneD;
      HB.put(x, y, c);
    });
    const front = name === 'B1' ? MOUTH[1] + 8.5 - oy : Math.max(...[0, 200, 400, 600, 800].map((x) => { let y = H + 1; while (y > -200 && !inHill(x + ox, y + oy)) y -= 4; return y; })) + 0.5;
    const hill = { L: HB, lift: Z1, z: 1, cols: [], front: Math.min(H + 1, front), hill: true, props: [], inBand: (wx, wy) => inHill(wx + ox, wy + oy) };
    // the hill's buildings: edge wall, hill blocks, portal blocks over the bridges (P6: drawn on every screen they reach)
    const box = (r) => r[0] - ox < W + 40 && r[0] + r[2] - ox > -40 && r[1] - oy < H + 120 && r[1] + r[3] - oy > -40;
    VP.buildings.filter((b) => b.base === 1 && box(b.rect)).forEach((b, i) => {
      const [x, y, w, h] = b.rect, lx = x - ox, ly = y - oy, led = LEDS[(i + 1) % LEDS.length];
      if (b.type === 'edge') {
        const xs = b.cuts.concat([x + w]); let x0 = x;
        b.segs.forEach((n, j) => { const x1 = xs[j], sw = x1 - x0, sy = j % 2 ? 0 : 6, sh = h - sy - (j % 3 === 1 ? 10 : 0), S = PIX.building(Math.round(sw / U), Math.round(sh / U), n * EXT(P['world.storeyHeight']), PIX.rng(401 + j * 7), LEDS[j % LEDS.length], n);
          hill.props.push({ spr: S, x: (x0 - ox) / U, y: (sy - oy) / U, by: sy + sh - oy }); sc.solidsZ.push({ x: x0 - ox, y: sy - oy, w: sw, h: sh, z: 1 }); x0 = x1; });
        b.towers.forEach((t, j) => { const seg = b.segs[Math.max(0, xs.findIndex((c) => c > t[0] + t[2] / 2))], pod = seg * EXT(P['world.storeyHeight']), Ht = (t[4] - seg) * EXT(P['world.storeyHeight']);
          hill.props.push({ spr: ledPanel(PIX.building(Math.round(t[2] / U), Math.round(t[3] / U), Ht, PIX.rng(431 + j * 13), LEDS[(j + 2) % LEDS.length], t[4] - seg), Ht, [N.magenta, N.cyan]), x: (t[0] - ox) / U, y: (t[1] - oy) / U - pod, by: t[1] + t[3] - oy + 0.5 }); });
      } else if (b.type === 'block') {
        const Hh = b.storeys * STY; brutalShadow(HB, lx / U, ly / U, w / U, h / U, Math.round(Hh * 0.55), null);
        hill.props.push({ spr: brutal(w / U, h / U, Hh, PIX.rng(451 + i * 17), led, null, 'n', ['ziggurat', 'slab', 'cantilever', 'twin'][i % 4]), x: lx / U, y: ly / U, by: ly + h });
        sc.solidsZ.push({ x: lx, y: ly, w, h, z: 1 });
      } else if (b.type === 'portal') { // the bridge passes under, one storey clear: the opening cut from the sprite's lower face
        const Hh = b.storeys * STY, S = PIX.building(Math.round(w / U), Math.round(h / U), Hh, PIX.rng(471 + i), led, b.storeys), b0 = Math.round((b.gap[0] - x) / U), b1 = Math.round((b.gap[1] - x) / U);
        for (let j = S.h - STY; j < S.h; j++) for (let ii = b0; ii < b1; ii++) S.d[j * S.w + ii] = 0;
        for (let ii = b0 - 1; ii <= b1; ii++) { const j = S.h - STY - 1; if (j >= 0) S.d[j * S.w + Math.max(0, Math.min(S.w - 1, ii))] = N.cyan; } // a lit soffit line
        brutalShadow(HB, lx / U, ly / U, w / U, h / U, Math.round(Hh * 0.45), null);
        hill.props.push({ spr: S, x: lx / U, y: ly / U, by: ly + h, portal: [b.gap[0] - ox, b.gap[1] - ox] });
        sc.solidsZ.push({ x: lx, y: ly, w: b.gap[0] - x, h, z: 1 }, { x: b.gap[1] - ox, y: ly, w: x + w - b.gap[1], h, z: 1 });
      }
    });
    sc.layers.push(hill); sc.hillLayer = hill;
    // flights on this screen, and the screen's terrain for play: the hill floor, the hill as a Z0 solid with the tunnel cut, the river
    for (const st of WSTAIRS) { const q = Object.assign({}, st, { x: st.x - ox, y: st.y - oy, low: st.low - (st.axis === 'x' ? ox : oy), high: st.high - (st.axis === 'x' ? ox : oy) }); if (q.x + q.w > 0 && q.x < W && q.y + q.h > 0 && q.y < H) sc.stairs.push(q); }
    sc.floorsX.push({ kind: 'hill', z: 1, poly: shift(HILLP, -ox, -oy), layer: hill, drop: true });
    sc.polys0.push(shift(HILL_SOLID, -ox, -oy));
    sc.waterPolys.push(shift(RIVERP, -ox, -oy));
    if (name === 'B1') sc.props.push({ spr: portalSprite(), x: (MOUTH[0] - ox) / U, y: (MOUTH[1] + 8 - oy) / U, by: MOUTH[1] + 8 - oy, key: MOUTH[1] + 8 - oy }); // the portal frame, in front of the tunnel's cars
    if (name === 'B1') for (const sx of [-1, 1]) captureRect(MOUTH[0] - ox + sx * (OUTER + 8) - 8, MOUTH[1] - oy - 2, 16, 12, 'portal'); // its pillars
  }
  // the Waterfront's shore: terraces and landings on pilotis, stilt houses, pier towers, the beach park, walkways at Z1
  function waterTile(sc, B, name, roadOk, free, rng, runs) {
    const ox = sc.ox, oy = sc.oy, u = (v) => v / U, box = (r) => r[0] - ox < W && r[0] + r[2] - ox > 0 && r[1] - oy < H && r[1] + r[3] - oy > 0;
    VP.buildings.filter((b) => b.base !== 1 && box(b.rect)).forEach((b, i) => {
      const [x, y, w, h] = b.rect, lx = x - ox, ly = y - oy, led = LEDS[(i + 2) % LEDS.length];
      if (b.type === 'terrace' || b.type === 'landing') {
        sc.props.push({ spr: terraceSprite(Math.round(w / U), Math.round(h / U), b.type === 'terrace', led), x: u(lx), y: u(ly), by: ly + h, floorKey: true, bldg: b.type });
        sc.floorsX.push({ kind: 'terrace', z: 1, x: lx, y: ly, w, h, key: ly + h + 0.6, drop: true });
        captureRect(lx, ly, w, h, 'block'); sc.props[sc.props.length - 1].plan = [lx, ly, w, h]; // P6.3 (Edit 65): solid to its plan at Z0, the ground floor recessed behind the pilotis
        brutalShadow(B, u(lx), u(ly), u(w), u(h), Z1, null);
      } else if (b.type === 'stilt') {
        sc.props.push({ spr: stiltSprite(Math.round(w / U), Math.round(h / U), led), x: u(lx), y: u(ly), by: ly + h, bldg: 'stilt house' });
        sc.floorsX.push({ kind: 'roof', z: 1, x: lx + 2, y: ly, w: w - 4, h: h - 20, key: ly + h + 0.6, drop: true });
      } else if (b.type === 'pier') {
        const plinth = Z1 + RIV, Hh = (b.storeys - 2) * STY, S0 = PIX.building(Math.round(w / U), Math.round(h / U), plinth, PIX.rng(491 + i), CON.l, 2); // P6.3: the plinth's roof at Z1
        if (ART()) customsSign(S0, plinth); // Edit 92: the pier towers are customs posts
        sc.props.push({ spr: S0, x: u(lx), y: u(ly) + RIV, by: ly + h, bldg: 'pier', plan: [lx, ly, w, h] }); // the plinth, its foot in the water
        sc.props.push({ spr: brutal(u(w - 36), u(h - 38), Hh, PIX.rng(497 + i), led, null, 'n', 'slab'), x: u(lx + 18), y: u(ly + 12) - Z1, by: ly + h + 0.2 });
        sc.floorsX.push({ kind: 'roof', z: 1, x: lx, y: ly, w, h, key: ly + h + 0.6, drop: true }); sc.solidsZ.push({ x: lx + 18, y: ly + 12, w: w - 36, h: h - 38, z: 1 }); // the walkway lands on the plinth roof
      }
    });
    for (const q of VP.props) { const [x, y] = q.at, lx = x - ox, ly = y - oy; if (lx < -40 || lx > W + 40 || ly < -40 || ly > H + 40) continue;
      if (q.kind === 'planter') planter(B, lx, ly, P['world.gardenPlanter'] / 2, P['world.gardenPlanter'] / 2, 'grass', LEDS[1]);
      else if (q.kind === 'obelisk' || q.kind === 'arch') sculpture(B, u(lx), u(ly), q.kind, LEDS[(x + y) % LEDS.length]);
      else if (q.kind === 'bollards') for (let k = 0; k < 6; k++) bollard(B, u(lx + (q.to[0] - x) * k / 5), u(ly), LEDS[k % 2 ? 0 : 3 % LEDS.length]);
    }
    // walkways at Z1: square ends where they meet a deck, a terrace, a roof or the hill
    const ends = VP.buildings.filter((b) => b.base !== 1).map((b) => [b.rect[0] - ox, b.rect[1] - oy, b.rect[2], b.rect[3]]);
    const polys = VP.walkways.map((w) => { const [[ax, ay], [bx, by]] = w.pts, hw = P['world.walkwayWidth'] / 2, vert = ax === bx;
      const q = vert ? [[ax - hw, Math.min(ay, by)], [ax + hw, Math.min(ay, by)], [ax + hw, Math.max(ay, by)], [ax - hw, Math.max(ay, by)]] : [[Math.min(ax, bx), ay - hw], [Math.max(ax, bx), ay - hw], [Math.max(ax, bx), ay + hw], [Math.min(ax, bx), ay + hw]];
      const p = shift(q, -ox, -oy); p.spine = shift(w.pts, -ox, -oy); return p; }).filter((p) => p.some(([x, y]) => x > -40 && x < W + 40 && y > -40 && y < H + 40));
    if (polys.length) {
      const deckJoins = sc.layers.filter((l) => l.dk).map((l) => [l.dk.off - HALF - 4, -100, 2 * HALF + 8, H + 200]);
      const wl = walkwayLayer(polys, ends, deckJoins, (x, y) => roadOk(x, y, OUTER + 8) && !inHill(x + ox, y + oy), sc.roadC, (x, y) => inHill(x + ox, y + oy));
      wl.front = 1e6; sc.layers.push(wl); sc.walk = wl;
    }
    if (name === 'B2' && ACCESS && ACCESS.monument) dummyMonument(sc, B, [VP.ring[0] - ox, VP.ring[1] - oy]); // Edit 91
    if (name === 'B3' && ART()) containerShip(B, 140, 276); // Edit 92: the ship that takes the certified model to market (art px)
  }
  // Edit 91 (P7.10): the DUMMY MONUMENT on the circus's island (Waterfront B2): the dummy, three times life, in white stone with
  // black joints and its calibration mark; a stepped plinth with a lit plaque; paving and a ring of LEDs round the island
  function dummyStatue() {
    const D = PIX.dummy(Math.PI / 2, 0), k = 3, cY = PIX.c32(PIX.PAL.dummy), cy = PIX.c32(PIX.PAL.dummyD), cW = PIX.c32(PIX.PAL.dummyL);
    const at = (i, j) => (i < 0 || j < 0 || i >= D.w || j >= D.h ? 0 : D.d[j * D.w + i]), edge = (i, j) => !at(i - 1, j) || !at(i + 1, j) || !at(i, j - 1) || !at(i, j + 1);
    const tone = (c, i, j) => (c === cW ? N.stoneL : c === cY ? N.stone : c === cy ? N.stoneD : edge(i, j) ? N.stoneD : K.joint); // the silhouette in stone; the joints black
    const W = 52, sh = D.h * k, H = sh + 44, cx = 26, by = H - 2;
    const S = { w: W, h: H, d: new Uint32Array(W * H), ox: cx, oy: by - 9 };
    const put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) S.d[y * W + x] = c; };
    const box = (x0, x1, y0, y1, b, h, top, front, led) => { // a footprint x0..x1 × y0..y1, its base b and height h: top face, front face, a lit coping
      for (let y = y0 - b - h; y <= y1 - b - h; y++) for (let x = x0; x <= x1; x++) put(x, y, x === x0 || x === x1 || y === y0 - b - h ? CON.l : top);
      for (let y = y1 - b - h + 1; y <= y1 - b; y++) for (let x = x0; x <= x1; x++) put(x, y, y === y1 - b - h + 1 && led ? led : x === x0 || x === x1 ? CON.d : front);
    };
    box(cx - 22, cx + 22, by - 17, by, 0, 3, CON.m, CON.d, N.cyan); // the steps
    box(cx - 16, cx + 16, by - 14, by - 3, 3, 3, CON.l, CON.m, null);
    box(cx - 8, cx + 8, by - 12, by - 6, 6, 14, N.stone, N.stoneD, null); // the pedestal
    for (let x = cx - 5; x <= cx + 5; x++) { put(x, by - 15, K.bldgOutline); put(x, by - 14, x % 2 ? N.cyan : K.white); put(x, by - 13, K.bldgOutline); } // the plaque, lit
    const fx = cx - Math.floor(D.w * k / 2), fy = by - 6 - 14 - 9 - sh + 3; // feet on the pedestal's top face
    for (let j = 0; j < D.h; j++) for (let i = 0; i < D.w; i++) { const c = D.d[j * D.w + i]; if (!c) continue; const t = tone(c, i, j); for (let b = 0; b < k; b++) for (let a = 0; a < k; a++) put(fx + i * k + a, fy + j * k + b, t); }
    const mx = fx + 6 * k + 1, my = fy + 10 * k + 1; // the quartered calibration mark on the chest
    for (let y = -3; y <= 3; y++) for (let x = -3; x <= 3; x++) if (x * x + y * y <= 10) put(mx + x, my + y, (x < 0) === (y < 0) ? K.joint : N.stoneL);
    const out = new Uint32Array(S.d); // a one-pixel outline round the figure
    for (let y = fy - 1; y <= fy + sh; y++) for (let x = fx - 1; x <= fx + D.w * k; x++) { const i = y * W + x; if (y < 0 || x < 0 || x >= W || y >= H || S.d[i]) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const xx = x + a, yy = y + b; return xx >= 0 && yy >= 0 && xx < W && yy < H && S.d[yy * W + xx] && xx >= fx && xx < fx + D.w * k && yy >= fy && yy < fy + sh; })) out[i] = K.bldgOutline; }
    S.d = out;
    return S;
  }
  function dummyMonument(sc, B, at) {
    const [cx, cy] = at, x0 = cx / U, y0 = cy / U, R = 25;
    for (let y = -R; y <= R; y++) for (let x = -R; x <= R; x++) { const d = Math.hypot(x, y); if (d > R) continue; B.put(x0 + x, y0 + y, d > R - 1.5 ? ((Math.round(Math.atan2(y, x) * 12) % 2) ? N.cyan : CON.l) : (x % 6 === 0 || y % 6 === 0) ? CON.m : ISL); } // paving and an LED ring
    for (let t = 0; t < 40; t++) for (let j = -9; j <= 9; j++) B.shade(x0 - 4 - t * 0.7 + j * 0.7, y0 + t * 0.7 + j * 0.7, 0.7); // the long shadow, down-left
    captureRect(cx - 44, cy - 18, 88, 36, 'sculpture');
    const st = dummyStatue(); // Edit 94 (P7.13): the statue keeps its sprite; its shroud is built beside it
    sc.props.push({ spr: st, x: x0, y: y0, by: cy + 18, bldg: 'dummy monument' }); sc.dummyMonument = { cx, cy, x: x0, y: y0, shroud: shroudSprite(st) };
  }
  // Edit 94 (P7.13): the shroud. A cloth over the statue's own silhouette, a pixel wider: folds, a hem, an aqua cord. Cosmetic only;
  // game.js draws it while Story reports the monument shrouded
  function shroudSprite(S) {
    if (!S || !S.d || !S.w || !S.h) return null;
    const w = S.w, h = S.h, d = S.d, T = Object.assign({}, S, { d: new d.constructor(d.length) }), top = [], bot = [];
    for (const k of Object.keys(T)) if (k[0] === '_') delete T[k];
    for (let x = 0; x < w; x++) { top[x] = h; bot[x] = -1; for (let y = 0; y < h; y++) if (d[y * w + x]) { if (top[x] === h) top[x] = y; bot[x] = y; } }
    let y0 = h, y1 = -1; for (let x = 0; x < w; x++) if (bot[x] >= 0) { y0 = Math.min(y0, top[x]); y1 = Math.max(y1, bot[x]); }
    if (y1 < 0) return null;
    const C = [c32('#232B3E'), c32('#36405A'), c32('#4C5875')], cord = Math.round(y0 + (y1 - y0) * 0.4);
    for (let x = 0; x < w; x++) {
      let a = h, b = -1; for (let i = -1; i <= 1; i++) if (x + i >= 0 && x + i < w && bot[x + i] >= 0) { a = Math.min(a, top[x + i]); b = Math.max(b, bot[x + i]); }
      for (let y = a; y <= b; y++) T.d[y * w + x] = y === cord ? N.cyan : y > b - 2 ? C[0] : y === a ? C[2] : [C[2], C[1], C[1], C[0]][x % 4];
    }
    return T;
  }
  // ---------- Edit 92 (P7.11): the story's tile art (world.storyArt). Cosmetic only: pixels on sprites already placed, flat marks on the
  // ground, props never captured. No solid, floor, stair, spawn or cone home changes
  const ART = () => !!(ACCESS && ACCESS.storyArt);
  const onSpr = (S) => ({ put: (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < S.w && y < S.h && S.d[y * S.w + x]) S.d[y * S.w + x] = c; } }); // paints only where the sprite is
  const lumOf = (c) => ((c & 255) * 0.3 + ((c >>> 8) & 255) * 0.59 + ((c >>> 16) & 255) * 0.11) / 255;
  function welcomeWall(S, H0) { // Monument A1: the LED wall greets the new chassis: its face in the screen's cyan, WELCOME, NEW STAFF
    const top = S.h - Math.round(H0 * 0.85), bot = S.h - 4, x0 = 3, x1 = S.w - 5, B2 = onSpr(S), DK = [c32('#0B1530'), c32('#0F1D3E')];
    for (let y = top + 1; y < bot - 1; y++) for (let x = x0 + 1; x < x1; x++) B2.put(x, y, DK[y % 2]);
    const D = PIX.doll({}, '', []), cx0 = 14, cy0 = 4, cw = 36, ch = Math.min(31, bot - top - 4), fx = x0 + 8, fy = top + Math.max(2, Math.round((bot - top - ch) / 2));
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) { const c = D.d[(cy0 + j) * D.w + cx0 + i]; if (!c) continue; const l = lumOf(c);
      B2.put(fx + i, fy + j, (fy + j) % 2 && l > 0.3 ? mixK(N.cyan, K.white, 0.25) : l > 0.78 ? K.white : l > 0.55 ? mixK(N.cyan, K.white, 0.45) : l > 0.3 ? N.cyan : mixK(N.cyan, DK[0], 0.7)); }
    const tx = fx + cw + 8, ty = top + Math.round((bot - top) / 2) - 9;
    PIX.smallText(B2, 'WELCOME', tx, ty, K.white); PIX.smallText(B2, 'NEW STAFF', tx, ty + 9, N.magenta); PIX.smallText(B2, (root.DUMMIES_LORE && root.DUMMIES_LORE.notices && root.DUMMIES_LORE.notices.n23) || 'FARSIGHT', tx, ty + 18, N.cyan); // Edit 95 (P8): the sign names the company in the game
    return S;
  }
  function shopSigns(S, H0, k) { // Monument A2: the neon shops: two shopfronts, a lit sign over each, the windows below
    const top = S.h - Math.round(H0 * 0.85), bot = S.h - 4, x0 = 3, x1 = S.w - 5, B2 = onSpr(S), n = 2, w = (x1 - x0 - 2) / n, words = [['OPEN', 'SALE'], ['24H', 'NEW']][k % 2], cols = [N.magenta, N.cyan, LEDS[2 % LEDS.length]];
    for (let q = 0; q < n; q++) {
      const a = Math.round(x0 + 1 + q * w), b = Math.round(x0 + 1 + (q + 1) * w) - 2, col = cols[(q + k) % 3], sh = Math.min(8, bot - top - 4);
      for (let y = top + 1; y < bot - 1; y++) for (let x = a; x <= b; x++) B2.put(x, y, y < top + 1 + sh ? (y === top + 1 || y === top + sh || x === a || x === b ? col : c32('#0A0F1E')) : (x === a || x === b) ? K.bldgOutline : (y + x) % 5 === 0 ? K.white : mixK(col, c32('#0A0F1E'), 0.55));
      const t = words[q], tw = PIX.smallWidth(t); PIX.smallText(B2, t, Math.round((a + b) / 2 - tw / 2) + 1, top + 2 + Math.max(0, Math.floor((sh - 6) / 2)), K.white);
    }
    return S;
  }
  function cubeRim(S, H, col) { // Monument A3: each cube lit on its edges, the roof's front edge brightest
    const at = (x, y) => (x < 0 || y < 0 || x >= S.w || y >= S.h ? 0 : S.d[y * S.w + x]), out = new Uint32Array(S.d), e = S.h - H;
    for (let y = 0; y < S.h; y++) for (let x = 0; x < S.w; x++) { if (!at(x, y)) continue; if (!at(x - 1, y) || !at(x + 1, y) || !at(x, y - 1) || !at(x, y + 1)) out[y * S.w + x] = y < e ? K.white : col; else if (y === e || y === e - 1) out[y * S.w + x] = y === e ? col : K.white; }
    S.d = out; return S;
  }
  function gatewayLayer(B, ax, top, bot, Hh) { // Monument C3: the LED gateway: two pylons, a deep lit beam over the road reading THANK YOU · DRIVE SAFE, its shadow across the lanes
    const L = new PIX.Buf(AW, AH), X0 = Math.round(ax / U), yT = Math.round(top / U), yB = Math.round(bot / U), BW = 10, PW = 8;
    for (let y = yT - 4; y <= yB + 4; y++) for (let x = X0 - BW; x <= X0 + BW; x++) B.shade(x - Math.round(Hh * 0.7), y + Math.round(Hh * 0.7), 0.78); // the beam's shadow
    for (const py of [yT, yB]) {
      for (let y = py - 5; y <= py + 5; y++) for (let x = X0 - PW; x <= X0 + PW; x++) B.shade(x - 5, y + 5, 0.72);
      for (let z = 0; z < Hh; z++) for (let i = -PW; i <= PW; i++) L.put(X0 + i, py + 5 - z, Math.abs(i) === PW ? K.bldgOutline : Math.abs(i) < 2 ? (z % 6 < 3 ? N.cyan : N.magenta) : i < 0 ? CON.d : CON.l);
      for (let y = py - 5; y <= py + 5; y++) for (let i = -PW; i <= PW; i++) L.put(X0 + i, y - Hh, Math.abs(i) === PW || y === py - 5 ? K.bldgOutline : CON.l);
    }
    for (let y = yT - Hh - 5; y <= yB - Hh + 5; y++) for (let i = -BW; i <= BW; i++) {
      const edge = Math.abs(i) === BW || y === yT - Hh - 5 || y === yB - Hh + 5, rail = Math.abs(i) === BW - 1, chev = ((y - yT) - Math.abs(i) * 1.5 + 64) % 8 < 3;
      L.put(X0 + i, y, edge ? K.bldgOutline : rail ? (y % 2 ? N.cyan : K.white) : Math.abs(i) <= 4 ? c32('#0A0F1E') : chev ? N.cyan : N.magenta);
    }
    const vtext = (t, y0, c) => { let cy = y0; for (const ch of t) { if (ch === ' ') { cy += 4; continue; } const w = PIX.smallWidth(ch); const G = { put: (x, y) => L.put(X0 + 3 - y, cy + x, c) }; PIX.smallText(G, ch, 0, 0, c); cy += w + 1; } return cy; }; // reads top to bottom
    const t1 = 'THANK YOU', t2 = 'DRIVE SAFE', len = (t) => [...t].reduce((a, ch) => a + (ch === ' ' ? 4 : PIX.smallWidth(ch) + 1), 0), mid = Math.round((yT + yB) / 2) - Hh;
    vtext(t1, mid - len(t1) - 3, K.white); vtext(t2, mid + 4, N.cyan);
    return L;
  }
  function lanternSprite() { // Parkland C1: the paper lantern, the Expo's first exhibit, lit again on its pavilion
    const W = 30, H = 46, cx = 15, S = { w: W, h: H, d: new Uint32Array(W * H), ox: cx, oy: H - 1 }, put = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) S.d[y * W + x] = c; };
    const cy = 22, rx = 12, ry = 16;
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) { const d = (x / rx) ** 2 + (y / ry) ** 2; if (d > 1) continue; put(cx + x, cy + y, d > 0.86 ? mixK(K.white, N.cyan, 0.45) : Math.abs(y) % 5 === 0 ? mixK(K.white, CON.d, 0.45) : x > 4 ? mixK(K.white, N.cyan, 0.18) : K.white); }
    for (let x = -6; x <= 6; x++) for (let t = 0; t < 3; t++) { put(cx + x, cy - ry - t, t === 2 ? K.bldgOutline : CON.d); put(cx + x, cy + ry + t, t === 2 ? K.bldgOutline : CON.d); }
    for (let t = 0; t < 4; t++) put(cx, cy - ry - 3 - t, CON.d); // the hanger
    for (let t = 0; t < 6; t++) put(cx, cy + ry + 3 + t, t > 3 ? N.magenta : CON.l); // the tassel
    return S;
  }
  function falls(B, x0, x1, yTop, yFoot) { // Parkland B1: water spilling over a pool's front lip, down its face
    const a = Math.round(x0 + (x1 - x0) * 0.3), b = Math.round(x0 + (x1 - x0) * 0.7);
    for (let y = Math.round(yTop); y <= Math.round(yFoot); y++) for (let x = a; x <= b; x++) B.put(x, y, (x + y * 2) % 5 === 0 ? K.white : x % 2 ? N.water2 : mixK(N.cyan, K.white, 0.3));
    for (let x = a - 1; x <= b + 1; x++) B.put(x, Math.round(yFoot) + 1, (x % 2) ? K.white : mixK(N.cyan, K.white, 0.5)); // foam at the foot
  }
  function runnel(B, cx, y0, y1) { // a grated channel across the path to the next pool
    for (let y = Math.round(y0); y <= Math.round(y1); y++) for (let x = Math.round(cx) - 2; x <= Math.round(cx) + 2; x++) B.put(x, y, Math.abs(x - cx) > 1.5 ? CON.l : y % 2 ? N.water2 : CON.d);
  }
  function customsSign(S, plinth) { // Waterfront A3, C3: the pier towers are customs posts: CUSTOMS on the plinth, lit
    const B2 = onSpr(S), t = 'CUSTOMS', tw = PIX.smallWidth(t), y = S.h - plinth + 3, x = Math.round(S.w / 2 - tw / 2);
    for (let yy = y - 2; yy < y + 8; yy++) for (let xx = x - 3; xx < x + tw + 3; xx++) B2.put(xx, yy, yy === y - 2 || yy === y + 7 ? N.cyan : c32('#0A0F1E'));
    PIX.smallText(B2, t, x, y, K.white);
    return S;
  }
  let SCN = null; // Edit 94 (P7.13): the screen buildScreen is building
  function containerShip(B, x0, y0) { // Waterfront B3: the ship that will take the certified model to market, moored on the river
    const L = 120, Wd = 22, put = (x, y, c) => B.put(x0 + x, y0 + y, c);
    const faces = !!(ACCESS && ACCESS.storyArt); // Edit 94 (P7.13): every crate carries the dummy's face (D76), cosmetic only
    for (let t = 0; t < 30; t++) for (let x = 6; x < L; x++) B.shade(x0 + x - t * 0.7, y0 + Wd + t * 0.7, 0.9); // its shadow on the water
    for (let y = 0; y < Wd; y++) for (let x = 0; x < L; x++) { const bow = x > L - 14 ? (x - (L - 14)) * 0.8 : 0; if (Math.abs(y - Wd / 2) > Wd / 2 - bow) continue; put(x, y, Math.abs(y - Wd / 2) > Wd / 2 - bow - 1.5 ? K.white : c32('#2A3346')); }
    const cols = [N.cyan, N.magenta, c32('#5F6E86'), c32('#C9D3DA'), LEDS[2 % LEDS.length]];
    let crates = 0;
    for (let r = 0; r < 3; r++) for (let q = 0; q < 8; q++) {
      const bx = 24 + q * 10, by = 3 + r * 6; crates++;
      for (let y = 0; y < 5; y++) for (let x = 0; x < 9; x++) put(bx + x, by + y - 2, y === 0 || x === 0 ? K.bldgOutline : cols[(q * 3 + r * 2 + q * r) % cols.length]);
      if (faces) for (const [x, y] of [[3, 1], [6, 1], [3, 3], [4, 3], [5, 3], [6, 3]]) put(bx + x, by + y - 2, K.bldgOutline); // Edit 94 (P7.13): the face: two eyes, a mouth
    }
    if (faces && SCN) { const sx = (x0 + L / 2) * U, sy = (y0 + Wd / 2) * U; SCN.containerShip = { x: sx, y: sy, crates, face: true }; SCN.ship = { x: sx, y: sy }; } // Edit 94 (P7.13): the finale's ship, on the scene
    for (let y = 2; y < Wd - 2; y++) for (let x = 6; x < 18; x++) put(x, y - 6, y === 2 || x === 6 || x === 17 ? K.bldgOutline : y % 3 === 0 ? N.cyan : K.white); // the bridge
    for (let x = -10; x < 0; x++) for (const yy of [Wd / 2 - 3, Wd / 2 + 3]) if ((x + 20) % 3) put(x, Math.round(yy + x * 0.2), mixK(N.cyan, K.white, 0.5)); // the wake
  }
  DISTRICTS.splice(1, 0, WATER);
  // ---------- traffic on one screen (the dummy away)
  function sceneSim(center, decks, deckLanes, lanes, busOK) {
    const s = new X.Sim('straight', { 'run.appearances.road': 2000 });
    s.level = Object.assign({}, s.level, { center, ring: null, lanes: lanes || X.lanesOf(center, P), statics: [], coneHomes: [], spawns: [{ x: -900, y: -900, f: 0 }], patches: [], floors: [], stairs: [], checkpoints: [], theme: 'plain',
      decks: decks.map((d) => ({ hz: d.hz !== false, off: d.off, z: d.z, height: d.z === 2 ? P['world.highHeight'] : P['world.deckHeight'] })), deckLanes });
    s.cones = []; s.cars = []; s.drones = []; s.checkTerminal = () => {}; s.checkFlip = () => {}; s.dispatchDrone = () => {};
    s.schedule = s.schedule.map((sl, j) => { const cls = X.fleetClass(P, 0.25, (j * 0.6180339887 + 0.53) % 1); return Object.assign({}, sl, { cls: cls === 'bus' && !busOK ? 'sedan' : cls }); }); // buses only where the road allows (Edit 50)
    const dc = s.deckCls.bind(s); s.deckCls = (n) => { const c = dc(n); return c === 'bus' && s.noDeckBus ? 'sedan' : c; };
    s.admissionInterval = () => 3.2;
    Object.assign(s.body, { x: -900, y: -900 }); s.fillDeckCars();
    return s;
  }
  let pieceSeq = 0;
  function labSim(geo, fleet, overrides) { // a lab sim on custom geometry (junctions, roundabouts): the P4 driver with give-way rules
    const key = 'mock' + (++pieceSeq); L.PIECES[key] = { name: key, params: [], build: () => geo };
    const s = L.makeSim(X, key, {}, { fleet, interval: 1.8, seconds: 60, seed: 11 + pieceSeq, overrides: overrides || {} });
    s.dispatchDrone = () => {};
    return s;
  }
  // arms out of a junction point J along each road through it (district polylines already clipped to the screen)
  function junctionArms(runs, J, majorId) {
    const arms = {}, major = [];
    for (const r of runs) {
      const pts = r.pts; let best = null;
      for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((J[0] - ax) * dx + (J[1] - ay) * dy) / l2)), d = hyp(ax + dx * t - J[0], ay + dy * t - J[1]); if (!best || d < best.d) best = { i, d }; }
      if (!best || best.d > 2) continue;
      const before = pts.slice(0, best.i).reverse().filter((p) => hyp(p[0] - J[0], p[1] - J[1]) > 1), after = pts.slice(best.i).filter((p) => hyp(p[0] - J[0], p[1] - J[1]) > 1);
      [before, after].forEach((side, k) => { if (side.length && hyp(side[side.length - 1][0] - J[0], side[side.length - 1][1] - J[1]) > 40) { const nm = r.id + k; arms[nm] = [J].concat(side); if (r.id === majorId) major.push(nm); } });
    }
    return { arms, major };
  }
  // ---------- a vertical highway (Edit 52): the game's deck sprite run north–south, lamps on both parapets
  function vDeck(off, z, roadOk, stairs, links) { // links (Edit 54): parapet openings onto a roof at the deck's level; P6: gaps are broken parapets (drops)
    stairs = stairs.concat((links || []).filter((q) => !q.gap));
    const gapL = (links || []).filter((q) => q.gap), hgt = z === 2 ? P['world.highHeight'] : P['world.deckHeight'];
    const dk = { hz: false, off, z, height: hgt, gaps: gapL.map((q) => [q.y, q.y + q.h, q.side]), gapLit: !!ACCESS, openings: stairs.map((st) => [st.y, st.y + st.h, st.side]) }, { S, ext } = PIX.deck(dk, P);
    const Lr = new PIX.Buf(AW, AH), x0 = Math.round((off - HALF) / U), wpx = Math.round(2 * HALF / U), glow = mixK(K.deck2, K.white, 0.38);
    PIX.blit(Lr, S, x0, 0);
    for (let wy = P['world.deckLampSpacing'] / 2; wy < H; wy += P['world.deckLampSpacing']) for (const sd of [-1, 1]) { // paired lamps, poles rising screen-up from the parapet
      if (stairs.concat(gapL).some((st) => st.side === sd && wy > st.y - 12 && wy < st.y + st.h + 12)) continue;
      const bx = sd < 0 ? x0 + 1 : x0 + wpx - 2, by = Math.round(wy / U), ix = sd < 0 ? x0 + 6 : x0 + wpx - 7;
      for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) if (Math.abs(i) + Math.abs(j) <= 2) Lr.put(ix + i, by + j, glow);
      for (let h = 1; h < PIX.LAMP_H; h++) { Lr.put(bx, by - h, K.jerseyTop); Lr.put(bx + 1, by - h, K.bldgOutline); }
      for (let i = -1; i <= 2; i++) { Lr.put(bx + i, by - PIX.LAMP_H + 1, i === 0 || i === 1 ? K.white : K.head); Lr.put(bx + i, by - PIX.LAMP_H, K.bldgOutline); }
    }
    const cols = []; // P6: round columns under both edges, never in a lane (as the straight highway)
    const ein = PARKGRID ? 20 : 4; // 6.2 (Edit 70): in Parkland the columns stand in under the deck, between the garden's paths
    for (let p = PARKGRID ? GH / 2 : P['world.deckPillarSpacing'] / 2; p < H; p += PARKGRID ? GH : P['world.deckPillarSpacing']) for (const e of [off - HALF + ein, off + HALF - ein - C]) {
      if (!roadOk(e + C / 2, p, OUTER + C + 4) || onPath(e + C / 2, p, C / 2 + 2) || (PARKGRID && stairs.some((st) => p > st.y - C - 24 && p < st.y + st.h + C + 24 && Math.abs(e + C / 2 - (st.x + st.w / 2)) < st.w / 2 + C + 24))) continue; // 6.2: and never in a flight's lee
      cols.push({ cx: e + C / 2, cy: p, key: p + C / 2, x: e, y: p - C / 2, spr: PIX.column(Math.round(C / U), Math.round(C / U), ext) });
    }
    return { dk, L: Lr, lift: ext, z, vert: true, cols, front: 9e5, openings: stairs.map((st) => ({ a0: st.y, a1: st.y + st.h, side: st.side })), gapSpans: gapL.map((q) => ({ a0: q.y, a1: q.y + q.h, side: q.side })),
      inBand: (wx) => Math.abs(wx - off) < HALF + 12, shadeOn: (B) => {
      const k = P['proto.art.shadowScale'], ox = PIX.SUN.x * hgt * k / U, oy = PIX.SUN.y * hgt * k / U;
      each((x, y, wx) => { if (Math.abs(wx - off) <= HALF) return; for (const t of [0.5, 1]) { const sx = (x - ox * t + 0.5) * U; if (Math.abs(sx - off) <= HALF) { B.shade(x, y, 0.72); break; } } });
    } };
  }
  // Prototype 6.2 (Edit 70): the garden grid's path centre lines on a screen (a seam path whole inside it; inside the wall at the bound)
  function gridLines(sc) {
    const WT = P['world.wallThickness'], e = { W: sc.col > 0 ? GP : WT + GP, E: sc.col < 2 ? GP : WT + GP, N: sc.row > 0 ? GP : WT + GP, S: sc.row < 2 ? GP : WT + GP }, xs = [e.W - GP / 2], ys = [e.N - GP / 2];
    for (let x = GW; x < W; x += GW) xs.push(x);
    for (let y = GH; y < H; y += GH) ys.push(y);
    xs.push(W - e.E + GP / 2); ys.push(H - e.S + GP / 2);
    return { e, xs, ys };
  }
  // In Parkland a flight's axis runs along a garden path, so its apron opens onto the path: the nearest path line where the
  // flight and its apron keep clear of the roads and inside the screen (the head as drawn, lifted by its level).
  function alignFlights(sc, sts, roadOk) {
    const { xs, ys } = gridLines(sc);
    for (const st of sts) {
      const vert = st.axis === 'y', L0 = vert ? st.x + st.w / 2 : st.y + st.h / 2, lift = (st.z === 2 ? Z2 : Z1) * U;
      let moved = false;
      for (const Lc of (vert ? xs : ys).filter((v) => Math.abs(v - L0) <= 100).sort((a, b) => Math.abs(a - L0) - Math.abs(b - L0))) { // its own end of the deck: within 100 of where it was
        const q = Object.assign({}, st, vert ? { x: Lc - st.w / 2 } : { y: Lc - st.h / 2 }), a = apronOf(q), rs = [[q.x, q.y, q.w, q.h], [a.x - 8, a.y - 8, a.w + 16, a.h + 16]];
        let ok = rs.every(([x, y, w, h]) => x >= SEM && y >= SEM && x + w <= W - SEM && y + h <= H - SEM) && (vert || q.y - lift >= SEM);
        for (const [x, y, w, h] of rs) for (let px = x; px <= x + w && ok; px += 8) for (let py = y; py <= y + h && ok; py += 8) if (!roadOk(px, py, OUTER + 4)) ok = false;
        if (ok) { if (vert) st.x = q.x; else st.y = q.y; moved = true; break; }
      }
      if (!moved) (sc.offGrid = sc.offGrid || []).push([st.x, st.y]); // a road leaves no path line in reach: the flight keeps its place
    }
    return sts;
  }
  // The ring's hole: where its inner edge passes over a Z0 road's centre line, the parapet opens one world.tileSize module
  function holeOpenings(sc, cx, cy, rIn) {
    const T = P['world.tileSize'], out = [], n = 720, near = [];
    for (let i = 0; i < n; i++) { const t = -Math.PI + i * 2 * Math.PI / n; near.push(sc.roadC(cx + rIn * Math.cos(t), cy + rIn * Math.sin(t)) < 8); }
    for (let i = 0; i < n; i++) {
      if (!near[i] || near[(i + n - 1) % n]) continue;
      let j = i; while (near[(j + 1) % n] && j - i < n) j++;
      const c = -Math.PI + ((i + j) / 2) * 2 * Math.PI / n, h = T / 2 / rIn;
      out.push({ a0: c - h, a1: c + h });
    }
    return out;
  }
  function vEscalators(off, z, ys) { // west side at the north end, east side at the south end; P6.3: the other side where the flight and its apron would leave the screen
    const run = X.stairRun(P, 0, z), lift = (z === 2 ? Z2 : Z1) * U, westOk = off - HALF - run - APRON >= SEM, eastOk = off + HALF + run + APRON <= W - SEM;
    const at = (east, y) => (east ? { x: off + HALF, y, w: run, h: SWD, axis: 'x', low: off + HALF + run, high: off + HALF, side: 1, z } : { x: off - HALF - run, y, w: run, h: SWD, axis: 'x', low: off - HALF - run, high: off - HALF, side: -1, z });
    return [at(!westOk, (ys && ys[0]) || Math.max(INSET, lift + SEM)), at(eastOk || !westOk, (ys && ys[1]) || H - INSET - SWD)];
  }
  // ---------- landmark art (each district its own kit: water and gardens; brutalist concrete; LED and neon)
  function waterBlock(B, x0, y0, x1, y1, k, base, h) { // a pool raised on a concrete step
    const fp = chamf(Math.round(x0), Math.round(y0), Math.round(x1), Math.round(y1), k);
    mass(B, fp, x0, y0, x1, y1, base, h, 'conc', null, base === 0);
    for (let y = Math.round(y0); y <= y1; y++) for (let x = Math.round(x0); x <= x1; x++) if (fp(x, y, 2)) B.put(x, y - base - h, (y % 4 === 0 && (x * 5 + y) % 11 < 4) ? N.water2 : (x * 3 + y * 7) % 89 === 0 ? N.cyan : N.water);
  }
  // Edit 54: a stack of cantilevered LED cubes (art px), each sitting on the one below; pushed as props sorted from the base
  function cubeStack(sc, B, cubes, by, seed) {
    let base = 0;
    cubes.forEach(([x, y, w, h, H], i) => {
      const S = ledPanel(PIX.building(w, h, H, PIX.rng(seed + i), [N.magenta, N.cyan, LEDS[2 % LEDS.length]][i % 3], Math.max(2, Math.round(H / STY))), H, [[N.magenta, N.cyan], [N.cyan, LEDS[2 % LEDS.length]], [LEDS[2 % LEDS.length], N.magenta]][i % 3]);
      if (i === 0) brutalShadow(B, x, y, w, h, Math.round(cubes.reduce((a, c) => a + c[4], 0) * 0.55), null);
      if (i === 0) captureRect(x * U, y * U, w * U, h * U);
      if (ART()) cubeRim(S, H, [N.magenta, N.cyan, LEDS[2 % LEDS.length]][i % 3]); // Edit 92: each cube lit on its edges
      sc.props.push({ spr: S, x, y: y - base, by, key: by + i * 0.01, bldg: i === 0 ? 'cubes' : undefined }); base += H;
    });
  }
  function poolFP(B, fp) { // a reflecting pool from a footprint test in world units: coping, shadowed wall, water
    capture((wx, wy) => fp(wx, wy, -2), 0, 0, W, H, true);
    each((x, y, wx, wy) => {
      if (!fp(wx, wy, -6)) return;
      if (!fp(wx, wy, 0)) B.put(x, y, CON.l);
      else if (!fp(wx, wy, 4)) B.put(x, y, CON.d);
      else { let c = N.water; if (y % 4 === 0 && ((x * 5 + y) % 11) < 4) c = N.water2; if ((x * 3 + y * 7) % 97 === 0) c = LEDS[(x + y) % LEDS.length]; B.put(x, y, c); }
    });
  }
  function ledPanel(S, H0, cols) { // an LED screen over the lower part of a building sprite's front face
    const top = S.h - Math.round(H0 * 0.85), bot = S.h - 4;
    for (let y = top; y < bot; y++) for (let x = 3; x < S.w - 4; x++) { const c = S.d[y * S.w + x]; if (!c) continue; S.d[y * S.w + x] = (y === top || y === bot - 1 || x === 3 || x === S.w - 5) ? K.bldgOutline : mixK(cols[Math.floor((x + y * 0.5) / 6) % cols.length], K.white, ((x + y) % 7 === 0) ? 0.4 : 0); }
    return S;
  }
  function drum(rx, ry, H0, led) { // an LED drum tower: elliptical plan, bands of light
    const pad = 2, S = { w: rx * 2 + 2 * pad + 1, h: ry * 2 + H0 + 6, ox: rx + pad, oy: ry + H0 + 3 }; S.d = new Uint32Array(S.w * S.h);
    const put = (x, y, c) => { const X0 = x + S.ox, Y0 = y + S.oy; if (X0 >= 0 && Y0 >= 0 && X0 < S.w && Y0 < S.h) S.d[Y0 * S.w + X0] = c; };
    for (let x = -rx; x <= rx; x++) { const yb = Math.round(ry * Math.sqrt(Math.max(0, 1 - (x * x) / (rx * rx)))), u = x / rx; for (let z = 0; z < H0; z++) put(x, yb - z, z % 5 === 4 ? led : (z % 5 === 1 && (x + z) % 9 === 0) ? K.white : u < -0.5 ? CON.d : u > 0.4 ? CON.l : CON.m); }
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1) put(x, y - H0, (x * x) / (rx * rx) + (y * y) / (ry * ry) > 0.7 ? led : CON.t);
    return S;
  }
  function billboard(B, ax, ay, w, h, legs, led) { // a lit board on legs (art px; anchored at the foot centre)
    const x0 = Math.round(ax - w / 2), y0 = Math.round(ay);
    for (const lx of [x0 + 2, x0 + w - 3]) for (let z = 0; z < legs; z++) B.put(lx, y0 - z, CON.l);
    for (let z = legs; z < legs + h; z++) for (let x = x0; x <= x0 + w; x++) B.put(x, y0 - z, z === legs || z === legs + h - 1 || x === x0 || x === x0 + w ? K.bldgOutline : (Math.floor((x - x0) / 4) + Math.floor(z / 3)) % 3 === 0 ? mixK(led, K.white, 0.45) : led);
    for (let t = 0; t < legs; t++) for (let x = x0; x <= x0 + w; x++) B.shade(x - t * 0.7, y0 + t * 0.7, 0.8);
  }
  // ---------- one screen
  function buildScreen(D, col, row) {
    const name = TILE(col, row), ox = col * W, oy = row * H, rng = PIX.rng(1000 + col * 37 + row * 101 + D.id.length * 7), plan = D.tiles[name];
    const sc = { D, name, col, row, ox, oy, props: [], layers: [], tops: [], note: plan[0] + '. Landmark: ' + plan[1] + '.', stairs: [], reserve: [], solids: [], solidsZ: [], roofs: [], floorsX: [], waterPolys: [], polys0: [], cones: [], drones: [] };
    CAP = sc.solids; // P6: every mass drawn from here is a solid of this screen
    SCN = sc; // Edit 94 (P7.13): the screen being built, for the story's tile art that reports itself (the container ship)
    PARKGRID = D.id === 'parkland' ? gridLines(sc) : null; // 6.2 (Edit 70)
    for (const rb of [D.roundabout, D.ring]) if (rb && rb.arms.length < P['world.roundaboutMinArms']) console.warn('a roundabout with too few arms', D.id); // Edit 52
    const RBS = (D.roundabouts || []).concat(D.roundabout ? [D.roundabout] : []), rbHere = RBS.find((q) => q.tile === name); // Edit 56: street roundabouts
    if (D.kit !== 'example') { // Edit 56 (user, 26 October): every four-way takes a roundabout, its arms 90° apart, inside its tile; a flyover only where the plan names it
      const ANG = { W: 180, N: 270, E: 0, S: 90, NW: 225, NE: 315, SE: 45, SW: 135 }, zq = (1 - P['world.junctionZone']) / 2, rS = P['world.roundaboutRadiusStreet'] + OUTER;
      for (const rb of RBS.concat(D.ring ? [D.ring] : [])) if (rb.tile === name) {
        const a = rb.arms.map((k) => ANG[k]).sort((p, q) => p - q); if (a.some((v, i) => ((a[(i + 1) % a.length] - v + 360) % 360 || 360) < 90)) console.warn('a roundabout with arms under 90° apart', D.id, name);
        const c = rb.at || [W / 2, H / 2]; if (rb !== D.ring && (c[0] - rS < 0 || c[0] + rS > W || c[1] - rS < 0 || c[1] + rS > H)) console.warn('a roundabout crossing its tile edge', D.id, name);
        if (c[0] < W * zq || c[0] > W * (1 - zq) || c[1] < H * zq || c[1] > H * (1 - zq)) console.warn('a roundabout outside the central zone', D.id, name);
      }
      if (D.flyover && !D.flyoverNamed) console.warn('a 45° flyover the plan does not name', D.id);
    }
    const runs = [];
    for (const r of D.roads) { const run = clipRun(shift(r.pts, -ox, -oy), -200, -200, W + 200, H + 200); if (run) runs.push({ id: r.id, pts: run }); }
    const decks = D.decks.filter((d) => !d.rows || d.rows.includes(row)).map((d) => ({ hz: d.hz, z: d.z, off: d.hz ? d.at - oy : d.at - ox, from: d.from != null ? d.from - (d.hz ? ox : oy) : null, noEsc: d.noEsc, escY: d.escY && d.escY[name], esc1: d.esc1 && d.esc1[name], gaps: (d.gaps || []).map(([a, b]) => [a - (d.hz ? ox : oy), b - (d.hz ? ox : oy)]) })).filter((d) => d.off > -HALF && d.off < (d.hz ? H : W) + HALF);
    const hDecks = decks.filter((d) => d.hz), vDecks = decks.filter((d) => !d.hz);
    const groundDecks = D.ring && D.ring.tile === name ? [] : hDecks;
    const lvl = (c, extra) => Object.assign({ center: c, ring: null, statics: [], spawns: [], coneHomes: [], patches: [], decks: groundDecks.map((d) => ({ hz: true, off: d.off, z: d.z, height: d.z === 2 ? P['world.highHeight'] : P['world.deckHeight'] })), floors: [], canal: false, solid: [] }, extra || {});
    const J = (D.junctions || []).find((j) => j.tile === name);
    let ground, roadD, sims = [], center = runs.length ? runs[0].pts : [[-900, -900], [-850, -900]], lanes = null, busOK = runs.every((r) => X.minBend(r.pts, W, H) >= RB), patches = [];
    if (D.id === 'circus' && name === 'C1') patches = [[480, 520], [512, 552], [448, 584], [544, 496], [480, 608]].map(([x, y]) => ({ x, y, w: 32, h: 32, kind: 'puddle' })); // a flooded corner
    // ground roads and their traffic
    if (rbHere) { // a ground roundabout: every route, give way at entry, the inner lane for the third exit (Edit 52, 54). Edit 56: street radius, any centre, bent arms
      const ov = D.kit === 'example' ? {} : { 'world.roundaboutRadius': P['world.roundaboutRadiusStreet'] }, geo = L.multiRoundabout(X, Object.assign({}, P, ov), rbHere.arms, R96, rbHere.at, rbHere.bends), s = labSim(geo, 'nobus', ov);
      sims.push(s); sc.lab = s; const ca = rbHere.at || [W / 2, H / 2]; sc.islands = [{ x: ca[0], y: ca[1], r: P['world.roundaboutRadiusStreet'] + OUTER + 24 }]; // P6.1: no spawn on a roundabout's island
      ground = PIX.ground(lvl(geo.center, { ring: geo.ring.concat([geo.ring[0]]), arms: geo.arms, surfaces: geo.roads, giveWays: s.lab.geo.stops, decks: [] }), P, 23);
      const rf = PIX.roadField(geo.roads.map((pts) => ({ pts, dash: false })).concat([{ pts: geo.ring.concat([geo.ring[0]]), dash: false }]), OUTER + 80);
      roadD = (k) => rf.D[k];
    } else if (D.geo) { // Edit 55 (example): a lab geometry built whole (realigned, staggered)
      const geo = D.geo(), s = labSim(geo, 'nobus', {});
      sims.push(s); sc.lab = s;
      ground = PIX.ground(lvl(geo.center, { arms: geo.arms, surfaces: geo.roads, giveWays: s.lab.geo.stops }), P, 29);
      const rf = PIX.roadField(geo.roads.map((pts) => ({ pts, dash: false })), OUTER + 80);
      roadD = (k) => rf.D[k];
    } else if (J) { // a junction at 90° or 45°: the minor road gives way (Edit 49.3)
      const { arms, major } = junctionArms(runs, J.at, J.major), geo = L.junction(X, P, arms, major, P['world.junctionTurnRadius']), s = labSim(geo, 'nobus', {});
      const dirs = Object.values(arms).map((A) => Math.atan2(A[1][1] - A[0][1], A[1][0] - A[0][0]) * 180 / Math.PI); // Edit 55.1: four arms meet square
      if (dirs.length >= 3 && dirs.some((a) => dirs.some((b) => { const d = Math.abs(((a - b) % 90 + 90) % 90); return Math.min(d, 90 - d) > 2; }))) console.warn('a junction arm off 90° (realign: option A)', D.id, name); // Edit 55.2: three-way joins too
      if (dirs.length >= 4 && D.kit !== 'example') console.warn('a four-way junction without a roundabout', D.id, name); // Edit 56
      const zq = (1 - P['world.junctionZone']) / 2; if (J.at[0] < W * zq || J.at[0] > W * (1 - zq) || J.at[1] < H * zq || J.at[1] > H * (1 - zq)) console.warn('a junction outside the central zone', D.id, name); // Edit 55.2
      sims.push(s); sc.lab = s;
      ground = PIX.ground(lvl(geo.center, { arms: geo.arms, surfaces: geo.roads, giveWays: s.lab.geo.stops, patches }), P, 29 + col * 7 + row * 13);
      const rf = PIX.roadField(geo.roads.map((pts) => ({ pts, dash: false })), OUTER + 80);
      roadD = (k) => rf.D[k];
    } else if (D.split && D.split.tile === name) {
      const sp = splitRoad(320); center = [[-200, 320], [W + 200, 320]]; lanes = [X.makePath(sp.E), X.makePath(sp.Wl)]; busOK = false; sc.split = sp;
      ground = PIX.ground(lvl([[-900, -900], [-850, -900]]), P, 41);
      tiles(ground, () => true, false);
      const m = paintSplit(ground, sp.E, sp.Wl); roadD = (k) => LW - m[k];
    } else {
      ground = PIX.ground(lvl(center, { arms: runs.length > 1 ? runs.map((r) => r.pts) : undefined, surfaces: runs.length > 1 ? [] : undefined, patches }), P, 31 + col * 7 + row * 13);
      if (runs.length > 1) lanes = [].concat(...runs.map((r) => X.lanesOf(r.pts, P)));
      if (!runs.length) lanes = []; // P6: a screen with no ground road (the Waterfront's hilltop)
      const rf = PIX.roadField(runs.map((r) => ({ pts: r.pts, dash: false })), OUTER + 80);
      roadD = (k) => rf.D[k];
    }
    const B = ground; sc.B = B;
    const rd = (wx, wy) => { const k = Math.floor(wy / U) * AW + Math.floor(wx / U); return k >= 0 && k < AW * AH ? roadD(k) : 1e9; };
    const roadOk = (wx, wy, m) => rd(wx, wy) > (m || OUTER + 4);
    sc.roadC = (wx, wy) => rd(wx, wy); // P6.2: distance to the nearest Z0 road centre line (walkway openings)
    // highways, each with its two escalators
    let ringSim = null;
    if (D.ring && D.ring.tile === name) { // the Z1 ring (Parkland): a four-arm roundabout lifted onto the deck
      const cy = hDecks.length ? hDecks[0].off : H / 2, cx = vDecks.length ? vDecks[0].off : W / 2; // Edit 55.2: centred where the highways cross
      const ov = { 'world.roundaboutRadius': P['world.deckRingRadius'], 'traffic.ringFill': P['world.deckRingFill'] }, Pr = Object.assign({}, P, ov), geo = L.multiRoundabout(X, Pr, D.ring.arms, R96, [cx, cy]); // Edit 53.1: entry metered (Edit 54: the inner lane for the third exit only, as every ring)
      ringSim = labSim(geo, 'nobus', ov); sc.ringSim = ringSim;
      const Rc = P['world.deckRingRadius'];
      sc.stairs = escalators(cy, 1, HALF); if (D.id === 'parkland') alignFlights(sc, sc.stairs, roadOk); // 6.2 (Edit 70): flights on the garden's paths
      const rr = { geoms: [{ pts: geo.ring.concat([geo.ring[0]]), dash: true }].concat(geo.arms.map((pts) => ({ pts, dash: true })), geo.roads.map((pts) => ({ pts }))), inner: D.id === 'parkland' ? holeOpenings(sc, cx, cy, Rc - HALF) : [] }; // 6.2: the hole's parapet open over the road beneath
      const ringDeck = ringLayer(rr, 1, cx, cy, Rc, (x, y) => !roadOk(x, y, OUTER + C + 4) || sc.stairs.some((st) => x > st.x - C && x < st.x + st.w + C && Math.abs(y - st.y - st.h / 2) < st.h / 2 + HALF), sc.stairs.map((st) => [st.x + 2, st.x + st.w - 2, st.side]), D.id === 'parkland' ? turfC : null); // P6.4: Parkland's ring planted on its shoulders
      ringDeck.front = 1e5; ringDeck.extend = true; ringDeck.cars = () => ringSim.cars.concat((sc.seam || []).filter((g) => g.deck)); // P5.3: and highway cars arriving from next door
      sc.layers.push(ringDeck); sc.ringDeck = ringDeck;
      // 6.2 (Edit 70): no island. The ring's hole stands open over the boulevard; the dummy steps off its inner edge onto the traffic below
    } else {
      for (const d of hDecks) {
        const st = escalators(d.off, d.z, HALF); if (D.id === 'parkland') alignFlights(sc, st, roadOk); sc.stairs.push(...st);
        const gp = ACCESS && ACCESS.dropGaps && !(d.gaps && d.gaps.length) ? deckDropGaps(d.off, true, st.map((q) => ({ a0: q.x, a1: q.x + q.w, side: q.side })), rd) : []; // Edit 85
        sc.layers.push(straightDeck(d.off, d.z, roadOk, st, gp));
      }
      const cq = D.chongqing && D.chongqing.tile === name ? D.chongqing : null; // Edit 54: the west escalator lands on the roof plaza instead
      const links = ((D.deckLinks || {})[name] || []).concat(cq ? [{ y: cq.link[0], h: cq.link[1] - cq.link[0], side: -1 }] : []); // Edit 55.2: walkway and roof links
      for (const d of vDecks) {
        const st = d.noEsc ? (ACCESS && ACCESS.flightsMin && d.esc1 ? [deckFlight(d.off, d.z, d.esc1[0], d.esc1[1])] : []) : vEscalators(d.off, d.z, d.escY).filter((q, i) => !cq || i === 1); if (D.id === 'parkland') alignFlights(sc, st, roadOk); sc.stairs.push(...st); // Chongqing: the north flight lands on the roof plaza instead; Edit 85: a bridge's one flight
        let gaps = d.gaps.filter(([a, b]) => b > 0 && a < H).map(([a, b]) => [-1, 1].map((side) => ({ y: a, h: b - a, side, gap: true }))).flat(); // P6: broken parapets (drops)
        if (!gaps.length && ACCESS && ACCESS.dropGaps) gaps = deckDropGaps(d.off, false, st.concat(links).map((q) => ({ a0: q.y, a1: q.y + q.h, side: q.side })), rd).map((g) => ({ y: g.a0, h: g.a1 - g.a0, side: g.side, gap: true })); // Edit 85
        const wl = D.id === 'waterfront' ? WSTAIRS.filter((q) => q.axis === 'x' && Math.abs(Math.abs(q.high - ox - d.off) - HALF) < 2).map((q) => ({ y: q.y - oy, h: q.h, side: q.high - ox < d.off ? -1 : 1 }))
          .concat(VP.walkways.filter((w) => w.pts[0][1] === w.pts[1][1]).flatMap((w) => w.pts.filter((q) => Math.abs(Math.abs(q[0] - ox - d.off) - HALF) < 2).map((q) => ({ y: q[1] - oy - P['world.walkwayWidth'] / 2, h: P['world.walkwayWidth'], side: q[0] - ox < d.off ? -1 : 1 })))) : []; // P6: the bridge escalators open the parapet; P6.3: so does a walkway's join
        const l = vDeck(d.off, d.z, roadOk, st, links.concat(gaps, wl)); l.from = d.from; sc.layers.push(l);
        if (d.from != null && d.from > 0) { l.L.d.fill(0, 0, Math.min(AH, Math.round(d.from / U)) * AW); l.cols = l.cols.filter((c) => c.cy > d.from + C); } // P6: on the hill the bridge is a street (drawn with the hill)
      }
    }
    let flySim = null;
    if (D.flyover) { // Edit 55 (example): the 45° road on a Z1 deck over the W–E road; its own traffic, which never meets the road below
      flySim = sceneSim(D.flyover, [], [], X.lanesOf(D.flyover, P), false); flySim.raised = true;
      const fl = ringLayer({ geoms: [{ pts: D.flyover, dash: true }] }, 1, 400, 320, 0, (x, y) => !roadOk(x, y, OUTER + C + 4), []);
      fl.front = 1e5; fl.cars = () => flySim.cars; sc.layers.push(fl);
    }
    if (D.id === 'waterfront') waterPre(sc, B, name, roadOk, runs); // P6: the valley's terrain, layers and stairs before the stairs are drawn
    for (const st of sc.stairs) { sc.props.push(stairProp(st, st.z === 2 ? Z2 : Z1)); const fx = st.axis === 'x' ? (st.side < 0 ? st.x : st.x + st.w) : st.x + SWD / 2, fy = st.axis === 'x' ? st.y + st.h / 2 : (st.side > 0 ? st.y + st.h : st.y); if (rd(fx, fy) < LW) console.warn('escalator foot in a lane', D.id, name); }
    let bk = null, bkOf = null, bkN = -1; // P6.3: every flight and its apron, as the kit adds flights
    const blocked = () => { if (bkOf !== sc.stairs || bkN !== sc.stairs.length) { bkOf = sc.stairs; bkN = sc.stairs.length; bk = sc.stairs.map((st) => [st.x - 24, st.y - 24, st.w + 48, st.h + 48]).concat(sc.stairs.map((st) => { const a = apronOf(st); return [a.x - 8, a.y - 8, a.w + 16, a.h + 16]; }), sc.stairs.map(foreOf)); } return bk; }; // 6.2 (Edit 70): and a forecourt beyond the apron
    const underDeck = (wx, wy) => sc.layers.some((l) => l.inBand(wx, wy));
    const inRects = (rs, wx, wy, m) => rs.some((r) => wx > r[0] - m && wx < r[0] + r[2] + m && wy > r[1] - m && wy < r[1] + r[3] + m);
    const free = (wx, wy, m) => roadOk(wx, wy, OUTER + (m || 24)) && !underDeck(wx, wy) && !inRects(blocked(), wx, wy, 0) && !inRects(sc.reserve, wx, wy, 0);
    // ---- the district's kit
    if (D.kit === 'example') { gardenPave(B, (wx, wy) => roadOk(wx, wy, OUTER), null); }
    else if (D.id === 'parkland') parkTile(sc, B, name, roadOk, free, rng, runs);
    else if (D.id === 'waterfront') waterTile(sc, B, name, roadOk, free, rng, runs);
    else monumentTile(sc, B, name, roadOk, free, rng, runs);
    for (const l of sc.layers) if (l.shadeOn && !l._shaded) l.shadeOn(B); // P6: one shadow per slab (a walkway the kit shaded is not shaded twice)
    for (const st of sc.stairs) apronMat(B, st); // P6.4 (Edit 66): every apron lit, chevrons into its flight
    sc.setPiece = plan[2]; sc.hasLevel = !!(sc.stairs.length || sc.walk || sc.terraces || sc.ringDeck || sc.hillLayer || sc.layers.some((l) => l.dk)); // P6: a hilltop screen is its own level // Edit 54: scenography and/or a change of level on every tile
    if (!sc.setPiece || (sc.setPiece !== 'scenery' && !sc.hasLevel)) console.warn('tile without its set piece', D.id, name, sc.setPiece);
    // traffic
    if (!sc.lab) {
      const dl = X.deckLanesOf(sc.layers.filter((l) => l.dk).map((l) => ({ hz: l.dk.hz, off: l.dk.off })), P);
      const s = sceneSim(center, sc.layers.filter((l) => l.dk).map((l) => ({ hz: l.dk.hz, off: l.dk.off, z: l.dk.z })), dl, lanes, busOK);
      s.level.patches = patches; s.noDeckBus = D.id === 'parkland';
      sims.push(s); sc.main = s;
    } else if (sc.layers.some((l) => l.dk)) { // a junction screen under a highway: the highway's own traffic
      const ls = sc.layers.filter((l) => l.dk), s = sceneSim([[-900, -900], [-850, -900]], ls.map((l) => ({ hz: l.dk.hz, off: l.dk.off, z: l.dk.z })), X.deckLanesOf(ls.map((l) => ({ hz: l.dk.hz, off: l.dk.off })), P), [], false);
      s.schedule = []; sims.push(s); sc.deckOnly = s;
    }
    if (ringSim) { ringSim.elev0 = 1; sims.push(ringSim); }
    if (flySim) sims.push(flySim);
    if (sc.hillSim) { sc.hillSim.elev0 = 1; sims.push(sc.hillSim); } // P6: the Waterfront's hill streets at Z1
    for (const s of sims) if (s.elev0 == null) s.elev0 = 0;
    sc.sims = sims; sc.roadOk = roadOk; sc.runs = runs;
    CAP = null;
    PARKGRID = null;
    for (const l of sc.layers) if (l.cols) l.cols = l.cols.filter((c) => !sc.stairs.some((st) => { const f = foreOf(st), a = apronOf(st); return [f, [a.x, a.y, a.w, a.h]].some((r) => c.x < r[0] + r[2] + 12 && c.x + 2 * (c.cx - c.x) > r[0] - 12 && c.y < r[1] + r[3] + 12 && c.y + 2 * (c.cy - c.y) > r[1] - 12); })); // 6.2: no column in a flight's apron or forecourt
    sc.game = gameData(sc);
    return sc;
  }
  // ---------- Parkland: gardens, water, the Z1 ring
  function diagRoads(sc) { // 6.2 (Edit 70): distance to the centre line of the district's straight 45° Z0 roads, in screen coordinates
    const ox = sc.col * W, oy = sc.row * H, segs = [];
    for (const r of sc.D.roads || []) for (let i = 0; i + 1 < r.pts.length; i++) {
      const a = r.pts[i], b = r.pts[i + 1], dx = b[0] - a[0], dy = b[1] - a[1];
      if (Math.abs(Math.abs(dx) - Math.abs(dy)) < 0.5 && Math.abs(dx) > 40) segs.push([a[0] - ox, a[1] - oy, dx, dy, dx * dx + dy * dy]);
    }
    if (!segs.length) return null;
    return (x, y) => { let m = 1e9; for (const [ax, ay, dx, dy, l2] of segs) { const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2)), qx = ax + dx * t - x, qy = ay + dy * t - y; m = Math.min(m, qx * qx + qy * qy); } return Math.sqrt(m); };
  }
  function parkTile(sc, B, name, roadOk, free0, rng, runs) {
    // Prototype 6.2 (Edit 70): one grid for everything. Every piece sits in garden cells; paths run between, a seam path whole
    // inside the screen; along a 45° road a verge and a footpath run parallel and the grid starts behind them.
    const WT = P['world.wallThickness'];
    EDGE = { W: sc.col > 0 ? GP : WT + GP, E: sc.col < 2 ? GP : WT + GP, N: sc.row > 0 ? GP : WT + GP, S: sc.row < 2 ? GP : WT + GP }; DIAG = diagRoads(sc);
    const free = (wx, wy, m) => free0(wx, wy, m) && (!DIAG || DIAG(wx, wy) > SETBACK() + (m || 0));
    const okP = (wx, wy) => roadOk(wx, wy, OUTER);
    gardenPave(B, okP, null, false, DV); // P6.5 (Edit 67): paved, as an Expo site; lawns are parterres. P6.6: grass verges (world.gardenVerge) frame the paths
    const R = sc.reserve, led = (i) => LEDS[i % LEDS.length], u = (v) => v / U;
    sc.pieces = sc.pieces || [];
    const piece = (kind, c0, r0, c1, r1) => { const r = cellRect(c0, r0, c1, r1); sc.pieces.push({ kind, rect: [r[0], r[1], r[2] - r[0], r[3] - r[1]] }); R.push([r[0], r[1], r[2] - r[0], r[3] - r[1]]); return r; };
    const SP = { // the tile's set piece, in garden cells (c0, r0, c1, r1)
      A1: ['reservoir', 0, 2, 1, 4], C1: ['lantern pavilion', 3, 1, 3, 1], A2: ['canal', 0, 3, 1, 3], C2: ['amphitheatre', 3, 0, 4, 1],
      A3: ['belvedere', 3, 0, 4, 1], B3: ['sculpture court', 0, 1, 1, 2], C3: ['sculpture court', 3, 1, 4, 2] }[name];
    const sp = SP ? piece(...SP) : null, pools = [];
    if (name === 'B2') pools.push(piece('pool', 3, 0, 4, 1), piece('pool', 0, 3, 1, 4)); // the two reflecting pools, by the ring
    if (name === 'B1') for (let r = 1; r <= 4; r++) pools.push(piece('cascade pool', 1, r, 1, r)); // the cascade: one pool a cell, stepping down south beside the highway
    if (name === 'B1') R.push([0, 280, 800, 80]); // under the walkway
    if (name === 'C1') R.push([0, 280, 520, 80]);
    if (name === 'A1') R.push([600, 280, 240, 80]);
    if (name === 'A3') sc.stairs.push({ x: 624, y: 200, w: SWD, h: X.stairRun(P, 0, 1), axis: 'y', low: 200 + X.stairRun(P, 0, 1), high: 200, side: 0, z: 1 }); // P6.3: the belvedere's stair, before the beds (its axis on the x 640 path)
    const run1 = X.stairRun(P, 0, 1), escC1 = { x: 480 - SWD / 2, y: 336, w: SWD, h: run1, axis: 'y', low: 336 + run1, high: 336, side: 0, z: 1 }, escA1 = { x: 640 - SWD / 2, y: 304 - run1, w: SWD, h: run1, axis: 'y', low: 304 - run1, high: 304, side: -1, z: 1 };
    if (name === 'C1') sc.stairs.push(escC1); if (name === 'A1') sc.stairs.push(escA1); // 6.2: the walkway's flights before the beds, so their aprons stay clear
    const anchor = sp ? [sp[0], sp[1], sp[2] - sp[0], sp[3] - sp[1]] : name === 'B2' ? [200, 100, 400, 440] : null; // Edit 55: the tile's set piece is its large unit
    gardenPlan(B, { bedOk: (wx, wy) => free(wx, wy, 8), rng, leds: LEDS, pools: name !== 'B2', anchor, sc, seed: sc.col * 3 + sc.row * 7 });
    if (name === 'B2') for (const r of pools) poolFP(B, chamf(r[0] + 8, r[1] + 8, r[2] - 8, r[3] - 8, 24)); // P6.5: the two pools back; 6.2: on the grid, paths all round
    if (name === 'A1') { // reservoir terraces; P6.6 (Edit 68): stepped up to the back (north), each tier spilling over its front into the one below
      for (let i = 0; i < 3; i++) { const x0 = sp[0] + 8 + i * 32, x1 = sp[2] - 8 - i * 32, y0 = sp[1] + 8 + i * 6, y1 = sp[3] - 8 - i * 96, base = i * 4; waterBlock(B, u(x0), u(y0), u(x1), u(y1), 8, base, 3);
        if (i) for (let x = Math.round(u(x0 + (x1 - x0) * 0.3)); x <= Math.round(u(x0 + (x1 - x0) * 0.7)); x++) if (x % 2 === 0) for (let t = 0; t <= base + 3; t++) B.put(x, Math.round(u(y1)) - t, t > base + 1 ? K.white : x % 4 === 0 ? mixK(N.cyan, K.white, 0.5) : N.water2); }
      sc.terraces = true; }
    const cas = (r, i) => [u(r[0] + 12), u(r[1] + (i ? 16 : 32)), u(r[2] - 12), u(r[3] - 12), 12 - i * 3]; // Edit 92: the cascade's pools, as drawn
    if (name === 'B1' && ART()) pools.forEach((r, i) => { if (i + 1 >= pools.length) return; const a = cas(r, i), b = cas(pools[i + 1], i + 1); runnel(B, (a[0] + a[2]) / 2, a[3] + 1, b[1]); });
    if (name === 'B1') pools.forEach((r, i) => waterBlock(B, u(r[0] + 12), u(r[1] + (i ? 16 : 32)), u(r[2] - 12), u(r[3] - 12), 6, 12 - i * 3, 3)); // the top pool clear of the north flight by more than a body // cascade, falling south beside the highway
    if (name === 'B1' && ART()) pools.forEach((r, i) => { if (i + 1 >= pools.length) return; const a = cas(r, i); falls(B, a[0], a[2], a[3] - a[4] - 2, a[3]); }); // Edit 92: water spills over each lip
    if (name === 'C1') { // footbridge over the avenue (x = 160) at Z1; Edit 55.2: it runs on west to the B1 highway. 6.2: its flight down the south side, on the x 480 path; the lantern pavilion in its cell
      const esc = [escC1];
      const wpoly = [[-40, 304], [480 + SWD / 2, 304], [480 + SWD / 2, 336], [-40, 336]]; wpoly.spine = [[-40, 320], [480, 320]]; const wl = walkwayLayer([wpoly], [], esc.map((st) => [st.x, st.y, st.w, st.h]), () => true, sc.roadC);
      for (const st of esc) sc.props.push(stairProp(st, Z1));
      wl.cols = [[80, 320], [240, 320]].map(([x, y]) => ({ cx: x, cy: y, key: y + 8, x: x - 8, y: y - 8, spr: PIX.column(4, 4, Z1) }));
      wl.front = 9e5; sc.layers.push(wl); sc.walk = wl; wl.shadeOn(B); wl._shaded = true;
      block(B, u(sp[0] + 4), u(sp[1] + 6), u(sp[2] - 4), u(sp[3] - 6), 4, 0, 10, 'conc', LEDS[0], true); block(B, u(sp[0] + 20), u(sp[1] + 20), u(sp[2] - 20), u(sp[3] - 20), 3, 10, 2, 'grass', LEDS[3 % LEDS.length], false);
      if (ART()) sc.props.push({ spr: lanternSprite(), x: u((sp[0] + sp[2]) / 2), y: u((sp[1] + sp[3]) / 2) - 12, by: sp[3] - 5, bldg: 'lantern' }); // Edit 92: the paper lantern, lit; never solid
    }
    if (name === 'A2') poolFP(B, chamf(sp[0] + 8, sp[1] + 8, sp[2] - 8, sp[3] - 8, 8)); // canal under the highway's south edge (6.2: in its cells)
    if (name === 'B1' || name === 'A1') { // Edit 55.2: the Z1 walkway from C1 joins the B1 highway at both parapets and lands in A1 by escalator
      const off = sc.layers.find((l) => l.dk && !l.dk.hz), polys = [], joins = [], esc = [];
      if (name === 'B1') { const a = off.dk.off - HALF, b = off.dk.off + HALF; polys.push([[-40, 304], [a + 4, 304], [a + 4, 336], [-40, 336]], [[b - 4, 304], [840, 304], [840, 336], [b - 4, 336]]); joins.push([a - 6, 300, 12, 40], [b - 6, 300, 12, 40]); }
      else { esc.push(escA1); polys.push([[escA1.x, 304], [840, 304], [840, 336], [escA1.x, 336]]); joins.push(...esc.map((st) => [st.x, st.y, st.w, st.h])); } // P6.3: the walkway flush with the escalator's west side; 6.2: its axis on the x 640 path
      for (const p of polys) p.spine = [[p[0][0] + 24, 320], [p[1][0] - 24, 320]];
      const wl = walkwayLayer(polys, [], joins, (x, y) => roadOk(x, y, OUTER) && !(off && Math.abs(x - off.dk.off) < HALF + 16) && !pools.some((r) => x > r[0] - 8 && x < r[2] + 8 && y > r[1] - 8 && y < r[3] + 8), sc.roadC);
      for (const st of esc) sc.props.push(stairProp(st, Z1));
      wl.front = 1e6; sc.layers.push(wl); sc.walk = wl; wl.shadeOn(B); wl._shaded = true;
      if (name === 'B1') { const lk = sc.D.deckLinks.B1[0], xs = [off.dk.off - HALF, off.dk.off + HALF]; sc.props.push({ key: 1e6 + 3, draw: (F) => { for (const x0 of xs) for (let wy = lk.y + 4; wy < lk.y + lk.h - 2; wy += 8) for (let wx = x0 - 10; wx < x0 + 12; wx += U) for (let k = 0; k < 2; k++) F.put(wx / U, wy / U - Z1 + k, k ? K.jerseyTop : K.white); } }); } // zebras over the open parapets, at the lift
    }
    if (name === 'C2') { for (let i = 0; i < 4; i++) block(B, u(sp[0] + 8 + i * 24), u(sp[1] + 24 + i * 32), u(sp[2] - 8 - i * 24), u(sp[3] - 16), 10, 0, 3 + i * 3, i === 3 ? 'grass' : 'conc', i === 0 ? LEDS[0] : null, i === 0); sc.terraces = true; } // amphitheatre terraces
    if (name === 'A3') { // Edit 54: the belvedere. Four one-storey tiers to a lawn, a stair up the south face, the monolith orchard on top
      const tb = (i) => Math.round(Z1 * i / 4); // P6.3: four tiers to Z1, so the lawn on top is a floor
      for (let i = 0; i < 4; i++) block(B, u(sp[0] + 8 + i * 24), u(sp[1] + i * 16), u(sp[2] - 8 - i * 24), u(224 - i * 8), 12 - i * 2, tb(i), tb(i + 1) - tb(i), i === 3 ? 'grass' : 'conc', i === 3 ? LEDS[0] : null, i === 0);
      const lx0 = sp[0] + 80, lx1 = sp[2] - 80; // the top tier's lawn
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) { const mx = lx0 + 20 + i * (lx1 - lx0 - 40) / 2; monolith(B, u(mx), u(110 + j * 36), Z1, 12 + ((i + j) % 3) * 5, led(i + j)); sc.solidsZ.push({ x: mx - 8, y: 110 + j * 36 - 6, w: 16, h: 10, z: 1 }); }
      sc.floorsX.push({ kind: 'roof', z: 1, x: lx0, y: sp[1] + 48, w: lx1 - lx0, h: 200 - sp[1] - 48, key: 200.6, drop: false }); // the lawn: its edges hold; down by the stair
      const st = sc.stairs.find((q) => q.x === 624 && q.high === 200); sc.props.push(stairProp(st, Z1)); sc.terraces = true;
    }
    if (name === 'B3') sculptureCourt(B, u(sp[0] + 8), u(sp[1] + 8), u(sp[2] - 8), u(sp[3] - 8), 10, 'obelisk', ['ring', 'ring'], LEDS[0]); // Edit 55: the obelisk large, two rings, a row of lit bollards
    if (name === 'C3') sculptureCourt(B, u(sp[0] + 8), u(sp[1] + 8), u(sp[2] - 8), u(sp[3] - 8), 20, 'arch', ['cubes', 'fins'], led(3)); // Edit 55: at grade (nothing below ground)
    EDGE = null; DIAG = null;
  }
  // ---------- Monument: LED commerce, the snake road, two north–south highways, the walkway ring
  function monumentTile(sc, B, name, roadOk, free, rng, runs) {
    const u = (v) => v / U, R = sc.reserve, bld = (x, y, w, h, st, i, panel) => { let S = PIX.building(Math.round(u(w)), Math.round(u(h)), st * EXT(P['world.storeyHeight']), PIX.rng(700 + i * 31 + sc.col * 7 + sc.row * 3), LEDS[(i + sc.col + sc.row) % LEDS.length], st); if (panel) S = ledPanel(S, st * EXT(P['world.storeyHeight']), [N.magenta, N.cyan, LEDS[2 % LEDS.length]]); sc.props.push({ spr: S, x: u(x), y: u(y), by: y + h, bldg: 'block' }); R.push([x, y, w, h]); captureRect(x, y, w, h); };
    if (name === 'B2') return monumentCentre(sc, B, roadOk);
    if (name === 'A1') { bld(40, 24, 240, 180, 12, 1, true); if (ART()) { const p = sc.props[sc.props.length - 1]; welcomeWall(p.spr, 12 * EXT(P['world.storeyHeight'])); } } // LED-wall tower facing the entry; Edit 92: it greets the new chassis
    if (name === 'B1') { // the skybridge from a podium roof south over the road to the walkway ring
      const pod = [300, 16, 200, 140]; captureRect(...pod); sc.roofs.push({ rect: pod, z: 1 }); sc.solidsZ.push({ x: 310, y: 20, w: 120, h: 70, z: 1 });
      sc.props.push({ spr: PIX.building(Math.round(u(pod[2])), Math.round(u(pod[3])), Z1, PIX.rng(77), LEDS[1], 1), x: u(pod[0]), y: u(pod[1]), by: pod[1] + pod[3], podium: true, bldg: 'podium' });
      sc.props.push({ spr: PIX.building(Math.round(u(120)), Math.round(u(70)), 10 * EXT(P['world.storeyHeight']), PIX.rng(78), LEDS[2 % LEDS.length], 10), x: u(310), y: u(20) - Z1, by: 90, tower: true });
      const poly = [[386, 140], [414, 140], [414, H + 40], [386, H + 40]]; poly.spine = [[400, 160], [400, H]];
      const wl = walkwayLayer([poly], [pod], [], (x, y) => roadOk(x, y, OUTER), sc.roadC);
      wl.front = 1e6; sc.layers.push(wl); sc.walk = wl; wl.shadeOn(B); wl._shaded = true; R.push([290, 0, 220, 170]);
      const run = X.stairRun(P, 0, 1), st = { x: 456, y: pod[1] + pod[3], w: SWD, h: run, axis: 'y', low: pod[1] + pod[3] + run, high: pod[1] + pod[3], side: 0, z: 1 }; // P6.3: up to the podium roof, east of the skybridge
      sc.stairs.push(st); sc.props.push(Object.assign(stairProp(st, Z1), { key: 1e6 })); // after the podium
    }
    if (name === 'C1') { const dx = 450, dy = 540, rx = 56, ry = 28; capture((wx, wy) => ((wx - dx) / rx) ** 2 + ((wy - dy) / ry) ** 2 <= 1, dx - rx, dy - ry, dx + rx, dy + ry, true); const S = drum(rx / U, ry / U, 12 * EXT(P['world.storeyHeight']), N.cyan); sc.props.push({ spr: S, x: u(dx), y: u(dy), by: dy + ry + 2, bldg: 'drum', plan: [dx - 39, dy - 19, 78, 38] }); R.push([dx - rx - 16, dy - ry - 16, 2 * rx + 32, 2 * ry + 32]); } // LED drum in the bend (P6.3: solid to its ellipse)
    if (name === 'A2') { bld(656, 416, 136, 96, 3, 2, true); bld(336, 430, 128, 80, 3, 5, true); if (ART()) sc.props.slice(-2).forEach((p, k) => { shopSigns(p.spr, 3 * EXT(P['world.storeyHeight']), k); for (let x = Math.round(p.x) + 2; x < p.x + p.spr.w - 3; x++) for (let t = 1; t <= 3; t++) B.mix(x, Math.round(p.by / U) + t, [N.magenta, N.cyan][(Math.floor(x / 8) + k) % 2], 0.4 - t * 0.1); }); } // neon arcades either side of the highway, south of the road; Edit 92: shopfronts and their glow
    if (name === 'C2') chongqing(sc, B, sc.D.chongqing);
    if (name === 'A3') { tiles(B, (wx, wy) => wx > 200 && wx < 472 && wy > 416 && wy < 632 && roadOk(wx, wy, OUTER), true); cubeStack(sc, B, [[144, 262, 64, 40, 28], [166, 252, 62, 38, 26], [134, 258, 56, 34, 24]], 604, 640); R.push([184, 400, 300, 240]); } // on a lit plaza // Edit 54: stacked LED cubes, each cantilevered off the one below
    if (name === 'B3') { // the LED canyon either side of the jog; Edit 54: a Z1 skybridge crosses the jog at 90°. P6.3 (Edit 65): from podium roof
      // to podium roof, meeting the south-west roof's east edge and the north-east roof's south edge at 45°; an escalator up the north-east podium
      const pods = [[40, 440, 240, 120, [48, 446, 120, 64, 7]], [520, 140, 260, 110, [652, 144, 120, 60, 8]]];
      pods.forEach(([x, y, w, h, tw], i) => {
        captureRect(x, y, w, h); sc.roofs.push({ rect: [x, y, w, h], z: 1 }); R.push([x, y, w, h]);
        sc.props.push({ spr: PIX.building(Math.round(u(w)), Math.round(u(h)), Z1, PIX.rng(83 + i), LEDS[(i + 1) % LEDS.length], 1), x: u(x), y: u(y), by: y + h, podium: true, bldg: 'podium' });
        const [txx, tyy, tww, thh, n] = tw, Ht = n * EXT(P['world.storeyHeight']); sc.solidsZ.push({ x: txx, y: tyy, w: tww, h: thh, z: 1 });
        sc.props.push({ spr: ledPanel(PIX.building(Math.round(u(tww)), Math.round(u(thh)), Ht, PIX.rng(87 + i), LEDS[(i + 3) % LEDS.length], n), Ht, [N.magenta, N.cyan, LEDS[2 % LEDS.length]]), x: u(txx), y: u(tyy) - Z1, by: tyy + thh, tower: true });
      });
      const hw = P['world.walkwayWidth'] / 2 / Math.SQRT2, a = [262, 538], b = [566, 234], poly = [[a[0] + hw, a[1] + hw], [b[0] + hw, b[1] + hw], [b[0] - hw, b[1] - hw], [a[0] - hw, a[1] - hw]]; poly.spine = [[a[0], a[1]], [b[0], b[1]]];
      const wl = walkwayLayer([poly], pods.map((q) => q.slice(0, 4)), [], (x, y) => roadOk(x, y, OUTER) && !(x < 290 && y > 430) && !(x > 510 && y < 260), sc.roadC);
      wl.front = 1e6; sc.layers.push(wl); sc.walk = wl; wl.shadeOn(B); wl._shaded = true; R.push([250, 230, 330, 320]);
      const run = X.stairRun(P, 0, 1), st = { x: 520 - run, y: 168, w: run, h: SWD, axis: 'x', low: 520 - run, high: 520, side: 0, z: 1 };
      sc.stairs.push(st); sc.props.push(Object.assign(stairProp(st, Z1), { key: 1e6 }));
    }
    if (name === 'C3') { // an LED gateway arch over the road: pylons either side, a lit beam above the traffic
      const ax = 560, top = 400 - 24, bot = 560 + 24, Hh = 40;
      let Lr = new PIX.Buf(AW, AH);
      if (ART()) Lr = gatewayLayer(B, ax, top, bot, Hh); // Edit 92: pylons, a deep beam with chevrons, its shadow
      else {
        for (const py of [top, bot]) for (let z = 0; z < Hh; z++) for (let i = -2; i <= 2; i++) Lr.put(u(ax) + i, u(py) - z, i < 0 ? CON.d : i > 0 ? CON.l : CON.m);
        for (let y = u(top) - Hh; y <= u(bot) - Hh; y++) for (let i = -3; i <= 3; i++) Lr.put(u(ax) + i, y, Math.abs(i) === 3 ? K.bldgOutline : (y + i) % 4 < 2 ? N.magenta : N.cyan);
      }
      sc.layers.push({ L: Lr, lift: 0, z: 0, cols: [], front: 1e6 + 5, inBand: () => false, gate: true });
    }
    // further blocks: commerce with LED façades
    const placed = [], [s0, s1] = sc.D.storeys;
    const flights = sc.stairs.map((st) => { const lift = (st.z === 2 ? Z2 : Z1) * U; return [st.x - 8, st.y - lift - 8, st.w + 16, st.h + lift + 16]; }); // P6.3: as drawn
    for (let t = 0; t < 900 && placed.length < 8; t++) {
      const big = t < 450, w = (big ? 128 : 64) + Math.floor(rng() * (big ? 7 : 5)) * 16, h = (big ? 96 : 64) + Math.floor(rng() * (big ? 5 : 3)) * 16, x = 8 + Math.floor(rng() * ((W - 16 - w) / 16)) * 16, y = 8 + Math.floor(rng() * ((H - 16 - h) / 16)) * 16;
      const pts = []; for (let i = 0; i <= w; i += 16) for (let j = 0; j <= h; j += 16) pts.push([x + i, y + j]);
      if (!pts.every(([px, py]) => free(px, py, 16)) || placed.some((q) => x < q.x + q.w + 16 && x + w + 16 > q.x && y < q.y + q.h + 16 && y + h + 16 > q.y)) continue;
      const st = s0 + Math.floor(rng() * (s1 - s0 + 1)), Hd = st * EXT(P['world.storeyHeight']) * U; // P6.3: a block never draws over a flight (nor a flight over a block)
      if (flights.some((r) => x < r[0] + r[2] && x + w > r[0] && y - Hd < r[1] + r[3] && y + h > r[1])) continue;
      placed.push({ x, y, w, h, st });
    }
    placed.forEach((q, i) => bld(q.x, q.y, q.w, q.h, q.st, 10 + i, i % 3 === 0));
  }
  // Edit 54 (Chongqing): the Z2 highway runs through a tower at deck level, and a roof plaza at Z2 opens off its parapet.
  // The tower draws after the deck, cut open where the deck passes in front of its lower face; the portal shows the deck in shade.
  function chongqing(sc, B, q) {
    const [x, y, w, h] = q.tower, Ht = q.storeys * STY, dk = sc.layers.find((l) => l.dk && !l.dk.hz && l.dk.z === 2).dk, Zd = Z2, clr = EXT(P['world.portalClearance']);
    const S = PIX.building(Math.round(w / U), Math.round(h / U), Ht, PIX.rng(54 + sc.col), LEDS[2 % LEDS.length], q.storeys), ax = Math.round(x / U), ay = Math.round(y / U);
    const b0 = Math.round((dk.off - HALF - x) / U), b1 = Math.round((dk.off + HALF - x) / U), jDeck = S.h - Zd, jTop = jDeck - clr, put = (i, j, c) => { if (i >= 0 && j >= 0 && i < S.w && j < S.h && S.d[j * S.w + i]) S.d[j * S.w + i] = c; };
    for (let j = jTop; j < S.h; j++) for (let i = b0; i < b1; i++) S.d[j * S.w + i] = 0; // the portal, and the lower face hidden behind the deck
    for (let i = b0 - 2; i < b1 + 2; i++) { put(i, jTop - 3, K.bldgOutline); put(i, jTop - 2, N.cyan); put(i, jTop - 1, i % 3 ? N.cyan : K.white); } // a lit lintel
    for (let j = jTop - 1; j < S.h - 1; j++) for (const i of [b0 - 2, b0 - 1, b1, b1 + 1]) put(i, j, i === b0 - 1 || i === b1 ? (j < jDeck ? N.magenta : K.bldgOutline) : CON.d); // jambs: lit to the deck, then the wall
    brutalShadow(B, ax, ay, Math.round(w / U), Math.round(h / U), Math.round(Ht * 0.55), null); captureRect(x, y, w, h);
    sc.props.push({ spr: S, x: ax, y: ay, by: y + h, key: 9e5 + 1, bldg: 'portal tower' });
    sc.props.push({ key: 9e5 + 2, draw: (F) => { for (let j = jTop; j < jDeck; j++) for (let i = b0; i < b1; i++) F.shade(ax + i, ay - Ht + j, 0.28 + 0.4 * (j - jTop) / clr); } }); // inside the portal: the deck and its cars in shade
    // the roof plaza: a platform at Z2 (6 storeys), its east parapet open onto the highway, its north edge open to the escalator
    const [px, py, pw, ph] = q.plaza; captureRect(px, py, pw, ph); sc.roofs.push({ rect: [px, py, pw, ph], z: 2, openE: q.link }); const run = X.stairRun(P, 0, 2), st = { x: 40, y: py - run, w: SWD, h: run, axis: 'y', low: py - run, high: py, side: 0, z: 2 };
    const top = Math.round(py / U), open = [['E', Math.round(q.link[0] / U) - top, Math.round(q.link[1] / U) - top], ['N', Math.round((st.x - px) / U), Math.round((st.x + st.w - px) / U)]];
    const Sp = PIX.building(Math.round(pw / U), Math.round(ph / U), Zd, PIX.rng(55 + sc.row), LEDS[1], 6, { ledges: [], open }), sp = (i, j, c) => { if (i >= 0 && j >= 0 && i < Sp.w && j < Sp.h) Sp.d[j * Sp.w + i] = c; };
    for (const [i0, j0] of [[8, 20], [8, 34], [40, 34]]) for (let j = 0; j < 7; j++) for (let i = 0; i < 12; i++) sp(i0 + i, j0 + j, j === 0 || j === 6 || i === 0 || i === 11 ? (j === 6 ? K.bldgOutline : CON.l) : (i + j) % 4 === 0 ? K.foliageL : K.foliage); // planters on the plaza
    for (let i = 4; i < Sp.w - 6; i += 6) sp(i, Math.round(ph / U) - 4, N.cyan); // bollard lights along the south parapet
    sc.props.push({ spr: Sp, x: Math.round(px / U), y: Math.round(py / U), by: py + ph, bldg: 'roof plaza' });
    sc.props.push({ key: 9e5 + 3, draw: (F) => { for (let wy = q.link[0] + 6; wy < q.link[1] - 4; wy += 8) for (let wx = dk.off - HALF - 10; wx < dk.off - HALF + 12; wx += U) for (let k = 0; k < 2; k++) F.put(wx / U, wy / U - Zd + k, k ? K.jerseyTop : K.white); } }); // a zebra over the open parapet: walk off the highway onto the roof
    sc.props.push(stairProp(st, Z2)); sc.stairs.push(st);
    sc.reserve.push([x, 0, w, y + h + 8], [0, st.y - 24, px + pw + 8, H - st.y + 24]);
  }
  function monumentCentre(sc, B, roadOk) {
    const cx = 400, cy = 320, A = P['world.walkwayRingHalf'], w = P['world.walkwayWidth'], k = P['world.walkwayRingChamfer'], ki = k - 0.586 * w, Lk = P['world.walkwayLinkLength'];
    const sq = (a, kk) => [[cx - a + kk, cy - a], [cx + a - kk, cy - a], [cx + a, cy - a + kk], [cx + a, cy + a - kk], [cx + a - kk, cy + a], [cx - a + kk, cy + a], [cx - a, cy + a - kk], [cx - a, cy - a + kk]];
    const outerP = sq(A, k), innerP = sq(A - w, ki), dCut = (2 * A - k) / 2, dFace = dCut + Lk / Math.SQRT2;
    const ringQuads = outerP.map((p, i) => [p, outerP[(i + 1) % 8], innerP[(i + 1) % 8], innerP[i]]);
    const mid = sq(A - w / 2, k - 0.293 * w); ringQuads[0].spine = mid.concat([mid[0]]);
    const diag = (sx, sy) => { const d0 = (2 * A - k - 1.414 * w) / 2, d2 = dFace + 40 / Math.SQRT2, nx = -sy * Math.SQRT1_2 * w / 2, ny = sx * Math.SQRT1_2 * w / 2, a = [cx + sx * d0, cy + sy * d0], b = [cx + sx * d2, cy + sy * d2];
      const q = [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]]; q.spine = [[cx + sx * dCut, cy + sy * dCut], [cx + sx * dFace, cy + sy * dFace]]; return q; };
    const fx = Math.round(cx - dFace), fyN = Math.ceil(cy - dFace + 0.707 * w + 6), fyS = Math.floor(cy + dFace - 0.707 * w - 6);
    const podiums = [[16, 8, fx - 16, fyN - 8], [W - fx, 8, fx - 16, fyN - 8], [16, fyS, fx - 16, H - 8 - fyS], [W - fx, fyS, fx - 16, H - 8 - fyS]];
    const run = X.stairRun(P, 0, 1);
    const esc = [{ x: cx - A + k + 8, y: cy - A - run, w: SWD, h: run, axis: 'y', low: cy - A - run, high: cy - A, side: -1, z: 1 },
      { x: cx + A - k - 8 - SWD, y: cy + A, w: SWD, h: run, axis: 'y', low: cy + A + run, high: cy + A, side: 1, z: 1 },
      { x: cx - A + w, y: cy - 64, w: run, h: SWD, axis: 'x', low: cx - A + w + run, high: cx - A + w, side: 0, z: 1 }, // P6.3: off the axis, its apron clear of the monument
      { x: cx + A - w - run, y: cy + 32, w: run, h: SWD, axis: 'x', low: cx + A - w - run, high: cx + A - w, side: 0, z: 1 }];
    const sp = sc.split, fE = PIX.roadField([{ pts: sp.E }], 120), fW = PIX.roadField([{ pts: sp.Wl }], 120);
    const laneD = (x, y) => { const kk = Math.floor(y / U) * AW + Math.floor(x / U); return Math.min(fE.D[kk], fW.D[kk]); };
    const sky = [[386, -40], [414, -40], [414, cy - A + 8], [386, cy - A + 8]]; // the skybridge from B1 joins the ring's north side
    const wl = walkwayLayer(ringQuads.concat([diag(-1, -1), diag(1, -1), diag(-1, 1), diag(1, 1), sky]), podiums, esc.map((s) => [s.x, s.y, s.w, s.h]), (x, y) => laneD(x, y) > LW / 2 + 14, (x, y) => laneD(x, y), null, [LW / 2]); // each carriageway is one lane: its centre is the road's; its markings its edges
    sc.layers.push(wl); sc.walk = wl;
    const okP = (wx, wy) => roadOk(wx, wy, OUTER) && wx > fx + 8 && wx < W - fx - 8;
    tiles(B, okP, false); // P6.4 (Edit 66): square paving, as the district's ground; no 45° lattice
    each((x, y, wx, wy) => { if (!roadOk(wx, wy, OUTER) || wx < 150 || wx > W - 150 || Math.abs(wy - cy) > P['world.splitLaneOffset']) return; B.put(x, y, (x % 8 === 0 || y % 8 === 0) ? CON.m : (x % 16 === 4 && y % 16 === 4 ? CON.l : ISL)); });
    for (const st of [esc[0], esc[1]]) { // guide strips: a lit band from the screen's edge straight to each ring escalator's apron (from B1, from B3)
      const a = apronOf(st), cxs = st.x + st.w / 2, ya = st.low < cy ? 0 : a.y + a.h, yb = st.low < cy ? a.y : H;
      each((x, y, wx, wy) => { if (wy < ya || wy > yb || Math.abs(wx - cxs) > 16 || !okP(wx, wy)) return; const e = Math.abs(wx - cxs) > 13; B.put(x, y, e ? CON.l : Math.abs(wx - cxs) < 1.5 && Math.floor(wy / 8) % 2 ? N.cyan : (y % 8 === 0 ? CON.m : mixK(N.tile, CON.l, 0.25))); });
    }
    planter(B, 540, 96, 48, 26, 'monolith', LEDS[0]); planter(B, 280, 552, 48, 26, 'tiers', LEDS[3 % LEDS.length]);
    for (const [sx, sy, kind] of [[250, 60, 'arch'], [400, 600, 'fins'], [330, 372, 'cubes'], [470, 268, 'ring']]) sculpture(B, sx / U, sy / U, kind, LEDS[(sx + sy) % LEDS.length]);
    for (const st of esc) sc.props.push(stairProp(st, Z1));
    sc.stairs = esc;
    podiums.forEach(([x, y, pw, ph]) => { captureRect(x, y, pw, ph); sc.roofs.push({ rect: [x, y, pw, ph], z: 1 }); });
    [[16, 8, 96, 56], [W - 112, 8, 96, 56], [16, fyS, 96, 64], [W - 112, fyS, 96, 64]].forEach(([x, y, tw, th]) => sc.solidsZ.push({ x, y, w: tw, h: th, z: 1 }));
    podiums.forEach(([x, y, pw, ph], i) => sc.props.push({ spr: PIX.building(Math.round(pw / U), Math.round(ph / U), Z1, PIX.rng(91 + i * 13), LEDS[(i + 1) % LEDS.length], 1), x: x / U, y: y / U, by: y + ph, podium: true, bldg: 'podium' }));
    [[16, 8, 96, 56], [W - 112, 8, 96, 56], [16, fyS, 96, 64], [W - 112, fyS, 96, 64]].forEach(([x, y, tw, th], i) => sc.props.push({ spr: PIX.building(Math.round(tw / U), Math.round(th / U), (7 + i * 2) * EXT(P['world.storeyHeight']), PIX.rng(57 + i * 29), LEDS[(i + 2) % LEDS.length], 7 + i * 2), x: x / U, y: y / U - Z1, by: y + th, tower: true }));
    sc.monument = { cx, cy };
  }
  // ---------- P6 (GDD Edit 62): play data for one screen. A floor is a test on the dummy's centre at its level: a deck band,
  // the ring's surface, a walkway, the hill, a terrace or a roof. Stairs join the ground to a floor. Solids: rects and the
  // hill polygon at Z0; rects above, at their level. Water: a fall is a drone rescue (D37). Spawns and cone homes.
  const R0 = P['body.radius'], AWAY = Object.freeze({ alive: false, x: -1e5, y: -1e5, vx: 0, vy: 0, level: 0, floor: null, stair: null, mode: 'away', facing: 0, parts: null });
  const inR = (r, x, y, m) => x >= r.x - (m || 0) && x <= r.x + r.w + (m || 0) && y >= r.y - (m || 0) && y <= r.y + r.h + (m || 0);
  function polyDist(poly, x, y) { // distance to the outline and its nearest point
    let best = { d: Infinity, qx: x, qy: y };
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const [ax, ay] = poly[j], dx = poly[i][0] - ax, dy = poly[i][1] - ay, l2 = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / l2));
      const qx = ax + dx * t, qy = ay + dy * t, d = hyp(x - qx, y - qy);
      if (d < best.d) best = { d, qx, qy };
    }
    return best;
  }
  function mergeRects(rs) { // the capture's row runs, stacked where they share a span
    const out = [], open = new Map();
    for (const r of rs.slice().sort((a, b) => a.x - b.x || a.w - b.w || a.y - b.y)) {
      const k = r.kind + ':' + r.ht + ':' + r.x + ':' + r.w, o = open.get(k);
      if (o && Math.abs(o.y + o.h - r.y) < 0.5) { o.h += r.h; continue; }
      const n = { x: r.x, y: r.y, w: r.w, h: r.h, kind: r.kind }; if (r.ht != null) n.ht = r.ht; open.set(k, n); out.push(n);
    }
    return out;
  }
  const rectFloor = (kind, z, x, y, w, h) => ({ kind, z, x, y, w, h, drop: true, has: (px, py) => px >= x - 1 && px <= x + w + 1 && py >= y - 1 && py <= y + h + 1 });
  function deckFloor(l) { // the deck between its parapets, less the body's radius; open across the parapet at a stair head, a link or a gap
    const dk = l.dk, hz = dk.hz, off = dk.off, from = l.from != null && l.from > 0 ? l.from : -1e9, hold = HALF - PW - R0, ops = (l.openings || []).concat(l.gapSpans || []), gs = l.gapSpans || [];
    return { kind: 'deck', z: dk.z, layer: l, drop: false,
      has: (x, y) => { const a = hz ? x : y, d = (hz ? y : x) - off; if (a < from) return false; if (Math.abs(d) <= hold) return true; if (Math.abs(d) > HALF + 2) return false; const sd = d < 0 ? -1 : 1; return ops.some((o) => o.side === sd && a >= o.a0 && a <= o.a1); },
      dropAt: (x, y) => { const a = hz ? x : y, sd = (hz ? y : x) < off ? -1 : 1; return gs.some((o) => o.side === sd && a >= o.a0 - 2 && a <= o.a1 + 2); } };
  }
  function ringFloor(l) { // the lifted ring and its arms: the road field, less parapet and radius; open at its escalator heads
    const D = l.field.D, hold = HALF - PW - R0, ops = l.openings || [], cy = l.ring.cy, cx = l.ring.cx, inner = l.ring.inner || [], rIn = l.ring.Rc - HALF;
    const inArc = (x, y) => inner.some(({ a0, a1 }) => { const t = Math.atan2(y - cy, x - cx), c = (a0 + a1) / 2; return Math.abs(Math.atan2(Math.sin(t - c), Math.cos(t - c))) <= (a1 - a0) / 2; });
    return { kind: 'ring', z: l.z, layer: l, drop: false,
      dropAt: (x, y) => inner.length > 0 && hyp(x - cx, y - cy) < rIn + 2 && inArc(x, y), // 6.2 (Edit 70): off the hole's open edge, onto the road below
      has: (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const d = D[Math.floor(y / U) * AW + Math.floor(x / U)]; if (d <= hold) return true; if (inner.length) { const r = hyp(x - cx, y - cy); if (r >= rIn + 1 && r < rIn + PW + R0 + 2 && inArc(x, y)) return true; } if (d > HALF + 2) return false; return ops.some(([a, b, sd]) => x > a && x < b && (sd > 0 ? y > cy : y < cy)); } };
  }
  // Edit 85 (P7.4): the share of a cone's pixels the player sees at (x, y): not under a raised layer drawn over it (its pixels
  // at their lift), not behind a prop drawn after it (a building's face, a podium, a flight)
  function coneShows(sc, x, y) {
    const S = PIX.CONE, key = y + 6, x0 = Math.round(x / U) - S.ox, y0 = Math.round(y / U) - S.oy; let tot = 0, hid = 0;
    for (let j = 0; j < S.h; j++) for (let i = 0; i < S.w; i++) {
      if (!S.d[j * S.w + i]) continue; tot++;
      const px = x0 + i, py = y0 + j;
      if (sc.layers.some((l) => { if (!(l.front > key)) return false; const ly = py + (l.lift || 0), Lh = l.L.h || AH; return px >= 0 && px < AW && ly >= 0 && ly < Lh && !!l.L.d[ly * AW + px]; })) { hid++; continue; }
      if (sc.props.some((p) => { const k = p.podium ? 1e6 - 1 : p.key != null ? p.key : p.over ? 1e6 + 1 : p.by; if (!(k > key) || !p.spr) return false; const s2 = p.spr, qx = px - (Math.round(p.x) - s2.ox), qy = py - (Math.round(p.y) - s2.oy); return qx >= 0 && qy >= 0 && qx < s2.w && qy < s2.h && !!s2.d[qy * s2.w + qx]; })) hid++;
    }
    return tot ? 1 - hid / tot : 1;
  }
  function gameData(sc) {
    const floors = [];
    for (const l of sc.layers) {
      const f = l.dk ? deckFloor(l) : l.ring ? ringFloor(l) : l.walk ? { kind: 'walk', z: 1, layer: l, drop: false, dropAt: (x, y) => l.gapAt(x, y), has: (x, y) => l.polys.some((p) => PIX.inPoly(p, x, y)) } : null; // P6.2: a walkway drops only through its one opening per road
      if (f) floors.push(f);
    }
    for (const q of sc.floorsX) floors.push(q.poly ? { kind: q.kind, z: q.z, layer: q.layer, drop: q.drop, poly: q.poly, has: (x, y) => PIX.inPoly(q.poly, x, y) } : Object.assign(rectFloor(q.kind, q.z, q.x, q.y, q.w, q.h), { key: q.key, drop: q.drop }));
    for (const rf of sc.roofs) floors.push(Object.assign(rectFloor('roof', rf.z, rf.rect[0], rf.rect[1], rf.rect[2], rf.rect[3]), { key: rf.z === 2 ? rf.rect[1] + rf.rect[3] + 0.6 : 1e6 - 0.5 }));
    floors.forEach((f, i) => { f.i = i; if (f.kind === 'walk' || f.kind === 'deck' || f.kind === 'ring') f.rail = true; }); // Edit 75: railed floors (handrails, parapets): jumpable
    const statics = mergeRects(sc.solids);
    // Edit 75: the jumpable tag (terrain table, column jumpable). At Z0 a mass drawn no taller than proto.art.jumpableTop art
    // px (a planter and its hedge, a bed, reeds) is a low barrier: jumpable, counted at world.jumpableHeight. Edge pieces
    // (planter, bound, wall, booth), buildings, columns, stairs and sculptures never are. Above Z0 the rails of walkways,
    // highway decks and lifted rings are handrails: jumpable, at world.jumpableHeight.
    // A piece counts whole (its touching runs together): no deeper than world.jumpableDepth across, so a jump clears it.
    const low = statics.filter((q) => q.kind === 'mass' && q.ht != null && q.ht <= P['proto.art.jumpableTop']);
    const up = low.map((_, i) => i), find = (i) => (up[i] === i ? i : (up[i] = find(up[i])));
    for (let i = 0; i < low.length; i++) for (let j = i + 1; j < low.length; j++) { const a = low[i], c = low[j]; if (a.x <= c.x + c.w + 0.5 && c.x <= a.x + a.w + 0.5 && a.y <= c.y + c.h + 0.5 && c.y <= a.y + a.h + 0.5) up[find(i)] = find(j); }
    const box = new Map(); low.forEach((q, i) => { const k = find(i), bx = box.get(k) || { x0: 1e9, y0: 1e9, x1: -1e9, y1: -1e9 }; bx.x0 = Math.min(bx.x0, q.x); bx.y0 = Math.min(bx.y0, q.y); bx.x1 = Math.max(bx.x1, q.x + q.w); bx.y1 = Math.max(bx.y1, q.y + q.h); box.set(k, bx); });
    low.forEach((q, i) => { const bx = box.get(find(i)); if (Math.min(bx.x1 - bx.x0, bx.y1 - bx.y0) <= P['world.jumpableDepth'] + 1e-9) { q.jumpable = true; q.zTop = P['world.jumpableHeight']; q.piece = [bx.x0, bx.y0, bx.x1 - bx.x0, bx.y1 - bx.y0]; } });
    for (const l of sc.layers) for (const c of l.cols || []) statics.push({ x: c.x, y: c.y, w: 2 * (c.cx - c.x), h: 2 * (c.cy - c.y), kind: 'column' });
    if (sc.monument) statics.push({ x: sc.monument.cx - 40, y: sc.monument.cy - 18, w: 80, h: 36, kind: 'monument' });
    const stairs = [], propOf = new Map(sc.props.filter((p) => p.stair).map((p) => [p.stair, p]));
    for (const st of sc.stairs) {
      const z = st.z || 1, dir = Math.sign(st.high - st.low), lat = st.axis === 'y' ? st.x + st.w / 2 : st.y + st.h / 2;
      let head = -1;
      for (const k of [4, 8, 16, 24, 32, 40]) { const a = st.high + dir * k, x = st.axis === 'y' ? lat : a, y = st.axis === 'y' ? a : lat; head = floors.findIndex((f) => f.z === z && f.has(x, y)); if (head >= 0) break; }
      const pr = propOf.get(st), key = pr ? (pr.key != null ? pr.key : pr.over ? 1e6 + 1 : pr.by) : st.y + st.h;
      if (head < 0) { statics.push({ x: st.x, y: st.y, w: st.w, h: st.h, kind: 'stair' }); continue; } // a flight with nowhere to land is scenery
      stairs.push({ x: st.x, y: st.y, w: st.w, h: st.h, axis: st.axis, low: st.low, high: st.high, from: 0, to: z, foot: null, head, key });
    }
    // where a dummy can stand at Z0: off the lanes and shoulders, clear of solids, the hill, the water, stairs and decks
    const offPoly = (x, y, m) => sc.polys0.every((p) => !PIX.inPoly(p, x, y) && polyDist(p, x, y).d > m);
    const ground = (x, y, m) => sc.roadOk(x, y, OUTER + m) && !statics.some((s) => inR(s, x, y, R0 + 6)) && offPoly(x, y, R0 + 6) && !sc.waterPolys.some((p) => PIX.inPoly(p, x, y) || polyDist(p, x, y).d < R0 + 12) && !stairs.some((s) => inR(s, x, y, R0 + 10));
    const pick = (cands, score, n, gap) => { const out = []; for (const c of cands.sort((a, b) => score(a) - score(b))) { if (out.length >= n) break; if (out.every((o) => hyp(o.x - c.x, o.y - c.y) >= gap)) out.push(c); } return out; };
    const cands = [];
    for (let y = 48; y <= H - 32; y += 16) for (let x = 32; x <= W - 32; x += 16) if (ground(x, y, 12) && !sc.layers.some((l) => l.inBand && l.inBand(x, y)) && !(sc.islands || []).some((q) => hyp(x - q.x, y - q.y) < q.r)) cands.push({ x, y, f: 90, level: 0, floor: null });
    const st0 = sc.D.start, edge = st0 && st0[0] === sc.name ? st0[1] : null;
    const score = (c) => (edge === 'top' ? c.y + Math.abs(c.x - W / 2) * 0.2 : edge === 'west' ? c.x + Math.abs(c.y - H / 2) * 0.2 : edge === 'center' ? hyp(c.x - W / 2, c.y - 0.65 * H) : hyp(c.x - W / 2, c.y - H / 2)); // the centre start: below the intro banner
    let spawns = pick(cands, score, 3, 120);
    if (!spawns.length) { // a hilltop screen: stand on the hill, off its streets and clear of its buildings
      const hf = floors.find((f) => f.kind === 'hill');
      if (hf) for (let y = 48; y <= H - 32; y += 16) for (let x = 32; x <= W - 32; x += 16)
        if ([[0, 0], [24, 0], [-24, 0], [0, 24], [0, -24]].every(([a, b]) => hf.has(x + a, y + b)) && (!sc.hillOk || sc.hillOk(x, y, OUTER + 12)) && !sc.solidsZ.some((s) => inR(s, x, y, R0 + 6))) spawns.push({ x, y, f: 90, level: 1, floor: hf.i });
      spawns = pick(spawns, score, 3, 120);
    }
    // cone homes: on the pavement beside a ground road
    const shows = ACCESS && ACCESS.coneVisible ? (c) => coneShows(sc, c.x, c.y) >= ACCESS.coneVisible : () => true; // Edit 85: never under a highway, a walkway or behind a building
    const homes = sc.sims.some((s) => s.elev0 === 0 && s.level.lanes.length) ? pick(cands.filter((c) => !sc.roadOk(c.x, c.y, OUTER + 40) && shows(c)), (c) => hyp(c.x - W / 2, c.y - H / 2), 2, 240) : [];
    const runs = (sc.runs || []).concat(sc.hillRuns || []), longest = runs.reduce((a, r) => (!a || X.makePath(r.pts).length > X.makePath(a.pts).length ? r : a), null);
    return { id: sc.D.id, name: sc.name, cell: [sc.col, sc.row], statics, floors, stairs, solidsZ: sc.solidsZ.slice(), polys0: sc.polys0, water: sc.waterPolys, spawns, coneHomes: homes.map((c) => [c.x, c.y]),
      patches: [], checkpoints: sc.checkpoints || [], decks: [], deckLanes: [], lanes: [], center: longest ? longest.pts : [], ring: sc.ringDeck ? sc.ringDeck.ring.geoms[0].pts : null,
      deckLines: sc.layers.filter((l) => l.dk).map((l) => ({ hz: l.dk.hz, off: l.dk.off, z: l.dk.z })), theme: 'p6', landmark: sc.D.tiles[sc.name][1] };
  }
  // ---------- P6.1 (Edit 63): every screen edge says whether it can be crossed. Where the dummy can reach an edge but not
  // cross it (a building, the hill or a pool next door; the district's edge), a barrier stands on this side: a low planter
  // between screens; the perimeter wall at the district's edge (Edit 42), a booth and boom where a road leaves, a boom across a
  // highway or hill street that leaves, a parapet along the hill. Where a walkway crosses into the next screen, chevrons say so.
  const horizE = (sd) => sd === 'N' || sd === 'S';
  const edgePt = (sd, v, d) => (sd === 'N' ? [v, d] : sd === 'S' ? [v, H - d] : sd === 'W' ? [d, v] : [W - d, v]);
  const edgeRect = (sd, a0, a1, t) => (sd === 'N' ? { x: a0, y: 0, w: a1 - a0, h: t } : sd === 'S' ? { x: a0, y: H - t, w: a1 - a0, h: t } : sd === 'W' ? { x: 0, y: a0, w: t, h: a1 - a0 } : { x: W - t, y: a0, w: t, h: a1 - a0 });
  function groundFree(sc, x, y, m) { const g = sc.game; m = m == null ? R0 - 2 : m; return !g.statics.some((q) => inR(q, x, y, m)) && g.polys0.every((q) => !PIX.inPoly(q, x, y)) && !g.stairs.some((q) => inR(q, x, y, m)); } // m: the margin (where the dummy can stand: R0 − 2; where it can arrive across an edge: 0, the push-out slides it along)
  // Prototype 6.1: the dummy arriving across an edge at (x, y) on side sd of this screen is pushed out to standing room within a
  // body's radius along the edge or world.edgeArrivalDepth in. Clear of solids alone is not enough: a crevice narrower than the body holds it.
  const INW = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
  function arrives(sc, x, y, sd) {
    if (!groundFree(sc, x, y, 0)) return false;
    const [ix, iy] = INW[sd], tx = iy ? 1 : 0, ty = ix ? 1 : 0;
    for (let d = 0; d <= P['world.edgeArrivalDepth']; d += 4) for (let a = -R0; a <= R0; a += 2) if (groundFree(sc, x + tx * a + ix * d, y + ty * a + iy * d)) return true;
    return false;
  }
  const cpZone = (cp) => { const o = cp.half != null ? cp.half : cp.deck ? HALF : OUTER, l = cp.line; return cp.side === 'W' ? { x: 0, y: cp.off - o, w: l, h: 2 * o } : cp.side === 'E' ? { x: W - l, y: cp.off - o, w: l, h: 2 * o } : cp.side === 'N' ? { x: cp.off - o, y: 0, w: 2 * o, h: l } : { x: cp.off - o, y: H - l, w: 2 * o, h: l }; };
  function runsOf(flags, step) { const out = []; let a = null; flags.forEach((f, i) => { if (f && a == null) a = i * step; if (!f && a != null) { out.push([a, i * step]); a = null; } }); if (a != null) out.push([a, flags.length * step]); return out.map(([p, q]) => (q - p < 12 ? [Math.max(0, (p + q) / 2 - 6), (p + q) / 2 + 6] : [p, q])); }
  function edgePass(Wd) {
    const step = 4, WT = P['world.wallThickness'], WH = EXT(P['proto.art.wallHeight']), d0 = R0 + 1, bd = 32, depth = 8;
    for (const sc of Wd.scs) { sc.checkpoints = []; sc.edgeLog = []; sc.gamePre = sc.game; }
    const pre = (q) => ({ game: q.gamePre, roadOk: q.roadOk }); // every screen judged on its own art, before any barrier goes in
    // Prototype 6.1: planters next door count where the dummy arrives (a planter can close the standing room beside it).
    // Planters only add, so the plan settles in a few passes.
    const plan = new Map(), withPlan = (q) => ({ game: Object.assign({}, q.gamePre, { statics: q.gamePre.statics.concat(plan.get(q) || []) }), roadOk: q.roadOk });
    const plantFlags = (sc, sd) => {
      const g = sc.gamePre, nb = Wd.at(sc.col + SIDE[sd][0], sc.row + SIDE[sd][1]), n = Math.ceil((horizE(sd) ? W : H) / step), out = [];
      if (!nb) return out;
      const there = withPlan(nb), bare = pre(nb), len = horizE(sd) ? W : H;
      for (let i = 0; i < n; i++) {
        const v = i * step + step / 2, [x, y] = edgePt(sd, v, d0), [qx, qy] = edgePt(OPPS[sd], v, d0);
        out.push(groundFree(pre(sc), x, y) && !g.water.some((q) => PIX.inPoly(q, x, y)) && sc.roadOk(x, y, LW) && !arrives(v < 24 || v > len - 24 ? bare : there, qx, qy, OPPS[sd])); // a planter may stand on a shoulder, never in a lane; at a corner, next door's own art
      }
      return out;
    };
    for (let pass = 0; pass < 6; pass++) {
      const next = new Map(); let moved = false;
      for (const sc of Wd.scs) { const rs = []; for (const sd of ['N', 'E', 'S', 'W']) for (const [a0, a1] of runsOf(plantFlags(sc, sd), step)) rs.push(Object.assign(edgeRect(sd, a0, a1, WT), { sd, a0, a1 })); next.set(sc, rs); if (rs.length !== (plan.get(sc) || []).length || rs.some((r, k) => r.a0 !== plan.get(sc)[k].a0 || r.a1 !== plan.get(sc)[k].a1 || r.sd !== plan.get(sc)[k].sd)) moved = true; }
      for (const [k, v] of next) plan.set(k, v);
      if (!moved) break;
    }
    for (const sc of Wd.scs) {
      CAP = sc.solids;
      const g = sc.gamePre, water = (x, y) => g.water.some((q) => PIX.inPoly(q, x, y));
      for (const sd of ['N', 'E', 'S', 'W']) {
        const nb = Wd.at(sc.col + SIDE[sd][0], sc.row + SIDE[sd][1]), len = horizE(sd) ? W : H, n = Math.ceil(len / step);
        const wall = [], road = [], edgeShut = [];
        for (let i = 0; i < n; i++) {
          const v = i * step + step / 2, [x, y] = edgePt(sd, v, d0), here = groundFree(pre(sc), x, y) && !water(x, y), onRoad = !sc.roadOk(x, y, OUTER);
          let shut = !nb; if (nb && !here) { const [qx, qy] = edgePt(OPPS[sd], v, d0); shut = !arrives(withPlan(nb), qx, qy, OPPS[sd]); }
          wall.push(!nb && here && !onRoad); road.push(!nb && here && onRoad); edgeShut.push(shut && !here && !onRoad && !water(x, y) && !(sc.hillLayer && sc.hillLayer.inBand(x, y)));
        }
        for (const { a0, a1 } of plan.get(sc).filter((q) => q.sd === sd)) { // a low planter: concrete, a clipped hedge, an LED seam
          const r = edgeRect(sd, a0, a1, WT), fp = chamf(Math.round(r.x / U), Math.round(r.y / U), Math.round((r.x + r.w) / U) - 1, Math.round((r.y + r.h) / U) - 1, 2);
          CAP = null; mass(sc.B, fp, r.x / U, r.y / U, (r.x + r.w) / U - 1, (r.y + r.h) / U - 1, 0, 3, 'conc', LEDS[1], true); mass(sc.B, (px, py, k) => fp(px, py, (k || 0) + 2), r.x / U, r.y / U, (r.x + r.w) / U - 1, (r.y + r.h) / U - 1, 3, 4, 'hedge', null, false, 'hedge'); CAP = sc.solids;
          captureRect(r.x, r.y, r.w, r.h, 'planter');
          sc.edgeLog.push(sd + ' planter ' + a0 + '–' + a1);
        }
        for (const [a0, a1] of runsOf(edgeShut, step)) { const r = edgeRect(sd, a0, a1, WT); captureRect(r.x, r.y, r.w, r.h, 'bound'); } // Prototype 6.1: an edge that holds holds all along, behind buildings and lawns too (no sliver narrower than the body to wedge in)
        for (const [a0, a1] of runsOf(wall, step)) { // the district's bounds (Edit 42): the perimeter wall
          const r = edgeRect(sd, a0, a1, WT); captureRect(r.x, r.y, r.w, r.h, 'wall');
          sc.props.push({ spr: PIX.wall(Math.round(r.w / U), Math.round(r.h / U), WH), x: r.x / U, y: r.y / U, by: r.y + r.h });
          sc.edgeLog.push(sd + ' wall ' + a0 + '–' + a1);
        }
        for (const [a0, a1] of runsOf(road, step)) { // a road leaves the district: a booth on its shoulder, a boom across it (Edit 42)
          const off = (a0 + a1) / 2, [mx, my] = edgePt(sd, off, d0); if (sc.hillLayer && sc.hillLayer.inBand(mx, my)) { sc.edgeLog.push(sd + ' tunnel ' + Math.round(off)); continue; } // in the tunnel the screen's edge holds (Edit 62)
          const pv = off + LW, b = sd === 'W' ? { x: depth, y: pv, w: bd, h: OUTER - LW } : sd === 'E' ? { x: W - depth - bd, y: pv, w: bd, h: OUTER - LW } : sd === 'N' ? { x: pv, y: depth, w: OUTER - LW, h: bd } : { x: pv, y: H - depth - bd, w: OUTER - LW, h: bd };
          captureRect(b.x, b.y, b.w, b.h, 'booth'); sc.props.push({ spr: PIX.booth(Math.round(b.w / U), Math.round(b.h / U), WH), x: b.x / U, y: b.y / U, by: b.y + b.h });
          sc.checkpoints.push({ side: sd, off, line: depth + bd / 2, half: (a1 - a0) / 2 }); sc.edgeLog.push(sd + ' booth ' + Math.round(off)); // half: the asphalt across the edge (a 45° road is wider)
        }
        // raised floors at this edge: open where next door has a floor at the level; else a boom (highway, hill street) or a parapet (hill)
        sc.gamePre.floors.forEach((f) => {
          if (!f.z) return;
          const open = [], shut = [], street = [];
          for (let i = 0; i < n; i++) {
            const v = i * step + step / 2, [x, y] = edgePt(sd, v, d0); if (!f.has(x, y)) { open.push(false); shut.push(false); street.push(false); continue; }
            let ok = false; if (nb) { const [qx, qy] = edgePt(OPPS[sd], v, d0); ok = nb.gamePre.floors.some((q) => q.z === f.z && q.has(qx, qy)); }
            const hs = f.kind === 'hill' && sc.hillOk && !sc.hillOk(x, y, OUTER);
            open.push(ok); shut.push(!ok && !hs); street.push(!ok && hs);
          }
          if (f.kind === 'deck' && shut.some(Boolean) && !nb && !sc.checkpoints.some((c) => c.deck && c.off === f.layer.dk.off && c.side === sd)) { sc.checkpoints.push({ side: sd, off: f.layer.dk.off, line: depth + bd / 2, deck: true, z: f.z }); sc.edgeLog.push(sd + ' deck boom ' + f.layer.dk.off); return; }
          for (const [a0, a1] of runsOf(street, step)) { sc.checkpoints.push({ side: sd, off: (a0 + a1) / 2, line: depth + bd / 2, z: f.z, hill: true, half: (a1 - a0) / 2 }); sc.edgeLog.push(sd + ' hill boom ' + Math.round((a0 + a1) / 2)); }
          if (f.kind === 'hill') for (const [a0, a1] of runsOf(shut, step)) { // a parapet along the hill's edge: concrete, an LED line
            const r = edgeRect(sd, a0, a1, WT); sc.solidsZ.push(Object.assign({ z: 1 }, r));
            const HB = f.layer.L; for (let yy = Math.floor(r.y / U); yy < Math.ceil((r.y + r.h) / U); yy++) for (let xx = Math.floor(r.x / U); xx < Math.ceil((r.x + r.w) / U); xx++) { const e = xx === Math.floor(r.x / U) || yy === Math.floor(r.y / U) || xx === Math.ceil((r.x + r.w) / U) - 1 || yy === Math.ceil((r.y + r.h) / U) - 1; HB.put(xx, yy, e ? CON.l : (xx + yy) % 4 < 2 ? N.cyan : CON.m); }
            sc.edgeLog.push(sd + ' hill parapet ' + a0 + '–' + a1);
          }
          if (f.kind === 'walk') { // chevrons where a walkway runs on into the next screen
            for (const [a0, a1] of runsOf(open, step)) { const L = f.layer.L, c = (a0 + a1) / 2, dir = SIDE[sd];
              for (const k of [0, 1]) { const [cx, cy] = edgePt(sd, c, 18 + k * 10 + (sd === 'N' ? 1 : sd === 'S' ? -1 : 0) * f.layer.lift * U); /* P6.4: at the edge as drawn */ for (let t = -4; t <= 4; t++) { const ax = Math.round(cx / U) + (dir[0] ? -Math.abs(t) * dir[0] * 0.5 : t), ay = Math.round(cy / U) + (dir[1] ? -Math.abs(t) * dir[1] * 0.5 : t); L.put(Math.round(ax), Math.round(ay), k ? N.cyan : K.white); } }
              sc.edgeLog.push(sd + ' walkway on ' + Math.round(c)); }
            if (shut.some(Boolean)) sc.edgeLog.push(sd + ' walkway shut (check)');
          }
        });
      }
      CAP = null;
    }
    for (const sc of Wd.scs) sc.game = gameData(sc);
  }
  // ---------- P6 (Edit 53 in play): one traffic for the district. Every screen's sims link at the seams by level: a lane
  // leaving by a shared edge continues on the lane that enters next door at the same point and elevation (Z0 streets, the
  // Z1 hill streets, the Z1 ring and the highways). Cars within seam sight are seen next door; drivers follow them, the
  // dummy meets them, both screens draw them. Cars enter only where a road or highway crosses the district boundary.
  // A shift of run.appearances.road cars enters by the Z0 roads; highways and the hill streets run off the shift's clock.
  const SIDE = X.SIDE, OPPS = { N: 'S', S: 'N', E: 'W', W: 'E' }, GL = X.seamSight(P);
  const hashId = (id) => { let h = 2166136261; for (let i = 0; i < id.length; i++) h = Math.imul(h ^ id.charCodeAt(i), 16777619); return h >>> 0; };
  const NOOP = () => {};
  function quiet(s) { // a traffic sim: drivers and cars only; the dummy it sees is the world's (or its proxy next door)
    Object.assign(s, { checkTerminal: NOOP, checkFlip: NOOP });
    s.meets = (c) => { const b = s.body; return !!b && b.alive && !b.stair && b.mode !== 'drop' && b.mode !== 'rescue' && b.level === s.elev0 + (c.layer || 0); };
    if (s.elev0 === 0) s.dispatchDrone = X.Sim.prototype.dispatchDrone; else s.dispatchDrone = NOOP;
  }
  function linkWorld(Wd) {
    const scs = Wd.scs, recs = [], at = (c, r) => scs.find((q) => q.col === c && q.row === r);
    for (const sc of scs) for (const s of sc.sims) {
      s.sc = sc; s.netLane = new Map(); quiet(s);
      const nc = s.newCar.bind(s);
      s.newCar = (id, ...a) => { const c = nc(sc.D.id + '·' + sc.name + '·' + id, ...a); c.sim = s; return c; }; // ids unique across the district
      for (const c of s.cars) { c.id = sc.D.id + '·' + sc.name + '·' + c.id; c.sim = s; }
      const add = (r) => { Object.assign(r, { sc, s, ends: X.laneEnds(r.path, W, H), next: [], prev: [] }); s.netLane.set(r.path, r); recs.push(r); };
      s.level.lanes.forEach((path, k) => add({ i: k, path, simLayer: 0, elev: s.elev0, deck: null }));
      (s.level.deckLanes || []).forEach((ln, j) => { const z = (s.level.decks[ln.deck] && s.level.decks[ln.deck].z) || 1; add({ i: 2 + j, path: ln.path, simLayer: z, elev: s.elev0 + z, deck: ln.deck }); });
    }
    for (const a of recs) {
      const o = a.ends.out, nb = o && at(a.sc.col + SIDE[o.side][0], a.sc.row + SIDE[o.side][1]);
      if (!nb) continue;
      for (const b of recs) if (b.sc === nb && b.elev === a.elev && b.ends.in && b.ends.in.side === OPPS[o.side] && Math.abs(b.ends.in.off - o.off) < 6 && b.ends.in.tx * o.tx + b.ends.in.ty * o.ty > 0.9) { a.next.push(b); b.prev.push(a); }
      if (a.next.length) a.path.netOut = { s: o.s, path: a.next[0].path, ds: a.next[0].ends.in.s - o.s }; // corner speed reads the next screen's bends
    }
    const outside = (sc, e) => !at(sc.col + SIDE[e.side][0], sc.row + SIDE[e.side][1]);
    for (const r of recs) r.toExit = !r.next.length ? 0 : Infinity; // seams to the nearest way out (traffic.exitAfterSeams)
    for (let changed = true; changed;) { changed = false; for (const r of recs) for (const q of r.next) if (q.toExit + 1 < r.toExit) { r.toExit = q.toExit + 1; changed = true; } }
    // P6.1 (Edit 63): managed traffic. No sim admits on its own schedule: manage() spawns off-screen to a density target.
    const cruise = P['vehicles.sedan.cruiseSpeed'], dki = P['world.district.' + Wd.D.id + '.deckInterval'];
    const SG = 2 * P['world.district.' + Wd.D.id + '.interval'] * cruise; // street spacing: one car per lane per 2 × interval at cruise
    const SD = (dki || P['world.deckInterval'] * P['traffic.deckGapScale']) * cruise * P['traffic.deckSpeedScale']; // highway spacing (Edit 54 feed)
    for (const sc of scs) {
      sc.flow = new Map();
      for (const s of sc.sims) {
        Object.assign(s, { admit: NOOP, admitDeck: NOOP });
        if (dki) s.P = Object.assign({}, s.P, { 'world.deckInterval': dki / s.P['traffic.deckGapScale'] });
        s.P = Object.assign({}, s.P, P6SIM, TRAFFIC || {}); // Edit 71. Edit 99: the player sim's driver values
        for (const r of recs.filter((q) => q.s === s && q.ends.in)) { // one group per physical inlet: a junction's routes share their approach
          const cls = r.deck != null ? 'deck' + r.elev : s.elev0 && s.lab && s === sc.ringSim ? 'ring' : 'street' + r.elev, key = cls + ':' + r.ends.in.side + Math.round(r.ends.in.off);
          if (!sc.flow.has(cls)) sc.flow.set(cls, { cls, S: cls.startsWith('street') ? SG : SD, groups: new Map(), target: 0, n: 0, rr: 0 });
          const F = sc.flow.get(cls);
          if (!F.groups.has(key)) F.groups.set(key, { key, recs: [], len: 0, boundary: outside(sc, r.ends.in), busOK: true });
          const g = F.groups.get(key); g.recs.push(r); r.group = g; r.cls = cls;
          g.len = Math.max(g.len, (r.ends.out ? r.ends.out.s : r.path.length) - r.ends.in.s);
        }
      }
      for (const F of sc.flow.values()) { F.target = [...F.groups.values()].reduce((a, g) => a + g.len, 0) / F.S; F.list = [...F.groups.values()]; }
    }
    for (const r of recs) if (r.group && r.deck == null) { // a bus enters only where every lane it can reach keeps vehicles.bus.minRadius
      const seen = new Set(), todo = [r];
      while (todo.length) { const q = todo.pop(); if (seen.has(q)) continue; seen.add(q); todo.push(...q.next.filter((z) => z.deck == null)); }
      if (![...seen].every((q) => !q.s.lab && X.minBend(q.path.pts, W, H) >= RB * 0.9)) r.group.busOK = false;
    }
    Wd.recs = recs; Wd.sims = [].concat(...scs.map((sc) => sc.sims));
  }
  function recOf(s, c) { // a lap variant on a ring shares its route's ends and links
    const m = s.netLane; if (!m) return null;
    let r = m.get(c.path);
    if (!r && c.path.ring && c.path.ring.variants) { const base = m.get(c.path.ring.variants[0]); if (base) { r = Object.assign({}, base, { path: c.path, ends: X.laneEnds(c.path, W, H) }); m.set(c.path, r); } }
    return r || null;
  }
  const routeOf = (r, c) => { // a car's route next door, chosen afresh at every seam; after traffic.exitAfterSeams, the way out
    if (r.next.length === 1) return r.next[0];
    const h = hashId(c.id + r.sc.name + (c.hops || 0)), ns = (c.hops || 0) >= P['traffic.exitAfterSeams'] ? r.next.filter((q) => q.toExit === Math.min(...r.next.map((z) => z.toExit))) : r.next;
    return ns[h % ns.length];
  };
  function ghostOf(o, r, s) {
    const g = Object.create(o), p = X.pathAt(r.path, s);
    Object.assign(g, { ghost: true, real: o, lane: r.i, path: r.path, s, layer: r.simLayer, deck: r.simLayer > 0, x: p.x + p.nx * o.d, y: p.y + p.ny * o.d, h: o.h, vx: o.vx, vy: o.vy });
    if (r.deck != null) g.deckIdx = r.deck;
    return g;
  }
  function seamGhosts(Wd, scOnly) { // cars near a seam, on the lanes next door that lead to or from theirs
    const add = new Map();
    for (const s of Wd.sims) for (const o of s.cars) {
      if (o.ghost) continue;
      const r = recOf(s, o); if (!r) continue;
      if (r.prev.length && o.s - r.ends.in.s < GL) for (const a of r.prev) if (!scOnly || a.sc === scOnly) { if (!add.has(a.s)) add.set(a.s, []); add.get(a.s).push(ghostOf(o, a, a.ends.out.s + (o.s - r.ends.in.s))); }
      if (r.next.length && r.ends.out.s - o.s < GL) { const b = routeOf(r, o), sb = b.ends.in.s - (r.ends.out.s - o.s); if (sb > 0 && (!scOnly || b.sc === scOnly)) { if (!add.has(b.s)) add.set(b.s, []); add.get(b.s).push(ghostOf(o, b, sb)); } }
    }
    return add;
  }
  // One tick of a traffic sim: admissions at the district edge, drivers, cars in substeps, its drones.
  function trafficTick(s, dt, t) {
    const N = Math.max(1, Math.round(P['proto.substeps'])), h = dt / N;
    s.tick++; s.t = t;
    s.admit(); s.admitDeck();
    s.carAI(dt);
    for (let k = 0; k < N; k++) s.moveCars(h, t - dt + (k + 1) * h);
    s.stepDrones(dt);
  }
  // Prototype 6.1: a ring entry's give-way line can stand just inside a screen. A car nearing that seam reads the line from
  // next door: it slows to traffic.giveWaySpeed and holds for the ring's traffic as if already on the far screen.
  // It starts a full stopping distance out (at traffic.comfortBraking) plus traffic.giveWayLookahead, at least traffic.giveWayWindow.
  function seamGiveWay(Wd) {
    for (const s of Wd.sims) for (const c of s.cars) {
      c.seamGW = null;
      if (c.ghost) continue;
      const r = recOf(s, c); if (!r || !r.next.length) continue;
      const reach = Math.max(s.P['traffic.giveWayWindow'], c.v * c.v / (2 * s.P['traffic.comfortBraking']) + s.P['traffic.giveWayLookahead']), toEnd = r.ends.out.s - c.s; if (toEnd < 0 || toEnd > reach) continue;
      const b = routeOf(r, c), g = b.path.giveWay; if (!g) continue;
      const sb = b.ends.in.s - toEnd, toLine = g.s - (sb + c.L / 2);
      if (toLine < -4 || toLine > reach) continue;
      const pr = Object.create(c), p = X.pathAt(b.path, sb);
      Object.assign(pr, { path: b.path, s: sb, lane: b.i, layer: b.simLayer, orbit: null, x: p.x + p.nx * c.d, y: p.y + p.ny * c.d });
      c.seamGW = { toLine, hold: !!b.s.giveWayHold(pr) };
    }
  }
  function stepWorld(Wd, body, act) {
    const dt = 1 / P['simulation.tickRate'];
    Wd.t += dt;
    seamGiveWay(Wd);
    for (const sc of Wd.scs) { // the dummy as each screen's drivers see it: itself here, across a shared edge next door, else away
      let pb = AWAY;
      if (body && body.alive && act) {
        const dc = sc.col - act.col, dr = sc.row - act.row;
        if (!dc && !dr) pb = body;
        else if (Math.abs(dc) + Math.abs(dr) === 1) { pb = Object.create(body); pb.x = body.x - dc * W; pb.y = body.y - dr * H; }
      }
      for (const s of sc.sims) s.body = pb;
    }
    const add = seamGhosts(Wd);
    for (const [s, gs] of add) s.cars = s.cars.concat(gs);
    for (const s of Wd.sims) trafficTick(s, dt, Wd.t);
    for (const s of Wd.sims) { s.cars = s.cars.filter((c) => !c.ghost); if (s.events.length) { if (act && s.sc === act) Wd.events.push(...s.events); s.events.length = 0; } }
    const moved = [];
    for (const s of Wd.sims) s.cars = s.cars.filter((c) => {
      const r = recOf(s, c);
      if (r && r.next.length && c.s >= r.ends.out.s) { moved.push([c, r]); return false; }
      if (c.s - c.L / 2 <= c.path.length) return true;
      if (c.shift) Wd.exited++; // left the district
      return false;
    });
    for (const [c, r] of moved) {
      const nx = routeOf(r, c), ds = nx.ends.in.s - r.ends.out.s, dx = (nx.sc.col - r.sc.col) * W, dy = (nx.sc.row - r.sc.row) * H; // a junction: the car picks its route at the seam
      Object.assign(c, { s: c.s + ds, path: nx.path, lane: nx.i, layer: nx.simLayer, deck: nx.simLayer > 0, orbit: null, letOut: null, yielding: false, ringInnerDone: false, hops: (c.hops || 0) + 1, sim: nx.s });
      if (nx.deck != null) c.deckIdx = nx.deck;
      for (const m of [c.man, c.intent]) if (m) for (const k of ['s0', 'sTarget', 'sStop']) if (m[k] != null) m[k] += ds;
      if (c.dodge && c.dodge.s != null) c.dodge = Object.assign({}, c.dodge, { s: c.dodge.s + ds });
      if (c.holdX != null) { c.holdX -= dx; c.holdY -= dy; }
      const p = X.pathAt(c.path, c.s); c.x = p.x + p.nx * c.d; c.y = p.y + p.ny * c.d;
      nx.s.cars.push(c); Wd.crossings++; if (nx.group) nx.group.lastIn = Wd.t; // an arrival from upstream: this inlet's flow
    }
    for (const s of Wd.sims) for (const c of s.cars) { c.elev = s.elev0 + (c.layer || 0); c.sim = s; }
    if (++Wd.tick % 15 === 0) manage(Wd, act); // P6.1: four times a second
    if (Wd.events.length > 400) Wd.events.splice(0, Wd.events.length - 400);
  }
  // P6.1 (Edit 63): traffic managed as GTA does it, but never in view. Off-screen, each screen's streets, highways and ring
  // are filled to one car per spacing of lane (2 × world.district.<id>.interval at cruise; highways at their feed); a car
  // spawns at an inlet with room, never one fed from the screen in view. Off-screen, a car stopped traffic.offscreenCullSeconds
  // is removed (no jam survives out of sight); once the shift's cars have all appeared, its unseen cars go. In view, nothing
  // appears or vanishes: cars on screen persist, and a car followed to the next screen keeps its speed (O3.72).
  function seen(act, sc, c, m) { // is this car on the screen in view, or reaching onto it?
    if (!act) return false;
    const dc = sc.col - act.col, dr = sc.row - act.row; if (Math.abs(dc) > 1 || Math.abs(dr) > 1) return false;
    const x = c.x + dc * W, y = c.y + dr * H; m = m == null ? (c.L || 0) + 24 : m;
    return x > -m && x < W + m && y > -m && y < H + m;
  }
  function groupCars(g) { const out = []; const ss = new Set(g.recs.map((r) => r.s)); for (const s of ss) for (const c of s.cars) { const r = recOf(s, c); if (r && r.group === g) out.push(c); } return out; }
  const sameRec = (a, b) => a === b || (!!a && !!b && a.s === b.s && a.i === b.i); // a ring's lap variant is its route's rec
  function roomAt(Wd, g, r, s0, ahead, behind) { // clear ahead along the inlet's lanes, and no car coming up behind across the seam
    for (const c of groupCars(g)) if (c.s + c.L / 2 > s0 - 40 && c.s - c.L / 2 < s0 + ahead) return false;
    for (const q0 of g.recs) for (const q of q0.prev) for (const c of q.s.cars) { if (!sameRec(recOf(q.s, c), q)) continue; if (q.ends.out.s - c.s < behind + c.L) return false; } // Edit 71: a lap variant counts as its route
    return true;
  }
  function queued(g) { // a queue on the inlet's lanes, or on the lanes they feed next door: add nothing (no car into a jam)
    for (const c of groupCars(g)) if ((c.stopT || 0) > 0.5) return true;
    for (const r of g.recs) for (const q of r.next) for (const c of q.s.cars) if (sameRec(recOf(q.s, c), q) && (c.stopT || 0) > 0.5) return true;
    return false;
  }
  function spawn(Wd, r, s0) {
    const s = r.s, n = ++Wd.spawnSeq, u = (n * 0.6180339887 + 0.53) % 1;
    let c;
    if (r.deck != null) c = s.addDeckCar(r.i - 2, s0, s.deckCls(n));
    else { let cls = X.fleetClass(P, 0.25, u); if (cls === 'bus' && !r.group.busOK) cls = 'sedan'; c = s.newCar('car' + n, cls, r.i, r.path, s0, 0); s.cars.push(c); }
    c.v = Math.min(c.v, s.cornerSpeed(c)); s.pose(c);
    c.elev = s.elev0 + (c.layer || 0); c.sim = s; c.slot = n;
    if (!c.elev && r.deck == null) c.shift = true;
    return c;
  }
  function manage(Wd, act) {
    const exhausted = Wd.live && Wd.admitted >= Wd.budget, cull = P['traffic.offscreenCullSeconds'], Lb = P['vehicles.bus.length'], cruise = P['vehicles.sedan.cruiseSpeed'];
    for (const sc of Wd.scs) for (const F of sc.flow.values()) {
      let n = 0; for (const s of sc.sims) for (const c of s.cars) { const r = recOf(s, c); if (r && r.cls === F.cls) n++; }
      F.n = n;
      const kd = Wd.densityOf ? Wd.densityOf(sc) : 1, S = F.S / kd, target = F.target * kd; // Edit 85: Story scales a tile's density (1: the district's)
      if (n >= target + 1 || (exhausted && F.cls === 'street0')) continue; // a cap; the shift's streets stop filling once it is spent
      const cands = F.list.filter((g) => sc !== act || g.boundary);
      const hw = S / (cruise * (F.cls.startsWith('street') ? 1 : P['traffic.deckSpeedScale'])); // the target headway at an inlet
      for (let k = 0; k < cands.length; k++) { // an inlet from beyond the district meters at the headway; any other fills only a missing car (1.5 headways)
        const g = cands[(F.rr + k) % cands.length], r = g.recs[(Wd.spawnSeq + k) % g.recs.length], jit = 0.85 + 0.3 * ((Wd.spawnSeq * 0.6180339887) % 1);
        if (Wd.t - (g.lastIn != null ? g.lastIn : -1e9) < hw * (g.boundary ? jit : 1.5)) continue;
        const s0 = g.boundary ? Lb / 2 + 2 : r.ends.in.s + 2, ahead = Math.max(Lb * (1 + P['traffic.entryRoomLengths']) + P['traffic.minimumGap'], S * 0.5);
        if (sc === act && seen(act, sc, X.pathAt(r.path, s0), 40)) continue; // the screen in view: only from beyond the district edge, out of sight
        if (!roomAt(Wd, g, r, s0, ahead, S * 0.5) || queued(g)) continue;
        spawn(Wd, r, s0); g.lastIn = Wd.t; if (++n >= target + 1) break;
      }
      F.rr = (F.rr + 1) % Math.max(1, cands.length);
    }
    for (const s of Wd.sims) { // off-screen: no jam survives out of sight; a finished shift's unseen cars go
      if (!s.cars.length) continue;
      s.cars = s.cars.filter((c) => { if (seen(act, s.sc, c)) return true; if ((c.stopT || 0) > cull) { Wd.culled++; return false; } if (exhausted && c.shift) return false; return true; });
    }
  }
  function goLive(Wd) { // the shift starts: it counts Z0 cars as they appear on the screen in view (P6.1)
    Wd.live = true; Wd.admitted = 0; Wd.events.length = 0;
    for (const s of Wd.sims) for (const c of s.cars) if (!(c.elev || 0) && c.deck !== true) c.shift = true;
  }
  // The district: nine screens, linked, warmed for traffic.warmSeconds so no screen waits for cars.
  // Prototype 6.1 (Edit 69): ground the dummy cannot reach from the start (an alley closed by buildings, a strip between hedges)
  // is planted solid: a low planter with a clipped hedge. Reach: open ground (the body clear of solids, stairs, the hill, water,
  // ground booms), joined across screen edges, by flights to their floors, and between floors that meet at a level.
  // Prototype 6.2 (Edit 70): no dead space. Open ground the body can never touch (a gap narrower than the body between two
  // solids, a sliver by a kerb or a pool) reads as walkable and is not: it is planted, a low planter with a hedge top. The
  // test is the game's own: the centre stands clear of solids by body.radius − 2; the body covers body.radius round it.
  function fillDead(Wd) {
    const S4 = 4, nx = W / S4, ny = H / S4, m = R0 - 2, e = Math.ceil(R0 / S4);
    for (const sc of Wd.scs) {
      const g = sc.game, solid = new Uint8Array(nx * ny), near = new Uint8Array(nx * ny);
      const mark = (A, r, mg) => { for (let j = Math.max(0, Math.floor((r.y - mg) / S4)); j <= Math.min(ny - 1, Math.floor((r.y + r.h + mg) / S4)); j++) for (let i = Math.max(0, Math.floor((r.x - mg) / S4)); i <= Math.min(nx - 1, Math.floor((r.x + r.w + mg) / S4)); i++) { const x = (i + 0.5) * S4, y = (j + 0.5) * S4; if (inR(r, x, y, mg)) A[j * nx + i] = 1; } };
      for (const q of g.statics.concat(g.stairs)) { mark(solid, q, 0); mark(near, q, m); }
      for (const cp of (g.checkpoints || []).filter((c) => !c.deck && !c.z)) mark(near, cpZone(cp), R0 - 1);
      const st = new Uint8Array(nx * ny), open = new Uint8Array(nx * ny), cov = new Uint8Array(nx * ny);
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const k = j * nx + i, x = (i + 0.5) * S4, y = (j + 0.5) * S4, wet = g.polys0.some((p) => PIX.inPoly(p, x, y)) || g.water.some((p) => PIX.inPoly(p, x, y));
        open[k] = !solid[k] && !wet ? 1 : 0;
        st[k] = !near[k] && !wet && x >= R0 && y >= R0 && x <= W - R0 && y <= H - R0 ? 1 : 0;
      }
      const r = Math.ceil(R0 / S4);
      for (let k = 0; k < st.length; k++) if (st[k]) { const i = k % nx, j = (k - i) / nx; for (let b = -r; b <= r; b++) for (let a = -r; a <= r; a++) { if ((a * a + b * b) * S4 * S4 > R0 * R0) continue; const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < ny) cov[jj * nx + ii] = 1; } }
      const U4 = new Uint8Array(nx * ny); for (let j = e; j < ny - e; j++) for (let i = e; i < nx - e; i++) { const k = j * nx + i; U4[k] = open[k] && !cov[k] ? 1 : 0; }
      const id = new Int32Array(nx * ny).fill(-1), M = new Uint8Array(AW * AH); let n = 0, x0 = AW, y0 = AH, x1 = 0, y1 = 0, planted = 0;
      for (let k = 0; k < U4.length; k++) {
        if (!U4[k] || id[k] >= 0) continue;
        const q = [k], cells = []; let inner = 0; id[k] = k;
        while (q.length) { const v = q.pop(), i = v % nx, j = (v - i) / nx; cells.push(v); let all = true; for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= ny || !U4[jj * nx + ii]) { all = false; continue; } const w = jj * nx + ii; if (id[w] < 0) { id[w] = k; q.push(w); } } if (all) inner++; }
        if (cells.length < 25 || inner < 6) continue; // a hairline along a wall is not a gap
        planted++;
        for (const v of cells) { const i = v % nx, j = (v - i) / nx; for (let yy = j * 2; yy < j * 2 + 2; yy++) for (let xx = i * 2; xx < i * 2 + 2; xx++) { M[yy * AW + xx] = 1; x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy); } }
      }
      if (!planted) continue;
      const fp = (x, y, ins) => { ins = Math.round(ins || 0); for (let j = -ins; j <= ins; j++) for (let i = -ins; i <= ins; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= AW || yy >= AH || !M[yy * AW + xx]) return false; } return true; };
      CAP = sc.solids; mass(sc.B, fp, x0, y0, x1, y1, 0, 2, 'conc', LEDS[1], true); mass(sc.B, (x, y, i) => fp(x, y, (i || 0) + 1), x0, y0, x1, y1, 2, 3, 'hedge', null, false, 'hedge'); CAP = null;
      sc.deadPlanted = planted; sc.game = gameData(sc);
    }
  }
  function fillPockets(Wd) {
    const ST = 8, nx = W / ST, ny = H / ST, key = (sc, k) => sc.name + ':' + k, adj = new Map(), comps = new Map();
    const link = (a, b) => { if (a == null || b == null || a === b) return; (adj.get(a) || adj.set(a, new Set()).get(a)).add(b); (adj.get(b) || adj.set(b, new Set()).get(b)).add(a); };
    const stand = (sc, x, y) => { const g = sc.game; return x >= R0 && y >= R0 && x <= W - R0 && y <= H - R0 && !g.statics.some((q) => inR(q, x, y, R0 - 2)) && !g.stairs.some((q) => inR(q, x, y, R0 - 2)) && g.polys0.every((p) => !PIX.inPoly(p, x, y)) && g.water.every((p) => !PIX.inPoly(p, x, y)) && !(g.checkpoints || []).some((cp) => !cp.deck && !cp.z && inR(cpZone(cp), x, y, R0 - 1)); };
    for (const sc of Wd.scs) {
      const id = new Int32Array(nx * ny).fill(-1); let n = 0;
      for (let k = 0; k < nx * ny; k++) { const i = k % nx, j = (k - i) / nx; if (id[k] !== -1 || !stand(sc, (i + 0.5) * ST, (j + 0.5) * ST)) continue; const q = [k]; id[k] = n;
        while (q.length) { const v = q.pop(), a = v % nx, b = (v - a) / nx; for (const [da, db] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const aa = a + da, bb = b + db; if (aa < 0 || bb < 0 || aa >= nx || bb >= ny) continue; const w = bb * nx + aa; if (id[w] === -1 && stand(sc, (aa + 0.5) * ST, (bb + 0.5) * ST)) { id[w] = n; q.push(w); } } } n++; }
      comps.set(sc, { id, n });
    }
    const gAt = (sc, x, y) => { const c = comps.get(sc), i0 = Math.floor(x / ST), j0 = Math.floor(y / ST); for (let r = 0; r <= 2; r++) for (let j = j0 - r; j <= j0 + r; j++) for (let i = i0 - r; i <= i0 + r; i++) if (i >= 0 && j >= 0 && i < nx && j < ny && c.id[j * nx + i] >= 0) return key(sc, 'g' + c.id[j * nx + i]); return null; };
    const fAt = (sc, z, x, y) => { const i = sc.game.floors.findIndex((f) => f.z === z && f.has(x, y)); return i >= 0 ? key(sc, 'f' + i) : null; };
    for (const sc of Wd.scs) {
      const g = sc.game;
      for (const sd of ['N', 'E', 'S', 'W']) { const nb = Wd.at(sc.col + SIDE[sd][0], sc.row + SIDE[sd][1]); if (!nb) continue;
        for (let v = 8; v < (horizE(sd) ? W : H) - 8; v += 2) { const [x, y] = edgePt(sd, v, R0 + 6), [qx, qy] = edgePt(OPPS[sd], v, R0 + 6); if (stand(sc, x, y) && stand(nb, qx, qy)) link(gAt(sc, x, y), gAt(nb, qx, qy));
          const [ax, ay] = edgePt(sd, v, R0 + 1), [bx, by] = edgePt(OPPS[sd], v, R0 + 1); if (groundFree(sc, ax, ay) && arrives(nb, bx, by, OPPS[sd])) link(gAt(sc, ax, ay), gAt(nb, bx, by)); // as the dummy crosses: the push-out slides it in
          for (const z of [1, 2]) { const [ex, ey] = edgePt(sd, v, 3), [fx, fy] = edgePt(OPPS[sd], v, 3); link(fAt(sc, z, ex, ey), fAt(nb, z, fx, fy)); } } }
      for (const st of g.stairs) { const dir = Math.sign(st.high - st.low), lat = st.axis === 'y' ? st.x + st.w / 2 : st.y + st.h / 2, a = st.low - dir * (R0 + 8); link(st.axis === 'y' ? gAt(sc, lat, a) : gAt(sc, a, lat), key(sc, 'f' + st.head)); }
      for (let y = 2; y < H; y += 4) for (let x = 2; x < W; x += 4) g.floors.forEach((f, i) => { if (!f.z || !f.has(x, y)) return; g.floors.forEach((h, j) => { if (j > i && h.z === f.z && [[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].some(([a, b]) => h.has(x + a, y + b))) link(key(sc, 'f' + i), key(sc, 'f' + j)); }); });
    }
    const s0 = Wd.at(1, 1), sp = s0.game.spawns[0], start = sp.level ? fAt(s0, sp.level, sp.x, sp.y) : gAt(s0, sp.x, sp.y), seen = new Set([start]), q = [start];
    while (q.length) { const a = q.pop(); for (const b of adj.get(a) || []) if (!seen.has(b)) { seen.add(b); q.push(b); } }
    for (const sc of Wd.scs) {
      const c = comps.get(sc), lost = new Set(); for (let i = 0; i < c.n; i++) if (!seen.has(key(sc, 'g' + i))) lost.add(i);
      if (!lost.size) continue;
      const M = new Uint8Array(AW * AH), e = ST / 2 + R0 - 3; let x0 = AW, y0 = AH, x1 = 0, y1 = 0;
      for (let k = 0; k < nx * ny; k++) { if (!lost.has(c.id[k])) continue; const i = k % nx, j = (k - i) / nx, cx = (i + 0.5) * ST, cy = (j + 0.5) * ST;
        for (let yy = Math.max(0, Math.floor((cy - e) / U)); yy <= Math.min(AH - 1, Math.floor((cy + e) / U)); yy++) for (let xx = Math.max(0, Math.floor((cx - e) / U)); xx <= Math.min(AW - 1, Math.floor((cx + e) / U)); xx++) { M[yy * AW + xx] = 1; x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy); } }
      const fp = (x, y, ins) => { ins = Math.round(ins || 0); for (let j = -ins; j <= ins; j++) for (let i = -ins; i <= ins; i++) { const xx = x + i, yy = y + j; if (xx < 0 || yy < 0 || xx >= AW || yy >= AH || !M[yy * AW + xx]) return false; } return true; };
      CAP = sc.solids; mass(sc.B, fp, x0, y0, x1, y1, 0, 2, 'conc', LEDS[1], true); mass(sc.B, (x, y, i) => fp(x, y, (i || 0) + 1), x0, y0, x1, y1, 2, 3, 'hedge', null, false, 'hedge'); CAP = null;
      sc.pockets = lost.size; sc.game = gameData(sc);
    }
  }
  function buildWorld(id, opts) {
    PAVN = 0; PAVB = 0;
    opts = opts || {};
    ACCESS = opts.access || null; // Edit 85
    TRAFFIC = opts.traffic || null; // Edit 99
    const D = DISTRICTS.find((d) => d.id === id);
    if (!D) throw new Error('no P6 district ' + id);
    const scs = [];
    for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) scs.push(buildScreen(D, c, r));
    edgePass({ scs, at: (c, r) => (c >= 0 && c < 3 && r >= 0 && r < 3 ? scs[r * 3 + c] : null) }); // P6.1: barriers and booms where an edge cannot be crossed
    fillPockets({ scs, at: (c, r) => (c >= 0 && c < 3 && r >= 0 && r < 3 ? scs[r * 3 + c] : null) }); // Prototype 6.1: no ground the dummy cannot reach
    fillDead({ scs }); // 6.2 (Edit 70): no gap that looks walkable and is not
    const Wd = { id, D, scs, at: (c, r) => (c >= 0 && c < 3 && r >= 0 && r < 3 ? scs[r * 3 + c] : null), t: 0, live: false, budget: opts.budget != null ? opts.budget : P['run.appearances.road'], admitted: 0, exited: 0, crossings: 0, events: [], tick: 0, spawnSeq: 0, culled: 0 }; // admitted (P6.1): shift cars that have appeared on the screen in view
    linkWorld(Wd);
    if (opts.density) Wd.densityOf = opts.density; // Edit 85 (P7.4): Story's traffic, tile by tile (story.traffic.<district>.<tile>)
    for (const sc of scs) { // cones live on their screen; ground drivers and the dummy share them
      sc.cones.length = 0;
      sc.game.coneHomes.forEach(([x, y], i) => sc.cones.push({ id: 'cone' + sc.name + '-' + (i + 1), x, y, hx: x, hy: y, vx: 0, vy: 0, state: 'free', flightT: 0, flightDur: 1 }));
      for (const s of sc.sims) if (s.elev0 === 0) { s.cones = sc.cones; s.level.coneHomes = sc.game.coneHomes; }
    }
    const warm = opts.warm != null ? opts.warm : P['traffic.warmSeconds'];
    for (let k = 0; k < Math.round(warm * P['simulation.tickRate']); k++) stepWorld(Wd, null, null);
    for (const s of Wd.sims) for (const c of s.cars) { c.elev = s.elev0 + (c.layer || 0); c.sim = s; }
    goLive(Wd);
    return Wd;
  }
  // The active screen's cars as the dummy and the renderer see them: its own, and the cars next door reaching onto it.
  function viewCars(Wd, sc) {
    const out = [];
    for (const s of sc.sims) for (const c of s.cars) out.push(c);
    for (const gs of seamGhosts(Wd, sc).values()) for (const g of gs) { const r = (g.L + g.W) / 2 + 8; if (g.x > -r && g.x < W + r && g.y > -r && g.y < H + r) out.push(g); }
    return out;
  }
  // ---------- drawing a screen (P6). The ground buffer; then one depth-sorted pass of props, ground actors and layers.
  // A layer (deck, ring, walkway, hill) draws its own surface, props and actors on the footprint, then lifts as one.
  const carKey = (c) => c.y + Math.abs(Math.sin(c.h)) * c.L / 2 + Math.abs(Math.cos(c.h)) * c.W / 2;
  const carSpr = (c) => PIX.car(c.cls, Math.round(c.L / U), Math.round(c.W / U), EXT(P['vehicles.' + c.cls + '.height']), c.h, false);
  // hk: { cars, layerOf(c), car(c, buf, lift), items: [[key, fn]], bodyOn: layer, bodyKey, body(buf, lift), under(), layerUnder(l, buf, cars, me), layerDone(l, cars, me) }
  let EXTEND = false; // Edit 99 (P8.4): set by a build that extends lifted layers past the bottom edge (render.layerEdgeFix)
  const rowLit = (L, y) => { if (!EXTEND) return false; for (let x = 0; x < AW; x++) if (L.d[y * AW + x]) return true; return false; };
  function compose(sc, FB, DL, hk) {
    hk = hk || {};
    if (hk.extendLayers != null) EXTEND = !!hk.extendLayers;
    FB.d.set(sc.B.d);
    if (hk.under) hk.under();
    const items = [], onL = new Map();
    for (const c of hk.cars || []) {
      const l = hk.layerOf ? hk.layerOf(c) : null;
      if (l) { if (!onL.has(l)) onL.set(l, []); onL.get(l).push(c); } else items.push([carKey(c), () => (hk.car ? hk.car(c, FB, 0) : PIX.blit(FB, carSpr(c), c.x / U, c.y / U))]);
    }
    for (const it of hk.items || []) items.push(it);
    for (const p of sc.props) if (!p.podium && !p.tower) items.push([p.key != null ? p.key : p.over ? 1e6 + 1 : p.by, p.draw ? () => p.draw(FB) : () => PIX.blit(FB, p.spr, p.x, p.y)]);
    const drawLayer = (l) => {
      // Edit 99 (P8.4): a lifted layer whose surface reaches the bottom row continues past the edge by its lift. Its surface row is
      // extended first, then its cars and props draw into those rows, so a car coming up from the bottom edge is whole. P6.4 to 8.3
      // smeared the finished bottom row, cars included, down the strip: the streaks and the x-ray checker on cars entering there.
      const Lh0 = l.L.h || AH, ext = l.lift && Lh0 <= AH && rowLit(l.L, AH - 1) ? l.lift : 0, Lh = Lh0 + ext;
      const BUF = Lh > DL.h ? (DL._tall && DL._tall.h >= Lh ? DL._tall : (DL._tall = Object.assign(new PIX.Buf(AW, Lh), { layer: DL.layer }))) : DL; // P6.4: a layer that runs past the bottom edge draws its own rows there
      const DLk = DL; DL = BUF; if (BUF !== DLk) BUF.d.fill(0);
      DL.d.set(l.L.d);
      if (ext) { const row = l.L.d.subarray((AH - 1) * AW, AH * AW); for (let y = AH; y < Lh; y++) DL.d.set(row, y * AW); }
      const cars = onL.get(l) || [], me = hk.bodyOn === l;
      if (hk.layerUnder) hk.layerUnder(l, DL, cars, me);
      const list = cars.map((c) => [carKey(c), () => (hk.car ? hk.car(c, DL, l.lift) : PIX.blit(DL, carSpr(c), c.x / U, c.y / U))]);
      for (const p of l.props || []) list.push([p.by, () => PIX.blit(DL, p.spr, p.x, p.y)]);
      if (me && hk.body) list.push([hk.bodyKey, () => hk.body(DL, l.lift)]);
      list.sort((a, b) => a[0] - b[0]).forEach((it) => it[1]());
      for (let y = 0; y < Lh; y++) { const ty = y - l.lift; if (ty < 0 || ty >= AH) continue; for (let x = 0; x < AW; x++) { const c = DL.d[y * AW + x]; if (c) FB.d[ty * AW + x] = c; } }
      if (!ext && l.lift && Lh0 <= AH && !EXTEND) for (let x = 0; x < AW; x++) { const c = DL.d[(AH - 1) * AW + x]; if (c) for (let ty = AH - l.lift; ty < AH; ty++) FB.d[ty * AW + x] = c; } // P6.4 to 8.3: a layer running off the bottom edge
      DL = DLk;
      if (hk.layerDone) hk.layerDone(l, cars, me);
    };
    for (const l of sc.layers) {
      for (const c of l.cols) items.push([Math.min(c.key, l.front - 1), () => PIX.blit(FB, c.spr, Math.round(c.x / U), Math.round(c.y / U))]);
      items.push([l.front, () => drawLayer(l)]);
    }
    for (const p of sc.props) if (p.podium) items.push([1e6 - 1, () => PIX.blit(FB, p.spr, p.x, p.y)]);
    for (const p of sc.props) if (p.tower) items.push([1e6 + 2, () => PIX.blit(FB, p.spr, p.x, p.y)]);
    items.sort((a, b) => a[0] - b[0]).forEach((it) => it[1]());
    if (sc.monument) drawMonument(FB, sc.monument.cx, sc.monument.cy);
  }
  // the layer a car is drawn with: the lifted layer at its elevation under it (none at Z0)
  function layerOf(sc, c) {
    const e = c.elev || 0;
    if (!e) return null;
    const ls = sc.layers.filter((l) => (l.z || 0) === e && !l.walk && !l.gate);
    return ls.find((l) => l.inBand(c.x, c.y)) || ls.find((l) => l.inBand(Math.max(1, Math.min(W - 1, c.x)), Math.max(1, Math.min(H - 1, c.y)))) || ls[0] || null;
  }
  // ---------- P6 player sim (GDD Edit 62). The P5 dummy, on the P6 world: floors as tests at a level, solids at Z0 and
  // above, the hill polygon with its tunnel, water and the drone rescue (D37), screens as the world's, the shift's clock.
  const LEVEL_LIST = DISTRICTS.map((d) => d.id);
  const INFO = (id) => { const D = DISTRICTS.find((d) => d.id === id); return D ? { name: D.name, blurb: D.mood } : null; };
  const nameOf = (c, r) => 'ABC'[c] + (r + 1);
  class Sim6 extends X.Sim {
    constructor(id, overrides, carry, opts) {
      super('straight', Object.assign({}, P6SIM, overrides || {}, { 'run.appearances.road': 0 }), carry); // Edit 75: P6's values in the player sim too
      opts = opts || {}; this.opts = opts; // Edit 81 (P7): opts.startTile (the story starts a district on its first tile); opts.single (Arcade: one district is a whole run)
      this.p6 = true; this.levelId = id; this.list = LEVEL_LIST; this.roadIndex = LEVEL_LIST.indexOf(id); this.isFinal = !!opts.single || this.roadIndex === LEVEL_LIST.length - 1; this.isCity = true;
      const bud = overrides && overrides['run.appearances.road'] != null ? overrides['run.appearances.road'] : P['run.appearances.road'];
      this.P['run.appearances.road'] = bud;
      const acc = this.P['world.deckDropGaps'] || this.P['world.deckFlightsMin'] || this.P['props.cone.minVisible'] || this.P['world.dummyMonument'] || this.P['world.storyArt'] ? { dropGaps: this.P['world.deckDropGaps'], flightsMin: this.P['world.deckFlightsMin'], coneVisible: this.P['props.cone.minVisible'], monument: this.P['world.dummyMonument'], storyArt: this.P['world.storyArt'] } : null; // Edit 85 (P7.4). Edit 91: the circus's monument. Edit 92: the story's tile art
      const trf = {}; for (const k of TRAFFIC_KEYS) if (overrides && overrides[k] != null) trf[k] = overrides[k]; // Edit 99 (P8.4)
      this.W6 = opts.world || buildWorld(id, { budget: bud, warm: opts.warm, access: acc, density: opts.density, traffic: Object.keys(trf).length ? trf : null });
      this.reset();
    }
    reset() {
      if (!this.W6) return super.reset(); // the base constructor's own reset, before the world exists
      const P = this.P, Wd = this.W6, cy = this.carry || {}, D = Wd.D;
      this.t = Wd.t; this.tStart = Wd.t; this.tick = 0; this.phase = 'play'; this.phaseT = 0; this.pendingPhase = null;
      this.tOffset = (cy.t || 0) - this.tStart;
      this.cars = []; this.view = []; this.drones = []; this.rescue = null; this.booms = {}; this.deckNext = {};
      this.schedule = new Array(Wd.budget).fill(null); this.slot = Wd.admitted;
      this.run = { writeOffs: 0, credits: cy.credits || 0, points: cy.points || 0, owned: Object.assign({}, cy.owned), chassis: cy.chassis || 0,
        ending: null, admitted: Wd.admitted, exited: 0, purchases: (cy.purchases || []).slice(), priorWriteOffs: cy.writeOffs || 0 };
      this.quota = P['world.district.' + this.levelId + '.quota'];
      this.events = []; this.effects = []; this.milestones = Object.assign({}, cy.milestones); this.report = null; this.turnHist = [];
      for (const s of Wd.sims) s.models = this.models; // learning is the fleet's: every driver reads the same models
      const [tile0, edge] = D.start, tile = (this.opts && this.opts.startTile) || tile0, c0 = 'ABC'.indexOf(tile[0]), r0 = +tile[1] - 1;
      this.district = { cols: 3, rows: 3, cur: [c0, r0], start: [c0, r0], visited: new Set([r0 * 3 + c0]), path: [], lastFlip: null, edge,
        cells: [0, 1, 2].map((r) => [0, 1, 2].map((c) => { const g = Wd.at(c, r).game; return { center: g.center, ring: g.ring, decks: g.deckLines, focal: null, landmark: g.landmark }; })) };
      this.enter(Wd.at(c0, r0));
      this.spawnBody();
      this.buildView();
    }
    enter(sc) { this.sc = sc; this.level = sc.game; this.cones = sc.cones; this.booms = sc.booms || (sc.booms = {}); this.district.cur = [sc.col, sc.row]; }
    screenName() { return nameOf(this.district.cur[0], this.district.cur[1]); }
    buildView() { this.cars = viewCars(this.W6, this.sc); this.view = this.cars; }
    carsLeft() { return Math.max(0, this.W6.budget - this.W6.admitted); } // P6.1: shift cars still to appear
    allCars() { const out = []; for (const s of this.W6.sims) for (const c of s.cars) if (c.shift && !c.ghost) out.push(c); return out; } // the shift's cars still in the district
    bodyLayer() { const b = this.body; return b && b.alive && !b.stair && b.mode !== 'drop' && b.mode !== 'rescue' && b.mode !== 'hitch' ? b.level : null; } // Edit 79: hitched, out of traffic's way
    meets(c) { return this.bodyLayer() === (c.elev || 0); } // P6: by elevation (no two traffic surfaces share a level and a footprint)
    bodyDeck() { return null; }
    floorOf() { const b = this.body; return b.floor != null && b.floor >= 0 ? this.level.floors[b.floor] || null : null; }
    onGround() { const b = this.body; return b.level === 0 && !b.stair && b.mode !== 'drop' && b.mode !== 'rescue'; }
    spawnBody() {
      super.spawnBody();
      const b = this.body, sp = this.level.spawns.find((q) => q.x === b.x && q.y === b.y) || this.level.spawns[0];
      if (sp) { b.x = sp.x; b.y = sp.y; b.level = sp.level || 0; b.floor = sp.floor != null ? sp.floor : null; }
      b.px = b.x; b.py = b.y;
    }
    pickSpawn() {
      const sps = this.level.spawns.length ? this.level.spawns : [{ x: W / 2, y: H / 2, f: 90, level: 0, floor: null }];
      for (const sp of sps) if (this.cars.every((c) => (c.elev || 0) !== (sp.level || 0) || hyp(c.x - sp.x, c.y - sp.y) > 80)) return sp;
      return sps[0];
    }
    // ----- the step: the world's traffic first (the dummy as last seen), then the dummy against the cars as they now stand
    step(cmd) {
      const P = this.P, dt = 1 / P['simulation.tickRate'];
      cmd = cmd || {};
      if (this.phase === 'hitstop' || this.phase === 'writeoff' || this.phase === 'scroll') {
        this.phaseT -= dt;
        if (this.phaseT <= 1e-9) this.phase = this.phase === 'writeoff' ? this.pendingPhase : 'play';
        return;
      }
      if (this.phase !== 'play') return;
      this.tick++; this.t += dt;
      const Wd = this.W6;
      stepWorld(Wd, this.body, this.sc);
      this.t = Wd.t;
      for (const e of Wd.events) if (FORWARD.has(e.type)) { const d = Object.assign({}, e); delete d.t; delete d.type; this.emit(e.type, d); }
      Wd.events.length = 0;
      this.buildView();
      for (const c of this.cars) { const o = c.ghost ? c.real : c; if (o.shift && !o.appeared && c.x > 0 && c.x < W && c.y > 0 && c.y < H) { o.appeared = true; if (Wd.admitted < Wd.budget) Wd.admitted++; } } // P6.1: the shift's clock counts cars as they appear here
      this.slot = Wd.admitted; this.run.admitted = Wd.admitted; this.run.exited = Wd.exited;
      for (const c of this.cars) c.touched = false;
      this.bodyControl(cmd, dt);
      const N = Math.max(1, Math.round(P['proto.substeps'])), h = dt / N, contacts = [];
      for (let k = 0; k < N; k++) { this.moveBody(h); this.floorStep(contacts, k); this.collideBody(contacts, k); this.moveCones(h); }
      for (const c of this.cars) if (!c.touched) c.inEpisode = false;
      const own = Object.prototype.hasOwnProperty;
      for (const g of this.cars) if (g.ghost) for (const k of ['touched', 'inEpisode', 'spent']) if (own.call(g, k)) g.real[k] = g[k]; // what the dummy did to a car next door happened to it
      const positive = this.account(contacts);
      this.retryPending();
      this.stepRescue(dt);
      this.stepBooms(dt); // P6.1: booms where a road or highway leaves the district
      this.trackUse();
      this.checkTerminal();
      if (this.phase === 'play') this.checkFlip();
      if (this.phase === 'play' && positive && P['feedback.hitStop'] > 0) { this.phase = 'hitstop'; this.phaseT = P['feedback.hitStop']; }
      this.effects = this.effects.filter((e) => this.t - e.t < 1.5);
    }
    moveBody(h) { const b = this.body; b.px = b.x; b.py = b.y; if (b.mode === 'rescue') return; super.moveBody(h); }
    bodyControl(cmd, dt) { if (this.body.mode === 'rescue') return; super.bodyControl(cmd, dt); }
    // ----- floors (P6): a floor is a test on the centre at its level
    floorStep(contacts, k) {
      const b = this.body;
      if (!b.alive || b.mode === 'rescue' || b.mode === 'hitch') return; // Edit 79: the floor is checked when the hitch lets go
      if (b.mode === 'drop') { if (b.drop.t >= b.drop.T - 1e-9) this.land(contacts, k); return; }
      if (b.stair) return this.stairStep();
      if (b.level > 0) return this.floorMove();
      if (b.mode === 'jump') return; // Edit 75: in the air over stairs and water; the landing decides
      for (const st of this.level.stairs) { const t = this.stairT(st, b.x, b.y); if (t >= 0 && t < 0.35 && this.stairFoot(st) && this.enterStair(st, 'foot')) return; }
      if (this.level.water.some((p) => PIX.inPoly(p, b.x, b.y))) this.startRescue(); // off the seawall into the river
    }
    stairStep() {
      const P = this.P, b = this.body, st = b.stair, r = P['body.radius'], [l0, l1] = this.stairSpan(st), m = Math.min(r, (l1 - l0) / 4);
      if (st.axis === 'y') b.x = Math.max(l0 + m, Math.min(l1 - m, b.x)); else b.y = Math.max(l0 + m, Math.min(l1 - m, b.y));
      const len = Math.abs(st.high - st.low), t = this.stairT(st, b.x, b.y), ext = (P['world.parapetWidth'] + r) / len;
      if (t < 0) { b.stair = null; b.level = st.from; b.floor = null; this.emit('level', { level: b.level }); }
      else if (t > 1 + ext) {
        const f = this.level.floors[st.head], dir = Math.sign(st.high - st.low);
        for (let k = 0; k < 24 && f && !f.has(b.x, b.y); k++) { if (st.axis === 'y') b.y += dir * 2; else b.x += dir * 2; } // step off fully onto the floor
        b.stair = null; b.level = st.to; b.floor = st.head;
        this.emit('level', { level: b.level, floor: f ? f.kind : null }); this.mile(f && f.kind === 'roof' ? 'firstRoof' : st.to === 2 ? 'firstHighway' : 'firstDeck');
      }
    }
    // On a floor: inside its test, or across an edge onto another floor at the level, onto a stair, into the next screen
    // (where it has a floor at the level), off a drop edge (walkway, hill, terrace, roof, broken parapet); else it holds.
    floorMove() {
      const b = this.body, f = this.floorOf(), z = b.level;
      if (!f) { b.level = 0; b.floor = null; return; }
      if (f.has(b.x, b.y)) return;
      const block = () => { if (b.mode === 'lunge') b.lunge.blocked = true; };
      const g = this.level.floors.findIndex((q) => q !== f && q.z === z && q.has(b.x, b.y));
      if (g >= 0) { b.floor = g; return; }
      for (const st of b.mode === 'jump' ? [] : this.level.stairs) {
        if (st.head !== b.floor) continue;
        const [l0, l1] = this.stairSpan(st), lat = st.axis === 'y' ? b.x : b.y, t = this.stairT(st, b.x, b.y), ext = (this.P['world.parapetWidth'] + this.P['body.radius']) / Math.abs(st.high - st.low);
        const back = ((st.axis === 'y' ? b.y - b.py : b.x - b.px) * Math.sign(st.high - st.low)) < 0; // Edit 76: only a body heading back down the flight steps onto it
        if (back && lat >= l0 + 2 && lat <= l1 - 2 && t >= 0.5 && t <= 1 + ext + 0.25 && this.enterStair(st, 'head')) return; // (pushing on across a narrow walkway froze it at the far rail, on the stair)
      }
      if (b.x < 0 || b.x > W || b.y < 0 || b.y > H) { if (this.neighbourFloor(b.x, b.y, z)) return; }
      else if (f.drop || (f.dropAt && f.dropAt(b.x, b.y)) || (f.rail && b.mode === 'jump' && b.jump && b.jump.clear !== false && b.z >= this.P['world.jumpableHeight'])) { // Edit 75: a jump clears a handrail or parapet and drops to the level below
        let ux = b.x - b.px, uy = b.y - b.py, l = hyp(ux, uy); if (l < 1e-6) { ux = Math.cos(b.facing); uy = Math.sin(b.facing); l = 1; }
        if (f.rail && b.mode === 'jump') this.emit('rail-jump', { kind: f.kind, x: +b.x.toFixed(1), y: +b.y.toFixed(1), level: b.level });
        return this.startDrop6(ux / l, uy / l);
      }
      if (f.has(b.px, b.y)) { b.x = b.px; b.vx = 0; } else if (f.has(b.x, b.py)) { b.y = b.py; b.vy = 0; } else { b.x = b.px; b.y = b.py; b.vx = 0; b.vy = 0; }
      if (!f.has(b.x, b.y)) { const q = this.level.floors.findIndex((o) => o.z === z && o.has(b.x, b.y)); if (q >= 0) b.floor = q; }
      block();
    }
    neighbourFloor(x, y, z) { // the floor at this level next door, at the point across the shared edge
      const sd = x > W ? 'E' : x < 0 ? 'W' : y > H ? 'S' : y < 0 ? 'N' : null;
      if (!sd) return null;
      const nb = this.W6.at(this.district.cur[0] + SIDE[sd][0], this.district.cur[1] + SIDE[sd][1]);
      if (!nb) return null;
      const nx = Math.max(1, Math.min(W - 1, x - SIDE[sd][0] * W)), ny = Math.max(1, Math.min(H - 1, y - SIDE[sd][1] * H));
      const i = nb.game.floors.findIndex((q) => q.z === z && q.has(nx, ny));
      return i >= 0 ? { sc: nb, i } : null;
    }
    // Off a drop edge: velocity carries on, outward at least far enough to clear the edge. The dummy lands on the nearest
    // floor below its landing point, else the ground (or the river). Fall time and landing speed grow with √height.
    startDrop6(ux, uy) {
      const P = this.P, b = this.body, r = P['body.radius'], vmax = P['movement.runSpeed'], fromZ = b.level, ref = P['world.deckHeight'], fromKind = (this.floorOf() || {}).kind || null;
      let vx = b.vx, vy = b.vy; const sp = hyp(vx, vy);
      if (sp > vmax) { vx *= vmax / sp; vy *= vmax / sp; }
      const plan = (T) => { const vo = vx * ux + vy * uy, need = (P['world.parapetWidth'] + 2 * r) / T, add = Math.max(0, need - vo); return [vx + ux * add, vy + uy * add]; };
      let T = P['world.dropSeconds'] * Math.sqrt(X.zHeight(P, fromZ) / ref), [dx, dy] = plan(T), toZ = 0, toFloor = null;
      const lx = b.x + dx * T, ly = b.y + dy * T;
      this.level.floors.forEach((q, i) => { if (q.z < fromZ && q.z > toZ && q.has(lx, ly)) { toZ = q.z; toFloor = i; } });
      const h = X.zHeight(P, fromZ) - X.zHeight(P, toZ);
      T = P['world.dropSeconds'] * Math.sqrt(h / ref); [dx, dy] = plan(T);
      b.mode = 'drop'; b.lunge = null; b.stair = null; b.floor = null; b.jump = null; b.z = 0;
      b.drop = { t: 0, T, vx: dx, vy: dy, x0: b.x, y0: b.y, fromZ, toZ, toFloor, h, fromKind }; b.vx = dx; b.vy = dy;
      this.emit('deck-drop', { x: +b.x.toFixed(1), y: +b.y.toFixed(1), from: fromZ, to: toZ, h, fromKind });
      this.mile('firstDeckDrop');
    }
    land(contacts, k) {
      super.land(contacts, k);
      const b = this.body;
      if (b.level === 0 && this.level.water.some((p) => PIX.inPoly(p, b.x, b.y))) this.startRescue(); // into the river
    }
    // ----- the river (D37): a drone lifts the dummy and sets it down on the nearest land at Z0 or Z1, never a lane, a deck
    // or a building. Time: proto.droneLiftSeconds, then the distance at proto.droneSpeed.
    startRescue() { // P6.1 (Edit 63): the dummy sinks for proto.rescueSinkSeconds; then a drone flies in from the nearest screen edge
      const b = this.body, P = this.P, G = this.level;
      let best = null;
      for (const sp of this.landPoints()) { const d = hyp(sp.x - b.x, sp.y - b.y); if (!best || d < best.d) best = Object.assign({ d }, sp); }
      if (!best) best = Object.assign({ d: 0 }, G.spawns[0] || { x: W / 2, y: H / 2, level: 0, floor: null });
      const edges = [[b.x, -40], [b.x, H + 40], [-40, b.y], [W + 40, b.y]].sort((p, q) => hyp(p[0] - b.x, p[1] - b.y) - hyp(q[0] - b.x, q[1] - b.y)), ex = edges[0];
      for (const cn of this.carriedCones()) Object.assign(cn, { state: 'pending', px: b.x, py: b.y }); b.held = null; b.carried = []; b.gesture = null; // the cones go home (retryPending)
      b.mode = 'rescue'; b.lunge = null; b.stair = null; b.jump = null; b.z = 0; b.vx = b.vy = 0; b.level = 0; b.floor = null; b._spr = null;
      this.rescue = { t: 0, phase: 'sink', k: 0, x0: b.x, y0: b.y, to: best, under: 0, up: 0, sink: P['proto.rescueSinkSeconds'], lift: P['proto.droneLiftSeconds'], v: P['proto.droneSpeed'],
        drone: { x: ex[0], y: ex[1], alt: 1, state: 'wait', rescue: true, hx: ex[0], hy: ex[1] } };
      this.emit('splash', { x: +b.x.toFixed(1), y: +b.y.toFixed(1) });
      this.mile('firstRescue');
    }
    landPoints() { // land beside the water, by screen, cached
      const sc = this.sc;
      if (sc.land) return sc.land;
      const G = sc.game, out = [], free = (x, y) => !G.statics.some((s) => inR(s, x, y, R0 + 2)) && G.polys0.every((p) => !PIX.inPoly(p, x, y) && polyDist(p, x, y).d >= R0) && !G.water.some((p) => PIX.inPoly(p, x, y) || polyDist(p, x, y).d < R0 / 2) && !G.stairs.some((s) => inR(s, x, y, R0 + 2)); // the promenade is 28 across: the body may overhang the kerb and the wall by half
      for (let y = 16; y <= H - 16; y += 4) for (let x = 16; x <= W - 16; x += 4) { // a fine grid: the promenade between the kerb and the seawall is world.walkwayWidth across
        if (sc.roadOk(x, y, OUTER + R0 / 2) && free(x, y) && !G.floors.some((f) => f.kind !== 'hill' && f.has(x, y))) out.push({ x, y, level: 0, floor: null });
        else { const hf = G.floors.find((f) => f.kind === 'hill' && f.has(x, y)); if (hf && (!sc.hillOk || sc.hillOk(x, y, OUTER + R0)) && !G.solidsZ.some((s) => inR(s, x, y, R0 + 2))) out.push({ x, y, level: 1, floor: hf.i }); }
      }
      sc.land = out;
      return out;
    }
    stepRescue(dt) { // sink → the drone flies in → lift → carry → set down → the drone leaves
      const rs = this.rescue, b = this.body;
      for (const d of this.leaving || []) { const dx = d.hx - d.x, dy = d.hy - d.y, l = hyp(dx, dy), st = (rs ? rs.v : this.P['proto.droneSpeed']) * dt; if (l <= st) d.gone = true; else { d.x += dx / l * st; d.y += dy / l * st; } }
      this.leaving = (this.leaving || []).filter((d) => !d.gone);
      if (!rs) return;
      rs.t += dt; rs.k += dt;
      const d = rs.drone, fly = (x, y) => { const dx = x - d.x, dy = y - d.y, l = hyp(dx, dy), st = rs.v * dt; if (l <= st) { d.x = x; d.y = y; return true; } d.x += dx / l * st; d.y += dy / l * st; return false; };
      const next = (ph) => { rs.phase = ph; rs.k = 0; };
      if (rs.phase === 'sink') { rs.under = Math.min(1, rs.k / rs.sink); if (rs.k >= rs.sink) { next('inbound'); d.state = 'inbound'; this.emit('drone-dispatch', { rescue: true }); } }
      else if (rs.phase === 'inbound') { if (fly(b.x, b.y)) { next('lift'); d.state = 'lift'; } }
      else if (rs.phase === 'lift') { const f = Math.min(1, rs.k / rs.lift); rs.under = 1 - f; rs.up = 14 * f; d.alt = 1 - 0.6 * Math.sin(Math.PI * f); if (f >= 1) { next('carry'); d.state = 'carry'; d.alt = 1; } }
      else if (rs.phase === 'carry') { const arrived = fly(rs.to.x, rs.to.y); b.x = d.x; b.y = d.y; b.px = b.x; b.py = b.y; if (arrived) next('drop'); }
      else if (rs.phase === 'drop') {
        const f = Math.min(1, rs.k / rs.lift); rs.up = 14 * (1 - f);
        if (f >= 1) {
          Object.assign(b, { x: rs.to.x, y: rs.to.y, px: rs.to.x, py: rs.to.y, level: rs.to.level, floor: rs.to.floor, mode: 'recover', recoverT: 0, vx: 0, vy: 0 });
          d.state = 'outbound'; (this.leaving = this.leaving || []).push(d);
          this.rescue = null;
          this.emit('rescued', { x: +b.x.toFixed(1), y: +b.y.toFixed(1), level: b.level, seconds: +rs.t.toFixed(2) });
        }
      }
    }
    // ----- solids: rects and the hill at Z0; rects above at their level. Screen edges open onto open ground next door.
    collideBody(contacts, k) {
      const P = this.P, b = this.body, r = P['body.radius'], G = this.level;
      if (!b.alive || b.stair || b.mode === 'drop' || b.mode === 'rescue' || b.mode === 'hitch') return; // Edit 79: riding a car
      const air = b.mode === 'jump' && b.jump && b.jump.clear !== false ? b.z : 0; // Edit 75: how high the dummy is in a jump. Edit 77: a hop clears nothing
      const block = () => { if (b.mode === 'lunge') b.lunge.blocked = true; };
      const push = (nx, ny, pen) => { b.x += nx * pen; b.y += ny * pen; const vn = b.vx * nx + b.vy * ny; if (vn < 0) { b.vx -= vn * nx; b.vy -= vn * ny; } if (b.mode === 'jump') X.JUMP.slide(b.jump, nx, ny); block(); }; // Edit 76: in a jump, slide along it
      const rect = (s) => { const res = circleRect(b.x, b.y, r, s); if (res) push(res.nx, res.ny, res.pen); };
      const ground = b.level === 0;
      if (ground) {
        for (const s of G.statics) if (!(s.jumpable && air >= s.zTop)) rect(s); // a jumpable piece is cleared above its top
        for (const st of G.stairs) if (!this.stairFoot(st)) rect(st);
        for (const cp of G.checkpoints) if (!cp.deck && !cp.z) rect(cpZone(cp)); // between a boom and the district edge
        for (const poly of G.polys0) {
          const inside = PIX.inPoly(poly, b.x, b.y), q = polyDist(poly, b.x, b.y);
          if (!inside && q.d >= r) continue;
          const dx = inside ? q.qx - b.x : b.x - q.qx, dy = inside ? q.qy - b.y : b.y - q.qy, l = hyp(dx, dy) || 1;
          push(dx / l, dy / l, inside ? q.d + r : r - q.d);
        }
        let ex = Math.max(r, Math.min(W - r, b.x)), ey = Math.max(r, Math.min(H - r, b.y));
        if ((b.x < r && this.edgeOpen('W', b.y)) || (b.x > W - r && this.edgeOpen('E', b.y))) ex = b.x;
        if ((b.y < r && this.edgeOpen('N', b.x)) || (b.y > H - r && this.edgeOpen('S', b.x))) ey = b.y;
        if (ex !== b.x || ey !== b.y) { b.x = ex; b.y = ey; block(); }
      } else { for (const s of G.solidsZ) if (s.z === b.level) rect(s); for (const cp of G.checkpoints) if ((cp.z || 0) === b.level) rect(cpZone(cp)); }
      for (const c of this.cars) {
        if (!this.meets(c)) continue; // cars meet the dummy on their own level only
        if (air > 0 && air >= P['vehicles.' + c.cls + '.height']) continue; // Edit 75: over the roof
        const res = X.circleCar(b.x, b.y, r, c);
        if (!res) continue;
        c.touched = true;
        const nx = -res.nx, ny = -res.ny, rel = (b.vx - c.vx) * nx + (b.vy - c.vy) * ny;
        let knock = null;
        if (!c.inEpisode) {
          c.inEpisode = true;
          const rico = b.mode === 'knock' && this.has('ricochet');
          const ph = X.impulseImpact(P, b.vx, b.vy, c.vx, c.vy, nx, ny, c.cls, b.mode === 'lunge' || b.mode === 'knock' || b.mode === 'jump'); // Edit 75: a jump strikes as a dash does
          contacts.push({ k, car: c, closing: Math.max(0, rel), ph, px: res.cx, py: res.cy, zone: X.zoneOf(res.qx, res.qy, c),
            carState: this.carCue(c), cause: c.cause, lunging: b.mode === 'lunge', bodySpeed: hyp(b.vx, b.vy), carSpeed: c.v, stopped: c.v < 5 || !!(c.man && c.man.standoff), jump: b.mode === 'jump', ricochet: rico,
            kind: b.mode === 'knock' ? (b.pushed ? 'push' : b.sling ? 'sling' : 'bounce') : b.mode === 'jump' ? 'jump' : b.mode === 'lunge' ? 'dash' : 'struck' }); // Edit 79: the move, for combo variety (Edit 80: PUSH)
          if (P['proto.damageModel'] && ph.un > 1e-6) knock = this.bounce(ph.knock); // Ricochet: twice the bounce
        }
        b.x += res.nx * res.pen; b.y += res.ny * res.pen;
        b.lastHit = { id: c.id, t: this.t, nx: res.nx, ny: res.ny }; // Edit 80: the car to push off, and which way is away
        if (knock) { b.mode = 'knock'; b.sling = false; b.pushed = false; b.lunge = null; b.jump = null; b.z = 0; b.knockT = 0; b.knockVx = knock.x; b.knockVy = knock.y; b.vx = knock.x; b.vy = knock.y; this.emit('knock', { car: c.id, speed: +hyp(knock.x, knock.y).toFixed(2), ricochet: this.has('ricochet') }); }
        else if (rel > 0) { b.vx -= rel * nx; b.vy -= rel * ny; }
        block();
      }
      const rr = r + P['props.cone.radius'];
      for (const cn of ground && air < P['proto.art.coneHeight'] ? this.cones : []) { // Edit 75: a jump clears cones above their height
        if (cn.state !== 'free') continue;
        const dx = cn.x - b.x, dy = cn.y - b.y, d = hyp(dx, dy);
        if (d >= rr || d < 1e-9) continue;
        const ux = dx / d, uy = dy / d, sp = hyp(b.vx, b.vy);
        if (b.vx * ux + b.vy * uy > 1 && sp > 5) {
          const v = P['props.cone.puntDistance'] / P['props.cone.puntSeconds'];
          Object.assign(cn, { state: 'flight', vx: b.vx / sp * v, vy: b.vy / sp * v, flightT: P['props.cone.puntSeconds'], flightDur: P['props.cone.puntSeconds'], kind: 'punt' });
          this.emit('punt', { cone: cn.id });
        }
        cn.x = b.x + ux * rr; cn.y = b.y + uy * rr;
      }
      if (b.level > 0 && b.mode !== 'drop' && !b.stair) this.floorMove(); // a car's shove obeys the parapet too, and can push the dummy off an edge
    }
    edgeOpen(sd, v) { // open ground across the shared edge, inside the district
      const nb = this.W6.at(this.district.cur[0] + SIDE[sd][0], this.district.cur[1] + SIDE[sd][1]);
      if (!nb) return false;
      const r = this.P['body.radius'], x = sd === 'E' ? r + 1 : sd === 'W' ? W - r - 1 : v, y = sd === 'S' ? r + 1 : sd === 'N' ? H - r - 1 : v, G = nb.game;
      return x >= r && x <= W - r && y >= r && y <= H - r && G.statics.every((s) => !inR(s, x, y, 0)) && G.polys0.every((p) => !PIX.inPoly(p, x, y)); // arrival free (P6.1): the push-out slides the body clear of a corner
    }
    moveCones(h) { const all = this.cars; this.cars = all.filter((c) => !(c.elev || 0)); try { super.moveCones(h); } finally { this.cars = all; } }
    coneSpotValid(x, y, ignore) { return super.coneSpotValid(x, y, ignore) && this.level.polys0.every((p) => !PIX.inPoly(p, x, y)) && this.level.water.every((p) => !PIX.inPoly(p, x, y)); }
    dropHeld() { const all = this.cars; this.cars = all.filter((c) => !(c.elev || 0)); try { return super.dropHeld(); } finally { this.cars = all; } }
    throwHeld() { const all = this.cars; this.cars = all.filter((c) => !(c.elev || 0)); try { return super.throwHeld(); } finally { this.cars = all; } }
    // ----- screens: walk off an edge onto open ground, or along a floor that continues next door at the same level
    checkFlip() {
      const b = this.body;
      if (!b.alive || b.stair || b.mode === 'drop' || b.mode === 'rescue') return;
      let sd = b.x > W ? 'E' : b.x < 0 ? 'W' : b.y > H ? 'S' : b.y < 0 ? 'N' : null;
      const lw = b.level > 0 ? (b.level === 2 ? Z2 : Z1) * U : 0; // P6.4 (Edit 66): at a level, a north–south crossing happens at the edge as drawn
      if (lw && (sd === 'S' || sd === 'N' || !sd) && b.x >= 0 && b.x <= W) {
        if (sd === 'S' && b.y <= H + lw && this.neighbourFloor(b.x, b.y, b.level)) return; // still drawn on this screen
        if (!sd && b.y < lw && this.W6.at(this.district.cur[0], this.district.cur[1] - 1) && this.canCross([this.district.cur[0], this.district.cur[1] - 1])) { const nb = this.W6.at(this.district.cur[0], this.district.cur[1] - 1), i = nb.game.floors.findIndex((q) => q.z === b.level && q.has(b.x, b.y + H)); if (i >= 0) return this.flip('N', [this.district.cur[0], this.district.cur[1] - 1], i); }
      }
      if (!sd) return;
      const to = [this.district.cur[0] + SIDE[sd][0], this.district.cur[1] + SIDE[sd][1]], r = this.P['body.radius'];
      if (!this.W6.at(to[0], to[1]) || !this.canCross(to)) { b.x = Math.max(r, Math.min(W - r, b.x)); b.y = Math.max(r, Math.min(H - r, b.y)); return; } // the district's outer edge (B1: the top of the screen, inside the tunnel); Edit 81: a story fence
      let fl = null;
      if (b.level > 0) { const q = this.neighbourFloor(b.x, b.y, b.level); if (!q) { b.x = Math.max(0, Math.min(W, b.x)); b.y = Math.max(0, Math.min(H, b.y)); return; } fl = q.i; }
      this.flip(sd, to, fl);
    }
    canCross() { return true; } // Edit 81: the story fences a tile until it is cleared (p7/story.js)
    edgeLift() { const b = this.body; return b.level > 0 ? (b.level === 2 ? Z2 : Z1) * U : 0; } // Edit 81: at a level the screen's edge is drawn this far down (P6.4)
    flip(sd, to, fl) {
      const D = this.district, b = this.body, P = this.P, from = D.cur.slice(), old = this.sc, nb = this.W6.at(to[0], to[1]);
      for (const cn of this.cones) if (cn.state === 'flight') Object.assign(cn, { state: 'free', vx: 0, vy: 0 });
      for (const held of this.carriedCones()) { const i = old.cones.indexOf(held); if (i >= 0) old.cones.splice(i, 1); nb.cones.push(held); } // Edit 78: every cone carried
      this.effects = [];
      D.visited.add(to[1] * 3 + to[0]);
      this.enter(nb);
      b.x -= SIDE[sd][0] * W; b.y -= SIDE[sd][1] * H; b.px = b.x; b.py = b.y;
      if (b.level > 0) b.floor = fl != null ? fl : -1;
      if (b.level > 0 && !(b.floor >= 0)) { b.level = 0; b.floor = null; }
      this.buildView();
      D.lastFlip = { side: sd, from, to, t: this.t };
      this.phase = 'scroll'; this.phaseT = P['world.flipSeconds'];
      this.emit('screen', { from: nameOf(from[0], from[1]), to: nameOf(to[0], to[1]), side: sd, theme: 'p6', landmark: nb.game.landmark, level: b.level });
      this.mile('firstScreen', { to: nameOf(to[0], to[1]) });
      if (D.visited.size === 9) this.mile('districtExplored', { road: this.roadIndex + 1 });
    }
    checkTerminal() { // the shift's clock: Failed test when every shift car has entered and none unspent remains
      this.slot = this.W6.admitted;
      return super.checkTerminal();
    }
    drawDrones() { const out = []; for (const s of this.sc.sims) for (const d of s.drones || []) out.push(d); if (this.rescue && this.rescue.phase !== 'sink') out.push(this.rescue.drone); for (const d of this.leaving || []) out.push(d); return out; }
    trace() {
      const D = this.district;
      return { build: 'dummies-p6', level: this.levelId, params: this.P, run: this.run, milestones: this.milestones, models: this.models, events: this.events,
        district: { start: nameOf(D.start[0], D.start[1]), cur: this.screenName(), visited: [...D.visited].map((k) => nameOf(k % 3, Math.floor(k / 3))) },
        world: { t: +this.W6.t.toFixed(2), admitted: this.W6.admitted, budget: this.W6.budget, exited: this.W6.exited, crossings: this.W6.crossings } };
    }
  }
  const FORWARD = new Set(['honk', 'commit', 'unstick', 'drone-dispatch', 'drone-pickup', 'drone-drop', 'skid', 'cone-struck']); // the active screen's traffic, heard here
  function circleRect(px, py, r, s) {
    const qx = Math.max(s.x, Math.min(s.x + s.w, px)), qy = Math.max(s.y, Math.min(s.y + s.h, py)), dx = px - qx, dy = py - qy, d = hyp(dx, dy);
    if (d >= r) return null;
    if (d > 1e-9) return { nx: dx / d, ny: dy / d, pen: r - d };
    const l = px - s.x, rt = s.x + s.w - px, t = py - s.y, b = s.y + s.h - py, m = Math.min(l, rt, t, b);
    if (m === l) return { nx: -1, ny: 0, pen: l + r };
    if (m === rt) return { nx: 1, ny: 0, pen: rt + r };
    if (m === t) return { nx: 0, ny: -1, pen: t + r };
    return { nx: 0, ny: 1, pen: b + r };
  }
  const api = { P6SIM, DISTRICTS, LEVEL_LIST, INFO, TILE, buildScreen, buildWorld, coneShows, linkWorld, stepWorld, viewCars, compose, layerOf, carKey, Sim6, gameData, polyDist, AWAY, groundFree, arrives, edgePt, inR, cpZone };
  if (NODE) module.exports = api; else root.WORLD6 = api;
})(typeof window !== 'undefined' ? window : globalThis);
