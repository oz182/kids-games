'use strict';

// ── Star Catch! ──────────────────────────────────────────────────────────────
// Night-sky companion to Bubble Pop: stars drift down from the sky, the child
// taps them to catch. Same rhythm — big hit areas, celebration every 10.

// ── Helpers ──────────────────────────────────────────────────────────────────

const rand    = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi));
const now     = ()       => performance.now();

const STAR_COLORS = [
  { body: '#FFD64A', glow: 'rgba(255,214,74,0.16)'  },   // gold (most common)
  { body: '#FFD64A', glow: 'rgba(255,214,74,0.16)'  },
  { body: '#FF9FCF', glow: 'rgba(255,159,207,0.15)' },   // pink
  { body: '#7DE8FF', glow: 'rgba(125,232,255,0.15)' },   // ice blue
  { body: '#C9A7FF', glow: 'rgba(201,167,255,0.15)' },   // lavender
];

/** Trace a 5-pointed star centred at (0,0) with outer radius r */
function starPath(ctx, r) {
  const inner = r * 0.45;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad   = i % 2 === 0 ? r : inner;
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = Math.cos(angle) * rad;
    const y = Math.sin(angle) * rad;
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  }
  ctx.closePath();
}

// ── Falling star ─────────────────────────────────────────────────────────────

class FallingStar {
  constructor(W, H) {
    this.radius   = rand(36, 58);
    this.color    = STAR_COLORS[randInt(0, STAR_COLORS.length)];
    this.startX   = rand(this.radius + 14, W - this.radius - 14);
    this.x        = this.startX;
    this.startY   = -this.radius - 20;
    this.y        = this.startY;
    this.targetY  = H + this.radius + 20;
    this.born     = now();
    this.duration = rand(7000, 11000);              // slow fall for small hands
    this.swayA    = rand(16, 34);
    this.swayP    = rand(1600, 2600);
    this.spin     = rand(-0.9, 0.9);                // rad/s
    this.rot      = rand(0, Math.PI * 2);
    this.alive    = true;
    this.caught   = false;
    this.caughtAt = 0;
    this.scale    = 1;
    this.opacity  = 1;
  }

  update(t = now()) {
    if (this.caught) {
      const pt = (t - this.caughtAt) / 260;
      if (pt < 0.35) {
        this.scale = 1 + (pt / 0.35) * 0.4;
      } else {
        const t2   = (pt - 0.35) / 0.65;
        this.scale   = 1.4 * (1 - t2);
        this.opacity = 1 - t2;
        if (pt >= 1) this.alive = false;
      }
      return;
    }

    const elapsed  = t - this.born;
    const progress = elapsed / this.duration;
    if (progress >= 1) { this.alive = false; return; }

    this.y   = this.startY + (this.targetY - this.startY) * progress;
    this.x   = this.startX + this.swayA * Math.sin(elapsed * Math.PI * 2 / this.swayP);
    this.rot += this.spin * 0.016;
  }

  catch_() {
    if (this.caught) return false;
    this.caught   = true;
    this.caughtAt = now();
    return true;
  }

  /** Generous hit area for toddler fingers */
  hitTest(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const r  = this.radius * 1.45;
    return dx * dx + dy * dy <= r * r;
  }

