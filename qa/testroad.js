// Prototype 10 probes on the Monument test road (handover v2 §14; GDD Edit 101). Headless in node: the base Sim and
// prototypes/p10/testroad.js, with the build's values (prototypes/p10/sim_flags.json). One runner covers what qa/stand.js,
// qa/policy.js, qa/escalation.js and qa/flank.js measure on Prototype 9: standing, walking in, dashing, the flank, escalation.
//   node qa/testroad.js [--secs 300] [--esc 600] [--offsets 0,7,13] [--out qa/baseline/p10_1.json]
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const X = require(path.join(ROOT, 'prototypes/p6/sim.js'));
const { TestRoadSim } = require(path.join(ROOT, 'prototypes/p10/testroad.js'));
const FLAGS = JSON.parse(fs.readFileSync(path.join(ROOT, 'prototypes/p10/sim_flags.json'), 'utf8')).flags;
const o = { secs: 300, esc: 600, offsets: [0, 7, 13], out: null };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) { const k = av[i].replace(/^--/, ''), v = av[i + 1]; if (k === 'offsets') o.offsets = v.split(',').map(Number); else if (k === 'out') o.out = v; else o[k] = +v; }
const DEG = Math.PI / 180, wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };

// Policies. "Reference" ones carry Battery 1 (the dash), which 10.1 does not deliver: they measure what 10.2 will close.
const POLICIES = {
  stand: { dash: false, home: { x: 200, y: 292 } },   // in road A's north lane (lane 1), on its line, west of the junction
  standSouth: { dash: false, home: { x: 200, y: 348 } }, // in road A's south lane (lane 0), on its line
  standOff: { dash: false, home: { x: 200, y: 300 } },   // in the north lane, 8 off its line toward the other lane
  walkin: { dash: false, home: { x: 300, y: 410 } },  // waits on the pavement; walks into the red car's path ahead of it
  wander: { dash: false, home: { x: 400, y: 320 } },  // P3's scripted dummy
  aim: { dash: true, home: { x: 300, y: 410 } },      // reference: dash at the nearest car (10.0's read and lunge)
  flank: { dash: true, home: { x: 300, y: 410 } },    // reference: come alongside, dash into its side
};

