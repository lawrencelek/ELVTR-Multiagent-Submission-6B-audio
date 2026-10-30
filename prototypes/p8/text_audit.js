// Text audit (GDD Edit 95): every string a build draws, captured on a scripted tour of its screens and events.
//   node text_audit.js <build.html> <out.json> [screenshot folder]
// Hooks CanvasRenderingContext2D.fillText/strokeText and records each string with the screen it was drawn on. The tour:
// title, Arcade (play, report, workshop, its three endings), pause, options, controls, Story (saves, name, map, card, play,
// drone and gift events, the gift screen, a report and the workshop, the plaque, the CERTIFIED ending), and the Credits if the
// build has them. A string drawn while the Credits card is open carries '+credits' in its screen. Prints every string that names
// Farsight, and every drawn line over two sentences or 20 words (a wrapped text is drawn line by line: test_p8.js checks whole texts).
'use strict';
const fs = require('fs'), path = require('path');
const [, , HTML, OUTJ, SHOTS] = process.argv;
const words = (s) => s.split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const sentences = (s) => s.split(/(?<=[.?!])\s+/).filter((x) => /[A-Za-z]/.test(x)).length;

(async () => {
  const { chromium } = require('playwright');
  const br = await chromium.launch(), errors = [];
  const ctx = await br.newContext({ viewport: { width: 1300, height: 900 } });
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await ctx.addInitScript(() => {
    window.__texts = new Map();
    const rec = (s) => { if (typeof s !== 'string' || !s.trim()) return; const k = s.trim(); const cr = window.__dummiesUI && window.__dummiesUI.credits && window.__dummiesUI.credits(); const scr = ((window.__dummies && (window.__dummies.sim ? 'sim:' + window.__dummies.sim.phase : window.__dummies.screen)) || 'boot') + (cr ? '+credits' : ''); if (!window.__texts.has(k)) window.__texts.set(k, new Set()); window.__texts.get(k).add(scr); };
    for (const fn of ['fillText', 'strokeText']) { const o = CanvasRenderingContext2D.prototype[fn]; CanvasRenderingContext2D.prototype[fn] = function (t, ...a) { rec(String(t)); return o.call(this, t, ...a); }; }
  });
  const pg = await ctx.newPage();
  pg.on('pageerror', (e) => errors.push(e.message));
  const wait = async (fn, ms) => { for (let i = 0; i < (ms || 20000) / 100; i++) { if (await pg.evaluate(fn).catch(() => false)) return true; await pg.waitForTimeout(100); } return false; };
  const key = async (k, n, ms) => { for (let i = 0; i < (n || 1); i++) { await pg.keyboard.press(k); await pg.waitForTimeout(ms || 160); } };
  const shot = async (n) => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, n) }); };
  const sim = (fn, arg) => pg.evaluate(fn, arg).catch((e) => errors.push('tour: ' + e.message));
  const step = []; const mark = (s) => step.push(s);

  await pg.goto('file://' + path.resolve(HTML)); await pg.waitForTimeout(1500);
  if (await pg.evaluate(() => window.__dummies.screen === 'intro')) { await pg.waitForTimeout(1500); mark('intro'); await shot('audit_intro.png'); await key('Space', 1, 400); } // Edit 98 (P8.3): the intro screen
  mark('title'); await shot('audit_title.png');
  const itemAt = (name) => pg.evaluate((n) => (window.__dummiesUI.titleItems ? window.__dummiesUI.titleItems() : []).indexOf(n), name);
  const goTo = async (name) => { // the title menu's cursor onto a mode, from wherever it is
    await pg.waitForTimeout(300);
    const [i, cur, n] = await pg.evaluate((nm) => { const it = window.__dummiesUI.titleItems(); return [it.indexOf(nm), window.__dummies.titleSel % it.length, it.length]; }, name);
    const k = (i - cur + n) % n; if (k) await key('ArrowRight', k); // key(…, 0) would press once
  };
  const live = () => wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'play' && !window.__dummies.sim.rescue, 30000); // Edit 98: after the card and the drone drop
  const credits = await pg.evaluate(() => !!window.DUMMIES_CREDITS);
  if (credits) { // Edit 95: the Credits card, from the title menu
    const n = await pg.evaluate(() => (window.__dummiesUI.titleItems ? window.__dummiesUI.titleItems() : []).indexOf('CREDITS'));
    await key('ArrowRight', Math.max(0, n)); await key('Space'); await pg.waitForTimeout(400); mark('credits (title)'); await shot('audit_credits.png');
    await key('Space'); await pg.waitForTimeout(300); await key('ArrowLeft', Math.max(0, n));
  }
  const hsi = await pg.evaluate(() => (window.__dummiesUI.titleItems ? window.__dummiesUI.titleItems() : []).indexOf('HIGH SCORES'));
  if (hsi >= 0) { // Edit 97 (P8.2): the high scores board, from the title menu
    await key('ArrowRight', hsi); await key('Space', 1, 400); mark('high scores (title)'); await shot('audit_scores.png');
    for (let i = 0; i < 4; i++) await key('ArrowRight', 1, 200);
    await key('ShiftLeft', 1, 300); await key('ArrowLeft', hsi);
  }
  // ---------- Arcade
  await goTo('ARCADE'); await key('Space', 1, 300); mark('arcade select'); await key('ArrowDown'); await key('Space');
  if (await wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'brief', 30000)) { await pg.waitForTimeout(600); mark('arcade card'); await shot('audit_arcade_card.png'); await key('Space', 1, 300); await live(); } // Edit 98 (P8.3): the level card, then the drone
  await wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'play', 30000); await pg.waitForTimeout(800); mark('arcade play');
  await sim(() => { const s = window.__dummies.sim; s.emit('drone-dispatch', { rescue: true }); s.emit('drone-dispatch', {}); s.emit('rescued', {}); s.emit('touch-spent', {}); s.emit('story-gift', { credits: 2 }); });
  await pg.waitForTimeout(600); mark('arcade toasts');
  await sim(() => { const s = window.__dummies.sim, b = s.body; b.hits.push({ kind: 'dash', cls: 'van', combo: 1, assessed: 120, lost: 30, angle: 90, model: 'VAN-02' }); b.health = 0; s.writeOff(); s.checkTerminal(); });
  await wait(() => window.__dummies.sim.phase === 'report', 8000); await pg.waitForTimeout(400); mark('arcade report'); await shot('audit_arcade_report.png');
  await key('Space', 1, 400); mark('arcade workshop'); await shot('audit_arcade_workshop.png'); await key('ArrowRight', 3, 200); await key('ShiftLeft', 1, 500);
  await key('Escape', 1, 300); mark('pause'); await shot('audit_pause.png');
  for (const want of ['Options', 'Controls']) { // open each, then back
    const i = await pg.evaluate((w) => { const it = window.__dummiesUI.pauseItems ? window.__dummiesUI.pauseItems() : ['Resume', 'Restart level', 'Refuse testing', 'Options', 'Controls', 'Show trace', 'Quit to title']; return it.indexOf(w); }, want);
    if (i >= 0) { await key('ArrowDown', i); await key('Space', 1, 400); mark('pause ' + want); await shot('audit_' + want.toLowerCase() + '.png'); await key('Escape', 1, 300); await key('ArrowUp', i); }
  }
  await key('Escape', 1, 300);
  for (const kind of ['Licensed', 'Failed test', 'Non-compliant']) { await sim((k) => { const s = window.__dummies.sim; s.phase = 'play'; s.end(k); }, kind); await pg.waitForTimeout(500); mark('arcade ending ' + kind); }
  await shot('audit_arcade_ending.png');
  await pg.evaluate(() => { window.__dummies.screen = 'title'; window.__dummies.sim = null; window.__dummies.titleSel = 0; }); await pg.waitForTimeout(400);
  // ---------- Story
  await goTo('STORY'); await key('Space', 1, 400); mark('saves'); await key('Space', 1, 300); mark('name'); await key('Enter', 1, 500);
  if (await pg.evaluate(() => window.__dummies.screen === 'splash')) { await pg.waitForTimeout(1500); mark('story splash'); await shot('audit_splash.png'); await key('Space', 1, 500); } // Edit 98 (P8.3)
  mark('map'); await shot('audit_map.png');
  await key('Space'); await wait(() => window.__dummies.sim && window.__dummies.sim.phase === 'brief', 30000); await pg.waitForTimeout(600); mark('card A1'); await shot('audit_card.png');
  await key('Space', 1, 500); if (await pg.evaluate(() => !!(window.__dummies.sim.rescue && window.__dummies.sim.rescue.dropIn))) { await pg.waitForTimeout(600); mark('drone drop'); await shot('audit_drop.png'); } await live(); mark('story play');
  await sim(() => { const s = window.__dummies.sim; s.emit('story-deliver', { tile: 'B1', node: 'battery1' }); s.emit('story-ferry', { gift: 'legs1', to: 'B3' }); s.emit('story-ferry', { to: 'C1' }); s.emit('story-count', { tile: 'A1', n: 1, need: 1 }); s.emit('story-clear', { tile: 'A1', next: 'B1' }); s.emit('story-miss', { why: 'cleared', tile: 'A1' }); s.emit('story-miss', { why: 'other', tile: 'C3' }); });
  await pg.waitForTimeout(700); mark('story toasts'); await shot('audit_story_toasts.png');
  const obj = await pg.evaluate(() => { const s = window.__dummies.sim, out = [], keep = s.rescue; for (const r of [{ gift: 'legs1', tile: 'B3' }, { given: 'legs1' }, { ferry: true, tile: 'C1' }, { voyage: true, tile: 'B3' }]) { s.rescue = r; out.push(window.__dummiesUI.objective(s)); } s.rescue = keep; return out; }).catch(() => []);
  for (const o of obj) if (o) for (const t of o) await pg.evaluate((x) => { const m = window.__texts; if (!m.has(x)) m.set(x, new Set()); m.get(x).add('objective'); }, t);
  await sim(() => { const s = window.__dummies.sim; s.emit('gift', { node: 'legs1' }); }); await pg.waitForTimeout(900); mark('gift screen'); await shot('audit_gift.png');
  await pg.waitForTimeout(2500);
  await sim(() => { const s = window.__dummies.sim, b = s.body; b.hits.push({ kind: 'dash', cls: 'van', combo: 1, assessed: 120, lost: 30, angle: 90, model: 'VAN-02' }); b.health = 0; s.writeOff(); s.checkTerminal(); });
  // Story: the write-off clears A1; the report; the drone carries the dummy and Battery 1 to B1; the gift screen; then B1's card
  await wait(() => window.__dummies.sim.phase === 'report', 8000); await pg.waitForTimeout(400); mark('story report'); await shot('audit_story_report.png'); await key('Space', 1, 400);
  const gf = await wait(() => window.__dummies.sim.phase === 'gift', 40000); await pg.waitForTimeout(1200); mark('gift screen (ferry)' + (gf ? '' : ' not reached')); await shot('audit_gift_ferry.png');
  await pg.waitForTimeout(2600); await key('Space', 1, 400);
  const b1 = await wait(() => window.__dummies.sim.phase === 'brief', 20000); await pg.waitForTimeout(500); mark('card B1' + (b1 ? '' : ' not reached')); await shot('audit_card_b1.png');
  await key('Space', 1, 500);
  await key('Escape', 1, 300); const ci = await pg.evaluate(() => (window.__dummiesUI.pauseItems ? window.__dummiesUI.pauseItems() : ['Resume', 'Restart level', 'Refuse testing', 'Options', 'Controls', 'Show trace', 'Quit to title']).indexOf('Controls'));
  if (ci >= 0) { await key('ArrowDown', ci); await key('Space', 1, 400); mark('story controls'); await key('Escape', 1, 300); await key('ArrowUp', ci); }
  await key('Escape', 1, 300);
  await sim(() => { const s = window.__dummies.sim; s.unveil = { plaque: { chassis: 34, points: 414850, bestCombo: 5, t: 5420 }, done: false }; s.phase = 'unveil'; s.emit('unveil', s.unveil.plaque); });
  await pg.waitForTimeout(2500); mark('plaque'); await shot('audit_plaque.png');
  await sim(() => { const s = window.__dummies.sim; s.phase = 'play'; s.end('Certified'); }); await pg.waitForTimeout(800); mark('certified'); await shot('audit_certified.png');
  if (credits) { await key('Space', 1, 600); mark('credits (ending)'); await shot('audit_credits_end.png'); }

  const scores = await pg.evaluate(() => (window.__dummiesUI && window.__dummiesUI.scores ? window.__dummiesUI.scores() : null));
  const texts = await pg.evaluate(() => [...window.__texts].map(([k, v]) => ({ text: k, where: [...v] })));
  await br.close();
  const far = texts.filter((t) => /farsight/i.test(t.text)), long = texts.filter((t) => words(t.text) > 20 || sentences(t.text) > 2);
  const out = { html: path.basename(HTML), steps: step, errors, count: texts.length, farsight: far, long, scores, texts };
  fs.writeFileSync(OUTJ, JSON.stringify(out, null, 1));
  console.log(`${texts.length} strings drawn over ${step.length} steps · ${far.length} name Farsight · ${long.length} over two sentences or 20 words · ${errors.length} page errors`);
  for (const t of far) console.log('FARSIGHT  [' + t.where.join(', ') + '] ' + t.text);
  for (const t of long) console.log('LONG ' + words(t.text) + 'w [' + t.where.join(', ') + '] ' + t.text);
  for (const e of errors) console.log('ERROR ' + e);
})();
