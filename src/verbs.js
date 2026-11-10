// The verbs on the tile wall (Verbs.jsx), in teaching order; see unlocked(). Add the next one at the end and sync.py voices it.
// forms: yo, tú, él/ella, nosotros, vosotros, ellos. Only PEOPLE are played so far; the other forms are the wrong answers.
// lines: ___ takes the form; de has one translation per person. A null skips the line for that person: yo and tú lines
// have no gendered words (they fit both of them), él is Mr. Lock 'em up, nosotros is the two of them.
import { pickHard } from "./srs.js";

export const PEOPLE = ["yo", "tú", "él", "nosotros"]; // yo = Angela, tú = Adrián, él = Mr. Lock 'em up, nosotros = both
export const BASE = 2; // yo and tú paint the big petals and finish a tile; the others glaze its edges, see active()
const ARRIVE = [0, 0, 2, 4]; // finished tiles before each person joins the workshop
export const RIVAL = [1, 0, 1, 0]; // whose form is always among the options: eres/es, soy/somos
export const SLOTS = 12; // tiles on the wall, the ones without a verb yet wait empty
const START = 4; // verbs on the wall from the first day
export const PER_FORM = 3; // petals a form needs
export const PETALS = BASE * PER_FORM; // the big petals that finish a tile
export const daily = n => 4 * n; // petals she can paint in a day, on any forms: each new person brings more, so glazing doesn't slow the wall
const ROUND = 8, PRODUCED = 4; // questions in a round, and how many of them she has to produce

