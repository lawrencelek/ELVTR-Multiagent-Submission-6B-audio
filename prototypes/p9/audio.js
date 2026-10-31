// Prototype 9 (GDD Edit 100): the audio engine. WAV cues, generated tones and OGG music from content/audio/cues.json
// (window.DUMMIES_CUES): three buses (music, sfx, ui) under a master, loudness trims per file, 0.3 s fades at every track's
// start and end (the loop's seam too), the level card's track, the ducks (pause, the gift screen, report and workshop, a write-off),
// cooldowns, a voice cap, saved volumes (dummies.p9.audio), and the Sound Lab's picks (dummies.p9.audio.lab, or
// #audio=<base64 JSON> in the URL). game.js creates it only when window.DUMMIES_SIM['audio.enabled'] is 1, so builds without
// it are unchanged. Files load by URL, beside the page (audio/sfx, audio/tones, audio/music). On http(s) the effects decode
// into buffers and the music streams through the buses; on file:// fetch fails, so both fall back to <audio> elements.
// A failure in here never stops the game: create() falls back to the designed map, and every entry point is guarded.
(function (root) {
  'use strict';
  const SETTINGS_KEY = 'dummies.p9.audio', LAB_KEY = 'dummies.p9.audio.lab';
  const DECISIONS = ['cue', 'silence', 'synth', 'base'];
  const store = {
    get(k) { try { const v = root.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { if (v == null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage off: lasts the visit */ } },
  };
  const db = (x) => Math.pow(10, (x || 0) / 20);
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

  // The Sound Lab's picks, cleaned against the designed map: anything malformed or unknown is dropped, never thrown.
  // { sfx: { <id>: { decision, files, gainDb, bus, gain, cooldown } }, music: { states, rotation }, params: { <id>: number } }
  function sanitize(p, base) {
    if (!isObj(p) || !isObj(base)) return null;
    const out = { sfx: {}, music: {}, params: {} }, tracks = base.music && base.music.tracks || {};
    const baked = (base.picks && base.picks.raw && base.picks.raw.sfx) || {}; // picks the build already carries (Lawrence's): not twice
    for (const [id, e] of Object.entries(isObj(p.sfx) ? p.sfx : {})) {
      const d = base.sfx[id]; if (!d || !isObj(e)) continue;
      if (baked[id] && JSON.stringify(baked[id]) === JSON.stringify(e)) continue;
      const c = {};
      if (DECISIONS.includes(e.decision) && (e.decision !== 'base' || d.variantOf)) c.decision = e.decision;
      if (Array.isArray(e.files)) c.files = e.files.filter((f) => typeof f === 'string' && base.files[f]).slice(0, 12);
      if (typeof e.gainDb === 'number' && isFinite(e.gainDb)) c.gainDb = Math.max(-24, Math.min(24, e.gainDb));
      if (e.bus === 'sfx' || e.bus === 'ui') c.bus = e.bus;
      if (typeof e.gain === 'string' && base.params['audio.sfx.gain.' + e.gain] != null) c.gain = e.gain;
      if (typeof e.cooldown === 'string' && base.params['audio.sfx.cooldown.' + e.cooldown] != null) c.cooldown = e.cooldown;
      if (e.off === true) c.decision = 'silence';
      if (Object.keys(c).length) out.sfx[id] = c;
    }
    const m = isObj(p.music) ? p.music : {}, ok = (v) => Number.isInteger(v) && tracks[v];
    if (isObj(m.states)) for (const [k, v] of Object.entries(m.states)) if (base.music.states[k] !== undefined && base.music.states[k] !== 'duck' && (ok(v) || v === 'continue' || v === 'none' || (k === 'card' && v === 'level'))) out.music.states = Object.assign(out.music.states || {}, { [k]: v });
    if (Array.isArray(m.rotation)) { const r = m.rotation.filter(ok).slice(0, 8); if (r.length) out.music.rotation = r; }
    for (const [id, v] of Object.entries(isObj(p.params) ? p.params : {})) if (base.params[id] != null && typeof v === 'number' && isFinite(v)) out.params[id] = v;
    return out;
  }
  function labPicks(base) {
    let picks = null;
    try {
      const m = /[#&]audio=([A-Za-z0-9_\-+/=%]+)/.exec(root.location.hash || '');
      if (m) {
        const b64 = decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/');
        picks = sanitize(JSON.parse(decodeURIComponent(escape(root.atob(b64)))), base);
        if (picks) store.set(LAB_KEY, picks);
        try { root.history.replaceState(null, '', root.location.pathname + root.location.search); } catch (e) { /* file:// */ }
      }
    } catch (e) { picks = null; }
    return picks || sanitize(store.get(LAB_KEY), base);
  }

  // The picks over the designed map. A pick's decision wins, else the map's; files replace the pool (an empty pool is silent).
  function merge(base, raw) {
    const out = clone(base), picks = sanitize(raw, base);
    if (!picks) return out;
    Object.assign(out.params, picks.params);
    if (picks.music.states) Object.assign(out.music.states, picks.music.states);
    if (picks.music.rotation) out.music.rotation = picks.music.rotation;
    for (const [id, p] of Object.entries(picks.sfx)) {
      const c = out.sfx[id];
      if (p.decision) c.decision = p.decision;
      if (p.files) c.files = p.files;
      if (p.gainDb != null) c.userDb = p.gainDb;
      if (p.bus) c.bus = p.bus;
      if (p.gain) { c.gain = p.gain; c.gainId = 'audio.sfx.gain.' + p.gain; }
      if (p.cooldown) { c.cooldown = p.cooldown; c.cooldownId = 'audio.sfx.cooldown.' + p.cooldown; }
    }
    return out;
  }

  function create(host) {
    const app = host.app, pvHost = host.pv || (() => null);
    let CUES;
    try { CUES = merge(root.DUMMIES_CUES, labPicks(root.DUMMIES_CUES)); } catch (e) { CUES = clone(root.DUMMIES_CUES); store.set(LAB_KEY, null); }
    const P = (id, d) => (id != null && CUES.params[id] != null ? CUES.params[id] : d);
    const base = CUES.base || 'audio/';
    const local = root.location && root.location.protocol === 'file:';
    const saved = store.get(SETTINGS_KEY) || {};
    const num = (v, d) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(10, Math.round(v))) : d);
    const settings = { master: num(saved.master, P('audio.settings.master', 10)), music: num(saved.music, P('audio.settings.music', 8)), sound: num(saved.sound, P('audio.settings.sound', 8)), mute: saved.mute === true };
    const A = {
      ctx: null, unlocked: false, log: [], files: CUES.files, cues: CUES, settings, local,
      buffers: new Map(), pending: new Map(), failed: new Set(), last: new Map(), lastFile: new Map(), cyc: new Map(), voices: [], errors: [],
      music: { players: [null, null, null], cur: -1, track: null, state: null, levelTrack: null, inCard: false, duck: 1, retryT: 0 },
      bus: null, useElements: local,
    };
    function logIt(kind, id, file) { A.log.push({ t: +(app.realT || 0).toFixed(3), kind, id, file: file || null }); if (A.log.length > 800) A.log.splice(0, A.log.length - 800); }
    function guard(fn, dflt) { return function () { try { return fn.apply(null, arguments); } catch (err) { if (A.errors.length < 20) A.errors.push(String(err && err.message || err)); return dflt; } }; }

    // ---------- graph
    function graph(ctx) {
      const g = (to) => { const n = ctx.createGain(); n.connect(to); return n; };
      const master = g(ctx.destination);
      A.bus = { master, music: g(master), sfx: g(master), ui: g(master) };
      A.bus.synth = g(A.bus.sfx); // Prototype 8.4's live synth, for an event with no entry and no tone
      applyVolumes();
    }
    function busLevel(name) { // VOLUME (the sound control) × MUSIC or SFX (its dropdown; Options) × the bus's level
      if (settings.mute) return 0;
      const m = settings.master / 10;
      if (name === 'music') return m * P('audio.music.volume', 0.5) * settings.music / 10;
      if (name === 'ui') return m * P('audio.ui.volume', 0.7) * settings.sound / 10;
      return m * P('audio.sfx.volume', 0.85) * settings.sound / 10;
    }
    function applyVolumes() {
      if (!A.bus) return;
      for (const b of ['sfx', 'ui']) A.bus[b].gain.value = busLevel(b);
      A.bus.music.gain.value = 1; // the music's level is set per player each frame (fade × seam × duck × bus)
      A.bus.synth.gain.value = P('audio.synth.gain', 1);
    }
    function saveSettings() { store.set(SETTINGS_KEY, { master: settings.master, music: settings.music, sound: settings.sound, mute: settings.mute }); applyVolumes(); for (const p of A.music.players) if (p) output(p); }

    // ---------- unlock: Snd.init calls this inside the key, pointer or touch handler. Audio counts as unlocked only once the
    // context runs: a press the browser does not count as a gesture (Escape, a gamepad) leaves it waiting for the next one
    function unlock(ctx) {
      if (!ctx) return;
      if (!A.ctx) {
        A.ctx = ctx; graph(ctx);
        try { ctx.addEventListener('statechange', () => { if (ctx.state === 'running') opened(); }); } catch (e) { /* old Safari */ }
      }
      if (!A.blessed) { A.blessed = true; for (let i = 0; i < A.music.players.length; i++) bless(player(i)); } // Safari: an element plays later only if it played once in a gesture
      if (ctx.state === 'running') opened();
      else { try { const pr = ctx.resume(); if (pr && pr.then) pr.then(() => { if (ctx.state === 'running') opened(); }, () => {}); } catch (e) { /* closed */ } }
    }
    function opened() { if (A.unlocked) return; A.unlocked = true; logIt('unlock', 'audio', null); preload(); }

    // ---------- effects
    const dirOf = (f) => (CUES.files[f] && CUES.files[f].dir) || 'sfx';
    const url = (f) => base + dirOf(f) + '/' + encodeURIComponent(f);
    function load(f) {
      if (A.buffers.has(f) || A.pending.has(f) || A.failed.has(f) || A.useElements || !A.ctx) return A.pending.get(f) || null;
      const pr = fetch(url(f)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((ab) => new Promise((ok, no) => A.ctx.decodeAudioData(ab, ok, no)))
        .then((buf) => { A.buffers.set(f, buf); A.pending.delete(f); return buf; })
        .catch(() => { A.pending.delete(f); A.failed.add(f); if (local || A.failed.size > 3) A.useElements = true; return null; });
      A.pending.set(f, pr);
      return pr;
    }
    function preload() { for (const c of Object.values(CUES.sfx)) { if (c.decision === 'cue') for (const f of c.files || []) load(f); if (c.decision === 'synth' && c.tone) load(c.tone); } }
    function matches(when, e) {
      for (const [k, want] of Object.entries(when || {})) {
        const v = e[k];
        if (want === '*') { if (!v) return false; }
        else if (want === null) { if (v != null) return false; }
        else if (Array.isArray(want)) { if (!want.includes(v)) return false; }
        else if (want && typeof want === 'object') { // a range: [min, max). An end may name a parameter: the cue map's first, else the game's
          const end = (x) => (typeof x === 'string' ? P(x, pvHost(x)) : x);
          if (want.min != null && !(+v >= +end(want.min))) return false;
          if (want.max != null && !(+v < +end(want.max))) return false;
        }
        else if (want === true) { if (!v) return false; }
        else if (v !== want) return false;
      }
      return true;
    }
    function resolve(type, e) { // the variant whose `when` matches, else the event's own entry. A variant shares its event's cooldown
      const c = CUES.sfx[type];
      if (!c) return null;
      for (const vid of c.variants || []) {
        const v = CUES.sfx[vid];
        if (v && matches(v.when, e)) return v.decision === 'base' ? Object.assign({}, c, { id: vid, key: type }) : Object.assign({}, v, { id: vid, key: type });
      }
      return Object.assign({}, c, { id: type, key: type });
    }
    function pickFile(c) {
      const fl = (c.files || []).filter((f) => !A.failed.has(f) || A.useElements);
      if (!fl.length) return null;
      if (fl.length === 1) return fl[0];
      if (c.pick === 'cycle') { const n = (A.cyc.get(c.id) || 0) % fl.length; A.cyc.set(c.id, n + 1); return fl[n]; }
      const last = A.lastFile.get(c.id); let f = fl[Math.floor(Math.random() * fl.length)];
      if (f === last) f = fl[(fl.indexOf(f) + 1) % fl.length];
      return f;
    }
    function start(c, f, buf) {
      const info = CUES.files[f] || {}, gain = db((info.trimDb || 0) + P(c.gainId, 0) + P(c.offsetId, 0) + (c.userDb || 0));
      const jitter = c.bus === 'ui' ? 0 : P('audio.sfx.pitchJitter', 0), rate = 1 + jitter * (Math.random() * 2 - 1), bus = c.bus === 'ui' ? 'ui' : 'sfx';
      A.voices.push({ id: c.id, end: (app.realT || 0) + (info.seconds || 0.5) / rate });
      if (buf) { const src = A.ctx.createBufferSource(), g = A.ctx.createGain(); src.buffer = buf; src.playbackRate.value = rate; g.gain.value = gain; src.connect(g); g.connect(A.bus[bus]); src.start(); return 'buffer'; }
      try { const el = new Audio(url(f)); el.volume = Math.max(0, Math.min(1, gain * busLevel(bus))); el.playbackRate = rate; el.play().catch(() => {}); } catch (err) { /* no audio */ }
      return 'element';
    }
    function playCue(c) {
      const now = app.realT || 0, key = c.key || c.id, cd = P(c.cooldownId, 0);
      if (now - (A.last.has(key) ? A.last.get(key) : -99) < cd - 1e-9) return 'cooldown';
      const f = pickFile(c);
      if (!f) return 'nofile';
      if (!A.unlocked || !A.ctx) { logIt('locked', c.id, f); return 'locked'; } // before the first gesture nothing plays
      A.voices = A.voices.filter((v) => v.end > now);
      if (A.voices.length >= P('audio.sfx.maxVoices', 16)) { logIt('drop', c.id, f); return 'voices'; }
      A.last.set(key, now); A.lastFile.set(c.id, f);
      const kind = c.bus === 'ui' ? 'ui' : 'sfx', buf = A.buffers.get(f);
      if (buf && !A.useElements) { logIt(kind, c.id, f); return start(c, f, buf); }
      if (A.useElements || A.failed.has(f)) { logIt(kind, c.id, f); return start(c, f, null); }
      const pr = load(f), t0 = now; // still decoding: play it if it arrives within a quarter second, else let it go
      logIt('loading', c.id, f);
      if (pr) pr.then((b) => { if ((app.realT || 0) - t0 < 0.25) { logIt(kind, c.id, f); start(c, f, b); } });
      return 'loading';
    }
    // An event from the sim, a derived case or a Prototype 9 hook. true: the map handled it (a cue, a generated tone or a
    // stated silence), so game.js hushes its own synth for it; false: no entry, or no tone to play
    function event(e) {
      const c = resolve(e.type, e);
      if (!c) return false;
      if (c.decision === 'silence') return true;
      if (c.decision === 'synth') { if (!c.tone) return false; playCue(Object.assign({}, c, { files: [c.tone], pick: 'cycle' })); return true; }
      if (c.decision !== 'cue') return false;
      playCue(c);
      return true;
    }
    const UI = { move: 'ui-move', up: 'ui-move', down: 'ui-move', left: 'ui-move', right: 'ui-move', ok: 'ui-ok', back: 'ui-back', pause: 'ui-pause', start: 'ui-start', gate: 'ui-gate' };
    function ui(kind) { const id = UI[kind] || kind; return event({ type: id }); }

    // ---------- music: three players, so a quick A → B → C never cuts a fade short
    const oggOk = (() => { try { return !!document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return true; } })();
    function trackUrl(n) { const t = CUES.music.tracks[n]; if (!t) return null; return base + (oggOk || !t.mp3 ? t.file : t.mp3).split('/').map(encodeURIComponent).join('/'); }
    function player(i) {
      let p = A.music.players[i];
      if (p) return p;
      const el = new Audio(); el.loop = true; el.preload = 'auto'; el.crossOrigin = local ? null : 'anonymous';
      p = { el, node: null, gain: null, track: null, vol: 0, want: 0, trimDb: 0 };
      if (!local && A.ctx && A.ctx.createMediaElementSource) {
        try { p.node = A.ctx.createMediaElementSource(el); p.gain = A.ctx.createGain(); p.gain.gain.value = 0; p.node.connect(p.gain); p.gain.connect(A.bus.music); } catch (e) { p.node = null; p.gain = null; }
      }
      A.music.players[i] = p;
      return p;
    }
    function bless(p) { try { p.el.muted = true; const pr = p.el.play(); if (pr && pr.then) pr.then(() => { if (!p.track) p.el.pause(); p.el.muted = false; }).catch(() => { p.el.muted = false; }); else { p.el.pause(); p.el.muted = false; } } catch (e) { /* no audio */ } }
    // The track's own start and end (audio.music.fadeInSeconds, fadeOutSeconds): it fades in from each start, the loop's
    // restart included, and out before the file ends. Before the file's length is known it waits at the start
    function seam(p) {
      const el = p.el, dur = isFinite(el.duration) ? el.duration : p.seconds, t = el.currentTime || 0, fi = Math.max(0.01, P('audio.music.fadeInSeconds', 0.3)), fo = Math.max(0.01, P('audio.music.fadeOutSeconds', 0.3)); // a server that sends no length: the inventory's
      if (!isFinite(dur) || !(dur > fi + fo)) return Math.min(1, t / fi);
      return Math.max(0, Math.min(1, t / fi, (dur - t) / fo));
    }
    function output(p) { // the player's fade × the seam × the duck; the bus level and the track's trim on top
      const lvl = Math.max(0, Math.min(1, p.vol * seam(p) * A.music.duck * busLevel('music') * db(p.trimDb || 0)));
      if (p.gain) { try { p.gain.gain.setTargetAtTime(lvl, A.ctx.currentTime, 0.012); } catch (e) { p.gain.gain.value = lvl; } } else p.el.volume = lvl; // a short glide: no zipper at 60 steps a second
      p.level = lvl;
    }
    function play(p) { const pr = p.el.play(); if (pr && pr.catch) pr.catch(() => {}); }
    function startTrack(n) {
      const M = A.music;
      if (M.track === n) return;
      M.players.forEach((q, i) => { if (q) q.want = 0; player(i); });
      M.track = n;
      if (n == null) { M.cur = -1; logIt('music', 'silence', null); return; }
      let i = M.players.findIndex((q) => q.track === n && !q.el.paused); // still fading out: bring it back, no restart
      if (i < 0) { i = M.players.findIndex((q) => q.vol <= 0.001 && q.want === 0 && q.track == null); if (i < 0) i = M.players.reduce((b, q, k) => (k !== M.cur && q.vol < M.players[b].vol ? k : b), M.cur === 0 ? 1 : 0); }
      const p = M.players[i]; M.cur = i; p.want = 1;
      if (p.track !== n) { // a fresh start: the seam fades it in from 0 s, so the player itself opens at once
        const src = trackUrl(n);
        p.track = n; p.trimDb = (CUES.music.tracks[n] || {}).trimDb || 0; p.seconds = (CUES.music.tracks[n] || {}).seconds || NaN; p.vol = 1;
        if (p.el.getAttribute('data-src') !== src) { p.el.src = src; p.el.setAttribute('data-src', src); }
        try { p.el.currentTime = 0; } catch (e) { /* not loaded */ }
        output(p);
      }
      play(p);
      logIt('music', 'track' + n, (CUES.music.tracks[n] || {}).file);
    }
    function stateTrack(st) {
      const v = CUES.music.states[st];
      if (st === 'level') return A.music.levelTrack != null ? A.music.levelTrack : levelTrack();
      if (st === 'card' && v === 'level') return A.music.levelTrack;
      if (typeof v === 'number') return v;
      if (v === 'none' || v === 0) return null;
      return A.music.track; // 'continue'
    }
    // The level's track: Story, the tile the level card announces (its start tile); Arcade, the level's count this session
    function levelTrack() {
      const R = CUES.music.rotation && CUES.music.rotation.length ? CUES.music.rotation : [3, 4, 5, 6], v = A.view || {};
      const n = v.mode === 'story' && v.tileN ? v.tileN : Math.max(1, v.runN || 1);
      return R[(n - 1) % R.length];
    }
    const ENDS = { Licensed: 'licensed', 'Failed test': 'failed', 'Non-compliant': 'noncompliant' };
    // What the screen shows → the music state (GDD Edit 100 §2)
    function musicState(v) {
      if (!A.unlocked || v.gate) return null;
      if (v.credits) return 'credits';
      if (v.screen === 'intro') return 'intro';
      if (v.screen === 'loading') return null; // a district building: the music holds until its card
      if (v.screen !== 'game') return 'menu';
      if (v.phase === 'ending' && v.ending === 'Certified') return 'certified'; // the ship (Lawrence, row 619)
      if (v.phase === 'unveil' || v.phase === 'voyage' || v.voyage) return 'finale';
      if (v.phase === 'ending') return ENDS[v.ending] || 'licensed'; // each run end its own track (row 619)
      if (v.phase === 'brief') return 'card'; // Q2 (Lawrence): the level card starts the level's track
      return 'level';
    }
    // The ducks (Lawrence, Q4 and Q5): pause; the gift screen, the report and the workshop; a write-off. Pause wins
    function duckOf(v) {
      let d = 1;
      if (v.phase === 'writeoff') d = P('audio.music.writeoffDuck', 0.5);
      else if (v.phase === 'gift' || v.phase === 'report' || v.phase === 'shop') d = P('audio.music.screenDuck', 0.7);
      if (v.paused) d = Math.min(d, P('audio.music.pauseDuck', 0.35));
      return d;
    }
    function frame(v) {
      A.view = v;
      if (!A.ctx || !A.unlocked) return;
      const M = A.music, st = musicState(v), cs = CUES.music.states.card;
      // Q3 (Lawrence): each level card sets the level's track from the tile it announces; it holds until the next card,
      // so walking back to a cleared tile, the ferry and a write-off never change it
      if (st === 'card' && !M.inCard) { M.inCard = true; M.levelTrack = cs === 'level' ? levelTrack() : null; }
      if (st !== 'card' && st != null) M.inCard = false;
      if (st === 'level' && M.levelTrack == null) M.levelTrack = levelTrack(); // a level that opens without its card (a gift still owed)
      if (st != null && st !== 'level' && st !== 'card') M.levelTrack = null;
      if (st != null) {
        const n = stateTrack(st);
        if (M.state !== st || M.track !== n) { if (M.state !== st) logIt('state', st, null); M.state = st; startTrack(n); }
      }
      const duckTo = duckOf(v), dt = Math.max(0, Math.min(0.1, v.dt || 1 / 60));
      const fi = Math.max(0.01, P('audio.music.fadeInSeconds', 0.3)), fo = Math.max(0.01, P('audio.music.fadeOutSeconds', 0.3));
      M.duck += Math.sign(duckTo - M.duck) * Math.min(Math.abs(duckTo - M.duck), dt / Math.max(0.01, P('audio.music.duckSeconds', 0.25)));
      for (const p of M.players) {
        if (!p) continue;
        const d = p.want - p.vol; p.vol += d > 0 ? Math.min(d, dt / fi) : Math.max(d, -dt / fo); // a switch: out over fadeOut, in over fadeIn
        output(p);
        if (p.want === 0 && p.vol <= 0 && !p.el.paused) { p.el.pause(); p.track = null; }
      }
      const cur = A.music.cur >= 0 ? A.music.players[A.music.cur] : null; // a play() the browser refused: try again each second
      if (cur && cur.want > 0 && cur.el.paused && !A.hidden && (app.realT || 0) - A.music.retryT > 1) { A.music.retryT = app.realT || 0; play(cur); }
    }
    function suspend(hidden) {
      A.hidden = hidden;
      if (!A.ctx) return;
      if (hidden) { try { A.ctx.suspend(); } catch (e) { /* closed */ } for (const p of A.music.players) if (p && !p.el.paused) { p.el.pause(); p.wasPlaying = true; } }
      else if (A.unlocked) { try { A.ctx.resume(); } catch (e) { /* closed */ } for (const p of A.music.players) if (p && p.wasPlaying) { p.wasPlaying = false; play(p); } }
    }
    try { document.addEventListener('visibilitychange', () => suspend(document.hidden)); } catch (e) { /* no document */ }

    // ---------- options (VOLUME, MUSIC, SFX, MUTE) and the lab's picks
    function nudge(which, d) { settings[which] = Math.max(0, Math.min(10, Math.round(settings[which] + d))); saveSettings(); }
    function setLevel(which, v) { if (!(which in settings) || which === 'mute') return; settings[which] = Math.max(0, Math.min(10, Math.round(v))); if (settings[which] > 0) settings.mute = false; saveSettings(); } // the dropdown's MUSIC and SFX sliders; moving one unmutes
    function cycle(which) { settings[which] = settings[which] >= 10 ? 0 : settings[which] + 1; saveSettings(); }
    function toggleMute() { settings.mute = !settings.mute; saveSettings(); }
    function setVolume(v) { settings.master = Math.max(0, Math.min(10, Math.round(v))); if (settings.master > 0) settings.mute = false; saveSettings(); } // moving the slider unmutes
    function setPicks(picks) { const p = sanitize(picks, root.DUMMIES_CUES); store.set(LAB_KEY, p); CUES = merge(root.DUMMIES_CUES, p); A.cues = CUES; A.files = CUES.files; preload(); A.music.state = null; }

    Object.assign(A, { param: (id, d) => P(id, d), unlock: guard(unlock), event: guard(event, false), ui: guard(ui, false), frame: guard(frame), nudge, cycle, toggleMute, setVolume, setLevel, setPicks: guard(setPicks), duckOf, applyVolumes, musicState, resolve, running: () => !!(A.ctx && A.ctx.state === 'running'), synthOut: () => (A.bus ? A.bus.synth : null) });
    Object.defineProperty(A, 'state', { get: () => A.music.state }); Object.defineProperty(A, 'track', { get: () => A.music.track });
    root.__dummiesAudio = A;
    return A;
  }

  // create() never throws: a broken map or a broken browser leaves the game silent, not stopped
  function safeCreate(host) { try { return create(host); } catch (e) { try { console.warn('DUMMIES audio off:', e); } catch (err) { /* no console */ } return null; } }
  root.DUMMIES_AUDIO = { create: safeCreate, merge, sanitize, SETTINGS_KEY, LAB_KEY };
})(typeof window !== 'undefined' ? window : globalThis);
