// このファイルの役目：マップ「院の地下　神殿」のデータ。五柱の紋が削られ、祭壇に中継の装置が据えられている（9章）。
// 入ると、祈りの場面（四柱を呼ぶ。五柱目は灰色で選べない）が流れる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yasuragi_temple = {
    name: '院の地下　神殿',
    outside: '#000',
    start: { x: 8, y: 10, dir: 'up' },
    rows: [
      'GGGGGGGGGGGGGGGGGG',
      'Gff7ff7ff7f7ff7ffG',
      'GffffffffffffffffG',
      'GfffffffQQfffffffG',
      'GffffffffffffffffG',
      'GffPffffffffffPffG',
      'GffffffffffffffffG',
      'GffffffffffffffffG',
      'GffPffffffffffPffG',
      'GffffffffffffffffG',
      'GffffffffffffffffG',
      'GGGGGGGGSSGGGGGGGG',
    ],
    warps: [],
    onEnter: [{ event: 'ch9_temple', chapter: 9, unless: 'ch9_temple' }],
    npcs: [],
    chests: [],
    signs: [],
  };
})();
