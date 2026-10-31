"""Generated tones: Prototype 8.4's procedural sounds, rendered to WAV, so a `synth` entry plays through the mix like any cue.

Prototype 8.4 synthesised its sounds in game.js (the processEvents switch, giftFanfare, horn) and in the hit and drop juice
layers of content.js. Each recipe below copies one, as [kind, from Hz, to Hz, seconds, gain, wave, delay], with the
registry values the layers read and ranges taken at their middle. NEW holds tones written for Edit 100 where Prototype 8.4
had none. The renderer follows Web Audio: an oscillator gliding exponentially from → to, or white noise through a
band-pass (Q 1.2) sweeping from → to; a gain falling exponentially to 0.0001 over the seconds. Each file is peak-normalised
to −6 dBFS; the integrator then trims it like every effect (audio.sfx.targetLufs).

    python3 audio/tones.py   → prototypes/p9/audio/tones/tone_<event>.wav, content/audio/tones.json
"""
import json
import math
import wave
from pathlib import Path

import numpy as np

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "prototypes" / "p9" / "audio" / "tones"
INDEX = ROOT / "content" / "audio" / "tones.json"
RATE = 44100
PEAK_DB = -6.0

# Prototype 8.4's procedural sounds, per event: [kind, from Hz, to Hz, seconds, gain, wave, delay]. Copied from game.js's
# processEvents switch and the hit and drop juice layers in content.js (their registry values; ranges at their middle).
T, N = "tone", "noise"
def notes(fs, dur, gain, wave, step, d0=0.0, k=1.0):
    return [[T, f, f * k, dur, gain, wave, d0 + j * step] for j, f in enumerate(fs)]
