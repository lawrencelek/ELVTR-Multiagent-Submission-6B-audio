"""The Text Lab and the review list: the inventory (content/text/inventory.json) with the proposed lines (text/drafts/*.json, then
text/fixes.json from the review) merged into content/text/review.json; the approval page prototypes/p9/text_lab.html (and its
artifact fragment); and the full list as Markdown, content/text/REVIEW.md.

    python3 text/make_text_lab.py
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "text"))
import lint  # noqa: E402

INV = json.loads((ROOT / "content" / "text" / "inventory.json").read_text(encoding="utf-8"))
HERE = ROOT / "prototypes" / "p9"
GUIDE = {
    "title": "Proposed: Style Guide V2.10, a dry corporate snark",
    "rules": [
        {"id": "T1", "text": "Dummy Corporation: deadpan and inspirational, with a dry corporate snark. The trainee is an asset under review: a flat, procedural put-down, then the instruction. No cheer, no \"!\", no wink, no insult to the body's pain (T4 holds)."},
        {"id": "T15", "text": "Feedback (a miss, a denial, a held chassis, NOT COUNTED): a put-down of at most three words, then what to do, in the imperative. At most 60 characters, to fit the strip."},
        {"id": "T16", "text": "Status lines (COUNTED, TILE CLEARED, combo tallies, drone captions) stay crisp. Praise is withheld, not given. At most one put-down in three."},
        {"id": "Cars", "text": "Unchanged. Their tier voices already carry the snark (T6 to T12)."},
    ],
    "note": "Your example set the direction: \"Try harder - bait a car to divert and get hit.\" V2.9 (T1) counted sarcasm as a fault; V2.10 lets the Corporation be dry. Approve it and the new lines follow it; keep V2.9 and they are judged by the old rule.",
}


def load_drafts():
    out = {}
    for f in sorted((ROOT / "text" / "drafts").glob("*.json")):
        out.update(json.loads(f.read_text(encoding="utf-8")))
    fx = ROOT / "text" / "fixes.json"
    if fx.exists():
        for k, v in json.loads(fx.read_text(encoding="utf-8")).items():
            out[k] = dict(out.get(k, {}), **v)
    return out


def main():
    drafts = load_drafts()
    items = []
    for it in INV["items"]:
        d = drafts.get(it["id"], {})
        after = d.get("after", it["text"]) if not it["locked"] else it["text"]
        x = dict(it, after=after, why=d.get("why", "kept: interface chrome, out of the voice's scope (decision 540)" if it["kind"] == "chrome" else "kept"),
                 findings=lint.check(it["id"], after) if not it["locked"] else [])
        items.append(x)
    ch = [i for i in items if i["after"] != i["text"]]
    review = {"generated_by": "text/make_text_lab.py", "count": len(items), "changed": len(ch), "guide": GUIDE, "fill": lint.FILL, "items": items}
    (ROOT / "content" / "text" / "review.json").write_text(json.dumps(review, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    # the page
    data = dict(review)
    data["items"] = [{k: v for k, v in i.items() if k in ("id", "group", "speaker", "kind", "text", "after", "why", "trigger", "placeholders", "limit", "locked", "style", "tier", "voice", "event", "tile", "label", "shot")} for i in items]
    src = (HERE / "text_lab.src.html").read_text(encoding="utf-8")
    frag = src.replace("/*__TEXT_DATA__*/", "window.TEXT_REVIEW = " + json.dumps(data, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/") + ";")
    (HERE / "text_lab.fragment.html").write_text(frag, encoding="utf-8")
    head, body = frag.split("</style>\n", 1)
    full = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            + head + "</style>\n</head>\n<body>\n" + body + "</body>\n</html>\n")
    (HERE / "text_lab.html").write_text(full, encoding="utf-8")
    # the list
    L = ["# DUMMIES — every line the player reads, before and after (Prototype 9)", "",
         f"30 October 2026 · {len(items)} lines · {len(ch)} with a proposed change · for Lawrence's approval in the Text Lab (`prototypes/p9/text_lab.html`). "
         "Nothing is applied to the game until approved. Brief: `text/BRIEF.md`. Inventory: `text/inventory.py`. Lint: `text/lint.py`.", "",
         "## Proposed rule change: Style Guide V2.10", ""]
    L += [f"- **{r['id']}:** {r['text']}" for r in GUIDE["rules"]] + ["", GUIDE["note"], ""]
    groups = []
    for i in items:
        if i["group"] not in groups:
            groups.append(i["group"])
    esc = lambda s: str(s).replace("|", "\\|").replace("\n", " ")
    for g in groups:
        gi = [i for i in items if i["group"] == g]
        L += [f"## {g} ({len(gi)} lines, {sum(1 for i in gi if i['after'] != i['text'])} changed)", "", "| ID | Where | Before | After | Why |", "|---|---|---|---|---|"]
        for i in gi:
            same = i["after"] == i["text"]
            L.append(f"| `{i['id']}` | {esc(i['trigger'])} | {esc(i['text'])} | {'*unchanged*' if same else '**' + esc(i['after']) + '**'} | {esc(i['why'])}{' · your line (U1)' if i['locked'] else ''} |")
        L.append("")
    (ROOT / "content" / "text" / "REVIEW.md").write_text("\n".join(L) + "\n", encoding="utf-8")
    bad = [i for i in items if i["findings"]]
    print(f"review.json, REVIEW.md, text_lab.html ({(HERE / 'text_lab.html').stat().st_size:,} bytes): {len(items)} lines, {len(ch)} changed, {len(bad)} over a limit"
          + (": " + ", ".join(i["id"] for i in bad) if bad else ""))


if __name__ == "__main__":
    main()
