// Prototype 10.1 checks (GDD Edit 101). node prototypes/p10/test_p10.js [--page]
// Headless sim checks; frozen-build checks; --page also loads dummies_p10.html in Playwright.
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), crypto = require('crypto');
const ROOT = path.resolve(__dirname, '..', '..');
const X = require(path.join(ROOT, 'prototypes/p6/sim.js'));
const { TestRoadSim, junctionLevel } = require(path.join(__dirname, 'testroad.js'));
const SF = JSON.parse(fs.readFileSync(path.join(__dirname, 'sim_flags.json'), 'utf8')), F = SF.flags;
const results = [];
const check = (name, fn) => { try { const r = fn(); results.push([r.ok, name, r.detail]); } catch (e) { results.push([false, name, String(e.message || e).slice(0, 200)]); } };
const md5 = (p) => crypto.createHash('md5').update(fs.readFileSync(p)).digest('hex');
const sim = (carry) => new TestRoadSim(Object.assign({}, F), carry);
const service = (s) => { if (s.phase === 'report') s.continueReport(); else if (s.phase === 'shop') s.leaveShop(); };
function drive(s, secs, cmd) { const seen = new Map(); let maxOn = 0; for (let i = 0; i < secs * 60; i++) { service(s); s.step(cmd ? cmd(s, i) : {}); const on = s.cars.filter((c) => !c.ghost); maxOn = Math.max(maxOn, on.length); for (const c of on) seen.set(c.id, c); } return { seen: [...seen.values()], maxOn }; }

