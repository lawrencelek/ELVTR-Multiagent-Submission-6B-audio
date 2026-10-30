"""Aggregate one QA run (qa/run_all.sh): every persona's findings, deduped, grouped and counted, with the run's coverage.
    python3 qa/report.py qa/runs/<stamp>      → <run>/findings.json and a printed digest (the triage goes in qa/REPORT.md)
"""
import json
import sys
from collections import Counter, defaultdict
from pathlib import Path

RUN = Path(sys.argv[1] if len(sys.argv) > 1 else "qa/runs/dev")
GROUP = {"inside-solid": "collision", "inside-car": "collision", "car-overlap": "collision", "out-of-bounds": "collision", "nan": "collision",
         "body-trapped": "stuck", "mode-stuck": "stuck", "phase-stuck": "stuck", "car-stuck": "stuck", "flow-stuck": "stuck", "frame-stall": "stuck",
         "page-unresponsive": "stuck", "sound-loop": "sound", "sound-spam": "sound", "cooldown-breach": "sound", "voice-cap": "sound", "voice-leak": "sound",
         "synth-storm": "sound", "music-overlap": "sound", "music-missing": "sound", "music-stuck": "sound", "music-flap": "sound", "audio-error": "sound"}
SEV = {"critical": 0, "major": 1, "minor": 2}


def family(f):
    """The finding with its place stripped: the same defect seen at several spots is one family."""
    k = f.get("key", "")
    t = f["type"]
    if t in ("sound-loop", "sound-spam", "cooldown-breach"):
        return t + "|" + k.split("|", 1)[-1].split(":", 1)[-1]
    if t in ("inside-solid",):
        return t + "|" + ((f.get("extra") or {}).get("what") or "?")
    if t in ("inside-car", "car-overlap", "car-stuck", "out-of-bounds", "body-trapped", "frame-stall"):
        return t
    return k


def main():
    personas = sorted(p.name for p in RUN.iterdir() if p.is_dir())
    allf, cov = [], {}
    for p in personas:
        fp = RUN / p / "findings.jsonl"
        fs = [json.loads(l) for l in fp.read_text().splitlines() if l.strip()] if fp.exists() else []
        allf += fs
        sm = RUN / p / "summary.json"
        if sm.exists():
            s = json.loads(sm.read_text())
            m = s.get("monitor") or {}
            # final counts: the monitor's own (it keeps counting repeats after the agent recorded the first)
            for mf in s.get("monitorFindings") or []:
                for f in fs:
                    if f.get("key") == mf.get("key"):
                        f["count"] = mf.get("count", f.get("count", 1))
                        f["lastT"] = mf.get("lastT")
            cov[p] = {"wall_min": round(s["wall"] / 60, 1), "sim_min": round(m.get("simAcc", 0) / 60, 1), "runs": s["counts"]["runs"], "actions": s["counts"]["actions"],
                      "probes": s["counts"]["probes"], "wallStops": s["counts"]["wallStops"], "trapped": s["counts"]["trapped"], "reloads": s["counts"]["reloads"],
                      "writeoffs": m.get("writeoffs"), "endings": m.get("endings"), "districts": sorted(m.get("districts", {})), "tiles": len(m.get("tiles", {})),
                      "gapMax_ms": round(m.get("gapMax", 0)), "loadStallMax_ms": round(m.get("loadStallMax", 0)), "osc": m.get("osc"), "cues": sum(v for k, v in m.get("sounds", {}).items() if k.startswith("cue:")),
                      "topSounds": Counter(m.get("sounds", {})).most_common(12), "simMinPerWallMin": round(m.get("simAcc", 0) / max(1, s["wall"]), 2)}
        else:
            cov[p] = {"incomplete": True}
    fam = defaultdict(list)
    for f in allf:
        fam[family(f)].append(f)
    rows = []
    for k, fs in fam.items():
        fs.sort(key=lambda f: (SEV.get(f["sev"], 3), f.get("wall", 0)))
        f0 = fs[0]
        rows.append({"family": k, "type": f0["type"], "group": GROUP.get(f0["type"], "other"), "sev": f0["sev"], "spots": len(fs), "hits": sum(f.get("count", 1) for f in fs),
                     "personas": sorted({f["persona"] for f in fs}), "detail": f0["detail"], "first": {"persona": f0["persona"], "wall": f0.get("wall"), "state": f0.get("state"), "extra": f0.get("extra"), "shot": f0.get("shot"), "inputs": f0.get("inputs")},
                     "examples": [{"persona": f["persona"], "detail": f["detail"], "shot": f.get("shot"), "state": f.get("state")} for f in fs[1:6]]})
    rows.sort(key=lambda r: (SEV.get(r["sev"], 3), -r["hits"]))
    (RUN / "findings.json").write_text(json.dumps({"coverage": cov, "families": rows}, indent=1))
    print(json.dumps(cov, indent=1))
    for r in rows:
        print(f"{r['sev']:8} {r['group']:9} {r['type']:16} spots {r['spots']:3} hits {r['hits']:5} {','.join(r['personas']):24} {r['detail'][:110]}")


if __name__ == "__main__":
    main()
