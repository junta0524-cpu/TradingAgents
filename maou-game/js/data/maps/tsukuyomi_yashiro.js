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
      'GffffffffffffffffffffG',
      'GffffffffffffffffffffG',
      'GffffffffffffffffffffG',
      'GGGGGGGGGGSSGGGGGGGGGG',
    ],
    flagTiles: [
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
    chests: [{ id: 'moon', x: 1, y: 13, item: 'hayate_obi' }],
    signs: [],
  };
})();
