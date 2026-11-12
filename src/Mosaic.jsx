import { useEffect, useId, useRef, useState } from "react";
import { play } from "./sound.js";
import { Top } from "./App.jsx";
import { fanfare, startMusic, stopMusic, suspense } from "./music.js";
// The home screen's azulejo: it gains a new layer of ornament at each milestone of learned words.
// The next layer shows faintly and glazes in from the bottom as she gets closer to it.
const BLUE = "#3a5aa8", DEEP = "#1f3570", LIGHT = "#a9b9de", GOLD = "#d9a441", GOLD_D = "#8f6a1e", RED = "#c4572f", GREEN = "#3f9a6c", ORANGE = "#e39a45";
const R = (n, start = 0) => Array.from({ length: n }, (_, i) => start + i * 360 / n);
const at = (a, x = 100, y = 100) => `rotate(${a} ${x} ${y})`;
const BIG = "M100 24C131 43 129 74 100 90 71 74 69 43 100 24Z";
const SMALL = "M100 46C116 56 115 74 100 86 85 74 84 56 100 46Z";
const BUD = "M0 0C8 -6 8 -18 0 -24 -8 -18 -8 -6 0 0Z"; // a little petal from the origin, pointing up
const CORNERS = [[14, 14, 135], [186, 14, 225], [186, 186, 315], [14, 186, 45]]; // x, y, the angle that points to the middle
const EDGES = [[100, 6, 180], [194, 100, 270], [100, 194, 0], [6, 100, 90]];
const buds = (x, y, angles, fill, s = 1) => angles.map(a => <path key={a} d={BUD} transform={`translate(${x} ${y}) rotate(${a}) scale(${s})`} fill={fill} stroke={DEEP} strokeWidth={1 / s} />);

