// ¿De quién es?: possessives. Everyday things rain onto a shelf in the ¿Quién? workshop, the owner stands in the light,
// she picks the form (mis llaves, esta mochila es tuya, ¿y las nuestras?). Words she hasn't met fall first.
// Specials: objeto gordo (big, the shelf bends), dorado (counts double), chaparrón (three fast ones in a downpour).
import { useEffect, useMemo, useRef, useState } from "react";
import Adrian from "./Adrian.jsx";
import Angela from "./Angela.jsx";
import LockEmUp from "./LockEmUp.jsx";
import { Bojack, Diane } from "./Vecinos.jsx";
import { paintBricks } from "./Kiln.jsx";
import { Speak, Top, speak } from "./App.jsx";
import { play } from "./sound.js";
import { fanfare, startMusic, stopMusic } from "./music.js";
import { OBJECTS, deck, form, hint, info, options, sentence } from "./posesivos.js";
import { get, set } from "./store.js";

// nouns already met here, so they stop counting as new
const loadSeen = () => new Set(get("posSeen", []));
const saveSeen = s => set("posSeen", [...s]);

// two of them cheek to cheek, as on the ¿Quién? wall
const pair = (A, B) => ({ size, mood }) => (
  <div className="mascot-wrap">
    <div className="pair" style={{ width: size * 1.25, height: size * .82, marginTop: size * .14 }}>
      <div className="her"><A mood={mood} size={size * .82} /></div>
      <div className="him" style={{ left: size * .43 }}><B mood={mood} size={size * .82} /></div>
    </div>
  </div>
);
const PEOPLE = [
  { C: Angela, w: "yo" }, { C: Adrian, w: "tú" }, { C: LockEmUp, w: "él" },
  { C: pair(Angela, Adrian), w: "nosotros" }, { C: pair(Adrian, LockEmUp), w: "vosotros" }, { C: pair(Diane, Bojack), w: "ellos" },
];
const BIG = OBJECTS.filter(o => o.big);
const any = a => a[Math.floor(Math.random() * a.length)];
const BANNER = { gordo: "¡Objeto gordo!", dorado: "¡Dorado! ×2", chaparron: "¡Chaparrón!" };

// the next thing to fall: every 9th a big one, sometimes a golden one, now and then a downpour of three
function makeRound(i, next, storm) {
  let o, special = null;
  if (i % 9 === 5) { o = any(BIG); special = "gordo"; }
  else { o = next(); if (!storm && i % 11 === 8) special = "chaparron"; else if (Math.random() < .12) special = "dorado"; }
  const r = Math.random(), kind = r < .5 ? "atono" : r < .8 ? "tonico" : "articulo", p = Math.floor(Math.random() * 6), { g, pl } = info(o);
  return { o, p, kind, special, a: form(kind, p, g, pl), opts: options(kind, p, g, pl) };
}

