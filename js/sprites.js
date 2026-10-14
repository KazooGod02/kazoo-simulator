'use strict';
/* =========================================================
   SPRITES: personajes, enemigos, objetos, tiles y fondos
   (todo se dibuja con código, pixel por pixel)
   ========================================================= */
const SPR = {};
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function flipC(c) { const o = mk(c.width, c.height), g = o.getContext('2d'); g.translate(c.width, 0); g.scale(-1, 1); g.drawImage(c, 0, 0); return o; }
function strSprite(rows, pal) {
  const h = rows.length, w = Math.max(...rows.map(r => r.length));
  const c = mk(w, h), g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < rows[y].length; x++) {
    const col = pal[rows[y][x]]; if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
  }
  return c;
}
function reg(name, frames) { SPR[name] = { r: frames, l: frames.map(flipC), w: frames[0].width, h: frames[0].height }; }
function drawSpr(name, f, x, y, left, scale = 1) {
  const s = SPR[name]; if (!s) return;
  const arr = left ? s.l : s.r;
  const c = arr[((f % arr.length) + arr.length) % arr.length];
  if (scale === 1) ctx.drawImage(c, Math.round(x), Math.round(y));
  else ctx.drawImage(c, Math.round(x), Math.round(y), c.width * scale, c.height * scale);
}

/* ---------------- HUMANOS ---------------- */
const CAST = {
  kazoo: { hairTop: 3, torso: 8, legs: 6, style: 'curly', skin: '#9b6239', skin2: '#74431f', hair: '#140e0a', hair2: '#3a2619',
    shirt: '#f0b429', shirt2: '#c08515', sleeve: 'short', pants: '#3b5288', pants2: '#26365e', shoes: '#f4f4f4', shoes2: '#9aa0aa', logo: '#7a2e0e' },
  cesar: { hairTop: 1, torso: 7, legs: 5, style: 'short', skin: '#eebf95', skin2: '#c8926b', hair: '#2b1b12', hair2: '#4a3022',
    shirt: '#4f78b3', shirt2: '#35558a', tee: '#f2f2f2', sleeve: 'long', pants: '#8b8c99', pants2: '#6b6c78', shoes: '#2f62d6', shoes2: '#1d3f94',
    chubby: true, bags: true, stubble: true },
  mama: { hairTop: 2, torso: 7, legs: 5, style: 'curlers', skin: '#d8a173', skin2: '#b07a50', hair: '#3a2318', hair2: '#5a3a28',
    shirt: '#d94f7d', shirt2: '#a8345b', apron: '#f6f1e6', skirt: true, sleeve: 'short', pants: '#d94f7d', pants2: '#a8345b', shoes: '#ff7ab0', shoes2: '#c94f84' },
  doctor: { hairTop: 1, torso: 8, legs: 6, style: 'bald', skin: '#e3b28a', skin2: '#b9875f', hair: '#9a9a9a', hair2: '#cfcfcf',
    shirt: '#f4f4f4', shirt2: '#c3ccd6', sleeve: 'long', pants: '#3f4652', pants2: '#2b313b', shoes: '#4a2f22', shoes2: '#2e1c14', glasses: true, coat: true, mustache: true },
  padre: { hairTop: 1, torso: 8, legs: 6, style: 'short', skin: '#d9a77c', skin2: '#ad7c55', hair: '#b8b8b8', hair2: '#e0e0e0',
    shirt: '#1d1d25', shirt2: '#0f0f15', sleeve: 'long', pants: '#1d1d25', pants2: '#0f0f15', shoes: '#111', shoes2: '#000', collar: true, glasses: true },
  vecino: { hairTop: 1, torso: 8, legs: 5, style: 'bald', skin: '#c98d5f', skin2: '#9c6a42', hair: '#2a1a12', hair2: '#4a3022',
    shirt: '#f1f1f1', shirt2: '#c9c9c9', sleeve: 'none', pants: '#4a5aa0', pants2: '#323f78', shoes: '#7a4a2a', shoes2: '#4a2a1a', chubby: true, mustache: true },
  pancho: { hairTop: 2, torso: 8, legs: 5, style: 'cap', cap: '#d13b2f', skin: '#c88a5a', skin2: '#9b6339', hair: '#1f140e', hair2: '#3a2619',
    shirt: '#3fa34d', shirt2: '#2b7a36', apron: '#f6f1e6', sleeve: 'short', pants: '#5b4636', pants2: '#3d2f24', shoes: '#2a1a12', shoes2: '#150d08', chubby: true, mustache: true },
  coqui: { hairTop: 1, torso: 8, legs: 6, style: 'short', skin: '#b27a4c', skin2: '#86562f', hair: '#0e0e0e', hair2: '#2b2b2b',
    shirt: '#2e2e36', shirt2: '#1c1c22', sleeve: 'short', pants: '#1f2a3d', pants2: '#141c2a', shoes: '#0d0d0d', shoes2: '#000', stubble: true },
  ghenghis: { hairTop: 2, torso: 8, legs: 6, style: 'cap', cap: '#2e6bd1', skin: '#d6a070', skin2: '#a87548', hair: '#2a1a12', hair2: '#4a3022',
    shirt: '#c43c3c', shirt2: '#922b2b', sleeve: 'short', pants: '#3f3f46', pants2: '#2a2a30', shoes: '#eee', shoes2: '#999', chubby: true },
  testigo: { hairTop: 1, torso: 8, legs: 6, style: 'short', skin: '#efc39b', skin2: '#c89670', hair: '#c9a24a', hair2: '#e6c66d',
    shirt: '#f4f4f4', shirt2: '#cdd5df', sleeve: 'short', pants: '#22232b', pants2: '#15161c', shoes: '#111', shoes2: '#000', tie: '#1f3f8a' },
  obrero: { hairTop: 2, torso: 8, legs: 6, style: 'cap', cap: '#ffcc22', skin: '#a8703f', skin2: '#7c4e28', hair: '#1a1a1a', hair2: '#333',
    shirt: '#e86a1c', shirt2: '#b04f12', sleeve: 'short', pants: '#2f4d7a', pants2: '#1f3355', shoes: '#4a2f22', shoes2: '#2e1c14', mustache: true },
  abuela: { hairTop: 2, torso: 7, legs: 4, style: 'bun', skin: '#e0b089', skin2: '#b8865e', hair: '#dcdcdc', hair2: '#ffffff',
    shirt: '#7b5ea8', shirt2: '#5a4280', skirt: true, sleeve: 'long', pants: '#7b5ea8', pants2: '#5a4280', shoes: '#333', shoes2: '#111', glasses: true },
  plomero: { hairTop: 2, torso: 8, legs: 6, style: 'cap', cap: '#3a7bd5', skin: '#d39a6a', skin2: '#a66f42', hair: '#2a1a12', hair2: '#4a3022',
    shirt: '#3a7bd5', shirt2: '#2a5ca6', sleeve: 'short', pants: '#3a7bd5', pants2: '#2a5ca6', shoes: '#4a2f22', shoes2: '#2e1c14', mustache: true, chubby: true },
  astro: { hairTop: 1, torso: 8, legs: 6, style: 'helmet', skin: '#e3b28a', skin2: '#b9875f', hair: '#e8e8f0', hair2: '#ffffff',
    shirt: '#e8e8f0', shirt2: '#b9bccb', sleeve: 'long', pants: '#e8e8f0', pants2: '#b9bccb', shoes: '#8a8fa3', shoes2: '#5d6275' },
  monaguillo: { hairTop: 1, torso: 7, legs: 5, style: 'short', skin: '#c48a5e', skin2: '#9b6339', hair: '#1a110c', hair2: '#3a2619',
    shirt: '#f4f4f4', shirt2: '#cfd6df', sleeve: 'long', pants: '#c02a2a', pants2: '#8a1c1c', shoes: '#111', shoes2: '#000', skirt: true },
};
const POSES = ['stand', 'walk', 'pass', 'walk2', 'pass', 'jump', 'hurt', 'throw', 'talk'];
// índices de frame: 0 stand, 1-4 caminar, 5 salto, 6 herido, 7 lanzar, 8 hablar

