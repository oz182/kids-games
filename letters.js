'use strict';

// ── Hebrew letter game ───────────────────────────────────────────────────────
// A picture and its word are shown with the FIRST letter missing. The child
// picks the letter that completes the word from three big cards.
//
// `word` carries nikud (that is how children first meet written Hebrew), while
// `plain` — the everyday spelling — is what gets spoken, since TTS voices are
// trained on unpointed text. `name` keeps its nikud so the voice says the
// letter name (בֵּית) rather than reading it as the word "house".

const LETTERS = [
  { ch: 'א', name: 'אָלֶף',  word: 'אַרְיֵה',    plain: 'אריה',    emoji: '🦁' },
  { ch: 'ב', name: 'בֵּית',  word: 'בַּנָנָה',   plain: 'בננה',    emoji: '🍌' },
  { ch: 'ג', name: 'גִּימֶל', word: 'גְּלִידָה',  plain: 'גלידה',   emoji: '🍦' },
  { ch: 'ד', name: 'דָּלֶת',  word: 'דָּג',       plain: 'דג',      emoji: '🐟' },
  { ch: 'ה', name: 'הֵא',    word: 'הַר',        plain: 'הר',      emoji: '⛰️' },
  { ch: 'ו', name: 'וָו',    word: 'וֶרֶד',      plain: 'ורד',     emoji: '🌹' },
  { ch: 'ז', name: 'זַיִן',   word: 'זֶבְּרָה',   plain: 'זברה',    emoji: '🦓' },
  { ch: 'ח', name: 'חֵית',   word: 'חָתוּל',     plain: 'חתול',    emoji: '🐱' },
  { ch: 'ט', name: 'טֵית',   word: 'טְרַקְטוֹר',  plain: 'טרקטור',  emoji: '🚜' },
  { ch: 'י', name: 'יוֹד',   word: 'יוֹנָה',     plain: 'יונה',    emoji: '🕊️' },
  { ch: 'כ', name: 'כַּף',    word: 'כֶּלֶב',     plain: 'כלב',     emoji: '🐶' },
  { ch: 'ל', name: 'לָמֶד',   word: 'לִימוֹן',    plain: 'לימון',   emoji: '🍋' },
  { ch: 'מ', name: 'מֵם',    word: 'מְכוֹנִית',   plain: 'מכונית',  emoji: '🚗' },
  { ch: 'נ', name: 'נוּן',   word: 'נַעַל',      plain: 'נעל',     emoji: '👟' },
  { ch: 'ס', name: 'סָמֶךְ',  word: 'סוּס',       plain: 'סוס',     emoji: '🐴' },
  { ch: 'ע', name: 'עַיִן',   word: 'עוּגָה',     plain: 'עוגה',    emoji: '🍰' },
  { ch: 'פ', name: 'פֵּא',    word: 'פַּרְפַּר',   plain: 'פרפר',    emoji: '🦋' },
  { ch: 'צ', name: 'צַדִיק',  word: 'צִיפּוֹר',   plain: 'ציפור',   emoji: '🐦' },
  { ch: 'ק', name: 'קוֹף',   word: 'קוֹף',       plain: 'קוף',     emoji: '🐵' },
  { ch: 'ר', name: 'רֵישׁ',   word: 'רַכֶּבֶת',   plain: 'רכבת',    emoji: '🚂' },
  { ch: 'ש', name: 'שִׁין',   word: 'שֶׁמֶשׁ',    plain: 'שמש',     emoji: '☀️' },
  { ch: 'ת', name: 'תָּו',    word: 'תַּפּוּחַ',   plain: 'תפוח',    emoji: '🍎' },
];

// Card gradients, picked per round so the three choices always differ
const CARD_COLORS = [
  ['#fbbf24', '#f59e0b'], ['#60a5fa', '#2563eb'], ['#34d399', '#059669'],
  ['#c084fc', '#7c3aed'], ['#fb923c', '#ea580c'], ['#38bdf8', '#0284c7'],
];

