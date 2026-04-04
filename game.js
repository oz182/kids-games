'use strict';

// ── Helpers ──────────────────────────────────────────────────────────────────

const rand     = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt  = (lo, hi) => Math.floor(rand(lo, hi));
const now      = ()       => performance.now();
const rgba     = (c, a)   => `rgba(${c.r},${c.g},${c.b},${a})`;

// ── Palette (vivid, high-contrast — great for babies) ────────────────────────

const COLORS = [
  { r: 255, g:  82, b:  82 },   // red
  { r: 255, g: 158, b:  46 },   // orange
  { r: 250, g: 224, b:  46 },   // yellow
  { r:  72, g: 224, b: 102 },   // green
  { r:  71, g: 148, b: 255 },   // blue
  { r: 184, g:  77, b: 255 },   // purple
  { r: 255, g:  82, b: 184 },   // pink
  { r:  46, g: 224, b: 224 },   // cyan
];

// ── Bubble ───────────────────────────────────────────────────────────────────

class Bubble {
  constructor(W, H) {
    this.radius   = rand(40, 72);
    this.color    = COLORS[randInt(0, COLORS.length)];
    this.startX   = rand(this.radius + 12, W - this.radius - 12);
    this.x        = this.startX;
    this.y        = H + this.radius + 10;           // start below screen
    this.startY   = this.y;
    this.targetY  = -(this.radius + 20);            // exit above screen
    this.born     = now();
    this.duration = rand(6000, 10000);              // ms to cross screen
    this.wobbleA  = rand(18, 34);                   // px amplitude
    this.wobbleP  = rand(1200, 2000);               // ms period
    this.alive    = true;
    this.popped   = false;
    this.popAt    = 0;
    this.scale    = 1;
    this.opacity  = 1;
  }

  update(t = now()) {
    if (this.popped) {
      const pt = (t - this.popAt) / 220;           // 220 ms total pop
      if (pt < 0.32) {
        this.scale   = 1 + (pt / 0.32) * 0.30;    // expand to ×1.30
        this.opacity = 1;
      } else {
        const t2     = (pt - 0.32) / 0.68;
        this.scale   = 1.30 * (1 - t2);
        this.opacity = 1 - t2;
        if (pt >= 1) this.alive = false;
      }
      return;
    }

    const elapsed  = t - this.born;
    const progress = elapsed / this.duration;
    if (progress >= 1) { this.alive = false; return; }

    // Rise (linear)
    this.y = this.startY + (this.targetY - this.startY) * progress;
    // Sinusoidal horizontal wobble
    this.x = this.startX + this.wobbleA * Math.sin(elapsed * Math.PI * 2 / this.wobbleP);
  }

  pop() {
    if (this.popped) return false;
    this.popped = true;
    this.popAt  = now();
    return true;
  }

  /** Slightly enlarged hit area for small fingers / fat thumbs */
  hitTest(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const r  = this.radius * 1.25;
    return dx * dx + dy * dy <= r * r;
  }

