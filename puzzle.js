'use strict';

// ── Puzzle definitions ────────────────────────────────────────────────────────
// Each puzzle has a name, icon, grid columns, and 2–3 SVG pieces.

const PUZZLES = [
  {
    name: 'Sun ☀️',
    cols: 2,
    pieces: [
      {
        id: 'sun-body', label: 'Circle',
        color: '#FBBF24',
        path: '<circle cx="50" cy="50" r="34"/>',
      },
      {
        id: 'sun-rays', label: 'Rays',
        color: '#F97316',
        path: '<polygon points="50,2 56,22 50,18 44,22"/>' +
              '<polygon points="98,50 78,44 82,50 78,56"/>' +
              '<polygon points="50,98 44,78 50,82 56,78"/>' +
              '<polygon points="2,50 22,56 18,50 22,44"/>' +
              '<polygon points="85,15 72,32 76,27 71,32"/>' +
              '<polygon points="85,85 68,72 73,68 68,73"/>' +
              '<polygon points="15,85 28,68 23,73 28,68"/>' +
              '<polygon points="15,15 32,28 27,23 32,28"/>',
      },
    ],
  },
  {
    name: 'House 🏠',
    cols: 2,
    pieces: [
      {
        id: 'house-wall', label: 'Wall',
        color: '#60A5FA',
        path: '<rect x="10" y="48" width="80" height="48" rx="4"/>',
      },
      {
        id: 'house-roof', label: 'Roof',
        color: '#EF4444',
        path: '<polygon points="50,4 92,50 8,50"/>',
      },
    ],
  },
  {
    name: 'Flower 🌸',
    cols: 3,
    pieces: [
      {
        id: 'flower-center', label: 'Centre',
        color: '#FDE047',
        path: '<circle cx="50" cy="50" r="18"/>',
      },
      {
        id: 'flower-petals', label: 'Petals',
        color: '#F472B6',
        path: '<circle cx="50" cy="14" r="13"/>' +
              '<circle cx="50" cy="86" r="13"/>' +
              '<circle cx="14" cy="50" r="13"/>' +
              '<circle cx="86" cy="50" r="13"/>' +
              '<circle cx="23" cy="23" r="11"/>' +
              '<circle cx="77" cy="23" r="11"/>' +
              '<circle cx="23" cy="77" r="11"/>' +
              '<circle cx="77" cy="77" r="11"/>',
      },
      {
        id: 'flower-stem', label: 'Stem',
        color: '#22C55E',
        path: '<rect x="45" y="62" width="10" height="34" rx="5"/>' +
              '<ellipse cx="36" cy="80" rx="14" ry="8" transform="rotate(-25 36 80)"/>',
      },
    ],
  },
  {
    name: 'Car 🚗',
    cols: 2,
    pieces: [
      {
        id: 'car-body', label: 'Body',
        color: '#3B82F6',
        path: '<rect x="4" y="42" width="92" height="38" rx="10"/>' +
              '<circle cx="22" cy="80" r="12"/>' +
              '<circle cx="78" cy="80" r="12"/>',
      },
      {
        id: 'car-top', label: 'Roof',
        color: '#93C5FD',
        path: '<rect x="18" y="16" width="64" height="30" rx="12"/>',
      },
    ],
  },
];

// ── SVG helpers ───────────────────────────────────────────────────────────────

function lighten(hex, amount = 40) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16)         + amount);
  const g = Math.min(255, ((n >> 8) & 0xFF) + amount);
  const b = Math.min(255, (n & 0xFF)        + amount);
  return `rgb(${r},${g},${b})`;
}

function solidSVG(piece) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="${piece.color}" stroke="${lighten(piece.color, 30)}" stroke-width="2">
      ${piece.path}
    </g>
  </svg>`;
}

function outlineSVG(piece) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="${piece.color}22" stroke="${piece.color}"
       stroke-width="3.5" stroke-dasharray="10 5"
       stroke-linejoin="round" stroke-linecap="round">
      ${piece.path}
    </g>
  </svg>`;
}

// ── Game state ────────────────────────────────────────────────────────────────

let slots        = [];
let pieces       = [];
let placedCount  = 0;
let roundCount   = 0;
let currentPuzzle = null;

const drag = {
  active:  false,
  clone:   null,
  pieceEl: null,
  pieceId: null,
  offsetX: 0,
  offsetY: 0,
};

// ── Round setup ───────────────────────────────────────────────────────────────

