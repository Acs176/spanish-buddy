// run: node src/verbs.test.mjs
import assert from "node:assert/strict";
import VERBS, { PEOPLE, PETALS, SLOTS, key, fill, paint, petals, states, finished, waiting, fire, unlocked, toNext, leftToday, makeRound, verbTexts } from "./verbs.js";

// the data: six forms, and every line has one gap and a translation per person
for (const v of VERBS) {
  assert.equal(new Set(v.forms).size, 6, v.id);
  for (const l of v.lines) {
    assert.equal(l.es.split("___").length, 2, l.es);
    assert.equal(l.de.length, PEOPLE.length, l.es);
  }
}

// the form is capitalised only when it opens the sentence
assert.equal(fill({ es: "___ hambre." }, "tengo"), "Tengo hambre.");
assert.equal(fill({ es: "¿___ arriba o abajo?" }, "estás"), "¿Estás arriba o abajo?");
assert.equal(fill({ es: "Ahora ___ aquí." }, "estoy"), "Ahora estoy aquí.");

// three petals a form, eight a day on any forms
let p = paint(paint(paint({}, "ser:0", 10), "ser:0", 10), "ser:0", 10);
assert.equal(p["ser:0"].n, 3);
assert.equal(paint(p, "ser:0", 10), p);
assert.equal(petals(VERBS[0], paint(p, "ser:1", 10)), 4);
let eight = {};
for (const k of ["ser:0", "ser:1", "tener:0"]) for (let i = 0; i < 3; i++) eight = paint(eight, k, 10);
assert.equal(Object.values(eight).reduce((s, c) => s + c.n, 0), 8);
assert.equal(leftToday(eight, 10), 0);
assert.equal(paint(eight, "ir:0", 10), eight);
assert.equal(leftToday(eight, 11), 8); // a new day, a new allowance
assert.equal(PETALS, 6);

// a petal stays wet today, is ready for the kiln tomorrow, and firing keeps what was painted
const ser = VERBS[0];
let k = paint({}, "ser:0", 20);
assert.deepEqual(states(ser, k), ["wet", "empty", "empty", "empty", "empty", "empty"]);
assert.deepEqual(waiting(k, 20), []);
assert.deepEqual(waiting(k, 21).map(f => [f.v.id, f.p]), [["ser", 0]]);
assert.deepEqual(states(ser, k, true).slice(0, 2), ["fired", "empty"]);
k = paint(fire(k, 21), "ser:1", 21);
assert.deepEqual(states(ser, k).filter(s => s !== "empty"), ["fired", "wet"]);
assert.deepEqual(states(ser, k).indexOf("wet"), 3); // tú's petals follow yo's
assert.deepEqual(waiting(k, 21), []); // only what was painted before today goes in
assert.equal(fire(k, 21)["ser:1"].fired, 0);
// a tile painted in one day is finished by the next day's kiln, not while the petals are wet
let full = {};
for (let i = 0; i < 3; i++) full = paint(paint(full, "ser:0", 3), "ser:1", 3);
assert.equal(finished(ser, full), false);
assert.equal(finished(ser, fire(full, 4)), true);

// four verbs to start; the next one arrives only once a tile is fired, not while its last petals are wet
assert.equal(VERBS.length, SLOTS);
assert.equal(unlocked({}).length, 4);
assert.equal(unlocked(full).length, 4);
assert.equal(unlocked(fire(full, 4)).map(v => v.id).at(-1), "querer");
// the count to the next tile follows the closest one, and reaches 0 once it is fully painted
assert.equal(toNext({}), 6);
assert.equal(toNext(paint({}, "ser:0", 1)), 5);
assert.equal(toNext(paint(paint({}, "tener:0", 1), "tener:1", 1)), 4);
assert.equal(toNext(full), 0);
assert.equal(leftToday({}, 1), 8);
assert.equal(leftToday(paint({}, "ser:0", 1), 1), 7);
assert.equal(leftToday(paint({}, "ser:0", 1), 2), 8);
assert.equal(leftToday(full, 3), 2);
assert.equal(leftToday(full, 4), 8);

// two rounds of right answers finish a tile and start the next; the kiln brings a new verb the next day
const play = (painted, day) => { for (const q of makeRound(unlocked(painted), painted, day)) if (q.kind !== "quien") painted = paint(painted, key(q.v, q.p), day); return painted; };
let day1 = play(play({}, 30), 30);
assert.equal(petals(VERBS[0], day1), 6);
assert.equal(petals(VERBS[1], day1), 2);
assert.equal(leftToday(day1, 30), 0);
assert.equal(unlocked(day1).length, 4);
let day2 = fire(day1, 31);
assert.equal(unlocked(day2).at(-1).id, "querer");
day2 = play(play(day2, 31), 31);
assert.equal(petals(VERBS[1], day2), 6); // estar comes next, the tile she had started
assert.equal(unlocked(fire(day2, 32)).at(-1).id, "poder");

// a round: half produced, half heard, and the options always hold the answer and the other person's form
const r = makeRound(VERBS, {}, 10);
assert.equal(r.length, 8);
assert.equal(r.filter(q => q.kind === "quien").length, 4);
for (const q of r) {
  assert.equal(new Set(q.options).size, 4);
  assert.ok(q.options.includes(q.answer));
  assert.ok(q.options.includes(q.v.forms[1 - q.p]));
  assert.ok(q.sentence.toLowerCase().includes(q.answer));
}

// a tapped tile makes the whole round about that verb, spending petals only on the forms that still need them
const tener = VERBS[2], firstFour = VERBS.slice(0, 4);
const focused = makeRound(firstFour, {}, 40, tener);
assert.equal(focused.length, 8);
assert.ok(focused.every(q => q.v === tener));
assert.equal(focused.filter(q => q.kind !== "quien").length, 4);
assert.deepEqual([...new Set(focused.map(q => q.p))].sort(), [0, 1]);
let yoDone = {};
for (let i = 0; i < 3; i++) yoDone = paint(yoDone, "tener:0", 40);
assert.ok(makeRound(firstFour, yoDone, 40, tener).filter(q => q.kind !== "quien" && q.p === 1).length >= 3); // tú's last three petals; the fourth is practice, either form
// without a tile tapped, the closest tile still comes first
assert.ok(makeRound(firstFour, {}, 40).filter(q => q.kind !== "quien").every(q => q.v === VERBS[0]));

// with the day's petals painted, she still gets questions to produce, for practice
const r2 = makeRound(VERBS.slice(0, 4), eight, 10);
assert.equal(r2.length, 8);
assert.equal(r2.filter(q => q.kind !== "quien").length, 4);

// everything spoken in the game has a text to voice
const texts = verbTexts();
for (const q of r) assert.ok(texts.includes(q.sentence), q.sentence);
assert.equal(new Set(texts).size, texts.length);

console.log("verbs ok");
