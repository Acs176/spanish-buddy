// run: node src/srs.test.mjs
import assert from "node:assert/strict";
import { schedule, pickNext, dueCount, wait, stage, fromLeitner, today } from "./srs.js";

const now = Date.UTC(2026, 9, 17, 12), day = today(now), MIN = 6e4;
const rev = (ivl, ease = 2.5) => ({ st: "review", ivl, ease, lapses: 0, due: day, seen: 0 });

// new card: Good, Good graduates to 1 day; Easy jumps straight to 4 days
let c = schedule(undefined, 3, now, day);
assert.deepEqual([c.st, c.step, c.due], ["learn", 1, now + 10 * MIN]);
c = schedule(c, 3, now, day);
assert.deepEqual([c.st, c.ivl, c.due], ["review", 1, day + 1]);
assert.equal(schedule(undefined, 4, now, day).ivl, 4);
assert.equal(schedule(undefined, 2, now, day).due, now + 5.5 * MIN); // Hard on the first step: halfway between 1 and 10 min
assert.equal(schedule(undefined, 1, now, day).due, now + MIN);

// review card, interval 10, ease 2.5: Hard 12, Good 25, Easy 33, and the ease moves
assert.equal(schedule(rev(10), 2, now, day).ivl, 12);
assert.equal(schedule(rev(10), 3, now, day).ivl, 25);
assert.equal(schedule(rev(10), 4, now, day).ivl, 33);
assert.equal(schedule(rev(10), 4, now, day).ease, 2.65);
assert.equal(schedule(rev(10), 2, now, day).ease, 2.35);
assert.equal(schedule(rev(1), 2, now, day).ivl, 2); // Hard/Good/Easy are always at least a day apart
assert.equal(schedule(rev(1, 1.3), 3, now, day).ivl, 3);

// a lapse: relearn in 10 min, ease -0.2 (never below 1.3), back to review at 1 day
let l = schedule(rev(30), 1, now, day);
assert.deepEqual([l.st, l.ivl, l.ease, l.lapses, l.due], ["learn", 1, 2.3, 1, now + 10 * MIN]);
assert.equal(schedule(rev(30, 1.3), 1, now, day).ease, 1.3);
l = schedule(l, 3, now, day);
assert.deepEqual([l.st, l.ivl, l.due], ["review", 1, day + 1]);

// queue: at most 20 new words a day, due reviews before new words
const words = Array.from({ length: 30 }, (_, i) => ({ id: "w" + i }));
assert.equal(dueCount(words, {}, now, day), 20);
const cards = { w0: rev(5), w1: { ...rev(5), due: day + 3 } };
assert.equal(pickNext(words, cards, now, day).id, "w0");
assert.equal(pickNext(words, { w0: cards.w1, w1: cards.w1 }, now, day).id, "w2"); // nothing due: the first unseen word
// a learning card due in 8 min is shown early only when nothing else is waiting
const soon = { w0: { st: "learn", step: 0, ease: 2.5, lapses: 0, due: now + 8 * MIN, seen: day } };
assert.equal(pickNext([{ id: "w0" }], soon, now, day).id, "w0");
assert.equal(pickNext(words.slice(0, 2), { ...soon, w1: rev(5) }, now, day).id, "w1");
assert.equal(pickNext([{ id: "w0" }], { w0: { ...rev(5), due: day + 2 } }, now, day), null);

// the 4am day boundary, in whatever time zone the test runs in
const t = new Date(2026, 9, 17, 3, 59).getTime();
assert.equal(today(t + 2 * MIN), today(t) + 1);

// labels, flowers, migration
assert.equal(wait({ st: "learn", due: now + 10 * MIN }, now, day), "10 Min");
assert.equal(wait({ st: "review", due: day + 1 }, now, day), "1 Tag");
assert.equal(wait({ st: "review", due: day + 90 }, now, day), "3 Mon");
assert.deepEqual([stage(undefined), stage({ st: "learn" }), stage(rev(3)), stage(rev(100))], [0, 1, 2, 5]);
const m = fromLeitner({ a: { box: 3, due: day }, b: { box: 0, due: day } }, now);
assert.deepEqual([m.a.st, m.a.ivl, m.b.st], ["review", 4, "learn"]);

console.log("srs ok");