function human(sp, pose) {
  const HH = 9, yH = sp.hairTop, yT = yH + HH, yL = yT + sp.torso, H = yL + sp.legs;
  const c = mk(16, H), g = c.getContext('2d');
  const P = (x, y, w, h, col) => { if (!col) return; g.fillStyle = col; g.fillRect(x, y, w, h); };
  const L = sp.legs;
  const swap = pose === 'walk2';
  const backC = swap ? sp.pants : sp.pants2, frontC = swap ? sp.pants2 : sp.pants;
  // ---- piernas ----
  const leg = (xs, col, shoeX) => {
    for (let i = 0; i < L - 1; i++) P(xs(i), yL + i, 3, 1, col);
    const sx = shoeX !== undefined ? shoeX : xs(L - 1);
    P(sx, H - 1, 4, 1, col === sp.pants2 ? sp.shoes2 : sp.shoes);
    P(sx, H - 2, 3, 1, col === sp.pants2 ? sp.shoes2 : sp.shoes);
  };
  if (sp.skirt) {
    const sk = L - 2;
    for (let i = 0; i < sk; i++) P(4 - (i >> 1), yL + i, 8 + (i >> 1) * 2, 1, i % 3 === 2 ? sp.shirt2 : sp.shirt);
    if (pose === 'walk' || pose === 'walk2') { P(4, H - 2, 2, 1, sp.skin); P(10, H - 2, 2, 1, sp.skin); P(3, H - 1, 4, 1, sp.shoes2); P(9, H - 1, 4, 1, sp.shoes); }
    else if (pose === 'jump') { P(5, H - 2, 2, 1, sp.skin); P(10, H - 3, 2, 1, sp.skin); P(4, H - 1, 4, 1, sp.shoes2); P(10, H - 2, 4, 1, sp.shoes); }
    else { P(6, H - 2, 2, 1, sp.skin); P(9, H - 2, 2, 1, sp.skin); P(5, H - 1, 4, 1, sp.shoes2); P(9, H - 1, 4, 1, sp.shoes); }
  } else if (pose === 'walk' || pose === 'walk2') {
    leg(i => 6 - Math.round(i * 0.6), backC);
    leg(i => 7 + Math.round(i * 0.6), frontC);
  } else if (pose === 'pass') {
    leg(() => 6, sp.pants2); leg(i => 7 + (i > L / 2 ? 1 : 0), sp.pants);
  } else if (pose === 'jump') {
    leg(i => 5 - (i >> 1), sp.pants2);
    for (let i = 0; i < 2; i++) P(8 + i, yL + i, 3, 1, sp.pants);
    for (let i = 2; i < L - 2; i++) P(10, yL + i, 3, 1, sp.pants);
    P(10, yL + L - 2, 4, 1, sp.shoes); P(10, yL + L - 3, 3, 1, sp.shoes);
  } else if (pose === 'hurt') {
    leg(i => 6 - i, sp.pants2); leg(i => 7 + i, sp.pants);
  } else {
    leg(() => 5, sp.pants2); leg(() => 8, sp.pants);
  }
  if (sp.coat) { P(4, yL, 8, 2, sp.shirt); P(4, yL, 1, 2, sp.shirt2); }
  // ---- torso ----
  const bx = sp.chubby ? 3 : 4, bw = sp.chubby ? 10 : 8;
  P(bx, yT + 1, bw, sp.torso - 1, sp.shirt);
  P(bx + 1, yT, bw - 2, 1, sp.shirt);
  P(bx, yT + 1, 1, sp.torso - 1, sp.shirt2);
  if (sp.chubby) P(13, yT + 3, 1, sp.torso - 4, sp.shirt);
  if (!sp.coat && !sp.skirt) P(bx, yL - 1, bw, 1, sp.pants2);
  if (sp.tee) { P(10 + (sp.chubby ? 1 : 0), yT + 1, 2, sp.torso - 2, sp.tee); P(bx + 2, yT + 2, 1, sp.torso - 3, sp.shirt2); }
  if (sp.coat) { P(9, yT + 1, 1, sp.torso - 1, sp.shirt2); P(10, yT + 1, 2, 2, '#9fb7cf'); }
  if (sp.logo) { P(8, yT + 2, 1, 3, sp.logo); P(9, yT + 3, 1, 1, sp.logo); P(10, yT + 2, 1, 1, sp.logo); P(10, yT + 4, 1, 1, sp.logo); }
  if (sp.tie) { P(10, yT + 1, 1, 4, sp.tie); P(9, yT, 3, 1, '#ffffff'); }
  if (sp.collar) { P(10, yT, 2, 1, '#ffffff'); P(10, yT + 1, 1, 1, '#ffffff'); }
  if (sp.apron) { P(8, yT + 2, 5, sp.torso - 2, sp.apron); if (sp.skirt) P(8, yL, 5, L - 3, sp.apron); }
  if (sp.style === 'helmet') { P(bx, yT + 2, 3, 3, '#8a8fa3'); }
  // cuello
  P(7, yT, 3, 1, sp.skin);
  // ---- brazo ----
  const sleeveRows = sp.sleeve === 'long' ? sp.torso - 2 : sp.sleeve === 'short' ? 2 : 0;
  const armC = (i) => i < sleeveRows ? sp.shirt2 : sp.skin;
  const handC = sp.style === 'helmet' ? '#8a8fa3' : sp.skin;
  if (pose === 'jump') {
    for (let i = 0; i < 5; i++) P(9, yT + 1 - i, 2, 1, i < 2 && sleeveRows ? sp.shirt2 : sp.skin);
    P(9, yT - 5, 2, 2, handC);
  } else if (pose === 'throw') {
    for (let i = 0; i < 6; i++) P(8 + i, yT + 2, 1, 2, i < (sleeveRows ? 2 : 0) ? sp.shirt2 : sp.skin);
    P(14, yT + 1, 2, 3, handC);
  } else if (pose === 'hurt') {
    for (let i = 0; i < 4; i++) P(10 + i, yT + 1 - i, 1, 2, armC(i));
    for (let i = 0; i < 4; i++) P(5 - i, yT + 1 - i, 1, 2, armC(i));
  } else {
    const sw = pose === 'walk' ? 1 : pose === 'walk2' ? -1 : 0;
    const len = sp.torso - 1;
    for (let i = 0; i < len; i++) P(7 + Math.round(sw * i * 0.4), yT + 1 + i, 2, 1, armC(i));
    P(7 + Math.round(sw * len * 0.4), yT + 1 + len, 2, 1, handC);
  }
  // ---- cabeza ----
  P(4, yH + 1, 8, HH - 2, sp.skin); P(5, yH, 6, 1, sp.skin); P(5, yH + HH - 1, 6, 1, sp.skin);
  P(12, yH + 4, 1, 2, sp.skin); P(12, yH + 5, 1, 1, sp.skin2);         // nariz
  P(6, yH + 4, 2, 2, sp.skin2);                                        // oreja
  if (pose === 'hurt') { P(9, yH + 3, 1, 1, '#000'); P(11, yH + 3, 1, 1, '#000'); P(10, yH + 4, 1, 1, '#000'); P(9, yH + 5, 1, 1, '#000'); P(11, yH + 5, 1, 1, '#000'); }
  else { P(10, yH + 3, 1, 2, '#000'); P(9, yH + 2, 3, 1, sp.hair); }
  if (sp.bags) P(10, yH + 5, 2, 1, sp.skin2);
  if (sp.glasses) { P(9, yH + 3, 3, 1, '#9fd0ff'); P(10, yH + 3, 1, 1, '#000'); P(9, yH + 2, 3, 1, '#555'); P(6, yH + 3, 3, 1, '#555'); }
  if (sp.mustache) P(10, yH + 6, 3, 1, sp.hair);
  if (sp.stubble) { P(8, yH + 7, 4, 1, sp.skin2); P(7, yH + 8, 4, 1, sp.skin2); }
  if (pose === 'talk' || pose === 'hurt') { P(10, yH + 7, 2, 2, '#5a1a1a'); }
  else P(10, yH + 7, 2, 1, sp.skin2);
  // ---- pelo ----
  const H1 = sp.hair, H2 = sp.hair2;
  if (sp.style === 'curly') {
    const mask = [
      '....hh.hh.hh....',
      '..hhhhhhhhhhh...',
      '.hhhhhhhhhhhhh..',
      'hhhhhhhhhhhhhhh.',
      'hhhhhhhhhhhhhh..',
      'hhhhhhhhh.......',
      '.hhhhhhh........',
      '.hhhhhh.........',
      '..hhhh..........',
    ];
    for (let y = 0; y < mask.length; y++) for (let x = 0; x < 16; x++) if (mask[y][x] === 'h') {
      const curl = ((x * 3 + y * 5) % 7 === 0) || ((x + y) % 5 === 0 && y % 2);
      P(x, y, 1, 1, curl ? H2 : H1);
    }
    P(9, yH + 2, 3, 1, H1);
  } else if (sp.style === 'short' || sp.style === 'cap' || sp.style === 'curlers' || sp.style === 'bun') {
    P(5, yH - 1, 6, 1, H1); P(4, yH, 8, 2, H1); P(4, yH + 2, 3, 2, H1); P(4, yH + 4, 2, 1, H1);
    P(6, yH, 2, 1, H2);
    if (sp.style === 'cap') { P(4, yH - 2, 8, 3, sp.cap); P(11, yH + 1, 3, 1, sp.cap); P(5, yH - 2, 2, 1, '#ffffff55'); }
    if (sp.style === 'curlers') { [[4, '#ff8fc0'], [7, '#7fc7ff'], [10, '#ff8fc0']].forEach(([x, cc]) => { P(x, 0, 2, 2, cc); P(x, 0, 1, 1, '#fff'); }); }
    if (sp.style === 'bun') { P(3, 0, 4, 3, H1); P(4, 0, 1, 1, H2); }
  } else if (sp.style === 'bald') {
    P(4, yH + 2, 2, 4, H1); P(5, yH + 1, 2, 1, H1); P(8, yH + 1, 1, 1, '#ffffff66');
  } else if (sp.style === 'helmet') {
    P(3, 0, 10, yH + 8, '#e8e8f0'); P(8, yH + 2, 5, 5, '#3b4a7a'); P(9, yH + 3, 2, 1, '#9fd0ff'); P(3, 0, 1, yH + 8, '#b9bccb');
  }
  return c;
}
function makeHuman(name) {
  const sp = CAST[name];
  reg(name, POSES.map(p => human(sp, p)));
  SPR[name].spec = sp;
}

