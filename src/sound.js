// Little sounds, made on the fly with Web Audio, no files. Off when localStorage "sound" is "off" (Einstellungen).
// On an iPhone the silent switch mutes them too.
let ctx;
export const soundOn = () => { try { return localStorage.getItem("sound") !== "off"; } catch { return true; } };
export const setSound = on => { try { localStorage.setItem("sound", on ? "on" : "off"); } catch { /* private mode */ } };

export function ac() {
  ctx ||= new AudioContext();
  if (ctx.state === "suspended") ctx.resume(); // iOS starts it suspended until a tap
  return ctx;
}

function tone(f, at, len, type = "sine", vol = .25) {
  const c = ac(), o = c.createOscillator(), g = c.createGain(), s = c.currentTime + at;
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(0, s);
  g.gain.linearRampToValueAtTime(vol, s + .01);
  g.gain.exponentialRampToValueAtTime(.001, s + len);
  o.connect(g).connect(c.destination);
  o.start(s); o.stop(s + len);
  return o;
}

const SOUNDS = {
  right() { tone(659, 0, .25, "triangle"); tone(880, .09, .4, "triangle"); },
  wrong() { tone(220, 0, .35, "sine", .3).frequency.exponentialRampToValueAtTime(150, ac().currentTime + .3); },
  done() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * .11, i === 3 ? .8 : .3, "triangle")); tone(1319, .44, .8, "sine", .08); },
  crackle() {
    const c = ac(), n = c.sampleRate * 1.2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) * (Math.random() < .004 ? 1 : .03); // hiss with pops
    const s = c.createBufferSource(), f = c.createBiquadFilter();
    f.type = "highpass"; f.frequency.value = 800; s.buffer = b;
    s.connect(f).connect(c.destination); s.start();
  },
  // the unlock screen (Mosaic.jsx): the tile turning over, the glaze going on, and the reveal
  whoosh() {
    const c = ac(), n = c.sampleRate * .9, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0), t = c.currentTime;
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.sin(Math.PI * i / n);
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    f.type = "bandpass"; f.Q.value = 1.2; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(2600, t + .8);
    g.gain.value = .5; s.buffer = b; s.connect(f).connect(g).connect(c.destination); s.start();
  },
  tinkle() { [0, .07, .15].forEach(at => tone(1800 + Math.random() * 1400, at, .35, "sine", .05)); },
  // after the reveal: a shower of high chimes that thins out over three seconds
  shimmer() { for (let i = 0; i < 26; i++) { const at = 3 * (i / 26) ** 1.6; tone(1700 + Math.random() * 2600, at, .7, "sine", .05 * (1 - at / 3.4)); } },
  sparkle() { for (let i = 0; i < 9; i++) tone(2000 + Math.random() * 2200, i * .05, .5, "sine", .045); },
  ding() { tone(1047, 0, .9, "sine", .12); tone(1568, .05, .9, "sine", .08); },
};

export function play(name) {
  if (!soundOn() || !window.AudioContext) return;
  try { SOUNDS[name](); } catch { /* no audio: stay quiet */ }
}
