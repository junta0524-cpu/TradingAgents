// このファイルの役目：拠点「ミズホ離宮」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 田に囲まれた、王家の離宮。今は、年老いた女官たちが守っている。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.mizuho = {
    name: "ミズホ離宮",
    outside: "#3a6a3a",
    start: { x: 12, y: 14, dir: "up" },
    detection: 1,
    rows: [
      "VVVVVVVVVVVVVVVVVVVVVVVVVV",
      "Vhhhhhhh2222222222hhhhhhhV",
      "Vhrrrrrh1111111111hrrrrrhV",
      "Vhrrrrrh1111111111hrrrrrhV",
      "Vhrrrrrh1111D11111hrrrrrhV",
      "Vhrrrrrhhhhh33hhhhhrrrrrhV",
      "Vhhhhhhhhhhh33hhhhhhhhhhhV",
      "Vhh222hhhhhh33hhhhh2222hhV",
      "Vhh1D1hhhhhh33hhhhh11D1hhV",
      "Vhhhhhhhhhhh33h222hhhhhhhV",
      "Vhhhhhhhhhhh33h1D1hhhhhhhV",
      "VhrrrrrhYYYh33hhhhhrrrrrhV",
      "Vhrrrrrh#D#h33hhhhhrrrrrhV",
      "Vhrrrrrhhhhh33hhwhhrrrrrhV",
      "Vhhh}hhhhhhh33hhhhhhhhhhhV",
      "VVVVVVVVVVVV33VVVVVVVVVVVV",
    ],
    warps: [
      { x: 16, y: 10, to: "mizuho_dougu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 12, y: 4, to: "mizuho_hall", tx: 5, ty: 7, dir: 'up' },
      { x: 4, y: 8, to: "mizuho_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 21, y: 8, to: "mizuho_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 12, to: "mizuho_kura", tx: 5, ty: 7, dir: 'up' },
      { x: 12, y: 15, to: "world_ningen", tx: 106, ty: 65, dir: "up" },
      { x: 13, y: 15, to: "world_ningen", tx: 106, ty: 65, dir: "up" },
    ],
    npcs: [
      { id: "mizuho_farmer", look: "villager", x: 7, y: 10, dir: "down", move: "still", quest: "mizuho_ine", talk: ["「離宮の田の米は、昔、王さまの祭りに納めたものだ」"] },
      { id: "mizuho_lady", look: "villager", x: 15, y: 7, dir: "left", move: "still", talk: ["「この離宮に王族の方がいらしたのは、もう遠い昔のこと」"] },
    ],
    chests: [],
    signs: [
      { x: 4, y: 14, text: "田へ水を引く水甕だ。底に、細い亀裂が走っている。" },
    ],
  };

  G.DATA.maps.mizuho_hall = {
    name: "ミズホ離宮　離宮の広間",
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
      { x: 5, y: 8, to: "mizuho", tx: 12, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "mizuho", tx: 12, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "mizuho_hall_chief", look: "oldwoman", x: 5, y: 2, dir: "down", move: "still", talk: ["「離宮をお守りしております。……お客さまは、本当に久しぶり」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.mizuho_r1 = {
    name: "ミズホ離宮　女官の部屋",
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
      { x: 5, y: 8, to: "mizuho", tx: 4, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: "mizuho", tx: 4, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: "mizuho_r1_maid", look: "villager", x: 7, y: 5, dir: "left", move: "still", quest: "mizuho_kusuri", talk: ["「離宮の蔵の薬が、もう底をついてしまって」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.mizuho_shop = {
    name: "ミズホ離宮　武具商人",
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
      { x: 5, y: 8, to: "mizuho", tx: 21, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: "mizuho", tx: 21, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: "mizuho_shop_shop", look: "merchant", x: 5, y: 2, dir: "down", move: "still", shop: "mizuho", talk: ["「離宮へ品を納めております。旅の方にもお分けしますよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.mizuho_kura = {
    name: "ミズホ離宮　離宮の蔵",
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
      { x: 5, y: 8, to: "mizuho", tx: 9, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "mizuho", tx: 9, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "mizuho_kura_keeper", look: "elder", x: 8, y: 5, dir: "left", move: "still", talk: ["「祭りの道具が、ずっと眠ったままの蔵だ」", "「いつか、また使う日が来るといいがな」"] },
    ],
    chests: [],
    signs: [],
  };
})();
