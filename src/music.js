// Background guitar, made in code like sound.js: "casual" (major key, rumba chops) on the home screen,
// "flamenco" (Andalusian cadence Am–G–F–E) on the ¿Quién? wall. Each 4-chord round picks its own chords,
// picking pattern, melody and ending, so it doesn't loop the same. Off when localStorage "music" is "off".
// The flamenco one is also saved standalone in sketches/music-flamenco.html.
import { ac } from "./sound.js";

export const musicOn = () => { try { return localStorage.getItem("music") !== "off"; } catch { return true; } };
export const setMusic = on => { try { localStorage.setItem("music", on ? "on" : "off"); } catch { /* private mode */ } };

const VOLUME = .22; // light background, well under the voice and the chimes
const r = a => a[Math.floor(Math.random() * a.length)];

const STYLES = {
  casual: {
    beats: 8, eighth: 60 / 104 / 2, swing: .03, tail: 1.6, decay: .497, smooth: false, lowpass: 4200,
    chords: { A: [110, 164.8, 220, 277.2, 329.6], D: [146.8, 220, 293.7, 370, 440], E: [82.4, 123.5, 164.8, 207.7, 246.9], "F#m": [92.5, 138.6, 185, 220, 277.2], "C#m": [138.6, 207.7, 277.2, 329.6, 415.3], Bm: [123.5, 185, 246.9, 293.7, 370] },
    progs: [["A", "D", "E", "A"], ["A", "F#m", "D", "E"], ["D", "E", "C#m", "F#m"], ["A", "E", "F#m", "D"], ["Bm", "E", "A", "A"]],
    pats: [[0, 3, "x", 4, 2, 3, "x", 4], [0, 2, "x", 3, 4, 2, "x", 3], [0, 4, "x", 3, 0, 4, "x", 3], [0, 3, "x", 2, 4, 3, "x", 2]], // x: a muted chop
    melodyAt: [0, 3, 5], melody: .75, strum: .45,
  },
  flamenco: {
    beats: 6, eighth: 60 / 76 / 2, swing: 0, tail: 2.5, decay: .4985, smooth: true, lowpass: 2600,
    chords: { Am: [110, 164.8, 220, 261.6, 329.6], G: [98, 146.8, 196, 246.9, 293.7], F: [87.3, 130.8, 174.6, 220, 261.6], E: [82.4, 123.5, 164.8, 207.7, 246.9], Dm: [73.4, 146.8, 220, 293.7, 349.2], C: [130.8, 164.8, 196, 261.6, 329.6] },
    progs: [["Am", "G", "F", "E"], ["Am", "G", "F", "E"], ["Dm", "C", "Am", "E"], ["F", "E", "Am", "E"], ["Am", "Dm", "Am", "E"]],
    pats: [[0, 2, 3, 4, 3, 2], [0, 2, 4, 3, 4, 2], [0, 3, 2, 4, 2, 3], [0, 2, 3, 2, 4, 3]],
    melodyAt: [0, 3], melody: .7, strum: .4,
  },
};

// Karplus-Strong: a burst of noise fed back through a short delay rings like a plucked string
const cache = {};
function string(c, s, f) {
  const k = s.decay + ":" + f;
  if (cache[k]) return cache[k];
  const len = c.sampleRate * s.tail, N = Math.round(c.sampleRate / f), b = c.createBuffer(1, len, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < N; i++) d[i] = Math.random() * 2 - 1;
  if (s.smooth) for (let i = 1; i < N; i++) d[i] = (d[i] + d[i - 1]) / 2; // softer pick
  for (let i = N + 1; i < len; i++) d[i] = (d[i - N] + d[i - N - 1]) * s.decay; // from N+1: d[-1] would be NaN and silence it all
  return cache[k] = b;
}
function chopBuffer(c) {
  if (cache.chop) return cache.chop;
  const n = c.sampleRate * .05, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 3;
  return cache.chop = b;
}

