// このファイルの役目：マップ「黄泉津の宮　露台」のデータ。3章で、ベルイザナが言伝でオモイカと話す場所。
// ここで言伝（ことだま）を唱えると場面が流れる（js/data/story/ch03.js の kotozute）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};
  const RED = 'rgba(120,0,0,0.12)';   // 魔界は赤みがかった色（仕様書 第11章）

  G.DATA.maps.yomi_balcony = {
    name: '黄泉津の宮　露台',
    outside: '#000',
    start: { x: 7, y: 5, dir: 'up' },
    tint: RED,
    rows: [
      'yyyyyyyyyyyyyyyy',
      'yyyyyyyyyyyyyyyy',
      'nnnnnnnnnnnnnnnn',
      'GffffffffffffffG',
      'GffffffffffffffG',
      'GffffffffffffffG',
      'GGGGGGGHHGGGGGGG',
    ],
    warps: [
      { x: 7, y: 6, to: 'yomi_palace', tx: 18, ty: 6, dir: 'left' },
      { x: 8, y: 6, to: 'yomi_palace', tx: 18, ty: 6, dir: 'left' },
    ],
    onEnter: [
      { event: 'ch3_balcony_hint', chapter: 3, if: 'ch3_report', unless: 'ch3_done' },
    ],
    npcs: [],
    chests: [],
    signs: [],
  };
})();
