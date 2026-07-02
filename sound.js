'use strict';

// ── Shared Web Audio sound effects for all games ─────────────────────────────
// Everything is synthesized on the fly — no audio files, no network.
// Exposed as a single global: Sound.{tone, pop, chime, sparkle, victory, buzz}

const Sound = (() => {
  let ctx = null;

  function ac() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    // iOS suspends the context until a user gesture; every call retries
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  /** Sequence of soft tones (arpeggio when given several frequencies) */
  function tone(freqs, { gain = 0.15, type = 'sine', spacing = 0.11, decay = 0.35 } = {}) {
    try {
      const c = ac();
      freqs.forEach((freq, i) => {
        const osc = c.createOscillator();
        const env = c.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        osc.connect(env);
        env.connect(c.destination);
        const t = c.currentTime + i * spacing;
        env.gain.setValueAtTime(gain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + decay);
        osc.start(t);
        osc.stop(t + decay + 0.02);
      });
    } catch (_) { /* audio blocked – silent fallback */ }
  }

  /** Bubble pop: rising blip + tiny noise burst. Pitch varies each time. */
  function pop() {
    try {
      const c = ac();
      const t = c.currentTime;

      const base = 340 + Math.random() * 220;
      const osc = c.createOscillator();
      const env = c.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 2.4, t + 0.09);
      env.gain.setValueAtTime(0.22, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(env);
      env.connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.16);

      // Short filtered noise burst for the "pk" of the pop
      const dur = 0.05;
      const buf = c.createBuffer(1, Math.ceil(c.sampleRate * dur), c.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      const src = c.createBufferSource();
      src.buffer = buf;
      const bp = c.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = 1800;
      const nEnv = c.createGain();
      nEnv.gain.setValueAtTime(0.18, t);
      nEnv.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(bp);
      bp.connect(nEnv);
      nEnv.connect(c.destination);
      src.start(t);
    } catch (_) { /* silent fallback */ }
  }

  /** Twinkly two-note chime (star catch) */
  function chime() {
    const base = [880, 1174, 1318][Math.floor(Math.random() * 3)];
    tone([base, base * 1.5], { gain: 0.14, spacing: 0.07, decay: 0.5 });
  }

  /** Quick glittery run upward (special bubbles) */
  function sparkle() {
    tone([784, 988, 1318, 1568], { gain: 0.12, spacing: 0.055, decay: 0.3 });
  }

  /** Victory chord — round complete / celebration */
  function victory() {
    tone([523, 659, 784, 1047], { gain: 0.18 });
  }

  /** Gentle "try again" buzz */
  function buzz() {
    tone([220], { gain: 0.06, type: 'sawtooth', decay: 0.3 });
  }

  return { tone, pop, chime, sparkle, victory, buzz };
})();