function initRound() {
  placedCount   = 0;
  currentPuzzle = PUZZLES[roundCount % PUZZLES.length];

  const slotsGrid  = document.getElementById('slotsGrid');
  const piecesGrid = document.getElementById('piecesGrid');
  const progress   = document.getElementById('progress');

  slotsGrid.innerHTML  = '';
  piecesGrid.innerHTML = '';
  progress.innerHTML   = '';
  slots  = [];
  pieces = [];

  // Set column count based on puzzle
  const cols = `repeat(${currentPuzzle.cols}, 1fr)`;
  slotsGrid.style.gridTemplateColumns  = cols;
  piecesGrid.style.gridTemplateColumns = cols;

  // Title
  document.getElementById('puzzle-title').textContent = currentPuzzle.name;

  // Progress dots
  currentPuzzle.pieces.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.id = `dot-${i}`;
    progress.appendChild(dot);
  });

  // Slots
  currentPuzzle.pieces.forEach(piece => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.dataset.pieceId = piece.id;
    el.innerHTML = outlineSVG(piece);
    slotsGrid.appendChild(el);
    slots.push({ id: piece.id, el, filled: false });
  });

  // Pieces (shuffled)
  const shuffled = [...currentPuzzle.pieces].sort(() => Math.random() - 0.5);
  shuffled.forEach(piece => {
    const el = document.createElement('div');
    el.className = 'piece';
    el.dataset.pieceId = piece.id;
    el.innerHTML = solidSVG(piece);
    el.style.filter = `drop-shadow(0 5px 14px ${piece.color}77)`;
    piecesGrid.appendChild(el);

    el.addEventListener('mousedown',  e => onDragStart(e, el, piece.id));
    el.addEventListener('touchstart', e => onDragStart(e, el, piece.id), { passive: false });

    pieces.push({ id: piece.id, el, placed: false });
  });
}

// ── Drag start ────────────────────────────────────────────────────────────────

function onDragStart(e, pieceEl, pieceId) {
  e.preventDefault();
  if (drag.active) return;

  const ptr  = pointer(e);
  const rect = pieceEl.getBoundingClientRect();

  drag.active  = true;
  drag.pieceEl = pieceEl;
  drag.pieceId = pieceId;
  drag.offsetX = ptr.clientX - rect.left;
  drag.offsetY = ptr.clientY - rect.top;

  pieceEl.classList.add('ghosted');

  const clone = document.createElement('div');
  clone.className = 'drag-clone';
  clone.innerHTML = pieceEl.innerHTML;
  clone.style.cssText = `
    left: ${rect.left}px; top: ${rect.top}px;
    width: ${rect.width}px; height: ${rect.height}px;
    transform: scale(1.16);
    box-shadow: 0 14px 40px rgba(0,0,0,0.35);
  `;
  document.body.appendChild(clone);
  drag.clone = clone;
}

// ── Drag move ─────────────────────────────────────────────────────────────────

function onDragMove(e) {
  if (!drag.active) return;
  e.preventDefault();

  const ptr = pointer(e);
  drag.clone.style.left = `${ptr.clientX - drag.offsetX}px`;
  drag.clone.style.top  = `${ptr.clientY - drag.offsetY}px`;

  const cloneRect = drag.clone.getBoundingClientRect();
  const cx = cloneRect.left + cloneRect.width  / 2;
  const cy = cloneRect.top  + cloneRect.height / 2;

  slots.forEach(slot => {
    if (slot.filled) return;
    const sr   = slot.el.getBoundingClientRect();
    const dist = Math.hypot(cx - (sr.left + sr.width/2), cy - (sr.top + sr.height/2));
    slot.el.classList.toggle('hovered', dist < sr.width * 0.7 && slot.id === drag.pieceId);
  });
}

// ── Drag end ──────────────────────────────────────────────────────────────────

function onDragEnd(e) {
  if (!drag.active) return;
  drag.active = false;

  slots.forEach(s => s.el.classList.remove('hovered'));

  const cloneRect = drag.clone.getBoundingClientRect();
  const cx = cloneRect.left + cloneRect.width  / 2;
  const cy = cloneRect.top  + cloneRect.height / 2;

  let hit = null, hitDist = Infinity;
  slots.forEach(slot => {
    if (slot.filled) return;
    const sr   = slot.el.getBoundingClientRect();
    const dist = Math.hypot(cx - (sr.left + sr.width/2), cy - (sr.top + sr.height/2));
    if (dist < sr.width * 0.65 && dist < hitDist) { hit = slot; hitDist = dist; }
  });

  if (hit && hit.id === drag.pieceId) {
    snapToSlot(drag.clone, drag.pieceEl, hit);
  } else {
    if (hit) shakeEl(hit.el);
    returnPiece(drag.clone, drag.pieceEl);
  }

  drag.clone  = null;
  drag.pieceEl = null;
  drag.pieceId = null;
}

// ── Snap ──────────────────────────────────────────────────────────────────────

