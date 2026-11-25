// run: node src/store.test.mjs
import assert from "node:assert/strict";

const mem = new Map();
globalThis.localStorage = { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, String(v)) };
let online = true, sent = [], server = { empty: true };
globalThis.fetch = async (url, o) => {
  if (!online) throw new TypeError("Failed to fetch");
  const path = url.split("/api")[1];
  if (path === "/whoami") return { ok: true, json: async () => ({ role: o.headers.Authorization === "Bearer her" ? "learner" : "admin" }) };
  if (path === "/sync") { sent.push(...JSON.parse(o.body).ops); return { ok: true, json: async () => ({ applied: 1, rejected: [] }) }; }
  if (path === "/progress") return { ok: true, json: async () => server };
  return { ok: false, status: 404, json: async () => ({}) };
};
const s = await import("./store.js");
const box = () => JSON.parse(mem.get("outbox") ?? "[]");

// scalars keep their old plain-string format, the rest is JSON
s.set("sound", "off");
assert.equal(mem.get("sound"), "off");
assert.equal(s.get("sound"), "off");
assert.deepEqual(s.get("cards", {}), {});

// a change is the entries that changed, not the whole value
s.set("cards", { hoy: { st: "learn" } });
s.set("cards", { hoy: { st: "learn" }, ayer: { st: "review" } });
s.set("read", ["pc1"]); s.set("read", ["pc1", "pc2"]);
s.set("mosaic", 2); s.set("mosaic", "2");
assert.deepEqual(box().map(o => [o.k, o.id ?? o.v]), [["sound", "off"], ["cards", "hoy"], ["cards", "ayer"], ["read", "pc1"], ["read", "pc2"], ["mosaic", "2"]]);

// offline: nothing is lost, it waits
assert.equal(await s.flush(), false); // no code yet
await s.connect("her");
online = false;
assert.equal(await s.flush(), false);
assert.equal(s.pending(), 6);
s.logAnswer({ word: "hoy", mode: "cards", dir: "r", rating: 3 });
assert.equal(s.pending(), 7);

// back online: sent once, outbox empty, the lock released (a second flush works)
online = true;
assert.equal(await s.flush(), true);
assert.equal(sent.length, 7);
assert.equal(s.pending(), 0);
assert.equal(await s.flush(), true);
assert.equal(sent.at(-1).k, "answer");

// first start with a code: everything on the phone goes up at 0 (fills gaps only), the server's copy comes down
sent = [];
server = { empty: false, cards: { hoy: { st: "review", ivl: 9 } }, read: ["pc1", "pc2", "pc3"], sound: "on" };
await s.start();
assert.ok(sent.length >= 4 && sent.every(o => o.at === 0), "snapshot uploaded");
assert.deepEqual(s.get("cards"), server.cards);
assert.deepEqual(s.get("read"), ["pc1", "pc2", "pc3"]);
assert.equal(mem.get("sound"), "on");
assert.equal(mem.get("synced"), "1");

// a second start: no second snapshot; and once the app has rendered, a late copy is ignored
sent = [];
server = { ...server, sound: "off" };
s.settle();
await s.start();
assert.equal(sent.length, 0);
assert.equal(mem.get("sound"), "on");

// an empty server never overwrites the phone
// (covered above: start() returns before applying when p.empty)

// Adrián's device: his practice is never queued
await s.connect("him");
s.set("misses", { hoy: 2 });
assert.equal(s.pending(), 0);
console.log("ok");
