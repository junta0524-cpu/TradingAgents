// このファイルの役目：拠点「宿場町ヤチマタ」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 八つの道が交わる宿場町。旅人と荷車が絶えない。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yachimata = {
    name: "宿場町ヤチマタ",
    outside: "#2a5a28",
    start: { x: 12, y: 1, dir: "down" },
    detection: 1,
    rows: [
      "TTTTTTTTTTTT--TTTTTTTTTTTT",
      "T...........--...........T",
      "T...........--...........T",
      "T..YYYYY....--...YYYYY...T",
      "T..##D##.o..--...##D##...T",
      "T...........--...........T",
      "T...........--...........T",
      "--------------------------",
      "--------------------------",
      "T...........--...........T",
      "T...........--.w.........T",
      "T..YYY.YYY..--....YYY....T",
      "T..#D#.#D#..--....#D#.vv.T",
      "T...........--........vv.T",
      "T...........--...........T",
      "TTTTTTTTTTTT--TTTTTTTTTTTT",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 4, to: "yachimata_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 19, y: 4, to: "yachimata_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 4, y: 12, to: "yachimata_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 19, y: 12, to: "yachimata_r2", tx: 5, ty: 7, dir: 'up' },
      { x: 8, y: 12, to: "yachimata_r3", tx: 5, ty: 7, dir: 'up' },
      { x: 12, y: 0, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 13, y: 0, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 0, y: 7, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 25, y: 7, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 0, y: 8, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 25, y: 8, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 12, y: 15, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
      { x: 13, y: 15, to: "world_ningen", tx: 8, ty: 14, dir: "down" },
    ],
    npcs: [
      { id: "yachimata_traveler", look: "merchant", x: 10, y: 9, dir: "right", move: "wander", talk: ["「北へ行けば鉱山、西へ行けば森、東は王都。ここで道を決めるのさ」"] },
      { id: "yachimata_carter", look: "villager", x: 16, y: 6, dir: "down", move: "still", talk: ["「荷車の車輪が、また欠けた。道が悪いんだ、道が」"] },
      { id: "yachimata_kid", look: "kid_tail", x: 6, y: 9, dir: "up", move: "wander", talk: ["「旅の人、どこから来たの？　ぼく、この町から出たことないんだ」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.yachimata_inn = {
    name: "ヤチマタ　大宿",
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
      { x: 5, y: 8, to: "yachimata", tx: 5, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "yachimata", tx: 5, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "yachimata_inn_inn", look: "elder", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「八つの道の真ん中の宿だ。ゆっくりしていきなさい」"] },
      { id: "yachimata_inn_youth", look: "villager", x: 8, y: 6, dir: "left", move: "still", talk: ["「宿の手伝いです。山の村から出てきて、もう三年になります」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yachimata_shop = {
    name: "ヤチマタ　茶屋",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]]]++]]]] ",
      " ++CCCCCC++ ",
      " ++++++++++ ",
      " }+++++++o+ ",
      " }+++++++o+ ",
      " ++++++++++ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "yachimata", tx: 19, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "yachimata", tx: 19, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "yachimata_shop_shop", look: "villager", x: 5, y: 2, dir: "down", move: "still", shop: "yachimata", talk: ["「旅の支度なら、うちでどうぞ」"] },
      { id: "yachimata_shop_okami", look: "oldwoman", x: 8, y: 5, dir: "left", move: "still", quest: "yachimata_hoshii", talk: ["「旅人が多いと、干し飯がいくらあっても足りないのよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yachimata_r1 = {
    name: "ヤチマタ　馬宿",
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
      { x: 5, y: 8, to: "yachimata", tx: 4, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "yachimata", tx: 4, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "yachimata_r1_groom", look: "villager", x: 7, y: 5, dir: "left", move: "still", talk: ["「馬は正直だ。疲れたら、ちゃんと止まる」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yachimata_r2 = {
    name: "ヤチマタ　旅籠の主の家",
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
      { x: 5, y: 8, to: "yachimata", tx: 19, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "yachimata", tx: 19, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "yachimata_r2_master", look: "merchant", x: 8, y: 5, dir: "left", move: "still", quest: "yachimata_kitsune", talk: ["「森の道に、狐が出るようになってね」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.yachimata_r3 = {
    name: "ヤチマタ　祠守の家",
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
      { x: 5, y: 8, to: "yachimata", tx: 8, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "yachimata", tx: 8, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "yachimata_r3_keeper", look: "elder", x: 8, y: 5, dir: "left", move: "still", talk: ["「道の分かれ目には、道を守る神がいると言われておった」", "「神を拝むのは、王都の触れで止められた。それでも、わしは毎朝、石を拭く」"], talkAfter: ["「触れが解けてな。今朝は、わしのほかにも、石を拭く者がおった」", "「道の神さまも、さぞ、にぎやかで驚いておられよう」"] },
    ],
    chests: [],
    signs: [],
  };
})();
