// このファイルの役目：拠点「ヤタの断崖」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 鴉族の住む断崖。岩壁に巣穴のような住まいが並ぶ。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yata = {
    name: "ヤタの断崖",
    outside: "#1a1420",
    start: { x: 10, y: 13, dir: "up" },
    detection: 1,
    rows: [
      "((((((((((((((((((((((",
      "((((((((((((((((((((((",
      "((((((((((((((((((((((",
      "(((()GGG))uu))GGG)((((",
      "(((()GDG))uu))GDG)((((",
      "(((())))))uu))))))((((",
      "(((())))))uu))))))((((",
      "(((())))))uu))))))((((",
      "(((())))))uu))nn))((((",
      "(((()GGG))uu))))))((((",
      "(((()GDG))uu))))))((((",
      "(((())))))uu)))t))((((",
      "(((())))))uu))))))((((",
      "(((()))t))uu))))))((((",
      "((((((((((uu((((((((((",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 6, y: 4, to: "yata_nest", tx: 5, ty: 7, dir: 'up' },
      { x: 15, y: 4, to: "yata_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 6, y: 10, to: "yata_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 10, y: 14, to: "world_makai", tx: 21, ty: 4, dir: "left" },
      { x: 11, y: 14, to: "world_makai", tx: 21, ty: 4, dir: "left" },
    ],
    npcs: [
      { id: "yata_crow1", look: "crow", x: 12, y: 6, dir: "left", move: "still", talk: ["「ここは鴉族の崖だ。風を読めねえやつは、足を踏み外すぜ」", "「人間を崖に上げるのは、初めてだ。王様の連れでなけりゃ、突き落としてるところさ」"], talkAfter: ["「王様が人間の前で頭を下げたって話は、崖じゅうに広まってるぜ」", "「……まあ、王様がそうするなら、おれたちも、突き落とすのはやめとくさ」"] },
      { id: "yata_crow2", look: "crow", x: 15, y: 9, dir: "up", move: "wander", talk: ["「崖の上からは、魔界の端まで見える。見張りには、もってこいさ」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.yata_nest = {
    name: "ヤタの断崖　伝令の巣",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " ||||ff||]] ",
      " ffffffffff ",
      " ffkkffffff ",
      " ffkkffff|f ",
      " ffffffffff ",
      " ffffffffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "yata", tx: 6, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "yata", tx: 6, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "yata_nest_runner", look: "crow", x: 8, y: 5, dir: "left", move: "still", quest: "yata_fumi", talk: ["「伝令の仕事は、速さが命だ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yata_shop = {
    name: "ヤタの断崖　鴉族の市",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " ]]]]ff]]]] ",
      " ffCCCCCCff ",
      " ffffffffff ",
      " }fffffffof ",
      " }fffffffof ",
      " ffffffffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "yata", tx: 15, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "yata", tx: 15, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "yata_shop_shop", look: "crow", x: 5, y: 2, dir: "down", move: "still", shop: "yata", talk: ["「光り物と交換……いや、銅貨でいい」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yata_inn = {
    name: "ヤタの断崖　断崖の宿",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " ]]ffffff]] ",
      " ffCCCCCCff ",
      " ffffffffff ",
      " [ffffffff[ ",
      " [ffffffff[ ",
      " ffffffffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "yata", tx: 6, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: "yata", tx: 6, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: "yata_inn_inn", look: "crow", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「止まり木の宿だ。人の寝床も、ちゃんとある」"] },
    ],
    chests: [],
    signs: [],
  };
})();
