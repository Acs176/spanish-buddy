// Her progress lives in localStorage, so the app works the same with or without internet. Every change also goes into
// an outbox ("outbox"), which is sent to the server (server/server.py) whenever there is a connection; the server keeps
// it in tables and the newest write of each row wins, so sending late, out of order or twice is all fine.
// On start the app sends what is waiting, then takes the server's copy (a new phone gets everything back).
import { fromLeitner } from "./srs.js";

export const API = "https://spanish-buddy.51-170-52-105.sslip.io/api";

// what each key holds, and so how a change to it becomes outbox entries (one per row on the server)
const MAPS = ["cards", "misses", "verbs", "mosaicDates"]; // { id: value }: changed entries
const SETS = ["read", "posSeen", "seen", "basicsNew"]; // [ids]: added ids (nothing is ever removed)
const SCALARS = ["sound", "music", "verbsIntro", "verbsMet", "storySeen", "mosaic"]; // plain strings, as they always were
const SYNCED = [...MAPS, ...SETS, ...SCALARS];
const LOCAL = ["outbox", "auth", "synced", "data"]; // this device only: never in a backup, never uploaded

const raw = {
  get: k => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode or full: it just won't stick */ } },
};
const json = (k, fallback) => { try { return JSON.parse(raw.get(k)) ?? fallback; } catch { return fallback; } };

export function get(key, fallback) {
  if (SCALARS.includes(key)) return raw.get(key) ?? fallback;
  return json(key, fallback);
}
// changes are entries, not whole values: two edits to different cards never overwrite each other on the server
export function diff(key, prev, next, at) {
  if (MAPS.includes(key)) return Object.entries(next).filter(([id, v]) => JSON.stringify(prev?.[id]) !== JSON.stringify(v)).map(([id, v]) => ({ k: key, id, v, at }));
  if (SETS.includes(key)) return [...next].filter(id => !prev?.includes(id)).map(id => ({ k: key, id: String(id), at }));
  if (SCALARS.includes(key)) return prev != null && String(prev) === String(next) ? [] : [{ k: key, v: String(next), at }];
  return [];
}
export function set(key, value) {
  const prev = get(key);
  raw.set(key, SCALARS.includes(key) ? String(value) : JSON.stringify(value));
  queue(diff(key, prev, value, Date.now()));
}
const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
// one answer, for her history on the server (only there: the app itself never reads it back)
export const logAnswer = a => queue([{ k: "answer", v: { id: uid(), ...a }, at: Date.now() }]);
// a word typed in the app (hers or Adrián's): same outbox, so it waits for the internet like everything else.
// day: her local day; like a WhatsApp word, it is the word of the day after.
export const addWord = (text, day) => queue([{ k: "word", v: { id: uid(), text: text.trim(), day }, at: Date.now() }]);
export const waitingWords = () => json("outbox", []).filter(o => o.k === "word").map(o => o.v);

// ---------- connection ----------
// auth: { token, role }. "learner" is Angela: her progress and her words sync. "admin" is Adrián: only his words go up,
// his own practice stays on his device.
export const auth = () => json("auth", null);
export async function call(path, opts = {}, token = auth()?.token) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), opts.timeout ?? 15000);
  try {
    const r = await fetch(API + path, {
      ...opts, signal: ctl.signal,
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    });
    const body = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(body.error || `HTTP ${r.status}`), { status: r.status });
    return body;
  } finally { clearTimeout(t); }
}
// the code Adrián gives her (or his own): asks the server whose it is, then starts over with it
export async function connect(code) {
  const { role } = await call("/whoami", {}, code.trim());
  raw.set("auth", JSON.stringify({ token: code.trim(), role }));
  if (role === "admin") raw.set("outbox", JSON.stringify(json("outbox", []).filter(o => o.k === "word"))); // what was practised here isn't hers
  return role;
}

// ---------- outbox ----------
export const pending = () => json("outbox", []).length;
const listeners = new Set();
export const onPending = fn => { listeners.add(fn); return () => listeners.delete(fn); };
const changed = () => listeners.forEach(fn => fn(pending()));

function queue(ops) {
  if (auth()?.role === "admin") ops = ops.filter(o => o.k === "word");
  if (!ops.length) return;
  raw.set("outbox", JSON.stringify([...json("outbox", []), ...ops]));
  changed();
  clearTimeout(queue.t);
  queue.t = setTimeout(flush, 2000); // a burst of answers goes up as one request
}

// sends the outbox in batches. true when it is empty afterwards (or there was nothing to send).
async function send() {
  try {
    for (;;) {
      const ops = json("outbox", []);
      if (!ops.length) return true;
      if (!auth()) return false; // no code yet: it waits
      const batch = ops.slice(0, 500);
      await call("/sync", { method: "POST", body: JSON.stringify({ ops: batch }) }); // rejected entries can never apply: dropped too
      raw.set("outbox", JSON.stringify(json("outbox", []).slice(batch.length))); // only send() takes from the front, queue adds at the back
      changed();
    }
  } catch { return false; } // offline, server down: it stays queued for the next try
}
// one send at a time; .finally (not try/finally inside) so the lock is always released after it is set
let flushing = null;
export const flush = () => flushing ??= send().finally(() => { flushing = null; });

// everything this phone has, as outbox entries. at 0 = older than anything: it only fills gaps on the server.
export function snapshot(at) {
  const ops = [];
  for (const k of SYNCED) {
    let v = get(k);
    if (k === "cards" && !v) v = fromLeitner(json("progress", {})); // never opened since the Leitner days
    if (v != null) ops.push(...diff(k, undefined, v, at));
  }
  return ops;
}
// after "Laden" (a backup): the restored progress is the newest, so it wins over the server's
export const restored = () => queue(snapshot(Date.now()));

// the first start with a code: what is on this phone goes up first. Then the server's copy comes down, but only
// before the app has read anything (settle() is called once it renders; a late answer is ignored, the next start gets it).
let settled = false;
export const settle = () => { settled = true; };
export async function start() {
  if (auth()?.role !== "learner") return;
  if (!raw.get("synced")) { queue(snapshot(0)); raw.set("synced", "1"); }
  if (!(await flush())) return; // offline: the app runs on what this phone has
  const p = await call("/progress", { timeout: 4000 }).catch(() => null);
  if (!p || p.empty || settled || pending()) return;
  for (const k of SYNCED) if (k in p) raw.set(k, SCALARS.includes(k) ? p[k] : JSON.stringify(p[k]));
}

// send when the connection comes back, when she returns to the app, and every minute while something waits
if (typeof window !== "undefined") {
  window.addEventListener("online", flush);
  document.addEventListener("visibilitychange", () => document.visibilityState === "visible" && flush());
  setInterval(() => pending() && flush(), 60000);
}

// ---------- words and stories ----------
// the last copy is kept here, so the app opens offline; a fresh one replaces it when the network answers
export const cachedData = () => json("data", null);
export async function fetchData() {
  const d = await call("/data", { timeout: 10000 }, null);
  raw.set("data", JSON.stringify(d));
  return d;
}

// "Sichern": all of her own keys as one line of text
export const backupText = () => JSON.stringify(Object.fromEntries(Object.entries({ ...localStorage }).filter(([k]) => !LOCAL.includes(k))));
