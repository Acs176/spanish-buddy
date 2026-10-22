import { useState } from "react";
import CARDS from "./postcards.js";
import { Speak, Top, speak } from "./App.jsx";

// ids of postcards she has opened; the mailbox shows a dot while any is unread
const readIds = () => { try { return JSON.parse(localStorage.getItem("read")) || []; } catch { return []; } };
export const hasUnread = () => { const r = readIds(); return CARDS.some(c => !r.includes(c.id)); };

const STAMPS = ["var(--blue)", "var(--red)", "var(--green)"];
const look = i => ({ "--tilt": `${i % 2 ? 1.2 : -1.2}deg`, "--stamp": STAMPS[i % STAMPS.length] });
const Blank = ({ s, fill }) => s.split("___").reduce((a, b) => <>{a}<span className="blank">{fill || "____"}</span>{b}</>);

// the picture side of a postcard: Adrián's letter on the left, stamp, postmark and "address" (the topic) on the right
function Front({ c, i, full, isNew, onClick }) {
  const Tag = onClick ? "button" : "article";
  return (
    <Tag className={`postcard ${full ? "open" : ""}`} style={look(i)} onClick={onClick}>
      <div className="pc-text hand">
        <span>Liebe Ángela,</span>
        <span className={full ? "" : "clamp"}>{c.letter}</span>
        {full && <span className="sign">Un beso,<br />Adrián</span>}
      </div>
      <i className="pc-line" />
      <div className="pc-side">
        <div className="pstamp" aria-hidden="true"><b>{c.stamp[0]}</b><small>{c.stamp[1]}</small></div>
        <span className="addr">{c.title}</span>
      </div>
      <span className="postmark" aria-hidden="true">Nº {i + 1}</span>
      {isNew && <span className="pc-new">Neu</span>}
    </Tag>
  );
}

export default function Postcards({ done }) {
  const [open, setOpen] = useState(null);
  const [read, setRead] = useState(readIds);
  if (open) return <Postcard c={open} i={CARDS.indexOf(open)} done={() => setOpen(null)} />;
  const show = c => {
    const r = read.includes(c.id) ? read : [...read, c.id];
    setRead(r);
    try { localStorage.setItem("read", JSON.stringify(r)); } catch { /* private mode */ }
    setOpen(c);
    window.scrollTo(0, 0);
  };
  return (
    <div className="screen">
      <Top done={done} />
      <h2 className="title">Postkarten</h2>
      <p className="sub">von Adrián, mit Liebe aus España</p>
      <div className="feed">
        {CARDS.map((c, i) => <Front key={c.id} c={c} i={i} isNew={!read.includes(c.id)} onClick={() => show(c)} />)}
      </div>
    </div>
  );
}

// the whole page is a little pile of mail: the postcard, then more cards written on, a taped note and a reply card
function Postcard({ c, i, done }) {
  return (
    <div className="screen post">
      <Top done={done} />
      <Front c={c} i={i} full />
      <section className="paper" style={look(i + 1)}>
        <h2 className="hand">Ein bisschen Geschichte</h2>
        {c.why.map(r => <div key={r.h} className="rule"><h3 className="hand">{r.h}</h3><p>{r.p}</p></div>)}
      </section>
      <section className="paper" style={look(i)}>
        <h2 className="hand">{c.title}</h2>
        {c.rule.map(r => <div key={r.h} className="rule"><h3 className="hand">{r.h}</h3><p>{r.p}</p></div>)}
        <p className="merk hand">{c.tip}</p>
      </section>
      <section className="paper" style={look(i + 1)}>
        <h3 className="hand">Gleiche Wörter, andere Bedeutung</h3>
        <ul className="pairs">
          {c.pairs.map(([a, b]) => (
            <li key={a.es}>
              <div><b>{a.es}</b><span>{a.de}</span></div>
              <i aria-hidden="true">↔</i>
              <div><b>{b.es}</b><span>{b.de}</span></div>
            </li>
          ))}
        </ul>
      </section>
      <section className="paper" style={look(i)}>
        <h3 className="hand">Beispiele</h3>
        <ul className="examples">
          {c.examples.map(e => <li key={e.es}><Speak text={e.es} /><div><b>{e.es}</b><span>{e.de}</span></div></li>)}
        </ul>
      </section>
      <section className="note"><b className="hand">¡Ojo!</b>{c.trap}</section>
      <Quiz key={c.id} quiz={c.quiz} style={look(i + 1)} />
    </div>
  );
}

function Quiz({ quiz, style }) {
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null);
  const [score, setScore] = useState(0);
  const q = quiz[i];

  if (!q) return (
    <section className="paper reply done" style={style}>
      <h3 className="label">Respuesta · Antwortkarte</h3>
      <p className="q">{score} von {quiz.length} richtig</p>
      <p>{score === quiz.length ? "¡Perfecto! Adrián ist stolz auf dich. 💌" : "¡Casi! Lies die Karte nochmal und versuch's gleich wieder."}</p>
      <button className="btn" onClick={() => { setI(0); setScore(0); }}>Nochmal</button>
    </section>
  );

  const choose = o => {
    if (chosen) return;
    setChosen(o);
    if (o === q.answer) setScore(s => s + 1);
    speak(q.es.replace("___", q.answer));
  };
  return (
    <section className="paper reply" style={style}>
      <header>
        <h3 className="label">Respuesta · Antwortkarte</h3>
        <span className="pstamp mini" aria-label={`Frage ${i + 1} von ${quiz.length}`}><b>{i + 1}</b><small>von {quiz.length}</small></span>
      </header>
      <p className="q"><Blank s={q.es} fill={chosen && q.answer} /></p>
      <small>{q.de}</small>
      <div className="options">
        {q.options.map(o => (
          <button key={o} onClick={() => choose(o)}
            className={`opt ${chosen && o === q.answer ? "right" : ""} ${chosen === o && o !== q.answer ? "wrong" : ""}`}>{o}</button>
        ))}
      </div>
      {chosen && <button className="btn primary" onClick={() => { setChosen(null); setI(i + 1); }}>Weiter</button>}
    </section>
  );
}
