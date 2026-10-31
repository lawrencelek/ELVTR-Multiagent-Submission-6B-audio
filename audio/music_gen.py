"""Generated music for DUMMIES: the four tracks the pack lacks (Lawrence, 30 October 12:06; DECISIONS row 619).

    Track 7  certified      the ship: the dummy set down, CERTIFIED (76 BPM, D major pentatonic, 20 bars)
    Track 8  licensed       a run licensed (124 BPM, C major, 16 bars)
    Track 9  failed test    a run failed (66 BPM, A minor, 12 bars)
    Track 10 non-compliant  a refusal (100 BPM, E minor with its flat second, 16 bars)
    Track 11 tile cleared   a Story tile cleared, until the next card (132 BPM, G major, 12 bars; row 631)

Numpy and scipy only. Voices: pulse, square, triangle and saw (band-limited, additive), FM bells, an FM electric piano, a
plucked string (Karplus–Strong), a filtered-saw pad, a ship's horn, a gong; drums from sines and filtered noise. A stereo
ping-pong delay and a convolution reverb. Each track is a whole number of bars; its tails wrap to the start, so it loops on
the bar (the engine adds its 0.3 s seam, row 609).

Writes prototypes/p9/audio/music/track<N>_dummies-generated_<slug>.ogg, music/mp3/<same>.mp3, content/audio/music_gen.json.

    python3 audio/music_gen.py            every track
    python3 audio/music_gen.py 11         only Track 11: the others' files and index entries stay as they are
"""
import json
import subprocess
import tempfile
import wave
from pathlib import Path

import numpy as np
from scipy.signal import butter, fftconvolve, sosfilt

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "prototypes" / "p9" / "audio" / "music"
INDEX = ROOT / "content" / "audio" / "music_gen.json"
RATE = 44100
NOTE = {"C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5, "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11}


def m(s):
    return 12 * (int(s[-1]) + 1) + NOTE[s[:-1]]


def hz(n):
    return 440.0 * 2 ** ((n - 69) / 12)


def adsr(dur, a, d, s, r):
    n_on, n_r = max(1, int(dur * RATE)), int(r * RATE)
    t = np.arange(n_on) / RATE
    on = np.where(t < a, t / max(a, 1e-4), s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    rel = on[-1] * np.exp(-np.arange(n_r) / RATE / max(r / 4, 1e-4))
    return np.concatenate([on, rel])


def phase(f, n, vib=0.0, rate=5.5, delay=0.15):
    t = np.arange(n) / RATE
    fr = f * (1 + vib * np.sin(2 * np.pi * rate * t) * np.clip((t - delay) / 0.2, 0, 1))
    return 2 * np.pi * np.cumsum(fr) / RATE


def additive(ph, f, coef, top=14000):
    out = np.zeros_like(ph)
    for k, a in coef:
        if f * k > top:
            break
        out += a * np.sin(k * ph)
    return out


def lowpass(x, fc, order=2):
    return sosfilt(butter(order, min(fc, RATE * 0.45), "low", fs=RATE, output="sos"), x)


def highpass(x, fc, order=2):
    return sosfilt(butter(order, fc, "high", fs=RATE, output="sos"), x)


def bandpass(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, min(hi, RATE * 0.45)], "band", fs=RATE, output="sos"), x)


RNG = np.random.default_rng(100)


def noise(n):
    return RNG.uniform(-1, 1, n)


# ---------- voices: (frequency, seconds, velocity) → mono samples, release included
def v_pulse(f, dur, vel, duty=0.25, vib=0.004):
    e = adsr(dur, 0.004, 0.09, 0.55, 0.07)
    ph = phase(f, len(e), vib)
    coef = [(k, (2 / (k * np.pi)) * np.sin(np.pi * k * duty)) for k in range(1, 40)]
    return vel * e * additive(ph + np.pi / 2, f, coef)  # cosine series


def v_square(f, dur, vel):
    e = adsr(dur, 0.004, 0.06, 0.5, 0.05)
    return vel * e * additive(phase(f, len(e)), f, [(k, 4 / (np.pi * k)) for k in range(1, 40, 2)])


