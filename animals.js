'use strict';

const ANIMALS = [
  { emoji:'🐱', name:'Cat',  sound:'cat'  },
  { emoji:'🐶', name:'Dog',  sound:'dog'  },
  { emoji:'🐮', name:'Cow',  sound:'cow'  },
  { emoji:'🐸', name:'Frog', sound:'frog' },
  { emoji:'🐦', name:'Bird', sound:'bird' },
  { emoji:'🦁', name:'Lion', sound:'lion' },
];

// ── Audio ──────────────────────────────────────────────────────────────────

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playCat() {
  const ctx = getAudioCtx(); ctx.resume();
  const osc = ctx.createOscillator(), env = ctx.createGain();
  osc.type = 'sine';
  const t = ctx.currentTime + 0.02;
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.linearRampToValueAtTime(1200, t + 0.15);
  osc.frequency.linearRampToValueAtTime(700, t + 0.38);
  env.gain.setValueAtTime(0.18, t);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
  osc.connect(env); env.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.43);
}

function playDog() {
  const ctx = getAudioCtx(); ctx.resume();
  [0, 0.30].forEach(offset => {
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = 'sawtooth';
    const t = ctx.currentTime + 0.02 + offset;
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(110, t + 0.22);
    env.gain.setValueAtTime(0.20, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.26);
    osc.connect(env); env.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.28);
  });
}

function playCow() {
  const ctx = getAudioCtx(); ctx.resume();
  const osc = ctx.createOscillator(), env = ctx.createGain();
  const lfo = ctx.createOscillator(), lfoGain = ctx.createGain();
  osc.type = 'sine'; osc.frequency.value = 130;
  lfo.type = 'sine'; lfo.frequency.value = 6;
  lfoGain.gain.value = 10;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.connect(env); env.connect(ctx.destination);
  const t = ctx.currentTime + 0.02;
  env.gain.setValueAtTime(0.22, t);
  env.gain.setValueAtTime(0.20, t + 0.55);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.90);
  lfo.start(t); osc.start(t);
  lfo.stop(t + 0.91); osc.stop(t + 0.91);
}

function playFrog() {
  const ctx = getAudioCtx(); ctx.resume();
  [0, 0.20].forEach(offset => {
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 95;
    const t = ctx.currentTime + 0.02 + offset;
    env.gain.setValueAtTime(0.15, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    osc.connect(env); env.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.16);
  });
}

function playBird() {
  const ctx = getAudioCtx(); ctx.resume();
  [0, 0.22, 0.44].forEach(offset => {
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = 'sine';
    const t = ctx.currentTime + 0.02 + offset;
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.linearRampToValueAtTime(2200, t + 0.08);
    osc.frequency.linearRampToValueAtTime(1600, t + 0.18);
    env.gain.setValueAtTime(0.14, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    osc.connect(env); env.connect(ctx.destination);
    osc.start(t); osc.stop(t + 0.22);
  });
}

function playLion() {
  const ctx = getAudioCtx(); ctx.resume();
  const osc = ctx.createOscillator(), env = ctx.createGain();
  osc.type = 'sawtooth';
  const t = ctx.currentTime + 0.02;
  osc.frequency.setValueAtTime(55, t);
  osc.frequency.linearRampToValueAtTime(45, t + 0.6);
  osc.detune.setValueAtTime(0, t);
  osc.detune.linearRampToValueAtTime(60, t + 0.3);
  osc.detune.linearRampToValueAtTime(-30, t + 0.7);
  env.gain.setValueAtTime(0.28, t);
  env.gain.setValueAtTime(0.24, t + 0.5);
  env.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
  osc.connect(env); env.connect(ctx.destination);
  osc.start(t); osc.stop(t + 0.96);
}

const SOUND_FNS = { cat:playCat, dog:playDog, cow:playCow, frog:playFrog, bird:playBird, lion:playLion };

// ── Speech ─────────────────────────────────────────────────────────────────

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85; u.pitch = 1.1; u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

// ── Particles ──────────────────────────────────────────────────────────────

function spawnParticles(cx, cy, color) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const size  = 7 + Math.random() * 9;
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 45 + Math.random() * 80;
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
    ], { duration:480 + Math.random()*180, easing:'cubic-bezier(0,.9,.57,1)', fill:'forwards' })
      .onfinish = () => el.remove();
  }
}

// ── Game logic ────────────────────────────────────────────────────────────

function handleTap(animal, cardEl) {
  SOUND_FNS[animal.sound]();
  setTimeout(() => speak(animal.name), 180);
  const r = cardEl.getBoundingClientRect();
  spawnParticles(r.left + r.width / 2, r.top + r.height / 2, '#34d399');
  cardEl.classList.remove('bounce');
  void cardEl.offsetWidth;
  cardEl.classList.add('bounce');
  cardEl.addEventListener('animationend', () => cardEl.classList.remove('bounce'), { once: true });
}

function init() {
  const grid = document.getElementById('animals-grid');
  ANIMALS.forEach(animal => {
    const card = document.createElement('div');
    card.className = 'animal-card';
    card.innerHTML = `<div class="animal-emoji">${animal.emoji}</div><div class="animal-name">${animal.name}</div>`;
    card.addEventListener('click',    ()  => handleTap(animal, card));
    card.addEventListener('touchend', (e) => { e.preventDefault(); handleTap(animal, card); }, { passive: false });
    grid.appendChild(card);
  });
}

document.addEventListener('DOMContentLoaded', init);
