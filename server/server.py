#!/usr/bin/env python3
"""Spanish Buddy API, on the Oracle VM next to Nibelung. Words come in (typed in the app by Angela or Adrián, or WhatsApp via
the Mac's send.py), Claude turns them into cards, one story is written a day, and Angela's progress is kept here so nothing
lives only on her phone.

    python3 server.py                  serve on 127.0.0.1:8788 (Caddy proxies https://spanish-buddy.<vm>.sslip.io/api/*)
    python3 server.py tick             hourly (systemd timer): retry waiting words, write today's story if missing
    python3 server.py import FILE.json [SUBS.txt]   one-off: the old public/words.json and push-subscriptions.txt

Env: SB_TOKEN (Angela's app: her progress and her words), SB_ADMIN_TOKEN (Adrián: his words, the Mac's send.py),
     SB_DB (default ./spanish-buddy.db), SB_PORT (8788), CLAUDE / NODE (default: found on PATH),
     VAPID_PRIVATE (web push; unset = no notifications), SB_ORIGINS (CORS, comma separated).
TZ should be Europe/Madrid: "today" for stories and words is her day, not UTC's.
"""
import fcntl, hmac, json, os, random, re, shutil, sqlite3, subprocess, sys, threading, time, unicodedata
from datetime import date
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
DB = os.environ.get("SB_DB", os.path.join(HERE, "spanish-buddy.db"))
TOKEN = os.environ.get("SB_TOKEN", "")
ADMIN = os.environ.get("SB_ADMIN_TOKEN", "")
PORT = int(os.environ.get("SB_PORT", "8788"))
CLAUDE = os.environ.get("CLAUDE") or shutil.which("claude") or os.path.expanduser("~/.local/bin/claude")
NODE = os.environ.get("NODE") or shutil.which("node") or "node"
VAPID_PRIVATE = os.environ.get("VAPID_PRIVATE", "")
VAPID_PUBLIC = "BJvxbb3jG83tIPDC6MRVbuTyoieXgScH6VezXfCxOD_3hDDc6cxM9hQ4CQdwwv-bNX9jHuqmENYP5l0_doDR9-Q"  # same as KEY in App.jsx
ORIGINS = set(os.environ.get("SB_ORIGINS", "https://acs176.github.io,http://localhost:5173").split(","))
TRIES = 3  # a message Claude fails on this many times is left as "failed" (see GET /api/inbox)

PROMPT = """You help a native GERMAN speaker learn SPANISH FROM SPAIN (Castilian: vosotros, Spain vocabulary).
Below is a message (a WhatsApp "palabra del día", or a short note typed into the app) in which their friend teaches them
one or more Spanish words. Extract every Spanish word/expression being taught and return ONLY a JSON array, no prose, no code fences.
Skip words already known: {known}

Each item:
{{"es": "word with article if noun, e.g. 'la semana'",
  "de": "German translation", "en": "English translation",
  "type": "noun|verb|adjective|adverb|expression|other",
  "topic": "exactly one of: tiempo (time, days, when) | comida (food, drink, eating out, kitchen tools) | lugares (places, directions, where) | casa (home, rooms, furniture) | hablar (conversation, phrases, opinions, communicating) | preguntas (question words) | pequenas (small grammar words: this, all, nothing, more, nobody...) | sentimientos (feelings, moods, affection, body states) | gente (people, family, friends) | viajar (travel, transport, nature) | ocio (free time, sport, climbing, hobbies) | compras (shopping, money, clothes)",
  "tip": "one short, friendly tip in German (usage, false friend, mnemonic)",
  "examples": [{{"es": "simple everyday sentence using it", "de": "German translation"}}],  // exactly 3, A1-A2 level
  "cloze": {{"es": "a NEW sentence with the word replaced by ___", "answer": "exact text that fills ___", "de": "German translation of the full sentence"}},
  "distractors": ["3 plausible wrong Spanish answers for the cloze, same word type"]}}

Message:
<<<
{text}
>>>"""

