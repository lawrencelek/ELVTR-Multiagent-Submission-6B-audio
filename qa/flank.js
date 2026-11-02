// Prototype 10.0-v3 (handover v2 §13; Lawrence, 2 November: "In the earliest versions, there was a sideways sensor - not as
// strong as the front-on sensor ... I think it might be missing ... this could also mean it's TOO hard for the player to
// approach"). Prototype 9, headless, no build change: variants are runtime flag overrides only.
// Two bots: "aim" (policy.js read: dash at the nearest car) and "flank" (come alongside a car and dash into its side).
// Each dash is classed by where the dummy was relative to the nearest car (front, diagonal, side, rear) and whether it landed.
//   node qa/flank.js [--secs 300] [--sims arcade:monument,...] [--offsets 4,40] [--pages 2] [--out qa/baseline/p9_flank.json]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const o = { secs: 300, sims: ['arcade:monument', 'arcade:parkland', 'arcade:waterfront'], offsets: [4, 40], pages: 2, out: null, policies: ['aim', 'flank'],
  variants: { built: {}, rowFortyFive: { 'proto.driver.cautionZone': 100 }, blind: { 'proto.driver.cautionZone': 0 }, wary: { 'proto.driver.cautionSpeed': 41 } } };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) {
  const k = av[i].replace(/^--/, ''), v = av[i + 1];
  if (k === 'secs' || k === 'pages') o[k] = +v; else if (k === 'sims' || k === 'policies') o[k] = v.split(','); else if (k === 'offsets') o.offsets = v.split(',').map(Number); else if (k === 'out') o.out = v;
}

function pageRun({ sim, variant, flags, policy, offset, secs }) {
  const ST = window.STORY, X = window.DUMMIES, DEG = Math.PI / 180;
  const P0 = Object.assign({}, window.DUMMIES_SIM, { 'run.appearances.road': 1000 }, flags);
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const [kind, id] = sim.split(':');
  const s = new ST.ArcadeSim(id, P0, null, { mode: 'endless' });
  // Every car on the dummy's screen is driven by that screen's traffic sim. Its driver values come from the registry; a
  // player sim passes on only TRAFFIC_KEYS (world6.js). So the variant's driver values go to every screen's sim as well.
  for (const q of (s.W6 && s.W6.sims) || []) Object.assign(q.P, flags);
  const service = () => { if (s.phase === 'brief') s.continueBrief(); else if (s.phase === 'gift') s.continueGift(); else if (s.phase === 'report' && s.continueReport) s.continueReport(); else if (s.phase === 'shop' && s.leaveShop) s.leaveShop(); };
  const ended = () => ['ending', 'next', 'voyage'].includes(s.phase);
  let n = 0; while ((s.phase !== 'play' || s.rescue) && n++ < 8000) { service(); s.step({}); }
  for (let k = 0; k < offset * 60 && !ended(); k++) { service(); s.step({}); }
  let home = null;
  for (let k = 0; k < 1800 && !home && !ended(); k++) {
    service(); s.step({});
    for (const c of s.cars) {
      if (c.ghost || c.deck || !(c.v > 40) || !c.path) continue;
      const p = X.pathAt(c.path, c.s + 300), p2 = X.pathAt(c.path, c.s + 302), tx = p2.x - p.x, ty = p2.y - p.y, m = Math.hypot(tx, ty) || 1;
      if (p.x < 80 || p.x > 720 || p.y < 80 || p.y > 560) continue;
      for (const side of [1, -1]) { const hx = p.x - ty / m * 50 * side, hy = p.y + tx / m * 50 * side; if (hx > 60 && hx < 740 && hy > 60 && hy < 580) { home = { x: hx, y: hy }; break; } }
      if (home) break;
    }
  }
  if (!home) return { sim, variant, policy, offset, skipped: 'no on-screen lane point' };
  const b = () => s.body;
  const goTo = (tx, ty, k) => { const dx = tx - b().x, dy = ty - b().y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d * (k || 1), my: dy / d * (k || 1) } : {}; };
  const live = () => s.cars.filter((c) => !c.spent && !c.ghost && !c.deck);
  const frame = (c) => { const ca = Math.cos(c.h), sa = Math.sin(c.h), dx = b().x - c.x, dy = b().y - c.y; return { lx: dx * ca + dy * sa, ly: -dx * sa + dy * ca, ca, sa }; };
  const sector = (c) => { const f = frame(c), a = Math.abs(Math.atan2(f.ly, f.lx)) / DEG; return a < 30 ? 'front' : a < 60 ? 'diagonal' : a < 120 ? 'side' : 'rear'; };
  const POL = {
    aim: () => {
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b().x, ty - b().y); if (d < 150 && (!best || d < best.d)) best = { tx, ty, d }; }
      if (!best) return goTo(home.x, home.y);
      const ang = Math.atan2(best.ty - b().y, best.tx - b().x), off = Math.abs(wrap(ang - b().facing));
      return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 12 * DEG && b().mode !== 'lunge' && b().mode !== 'recover' };
    },
    flank: () => { // come alongside, 70 units off the flank, then turn in and dash at the car's side
      if (!b().alive) return {};
      let best = null;
      for (const c of live()) { const d = Math.hypot(c.x - b().x, c.y - b().y); if (d < 250 && c.v > 15 && (!best || d < best.d)) best = { c, d }; }
      if (!best) return goTo(home.x, home.y);
      const c = best.c, f = frame(c), side = f.ly >= 0 ? 1 : -1, lead = 0.4;
      const px = c.x + (c.vx || 0) * lead, py = c.y + (c.vy || 0) * lead, gx = px - f.sa * side * (c.W / 2 + 70), gy = py + f.ca * side * (c.W / 2 + 70);
      const along = Math.abs(f.lx) < c.L / 2 + 10, close = Math.abs(f.ly) < c.W / 2 + 120;
      if (along && close) {
        const tx = c.x + (c.vx || 0) * 0.1, ty = c.y + (c.vy || 0) * 0.1, ang = Math.atan2(ty - b().y, tx - b().x), off = Math.abs(wrap(ang - b().facing));
        return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 15 * DEG && b().mode !== 'lunge' && b().mode !== 'recover' };
      }
      return goTo(gx, gy);
    },
  };
  const pol = POL[policy], t0 = s.t, dashes = [], hits = [], open = [];
  let points = 0, notices = 0; const stateOf = new Map();
  for (let i = 0; i < secs * 60 && !ended(); i++) {
    service();
    const play = s.phase === 'play', cmd = play ? pol() : {}, eBefore = s.events.length, before = s.run.points;
    s.step(cmd);
    for (const e of s.events.slice(eBefore)) {
      if (e.away) continue;
      if (e.type === 'lunge') { let near = null; for (const c of live()) { const d = Math.hypot(c.x - b().x, c.y - b().y); if (!near || d < near.d) near = { c, d }; }
        const dsh = { t: +(e.t - t0).toFixed(2), sector: near ? sector(near.c) : 'none', dist: near ? Math.round(near.d) : null, carState: near ? near.c.state : null, landed: false }; dashes.push(dsh); open.push(dsh); }
      else if (e.type === 'impact' && e.lost > 0) {
        hits.push({ t: +(e.t - t0).toFixed(2), zone: e.zone, carState: e.carState, lunging: !!e.lunging, cls: e.cls });
        for (const d of open) if (e.t - t0 - d.t <= 0.6) d.landed = true;
      }
    }
    points += s.run.points - before;
    for (let k = open.length - 1; k >= 0; k--) if (s.t - t0 - open[k].t > 0.6) open.splice(k, 1);
    for (const c of s.cars) { if (c.ghost || c.deck) continue; const p = stateOf.get(c.id); if (p !== c.state && c.state === 'caution') notices++; stateOf.set(c.id, c.state); }
  }
  const mins = (s.t - t0) / 60;
  const bySector = {}; for (const d of dashes) { const q = bySector[d.sector] || (bySector[d.sector] = { dashes: 0, landed: 0 }); q.dashes++; if (d.landed) q.landed++; }
  return { sim, variant, policy, offset, flags, simSeconds: +(s.t - t0).toFixed(1), endedAs: ended() ? s.phase : null,
    dashes: dashes.length, landed: dashes.filter((d) => d.landed).length, hits: hits.length, hitsPerMin: +(hits.length / mins).toFixed(2),
    firstHit: hits.length ? hits[0].t : null, points: Math.round(points), cautionEntries: notices, bySector,
    zones: hits.reduce((a, e) => (a[e.zone] = (a[e.zone] || 0) + 1, a), {}), carStates: hits.reduce((a, e) => (a[e.carState] = (a[e.carState] || 0) + 1, a), {}) };
}

