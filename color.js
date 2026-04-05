'use strict';

const COLORS = [
  { name:'Red',    hex:'#ef4444' },
  { name:'Blue',   hex:'#3b82f6' },
  { name:'Yellow', hex:'#facc15' },
  { name:'Green',  hex:'#22c55e' },
  { name:'Purple', hex:'#a855f7' },
  { name:'Orange', hex:'#f97316' },
];

const CELEB = [
  { emoji:'🎉', text:'Amazing!'   },
  { emoji:'⭐', text:'Superstar!' },
  { emoji:'🌈', text:'Perfect!'   },
  { emoji:'🎊', text:'Well Done!' },
];

let target = null;
let busy   = false;

// ── Audio ──────────────────────────────────────────────────────────────────

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playTone(freqs, gain = 0.15, type = 'sine', duration = 0.38) {
  try {
    const ctx = getAudioCtx();
    ctx.resume();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(env);
      env.connect(ctx.destination);
      const t = ctx.currentTime + 0.02 + i * 0.11;
      env.gain.setValueAtTime(gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    });
  } catch (_) {}
}

// ── Particles + Confetti + Celebration ────────────────────────────────────

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

function spawnConfetti() {
  const palette = ['#FF3B30','#007AFF','#FF9F0A','#30D158','#FF2D55','#BF5AF2','#FFD60A'];
  const el   = document.createElement('div');
  const size = 7 + Math.random() * 12;
  const isRect = Math.random() > 0.5;
  el.style.cssText = `
    position:fixed; z-index:3000; pointer-events:none;
    width:${size}px; height:${isRect ? size * .5 : size}px;
    border-radius:${isRect ? '2px' : '50%'};
    background:${palette[Math.floor(Math.random() * palette.length)]};
    left:${Math.random() * window.innerWidth}px; top:-16px;
  `;
  document.body.appendChild(el);
  el.animate([
    { transform:`translateY(0) rotate(0deg)`, opacity:1 },
    { transform:`translateY(${window.innerHeight+30}px) rotate(${360+Math.random()*400}deg)`, opacity:.85 },
  ], { duration:1400 + Math.random()*900, easing:'ease-in', fill:'forwards' })
    .onfinish = () => el.remove();
}

function showCelebration(onDone) {
  const pick = CELEB[Math.floor(Math.random() * CELEB.length)];
  document.getElementById('celebEmoji').textContent = pick.emoji;
  document.getElementById('celebText').textContent  = pick.text;
  document.getElementById('celebration').classList.add('active');
  for (let i = 0; i < 30; i++) setTimeout(spawnConfetti, Math.random() * 800);
  setTimeout(() => {
    document.getElementById('celebration').classList.remove('active');
    if (onDone) onDone();
  }, 2200);
}

function shakeEl(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// ── Game logic ────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function startRound() {
  busy = false;
  const four = shuffle(COLORS).slice(0, 4);
  target = four[Math.floor(Math.random() * 4)];

  document.getElementById('target-circle').style.background = target.hex;
  document.getElementById('color-name').textContent = target.name.toUpperCase();

  const grid = document.getElementById('blobs-grid');
  grid.innerHTML = '';
  shuffle(four).forEach(color => {
    const btn = document.createElement('div');
    btn.className = 'blob';
    btn.style.background = color.hex;
    btn.addEventListener('click',    ()  => handleTap(color, btn));
    btn.addEventListener('touchend', (e) => { e.preventDefault(); handleTap(color, btn); }, { passive: false });
    grid.appendChild(btn);
  });
}

function handleTap(color, blobEl) {
  if (busy) return;
  if (color.name === target.name) {
    busy = true;
    const r = blobEl.getBoundingClientRect();
    spawnParticles(r.left + r.width / 2, r.top + r.height / 2, color.hex);
    playTone([523, 659, 784, 1047], 0.16, 'sine', 0.45);
    showCelebration(() => startRound());
  } else {
    shakeEl(blobEl);
    playTone([180, 150], 0.10, 'sawtooth', 0.22);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', startRound);