STORY = """You write a short daily reading story for a native GERMAN speaker learning SPANISH FROM SPAIN (Castilian: vosotros, Spain vocabulary).
Goal: she should finish it thinking "I understood almost all of that!", and learn a little on the way.
About her: she loves travelling around the world and climbing (bouldering, crags, mountains). Most stories should touch one of these:
a trip somewhere in the world, a climbing day, a hostel, a train, a summit, a café after climbing... Vary places and situations.
Recent story titles, don't repeat their topic: {titles}

Words she has learned: {known}

Rules:
- Natural, correct Spain Spanish, the way people really talk. 8 to 12 short sentences, present tense mostly, A1 level. A small scene with a gentle point or a smile at the end.
- Build it from the learned words above. Besides those, use ONLY very basic words: articles, pronouns, prepositions, numbers, colours,
  y/pero/porque/que/no/sí/muy, and the most common forms of ser, estar, tener, ir, hacer, querer, poder, gustar.
- Introduce EXACTLY 3 new words that are not on the list, each guessable from context. Don't reuse these recent new words: {recent}
- Use as many learned words as fit naturally, prefer the newest ones: {newest}

Return ONLY JSON, no prose, no code fences:
{{"title": "Spanish title", "de": "German title",
  "sentences": [{{"es": "one sentence", "de": "German translation"}}],
  "new": [{{"es": "the new word exactly as it appears in the text", "de": "German meaning"}}],
  "questions": [{{"es": "simple Spanish question about the story", "de": "German translation", "answer": "short Spanish answer", "options": ["answer + 2 wrong short Spanish answers"]}}]}}  // exactly 3 questions
"""

