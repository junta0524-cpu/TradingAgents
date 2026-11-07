// このファイルの役目：マップ「聖の森の集落」のデータ。木々の間に家が溶け込む、エルフの集落。
// 北の大樹の洞が女王クシナダの館。集落の端の小さな家にコノハが住む。宿屋と道具屋もある。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hijiri_village = {
    name: '聖の森の集落',
    outside: '#12301a',
    start: { x: 13, y: 14, dir: 'up' },
    detection: 1,
    rows: [
      'TTTTTTTTTTTTUUUUUTTTTTTTTTTT',
      'TTTTTTTTTTTTUUUUUTTTTTTTTTTT',
      'TTTTTTTTTTTTUUJUUTTTTTTTTTTT',
      'TT..UUU.......p.......UUU..T',
      'TT..UJU.......p.......UJU..T',
      'TT............p............T',
      'TTT...F.......p.......F..TTT',
      'TT....pppppppppppppppp.....T',
      'TT....p......p.......p.....T',
      'TT..UUU......p......UUU....T',
      'TT..UJU......p......UJU..UUT',
      'TT...........p...UUU.....UJT',
      'TTT..........p...UJU.......T',
      'TTTT.........p..........TTTT',
      'TTTTTT.......p.......TTTTTTT',
      'TTTTTTTTTTTTTpTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 18, y: 12, to: 'hijiri_bugu', tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋を分けた店（js/data/maps/rooms_shops2.js）
      // 建物の中（js/data/maps/rooms_hijiri.js）
      { x: 5, y: 4, to: 'hijiri_inn', tx: 5, ty: 7, dir: 'up' },
      { x: 23, y: 4, to: 'hijiri_shop', tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 10, to: 'hijiri_r1', tx: 5, ty: 7, dir: 'up' },
      { x: 21, y: 10, to: 'hijiri_r2', tx: 5, ty: 7, dir: 'up' },
      { x: 26, y: 11, to: 'hijiri_r3', tx: 5, ty: 7, dir: 'up' },
      { x: 13, y: 15, to: 'hijiri_path', tx: 13, ty: 1, dir: 'down' },
      { x: 14, y: 2, to: 'hijiri_hall', tx: 8, ty: 8, dir: 'up', requires: { if: 'ch5_konoha' }, blockedText: '大樹の洞を、そのまま広間にした館だ。いまは、入れない。' },
    ],
    onEnter: [{ event: 'ch5_village', chapter: 5, if: 'ch5_sukuna', unless: 'ch5_village' }],
    npcs: [
      { id: 'konoha', look: 'konoha', x: 25, y: 12, dir: 'up', move: 'still', chapter: 5, unless: 'ch5_konoha', event: 'ch5_konoha' },
      { id: 'elf_a', look: 'elf', x: 9, y: 8, dir: 'down', move: 'wander',
        talk: ['ただ、視線だけを寄越す。冷たくもなく、温かくもない。そこに、何も乗っていない目だった。'] },
      { id: 'elf_b', look: 'elf2', x: 18, y: 9, dir: 'left', move: 'wander',
        talk: ['エルフたちは、行き交う二人の人間を見ても、足を止めなかった。'] },
    ],
    chests: [{ id: 'nook', x: 26, y: 3, item: 'mezamashi' }],
    signs: [],
  };
})();
