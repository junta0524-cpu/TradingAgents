// このファイルの役目：拠点「イワクラ城」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 古い石の城。王都ができる前は、このあたりを治めていたという。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.iwakura = {
    name: "イワクラ城",
    outside: "#3a3a40",
    start: { x: 12, y: 14, dir: "up" },
    detection: 1,
    rows: [
      "VVVVVVVVVVVVVVVVVVVVVVVVVV",
      "V:::::::^^^^^^^^^^:::::::V",
      "V:::::::##########:::::::V",
      "V:::::::#W######W#:::::::V",
      "V:::::::####D#####:::::::V",
      "V::::::::::::::::::::::::V",
      "V:^^^^::::::::::::::^^^^:V",
      "V:##D#::::::::::::::##D#:V",
      "V:::::::::::w::::::::::::V",
      "V::::::::T::::::T::::::::V",
      "V::::::::........::::::::V",
      "V::^^^^:^^^^:::::::^^^^::V",
      "V::##D#:##D#:::::::##D#::V",
      "V::::::::::::::::::::::::V",
      "V::::::::::::::::::::::::V",
      "VVVVVVVVVVVV::VVVVVVVVVVVV",
    ],
    warps: [
      { x: 10, y: 12, to: "iwakura_dougu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 12, y: 4, to: "iwakura_hall", tx: 5, ty: 7, dir: 'up' },
      { x: 4, y: 7, to: "iwakura_barracks", tx: 5, ty: 7, dir: 'up' },
      { x: 22, y: 7, to: "iwakura_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 12, to: "iwakura_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 21, y: 12, to: "iwakura_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 12, y: 15, to: "world_ningen", tx: 54, ty: 27, dir: "down" },
      { x: 13, y: 15, to: "world_ningen", tx: 54, ty: 27, dir: "down" },
    ],
    npcs: [
      { id: "iwakura_guard1", look: "guard", x: 11, y: 5, dir: "down", move: "still", talk: ["「城主さまは、もうずいぶん前から王都に住んでおられる。ここを守るのは、わしら年寄りの衛士だけだ」"], talkAfter: ["「腕章を外して帰ってきた若い者が、昔のように笑うようになった」", "「少し痩せてな。だが、目が、ちゃんとこっちを見ておる」"] },
      { id: "iwakura_gardener", look: "elder", x: 14, y: 8, dir: "left", move: "still", talk: ["「この井戸は、城ができる前からあったそうな」"] },
      { id: "iwakura_kid", look: "child", x: 6, y: 13, dir: "right", move: "wander", talk: ["「お城の上から、王都の白い塔が見えるんだって」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.iwakura_hall = {
    name: "イワクラ城　広間",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " P___cc___P ",
      " ____cc____ ",
      " P___cc___P ",
      " ____cc____ ",
      " P___cc___P ",
      " ____cc____ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "iwakura", tx: 12, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "iwakura", tx: 12, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "iwakura_hall_steward", look: "elder", x: 5, y: 2, dir: "down", move: "still", talk: ["「城主の名代を務めております。……と申しても、留守を預かるだけの身ですが」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwakura_barracks = {
    name: "イワクラ城　衛士の詰所",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]]___}_[_ ",
      " ________[_ ",
      " _kk____kk_ ",
      " __________ ",
      " *****_____ ",
      " __________ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "iwakura", tx: 4, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: "iwakura", tx: 4, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: "iwakura_barracks_captain", look: "guard", x: 7, y: 5, dir: "left", move: "still", quest: "iwakura_kusuri", talk: ["「衛士は皆、年を取った。若い者は、王都の兵に取られていく」", "「白い腕章をつけて帰ってきた者は、礼儀正しくなる。……正しすぎるほどにな」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwakura_inn = {
    name: "イワクラ城　城下の宿",
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
      { x: 5, y: 8, to: "iwakura", tx: 22, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: "iwakura", tx: 22, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: "iwakura_inn_inn", look: "elder", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「城下の宿へ、ようこそ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwakura_shop = {
    name: "イワクラ城　城下の武具屋",
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
      { x: 5, y: 8, to: "iwakura", tx: 5, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "iwakura", tx: 5, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "iwakura_shop_shop", look: "dwarf2", x: 5, y: 2, dir: "down", move: "still", shop: "iwakura", talk: ["「衛士の槍を直すついでに、旅の方にも売っている」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.iwakura_r1 = {
    name: "イワクラ城　古い書庫",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ||||++||]] ",
      " ++++++++++ ",
      " ++kk++++++ ",
      " ++kk++++|+ ",
      " ++++++++++ ",
      " ++++++++++ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "iwakura", tx: 21, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "iwakura", tx: 21, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "iwakura_r1_scribe", look: "elder", x: 8, y: 5, dir: "left", move: "still", talk: ["「この城の記録は、紙が脆くなって読めないものも多い」", "「神々の名の出てくる巻物は、王都の役人が持っていった。残ったのは、米と税の帳面ばかりだ」"], talkAfter: ["「王都の役人が持っていった巻物が、少しずつ戻ってきておる」", "「書き写す手が、足りんほどだ。……ありがたい忙しさよ」"] },
    ],
    chests: [],
    signs: [],
  };
})();
