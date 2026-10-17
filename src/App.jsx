import { useEffect, useMemo, useState } from "react";
import Mascot from "./Adrian.jsx";
import Angela from "./Angela.jsx";

// ---------- helpers ----------
const DAY = 864e5;
const today = () => Math.floor(Date.now() / DAY);
const shuffle = a => [...a].sort(() => Math.random() - 0.5); // ponytail: biased shuffle, fine for 4 options
const pick = (arr, n, not) => shuffle(arr.filter(x => x !== not)).slice(0, n);

// Leitner boxes: box n -> next review in INTERVALS[n] days
const INTERVALS = [0, 1, 2, 4, 8, 16, 32];
const isDue = p => !p || p.due <= today();

function load() {
  try { return JSON.parse(localStorage.getItem("progress")) || {}; } catch { return {}; }
}
function save(p) {
  try { localStorage.setItem("progress", JSON.stringify(p)); } catch { /* private mode: progress just won't stick */ }
}

export function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const u = new SpeechSynthesisUtterance(text.replace(/[¿?¡!]/g, ""));
  u.lang = "es-ES";
  u.voice = speechSynthesis.getVoices().find(v => v.lang === "es-ES") || null;
  u.rate = 0.9;
  speechSynthesis.cancel();
  speechSynthesis.speak(u);
}

const Speak = ({ text }) => (
  <button className="speak" onClick={e => { e.stopPropagation(); speak(text); }} aria-label="Anhören">
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6.5 9H3.5v6h3L11 19Z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
  </button>
);

function greeting(now) {
  const h = now.getHours();
  return h < 13 ? "¡Buenos días!" : h < 21 ? "¡Buenas tardes!" : "¡Buenas noches!";
}

// re-renders every minute so the date and greeting follow the clock (also after the PWA sat in the background)
function useNow() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 6e4); return () => clearInterval(t); }, []);
  return now;
}

const localDay = d => d.toLocaleDateString("sv"); // "sv" formats as YYYY-MM-DD, in local time

// shown when no word was added today; one per day, rotating
const NO_WORD = [
  ["¡Ay, caramba!", "Adrián hat dir heute noch keine palabra española del día geschickt. Schau nur, wie traurig er guckt! Stups ihn mal an, am besten mit einem Herz. 💌"],
  ["¡Silencio total!", "Kein Wort von Adrián heute. Hat er's vergessen oder sucht er noch die perfekte… wie sagt man „Ausrede“? Genau: excusa. 😏"],
  ["¡Paciencia!", "Das Wort des Tages steckt noch beim Postboten. Oder bei Adrián. Frag ihn ganz lieb, und bis dahin: eine Runde Karteikarten? 🐂"],
  ["¡Alarma!", "Adrián schuldet dir heute ein Wort. Ein süßes Nachrichtchen wirkt Wunder, und Adrián strahlt wieder. 💛"],
];

// ---------- app ----------
export default function App() {
  const [words, setWords] = useState(null);
  const [progress, setProgress] = useState(load);
  const [screen, setScreen] = useState("home");

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "words.json", { cache: "no-cache" })
      .then(r => r.json()).then(d => setWords(d.words))
      .catch(() => setWords([]));
  }, []);

  const review = (id, ok) => setProgress(prev => {
    const box = ok ? Math.min((prev[id]?.box ?? 0) + 1, INTERVALS.length - 1) : 0;
    const next = { ...prev, [id]: { box, due: today() + INTERVALS[box] } };
    save(next);
    return next;
  });

  if (!words) return <div className="screen center"><Mascot mood="talk" /></div>;
  if (!words.length) return <div className="screen center"><Mascot mood="sad" say="Keine Wörter gefunden… Internet an?" /></div>;

  const home = () => setScreen("home");
  if (screen === "cards") return <Flashcards words={words} progress={progress} review={review} done={home} />;
  if (screen === "practice") return <Practice words={words} done={home} />;
  if (screen === "list") return <WordList words={words} progress={progress} done={home} />;
  return <Home words={words} progress={progress} go={setScreen} />;
}

