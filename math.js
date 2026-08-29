'use strict';

// ── Visual addition ──────────────────────────────────────────────────────────
// Two baskets hold groups of the same object. The child can tap each object to
// count it out loud, then picks how many there are altogether. On a correct
// answer the two groups merge into one basket and get counted together, so the
// answer is something seen and heard rather than a fact to memorise.

const EMOJIS = ['🍎','🍌','🐠','🐥','🎈','⭐','🍓','🐞','🌻','🚗','🧸','🍪'];

// Feminine forms — the ones used for plain counting in Hebrew
const NUM_WORDS = ['', 'אחת', 'שתיים', 'שלוש', 'ארבע', 'חמש',
                   'שש', 'שבע', 'שמונה', 'תשע', 'עשר'];

const CARD_COLORS = [
  ['#fbbf24', '#f59e0b'], ['#60a5fa', '#2563eb'], ['#f472b6', '#db2777'],
  ['#c084fc', '#7c3aed'], ['#fb923c', '#ea580c'], ['#4ade80', '#16a34a'],
];

const CELEB = [
  { emoji: '🎉', text: 'כל הכבוד!' },
  { emoji: '⭐', text: 'מדהים!'    },
  { emoji: '🌈', text: 'יופי!'     },
  { emoji: '🏆', text: 'אלוף!'     },
];

const NEED = 5;   // correct answers before a celebration

let a = 0, b = 0, emoji = '';
let solved = 0;         // correct answers in the current set of NEED
let rounds = 0;         // rounds completed overall, drives the gentle ramp-up
let locked = false;     // true while the round is resolving

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));

/** Sums stay tiny at first and grow slowly — never past ten */
function maxSumForRound() {
  if (rounds < 5)  return 5;
  if (rounds < 12) return 7;
  return 10;
}

/** Three answers: the right one plus two near misses, all within 1..10 */
function answerChoices(sum) {
  const picks = new Set([sum]);
  const spread = [-1, 1, -2, 2];
  shuffle(spread);
  for (const d of spread) {
    if (picks.size === 3) break;
    const v = sum + d;
    if (v >= 1 && v <= 10) picks.add(v);
  }
  // Pad from the low numbers if the spread could not fill three
  for (let v = 1; picks.size < 3; v++) picks.add(v);
  return shuffle([...picks]);
}

// ── Rendering ──────────────────────────────────────────────────────────────

function renderDots() {
  const wrap = document.getElementById('progress');
  wrap.innerHTML = '';
  for (let i = 0; i < NEED; i++) {
    const d = document.createElement('div');
    d.className = 'dot' + (i < solved ? ' done' : '');
    wrap.appendChild(d);
  }
}

/** Fill a basket with `n` objects that can be tapped and counted */
function fillBasket(el, n) {
  el.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const o = document.createElement('div');
    o.className     = 'obj';
    o.textContent   = emoji;
    o.style.animationDelay = `${i * 0.06}s`;
    o.addEventListener('pointerdown', () => countTap(el, o));
    el.appendChild(o);
  }
}

/** Tapping objects counts them aloud — exploration, never required */
function countTap(basket, obj) {
  if (locked || obj.classList.contains('counted')) return;
  obj.classList.add('counted');
  const n = basket.querySelectorAll('.obj.counted').length;
  Sound.tone([261 + n * 46], { gain: 0.13, decay: 0.28 });
  Speech.say(NUM_WORDS[n], { minGap: 220 });
}

function renderChoices(sum) {
  const colors = shuffle(CARD_COLORS.slice());
  const wrap   = document.getElementById('choices');
  wrap.innerHTML = '';

  answerChoices(sum).forEach((value, i) => {
    const el = document.createElement('div');
    el.className   = 'num';
    el.textContent = value;
    el.style.setProperty('--c1', colors[i][0]);
    el.style.setProperty('--c2', colors[i][1]);
    el.addEventListener('pointerdown', () => onPick(el, value, sum));
    wrap.appendChild(el);
  });
}

// ── Round flow ─────────────────────────────────────────────────────────────

function startRound() {
  locked = false;
  emoji  = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];

  const maxSum = maxSumForRound();
  a = rand(1, Math.min(5, maxSum - 1));
  b = rand(1, Math.min(5, maxSum - a));

  document.getElementById('equation').classList.remove('hidden');
  document.getElementById('result').classList.add('hidden');
  document.getElementById('result').innerHTML = '';

  fillBasket(document.getElementById('groupA'), a);
  fillBasket(document.getElementById('groupB'), b);
  renderChoices(a + b);
  renderDots();

  setTimeout(() => {
    Speech.say(`${NUM_WORDS[a]} ועוד ${NUM_WORDS[b]}. כמה יש ביחד?`, { minGap: 400 });
  }, 400);
}

