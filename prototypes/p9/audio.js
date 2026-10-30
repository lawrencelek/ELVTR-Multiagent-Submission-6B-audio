// Prototype 9 (GDD Edit 100): the audio engine. WAV cues and OGG music from content/audio/cues.json (window.DUMMIES_CUES),
// three buses (music, sfx, ui) under a master, loudness trims per file, crossfades, the pause duck, cooldowns, a voice cap,
// saved volumes (dummies.p9.audio), and the Sound Lab's picks (dummies.p9.audio.lab, or #audio=<base64 JSON> in the URL).
// game.js creates it only when window.DUMMIES_SIM['audio.enabled'] is 1, so builds without it are unchanged.
// Files load by URL, beside the page (audio/). On http(s) the SFX decode into buffers and the music streams through the
// buses; on file:// fetch fails, so both fall back to <audio> elements with their own volume.
(function (root) {
  'use strict';
  const SETTINGS_KEY = 'dummies.p9.audio', LAB_KEY = 'dummies.p9.audio.lab';
  const store = {
    get(k) { try { const v = root.localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } },
    set(k, v) { try { if (v == null) root.localStorage.removeItem(k); else root.localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* storage off: lasts the visit */ } },
  };
  const db = (x) => Math.pow(10, (x || 0) / 20);
  const clone = (o) => JSON.parse(JSON.stringify(o));

  // The Sound Lab's picks: { sfx: { <event>: { decision, files, gainDb, off } }, music: { states, rotation }, params: { id: value } }
  function labPicks() {
    let picks = null;
    try {
      const m = /[#&]audio=([A-Za-z0-9_\-+/=%]+)/.exec(root.location.hash || '');
      if (m) {
        const b64 = decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/');
        picks = JSON.parse(decodeURIComponent(escape(root.atob(b64))));
        store.set(LAB_KEY, picks);
        try { root.history.replaceState(null, '', root.location.pathname + root.location.search); } catch (e) { /* file:// */ }
      }
    } catch (e) { picks = null; }
    return picks || store.get(LAB_KEY);
  }

  // Merge the lab's picks onto the designed cue map. Returns a new map.
  function merge(base, picks) {
    const out = clone(base);
    if (!picks) return out;
    for (const [id, v] of Object.entries(picks.params || {})) if (typeof v === 'number' && isFinite(v)) out.params[id] = v;
    if (picks.music) {
      if (picks.music.states) for (const [k, v] of Object.entries(picks.music.states)) out.music.states[k] = v;
      if (Array.isArray(picks.music.rotation) && picks.music.rotation.length) out.music.rotation = picks.music.rotation.slice(0, 8);
    }
    for (const [id, p] of Object.entries(picks.sfx || {})) {
      const c = out.sfx[id] || (out.sfx[id] = { decision: 'silence', files: [] });
      if (p.decision) c.decision = p.decision;
      if (Array.isArray(p.files) && p.files.length) { c.files = p.files.filter((f) => out.files[f]); if (c.files.length && !p.decision && c.decision !== 'base') c.decision = 'cue'; }
      if (typeof p.gainDb === 'number') c.userDb = p.gainDb;
      if (p.bus) c.bus = p.bus;
      if (p.gain) { c.gain = p.gain; c.gainId = 'audio.sfx.gain.' + p.gain; }
      if (p.cooldown) { c.cooldown = p.cooldown; c.cooldownId = 'audio.sfx.cooldown.' + p.cooldown; }
      if (p.off) c.decision = 'silence';
      if (c.decision === 'cue') { c.bus = c.bus || 'sfx'; c.gainId = c.gainId || 'audio.sfx.gain.hit'; c.cooldownId = c.cooldownId || 'audio.sfx.cooldown.burst'; }
    }
    return out;
  }

  function create(host) {
    const app = host.app, pvHost = host.pv || (() => null);
    let CUES = merge(root.DUMMIES_CUES, labPicks());
    const P = (id, d) => (CUES.params[id] != null ? CUES.params[id] : d);
    const base = CUES.base || 'audio/';
    const local = root.location && root.location.protocol === 'file:';
    const saved = store.get(SETTINGS_KEY) || {};
    const settings = { music: saved.music != null ? saved.music : P('audio.settings.music', 8), sound: saved.sound != null ? saved.sound : P('audio.settings.sound', 8), mute: !!saved.mute };
    const A = {
      ctx: null, unlocked: false, log: [], files: CUES.files, cues: CUES, settings, local,
      buffers: new Map(), failed: new Set(), last: new Map(), lastFile: new Map(), cyc: new Map(), voices: [], errors: [],
      music: { players: [null, null], cur: -1, track: null, state: null, levelTrack: null, duck: 1 },
      bus: null, useElements: local,
    };
    function logIt(kind, id, file) { A.log.push({ t: +(app.realT || 0).toFixed(3), kind, id, file: file || null }); if (A.log.length > 800) A.log.splice(0, A.log.length - 800); }

    // ---------- graph
    function graph(ctx) {
      const g = (to) => { const n = ctx.createGain(); n.connect(to); return n; };
      const master = g(ctx.destination);
      A.bus = { master, music: g(master), sfx: g(master), ui: g(master) };
      A.bus.synth = g(A.bus.sfx); // Prototype 8.4's procedural sounds, for events the map leaves to the synth
      applyVolumes();
    }
    function busLevel(name) {
      if (settings.mute) return 0;
      if (name === 'music') return P('audio.music.volume', 0.6) * settings.music / 10;
      if (name === 'ui') return P('audio.ui.volume', 0.7) * settings.sound / 10;
      return P('audio.sfx.volume', 0.85) * settings.sound / 10;
    }
    function applyVolumes() {
      if (!A.bus) return;
      for (const b of ['sfx', 'ui']) A.bus[b].gain.value = busLevel(b);
      A.bus.music.gain.value = 1; // the music's level is set per player each frame (crossfade × duck × bus)
      A.bus.synth.gain.value = P('audio.synth.gain', 1);
    }
    function saveSettings() { store.set(SETTINGS_KEY, { music: settings.music, sound: settings.sound, mute: settings.mute }); applyVolumes(); }

    // ---------- unlock: the first gesture (Snd.init calls this inside the key, pointer or touch handler)
    function unlock(ctx) {
      if (!ctx) return;
      if (!A.ctx) { A.ctx = ctx; graph(ctx); }
      if (A.unlocked) return;
      A.unlocked = true;
      logIt('unlock', 'audio', null);
      for (let i = 0; i < 2; i++) bless(player(i)); // Safari: a media element plays later only if it played once inside a gesture
      preload();
    }

    // ---------- SFX
    const url = (dir, f) => base + dir + '/' + encodeURIComponent(f);
    function load(f) {
      if (A.buffers.has(f) || A.failed.has(f) || A.useElements || !A.ctx) return;
      A.buffers.set(f, null);
      fetch(url('sfx', f)).then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); })
        .then((ab) => new Promise((ok, no) => A.ctx.decodeAudioData(ab, ok, no)))
        .then((buf) => A.buffers.set(f, buf))
        .catch(() => { A.buffers.delete(f); A.failed.add(f); if (local || A.failed.size > 3) A.useElements = true; });
    }
    function preload() { for (const c of Object.values(CUES.sfx)) if (c.decision === 'cue') for (const f of c.files || []) load(f); }
    function matches(when, e) {
      for (const [k, want] of Object.entries(when || {})) {
        const v = e[k];
        if (want === '*') { if (!v) return false; }
        else if (want === null) { if (v != null) return false; }
        else if (Array.isArray(want)) { if (!want.includes(v)) return false; }
        else if (want && typeof want === 'object') { const lo = typeof want.min === 'string' ? pvHost(want.min) : want.min; if (!(+v >= +lo)) return false; }
        else if (want === true) { if (!v) return false; }
        else if (v !== want) return false;
      }
      return true;
    }
    function resolve(type, e) { // the variant whose `when` matches, else the event's own cue
      const c = CUES.sfx[type];
      if (!c) return null;
      for (const vid of c.variants || []) {
        const v = CUES.sfx[vid];
        if (v && matches(v.when, e)) return v.decision === 'base' ? Object.assign({}, c, { id: vid, base: type }) : Object.assign({ id: vid }, v);
      }
      return Object.assign({ id: type }, c);
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
    function playCue(c, e) {
      const now = app.realT || 0, cd = P(c.cooldownId, 0), key = c.base || c.id;
      if (now - (A.last.has(key) ? A.last.get(key) : -99) < cd - 1e-9) return 'cooldown';
      const f = pickFile(c);
      if (!f) return 'nofile';
      A.voices = A.voices.filter((v) => v.end > now);
      if (A.voices.length >= P('audio.sfx.maxVoices', 16)) { logIt('drop', c.id, f); return 'voices'; }
      A.last.set(key, now); A.lastFile.set(c.id, f);
      const info = CUES.files[f] || {}, gain = db((info.trimDb || 0) + P(c.gainId, 0) + (c.userDb || 0));
      const jitter = c.bus === 'ui' ? 0 : P('audio.sfx.pitchJitter', 0), rate = 1 + jitter * (Math.random() * 2 - 1);
      const dur = (info.seconds || 0.5) / rate;
      if (!A.unlocked || !A.ctx) { logIt('locked', c.id, f); return 'locked'; } // before the first gesture nothing plays
      A.voices.push({ id: c.id, end: now + dur });
      logIt(c.bus === 'ui' ? 'ui' : 'sfx', c.id, f);
      const buf = A.buffers.get(f);
      if (buf && !A.useElements) {
        const src = A.ctx.createBufferSource(), g = A.ctx.createGain();
        src.buffer = buf; src.playbackRate.value = rate; g.gain.value = gain;
        src.connect(g); g.connect(A.bus[c.bus === 'ui' ? 'ui' : 'sfx']); src.start();
        return 'buffer';
      }
      if (!A.useElements && !A.buffers.has(f)) load(f);
      if (A.useElements || A.failed.has(f)) { // file://: an element per play, at the bus's level
        try { const el = new Audio(url('sfx', f)); el.volume = Math.max(0, Math.min(1, gain * busLevel(c.bus === 'ui' ? 'ui' : 'sfx'))); el.playbackRate = rate; el.play().catch(() => {}); } catch (err) { /* no audio */ }
        return 'element';
      }
      return 'loading';
    }
    // An event from the sim, a derived case or a Prototype 9 hook. true: the map handled it (a cue or a stated silence), so
    // game.js hushes the synth for it; false: no entry, or the map keeps the synth
    function guard(fn, dflt) { return function () { try { return fn.apply(null, arguments); } catch (err) { if (A.errors.length < 20) A.errors.push(String(err && err.message || err)); return dflt; } }; }
    function event(e) {
      const c = resolve(e.type, e);
      if (!c) return false;
      if (c.decision === 'synth') return false;
      if (c.decision === 'silence') return true;
      if (c.decision !== 'cue') return false;
      playCue(c, e);
      return true;
    }
    const UI = { move: 'ui-move', up: 'ui-move', down: 'ui-move', left: 'ui-move', right: 'ui-move', ok: 'ui-ok', back: 'ui-back', pause: 'ui-pause', start: 'ui-start', gate: 'ui-gate' };
    function ui(kind) { const id = UI[kind] || kind; return event({ type: id }); }
    function preview(id) { const c = CUES.sfx[id]; if (!c) return false; A.last.delete(c.base || id); return playCue(Object.assign({ id }, c), {}); }

    // ---------- music: two players for the crossfade
    const oggOk = (() => { try { return !!document.createElement('audio').canPlayType('audio/ogg; codecs="vorbis"'); } catch (e) { return true; } })();
    function trackUrl(n) { const t = CUES.music.tracks[n]; if (!t) return null; return base + (oggOk || !t.m4a ? t.file : t.m4a).split('/').map(encodeURIComponent).join('/'); }
    function player(i) {
      let p = A.music.players[i];
      if (p) return p;
      const el = new Audio(); el.loop = true; el.preload = 'auto'; el.crossOrigin = local ? null : 'anonymous';
      p = { el, node: null, gain: null, track: null, vol: 0, want: 0 };
      if (!local && A.ctx && A.ctx.createMediaElementSource) {
        try { p.node = A.ctx.createMediaElementSource(el); p.gain = A.ctx.createGain(); p.gain.gain.value = 0; p.node.connect(p.gain); p.gain.connect(A.bus.music); } catch (e) { p.node = null; p.gain = null; }
      }
      A.music.players[i] = p;
      return p;
    }
    function bless(p) { try { p.el.muted = true; const pr = p.el.play(); if (pr && pr.then) pr.then(() => { if (!p.track) p.el.pause(); p.el.muted = false; }).catch(() => { p.el.muted = false; }); else { p.el.pause(); p.el.muted = false; } } catch (e) { /* no audio */ } }
    function output(p, v) { // v: the player's fade × the duck; the bus level and the track's trim on top
      const lvl = Math.max(0, Math.min(1, v * busLevel('music') * db(p.trimDb || 0)));
      if (p.gain) p.gain.gain.value = lvl; else p.el.volume = lvl;
    }
    function startTrack(n) {
      const M = A.music;
      if (M.track === n) return;
      const prev = M.cur >= 0 ? M.players[M.cur] : null, i = M.cur === 0 ? 1 : 0, p = player(i);
      if (prev) prev.want = 0;
      M.cur = i; M.track = n;
      if (n == null) { logIt('music', 'silence', null); return; }
      const src = trackUrl(n);
      p.track = n; p.trimDb = (CUES.music.tracks[n] || {}).trimDb || 0; p.want = 1; p.vol = 0; output(p, 0);
      if (p.el.getAttribute('data-src') !== src) { p.el.src = src; p.el.setAttribute('data-src', src); }
      try { p.el.currentTime = 0; } catch (e) { /* not loaded */ }
      const pr = p.el.play(); if (pr && pr.catch) pr.catch(() => {});
      logIt('music', 'track' + n, (CUES.music.tracks[n] || {}).file);
    }
    function stateTrack(st) {
      const S = CUES.music.states, v = S[st];
      if (st === 'level') return levelTrack();
      if (typeof v === 'number') return v;
      if (v === 'none' || v === 0) return null;
      return A.music.track;
    }
    function levelTrack() {
      const R = CUES.music.rotation || [3, 4, 5, 6], v = A.view || {};
      if (!R.length) return null;
      const n = v.mode === 'story' && v.tileN ? v.tileN : Math.max(1, v.runN || 1);
      return R[(n - 1) % R.length];
    }
    // What the screen shows → the music state (GDD Edit 100 §2)
    function musicState(v) {
      if (!A.unlocked || v.gate) return null;
      if (v.credits) return 'credits';
      if (v.screen === 'intro') return 'intro';
      if (v.screen !== 'game') return 'menu';
      if (v.phase === 'unveil' || v.phase === 'voyage' || v.voyage || (v.phase === 'ending' && v.ending === 'Certified')) return 'finale';
      if (v.phase === 'ending') return 'ending';
      if (v.phase === 'brief') return A.music.state === 'level' ? 'level' : 'card'; // Q2: a district's first card keeps Track 2; a card between tiles keeps the level track
      return 'level';
    }
    function frame(v) {
      A.view = v;
      if (!A.ctx || !A.unlocked) return;
      let st = musicState(v);
      if (st === 'card' && CUES.music.states.card === 'continue') st = A.music.state || 'menu';
      if (st != null) {
        const n = st === 'level' && v.phase === 'brief' && A.music.levelTrack != null ? A.music.levelTrack : stateTrack(st);
        if (st === 'level') A.music.levelTrack = n; else if (st !== 'card') A.music.levelTrack = null;
        if (A.music.state !== st || A.music.track !== n) { if (A.music.state !== st) logIt('state', st, null); A.music.state = st; startTrack(n); }
      }
      const duckTo = v.paused ? P('audio.music.pauseDuck', 0.35) : 1, dt = Math.max(0, Math.min(0.1, v.dt || 1 / 60));
      const xf = Math.max(0.05, P('audio.music.crossfadeSeconds', 1.5)), step = dt / xf;
      A.music.duck += Math.sign(duckTo - A.music.duck) * Math.min(Math.abs(duckTo - A.music.duck), dt / 0.25);
      for (const p of A.music.players) {
        if (!p) continue;
        p.vol += Math.sign(p.want - p.vol) * Math.min(Math.abs(p.want - p.vol), step);
        output(p, p.vol * A.music.duck);
        if (p.want === 0 && p.vol <= 0 && !p.el.paused) { p.el.pause(); p.track = null; }
      }
    }
    function suspend(hidden) {
      if (!A.ctx) return;
      if (hidden) { try { A.ctx.suspend(); } catch (e) { /* closed */ } for (const p of A.music.players) if (p && !p.el.paused) { p.el.pause(); p.wasPlaying = true; } }
      else if (A.unlocked) { try { A.ctx.resume(); } catch (e) { /* closed */ } for (const p of A.music.players) if (p && p.wasPlaying) { p.wasPlaying = false; const pr = p.el.play(); if (pr && pr.catch) pr.catch(() => {}); } }
    }
    try { document.addEventListener('visibilitychange', () => suspend(document.hidden)); } catch (e) { /* no document */ }

    // ---------- options (MUSIC, SOUND, MUTE) and the lab's picks
    function nudge(which, d) { settings[which] = Math.max(0, Math.min(10, Math.round(settings[which] + d))); saveSettings(); }
    function cycle(which) { settings[which] = settings[which] >= 10 ? 0 : settings[which] + 1; saveSettings(); }
    function toggleMute() { settings.mute = !settings.mute; saveSettings(); }
    function setPicks(picks) { store.set(LAB_KEY, picks); CUES = merge(root.DUMMIES_CUES, picks); A.cues = CUES; A.files = CUES.files; preload(); A.music.state = null; }

    Object.assign(A, { param: (id, d) => P(id, d), unlock: guard(unlock), event: guard(event, false), ui: guard(ui, false), frame: guard(frame), preview: guard(preview, false), nudge, cycle, toggleMute, setPicks, applyVolumes, musicState, resolve, synthOut: () => (A.bus ? A.bus.synth : null) }); // a failure in audio never stops the game
    Object.defineProperty(A, 'state', { get: () => A.music.state }); Object.defineProperty(A, 'track', { get: () => A.music.track });
    root.__dummiesAudio = A;
    return A;
  }

  root.DUMMIES_AUDIO = { create, merge, SETTINGS_KEY, LAB_KEY };
})(typeof window !== 'undefined' ? window : globalThis);