/* ---------------- SPRITES DE TEXTO ---------------- */
const PAL = {
  '.': null, k: '#14101e', w: '#f4f6fb', W: '#c3cbe0', g: '#8a90a8', r: '#e23b3b', R: '#9a1f1f', y: '#ffd23f', Y: '#c99a12',
  o: '#ff9a3c', O: '#b8621a', b: '#3b6fe0', B: '#23409a', p: '#ff7ab0', P: '#c94f84', n: '#8a5a33', N: '#5a3a1f',
  e: '#5cdc6a', E: '#2f8a3a', c: '#7fe3ff', C: '#2a9ac9', s: '#eebf95', S: '#c8926b', v: '#a35ce0', V: '#6a2ea6', t: '#f2d7a0', x: '#000000',
};
function S(name, frames, pal = PAL) { reg(name, frames.map(f => strSprite(f, pal))); }

function buildSprites() {
  for (const n of Object.keys(CAST)) makeHuman(n);

  const pan = (f) => [
    '................',
    '.....wwwww......',
    '...wwWwwwwwW....',
    '..wwwwwWwwWww...',
    '.wwWwwwwwwwwwW..',
    '.wwkkwwwwkkwww..',
    '.wwwkwwwwkwwWw..',
    '.wWwkwwwwkwwww..',
    '.wwwwwwwwwwwww..',
    '.wwwwkkkkkwwWw..',
    '..wwkwwwwwkww...',
    '..wWwwwwwwwWw...',
    '...wwwwwwwww....',
    f ? '...pp....pp.....' : '....pp..pp......',
    f ? '..ppp....ppp....' : '...ppp..ppp.....',
    '................'];
  S('panuelo', [pan(0), pan(1)]);
  S('panuelo_flat', [[
    '................', '................', '................', '................', '................', '................',
    '................', '................', '................', '................', '................',
    '..wwWwwwwwwWww..', '.wwkkwwwwwkkwww.', '.wWwwwwwwwwwwWw.', '..wwwwwwwwwwww..', '................']]);

  const sock = (sq) => {
    const top = ['....wwwwwww.....', '....rrrrrrr.....', '....wwwwwww.....', '....rrrrrrr.....'];
    const body = ['....wwwwwww.....', '....wkwwwkw.....', '....wkwwwkw.....', '....wwwwwww.....', '....wwkkkww.....', '....wwwwwwW.....', '....wwwwwwwW....', '....wwwwwwwwwW..', '....wwwwwwwwwww.', '.....WWWWWWWWW..'];
    const all = top.concat(body);
    return sq ? ['................', '................'].concat(all.slice(0, 3), all.slice(5)) : all;
  };
  S('calcetin', [sock(0), sock(1)]);

  const roll = (f) => {
    const r = [
      '.....wwwwww.....',
      '...wwwwwwwwww...',
      '..wwwWwwwwWwww..',
      '.wwwwwwwwwwwwww.',
      '.wwWwwgggggwwWw.',
      'wwwwwggnnngwwwww',
      'wwwwwgnNNNngwwww',
      'wwwwwgnNkNngwwww',
      'wwwwwgnNNNngwwww',
      'wwwwwggnnngwwwww',
      '.wwWwwgggggwwWw.',
      '.wwwwwwwwwwwwww.',
      '..wwwwWwwwwwww..',
      '...wwwwwwwwWw...',
      '.....wwwwww.....',
      '................'];
    if (f) return r.map((row, y) => row.split('').map((ch, x) => ch === 'W' ? 'w' : (ch === 'w' && (x + y) % 6 === 0) ? 'W' : ch).join(''));
    return r;
  };
  S('rollo', [roll(0), roll(1)]);

  const crema = (f) => [
    '......kkk.......',
    '......ggg.......',
    '....gggggg......',
    '......ggg.......',
    '.....pppppp.....',
    '....pppppppp....',
    '....pkkpppkp....',
    '....ppkpppkp....',
    '....pppppppp....',
    '....wwwwwwww....',
    '....wpwwpwpw....',
    '....wwwwwwww....',
    f ? '....pkkkkkpp....' : '....ppkkkppp....',
    '....pppppppp....',
    '....PPPPPPPP....',
    '................'];
  S('crema', [crema(0), crema(1)]);

  const rata = (f) => [
    '................', '................', '................', '................',
    '..........gg....',
    '.........gggg...',
    '...ggggggggkgg..',
    '..gggggggggggpp.',
    '.gggggggggggg...',
    'pggWWWWWWWWgg...',
    'p.gggggggggg....',
    f ? '...pp...pp......' : '....pp.pp.......',
    '................', '................', '................', '................'];
  S('rata', [rata(0), rata(1)]);

  const bat = (f) => f ? [
    '................', '................', '................',
    'v..............v', 'vv....vvvv....vv', 'vvv..vvvvvv..vvv', '.vvvvvcvvcvvvvv.', '..vvvvvvvvvvvv..', '...vv.vvvv.vv...', '......v..v......',
    '................', '................', '................', '................', '................', '................'] : [
    '................', '................', '................', '................',
    '......vvvv......', '.....vvvvvv.....', 'vvvvvvcvvcvvvvvv', '.vvvvvvvvvvvvvv.', '..vv..vvvv..vv..', '......v..v......',
    '................', '................', '................', '................', '................', '................'];
  S('glitch', [bat(0), bat(1)]);

  const dog = (f) => [
    '........................',
    '.................nn.....',
    '................nnnn....',
    '...............nnnnnn...',
    '..............nnkNnnnk..',
    'n.............nnnnnnnkk.',
    '.n...........NnnnnnnnN..',
    '.nn.nnnnnnnnnnnnnnppN...',
    '..nnnnnnnnnnnnnnn.p.....',
    '..nnnnnnnnnnnnnnn.......',
    '..nnnnttttttnnnnn.......',
    '..nnnnnnnnnnnnnnn.......',
    f ? '..nn..nn....nn..nn......' : '...nn..nn..nn..nn.......',
    f ? '..nn..nn....nn..nn......' : '...nn..nn..nn..nn.......',
    f ? '.NNN..NNN..NNN..NNN.....' : '..NNN.NNN.NNN..NNN......',
    '........................'];
  S('perro', [dog(0), dog(1)]);

  // Manuela: la mano derecha más famosa de Culiacán
  S('mano', [[
    '................',
    '....s.s.s.......',
    '...ssssssss.....',
    '...sSsSsSs......',
    '...ssssssss.....',
    '...sSsSsSs......',
    '...ssssssss..s..',
    '...sssssssss.ss.',
    '...ssssssssssss.',
    '...sssssssssss..',
    '...ssssssssss...',
    '....sssssssss...',
    '....ssssssss....',
    '.....SSSSSSS....',
    '.....bbbbbbb....',
    '.....BBBBBBB....']]);

  const coin = [
    ['.....yyyyy......', '....yYYYYYy.....', '...yYyyyyyYy....', '...yYyykyyYy....', '...yYykkkyYy....', '...yYyykyyYy....', '...yYykkkyYy....', '...yYyykyyYy....', '...yYyyyyyYy....', '....yYYYYYy.....', '.....yyyyy......'],
    ['......yyy.......', '.....yYYYy......', '.....yYyYy......', '.....yYkYy......', '.....yYkYy......', '.....yYkYy......', '.....yYkYy......', '.....yYkYy......', '.....yYyYy......', '.....yYYYy......', '......yyy.......'],
    ['.......y........', '.......Y........', '.......Y........', '.......Y........', '.......Y........', '.......Y........', '.......Y........', '.......Y........', '.......Y........', '.......Y........', '.......y........'],
  ];
  S('coin', [coin[0], coin[1], coin[2], coin[1]].map(r => ['................', '................', '................'].concat(r, ['..'])));

  S('taco', [[
    '................', '................', '................', '................',
    '.....yyyyyy.....', '...yyeeryeeyy...', '..yyeerreerreyy.', '.yyneeeererrenyy', '.ynnnnnnnnnnnny.', '.yyyyyyyyyyyyyy.', '..YYYYYYYYYYYY..', '...YYYYYYYYYY...',
    '................', '................', '................', '................']]);
  S('chancla', [[
    '................', '................', '................', '................',
    '..........bb....', '.........bwwb...', '...bbbbbbwbbbb..', '.bbbbbbbbbbbbbbb', 'bpppppppppppppbb', 'bppppppppppppppb', '.bbbbbbbbbbbbbb.', '..BBBBBBBBBBBB..',
    '................', '................', '................', '................']]);
  S('chancla_oro', [[
    '................', '................', '................', '................',
    '..........yy....', '.........ywwy...', '...yyyyyyywyyy..', '.yyyyyyyyyyyyyyy', 'yoooooooooooooyy', 'yoooooooooooooyy', '.yyyyyyyyyyyyyy.', '..YYYYYYYYYYYY..',
    '................', '................', '................', '................']]);
  S('agua', [[
    '......kkkk......', '......gggg......', '.......cc.......', '......cccc......', '.....cccccc.....', '....cccwwccc....', '....ccwwwwcc....', '....cccwwccc....', '....cccwwccc....', '....cccwwccc....', '....cccccccc....', '....cccccccc....', '....CCCCCCCC....', '................', '................', '................']]);
  S('kazoo_item', [[
    '................', '................', '................', '................',
    '..........yy....', '.........yYYy...', 'yyyyyyyyyyYYYyyy', 'yYYYYYYYYYYYYYYy', 'yyyyyyyyyyyyyyyy', '.oyyyyyyyyyyyyo.', '..oooooooooooo..',
    '................', '................', '................', '................', '................']]);
  S('concha', [[
    '................', '................', '................', '................',
    '.....pppppp.....', '...ppwppppwpp...', '..pppwpwwpwppp..', '.ppwwpppppwwppp.', '.pwpppwwwwpppwp.', '.oooooooooooooo.', '.oooooooooooooo.', '..OOOOOOOOOOOO..',
    '................', '................', '................', '................']]);
  S('foto', [[
    '................', '..wwwwwwwwwwww..', '..wbbbbbbbbbbw..', '..wbbbbbbyybbw..', '..wbbbbbbyybbw..', '..wbbbbbbbbbbw..', '..wbebbbbbbbbw..', '..weeebbbsbbbw..', '..weeeeebsssbw..', '..weeeeeeeeeew..', '..wwwwwwwwwwww..', '..wwwwwwwwwwww..', '..wwwgggggwwww..', '..wwwwwwwwwwww..', '................', '................']]);
  S('celular', [[
    '................', '.....kkkkkk.....', '....kggggggk....', '....kcccccck....', '....kcwcwcck....', '....kcccccck....', '....kcwwwcck....', '....kcccccck....', '....kcccccck....', '....kcccccck....', '....kggggggk....', '....kggkkggk....', '....kggggggk....', '.....kkkkkk.....', '................', '................']]);
  S('recarga', [[
    '................', '................', '................', '..eeeeeeeeeeee..', '..eEEEEEEEEEEe..', '..eEwwEEEEEEEe..', '..eEwwEEyyyEEe..', '..eEEEEEyEEEEe..', '..eEEEEyyyEEEe..', '..eEEEEEEEyEEe..', '..eEEEEEyyyEEe..', '..eEEEEEEEEEEe..', '..eeeeeeeeeeee..', '................', '................', '................']]);
  S('chancla_proj', [[
    '........', '..bbbbb.', '.bppppbb', 'bppppppb', '.bbbbbb.', '........']]);
  S('crema_proj', [['..ww..', '.wwww.', 'wwwwww', '.wwww.', '..ww..']]);
  S('folleto', [['wwwwww', 'wkkkkw', 'wwwwww', 'wkkkww', 'wwwwww']]);
  S('cookie', [['..nnnn..', '.nnNnnn.', 'nnnnnNnn', 'nNnnnnnn', 'nnnnNnnn', '.nnnnnn.', '..nnnn..']]);
  S('corazon', [['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...']]);
  S('corazon_v', [['.gg.gg.', 'g..g..g', 'g.....g', '.g...g.', '..g.g..', '...g...']]);
  S('tele', [[
    '................', '.....k....k.....', '......k..k......', '..gggggggggggg..', '..gkkkkkkkkkkg..', '..gkbbbbbbbbkg..', '..gkbwwbbbwbkg..', '..gkbbbwbbbbkg..', '..gkbbbbbbbbkg..', '..gkkkkkkkkkkg..', '..gggggggggggg..', '...gg......gg...', '................', '................', '................', '................']]);
  S('libro', [[
    '................', '................', '..nnnnnnnnnnnn..', '..nwwwwwwwwwwn..', '..nwkkkwwkkkwn..', '..nwwwwwwwwwwn..', '..nwkkkwwkkkwn..', '..nwwwwwwwwwwn..', '..nwkkwwwkkkwn..', '..nwwwwwwwwwwn..', '..nnnnnnnnnnnn..', '..NNNNNNNNNNNN..', '................', '................', '................', '................']]);
  S('chaqueto', [[
    '................', '..kkkkkkkkkkkk..', '..kgggggggggk...', '..kgrrrryyeegk..', '..kgggggggggk...', '..kkkkkkkkkkkk..', '.......kk.......', '......kkkk......', '.....gggggg.....', '................', '................', '................', '................', '................', '................', '................']]);
}

