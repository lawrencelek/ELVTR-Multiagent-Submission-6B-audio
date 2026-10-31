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
    if (process.env.GRACE != null) await ev((g) => { window.__dummies.sim.P['proto.contactGraceSeconds'] = g; }, +process.env.GRACE);
    const simT0 = await ev(() => window.__dummies.sim.t);
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
    const simE = await ev((t0) => { const s = window.__dummies.sim, out = {}; for (const e of s.events) if (e.t > t0 && /^(knock|touch-spent|impact)$/.test(e.type)) { const k = e.type; out[k] = (out[k] || 0) + 1; } const per = {}; for (const e of s.events) if (e.t > t0 && e.type === 'knock') per[e.car] = (per[e.car] || 0) + 1; return { all: out, knockPerCar: per, simSeconds: +(s.t - t0).toFixed(1), grace: s.P['proto.contactGraceSeconds'] }; }, simT0);
    console.log('== sim events (all emitted)', JSON.stringify(simE));
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
  } else if (SCEN === 'conemove') { // Lawrence, 31 October 16:29: a cone moved; cars still divert round where it was
    if (process.env.FLAG != null) await ev((f) => { window.__dummies.sim.P['proto.driver.dodgeFollowsCone'] = f; }, +process.env.FLAG);
    let put = null;
    for (let i = 0; i < 40 && !put; i++) { put = await ev(() => { const s = window.__dummies.sim, X = window.DUMMIES, cn = s.cones.find((q) => q.state === 'free'); if (!cn) return null;
      for (const c of s.cars.filter((q) => !q.ghost && q.v > 20 && q.path && !q.deck)) { const p = X.pathAt(c.path, c.s + 180); if (p.x > 80 && p.x < 720 && p.y > 80 && p.y < 560) { cn.x = p.x; cn.y = p.y; cn.vx = 0; cn.vy = 0; return { cone: cn.id, x: Math.round(p.x), y: Math.round(p.y), path: c.id }; } }
      return null; }); if (!put) await wait(250); }
    console.log('cone placed', JSON.stringify(put));
    const watch = async (secs, label) => { const t1 = Date.now() + secs * 1000, seen = {};
      while (Date.now() < t1) { const r = await ev((cid) => { const s = window.__dummies.sim, cn = s.cones.find((q) => q.id === cid); return { t: +s.t.toFixed(1), cone: cn && [Math.round(cn.x), Math.round(cn.y), cn.state], cars: s.cars.filter((c) => !c.ghost).map((c) => ({ id: c.id, d: +c.d.toFixed(1), man: c.man && c.man.type, cause: c.cause, dodge: c.dodge && c.dodge.id, dodgeS: c.dodge && Math.round(c.dodge.s), s: Math.round(c.s), x: Math.round(c.x), y: Math.round(c.y), state: c.state })) }; }, put.cone);
        for (const c of r.cars) if (c.dodge === put.cone || (c.cause === 'cone' && c.man)) { const k = c.id; if (!seen[k]) seen[k] = []; seen[k].push([r.t, c.state, c.man, c.d, 'dodgeS ' + c.dodgeS, 's ' + c.s, c.x + ',' + c.y]); }
        await wait(250); }
      console.log('==', label); for (const [k, v] of Object.entries(seen)) console.log(' ', k, JSON.stringify(v[0]), '…', JSON.stringify(v[v.length - 1]), v.length + ' samples');
      return seen; };
    await watch(10, 'cone in the lane, 10 s');
    const moved = await ev((cid) => { const s = window.__dummies.sim, cn = s.cones.find((q) => q.id === cid); cn.x = cn.hx; cn.y = cn.hy; return [Math.round(cn.x), Math.round(cn.y)]; }, put.cone);
    console.log('cone moved to', JSON.stringify(moved), 'at sim t', await ev(() => +window.__dummies.sim.t.toFixed(1)));
    await wait(1500);
    console.log('why', JSON.stringify(await ev(() => { const s = window.__dummies.sim, P = s.P; return s.cars.filter((c) => !c.ghost && c.dodge).map((c) => ({ id: c.id, d: +c.d.toFixed(1), gone: s.coneGone ? s.coneGone(c.dodge) : 'n/a', dodge: c.dodge, passedS: c.s - c.L / 2 > c.dodge.s + P['proto.returnClearance'],
      bodyBeside: s.bodyBeside(c, -c.d), carBeside: s.carBeside(c, -c.d), corridor: s.corridorBlocked(c, -c.d), fwd: c.det && c.det.fwd && c.det.fwd.id, orbit: !!c.orbit, signal: c.signal, intent: c.intent && c.intent.type, man: c.man && c.man.type, state: c.state, flag: P['proto.driver.dodgeFollowsCone'] })); })));
    await watch(20, 'after the move, 20 s');
  } else if (SCEN === 'pauseshot') { // the pause page and its Controls page, with the cue key
    await ev(() => { for (const c of window.__dummies.sim.cars) if (!c.ghost) c.hz = c.hz || { inPath: false }; });
    await pg.keyboard.press('Escape'); await wait(700);
    await pg.screenshot({ path: path.join(__dirname, 'runs', 'pause.png') });
    const i = await ev(() => window.__dummiesUI.pauseItems().indexOf('Controls'));
    for (let k = 0; k < i; k++) { await pg.keyboard.press('ArrowDown'); await wait(80); }
    await pg.keyboard.press('Space'); await wait(700);
    await pg.screenshot({ path: path.join(__dirname, 'runs', 'pause_controls.png') });
    console.log('shots: qa/runs/pause.png, pause_controls.png');
  } else if (SCEN === 'noticeicon') { // the cue key's 'Has noticed you' row, flash on and off; and a noticed car in play
    await ev(() => { window.__dummies.sim.P['proto.art.noticeFlashHz'] = 0.25; });
    await pg.keyboard.press('Escape'); await wait(400);
    for (let k = 0; k < 2; k++) { await pg.screenshot({ path: path.join(__dirname, 'runs', 'notice_' + k + '.png'), clip: { x: 440, y: 110, width: 80, height: 50 } }); await wait(2100); }
    await pg.keyboard.press('Escape'); await wait(300);
    const car = await ev(() => { const s = window.__dummies.sim, b = s.body, c = s.cars.filter((q) => !q.ghost && !q.spent && q.x > 60 && q.x < 740 && q.y > 60 && q.y < 580)[0]; if (!c) return null; const ab = s.assessBody.bind(s); s.assessBody = (q) => ab(q) || { inPath: false, near: true, lx: 900, ly: 900, d: 900 }; const S = window.__dummiesScale(), r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; window.__hold = setInterval(() => { c.hz = c.hz || { inPath: false }; c.nearT = 9; c.v = 0; }, 16); return { id: c.id, h: c.h, sx: r.left + ((c.x / 2) * S.scale + S.ox) / d, sy: r.top + ((c.y / 2) * S.scale + S.oy) / d, kpx: S.kpx }; });
    await ev(() => { window.__dummies.sim.P['proto.art.noticeFlashHz'] = 0.004; }); console.log('car', JSON.stringify(car)); await wait(800); console.log('noticed', await ev(() => { const s = window.__dummies.sim; return JSON.stringify({ n: s.cars.length, hz: s.cars.filter((c) => c.hz).length, near: s.cars.filter((c) => c.hz && (c.nearT || 0) >= s.P['perception.reactionDelay']).length, look: window.__dummiesUI.carLook().map((l) => [l.noticed, l.flash]).slice(0, 6), hzP: s.P['proto.art.noticeFlashHz'] }); }));
    if (car) for (let k = 0; k < 2; k++) { await pg.locator('#game').screenshot({ path: path.join(__dirname, 'runs', 'notice_car_' + k + '.png') }); await wait(2100); }
    console.log('shots: qa/runs/notice_0.png, notice_1.png');
  } else if (SCEN === 'conexray') { // row 637: a cone under a highway deck, with the x-ray and without
    const at = await ev(() => { const s = window.__dummies.sim, fl = (s.level.floors || []).filter((f) => (f.kind === 'deck' || f.kind === 'walk' || f.kind === 'bridge') && f.w > 20 && f.h > 20); const cn = s.cones.find((q) => q.state === 'free'); if (!fl.length || !cn) { const rg = (s.level.floors || []).find((f) => f.kind === 'ring'); if (rg && cn) { const g = s.level.ring || rg; const cx = g.cx != null ? g.cx : 400, cy = g.cy != null ? g.cy : 320, R = g.R || g.r || g.Rin || 60; cn.x = cx + R * 0.0; cn.y = cy - (g.Rout || R) * 0.9; const c2 = s.cones.filter((q) => q.state === 'free')[1]; if (c2) { c2.x = cx - (g.Rout || R) * 0.9; c2.y = cy; } return { ring: Object.keys(g), cx, cy, R, Rout: g.Rout, x: cn.x, y: cn.y }; } return { floors: (s.level.floors || []).map((f) => f.kind) }; }
      const f = fl[0], cxx = Math.max(f.x + 10, Math.min(f.x + f.w - 10, 400)), cyy = Math.max(f.y + 10, Math.min(f.y + f.h - 10, 320)); cn.x = cxx; cn.y = cyy; const c2 = s.cones.filter((q) => q.state === 'free')[1]; if (c2) { c2.x = cxx + 24; c2.y = cyy; }
      const S = window.__dummiesScale(), r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; return { x: cn.x, y: cn.y, f: [f.x, f.y, f.w, f.h], S }; });
    console.log('cone at', JSON.stringify(at));
    for (const f of [1, 0]) { await ev((v) => { window.__dummies.sim.P['ui.conesXray'] = v; }, f); await wait(300); await pg.locator('#game').screenshot({ path: path.join(__dirname, 'runs', 'cone_xray_' + f + '.png') }); }
  } else if (SCEN === 'tick') { // every car on screen spent: the roof tick (ui.spentTick)
    await ev(() => { for (const c of window.__dummies.sim.cars) c.spent = true; }); await wait(400);
    await pg.locator('#game').screenshot({ path: path.join(__dirname, 'runs', 'spent_tick.png') });
    const cs = await ev(() => { const S = window.__dummiesScale(); return window.__dummies.sim.cars.filter((c) => !c.ghost).map((c) => [Math.round(c.x), Math.round(c.y)]); }); console.log('cars', JSON.stringify(cs));
  } else if (SCEN === 'shot') { await pg.locator('#game').screenshot({ path: path.join(__dirname, 'repro.jpg') }); }
  else if (SCEN === 'eval') { console.log(await ev(new Function(process.argv[5] || 'return 1'))); }
  if (errs.length) console.log('page errors', errs);
  await br.close(); srv.close();
})().catch((e) => { console.error(e); process.exit(1); });
