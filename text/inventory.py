"""Every line Prototype 9 shows the player, in one list: content/text/inventory.json (the Text Lab and the review read it).

Sources, as Prototype 9 loads them (text/dump_js.js runs content.js and lore.js the way the page does):
  - Car barks: content/db/fleet.json, with prototypes/p8/lore.js's overrides.
  - Dummy Corporation's story: content/story/story_v2.json (tales, briefs, act lines, the ending).
  - Notices: lore.js (n01–n37), the district blurbs, Arcade's lines.
  - Interface copy: content.js (DUMMIES_CONTENT.interface.copy, places.levels), read by game.js's copy() and place().
  - Messages built in prototypes/p6/game.js: toasts, the objective strip, the report, the workshop, the map, pause, endings. Curated
    below (CURATED), each with its trigger and its code site; dynamic parts are {placeholders}.
Each item: id, group, speaker, text, trigger, source, placeholders, limits, locked (U1: the user's own lines), shot (a Sound Lab
screenshot of where it shows). Interface chrome (menu labels, control legends) is listed, out of the voice's scope (row 540).

    python3 text/inventory.py
"""
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "content" / "text" / "inventory.json"
JS = json.loads(subprocess.run(["node", str(ROOT / "text" / "dump_js.js")], capture_output=True, text=True, check=True).stdout)
STORY = json.loads((ROOT / "content" / "story" / "story_v2.json").read_text(encoding="utf-8"))
NOTICES = JS["lore"]["notices"]
COPY = JS["content"]["interface"]["copy"]
LEVELS = JS["content"]["places"]["levels"]
TIERS = {t["tier"]: t for t in JS["tiers"]}
LOCKED = {"story.tale.monument.A1", "story.brief.any", "notice.n03", "notice.n34"}  # U1 (Style Guide V2 §0): Lawrence's own lines

BARK_LIMIT = 48       # style.bark.maxChars (F1)
WORDS = 20            # style.v2.text.maxWords (F6)
TOAST_LIMIT = 60      # the objective strip holds about 60 characters on one line (measured on the 1280 × 760 frame)

PH = re.compile(r"\{[A-Za-z]+\}")


def item(id_, group, speaker, text, trigger, source, shot=None, kind="message", **kw):
    it = {"id": id_, "group": group, "speaker": speaker, "kind": kind, "text": text, "trigger": trigger, "source": source,
          "placeholders": sorted(set(PH.findall(text))), "shot": shot, "locked": id_ in LOCKED}
    it.update(kw)
    return it


def barks():
    out = []
    ev_where = {"impact": "the car hits the dummy", "writeoff": "the car writes the chassis off", "near-miss": "the car passes close",
                "miss": "a dash misses the car", "commit": "the car fixes its route around the dummy", "honk": "the car honks at the dummy",
                "upgrade-seen": "the car sees a new part on the chassis", "part-seen": "the car sees a damaged part", "learned": "the car's model learns a stop line",
                "interrupt": "the car's route is interrupted", "unstick": "the car unsticks itself", "touch-spent": "the dummy touches a car that already hit it",
                "knock": "the car knocks the dummy aside"}
    for b in JS["barks"]:
        w = b.get("when") or {}
        tier = w.get("tier")
        cond = ", ".join(f"{k} {'/'.join(v) if isinstance(v, list) else v}" for k, v in w.items() if k != "tier")
        trig = ev_where.get(b["event"], b["event"]) + (f" ({cond})" if cond else "")
        voice = TIERS[tier]["name"] + " · " + TIERS[tier]["voice"] if tier in TIERS else "Any tier: no single tier's signature (T8)"
        out.append(item(f"bark.{b['id']}", "Car barks", "Cars", b["text"], trig, "content/db/fleet.json" + (" + lore.js" if b["id"] in ("b013", "b034", "b041", "b052", "b058", "b061", "b062", "b081", "b083", "b110", "c024") else ""),
                        "play", kind="bark", event=b["event"], tier=tier, style=b.get("style"), voice=voice, limit={"chars": BARK_LIMIT, "sentences": 2}))
    return out