GIFT_FALL = 0.9
SYNTH = {
    "lunge": [[N, 300, 1800, 0.18, 0.12, None, 0]],
    "jump": [[T, 330, 660, 0.12, 0.08, "triangle", 0]], "jump.dash": [[T, 330, 880, 0.18, 0.08, "triangle", 0]],
    "jump-land": [[T, 160, 90, 0.08, 0.05, "square", 0]], "land": [[T, 210, 62, 0.24, 0.15, "sine", 0]],
    "deck-drop": [[T, 700, 210, 0.42, 0.08, "sine", 0]], "rail-jump": [[T, 520, 880, 0.1, 0.06, "triangle", 0]],
    "stair": [[T, 260, 300, 0.05, 0.03, "triangle", 0]],
    "push": [[T, 360, 820, 0.12, 0.08, "triangle", 0]], "hitch": [[T, 300, 420, 0.08, 0.05, "square", 0]],
    "sling": [[T, 420, 900, 0.14, 0.08, "triangle", 0]], "denied": [[T, 120, 110, 0.05, 0.05, "square", 0], [T, 120, 110, 0.05, 0.05, "square", 0.08]],
    "impact": [[N, 2400, 300, 0.18, 0.18, None, 0], [N, 900, 120, 0.22, 0.2, None, 0]], "impact.big": [[N, 2400, 300, 0.18, 0.18, None, 0], [N, 600, 60, 0.3, 0.22, None, 0]],
    "impact.drop": [[T, 320, 50, 0.25, 0.2, "sine", 0], [N, 2400, 300, 0.18, 0.18, None, 0]],
    "held": [[T, 240, 200, 0.16, 0.05, "square", 0]], "knock": [[N, 700, 250, 0.1, 0.08, None, 0]], "touch-spent": [[N, 500, 140, 0.12, 0.12, None, 0]],
    "writeoff": [[N, 2000, 70, 0.6, 0.24, None, 0]],
    "near-miss": [[N, 500, 2200, 0.25, 0.1, None, 0]], "miss": [[N, 3200, 700, 0.3, 0.14, None, 0]],
    "pickup": [[T, 700, 950, 0.05, 0.06, "triangle", 0]], "drop": [[T, 500, 380, 0.06, 0.05, "triangle", 0]],
    "throw": [[T, 620, 180, 0.16, 0.07, "triangle", 0]], "punt": [[T, 420, 300, 0.05, 0.04, "triangle", 0]],
    "cone-hit": [[T, 900, 600, 0.08, 0.06, "square", 0]],
    "combo": notes([660, 880, 1100], 0.08, 0.08, "triangle", 0.06, k=1.2), "combo.max": notes([660, 880, 1100], 0.08, 0.08, "triangle", 0.06, k=1.2),
    "combo-end": [[T, 523, 784, 0.12, 0.06, "triangle", 0]],
    "splash": [[N, 900, 200, 0.4, 0.08, None, 0]], "rescued": [[T, 320, 480, 0.12, 0.05, "triangle", 0]], "screen": [[T, 300, 520, 0.12, 0.04, "triangle", 0]],
    "honk": [[T, 880, 880, 0.05, 0.03, "sine", 0]], "honk.body": [[T, 440, 430, 0.16, 0.05, "square", 0], [T, 349, 340, 0.22, 0.05, "square", 0.18]],
    "skid": [[T, 1800, 900, 0.18, 0.02, "sawtooth", 0]], "unstick.reverse": [[T, 1000, 1000, 0.06, 0.03, "square", 0], [T, 1000, 1000, 0.06, 0.03, "square", 0.25]],
    "learn-standoff": [[T, 330, 260, 0.12, 0.05, "triangle", 0]],
    "drone-dispatch": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0]], "drone-dispatch.rescue": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0]],
    "drone-pickup": [[T, 320, 200, 0.08, 0.05, "square", 0]], "drone-drop": [[T, 240, 150, 0.1, 0.05, "square", 0]],
    "story-enter": notes([392, 523, 659], 0.1, 0.05, "triangle", 0.08), "story-count": [[T, 660, 990, 0.12, 0.07, "triangle", 0]],
    "story-miss": [[T, 200, 150, 0.12, 0.05, "square", 0]], "story-clear": notes([523, 659, 784, 1046], 0.14, 0.07, "triangle", 0.09),
    "story-deliver": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0], [T, 1318.5, 1318.5, 0.14, 0.05, "sine", 0], [T, 1760, 1760, 0.3, 0.05, "sine", 0.12]],
    "story-ferry": [[T, 150, 210, 0.6, 0.025, "sawtooth", 0]], "story-ferried": [[T, 240, 150, 0.1, 0.05, "square", 0]],
    "story-fence": [[T, 140, 120, 0.08, 0.05, "square", 0]], "delivered": [[T, 320, 480, 0.12, 0.05, "triangle", 0]],
    "gift": ([[T, 280, 1300, GIFT_FALL, 0.035, "sine", 0], [N, 500, 4200, GIFT_FALL, 0.03, None, 0], [T, 150, 45, 0.32, 0.09, "square", GIFT_FALL], [N, 4200, 900, 0.3, 0.06, None, GIFT_FALL]]
             + notes([587.33, 739.99, 880, 1174.66], 0.18, 0.08, "triangle", 0.09, GIFT_FALL + 0.06)
             + [[T, f, f * 1.004, 1.4, 0.045, "triangle", GIFT_FALL + 0.42] for f in (880, 1174.66, 1479.98)] + [[T, 293.66, 293.66, 1.4, 0.06, "sine", GIFT_FALL + 0.42]]),
    "unveil-lift": notes([392, 523, 659, 784], 0.2, 0.06, "triangle", 0.14, 0.3),
    "purchase": notes([523, 659, 784], 0.1, 0.07, "triangle", 0.07) + [[T, 150, 60, 0.18, 0.06, "square", 0.02]],
    "purchase-denied": [[T, 180, 140, 0.12, 0.04, "square", 0]], "grade": notes([440, 660, 880], 0.1, 0.05, "square", 0.08),
    "ending.win": notes([523, 659, 784, 1046], 0.16, 0.07, "triangle", 0.09),
}

