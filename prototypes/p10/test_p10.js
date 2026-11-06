// Prototype 10 checks (GDD Edits 101–108). node prototypes/p10/test_p10.js [--page]
// Headless sim checks for each test's values (sim_flags.json stages), on today's code; frozen-build checks; --page also
// loads every test's page in Playwright and plays 10.2's lesson through.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const X = require(path.join(ROOT, 'prototypes/p6/sim.js'));
const { TestRoadSim, junctionLevel } = require(path.join(__dirname, 'testroad.js'));
const SF = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim_flags.json'), 'utf8')), F1 = SF.stages['10.1'].flags, F2 = SF.stages['10.2'].flags, F3 = SF.stages['10.3'].flags, F4 = SF.stages['10.4'].flags, F5 = SF.stages['10.5'].flags, F6 = SF.stages['10.6'].flags, F7 = SF.stages['10.7'].flags, F8 = SF.stages['10.8'].flags;
const results = [];
const check = (name, fn) => { try { const r = fn(); results.push([r.ok, name, r.detail]); } catch (e) { results.push([false, name, String(e.stack || e).slice(0, 300)]); } };
const md5 = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
const sim = (F, over, carry) => new TestRoadSim(Object.assign({}, F, over || {}), carry);
const service = (s) => { if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop(); else if (s.phase === 'lesson') s.continueLesson(); };
const to = (b, x, y) => { const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
function drive(s, secs, cmd, keepLesson) { const seen = new Map(); let maxOn = 0; for (let i = 0; i < secs * 60; i++) { if (!(keepLesson && s.phase === 'lesson')) service(s); s.step(cmd ? cmd(s, i) : {}); const on = s.onRoad(); maxOn = Math.max(maxOn, on.length); for (const c of on) seen.set(c.id, c); } return { seen: [...seen.values()], maxOn }; }
const hits = (s, t0) => s.events.filter((e) => e.type === 'impact' && e.lost > 0 && (t0 == null || e.t > t0));
const stand = (x, y) => (q) => (q.body.alive ? to(q.body, x, y) : {});
const walkin = (q) => { const c = q.onRoad().find((k) => k.red), b = q.body; if (!b.alive) return {}; if (!c) return to(b, 300, 410); const p = X.pathAt(c.path, c.s + c.L / 2 + 110); return p.x < 20 || p.x > 780 || p.y < 20 || p.y > 620 ? to(b, 300, 410) : to(b, p.x, p.y); };

// ---------- 10.1's values on today's code: rung 0 unchanged
check('10.1 values: the junction, two one-way roads of two lanes, 200 run-in (world.spawnLeadIn)', () => {
  const L = junctionLevel(Object.assign({}, X.REG, X.PROTO, X.OVERRIDES, F1)), a0 = X.pathAt(L.lanes[0], 10), a1 = X.pathAt(L.lanes[1], 10), b0 = X.pathAt(L.lanes[2], 10), b1 = X.pathAt(L.lanes[3], 10);
  const ok = L.lanes.length === 4 && a0.tx > 0.99 && a1.tx > 0.99 && b0.ty > 0.99 && b1.ty > 0.99 && L.runIn === 200 && Math.round(a0.x) === -190;
  return { ok, detail: `lanes ${L.lanes.length}; A heads +x, B heads +y; run-in ${L.runIn}` };
});
check('10.1 values: one car type, alone on the road, both roads recur', () => {
  const s = sim(F1), r = drive(s, 300), cls = new Set(r.seen.map((c) => c.cls)), lanes = new Set(r.seen.map((c) => c.lane));
  return { ok: cls.size === 1 && cls.has('sedan') && r.maxOn === 1 && lanes.size === 4 && r.seen.every((c) => c.red) && r.seen.length >= 20, detail: `classes ${[...cls]}; most at once ${r.maxOn}; lanes ${[...lanes].sort()}; appearances ${r.seen.length} in 300 s` };
});
check('10.1 values: rung 0 senses nothing; standing in its lane is hit head-on at full damage; nothing learned in 600 s', () => {
  const s = sim(F1); drive(s, 120, stand(200, 292));
  const imp = hits(s), cau = s.events.filter((e) => e.type === 'commit').length;
  const s2 = sim(F1); drive(s2, 600, walkin);
  const learn = s2.events.filter((e) => e.type === 'lesson-due' || e.type === 'learn-standoff').length + hits(s2).filter((e) => e.learned != null).length;
  return { ok: imp.length > 0 && imp.every((e) => e.zone === 'front' && e.carState === 'cruise' && Math.round(e.lost) === 100) && cau === 0 && hits(s2).length > 10 && learn === 0 && s2.rung === 0, detail: `standing: ${imp.length} hits at ${[...new Set(imp.map((e) => Math.round(e.lost)))]}, manoeuvres ${cau}; walking in: ${hits(s2).length} hits, ${learn} learning events` };
});

// ---------- 10.2
check('10.2: the red car reappears duel.redReturnSeconds after it leaves the screen, or as soon as it can drive in', () => {
  const s = sim(F2); let left = null, back = null;
  for (let i = 0; i < 90 * 60 && back == null; i++) {
    const e0 = s.events.length; s.step({});
    for (const e of s.events.slice(e0)) if (e.type === 'left') left = e.t;
    const c = s.onRoad()[0];
    if (left != null && c && c.s + c.L / 2 >= c.path.enterS) back = s.t - left;
  }
  const want = Math.max(F2['duel.redReturnSeconds'], s.driveIn());
  return { ok: back != null && Math.abs(back - want) < 0.1, detail: `back after ${back && back.toFixed(2)} s; R ${F2['duel.redReturnSeconds']} s, drive-in ${s.driveIn().toFixed(2)} s (run-in ${s.level.runIn})` };
});
check('10.2: a hit on the nose teaches rung 1; the lesson waits until the car has left the screen; the car returns with its camera', () => {
  const s = sim(F2); let due = null, shown = null, onAtShow = null;
  for (let i = 0; i < 120 * 60 && !shown; i++) {
    const e0 = s.events.length; s.step(s.phase === 'play' ? stand(200, 292)(s) : {}); if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop();
    for (const e of s.events.slice(e0)) { if (e.type === 'lesson-due') due = e; if (e.type === 'lesson') { shown = e; onAtShow = s.onRoad().length; } }
  }
  const frozenT = s.t; for (let i = 0; i < 120; i++) s.step({}); const waited = s.t === frozenT && s.phase === 'lesson';
  s.continueLesson(); drive(s, 8);
  const c = s.onRoad()[0];
  return { ok: !!due && due.zone === 'front' && due.from === 0 && due.to === 1 && !!shown && onAtShow === 0 && waited && s.rung === 1 && !!c && c.rung === 1 && c.fwdLen === F2['perception.forwardLength'] && Math.abs(c.standoff - s.envelope(0)) < 1e-6 && c.model === due.model,
    detail: `due at ${due && due.t.toFixed(1)} s (${due && due.zone}); shown at ${shown && shown.t.toFixed(1)} s with ${onAtShow} cars on the road; sim waits ${waited}; then rung ${s.rung}, beam ${c && c.fwdLen}, stop line ${c && c.standoff.toFixed(0)}, tag ${c && c.model}` };
});
check('10.2: a bump on its side at rung 0 teaches nothing; only a hit on the nose does', () => {
  const s = sim(F2);
  drive(s, 300, (q) => { const b = q.body, c = q.onRoad().find((k) => k.red && k.lane === 1 && !k.spent); if (!b.alive) return {}; if (!c || c.x < 60) return to(b, 180, 250);
    const ahead = b.x - (c.x + c.L / 2); return ahead < -5 && ahead > -c.L * 0.6 ? { mx: 0, my: 1 } : to(b, 180, 250); });
  const side = hits(s).filter((e) => e.zone === 'side' || e.zone === 'rearDiagonal'), dues = s.events.filter((e) => e.type === 'lesson-due');
  const firstDue = dues.length ? dues[0].t : Infinity;
  return { ok: side.length > 0 && side[0].t < firstDue && dues.every((e) => e.zone === 'front' || e.zone === 'frontDiagonal'), detail: `side bumps ${side.length} (first at ${side.length && side[0].t.toFixed(1)} s); lessons ${dues.length}${dues.length ? ' from ' + dues.map((e) => e.zone) + ' at ' + firstDue.toFixed(1) + ' s' : ''}; rung ${s.rung}` };
});
check('10.2 rung 1: a dummy standing on a lane line, or 8 off it (D105), is never hit; the car stops beyond dash reach and passes', () => {
  const out = [];
  for (const [x, y] of [[200, 292], [200, 348], [200, 300], [600, 292]]) {
    const s = sim(F2, { 'duel.startRung': 1 }); let gap = Infinity, longest = 0, still = 0;
    drive(s, 300, (q) => { for (const c of q.onRoad()) { if (c.v < 1 && c.hz && c.hz.inPath) { gap = Math.min(gap, c.hz.lx); still += 1 / 60; longest = Math.max(longest, still); } } if (!q.onRoad().some((c) => c.v < 1)) still = 0; return stand(x, y)(q); });
    out.push({ x, y, hits: hits(s).length, gap, longest, passes: s.events.filter((e) => e.type === 'commit' && e.cause === 'pass').length }); out.patience = s.P['proto.driver.patienceSeconds'];
  }
  const R = 177; // movement.lungeDistance 164 + body.radius 13
  const reach = 164;
  return { ok: out.every((o) => o.hits === 0 && o.gap >= R && o.longest < out.patience + 4 && o.passes > 0), detail: out.map((o) => `(${o.x},${o.y}) hits ${o.hits}, closest stop ${o.gap.toFixed(0)}, longest wait ${o.longest.toFixed(1)} s, passes ${o.passes}`).join('; ') + ` (dash reach ${R}, lunge ${reach})` };
});
check('10.2 rung 1: a dummy that sprints at it down its lane, dashing in reach, only touches a stopped car', () => {
  const out = [];
  for (const x0 of [760, 450, 300]) {
    const s = sim(F2, { 'duel.startRung': 1 }, { owned: { battery1: true } }), done = new Set(); let cur = null, tries = 0;
    s.body.x = x0; s.body.y = 292;
    drive(s, 300, (q) => { const b = q.body, c = q.onRoad().find((k) => k.lane === 1 && !done.has(k.id)); if (!b.alive) return {}; if (!c || c.spent) { if (c) done.add(c.id); return q.onRoad().some((k) => done.has(k.id)) ? to(b, b.x, 420) : to(b, x0, 292); }
      const nx = c.x + Math.cos(c.h) * c.L / 2, gap = b.x - nx; if (cur !== c.id && gap > 0 && nx > 0 && Math.abs(c.d) < 1 && !(c.man && c.man.type === 'shift') && Math.abs(b.y - 292) < 6) { cur = c.id; tries++; } /* a car in its lane, not passing */ if (cur !== c.id) return to(b, x0, 292);
      if (b.mode === 'recover' || (c.v < 1 && gap < 40)) { done.add(c.id); cur = null; return to(b, b.x, 420); }
      const ang = Math.atan2(c.y - b.y, nx - b.x); return { mx: Math.cos(ang), my: Math.sin(ang), aPress: q.dashFitted() && gap < q.reach() + 13 && b.mode !== 'lunge' }; });
    out.push({ x0, tries, hits: hits(s).length, still: s.events.filter((e) => e.type === 'touch' && e.standstill).length });
  }
  return { ok: out.every((o) => o.tries >= 2 && o.hits === 0 && o.still > 0), detail: out.map((o) => `from x ${o.x0}: ${o.tries} charges, ${o.hits} hits, ${o.still} standstill touches`).join('; ') };
});
check('10.2 rung 1: the openings land: late from the side on foot (pillar 1, D97), and the flank with the dash', () => {
  const s = sim(F2, { 'duel.startRung': 1 }); drive(s, 300, walkin);
  const foot = hits(s), late = foot.filter((e) => e.carState !== 'cruise').length;
  const s2 = sim(F2, { 'duel.startRung': 1 }, { owned: { battery1: true } });
  drive(s2, 300, (q) => { const b = q.body; if (!b.alive) return {}; const c = q.onRoad().find((k) => !k.spent && k.v > 15 && Math.hypot(k.x - b.x, k.y - b.y) < 250); if (!c) return to(b, 300, 410);
    const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b.x - c.x, dy = b.y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, side = ly >= 0 ? 1 : -1;
    if (Math.abs(lx) < c.L / 2 + 10 && Math.abs(ly) < c.W / 2 + 120) { const ang = Math.atan2(c.y + (c.vy || 0) * 0.1 - b.y, c.x + (c.vx || 0) * 0.1 - b.x), off = Math.abs(Math.atan2(Math.sin(ang - b.facing), Math.cos(ang - b.facing))); return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 15 * X.DEG && b.mode !== 'lunge' && b.mode !== 'recover' }; }
    return to(b, c.x + (c.vx || 0) * 0.4 - sa * side * (c.W / 2 + 70), c.y + (c.vy || 0) * 0.4 + ca * side * (c.W / 2 + 70)); });
  const flank = hits(s2).filter((e) => e.zone === 'side');
  return { ok: foot.length > 0 && late > 0 && flank.length > 0, detail: `on foot, late: ${foot.length} hits in 300 s (${late} on a car already reacting), mean ${Math.round(foot.reduce((a, e) => a + e.lost, 0) / Math.max(1, foot.length))}; flank dash: ${flank.length} side hits` };
});
check('10.2: Battery 1 arrives by drone at the car\'s first brake for the dummy; its damage carries over', () => {
  const s = sim(F2); let brake = null, sent = null, gift = null, before = null, after = null, fittedAtBrake = null;
  for (let i = 0; i < 200 * 60 && !gift; i++) {
    service(s); const e0 = s.events.length; s.step(s.phase === 'play' ? stand(200, 292)(s) : {});
    for (const e of s.events.slice(e0)) { if (e.type === 'first-brake') { brake = e.t; fittedAtBrake = s.dashFitted(); } if (e.type === 'part-dispatch') sent = e.t; if (e.type === 'gift') { gift = e.t; after = s.body.health; } }
    if (!gift && s.body) before = { h: s.body.health, m: s.maxHealth() };
  }
  const travel = gift - sent;
  return { ok: brake != null && fittedAtBrake === false && Math.abs(sent - brake) < 1e-6 && travel > s.P['proto.droneLiftSeconds'] && travel < 5 && s.dashFitted() && Math.abs(after - (before.h + s.maxHealth() - before.m)) < 1e-6,
    detail: `first brake ${brake && brake.toFixed(1)} s, drone sent ${sent && sent.toFixed(1)} s, fitted ${gift && gift.toFixed(1)} s; health ${before && before.h.toFixed(0)}/${before && before.m} → ${after && after.toFixed(0)}/${s.maxHealth()}` };
});
check('10.2: one lesson only; the opening holds for 600 s (no stalemate)', () => {
  const s = sim(F2); drive(s, 600, walkin);
  const lessons = s.events.filter((e) => e.type === 'lesson-due').length, learned = s.events.find((e) => e.type === 'learned'), late = hits(s, learned && learned.t + 120);
  return { ok: lessons === 1 && s.rung === 1 && late.length >= 5, detail: `lessons ${lessons}, rung ${s.rung}; hits in the last 6+ minutes ${late.length}` };
});