def story():
    out = []
    for d in STORY["districts"]:
        out.append(item(f"story.act.{d['id']}", "Story", "Dummy Corporation", d["intro"], f"{d['act']}: the act line, on the district's first card and the map",
                        "content/story/story_v2.json", "card", limit={"words": WORDS, "sentences": 2}))
        for t in d["order"]:
            tl = d["tiles"][t]
            out.append(item(f"story.tale.{d['id']}.{t}", "Story", "Dummy Corporation", tl["tale"], f"{d['name']} {t} · {tl['title']}: the tile card's tale",
                            "content/story/story_v2.json", "card", limit={"words": 20, "minWords": 15, "sentences": 2}, tile=f"{d['name']} {t}", task=tl["task"]["kind"]))
    for k, v in STORY["tasks"].items():
        out.append(item(f"story.brief.{k}", "Story", "Dummy Corporation", v["brief"], f"the brief '{k}': the level card, the map's tile panel",
                        "content/story/story_v2.json", "card", limit={"words": WORDS, "sentences": 2}, label=v["label"]))
    out.append(item("story.ending", "Story", "Dummy Corporation", STORY["ending"], "CERTIFIED: the ending at the ship", "content/story/story_v2.json", "certified",
                    limit={"words": WORDS, "sentences": 2}))
    return out


NOTICE_USE = {"n01": ("the intro screen's line (Arcade)", "intro"), "n02": ("the title line", "title"), "n03": ("the STORY card on the mode select", "title"),
              "n07": ("toast: a drone delivers a part", "drone"), "n08": ("toast: the ferry, with a part on board", "ferry"), "n09": ("toast: the ferry", "ferry"),
              "n10": ("the drone label, incoming", "drop"), "n11": ("toast: a tile's credit gift", "story"), "n12": ("the report: the next part's heading", "report"),
              "n13": ("the workshop: a part not yet issued", "workshop"), "n14": ("the workshop: a part not yet issued, with a nudge", "workshop"),
              "n15": ("toast: buying a part the drone brings", "workshop"), "n16": ("controls: a verb not yet fitted", "pause"),
              "n17": ("toast: a drone rescues the chassis from the river", "drone"), "n18": ("toast: a drone clears a cone", "drone"),
              "n19": ("toast: the chassis recovered from the river", "drone"), "n20": ("the ending: Licensed", "ending"), "n21": ("the ending: Failed test", "failed"),
              "n24": ("Monument: the district blurb", "arcade"), "n25": ("Parkland: the district blurb", "arcade"), "n26": ("Waterfront: the district blurb", "arcade"),
              "n28": ("the CBD blurb (district not in play)", None), "n29": ("the Campus blurb (district not in play)", None), "n30": ("the CBD intro (district not in play)", None),
              "n31": ("the Campus intro (district not in play)", None), "n34": ("the ARCADE card on the mode select", "title"),
              "n35": ("toast: Arcade's grade rises", "arcade"), "n36": ("the intro screen's line", "intro"), "n37": ("Arcade's district card", "card")}
LABELS = {"n04", "n05", "n06", "n22", "n23", "n27", "n32", "n33", "n12", "n10"}


def notices():
    out = []
    for k, v in NOTICES.items():
        use, shot = NOTICE_USE.get(k, ("a label", None))
        label = k in LABELS or (v.upper() == v and "·" in v and len(v.split()) < 8 and k not in ("n07", "n08", "n09", "n11", "n35"))
        out.append(item(f"notice.{k}", "Notices" if not label else "Labels", "Dummy Corporation", v, use, "prototypes/p8/lore.js", shot,
                        kind="label" if label else "message", limit={"words": WORDS, "sentences": 2}, inPlay=shot is not None or label))
    return out