# Edit 100: tones Prototype 8.4 never had, for events Lawrence set to the synth (DECISIONS row 603)
NEW = {
    "slip": [[T, 1200, 520, 0.14, 0.06, "sine", 0], [N, 4200, 1600, 0.12, 0.05, None, 0.02]],  # a squeak, then the slide
    # Lawrence's request, 30 October 10:39 (DECISIONS row 606). Where Prototype 8.4 had a tone, it stays as tone_<event>_p84.wav
    "near-miss": [[N, 300, 2600, 0.16, 0.1, None, 0], [N, 2600, 500, 0.24, 0.08, None, 0.14],
                  [T, 660, 430, 0.32, 0.03, "triangle", 0.04]],                                  # in, past, away: a falling Doppler hint
    "low-health": [[T, 880, 880, 0.09, 0.07, "square", 0], [T, 660, 660, 0.09, 0.07, "square", 0.14],
                   [T, 880, 880, 0.09, 0.07, "square", 0.28], [T, 660, 640, 0.14, 0.07, "square", 0.42]],  # a two-note warning, twice
    "part-break": [[N, 5200, 1200, 0.08, 0.2, None, 0], [T, 1400, 300, 0.12, 0.06, "square", 0.02],
                   [N, 1800, 400, 0.26, 0.08, None, 0.05]],                                          # a crack, a spark, the rattle
    "cone-struck": [[N, 2500, 900, 0.07, 0.18, None, 0], [T, 420, 260, 0.1, 0.08, "triangle", 0],
                    [T, 900, 700, 0.05, 0.04, "triangle", 0.03]],                                    # a plastic thwack and a bounce
    "cone-stop": [[N, 1200, 500, 0.18, 0.08, None, 0], [T, 300, 220, 0.06, 0.05, "sine", 0.16]],     # a short scrape, then it settles
    "combo-end": ([[T, f, f, 0.12, 0.07, "triangle", j * 0.07] for j, f in enumerate((784, 987.77, 1174.66))]
                  + [[T, 1567.98, 1567.98, 0.36, 0.04, "sine", 0.21], [N, 6000, 3000, 0.06, 0.05, None, 0.2]]),  # banked: a chord, a ring
    "honk": [[T, 415, 410, 0.32, 0.05, "square", 0], [T, 330, 326, 0.32, 0.04, "square", 0]],       # a two-tone horn, held: longer than 8.4's blip
    "car-notice": [[T, 1318.5, 1318.5, 0.05, 0.04, "sine", 0], [T, 1760, 1760, 0.07, 0.04, "sine", 0.08]],  # the headlights' double flash
    # Lawrence, 30 October 11:30 (DECISIONS row 614): the new chassis plays a blip, not bubble.wav (the bark's)
    "chassis": [[T, 987.77, 1318.5, 0.07, 0.06, "sine", 0], [T, 1975.5, 2637, 0.045, 0.012, "sine", 0]],  # one soft rising blip
}

# Lawrence, 31 October 00:20 and 00:38 (DECISIONS rows 626, 627): the dash "sounds crunchy but it should sound 'whooshy' but
# quite short"; then the first three were "a bit too swooshy and high pitch but they should be machinic and a tiny bit melodic
# too". Three alternates for the dash, offered in the Sound Lab beside his pick. Machinic: a band-limited saw, pulse or FM voice
# through a resonant low-pass, a gear ripple, a low air band; melodic: the voice glides or steps a musical interval. No
# transient (a 10 ms rise), little above ~3 kHz. Parts:
#   voice  {"wave": saw|pulse|fm, "notes": [[sec, Hz], ...] (glided, `glide` s), "lp": [from Hz, to Hz, Q], "am": [Hz, depth],
#           "fm": [ratio, index from, index to], "duty": pulse width, "gain"}
#   air    {"band": [from Hz, peak Hz, to Hz, Q], "gain"}: noise through a moving band-pass, its centre peaking at `peakAt`
#   ping   {"hz", "at", "seconds", "gain"}: a soft sine note at the end, the melodic touch
MECH = {
    "lunge/mech-a": {"seconds": 0.18, "peakAt": 0.30, "note": "servo: a saw spins up a fifth (A2 → E3), a filter sweep, a gear ripple",
                     "parts": [{"voice": {"wave": "saw", "notes": [[0, 110], [0.11, 164.8]], "glide": 0.11, "lp": [500, 1700, 3.5], "am": [55, 0.3], "gain": 1.0}},
                               {"air": {"band": [350, 750, 500, 1.2], "gain": 0.22}}]},
    "lunge/mech-b": {"seconds": 0.20, "peakAt": 0.25, "note": "actuator: a pulse steps G3 → D4, a short pneumatic breath",
                     "parts": [{"voice": {"wave": "pulse", "duty": 0.3, "notes": [[0, 196], [0.07, 293.7]], "glide": 0.012, "lp": [900, 2000, 2.0], "am": [40, 0.15], "gain": 1.0}},
                               {"air": {"band": [500, 1100, 600, 1.0], "gain": 0.28}}]},
    "lunge/mech-c": {"seconds": 0.22, "peakAt": 0.35, "note": "turbine: an FM whine spins up an octave (G2 → G3), a low whir, a soft G4 to close",
                     "parts": [{"voice": {"wave": "fm", "fm": [2.0, 3.0, 0.6], "notes": [[0, 98], [0.15, 196]], "glide": 0.15, "lp": [700, 2200, 1.5], "am": [33, 0.2], "gain": 1.0}},
                               {"air": {"band": [250, 650, 350, 2.5], "gain": 0.28}},
                               {"ping": {"hz": 392, "at": 0.14, "seconds": 0.08, "gain": 0.18}}]},
}


