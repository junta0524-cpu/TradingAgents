// このファイルの役目：マップ「黄泉津の宮　王の広間」のデータ。
// 1章：広間の奥へ進むと四天王との場面。3章：西の扉は牢へ、東の扉は露台へ（物語が進むと開く）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};
  const RED = 'rgba(120,0,0,0.12)';   // 魔界は赤みがかった色（仕様書 第11章）

  const KING = { move: 'still', chapter: 1, unless: 'ch1_palace', event: 'ch1_palace' };
  G.DATA.maps.yomi_palace = {
    name: '黄泉津の宮　王の広間',
    outside: '#000',
    start: { x: 9, y: 11, dir: 'up' },
    tint: RED,
    rows: [
      'GGGGGGGGGGGGGGGGGGGG',
      'GPfffffffQQfffffffPG',
      'GfffffffccccfffffffG',
      'GfffffffccccfffffffG',
      'GPfffffffccfffffffPG',
      'GffffffffccffffffffG',
      'HffffffffccffffffffH',
      'GPfffffffccfffffffPG',
      'GffffffffccffffffffG',
      'GffffffffccffffffffG',
      'GPfffffffccfffffffPG',
      'GffffffffccffffffffG',
      'GGGGGGGGGHHGGGGGGGGG',
    ],
    warps: [
      { x: 9,  y: 12, to: 'yomi_market', tx: 11, ty: 1, dir: 'down' },
      { x: 10, y: 12, to: 'yomi_market', tx: 12, ty: 1, dir: 'down' },
      { x: 0,  y: 6,  to: 'yomi_prison', tx: 6, ty: 6, dir: 'up', when: { chapter: 3 } },
      { x: 0,  y: 6,  to: 'yomi_sanctum', tx: 6, ty: 8, dir: 'up', when: { chapter: 11 } },
      { x: 0,  y: 6,  to: 'yomi_palace', tx: 1, ty: 6, dir: 'right', requires: { if: 'never' }, blockedText: '奥へ続く扉だ。' },
      { x: 19, y: 6,  to: 'yomi_balcony', tx: 7, ty: 5, dir: 'up', requires: { chapter: 3, if: 'ch3_report' }, blockedText: '露台へ続く扉だ。' },
    ],
    // 広間の奥へ進むと、四天王との場面（1章）
    triggers: [
      { x: 1, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 2, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 3, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 4, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 5, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 6, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 7, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 8, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 9, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 10, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 11, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 12, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 13, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 14, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 15, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 16, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 17, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' },
      { x: 18, y: 8, event: 'ch1_palace', chapter: 1, unless: 'ch1_palace' }
    ],
    npcs: [
      { id: 'omoika11', look: 'omoika', x: 9, y: 3, dir: 'down', move: 'still', chapter: 11,
        talk: [{ name: 'オモイカ', text: '「ようこそ、おいでくださいました」' }] },
      Object.assign({ id: 'mikazuchi', look: 'mikazuchi', x: 7,  y: 4, dir: 'right' }, KING),
      Object.assign({ id: 'nakime',    look: 'nakime',    x: 12, y: 4, dir: 'left' }, KING),
      Object.assign({ id: 'susano',    look: 'susano',    x: 7,  y: 6, dir: 'right' }, KING),
      Object.assign({ id: 'haniyasu',  look: 'haniyasu',  x: 12, y: 6, dir: 'left' }, KING),
    ],
    chests: [],
    signs: [],
  };
})();
