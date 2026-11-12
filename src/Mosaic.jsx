import { useEffect, useId, useRef, useState } from "react";
import { play } from "./sound.js";
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
export default function Mosaic({ learned, size = 120, reveal, flipped }) {
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
  const face = { id, k, next, frac };
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
  useEffect(() => { stopMusic(); try { localStorage.setItem("mosaic", k); } catch { /* private mode */ } }, [k]);
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