def svf(x, fc, q, out="band"):
    """A state-variable filter (TPT) whose cutoff fc[i] and Q move per sample: smooth under modulation. out: band or low."""
    y = np.zeros(len(x))
    ic1 = ic2 = 0.0
    for i in range(len(x)):
        g = math.tan(math.pi * min(fc[i], RATE * 0.45) / RATE)
        k = 1.0 / q[i]
        a1 = 1.0 / (1.0 + g * (g + k))
        v3 = x[i] - ic2
        v1 = a1 * ic1 + g * a1 * v3
        v2 = ic2 + g * v1
        ic1, ic2 = 2 * v1 - ic1, 2 * v2 - ic2
        y[i] = v1 if out == "band" else v2
    return y


def glide(notes, g, t):
    """The pitch over time: each later note [arrival s, Hz] is reached by a glide of g seconds ending on its time (exponential in pitch)."""
    f = np.full(len(t), float(notes[0][1]))
    for (t1, hz), (_, prev) in zip(notes[1:], notes[:-1]):
        k = np.clip((t - (t1 - g)) / g, 0, 1)
        f = np.where(t >= t1 - g, prev * (hz / prev) ** k, f)
    return f


def voice(v, t, u, pk):
    f = glide(v["notes"], v.get("glide", 0.01), t)
    ph = 2 * np.pi * np.cumsum(f) / RATE
    top = 3200.0
    if v["wave"] == "fm":
        ratio, i0, i1 = v["fm"]
        idx = i0 * (i1 / i0) ** u
        x = np.sin(ph + idx * np.sin(ratio * ph))
    else:
        x = np.zeros(len(t))
        for k in range(1, int(top / max(f.min(), 20)) + 1):          # band-limited: no harmonic above `top`, no alias grit
            w = np.clip((top - k * f) / 400, 0, 1)
            if v["wave"] == "saw":
                x += w * np.sin(k * ph) / k
            else:
                x += w * (2 / (k * np.pi)) * np.sin(k * np.pi * v.get("duty", 0.5)) * np.cos(k * ph)
    lo, hi, q = v["lp"]
    fc = lo * (hi / lo) ** np.clip(u / pk, 0, 1)
    x = svf(x, fc, np.full(len(t), q), "low")
    if v.get("am"):
        hz, d = v["am"]
        x *= 1 - d * (0.5 - 0.5 * np.tanh(3 * np.sin(2 * np.pi * hz * t)))  # a gear's teeth: a rounded square ripple
    return x / (np.std(x) or 1.0)


def mech(spec, seed):
    n = int(spec["seconds"] * RATE)
    t = np.arange(n) / RATE
    u = t / spec["seconds"]
    pk = spec["peakAt"]
    att = min(0.010 / spec["seconds"], pk)
    env = np.where(u < att, np.sin(0.5 * np.pi * u / att) ** 2, 1.0)                       # a 10 ms rise: no click
    env *= np.where(u < pk, 1.0, np.cos(0.5 * np.pi * np.clip((u - pk) / (1 - pk), 0, 1)) ** 1.3)
    rng = np.random.default_rng(seed)
    out = np.zeros(n)
    for part in spec["parts"]:
        if "voice" in part:
            out += part["voice"]["gain"] * voice(part["voice"], t, u, pk) * env
        elif "air" in part:
            f0, fp, f1, q = part["air"]["band"]
            k1, k2 = np.clip(u / pk, 0, 1), np.clip((u - pk) / (1 - pk), 0, 1)
            fc = np.where(u < pk, f0 * (fp / f0) ** k1, fp * (f1 / fp) ** k2)
            b = svf(rng.standard_normal(n), fc, np.full(n, q))
            out += part["air"]["gain"] * b / (np.std(b) or 1.0) * env
        elif "ping" in part:
            pg = part["ping"]; tt = t - pg["at"]
            e = np.where(tt < 0, 0, np.sin(0.5 * np.pi * np.clip(tt / 0.006, 0, 1)) ** 2 * np.exp(-np.clip(tt, 0, None) / (pg["seconds"] / 3)))
            out += pg["gain"] * 3 * np.sin(2 * np.pi * pg["hz"] * t) * e
    a = math.exp(-2 * math.pi * 6000 / RATE)                                                 # a gentle top: no fizz
    y = np.zeros(n); prev = 0.0
    for i in range(n):
        prev = (1 - a) * out[i] + a * prev
        y[i] = prev
    y -= np.mean(y)
    edge = int(0.003 * RATE)
    y[:edge] *= np.linspace(0, 1, edge); y[-edge:] *= np.linspace(1, 0, edge)
    peak = np.max(np.abs(y)) or 1.0
    return y * (10 ** (PEAK_DB / 20) / peak)