def v_tri(f, dur, vel, vib=0.003):
    e = adsr(dur, 0.012, 0.15, 0.75, 0.18)
    return vel * e * additive(phase(f, len(e), vib, 4.8, 0.3), f, [(k, (8 / np.pi ** 2) * (-1) ** ((k - 1) // 2) / k ** 2) for k in range(1, 30, 2)])


def v_bass(f, dur, vel, fc=900):
    e = adsr(dur, 0.004, 0.12, 0.7, 0.05)
    x = additive(phase(f, len(e)), f, [(k, 1 / k) for k in range(1, 40)], 6000)
    return vel * e * lowpass(x, fc)


def v_subbass(f, dur, vel):
    e = adsr(dur, 0.02, 0.3, 0.8, 0.2)
    ph = phase(f, len(e))
    return vel * e * (np.sin(ph) + 0.25 * np.sin(2 * ph) + 0.1 * np.sin(3 * ph))


def v_pad(f, dur, vel, fc=1700, wob=0.0):
    e = adsr(dur, 0.7, 0.6, 0.85, 1.2)
    n, x = len(e), 0
    for cents, a in ((-8, 0.5), (0, 0.6), (7, 0.5)):
        g = f * 2 ** (cents / 1200)
        x = x + a * additive(phase(g, n, wob, 0.35, 0.0), g, [(k, 1 / k) for k in range(1, 30)], 7000)
    return vel * e * lowpass(x, fc) * 0.5


def v_bell(f, dur, vel, ratio=3.5, index=1.4, decay=1.4):
    n = int((dur + decay * 1.2) * RATE)
    t = np.arange(n) / RATE
    amp = np.minimum(1, t / 0.002) * np.exp(-t / decay)
    mod = index * np.exp(-t / 0.35) * np.sin(2 * np.pi * f * ratio * t)
    return vel * amp * (np.sin(2 * np.pi * f * t + mod) + 0.25 * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t / 0.4))


def v_epiano(f, dur, vel):
    n = int((dur + 0.9) * RATE)
    t = np.arange(n) / RATE
    gate = np.where(t < dur, 1.0, np.exp(-(t - dur) / 0.12))
    amp = np.minimum(1, t / 0.003) * np.exp(-t / 1.1) * gate
    body = np.sin(2 * np.pi * f * t + 1.6 * np.exp(-t / 0.3) * np.sin(2 * np.pi * f * t))
    tine = 0.12 * np.exp(-t / 0.05) * np.sin(2 * np.pi * f * 14 * t)
    return vel * amp * (body + tine)


def v_pluck(f, dur, vel, decay=0.995, bright=5000):
    total = int((dur + 1.4) * RATE)
    N = max(2, int(round(RATE / f - 0.5)))
    y = np.zeros(total + N + 2)
    y[: N + 1] = lowpass(noise(N + 1), bright, 1)
    k = N + 1
    while k < len(y):
        j = min(k + N, len(y))
        y[k:j] = decay * 0.5 * (y[k - N:j - N] + y[k - N - 1:j - N - 1])
        k = j
    y = y[:total]
    t = np.arange(total) / RATE
    gate = np.where(t < dur + 0.6, 1.0, np.exp(-(t - dur - 0.6) / 0.2))
    return vel * y * gate / (np.max(np.abs(y[:N * 4])) or 1)


def v_blip(f, dur, vel):
    e = adsr(dur, 0.003, 0.08, 0.5, 0.12)
    ph = phase(f, len(e))
    return vel * e * (np.sin(ph) + 0.08 * np.sin(3 * ph))


def v_horn(f, dur, vel):  # a ship's horn: two low saws a fourth apart, swelling, lowpassed
    e = adsr(dur, 0.35, 0.5, 0.9, 0.9)
    x = 0
    for g, a in ((f, 0.6), (f * 4 / 3, 0.45), (f * 2, 0.15)):
        x = x + a * additive(phase(g, len(e), 0.002, 3.0, 0.4), g, [(k, 1 / k) for k in range(1, 30)], 4000)
    return vel * e * lowpass(x, 520, 2)


def v_gong(f, dur, vel):
    n = int(5.5 * RATE)
    t = np.arange(n) / RATE
    amp = np.minimum(1, t / 0.004) * np.exp(-t / 2.2)
    x = np.sin(2 * np.pi * f * t + 2.6 * np.exp(-t / 1.2) * np.sin(2 * np.pi * f * 1.41 * t)) + 0.4 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.9)
    return vel * amp * lowpass(x, 3000)


def d_kick(vel):
    t = np.arange(int(0.45 * RATE)) / RATE
    fr = 46 + 120 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(fr) / RATE) * np.exp(-t / 0.22)
    click = lowpass(noise(len(t)), 3000) * np.exp(-t / 0.004) * 0.3
    return vel * (body + click)


def d_snare(vel, decay=0.14):
    t = np.arange(int(0.4 * RATE)) / RATE
    return vel * (0.8 * bandpass(noise(len(t)), 1200, 7000) * np.exp(-t / decay) + 0.5 * np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05))


def d_rim(vel):
    t = np.arange(int(0.12 * RATE)) / RATE
    return vel * (bandpass(noise(len(t)), 1800, 5000) * np.exp(-t / 0.012) + 0.6 * np.sin(2 * np.pi * 820 * t) * np.exp(-t / 0.02))


def d_clap(vel):
    t = np.arange(int(0.35 * RATE)) / RATE
    env = sum(np.exp(-np.clip(t - o, 0, None) / 0.008) * (t >= o) for o in (0, 0.011, 0.023)) + 0.6 * np.exp(-np.clip(t - 0.03, 0, None) / 0.09) * (t >= 0.03)
    return vel * bandpass(noise(len(t)), 900, 4500) * env


