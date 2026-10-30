"""Deterministic evidence for the reviewer: what a script can measure in a cue map. It does not set the grade.

    findings = lint(cue_map, events, inventory)   # [{"event", "rule", "severity", "text"}]
"""
GAINS = ["ui", "move", "hit", "big", "reward", "story", "alert", "ambient"]
COOLDOWNS = ["ui", "action", "burst", "frame", "ambient", "once"]
SPECIFIC_COOLDOWNS = ["honk", "bark"]
MAX_DUR = {"ui": 0.35, "action": 0.8, "burst": 0.8, "frame": 0.8, "ambient": 0.8, "once": 2.5}
DECISIONS = ("cue", "silence", "synth", "base")


def ids(events):
    out = {}
    for e in events["events"]:
        out[e["id"]] = e
        for v in e["variants"]:
            out[v["id"]] = dict(e, id=v["id"], variantOf=e["id"], label=v["label"])
    return out


def spelled(m, inv):
    """The designer's other spellings, read as the integrator reads them: a track by its file name, a class by its full
    registry ID. Run 20261030-012347's reviewer showed lint flagging these as errors when they were not."""
    import copy
    m = copy.deepcopy(m)
    mus = {f["file"].split("/", 1)[1]: f["track"] for f in inv["files"] if f["folder"] == "music"}
    mus.update({f["name"]: f["track"] for f in inv["files"] if f["folder"] == "music"})
    mus.update({f["original"]: f["track"] for f in inv["files"] if f["folder"] == "music" and f.get("original")})
    mu = m.get("music") or {}
    if mu:
        mu["states"] = {k: mus.get(v, v) if isinstance(v, str) else v for k, v in (mu.get("states") or {}).items()}
        mu["rotation"] = [mus.get(v, v) if isinstance(v, str) else v for v in mu.get("rotation") or []]
    for x in m.get("sfx", []):
        for k, pre in (("cooldown", "audio.sfx.cooldown."), ("gain", "audio.sfx.gain.")):
            if isinstance(x.get(k), str) and x[k].startswith(pre):
                x[k] = x[k][len(pre):]
    return m


