// このファイルの役目：敵の一覧（名前・強さ・倒したときにもらえるもの・絵の型紙）。
// 新しい敵は、ここに1つ足すだけで増やせる。どこで出るかは各マップの encounter に書く。
// drop：{ item: 道具の名前, rank: 'S'〜'C' }（確率は balance.js の DROP_RATE）
// 絵の型紙の文字：K=輪郭 H=体 D=濃い所 E=目 W=白（牙など） .=透明。3倍に拡大して表示する。
// resist：効きにくさの倍率（0＝効かない／0.5／1.0／1.5）。属性（fire など）と状態異常（sleep など）に使う。
// actions：行動の重み（{ w: 重み, type: 'attack' } / { w, type: 'kotodama', id }）。書かなければ打撃だけ。
// onHit：打撃が当たったとき、状態異常にする（{ status, chance }）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.enemies = {
    // 毒の鱗粉をまく蛾（仮の敵）
    moth: {
      name: '毒蛾', hp: 10, atk: 8, def: 4, agi: 9, exp: 5, copper: 3,
      drop: { item: 'dokukeshi', rank: 'B' },
      actions: [{ w: 3, type: 'attack' }, { w: 1, type: 'kotodama', id: 'doku_rinpun' }],
      onHit: { status: 'poison', chance: 0.25 },
      resist: { fire: 1.5 },
      palette: { K: '#140e14', H: '#8a6aa8', D: '#5a3a7a', E: '#f0e040', W: '#d8c8f0' },
      sprite: [
        '................',
        '................',
        '..KK........KK..',
        '.KHHK......KHHK.',
        'KHWHHK....KHHWHK',
        'KHHDHHK..KHHDHHK',
        'KHHHHHHKKHHHHHHK',
        '.KHHDHHKEKHHDHK.',
        '..KHHHKEEKHHHK..',
        '...KHHKDDKHHK...',
        '..KHHDKDDKDHHK..',
        '.KHHHK.KK.KHHHK.',
        '.KHHK......KHHK.',
        '..KK........KK..',
        '................',
        '................',
      ],
    },
    // 人を惑わす狐火の主（仮の敵）
    fox: {
      name: 'まどい狐', hp: 14, atk: 10, def: 5, agi: 11, exp: 7, copper: 5,
      drop: { item: 'mezamashi', rank: 'C' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }, { w: 1, type: 'kotodama', id: 'surikomi' }],
      resist: { sleep: 0.5, confuse: 0 },
      palette: { K: '#1a1008', H: '#e0a050', D: '#a86a2a', E: '#40c0f0', W: '#f8f0e0' },
      sprite: [
        '................',
        '..K..K..........',
        '.KHKKHK.........',
        '.KHHHHK.........',
        'KHEHHEHK........',
        'KHHWWHHK...KKK..',
        '.KHHHHKKKKKHWHK.',
        '..KHHHHHHHHHHWK.',
        '..KHHHHHHHHHHHK.',
        '..KHHDHHHHDHHK..',
        '..KHHKKKKKKHHK..',
        '..KHK.....KHK...',
        '..KDK.....KDK...',
        '..KK......KK....',
        '................',
        '................',
      ],
    },
    // 小説 第四章：ミナモからひなた野への荒れ地に出る
    dog: {
      name: '野犬', hp: 9, atk: 9, def: 3, agi: 7, exp: 3, copper: 2,
      drop: { item: 'kizugusuri', rank: 'C' },
      palette: { K: '#1a1410', H: '#8a7a62', D: '#5e5240', E: '#e8c040', W: '#f0f0e8' },
      sprite: [
        '................',
        '................',
        '..K.............',
        '.KHK............',
        '.KHHKK..........',
        'KHEHHHK.........',
        'KHHHHHHKKKKKKK..',
        'KWKHHHHHHHHHHHK.',
        '.KKHHHHHHHHHHHKK',
        '...KHHDHHHHDHHK.',
        '...KHHKKKKKHHK..',
        '...KHK....KHK...',
        '...KHK....KHK...',
        '...KDK....KDK...',
        '...KK.....KK....',
        '................',
      ],
    },
    // 仮の敵（名前・強さはあとで変えてよい）
    boar: {
      name: '荒れ猪', hp: 16, atk: 12, def: 6, agi: 3, exp: 6, copper: 4,
      drop: { item: 'hoshiii', rank: 'B' },
      palette: { K: '#1a1210', H: '#6e4a32', D: '#3e2a1c', E: '#e04030', W: '#f0e8d8' },
      sprite: [
        '................',
        '................',
        '................',
        '......KKKKKKK...',
        '....KKDDDDDDDKK.',
        '..KKHHHHDHHDHHHK',
        '.KHEHHHHHHHHHHHK',
        'KWHHHHHHHHHHHHHK',
        'KHHHHHHHHHHHHHK.',
        '.KKHHHHHHHHHHHK.',
        '..KDHKKKKKKKHDK.',
        '..KDK......KDK..',
        '..KK.......KK...',
        '................',
        '................',
        '................',
      ],
    },
    centipede: {
      name: '大ムカデ', hp: 12, atk: 10, def: 8, agi: 5, exp: 5, copper: 3,
      drop: { item: 'kizugusuri', rank: 'B' },
      palette: { K: '#140a08', H: '#a8402a', D: '#6a2418', E: '#f0e040', W: '#e8d8a0' },
      sprite: [
        '................',
        '................',
        '................',
        '.K...K..........',
        '..K.K...........',
        '..KKKK..KKKK....',
        '.KHEEHKKHHHHK...',
        '.KHHHHKHHDHHHKKK',
        '..KHHKHHKKKHHDHK',
        '..KWKKHHK.KHHHHK',
        '...K.KDDK.KKDHK.',
        '.....K..K..KKK.K',
        '....K..K..K..K..',
        '................',
        '................',
        '................',
      ],
    },
  };
})();
