// このファイルの役目：マップ「黄泉津の宮　聖域」のデータ。イザナギ縁の、水を張った小さな円い部屋（11章、ナキメと名呼びの入口）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yomi_sanctum = {
    name: '黄泉津の宮　聖域',
    outside: '#000',
    start: { x: 6, y: 8, dir: 'up' },
    tint: 'rgba(120,0,0,0.12)',
    rows: [
      'GGGGGGGGGGGGGG',
      'GffffffffffffG',
      'GffffffffffffG',
      'Gffff~~~~ffffG',
      'Gffff~~~~ffffG',
      'Gffff~~~~ffffG',
      'GffffffffffffG',
      'GffffffffffffG',
      'GffffffffffffG',
      'GGGGGGHHGGGGGG',
    ],
    warps: [
      { x: 6, y: 9, to: 'yomi_palace', tx: 1, ty: 6, dir: 'right' },
      { x: 7, y: 9, to: 'yomi_palace', tx: 1, ty: 6, dir: 'right' },
    ],
    npcs: [
      { id: 'naki13', look: 'nakime', x: 4, y: 6, dir: 'right', move: 'still', chapter: 13, event: 'post_naki' },
      { id: 'naki', look: 'nakime', x: 4, y: 6, dir: 'right', move: 'still', chapter: 11, event: 'ch11_naki', doneFlag: 'train_naki',
        talk: [{ name: 'ナキメ', text: '「焦らないことです。あなたが誰かを失いかけた時、本当の名呼びは、その時、生まれます」' }] },
    ],
    chests: [],
    signs: [],
  };
})();
