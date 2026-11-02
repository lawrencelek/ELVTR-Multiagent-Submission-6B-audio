// Prototype 10.0-v2 (handover v2 §12; Lawrence, 2 November: "what is the ESCALATING behaviour sophistication whereby
// they avoid you? the car should learn something new each time"). Prototype 9, headless, no build change.
// The aimed dash (policy.js "read": nearest unspent car within 150, 0.12 s lead, dash when facing within 12°) is repeated
// for a long run. Does avoidance escalate? Per 60 s window: dashes, hits, hits per dash, the cars' responses. Per learning
// event: what changed. Two variants: as built (proto.learningEnabled 0), and the dormant learning on (proto.learningEnabled 1).
//   node qa/escalation.js [--secs 600] [--sims arcade:monument,...] [--offsets 4,40] [--pages 2] [--out qa/baseline/p9_escalation.json]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const o = { secs: 600, sims: ['arcade:monument', 'arcade:parkland', 'arcade:waterfront', 'story:A3'], offsets: [4, 40], pages: 2, out: null,
  variants: { built: {}, learningOn: { 'proto.learningEnabled': 1 } } };
const av = process.argv.slice(2);
for (let i = 0; i < av.length; i += 2) {
  const k = av[i].replace(/^--/, ''), v = av[i + 1];
  if (k === 'secs' || k === 'pages') o[k] = +v; else if (k === 'sims') o.sims = v.split(','); else if (k === 'offsets') o.offsets = v.split(',').map(Number); else if (k === 'out') o.out = v;
}

