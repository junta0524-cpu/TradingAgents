// このファイルの役目：拠点「森の村ククノチ」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 大樹の幹に住まいをつくる、森の村。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.kukunochi = {
    name: "森の村ククノチ",
    outside: "#1a3a1e",
    start: { x: 11, y: 14, dir: "up" },
    detection: 1,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTTTT",
      "TTTT.......pp.......TTTT",
      "TTTT.UUU...pp...UUU.TTTT",
      "T....UUU.T.pp.T.UUU....T",
      "TUUU.UJU...pp...UJU....T",
      "TUUU.......pp..........T",
      "TUJU.......pp..........T",
      "T.pppppppppppppppppppp.T",
      "T..........pp..........T",
      "T...UUU....pp....UUU...T",
      "T...UUU.UU.pp.,,.UUU...T",
      "T...UJU.UU.pp.,,.UJU...T",
      "T.FF....UU.pp..........T",
      "T..........pp.......FF.T",
      "TTTTTTTTTTTppTTTTTTTTTTT",
    ],
    warps: [
      { x: 2, y: 7, to: "kukunochi_bugu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 6, y: 5, to: "kukunochi_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 17, y: 5, to: "kukunochi_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 12, to: "kukunochi_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 18, y: 12, to: "kukunochi_r2", tx: 5, ty: 7, dir: 'up' },
      { x: 11, y: 15, to: "world_ningen", tx: 18, ty: 55, dir: "down" },
      { x: 12, y: 15, to: "world_ningen", tx: 18, ty: 55, dir: "down" },
    ],
    npcs: [
      { id: "kukunochi_chief", look: "elf2", x: 13, y: 6, dir: "down", move: "still", quest: "kukunochi_tsuta", talk: ["「森の木は、切らずに住まわせてもらうのが、この村の決まりだ」", "「聖の森は、どちらにもつかぬ。わしらも、そうして生きてきた」"] },
      { id: "kukunochi_girl", look: "elf", x: 6, y: 9, dir: "right", move: "wander", talk: ["「木の上の家は、風が吹くと少し揺れるの。それが気持ちいいのよ」"] },
      { id: "kukunochi_old", look: "elder", x: 10, y: 12, dir: "right", move: "still", quest: "kukunochi_ki", talk: ["「この大樹は、村ができる前からここにある」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.kukunochi_r1 = {
    name: "ククノチ　薬師見習いの家",
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
      { x: 5, y: 8, to: "kukunochi", tx: 6, ty: 6, dir: 'down' },
      { x: 6, y: 8, to: "kukunochi", tx: 6, ty: 6, dir: 'down' },
    ],
    npcs: [
      { id: "kukunochi_r1_apprentice", look: "elf", x: 8, y: 5, dir: "left", move: "still", quest: "kukunochi_doku", talk: ["「お師匠さまに、薬草の見分け方を教わっているところです」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kukunochi_inn = {
    name: "ククノチ　樹上の宿",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " IIIIIIIIII ",
      " IIIIIIIIII ",
      " ]]++++++]] ",
      " ++CCCCCC++ ",
      " ++++++++++ ",
      " [++++++++[ ",
      " [++++++++[ ",
      " ++++++++++ ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "kukunochi", tx: 17, ty: 6, dir: 'down' },
      { x: 6, y: 8, to: "kukunochi", tx: 17, ty: 6, dir: 'down' },
    ],
    npcs: [
      { id: "kukunochi_inn_inn", look: "elf", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「葉擦れの音で、よく眠れますよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kukunochi_shop = {
    name: "ククノチ　森の薬屋",
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
      { x: 5, y: 8, to: "kukunochi", tx: 5, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "kukunochi", tx: 5, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "kukunochi_shop_shop", look: "elf2", x: 5, y: 2, dir: "down", move: "still", shop: "kukunochi", talk: ["「森で採れたものばかりです」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kukunochi_r2 = {
    name: "ククノチ　弓作りの家",
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
      { x: 5, y: 8, to: "kukunochi", tx: 18, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "kukunochi", tx: 18, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "kukunochi_r2_bowyer", look: "elf2", x: 4, y: 5, dir: "right", move: "still", talk: ["「弓は、木の癖を読んで削る。無理に曲げると、すぐ折れる」"] },
    ],
    chests: [],
    signs: [],
  };
})();
