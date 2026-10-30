// Prototype 9 (GDD Edit 100): the sound tour. A scripted walk through every screen and the main gameplay points, with a
// screenshot of each and the cues the audio engine logged on the way (window.__dummiesAudio.log).
//   node tour_p9.js [build.html] [out folder]      (defaults: dummies_p9.html, shots/)
// Serves the repository over http on a free port, so the audio loads by URL as it does on GitHub Pages. Writes
// <out>/<shot>.jpg for each gameplay point, <out>/tour.json (steps, shots, cues, music) and prints a summary.
// The Sound Lab shows these shots beside each cue; the GDD's tables cite them.
'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
const HERE = __dirname, ROOT = path.resolve(HERE, '..', '..');
const HTML = path.resolve(process.argv[2] || path.join(HERE, 'dummies_p9.html')), OUT = path.resolve(process.argv[3] || path.join(HERE, 'shots'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg' };

function serve() {
  return new Promise((ok) => {
    const srv = http.createServer((req, res) => {
      const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0]));
      if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); res.end(); return; }
      const size = fs.statSync(p).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''), ty = TYPES[path.extname(p)] || 'application/octet-stream';
      if (m) { const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1; res.writeHead(206, { 'Content-Type': ty, 'Content-Length': b - a + 1, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p, { start: a, end: b }).pipe(res); return; }
      res.writeHead(200, { 'Content-Type': ty, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p).pipe(res); // lengths and ranges, as GitHub Pages sends them
    });
    srv.listen(0, '127.0.0.1', () => ok(srv));
  });
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const srv = await serve(), port = srv.address().port, url = `http://127.0.0.1:${port}/${path.relative(ROOT, HTML).split(path.sep).join('/')}`;
  const { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }), errors = [];
  const ctx = await br.newContext({ viewport: { width: 1280, height: 760 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(e.message));
  const wait = async (fn, ms) => { for (let i = 0; i < (ms || 20000) / 100; i++) { if (await pg.evaluate(fn).catch(() => false)) return true; await pg.waitForTimeout(100); } return false; };
  const key = async (k, n, ms) => { for (let i = 0; i < (n || 1); i++) { await pg.keyboard.press(k); await pg.waitForTimeout(ms || 160); } };
  const sim = (fn, arg) => pg.evaluate(fn, arg).catch((e) => errors.push('tour: ' + e.message));
  const steps = [], shots = {};
  let seen = 0;
  const mark = async (name, shot) => {
    const st = await pg.evaluate((n) => { const A = window.__dummiesAudio, L = A ? A.log.slice(n) : []; return { n: A ? A.log.length : 0, cues: L, state: A && A.state, track: A && A.track, duck: A ? +A.music.duck.toFixed(2) : null, screen: window.__dummies.screen, phase: window.__dummies.sim && window.__dummies.sim.phase }; }, seen);
    seen = st.n;
    const step = { step: steps.length + 1, name, shot: shot || null, screen: st.screen, phase: st.phase || null, music: { state: st.state, track: st.track, duck: st.duck }, cues: st.cues.map((c) => ({ kind: c.kind, id: c.id, file: c.file })) };
    steps.push(step);
    if (process.env.TOUR_VERBOSE) console.log(step.step, name, '|', st.screen, st.phase || '', '|', st.state, st.track, '|', step.cues.map((c) => c.id + (c.file ? '=' + c.file : '')).join(' '));
    if (shot && !shots[shot]) { await pg.locator('#game').screenshot({ path: path.join(OUT, shot + '.jpg'), type: 'jpeg', quality: 82 }); shots[shot] = step.step; }
    return step;
  };
  const items = () => pg.evaluate(() => window.__dummiesUI.titleItems());
  const goTo = async (name) => { await pg.waitForTimeout(250); const [i, cur, n] = await pg.evaluate((nm) => { const it = window.__dummiesUI.titleItems(); return [it.indexOf(nm), window.__dummies.titleSel % it.length, it.length]; }, name); const k = (i - cur + n) % n; if (k) await key('ArrowRight', k); };
  const live = () => wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'play' && !window.__dummies.sim.rescue, 30000);
  const near = () => sim(() => { const s = window.__dummies.sim, b = s.body, cs = (s.allCars ? s.allCars() : s.cars || []).filter((c) => !c.spent && !c.ghost); let best = null, bd = 1e9; for (const c of cs) { const d = Math.hypot(c.x - b.x, c.y - b.y); if (d < bd) { bd = d; best = c; } } return best && best.id; });
  const hit = (big) => sim((bg) => { // a hit as the sim logs one, at the nearest car, with its burst
    const s = window.__dummies.sim, b = s.body, cs = (s.allCars ? s.allCars() : s.cars || []).filter((c) => !c.ghost); let c = cs[0]; for (const q of cs) if (Math.hypot(q.x - b.x, q.y - b.y) < Math.hypot(c.x - b.x, c.y - b.y)) c = q;
    const a = bg ? 320 : 90; s.effects.push({ type: 'burst', x: b.x - 6, y: b.y, v: a, mult: 1, combo: 1, cmult: 1, t: s.t, zone: 'front', angle: 0, layer: b.level || 0 });
    s.emit('impact', { car: c && c.id, model: c && c.model, cls: c && c.cls, zone: 'front', part: 'torso', closing: 3, angle: 0, dv: 3, strike: 1, raw: a, assessed: a, lost: a / 4, health: b.health, carState: 'cruise', cause: 'body', bait: false, lunging: true, learned: null, stopped: false, plate: false, highway: false, drop: false, deck: false, dropZ: 0, dropFrom: null, combo: 1, mult: 1, kind: 'dash', jump: false, ricochet: false, held: false });
  }, !!big);

  await pg.goto(url); await pg.waitForTimeout(1500);
  await wait(() => Math.floor(window.__dummies.realT * 2) % 2 === 0 && window.__dummies.realT % 0.5 < 0.3, 3000); // the prompt blinks: shoot it lit
  await mark('intro, before the first press (PRESS ANY KEY)', 'intro');
  await key('Space', 1, 1200); await mark('the first press: audio unlocks, Track 1');
  await key('Space', 1, 800); await mark('START: the mode select, Track 2', 'title');
  await key('ArrowRight', 1, 250); await key('ArrowLeft', 1, 250); await mark('cursor moves');
  const caret = await pg.evaluate(() => { const c = window.__dummies.sndCtl, S = window.__dummiesScale(), r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; return c && [r.left + ((c.cx0 + 18) * S.scale + S.ox) / d, r.top + ((c.y + c.h / 2) * S.scale + S.oy) / d]; });
  if (caret) { await pg.mouse.click(caret[0], caret[1]); await pg.waitForTimeout(300); await mark('the sound control\'s dropdown: MUSIC and SFX', 'sound'); await pg.mouse.click(caret[0], caret[1]); await pg.waitForTimeout(200); }
  const it = await items();
  if (it.includes('CREDITS')) { await goTo('CREDITS'); await key('Space', 1, 600); await mark('the Credits card', 'credits'); await key('Space', 1, 400); }
  if (it.includes('HIGH SCORES')) { await goTo('HIGH SCORES'); await key('Space', 1, 600); await mark('high scores', 'scores'); await key('ShiftLeft', 1, 400); }

  // ---------- Arcade
  await goTo('ARCADE'); await key('Space', 1, 500); await mark('Arcade: district select', 'arcade');
  await key('Space');
  await wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'brief', 30000); await pg.waitForTimeout(700); await mark('Arcade: the level card');
  await key('Space', 1, 900); await mark('Arcade: the drone drop, the level track');
  await live(); await pg.waitForTimeout(1200); await mark('Arcade: play');
  await key('Space', 1, 140); await mark('Arcade: a dash');
  await pg.waitForTimeout(900);
  await sim(() => { const s = window.__dummies.sim; for (const n of window.STORY.VERBS) s.run.owned[n] = true; }); // every part fitted, for the moves
  await key('KeyL', 1, 160); await mark('Arcade: a jump');
  await pg.waitForTimeout(800);
  await hit(false); await pg.waitForTimeout(120); await mark('Arcade: a hit');
  await sim(() => { const s = window.__dummies.sim; s.emit('combo', { n: 3, mult: 2, kinds: ['dash', 'jump'], bonus: 40, car: null }); }); await pg.waitForTimeout(300); await mark('Arcade: a combo', 'combo');
  await pg.waitForTimeout(500);
  await sim(() => { const s = window.__dummies.sim; s.emit('pickup', { cone: 'k1', n: 1 }); s.emit('cone-hit', { cone: 'k1', car: null, n: 1, mult: 1, kinds: [], points: 25 }); }); await pg.waitForTimeout(350); await mark('Arcade: cones', 'cones');
  await pg.waitForTimeout(500);
  await sim(() => { const s = window.__dummies.sim; s.emit('drone-dispatch', { cone: 'k1' }); s.emit('drone-dispatch', { rescue: true }); }); await pg.waitForTimeout(350); await mark('drones', 'drone');
  await pg.waitForTimeout(700);
  await sim(() => { const s = window.__dummies.sim, b = s.body; b.hits.push({ kind: 'dash', cls: 'van', combo: 1, assessed: 120, lost: 30, angle: 90, model: 'VAN-02' }); b.health = 0; s.writeOff(); s.checkTerminal(); });
  await pg.waitForTimeout(350); await mark('Arcade: a write-off', 'writeoff');
  await wait(() => window.__dummies.sim.phase === 'report', 8000); await pg.waitForTimeout(500); await mark('Arcade: the report', 'report');
  await key('Space', 1, 600); await mark('Arcade: the workshop', 'workshop');
  await sim(() => { const s = window.__dummies.sim; s.run.credits += 9; }); await key('Space', 1, 400); await mark('Arcade: a purchase');
  await key('ArrowRight', 3, 200); await key('ShiftLeft', 1, 600);
  await live(); await pg.waitForTimeout(600);
  await key('Escape', 1, 500); await mark('pause: the music ducks', 'pause');
  const oi = await pg.evaluate(() => window.__dummiesUI.pauseItems().indexOf('Options'));
  if (oi >= 0) { await key('ArrowDown', oi); await key('Space', 1, 500); await mark('Options: VOLUME, MUSIC, SFX, MUTE', 'options'); await key('ArrowRight', 1, 250); await key('ArrowLeft', 1, 250); await mark('Options: VOLUME adjusted'); await key('Escape', 1, 300); await key('ArrowUp', oi); }
  await key('Escape', 1, 500); await mark('resume');
  await sim(() => { const s = window.__dummies.sim; s.phase = 'play'; s.end('Licensed'); }); await pg.waitForTimeout(900); await mark('Arcade ends: Licensed', 'ending');
  await pg.evaluate(() => { window.__dummies.screen = 'title'; window.__dummies.sim = null; window.__dummies.titleSel = 0; }); await pg.waitForTimeout(600); await mark('back to the title');

  // ---------- Story
  await goTo('STORY'); await key('Space', 1, 500); await mark('Story: save slots', 'saves'); await key('Space', 1, 300); await key('Enter', 1, 600);
  if (await pg.evaluate(() => window.__dummies.screen === 'splash')) { await pg.waitForTimeout(1300); await mark('Story: the splash', 'splash'); await key('Space', 1, 600); }
  await mark('Story: the map', 'map');
  await key('Space'); await wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'brief', 30000); await pg.waitForTimeout(700); await mark('Story: the level card (A1)', 'card');
  await key('Space', 1, 500);
  if (await pg.evaluate(() => !!(window.__dummies.sim && window.__dummies.sim.rescue && window.__dummies.sim.rescue.dropIn))) { await pg.waitForTimeout(500); await mark('Story: the drone drop', 'drop'); }
  await live(); await pg.waitForTimeout(1500); await mark('Story: play on tile 1', 'play');
  await sim(() => { const s = window.__dummies.sim; for (const n of window.STORY.VERBS) s.run.owned[n] = true; const b = s.body; b.charge = s.capacity(); }); // the tour fits every part, to show the moves
  await key('Space', 1, 120); await mark('Story: a dash', 'dash');
  await pg.waitForTimeout(700);
  await key('KeyL', 1, 160); await mark('Story: a jump', 'jump');
  await pg.waitForTimeout(900);
  await hit(true); await pg.waitForTimeout(110); await mark('Story: a big hit', 'impact');
  await pg.waitForTimeout(800);
  await sim(() => { const s = window.__dummies.sim; s.emit('story-deliver', { tile: 'B1', node: 'battery1' }); s.emit('story-count', { tile: 'A1', n: 1, need: 1 }); s.emit('story-clear', { tile: 'A1', next: 'B1' }); });
  await pg.waitForTimeout(500); await mark('Story: counted, cleared', 'story');
  await sim(() => { const s = window.__dummies.sim; s.emit('gift', { node: 'legs1' }); }); await pg.waitForTimeout(1100); await mark('Story: the gift screen', 'gift');
  await pg.waitForTimeout(2600);
  await sim(() => { const s = window.__dummies.sim, b = s.body; b.hits.push({ kind: 'dash', cls: 'van', combo: 1, assessed: 120, lost: 30, angle: 90, model: 'VAN-02' }); b.health = 0; s.writeOff(); s.checkTerminal(); });
  await wait(() => window.__dummies.sim.phase === 'report', 8000); await pg.waitForTimeout(400); await mark('Story: the report'); await key('Space', 1, 600);
  await wait(() => !!(window.__dummies.sim.rescue && window.__dummies.sim.rescue.ferry), 15000); await pg.waitForTimeout(900); await mark('Story: the ferry to the next tile', 'ferry');
  const gf = await wait(() => window.__dummies.sim.phase === 'gift', 40000); await pg.waitForTimeout(1000); await mark('Story: the gift screen (ferry)' + (gf ? '' : ' not reached'));
  await pg.waitForTimeout(2600); await key('Space', 1, 400);
  const b1 = await wait(() => window.__dummies.sim.phase === 'brief', 20000); await pg.waitForTimeout(500); await mark('Story: the next card' + (b1 ? '' : ' not reached'));
  await key('Space', 1, 500); await live(); await pg.waitForTimeout(1200); await mark('Story: play on tile 2: the next level track');
  await sim(() => { const s = window.__dummies.sim; s.unveil = { plaque: { chassis: 34, points: 414850, bestCombo: 5, t: 5420 }, done: false }; s.phase = 'unveil'; s.emit('unveil', s.unveil.plaque); });
  await pg.waitForTimeout(2600); await mark('the finale: the plaque, Track 1', 'plaque');
  await sim(() => { const s = window.__dummies.sim; s.phase = 'play'; s.end('Certified'); }); await pg.waitForTimeout(900); await mark('CERTIFIED', 'certified');

  const audio = await pg.evaluate(() => ({ log: window.__dummiesAudio.log.length, settings: window.__dummiesAudio.settings, errors: window.__dummiesAudio.errors }));
  for (const e of audio.errors || []) errors.push('audio: ' + e);
  await br.close(); srv.close();
  const out = { html: path.basename(HTML), steps, shots, errors, audio };
  fs.writeFileSync(path.join(OUT, 'tour.json'), JSON.stringify(out, null, 1));
  const cues = new Set(steps.flatMap((s) => s.cues.filter((c) => c.kind === 'sfx' || c.kind === 'ui').map((c) => c.id)));
  console.log(`${steps.length} steps · ${Object.keys(shots).length} shots · ${cues.size} cues heard · tracks ${[...new Set(steps.flatMap((s) => s.cues.filter((c) => c.kind === 'music').map((c) => c.id)))].join(', ')} · ${errors.length} page errors`);
  for (const e of errors) console.log('ERROR ' + e);
})();
