// このファイルの役目：人の形の敵の一覧。2章の根の洲の兵と勇者タケル、第三部（8〜12章）の王都の追手、魔界での手合わせの相手、タケル、アマツ王と護衛。
// 書き方は js/data/enemies.js と同じ。人の敵は counter: '人'。手合わせの相手は、倒すのではなく耐えきれば勝ち（場面のほうで決める）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  // 人の形の型紙（16×16）。色だけ変えて使い回す
  const HUMAN = [
    '................',
    '......KKKK......',
    '.....KHHHHK.....',
    '.....KHHHHK.....',
    '.....KSEESK.....',
    '......KSSK......',
    '....KKDDDDKK....',
    '...KDDWWDDDDK.K.',
    '...KDDDDDDDDKKWK',
    '...KSKDDDDKSK.K.',
    '...KK.KDDK.KK.K.',
    '......KDDK....K.',
    '.....KD..DK.....',
    '.....KH..HK.....',
    '.....KK..KK.....',
    '................',
  ];
  // 型紙の S（肌）は、敵の絵では E（目）・W（白）と同じく色を持てないので、H に置き換えた版を作る
  const human = sprite => sprite.map(r => r.replace(/S/g, 'H'));

  Object.assign(G.DATA.enemies, {
    // 2章：根の洲に攻め込んだ人間の軍（ベルイザナの一撃で「消える」。経験値・銅貨はない）
    ch2_yari: {
      name: '槍兵', counter: '人', hp: 60, atk: 40, def: 30, agi: 20, wis: 15, exp: 0, copper: 0,
      awaken: true,   // 洗脳された人：弱らせて心鎮め・名呼びで目を覚まさせられる（balance.js の AWAKEN）
      palette: { K: '#120e16', H: '#5a5e68', D: '#8a8e98', E: '#2a2a2a', W: '#d8d8e0' },
      sprite: human(HUMAN),
    },
    ch2_yumi: {
      name: '弓兵', counter: '人', hp: 45, atk: 36, def: 20, agi: 30, wis: 15, exp: 0, copper: 0,
      awaken: true,   // 洗脳された人：弱らせて心鎮め・名呼びで目を覚まさせられる（balance.js の AWAKEN）
      palette: { K: '#120e16', H: '#6a5a3a', D: '#7a6a4a', E: '#2a2a2a', W: '#d8d0b0' },
      sprite: human(HUMAN),
    },
    // 2章：勇者タケル（人間界最強。1ターンに2回斬る。倒れず、膝をつくところで戦いが終わる＝spare）
    takeru_ch2: {
      name: 'タケル', counter: '人', big: true, artScale: 6, hp: 600, atk: 230, def: 200, agi: 240, wis: 120, exp: 0, copper: 0, hits: 2, spare: true,
      palette: { K: '#120e16', H: '#6a4a2a', D: '#c8ccd8', E: '#3a5a8a', W: '#ffffff' },
      sprite: human(HUMAN),
    },
    // 10章：王都の追手
    otte: {
      name: '追手の兵', counter: '人', hp: 36, atk: 24, def: 14, agi: 10, wis: 15, exp: 30, copper: 0,
      awaken: true,   // 洗脳された人：弱らせて心鎮め・名呼びで目を覚まさせられる（balance.js の AWAKEN）
      palette: { K: '#120e16', H: '#d8b088', D: '#8a8e98', E: '#2a2a2a', W: '#f0f0f0' },
      sprite: human(HUMAN),
    },
    // 11章：手合わせの相手（耐えきれば勝ち）
    mikazuchi_t: {
      tribe: 'oni', name: 'ミカヅチ', counter: '人', hp: 999, atk: 26, def: 40, agi: 8, wis: 14, exp: 40, copper: 0, big: true, artScale: 6, battleBg: 'oni_arena',
      palette: { K: '#120e16', H: '#c8705a', D: '#6a2a2a', E: '#e8c040', W: '#f0e0c0' },
      sprite: human(HUMAN),
    },
    susano_t: {
      tribe: 'arashi', name: 'スサノ', counter: '人', hp: 120, atk: 24, def: 18, agi: 22, wis: 22, exp: 50, copper: 0, big: true, artScale: 6, battleBg: 'storm_crag',
      palette: { K: '#120e16', H: '#8a8a9a', D: '#4a4a5a', E: '#d0c040', W: '#f0f0f0' },
      sprite: human(HUMAN),
    },
    // 11章：タケル（規定のターンを過ぎ、体力が半分以下になれば勝ち。削り切ってもよい）
    takeru_b: {
      name: 'タケル', counter: '人', big: true, artScale: 6, hp: 160, atk: 34, def: 22, agi: 16, wis: 22, exp: 150, copper: 0,
      palette: { K: '#120e16', H: '#6a4a2a', D: '#c8ccd8', E: '#3a5a8a', W: '#ffffff' },
      sprite: human(HUMAN),
    },
    // 12章：アマツ王（武力は低い。詠唱が満ちる直前に核心へ踏み込むと決着）と護衛
    amatsu_king: {
      name: 'アマツ王', counter: '人', artMul: 1.5, hp: 200, atk: 6, def: 99, agi: 4, wis: 60, exp: 200, copper: 0,
      actions: [{ w: 2, type: 'kotodama', id: 'kangen' }, { w: 1, type: 'attack' }],
      resist: { sleep: 0, confuse: 0, silence: 0 },
      palette: { K: '#120e16', H: '#e8e0c0', D: '#f4f4f4', E: '#4a4a4a', W: '#c8c0a0' },
      sprite: human(HUMAN),
    },
    goei: {
      name: '王の護衛', counter: '人', hp: 60, atk: 24, def: 18, agi: 9, wis: 15, exp: 40, copper: 0,
      awaken: true,   // 洗脳された人：弱らせて心鎮め・名呼びで目を覚まさせられる（balance.js の AWAKEN）
      palette: { K: '#120e16', H: '#d8b088', D: '#d8d8e0', E: '#2a2a2a', W: '#c8a040' },
      sprite: human(HUMAN),
    },
  });
})();
