// Reproductions for the QA run's findings (qa/REPORT.md). Each scenario starts Arcade on a district, plays a scripted line and
// prints what it measured. One browser, nothing else running: the numbers are clean.
//   node qa/repro.js <scenario> [district index 0–4] [seconds]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..'), HTML = path.join(ROOT, 'prototypes', 'p9', 'dummies_p9.html');
const [SCEN = 'notice', DIST = '0', SECS = '60'] = process.argv.slice(2);
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg' };
function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      const size = fs.statSync(p).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''), ty = TYPES[path.extname(p)] || 'application/octet-stream';
      if (m) { const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1; res.writeHead(206, { 'Content-Type': ty, 'Content-Length': b - a + 1, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p, { start: a, end: b }).pipe(res); return; }
      res.writeHead(200, { 'Content-Type': ty, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}
(async () => {
  const srv = await serve(), url = `http://127.0.0.1:${srv.address().port}/prototypes/p9/dummies_p9.html`;
  const { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await br.newContext({ viewport: { width: 960, height: 600 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.addInitScript({ path: path.join(__dirname, 'monitor.js') });
  await ctx.addInitScript(() => { // every event the game hands the audio engine, with its car and the sim clock
    window.__evlog = [];
    const iv = setInterval(() => { const A = window.__dummiesAudio; if (!A || A.__wrapped) return; A.__wrapped = true; const ev = A.event; A.event = function (e) { const s = window.__dummies && window.__dummies.sim; window.__evlog.push({ type: e.type, car: e.car || null, at: e.at || null, t: s ? +s.t.toFixed(2) : null, real: +(window.__dummies.realT || 0).toFixed(2) }); return ev.apply(this, arguments); }; clearInterval(iv); }, 20);
  });
  const pg = await ctx.newPage(), errs = [];
  pg.on('pageerror', (e) => errs.push(e.message));
  const wait = (ms) => pg.waitForTimeout(ms), key = async (k, n = 1, ms = 160) => { for (let i = 0; i < n; i++) { await pg.keyboard.press(k); await wait(ms); } };
  const until = async (fn, ms = 30000) => { for (let i = 0; i < ms / 100; i++) { if (await pg.evaluate(fn).catch(() => false)) return true; await wait(100); } return false; };
  const ev = (fn, a) => pg.evaluate(fn, a);
  await pg.goto(url); await wait(1200);
  await key('Space', 1, 900); await key('Space', 1, 700);
  for (let i = 0; i < 6; i++) { const ok = await ev(() => window.__dummiesUI.titleItems()[window.__dummies.titleSel % window.__dummiesUI.titleItems().length] === 'ARCADE'); if (ok) break; await key('ArrowDown'); }
  await key('Space', 1, 500);
  for (let i = 0; i < 6 && (await ev(() => window.__dummies.level)) !== +DIST; i++) await key('ArrowDown');
  await key('Space');
  await until(() => window.__dummies.sim && window.__dummies.sim.phase === 'brief');
  await ev(() => { const s = window.__dummies.sim; for (const v of window.STORY.VERBS) s.run.owned[v] = true; });
  await key('Space', 1, 400);
  await until(() => { const s = window.__dummies.sim; return s.phase === 'play' && !s.rescue && s.body.mode !== 'drop'; });
  await wait(1000);
  const st0 = await ev(() => { const s = window.__dummies.sim; return { district: s.levelId, tile: s.screenName(), x: s.body.x, y: s.body.y, t: s.t, log: window.__evlog.length }; });
  console.log('start', JSON.stringify(st0));
  const S = +SECS * 1000;
  const report = async (label) => {
    const r = await ev((n0) => {
      const L = window.__evlog.slice(n0), by = {}, cars = {};
      for (const e of L) { by[e.type] = (by[e.type] || 0) + 1; if (e.car && /notice|honk|bark|brake|knock|touch|impact/.test(e.type)) { const k = e.type + ' ' + e.car; cars[k] = cars[k] || []; cars[k].push(e.t); } }
      const many = Object.entries(cars).filter(([, ts]) => ts.length > 2).sort((a, b) => b[1].length - a[1].length).slice(0, 12).map(([k, ts]) => [k, ts.length, ts.slice(0, 10)]);
      const A = window.__dummiesAudio, played = A.log.filter((e) => e.kind === 'sfx').reduce((o, e) => ((o[e.id] = (o[e.id] || 0) + 1), o), {});
      return { events: by, repeatCars: many, played, findings: window.__qa.findings.map((f) => [f.type, f.detail, f.count]) };
    }, st0.log);
    console.log('==', label, JSON.stringify(r, null, 1));
  };
  if (SCEN === 'notice') { // stand still where the drone dropped the dummy, then step in and out of a lane's edge
    await wait(S); await report('stand still ' + SECS + ' s');
    for (let i = 0; i < S / 1200; i++) { await pg.keyboard.down('ArrowUp'); await wait(600); await pg.keyboard.up('ArrowUp'); await pg.keyboard.down('ArrowDown'); await wait(600); await pg.keyboard.up('ArrowDown'); }
    await report('step up and down ' + SECS + ' s');
  } else if (SCEN === 'block') { // stand in a lane ahead of a car until it stops for the dummy; stay 15 s; again
    const t1 = Date.now() + S, held = new Set(), K = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    let target = null, standUntil = 0;
    while (Date.now() < t1) {
      const d = await ev((tg) => { const s = window.__dummies.sim, b = s.body; if (!tg) { const cs = s.cars.filter((c) => !c.ghost && s.meets(c) && c.v > 20 && !c.spent).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y)); const c = cs[0]; if (!c) return null; tg = { x: c.x + Math.cos(c.h) * 90, y: c.y + Math.sin(c.h) * 90 }; } return { tg, dx: tg.x - b.x, dy: tg.y - b.y }; }, target);
      if (!d) { await wait(300); continue; }
      target = d.tg;
      const want = new Set(), l = Math.hypot(d.dx, d.dy);
      if (Date.now() < standUntil) { /* stand */ } else if (l > 14) { if (d.dy < -0.38 * l) want.add('up'); if (d.dy > 0.38 * l) want.add('down'); if (d.dx < -0.38 * l) want.add('left'); if (d.dx > 0.38 * l) want.add('right'); }
      else if (!standUntil || Date.now() > standUntil + 500) { standUntil = Date.now() + 15000; }
      if (standUntil && Date.now() > standUntil) { target = null; standUntil = 0; }
      for (const k of [...held]) if (!want.has(k)) { held.delete(k); await pg.keyboard.up(K[k]); }
      for (const k of want) if (!held.has(k)) { held.add(k); await pg.keyboard.down(K[k]); }
      await wait(200);
    }
    for (const k of held) await pg.keyboard.up(K[k]);
    const g = await ev((n0) => { const A = window.__dummiesAudio, out = {}; for (const e of window.__evlog.slice(n0)) if (e.type === 'honk') { const k = e.car; (out[k] = out[k] || { reached: 0, gated: 0, t: [] }).reached++; out[k].t.push(e.t); }
      for (const l of A.log) if (l.kind === 'gated' && l.id === 'honk') { (out[l.car] = out[l.car] || { reached: 0, gated: 0, t: [] }).gated++; }
      return { cars: out, played: A.log.filter((l) => l.kind === 'sfx' && /^honk/.test(l.id)).length }; }, st0.log);
    console.log('== honks per car: reached the engine, silenced by the cap; honk cues played', g.played); for (const [k, v] of Object.entries(g.cars)) console.log(k, v.reached, v.gated, JSON.stringify(v.t));
  } else if (SCEN === 'lean') { // every car spent; the dummy walks into the nearest one, again and again
    const t1 = Date.now() + S, held = new Set(), K = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
    while (Date.now() < t1) {
      const d = await ev(() => { const s = window.__dummies.sim, b = s.body; for (const c of s.cars) c.spent = true; const cs = s.cars.filter((c) => !c.ghost && s.meets(c)).sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y)); const c = cs[0]; return c ? [c.x - b.x, c.y - b.y] : null; });
      const want = new Set(); if (d) { const l = Math.hypot(d[0], d[1]) || 1; if (d[1] < -0.38 * l) want.add('up'); if (d[1] > 0.38 * l) want.add('down'); if (d[0] < -0.38 * l) want.add('left'); if (d[0] > 0.38 * l) want.add('right'); }
      for (const k of [...held]) if (!want.has(k)) { held.delete(k); await pg.keyboard.up(K[k]); }
      for (const k of want) if (!held.has(k)) { held.add(k); await pg.keyboard.down(K[k]); }
      await wait(250);
    }
    for (const k of held) await pg.keyboard.up(K[k]);
    const g = await ev((n0) => { const A = window.__dummiesAudio, out = {}; for (const e of window.__evlog.slice(n0)) if (/^(knock|touch-spent|honk)$/.test(e.type)) { const k = e.type + ' ' + e.car; (out[k] = out[k] || { events: 0, gated: 0, t: [] }).events++; out[k].t.push(e.t); }
      for (const l of A.log) if (l.kind === 'gated' && out[l.id + ' ' + l.car]) out[l.id + ' ' + l.car].gated++; return out; }, st0.log);
    console.log('== per car: events that reached the engine (cue or cooldown), events the cap silenced'); for (const [k, v] of Object.entries(g).sort((a, b) => b[1].events - a[1].events).slice(0, 10)) console.log(k, v.events, v.gated, JSON.stringify(v.t.slice(0, 12)));
    await report('lean on spent cars ' + SECS + ' s');
  } else if (SCEN === 'dashwear') { // row 629: the dash's take by the chassis's wear
    for (const share of [1, 0.6, 0.5, 0.31, 0.2]) {
      await ev((k) => { const s = window.__dummies.sim, b = s.body; b.health = k * (s.maxHealth ? s.maxHealth() : s.P['damage.bodyHealth']); b.charge = 9; window.__dummiesAudio.last.clear(); }, share);
      const n0 = await ev(() => window.__dummiesAudio.log.length);
      await wait(900); await pg.keyboard.press('Space'); await wait(900);
      const got = await ev((n) => window.__dummiesAudio.log.slice(n).filter((l) => /^lunge/.test(l.id)).map((l) => l.id + ' ' + l.file), n0);
      console.log('health ' + share + ' (wear ' + (1 - share).toFixed(2) + '):', JSON.stringify(got));
    }
  } else if (SCEN === 'tick') { // every car on screen spent: the roof tick (ui.spentTick)
    await ev(() => { for (const c of window.__dummies.sim.cars) c.spent = true; }); await wait(400);
    await pg.locator('#game').screenshot({ path: path.join(__dirname, 'runs', 'spent_tick.png') });
    const cs = await ev(() => { const S = window.__dummiesScale(); return window.__dummies.sim.cars.filter((c) => !c.ghost).map((c) => [Math.round(c.x), Math.round(c.y)]); }); console.log('cars', JSON.stringify(cs));
  } else if (SCEN === 'shot') { await pg.locator('#game').screenshot({ path: path.join(__dirname, 'repro.jpg') }); }
  else if (SCEN === 'eval') { console.log(await ev(new Function(process.argv[5] || 'return 1'))); }
  if (errs.length) console.log('page errors', errs);
  await br.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
