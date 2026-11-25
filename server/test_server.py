# run: python3 server/test_server.py   (a fake "claude" with fixed JSON, a throwaway database, no notifications)
import json, os, sys, tempfile, threading, urllib.error, urllib.request

tmp = tempfile.mkdtemp()
fake = os.path.join(tmp, "claude")
with open(fake, "w") as f:
    f.write("""#!/usr/bin/env python3
import json, sys
p = sys.argv[-1]
card = lambda es, de: {"es": es, "de": de, "en": "x", "type": "noun", "topic": "tiempo", "tip": "t",
    "examples": [{"es": "a", "de": "b"}] * 3, "cloze": {"es": "Es ___.", "answer": es, "de": "c"}, "distractors": ["x", "y", "z"]}
if "daily reading story" in p:
    print(json.dumps({"title": "En la roca", "de": "Am Fels", "sentences": [{"es": "Hola.", "de": "Hallo."}], "new": [{"es": "roca", "de": "Fels"}],
          "questions": [{"es": "¿Dónde?", "de": "Wo?", "answer": "roca", "options": ["roca", "mar", "casa"]}] * 3}))
elif "boom" in p:
    sys.exit(1)
else:
    msg = p.split("<<<")[1]
    print("Sure:", json.dumps([card("la semana", "die Woche")] + ([card("el mes", "der Monat")] if "mes" in msg else [])))
""")
os.chmod(fake, 0o755)
os.environ.update(SB_DB=os.path.join(tmp, "t.db"), SB_TOKEN="her", SB_ADMIN_TOKEN="him", CLAUDE=fake)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import server  # noqa: E402

server.init()
srv = server.ThreadingHTTPServer(("127.0.0.1", 0), server.Handler)
PORT = srv.server_address[1]
threading.Thread(target=srv.serve_forever, daemon=True).start()
server.threading = type("T", (), {"Thread": lambda *a, **kw: type("N", (), {"start": lambda self: None})()})  # process the inbox by hand below


def call(method, path, body=None, token="her", origin=None):
    h = {"Content-Type": "application/json", **({"Authorization": f"Bearer {token}"} if token else {}), **({"Origin": origin} if origin else {})}
    req = urllib.request.Request(f"http://127.0.0.1:{PORT}{path}", method=method, headers=h,
                                 data=json.dumps(body).encode() if body is not None else None)
    try:
        with urllib.request.urlopen(req) as r:
            return r.status, (json.load(r) if r.status != 204 else None), r.headers
    except urllib.error.HTTPError as e:
        return e.code, json.load(e), e.headers


# import the old words.json
old = {"lastMsg": 500, "audio": {"hoy": "audio/1.mp3"}, "words": [
    {"id": "hoy", "es": "hoy", "de": "heute", "en": "today", "type": "adverb", "added": "2026-09-30", "tip": "t", "topic": "tiempo",
     "examples": [{"es": "Hoy sí.", "de": "Heute ja."}], "cloze": {"es": "___ no.", "answer": "Hoy", "de": "d"}, "distractors": ["a", "b", "c"]},
    {"id": "yo", "es": "yo", "de": "ich", "type": "other", "basic": True, "examples": [], "cloze": {"es": "___ soy.", "answer": "Yo", "de": "d"}, "distractors": []}],
    "stories": [{"day": "2026-11-01", "title": t, "de": "D", "sentences": [], "new": [{"es": "n", "de": "n"}], "questions": []} for t in ("T1", "T2")]}
json.dump(old, open(os.path.join(tmp, "w.json"), "w"))
open(os.path.join(tmp, "subs.txt"), "w").write('{"endpoint": "https://push.example/1", "keys": {}}\n')
server.import_old(os.path.join(tmp, "w.json"), os.path.join(tmp, "subs.txt"))
server.import_old(os.path.join(tmp, "w.json"))  # again: nothing doubled
s, d, _ = call("GET", "/api/data", token=None)
assert s == 200 and [w["id"] for w in d["words"]] == ["hoy", "yo"] and d["audio"] == {"hoy": "audio/1.mp3"}, d
assert d["words"][1]["basic"] is True and "added" not in d["words"][1] and [x["title"] for x in d["stories"]] == ["T1", "T2"]
assert d["words"] == [{k: v for k, v in w.items() if k != "basic" or v} for w in old["words"]], "round trip changes nothing"

