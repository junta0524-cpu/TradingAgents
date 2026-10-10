// このファイルの役目：マップに使う「マス目の種類」の一覧。
// マップは文字の並びで書く。ここでは「どの文字がどのマスか」「通れるか」「調べたときの文」を決める。
// look は絵の種類（絵は js/core/tileset.js が描く）。
// noEncounter：このマスでは敵に出会わない（道など）。tallGrass：出会いやすい。
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
    'w': { name: '井戸',   look: 'well',   solid: true, check: '冷たい水が、底のほうで光っている。' },
    // ---- 屋内 ----
    '_': { name: '床',     look: 'floor' },
    'I': { name: '内壁',   look: 'innerwall', solid: true },
    'C': { name: '台',     look: 'counter',   solid: true, counter: true },
    'k': { name: '机',     look: 'table',     solid: true },
    'E': { name: '出口',   look: 'mat' },
    ' ': { name: '闇',     look: 'void',      solid: true },
    // ---- 魔界（黄泉）----
    'g': { name: '黄泉の草地', look: 'yomigrass' },
    't': { name: '黒い木',   look: 'deadtree', solid: true },
    'u': { name: '赤土の道', look: 'reddirt', noEncounter: true },
    'r': { name: '田',       look: 'rice',     solid: true, check: '実り始めた稲穂が、風のたびに低い波をつくっていた。' },
    'h': { name: '畦',       look: 'ridge', noEncounter: true },
    's': { name: '芽',       look: 'sprout',   solid: true, check: '畦の際に、小さな芽が一本だけ顔を出している。' },
    'L': { name: '収穫祭の卓', look: 'feast',  solid: true, check: '収穫祭の長い卓だ。' },
    'K': { name: '酒樽',     look: 'sakebarrel', solid: true, check: '鬼族の祭り酒の樽だ。' },
    'a': { name: '屋台の屋根', look: 'awning', solid: true },
    'G': { name: '黒石の壁', look: 'darkwall', solid: true },
    'H': { name: '門',       look: 'gate' },
    'f': { name: '黒石の床', look: 'darkstone' },
    'c': { name: '赤い敷物', look: 'carpet' },
    'P': { name: '柱',       look: 'pillar',   solid: true },
    'Q': { name: '王の座',   look: 'throne',   solid: true, check: '王の座だ。' },
    'b': { name: '格子',     look: 'bars',     solid: true, counter: true },
    'n': { name: '手すり',   look: 'railing',  solid: true, check: '遠く、比良坂の方角に、細い光の筋が立っている。' },
    'y': { name: '夜空',     look: 'redsky',   solid: true },
  };
})();