// [words needed, drawing]; listed back to front, so a layer that arrives later can still sit behind the flower
const LAYERS = [
  [1000, <rect x="4" y="4" width="192" height="192" rx="14" fill="none" stroke={GOLD} strokeWidth="3" />], // plus the shine, see Face
  [400, <path d="M100 16 184 100 100 184 16 100Z" fill="#dfe6f4" />],
  [180, <g fill="none" stroke={LIGHT} strokeWidth="1.5">{CORNERS.map(([x, y]) => <circle key={x + "" + y} cx={x} cy={y} r="70" />)}</g>],
  [40, <g fill="none" stroke={BLUE} strokeWidth="3">{["M6 34A28 28 0 0 0 34 6", "M166 6A28 28 0 0 0 194 34", "M6 166A28 28 0 0 1 34 194", "M166 194A28 28 0 0 1 194 166"].map(d => <path key={d} d={d} />)}</g>],
  [90, <g>{CORNERS.map(([x, y, a]) => <g key={a}>{buds(x, y, [a - 32, a, a + 32], LIGHT)}</g>)}</g>],
  [700, <g>{CORNERS.map(([x, y, a]) => <g key={a}><circle cx={x} cy={y} r="7" fill={GOLD} stroke={GOLD_D} /><circle cx={x} cy={y} r="2.6" fill={RED} /></g>)}</g>],
  [200, <g>{EDGES.map(([x, y, a]) => <g key={a}>{buds(x, y, [a - 40, a, a + 40], BLUE, .8)}<circle cx={x} cy={y} r="4" fill={GOLD} /></g>)}</g>],
  [100, <g fill={BLUE}>{[40, 52, 64, 76, 124, 136, 148, 160].flatMap(t => [[t, 12], [t, 188], [12, t], [188, t]]).map(([x, y]) => <circle key={x + "," + y} cx={x} cy={y} r="1.8" />)}</g>],
  [30, <rect x="21" y="21" width="158" height="158" rx="6" fill="none" stroke={GOLD} strokeWidth="1.6" />],
  [500, <g fill="#f3cdb6" stroke={RED} strokeWidth="1.2">{R(24, 7.5).map(a => <circle key={a} cx="100" cy="33" r="4.5" transform={at(a)} />)}</g>],
  [80, <g fill="#f5e6bf" stroke={GOLD} strokeWidth="1.5" strokeLinejoin="round" transform={at(22.5)}><rect x="48" y="48" width="104" height="104" /><rect x="48" y="48" width="104" height="104" transform={at(45)} /><rect x="48" y="48" width="104" height="104" fill="#f5e6bf" stroke="none" /></g>],
  [130, <g fill={DEEP}>{R(8, 22.5).map(a => <path key={a} d="M100 27C106 35 106 41 100 46 94 41 94 35 100 27Z" transform={at(a)} />)}</g>],
  [10, <g fill={BLUE} stroke={DEEP} strokeWidth="1.2">{R(4).map(a => <path key={a} d={BIG} transform={at(a)} />)}</g>],
  [20, <g fill={LIGHT} stroke={BLUE} strokeWidth="1">{R(4, 45).map(a => <path key={a} d={SMALL} transform={at(a)} />)}</g>],
  [60, <g fill={GREEN} stroke="#2a6e4c" strokeWidth=".8">{R(8, 22.5).map(a => <ellipse key={a} cx="100" cy="60" rx="3.6" ry="9" transform={at(a)} />)}</g>],
  [150, <g fill={ORANGE}>{R(4).map(a => <path key={a} d="M100 42C113 52 112 68 100 78 88 68 87 52 100 42Z" transform={at(a)} />)}</g>],
  [50, <g fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".85">{R(4).map(a => <path key={a} d="M100 32Q97 56 100 84" transform={at(a)} />)}</g>],
  [250, <g fill="none" stroke={GOLD} strokeWidth="1.3">{R(4).map(a => <path key={a} d={BIG} transform={at(a)} />)}{R(4, 45).map(a => <path key={a} d={SMALL} transform={at(a)} />)}</g>],
  [70, <g fill={RED}>{R(8, 22.5).map(a => <circle key={a} cx="100" cy="74" r="3" transform={at(a)} />)}</g>],
  [5, <><circle cx="100" cy="100" r="15" fill={GOLD} stroke={GOLD_D} strokeWidth="1.2" /><circle cx="100" cy="100" r="7" fill={RED} /></>],
  [300, <g fill="#fff">{R(16).map(a => <circle key={a} cx="100" cy="88.5" r="1.5" transform={at(a)} />)}</g>],
];
const FRONT = 12; // the flower, from the big petals on, floats above the rest of the tile
export const MILESTONES = LAYERS.map(([n]) => n).sort((a, b) => a - b);
// the milestones she has passed, and the one she is working towards (undefined once the tile is complete)
export const reached = learned => MILESTONES.filter(n => learned >= n).length;

// from 100 words on the tile glows too, and each aura adds to the ones before (CSS in styles.css)
const AURAS = [[100, "halo", "einen goldenen Schein"], [150, "rays", "Lichtstrahlen"], [200, "glint", "einen Glanz auf der Glasur"], [250, "sparks", "Funkeln"]];
const SPARKS = [[-6, 6, 0], [54, -8, .6], [102, 18, 1.2], [98, 82, .3], [36, 102, 1.6], [-8, 70, .9], [82, -6, 1.9]]; // % of the tile, delay s

