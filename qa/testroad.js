// Prototype 10 probes on the Monument test road (handover v2 §14, §16; GDD Edits 101–102). Headless in node: the base Sim
// and prototypes/p10/testroad.js, with a test's values (prototypes/p10/sim_flags.json, by stage). One runner covers what
// qa/stand.js, qa/policy.js, qa/escalation.js and qa/flank.js measure on Prototype 9: standing, walking in, charging, dashing,
// the flank, escalation. Two modes: 'lesson' starts where the build starts (10.2: rung 0, on foot); 'trained' starts at
// the build's top rung with Battery 1 fitted, to measure that rung alone.
//   node qa/testroad.js [--stage 10.2] [--secs 300] [--esc 600] [--offsets 0,7,13] [--out qa/baseline/p10_2.json]
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const X = require(path.join(ROOT, 'prototypes/p6/sim.js'));
const { TestRoadSim } = require(path.join(ROOT, 'prototypes/p10/testroad.js'));
const SF = JSON.parse(fs.readFileSync(path.join(ROOT, 'prototypes/p10/sim_flags.json'), 'utf8'));
const o = { stage: SF.current, secs: 300, esc: 600, offsets: [0, 7, 13], out: null };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const k = av[i].replace(/^--/, ''), v = av[i + 1]; if (k === 'offsets') o.offsets = v.split(',').map(Number); else if (k === 'out' || k === 'stage') o[k] = v; else o[k] = +v; }
const ST = SF.stages[o.stage], FLAGS = ST.flags;
const DEG = Math.PI / 180, wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

// Policies. Closed (rung 1): stand*, charge. Open: walkin (on foot), aim and flank (the dash).
const POLICIES = {
  stand: { home: { x: 200, y: 292 } },      // in road A's north lane (lane 1), on its line, west of the junction
  standSouth: { home: { x: 200, y: 348 } }, // in road A's south lane (lane 0), on its line
  standOff: { home: { x: 200, y: 300 } },   // in the north lane, 8 off its line toward the other lane (D105)
  charge: { home: { x: 600, y: 292 } },     // waits in the north lane; sprints head-on at each car in it, dashes in reach, steps off
  walkin: { home: { x: 300, y: 410 } },     // waits on the pavement; walks into the red car's path, 110 ahead of it: late, from the side
  wander: { home: { x: 400, y: 320 } },     // P3's scripted dummy
  aim: { home: { x: 300, y: 410 } },        // from the pavement, dashes at the nearest car within 150 (10.0's read and lunge)
  flank: { home: { x: 300, y: 410 } },      // comes alongside a moving car, dashes into its side
};

