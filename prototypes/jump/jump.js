// DUMMIES jump (GDD Edit 76), after Link's Awakening's Roc's Feather: the jump keeps the speed you jump with.
// Shared by Prototype 6.6 (sim.js) and the jump test yard (prototypes/jump). No DOM; the tests run it headless.
// - Height and time in the air are fixed: upgrades.jumpHeight at the top, upgrades.jumpAirtime from take-off to landing.
// - Ground covered = take-off speed × airtime. Standing: straight up. Walking, running: that speed. During a dash: the dash's
//   speed, a long jump. Every take-off speed is capped at upgrades.jumpMaxSpeed.
// - A normal jump steers in the air: its velocity turns toward the input, at the take-off speed (at least walking pace), by at
//   most upgrades.jumpAirAccel per second. No input: the momentum holds. A dash jump is committed: no steering.
// - Edit 77 (proto.jump.runToClear): only a running jump or a dash jump clears anything. Standing and walking jumps hop:
//   the body rises, but it meets what it meets as if on the ground.
// - Diagonals: a thing crossed at an angle is longer to cross. inside() gives the path through it.
(function (root) {
  'use strict';
  const hyp = Math.hypot;
  function takeoff(P, vx, vy, dash, T) { // T: the airtime (Edit 78: Legs levels); else upgrades.jumpAirtime
    let sp = hyp(vx, vy); const cap = P['upgrades.jumpMaxSpeed'];
    if (sp > cap) { vx *= cap / sp; vy *= cap / sp; sp = cap; }
    const walk = P['movement.walkSpeed'], kind = dash ? 'dash' : sp < 1 ? 'stand' : sp <= walk * 1.05 ? 'walk' : 'run';
    const clear = !P['proto.jump.runToClear'] || kind === 'run' || kind === 'dash';
    return { t: 0, T: T || P['upgrades.jumpAirtime'], H: P['upgrades.jumpHeight'], vx, vy, v0: sp, steer: !dash, kind, clear };
  }
  function z(J, t) { const T = J.T; t = t == null ? J.t : t; return t <= 0 || t >= T ? 0 : 4 * J.H * t * (T - t) / (T * T); }
  function air(P, J, mx, my, dt) { // steer a normal jump toward the input
    if (!J.steer) return;
    const m = hyp(mx || 0, my || 0); if (m < 0.05) return;
    const sp = Math.max(J.v0, P['movement.walkSpeed']) * Math.min(1, m), tx = mx / m * sp, ty = my / m * sp;
    const dx = tx - J.vx, dy = ty - J.vy, d = hyp(dx, dy), a = P['upgrades.jumpAirAccel'] * dt;
    if (d <= a) { J.vx = tx; J.vy = ty; } else { J.vx += dx / d * a; J.vy += dy / d * a; }
  }
  function slide(J, nx, ny) { const vn = J.vx * nx + J.vy * ny; if (vn < 0) { J.vx -= vn * nx; J.vy -= vn * ny; } } // along a wall it meets
  // The part of the flight above height h: [t0, t1], or null if the top is lower
  function above(P, h, T) { const H = P['upgrades.jumpHeight']; T = T || P['upgrades.jumpAirtime']; if (h >= H) return null; const r = Math.sqrt(1 - Math.max(0, h) / H); return [T * (1 - r) / 2, T * (1 + r) / 2]; }
  // Ground covered at speed v, in all and while above h. A thing d deep clears if the body (2r) and d fit inside that stretch.
  function reach(P, v, T) { return v * (T || P['upgrades.jumpAirtime']); }
  function over(P, v, h, T) { const w = above(P, h, T); return w ? v * (w[1] - w[0]) : 0; }
  function clears(P, v, h, d, r, T) { return over(P, v, h, T) >= d + 2 * r; }
  // A box `depth` along the approach and `width` across it, crossed through its middle `deg` off square: the path the body
  // (radius r) travels while over it. Square on: depth + 2r. At 45° across a long rail: (depth + 2r) × 1.41.
  function inside(depth, width, r, deg) {
    const a = Math.abs(deg || 0) * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
    return Math.min(c > 1e-9 ? (depth + 2 * r) / c : Infinity, s > 1e-9 ? (width + 2 * r) / s : Infinity);
  }
  function clearsAt(P, v, h, depth, width, r, deg, T) { return over(P, v, h, T) >= inside(depth, width, r, deg); }
  // A car moving along +x at cv, crossed by a jump with velocity (vx, vy): the time the body is over its footprint
  // (length L along the lane, width W across), crossing through its middle. It clears if that fits the time above its roof.
  function carTime(vx, vy, cv, L, W, r) { const ux = Math.abs(vx - cv), uy = Math.abs(vy); return Math.min(uy > 1e-9 ? (W + 2 * r) / uy : Infinity, ux > 1e-9 ? (L + 2 * r) / ux : Infinity); }
  function carClears(P, vx, vy, cv, L, W, h, r, T) { const w = above(P, h, T); return !!w && carTime(vx, vy, cv, L, W, r) <= w[1] - w[0]; }
  function speeds(P) { // the four take-offs: standing, walking, running, a dash jump at the cap
    return { stand: 0, walk: P['movement.walkSpeed'], run: P['movement.runSpeed'], dash: P['upgrades.jumpMaxSpeed'] };
  }
  const api = { takeoff, z, air, slide, above, reach, over, clears, inside, clearsAt, carTime, carClears, speeds };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.JUMP = api;
})(typeof window !== 'undefined' ? window : globalThis);
