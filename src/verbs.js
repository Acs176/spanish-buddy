// The verbs on the tile wall (Verbs.jsx), in teaching order; see unlocked(). Add the next one at the end and sync.py voices it.
// forms: yo, tú, él/ella, nosotros, vosotros, ellos. Only PEOPLE are played so far; the other forms are the wrong answers.
// lines: ___ takes the form; de has one translation per person played. No gendered words: a line has to fit both of them.
import { pickHard } from "./srs.js";

export const PEOPLE = ["yo", "tú"]; // yo = Angela, tú = Adrián
export const SLOTS = 12; // tiles on the wall, the ones without a verb yet wait empty
const START = 4; // verbs on the wall from the first day
export const PER_FORM = 3; // petals a form needs
export const PETALS = PEOPLE.length * PER_FORM;
export const DAILY = 8; // petals she can paint in a day, on any forms
const ROUND = 8, PRODUCED = 4; // questions in a round, and how many of them she has to produce

const VERBS = [
  {
    id: "ser", de: "sein (was etwas ist)",
    forms: ["soy", "eres", "es", "somos", "sois", "son"],
    lines: [
      { es: "___ muy importante.", de: ["Ich bin sehr wichtig.", "Du bist sehr wichtig."] },
      { es: "___ un quesito.", de: ["Ich bin ein Käsestückchen.", "Du bist ein Käsestückchen."] },
      { es: "___ la persona más dulce del mundo.", de: ["Ich bin der süßeste Mensch der Welt.", "Du bist der süßeste Mensch der Welt."] },
    ],
  },
  {
    id: "estar", de: "sein (wie und wo)",
    forms: ["estoy", "estás", "está", "estamos", "estáis", "están"],
    lines: [
      { es: "___ en la cocina.", de: ["Ich bin in der Küche.", "Du bist in der Küche."] },
      { es: "¿___ arriba o abajo?", de: ["Bin ich oben oder unten?", "Bist du oben oder unten?"] },
      { es: "Ahora ___ aquí.", de: ["Jetzt bin ich hier.", "Jetzt bist du hier."] },
    ],
  },
  {
    id: "tener", de: "haben",
    forms: ["tengo", "tienes", "tiene", "tenemos", "tenéis", "tienen"],
    lines: [
      { es: "___ hambre.", de: ["Ich habe Hunger.", "Du hast Hunger."] },
      { es: "___ un quesito en la cocina.", de: ["Ich habe ein Käsestückchen in der Küche.", "Du hast ein Käsestückchen in der Küche."] },
      { es: "Hoy ___ mucho queso.", de: ["Heute habe ich viel Käse.", "Heute hast du viel Käse."] },
    ],
  },
  {
    id: "ir", de: "gehen, fahren",
    forms: ["voy", "vas", "va", "vamos", "vais", "van"],
    lines: [
      { es: "___ a la cocina.", de: ["Ich gehe in die Küche.", "Du gehst in die Küche."] },
      { es: "Mañana ___ a Madrid.", de: ["Morgen fahre ich nach Madrid.", "Morgen fährst du nach Madrid."] },
      { es: "Ahora ___ a la habitación.", de: ["Jetzt gehe ich ins Zimmer.", "Jetzt gehst du ins Zimmer."] },
    ],
  },
  {
    id: "querer", de: "wollen, mögen",
    forms: ["quiero", "quieres", "quiere", "queremos", "queréis", "quieren"],
    lines: [
      { es: "___ un quesito.", de: ["Ich will ein Käsestückchen.", "Du willst ein Käsestückchen."] },
      { es: "___ un beso.", de: ["Ich will einen Kuss.", "Du willst einen Kuss."] },
      { es: "Hoy ___ dormir mucho.", de: ["Heute will ich viel schlafen.", "Heute willst du viel schlafen."] },
    ],
  },
  {
    id: "poder", de: "können",
    forms: ["puedo", "puedes", "puede", "podemos", "podéis", "pueden"],
    lines: [
      { es: "Hoy ___ cocinar.", de: ["Heute kann ich kochen.", "Heute kannst du kochen."] },
      { es: "¿___ venir mañana?", de: ["Kann ich morgen kommen?", "Kannst du morgen kommen?"] },
      { es: "Ahora no ___ hablar.", de: ["Jetzt kann ich nicht reden.", "Jetzt kannst du nicht reden."] },
    ],
  },
  {
    id: "hacer", de: "machen",
    forms: ["hago", "haces", "hace", "hacemos", "hacéis", "hacen"],
    lines: [
      { es: "Hoy ___ la cena.", de: ["Heute mache ich das Abendessen.", "Heute machst du das Abendessen."] },
      { es: "¿Qué ___ ahora?", de: ["Was mache ich jetzt?", "Was machst du jetzt?"] },
      { es: "___ muchas cosas.", de: ["Ich mache viele Dinge.", "Du machst viele Dinge."] },
    ],
  },
  {
    id: "saber", de: "wissen, können",
    forms: ["sé", "sabes", "sabe", "sabemos", "sabéis", "saben"],
    lines: [
      { es: "No ___ nada.", de: ["Ich weiß nichts.", "Du weißt nichts."] },
      { es: "___ cocinar muy bien.", de: ["Ich kann sehr gut kochen.", "Du kannst sehr gut kochen."] },
      { es: "Ahora ___ dónde está la cocina.", de: ["Jetzt weiß ich, wo die Küche ist.", "Jetzt weißt du, wo die Küche ist."] },
    ],
  },
  {
    id: "decir", de: "sagen",
    forms: ["digo", "dices", "dice", "decimos", "decís", "dicen"],
    lines: [
      { es: "___ la verdad.", de: ["Ich sage die Wahrheit.", "Du sagst die Wahrheit."] },
      { es: "Siempre ___ que sí.", de: ["Ich sage immer ja.", "Du sagst immer ja."] },
      { es: "¿Qué ___ ahora?", de: ["Was sage ich jetzt?", "Was sagst du jetzt?"] },
    ],
  },
  {
    id: "ver", de: "sehen",
    forms: ["veo", "ves", "ve", "vemos", "veis", "ven"],
    lines: [
      { es: "___ la cocina desde aquí.", de: ["Ich sehe die Küche von hier aus.", "Du siehst die Küche von hier aus."] },
      { es: "Hoy ___ una película.", de: ["Heute schaue ich einen Film.", "Heute schaust du einen Film."] },
      { es: "Ahora ___ el mar.", de: ["Jetzt sehe ich das Meer.", "Jetzt siehst du das Meer."] },
    ],
  },
  {
    id: "venir", de: "kommen",
    forms: ["vengo", "vienes", "viene", "venimos", "venís", "vienen"],
    lines: [
      { es: "Mañana ___ a Madrid.", de: ["Morgen komme ich nach Madrid.", "Morgen kommst du nach Madrid."] },
      { es: "___ de la cocina.", de: ["Ich komme aus der Küche.", "Du kommst aus der Küche."] },
      { es: "Hoy ___ muy tarde.", de: ["Heute komme ich sehr spät.", "Heute kommst du sehr spät."] },
    ],
  },
  {
    id: "dar", de: "geben",
    forms: ["doy", "das", "da", "damos", "dais", "dan"],
    lines: [
      { es: "___ un besito.", de: ["Ich gebe ein Küsschen.", "Du gibst ein Küsschen."] },
      { es: "Mañana ___ una fiesta.", de: ["Morgen gebe ich eine Party.", "Morgen gibst du eine Party."] },
      { es: "Siempre ___ las gracias.", de: ["Ich bedanke mich immer.", "Du bedankst dich immer."] },
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
// Up to DAILY petals a day: enough to finish a tile and start the next, so a new verb arrives about once a day.
const paintedToday = (painted, day) => Object.values(painted).reduce((sum, c) => sum + (c.day === day ? c.n - (c.fired ?? 0) : 0), 0);
export const paint = (painted, k, day) => {
  const c = painted[k];
  return c?.n >= PER_FORM || paintedToday(painted, day) >= DAILY ? painted : { ...painted, [k]: { n: (c?.n ?? 0) + 1, day, fired: c?.fired ?? 0 } };
};
export const petals = (v, painted) => PEOPLE.reduce((sum, _, p) => sum + (painted[key(v, p)]?.n ?? 0), 0);
// the tile's six petals, yo's three then tú's: "fired" | "wet" | "empty". asFired: how it looks after the kiln.
export const states = (v, painted, asFired = false) => PEOPLE.flatMap((_, p) => {
  const c = painted[key(v, p)], n = c?.n ?? 0, f = asFired ? n : c?.fired ?? 0;
  return Array.from({ length: PER_FORM }, (_, i) => i < f ? "fired" : i < n ? "wet" : "empty");
});
export const finished = (v, painted) => states(v, painted).every(s => s === "fired");
// the forms with petals dried overnight, ready for the kiln today
export const waiting = (painted, day) => VERBS.flatMap(v => PEOPLE.map((_, p) => ({ v, p })).filter(({ v, p }) => {
  const c = painted[key(v, p)];
  return c && c.n > (c.fired ?? 0) && c.day < day;
}));
export const fire = (painted, day) => Object.fromEntries(Object.entries(painted).map(([k, c]) => [k, c.day < day ? { ...c, fired: c.n } : c]));
// she starts with four verbs; every finished tile brings the next one onto the wall
export const unlocked = painted => VERBS.slice(0, START + VERBS.filter(v => finished(v, painted)).length);
// petals still to paint on the tile closest to done, the next unlock; 0: one is fully painted and only needs the kiln
export const toNext = painted => Math.min(...unlocked(painted).filter(v => !finished(v, painted)).map(v => PETALS - petals(v, painted)));
// petals she can still paint today: what's left of the day's allowance, if the wall has room for that many
export const leftToday = (painted, day) => Math.min(DAILY - paintedToday(painted, day),
  unlocked(painted).reduce((sum, v) => sum + PETALS - petals(v, painted), 0));

// A round: she produces forms for the tile closest to done, then the next, so the petals add up to a finished tile
// instead of spreading over the wall; once today's petals are painted, any forms, for practice. The other questions are
// the listening warm-up (quien), which earns no petal. Shuffled, so the two mix.
export function makeRound(verbs, painted, day) {
  const forms = verbs.flatMap(v => PEOPLE.map((_, p) => ({ v, p })));
  const need = [...verbs].sort((a, b) => petals(b, painted) - petals(a, painted)); // sort is stable: the older verb first on a tie
  const produce = [], room = Math.min(PRODUCED, DAILY - paintedToday(painted, day));
  for (const v of need) {
    const left = PEOPLE.map((_, p) => PER_FORM - (painted[key(v, p)]?.n ?? 0));
    for (let p = 0; produce.length < room && left[0] + left[1] > 0; p = 1 - p) if (left[p] > 0) { left[p]--; produce.push({ v, p }); }
  }
  const rest = shuffle(forms), used = {};
  const picks = [...produce, ...rest.slice(0, PRODUCED - produce.length), ...shuffle(forms).slice(0, ROUND - PRODUCED)];
  return shuffle(picks.map(({ v, p }, i) => {
    const seen = used[key(v, p)] = (used[key(v, p)] ?? -1) + 1; // the same form twice gets a different sentence
    const line = v.lines[seen % v.lines.length], answer = v.forms[p];
    const others = v.forms.filter(f => f !== answer);
    const rival = v.forms[1 - p]; // always among the options: telling yo from tú is the point
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
  ...v.lines.flatMap(l => PEOPLE.map((_, p) => fill(l, v.forms[p]))),
]);
