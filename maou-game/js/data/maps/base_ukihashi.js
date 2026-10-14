// このファイルの役目：拠点「関所の町ウキハシ」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 川に架かる橋の手前の関所の町。橋を渡るには通行の札がいる。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.ukihashi = {
    name: "関所の町ウキハシ",
    outside: "#2a4a3a",
    start: { x: 12, y: 14, dir: "up" },
    detection: 1,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTTTT",
      "T...........--...........T",
      "T..^^^^^....--....YYY....T",
      "T..##D##....--....#D#....T",
      "T...........--...........T",
      "T..........VHHV..........T",
      "T~~~~~~~~~~~--~~~~~~~~~~~T",
      "T~~~~~~~~~~~--~~~~~~~~~~~T",
      "T~~~~~~~~~~~--~~~~~~~~~~~T",
      "T...........--...........T",
      "T..YYYY.....--....YYYY...T",
      "T..##D#.....--....##D#...T",
      "T.......YYY.--...........T",
      "T.......#D#.--..oo.......T",
      "T...........--.......w...T",
      "TTTTTTTTTTTT--TTTTTTTTTTTT",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 3, to: "ukihashi_post", tx: 5, ty: 7, dir: 'up' },
      { x: 19, y: 3, to: "ukihashi_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 11, to: "ukihashi_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 20, y: 11, to: "ukihashi_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 13, to: "ukihashi_r2", tx: 5, ty: 7, dir: 'up' },
      { x: 12, y: 15, to: "world_ningen", tx: 21, ty: 14, dir: "down" },
      { x: 13, y: 15, to: "world_ningen", tx: 21, ty: 14, dir: "down" },
    ],
    npcs: [
      { id: "ukihashi_gate1", look: "guard", x: 11, y: 4, dir: "down", move: "still", talk: ["「橋の向こうへ渡るなら、札を見せてもらう。……冒険者か。通っていい」"] },
      { id: "ukihashi_gate2", look: "guard", x: 14, y: 9, dir: "up", move: "still", quest: "ukihashi_inoshishi", talk: ["「川の向こうから、野の獣が橋を渡ってくることがある。気をつけてな」"] },
      { id: "ukihashi_woman", look: "villager", x: 7, y: 13, dir: "up", move: "wander", talk: ["「橋が架かる前は、渡し舟だったんですって」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.ukihashi_post = {
    name: "ウキハシ　関所の詰所",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ||||__||]] ",
      " __________ ",
      " __kk______ ",
      " __kk____|_ ",
      " __________ ",
      " __________ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ukihashi", tx: 5, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: "ukihashi", tx: 5, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: "ukihashi_post_clerk", look: "clerk", x: 8, y: 5, dir: "left", move: "still", quest: "ukihashi_fumi", talk: ["「通った人と荷を、ここで帳面に書きつけます」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ukihashi_r1 = {
    name: "ウキハシ　渡し守の家",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]++{}++[+ ",
      " ++++++++[+ ",
      " ++kk++++++ ",
      " ++kk++++++ ",
      " ++++++++++ ",
      " ++++++++++ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ukihashi", tx: 19, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: "ukihashi", tx: 19, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: "ukihashi_r1_ferryman", look: "sailor", x: 8, y: 5, dir: "left", move: "still", talk: ["「昔は、わしが舟で人を渡しておった。橋ができて、楽になったが、少し寂しい」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ukihashi_inn = {
    name: "ウキハシ　関所前の宿",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]______]] ",
      " __CCCCCC__ ",
      " __________ ",
      " [________[ ",
      " [________[ ",
      " __________ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ukihashi", tx: 5, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: "ukihashi", tx: 5, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: "ukihashi_inn_inn", look: "oldwoman", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「札を待つ間、泊まっていく人が多いのよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ukihashi_shop = {
    name: "ウキハシ　関所の店",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]]]__]]]] ",
      " __CCCCCC__ ",
      " __________ ",
      " }_______o_ ",
      " }_______o_ ",
      " __________ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ukihashi", tx: 20, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: "ukihashi", tx: 20, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: "ukihashi_shop_shop", look: "merchant", x: 5, y: 2, dir: "down", move: "still", shop: "ukihashi", talk: ["「橋の向こうは、ここより物が高い。買うなら、今のうちだよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ukihashi_r2 = {
    name: "ウキハシ　川漁師の家",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]]+++}+[+ ",
      " ++++++++[+ ",
      " +kk++++kk+ ",
      " ++++++++++ ",
      " *****+++++ ",
      " ++++++++++ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ukihashi", tx: 9, ty: 14, dir: 'down' },
      { x: 6, y: 8, to: "ukihashi", tx: 9, ty: 14, dir: 'down' },
    ],
    npcs: [
      { id: "ukihashi_r2_fisher", look: "villager", x: 7, y: 5, dir: "left", move: "still", talk: ["「川の魚は、海の魚より淡くて、うまい」"] },
    ],
    chests: [],
    signs: [],
  };
})();