SCHEMA = """
-- content: written here, read by everyone (GET /api/data is public, like words.json on Pages was)
CREATE TABLE IF NOT EXISTS inbox (                -- every message that may teach words, before and after Claude
  id INTEGER PRIMARY KEY,
  text TEXT NOT NULL,
  day TEXT NOT NULL,                              -- local day it was sent: the word is the word of the day after
  source TEXT NOT NULL CHECK (source IN ('form', 'whatsapp')),
  msg_id INTEGER UNIQUE,                          -- WhatsApp's Z_PK: the Mac can send a message twice, it's kept once
  client_id TEXT UNIQUE,                          -- typed in the app (Angela or Adrián): made on the phone, so a resend is kept once
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'done', 'failed')),
  tries INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS words (                -- rowid order = the order they arrived
  id TEXT PRIMARY KEY,                            -- "la semana" -> "la-semana"
  es TEXT NOT NULL, de TEXT NOT NULL, en TEXT,
  type TEXT NOT NULL, topic TEXT, tip TEXT,
  added TEXT,                                     -- NULL for basic words: never a word of the day
  basic INTEGER NOT NULL DEFAULT 0 CHECK (basic IN (0, 1)),
  examples TEXT NOT NULL, cloze TEXT NOT NULL, distractors TEXT NOT NULL,   -- JSON, always read whole
  inbox_id INTEGER REFERENCES inbox(id));
CREATE TABLE IF NOT EXISTS stories (             -- one a day (the first day had three)
  id INTEGER PRIMARY KEY, day TEXT NOT NULL, title TEXT NOT NULL, de TEXT NOT NULL,
  sentences TEXT NOT NULL, new TEXT NOT NULL, questions TEXT NOT NULL,     -- JSON
  UNIQUE (day, title));
CREATE TABLE IF NOT EXISTS subscriptions (endpoint TEXT PRIMARY KEY, data TEXT NOT NULL, created INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);   -- audio (text -> mp3 on Pages), whatsapp_last

-- Angela's progress. Every row has "updated" (ms, the phone's clock): the newest write wins, so the phone can send
-- what it did offline in any order, or twice, and end up the same.
CREATE TABLE IF NOT EXISTS cards (                -- spaced repetition, srs.js; due: ms while learning, day number in review
  word_id TEXT NOT NULL REFERENCES words(id),
  dir TEXT NOT NULL CHECK (dir IN ('r', 'p')),    -- recognition "manana", production "manana:p"
  st TEXT NOT NULL CHECK (st IN ('learn', 'review')),
  step INTEGER, ivl REAL, ease REAL NOT NULL, due REAL NOT NULL,
  lapses INTEGER NOT NULL DEFAULT 0, seen INTEGER, last INTEGER,
  updated INTEGER NOT NULL,
  PRIMARY KEY (word_id, dir));
CREATE TABLE IF NOT EXISTS misses (               -- Üben: +2 per miss, -1 per right answer, see miss() in srs.js
  word_id TEXT PRIMARY KEY REFERENCES words(id),
  n INTEGER NOT NULL CHECK (n >= 0),
  updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS answers (              -- every answer, append-only: her history
  id TEXT PRIMARY KEY,                            -- made on the phone, so a resend is ignored
  at INTEGER NOT NULL,
  word_id TEXT NOT NULL REFERENCES words(id),
  mode TEXT NOT NULL CHECK (mode IN ('cards', 'practice')),
  dir TEXT CHECK (dir IN ('r', 'p')),             -- cards
  rating INTEGER CHECK (rating BETWEEN 1 AND 4),  -- cards: Nochmal, Schwer, Gut, Leicht
  kind TEXT,                                      -- practice: cloze, meaning, listen, write
  correct INTEGER CHECK (correct IN (0, 1)),      -- practice
  CHECK ((mode = 'cards' AND dir IS NOT NULL AND rating IS NOT NULL) OR (mode = 'practice' AND correct IS NOT NULL)));
CREATE INDEX IF NOT EXISTS answers_word ON answers (word_id, at);
CREATE TABLE IF NOT EXISTS verb_forms (           -- ¿Quién? petals, see paint() in verbs.js
  verb TEXT NOT NULL, person INTEGER NOT NULL CHECK (person BETWEEN 0 AND 5),
  n INTEGER NOT NULL, fired INTEGER NOT NULL, day INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  PRIMARY KEY (verb, person));
CREATE TABLE IF NOT EXISTS milestones (           -- azulejo patterns unveiled (Mosaic.jsx), by words learned
  words INTEGER PRIMARY KEY, unveiled_on TEXT NOT NULL, updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS seen (                 -- things opened once: postcards, possessive nouns, announcements
  kind TEXT NOT NULL CHECK (kind IN ('postcard', 'posesivo', 'welcome')),
  ref TEXT NOT NULL, updated INTEGER NOT NULL,
  PRIMARY KEY (kind, ref));
CREATE TABLE IF NOT EXISTS basics_new (           -- basic words she said she doesn't know yet: they join the deck
  word_id TEXT PRIMARY KEY REFERENCES words(id), updated INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS settings (             -- single values; mosaic = patterns shown, storySeen = newest story opened
  key TEXT PRIMARY KEY CHECK (key IN ('sound', 'music', 'verbsIntro', 'verbsMet', 'storySeen', 'mosaic')),
  value TEXT NOT NULL, updated INTEGER NOT NULL);
"""


def db():
    con = sqlite3.connect(DB, timeout=15)
    con.row_factory = sqlite3.Row
    con.execute("PRAGMA foreign_keys = ON")
    return con


def init():
    with db() as con:
        con.execute("PRAGMA journal_mode = WAL")  # the API reads while the timer writes
        if con.execute("SELECT 1 FROM sqlite_master WHERE name = 'inbox'").fetchone() and \
                "client_id" not in [r[1] for r in con.execute("PRAGMA table_info(inbox)")]:  # databases from before client_id
            con.execute("ALTER TABLE inbox ADD COLUMN client_id TEXT")
            con.execute("CREATE UNIQUE INDEX inbox_client_id ON inbox (client_id)")
        con.executescript(SCHEMA)


class busy:
    """One Claude pipeline at a time across processes (the API's worker and the hourly timer)."""
    def __enter__(self):
        self.f = open(DB + ".lock", "w")
        fcntl.flock(self.f, fcntl.LOCK_EX)
    def __exit__(self, *a):
        self.f.close()


def norm(s):
    """Lowercase, accent-free, for duplicate checks."""
    return unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode().strip()


def bare(s):
    return re.sub(r"^(el|la|los|las|un|una) ", "", norm(s))


def word_id(es):
    return re.sub(r"[^a-z0-9]+", "-", norm(es)).strip("-")


