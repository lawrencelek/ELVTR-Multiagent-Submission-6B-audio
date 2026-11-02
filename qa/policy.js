// Prototype 10.0 baseline (handover v2 §10): the P3 scripted policies (prototypes/p3/policy_check.js in
// ELVTR-dummies-agent-crew) ported to Prototype 9's StorySim and ArcadeSim, headless in the page. No build change.
// Each run: a sim, a policy and a start offset (traffic is deterministic, golden-ratio spacing; proto.district.seed
// changes the city plan, so runs vary by when the policy starts). Records fun measures and car-predictability measures.
//   node qa/policy.js [--secs 300] [--sims arcade:monument,story:A1,...] [--policies stand,blind,read,wander]
//                     [--offsets 4,20,40] [--pages 2] [--out qa/baseline/p9.json]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const ALL_SIMS = ['arcade:monument', 'arcade:parkland', 'arcade:waterfront', 'story:A1', 'story:A2', 'story:A3'];
const ALL_POLICIES = ['stand', 'blind', 'read', 'wander'];

function args(argv) {
  const o = { secs: 300, sims: ALL_SIMS, policies: ALL_POLICIES, offsets: [4, 20, 40], pages: 2, out: null };
  for (let i = 0; i < argv.length; i += 2) {
    const k = argv[i].replace(/^--/, ''), v = argv[i + 1];
    if (k === 'secs' || k === 'pages') o[k] = +v;
    else if (k === 'sims' || k === 'policies') o[k] = v.split(',');
    else if (k === 'offsets') o[k] = v.split(',').map(Number);
    else if (k === 'out') o.out = v;
  }
  return o;
}

