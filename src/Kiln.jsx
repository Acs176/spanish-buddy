import { useEffect, useRef, useState } from "react";
import VERBS, { PEOPLE, states, waiting } from "./verbs.js";

const rnd = (a, b) => a + Math.random() * (b - a);

// ---------- the brickwork, painted once ----------
// arch: the kiln's mouth and its azulejo sill; without it, a plain wall for the game's pages
export function paintBricks(canvas, arch) {
  const c = canvas.getContext("2d");
  c.scale(2, 2);
  c.fillStyle = "#0f0a08"; c.fillRect(0, 0, 375, 812);
  const speck = (x, y, w, h, n) => { for (let i = 0; i < n; i++) { c.fillStyle = Math.random() < .5 ? `rgba(0,0,0,${rnd(.08, .3)})` : `rgba(255,210,170,${rnd(.03, .13)})`; c.fillRect(x + rnd(0, w), y + rnd(0, h), rnd(.5, 1.6), rnd(.5, 1.6)); } };
  // a brick is a closed shape: fill, grain, lit top edge, shaded lower edge
  const shape = (path, box, l0, l1) => {
    c.save(); path(); c.fillStyle = `hsl(${rnd(11, 24)} ${rnd(38, 56)}% ${rnd(l0, l1)}%)`; c.fill(); c.clip();
    const g = c.createLinearGradient(0, box[1], 0, box[1] + box[3]);
    g.addColorStop(0, "rgba(255,225,190,.14)"); g.addColorStop(.25, "rgba(255,225,190,0)"); g.addColorStop(.75, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,.34)");
    c.fillStyle = g; c.fillRect(box[0], box[1], box[2], box[3]);
    speck(box[0], box[1], box[2], box[3], box[2] * box[3] / 16);
    c.restore();
  };
  const rect = (x, y, w, h) => () => { c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, 2) : c.rect(x, y, w, h); };
  // running bond wall
  for (let row = 0, y = 0; y < 812; row++, y += 25) for (let x = row % 2 ? -32 : -2; x < 375; x += 62) {
    const w = 59 + rnd(-1, 1), h = 22 + rnd(-.6, .6);
    shape(rect(x, y + rnd(-.5, .5), w, h), [x, y, w, h], 20, 34);
  }
  if (!arch) return;
  const cx = 187.5, cy = 340, r0 = 118, r1 = 174;
  // mortar bed behind the arch and jambs
  c.fillStyle = "#0a0605"; c.beginPath(); c.arc(cx, cy, r1 + 3, Math.PI, 0); c.lineTo(cx + r1 + 3, 562); c.lineTo(cx - r1 - 3, 562); c.closePath(); c.fill();
  // arch: 21 wedge bricks fanning round the opening
  const N = 21, gap = .011;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI + i * Math.PI / N + gap, a1 = Math.PI + (i + 1) * Math.PI / N - gap, ro = r1 + rnd(-1.4, 1.4);
    shape(() => { c.beginPath(); c.arc(cx, cy, ro, a0, a1); c.arc(cx, cy, r0 - 1, a1, a0, true); c.closePath(); }, [cx - r1, cy - r1, r1 * 2, r1], 30, 44);
  }
  // jambs
  for (let y = cy + 2; y < 560; y += 31) for (const s of [-1, 1]) {
    const w = 53 + rnd(-1.5, 1.5), x = s < 0 ? cx - r0 - w - 1 : cx + r0 + 1, h = Math.min(29, 560 - y);
    shape(rect(x, y, w, h), [x, y, w, h], 28, 41);
  }
  // sill with a band of azulejos, the app's own tile
  const sy = 560, sh = 34, sx = 24, sw = 327;
  c.fillStyle = "#050302"; c.fillRect(sx - 2, sy - 2, sw + 4, sh + 8);
  const n = Math.round(sw / sh), t = sw / n;
  for (let i = 0; i < n; i++) {
    const x = sx + i * t, m = x + t / 2, my = sy + sh / 2;
    const g = c.createLinearGradient(x, sy, x + t, sy + sh); g.addColorStop(0, "#f5ecd8"); g.addColorStop(1, "#d7c8a8");
    c.fillStyle = g; c.fillRect(x + .6, sy + .6, t - 1.2, sh - 1.2);
    c.strokeStyle = "rgba(47,79,157,.55)"; c.lineWidth = .7; c.strokeRect(x + 2.6, sy + 2.6, t - 5.2, sh - 5.2);
    for (let k = 0; k < 4; k++) { c.save(); c.translate(m, my); c.rotate(k * Math.PI / 2 + (i % 2 ? Math.PI / 4 : 0)); c.fillStyle = "#2f4f9d"; c.beginPath(); c.ellipse(0, -7.5, 2.8, 6, 0, 0, 7); c.fill(); c.restore(); }
    c.fillStyle = "#c4572f"; c.beginPath(); c.arc(m, my, 2.3, 0, 7); c.fill();
  }
  const gl = c.createLinearGradient(0, sy, 0, sy + sh); gl.addColorStop(0, "rgba(255,255,255,.2)"); gl.addColorStop(.3, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,.28)");
  c.fillStyle = gl; c.fillRect(sx, sy, sw, sh);
  // the floor falls away into the dark
  const f = c.createLinearGradient(0, sy + sh, 0, 812); f.addColorStop(0, "#0c0705"); f.addColorStop(1, "#040302");
  c.fillStyle = f; c.fillRect(0, sy + sh + 4, 375, 812);
}