def ask(prompt, open_="[", close="]"):
    r = subprocess.run([CLAUDE, "-p", prompt], capture_output=True, text=True, timeout=300)
    if r.returncode:
        raise RuntimeError(f"claude exit {r.returncode}: {(r.stdout + r.stderr).strip()[:300]}")
    out = r.stdout
    return json.loads(out[out.index(open_): out.rindex(close) + 1])


def check_card(it):
    assert it.get("es") and it.get("de") and it.get("type"), "card without es/de/type"
    assert len(it.get("examples") or []) >= 1 and "___" in it["cloze"]["es"] and it["cloze"]["answer"], "card without examples/cloze"
    return it


# ---------- words ----------
HEADER = re.compile(r"^.*palabra espanola del dia.*$", re.M)


def already_known(text, known):
    """The whole message is one word she already has: no need to ask Claude ("la semana" sent by form and WhatsApp)."""
    t = HEADER.sub("", norm(text)).strip(" \n:.!-*")
    return bool(t) and "\n" not in t and len(t) <= 40 and bare(t) in {bare(k) for k in known}


def insert_word(con, it, added, inbox_id=None, basic=False):
    """Returns True if it went in (an id or spelling already there is skipped)."""
    have = {norm(r[0]) for r in con.execute("SELECT es FROM words")}
    if norm(it["es"]) in have:
        return False
    return con.execute(
        "INSERT INTO words (id, es, de, en, type, topic, tip, added, basic, examples, cloze, distractors, inbox_id) "
        "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
        (it.get("id") or word_id(it["es"]), it["es"], it["de"], it.get("en"), it["type"], it.get("topic"), it.get("tip"), added,
         int(basic), json.dumps(it.get("examples", []), ensure_ascii=False), json.dumps(it["cloze"], ensure_ascii=False),
         json.dumps(it.get("distractors", []), ensure_ascii=False), inbox_id)).rowcount == 1


def process_inbox():
    """Turn waiting messages into cards. Returns the new words (for the notification)."""
    new = []
    with busy():
        with db() as con:
            todo = con.execute("SELECT * FROM inbox WHERE status = 'new' ORDER BY id").fetchall()
        for m in todo:
            with db() as con:
                known = [r[0] for r in con.execute("SELECT es FROM words")]
            if already_known(m["text"], known):
                with db() as con:
                    con.execute("UPDATE inbox SET status = 'done', error = 'already known' WHERE id = ?", (m["id"],))
                continue
            try:
                items = [check_card(it) for it in ask(PROMPT.format(text=m["text"], known=", ".join(known) or "none"))]
            except Exception as e:  # bad JSON, Claude down...: tried again next hour, up to TRIES times
                with db() as con:
                    con.execute("UPDATE inbox SET tries = tries + 1, error = ?, status = CASE WHEN tries + 1 >= ? THEN 'failed' ELSE 'new' END "
                                "WHERE id = ?", (str(e)[:300], TRIES, m["id"]))
                print(f"inbox {m['id']}: {e}", file=sys.stderr)
                continue
            with db() as con:  # one transaction: all of the message's words, or none
                for it in items:
                    if insert_word(con, it, m["day"], m["id"]):
                        new.append(it)
                        print(f"  + {it['es']} — {it['de']}")
                con.execute("UPDATE inbox SET status = 'done', error = NULL WHERE id = ?", (m["id"],))
    if new:
        try:
            notify(new)
        except Exception as e:  # never lose words over a notification
            print(f"notify: skipped ({e})", file=sys.stderr)
    return new


def add_message(text, day, msg_id=None):
    text = text.strip()[:4000]
    if not text:
        return 400, {"error": "empty"}
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", day or ""):
        day = date.today().isoformat()
    with db() as con:
        cur = con.execute("INSERT INTO inbox (text, day, source, msg_id, created) VALUES (?, ?, ?, ?, ?) ON CONFLICT (msg_id) DO NOTHING",
                          (text, day, "whatsapp" if msg_id is not None else "form", msg_id, int(time.time())))
        if not cur.rowcount:
            return 200, {"duplicate": True}
        iid = cur.lastrowid
    threading.Thread(target=process_inbox, daemon=True).start()
    return 202, {"id": iid}