def d_hat(vel, decay=0.035):
    t = np.arange(int((decay * 6 + 0.02) * RATE)) / RATE
    return vel * highpass(noise(len(t)), 7000) * np.exp(-t / decay)


def d_crash(vel):
    t = np.arange(int(2.6 * RATE)) / RATE
    return vel * highpass(noise(len(t)), 4500) * np.exp(-t / 0.75) * 0.7


def d_tom(f, vel):
    t = np.arange(int(0.5 * RATE)) / RATE
    fr = f * (1 + 0.5 * np.exp(-t / 0.03))
    return vel * np.sin(2 * np.pi * np.cumsum(fr) / RATE) * np.exp(-t / 0.18)


VOICES = {"pulse": v_pulse, "pulse12": lambda f, d, v: v_pulse(f, d, v, 0.125), "square": v_square, "tri": v_tri, "bass": v_bass,
          "sub": v_subbass, "pad": v_pad, "padwob": lambda f, d, v: v_pad(f, d, v, 1200, 0.004), "bell": v_bell,
          "celesta": lambda f, d, v: v_bell(f, d, v, 4.0, 0.8, 0.9), "epiano": v_epiano, "pluck": v_pluck, "blip": v_blip,
          "horn": v_horn, "gong": v_gong}
DRUMS = {"kick": d_kick, "snare": d_snare, "rim": d_rim, "clap": d_clap, "hat": d_hat, "ohat": lambda v: d_hat(v, 0.16), "crash": d_crash,
         "tomh": lambda v: d_tom(196, v), "toml": lambda v: d_tom(130, v)}


# ---------- the score: events (voice, beat, beats, midi or None, velocity, pan, delay send, reverb send)
class Score:
    def __init__(self, bpm, bars, beats=4):
        self.bpm, self.bars, self.beats, self.ev = bpm, bars, beats, []

    def add(self, voice, beat, dur, note, vel, pan=0.0, dly=0.0, rev=0.2):
        self.ev.append((voice, beat, dur, None if note is None else (m(note) if isinstance(note, str) else note), vel, pan, dly, rev))

    def line(self, voice, bar, items, vel, pan=0.0, dly=0.0, rev=0.25, shift=0):  # items: (beat in bar, beats, note)
        for b, d, nt in items:
            self.add(voice, (bar - 1) * self.beats + b, d, m(nt) + shift, vel, pan, dly, rev)

    def chord(self, voice, bar, notes, beat=0, dur=4, vel=0.3, pan=0.0, dly=0.0, rev=0.35):
        for i, nt in enumerate(notes):
            self.add(voice, (bar - 1) * self.beats + beat, dur, nt, vel, pan + (i - (len(notes) - 1) / 2) * 0.25, dly, rev)

    def hit(self, drum, bar, beats, vel, pan=0.0, rev=0.1):
        for b in beats:
            self.add(drum, (bar - 1) * self.beats + b, 0.25, None, vel, pan, 0.0, rev)


def render(sc, delay_beats=0.75, fb=0.32, rt60=1.9, rev_mix=0.28, dly_mix=0.22):
    spb = 60.0 / sc.bpm
    L = int(round(sc.bars * sc.beats * spb * RATE))
    tail = int(4.0 * RATE)
    dry, dsend, rsend = np.zeros((2, L + tail + RATE * 6)), np.zeros(L + tail + RATE * 6), np.zeros((2, L + tail + RATE * 6))
    for voice, beat, dur, note, vel, pan, dly, rev in sc.ev:
        x = DRUMS[voice](vel) if voice in DRUMS else VOICES[voice](hz(note), dur * spb, vel)
        s = int(round(beat * spb * RATE))
        x = x[: len(dsend) - s]
        th = (pan + 1) * np.pi / 4
        lr = np.array([np.cos(th), np.sin(th)])[:, None] * x[None, :]
        dry[:, s:s + len(x)] += lr
        dsend[s:s + len(x)] += x * dly
        rsend[:, s:s + len(x)] += lr * rev
    out = dry.copy()
    D = int(round(delay_beats * spb * RATE))
    for k in range(1, 7):  # ping-pong: echoes alternate sides
        ch = (k + 1) % 2
        seg = lowpass(dsend, 4500) * (fb ** k) * dly_mix
        out[ch, D * k:] += seg[: out.shape[1] - D * k]
    n_ir = int(rt60 * 1.3 * RATE)
    t = np.arange(n_ir) / RATE
    ir = np.stack([lowpass(noise(n_ir), 6000) * np.exp(-6.9 * t / rt60) for _ in range(2)])
    ir[:, : int(0.02 * RATE)] = 0
    ir /= np.sqrt(np.sum(ir ** 2, axis=1, keepdims=True))
    for c in range(2):
        out[c] += fftconvolve(rsend[c] + 0.15 * rsend[1 - c], ir[c])[: out.shape[1]] * rev_mix
    out[:, :tail] += out[:, L:L + tail]  # the tails wrap to the start: the loop rings on
    out = out[:, :L]
    out = np.tanh(out / (np.max(np.abs(out)) or 1) * 1.15) / np.tanh(1.15)  # gentle glue
    return out * 10 ** (-1 / 20)


