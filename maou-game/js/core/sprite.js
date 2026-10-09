// このファイルの役目：人物のドット絵を型紙（js/data/sprites.js）から作り、向きと歩きの絵を用意する。
// 宝箱や立て札など、マップ上の小物の絵もここで描く。
(function () {
  const G = window.GAME = window.GAME || {};
  const T = 16;
  const cache = {};

  function paint(rows, palette, flip) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = T;
    const c = cv.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < T; x++) {
        const col = palette[row[x]];
        if (!col) continue;
        c.fillStyle = col;
        c.fillRect(flip ? T - 1 - x : x, y, 1, 1);
      }
    });
    return cv;
  }

  // 歩きの絵の並び：立ち → 一歩目 → 立ち → 二歩目
  const CYCLE = [0, 1, 0, 2];

  function person(lookId, dir, step) {
    const key = lookId + ':' + dir + ':' + step;
    if (cache[key]) return cache[key];
    const S = G.DATA.sprites;
    const palette = S.LOOKS[lookId] || S.LOOKS.bell;
    const bodyDir = dir === 'right' ? 'left' : dir;
    const legs = S.LEGS[bodyDir === 'left' ? 'side' : 'front'];
    let legRows = legs[step === 0 ? 0 : 1];
    // 二歩目：前向き・後ろ向きは足だけ左右反転
    if (step === 2 && bodyDir !== 'left') legRows = legRows.map(r => r.split('').reverse().join(''));
    const rows = S.BODY[bodyDir].concat(legRows);
    cache[key] = paint(rows, palette, dir === 'right');
    return cache[key];
  }

  function makeObj(drawFn) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = T;
    drawFn(cv.getContext('2d'));
    return cv;
  }
  const r = (c, col, x, y, w, h) => { c.fillStyle = col; c.fillRect(x, y, w, h); };
  const OBJECTS = {
    chest: () => makeObj(c => {
      r(c, '#120e16', 1, 4, 14, 11); r(c, '#9a5a2a', 2, 5, 12, 9); r(c, '#b8743a', 2, 5, 12, 3);
      r(c, '#120e16', 2, 8, 12, 1); r(c, '#e8c860', 7, 7, 2, 3); r(c, '#d8b048', 2, 5, 1, 9); r(c, '#d8b048', 13, 5, 1, 9);
    }),
    chestOpen: () => makeObj(c => {
      r(c, '#120e16', 1, 2, 14, 13); r(c, '#6e3a1a', 2, 3, 12, 4); r(c, '#2a1a10', 3, 7, 10, 2);
      r(c, '#9a5a2a', 2, 9, 12, 5); r(c, '#d8b048', 2, 9, 1, 5); r(c, '#d8b048', 13, 9, 1, 5);
    }),
    sign: () => makeObj(c => {
      r(c, '#5a3a1e', 7, 9, 2, 6); r(c, '#120e16', 2, 2, 12, 8); r(c, '#b08050', 3, 3, 10, 6);
      r(c, '#6e4a2a', 4, 5, 8, 1); r(c, '#6e4a2a', 4, 7, 6, 1);
    }),
  };
  const objCache = {};

  G.sprite = {
    // 人物を描く。walk はこれまで歩いた距離（px）。動いていなければ立ち絵
    drawPerson(ctx, lookId, dir, walk, moving, x, y) {
      const step = moving ? CYCLE[Math.floor(walk / 8) % 4] : 0;
      ctx.drawImage(person(lookId, dir, step), Math.round(x), Math.round(y));
    },
    drawObject(ctx, kind, x, y) {
      if (!objCache[kind]) objCache[kind] = OBJECTS[kind]();
      ctx.drawImage(objCache[kind], Math.round(x), Math.round(y));
    },
  };
})();