# ---------- stories ----------
def write_story(today=None):
    """Today's story, if there isn't one yet and there are words to build it from. Returns its title or None."""
    today = today or date.today().isoformat()
    with busy():
        with db() as con:
            if con.execute("SELECT 1 FROM stories WHERE day = ?", (today,)).fetchone():
                return None
            known = [r[0] for r in con.execute("SELECT es FROM words ORDER BY rowid")]
            recent = con.execute("SELECT title, new FROM stories ORDER BY day DESC, id DESC LIMIT 7").fetchall()
        if not known:
            return None
        st = ask(STORY.format(known=", ".join(known), newest=", ".join(known[-10:]),
                              recent=", ".join(n["es"] for r in recent[:3] for n in json.loads(r["new"])) or "none",
                              titles=", ".join(r["title"] for r in recent) or "none"), "{", "}")
        assert st["sentences"] and len(st["questions"]) == 3 and all(q["answer"] in q["options"] for q in st["questions"]), "bad story"
        for q in st["questions"]:
            random.shuffle(q["options"])
        with db() as con:
            save_story(con, {"day": today, **st})
    return st["title"]


def save_story(con, st):
    con.execute("INSERT INTO stories (day, title, de, sentences, new, questions) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT DO NOTHING",
                (st["day"], st["title"], st["de"], *(json.dumps(st[k], ensure_ascii=False) for k in ("sentences", "new", "questions"))))


# ---------- notifications ----------
PUSH_JS = """
import * as wp from 'web-push';
const [pub, priv, payload, ...subs] = process.argv.slice(1);
wp.setVapidDetails('https://github.com/Acs176/spanish-buddy', pub, priv);
for (const s of subs) await wp.sendNotification(JSON.parse(s), payload).then(
  () => console.log('sent'),
  e => console.log(e.statusCode === 404 || e.statusCode === 410 ? 'gone ' + JSON.parse(s).endpoint : 'failed ' + (e.statusCode ?? e.message)));
"""


def notify(new):
    """Web push "Morgen lernst du…": a word that arrives today is tomorrow's Wort des Tages."""
    with db() as con:
        subs = [r[0] for r in con.execute("SELECT data FROM subscriptions")]
    if not new or not subs or not VAPID_PRIVATE:
        return
    payload = json.dumps({"title": "Morgen lernst du…", "body": "\n".join(f"{w['es']} · {w['de']}" for w in new)}, ensure_ascii=False)
    out = subprocess.run([NODE, "--input-type=module", "-e", PUSH_JS, VAPID_PUBLIC, VAPID_PRIVATE, payload, *subs],
                         cwd=HERE, capture_output=True, text=True, timeout=60)
    gone = [l[5:] for l in out.stdout.splitlines() if l.startswith("gone ")]
    with db() as con:  # she turned them off or reinstalled: the app sends a fresh one when she turns them on again
        con.executemany("DELETE FROM subscriptions WHERE endpoint = ?", [(g,) for g in gone])
    print(f"notify: {out.stdout.strip()} {out.stderr.strip()}".strip())


# ---------- her progress: tables <-> the shapes the app keeps in localStorage ----------
NUM = (int, float)
SETS = {"read": "postcard", "posSeen": "posesivo", "seen": "welcome"}


def num(v, nullable=True):
    if v is None and nullable:
        return None
    if isinstance(v, bool) or not isinstance(v, NUM):
        raise ValueError(f"not a number: {v!r}")
    return v