// ---------- the tile ----------
// Shared gradients and glaze; render once per screen. Not display:none, or the browser drops the gradients.
export const TileDefs = () => (
  <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true"><defs>
    <linearGradient id="tb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fdf7e8" /><stop offset=".6" stopColor="#f3e7cd" /><stop offset="1" stopColor="#ddcba6" /></linearGradient>
    <linearGradient id="tg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".5" /><stop offset=".35" stopColor="#fff" stopOpacity="0" /></linearGradient>
    <radialGradient id="tyo" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#d9683a" /><stop offset="1" stopColor="#a93f19" /></radialGradient>
    <radialGradient id="ttu" cx=".4" cy=".35" r=".8"><stop offset="0" stopColor="#476fc4" /><stop offset="1" stopColor="#2a4a9b" /></radialGradient>
    <filter id="tgl" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="3.4" result="b" />
      <feSpecularLighting in="b" surfaceScale="4" specularConstant="1" specularExponent="44" lightingColor="#fff" result="s"><feDistantLight azimuth="232" elevation="50" /></feSpecularLighting>
      <feComposite in="s" in2="SourceAlpha" operator="in" result="sp" /><feComposite in="SourceGraphic" in2="sp" operator="arithmetic" k1="0" k2="1" k3=".9" k4="0" /></filter>
  </defs></svg>
);
const ROT = [240, 300, 180, 60, 120, 0]; // yo on the left, tú on the right; the first petals point sideways so that reads at once
export const PETAL = "M100 30C127 46 125 74 100 91 75 74 73 46 100 30Z";
const WET = ["#e4b9a2", "#adbbd9"], WET_LINE = ["#c78d70", "#8596bb"], FIRED_LINE = ["#7c2a0e", "#172f70"];
function Petal({ i, state, fresh }) {
  const who = i < 3 ? 0 : 1;
  const look = state === "empty" ? { fill: "#e9dcc2", fillOpacity: .55, stroke: "#a79777", strokeOpacity: .6, strokeWidth: 1, strokeDasharray: "2.5 3" }
    : state === "wet" ? { fill: WET[who], stroke: WET_LINE[who], strokeWidth: 1 }
    : { fill: who ? "url(#ttu)" : "url(#tyo)", stroke: FIRED_LINE[who], strokeWidth: 1.2 };
  return <g transform={`rotate(${ROT[i]} 100 100)`}><path d={PETAL} className={fresh ? "tpop" : undefined} {...look} /></g>;
}
// petals: six states from states() in verbs.js. fresh: index of the petal that just landed. gold: a finished tile.
export const Tile = ({ petals, fresh, gold }) => (
  <svg className="gtile" viewBox="0 0 200 200" aria-hidden="true">
    <rect x="2" y="2" width="196" height="196" rx="15" fill="url(#tb)" />
    <rect x="3" y="3" width="194" height="194" rx="14" fill="none" stroke={gold ? "#d9a441" : "#fff"} strokeOpacity={gold ? 1 : .75} strokeWidth={gold ? 6 : 2} />
    <rect x="15" y="15" width="170" height="170" rx="7" fill="none" stroke="#2f4f9d" strokeWidth="2.4" />
    <rect x="21" y="21" width="158" height="158" rx="4" fill="none" stroke="#c99a3f" strokeWidth="1.3" />
    <g filter="url(#tgl)">
      {["M15 40A25 25 0 0 0 40 15", "M160 15A25 25 0 0 0 185 40", "M15 160A25 25 0 0 1 40 185", "M160 185A25 25 0 0 1 185 160"].map(d => <path key={d} d={d} fill="none" stroke="#2f4f9d" strokeWidth="3" />)}
      {petals.map((s, i) => <Petal key={i} i={i} state={s} fresh={i === fresh} />)}
      <circle cx="100" cy="100" r="15" fill="#d9a441" stroke="#8f6a1e" strokeWidth="1.2" /><circle cx="100" cy="100" r="7" fill="#c4572f" />
    </g>
    <rect x="2" y="2" width="196" height="196" rx="15" fill="url(#tg)" opacity={petals.includes("wet") ? .35 : 1} />
  </svg>
);

