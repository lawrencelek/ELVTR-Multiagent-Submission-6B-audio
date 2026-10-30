// The QA monitor: injected into Prototype 9 before its scripts run (qa/agent.js, addInitScript). It watches the game from inside the
// page at 10 Hz and records findings in window.__qa. It changes nothing in the game. Every limit runs on the game's clock. Checks:
//   collisions  the dummy inside a solid (Z0 statics, stair sides and the hill; raised solids at its level), inside a car after the
//               step resolved it, outside the screen, a car's centre inside another car, a non-finite position
//   stuck       a body mode or a phase past its limit, a car stopped too long, the game loop stalling; while the agent pushes and
//               the dummy does not move, noProgress tells the agent to probe eight ways (trapped or only against a wall)
//   sound       a sound that keeps firing (in most seconds of the last half minute; per cue file and per synth event), a cue inside its
//               own cooldown, voice-cap drops, a synth storm (Prototype 8.4's oscillators), music players overlapping, music that
//               should play and does not, music that should stop and does not, the track flapping, audio errors
(function () {
  'use strict';
  const QA = window.__qa = { findings: [], seen: {}, fresh: [], intent: null, curEv: null,
    stats: { samples: 0, osc: 0, src: 0, oscPeak: 0, log: {}, sounds: {}, frames: 0, gaps: 0, gapMax: 0, simT0: null, real0: null, simAcc: 0, writeoffs: 0, endings: {}, districts: {}, tiles: {}, sims: 0 } };
  const now = () => performance.now() / 1000; // wall clock: stamps and frame stalls only
  const gt = () => { const a = window.__dummies; return (a && a.realT) || 0; }; // the game's clock (app.realT): every limit runs on it, so a slow machine does not trip them
  const SND = {}; // sound key → { secs: Set of whole seconds, times: [] }
  function sound(key, t, ctx) {
    const rec = SND[key] || (SND[key] = { secs: new Set(), times: [] });
    QA.stats.sounds[key] = (QA.stats.sounds[key] || 0) + 1;
    rec.secs.add(Math.floor(t)); rec.times.push(t);
    while (rec.times.length && t - rec.times[0] > 60) rec.times.shift();
    for (const sec of rec.secs) if (t - sec > 30) rec.secs.delete(sec);
    if (/^cue:ui-/.test(key)) return;
    if (rec.secs.size >= 20) add('sound-loop', 'major', key + ' sounded in ' + rec.secs.size + ' of the last 30 seconds (' + rec.times.length + ' times in 60 s)', Object.assign({ key, perMin: rec.times.length }, ctx || soundCtx()), 'loop:' + key);
    else if (rec.times.length >= 60) add('sound-spam', 'minor', key + ' sounded ' + rec.times.length + ' times in 60 s', Object.assign({ key }, ctx || soundCtx()), 'spam:' + key);
  }
  // ---- Prototype 8.4's synth makes oscillators (and noise buffers); each is put down to the sim event the game is handling
  try {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) {
      const o = AC.prototype.createOscillator, b = AC.prototype.createBufferSource;
      AC.prototype.createOscillator = function () { QA.stats.osc++; QA._oscSec = (QA._oscSec || 0) + 1; if (QA.curEv) synthNote(QA.curEv); return o.apply(this, arguments); };
      AC.prototype.createBufferSource = function () { QA.stats.src++; if (QA.curEv && !QA.inCue) synthNote(QA.curEv); return b.apply(this, arguments); };
    }
  } catch (e) { /* no audio */ }
  let synthFrame = null;
  function synthNote(type) { const k = type + '@' + QA.stats.frames; if (synthFrame === k) return; synthFrame = k; sound('synth:' + type, gt()); }
  // ---- frame gaps: the game loop stalling. This rAF runs before the game's each frame: no event is being handled yet
  let lastF = 0, lastScr = null, lastPh = null, lastTile = null;
  const raf = window.requestAnimationFrame.bind(window);
  (function tick(t) {
    QA.stats.frames++; QA.curEv = null;
    const app = window.__dummies, scr = app && app.screen, s = app && app.sim, ph = s && s.phase, tile = s && s.screenName ? s.screenName() : null;
    const building = scr === 'loading' || lastScr === 'loading' || lastScr === 'arcade' || lastScr === 'title' || !!(s && s.phase !== 'play' && s.t < 31);
    if (lastF && !document.hidden) {
      const g = t - lastF;
      if (g > 250) {
        QA.stats.gaps++; QA.stats.gapMax = Math.max(QA.stats.gapMax, g);
        const cross = lastPh === 'scroll' || ph === 'scroll' || (lastTile && tile && lastTile !== tile); // the next screen built as the dummy crosses
        if (building) QA.stats.loadStallMax = Math.max(QA.stats.loadStallMax || 0, g);
        else if (cross) { QA.stats.crossStallMax = Math.max(QA.stats.crossStallMax || 0, g); QA.stats.crossStalls = (QA.stats.crossStalls || 0) + 1; }
        else if (g > 1500) add('frame-stall', 'major', 'the game loop paused ' + Math.round(g) + ' ms in play (phase ' + lastPh + ' → ' + ph + ')', { before: lastPh, after: ph }, 'stall:' + (s ? s.levelId + ':' + tile : scr));
      }
    }
    lastF = t; lastScr = scr; lastPh = ph; lastTile = tile; raf(tick);
  })(0);
  window.addEventListener('error', (e) => add('page-error', 'critical', String(e.message) + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno, null, 'err:' + String(e.message).slice(0, 80)));
  window.addEventListener('unhandledrejection', (e) => { const m = String(e.reason && e.reason.message || e.reason); if (/play\(\)|interrupted|AbortError|NotAllowedError/.test(m)) return; add('page-error', 'major', 'unhandled rejection: ' + m, null, 'rej:' + m.slice(0, 60)); });

  function snapshot() {
    const app = window.__dummies, s = app && app.sim, b = s && s.body, A = window.__dummiesAudio;
    return { screen: app && app.screen, phase: s && s.phase, paused: !!(app && app.paused), district: s && s.levelId, tile: s && s.screenName ? s.screenName() : null, simT: s ? +s.t.toFixed(2) : null,
      music: A ? { state: A.music.state, track: A.music.track, duck: +A.music.duck.toFixed(2) } : null,
      body: b ? { x: +(b.x || 0).toFixed(1), y: +(b.y || 0).toFixed(1), level: b.level, mode: b.mode, alive: b.alive, health: +(b.health || 0).toFixed(2), vx: +(b.vx || 0).toFixed(1), vy: +(b.vy || 0).toFixed(1), held: !!b.held, z: b.z || 0, stair: !!b.stair } : null };
  }
  function add(type, sev, detail, extra, key) {
    const k = type + '|' + (key || '');
    const f = QA.seen[k];
    if (f) { f.count++; f.lastT = +now().toFixed(2); return f; }
    const rec = { id: QA.findings.length + 1, type, sev, detail, key: k, t: +now().toFixed(2), count: 1, state: snapshot(), extra: extra || null, intent: QA.intent && Object.assign({}, QA.intent) };
    QA.seen[k] = rec; QA.findings.push(rec); QA.fresh.push(rec.id);
    return rec;
  }
  QA.add = add;

  function circleRect(px, py, r, s) {
    const qx = Math.max(s.x, Math.min(s.x + s.w, px)), qy = Math.max(s.y, Math.min(s.y + s.h, py)), dx = px - qx, dy = py - qy, d = Math.hypot(dx, dy);
    if (d >= r) return 0;
    if (d > 1e-9) return r - d;
    return Math.min(px - s.x, s.x + s.w - px, py - s.y, s.y + s.h - py) + r;
  }
  const since = {}; // condition key → when it began to hold
  function hold(key, cond, secs) { if (!cond) { delete since[key]; return false; } if (since[key] == null) since[key] = gt(); return gt() - since[key] >= secs; }
  const MODE_LIMIT = { lunge: 3, jump: 3, knock: 4, counter: 4, coast: 5, recover: 5, drop: 8, rescue: 40, hitch: 60, dead: 10 };
  const PHASE_LIMIT = { hitstop: 2, scroll: 6, writeoff: 6 };
  const trail = [];
  let lastMode = null, lastPhase = null, modeT = 0, phaseT = 0, lastSim = null;

  // ---- the audio engine: its log (cues it played, drops, music) and its event door (every sim event the game hands it)
  const A0 = { lastPlay: {}, drops: [], tracks: [], hooked: null, base: null };
  function hookAudio() {
    const A = window.__dummiesAudio; if (!A || A0.hooked === A) return;
    A0.hooked = A;
    A0.base = {}; for (const [id, c] of Object.entries(A.cues.sfx || {})) { A0.base[id] = A0.base[id] || id; for (const v of c.variants || []) A0.base[v] = id; }
    const push = A.log.push;
    A.log.push = function (e) { try { onLog(e, A); } catch (err) { /* never break the engine */ } return push.apply(this, arguments); };
    const ev = A.event;
    A.event = function (e) { QA.curEv = e && e.type; QA.inCue = true; try { return ev.apply(this, arguments); } finally { QA.inCue = false; } };
  }
  function onLog(e, A) {
    const t = e.t, st = QA.stats.log;
    st[e.kind] = (st[e.kind] || 0) + 1;
    if (e.kind === 'drop') { A0.drops.push(t); A0.drops = A0.drops.filter((x) => t - x < 10); if (A0.drops.length > 20) add('voice-cap', 'minor', A0.drops.length + ' cues dropped at the voice cap in 10 s (audio.sfx.maxVoices)', { last: e.id }, 'drop'); }
    if (e.kind === 'music') { A0.tracks.push(t); A0.tracks = A0.tracks.filter((x) => t - x < 60); if (A0.tracks.length > 10) add('music-flap', 'major', A0.tracks.length + ' music changes in 60 s', { last: e.id, music: A.music.state }, 'flap'); }
    if (e.kind !== 'sfx' && e.kind !== 'ui') return;
    sound('cue:' + e.id, t, Object.assign({ file: e.file }, soundCtx()));
    // a cue inside its own cooldown (game clock, app.realT): the engine's cooldown failed
    const base = A0.base[e.id] || e.id, c = A.cues.sfx[base], cd = c && c.cooldownId ? A.param(c.cooldownId, 0) : c && c.cooldown ? A.param('audio.sfx.cooldown.' + c.cooldown, 0) : 0;
    const lp = A0.lastPlay[base];
    if (cd > 0.05 && lp != null && e.t - lp < cd - 0.02 && e.t >= lp) add('cooldown-breach', 'major', e.id + ' played ' + (e.t - lp).toFixed(2) + ' s after the last; cooldown ' + cd + ' s', { id: e.id }, 'cd:' + base);
    A0.lastPlay[base] = e.t;
  }
  function soundCtx() {
    const app = window.__dummies, s = app && app.sim; if (!s || !s.body) return { screen: app && app.screen };
    const b = s.body, cars = (s.cars || []).filter((c) => !c.ghost && Math.hypot(c.x - b.x, c.y - b.y) < 200).slice(0, 6).map((c) => ({ id: c.id, state: c.state, v: +c.v.toFixed(1), spent: !!c.spent, standoff: !!(c.man && c.man.standoff), d: Math.round(Math.hypot(c.x - b.x, c.y - b.y)) }));
    return { phase: s.phase, mode: b.mode, alive: b.alive, still: Math.hypot(b.vx, b.vy) < 5, cars };
  }

  // ---- the sample
  function sample() {
    QA.stats.samples++;
    hookAudio();
    const app = window.__dummies, s = app && app.sim, A = window.__dummiesAudio, t = gt();
    if (QA._oscSec != null) { const rate = QA._oscSec * 10; QA.stats.oscPeak = Math.max(QA.stats.oscPeak, rate); if (hold('osc', rate > 60, 5)) add('synth-storm', 'major', 'Prototype 8.4\'s synth made ' + rate + ' oscillators a second for 5 s', soundCtx(), 'osc'); QA._oscSec = 0; }
    if (A && A.music && A.unlocked && !A.settings.mute && !document.hidden) {
      const ps = A.music.players.filter(Boolean), playing = ps.filter((p) => !p.el.paused && (p.level || 0) > 0.003);
      if (hold('mover', playing.length > 2, 2)) add('music-overlap', 'major', playing.length + ' music players audible at once', { tracks: playing.map((p) => p.track) }, 'mover');
      const wants = A.music.state && A.music.state !== 'card' ? A.music.track : null;
      if (hold('msil', wants != null && !ps.some((p) => p.track === wants && !p.el.paused), 10)) add('music-missing', 'major', 'state ' + A.music.state + ' wants Track ' + wants + ' but no player plays it', null, 'msil:' + A.music.state);
      const stray = ps.filter((p) => !p.el.paused && (p.level || 0) > 0.003 && p.track !== A.music.track);
      if (hold('mstray', stray.length > 0, 3)) add('music-stuck', 'major', 'Track ' + stray.map((p) => p.track).join(',') + ' still audible 3 s after the music moved to ' + (A.music.track == null ? 'silence' : 'Track ' + A.music.track), { state: A.music.state }, 'mstray:' + stray.map((p) => p.track).join(','));
      if (A.errors && A.errors.length) add('audio-error', 'major', A.errors.join(' | ').slice(0, 200), null, 'aerr');
      if (hold('voices', A.voices.length > 40, 3)) add('voice-leak', 'major', A.voices.length + ' voices held by the engine', null, 'voices');
    }
    if (!app || !s || app.screen !== 'game') { trail.length = 0; return; }
    if (s !== lastSim) { lastSim = s; QA.stats.sims++; lastMode = null; lastPhase = null; QA._lastSimT = s.t; }
    if (QA.stats.simT0 == null) { QA.stats.simT0 = s.t; QA.stats.real0 = t; }
    QA.stats.simAcc += Math.max(0, s.t - QA._lastSimT); QA._lastSimT = s.t;
    const key = s.levelId + ':' + (s.screenName ? s.screenName() : '?');
    QA.stats.districts[s.levelId] = (QA.stats.districts[s.levelId] || 0) + 1; QA.stats.tiles[key] = (QA.stats.tiles[key] || 0) + 1;
    const P = s.P, b = s.body, r = P['body.radius'], W = P['world.width'], H = P['world.height'];
    if (s.phase !== lastPhase) { if (s.phase === 'ending' && s.run && s.run.ending) QA.stats.endings[s.run.ending.kind] = (QA.stats.endings[s.run.ending.kind] || 0) + 1; if (s.phase === 'writeoff') QA.stats.writeoffs++; lastPhase = s.phase; phaseT = t; }
    const plim = PHASE_LIMIT[s.phase];
    if (plim && !app.paused && t - phaseT > plim + (s.phase === 'writeoff' ? (P['feedback.writeOffSeconds'] || 0) : 0)) add('phase-stuck', 'critical', 'phase ' + s.phase + ' for ' + (t - phaseT).toFixed(1) + ' s', null, 'ph:' + s.phase);
    if (!b) return;
    if (b.mode !== lastMode) { lastMode = b.mode; modeT = t; }
    if ([b.x, b.y, b.vx, b.vy, b.health].some((v) => typeof v === 'number' && !isFinite(v))) add('nan', 'critical', 'the body has a non-finite value', { x: b.x, y: b.y, vx: b.vx, vy: b.vy, health: b.health }, 'nan:body');
    const cars = (s.cars || []).filter((c) => !c.ghost);
    for (const c of cars) if (![c.x, c.y, c.v, c.h].every((v) => isFinite(v))) { add('nan', 'critical', 'car ' + c.id + ' has a non-finite value', { car: c.id }, 'nan:car'); break; }
    const lim = MODE_LIMIT[b.mode];
    if (lim && !app.paused && s.phase === 'play' && t - modeT > lim) add('mode-stuck', 'critical', 'body mode ' + b.mode + ' for ' + (t - modeT).toFixed(1) + ' s', { rescue: s.rescue && s.rescue.phase }, 'mode:' + b.mode);
    const play = s.phase === 'play' && !app.paused && b.alive;
    if (!play) { trail.length = 0; return; }
    const G = s.level, skip = b.stair || b.mode === 'drop' || b.mode === 'rescue' || b.mode === 'hitch';
    // the dummy inside a solid: world6.js's own test (collideBody), after the step resolved it
    if (G && !skip) {
      const air = b.mode === 'jump' && b.jump && b.jump.clear !== false ? b.z || 0 : 0;
      let pen = 0, what = null;
      const rect = (q, kind) => { const p = circleRect(b.x, b.y, r, q); if (p > pen) { pen = p; what = kind; } };
      if (b.level === 0) {
        for (const q of G.statics || []) if (!(q.jumpable && air >= q.zTop)) rect(q, q.kind || 'static');
        for (const st of G.stairs || []) if (!s.stairFoot(st)) rect(st, 'stair side');
        if (window.PIX && window.PIX.inPoly) for (const poly of G.polys0 || []) if (window.PIX.inPoly(poly, b.x, b.y)) { pen = Math.max(pen, r + 1); what = 'hill'; }
      } else for (const q of G.solidsZ || []) if (q.z === b.level) rect(q, 'raised solid');
      if (hold('solid', pen > 3, 0.5)) add('inside-solid', 'critical', 'the dummy is ' + pen.toFixed(1) + ' px inside a ' + what + ' (level ' + b.level + ', mode ' + b.mode + ')', { pen: +pen.toFixed(2), what }, 'solid:' + key + ':' + Math.round(b.x / 40) + ',' + Math.round(b.y / 40));
    }
    const out = b.x < -2 * r || b.x > W + 2 * r || b.y < -2 * r || b.y > H + 2 * r;
    if (hold('out', out, 1)) add('out-of-bounds', 'critical', 'the dummy is outside the screen at ' + Math.round(b.x) + ',' + Math.round(b.y), null, 'out:' + key);
    const C = window.DUMMIES && window.DUMMIES.circleCar;
    if (C && !skip) {
      const air = b.mode === 'jump' ? b.z || 0 : 0;
      let worst = null;
      for (const c of cars) { if (!s.meets(c) || air > 0 && air >= P['vehicles.' + c.cls + '.height']) continue; const res = C(b.x, b.y, r, c); if (res && res.pen > 6 && (!worst || res.pen > worst.pen)) worst = { id: c.id, cls: c.cls, pen: +res.pen.toFixed(1), v: +c.v.toFixed(1), state: c.state, spent: !!c.spent, mode: b.mode }; }
      if (hold('incar', !!worst, 1)) add('inside-car', 'critical', 'the dummy has stayed ' + worst.pen + ' px inside car ' + worst.id + ' (' + worst.cls + ') for 1 s', worst, 'incar:' + key);
      let pair = null;
      for (let i = 0; i < cars.length && !pair; i++) for (let j = 0; j < cars.length; j++) {
        if (i === j) continue;
        const a = cars[i], c = cars[j]; if ((a.layer || 0) !== (c.layer || 0) || a.deckIdx !== c.deckIdx) continue;
        if (Math.abs(a.x - c.x) > 90 || Math.abs(a.y - c.y) > 90) continue;
        const res = C(a.x, a.y, 2, c); if (res && res.pen > 2) { pair = [a.id, c.id]; break; }
      }
      const pk = pair ? pair.slice().sort().join('+') : '';
      if (hold('cc:' + pk, !!pair, 1.5)) add('car-overlap', 'major', 'car ' + pair[0] + ' has its centre inside car ' + pair[1] + ' for 1.5 s', { pair, states: pair.map((id) => { const c = cars.find((q) => q.id === id); return c && { state: c.state, v: +c.v.toFixed(1), man: c.man && c.man.type }; }) }, 'cc:' + key + ':' + pk);
    }
    for (const c of cars) {
      if (c.spent && c.v < 1) { delete since['cs:' + c.id]; continue; }
      const waits = c.man && c.man.standoff || Math.hypot(c.x - b.x, c.y - b.y) < 140;
      if (hold('cs:' + c.id, c.v < 1 && !waits, 45)) add('car-stuck', 'major', 'car ' + c.id + ' stopped 45 s with the dummy away (' + c.state + (c.man ? ', ' + c.man.type : '') + ')', { id: c.id, state: c.state, man: c.man && c.man.type, cause: c.cause, x: Math.round(c.x), y: Math.round(c.y) }, 'cs:' + key + ':' + c.id);
    }
    // progress while the agent pushes a direction: noProgress asks the agent to probe
    trail.push([t, b.x, b.y]); while (trail.length && t - trail[0][0] > 3) trail.shift();
    const moved = trail.length > 1 ? Math.hypot(b.x - trail[0][1], b.y - trail[0][2]) : 99;
    QA.noProgress = !!(QA.intent && QA.intent.move && t - QA.intent.since > 3 && moved < 4 && (b.mode === 'idle' || b.mode === 'move'));
  }
  setInterval(() => { try { sample(); } catch (e) { add('monitor-error', 'minor', String(e && e.message), { stack: String(e && e.stack).slice(0, 300) }, 'mon:' + String(e && e.message).slice(0, 40)); } }, 100);
  QA.drain = () => { const ids = QA.fresh; QA.fresh = []; return { fresh: ids.map((i) => QA.findings[i - 1]), noProgress: !!QA.noProgress, n: QA.findings.length }; };
})();
