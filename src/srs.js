// Spaced repetition, modelled on Anki's v2 scheduler.
// A card is { st: "learn" | "review", step, ivl, ease, due, lapses, seen, last }:
//   learn  = in the learning steps (or relearning after a lapse, when ivl is set); due is a timestamp in ms
//   review = graduated; due is a day number, ivl is the interval in days
//   seen = day the card was first answered, last = day it was last answered
// A word has two cards, like Anki's "Basic (and reversed)": recognition (Spanish -> German, key = word id) and
// production (German -> Spanish, key = word id + ":p"). The production card only appears once the recognition card
// has settled, and the two never show on the same day. A card that does not exist yet is "new".
// Ratings: 1 Again, 2 Hard, 3 Good, 4 Easy.
// ponytail: no fuzz, no overdue bonus, no review-per-day cap; add them if the deck grows past a few hundred words.
const MIN = 6e4, DAY = 864e5;
const LEARN = [1, 10], RELEARN = [10]; // minutes
const NEW_PER_DAY = 20, PROD_PER_DAY = 10, LEARN_AHEAD = 20; // LEARN_AHEAD: minutes
const UNLOCK_IVL = 4; // days: the production card appears when the recognition card reaches this interval
const PROD = ":p";

// Anki's day starts at 4am local time
export const today = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * MIN - 4 * 36e5) / DAY);

function next(card, rating, now, day) {
  const c = card ?? { st: "learn", step: 0, ease: 2.5, lapses: 0, seen: day };
  if (c.st === "review") {
    const hard = Math.max(c.ivl + 1, Math.round(c.ivl * 1.2));
    const good = Math.max(hard + 1, Math.round(c.ivl * c.ease));
    const easy = Math.max(good + 1, Math.round(c.ivl * c.ease * 1.3));
    if (rating === 1) return { ...c, st: "learn", step: 0, ivl: 1, ease: Math.max(1.3, c.ease - 0.2), lapses: c.lapses + 1, due: now + RELEARN[0] * MIN };
    const ivl = [0, 0, hard, good, easy][rating];
    return { ...c, ivl, ease: Math.max(1.3, c.ease + [0, 0, -0.15, 0, 0.15][rating]), due: day + ivl };
  }
  const steps = c.ivl ? RELEARN : LEARN; // ivl already set means a lapsed card being relearned
  const wait = (step, mins) => ({ ...c, step, due: now + mins * MIN });
  const graduate = ivl => ({ ...c, st: "review", ivl, due: day + ivl });
  if (rating === 1) return wait(0, steps[0]);
  if (rating === 2) return wait(c.step, c.step === 0 && steps.length > 1 ? (steps[0] + steps[1]) / 2 : steps[c.step]);
  if (rating === 3) return c.step + 1 < steps.length ? wait(c.step + 1, steps[c.step + 1]) : graduate(c.ivl || 1);
  return graduate(c.ivl ? c.ivl + 1 : 4);
}
export const schedule = (card, rating, now = Date.now(), day = today(now)) => ({ ...next(card, rating, now, day), last: day });

// every card that exists or could be introduced: { key, w, dir } for each word's recognition card, plus its
// production card once that is unlocked (and for good once it has been started)
function items(words, cards) {
  return words.flatMap(w => {
    const rec = cards[w.id], k = w.id + PROD;
    const prod = cards[k] || (rec && rec.st === "review" && rec.ivl >= UNLOCK_IVL);
    return prod ? [{ key: w.id, w, dir: "rec" }, { key: k, w, dir: "prod" }] : [{ key: w.id, w, dir: "rec" }];
  });
}

// what is waiting: learning cards (due now or within the learn-ahead window), reviews due today, and today's new cards
function queues(words, cards, now, day) {
  const all = items(words, cards);
  const buried = i => cards[i.dir === "rec" ? i.w.id + PROD : i.w.id]?.last === day; // the other card of this word was answered today
  const open = all.filter(i => !buried(i));
  const byDue = (a, b) => cards[a.key].due - cards[b.key].due;
  const newToday = dir => all.filter(i => i.dir === dir && cards[i.key]?.seen === day).length;
  const fresh = (dir, cap) => open.filter(i => i.dir === dir && !cards[i.key]).slice(0, Math.max(0, cap - newToday(dir)));
  return {
    learn: open.filter(i => cards[i.key]?.st === "learn" && cards[i.key].due <= now + LEARN_AHEAD * MIN).sort(byDue),
    rev: open.filter(i => cards[i.key]?.st === "review" && cards[i.key].due <= day).sort(byDue),
    fresh: [...fresh("rec", NEW_PER_DAY), ...fresh("prod", PROD_PER_DAY)], // oldest words first, like Anki
  };
}

