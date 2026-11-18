import { useState } from "react";
import Mascot from "./Adrian.jsx";
import { Top, TOPICS } from "./App.jsx";
import { play } from "./sound.js";

// "Kennst du die schon?": the basic words (sync.py --basics) she hasn't sorted yet, one topic per page, up to 12 tiles.
// She taps the ones she knows, they glaze blue. Weiter: known() makes them learned cards, the rest go to unknown() and
// become normal new cards. Each page is saved as she goes, so closing halfway keeps what she did.
const PAGE = 12;
const order = id => { const i = TOPICS.findIndex(([t]) => t === id); return i < 0 ? TOPICS.length : i; };

export default function Basics({ words, known, unknown, done }) {
  const [pages] = useState(() => {
    const sorted = [...words].sort((a, b) => order(a.topic) - order(b.topic));
    const out = [];
    for (const w of sorted) {
      const last = out.at(-1);
      if (last && last[0].topic === w.topic && last.length < PAGE) last.push(w); else out.push([w]);
    }
    return out;
  });
  const [p, setP] = useState(0);
  const [on, setOn] = useState(new Set());
  const [gained, setGained] = useState(0);
  const [intro, setIntro] = useState(true); // a few words from Adrián first, so she knows why these are here
  const page = pages[p];

  if (intro) return (
    <div className="screen center basics-end">
      <Mascot mood="talk" size={130} say="¡Hola, Angela!" />
      <p className="lead">Ich habe dir {words.length} ganz alltägliche Wörter dazugelegt, die man in Spanien ständig hört. Viele kennst du bestimmt schon!</p>
      <p className="lead">Tipp die an, die du schon weißt: Die zählen sofort als gelernt und kommen nur ab und zu zur Kontrolle wieder. Die anderen lernen wir nach und nach zusammen.</p>
      <button className="btn primary" onClick={() => setIntro(false)}>¡Vamos a ver!</button>
      <button className="btn ghost" onClick={done}>Später</button>
    </div>
  );

  if (!page) return (
    <div className="screen center basics-end">
      <Mascot mood="talk" size={130} say="¡Qué crack!" />
      <h2 className="title">+{gained} Wörter</h2>
      <p className="lead">{gained ? "Die kennst du schon, die zählen ab jetzt mit." : "Kein Problem, wir lernen sie zusammen."}
        {pages.flat().length > gained && <> Die anderen {pages.flat().length - gained} kommen nach und nach als neue Karten.</>}</p>
      <button className="btn primary" onClick={done}>¡Vamos!</button>
    </div>
  );

  const topic = TOPICS.find(([t]) => t === page[0].topic);
  const toggle = id => { if (!on.has(id)) play("tinkle"); setOn(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; }); };
  const next = () => {
    const yes = page.filter(w => on.has(w.id));
    known(yes.map(w => w.id));
    unknown(page.filter(w => !on.has(w.id)).map(w => w.id));
    if (yes.length) play("ding");
    setGained(g => g + yes.length);
    setOn(new Set());
    setP(p + 1);
  };
  return (
    <div className="screen basics">
      <Top done={done} progress={p / pages.length} />
      <p className="kicker">{topic ? topic[1] : "Wörter"} · {p + 1} / {pages.length}</p>
      <h2 className="title">Kennst du die schon?</h2>
      <p className="lead">Tipp die an, die du schon weißt.</p>
      <div className="wall">
        {page.map(w => (
          <button key={w.id} className={`tile ${on.has(w.id) ? "on" : ""}`} aria-pressed={on.has(w.id)} onClick={() => toggle(w.id)} style={{ "--glaze": "0%" }}>
            <b>{w.es}</b>
            <small>{w.de}</small>
          </button>
        ))}
      </div>
      <div className="row">
        <button className="btn" onClick={() => { play("sparkle"); setOn(new Set(page.map(w => w.id))); }}>Alle kenne ich</button>
        <button className="btn primary" onClick={next}>Weiter</button>
      </div>
    </div>
  );
}