# ---------- Track 7 · certified · the ship (D major pentatonic; a horn, plucked strings, bells, a gong)
def certified():
    s = Score(76, 20)
    C = {"D": (["D4", "F#4", "A4"], "D2", ["D4", "A4", "E5", "F#5", "A5", "F#5", "E5", "A4"]),
         "Bm": (["B3", "D4", "F#4"], "B1", ["B3", "F#4", "A4", "D5", "E5", "D5", "A4", "F#4"]),
         "G": (["G3", "B3", "D4"], "G1", ["G3", "D4", "A4", "B4", "D5", "B4", "A4", "D4"]),
         "A": (["A3", "C#4", "E4"], "A1", ["A3", "E4", "B4", "C#5", "E5", "C#5", "B4", "E4"]),
         "D/F#": (["D4", "F#4", "A4"], "F#1", ["D4", "A4", "E5", "F#5", "A5", "F#5", "E5", "A4"]),
         "Em": (["E3", "G3", "B3", "D4"], "E2", ["E4", "B4", "D5", "E5", "G5", "E5", "D5", "B4"]),
         "F#m": (["F#3", "A3", "C#4"], "F#1", ["F#3", "C#4", "E4", "A4", "C#5", "A4", "E4", "C#4"])}
    prog = ["D", "Bm", "G", "A", "D", "Bm", "G", "A", "D/F#", "G", "Em", "A", "G", "A", "F#m", "Bm", "Em", "A", "D", "D"]
    for bar, ch in enumerate(prog, 1):
        pad, bass, arp = C[ch]
        s.chord("pad", bar, [m(x) for x in pad], vel=0.16 if bar < 13 else 0.2)
        s.add("sub", (bar - 1) * 4, 3.8, bass, 0.5 if bar > 4 else 0.35, 0, 0, 0.05)
        s.add("bass", (bar - 1) * 4, 1.5, m(bass) + 12, 0.18 if bar > 4 else 0.0, 0, 0, 0.05)
        s.add("bass", (bar - 1) * 4 + 2.5, 1.5, m(bass) + 12, 0.14 if bar > 4 else 0.0, 0, 0, 0.05)
        for i, nt in enumerate(arp):
            s.add("pluck", (bar - 1) * 4 + i * 0.5, 0.5, nt, 0.2 if bar < 13 else 0.24, -0.35 + 0.1 * (i % 2), 0.45, 0.3)
    s.add("horn", 0, 7, "D2", 0.55, -0.1, 0, 0.5)          # the ship, at the quay
    s.add("horn", 8, 5, "A1", 0.45, 0.1, 0, 0.5)
    mel = {5: [(0, 1.5, "F#5"), (1.5, 0.5, "E5"), (2, 2, "D5")], 6: [(0, 1, "B4"), (1, 1, "D5"), (2, 1.5, "F#5"), (3.5, 0.5, "E5")],
           7: [(0, 1.5, "D5"), (1.5, 0.5, "B4"), (2, 2, "A4")], 8: [(0, 1, "C#5"), (1, 1, "E5"), (2, 2, "A4")],
           9: [(0, 1.5, "A5"), (1.5, 0.5, "F#5"), (2, 1, "E5"), (3, 1, "D5")], 10: [(0, 1, "B4"), (1, 1, "D5"), (2, 2, "E5")],
           11: [(0, 1.5, "G5"), (1.5, 0.5, "F#5"), (2, 1, "E5"), (3, 1, "D5")], 12: [(0, 3, "E5"), (3, 1, "C#5")],
           13: [(0, 1, "D6"), (1, 1, "B5"), (2, 1, "A5"), (3, 1, "B5")], 14: [(0, 1.5, "C#6"), (1.5, 0.5, "B5"), (2, 2, "A5")],
           15: [(0, 1, "A5"), (1, 1, "F#5"), (2, 1, "E5"), (3, 1, "C#5")], 16: [(0, 2, "D5"), (2, 1, "F#5"), (3, 1, "A5")],
           17: [(0, 1.5, "B5"), (1.5, 0.5, "A5"), (2, 1, "G5"), (3, 1, "E5")], 18: [(0, 1, "E5"), (1, 1, "A5"), (2, 1, "C#6"), (3, 1, "E6")],
           19: [(0, 4, "D6")], 20: [(0, 3, "A5")]}
    for bar, it in mel.items():
        s.line("bell", bar, it, 0.42, 0.15, 0.35, 0.45)
        if bar >= 13:
            s.line("tri", bar, it, 0.12, -0.15, 0.2, 0.35, -12)  # a soft octave below
    s.add("gong", 48, 4, "D2", 0.5, 0, 0, 0.6)
    s.add("gong", 72, 4, "D2", 0.4, 0, 0, 0.6)
    for bar in range(5, 19):
        s.hit("kick", bar, [0, 2] if bar < 13 else [0, 1.5, 2], 0.55)
        if bar >= 9:
            s.hit("hat", bar, [i * 0.5 for i in range(8)], 0.09, 0.3)
            s.hit("snare", bar, [2] if bar < 13 else [1, 3], 0.28, 0, 0.35)
    s.hit("tomh", 12, [3], 0.4); s.hit("toml", 12, [3.5], 0.45)
    s.hit("crash", 13, [0], 0.3); s.hit("crash", 19, [0], 0.25); s.hit("kick", 19, [0], 0.55)
    return s, dict(delay_beats=0.75, fb=0.35, rt60=2.6, rev_mix=0.32)


