// このファイルの役目：敵の一覧（名前・強さ・倒したときにもらえるもの・絵の型紙）。
// 新しい敵は、ここに1つ足すだけで増やせる。どこで出るかは各マップの encounter に書く。
// drop：{ item: 道具の名前, rank: 'S'〜'C' }（確率は balance.js の DROP_RATE）
// 絵の型紙の文字：K=輪郭 H=体 D=濃い所 E=目 W=白（牙など） .=透明。3倍に拡大して表示する。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.enemies = {
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