let cur = null; // { timer, out }
document.addEventListener("visibilitychange", () => { if (cur) document.hidden ? ac().suspend() : ac().resume(); });

export function startMusic(name) {
  stopMusic();
  if (!musicOn() || !window.AudioContext) return;
  const c = ac(), s = STYLES[name], out = c.createGain(), lp = c.createBiquadFilter();
  if (c.state !== "running") document.addEventListener("pointerdown", () => c.resume(), { once: true }); // iOS: only after a tap
  out.gain.value = VOLUME; lp.type = "lowpass"; lp.frequency.value = s.lowpass;
  out.connect(lp).connect(c.destination);

  const at = t => Math.max(c.currentTime, t + (Math.random() - .5) * .014); // a human isn't a metronome
  const note = (f, t, v) => {
    const src = c.createBufferSource(), g = c.createGain();
    src.buffer = string(c, s, f); g.gain.value = v * (.85 + Math.random() * .3);
    src.connect(g).connect(out); src.start(at(t));
  };
  const chop = t => {
    const src = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = .8; g.gain.value = .35 * (.8 + Math.random() * .4);
    src.buffer = chopBuffer(c); src.connect(f).connect(g).connect(out); src.start(at(t));
  };

  let next = c.currentTime + .1, step = 0, round = -1, prog, pat, mel, strum, last = 660;
  const tune = ch => { // melody: wander between the chord's upper notes, mostly by small steps
    const pool = s.chords[ch].slice(2).map(f => f * 2);
    const i = pool.reduce((b, f, k) => Math.abs(f - last) < Math.abs(pool[b] - last) ? k : b, 0);
    return last = pool[Math.min(pool.length - 1, Math.max(0, i + r([-1, 0, 1])))];
  };
  const tick = () => {
    while (next < c.currentTime + .3) {
      const e = step % s.beats, bar = Math.floor(step / s.beats) % 4;
      if (e === 0 && bar === 0) { // new round: the first progression comes back every 4th, melody sits out now and then
        round++; prog = round % 4 ? r(s.progs) : s.progs[0]; pat = r(s.pats);
        mel = round % 4 !== 0 && Math.random() < s.melody; strum = Math.random() < s.strum;
      }
      const fs = s.chords[prog[bar]], t = next + (e % 2 ? s.swing : 0), end = strum && bar === 3;
      if (name === "casual") {
        if (end && [0, 3, 4].includes(e)) (e === 3 ? [...fs].reverse() : fs).forEach((f, k) => note(f, t + k * .012, e === 3 ? .18 : .26)); // down, up, down
        else if (end && e > 4) { if (e === 6) chop(t); }
        else if (pat[e] === "x") chop(t);
        else note(fs[pat[e]], t, e === 0 ? .42 : e === 3 ? .32 : .24);
      } else {
        if (end && e === 0) { fs.forEach((f, k) => note(f, t + k * .018, .32)); note(fs[4] * 2, t + .1, .15); } // rasgueado
        else if (!(end && e < 3)) note(fs[pat[e]], t, e === 0 ? .5 : .32);
      }
      if (mel && s.melodyAt.includes(e) && Math.random() < .8)
        note(name === "flamenco" && bar === 3 && e === 3 && prog[3] === "E" ? 329.6 : tune(prog[bar]), t + .01, name === "casual" ? .26 : .3);
      next += s.eighth * (name === "flamenco" ? (e === 0 ? 1.08 : 1) * (bar === 3 && e === s.beats - 1 && round % 2 ? 1.25 : 1) : 1);
      step++;
    }
  };
  cur = { timer: setInterval(tick, 80), out };
  tick();
}

export function stopMusic() {
  if (!cur) return;
  const { timer, out } = cur, c = ac();
  clearInterval(timer);
  out.gain.setTargetAtTime(0, c.currentTime, .25); // fade, notes already scheduled ring out quietly
  setTimeout(() => out.disconnect(), 1500);
  cur = null;
}
