// このファイルの役目：町の宿屋・店の戸の上に、絵の吊り看板（宿屋＝ベッド・武具＝剣と盾・道具＝薬びん・商店＝銭袋）を描く。
// 戸の行き先の部屋（12×9までの小さな部屋。魔界の市場のような広い所は除く）に宿の主人（inn）か店の人（shop）がいれば看板を出す。
// 店は名前で分ける：武具屋・工房・鍛冶は「武具」、道具屋・薬屋・茶屋は「道具」、それ以外（両方を売る市や店）は「商店」。
// 歩く画面（js/scenes/map.js）の描画から呼ぶ。看板の絵と色は下の KINDS。
(function () {
  const G = window.GAME = window.GAME || {};

  // 看板の絵（12×12のドット。一目でわかるように：宿屋＝ベッド、武具＝剣と盾、道具＝薬びん、商店＝銭袋）
  // 文字1つが1ドット。'.' は塗らない。色は pal から引く。
  const KINDS = {
    inn: { board: '#7a4a24', pal: { w: '#ffffff', b: '#5a8ad8', B: '#3a64b0', p: '#c89058', d: '#5a3418' }, dots: [
      '............',
      '............',
      'd...........',
      'd...........',
      'd...........',
      'dww.........',
      'dwwbbbbbbbb.',
      'dwwbbbbbbbbd',
      'dBBBBBBBBBBd',
      'dppppppppppd',
      'd..........d',
      '............',
    ] },
    gear: { board: '#3e3e4e', pal: { s: '#e8eef8', S: '#9aa6bc', y: '#f0c040', g: '#7a4a24', r: '#c83c3c', R: '#8a2020', k: '#f0c040' }, dots: [
      '.........ss.',
      '........sSs.',
      '.......sSs..',
      'kkkkk.sSs...',
      'kRRRksSs....',
      'kRrRSs......',
      'kRrry.......',
      'kRRyRy......',
      '.kRRgky.....',
      '.kRgRk......',
      '..gkk.......',
      '.g..........',
    ] },
    item: { board: '#2e5a3a', pal: { c: '#e8f0ff', k: '#8a5a2a', g: '#58d870', G: '#2c9a44', h: '#ffffff' }, dots: [
      '....kkkk....',
      '....kkkk....',
      '.....cc.....',
      '.....cc.....',
      '....c..c....',
      '...c....c...',
      '..cggggggc..',
      '..chgggggc..',
      '..chgggGGc..',
      '..cgggGGGc..',
      '...cGGGGc...',
      '....cccc....',
    ] },
    mixed: { board: '#6a3a4a', pal: { t: '#d8b070', T: '#9a7040', y: '#f0c040', Y: '#b88a20' }, dots: [
      '............',
      '....T..T....',
      '.....TT.....',
      '....tttt....',
      '...tttttt...',
      '..ttttttTt..',
      '..ttyyttTt..',
      '..tyYYytTt..',
      '..ttyyttTt..',
      '..tttttTTt..',
      '...TTTTTT...',
      '............',
    ] },
  };

  // 部屋のマップから、看板の種類を決める（なければ null）
  function kindOf(roomId) {
    const room = G.DATA.maps[roomId];
    if (!room || !room.npcs || room.rows.length > 9 || room.rows[0].length > 12) return null;
    if (room.npcs.some(n => n.inn)) return 'inn';
    const seller = room.npcs.find(n => n.shop);
    if (!seller) return null;
    const name = (G.DATA.shops[seller.shop] || {}).name || '';
    return /武具|工房|鍛冶/.test(name) ? 'gear' : /道具|薬|茶屋/.test(name) ? 'item' : 'mixed';
  }

  // マップごとの看板（並んだ両開きの戸は1枚にまとめる）
  const cache = {};
  function list(mapId) {
    if (cache[mapId]) return cache[mapId];
    const out = [];
    ((G.DATA.maps[mapId] || {}).warps || []).forEach(w => {
      const kind = kindOf(w.to);
      if (!kind) return;
      const near = out.find(o => o.to === w.to && o.y === w.y && Math.abs(o.x1 - w.x) <= 1);
      if (near) near.x1 = Math.max(near.x1, w.x), near.x0 = Math.min(near.x0, w.x);
      else out.push({ to: w.to, kind, x0: w.x, x1: w.x, y: w.y });
    });
    return (cache[mapId] = out);
  }

  // 戸の上の壁に、絵の看板を描く
  function draw(ctx, mapId, cam, T) {
    const r = G.renderer;
    list(mapId).forEach(s => {
      const k = KINDS[s.kind], w = 16, h = 16;
      const cx = Math.round((s.x0 + s.x1 + 1) / 2 * T - cam.x), top = Math.round(s.y * T - cam.y - h - 2);
      if (cx < -w || cx > r.W + w || top < -h || top > r.H) return;
      r.rect(cx - 6, top - 3, 1, 3, '#1a120c'); r.rect(cx + 5, top - 3, 1, 3, '#1a120c');   // 吊り紐
      r.rect(cx - w / 2 - 1, top - 1, w + 2, h + 2, '#1a120c');
      r.rect(cx - w / 2, top, w, h, k.board);
      const x0 = cx - 6, y0 = top + 2;
      k.dots.forEach((row, y) => { for (let x = 0; x < row.length; x++) { const c = k.pal[row[x]]; if (c) r.rect(x0 + x, y0 + y, 1, 1, c); } });
    });
  }

  G.shopSigns = { kindOf, list, draw };
})();
