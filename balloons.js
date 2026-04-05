'use strict';

// ── Helpers ───────────────────────────────────────────────────────────────────

const rand    = (lo, hi) => lo + Math.random() * (hi - lo);
const randInt = (lo, hi) => Math.floor(rand(lo, hi));
const now     = ()       => performance.now();
const rgba    = (c, a)   => `rgba(${c.r},${c.g},${c.b},${a})`;

// ── Palette ───────────────────────────────────────────────────────────────────

const COLORS = [
  { r:255, g: 82, b: 82  },   // red
  { r:255, g:158, b: 46  },   // orange
  { r:250, g:224, b: 46  },   // yellow
  { r: 72, g:224, b:102  },   // green
  { r: 71, g:148, b:255  },   // blue
  { r:184, g: 77, b:255  },   // purple
  { r:255, g: 82, b:184  },   // pink
  { r: 46, g:224, b:224  },   // cyan
];

// ── Balloon ───────────────────────────────────────────────────────────────────

class Balloon {
  constructor(W, H) {
    this.radius   = rand(36, 62);
    this.color    = COLORS[randInt(0, COLORS.length)];
    this.label    = randInt(1, 10);                    // 1–9
    this.startX   = rand(this.radius + 20, W - this.radius - 20);
    this.x        = this.startX;
    this.y        = H + this.radius + 50;
    this.startY   = this.y;
    this.targetY  = -(this.radius + 60);
    this.born     = now();
    this.duration = rand(6000, 10000);
    this.wobbleA  = rand(16, 30);
    this.wobbleP  = rand(1200, 2000);
    this.alive    = true;
    this.popped   = false;
    this.popAt    = 0;
    this.scale    = 1;
    this.opacity  = 1;
    // wrong-pop wobble
    this.wobbleExtra   = 0;
    this.wobbleExtraAt = 0;
  }

