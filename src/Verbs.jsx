import { useEffect, useRef, useState } from "react";
import Mascot from "./Adrian.jsx";
import Angela from "./Angela.jsx";
import LockEmUp from "./LockEmUp.jsx";
import Kiln, { PETAL, Tile, TileDefs, paintBricks } from "./Kiln.jsx";
import { Duo, Orn, Speak, Top, speak } from "./App.jsx";
import VERBS, { BASE, PER_FORM, PEOPLE, PETALS, SLOTS, active, finished, fire, key, leftToday, makeRound, paint, petals, states, toNext, unlocked, waiting } from "./verbs.js";
import { check, today } from "./srs.js";
import { play } from "./sound.js";
import { startMusic, stopMusic } from "./music.js";

// petals painted per form, see paint() in verbs.js
const load = () => { try { return JSON.parse(localStorage.getItem("verbs")) || {}; } catch { return {}; } };
export const kilnReady = () => waiting(load(), today()).length > 0; // yesterday's petals wait in the kiln: red dot on the game
const save = p => { try { localStorage.setItem("verbs", JSON.stringify(p)); } catch { /* private mode */ } };
const any = a => a[Math.floor(Math.random() * a.length)];
const RIGHT = ["¡Eso es!", "¡Olé!", "¡Claro que sí!", "¡Muy bien!", "¡Qué crack!"];
const WRONG = ["¡Uy! Fast!", "¡Ay, ay, ay!", "¿Cómo? Adrián ist verwirrt.", "¡Qué va! Noch nicht ganz.", "¡Madre mía! Gleich nochmal."];

// nosotros: the two of them cheek to cheek, leaning in, a heart over them, one bubble for both
const Both = ({ size = 140, say, mood }) => (
  <div className="mascot-wrap">
    {say && <div className="bubble">{say}</div>}
    <div className="pair" style={{ width: size * 1.25, height: size * .82, marginTop: size * .14 }}>
      <div className="her"><Angela mood={mood} size={size * .82} /></div>
      <div className="him" style={{ left: size * .43 }}><Mascot mood={mood} size={size * .82} /></div>
      <svg className="love" viewBox="0 0 24 24" width={size * .16} height={size * .16} aria-hidden="true">
        <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.8A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11Z" fill="#c4572f" stroke="#3b2418" strokeWidth="1.8" />
      </svg>
    </div>
  </div>
);
// the person doing it: yo is Angela, tú is Adrián, él is Mr. Lock 'em up, nosotros both of them
const WHO = [Angela, Mascot, LockEmUp, Both];
const Who = ({ p, ...rest }) => { const C = WHO[p]; return <C {...rest} />; };
const NAMES = ["Angela", "Adrián", "Mr. Lock 'em up", "los dos"];
const CLS = ["yo", "tu", "el", "nos"];
const ALL = [...PEOPLE, "vosotros", "ellos"]; // the whole present on the verb's card, the ones not played yet greyed out // each person's colour in styles.css
const FLY = ["#d9683a", "#476fc4", "#4f9150", "#8d55a4"];

// the game happens in the workshop: a brick wall in warm light behind every page
function Workshop({ center, children }) {
  const wall = useRef();
  useEffect(() => { paintBricks(wall.current, false); }, []);
  return (
    <div className="workshop">
      <canvas ref={wall} width="750" height="1624" />
      <i className="wlight" />
      <TileDefs />
      <div className={`screen ${center ? "center" : ""}`}>{children}</div>
    </div>
  );
}

