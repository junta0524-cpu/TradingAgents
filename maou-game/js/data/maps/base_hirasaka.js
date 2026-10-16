// このファイルの役目：拠点「ヒラサカの関」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 魔界の坂の途中にある関所。坂の上は、黄泉津の宮へ続く。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hirasaka = {
    name: "ヒラサカの関",
    outside: "#2a1418",
    start: { x: 10, y: 13, dir: "up" },
    detection: 1,
    rows: [
      "RRRRRRRRRRRRRRRRRRRRRR",
      "RRRRRRRRRRuuRRRRRRRRRR",
      "RRRRRRR%%%uu%%%RRRRRRR",
      "RRRRRRR%%%uu%%%RRRRRRR",
      "RRRRRRR%%%uu%%%RRRRRRR",
      "RRRRRRR%%%uu%%%RRRRRRR",
      "R%%%%%%%%GHHG%%%%%%%%R",
      "R%%%%%%%%%uu%%%%%%%%%R",
      "R%%GGGG%%%uu%%%GGG%%%R",
      "R%%GGDG%%%uu%%%GDG%%%R",
      "R%%%%%%%%%uu%%%%%%%%%R",
      "R%%%%%%%%%uu%%%%%%%%%R",
      "R%%%tt%%%%uu%%%%t%%%%R",
      "R%%%%%%%%%uu%%%%%%%%%R",
      "RRRRRRRRRRuuRRRRRRRRRR",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 9, to: "hirasaka_post", tx: 5, ty: 7, dir: 'up' },
      { x: 16, y: 9, to: "hirasaka_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 10, y: 14, to: "world_makai", tx: 15, ty: 7, dir: "down" },
      { x: 11, y: 14, to: "world_makai", tx: 15, ty: 7, dir: "down" },
    ],
    npcs: [
      { id: "hirasaka_gate", look: "oni", x: 9, y: 7, dir: "down", move: "still", talk: ["「坂の上は宮だ。用のない者は、通さん。……王様のお連れなら、別だがな」"] },
      { id: "hirasaka_keeper", look: "oni", x: 12, y: 9, dir: "left", move: "still", quest: "hirasaka_nakui", talk: ["「近ごろ、坂の下の暗がりに、名を喰う影が出る」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.hirasaka_post = {
    name: "ヒラサカの関　関の番所",
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
      { x: 5, y: 8, to: "hirasaka", tx: 5, ty: 10, dir: 'down' },
      { x: 6, y: 8, to: "hirasaka", tx: 5, ty: 10, dir: 'down' },
    ],
    npcs: [
      { id: "hirasaka_post_scribe", look: "oni", x: 8, y: 5, dir: "left", move: "still", talk: ["「坂を通った者の数を、毎日つけておる。今日は、まだ三人だ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hirasaka_r1 = {
    name: "ヒラサカの関　坂の茶屋",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " ]]ff{}ff[f ",
      " ffffffff[f ",
      " ffkkffffff ",
      " ffkkffffff ",
      " ffffffffff ",
      " ffffffffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "hirasaka", tx: 16, ty: 10, dir: 'down' },
      { x: 6, y: 8, to: "hirasaka", tx: 16, ty: 10, dir: 'down' },
    ],
    npcs: [
      { id: "hirasaka_r1_tea", look: "beastwoman", x: 8, y: 5, dir: "left", move: "still", inn: true, talk: ["「坂を上る前に、ひと休みしていきなさいな」"] },
    ],
    chests: [],
    signs: [],
  };
})();
