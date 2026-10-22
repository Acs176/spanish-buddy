import { useLayoutEffect, useState } from "react";
import Mascot from "./Adrian.jsx";

// Announcements: a letter from Adrián in an envelope, then a tour with a spotlight on the home screen.
// Each shows once; the ids she has seen live in localStorage "seen". To announce a new feature, add an entry at the end:
// letter (optional) = paragraphs, steps (optional) = [CSS selector on the home screen, or null for no spotlight, text].
// The first entry is the first-run welcome; finishing it marks every entry seen, since the welcome tour covers the app.
export const NEWS = [
  {
    id: "welcome",
    say: "¡Hola, Angela! Post für dich!",
    greeting: "¡Hola, Angela!",
    letter: [
      "jeden Tag schicke ich dir la palabra española del día. Ab heute landen sie alle hier, in deiner eigenen kleinen App.",
      "Hier kannst du die Wörter wiederholen, üben und hören, und wenn die spanische Grammatik mal wieder keinen Sinn ergibt, schicke ich dir eine Postkarte, die es erklärt.",
      "Ich habe sie nur für dich gebaut. ¡Disfrútala!",
    ],
    button: "Zeig mir die App",
    steps: [
      [".wotd", "Hier erscheint jeden Tag das Wort, das ich dir schicke. Tipp auf den Lautsprecher, dann hörst du, wie man es sagt. Und wenn ich's mal vergesse, guck ich traurig: dann darfst du mich erinnern. 😉"],
      [".progress", "Das Blümchen auf der Kachel füllt sich mit jedem Wort, das du gelernt hast. Daneben steht, wie viele Karten heute dran sind."],
      [".tabs button:nth-child(1)", "Karteikarten: Hier wiederholst du die Wörter. Dreh die Karte um und sag ehrlich, wie gut du es wusstest. Die App merkt sich, wann jedes Wort wiederkommen soll."],
      [".tabs button:nth-child(2)", "Üben: kleine Runden mit Lückensätzen, Hören und Schreiben. Wörter, die dir schwerfallen, kommen öfter dran."],
      [".tabs button:nth-child(3)", "Alle Wörter: deine ganze Sammlung, mit allen Beispielsätzen zum Anhören."],
      [".mailbox", "Und das ist dein Briefkasten. Hier kommen meine Postkarten an, wenn ich dir ein Grammatik-Rätsel erkläre."],
      [".gear", "Darunter sind die Einstellungen. Dort speicherst du ab und zu ein Backup, damit dein Fortschritt nie verloren geht, und kannst diese Tour nochmal ansehen."],
      [null, "¡Eso es todo! Viel Spaß, Angela. Ich freu mich auf jedes Wort, das du lernst. 💛"],
    ],
  },
  {
    id: "settings",
    steps: [[".gear", "Neu: die Einstellungen! Hier speicherst du dein Backup und kannst die Tour nochmal ansehen."]],
  },
];

const readSeen = () => { try { return JSON.parse(localStorage.getItem("seen")) || []; } catch { return []; } };
// the oldest announcement she hasn't seen yet, or undefined
export const nextNews = () => { const seen = readSeen(); return NEWS.find(n => !seen.includes(n.id)); };
export function markSeen(n) {
  const ids = n.id === NEWS[0].id ? NEWS.map(x => x.id) : [...new Set([...readSeen(), n.id])];
  try { localStorage.setItem("seen", JSON.stringify(ids)); } catch { /* private mode: it shows again next time */ }
}

export function Welcome({ news, done }) {
  const [stage, setStage] = useState("closed"); // closed → opening → open
  const open = () => {
    if (stage !== "closed") return;
    setStage("opening");
    setTimeout(() => setStage("open"), 1300); // flap, then the letter slides out, then it unfolds
  };

  if (stage === "open") return (
    <div className="screen center welcome">
      <article className="paper letter rise" style={{ "--tilt": "-2deg" }}>
        <span className="pstamp" style={{ "--stamp": "var(--red)" }} aria-hidden="true"><b>¡Hola!</b><small>2026</small></span>
        <p className="greet">{news.greeting ?? "Liebe Angela,"}</p>
        {news.letter.map(p => <p key={p}>{p}</p>)}
        <p className="sign">Un beso,<br />Adrián</p>
      </article>
      <button className="btn primary" onClick={done}>{news.button ?? (news.steps ? "Zeig's mir" : "¡Gracias!")}</button>
    </div>
  );

  return (
    <div className="screen center welcome">
      <Mascot mood="happy" size={120} say={news.say ?? "¡Post für dich!"} />
      <button className={`envelope ${stage}`} onClick={open} aria-label="Brief öffnen">
        <i className="env-back" />
        <i className="env-letter" />
        <i className="env-front" />
        <i className="env-flap" />
        <i className="env-seal" aria-hidden="true">♥</i>
        {[0, 1, 2].map(n => <i key={n} className="heart" style={{ "--n": n }} aria-hidden="true">♥</i>)}
      </button>
      <p className="tap">Tippen zum Öffnen</p>
    </div>
  );
}

// steps: [what to point at, what Adrián says]; null = no spotlight
export function Tour({ steps, done }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState(null);
  const [sel, text] = steps[i];
  const last = i === steps.length - 1;
  const next = () => (last ? done() : setI(i + 1));

  useLayoutEffect(() => {
    const el = sel && document.querySelector(sel);
    el?.scrollIntoView({ block: "center" });
    const measure = () => {
      const r = el?.getBoundingClientRect();
      setBox(r ? { top: r.top - 8, left: r.left - 8, width: r.width + 16, height: r.height + 16 } : null);
    };
    measure();
    addEventListener("resize", measure);
    return () => removeEventListener("resize", measure);
  }, [sel]);

  // the speech bubble goes on the side of the spotlight with more room
  const below = box && box.top + box.height / 2 < innerHeight / 2;
  const at = !box ? { top: "50%", transform: "translateY(-50%)" } : below ? { top: box.top + box.height + 14 } : { bottom: innerHeight - box.top + 14 };
  return (
    <div className="tour" onClick={next} role="dialog" aria-label="Einführung">
      <div className="spot" style={box ?? { top: innerHeight / 2, left: innerWidth / 2, width: 0, height: 0 }} />
      <div className="tip" style={at} onClick={e => e.stopPropagation()}>
        <Mascot mood="happy" size={56} />
        <div>
          <p>{text}</p>
          <div className="tip-row">
            <small>{i + 1} / {steps.length}</small>
            {!last && <button className="btn ghost" onClick={done}>Überspringen</button>}
            <button className="btn primary" onClick={next}>{last ? "¡Vamos!" : "Weiter"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