// open tiles, then the next verb's name waiting faintly in its recess, then empty ones
function Wall({ painted, open, setOpen, fresh = [] }) {
  const verbs = unlocked(painted), n = active(painted);
  return (
    <div className="wall">
      {Array.from({ length: SLOTS }, (_, i) => {
        const v = verbs[i];
        if (!v) return <div key={i} className="slot"><i className="niche">{i === verbs.length && VERBS[i]?.id}</i></div>;
        return (
          <button key={v.id} className={`slot ${fresh.includes(v.id) ? "new" : ""}`} aria-pressed={open === v.id} onClick={() => setOpen?.(open === v.id ? null : v.id)}
            aria-label={`${v.id}, ${petals(v, painted)} von ${PETALS} Blütenblättern`}>
            <Tile petals={states(v, painted, false, n)} gold={finished(v, painted)} />
            <b>{v.id}</b>
          </button>
        );
      })}
    </div>
  );
}

const count = (n, one, many) => n === 1 ? `1 ${one}` : `${n} ${many}`;
function status(painted, day, fresh) {
  if (fresh.length) return `Neue Kachel: ${fresh.join(", ")}!`;
  const left = leftToday(painted, day);
  if (left) return `Heute noch ${count(left, "Blütenblatt", "Blütenblätter")} zu malen`;
  return unlocked(painted).every(v => finished(v, painted)) ? "¡Enhorabuena! Deine Wand ist fertig." : "Alles gemalt! Morgen geht's in den Ofen";
}
function nextStep(painted) {
  const n = toNext(painted);
  if (unlocked(painted).length === SLOTS) return null;
  return n ? `Noch ${count(n, "Blütenblatt", "Blütenblätter")} bis zur nächsten Kachel` : "Nach dem Brennen kommt die nächste Kachel";
}

// three dots per form: glazed, still wet, or not painted yet
const Dots = ({ states: s, p }) => (
  <span className="dots" role="img" aria-label={`${s.filter(x => x !== "empty").length} von ${PER_FORM}`}>
    {s.map((x, i) => <i key={i} className={`${x} ${CLS[p]}`} />)}
  </span>
);

// the whole game in three pictures, before her first round and behind the "?"
const stepTile = s => [s, "empty", "empty", s, "empty", "empty"];
const STEPS = [
  ["Malen", "🖌️", "wet", "Eine richtige Antwort malt ein Blütenblatt. Bilde die Form selbst: Die Hörfragen ¿Quién? sind nur zum Aufwärmen."],
  ["Trocknen", "🌙", "wet", "Das Blütenblatt bleibt über Nacht blass. Pro Tag gibt es nur eine Handvoll Blütenblätter zu malen."],
  ["Brennen", "🔥", "fired", "Am nächsten Tag kommt deine Kachel in den Ofen und glänzt danach für immer."],
];
function Intro({ done }) {
  return (
    <Workshop center>
      <h2 className="title">So geht's</h2>
      <p className="sub"><b className="yo">yo</b> malt links, <b className="tu">tú</b> malt rechts.</p>
      {STEPS.map(([h, icon, s, text]) => (
        <section key={h} className="card step">
          <div className="steptile"><Tile petals={stepTile(s)} /><i aria-hidden="true">{icon}</i></div>
          <div><h3>{h}</h3><p>{text}</p></div>
        </section>
      ))}
      <p className="sub">Jede Form braucht drei Blütenblätter. Ist eine Kachel ganz gebrannt, kommt das nächste Verb auf deine Wand.</p>
      <button className="btn primary" onClick={done}>¡Vamos!</button>
    </Workshop>
  );
}

