'use strict';
/* =========================================================
   KAZOO SIMULATOR · motor: canvas, utilidades, input, audio
   ========================================================= */
const VW = 384, VH = 224, TS = 16;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
cv.width = VW; cv.height = VH;
ctx.imageSmoothingEnabled = false;
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (IS_TOUCH) document.body.classList.add('touch');

function fit() {
  const ww = window.innerWidth, wh = window.innerHeight;
  const portrait = wh > ww;
  const availH = (IS_TOUCH && portrait) ? wh * 0.55 : wh;
  let s = Math.min(ww / VW, availH / VH);
  if (s > 1) s = Math.max(1, Math.floor(s * 4) / 4);
  cv.style.width = Math.round(VW * s) + 'px';
  cv.style.height = Math.round(VH * s) + 'px';
}
addEventListener('resize', fit); fit();

const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const rnd = (a, b) => a + Math.random() * (b - a);
const irnd = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const sign = v => v > 0 ? 1 : v < 0 ? -1 : 0;
const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
function mulberry(seed) {
  return function () {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

/* ---------------- TEXTO ---------------- */
const FONT = '"Press Start 2P", monospace';
function txt(s, x, y, col = '#fff', align = 'left', size = 8, shadow = '#000') {
  ctx.font = size + 'px ' + FONT;
  ctx.textAlign = align; ctx.textBaseline = 'top';
  x = Math.round(x); y = Math.round(y);
  if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, x + 1, y + 1); }
  ctx.fillStyle = col; ctx.fillText(s, x, y);
}
function wrap(s, maxCh) {
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const w of para.split(' ')) {
      if ((line + (line ? ' ' : '') + w).length > maxCh) { if (line) out.push(line); line = w; }
      else line += (line ? ' ' : '') + w;
    }
    out.push(line);
  }
  return out;
}
function R(x, y, w, h, c) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); }
function box(x, y, w, h, bg = '#0b0618', border = '#fff') {
  R(x - 2, y - 2, w + 4, h + 4, '#000'); R(x, y, w, h, border); R(x + 2, y + 2, w - 4, h - 4, bg);
}

/* ---------------- INPUT ---------------- */
const ACTS = ['left', 'right', 'up', 'down', 'jump', 'run', 'kazoo', 'pause', 'confirm', 'back'];
const KEYMAP = {
  ArrowLeft: ['left'], KeyA: ['left'], ArrowRight: ['right'], KeyD: ['right'],
  ArrowUp: ['up'], KeyW: ['up'], ArrowDown: ['down'], KeyS: ['down'],
  Space: ['jump'], KeyZ: ['jump'], KeyK: ['jump'],
  ShiftLeft: ['run'], ShiftRight: ['run'], KeyX: ['run'], KeyJ: ['run'],
  KeyC: ['kazoo'], KeyL: ['kazoo'], KeyE: ['kazoo'],
  Escape: ['pause', 'back'], KeyP: ['pause'], Enter: ['confirm'], NumpadEnter: ['confirm'], Backspace: ['back'],
};
const Input = {
  held: {}, pressed: {}, prev: {}, latch: {}, down: new Set(), touch: {}, pad: {}, any: false,
  update() {
    this.pollPad();
    const k = {};
    for (const code of this.down) for (const a of (KEYMAP[code] || [])) k[a] = true;
    this.any = false;
    for (const a of ACTS) {
      const h = !!(k[a] || this.touch[a] || this.pad[a]);
      this.held[a] = h;
      this.pressed[a] = (h && !this.prev[a]) || !!this.latch[a];
      if (this.pressed[a]) this.any = true;
      this.prev[a] = h; this.latch[a] = false;
    }
    // en menús: A = confirmar, B = regresar
    this.ok = this.pressed.confirm || this.pressed.jump;
    this.cancel = this.pressed.back || this.pressed.run;
  },
  pollPad() {
    const p = {};
    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const g of gps) {
      if (!g) continue;
      const b = i => g.buttons[i] && g.buttons[i].pressed;
      const ax = g.axes[0] || 0, ay = g.axes[1] || 0;
      if (b(14) || ax < -0.4) p.left = 1;
      if (b(15) || ax > 0.4) p.right = 1;
      if (b(12) || ay < -0.55) p.up = 1;
      if (b(13) || ay > 0.55) p.down = 1;
      if (b(0)) p.jump = 1;
      if (b(2) || b(1)) p.run = 1;
      if (b(1)) p.back = 1;
      if (b(3) || b(5)) p.kazoo = 1;
      if (b(9)) p.pause = 1;
      if (Object.keys(p).length) Snd.init();
    }
    this.pad = p;
  },
  clear() { this.down.clear(); this.touch = {}; for (const a of ACTS) { this.latch[a] = false; } },
};
addEventListener('keydown', e => {
  const m = KEYMAP[e.code];
  Snd.init();
  if (!m) return;
  e.preventDefault();
  if (!e.repeat) for (const a of m) Input.latch[a] = true;
  Input.down.add(e.code);
});
addEventListener('keyup', e => { Input.down.delete(e.code); });
addEventListener('blur', () => Input.clear());

