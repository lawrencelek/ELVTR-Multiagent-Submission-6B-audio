// Prototype 9 (GDD Edit 100): the audio tests, headless.
//   node test_p9.js [--p84]          run tour_p9.js first (it writes shots/tour.json)
// 1. Files: every file in content/audio/cues.json loads over http (status 200), the music in OGG and MP3.
// 2. The tour (shots/tour.json): no page errors; each screen plays its state's track; nothing plays before the first press.
// 3. Coverage: every catalogued event and variant, sent to the engine with the fields its `when` needs, plays a file from its
//    own pool (a cue), its generated tone (synth), its base's (base), or is handled silently (silence).
// 4. The game's hooks: menus, the pause duck, Options (MUSIC, SOUND, MUTE, saved), the Sound Lab's picks (#audio=).
// 5. --p84: the shared code with audio.enabled off. Prototype 8.4 rebuilt from it draws the same strings as the frozen build.
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), cp = require('child_process');
const HERE = __dirname, ROOT = path.resolve(HERE, '..', '..');
const CUES = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/audio/cues.json'), 'utf8'));
const EVENTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/audio/events.json'), 'utf8'));
const TOUR = JSON.parse(fs.readFileSync(path.join(HERE, 'shots/tour.json'), 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg' };
const results = []; const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail: detail || '' }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' · ' + detail : '')); };

// serve(): lengths and ranges, as GitHub Pages sends them, so the music's duration is known
function serve() { return new Promise((res) => { const srv = http.createServer((req, r) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } const size = fs.statSync(p).size, m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || ''), ty = TYPES[path.extname(p)] || 'application/octet-stream'; if (m) { const a = m[1] ? +m[1] : 0, b = m[2] ? +m[2] : size - 1; r.writeHead(206, { 'Content-Type': ty, 'Content-Length': b - a + 1, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p, { start: a, end: b }).pipe(r); return; } r.writeHead(200, { 'Content-Type': ty, 'Content-Length': size, 'Accept-Ranges': 'bytes' }); fs.createReadStream(p).pipe(r); }); srv.listen(0, '127.0.0.1', () => res(srv)); }); }
const get = (url) => new Promise((res) => http.get(url, (r) => { r.resume(); res(r.statusCode); }).on('error', () => res(0)));

