// このファイルの役目：会話だけの場面（回想など）の「背景の絵」を描く。
// 歩けるマップではなく、1枚の絵として描く。名前（key）で選ぶ。
// 魔界・過去回想は赤みがかった色、人間界は白〜青、が基本（仕様書 第11章）。作った絵（js/data/art.js の backgrounds）があればそれを描き、なければ下の DRAW の絵。
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
    // 焼けた根の洲の丘陵（2章。作った絵があればそちら）。エピローグの三か月後の黒い土は、火のない scorched_after
    scorched_after(r) { DRAW.scorched(r); },
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
    // ---- 第二部 ----
    // 夕焼けの帰り道（4章）
    sunset(r) {
      sky(r, [120, 60, 90], [240, 150, 70], 200);
      r.rect(0, 200, r.W, 120, '#4a5a2a');
      r.rect(150, 200, 180, 120, '#8a6a3e');
      for (let i = 0; i < 5; i++) r.rect(400 + i * 8, 186 - i * 2, 4, 4, '#ffe0a0');   // ミナモの灯
    },
    // 月明かりの森（5章）
    forest_night(r) {
      sky(r, [8, 12, 30], [20, 30, 50], 200);
      for (let x = 0; x < r.W; x += 40) r.rect(x + 10, 60 + (x % 80) / 4, 22, 200, '#0e1a12');
      r.rect(0, 220, r.W, 100, '#14201a');
      r.rect(380, 30, 16, 16, '#e8e8d0');
    },
    // 朝の森の出口（5章）
    forest_day(r) {
      sky(r, [150, 190, 150], [210, 230, 190], 200);
      for (let x = 0; x < r.W; x += 40) r.rect(x + 10, 40 + (x % 80) / 4, 22, 200, '#3a5a2a');
      r.rect(0, 220, r.W, 100, '#4a6a32');
      r.rect(200, 220, 80, 100, '#6a5a3a');
    },
    // 工房と炉（6章）
    workshop(r) {
      r.clear('#2a221e');
      r.rect(0, 230, r.W, 90, '#3a302a');
      r.rect(40, 90, 120, 140, '#5a5048'); r.rect(64, 150, 72, 60, '#2a1a10'); r.rect(72, 170, 56, 36, '#e05a1a'); r.rect(88, 180, 24, 18, '#ffc040');
      for (let x = 220; x < 460; x += 30) r.rect(x, 200, 6, 30, '#9a9a9a');   // 並んだ刃
    },
    // 宿舎の机（6章）
    lodging(r) {
      r.clear('#3a2e24');
      r.rect(0, 230, r.W, 90, '#4a3a2c');
      r.rect(240, 180, 160, 14, '#6e4a2a'); r.rect(280, 170, 60, 10, '#e8e0c8');   // 机と報告書
      r.rect(60, 60, 100, 80, '#1a1a2a'); r.rect(100, 110, 20, 20, '#e05a1a');     // 窓の外の炉
    },
    // 夜の井戸（7章）
    well_night(r) {
      sky(r, [8, 10, 28], [24, 28, 50], 220);
      r.rect(0, 220, r.W, 100, '#2a2a24');
      r.rect(200, 200, 80, 40, '#6a6a70'); r.rect(212, 206, 56, 10, '#1a2a40');
      for (let x = 100; x < 400; x += 90) { r.rect(x, 170, 3, 40, '#5a4a2a'); r.rect(x - 3, 164, 9, 8, '#f0a040'); }   // 松明
    },
    // ---- 第三部 ----
    // 白い都の通り（8章）
    city(r) {
      sky(r, [190, 210, 230], [230, 236, 240], 160);
      for (let x = 0; x < r.W; x += 70) { r.rect(x + 6, 90, 60, 140, '#f0f0ea'); r.rect(x + 2, 80, 68, 12, '#e0e0d8'); r.rect(x + 26, 180, 16, 50, '#d0d0c8'); }
      r.rect(0, 230, r.W, 90, '#e4e2da');
      r.rect(200, 30, 80, 50, '#f4f4f0'); r.rect(190, 70, 100, 10, '#e0e0d8');   // 円議堂の大屋根
    },
    // 祝賀の夜の広場（9章）
    festival(r) {
      sky(r, [10, 14, 40], [30, 36, 70], 200);
      for (let x = 0; x < r.W; x += 70) r.rect(x + 6, 100, 60, 130, '#c8c8c0');
      r.rect(0, 230, r.W, 90, '#9a9890');
      for (let i = 0; i < 14; i++) { const x = 20 + i * 33, y = 60 + (i % 3) * 14; r.rect(x, y - 20, 1, 20, '#5a5a5a'); r.rect(x - 5, y, 11, 13, '#f8e8b0'); }
    },
    // 祝賀の壇（9章：タケルとアマツ王）
    stage(r) {
      sky(r, [10, 14, 40], [30, 36, 70], 180);
      r.rect(60, 200, 360, 40, '#e8e8e0'); r.rect(60, 196, 360, 6, '#c8a040');
      r.rect(0, 240, r.W, 80, '#4a4a50');
      for (let i = 0; i < 10; i++) r.rect(20 + i * 48, 50 + (i % 2) * 10, 12, 14, '#f8e8b0');
    },
    // 貧民区の隠れ家（8章）
    safehouse(r) {
      r.clear('#1e1814');
      r.rect(0, 230, r.W, 90, '#2a221c');
      r.rect(170, 196, 140, 12, '#5a3e24'); r.rect(200, 186, 70, 10, '#e8e0c8');   // 卓と記録の束
      r.rect(380, 120, 70, 110, '#6a5a4a');   // 布の仕切り
      r.rect(60, 120, 30, 30, '#f0c060');     // 角灯
    },
    // 宿の屋根裏（8章）
    attic(r) {
      r.clear('#241c18');
      for (let i = 0; i < 6; i++) r.rect(0, 40 + i * 30, r.W, 4, '#3a2c22');
      r.rect(0, 230, r.W, 90, '#3a2e26');
      r.rect(300, 60, 40, 30, '#202848'); r.rect(318, 60, 4, 30, '#e8e8e0');   // 窓の隙間の白い灯
    },
    // やすらぎの院の門前（10章）
    sanatorium(r) {
      sky(r, [8, 10, 30], [24, 26, 50], 180);
      r.rect(80, 90, 320, 140, '#e8e8e0'); r.rect(70, 80, 340, 14, '#d0d0c8');
      for (let x = 110; x < 380; x += 50) r.rect(x, 120, 20, 30, '#f8e8b0');
      r.rect(0, 230, r.W, 90, '#3a3a34');
      for (let x = 30; x < r.W; x += 110) { r.rect(x, 190, 3, 40, '#5a4a2a'); r.rect(x - 3, 184, 9, 8, '#f0a040'); }
    },
    // 院の地下の神殿（9章）
    temple(r) {
      r.clear('#120e12');
      r.rect(0, 230, r.W, 90, '#221c20');
      for (let i = 0; i < 5; i++) r.rect(60 + i * 80, 70, 40, 60, i === 2 ? '#2a2226' : '#3a3036');
      r.rect(190, 170, 100, 50, '#1a1418'); r.rect(230, 150, 20, 20, '#8a6ac8');   // 祭壇と装置の光
    },
    // 比良坂の大穴（10章・エピローグ）
    hirasaka(r) {
      sky(r, [40, 20, 50], [200, 120, 110], 200);
      r.rect(0, 200, r.W, 120, '#3a2e2a');
      r.rect(140, 220, 200, 100, '#0a0608');
      r.rect(238, 120, 4, 120, 'rgba(255,240,220,0.7)');   // 底から昇る光の筋
    },
    // 坂上の砦（11・12章）
    fortress(r) {
      sky(r, [200, 160, 120], [240, 220, 180], 160);
      r.rect(0, 120, 80, 120, '#8a8278'); r.rect(400, 120, 80, 120, '#8a8278');
      for (let x = 0; x < 80; x += 16) r.rect(x, 110, 10, 10, '#8a8278');
      for (let x = 400; x < 480; x += 16) r.rect(x, 110, 10, 10, '#8a8278');
      r.rect(0, 240, r.W, 80, '#a89c8c');
    },
    // 衢の里の円卓（エピローグ）
    roundtable(r) {
      sky(r, [150, 190, 220], [220, 230, 230], 180);
      r.rect(0, 200, r.W, 120, '#8a9a6a');
      c(r, 240, 230, 90, 22, '#f0f0ea');
    },
    // 朝の葛の里の井戸（エピローグ）
    village_day(r) {
      sky(r, [150, 190, 220], [230, 230, 210], 180);
      r.rect(0, 200, r.W, 120, '#a8925e');
      r.rect(200, 200, 80, 40, '#6a6a70'); r.rect(212, 206, 56, 10, '#3a5a80');
      r.rect(60, 130, 90, 70, '#8a8278'); r.rect(50, 116, 110, 16, '#a88a4a');
    },
    // 試練の扉の奥：四つの言霊が光となって巡り、五つ目の窪みが灯る（クリア後）
    trial(r) {
      r.clear('#06040c');
      const cols = ['#b8a070', '#f08050', '#80d890', '#a0a8f0'];
      const t = (G.frame || 0) / 40;
      for (let i = 0; i < 4; i++) {
        const a = t + i * Math.PI / 2;
        c(r, 240 + Math.cos(a) * 110, 150 + Math.sin(a) * 60, 9, 9, cols[i]);
      }
      c(r, 240, 150, 16 + Math.sin(t * 2) * 3, 16 + Math.sin(t * 2) * 3, '#f0e8a0');
      r.rect(0, 250, r.W, 70, '#100c18');
    },
  };

  // 楕円（円卓など）
  function c(r, x, y, rx, ry, color) {
    const ctx = r.ctx; ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  }

  G.backdrop = {
    draw(key) {
      const r = G.renderer, img = G.sprite && G.sprite.backgroundOf && G.sprite.backgroundOf(key);
      if (img) { r.ctx.imageSmoothingEnabled = false; r.ctx.drawImage(img, 0, 0, r.W, r.H); return; }
      (DRAW[key] || (r2 => r2.clear('#000')))(r);
    },
    has(key) { return !!DRAW[key]; },
  };
})();
