'use strict';

const EMOJIS = ['🍎','⭐','🌸','🐶','🚗','🎈','🍭','🦋','🐠','🌙'];

const CELEB = [
  { emoji:'🎉', text:'Amazing!'   },
  { emoji:'⭐', text:'Superstar!' },
  { emoji:'🌈', text:'Perfect!'   },
  { emoji:'🎊', text:'Well Done!' },
];

let total = 0, tappedCount = 0, busy = false;

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

// ── Speech ─────────────────────────────────────────────────────────────────

function speak(text) {
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.85; u.pitch = 1.1; u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

// ── Particles + Confetti + Celebration ────────────────────────────────────

function spawnParticles(cx, cy, color) {
  const count = 10;
  for (let i = 0; i < count; i++) {
    const size  = 6 + Math.random() * 8;
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 40 + Math.random() * 70;
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

// ── Game logic ────────────────────────────────────────────────────────────

function startRound() {
  busy      = false;
  tappedCount = 0;
  total     = 1 + Math.floor(Math.random() * 5);
  const emoji = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  document.getElementById('count-display').textContent = '';
  const area = document.getElementById('objects-area');
  area.innerHTML = '';

  for (let i = 0; i < total; i++) {
    const el = document.createElement('div');
    el.className   = 'obj';
    el.textContent = emoji;
    el.addEventListener('click',    ()  => handleObjTap(el));
    el.addEventListener('touchend', (e) => { e.preventDefault(); handleObjTap(el); }, { passive: false });
    area.appendChild(el);
  }

  setTimeout(() => speak('Count with me!'), 400);
}

function handleObjTap(el) {
  if (el.classList.contains('tapped') || busy) return;
  el.classList.add('tapped');
  tappedCount++;

  const r = el.getBoundingClientRect();
  spawnParticles(r.left + r.width / 2, r.top + r.height / 2, '#60a5fa');
  playTone([261 + tappedCount * 42], 0.14, 'sine', 0.28);
  speak(String(tappedCount));

  document.getElementById('count-display').textContent = tappedCount;

  if (tappedCount === total) {
    busy = true;
    setTimeout(() => {
      speak(total + '!');
      playTone([523, 659, 784, 1047], 0.16, 'sine', 0.5);
      showCelebration(() => startRound());
    }, 700);
  }
}

// ── Boot ──────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', startRound);