def copy_items():
    out = []
    u = [("copy.toast.touch-spent", COPY["toast"]["touch-spent"], "toast: the dummy touches a car that already hit it", "play"),
         ("copy.toast.purchase", COPY["toast"]["purchase"], "toast: Arcade, a part bought", "workshop"),
         ("copy.toast.learn-standoff", COPY["toast"]["learn-standoff"], "toast: a car model learns to stop further back", "play"),
         ("copy.toast.refusal-locked", COPY["toast"]["refusal-locked"], "toast: Arcade, Refuse testing before one body", "pause"),
         ("copy.denied.lunge", COPY["denied"]["lunge"], "toast: a dash refused (no charge, or recovering)", "play"),
         ("copy.denied.pickup", COPY["denied"]["pickup"], "toast: nothing to grab", "cones"),
         ("copy.denied.drop", COPY["denied"]["drop"], "toast: no room to put a cone down", "cones"),
         ("copy.denied.throw", COPY["denied"]["throw"], "toast: no room to throw a cone", "cones"),
         ("copy.endings.Non-compliant", COPY["endings"]["Non-compliant"], "the ending: Non-compliant (a refusal)", "refused"),
         ("copy.report.title", COPY["report"]["title"], "the write-off report's title", "report"),
         ("copy.report.credit", COPY["report"]["credit"], "the report, Arcade: the credit for the body", "report"),
         ("copy.shop.deploy", COPY["shop"]["deploy"], "the workshop's last row", "workshop"),
         ("copy.shop.bank", COPY["shop"]["bank"], "the workshop's last row, credits left", "workshop"),
         ("place.levels.z1", LEVELS["z1"], "toast: first time on the low highway", "play"),
         ("place.levels.z2Highway", LEVELS["z2Highway"], "toast: first time on the high highway", "play"),
         ("place.levels.roof", LEVELS["roof"], "toast: first time on a roof", "play")]
    for id_, text, trig, shot in u:
        grp = "Endings and screens" if id_.startswith(("copy.endings", "copy.report", "copy.shop")) else "Feedback"
        out.append(item(id_, grp, "Dummy Corporation", text, trig, "prototypes/p6/content.js (" + id_.split(".", 1)[1] + ")", shot,
                        limit={"chars": TOAST_LIMIT} if grp == "Feedback" else {"words": WORDS, "sentences": 2}))
    return out