function run(policy, offset, secs, windows) {
  const pol = POLICIES[policy], s = new TestRoadSim(Object.assign({}, FLAGS), pol.dash ? { owned: { battery1: true } } : null);
  const service = () => { if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop(); };
  for (let k = 0; k < offset * 60; k++) { service(); s.step({}); }
  const b = () => s.body, home = pol.home;
  const goTo = (tx, ty, k) => { const dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d * (k || 1), my: dy / d * (k || 1) } : {}; };
  const live = () => s.cars.filter((c) => !c.spent && !c.ghost);
  const act = {
    stand: () => goTo(home.x, home.y), standSouth: () => goTo(home.x, home.y), standOff: () => goTo(home.x, home.y),
    walkin: () => {
      const c = s.cars.find((q) => !q.ghost && q.red);
      if (!c || !b().alive) return goTo(home.x, home.y);
      const p = X.pathAt(c.path, c.s + c.L / 2 + 110);
      if (p.x < 20 || p.x > 780 || p.y < 20 || p.y > 620) return goTo(home.x, home.y);
      return goTo(p.x, p.y);
    },
    wander: (i) => { if (!b().alive) return {}; const tx = 400 + 300 * Math.sin(i / 400), ty = 320 + 90 * Math.sin(i / 170), dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 8 ? { mx: dx / d, my: dy / d, aPress: pol.dash && i % 150 === 0 } : {}; },
    aim: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b().x, ty - b().y); if (d < 150 && (!best || d < best.d)) best = { tx, ty, d }; }
      if (!best) return goTo(home.x, home.y);
      const ang = Math.atan2(best.ty - b().y, best.tx - b().x), off = Math.abs(wrap(ang - b().facing));
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 12 * DEG && b().mode !== 'lunge' && b().mode !== 'recover' };
    },
    flank: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const d = Math.hypot(c.x - b().x, c.y - b().y); if (d < 250 && c.v > 15 && (!best || d < best.d)) best = { c, d }; }
      if (!best) return goTo(home.x, home.y);
      const c = best.c, ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b().x - c.x, dy = b().y - c.y, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, side = ly >= 0 ? 1 : -1;
      if (Math.abs(lx) < c.L / 2 + 10 && Math.abs(ly) < c.W / 2 + 120) {
        const tx = c.x + (c.vx || 0) * 0.1, ty = c.y + (c.vy || 0) * 0.1, ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
        return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 15 * DEG && b().mode !== 'lunge' && b().mode !== 'recover' };
      }
      const px = c.x + (c.vx || 0) * 0.4, py = c.y + (c.vy || 0) * 0.4;
      return goTo(px - sa * side * (c.W / 2 + 70), py + ca * side * (c.W / 2 + 70));
    },
  }[policy];
  const t0 = s.t, e0 = s.events.length, wins = [], seen = new Set(), stops = new Map(); let maxOn = 0, stall = 0, points = 0, i = 0;
  const W = (t) => { const k = Math.floor((t - t0) / windows); while (wins.length <= k) wins.push({ hits: 0, dashes: 0 }); return wins[k]; };
  for (; i < secs * 60; i++) {
    service();
    const before = s.run.points, eB = s.events.length, play = s.phase === 'play';
    s.step(play ? act(i) : {});
    points += s.run.points - before;
    for (const e of s.events.slice(eB)) { if (e.type === 'impact' && e.lost > 0) W(e.t).hits++; if (e.type === 'lunge') W(e.t).dashes++; }
    const on = s.cars.filter((c) => !c.ghost); maxOn = Math.max(maxOn, on.length);
    for (const c of on) { seen.add(c.id); const st = c.v < 1 ? (stops.get(c.id) || 0) + 1 / 60 : 0; stops.set(c.id, st); if (st > 20 && st - 1 / 60 <= 20) stall++; }
  }
  const ev = s.events.slice(e0), imp = ev.filter((e) => e.type === 'impact' && e.lost > 0), mins = (s.t - t0) / 60;
  const tally = (k) => imp.reduce((a, e) => (a[e[k]] = (a[e[k]] || 0) + 1, a), {});
  return { policy, offset, dash: pol.dash, simSeconds: +(s.t - t0).toFixed(1),
    hits: imp.length, hitsPerMin: +(imp.length / mins).toFixed(2), writeOffs: ev.filter((e) => e.type === 'writeoff').length,
    firstHit: imp.length ? +(imp[0].t - t0).toFixed(1) : null, points: Math.round(points), lost: Math.round(imp.reduce((a, e) => a + e.lost, 0)),
    bait: imp.filter((e) => e.bait).length, zones: tally('zone'), carStates: tally('carState'),
    dashes: ev.filter((e) => e.type === 'lunge').length,
    learnEvents: ev.filter((e) => e.type === 'learn-standoff').length + imp.filter((e) => e.learned != null).length,
    cars: { appearances: seen.size, maxOnRoad: maxOn, stalls20s: stall, honks: ev.filter((e) => e.type === 'honk').length, unsticks: ev.filter((e) => e.type === 'unstick').length },
    windows: wins.map((w) => w.hits) };
}

const out = { build: 'prototypes/p10/dummies_p10.html', level: 'junction', secs: o.secs, esc: o.esc, offsets: o.offsets, p10: JSON.parse(fs.readFileSync(path.join(ROOT, 'prototypes/p10/sim_flags.json'), 'utf8')).p10, runs: [], escalation: [] };
for (const p of Object.keys(POLICIES)) for (const off of o.offsets) { const r = run(p, off, o.secs, 60); out.runs.push(r); console.log(`${p.padEnd(7)} +${String(off).padEnd(3)} hits ${r.hits} (${r.hitsPerMin}/min) wo ${r.writeOffs} first ${r.firstHit} cars ${r.cars.appearances} maxOn ${r.cars.maxOnRoad} stalls ${r.cars.stalls20s}`); }
for (const p of ['walkin', 'aim']) { const r = run(p, 0, o.esc, 60); out.escalation.push(r); const w = r.windows, f = (w[0] + w[1]) / 2, l = (w[w.length - 1] + w[w.length - 2]) / 2; r.decay = f ? +(l / f).toFixed(2) : null; console.log(`escalation ${p}: hits by minute ${w.join(' ')} decay ${r.decay}`); }
if (o.out) { fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true }); fs.writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n'); }
