// The adversarial QA agent for Prototype 9: plays Arcade for a set time and tries to break it. Three personas:
//   clipper    walks, dashes and jumps into every wall, corner, stair side, hill edge and screen edge it can find; wiggles in corners;
//              rams and jumps cars. Hunts: the dummy inside a solid, through a wall, trapped, off the screen
//   saboteur   stands in lanes ahead of cars, drops and throws cones in their way, hitches, walks into traffic until written off.
//              Hunts: honks and barks that never end, cars that never move again, a car inside a car, the dummy inside a car
//   chaos      mashes and holds every key (opposites together), pauses mid-move, mutes, steps the volume, hides the tab, blurs the
//              window, resizes to a phone and back, taps the canvas and the sound control. Hunts: menus that lock, music that
//              sticks or doubles, errors
// The page carries qa/monitor.js (the checks); this file drives the game and probes. Clipper and saboteur fit every part at the
// start of each run (s.run.owned), so the dash, jump, grab, throw and hitch are all there to abuse; chaos plays the arcade as issued.
//   node qa/agent.js --persona clipper --minutes 30 --out qa/runs/<stamp> [--seed 7] [--build prototypes/p9/dummies_p9.html]
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const ROOT = path.resolve(__dirname, '..');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const PERSONA = arg('persona', 'clipper'), MINUTES = +arg('minutes', 30), SEED = +arg('seed', 1 + Math.floor(Math.random() * 1e6));
const OUT = path.resolve(arg('out', path.join(ROOT, 'qa', 'runs', 'dev')), PERSONA), HTML = path.resolve(arg('build', path.join(ROOT, 'prototypes', 'p9', 'dummies_p9.html')));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg' };
fs.mkdirSync(path.join(OUT, 'shots'), { recursive: true });
let rs = SEED >>> 0; const rnd = () => { rs = (rs * 1664525 + 1013904223) >>> 0; return rs / 4294967296; };
const pick = (a) => a[Math.floor(rnd() * a.length)], chance = (p) => rnd() < p, between = (a, b) => a + rnd() * (b - a);