# ---------- Track 8 · licensed (C major; chip lead, arpeggio, four on the floor)
def licensed():
    s = Score(124, 16)
    C = {"C": ("C2", ["C5", "E5", "G5", "C6"]), "Am": ("A1", ["A4", "C5", "E5", "A5"]), "F": ("F1", ["F4", "A4", "C5", "F5"]),
         "G": ("G1", ["G4", "B4", "D5", "G5"]), "Em": ("E2", ["E4", "G4", "B4", "E5"])}
    prog = ["C", "Am", "F", "G", "C", "Am", "F", "G", "F", "G", "Em", "Am", "F", "G", "C", "G"]
    for bar, ch in enumerate(prog, 1):
        bass, arp = C[ch]
        for i in range(8):
            s.add("bass", (bar - 1) * 4 + i * 0.5, 0.4, m(bass) + (12 if i % 2 else 0) + 12, 0.32, 0, 0, 0.05)
        for i in range(16):
            s.add("square", (bar - 1) * 4 + i * 0.25, 0.2, m(arp[i % 4]) - 12, 0.06, 0.4, 0.2, 0.15)
        s.chord("pad", bar, [m(n) - 12 for n in arp[:3]], vel=0.08, rev=0.3)
    mel = {1: [(0, 0.5, "E5"), (0.5, 0.5, "G5"), (1, 1, "C6"), (2, 0.5, "B5"), (2.5, 0.5, "G5"), (3, 1, "E5")],
           2: [(0, 1, "A5"), (1, 0.5, "G5"), (1.5, 0.5, "E5"), (2, 2, "C5")],
           3: [(0, 0.5, "F5"), (0.5, 0.5, "A5"), (1, 1, "C6"), (2, 1, "A5"), (3, 1, "F5")],
           4: [(0, 1.5, "G5"), (1.5, 0.5, "A5"), (2, 0.5, "B5"), (2.5, 0.5, "D6"), (3, 1, "B5")],
           5: [(0, 0.5, "E5"), (0.5, 0.5, "G5"), (1, 1, "C6"), (2, 0.5, "D6"), (2.5, 0.5, "C6"), (3, 1, "G5")],
           6: [(0, 1, "A5"), (1, 1, "C6"), (2, 1, "E6"), (3, 1, "C6")],
           7: [(0, 1, "A5"), (1, 0.5, "G5"), (1.5, 0.5, "F5"), (2, 1, "A5"), (3, 1, "C6")],
           8: [(0, 2, "B5"), (2, 1, "G5"), (3, 1, "D5")],
           9: [(0, 1, "A5"), (1, 0.5, "C6"), (1.5, 0.5, "A5"), (2, 1, "F5"), (3, 1, "A5")],
           10: [(0, 1, "B5"), (1, 0.5, "D6"), (1.5, 0.5, "B5"), (2, 1, "G5"), (3, 1, "B5")],
           11: [(0, 1, "G5"), (1, 0.5, "B5"), (1.5, 0.5, "G5"), (2, 1, "E5"), (3, 1, "G5")],
           12: [(0, 1, "A5"), (1, 1, "C6"), (2, 2, "E6")],
           13: [(0, 1.5, "C6"), (1.5, 0.5, "D6"), (2, 1, "C6"), (3, 1, "A5")],
           14: [(0, 1.5, "B5"), (1.5, 0.5, "C6"), (2, 1, "D6"), (3, 1, "G5")],
           15: [(0, 0.5, "E6"), (0.5, 0.5, "D6"), (1, 0.5, "C6"), (1.5, 0.5, "G5"), (2, 2, "C6")],
           16: [(0, 1, "D6"), (1, 1, "B5"), (2, 1, "G5"), (3, 1, "D5")]}
    for bar, it in mel.items():
        s.line("pulse12", bar, it, 0.3, -0.1, 0.3, 0.2)
        if bar >= 9:
            s.line("pulse", bar, it, 0.12, 0.25, 0.1, 0.2, -12)
    for bar in range(1, 17):
        s.hit("kick", bar, [0, 1, 2, 3], 0.6)
        s.hit("clap", bar, [1, 3], 0.32, 0.05, 0.25)
        s.hit("hat", bar, [0.5, 1.5, 2.5, 3.5], 0.16, 0.3)
        if bar % 2 == 0:
            s.hit("ohat", bar, [3.5], 0.1, 0.3)
    s.hit("crash", 1, [0], 0.25); s.hit("crash", 9, [0], 0.25)
    return s, dict(delay_beats=0.75, fb=0.25, rt60=1.2, rev_mix=0.18, dly_mix=0.16)


