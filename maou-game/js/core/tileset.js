// このファイルの役目：マス目（16×16）の絵を、Canvasの点と四角で描いて用意する。
// 一度描いた絵はとっておき、毎回使い回す（動きが軽くなる）。水だけは2枚の絵を交互に出して揺らす。
(function () {
  const G = window.GAME = window.GAME || {};
  const T = 16;

  // 場所ごとに決まった「でたらめ」な数（模様を毎回同じにするため）
  function hash(x, y, s) {
    let h = (x * 374761393 + y * 668265263 + s * 982451653) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function fill(c, color, x, y, w, h) { c.fillStyle = color; c.fillRect(x || 0, y || 0, w || T, h || T); }
  function dot(c, color, x, y) { c.fillStyle = color; c.fillRect(x, y, 1, 1); }
  function speckle(c, colors, density, seed) {
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
      const v = hash(x, y, seed);
      if (v < density) dot(c, colors[Math.floor(hash(y, x, seed + 1) * colors.length)], x, y);
    }
  }

  const LOOKS = {
    grass(c) { fill(c, '#3f8a3a'); speckle(c, ['#4fa046', '#2f6e2c'], 0.18, 1); },
    tallgrass(c) {
      LOOKS.grass(c);
      for (let i = 0; i < 6; i++) {
        const x = 1 + Math.floor(hash(i, 0, 7) * 13), y = 4 + Math.floor(hash(0, i, 7) * 9);
        fill(c, '#2a5e27', x, y, 1, 3); fill(c, '#5cb050', x + 1, y - 1, 1, 3);
      }
    },
    flowers(c) {
      LOOKS.grass(c);
      [[3, 4, '#e8506a'], [10, 3, '#f2d24b'], [6, 10, '#f2f2f2'], [12, 11, '#e8506a'], [2, 13, '#f2d24b']]
        .forEach(([x, y, col]) => { fill(c, col, x, y, 2, 2); dot(c, '#7a3b1a', x, y); });
    },
    tree(c) {
      LOOKS.grass(c);
      fill(c, '#5a3a1e', 7, 11, 2, 4);
      c.fillStyle = '#1f5a24'; c.beginPath(); c.arc(8, 7, 6.5, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#2f7a32'; c.beginPath(); c.arc(7, 6, 4.5, 0, Math.PI * 2); c.fill();
      dot(c, '#4f9c48', 5, 4); dot(c, '#4f9c48', 6, 3); dot(c, '#4f9c48', 9, 5);
    },
    mountain(c) {
      LOOKS.grass(c);
      c.fillStyle = '#6b5a48'; c.beginPath(); c.moveTo(0, 15); c.lineTo(8, 1); c.lineTo(16, 15); c.closePath(); c.fill();
      c.fillStyle = '#857160'; c.beginPath(); c.moveTo(3, 15); c.lineTo(8, 1); c.lineTo(9, 15); c.closePath(); c.fill();
      c.fillStyle = '#eee'; c.beginPath(); c.moveTo(6, 5); c.lineTo(8, 1); c.lineTo(10, 5); c.closePath(); c.fill();
    },
    water(c, f) {
      fill(c, '#2a5fa8'); speckle(c, ['#245394'], 0.12, 3);
      const o = f ? 4 : 0;
      fill(c, '#6a9fe0', (2 + o) % 16, 4, 4, 1); fill(c, '#6a9fe0', (10 + o) % 16, 11, 4, 1);
      fill(c, '#4a7fc8', (9 + o) % 16, 5, 2, 1); fill(c, '#4a7fc8', (1 + o) % 16, 12, 2, 1);
    },
    planks(c) {
      fill(c, '#9a6b3f');
      for (let y = 3; y < T; y += 4) fill(c, '#6e4a2a', 0, y, T, 1);
      dot(c, '#5a3a1e', 4, 1); dot(c, '#5a3a1e', 11, 5); dot(c, '#5a3a1e', 6, 9); dot(c, '#5a3a1e', 13, 13);
    },
    stone(c) {
      fill(c, '#c9c2b4');
      fill(c, '#a69e8f', 0, 7, T, 1); fill(c, '#a69e8f', 0, 15, T, 1);
      fill(c, '#a69e8f', 5, 0, 1, 7); fill(c, '#a69e8f', 12, 8, 1, 7);
      speckle(c, ['#d8d2c6', '#b5ad9e'], 0.08, 5);
    },
    dirt(c) { fill(c, '#b08a56'); speckle(c, ['#c49c66', '#94733f'], 0.2, 9); },
    town(c) {
      LOOKS.grass(c);
      fill(c, '#e8e4da', 2, 8, 5, 5); fill(c, '#4a5f8a', 1, 5, 7, 3);
      fill(c, '#e8e4da', 9, 6, 5, 7); fill(c, '#4a5f8a', 8, 3, 7, 3);
      fill(c, '#7a4e2a', 4, 10, 1, 3); fill(c, '#7a4e2a', 11, 10, 1, 3);
    },
    roof(c) {
      fill(c, '#4a5f8a');
      for (let y = 3; y < T; y += 4) fill(c, '#34466a', 0, y, T, 1);
      for (let y = 0; y < T; y += 4) for (let x = (y / 4) % 2 ? 0 : 4; x < T; x += 8) fill(c, '#34466a', x, y, 1, 3);
      fill(c, '#5c74a4', 0, 0, T, 1);
    },
    wall(c) {
      fill(c, '#e8e4da'); speckle(c, ['#d8d2c4'], 0.08, 11);
      fill(c, '#6b4a2e', 0, 0, T, 2); fill(c, '#6b4a2e', 0, 14, T, 2);
    },
    window(c) {
      LOOKS.wall(c);
      fill(c, '#6b4a2e', 4, 4, 8, 8); fill(c, '#8fb8e8', 5, 5, 6, 6); fill(c, '#6b4a2e', 7, 5, 2, 6);
    },
    door(c) {
      LOOKS.wall(c);
      fill(c, '#5a3a1e', 3, 2, 10, 14); fill(c, '#8a5a30', 4, 3, 8, 13);
      fill(c, '#6e4a2a', 8, 3, 1, 13); dot(c, '#e8c860', 10, 9); dot(c, '#e8c860', 6, 9);
    },
    barrel(c) {
      LOOKS.stone(c);
      fill(c, '#5a3a1e', 3, 2, 10, 13); fill(c, '#8a5a30', 4, 2, 8, 13);
      fill(c, '#3a3a3a', 3, 5, 10, 1); fill(c, '#3a3a3a', 3, 11, 10, 1);
    },
    well(c) {
      LOOKS.stone(c);
      c.fillStyle = '#7a7a80'; c.beginPath(); c.arc(8, 8, 7, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#1a2a40'; c.beginPath(); c.arc(8, 8, 4.5, 0, Math.PI * 2); c.fill();
      dot(c, '#6a9fe0', 7, 7);
    },
    floor(c) {
      fill(c, '#8a6a44');
      for (let y = 0; y < T; y += 4) fill(c, '#74563a', 0, y, T, 1);
      for (let y = 0; y < T; y += 4) fill(c, '#74563a', (y * 3) % 16, y, 1, 4);
    },
    innerwall(c) { fill(c, '#c9b48c'); fill(c, '#a8936c', 0, 12, T, 4); fill(c, '#e0d0a8', 0, 0, T, 1); },
    counter(c) { fill(c, '#5a3a1e'); fill(c, '#8a5a30', 0, 0, T, 6); fill(c, '#a87040', 0, 0, T, 1); },
    table(c) { LOOKS.floor(c); fill(c, '#6e4a2a', 1, 3, 14, 10); fill(c, '#8a5a30', 2, 4, 12, 8); },
    mat(c) { LOOKS.floor(c); fill(c, '#8a2a2a', 1, 2, 14, 12); fill(c, '#b04040', 2, 3, 12, 10); },
    void(c) { fill(c, '#000'); },
    // ---- 魔界（黄泉）：赤みがかった色 ----
    yomigrass(c) { fill(c, '#4a5a32'); speckle(c, ['#5a6a3a', '#3a4426', '#6a4a2a'], 0.18, 21); },
    deadtree(c) {
      LOOKS.yomigrass(c);
      fill(c, '#2a1a14', 7, 4, 2, 11); fill(c, '#2a1a14', 4, 6, 3, 1); fill(c, '#2a1a14', 9, 3, 3, 1);
      fill(c, '#2a1a14', 4, 5, 1, 1); fill(c, '#2a1a14', 11, 2, 1, 1);
    },
    reddirt(c) { fill(c, '#8a5a3e'); speckle(c, ['#9a6a48', '#704630'], 0.2, 23); },
    rice(c) {
      fill(c, '#5a5a2a');
      for (let i = 0; i < 8; i++) {
        const x = 1 + (i % 4) * 4, y = 2 + Math.floor(i / 4) * 7;
        fill(c, '#7a8a2a', x, y + 1, 1, 4); fill(c, '#c8a840', x - 1, y, 2, 2); dot(c, '#e0c050', x + 1, y + 1);
      }
    },
    ridge(c) { fill(c, '#6a4a32'); speckle(c, ['#7a5a3e', '#5a3c28'], 0.18, 25); fill(c, '#5a3c28', 0, 15, T, 1); },
    sprout(c) { LOOKS.ridge(c); fill(c, '#4aa040', 7, 8, 1, 4); fill(c, '#6ad050', 5, 7, 2, 2); fill(c, '#6ad050', 8, 6, 2, 2); },
    feast(c) { LOOKS.yomigrass(c); fill(c, '#4a2e1a', 0, 4, T, 9); fill(c, '#7a4e2a', 0, 4, T, 5); fill(c, '#9a6a3a', 0, 4, T, 1); },
    sakebarrel(c) {
      LOOKS.yomigrass(c);
      fill(c, '#3a2414', 3, 2, 10, 13); fill(c, '#6a4024', 4, 2, 8, 13);
      fill(c, '#1a1a1a', 3, 5, 10, 1); fill(c, '#1a1a1a', 3, 11, 10, 1); fill(c, '#c03030', 6, 7, 4, 3);
    },
    awning(c) {
      for (let x = 0; x < T; x += 4) fill(c, (x / 4) % 2 ? '#e0d0b0' : '#8a2a2a', x, 0, 4, 12);
      fill(c, '#5a1a1a', 0, 12, T, 2); fill(c, '#3a2a20', 0, 14, T, 2);
    },
    darkwall(c) {
      fill(c, '#2e2228'); speckle(c, ['#3a2c34', '#241a20'], 0.12, 27);
      fill(c, '#1a1216', 0, 7, T, 1); fill(c, '#1a1216', 0, 15, T, 1); fill(c, '#1a1216', 7, 0, 1, 7); fill(c, '#1a1216', 3, 8, 1, 7);
    },
    gate(c) { fill(c, '#1a1216'); fill(c, '#4a2a2a', 2, 0, 12, T); fill(c, '#2a1a1a', 7, 0, 2, T); dot(c, '#c8a040', 6, 8); dot(c, '#c8a040', 9, 8); },
    darkstone(c) {
      fill(c, '#3a3036'); speckle(c, ['#443a40', '#30282c'], 0.1, 29);
      fill(c, '#2c2428', 0, 15, T, 1); fill(c, '#2c2428', 15, 0, 1, T);
    },
    carpet(c) { fill(c, '#6a1a22'); fill(c, '#8a2a30', 2, 0, 12, T); fill(c, '#c8a040', 1, 0, 1, T); fill(c, '#c8a040', 14, 0, 1, T); },
    pillar(c) { LOOKS.darkstone(c); fill(c, '#5a4a52', 3, 0, 10, T); fill(c, '#6e5e66', 4, 0, 3, T); fill(c, '#2a2026', 3, 14, 10, 2); },
    throne(c) {
      LOOKS.carpet(c);
      fill(c, '#2a1a20', 2, 1, 12, 14); fill(c, '#4a2a34', 3, 2, 10, 8); fill(c, '#8a2a30', 4, 9, 8, 4);
      dot(c, '#c8a040', 3, 1); dot(c, '#c8a040', 12, 1);
    },
    bars(c) { LOOKS.darkstone(c); for (let x = 1; x < T; x += 4) fill(c, '#7a7a84', x, 0, 2, T); fill(c, '#5a5a64', 0, 2, T, 2); },
    railing(c) { LOOKS.redsky(c); fill(c, '#4a3a40', 0, 9, T, 2); for (let x = 1; x < T; x += 5) fill(c, '#4a3a40', x, 9, 2, 7); },
    redsky(c) { fill(c, '#4a1420'); speckle(c, ['#5a1a26', '#3a1018'], 0.1, 31); },
  };

  const cache = {};
  function get(look, frame) {
    const key = look + ':' + frame;
    if (!cache[key]) {
      const cv = document.createElement('canvas');
      cv.width = cv.height = T;
      const c = cv.getContext('2d');
      (LOOKS[look] || LOOKS.void)(c, frame);
      cache[key] = cv;
    }
    return cache[key];
  }

  G.tileset = {
    draw(ctx, look, x, y) {
      const frame = look === 'water' ? Math.floor(G.frame / 40) % 2 : 0;
      ctx.drawImage(get(look, frame), x, y);
    },
  };
})();
