// このファイルの役目：拠点「港町イナサ」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 小さな浜の港町。網元の家が、浜をまとめている。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.inasa = {
    name: "港町イナサ",
    outside: "#2C5FA8",
    start: { x: 12, y: 1, dir: "down" },
    detection: 1,
    rows: [
      "TTTTTTTTTTTT::TTTTTTTTTTTT",
      "T...........::...........T",
      "T...........::...........T",
      "T.^^^^^.....::...^^^^^...T",
      "T.##D##.....::...##D##...T",
      "T...........::...........T",
      "T...........::...........T",
      "T..YYYY.....::.....YYY...T",
      "T..##D#.....::.....#D#...T",
      "T........oo.::.o.........T",
      "T::::::::::::::::::::::::T",
      "T~~~~~==~~~~~~~~~~==~~~~~T",
      "T~~~~~==~~~~~~~~~~==~~~~~T",
      "T~~~~~==~~~~~~~~~~==~~~~~T",
      "T~~~~~~~~~~~~~~~~~o=~~~~~T",
      "TTTTTTTTTTTTTTTTTTTTTTTTTT",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 4, y: 4, to: "inasa_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 19, y: 4, to: "inasa_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 8, to: "inasa_amimoto", tx: 5, ty: 7, dir: 'up' },
      { x: 20, y: 8, to: "inasa_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 12, y: 0, to: "world_ningen", tx: 22, ty: 19, dir: "down" },
      { x: 13, y: 0, to: "world_ningen", tx: 22, ty: 19, dir: "down" },
    ],
    npcs: [
      { id: "inasa_fisher", look: "sailor", x: 10, y: 8, dir: "right", move: "still", quest: "inasa_karasu", talk: ["「鴉のやつら、干した魚を片っ端から持っていきやがる」"] },
      { id: "inasa_kid", look: "child", x: 16, y: 6, dir: "down", move: "still", quest: "inasa_uki", talk: ["「浮きを、桟橋の先で落としちゃった……」"] },
      { id: "inasa_wife", look: "villager", x: 4, y: 9, dir: "right", move: "wander", talk: ["「浜の風は、いつも少し塩からいの」"] },
    ],
    chests: [],
    signs: [
      { x: 18, y: 14, text: "桟橋の先に、樽がひとつ置かれている。波が、ひたひたと寄せている。" },
    ],
  };

  G.DATA.maps.inasa_inn = {
    name: "イナサ　浜の宿",
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
      { x: 5, y: 8, to: "inasa", tx: 4, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "inasa", tx: 4, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "inasa_inn_inn", look: "sailor", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「波の音がうるさいって言う客もいるが、慣れりゃ子守唄だ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.inasa_shop = {
    name: "イナサ　イナサの店",
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
      { x: 5, y: 8, to: "inasa", tx: 19, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "inasa", tx: 19, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "inasa_shop_shop", look: "merchant", x: 5, y: 2, dir: "down", move: "still", shop: "inasa", talk: ["「港に入った品を、そのまま並べてるよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.inasa_amimoto = {
    name: "イナサ　網元の家",
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
      { x: 5, y: 8, to: "inasa", tx: 5, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: "inasa", tx: 5, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: "inasa_amimoto_amimoto", look: "elder", x: 7, y: 5, dir: "left", move: "still", talk: ["「網元をしておる。浜のことなら、なんでも聞きなさい」", "「昔、この浜で、国を譲る譲らぬの話し合いがあったそうな。剣ではなく、言葉でな」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.inasa_r1 = {
    name: "イナサ　網干しの小屋",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ZZ++]]++|+ ",
      " ++++++++++ ",
      " +kk++++kk+ ",
      " ++++++++++ ",
      " oo++++++++ ",
      " ++++++++++ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "inasa", tx: 20, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: "inasa", tx: 20, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: "inasa_r1_netter", look: "oldwoman", x: 4, y: 5, dir: "right", move: "still", talk: ["「破れた網を繕うのが、わたしの仕事さ」", "「目が一つ破れると、魚はそこから逃げるんだよ」"] },
    ],
    chests: [],
    signs: [],
  };
})();