function pageRun({ sim, variant, flags, offset, secs }) {
  const ST = window.STORY, X = window.DUMMIES, DEG = Math.PI / 180, WIN = 60;
  const P0 = Object.assign({}, window.DUMMIES_SIM, { 'run.appearances.road': 1000 }, flags); // a long shift, so the run does not end on spent cars
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const [kind, id] = sim.split(':');
  let s;
  if (kind === 'arcade') s = new ST.ArcadeSim(id, P0, null, { mode: 'endless' });
  else {
    const order = ['A1', 'B1', 'C1', 'C2', 'B2', 'A2', 'A3', 'B3', 'C3'], parts = { B1: 'battery1', A2: 'hands1', B3: 'legs1' };
    const pr = ST.newProgress(); pr.district = 'monument'; const done = order.slice(0, order.indexOf(id)); pr.done = { monument: done };
    for (const t of done) if (parts[t]) pr.owned[parts[t]] = true;
    s = new ST.StorySim('monument', P0, pr);
  }
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
  if (!home) return { sim, variant, offset, skipped: 'no on-screen lane point' };
  const goTo = (tx, ty) => { const b = s.body, dx = tx - b.x, dy = ty - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
  let target = null;
  const aim = () => {
    const b = s.body; target = null; if (!b.alive) return {};
    let best = null;
    for (const c of s.cars) {
      if (c.spent || c.ghost || c.deck) continue;
      const tx = c.x + (c.vx || 0) * 0.12, ty = c.y + (c.vy || 0) * 0.12, d = Math.hypot(tx - b.x, ty - b.y);
      if (d < 150 && (!best || d < best.d)) best = { c, tx, ty, d };
    }
    if (!best) return goTo(home.x, home.y);
    target = best.c;
    const ang = Math.atan2(best.ty - b.y, best.tx - b.x), off = Math.abs(wrap(ang - b.facing));
    return { mx: Math.cos(ang) * 0.35, my: Math.sin(ang) * 0.35, aPress: off < 12 * DEG && b.mode !== 'lunge' && b.mode !== 'recover' };
  };
  const t0 = s.t, e0 = s.events.length, wins = [], lunges = [], hits = [], learn = [], stateOf = new Map(), firstSeen = {};
  const W = (t) => { const k = Math.floor((t - t0) / WIN); while (wins.length <= k) wins.push({ lunges: 0, hits: 0, responses: {} }); return wins[k]; };
  const resp = (t, kind) => { const w = W(t); w.responses[kind] = (w.responses[kind] || 0) + 1; if (firstSeen[kind] == null) firstSeen[kind] = +(t - t0).toFixed(1); };
  for (let i = 0; i < secs * 60 && !ended(); i++) {
    service();
    const play = s.phase === 'play', cmd = play ? aim() : {}, eBefore = s.events.length;
    if (cmd.aPress && target) cmd._t = { applied: target.applied || 0, standoffApplied: target.standoffApplied || 0, model: target.model };
    const tgt = cmd._t; delete cmd._t;
    s.step(cmd);
    for (const e of s.events.slice(eBefore)) {
      if (e.away) continue;
      if (e.type === 'lunge') { W(e.t).lunges++; lunges.push({ t: +(e.t - t0).toFixed(2), tgt: tgt || null }); }
      else if (e.type === 'impact' && e.lost > 0) { W(e.t).hits++; const c = s.cars.find((q) => q.id === e.car); hits.push({ t: +(e.t - t0).toFixed(2), model: e.model, zone: e.zone, carState: e.carState, bait: !!e.bait, applied: c ? c.applied : null, standoffApplied: c ? c.standoffApplied : null, learned: e.learned, learnedStandoff: e.learnedStandoff });
        if (e.learned != null) learn.push({ t: +(e.t - t0).toFixed(1), model: e.model, what: 'forward beam', step: e.learned }); }
      else if (e.type === 'learn-standoff') learn.push({ t: +(e.t - t0).toFixed(1), model: e.model, what: 'stop line', from: e.from, to: e.to });
      else if (e.type === 'commit') resp(e.t, 'commit:' + e.man);
      else if (e.type === 'honk') resp(e.t, 'honk');
      else if (e.type === 'unstick') resp(e.t, 'unstick');
      else if (e.type === 'interrupt') resp(e.t, 'interrupt');
    }
    for (const c of s.cars) { // state entries: a car that noticed the dummy (caution), meant to act (intention), stopped for it
      if (c.ghost || c.deck) continue;
      const prev = stateOf.get(c.id); if (prev !== c.state && (c.state === 'caution' || c.state === 'intention')) resp(s.t, 'state:' + c.state);
      stateOf.set(c.id, c.state);
    }
  }
  const models = {}; for (const [k, m] of Object.entries(s.models || {})) models[m.id] = { applied: m.applied, standoffApplied: m.standoffApplied, standoff: s.modelStandoff ? s.modelStandoff(m) : null };
  return { sim, variant, offset, flags, simSeconds: +(s.t - t0).toFixed(1), endedAs: ended() ? s.phase : null, windows: wins, firstSeen, learn, models,
    lunges: lunges.length, hits: hits.length, hitLog: hits, lungeLog: lunges };
}

const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
srv.listen(0, async () => {
  const { chromium } = require('playwright'); const br = await chromium.launch(), url = `http://127.0.0.1:${srv.address().port}/prototypes/p9/dummies_p9.html`;
  const jobs = []; for (const sim of o.sims) for (const [variant, flags] of Object.entries(o.variants)) for (const offset of o.offsets) jobs.push({ sim, variant, flags, offset, secs: o.secs });
  const results = new Array(jobs.length), errs = []; let next = 0;
  async function worker() {
    const pg = await br.newPage(); pg.on('pageerror', (e) => errs.push(e.message)); await pg.goto(url); await pg.waitForTimeout(1500);
    while (next < jobs.length) { const k = next++, j = jobs[k], t = Date.now();
      try { results[k] = await pg.evaluate(pageRun, j); } catch (e) { results[k] = Object.assign({ error: String(e.message || e).slice(0, 200) }, j); }
      process.stderr.write(`${k + 1}/${jobs.length} ${j.sim} ${j.variant} +${j.offset}s ${((Date.now() - t) / 1000).toFixed(0)}s\n`); }
    await pg.close();
  }
  await Promise.all(Array.from({ length: Math.max(1, o.pages) }, worker));
  await br.close(); srv.close();
  const out = { build: 'prototypes/p9/dummies_p9.html', secs: o.secs, offsets: o.offsets, variants: o.variants, runs: results, pageErrors: errs.slice(0, 5) };
  if (o.out) { fs.mkdirSync(path.dirname(o.out), { recursive: true }); fs.writeFileSync(o.out, JSON.stringify(out, null, 1) + '\n'); }
  for (const r of results) console.log(r.skipped || r.error ? JSON.stringify(r) : `${r.sim.padEnd(18)} ${r.variant.padEnd(10)} +${String(r.offset).padEnd(3)} lunges ${r.lunges} hits ${r.hits} learn ${r.learn.length} windows ${r.windows.map((w) => w.lunges ? (w.hits / w.lunges).toFixed(2) : '-').join(' ')}`);
});