// Runs in the page. One run: build the sim, reach play, warm up, then drive the policy for `secs`.
function pageRun({ sim, policy, offset, secs }) {
  const ST = window.STORY, X = window.DUMMIES, P0 = Object.assign({}, window.DUMMIES_SIM), DEG = Math.PI / 180;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const [kind, id] = sim.split(':');
  let s;
  if (kind === 'arcade') s = new ST.ArcadeSim(id, P0, null, { mode: 'endless' });
  else {
    const order = ['A1', 'B1', 'C1', 'C2', 'B2', 'A2', 'A3', 'B3', 'C3'], parts = { B1: 'battery1', A2: 'hands1', B3: 'legs1' };
    const pr = ST.newProgress(); pr.district = 'monument';
    const done = order.slice(0, order.indexOf(id)); pr.done = { monument: done };
    for (const t of done) if (parts[t]) pr.owned[parts[t]] = true;
    s = new ST.StorySim('monument', P0, pr);
  }
  const P = s.P, wo = P['rewards.writeOff'] || 0;
  const service = () => {
    if (s.phase === 'brief') s.continueBrief(); else if (s.phase === 'gift') s.continueGift();
    else if (s.phase === 'report' && s.continueReport) s.continueReport(); else if (s.phase === 'shop' && s.leaveShop) s.leaveShop();
  };
  const ended = () => ['ending', 'next', 'voyage'].includes(s.phase);
  let n = 0; while ((s.phase !== 'play' || s.rescue) && n++ < 8000) { service(); s.step({}); }
  for (let k = 0; k < offset * 60 && !ended(); k++) { service(); s.step({}); }
  // A lane point ahead of a moving car, on screen; the roadside home 50 units off it.
  let lane = null, home = null;
  for (let k = 0; k < 1800 && !lane && !ended(); k++) {
    service(); s.step({});
    for (const c of s.cars) {
      if (c.ghost || c.deck || !(c.v > 40) || !c.path) continue;
      const p = X.pathAt(c.path, c.s + 300), p2 = X.pathAt(c.path, c.s + 302), tx = p2.x - p.x, ty = p2.y - p.y, m = Math.hypot(tx, ty) || 1;
      if (p.x < 80 || p.x > 720 || p.y < 80 || p.y > 560) continue;
      for (const side of [1, -1]) {
        const hx = p.x - ty / m * 50 * side, hy = p.y + tx / m * 50 * side;
        if (hx > 60 && hx < 740 && hy > 60 && hy < 580) { lane = { x: p.x, y: p.y }; home = { x: hx, y: hy }; break; }
      }
      if (lane) break;
    }
  }
  if (!lane) return { sim, policy, offset, skipped: 'no on-screen lane point' };
  const goTo = (tx, ty, slow) => { const b = s.body, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d * (slow || 1), my: dy / d * (slow || 1) } : {}; };
  const toLane = () => { const dx = lane.x - home.x, dy = lane.y - home.y, d = Math.hypot(dx, dy); return { ux: dx / d, uy: dy / d }; };
  const POL = {
    stand: () => goTo(lane.x, lane.y),
    blind: (i) => { const b = s.body; if (Math.hypot(b.x - home.x, b.y - home.y) > 12) return goTo(home.x, home.y); const { ux, uy } = toLane(); return { mx: ux * 0.25, my: uy * 0.25, aPress: i % 60 === 0 }; },
    read: () => {
      const b = s.body; if (!b.alive) return {};
      let best = null;
      for (const c of s.cars) {
        if (c.spent || c.ghost || c.deck) continue;
        const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b.x, ty - b.y);
        if (d < 150 && (!best || d < best.d)) best = { tx, ty, d };
      }
      if (!best) return goTo(home.x, home.y);
      const ang = Math.atan2(best.ty - b.y, best.tx - b.x), off = Math.abs(wrap(ang - b.facing));
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 12 * DEG && b.mode !== 'lunge' && b.mode !== 'recover' };
    },
    wander: (i) => { const b = s.body; if (!b.alive) return {}; const tx = 400 + 300 * Math.sin(i / 400), ty = 320 + 90 * Math.sin(i / 170), dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy); return d > 8 ? { mx: dx / d, my: dy / d, aPress: i % 150 === 0 } : { aPress: i % 150 === 0 }; },
  };
  const pol = POL[policy], t0 = s.t, e0 = s.events.length, impacts = [], seen = new Set(), prevH = new Map();
  let snaps = 0, maxYaw = 0, playFrames = 0, writeOffs = 0, pointsGained = 0;
  for (let i = 0; i < secs * 60 && !ended(); i++) {
    service();
    const before = s.run.points, eBefore = s.events.length, play = s.phase === 'play';
    s.step(play ? pol(i) : {});
    if (play) playFrames++;
    const fresh = s.events.slice(eBefore), imps = fresh.filter((e) => e.type === 'impact' && !e.away), wos = fresh.filter((e) => e.type === 'writeoff').length;
    const gained = s.run.points - before; pointsGained += gained; writeOffs += wos;
    const forHits = gained - wos * wo;
    for (const e of imps) impacts.push({ t: +(e.t - t0).toFixed(2), lost: e.lost, zone: e.zone, carState: e.carState, cls: e.cls, bait: !!e.bait, lunging: !!e.lunging, stopped: !!e.stopped, points: +(forHits / imps.length).toFixed(1) });
    for (const c of s.cars) {
      if (c.ghost || c.deck) continue; seen.add(c.id);
      if (prevH.has(c.id) && c.v > 20) { const yaw = Math.abs(wrap(c.h - prevH.get(c.id))) * 60 / DEG; maxYaw = Math.max(maxYaw, yaw); if (yaw > 360) snaps++; }
      prevH.set(c.id, c.h);
    }
  }
  const ev = s.events.slice(e0), commits = ev.filter((e) => e.type === 'commit'), shifts = commits.filter((e) => e.man === 'shift');
  const perCar = {}; for (const e of shifts) perCar[e.car] = (perCar[e.car] || 0) + 1;
  const dmg = impacts.filter((e) => e.lost > 0), mins = (s.t - t0) / 60;
  return {
    sim, policy, offset, simSeconds: +(s.t - t0).toFixed(1), playSeconds: +(playFrames / 60).toFixed(1), endedAs: ended() ? s.phase : null,
    lane: { x: Math.round(lane.x), y: Math.round(lane.y) }, home: { x: Math.round(home.x), y: Math.round(home.y) },
    fun: {
      hitsPerMin: +(dmg.length / mins).toFixed(3), writeOffsPerMin: +(writeOffs / mins).toFixed(3),
      firstHitSeconds: dmg.length ? dmg[0].t : null,
      firstWriteOffSeconds: (() => { const w = ev.find((e) => e.type === 'writeoff'); return w ? +(w.t - t0).toFixed(2) : null; })(),
      pointsPerMin: +(pointsGained / mins).toFixed(1), points: Math.round(pointsGained), writeOffs, damagingHits: dmg.length,
      baitShare: dmg.length ? +(dmg.filter((e) => e.bait).length / dmg.length).toFixed(3) : null,
      zoneMix: dmg.reduce((a, e) => (a[e.zone] = (a[e.zone] || 0) + 1, a), {}),
      carStateMix: dmg.reduce((a, e) => (a[e.carState] = (a[e.carState] || 0) + 1, a), {}),
    },
    cars: { seen: seen.size, shiftsPerCar: +(shifts.length / Math.max(1, seen.size)).toFixed(2), carsWith3PlusShifts: Object.values(perCar).filter((k) => k >= 3).length,
      interrupts: ev.filter((e) => e.type === 'interrupt').length, headingSnapsOver360degS: snaps, maxYawDegS: Math.round(maxYaw) },
    impacts: dmg,
  };
}

