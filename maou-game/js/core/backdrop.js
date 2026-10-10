// このファイルの役目：会話だけの場面（回想など）の「背景の絵」を描く。
// 歩けるマップではなく、1枚の絵として描く。名前（key）で選ぶ。
// 魔界・過去回想は赤みがかった色、人間界は白〜青、が基本（仕様書 第11章）。
(function () {
  const G = window.GAME = window.GAME || {};

  function sky(r, top, bottom, h) {
    for (let i = 0; i < h / 8; i++) {
      const t = i / (h / 8 - 1);
      const c = top.map((v, k) => Math.round(v + (bottom[k] - v) * t));
      r.rect(0, i * 8, r.W, 8, `rgb(${c[0]},${c[1]},${c[2]})`);
    }
  }

  const DRAW = {
    // 大穴へ続く荒れた岩場の街道
    road(r) {
      sky(r, [90, 20, 24], [150, 60, 40], 160);
      r.rect(0, 160, r.W, 160, '#3a2a26');
      for (let i = 0; i < 9; i++) r.rect(20 + i * 52, 150 - (i % 3) * 10, 30, 20 + (i % 3) * 10, '#2a1c1a');
      r.rect(180, 160, 120, 160, '#5a4438');
    },
    // 大穴の縁の、白い石の会談の間
    hall(r) {
      r.clear('#d8d4cc');
      for (let x = 0; x < r.W; x += 60) r.rect(x + 20, 0, 14, 230, '#bab4aa');
      r.rect(0, 230, r.W, 90, '#c8c2b8');
      r.rect(120, 190, 240, 14, '#8a6a4a');   // 卓
    },
    // 魔界側へ続く暗い回廊
    corridor(r) {
      r.clear('#120a0c');
      for (let i = 0; i < 6; i++) { const w = 400 - i * 60, h = 280 - i * 44; r.rect((r.W - w) / 2, (r.H - h) / 2, w, h, `rgb(${30 - i * 4},${16 - i * 2},${18 - i * 2})`); }
    },
    // 焼けた根の洲の丘陵
    scorched(r) {
      sky(r, [110, 30, 20], [60, 16, 14], 150);
      r.rect(0, 150, r.W, 170, '#1e1612');
      for (let i = 0; i < 7; i++) { const x = 30 + i * 66; r.rect(x, 110 + (i % 2) * 14, 4, 50, '#0e0a08'); r.rect(x - 6, 120 + (i % 2) * 14, 16, 3, '#0e0a08'); }
    },
    // 夕陽の段々の田と収穫祭の卓
    fields(r) {
      sky(r, [180, 70, 40], [220, 150, 70], 120);
      for (let i = 0; i < 6; i++) r.rect(0, 120 + i * 20, r.W, 18, i % 2 ? '#b89a3a' : '#c8aa48');
      r.rect(60, 250, 360, 12, '#6e4a2a');
    },
    // 黄泉津の宮の牢
    prison(r) {
      r.clear('#1a1416');
      r.rect(0, 220, r.W, 100, '#2a2224');
      r.rect(300, 20, 6, 30, '#c03030');   // 高い窓の赤い光
      for (let x = 60; x < 420; x += 24) r.rect(x, 40, 4, 190, '#5a5a62');
    },
    // 王の広間
    palace(r) {
      r.clear('#22161c');
      for (let x = 30; x < r.W; x += 90) r.rect(x, 0, 18, 240, '#3a2a32');
      r.rect(0, 240, r.W, 80, '#2e2026');
      r.rect(220, 0, 40, 320, '#5a1e24');
    },
    // 黄泉津の宮の露台（夜）
    balcony(r) {
      sky(r, [60, 10, 20], [120, 30, 30], 220);
      r.rect(0, 220, r.W, 100, '#2a2024');
      for (let x = 0; x < r.W; x += 20) r.rect(x, 200, 6, 24, '#4a3a40');
      r.rect(0, 198, r.W, 6, '#5a4a50');
      r.rect(380, 60, 2, 140, 'rgba(255,240,220,0.6)');   // 比良坂の光の筋
    },
  };

  G.backdrop = {
    draw(key) { (DRAW[key] || (r => r.clear('#000')))(G.renderer); },
    has(key) { return !!DRAW[key]; },
  };
})();