// ---------- 10.3
const kerb = (x, y) => (q) => (q.body.alive ? to(q.body, x, y) : {});
check('10.3: starts at rung 1 with Battery 1 fitted; a hit from the side teaches rung 2; it returns with side sensors and a field', () => {
  const s = sim(F3); const start = { rung: s.rung, dash: s.dashFitted(), jump: s.has('jump'), hp: s.body.health, max: s.maxHealth() };
  let due = null; drive(s, 200, (q) => { const e = q.events.find((k) => k.type === 'lesson-due'); if (e) due = e; return walkin(q); });
  const c = s.onRoad()[0] || null; drive(s, 8);
  const c2 = s.onRoad()[0];
  return { ok: start.rung === 1 && start.dash && !start.jump && start.hp === start.max && !!due && due.from === 1 && due.to === 2 && s.rung === 2 && s.fieldFor() === F3['proto.driver.cautionZone'] && (!c2 || c2.rung === 2),
    detail: `start: rung ${start.rung}, dash ${start.dash}, jump ${start.jump}, body ${start.hp}/${start.max}; lesson from a ${due && due.zone} hit; now rung ${s.rung}, field ${s.fieldFor()}; car ${c2 ? 'rung ' + c2.rung : '—'}${c ? '' : ''}` };
});
check('10.3 rung 2: a dummy at the open kerb is never hit; the car notices it after perception.sideNoticeSeconds, stops short and waits', () => {
  const out = [];
  for (const [x, y] of [[600, 392], [600, 250], [120, 250], [600, 440]]) {
    const s = sim(F3, { 'duel.startRung': 2 }, { owned: { battery1: true, legs1: true } }); let noticedAt = null, gap = Infinity, waited = 0;
    drive(s, 120, (q) => { for (const c of q.onRoad()) { if (c.noticed && noticedAt == null) noticedAt = c.fieldT; if (c.v < 1 && c.noticed) { waited += 1 / 60; gap = Math.min(gap, Math.hypot(q.body.x - (c.x + Math.cos(c.h) * c.L / 2), q.body.y - (c.y + Math.sin(c.h) * c.L / 2))); } } return kerb(x, y)(q); });
    out.push({ x, y, hits: hits(s).length, noticedAt, gap, waited, side: s.events.filter((e) => e.type === 'commit' && e.cause === 'side').length });
  }
  const n = F3['perception.sideNoticeSeconds'];
  return { ok: out.every((o) => o.hits === 0 && o.side > 0 && o.waited > 10 && Math.abs(o.noticedAt - n) < 0.02 && o.gap > 2 * X.REG['body.radius']), detail: out.map((o) => `(${o.x},${o.y}) hits ${o.hits}, noticed after ${o.noticedAt && o.noticedAt.toFixed(2)} s, closest while stopped ${o.gap.toFixed(0)}, waited ${o.waited.toFixed(0)} s`).join('; ') };
});
check('10.3 rung 2: cover stays open: behind the barrier it is unseen; a dash through the gap lands (pillar 1, D97)', () => {
  const s = sim(F3, { 'duel.startRung': 2 }, { owned: { battery1: true, legs1: true } }); let seenBehind = 0;
  drive(s, 300, (q) => { const b = q.body; if (!b.alive) return {}; const c = q.onRoad().find((k) => !k.spent && k.path.road === 'A' && k.x + (k.vx || 0) * 0.15 > 140 && k.x + (k.vx || 0) * 0.15 < 236);
    for (const k of q.onRoad()) if (k.path.road === 'A' && k.noticed && b.y > 400 && k.x < 140) seenBehind++;
    if (!c) return to(b, 188, 414); const ang = Math.atan2(c.y - b.y, c.x + (c.vx || 0) * 0.15 - b.x); return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: q.dashFitted() && Math.abs(Math.atan2(Math.sin(ang - b.facing), Math.cos(ang - b.facing))) < 15 * X.DEG && b.mode !== 'lunge' && b.mode !== 'recover' }; });
  return { ok: hits(s).length > 0, detail: `${hits(s).length} hits through the gap in 300 s; noticed while it waited at the gap on ${seenBehind} ticks` };
});
check('10.3 rung 2: the plinth is a raised edge: a dash-jump lands on it; up there, and in the air, the car does not see the dummy', () => {
  const s = sim(F3, { 'duel.startRung': 2 }, { owned: { battery1: true, legs1: true } }), b = () => s.body; let raisedAt = null, seenUp = 0, air = 0;
  for (let i = 0; i < 40 * 60 && raisedAt == null; i++) {
    let cmd; const B = b();
    if (B.mode === 'lunge') cmd = { bPress: B.lunge && B.lunge.t > 0.03 }; else if (B.mode === 'jump') cmd = {}; else if (B.y > 75 && Math.abs(B.x - 360) > 10) cmd = to(B, 360, B.y > 260 ? B.y : 70);
    else if (Math.hypot(275 - B.x, 70 - B.y) > 16) cmd = to(B, 275, 70); else cmd = { mx: 0, my: 0.12, aPress: Math.abs(Math.atan2(Math.sin(Math.PI / 2 - B.facing), Math.cos(Math.PI / 2 - B.facing))) < 8 * X.DEG };
    s.step(cmd); if (B.mode === 'jump') air++; if (B.raised) raisedAt = s.t;
  }
  for (let i = 0; i < 60 * 60; i++) { s.step(b().raised ? to(b(), 275, 226) : {}); for (const c of s.onRoad()) if (c.hz || c.noticed) seenUp++; }
  return { ok: raisedAt != null && b().raised && seenUp === 0, detail: `on the plinth at ${raisedAt && raisedAt.toFixed(1)} s (${air} ticks in the air); cars that sensed it up there over 60 s: ${seenUp}` };
});
check('10.3: Legs 1 arrives by drone at the first side stop; a running jump clears a car above its roof and strikes it below', () => {
  const s = sim(F3, { 'duel.startRung': 2 }); let side = null, gift = null;
  for (let i = 0; i < 120 * 60 && !gift; i++) { const e0 = s.events.length; s.step(kerb(600, 392)(s)); for (const e of s.events.slice(e0)) { if (e.type === 'first-side') side = e.t; if (e.type === 'gift' && e.node === 'legs1') gift = e.t; } }
  const P = Object.assign({}, X.REG, X.PROTO, X.OVERRIDES, F3), J = X.JUMP, T = P['abilities.legs.airtimeBase'], H = P['vehicles.sedan.height'];
  const over = J.above(P, H, T); // the part of a Legs 1 jump above a sedan's roof
  return { ok: side != null && gift != null && gift - side < 5 && s.has('jump') && !!over && over[1] > over[0], detail: `first side stop ${side && side.toFixed(1)} s, Legs 1 fitted ${gift && gift.toFixed(1)} s; a Legs 1 jump is above a sedan's roof (${H}) from ${over && over[0].toFixed(3)} to ${over && over[1].toFixed(3)} s of ${T}` };
});
check('10.3: one lesson only (rung 1 to 2); the openings hold for 300 s', () => {
  const s = sim(F3); drive(s, 300, walkin); const lessons = s.events.filter((e) => e.type === 'lesson-due').length;
  return { ok: lessons === 1 && s.rung === 2, detail: `lessons ${lessons}, rung ${s.rung}` };
});

// ---------- 10.4
const climb = (s) => { const B = s.body; if (B.mode === 'lunge') return { bPress: B.lunge && B.lunge.t > 0.03 }; if (B.mode === 'jump') return {}; if (B.y > 75 && Math.abs(B.x - 360) > 10) return to(B, 360, B.y > 260 ? B.y : 70);
  if (Math.hypot(275 - B.x, 70 - B.y) > 16) return to(B, 275, 70); return { mx: 0, my: 0.12, aPress: Math.abs(Math.atan2(Math.sin(Math.PI / 2 - B.facing), Math.cos(Math.PI / 2 - B.facing))) < 8 * X.DEG }; };
check('10.4: starts at rung 2 with the dash and the jump; a dash from the plinth teaches rung 3; a dash through the barrier gap does not', () => {
  const s = sim(F4); const start = { rung: s.rung, dash: s.dashFitted(), jump: s.has('jump') };
  drive(s, 240, (q) => { if (q.rung >= 3 || q.lesson) return {}; const b = q.body; if (!b.alive) return {}; if (!b.raised) return climb(q); // as qa/testroad.js's plinth bot
    const c = q.onRoad().find((x) => !x.spent && x.path.road === 'A' && x.x < b.x + 30); if (!c) return to(b, 275, 226);
    const tx = c.x + (c.vx || 0) * 0.1, ty = c.y, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x), off = Math.abs(Math.atan2(Math.sin(ang - b.facing), Math.cos(ang - b.facing)));
    if (d > 160) return Object.assign(to(b, 275, 226), Math.hypot(275 - b.x, 226 - b.y) < 7 ? { mx: Math.cos(ang) * 0.05, my: Math.sin(ang) * 0.05 } : {});
    return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: q.dashFitted() && b.mode !== 'lunge' && b.mode !== 'recover' && off < 15 * X.DEG }; });
  const due = s.events.find((e) => e.type === 'lesson-due');
  const g = sim(F4); drive(g, 180, (q) => { const b = q.body; if (!b.alive) return {}; const c = q.onRoad().find((x) => !x.spent && x.path.road === 'A' && x.x + (x.vx || 0) * 0.15 > 140 && x.x + (x.vx || 0) * 0.15 < 236); if (!c) return to(b, 188, 414);
    const ang = Math.atan2(c.y - b.y, c.x + (c.vx || 0) * 0.15 - b.x); return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: q.dashFitted() && Math.abs(Math.atan2(Math.sin(ang - b.facing), Math.cos(ang - b.facing))) < 15 * X.DEG && b.mode !== 'lunge' && b.mode !== 'recover' }; });
  return { ok: start.rung === 2 && start.dash && start.jump && !!due && due.to === 3 && s.rung === 3 && hits(g).length > 0 && g.rung === 2 && !g.events.some((e) => e.type === 'lesson-due'),
    detail: `start: rung ${start.rung}, dash ${start.dash}, jump ${start.jump}; from the plinth: lesson ${due ? 'at ' + due.t.toFixed(1) + ' s (' + due.zone + ')' : 'none'}, rung ${s.rung}; through the gap: ${hits(g).length} hits, rung ${g.rung}` };
});
check('10.4 (row 685): a jump out of cover strikes from above but teaches nothing: the clip shows cover', () => {
  const s = sim(F4); // qa/testroad.js's jump bot: from behind the barrier, runs at a passing car and jumps into it from close
  drive(s, 180, (q) => { const b = q.body; if (!b.alive) return {}; let best = null;
    for (const c of q.onRoad()) if (!c.spent) { const d = Math.hypot(c.x - b.x, c.y - b.y); if (d < 260 && c.v > 15 && (!best || d < best.d)) best = { c, d }; }
    if (!best) return to(b, 300, 410);
    const c = best.c, tx = c.x + (c.vx || 0) * 0.25, ty = c.y + (c.vy || 0) * 0.25, ang = Math.atan2(ty - b.y, tx - b.x), d = Math.hypot(tx - b.x, ty - b.y);
    return { mx: Math.cos(ang), my: Math.sin(ang), bPress: Math.hypot(b.vx, b.vy) > q.P['movement.walkSpeed'] * 1.06 && d < 70 && b.mode !== 'jump' }; });
  const up = hits(s).filter((e) => e.above), clip = s.P['duel.lessonClipSeconds'];
  return { ok: up.length > 0 && up.every((e) => e.sight < clip) && s.rung === 2 && !s.events.some((e) => e.type === 'lesson-due'),
    detail: `${up.length} hits from above; in sight past cover ${Math.min(...up.map((e) => e.sight))}–${Math.max(...up.map((e) => e.sight))} s before each (clip ${clip} s); lessons ${s.events.filter((e) => e.type === 'lesson-due').length}, rung ${s.rung}` };
});
check('10.4 rung 3: it sees the dummy up on the plinth and in the air; it stops short of the plinth and waits', () => {
  const s = sim(F4, { 'duel.startRung': 3 }, { owned: { battery1: true, legs1: true } }); let raisedAt = null;
  for (let i = 0; i < 40 * 60 && raisedAt == null; i++) { s.step(climb(s)); if (s.body.raised) raisedAt = s.t; }
  let seenUp = 0, stopped = 0, gap = Infinity; const before = new Set(s.cars.map((c) => c.id)); // cars already near when it climbed may notice it late
  for (let i = 0; i < 90 * 60; i++) { s.step(s.body.raised ? to(s.body, 275, 226) : {}); for (const c of s.onRoad()) { if (c.noticed && s.body.raised) seenUp++; if (c.v < 1 && c.noticed) { stopped++; if (!before.has(c.id)) gap = Math.min(gap, Math.hypot(s.body.x - (c.x + Math.cos(c.h) * c.L / 2), s.body.y - (c.y + Math.sin(c.h) * c.L / 2))); } } }
  const a = sim(F4, { 'duel.startRung': 3 }, { owned: { battery1: true, legs1: true } }); let airSeen = 0, airTicks = 0;
  for (let i = 0; i < 30 * 60; i++) { const c = a.onRoad().find((x) => x.path.road === 'A' && x.lane === 1); const b = a.body; let cmd = to(b, 640, 292); if (c && c.x > 0 && Math.abs(b.y - 292) < 8) cmd = { mx: -1, my: 0, bPress: Math.hypot(b.vx, b.vy) > 90 && b.mode !== 'jump' };
    a.step(cmd); if (b.mode === 'jump') { airTicks++; if (a.onRoad().some((x) => x.hz)) airSeen++; } }
  const u = sim(F4, { 'duel.startRung': 3 }, { owned: { battery1: true, legs1: true } }); Object.assign(u.body, { x: 275, y: 226, raised: true }); let ugap = Infinity; // up before any car comes
  for (let i = 0; i < 60 * 60; i++) { u.step({}); for (const c of u.onRoad()) if (c.v < 1 && c.noticed) ugap = Math.min(ugap, Math.hypot(u.body.x - (c.x + Math.cos(c.h) * c.L / 2), u.body.y - (c.y + Math.sin(c.h) * c.L / 2))); }
  return { ok: raisedAt != null && seenUp > 0 && stopped > 0 && gap >= 177 && Number.isFinite(ugap) && ugap >= 177 && hits(s).length + hits(u).length === 0 && airTicks > 0 && airSeen > 0, detail: `climbed at ${raisedAt && raisedAt.toFixed(1)} s; noticed up there on ${seenUp} car-ticks; stopped ${(stopped / 60).toFixed(0)} car-seconds; up before the car came: it stopped ${ugap.toFixed(0)} away (dash reach 177); ${hits(s).length + hits(u).length} hits; in the air ${airTicks} ticks, seen on ${airSeen}` };
});

