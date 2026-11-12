import { useState } from "react";
import { Speak, Top, Orn, speak } from "./App.jsx";
import { Quiz } from "./Postcards.jsx";

// all stories from sync.py, newest first; one is written each day. built from her words plus 3 new ones, which are marked; tap a sentence to hear it and see the German
const bare = es => es.replace(/^(el|la|los|las|un|una)\s+/i, ""); // "el café" is "un café" in the text
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// red dot on a story newer than the newest one she has opened, and on the game while there is one
// ponytail: one "newest opened" day, not a list; opening the newest also clears older unread ones
const seen = () => { try { return localStorage.getItem("storySeen") ?? ""; } catch { return ""; } };
export const storyNew = stories => {
  // first time: only the newest story counts as new, not the whole archive
  if (stories.length && !seen()) try { localStorage.setItem("storySeen", stories.at(-2)?.day ?? " "); } catch { /* private mode */ }
  return (stories.at(-1)?.day ?? "") > seen();
};

export default function Stories({ stories, done }) {
  const [open, setOpen] = useState(null);
  if (open) return <Story story={open} done={() => setOpen(null)} />;
  const date = day => new Date(day + "T12:00").toLocaleDateString("de-DE", { day: "numeric", month: "long" });
  return (
    <div className="screen">
      <Top done={done} />
      <h2 className="title">Geschichten</h2>
      <p className="sub">Jeden Tag eine neue, von Adrián</p>
      {[...stories].reverse().map(st => (
        <button key={st.day + st.title} className="card item story-item" onClick={() => {
          setOpen(st); window.scrollTo(0, 0);
          if (st.day > seen()) try { localStorage.setItem("storySeen", st.day); } catch { /* private mode */ }
        }}>
          <b>{st.title}</b>
          {st.day > seen() && <i className="dot" />}
          <span className="de">{st.de}</span>
          <small>{date(st.day)} · neu: {st.new.map(n => n.es).join(", ")}</small>
        </button>
      ))}
    </div>
  );
}

function Story({ story, done }) {
  const [open, setOpen] = useState([]);
  const re = new RegExp(`(${story.new.map(n => esc(bare(n.es))).join("|")})`, "gi");
  const mark = es => es.split(re).map((part, i) => i % 2 ? <mark key={i}>{part}</mark> : part); // odd parts are the captured words
  const tap = i => { speak(story.sentences[i].es); setOpen(o => o.includes(i) ? o.filter(x => x !== i) : [...o, i]); };
  return (
    <div className="screen post">
      <Top done={done} />
      <h2 className="title">{story.title}</h2>
      <p className="sub">{story.de}</p>
      <p className="sub small">Nur {story.new.length} neue Wörter, alles andere kennst du schon. 💛</p>
      <section className="paper story" style={{ "--tilt": "-.6deg" }}>
        {story.sentences.map((s, i) => (
          <button key={i} onClick={() => tap(i)} aria-expanded={open.includes(i)}>
            {mark(s.es)}{open.includes(i) && <span>{s.de}</span>}
          </button>
        ))}
        <small>Tipp auf einen Satz: Du hörst ihn und siehst ihn auf Deutsch.</small>
      </section>
      <section className="paper" style={{ "--tilt": ".8deg" }}>
        <h3 className="hand">Neue Wörter</h3>
        <ul className="examples">
          {story.new.map(n => <li key={n.es}><Speak text={n.es} /><div><b>{n.es}</b><span>{n.de}</span></div></li>)}
        </ul>
      </section>
      <Orn />
      <Quiz key={story.day} quiz={story.questions} style={{ "--tilt": "-.8deg" }} retry="¡Casi! Lies die Geschichte nochmal und versuch's gleich wieder." />
    </div>
  );
}