// táctil: varios dedos, se puede deslizar entre botones
const ptr = new Map();
function actAt(x, y) {
  const el = document.elementFromPoint(x, y);
  const b = el && el.closest && el.closest('[data-a]');
  return b ? b.dataset.a : null;
}
function touchRecalc() {
  const t = {};
  for (const a of ptr.values()) if (a) t[a] = true;
  Input.touch = t;
  document.querySelectorAll('#touch [data-a]').forEach(b => b.classList.toggle('on', !!t[b.dataset.a]));
}
document.addEventListener('pointerdown', e => {
  Snd.init();
  const a = actAt(e.clientX, e.clientY);
  if (!a) { if (e.target === cv) Input.latch.confirm = true; return; }
  e.preventDefault();
  ptr.set(e.pointerId, a); Input.latch[a] = true; touchRecalc();
}, { passive: false });
document.addEventListener('pointermove', e => {
  if (!ptr.has(e.pointerId)) return;
  const a = actAt(e.clientX, e.clientY);
  if (a !== ptr.get(e.pointerId)) { ptr.set(e.pointerId, a); if (a) Input.latch[a] = true; touchRecalc(); }
});
const ptrEnd = e => { if (ptr.delete(e.pointerId)) touchRecalc(); };
document.addEventListener('pointerup', ptrEnd);
document.addEventListener('pointercancel', ptrEnd);
document.addEventListener('contextmenu', e => e.preventDefault());

/* ---------------- AUDIO ---------------- */
const NOTE = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };
const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