function run(policy, offset, secs, mode) {
  const pol = POLICIES[policy], trained = mode === 'trained';
  const s = new TestRoadSim(Object.assign({}, FLAGS, trained ? { 'duel.startRung': FLAGS['duel.topRung'] } : {}), trained ? { owned: { battery1: true } } : null);
  const service = () => { if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop(); else if (s.phase === 'lesson') s.continueLesson(); };
  for (let k = 0; k < offset * 60; k++) { service(); s.step({}); }
  const b = () => s.body, home = pol.home, can = () => s.dashFitted() && b().mode !== 'lunge' && b().mode !== 'recover';
  const goTo = (tx, ty, k) => { const dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d * (k || 1), my: dy / d * (k || 1) } : {}; };
  const live = () => s.onRoad().filter((c) => !c.spent);
  const done = new Set(); let cur = null, tries = 0;
  if (policy === 'charge') { b().x = home.x; b().y = home.y; for (const c of s.cars) done.add(c.id); } // it starts in its lane, and charges only cars that arrive after it
  const act = {
    stand: () => goTo(home.x, home.y), standSouth: () => goTo(home.x, home.y), standOff: () => goTo(home.x, home.y),
    charge: () => {
      const c = s.onRoad().find((q) => q.lane === 1 && !done.has(q.id));
      if (!b().alive) return {};
      if (c && c.spent) { done.add(c.id); if (cur === c.id) cur = null; }
      if (!c || c.spent) { const g = s.onRoad().find((q) => done.has(q.id)); return g ? goTo(b().x, 420) : goTo(home.x, home.y); }
      const nx = c.x + Math.cos(c.h) * c.L / 2, gap = b().x - nx;
      if (cur !== c.id && gap > 0 && nx > -c.L && Math.abs(b().y - home.y) < 6) { cur = c.id; tries++; }
      if (cur !== c.id) return goTo(home.x, home.y);
      if (b().mode === 'recover' || (c.v < 1 && gap < 40) || gap < -c.L) { done.add(c.id); cur = null; return goTo(b().x, 420); }
      const ang = Math.atan2(c.y - b().y, nx - b().x);
      return { mx: Math.cos(ang), my: Math.sin(ang), aPress: can() && gap < s.reach() + 13 };
    },
    walkin: () => {
      const c = s.onRoad().find((q) => q.red);
      if (!c || !b().alive) return goTo(home.x, home.y);
      const p = X.pathAt(c.path, c.s + c.L / 2 + 110);
      if (p.x < 20 || p.x > 780 || p.y < 20 || p.y > 620) return goTo(home.x, home.y);
      return goTo(p.x, p.y);
    },
    wander: (i) => { if (!b().alive) return {}; const tx = 400 + 300 * Math.sin(i / 400), ty = 320 + 90 * Math.sin(i / 170), dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 8 ? { mx: dx / d, my: dy / d } : {}; },
    aim: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b().x, ty - b().y); if (d < 150 && (!best || d < best.d)) best = { tx, ty, d }; }
      if (!best) return goTo(home.x, home.y);
      const ang = Math.atan2(best.ty - b().y, best.tx - b().x), off = Math.abs(wrap(ang - b().facing));
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 12 * DEG };
    },
    flank: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const d = Math.hypot(c.x - b().x, c.y - b().y); if (d < 250 && c.v > 15 && (!best || d < best.d)) best = { c, d }; }
      if (!best) return goTo(home.x, home.y);
      const c = best.c, ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b().x - c.x, dy = b().y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, side = ly >= 0 ? 1 : -1;
      if (Math.abs(lx) < c.L / 2 + 10 && Math.abs(ly) < c.W / 2 + 120) {
        const tx = c.x + (c.vx || 0) * 0.1, ty = c.y + (c.vy || 0) * 0.1, ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
        return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: can() && off < 15 * DEG };
      }
      const px = c.x + (c.vx || 0) * 0.4, py = c.y + (c.vy || 0) * 0.4;
      return goTo(px - sa * side * (c.W / 2 + 70), py + ca * side * (c.W / 2 + 70));
    },
  }[policy];
  const t0 = s.t, e0 = s.events.length, wins = [], seen = new Set(), stops = new Map(); let maxOn = 0, stall = 0, blockedStall = 0, points = 0, minStopGap = Infinity;
  const W = (t) => { const k = Math.floor((t - t0) / 60); while (wins.length <= k) wins.push(0); return k; };
  const reach = s.P['movement.lungeDistance'] + s.P['body.radius'];
  for (let i = 0; i < secs * 60; i++) {
    service();
    const before = s.run.points, eB = s.events.length, play = s.phase === 'play';
    s.step(play ? act(i) : {});
    points += s.run.points - before;
    for (const e of s.events.slice(eB)) if (e.type === 'impact' && e.lost > 0) wins[W(e.t)]++;
    const on = s.onRoad(); maxOn = Math.max(maxOn, on.length);
    for (const c of on) {
      seen.add(c.id);
      const st = c.v < 1 ? (stops.get(c.id) || 0) + 1 / 60 : 0; stops.set(c.id, st);
      const inPath = !!(c.hz && c.hz.inPath);
      if (st > 20 && st - 1 / 60 <= 20) { if (inPath) blockedStall++; else stall++; }
      if (c.v < 1 && inPath && s.body.alive) minStopGap = Math.min(minStopGap, c.hz.lx);
    }
  }
  while (wins.length < Math.ceil(secs / 60)) wins.push(0);
  const ev = s.events.slice(e0), imp = ev.filter((e) => e.type === 'impact' && e.lost > 0), mins = (s.t - t0) / 60, n = (t) => ev.filter((e) => e.type === t);
  const tally = (k) => imp.reduce((a, e) => (a[e[k]] = (a[e[k]] || 0) + 1, a), {});
  const lessonAt = n('lesson-due')[0], learned = n('learned')[0], firstBrake = n('first-brake')[0], gift = n('gift')[0];
  const after = learned ? imp.filter((e) => e.t > learned.t) : null;
  const commits = n('commit').reduce((a, e) => (a[e.cause] = (a[e.cause] || 0) + 1, a), {});
  return { policy, mode, offset, simSeconds: +(s.t - t0).toFixed(1), rungEnd: s.rung,
    hits: imp.length, hitsPerMin: +(imp.length / mins).toFixed(2), writeOffs: n('writeoff').length,
    firstHit: imp.length ? +(imp[0].t - t0).toFixed(1) : null, points: Math.round(points), lost: Math.round(imp.reduce((a, e) => a + e.lost, 0)),
    zones: tally('zone'), carStates: tally('carState'), kinds: tally('kind'), dashes: n('lunge').length,
    standstillTouches: n('touch').filter((e) => e.standstill).length, tries: policy === 'charge' ? tries : null,
    lesson: lessonAt ? { hitAt: +(lessonAt.t - t0).toFixed(1), zone: lessonAt.zone, learnedAt: learned ? +(learned.t - t0).toFixed(1) : null } : null,
    afterLesson: after ? { hits: after.length, hitsPerMin: +(after.length / Math.max(1e-9, (s.t - learned.t) / 60)).toFixed(2), lost: Math.round(after.reduce((a, e) => a + e.lost, 0)) } : null,
    firstBrakeAt: firstBrake ? +(firstBrake.t - t0).toFixed(1) : null, dashAt: gift ? +(gift.t - t0).toFixed(1) : null,
    behaviours: commits, learnEvents: n('learn-standoff').length + imp.filter((e) => e.learned != null).length + n('lesson-due').length,
    cars: { appearances: seen.size, maxOnRoad: maxOn, stalls20s: stall, blocked20s: blockedStall, honks: n('honk').length, minStopGap: Number.isFinite(minStopGap) ? Math.round(minStopGap) : null, reach },
    windows: wins };
}