const VERBS = [
  {
    id: "ser", de: "sein (was etwas ist)",
    forms: ["soy", "eres", "es", "somos", "sois", "son"],
    lines: [
      { es: "___ muy importante.", de: ["Ich bin sehr wichtig.", "Du bist sehr wichtig.", "Er ist sehr wichtig.", null] },
      { es: "___ un quesito.", de: ["Ich bin ein Käsestückchen.", "Du bist ein Käsestückchen.", "Er ist ein Käsestückchen.", null] },
      { es: "___ la persona más dulce del mundo.", de: ["Ich bin der süßeste Mensch der Welt.", "Du bist der süßeste Mensch der Welt.", "Er ist der süßeste Mensch der Welt.", null] },
      { es: "___ un poco gruñón.", de: [null, null, "Er ist ein bisschen grummelig.", null] },
      { es: "___ un buen equipo.", de: [null, null, null, "Wir sind ein gutes Team."] },
      { es: "___ muy felices.", de: [null, null, null, "Wir sind sehr glücklich."] },
    ],
  },
  {
    id: "estar", de: "sein (wie und wo)",
    forms: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    lines: [
      { es: "___ en la cocina.", de: ["Ich bin in der Küche.", "Du bist in der Küche.", "Er ist in der Küche.", "Wir sind in der Küche."] },
      { es: "¿___ arriba o abajo?", de: ["Bin ich oben oder unten?", "Bist du oben oder unten?", "Ist er oben oder unten?", "Sind wir oben oder unten?"] },
      { es: "Ahora ___ aquí.", de: ["Jetzt bin ich hier.", "Jetzt bist du hier.", "Jetzt ist er hier.", "Jetzt sind wir hier."] },
    ],
  },
  {
    id: "tener", de: "haben",
    forms: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    lines: [
      { es: "___ hambre.", de: ["Ich habe Hunger.", "Du hast Hunger.", "Er hat Hunger.", "Wir haben Hunger."] },
      { es: "___ un quesito en la cocina.", de: ["Ich habe ein Käsestückchen in der Küche.", "Du hast ein Käsestückchen in der Küche.", "Er hat ein Käsestückchen in der Küche.", "Wir haben ein Käsestückchen in der Küche."] },
      { es: "Hoy ___ mucho queso.", de: ["Heute habe ich viel Käse.", "Heute hast du viel Käse.", "Heute hat er viel Käse.", "Heute haben wir viel Käse."] },
    ],
  },
  {
    id: "ir", de: "gehen, fahren",
    forms: ["voy", "vas", "va", "vamos", "vais", "van"],
    lines: [
      { es: "___ a la cocina.", de: ["Ich gehe in die Küche.", "Du gehst in die Küche.", "Er geht in die Küche.", "Wir gehen in die Küche."] },
      { es: "Mañana ___ a Madrid.", de: ["Morgen fahre ich nach Madrid.", "Morgen fährst du nach Madrid.", "Morgen fährt er nach Madrid.", "Morgen fahren wir nach Madrid."] },
      { es: "Ahora ___ a la habitación.", de: ["Jetzt gehe ich ins Zimmer.", "Jetzt gehst du ins Zimmer.", "Jetzt geht er ins Zimmer.", "Jetzt gehen wir ins Zimmer."] },
    ],
  },
  {
    id: "querer", de: "wollen, mögen",
    forms: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
    lines: [
      { es: "___ un quesito.", de: ["Ich will ein Käsestückchen.", "Du willst ein Käsestückchen.", "Er will ein Käsestückchen.", "Wir wollen ein Käsestückchen."] },
      { es: "___ un beso.", de: ["Ich will einen Kuss.", "Du willst einen Kuss.", "Er will einen Kuss.", "Wir wollen einen Kuss."] },
      { es: "Hoy ___ dormir mucho.", de: ["Heute will ich viel schlafen.", "Heute willst du viel schlafen.", "Heute will er viel schlafen.", "Heute wollen wir viel schlafen."] },
    ],
  },
  {
    id: "poder", de: "können",
    forms: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
    lines: [
      { es: "Hoy ___ cocinar.", de: ["Heute kann ich kochen.", "Heute kannst du kochen.", "Heute kann er kochen.", "Heute können wir kochen."] },
      { es: "¿___ venir mañana?", de: ["Kann ich morgen kommen?", "Kannst du morgen kommen?", "Kann er morgen kommen?", "Können wir morgen kommen?"] },
      { es: "Ahora no ___ hablar.", de: ["Jetzt kann ich nicht reden.", "Jetzt kannst du nicht reden.", "Jetzt kann er nicht reden.", "Jetzt können wir nicht reden."] },
    ],
  },
  {
    id: "hacer", de: "machen",
    forms: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    lines: [
      { es: "Hoy ___ la cena.", de: ["Heute mache ich das Abendessen.", "Heute machst du das Abendessen.", "Heute macht er das Abendessen.", "Heute machen wir das Abendessen."] },
      { es: "¿Qué ___ ahora?", de: ["Was mache ich jetzt?", "Was machst du jetzt?", "Was macht er jetzt?", "Was machen wir jetzt?"] },
      { es: "___ muchas cosas.", de: ["Ich mache viele Dinge.", "Du machst viele Dinge.", "Er macht viele Dinge.", "Wir machen viele Dinge."] },
    ],
  },
  {
    id: "saber", de: "wissen, können",
    forms: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
    lines: [
      { es: "No ___ nada.", de: ["Ich weiß nichts.", "Du weißt nichts.", "Er weiß nichts.", "Wir wissen nichts."] },
      { es: "___ cocinar muy bien.", de: ["Ich kann sehr gut kochen.", "Du kannst sehr gut kochen.", "Er kann sehr gut kochen.", "Wir können sehr gut kochen."] },
      { es: "Ahora ___ dónde está la cocina.", de: ["Jetzt weiß ich, wo die Küche ist.", "Jetzt weißt du, wo die Küche ist.", "Jetzt weiß er, wo die Küche ist.", "Jetzt wissen wir, wo die Küche ist."] },
    ],
  },
  {
    id: "decir", de: "sagen",
    forms: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
    lines: [
      { es: "___ la verdad.", de: ["Ich sage die Wahrheit.", "Du sagst die Wahrheit.", "Er sagt die Wahrheit.", "Wir sagen die Wahrheit."] },
      { es: "Siempre ___ que sí.", de: ["Ich sage immer ja.", "Du sagst immer ja.", "Er sagt immer ja.", "Wir sagen immer ja."] },
      { es: "¿Qué ___ ahora?", de: ["Was sage ich jetzt?", "Was sagst du jetzt?", "Was sagt er jetzt?", "Was sagen wir jetzt?"] },
    ],
  },
  {
    id: "ver", de: "sehen",
    forms: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    lines: [
      { es: "___ la cocina desde aquí.", de: ["Ich sehe die Küche von hier aus.", "Du siehst die Küche von hier aus.", "Er sieht die Küche von hier aus.", "Wir sehen die Küche von hier aus."] },
      { es: "Hoy ___ una película.", de: ["Heute schaue ich einen Film.", "Heute schaust du einen Film.", "Heute schaut er einen Film.", "Heute schauen wir einen Film."] },
      { es: "Ahora ___ el mar.", de: ["Jetzt sehe ich das Meer.", "Jetzt siehst du das Meer.", "Jetzt sieht er das Meer.", "Jetzt sehen wir das Meer."] },
    ],
  },
  {
    id: "venir", de: "kommen",
    forms: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
    lines: [
      { es: "Mañana ___ a Madrid.", de: ["Morgen komme ich nach Madrid.", "Morgen kommst du nach Madrid.", "Morgen kommt er nach Madrid.", "Morgen kommen wir nach Madrid."] },
      { es: "___ de la cocina.", de: ["Ich komme aus der Küche.", "Du kommst aus der Küche.", "Er kommt aus der Küche.", "Wir kommen aus der Küche."] },
      { es: "Hoy ___ muy tarde.", de: ["Heute komme ich sehr spät.", "Heute kommst du sehr spät.", "Heute kommt er sehr spät.", "Heute kommen wir sehr spät."] },
    ],
  },
  {
    id: "dar", de: "geben",
    forms: ["doy", "das", "da", "damos", "dais", "dan"],
    lines: [
      { es: "___ un besito.", de: ["Ich gebe ein Küsschen.", "Du gibst ein Küsschen.", "Er gibt ein Küsschen.", "Wir geben ein Küsschen."] },
      { es: "Mañana ___ una fiesta.", de: ["Morgen gebe ich eine Party.", "Morgen gibst du eine Party.", "Morgen gibt er eine Party.", "Morgen geben wir eine Party."] },
      { es: "Siempre ___ las gracias.", de: ["Ich bedanke mich immer.", "Du bedankst dich immer.", "Er bedankt sich immer.", "Wir bedanken uns immer."] },
    ],
  },
];
export default VERBS;

