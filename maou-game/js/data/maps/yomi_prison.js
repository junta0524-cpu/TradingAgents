// このファイルの役目：マップ「黄泉津の宮　牢」のデータ。3章で、格子越しにタケルと話す場所。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};
  const RED = 'rgba(120,0,0,0.12)';   // 魔界は赤みがかった色（仕様書 第11章）

  G.DATA.maps.yomi_prison = {
    name: '黄泉津の宮　牢',
    outside: '#000',
    start: { x: 6, y: 6, dir: 'up' },
    tint: RED,
    rows: [
      'GGGGGGGGGGGGGG',
      'GffffGGffffGGG',
      'GffffGGffffGGG',
      'GbbbbGGbbbbGGG',
      'GffffffffffffG',
      'GffffffffffffG',
      'GffffffffffffG',
      'GGGGGGHHGGGGGG',
    ],
    warps: [
      { x: 6, y: 7, to: 'yomi_palace', tx: 1, ty: 6, dir: 'right' },
      { x: 7, y: 7, to: 'yomi_palace', tx: 1, ty: 6, dir: 'right' },
    ],
    npcs: [
      { id: 'takeru', look: 'takeru', x: 2, y: 2, dir: 'down', move: 'still', chapter: 3,
        event: 'ch3_visit', doneFlag: 'ch3_visit',
        talk: ['タケルは、何も言わなかった。ただ、目だけが、揺れていた。'] },
      { id: 'captive', look: 'soldier', x: 8, y: 2, dir: 'down', move: 'still', chapter: 3, talk: ['……。'] },
    ],
    chests: [],
    signs: [],
  };
})();
