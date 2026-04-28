// Generates WAV audio files for Kids Wordle sound effects
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 22050;
const OUT_DIR = path.join(__dirname, '../assets/sounds');

function makeWav(samples) {
  const numSamples = samples.length;
  const buf = Buffer.alloc(44 + numSamples * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + numSamples * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);        // chunk size
  buf.writeUInt16LE(1, 20);         // PCM
  buf.writeUInt16LE(1, 22);         // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28); // byte rate
  buf.writeUInt16LE(2, 32);         // block align
  buf.writeUInt16LE(16, 34);        // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(numSamples * 2, 40);
  for (let i = 0; i < numSamples; i++) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(clamped * 32767), 44 + i * 2);
  }
  return buf;
}

function sine(t, freq) {
  return Math.sin(2 * Math.PI * freq * t);
}

function envelope(t, attack, decay, sustain, release, total) {
  if (t < attack) return t / attack;
  if (t < attack + decay) return 1 - (1 - sustain) * (t - attack) / decay;
  if (t < total - release) return sustain;
  return sustain * (1 - (t - (total - release)) / release);
}

// 1. Bubble pop — VERY gentle. Soft tippy plink, ~35ms. Quiet so rapid typing
//    doesn't become annoying. Two slightly detuned sines for warmth.
function bubblePop() {
  const dur = 0.035;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    // Subtle high-pitched plink — narrow downward sweep
    const freq = 1700 * Math.pow(0.7, frac); // 1700 → ~1200 Hz
    // Sin-shaped envelope — no clicks at start or end
    const env = Math.sin(Math.PI * frac);
    // Layer two slightly detuned sines for a softer, less synthetic feel
    const s = sine(t, freq) * 0.7 + sine(t, freq * 1.005) * 0.3;
    samples[i] = s * env * 0.16; // very quiet
  }
  return makeWav(samples);
}

// 2. Cat meow — frequency wobble, 350ms
function catMeow() {
  const dur = 0.35;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    // Pitch: rises then falls like a meow
    const baseFreq = 300 + 250 * Math.sin(Math.PI * frac);
    // Add slight vibrato
    const vibrato = 1 + 0.04 * Math.sin(2 * Math.PI * 5 * t);
    const freq = baseFreq * vibrato;
    phase += freq / SAMPLE_RATE;
    const env = envelope(t, 0.02, 0.05, 0.7, 0.08, dur);
    // Add harmonics for cat-like timbre
    const s = (sine(phase, 1) * 0.5 + sine(phase * 2, 1) * 0.3 + sine(phase * 3, 1) * 0.15);
    samples[i] = s * env * 0.6;
  }
  return makeWav(samples);
}

// 3. Surprise pop — ascending whoosh + pluck, 200ms
function surprisePop() {
  const dur = 0.2;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    const freq = 200 + 800 * frac * frac; // accelerating upward sweep
    const env = frac < 0.1 ? frac / 0.1 : Math.exp(-(frac - 0.1) * 6);
    samples[i] = (sine(t, freq) + sine(t, freq * 1.5) * 0.4) * env * 0.65;
  }
  return makeWav(samples);
}

// 4. Win fanfare — happy ascending arpeggio C-E-G-C, 600ms
function winFanfare() {
  const notes = [261.63, 329.63, 392.00, 523.25]; // C4 E4 G4 C5
  const noteDur = 0.13;
  const totalDur = notes.length * noteDur + 0.15;
  const n = Math.floor(totalDur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let ni = 0; ni < notes.length; ni++) {
    const freq = notes[ni];
    const start = Math.floor(ni * noteDur * SAMPLE_RATE);
    const noteN = Math.floor(noteDur * SAMPLE_RATE * 1.5);
    for (let i = 0; i < noteN && start + i < n; i++) {
      const t = i / SAMPLE_RATE;
      const env = Math.exp(-t * 8);
      samples[start + i] += (sine(t, freq) * 0.6 + sine(t, freq * 2) * 0.25) * env * 0.7;
    }
  }
  // Normalize
  const max = Math.max(...samples.map(Math.abs));
  if (max > 0) for (let i = 0; i < n; i++) samples[i] /= max * 1.1;
  return makeWav(samples);
}

