"""Inventory of the audio pack. No model.

Lists each file: name, folder, bytes, duration, channels, sample rate, codec, integrated loudness (LUFS),
true peak (dBTP) and sample peak (dBFS). Short SFX (< 0.4 s) have no gated integrated loudness, so the
whole-file RMS is also kept; `level` is LUFS where measured, else RMS. Output: content/audio/inventory.json.

    python3 audio/inventory.py
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / "prototypes" / "p9" / "audio"
OUT = ROOT / "content" / "audio" / "inventory.json"
CREDITS = {"music": "ansimuz on itch.io", "sfx": "Chequered Ink on itch.io"}
SOURCE = {"music": "itch.io (assets/audio/licence/music-credit.txt)", "sfx": "itch.io (assets/audio/licence/sfx-credit.txt)"}


def probe(p):
    r = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                        "stream=codec_name,channels,sample_rate,bits_per_sample:format=duration",
                        "-of", "json", str(p)], capture_output=True, text=True, check=True)
    d = json.loads(r.stdout)
    s = d["streams"][0]
    return {"codec": s.get("codec_name"), "channels": int(s.get("channels", 0)),
            "sampleRate": int(s.get("sample_rate", 0)), "bits": int(s.get("bits_per_sample") or 0) or None,
            "duration": round(float(d["format"]["duration"]), 3)}


def loudness(p):
    """ebur128 summary: integrated LUFS, true peak; astats: sample peak; momentary max for short files."""
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(p),
                        "-af", "ebur128=peak=true:framelog=verbose,astats=metadata=0:reset=0",
                        "-f", "null", "-"], capture_output=True, text=True)
    e = r.stderr
    def last(pat):
        m = re.findall(pat, e)
        return float(m[-1]) if m else None
    integ = last(r"I:\s+(-?[\d.]+|-inf) LUFS") if "I:" in e else None
    rms = re.findall(r"RMS level dB:\s+(-?[\d.]+|-inf)", e)
    tp = last(r"Peak:\s+(-?[\d.]+) dBFS")
    sp = re.findall(r"Peak level dB:\s+(-?[\d.]+|-inf)", e)
    return {"lufs": integ if integ is not None and integ > -70 else None,
            "rmsDb": round(float(rms[-1]), 1) if rms and rms[-1] != "-inf" else None,
            "truePeak": tp,
            "samplePeak": float(sp[-1]) if sp and sp[-1] != "-inf" else None}


def family(name):
    """'collect_3' -> 'collect'; 'note_high_A' -> 'note'; 'animal_dog_big' -> 'animal'."""
    stem = Path(name).stem
    base = re.sub(r"_\d+$", "", stem)
    return base.split("_")[0] if base.startswith(("note_", "animal_")) else base


def main():
    files = []
    for folder in ("music", "sfx"):
        for p in sorted((PACK / folder).iterdir()):
            if p.suffix.lower() not in (".ogg", ".wav"):
                continue
            rec = {"file": f"{folder}/{p.name}", "name": p.stem, "folder": folder, "bytes": p.stat().st_size,
                   "family": family(p.name) if folder == "sfx" else None}
            rec.update(probe(p))
            rec.update(loudness(p))
            # One level per file for the bus trims: integrated LUFS where gated loudness exists, else whole-file RMS.
            rec["level"] = rec["lufs"] if rec["lufs"] is not None else rec["rmsDb"]
            rec["levelSource"] = "lufs" if rec["lufs"] is not None else "rms"
            rec.update({"credit": CREDITS[folder], "source": SOURCE[folder], "licence": "royalty-free pack; credit line supplied by the user; licence text not supplied"})
            if folder == "music":
                m = re.match(r"track(\d)_(.+)$", p.stem)
                rec["track"] = int(m.group(1))
                rec["title"] = m.group(2).split("_", 1)[1].replace("-", " ")
            files.append(rec)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    doc = {"generated_by": "audio/inventory.py", "pack": "prototypes/p9/audio/", "count": len(files),
           "music": sum(f["folder"] == "music" for f in files), "sfx": sum(f["folder"] == "sfx" for f in files),
           "files": files}
    OUT.write_text(json.dumps(doc, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {doc['music']} music, {doc['sfx']} sfx")


if __name__ == "__main__":
    main()
