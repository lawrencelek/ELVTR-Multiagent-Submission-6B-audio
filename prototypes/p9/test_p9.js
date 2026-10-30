// Prototype 9 (GDD Edit 100): the audio tests, headless.
//   node test_p9.js [--p84]          run tour_p9.js first (it writes shots/tour.json)
// 1. Files: every file in content/audio/cues.json loads over http (status 200), the music in OGG and M4A.
// 2. The tour (shots/tour.json): no page errors; each screen plays its state's track; nothing plays before the first press.
// 3. Coverage: every catalogued event and variant, sent to the engine with the fields its `when` needs, plays a file from its
//    own pool (a cue), plays its base's pool (base), or is handled silently (silence); synth leaves it to Prototype 8.4.
// 4. The game's hooks: menus, the pause duck, Options (MUSIC, SOUND, MUTE, saved), the Sound Lab's picks (#audio=).
// 5. --p84: the shared code with audio.enabled off. Prototype 8.4 rebuilt from it draws the same strings as the frozen build.
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), cp = require('child_process');
const HERE = __dirname, ROOT = path.resolve(HERE, '..', '..');
const CUES = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/audio/cues.json'), 'utf8'));
const EVENTS = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/audio/events.json'), 'utf8'));
const TOUR = JSON.parse(fs.readFileSync(path.join(HERE, 'shots/tour.json'), 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4', '.jpg': 'image/jpeg' };
const results = []; const ok = (name, pass, detail) => { results.push({ name, pass: !!pass, detail: detail || '' }); console.log((pass ? 'PASS ' : 'FAIL ') + name + (detail ? ' · ' + detail : '')); };

function serve() { return new Promise((res) => { const srv = http.createServer((req, r) => { const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0].split('#')[0])); if (!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' }); fs.createReadStream(p).pipe(r); }); srv.listen(0, '127.0.0.1', () => res(srv)); }); }
const get = (url) => new Promise((res) => http.get(url, (r) => { r.resume(); res(r.statusCode); }).on('error', () => res(0)));

(async () => {
  const srv = await serve(), base = `http://127.0.0.1:${srv.address().port}/prototypes/p9/`;
  // ---- 1. files
  const files = new Set();
  for (const c of Object.values(CUES.sfx)) for (const f of (c.files || []).concat(c.alternates || [])) files.add('audio/sfx/' + f);
  for (const t of Object.values(CUES.music.tracks)) { files.add('audio/' + t.file); files.add('audio/' + t.m4a); }
  const bad = []; for (const f of files) { const st = await get(base + f.split('/').map(encodeURIComponent).join('/')); if (st !== 200) bad.push(f + ' ' + st); }
  ok('every file in the cue map loads (' + files.size + ')', !bad.length, bad.join(', '));

  // ---- 2. the tour
  const S = TOUR.steps, at = (name) => S.find((s) => s.name.startsWith(name)) || {};
  ok('the tour ran without page errors', !TOUR.errors.length, TOUR.errors.join(' | '));
  ok('nothing plays before the first press', !S[0].cues.some((c) => c.kind === 'sfx' || c.kind === 'music' || c.kind === 'ui') && at('intro').music.state == null);
  const want = { 'the first press': ['intro', CUES.music.states.intro], 'START': ['menu', CUES.music.states.menu], 'the Credits card': ['credits', typeof CUES.music.states.credits === 'number' ? CUES.music.states.credits : CUES.music.states.menu],
    'Arcade: district select': ['menu', CUES.music.states.menu], 'Arcade: the level card': ['menu', CUES.music.states.menu], 'Arcade: the drone drop': ['level', CUES.music.rotation[0]],
    'Arcade ends: Licensed': ['ending', CUES.music.states.ending], 'Story: save slots': ['menu', CUES.music.states.menu], 'Story: the map': ['menu', CUES.music.states.menu],
    'Story: the level card (A1)': ['menu', CUES.music.states.menu], 'Story: the drone drop': ['level', CUES.music.rotation[0]], 'Story: play on tile 2': ['level', CUES.music.rotation[1 % CUES.music.rotation.length]],
    'the finale': ['finale', CUES.music.states.finale], 'CERTIFIED': ['finale', CUES.music.states.finale] };
  for (const [name, [st, tr]] of Object.entries(want)) { const s = at(name); ok('music on "' + name + '": ' + st + ', Track ' + tr, s.music && s.music.state === st && s.music.track === tr, s.music ? s.music.state + ', Track ' + s.music.track : 'step missing'); }
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
    const sample = (w) => { const x = {}; for (const [k, v] of Object.entries(w || {})) x[k] = v === '*' ? 'car1' : Array.isArray(v) ? v[0] : v && typeof v === 'object' ? 1e9 : v; return x; };
    for (const it of cat) {
      const type = it.base || it.id, e = Object.assign({ type }, sample(it.when));
      A.last.clear(); A.voices = []; const n0 = A.log.length, handled = A.event(e), got = A.log.slice(n0).filter((l) => l.kind === 'sfx' || l.kind === 'ui');
      out.push({ id: it.id, handled, got: got.map((l) => [l.id, l.file]) });
    }
    return out;
  }, cat);
  const fails = [];
  for (const r of cov) {
    const c = CUES.sfx[r.id], b = c.variantOf ? CUES.sfx[c.variantOf] : null;
    const pool = c.decision === 'base' ? (b.files || []) : (c.files || []);
    if (c.decision === 'cue' || (c.decision === 'base' && b.decision === 'cue')) { if (!r.handled || !r.got.length || !pool.includes(r.got[0][1])) fails.push(r.id + ' (want a file from ' + pool.join('/') + ', got ' + JSON.stringify(r.got) + ')'); }
    else if (c.decision === 'silence' || (c.decision === 'base' && b.decision === 'silence')) { if (!r.handled || r.got.length) fails.push(r.id + ' (want silence)'); }
    else if (c.decision === 'synth' || (c.decision === 'base' && b.decision === 'synth')) { if (r.handled) fails.push(r.id + ' (want the synth)'); }
  }
  const counts = {}; for (const c of Object.values(CUES.sfx)) counts[c.decision] = (counts[c.decision] || 0) + 1;
  ok('every catalogued event and variant does what the map says (' + cov.length + ': ' + Object.entries(counts).map(([k, v]) => v + ' ' + k).join(', ') + ')', !fails.length, fails.join('; '));
  ok('the catalogue and the cue map hold the same ' + cat.length + ' entries', cat.length === Object.keys(CUES.sfx).length && cat.every((x) => CUES.sfx[x.id]));

  // ---- 4. the game's hooks
  await pg.keyboard.press('Space'); await pg.waitForTimeout(600);
  ok('START plays ui-start and crossfades to Track ' + CUES.music.states.menu, await pg.evaluate((t) => window.__dummiesAudio.log.some((l) => l.id === 'ui-start') && window.__dummiesAudio.track === t, CUES.music.states.menu));
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
  ok('Options shows MUSIC, SOUND and MUTE', /^Music: \d+ \/ 10$/.test(items[0]) && /^Sound: \d+ \/ 10$/.test(items[1]) && /^Mute: (on|off)$/.test(items[2]), items.slice(0, 3).join(' · '));
  await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(150); await pg.keyboard.press('ArrowLeft'); await pg.waitForTimeout(150);
  const saved = await pg.evaluate(() => JSON.parse(localStorage.getItem('dummies.p9.audio') || 'null'));
  ok('MUSIC − twice is saved (dummies.p9.audio)', saved && saved.music === CUES.params['audio.settings.music'] - 2, JSON.stringify(saved));
  // the Sound Lab's picks, by URL
  const picks = { sfx: { lunge: { files: ['boost.wav'] }, impact: { decision: 'silence' } }, music: { states: { menu: 5 }, rotation: [6, 5] } };
  const b64 = Buffer.from(JSON.stringify(picks)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const pg2 = await ctx.newPage(); pg2.on('pageerror', (e) => errors.push(e.message));
  await pg2.goto(base + 'dummies_p9.html#audio=' + b64); await pg2.waitForTimeout(1000);
  const m = await pg2.evaluate(() => { const A = window.__dummiesAudio; return { lunge: A.cues.sfx.lunge.files, impact: A.cues.sfx.impact.decision, menu: A.cues.music.states.menu, rot: A.cues.music.rotation, hash: location.hash, stored: !!localStorage.getItem('dummies.p9.audio.lab') }; });
  ok('the game takes the Sound Lab\'s picks from #audio= and keeps them', m.lunge.join() === 'boost.wav' && m.impact === 'silence' && m.menu === 5 && m.rot.join() === '6,5' && !m.hash && m.stored, JSON.stringify(m));
  await pg2.evaluate(() => localStorage.removeItem('dummies.p9.audio.lab'));
  ok('no page errors in the hook tests', !errors.length, errors.join(' | '));
  ok('no audio engine errors', !(await pg.evaluate(() => window.__dummiesAudio.errors.length)), JSON.stringify(await pg.evaluate(() => window.__dummiesAudio.errors)));
  await br.close();

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
    const s1 = new Set(t1.texts.map((t) => t.text)), s2 = new Set(t2.texts.map((t) => t.text)), dyn = /\d+:\d{2}|\d+ ms|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC|pad:/;
    const diff = [...s1].filter((x) => !s2.has(x) && !dyn.test(x)).concat([...s2].filter((x) => !s1.has(x) && !dyn.test(x)));
    ok('Prototype 8.4 rebuilt from the shared code draws what the frozen build draws (' + a1 + ' / ' + a2 + ')', !diff.length && !t2.errors.length, diff.slice(0, 8).join(' | '));
    ok('the frozen dummies_p8_4.html is unchanged (md5 9f5549201d88891f9f0b22c461602909)', require('crypto').createHash('md5').update(fs.readFileSync(orig)).digest('hex') === '9f5549201d88891f9f0b22c461602909');
  }
  srv.close();
  const passed = results.filter((r) => r.pass).length;
  fs.writeFileSync(path.join(HERE, 'shots', 'test_p9.json'), JSON.stringify({ passed, total: results.length, results }, null, 1));
  console.log(`\n${passed}/${results.length} passed`);
  process.exit(passed === results.length ? 0 : 1);
})();
