"""The sound design freeze (Lawrence, 31 October 20:58: "Let's freeze the sound design element now"; DECISIONS row 645).

    python3 audio/freeze.py          write audio/FREEZE.json: an MD5 for every file of the sound design
    python3 audio/freeze.py --check  compare the files with it; exit 1 and list what changed

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
    if "--check" in sys.argv:
        was = json.loads(OUT.read_text(encoding="utf-8"))["files"]
        diff = sorted(k for k in set(was) | set(now) if was.get(k) != now.get(k))
        print(f"sound freeze: {len(now)} items, {len(diff)} changed")
        for k in diff:
            print("  " + k + (" (new)" if k not in was else " (gone)" if k not in now else ""))
        sys.exit(1 if diff else 0)
    OUT.write_text(json.dumps({"frozen": "2026-10-31", "by": "Lawrence, 31 October 20:58 (DECISIONS row 645)", "count": len(now), "files": now}, indent=1) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(now)} items frozen")


if __name__ == "__main__":
    main()
