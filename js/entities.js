'use strict';
/* =========================================================
   MUNDO, JUGADOR, ENEMIGOS, OBJETOS Y JEFES
   ========================================================= */
let W = null;   // mundo actual
let P = null;   // jugador actual

class Ent {
  constructor(x, y, w, h) { this.x = x; this.y = y; this.w = w; this.h = h; this.vx = 0; this.vy = 0; this.dead = false; this.onGround = false; this.t = 0; this.face = -1; this.active = false; }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
  physics(g = 0.4, max = 7) { this.vy = Math.min(this.vy + g, max); W.moveX(this); W.moveY(this); }
  update() {}
  draw() {}
}

/* ====================== MUNDO ====================== */
class World {
  constructor(def, info) {
    this.info = info; this.def = def;
    this.parts = []; this.texts = []; this.shots = []; this.bumps = []; this.crumble = {}; this.multi = {};
    this.camX = 0; this.shakeT = 0; this.lock = null; this.boss = null; this.signText = null; this.t = 0;
    this.load(def);
  }
  load(def) {
    W = this;
    this.theme = def.theme; this.w = def.w; this.h = 14;
    this.map = new Uint8Array(def.map); this.cont = Object.assign({}, def.cont);
    this.low = def.low || []; this.arena = def.arena; this.warps = [];
    this.ents = []; this.plats = [];
    for (const d of def.ents) this.spawnDef(d);
  }
  spawnDef(d) {
    const E = (o) => { this.ents.push(o); return o; };
    switch (d.t) {
      case 'coin': E(new Coin(d.x, d.y)); break;
      case 'warp': this.warps.push(d); break;
      case 'sign': E(new Sign(d.x, d.key)); break;
      case 'npc': E(new NPC(d.x, d.who, d.talk, d.dir)); break;
      case 'foto': E(new Foto(d.x, d.y, d.id)); break;
      case 'mitem': E(new MamaItem(d.x, d.y, d.id)); break;
      case 'check': E(new Checkpoint(d.x)); break;
      case 'goal': E(new Goal(d.x)); break;
      case 'mplat': { const p = new MPlat(d); this.plats.push(p); break; }
      default: {
        const en = makeEnemy(d.t, d.x, d.row);
        if (en) E(en);
      }
    }
  }
  groundY(px) { const tx = Math.floor(px / TS); for (let y = 0; y < 14; y++) { const t = this.tile(tx, y); if (SOLID[t] || t === 9) return y * TS; } return 14 * TS; }
  tile(tx, ty) {
    if (tx < 0 || tx >= this.w) return 18;
    if (this.lock && (tx < this.lock.l || tx > this.lock.r)) return 18;
    if (ty < 0 || ty >= 14) return 0;
    return this.map[ty * this.w + tx];
  }
  setT(tx, ty, t) { if (tx >= 0 && tx < this.w && ty >= 0 && ty < 14) this.map[ty * this.w + tx] = t; }
  solidPx(px, py) { const t = this.tile(Math.floor(px / TS), Math.floor(py / TS)); return SOLID[t] === 1; }
  moveX(e) {
    e.hitWall = false;
    if (!e.vx) return;
    e.x += e.vx;
    const top = Math.floor(e.y / TS), bot = Math.floor((e.y + e.h - 1) / TS);
    if (e.vx > 0) {
      const tx = Math.floor((e.x + e.w - 1) / TS);
      for (let ty = top; ty <= bot; ty++) if (SOLID[this.tile(tx, ty)]) { e.x = tx * TS - e.w; e.hitWall = true; break; }
    } else {
      const tx = Math.floor(e.x / TS);
      for (let ty = top; ty <= bot; ty++) if (SOLID[this.tile(tx, ty)]) { e.x = (tx + 1) * TS; e.hitWall = true; break; }
    }
    if (e.hitWall && !e.keepVx) e.vx = 0;
  }
  moveY(e) {
    const prevBot = e.y + e.h, prevTop = e.y;
    e.y += e.vy; e.onGround = false; e.bonk = null;
    const l = Math.floor(e.x / TS), r = Math.floor((e.x + e.w - 1) / TS);
    if (e.vy > 0) {
      const ty = Math.floor((e.y + e.h - 1) / TS);
      for (let tx = l; tx <= r; tx++) {
        const t = this.tile(tx, ty);
        if (SOLID[t] || (t === 9 && prevBot <= ty * TS + 1)) { e.y = ty * TS - e.h; e.vy = 0; e.onGround = true; e.gt = t; e.gtx = tx; e.gty = ty; break; }
      }
      if (!e.onGround && e.usePlats) for (const p of this.plats) {
        if (e.x + e.w > p.x && e.x < p.x + p.w && prevBot <= p.y + 2 && e.y + e.h >= p.y) { e.y = p.y - e.h; e.vy = 0; e.onGround = true; e.ride = p; e.gt = 9; break; }
      }
    } else if (e.vy < 0) {
      const ty = Math.floor(e.y / TS);
      let best = null, bd = 99;
      for (let tx = l; tx <= r; tx++) {
        const t = this.tile(tx, ty);
        const hidden = t === 14 && e.isPlayer && prevTop >= (ty + 1) * TS - 1;
        if (SOLID[t] || hidden) { const d = Math.abs((tx + 0.5) * TS - e.cx); if (d < bd) { bd = d; best = tx; } }
      }
      if (best !== null) { e.y = (ty + 1) * TS; e.vy = 0; e.bonk = { tx: best, ty }; }
    }
  }
  bump(tx, ty) {
    const t = this.tile(tx, ty), key = ty * this.w + tx, c = this.cont[key];
    const bx = tx * TS, by = ty * TS;
    if (t === 3 || t === 14) {
      this.setT(tx, ty, 4); delete this.cont[key];
      this.bumps.push({ tx, ty, t: 0 });
      if (!c || c === 'coin') { this.ents.push(new PopCoin(bx, by - 16)); G.addCoin(); Snd.sfx('coin'); }
      else { this.ents.push(new PowerUp(bx, by, c)); Snd.sfx('item'); }
    } else if (t === 2) {
      if (c === 'multi') {
        this.multi[key] = (this.multi[key] || 0) + 1;
        this.ents.push(new PopCoin(bx, by - 16)); G.addCoin(); Snd.sfx('coin');
        this.bumps.push({ tx, ty, t: 0 });
        if (this.multi[key] >= 8) { this.setT(tx, ty, 4); delete this.cont[key]; }
      } else {
        this.setT(tx, ty, 0);
        for (let i = 0; i < 4; i++) this.part(bx + 4 + (i % 2) * 8, by + 4 + (i >> 1) * 8, (i % 2 ? 1 : -1) * rnd(1, 2), -rnd(3, 6), THEMES[this.theme].brick, 60, 4, 0.3);
        G.addScore(50, bx, by); Snd.sfx('break');
      }
    } else { Snd.sfx('bump'); return; }
    // matar enemigos parados encima
    for (const e of this.ents) if (e.enemy && !e.dead && e.x + e.w > bx && e.x < bx + TS && Math.abs(e.y + e.h - by) < 6) e.kill(true);
  }
  part(x, y, vx, vy, col, life = 30, s = 2, g = 0.15) { this.parts.push({ x, y, vx, vy, col, life, s, g }); }
  burst(x, y, col, n = 10, sp = 2.5) { for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = rnd(0.5, sp); this.part(x, y, Math.cos(a) * v, Math.sin(a) * v - 1, col, irnd(20, 40), irnd(1, 3), 0.08); } }
  text(x, y, s, col = '#fff') { this.texts.push({ x, y, s, col, life: 50 }); }
  shake(n) { this.shakeT = Math.max(this.shakeT, n); }
  isLow(px) { for (const [a, b] of this.low) if (px >= a && px <= b) return true; return false; }
  update() {
    this.t++;
    for (const p of this.plats) p.update();
    const cam = this.camX;
    for (const e of this.ents) {
      if (!e.active && e.x < cam + VW + 48 && e.x + e.w > cam - 48) e.active = true;
      if (e.active && !e.dead) e.update();
    }
    for (const s of this.shots) if (!s.dead) s.update();
    if (this.boss && !this.boss.dead) this.boss.update();
    this.ents = this.ents.filter(e => !e.dead && e.y < 16 * TS);
    this.shots = this.shots.filter(s => !s.dead);
    for (const p of this.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const t of this.texts) { t.y -= 0.5; t.life--; }
    this.texts = this.texts.filter(t => t.life > 0);
    for (const b of this.bumps) b.t++;
    this.bumps = this.bumps.filter(b => b.t < 10);
    // bloques que se desmoronan
    for (const k in this.crumble) {
      const c = this.crumble[k];
      c.t++;
      const tx = k % this.w, ty = Math.floor(k / this.w);
      if (c.t === 28) { this.setT(tx, ty, 0); this.burst(tx * TS + 8, ty * TS + 8, THEMES[this.theme].brick, 8); }
      if (c.t > 300) {
        if (!overlap(P, { x: tx * TS, y: ty * TS, w: TS, h: TS })) { this.setT(tx, ty, 17); delete this.crumble[k]; }
      }
    }
    if (this.shakeT > 0) this.shakeT--;
    // cámara
    if (this.lock) this.camX += (this.lock.l * TS - this.camX) * 0.12;
    else {
      const target = P.x + P.w / 2 - VW * 0.42 + P.face * 18;
      this.camX += (target - this.camX) * 0.12;
    }
    this.camX = clamp(this.camX, 0, this.w * TS - VW);
  }
  draw() {
    const ritmo = G.run ? G.run.ritmo : 0;
    let sx = 0, sy = 0;
    const qk = ritmo > 40 && (this.t % 400) < 40 ? 1 : 0;
    if (this.shakeT > 0 || qk) { sx = rnd(-2, 2); sy = rnd(-2, 2); }
    drawBG(this.theme, this.camX, this.t, ritmo);
    ctx.save(); ctx.translate(Math.round(-this.camX + sx), Math.round(sy));
    if (this.decor) this.decor();
    const ts = tileset(this.theme);
    const x0 = Math.floor(this.camX / TS) - 1, x1 = x0 + VW / TS + 3;
    for (let ty = 0; ty < 14; ty++) for (let tx = x0; tx < x1; tx++) {
      if (tx < 0 || tx >= this.w) continue;
      let t = this.map[ty * this.w + tx];
      if (!t || t === 14) continue;
      if (t === 1 && (ty === 0 || this.map[(ty - 1) * this.w + tx] !== 1)) t = 19;
      let oy = 0;
      for (const b of this.bumps) if (b.tx === tx && b.ty === ty) oy = -Math.sin(b.t / 10 * Math.PI) * 5;
      if (t === 17 && this.crumble[ty * this.w + tx]) oy = rnd(-1, 1);
      if (t === 11) { ctx.drawImage(ts, 11 * TS, 0, TS, TS, tx * TS, ty * TS + Math.sin((tx + this.t / 10)) * 1, TS, TS); continue; }
      ctx.drawImage(ts, t * TS, 0, TS, TS, tx * TS, ty * TS + oy, TS, TS);
    }
    for (const p of this.plats) p.draw();
    for (const e of this.ents) if (e.x < this.camX + VW + 32 && e.x + e.w > this.camX - 32) e.draw();
    if (this.boss && !this.boss.dead) this.boss.draw();
    if (P) P.draw();
    for (const s of this.shots) s.draw();
    for (const p of this.parts) R(p.x, p.y, p.s, p.s, p.col);
    for (const t of this.texts) txt(t.s, t.x, t.y, t.col, 'center');
    ctx.restore();
  }
}