async function runAll(o) {
  const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
  await new Promise((res) => srv.listen(0, res));
  const { chromium } = require('playwright'); const br = await chromium.launch(), url = `http://127.0.0.1:${srv.address().port}/prototypes/p9/dummies_p9.html`;
  const jobs = []; for (const sim of o.sims) for (const policy of o.policies) for (const offset of o.offsets) jobs.push({ sim, policy, offset, secs: o.secs });
  const results = new Array(jobs.length), errs = []; let next = 0;
  async function worker() {
    const pg = await br.newPage(); pg.on('pageerror', (e) => errs.push(e.message));
    await pg.goto(url); await pg.waitForTimeout(1500);
    while (next < jobs.length) {
      const k = next++, j = jobs[k], t = Date.now();
      try { results[k] = await pg.evaluate(pageRun, j); } catch (e) { results[k] = Object.assign({ error: String(e.message || e).slice(0, 200) }, j); }
      process.stderr.write(`${k + 1}/${jobs.length} ${j.sim} ${j.policy} +${j.offset}s ${((Date.now() - t) / 1000).toFixed(0)}s\n`);
    }
    await pg.close();
  }
  await Promise.all(Array.from({ length: Math.max(1, o.pages) }, worker));
  await br.close(); srv.close();
  return { build: 'prototypes/p9/dummies_p9.html', secs: o.secs, offsets: o.offsets, runs: results, pageErrors: errs.slice(0, 5) };
}

if (require.main === module) {
  const o = args(process.argv.slice(2));
  runAll(o).then((r) => {
    const txt = JSON.stringify(r, null, 1);
    if (o.out) { fs.mkdirSync(path.dirname(o.out), { recursive: true }); fs.writeFileSync(o.out, txt + '\n'); }
    for (const x of r.runs) console.log(x.skipped || x.error ? JSON.stringify(x) : `${x.sim.padEnd(18)} ${x.policy.padEnd(7)} +${String(x.offset).padEnd(3)} ${JSON.stringify({ hits: x.fun.damagingHits, wo: x.fun.writeOffs, pts: x.fun.points, first: x.fun.firstHitSeconds })}`);
    if (r.pageErrors.length) console.log('page errors', r.pageErrors);
  });
}
module.exports = { runAll, ALL_SIMS };
