// Lightweight WebAudio SFX — synth-based, no network or assets.
// One shared AudioContext, lazily created on the first user gesture.

let ctx: AudioContext | null = null;
let muted = false;
let master: GainNode | null = null;

const KEY = "sfx:muted";

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.35;
      master.connect(ctx.destination);
    } catch { return null; }
  }
  if (ctx.state === "suspended") { ctx.resume().catch(() => {}); }
  return ctx;
}

if (typeof window !== "undefined") {
  try { muted = localStorage.getItem(KEY) === "1"; } catch { /* ignore */ }
}

export function isMuted() { return muted; }
export function setMuted(v: boolean) {
  muted = v;
  try { localStorage.setItem(KEY, v ? "1" : "0"); } catch { /* ignore */ }
  if (master) master.gain.value = v ? 0 : 0.35;
}
export function toggleMuted() { setMuted(!muted); return muted; }

type Tone = {
  freq: number;
  dur: number;         // seconds
  type?: OscillatorType;
  vol?: number;
  slideTo?: number;    // freq slide destination
  attack?: number;
  release?: number;
};

function tone({ freq, dur, type = "sine", vol = 0.6, slideTo, attack = 0.005, release = 0.05 }: Tone) {
  const c = ensure(); if (!c || muted || !master) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), c.currentTime + dur);
  g.gain.setValueAtTime(0, c.currentTime);
  g.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur + release);
  osc.connect(g).connect(master);
  osc.start();
  osc.stop(c.currentTime + dur + release + 0.02);
}

function noiseBurst(dur = 0.08, vol = 0.4, filterFreq = 1200) {
  const c = ensure(); if (!c || muted || !master) return;
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * dur), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = c.createBufferSource(); src.buffer = buf;
  const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.frequency.value = filterFreq; bp.Q.value = 1.2;
  const g = c.createGain(); g.gain.value = vol;
  src.connect(bp).connect(g).connect(master);
  src.start();
}

// --- Public SFX ---------------------------------------------------------------

/** Plinko peg tick — pitch varies slightly for texture. */
export function sfxPeg(strength = 1) {
  const f = 1400 + Math.random() * 900;
  tone({ freq: f, dur: 0.04, type: "triangle", vol: Math.min(0.35, 0.15 + strength * 0.15), attack: 0.001, release: 0.02 });
}

/** Wheel tick per segment pass. */
export function sfxTick() {
  tone({ freq: 900, dur: 0.03, type: "square", vol: 0.18, attack: 0.001, release: 0.02 });
}

/** Ball drop start. */
export function sfxDrop() {
  tone({ freq: 500, dur: 0.15, type: "sine", vol: 0.25, slideTo: 200, attack: 0.005, release: 0.05 });
}

/** Win chime — pitch scales with multiplier. */
export function sfxWin(multiplier = 1) {
  const base = 440 + Math.min(500, multiplier * 60);
  [0, 0.08, 0.16].forEach((t, i) => {
    setTimeout(() => tone({ freq: base * [1, 1.25, 1.5][i], dur: 0.22, type: "triangle", vol: 0.3, release: 0.15 }), t * 1000);
  });
}

/** Bust / lose thud. */
export function sfxBust() {
  tone({ freq: 220, dur: 0.35, type: "sawtooth", vol: 0.28, slideTo: 60, release: 0.2 });
  noiseBurst(0.18, 0.15, 400);
}

/** Spin whoosh (wheel). */
export function sfxSpin() {
  noiseBurst(0.4, 0.18, 2200);
}

/** Cashout ding. */
export function sfxCashout() {
  tone({ freq: 880, dur: 0.12, type: "sine", vol: 0.28, release: 0.08 });
  setTimeout(() => tone({ freq: 1320, dur: 0.18, type: "sine", vol: 0.28, release: 0.12 }), 80);
}