/* ====================== JUGADOR ====================== */
class Player extends Ent {
  constructor(x, y, skin = 'kazoo') {
    const hh = skin === 'kazoo' ? 24 : 21;
    super(x, y, 10, hh);
    this.skin = skin; this.isPlayer = true; this.usePlats = true;
    this.face = 1; this.state = 'play'; this.coyote = 0; this.jbuf = 0; this.inv = 0; this.star = 0;
    this.kzCD = 0; this.anim = 0; this.throwT = 0; this.ride = null; this.st = 0;
    this.hearts = G.run ? G.run.hearts : 3; this.chancla = skin === 'mama' ? true : (G.run ? G.run.chancla : false);
  }
  hurt() {
    if (this.inv > 0 || this.star > 0 || this.state !== 'play') return;
    this.hearts--; G.run.hearts = this.hearts;
    if (this.hearts <= 0) { this.die(); return; }
    this.inv = 100; this.vy = -3.5; this.vx = -this.face * 2;
    if (this.skin === 'kazoo' && this.chancla && this.hearts === 1) { /* conserva la chancla */ }
    Snd.sfx('hurt'); W.shake(8);
  }
  die() {
    if (this.state === 'dead') return;
    this.state = 'dead'; this.st = 0; this.vy = -6.5; this.vx = 0;
    Snd.stop(); Snd.sfx('die');
  }
  update() {
    const I = Input;
    this.t++;
    if (this.state === 'dead') {
      this.st++;
      if (this.st > 30) { this.vy = Math.min(this.vy + 0.3, 8); this.y += this.vy; }
      if (this.st > 170) G.onDeath();
      return;
    }
    if (this.state === 'warp') {
      this.st++; this.y += this.warpDir * 0.8;
      if (this.st > 36) { this.state = 'play'; if (this.onWarpDone) { const f = this.onWarpDone; this.onWarpDone = null; f(); } }
      return;
    }
    if (this.state === 'goal') { this.goalUpdate(); return; }
    if (this.state === 'frozen') { this.vx = 0; this.physics(0.55); return; }
    if (this.inv > 0) this.inv--;
    if (this.star > 0) { this.star--; if (this.star === 0) Snd.rate = 1; }
    if (this.kzCD > 0) this.kzCD--;
    if (this.throwT > 0) this.throwT--;
    // ride en plataforma
    if (this.ride) { this.x += this.ride.mx; this.y = this.ride.y - this.h; this.ride = null; }
    // ---- interacción ----
    const near = this.nearNPC();
    if (I.pressed.up && near) { near.talk(); return; }
    if (I.pressed.down && this.onGround) {
      for (const w of W.warps) {
        if (this.x + this.w > w.x + 4 && this.x < w.x + 28 && Math.abs(this.y + this.h - w.y) < 2) { G.enterWarp(w); return; }
      }
    }
    // ---- movimiento ----
    const run = I.held.run;
    let dir = (I.held.right ? 1 : 0) - (I.held.left ? 1 : 0);
    const max = run ? 2.6 : 1.55;
    if (dir) {
      this.face = dir;
      if (this.vx * dir < 0) this.vx += dir * (this.onGround ? 0.22 : 0.12);
      else if (Math.abs(this.vx) < max) this.vx = Math.min(max, Math.abs(this.vx) + (this.onGround ? 0.1 : 0.075)) * dir;
      else if (this.onGround) this.vx *= 0.97;
    } else if (this.onGround) { this.vx *= 0.8; if (Math.abs(this.vx) < 0.05) this.vx = 0; }
    else this.vx *= 0.985;
    if (this.onGround && (this.gt === 15 || this.gt === 16)) this.x += this.gt === 15 ? 0.9 : -0.9;
    // salto
    if (I.pressed.jump || (I.pressed.up && !near)) this.jbuf = 7; else if (this.jbuf > 0) this.jbuf--;
    if (this.onGround) this.coyote = 6; else if (this.coyote > 0) this.coyote--;
    if (this.jbuf > 0 && this.coyote > 0) {
      this.vy = -(6.1 + Math.abs(this.vx) * 0.22); this.jbuf = 0; this.coyote = 0; this.onGround = false;
      Snd.sfx('jump');
    }
    const low = W.isLow(this.cx);
    const holding = (I.held.jump || I.held.up) && this.vy < 0;
    let g = holding ? 0.26 : 0.55;
    if (low) g *= 0.45;
    this.vy = Math.min(this.vy + g, low ? 3.2 : 7);
    W.moveX(this);
    if (this.hitWall) this.vx = 0;
    W.moveY(this);
    if (this.bonk) { W.bump(this.bonk.tx, this.bonk.ty); this.vy = 0.5; }
    // bloques que se desmoronan
    if (this.onGround && this.gt === 17) { const k = this.gty * W.w + this.gtx; if (!W.crumble[k]) W.crumble[k] = { t: 0 }; }
    // ---- chancla y kazoo ----
    if (I.pressed.run && this.chancla && this.throwT === 0) {
      const mine = W.shots.filter(s => s.mine).length;
      if (mine < (this.skin === 'mama' ? 3 : 2)) {
        W.shots.push(new ChanclaShot(this.cx + this.face * 6, this.y + 6, this.face, this.skin === 'mama'));
        this.throwT = this.skin === 'mama' ? 14 : 18; Snd.sfx('throw');
      }
    }
    if (I.pressed.kazoo && this.skin === 'kazoo') {
      if (this.kzCD === 0) {
        this.kzCD = 300; Snd.sfx('kazoo');
        W.ents.push(new Ring(this.cx, this.cy));
        for (const e of W.ents) if (e.enemy && !e.dead && Math.hypot(e.cx - this.cx, e.cy - this.cy) < 96) e.stun = 200;
        if (W.boss && !W.boss.dead && Math.hypot(W.boss.cx - this.cx, W.boss.cy - this.cy) < 120) W.boss.stun = 70;
      } else Snd.sfx('bump');
    }
    // ---- peligros ----
    if (this.y > 14 * TS + 20) { this.hearts = 0; G.run.hearts = 0; this.die(); this.y = 15 * TS; return; }
    const l = Math.floor((this.x + 1) / TS), r = Math.floor((this.x + this.w - 2) / TS), tp = Math.floor((this.y + 4) / TS), bt = Math.floor((this.y + this.h - 1) / TS);
    for (let tx = l; tx <= r; tx++) for (let ty = tp; ty <= bt; ty++) {
      const t = W.tile(tx, ty);
      if (t === 11 || t === 12) { if (this.y + this.h > ty * TS + 6) { this.hearts = 0; G.run.hearts = 0; this.die(); return; } }
    }
    if (this.onGround && this.gt === 10) { this.hurt(); this.vy = -5; }
    // ---- choques con enemigos ----
    for (const e of W.ents) {
      if (!e.enemy || e.dead || !e.active || e.corpse) continue;
      if (!overlap(this, e)) continue;
      if (this.star > 0) { e.kill(true); G.addScore(200, e.x, e.y); continue; }
      if (e.stun > 0) { e.kill(true); G.addScore(100, e.x, e.y); Snd.sfx('stomp'); continue; }
      const prevBot = this.y + this.h - this.vy;
      if (this.vy > 0 && prevBot <= e.y + Math.max(8, e.h * 0.5) && e.stompable) {
        e.stomped(); this.vy = (Input.held.jump || Input.held.up) ? -6.4 : -4.2;
        G.addScore(100, e.x, e.y); Snd.sfx('stomp');
      } else if (!e.harmless) this.hurt();
    }
    // jefe
    const B = W.boss;
    if (B && !B.dead && B.solidHit !== false && overlap(this, B.hitbox())) {
      const hb = B.hitbox();
      const prevBot = this.y + this.h - this.vy;
      if (this.vy > 0 && prevBot <= hb.y + 10 && B.canStomp()) { B.hit('stomp'); this.vy = -6.2; Snd.sfx('stomp'); }
      else if (this.star > 0) { if (B.canStomp()) B.hit('star'); }
      else this.hurt();
    }
    for (const s of W.shots) if (!s.mine && !s.dead && overlap(this, s)) { if (this.star === 0) { this.hurt(); s.dead = true; } }
    // animación
    if (!this.onGround) this.frame = 5;
    else if (Math.abs(this.vx) > 0.2) { this.anim += Math.abs(this.vx) * 0.12; this.frame = 1 + (Math.floor(this.anim) % 4); }
    else this.frame = 0;
    if (this.throwT > 10) this.frame = 7;
  }
  nearNPC() {
    for (const e of W.ents) if (e instanceof NPC && Math.abs(e.cx - this.cx) < 22 && Math.abs(e.y + e.h - (this.y + this.h)) < 20) return e;
    return null;
  }
  goalUpdate() {
    this.st++;
    if (this.goalPhase === 0) {
      this.frame = 5; this.vx = 0;
      const gy = W.groundY(this.x + 5) - this.h;
      if (this.y < gy) this.y = Math.min(gy, this.y + 2.5);
      else if (this.st > 40) { this.goalPhase = 1; this.face = 1; }
    } else if (this.goalPhase === 1) {
      this.vx = 1.2; W.moveX(this); this.vy += 0.5; W.moveY(this);
      this.anim += 0.15; this.frame = 1 + (Math.floor(this.anim) % 4);
      if (this.st > 150) { this.goalPhase = 2; G.levelClear(); }
    }
  }
  draw() {
    if (this.inv > 0 && (this.t >> 2) % 2 && this.state === 'play') return;
    const s = SPR[this.skin];
    const f = this.state === 'dead' ? 6 : (this.frame || 0);
    const dx = this.x - 3, dy = this.y + this.h - s.h + 1;
    if (this.star > 0) {
      ctx.save(); ctx.filter = `hue-rotate(${(this.t * 25) % 360}deg) brightness(1.3)`;
      drawSpr(this.skin, f, dx, dy, this.face < 0); ctx.restore();
      if (this.t % 3 === 0) W.part(this.cx + rnd(-6, 6), this.y + rnd(0, this.h), 0, -0.5, pick(['#ffd23f', '#fff', '#ff7ab0']), 20, 2, 0);
    } else drawSpr(this.skin, f, dx, dy, this.face < 0);
    if (this.chancla && this.skin === 'kazoo' && this.state === 'play' && this.frame !== 7) {
      // la chancla en el bolsillo de atrás
      R(this.face > 0 ? this.x - 1 : this.x + this.w - 2, this.y + 13, 3, 4, '#3b6fe0');
    }
    const n = this.state === 'play' ? this.nearNPC() : null;
    if (n) { const bx = n.cx, by = n.y - 14 + Math.sin(this.t / 6) * 2; txt('▲', bx, by, '#ffd23f', 'center'); }
  }
}