// off to its owner, spinning and shrinking
function fly(el, to) {
  const a = el.getBoundingClientRect(), b = to.getBoundingClientRect();
  el.style.transition = "transform .7s cubic-bezier(.5,-.4,.7,1), opacity .7s ease-in";
  el.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.2) rotate(540deg)`;
  el.style.opacity = ".3";
}

function Confetti() {
  const bits = useMemo(() => Array.from({ length: 36 }, (_, k) => ({
    "--x": `${(Math.random() - .5) * 420}px`, "--y": `${-120 + Math.random() * 520}px`, "--r": `${Math.random() * 900 - 450}deg`,
    "--c": ["#2f4f9d", "#c4572f", "#e0b050", "#3f9a6c", "#f8f4ea"][k % 5], animationDelay: `${Math.random() * .15}s`,
  })), []);
  return <div className="confetti">{bits.map((s, k) => <i key={k} style={s} />)}<b className="combo">¡Racha de 5! ¡Olé!</b></div>;
}

export default function Posesivos({ words, done }) {
  const wall = useRef();
  useEffect(() => { paintBricks(wall.current, false); startMusic("flamenco"); return stopMusic; }, []);
  // known: nouns from her word list, plus the ones she has already met here; those fall last
  const [seen] = useState(loadSeen);
  const listed = useMemo(() => new Set(words.filter(w => w.type === "noun").map(w => w.es.split(" ").slice(1).join(" "))), []);
  const order = useMemo(() => deck(new Set([...listed, ...seen])), []), pos = useRef(0);
  const next = () => order[pos.current++ % order.length];

  const [i, setI] = useState(0), [storm, setStorm] = useState(0);
  const [r, setR] = useState(() => makeRound(0, next, 0));
  const [phase, setPhase] = useState("enter"), [streak, setStreak] = useState(0), [wrong, setWrong] = useState(null);
  const [moods, setMoods] = useState({}), [tip, setTip] = useState(""), [party, setParty] = useState(0);
  const obj = useRef(), owners = useRef([]);
  const { noun } = info(r.o), [before, after] = sentence(r.kind, r.p, r.o);
  const fresh = useMemo(() => !listed.has(noun) && !seen.has(noun), [r]);
  const speed = storm ? .45 : Math.max(.5, 1 - streak * .08); // the longer the streak, the faster they fall
  useEffect(() => { if (r.special === "chaparron") setStorm(3); }, [r]);

  function landed() {
    setPhase("ask");
    if (r.special === "dorado") play("sparkle");
    if (fresh) { speak(r.o.es); seen.add(noun); saveSeen(seen); } // a new word: hear it as it lands
  }
  function right() {
    play("right"); setPhase("won"); setTip(""); setMoods({ [r.p]: "happy" });
    speak(before + r.a + after);
    const s = streak + (r.special === "dorado" ? 2 : 1); setStreak(s);
    if (Math.floor(s / 5) > Math.floor(streak / 5)) { fanfare(); setParty(k => k + 1); }
    requestAnimationFrame(() => fly(obj.current, owners.current[r.p]));
    setTimeout(() => play("ding"), 650);
    setTimeout(() => {
      const left = Math.max(0, storm - 1);
      setStorm(left); setMoods({}); setWrong(null); setI(i + 1); setR(makeRound(i + 1, next, left)); setPhase("enter");
    }, 1500);
  }
  function miss(o) {
    play("wrong"); setStreak(0); setWrong(o); setTip(hint(r.kind, r.p, r.o)); setMoods({ [r.p]: "sad" });
    obj.current?.firstChild.animate([{ transform: "rotate(0)" }, { transform: "rotate(-16deg)" }, { transform: "rotate(12deg)" }, { transform: "rotate(-6deg)" }, { transform: "rotate(0)" }], { duration: 450 });
    setTimeout(() => setMoods({}), 1000);
  }
  const answer = o => { if (phase === "ask") o === r.a ? right() : miss(o); };

  return (
    <div className="workshop pos">
      <canvas ref={wall} width="750" height="1624" />
      <i className="wlight" />
      <div className="screen">
        <Top done={done} />
        <div className="pstat">
          <span>¿De quién es?</span>
          <span className="pips" aria-label={`Racha ${streak}`}>{[0, 1, 2, 3, 4].map(k => <i key={k} className={k < streak % 5 || (streak && streak % 5 === 0) ? "on" : ""} />)}<b>{streak}</b></span>
        </div>
        <div className={`stage ${storm ? "storm" : ""} ${r.special || ""}`} style={{ "--speed": speed }}>
          {r.special && <b key={"b" + i} className="banner">{BANNER[r.special]}</b>}
          <div key={i} className="rain">
            <span ref={obj} className="carry"><span className="thing drop" onAnimationEnd={e => e.animationName === "pdrop" && landed()}>{r.o.e}</span></span>
            <i className="shelf" />
            <p className={`word ${phase === "enter" ? "" : "shown"}`}>
              {fresh && <small>neu</small>}<b>{r.o.es}</b> · <i>{r.o.de}</i><Speak text={r.o.es} />
            </p>
          </div>
        </div>
        <div className="card pq">
          <p className="sent">{before}<span className={`gap ${phase === "won" ? "fill" : ""}`}>{phase === "won" ? r.a : " "}</span>{after}</p>
        </div>
        <div className="options">
          {r.opts.map(o => <button key={i + o} className={`opt ${phase === "won" && o === r.a ? "right" : ""} ${wrong === o ? "wrong" : ""}`} disabled={phase === "enter"} onClick={() => answer(o)}>{o}</button>)}
        </div>
        <p className="phint">{tip}</p>
        <div className="owners">
          {PEOPLE.map(({ C, w }, k) => (
            <div key={k} ref={el => owners.current[k] = el} className={`owner ${r.p === k ? "lit" : "dim"}`}>
              <C size={k > 2 ? 50 : 56} mood={moods[k] || "idle"} />
              <small>{w}</small>
            </div>
          ))}
        </div>
      </div>
      {party > 0 && <Confetti key={party} />}
    </div>
  );
}
