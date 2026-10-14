'use strict';
/* =========================================================
   NIVELES · se construyen con un "builder" por segmentos
   Fila 12 = piso normal (altura 2). Cajas a la fila 8.
   ========================================================= */
class LB {
  constructor(theme, opts = {}) {
    this.theme = theme; this.w = opts.w || 400; this.h = 14;
    this.map = new Uint8Array(this.w * 14); this.cont = {}; this.ents = []; this.x = 0; this.gh = 2;
    this.low = []; this.rooms = {}; this.arena = null; this.start = { x: 2, y: 9 };
  }
  set(x, y, t) { if (x >= 0 && x < this.w && y >= 0 && y < 14) this.map[y * this.w + x] = t; }
  get(x, y) { return (x >= 0 && x < this.w && y >= 0 && y < 14) ? this.map[y * this.w + x] : 0; }
  ground(len, h) {
    if (h !== undefined) this.gh = h;
    const s = this.x;
    for (let x = s; x < s + len; x++) for (let y = 14 - this.gh; y < 14; y++) this.set(x, y, 1);
    this.x += len; return s;
  }
  gap(len, water) {
    const s = this.x;
    if (water) for (let x = s; x < s + len; x++) { this.set(x, 12, 11); this.set(x, 13, 12); }
    this.x += len; return s;
  }
  top(x) {
    const s = t => SOLID[t] || t === 9;
    if (!s(this.get(x, 13))) return 14;
    let y = 13; while (y > 0 && s(this.get(x, y - 1))) y--;
    return y;
  }
  blocks(x, y, str) {
    const K = { '?': 'coin', T: 'taco', C: 'chancla', A: 'agua', K: 'kazoo', U: 'concha' };
    for (let i = 0; i < str.length; i++) {
      const ch = str[i], cx = x + i, key = y * this.w + cx;
      if (ch === ' ') continue;
      if (K[ch]) { this.set(cx, y, 3); this.cont[key] = K[ch]; }
      else if (ch === 'B') this.set(cx, y, 2);
      else if (ch === 'M') { this.set(cx, y, 2); this.cont[key] = 'multi'; }
      else if (ch === 'H') { this.set(cx, y, 14); this.cont[key] = 'concha'; }
      else if (ch === 'h') { this.set(cx, y, 14); this.cont[key] = 'coin'; }
      else if (ch === '#') this.set(cx, y, 13);
      else if (ch === '=') this.set(cx, y, 9);
      else if (ch === '^') this.set(cx, y, 10);
      else if (ch === 'X') this.set(cx, y, 17);
      else if (ch === '>') this.set(cx, y, 15);
      else if (ch === '<') this.set(cx, y, 16);
      else if (ch === 'o') this.ents.push({ t: 'coin', x: cx * TS, y: y * TS });
    }
  }
  col(x, y0, y1, t = 13) { for (let y = y0; y <= y1; y++) this.set(x, y, t); }
  coins(x, y, n, step = 1) { for (let i = 0; i < n; i++) this.ents.push({ t: 'coin', x: (x + i * step) * TS, y: y * TS }); }
  arc(x, y, n) { for (let i = 0; i < n; i++) { const d = Math.round(Math.sin(i / (n - 1) * Math.PI) * 2); this.ents.push({ t: 'coin', x: (x + i) * TS, y: (y - d) * TS }); } }
  pipe(x, h, warp) {
    const top = this.top(x), ty = top - h;
    this.set(x, ty, 5); this.set(x + 1, ty, 6);
    for (let y = ty + 1; y < top; y++) { this.set(x, y, 7); this.set(x + 1, y, 8); }
    if (warp) this.ents.push({ t: 'warp', x: x * TS, y: ty * TS, ...warp });
    return ty;
  }
  stair(x, n, dir = 1) {
    for (let i = 0; i < n; i++) {
      const c = x + i, hgt = dir > 0 ? i + 1 : n - i, base = this.top(c);
      for (let k = 0; k < hgt; k++) this.set(c, base - 1 - k, 13);
    }
  }
  e(t, x, row, extra) { this.ents.push({ t, x: x * TS, row: row === undefined ? null : row, ...(extra || {}) }); }
  sign(x, key) { this.ents.push({ t: 'sign', x: x * TS, key }); }
  npc(x, who, talk, dir = -1) { this.ents.push({ t: 'npc', x: x * TS, who, talk, dir }); }
  foto(x, y, id) { this.ents.push({ t: 'foto', x: x * TS, y: y * TS, id }); }
  mitem(x, y, id) { this.ents.push({ t: 'mitem', x: x * TS, y: y * TS, id }); }
  check(x) { this.ents.push({ t: 'check', x: x * TS }); }
  goal(x) { this.ents.push({ t: 'goal', x: x * TS }); }
  mplat(x, y, len, o) { this.ents.push({ t: 'mplat', x: x * TS, y: y * TS, len, ...o }); }
  lowgrav(a, b) { this.low.push([a * TS, b * TS]); }
  arenaBoss(boss) {
    const s = this.ground(24, 2);
    this.col(s, 0, 11, 18); this.col(s + 23, 0, 11, 18);
    this.set(s, 11, 0); this.set(s, 10, 0); this.set(s, 9, 0);     // entrada
    this.arena = { x0: s, boss };
    return s;
  }
  room(name, build) {
    const r = new LB(this.theme, { w: 24 });
    r.ground(24, 2);
    r.col(0, 0, 11, 18); r.col(23, 0, 11, 18);
    for (let x = 0; x < 24; x++) r.set(x, 0, 18);
    r.start = { x: 2, y: 4 };
    build(r);
    this.rooms[name] = r.done();
    return r;
  }
  done() {
    return { theme: this.theme, w: this.w, h: 14, map: this.map, cont: this.cont, ents: this.ents, low: this.low,
      rooms: this.rooms, arena: this.arena, start: this.start };
  }
}