// ---------- 10.5
const gapBot = (q) => { const b = q.body; if (!b.alive) return {}; const c = q.onRoad().find((x) => !x.spent && x.path.road === 'A' && x.x + (x.vx || 0) * 0.15 > 140 && x.x + (x.vx || 0) * 0.15 < 236); if (!c) return to(b, 188, 414);
  const ang = Math.atan2(c.y - b.y, c.x + (c.vx || 0) * 0.15 - b.x); return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: q.dashFitted() && Math.abs(Math.atan2(Math.sin(ang - b.facing), Math.cos(ang - b.facing))) < 15 * X.DEG && b.mode !== 'lunge' && b.mode !== 'recover' }; };
const lurkBot = () => { let cur = null; return (q) => { const b = q.body; if (!b.alive) return {}; const c = q.onRoad().find((x) => !x.spent && x.path.road === 'A' && x.lane === 0 && x.v > 15); // qa/testroad.js's lurk bot
  if (cur && (!c || c.id !== cur || b.mode === 'recover')) cur = null; if (!cur && c && Math.abs(c.x + c.vx * 0.45 - b.x) < 14 && Math.hypot(660 - b.x, 576 - b.y) < 10) cur = c.id; if (!cur) return to(b, 660, 576);
  const tx = c.x + c.vx * 0.15, ty = c.y, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
  return { mx: Math.cos(ang), my: Math.sin(ang), aPress: q.dashFitted() && b.mode !== 'lunge' && b.mode !== 'recover' && Math.abs(Math.atan2(Math.sin(ang - b.facing), Math.cos(ang - b.facing))) < 20 * X.DEG && d < q.reach() + 6 }; }; };
check('10.5: starts at rung 3 with the dash and the jump; a dash out of cover teaches rung 4; a sprint from past the field lands but teaches nothing', () => {
  const s = sim(F5), start = { rung: s.rung, dash: s.dashFitted(), jump: s.has('jump'), cones: s.has('carry') }; drive(s, 120, gapBot);
  const due = s.events.find((e) => e.type === 'lesson-due'), hit = s.events.find((e) => e.type === 'impact' && e.lost > 0);
  const l = sim(F5); drive(l, 240, lurkBot()); const lh = hits(l);
  return { ok: start.rung === 3 && start.dash && start.jump && !start.cones && !!due && due.to === 4 && s.rung === 4 && !!hit && hit.cover && lh.length > 0 && lh.every((e) => !e.cover) && l.rung === 3,
    detail: `start: rung ${start.rung}, dash ${start.dash}, jump ${start.jump}, cones ${start.cones}; out of cover: lesson ${due ? 'at ' + due.t.toFixed(1) + ' s (' + due.zone + ')' : 'none'}, rung ${s.rung}; from past the field: ${lh.length} hits, none from cover, rung ${l.rung}` };
});
check('10.5 rung 4: its cameras see the dummy behind the barrier; it stops beyond dash reach and waits; Hands 1 arrives at that first stop', () => {
  const s = sim(F5, { 'duel.startRung': 4 }); let first = null, gift = null, gap = Infinity, stopped = 0;
  for (let i = 0; i < 90 * 60; i++) { Object.assign(s.body, { x: 300, y: 412, vx: 0, vy: 0 }); const e0 = s.events.length; s.step({});
    for (const e of s.events.slice(e0)) { if (e.type === 'first-cover') first = e.t; if (e.type === 'gift' && e.node === 'hands1') gift = e.t; }
    for (const c of s.onRoad()) if (c.v < 1 && c.noticed && c.hidden) { stopped++; gap = Math.min(gap, Math.hypot(s.body.x - (c.x + Math.cos(c.h) * c.L / 2), s.body.y - (c.y + Math.sin(c.h) * c.L / 2))); } }
  const r3 = sim(F5); let seen3 = 0; for (let i = 0; i < 60 * 60; i++) { Object.assign(r3.body, { x: 300, y: 412, vx: 0, vy: 0 }); r3.step({}); for (const c of r3.onRoad()) if (c.noticed && c.hidden) seen3++; } // rung 3 sees it only through the gap
  return { ok: first != null && gift != null && gift - first < 5 && s.has('carry') && stopped > 0 && gap >= 177 && hits(s).length === 0 && seen3 === 0,
    detail: `first stop behind cover ${first && first.toFixed(1)} s, Hands 1 fitted ${gift && gift.toFixed(1)} s; stopped ${(stopped / 60).toFixed(0)} car-seconds, closest ${gap.toFixed(0)} (dash reach 177); ${hits(s).length} hits. At rung 3, ticks a car noticed it while cover hid it: ${seen3}` };
});
check('10.5: a swerve round a cone holds until it has passed it; a dummy in its field meanwhile is not stopped for (the cone\'s opening)', () => {
  const s = sim(F5, { 'duel.startRung': 4 }, { owned: { battery1: true, legs1: true, hands1: true } }); let dodging = 0, sideStops = 0, passed = false, swerved = false;
  Object.assign(s.body, { x: 600, y: 600 }); // out of every field until the car commits
  for (let i = 0; i < 40 * 60 && !passed; i++) {
    const c = s.onRoad().find((q) => q.red && q.path.road === 'A');
    if (c && !swerved && c.x > -400 && c.x < -300) { const cn = s.cones[0]; Object.assign(cn, { x: 300, y: c.y, state: 'free', vx: 0, vy: 0 }); swerved = true; }
    const e0 = s.events.length; const dodge = !!(c && c.dodge && c.dodge.kind === 'cone' && c.cause === 'cone');
    if (dodge) { dodging++; Object.assign(s.body, { x: 300, y: c.y > 320 ? 430 : 210, vx: 0, vy: 0 }); } // beside the cone, in its field
    s.step({}); for (const e of s.events.slice(e0)) if (e.type === 'commit' && e.cause === 'side') sideStops++;
    if (c && swerved && c.x - c.L / 2 > 330) passed = true;
  }
  return { ok: swerved && dodging > 60 && passed && sideStops === 0, detail: `cone laid ${swerved}; ${(dodging / 60).toFixed(1)} s swerving with the dummy beside the cone; passed it ${passed}; side stops meanwhile ${sideStops}` };
});
check('10.5 (row 688): a dummy that steps from a waiting car\'s field into its path keeps it stopped', () => {
  const s = sim(F5, { 'duel.startRung': 4 }); let held = 0, moved = 0, phase = 0, c = null;
  for (let i = 0; i < 60 * 60; i++) {
    if (phase === 0) { Object.assign(s.body, { x: 300, y: 412, vx: 0, vy: 0 }); c = s.onRoad().find((q) => q.red && q.path.road === 'A' && q.v < 1 && q.noticed && q.x > -60); if (c) { phase = 1; held = 0; } }
    else if (phase === 1) { const nose = c.x + Math.cos(c.h) * c.L / 2; Object.assign(s.body, { x: Math.max(40, nose + 200), y: c.y, vx: 0, vy: 0 }); held++; if (c.v > 1) moved++; if (held > 3 * 60) break; }
    s.step({});
  }
  return { ok: phase === 1 && held > 3 * 60 && moved === 0, detail: `a car waiting for the dummy behind the barrier: ${!!c}; the dummy then 200 ahead in its lane for ${(held / 60).toFixed(1)} s; ticks it moved: ${moved}` };
});

// ---------- 10.6
// A scripted cone bait: a cone laid in a road A car's lane 600 along; as it swerves round it, the dummy strikes from the north kerb.
const coneStrike = () => { let laid = null, struck = null; return (q) => { const b = q.body; if (!b.alive || q.lesson || q.rung !== 4) return {};
  const c = q.onRoad().find((x) => x.red && !x.spent && x.path.road === 'A'); if (!c) return to(b, 720, 600);
  if (laid !== c.id && c.x > -100 && c.x < 0) { Object.assign(q.cones[0], { x: 600, y: c.y, state: 'free', vx: 0, vy: 0 }); laid = c.id; }
  if (laid === c.id && struck !== c.id && c.cause === 'cone' && c.dodge && c.x > 480 && c.x < 540 && b.mode !== 'lunge' && b.mode !== 'recover') {
    struck = c.id; Object.assign(b, { x: c.x + 50, y: 244, vx: 0, vy: 0 }); const ang = Math.atan2(c.y - b.y, c.x + 25 - b.x); b.facing = ang; return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true }; }
  return laid === c.id ? {} : to(b, 720, 600); }; };
check('10.6: starts at rung 4 with the dash, the jump and the cones; a hit while it swerves round a cone teaches rung 5; a sprint from past the field does not', () => {
  const s = sim(F6), start = { rung: s.rung, parts: ['battery1', 'legs1', 'hands1'].every((k) => s.run.owned[k]), duck: !!s.run.owned.duck1, planters: s.level.statics.filter((q) => q.low).length };
  drive(s, 120, coneStrike()); const due = s.events.find((e) => e.type === 'lesson-due'), hit = s.events.find((e) => e.type === 'impact' && e.lost > 0);
  const l = sim(F6); drive(l, 240, lurkBot()); const lh = hits(l);
  return { ok: start.rung === 4 && start.parts && !start.duck && start.planters === 3 && !!due && due.to === 5 && s.rung === 5 && !!hit && hit.coned && lh.length > 0 && lh.every((e) => !e.coned) && l.rung === 4,
    detail: `start: rung ${start.rung}, three parts ${start.parts}, DUCK ${start.duck}, planter rows ${start.planters}; round a cone: lesson ${due ? 'at ' + due.t.toFixed(1) + ' s (' + due.zone + ')' : 'none'}, rung ${s.rung}; from past the field: ${lh.length} hits, rung ${l.rung}` };
});
check('10.6 rung 5: it stops short of a cone in its lane and never swerves; DUCK arrives at that first stop; FARSIGHT fetches the cone and it drives on', () => {
  const s = sim(F6, { 'duel.startRung': 5 }); let laid = false, first = null, gift = null, fetched = null, passed = false, swerves = 0, stopped = 0;
  for (let i = 0; i < 60 * 60 && !passed; i++) {
    const c = s.onRoad().find((q) => q.red && q.path.road === 'A');
    if (c && !laid && c.x > -400 && c.x < -300) { Object.assign(s.cones[0], { x: 300, y: c.y, state: 'free', vx: 0, vy: 0 }); laid = true; }
    Object.assign(s.body, { x: 720, y: 600, vx: 0, vy: 0 }); const e0 = s.events.length; s.step({});
    for (const e of s.events.slice(e0)) { if (e.type === 'commit' && e.cause === 'cone' && e.man === 'shift') swerves++; if (e.type === 'first-item') first = e.t; if (e.type === 'gift' && e.node === 'duck1') gift = e.t; if (e.type === 'drone-pickup') fetched = e.t; }
    if (c && laid && c.v < 1 && c.x < 300) stopped++; if (c && fetched && c.x - c.L / 2 > 320) passed = true;
  }
  return { ok: laid && swerves === 0 && first != null && gift != null && gift - first < 5 && s.has('duck1') && stopped > 0 && fetched != null && passed,
    detail: `swerves ${swerves}; first stop at a cone ${first && first.toFixed(1)} s, DUCK fitted ${gift && gift.toFixed(1)} s; waited ${(stopped / 60).toFixed(1)} s; cone fetched ${fetched && fetched.toFixed(1)} s; drove past ${passed}` };
});
check('10.6 DUCK: behind a planter row a ducked dummy is never noticed; standing there it is; ducked, it moves at movement.duckSpeedFactor', () => {
  const look = (duck) => { const t = sim(F6, { 'duel.startRung': 5 }, { owned: { battery1: true, legs1: true, hands1: true, duck1: true } }); let n = 0; for (let i = 0; i < 120 * 60; i++) { Object.assign(t.body, { x: 590, y: 418, vx: 0, vy: 0 }); t.step({ duck }); for (const c of t.onRoad()) if (c.noticed) n++; } return n; };
  const run = (duck) => { const t = sim(F6, {}, { owned: { duck1: true } }); Object.assign(t.body, { x: 760, y: 620 }); for (let i = 0; i < 90; i++) t.step({ mx: -1, my: 0, duck }); return Math.hypot(t.body.vx, t.body.vy); };
  const ducked = look(true), standing = look(false), vDuck = run(true), vRun = run(false), k = F6['movement.duckSpeedFactor'];
  return { ok: ducked === 0 && standing > 0 && Math.abs(vDuck / vRun - k) < 0.02, detail: `noticed on ${ducked} car-ticks ducked, ${standing} standing (120 s); speed ducked ${vDuck.toFixed(1)}, standing ${vRun.toFixed(1)} (factor ${k})` };
});
check('10.6: from a duck behind the planter, a dash vaults the row and lands on a passing car', () => {
  const s = sim(F6, { 'duel.startRung': 5 }, { owned: { battery1: true, legs1: true, hands1: true, duck1: true } }); Object.assign(s.body, { x: 590, y: 418 });
  drive(s, 120, (q) => { const b = q.body; if (!b.alive) return {}; if (Math.hypot(590 - b.x, 418 - b.y) > 8) return b.y > 412 ? to(b, 590, 418) : (b.x < 646 && b.y < 388 ? to(b, 652, 380) : to(b, 646, 428));
    const c = q.onRoad().find((x) => x.v > 15); if (c) { const tx = c.x + c.vx * 0.15, ty = c.y + c.vy * 0.15, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
      if (d < q.reach() + 6 && q.dashFitted() && b.mode !== 'lunge' && b.mode !== 'recover') return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true }; }
    return { duck: true }; });
  const h = hits(s);
  return { ok: h.length > 0 && h.every((e) => e.ducked), detail: `${h.length} hits in 120 s, ${h.filter((e) => e.ducked).length} sprung from a duck` };
});