const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
srv.listen(0, async () => {
  const { chromium } = require('playwright'); const br = await chromium.launch(), url = `http://127.0.0.1:${srv.address().port}/prototypes/p9/dummies_p9.html`;
  const jobs = []; for (const sim of o.sims) for (const [variant, flags] of Object.entries(o.variants)) for (const policy of o.policies) for (const offset of o.offsets) jobs.push({ sim, variant, flags, policy, offset, secs: o.secs });
  const results = new Array(jobs.length), errs = []; let next = 0;
  async function worker() {
    const pg = await br.newPage(); pg.on('pageerror', (e) => errs.push(e.message)); await pg.goto(url); await pg.waitForTimeout(1500);
    while (next < jobs.length) { const k = next++, j = jobs[k], t = Date.now();
      try { results[k] = await pg.evaluate(pageRun, j); } catch (e) { results[k] = Object.assign({ error: String(e.message || e).slice(0, 200) }, j); }
      process.stderr.write(`${k + 1}/${jobs.length} ${j.sim} ${j.variant} ${j.policy} +${j.offset}s ${((Date.now() - t) / 1000).toFixed(0)}s\n`); }
    await pg.close();
  }
  await Promise.all(Array.from({ length: Math.max(1, o.pages) }, worker));
  await br.close(); srv.close();
  const out = { build: 'prototypes/p9/dummies_p9.html', secs: o.secs, offsets: o.offsets, variants: o.variants, runs: results, pageErrors: errs.slice(0, 5) };
  if (o.out) { fs.mkdirSync(path.dirname(o.out), { recursive: true }); fs.writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n'); }
  for (const r of results) console.log(r.skipped || r.error ? JSON.stringify(r) : `${r.sim.padEnd(18)} ${r.variant.padEnd(12)} ${r.policy.padEnd(5)} +${String(r.offset).padEnd(3)} dashes ${r.dashes} landed ${r.landed} hits/min ${r.hitsPerMin} ${JSON.stringify(r.bySector)}`);
});
