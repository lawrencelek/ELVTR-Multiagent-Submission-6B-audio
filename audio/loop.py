"""The sound designer agent: designer → lint → reviewer (SCORE, REASON) → refiner, until a fresh reviewer confirms 10/10.

Same pattern as Assignment 6's style loop: deterministic evidence, a designer, a reviewer that scores, a fix loop, saved runs.
No human step inside. Inputs: content/audio/inventory.json (audio/inventory.py) and content/audio/events.json (audio/events.py).
Output: audio/runs/<stamp>-cues/ (every input, output, map version, lint and a trace.md) and, if accepted,
content/audio/design.json, which audio/integrate.py turns into the build's cue map.

    python3 audio/loop.py                               # a new run (about 10–20 minutes)
    python3 audio/loop.py --from content/audio/design.json   # incremental: start from the accepted map (no designer call)
    AUDIO_REPLAY=audio/runs/<id> python3 audio/loop.py  # replay a run from its saved outputs; no model calls
"""
import json
import os
import re
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import lint as L  # noqa: E402
import llm  # noqa: E402

ROOT = Path(__file__).resolve().parents[1]
INV = json.loads((ROOT / "content" / "audio" / "inventory.json").read_text(encoding="utf-8"))
EV = json.loads((ROOT / "content" / "audio" / "events.json").read_text(encoding="utf-8"))
GUIDE = (ROOT / "audio" / "SOUND_GUIDE.md").read_text(encoding="utf-8")
MAX_REFINE = int(os.environ.get("AUDIO_MAX_REFINE", "3"))
FROM = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else None
CONFIRMATIONS = 1


def ingame(f):
    """The file's level after the integrator's trim (integrate.trims), before its gain class: what the bus receives."""
    from integrate import PARAMS
    p = {x[0]: x[3] for x in PARAMS}
    t = max(-p["audio.trim.maxBoostDb"], min(p["audio.trim.maxBoostDb"], p["audio.sfx.targetLufs"] - f["level"]))
    if f.get("truePeak") is not None:
        t = min(t, p["audio.trim.peakCeilingDb"] - f["truePeak"])
    return round(f["level"] + t, 1)


def inv_table():
    rows = ["| file | seconds | measured dB | in game dB (after trim) | family |", "|---|---:|---:|---:|---|"]
    for f in INV["files"]:
        if f["folder"] == "sfx":
            rows.append(f"| {f['file'].split('/', 1)[1]} | {f['duration']:.2f} | {f['level']} | {ingame(f)} | {f['family']} |")
    mus = ["| track | file | seconds | title |", "|---|---|---:|---|"]
    for f in INV["files"]:
        if f["folder"] == "music":
            mus.append(f"| {f['track']} | {f['file'].split('/', 1)[1]} | {f['duration']:.1f} | {f['title']} |")
    return "\n".join(rows), "\n".join(mus)


def ev_table():
    rows = ["| id | group | label | what happens | freq | priority | fires with | variants (id: when) | Prototype 8.4 synth |", "|---|---|---|---|---|---|---|---|---|"]
    for e in EV["events"]:
        var = "; ".join(f"{v['id']}: {json.dumps(v['when'])}" for v in e["variants"]) or "—"
        rows.append(f"| {e['id']} | {e['group']} | {e['label']} | {e['what']} | {e['freq']} | {e['priority']} | {', '.join(e['firesWith']) or '—'} | {var} | {'yes' if e['synthNow'] else 'no'} |")
    mus = ["| state | label | what shows |", "|---|---|---|"] + [f"| {m['id']} | {m['label']} | {m['what']} |" for m in EV["music"]]
    return "\n".join(rows), "\n".join(mus)


SFX_T, MUS_T = inv_table()
EV_T, ST_T = ev_table()
CONTEXT = f"""## The event catalogue ({EV['count']} events; content/audio/events.json)

{EV_T}

Frequency classes: {json.dumps(EV['freqClasses'])}

## Music states

{ST_T}

## The pack: SFX ({INV['sfx']} WAV files; content/audio/inventory.json)

{SFX_T}

## The pack: music ({INV['music']} OGG tracks)

{MUS_T}
"""


def designer_message():
    return f"""Write the cue map for Prototype 9.

{GUIDE}

{CONTEXT}"""


def reviewer_message(m, F):
    return f"""Score this cue map.

## The cue map

```json
{json.dumps(m, indent=1, ensure_ascii=False)}
```

## Lint findings (measured; deduct each under its rule)

{L.text(F)}

{CONTEXT}"""


def refiner_message(m, reason, F):
    return f"""Revise this cue map.

## The reviewer's REASON

{reason}

## Lint findings

{L.text(F)}

## The current cue map

```json
{json.dumps(m, indent=1, ensure_ascii=False)}
```

{CONTEXT}"""


