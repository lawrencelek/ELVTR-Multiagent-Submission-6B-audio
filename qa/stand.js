// The stand-in-lane probe (playtest, 1 November: "if I just stand in the centre of the road I can get hit"). Prototype 9,
// headless in the page: the dummy is put in a lane, a set distance ahead of a moving car, given no input and held there
// (a knock-back is undone, as a player would step back). Damaging hits after the first 4 s are counted, with the car's state.
//   node qa/stand.js [secs 150] [kinds arcade] [districts monument,parkland,waterfront] [leads 560,700,900] [offsets 0,20]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const [SECS = '150', KINDS = 'arcade', DISTS = 'monument,parkland,waterfront', LEADS = '560,700,900', OFFS = '0,20'] = process.argv.slice(2);
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
srv.listen(0, async () => {
  const { chromium } = require('playwright'); const br = await chromium.launch(); const pg = await br.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/prototypes/p9/dummies_p9.html`); await pg.waitForTimeout(1500);
  const out = await pg.evaluate(({ secs, kinds, dists, leads, offs }) => {
    const X = window.DUMMIES, res = [];
    const make = (kind, id) => {
      if (kind === 'arcade') return new window.STORY.ArcadeSim(id, Object.assign({}, window.DUMMIES_SIM), null, { mode: 'endless' });
      const pr = window.STORY.newProgress(); pr.district = id; return new window.STORY.StorySim(id, Object.assign({}, window.DUMMIES_SIM), pr);
    };
    for (const kind of kinds) for (const id of dists) for (const off of offs) for (const lead of leads) {
      const s = make(kind, id);
      let n = 0; while ((s.phase !== 'play' || s.rescue) && n++ < 8000) { if (s.phase === 'brief') s.continueBrief(); else if (s.phase === 'gift') s.continueGift(); else s.step({}); }
      for (let k = 0; k < 240; k++) s.step({});
      let placed = null;
      for (let k = 0; k < 900 && !placed; k++) {
        s.step({});
        const c = s.cars.find((q) => !q.ghost && !q.deck && q.v > 40 && q.path);
        if (c) { const p = X.pathAt(c.path, c.s + lead), p2 = X.pathAt(c.path, c.s + lead + 2), tx = p2.x - p.x, ty = p2.y - p.y, m = Math.hypot(tx, ty) || 1, x = p.x - ty / m * off, y = p.y + tx / m * off;
          if (x > 80 && x < 720 && y > 80 && y < 560) placed = { x, y, cls: c.cls }; }
      }
      if (!placed) { res.push({ kind, id, off, lead, skipped: 'no on-screen lane point at this lead' }); continue; }
      const b = s.body; b.x = placed.x; b.y = placed.y; b.vx = b.vy = 0; const e0 = s.events.length, t0 = s.t;
      for (let k = 0; k < secs * 60; k++) {
        if (s.phase === 'gift') s.continueGift(); else if (s.phase === 'brief') s.continueBrief(); else if (s.phase === 'report' && s.continueReport) s.continueReport();
        if (s.body && s.body.alive && s.phase === 'play' && Math.hypot(s.body.x - placed.x, s.body.y - placed.y) > 40) { s.body.x = placed.x; s.body.y = placed.y; s.body.vx = s.body.vy = 0; }
        s.step({});
      }
      const ev = s.events.slice(e0), imp = ev.filter((e) => e.type === 'impact' && !e.away && e.t - t0 > 4 && e.lost > 0);
      res.push({ kind, id, off, lead, secs: +(s.t - t0).toFixed(0), hits: imp.length, writeOffs: ev.filter((e) => e.type === 'writeoff').length, lost: +imp.reduce((a, e) => a + e.lost, 0).toFixed(0),
        carStates: imp.reduce((a, e) => (a[e.carState] = (a[e.carState] || 0) + 1, a), {}), zones: imp.reduce((a, e) => (a[e.zone] = (a[e.zone] || 0) + 1, a), {}) });
    }
    return res;
  }, { secs: +SECS, kinds: KINDS.split(','), dists: DISTS.split(','), leads: LEADS.split(',').map(Number), offs: OFFS.split(',').map(Number) });
  for (const r of out) console.log(JSON.stringify(r));
  const run = out.filter((r) => !r.skipped);
  console.log(JSON.stringify({ placements: run.length, withHits: run.filter((r) => r.hits).length, hits: run.reduce((a, r) => a + r.hits, 0), writeOffs: run.reduce((a, r) => a + r.writeOffs, 0) }));
  if (errs.length) console.log('errors', errs.slice(0, 3));
  await br.close(); srv.close();
});