// ---------- home ----------
// four-petal azulejo flower, painted in as words are learned
const FLOWER = (
  <>
    <g className="p2">{[45, 135, 225, 315].map(r => <ellipse key={r} cx="50" cy="30" rx="8" ry="15" transform={`rotate(${r} 50 50)`} />)}</g>
    <g className="p1">{[0, 90, 180, 270].map(r => <ellipse key={r} cx="50" cy="26" rx="11" ry="20" transform={`rotate(${r} 50 50)`} />)}</g>
  </>
);
const Orn = () => (
  <div className="orn" aria-hidden="true">
    <i />
    <svg viewBox="0 0 24 24" width="20" height="20">
      <g fill="#2f4f9d">{[0, 90, 180, 270].map(r => <ellipse key={r} cx="12" cy="6.5" rx="3" ry="5.5" transform={`rotate(${r} 12 12)`} />)}</g>
      <circle cx="12" cy="12" r="2.6" fill="#c4572f" /><circle cx="12" cy="12" r=".9" fill="#e0b050" />
    </svg>
    <i />
  </div>
);
const Entry = ({ w }) => (
  <div className="entry">
    <p><i>{POS[w.type] || w.type}</i> <b>1.</b> {w.de}</p>
    <p className="note"><i>Hinweis.</i> {w.tip}</p>
  </div>
);
// five little azulejo flowers instead of stars: one per Leitner box reached
const Bloom = ({ n }) => (
  <span className="bloom" role="img" aria-label={`Stufe ${n} von 5`}>
    {[0, 1, 2, 3, 4].map(i => (
      <svg key={i} viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <g fill={i < n ? "#2f4f9d" : "#dfe5f1"}>{[0, 90, 180, 270].map(r => <ellipse key={r} cx="12" cy="6.5" rx="3.4" ry="5.5" transform={`rotate(${r} 12 12)`} />)}</g>
        <circle cx="12" cy="12" r="2.8" fill={i < n ? "#c4572f" : "#c9d2e6"} />
      </svg>
    ))}
  </span>
);
const POS = { adjective: "Adjektiv", adverb: "Adverb", expression: "Ausdruck", noun: "Nomen", other: "Wort" };
function Home({ words, progress, go }) {
  const now = useNow();
  const latest = words[words.length - 1];
  const wotd = latest.added === localDay(now) ? latest : null;
  const [emptyTitle, emptyMsg] = NO_WORD[Math.floor(now / DAY) % NO_WORD.length];
  const due = words.filter(w => isDue(progress[w.id])).length;
  const learned = words.filter(w => (progress[w.id]?.box ?? 0) >= 3).length;
  return (
    <div className="screen home">
      <Mascot mood={wotd ? "idle" : "sad"} size={104} say={greeting(now)} />
      <section className={`card wotd ${wotd ? "" : "empty"}`}>
        {wotd && <div className="seal" aria-label="Wort des Tages"><span>Wort<br />des Tages</span></div>}
        <time className="stamp" dateTime={localDay(now)}>
          <span>{now.toLocaleDateString("de-DE", { month: "short" })}</span>
          <b>{now.getDate()}</b>
        </time>
        {wotd ? <>
          <h1>{wotd.es} <Speak text={wotd.es} /></h1>
          <Orn />
          <Entry w={wotd} />
        </> : <>
          <h1>{emptyTitle}</h1>
          <Orn />
          <p className="entry">{emptyMsg}</p>
        </>}
      </section>
      <div className="progress">
        <svg viewBox="0 0 104 104" width="104" height="104" role="img" aria-label={`${learned} von ${words.length} gelernt`}>
          <defs><clipPath id="glaze"><rect x="0" y={104 - 104 * learned / words.length} width="104" height="104" /></clipPath></defs>
          <rect x="2" y="2" width="100" height="100" rx="8" className="tile" />
          <rect x="8" y="8" width="88" height="88" rx="4" className="tile-inner" />
          <g transform="translate(2 2)" className="flower-off">{FLOWER}</g>
          <g transform="translate(2 2)" clipPath="url(#glaze)" className="flower-on">{FLOWER}</g>
          <circle cx="52" cy="52" r="19" className="tile-dot" />
          <text x="52" y="61" textAnchor="middle">{learned}</text>
        </svg>
        <p><b>{due} fällig</b><span>{learned} von {words.length} Wörtern gelernt</span></p>
      </div>
      <nav className="tabs">
        {[
          // baraja española: a fanned deck, espadas, copas
          ["cards", "Karteikarten", <><rect x="6.5" y="4" width="11" height="16" rx="1.6" transform="rotate(-15 12 21)" fill="#dfe5f1" /><rect x="6.5" y="4" width="11" height="16" rx="1.6" transform="rotate(15 12 21)" fill="#f4d9cd" /><rect x="6.5" y="4" width="11" height="16" rx="1.6" fill="#fffdf8" /><circle cx="12" cy="12" r="3.4" fill="#e0b050" /><circle cx="12" cy="12" r="1.2" fill="#c4572f" stroke="none" /></>, due],
          ["practice", "Üben", <><path d="M12 1.5 14.4 14H9.6Z" fill="#2f4f9d" /><path d="M6.5 14h11v2.2h-11Z" fill="#e0b050" /><path d="M11 16.2h2V21h-2Z" fill="#2f4f9d" stroke="none" /><circle cx="12" cy="22" r="1.4" fill="#c4572f" stroke="none" /></>],
          ["list", "Alle Wörter", <><path d="M5.5 3h13c0 7-2.4 10.5-6.5 10.5S5.5 10 5.5 3Z" fill="#e0b050" /><path d="M12 13.5V19M8 21h8" /></>],
        ].map(([id, label, icon, n]) => (
          <button key={id} onClick={() => go(id)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{icon}</svg>
            <span>{label}</span>
            {n > 0 && <i>{n}</i>}
          </button>
        ))}
      </nav>
    </div>
  );
}

// Adrián guides (prompts, greetings), Ángela is the learner and reacts to her answers
const Duo = ({ adrian = "idle", angela = "idle", say, size = 84 }) => (
  <div className="duo"><Mascot mood={adrian} size={size} say={say} /><Angela mood={angela} size={size} /></div>
);

const Top = ({ done, progress }) => (
  <header className="top">
    <button className="close" onClick={done} aria-label="Schließen">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
    </button>
    {progress != null && <div className="bar"><i style={{ width: `${progress * 100}%` }} /></div>}
  </header>
);

// ---------- flashcards ----------
function Flashcards({ words, progress, review, done }) {
  // ponytail: queue built once per session; "Nochmal" cards go to the back
  const [queue, setQueue] = useState(() => shuffle(words.filter(w => isDue(progress[w.id]))).slice(0, 20));
  const [total] = useState(queue.length);
  const [flipped, setFlipped] = useState(false);
  const [mood, setMood] = useState("idle");

  if (!queue.length) return (
    <div className="screen center">
      <Top done={done} />
      <Duo adrian="happy" angela="happy" say={total ? "¡Genial! Alles wiederholt!" : "Heute ist nichts fällig. ¡Hasta mañana!"} />
      <button className="btn primary" onClick={done}>Weiter</button>
    </div>
  );

  const w = queue[0];
  const answer = ok => {
    review(w.id, ok);
    setMood(ok ? "happy" : "sad");
    setFlipped(false);
    setQueue(q => ok ? q.slice(1) : [...q.slice(1), q[0]]);
    setTimeout(() => setMood("idle"), 700);
  };

  return (
    <div className="screen">
      <Top done={done} progress={1 - queue.length / total} />
      <Duo angela={mood} />
      <div className={`flip ${flipped ? "flipped" : ""}`} onClick={() => { setFlipped(true); if (!flipped) speak(w.es); }}>
        <div className="face front card">
          <h1>{w.es}</h1>
          <Orn />
          <small>Tippen zum Umdrehen</small>
        </div>
        <div className="face back card">
          <h2>{w.es} <Speak text={w.es} /></h2>
          <Orn />
          <Entry w={w} />
          <ul className="examples">
            {w.examples.map(e => <li key={e.es}><Speak text={e.es} /><div><b>{e.es}</b><span>{e.de}</span></div></li>)}
          </ul>
        </div>
      </div>
      {flipped && (
        <div className="row">
          <button className="btn bad" onClick={() => answer(false)}>Nochmal</button>
          <button className="btn good" onClick={() => answer(true)}>Gewusst ✓</button>
        </div>
      )}
    </div>
  );
}

// ---------- practice ----------
function makeQuestions(words) {
  return shuffle(words).slice(0, 10).map((w, i) => {
    const others = words.filter(o => o !== w);
    const kind = ["cloze", "meaning", "listen"][i % 3];
    if (kind === "cloze") return {
      kind, w, prompt: "Ergänze den Satz", sentence: w.cloze.es, hint: w.cloze.de,
      answer: w.cloze.answer, options: shuffle([w.cloze.answer, ...w.cloze.distractors ?? w.distractors]),
    };
    if (kind === "meaning") return {
      kind, w, prompt: "Was bedeutet…", big: w.es,
      answer: w.de, options: shuffle([w.de, ...pick(others, 3).map(o => o.de)]),
    };
    return {
      kind, w, prompt: "Was hörst du?",
      answer: w.es, options: shuffle([w.es, ...pick(others, 3).map(o => o.es)]),
    };
  });
}

function Practice({ words, done }) {
  const [qs, setQs] = useState(() => makeQuestions(words));
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const q = qs[i];

  useEffect(() => { if (q?.kind === "listen") speak(q.answer); }, [q]);

  if (!q) return (
    <div className="screen center">
      <Top done={done} />
      <Duo adrian={score >= 7 ? "happy" : "idle"} angela={score >= 7 ? "happy" : "idle"} say={`${score} von ${qs.length} richtig! ${score >= 7 ? "¡Olé!" : "¡Ánimo!"}`} />
      <button className="btn primary" onClick={() => { setQs(makeQuestions(words)); setI(0); setScore(0); }}>Nochmal üben</button>
      <button className="btn ghost" onClick={done}>Fertig</button>
    </div>
  );

  const ok = chosen === q.answer;
  const choose = o => {
    if (chosen) return;
    setChosen(o);
    if (o === q.answer) setScore(s => s + 1);
    speak(q.kind === "cloze" ? q.sentence.replace("___", q.answer) : q.w.es);
  };
  const next = () => { setChosen(null); setI(i + 1); };

  return (
    <div className="screen">
      <Top done={done} progress={i / qs.length} />
      <Duo angela={!chosen ? "idle" : ok ? "happy" : "sad"} say={q.prompt} />
      <section className="card question">
        {q.kind === "cloze" && <><h2>{q.sentence.split("___").reduce((a, b) => <>{a}<span className="blank">{chosen ? q.answer : "____"}</span>{b}</>)}</h2><small>{q.hint}</small></>}
        {q.kind === "meaning" && <h1>{q.big} <Speak text={q.big} /></h1>}
        {q.kind === "listen" && <button className="big-speak" onClick={() => speak(q.answer)} aria-label="Anhören">
          <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6.5 9H3.5v6h3L11 19Z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
        </button>}
      </section>
      <div className="options">
        {q.options.map(o => (
          <button key={o} onClick={() => choose(o)}
            className={`opt ${chosen && o === q.answer ? "right" : ""} ${chosen === o && !ok ? "wrong" : ""}`}>{o}</button>
        ))}
      </div>
      {chosen && (
        <div className={`feedback ${ok ? "good" : "bad"}`}>
          <b>{ok ? "¡Muy bien!" : "Fast! Richtig ist:"}</b>
          {!ok && <span>{q.answer}</span>}
          <button className="btn" onClick={next}>Weiter</button>
        </div>
      )}
    </div>
  );
}

// ---------- word list ----------
function WordList({ words, progress, done }) {
  const [open, setOpen] = useState(null);
  const list = useMemo(() => [...words].reverse(), [words]);
  return (
    <div className="screen">
      <Top done={done} />
      <h2 className="title">Alle Wörter</h2>
      <Orn />
      {list.map(w => (
        <section key={w.id} className="card item" onClick={() => setOpen(open === w.id ? null : w.id)}>
          <div className="item-head">
            <div><b>{w.es}</b><span className="de">{w.de}</span></div>
            <Bloom n={Math.min(progress[w.id]?.box ?? 0, 5)} />
            <Speak text={w.es} />
          </div>
          {open === w.id && <>
            <Orn />
            <Entry w={w} />
            <ul className="examples">
              {w.examples.map(e => <li key={e.es}><Speak text={e.es} /><div><b>{e.es}</b><span>{e.de}</span></div></li>)}
            </ul>
          </>}
        </section>
      ))}
    </div>
  );
}