# ---------- Track 9 · failed test (A minor; a wobbling pad, a slow triangle line, plucked chords, no drums)
def failed():
    s = Score(66, 12)
    C = {"Am": (["A3", "C4", "E4"], "A1"), "F": (["F3", "A3", "C4"], "F1"), "C": (["G3", "C4", "E4"], "C2"), "E": (["G#3", "B3", "E4"], "E1"),
         "Dm": (["F3", "A3", "D4"], "D2")}
    prog = ["Am", "F", "C", "E", "Am", "Dm", "F", "E", "Am", "F", "Dm", "E"]
    for bar, ch in enumerate(prog, 1):
        pad, bass = C[ch]
        s.chord("padwob", bar, [m(x) for x in pad], vel=0.2, rev=0.45)
        s.add("sub", (bar - 1) * 4, 3.9, bass, 0.42, 0, 0, 0.1)
        notes = [m(pad[0]) - 12, m(pad[1]), m(pad[2]), m(pad[1])]
        for i, nt in enumerate(notes):
            s.add("pluck", (bar - 1) * 4 + i, 1, nt, 0.16, 0.3, 0.3, 0.4)
    mel = {1: [(0, 2, "E5"), (2, 1, "C5"), (3, 1, "B4")], 2: [(0, 3, "A4"), (3, 1, "C5")],
           3: [(0, 1, "E5"), (1, 1, "G5"), (2, 1, "E5"), (3, 1, "D5")], 4: [(0, 3, "B4"), (3, 1, "G#4")],
           5: [(0, 2, "A4"), (2, 1, "C5"), (3, 1, "E5")], 6: [(0, 2, "F5"), (2, 1, "E5"), (3, 1, "D5")],
           7: [(0, 1, "C5"), (1, 1, "A4"), (2, 2, "C5")], 8: [(0, 4, "B4")],
           9: [(0, 1, "A5"), (1, 1, "G5"), (2, 1, "E5"), (3, 1, "C5")], 10: [(0, 2, "C5"), (2, 1, "D5"), (3, 1, "C5")],
           11: [(0, 2, "A4"), (2, 2, "F4")], 12: [(0, 2, "G#4"), (2, 2, "B4")]}
    for bar, it in mel.items():
        s.line("tri", bar, it, 0.36, -0.1, 0.35, 0.5)
        if bar >= 9:
            s.line("celesta", bar, it, 0.12, 0.2, 0.3, 0.55, 12)
    for bar in range(5, 13):  # a slow heartbeat
        s.hit("kick", bar, [0, 0.4], 0.22, 0, 0.2)
    return s, dict(delay_beats=1.0, fb=0.3, rt60=3.0, rev_mix=0.36, dly_mix=0.18)


# ---------- Track 10 · non-compliant (E minor, flat second; hold music: off-beat e-piano, a cold chime, a pulsing bass)
def noncompliant():
    s = Score(100, 16)
    C = {"Em": (["E4", "G4", "B4"], "E2"), "F": (["F4", "A4", "C5", "E5"], "F2"), "C": (["E4", "G4", "C5"], "C2"), "B": (["D#4", "F#4", "B4"], "B1"),
         "Am": (["E4", "A4", "C5"], "A1")}
    prog = ["Em", "F", "Em", "F", "C", "B", "Em", "Em", "Am", "Em", "F", "Em", "Am", "B", "Em", "F"]
    for bar, ch in enumerate(prog, 1):
        ep, bass = C[ch]
        for b in (0.5, 1.5, 2.5, 3.5):
            s.chord("epiano", bar, [m(x) for x in ep], beat=b, dur=0.35, vel=0.11, rev=0.3)
        for i in range(8):
            s.add("bass", (bar - 1) * 4 + i * 0.5, 0.35, m(bass), 0.3, 0, 0, 0.05)
        s.hit("kick", bar, [0, 2], 0.45)
        s.hit("rim", bar, [1, 3], 0.18, 0.15, 0.2)
        s.hit("hat", bar, [i * 0.25 for i in range(16)], 0.045, 0.35)
    chime = [(0, 0.5, "B5"), (0.5, 0.5, "C6"), (1, 0.5, "B5"), (1.5, 0.5, "G5")]
    mel = {1: chime, 2: [(0, 1, "A5"), (1, 1, "C6"), (2, 2, "B5")], 3: chime + [(2, 2, "E5")], 4: [(0, 2, "F5"), (2, 2, "E5")],
           5: [(0, 1, "G5"), (1, 1, "E5"), (2, 1, "C5"), (3, 1, "E5")], 6: [(0, 2, "D#5"), (2, 2, "F#5")], 7: [(0, 4, "E5")], 8: chime,
           9: [(0, 1, "C6"), (1, 1, "B5"), (2, 2, "A5")], 10: [(0, 1, "G5"), (1, 1, "F#5"), (2, 2, "E5")],
           11: [(0, 1, "A5"), (1, 1, "C6"), (2, 2, "B5")], 12: [(0, 2, "G5"), (2, 2, "E5")],
           13: [(0, 1, "E5"), (1, 1, "A5"), (2, 1, "C6"), (3, 1, "A5")], 14: [(0, 2, "D#6"), (2, 2, "B5")], 15: [(0, 4, "G5")],
           16: [(0, 2, "F5"), (2, 2, "E5")]}
    for bar, it in mel.items():
        s.line("blip", bar, it, 0.3, 0.1, 0.4, 0.35)
    return s, dict(delay_beats=0.75, fb=0.3, rt60=1.4, rev_mix=0.22, dly_mix=0.2)


