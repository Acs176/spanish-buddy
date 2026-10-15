import { useEffect, useMemo, useState } from "react";
import Mascot from "./Mascot.jsx";

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
  <button className="speak" onClick={e => { e.stopPropagation(); speak(text); }} aria-label="Anhören">🔊</button>
);

function greeting() {
  const h = new Date().getHours();
  return h < 13 ? "¡Buenos días!" : h < 21 ? "¡Buenas tardes!" : "¡Buenas noches!";
}

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
function Home({ words, progress, go }) {
  const latest = words[words.length - 1];
  const due = words.filter(w => isDue(progress[w.id])).length;
  const learned = words.filter(w => (progress[w.id]?.box ?? 0) >= 3).length;
  return (
    <div className="screen">
      <Mascot mood="idle" say={greeting()} />
      <section className="card wotd" onClick={() => speak(latest.es)}>
        <small>Wort des Tages · {new Date(latest.added).toLocaleDateString("de-DE", { day: "numeric", month: "long" })}</small>
        <h1>{latest.es} <Speak text={latest.es} /></h1>
        <p className="de">{latest.de}</p>
        <p className="tip">💡 {latest.tip}</p>
      </section>
      <div className="stats">
        <div><b>{words.length}</b><span>Wörter</span></div>
        <div><b>{learned}</b><span>gelernt</span></div>
        <div><b>{due}</b><span>fällig</span></div>
      </div>
      <button className="btn primary" onClick={() => go("cards")}>🃏 Karteikarten{due ? ` (${due})` : ""}</button>
      <button className="btn" onClick={() => go("practice")}>🎯 Üben</button>
      <button className="btn ghost" onClick={() => go("list")}>📖 Alle Wörter</button>
    </div>
  );
}

const Top = ({ done, progress }) => (
  <header className="top">
    <button className="close" onClick={done} aria-label="Schließen">✕</button>
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
      <Mascot mood="happy" say={total ? "¡Genial! Alles wiederholt 🎉" : "Heute ist nichts fällig. ¡Hasta mañana!"} />
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
      <Mascot mood={mood} size={90} />
      <div className={`flip ${flipped ? "flipped" : ""}`} onClick={() => { setFlipped(true); if (!flipped) speak(w.es); }}>
        <div className="face front card">
          <h1>{w.es}</h1>
          <small>Tippen zum Umdrehen</small>
        </div>
        <div className="face back card">
          <h2>{w.es} <Speak text={w.es} /></h2>
          <p className="de">{w.de}</p>
          <p className="tip">💡 {w.tip}</p>
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
      <Mascot mood={score >= 7 ? "happy" : "idle"} say={`${score} von ${qs.length} richtig! ${score >= 7 ? "¡Olé! 🎉" : "¡Ánimo! 💪"}`} />
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
      <Mascot mood={!chosen ? "idle" : ok ? "happy" : "sad"} size={90} say={q.prompt} />
      <section className="card question">
        {q.kind === "cloze" && <><h2>{q.sentence.split("___").reduce((a, b) => <>{a}<span className="blank">{chosen ? q.answer : "____"}</span>{b}</>)}</h2><small>{q.hint}</small></>}
        {q.kind === "meaning" && <h1>{q.big} <Speak text={q.big} /></h1>}
        {q.kind === "listen" && <button className="big-speak" onClick={() => speak(q.answer)}>🔊</button>}
      </section>
      <div className="options">
        {q.options.map(o => (
          <button key={o} onClick={() => choose(o)}
            className={`opt ${chosen && o === q.answer ? "right" : ""} ${chosen === o && !ok ? "wrong" : ""}`}>{o}</button>
        ))}
      </div>
      {chosen && (
        <div className={`feedback ${ok ? "good" : "bad"}`}>
          <b>{ok ? "¡Muy bien! 🎉" : "Fast! Richtig ist:"}</b>
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
      {list.map(w => (
        <section key={w.id} className="card item" onClick={() => setOpen(open === w.id ? null : w.id)}>
          <div className="item-head">
            <div><b>{w.es}</b><span className="de">{w.de}</span></div>
            <span className="stars">{"★".repeat(Math.min(progress[w.id]?.box ?? 0, 5)).padEnd(5, "☆")}</span>
            <Speak text={w.es} />
          </div>
          {open === w.id && <>
            <p className="tip">💡 {w.tip}</p>
            <ul className="examples">
              {w.examples.map(e => <li key={e.es}><Speak text={e.es} /><div><b>{e.es}</b><span>{e.de}</span></div></li>)}
            </ul>
          </>}
        </section>
      ))}
    </div>
  );
}
