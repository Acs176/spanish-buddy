// Spaced repetition, modelled on Anki's v2 scheduler.
// A card is { st: "learn" | "review", step, ivl, ease, due, lapses, seen }:
//   learn  = in the learning steps (or relearning after a lapse, when ivl is set); due is a timestamp in ms
//   review = graduated; due is a day number, ivl is the interval in days
// A word with no card yet is "new". Ratings: 1 Again, 2 Hard, 3 Good, 4 Easy.
// ponytail: no fuzz, no overdue bonus, no review-per-day cap; add them if the deck grows past a few hundred words.
const MIN = 6e4, DAY = 864e5;
const LEARN = [1, 10], RELEARN = [10]; // minutes
const NEW_PER_DAY = 20, LEARN_AHEAD = 20; // minutes: a learning card due this soon is shown when nothing else is

// Anki's day starts at 4am local time
export const today = (t = Date.now()) => Math.floor((t - new Date(t).getTimezoneOffset() * MIN - 4 * 36e5) / DAY);

export function schedule(card, rating, now = Date.now(), day = today(now)) {
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

// what is waiting: learning cards (due now or within the learn-ahead window), reviews due today, and today's new words
function queues(words, cards, now, day) {
  const seen = words.filter(w => cards[w.id]);
  const byDue = (a, b) => cards[a.id].due - cards[b.id].due;
  const newToday = seen.filter(w => cards[w.id].seen === day).length;
  return {
    learn: seen.filter(w => cards[w.id].st === "learn" && cards[w.id].due <= now + LEARN_AHEAD * MIN).sort(byDue),
    rev: seen.filter(w => cards[w.id].st === "review" && cards[w.id].due <= day).sort(byDue),
    fresh: words.filter(w => !cards[w.id]).slice(0, Math.max(0, NEW_PER_DAY - newToday)), // oldest words first, like Anki
  };
}

export function dueCount(words, cards, now = Date.now(), day = today(now)) {
  const q = queues(words, cards, now, day);
  return q.learn.length + q.rev.length + q.fresh.length;
}

// the next word to show: learning cards that are due, then reviews, then new words, then a learning card ahead of time
export function pickNext(words, cards, now = Date.now(), day = today(now)) {
  const { learn, rev, fresh } = queues(words, cards, now, day);
  if (learn[0] && cards[learn[0].id].due <= now) return learn[0];
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