check('the junction: two one-way roads, two lanes each, all one way', () => {
  const L = junctionLevel(Object.assign({}, X.REG, X.PROTO, X.OVERRIDES, F)), a0 = X.pathAt(L.lanes[0], 10), a1 = X.pathAt(L.lanes[1], 10), b0 = X.pathAt(L.lanes[2], 10), b1 = X.pathAt(L.lanes[3], 10);
  const ok = L.lanes.length === 4 && a0.tx > 0.99 && a1.tx > 0.99 && b0.ty > 0.99 && b1.ty > 0.99;
  return { ok, detail: `lanes ${L.lanes.length}; A heads +x (${a0.tx.toFixed(2)}, ${a1.tx.toFixed(2)}); B heads +y (${b0.ty.toFixed(2)}, ${b1.ty.toFixed(2)})` };
});
check('one car type, alone on the road, both roads recur', () => {
  const s = sim(), r = drive(s, 300), cls = new Set(r.seen.map((c) => c.cls)), lanes = new Set(r.seen.map((c) => c.lane));
  return { ok: cls.size === 1 && cls.has('sedan') && r.maxOn === 1 && lanes.size === 4 && r.seen.every((c) => c.red) && r.seen.length >= 20, detail: `classes ${[...cls]}; most at once ${r.maxOn}; lanes ${[...lanes].sort()}; appearances ${r.seen.length} in 300 s; all red ${r.seen.every((c) => c.red)}` };
});
check('the red car returns duel.redReturnSeconds after it leaves', () => {
  const s = sim(); let leftAt = null, back = null, prev = 0;
  for (let i = 0; i < 60 * 60 && back == null; i++) { s.step({}); const n = s.cars.filter((c) => !c.ghost).length; if (prev === 1 && n === 0) leftAt = s.t; if (leftAt != null && n === 1 && prev === 0) back = s.t - leftAt; prev = n; }
  return { ok: back != null && Math.abs(back - F['duel.redReturnSeconds']) < 0.1, detail: `back after ${back && back.toFixed(2)} s (duel.redReturnSeconds ${F['duel.redReturnSeconds']})` };
});
check('rung 0: the red car senses nothing; a dummy standing in its lane is hit head-on, at full damage', () => {
  const s = sim(), home = { x: 200, y: 292 };
  drive(s, 120, (q) => { const b = q.body, dx = home.x - b.x, dy = home.y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; });
  const imp = s.events.filter((e) => e.type === 'impact' && e.lost > 0), cau = s.events.filter((e) => e.type === 'commit').length;
  return { ok: imp.length > 0 && imp.every((e) => e.zone === 'front' && e.carState === 'cruise') && cau === 0, detail: `${imp.length} hits, zones ${[...new Set(imp.map((e) => e.zone))]}, states ${[...new Set(imp.map((e) => e.carState))]}, manoeuvres ${cau}` };
});
check('rung 0: nothing is learned (no learning event in 600 s of walking in)', () => {
  const s = sim();
  const to = (b, x, y) => { const dx = x - b.x, dy = y - b.y, d = Math.hypot(dx, dy); return d > 6 ? { mx: dx / d, my: dy / d } : {}; };
  drive(s, 600, (q) => { const c = q.cars.find((k) => !k.ghost), b = q.body; if (!b.alive) return {}; if (!c) return to(b, 300, 410); const p = X.pathAt(c.path, c.s + c.L / 2 + 110); return p.x < 20 || p.x > 780 || p.y < 20 || p.y > 620 ? to(b, 300, 410) : to(b, p.x, p.y); });
  const imp = s.events.filter((e) => e.type === 'impact' && e.lost > 0), learn = s.events.filter((e) => e.type === 'learn-standoff').length + imp.filter((e) => e.learned != null).length;
  return { ok: imp.length > 10 && learn === 0, detail: `${imp.length} hits, ${s.run.writeOffs} write-offs, ${learn} learning events` };
});
check('on foot: no dash before Battery 1; one screen: the edge holds the dummy', () => {
  const s = sim(); drive(s, 20, () => ({ mx: -1, my: 0, aPress: true }));
  return { ok: !s.dashFitted() && s.body.x >= 0 && s.events.filter((e) => e.type === 'lunge').length === 0 && s.phase !== 'scroll', detail: `dash fitted ${s.dashFitted()}; body x ${s.body.x.toFixed(1)}; phase ${s.phase}` };
});
check('Prototype 10 values are registered (registry first)', () => {
  const reg = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'content/params/tuning.parameters.json'), 'utf8')).entries.map((e) => e.id));
  const src = fs.readFileSync(path.join(ROOT, 'prototypes/p6/sim.js'), 'utf8');
  const ids = [...src.matchAll(/'((?:traffic|perception|learning|proto\.(?:driver|learn|unstick|standoff|swerve|return|honk|traffic|learningEnabled|sensorStraight|carYaw))[a-zA-Z0-9_.]*)'\s*:/g)].map((m) => m[1]);
  const missing = [...new Set(ids)].filter((i) => !reg.has(i)).concat(Object.keys(SF.p10).filter((k) => !reg.has(k)));
  return { ok: missing.length === 0, detail: missing.length ? 'missing ' + missing.join(', ') : 'the 29 sim-only IDs and every 10.1 value are registered' };
});
check('shared code untouched; frozen builds hold', () => {
  const diff = cp.execSync('git diff --name-only HEAD -- prototypes/p6 prototypes/p7 prototypes/p8 prototypes/jump prototypes/controls', { cwd: ROOT }).toString().trim();
  const p9 = path.join(ROOT, 'prototypes/p9/dummies_p9.html'), keep = fs.readFileSync(p9);
  cp.execSync('python3 prototypes/p9/build.py', { cwd: ROOT, stdio: 'ignore' });
  const rebuilt = md5(p9); fs.writeFileSync(p9, keep);
  const p84 = md5(path.join(ROOT, 'prototypes/p8/dummies_p8_4.html'));
  return { ok: !diff && rebuilt === 'be163e7d014344e062965986b3da5786' && p84 === '9f5549201d88891f9f0b22c461602909', detail: `shared diff: ${diff || 'none'}; Prototype 9 rebuilt ${rebuilt}; 8.4 ${p84}` };
});
if (process.argv.includes('--page')) {
  const http = require('http');
  const done = new Promise((resolve) => {
    const srv = http.createServer((q, r) => { const p = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200); fs.createReadStream(p).pipe(r); });
    srv.listen(0, async () => {
      const { chromium } = require('playwright'); const br = await chromium.launch(); const pg = await br.newPage(); const errs = [];
      pg.on('pageerror', (e) => errs.push(e.message));
      await pg.goto(`http://127.0.0.1:${srv.address().port}/prototypes/p10/dummies_p10.html`); await pg.waitForTimeout(600);
      await pg.keyboard.press('Enter'); await pg.waitForTimeout(4000);
      const st = await pg.evaluate(() => { const s = window.__p10.sim; return { t: s.t, cars: s.cars.length, level: s.levelId }; });
      results.push([errs.length === 0 && st.t > 3 && st.level === 'junction', 'the page plays: no page errors, the sim runs on the junction', `t ${st.t.toFixed(1)} s, cars ${st.cars}, errors ${errs.length ? errs.slice(0, 2).join(' | ') : 0}`]);
      await br.close(); srv.close(); resolve();
    });
  });
  done.then(report);
} else report();
function report() {
  for (const [ok, name, detail] of results) console.log(`${ok ? 'PASS' : 'FAIL'} ${name} (${detail})`);
  const n = results.filter((r) => r[0]).length; console.log(`\n${n}/${results.length} passed`); process.exitCode = n === results.length ? 0 : 1;
}