// One side of the tile, drawn as the back (tile, frame, ornaments) or the front (the flower, which floats above it).
// k: layers drawn, next: the one glazing in, frac: how far.
function Face({ id, part, k, next, frac, glint }) {
  return (
    <svg className={part === "back" ? "mtile" : "mflower"} viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <clipPath id={id + "n"}><rect x="0" y={200 - 200 * frac} width="200" height="200" /></clipPath>
        <clipPath id={id + "t"}><rect x="4" y="4" width="192" height="192" rx="14" /></clipPath>
        <linearGradient id={id + "s"} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".35" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={id + "g"}>
          <stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset=".5" stopColor="#fff" stopOpacity=".85" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {part === "back" && <rect x="4" y="4" width="192" height="192" rx="14" fill="#fffdf8" />}
      <g clipPath={`url(#${id}t)`}>
        {LAYERS.map(([n, art], i) => (i >= FRONT) !== (part === "front") ? null
          : MILESTONES.indexOf(n) < k ? <g key={n}>{art}</g>
          : n === next ? <g key={n}><g opacity=".14">{art}</g><g clipPath={`url(#${id}n)`}>{art}</g></g>
          : null)}
        {part === "front" && MILESTONES.at(-1) <= MILESTONES[k - 1] && <rect x="4" y="4" width="192" height="192" rx="14" fill={`url(#${id}s)`} />}
        {glint && <g transform="skewX(-20)"><rect className="glint" x="0" y="0" width="70" height="200" fill={`url(#${id}g)`} /></g>}
      </g>
      {part === "back" && <rect x="4" y="4" width="192" height="192" rx="14" fill="none" stroke="#2f4f9d" strokeWidth="5" />}
    </svg>
  );
}

// The tile in 3D: the flower floats above the tile, it sways slowly and tilts toward a finger, with a glare that follows.
// reveal (0 to 1): the unlock screen paints the newest layer in; flipped: shows the terracotta back.
export default function Mosaic({ learned, size = 120, reveal, flipped, pure }) {
  const id = "m" + useId().replace(/:/g, "");
  let k = reached(learned);
  if (reveal != null) k--; // the newest layer is the one glazing in
  const next = MILESTONES[k], prev = MILESTONES[k - 1] ?? 0;
  const frac = reveal ?? (next ? (learned - prev) / (next - prev) : 1);
  const level = reveal != null && reveal < 1 ? prev : learned; // its auras arrive once it's painted
  const auras = AURAS.filter(([n]) => level >= n).map(([, a]) => a);
  const tilt = e => {
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
    e.currentTarget.style.setProperty("--rx", (.5 - y) * 28 + "deg"); e.currentTarget.style.setProperty("--ry", (x - .5) * 28 + "deg");
    e.currentTarget.style.setProperty("--gx", x * 100 + "%"); e.currentTarget.style.setProperty("--gy", y * 100 + "%");
  };
  const untilt = e => ["--rx", "--ry"].forEach(v => e.currentTarget.style.removeProperty(v));
  const face = { id, k, next: pure ? null : next, frac };
  return (
    <div className={`mosaic ${auras.join(" ")} ${flipped ? "facedown" : ""}`} style={{ width: size, height: size, "--size": size + "px" }}
      role="img" aria-label={`${learned} Wörter gelernt${next && reveal == null ? `, noch ${next - learned} bis zum nächsten Muster` : ""}`}
      onPointerMove={tilt} onPointerLeave={untilt} onPointerUp={untilt}>
      <div className="tilt">
        <div className="obj">
          <i className="edge" />
          <Face {...face} part="back" />
          <Face {...face} part="front" glint={auras.includes("glint")} />
          <i className="glare" />
          <div className="mback"><b>{MILESTONES[k - (reveal != null ? 0 : 1)] ?? learned}</b><small>Wörter</small></div>
        </div>
      </div>
      {auras.includes("sparks") && SPARKS.map(([x, y, d], i) => <i key={i} className="spark" aria-hidden="true" style={{ left: x + "%", top: y + "%", animationDelay: d + "s" }}>✦</i>)}
    </div>
  );
}

// the day each milestone was unveiled, for the plaques in the trophy room (only from the unlock screen on)
const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const dates = () => { try { return JSON.parse(localStorage.getItem("mosaicDates")) || {}; } catch { return {}; } };
const longDay = day => new Date(day + "T12:00").toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });

// a milestone newer than the last one she was shown, if any
export const unseen = learned => { try { return reached(learned) > +(localStorage.getItem("mosaic") ?? 0); } catch { return false; } };