// ---------- the scene ----------
const sprite = (r, g, b) => {
  const s = document.createElement("canvas"); s.width = s.height = 64;
  const c = s.getContext("2d"), a = c.createRadialGradient(32, 32, 0, 32, 32, 32);
  a.addColorStop(0, `rgba(${r},${g},${b},1)`); a.addColorStop(.35, `rgba(${r},${g},${b},.45)`); a.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = a; c.fillRect(0, 0, 64, 64);
  return s;
};

// flames rise from the chamber floor, narrowing and cooling as they climb; embers drift out into the room.
// heat() says how hard it burns, 0 to 1. Returns the function that stops it.
function burnLoop({ fire, front, embers, lit, glow, fit }, heat) {
  const SPR = [sprite(255, 150, 48), sprite(250, 104, 22), sprite(198, 52, 12), sprite(96, 20, 5)];
  const fc = fire.getContext("2d"), bc = front.getContext("2d"), ec = embers.getContext("2d");
  [fc, bc, ec].forEach(c => c.scale(2, 2));
  let flames = [], sparks = [], h = heat(), last = performance.now(), time = 0, raf;
  const frame = now => {
    const dt = Math.min(.05, (now - last) / 1000); last = now; time += dt;
    fit();
    const target = heat();
    h += (target - h) * Math.min(1, dt * (target > h ? 1.25 : 1.6));
    const flick = h * (.86 + .1 * Math.sin(time * 13) + .07 * Math.sin(time * 29 + 1));
    lit.style.opacity = Math.min(1, flick * 1.05);
    glow.style.opacity = Math.min(1, flick * .95);
    for (let i = 0, n = h * 300 * dt * 2.1; i < n; i++) {
      const x = 118 + (Math.random() + Math.random() - 1) * (60 + 250 * h);
      flames.push({ x, y: rnd(322, 338), vx: (118 - x) * rnd(.04, .22), vy: -rnd(130, 230 + 330 * h), s: rnd(38, 56 + 74 * h), age: 0, life: rnd(.5, .8 + .85 * h), seed: rnd(0, 7), front: Math.random() < .22 });
    }
    fc.clearRect(0, 0, 236, 338); fc.globalCompositeOperation = "lighter";
    bc.clearRect(0, 0, 236, 338); bc.globalCompositeOperation = "lighter";
    flames = flames.filter(p => (p.age += dt) < p.life);
    for (const p of flames) {
      const k = p.age / p.life;
      p.x += (p.vx + Math.sin(time * 7 + p.seed) * 22) * dt; p.y += p.vy * dt;
      const size = p.s * (1 - k * .78), spr = SPR[k < .16 ? 0 : k < .46 ? 1 : k < .78 ? 2 : 3];
      const a = (k < .1 ? k * 10 : 1 - k) * .34;
      fc.globalAlpha = a;
      fc.drawImage(spr, p.x - size * .3, p.y - size * .75, size * .6, size * 1.5); // tall and narrow: tongues, not puffs
      if (p.front && k < .42) { bc.globalAlpha = a * (1 - k / .42) * 1.6; bc.drawImage(spr, p.x - size * .24, p.y - size * .6, size * .48, size * 1.2); } // licks up the front of the tile
    }
    fc.globalAlpha = bc.globalAlpha = 1;
    if (Math.random() < dt * (2 + 34 * h)) sparks.push({ x: rnd(90, 285), y: rnd(380, 555), vx: rnd(-16, 16), vy: -rnd(26, 92), life: rnd(1.4, 3.4), age: 0, r: rnd(.7, 1.9), seed: rnd(0, 7) });
    ec.clearRect(0, 0, 375, 812); ec.globalCompositeOperation = "lighter";
    sparks = sparks.filter(p => (p.age += dt) < p.life);
    for (const p of sparks) {
      p.x += (p.vx + Math.sin(time * 2.2 + p.seed) * 13) * dt; p.y += p.vy * dt;
      const a = Math.sin(Math.PI * p.age / p.life), d = p.r * 7;
      ec.globalAlpha = a * .9; ec.drawImage(SPR[1], p.x - d / 2, p.y - d / 2, d, d);
      ec.globalAlpha = a; ec.drawImage(SPR[0], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ec.globalAlpha = 1;
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  return () => cancelAnimationFrame(raf);
}

// how many tiles fit on the shelf, and how far they come forward at the end
function layout(n) {
  const [cols, size] = n === 1 ? [1, 125] : n === 2 ? [2, 100] : n <= 4 ? [2, 88] : [3, 66];
  const gap = 8, rows = Math.ceil(n / cols), w = cols * size + (cols - 1) * gap, h = rows * size + (rows - 1) * gap;
  return { cols, size, gap, h, scale: Math.min(1.6, 300 / w), dy: 380 - (533 - h / 2) };
}

// She lights the fire herself; the night passes in five seconds; the tile comes out glazed. Tap during the fire to skip it.
// done: when she leaves, her wet petals count as fired from then on.
export default function Kiln({ painted, day, done }) {
  const [forms] = useState(() => waiting(painted, day));
  const [stage, setStage] = useState("idle"); // idle → burn → hot → fired → forward → end
  const heat = useRef(.14), timers = useRef([]);
  const r = { wall: useRef(), lit: useRef(), fire: useRef(), front: useRef(), embers: useRef(), glow: useRef(), fit: useRef() };
  const verbs = VERBS.filter(v => forms.some(f => f.v === v));
  const L = layout(verbs.length);

  useEffect(() => {
    paintBricks(r.wall.current, true);
    r.lit.current.getContext("2d").drawImage(r.wall.current, 0, 0);
    let size;
    const fit = () => {
      const d = document.documentElement, s = Math.min(d.clientWidth / 375, d.clientHeight / 812);
      if (s !== size) r.fit.current.style.transform = `translate(-50%,-50%) scale(${size = s})`;
    };
    const stop = burnLoop({ fire: r.fire.current, front: r.front.current, embers: r.embers.current, lit: r.lit.current, glow: r.glow.current, fit }, () => heat.current);
    return () => { stop(); timers.current.forEach(clearTimeout); };
  }, []);

  const finish = () => { timers.current.forEach(clearTimeout); heat.current = .2; setStage("end"); };
  const burn = () => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return finish();
    heat.current = 1; setStage("burn");
    timers.current = [
      setTimeout(() => setStage("hot"), 1500),
      setTimeout(() => setStage("fired"), 3000),
      setTimeout(() => { heat.current = .2; setStage("forward"); }, 3900),
      setTimeout(() => setStage("end"), 4700),
    ];
  };
  const skippable = ["burn", "hot", "fired"].includes(stage);
  const names = new Intl.ListFormat("de").format(forms.map(f => f.v.forms[f.p]));
  const say = stage === "idle" ? "Über Nacht getrocknet" : stage === "end" ? "¡Qué bonito!" : stage === "burn" || stage === "hot" ? "¡Fuego!" : "";
  const sub = stage === "idle" ? `${names} ${forms.length === 1 ? "wartet" : "warten"} auf das Feuer.` : stage === "end" ? `${names}, fest eingebrannt.` : "";
  const cls = { hot: "khot", fired: "khot kfired", forward: "kfired kforward", end: "kfired kforward" }[stage] ?? "";

  return (
    <div className={`kiln ${cls}`} onClick={skippable ? finish : undefined}>
      <div className="kfit" ref={r.fit}>
        <div className="kscene">
          <canvas className="kwall" ref={r.wall} width="750" height="1624" />
          <canvas className="klit" ref={r.lit} width="750" height="1624" />
          <div className="kmouth">
            <div className="kglow" ref={r.glow} />
            <div className="kdepth" />
            <canvas className="kflames" ref={r.fire} width="472" height="676" />
          </div>
          <svg className="ktrivet" viewBox="0 0 133 24" aria-hidden="true"><path d="M8 3h117M26 3 18 23M107 3l8 20" stroke="#17100c" strokeWidth="5" strokeLinecap="round" fill="none" /><path d="M8 2h117" stroke="#5a4438" strokeWidth="1" strokeLinecap="round" /></svg>
          <div className="kdim" />
          <div className="kvig" />
          <canvas className="kembers" ref={r.embers} width="750" height="1624" />
          <div className="ktiles" style={{ gridTemplateColumns: `repeat(${L.cols}, ${L.size}px)`, gap: L.gap, top: 533 - L.h, "--dy": `${L.dy}px`, "--sc": L.scale }}>
            {verbs.map(v => (
              <div key={v.id} className="ktile" style={{ width: L.size, height: L.size }}>
                <div className="kwet"><Tile petals={states(v, painted)} /></div>
                <div className="kglazed"><Tile petals={states(v, painted, true)} /></div>
                <div className="khotlayer" />
                <div className="kclip"><i /></div>
              </div>
            ))}
          </div>
          <div className="kfront"><canvas ref={r.front} width="472" height="676" /></div>
          <div className="kverb">{verbs.length === 1 ? verbs[0].id : "¿Quién?"}</div>
          <div className="kui">
            <div className="ksay">{say}</div>
            <div className="ksub">{sub}</div>
            {stage === "idle" && <button className="kgo" onClick={burn}>Feuer machen</button>}
            {stage === "end" && <button className="kgo" onClick={done}>Zur Wand</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