# Messages game.js builds. id, group, text ({placeholders} for its dynamic parts), trigger, code site, shot
CURATED = [
    # the brief: held, counted, not counted
    ("msg.held", "Feedback", "HELD AT {health} · the brief wants {brief}", "toast: a hit that would write off the chassis misses the brief; the chassis is held (row 620)", "game.js processEvents 'held'", "writeoff"),
    # the held chassis, one line per brief (Lawrence's example: "Try harder - bait a car to divert and get hit."). Before: the one generic line, filled
    ("msg.held.dash", "Feedback", "HELD AT 1 · the brief wants dash into a car", "toast: held, on a dash brief", "game.js 'held' (one line per brief: new)", "writeoff"),
    ("msg.held.drop", "Feedback", "HELD AT 1 · the brief wants drop onto a car", "toast: held, on a drop brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.jump", "Feedback", "HELD AT 1 · the brief wants jump into a car", "toast: held, on a jump brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.level", "Feedback", "HELD AT 1 · the brief wants on a raised road", "toast: held, on a raised-road brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.cone", "Feedback", "HELD AT 1 · the brief wants cone-baited car", "toast: held, on a cone brief (the line Lawrence quoted)", "game.js 'held' (new)", "writeoff"),
    ("msg.held.push", "Feedback", "HELD AT 1 · the brief wants push off a car", "toast: held, on a push brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.bounce", "Feedback", "HELD AT 1 · the brief wants thrown into a car", "toast: held, on a bounce brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.struck", "Feedback", "HELD AT 1 · the brief wants struck, not dashing", "toast: held, on a struck brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.combo", "Feedback", "HELD AT 1 · the brief wants combo ×{n}", "toast: held, on a combo brief", "game.js 'held' (new)", "writeoff"),
    ("msg.held.cls", "Feedback", "HELD AT 1 · the brief wants a {cls}", "toast: held, on a vehicle-class brief", "game.js 'held' (new)", "writeoff"),
    ("msg.story-count", "Feedback", "COUNTED · {tile} {n} / {need}", "toast: a write-off counts for the tile", "game.js 'story-count'", "story"),
    ("msg.story-miss.task", "Feedback", "NOT COUNTED · the brief wants {brief}", "toast: a write-off misses the brief", "game.js 'story-miss'", "writeoff"),
    ("msg.story-miss.cleared", "Feedback", "NOT COUNTED · {tile} is already cleared", "toast: a write-off on a cleared tile", "game.js 'story-miss'", "writeoff"),
    ("msg.story-miss.elsewhere", "Feedback", "NOT COUNTED · {tile} is not in test", "toast: a write-off on a tile not yet in test", "game.js 'story-miss'", "writeoff"),
    ("msg.story-clear", "Feedback", "TILE {tile} CLEARED · {next} OPEN", "toast: the tile's last write-off", "game.js 'story-clear'", "story"),
    ("msg.fence.unsurveyed", "Feedback", "Fence: {tile} is not yet surveyed", "toast: walking into a fence toward a tile not yet open", "game.js 'story-fence'", "map"),
    ("msg.fence.clear-first", "Feedback", "Fence: clear {tile} first ({n} / {need})", "toast: walking into the tile's fence before it is cleared", "game.js 'story-fence'", "map"),
    # moves
    ("msg.hop", "Feedback", "A hop clears nothing. Run, then jump.", "toast, once: a standing jump that clears nothing", "game.js 'jump'", "jump"),
    ("msg.rail", "Feedback", "Over the rail", "toast: a jump over a highway rail", "game.js 'rail-jump'", "jump"),
    ("msg.hitch", "Feedback", "Hitched. X lets go; A slings you off with a dash.", "toast, once: the dummy hitches onto a car", "game.js 'hitch'", "play"),
    ("msg.slip", "Feedback", "No dash on water. Step off the puddle.", "toast: a dash on a puddle", "game.js 'slip' (copy toast.slip)", "play"),
    ("msg.not-fitted", "Feedback", "Not fitted yet", "toast: Story, a verb whose part the drone has not brought", "game.js 'denied'", "play"),
    ("msg.deny.jump", "Feedback", "No jump — charge empty, or mid-action", "toast: a jump refused", "game.js DENY_TEXT.jump", "jump"),
    ("msg.deny.jump.charge", "Feedback", "No jump: the battery is empty", "toast: a jump refused, battery empty", "game.js DENY_TEXT", "jump"),
    ("msg.deny.push.spent", "Feedback", "No pushes left: land to get them back", "toast: a push refused, none left", "game.js DENY_TEXT", "play"),
    ("msg.deny.push.nothing", "Feedback", "Nothing to push off: hit or touch a car", "toast: a push with no car to push off", "game.js DENY_TEXT", "play"),
    ("msg.deny.drop.hold", "Feedback", "Hold X to put the cone down", "toast: tapping X with a cone where it cannot go down", "game.js DENY_TEXT", "cones"),
    ("msg.deny.throw.empty", "Feedback", "Grab a cone first (X), then throw (Y)", "toast: a throw with no cone", "game.js DENY_TEXT", "cones"),
    ("msg.cones", "Feedback", "Cones {n} / {capacity}", "toast: a cone picked up (more than one carried)", "game.js 'pickup'", "cones"),
    ("msg.combo", "Feedback", "COMBO {n} · {moves} · ×{mult} · +{bonus}", "toast: a hit chains a combo", "game.js 'combo'", "combo"),
    ("msg.combo-banked", "Feedback", "COMBO BANKED · {n} hits · ×{mult} · {points}", "toast: the combo's window closes", "game.js 'combo-end'", "combo"),
    ("msg.cone-hit", "Feedback", "CONE HIT · +{points}", "toast: a thrown cone hits a car", "game.js 'cone-hit'", "cones"),
    ("msg.screen", "Feedback", "{screen} · {landmark}", "toast, first visit: the screen's name", "game.js 'screen'", "play"),
    ("msg.purchase.upgrade", "Feedback", "{part} fitted · {n} upgrades left", "toast: Story, a part fitted in the workshop", "game.js 'purchase'", "workshop"),
    ("msg.purchase-denied.max", "Feedback", "That part is at its top level", "toast: buying a part at its top level", "game.js 'purchase-denied'", "workshop"),
    ("msg.level.walk", "Feedback", "Walkway: no traffic up here. Step off the side to drop onto cars below.", "toast, first time: a walkway", "game.js LEVEL6", "play"),
    ("msg.level.ring", "Feedback", "Ring deck: highway traffic gives way at the entries. Escalators lead down.", "toast, first time: the ring deck", "game.js LEVEL6", "play"),
    ("msg.level.terrace", "Feedback", "Terrace: step off the edge to drop to the beach.", "toast, first time: a terrace", "game.js LEVEL6", "play"),
    ("msg.level.hill", "Feedback", "Hilltop (Z1): streets with traffic. Step off the cliff edge to drop to the valley.", "toast, first time: the hilltop", "game.js LEVEL6", "play"),
    ("msg.volume", "Feedback", "Volume {n} / 10", "toast: − or + in play (row 608)", "game.js keydown", "play"),
    ("msg.mute", "Feedback", "Sound off · M", "toast: M in play (row 608)", "game.js keydown", "play"),
    # the objective strip
    ("obj.task", "Objective strip", "Write off a body. Last hit: {brief} ({n} of {need}).", "the objective strip on the tile in test", "game.js objective()", "play"),
    ("obj.any", "Objective strip", "Write off a body ({n} of {need}).", "the objective strip, brief 'any'", "game.js objective()", "play"),
    ("obj.drone.deliver", "Objective strip", "Delivering {part}.", "the strip while a drone delivers a part", "game.js objective()", "drone"),
    ("obj.drone.bring", "Objective strip", "Bringing {part}, then on to {tile}.", "the strip while a drone brings a part, then ferries", "game.js objective()", "ferry"),
    ("obj.drone.ferry", "Objective strip", "Carrying the chassis to {tile}.", "the strip on the ferry", "game.js objective()", "ferry"),
    ("obj.drone.voyage", "Objective strip", "Carrying the certified model to the ship at {tile}.", "the strip on the voyage", "game.js objective()", "plaque"),
    ("obj.cleared", "Objective strip", "{district} is cleared.", "the strip when the district is cleared", "game.js objective()", "play"),
    ("obj.arcade", "Objective strip", "Grade {g}: write off {n} bodies for grade {next} ({count} of {n}).", "the strip, Arcade", "game.js objective()", "arcade"),
    ("obj.arcade.top", "Objective strip", "Grade {g}, the top grade: write off all you can.", "the strip, Arcade at the top grade", "game.js objective()", "arcade"),
    # the report and the workshop
    ("rep.counted", "Endings and screens", "Counted for {tile}: {n} of {need} · points this body {points}", "the report: the write-off counted", "game.js drawReport", "report"),
    ("rep.task", "Endings and screens", "Not counted: the brief wants {brief} · points this body {points}", "the report: the write-off missed the brief", "game.js drawReport", "report"),
    ("rep.cleared", "Endings and screens", "Not counted: {tile} is already cleared · points this body {points}", "the report: a cleared tile", "game.js drawReport", "report"),
    ("rep.elsewhere", "Endings and screens", "Not counted: {tile} is not in test · points this body {points}", "the report: a tile not in test", "game.js drawReport", "report"),
    ("rep.credit", "Endings and screens", "+{n} credits for the body. Balance: {balance}. {part} is yours for {price}.", "the report, Story: the credit and the next affordable part", "game.js drawReport", "report"),
    ("rep.full", "Endings and screens", "+{n} credits for the body. Balance: {balance}. Every track is full.", "the report, Story: every part at its top", "game.js drawReport", "report"),
    ("rep.next", "Endings and screens", "{part} · {district} {tile} (tile {n} of {total}).", "the report: the next part the drone brings", "game.js drawReport", "report"),
    ("shop.keep", "Endings and screens", "Keep {n} upgrades for later, or fit them now.", "the workshop: upgrades left", "game.js drawShop", "workshop"),
    ("shop.ready", "Endings and screens", "Chassis {n} is ready.", "the workshop: nothing left to fit", "game.js drawShop", "workshop"),
    ("shop.top", "Endings and screens", "{part} is at its top level.", "the workshop: a part at its top", "game.js drawShop", "workshop"),
    # the map, the card, pause, endings, scores
    ("map.unsurveyed", "Endings and screens", "Clear the tiles before it. The map opens one tile at a time.", "the map: a tile not yet open", "game.js drawStoryMap", "map"),
    ("map.fences", "Endings and screens", "Fenced until cleared. Cleared tiles stay open.", "the map's footer", "game.js drawStoryMap", "map"),
    ("map.need", "Endings and screens", "One counted write-off clears the tile.", "the map's tile panel, after the brief", "game.js drawStoryMap", "map"),
    ("map.needN", "Endings and screens", "{n} counted write-offs clear the tile ({count} so far).", "the map's tile panel, after the brief", "game.js drawStoryMap", "map"),
    ("card.sub", "Endings and screens", "Tile {tile}. Level {n} of {total}.", "the level card's subtitle", "game.js drawLevelCard", "card"),
    ("pause.story", "Endings and screens", "The story map saves this tile's count. The body in play is lost.", "pause, Story: under Quit to title", "game.js drawPause", "pause"),
    ("pause.refuse-locked", "Endings and screens", "Refusal opens after one completed body.", "pause, Arcade: before one body", "game.js drawPause", "pause"),
    ("pause.refuse", "Endings and screens", "Refusal is a deliberate ending.", "pause, Arcade: Refuse testing", "game.js drawPause", "pause"),
    ("end.certified.fallback", "Endings and screens", "All {total} tiles of the Test City are tested and certified complete.", "the CERTIFIED ending, if the story has no ending line", "game.js drawEnding", "certified"),
    ("scores.none.arcade", "Endings and screens", "No scores yet. Play a shift in {district}.", "high scores: an empty Arcade table", "game.js drawScores", "scores"),
    ("scores.none.story", "Endings and screens", "No scores yet. A Certified story run sets the first.", "high scores: an empty Story table", "game.js drawScores", "scores"),
    ("saves.none", "Endings and screens", "No story saved here.", "save slots: an empty slot", "game.js drawSaves", "saves"),
    ("saves.rename", "Endings and screens", "Type to replace the name, or OK to keep it.", "naming a save", "game.js", "saves"),
    ("saves.full", "Endings and screens", "All {n} slots in use: choose one to overwrite", "toast: a new game with every slot full", "game.js", "saves"),
    ("saves.saved", "Feedback", "Saved: {name}", "toast: a save", "game.js", "saves"),
    ("saves.renamed", "Feedback", "Renamed: {name}", "toast: a rename", "game.js", "saves"),
    ("saves.erased", "Feedback", "Erased: {name}", "toast: a save erased", "game.js", "saves"),
]