const shuffle = a => pickHard(a, () => 1, a.length);
export const key = (v, p) => `${v.id}:${p}`;
// the sentence with the form in it, capitalised when the form opens it
export const fill = (line, form) =>
  line.es.replace(/^(¿?)___/, (_, q) => q + form[0].toUpperCase() + form.slice(1)).replace("___", form);

// painted: { "ser:0": { n, day, fired } }. A new petal is wet (n > fired) until the kiln fires it on a later day.
// Up to daily() petals a day: enough to finish a tile and start the next, so a new verb arrives about once a day.
const paintedToday = (painted, day) => Object.values(painted).reduce((sum, c) => sum + (c.day === day ? c.n - (c.fired ?? 0) : 0), 0);
export const paint = (painted, k, day) => {
  const c = painted[k];
  return c?.n >= PER_FORM || paintedToday(painted, day) >= daily(active(painted)) ? painted : { ...painted, [k]: { n: (c?.n ?? 0) + 1, day, fired: c?.fired ?? 0 } };
};
// n: how many people count, from yo on. BASE for the big petals, active(painted) for the whole tile with its glaze.
export const petals = (v, painted, n = BASE) => PEOPLE.slice(0, n).reduce((sum, _, p) => sum + (painted[key(v, p)]?.n ?? 0), 0);
// the tile's petals, three per person in PEOPLE order: "fired" | "wet" | "empty". asFired: how it looks after the kiln.
export const states = (v, painted, asFired = false, n = BASE) => PEOPLE.slice(0, n).flatMap((_, p) => {
  const c = painted[key(v, p)], k = c?.n ?? 0, f = asFired ? k : c?.fired ?? 0;
  return Array.from({ length: PER_FORM }, (_, i) => i < f ? "fired" : i < k ? "wet" : "empty");
});
// finished: its big petals fired. The glaze is extra, it never holds back the next verb.
export const finished = (v, painted) => states(v, painted).every(s => s === "fired");
const done = painted => VERBS.filter(v => finished(v, painted)).length;
// how many people are in the workshop: yo and tú from the start, then Mr. Lock 'em up, then nosotros
export const active = painted => ARRIVE.filter(a => done(painted) >= a).length;
// the forms with petals dried overnight, ready for the kiln today
export const waiting = (painted, day) => VERBS.flatMap(v => PEOPLE.map((_, p) => ({ v, p })).filter(({ v, p }) => {
  const c = painted[key(v, p)];
  return c && c.n > (c.fired ?? 0) && c.day < day;
}));
export const fire = (painted, day) => Object.fromEntries(Object.entries(painted).map(([k, c]) => [k, c.day < day ? { ...c, fired: c.n } : c]));
// she starts with four verbs; every finished tile brings the next one onto the wall
export const unlocked = painted => VERBS.slice(0, START + done(painted));
// petals still to paint on the tile closest to done, the next unlock; 0: one is fully painted and only needs the kiln
export const toNext = painted => Math.min(...unlocked(painted).filter(v => !finished(v, painted)).map(v => PETALS - petals(v, painted)));
// petals she can still paint today: what's left of the day's allowance, if the wall has room for that many
export const leftToday = (painted, day) => {
  const n = active(painted);
  return Math.min(daily(n) - paintedToday(painted, day), unlocked(painted).reduce((sum, v) => sum + n * PER_FORM - petals(v, painted, n), 0));
};