function snapToSlot(clone, pieceEl, slot) {
  const sr = slot.el.getBoundingClientRect();

  clone.style.transition = 'left .32s cubic-bezier(.34,1.56,.64,1),'
                         + 'top  .32s cubic-bezier(.34,1.56,.64,1),'
                         + 'width .32s cubic-bezier(.34,1.56,.64,1),'
                         + 'height .32s cubic-bezier(.34,1.56,.64,1),'
                         + 'transform .32s cubic-bezier(.34,1.56,.64,1)';
  clone.style.left      = `${sr.left}px`;
  clone.style.top       = `${sr.top}px`;
  clone.style.width     = `${sr.width}px`;
  clone.style.height    = `${sr.height}px`;
  clone.style.transform = 'scale(1)';

  setTimeout(() => {
    clone.remove();
    pieceEl.style.visibility = 'hidden';

    const piece = currentPuzzle.pieces.find(p => p.id === slot.id);
    slot.el.innerHTML = solidSVG(piece);
    slot.el.style.filter = `drop-shadow(0 4px 16px ${piece.color}99)`;
    slot.el.classList.add('filled');
    slot.filled = true;

    spawnParticles(sr.left + sr.width / 2, sr.top + sr.height / 2, piece.color);
    playTone([523, 659, 784], 0.14, 'sine', 0.45);

    placedCount++;
    updateDots();

    if (placedCount === currentPuzzle.pieces.length) setTimeout(showCelebration, 550);
  }, 340);
}

// ── Return ────────────────────────────────────────────────────────────────────

function returnPiece(clone, pieceEl) {
  const origRect = pieceEl.getBoundingClientRect();

  clone.style.transition = 'left .38s cubic-bezier(.36,.07,.19,.97),'
                         + 'top  .38s cubic-bezier(.36,.07,.19,.97),'
                         + 'transform .38s cubic-bezier(.36,.07,.19,.97)';
  clone.style.left      = `${origRect.left}px`;
  clone.style.top       = `${origRect.top}px`;
  clone.style.transform = 'scale(1)';

  playTone([220], 0.06, 'sawtooth', 0.22);

  setTimeout(() => {
    clone.remove();
    pieceEl.classList.remove('ghosted');
  }, 400);
}

// ── Progress dots ─────────────────────────────────────────────────────────────

function updateDots() {
  for (let i = 0; i < placedCount; i++) {
    document.getElementById(`dot-${i}`)?.classList.add('done');
  }
}

// ── Shake ─────────────────────────────────────────────────────────────────────

function shakeEl(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// ── Particles ─────────────────────────────────────────────────────────────────

function spawnParticles(cx, cy, color) {
  const count = 13;
  for (let i = 0; i < count; i++) {
    const size  = 7 + Math.random() * 9;
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 45 + Math.random() * 85;
    const el    = document.createElement('div');
    el.style.cssText = `
      position:fixed; z-index:2000; pointer-events:none; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${cx - size/2}px; top:${cy - size/2}px;
      background:${i % 4 === 0 ? '#fff' : color};
    `;
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(0,0) scale(1)',    opacity: 1 },
      { transform: `translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist}px) scale(.15)`,
        opacity: 0 },
    ], { duration: 480 + Math.random() * 180, easing: 'cubic-bezier(0,.9,.57,1)', fill: 'forwards' })
      .onfinish = () => el.remove();
  }
}

// ── Confetti + Celebration ────────────────────────────────────────────────────

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
    { transform: `translateY(0) rotate(0deg)`,          opacity: 1 },
    { transform: `translateY(${window.innerHeight+30}px) rotate(${360+Math.random()*400}deg)`, opacity: .85 },
  ], { duration: 1400 + Math.random() * 900, easing: 'ease-in', fill: 'forwards' })
    .onfinish = () => el.remove();
}

const CELEB = [
  { emoji: '🎉', text: 'Amazing!'   },
  { emoji: '⭐', text: 'Superstar!' },
  { emoji: '🌈', text: 'Perfect!'   },
  { emoji: '🎊', text: 'Well Done!' },
  { emoji: '🏆', text: 'You Win!'   },
];

function showCelebration() {
  const pick = CELEB[Math.floor(Math.random() * CELEB.length)];
  document.getElementById('celebEmoji').textContent = pick.emoji;
  document.getElementById('celebText').textContent  = pick.text;

  const el = document.getElementById('celebration');
  el.classList.add('active');

  playTone([523, 659, 784, 1047], 0.18, 'sine', 0.55);

  for (let i = 0; i < 35; i++) setTimeout(spawnConfetti, Math.random() * 900);

  setTimeout(() => {
    el.classList.remove('active');
    roundCount++;
    setTimeout(initRound, 500);
  }, 2800);
}

// ── Audio ─────────────────────────────────────────────────────────────────────

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
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

// ── Pointer helper ────────────────────────────────────────────────────────────

function pointer(e) {
  return e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
}

// ── Global listeners ──────────────────────────────────────────────────────────

document.addEventListener('mousemove',  onDragMove);
document.addEventListener('touchmove',  onDragMove, { passive: false });
document.addEventListener('mouseup',    onDragEnd);
document.addEventListener('touchend',   onDragEnd);

// ── Boot ──────────────────────────────────────────────────────────────────────

initRound();