# auth: public data, roles kept apart
assert call("GET", "/api/progress", token="nope")[0] == 401
assert call("GET", "/api/whoami", token="him")[1] == {"role": "admin"}
assert call("GET", "/api/progress", token="him")[0] == 404  # Adrián's own practice never lands in her progress
assert call("POST", "/api/words", {"text": "x"}, token="her")[0] == 404

# CORS: the Pages origin may call, others get no header
s, _, h = call("OPTIONS", "/api/sync", token=None, origin="https://acs176.github.io")
assert s == 204 and h["Access-Control-Allow-Origin"] == "https://acs176.github.io" and "Authorization" in h["Access-Control-Allow-Headers"]
assert call("GET", "/api/data", token=None, origin="https://evil.example")[2].get("Access-Control-Allow-Origin") is None

# progress: empty until the phone uploads
assert call("GET", "/api/progress")[1]["empty"] is True
card = {"st": "review", "step": 0, "ivl": 4, "ease": 2.5, "lapses": 0, "due": 20400, "seen": 0, "last": 20396}
ops = [
    {"k": "cards", "id": "hoy", "v": card, "at": 0},
    {"k": "cards", "id": "hoy:p", "v": {"st": "learn", "step": 1, "ease": 2.5, "lapses": 0, "due": 1.7e12, "seen": 20396}, "at": 0},
    {"k": "misses", "id": "hoy", "v": 2, "at": 0},
    {"k": "verbs", "id": "ser:0", "v": {"n": 3, "day": 20390, "fired": 3}, "at": 0},
    {"k": "mosaicDates", "id": "10", "v": "2026-11-02", "at": 0},
    {"k": "read", "id": "pc1", "at": 0}, {"k": "posSeen", "id": "llaves", "at": 0}, {"k": "seen", "id": "welcome", "at": 0},
    {"k": "basicsNew", "id": "yo", "at": 0},
    {"k": "sound", "v": "off", "at": 0}, {"k": "mosaic", "v": "1", "at": 0}, {"k": "storySeen", "v": "2026-11-01", "at": 0},
    {"k": "answer", "v": {"id": "a1", "word": "hoy", "mode": "cards", "dir": "r", "rating": 3}, "at": 5},
    {"k": "answer", "v": {"id": "a2", "word": "hoy", "mode": "practice", "kind": "write", "correct": False}, "at": 6},
    # these can never apply and must not block the queue
    {"k": "cards", "id": "ghost", "v": card, "at": 1},                                   # no such word
    {"k": "answer", "v": {"id": "a3", "word": "hoy", "mode": "cards"}, "at": 7},         # no rating
    {"k": "cards", "id": "hoy", "v": {**card, "st": "lost"}, "at": 9},                   # bad state
    {"k": "nope", "v": 1, "at": 1}, {"k": "misses", "id": "hoy", "v": "2", "at": 1},
]
s, r, _ = call("POST", "/api/sync", {"ops": ops})
assert s == 200 and [x["i"] for x in r["rejected"]] == [14, 15, 16, 17, 18] and r["applied"] == 14, r
s, p, _ = call("GET", "/api/progress")
assert p["empty"] is False and p["cards"]["hoy"] == card and p["cards"]["hoy:p"]["due"] == 1.7e12 and "ivl" not in p["cards"]["hoy:p"]
assert p["misses"] == {"hoy": 2} and p["verbs"] == {"ser:0": {"n": 3, "day": 20390, "fired": 3}} and p["mosaicDates"] == {"10": "2026-11-02"}
assert p["read"] == ["pc1"] and p["posSeen"] == ["llaves"] and p["seen"] == ["welcome"] and p["basicsNew"] == ["yo"]
assert p["sound"] == "off" and p["mosaic"] == "1" and p["storySeen"] == "2026-11-01"

# newest write wins, whatever order it arrives in; resending is harmless
newer = {**card, "ivl": 10, "due": 20406}
call("POST", "/api/sync", {"ops": [{"k": "cards", "id": "hoy", "v": newer, "at": 100}, {"k": "misses", "id": "hoy", "v": 0, "at": 100}]})
call("POST", "/api/sync", {"ops": [{"k": "cards", "id": "hoy", "v": card, "at": 50}, {"k": "misses", "id": "hoy", "v": 4, "at": 0}]})
call("POST", "/api/sync", {"ops": ops[12:14]})
p = call("GET", "/api/progress")[1]
assert p["cards"]["hoy"] == newer and p["misses"] == {"hoy": 0}, p
with server.db() as con:
    assert con.execute("SELECT count(*) FROM answers").fetchone()[0] == 2
    assert con.execute("SELECT correct FROM answers WHERE id = 'a2'").fetchone()[0] == 0