function onPick(el, value, sum) {
  if (locked) return;

  if (value !== sum) {
    // No fail state — a nudge, and the card stays available
    Sound.buzz();
    el.classList.remove('wrong');
    void el.offsetWidth;                 // restart the shake animation
    el.classList.add('wrong');
    return;
  }

  locked = true;
  rounds++;
  el.classList.add('correct');
  document.querySelectorAll('.num').forEach(o => {
    if (o !== el) o.classList.add('fade');
  });

  const r = el.getBoundingClientRect();
  spawnParticles(r.left + r.width / 2, r.top + r.height / 2, '#fde047');
  Sound.tone([523, 659, 784], { gain: 0.13 });

  mergeAndCount(sum);

  solved++;
  renderDots();
}

/** Slide the two groups into one basket and count them together, out loud */
function mergeAndCount(sum) {
  document.getElementById('equation').classList.add('hidden');
  const result = document.getElementById('result');
  result.classList.remove('hidden');
  result.innerHTML = '';

  const STEP = 460;   // ms between counted objects — slow enough to follow

  for (let i = 1; i <= sum; i++) {
    setTimeout(() => {
      const o = document.createElement('div');
      o.className   = 'obj';
      o.textContent = emoji;
      result.appendChild(o);
      Sound.tone([261 + i * 46], { gain: 0.14, decay: 0.3 });
      Speech.say(NUM_WORDS[i], { minGap: 200 });
    }, i * STEP);
  }

  // Say the whole sum once every object is on screen
  setTimeout(() => {
    Sound.sparkle();
    Speech.say(`${NUM_WORDS[a]} ועוד ${NUM_WORDS[b]} שווה ${NUM_WORDS[sum]}`);
  }, sum * STEP + 500);

  setTimeout(() => {
    if (solved >= NEED) {
      solved = 0;
      showCelebration(startRound);
    } else {
      startRound();
    }
  }, sum * STEP + 2600);
}

// ── Particles ──────────────────────────────────────────────────────────────

function spawnParticles(cx, cy, color) {
  const count = 12;
  for (let i = 0; i < count; i++) {
    const size  = 6 + Math.random() * 9;
    const angle = (i / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const dist  = 45 + Math.random() * 75;
    const el    = document.createElement('div');
    el.style.cssText = `
      position:fixed; z-index:2000; pointer-events:none; border-radius:50%;
      width:${size}px; height:${size}px;
      left:${cx - size / 2}px; top:${cy - size / 2}px;
      background:${i % 4 === 0 ? '#fff' : color};
    `;
    document.body.appendChild(el);
    el.animate([
      { transform: 'translate(0,0) scale(1)', opacity: 1 },
      { transform: `translate(${Math.cos(angle) * dist}px,${Math.sin(angle) * dist}px) scale(.15)`, opacity: 0 },
    ], { duration: 500 + Math.random() * 200, easing: 'cubic-bezier(0,.9,.57,1)', fill: 'forwards' })
      .onfinish = () => el.remove();
  }
}

function spawnConfetti() {
  const palette = ['#FF3B30', '#007AFF', '#FF9F0A', '#30D158', '#FF2D55', '#BF5AF2', '#FFD60A'];
  const el     = document.createElement('div');
  const size   = 7 + Math.random() * 12;
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
    { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
    { transform: `translateY(${window.innerHeight + 30}px) rotate(${360 + Math.random() * 400}deg)`, opacity: .85 },
  ], { duration: 1400 + Math.random() * 900, easing: 'ease-in', fill: 'forwards' })
    .onfinish = () => el.remove();
}

function showCelebration(onDone) {
  const pick = CELEB[Math.floor(Math.random() * CELEB.length)];
  document.getElementById('celebEmoji').textContent = pick.emoji;
  document.getElementById('celebText').textContent  = pick.text;
  document.getElementById('celebration').classList.add('active');

  Sound.victory();
  Speech.praise();
  for (let i = 0; i < 30; i++) setTimeout(spawnConfetti, Math.random() * 800);

  setTimeout(() => {
    document.getElementById('celebration').classList.remove('active');
    if (onDone) onDone();
  }, 2200);
}

// ── Boot ───────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', startRound);
