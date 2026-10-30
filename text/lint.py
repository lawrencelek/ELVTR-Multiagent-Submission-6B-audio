"""Lint for the text review (text/BRIEF.md): the hard limits a proposed line must meet. Evidence, not a grade.

    python3 text/lint.py text/drafts/<batch>.json      # one batch of drafts
    python3 text/lint.py                               # every batch, and the whole set (repeated phrases across it)

Checks: placeholders kept; banned words (Style Guide V2 V1); Farsight; sentences; words (Dummy Corporation, 20; tales 15–20);
characters (barks 48; feedback and the objective strip 60, with placeholders filled at typical lengths); "!" (cars: only a shout or a
Budget, 04, bark; the Corporation: never); a caps label stays caps; a phrase of four or more words in more than two lines (T14).
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
INV = {i["id"]: i for i in json.loads((ROOT / "content" / "text" / "inventory.json").read_text(encoding="utf-8"))["items"]}
BANNED = ["farsight", "kill", "killed", "kills", "die", "died", "dies", "dead", "death", "deaths", "player", "players", "level", "levels", "game", "games",
          "score", "scores", "scored", "respawn", "respawns", "respawned", "lives", "chongqing", "tesla", "toyota", "byd"]
FILL = {"{brief}": "cone-baited car", "{tile}": "A2", "{next}": "A3", "{n}": "1", "{need}": "1", "{health}": "1", "{part}": "Battery 1", "{PART}": "BATTERY 1",
        "{TILE}": "B1", "{district}": "Monument", "{points}": "2,500", "{bonus}": "1,200", "{mult}": "2", "{moves}": "DASH › JUMP", "{capacity}": "3",
        "{screen}": "A2", "{landmark}": "Lantern monument", "{model}": "VAN-02", "{metres}": "4.5", "{name}": "TEST DUMMY 1", "{g}": "2", "{G}": "2",
        "{count}": "0", "{balance}": "3", "{price}": "3", "{total}": "27", "{node}": "Battery 1", "{N}": "3", "{chassis}": "01", "{credits}": "3", "{cls}": "van"}
PH = re.compile(r"\{[A-Za-z]+\}")


def sentences(t):
    t = re.sub(r"\{[^}]*\}", "X", t)
    return len([s for s in re.split(r"(?<=[.!?])\s+", t.strip()) if re.search(r"[A-Za-z]", s)])


def words(t):
    return len(re.findall(r"[A-Za-z0-9'’{}\-]+", t))


def filled(t):
    for k, v in FILL.items():
        t = t.replace(k, v)
    return t


def check(id_, after):
    it = INV.get(id_)
    if not it:
        return ["unknown id"]
    F = []
    lim = it.get("limit") or {}
    if sorted(set(PH.findall(after))) != sorted(set(it["placeholders"])):
        F.append(f"placeholders {sorted(set(PH.findall(after)))} ≠ {it['placeholders']}")
    low = re.sub(r"\{[^}]*\}", " ", after.lower())
    for w in BANNED:
        if re.search(r"(?<![a-z])" + re.escape(w) + r"(?![a-z])", low):
            F.append(f"banned word '{w}' (V1)")
    if it["kind"] == "chrome":
        return F
    if it["kind"] == "bark":
        if len(after) > lim.get("chars", 48):
            F.append(f"{len(after)} characters (bark ≤ {lim.get('chars', 48)})")
        if not re.search(r"[.!?]$", after):
            F.append("a bark ends with '.', '!' or '?' (F3)")
        if "!" in after and it.get("style") != "shout" and it.get("tier") != "04":
            F.append("'!' only in a shout or a Budget bark (T10)")
    elif it["kind"] == "label":
        if it["text"].upper() == it["text"] and after.upper() != after:
            F.append("a caps label stays caps (F10)")
        if lim.get("chars") and len(after) > lim["chars"]:
            F.append(f"{len(after)} characters (label ≤ {lim['chars']})")
    else:
        if "!" in after:
            F.append("no '!' in the Corporation's voice (T2)")
        if lim.get("chars") and len(filled(after)) > lim["chars"]:
            F.append(f"{len(filled(after))} characters filled (strip ≤ {lim['chars']})")
        if lim.get("words") and words(after) > lim["words"]:
            F.append(f"{words(after)} words (≤ {lim['words']})")
        if lim.get("minWords") and words(after) < lim["minWords"]:
            F.append(f"{words(after)} words (tale ≥ {lim['minWords']})")
    if lim.get("sentences") and sentences(after) > lim["sentences"]:
        F.append(f"{sentences(after)} sentences (≤ {lim['sentences']})")
    return F


def repeats(texts):
    grams = {}
    for id_, t in texts.items():
        ws = re.findall(r"[a-z']+", t.lower())
        seen = set()
        for i in range(len(ws) - 3):
            g = " ".join(ws[i:i + 4])
            if g not in seen:
                seen.add(g)
                grams.setdefault(g, []).append(id_)
    return {g: ids for g, ids in grams.items() if len(ids) > 2}


def lint_drafts(drafts):
    out = {}
    for id_, d in drafts.items():
        f = check(id_, d.get("after", ""))
        if f:
            out[id_] = f
    return out


def main():
    files = [Path(a) for a in sys.argv[1:]] or sorted((ROOT / "text" / "drafts").glob("*.json"))
    allt, bad = {}, 0
    for f in files:
        drafts = json.loads(f.read_text(encoding="utf-8"))
        res = lint_drafts(drafts)
        miss = [i for i in json.loads((ROOT / "text" / "batches" / f.name).read_text(encoding="utf-8")) if i["id"] not in drafts] if (ROOT / "text" / "batches" / f.name).exists() else []
        changed = sum(1 for k, d in drafts.items() if k in INV and d.get("after") != INV[k]["text"])
        print(f"{f.name}: {len(drafts)} lines, {changed} changed, {len(res)} with findings, {len(miss)} missing")
        for k, v in res.items():
            print(f"  {k}: {'; '.join(v)} · \"{drafts[k]['after']}\"")
        for i in miss:
            print(f"  missing: {i['id']}")
        bad += len(res) + len(miss)
        allt.update({k: d["after"] for k, d in drafts.items() if INV.get(k, {}).get("kind") != "chrome"})
    rp = repeats(allt)
    for g, ids in sorted(rp.items(), key=lambda x: -len(x[1]))[:20]:
        print(f"  T14 '{g}' in {len(ids)} lines: {', '.join(ids[:6])}")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    main()