assert call("POST", "/api/sync", {"ops": "x"})[0] == 400

# words: the form, WhatsApp (deduplicated by message id), and a word already there skips Claude
assert call("GET", "/api/whatsapp/last", token="him")[1] == {"last": 500}
assert call("POST", "/api/words", {"text": "La palabra española del día: la semana y el mes", "day": "2026-11-25", "msg_id": 501}, token="him")[0] == 202
assert call("POST", "/api/words", {"text": "same message again", "msg_id": 501}, token="him")[1] == {"duplicate": True}
assert call("POST", "/api/words", {"text": "la semana", "day": "2026-11-25"}, token="him")[0] == 202  # typed in the form too
assert call("POST", "/api/words", {"text": "boom"}, token="him")[0] == 202
assert call("POST", "/api/words", {"text": "  "}, token="him")[0] == 400
sent = []
server.notify = lambda new: sent.append([w["es"] for w in new])
new = server.process_inbox()
assert [w["es"] for w in new] == ["la semana", "el mes"] and sent == [["la semana", "el mes"]], new
d = call("GET", "/api/data", token=None)[1]
assert [w["id"] for w in d["words"]] == ["hoy", "yo", "la-semana", "el-mes"] and d["words"][2]["added"] == "2026-11-25"
items = call("GET", "/api/inbox", token="him")[1]["items"]
assert [(i["status"], i["error"]) for i in items[:2]] == [("new", items[0]["error"]), ("done", "already known")] and "exit 1" in items[0]["error"]
assert items[2]["words"] == "la semana, el mes" and call("GET", "/api/whatsapp/last", token="him")[1] == {"last": 501}
server.process_inbox(); server.process_inbox()
assert call("GET", "/api/inbox", token="him")[1]["items"][0]["status"] == "failed"  # gives up after 3 tries

# words typed in the app: through the same outbox as progress, so offline is fine; both codes may, a resend counts once
server.notify = lambda new: sent.append([w["es"] for w in new])
started = []
server.threading = type("T", (), {"Thread": lambda target, **kw: type("N", (), {"start": lambda self: started.append(1)})()})
w = {"k": "word", "v": {"id": "w1", "text": "el mes", "day": "2026-11-26"}, "at": 10}
assert call("POST", "/api/sync", {"ops": [w, w]})[1]["applied"] == 2 and started == [1]
assert call("POST", "/api/sync", {"ops": [w]})[1]["applied"] == 1 and started == [1]  # already there: nothing new to process
r = call("POST", "/api/sync", {"ops": [{"k": "word", "v": {"id": "w2", "text": "la semana"}, "at": 11}, {"k": "misses", "id": "hoy", "v": 9, "at": 999}]}, token="him")[1]
assert r["applied"] == 1 and [x["i"] for x in r["rejected"]] == [1], r  # Adrián's code: his words yes, progress no
assert call("POST", "/api/sync", {"ops": [{"k": "word", "v": {"id": "w3", "text": " "}, "at": 1}]})[1]["rejected"]
mine = call("GET", "/api/inbox")[1]["items"]
assert [i["client_id"] for i in mine] == ["w2", "w1"], mine  # Angela sees what was typed in the app, never raw WhatsApp
assert any(i["client_id"] is None for i in call("GET", "/api/inbox", token="him")[1]["items"])
server.process_inbox()
assert [i["status"] for i in call("GET", "/api/inbox")[1]["items"]] == ["done", "done"]

# story: once a day
assert server.write_story("2026-11-25") == "En la roca" and server.write_story("2026-11-25") is None
assert call("GET", "/api/data", token=None)[1]["stories"][-1]["title"] == "En la roca"

# push subscriptions from the app
assert call("POST", "/api/subscriptions", {"endpoint": "https://push.example/2", "keys": {"p256dh": "k", "auth": "a"}})[0] == 200
assert call("POST", "/api/subscriptions", {"endpoint": "http://nope"})[0] == 400
with server.db() as con:
    assert con.execute("SELECT count(*) FROM subscriptions").fetchone()[0] == 2
print("ok")