/* ====================== OBJETOS ====================== */
class Coin extends Ent {
  constructor(x, y) { super(x + 3, y + 3, 10, 12); }
  update() { this.t++; if (overlap(this, P) && P.state === 'play') { this.dead = true; G.addCoin(); Snd.sfx('coin'); W.burst(this.cx, this.cy, '#ffd23f', 5, 1.5); } }
  draw() { drawSpr('coin', Math.floor((W.t + this.x) / 8) % 4, this.x - 3, this.y - 6); }
}
class PopCoin extends Ent {
  constructor(x, y) { super(x, y, 16, 16); this.vy = -5; }
  update() { this.t++; this.y += this.vy; this.vy += 0.35; if (this.t > 28) { this.dead = true; W.text(this.x + 8, this.y, '200', '#ffd23f'); } }
  draw() { drawSpr('coin', Math.floor(this.t / 3) % 4, this.x, this.y - 3); }
}
const PU_SPR = { taco: 'taco', chancla: 'chancla', agua: 'agua', kazoo: 'kazoo_item', concha: 'concha' };
class PowerUp extends Ent {
  constructor(x, y, kind) { super(x + 1, y, 14, 14); this.kind = kind; this.rise = 16; this.vx = 0; this.usePlats = true; }
  update() {
    this.t++;
    if (this.rise > 0) { this.rise--; this.y--; if (this.rise === 0 && (this.kind === 'taco' || this.kind === 'concha' || this.kind === 'kazoo')) this.vx = 1; return; }
    if (this.kind === 'taco' || this.kind === 'concha' || this.kind === 'kazoo') {
      this.keepVx = true;
      this.physics(0.35);
      if (this.hitWall) this.vx = -this.vx;
      if (this.kind === 'kazoo' && this.onGround) this.vy = -5;
    }
    if (overlap(this, P) && P.state === 'play') { this.dead = true; G.collect(this.kind, this); }
  }
  draw() {
    const bob = (this.kind === 'chancla' || this.kind === 'agua') && this.rise === 0 ? Math.sin(this.t / 8) * 1.5 : 0;
    drawSpr(PU_SPR[this.kind], 0, this.x - 1, this.y - 1 + bob);
  }
}
class Foto extends Ent {
  constructor(x, y, id) { super(x + 1, y + 1, 14, 14); this.id = id; this.got = G.prof.recuerdos.includes(id); }
  update() {
    this.t++;
    if (this.t % 10 === 0) W.part(this.x + rnd(0, 14), this.y + rnd(0, 14), 0, -0.4, '#fff8c0', 25, 1, 0);
    if (overlap(this, P) && P.state === 'play') { this.dead = true; G.gotFoto(this.id); }
  }
  draw() { ctx.globalAlpha = this.got ? 0.45 : 1; drawSpr('foto', 0, this.x - 1, this.y - 1 + Math.sin(this.t / 10) * 2); ctx.globalAlpha = 1; }
}
class MamaItem extends Ent {
  constructor(x, y, id) { super(x + 1, y + 1, 14, 14); this.id = id; this.got = G.prof.mama.includes(id); }
  update() {
    this.t++;
    if (this.t % 6 === 0) W.part(this.x + rnd(0, 14), this.y + rnd(0, 14), 0, -0.5, pick(['#ff7ab0', '#ffd23f']), 25, 1, 0);
    if (overlap(this, P) && P.state === 'play') { this.dead = true; G.gotMama(this.id); }
  }
  draw() { ctx.globalAlpha = this.got ? 0.45 : 1; drawSpr(MAMA_ITEMS[this.id].spr, 0, this.x - 1, this.y - 1 + Math.sin(this.t / 9) * 2); ctx.globalAlpha = 1; }
}
class Sign extends Ent {
  constructor(x, key) { super(x, 0, 16, 16); this.key = key; this.placed = false; }
  update() {
    if (!this.placed) { this.y = W.groundY(this.x + 8) - 16; this.placed = true; }
    if (Math.abs(P.cx - this.cx) < 20 && Math.abs(P.y + P.h - (this.y + 16)) < 24) W.signText = SIGNS[this.key];
  }
  draw() {
    if (!this.placed) return;
    R(this.x + 7, this.y + 6, 2, 10, '#5a3a1a');
    R(this.x, this.y - 2, 16, 10, '#000'); R(this.x + 1, this.y - 1, 14, 8, '#c98f4f'); R(this.x + 3, this.y + 1, 10, 1, '#5a3a1a'); R(this.x + 3, this.y + 4, 7, 1, '#5a3a1a');
  }
}
class NPC extends Ent {
  constructor(x, who, talk, dir) {
    super(x, 0, 12, 20); this.who = who; this.key = talk; this.dir = dir; this.placed = false; this.duo = who === 'coqui';
  }
  update() {
    this.t++;
    if (!this.placed) { const s = SPR[this.who === 'asistente' ? 'tele' : this.who]; this.sh = s.h; this.y = W.groundY(this.x + 6) - s.h; this.h = s.h; this.placed = true; }
    if (!this.talking) this.face = P.cx < this.cx ? -1 : 1;
  }
  talk() {
    const lines = NPC_TALK[this.key];
    this.talking = true;
    G.dialog(lines, () => { this.talking = false; });
  }
  draw() {
    if (!this.placed) return;
    const name = this.who === 'asistente' ? 'tele' : this.who;
    const s = SPR[name];
    const f = (this.t >> 5) % 8 === 0 ? 8 : 0;
    if (this.who === 'asistente') { drawSpr('tele', 0, this.x - 2, this.y + Math.sin(this.t / 10) * 2); return; }
    drawSpr(name, s.r.length > 8 ? f : 0, this.x - 2, this.y, this.face < 0);
    if (this.duo) drawSpr('ghenghis', s.r.length > 8 ? f : 0, this.x + 14, W.groundY(this.x + 20) - SPR.ghenghis.h, this.face < 0);
  }
}
class Checkpoint extends Ent {
  constructor(x) { super(x, 0, 16, 32); this.on = false; this.placed = false; }
  update() {
    if (!this.placed) { this.y = W.groundY(this.x + 8) - 32; this.placed = true; }
    this.t++;
    if (!this.on && overlap(this, P)) { this.on = true; G.checkpoint = { x: this.x, y: this.y }; Snd.sfx('checkpoint'); W.burst(this.cx, this.y, '#ffd23f', 14); W.text(this.cx, this.y - 8, 'PUNTO DE CONTROL', '#ffd23f'); }
  }
  draw() {
    if (!this.placed) return;
    R(this.x + 7, this.y, 2, 32, '#ddd');
    const c = this.on ? '#ffd23f' : '#777';
    const wv = this.on ? Math.sin(this.t / 6) * 1.5 : 0;
    R(this.x + 9, this.y + 1 + wv, 10, 7, c); if (this.on) txt('K', this.x + 10, this.y + wv, '#7a2e0e', 'left', 8, null);
  }
}
class Goal extends Ent {
  constructor(x) { super(x + 6, 0, 4, 160); this.placed = false; this.flagY = 0; this.done = false; }
  update() {
    if (!this.placed) { const g = W.groundY(this.x + 2); this.y = g - 150; this.h = 150; this.gy = g; this.placed = true; }
    if (this.done) { if (this.flagY < 130) this.flagY += 2.5; return; }
    if (P.state === 'play' && P.x + P.w > this.x && P.x < this.x + 4 && P.y + P.h > this.y) {
      this.done = true; P.state = 'goal'; P.st = 0; P.goalPhase = 0; P.vx = 0; P.vy = 0; P.x = this.x - P.w + 2;
      const pts = Math.max(100, Math.round((1 - (P.y - this.y) / 150) * 50) * 100);
      G.addScore(pts, this.x, P.y);
      Snd.stop(); Snd.sfx('flag'); G.later(42, () => Snd.sfx('clear'));
    }
  }
  draw() {
    if (!this.placed) return;
    R(this.x, this.y, 3, 150, '#e8e8e8'); R(this.x + 1, this.y, 1, 150, '#aaa');
    R(this.x - 2, this.y - 5, 7, 7, '#ffd23f');
    R(this.x - 18, this.y + 4 + this.flagY, 18, 13, '#000'); R(this.x - 17, this.y + 5 + this.flagY, 16, 11, '#f0b429');
    txt('K', this.x - 13, this.y + 7 + this.flagY, '#7a2e0e', 'left', 8, null);
    // casita de salida
    const hx = this.x + 80, gy = this.gy;
    R(hx, gy - 56, 64, 56, '#000'); R(hx + 2, gy - 54, 60, 54, '#c98f4f');
    for (let k = 0; k < 4; k++) R(hx + 2, gy - 54 + k * 14, 60, 1, '#8a5a24');
    R(hx - 4, gy - 64, 72, 10, '#000'); R(hx - 2, gy - 62, 68, 6, '#c0563a');
    R(hx + 22, gy - 30, 20, 30, '#000'); R(hx + 24, gy - 28, 16, 28, '#3a2210');
    txt('SALIDA', hx + 32, gy - 48, '#fff', 'center');
  }
}
class MPlat {
  constructor(d) {
    this.x0 = d.x; this.y0 = d.y; this.x = d.x; this.y = d.y; this.w = d.len * TS; this.h = 8;
    this.dx = d.dx || 0; this.dy = d.dy || 0; this.range = d.range || 32; this.speed = d.speed || 0.6; this.t = 0; this.mx = 0; this.my = 0;
  }
  update() {
    this.t++;
    const ph = Math.sin(this.t * this.speed / this.range * 1.6);
    const nx = this.x0 + this.dx * ph * this.range, ny = this.y0 + this.dy * ph * this.range;
    this.mx = nx - this.x; this.my = ny - this.y; this.x = nx; this.y = ny;
  }
  draw() {
    const th = THEMES[W.theme];
    R(this.x, this.y, this.w, this.h, '#000'); R(this.x + 1, this.y + 1, this.w - 2, this.h - 3, th.top);
    R(this.x + 1, this.y + 1, this.w - 2, 1, '#ffffff66');
    for (let k = 4; k < this.w; k += 12) R(this.x + k, this.y + 3, 2, 2, th.top2);
  }
}
class Ring extends Ent {
  constructor(x, y) { super(x, y, 1, 1); this.r = 4; this.active = true; }
  update() { this.r += 6; this.t++; if (this.t > 16) this.dead = true; }
  draw() {
    ctx.strokeStyle = `rgba(255,210,63,${1 - this.t / 16})`; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, 7); ctx.stroke();
    if (this.t < 10) txt('♪', this.x + this.r * 0.7, this.y - this.r * 0.7, '#ffd23f', 'center');
  }
}

