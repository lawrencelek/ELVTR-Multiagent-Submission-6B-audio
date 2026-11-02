// Prototype 10 (GDD Edits 101–102): the test road, greybox. One screen: the Monument junction, one red sedan, the dummy.
// Placeholder art by design (Nintendo check, row 655: mechanic before art). It draws the zones that act on the car (D103):
// the forward beam and the driver's field. 10.2 adds the lesson (handover v2 §9.1): the hit replayed as the car's training
// clip, the sensor fitted, the car's return. No goal text.
// 10.3 adds rung 2's field, its notice meter, the jump and the plinth's raised edge.
// Keys: arrows or WASD move; Space or J dash, K or Shift jump (once fitted); Z zones; P pause; R restart; L saves this
// session's log (JSON). Touch: drag on the left half to move; tap the right half's lower part to dash, its upper part to jump.
(function () {
  'use strict';
  const X = window.DUMMIES, T = window.DUMMIES_P10, F = window.DUMMIES_SIM;
  const ST = window.DUMMIES_P10_STAGE || { id: '10.1', title: 'THE TEST ROAD' };
  const FW = 800, FH = 640, HUD = 56, TAU = Math.PI * 2;
  const C = { pave: '#3a3f4b', paveLine: '#454b59', road: '#1e222c', lane: '#c9d1d9', kerb: '#8c95a6', zebra: '#e8edf2',
    plinth: '#a89f8c', plinthTop: '#c2b9a5', block: '#262a35', blockEdge: '#5b6e9c', jersey: '#8494b8', cone: '#f2a65a',
    red: '#ff3d3d', redDark: '#9e1f1f', glass: '#1b2a38', dummy: '#ffd400', joint: '#2a2a2a', beam: 'rgba(244,248,250,0.10)',
    beamHot: 'rgba(255,61,61,0.22)', field: 'rgba(127,168,188,0.10)', fieldHot: 'rgba(255,212,0,0.14)', text: '#f4f8fa', dim: '#7fa8bc', hud: '#12151c',
    cam: '#9ff2c8', camDim: 'rgba(159,242,200,0.55)', drone: '#20242e', rotor: 'rgba(200,214,230,0.5)', part: '#ffd400' };
  const PARTS = { battery1: 'BATTERY 1 · DASH', legs1: 'LEGS 1 · JUMP' }, ZONES = { front: 'FRONT', frontDiagonal: 'FRONT CORNER', side: 'SIDE', rearDiagonal: 'REAR CORNER', rear: 'REAR' };
  const CLIP = F['duel.lessonClipSeconds'], HOLD = F['duel.lessonHoldSeconds'], FIT = F['duel.lessonFitSeconds']; // the clip, its last frame held, the fitting
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  let s, paused = false, started = false, showZones = true, log = [], session = {}, prevV = new Map(), flash = [];
  let ring = [], clip = null, lessonT = null; // the recording, the hit's clip, the lesson's clock
  const keys = new Set(); let aEdge = false, bEdge = false, touchMove = null, touchA = false, touchB = false;

  function newSim() {
    s = new T.TestRoadSim(Object.assign({}, F)); log = []; session = { start: Date.now(), build: 'P' + ST.id };
    prevV.clear(); flash = []; ring = []; clip = null; lessonT = null;
  }
  newSim();

  // ---------- input
  addEventListener('keydown', (e) => {
    if (!started) { started = true; e.preventDefault(); return; }
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'j') { if (!keys.has(k)) aEdge = true; }
    if (k === 'k' || k === 'shift') { if (!keys.has(k)) bEdge = true; }
    if (k === 'p' || k === 'escape') paused = !paused;
    if (k === 'r') newSim();
    if (k === 'z') showZones = !showZones;
    if (k === 'l') saveLog();
    keys.add(k); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  cv.addEventListener('touchstart', (e) => { started = true; for (const t of e.changedTouches) { const r = cv.getBoundingClientRect(); if (t.clientX - r.left < r.width / 2) touchMove = { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0 }; else if (t.clientY - r.top < r.height / 2) touchB = true; else touchA = true; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (touchMove && t.identifier === touchMove.id) { touchMove.dx = t.clientX - touchMove.x0; touchMove.dy = t.clientY - touchMove.y0; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (touchMove && t.identifier === touchMove.id) touchMove = null; }, { passive: false });
  function command() {
    let mx = 0, my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1; if (keys.has('arrowright') || keys.has('d')) mx += 1;
    if (keys.has('arrowup') || keys.has('w')) my -= 1; if (keys.has('arrowdown') || keys.has('s')) my += 1;
    let a = aEdge || touchA, bb = bEdge || touchB; aEdge = false; touchA = false; bEdge = false; touchB = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of pads) { if (!g) continue; if (Math.hypot(g.axes[0], g.axes[1]) > 0.2) { mx = g.axes[0]; my = g.axes[1]; } if (g.buttons[0] && g.buttons[0].pressed && !g._a) a = true; g._a = g.buttons[0] && g.buttons[0].pressed; if (g.buttons[1] && g.buttons[1].pressed && !g._b) bb = true; g._b = g.buttons[1] && g.buttons[1].pressed; }
    if (touchMove) { const d = Math.hypot(touchMove.dx, touchMove.dy); if (d > 8) { mx = touchMove.dx / Math.max(d, 60); my = touchMove.dy / Math.max(d, 60); } }
    const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; }
    return { mx, my, aPress: a, bPress: bb };
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
      if (['impact', 'writeoff', 'admit', 'lunge', 'honk', 'lesson-due', 'lesson', 'learned', 'first-brake', 'first-side', 'part-dispatch', 'gift', 'left', 'jump', 'raised', 'step-down'].includes(e.type) || (e.type === 'touch' && e.standstill)) log.push(e);
      if (e.type === 'impact' && Math.round(e.lost) > 0) flash.push({ x: s.body.x, y: s.body.y, t: 0.5, n: Math.round(e.lost) });
      if (e.type === 'writeoff') flash.push({ x: s.body.x, y: s.body.y, t: 1.2, n: 'WRITE-OFF' });
      if (e.type === 'gift') flash.push({ x: s.body.x, y: s.body.y, t: 1.6, n: PARTS[e.node] || e.node });
      if (e.type === 'lesson-due') clip = { frames: ring.slice(), hitT: e.t, model: e.model, zone: e.zone, to: e.to, info: T.RUNGS[e.to] };
    }
  }
  function record() { // the last CLIP seconds of the road, kept for a hit's training clip
    const f = { t: s.t, cars: s.cars.filter((c) => !c.ghost).map((c) => ({ x: c.x, y: c.y, h: c.h, L: c.L, W: c.W, red: c.red, rung: c.rung })), b: s.body ? { x: s.body.x, y: s.body.y, f: s.body.facing, alive: s.body.alive } : null };
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
      if (st.plinth) { rect(st.x, st.y, st.w, st.h, C.plinth); rect(st.x + 6, st.y + 6, st.w - 12, st.h - 12, C.plinthTop); text('MONUMENT', st.x + st.w / 2, st.y + st.h / 2 + 4, 10, C.joint, 'center'); continue; }
      rect(st.x, st.y, st.w, st.h, C.block); ctx.strokeStyle = C.blockEdge; ctx.lineWidth = 2; ctx.strokeRect(st.x + 1, st.y + 1, st.w - 2, st.h - 2);
    }
    for (const cn of s.cones) { ctx.fillStyle = C.cone; ctx.beginPath(); ctx.arc(cn.x, cn.y, 7, 0, TAU); ctx.fill(); ctx.fillStyle = C.zebra; ctx.fillRect(cn.x - 4, cn.y - 1, 8, 2); }
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
    if (rung >= 2) for (const sg of [-1, 1]) { rect(-5, sg * c.W / 2 - 3, 8, 6, C.joint); ctx.fillStyle = C.cam; ctx.beginPath(); ctx.arc(-1, sg * (c.W / 2 + 1), 1.6, 0, TAU); ctx.fill(); }
  }
  function drawCar(c) {
    const pv = prevV.get(c.id), braking = pv != null && c.v < pv - 0.05; prevV.set(c.id, c.v);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.h);
    carShape(c, c.rung || 0);
    const noticed = c.state === 'caution' || c.state === 'intention' || c.cause === 'body', on = !noticed || Math.floor(s.t * (F['proto.art.noticeFlashHz'] || 4) * 2) % 2 === 0;
    if (on) { rect(c.L / 2 - 3, -c.W / 2 + 2, 3, 5, '#fffbe0'); rect(c.L / 2 - 3, c.W / 2 - 7, 3, 5, '#fffbe0'); }
    if (braking || c.v < 2) { rect(-c.L / 2, -c.W / 2 + 2, 3, 5, '#ff2020'); rect(-c.L / 2, c.W / 2 - 7, 3, 5, '#ff2020'); }
    ctx.restore();
    text(c.model + ' · R' + (c.rung || 0) + (c.state !== 'cruise' ? ' · ' + c.state.toUpperCase() : ''), c.x, c.y - 26, 10, C.text, 'center');
    const nT = s.P['perception.sideNoticeSeconds']; // rung 2's notice: a meter fills while the dummy is in its field, unnoticed
    if (c.fieldT > 0 && nT > 0) { const u = Math.min(1, c.fieldT / nT); ctx.strokeStyle = u >= 1 ? C.dummy : C.text; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x + 30, c.y - 30, 6, -Math.PI / 2, -Math.PI / 2 + TAU * u); ctx.stroke(); }
    if (c.honking || c.sideHonk) { rect(c.x - 24, c.y - 52, 48, 16, C.text); text('HONK', c.x, c.y - 40, 11, C.joint, 'center'); }
  }
  function drawDummy(b) {
    if (!b || !b.alive) return;
    const up = (b.z || 0) + (b.raised ? s.P['world.jumpableHeight'] : 0), lift = up * 0.4, k = 1 + up / 120; // height: the body rises off its shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(b.x + 3 + lift * 0.3, b.y + 4 + lift * 0.3, 13, 9, 0, 0, TAU); ctx.fill();
    const y = b.y - lift, r = s.P['body.radius'] * k;
    ctx.fillStyle = C.dummy; ctx.beginPath(); ctx.arc(b.x, y, r, 0, TAU); ctx.fill();
    ctx.strokeStyle = C.joint; ctx.lineWidth = 2; ctx.stroke();
    const f = b.facing != null ? b.facing : b.f;
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + Math.cos(f) * 20 * k, y + Math.sin(f) * 20 * k); ctx.stroke();
    if (s.dashFitted() && b === s.body) { rect(b.x - 4, y - 4, 8, 8, C.joint); rect(b.x - 2, y - 2, 4, 4, C.part); } // Battery 1 on the chest
    if (b === s.body && s.has('jump')) for (const sg of [-1, 1]) rect(b.x + sg * 7 - 2, y + 8, 4, 5, C.part); // Legs 1
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
    text('BODY', 430, FH + 22, 11, C.dim); rect(470, FH + 12, 140, 12, '#2c3447'); rect(470, FH + 12, 140 * hp, 12, C.dummy);
    text('WRITE-OFFS ' + s.run.writeOffs, 470, FH + 42, 11, C.text);
    text(s.dashFitted() ? 'SPACE DASH' + (s.has('jump') ? ' · K JUMP' : '') : 'ON FOOT', 786, FH + 22, 11, C.dim, 'right');
    text(Math.floor(s.t / 60) + ':' + String(Math.floor(s.t % 60)).padStart(2, '0'), 786, FH + 42, 11, C.text, 'right');
  }
  // ---------- the lesson. Beat 1: the hit, replayed as the car's training clip. Beat 2: the sensor fitted.
  function drawClip(t) {
    const fr = clip.frames, t0 = clip.hitT - CLIP, tt = t0 + Math.min(t, CLIP); // then the hit's frame holds
    let f = fr[0]; for (const q of fr) { if (q.t <= tt) f = q; else break; }
    drawRoads(s.level); drawStatics(s.level);
    rect(0, 0, FW, FH, 'rgba(8,24,18,0.55)'); // the camera's tint
    if (f) {
      for (const c of f.cars) { ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.h); carShape(c, c.rung || 0); ctx.restore(); }
      drawDummy(f.b);
      if (f.b && t >= CLIP) { // the frame of the hit, held: a detection box, as the car's vision would draw it
        ctx.strokeStyle = C.cam; ctx.lineWidth = 2; ctx.strokeRect(f.b.x - 22, f.b.y - 22, 44, 44);
        text('IMPACT · ' + (ZONES[clip.zone] || clip.zone.toUpperCase()), f.b.x, f.b.y - 28, 11, C.cam, 'center');
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
    if (to === 2 && reach > 0) for (const sg of [-1, 1]) rect(cx - car.L / 2 * k, sg > 0 ? cy + (car.W / 2 + 4) * k : cy - (car.W / 2 + 4) * k - reach * 150, FW - cx + car.L / 2 * k, reach * 150, C.field);
    ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k); carShape(car, u >= 0.45 ? to : from); ctx.restore();
    const px = to === 2 ? cx - 1 * k : cx + (car.L / 2 - 17) * k; // where the new sensor goes: the nose (rung 1), the flanks (rung 2)
    if (u < 0.45) drawDrone(px, cy - 160 + 160 * (u / 0.45), to === 2 ? 'S2' : true);
    else if (u < 0.7) drawDrone(px, cy - 160 * ((u - 0.45) / 0.25), false);
    text('SENSOR FITTED · ' + (info && info.sensor ? info.sensor : ''), 40, 90, 22, C.text);
    text((clip ? clip.model : s.models.sedan.id) + ' · RUNG ' + (info ? info.rung : ''), 40, 120, 14, C.dim);
  }
  function draw() {
    if (s.phase === 'lesson' && lessonT != null) {
      if (clip && lessonT < CLIP + HOLD) drawClip(lessonT); else drawFit(lessonT - (clip ? CLIP + HOLD : 0));
      drawHud(); return;
    }
    const L = s.level; drawRoads(L); drawStatics(L);
    const cars = s.cars.filter((c) => !c.ghost);
    if (showZones) for (const c of cars) drawZones(c);
    for (const c of cars) drawCar(c);
    drawDummy(s.body);
    const d = s.delivery; if (d) drawDrone(d.x, d.y, d.state !== 'outbound' && (d.node === 'legs1' ? 'L1' : 'B1'));
    for (let i = flash.length - 1; i >= 0; i--) { const f = flash[i]; f.t -= 1 / 60; if (f.t <= 0) { flash.splice(i, 1); continue; } const big = typeof f.n !== 'number'; text(big ? f.n : '−' + f.n, f.x, f.y - 24 - (1 - f.t) * 20, big ? 16 : 13, f.n === 'WRITE-OFF' ? C.red : C.dummy, 'center'); }
    drawHud();
    if (!started || paused) {
      rect(0, 0, FW, FH, 'rgba(10,12,18,0.72)');
      text(paused ? 'PAUSED' : 'PROTOTYPE ' + ST.id + ' · ' + ST.title, FW / 2, 250, 24, C.text, 'center');
      text('Two one-way roads cross at the Monument. One red car drives through.', FW / 2, 292, 14, C.dim, 'center');
      text('Arrows or WASD move · Space dash · K jump, once fitted · Z zones · P pause · R restart · L save log', FW / 2, 330, 13, C.dim, 'center');
      text(paused ? 'P to resume' : 'Press any key', FW / 2, 380, 16, C.dummy, 'center');
    }
  }
  window.__p10 = { get sim() { return s; }, get clip() { return clip; }, get lessonT() { return lessonT; }, stage: ST, newSim, start() { started = true; } };
  requestAnimationFrame(frame);
})();