(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/prototypes/p9/`;
  // ---- 1. files
  const files = new Set();
  const dir = (f) => (CUES.files[f] && CUES.files[f].dir) || 'sfx';
  for (const c of Object.values(CUES.sfx)) for (const f of (c.files || []).concat(c.alternates || [], c.tone ? [c.tone] : [])) files.add('audio/' + dir(f) + '/' + f);
  for (const t of Object.values(CUES.music.tracks)) { files.add('audio/' + t.file); files.add('audio/' + t.mp3); }
  const bad = []; for (const f of files) { const st = await get(base + f.split('/').map(encodeURIComponent).join('/')); if (st !== 200) bad.push(f + ' ' + st); }
  ok('every file in the cue map loads (' + files.size + ')', !bad.length, bad.join(', '));

  // ---- 2. the tour
  const S = TOUR.steps, at = (name) => S.find((s) => s.name.startsWith(name)) || {};
  ok('the tour ran without page errors', !TOUR.errors.length, TOUR.errors.join(' | '));
  ok('nothing plays before the first press', !S[0].cues.some((c) => c.kind === 'sfx' || c.kind === 'music' || c.kind === 'ui') && at('intro').music.state == null);
  const want = { 'the first press': ['intro', CUES.music.states.intro], 'START': ['menu', CUES.music.states.menu], 'the Credits card': ['credits', typeof CUES.music.states.credits === 'number' ? CUES.music.states.credits : CUES.music.states.menu],
    'Arcade: district select': ['menu', CUES.music.states.menu], 'Arcade: the level card': ['card', CUES.music.rotation[0]], 'Arcade: the drone drop': ['level', CUES.music.rotation[0]],
    'Arcade ends: Licensed': ['licensed', CUES.music.states.licensed], 'Arcade ends: Failed test': ['failed', CUES.music.states.failed], 'Arcade ends: Non-compliant': ['noncompliant', CUES.music.states.noncompliant], 'Story: save slots': ['menu', CUES.music.states.menu], 'Story: the map': ['menu', CUES.music.states.menu],
    'Story: the level card (A1)': ['card', CUES.music.rotation[0]], 'Story: the drone drop': ['level', CUES.music.rotation[0]], 'Story: counted, cleared': ['cleared', CUES.music.states.cleared], 'Story: the ferry to the next tile': ['cleared', CUES.music.states.cleared], // row 631: cleared, to the next card
    'Story: the next card': ['card', CUES.music.rotation[1 % CUES.music.rotation.length]], 'Story: play on tile 2': ['level', CUES.music.rotation[1 % CUES.music.rotation.length]],
    'the finale': ['finale', CUES.music.states.finale], 'CERTIFIED': ['certified', CUES.music.states.certified] };
  for (const [name, [st, tr]] of Object.entries(want)) { const s = at(name); ok('music on "' + name + '": ' + st + ', Track ' + tr, s.music && s.music.state === st && s.music.track === tr, s.music ? s.music.state + ', Track ' + s.music.track : 'step missing'); }
  // Lawrence's ducks (rows 612, 613): the write-off 50%, the report and the workshop 70%, play 100%
  const ducks = { 'Arcade: play': 1, 'Arcade: a write-off': CUES.params['audio.music.writeoffDuck'], 'Arcade: the report': CUES.params['audio.music.screenDuck'], 'Arcade: the workshop': CUES.params['audio.music.screenDuck'], 'Story: the gift screen (ferry)': 1 /* row 631: the cleared music is not ducked */ };
  const dk = Object.entries(ducks).map(([n, want]) => [n, want, (at(n).music || {}).duck]);
  ok('the music ducks: write-off ' + CUES.params['audio.music.writeoffDuck'] + ', report and workshop ' + CUES.params['audio.music.screenDuck'] + ', play 1; the tile-cleared music never (row 631)', dk.every(([, w, got]) => got != null && Math.abs(got - w) < 0.06), dk.map(([n, w, g]) => n + ' ' + g + '/' + w).join(' · '));
  const heard = new Set(S.flatMap((s) => s.cues.filter((c) => c.kind === 'sfx' || c.kind === 'ui').map((c) => c.id)));
  ok('the tour heard ' + heard.size + ' cues through the game\'s hooks', heard.size >= 25, [...heard].join(' '));

  const { chromium } = require('playwright');
  const br = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
  const ctx = await br.newContext({ viewport: { width: 1280, height: 760 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const pg = await ctx.newPage(), errors = []; pg.on('pageerror', (e) => errors.push(e.message));
  await pg.goto(base + 'dummies_p9.html'); await pg.waitForTimeout(1200);
  ok('the intro waits behind the gate', await pg.evaluate(() => window.__dummies.audioGate === true && !window.__dummiesAudio.unlocked));
  await pg.keyboard.press('KeyZ'); await pg.waitForTimeout(500); // an unmapped key lifts the gate
  ok('an unmapped key unlocks audio and starts Track ' + CUES.music.states.intro, await pg.evaluate((t) => window.__dummiesAudio.unlocked && window.__dummiesAudio.track === t && window.__dummies.screen === 'intro', CUES.music.states.intro));

  // ---- 3. coverage: every entry
  const cat = []; for (const e of EVENTS.events) { cat.push({ id: e.id, when: {} }); for (const v of e.variants) cat.push({ id: v.id, base: e.id, when: v.when }); }
  const cov = await pg.evaluate((cat) => {
    const A = window.__dummiesAudio, out = [];
    const end = (x) => (typeof x === 'string' ? A.param(x, null) : x), mid = (v) => (v.max != null ? (end(v.min) + end(v.max)) / 2 : 1e9); // a range: its middle
    const sample = (w) => { const x = {}; for (const [k, v] of Object.entries(w || {})) x[k] = v === '*' ? 'car1' : Array.isArray(v) ? v[0] : v && typeof v === 'object' ? mid(v) : v; return x; };
    for (const it of cat) {
      const type = it.base || it.id, e = Object.assign({ type }, sample(it.when));
      A.last.clear(); A.voices = []; const n0 = A.log.length, handled = A.event(e), got = A.log.slice(n0).filter((l) => l.kind === 'sfx' || l.kind === 'ui' || l.kind === 'loading');
      out.push({ id: it.id, handled, got: got.map((l) => [l.id, l.file]) });
    }
    return out;
  }, cat);
  const fails = [];
  for (const r of cov) {
    const c0 = CUES.sfx[r.id], b = c0.variantOf ? CUES.sfx[c0.variantOf] : null, c = c0.decision === 'base' ? b : c0;
    const pool = c.decision === 'synth' ? (c.tone ? [c.tone] : []) : (c.files || []);
    if (c.decision === 'cue' || (c.decision === 'synth' && c.tone)) { if (!r.handled || !r.got.length || !pool.includes(r.got[0][1])) fails.push(r.id + ' (want ' + pool.join('/') + ', got ' + JSON.stringify(r.got) + ')'); }
    else if (c.decision === 'silence') { if (!r.handled || r.got.length) fails.push(r.id + ' (want silence)'); }
    else if (c.decision === 'synth') { if (r.handled) fails.push(r.id + ' (no tone: want the live synth)'); }
  }
  const counts = {}; for (const c of Object.values(CUES.sfx)) counts[c.decision] = (counts[c.decision] || 0) + 1;
  ok('every catalogued event and variant does what the map says (' + cov.length + ': ' + Object.entries(counts).map(([k, v]) => v + ' ' + k).join(', ') + ')', !fails.length, fails.join('; '));
  ok('the catalogue and the cue map hold the same ' + cat.length + ' entries', cat.length === Object.keys(CUES.sfx).length && cat.every((x) => CUES.sfx[x.id]));

  // ---- 4. the game's hooks
  await pg.keyboard.press('Space'); await pg.waitForTimeout(600);
  ok('START plays ui-start and fades to Track ' + CUES.music.states.menu, await pg.evaluate((t) => window.__dummiesAudio.log.some((l) => l.id === 'ui-start') && window.__dummiesAudio.track === t, CUES.music.states.menu));
  // the fades (row 633): no dip at the loop's seam, frame by frame (rows 609–632 faded out and back in there)
  const fade = await pg.evaluate(() => new Promise((done) => {
    const A = window.__dummiesAudio, p = A.music.players[A.music.cur], out = [];
    const go = () => { const mid = p.level; p.el.currentTime = p.el.duration - 0.4; const t0 = performance.now();
      const f = () => { out.push([+p.el.currentTime.toFixed(3), +(p.level / mid).toFixed(3)]); if (performance.now() - t0 < 1300) requestAnimationFrame(f); else done({ mid, out, dur: p.el.duration }); }; requestAnimationFrame(f); };
    let n = 0; const ready = () => { if (p && isFinite(p.el.duration) && !p.el.paused && p.el.currentTime > 0) { p.el.currentTime = p.el.duration / 2; setTimeout(go, 500); } else if (++n < 100) setTimeout(ready, 100); else done({ none: true, dur: p && p.el.duration, paused: p && p.el.paused }); };
    ready(); // the track's length is known once it loads
  }));
  const fmin = fade && fade.out && Math.min(...fade.out.map((x) => x[1])), fend = fade && fade.out && fade.out[fade.out.length - 1][1], looped = fade && fade.out && fade.out.some((x) => x[0] < 0.2);
  ok('the music holds its level across the loop\'s seam: no fade there (row 633)', fade && fade.out && fade.mid > 0 && looped && fmin > 0.9 && fend > 0.9, fade && fade.out ? 'min ' + fmin + ', end ' + fend + ', looped ' + looped : JSON.stringify(fade));
  await pg.keyboard.press('ArrowRight'); await pg.waitForTimeout(200);
  ok('a cursor move plays ui-move', await pg.evaluate(() => window.__dummiesAudio.log.slice(-3).some((l) => l.id === 'ui-move')));
  // Arcade to play, then pause
  await pg.evaluate(() => { const it = window.__dummiesUI.titleItems(); window.__dummies.titleSel = it.indexOf('ARCADE'); });
  await pg.keyboard.press('Space'); await pg.waitForTimeout(400); await pg.keyboard.press('Space');
  for (let i = 0; i < 200 && !(await pg.evaluate(() => window.__dummies.sim && window.__dummies.sim.phase === 'brief')); i++) await pg.waitForTimeout(100);
  await pg.keyboard.press('Space'); for (let i = 0; i < 300 && !(await pg.evaluate(() => window.__dummies.sim && window.__dummies.sim.phase === 'play' && !window.__dummies.sim.rescue)); i++) await pg.waitForTimeout(100);
  await pg.waitForTimeout(400);
  ok('Arcade run 1 plays the rotation\'s first track', await pg.evaluate((t) => window.__dummiesAudio.state === 'level' && window.__dummiesAudio.track === t, CUES.music.rotation[0]));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(700);
  const duck = await pg.evaluate(() => window.__dummiesAudio.music.duck);
  ok('pause ducks the music to audio.music.pauseDuck (' + CUES.params['audio.music.pauseDuck'] + ')', Math.abs(duck - CUES.params['audio.music.pauseDuck']) < 0.05, 'duck ' + duck.toFixed(2));
  const oi = await pg.evaluate(() => window.__dummiesUI.pauseItems().indexOf('Options'));
  for (let i = 0; i < oi; i++) { await pg.keyboard.press('ArrowDown'); await pg.waitForTimeout(80); }
  await pg.keyboard.press('Space'); await pg.waitForTimeout(300);
  const items = await pg.evaluate(() => window.__dummiesUI.optionItems());
  ok('Options shows VOLUME, MUSIC, SFX and MUTE', /^Volume: \d+ \/ 10$/.test(items[0]) && /^Music: \d+ \/ 10$/.test(items[1]) && /^SFX: \d+ \/ 10$/.test(items[2]) && /^Mute: (on|off)$/.test(items[3]), items.slice(0, 4).join(' · '));
  await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(150); await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(150);
  const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('dummies.p9.audio') || 'null'));
  ok('VOLUME − twice is saved (dummies.p9.audio)', saved && saved.master === CUES.params['audio.settings.master'] - 2 && saved.music === CUES.params['audio.settings.music'], JSON.stringify(saved));
  // the BODY readout (row 620): a live chassis at 0.3 health reads 1, not 0
  const bodyTxt = await pg.evaluate(() => new Promise((done) => {
    const s = window.__dummies.sim; s.body.health = 0.3; const seen = []; const f0 = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, x, y, w) { seen.push(String(t)); return f0.apply(this, arguments); };
    setTimeout(() => { CanvasRenderingContext2D.prototype.fillText = f0; const i = seen.lastIndexOf('BODY'); s.body.health = 300; done(i >= 0 ? seen[i + 1] : null); }, 200);
  }));
  ok('a live chassis never reads BODY 0 (ui.hud.bodyCeil): 0.3 health reads ' + bodyTxt, bodyTxt === '1', String(bodyTxt));
  // the cone brief and the floor (row 620), on Monument A2 itself (brief: a cone-baited car)
  const brief = await pg.evaluate(() => {
    const mk = () => { const pr = STORY.newProgress(); pr.district = 'monument'; pr.done = { monument: ['A1', 'B1', 'C1', 'C2', 'B2'] }; for (const n of ['legs1', 'hands1', 'battery1']) pr.owned[n] = true;
      const s = new STORY.StorySim('monument', Object.assign({}, window.DUMMIES_SIM), pr); let n = 0;
      while ((s.phase !== 'play' || s.rescue) && n++ < 6000) { if (s.phase === 'brief') s.continueBrief(); else if (s.phase === 'gift') s.continueGift(); else s.step({}); }
      return s; };
    const hit = (s, o) => { const c = s.cars.find((q) => !q.ghost && !q.deck); c.spent = false; c.cause = o.cause; c.coneT = o.ago == null ? undefined : s.t - o.ago; const b = s.body; b.health = o.health; s.events.length = 0;
      s.account([{ k: 0, car: c, closing: 1, ph: { raw: o.dmg, assessed: o.dmg, un: 1, angle: 0, dvd: 1, knock: null }, px: b.x, py: b.y, zone: 'front', carState: 'committed', cause: c.cause, coneT: c.coneT, lunging: true, stopped: false }]);
      const imp = s.events.find((e) => e.type === 'impact'); return { tile: s.screenName(), alive: b.alive, health: +b.health.toFixed(3), coned: !!(imp && imp.coned), counted: s.events.some((e) => e.type === 'story-count') }; };
    const a = mk(), out = {};
    out.oldCone = hit(a, { cause: 'body', ago: 20, health: 200, dmg: 400 });       // reacted to a cone 20 s ago: not baited, held at the floor
    out.smallMiss = hit(a, { cause: 'body', health: 1, dmg: 0.6 });                // a tap that misses, at the floor: stays at 1
    out.chain = hit(mk(), { cause: 'body', ago: 2, health: 300, dmg: 400 });       // stopped for the dummy 2 s after the cone: baited, written off, counted
    out.floorBrief = hit(mk(), { cause: 'cone', health: 1, dmg: 0.6 });            // at the floor, a small hit to the brief: written off
    return out;
  });
  ok('the cone brief counts the chain the cone starts; a miss holds at 1, small hits included; at 1 a hit to the brief writes off (row 620)',
    brief.oldCone.tile === 'A2' && brief.oldCone.alive && brief.oldCone.health === 1 && !brief.oldCone.coned && brief.smallMiss.alive && brief.smallMiss.health === 1
    && !brief.chain.alive && brief.chain.coned && brief.chain.counted && !brief.floorBrief.alive && brief.floorBrief.counted, JSON.stringify(brief));
  // the QA caps (rows 623–625): a car honks twice at most; knock and touch-spent off one spent car twice in any 2 s; car-notice and barks silent (row 647: a shout sounds; touch-spent silent)
  const caps = await pg.evaluate(() => {
    const s = window.__dummies.sim, A = window.__dummiesAudio, G = window.__dummiesUI.audGate, c = s.cars.find((q) => !q.ghost), was = c.spent, t = s.t;
    const honk = [0, 1, 2, 3].map((i) => G({ type: 'honk', car: 'qa-car', at: 'body', t: t + i * 5 }));
    c.spent = true;
    const spent = [0, 0.4, 0.8, 1.2, 2.1].map((d) => G({ type: 'touch-spent', car: c.id, t: t + d }));
    const knock = [0, 0.4, 0.8, 2.3].map((d) => G({ type: 'knock', car: c.id, t: t + d }));
    c.spent = false; const live = [0, 0.1, 0.2].map((d) => G({ type: 'knock', car: c.id, t: t + 5 + d })); c.spent = was;
    A.last.clear(); const n0 = A.log.length, hn = A.event({ type: 'bark', car: c.id }), hc = A.event({ type: 'car-notice', car: c.id }), hs = A.event({ type: 'bark', style: 'shout', car: c.id });
    return { honk, spent, knock, live, silent: [hn, hc, hs], played: A.log.slice(n0).filter((l) => l.kind === 'sfx').map((l) => l.id), decisions: ['car-notice', 'bark', 'bark.shout'].map((k) => A.cues.sfx[k].decision), P: [A.param('audio.sfx.honkMaxPerCar'), A.param('audio.sfx.spentRepeatMax'), A.param('audio.sfx.spentRepeatSeconds')] };
  });
  ok('a car honks ' + caps.P[0] + ' times at most (audio.sfx.honkMaxPerCar; row 623)', caps.honk.join() === 'false,false,true,true', JSON.stringify(caps.honk));
  ok('knock and touch-spent off one spent car: ' + caps.P[1] + ' in any ' + caps.P[2] + ' s, each (audio.sfx.spentRepeatMax, spentRepeatSeconds; row 624); a live car is not capped',
    caps.spent.join() === 'false,false,true,true,false' && caps.knock.join() === 'false,false,true,false' && caps.live.join() === 'false,false,false', JSON.stringify([caps.spent, caps.knock, caps.live]));
  ok('car-notice and plain barks are silent (row 625); a shouted bark sounds, once (row 647)', caps.decisions.join() === 'silence,silence,cue' && caps.silent.every(Boolean) && caps.played.join() === 'bark.shout', JSON.stringify(caps));
  const ctl = () => pg.evaluate(() => { const c = window.__dummies.sndCtl, S = window.__dummiesScale(), r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; if (!c) return null; const f = (x, y) => [r.left + (x * S.scale + S.ox) / d, r.top + (y * S.scale + S.oy) / d]; return { ref: [c.x, c.y, c.w, c.h], icon: f(c.x + 20, c.y + c.h / 2), mid: f((c.sx0 + c.sx1) / 2, c.y + c.h / 2) }; });
  const onPause = await ctl();
  await pg.mouse.click(onPause.icon[0], onPause.icon[1]); await pg.waitForTimeout(150);
  const m1 = await pg.evaluate(() => [window.__dummiesAudio.settings.mute, window.__dummies.paused, JSON.parse(localStorage.getItem('dummies.p9.audio')).mute]);
  await pg.mouse.click(onPause.mid[0], onPause.mid[1]); await pg.waitForTimeout(150);
  const m2 = await pg.evaluate(() => [window.__dummiesAudio.settings.mute, window.__dummiesAudio.settings.master]);
  ok('the pause page\'s sound control mutes, and its slider sets the volume and unmutes', m1[0] === true && m1[1] === true && m1[2] === true && m2[0] === false && m2[1] === 5, JSON.stringify([m1, m2]));
  const pgI = await ctx.newPage(); await pgI.goto(base + 'dummies_p9.html'); await pgI.waitForTimeout(900);
  const onIntro = await pgI.evaluate(() => window.__dummies.sndCtl && [window.__dummies.sndCtl.x, window.__dummies.sndCtl.y, window.__dummies.sndCtl.w]);
  const iv = await pgI.evaluate(() => { const c = window.__dummies.sndCtl, S = window.__dummiesScale(), r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; return [r.left + (c.x * 1 + 20) * S.scale / d + S.ox / d, r.top + (c.y + c.h / 2) * S.scale / d + S.oy / d]; });
  await pgI.mouse.click(iv[0], iv[1]); await pgI.waitForTimeout(200);
  const gateUp = await pgI.evaluate(() => [window.__dummies.screen, window.__dummies.audioGate]);
  await pgI.keyboard.press('Space'); await pgI.waitForTimeout(500);
  const onTitle = await pgI.evaluate(() => window.__dummies.sndCtl && [window.__dummies.sndCtl.x, window.__dummies.sndCtl.y, window.__dummies.sndCtl.w]);
  ok('the sound control sits in one place on the intro, the mode select and the pause page; on the intro it lifts the gate without START', onIntro && onTitle && onIntro.join() === onTitle.join() && onIntro.join() === onPause.ref.slice(0, 3).join() && gateUp[0] === 'intro' && gateUp[1] === false, JSON.stringify([onIntro, onTitle, onPause.ref, gateUp]));
  const sv = () => pgI.evaluate(() => Object.assign({}, window.__dummiesAudio.settings));
  const k0 = await sv(); await pgI.keyboard.press('KeyM'); await pgI.waitForTimeout(100); const k1 = await sv();
  await pgI.keyboard.press('Minus'); await pgI.waitForTimeout(100); const k2 = await sv();
  ok('M toggles mute; − steps the volume down one and unmutes', k1.mute === !k0.mute && k2.master === Math.max(0, k1.master - 1) && (k2.master === 0 || !k2.mute), JSON.stringify([k0, k1, k2]));
  // the dropdown (row 616): the caret opens MUSIC and SFX; each slider sets its own level; a tap away closes it, and only that
  const toPx = (x, y) => pgI.evaluate(([x, y]) => { const S = window.__dummiesScale(), r = document.getElementById('game').getBoundingClientRect(), d = window.devicePixelRatio || 1; return [r.left + (x * S.scale + S.ox) / d, r.top + (y * S.scale + S.oy) / d]; }, [x, y]);
  let cc = await pgI.evaluate(() => window.__dummies.sndCtl); let q = await toPx(cc.cx0 + 18, cc.y + cc.h / 2); await pgI.mouse.click(q[0], q[1]); await pgI.waitForTimeout(200);
  cc = await pgI.evaluate(() => window.__dummies.sndCtl);
  const rowsOk = !!(cc.panel && cc.panel.rows.length === 2 && cc.panel.rows[0].key === 'music' && cc.panel.rows[1].key === 'sound');
  if (rowsOk) { const [r0, r1] = cc.panel.rows; q = await toPx(r0.sx0 + (r0.sx1 - r0.sx0) * 0.3, (r0.y0 + r0.y1) / 2); await pgI.mouse.click(q[0], q[1]); await pgI.waitForTimeout(120); q = await toPx(r1.sx0 + (r1.sx1 - r1.sx0) * 0.9, (r1.y0 + r1.y1) / 2); await pgI.mouse.click(q[0], q[1]); await pgI.waitForTimeout(120); }
  const lv = await pgI.evaluate(() => [window.__dummiesAudio.settings.music, window.__dummiesAudio.settings.sound, JSON.parse(localStorage.getItem('dummies.p9.audio'))]);
  const scr0 = await pgI.evaluate(() => [window.__dummies.screen, window.__dummies.titleSel]); q = await toPx(200, 420); await pgI.mouse.click(q[0], q[1]); await pgI.waitForTimeout(200);
  const away = await pgI.evaluate(() => [!!window.__dummies.sndOpen, window.__dummies.screen, window.__dummies.titleSel]);
  ok('the dropdown opens MUSIC and SFX sliders, each sets its own level (saved); a tap away only closes it', rowsOk && lv[0] === 3 && lv[1] === 9 && lv[2].music === 3 && lv[2].sound === 9 && away[0] === false && away[1] === scr0[0] && away[2] === scr0[1], JSON.stringify([rowsOk, lv, scr0, away]));
  await pgI.close();
  // the Sound Lab's picks, by URL
  const picks = { sfx: { lunge: { files: ['boost.wav'] }, impact: { decision: 'silence' } }, music: { states: { menu: 5 }, rotation: [6, 5] } };
  const b64 = Buffer.from(JSON.stringify(picks)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const pg2 = await ctx.newPage(); pg2.on('pageerror', (e) => errors.push(e.message));
  await pg2.goto(base + 'dummies_p9.html#audio=' + b64); await pg2.waitForTimeout(1000);
  const m = await pg2.evaluate(() => { const A = window.__dummiesAudio; return { lunge: A.cues.sfx.lunge.files, impact: A.cues.sfx.impact.decision, menu: A.cues.music.states.menu, rot: A.cues.music.rotation, hash: location.hash, stored: !!localStorage.getItem('dummies.p9.audio.lab') }; });
  ok('the game takes the Sound Lab\'s picks from #audio= and keeps them', m.lunge.join() === 'boost.wav' && m.impact === 'silence' && m.menu === 5 && m.rot.join() === '6,5' && !m.hash && m.stored, JSON.stringify(m));
  await pg2.evaluate(() => localStorage.removeItem('dummies.p9.audio.lab'));
  // malformed picks never stop the game (the review's repro: {"sfx":{"impact":null}}), and an emptied pool is silent, as the Lab shows it
  const badPicks = Buffer.from(JSON.stringify({ sfx: { impact: null, lunge: { files: [1, 'nope.wav'] }, pickup: { files: [] } }, music: { rotation: [] } })).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const pg3 = await ctx.newPage(); const e3 = []; pg3.on('pageerror', (e) => e3.push(e.message));
  await pg3.goto(base + 'dummies_p9.html#audio=' + badPicks); await pg3.waitForTimeout(1000);
  const r3 = await pg3.evaluate(() => { const A = window.__dummiesAudio; A.last.clear(); const n0 = A.log.length, h = A.event({ type: 'pickup' }); return { up: !!window.__dummies && !!A, lunge: A.cues.sfx.lunge.files, pickup: h && A.log.length === n0, rot: A.cues.music.rotation.length }; });
  ok('malformed picks are dropped and the game starts; an emptied pool is silent', !e3.length && r3.up && r3.lunge.length === 0 && r3.pickup && r3.rot === CUES.music.rotation.length, JSON.stringify(r3) + ' ' + e3.join(' | '));
  await pg3.evaluate(() => localStorage.removeItem('dummies.p9.audio.lab'));
  ok('no page errors in the hook tests', !errors.length, errors.join(' | '));
  ok('no audio engine errors', !(await pg.evaluate(() => window.__dummiesAudio.errors.length)), JSON.stringify(await pg.evaluate(() => window.__dummiesAudio.errors)));
  await br.close();

  // the sound design is frozen (row 645): every file, the cue map, the engine, the Lab, the registry's audio.* as frozen
  let fz = ''; try { fz = cp.execFileSync('python3', [path.join(ROOT, 'audio/freeze.py'), '--check'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { fz = String(e.stdout || e.message); }
  ok('the sound design matches its freeze, or the freeze is open by a ruling (audio/FREEZE.json, rows 645–646)', / 0 changed|; open: /.test(fz), fz.trim().split('\n').slice(0, 6).join(' | '));
  // ---- 5. Prototype 8.4 from the shared code, audio off
  if (process.argv.includes('--p84')) {
    const tmp = fs.mkdtempSync(path.join(require('os').tmpdir(), 'p84-'));
    const orig = path.join(ROOT, 'prototypes/p8/dummies_p8_4.html'), keep = fs.readFileSync(orig);
    cp.execFileSync('python3', [path.join(ROOT, 'prototypes/p8/build.py')], { cwd: ROOT });
    const rebuilt = path.join(tmp, 'rebuilt_p8_4.html'); fs.copyFileSync(orig, rebuilt); fs.writeFileSync(orig, keep); // the frozen file stays byte for byte
    for (const f of ['p8_4_page.html']) { const pth = path.join(ROOT, 'prototypes/p8', f); if (fs.existsSync(pth)) cp.execFileSync('git', ['checkout', '--', 'prototypes/p8/' + f], { cwd: ROOT, stdio: 'ignore' }); }
    const audit = (html, out) => cp.execFileSync('node', [path.join(ROOT, 'prototypes/p8/text_audit.js'), html, out], { cwd: path.join(ROOT, 'prototypes/p8'), encoding: 'utf8' }).trim().split('\n')[0];
    const a1 = audit(orig, path.join(tmp, 'frozen.json')), a2 = audit(rebuilt, path.join(tmp, 'rebuilt.json'));
    const t1 = JSON.parse(fs.readFileSync(path.join(tmp, 'frozen.json'))), t2 = JSON.parse(fs.readFileSync(path.join(tmp, 'rebuilt.json')));
    // Live traffic makes two tours differ: car barks (wrapped, one line at a time) and objective counts. Those are not compared
    const fleet = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/db/fleet.json'), 'utf8')), win = { FLEET_DB: fleet };
    try { require('vm').runInNewContext(fs.readFileSync(path.join(ROOT, 'prototypes/p8/lore.js'), 'utf8'), { window: win }); } catch (e) { /* lore patches only */ }
    const barkText = fleet.barks.map((b) => String(b.text)), isBark = (x) => barkText.some((t) => t.includes(x.trim()) || x.trim().split(/\s+/).length > 2 && t.replace(/\{\w+\}/g, '').includes(x.trim().split(/\s+/).slice(0, 3).join(' ')));
    const live = (x) => isBark(x) || /\(\d+ of \d+\)|\d+ \/ \d+/.test(x);
    const s1 = new Set(t1.texts.map((t) => t.text).filter((x) => !live(x))), s2 = new Set(t2.texts.map((t) => t.text).filter((x) => !live(x))), dyn = /\d+:\d{2}|\d+ ms|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|pad:/;
    const diff = [...s1].filter((x) => !s2.has(x) && !dyn.test(x)).concat([...s2].filter((x) => !s1.has(x) && !dyn.test(x)));
    ok('Prototype 8.4 rebuilt from the shared code draws what the frozen build draws, barks and live counts aside (' + a1 + ' / ' + a2 + ')', !diff.length && !t2.errors.length, diff.slice(0, 8).join(' | '));
    ok('the frozen dummies_p8_4.html is unchanged (md5 9f5549201d88891f9f0b22c461602909)', require('crypto').createHash('md5').update(fs.readFileSync(orig)).digest('hex') === '9f5549201d88891f9f0b22c461602909');
  }
  srv.close();
  const passed = results.filter((r) => r.pass).length;
  fs.writeFileSync(path.join(HERE, 'shots', 'test_p9.json'), JSON.stringify({ passed, total: results.length, results }, null, 1));
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})();
