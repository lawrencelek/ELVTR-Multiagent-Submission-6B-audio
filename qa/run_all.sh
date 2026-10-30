#!/bin/bash
# Three QA personas in parallel, each for MIN minutes: qa/run_all.sh <out dir> [minutes]
cd "$(dirname "$0")/.."
OUT=${1:-qa/runs/dev}; MIN=${2:-30}
mkdir -p "$OUT"
node qa/agent.js --persona clipper --minutes $MIN --out "$OUT" --seed 101 > "$OUT/clipper.log" 2>&1 &
sleep 15
node qa/agent.js --persona saboteur --minutes $MIN --out "$OUT" --seed 202 > "$OUT/saboteur.log" 2>&1 &
sleep 15
node qa/agent.js --persona chaos --minutes $MIN --out "$OUT" --seed 303 > "$OUT/chaos.log" 2>&1 &
wait
echo "all done"
