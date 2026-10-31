#!/usr/bin/env python3
"""Nightly: pull new "la palabra española del día" messages from WhatsApp Desktop's
local DB, have Claude turn them into study cards, append to public/words.json,
then voice every Spanish text the app speaks with ElevenLabs into public/audio/.

Usage: python3 sync.py [--push]
"""
import hashlib, json, re, sqlite3, subprocess, sys, time, unicodedata, urllib.request
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parent
WORDS = ROOT / "public" / "words.json"
DB = Path.home() / "Library/Group Containers/group.net.whatsapp.WhatsApp.shared/ChatStorage.sqlite"
CLAUDE = "/opt/homebrew/bin/claude"  # absolute: launchd has a bare PATH
APPLE_EPOCH = 978307200
AUDIO = ROOT / "public" / "audio"
NODE = "/opt/homebrew/bin/node"
VOICE = "MV203a6fgbW4G4K46Fbw"  # Adrián's cloned voice
MODEL = "eleven_v4"

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


def spoken(words):
    """Every text the app passes to speak(), keyed exactly as the app does."""
    cards = json.loads(subprocess.run(
        [NODE, "--input-type=module", "-e", "import c from './src/postcards.js'; console.log(JSON.stringify(c))"],
        cwd=ROOT, capture_output=True, text=True, check=True).stdout)
    texts = ["Adrián"]  # the mascot says his name when poked on the home screen
    for w in words:
        texts += [w["es"], *(e["es"] for e in w["examples"]), w["cloze"]["es"].replace("___", w["cloze"]["answer"])]
    for c in cards:
        texts += [*(e["es"] for e in c["examples"]), *(q["es"].replace("___", q["answer"]) for q in c["quiz"])]
    return list(dict.fromkeys(texts))


def forget(ids, key):
    """Delete the ElevenLabs history entries for what we just generated; the mp3s live in the repo."""
    left = []
    for hid in ids:
        req = urllib.request.Request(f"https://api.elevenlabs.io/v1/history/{hid}",
                                     headers={"xi-api-key": key}, method="DELETE")
        for attempt in range(3):  # a fresh entry takes a moment to show up in history
            try:
                urllib.request.urlopen(req, timeout=30).close()
                break
            except Exception as e:
                err = e
                time.sleep(2)
        else:
            left.append(hid)
    if left:  # harmless: they just stay visible in the History tab
        print(f"history: {len(left)} entr{'y' if len(left) == 1 else 'ies'} not deleted ({err})", file=sys.stderr)
    elif ids:
        print(f"history: deleted {len(ids)}")


def voice(data):
    """Generate the missing MP3s, map text -> file in words.json, drop files nothing uses. Returns how many it made."""
    key = subprocess.run(["security", "find-generic-password", "-s", "elevenlabs", "-w"],
                         capture_output=True, text=True, check=True).stdout.strip()
    AUDIO.mkdir(exist_ok=True)
    # voice and model are in the name, so changing either re-voices everything on the next run
    files = {t: f"audio/{hashlib.sha1(f'{VOICE}|{MODEL}|{t}'.encode()).hexdigest()[:16]}.mp3" for t in spoken(data["words"])}
    made, history = 0, []
    for t, f in files.items():
        if (ROOT / "public" / f).exists():
            continue
        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128",
            data=json.dumps({"text": t, "model_id": MODEL}).encode(),
            headers={"xi-api-key": key, "Content-Type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=60) as r:
                mp3, hid = r.read(), r.headers.get("history-item-id")
        except Exception as e:  # out of credits, offline...: the app falls back to the browser voice, retry next run
            print(f"audio: stopped at {t!r} ({e})", file=sys.stderr)
            break
        (ROOT / "public" / f).write_bytes(mp3)
        made += 1
        history += [hid] if hid else []
    forget(history, key)
    data["audio"] = {t: f for t, f in files.items() if (ROOT / "public" / f).exists()}
    WORDS.write_text(json.dumps(data, ensure_ascii=False, indent=1) + "\n")
    for old in set(AUDIO.glob("*.mp3")) - {ROOT / "public" / f for f in files.values()}:
        old.unlink()
    print(f"audio: {made} new, {len(data['audio'])}/{len(files)} voiced")
    return made


def main():
    data = json.loads(WORDS.read_text()) if WORDS.exists() else {"lastMsg": 0, "words": []}
    words = data["words"]
    msgs = new_messages(data["lastMsg"])
    print(f"{len(msgs)} new message(s)")
    for pk, ts, text in msgs:
        known = {norm(w["es"]) for w in words}
        day = datetime.fromtimestamp(ts + APPLE_EPOCH).date().isoformat()  # local date: the app compares against the local day
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

    try:
        made = voice(data)
    except Exception as e:  # no key, node missing...: still push the new words
        print(f"audio: skipped ({e})", file=sys.stderr)
        made = 0

    if "--push" in sys.argv and (msgs or made):
        git = lambda *a: subprocess.run(["git", "-C", str(ROOT), *a], check=False)
        git("add", "public/words.json", "public/audio")
        git("commit", "-m", f"words: sync {datetime.now():%Y-%m-%d}")
        # keepalive: if the Mac sleeps mid-push the dead connection drops in ~1 min instead of hanging forever
        git("-c", "core.sshCommand=ssh -o ServerAliveInterval=15 -o ServerAliveCountMax=4", "push")


if __name__ == "__main__":
    assert extract_json('Sure!\n```json\n[{"es": "hoy"}]\n```') == [{"es": "hoy"}]
    assert norm("La Palabra Española del DÍA") == "la palabra espanola del dia"
    main()