/* ====================== PROYECTILES ====================== */
class ChanclaShot extends Ent {
  constructor(x, y, dir, big) {
    super(x - 4, y, 8, 6); this.vx = dir * (big ? 4 : 3.6); this.vy = big ? -2.5 : 0; this.mine = true; this.big = big; this.face = dir;
  }
  update() {
    this.t++;
    this.vy = Math.min(this.vy + 0.35, 6);
    this.x += this.vx;
    if (W.solidPx(this.cx + sign(this.vx) * 4, this.cy)) { this.pop(); return; }
    this.y += this.vy;
    if (this.vy > 0 && W.solidPx(this.cx, this.y + this.h)) { this.y = Math.floor((this.y + this.h) / TS) * TS - this.h; this.vy = this.big ? -4.5 : -3.4; }
    if (this.t > 140 || this.x < W.camX - 20 || this.x > W.camX + VW + 20 || this.y > 14 * TS) { this.dead = true; return; }
    for (const e of W.ents) if (e.enemy && !e.dead && !e.corpse && overlap(this, e)) { e.kill(true); G.addScore(200, e.x, e.y); Snd.sfx('chancla'); this.pop(); return; }
    const B = W.boss;
    if (B && !B.dead && overlap(this, B.hitbox())) { B.hit('chancla'); Snd.sfx('chancla'); this.pop(); }
  }
  pop() { this.dead = true; W.burst(this.cx, this.cy, '#ff7ab0', 6, 1.5); }
  draw() {
    ctx.save(); ctx.translate(Math.round(this.cx), Math.round(this.cy)); ctx.rotate(this.t * 0.5 * sign(this.vx));
    const c = SPR.chancla_proj.r[0]; ctx.drawImage(c, -4, -3); ctx.restore();
  }
}
class Shot extends Ent {
  constructor(x, y, vx, vy, spr, o = {}) { super(x, y, o.w || 6, o.h || 5); this.vx = vx; this.vy = vy; this.spr = spr; this.g = o.g || 0; this.life = o.life || 240; this.ghost = o.ghost; }
  update() {
    this.t++; this.vy += this.g; this.x += this.vx; this.y += this.vy;
    if (!this.ghost && W.solidPx(this.cx, this.cy)) { this.dead = true; W.burst(this.cx, this.cy, '#fff', 4, 1); }
    if (this.t > this.life || this.y > 15 * TS) this.dead = true;
  }
  draw() { drawSpr(this.spr, 0, this.x, this.y, this.vx < 0); }
}

