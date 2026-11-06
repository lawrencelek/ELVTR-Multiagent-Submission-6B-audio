// Prototype 10 (GDD Edits 101–102): the test road, greybox. One screen: the Monument junction, one red sedan, the dummy.
// Placeholder art by design (Nintendo check, row 655: mechanic before art). It draws the zones that act on the car (D103):
// the forward beam and the driver's field. 10.2 adds the lesson (handover v2 §9.1): the hit replayed as the car's training
// clip, the sensor fitted, the car's return. No goal text.
// 10.3 adds rung 2's field, its notice meter, the jump and the plinth's raised edge. 10.4: rung 3's roof lidar.
// 10.5: rung 4's street cameras and their link to the car; the cones (Hands 1) carried, put down and fetched by drone; a
// marker at the screen's edge for a car waiting off screen. 10.6: DUCK, the planter rows, each camera's reach, and whether
// any of the car's sensors has the dummy (a ducked dummy it has not got draws dim). 10.7: every crash leaves a chalk outline,
// debris and a numbered evidence marker on the road. From rung 6 the car's memory draws: a red ring on each spot it
// remembers, a line to that crash's outline, a scan from the car to the spots in its field, its memory module and count.
// The block lift (row 715): a countdown over a dummy that keeps a car waiting; then a drone lifts it aside until the car has passed.
// 10.8, rung 7's search (row 717): a ghost where the car last saw the dummy, the ring it searches, its time left; the car's
// amber beacon and SEARCHING; FOUND when it has the dummy near the ghost.
// Keys: arrows or WASD move; Space or J dash, K or Shift jump, E picks up or puts down a cone, hold C or Ctrl to duck (once
// fitted); Z zones; P pause; R restart; L saves this session's log (JSON). Pad: A dash, B jump, X cone, hold LB or RB to
// duck. Touch: drag on the left half to move; the right half's bands, top to bottom: jump, cone (Hands 1), duck (hold;
// DUCK), dash.
(function () {
  'use strict';
  const X = window.DUMMIES, T = window.DUMMIES_P10, F = window.DUMMIES_SIM;
  const ST = window.DUMMIES_P10_STAGE || { id: '10.1', title: 'THE TEST ROAD' };
  const FW = 800, FH = 640, HUD = 56, TAU = Math.PI * 2;
  const C = { pave: '#3a3f4b', paveLine: '#454b59', road: '#1e222c', lane: '#c9d1d9', kerb: '#8c95a6', zebra: '#e8edf2',
    plinth: '#a89f8c', plinthTop: '#c2b9a5', block: '#262a35', blockEdge: '#5b6e9c', jersey: '#8494b8', cone: '#f2a65a',
    red: '#ff3d3d', redDark: '#9e1f1f', glass: '#1b2a38', dummy: '#ffd400', joint: '#2a2a2a', beam: 'rgba(244,248,250,0.10)',
    beamHot: 'rgba(255,61,61,0.22)', field: 'rgba(127,168,188,0.10)', fieldHot: 'rgba(255,212,0,0.14)', text: '#f4f8fa', dim: '#7fa8bc', hud: '#12151c',
    cam: '#9ff2c8', camDim: 'rgba(159,242,200,0.55)', camCone: 'rgba(159,242,200,0.08)', drone: '#20242e', rotor: 'rgba(200,214,230,0.5)', part: '#ffd400',
    search: '#ffb347', searchDim: 'rgba(255,179,71,0.5)',
    chalk: 'rgba(238,240,232,0.85)', chalkDim: 'rgba(238,240,232,0.35)', glassBit: '#9fb4c8', mem: '#ff5a5a', memDim: 'rgba(255,90,90,0.55)', tent: '#ffd400' };
  const PARTS = { battery1: 'BATTERY 1 · DASH', legs1: 'LEGS 1 · JUMP', hands1: 'HANDS 1 · CONES', duck1: 'DUCK · HOLD C' }, LOAD = { battery1: 'B1', legs1: 'L1', hands1: 'H1', duck1: 'D1' }, ZONES = { front: 'FRONT', frontDiagonal: 'FRONT CORNER', side: 'SIDE', rearDiagonal: 'REAR CORNER', rear: 'REAR' };
  const CLIP = F['duel.lessonClipSeconds'], HOLD = F['duel.lessonHoldSeconds'], FIT = F['duel.lessonFitSeconds']; // the clip, its last frame held, the fitting
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  let s, paused = false, started = false, showZones = true, log = [], session = {}, prevV = new Map(), flash = [];
  let ring = [], clip = null, lessonT = null, lastCrash = null; // the recording, the hit's clip, the lesson's clock, the latest crash
  const keys = new Set(); let aEdge = false, bEdge = false, xEdge = false, touchMove = null, touchA = false, touchB = false, touchX = null, touchD = null;

  function newSim() {
    s = new T.TestRoadSim(Object.assign({}, F)); log = []; session = { start: Date.now(), build: 'P' + ST.id };
    prevV.clear(); flash = []; ring = []; clip = null; lessonT = null; lastCrash = null;
  }
  newSim();

  // ---------- input
  addEventListener('keydown', (e) => {
    if (!started) { started = true; e.preventDefault(); return; }
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'j') { if (!keys.has(k)) aEdge = true; }
    if (k === 'k' || k === 'shift') { if (!keys.has(k)) bEdge = true; }
    if (k === 'e' || k === 'x') { if (!keys.has(k)) xEdge = true; }
    if (k === 'p' || k === 'escape') paused = !paused;
    if (k === 'r') newSim();
    if (k === 'z') showZones = !showZones;
    if (k === 'l') saveLog();
    keys.add(k); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  cv.addEventListener('touchstart', (e) => { started = true; for (const t of e.changedTouches) { const r = cv.getBoundingClientRect(); if (t.clientX - r.left < r.width / 2) touchMove = { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0 }; else { const bands = ['B'].concat(s.has('carry') ? ['X'] : [], s.has('duck1') ? ['D'] : [], ['A']), v = (t.clientY - r.top) / r.height, z = bands[Math.min(bands.length - 1, Math.floor(v * bands.length))];
          if (z === 'X') touchX = { id: t.identifier, press: true }; else if (z === 'D') touchD = { id: t.identifier }; else if (z === 'B') touchB = true; else touchA = true; } } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (touchMove && t.identifier === touchMove.id) { touchMove.dx = t.clientX - touchMove.x0; touchMove.dy = t.clientY - touchMove.y0; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) { if (touchMove && t.identifier === touchMove.id) touchMove = null; if (touchX && t.identifier === touchX.id) touchX = null; if (touchD && t.identifier === touchD.id) touchD = null; } }, { passive: false });
  function command() {
    let mx = 0, my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1; if (keys.has('arrowright') || keys.has('d')) mx += 1;
    if (keys.has('arrowup') || keys.has('w')) my -= 1; if (keys.has('arrowdown') || keys.has('s')) my += 1;
    let a = aEdge || touchA, bb = bEdge || touchB, xp = xEdge || !!(touchX && touchX.press), xh = keys.has('e') || keys.has('x') || !!touchX, dk = keys.has('c') || keys.has('control') || !!touchD; aEdge = false; touchA = false; bEdge = false; touchB = false; xEdge = false; if (touchX) touchX.press = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of pads) { if (!g) continue; if (Math.hypot(g.axes[0], g.axes[1]) > 0.2) { mx = g.axes[0]; my = g.axes[1]; } if (g.buttons[0] && g.buttons[0].pressed && !g._a) a = true; g._a = g.buttons[0] && g.buttons[0].pressed; if (g.buttons[1] && g.buttons[1].pressed && !g._b) bb = true; g._b = g.buttons[1] && g.buttons[1].pressed; const gx = !!(g.buttons[2] && g.buttons[2].pressed); if (gx && !g._x) xp = true; if (gx) xh = true; g._x = gx; if ((g.buttons[4] && g.buttons[4].pressed) || (g.buttons[5] && g.buttons[5].pressed)) dk = true; }
    if (touchMove) { const d = Math.hypot(touchMove.dx, touchMove.dy); if (d > 8) { mx = touchMove.dx / Math.max(d, 60); my = touchMove.dy / Math.max(d, 60); } }
    const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; }
    return { mx, my, aPress: a, bPress: bb, xPress: xp, xHeld: xh, duck: dk };
  }

  // ---------- the loop: the sim at its own tick rate
  const dt = 1 / F['simulation.tickRate'] || 1 / 60; let acc = 0, last = performance.now();
  function frame(now) {
    acc += Math.min(0.1, (now - last) / 1000); last = now;
    while (acc >= dt) { acc -= dt; if (started && !paused) tick(); }
    draw(); requestAnimationFrame(frame);
  }
  function tick() {
    if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop();
    if (s.phase === 'lesson') { // beats 1–2: the clip, then the sensor fitted; the sim waits
      if (lessonT == null) lessonT = 0;
      lessonT += dt;
      if (lessonT >= CLIP + HOLD + FIT) { lessonT = null; clip = null; s.continueLesson(); }
      return;
    }
    const e0 = s.events.length; s.step(command());
    record();
    for (const e of s.events.slice(e0)) {
      if (['impact', 'writeoff', 'admit', 'lunge', 'honk', 'lesson-due', 'lesson', 'learned', 'first-brake', 'first-side', 'first-cover', 'first-item', 'duck', 'stand', 'part-dispatch', 'gift', 'left', 'jump', 'raised', 'step-down', 'pickup', 'drop', 'drone-dispatch', 'drone-pickup', 'crash', 'spawn-slow', 'block-lift', 'block-drop', 'search', 'search-found', 'search-end'].includes(e.type) || (e.type === 'touch' && e.standstill)) log.push(e);
      if (e.type === 'impact' && Math.round(e.lost) > 0) flash.push({ x: s.body.x, y: s.body.y, t: 0.5, n: Math.round(e.lost) });
      if (e.type === 'writeoff') flash.push({ x: s.body.x, y: s.body.y, t: 1.2, n: 'WRITE-OFF' });
      if (e.type === 'gift') flash.push({ x: s.body.x, y: s.body.y, t: 1.6, n: PARTS[e.node] || e.node });
      if (e.type === 'crash') lastCrash = e;
      if (e.type === 'search-found') flash.push({ x: e.x, y: e.y, t: 0.9, n: 'FOUND' });
      if (e.type === 'lesson-due') clip = { frames: ring.slice(), hitT: e.t, model: e.model, zone: e.zone, to: e.to, info: T.RUNGS[e.to], origin: e.origin, prev: lastCrash && lastCrash.habit ? lastCrash.prev : null, seenAt: e.seenAt };
    }
  }
  function record() { // the last CLIP seconds of the road, kept for a hit's training clip
    const f = { t: s.t, cars: s.cars.filter((c) => !c.ghost).map((c) => ({ x: c.x, y: c.y, h: c.h, L: c.L, W: c.W, red: c.red, rung: c.rung })), b: s.body ? { x: s.body.x, y: s.body.y, f: s.body.facing, alive: s.body.alive, duck: !!s.body.duck } : null };
    ring.push(f); while (ring.length && f.t - ring[0].t > CLIP + 0.1) ring.shift();
  }
  function saveLog() {
    const out = { session, stage: ST, seconds: +s.t.toFixed(1), writeOffs: s.run.writeOffs, rung: s.rung, lessons: s.lessons, events: log, params: { p10: Object.fromEntries(Object.entries(F).filter(([k]) => k.startsWith('duel.') || k.startsWith('proto.learn') || k.startsWith('perception.'))) } };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
    a.download = 'p' + ST.id.replace('.', '_') + '_session_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'; a.click();
  }

  // ---------- drawing
  function fit() {
    const k = Math.min(innerWidth / FW, innerHeight / (FH + HUD)), dpr = devicePixelRatio || 1;
    cv.style.width = FW * k + 'px'; cv.style.height = (FH + HUD) * k + 'px'; cv.width = Math.round(FW * k * dpr); cv.height = Math.round((FH + HUD) * k * dpr);
    ctx.setTransform(k * dpr, 0, 0, k * dpr, 0, 0);
  }
  addEventListener('resize', fit); fit();
  const rect = (x, y, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); };
  const text = (t, x, y, size, c, al) => { ctx.fillStyle = c; ctx.font = `700 ${size}px B612, system-ui, sans-serif`; ctx.textAlign = al || 'left'; ctx.fillText(t, x, y); };

  function drawRoads(L) {
    rect(0, 0, FW, FH, C.pave);
    ctx.strokeStyle = C.paveLine; ctx.lineWidth = 1;
    for (let x = 0; x < FW; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, FH); ctx.stroke(); }
    for (let y = 0; y < FH; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(FW, y); ctx.stroke(); }
    for (const r of L.roads) {
      if (r.axis === 'x') rect(0, r.at - r.half, FW, 2 * r.half, C.road); else rect(r.at - r.half, 0, 2 * r.half, FH, C.road);
    }
    ctx.strokeStyle = C.kerb; ctx.lineWidth = 3;
    for (const r of L.roads) for (const sgn of [-1, 1]) {
      ctx.beginPath();
      if (r.axis === 'x') { ctx.moveTo(0, r.at + sgn * r.half); ctx.lineTo(FW, r.at + sgn * r.half); } else { ctx.moveTo(r.at + sgn * r.half, 0); ctx.lineTo(r.at + sgn * r.half, FH); }
      ctx.stroke();
    }
    const A = L.roads[0], B = L.roads[1];
    rect(B.at - B.half, A.at - A.half, 2 * B.half, 2 * A.half, C.road); // the junction box over the kerbs
    ctx.strokeStyle = C.lane; ctx.lineWidth = 2; ctx.setLineDash([14, 12]);
    ctx.beginPath(); ctx.moveTo(0, A.at); ctx.lineTo(B.at - B.half, A.at); ctx.moveTo(B.at + B.half, A.at); ctx.lineTo(FW, A.at);
    ctx.moveTo(B.at, 0); ctx.lineTo(B.at, A.at - A.half); ctx.moveTo(B.at, A.at + A.half); ctx.lineTo(B.at, FH); ctx.stroke(); ctx.setLineDash([]);
    const arrow = (x, y, ang) => { ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = C.lane; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-6, -7); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fill(); ctx.restore(); };
    for (const x of [90, 700]) for (const off of [-A.half / 2, A.half / 2]) arrow(x, A.at + off, 0);
    for (const y of [70, 580]) for (const off of [-B.half / 2, B.half / 2]) arrow(B.at + off, y, Math.PI / 2);
    for (const z of L.crossings) for (let k = -A.half + 4; k < A.half - 4; k += 14) rect(z.x - 14, A.at + k, 28, 8, C.zebra);
  }
  function drawStatics(L) {
    for (const st of L.statics) {
      if (st.kind === 'jersey') { rect(st.x, st.y, st.w, st.h, C.jersey); continue; }
      if (st.kind === 'planter') { // a row of concrete boxes, hedge on top (world.gardenPlanter each)
        rect(st.x, st.y, st.w, st.h, '#6b7280'); const pw = s.P['world.gardenPlanter'] || 40, along = st.w >= st.h;
        for (let o = 0; o < (along ? st.w : st.h); o += pw) { const x = along ? st.x + o : st.x, y = along ? st.y : st.y + o, w = along ? Math.min(pw, st.w - o) : st.w, h = along ? st.h : Math.min(pw, st.h - o); rect(x + 2, y + 2, w - 4, h - 4, '#3f6b3a'); rect(x + 4, y + 4, w - 8, Math.max(2, (h - 8) / 2), '#5b8f4e'); }
        continue;
      }
      if (st.plinth) { rect(st.x, st.y, st.w, st.h, C.plinth); rect(st.x + 6, st.y + 6, st.w - 12, st.h - 12, C.plinthTop); text('MONUMENT', st.x + st.w / 2, st.y + st.h / 2 + 4, 10, C.joint, 'center'); continue; }
      rect(st.x, st.y, st.w, st.h, C.block); ctx.strokeStyle = C.blockEdge; ctx.lineWidth = 2; ctx.strokeRect(st.x + 1, st.y + 1, st.w - 2, st.h - 2);
    }
    for (const cn of s.cones) if (cn.state === 'free' || cn.state === 'flight') drawCone(cn.x, cn.y);
  }
  // ---------- 10.7: crash detritus. A chalk outline where the dummy was struck (the NYC pavement's), the debris round the
  // point of impact, a numbered evidence marker. It stays on the road. Cosmetic variety comes from the crash's number.
  const hash = (n, k) => { const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); };
  function chalkFigure(x, y, ang, pose, col, k) { // a dummy's outline, lying where it fell
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(k || 1, k || 1);
    ctx.strokeStyle = col; ctx.lineWidth = 1.6 / (k || 1); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    const sp = [[[-15, -16], [15, -4], [-9, 22], [11, 21]], [[-16, -2], [13, -18], [-12, 20], [8, 23]], [[-14, -14], [16, -12], [-4, 24], [13, 17]]][pose % 3]; // hands, then feet
    ctx.beginPath(); ctx.arc(0, -20, 6, 0, TAU); ctx.stroke(); // head
    ctx.beginPath(); ctx.moveTo(-5, -13); ctx.lineTo(sp[0][0], sp[0][1]); ctx.moveTo(5, -13); ctx.lineTo(sp[1][0], sp[1][1]); // arms
    ctx.moveTo(-5, -13); ctx.lineTo(-6, 6); ctx.lineTo(sp[2][0], sp[2][1]); ctx.moveTo(5, -13); ctx.lineTo(6, 6); ctx.lineTo(sp[3][0], sp[3][1]); ctx.moveTo(-6, 6); ctx.lineTo(6, 6); // torso, legs
    ctx.stroke(); ctx.restore();
  }
  function ghostFigure(x, y, col, k) { // the dummy as the car last saw it: an outline, dashed
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); const r = s.P['body.radius'] * (k || 1);
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(x, y - r - 5 * (k || 1), 4 * (k || 1), 0, TAU); ctx.stroke(); ctx.restore();
  }
  function drawGhosts() { // rung 7: each car's ghost, the ring it searches, and the time it has left
    const R = s.P['duel.searchRadius'] || 0, T = s.P['duel.searchSeconds'] || 0;
    for (const c of s.onRoad()) {
      const g = c.lkp; if (!g) continue;
      const left = Math.max(0, 1 - (s.t - g.had) / (T || 1)), col = C.search, near = s.searched && s.searched(); // the ring brightens while the dummy is inside it
      ghostFigure(g.x, g.y, col, 1);
      ctx.strokeStyle = near ? C.search : C.searchDim; ctx.lineWidth = near ? 2 : 1.5; ctx.setLineDash(near ? [] : [6, 5]); ctx.beginPath(); ctx.arc(g.x, g.y, R, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(g.x, g.y, R + 5, -Math.PI / 2, -Math.PI / 2 + TAU * left); ctx.stroke(); // the time it has left
      ctx.font = '700 9px B612, system-ui, sans-serif'; const t = 'LAST SEEN', w = ctx.measureText(t).width + 8;
      rect(g.x - w / 2, g.y - R - 20, w, 13, 'rgba(12,14,20,0.75)'); text(t, g.x, g.y - R - 10, 9, col, 'center');
      ctx.strokeStyle = C.searchDim; ctx.lineWidth = 1; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(g.x, g.y); ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function drawCrashes(tMax) { // tMax: only crashes before then (the training clip)
    const mem = s.memory ? s.memory() : [], R = s.P['duel.memoryRadius'] || 0, checked = new Set();
    for (const c of s.onRoad()) for (const m of c.checks || []) checked.add(m.n);
    for (const cr of s.crashes || []) {
      if (tMax != null && cr.t > tMax + 1e-6) continue;
      const kept = mem.includes(cr), faded = s.rung >= 6 && !kept, n = cr.n, cx = cr.px != null ? cr.px : cr.x, cy = cr.py != null ? cr.py : cr.y;
      ctx.globalAlpha = faded ? 0.5 : 1;
      for (let k = 0; k < (cr.writeoff ? 14 : 8); k++) { // debris: dummy plastic and glass, about the point of impact
        const a = hash(n, k) * TAU, d = 4 + hash(n, k + 20) * (cr.writeoff ? 26 : 18), w = 2 + hash(n, k + 40) * 3;
        ctx.save(); ctx.translate(cx + Math.cos(a) * d, cy + Math.sin(a) * d); ctx.rotate(hash(n, k + 60) * TAU); rect(-w / 2, -1, w, 2, k % 3 === 0 ? C.glassBit : k % 3 === 1 ? C.dummy : '#c9ced6'); ctx.restore();
      }
      chalkFigure(cr.x, cr.y, cr.h + Math.PI / 2 + (hash(n, 7) - 0.5) * 1.2, n, faded ? C.chalkDim : C.chalk, 0.9);
      const tx = cr.x + 16, ty = cr.y - 18; // the evidence marker: a yellow tent, its number
      ctx.fillStyle = C.tent; ctx.beginPath(); ctx.moveTo(tx - 7, ty + 6); ctx.lineTo(tx, ty - 7); ctx.lineTo(tx + 7, ty + 6); ctx.closePath(); ctx.fill();
      text(String(n), tx, ty + 5, 8, C.joint, 'center');
      ctx.globalAlpha = 1;
      if (!kept) continue;
      const hot = checked.has(n), pulse = hot ? 0.8 + 0.2 * Math.sin(s.t * 10) : 1; // rung 6 remembers it: the spot it was sprung from, ringed
      ctx.strokeStyle = hot ? C.mem : C.memDim; ctx.lineWidth = hot ? 2.5 : 1.5; ctx.setLineDash(hot ? [] : [6, 5]); ctx.globalAlpha = pulse;
      ctx.beginPath(); ctx.arc(cr.ox, cr.oy, R, 0, TAU); ctx.stroke();
      ctx.setLineDash([2, 4]); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(cr.ox, cr.oy); ctx.lineTo(cr.x, cr.y); ctx.stroke(); ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(cr.ox - 5, cr.oy - 5); ctx.lineTo(cr.ox + 5, cr.oy + 5); ctx.moveTo(cr.ox + 5, cr.oy - 5); ctx.lineTo(cr.ox - 5, cr.oy + 5); ctx.stroke();
      text('#' + n, cr.ox, cr.oy - R - 4, 9, C.mem, 'center'); ctx.globalAlpha = 1;
    }
  }
  function drawCone(x, y) { ctx.fillStyle = C.cone; ctx.beginPath(); ctx.arc(x, y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = C.zebra; ctx.fillRect(x - 4, y - 1, 8, 2); }
  function drawCameras() { // rung 4: the junction's street cameras. A link draws from a camera to the dummy behind cover, and on to the car
    const L = s.level; if (s.rung < 4 || !L.cameras) return;
    const b = s.body, cars = s.onRoad().filter((c) => c.red), seen = cars.filter((c) => c.hidden && (c.noticed || (c.hz && c.hz.inPath))), R = s.P['perception.streetCameraRange'] || 0;
    const F = s.P['perception.streetCameraFov'] || 360, cone = F < 360; // row 723: a cone of perception.streetCameraFov along its aim
    if (R > 0) { ctx.strokeStyle = C.camDim; ctx.lineWidth = 1; ctx.setLineDash([2, 6]);
      const A = s.P['perception.streetCameraPanArc'] || 0; // row 724: the cone pans; a faint arc marks its whole sweep
      for (const cam of L.cameras) { const [x, y, base] = cam, aim = cone && base != null && s.cameraAim ? s.cameraAim(cam) : base; ctx.beginPath();
        if (cone && aim != null) { const a0 = (aim - F / 2) * Math.PI / 180, a1 = (aim + F / 2) * Math.PI / 180; ctx.moveTo(x, y); ctx.arc(x, y, R, a0, a1); ctx.closePath(); ctx.fillStyle = C.camCone; ctx.fill(); }
        else ctx.arc(x, y, R, 0, TAU);
        ctx.stroke();
        if (cone && A > 0 && base != null) { ctx.save(); ctx.strokeStyle = C.camDim; ctx.globalAlpha = 0.5; ctx.setLineDash([1, 5]); ctx.beginPath(); ctx.arc(x, y, R + 4, (base - A / 2 - F / 2) * Math.PI / 180, (base + A / 2 + F / 2) * Math.PI / 180); ctx.stroke(); ctx.restore(); } }
      ctx.setLineDash([]); } // what each camera watches
    for (const cam of L.cameras) { const [x, y] = cam, aim = cone && cam[2] != null && s.cameraAim ? s.cameraAim(cam) : cam[2]; rect(x - 1.5, y - 14, 3, 14, C.joint); rect(x - 5, y - 19, 10, 6, C.joint); ctx.fillStyle = seen.length ? C.cam : C.camDim;
      const ax = cone && aim != null ? Math.cos(aim * Math.PI / 180) * 4 : 3, ay = cone && aim != null ? Math.sin(aim * Math.PI / 180) * 2 : 0; // the lens looks along its aim
      ctx.beginPath(); ctx.arc(x + ax, y - 16 + ay, 2, 0, TAU); ctx.fill(); }
    if (!seen.length || !b || !b.alive) return;
    if (s.expected && s.expected() && !(s.seeingCamera && s.seeingCamera())) return; // rung 6 expects it there: its memory, not a camera (drawCrashes, drawCar)
    const cam = (s.seeingCamera && s.seeingCamera()) || L.cameras.slice().sort((p, q) => Math.hypot(p[0] - b.x, p[1] - b.y) - Math.hypot(q[0] - b.x, q[1] - b.y))[0];
    ctx.strokeStyle = C.cam; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
    for (const c of seen) { ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(cam[0], cam[1] - 16); ctx.lineTo(c.x, c.y); ctx.stroke(); }
    ctx.setLineDash([]); ctx.strokeRect(b.x - 16, b.y - 16, 32, 32);
  }
  function drawZones(c) { // the zones that act (D103): the driver's field, then the forward beam, both from the nose
    const P = s.P, br = P['body.radius'], ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2;
    ctx.save(); ctx.translate(nx, ny); ctx.rotate(c.h);
    const half = c.W / 2 + br + s.fieldFor(), near = !!c.noticed; // the field acts from rung 2 (D103: draw what acts)
    rect(-c.L - br, -half, c.fwdLen + c.L + 2 * br, 2 * half, near ? C.fieldHot : C.field);
    rect(0, -(c.W / 2 + br), c.fwdLen, c.W + 2 * br, (c.hz && c.hz.inPath) || (c.det && c.det.fwd) ? C.beamHot : C.beam);
    ctx.restore();
  }
  function carShape(c, rung) { // in the car's frame: body, stripe, glass, the roof dome (D89); from rung 1 the camera pod
    rect(-c.L / 2, -c.W / 2, c.L, c.W, c.red ? C.red : '#e8edf2');
    rect(-c.L / 2 + 2, -c.W / 2 + 2, 4, c.W - 4, C.redDark);
    rect(c.L / 2 - 16, -c.W / 2 + 3, 8, c.W - 6, C.glass);
    ctx.fillStyle = '#f4f8fa'; ctx.beginPath(); ctx.arc(-2, 0, 5, 0, TAU); ctx.fill();
    if (rung >= 1) { rect(c.L / 2 - 20, -3, 6, 6, C.joint); ctx.fillStyle = C.cam; ctx.beginPath(); ctx.arc(c.L / 2 - 15, 0, 1.6, 0, TAU); ctx.fill(); }
    if (rung >= 3) { // the roof lidar: a puck on the roof, its sweep turning
      ctx.fillStyle = C.joint; ctx.beginPath(); ctx.arc(-2, 0, 8, 0, TAU); ctx.fill();
      ctx.fillStyle = '#f4f8fa'; ctx.beginPath(); ctx.arc(-2, 0, 3.5, 0, TAU); ctx.fill(); // the learning car's dome (D89), on the puck
      const a = (s ? s.t : 0) * 6; ctx.strokeStyle = C.cam; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-2 + Math.cos(a) * 3.5, Math.sin(a) * 3.5); ctx.lineTo(-2 + Math.cos(a) * 8, Math.sin(a) * 8); ctx.stroke();
    }
    if (rung >= 2) for (const sg of [-1, 1]) { rect(-5, sg * c.W / 2 - 3, 8, 6, C.joint); ctx.fillStyle = C.cam; ctx.beginPath(); ctx.arc(-1, sg * (c.W / 2 + 1), 1.6, 0, TAU); ctx.fill(); }
    if (rung >= 4) { ctx.strokeStyle = C.joint; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-c.L / 2 + 8, 0); ctx.lineTo(-c.L / 2 + 8, -c.W / 2 - 5); ctx.stroke(); ctx.fillStyle = C.cam; ctx.beginPath(); ctx.arc(-c.L / 2 + 8, -c.W / 2 - 6, 2, 0, TAU); ctx.fill(); } // rung 4: the link's aerial
    if (rung >= 6) { // rung 6: the memory module, one red light a remembered spot
      const n = c.mem != null ? c.mem : 3; rect(-c.L / 2 + 11, -7, 7, 14, C.joint);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = i < n ? C.mem : '#3a2a2a'; ctx.beginPath(); ctx.arc(-c.L / 2 + 14.5, -4 + i * 4, 1.4, 0, TAU); ctx.fill(); }
    }
    if (rung >= 7) { // rung 7: the search beacon, amber, turning while it searches
      const on = c.lkp ? Math.floor((s ? s.t : 0) * 6) % 2 === 0 : false; rect(6, -4, 6, 8, C.joint);
      ctx.fillStyle = on || c.fit ? C.search : C.searchDim; ctx.beginPath(); ctx.arc(9, 0, 2.4, 0, TAU); ctx.fill();
    }
  }
  function drawCar(c) {
    const pv = prevV.get(c.id), braking = pv != null && c.v < pv - 0.05; prevV.set(c.id, c.v);
    if (c.red && (c.rung || 0) >= 6) { c.mem = s.memory().length; for (const m of c.checks || []) { // its scan of the spots it remembers, in its field
      ctx.strokeStyle = C.mem; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(m.ox, m.oy); ctx.stroke(); ctx.setLineDash([]); } }
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.h);
    carShape(c, c.rung || 0);
    const noticed = c.state === 'caution' || c.state === 'intention' || c.cause === 'body', on = !noticed || Math.floor(s.t * (F['proto.art.noticeFlashHz'] || 4) * 2) % 2 === 0;
    if (on) { rect(c.L / 2 - 3, -c.W / 2 + 2, 3, 5, '#fffbe0'); rect(c.L / 2 - 3, c.W / 2 - 7, 3, 5, '#fffbe0'); }
    if (braking || c.v < 2) { rect(-c.L / 2, -c.W / 2 + 2, 3, 5, '#ff2020'); rect(-c.L / 2, c.W / 2 - 7, 3, 5, '#ff2020'); }
    ctx.restore();
    const tag = c.model + ' · R' + (c.rung || 0) + ((c.rung || 0) >= 6 && c.red ? ' · MEMORY ' + (c.mem || 0) : '') + (c.lkp ? ' · ' + (c.lkp.found ? 'FOUND' : 'SEARCHING') : c.state !== 'cruise' ? ' · ' + c.state.toUpperCase() : '');
    text(tag, c.x, c.y - 26, 10, C.text, 'center'); const tw = ctx.measureText(tag).width; // the notice meter sits past the tag's end
    if (c.checks && c.checks.length) text('CHECKING ' + c.checks.map((m) => '#' + m.n).join(' '), c.x, c.y - 38, 10, C.mem, 'center'); // rung 6: the spots it is watching
    const nT = s.P['perception.sideNoticeSeconds']; // rung 2's notice: a meter fills while the dummy is in its field, unnoticed
    if (c.fieldT > 0 && nT > 0) { const u = Math.min(1, c.fieldT / nT); ctx.strokeStyle = u >= 1 ? C.dummy : C.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x + Math.max(30, tw / 2 + 12), c.y - 30, 6, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke(); }
    if (c.honking || c.sideHonk) { rect(c.x - 24, c.y - 52, 48, 16, C.text); text('HONK', c.x, c.y - 40, 11, C.joint, 'center'); }
  }
  function drawDummy(b) {
    if (!b || !b.alive) return;
    const up = (b.z || 0) + (b.raised ? s.P['world.jumpableHeight'] : 0) + (b.lifted ? 40 : 0), lift = up * 0.4, k = 1 + up / 120; // height: the body rises off its shadow (lifted: in the drone's grip)
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(b.x + 3 + lift * 0.3, b.y + 4 + lift * 0.3, 13, 9, 0, 0, TAU); ctx.fill();
    const y = b.y - lift, r = s.P['body.radius'] * k * (b.duck ? 0.8 : 1);
    const live = b === s.body, unseen = live && b.duck && !s.onRoad().some((c) => c.red && c.hz); // DUCK: no sensor of the car has it
    ctx.globalAlpha = unseen ? 0.45 : 1;
    ctx.fillStyle = C.dummy; ctx.beginPath(); ctx.arc(b.x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.joint; ctx.lineWidth = 2; ctx.stroke();
    ctx.globalAlpha = 1;
    const expect = live && s.expected && s.expected(); // rung 6: at a spot it remembers, it expects the dummy
    const found = expect && !(s.nearSite && s.memory && s.nearSite(b.x, b.y, s.memory())) && s.searched && s.searched(); // rung 7: near the ghost, not at a remembered spot
    const Xs = s.P['duel.blockSeconds'] || 0, hs = s.P['proto.honkSeconds'] || 0; // the block lift's countdown, once the car has honked
    if (live && Xs > 0 && !s.lift && s.blockT >= Math.min(hs, Xs - 3)) { const n = Math.ceil(Xs - s.blockT - 1e-9); ctx.font = '700 10px B612, system-ui, sans-serif'; const t = 'MOVE ALONG · DRONE IN ' + n, w = ctx.measureText(t).width + 8; rect(b.x - w / 2, y - r - 36, w, 13, 'rgba(12,14,20,0.75)'); text(t, b.x, y - r - 26, 10, C.dummy, 'center'); }
    const label = (t, col) => { ctx.font = '700 9px B612, system-ui, sans-serif'; const w = ctx.measureText(t).width + 8; rect(b.x - w / 2, y - r - 20, w, 13, 'rgba(12,14,20,0.75)'); text(t, b.x, y - r - 10, 9, col, 'center'); };
    if (b.duck) { ctx.strokeStyle = unseen ? C.dim : C.dummy; ctx.lineWidth = 1.5; ctx.setLineDash(unseen ? [3, 4] : []); ctx.beginPath(); ctx.arc(b.x, y, r + 6, 0, TAU); ctx.stroke(); ctx.setLineDash([]); if (live) label(expect ? (found ? 'FOUND' : 'EXPECTED') : unseen ? 'HIDDEN' : 'SEEN', expect ? (found ? C.search : C.mem) : unseen ? C.dim : C.dummy); }
    else if (expect) label(found ? 'FOUND' : 'EXPECTED', found ? C.search : C.mem);
    const f = b.facing != null ? b.facing : b.f;
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + Math.cos(f) * 20 * k, y + Math.sin(f) * 20 * k); ctx.stroke();
    if (s.dashFitted() && b === s.body) { rect(b.x - 4, y - 4, 8, 8, C.joint); rect(b.x - 2, y - 2, 4, 4, C.part); } // Battery 1 on the chest
    if (b === s.body && s.has('jump')) for (const sg of [-1, 1]) rect(b.x + sg * 7 - 2, y + 8, 4, 5, C.part); // Legs 1
    if (b === s.body && s.has('carry')) for (const sg of [-1, 1]) rect(b.x + sg * 11 - 2, y - 2, 4, 4, C.part); // Hands 1
    if (b === s.body && s.has('duck1')) rect(b.x - 2, y + 4, 4, 3, C.part); // DUCK
    if (b === s.body && b.held) drawCone(b.x + Math.cos(f) * 12 * k, y + Math.sin(f) * 12 * k); // the cone it carries
  }
  function drawOffscreen(c) { // a car off screen: a marker at the edge, so a car that waits out of sight still reads
    const m = 14, x = Math.max(m, Math.min(FW - m, c.x)), y = Math.max(m, Math.min(FH - m, c.y));
    if (x === c.x && y === c.y) return;
    const ang = Math.atan2(c.y - y, c.x - x); ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -8); ctx.lineTo(-6, 8); ctx.closePath(); ctx.fill(); ctx.restore();
    const lab = c.honking || c.sideHonk ? 'HONK' : c.v < 1 ? 'WAITING' : ''; if (lab) text(lab, Math.max(40, Math.min(FW - 40, x)), y + (y > FH / 2 ? -14 : 24), 10, C.text, 'center');
  }
  function drawDrone(x, y, load) { // a FARSIGHT drone: body, four rotors, and the part it carries
    for (const [dx, dy] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) { ctx.fillStyle = C.rotor; ctx.beginPath(); ctx.arc(x + dx, y + dy, 6, 0, TAU); ctx.fill(); }
    rect(x - 7, y - 5, 14, 10, C.drone);
    if (load) { rect(x - 5, y + 7, 10, 8, C.part); text(load === true ? 'B1' : load, x, y + 14, 7, C.joint, 'center'); }
  }
  function drawHud() {
    rect(0, FH, FW, HUD, C.hud);
    const b = s.body, hp = b ? Math.max(0, b.health) / s.maxHealth() : 0, ri = s.rungInfo();
    text(ST.id + ' · ' + ST.title, 14, FH + 22, 14, C.text);
    text((s.models.sedan.id) + ' · RUNG ' + s.rung + ' · ' + (ri ? ri.name.toUpperCase() : ''), 14, FH + 42, 11, C.dim);
    const bx = 340; // the body bar sits left of the key hints, which grow with each part
    text('BODY', bx - 40, FH + 22, 11, C.dim); rect(bx, FH + 12, 120, 12, '#2c3447'); rect(bx, FH + 12, 120 * hp, 12, C.dummy);
    text('WRITE-OFFS ' + s.run.writeOffs, bx, FH + 42, 11, C.text);
    text(s.dashFitted() ? 'SPACE DASH' + (s.has('jump') ? ' · K JUMP' : '') + (s.has('carry') ? ' · E CONE' : '') + (s.has('duck1') ? ' · C DUCK' : '') : 'ON FOOT', 786, FH + 22, 11, C.dim, 'right');
    text(Math.floor(s.t / 60) + ':' + String(Math.floor(s.t % 60)).padStart(2, '0'), 786, FH + 42, 11, C.text, 'right');
  }
  // ---------- the lesson. Beat 1: the hit, replayed as the car's training clip. Beat 2: the sensor fitted.
  function drawClip(t) {
    const fr = clip.frames, t0 = clip.hitT - CLIP, tt = t0 + Math.min(t, CLIP); // then the hit's frame holds
    let f = fr[0]; for (const q of fr) { if (q.t <= tt) f = q; else break; }
    drawRoads(s.level); drawStatics(s.level); drawCrashes(tt);
    rect(0, 0, FW, FH, 'rgba(8,24,18,0.55)'); // the camera's tint
    if (f) {
      for (const c of f.cars) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.h); carShape(c, c.rung || 0); ctx.restore(); }
      drawDummy(f.b);
      if (f.b && t >= CLIP) { // the frame of the hit, held: a detection box, as the car's vision would draw it
        ctx.strokeStyle = C.cam; ctx.lineWidth = 2; ctx.strokeRect(f.b.x - 22, f.b.y - 22, 44, 44);
        text('IMPACT · ' + (ZONES[clip.zone] || clip.zone.toUpperCase()), Math.max(90, Math.min(FW - 90, f.b.x)), f.b.y - 28, 11, C.cam, 'center'); // kept on screen
        if (clip.info && clip.info.habit && clip.origin) { // rung 6's cause: the strike came from the spot of an earlier crash
          const o = clip.origin, R = s.P['duel.memoryRadius'] || 30, pr = clip.prev != null ? s.crashes[clip.prev - 1] : null;
          ctx.strokeStyle = C.mem; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(o.x, o.y, R, 0, TAU); ctx.stroke();
          if (pr) { ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(pr.x, pr.y); ctx.stroke(); ctx.setLineDash([]); }
          text('SAME SPOT' + (pr ? ' AS CRASH ' + pr.n : ''), o.x, o.y - R - 6, 12, C.mem, 'center');
        }
        if (clip.info && clip.info.search && clip.seenAt) { // rung 7's cause: it had the dummy, lost it behind cover, and was struck from there
          const g = clip.seenAt; ghostFigure(g.x, g.y, C.search, 1.2);
          ctx.strokeStyle = C.search; ctx.lineWidth = 1.5; ctx.setLineDash([3, 4]); ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(f.b.x, f.b.y); ctx.stroke(); ctx.setLineDash([]);
          text('LAST SEEN · ' + g.ago.toFixed(1) + ' s BEFORE', g.x, g.y - 30, 12, C.search, 'center');
        }
      }
    }
    for (let y = 0; y < FH; y += 4) rect(0, y, FW, 1, 'rgba(0,0,0,0.18)'); // scan lines
    text('TRAINING CLIP · ' + clip.model, 18, 30, 15, C.cam);
    if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = C.red; ctx.beginPath(); ctx.arc(FW - 60, 25, 6, 0, TAU); ctx.fill(); }
    text('REC', FW - 18, 30, 13, C.cam, 'right');
    const dtHit = tt - clip.hitT; text((dtHit < 0 ? '−' : '+') + Math.abs(dtHit).toFixed(1) + ' s', 18, FH - 18, 13, C.camDim);
  }
  function drawFit(t) { // the car, large; a drone lowers the sensor onto its nose; the new zone draws out from it
    const info = clip ? clip.info : s.rungInfo(s.rung + 1), u = Math.min(1, t / FIT);
    rect(0, 0, FW, FH, '#0c0e14');
    const k = 4, car = { L: s.P['vehicles.sedan.length'], W: s.P['vehicles.sedan.width'], red: true }, cx = 300, cy = 330;
    const reach = Math.max(0, (u - 0.45) / 0.55), to = info ? info.rung : 1, from = to - 1;
    if (from >= 1 || (to === 1 && reach > 0)) { ctx.save(); ctx.translate(cx + car.L / 2 * k, cy); rect(0, -(car.W / 2 + 4) * k, (to === 1 ? reach : 1) * (FW - cx - car.L / 2 * k), (car.W + 8) * k, C.beam); ctx.restore(); }
    if (from >= 2 || (to === 2 && reach > 0)) for (const sg of [-1, 1]) { const h = (to === 2 ? reach : 1) * 150; rect(cx - car.L / 2 * k, sg > 0 ? cy + (car.W / 2 + 4) * k : cy - (car.W / 2 + 4) * k - h, FW - cx + car.L / 2 * k, h, C.field); }
    if (to === 5 && reach > 0) { // road items: a cone ahead, and the stop line short of it
      const x = cx + car.L / 2 * k + 120; ctx.globalAlpha = reach;
      ctx.save(); ctx.translate(x + 60, cy); ctx.scale(3, 3); drawCone(0, 0); ctx.restore();
      rect(x, cy - (car.W / 2 + 6) * k, 6, (car.W + 12) * k, C.red); text('STOPS · NEVER SWERVES', x + 30, cy + (car.W / 2 + 14) * k, 13, C.text, 'center'); ctx.globalAlpha = 1;
    }
    if (to === 7 && reach > 0) { // the search: a ghost ahead, the stop line short of it, its ring
      const gx = cx + car.L / 2 * k + 300, gy = cy + 70; ctx.globalAlpha = Math.min(1, reach * 1.5);
      rect(gx - 230, cy - (car.W / 2 + 6) * k, 6, (car.W + 12) * k, C.search);
      ghostFigure(gx, gy, C.search, 3); ctx.strokeStyle = C.searchDim; ctx.setLineDash([8, 6]); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(gx, gy, (s.P['duel.searchRadius'] || 60) * 1.6, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      text('LAST SEEN', gx, gy - 120, 14, C.search, 'center');
      text('STOPS SHORT OF THE GHOST · FINDS YOU NEAR IT · GIVES UP AFTER ' + (s.P['duel.searchSeconds'] || 0) + ' s', 400, cy + (car.W / 2 + 40) * k + 40, 13, C.text, 'center'); ctx.globalAlpha = 1;
    }
    if (to === 6 && reach > 0) { // crash memory: the road's outlines, and a ring on each spot it now remembers
      const k2 = 0.34, mx = 452, my = 210, R = (s.P['duel.memoryRadius'] || 30) * k2, N = Math.round(s.P['duel.memorySites'] || 0), all = s.crashes || [], mem = N > 0 ? all.slice(-N) : all; // what it will remember
      ctx.save(); ctx.globalAlpha = Math.min(1, reach * 2); ctx.translate(mx, my); ctx.scale(k2, k2); drawRoads(s.level); drawStatics(s.level); ctx.restore();
      ctx.strokeStyle = C.kerb; ctx.lineWidth = 1; ctx.strokeRect(mx, my, FW * k2, FH * k2);
      const crs = s.crashes || [];
      crs.forEach((cr, i) => { chalkFigure(mx + cr.x * k2, my + cr.y * k2, cr.h + Math.PI / 2, cr.n, C.chalk, 0.4); if (mem.includes(cr) && reach > (i + 1) / (crs.length + 1)) { ctx.strokeStyle = C.mem; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(mx + cr.ox * k2, my + cr.oy * k2, Math.max(6, R), 0, TAU); ctx.stroke(); } });
      ctx.globalAlpha = 1; text('REMEMBERS WHERE YOU STRUCK FROM · THE LATEST ' + (s.P['duel.memorySites'] || 'ALL'), mx + FW * k2 / 2, my + FH * k2 + 22, 12, C.text, 'center');
    }
    if (to === 4 && reach > 0) { // the street cameras: three posts round the junction link to the car
      ctx.strokeStyle = C.cam; ctx.lineWidth = 2; ctx.setLineDash([6, 6]); ctx.globalAlpha = reach;
      for (const [x, y] of [[620, 170], [690, 330], [620, 490]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(cx - car.L / 2 * k + 8 * k, cy - (car.W / 2 + 6) * k); ctx.stroke(); rect(x - 3, y, 6, 30, C.joint); rect(x - 10, y - 10, 20, 12, C.joint); ctx.fillStyle = C.cam; ctx.beginPath(); ctx.arc(x + 6, y - 4, 3, 0, TAU); ctx.fill(); }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    if (to === 3 && reach > 0) { ctx.strokeStyle = C.cam; ctx.lineWidth = 2; for (let i = 1; i <= 3; i++) { ctx.globalAlpha = Math.max(0, 1 - i / 3.5) * reach; ctx.beginPath(); ctx.arc(cx - 2 * k, cy, reach * 60 * i, 0, TAU); ctx.stroke(); } ctx.globalAlpha = 1; } // the lidar's sweep
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); carShape(car, u >= 0.45 ? to : from); ctx.restore();
    const px = to === 7 ? cx + 9 * k : to === 6 ? cx + (-car.L / 2 + 14) * k : to === 4 ? cx + (-car.L / 2 + 8) * k : to >= 2 ? cx - (to === 3 ? 2 : 1) * k : cx + (car.L / 2 - 17) * k; // where the new sensor goes: the nose (1), the flanks (2), the roof (3), the link's aerial (4), the memory module (6)
    if (u < 0.45) drawDrone(px, cy - 160 + 160 * (u / 0.45), to === 7 ? 'S7' : to === 6 ? 'M6' : to === 5 ? 'U5' : to === 4 ? 'C4' : to === 3 ? 'L3' : to === 2 ? 'S2' : true);
    else if (u < 0.7) drawDrone(px, cy - 160 * ((u - 0.45) / 0.25), false);
    text((info && info.fit ? info.fit : 'SENSOR') + ' FITTED · ' + (info && info.sensor ? info.sensor : ''), 40, 90, 22, C.text);
    text((clip ? clip.model : s.models.sedan.id) + ' · RUNG ' + (info ? info.rung : ''), 40, 120, 14, C.dim);
  }
  function draw() {
    if (s.phase === 'lesson' && lessonT != null) {
      if (clip && lessonT < CLIP + HOLD) drawClip(lessonT); else drawFit(lessonT - (clip ? CLIP + HOLD : 0));
      drawHud(); return;
    }
    const L = s.level; drawRoads(L); drawStatics(L); drawCrashes(); drawGhosts();
    const cars = s.cars.filter((c) => !c.ghost);
    if (showZones) for (const c of cars) drawZones(c);
    for (const c of cars) drawCar(c);
    drawCameras();
    drawDummy(s.body);
    for (const c of s.onRoad()) if (c.red) drawOffscreen(c);
    for (const dr of s.drones) { const cn = s.cones.find((q) => q.id === dr.cone); if (cn && cn.state === 'drone') drawCone(dr.x, dr.y + 12); drawDrone(dr.x, dr.y, false); } // FARSIGHT fetches a cone left in a lane (proto.droneConeSeconds)
    const d = s.delivery; if (d) drawDrone(d.x, d.y, d.state !== 'outbound' && (LOAD[d.node] || 'B1'));
    const lf = s.lift; if (lf) { const held = s.body && s.body.lifted; drawDrone(lf.x, lf.y - (held ? 30 : 0), false); if (held) { ctx.strokeStyle = C.joint; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(lf.x, lf.y - 24); ctx.lineTo(lf.x, lf.y - 16); ctx.stroke(); } } // FARSIGHT's block lift
    for (let i = flash.length - 1; i >= 0; i--) { const f = flash[i]; f.t -= 1 / 60; if (f.t <= 0) { flash.splice(i, 1); continue; } const big = typeof f.n !== 'number'; text(big ? f.n : '−' + f.n, f.x, f.y - 24 - (1 - f.t) * 20, big ? 16 : 13, f.n === 'WRITE-OFF' ? C.red : C.dummy, 'center'); }
    drawHud();
    if (!started || paused) {
      rect(0, 0, FW, FH, 'rgba(10,12,18,0.72)');
      text(paused ? 'PAUSED' : 'PROTOTYPE ' + ST.id + ' · ' + ST.title, FW / 2, 250, 24, C.text, 'center');
      text('Two one-way roads cross at the Monument. One red car drives through.' + ((s.P['duel.topRung'] || 0) >= 7 ? ' It looks where it last saw you.' : s.rung >= 5 && (s.P['duel.topRung'] || 0) >= 6 ? ' Every crash leaves its mark.' : ''), FW / 2, 292, 14, C.dim, 'center');
      text('Arrows or WASD move · Space dash · K jump, E cone, C duck, once fitted · Z zones · P pause · R restart · L save log', FW / 2, 330, 13, C.dim, 'center');
      text(paused ? 'P to resume' : 'Press any key', FW / 2, 380, 16, C.dummy, 'center');
    }
  }
  window.__p10 = { get sim() { return s; }, get clip() { return clip; }, get lessonT() { return lessonT; }, stage: ST, newSim, start() { started = true; } };
  requestAnimationFrame(frame);
})();
