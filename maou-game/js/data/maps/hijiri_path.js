// このファイルの役目：マップ「聖の森の道」のデータ。5章で歩く森の道（敵が出る）。北は森の集落、東の岩陰は洞窟。
// 入口近くでスクナが待っている。館で使者を見たあと、夜になると、ここで言伝を唱える。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hijiri_path = {
    name: '聖の森の道',
    outside: '#12301a',
    start: { x: 13, y: 20, dir: 'up' },
    battleBg: 'forest',
    tint: () => (G.flags.get('ch5_minato') && G.state.chapter === 5 ? 'rgba(10,20,60,0.45)' : null),
    encounter: {
      steps: [12, 22],
      groups: [['morigumo'], ['morigumo', 'morigumo'], ['onibi'], ['onibi', 'morigumo'], ['tsuta'], ['tsuta', 'onibi'], ['fox', 'morigumo']],
    },
    rows: [
      'TTTTTTTTTTTTTppTTTTTTTTTTTTTTT',
      'TTTTTTTTTTTTTppTTTTTTTTTTTTTTT',
      'TTT,,,,......pp.......,,,,TTTT',
      'TT,,TTT......pp......TTT,,,TTT',
      'TT,,TTT...F..pp......TTT,,,TTT',
      'TT.......,,,.pp..,,,.......RRT',
      'TTT......,,,.pppppppppppppppOT',
      'TTT..TT......pp..,,,.......RRT',
      'TT...TT......pp.........TTTTTT',
      'TT,,.....,,,.pp..TT.....,,,TTT',
      'TT,,.....,,,.pp..TT.....,,,TTT',
      'TTT..........pp.........TT.TTT',
      'TTTTT...TTT..pp..TTT.......TTT',
      'TTTTT...TTT..pp..TTT..,,,..TTT',
      'TT,,,........pp.......,,,..TTT',
      'TT,,,....F...pp............TTT',
      'TTT..........pp....TTT.....TTT',
      'TTTTTTT......pp....TTT...TTTTT',
      'TTTTTTT,,,...pp...,,,....TTTTT',
      'TTTTTTT,,,...pp...,,,..TTTTTTT',
      'TTTTTTTTTT...pp...TTTTTTTTTTTT',
      'TTTTTTTTTTTTTppTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 13, y: 0, to: 'hijiri_village', tx: 13, ty: 14, dir: 'up', requires: { if: 'ch5_sukuna' }, blockedText: '（道の先の木陰に、小さな影が座っていた）' },
      { x: 14, y: 0, to: 'hijiri_village', tx: 13, ty: 14, dir: 'up', requires: { if: 'ch5_sukuna' }, blockedText: '（道の先の木陰に、小さな影が座っていた）' },
      { x: 28, y: 6, to: 'hijiri_cave', tx: 8, ty: 6, dir: 'up', requires: { if: 'ch5_hall' }, blockedText: '苔むした岩の陰に、洞窟があった。入口には、結界の気配がある。' },
    ],
    triggers: [
      { x: 13, y: 16, event: 'ch5_sukuna', chapter: 5, unless: 'ch5_sukuna' },
      { x: 14, y: 16, event: 'ch5_sukuna', chapter: 5, unless: 'ch5_sukuna' },
    ],
    npcs: [
      { id: 'sukuna', look: 'sukuna', x: 12, y: 15, dir: 'right', move: 'still', chapter: 5, unless: 'ch5_sukuna', event: 'ch5_sukuna' },
    ],
    chests: [
      { id: 'grove', x: 3, y: 2, item: 'kizugusuri' },
      { id: 'moss', x: 25, y: 9, copper: 40 },
      { id: 'root', x: 7, y: 18, item: 'dokukeshi' },
    ],
    signs: [],
  };
})();