/* ---------------- TILES ---------------- */
// 0 vacío, 1 piso, 2 ladrillo, 3 caja ?, 4 caja usada, 5-8 tubo, 9 plataforma, 10 picos, 11 agua sup, 12 agua,
// 13 bloque duro, 14 oculto, 15 banda der, 16 banda izq, 17 se desmorona, 18 pared decorativa sólida
const SOLID = new Uint8Array(32); [1, 2, 3, 4, 5, 6, 7, 8, 13, 15, 16, 17, 18].forEach(t => SOLID[t] = 1);
const THEMES = {
  calle:     { sky: ['#ff9d4d', '#ffd36b'], g1: '#c9934f', g2: '#8a5a2b', g3: '#5e3b1a', top: '#a5b84a', top2: '#6f8a2a', brick: '#c0563a', brick2: '#7e2f1f', pipe: '#3fb34f', pipe2: '#1f7a2f', hard: '#9a6b3f', water: '#4a7fd0' },
  mercado:   { sky: ['#ff7a59', '#ffc46b'], g1: '#c94a3a', g2: '#a8372a', g3: '#6e2018', top: '#e9d7b9', top2: '#b9a17d', brick: '#d97f2e', brick2: '#8a4a12', pipe: '#3fb34f', pipe2: '#1f7a2f', hard: '#8a6a4a', water: '#4a7fd0' },
  fabrica:   { sky: ['#2b2f3a', '#4a5160'], g1: '#7b8494', g2: '#5a6272', g3: '#363c48', top: '#a7b0bf', top2: '#6b7484', brick: '#8a7a6a', brick2: '#4a3e34', pipe: '#d9a12b', pipe2: '#8a6110', hard: '#555d6b', water: '#e86a1c' },
  drenaje:   { sky: ['#0d1f1c', '#18332d'], g1: '#3d5a4a', g2: '#2b4236', g3: '#172820', top: '#5e8a4a', top2: '#3a5e2a', brick: '#4a5e52', brick2: '#2a3a30', pipe: '#6b7a5a', pipe2: '#3a4a2a', hard: '#3a4a40', water: '#7a8a3a' },
  iglesia:   { sky: ['#1a1240', '#4a2a6e'], g1: '#a89a86', g2: '#7d715f', g3: '#4f473b', top: '#c9bca6', top2: '#968a74', brick: '#b3876a', brick2: '#6e4a36', pipe: '#c9a13b', pipe2: '#7a5e14', hard: '#6e6656', water: '#3a5ad0' },
  red:       { sky: ['#05030f', '#10082a'], g1: '#1a1250', g2: '#120c38', g3: '#080520', top: '#2affd5', top2: '#13a88a', brick: '#ff3fa3', brick2: '#8a1a5a', pipe: '#3fa3ff', pipe2: '#1a5aa8', hard: '#5a3fd0', water: '#ff3fa3' },
  dimension: { sky: ['#12001f', '#3a0a5a'], g1: '#7a3fd0', g2: '#4a1f8a', g3: '#25104a', top: '#ff6ad5', top2: '#b03a90', brick: '#3fd0c9', brick2: '#1a6a66', pipe: '#ff6ad5', pipe2: '#9a2a7a', hard: '#5a2ab0', water: '#ffffff' },
  casa:      { sky: ['#e8d8b8', '#c9b48e'], g1: '#a8743f', g2: '#86592a', g3: '#5a3a18', top: '#c98f4f', top2: '#8a5a24', brick: '#b3876a', brick2: '#6e4a36', pipe: '#3fb34f', pipe2: '#1f7a2f', hard: '#7a5a3a', water: '#4a7fd0' },
  cuarto:    { sky: ['#0a0812', '#1a1428'], g1: '#4a3a6a', g2: '#33284a', g3: '#1d1730', top: '#6a5a8a', top2: '#4a3a6a', brick: '#5a4a3a', brick2: '#3a2a1a', pipe: '#3fb34f', pipe2: '#1f7a2f', hard: '#4a3a2a', water: '#4a7fd0' },
};
const TILESETS = {};
function tileset(theme) {
  if (TILESETS[theme]) return TILESETS[theme];
  const th = THEMES[theme];
  const c = mk(TS * 24, TS), g = c.getContext('2d');
  const P = (i, x, y, w, h, col) => { g.fillStyle = col; g.fillRect(i * TS + x, y, w, h); };
  // 1: piso relleno, 19: piso con superficie
  const fill = (i) => {
    P(i, 0, 0, 16, 16, th.g2);
    for (let k = 0; k < 6; k++) P(i, (k * 7 + 3) % 15, (k * 5 + 2) % 15, 2, 2, th.g3);
    P(i, (5) % 15, 9, 3, 1, th.g1);
    if (theme === 'fabrica') { P(i, 0, 0, 16, 1, th.g3); P(i, 0, 0, 1, 16, th.g3); P(i, 2, 2, 1, 1, th.g1); P(i, 13, 13, 1, 1, th.g1); P(i, 13, 2, 1, 1, th.g1); P(i, 2, 13, 1, 1, th.g1); }
    if (theme === 'red') { P(i, 0, 0, 16, 16, th.g2); P(i, 0, 0, 16, 1, th.g1); P(i, 0, 0, 1, 16, th.g1); P(i, 7, 7, 2, 2, th.top2); }
    if (theme === 'casa' || theme === 'cuarto') { P(i, 0, 0, 16, 16, th.g2); P(i, 0, 7, 16, 1, th.g3); P(i, 0, 15, 16, 1, th.g3); P(i, 5, 0, 1, 7, th.g3); P(i, 12, 8, 1, 7, th.g3); }
    if (theme === 'iglesia' || theme === 'drenaje' || theme === 'mercado') { P(i, 0, 0, 16, 16, th.g2); P(i, 0, 7, 16, 1, th.g3); P(i, 0, 15, 16, 1, th.g3); P(i, 7, 0, 1, 7, th.g3); P(i, 15, 8, 1, 7, th.g3); P(i, 1, 1, 5, 1, th.g1); P(i, 9, 9, 5, 1, th.g1); }
    if (theme === 'dimension') { P(i, 3, 3, 4, 4, th.g1); P(i, 10, 9, 3, 3, th.g3); }
  };
  fill(1);
  fill(19);
  P(19, 0, 0, 16, 4, th.top); P(19, 0, 4, 16, 1, th.top2);
  for (let k = 0; k < 16; k += 3) P(19, k, 4, 1, 2, th.top2);
  if (theme === 'calle') { P(19, 2, -0, 1, 2, th.top2); P(19, 9, 0, 1, 1, th.top2); }
  // 2 ladrillo
  P(2, 0, 0, 16, 16, th.brick); P(2, 0, 0, 16, 1, '#ffffff33');
  for (const y of [3, 7, 11, 15]) P(2, 0, y, 16, 1, th.brick2);
  for (let r = 0; r < 4; r++) { const off = r % 2 ? 4 : 12; P(2, off, r * 4, 1, 3, th.brick2); P(2, (off + 8) % 16, r * 4, 1, 3, th.brick2); }
  // 3 caja de reparto (?)
  const qb = (i, used) => {
    P(i, 0, 0, 16, 16, '#000'); P(i, 1, 1, 14, 14, used ? '#7a5a3a' : '#e8a23a'); P(i, 1, 1, 14, 1, used ? '#9a7a5a' : '#ffd27a');
    P(i, 1, 14, 14, 1, used ? '#5a3a1a' : '#a8641a');
    if (!used) {
      P(i, 7, 1, 2, 14, '#c47a1a');
      [[5, 3, 6, 2], [9, 5, 2, 2], [7, 7, 2, 2], [7, 9, 2, 1], [7, 11, 2, 2]].forEach(([x, y, w, h]) => P(i, x, y, w, h, '#fff'));
      P(i, 2, 2, 1, 1, '#fff'); P(i, 13, 2, 1, 1, '#fff'); P(i, 2, 13, 1, 1, '#fff'); P(i, 13, 13, 1, 1, '#fff');
    } else { P(i, 2, 2, 1, 1, '#3a2a1a'); P(i, 13, 2, 1, 1, '#3a2a1a'); P(i, 2, 13, 1, 1, '#3a2a1a'); P(i, 13, 13, 1, 1, '#3a2a1a'); }
  };
  qb(3, false); qb(4, true);
  // tubos 5 (tapa izq) 6 (tapa der) 7 (cuerpo izq) 8 (cuerpo der)
  P(5, 0, 0, 16, 16, '#000'); P(5, 1, 1, 15, 14, th.pipe); P(5, 3, 1, 2, 14, '#ffffff55'); P(5, 1, 14, 15, 1, th.pipe2);
  P(6, 0, 0, 16, 16, '#000'); P(6, 0, 1, 15, 14, th.pipe); P(6, 10, 1, 4, 14, th.pipe2); P(6, 0, 14, 15, 1, th.pipe2);
  P(7, 2, 0, 14, 16, '#000'); P(7, 3, 0, 13, 16, th.pipe); P(7, 5, 0, 2, 16, '#ffffff55');
  P(8, 0, 0, 14, 16, '#000'); P(8, 0, 0, 13, 16, th.pipe); P(8, 8, 0, 4, 16, th.pipe2);
  // 9 plataforma semisólida
  P(9, 0, 0, 16, 5, '#000'); P(9, 0, 1, 16, 3, th.top); P(9, 0, 1, 16, 1, '#ffffff55');
  for (let k = 1; k < 16; k += 5) P(9, k, 5, 2, 3, th.top2);
  // 10 picos (jeringas... no: tachuelas)
  for (let k = 0; k < 4; k++) { for (let r = 0; r < 8; r++) P(10, k * 4 + (r >> 1) * 0, 8 + r, 4, 1, '#000'); P(10, k * 4 + 1, 4, 2, 4, '#d0d4e0'); P(10, k * 4, 8, 4, 8, '#9aa0b0'); P(10, k * 4 + 1, 3, 2, 1, '#fff'); }
  // 11/12 agua
  P(11, 0, 4, 16, 12, th.water); P(11, 0, 2, 16, 2, '#ffffffaa'); P(11, 3, 1, 4, 1, '#ffffffaa'); P(11, 10, 1, 3, 1, '#ffffffaa');
  P(12, 0, 0, 16, 16, th.water); P(12, 4, 6, 3, 1, '#ffffff33'); P(12, 11, 12, 3, 1, '#ffffff33');
  // 13 bloque duro
  P(13, 0, 0, 16, 16, '#000'); P(13, 1, 1, 14, 14, th.hard); P(13, 1, 1, 14, 2, '#ffffff44'); P(13, 1, 13, 14, 2, '#00000055'); P(13, 1, 1, 2, 14, '#ffffff22');
  // 15/16 banda transportadora
  for (const i of [15, 16]) { P(i, 0, 0, 16, 16, '#222'); P(i, 0, 1, 16, 4, '#555'); P(i, 0, 11, 16, 4, '#444'); for (let k = 0; k < 16; k += 4) P(i, k + (i === 15 ? 1 : 2), 2, 2, 2, '#ffcc22'); P(i, 3, 7, 3, 3, '#888'); P(i, 11, 7, 3, 3, '#888'); }
  // 17 se desmorona
  P(17, 0, 0, 16, 16, '#000'); P(17, 1, 1, 14, 14, th.brick); P(17, 4, 2, 1, 6, th.brick2); P(17, 4, 8, 5, 1, th.brick2); P(17, 9, 8, 1, 6, th.brick2); P(17, 1, 1, 14, 1, '#ffffff66');
  // 18 pared sólida (marco)
  P(18, 0, 0, 16, 16, th.g3); P(18, 0, 0, 16, 1, th.g1); P(18, 0, 8, 16, 1, th.g2); P(18, 8, 0, 1, 8, th.g2); P(18, 2, 9, 1, 7, th.g2);
  TILESETS[theme] = c;
  return c;
}