  draw(ctx) {
    const { x, y, radius: r, color, scale: sc, opacity: op, rot } = this;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(sc, sc);
    ctx.globalAlpha = op;

    // Soft glow halo
    ctx.beginPath();
    ctx.arc(0, 0, r * 1.35, 0, Math.PI * 2);
    ctx.fillStyle = color.glow;
    ctx.fill();

    // Star body
    starPath(ctx, r);
    ctx.fillStyle   = color.body;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth   = 3;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    // Smiling face (rotate back upright so the face never flips)
    ctx.rotate(-rot);
    ctx.fillStyle = 'rgba(60,40,0,0.75)';
    ctx.beginPath(); ctx.arc(-r * 0.18, -r * 0.05, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( r * 0.18, -r * 0.05, r * 0.06, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(0, r * 0.08, r * 0.16, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.strokeStyle = 'rgba(60,40,0,0.75)';
    ctx.lineWidth   = r * 0.06;
    ctx.lineCap     = 'round';
    ctx.stroke();

    ctx.restore();
  }
}

// ── Shooting star (rare bonus) ───────────────────────────────────────────────

class ShootingStar {
  constructor(W, H) {
    this.fromLeft = Math.random() < 0.5;
    this.radius   = rand(30, 40);
    this.x0       = this.fromLeft ? -60 : W + 60;
    this.y0       = rand(H * 0.12, H * 0.38);
    this.x1       = this.fromLeft ? W + 60 : -60;
    this.y1       = this.y0 + rand(H * 0.15, H * 0.35);
    this.x        = this.x0;
    this.y        = this.y0;
    this.born     = now();
    this.duration = rand(3200, 4200);               // slow enough to catch
    this.alive    = true;
    this.caught   = false;
    this.caughtAt = 0;
    this.scale    = 1;
    this.opacity  = 1;
  }

  update(t = now()) {
    if (this.caught) {
      const pt = (t - this.caughtAt) / 300;
      this.scale   = 1 + pt * 0.6;
      this.opacity = 1 - pt;
      if (pt >= 1) this.alive = false;
      return;
    }
    const progress = (t - this.born) / this.duration;
    if (progress >= 1) { this.alive = false; return; }
    this.x = this.x0 + (this.x1 - this.x0) * progress;
    this.y = this.y0 + (this.y1 - this.y0) * progress;
  }

  catch_() {
    if (this.caught) return false;
    this.caught   = true;
    this.caughtAt = now();
    return true;
  }

  hitTest(px, py) {
    const dx = px - this.x, dy = py - this.y;
    const r  = this.radius * 1.8;                   // extra generous — it moves
    return dx * dx + dy * dy <= r * r;
  }

  draw(ctx) {
    const { x, y, radius: r, scale: sc, opacity: op } = this;
    ctx.save();
    ctx.globalAlpha = op;

    // Trail
    const dirX = this.fromLeft ? -1 : 1;
    const grad = ctx.createLinearGradient(x, y, x + dirX * r * 5, y - r * 1.6);
    grad.addColorStop(0, 'rgba(255,235,150,0.75)');
    grad.addColorStop(1, 'rgba(255,235,150,0)');
    ctx.beginPath();
    ctx.moveTo(x, y - r * 0.4);
    ctx.lineTo(x + dirX * r * 5, y - r * 1.6);
    ctx.lineTo(x, y + r * 0.4);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Head
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    starPath(ctx, r);
    ctx.fillStyle   = '#FFF3B0';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth   = 3;
    ctx.lineJoin    = 'round';
    ctx.stroke();

    ctx.restore();
  }
}

// ── Sparkle particle ─────────────────────────────────────────────────────────

class Sparkle {
  constructor(x, y, color, burst = false) {
    const angle = rand(0, Math.PI * 2);
    const dist  = burst ? rand(40, 130) : rand(4, 18);
    this.ox   = x;  this.oy = y;
    this.dx   = Math.cos(angle) * dist;
    this.dy   = Math.sin(angle) * dist + (burst ? 0 : rand(-24, -8));
    this.r    = burst ? rand(4, 9) : rand(1.5, 4);
    this.col  = color;
    this.born = now();
    this.dur  = burst ? 620 : rand(500, 900);
    this.alive = true;
  }

  draw(ctx, t = now()) {
    const progress = (t - this.born) / this.dur;
    if (progress >= 1) { this.alive = false; return; }
    const ease = 1 - Math.pow(1 - progress, 2);
    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.9;
    ctx.beginPath();
    ctx.arc(this.ox + this.dx * ease, this.oy + this.dy * ease,
            this.r * (1 - progress * 0.7), 0, Math.PI * 2);
    ctx.fillStyle = this.col;
    ctx.fill();
    ctx.restore();
  }
}

// ── Celebration label ────────────────────────────────────────────────────────

const CELEB_MSGS = ['כל הכבוד! 🌟', 'מדהים! ⭐', 'איזה יופי! 🎉', 'אלוף! ✨', 'וואו! 🌈'];

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
    ctx.fillStyle    = 'rgba(0,0,0,0.35)';
    ctx.fillText(this.text, this.cx + 3, this.cy + 3);
    ctx.fillStyle    = `rgba(255,225,120,${op})`;
    ctx.fillText(this.text, this.cx, this.cy);
    ctx.restore();
  }
}

// ── Game ─────────────────────────────────────────────────────────────────────

class StarCatchGame {
  constructor() {
    this.canvas  = document.getElementById('gameCanvas');
    this.ctx     = this.canvas.getContext('2d');
    this.scoreEl = document.getElementById('score');

    this.stars     = [];       // FallingStar
    this.shooters  = [];       // ShootingStar
    this.sparkles  = [];
    this.labels    = [];

    this.score        = 0;
    this.lastSpawn    = 0;
    this.spawnInterval = rand(1000, 1400);
    this.lastShooter  = now();
    this.shooterInterval = rand(14000, 24000);
    this.lastTrail    = 0;

    this.intro = { born: now(), dur: 3600, active: true };

    this._resize();
    this._seedSky();
    this._bindEvents();
    requestAnimationFrame(() => this._loop());
  }

