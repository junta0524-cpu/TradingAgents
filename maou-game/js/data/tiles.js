// このファイルの役目：マップに使う「マス目の種類」の一覧。
// マップは文字の並びで書く。ここでは「どの文字がどのマスか」「通れるか」「調べたときの文」を決める。
// look は絵の種類（絵は js/core/tileset.js が描く）。
// noEncounter：このマスでは敵に出会わない（道など）。tallGrass：出会いやすい。heal：調べると体力が戻る。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.tiles = {
    // ---- 外 ----
    '.': { name: '草地',   look: 'grass' },
    ',': { name: '草むら', look: 'tallgrass', tallGrass: true },
    'F': { name: '花',     look: 'flowers' },
    'T': { name: '木',     look: 'tree',     solid: true },
    'm': { name: '山',     look: 'mountain', solid: true },
    '~': { name: '水',     look: 'water',    solid: true },
    '=': { name: '桟橋',   look: 'planks', noEncounter: true },
    ':': { name: '石畳',   look: 'stone', noEncounter: true },
    '-': { name: '土の道', look: 'dirt', noEncounter: true },
    'M': { name: '町',     look: 'town', noEncounter: true },
    // ---- 建物 ----
    '^': { name: '屋根',   look: 'roof',   solid: true },
    '#': { name: '白壁',   look: 'wall',   solid: true },
    'W': { name: '窓',     look: 'window', solid: true },
    'D': { name: '入口',   look: 'door' },
    'd': { name: '戸',     look: 'door',   solid: true, check: '戸は閉まっている。' },
    'o': { name: '樽',     look: 'barrel', solid: true, check: '樽の中には、塩漬けの魚が詰まっている。' },
    'w': { name: '井戸',   look: 'well',   solid: true, heal: true,
           check: '冷たい水を飲んだ。体の疲れが抜けていく。\n（仮：宿屋ができるまでの回復場所）' },
    // ---- 屋内 ----
    '_': { name: '床',     look: 'floor' },
    'I': { name: '内壁',   look: 'innerwall', solid: true },
    'C': { name: '台',     look: 'counter',   solid: true, counter: true },
    'k': { name: '机',     look: 'table',     solid: true },
    'E': { name: '出口',   look: 'mat' },
    ' ': { name: '闇',     look: 'void',      solid: true },
  };
})();
