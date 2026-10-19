// このファイルの役目：メニューの「ちず」の画面。いま歩いている外の地図（人間界・魔界）の全体を小さく描き、町や城の入口と、いまいる所を出す。
// 入口は、いま入れる所は黄色、まだ入れない所は灰色。いる所は赤く点滅。外の地図にいないときは開けない（メニューから案内を出す）。
// 色は地形の見た目（tiles.js の look）ごと（下の COLORS）。絵は一度だけ作って使い回す。
(function () {
  const G = window.GAME = window.GAME || {};
  G.scenes = G.scenes || {};

  const COLORS = {
    water: '#2c5fa8', grass: '#5aa046', flowers: '#7ab456', tree: '#2a6a30', woods: '#22682a', mountain: '#7a7068', dirt: '#b48c5a',
    planks: '#8a6038', waste: '#c8b27a', yomiland: '#5a3a46', redland: '#9a4a2a', steppe: '#8a8a5e', crag: '#3c3c4a', valley: '#4e3b2c',
    embers: '#3a2a22', reddirt: '#aa5a46', shrine: '#d04030', shrine_y: '#d04030',
  };
  const cache = {};
  function picture(id) {
    if (cache[id]) return cache[id];
    const m = G.DATA.maps[id], T = G.DATA.tiles, cv = document.createElement('canvas');
    cv.width = m.rows[0].length; cv.height = m.rows.length;
    const c = cv.getContext('2d');
    m.rows.forEach((row, y) => [...row].forEach((ch, x) => { c.fillStyle = COLORS[(T[ch] || {}).look] || '#d8c8a0'; c.fillRect(x, y, 1, 1); }));
    return (cache[id] = cv);
  }

  G.scenes.worldMap = function () {
    const id = G.state.mapId, m = G.DATA.maps[id], p = { x: G.state.x, y: G.state.y };   // いる所（マップの画面が歩くたびに書く）
    const W = m.rows[0].length, H = m.rows.length;
    const S = Math.min(456 / W, 246 / H);   // 1マスの大きさ（ドット。画面に収まる大きさ）
    const ox = Math.round((480 - W * S) / 2), oy = 34;
    // いる所にいちばん近い地名
    const near = (m.places || []).map(pl => ({ pl, d: Math.abs(pl.x - p.x) + Math.abs(pl.y - p.y) })).sort((a, b) => a.d - b.d)[0];
    return {
      name: 'ちず',
      update() { if (G.input.pressed('cancel') || G.input.pressed('ok')) { G.sound.se('cancel'); G.scene.pop(); } },
      draw() {
        const r = G.renderer, ctx = r.ctx;
        r.rect(0, 0, r.W, r.H, 'rgba(0,0,0,0.75)');
        G.ui.drawWindow(ox - 8, 6, W * S + 16, H * S + 52);
        r.text(m.name + 'の地図', r.W / 2, 14, '#ffd866', 'center');
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(picture(id), ox, oy, W * S, H * S);
        // 町や城の入口（いま入れる所は黄色）
        (m.warps || []).forEach(w => {
          const ok = !w.requires || G.flags.check(w.requires);
          r.rect(ox + w.x * S - 2, oy + w.y * S - 2, S + 4, S + 4, '#1a1410');
          r.rect(ox + w.x * S - 1, oy + w.y * S - 1, S + 2, S + 2, ok ? '#ffd866' : '#8a8a8a');
        });
        // いる所
        if (G.ui.blinkOn()) {
          r.rect(ox + p.x * S - 3, oy + p.y * S - 3, S + 6, S + 6, '#ffffff');
          r.rect(ox + p.x * S - 2, oy + p.y * S - 2, S + 4, S + 4, '#e02020');
        }
        const by = oy + H * S + 4, lw = Math.round(W * S);
        r.text(near && near.d <= 12 ? `いる所：${near.pl.name}の近く` : 'いる所：赤い印', ox, by, '#fff', 'left', null, lw - 190);
        // 印の見本
        r.rect(ox + lw - 182, by + 3, 7, 7, '#ffd866'); r.text('入れる', ox + lw - 172, by, '#ccc');
        r.rect(ox + lw - 112, by + 3, 7, 7, '#8a8a8a'); r.text('まだ入れない', ox + lw, by, '#ccc', 'right');
      },
    };
  };
})();