const CELEB = [
  { emoji: '🎉', text: 'כל הכבוד!' },
  { emoji: '⭐', text: 'מדהים!'    },
  { emoji: '🌈', text: 'יופי!'     },
  { emoji: '🏆', text: 'אלוף!'     },
];

const NEED = 5;   // correct answers before a celebration

let bag     = [];     // shuffle bag so every letter comes up before repeats
let target  = null;
let solved  = 0;      // correct answers in the current set of NEED
let locked  = false;  // true while the round is resolving

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** First letter plus any nikud marks hanging off it, and the rest of the word */
function splitFirstLetter(word) {
  const m = word.match(/^.[֑-ׇ]*/);
  const head = m ? m[0] : word.charAt(0);
  return { head, tail: word.slice(head.length) };
}

function nextTarget() {
  if (!bag.length) bag = shuffle(LETTERS.slice());
  return bag.pop();
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

function renderPrompt() {
  document.getElementById('promptEmoji').textContent = target.emoji;

  const { head, tail } = splitFirstLetter(target.word);
  const word = document.getElementById('promptWord');
  word.innerHTML = '';

  const blank = document.createElement('span');
  blank.className   = 'blank';
  blank.id          = 'blank';
  blank.textContent = head;          // hidden by `color: transparent` until solved
  word.appendChild(blank);
  word.appendChild(document.createTextNode(tail));
}

function renderChoices() {
  const others = shuffle(LETTERS.filter(l => l.ch !== target.ch)).slice(0, 2);
  const picks  = shuffle([target, ...others]);
  const colors = shuffle(CARD_COLORS.slice());

  const wrap = document.getElementById('choices');
  wrap.innerHTML = '';

  picks.forEach((letter, i) => {
    const el = document.createElement('div');
    el.className   = 'letter';
    el.textContent = letter.ch;
    el.style.setProperty('--c1', colors[i][0]);
    el.style.setProperty('--c2', colors[i][1]);
    el.addEventListener('pointerdown', () => onPick(el, letter));
    wrap.appendChild(el);
  });
}

// ── Round flow ─────────────────────────────────────────────────────────────

function startRound() {
  locked = false;
  target = nextTarget();
  renderDots();
  renderPrompt();
  renderChoices();
  setTimeout(sayPrompt, 350);
}

function sayPrompt() {
  Speech.say(target.plain + '. איזו אות?', { minGap: 400 });
}

function onPick(el, letter) {
  if (locked) return;

  if (letter.ch !== target.ch) {
    // No fail state — say the letter they picked, then let them try again
    Sound.buzz();
    Speech.say(letter.name, { minGap: 350 });
    el.classList.remove('wrong');
    void el.offsetWidth;                 // restart the shake animation
    el.classList.add('wrong');
    return;
  }

  locked = true;
  el.classList.add('correct');
  document.querySelectorAll('.letter').forEach(o => {
    if (o !== el) o.classList.add('fade');
  });

  const r = el.getBoundingClientRect();
  spawnParticles(r.left + r.width / 2, r.top + r.height / 2, '#fde047');
  Sound.tone([523, 659, 784], { gain: 0.13 });
  Speech.say(target.name);

  // Drop the letter into the blank, then read the whole word
  document.getElementById('blank').classList.add('filled');
  setTimeout(() => {
    Sound.sparkle();
    Speech.say(target.plain);
  }, 900);

  solved++;
  renderDots();

  setTimeout(() => {
    if (solved >= NEED) {
      solved = 0;
      showCelebration(startRound);
    } else {
      startRound();
    }
  }, 2000);
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

document.addEventListener('DOMContentLoaded', () => {
  // Tapping the picture repeats the word — toddlers ask for "again" a lot
  document.getElementById('prompt').addEventListener('pointerdown', () => {
    if (!locked) sayPrompt();
  });
  startRound();
});