# ---------- Track 11 · tile cleared (G major; a fanfare, then a bright loop) · Lawrence, 31 October 16:24 (row 631):
# "after i clear a level, the music should change to 'Tile Cleared' music ... once the tile is cleared that should have some
# satisfying music or jingle". Bars 1–2: the jingle, a rising G arpeggio over a snare roll, a ta-da on the chord. Bars 3–12: a
# bouncing loop that climbs back (Am, D) into the jingle, so each pass opens on it.
def cleared():
    s = Score(132, 12)
    s.line("pulse12", 1, [(0.5, 0.5, "G4"), (1, 0.5, "B4"), (1.5, 0.5, "D5"), (2, 0.5, "G5"), (2.5, 0.5, "B5"), (3, 1, "D6")], 0.34, -0.1, 0.25, 0.25)
    s.line("bell", 1, [(0.5, 0.5, "G5"), (1, 0.5, "B5"), (1.5, 0.5, "D6"), (2, 0.5, "G6"), (2.5, 0.5, "B5"), (3, 1, "D6")], 0.22, 0.2, 0.3, 0.35)
    for i, b in enumerate([2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75]):
        s.add("snare", b, 0.25, None, 0.08 + 0.03 * i, 0.05, 0, 0.2)
    s.hit("tomh", 1, [3], 0.35); s.hit("toml", 1, [3.5], 0.4)
    s.line("pulse12", 2, [(0, 0.5, "G5"), (0.5, 0.5, "G5"), (1, 0.5, "A5"), (1.5, 0.5, "B5"), (2, 2, "D6")], 0.36, -0.1, 0.3, 0.3)
    s.line("bell", 2, [(0, 0.5, "G5"), (0.5, 0.5, "G5"), (1, 0.5, "A5"), (1.5, 0.5, "B5"), (2, 2, "G6")], 0.26, 0.2, 0.35, 0.45)
    s.chord("pad", 2, [m(x) for x in ("G4", "B4", "D5", "G5")], beat=0, dur=4, vel=0.14, rev=0.4)
    s.chord("square", 2, [m(x) for x in ("G4", "B4", "D5")], beat=0, dur=0.5, vel=0.1); s.chord("square", 2, [m(x) for x in ("G4", "B4", "D5")], beat=2, dur=1.5, vel=0.1)
    s.add("sub", 4, 3.8, "G1", 0.5, 0, 0, 0.05)
    s.hit("crash", 2, [0], 0.32); s.hit("kick", 2, [0, 2], 0.6); s.hit("clap", 2, [2], 0.3, 0.05, 0.3)
    C = {"G": ("G1", ["G4", "B4", "D5", "G5"]), "Em": ("E2", ["E4", "G4", "B4", "E5"]), "C": ("C2", ["C5", "E5", "G5", "C6"]),
         "D": ("D2", ["D4", "F#4", "A4", "D5"]), "Am": ("A1", ["A4", "C5", "E5", "A5"])}
    prog = {3: "G", 4: "Em", 5: "C", 6: "D", 7: "G", 8: "Em", 9: "C", 10: "D", 11: "Am", 12: "D"}
    for bar, ch in prog.items():
        bass, arp = C[ch]
        for i in range(8):
            s.add("bass", (bar - 1) * 4 + i * 0.5, 0.4, m(bass) + (12 if i % 2 else 0) + 12, 0.3, 0, 0, 0.05)
        for i in range(16):
            s.add("square", (bar - 1) * 4 + i * 0.25, 0.2, m(arp[i % 4]) - 12, 0.05, 0.4, 0.2, 0.15)
        s.chord("pad", bar, [m(n) - 12 for n in arp[:3]], vel=0.08, rev=0.3)
        s.hit("kick", bar, [0, 1, 2, 3], 0.5)
        s.hit("clap", bar, [1, 3], 0.26, 0.05, 0.25)
        s.hit("hat", bar, [0.5, 1.5, 2.5, 3.5], 0.14, 0.3)
    mel = {3: [(0, 0.5, "D5"), (0.5, 0.5, "G5"), (1, 1, "B5"), (2, 0.5, "A5"), (2.5, 0.5, "G5"), (3, 1, "D5")],
           4: [(0, 1, "E5"), (1, 0.5, "G5"), (1.5, 0.5, "B5"), (2, 2, "B5")],
           5: [(0, 0.5, "C6"), (0.5, 0.5, "B5"), (1, 1, "G5"), (2, 1, "E5"), (3, 1, "G5")],
           6: [(0, 1.5, "A5"), (1.5, 0.5, "B5"), (2, 0.5, "A5"), (2.5, 0.5, "F#5"), (3, 1, "D5")],
           7: [(0, 0.5, "D5"), (0.5, 0.5, "G5"), (1, 1, "B5"), (2, 0.5, "D6"), (2.5, 0.5, "B5"), (3, 1, "G5")],
           8: [(0, 1, "G5"), (1, 1, "B5"), (2, 1, "E6"), (3, 1, "D6")],
           9: [(0, 1.5, "E6"), (1.5, 0.5, "D6"), (2, 1, "C6"), (3, 1, "G5")],
           10: [(0, 1, "F#5"), (1, 1, "A5"), (2, 2, "D6")],
           11: [(0, 0.5, "C6"), (0.5, 0.5, "A5"), (1, 0.5, "E5"), (1.5, 0.5, "A5"), (2, 1, "C6"), (3, 1, "E6")],
           12: [(0, 1, "D6"), (1, 0.5, "C6"), (1.5, 0.5, "A5"), (2, 0.5, "F#5"), (2.5, 0.5, "A5"), (3, 1, "D6")]}
    for bar, it in mel.items():
        s.line("bell", bar, it, 0.3, 0.15, 0.3, 0.3)
        s.line("pulse", bar, it, 0.1, -0.2, 0.1, 0.2, -12)
    s.hit("crash", 7, [0], 0.18); s.hit("ohat", 12, [3.5], 0.12, 0.3)
    return s, dict(delay_beats=0.75, fb=0.28, rt60=1.4, rev_mix=0.22, dly_mix=0.16)


