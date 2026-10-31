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

# Lawrence, 31 October 00:20 (DECISIONS row 626): "it sounds crunchy but it should sound 'whooshy' but quite short". Three
# alternates for the dash, offered in the Sound Lab beside his pick. Air, not grit: noise through a band-pass whose centre
# moves, with a swell rather than a hit (no transient), and nothing above ~9 kHz. Layers: [from Hz, peak Hz, to Hz, Q, gain];
# the centre glides from → peak by `peakAt` of the length, then peak → to. `body`: a soft sine [from Hz, to Hz, gain] under it.
WHOOSH = {
    "lunge/whoosh-a": {"seconds": 0.16, "peakAt": 0.32, "layers": [[900, 2600, 3600, 1.4, 1.0]], "note": "swish: bright and quick"},
    "lunge/whoosh-b": {"seconds": 0.20, "peakAt": 0.30, "layers": [[350, 800, 1100, 0.9, 1.0], [2200, 4800, 6500, 1.6, 0.5]],
                       "body": [160, 80, 0.12], "note": "air dash: a fuller push with a little weight"},
    "lunge/whoosh-c": {"seconds": 0.24, "peakAt": 0.40, "layers": [[500, 2600, 800, 2.2, 1.0]], "flutter": [28, 0.25],
                       "note": "pass-by: up and away, a cloth flutter"},
}


def svf_band(x, fc, q):
    """A band-pass (TPT state-variable filter) whose centre fc[i] and Q move per sample: smooth under modulation."""
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
        y[i] = v1
    return y


def whoosh(spec, seed):
    n = int(spec["seconds"] * RATE)
    t = np.arange(n) / RATE
    u = t / spec["seconds"]
    pk = spec["peakAt"]
    rise = np.sin(0.5 * np.pi * np.clip(u / pk, 0, 1)) ** 2                    # a swell, not a hit
    fall = np.cos(0.5 * np.pi * np.clip((u - pk) / (1 - pk), 0, 1)) ** 1.6
    env = np.where(u < pk, rise, fall)
    rng = np.random.default_rng(seed)
    out = np.zeros(n)
    for j, (f0, fp, f1, q, gain) in enumerate(spec["layers"]):
        noise = rng.standard_normal(n)
        k1, k2 = np.clip(u / pk, 0, 1), np.clip((u - pk) / (1 - pk), 0, 1)
        fc = np.where(u < pk, f0 * (fp / f0) ** k1, fp * (f1 / fp) ** k2)       # the centre moves: the air goes past
        qv = q * (0.8 + 0.4 * env)                                               # narrower at the peak: a touch of pitch
        band = svf_band(noise, fc, qv)
        out += gain * band / (np.std(band) or 1.0)
    if spec.get("body"):
        f0, f1, g = spec["body"]
        f = f0 * (f1 / f0) ** u
        out += g * 3 * np.sin(2 * np.pi * np.cumsum(f) / RATE)
    if spec.get("flutter"):
        hz, depth = spec["flutter"]
        out *= 1 - depth + depth * (0.5 + 0.5 * np.sin(2 * np.pi * hz * t))
    out *= env
    a = math.exp(-2 * math.pi * 9000 / RATE)                                     # nothing gritty above ~9 kHz
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
    for eid, spec in WHOOSH.items():  # alternates for an event, not its tone: tone_<event>_<name>.wav
        y = whoosh(spec, seed=sum(map(ord, eid)))
        f = OUT / name(eid.replace("/", "_"))
        with wave.open(str(f), "wb") as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(RATE)
            w.writeframes((np.clip(y, -1, 1) * 32767).astype("<i2").tobytes())
        index[eid] = {"file": f.name, "source": "Edit 100 (row 626)", "alternateFor": eid.split("/")[0], "whoosh": spec, "seconds": round(len(y) / RATE, 3)}
    INDEX.write_text(json.dumps({"generated_by": "audio/tones.py", "folder": "prototypes/p9/audio/tones/", "count": len(index), "tones": index},
                                indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{INDEX.relative_to(ROOT)}: {len(index)} tones ({sum(v['source'] == 'Edit 100' for v in index.values())} new)")


if __name__ == "__main__":
    main()