# Interface chrome: menu items and control legends. Out of the voice's scope (decision 540); listed for completeness
CHROME = ["PRESS ANY KEY", "TAP TO BEGIN", "SELECT A MODE", "ARROWS CHOOSE · SPACE SELECT", "ARROWS CHOOSE · SPACE SELECT · SHIFT BACK",
          "ARROWS READ A TILE · SPACE DEPLOY · SHIFT BACK", "TYPE THE NAME · ENTER OK · BACKSPACE DELETE · ESC CANCEL", "SAVED IN THIS BROWSER",
          "STORY · SAVE GAMES", "STORY · THE TEST CITY", "ARCADE · SELECT A DISTRICT", "Quit to title", "Retry this district", "Choose a district",
          "Play again from district 1", "Name this score", "Resume", "Restart level", "Refuse testing", "Options", "Controls", "Show trace",
          "Deploy next chassis", "NEW PART FITTED", "EVERY PART FITTED", "CHOOSE A PART", "NOT YET ISSUED", "Has noticed you", "Route fixed", "Slowing",
          "Braking for safety", "Already hit you", "Blocked, warning you", "What you can see", "Out of a dash, the jump is free",
          "Tap: pick up a cone. Tap with none in reach: put one down", "Hold to put a cone down", "Up to 12 characters: letters, digits, space, - . '"]


