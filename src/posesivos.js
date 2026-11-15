// ¿De quién es?: the objects and the possessive forms.
// p: 0 yo (Angela), 1 tú (Adrián), 2 él (Mr. Lock 'em up), 3 nosotros (Angela + Adrián), 4 vosotros (Adrián + Mr. Lock 'em up), 5 ellos (Bojack y Diane).
// kind: "atono" (mis llaves), "tonico" (estas llaves son mías), "articulo" (¿y las mías?)

// useful everyday things, balanced over el / la / los / las; big ones fall as "objeto gordo"
export const OBJECTS = [
  { es: "el móvil", de: "das Handy", e: "📱" }, { es: "el cargador", de: "das Ladegerät", e: "🔌" },
  { es: "el paraguas", de: "der Regenschirm", e: "☂️" }, { es: "el reloj", de: "die Uhr", e: "⌚" },
  { es: "el monedero", de: "der Geldbeutel", e: "👛" }, { es: "el cepillo de dientes", de: "die Zahnbürste", e: "🪥" },
  { es: "el jabón", de: "die Seife", e: "🧼" }, { es: "el abrigo", de: "der Mantel", e: "🧥" },
  { es: "el bolígrafo", de: "der Kuli", e: "🖊️" }, { es: "el cuaderno", de: "das Heft", e: "📓" },
  { es: "el portátil", de: "der Laptop", e: "💻" }, { es: "el despertador", de: "der Wecker", e: "⏰" },
  { es: "el queso", de: "der Käse", e: "🧀" }, { es: "el tenedor", de: "die Gabel", e: "🍴" }, { es: "el cuchillo", de: "das Messer", e: "🔪" },
  { es: "la mochila", de: "der Rucksack", e: "🎒" }, { es: "la maleta", de: "der Koffer", e: "🧳" },
  { es: "la taza", de: "die Tasse", e: "☕" }, { es: "la cuchara", de: "der Löffel", e: "🥄" },
  { es: "la bufanda", de: "der Schal", e: "🧣" }, { es: "la camiseta", de: "das T-Shirt", e: "👕" },
  { es: "la linterna", de: "die Taschenlampe", e: "🔦" }, { es: "la vela", de: "die Kerze", e: "🕯️" },
  { es: "la escoba", de: "der Besen", e: "🧹" }, { es: "la crema solar", de: "die Sonnencreme", e: "🧴" },
  { es: "la tarjeta", de: "die Karte", e: "💳" }, { es: "la cámara", de: "die Kamera", e: "📷" },
  { es: "los zapatos", de: "die Schuhe", e: "👟" }, { es: "los calcetines", de: "die Socken", e: "🧦" },
  { es: "los guantes", de: "die Handschuhe", e: "🧤" }, { es: "los auriculares", de: "die Kopfhörer", e: "🎧" },
  { es: "los libros", de: "die Bücher", e: "📚" }, { es: "los pantalones", de: "die Hose", e: "👖" },
  { es: "los platos", de: "die Teller", e: "🍽️" },
  { es: "las llaves", de: "die Schlüssel", e: "🔑" }, { es: "las gafas", de: "die Brille", e: "👓" },
  { es: "las gafas de sol", de: "die Sonnenbrille", e: "🕶️" }, { es: "las tijeras", de: "die Schere", e: "✂️" },
  { es: "las pilas", de: "die Batterien", e: "🔋" }, { es: "las chanclas", de: "die Flip-Flops", e: "🩴" },
  { es: "las botas", de: "die Stiefel", e: "🥾" },
  { es: "el sofá", de: "das Sofa", e: "🛋️", big: true }, { es: "la cama", de: "das Bett", e: "🛏️", big: true },
  { es: "la bici", de: "das Fahrrad", e: "🚲", big: true }, { es: "el coche", de: "das Auto", e: "🚗", big: true },
];

