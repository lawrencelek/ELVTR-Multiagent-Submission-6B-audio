// Prototype 10 checks (GDD Edits 101–102). node prototypes/p10/test_p10.js [--page]
// Headless sim checks for each test's values (sim_flags.json stages), on today's code; frozen-build checks; --page also
// loads every test's page in Playwright and plays 10.2's lesson through.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const X = require(path.join(ROOT, 'prototypes/p6/sim.js'));
const { TestRoadSim, junctionLevel } = require(path.join(__dirname, 'testroad.js'));
const SF = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim_flags.json'), 'utf8')), F1 = SF.stages['10.1'].flags, F2 = SF.stages['10.2'].flags, F3 = SF.stages['10.3'].flags;
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
check('Shared code untouched; frozen builds hold (Prototype 9, 8.4, 10.1, 10.2)', () => {
  const diff = cp.execSync('git diff --name-only HEAD -- prototypes/p6 prototypes/p7 prototypes/p8 prototypes/jump prototypes/controls', { cwd: ROOT }).toString().trim();
  const p9 = path.join(ROOT, 'prototypes/p9/dummies_p9.html'), keep = fs.readFileSync(p9);
  cp.execSync('python3 prototypes/p9/build.py', { cwd: ROOT, stdio: 'ignore' });
  const rebuilt = md5(p9); fs.writeFileSync(p9, keep);
  const p84 = md5(path.join(ROOT, 'prototypes/p8/dummies_p8_4.html')), p101 = md5(path.join(__dirname, 'dummies_p10.html')), p102 = md5(path.join(__dirname, 'dummies_p10_2.html'));
  return { ok: !diff && rebuilt === 'be163e7d014344e062965986b3da5786' && p84 === '9f5549201d88891f9f0b22c461602909' && p101 === '82ab5e55d243ee500d6dfcaa60af74e6' && p102 === '9dd14c5877128390fbad2595e86edce7', detail: `shared diff: ${diff || 'none'}; Prototype 9 rebuilt ${rebuilt}; 8.4 ${p84}; 10.1 page ${p101}; 10.2 page ${p102}` };
});

if (process.argv.includes('--page')) {
  const http = require('http');
  const done = new Promise((resolve) => {
    const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
    srv.listen(0, async () => {
      const { chromium } = require('playwright'); const br = await chromium.launch();
      for (const page of ['dummies_p10.html', 'dummies_p10_2.html', 'dummies_p10_3.html']) {
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