  // ── Setup ────────────────────────────────────────────────────────────────

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth;
    const H = window.innerHeight;
    this.canvas.width  = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width  = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W;
    this.H = H;

    const g = this.ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#131a4a');
    g.addColorStop(1, '#3a2f6e');
    this.bgGrad = g;

    this._seedSky();
  }

  /** Static twinkling background stars (positions fixed per resize) */
  _seedSky() {
    this.sky = [];
    const count = Math.round((this.W * this.H) / 16000);
    for (let i = 0; i < count; i++) {
      this.sky.push({
        x: rand(0, this.W), y: rand(0, this.H),
        r: rand(0.8, 2.2), phase: rand(0, Math.PI * 2),
        period: rand(1800, 4200),
      });
    }
  }

  _bindEvents() {
    window.addEventListener('resize', () => this._resize());

    this.canvas.addEventListener('pointerdown', e => {
      e.preventDefault();
      const r = this.canvas.getBoundingClientRect();
      this._handleTap((e.clientX - r.left) * (this.W / r.width),
                      (e.clientY - r.top)  * (this.H / r.height));
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { this._hiddenAt = now(); return; }
      const gap = now() - (this._hiddenAt ?? now());
      for (const s of this.stars) s.born += gap;
      this.lastSpawn   = now();
      this.lastShooter = now();
    });
  }

  // ── Input ────────────────────────────────────────────────────────────────

  _handleTap(px, py) {
    // Shooting stars first (they're the exciting ones), then topmost star
    for (let i = this.shooters.length - 1; i >= 0; i--) {
      const s = this.shooters[i];
      if (!s.caught && s.hitTest(px, py)) { this._catchShooter(s); return; }
    }
    for (let i = this.stars.length - 1; i >= 0; i--) {
      const s = this.stars[i];
      if (!s.caught && s.hitTest(px, py)) { this._catch(s); return; }
    }
  }

  _catch(star) {
    if (!star.catch_()) return;
    this.score++;
    this._updateHUD();
    Sound.chime();
    if (navigator.vibrate) navigator.vibrate(28);
    Speech.say(Speech.WORDS.star, { minGap: 2000 });

    for (let i = 0; i < 14; i++)
      this.sparkles.push(new Sparkle(star.x, star.y, star.color.body, true));
    for (let i = 0; i < 6; i++)
      this.sparkles.push(new Sparkle(star.x, star.y, 'rgba(255,255,255,0.95)', true));

    if (this.score % 10 === 0) this._celebrate();
  }

  _catchShooter(s) {
    if (!s.catch_()) return;
    this.score++;
    this._updateHUD();
    Sound.sparkle();
    if (navigator.vibrate) navigator.vibrate([30, 40, 30]);

    for (let i = 0; i < 26; i++)
      this.sparkles.push(new Sparkle(s.x, s.y, i % 2 ? '#FFF3B0' : '#FFD64A', true));

    // Catching a shooting star is always worth a cheer
    this._celebrate();
  }