TRACKS = [
    (7, "certified", "certified", certified, "The ship: the dummy set down, CERTIFIED. D major pentatonic, 76 BPM. A ship's horn, plucked strings, bells, a gong at the climax"),
    (8, "licensed", "licensed", licensed, "A run licensed. C major, 124 BPM. A chip lead over an arpeggio, four on the floor"),
    (9, "failed-test", "failed test", failed, "A run failed. A minor, 66 BPM. A wobbling pad, a slow triangle line, plucked chords, a heartbeat"),
    (10, "non-compliant", "non-compliant", noncompliant, "A refusal. E minor with its flat second, 100 BPM. Hold music: off-beat electric piano, a cold chime, a pulsing bass"),
    (11, "tile-cleared", "tile cleared", cleared, "A Story tile cleared, until the next card. G major, 132 BPM. A jingle (a rising arpeggio, a snare roll, a ta-da), then a bouncing loop that climbs back into it"),
]


def write_wav(path, y):
    pcm = (np.clip(y.T, -1, 1) * 32767).astype("<i2")
    with wave.open(str(path), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(RATE)
        w.writeframes(pcm.tobytes())


def main(only=None):
    (OUT / "mp3").mkdir(parents=True, exist_ok=True)
    keep = [e for e in json.loads(INDEX.read_text(encoding="utf-8"))["tracks"] if e["track"] not in only] if only and INDEX.exists() else []
    index = []
    for f in list(OUT.glob("track*_dummies-generated_*.ogg")) + list((OUT / "mp3").glob("track*_dummies-generated_*.mp3")):
        if not only or int(f.name[5:].split("_")[0]) in only:
            f.unlink()
    with tempfile.TemporaryDirectory() as tmp:
        for n, slug, title, fn, what in TRACKS:
            if only and n not in only:
                continue
            sc, fx = fn()
            y = render(sc, **fx)
            stem = f"track{n}_dummies-generated_{slug}"
            wav = Path(tmp) / (stem + ".wav")
            write_wav(wav, y)
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "libvorbis", "-q:a", "5", str(OUT / (stem + ".ogg"))], check=True)
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(wav), "-c:a", "libmp3lame", "-b:a", "160k", str(OUT / "mp3" / (stem + ".mp3"))], check=True)
            secs = y.shape[1] / RATE
            index.append({"track": n, "file": f"music/{stem}.ogg", "mp3": f"music/mp3/{stem}.mp3", "title": title, "bpm": sc.bpm, "bars": sc.bars,
                          "seconds": round(secs, 3), "events": len(sc.ev), "what": what})
            print(f"Track {n} · {title}: {sc.bars} bars at {sc.bpm} BPM, {secs:.1f} s, {len(sc.ev)} notes and hits")
    index = sorted(keep + index, key=lambda e: e["track"])
    INDEX.write_text(json.dumps({"generated_by": "audio/music_gen.py", "folder": "prototypes/p9/audio/music/", "tracks": index}, indent=1) + "\n", encoding="utf-8")


if __name__ == "__main__":
    import sys
    main({int(a) for a in sys.argv[1:]} or None)
