"""The sound design freeze (Lawrence, 31 October 20:58: "Let's freeze the sound design element now"; DECISIONS row 645).

    python3 audio/freeze.py          write audio/FREEZE.json: an MD5 for every file of the sound design
    python3 audio/freeze.py --check  compare the files with it; exit 1 and list what changed (exit 0 while the freeze is open)
    python3 audio/freeze.py --open "<why>"   mark the freeze open for a ruled change (DECISIONS row); --check then lists and passes
    python3 audio/freeze.py --by "<who, when, row>"   write a new freeze (closes an open one)

The sound design is: every file under prototypes/p9/audio/ (the pack, the generated tones and music, the MP3s), the cue map and
its sources in content/audio/, the engine (prototypes/p9/audio.js), the Sound Lab's source, and the registry's audio.* entries.
A change after the freeze needs Lawrence's ruling, a DECISIONS row, and a new freeze.
"""
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "audio" / "FREEZE.json"


def md5(b):
    return hashlib.md5(b).hexdigest()


def files():
    out = {}
    for p in sorted((ROOT / "prototypes" / "p9" / "audio").rglob("*")):
        if p.is_file():
            out[str(p.relative_to(ROOT))] = md5(p.read_bytes())
    for p in sorted((ROOT / "content" / "audio").glob("*.json")):
        out[str(p.relative_to(ROOT))] = md5(p.read_bytes())
    for rel in ("prototypes/p9/audio.js", "prototypes/p9/lab.src.html", "prototypes/p9/make_lab.py"):  # the Lab's source: its page also carries the tour's cues, which traffic varies
        out[rel] = md5((ROOT / rel).read_bytes())
    reg = json.loads((ROOT / "content" / "params" / "tuning.parameters.json").read_text(encoding="utf-8"))
    aud = sorted((e for e in reg["entries"] if e["id"].startswith("audio.")), key=lambda e: e["id"])
    out["registry:audio.*"] = md5(json.dumps([[e["id"], e.get("default"), e.get("status")] for e in aud]).encode())
    return out


def main():
    now = files()
    arg = lambda k: sys.argv[sys.argv.index(k) + 1] if k in sys.argv and sys.argv.index(k) + 1 < len(sys.argv) else None
    if "--open" in sys.argv:  # row 646: a ruled pick round; the hashes stay as they were frozen
        d = json.loads(OUT.read_text(encoding="utf-8"))
        d["open"] = arg("--open") or "open"
        OUT.write_text(json.dumps(d, indent=1) + "\n", encoding="utf-8")
        print(f"{OUT.relative_to(ROOT)}: open ({d['open']})")
        return
    if "--check" in sys.argv:
        d = json.loads(OUT.read_text(encoding="utf-8"))
        was = d["files"]
        diff = sorted(k for k in set(was) | set(now) if was.get(k) != now.get(k))
        print(f"sound freeze: {len(now)} items, {len(diff)} changed" + (f"; open: {d['open']}" if d.get("open") else ""))
        for k in diff:
            print("  " + k + (" (new)" if k not in was else " (gone)" if k not in now else ""))
        sys.exit(1 if diff and not d.get("open") else 0)
    prev = json.loads(OUT.read_text(encoding="utf-8")) if OUT.exists() else {}
    hist = prev.get("history", []) + ([{"frozen": prev["frozen"], "by": prev["by"], "count": prev["count"]}] if prev.get("frozen") else [])
    by = arg("--by") or "Lawrence, 31 October 20:58 (DECISIONS row 645)"
    OUT.write_text(json.dumps({"frozen": __import__("datetime").date.today().isoformat(), "by": by, "count": len(now), "history": hist, "files": now}, indent=1) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(now)} items frozen")


if __name__ == "__main__":
    main()