  _updateHUD() {
    this.scoreEl.textContent = `⭐ ${this.score}`;
    this.scoreEl.classList.remove('pop');
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add('pop');
  }

  _celebrate() {
    this.labels.push(new CelebLabel(this.W, this.H));
    for (let i = 0; i < 30; i++) {
      this.sparkles.push(new Sparkle(
        rand(this.W * 0.15, this.W * 0.85),
        rand(this.H * 0.3, this.H * 0.7),
        STAR_COLORS[randInt(0, STAR_COLORS.length)].body, true));
    }
    Sound.victory();
    Speech.praise();
  }

  // ── Spawning ─────────────────────────────────────────────────────────────

  _maybeSpawn(t) {
    if (t - this.lastSpawn > this.spawnInterval) {
      this.stars.push(new FallingStar(this.W, this.H));
      this.lastSpawn     = t;
      this.spawnInterval = rand(850, 1500);
    }
    if (t - this.lastShooter > this.shooterInterval) {
      this.shooters.push(new ShootingStar(this.W, this.H));
      this.lastShooter     = t;
      this.shooterInterval = rand(16000, 28000);
    }
    // Sparkle trails behind falling stars
    if (t - this.lastTrail > 90) {
      this.lastTrail = t;
      for (const s of this.stars) {
        if (!s.caught && Math.random() < 0.5)
          this.sparkles.push(new Sparkle(s.x, s.y - s.radius * 0.2, s.color.body));
      }
    }
  }

  // ── Main loop ────────────────────────────────────────────────────────────

  _loop() {
    const t = now();
    this._maybeSpawn(t);

    for (const s of this.stars)    s.update(t);
    for (const s of this.shooters) s.update(t);

    this.stars    = this.stars.filter(s => s.alive);
    this.shooters = this.shooters.filter(s => s.alive);
    this.sparkles = this.sparkles.filter(s => s.alive);
    this.labels   = this.labels.filter(l => l.alive);

    this._draw(t);
    requestAnimationFrame(() => this._loop());
  }

  // ── Drawing ──────────────────────────────────────────────────────────────

  _drawBackground(t) {
    const { ctx, W, H } = this;
    ctx.fillStyle = this.bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Twinkling background stars
    for (const s of this.sky) {
      const tw = 0.35 + 0.5 * (0.5 + 0.5 * Math.sin(s.phase + t * Math.PI * 2 / s.period));
      ctx.globalAlpha = tw;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    this._drawMoon();
  }

  _drawMoon() {
    const { ctx, W } = this;
    const x = W - 90, y = 110, r = 46;
    ctx.save();

    ctx.beginPath();
    ctx.arc(x, y, r * 1.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,244,200,0.10)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFF4C8';
    ctx.fill();

    // Sleepy happy face
    ctx.strokeStyle = 'rgba(120,90,20,0.65)';
    ctx.lineWidth   = 3;
    ctx.lineCap     = 'round';
    ctx.beginPath(); ctx.arc(x - 14, y - 6, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x + 14, y - 6, 7, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, y + 12, 12, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();

    // Blush
    ctx.fillStyle = 'rgba(255,160,160,0.35)';
    ctx.beginPath(); ctx.arc(x - 24, y + 8, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 24, y + 8, 6, 0, Math.PI * 2); ctx.fill();

    ctx.restore();
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
    ctx.fillStyle    = 'rgba(0,0,0,0.35)';
    ctx.fillText('Catch the stars! ⭐', W / 2 + 2, H / 2 + 2);
    ctx.fillStyle = '#fff';
    ctx.fillText('Catch the stars! ⭐', W / 2, H / 2);
    ctx.restore();
  }

  _draw(t) {
    const { ctx } = this;
    this._drawBackground(t);

    for (const s of this.sparkles) s.draw(ctx, t);
    for (const s of this.stars)    s.draw(ctx);
    for (const s of this.shooters) s.draw(ctx);
    for (const l of this.labels)   l.draw(ctx, t);

    this._drawIntro(t);
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => new StarCatchGame());