/* ---------------- FONDOS (parallax) ---------------- */
const BGS = {};
function bgLayers(theme) {
  if (BGS[theme]) return BGS[theme];
  const R2 = mulberry(theme.length * 99 + 7);
  const th = THEMES[theme];
  const W = 512, H = VH;
  const far = mk(W, H), mid = mk(W, H);
  const f = far.getContext('2d'), m = mid.getContext('2d');
  const F = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const ri = (a, b) => Math.floor(a + R2() * (b - a + 1));
  if (theme === 'calle' || theme === 'mercado') {
    // cerros
    for (let x = 0; x < W; x++) { const h = 40 + Math.sin(x / 50) * 14 + Math.sin(x / 17) * 5; F(f, x, H - 70 - h, 1, h + 70, '#d98a4a'); }
    for (let x = 0; x < W; x++) { const h = 26 + Math.sin(x / 33 + 2) * 10; F(f, x, H - 60 - h, 1, h + 60, '#c06a3a'); }
    // casas de colores de Culiacán
    const cols = ['#4fb0c6', '#f2c14e', '#e86a8a', '#7bc96f', '#f28c38', '#b18cd9', '#e8e0c8'];
    let x = 0;
    while (x < W) {
      const w = ri(36, 64), h = ri(40, 76), c = cols[ri(0, cols.length - 1)];
      F(m, x, H - 32 - h, w, h + 32, c); F(m, x, H - 32 - h, w, 3, '#00000033');
      F(m, x, H - 32 - h - 4, w, 4, '#ffffff44');
      for (let wy = H - 26 - h; wy < H - 48; wy += 16) for (let wx = x + 6; wx < x + w - 10; wx += 14) { F(m, wx, wy, 8, 9, '#2a3a5a'); F(m, wx, wy, 8, 2, '#ffffff55'); }
      if (theme === 'mercado') { const ac = pick(['#e23b3b', '#3b6fe0', '#ffd23f', '#5cdc6a']); for (let k = 0; k < w; k += 8) F(m, x + k, H - 60, 8, 8, k % 16 ? ac : '#fff'); }
      if (R2() < 0.4) { F(m, x + w - 6, H - 32 - h - 30, 2, 30, '#444'); F(m, x + w - 12, H - 32 - h - 30, 14, 2, '#444'); }
      x += w + ri(0, 18);
      if (R2() < 0.5) { // palmera
        const px = x - 8; F(m, px, H - 120, 3, 90, '#7a5a2a');
        for (let k = -2; k <= 2; k++) F(m, px - 14 + k * 3, H - 122 + Math.abs(k) * 3, 18, 3, '#3a9a3a');
      }
    }
    // cables de luz
    for (let x2 = 0; x2 < W; x2++) F(m, x2, H - 140 + Math.sin(x2 / 64 * Math.PI) * 6, 1, 1, '#333');
    if (theme === 'mercado') for (let k = 0; k < W; k += 10) F(m, k, H - 140 + Math.sin(k / 64 * Math.PI) * 6, 8, 6, ['#ff4fa3', '#ffd23f', '#5cc8ff', '#5cdc6a'][(k / 10) % 4]);
  } else if (theme === 'fabrica') {
    for (let x = 0; x < W; x += 64) { F(f, x + 8, 30, 48, H, '#3a404c'); F(f, x + 8, 30, 48, 4, '#4f5666'); for (let y = 40; y < H; y += 20) F(f, x + 16, y, 32, 8, '#2b303a'); }
    // rollos gigantes de papel
    for (let x = 20; x < W; x += 128) {
      m.fillStyle = '#e8ecf4'; m.beginPath(); m.arc(x + 30, H - 70, 34, 0, 7); m.fill();
      m.fillStyle = '#c3cbe0'; m.beginPath(); m.arc(x + 30, H - 70, 26, 0, 7); m.fill();
      m.fillStyle = '#8a7a6a'; m.beginPath(); m.arc(x + 30, H - 70, 10, 0, 7); m.fill();
      F(m, x + 64, 0, 6, H, '#5a6272'); F(m, x + 64, 60, 60, 6, '#5a6272');
    }
    for (let x = 0; x < W; x += 32) F(m, x, 20, 20, 6, '#ffcc2255');
  } else if (theme === 'drenaje') {
    for (let x = 0; x < W; x += 16) for (let y = 0; y < H; y += 8) F(f, x + ((y / 8) % 2) * 8, y, 15, 7, (x + y) % 48 ? '#1a2e28' : '#20382f');
    for (let x = 0; x < W; x += 128) { m.fillStyle = '#0a1612'; m.beginPath(); m.arc(x + 64, H - 40, 48, Math.PI, 0); m.fill(); F(m, x + 16, H - 40, 96, 40, '#0a1612'); }
    for (let x = 0; x < W; x += 96) { F(m, x + 40, 0, 10, 60, '#3a4a3a'); F(m, x + 36, 60, 18, 8, '#3a4a3a'); }
  } else if (theme === 'iglesia') {
    for (let k = 0; k < 90; k++) F(f, ri(0, W), ri(0, 120), 1, 1, R2() < 0.3 ? '#fff' : '#9a8ad0');
    f.fillStyle = '#f4f0d0'; f.beginPath(); f.arc(400, 40, 14, 0, 7); f.fill();
    // catedral de Culiacán
    const cx = 120; F(m, cx, 60, 30, 170, '#2a1f4a'); F(m, cx + 110, 60, 30, 170, '#2a1f4a'); F(m, cx + 30, 100, 80, 130, '#241a40');
    m.fillStyle = '#2a1f4a'; m.beginPath(); m.arc(cx + 70, 100, 30, Math.PI, 0); m.fill();
    F(m, cx + 68, 50, 4, 24, '#2a1f4a'); F(m, cx + 62, 58, 16, 4, '#2a1f4a');
    for (const tx of [cx, cx + 110]) { F(m, tx + 12, 40, 6, 20, '#2a1f4a'); F(m, tx + 10, 48, 10, 3, '#2a1f4a'); }
    for (let k = 0; k < 3; k++) { F(m, cx + 42 + k * 22, 130, 10, 22, ['#e23b3b', '#ffd23f', '#3b6fe0'][k]); F(m, cx + 42 + k * 22, 130, 10, 3, '#fff8'); }
    for (let x = 300; x < W; x += 40) F(m, x, 150, 30, 80, '#1d1636');
  } else if (theme === 'red') {
    for (let y = 0; y < H; y += 16) F(f, 0, y, W, 1, '#2a1a6a');
    for (let x = 0; x < W; x += 16) F(f, x, 0, 1, H, '#1a1050');
    for (let k = 0; k < 60; k++) { f.fillStyle = R2() < 0.5 ? '#2affd555' : '#ff3fa355'; f.font = '8px monospace'; f.fillText(R2() < 0.5 ? '0' : '1', ri(0, W), ri(0, H)); }
    for (let k = 0; k < 7; k++) {
      const x = ri(0, W - 80), y = ri(10, 140), w = ri(50, 90), h = ri(30, 50);
      F(m, x, y, w, h, '#ffffff22'); F(m, x, y, w, 7, ['#ff3fa3aa', '#3fa3ffaa', '#2affd5aa'][k % 3]); F(m, x + w - 7, y + 1, 5, 5, '#ff3b3b');
      for (let l = 0; l < 3; l++) F(m, x + 4, y + 12 + l * 7, w - 12 - l * 9, 3, '#ffffff33');
    }
  } else if (theme === 'dimension') {
    for (let k = 0; k < 160; k++) F(f, ri(0, W), ri(0, H), 1, 1, ['#fff', '#ff6ad5', '#3fd0c9', '#ffd23f'][k % 4]);
    // planetas con forma de mano y chancla
    const planet = (g, x, y, r, c, c2) => { g.fillStyle = c; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.fillStyle = c2; g.beginPath(); g.arc(x - r / 3, y - r / 3, r / 3, 0, 7); g.fill(); };
    planet(m, 80, 60, 26, '#b03a90', '#ff6ad5'); planet(m, 330, 40, 14, '#3fd0c9', '#a0fff8'); planet(m, 450, 120, 20, '#ffd23f', '#fff3a0');
    m.fillStyle = '#ff6ad566'; m.fillRect(40, 58, 84, 3);
    for (let k = 0; k < 8; k++) F(m, ri(0, W), ri(0, H), ri(20, 80), 2, '#ffffff22');
  } else if (theme === 'casa' || theme === 'cuarto') {
    const wall = theme === 'casa' ? '#d9c39a' : '#2a2140', wall2 = theme === 'casa' ? '#c9ae80' : '#231b38';
    F(f, 0, 0, W, H, wall);
    for (let x = 0; x < W; x += 16) F(f, x, 0, 8, H, wall2);
    F(f, 0, H - 48, W, 4, theme === 'casa' ? '#8a5a2a' : '#3a2a5a');
    if (theme === 'casa') {
      for (let x = 30; x < W; x += 120) { // cuadros familiares
        F(m, x, 50, 40, 32, '#5a3a18'); F(m, x + 3, 53, 34, 26, '#9fd0ff');
        F(m, x + 8, 62, 8, 17, '#e86a8a'); F(m, x + 22, 64, 8, 15, '#4f78b3'); F(m, x + 9, 58, 6, 5, '#d8a173'); F(m, x + 23, 60, 6, 5, '#eebf95');
        F(m, x + 60, 40, 30, 46, '#7a5a3a'); F(m, x + 63, 43, 24, 40, '#bfe6ff'); F(m, x + 74, 43, 2, 40, '#7a5a3a');
      }
      F(m, 250, 30, 20, 26, '#c9a13b'); F(m, 258, 34, 4, 18, '#5a3a18'); F(m, 254, 40, 12, 4, '#5a3a18'); // cruz
    } else {
      F(m, 40, 40, 50, 36, '#111'); F(m, 43, 43, 44, 30, '#3fa3ff55'); // ventana tapada
      for (let k = 0; k < 4; k++) F(m, 160 + k * 60, 40, 36, 48, ['#e86a8a', '#3fa3ff', '#ffd23f', '#5cdc6a'][k] + '66');
    }
  }
  BGS[theme] = { far, mid };
  return BGS[theme];
}
function drawBG(theme, camX, t, ritmo) {
  const th = THEMES[theme];
  const gr = ctx.createLinearGradient(0, 0, 0, VH);
  let s0 = th.sky[0], s1 = th.sky[1];
  gr.addColorStop(0, s0); gr.addColorStop(1, s1);
  ctx.fillStyle = gr; ctx.fillRect(0, 0, VW, VH);
  if (theme === 'calle' || theme === 'mercado') {
    ctx.fillStyle = '#fff6c0'; ctx.beginPath(); ctx.arc(300, 44, 22 + Math.sin(t / 20) * 1.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#ffe98a55'; ctx.beginPath(); ctx.arc(300, 44, 32, 0, 7); ctx.fill();
  }
  const L = bgLayers(theme);
  const fx = -((camX * 0.2) % 512), mx = -((camX * 0.5) % 512);
  ctx.drawImage(L.far, Math.round(fx), 0); ctx.drawImage(L.far, Math.round(fx) + 512, 0);
  ctx.drawImage(L.mid, Math.round(mx), 0); ctx.drawImage(L.mid, Math.round(mx) + 512, 0);
  // el universo se empieza a romper según el ritmo de César
  if (ritmo > 50) {
    const k = (ritmo - 50) / 50;
    ctx.fillStyle = `rgba(255,30,80,${0.18 * k})`; ctx.fillRect(0, 0, VW, VH);
    if (Math.random() < 0.05 + k * 0.2) {
      const y = Math.random() * VH, h = 2 + Math.random() * 10;
      ctx.drawImage(cv, 0, y, VW, h, (Math.random() - 0.5) * 20 * k, y, VW, h);
    }
  }
}