/* -------------------- 1-1 · COLONIA LAS QUINTAS -------------------- */
function L11() {
  const L = new LB('calle', { w: 236 });
  L.ground(24);
  L.sign(3, 'bienvenida'); L.sign(7, 'controles');
  L.blocks(12, 8, '?B?B?'); L.blocks(14, 4, 'C');
  L.sign(10, 'chancla');
  L.e('panuelo', 20);
  L.ground(16);                       // 24-39
  L.pipe(27, 2); L.e('panuelo', 31); L.pipe(35, 3);
  L.gap(3);                           // 40-42
  L.ground(14);                       // 43-56
  L.npc(46, 'vecino', 'beto');
  L.blocks(49, 8, 'B?B'); L.e('calcetin', 54);
  L.ground(7, 3);                     // 57-63
  L.ground(7, 4);                     // 64-70
  L.coins(65, 7, 4); L.e('panuelo', 68);
  L.gap(3);                           // 71-73
  L.ground(20, 2);                    // 74-93
  L.blocks(77, 8, '?BB?'); L.blocks(82, 4, 'BBBBBB');
  L.foto(84, 2, 0); L.sign(78, 'recuerdo');
  L.e('calcetin', 88); L.e('panuelo', 90);
  L.gap(2);                           // 94-95
  L.ground(8);                        // 96-103
  L.stair(100, 4, 1);
  L.gap(2);                           // 104-105
  L.coins(103, 6, 4);
  L.ground(16);                       // 106-121
  L.stair(106, 4, -1);
  L.check(113);
  L.npc(117, 'coqui', 'coqui');
  L.ground(26);                       // 122-147
  L.blocks(124, 8, '?B?BTB'); L.blocks(126, 4, 'BMB');
  L.e('panuelo', 130); L.e('panuelo', 132); L.e('panuelo', 134);
  L.pipe(138, 4); L.sign(142, 'silla'); L.e('calcetin', 145);
  L.gap(4);                           // 148-151
  L.blocks(149, 9, '==');
  L.ground(12);                       // 152-163
  L.blocks(155, 8, 'A'); L.blocks(157, 8, 'h'); L.e('panuelo', 160);
  L.gap(3);                           // 164-166
  L.ground(30);                       // 167-196
  L.blocks(170, 9, 'BBBB'); L.blocks(171, 5, 'B?B'); L.e('calcetin', 175); L.e('calcetin', 179);
  L.sign(183, 'panuelos');
  L.pipe(186, 2); L.e('panuelo', 190); L.pipe(193, 3);
  L.ground(26);                       // 197-222
  L.stair(199, 6, 1);
  L.coins(206, 5, 3);
  L.goal(214);
  L.ground(13);
  return L.done();
}

