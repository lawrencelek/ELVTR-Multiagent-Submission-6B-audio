// The jam hunt (Lawrence, 31 October 16:40: "the cars don't move after the barrier is fixed"). A Story sim on Monument A2, run
// headless in the page: cones put in lanes ahead of cars and moved away after a while, the dummy idle; every car stopped
// longer than a limit is reported with the reason the sim gives. Flags can be set off to compare (KEY=0 node qa/jam.js).
//   node qa/jam.js [tile A2] [sim seconds 300] [flag=value ...]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const [TILE = 'A2', SECS = '300', ...FLAGS] = process.argv.slice(2);
const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'Content-Length': fs.statSync(p).size }); fs.createReadStream(p).pipe(r); });
srv.listen(0, async () => {
  const { chromium } = require('playwright'); const br = await chromium.launch(); const pg = await br.newPage(); const errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  await pg.goto(`http://127.0.0.1:${srv.address().port}/prototypes/p9/dummies_p9.html`); await pg.waitForTimeout(1200);
  const flags = Object.fromEntries(FLAGS.map((f) => f.split('=')).map(([k, v]) => [k, +v]));
  const out = await pg.evaluate(({ tile, secs, flags, stay }) => {
    const order = window.STORY.DISTRICTS ? null : null;
    const pr = window.STORY.newProgress(); pr.district = 'monument';
    const all = ['A1', 'B1', 'C1', 'C2', 'B2', 'A2', 'A3', 'B3', 'C3'], done = all.slice(0, Math.max(0, all.indexOf(tile)));
    pr.done = { monument: done }; for (const n of ['legs1', 'hands1', 'battery1', 'arms1']) pr.owned[n] = true;
    const s = new window.STORY.StorySim('monument', Object.assign({}, window.DUMMIES_SIM, flags), pr);
    let n = 0; while ((s.phase !== 'play' || s.rescue) && n++ < 8000) { if (s.phase === 'brief') s.continueBrief(); else if (s.phase === 'gift') s.continueGift(); else s.step({}); }
    const X = window.DUMMIES, stuck = {}, log = [], hyp = Math.hypot;
    let placed = null, placeT = s.t + 5;
    const steps = Math.round(secs * 60);
    for (let k = 0; k < steps; k++) {
      if (s.phase !== 'play') { if (s.phase === 'gift') s.continueGift(); else if (s.phase === 'report') s.continueReport && s.continueReport(); s.step({}); continue; }
      if (s.t >= placeT) {
        if (!placed) { // a cone into a lane, 150 px ahead of a moving car, on the screen
          const cn = s.cones.find((q) => q.state === 'free');
          for (const c of s.cars.filter((q) => !q.ghost && q.v > 20 && q.path && !q.deck)) { const p = X.pathAt(c.path, c.s + 150); if (cn && p.x > 60 && p.x < 740 && p.y > 60 && p.y < 580) { cn.x = p.x; cn.y = p.y; placed = { id: cn.id, t: s.t, x: Math.round(p.x), y: Math.round(p.y) }; break; } }
          placeT = s.t + (placed ? 6 : 1);
          if (placed) log.push(['place', +s.t.toFixed(1), placed.x, placed.y]);
        } else if (stay) { placeT = s.t + 1e9; // left in the lane (STAY=1)
        } else { // moved to its home, off the road
          const cn = s.cones.find((q) => q.id === placed.id); if (cn && cn.state === 'free') { cn.x = cn.hx; cn.y = cn.hy; log.push(['move', +s.t.toFixed(1), Math.round(cn.x), Math.round(cn.y)]); }
          placed = null; placeT = s.t + 9;
        }
      }
      s.step({});
      if (k % 30 === 0) for (const c of s.cars) {
        if (c.ghost || c.deck) continue;
        if (c.v < 1) { const st = stuck[c.id] || (stuck[c.id] = { since: s.t, max: 0 }); st.max = Math.max(st.max, s.t - st.since);
          if (s.t - st.since > 20 && !st.why) { let ob = null; try { ob = s.obstacleAhead(c); } catch (e) { ob = 'err'; } const lead = s.leadGap ? s.leadGap(c) : null;
            st.why = { t: +s.t.toFixed(1), x: Math.round(c.x), y: Math.round(c.y), state: c.state, man: c.man && c.man.type, halt: c.man && c.man.halt, cause: c.cause, spent: !!c.spent, dodge: c.dodge && c.dodge.id, fwd: c.det && c.det.fwd && c.det.fwd.id, hz: !!c.hz, ob,
              lead: lead && { id: lead.car && lead.car.id, gap: lead.gap && Math.round(lead.gap) }, booms: JSON.stringify(s.booms), stillT: c.stillT && +c.stillT.toFixed(1), stopT: c.stopT && +c.stopT.toFixed(1), orbit: !!c.orbit, d: +c.d.toFixed(1), body: [Math.round(s.body.x), Math.round(s.body.y), s.body.mode] }; } }
        else if (stuck[c.id]) { if (stuck[c.id].why) stuck[c.id].why.freedAfter = +(s.t - stuck[c.id].since).toFixed(1); delete stuck[c.id].since; stuck[c.id] = Object.assign({ freed: true }, stuck[c.id]); delete stuck[c.id]; }
      }
    }
    const still = Object.entries(stuck).filter(([, v]) => v.why).map(([id, v]) => ({ id, stoppedFor: +(s.t - v.since).toFixed(1), why: v.why }));
    return { tile: s.screenName(), t: +s.t.toFixed(1), cars: s.cars.length, stillStopped: still, log: log.slice(0, 40) };
  }, { tile: TILE, secs: +SECS, flags, stay: !!+process.env.STAY });
  console.log(JSON.stringify(out, null, 1).slice(0, 6000));
  if (errs.length) console.log('errors', errs);
  await br.close(); srv.close();
});
