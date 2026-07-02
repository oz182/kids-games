---
name: add-game
description: Scaffold a new mini-game into the kids game hub. Use when asked to add or build a game (e.g. Color Splash, Music Time, Animal Friends) so it plugs into the menu, shared sound/speech modules, and toddler UX conventions.
---

# Add a game to the kids game hub

The hub is a set of standalone vanilla JS/HTML/CSS pages served statically
(`python3 server.py`, port 3000). Each game is one HTML page + one CSS file +
one JS file, linked from a card on `index.html`. Target player: a 2.5-year-old.

## Files to create for a game named `<game>`

1. **`<game>.html`** — copy the structure of `star.html`:
   - Same `<meta viewport>` and `apple-mobile-web-app-*` tags (played on iPhone/iPad).
   - A back button: `<a href="index.html" id="back-btn" title="Back to menu">&#8592;</a>`.
   - Load shared modules **before** the game script:
     `<script src="sound.js"></script>` and `<script src="speech.js"></script>`.
2. **`<game>.css`** — start from `star.css` (dark) or `style.css` (light):
   keep `touch-action: none`, `user-select: none`, and the `#back-btn` / `#hud`
   / `scorePop` blocks.
3. **`<game>.js`** — for canvas games follow the `star.js` / `game.js` pattern:
   a game class with `_resize()` (device-pixel-ratio aware, caches the
   background gradient), `pointerdown` input, a `visibilitychange` handler that
   shifts animation birth-times, and a rAF `_loop()` that updates → filters
   dead objects → draws.

## Wire into the menu

In `index.html`, replace the game's "Coming Soon" placeholder `<div
class="card card--soon">` with `<a href="<game>.html" class="card">` keeping
the same `--c1`/`--c2` colors and emoji, and remove the `soon-badge` div.

## Shared modules (never duplicate these)

- **`sound.js`** → `Sound.pop() / chime() / sparkle() / victory() / buzz() /
  tone(freqs, opts)`. All synthesized, no audio files.
- **`speech.js`** → `Speech.say(text, {minGap}) / Speech.praise() /
  Speech.WORDS` (Hebrew word banks: colors, shapes, praise). Always pass a
  `minGap` when speech can be triggered by rapid tapping.

## Toddler UX rules

- Hit areas ≥ 1.25× the visible element; minimum visible size ~70 px.
- Nothing moves fast; no fail states, no timers, no game over.
- Every tap gives feedback (sound + visual); every ~10 successes → celebration
  (`Sound.victory()` + `Speech.praise()` + particles).
- Hebrew voice for object names, sound effects for everything else.
- No external dependencies, no network calls — everything works offline.

## Verify

Start the "Bubble Pop (web)" launch config, open `/<game>.html`, check the
console for errors, simulate taps, and test at mobile viewport (375×812).
`node --check` runs automatically on every edited JS file via the PostToolUse
hook.
