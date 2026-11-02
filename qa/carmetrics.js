// Prototype 10.0 (handover v2 §10): the P3 car_metrics.js port. Car predictability under the same scripted dummy
// (the "wander" policy: a Lissajous walk, a dash every 2.5 s) on every sim. Reads qa/baseline/p9.json if it holds
// wander runs; otherwise runs them.
//   node qa/carmetrics.js [--json qa/baseline/p9.json] [--secs 300]
'use strict';
const fs = require('fs'), path = require('path');
const { runAll, ALL_SIMS } = require('./policy.js');
const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf('--' + k); return i >= 0 ? argv[i + 1] : d; };
const file = path.resolve(opt('json', path.join(__dirname, 'baseline', 'p9.json')));

function table(runs) {
  const by = {};
  for (const r of runs) if (r.policy === 'wander' && r.cars) (by[r.sim] = by[r.sim] || []).push(r.cars);
  const mean = (a, k) => +(a.reduce((x, c) => x + c[k], 0) / a.length).toFixed(2);
  for (const [sim, a] of Object.entries(by)) console.log(sim.padEnd(18), JSON.stringify({ runs: a.length, carsSeen: mean(a, 'seen'), shiftsPerCar: mean(a, 'shiftsPerCar'),
    carsWith3PlusShifts: mean(a, 'carsWith3PlusShifts'), interrupts: mean(a, 'interrupts'), headingSnapsOver360degS: mean(a, 'headingSnapsOver360degS'), maxYawDegS: Math.max(...a.map((c) => c.maxYawDegS)) }));
}

const have = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')).runs.filter((r) => r.policy === 'wander' && r.cars) : [];
if (have.length) table(have);
else runAll({ secs: +opt('secs', 300), sims: ALL_SIMS, policies: ['wander'], offsets: [4, 20, 40], pages: 2 }).then((r) => table(r.runs));