def apply_op(con, op):
    """One change from the phone. Raises ValueError (or IntegrityError) for something that can never apply."""
    k, at = op.get("k"), num(op.get("at"), False)
    oid, v = op.get("id"), op.get("v")
    lww = lambda table, cols, keys: (  # insert, or overwrite only if this write is at least as new
        f"INSERT INTO {table} ({', '.join(cols)}, updated) VALUES ({', '.join('?' * len(cols))}, ?) "
        f"ON CONFLICT ({', '.join(keys)}) DO UPDATE SET {', '.join(f'{c} = excluded.{c}' for c in cols)}, updated = excluded.updated "
        f"WHERE excluded.updated >= {table}.updated")
    if k == "cards":
        w, p = (oid[:-2], "p") if oid.endswith(":p") else (oid, "r")
        if v.get("st") not in ("learn", "review"):
            raise ValueError("bad card")
        con.execute(lww("cards", ["word_id", "dir", "st", "step", "ivl", "ease", "due", "lapses", "seen", "last"], ["word_id", "dir"]),
                    (w, p, v["st"], num(v.get("step")), num(v.get("ivl")), num(v.get("ease"), False), num(v.get("due"), False),
                     num(v.get("lapses", 0), False), num(v.get("seen")), num(v.get("last")), at))
    elif k == "misses":
        con.execute(lww("misses", ["word_id", "n"], ["word_id"]), (str(oid), num(v, False), at))
    elif k == "verbs":
        verb, person = str(oid).rsplit(":", 1)
        con.execute(lww("verb_forms", ["verb", "person", "n", "fired", "day"], ["verb", "person"]),
                    (verb, int(person), num(v["n"], False), num(v.get("fired", 0), False), num(v["day"], False), at))
    elif k == "mosaicDates":
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", str(v)):
            raise ValueError("bad date")
        con.execute(lww("milestones", ["words", "unveiled_on"], ["words"]), (int(oid), v, at))
    elif k in SETS:
        con.execute("INSERT INTO seen (kind, ref, updated) VALUES (?, ?, ?) ON CONFLICT DO NOTHING", (SETS[k], str(oid), at))
    elif k == "basicsNew":
        con.execute("INSERT INTO basics_new (word_id, updated) VALUES (?, ?) ON CONFLICT DO NOTHING", (str(oid), at))
    elif k in ("sound", "music", "verbsIntro", "verbsMet", "storySeen", "mosaic"):
        con.execute(lww("settings", ["key", "value"], ["key"]), (k, str(v), at))
    elif k == "answer":
        mode = v.get("mode")
        con.execute("INSERT INTO answers (id, at, word_id, mode, dir, rating, kind, correct) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING",
                    (str(v["id"]), at, v["word"], mode, v.get("dir"), v.get("rating"), v.get("kind"),
                     None if v.get("correct") is None else int(bool(v["correct"]))))
    elif k == "word":  # a word typed in the app, maybe offline days ago: into the inbox, Claude does the rest
        text, day = str(v.get("text", "")).strip()[:4000], str(v.get("day", ""))
        if not text:
            raise ValueError("empty word")
        return con.execute("INSERT INTO inbox (text, day, source, client_id, created) VALUES (?, ?, 'form', ?, ?) ON CONFLICT DO NOTHING",
                           (text, day if re.fullmatch(r"\d{4}-\d{2}-\d{2}", day) else date.today().isoformat(), str(v["id"]), int(time.time()))).rowcount
    else:
        raise ValueError(f"unknown key {k!r}")


def progress(con):
    """Everything, in the app's localStorage shapes. empty: nothing was ever synced (the phone must upload, not download)."""
    clean = lambda r, skip: {k: r[k] for k in r.keys() if k not in skip and r[k] is not None}
    p = {
        "cards": {r["word_id"] + (":p" if r["dir"] == "p" else ""): clean(r, ("word_id", "dir", "updated"))
                  for r in con.execute("SELECT * FROM cards")},
        "misses": {r["word_id"]: r["n"] for r in con.execute("SELECT word_id, n FROM misses")},
        "verbs": {f"{r['verb']}:{r['person']}": {"n": r["n"], "day": r["day"], "fired": r["fired"]} for r in con.execute("SELECT * FROM verb_forms")},
        "mosaicDates": {str(r["words"]): r["unveiled_on"] for r in con.execute("SELECT * FROM milestones")},
        "basicsNew": [r[0] for r in con.execute("SELECT word_id FROM basics_new ORDER BY updated, rowid")],
        **{k: [r[0] for r in con.execute("SELECT ref FROM seen WHERE kind = ? ORDER BY updated, rowid", (kind,))] for k, kind in SETS.items()},
        **{r["key"]: r["value"] for r in con.execute("SELECT key, value FROM settings")},
    }
    p["empty"] = not any(p[k] for k in p)
    return p


