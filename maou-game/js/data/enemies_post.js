// このファイルの役目：クリア後の敵の一覧。師との手合わせの相手、ベル（特訓・最終手合わせ）、大穴の最深部に出る敵。
// 手合わせは「耐えきれば勝ち」（場面のほうで決める）。書き方は js/data/enemies.js と同じ。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  const H = G.DATA.enemies.otte.sprite;   // 人の形の型紙（enemies_part3.js と同じ）
  // 残党軍の仲間呼びの候補（重みの合計100。将は1＝およそ1%）
  const CALL = [{ id: 'zantou_hohei', w: 30 }, { id: 'zantou_yumi', w: 25 }, { id: 'zantou_jutsu', w: 15 }, { id: 'zantou_kihei', w: 15 }, { id: 'zantou_hata', w: 7 }, { id: 'zantou_kusushi', w: 7 }];
  const RANK_AND_FILE = CALL.concat([{ id: 'zantou', w: 1 }]);

  Object.assign(G.DATA.enemies, {
    // 師（手合わせ）
    haniyasu_t: {
      tribe: 'tsuchigumo', name: 'ハニヤス', counter: '人', hp: 999, atk: 30, def: 50, agi: 6, wis: 26, exp: 60, copper: 0, big: true, artScale: 6,
      palette: { K: '#120e16', H: '#c8a070', D: '#4a4030', E: '#c08020', W: '#d8c8a0' }, sprite: H,
    },
    nakime_t: {
      tribe: 'karasu', name: 'ナキメ', counter: '人', hp: 999, atk: 26, def: 40, agi: 18, wis: 40, exp: 60, copper: 0, big: true, artScale: 6,
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'surikomi' }],
      palette: { K: '#120e16', H: '#e8d0c0', D: '#22222e', E: '#c0a020', W: '#6a6a80' }, sprite: H,
    },
    bell_t: {
      name: 'ベル', counter: '人', big: true, artScale: 6, hp: 999, atk: 40, def: 60, agi: 20, wis: 60, exp: 80, copper: 0,
      palette: { K: '#0a0608', H: '#e0c0a8', D: '#1a141e', E: '#d02030', W: '#3a2a40' }, sprite: H,
    },
    // ベルとの最終手合わせ（試練の扉のあと）
    bell_final: {
      name: 'ベルイザナ', counter: '人', big: true, artScale: 6, hp: 999, atk: 52, def: 80, agi: 30, wis: 80, exp: 500, copper: 0,
      actions: [{ w: 3, type: 'attack' }, { w: 1, type: 'kotodama', id: 'kangen' }],
      palette: { K: '#0a0608', H: '#e0c0a8', D: '#0e0a12', E: '#ff2030', W: '#5a2a40' }, sprite: H,
    },
    // 大穴の最深部
    kage_oni: {
      tribe: 'oni', name: '影鬼', hp: 90, atk: 38, def: 26, agi: 14, wis: 20, exp: 70, copper: 30,
      drop: { item: 'kizugusuri', rank: 'A' },
      palette: { K: '#06040a', H: '#3a2a4a', D: '#1e1428', E: '#ff4040', W: '#a090c0' }, sprite: H,
    },
    // ---- やりこみ（Lv40〜99向け。フィールドで、オオナムチのレベルに応じて出る）----
    // ---- 残党軍（ユーザー決定B）：王が倒れても洗脳の解けない旧王軍。みな洗脳された人なので目を覚まさせられる ----
    // 仲間呼び（call）で残党を呼ぶ。将（unique）は1回の戦いに1体まで。残党が将を呼ぶのは、呼ぶうちのおよそ1%（RANK_AND_FILE の w: 1）
    zantou: {
      big: true,   // 2体までなら大きく描く（js/scenes/battle.js）
      unique: true,   // 1回の戦いに1体まで（仲間呼びでも2体目は来ない）
      name: '残党の将', counter: '人', hp: 1300, atk: 195, def: 155, agi: 115, wis: 130, exp: 2500, copper: 500, hits: 2,
      awaken: true,   // 洗脳された人：弱らせて心鎮め・名呼びで目を覚まさせられる（balance.js の AWAKEN）
      actions: [{ w: 6, type: 'attack' }, { w: 1, type: 'call', ids: CALL }],
      drop: { item: 'kizugusuri', rank: 'A' },
      palette: { K: '#06040a', H: '#4a3a2a', D: '#6a2a2a', E: '#ff6040', W: '#e0d0b0' }, sprite: H,
    },
    zantou_hohei: { name: '残党の歩兵', counter: '人', hp: 300, atk: 95, def: 100, agi: 60, wis: 40, exp: 700, copper: 150, awaken: true,
      actions: [{ w: 8, type: 'attack' }, { w: 1, type: 'call', ids: RANK_AND_FILE }],
      drop: { item: 'kizugusuri', rank: 'B' },
      palette: { K: '#06040a', H: '#5a4a3a', D: '#3a3a44', E: '#ff8060', W: '#d8d0c0' }, sprite: H },
    zantou_yumi: { name: '残党の弓兵', counter: '人', hp: 240, atk: 75, def: 65, agi: 100, wis: 50, exp: 650, copper: 140, awaken: true, hits: 2,
      actions: [{ w: 8, type: 'attack' }, { w: 1, type: 'call', ids: RANK_AND_FILE }],
      onHit: { status: 'poison', chance: 0.15 },   // 毒矢
      drop: { item: 'dokukeshi', rank: 'B' },
      palette: { K: '#06040a', H: '#4a5a3a', D: '#2a3a2a', E: '#ffa040', W: '#d0d8c0' }, sprite: H },
    zantou_jutsu: { name: '残党の術師', counter: '人', hp: 240, atk: 60, def: 60, agi: 90, wis: 170, exp: 750, copper: 160, awaken: true,
      actions: [{ w: 3, type: 'attack' }, { w: 2, type: 'kotodama', id: 'kangen' }, { w: 2, type: 'kotodama', id: 'surikomi' }, { w: 1, type: 'call', ids: RANK_AND_FILE }],
      drop: { item: 'mezamashi', rank: 'B' },
      palette: { K: '#06040a', H: '#3a2a5a', D: '#2a1a3a', E: '#c080ff', W: '#e0d8f0' }, sprite: H },
    zantou_kihei: { name: '残党の騎兵', counter: '人', hp: 340, atk: 115, def: 85, agi: 130, wis: 50, exp: 850, copper: 180, awaken: true,
      actions: [{ w: 8, type: 'attack' }, { w: 1, type: 'call', ids: RANK_AND_FILE }],
      drop: { item: 'kizugusuri', rank: 'A' },
      palette: { K: '#06040a', H: '#6a3a2a', D: '#4a2a1a', E: '#ffd040', W: '#e8d8c0' }, sprite: H },
    zantou_hata: { name: '残党の旗持ち', counter: '人', hp: 280, atk: 70, def: 85, agi: 70, wis: 80, exp: 800, copper: 200, awaken: true,
      actions: [{ w: 3, type: 'buff', stat: 'atk', mult: 1.3, turns: 3, text: '軍旗を高く掲げた！' }, { w: 3, type: 'attack' }, { w: 2, type: 'call', ids: RANK_AND_FILE }],
      drop: { item: 'kizugusuri', rank: 'A' },
      palette: { K: '#06040a', H: '#7a6a2a', D: '#5a2a2a', E: '#ff6040', W: '#f0e0b0' }, sprite: H },
    zantou_kusushi: { name: '残党の薬師', counter: '人', hp: 260, atk: 50, def: 65, agi: 80, wis: 140, exp: 800, copper: 220, awaken: true,
      actions: [{ w: 4, type: 'heal', rate: 0.3, text: '仲間の傷を手当てした。' }, { w: 2, type: 'attack' }, { w: 1, type: 'call', ids: RANK_AND_FILE }],
      drop: { item: 'kizugusuri', rank: 'S' },
      palette: { K: '#06040a', H: '#3a5a5a', D: '#2a3a3a', E: '#80ffc0', W: '#d8f0e8' }, sprite: H },
    orochi: {
      big: true,   // 大きく描く（js/scenes/battle.js）
      name: '黄泉の大蛇', hp: 3800, atk: 210, def: 180, agi: 90, wis: 150, exp: 8000, copper: 2000, hits: 2,   // 黄泉の深淵　上の淵の番人（Lv75で自動戦闘およそ6〜7割）
      drop: { item: 'dokukeshi', rank: 'A' },
      actions: [{ w: 3, type: 'attack' }, { w: 1, type: 'kotodama', id: 'doku_rinpun' }],
      onHit: { status: 'poison', chance: 0.2 },
      palette: { K: '#06060a', H: '#2a4a3a', D: '#14261e', E: '#ff3030', W: '#a0e0c0' },
      sprite: G.DATA.enemies.centipede.sprite,
    },
    nakui_ou: {
      big: true,   // 大きく描く（js/scenes/battle.js）
      name: '名喰いの王', hp: 4100, atk: 220, def: 188, agi: 130, wis: 230, exp: 15000, copper: 4000, hits: 2,   // 黄泉の深淵　底の番人（クリア後でいちばん強い番人。Lv85で自動戦闘およそ6割）
      drop: { item: 'mezamashi', rank: 'A' },
      actions: [{ w: 3, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }],
      resist: { sleep: 0, confuse: 0 },
      palette: { K: '#06060e', H: '#8a5ac8', D: '#4a2a8a', E: '#ffe040', W: '#f0d8ff' },
      sprite: G.DATA.enemies.onibi.sprite,
    },
    yomi_hebi: {
      name: '黄泉蛇', hp: 110, atk: 34, def: 30, agi: 10, wis: 20, exp: 80, copper: 34,
      drop: { item: 'dokukeshi', rank: 'A' },
      onHit: { status: 'venom', chance: 0.2 },
      palette: { K: '#0a0606', H: '#5a2a4a', D: '#2e1424', E: '#f0e040', W: '#e8c0d0' },
      sprite: G.DATA.enemies.centipede.sprite,
    },
    na_kui: {
      name: '名喰い', hp: 80, atk: 30, def: 24, agi: 20, wis: 40, exp: 75, copper: 32,
      drop: { item: 'mezamashi', rank: 'A' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }],
      resist: { sleep: 0, confuse: 0 },
      palette: { K: '#06060e', H: '#5a6ac8', D: '#2a3a8a', E: '#ffffff', W: '#c8d8ff' },
      sprite: G.DATA.enemies.onibi.sprite,
    },
  });
})();
