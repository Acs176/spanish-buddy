// run: node src/posesivos.test.mjs
import assert from "node:assert/strict";
import { OBJECTS, deck, form, info, options, sentence } from "./posesivos.js";

assert.equal(form("atono", 0, "f", true), "mis");
assert.equal(form("atono", 3, "f", false), "nuestra");
assert.equal(form("tonico", 1, "f", false), "tuya");
assert.equal(form("tonico", 2, "m", true), "suyos");
assert.equal(form("articulo", 3, "m", true), "los nuestros");
assert.equal(form("articulo", 0, "f", false), "la mía");
assert.equal(form("atono", 4, "f", true), "vuestras");
assert.equal(form("tonico", 4, "m", false), "vuestro");
assert.equal(form("atono", 5, "m", true), "sus");
assert.equal(form("articulo", 5, "f", false), "la suya");

for (const o of OBJECTS) {
  const { art, g, pl } = info(o);
  assert.ok(["el", "la", "los", "las"].includes(art) && o.de && o.e, o.es);
  for (const kind of ["atono", "tonico", "articulo"]) for (const p of [0, 1, 2, 3, 4, 5]) {
    const opts = options(kind, p, g, pl);
    assert.equal(opts.length, 4, `${kind} ${p} ${o.es}`);
    assert.equal(new Set(opts).size, 4);
    assert.ok(opts.includes(form(kind, p, g, pl)));
    assert.equal(sentence(kind, p, o).length, 2);
  }
}

const d = deck(new Set(["queso", "tenedor"]));
assert.equal(d.length, OBJECTS.filter(o => !o.big).length);
assert.deepEqual(d.slice(-2).map(o => info(o).noun).sort(), ["queso", "tenedor"]); // known ones come last
console.log("ok");