const Snd = {
  ac: null, musicOn: true, sfxOn: true, cur: null, rate: 1, pending: null,
  init() {
    if (this.ac) { if (this.ac.state === 'suspended') this.ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try { this.ac = new AC(); } catch (e) { return; }
    const a = this.ac;
    this.master = a.createGain(); this.master.gain.value = 0.8; this.master.connect(a.destination);
    this.mus = a.createGain(); this.mus.gain.value = this.musicOn ? 0.5 : 0; this.mus.connect(this.master);
    this.fx = a.createGain(); this.fx.gain.value = this.sfxOn ? 0.7 : 0; this.fx.connect(this.master);
    const len = a.sampleRate;
    this.noiseBuf = a.createBuffer(1, len, a.sampleRate);
    const d = this.noiseBuf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    if (this.pending) { const p = this.pending; this.pending = null; this.play(p); }
  },
  setMusic(on) { this.musicOn = on; if (this.mus) this.mus.gain.value = on ? 0.5 : 0; },
  setSfx(on) { this.sfxOn = on; if (this.fx) this.fx.gain.value = on ? 0.7 : 0; },
  tone(dest, type, f0, f1, t, dur, vol, vib) {
    const a = this.ac;
    const o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t);
    if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.006);
    g.gain.setValueAtTime(vol, t + Math.max(0.006, dur * 0.6));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let out = g;
    if (vib) {
      const l = a.createOscillator(), lg = a.createGain();
      l.frequency.value = vib.rate || 6; lg.gain.value = vib.depth || 6;
      l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05);
    }
    if (type === 'sawtooth' && vib && vib.kazoo) {
      const bp = a.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 1400; bp.Q.value = 2.2;
      const pk = a.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 600; pk.gain.value = 8;
      o.connect(pk); pk.connect(bp); bp.connect(g);
    } else o.connect(g);
    out.connect(dest);
    o.start(t); o.stop(t + dur + 0.05);
  },
  noise(dest, t, dur, vol, hp = 800, lp = 12000) {
    const a = this.ac;
    const s = a.createBufferSource(); s.buffer = this.noiseBuf;
    const f = a.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp;
    const f2 = a.createBiquadFilter(); f2.type = 'lowpass'; f2.frequency.value = lp;
    const g = a.createGain();
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(f2); f2.connect(g); g.connect(dest);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  },
  kazoo(notes, t0, vol = 0.22, dest) {
    let t = t0;
    for (const [m, d] of notes) {
      if (m) this.tone(dest || this.fx, 'sawtooth', mtof(m), mtof(m) * 0.99, t, d, vol, { rate: 6.5, depth: mtof(m) * 0.018, kazoo: 1 });
      t += d;
    }
  },
  sfx(name, p = 0) {
    if (!this.ac || !this.sfxOn) return;
    const a = this.ac, t = a.currentTime, F = this.fx;
    switch (name) {
      case 'jump': this.tone(F, 'square', 260, 620, t, 0.14, 0.12); break;
      case 'coin': this.tone(F, 'square', 988, 988, t, 0.07, 0.1); this.tone(F, 'square', 1319, 1319, t + 0.07, 0.22, 0.1); break;
      case 'stomp': this.tone(F, 'square', 420, 90, t, 0.12, 0.14); this.noise(F, t, 0.06, 0.12, 300); break;
      case 'bump': this.tone(F, 'triangle', 180, 120, t, 0.09, 0.3); break;
      case 'break': this.noise(F, t, 0.25, 0.3, 200, 3000); this.tone(F, 'square', 200, 60, t, 0.2, 0.08); break;
      case 'item': [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(F, 'square', f, f, t + i * 0.05, 0.06, 0.08)); break;
      case 'power': [392, 523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => this.tone(F, 'square', f, f * 1.02, t + i * 0.06, 0.08, 0.1)); break;
      case 'hurt': this.tone(F, 'sawtooth', 500, 90, t, 0.35, 0.15); break;
      case 'die': this.kazoo([[67, 0.28], [66, 0.28], [65, 0.28], [64, 0.9]], t, 0.25); break;
      case 'kazoo': this.kazoo([[72, 0.1], [74, 0.1], [76, 0.1], [79, 0.35]], t, 0.25); break;
      case 'throw': this.noise(F, t, 0.08, 0.15, 1500); this.tone(F, 'square', 700, 300, t, 0.08, 0.06); break;
      case 'chancla': this.noise(F, t, 0.07, 0.35, 600, 5000); this.tone(F, 'square', 160, 60, t, 0.08, 0.15); break;
      case 'bosshit': this.tone(F, 'square', 300, 80, t, 0.25, 0.16); this.noise(F, t, 0.2, 0.2, 400); break;
      case 'boom': this.noise(F, t, 1.2, 0.5, 40, 2000); this.tone(F, 'triangle', 120, 30, t, 1, 0.4); break;
      case '1up': [659, 784, 1319, 1047, 1175, 1568].forEach((f, i) => this.tone(F, 'square', f, f, t + i * 0.08, 0.08, 0.1)); break;
      case 'pipe': [0, 1, 2].forEach(i => this.tone(F, 'square', 400 - i * 100, 150 - i * 30, t + i * 0.1, 0.1, 0.1)); break;
      case 'blip': this.tone(F, 'square', p || 300, p || 300, t, 0.03, 0.04); break;
      case 'select': this.tone(F, 'square', 660, 660, t, 0.05, 0.08); break;
      case 'ok': this.tone(F, 'square', 660, 660, t, 0.06, 0.1); this.tone(F, 'square', 990, 990, t + 0.06, 0.1, 0.1); break;
      case 'pause': this.tone(F, 'square', 880, 880, t, 0.06, 0.1); this.tone(F, 'square', 660, 660, t + 0.08, 0.06, 0.1); break;
      case 'flag': for (let i = 0; i < 12; i++) this.tone(F, 'square', 300 + i * 70, 300 + i * 80, t + i * 0.04, 0.05, 0.07); break;
      case 'clear': this.kazoo([[67, 0.12], [72, 0.12], [76, 0.12], [79, 0.3], [76, 0.12], [79, 0.6]], t, 0.24); break;
      case 'quake': this.noise(F, t, 0.8, 0.25, 30, 400); break;
      case 'squeak': this.tone(F, 'square', 1200 + Math.random() * 300, 900, t, 0.06, 0.04); break;
      case 'bark': this.tone(F, 'sawtooth', 300, 160, t, 0.12, 0.2); this.noise(F, t, 0.1, 0.2, 500); break;
      case 'checkpoint': [523, 784, 1047].forEach((f, i) => this.tone(F, 'triangle', f, f, t + i * 0.08, 0.12, 0.25)); break;
      case 'memory': [784, 988, 1175, 1568, 1175, 1568].forEach((f, i) => this.tone(F, 'triangle', f, f, t + i * 0.09, 0.2, 0.22)); break;
      case 'glitch': this.tone(F, 'square', 80 + Math.random() * 900, 40 + Math.random() * 2000, t, 0.12, 0.06); break;
    }
  },
  /* -------- música -------- */
  play(name) {
    if (!this.ac) { this.pending = name; return; }
    if (this.cur === name) return;
    this.stop();
    const tr = TRACKS[name]; if (!tr) return;
    if (!tr.built) { Object.assign(tr, tr.make()); tr.built = true; }
    this.cur = name; this.track = tr; this.step = 0;
    this.nextT = this.ac.currentTime + 0.08;
    this.timer = setInterval(() => this.sched(), 25);
  },
  stop() { if (this.timer) clearInterval(this.timer); this.timer = null; this.cur = null; },
  sched() {
    const tr = this.track, a = this.ac;
    if (!tr || document.hidden) { this.nextT = a.currentTime + 0.05; return; }
    const spb = 60 / tr.bpm / 4 / this.rate;
    while (this.nextT < a.currentTime + 0.12) {
      for (const ch of tr.ch) {
        const n = ch.seq[this.step % ch.seq.length];
        if (n) this.note(ch, n, this.nextT, spb);
      }
      this.step++;
      this.nextT += spb;
    }
  },
  note(ch, n, t, spb) {
    const M = this.mus;
    if (ch.drum) {
      if (n.d === 'k') this.tone(M, 'sine', 160, 40, t, 0.12, 0.5);
      else if (n.d === 's') this.noise(M, t, 0.11, 0.22, 1200);
      else if (n.d === 'h') this.noise(M, t, 0.03, 0.1, 7000);
      return;
    }
    const dur = Math.max(0.05, n.len * spb * 0.92);
    if (ch.kazoo) this.tone(M, 'sawtooth', n.f, n.f, t, dur, ch.vol, { rate: 6, depth: n.f * 0.015, kazoo: 1 });
    else this.tone(M, ch.wave, n.f, n.f, t, dur, ch.vol, ch.vib ? { rate: 5, depth: n.f * 0.01 } : null);
  },
};