// A round: she produces forms for the tile closest to done, then the next, so the petals add up to a finished tile
// instead of spreading over the wall; once today's petals are painted, any forms, for practice. The other questions are
// the listening warm-up (quien), which earns no petal. Shuffled, so the two mix.
// Once Mr. Lock 'em up is in, every other produced form is glaze (él, nosotros), on the tile whose glaze is closest to done.
// focus: the tile she tapped; the whole round is about that verb, whether or not it still has petals to earn.
export function makeRound(verbs, painted, day, focus) {
  const n = active(painted), people = PEOPLE.slice(0, n).map((_, p) => p);
  const pool = focus ? [focus] : verbs;
  const forms = pool.flatMap(v => people.map(p => ({ v, p })));
  const deal = k => { const f = shuffle(forms); return Array.from({ length: k }, (_, i) => f[i % f.length]); }; // repeats when a round is about one verb
  const room = Math.min(PRODUCED, daily(n) - paintedToday(painted, day));
  // petals still to paint for these people, closest tile first, taking turns between the people on a tile
  const queue = who => {
    const out = [];
    for (const v of [...pool].sort((a, b) => petals(b, painted, n) - petals(a, painted, n))) { // stable: the older verb first on a tie
      const left = who.map(p => PER_FORM - (painted[key(v, p)]?.n ?? 0));
      for (let j = 0; out.length < room && left.some(x => x > 0); j = (j + 1) % who.length) if (left[j] > 0) { left[j]--; out.push({ v, p: who[j] }); }
    }
    return out;
  };
  const big = queue(people.slice(0, BASE)), glaze = queue(people.slice(BASE)), produce = [];
  while (produce.length < room && (big.length || glaze.length)) produce.push(...[big.shift(), glaze.shift()].filter(Boolean));
  produce.length = Math.min(produce.length, room);
  const used = {};
  const picks = [...produce, ...deal(PRODUCED - produce.length), ...deal(ROUND - PRODUCED)];
  return shuffle(picks.map(({ v, p }, i) => {
    const lines = v.lines.filter(l => l.de[p]);
    const seen = used[key(v, p)] = (used[key(v, p)] ?? -1) + 1; // the same form twice gets a different sentence
    const line = lines[seen % lines.length], answer = v.forms[p];
    const others = v.forms.filter(f => f !== answer);
    const rival = v.forms[RIVAL[p]]; // always among the options: telling the people apart is the point
    return {
      kind: i >= PRODUCED ? "quien" : i % 2 ? "write" : "choose",
      v, p, line, answer, sentence: fill(line, answer), de: line.de[p],
      options: shuffle([answer, rival, ...shuffle(others.filter(f => f !== rival)).slice(0, 2)]),
    };
  }));
}

// everything the game says, for sync.py to voice
export const verbTexts = () => VERBS.flatMap(v => [
  v.id,
  ...v.forms.slice(0, PEOPLE.length),
  ...v.lines.flatMap(l => PEOPLE.flatMap((_, p) => l.de[p] ? [fill(l, v.forms[p])] : [])),
]);
