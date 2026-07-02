'use strict';

// ── Hebrew speech for all games ──────────────────────────────────────────────
// Thin wrapper over the browser's speechSynthesis with Hebrew word banks.
// Exposed as a single global: Speech.{say, praise, WORDS}
// Falls back to silence when speech synthesis / a Hebrew voice is unavailable.

const Speech = (() => {
  const WORDS = {
    colors: {
      red:     'אדום',
      orange:  'כתום',
      yellow:  'צהוב',
      green:   'ירוק',
      blue:    'כחול',
      purple:  'סגול',
      pink:    'ורוד',
      cyan:    'טורקיז',
      gold:    'כוכב זהב',
      rainbow: 'קשת בענן',
    },
    shapes: {
      circle:   'עיגול',
      square:   'ריבוע',
      triangle: 'משולש',
      star:     'כוכב',
      heart:    'לב',
      moon:     'ירח',
      diamond:  'מעוין',
      oval:     'אליפסה',
    },
    praise: ['כל הכבוד!', 'מדהים!', 'יופי!', 'איזה יופי!', 'נהדר!', 'אלוף!', 'וואו!'],
    star:   'כוכב!',
  };

  const supported = 'speechSynthesis' in window;
  let voice = null;

  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    voice = voices.find(v => v.lang && v.lang.toLowerCase().startsWith('he')) || null;
  }

  if (supported) {
    pickVoice();
    // Voice list loads asynchronously on most browsers
    speechSynthesis.addEventListener?.('voiceschanged', pickVoice);
  }

  let lastAt = 0;

  /**
   * Speak Hebrew text. `minGap` (ms) drops the utterance if something was
   * spoken more recently — keeps rapid tapping from becoming a word salad.
   */
  function say(text, { minGap = 0 } = {}) {
    if (!supported || !text) return;
    const t = performance.now();
    if (minGap && t - lastAt < minGap) return;
    lastAt = t;
    try {
      speechSynthesis.cancel();               // don't queue up
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'he-IL';
      if (voice) u.voice = voice;
      u.rate = 0.9;                            // a touch slower for a toddler
      u.pitch = 1.1;
      speechSynthesis.speak(u);
    } catch (_) { /* silent fallback */ }
  }

  function praise() {
    say(WORDS.praise[Math.floor(Math.random() * WORDS.praise.length)]);
  }

  return { say, praise, WORDS };
})();