/* -------------------- 1-2 · MERCADO GARMENDIA + DON PANCHO -------------------- */
function L12() {
  const L = new LB('mercado', { w: 260 });
  L.ground(20);
  L.sign(4, 'pancho');
  L.blocks(9, 8, '?C?');
  L.e('rollo', 18);
  L.ground(14);                       // 20-33
  L.blocks(22, 9, '===='); L.blocks(27, 6, '====');
  L.coins(27, 5, 4); L.e('crema', 32);
  L.gap(3);                           // 34-36
  L.ground(18);                       // 37-54
  L.npc(40, 'abuela', 'senora');
  L.sign(44, 'tubo');
  L.pipe(47, 3, { room: 'bodega' });
  L.e('panuelo', 51); L.e('rollo', 53);
  L.ground(6, 4);                     // 55-60
  L.e('crema', 58);
  L.ground(6, 2);                     // 61-66
  L.gap(3);                           // 67-69
  L.blocks(68, 8, '=');
  L.ground(20);                       // 70-89
  L.blocks(72, 8, 'B?B?B'); L.blocks(74, 4, 'U');
  L.e('calcetin', 80); L.e('rollo', 86);
  L.sign(78, 'crema');
  L.ground(14);                       // 90-103
  L.blocks(92, 9, '##'); L.blocks(96, 7, '##'); L.blocks(100, 5, '##');
  L.foto(100, 3, 1);
  L.e('crema', 94);
  L.gap(3);                           // 104-106
  L.ground(16);                       // 107-122
  L.check(110);
  L.e('rollo', 118); L.e('rollo', 121);
  L.blocks(114, 8, '?A?');
  L.ground(20, 3);                    // 123-142
  L.e('crema', 126); L.e('panuelo', 132); L.e('panuelo', 135);
  L.blocks(129, 7, 'BB?BB');
  L.sign(138, 'mercado');
  L.gap(2);                           // 143-144
  L.ground(10, 2);                    // 145-154
  L.e('calcetin', 150);
  L.gap(4);                           // 155-158
  L.mplat(155, 9, 3, { dx: 1, range: 40, speed: 0.6 });
  L.ground(24);                       // 159-182
  L.blocks(162, 8, 'BMBB'); L.e('rollo', 170); L.e('rollo', 176); L.e('crema', 180);
  L.ground(16);                       // 183-198
  L.stair(184, 3, 1); L.e('panuelo', 192); L.e('panuelo', 195);
  L.blocks(190, 8, 'T');
  L.ground(10);                       // 199-208
  L.sign(202, 'pancho');
  L.arenaBoss('pancho');              // 209-232
  L.ground(10);
  L.room('bodega', r => {
    r.coins(5, 6, 6); r.coins(5, 8, 6);
    r.blocks(4, 9, '########');
    r.mitem(16, 8, 0);
    r.coins(14, 5, 5);
    r.pipe(20, 2, { exit: true }); r.sign(18, 'salida');
  });
  return L.done();
}

/* -------------------- 2-1 · FÁBRICA SUAVECITO -------------------- */
function L21() {
  const L = new LB('fabrica', { w: 250 });
  L.ground(18);
  L.sign(3, 'fabrica1');
  L.blocks(8, 8, '?C?');
  L.e('rollo', 16);
  L.ground(14); L.blocks(18, 12, '>>>>>>>>>>>>>>'); // 18-31 banda
  L.e('panuelo', 26);
  L.npc(30, 'obrero', 'obrero');
  L.gap(3);                           // 32-34
  L.ground(16);                       // 35-50
  L.e('piston', 39); L.e('piston', 45);
  L.blocks(41, 7, 'B?B');
  L.sign(48, 'fabrica2');
  L.gap(4);                           // 51-54
  L.mplat(51, 10, 3, { dy: 1, range: 48, speed: 0.7 });
  L.ground(14);                       // 55-68
  L.blocks(57, 12, '<<<<<<<<<<<<');
  L.e('rollo', 64); L.e('rollo', 67);
  L.blocks(60, 8, '?T?');
  L.ground(10, 4);                    // 69-78
  L.e('crema', 74);
  L.blocks(72, 6, 'B'); L.blocks(76, 4, 'BBB'); L.foto(77, 3, 2);
  L.gap(3, false);                    // 79-81
  L.ground(18, 2);                    // 82-99
  L.check(84);
  L.e('piston', 90); L.e('piston', 94); L.e('calcetin', 97);
  L.sign(87, 'fabrica3');
  L.gap(5);                           // 100-104
  L.mplat(100, 9, 3, { dx: 1, range: 40, speed: 0.8 });
  L.ground(20);                       // 105-124
  L.blocks(107, 12, '>>>>>>>>');
  L.blocks(110, 8, 'BMB?B');
  L.e('panuelo', 115); L.e('panuelo', 117); L.e('rollo', 122);
  L.ground(14);                       // 125-138
  L.stair(126, 4, 1);
  L.gap(3);                           // 139-141
  L.mplat(139, 8, 2, { dy: 1, range: 32, speed: 0.6 });
  L.ground(10, 6);                    // 142-151
  L.e('crema', 147);
  L.blocks(144, 3, 'A');
  L.ground(10, 2);                    // 152-161
  L.e('calcetin', 156); L.e('calcetin', 159);
  L.gap(3);                           // 162-164
  L.ground(24);                       // 165-188
  L.blocks(166, 12, '<<<<<<<<<<<<<<<<<<');
  L.e('piston', 170); L.e('piston', 176); L.e('piston', 182);
  L.coins(171, 8, 2); L.coins(177, 8, 2);
  L.ground(30);                       // 189-218
  L.blocks(192, 8, '?B?B?'); L.e('rollo', 200); L.e('rollo', 204); L.e('panuelo', 208);
  L.stair(210, 6, 1);
  L.goal(224);
  L.ground(26);
  return L.done();
}

