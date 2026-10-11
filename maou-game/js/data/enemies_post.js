// このファイルの役目：クリア後の敵の一覧。師との手合わせの相手、ベル（特訓・最終手合わせ）、大穴の最深部に出る敵。
// 手合わせは「耐えきれば勝ち」（場面のほうで決める）。書き方は js/data/enemies.js と同じ。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  const H = G.DATA.enemies.otte.sprite;   // 人の形の型紙（enemies_part3.js と同じ）

  Object.assign(G.DATA.enemies, {
    // 師（手合わせ）
    haniyasu_t: {
      name: 'ハニヤス', counter: '人', hp: 999, atk: 30, def: 50, agi: 6, exp: 60, copper: 0,
      palette: { K: '#120e16', H: '#c8a070', D: '#4a4030', E: '#c08020', W: '#d8c8a0' }, sprite: H,
    },
    nakime_t: {
      name: 'ナキメ', counter: '人', hp: 999, atk: 26, def: 40, agi: 18, exp: 60, copper: 0,
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'surikomi' }],
      palette: { K: '#120e16', H: '#e8d0c0', D: '#22222e', E: '#c0a020', W: '#6a6a80' }, sprite: H,
    },
    bell_t: {
      name: 'ベル', counter: '人', hp: 999, atk: 40, def: 60, agi: 20, exp: 80, copper: 0,
      palette: { K: '#0a0608', H: '#e0c0a8', D: '#1a141e', E: '#d02030', W: '#3a2a40' }, sprite: H,
    },
    // ベルとの最終手合わせ（試練の扉のあと）
    bell_final: {
      name: 'ベルイザナ', counter: '人', hp: 999, atk: 52, def: 80, agi: 30, exp: 500, copper: 0,
      actions: [{ w: 3, type: 'attack' }, { w: 1, type: 'kotodama', id: 'kangen' }],
      palette: { K: '#0a0608', H: '#e0c0a8', D: '#0e0a12', E: '#ff2030', W: '#5a2a40' }, sprite: H,
    },
    // 大穴の最深部
    kage_oni: {
      name: '影鬼', hp: 90, atk: 38, def: 26, agi: 14, exp: 70, copper: 30,
      drop: { item: 'kizugusuri', rank: 'A' },
      palette: { K: '#06040a', H: '#3a2a4a', D: '#1e1428', E: '#ff4040', W: '#a090c0' }, sprite: H,
    },
    yomi_hebi: {
      name: '黄泉蛇', hp: 110, atk: 34, def: 30, agi: 10, exp: 80, copper: 34,
      drop: { item: 'dokukeshi', rank: 'A' },
      onHit: { status: 'venom', chance: 0.2 },
      palette: { K: '#0a0606', H: '#5a2a4a', D: '#2e1424', E: '#f0e040', W: '#e8c0d0' },
      sprite: G.DATA.enemies.centipede.sprite,
    },
    na_kui: {
      name: '名喰い', hp: 80, atk: 30, def: 24, agi: 20, exp: 75, copper: 32,
      drop: { item: 'mezamashi', rank: 'A' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }],
      resist: { sleep: 0, confuse: 0 },
      palette: { K: '#06060e', H: '#5a6ac8', D: '#2a3a8a', E: '#ffffff', W: '#c8d8ff' },
      sprite: G.DATA.enemies.onibi.sprite,
    },
  });
})();