// ---------- 10.7
// A scripted ambush: for each car on the plan's road, the dummy ducks at the plan's spot and springs as the car comes in reach.
const ALL = { owned: { battery1: true, legs1: true, hands1: true, duck1: true } };
const ambush = (plan) => { let i = 0, placed = null, n0 = 0; return (q) => { const b = q.body, P = plan[i]; if (!b.alive || !P) return {};
  if (q.crashes.length > n0) { n0 = q.crashes.length; i++; placed = null; return {}; }
  const c = q.onRoad().find((x) => x.red && !x.spent);
  if (!c || c.path.road !== P.road) { if (!['lunge', 'knock', 'recover'].includes(b.mode)) Object.assign(b, { x: 720, y: 600, vx: 0, vy: 0 }); return {}; }
  if (placed !== c.id) { Object.assign(b, { x: P.x, y: P.y, vx: 0, vy: 0 }); placed = c.id; }
  const d0 = Math.hypot(c.x - b.x, c.y - b.y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
  return d < q.reach() + 6 && b.mode !== 'lunge' && b.mode !== 'recover' && c.v > 15 ? { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true } : { duck: true }; }; };
check('10.7 values: starts at rung 5 with all four parts; a 500 body; a 200 run-in; back duel.redReturnSeconds after it leaves', () => {
  const s = sim(F7); let left = null, back = null;
  const start = { rung: s.rung, parts: ['battery1', 'legs1', 'hands1', 'duck1'].every((k) => s.run.owned[k]), max: s.maxHealth(), hp: s.body.health, runIn: s.level.runIn };
  for (let i = 0; i < 60 * 60 && back == null; i++) { const e0 = s.events.length; Object.assign(s.body, { x: 720, y: 600, vx: 0, vy: 0 }); s.step({}); for (const e of s.events.slice(e0)) if (e.type === 'left') left = e.t; const c = s.onRoad()[0]; if (left != null && c && c.s + c.L / 2 >= c.path.enterS) back = s.t - left; }
  const want = Math.max(F7['duel.redReturnSeconds'], s.driveIn());
  return { ok: start.rung === 5 && start.parts && start.max === 500 && start.hp === 500 && start.runIn === 200 && back != null && Math.abs(back - want) < 0.1,
    detail: `rung ${start.rung}; four parts ${start.parts}; body ${start.hp}/${start.max}; run-in ${start.runIn}; back after ${back && back.toFixed(2)} s (R ${F7['duel.redReturnSeconds']} s, drive-in ${s.driveIn().toFixed(2)} s)` };
});
check('10.7 run-in: a car that appears with the dummy ahead in its beam or field appears no faster than its envelope allows; standing near the screen\'s edge is never hit', () => {
  let slow = 0, worst = -Infinity, n = 0, hit = 0;
  for (const [x, y] of [[30, 292], [30, 348], [90, 420], [372, 40]]) { // in road A's lanes at the edge; beside road A, in the field; in road B's lane at the top edge
    const s = sim(F7, { 'duel.startRung': 6 }, ALL);
    for (let i = 0; i < 60 * 60; i++) { Object.assign(s.body, { x, y, vx: 0, vy: 0 }); const e0 = s.events.length; s.step({});
      for (const e of s.events.slice(e0)) { if (e.type === 'spawn-slow') slow++; if (e.type === 'admit') { const c = s.carById(e.car), nx = c.x + Math.cos(c.h) * c.L / 2, ny = c.y + Math.sin(c.h) * c.L / 2, fx = (x - nx) * Math.cos(c.h) + (y - ny) * Math.sin(c.h), fy = -(x - nx) * Math.sin(c.h) + (y - ny) * Math.cos(c.h); if (fx > 0 && fx < c.fwdLen && Math.abs(fy) <= c.W / 2 + s.P['body.radius'] + s.fieldFor()) { n++; worst = Math.max(worst, c.v - s.envSpeed(Math.hypot(x - nx, y - ny))); } } } }
    hit += hits(s).length; }
  return { ok: slow > 0 && worst <= 1 && hit === 0, detail: `cars that appeared with the dummy ahead in its field: ${n}, slowed: ${slow}; most over the envelope after its first tick ${worst.toFixed(2)} (≤ 1: one tick's pull-away); hits ${hit} in 4 × 60 s` };
});
check('10.7: every damaging hit leaves a crash (where it struck, the spot it sprang from); a hit from a new spot teaches nothing; a second from the same spot teaches rung 6', () => {
  const s = sim(F7, {}, ALL); const plan = [{ road: 'A', x: 559, y: 421 }, { road: 'A', x: 501, y: 421 }, { road: 'A', x: 559, y: 421 }];
  let dueAt2 = null; const bot = ambush(plan);
  drive(s, 240, (q, i) => { if (q.crashes.length === 2 && dueAt2 == null) dueAt2 = !!q.lesson; return bot(q, i); });
  const cr = s.crashes, h = hits(s), due = s.events.find((e) => e.type === 'lesson-due');
  const near = (c, p) => Math.hypot(c.ox - p.x, c.oy - p.y) < 8;
  return { ok: cr.length >= 3 && cr.length === h.length && near(cr[0], plan[0]) && near(cr[1], plan[1]) && near(cr[2], plan[2]) && dueAt2 === false && !!due && due.to === 6 && due.habit && cr[2].prev === 1 && s.rung === 6,
    detail: `crashes ${cr.length}, hits ${h.length}; spots ${cr.slice(0, 3).map((c) => `(${Math.round(c.ox)}, ${Math.round(c.oy)})`).join(' ')}; lesson after the new spot ${dueAt2}; after the repeat ${due ? 'to rung ' + due.to + ', same spot as crash ' + cr[2].prev : 'none'}; rung ${s.rung}` };
});
check('10.7 rung 6: ducked behind a planter at a spot it remembers, the dummy is expected: noticed at once, the car stops; one spot over, hidden, it drives on', () => {
  const look = (x, y) => { const t = sim(F7, { 'duel.startRung': 6 }, ALL); t.crashes.push({ n: 1, x: 560, y: 348, ox: 559, oy: 421, cover: 's5', t: 0, h: 0 }); let n = 0, stops = 0;
    for (let i = 0; i < 90 * 60; i++) { Object.assign(t.body, { x, y, vx: 0, vy: 0 }); const e0 = t.events.length; t.step({ duck: true }); for (const c of t.onRoad()) if (c.noticed) n++; stops += t.events.slice(e0).filter((e) => e.type === 'expect-stop').length; } return { n, stops, hits: hits(t).length }; };
  const at = look(559, 421), over = look(617, 421);
  return { ok: at.n > 0 && at.stops > 0 && over.n === 0 && over.stops === 0, detail: `at the remembered spot: noticed on ${at.n} car-ticks, ${at.stops} stops for it; 58 over: noticed on ${over.n}, stops ${over.stops}` };
});
check('10.7 rung 6: it remembers the latest duel.memorySites spots; the oldest falls out of memory, and of the car\'s sight', () => {
  const t = sim(F7, { 'duel.startRung': 6 }, ALL), N = F7['duel.memorySites'];
  [[559, 421], [501, 481], [110, 203], [501, 541]].forEach(([x, y], i) => t.crashes.push({ n: i + 1, x, y, ox: x, oy: y, cover: 's' + (4 + (i % 3)), t: i, h: 0 }));
  const mem = t.memory().map((m) => m.n); Object.assign(t.body, { x: 559, y: 421 }); const oldest = t.expected(); Object.assign(t.body, { x: 501, y: 541 }); const newest = t.expected();
  return { ok: N === 3 && mem.join() === '2,3,4' && !oldest && newest, detail: `cap ${N}; remembers crashes ${mem.join(', ')}; expected at crash 1's spot ${oldest}, at crash 4's ${newest}` };
});
check('10.7 (row 713): a hit from the open leaves an outline but no spot; repeating it teaches nothing; a hit from cover records the cover that hid it', () => {
  const l = sim(F7, {}, ALL); drive(l, 240, lurkBot()); const lc = l.crashes;
  const p = sim(F7, {}, ALL); drive(p, 120, ambush([{ road: 'A', x: 559, y: 421 }, { road: 'A', x: 559, y: 421 }])); const pc = p.crashes, row = p.level.statics.find((q) => q.id === (pc[0] && pc[0].cover));
  return { ok: lc.length >= 2 && lc.every((c) => c.cover === null) && !l.events.some((e) => e.type === 'lesson-due') && l.rung === 5 && pc.length >= 2 && !!row && row.kind === 'planter' && p.rung === 6,
    detail: `sprints from past the field: ${lc.length} crashes, cover ${[...new Set(lc.map((c) => c.cover || 'none'))].join(', ')}, rung ${l.rung}; from behind the planter: ${pc.length} crashes, cover ${pc.map((c) => c.cover).join(', ')} (${row ? row.kind : '—'}), rung ${p.rung}` };
});
check('10.7 (row 715): a car kept waiting duel.blockSeconds for the dummy calls a drone; it lifts the dummy beside the road, the car passes, the dummy is put down; no hits', () => {
  const t = sim(F7, { 'duel.startRung': 6 }, ALL), Xs = F7['duel.blockSeconds']; Object.assign(t.body, { x: 200, y: 292 }); let lift = null, drop = null, left = 0, maxWait = 0, w = 0;
  for (let i = 0; i < 90 * 60; i++) { const b = t.body, cmd = b.alive && !b.lifted ? to(b, 200, 292) : {}; const e0 = t.events.length; t.step(cmd);
    for (const e of t.events.slice(e0)) { if (e.type === 'block-lift' && !lift) lift = e; if (e.type === 'block-drop' && !drop) drop = e; if (e.type === 'left' && lift && !drop) left++; }
    const c = t.blocked(); w = c ? w + 1 / 60 : 0; maxWait = Math.max(maxWait, w); }
  const W = t.P['world.laneWidth'], side = drop && (drop.y < 320 - W || drop.y > 320 + W), flight = (t.P['world.height'] + 40) / t.P['proto.droneSpeed'] + t.P['proto.droneLiftSeconds'];
  return { ok: !!lift && Math.abs(lift.wait - Xs) < 0.05 && !!drop && side && hits(t).length === 0 && maxWait <= Xs + flight + 0.05,
    detail: `lift after ${lift && lift.wait} s (duel.blockSeconds ${Xs}); put down at ${drop ? drop.x + ', ' + drop.y : '—'}, beside road A: ${side}; held ${drop && drop.held} s; longest wait for the dummy ${maxWait.toFixed(1)} s (at most ${Xs} + the drone's flight and lift, ${flight.toFixed(1)}); hits ${hits(t).length}` };
});
check('10.7 rung 6: the same spot scores once, then the car stops for it; moving to a spot it does not remember lands again', () => {
  const same = sim(F7, { 'duel.startRung': 6 }, ALL); drive(same, 150, ambush(Array(20).fill({ road: 'A', x: 559, y: 421 })));
  const spots = [[559, 421], [501, 421], [617, 421], [559, 421], [501, 421], [617, 421]].map(([x, y]) => ({ road: 'A', x, y }));
  const move = sim(F7, { 'duel.startRung': 6 }, ALL); drive(move, 150, ambush(spots)); // three spots in turn: the latest three are remembered, so a fourth would be needed
  const spots4 = [[559, 421], [501, 421], [617, 421], [110, 203], [559, 421], [501, 421]].map(([x, y]) => ({ road: 'A', x, y }));
  const four = sim(F7, { 'duel.startRung': 6 }, ALL); drive(four, 200, ambush(spots4));
  const hs = hits(same).length, hm = hits(move).length, h4 = hits(four).length, stops = new Set(same.events.filter((e) => e.type === 'expect-stop').map((e) => e.car)).size;
  return { ok: hs === 1 && stops > 0 && hm === 3 && h4 >= 5 && hits(four).every((e) => !e.remembered), detail: `the same spot: ${hs} hit, then ${stops} car(s) stopped for it; three spots in turn: ${hm} hits; four in turn: ${h4} hits, none from a remembered spot` };
});

// ---------- 10.8
// Seen, then hidden: the dummy stands in view behind the planter row until a road A car has it, ducks, (crawls to dest), and
// springs as the car passes in reach.
const peekBot = (spot, dest) => { let phase = 'show', car = null; return (q) => { const b = q.body; if (!b.alive) return {};
  const c = q.onRoad().find((x) => x.red && !x.spent && x.path.road === 'A'); if (!c) { phase = 'show'; car = null; return to(b, spot[0], spot[1]); }
  if (car !== c.id) { car = c.id; phase = 'show'; }
  if (phase === 'show') { if (Math.hypot(spot[0] - b.x, spot[1] - b.y) > 6) return to(b, spot[0], spot[1]); if (c.noticed || (c.hz && c.v < 1)) phase = 'hide'; return {}; }
  const tg = dest || spot; if (Math.hypot(tg[0] - b.x, tg[1] - b.y) > 6) { const r = to(b, tg[0], tg[1]); return Object.assign(r, { duck: true }); }
  if (c.v > 15) { const d0 = Math.hypot(c.x - b.x, c.y - b.y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
    if (d < q.reach() + 6 && b.mode !== 'lunge' && b.mode !== 'recover') return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true }; }
  return { duck: true }; }; };
check('10.8 values: starts at rung 6 with all four parts; rung 7 searches duel.searchRadius for duel.searchSeconds', () => {
  const s = sim(F8);
  return { ok: s.rung === 6 && ['battery1', 'legs1', 'hands1', 'duck1'].every((k) => s.run.owned[k]) && F8['duel.topRung'] === 7 && F8['duel.searchRadius'] > 0 && F8['duel.searchSeconds'] > 0 && !!T7(),
    detail: `rung ${s.rung}, top ${F8['duel.topRung']}; search radius ${F8['duel.searchRadius']}, ${F8['duel.searchSeconds']} s` };
  function T7() { return require(path.join(__dirname, 'testroad.js')).RUNGS[7]; }
});
check('10.8: seen, then ducked behind cover within duel.lessonClipSeconds of the strike: at rung 6 the strike lands and teaches rung 7; at rung 7 the car leaves a ghost, stops short, finds the dummy, takes no hit', () => {
  const P = [170, 203], a = sim(F8, {}, ALL); Object.assign(a.body, { x: P[0], y: P[1] }); drive(a, 60, peekBot(P)); const due = a.events.find((e) => e.type === 'lesson-due'), hitA = hits(a)[0];
  const r7 = sim(F8, { 'duel.startRung': 7 }, ALL), bot7 = peekBot(P); Object.assign(r7.body, { x: P[0], y: P[1] }); let ghost = null, found = null, stopped = 0;
  for (let i = 0; i < 40 * 60; i++) { const e0 = r7.events.length; r7.step(bot7(r7)); for (const e of r7.events.slice(e0)) { if (e.type === 'search' && !ghost) ghost = e; if (e.type === 'search-found' && !found) found = e; } const c = r7.onRoad()[0]; if (c && c.lkp && c.v < 1) stopped++; }
  return { ok: !!due && due.to === 7 && !!hitA && hitA.lostSight && !!ghost && !!found && stopped > 0 && hits(r7).length === 0,
    detail: `rung 6: hit ${hitA ? 'from cover, seen ' + (hitA.seenAt && hitA.seenAt.ago) + ' s before' : 'none'}; lesson ${due ? 'to rung ' + due.to : 'none'}. Rung 7: ghost ${ghost ? 'at ' + ghost.x + ', ' + ghost.y : 'none'}; found ${found ? found.after + ' s after' : 'no'}; stopped while searching ${(stopped / 60).toFixed(1)} s; hits ${hits(r7).length}` };
});
check('10.8 rung 7: crawled beyond duel.searchRadius of the ghost, the dummy is lost; the car gives up duel.searchSeconds after its last find and drives on into the strike', () => {
  const t = sim(F8, { 'duel.startRung': 7 }, ALL), T = F8['duel.searchSeconds']; Object.assign(t.body, { x: 617, y: 421 }); const bot = peekBot([617, 421], [501, 421]); let ghost = null, end = null, lastHad = null, gap = null;
  for (let i = 0; i < 40 * 60 && !hits(t).length; i++) { const e0 = t.events.length; t.step(bot(t)); const c = t.onRoad().find((x) => x.lkp); if (c) lastHad = c.lkp.had;
    for (const e of t.events.slice(e0)) { if (e.type === 'search' && !ghost) ghost = e; if (e.type === 'search-end' && !end) { end = e; gap = Math.hypot(t.body.x - ghost.x, t.body.y - ghost.y); } } }
  const h = hits(t)[0], wait = end && lastHad != null ? end.t - lastHad : null;
  return { ok: !!ghost && !!end && !end.found && gap > F8['duel.searchRadius'] && Math.abs(wait - T) < 0.1 && !!h && h.t > end.t,
    detail: `ghost ${ghost ? ghost.t.toFixed(1) + ' s' : '—'}; gave up ${end ? end.t.toFixed(1) + ' s, ' + (wait != null ? wait.toFixed(2) : '—') + ' s after its last find (duel.searchSeconds ' + T + '); dummy ' + Math.round(gap) + ' from the ghost' : '—'}; hit ${h ? h.t.toFixed(1) + ' s, ' + h.zone + ', ' + Math.round(h.lost) : 'none'}` };
});

check('10.8 (row 723): each street camera sees only within perception.streetCameraFov of its aim; at 360 (10.7) it sees all round', () => {
  const t = sim(F8, {}, ALL), o = sim(F7, {}, ALL), F = F8['perception.streetCameraFov'], R = F8['perception.streetCameraRange'];
  const at = (q, x, y) => { Object.assign(q.body, { x, y, duck: false }); return !!q.seeingCamera(); };
  const cam = t.level.cameras[0], [cx, cy] = cam, aim = t.cameraAim(cam), pt = (deg, r) => [cx + Math.cos(deg * Math.PI / 180) * r, cy + Math.sin(deg * Math.PI / 180) * r];
  const inside = pt(aim, R * 0.6), outside = pt(aim + F / 2 + 25, R * 0.6), north = [50, 203];
  const r = { inside: at(t, ...inside), outside: at(t, ...outside), north8: at(t, ...north), north7: at(o, ...north), outside7: at(o, ...outside) };
  return { ok: F < 360 && t.level.cameras.every((c) => c.length >= 3) && r.inside && !r.outside && !r.north8 && r.north7 && r.outside7,
    detail: `fov ${F}°, range ${R}; camera 1 aims ${aim}° now. 10.8: inside the cone ${r.inside}, ${F / 2 + 25}° off its aim ${r.outside}, the north planters ${r.north8}. 10.7: north planters ${r.north7}, off its aim ${r.outside7}` };
});

check('10.8 (row 724): each camera pans across perception.streetCameraPanArc, MGS-style: rests perception.streetCameraPanHold at each end, sweeps in perception.streetCameraPanSeconds; a spot at one end of the sweep is watched part of each cycle; 10.7 stays fixed', () => {
  const t = sim(F8, {}, ALL), o = sim(F7, {}, ALL), A = F8['perception.streetCameraPanArc'], T = F8['perception.streetCameraPanSeconds'], H = F8['perception.streetCameraPanHold'], Fv = F8['perception.streetCameraFov'], R = F8['perception.streetCameraRange'];
  const cam = t.level.cameras[0], [cx, cy, base] = cam, end = base + A / 2 + Fv / 2 - 5, px = cx + Math.cos(end * Math.PI / 180) * R * 0.6, py = cy + Math.sin(end * Math.PI / 180) * R * 0.6;
  const cyc = 2 * (T + H); let lo = 1e9, hi = -1e9, seen = 0, n = 0, flips = 0, last = null; const aims0 = [];
  for (let k = 0; k <= cyc * 60; k++) { t.t = k / 60; const a = t.cameraAim(cam); lo = Math.min(lo, a); hi = Math.max(hi, a); const v = t.inCameraCone(cam, px, py); seen += v; n++; if (last !== null && v !== last) flips++; last = v; }
  for (const k of [0, 3, 7, 11]) { o.t = k; aims0.push(o.cameraAim(o.level.cameras[0])); }
  const t2 = sim(F8, {}, ALL), mirror = [0, 1.5, 2.5, 4.3].every((k) => { t2.t = k; return Math.abs((t2.cameraAim(t2.level.cameras[0]) - base) + (t2.cameraAim(t2.level.cameras[1]) - t2.level.cameras[1][2])) < 1e-6; });
  return { ok: A > 0 && Math.abs(hi - lo - A) < 0.5 && seen > 0 && seen < n && flips === 2 && aims0.every((a) => a === aims0[0]) && mirror,
    detail: `arc ${A}°, sweep ${T} s, hold ${H} s (cycle ${cyc} s); camera 1 aims ${lo.toFixed(0)}–${hi.toFixed(0)}°; a spot at the sweep's far edge watched ${(100 * seen / n).toFixed(0)}% of the cycle (${flips} changes); the barrier's two ends sweep as mirror images ${mirror}; 10.7 fixed at ${aims0[0]}°` };
});

check('10.8 (rows 725, 728): each strike is graded by how unseen it was and scores its damage × the grade: hidden from the start, UNSEEN (scoring.stealthUnseen); seen, then hidden, LOST (scoring.stealthLost); 10.7 scores none', () => {
  const ambush = (spot) => (q) => { const b = q.body; if (!b.alive) return {}; const c = q.onRoad().find((x) => x.red && !x.spent && x.path.road === 'A');
    if (Math.hypot(spot[0] - b.x, spot[1] - b.y) > 6) return Object.assign(to(b, spot[0], spot[1]), { duck: true });
    if (c && c.v > 15) { const d0 = Math.hypot(c.x - b.x, c.y - b.y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
      if (d < q.reach() + 6 && b.mode !== 'lunge' && b.mode !== 'recover') return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true }; }
    return { duck: true }; };
  const u = sim(F8, { 'duel.startRung': 7 }, ALL); Object.assign(u.body, { x: 559, y: 421, duck: true }); drive(u, 40, ambush([559, 421])); const hu = hits(u)[0];
  const l = sim(F8, {}, ALL); Object.assign(l.body, { x: 170, y: 203 }); drive(l, 60, peekBot([170, 203])); const hl = hits(l)[0];
  const o = sim(F7, {}, ALL); Object.assign(o.body, { x: 559, y: 421, duck: true }); drive(o, 40, ambush([559, 421])); const ho = hits(o)[0];
  const sum = (q) => hits(q).filter((e) => e.grade).reduce((t, e) => t + Math.round(e.lost * ({ unseen: F8['scoring.stealthUnseen'], lost: F8['scoring.stealthLost'], seen: F8['scoring.stealthSeen'] })[e.grade]), 0);
  return { ok: !!hu && hu.grade === 'unseen' && u.stealth.points === sum(u) && hu.points === Math.round(hu.lost * F8['scoring.stealthUnseen']) && !!hl && hl.grade === 'lost' && l.stealth.lost >= 1 && !!ho && o.stealth.points === 0 && F8['scoring.stealthUnseen'] > F8['scoring.stealthLost'] && F8['scoring.stealthLost'] > F8['scoring.stealthSeen'],
    detail: `ambush from the start: ${hu ? hu.grade + ', ' + Math.round(hu.lost) + ' damage × ' + hu.mult + ' = ' + hu.points : 'no hit'}; run total ${u.stealth.points}; seen, then hidden: ${hl ? hl.grade : 'no hit'}; 10.7: ${ho ? ho.grade : 'no hit'}, ${o.stealth.points} points` };
});
check('10.8 (row 726): the stop line: a car braking for the dummy, a remembered spot or its ghost stops where stopPoint first said, within 10 of its nose', () => {
  const runs = [], one = (x, y, bot, secs) => { const t = sim(F8, { 'duel.startRung': 7 }, ALL); Object.assign(t.body, { x, y }); const pred = new Map(), errs = [];
    for (let i = 0; i < secs * 60; i++) { t.step(bot ? bot(t) : {}); for (const c of t.onRoad()) { if (!c.red) continue; const k = c.id + ':' + (c.man && c.man.t0);
      if (c.v >= 1 && ['body', 'side', 'search'].includes(c.cause) && !pred.has(k)) { const sp = t.stopPoint(c); if (sp && sp.s > c.s + c.L / 2 + 1) pred.set(k, { s: sp.s, car: c.id, done: false }); }
      if (c.v < 1) for (const q of pred.values()) if (q.car === c.id && !q.done) { q.done = true; errs.push(Math.abs(c.s + c.L / 2 - q.s)); } } }
    return errs; };
  const stand = one(250, 292, null, 30), peek = one(170, 203, peekBot([170, 203]), 40), all = stand.concat(peek), within = all.filter((e) => e <= 10).length;
  return { ok: all.length >= 2 && within === all.length, detail: `stops ${all.length} (standing in the lane ${stand.length}; seen, then hidden ${peek.length}); within 10: ${within}; worst ${all.length ? Math.max(...all).toFixed(1) : '—'}` };
});

check('10.8 (rows 730, 731, 733): the field is three cones, not a rectangle, all from the nose and edge to edge: a forward cone (perception.forwardConeAngle, out to perception.forwardLength) and two side cones from its edge (perception.sideConeAxis ± perception.sideConeAngle, out to perception.sideConeRange). Noticed, then out of its cones, it keeps the dummy perception.trackSeconds, then forgets. In stages by distance: AWARE far out caps it at perception.sideAwareSpeed and notices at perception.sideAwareNoticeRate; WARY at perception.sideWarySpeed; CLOSE at perception.sideCloseSpeed; noticed, it stops short beyond the dash. The side cones are duller (perception.sideConeSensitivity): each stage nearer, the meter slower. Searching, the forward cone looks at the ghost. 10.7: the rectangle', () => {
  const g = sim(F8, { 'duel.startRung': 7 }, ALL); let c = null; for (let i = 0; i < 6 * 60 && !c; i++) { g.step({}); c = g.onRoad().find((q) => q.red && q.path.road === 'A'); }
  const D = Math.PI / 180, ca = Math.cos(c.h), sa = Math.sin(c.h), nx = c.x + ca * c.L / 2, ny = c.y + sa * c.L / 2;
  const at = (ox, oy, deg, r) => [ox + Math.cos(c.h + deg * D) * r, oy + Math.sin(c.h + deg * D) * r], cone = (pt) => { const k = g.coneOf(c, pt[0], pt[1]); return k ? k.cone : 'none'; };
  const A = F8['perception.forwardConeAngle'], Ax = F8['perception.sideConeAxis'], Aw = F8['perception.sideConeAngle'], Rs = F8['perception.sideConeRange'];
  const geo = { fwd: cone(at(nx, ny, A - 5, 500)), fwdFar: cone(at(nx, ny, 0, c.fwdLen + 40)), gap: cone(at(nx, ny, A + 6, 300)), left: cone(at(nx, ny, -Ax, Rs * 0.7)), right: cone(at(nx, ny, Ax, Rs * 0.7)), sideFar: cone(at(nx, ny, Ax, Rs + 40)), rear: cone(at(c.x, c.y, 160, 80)), edgeIn: cone(at(nx, ny, A - 0.5, Rs * 0.7)), edgeOut: cone(at(nx, ny, A + 0.5, Rs * 0.7)), edgeOutL: cone(at(nx, ny, -A - 0.5, Rs * 0.7)) };
  const o = sim(F7, { 'duel.startRung': 6 }, ALL); let c7 = null; for (let i = 0; i < 6 * 60 && !c7; i++) { o.step({}); c7 = o.onRoad().find((q) => q.red && q.path.road === 'A'); }
  const gp = at(c7.x + Math.cos(c7.h) * c7.L / 2, c7.y + Math.sin(c7.h) * c7.L / 2, A + 6, 300); Object.assign(o.body, { x: gp[0], y: gp[1] }); const rect7 = !!o.assessBody(c7) && !o.coned();
  c.lkp = { x: at(nx, ny, 70, 150)[0], y: at(nx, ny, 70, 150)[1], t0: g.t, had: g.t }; const look = g.coneLook(c), lookSees = cone(at(nx, ny, 70, 150)); c.lkp = null;
  const stageAt = (pt) => { Object.assign(g.body, { x: pt[0], y: pt[1] }); c.noticed = false; c.hz = g.assessBody(c); return c.hz ? { st: g.sideStage(c), rate: g.noticeRate(c), cone: c.hz.cone } : null; };
  const rC = F8['perception.sideCloseRange'], fC = stageAt(at(nx, ny, A - 5, rC - 20)), sW = stageAt(at(nx, ny, Ax, rC - 20)), sC = stageAt(at(nx, ny, Ax, (rC - 20) * F8['perception.sideConeSensitivity']));
  const Tk = F8['perception.trackSeconds'], out = at(nx, ny, A + 10, Rs + 60), forget = (ago) => { Object.assign(g.body, { x: out[0], y: out[1] }); c.noticed = true; c.coneT = g.t - ago; const hz = g.assessBody(c); return hz ? hz.cone + (hz.trackLeft != null ? ' ' + hz.trackLeft.toFixed(1) + ' s left' : '') : 'forgotten'; }, kept = forget(Tk - 1), lost = forget(Tk + 0.2); c.noticed = false; // row 733
  const run = (F, x, y, popAt) => { const s = sim(F, { 'duel.startRung': 7 }, ALL); Object.assign(s.body, popAt ? { x: 760, y: 600 } : { x, y }); let car = null, popped = false; const seen = {}, tIn = {}, vIn = {}, cones = {}; let t4 = null, stopGap = null;
    for (let i = 0; i < 14 * 60; i++) { const c0 = s.onRoad().find((q) => q.red && q.path.road === 'A'); if (popAt && c0 && c0.x >= popAt && !popped) { popped = true; Object.assign(s.body, { x, y }); } s.step({}); const c = s.onRoad().find((q) => q.red && q.path.road === 'A'); if (!c) continue; if (car && car !== c.id) break; car = c.id;
      const st = s.sideStaged() ? s.sideStage(c) : c.noticed ? 4 : c.hz && !c.hz.inPath ? 1 : 0; if (st >= 1 && st <= 3) { seen[st] = c.v; if (tIn[st] == null) { tIn[st] = s.t; vIn[st] = c.v; cones[st] = c.hz && c.hz.cone; } } if (st === 4 && t4 == null) t4 = { t: s.t, from: Math.max(...Object.keys(tIn).map(Number)) }; if (t4 && c.hz && !c.hz.inPath) { const d = Math.hypot(s.body.x - (c.x + Math.cos(c.h) * c.L / 2), s.body.y - (c.y + Math.sin(c.h) * c.L / 2)); stopGap = Math.min(stopGap == null ? 1e9 : stopGap, d); } }
    return { seen, tIn, vIn, t4, stopGap, cones }; };
  const cr = F8['vehicles.sedan.cruiseSpeed'] || 138, N = F8['perception.sideNoticeSeconds'], k = F8['perception.sideConeSensitivity'], reach = sim(F8, {}, ALL).reach(), y = 292 + 12.6 + 40;
  const a = run(F8, 560, y), w = run(F8, 560, y, 220), o7 = run(F7, 560, y);
  const into = (q, st) => q.t4 && q.t4.from === st ? q.t4.t - q.tIn[st] : null;
  const okGeo = geo.fwd === 'forward' && geo.fwdFar === 'none' && geo.gap === 'none' && geo.left === 'side' && geo.right === 'side' && geo.sideFar === 'none' && geo.rear === 'none' && geo.edgeIn === 'forward' && geo.edgeOut === 'side' && geo.edgeOutL === 'side' && g.sideEdges()[0] === A && rect7 && Math.abs(look - 70) < 1 && lookSees === 'forward' && Tk > 0 && kept === 'track 1.0 s left' && lost === 'forgotten';
  const ok = okGeo &&
    a.seen[1] != null && a.cones[1] === 'forward' && Math.abs(a.seen[1] - cr * F8['perception.sideAwareSpeed']) < 2 && Math.abs(into(a, 1) - N / F8['perception.sideAwareNoticeRate']) < 0.05 && a.stopGap > reach &&
    w.seen[2] != null && w.cones[2] === 'forward' && w.seen[2] < w.vIn[2] - 5 && Math.abs(into(w, 2) - N / F8['perception.sideWaryNoticeRate']) < 0.05 &&
    fC && fC.cone === 'forward' && fC.st === 3 && fC.rate === 1 && sW && sW.cone === 'side' && sW.st === 2 && sC && sC.st === 3 && Math.abs(sC.rate - k) < 1e-9 && o7.t4 && Math.abs(o7.t4.t - o7.tIn[1] - N) < 0.05;
  const f = (v) => v != null ? v.toFixed(2) : '—';
  return { ok, detail: `cones, all from the nose: ${A - 5}° off at 500 ${geo.fwd}; at ${Math.round(Rs * 0.7)}, ${A - 0.5}° ${geo.edgeIn}, ${A + 0.5}° ${geo.edgeOut} (the other side ${geo.edgeOutL}; side cones begin at ${g.sideEdges()[0]}°: edge to edge); noticed, out of its cones ${Tk - 1} s: ${kept}; ${Tk + 0.2} s: ${lost}; dead ahead past the beam's end ${geo.fwdFar}; ${A + 6}° off at 300 ${geo.gap} (10.7's rectangle had it: ${rect7}); ±${Ax}° at ${Math.round(Rs * 0.7)} ${geo.left}, ${geo.right}; beyond its range ${geo.sideFar}; behind ${geo.rear}; searching a ghost 70° off, it looks ${look.toFixed(0)}° and sees it: ${lookSees}. Standing ahead: AWARE (${a.cones[1]}) at ${a.seen[1] != null ? a.seen[1].toFixed(0) : '—'} (cap ${(cr * F8['perception.sideAwareSpeed']).toFixed(0)}), noticed ${f(into(a, 1))} s in, no closer than ${a.stopGap != null ? a.stopGap.toFixed(0) : '—'} to its nose (reach ${reach.toFixed(0)}); stepping out WARY (${w.cones[2]}): ${w.vIn[2] != null ? w.vIn[2].toFixed(0) : '—'} down to ${w.seen[2] != null ? w.seen[2].toFixed(0) : '—'}, noticed ${f(into(w, 2))} s in; at ${rC - 20}: forward ${fC && ['', 'AWARE', 'WARY', 'CLOSE'][fC.st]} (meter ×${fC && fC.rate}), side ${sW && ['', 'AWARE', 'WARY', 'CLOSE'][sW.st]}; side CLOSE only at ${Math.round((rC - 20) * k)} (meter ×${sC && sC.rate}); 10.7: noticed ${o7.t4 ? (o7.t4.t - o7.tIn[1]).toFixed(2) : '—'} s in its field` };
});
check('10.8 (row 732): the lunge guide shows where a dash pressed now would land: the dash reach along the input, stopped by a solid, with HIT when a car meets the predicted path; a real dash lands there', () => {
  const t = sim(F8, {}, ALL), b = t.body; Object.assign(b, { x: 60, y: 100, facing: 0 }); const g0 = t.lungePreview(1, 0), R = t.reach();
  const t2 = sim(F8, {}, ALL); Object.assign(t2.body, { x: 60, y: 100, facing: 0 }); t2.step({ mx: 1, my: 0, aPress: true }); for (let i = 0; i < 40 && t2.body.mode === 'lunge'; i++) t2.step({ mx: 1, my: 0 }); const land = Math.hypot(t2.body.x - g0.x1, t2.body.y - g0.y1);
  const st = t.level.statics.find((q) => !q.low && !q.plinth && q.w > 20 && q.h > 20), wall = st ? (() => { const u = sim(F8, {}, ALL); Object.assign(u.body, { x: st.x - 40, y: st.y + st.h / 2, facing: 0 }); return u.lungePreview(1, 0); })() : null;
  let hot = null; const hots = []; const h = sim(F8, { 'duel.startRung': 1 }, ALL); Object.assign(h.body, { x: 560, y: 250 }); for (let i = 0; i < 8 * 60 && !hot; i++) { h.step({}); const c = h.onRoad().find((q) => q.red && q.path.road === 'A' && q.x < 560 && q.x > 300); const p = c ? h.lungePreview(0, 1) : null; if (p && p.hit && p.hit.red) hots.push({ p, t: h.t }); else if (hots.length) hot = hots[hots.length >> 1]; } // the middle of the first run of HIT frames, not its grazing edge
  let hitReal = false; if (hot) { const h2 = sim(F8, { 'duel.startRung': 1 }, ALL); Object.assign(h2.body, { x: 560, y: 250 }); while (h2.t < hot.t - 1e-9) h2.step({}); h2.step({ mx: 0, my: 1, aPress: true }); for (let i = 0; i < 60; i++) h2.step({}); hitReal = hits(h2).length > 0; }
  const ok = Math.abs(Math.hypot(g0.x1 - 60, g0.y1 - 100) - R) < 1 && g0.ready && !g0.hit && land < 2 && (!st || (wall && Math.abs(Math.hypot(wall.x1 - wall.x0, wall.y1 - wall.y0) - (40 - t.P['body.radius'])) < 2)) && !!hot && hitReal;
  return { ok, detail: `open ground: lands ${Math.hypot(g0.x1 - 60, g0.y1 - 100).toFixed(0)} out (reach ${R.toFixed(0)}), ready ${g0.ready}; the real dash lands ${land.toFixed(1)} from it; toward a wall 40 away: stops ${wall ? Math.hypot(wall.x1 - wall.x0, wall.y1 - wall.y0).toFixed(0) : '—'} out (touching: ${40 - t.P['body.radius']}); rung 1, a red car passing below: HIT predicted ${hot ? 'for ' + hots.length + ' frames; dashing at ' + hot.t.toFixed(2) + ' s' : 'never'}, a dash then hits: ${hitReal}` };
});

// ---------- 10.9
const F9 = SF.stages['10.9'] && SF.stages['10.9'].flags;
check('10.9 (row 734): two two-way roads, traffic on the left; white sedans that never learn enter on all four lanes, the red car only eastbound on road A and southbound on road B; road B gives way to road A; no two cars overlap; a white car hides the dummy from the red car; its hits damage the dummy and score nothing', () => {
  const s = sim(F9, {}, ALL); Object.assign(s.body, { x: 700, y: 600 }); const W = s.P['world.width'], H = s.P['world.height'], lanesW = new Set(), lanesR = new Set(); let maxRed = 0, overlaps = 0, yields = 0;
  const dir = s.level.lanes.map((l) => [Math.sign(l.pts[l.pts.length - 1][0] - l.pts[0][0]), Math.sign(l.pts[l.pts.length - 1][1] - l.pts[0][1]), l.pts[0][0] === l.pts[l.pts.length - 1][0] ? l.pts[0][0] : l.pts[0][1]]);
  for (let i = 0; i < 120 * 60; i++) { service(s); s.step({}); const on = s.onRoad(), vis = on.filter((c) => c.x > -30 && c.x < W + 30 && c.y > -30 && c.y < H + 30); maxRed = Math.max(maxRed, on.filter((c) => c.red).length);
    for (const c of on) { (c.white ? lanesW : lanesR).add(c.lane); if (c.jYield) yields++; }
    for (let a = 0; a < vis.length; a++) for (let b = a + 1; b < vis.length; b++) if (Math.hypot(vis[a].x - vis[b].x, vis[a].y - vis[b].y) < 0.9 * vis[a].L) overlaps++; }
  const lessons = s.events.filter((e) => e.type === 'lesson-due').length;
  const h = sim(F9, {}, ALL); Object.assign(h.body, { x: 650, y: 400 }); let wHit = null, p0 = 0, st0 = 0, hp0 = 0;
  for (let i = 0; i < 90 * 60 && !wHit; i++) { service(h); const p = h.lungePreview(0, -1), c = p && p.hit ? h.carById(p.hit.car) : null; const go = !!(p && p.ready && c && c.white && h.body.mode !== 'lunge'); if (go) { p0 = h.run.points; st0 = h.stealth.points; hp0 = h.body.health; } const e0 = h.events.length; h.step(go ? { mx: 0, my: -1, aPress: true } : {}); for (let k = 0; k < (go ? 30 : 0); k++) h.step({}); wHit = h.events.slice(e0).find((e) => e.type === 'impact' && e.white && e.lost > 0) || null; if (!wHit && go) Object.assign(h.body, { x: 650, y: 400, vx: 0, vy: 0, mode: 'idle' }); }
  const g = sim(F9, {}, ALL); let red = null; for (let i = 0; i < 20 * 60 && !red; i++) { g.step({}); red = g.onRoad().find((c) => c.red && c.x > 50 && c.path.road === 'A'); }
  const nx = red.x + red.L / 2, by = red.y; Object.assign(g.body, { x: nx + 200, y: by }); const seen0 = g.whiteHides(red, nx, by); g.cars.push({ id: 'wtest', white: true, x: nx + 100, y: by, h: 0, L: red.L, W: red.W, gone: false }); const hid = g.whiteHides(red, nx, by); g.cars.pop();
  const ok = s.level.lanes.length === 4 && dir[0][0] === -1 && dir[1][0] === 1 && dir[2][1] === -1 && dir[3][1] === 1 && dir[0][2] === 348 && dir[1][2] === 292 && dir[2][2] === 372 && dir[3][2] === 428 &&
    lanesW.size === 4 && [...lanesR].every((l) => l === 1 || l === 3) && maxRed === 1 && overlaps === 0 && yields > 0 && lessons === 0 && !!wHit && wHit.points === 0 && h.run.points === p0 && h.stealth.points === st0 && h.body.health < hp0 && !seen0 && hid;
  return { ok, detail: `lanes: A west at y ${dir[0][2]}, A east ${dir[1][2]}, B north at x ${dir[2][2]}, B south ${dir[3][2]}; white lanes ${[...lanesW].sort().join(',')}, red lanes ${[...lanesR].sort().join(',')}; most red cars on the road ${maxRed}; overlapping car pairs ${overlaps}; give-way holds ${(yields / 60).toFixed(0)} car-seconds; lessons ${lessons}; a dash into a white car: ${wHit ? Math.round(wHit.lost) + ' damage, ' + wHit.points + ' points, run score ' + p0 + ' to ' + h.run.points : 'none'}; a white car between the red car and the dummy hides it: ${hid} (without: ${seen0})` };
});

check('10.9 (rows 735, 736): the proportional field: the forward cone, its edges through the front corners (its centre behind the car), reaches perception.coneRadius ahead of the nose in perception.forwardGrades equal rings (AWARE, SLOWING, CRAWLING); the side cones perception.sideConeRatio of it, in perception.sideGrades (AWARE, SLOWING); the radius grows with each crash spot remembered, to perception.coneGrowthMax; at the junction no car waits long', () => {
  const g = sim(F9, {}, ALL); let c = null; for (let i = 0; i < 30 * 60 && !c; i++) { g.step({}); c = g.onRoad().find((q) => q.red && q.path.road === 'A' && q.x > 60 && q.x < 300); }
  const D = Math.PI / 180, R = g.coneReach(), br = g.P['body.radius'], A = F9['perception.forwardConeAngle'], at = (deg, r) => [c.x + Math.cos(c.h + deg * D) * r, c.y + Math.sin(c.h + deg * D) * r], cone = (pt) => { const k = g.coneOf(c, pt[0], pt[1]); return k ? k.cone : 'none'; };
  const ca = Math.cos(c.h), sa = Math.sin(c.h), ahead = (x, y) => [c.x + ca * (c.L / 2 + x) - sa * y, c.y + sa * (c.L / 2 + x) + ca * y], tA = Math.tan(A * D); // from the nose: x ahead, y to the side
  const geo = { fwd: cone(ahead(0.95 * R.f, c.W / 2 + 0.95 * R.f * tA - 3)), fwdOut: cone(ahead(R.f + br + 8, 10)), corner: cone(ahead(0, c.W / 2 - 0.5)), past: cone(ahead(0, c.W / 2 + 2)), edgeOut: cone(ahead(150, c.W / 2 + 150 * tA + 2)), side: cone(at(60, 0.9 * R.s)), sideOut: cone(at(60, R.s + br + 6)), other: cone(at(-60, 0.5 * R.s)) }; // row 736: forward edges through the front corners
  const gs = (k, f) => g.gradeStage(k, f * (k === 'side' ? R.s : R.f), k === 'side' ? R.s : R.f), grades = [gs('forward', 0.2), gs('forward', 0.5), gs('forward', 0.9), gs('side', 0.3), gs('side', 0.8)];
  const keep = g.memory, grow = (n) => { g.memory = () => Array.from({ length: n }, (_, i) => i); const f = g.coneReach().f; g.memory = keep; return f; }, f0 = grow(0), f3 = grow(3), f20 = grow(20);
  const j = sim(F9, {}, ALL); Object.assign(j.body, { x: 760, y: 620 }); const stop = new Map(); let longest = 0; for (let i = 0; i < 180 * 60; i++) { j.step({}); for (const q of j.onRoad()) { if (q.v < 1) stop.set(q.id, (stop.get(q.id) || 0) + 1 / 60); else stop.delete(q.id); longest = Math.max(longest, stop.get(q.id) || 0); } }
  const r = F9['perception.coneRadius'], gm = F9['perception.coneGrowthPerMemory'], cap = F9['perception.coneGrowthMax'];
  const ok = geo.fwd === 'forward' && geo.fwdOut === 'none' && geo.corner === 'forward' && geo.past === 'side' && geo.edgeOut === 'side' && g.cornerApex(c) < -c.L / 2 && geo.side === 'side' && geo.sideOut === 'none' && geo.other === 'side' && grades.join() === '3,2,1,2,1' && Math.abs(R.s - r * F9['perception.sideConeRatio']) < 1e-6 && Math.abs(f0 - r) < 1e-6 && Math.abs(f3 - r * (1 + 3 * gm)) < 1e-6 && Math.abs(f20 - r * (1 + cap)) < 1e-6 && longest < 4;
  return { ok, detail: `forward reach ${R.f} ahead of the nose (${Math.round(R.f / g.P['world.height'] * 100)}% of the screen height), its edges through the front corners: just inside a corner ${geo.corner}, just outside ${geo.past}, just past its edge 150 ahead ${geo.edgeOut}; its centre ${(-g.cornerApex(c) - c.L / 2).toFixed(0)} behind the rear bumper; ${geo.fwd} inside, ${geo.fwdOut} past its reach; sides ${R.s.toFixed(0)} from the car middle: sides ${geo.side} / ${geo.other}, ${geo.sideOut} past; stages by equal grades, forward at 0.2, 0.5, 0.9 of its reach ${grades.slice(0, 3).join(', ')}, side at 0.3, 0.8 ${grades.slice(3).join(', ')}; radius with 0, 3, 20 crash spots remembered: ${f0}, ${f3.toFixed(1)}, ${f20.toFixed(1)}; the longest any car stood in 3 minutes of traffic: ${longest.toFixed(1)} s` };
});

// ---------- registry and frozen builds
check('Prototype 10 values are registered (registry first)', () => {
  const reg = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'content/params/tuning.parameters.json'), 'utf8')).entries.map((e) => e.id));
  const src = ['prototypes/p6/sim.js'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const ids = [...src.matchAll(/'((?:traffic|perception|learning|proto\.(?:driver|learn|unstick|standoff|swerve|return|honk|traffic|learningEnabled|sensorStraight|carYaw))[a-zA-Z0-9_.]*)'\s*:/g)].map((m) => m[1]);
  const mine = ['prototypes/p10/testroad.js', 'prototypes/p10/game_p10.js'].map((f) => fs.readFileSync(path.join(ROOT, f), 'utf8')).join('\n');
  const used = [...mine.matchAll(/(?:P|F)\['([a-zA-Z0-9_.]+)'\]/g)].map((m) => m[1]);
  const stage = Object.values(SF.stages).flatMap((st) => Object.keys(st.p10));
  const missing = [...new Set(ids.concat(used, stage))].filter((i) => !reg.has(i));
  return { ok: missing.length === 0, detail: missing.length ? 'missing ' + missing.join(', ') : `the 29 sim-only IDs, ${new Set(used).size} IDs the test road reads, and every stage value are registered` };
});
check('Shared code untouched; frozen builds hold (Prototype 9, 8.4, and each frozen test page in build.py)', () => {
  const diff = cp.execSync('git diff --name-only HEAD -- prototypes/p6 prototypes/p7 prototypes/p8 prototypes/jump prototypes/controls', { cwd: ROOT }).toString().trim();
  const p9 = path.join(ROOT, 'prototypes/p9/dummies_p9.html'), keep = fs.readFileSync(p9);
  cp.execSync('python3 prototypes/p9/build.py', { cwd: ROOT, stdio: 'ignore' });
  const rebuilt = md5(p9); fs.writeFileSync(p9, keep);
  const p84 = md5(path.join(ROOT, 'prototypes/p8/dummies_p8_4.html'));
  const frozen = [...fs.readFileSync(path.join(__dirname, 'build.py'), 'utf8').matchAll(/'(10\.\d)': \{[^}]*'page': '([^']+)', 'frozen': '([0-9a-f]{32})'/g)].map((m) => ({ id: m[1], want: m[3], got: md5(path.join(__dirname, m[2])) }));
  return { ok: !diff && rebuilt === 'be163e7d014344e062965986b3da5786' && p84 === '9f5549201d88891f9f0b22c461602909' && frozen.length >= 3 && frozen.every((f) => f.got === f.want),
    detail: `shared diff: ${diff || 'none'}; Prototype 9 rebuilt ${rebuilt}; 8.4 ${p84}; ${frozen.map((f) => `${f.id} ${f.got === f.want ? 'holds' : 'CHANGED ' + f.got}`).join('; ')}` };
});