export function info(o) {
  const [art, ...rest] = o.es.split(" ");
  return { art, noun: rest.join(" "), g: art === "el" || art === "los" ? "m" : "f", pl: art.endsWith("s") };
}

const end = (g, pl) => (g === "m" ? "o" : "a") + (pl ? "s" : "");
export function form(kind, p, g, pl) {
  const f = p === 3 ? "nuestr" + end(g, pl) : p === 4 ? "vuestr" + end(g, pl)
    : kind === "atono" ? ["mi", "tu", "su", , , "su"][p] + (pl ? "s" : "")
    : ["mí", "tuy", "suy", , , "suy"][p] + end(g, pl);
  return kind === "articulo" ? `${g === "m" ? (pl ? "los" : "el") : (pl ? "las" : "la")} ${f}` : f;
}

export function shuffle(a, rnd = Math.random) {
  a = [...a];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

// hard on purpose: every wrong option is a real form of the same kind, preferably off by just one thing
// (the person, the gender or the number), so each one could make sense
export function options(kind, p, g, pl, rnd = Math.random) {
  const a = form(kind, p, g, pl), near = [], far = [];
  for (const q of [0, 1, 2, 3, 4, 5]) for (const h of ["m", "f"]) for (const n of [false, true]) {
    const f = form(kind, q, h, n);
    if (f !== a) ((q !== p) + (h !== g) + (n !== pl) === 1 ? near : far).push(f);
  }
  const wrong = [...new Set([...shuffle(near, rnd), ...shuffle(far, rnd)])].slice(0, 3);
  return shuffle([a, ...wrong], rnd);
}

// someone outside the owners, to compare with
const REF = ["Mr. Lock 'em up", "Mr. Lock 'em up", "Adrián", "Mr. Lock 'em up", "Diane", "Adrián"];
const cap = s => s[0].toUpperCase() + s.slice(1);
// the sentence around the gap, said by Angela
export function sentence(kind, p, o) {
  const { art, noun, g, pl } = info(o), es = pl ? "son" : "es";
  const dem = g === "m" ? (pl ? "estos" : "este") : (pl ? "estas" : "esta");
  if (kind === "atono") return [`${cap(es)} `, ` ${noun}.`];
  const to = ["", "Adrián", "", "", "Chicos", ""][p]; // tú and vosotros: she asks them
  if (kind === "tonico") return to ? [`${to}, ¿${dem} ${noun} ${es} `, "?"] : [`${cap(dem)} ${noun} ${es} `, "."];
  return [`Aquí ${pl ? "están" : "está"} ${art} ${noun} de ${REF[p]}. ¿Y `, "?"];
}

export function hint(kind, p, o) {
  const { art, noun, g, pl } = info(o), a = form(kind, p, g, pl);
  const what = `${art} ${noun} ist ${g === "m" ? "maskulin" : "feminin"}${pl ? " und Plural" : ""}`;
  const su = p === 2 || p === 5 ? " su ist sein, ihr, Ihr, ihr: für einen und für mehrere Besitzer gleich." : "";
  if (kind === "atono") return `${what} → ${a}. ${p === 3 || p === 4 ? "nuestro/vuestro passen sich in Geschlecht und Zahl an." : "mi/tu/su ändern nur die Zahl, nie das Geschlecht."}${su}`;
  if (kind === "tonico") return `Nach ser steht die betonte Form, und die passt sich an: ${what} → ${a}.${su}`;
  return `„Und meine/deine…?": Artikel + betonte Form, beide wie ${art} ${noun} → ${a}.`;
}

// new words first: the ones not in her word list, then the ones she knows; big ones are kept for "objeto gordo"
export function deck(known, rnd = Math.random) {
  const small = OBJECTS.filter(o => !o.big), isKnown = o => known.has(info(o).noun);
  return [...shuffle(small.filter(o => !isKnown(o)), rnd), ...shuffle(small.filter(isKnown), rnd)];
}