// The unlock screen: the new tile waits face down; a tap turns it over (the tap also lets iOS play sound), the new layer
// glazes in, then a flourish on the guitar, sparks, and what she has reached.
export function Unlock({ learned, done }) {
  const [phase, setPhase] = useState("wait"); // wait | turn | paint | done
  const [reveal, setReveal] = useState(0);
  const k = reached(learned), n = MILESTONES[k - 1];
  const aura = AURAS.find(([a]) => a === n);
  const hush = useRef(() => {});
  useEffect(() => {
    stopMusic();
    try { localStorage.setItem("mosaic", k); localStorage.setItem("mosaicDates", JSON.stringify({ [n]: localDay(), ...dates() })); } catch { /* private mode */ }
  }, [k, n]);
  useEffect(() => () => hush.current(), []); // closed early: cut the build-up
  // once revealed, a soft twinkle now and then, in time with the sparks
  useEffect(() => { if (phase !== "done") return; const t = setInterval(() => play("tinkle"), 2400); return () => clearInterval(t); }, [phase]);
  const open = () => {
    if (phase !== "wait") return;
    setPhase("turn"); play("whoosh"); hush.current = suspense(3.1); // the turn (1.3 s) and the glazing (1.8 s)
    setTimeout(() => {
      setPhase("paint");
      const t0 = performance.now(), D = 1800;
      const step = now => {
        const f = Math.min(1, (now - t0) / D);
        setReveal(f);
        if (f < 1) requestAnimationFrame(step);
        else { setPhase("done"); play("sparkle"); play("shimmer"); fanfare(); }
      };
      requestAnimationFrame(step);
      [0, 450, 900, 1350].forEach(t => setTimeout(() => play("tinkle"), t));
    }, 1300);
  };
  return (
    <div className={`unlock ${phase}`} onClick={open}>
      <p className="ulabel">{phase === "done" ? "¡Nuevo azulejo!" : "Ein neues Muster ist fertig"}</p>
      <div className="ustage">
        <Mosaic learned={learned} size={220} reveal={phase === "done" ? 1 : reveal} flipped={phase === "wait"} />
        {phase === "done" && <div className="burst" aria-hidden="true">{Array.from({ length: 14 }, (_, i) => <i key={i} style={{ "--a": i * 360 / 14 + "deg", animationDelay: (i % 3) * .06 + "s" }}>✦</i>)}</div>}
      </div>
      <div className="ufoot">{/* same height before and after, so the tile doesn't move when the text arrives */}
      {phase === "wait" && <p className="uhint">Tippen zum Aufdecken</p>}
      {phase === "done" && <>
        <h2>{n} Wörter!</h2>
        <p className="utext">{aura ? `Dein Azulejo hat jetzt ${aura[2]}. ✨` : "Dein Azulejo hat ein neues Muster bekommen."}
          {MILESTONES[k] && <><br />Das nächste gibt's bei {MILESTONES[k]} Wörtern.</>}</p>
        <button className="btn primary" onClick={() => { done(); startMusic("casual"); }}>¡Olé!</button>
      </>}
      </div>
    </div>
  );
}

// The trophy room: one walnut display cabinet under a hand-painted azulejo sign. Each milestone stands on a brass plate
// stand on a glass shelf, with an engraved brass label on the shelf's edge; the empty stands wait for the ones to come.
// Tap a tile to see it up close, with the day she got it.
const Corner = ({ x, y }) => (
  <g transform={`translate(${x} ${y})`} fill="#2f4f9d">
    {[0, 90, 180, 270].map(r => <ellipse key={r} cx="0" cy="-4.2" rx="2" ry="3.6" transform={`rotate(${r})`} />)}
    <circle r="1.8" fill="#e0b050" />
  </g>
);
// The brass label: a cartouche with lobed ends and a moulded rim, lit by SVG lighting so the bevel catches the light,
// a brushed grain, two flathead screws and engraved letters. <BrassDefs /> once per screen, then <Plaque>.
const CART = "M17 3H103C109 3 111.5 7 112.5 11C117.5 11 119 15 119 18S117.5 25 112.5 25C111.5 29 109 33 103 33H17C11 33 8.5 29 7.5 25C2.5 25 1 21 1 18S2.5 11 7.5 11C8.5 7 11 3 17 3Z";
// the big one, for a tile up close: lobed sides, a crest top and bottom
const CART_BIG = "M30 8H96C102 8 106 3 120 3S138 8 144 8H210C218 8 222 13 223 21C232 21 238 31 238 56S232 91 223 91C222 99 218 104 210 104H144C138 104 134 109 120 109S102 104 96 104H30C22 104 18 99 17 91C8 91 2 81 2 56S8 21 17 21C18 13 22 8 30 8Z";
const scaled = (sx, sy, dy = 0) => `translate(120 ${56 + dy}) scale(${sx} ${sy}) translate(-120 -56)`;
export const BrassDefs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
    <defs>
      <linearGradient id="brassFace" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f7e2a2" /><stop offset=".38" stopColor="#dcae55" /><stop offset=".52" stopColor="#c4913a" />
        <stop offset=".7" stopColor="#d9aa50" /><stop offset="1" stopColor="#a87a2a" />
      </linearGradient>
      <linearGradient id="brassRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff2c4" /><stop offset=".5" stopColor="#b8862c" /><stop offset="1" stopColor="#5e4210" /></linearGradient>
      <radialGradient id="brassScrew" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff4cf" /><stop offset=".5" stopColor="#c9993f" /><stop offset="1" stopColor="#6b4c14" /></radialGradient>
      <filter id="brassBevel" x="-5%" y="-15%" width="110%" height="130%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="1.3" result="b" />
        <feSpecularLighting in="b" surfaceScale="2.6" specularConstant="1" specularExponent="22" lightingColor="#fff4d6" result="s">
          <feDistantLight azimuth="240" elevation="38" />
        </feSpecularLighting>
        <feComposite in="s" in2="SourceAlpha" operator="in" result="si" />
        <feComposite in="SourceGraphic" in2="si" operator="arithmetic" k2="1" k3=".75" />
      </filter>
      <filter id="brassGrain" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="fractalNoise" baseFrequency=".015 1.1" numOctaves="2" seed="7" />
        <feColorMatrix values="0 0 0 0 1  0 0 0 0 .95  0 0 0 0 .8  0 0 0 .55 -.18" />
        <feComposite in2="SourceGraphic" operator="in" />
      </filter>
      <clipPath id="brassClip"><path d={CART} /></clipPath>
      <clipPath id="brassClipBig"><path d={CART_BIG} /></clipPath>
      <filter id="brassBevelBig" x="-5%" y="-10%" width="110%" height="120%">
        <feGaussianBlur in="SourceAlpha" stdDeviation="2.4" result="b" />
        <feSpecularLighting in="b" surfaceScale="3.4" specularConstant="1" specularExponent="24" lightingColor="#fff4d6" result="s">
          <feDistantLight azimuth="240" elevation="36" />
        </feSpecularLighting>
        <feComposite in="s" in2="SourceAlpha" operator="in" result="si" />
        <feComposite in="SourceGraphic" in2="si" operator="arithmetic" k2="1" k3=".7" />
      </filter>
    </defs>
  </svg>
);
const Screw = ({ x, y = 18, a, s = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`}>
    <circle r="2.7" fill="#4a3410" opacity=".55" transform="translate(.3 .5)" />
    <circle r="2.5" fill="url(#brassScrew)" />
    <path d="M-1.9 0H1.9" stroke="#4a3410" strokeWidth=".8" strokeLinecap="round" transform={`rotate(${a})`} />
  </g>
);
const Engrave = ({ d, t = "" }) => <><path d={d} fill="none" stroke="#fff1c2" strokeWidth=".7" opacity=".8" transform={`translate(0 .55) ${t}`} /><path d={d} fill="none" stroke="#5a3e12" strokeWidth=".7" transform={t} /></>;
export const Plaque = ({ children, size = 1 }) => (
  <svg className="plaque" viewBox="0 0 120 36" width={120 * size * .74} height={36 * size * .74} aria-hidden="true">
    <path d={CART} fill="#3a2a0c" opacity=".55" transform="translate(0 1.6)" />{/* its shadow on the glass */}
    <path d={CART} fill="url(#brassRim)" />
    <g filter="url(#brassBevel)">
      <path d={CART} fill="url(#brassFace)" transform="translate(60 18) scale(.955 .87) translate(-60 -18)" />
    </g>
    <rect width="120" height="36" filter="url(#brassGrain)" clipPath="url(#brassClip)" />
    <path d={CART} fill="none" stroke="#7a5a1c" strokeWidth=".55" opacity=".8" transform="translate(60 18) scale(.86 .66) translate(-60 -18)" />
    <path d={CART} fill="none" stroke="#fff2c4" strokeWidth=".45" opacity=".7" transform="translate(60 18.5) scale(.86 .66) translate(-60 -18)" />
    <Engrave d="M14.5 18C16.2 15 19.6 15 20 17.6C20.3 19 18.4 19.4 17.9 18.3" />
    <Engrave d="M105.5 18C103.8 15 100.4 15 100 17.6C99.7 19 101.6 19.4 102.1 18.3" />
    <Screw x={6.5} a={35} /><Screw x={113.5} a={-60} />
    <text x="60" y="22.3" textAnchor="middle" className="engraved hi">{children}</text>
    <text x="60" y="21.7" textAnchor="middle" className="engraved">{children}</text>
  </svg>
);

// a little four-petal azulejo flower, engraved
const Flower = ({ x, y, r = 1 }) => (
  <g transform={`translate(${x} ${y}) scale(${r})`}>
    {[0, 90, 180, 270].map(a => <Engrave key={a} d="M0 -1.4C1.8 -3 1.8 -5.6 0 -7 -1.8 -5.6 -1.8 -3 0 -1.4Z" t={`rotate(${a})`} />)}
    <circle r="1" fill="#5a3e12" />
  </g>
);
// beads along the inner moulding
const BEADS = [...Array.from({ length: 27 }, (_, i) => [42 + i * 5.85, 22]), ...Array.from({ length: 27 }, (_, i) => [42 + i * 5.85, 90])];
export const PlaqueBig = ({ n, day }) => (
  <svg className="plaque big" viewBox="0 0 240 112" aria-hidden="true">
    <path d={CART_BIG} fill="#3a2a0c" opacity=".5" transform="translate(0 3)" />
    <path d={CART_BIG} fill="url(#brassRim)" />
    <g filter="url(#brassBevelBig)"><path d={CART_BIG} fill="url(#brassFace)" transform={scaled(.965, .925)} /></g>
    <rect width="240" height="112" filter="url(#brassGrain)" clipPath="url(#brassClipBig)" />
    {/* the moulding: a dark cut and its bright edge, twice */}
    {[[.9, .8], [.875, .755]].map(([sx, sy]) => <g key={sx}>
      <path d={CART_BIG} fill="none" stroke="#6b4c14" strokeWidth=".8" opacity=".85" transform={scaled(sx, sy)} />
      <path d={CART_BIG} fill="none" stroke="#fff2c4" strokeWidth=".6" opacity=".75" transform={scaled(sx, sy, .7)} />
    </g>)}
    {BEADS.map(([x, y]) => <g key={x + "," + y}><circle cx={x} cy={y + .5} r="1.05" fill="#fff1c2" opacity=".7" /><circle cx={x} cy={y} r="1" fill="#6b4c14" /></g>)}
    {/* scrolls in the corners */}
    {[[1, 1], [-1, 1], [1, -1], [-1, -1]].map(([sx, sy]) => (
      <g key={sx + "" + sy} transform={`translate(120 56) scale(${sx} ${sy}) translate(-120 -56)`}>
        <Engrave d="M31.5 37C30.5 31.5 34.5 28.6 37.6 30.4C40 31.8 39.2 35 36.9 34.9C35.4 34.8 35 33.2 36 32.6" /><Engrave d="M31.5 37C33.5 32 38.5 28.6 47 28.2" /><Engrave d="M42 28.6C43.5 26.6 46 26.4 47 28.2C45.6 29.6 43.4 29.8 42 28.6Z" />
      </g>
    ))}
    <Flower x={120} y={13} r={.9} /><Flower x={120} y={99} r={.9} />
    <Screw x={10} y={56} a={35} s={1.5} /><Screw x={230} y={56} a={-60} s={1.5} />
    <text x="120" y={day ? 49.8 : 64.8} textAnchor="middle" className="engraved big hi">{n} Wörter</text>
    <text x="120" y={day ? 49 : 64} textAnchor="middle" className="engraved big">{n} Wörter</text>
    {day && <>
      <Engrave d="M72 61H112M128 61H168" />
      <Flower x={120} y={61} r={.55} />
      <text x="120" y="76.6" textAnchor="middle" className="engraved small hi">erreicht am {day}</text>
      <text x="120" y="76" textAnchor="middle" className="engraved small">erreicht am {day}</text>
    </>}
  </svg>
);

export function Trophies({ learned, done }) {
  const [open, setOpen] = useState(null);
  const [nope, setNope] = useState(null); // an empty stand, shaking
  const k = reached(learned), when = dates();
  const rows = [];
  for (let i = 0; i < MILESTONES.length; i += 3) rows.push(MILESTONES.slice(i, i + 3));
  const tap = n => {
    if (n <= learned) { setOpen(n); play("tinkle"); return; }
    setNope(n); play("wrong"); setTimeout(() => setNope(null), 500);
  };
  return (
    <div className="screen trophies">
      <BrassDefs />
      <Top done={done} />
      {/* a street-name sign: three glazed tiles, painted by hand */}
      <div className="tsign" role="heading" aria-level="2">
        <svg className="tsign-paint" viewBox="0 0 300 100" preserveAspectRatio="none" aria-hidden="true">
          <rect x="9" y="9" width="282" height="82" rx="3" fill="none" stroke="#2f4f9d" strokeWidth="3.2" />
          <rect x="14" y="14" width="272" height="72" rx="2" fill="none" stroke="#e0b050" strokeWidth="1.4" />
          <Corner x={22} y={22} /><Corner x={278} y={22} /><Corner x={22} y={78} /><Corner x={278} y={78} />
        </svg>
        <span>Sala de trofeos</span>
      </div>
      <p className="tally">{k} von {MILESTONES.length} Azulejos gesammelt</p>
      <div className="cabinet">
        <div className="vitrine">
          {rows.map((row, r) => (
            <div key={r} className="tier">
              {row.map(n => {
                const got = n <= learned, isNext = n === MILESTONES[k];
                return (
                  <button key={n} className={`exhibit ${got ? "got" : "empty"} ${isNext ? "next" : ""} ${nope === n ? "nope" : ""}`} onClick={() => tap(n)}
                    aria-label={got ? `Azulejo für ${n} Wörter ansehen` : `Noch nicht erreicht: ${n} Wörter`}>
                    <span className="stand">{got && <Mosaic learned={n} size={66} pure />}</span>
                    <span className="tplate"><Plaque>{got || !isNext ? `${n} Wörter` : `noch ${n - learned}`}</Plaque></span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
      {open && (
        <div className="showcase" onClick={() => setOpen(null)}>
          <Mosaic learned={open} size={230} pure />
          <PlaqueBig n={open} day={when[open] && longDay(when[open])} />
          {AURAS.find(([a]) => a === open) && <p className="utext">Mit {AURAS.find(([a]) => a === open)[2]}. ✨</p>}
          <p className="uhint">Tippen zum Schließen</p>
        </div>
      )}
    </div>
  );
}
