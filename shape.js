'use strict';

// ── Shape definitions ────────────────────────────────────────────────────────
// Each shape has a unique SVG path + a vivid color.
// The child drags the solid piece onto the matching dashed outline slot.

const SHAPES = [
  {
    id:    'circle',
    label: 'Circle',
    color: '#FF3B30',         // red
    path:  '<circle cx="50" cy="50" r="44"/>',
  },
  {
    id:    'square',
    label: 'Square',
    color: '#007AFF',         // blue
    path:  '<rect x="5" y="5" width="90" height="90" rx="14"/>',
  },
  {
    id:    'triangle',
    label: 'Triangle',
    color: '#FF9F0A',         // amber
    path:  '<polygon points="50,5 95,95 5,95"/>',
  },
  {
    id:    'star',
    label: 'Star',
    color: '#30D158',         // green
    // Mathematically correct 5-pointed star (R=45, r=18, centred at 50,50)
    path:  '<polygon points="50,5 61,35 93,36 67,56 76,86 50,68 24,86 33,56 7,36 39,35"/>',
  },
];

// ── SVG helpers ──────────────────────────────────────────────────────────────

/** Solid filled shape – used for the draggable pieces */
function solidSVG(shape) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="${shape.color}" stroke="${lighten(shape.color, 30)}" stroke-width="2">
      ${shape.path}
    </g>
  </svg>`;
}

/** Dashed outline shape – used for the target slots */
function outlineSVG(shape) {
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <g fill="${shape.color}22" stroke="${shape.color}"
       stroke-width="3.5" stroke-dasharray="10 5"
       stroke-linejoin="round" stroke-linecap="round">
      ${shape.path}
    </g>
  </svg>`;
}

/** Slightly lighten a hex colour for the piece stroke highlight */
function lighten(hex, amount = 40) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, (n >> 16)         + amount);
  const g = Math.min(255, ((n >> 8) & 0xFF) + amount);
  const b = Math.min(255, (n & 0xFF)        + amount);
  return `rgb(${r},${g},${b})`;
}

// ── Game state ───────────────────────────────────────────────────────────────

let slots       = [];   // { id, el, filled }
let pieces      = [];   // { id, el, placed }
let placedCount = 0;
let roundCount  = 0;

// Single drag state
const drag = {
  active:     false,
  clone:      null,
  pieceEl:    null,   // the ghosted original
  pieceId:    null,
  offsetX:    0,
  offsetY:    0,
};

// ── Round setup ──────────────────────────────────────────────────────────────

function initRound() {
  placedCount = 0;

  const slotsGrid  = document.getElementById('slotsGrid');
  const piecesGrid = document.getElementById('piecesGrid');
  const progress   = document.getElementById('progress');

  slotsGrid.innerHTML  = '';
  piecesGrid.innerHTML = '';
  progress.innerHTML   = '';
  slots  = [];
  pieces = [];

  // Progress dots
  SHAPES.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'dot';
    dot.id = `dot-${i}`;
    progress.appendChild(dot);
  });

  // Slots – displayed in fixed order
  SHAPES.forEach(shape => {
    const el = document.createElement('div');
    el.className = 'slot';
    el.dataset.shapeId = shape.id;
    el.innerHTML = outlineSVG(shape);
    slotsGrid.appendChild(el);
    slots.push({ id: shape.id, el, filled: false });
  });

  // Pieces – shuffled so positions vary each round
  const shuffled = [...SHAPES].sort(() => Math.random() - 0.5);
  shuffled.forEach(shape => {
    const el = document.createElement('div');
    el.className = 'piece';
    el.dataset.shapeId = shape.id;
    el.innerHTML = solidSVG(shape);
    el.style.filter = `drop-shadow(0 5px 14px ${shape.color}77)`;
    piecesGrid.appendChild(el);

    el.addEventListener('mousedown',  e => onDragStart(e, el, shape.id));
    el.addEventListener('touchstart', e => onDragStart(e, el, shape.id), { passive: false });

    pieces.push({ id: shape.id, el, placed: false });
  });
}

// ── Drag start ───────────────────────────────────────────────────────────────