function serve() { // lengths and ranges, as GitHub Pages sends them (the music's duration needs them)
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      const size = fs.statSync(p).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''), ty = TYPES[path.extname(p)] || 'application/octet-stream';
      if (m) { const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1; res.writeHead(206, { 'Content-Type': ty, 'Content-Length': b - a + 1, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p, { start: a, end: b }).pipe(res); return; }
      res.writeHead(200, { 'Content-Type': ty, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

// ---- what the agent reads each tick (one evaluate): the screen, the phase, the body and what is near it
function readState() {
  const app = window.__dummies, s = app && app.sim, UI = window.__dummiesUI, tr = document.getElementById('trace');
  const o = { screen: app.screen, paused: !!app.paused, pausePage: app.pausePage || null, credits: !!app.credits, name: !!app.nameEntry, gate: !!app.audioGate, titleSel: app.titleSel, titleItems: UI.titleItems(),
    level: app.level, levels: (window.DUMMIES.LEVEL_LIST || []).length, difficulty: app.difficulty, endSel: app.endSel, pauseSel: app.pauseSel, pauseItems: UI.pauseItems(), trace: tr ? !tr.hidden : false, realT: +app.realT.toFixed(2),
    mute: window.__dummiesAudio ? window.__dummiesAudio.settings.mute : null, music: window.__dummiesAudio ? window.__dummiesAudio.music.state : null };
  if (!s) return o;
  const b = s.body, P = s.P, r = P['body.radius'], near = (q, m) => q.x - m < b.x && b.x < q.x + q.w + m && q.y - m < b.y && b.y < q.y + q.h + m;
  Object.assign(o, { phase: s.phase, simT: +s.t.toFixed(2), district: s.levelId, tile: s.screenName ? s.screenName() : null, ending: s.run && s.run.ending ? s.run.ending.kind : null, rescue: !!s.rescue, W: P['world.width'], H: P['world.height'], r,
    giftReady: UI.giftReady ? !!UI.giftReady() : true, owned: s.run ? Object.keys(s.run.owned || {}).filter((k) => s.run.owned[k]).length : 0, writeOffs: s.run ? s.run.writeOffs : 0 });
  if (s.phase === 'ending') {
    const ranked = app.hsLast && app.hsLast.rank && app.hsLast.key !== 'story' ? ['Name this score'] : [], won = !(s.run.ending && s.run.ending.kind !== 'Licensed');
    o.endItems = ranked.concat([won ? 'Play this district again' : 'Retry this district', 'Choose a district', 'High scores', 'Show trace']);
  }
  if (!b) return o;
  o.b = { x: +b.x.toFixed(1), y: +b.y.toFixed(1), mode: b.mode, level: b.level, alive: b.alive, held: !!b.held, stair: !!b.stair, charge: b.charge != null ? +b.charge.toFixed(2) : null, health: +(b.health || 0).toFixed(2) };
  const G = s.level;
  o.rects = (b.level === 0 ? (G.statics || []).map((q) => [q, q.kind || 'static']).concat((G.stairs || []).map((q) => [q, 'stair'])) : (G.solidsZ || []).filter((q) => q.z === b.level).map((q) => [q, 'raised']))
    .filter(([q]) => near(q, 260)).slice(0, 40).map(([q, k]) => ({ x: q.x, y: q.y, w: q.w, h: q.h, kind: k, jumpable: !!q.jumpable }));
  o.poly = []; if (b.level === 0) for (const p of G.polys0 || []) for (const v of p) { const x = v[0] != null ? v[0] : v.x, y = v[1] != null ? v[1] : v.y; if (Math.hypot(x - b.x, y - b.y) < 500 && x > 0 && x < o.W && y > 0 && y < o.H) o.poly.push([x, y]); }
  o.edges = {}; for (const sd of ['N', 'S', 'E', 'W']) { try { o.edges[sd] = !!s.edgeOpen(sd, sd === 'N' || sd === 'S' ? b.x : b.y); } catch (e) { o.edges[sd] = null; } }
  o.cars = (s.cars || []).filter((c) => !c.ghost && Math.hypot(c.x - b.x, c.y - b.y) < 520).map((c) => ({ id: c.id, x: +c.x.toFixed(1), y: +c.y.toFixed(1), h: +c.h.toFixed(3), v: +c.v.toFixed(1), L: c.L, W: c.W, cls: c.cls, spent: !!c.spent, state: c.state, meets: s.meets(c) }));
  o.cones = (s.cones || []).filter((cn) => cn.state === 'free').map((cn) => ({ x: +cn.x.toFixed(1), y: +cn.y.toFixed(1) })).sort((a, c) => Math.hypot(a.x - b.x, a.y - b.y) - Math.hypot(c.x - b.x, c.y - b.y)).slice(0, 4);
  return o;
}
function fitAll() { const s = window.__dummies.sim; if (!s || !s.run || !window.STORY) return 0; let n = 0; for (const v of window.STORY.VERBS) if (!s.run.owned[v]) { s.run.owned[v] = true; n++; } return n; }

(async () => {
  const srv = await serve(), port = srv.address().port, url = `http://127.0.0.1:${port}/${path.relative(ROOT, HTML).split(path.sep).join('/')}`;
  const { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--disable-renderer-backgrounding', '--disable-background-timer-throttling'] });
  const ctx = await br.newContext({ viewport: { width: 720, height: 450 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.addInitScript({ path: path.join(__dirname, 'monitor.js') });
  let pg = await ctx.newPage();
  const T0 = Date.now(), END = T0 + MINUTES * 60000, el = () => ((Date.now() - T0) / 1000).toFixed(1);
  const inputs = [], shotKeys = new Set(), findings = [], counts = { probes: 0, wallStops: 0, trapped: 0, reloads: 0, crashes: 0, runs: 0, districts: {}, actions: 0 };
  let shots = 0;
  const fout = fs.createWriteStream(path.join(OUT, 'findings.jsonl')), hout = fs.createWriteStream(path.join(OUT, 'heartbeat.jsonl'));
  const note = (a) => { inputs.push([+el(), a]); if (inputs.length > 60) inputs.shift(); counts.actions++; };
  const attach = (p) => { p.on('pageerror', (e) => record({ type: 'page-error', sev: 'critical', detail: e.message, key: 'pageerror|' + e.message.slice(0, 80) })); p.on('crash', () => { counts.crashes++; record({ type: 'page-crash', sev: 'critical', detail: 'the page crashed', key: 'crash' }); }); };
  attach(pg);
  const ev = (fn, a) => pg.evaluate(fn, a).catch(() => null);
  const wait = (ms) => pg.waitForTimeout(ms).catch(() => new Promise((ok) => setTimeout(ok, ms)));
  async function shot(name) { if (shots >= 150) return null; const f = `${String(++shots).padStart(3, '0')}_${name.replace(/[^a-z0-9]+/gi, '-').slice(0, 50)}.jpg`; try { await pg.locator('#game').screenshot({ path: path.join(OUT, 'shots', f), type: 'jpeg', quality: 70, timeout: 4000 }); return f; } catch (e) { return null; } }
  async function record(f) {
    f.persona = PERSONA; f.wall = +el(); f.inputs = inputs.slice(-25);
    if ((f.sev === 'critical' || f.sev === 'major') && !shotKeys.has(f.key)) { shotKeys.add(f.key); f.shot = await shot(f.type); }
    findings.push(f); fout.write(JSON.stringify(f) + '\n');
    console.log(`[${PERSONA} ${el()}s] ${f.sev.toUpperCase()} ${f.type}: ${f.detail}`);
  }
  // ---- keys
  const held = new Set();
  const DIRK = { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' };
  async function steer(dirs) {
    const want = new Set(dirs);
    for (const d of [...held]) if (!want.has(d)) { held.delete(d); await pg.keyboard.up(DIRK[d]).catch(() => {}); }
    for (const d of want) if (!held.has(d)) { held.add(d); await pg.keyboard.down(DIRK[d]).catch(() => {}); }
    ev((m) => { window.__qa.intent = m ? { move: m, since: performance.now() / 1000 } : null; }, dirs.length ? dirs.join('+') : null);
    if (dirs.length) note('hold ' + dirs.join('+'));
  }
  // the monitor keeps intent.since from the first hold of a direction set; re-steering the same set keeps the clock
  let intentKey = '';
  async function hold(dirs) { const k = dirs.join('+'); if (k === intentKey) return; intentKey = k; await steer(dirs); }
  async function release() { intentKey = ''; await steer([]); }
  async function press(k, ms) { note('press ' + k); if (ms) { await pg.keyboard.down(k).catch(() => {}); await wait(ms); await pg.keyboard.up(k).catch(() => {}); } else await pg.keyboard.press(k).catch(() => {}); }
  const dirsTo = (dx, dy) => { const l = Math.hypot(dx, dy) || 1, o = []; if (dy < -0.38 * l) o.push('up'); if (dy > 0.38 * l) o.push('down'); if (dx < -0.38 * l) o.push('left'); if (dx > 0.38 * l) o.push('right'); return o; };
  const DIRS8 = [['up'], ['down'], ['left'], ['right'], ['up', 'left'], ['up', 'right'], ['down', 'left'], ['down', 'right']];

  // ---- menus: get back into play, and vary the route (districts, difficulty, the ending's choices)
  let districtTurn = Math.floor(rnd() * 5);
  async function menu(st) {
    await release();
    if (st.trace) { note('close trace'); await pg.click('#trace-close').catch(() => {}); return; }
    if (st.credits) return press('Space');
    if (st.name) { for (let i = 0; i < 3; i++) await press(pick(['KeyQ', 'KeyA', 'KeyZ', 'Digit7'])); return press('Enter'); }
    if (st.screen === 'intro') return press('Space');
    if (st.screen === 'title') { const i = st.titleItems.indexOf('ARCADE'), cur = st.titleSel % st.titleItems.length; if (cur !== i) return press('ArrowDown'); return press('Space'); }
    if (st.screen === 'arcade') { // the select lists only the districts open so far: learn how many from the cursor's wrap
      const A = menu.arc || (menu.arc = { n: null, last: null, presses: 0 });
      if (A.last != null && st.level < A.last) A.n = A.last + 1;
      const target = districtTurn % (A.n || st.levels || 5);
      if (st.level !== target && A.presses < 8) { A.last = st.level; A.presses++; return press('ArrowDown'); }
      A.last = null; A.presses = 0;
      if (chance(0.5)) await press(pick(['ArrowLeft', 'ArrowRight']));
      counts.runs++; note('district ' + st.level); return press('Space');
    }
    if (st.screen === 'scores' || st.screen === 'saves' || st.screen === 'storymap') return press('ShiftLeft');
    if (st.screen === 'loading') return wait(200);
    if (st.screen !== 'game') return press('Space');
    if (st.paused) { if (st.pausePage) return press('Escape'); return press('Escape'); }
    switch (st.phase) {
      case 'brief': if (PERSONA !== 'chaos') { const n = await ev(fitAll); if (n) note('fit every part (' + n + ')'); } return press('Space');
      case 'gift': case 'unveil': return st.giftReady ? press('Space') : wait(300);
      case 'report': return press('Space');
      case 'shop': if (chance(0.5)) { await press(pick(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'])); return press('Space'); } return press('ShiftLeft');
      case 'ending': {
        const it = st.endItems || [], want = chance(0.12) && it.includes('Name this score') ? 'Name this score' : chance(0.07) ? 'High scores' : chance(0.35) ? 'Choose a district' : it[it[0] === 'Name this score' ? 1 : 0];
        const i = Math.max(0, it.indexOf(want));
        if ((st.endSel || 0) % it.length !== i) return press('ArrowDown');
        if (want === 'Choose a district') districtTurn++;
        note('ending: ' + want); return press('Space');
      }
      default: return wait(150); // hitstop, scroll, writeoff, next, voyage: the game moves itself
    }
  }

  // ---- the eight-way probe: pushing and not moving is a wall, unless every way is shut (then the dummy is trapped)
  let lastProbe = 0;
  async function probe(st) {
    if (Date.now() - lastProbe < 8000) return;
    lastProbe = Date.now(); counts.probes++;
    await release();
    const pos = async () => { const s = await ev(() => { const b = window.__dummies.sim && window.__dummies.sim.body; return b && [b.x, b.y, b.mode, window.__dummies.sim.phase, b.alive]; }); return s; };
    const p0 = await pos(); if (!p0 || p0[3] !== 'play' || !p0[4]) return;
    let best = 0, how = null;
    for (const d of DIRS8) {
      await hold(d); await wait(450); const p = await pos(); await release(); await wait(60);
      if (!p || p[3] !== 'play') return;
      const m = Math.hypot(p[0] - p0[0], p[1] - p0[1]); if (m > best) { best = m; how = d.join('+'); }
      if (best > 12) break;
    }
    if (best <= 6) for (const k of ['KeyL', 'Space']) { await hold(pick(DIRS8)); await press(k); await wait(700); const p = await pos(); await release(); if (p) { const m = Math.hypot(p[0] - p0[0], p[1] - p0[1]); if (m > best) { best = m; how = k; } } }
    if (best > 6) { counts.wallStops++; return; }
    counts.trapped++;
    await record({ type: 'body-trapped', sev: 'critical', detail: `no way out: eight walks, a jump and a dash moved the dummy ${best.toFixed(1)} px at ${p0[0].toFixed(0)},${p0[1].toFixed(0)} on ${st.district} ${st.tile}`, key: 'trapped|' + st.district + ':' + st.tile + ':' + Math.round(p0[0] / 30) + ',' + Math.round(p0[1] / 30), state: { x: p0[0], y: p0[1], mode: p0[2], district: st.district, tile: st.tile, level: st.b && st.b.level, rects: (st.rects || []).filter((q) => Math.abs(q.x + q.w / 2 - p0[0]) < q.w / 2 + 40 && Math.abs(q.y + q.h / 2 - p0[1]) < q.h / 2 + 40) } });
    // out: the pause menu's Restart level
    await press('Escape'); await wait(300);
    const items = st.pauseItems || []; for (let i = 0; i < items.indexOf('Restart level'); i++) await press('ArrowDown');
    await press('Space'); note('restart level (trapped)');
  }

  // ---- the personas
  let plan = null;
  const nowS = () => Date.now() / 1000;
  function clipTarget(st) {
    const b = st.b, opts = [];
    for (const q of st.rects || []) {
      const cs = [[q.x, q.y], [q.x + q.w, q.y], [q.x, q.y + q.h], [q.x + q.w, q.y + q.h], [q.x + q.w / 2, q.y], [q.x + q.w / 2, q.y + q.h], [q.x, q.y + q.h / 2], [q.x + q.w, q.y + q.h / 2]];
      for (const c of cs) opts.push({ x: c[0], y: c[1], what: q.kind + (q.jumpable ? ' (jumpable)' : '') });
    }
    for (const v of st.poly || []) opts.push({ x: v[0], y: v[1], what: 'hill' });
    for (const sd of ['N', 'S', 'E', 'W']) if (st.edges && st.edges[sd] === false) opts.push({ x: sd === 'E' ? st.W + 30 : sd === 'W' ? -30 : b.x + between(-150, 150), y: sd === 'S' ? st.H + 30 : sd === 'N' ? -30 : b.y + between(-150, 150), what: 'closed edge ' + sd });
    for (const c of (st.cars || []).filter((c) => c.meets)) opts.push({ x: c.x, y: c.y, what: 'car ' + c.cls, car: c.id });
    if (!opts.length) opts.push({ x: between(40, st.W - 40), y: between(40, st.H - 40), what: 'open ground' });
    const o = pick(opts);
    return Object.assign(o, { until: nowS() + between(4, 9), attack: pick(['push', 'push', 'dash', 'jump', 'dashjump', 'wiggle', 'wiggle', 'slide']), stage: 'go' });
  }
  function laneAhead(st) { const cs = (st.cars || []).filter((c) => c.meets && c.v > 20 && !c.spent); if (!cs.length) return null; const c = pick(cs), d = between(70, 160); return { x: c.x + Math.cos(c.h) * d, y: c.y + Math.sin(c.h) * d, car: c.id }; }
  const P = {
    async clipper(st) {
      const b = st.b;
      if (!plan || nowS() > plan.until) plan = clipTarget(st);
      if (plan.car) { const c = (st.cars || []).find((q) => q.id === plan.car); if (c) { plan.x = c.x; plan.y = c.y; } }
      const dx = plan.x - b.x, dy = plan.y - b.y, d = Math.hypot(dx, dy), dir = dirsTo(dx, dy);
      if (plan.stage === 'go' && d > 55) return hold(dir.length ? dir : pick(DIRS8));
      plan.stage = 'hit';
      switch (plan.attack) {
        case 'dash': await hold(dir.length ? dir : pick(DIRS8)); await press('Space'); plan.attack = 'push'; return;
        case 'jump': await hold(dir.length ? dir : pick(DIRS8)); await press('KeyL'); plan.attack = 'push'; return;
        case 'dashjump': await hold(dir.length ? dir : pick(DIRS8)); await press('Space'); await wait(between(40, 160)); await press('KeyL'); plan.attack = 'push'; return;
        case 'wiggle': { const alt = DIRS8.filter((q) => q.some((k) => dir.includes(k))); return hold(pick(alt.length ? alt : DIRS8)); }
        case 'slide': { const perp = Math.abs(dx) > Math.abs(dy) ? [dir.find((k) => k === 'left' || k === 'right') || 'left', chance(0.5) ? 'up' : 'down'] : [dir.find((k) => k === 'up' || k === 'down') || 'up', chance(0.5) ? 'left' : 'right']; return hold(perp); }
        default: return hold(dir.length ? dir : pick(DIRS8));
      }
    },
    async saboteur(st) {
      const b = st.b;
      if (!plan || nowS() > plan.until) {
        const kind = pick(['block', 'block', 'cone', 'cone', 'hitch', 'traffic', 'throw']);
        plan = { kind, until: nowS() + (kind === 'block' ? between(14, 26) : between(8, 16)), stage: 'go' };
        if (kind === 'block') Object.assign(plan, laneAhead(st) || { x: between(80, st.W - 80), y: between(80, st.H - 80) });
        if (kind === 'cone' || kind === 'throw') { const c = st.cones && st.cones[0]; if (c && !b.held) Object.assign(plan, { x: c.x, y: c.y, stage: 'fetch' }); else Object.assign(plan, laneAhead(st) || { x: b.x, y: b.y }, { stage: b.held ? 'carry' : 'go' }); }
      }
      if (plan.kind === 'hitch' || plan.kind === 'traffic') {
        const cs = (st.cars || []).filter((c) => c.meets && !c.spent); const c = cs.sort((p, q) => Math.hypot(p.x - b.x, p.y - b.y) - Math.hypot(q.x - b.x, q.y - b.y))[0];
        if (!c) return hold(pick(DIRS8));
        const side = plan.kind === 'hitch' ? { x: c.x - Math.sin(c.h) * (c.W / 2 + 14), y: c.y + Math.cos(c.h) * (c.W / 2 + 14) } : { x: c.x + Math.cos(c.h) * 40, y: c.y + Math.sin(c.h) * 40 };
        const d = Math.hypot(side.x - b.x, side.y - b.y);
        await hold(dirsTo(side.x - b.x, side.y - b.y));
        if (plan.kind === 'hitch' && d < 34) { await press('KeyJ'); note('hitch try'); }
        if (plan.kind === 'traffic' && d < 60 && chance(0.3)) await press(pick(['Space', 'KeyI']));
        return;
      }
      const dx = plan.x - b.x, dy = plan.y - b.y, d = Math.hypot(dx, dy);
      if (plan.stage === 'fetch') { if (d > 14) return hold(dirsTo(dx, dy)); await release(); await press('KeyJ'); Object.assign(plan, laneAhead(st) || { x: between(80, st.W - 80), y: between(80, st.H - 80) }, { stage: 'carry' }); return; }
      if (plan.stage === 'carry') {
        if (d > 24) return hold(dirsTo(dx, dy));
        await release();
        if (plan.kind === 'throw') { const c = (st.cars || []).find((q) => q.meets && !q.spent); if (c) await hold(dirsTo(c.x - b.x, c.y - b.y)); await press('KeyI'); await release(); }
        else await press('KeyJ', 700); // a held X puts the cone down
        plan.stage = 'stand'; return;
      }
      if (plan.stage === 'go' && d > 18) return hold(dirsTo(dx, dy));
      plan.stage = 'stand'; return release(); // stand in the lane: let the cars come, honk and wait
    },
    async chaos(st) {
      const r = rnd();
      if (r < 0.32) return hold(pick([...DIRS8, ['up', 'down'], ['left', 'right'], ['up', 'down', 'left', 'right'], []]));
      if (r < 0.55) return press(pick(['Space', 'KeyL', 'KeyJ', 'KeyI', 'KeyK', 'KeyE', 'KeyQ', 'ShiftLeft', 'Enter', 'Backspace']), chance(0.3) ? Math.round(between(80, 900)) : 0);
      if (r < 0.60) { await press(pick(['Escape', 'KeyP'])); await wait(between(100, 600)); for (let i = 0, n = Math.floor(between(0, 5)); i < n; i++) await press(pick(['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight'])); if (chance(0.25)) { await press('Space'); await wait(200); } return; }
      if (r < 0.64) { await press('KeyM'); await wait(between(300, 2500)); const m = await ev(() => window.__dummiesAudio.settings.mute); if (m) await press('KeyM'); return; }
      if (r < 0.68) { for (let i = 0, n = Math.floor(between(1, 12)); i < n; i++) await press(pick(['Minus', 'Equal'])); return press('Equal', 0); }
      if (r < 0.70) { note('blur'); await ev(() => window.dispatchEvent(new Event('blur'))); return; }
      if (r < 0.72) { note('hide tab'); const p2 = await ctx.newPage(); await p2.bringToFront().catch(() => {}); await wait(between(1500, 6000)); await pg.bringToFront().catch(() => {}); await p2.close().catch(() => {}); return; }
      if (r < 0.74) { const v = pick([[390, 844], [844, 390], [1280, 760], [720, 450], [500, 500]]); note('resize ' + v.join('x')); await pg.setViewportSize({ width: v[0], height: v[1] }).catch(() => {}); return; }
      if (r < 0.80) { const bx = await pg.locator('#game').boundingBox().catch(() => null); if (!bx) return; const top = chance(0.4), x = bx.x + bx.width * (top ? between(0.7, 0.99) : rnd()), y = bx.y + bx.height * (top ? between(0, 0.1) : rnd()); note('tap ' + Math.round(x) + ',' + Math.round(y)); await pg.mouse.click(x, y).catch(() => {}); return; }
      return wait(between(50, 400));
    },
  };

  // ---- the run
  await pg.goto(url); await wait(1200);
  let lastBeat = 0, lastDrain = 0, sig = '', sigT = Date.now(), lastStuckKick = 0, nextMin = 1;
  console.log(`[${PERSONA}] seed ${SEED}, ${MINUTES} min, ${url}`);
  while (Date.now() < END) {
    let st = await ev(readState);
    if (!st) { await wait(500); st = await ev(readState); }
    if (!st) { counts.reloads++; await record({ type: 'page-unresponsive', sev: 'critical', detail: 'the page stopped answering; reloading', key: 'unresponsive|' + counts.reloads }); try { await pg.close(); } catch (e) { /* gone */ } pg = await ctx.newPage(); attach(pg); await pg.goto(url).catch(() => {}); await wait(1500); continue; }
    if (st.district) counts.districts[st.district] = (counts.districts[st.district] || 0) + 1;
    // the flow watchdog: the same menu or phase for 90 s while the agent acts on it
    const s2 = [st.screen, st.phase, st.paused, st.name, st.credits, st.trace].join('|'), inPlay = st.screen === 'game' && st.phase === 'play' && !st.paused;
    if (s2 !== sig) { sig = s2; sigT = Date.now(); }
    else if (!inPlay && Date.now() - sigT > 90000 && Date.now() - lastStuckKick > 90000) { lastStuckKick = Date.now(); await record({ type: 'flow-stuck', sev: 'critical', detail: 'stuck on ' + s2 + ' for 90 s while the agent pressed through it', key: 'flow|' + s2, state: st }); await press('Escape'); await press('ShiftLeft'); await press('Space'); }
    try {
      if (!inPlay || !st.b) await menu(st);
      else if (PERSONA === 'chaos') await P.chaos(st);
      else if (!st.b.alive || st.rescue || st.b.mode === 'drop') { await release(); plan = null; await wait(150); }
      else await P[PERSONA](st);
      if (PERSONA === 'chaos' && !inPlay && chance(0.15)) await P.chaos(st); // chaos also hammers the menus
    } catch (e) { await record({ type: 'agent-error', sev: 'minor', detail: String(e.message).slice(0, 200), key: 'agent|' + String(e.message).slice(0, 40) }); }
    if (Date.now() - lastDrain > 1000) {
      lastDrain = Date.now();
      const d = await ev(() => window.__qa && window.__qa.drain());
      if (d) { for (const f of d.fresh) await record(f); if (d.noProgress && inPlay && PERSONA !== 'chaos') await probe(st); }
    }
    if (Date.now() - lastBeat > 30000) {
      lastBeat = Date.now();
      const qs = await ev(() => window.__qa && window.__qa.stats);
      hout.write(JSON.stringify({ wall: +el(), screen: st.screen, phase: st.phase, district: st.district, tile: st.tile, simT: st.simT, music: st.music, findings: findings.length, counts, qa: qs }) + '\n');
      if ((Date.now() - T0) / 60000 >= nextMin) { nextMin = Math.floor((Date.now() - T0) / 60000) + 1; console.log(`[${PERSONA} ${el()}s] ${st.screen}/${st.phase || '-'} ${st.district || ''} ${st.tile || ''} · findings ${findings.length} · probes ${counts.probes} (trapped ${counts.trapped}) · runs ${counts.runs}`); }
    }
    await wait(PERSONA === 'chaos' ? 60 : 110);
  }
  await release();
  const qa = await ev(() => window.__qa && { stats: window.__qa.stats, findings: window.__qa.findings });
  const summary = { persona: PERSONA, seed: SEED, minutes: MINUTES, wall: +el(), counts, shots, findings: findings.length, bySev: findings.reduce((o, f) => ((o[f.sev] = (o[f.sev] || 0) + 1), o), {}), byType: findings.reduce((o, f) => ((o[f.type] = (o[f.type] || 0) + 1), o), {}), monitor: qa && qa.stats, monitorFindings: qa && qa.findings };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 1));
  console.log(`[${PERSONA}] done: ${findings.length} findings`, JSON.stringify(summary.byType));
  fout.end(); hout.end(); await br.close(); srv.close();
})().catch((e) => { console.error('agent failed:', e); process.exit(1); });
