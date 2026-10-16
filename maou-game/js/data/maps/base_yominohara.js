// このファイルの役目：拠点「ヨミノハラ」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 湯治場の跡。人間の軍に焼かれた建物の間に、まだ湯が湧いている。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yominohara = {
    name: "ヨミノハラ",
    outside: "#1a1418",
    start: { x: 11, y: 13, dir: "up" },
    detection: 1,
    rows: [
      "tttttttttttttttttttttttt",
      "tttttttttttttttttttttttt",
      "tggggggggggggggggggggggt",
      "tggAAggV~~~~~~~~VggAAggt",
      "tggAAggV~~~~~~~~Vggggggt",
      "tggggggV~~~~~~~~Vggggggt",
      "tggggggV~~~~~~~~Vggggggt",
      "tgggggggggguuggggggggggt",
      "tgggggggggguuggggggggggt",
      "tggGGGGgggguuggggGGGGggt",
      "tggGGDGgggguuggggGGDGggt",
      "tgggggggggguuggggggggggt",
      "tgggggggggguuggggggggggt",
      "tgggggtgggguugggggtggggt",
      "tttttttttttuuttttttttttt",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 10, to: "yominohara_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 19, y: 10, to: "yominohara_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 11, y: 14, to: "world_makai", tx: 27, ty: 19, dir: "down" },
      { x: 12, y: 14, to: "world_makai", tx: 27, ty: 19, dir: "down" },
    ],
    npcs: [
      { id: "yominohara_granny", look: "oldwoman", x: 13, y: 8, dir: "left", move: "still", quest: "yominohara_doku", talk: ["「湯はまだ湧いておる。浸かれば、腰の痛みが少しやわらぐ」"] },
      { id: "yominohara_wolf", look: "wolfkid", x: 6, y: 7, dir: "right", move: "wander", talk: ["「昔はここ、湯治の客でにぎわってたんだって」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.yominohara_r1 = {
    name: "ヨミノハラ　崩れかけた湯屋",
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
      { x: 5, y: 8, to: "yominohara", tx: 5, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: "yominohara", tx: 5, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: "yominohara_r1_man", look: "tsuchi", x: 8, y: 5, dir: "left", move: "still", talk: ["「人間の軍が来た年に、湯屋は焼けた。屋根は落ちたが、湯船は残っておる」", "「わしは、ここで湯を守る。……おまえさんが人間でも、湯は分け隔てなく温めるさ」"], talkAfter: ["「人間の軍が来た年に、湯屋は焼けた。それは、忘れん」", "「だが、和平が成ったと聞いた。いつか、人間の湯治客が来ても、湯は分け隔てなく温めるさ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yominohara_inn = {
    name: "ヨミノハラ　湯治の宿",
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
      { x: 5, y: 8, to: "yominohara", tx: 19, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: "yominohara", tx: 19, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: "yominohara_inn_inn", look: "beastwoman", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「湯に浸かって、ゆっくり休んでいって」"] },
    ],
    chests: [],
    signs: [],
  };
})();
