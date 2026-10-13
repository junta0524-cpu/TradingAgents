// このファイルの役目：人物のドット絵を型紙（js/data/sprites.js）から作り、向きと歩きの絵を用意する。
// 宝箱や立て札など、マップ上の小物の絵と、戦闘の敵の絵もここで描く。
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
    // ---- ダンジョンのしかけ（js/systems/gimmick.js）----
    boulder: () => makeObj(c => {
      r(c, '#2a2420', 2, 3, 12, 12); r(c, '#7a7068', 3, 2, 10, 12); r(c, '#958a80', 4, 3, 6, 4); r(c, '#5a524a', 3, 11, 10, 3); r(c, '#b0a598', 5, 4, 2, 1);
    }),
    leverOff: () => makeObj(c => { r(c, '#3a3a40', 3, 11, 10, 4); r(c, '#6a6a74', 4, 12, 8, 2); r(c, '#8a5a30', 4, 4, 2, 8); r(c, '#c03030', 3, 3, 4, 3); }),
    leverOn: () => makeObj(c => { r(c, '#3a3a40', 3, 11, 10, 4); r(c, '#6a6a74', 4, 12, 8, 2); r(c, '#8a5a30', 10, 4, 2, 8); r(c, '#30c050', 9, 3, 4, 3); }),
    plate: () => makeObj(c => { r(c, '#3a3a40', 2, 2, 12, 12); r(c, '#6a6a74', 3, 3, 10, 10); r(c, '#8a8a94', 3, 3, 10, 1); }),
    plateOn: () => makeObj(c => { r(c, '#3a3a40', 2, 2, 12, 12); r(c, '#4a6a54', 3, 3, 10, 10); r(c, '#7ad08a', 6, 6, 4, 4); }),
    lanternOff: () => makeObj(c => { r(c, '#3a3a40', 5, 13, 6, 2); r(c, '#5a5a64', 7, 9, 2, 4); r(c, '#4a4a54', 4, 3, 8, 7); r(c, '#2a2a30', 5, 4, 6, 5); r(c, '#6a6a74', 3, 2, 10, 2); }),
    lanternOn: () => makeObj(c => { r(c, '#3a3a40', 5, 13, 6, 2); r(c, '#5a5a64', 7, 9, 2, 4); r(c, '#4a4a54', 4, 3, 8, 7); r(c, '#f0b040', 5, 4, 6, 5); r(c, '#fff0a0', 7, 5, 2, 3); r(c, '#6a6a74', 3, 2, 10, 2); }),
    torchOff: () => makeObj(c => { r(c, '#3a3028', 6, 7, 4, 8); r(c, '#5a4a38', 4, 5, 8, 3); r(c, '#2a2420', 6, 3, 4, 2); }),
    torchOn: () => makeObj(c => { r(c, '#3a3028', 6, 7, 4, 8); r(c, '#5a4a38', 4, 5, 8, 3); r(c, '#e05020', 5, 1, 6, 4); r(c, '#f0b040', 6, 2, 4, 3); r(c, '#fff0a0', 7, 3, 2, 2); }),
  };
  const objCache = {};
  const enemyCache = {};

  // 敵の絵（js/data/enemies.js の型紙）を作る
  function enemyCanvas(id) {
    if (!enemyCache[id]) {
      const d = G.DATA.enemies[id];
      enemyCache[id] = paint(d.sprite, d.palette, false);
    }
    return enemyCache[id];
  }

  G.sprite = {
    // 人物を描く。walk はこれまで歩いた距離（px）。動いていなければ立ち絵
    drawPerson(ctx, lookId, dir, walk, moving, x, y) {
      const step = moving ? CYCLE[Math.floor(walk / 8) % 4] : 0;
      ctx.drawImage(person(lookId, dir, step), Math.round(x), Math.round(y));
    },
    // 敵を scale 倍に拡大して描く（ドットはぼかさない）
    drawEnemy(ctx, id, x, y, scale) {
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(enemyCanvas(id), Math.round(x), Math.round(y), T * scale, T * scale);
    },
    drawObject(ctx, kind, x, y) {
      if (!objCache[kind]) objCache[kind] = OBJECTS[kind]();
      ctx.drawImage(objCache[kind], Math.round(x), Math.round(y));
    },
  };
})();
