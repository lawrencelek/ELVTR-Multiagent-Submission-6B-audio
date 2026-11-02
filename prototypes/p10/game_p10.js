// Prototype 10.1 (GDD Edit 101): the test road, greybox. One screen: the Monument junction, one red sedan, the dummy on foot.
// Placeholder art by design (Nintendo check, row 655: mechanic before art). It draws the zones that act on the car
// (D103): the forward beam and the driver's field. Keys: arrows or WASD move; Space or J dash (once fitted); Z zones;
// P pause; R restart; L saves this session's log (JSON). Touch: drag on the left half to move, tap the right half to dash.
(function () {
  'use strict';
  const X = window.DUMMIES, T = window.DUMMIES_P10, F = window.DUMMIES_SIM;
  const FW = 800, FH = 640, HUD = 56, TAU = Math.PI * 2;
  const C = { pave: '#3a3f4b', paveLine: '#454b59', road: '#1e222c', lane: '#c9d1d9', kerb: '#8c95a6', zebra: '#e8edf2',
    plinth: '#a89f8c', plinthTop: '#c2b9a5', block: '#262a35', blockEdge: '#5b6e9c', jersey: '#8494b8', cone: '#f2a65a',
    red: '#ff3d3d', redDark: '#9e1f1f', glass: '#1b2a38', dummy: '#ffd400', joint: '#2a2a2a', beam: 'rgba(244,248,250,0.10)',
    beamHot: 'rgba(255,61,61,0.22)', field: 'rgba(127,168,188,0.10)', fieldHot: 'rgba(255,212,0,0.14)', text: '#f4f8fa', dim: '#7fa8bc', hud: '#12151c' };
  const cv = document.getElementById('game'), ctx = cv.getContext('2d');
  let s, paused = false, started = false, showZones = true, log = [], session = { start: Date.now() }, prevV = new Map(), flash = [];
  const keys = new Set(); let aEdge = false, touchMove = null, touchA = false;

  function newSim() { s = new T.TestRoadSim(Object.assign({}, F)); log = []; session = { start: Date.now(), build: 'P10.1' }; prevV.clear(); }
  newSim();

  // ---------- input
  addEventListener('keydown', (e) => {
    if (!started) { started = true; e.preventDefault(); return; }
    const k = e.key.toLowerCase();
    if (k === ' ' || k === 'j') { if (!keys.has(k)) aEdge = true; }
    if (k === 'p' || k === 'escape') paused = !paused;
    if (k === 'r') newSim();
    if (k === 'z') showZones = !showZones;
    if (k === 'l') saveLog();
    keys.add(k); if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
  });
  addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
  cv.addEventListener('touchstart', (e) => { started = true; for (const t of e.changedTouches) { const r = cv.getBoundingClientRect(); if (t.clientX - r.left < r.width / 2) touchMove = { id: t.identifier, x0: t.clientX, y0: t.clientY, dx: 0, dy: 0 }; else touchA = true; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchmove', (e) => { for (const t of e.changedTouches) if (touchMove && t.identifier === touchMove.id) { touchMove.dx = t.clientX - touchMove.x0; touchMove.dy = t.clientY - touchMove.y0; } e.preventDefault(); }, { passive: false });
  cv.addEventListener('touchend', (e) => { for (const t of e.changedTouches) if (touchMove && t.identifier === touchMove.id) touchMove = null; }, { passive: false });
  function command() {
    let mx = 0, my = 0;
    if (keys.has('arrowleft') || keys.has('a')) mx -= 1; if (keys.has('arrowright') || keys.has('d')) mx += 1;
    if (keys.has('arrowup') || keys.has('w')) my -= 1; if (keys.has('arrowdown') || keys.has('s')) my += 1;
    let a = aEdge || touchA; aEdge = false; touchA = false;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of pads) { if (!g) continue; if (Math.hypot(g.axes[0], g.axes[1]) > 0.2) { mx = g.axes[0]; my = g.axes[1]; } if (g.buttons[0] && g.buttons[0].pressed && !g._a) a = true; g._a = g.buttons[0] && g.buttons[0].pressed; }
    if (touchMove) { const d = Math.hypot(touchMove.dx, touchMove.dy); if (d > 8) { mx = touchMove.dx / Math.max(d, 60); my = touchMove.dy / Math.max(d, 60); } }
    const m = Math.hypot(mx, my); if (m > 1) { mx /= m; my /= m; }
    return { mx, my, aPress: a };
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
    const e0 = s.events.length; s.step(command());
    for (const e of s.events.slice(e0)) {
      if (['impact', 'writeoff', 'admit', 'lunge', 'honk'].includes(e.type)) log.push(e);
      if (e.type === 'impact' && e.lost > 0) flash.push({ x: s.body.x, y: s.body.y, t: 0.5, n: Math.round(e.lost) });
      if (e.type === 'writeoff') flash.push({ x: s.body.x, y: s.body.y, t: 1.2, n: 'WRITE-OFF' });
    }
  }
  function saveLog() {
    const out = { session, seconds: +s.t.toFixed(1), writeOffs: s.run.writeOffs, events: log, params: { p10: Object.fromEntries(Object.entries(F).filter(([k]) => k.startsWith('duel.') || k.startsWith('proto.learn'))) } };
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out, null, 1)], { type: 'application/json' }));
    a.download = 'p10_1_session_' + new Date().toISOString().replace(/[:.]/g, '-') + '.json'; a.click();
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
    const half = c.W / 2 + br + P['proto.driver.cautionZone'], near = !!c.hz;
    rect(-c.L - br, -half, c.fwdLen + c.L + 2 * br, 2 * half, near ? C.fieldHot : C.field);
    rect(0, -(c.W / 2 + br), c.fwdLen, c.W + 2 * br, (c.hz && c.hz.inPath) || (c.det && c.det.fwd) ? C.beamHot : C.beam);
    ctx.restore();
  }
  function drawCar(c) {
    const pv = prevV.get(c.id), braking = pv != null && c.v < pv - 0.05; prevV.set(c.id, c.v);
    ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.h);
    rect(-c.L / 2, -c.W / 2, c.L, c.W, c.red ? C.red : '#e8edf2');
    rect(-c.L / 2 + 2, -c.W / 2 + 2, 4, c.W - 4, C.redDark);
    rect(c.L / 2 - 16, -c.W / 2 + 3, 8, c.W - 6, C.glass);
    const noticed = c.state === 'caution' || c.state === 'intention', on = !noticed || Math.floor(s.t * (F['proto.art.noticeFlashHz'] || 4) * 2) % 2 === 0;
    if (on) { rect(c.L / 2 - 3, -c.W / 2 + 2, 3, 5, '#fffbe0'); rect(c.L / 2 - 3, c.W / 2 - 7, 3, 5, '#fffbe0'); }
    if (braking || c.v < 2) { rect(-c.L / 2, -c.W / 2 + 2, 3, 5, '#ff2020'); rect(-c.L / 2, c.W / 2 - 7, 3, 5, '#ff2020'); }
    ctx.fillStyle = '#f4f8fa'; ctx.beginPath(); ctx.arc(-2, 0, 5, 0, TAU); ctx.fill(); // the roof dome: the learning car's second channel (D89)
    ctx.restore();
    text(c.model + (c.state !== 'cruise' ? ' · ' + c.state.toUpperCase() : ''), c.x, c.y - 26, 10, C.text, 'center');
  }
  function drawDummy() {
    const b = s.body; if (!b || !b.alive) return;
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(b.x + 3, b.y + 4, 13, 9, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = C.dummy; ctx.beginPath(); ctx.arc(b.x, b.y, s.P['body.radius'], 0, TAU); ctx.fill();
    ctx.strokeStyle = C.joint; ctx.lineWidth = 2; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x + Math.cos(b.facing) * 20, b.y + Math.sin(b.facing) * 20); ctx.stroke();
  }
  function drawHud() {
    rect(0, FH, FW, HUD, C.hud);
    const b = s.body, hp = b ? Math.max(0, b.health) / s.maxHealth() : 0;
    text('10.1 · THE TEST ROAD', 14, FH + 22, 14, C.text);
    text('Rung 0 · the red car learns nothing', 14, FH + 42, 11, C.dim);
    text('BODY', 430, FH + 22, 11, C.dim); rect(470, FH + 12, 140, 12, '#2c3447'); rect(470, FH + 12, 140 * hp, 12, C.dummy);
    text('WRITE-OFFS ' + s.run.writeOffs, 470, FH + 42, 11, C.text);
    text(s.dashFitted() ? 'SPACE DASH' : 'ON FOOT', 786, FH + 22, 11, C.dim, 'right');
    text(Math.floor(s.t / 60) + ':' + String(Math.floor(s.t % 60)).padStart(2, '0'), 786, FH + 42, 11, C.text, 'right');
  }
  function draw() {
    const L = s.level; drawRoads(L); drawStatics(L);
    const cars = s.cars.filter((c) => !c.ghost);
    if (showZones) for (const c of cars) drawZones(c);
    for (const c of cars) drawCar(c);
    drawDummy();
    for (let i = flash.length - 1; i >= 0; i--) { const f = flash[i]; f.t -= 1 / 60; if (f.t <= 0) { flash.splice(i, 1); continue; } text(typeof f.n === 'number' ? '−' + f.n : f.n, f.x, f.y - 24 - (1 - f.t) * 20, f.n === 'WRITE-OFF' ? 18 : 13, f.n === 'WRITE-OFF' ? C.red : C.dummy, 'center'); }
    drawHud();
    if (!started || paused) {
      rect(0, 0, FW, FH, 'rgba(10,12,18,0.72)');
      text(paused ? 'PAUSED' : 'PROTOTYPE 10.1 · THE TEST ROAD', FW / 2, 250, 24, C.text, 'center');
      text('Two one-way roads cross at the Monument. One red car drives through.', FW / 2, 292, 14, C.dim, 'center');
      text('Arrows or WASD move · Z zones · P pause · R restart · L save log', FW / 2, 330, 13, C.dim, 'center');
      text(paused ? 'P to resume' : 'Press any key', FW / 2, 380, 16, C.dummy, 'center');
    }
  }
  window.__p10 = { get sim() { return s; }, newSim, start() { started = true; } };
  requestAnimationFrame(frame);
})();