  update(t = now()) {
    if (this.popped) {
      const pt = (t - this.popAt) / 220;
      if (pt < 0.32) {
        this.scale   = 1 + (pt / 0.32) * 0.30;
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

    this.y = this.startY + (this.targetY - this.startY) * progress;
    let x  = this.startX + this.wobbleA * Math.sin(elapsed * Math.PI * 2 / this.wobbleP);

    // Extra wobble on wrong tap
    if (this.wobbleExtra > 0) {
      const wt = (t - this.wobbleExtraAt) / 400;
      x += Math.sin(wt * Math.PI * 8) * 12 * (1 - Math.min(wt, 1));
      if (wt >= 1) this.wobbleExtra = 0;
    }

    this.x = x;
  }

  wrongTap() {
    this.wobbleExtra   = 1;
    this.wobbleExtraAt = now();
  }

  pop() {
    if (this.popped) return false;
    this.popped = true;
    this.popAt  = now();
    return true;
  }

  hitTest(px, py) {
    const dx = px - this.x;
    const dy = py - (this.y - this.radius * 0.15);    // centre of oval body
    const rx = this.radius * 1.25;
    const ry = this.radius * 1.55;
    return (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
  }

  draw(ctx) {
    const { x, color, scale: sc, opacity: op } = this;
    const y  = this.y - this.radius * 0.15;           // offset for string
    const r  = this.radius;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(sc, sc);
    ctx.globalAlpha = op;

    // Oval body
    ctx.save();
    ctx.scale(1, 1.30);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fillStyle = rgba(color, 0.82);
    ctx.fill();
    ctx.strokeStyle = rgba(color, 0.95);
    ctx.lineWidth   = 2.5;
    ctx.stroke();
    ctx.restore();

    // Gloss
    ctx.save();
    ctx.translate(-r * 0.18, -r * 0.45);
    ctx.scale(1, 0.55);
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.27, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fill();
    ctx.restore();

    // Knot (small triangle at bottom of oval)
    const knotY = r * 1.30;
    ctx.beginPath();
    ctx.moveTo(-5, knotY);
    ctx.lineTo( 5, knotY);
    ctx.lineTo( 0, knotY + 9);
    ctx.closePath();
    ctx.fillStyle = rgba(color, 0.92);
    ctx.fill();

    // String
    ctx.beginPath();
    ctx.moveTo(0, knotY + 9);
    ctx.quadraticCurveTo(8, knotY + 32, 2, knotY + 52);
    ctx.strokeStyle = rgba(color, 0.50);
    ctx.lineWidth   = 1.5;
    ctx.stroke();

    // Number label
    const fontSize = Math.round(r * 0.80);
    ctx.font         = `900 ${fontSize}px 'Avenir Next','Helvetica Neue',Arial,sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(255,255,255,0.92)';
    ctx.fillText(String(this.label), 0, -r * 0.08);

    ctx.restore();
  }
}

// ── Particle ──────────────────────────────────────────────────────────────────

class Particle {
  constructor(ox, oy, color, angle, dist) {
    this.ox    = ox; this.oy = oy;
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
    const ease = 1 - Math.pow(1 - progress, 2);
    const x = this.ox + this.dx * ease;
    const y = this.oy + this.dy * ease;
    const r = this.r * (1 - progress * 0.88);
    const a = (1 - progress) * 0.92;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = this.white ? 'rgba(255,255,255,0.9)' : rgba(this.color, 0.88);
    ctx.fill();
    ctx.restore();
  }
}

// ── Star ──────────────────────────────────────────────────────────────────────

const STAR_COLORS = [
  'rgba(255,228,66,0.92)', 'rgba(255,150,40,0.92)',
  'rgba(255,80,180,0.92)', 'rgba(46,224,224,0.92)',
];

class Star {
  constructor(W, H) {
    this.x   = rand(50, W - 50);
    this.y   = rand(H / 2 - 90, H / 2 + 90);
    this.vx  = rand(-95, 95);
    this.vy  = rand(-190, -70);
    this.r   = rand(5, 10);
    this.col = STAR_COLORS[randInt(0, STAR_COLORS.length)];
    this.born  = now();
    this.dur   = 1100;
    this.alive = true;
  }

  draw(ctx, t = now()) {
    const progress = (t - this.born) / this.dur;
    if (progress >= 1) { this.alive = false; return; }
    const x = this.x + this.vx * progress;
    const y = this.y + this.vy * progress + 0.5 * 220 * progress * progress;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.beginPath();
    ctx.arc(x, y, this.r * (1 - progress * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = this.col;
    ctx.fill();
    ctx.restore();
  }
}

// ── CelebLabel ────────────────────────────────────────────────────────────────

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
    if      (progress < 0.12) { sc = 0.3 + (progress / 0.12) * 0.8; op = 1; }
    else if (progress < 0.70) { sc = 1.1; op = 1; }
    else { const t2 = (progress - 0.70) / 0.30; sc = 1.1 + t2 * 0.5; op = 1 - t2; }
    const size = Math.round(52 * sc);
    ctx.save();
    ctx.globalAlpha  = op;
    ctx.font         = `700 ${size}px 'Avenir Next','Helvetica Neue',Arial,sans-serif`;
    ctx.textAlign    = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle    = 'rgba(0,0,0,0.22)';
    ctx.fillText(this.text, this.cx + 3, this.cy + 3);
    ctx.fillStyle    = `rgba(255,215,48,${op})`;
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
    const parts = [
      [0,0,42],[-50,10,32],[50,10,32],[-24,-18,28],[24,-18,28],[0,-28,20],
    ];
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.60)';
    for (const [dx, dy, r] of parts) {
      ctx.beginPath();
      ctx.arc(x + dx * sc, y + dy * sc, r * sc, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ── Audio ─────────────────────────────────────────────────────────────────────

let _audioCtx = null;
function getAudioCtx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return _audioCtx;
}

function playPop(radius) {
  try {
    const ctx      = getAudioCtx(); ctx.resume();
    const baseFreq = 680 - (radius - 36) * 4.5;
    const pitch    = baseFreq * (0.88 + Math.random() * 0.24);
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = 'sine';
    osc.connect(env); env.connect(ctx.destination);
    const t = ctx.currentTime + 0.02;
    osc.frequency.setValueAtTime(pitch, t);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.25, t + 0.12);
    env.gain.setValueAtTime(0.22, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    osc.start(t); osc.stop(t + 0.16);
  } catch (_) {}
}

function playWrong() {
  try {
    const ctx = getAudioCtx(); ctx.resume();
    const osc = ctx.createOscillator(), env = ctx.createGain();
    osc.type = 'sawtooth'; osc.frequency.value = 140;
    osc.connect(env); env.connect(ctx.destination);
    const t = ctx.currentTime + 0.02;
    env.gain.setValueAtTime(0.10, t);
    env.gain.exponentialRampToValueAtTime(0.001, t + 0.20);
    osc.start(t); osc.stop(t + 0.22);
  } catch (_) {}
}

function playCelebration() {
  try {
    const ctx   = getAudioCtx(); ctx.resume();
    const notes = [523, 659, 784, 1047];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator(), env = ctx.createGain();
      osc.type = 'sine'; osc.frequency.value = freq;
      osc.connect(env); env.connect(ctx.destination);
      const t = ctx.currentTime + 0.02 + i * 0.13;
      env.gain.setValueAtTime(0.16, t);
      env.gain.exponentialRampToValueAtTime(0.001, t + 0.42);
      osc.start(t); osc.stop(t + 0.43);
    });
  } catch (_) {}
}

// ── Game ──────────────────────────────────────────────────────────────────────

class BalloonGame {
  constructor() {
    this.canvas   = document.getElementById('gameCanvas');
    this.ctx      = this.canvas.getContext('2d');
    this.scoreEl  = document.getElementById('score');
    this.targetEl = document.getElementById('target-display');

    this.balloons  = [];
    this.particles = [];
    this.stars     = [];
    this.labels    = [];
    this.clouds    = [];

    this.score        = 0;
    this.correctPops  = 0;
    this.target       = randInt(1, 10);

    this.lastSpawn     = 0;
    this.spawnInterval = rand(900, 1200);
    this.lastCloud     = 0;
    this.cloudInterval = rand(14000, 22000);
    this.lastFrame     = now();

    this.intro = { born: now(), dur: 3600, active: true };

    this._updateTargetHUD();
    this._resize();
    this._seedClouds();
    this._bindEvents();
    requestAnimationFrame(() => this._loop());
  }

  _updateTargetHUD() {
    this.targetEl.textContent = this.target;
  }

  _resize() {
    const dpr = window.devicePixelRatio || 1;
    const W   = window.innerWidth;
    const H   = window.innerHeight;
    this.canvas.width  = W * dpr;
    this.canvas.height = H * dpr;
    this.canvas.style.width  = `${W}px`;
    this.canvas.style.height = `${H}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.W = W; this.H = H;
  }

  _seedClouds() {
    const { W, H } = this;
    for (const xf of [0.10, 0.40, 0.65, 0.85]) {
      this.clouds.push(new Cloud(xf * W, rand(H * 0.60, H * 0.92), rand(0.7, 1.3), rand(20, 46)));
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

  _handleTap(px, py) {
    for (let i = this.balloons.length - 1; i >= 0; i--) {
      const b = this.balloons[i];
      if (!b.popped && b.hitTest(px, py)) {
        if (b.label === this.target) {
          this._pop(b);
        } else {
          b.wrongTap();
          playWrong();
          if (navigator.vibrate) navigator.vibrate(15);
        }
        break;
      }
    }
  }

  _pop(balloon) {
    if (!balloon.pop()) return;
    this.score++;
    this.correctPops++;
    this._updateHUD();
    if (navigator.vibrate) navigator.vibrate(28);
    playPop(balloon.radius);

    const { x, y, color, radius } = balloon;
    const count = randInt(9, 13);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + rand(-0.35, 0.35);
      const dist  = rand(radius * 0.75, radius * 1.55);
      this.particles.push(new Particle(x, y, color, angle, dist));
    }

    if (this.correctPops % 5 === 0) {
      this._celebrate();
      this.target = randInt(1, 10);
      this._updateTargetHUD();
    }
  }

  _updateHUD() {
    this.scoreEl.textContent = `🎈 ${this.score}`;
    this.scoreEl.classList.remove('pop');
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add('pop');
  }

  _celebrate() {
    this.labels.push(new CelebLabel(this.W, this.H));
    for (let i = 0; i < 22; i++) this.stars.push(new Star(this.W, this.H));
    playCelebration();
  }

  _maybeSpawn(t) {
    if (t - this.lastSpawn > this.spawnInterval) {
      this.balloons.push(new Balloon(this.W, this.H));
      this.lastSpawn     = t;
      this.spawnInterval = rand(750, 1350);
    }
    if (t - this.lastCloud > this.cloudInterval) {
      this.clouds.push(new Cloud(-220, rand(this.H * 0.60, this.H * 0.92), rand(0.6, 1.4), rand(20, 46)));
      this.lastCloud     = t;
      this.cloudInterval = rand(12000, 24000);
    }
  }

  _loop() {
    const t  = now();
    const dt = Math.min(t - this.lastFrame, 100);
    this.lastFrame = t;

    this._maybeSpawn(t);
    for (const b of this.balloons) b.update(t);
    for (const c of this.clouds)   c.update(dt, this.W);

    this.balloons  = this.balloons.filter(b => b.alive);
    this.particles = this.particles.filter(p => p.alive);
    this.clouds    = this.clouds.filter(c => c.alive);
    this.labels    = this.labels.filter(l => l.alive);
    this.stars     = this.stars.filter(s => s.alive);

    this._draw(t);
    requestAnimationFrame(() => this._loop());
  }

  _drawBackground() {
    const { ctx, W, H } = this;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#fde68a');
    g.addColorStop(0.6, '#fbbf24');
    g.addColorStop(1, '#fed7aa');
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
    ctx.fillText('Pop the right number! 🎈', W / 2 + 2, H / 2 + 2);
    ctx.fillStyle    = '#fff';
    ctx.fillText('Pop the right number! 🎈', W / 2, H / 2);
    ctx.restore();
  }

  _draw(t) {
    const { ctx } = this;
    this._drawBackground();
    for (const c of this.clouds)    c.draw(ctx);
    for (const b of this.balloons)  b.draw(ctx);
    for (const p of this.particles) p.draw(ctx, t);
    for (const s of this.stars)     s.draw(ctx, t);
    for (const l of this.labels)    l.draw(ctx, t);
    this._drawIntro(t);
  }
}

// ── Boot ─────────────────────────────────────────────────────────────────────
window.addEventListener('load', () => new BalloonGame());