// 5. Wrong guess — low thud, 120ms
function wrongGuess() {
  const dur = 0.12;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    const freq = 120 + 30 * Math.exp(-frac * 5);
    const env = Math.exp(-frac * 8);
    samples[i] = (sine(t, freq) + sine(t, freq * 1.5) * 0.3) * env * 0.7;
  }
  return makeWav(samples);
}

// 6. Correct letter (yellow/green) — bright chime, 150ms
function correctLetter() {
  const dur = 0.15;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    const env = Math.exp(-frac * 6);
    samples[i] = (sine(t, 880) * 0.5 + sine(t, 1320) * 0.35 + sine(t, 1760) * 0.15) * env * 0.6;
  }
  return makeWav(samples);
}

// 7. Submit charm — sparkly twinkle when player presses OK on a complete word.
//    Two-note ascending chime + high glassy harmonic. ~280ms.
function submitCharm() {
  const dur = 0.28;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  // E5 then A5 — bright, hopeful, kid-friendly
  const notes = [
    { freq: 659.25, start: 0.00, len: 0.18 },
    { freq: 880.00, start: 0.06, len: 0.22 },
  ];
  for (const note of notes) {
    const startN = Math.floor(note.start * SAMPLE_RATE);
    const noteN  = Math.floor(note.len  * SAMPLE_RATE);
    for (let i = 0; i < noteN && startN + i < n; i++) {
      const t = i / SAMPLE_RATE;
      // Soft attack, smooth exponential decay — bell-like
      const env = Math.min(1, t * 30) * Math.exp(-t * 6);
      const s   = sine(t, note.freq) * 0.5
                + sine(t, note.freq * 2) * 0.22   // octave
                + sine(t, note.freq * 3) * 0.10;  // 12th — adds shimmer
      samples[startN + i] += s * env * 0.55;
    }
  }
  // Light high-pitched sparkle on top
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    if (frac > 0.15 && frac < 0.7) {
      const env = Math.sin(Math.PI * (frac - 0.15) / 0.55) * 0.12;
      samples[i] += sine(t, 2200 + 400 * Math.sin(2 * Math.PI * 8 * t)) * env;
    }
  }
  // Normalize gently
  const max = samples.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  if (max > 0.95) for (let i = 0; i < n; i++) samples[i] *= 0.95 / max;
  return makeWav(samples);
}

// 8. Dinosaur roar — low rumble + growl + decay. Extinct animals have no recordings,
//    so we synthesize a kid-friendly roar (not too scary). ~700ms.
function dinoRoar() {
  const dur = 0.7;
  const n = Math.floor(dur * SAMPLE_RATE);
  const samples = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const frac = t / dur;
    // Pitch sweep down: 180 Hz → 80 Hz
    const freq = 180 - 100 * frac;
    // Heavy harmonic richness with growl modulation
    const growl = 1 + 0.4 * Math.sin(2 * Math.PI * 22 * t); // 22 Hz growl
    const phase = 2 * Math.PI * freq * t;
    const s = Math.sin(phase * growl) * 0.5
            + Math.sin(phase * 2 * growl) * 0.25
            + Math.sin(phase * 3) * 0.15
            // Add some "breath" noise on top
            + (Math.random() - 0.5) * 0.15;
    // Envelope: quick attack, sustained, slow release
    const env = frac < 0.05 ? frac / 0.05 : (frac < 0.7 ? 1 : (1 - (frac - 0.7) / 0.3));
    samples[i] = s * env * 0.7;
  }
  return makeWav(samples);
}

// Write all files (synth-only sounds — real animal recordings come from fetch_real_sounds.js)
const sounds = {
  'bubble_pop.wav': bubblePop(),
  'surprise_pop.wav': surprisePop(),
  'win_fanfare.wav': winFanfare(),
  'wrong_guess.wav': wrongGuess(),
  'correct_letter.wav': correctLetter(),
  'submit_charm.wav': submitCharm(),
  'dinosaur.wav': dinoRoar(),
};

for (const [name, buf] of Object.entries(sounds)) {
  const p = path.join(OUT_DIR, name);
  fs.writeFileSync(p, buf);
  console.log(`Generated ${name} (${buf.length} bytes)`);
}
console.log('All sounds generated!');