function onDragStart(e, pieceEl, shapeId) {
  e.preventDefault();
  if (drag.active) return;

  const ptr  = pointer(e);
  const rect = pieceEl.getBoundingClientRect();

  drag.active  = true;
  drag.pieceEl = pieceEl;
  drag.pieceId = shapeId;
  drag.offsetX = ptr.clientX - rect.left;
  drag.offsetY = ptr.clientY - rect.top;

  // Ghost the original
  pieceEl.classList.add('ghosted');

  // Create floating clone
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

// ── Drag move ────────────────────────────────────────────────────────────────

function onDragMove(e) {
  if (!drag.active) return;
  e.preventDefault();

  const ptr = pointer(e);
  drag.clone.style.left = `${ptr.clientX - drag.offsetX}px`;
  drag.clone.style.top  = `${ptr.clientY - drag.offsetY}px`;

  // Highlight the nearest correct slot
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

// ── Drag end ─────────────────────────────────────────────────────────────────

function onDragEnd(e) {
  if (!drag.active) return;
  drag.active = false;

  // Clear all hover highlights
  slots.forEach(s => s.el.classList.remove('hovered'));

  const cloneRect = drag.clone.getBoundingClientRect();
  const cx = cloneRect.left + cloneRect.width  / 2;
  const cy = cloneRect.top  + cloneRect.height / 2;

  // Find closest slot the clone's centre overlaps
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
    if (hit) shakeEl(hit.el);      // dropped on wrong slot
    returnPiece(drag.clone, drag.pieceEl);
  }

  drag.clone  = null;
  drag.pieceEl = null;
  drag.pieceId = null;
}

// ── Snap ─────────────────────────────────────────────────────────────────────

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
    pieceEl.style.visibility = 'hidden'; // keep grid spacing; hide piece

    const shape = SHAPES.find(s => s.id === slot.id);
    slot.el.innerHTML = solidSVG(shape);
    slot.el.style.filter = `drop-shadow(0 4px 16px ${shape.color}99)`;
    slot.el.classList.add('filled');
    slot.filled = true;

    // Particles + sound
    spawnParticles(sr.left + sr.width / 2, sr.top + sr.height / 2, shape.color);
    playTone([523, 659, 784], 0.14, 'sine', 0.45);  // C–E–G arpeggio

    placedCount++;
    updateDots();

    if (placedCount === SHAPES.length) setTimeout(showCelebration, 550);
  }, 340);
}

// ── Return ───────────────────────────────────────────────────────────────────

function returnPiece(clone, pieceEl) {
  const origRect = pieceEl.getBoundingClientRect();

  clone.style.transition = 'left .38s cubic-bezier(.36,.07,.19,.97),'
                         + 'top  .38s cubic-bezier(.36,.07,.19,.97),'
                         + 'transform .38s cubic-bezier(.36,.07,.19,.97)';
  clone.style.left      = `${origRect.left}px`;
  clone.style.top       = `${origRect.top}px`;
  clone.style.transform = 'scale(1)';

  playTone([220], 0.06, 'sawtooth');  // low buzz

  setTimeout(() => {
    clone.remove();
    pieceEl.classList.remove('ghosted');
  }, 400);
}

// ── Progress dots ─────────────────────────────────────────────────────────── */

function updateDots() {
  for (let i = 0; i < placedCount; i++) {
    document.getElementById(`dot-${i}`)?.classList.add('done');
  }
}

// ── Shake ────────────────────────────────────────────────────────────────────

function shakeEl(el) {
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  el.addEventListener('animationend', () => el.classList.remove('shake'), { once: true });
}

// ── Particles ────────────────────────────────────────────────────────────────

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

// ── Confetti (celebration) ───────────────────────────────────────────────────

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

// ── Celebration ──────────────────────────────────────────────────────────────

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

  playTone([523, 659, 784, 1047], 0.18, 'sine', 0.55); // victory arpeggio

  for (let i = 0; i < 35; i++)
    setTimeout(spawnConfetti, Math.random() * 900);

  setTimeout(() => {
    el.classList.remove('active');
    roundCount++;
    setTimeout(initRound, 500);
  }, 2800);
}

// ── Web Audio tone ───────────────────────────────────────────────────────────

let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

function playTone(freqs, gain = 0.15, type = 'sine', duration = 0.38) {
  try {
    const ctx = getAudioCtx();
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(env);
      env.connect(ctx.destination);
      const t = ctx.currentTime + i * 0.11;
      env.gain.setValueAtTime(gain, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + duration);
      osc.start(t);
      osc.stop(t + duration + 0.01);
    });
  } catch (_) { /* audio blocked – silent fallback */ }
}

// ── Pointer helper ───────────────────────────────────────────────────────────

function pointer(e) {
  return e.touches?.[0] ?? e.changedTouches?.[0] ?? e;
}

// ── Global listeners ─────────────────────────────────────────────────────────

document.addEventListener('mousemove',  onDragMove);
document.addEventListener('touchmove',  onDragMove, { passive: false });
document.addEventListener('mouseup',    onDragEnd);
document.addEventListener('touchend',   onDragEnd);

// ── Boot ─────────────────────────────────────────────────────────────────────

initRound();