/* -------------------- 2-2 · DRENAJE PROFUNDO + EL TAPONAZO -------------------- */
function L22() {
  const L = new LB('drenaje', { w: 262 });
  L.ground(16);
  L.sign(4, 'drenaje1');
  L.blocks(9, 8, '?C?');
  L.gap(3, true);                     // 16-18
  L.ground(12);                       // 19-30
  L.e('rata', 25); L.e('rata', 28);
  L.npc(21, 'plomero', 'plomero', 1);
  L.gap(4, true);                     // 31-34
  L.blocks(32, 9, '##');
  L.ground(14);                       // 35-48
  L.e('gota', 38); L.e('gota', 43);
  L.blocks(40, 8, 'B?B');
  L.e('panuelo', 46);
  L.gap(3, true);                     // 49-51
  L.e('salto', 50);
  L.ground(16);                       // 52-67
  L.sign(53, 'drenaje2');
  L.pipe(58, 2, { room: 'cloaca' });
  L.e('rata', 62); L.e('rata', 65);
  L.gap(5, true);                     // 68-72
  L.mplat(68, 9, 2, { dx: 1, range: 40, speed: 0.6 });
  L.e('salto', 70);
  L.ground(18);                       // 73-90
  L.blocks(75, 8, '?T?'); L.blocks(80, 4, 'BBB'); L.foto(81, 2, 3);
  L.blocks(79, 8, 'BB');
  L.e('gota', 84); L.e('panuelo', 87);
  L.check(89);
  L.gap(3, true);                     // 91-93
  L.ground(12, 4);                    // 94-105
  L.e('rata', 98); L.e('crema', 103);
  L.gap(3, true);                     // 106-108
  L.ground(14, 2);                    // 109-122
  L.sign(110, 'drenaje3');
  L.e('rata', 116); L.e('rata', 118); L.e('rata', 120);
  L.blocks(113, 8, 'BMB');
  L.gap(6, true);                     // 123-128
  L.blocks(124, 9, '=='); L.blocks(127, 7, '==');
  L.e('salto', 126);
  L.ground(16);                       // 129-144
  L.e('gota', 133); L.e('gota', 137); L.e('panuelo', 141);
  L.blocks(134, 8, 'A');
  L.gap(4, true);                     // 145-148
  L.mplat(145, 9, 2, { dy: 1, range: 40, speed: 0.8 });
  L.ground(20);                       // 149-168
  L.pipe(152, 3); L.e('rata', 157); L.pipe(161, 4); L.e('rata', 165);
  L.gap(3, true);                     // 169-171
  L.ground(28);                       // 172-199
  L.blocks(175, 8, '?B?B?'); L.e('panuelo', 182); L.e('panuelo', 185); L.e('calcetin', 190);
  L.blocks(194, 8, 'T');
  L.ground(10);                       // 200-209
  L.arenaBoss('taponazo');            // 210-233
  L.ground(10);
  L.room('cloaca', r => {
    r.blocks(4, 9, '###'); r.blocks(9, 7, '###'); r.blocks(14, 5, '###');
    r.mitem(15, 3, 1);
    r.coins(4, 8, 3); r.coins(9, 6, 3); r.coins(17, 9, 3);
    r.pipe(20, 2, { exit: true }); r.sign(18, 'salida');
  });
  return L.done();
}

