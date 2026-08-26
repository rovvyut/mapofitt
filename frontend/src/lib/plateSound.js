/**
 * The BUILD YOUR PLATE rev.
 *
 * Synthesised in the Web Audio API from oscillators and filtered noise —
 * there is no recording involved, so there is no sample to license and nothing
 * borrowed from any manufacturer's engine note. What it borrows is the shape:
 * a low fundamental with stacked harmonics, a fast rise, a filter that opens
 * as it climbs, and a short decay with a touch of overrun. Roughly 700ms.
 *
 * Rules it keeps to:
 *   · Nothing is created until the first user gesture. No AudioContext is
 *     constructed at import time, which is what gets a page flagged for
 *     autoplay in Safari and wastes a hardware audio unit on every visitor.
 *   · Muted state persists, and prefers-reduced-motion is treated as a signal
 *     that a sudden loud noise is unwelcome too.
 *   · Peak gain is modest. This is a confirmation, not a car.
 */

const STORAGE_KEY = "mapo_sound";

let ctx = null;
let master = null;

export function isMuted() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored != null) return stored === "off";
  } catch {
    /* private mode — fall through to the motion preference */
  }
  // No stored choice: default to sound off for anyone who has asked the
  // system to calm things down, on for everyone else.
  return Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function setMuted(muted) {
  try {
    localStorage.setItem(STORAGE_KEY, muted ? "off" : "on");
  } catch {
    /* nothing to do — the setting is per-session then */
  }
  if (master && ctx) {
    master.gain.setTargetAtTime(muted ? 0 : 1, ctx.currentTime, 0.02);
  }
}

function ensureContext() {
  if (ctx) return ctx;
  const AudioCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtor) return null;
  ctx = new AudioCtor();
  master = ctx.createGain();
  master.gain.value = isMuted() ? 0 : 1;
  master.connect(ctx.destination);
  return ctx;
}

/** A short burst of filtered noise — the exhaust texture over the tone. */
function noiseBuffer(context, seconds) {
  const frames = Math.floor(context.sampleRate * seconds);
  const buffer = context.createBuffer(1, frames, context.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < frames; i += 1) {
    // Brown-ish noise: integrating white noise pushes energy low, which is
    // what makes it read as exhaust rather than hiss.
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    data[i] = last * 3.2;
  }
  return buffer;
}

/**
 * Play the rev. Call only from inside a user gesture handler.
 * Returns the approximate duration in ms so callers can time the visuals.
 */
export function playRev({ intensity = 1 } = {}) {
  if (isMuted()) return 0;
  const context = ensureContext();
  if (!context) return 0;
  if (context.state === "suspended") context.resume();

  const t0 = context.currentTime;
  const dur = 0.72;

  const bus = context.createGain();
  bus.gain.value = 0;
  bus.connect(master);

  // One filter for the whole voice, opening as the revs climb. The sweep is
  // most of what sells it — a static filter sounds like a synth pad.
  const filter = context.createBiquadFilter();
  filter.type = "lowpass";
  filter.Q.value = 6;
  filter.frequency.setValueAtTime(180, t0);
  filter.frequency.exponentialRampToValueAtTime(1900, t0 + 0.22);
  filter.frequency.exponentialRampToValueAtTime(420, t0 + dur);
  filter.connect(bus);

  // Fundamental plus two harmonics, slightly detuned so they beat against
  // each other the way cylinders do.
  const partials = [
    { type: "sawtooth", from: 58, to: 168, gain: 0.55, detune: 0 },
    { type: "sawtooth", from: 87, to: 252, gain: 0.3, detune: 7 },
    { type: "square", from: 116, to: 336, gain: 0.16, detune: -9 },
  ];

  const nodes = partials.map((p) => {
    const osc = context.createOscillator();
    osc.type = p.type;
    osc.detune.value = p.detune;
    osc.frequency.setValueAtTime(p.from, t0);
    osc.frequency.exponentialRampToValueAtTime(p.to * intensity, t0 + 0.20);
    osc.frequency.exponentialRampToValueAtTime(p.to * 0.62, t0 + dur);

    const g = context.createGain();
    g.gain.value = p.gain;
    osc.connect(g);
    g.connect(filter);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
    return osc;
  });

  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer(context, dur);
  const noiseGain = context.createGain();
  noiseGain.gain.setValueAtTime(0.0, t0);
  noiseGain.gain.linearRampToValueAtTime(0.22, t0 + 0.06);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  noise.connect(noiseGain);
  noiseGain.connect(filter);
  noise.start(t0);
  noise.stop(t0 + dur);

  // Envelope: hard attack, brief hold at the top of the rev, quick fall.
  bus.gain.setValueAtTime(0.0001, t0);
  bus.gain.exponentialRampToValueAtTime(0.34, t0 + 0.045);
  bus.gain.setValueAtTime(0.34, t0 + 0.19);
  bus.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  // Tidy up so a page that revs a hundred times does not leak a hundred graphs.
  const stopAt = (t0 + dur + 0.1 - context.currentTime) * 1000;
  setTimeout(() => {
    nodes.forEach((n) => n.disconnect());
    noise.disconnect();
    bus.disconnect();
    filter.disconnect();
  }, Math.max(0, stopAt));

  return dur * 1000;
}

/** A quieter click for the +/- controls. Same rules apply. */
export function playTick() {
  if (isMuted()) return;
  const context = ensureContext();
  if (!context) return;
  if (context.state === "suspended") context.resume();

  const t0 = context.currentTime;
  const osc = context.createOscillator();
  const g = context.createGain();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(420, t0);
  osc.frequency.exponentialRampToValueAtTime(180, t0 + 0.08);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.08, t0 + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
  osc.connect(g);
  g.connect(master);
  osc.start(t0);
  osc.stop(t0 + 0.12);
  setTimeout(() => {
    osc.disconnect();
    g.disconnect();
  }, 200);
}
