// このファイルの役目：マップ「ツクヨミの社」のデータ（クリア後）。ツクヨミ系（知）の言霊を、探して覚える場所。
// 三つの祭壇で言霊を一つずつ授かる。奥の祭壇の前の壁は、「見破り」を覚えていれば見抜ける。嵐ヶ峰の北から入る。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.tsukuyomi_yashiro = {
    name: 'ツクヨミの社',
    outside: '#000',
    start: { x: 10, y: 14, dir: 'up' },
    battleBg: 'night',
    tint: 'rgba(20,20,80,0.3)',
    encounter: { steps: [12, 20], groups: [['na_kui'], ['na_kui', 'na_kui'], ['kage_oni']] },
    dark: true,   // 暗い社。柱の燭台が灯っている
    rows: [
      'GGGGGGGGGGGGGGGGGGGGGG',
      'GffffffffffffffffffffG',
      'GffffffffffffffffffffG',
      'Gff8ffffffffffffff8ffG',
      'GffffffGGGffGGGffffffG',
      'GffffffGffffffGffffffG',
      'GffffffGff8fffGffffffG',
      'GfffPffGffffffGffPfffG',
      'GffffffGffffffGffffffG',
      'GffffffffffffffffffffG',
      'GffffffffffffffffffffG',
      'GfffPffffffffffffPfffG',
      'GGfffffffffffffffffffG',
      'Gf門ffffffffffffffffffG',
      'GGfffffffffffffffffffG',
      'GGGGGGGGGGSSGGGGGGGGGG',
    ],
    flagTiles: [
      {'x': 2, 'y': 13, 'ch': 'f', 'if': 'tsuku_moon'},
      { x: 10, y: 4, ch: 'G', unless: 'shrine_open' },
      { x: 11, y: 4, ch: 'G', unless: 'shrine_open' },
    ],
    warps: [
      { x: 10, y: 15, to: 'arashigamine', tx: 8, ty: 1, dir: 'down' },
      { x: 11, y: 15, to: 'arashigamine', tx: 9, ty: 1, dir: 'down' },
    ],
    spots: [
      { x: 3, y: 3, event: 'post_altar1', unless: 'altar1' },
      { x: 18, y: 3, event: 'post_altar2', unless: 'altar2' },
      { x: 10, y: 6, event: 'post_altar3', unless: 'altar3' },
      { x: 10, y: 4, event: 'post_shrine_open', knows: 'miyaburi', unless: 'shrine_open' },
      { x: 11, y: 4, event: 'post_shrine_open', knows: 'miyaburi', unless: 'shrine_open' },
      { x: 10, y: 4, text: '古い壁だ。何かが、偽りの形をしている気がする。', unless: 'shrine_open' },
      { x: 11, y: 4, text: '古い壁だ。何かが、偽りの形をしている気がする。', unless: 'shrine_open' },
    ],
    npcs: [],
    // しかけ（js/systems/gimmick.js）：柱の燭台（はじめから灯っている）、隅の燭台（火種）、灯籠の謎（西→真ん中→東）
    gimmicks: [
      {'type': 'torch', 'id': 'p1', 'x': 4, 'y': 7, 'lit': true},
      {'type': 'torch', 'id': 'p2', 'x': 17, 'y': 7, 'lit': true},
      {'type': 'torch', 'id': 'p3', 'x': 4, 'y': 11, 'lit': true},
      {'type': 'torch', 'id': 'p4', 'x': 17, 'y': 11, 'lit': true},
      {'type': 'torch', 'id': 'c1', 'x': 1, 'y': 1},
      {'type': 'torch', 'id': 'c2', 'x': 20, 'y': 1},
      {'type': 'sequence', 'id': 'tsuki', 'flag': 'tsuku_moon', 'done': '三つの灯籠に、月の光が宿った。南西の門が、静かに開いた。', 'wrong': '灯りが、ふっと消えた。月の満ち欠けと、順がちがうらしい。'},
      {'type': 'lantern', 'seq': 'tsuki', 'order': 0, 'x': 2, 'y': 9},
      {'type': 'lantern', 'seq': 'tsuki', 'order': 1, 'x': 12, 'y': 12},
      {'type': 'lantern', 'seq': 'tsuki', 'order': 2, 'x': 19, 'y': 9},
    ],
    chests: [{ id: 'moon', x: 1, y: 13, item: 'kogane_inaho' }],
    signs: [
      {'x': 6, 'y': 14, 'text': '古い石碑がある。\n「細い月は西の空に。満ちた月は天の真ん中に。欠けゆく月は東に」'},
    ],
  };
})();