def content(con):
    words = []
    for r in con.execute("SELECT * FROM words ORDER BY rowid"):
        w = {k: r[k] for k in ("id", "es", "de", "en", "type", "topic", "tip", "added") if r[k] is not None}
        w.update(examples=json.loads(r["examples"]), cloze=json.loads(r["cloze"]), distractors=json.loads(r["distractors"]))
        if r["basic"]:
            w["basic"] = True
        words.append(w)
    stories = [{"day": r["day"], "title": r["title"], "de": r["de"], **{k: json.loads(r[k]) for k in ("sentences", "new", "questions")}}
               for r in con.execute("SELECT * FROM stories ORDER BY day, id")]
    audio = con.execute("SELECT value FROM meta WHERE key = 'audio'").fetchone()
    return {"words": words, "stories": stories, "audio": json.loads(audio[0]) if audio else {}}


# ---------- HTTP ----------
class Handler(BaseHTTPRequestHandler):
    def cors(self):
        o = self.headers.get("Origin")
        if o in ORIGINS:
            self.send_header("Access-Control-Allow-Origin", o)
            self.send_header("Vary", "Origin")

    def send(self, code, body):
        data = json.dumps(body, ensure_ascii=False).encode()
        self.send_response(code)
        self.cors()
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def body(self):
        n = int(self.headers.get("Content-Length") or 0)
        if n > 2_000_000:  # a long offline stretch is a few hundred KB of changes at most
            raise ValueError("too large")
        b = json.loads(self.rfile.read(n) or b"{}")
        if not isinstance(b, dict):
            raise ValueError("expected an object")
        return b

    def role(self):
        auth = self.headers.get("Authorization", "").encode()
        if TOKEN and hmac.compare_digest(auth, f"Bearer {TOKEN}".encode()):
            return "learner"
        if ADMIN and hmac.compare_digest(auth, f"Bearer {ADMIN}".encode()):
            return "admin"
        return None

    def do_OPTIONS(self):
        self.send_response(204)
        self.cors()
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Authorization, Content-Type")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def route(self, method):
        path = self.path.split("?")[0].rstrip("/")
        try:
            if method == "GET" and path == "/api/data":  # public: the same words and stories Pages served as words.json
                with db() as con:
                    return self.send(200, content(con))
            role = self.role()
            if not role:
                return self.send(401, {"error": "Falscher Code."})
            if method == "GET" and path == "/api/whoami":
                return self.send(200, {"role": role})
            if method == "POST" and path == "/api/sync":  # Angela: her progress and her words. Adrián: only words.
                ops = self.body().get("ops")
                if not isinstance(ops, list):
                    return self.send(400, {"error": "ops must be a list"})
                rejected, words = [], 0
                with db() as con:
                    for i, op in enumerate(ops):
                        try:
                            con.execute("SAVEPOINT op")
                            if role == "admin" and op.get("k") != "word":
                                raise ValueError("progress is Angela's: not synced from Adrián's code")
                            words += apply_op(con, op) or 0  # only a new word returns 1
                            con.execute("RELEASE op")
                        except (ValueError, KeyError, TypeError, AttributeError, sqlite3.IntegrityError) as e:
                            # can never apply (unknown word, bad shape, a CHECK): drop it, or it would block the queue forever
                            con.execute("ROLLBACK TO op")
                            con.execute("RELEASE op")
                            rejected.append({"i": i, "error": str(e)[:200]})
                if rejected:
                    print(f"sync: rejected {rejected[:5]}", file=sys.stderr)
                if words:
                    threading.Thread(target=process_inbox, daemon=True).start()
                return self.send(200, {"applied": len(ops) - len(rejected), "rejected": rejected})
            if method == "GET" and path == "/api/inbox":  # the words typed in the app, and how far Claude got; Adrián also sees WhatsApp's
                with db() as con:
                    rows = con.execute("SELECT i.id, i.client_id, i.text, i.day, i.source, i.status, i.error, "
                                       "(SELECT group_concat(es, ', ') FROM words WHERE inbox_id = i.id) AS words FROM inbox i "
                                       + ("" if role == "admin" else "WHERE i.client_id IS NOT NULL ") + "ORDER BY i.id DESC LIMIT 20").fetchall()
                return self.send(200, {"items": [dict(r) for r in rows]})
            if role == "learner":
                if method == "GET" and path == "/api/progress":
                    with db() as con:
                        return self.send(200, progress(con))
                if method == "POST" and path == "/api/subscriptions":
                    sub = self.body()
                    if not str(sub.get("endpoint", "")).startswith("https://"):
                        return self.send(400, {"error": "not a push subscription"})
                    with db() as con:
                        con.execute("INSERT OR REPLACE INTO subscriptions (endpoint, data, created) VALUES (?, ?, ?)",
                                    (sub["endpoint"], json.dumps(sub), int(time.time())))
                    return self.send(200, {"ok": True})
            if role == "admin":
                if method == "POST" and path == "/api/words":
                    b = self.body()
                    msg_id = b.get("msg_id")
                    if msg_id is not None and (isinstance(msg_id, bool) or not isinstance(msg_id, int)):
                        return self.send(400, {"error": "msg_id must be an integer"})
                    return self.send(*add_message(str(b.get("text", "")), str(b.get("day", "")), msg_id))
                if method == "GET" and path == "/api/whatsapp/last":  # the Mac's send.py: newest message already here
                    with db() as con:
                        last = max(con.execute("SELECT coalesce(max(msg_id), 0) FROM inbox").fetchone()[0],
                                   int((con.execute("SELECT value FROM meta WHERE key = 'whatsapp_last'").fetchone() or [0])[0]))
                    return self.send(200, {"last": last})
            return self.send(404, {"error": "not found"})
        except Exception as e:
            print(f"{method} {path}: {e!r}", file=sys.stderr)
            return self.send(400 if isinstance(e, ValueError) else 500, {"error": str(e)[:300]})

    def do_GET(self): self.route("GET")
    def do_POST(self): self.route("POST")

    def log_message(self, fmt, *args):  # no tokens or bodies in the journal
        sys.stderr.write(f"{self.command} {self.path.split('?')[0]} {args[1] if len(args) > 1 else ''}\n")


