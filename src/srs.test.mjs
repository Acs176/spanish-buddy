// run: node src/srs.test.mjs
import assert from "node:assert/strict";
import { schedule, pickNext, dueCount, wait, stage, fromLeitner, today, check, difficulty, pickHard, miss } from "./srs.js";

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
assert.equal(pickNext(words, cards, now, day).key, "w0");
assert.equal(pickNext(words, { w0: cards.w1, w1: cards.w1 }, now, day).key, "w2"); // nothing due: the first unseen word
// a learning card due in 8 min is shown early only when nothing else is waiting
const soon = { w0: { st: "learn", step: 0, ease: 2.5, lapses: 0, due: now + 8 * MIN, seen: day } };
assert.equal(pickNext([{ id: "w0" }], soon, now, day).key, "w0");
assert.equal(pickNext(words.slice(0, 2), { ...soon, w1: rev(5) }, now, day).key, "w1");
assert.equal(pickNext([{ id: "w0" }], { w0: { ...rev(3), due: day + 2 } }, now, day), null); // nothing due, production still locked

// reverse (German -> Spanish) cards: they appear once the recognition card reaches 4 days, and they are the only thing due
const two = [{ id: "a" }];
assert.equal(dueCount(two, { a: { ...rev(3), due: day + 5 } }, now, day), 0);
assert.equal(dueCount(two, { a: { ...rev(4), due: day + 5 } }, now, day), 1); // production card unlocked, new
const p = pickNext(two, { a: { ...rev(4), due: day + 5 } }, now, day);
assert.deepEqual([p.key, p.dir, p.w.id], ["a:p", "prod", "a"]);
// once started it stays, even if the recognition card lapses
assert.equal(dueCount(two, { a: { st: "learn", step: 0, ease: 2.3, lapses: 1, ivl: 1, due: now + 600000, seen: 0 }, "a:p": { ...rev(2), due: day } }, now, day), 2);
// siblings are buried: answering one card hides the other until tomorrow
const answered = { ...rev(5), due: day + 5, last: day };
assert.equal(dueCount(two, { a: answered }, now, day), 0); // its production card is buried today
assert.equal(dueCount(two, { a: { ...answered, last: day - 1 } }, now, day), 1);
assert.equal(dueCount(two, { a: rev(5), "a:p": { ...rev(2), due: day + 2, last: day } }, now, day), 0); // and the other way round
// at most 10 new production cards a day, on top of the 20 new words
const many = Array.from({ length: 30 }, (_, i) => ({ id: "m" + i }));
const known = Object.fromEntries(many.map(m => [m.id, { ...rev(9), due: day + 9 }]));
assert.equal(dueCount(many, known, now, day), 10);
assert.equal(schedule(undefined, 3, now, day).last, day);

// typed answers
assert.equal(check("la semana", "la semana"), "ok");
assert.equal(check("Semana", "la semana"), "ok"); // article and case do not matter
assert.equal(check("esta", "ese / esa"), "no");
assert.equal(check("esa", "ese / esa"), "ok");
assert.equal(check("estar muy bueno", "estar muy bueno/a"), "ok");
assert.equal(check("a", "estar muy bueno/a"), "no");
assert.equal(check("me pones", "me pones...?"), "ok");
assert.equal(check("mas", "más"), "accent");
assert.equal(check("ano", "año"), "no"); // ñ is its own letter
assert.equal(check("mañana", "mañana"), "ok");
assert.equal(check("hola", "adiós"), "no");

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

// Üben: difficulty adds misses, lapses and lost ease; misses fall back to 0 after enough right answers
assert.equal(difficulty("x", {}), 1);
assert.equal(difficulty("x", { x: rev(5, 2.0), "x:p": { ...rev(5), lapses: 2 } }, { x: 3 }), 1 + 3 + 1 + 2);
let ms = miss({}, "x", false);
assert.equal(ms.x, 2);
ms = miss(miss(miss(ms, "x", true), "x", true), "x", true);
assert.equal(ms.x, 0);
// a word weighted 9x is picked first about 90% of the time
const hard = { id: "h" }, easy = { id: "e" };
let first = 0;
for (let i = 0; i < 2000; i++) if (pickHard([easy, hard], w => w === hard ? 9 : 1, 1)[0] === hard) first++;
assert.ok(first > 1700 && first < 1900, first);
assert.equal(pickHard([easy, hard], () => 1, 5).length, 2);