const out = { build: 'prototypes/p10/' + ST.page, stage: o.stage, level: 'junction', secs: o.secs, esc: o.esc, offsets: o.offsets, p10: ST.p10, runs: [], escalation: [] };
const modes = FLAGS['duel.topRung'] > (FLAGS['duel.startRung'] || 0) ? ['lesson', 'trained'] : ['lesson'];
for (const mode of modes) for (const p of Object.keys(POLICIES)) for (const off of o.offsets) {
  const r = run(p, off, o.secs, mode); out.runs.push(r);
  console.log(`${mode.padEnd(7)} ${p.padEnd(10)} +${String(off).padEnd(3)} hits ${r.hits} (${r.hitsPerMin}/min) wo ${r.writeOffs} lesson ${r.lesson ? r.lesson.hitAt : '-'} after ${r.afterLesson ? r.afterLesson.hits : '-'} dash ${r.dashAt} stills ${r.standstillTouches} tries ${r.tries} stalls ${r.cars.stalls20s}/${r.cars.blocked20s} gap ${r.cars.minStopGap}`);
}
for (const p of ['stand', 'charge', 'walkin', 'aim']) {
  const r = run(p, 0, o.esc, 'lesson'), w = r.windows, f = (w[0] + w[1]) / 2, l = (w[w.length - 1] + w[w.length - 2]) / 2;
  r.decay = f ? +(l / f).toFixed(2) : null; out.escalation.push(r);
  console.log(`escalation ${p}: hits by minute ${w.join(' ')} decay ${r.decay}`);
}
if (o.out) { fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true }); fs.writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n'); }
