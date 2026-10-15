#!/usr/bin/env python3
"""Nightly: pull new "la palabra española del día" messages from WhatsApp Desktop's
local DB, have Claude turn them into study cards, append to public/words.json.

Usage: python3 sync.py [--push]
"""
import json, re, sqlite3, subprocess, sys, unicodedata
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORDS = ROOT / "public" / "words.json"
DB = Path.home() / "Library/Group Containers/group.net.whatsapp.WhatsApp.shared/ChatStorage.sqlite"
CLAUDE = "/opt/homebrew/bin/claude"  # absolute: launchd has a bare PATH
APPLE_EPOCH = 978307200

PROMPT = """You help a native GERMAN speaker learn SPANISH FROM SPAIN (Castilian: vosotros, Spain vocabulary).
Below is a WhatsApp message in which their friend teaches them one or more "Spanish words of the day".
Extract every Spanish word/expression being taught and return ONLY a JSON array, no prose, no code fences.
Skip words already known: {known}

Each item:
{{"es": "word with article if noun, e.g. 'la semana'",
  "de": "German translation", "en": "English translation",
  "type": "noun|verb|adjective|adverb|expression|other",
  "tip": "one short, friendly tip in German (usage, false friend, mnemonic)",
  "examples": [{{"es": "simple everyday sentence using it", "de": "German translation"}}],  // exactly 3, A1-A2 level
  "cloze": {{"es": "a NEW sentence with the word replaced by ___", "answer": "exact text that fills ___", "de": "German translation of the full sentence"}},
  "distractors": ["3 plausible wrong Spanish answers for the cloze, same word type"]}}

Message:
<<<
{text}
>>>"""


def norm(s):
    """Lowercase, accent-free, for duplicate checks."""
    return unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode().strip()


def new_messages(after_id):
    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    rows = con.execute(
        "SELECT Z_PK, ZMESSAGEDATE, ZTEXT FROM ZWAMESSAGE WHERE ZISFROMME = 1 AND Z_PK > ? "
        "AND ZTEXT IS NOT NULL ORDER BY Z_PK", (after_id,)).fetchall()
    con.close()
    # ponytail: filter in Python so "día"/"dia" and any capitalisation both match
    return [r for r in rows if "palabra espanola del dia" in norm(r[2])]


def extract_json(out):
    return json.loads(out[out.index("["): out.rindex("]") + 1])


def ask_claude(text, known):
    r = subprocess.run([CLAUDE, "-p", PROMPT.format(text=text, known=", ".join(known) or "none")],
                       capture_output=True, text=True, timeout=300)
    if r.returncode:
        raise RuntimeError(f"claude exit {r.returncode}: {(r.stdout + r.stderr).strip()[:300]}")
    return extract_json(r.stdout)


def main():
    data = json.loads(WORDS.read_text()) if WORDS.exists() else {"lastMsg": 0, "words": []}
    words = data["words"]
    msgs = new_messages(data["lastMsg"])
    print(f"{len(msgs)} new message(s)")
    for pk, ts, text in msgs:
        known = {norm(w["es"]) for w in words}
        day = datetime.fromtimestamp(ts + APPLE_EPOCH, timezone.utc).date().isoformat()
        try:
            items = ask_claude(text, [w["es"] for w in words])
        except Exception as e:  # leave it for tomorrow's run; never write half-parsed data
            print(f"msg {pk}: skipped ({e})", file=sys.stderr)
            break
        for it in items:
            if norm(it["es"]) in known:
                continue
            words.append({"id": re.sub(r"[^a-z0-9]+", "-", norm(it["es"])).strip("-"),
                          **it, "added": day})
            print(f"  + {it['es']} — {it['de']}")
        data["lastMsg"] = pk  # saved after every message, so a crash mid-run loses nothing
        WORDS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")

    if "--push" in sys.argv and msgs:
        git = lambda *a: subprocess.run(["git", "-C", str(ROOT), *a], check=False)
        git("add", "public/words.json")
        git("commit", "-m", f"words: sync {datetime.now():%Y-%m-%d}")
        git("push")


if __name__ == "__main__":
    assert extract_json('Sure!\n```json\n[{"es": "hoy"}]\n```') == [{"es": "hoy"}]
    assert norm("La Palabra Española del DÍA") == "la palabra espanola del dia"
    main()