SCORE_RE = re.compile(r"^SCORE:\s*(\d+)\s*/\s*10", re.M)


def check_review(text):
    """Format and arithmetic: SCORE line, REASON, a Total line whose sum matches (floor 1)."""
    m = SCORE_RE.search(text)
    if not m:
        return None, "no 'SCORE: X/10' line"
    score = int(m.group(1))
    if "REASON:" not in text:
        return score, "no 'REASON:' block"
    if "- None." in text:
        return score, None if score == 10 else "'- None.' with a score below 10"
    tot = re.search(r"^Total:\s*10((?:\s*[−-]\s*\d+)*)\s*=\s*(\d+)", text, re.M)
    if not tot:
        return score, "no 'Total: 10 − … = X' line"
    raw = 10 - sum(int(n) for n in re.findall(r"\d+", tot.group(1)))
    if max(1, raw) != score:
        return score, f"the Total gives {max(1, raw)}, the SCORE says {score}"
    return score, None


def review(run, m, F, label):
    msg = reviewer_message(m, F)
    text = llm.call(run, "reviewer", msg, label)
    score, problem = check_review(text)
    if problem:  # one retry, stating the problem
        text = llm.call(run, "reviewer", msg + f"\n\n## Your previous reply broke the format\n\n{problem}. Reply again in exactly the format.", label + "_retry")
        score, problem = check_review(text)
    return (score or 1), text


def main():
    stamp = time.strftime("%Y%m%d-%H%M%S")
    run = llm.Run(ROOT / "audio" / "runs" / f"{stamp}-cues")
    trace = [f"# Sound designer run {run.dir.name}", "",
             f"- Models: designer {llm.MODELS['designer']}, reviewer {llm.MODELS['reviewer']}, refiner {llm.MODELS['refiner']}.",
             f"- Inputs: {EV['count']} events, {len(EV['music'])} music states, {INV['sfx']} SFX, {INV['music']} tracks.", ""]
    if FROM:  # an incremental run: the accepted map is version 0; lint and the reviewer find what the catalogue added since
        m = json.loads(Path(FROM).read_text(encoding="utf-8"))
        for k in ("run", "accepted", "score"):
            m.pop(k, None)
        trace.insert(4, f"- Incremental: version 0 is `{FROM}` (run {json.loads(Path(FROM).read_text(encoding='utf-8')).get('run')}); no designer call.")
    else:
        m = llm.parse_json(llm.call(run, "designer", designer_message(), "v0_designer"))
    run.save("map_v0.json", m)
    accepted, history = False, []
    for r in range(MAX_REFINE + 1):
        F = L.lint(m, EV, INV)
        run.save(f"lint_v{r}.json", F)
        score, text = review(run, m, F, f"v{r}_reviewer")
        history.append({"version": r, "score": score, "lint": L.summary(F)})
        trace += [f"## Version {r}", "", f"- Lint: {L.summary(F)}", f"- Reviewer: **{score}/10**", "", "```", text.strip(), "```", ""]
        reason = text
        if score == 10:
            ok = True
            for c in range(CONFIRMATIONS):
                cs, ct = review(run, m, F, f"v{r}_confirm{c + 1}")
                trace += [f"- Fresh reviewer {c + 1}: **{cs}/10**", "", "```", ct.strip(), "```", ""]
                history[-1][f"confirm{c + 1}"] = cs
                if cs != 10:
                    ok, reason = False, ct
                    break
            if ok:
                accepted = True
                break
        if r == MAX_REFINE:
            break
        m = llm.parse_json(llm.call(run, "refiner", refiner_message(m, reason, F), f"v{r + 1}_refiner"))
        run.save(f"map_v{r + 1}.json", m)
    final = L.lint(m, EV, INV)
    blocking = [f for f in final if f["severity"] == "blocking"]
    cost = round(sum(c.get("cost_usd") or 0 for c in run.calls), 2)
    secs = round(sum(c.get("seconds") or 0 for c in run.calls), 1)
    summ = {"run": run.dir.name, "accepted": accepted, "versions": history, "calls": len(run.calls), "cost_usd": cost, "seconds": secs,
            "finalLint": L.summary(final), "blocking": len(blocking)}
    run.save("summary.json", summ)
    run.save("calls.json", run.calls)
    trace += ["## Result", "", f"- {'Accepted: 10/10, confirmed' if accepted else 'Not accepted: best version kept, reported'}.",
              f"- Final lint: {L.summary(final)}.", f"- Calls: {len(run.calls)} · {secs} s · ${cost}.", ""]
    run.save("trace.md", "\n".join(trace))
    if not blocking:
        out = dict(m, run=run.dir.name, accepted=accepted, score=history[-1]["score"])
        (ROOT / "content" / "audio" / "design.json").write_text(json.dumps(out, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(summ, indent=1))


if __name__ == "__main__":
    main()
