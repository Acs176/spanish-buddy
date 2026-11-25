#!/usr/bin/env python3
"""Hourly on the Mac (launchd, com.acs176.spanish-buddy.plist): new "palabra del día" WhatsApp messages go to the
server, which does everything else. The backup way in: the app's own form (Adrián-Modus) needs no Mac at all.
The server keeps each message once (by its WhatsApp id), so sending one twice is harmless.

    python3 mac/send.py
Needs the admin code in the Keychain:  security add-generic-password -s spanish-buddy-admin -a "$USER" -w
"""
import json, sqlite3, subprocess, sys, unicodedata, urllib.request
from datetime import datetime
from pathlib import Path

API = "https://spanish-buddy.51-170-52-105.sslip.io/api"
DB = Path.home() / "Library/Group Containers/group.net.whatsapp.WhatsApp.shared/ChatStorage.sqlite"
APPLE_EPOCH = 978307200


def norm(s):
    return unicodedata.normalize("NFKD", s.lower()).encode("ascii", "ignore").decode()


def call(path, token, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def main():
    token = subprocess.run(["security", "find-generic-password", "-s", "spanish-buddy-admin", "-w"],
                           capture_output=True, text=True, check=True).stdout.strip()
    last = call("/whatsapp/last", token)["last"]
    con = sqlite3.connect(f"file:{DB}?mode=ro", uri=True)
    rows = con.execute("SELECT Z_PK, ZMESSAGEDATE, ZTEXT FROM ZWAMESSAGE WHERE ZISFROMME = 1 AND Z_PK > ? AND ZTEXT IS NOT NULL "
                       "ORDER BY Z_PK", (last,)).fetchall()
    con.close()
    # ponytail: filter in Python so "día"/"dia" and any capitalisation both match
    msgs = [r for r in rows if "palabra espanola del dia" in norm(r[2])]
    for pk, ts, text in msgs:
        day = datetime.fromtimestamp(ts + APPLE_EPOCH).date().isoformat()  # her local day: the word of the day is the day after
        print(f"msg {pk}: {call('/words', token, {'text': text, 'day': day, 'msg_id': pk})}")
    print(f"{len(msgs)} new message(s)")


if __name__ == "__main__":
    assert "palabra espanola del dia" in norm("La Palabra Española del DÍA")
    try:
        main()
    except Exception as e:  # offline, Mac just woke up: the next hour sends it
        sys.exit(f"send: {e}")