/* -------------------- 3-1 · PARROQUIA SAN ONOFRE -------------------- */
function L31() {
  const L = new LB('iglesia', { w: 248 });
  L.ground(18);
  L.sign(4, 'iglesia1');
  L.blocks(9, 8, '?C?');
  L.e('testigo', 15);
  L.ground(12);                       // 18-29
  L.npc(20, 'monaguillo', 'monaguillo', 1);
  L.blocks(23, 8, 'BBB'); L.e('glitch', 27, 5);
  L.gap(3);                           // 30-32
  L.ground(16, 3);                    // 33-48
  L.e('testigo', 40); L.e('calcetin', 45);
  L.blocks(37, 7, '?A?');
  L.sign(34, 'iglesia2');
  L.ground(4, 5);                     // 49-52
  L.ground(4, 7);                     // 53-56
  L.ground(10, 9);                    // 57-66  (campanario)
  L.pipe(62, 2, { room: 'campanario' });
  L.e('glitch', 58, 2);
  L.ground(4, 6);                     // 67-70
  L.ground(4, 3);                     // 71-74
  L.ground(12, 2);                    // 75-86
  L.e('testigo', 80); L.e('testigo', 84);
  L.blocks(77, 8, 'B?B?B');
  L.gap(3);                           // 87-89
  L.ground(16);                       // 90-105
  L.check(92);
  L.blocks(96, 9, '='); L.blocks(98, 7, '='); L.blocks(100, 5, '='); L.blocks(102, 3, '===');
  L.foto(103, 1, 4);
  L.e('glitch', 99, 4); L.e('calcetin', 104);
  L.gap(4);                           // 106-109
  L.blocks(107, 9, '==');
  L.ground(20);                       // 110-129
  L.sign(111, 'iglesia3');
  L.e('testigo', 118); L.e('testigo', 121); L.e('panuelo', 125);
  L.blocks(115, 8, 'BMBTB');
  L.ground(12, 4);                    // 130-141
  L.e('crema', 136); L.e('glitch', 139, 3);
  L.gap(3);                           // 142-144
  L.ground(24, 2);                    // 145-168
  L.blocks(148, 8, '?B?'); L.e('testigo', 155); L.e('calcetin', 160); L.e('calcetin', 164);
  L.gap(3);                           // 169-171
  L.ground(30);                       // 172-201
  L.stair(176, 5, 1);
  L.e('glitch', 186, 4); L.e('testigo', 192);
  L.blocks(188, 8, 'A');
  L.npc(205, 'padre', 'padre');
  L.ground(20);                       // 202-221
  L.goal(216);
  L.ground(26);
  L.room('campanario', r => {
    r.blocks(3, 9, '=='); r.blocks(7, 7, '=='); r.blocks(11, 5, '=='); r.blocks(15, 4, '===');
    r.mitem(16, 2, 2);
    r.coins(4, 8, 2); r.coins(8, 6, 2); r.coins(12, 4, 2);
    r.e('glitch', 10, 3);
    r.pipe(20, 2, { exit: true }); r.sign(18, 'salida');
  });
  return L.done();
}