// someone new comes into the workshop: Mr. Lock 'em up after two finished tiles, then the two of them together (see ARRIVE)
// [what they say, the German, who it is, where their glaze goes, the button]
const ARRIVAL = [, ,
  ["¡Hola! Soy Mr. Lock 'em up.", "er, sie", "Mr. Lock 'em up kommt in die Werkstatt.", "Seine grünen Blätter glasieren den linken Rand.", "¡Hola, Mr. Lock 'em up!"],
  ["¡Ahora pintamos juntos!", "wir", "Angela und Adrián malen jetzt zusammen.", "Ihre lila Blätter glasieren den rechten Rand.", "¡Vamos juntos!"],
];
function Arrival({ p, done }) {
  const [say, de, text, glaze, ok] = ARRIVAL[p];
  useEffect(() => { play("done"); }, []);
  return (
    <Workshop center>
      <h2 className="title">¡Toc, toc!</h2>
      <Who p={p} size={150} say={say} mood="happy" />
      <section className="card arrival" style={{ "--c": FLY[p] }}>
        <p className="label">Neu in der Werkstatt</p>
        <h3>{PEOPLE[p]} <i>{de}</i></h3>
        <p className="lead">{text}</p>
        <div className="verbchips">
          {VERBS.slice(0, 4).map(v => <button key={v.id} onClick={() => speak(v.forms[p])}>{v.forms[p]}</button>)}
        </div>
        <div className="glazeinfo">
          <Tile petals={Array(PER_FORM * (p + 1)).fill("fired")} />
          <p>{glaze} Ein Extra: Die nächste Kachel kommt wie immer.</p>
        </div>
      </section>
      <button className="btn primary" onClick={done}>{ok}</button>
    </Workshop>
  );
}

export default function Verbs({ done }) {
  const [painted, setPainted] = useState(load);
  const [game, setGame] = useState(0); // which round, 0 = none: a new number starts the round fresh
  const [open, setOpen] = useState(null);
  const [firing, setFiring] = useState(() => waiting(load(), today()).length > 0); // yesterday's petals come first
  const [help, setHelp] = useState(() => { try { return !localStorage.getItem("verbsIntro"); } catch { return false; } });
  const [fresh, setFresh] = useState([]); // verbs the kiln just unlocked
  const [met, setMet] = useState(() => { try { return +localStorage.getItem("verbsMet") || BASE; } catch { return BASE; } }); // people she has been introduced to
  const play = () => { setFresh([]); setGame(g => g + 1); };
  const wall = !firing && !help && !game;
  useEffect(() => { if (wall) { startMusic("flamenco"); return stopMusic; } }, [wall]);
  const earn = k => setPainted(p => { const next = paint(p, k, today()); save(next); return next; });

  if (firing) return <><TileDefs /><Kiln painted={painted} day={today()} done={() => {
    const next = fire(painted, today()), before = unlocked(painted).length;
    const won = unlocked(next).slice(before).map(v => v.id);
    save(next); setPainted(next); setFiring(false); setFresh(won);
  }} /></>;
  if (help) return <Intro done={() => { try { localStorage.setItem("verbsIntro", "1"); } catch { /* private mode: it shows again next time */ } setHelp(false); window.scrollTo(0, 0); }} />;
  const n = active(painted);
  if (met < n) return <Arrival key={met} p={met} done={() => { try { localStorage.setItem("verbsMet", met + 1); } catch { /* private mode: he knocks again next time */ } setMet(met + 1); }} />;
  const v = VERBS.find(x => x.id === open), next = nextStep(painted);
  if (game) return <Round key={game} painted={painted} focus={v} earn={earn} again={play} done={() => setGame(0)} />;
  return (
    <Workshop>
      <Top done={done} />
      <button className="helpq" onClick={() => setHelp(true)} aria-label="So geht's">?</button>
      <h2 className="title">¿Quién?</h2>
      <p className="status">{status(painted, today(), fresh)}</p>
      {next && <p className="sub">{next}</p>}
      <Orn />
      <Wall painted={painted} open={open} setOpen={setOpen} fresh={fresh} />
      {v && (
        <section key={v.id} className="card forms" ref={el => el?.scrollIntoView({ block: "nearest" })}>
          <h3>{v.id} <Speak text={v.id} /></h3>
          <p className="sub">{v.de}</p>
          {ALL.map((who, p) => (
            <p key={who} className={p < n ? "" : "soon"}><i>{who}</i> <b>{v.forms[p]}</b>
              {p < n ? <Dots p={p} states={states(v, painted, false, n).slice(p * PER_FORM, (p + 1) * PER_FORM)} /> : <small>pronto</small>}
              <Speak text={v.forms[p]} /></p>
          ))}
        </section>
      )}
      <button className="btn primary play" onClick={play}>¡A jugar!</button>
    </Workshop>
  );
}

