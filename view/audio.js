// All sound is synthesised with Web Audio. No audio files.

let ctx = null;
let enabled = true;
let scratchAt = 0;

export function setSound(on) {
  enabled = on;
}

/** Must be called from a user gesture once (iOS unlock). */
export function unlockAudio() {
  try {
    ctx ??= new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    ctx = null;
  }
}

function tone(freq, { at = 0, dur = 0.25, type = 'sine', gain = 0.12, glide = null } = {}) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + at;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise({ at = 0, dur = 0.05, gain = 0.05, freq = 3000 } = {}) {
  if (!enabled || !ctx) return;
  const t = ctx.currentTime + at;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = 0.8;
  const g = ctx.createGain();
  g.gain.value = gain;
  src.connect(f).connect(g).connect(ctx.destination);
  src.start(t);
}

export const sfx = {
  clue() {
    tone(880, { dur: 0.5, gain: 0.08 });
    tone(1320, { at: 0.06, dur: 0.6, gain: 0.05 });
  },
  tick() {
    tone(1600, { dur: 0.05, type: 'square', gain: 0.03 });
  },
  wrong() {
    tone(220, { dur: 0.22, type: 'triangle', gain: 0.1, glide: 160 });
  },
  right() {
    tone(660, { dur: 0.18, gain: 0.09 });
    tone(990, { at: 0.09, dur: 0.3, gain: 0.08 });
  },
  scratch() {
    const now = performance.now();
    if (now - scratchAt < 55) return;
    scratchAt = now;
    noise({ dur: 0.045, gain: 0.035, freq: 2500 + Math.random() * 1500 });
  },
  close() {
    tone(520, { dur: 0.12, type: 'triangle', gain: 0.06 });
  },
  trace() {
    noise({ dur: 1.0, gain: 0.02, freq: 1800 });
  },
  stamp(mult) {
    tone(90, { dur: 0.25, type: 'sine', gain: 0.25, glide: 50 });
    noise({ dur: 0.08, gain: 0.08, freq: 600 });
    if (mult >= 100) {
      [523, 659, 784, 1047].forEach((f, i) => tone(f, { at: 0.12 + i * 0.09, dur: 0.5, type: 'triangle', gain: 0.07 }));
    } else if (mult < 3) {
      tone(196, { at: 0.12, dur: 0.5, type: 'triangle', gain: 0.07, glide: 147 });
    } else {
      tone(523, { at: 0.12, dur: 0.3, type: 'triangle', gain: 0.06 });
      tone(659, { at: 0.22, dur: 0.4, type: 'triangle', gain: 0.06 });
    }
  },
  bar() {
    tone(330 + Math.random() * 60, { dur: 0.12, type: 'triangle', gain: 0.05 });
  },
  fanfare() {
    [392, 523, 659, 784, 1047].forEach((f, i) => tone(f, { at: i * 0.11, dur: 0.7, type: 'triangle', gain: 0.07 }));
  },
};

export function haptic(ms = 12) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    /* unsupported */
  }
}