/* -------------------- 3-2 · LA RED + POP-UP SUPREMO -------------------- */
function L32() {
  const L = new LB('red', { w: 256 });
  L.ground(18);
  L.sign(3, 'red1');
  L.blocks(8, 8, '?C?');
  L.e('popup', 14, 6);
  L.gap(3);                           // 18-20
  L.ground(10);                       // 21-30
  L.npc(23, 'asistente', 'asistente', 1);
  L.e('popup', 28, 5);
  L.gap(4);                           // 31-34
  L.blocks(32, 9, '==');
  L.ground(14);                       // 35-48
  L.blocks(37, 8, 'B?B?B'); L.e('popup', 42, 4); L.e('popup', 46, 6);
  L.sign(39, 'red2');
  L.gap(3);                           // 49-51
  L.ground(8, 4);                     // 52-59
  L.e('crema', 57);
  L.gap(4);                           // 60-63
  L.mplat(60, 8, 3, { dx: 1, range: 32, speed: 0.8 });
  L.ground(16, 2);                    // 64-79
  L.blocks(66, 8, 'XXXXXX'); L.blocks(68, 4, 'BBB'); L.foto(69, 2, 5);
  L.e('popup', 72, 5); L.e('panuelo', 76);
  L.check(78);
  L.gap(5);                           // 80-84
  L.blocks(81, 9, '='); L.blocks(83, 8, 'X');
  L.ground(18);                       // 85-102
  L.sign(86, 'red3');
  L.e('popup', 90, 4); L.e('popup', 94, 6); L.e('popup', 98, 4);
  L.blocks(92, 8, '?T?');
  L.gap(3);                           // 103-105
  L.ground(10, 5);                    // 106-115
  L.e('crema', 109); L.e('crema', 113);
  L.gap(3);                           // 116-118
  L.ground(14, 2);                    // 119-132
  L.blocks(121, 8, 'BMBAB');
  L.e('popup', 126, 5); L.e('panuelo', 129);
  L.gap(6);                           // 133-138
  L.blocks(134, 9, 'XX'); L.blocks(137, 8, '==');
  L.ground(20);                       // 139-158
  L.e('popup', 144, 4); L.e('popup', 148, 6); L.e('popup', 152, 3);
  L.blocks(146, 8, '?B?');
  L.ground(24);                       // 159-182
  L.sign(160, 'red4');
  L.e('panuelo', 166); L.e('panuelo', 168); L.e('calcetin', 172);
  L.blocks(176, 8, 'T');
  L.ground(10);                       // 183-192
  L.arenaBoss('popup');               // 193-216
  L.ground(10);
  return L.done();
}

/* -------------------- 4-1 · LA IMAGINACIÓN DE CÉSAR -------------------- */
function L41() {
  const L = new LB('dimension', { w: 250 });
  L.ground(16);
  L.sign(3, 'dim1');
  L.blocks(8, 8, '?C?');
  L.npc(13, 'astro', 'astro');
  L.gap(4);                           // 16-19
  L.blocks(17, 9, 'XX');
  L.ground(12);                       // 20-31
  L.e('glitch', 25, 5); L.e('calcetin', 29);
  L.sign(21, 'dim3');
  L.lowgrav(32, 70);
  L.gap(6);                           // 32-37
  L.blocks(34, 8, '==');
  L.ground(8, 4);                     // 38-45
  L.e('popup', 42, 3);
  L.gap(6);                           // 46-51
  L.blocks(48, 6, '==');
  L.ground(8, 6);                     // 52-59
  L.blocks(54, 2, 'BBB'); L.foto(55, 0, 6);
  L.gap(6);                           // 60-65
  L.blocks(62, 7, 'XX');
  L.ground(16, 2);                    // 66-81
  L.check(68);
  L.sign(72, 'dim2');
  L.e('glitch', 76, 4); L.e('panuelo', 79);
  L.blocks(74, 8, '?A?');
  L.gap(3);                           // 82-84
  L.ground(14);                       // 85-98
  L.blocks(87, 8, 'XXXX'); L.blocks(93, 6, 'XXXX');
  L.e('glitch', 90, 3); L.e('rollo', 96);
  L.gap(5);                           // 99-103
  L.mplat(99, 8, 2, { dy: 1, range: 48, speed: 1 });
  L.ground(20);                       // 104-123
  L.blocks(107, 8, 'B?B?B'); L.blocks(109, 4, 'K');
  L.e('calcetin', 113); L.e('calcetin', 116); L.e('popup', 119, 4);
  L.lowgrav(124, 160);
  L.gap(8);                           // 124-131
  L.blocks(126, 8, 'X'); L.blocks(129, 6, 'X');
  L.ground(10, 5);                    // 132-141
  L.e('glitch', 137, 3);
  L.gap(8);                           // 142-149
  L.blocks(144, 7, 'X'); L.blocks(147, 9, 'X');
  L.ground(30, 2);                    // 150-179
  L.e('panuelo', 155); L.e('panuelo', 158); L.e('crema', 165); L.e('glitch', 170, 4);
  L.blocks(160, 8, 'BMBTB');
  L.gap(4);                           // 180-183
  L.mplat(180, 9, 2, { dx: 1, range: 32, speed: 0.9 });
  L.ground(30);                       // 184-213
  L.stair(186, 5, 1); L.e('calcetin', 196); L.e('rollo', 202);
  L.goal(218);
  L.ground(30);
  return L.done();
}

