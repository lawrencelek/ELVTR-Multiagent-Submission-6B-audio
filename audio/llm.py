"""One agent call = one fresh headless Claude Code session: its own system prompt, no tools, no shared memory.

Same pattern as Assignments 3–6 (style/llm.py in the source repo). Needs `claude` on the PATH, signed in. No API key here.
Every input and output is saved in the run folder. AUDIO_REPLAY=<run folder> reuses that run's saved outputs by label
(no model calls), so a run can be re-checked exactly.
"""
import json
import os
import shutil
import subprocess
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CLAUDE = shutil.which("claude") or "claude"
TIMEOUT_S = 1500
MODELS = {"designer": os.environ.get("AUDIO_DESIGN_MODEL", "opus"),
          "reviewer": os.environ.get("AUDIO_REVIEW_MODEL", "opus"),
          "refiner": os.environ.get("AUDIO_REFINE_MODEL", "opus")}


def system_prompt(role):
    """The role's prompt; the reviewer and the refiner also get the whole sound guide, so the guide has one source."""
    text = (ROOT / "agents" / f"{role}.md").read_text(encoding="utf-8")
    if role in ("reviewer", "refiner"):
        text += "\n\n---\n\n" + (ROOT / "SOUND_GUIDE.md").read_text(encoding="utf-8")
    return text


class Run:
    def __init__(self, folder):
        self.dir = Path(folder)
        self.dir.mkdir(parents=True, exist_ok=True)
        self.calls = []

    def save(self, name, text):
        (self.dir / name).write_text(text if isinstance(text, str) else json.dumps(text, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")


def call(run, role, message, label):
    run.save(f"{label}_input.md", message)
    replay = os.environ.get("AUDIO_REPLAY")
    if replay:
        p = Path(replay) / f"{label}_output_raw.txt"
        if p.exists():
            text = p.read_text(encoding="utf-8")
            run.save(f"{label}_output_raw.txt", text)
            run.calls.append({"label": label, "role": role, "replayed": True})
            return text
    cmd = [CLAUDE, "-p", "--system-prompt", system_prompt(role), "--tools", "", "--output-format", "json",
           "--no-session-persistence", "--model", MODELS[role]]
    t0 = time.time()
    for attempt in (1, 2):
        proc = subprocess.run(cmd, input=message, capture_output=True, text=True, encoding="utf-8", timeout=TIMEOUT_S, cwd=str(run.dir))
        if proc.returncode == 0:
            break
        if attempt == 2:
            raise RuntimeError(f"{role} call failed (exit {proc.returncode}): {(proc.stderr or proc.stdout)[-800:]}")
        time.sleep(5)
    env = json.loads(proc.stdout)
    if env.get("is_error"):
        raise RuntimeError(f"{role} returned an error: {str(env.get('result'))[:800]}")
    text = env.get("result") or ""
    usage = env.get("usage") or {}
    run.calls.append({"label": label, "role": role, "seconds": round(time.time() - t0, 1), "output_tokens": usage.get("output_tokens"),
                      "models": sorted((env.get("modelUsage") or {}).keys()), "cost_usd": env.get("total_cost_usd")})
    run.save(f"{label}_output_raw.txt", text)
    return text


def parse_json(text):
    """The first JSON object in a reply (fences tolerated)."""
    t = text.strip()
    if t.startswith("```"):
        t = t.split("\n", 1)[1] if "\n" in t else t
        t = t.rsplit("```", 1)[0]
    a, b = t.find("{"), t.rfind("}")
    if a < 0 or b < 0:
        raise ValueError("no JSON object in the reply")
    return json.loads(t[a:b + 1])
