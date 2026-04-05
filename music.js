'use strict';

const KEYS = [
  { note:'C', freq:262, color:'#ef4444' },
  { note:'D', freq:294, color:'#f97316' },
  { note:'E', freq:330, color:'#facc15' },
  { note:'F', freq:349, color:'#22c55e' },
  { note:'G', freq:392, color:'#14b8a6' },
  { note:'A', freq:440, color:'#3b82f6' },
  { note:'B', freq:494, color:'#a855f7' },
];

// ── Audio ──────────────────────────────────────────────────────────────────

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playXylNote(freq) {
  try {
    const ctx = getAudioCtx(); ctx.resume();
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    osc.connect(env); env.connect(ctx.destination);
    const t = ctx.currentTime + 0.02;
    env.gain.setValueAtTime(0.26, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.90);
    osc.start(t); osc.stop(t + 0.92);
  } catch (_) {}
}

function playDrum() {
  try {
    const ctx = getAudioCtx(); ctx.resume();
    const bufSize = Math.floor(ctx.sampleRate * 0.20);
    const buffer  = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data    = buffer.getChannelData(0);
    for (let i = 0; i < bufSize; i++) data[i] = Math.random() * 2 - 1;

    const src    = ctx.createBufferSource();
    src.buffer   = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type  = 'lowpass';
    filter.frequency.value = 160;
    const env    = ctx.createGain();
    src.connect(filter); filter.connect(env); env.connect(ctx.destination);
    const t = ctx.currentTime + 0.02;
    env.gain.setValueAtTime(0.7, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    src.start(t);
  } catch (_) {}
}

function playBell() {
  try {
    const ctx = getAudioCtx(); ctx.resume();
    [[880, 0.18], [1760, 0.07]].forEach(([freq, gain]) => {
      const osc = ctx.createOscillator(), env = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      osc.connect(env); env.connect(ctx.destination);
      const t = ctx.currentTime + 0.02;
      env.gain.setValueAtTime(gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
      osc.start(t); osc.stop(t + 1.52);
    });
  } catch (_) {}
}

// ── Particles ──────────────────────────────────────────────────────────────

function spawnParticles(cx, cy, color) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const size  = 6 + Math.random() * 8;
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 35 + Math.random() * 65;
    const el    = document.createElement('div');
    el.style.cssText = `
      position:fixed; z-index:2000; pointer-events:none; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${cx - size/2}px; top:${cy - size/2}px;
      background:${i % 4 === 0 ? '#fff' : color};
    `;
    document.body.appendChild(el);
    el.animate([
      { transform:'translate(0,0) scale(1)', opacity:1 },
      { transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(.15)`, opacity:0 },
    ], { duration:400 + Math.random()*160, easing:'cubic-bezier(0,.9,.57,1)', fill:'forwards' })
      .onfinish = () => el.remove();
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────

function centerOf(el) {
  const r = el.getBoundingClientRect();
  return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
}

function pressAnim(el) {
  el.classList.add('pressed');
  setTimeout(() => el.classList.remove('pressed'), 130);
}

// ── Init ──────────────────────────────────────────────────────────────────

function init() {
  const xylo = document.getElementById('xylophone');
  KEYS.forEach(key => {
    const div = document.createElement('div');
    div.className   = 'xyl-key';
    div.textContent = key.note;
    div.dataset.color = key.color;

    const play = () => {
      playXylNote(key.freq);
      pressAnim(div);
      const { cx, cy } = centerOf(div);
      spawnParticles(cx, cy, key.color);
    };

    div.addEventListener('pointerdown', e => { e.preventDefault(); play(); });
    xylo.appendChild(div);
  });

  const drumBtn = document.getElementById('drum-btn');
  const bellBtn = document.getElementById('bell-btn');

  drumBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    playDrum();
    const { cx, cy } = centerOf(drumBtn);
    spawnParticles(cx, cy, '#e2e8f0');
  });

  bellBtn.addEventListener('pointerdown', e => {
    e.preventDefault();
    playBell();
    const { cx, cy } = centerOf(bellBtn);
    spawnParticles(cx, cy, '#fde047');
  });
}

document.addEventListener('DOMContentLoaded', init);