/* -------------------- 4-2 · LA CASA DE CÉSAR + FIRULAIS -------------------- */
function L42() {
  const L = new LB('casa', { w: 236 });
  L.ground(16);
  L.sign(3, 'casa1');
  L.blocks(8, 8, '?C?');
  L.e('calcetin', 13);
  L.ground(14);                       // 16-29
  L.npc(18, 'abuela', 'abuela', 1);
  L.blocks(22, 9, '####');
  L.e('panuelo', 27);
  L.gap(3);                           // 30-32
  L.ground(4, 3); L.ground(4, 4); L.ground(4, 5); L.ground(4, 6); // 33-48 escaleras
  L.e('rollo', 46);
  L.ground(12, 6);                    // 49-60
  L.blocks(51, 5, 'BBBB'); L.foto(52, 3, 7);
  L.e('calcetin', 55); L.e('crema', 59);
  L.ground(4, 4); L.ground(4, 2);     // 61-68
  L.sign(66, 'casa2');
  L.ground(16);                       // 69-84
  L.blocks(71, 8, 'B?B?B');
  L.e('panuelo', 76); L.e('panuelo', 78); L.e('panuelo', 80);
  L.check(83);
  L.gap(4);                           // 85-88
  L.blocks(86, 9, '##');
  L.ground(16);                       // 89-104
  L.blocks(91, 12, '^^^'); L.blocks(91, 8, '===');
  L.e('rollo', 100); L.blocks(97, 8, 'A');
  L.ground(14);                       // 105-118
  L.e('calcetin', 108); L.e('calcetin', 111); L.e('calcetin', 114);
  L.blocks(110, 8, 'BMB');
  L.gap(3);                           // 119-121
  L.ground(16);                       // 122-137
  L.stair(124, 4, 1); L.e('crema', 133);
  L.blocks(129, 8, 'T');
  L.sign(136, 'casa3');
  L.ground(10);                       // 138-147
  L.arenaBoss('firulais');            // 148-171
  L.ground(10);
  return L.done();
}

/* -------------------- FINAL · EL CUARTO -------------------- */
function LFinal() {
  const L = new LB('cuarto', { w: 24 });
  L.ground(24, 2);
  L.col(0, 0, 11, 18); L.col(23, 0, 11, 18);
  L.blocks(3, 9, '=====');           // cama
  L.blocks(16, 8, '=====');          // escritorio
  L.blocks(9, 6, '======');          // repisa
  L.start = { x: 2, y: 9 };
  L.arena = { x0: 0, boss: null, final: true };
  return L.done();
}

const LEVELS = [
  { id: '1-1', name: 'COLONIA LAS QUINTAS', build: L11, music: 'calle', pre: 'prologo' },
  { id: '1-2', name: 'MERCADO GARMENDIA', build: L12, music: 'mercado', pre: 'pre12', post: 'post12' },
  { id: '2-1', name: 'FÁBRICA SUAVECITO', build: L21, music: 'fabrica', pre: 'pre21', post: 'post21' },
  { id: '2-2', name: 'EL DRENAJE PROFUNDO', build: L22, music: 'drenaje', post: 'post22', ritmoBonus: -10 },
  { id: '3-1', name: 'PARROQUIA SAN ONOFRE', build: L31, music: 'iglesia' },
  { id: '3-2', name: 'LA RED', build: L32, music: 'red', post: 'post32', ritmoBonus: -10 },
  { id: '4-1', name: 'LA IMAGINACIÓN DE CÉSAR', build: L41, music: 'dimension' },
  { id: '4-2', name: 'LA CASA DE CÉSAR', build: L42, music: 'casa', pre: 'pre42', post: 'llegada' },
  { id: 'F', name: 'EL CUARTO', build: LFinal, music: 'tension' },
];
// qué nivel tiene recuerdo / objeto de mamá (para el HUD y el menú)
const LEVEL_FOTO = { '1-1': 0, '1-2': 1, '2-1': 2, '2-2': 3, '3-1': 4, '3-2': 5, '4-1': 6, '4-2': 7 };
const LEVEL_MAMA = { '1-2': 0, '2-2': 1, '3-1': 2 };