/* --- compositor procedural: cada canción se arma con progresión + estilo --- */
function compose(o) {
  const Rn = mulberry(o.seed || 7);
  const scale = o.minor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
  const deg = d => { const oc = Math.floor(d / 7); return scale[((d % 7) + 7) % 7] + 12 * oc; };
  const root = o.root || 60;
  const bars = o.prog.length, N = bars * 16;
  const lead = new Array(N).fill(null), bass = new Array(N).fill(null), arp = new Array(N).fill(null), drum = new Array(N).fill(null);
  const RH = o.rhythms || ['1.1.1.1.1.1.1.1.', '1..1..1.1..1..1.', '1...1...1.1.1...', '1.11.1.11.1.1...', '1..1..1...1.1.1.', '1.......1...1...', '11.1.11.1.11.1..', '1.1.1...1.1.1...'];
  // motivos de 2 compases en grados relativos al acorde
  function motif() {
    const r1 = RH[Math.floor(Rn() * RH.length)], r2 = RH[Math.floor(Rn() * RH.length)];
    const notes = []; let p = [0, 2, 4][Math.floor(Rn() * 3)];
    const rh = r1 + r2;
    for (let i = 0; i < 32; i++) if (rh[i] === '1') {
      if (i % 8 === 0) p = [0, 2, 4, 7][Math.floor(Rn() * 4)];
      else p += [-1, 1, 1, 2, -2, 0][Math.floor(Rn() * 6)];
      p = clamp(p, -2, 9);
      notes.push([i, p]);
    }
    // última nota larga
    return notes;
  }
  const A = motif(), Bm = motif(), Cm = motif();
  const form = o.form || ['A', 'A', 'B', 'A', 'C', 'C', 'B', 'A'];
  for (let ph = 0; ph < bars / 2; ph++) {
    const m = { A, B: Bm, C: Cm }[form[ph % form.length]];
    for (const [i, p] of m) {
      const bar = ph * 2 + Math.floor(i / 16);
      const chordDeg = o.prog[bar % bars];
      const midi = root + 12 * (o.leadOct || 0) + deg(chordDeg + p);
      const st = ph * 32 + i;
      // longitud hasta la siguiente nota
      let len = 1; while (len < 4 && st + len < N && !m.some(q => ph * 32 + q[0] === st + len)) len++;
      lead[st] = { f: mtof(midi), len };
    }
  }
  for (let b = 0; b < bars; b++) {
    const d = o.prog[b], s0 = b * 16;
    const r = root - 24 + deg(d), fifth = root - 24 + deg(d + 4), third = root - 12 + deg(d + 2);
    const ch = [root + deg(d), root + deg(d + 2), root + deg(d + 4)];
    const st = o.style;
    if (st === 'polka') {
      for (const k of [0, 8]) bass[s0 + k] = { f: mtof(k ? fifth : r), len: 3 };
      for (const k of [4, 12]) { arp[s0 + k] = { f: mtof(third + 12), len: 2 }; }
      for (let k = 0; k < 16; k += 4) drum[s0 + k] = { d: k % 8 ? 's' : 'k' };
      for (let k = 2; k < 16; k += 4) drum[s0 + k] = { d: 'h' };
    } else if (st === 'drive') {
      for (let k = 0; k < 16; k += 2) bass[s0 + k] = { f: mtof(k % 8 === 6 ? fifth : r), len: 1 };
      for (let k = 0; k < 16; k++) arp[s0 + k] = (k % 2) ? null : { f: mtof(ch[(k / 2) % 3] + 12), len: 1 };
      for (let k = 0; k < 16; k += 4) drum[s0 + k] = { d: (k % 8) ? 's' : 'k' };
      for (let k = 2; k < 16; k += 4) drum[s0 + k] = { d: 'h' };
      drum[s0 + 14] = { d: 'k' };
    } else if (st === 'walk') {
      for (let k = 0; k < 16; k += 4) bass[s0 + k] = { f: mtof(root - 24 + deg(d + [0, 2, 4, 2][k / 4])), len: 3 };
      for (const k of [2, 6, 10, 14]) arp[s0 + k] = { f: mtof(ch[(k >> 2) % 3]), len: 1 };
      for (let k = 0; k < 16; k += 8) drum[s0 + k] = { d: 'k' };
      drum[s0 + 4] = { d: 's' }; drum[s0 + 12] = { d: 's' };
    } else if (st === 'techno') {
      for (let k = 0; k < 16; k += 2) bass[s0 + k] = { f: mtof(r + (k % 4 ? 12 : 0)), len: 1 };
      for (let k = 0; k < 16; k++) arp[s0 + k] = { f: mtof(ch[k % 3] + 12 * (1 + (k >> 3))), len: 1 };
      for (let k = 0; k < 16; k += 4) drum[s0 + k] = { d: 'k' };
      for (let k = 2; k < 16; k += 4) drum[s0 + k] = { d: 'h' };
      drum[s0 + 12] = { d: 's' };
    } else if (st === 'slow') {
      bass[s0] = { f: mtof(r), len: 15 };
      for (let k = 0; k < 16; k += 4) arp[s0 + k] = { f: mtof(ch[(k >> 2) % 3]), len: 4 };
      if (o.drums) drum[s0] = { d: 'k' };
    } else if (st === 'eerie') {
      bass[s0] = { f: mtof(r), len: 8 }; bass[s0 + 8] = { f: mtof(r + 1), len: 8 };
      for (let k = 0; k < 16; k += 3) arp[s0 + k] = { f: mtof(ch[k % 3] + 12 + (k % 2 ? 1 : 0)), len: 1 };
      drum[s0] = { d: 'k' }; drum[s0 + 10] = { d: 'h' };
    }
  }
  if (o.sparse) for (let i = 0; i < N; i++) if (lead[i] && i % 4 && Rn() < 0.4) lead[i] = null;
  const chs = [
    { seq: lead, wave: o.leadWave || 'square', vol: o.leadVol || 0.07, kazoo: !!o.kazoo, vib: o.vib },
    { seq: bass, wave: 'triangle', vol: 0.22 },
    { seq: arp, wave: o.arpWave || 'square', vol: o.arpVol || 0.03 },
  ];
  if (!o.noDrums) chs.push({ seq: drum, drum: true });
  return { bpm: o.bpm, ch: chs };
}
const TR = (o) => ({ make: () => compose(o) });
const TRACKS = {
  title: TR({ bpm: 132, root: 62, prog: [0, 3, 4, 0, 5, 3, 4, 4], style: 'polka', kazoo: true, leadVol: 0.16, seed: 11 }),
  calle: TR({ bpm: 150, root: 67, prog: [0, 0, 4, 4, 3, 3, 4, 0, 0, 0, 4, 4, 3, 4, 0, 0], style: 'polka', kazoo: true, leadVol: 0.14, seed: 42, leadOct: -1 }),
  mercado: TR({ bpm: 160, root: 65, prog: [0, 4, 0, 4, 3, 0, 4, 0], style: 'polka', leadVol: 0.07, seed: 77 }),
  fabrica: TR({ bpm: 132, root: 57, minor: true, prog: [0, 0, 5, 5, 3, 3, 4, 4], style: 'drive', seed: 5 }),
  drenaje: TR({ bpm: 100, root: 52, minor: true, prog: [0, 5, 0, 4, 0, 5, 3, 4], style: 'walk', leadWave: 'triangle', leadVol: 0.18, sparse: true, seed: 9 }),
  iglesia: TR({ bpm: 84, root: 57, minor: true, prog: [0, 3, 4, 0, 5, 3, 4, 4], style: 'slow', leadWave: 'triangle', leadVol: 0.2, arpWave: 'triangle', arpVol: 0.08, vib: true, seed: 3, noDrums: true }),
  red: TR({ bpm: 140, root: 60, minor: true, prog: [0, 0, 5, 5, 6, 6, 4, 4], style: 'techno', seed: 21 }),
  dimension: TR({ bpm: 108, root: 55, minor: true, prog: [0, 1, 0, 6, 0, 1, 4, 4], style: 'eerie', leadWave: 'triangle', leadVol: 0.16, vib: true, sparse: true, seed: 66 }),
  casa: TR({ bpm: 118, root: 57, minor: true, prog: [0, 3, 0, 4, 5, 3, 4, 4], style: 'walk', seed: 31 }),
  boss: TR({ bpm: 168, root: 52, minor: true, prog: [0, 0, 5, 6, 0, 0, 5, 4], style: 'drive', leadVol: 0.08, seed: 99 }),
  cesar: TR({ bpm: 184, root: 50, minor: true, prog: [0, 6, 5, 4, 0, 6, 5, 4], style: 'techno', leadVol: 0.08, seed: 123 }),
  sad: TR({ bpm: 76, root: 60, prog: [0, 5, 3, 4, 0, 5, 3, 4], style: 'slow', leadWave: 'triangle', leadVol: 0.2, arpWave: 'triangle', arpVol: 0.07, seed: 8, noDrums: true }),
  mama: TR({ bpm: 172, root: 64, prog: [0, 4, 0, 4, 3, 4, 0, 0], style: 'polka', kazoo: true, leadVol: 0.14, seed: 55 }),
  ending: TR({ bpm: 120, root: 64, prog: [0, 3, 4, 0, 5, 3, 1, 4], style: 'walk', kazoo: true, leadVol: 0.14, seed: 14 }),
  bad: TR({ bpm: 66, root: 48, minor: true, prog: [0, 5, 3, 4], style: 'eerie', leadWave: 'triangle', leadVol: 0.14, sparse: true, seed: 666, noDrums: true }),
  tension: TR({ bpm: 96, root: 52, minor: true, prog: [0, 1, 0, 1], style: 'eerie', leadWave: 'triangle', leadVol: 0.1, sparse: true, seed: 404 }),
};
