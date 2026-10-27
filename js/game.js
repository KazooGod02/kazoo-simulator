'use strict';
/* =========================================================
   JUEGO: estados, menús, HUD, diálogos, cinemáticas, finales
   ========================================================= */
const SAVE_KEY = 'kazoosim_v1';
const RITMO_RATE = 100 / (40 * 60 * 60);   // ~40 minutos de juego del 0 al 100%

const G = {
  state: 'boot', t: 0, prof: null, run: null, dlg: null, sc: null, menu: 0, toastT: 0, toastS: '',
  checkpoint: null, ritmoMult: 1, lastTen: 0, fade: 0, timers: [],
  later(frames, fn) { this.timers.push({ t: frames, fn }); },

  /* ---------------- guardado ---------------- */
  load() {
    let d = {};
    try { d = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}'); } catch (e) { d = {}; }
    this.prof = Object.assign({ recuerdos: [], mama: [], endings: [], unlocked: 0, music: true, sfx: true, easy: false, best: 0, adult: false }, d.prof || {});
    this.run = d.run || null;
    Snd.setMusic(this.prof.music); Snd.setSfx(this.prof.sfx);
  },
  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify({ prof: this.prof, run: this.run })); } catch (e) {} },
  newRun(level = 0) {
    this.run = { level, lives: 5, coins: 0, score: 0, ritmo: 10 + level * 7, hearts: 3, chancla: false, seen: [] };
    this.save();
  },

  /* ---------------- puntaje / objetos ---------------- */
  addCoin() {
    this.run.coins++; this.run.score += 200;
    if (this.run.coins >= 100) { this.run.coins -= 100; this.oneUp(); }
  },
  addScore(n, x, y) { this.run.score += n; if (W && x !== undefined) W.text(x + 8, y - 4, String(n)); },
  oneUp() { this.run.lives++; Snd.sfx('1up'); if (P) W.text(P.cx, P.y - 10, '¡1UP!', '#5cdc6a'); },
  collect(kind, it) {
    const x = it.x, y = it.y;
    if (kind === 'taco') {
      if (P.hearts < 3) { P.hearts++; this.run.hearts = P.hearts; W.text(x + 8, y - 8, '+♥ TACO DE LA OBREGÓN', '#ff7ab0'); }
      else this.addScore(1000, x, y);
      Snd.sfx('power');
    } else if (kind === 'chancla') {
      P.chancla = true; this.run.chancla = true; Snd.sfx('power');
      W.text(x + 8, y - 8, '¡CHANCLA! (B PARA LANZAR)', '#5cc8ff');
    } else if (kind === 'agua') {
      this.run.ritmo = Math.max(0, this.run.ritmo - 8); Snd.sfx('power');
      W.text(x + 8, y - 8, 'AGUA BENDITA: RITMO -8%', '#7fe3ff');
      this.toast('EL PADRE CHUY BENDIJO ESTA AGUA. CÉSAR SE SINTIÓ OBSERVADO.');
    } else if (kind === 'kazoo') {
      P.star = 600; Snd.rate = 1.35; Snd.sfx('power');
      W.text(x + 8, y - 8, '¡KAZOO DORADO! ¡INVENCIBLE!', '#ffd23f');
    } else if (kind === 'concha') { this.oneUp(); W.text(x + 8, y - 16, 'CONCHA DE VAINILLA', '#ff7ab0'); }
  },
  gotFoto(id) {
    const r = RECUERDOS[id];
    const nuevo = !this.prof.recuerdos.includes(id);
    if (nuevo) { this.prof.recuerdos.push(id); this.save(); }
    Snd.sfx('memory'); W.burst(P.cx, P.cy, '#fff8c0', 20, 3);
    this.dialog([['NARRADOR', 'RECUERDO DE CÉSAR: ' + r.t + (nuevo ? '' : ' (YA LO TENÍAS)')], ['NARRADOR', r.d],
      ['KAZOO', nuevo ? `Llevo ${this.prof.recuerdos.length} de 8 recuerdos. Con 6 lo puedo convencer.` : 'Este ya lo tenía. Igual da pena ajena.']]);
  },
  gotMama(id) {
    const m = MAMA_ITEMS[id];
    const nuevo = !this.prof.mama.includes(id);
    if (nuevo) { this.prof.mama.push(id); this.save(); }
    Snd.sfx('1up'); W.burst(P.cx, P.cy, '#ff7ab0', 20, 3);
    this.dialog([['NARRADOR', 'OBJETO DE MAMÁ: ' + m.t], ['NARRADOR', m.d],
      ['KAZOO', `Objetos para llamar a Doña Lupe: ${this.prof.mama.length} de 3.`]]);
  },
  toast(s, t = 200) { this.toastS = s; this.toastT = t; },

  /* ---------------- diálogos ---------------- */
  dialog(lines, done) { this.dlg = { lines, i: 0, ch: 0, done }; },
  dialogQuick(lines) { this.dialog(lines); },
  dlgUpdate() {
    const d = this.dlg, L = d.lines[d.i];
    const text = L[1];
    if (d.ch < text.length) {
      d.ch += Input.held.run ? 3 : 1;
      const who = WHO[L[0]] || 'libro';
      if (Math.floor(d.ch) % 3 === 0 && text[Math.floor(d.ch)] !== ' ') Snd.sfx('blip', VOICE[who] || 300);
      if (Input.ok) d.ch = text.length;
    } else if (Input.ok) {
      d.i++; d.ch = 0;
      if (d.i >= d.lines.length) { this.dlg = null; Snd.sfx('select'); if (d.done) d.done(); }
    }
  },
  dlgDraw() {
    const d = this.dlg, L = d.lines[d.i];
    const who = WHO[L[0]] || 'libro';
    const bx = 8, by = (this.state === 'scene' || this.state === 'debate') ? 6 : VH - 84, bw = VW - 16, bh = 78;
    box(bx, by, bw, bh, '#0b0618f0');
    // retrato
    R(bx + 6, by + 6, 40, 40, '#000'); R(bx + 7, by + 7, 38, 38, '#241640');
    const s = SPR[who];
    if (s) {
      const c = s.r[(Math.floor(d.ch) >> 2) % 2 && d.ch < L[1].length && s.r.length > 8 ? 8 : 0];
      if (s.spec) ctx.drawImage(c, 0, 0, 16, 16, bx + 10, by + 10, 32, 32);
      else { const cw = Math.min(c.width, 16), ch = Math.min(c.height, 16); ctx.drawImage(c, 0, 0, cw, ch, bx + 10, by + 10, cw * 2, ch * 2); }
    }
    txt(L[0], bx + 54, by + 7, '#ffd23f');
    const lines = wrap(L[1].slice(0, Math.floor(d.ch)), 38);
    const full = wrap(L[1], 38);
    const off = Math.max(0, full.length - 5);
    lines.slice(off, off + 5).forEach((l, i) => txt(l, bx + 54, by + 20 + i * 11, '#f4eaff'));
    if (d.ch >= L[1].length && (this.t >> 4) % 2) txt('▼', bx + bw - 14, by + bh - 12, '#fff');
  },

  /* ---------------- cinemáticas ---------------- */
  scene(steps, done) {
    if (typeof steps === 'string') steps = SCENES[steps];
    this.sc = { steps, i: 0, wait: 0, actors: [], bg: 'negro', done, card: null, shake: 0, flash: 0, chaq: 0, move: null, t: 0 };
    this.state = 'scene';
    this.scNext();
  },
  scNext() {
    const sc = this.sc;
    while (sc.i < sc.steps.length) {
      const s = sc.steps[sc.i++];
      if (Array.isArray(s)) { this.dialog([s], () => this.scNext()); return; }
      if (s.music) Snd.play(s.music);
      if (s.sfx) Snd.sfx(s.sfx);
      if (s.bg) sc.bg = s.bg;
      if (s.a) sc.actors = s.a.map(([id, x, dir, f]) => ({ id, x, dir, f: f || 0 }));
      if (s.shake) sc.shake = s.shake;
      if (s.flash) sc.flash = 30;
      if (s.chaq !== undefined) sc.chaq = 120;
      if (s.fn) s.fn();
      if (s.card) { sc.card = s; return; }
      if (s.wait) { sc.wait = s.wait; return; }
      if (s.move) { sc.move = s.move; return; }
    }
    const done = sc.done; this.sc = null;
    if (done) done();
  },
  scUpdate() {
    const sc = this.sc; sc.t++;
    if (sc.shake > 0) { sc.shake--; if (sc.t % 6 === 0) Snd.sfx('squeak'); }
    if (sc.flash > 0) sc.flash--;
    if (sc.chaq > 0) sc.chaq--;
    if (this.dlg) { this.dlgUpdate(); return; }
    if (sc.card) { if (Input.ok && sc.t > 20) { sc.card = null; sc.t = 0; this.scNext(); } return; }
    if (sc.wait > 0) { if (--sc.wait === 0) this.scNext(); return; }
    if (sc.move) {
      const [id, x, sp] = sc.move; const a = sc.actors.find(q => q.id === id);
      if (!a) { sc.move = null; this.scNext(); return; }
      const d = x - a.x; a.walking = true; a.dir = sign(d) || a.dir;
      if (Math.abs(d) <= sp) { a.x = x; a.walking = false; sc.move = null; this.scNext(); }
      else a.x += sign(d) * sp;
      return;
    }
    if (Input.pressed.pause) { /* saltar escena */ }
  },
  scDraw() {
    const sc = this.sc;
    ctx.save();
    if (sc.shake > 0) ctx.translate(rnd(-3, 3), rnd(-2, 2));
    drawSceneBG(sc.bg, sc.t, !sc.actors.some(a => a.id === 'cesar'));
    const floor = VH - 40;
    for (const a of sc.actors) {
      const s = SPR[a.id]; if (!s) continue;
      const f = a.walking ? 1 + Math.floor(sc.t / 6) % 4 : (this.dlg && WHO[this.dlg.lines[this.dlg.i][0]] === a.id && (sc.t >> 3) % 2 ? 8 : a.f);
      drawSpr(a.id, s.r.length > f ? f : 0, a.x - s.w, floor - s.h * 2, a.dir < 0, 2);
    }
    ctx.restore();
    if (sc.chaq > 0) drawChaq(VW / 2 - 70, 96, this.run ? this.run.ritmo : 10);
    if (sc.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${sc.flash / 30})`; ctx.fillRect(0, 0, VW, VH); }
    if (sc.card) {
      R(0, 0, VW, VH, '#000');
      const big = sc.card.card.length < 12;
      txt(sc.card.card, VW / 2, VH / 2 - (big ? 20 : 14), '#ffd23f', 'center', big ? 24 : 8);
      wrap(sc.card.sub || '', 44).forEach((l, i) => txt(l, VW / 2, VH / 2 + 12 + i * 12, '#f4eaff', 'center'));
      if (sc.t > 20 && (this.t >> 4) % 2) txt('▼', VW / 2, VH - 24, '#fff', 'center');
    }
    if (this.dlg) this.dlgDraw();
  },

  /* ---------------- niveles ---------------- */
  beginLevel(idx) {
    this.run.level = idx; this.checkpoint = null; this.save();
    const L = LEVELS[idx];
    if (L.pre && !this.run.seen.includes('pre' + idx)) {
      this.run.seen.push('pre' + idx); this.save();
      this.scene(L.pre, () => this.intro(idx));
    } else this.intro(idx);
  },
  intro(idx) {
    this.state = 'intro'; this.introT = 0; this.introIdx = idx;
    Snd.stop();
  },
  startLevel(idx) {
    const L = LEVELS[idx];
    this.lvl = L; this.ritmoMult = 1; this.timers = []; this.dlg = null; this.cesarSitting = false;
    const def = L.build();
    W = new World(def, L);
    this.run.hearts = 3;
    const sx = this.checkpoint ? this.checkpoint.x : def.start.x * TS;
    P = new Player(sx, 0);
    P.y = W.groundY(sx + 5) - P.h;
    W.camX = clamp(P.x - VW * 0.4, 0, W.w * TS - VW);
    this.arenaDone = false;
    this.state = 'play';
    if (L.id === 'F') { this.startFinal(); return; }
    Snd.play(L.music);
  },
  enterWarp(w) {
    P.state = 'warp'; P.st = 0; P.warpDir = 1; P.vx = 0; Snd.sfx('pipe');
    P.x = w.x + 11;
    if (w.room) {
      P.onWarpDone = () => {
        this.mainSnap = { map: W.map, cont: W.cont, ents: W.ents, plats: W.plats, warps: W.warps, camX: W.camX, low: W.low, w: W.w, arena: W.arena, entry: w };
        const rd = W.def.rooms[w.room];
        W.load(rd); W.inRoom = true;
        P.x = rd.start.x * TS; P.y = rd.start.y * TS; P.vy = 0; W.camX = 0;
      };
    } else if (w.exit) {
      P.onWarpDone = () => {
        const m = this.mainSnap;
        Object.assign(W, { map: m.map, cont: m.cont, ents: m.ents, plats: m.plats, warps: m.warps, camX: m.camX, low: m.low, w: m.w, arena: m.arena });
        W.inRoom = false;
        P.x = m.entry.x + 11; P.y = m.entry.y - P.h - 2; P.vy = -3; P.inv = 30;
      };
    }
  },
  levelClear() {
    const L = LEVELS[this.run.level];
    let bonus = L.ritmoBonus || 0;
    if (bonus) this.run.ritmo = Math.max(0, this.run.ritmo + bonus);
    this.prof.unlocked = Math.max(this.prof.unlocked, this.run.level + 1);
    this.prof.best = Math.max(this.prof.best, this.run.score);
    this.run.chancla = P.chancla && P.skin === 'kazoo';
    this.save();
    this.state = 'clear'; this.clearT = 0; this.clearBonus = bonus;
  },
  afterClear() {
    const idx = this.run.level, L = LEVELS[idx];
    const next = () => { this.beginLevel(idx + 1); };
    if (L.post && !this.run.seen.includes('post' + idx)) { this.run.seen.push('post' + idx); this.save(); this.scene(L.post, next); }
    else next();
  },
  onDeath() {
    this.run.lives--; this.run.ritmo += 2; this.run.chancla = false; this.run.hearts = 3;
    if (this.run.lives < 0) { this.run.lives = 5; this.run.ritmo += 5; this.checkpoint = null; this.goT = 0; this.state = 'gameover'; Snd.play('bad'); }
    if (this.run.ritmo >= 100) { this.run.ritmo = 100; this.ending('bigbang'); return; }
    if (this.state === 'gameover') { this.save(); return; }
    this.save();
    if (this.run.level === LEVELS.length - 1) { this.finalRetry(); return; }
    this.intro(this.run.level);
  },
  bossDefeated(b) {
    if (b instanceof CesarBoss) { this.later(110, () => this.ending('matar')); this.state = 'wait'; return; }
    if (b instanceof CesarFlee) { this.later(75, () => this.ending('mama')); this.state = 'wait'; return; }
    for (const e of W.ents) if (e.enemy && !e.dead) e.kill(true);
    W.shots = [];
    this.arenaDone = true;
    this.later(110, () => {
      if (this.state !== 'play') return;
      Snd.sfx('clear'); W.lock = null;
      const ax = W.arena.x0 + 23; for (let y = 0; y < 12; y++) W.setT(ax, y, 0);
      P.state = 'goal'; P.st = 0; P.goalPhase = 1; P.face = 1;
    });
  },

  /* ---------------- final ---------------- */
  startFinal() {
    W.decor = drawCuartoDecor;
    W.lock = { l: 0, r: 23 };
    W.camX = 0;
    P.x = 2 * TS;
    this.cesarSitting = true;
    Snd.play('tension');
    this.state = 'play';
    this.dialog([['CÉSAR', '¿Y bien, Kazoo? ¿Qué vas a hacer? El Chaquetómetro no espera.']], () => this.openChoice());
  },
  finalRetry() {
    // si mueres en el cuarto, vuelves a elegir (el ritmo ya subió)
    const def = LEVELS[LEVELS.length - 1].build();
    W = new World(def, LEVELS[LEVELS.length - 1]);
    P = new Player(2 * TS, 0); P.y = W.groundY(40) - P.h;
    this.ritmoMult = 1;
    this.startFinal();
  },
  openChoice() { this.state = 'choice'; this.menu = 0; },
  choose(id) {
    if (id === 'pelear') {
      this.dialog(PRE_FIGHT, () => {
        this.cesarSitting = false;
        W.boss = makeBoss('cesar'); W.boss.active = true;
        this.ritmoMult = 4; Snd.play('cesar'); this.state = 'play';
      });
      this.state = 'play';
    } else if (id === 'hablar') {
      this.deb = { round: 0, terq: 100, used: [], phase: 'excuse', sel: 0 };
      Snd.play('sad');
      this.state = 'debate';
      this.debExcuse();
    } else if (id === 'mama') {
      this.scene(MAMA_CALL, () => {
        this.cesarSitting = false;
        W = new World(LEVELS[LEVELS.length - 1].build(), LEVELS[LEVELS.length - 1]);
        W.decor = drawCuartoDecor; W.lock = { l: 0, r: 23 }; W.camX = 0;
        W.kazooFan = true;
        P = new Player(4 * TS, 0, 'mama'); P.y = W.groundY(4 * TS) - P.h;
        W.boss = makeBoss('flee'); W.boss.active = true;
        this.ritmoMult = 3; Snd.play('mama'); this.state = 'play';
      });
    } else if (id === 'dejar') {
      this.dialog(DEJAR_LINES, () => { this.run.ritmo = 100; this.ending('bigbang'); });
      this.state = 'play';
    }
  },
  debExcuse() {
    const d = this.deb, ex = DEBATE[d.round % DEBATE.length];
    this.dialog([['CÉSAR', ex.ex]], () => { d.phase = 'pick'; d.sel = 0; });
  },
  debPick(id) {
    const d = this.deb, ex = DEBATE[d.round % DEBATE.length], r = RECUERDOS[id];
    d.used.push(id); d.phase = 'reply';
    const good = ex.good.includes(id);
    const resp = good ? DEBATE_GOOD[d.round % DEBATE_GOOD.length] : DEBATE_BAD[d.round % DEBATE_BAD.length];
    this.dialog([['KAZOO', r.k], resp], () => {
      d.terq -= good ? 35 : 20; d.hitT = 30;
      Snd.sfx(good ? 'bosshit' : 'bump');
      if (d.terq <= 0) { d.terq = 0; this.later(36, () => this.ending('hablar')); d.phase = 'done'; return; }
      d.round++;
      const left = this.prof.recuerdos.filter(x => !d.used.includes(x));
      if (!left.length) { d.terq = 0; this.ending('hablar'); return; }
      this.debExcuse();
    });
  },
  ending(key) {
    const E = ENDINGS[key];
    Snd.stop();
    if (!this.prof.endings.includes(key)) this.prof.endings.push(key);
    this.prof.best = Math.max(this.prof.best, this.run ? this.run.score : 0);
    this.run = null; this.save();
    this.run = { ritmo: key === 'bigbang' ? 100 : 0, lives: 0, coins: 0, score: 0, hearts: 3, seen: [] };
    this.scene(E.scene, () => {
      this.scene([{ card: `FINAL ${E.n} DE 4`, sub: E.t }], () => {
        this.run = null;
        this.state = 'credits'; this.credT = 0; Snd.play('ending');
      });
    });
  },

  /* ---------------- update ---------------- */
  update() {
    this.t++;
    Input.update();
    if (this.timers.length && this.state !== 'pause') {
      const due = []; for (const tm of this.timers) if (--tm.t <= 0) due.push(tm);
      this.timers = this.timers.filter(tm => tm.t > 0); due.forEach(tm => tm.fn());
    }
    if (this.toastT > 0) this.toastT--;
    switch (this.state) {
      case 'boot': if (Input.any || Input.ok) { Snd.init(); this.state = this.prof.adult ? 'title' : 'warn'; this.menu = 0; Snd.play('title'); } break;
      case 'warn':
        if (Input.ok) { this.prof.adult = true; this.save(); this.state = 'title'; this.menu = 0; Snd.sfx('ok'); }
        break;
      case 'title': this.titleUpdate(); break;
      case 'options': this.optUpdate(); break;
      case 'levels': this.lvlSelUpdate(); break;
      case 'endings': if (Input.cancel || Input.ok) { this.state = 'title'; Snd.sfx('select'); } break;
      case 'scene': this.scUpdate(); break;
      case 'intro':
        this.introT++;
        if (this.introT > 150 || (this.introT > 30 && Input.ok)) this.startLevel(this.introIdx);
        break;
      case 'play': this.playUpdate(); break;
      case 'pause': this.pauseUpdate(); break;
      case 'clear':
        this.clearT++;
        if (this.clearT > 60 && Input.ok) this.afterClear();
        if (this.clearT > 400) this.afterClear();
        break;
      case 'gameover':
        this.goT++;
        if (this.goT > 60 && Input.ok) { this.intro(this.run.level); }
        break;
      case 'choice': this.choiceUpdate(); break;
      case 'debate': this.debUpdate(); break;
      case 'credits':
        this.credT++;
        if (this.credT > 120 && Input.ok) { this.state = 'title'; this.menu = 0; Snd.play('title'); }
        break;
      case 'wait': if (W) W.update(); break;
    }
  },
  playUpdate() {
    if (this.dlg) { this.dlgUpdate(); return; }
    if (Input.pressed.pause) { this.state = 'pause'; this.menu = 0; Snd.sfx('pause'); return; }
    W.signText = null;
    P.update();
    if (this.state !== 'play') return;
    W.update();
    // arena de jefe
    const A = W.arena;
    if (A && !A.final && !this.arenaDone && !W.lock && !W.inRoom && P.x > (A.x0 + 3) * TS) {
      W.lock = { l: A.x0, r: A.x0 + 23 };
      W.setT(A.x0, 9, 18); W.setT(A.x0, 10, 18); W.setT(A.x0, 11, 18);
      W.boss = makeBoss(A.boss, A.x0); W.boss.active = true;
      Snd.play('boss'); this.toast('¡JEFE! ' + W.boss.name, 150);
    }
    // ritmo de César
    if (P.state === 'play') {
      const r = this.run;
      r.ritmo += RITMO_RATE * this.ritmoMult * (this.prof.easy ? 0.5 : 1);
      const ten = Math.floor(r.ritmo / 10);
      if (ten > this.lastTen && r.ritmo > 20) { this.toast(`¡TEMBLOR! EL CHAQUETÓMETRO MARCA ${ten * 10}%`, 150); W.shake(40); Snd.sfx('quake'); }
      this.lastTen = ten;
      if (P.star === 0) Snd.rate = 1 + r.ritmo / 250;
      if (r.ritmo >= 100) { r.ritmo = 100; this.state = 'wait'; Snd.stop(); this.later(24, () => this.ending('bigbang')); }
    }
  },
  pauseUpdate() {
    const opts = this.pauseOpts();
    if (Input.pressed.up) { this.menu = (this.menu + opts.length - 1) % opts.length; Snd.sfx('select'); }
    if (Input.pressed.down) { this.menu = (this.menu + 1) % opts.length; Snd.sfx('select'); }
    if (Input.pressed.pause || Input.cancel) { this.state = 'play'; return; }
    if (Input.ok) { Snd.sfx('ok'); opts[this.menu][1](); }
  },
  pauseOpts() {
    const fin = this.lvl && this.lvl.id === 'F';
    return [
      ['CONTINUAR', () => { this.state = 'play'; }],
      [fin ? 'REINICIAR EL CUARTO' : 'REINICIAR NIVEL (-1 VIDA)', () => { this.run.lives--; this.run.ritmo += 2; if (this.run.lives < 0) this.run.lives = 0; this.checkpoint = null; this.save(); fin ? this.finalRetry() : this.intro(this.run.level); }],
      ['MÚSICA: ' + (this.prof.music ? 'SÍ' : 'NO'), () => { this.prof.music = !this.prof.music; Snd.setMusic(this.prof.music); this.save(); }],
      ['SALIR AL MENÚ', () => { this.save(); this.state = 'title'; this.menu = 0; Snd.play('title'); }],
    ];
  },
  titleOpts() {
    const o = [];
    if (this.run) o.push(['CONTINUAR (' + LEVELS[this.run.level].id + ')', () => this.beginLevel(this.run.level)]);
    o.push(['NUEVA PARTIDA', () => { this.newRun(0); this.beginLevel(0); }]);
    if (this.prof.unlocked > 0) o.push(['ELEGIR NIVEL', () => { this.state = 'levels'; this.menu = 0; }]);
    o.push(['FINALES (' + this.prof.endings.length + '/4)', () => { this.state = 'endings'; }]);
    o.push(['OPCIONES', () => { this.state = 'options'; this.menu = 0; }]);
    return o;
  },
  titleUpdate() {
    const opts = this.titleOpts();
    this.menu = clamp(this.menu, 0, opts.length - 1);
    if (Input.pressed.up) { this.menu = (this.menu + opts.length - 1) % opts.length; Snd.sfx('select'); }
    if (Input.pressed.down) { this.menu = (this.menu + 1) % opts.length; Snd.sfx('select'); }
    if (Input.ok) { Snd.sfx('ok'); opts[this.menu][1](); }
  },
  optOpts() {
    return [
      ['MÚSICA: ' + (this.prof.music ? 'SÍ' : 'NO'), () => { this.prof.music = !this.prof.music; Snd.setMusic(this.prof.music); }],
      ['EFECTOS: ' + (this.prof.sfx ? 'SÍ' : 'NO'), () => { this.prof.sfx = !this.prof.sfx; Snd.setSfx(this.prof.sfx); }],
      ['DIFICULTAD: ' + (this.prof.easy ? 'MODO MANUELA (FÁCIL)' : 'NORMAL'), () => { this.prof.easy = !this.prof.easy; }],
      ['BORRAR TODO', () => { if (this.confirmDel) { localStorage.removeItem(SAVE_KEY); this.load(); this.prof.adult = true; this.confirmDel = false; this.toast('DATOS BORRADOS.'); } else { this.confirmDel = true; this.toast('PRESIONA OTRA VEZ PARA BORRAR TODO'); } }],
      ['REGRESAR', () => { this.state = 'title'; this.menu = 0; }],
    ];
  },
  optUpdate() {
    const opts = this.optOpts();
    if (Input.pressed.up) { this.menu = (this.menu + opts.length - 1) % opts.length; Snd.sfx('select'); this.confirmDel = false; }
    if (Input.pressed.down) { this.menu = (this.menu + 1) % opts.length; Snd.sfx('select'); this.confirmDel = false; }
    if (Input.cancel) { this.state = 'title'; this.menu = 0; this.save(); return; }
    if (Input.ok) { Snd.sfx('ok'); opts[this.menu][1](); this.save(); }
  },
  lvlSelUpdate() {
    const n = Math.min(this.prof.unlocked, LEVELS.length - 1) + 1;
    if (Input.pressed.up) { this.menu = (this.menu + n - 1) % n; Snd.sfx('select'); }
    if (Input.pressed.down) { this.menu = (this.menu + 1) % n; Snd.sfx('select'); }
    if (Input.cancel) { this.state = 'title'; this.menu = 0; return; }
    if (Input.ok) {
      Snd.sfx('ok');
      const idx = this.menu;
      this.newRun(idx);
      for (let i = 0; i < LEVELS.length; i++) { this.run.seen.push('pre' + i); if (i < idx) this.run.seen.push('post' + i); }
      this.beginLevel(idx);
    }
  },
  choiceUpdate() {
    const n = FINAL_CHOICES.length;
    if (Input.pressed.up) { this.menu = (this.menu + n - 1) % n; Snd.sfx('select'); }
    if (Input.pressed.down) { this.menu = (this.menu + 1) % n; Snd.sfx('select'); }
    // el ritmo sigue subiendo mientras piensas
    this.run.ritmo += RITMO_RATE * 3;
    if (this.run.ritmo >= 100) { this.ending('bigbang'); return; }
    if (W) W.update();
    if (Input.ok) {
      const c = FINAL_CHOICES[this.menu];
      if (!c.req(this.prof)) { Snd.sfx('bump'); this.toast('BLOQUEADO: ' + c.why, 120); return; }
      Snd.sfx('ok'); this.choose(c.id);
    }
  },
  debUpdate() {
    const d = this.deb;
    if (d.hitT > 0) d.hitT--;
    if (this.dlg) { this.dlgUpdate(); return; }
    if (d.phase === 'pick') {
      const left = this.prof.recuerdos.filter(x => !d.used.includes(x));
      const n = left.length;
      if (Input.pressed.up) { d.sel = (d.sel + n - 1) % n; Snd.sfx('select'); }
      if (Input.pressed.down) { d.sel = (d.sel + 1) % n; Snd.sfx('select'); }
      if (Input.ok) { Snd.sfx('ok'); this.debPick(left[d.sel]); }
    }
  },

  /* ---------------- draw ---------------- */
  draw() {
    ctx.imageSmoothingEnabled = false;
    switch (this.state) {
      case 'boot': drawBoot(); break;
      case 'warn': drawWarn(); break;
      case 'title': case 'options': case 'levels': case 'endings': drawTitle(); break;
      case 'scene': this.scDraw(); break;
      case 'intro': drawIntro(); break;
      case 'play': case 'pause': case 'clear': case 'wait': case 'choice':
        W.draw(); drawHUD();
        if (this.state === 'pause') drawMenuBox('PAUSA', this.pauseOpts().map(o => o[0]), this.menu);
        if (this.state === 'clear') drawClear();
        if (this.state === 'choice') drawChoice();
        if (this.dlg) this.dlgDraw();
        break;
      case 'debate': drawDebate(); if (this.dlg) this.dlgDraw(); break;
      case 'gameover': drawGameOver(); break;
      case 'credits': drawCredits(); break;
    }
    if (this.toastT > 0) {
      const lines = wrap(this.toastS, 44);
      const h = lines.length * 10 + 8, y = this.state === 'play' ? 28 : 8;
      box(VW / 2 - 186, y, 372, h, '#000000e0', '#ff4fa3');
      lines.forEach((l, i) => txt(l, VW / 2, y + 5 + i * 10, '#fff', 'center'));
    }
  },
};

/* ====================== DIBUJO DE PANTALLAS ====================== */
function drawChaq(x, y, v) {
  box(x, y, 140, 34, '#111', '#888');
  txt('CHAQUETÓMETRO', x + 70, y + 4, '#ffd23f', 'center');
  R(x + 6, y + 16, 128, 10, '#000');
  const col = v < 40 ? '#5cdc6a' : v < 70 ? '#ffd23f' : '#ff3b3b';
  R(x + 7, y + 17, Math.round(126 * clamp(v, 0, 100) / 100), 8, col);
  txt(Math.floor(v) + '%', x + 70, y + 17, '#fff', 'center');
}
function drawHUD() {
  const r = G.run; if (!r) return;
  R(0, 0, VW, 22, '#000000aa');
  const isMama = P && P.skin === 'mama';
  txt(isMama ? 'DOÑA LUPE' : 'KAZOO×' + Math.max(0, r.lives), 4, 3, '#fff');
  for (let i = 0; i < 3; i++) drawSpr(i < (P ? P.hearts : 3) ? 'corazon' : 'corazon_v', 0, 4 + i * 9, 13);
  txt('$' + r.coins, 36, 13, '#ffd23f');
  txt(G.lvl ? G.lvl.id : '', 112, 3, '#9fd0ff');
  // recuerdo / objeto del nivel
  const id = G.lvl && G.lvl.id;
  if (id && LEVEL_FOTO[id] !== undefined) { ctx.globalAlpha = G.prof.recuerdos.includes(LEVEL_FOTO[id]) ? 1 : 0.25; ctx.drawImage(SPR.foto.r[0], 2, 1, 12, 14, 76, 6, 12, 14); ctx.globalAlpha = 1; }
  if (id && LEVEL_MAMA[id] !== undefined) { ctx.globalAlpha = G.prof.mama.includes(LEVEL_MAMA[id]) ? 1 : 0.25; ctx.drawImage(SPR[MAMA_ITEMS[LEVEL_MAMA[id]].spr].r[0], 2, 1, 12, 14, 90, 6, 12, 14); ctx.globalAlpha = 1; }
  // kazoo
  if (P && P.skin === 'kazoo') {
    const ready = P.kzCD === 0;
    ctx.globalAlpha = ready ? 1 : 0.35; ctx.drawImage(SPR.kazoo_item.r[0], 0, 4, 16, 8, 140, 12, 16, 8); ctx.globalAlpha = 1;
    if (!ready) R(140, 20, 16 * (1 - P.kzCD / 300), 1, '#ffd23f');
  }
  // chaquetómetro
  const v = r.ritmo;
  txt('CHAQUETÓMETRO', VW - 4, 3, v > 70 && (G.t >> 3) % 2 ? '#ff3b3b' : '#ffd23f', 'right');
  R(VW - 108, 13, 104, 7, '#000'); R(VW - 107, 14, 102, 5, '#333');
  const col = v < 40 ? '#5cdc6a' : v < 70 ? '#ffd23f' : '#ff3b3b';
  R(VW - 107, 14, Math.round(102 * clamp(v, 0, 100) / 100), 5, col);
  txt(Math.floor(v) + '%', VW - 112, 13, col, 'right');
  // jefe
  const B = W && W.boss;
  if (B && !B.dead) {
    R(VW / 2 - 130, 26, 260, 16, '#000000cc');
    txt(B.name, VW / 2, 27, '#ff7ab0', 'center');
    R(VW / 2 - 70, 37, 140, 3, '#333'); R(VW / 2 - 70, 37, 140 * B.hp / B.maxhp, 3, '#ff3b3b');
  }
  if (W && W.signText && !G.dlg) {
    const lines = wrap(W.signText, 44);
    const h = lines.length * 10 + 8;
    box(VW / 2 - 186, 28, 372, h, '#2a1a0aee', '#c98f4f');
    lines.forEach((l, i) => txt(l, VW / 2, 33 + i * 10, '#fff4d0', 'center'));
  }
}
function drawMenuBox(title, items, sel, y0, w = 260) {
  const h = (title ? 26 : 14) + items.length * 14;
  const x = VW / 2 - w / 2, y = y0 !== undefined ? y0 : VH / 2 - h / 2;
  box(x, y, w, h, '#0b0618f0');
  txt(title, VW / 2, y + 7, '#ffd23f', 'center');
  items.forEach((it, i) => txt((i === sel ? '▶ ' : '  ') + it, x + 12, y + (title ? 22 : 9) + i * 14, i === sel ? '#fff' : '#9a86bd'));
}
function drawBoot() {
  R(0, 0, VW, VH, '#05030a');
  txt('KAZOO STUDIOS', VW / 2, VH / 2 - 30, '#ffd23f', 'center', 16);
  txt('PRESENTA', VW / 2, VH / 2 - 6, '#9a86bd', 'center');
  if ((G.t >> 5) % 2) txt(IS_TOUCH ? 'TOCA PARA EMPEZAR' : 'PRESIONA CUALQUIER TECLA', VW / 2, VH / 2 + 40, '#fff', 'center');
}
function drawWarn() {
  R(0, 0, VW, VH, '#0b0614');
  box(24, 22, VW - 48, VH - 44, '#140a24', '#ff3b3b');
  txt('⚠ ADVERTENCIA +18 ⚠', VW / 2, 34, '#ff3b3b', 'center');
  const t = 'Este juego contiene humor adulto, albures, doble sentido y un hombre que no puede parar. No hay contenido explícito, pero sí mucha pena ajena.\n\nEs una parodia entre compas. Si eres menor de 18, ve a hacer la tarea.';
  wrap(t, 40).forEach((l, i) => txt(l, VW / 2, 56 + i * 11, '#f4eaff', 'center'));
  if ((G.t >> 5) % 2) txt('[A / ENTER] SOY MAYOR DE 18', VW / 2, VH - 44, '#ffd23f', 'center');
}
function drawTitle() {
  const t = G.t;
  drawBG('calle', t * 0.6, t, 0);
  tileset('calle');
  for (let x = 0; x < VW / TS + 1; x++) { const ox = -((t * 0.6) % TS); ctx.drawImage(TILESETS.calle, 19 * TS, 0, TS, TS, x * TS + ox, VH - 32, TS, TS); ctx.drawImage(TILESETS.calle, 1 * TS, 0, TS, TS, x * TS + ox, VH - 16, TS, TS); }
  R(0, 0, VW, VH, '#0b061466');
  // logo
  const wob = Math.sin(t / 20) * 2;
  txt('KAZOO', VW / 2, 16 + wob, '#ffd23f', 'center', 24, '#7a2e0e');
  txt('SIMULATOR', VW / 2, 44 + wob, '#ff4fa3', 'center', 16, '#000');
  txt('OPERACIÓN: SIN CÉSAR', VW / 2, 66, '#fff', 'center');
  // Kazoo corriendo persiguiendo a César en su silla
  drawSpr('kazoo', 1 + Math.floor(t / 6) % 4, 30, VH - 32 - 52, false, 2);
  chairCesar(338, VH - 42, t, false);
  if ((t >> 3) % 2) txt('*ñaca ñaca*', 322, VH - 112, '#ff7ab0', 'center');
  if (G.state === 'title') drawMenuBox('', G.titleOpts().map(o => o[0]), G.menu, 92, 210);
  if (G.state === 'options') drawMenuBox('OPCIONES', G.optOpts().map(o => o[0]), G.menu, 80);
  if (G.state === 'levels') {
    const n = Math.min(G.prof.unlocked, LEVELS.length - 1) + 1;
    drawMenuBox('ELEGIR NIVEL', LEVELS.slice(0, n).map(l => (l.id === 'F' ? '★ ' : l.id + ' ') + l.name), G.menu, 30);
  }
  if (G.state === 'endings') {
    box(30, 24, VW - 60, VH - 48, '#0b0618f0');
    txt('FINALES', VW / 2, 32, '#ffd23f', 'center');
    const keys = ['matar', 'hablar', 'mama', 'bigbang'];
    const hints = ['GÁNALE A CÉSAR EN EL CUARTO', 'JUNTA 6 RECUERDOS Y HABLA CON ÉL', 'JUNTA LOS 3 OBJETOS DE MAMÁ', 'DEJA QUE EL CHAQUETÓMETRO LLEGUE A 100%'];
    keys.forEach((k, i) => {
      const got = G.prof.endings.includes(k), E = ENDINGS[k];
      txt(`${E.n}. ` + (got ? E.t : '???'), 46, 52 + i * 26, got ? '#5cdc6a' : '#9a86bd');
      txt(got ? '✓ DESBLOQUEADO' : 'PISTA: ' + hints[i], 58, 63 + i * 26, '#6a5a8a');
    });
    txt(`RECUERDOS: ${G.prof.recuerdos.length}/8   OBJETOS DE MAMÁ: ${G.prof.mama.length}/3`, VW / 2, VH - 40, '#ff7ab0', 'center');
  }
  if (G.state === 'title') {
    txt('© KAZOO STUDIOS 2026 · +18', VW / 2, VH - 12, '#ffffffaa', 'center');
    if (G.prof.best) txt('RÉCORD ' + G.prof.best, 6, VH - 12, '#ffd23f');
  }
}
function drawIntro() {
  R(0, 0, VW, VH, '#000');
  const L = LEVELS[G.introIdx];
  txt(L.id === 'F' ? 'FINAL' : 'MUNDO ' + L.id, VW / 2, 50, '#fff', 'center', 16);
  txt(L.name, VW / 2, 76, '#ffd23f', 'center');
  drawSpr('kazoo', 0, VW / 2 - 40, 100, false, 1);
  txt('× ' + Math.max(0, G.run.lives), VW / 2 - 14, 112, '#fff');
  drawChaq(VW / 2 - 70, 140, G.run.ritmo);
  const id = L.id;
  const tips = [];
  if (LEVEL_FOTO[id] !== undefined && !G.prof.recuerdos.includes(LEVEL_FOTO[id])) tips.push('AQUÍ HAY UN RECUERDO DE CÉSAR');
  if (LEVEL_MAMA[id] !== undefined && !G.prof.mama.includes(LEVEL_MAMA[id])) tips.push('ALGO DE DOÑA LUPE ESTÁ ESCONDIDO EN UN TUBO');
  tips.forEach((t, i) => txt(t, VW / 2, 184 + i * 11, '#ff7ab0', 'center'));
}
function drawClear() {
  const r = G.run;
  box(VW / 2 - 130, 50, 260, 120, '#0b0618f0');
  txt('¡NIVEL SUPERADO!', VW / 2, 60, '#ffd23f', 'center');
  txt('PUNTOS: ' + r.score, VW / 2 - 110, 82, '#fff');
  txt('MONEDAS: $' + r.coins, VW / 2 - 110, 96, '#fff');
  const id = G.lvl.id;
  if (LEVEL_FOTO[id] !== undefined) txt('RECUERDO: ' + (G.prof.recuerdos.includes(LEVEL_FOTO[id]) ? 'SÍ ✓' : 'NO'), VW / 2 - 110, 110, '#ff7ab0');
  if (LEVEL_MAMA[id] !== undefined) txt('OBJETO DE MAMÁ: ' + (G.prof.mama.includes(LEVEL_MAMA[id]) ? 'SÍ ✓' : 'NO'), VW / 2 - 110, 124, '#ff7ab0');
  if (G.clearBonus) txt('CHAQUETÓMETRO ' + G.clearBonus + '%', VW / 2 - 110, 138, '#5cdc6a');
  if (G.clearT > 60 && (G.t >> 4) % 2) txt('▼', VW / 2, 156, '#fff', 'center');
}
function drawGameOver() {
  R(0, 0, VW, VH, '#000');
  txt('GAME OVER', VW / 2, 70, '#ff3b3b', 'center', 16);
  txt('CÉSAR NI SE ENTERÓ. SIGUIÓ EN LO SUYO.', VW / 2, 104, '#fff', 'center');
  txt('EL CHAQUETÓMETRO SUBIÓ 5%.', VW / 2, 118, '#ff7ab0', 'center');
  if (G.goT > 60 && (G.t >> 4) % 2) txt('[A] REINTENTAR', VW / 2, 150, '#ffd23f', 'center');
}
function drawChoice() {
  const x = 14, y = 30, w = 232, h = 24 + FINAL_CHOICES.length * 26;
  box(x, y, w, h, '#0b0618f0', '#ff4fa3');
  txt('¿QUÉ HACES?', x + w / 2, y + 7, '#ffd23f', 'center');
  FINAL_CHOICES.forEach((c, i) => {
    const ok = c.req(G.prof), sel = i === G.menu;
    txt((sel ? '▶ ' : '  ') + c.t, x + 8, y + 22 + i * 26, ok ? (sel ? '#fff' : '#c9b8e8') : '#5a4a7a');
    if (!ok) txt('(' + c.why + ')', x + 24, y + 33 + i * 26, '#8a5a7a', 'left', 8, null);
    else if (c.id === 'hablar') txt(`(${G.prof.recuerdos.length} RECUERDOS)`, x + 24, y + 33 + i * 26, '#7a6a9a', 'left', 8, null);
  });
}
function drawDebate() {
  drawSceneBG('cuarto', G.t, false);
  const floor = VH - 40;
  drawSpr('kazoo', (G.t >> 4) % 6 === 0 ? 8 : 0, 80, floor - SPR.kazoo.h * 2, false, 2);
  const d = G.deb;
  const sx = d.hitT > 0 ? rnd(-3, 3) : 0;
  drawSpr('cesar', d.hitT > 0 ? 6 : 0, 250 + sx, floor - SPR.cesar.h * 2, true, 2);
  // terquedad
  box(VW / 2 - 90, 8, 180, 26, '#111', '#888');
  txt('TERQUEDAD DE CÉSAR', VW / 2, 12, '#ff7ab0', 'center');
  R(VW / 2 - 84, 23, 168, 7, '#000'); R(VW / 2 - 83, 24, 166 * d.terq / 100, 5, '#ff3b3b');
  if (d.phase === 'pick' && !G.dlg) {
    const left = G.prof.recuerdos.filter(x => !d.used.includes(x));
    const ex = DEBATE[d.round % DEBATE.length];
    box(20, 40, VW - 40, 26 + left.length * 13, '#0b0618f0');
    wrap('"' + ex.ex + '"', 42).slice(0, 1).forEach(l => txt(l, VW / 2, 44, '#9fd0ff', 'center'));
    txt('¿QUÉ RECUERDO LE MUESTRAS?', VW / 2, 54, '#ffd23f', 'center');
    left.forEach((id, i) => txt((i === d.sel ? '▶ ' : '  ') + RECUERDOS[id].t, 34, 68 + i * 13, i === d.sel ? '#fff' : '#9a86bd'));
  }
}
function drawCredits() {
  R(0, 0, VW, VH, '#05030a');
  const y0 = VH - G.credT * 0.5;
  CREDITS.forEach((l, i) => { const y = y0 + i * 16; if (y > -10 && y < VH) txt(l, VW / 2, y, i < 2 ? '#ffd23f' : '#f4eaff', 'center'); });
  if (y0 + CREDITS.length * 16 < 40) {
    txt(`FINALES: ${G.prof.endings.length}/4`, VW / 2, VH / 2 - 10, '#ff7ab0', 'center');
    if (G.prof.endings.length < 4) txt('HAY OTROS FINALES. CÉSAR SIGUE AHÍ.', VW / 2, VH / 2 + 6, '#9a86bd', 'center');
    if ((G.t >> 4) % 2) txt('[A] MENÚ', VW / 2, VH - 30, '#fff', 'center');
  }
}

/* ---- fondos de cinemáticas ---- */
function groundStrip(theme) {
  const ts = tileset(theme);
  for (let x = 0; x < VW / TS + 1; x++) {
    ctx.drawImage(ts, 19 * TS, 0, TS, TS, x * TS, VH - 40, TS, TS);
    ctx.drawImage(ts, 1 * TS, 0, TS, TS, x * TS, VH - 24, TS, TS);
    ctx.drawImage(ts, 1 * TS, 0, TS, TS, x * TS, VH - 8, TS, TS);
  }
}
function chairCesar(x, y, t, shaking) {
  const sx = shaking ? Math.sin(t * 1.3) * 1.5 : 0;
  ctx.save(); ctx.translate(x + sx, y);
  drawSpr('cesar', 0, -6, -50, true, 1.5);
  R(-16, -46, 30, 40, '#1d1d25'); R(-14, -44, 26, 36, '#c02a2a'); R(-10, -40, 18, 4, '#1d1d25');
  R(-2, -6, 4, 10, '#333'); R(-16, 4, 30, 3, '#333'); R(-16, 7, 4, 3, '#111'); R(10, 7, 4, 3, '#111');
  ctx.restore();
  if (shaking && (t >> 3) % 2) txt(pick(['ñaca', 'plap', '*rechina*', 'ñiqui']), x + 30, y - 70 + rnd(-2, 2), '#ff7ab0', 'center');
}
function drawCuartoDecor() {
  // cama
  R(3 * TS, 9 * TS + 4, 5 * TS, 3 * TS - 4, '#3a2a5a'); R(3 * TS, 9 * TS, 5 * TS, 6, '#7a5ab0'); R(3 * TS + 2, 9 * TS - 6, 18, 8, '#e8e0f0');
  for (let k = 0; k < 6; k++) R(3 * TS + 10 + k * 11, 9 * TS + 10 + (k % 2) * 6, 6, 5, '#f4f6fb');   // pañuelos
  // escritorio + PC
  R(16 * TS + 4, 8 * TS + 6, 4, 4 * TS - 6, '#3a2a1a'); R(21 * TS - 8, 8 * TS + 6, 4, 4 * TS - 6, '#3a2a1a');
  R(17 * TS, 5 * TS + 4, 44, 30, '#111'); R(17 * TS + 2, 5 * TS + 6, 40, 24, (G.t >> 2) % 2 ? '#3fa3ff' : '#4fb3ff');
  ctx.font = '5px ' + FONT; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.fillText('TRESEQUIS', 17 * TS + 4, 5 * TS + 14);
  R(17 * TS + 18, 5 * TS + 34, 8, 8, '#111');
  // repisa con crema
  drawSpr('crema', 0, 10 * TS, 5 * TS, false); drawSpr('rollo', 0, 12 * TS, 5 * TS, false); drawSpr('agua', 0, 13 * TS + 4, 5 * TS, false);
  // póster
  R(8 * TS, 2 * TS + 8, 30, 36, '#ff7ab0'); R(8 * TS + 3, 2 * TS + 11, 24, 30, '#ffd0e8'); txt('M', 8 * TS + 11, 2 * TS + 20, '#c94f84', 'left', 8, null);
  if (G.cesarSitting) chairCesar(19 * TS, 12 * TS - 2, G.t, true);
  if (W && W.kazooFan) {
    drawSpr('kazoo', (G.t >> 4) % 2 ? 5 : 0, 1 * TS, 12 * TS - SPR.kazoo.h, false);
    if ((G.t >> 5) % 3 === 0) txt('¡DÉLE, DOÑA LUPE!', 2 * TS, 12 * TS - 40, '#ffd23f', 'left');
  }
}
function drawSceneBG(bg, t, cesarInChair) {
  const themeOf = { calle: 'calle', puerta: 'calle', mercado: 'mercado', fabrica: 'fabrica', drenaje: 'drenaje', iglesia: 'iglesia', red: 'red', dimension: 'dimension', casa: 'casa', cuarto: 'cuarto', taqueria: 'calle' };
  if (bg === 'negro') { R(0, 0, VW, VH, '#000'); return; }
  if (bg === 'espacio') {
    R(0, 0, VW, VH, '#020008');
    const R2 = mulberry(5);
    for (let i = 0; i < 140; i++) { const x = R2() * VW, y = R2() * VH; R(x, y, 1, 1, R2() < 0.2 ? '#ffd23f' : '#fff'); }
    const r = 20 + Math.sin(t / 8) * 6 + t * 0.05;
    ctx.fillStyle = '#ff7ab0'; ctx.beginPath(); ctx.arc(VW / 2, VH / 2 - 20, r, 0, 7); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(VW / 2, VH / 2 - 20, r * 0.5, 0, 7); ctx.fill();
    return;
  }
  if (bg === 'lab') {
    R(0, 0, VW, VH, '#16202a');
    for (let x = 0; x < VW; x += 24) R(x, 0, 1, VH - 40, '#1e2a36');
    R(20, 40, 120, 90, '#0d1218'); R(24, 44, 112, 82, '#123');
    for (let i = 0; i < 112; i += 2) R(24 + i, 85 + Math.sin((i + t * 2) / 4) * (10 + i / 8), 2, 2, '#5cdc6a');
    txt('SISMÓGRAFO', 80, 48, '#5cdc6a', 'center');
    R(250, 50, 90, 80, '#2b3440'); R(256, 56, 78, 30, '#000'); txt('CHAQUETÓ-', 295, 60, '#ffd23f', 'center'); txt('METRO', 295, 72, '#ffd23f', 'center');
    for (let k = 0; k < 5; k++) R(260 + k * 15, 96, 10, 10, (t >> 3) % 5 === k ? '#ff3b3b' : '#552');
    R(0, VH - 40, VW, 40, '#2a3440'); R(0, VH - 40, VW, 2, '#4a5868');
    return;
  }
  if (bg === 'funeral') {
    R(0, 0, VW, VH, '#6a7280');
    for (let i = 0; i < 40; i++) R((i * 53 + t) % VW, (i * 37 + t * 3) % VH, 1, 4, '#9aa3b0');
    groundStrip('calle');
    R(150, VH - 70, 90, 30, '#3a2210'); R(152, VH - 68, 86, 6, '#5a3a1a');
    R(240, VH - 64, 14, 8, '#eebf95'); txt('← SU MANO', 290, VH - 66, '#fff', 'center');
    for (let k = 0; k < 5; k++) { R(60 + k * 8, VH - 52, 6, 6, ['#ff7ab0', '#ffd23f', '#fff'][k % 3]); R(62 + k * 8, VH - 46, 2, 8, '#3a9a3a'); }
    return;
  }
  const th = themeOf[bg] || 'calle';
  drawBG(th, 0, t, 0);
  groundStrip(th);
  if (bg === 'puerta') {
    const hx = 230;
    R(hx, VH - 150, 150, 110, '#4fb0c6'); R(hx - 6, VH - 160, 162, 12, '#c0563a');
    R(hx + 20, VH - 100, 34, 60, '#3a2210'); R(hx + 46, VH - 72, 4, 4, '#ffd23f');
    R(hx + 80, VH - 120, 40, 30, '#111'); R(hx + 82, VH - 118, 36, 26, (t >> 2) % 2 ? '#3fa3ff' : '#2a6ad0');
    R(hx + 70, VH - 60, 22, 14, '#ddd'); txt('VENTANITA', hx + 81, VH - 74, '#000', 'center', 8, null);
    if ((t >> 3) % 2) R(hx + 85, VH - 115, 8, 8, '#eebf95');
  }
  if (bg === 'cuarto') {
    R(20, VH - 80, 90, 40, '#3a2a5a'); R(20, VH - 84, 90, 6, '#7a5ab0');
    R(220, VH - 120, 60, 40, '#111'); R(223, VH - 117, 54, 32, (t >> 2) % 2 ? '#3fa3ff' : '#4fb3ff');
    R(200, VH - 78, 110, 6, '#5a3a1a');
    if (cesarInChair) chairCesar(250, VH - 42, t, true);
  }
  if (bg === 'taqueria') {
    R(120, VH - 120, 180, 80, '#c0563a'); R(110, VH - 132, 200, 16, '#ffd23f');
    txt('TACOS MANUELA', 210, VH - 128, '#c0563a', 'center');
    R(130, VH - 96, 160, 8, '#e8e0c8'); R(130, VH - 88, 160, 48, '#8a3a2a');
    drawSpr('taco', 0, 150, VH - 112); drawSpr('taco', 0, 250, VH - 112);
  }
}

/* ====================== ARRANQUE ====================== */
function frame(now) {
  if (!frame.last) frame.last = now;
  let dt = Math.min(100, now - frame.last); frame.last = now;
  frame.acc = (frame.acc || 0) + dt;
  let steps = 0;
  // un error en un cuadro no debe congelar todo el juego: se reporta y se sigue
  try {
    while (frame.acc >= 1000 / 60 && steps < 4) { G.update(); frame.acc -= 1000 / 60; steps++; }
    if (steps === 4) frame.acc = 0;
    G.draw();
  } catch (e) { console.error(e); frame.acc = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none'; }
  requestAnimationFrame(frame);
}
buildSprites();
G.load();
(document.fonts && document.fonts.load ? document.fonts.load('8px "Press Start 2P"') : Promise.resolve()).catch(() => {}).then(() => {
  requestAnimationFrame(frame);
});
// pausa automática al cambiar de pestaña
document.addEventListener('visibilitychange', () => { if (document.hidden && G.state === 'play' && !G.dlg) { G.state = 'pause'; G.menu = 0; } });
