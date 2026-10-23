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
    // ---- 拠点の部屋の家具 ----
    '[': { name: '寝床',   look: 'bed',    solid: true, check: '使い込まれた寝床だ。' },
    ']': { name: '棚',     look: 'shelf',  solid: true, check: '器や布が、きちんと並べてある。' },
    '{': { name: '竈',     look: 'hearth', solid: true, check: '竈に、小さな火が残っている。' },
    '}': { name: '水甕',   look: 'jar',    solid: true, check: '水甕に、汲みたての水が張ってある。' },
    '|': { name: '書棚',   look: 'books',  solid: true, check: '古い帳面や巻物が、ぎっしりと詰まっている。' },
    '+': { name: '土間',   look: 'earth' },
    '*': { name: '茣蓙',   look: 'rug' },
    // ---- 村（第二部）----
    'Y': { name: '藁葺き屋根', look: 'thatch', solid: true },
    'v': { name: '畑',       look: 'crops',  solid: true, check: '細い野菜が植わっている。' },
    'V': { name: '石垣',     look: 'stonewall', solid: true },
    // ---- 森（5章）----
    'p': { name: '苔の道',   look: 'moss', noEncounter: true },
    'U': { name: '大樹の幹', look: 'trunk', solid: true },
    'J': { name: '幹の戸口', look: 'trunkdoor' },
    'O': { name: '洞窟の入口', look: 'cavemouth' },
    'R': { name: '岩',       look: 'rock', solid: true },
    'z': { name: '洞窟の床', look: 'cavefloor' },
    'l': { name: '藁',       look: 'straw', solid: true, check: '藁が敷かれている。' },
    // ---- 山の里（6章）----
    'X': { name: '石の工房', look: 'stonehouse', solid: true },
    'Z': { name: '炉',       look: 'furnace', solid: true, check: '炉の火が、赤く燃えている。' },
    // ---- 荒野（7章）----
    'e': { name: '乾いた土', look: 'dryland' },
    'i': { name: '灌木',     look: 'shrub', solid: true },
    'x': { name: '杭',       look: 'stake', solid: true, check: '細い木の杭に、赤い布が巻かれている。' },
    'A': { name: '焼け跡',   look: 'ruin', solid: true, check: '屋根が落ち、壁が煤けている。' },
    // ---- 王都と院（8〜9章）----
    '1': { name: '白い家並み', look: 'whitewall', solid: true },
    '2': { name: '白い屋根', look: 'whiteroof', solid: true },
    '3': { name: '白い石畳', look: 'whitestone', noEncounter: true },
    '4': { name: '英雄の像', look: 'statue', solid: true },
    '5': { name: '鐘楼',     look: 'belltower', solid: true, check: '鐘楼だ。夜警の鐘が、ここで鳴る。' },
    '7': { name: '紋の窪み', look: 'crest', solid: true, check: 'かつて、神の印が刻まれていたはずの窪みだ。今は、削り取られ、粗い漆喰で、塗り潰されている。' },
    'S': { name: '階段',     look: 'stairs' },
    // ---- クリア後 ----
    '0': { name: '試練の扉', look: 'trialdoor', solid: true },
    '8': { name: '祭壇',     look: 'altar', solid: true },
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

    // ---- ダンジョンのしかけ（js/systems/gimmick.js）----
    // hole：岩を押し込むと埋まる穴（fillCh／マップの fillCh の床になる）。fall：踏むと下の階へ落ちる（マップの fallTo）
    // slide：止まるまで滑る。flow：その向きへ流される。hurt：1歩ごとに体力が減る
    '穴': { name: '穴',       look: 'hole',      solid: true, hole: true, check: '深い穴だ。何かで埋められそうだ。' },
    '落': { name: 'ひびの床', look: 'crackfloor', fall: true },
    '滑': { name: 'ぬめる苔', look: 'slick',     slide: true, noEncounter: true },
    '氷': { name: '凍った床', look: 'ice',       slide: true, noEncounter: true },
    '↑': { name: '流れ', look: 'flowup',    flow: 'up',    noEncounter: true },
    '↓': { name: '流れ', look: 'flowdown',  flow: 'down',  noEncounter: true },
    '←': { name: '流れ', look: 'flowleft',  flow: 'left',  noEncounter: true },
    '→': { name: '流れ', look: 'flowright', flow: 'right', noEncounter: true },
    '熱': { name: '焼けた岩', look: 'hotrock',  hurt: true },
    '門': { name: '鉄の門',   look: 'gatebars', solid: true, check: '鉄の門だ。どこかで開ける仕掛けがありそうだ。' },
    '蔦': { name: '絡み合った蔦', look: 'vines', solid: true },
    '崩': { name: '崩れた足場',   look: 'gap',   solid: true },
    '橋': { name: '固めた足場',   look: 'bridge', noEncounter: true },
    '霊': { name: '荒ぶる火の玉', look: 'wisp',  solid: true },
    '偽': { name: '岩壁',         look: 'rock',  solid: true },
    '幻': { name: '黒い岩壁',     look: 'yomirock', solid: true },
    '巌': { name: '大岩',         look: 'rock',  solid: true },
    '扉': { name: '鍵の扉',       look: 'lockdoor', solid: true },
    '台': { name: '光る石台',     look: 'pad',   noEncounter: true },
    '坑': { name: '坑道の床',     look: 'minefloor' },
    '杭': { name: '坑道の柱',     look: 'minewall', solid: true },
    '黒': { name: '黒い岩肌',     look: 'yomirock', solid: true },
    '闇': { name: '大穴の床',     look: 'pitfloor' },

    // ---- フィールドマップ（人間界・魔界の全体の地図。1マスが一つの土地）----
    '6': { name: '森',       look: 'woods' },
    '9': { name: '城',       look: 'castle',   noEncounter: true },
    'j': { name: '村',       look: 'village',  noEncounter: true },
    'q': { name: '大穴',     look: 'pit',      noEncounter: true },   // 出入口の requires で、クリア後だけ渡れる
    'B': { name: '土地の印', look: 'marker',   noEncounter: true },
    'N': { name: '荒れ地',   look: 'waste',    tallGrass: true },
    '!': { name: '焼け野',   look: 'embers' },
    '$': { name: '魔界の野', look: 'yomiland' },
    // 広い地図の寄り道：草に埋もれた祠（人間界）・焼け残った廟（魔界）。調べると体力・MPが戻る（マップの spots の heal）
    '祠': { name: '祠', look: 'shrine', solid: true },
    '廟': { name: '廟', look: 'shrine_y', solid: true },
    '%': { name: '赤土の野', look: 'redland' },
    '&': { name: '高原',     look: 'steppe' },
    '(': { name: '断崖',     look: 'crag',     solid: true },
    ')': { name: '谷',       look: 'valley' },
    '<': { name: '城',       look: 'yomicastle',  noEncounter: true },   // 魔界の城（地面が魔界の色）
    '>': { name: '村',       look: 'yomivillage', noEncounter: true },
    '@': { name: '町',       look: 'yomitown',    noEncounter: true },
  };
})();