def lint(m, events, inv):
    m = spelled(m, inv)
    F = []
    add = lambda ev, rule, sev, text: F.append({"event": ev, "rule": rule, "severity": sev, "text": text})
    cat, files = ids(events), {f["file"].split("/", 1)[1]: f for f in inv["files"] if f["folder"] in ("sfx", "tones")}
    seen = {}
    for x in m.get("sfx", []):
        seen.setdefault(x.get("event"), []).append(x)
    for eid in cat:
        if eid not in seen:
            add(eid, "C1", "blocking", "no entry")
        elif len(seen[eid]) > 1:
            add(eid, "C1", "blocking", f"{len(seen[eid])} entries")
    for eid in seen:
        if eid not in cat:
            add(eid, "C1", "blocking", "entry for an event the catalogue does not have")
    primary = {}
    for x in m.get("sfx", []):
        eid, d = x.get("event"), x.get("decision")
        e = cat.get(eid)
        if not e:
            continue
        if d not in DECISIONS:
            add(eid, "C1", "blocking", f"decision '{d}' is not one of {DECISIONS}")
            continue
        if d == "base" and not e.get("variantOf"):
            add(eid, "C1", "blocking", "'base' is for variants only")
        if d in ("silence", "synth") and len((x.get("why") or "").split()) < 3:
            add(eid, "C3", "minor", f"{d} with no stated reason")
        if e["priority"] == "high" and d != "cue" and not e.get("variantOf"):
            add(eid, "C2", "major", f"high-priority event set to {d}")
        if d != "cue":
            continue
        fl = x.get("files") or []
        if not fl:
            add(eid, "C1", "blocking", "cue with no files")
        for f in fl + (x.get("alternates") or []):
            if f not in files:
                add(eid, "L1", "blocking", f"'{f}' is not in the inventory")
            elif files[f].get("level") is None or not files[f].get("credit"):
                add(eid, "L1", "blocking", f"'{f}' has no measured level or credit")
        for f in fl:
            if f in files and files[f]["duration"] > MAX_DUR[e["freq"] if x.get("bus") != "ui" else "ui"] + 1e-9:
                add(eid, "F2", "major", f"'{f}' runs {files[f]['duration']:.2f} s; a {e['freq']}{' UI' if x.get('bus') == 'ui' else ''} event allows {MAX_DUR[e['freq'] if x.get('bus') != 'ui' else 'ui']} s")
        if x.get("bus") not in ("sfx", "ui"):
            add(eid, "C1", "blocking", f"bus '{x.get('bus')}'")
        if x.get("gain") not in GAINS:
            add(eid, "L2", "minor", f"gain class '{x.get('gain')}' is not one of {GAINS}")
        cd = x.get("cooldown")
        if cd not in COOLDOWNS and cd not in SPECIFIC_COOLDOWNS:
            add(eid, "S1", "blocking", f"cooldown '{cd}' is not a class or a specific ID")
        if e["freq"] in ("frame", "ambient") and cd in ("ui", "action", "once"):
            add(eid, "S1", "blocking", f"a {e['freq']} event on cooldown '{cd}'")
        if e["freq"] in ("burst", "frame") and len(fl) < 2 and "pitch" not in (x.get("why") or "").lower() and x.get("bus") != "ui":
            add(eid, "S2", "major", "a repeating event with one file and no stated variation")
        alts = x.get("alternates") or []
        if len(alts) < 2:
            add(eid, "A1", "minor", f"{len(alts)} alternates")
        if set(alts) & set(fl):
            add(eid, "A1", "minor", "an alternate equals a primary file")
        if e["group"] == "ui" and x.get("gain") != "ui":
            add(eid, "L2", "minor", "a menu cue not in gain class 'ui'")
        if e["freq"] == "ambient" and x.get("gain") != "ambient":
            add(eid, "L2", "minor", "ambient chatter not in gain class 'ambient'")
        for f in fl:
            primary.setdefault(f, []).append(eid)
    for f, evs in primary.items():
        for a in evs:
            for b in evs:
                if a < b and cat[a].get("variantOf", a) != cat[b].get("variantOf", b):
                    ba, bb = cat[a].get("variantOf", a), cat[b].get("variantOf", b)
                    if bb in cat[ba]["firesWith"] or ba in cat[bb]["firesWith"]:
                        add(a, "X1", "major", f"'{f}' is also primary for '{b}', which fires with it")
        if len(evs) > 3:
            add(evs[0], "X2", "minor", f"'{f}' is primary for {len(evs)} events: {', '.join(evs)}")
    mu = m.get("music") or {}
    st, rot = mu.get("states") or {}, mu.get("rotation") or []
    if st.get("intro") != 1:
        add("music.intro", "M1", "blocking", f"intro plays {st.get('intro')}, not Track 1")
    if st.get("menu") != 2:
        add("music.menu", "M1", "blocking", f"menus play {st.get('menu')}, not Track 2")
    if st.get("card") not in (2, "continue", "level"):  # "level": Lawrence's Q2 ruling (DECISIONS row 610), over the request's reading
        add("music.card", "M1", "blocking", f"the level card plays {st.get('card')}; the request runs Track 2 until just before the level starts")
    if sorted(rot) != [3, 4, 5, 6]:
        add("music.level", "M2", "major", f"rotation {rot} is not Tracks 3–6, each once")
    if mu.get("storyRule") not in ("tile", "card") or mu.get("arcadeRule") not in ("run", "level"):  # "card", "level": rows 611, 613
        add("music.level", "M2", "major", f"rules {mu.get('storyRule')}/{mu.get('arcadeRule')}")
    for k in ("pause", "credits", "licensed", "failed", "noncompliant", "finale", "certified"):  # the endings apart (row 619)
        if k not in st:
            add("music." + k, "M3", "minor", "no state")
    return F


def summary(F):
    by = {}
    for f in F:
        by[f["severity"]] = by.get(f["severity"], 0) + 1
    return ", ".join(f"{n} {s}" for s, n in sorted(by.items())) or "none"


def text(F):
    return "\n".join(f"- {f['event']} · {f['rule']} ({f['severity']}) {f['text']}" for f in F) or "- None."