if (process.argv.includes('--page')) {
  const http = require('http');
  const done = new Promise((resolve) => {
    const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
    srv.listen(0, async () => {
      const { chromium } = require('playwright'); const br = await chromium.launch();
      for (const page of ['dummies_p10.html', 'dummies_p10_2.html', 'dummies_p10_3.html', 'dummies_p10_4.html', 'dummies_p10_5.html', 'dummies_p10_6.html', 'dummies_p10_7.html', 'dummies_p10_8.html', 'dummies_p10_9.html']) {
        const pg = await br.newPage(); const errs = [];
        pg.on('pageerror', (e) => errs.push(e.message));
        await pg.goto(`http://127.0.0.1:${srv.address().port}/prototypes/p10/${page}`); await pg.waitForTimeout(600);
        await pg.keyboard.press('Enter'); await pg.waitForTimeout(3000);
        const st = await pg.evaluate(() => { const s = window.__p10.sim; return { t: s.t, level: s.levelId }; });
        results.push([errs.length === 0 && st.t > 2 && st.level === 'junction', `${page} plays: no page errors, the sim runs on the junction`, `t ${st.t.toFixed(1)} s, errors ${errs.length ? errs.slice(0, 2).join(' | ') : 0}`]);
        if (page === 'dummies_p10_2.html') { // stand in road A's north lane until the lesson; the clip, then the fitting, then rung 1
          await pg.evaluate(() => { window.__park = setInterval(() => { const s = window.__p10.sim, b = s.body; if (b && b.alive && s.rung === 0 && s.phase === 'play' && !s.lesson) { b.x = 200; b.y = 292; b.vx = 0; b.vy = 0; } }, 16); });
          let seen = { clip: false, fit: false };
          for (let i = 0; i < 240; i++) {
            await pg.waitForTimeout(250);
            const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, frames: window.__p10.clip ? window.__p10.clip.frames.length : 0, rung: window.__p10.sim.rung }));
            if (q.ph === 'lesson' && q.lt != null && q.lt < F2['duel.lessonClipSeconds'] && q.frames > 60) seen.clip = true;
            if (q.ph === 'lesson' && q.lt != null && q.lt > F2['duel.lessonClipSeconds'] + F2['duel.lessonHoldSeconds'] + 0.2) seen.fit = true;
            if (q.rung === 1 && q.ph === 'play') break;
          }
          const end = await pg.evaluate(() => ({ rung: window.__p10.sim.rung, ph: window.__p10.sim.phase }));
          results.push([seen.clip && seen.fit && end.rung === 1 && end.ph === 'play' && errs.length === 0, '10.2 page: the lesson shows the training clip, then the sensor fitted, then play resumes at rung 1', `clip ${seen.clip}, fitting ${seen.fit}, rung ${end.rung}, phase ${end.ph}, errors ${errs.length}`]);
        }
        if (page === 'dummies_p10_3.html') { // rung 1 → 2 by a late step-in; then Legs 1 by drone; then K jumps
          await pg.evaluate(() => { window.__park = setInterval(() => { const s = window.__p10.sim, b = s.body, c = s.onRoad()[0]; if (b && b.alive && s.lesson && !window.__moved) { window.__moved = 1; b.x = 600; b.y = 520; b.vx = 0; b.vy = 0; } if (!b || !b.alive || s.rung !== 1 || s.phase !== 'play' || s.lesson || !c || c.path.road !== 'A') return; const nx = c.x + Math.cos(c.h) * c.L / 2; if (nx > 150 && nx < 300 && window.__did !== c.id) { window.__did = c.id; const p = window.DUMMIES.pathAt(c.path, c.s + c.L / 2 + 45); b.x = p.x; b.y = p.y + 8; b.vx = 0; b.vy = 0; } }, 16); });
          let fit = false; for (let i = 0; i < 480; i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, rung: window.__p10.sim.rung })); if (q.ph === 'lesson' && q.lt > F3['duel.lessonClipSeconds'] + F3['duel.lessonHoldSeconds'] + 0.2) fit = true; if (q.rung === 2 && q.ph === 'play') break; }
          await pg.evaluate(() => { clearInterval(window.__park); window.__park2 = setInterval(() => { const s = window.__p10.sim, b = s.body; if (b && b.alive && !s.has('jump')) { b.x = 600; b.y = 394; b.vx = 0; b.vy = 0; } }, 16); });
          for (let i = 0; i < 480; i++) { await pg.waitForTimeout(125); if (await pg.evaluate(() => window.__p10.sim.has('jump') && !window.__p10.sim.delivery)) break; }
          await pg.evaluate(() => clearInterval(window.__park2)); await pg.waitForTimeout(1200);
          await pg.keyboard.down('ArrowDown'); await pg.waitForTimeout(400); await pg.keyboard.press('k'); await pg.waitForTimeout(60);
          const jumped = await pg.evaluate(() => window.__p10.sim.events.some((e) => e.type === 'jump')); await pg.keyboard.up('ArrowDown');
          const end = await pg.evaluate(() => ({ rung: window.__p10.sim.rung, jump: window.__p10.sim.has('jump') }));
          results.push([fit && end.rung === 2 && end.jump && jumped && errs.length === 0, '10.3 page: the side-sensor lesson shows; Legs 1 arrives; K jumps', `fitting ${fit}, rung ${end.rung}, Legs 1 ${end.jump}, jumped ${jumped}, errors ${errs.length}`]);
        }
        if (page === 'dummies_p10_4.html') { // rung 2 → 3: put the dummy on the plinth; dash down at a road A car; the lidar fitted
          await pg.evaluate(() => { // the probe's plinth bot, driving the page's sim: climb with a dash-jump, dash down at a road A car
            const s = window.__p10.sim, step = s.step.bind(s), D = Math.PI / 180, wr = (a) => Math.atan2(Math.sin(a), Math.cos(a));
            const to = (b, x, y) => { const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
            const bot = () => { const b = s.body; if (!b.alive || s.lesson || s.rung !== 2) return null; const can = s.dashFitted() && b.mode !== 'lunge' && b.mode !== 'recover';
              if (!b.raised) { if (b.mode === 'lunge') return { bPress: b.lunge && b.lunge.t > 0.03 }; if (b.mode === 'jump') return {}; if (b.y > 75 && Math.abs(b.x - 360) > 10) return to(b, 360, b.y > 260 ? b.y : 70);
                if (Math.hypot(275 - b.x, 70 - b.y) > 16) return to(b, 275, 70); return { mx: 0, my: 0.12, aPress: can && Math.abs(wr(Math.PI / 2 - b.facing)) < 8 * D }; }
              const c = s.onRoad().find((q) => !q.spent && q.path.road === 'A' && q.x < b.x + 30); if (!c) return to(b, 275, 226);
              const tx = c.x + (c.vx || 0) * 0.1, ty = c.y, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
              if (d > 160) return Object.assign(to(b, 275, 226), Math.hypot(275 - b.x, 226 - b.y) < 7 ? { mx: Math.cos(ang) * 0.05, my: Math.sin(ang) * 0.05 } : {});
              return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can && Math.abs(wr(ang - b.facing)) < 15 * D }; };
            s.step = (cmd) => { const c = bot(); if (s.lesson && !window.__moved && s.body.alive) { window.__moved = 1; Object.assign(s.body, { x: 600, y: 520, vx: 0, vy: 0, raised: false }); } return step(c || cmd); };
          });
          let fit = false, rung = 2; for (let i = 0; i < 720; i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, rung: window.__p10.sim.rung })); rung = q.rung; if (q.ph === 'lesson' && q.lt > F4['duel.lessonClipSeconds'] + F4['duel.lessonHoldSeconds'] + 0.2) fit = true; if (q.rung === 3 && q.ph === 'play') break; }
          results.push([fit && rung === 3 && errs.length === 0, '10.4 page: a dash from the plinth teaches rung 3; the lidar is fitted', `fitting ${fit}, rung ${rung}, errors ${errs.length}`]);
        }
        if (page === 'dummies_p10_5.html') { // rung 3 → 4: dash through the barrier's gap at a road A car; the cameras linked; then E picks up a cone and puts it down
          await pg.evaluate(() => { // a fresh run with the bot from its first tick, as qa/testroad.js's gap bot (offset 0): its timing decides whether the car first sees the dummy through the gap and waits
            window.__p10.newSim(); const s = window.__p10.sim, step = s.step.bind(s), D = Math.PI / 180, wr = (a) => Math.atan2(Math.sin(a), Math.cos(a));
            const to = (b, x, y) => { const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
            const bot = () => { const b = s.body; if (!b.alive || s.lesson || s.rung !== 3) return null; const can = s.dashFitted() && b.mode !== 'lunge' && b.mode !== 'recover';
              const c = s.onRoad().find((q) => !q.spent && q.path.road === 'A' && q.x + (q.vx || 0) * 0.15 > 140 && q.x + (q.vx || 0) * 0.15 < 236); if (!c) return to(b, 188, 414);
              const ang = Math.atan2(c.y - b.y, c.x + (c.vx || 0) * 0.15 - b.x); return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can && Math.abs(wr(ang - b.facing)) < 15 * D }; };
            s.step = (cmd) => { const c = bot(); return step(c || cmd); };
          });
          let fit = false, rung = 3; for (let i = 0; i < 1920; i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, rung: window.__p10.sim.rung })); rung = q.rung; if (q.ph === 'lesson' && q.lt > F5['duel.lessonClipSeconds'] + F5['duel.lessonHoldSeconds'] + 0.2) fit = true; if (q.rung === 4 && q.ph === 'play') break; }
          await pg.evaluate(() => { const s = window.__p10.sim; s.run.owned.hands1 = true; const cn = s.cones[0]; Object.assign(s.body, { x: cn.x - 18, y: cn.y, vx: 0, vy: 0, facing: 0 }); });
          await pg.keyboard.press('e'); await pg.waitForTimeout(300);
          const held = await pg.evaluate(() => !!window.__p10.sim.body.held);
          await pg.evaluate(() => Object.assign(window.__p10.sim.body, { vx: 0, vy: 0 })); await pg.keyboard.press('e'); await pg.waitForTimeout(300);
          const down = await pg.evaluate(() => !window.__p10.sim.body.held && window.__p10.sim.events.some((e) => e.type === 'drop'));
          results.push([fit && rung === 4 && held && down && errs.length === 0, '10.5 page: a dash out of cover teaches rung 4; the link is fitted; E picks up a cone and puts it down', `fitting ${fit}, rung ${rung}, E picked up ${held}, E put down ${down}, errors ${errs.length}`]);
        }
        if (page === 'dummies_p10_6.html') { // rung 4 → 5: a cone laid in a road A car's lane; strike as it swerves round it; the update fitted; then C ducks
          await pg.evaluate(() => {
            window.__p10.newSim(); const s = window.__p10.sim, step = s.step.bind(s); let laid = null, struck = null;
            const to = (b, x, y) => { const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
            const bot = () => { const b = s.body; if (!b.alive || s.lesson || s.rung !== 4) return null;
              const c = s.onRoad().find((x) => x.red && !x.spent && x.path.road === 'A'); if (!c) return to(b, 720, 600);
              if (laid !== c.id && c.x > -100 && c.x < 0) { Object.assign(s.cones[0], { x: 600, y: c.y, state: 'free', vx: 0, vy: 0 }); laid = c.id; }
              if (laid === c.id && struck !== c.id && c.cause === 'cone' && c.dodge && c.x > 480 && c.x < 540 && b.mode !== 'lunge' && b.mode !== 'recover') {
                struck = c.id; Object.assign(b, { x: c.x + 50, y: 244, vx: 0, vy: 0 }); const ang = Math.atan2(c.y - b.y, c.x + 25 - b.x); b.facing = ang; return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true }; }
              return laid === c.id ? {} : to(b, 720, 600); };
            s.step = (cmd) => { const c = bot(); return step(c || cmd); };
          });
          let fit = false, rung = 4; for (let i = 0; i < 1920; i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, rung: window.__p10.sim.rung })); rung = q.rung; if (q.ph === 'lesson' && q.lt > F6['duel.lessonClipSeconds'] + F6['duel.lessonHoldSeconds'] + 0.2) fit = true; if (q.rung === 5 && q.ph === 'play') break; }
          await pg.evaluate(() => { const s = window.__p10.sim; s.run.owned.duck1 = true; Object.assign(s.body, { x: 590, y: 418, vx: 0, vy: 0 }); });
          await pg.keyboard.down('c'); await pg.waitForTimeout(300); const ducked = await pg.evaluate(() => !!window.__p10.sim.body.duck);
          await pg.keyboard.up('c'); await pg.waitForTimeout(300); const stood = await pg.evaluate(() => !window.__p10.sim.body.duck);
          results.push([fit && rung === 5 && ducked && stood && errs.length === 0, '10.6 page: a hit while it swerves round a cone teaches rung 5; the update is fitted; holding C ducks, letting go stands', `fitting ${fit}, rung ${rung}, ducked ${ducked}, stood ${stood}, errors ${errs.length}`]);
        }
        if (page === 'dummies_p10_7.html') { // rung 5 → 6: two strikes from the same spot; the clip marks the spot; memory fitted; at rung 6 the car checks the spot
          await pg.evaluate(() => {
            window.__p10.newSim(); const s = window.__p10.sim, step = s.step.bind(s), plan = [{ road: 'A', x: 559, y: 421 }, { road: 'A', x: 559, y: 421 }, { road: 'A', x: 559, y: 421, hold: true }]; let i = 0, placed = null, n0 = 0;
            const bot = () => { const b = s.body, P = plan[Math.min(i, plan.length - 1)]; if (!b.alive || s.phase !== 'play') return null;
              if (s.crashes.length > n0) { n0 = s.crashes.length; i++; placed = null; return {}; }
              const c = s.onRoad().find((x) => x.red && !x.spent);
              if (!c || c.path.road !== P.road) { if (!['lunge', 'knock', 'recover'].includes(b.mode)) Object.assign(b, { x: 720, y: 600, vx: 0, vy: 0 }); return {}; }
              if (placed !== c.id) { Object.assign(b, { x: P.x, y: P.y, vx: 0, vy: 0 }); placed = c.id; }
              if (P.hold) return { duck: true };
              const d0 = Math.hypot(c.x - b.x, c.y - b.y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
              return d < s.reach() + 6 && b.mode !== 'lunge' && b.mode !== 'recover' && c.v > 15 ? { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true } : { duck: true }; };
            s.step = (cmd) => { const c = bot(); return step(c || cmd); };
          });
          let fit = false, rung = 5, sameSpot = false; for (let i = 0; i < 1920; i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, rung: window.__p10.sim.rung, prev: window.__p10.clip ? window.__p10.clip.prev : null, habit: !!(window.__p10.clip && window.__p10.clip.info && window.__p10.clip.info.habit) })); rung = q.rung; if (q.ph === 'lesson' && q.habit && q.prev === 1) sameSpot = true; if (q.ph === 'lesson' && q.lt > F7['duel.lessonClipSeconds'] + F7['duel.lessonHoldSeconds'] + 0.2) fit = true; if (q.rung === 6 && q.ph === 'play') break; }
          let checked = false; for (let i = 0; i < 480 && !checked; i++) { await pg.waitForTimeout(125); checked = await pg.evaluate(() => window.__p10.sim.onRoad().some((c) => c.red && (c.checks || []).some((m) => m.n === 1)) && window.__p10.sim.expected()); }
          const crashes = await pg.evaluate(() => window.__p10.sim.crashes.length);
          results.push([fit && sameSpot && rung === 6 && crashes >= 2 && checked && errs.length === 0, '10.7 page: two strikes from one spot leave two outlines; the clip marks the same spot; memory fitted; at rung 6 the car checks that spot and expects the dummy there', `crashes ${crashes}, same spot ${sameSpot}, fitting ${fit}, rung ${rung}, checks the spot ${checked}, errors ${errs.length}`]);
        }
        if (page === 'dummies_p10_8.html') { // rung 6 → 7: seen, ducked, struck within the clip; the clip draws the ghost; search fitted; at rung 7 the next car leaves a ghost and finds the dummy
          await pg.evaluate(() => {
            window.__p10.newSim(); const s = window.__p10.sim, step = s.step.bind(s); let phase = 'show', car = null, spot = [170, 203];
            const to = (b, x, y) => { const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
            Object.assign(s.body, { x: spot[0], y: spot[1], vx: 0, vy: 0 });
            let placed = false; const bot = () => { const b = s.body; if (!b.alive || s.phase !== 'play') return null; if (s.rung >= 7) { spot = [559, 421]; if (!placed) { placed = true; Object.assign(b, { x: spot[0], y: spot[1], vx: 0, vy: 0 }); } } // at rung 7, a spot it does not remember, behind the south planter row, where its forward cone has it from either lane (put there: a walk from the respawn snags on a planter row)
              const c = s.onRoad().find((x) => x.red && !x.spent && x.path.road === 'A'); if (!c) { phase = 'show'; car = null; return to(b, spot[0], spot[1]); }
              if (car !== c.id) { car = c.id; phase = 'show'; }
              if (phase === 'show') { if (Math.hypot(spot[0] - b.x, spot[1] - b.y) > 6) return to(b, spot[0], spot[1]); if (c.noticed || (c.hz && c.v < 1)) phase = 'hide'; return {}; }
              if (c.v > 15) { const d0 = Math.hypot(c.x - b.x, c.y - b.y), k = 0.1 + d0 / 600, tx = c.x + (c.vx || 0) * k, ty = c.y + (c.vy || 0) * k, d = Math.hypot(tx - b.x, ty - b.y), ang = Math.atan2(ty - b.y, tx - b.x);
                if (d < s.reach() + 6 && b.mode !== 'lunge' && b.mode !== 'recover') return { mx: Math.cos(ang) * 0.3, my: Math.sin(ang) * 0.3, aPress: true, duck: true }; }
              return { duck: true }; };
            s.step = (cmd) => { const c = bot(); return step(c || cmd); };
          });
          let fit = false, rung = 6, ghostClip = false; for (let i = 0; i < 1920; i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ ph: window.__p10.sim.phase, lt: window.__p10.lessonT, rung: window.__p10.sim.rung, g: !!(window.__p10.clip && window.__p10.clip.info && window.__p10.clip.info.search && window.__p10.clip.seenAt) })); rung = q.rung; if (q.ph === 'lesson' && q.g) ghostClip = true; if (q.ph === 'lesson' && q.lt > F8['duel.lessonClipSeconds'] + F8['duel.lessonHoldSeconds'] + 0.2) fit = true; if (q.rung === 7 && q.ph === 'play') break; }
          let ghost = false, found = false; for (let i = 0; i < 480 && !(ghost && found); i++) { await pg.waitForTimeout(125); const q = await pg.evaluate(() => ({ g: window.__p10.sim.onRoad().some((c) => c.red && c.lkp), f: window.__p10.sim.events.some((e) => e.type === 'search-found') })); ghost = ghost || q.g; found = found || q.f; }
          results.push([fit && ghostClip && rung === 7 && ghost && found && errs.length === 0, '10.8 page: seen, then struck from cover within the clip; the clip draws the ghost; search fitted; at rung 7 the next car leaves a ghost and finds the dummy near it', `ghost in the clip ${ghostClip}, fitting ${fit}, rung ${rung}, ghost on the road ${ghost}, found ${found}, errors ${errs.length}`]);
          // Row 729: the lure's field note shows once per save file: not again after R, nor after a reload; again after a new save file (N, paused)
          const peekRig = () => pg.evaluate(() => { const s = window.__p10.sim, step = s.step.bind(s), spot = [617, 421]; s.rung = 7; let phase = 'show', car = null; Object.assign(s.body, { x: spot[0], y: spot[1], vx: 0, vy: 0 });
            const bot = () => { const b = s.body; if (!b.alive || s.phase !== 'play') return null; const c = s.onRoad().find((x) => x.red && !x.spent && x.path.road === 'A'); if (!c) { phase = 'show'; car = null; return {}; }
              if (car !== c.id) { car = c.id; phase = 'show'; } if (phase === 'show') { if (c.noticed || (c.hz && c.v < 1)) phase = 'hide'; return {}; } return { duck: true }; };
            s.step = (cmd) => { const c = bot(); return step(c || cmd); }; });
          const ghostTip = async () => { await peekRig(); for (let i = 0; i < 400; i++) { await pg.waitForTimeout(100); const q = await pg.evaluate(() => { const s = window.__p10.sim, e = s.events.find((x) => x.type === 'search'); return e && s.t - e.t > 0.2 ? { tip: window.__p10.tip ? window.__p10.tip.id : null, saved: !!window.__p10.save.read().tips['lure.ghost'], stored: (() => { try { return !!JSON.parse(localStorage.getItem(window.__p10.save.key) || '{}').tips['lure.ghost']; } catch (er) { return null; } })() } : null; }); if (q) return q; } return { tip: 'no ghost', saved: null }; };
          await pg.evaluate(() => { window.__p10.save.clear(); window.__p10.newSim(); });
          const first = await ghostTip();
          await pg.keyboard.press('r'); await pg.waitForTimeout(200); const afterR = await ghostTip();
          await pg.reload(); await pg.waitForTimeout(600); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300); const afterReload = await ghostTip();
          await pg.keyboard.press('p'); await pg.keyboard.press('n'); await pg.keyboard.press('p'); await pg.evaluate(() => window.__p10.newSim()); const afterNew = await ghostTip();
          results.push([first.tip === 'lure.ghost' && first.stored && afterR.tip === null && afterR.saved && afterReload.tip === null && afterReload.saved && afterNew.tip === 'lure.ghost' && errs.length === 0,
            '10.8 page (row 729): the lure field note shows once per save file: not after R, not after a reload; again after a new save file (N, paused)',
            `first ghost: ${first.tip}, stored ${first.stored}; after R: ${afterR.tip}; after a reload: ${afterReload.tip}; after N: ${afterNew.tip}; errors ${errs.length}`]);
        }
        await pg.close();
      }
      await br.close(); srv.close(); resolve();
    });
  });
  done.then(report);
} else report();
function report() {
  for (const [ok, name, detail] of results) console.log(`${ok ? 'PASS' : 'FAIL'} ${name} (${detail})`);
  const n = results.filter((r) => r[0]).length; console.log(`\n${n}/${results.length} passed`); process.exitCode = n === results.length ? 0 : 1;
}