  draw(ctx) {
    const { x, y, radius: r, color, scale: sc, opacity: op } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.globalAlpha = op;

    // Filled body
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(color, 0.28);
    ctx.fill();

    // Outer stroke
    ctx.strokeStyle = rgba(color, 0.80);
    ctx.lineWidth   = 3.5;
    ctx.stroke();

    // Inner rim
    ctx.beginPath();
    ctx.arc(0, 0, r - 5, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Primary gloss — top-left squashed ellipse
    ctx.save();
    ctx.translate(-r * 0.18, -r * 0.50);
    ctx.scale(1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.27, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.fill();
    ctx.restore();

    // Secondary reflection — bottom right
    ctx.beginPath();
    ctx.arc(r * 0.38, r * 0.36, r * 0.13, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fill();

    ctx.restore();
  }
}

// ── Pop particle ─────────────────────────────────────────────────────────────

class Particle {
  constructor(ox, oy, color, angle, dist) {
    this.ox    = ox;  this.oy  = oy;
    this.dx    = Math.cos(angle) * dist;
    this.dy    = Math.sin(angle) * dist;
    this.color = color;
    this.white = Math.random() < 0.30;
    this.r     = rand(5, 11);
    this.born  = now();
    this.dur   = 560;
    this.alive = true;
  }

  draw(ctx, t = now()) {
    const progress = (t - this.born) / this.dur;
    if (progress >= 1) { this.alive = false; return; }

    const ease = 1 - Math.pow(1 - progress, 2);     // ease-out
    const x    = this.ox + this.dx * ease;
    const y    = this.oy + this.dy * ease;
    const r    = this.r  * (1 - progress * 0.88);
    const a    = (1 - progress) * 0.92;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.white ? 'rgba(255,255,255,0.9)' : rgba(this.color, 0.88);
    ctx.fill();
    ctx.restore();
  }
}

// ── Celebration star ─────────────────────────────────────────────────────────

const STAR_COLORS = [
  'rgba(255,228,66,0.92)',
  'rgba(255,150,40,0.92)',
  'rgba(255,80,180,0.92)',
  'rgba(46,224,224,0.92)',
];

class Star {
  constructor(W, H) {
    this.x    = rand(50, W - 50);
    this.y    = rand(H / 2 - 90, H / 2 + 90);
    this.vx   = rand(-95, 95);
    this.vy   = rand(-190, -70);
    this.r    = rand(5, 10);
    this.col  = STAR_COLORS[randInt(0, STAR_COLORS.length)];
    this.born = now();
    this.dur  = 1100;
    this.alive = true;
  }

  draw(ctx, t = now()) {
    const progress = (t - this.born) / this.dur;
    if (progress >= 1) { this.alive = false; return; }

    const x = this.x + this.vx * progress;
    const y = this.y + this.vy * progress + 0.5 * 220 * progress * progress; // arc

    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.beginPath();
    ctx.arc(x, y, this.r * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = this.col;
    ctx.fill();
    ctx.restore();
  }
}

// ── Celebration label ─────────────────────────────────────────────────────────

const CELEB_MSGS = ['Amazing! 🌟', 'Wow! ⭐️', 'Great job! 🎉', 'Awesome! ✨', 'Super! 🌈'];

class CelebLabel {
  constructor(W, H) {
    this.text  = CELEB_MSGS[randInt(0, CELEB_MSGS.length)];
    this.cx    = W / 2;
    this.cy    = H / 2;
    this.born  = now();
    this.dur   = 2500;
    this.alive = true;
  }

  draw(ctx, t = now()) {
    const progress = (t - this.born) / this.dur;
    if (progress >= 1) { this.alive = false; return; }

    let sc, op;
    if (progress < 0.12) {
      sc = 0.3 + (progress / 0.12) * 0.8;  op = 1;
    } else if (progress < 0.70) {
      sc = 1.1;  op = 1;
    } else {
      const t2 = (progress - 0.70) / 0.30;
      sc = 1.1 + t2 * 0.5;  op = 1 - t2;
    }

    const size = Math.round(52 * sc);
    ctx.save();
    ctx.globalAlpha  = op;
    ctx.font         = `700 ${size}px 'Avenir Next','Helvetica Neue',Arial,sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';

    // Drop shadow
    ctx.fillStyle = `rgba(0,0,0,0.22)`;
    ctx.fillText(this.text, this.cx + 3, this.cy + 3);

    // Golden text
    ctx.fillStyle = `rgba(255,215,48,${op})`;
    ctx.fillText(this.text, this.cx, this.cy);
    ctx.restore();
  }
}

// ── Cloud ─────────────────────────────────────────────────────────────────────

class Cloud {
  constructor(x, y, sc, spd) {
    this.x = x; this.y = y; this.sc = sc; this.spd = spd;
    this.alive = true;
  }

  update(dt, W) {
    this.x += this.spd * dt / 1000;
    if (this.x > W + 240) this.alive = false;
  }

  draw(ctx) {
    const { x, y, sc } = this;
    // Cloud = overlapping circles; layout tuned for canvas (Y down)
    const parts = [
      [  0,   0, 42], [-50,  10, 32], [ 50,  10, 32],
      [-24, -18, 28], [ 24, -18, 28], [  0, -28, 20],
    ];
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    for (const [dx, dy, r] of parts) {
      ctx.beginPath();
      ctx.arc(x + dx * sc, y + dy * sc, r * sc, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── Game ──────────────────────────────────────────────────────────────────────

class BubbleGame {
  constructor() {
    this.canvas   = document.getElementById('gameCanvas');
    this.ctx      = this.canvas.getContext('2d');
    this.scoreEl  = document.getElementById('score');

    this.bubbles   = [];
    this.particles = [];
    this.stars     = [];
    this.labels    = [];
    this.clouds    = [];

    this.score         = 0;
    this.lastSpawn     = 0;
    this.spawnInterval = rand(900, 1200);
    this.lastCloud     = 0;
    this.cloudInterval = rand(14000, 22000);
    this.lastFrame     = now();

    // Intro hint
    this.intro = { born: now(), dur: 3600, active: true };

    this._resize();
    this._seedClouds();
    this._bindEvents();
    requestAnimationFrame(t => this._loop(t));
  }

  // ── Setup ────────────────────────────────────────────────────────────────

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const W   = window.innerWidth;
    const H   = window.innerHeight;

    this.canvas.width  = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width  = `${W}px`;
    this.canvas.style.height = `${H}px`;

    // Scale context once so all drawing uses CSS-pixel coordinates
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.W = W;
    this.H = H;
  }

  _seedClouds() {
    const { W, H } = this;
    const seeds = [0.10, 0.40, 0.65, 0.82, 0.95];
    for (const xf of seeds) {
      this.clouds.push(new Cloud(
        xf * W, rand(H * 0.60, H * 0.92),
        rand(0.7, 1.3), rand(20, 46),
      ));
    }
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    const tap = (px, py) => this._handleTap(px, py);

    this.canvas.addEventListener('mousedown', e => {
      const r = this.canvas.getBoundingClientRect();
      tap((e.clientX - r.left) * (this.W / r.width),
          (e.clientY - r.top)  * (this.H / r.height));
    });

    this.canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      for (const t of e.changedTouches) {
        tap((t.clientX - r.left) * (this.W / r.width),
            (t.clientY - r.top)  * (this.H / r.height));
      }
    }, { passive: false });
  }

  // ── Input ────────────────────────────────────────────────────────────────

  _handleTap(px, py) {
    // Iterate reverse so topmost (last drawn) bubble is hit first
    for (let i = this.bubbles.length - 1; i >= 0; i--) {
      const b = this.bubbles[i];
      if (!b.popped && b.hitTest(px, py)) {
        this._pop(b);
        break;
      }
    }
  }

  _pop(bubble) {
    if (!bubble.pop()) return;

    this.score++;
    this._updateHUD();

    // Haptic (supported on mobile browsers)
    if (navigator.vibrate) navigator.vibrate(28);

    const { x, y, color, radius } = bubble;
    const count = randInt(9, 13);

    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.35, 0.35);
      const dist  = rand(radius * 0.75, radius * 1.55);
      this.particles.push(new Particle(x, y, color, angle, dist));
    }

    if (this.score % 10 === 0) this._celebrate();
  }

  _updateHUD() {
    this.scoreEl.textContent = `🫧 ${this.score}`;
    this.scoreEl.classList.remove('pop');
    void this.scoreEl.offsetWidth;           // force reflow → restart animation
    this.scoreEl.classList.add('pop');
  }

  _celebrate() {
    this.labels.push(new CelebLabel(this.W, this.H));
    for (let i = 0; i < 22; i++) this.stars.push(new Star(this.W, this.H));
  }

  // ── Spawning ─────────────────────────────────────────────────────────────

  _maybeSpawn(t) {
    if (t - this.lastSpawn > this.spawnInterval) {
      this.bubbles.push(new Bubble(this.W, this.H));
      this.lastSpawn     = t;
      this.spawnInterval = rand(750, 1350);
    }
    if (t - this.lastCloud > this.cloudInterval) {
      this.clouds.push(new Cloud(
        -220, rand(this.H * 0.60, this.H * 0.92),
        rand(0.6, 1.4), rand(20, 46),
      ));
      this.lastCloud     = t;
      this.cloudInterval = rand(12000, 24000);
    }
  }

  // ── Main loop ────────────────────────────────────────────────────────────

  _loop(ts) {
    const t  = now();
    const dt = Math.min(t - this.lastFrame, 100);   // cap at 100 ms
    this.lastFrame = t;

    this._maybeSpawn(t);

    for (const b of this.bubbles)   b.update(t);
    for (const c of this.clouds)    c.update(dt, this.W);

    // Remove dead objects
    this.bubbles   = this.bubbles.filter(b => b.alive);
    this.particles = this.particles.filter(p => p.alive);
    this.clouds    = this.clouds.filter(c => c.alive);
    this.labels    = this.labels.filter(l => l.alive);
    this.stars     = this.stars.filter(s => s.alive);

    this._draw(t);
    requestAnimationFrame(ts => this._loop(ts));
  }

  // ── Drawing ──────────────────────────────────────────────────────────────

  _drawBackground() {
    const { ctx, W, H } = this;
    // Redraw gradient each frame (cheap on modern GPUs; keeps resize seamless)
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#5fb8ff');
    g.addColorStop(1, '#c8edff');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
  }

  _drawIntro(t) {
    if (!this.intro.active) return;
    const progress = (t - this.intro.born) / this.intro.dur;
    if (progress >= 1) { this.intro.active = false; return; }

    let op;
    if      (progress < 0.14) op = progress / 0.14;
    else if (progress < 0.75) op = 1;
    else                      op = 1 - (progress - 0.75) / 0.25;

    const { ctx, W, H } = this;
    ctx.save();
    ctx.globalAlpha  = op;
    ctx.font         = `700 38px 'Avenir Next','Helvetica Neue',Arial,sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(0,0,0,0.20)';
    ctx.fillText('Pop the bubbles! 🫧', W / 2 + 2, H / 2 + 2);
    ctx.fillStyle = '#fff';
    ctx.fillText('Pop the bubbles! 🫧', W / 2, H / 2);
    ctx.restore();
  }

  _draw(t) {
    const { ctx } = this;
    this._drawBackground();

    for (const c of this.clouds)    c.draw(ctx);
    for (const b of this.bubbles)   b.draw(ctx);
    for (const p of this.particles) p.draw(ctx, t);
    for (const s of this.stars)     s.draw(ctx, t);
    for (const l of this.labels)    l.draw(ctx, t);

    this._drawIntro(t);
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => new BubbleGame());