export function dueCount(words, cards, now = Date.now(), day = today(now)) {
  const q = queues(words, cards, now, day);
  return q.learn.length + q.rev.length + q.fresh.length;
}

// the next card to show: learning cards that are due, then reviews, then new cards, then a learning card ahead of time
export function pickNext(words, cards, now = Date.now(), day = today(now)) {
  const { learn, rev, fresh } = queues(words, cards, now, day);
  if (learn[0] && cards[learn[0].key].due <= now) return learn[0];
  return rev[0] ?? fresh[0] ?? learn[0] ?? null;
}

// the text under a rating button: how long until this card comes back
export function wait(card, now = Date.now(), day = today(now)) {
  if (card.st === "learn") return `${Math.max(1, Math.round((card.due - now) / MIN))} Min`;
  const d = card.due - day;
  if (d < 30) return `${d} ${d === 1 ? "Tag" : "Tage"}`;
  return d < 365 ? `${Math.round(d / 30)} Mon` : `${+(d / 365).toFixed(1)} J`;
}

// azulejo flowers on the word list: 0 new, 1 learning, then by interval
export const stage = c => !c ? 0 : c.st === "learn" ? 1 : c.ivl < 7 ? 2 : c.ivl < 21 ? 3 : c.ivl < 60 ? 4 : 5;

// old Leitner progress ({ box, due }) -> cards, so nobody loses what they learned
export function fromLeitner(old, now = Date.now()) {
  const DAYS = [0, 1, 2, 4, 8, 16, 32];
  return Object.fromEntries(Object.entries(old).map(([id, p]) => [id, p.box
    ? { st: "review", ivl: DAYS[p.box], ease: 2.5, lapses: 0, due: p.due, seen: 0 }
    : { st: "learn", step: 0, ease: 2.5, lapses: 0, due: now, seen: 0 }]));
}

// typed answers: "ok", "accent" (right letters, wrong or missing accents) or "no". Ignores case, punctuation, a leading
// article, and either side of "ese / esa"; "bueno/a" also accepts "bueno". The ñ is a different letter, not an accent.
const strip = s => s.toLowerCase().replace(/[¿?¡!.,…]/g, "").replace(/\s+/g, " ").trim().replace(/^(el|la|los|las|un|una|unos|unas) /, "");
const plain = s => s.replace(/ñ/g, "§").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/§/g, "ñ");
export function check(input, es) {
  const answers = [es, ...es.split(" / "), es.replace(/\/\w+/g, "")].map(strip);
  const got = strip(input);
  if (answers.includes(got)) return "ok";
  return answers.some(a => plain(a) === plain(got)) ? "accent" : "no";
}

// ---------- Üben ----------
// how hard a word is for her: Üben misses, plus lapses and lost ease on both flashcards. 1 = nothing against it.
export function difficulty(id, cards, misses = {}) {
  const lost = c => c ? c.lapses + Math.max(0, 2.5 - c.ease) * 2 : 0;
  return 1 + (misses[id] || 0) + lost(cards[id]) + lost(cards[id + PROD]);
}
// n words, harder ones more likely, each at most once (Efraimidis–Spirakis weighted sampling)
export const pickHard = (words, weight, n) =>
  words.map(w => [Math.random() ** (1 / weight(w)), w]).sort((a, b) => b[0] - a[0]).slice(0, n).map(x => x[1]);
// a miss adds 2, a right answer takes 1 back: a missed word stays "hard" until she gets it right twice
export const miss = (misses, id, ok) => ({ ...misses, [id]: Math.max(0, (misses[id] || 0) + (ok ? -1 : 2)) });