def import_old(path, subs_path=None):
    """The old public/words.json (and push-subscriptions.txt) into the tables. Safe to run again: it skips what's there."""
    data = json.load(open(path))
    with db() as con:
        n = sum(insert_word(con, w, w.get("added"), basic=bool(w.get("basic"))) for w in data["words"])
        for st in data.get("stories", []):
            save_story(con, st)
        con.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('audio', ?)", (json.dumps(data.get("audio", {}), ensure_ascii=False),))
        con.execute("INSERT OR REPLACE INTO meta (key, value) VALUES ('whatsapp_last', ?)", (str(data.get("lastMsg", 0)),))
        for line in open(subs_path).read().splitlines() if subs_path else []:
            if line.strip():
                s = json.loads(line)
                con.execute("INSERT OR IGNORE INTO subscriptions (endpoint, data, created) VALUES (?, ?, ?)", (s["endpoint"], line.strip(), int(time.time())))
    print(f"import: {n} words, {len(data.get('stories', []))} stories")


if __name__ == "__main__":
    assert already_known("La palabra española del día:\nLa semana", ["la semana"]) and not already_known("hoy y mañana", ["hoy"])
    init()
    if sys.argv[1:2] == ["import"]:
        import_old(*sys.argv[2:4])
    elif sys.argv[1:] == ["tick"]:
        process_inbox()
        try:
            print(f"story: {write_story() or 'nothing to do'}")
        except Exception as e:  # bad JSON, Claude down...: try again next hour
            print(f"story: skipped ({e})", file=sys.stderr)
    else:
        if not TOKEN or not ADMIN:
            sys.exit("SB_TOKEN and SB_ADMIN_TOKEN must be set")
        threading.Thread(target=process_inbox, daemon=True).start()  # anything left waiting when it last stopped
        ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