/* ====================== ENEMIGOS ====================== */
class Enemy extends Ent {
  constructor(x, y, w, h, spr) { super(x, y, w, h); this.enemy = true; this.spr = spr; this.stompable = true; this.stun = 0; this.speed = 0.5; this.dir = -1; this.keepVx = true; }
  get rate() { return 1 + (G.run ? G.run.ritmo / 250 : 0); }
  walk(edges) {
    this.vx = this.dir * this.speed * this.rate;
    if (edges && this.onGround) {
      const ax = this.dir > 0 ? this.x + this.w + 1 : this.x - 1;
      const t = W.tile(Math.floor(ax / TS), Math.floor((this.y + this.h + 2) / TS));
      if (!SOLID[t] && t !== 9) this.dir = -this.dir;
    }
    this.physics(0.4);
    if (this.hitWall) this.dir = -this.dir;
  }
  update() {
    this.t++;
    if (this.stun > 0) { this.stun--; this.vx = 0; this.physics(0.4); return; }
    this.ai();
  }
  ai() {}
  stomped() { this.kill(false); }
  kill(fling) {
    this.dead = true;
    const c = new Corpse(this, fling);
    W.ents.push(c);
  }
  draw() {
    const sx = this.stun > 0 ? rnd(-1, 1) : 0;
    const s = SPR[this.spr];
    drawSpr(this.spr, Math.floor(this.t / 10), this.x + (this.w - s.w) / 2 + sx, this.y + this.h - s.h + (this.yoff || 0), this.dir > 0);
    if (this.stun > 0 && (this.t >> 3) % 2) txt('♪', this.cx, this.y - 10, '#ffd23f', 'center');
  }
}
class Corpse extends Ent {
  constructor(e, fling) {
    super(e.x, e.y, e.w, e.h); this.spr = e.spr; this.fling = fling; this.dir = e.dir; this.corpse = true; this.active = true;
    this.flat = !fling && (e.spr === 'panuelo');
    if (fling) { this.vy = -4.5; this.vx = rnd(-1, 1); }
    W.burst(e.cx, e.cy, '#ffffff', 6, 1.5);
  }
  update() {
    this.t++;
    if (this.fling) { this.vy += 0.3; this.x += this.vx; this.y += this.vy; if (this.y > 15 * TS) this.dead = true; }
    else if (this.t > 30) this.dead = true;
  }
  draw() {
    const s = SPR[this.spr];
    if (this.flat) { drawSpr('panuelo_flat', 0, this.x + (this.w - 16) / 2, this.y + this.h - 16); return; }
    if (!this.fling) { ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1, 0.4); drawSpr(this.spr, 0, -s.w / 2, -s.h, this.dir > 0); ctx.restore(); return; }
    ctx.save(); ctx.translate(this.cx, this.cy); ctx.scale(1, -1); drawSpr(this.spr, 0, -s.w / 2, -s.h / 2, this.dir > 0); ctx.restore();
  }
}
class Panuelo extends Enemy {
  constructor(x, y) { super(x + 2, y, 12, 13, 'panuelo'); this.speed = 0.5; this.yoff = 1; }
  ai() { this.walk(false); }
}
class Calcetin extends Enemy {
  constructor(x, y) { super(x + 4, y, 9, 14, 'calcetin'); this.speed = 0.55; this.hop = irnd(40, 80); }
  ai() {
    if (--this.hop <= 0 && this.onGround) { this.vy = -5; this.hop = 80; this.dir = P.cx < this.cx ? -1 : 1; }
    this.walk(false);
  }
  draw() {
    const s = SPR.calcetin; const f = this.onGround ? 0 : 1;
    drawSpr('calcetin', f, this.x - 4 + (this.stun > 0 ? rnd(-1, 1) : 0), this.y + this.h - s.h, this.dir > 0);
    if (this.stun > 0 && (this.t >> 3) % 2) txt('♪', this.cx, this.y - 10, '#ffd23f', 'center');
  }
}
class Rollo extends Enemy {
  constructor(x, y) { super(x + 1, y, 14, 14, 'rollo'); this.speed = 1.3; this.started = false; }
  ai() {
    if (!this.started) { this.started = true; this.dir = P.cx < this.cx ? -1 : 1; }
    this.walk(false);
  }
  draw() {
    ctx.save(); ctx.translate(Math.round(this.cx), Math.round(this.cy)); ctx.rotate(this.x / 7 * (this.stun > 0 ? 0 : 1));
    ctx.drawImage(SPR.rollo.r[0], -8, -8); ctx.restore();
  }
}
class Crema extends Enemy {
  constructor(x, y) { super(x + 3, y, 10, 15, 'crema'); this.cd = irnd(60, 120); }
  ai() {
    this.vx = 0; this.physics(0.4);
    this.dir = P.cx < this.cx ? -1 : 1;
    if (Math.abs(P.cx - this.cx) < 220 && --this.cd <= 0) {
      this.cd = Math.round(150 / this.rate);
      const dx = P.cx - this.cx;
      W.shots.push(new Shot(this.cx - 3, this.y - 2, clamp(dx / 55, -2.6, 2.6), -4.6, 'crema_proj', { g: 0.17 }));
      Snd.sfx('throw');
    }
  }
  draw() { drawSpr('crema', this.cd < 20 ? 1 : 0, this.x - 3 + (this.stun ? rnd(-1, 1) : 0), this.y + this.h - 16, this.dir > 0); }
}
class Rata extends Enemy {
  constructor(x, y) { super(x + 1, y, 14, 8, 'rata'); this.speed = 1.05; this.yoff = 4; }
  ai() { this.walk(true); }
}
class Testigo extends Enemy {
  constructor(x, y) { super(x + 3, y, 10, 24, 'testigo'); this.speed = 0.35; this.cd = 60; this.pause = 0; }
  ai() {
    const d = P.cx - this.cx;
    if (this.pause > 0) { this.pause--; this.vx = 0; this.physics(0.4); if (this.pause === 20) { W.shots.push(new Shot(this.cx, this.y + 8, sign(d) * 2.2, 0, 'folleto', { ghost: true, life: 160 })); } return; }
    if (Math.abs(d) < 150 && --this.cd <= 0) {
      this.dir = sign(d) || -1; this.cd = Math.round(130 / this.rate); this.pause = 40;
      W.text(this.cx, this.y - 12, pick(['¿HA ESCUCHADO LA PALABRA?', '¡TOME UN FOLLETO!', '¿TIENE 5 MINUTOS?', 'DIOS LO ESTÁ VIENDO, CÉSAR']), '#9fd0ff');
    }
    this.walk(true);
  }
  draw() {
    const f = this.pause > 0 ? 7 : 1 + Math.floor(this.t / 8) % 4;
    drawSpr('testigo', f, this.x - 3 + (this.stun ? rnd(-1, 1) : 0), this.y + this.h - SPR.testigo.h, this.dir < 0);
    if (this.stun > 0 && (this.t >> 3) % 2) txt('♪', this.cx, this.y - 10, '#ffd23f', 'center');
  }
}
class Popup extends Enemy {
  constructor(x, y) { super(x, y, 30, 20, 'popup'); this.hy = y; this.ph = Math.random() * 6; this.label = pick(['SOLTERAS', 'GANASTE', '¡CLIC!', 'VIRUS', 'XXX', 'CRIPTO', '18+']); }
  ai() {
    this.vx = sign(P.cx - this.cx) * 0.35 * this.rate; this.x += this.vx;
    this.y = this.hy + Math.sin(this.t / 25 + this.ph) * 14; this.dir = -1;
  }
  physics() {}
  draw() {
    const x = Math.round(this.x + (this.stun ? rnd(-1, 1) : 0)), y = Math.round(this.y);
    R(x - 1, y - 1, 32, 22, '#000'); R(x, y, 30, 20, '#f4f4f4'); R(x, y, 30, 6, '#2a5ad0'); R(x + 24, y + 1, 5, 4, '#e23b3b');
    R(x + 25, y + 2, 1, 1, '#fff'); R(x + 27, y + 2, 1, 1, '#fff'); R(x + 26, y + 3, 1, 1, '#fff');
    ctx.font = '5px ' + FONT; ctx.fillStyle = '#e23b3b'; ctx.textAlign = 'center'; ctx.fillText(this.label, x + 15, y + 9);
    R(x + 4, y + 16, 22, 2, (this.t >> 3) % 2 ? '#ff7ab0' : '#ffd23f');
    if (this.stun > 0 && (this.t >> 3) % 2) txt('♪', this.cx, this.y - 10, '#ffd23f', 'center');
  }
}
class Glitch extends Enemy {
  constructor(x, y) { super(x + 1, y, 14, 8, 'glitch'); this.hx = x; this.hy = y; this.mode = 0; }
  ai() {
    if (this.mode === 0) { this.y = this.hy + Math.sin(this.t / 15) * 3; if (Math.abs(P.cx - this.cx) < 90) { this.mode = 1; this.dir = sign(P.cx - this.cx) || 1; this.st = 0; } }
    else { this.st++; this.x += this.dir * 1.4 * this.rate; this.y = this.hy + Math.sin(this.st / 22) * 50; if (this.st > 140) { this.mode = 0; this.hy = this.y; } }
    if (Math.random() < 0.02) Snd.sfx('glitch');
  }
  physics() {}
  draw() {
    if (Math.random() < 0.1) { R(this.x - 4, this.y + rnd(0, 8), 22, 1, '#ff6ad5'); }
    drawSpr('glitch', Math.floor(this.t / 6), this.x - 1 + (this.stun ? rnd(-1, 1) : 0), this.y - 4, this.dir > 0);
  }
}
class Gota extends Enemy {
  constructor(x) { super(x + 4, 0, 8, 8, null); this.stompable = false; this.harmless = true; this.cd = irnd(30, 100); }
  ai() {
    if (--this.cd <= 0) { this.cd = 110; W.shots.push(new Shot(this.x, 4, 0, 0.5, 'crema_proj', { g: 0.2, life: 200 })); }
  }
  kill() {}
  draw() { R(this.x - 2, 0, 12, 4, '#3a4a3a'); R(this.x + 1, 4, 6, this.cd < 25 ? 3 : 1, '#c9d48a'); }
}
class Salto extends Enemy {
  constructor(x) { super(x + 2, 13 * TS, 12, 13, 'panuelo'); this.base = 13 * TS; this.cd = irnd(20, 90); }
  ai() {
    if (this.y >= this.base && this.vy >= 0) { this.y = this.base; this.vy = 0; if (--this.cd <= 0) { this.vy = -8.2; this.cd = 100; } }
    else { this.vy += 0.25; this.y += this.vy; }
  }
  physics() {}
  draw() { if (this.y < this.base - 2) drawSpr('panuelo', Math.floor(this.t / 6), this.x - 2, this.y - 2, this.vy > 0); }
}
class Piston extends Enemy {
  constructor(x) { super(x, 2 * TS, 32, 14, null); this.stompable = false; this.phase = 0; this.st = irnd(0, 60); this.home = 2 * TS; }
  kill() {}
  ai() {
    const gy = W.groundY(this.x + 16) - this.h;
    this.st++;
    if (this.phase === 0) { if (this.st > 70) { this.phase = 1; this.st = 0; } }
    else if (this.phase === 1) { if (this.st > 25) { this.phase = 2; this.st = 0; } }
    else if (this.phase === 2) { this.y += 7; if (this.y >= gy) { this.y = gy; this.phase = 3; this.st = 0; W.shake(6); W.burst(this.cx, this.y + this.h, '#aaa', 8, 2); } }
    else if (this.phase === 3) { if (this.st > 35) { this.phase = 4; } }
    else { this.y -= 1.2; if (this.y <= this.home) { this.y = this.home; this.phase = 0; this.st = 0; } }
  }
  draw() {
    const sx = this.phase === 1 ? rnd(-1, 1) : 0;
    R(this.x + 12 + sx, 0, 8, this.y, '#5a6272'); R(this.x + 13 + sx, 0, 2, this.y, '#8a93a3');
    R(this.x + sx, this.y, 32, this.h, '#000'); R(this.x + 1 + sx, this.y + 1, 30, this.h - 2, '#d9a12b');
    for (let k = 2; k < 30; k += 6) R(this.x + k + sx, this.y + this.h - 4, 3, 3, '#000');
  }
}
function makeEnemy(t, x, row) {
  const yOf = (h) => (row !== null && row !== undefined ? row * TS : W.groundY(x + 8)) - h;
  switch (t) {
    case 'panuelo': return new Panuelo(x, yOf(13));
    case 'calcetin': return new Calcetin(x, yOf(14));
    case 'rollo': return new Rollo(x, yOf(14));
    case 'crema': return new Crema(x, yOf(15));
    case 'rata': return new Rata(x, yOf(8));
    case 'testigo': return new Testigo(x, yOf(24));
    case 'popup': return new Popup(x, row * TS);
    case 'glitch': return new Glitch(x, row * TS);
    case 'gota': return new Gota(x);
    case 'salto': return new Salto(x);
    case 'piston': return new Piston(x);
  }
  return null;
}

