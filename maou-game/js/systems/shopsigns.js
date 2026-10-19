// このファイルの役目：町の宿屋・店の戸の上に、吊り看板（「宿屋」「武具」「道具」）を描く。
// 戸の行き先の部屋（12×9までの小さな部屋。魔界の市場のような広い所は除く）に宿の主人（inn）か店の人（shop）がいれば看板を出す。
// 店は名前で分ける：武具屋・工房・鍛冶は「武具」、道具屋・薬屋・茶屋は「道具」、それ以外（両方を売る市や店）は「商店」。
// 歩く画面（js/scenes/map.js）の描画から呼ぶ。看板の文字と色は下の KINDS。
(function () {
  const G = window.GAME = window.GAME || {};

  const KINDS = {
    inn:  { text: '宿屋', board: '#7a4a24', ink: '#fff4d8' },
    gear: { text: '武具', board: '#4a4a5a', ink: '#ffe08a' },
    item: { text: '道具', board: '#2e5a3a', ink: '#f0ffe0' },
    mixed: { text: '商店', board: '#6a3a4a', ink: '#fff0f0' },
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

  // 戸の上の壁に、看板を描く
  function draw(ctx, mapId, cam, T) {
    const r = G.renderer;
    list(mapId).forEach(s => {
      const k = KINDS[s.kind], w = 26, h = 13;
      const cx = (s.x0 + s.x1 + 1) / 2 * T - cam.x, top = s.y * T - cam.y - h - 2;
      if (cx < -w || cx > r.W + w || top < -h || top > r.H) return;
      r.rect(cx - w / 2 - 1, top - 1, w + 2, h + 2, '#1a120c');
      r.rect(cx - w / 2, top, w, h, k.board);
      r.rect(cx - 6, top - 3, 1, 3, '#1a120c'); r.rect(cx + 5, top - 3, 1, 3, '#1a120c');   // 吊り紐
      r.text(k.text, cx, top + 1, k.ink, 'center', 10);
    });
  }

  G.shopSigns = { kindOf, list, draw };
})();