def osc(kind, f0, f1, dur, wav, n, total):
    t = np.arange(total) / RATE
    k = np.clip(t / dur, 0, 1)
    f = f0 * (max(20.0, f1) / f0) ** k
    ph = 2 * np.pi * np.cumsum(f) / RATE
    if wav == "sine":
        return np.sin(ph)
    if wav == "square":
        return np.sign(np.sin(ph))
    if wav == "sawtooth":
        return 2 * ((ph / (2 * np.pi)) % 1.0) - 1
    return 2 * np.abs(2 * ((ph / (2 * np.pi)) % 1.0) - 1) - 1  # triangle


def bandnoise(f0, f1, dur, total, seed):
    rng = np.random.default_rng(seed)
    x = rng.uniform(-1, 1, total)
    y = np.zeros(total)
    x1 = x2 = y1 = y2 = 0.0
    for i in range(total):
        k = min(1.0, i / RATE / dur)
        fc = max(20.0, f0) * (max(20.0, f1) / max(20.0, f0)) ** k
        w0 = 2 * math.pi * min(fc, RATE * 0.45) / RATE
        al = math.sin(w0) / (2 * 1.2)
        a0 = 1 + al
        b0, b2, a1, a2 = al / a0, -al / a0, -2 * math.cos(w0) / a0, (1 - al) / a0
        yi = b0 * x[i] + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1, y2, y1 = x1, x[i], y1, yi
        y[i] = yi
    return y


def render(voices, seed=1):
    end = max(v[6] + v[3] + 0.03 for v in voices) + 0.05
    out = np.zeros(int(end * RATE))
    for j, (kind, f0, f1, dur, gain, wav, delay) in enumerate(voices):
        start, n = int(delay * RATE), int((dur + 0.03) * RATE)
        sig = osc(kind, f0, f1, dur, wav, n, n) if kind == T else bandnoise(f0, f1, dur, n, seed + j)
        t = np.arange(n) / RATE
        env = gain * (0.0001 / gain) ** np.clip(t / dur, 0, 1)
        out[start:start + n] += (sig * env)[: len(out) - start]
    peak = np.max(np.abs(out)) or 1.0
    return out * (10 ** (PEAK_DB / 20) / peak)


def name(eid):
    return "tone_" + eid.replace(".", "_").replace("-", "_") + ".wav"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    index = {}
    for f in OUT.glob("tone_*.wav"):  # every run writes the whole set
        f.unlink()
    for src, table in (("Prototype 8.4", SYNTH), ("Edit 100", NEW)):
        for eid0, voices in table.items():
            eid = eid0 + "/p84" if src == "Prototype 8.4" and eid0 in NEW else eid0  # a replaced 8.4 tone stays, as tone_<event>_p84.wav
            y = render(voices, seed=sum(map(ord, eid0)))
            f = OUT / name(eid.replace("/", "_"))
            with wave.open(str(f), "wb") as w:
                w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
                w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
            index[eid] = {"file": f.name, "source": src, "voices": voices, "seconds": round(len(y) / RATE, 3)}
    for eid, spec in MECH.items():  # alternates for an event, not its tone: tone_<event>_<name>.wav
        y = mech(spec, seed=sum(map(ord, eid)))
        f = OUT / name(eid.replace("/", "_"))
        with wave.open(str(f), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
        index[eid] = {"file": f.name, "source": "Edit 100 (rows 626, 627)", "alternateFor": eid.split("/")[0], "mech": spec, "seconds": round(len(y) / RATE, 3)}
    INDEX.write_text(json.dumps({"generated_by": "audio/tones.py", "folder": "prototypes/p9/audio/tones/", "count": len(index), "tones": index},
                                indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{INDEX.relative_to(ROOT)}: {len(index)} tones ({sum(v['source'] == 'Edit 100' for v in index.values())} new)")


if __name__ == "__main__":
    main()