/* ====================== JEFES ====================== */
class Boss extends Ent {
  constructor(x, y, w, h, name, hp) { super(x, y, w, h); this.name = name; this.hp = hp; this.maxhp = hp; this.inv = 0; this.stun = 0; this.dir = -1; this.keepVx = true; }
  hitbox() { return this; }
  canStomp() { return this.inv === 0; }
  hit(kind) {
    if (this.inv > 0 || this.dead) return;
    this.hp -= kind === 'chancla' ? 0.5 : 1;
    this.inv = 50; Snd.sfx('bosshit'); W.shake(10); W.burst(this.cx, this.y + 6, '#fff', 12, 3);
    this.onHit && this.onHit(kind);
    if (this.hp <= 0) this.defeat();
  }
  defeat() {
    this.dead = true; Snd.stop(); Snd.sfx('boom'); W.shake(40);
    const w0 = W; for (let i = 0; i < 4; i++) G.later(i * 12 + 1, () => { if (W !== w0) return; W.burst(this.cx + rnd(-20, 20), this.cy + rnd(-20, 20), pick(['#ffd23f', '#ff7ab0', '#fff']), 20, 4); Snd.sfx('boom'); });
    G.bossDefeated(this);
  }
  tick() { this.t++; if (this.inv > 0) this.inv--; if (this.stun > 0) { this.stun--; return false; } return true; }
  blink() { return this.inv > 0 && (this.t >> 2) % 2; }
}
// ---- DON PANCHO ----
class Pancho extends Boss {
  constructor(ax) { super(ax + 17 * TS, 9 * TS, 24, 40, 'DON PANCHO, EL DE LA TIENDITA', 6); this.ax = ax; this.st = 0; this.mode = 'walk'; }
  update() {
    if (!this.tick()) { this.vx = 0; this.physics(0.5); return; }
    this.st++;
    const enr = this.hp <= 3 ? 1.5 : 1;
    if (this.mode === 'walk') {
      this.dir = P.cx < this.cx ? -1 : 1;
      this.vx = this.dir * 0.8 * enr;
      if (this.st > 110 / enr) { this.mode = 'throw'; this.st = 0; }
      if (this.hp <= 3 && this.onGround && Math.random() < 0.012) this.vy = -7;
    } else if (this.mode === 'throw') {
      this.vx = 0;
      if (this.st === 20 || (enr > 1 && this.st === 40)) {
        if (Math.random() < 0.5) { const r = new Rollo(this.cx - 8, this.y + this.h - 14); r.active = true; r.started = true; r.dir = this.dir; r.speed = 1.6; W.ents.push(r); }
        else W.shots.push(new Shot(this.cx, this.y, clamp((P.cx - this.cx) / 50, -3, 3), -5, 'crema_proj', { g: 0.18 }));
        Snd.sfx('throw');
        W.text(this.cx, this.y - 10, pick(['¡ES MI MEJOR CLIENTE!', '¡LLÉVATE UN 2x1!', '¡PAGUÉ MI LOBO CON ESO!', '¡SIN PAPEL NO HAY PARAÍSO!']), '#ffd23f');
      }
      if (this.st > 60) { this.mode = 'walk'; this.st = 0; }
    }
    this.physics(0.5);
  }
  draw() {
    if (this.blink()) return;
    const f = this.mode === 'throw' ? 7 : (Math.abs(this.vx) > 0 ? 1 + Math.floor(this.t / 8) % 4 : 0);
    drawSpr('pancho', f, this.x - 4, this.y + this.h - SPR.pancho.h * 2, this.dir < 0, 2);
  }
}
// ---- EL TAPONAZO ----
class Taponazo extends Boss {
  constructor(ax) { super(ax + 16 * TS, 6 * TS, 36, 34, 'EL TAPONAZO', 5); this.st = 0; this.hops = 0; }
  update() {
    if (!this.tick()) { this.vx = 0; this.physics(0.45); return; }
    this.st++;
    const wasAir = !this.onGround;
    if (this.onGround) {
      this.vx = 0;
      if (this.st > (this.hp < 3 ? 35 : 55)) {
        this.dir = P.cx < this.cx ? -1 : 1; this.vx = this.dir * rnd(1.5, 2.6); this.vy = -rnd(6, 8); this.st = 0; this.hops++;
      }
    }
    this.physics(0.35);
    if (wasAir && this.onGround) {
      W.shake(12); Snd.sfx('stomp'); W.burst(this.cx, this.y + this.h, '#c3cbe0', 10, 2);
      if (this.hops % 2 === 0) { const p = new Panuelo(this.cx - 8, this.y + this.h - 13); p.active = true; p.dir = P.cx < this.cx ? -1 : 1; W.ents.push(p); }
    }
    if (this.hitWall) this.vx = -this.vx;
  }
  draw() {
    if (this.blink()) return;
    const sq = this.onGround && this.st < 8 ? 0.85 : 1;
    ctx.save(); ctx.translate(this.cx, this.y + this.h); ctx.scale(1 / sq, sq);
    drawSpr('panuelo', Math.floor(this.t / 8), -24, -44, this.dir > 0, 3);
    ctx.restore();
  }
}
// ---- POP-UP SUPREMO ----
class PopBoss extends Boss {
  constructor(ax) { super(ax + 12 * TS, 3 * TS, 72, 44, 'POP-UP SUPREMO', 5); this.ax = ax; this.st = 0; this.mode = 'float'; this.hx = this.x; }
  hitbox() { return { x: this.x, y: this.y, w: this.w, h: this.h }; }
  canStomp() { return this.inv === 0; }
  update() {
    if (!this.tick()) return;
    this.st++;
    const minX = this.ax * TS + 24, maxX = this.ax * TS + 23 * TS - this.w - 8;
    if (this.mode === 'float') {
      this.x += (clamp(P.cx - this.w / 2, minX, maxX) - this.x) * 0.012;
      this.y = 2.5 * TS + Math.sin(this.t / 30) * 10;
      if (this.st % 70 === 0) { const p = new Popup(this.cx - 15, this.y + 20); p.active = true; W.ents.push(p); }
      if (this.st % 50 === 25) { const a = Math.atan2(P.cy - this.cy, P.cx - this.cx); W.shots.push(new Shot(this.cx, this.cy, Math.cos(a) * 2, Math.sin(a) * 2, 'cookie', { w: 8, h: 7, ghost: true })); Snd.sfx('throw'); }
      if (this.st > 260) { this.mode = 'dive'; this.st = 0; W.text(this.cx, this.y - 10, '¡CIERRA EL ANUNCIO!', '#ffd23f'); }
    } else if (this.mode === 'dive') {
      this.y += (8 * TS - this.y) * 0.08;
      if (this.st > 150) { this.mode = 'float'; this.st = 0; }
    }
  }
  onHit() { this.mode = 'float'; this.st = 0; for (const e of W.ents) if (e instanceof Popup) e.kill(true); }
  draw() {
    if (this.blink()) return;
    const x = Math.round(this.x), y = Math.round(this.y), w = this.w, h = this.h;
    R(x - 2, y - 2, w + 4, h + 4, '#000'); R(x, y, w, h, '#fff'); R(x, y, w, 10, '#2a5ad0');
    R(x + w - 10, y + 1, 9, 8, '#e23b3b'); txt('X', x + w - 9, y + 1, '#fff', 'left', 8, null);
    txt('¡SOLTERAS', x + w / 2, y + 14, '#e23b3b', 'center', 8, null);
    txt('EN TU ZONA!', x + w / 2, y + 24, '#e23b3b', 'center', 8, null);
    R(x + 8, y + 35, w - 16, 6, (this.t >> 3) % 2 ? '#ff7ab0' : '#ffd23f'); txt('CLIC', x + w / 2, y + 34, '#000', 'center', 8, null);
    if (this.mode === 'dive' && (this.t >> 3) % 2) txt('▼', x + w - 6, y - 12, '#ffd23f', 'center');
  }
}
// ---- FIRULAIS RADIOACTIVO ----
class Firulais extends Boss {
  constructor(ax) { super(ax + 17 * TS, 9 * TS, 40, 26, 'FIRULAIS RADIOACTIVO', 4); this.ax = ax; this.mode = 'idle'; this.st = 0; }
  update() {
    if (!this.tick()) { this.vx = 0; this.physics(0.5); return; }
    this.st++;
    if (this.mode === 'idle') {
      this.vx = 0; this.dir = P.cx < this.cx ? -1 : 1;
      if (this.st === 30) { Snd.sfx('bark'); W.text(this.cx, this.y - 12, '¡GUAU!', '#fff'); }
      if (this.st > 50) { this.mode = 'charge'; this.st = 0; if (Math.random() < 0.35) this.vy = -6; }
    } else if (this.mode === 'charge') {
      this.vx = this.dir * (this.hp <= 2 ? 4.4 : 3.6);
      if (this.hitWall) { this.mode = 'dazed'; this.st = 0; W.shake(14); Snd.sfx('boom'); this.vx = 0; }
    } else if (this.mode === 'dazed') {
      this.vx = 0;
      if (this.st > 100) { this.mode = 'idle'; this.st = 0; }
    }
    this.physics(0.5);
    if (this.hitWall && this.mode === 'charge') { this.mode = 'dazed'; this.st = 0; W.shake(14); }
  }
  canStomp() { return this.inv === 0; }
  onHit() { this.mode = 'idle'; this.st = 0; this.vx = 0; }
  draw() {
    if (this.blink()) return;
    ctx.save();
    ctx.filter = 'hue-rotate(70deg) saturate(1.6) brightness(1.1)';
    drawSpr('perro', Math.floor(this.t / (this.mode === 'charge' ? 3 : 10)), this.x - 4, this.y + this.h - 32, this.dir > 0, 2);
    ctx.restore();
    if (this.mode === 'dazed') for (let i = 0; i < 3; i++) txt('★', this.cx + Math.cos(this.t / 8 + i * 2) * 14, this.y - 8 + Math.sin(this.t / 8 + i * 2) * 3, '#ffd23f', 'center');
  }
}
// ---- CÉSAR (ruta 1) ----
class CesarBoss extends Boss {
  constructor() { super(17 * TS, 8 * TS, 26, 42, 'CÉSAR, EL QUE NUNCA CESA', 9); this.mode = 'slide'; this.st = 0; this.phase = 1; this.hand = null; }
  hitbox() { return this; }
  canStomp() { return this.inv === 0 && this.phase !== 2; }
  hit(kind) { if (this.phase === 2) return; super.hit(kind); }
  update() {
    if (!this.tick()) { this.vx = 0; this.physics(0.5); return; }
    this.st++;
    if (this.phase === 1) {
      if (this.mode === 'slide') {
        this.vx = this.dir * 1.6;
        if (this.hitWall) this.dir = -this.dir;
        if (this.st > 90) { this.mode = 'throw'; this.st = 0; }
      } else {
        this.vx = 0;
        if (this.st % 18 === 0 && this.st <= 54) { W.shots.push(new Shot(this.cx, this.y + 8, clamp((P.cx - this.cx) / 45, -3.4, 3.4) + rnd(-0.5, 0.5), -5, 'crema_proj', { g: 0.2 })); Snd.sfx('throw'); }
        if (this.st > 70) { this.mode = 'slide'; this.st = 0; this.dir = P.cx < this.cx ? -1 : 1; W.text(this.cx, this.y - 10, pick(CESAR_TAUNTS), '#ff7ab0'); }
      }
    } else if (this.phase === 2) {
      this.vx = 0; this.x += ((18 * TS) - this.x) * 0.05;
      if (!this.hand || this.hand.dead) { this.hand = new Manuela(); W.ents.push(this.hand); }
    } else if (this.phase === 3) {
      if (this.mode === 'dash') {
        this.vx = this.dir * 3.4; if (this.hitWall) { this.dir = -this.dir; this.mode = 'wave'; this.st = 0; }
      } else {
        this.vx = 0;
        if (this.st === 20 || this.st === 50) { W.ents.push(new Wave(this.cx, 12 * TS, -1)); W.ents.push(new Wave(this.cx, 12 * TS, 1)); W.shake(10); Snd.sfx('quake'); }
        if (this.onGround && this.st === 70) this.vy = -7;
        if (this.st > 100) { this.mode = 'dash'; this.st = 0; this.dir = P.cx < this.cx ? -1 : 1; }
      }
      if (this.t % 4 === 0) W.part(this.cx + rnd(-12, 12), this.y + rnd(0, 40), 0, -1, pick(['#ff7ab0', '#ffd23f']), 20, 2, 0);
    }
    this.physics(0.5);
    if (G.run && this.t % 50 === 0) Snd.sfx('squeak');
  }
  onHit() {
    if (this.phase === 1 && this.hp <= 6) { this.phase = 2; this.mode = 'hide'; G.dialogQuick(FIGHT_LINES.phase2); }
  }
  manuelaHit() {
    if (this.inv > 0) return;
    this.hp -= 1; this.inv = 40; Snd.sfx('bosshit'); W.shake(10);
    if (this.hp <= 3) { this.phase = 3; this.mode = 'wave'; this.st = 0; if (this.hand) this.hand.leave = true; G.dialogQuick(FIGHT_LINES.phase3); }
  }
  draw() {
    if (this.blink()) return;
    if (this.phase === 3) { ctx.fillStyle = '#ff7ab033'; ctx.beginPath(); ctx.arc(this.cx, this.cy, 30 + Math.sin(this.t / 4) * 3, 0, 7); ctx.fill(); }
    if (this.phase === 2) { ctx.strokeStyle = '#9fd0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(this.cx, this.cy, 32, 0, 7); ctx.stroke(); }
    const f = this.mode === 'throw' ? 7 : (Math.abs(this.vx) > 0 ? 1 + Math.floor(this.t / 5) % 4 : (this.t >> 3) % 2 ? 8 : 0);
    drawSpr('cesar', f, this.x - 3, this.y + this.h - SPR.cesar.h * 2, this.dir < 0, 2);
  }
}
class Manuela extends Ent {
  constructor() { super(P.cx - 24, -60, 48, 44); this.mode = 'track'; this.st = 0; this.enemyHand = true; this.active = true; this.leave = false; }
  update() {
    this.t++; this.st++;
    const B = W.boss;
    if (this.leave) { this.y -= 4; if (this.y < -80) this.dead = true; return; }
    if (this.mode === 'track') {
      this.x += (clamp(P.cx - 24, 16, 22 * TS - 48) - this.x) * 0.06; this.y += (16 - this.y) * 0.1;
      if (this.st > 80) { this.mode = 'warn'; this.st = 0; }
    } else if (this.mode === 'warn') { if (this.st > 24) { this.mode = 'slam'; this.st = 0; } }
    else if (this.mode === 'slam') {
      this.y += 9; const gy = 12 * TS - this.h;
      if (this.y >= gy) { this.y = gy; this.mode = 'rest'; this.st = 0; W.shake(16); Snd.sfx('boom'); W.burst(this.cx, this.y + this.h, '#eebf95', 14, 3); }
    } else if (this.mode === 'rest') { if (this.st > 75) { this.mode = 'up'; this.st = 0; } }
    else if (this.mode === 'up') { this.y -= 3; if (this.y < 16) { this.mode = 'track'; this.st = 0; } }
    // choque con el jugador
    if (P.state === 'play' && overlap(P, { x: this.x + 4, y: this.y + 4, w: this.w - 8, h: this.h - 4 })) {
      const prevBot = P.y + P.h - P.vy;
      if (this.mode === 'rest' && P.vy > 0 && prevBot <= this.y + 10) { P.vy = -6.4; B.manuelaHit(); Snd.sfx('stomp'); W.text(this.cx, this.y - 8, '¡AY, MANUELA!', '#ff7ab0'); this.mode = 'up'; }
      else if (this.mode === 'slam' || this.mode === 'rest' || this.mode === 'track') P.hurt();
    }
    for (const s of W.shots) if (s.mine && !s.dead && this.mode === 'rest' && overlap(s, this)) { s.dead = true; B.manuelaHit(); }
  }
  draw() {
    if (this.mode === 'warn' || this.mode === 'track') { const gy = 12 * TS; ctx.fillStyle = '#00000066'; ctx.fillRect(this.x + 6, gy - 3, this.w - 12, 3); }
    const sx = this.mode === 'warn' ? rnd(-2, 2) : 0;
    ctx.save(); ctx.translate(this.x + sx, this.y + this.h); ctx.scale(1, -1);
    drawSpr('mano', 0, 0, 0, false, 3); ctx.restore();
    if (this.mode === 'rest' && (this.t >> 3) % 2) txt('¡SALTA ENCIMA!', this.cx, this.y - 12, '#ffd23f', 'center');
  }
}
class Wave extends Ent {
  constructor(x, gy, dir) { super(x - 6, gy - 14, 12, 14); this.vx = dir * 2.6; this.active = true; }
  update() { this.t++; this.x += this.vx; if (this.x < 0 || this.x > 24 * TS || this.t > 200) this.dead = true; if (P.state === 'play' && overlap(this, P)) P.hurt(); }
  draw() { const h = 10 + Math.sin(this.t / 2) * 4; R(this.x, this.y + 14 - h, 12, h, '#ff7ab0'); R(this.x + 3, this.y + 14 - h, 6, 3, '#fff'); }
}
// ---- CÉSAR HUYENDO (ruta 3: juegas como Doña Lupe) ----
class CesarFlee extends Boss {
  constructor() { super(17 * TS, 9 * TS, 12, 22, 'CÉSAR ALEJANDRO', 6); this.st = 0; this.target = 18; }
  canStomp() { return this.inv === 0; }
  update() {
    if (!this.tick()) { this.vx = 0; this.physics(0.5); return; }
    this.st++;
    const tx = this.target * TS;
    if (Math.abs(this.cx - tx) < 8 || this.st > 150) {
      // huye al lado contrario de mamá, a veces se sube a la cama o al escritorio
      const opts = [3, 6, 11, 13, 18, 20].filter(c => Math.abs(c * TS - P.cx) > 90);
      this.target = opts.length ? pick(opts) : (P.cx < 12 * TS ? 20 : 3); this.st = 0;
    }
    this.dir = sign(tx - this.cx) || this.dir;
    this.vx = this.dir * (1.7 + (6 - this.hp) * 0.15);
    if (this.onGround && (this.hitWall || Math.random() < 0.015 || (Math.abs(P.cx - this.cx) < 50 && Math.random() < 0.06))) this.vy = -6.2;
    this.physics(0.45);
    if (this.t % 90 === 0) W.text(this.cx, this.y - 10, pick(['¡ME ESTOY CAMBIANDO!', '¡NO ES LO QUE PARECE, MA!', '¡ESTABA ESTUDIANDO!', '¡ES ANATOMÍA, MA!', '¡TOCA ANTES DE ENTRAR!']), '#9fd0ff');
  }
  onHit() { W.text(this.cx, this.y - 20, MAMA_HIT_LINES[clamp(5 - Math.ceil(this.hp), 0, 5)], '#ff7ab0'); this.inv = 40; }
  hit(kind) {
    if (this.inv > 0 || this.dead) return;
    this.hp -= 1; Snd.sfx('chancla'); W.shake(8); W.burst(this.cx, this.y + 6, '#ff7ab0', 10, 3);
    this.onHit();
    if (this.hp <= 0) { this.dead = true; Snd.stop(); G.bossDefeated(this); }
  }
  draw() {
    if (this.blink()) return;
    const f = !this.onGround ? 5 : (Math.abs(this.vx) > 0 ? 1 + Math.floor(this.t / 5) % 4 : 0);
    drawSpr('cesar', this.inv > 0 ? 6 : f, this.x - 2, this.y + this.h - SPR.cesar.h, this.dir < 0);
  }
}
function makeBoss(kind, ax) {
  switch (kind) {
    case 'pancho': return new Pancho(ax * TS);
    case 'taponazo': return new Taponazo(ax * TS);
    case 'popup': return new PopBoss(ax);
    case 'firulais': return new Firulais(ax * TS);
    case 'cesar': return new CesarBoss();
    case 'flee': return new CesarFlee();
  }
}