function Round({ painted, focus, earn, again, done }) {
  const [qs] = useState(() => makeRound(unlocked(painted), painted, today(), focus));
  const [start] = useState(painted); // to count the petals of this round at the end
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState(null); // quien: the person tapped; choose: the form tapped; write: what check() said
  const [typed, setTyped] = useState("");
  const [cheer, setCheer] = useState("");
  const [score, setScore] = useState(0);
  const [fly, setFly] = useState(null); // the petal on its way from her answer to the tile: { x, y, p }
  const [fresh, setFresh] = useState(null); // which petal of the tile just landed
  const [note, setNote] = useState(""); // why a right answer earned no petal
  const tile = useRef(), flyer = useRef();
  const q = qs[i], n = active(start); // who plays stays the same for the whole round

  useEffect(() => { if (q?.kind === "quien") speak(q.sentence); }, [q]);
  useEffect(() => { if (!q) play("done"); }, [q]);
  useEffect(() => {
    if (!fly) return;
    const a = flyer.current.getBoundingClientRect(), b = tile.current.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2), dy = b.top + b.height / 2 - (a.top + a.height / 2);
    flyer.current.animate(
      [{ transform: "scale(1.5) rotate(0)" }, { transform: `translate(${dx * .55}px, ${dy * .45}px) scale(1.9) rotate(100deg)`, offset: .5 }, { transform: `translate(${dx}px, ${dy}px) scale(.45) rotate(220deg)` }],
      { duration: 560, easing: "cubic-bezier(.45,0,.3,1)" },
    ).onfinish = () => setFly(null);
  }, [fly]);

  if (!q) {
    const count = p => VERBS.reduce((sum, v) => sum + petals(v, p, PEOPLE.length), 0);
    const got = count(painted) - count(start);
    return (
      <Workshop center>
        <Duo adrian={score >= 6 ? "happy" : "idle"} angela={score >= 6 ? "happy" : "idle"} say={`${score} von ${qs.length} richtig! ${score >= 6 ? "¡Olé!" : "¡Ánimo!"}`} />
        <p className="sub">{got === 1 ? "1 neues Blütenblatt! Morgen kommt es in den Ofen." : got ? `${got} neue Blütenblätter! Morgen kommen sie in den Ofen.` : "Für heute sind alle Blütenblätter gemalt. Morgen geht's in den Ofen."}</p>
        <Wall painted={painted} />
        <button className="btn primary" onClick={again}>Nochmal</button>
        <button className="btn ghost" onClick={done}>Fertig</button>
      </Workshop>
    );
  }

  const answer = (right, el) => {
    play(right ? "right" : "wrong");
    if (right) {
      setScore(s => s + 1);
      if (q.kind !== "quien") {
        const k = key(q.v, q.p), c = painted[k];
        if (paint(painted, k, today()) !== painted) { // hearing it earns no petal, she has to come up with the form
          earn(k);
          setFresh(q.p * PER_FORM + (c?.n ?? 0));
          if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
            const r = el.getBoundingClientRect();
            setFly({ x: r.left + r.width / 2, y: r.top + r.height / 2, p: q.p });
          }
        } else setNote(c?.n >= PER_FORM ? "Diese Form hat schon alle Blütenblätter." : "Für heute sind alle Blütenblätter gemalt. Weiter so, Üben zählt trotzdem!");
      }
    }
    setCheer(any(right ? RIGHT : WRONG));
    speak(q.sentence);
  };
  const tap = (c, e) => { if (chosen !== null) return; setChosen(c); answer(c === (q.kind === "quien" ? q.p : q.answer), e.currentTarget); };
  const submit = e => {
    e.preventDefault();
    if (chosen !== null || !typed.trim()) return;
    const r = check(typed, q.answer);
    setChosen(r);
    answer(r !== "no", e.currentTarget.querySelector("input")); // a missing accent still counts, with a note
  };
  const next = () => { setChosen(null); setTyped(""); setFresh(null); setNote(""); setI(i + 1); };

  const answered = chosen !== null;
  const ok = q.kind === "write" ? chosen && chosen !== "no" : chosen === (q.kind === "quien" ? q.p : q.answer);
  return (
    <Workshop>
      <Top done={done} progress={i / qs.length} />
      {q.kind === "quien" ? <>
        <section className="card question">
          <h1>¿Quién?</h1>
          <small>Wer macht das? Hör auf die Endung.<br />Nur zum Aufwärmen, ohne Blütenblatt.</small>
          <button className="big-speak" onClick={() => speak(q.sentence)} aria-label="Anhören">
            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6.5 9H3.5v6h3L11 19Z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>
          </button>
        </section>
        <div className="who">
          {PEOPLE.slice(0, n).map((who, p) => (
            <button key={who} onClick={e => tap(p, e)} aria-label={`${who}, ${NAMES[p]}`}
              className={`opt ${answered && p === q.p ? "right" : ""} ${chosen === p && !ok ? "wrong" : ""}`}>
              <Who p={p} size={104} mood={!answered ? "idle" : p === q.p ? "happy" : chosen === p ? "sad" : "idle"} />
              <span className="whoname"><b>{who}</b><small>{NAMES[p]}</small></span>
            </button>
          ))}
        </div>
      </> : <>
        <div className="paintrow">
          <div className="duo"><Who p={q.p} size={92} say={PEOPLE[q.p]} mood={!answered ? "idle" : ok ? "happy" : "sad"} /></div>
          <div className="livetile" ref={tile}><Tile petals={states(q.v, painted, false, n)} gold={finished(q.v, painted)} fresh={fresh} /></div>
        </div>
        <section className="card question">
          <small>{q.v.id}</small>
          <h2>{q.line.es.split("___").reduce((a, b) => <>{a}<span className="blank">{answered ? q.answer : "____"}</span>{b}</>)}</h2>
          <small>{q.de}</small>
        </section>
        {q.kind === "choose" ? (
          <div className="options">
            {q.options.map(o => (
              <button key={o} onClick={e => tap(o, e)}
                className={`opt ${answered && o === q.answer ? "right" : ""} ${chosen === o && !ok ? "wrong" : ""}`}>{o}</button>
            ))}
          </div>
        ) : (
          <form className="typed" onSubmit={submit}>
            <input value={typed} onChange={e => setTyped(e.target.value)} disabled={answered} autoFocus lang="es"
              autoCapitalize="off" autoCorrect="off" spellCheck={false} aria-label="Antwort" placeholder="Verbform schreiben…"
              className={answered ? (ok ? "right" : "wrong") : ""} />
            {!answered && <>
              <div className="accents">
                {[..."áéíóúñ"].map(ch => <button type="button" key={ch} onClick={() => setTyped(t => t + ch)}>{ch}</button>)}
              </div>
              <button className="btn primary" disabled={!typed.trim()}>Prüfen</button>
            </>}
          </form>
        )}
      </>}
      {fly && (
        <svg ref={flyer} className="flyer" viewBox="70 26 60 68" style={{ left: fly.x - 20, top: fly.y - 22 }} aria-hidden="true">
          <path d={PETAL} fill={FLY[fly.p]} />
        </svg>
      )}
      {answered && (
        <div className={`feedback ${ok ? "good" : "bad"}`}>
          <b>{chosen === "accent" ? "¡Casi! Mit Akzent:" : cheer}</b>
          <span>{q.sentence} <Speak text={q.sentence} /></span>
          <span className="tr">{q.de}</span>
          {note && <span className="tr">{note}</span>}
          <button className="btn" onClick={next}>Weiter</button>
        </div>
      )}
    </Workshop>
  );
}