def main():
    items = barks() + story() + notices() + copy_items()
    for id_, grp, text, trig, src, shot in CURATED:
        lim = {"chars": TOAST_LIMIT} if grp in ("Feedback", "Objective strip") else {"words": WORDS, "sentences": 2}
        items.append(item(id_, grp, "Dummy Corporation" if not id_.startswith(("saves.", "msg.volume", "msg.mute")) else "Interface", text, trig, "prototypes/p6/" + src, shot, limit=lim))
    for i, t in enumerate(CHROME, 1):
        items.append(item(f"ui.{i:02d}", "Interface chrome", "Interface", t, "menus, legends and the cue key", "prototypes/p6/game.js", None, kind="chrome", limit={}))
    # Story briefs carry their labels; labels are names, shown in caps
    for it in items:
        if it["id"].startswith("story.brief."):
            items.append(item("label." + it["id"].split(".", 2)[2], "Labels", "Dummy Corporation", it["label"], "the brief's label: the card, the map, the held toast", "content/story/story_v2.json", "card", kind="label", limit={"chars": 19}))
    seen = set()
    for it in items:
        assert it["id"] not in seen, it["id"]
        seen.add(it["id"])
    groups = {}
    for it in items:
        groups[it["group"]] = groups.get(it["group"], 0) + 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps({"generated_by": "text/inventory.py", "build": "prototypes/p9/dummies_p9.html", "count": len(items), "groups": groups, "items": items},
                              indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"{OUT.relative_to(ROOT)}: {len(items)} lines · " + ", ".join(f"{k} {v}" for k, v in groups.items()))


if __name__ == "__main__":
    main()
