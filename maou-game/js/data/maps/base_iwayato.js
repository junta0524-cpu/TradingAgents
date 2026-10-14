// このファイルの役目：拠点「イワヤト」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 魔界の北の端の岩穴。外の光が、ほとんど届かない。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.iwayato = {
    name: "イワヤト",
    outside: "#0c0a10",
    start: { x: 9, y: 12, dir: "up" },
    detection: 1,
    rows: [
      "黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒",
      "黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒",
      "黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒",
      "黒黒黒黒z黒黒黒zzzzzzzz黒黒黒黒",
      "黒黒黒黒z黒D黒zzzzzzzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzRRzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzzzzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzzzzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzzzzz黒黒黒黒",
      "黒黒黒黒zRzzzzzzzzzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzzlzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzzzzz黒黒黒黒",
      "黒黒黒黒zzzzzzzzzzzz黒黒黒黒",
      "黒黒黒黒黒黒黒黒黒zz黒黒黒黒黒黒黒黒黒",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 6, y: 4, to: "iwayato_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 13, to: "world_makai", tx: 28, ty: 17, dir: "down" },
      { x: 10, y: 13, to: "world_makai", tx: 28, ty: 17, dir: "down" },
    ],
    npcs: [
      { id: "iwayato_hermit", look: "jutsushi", x: 12, y: 8, dir: "left", move: "still", talk: ["「ここは、光を嫌う者が隠れる穴だ。……わしも、そのひとりよ」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.iwayato_r1 = {
    name: "イワヤト　岩穴の奥",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " 黒黒黒黒黒黒黒黒黒黒 ",
      " 黒黒黒黒黒黒黒黒黒黒 ",
      " ||||zz||]] ",
      " zzzzzzzzzz ",
      " zzkkzzzzzz ",
      " zzkkzzzz|z ",
      " zzzzzzzzzz ",
      " zzzzzzzzzz ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "iwayato", tx: 6, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "iwayato", tx: 6, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "iwayato_r1_sister", look: "crow", x: 8, y: 5, dir: "left", move: "still", talk: ["「兄さんは、ヤタの断崖で伝令をしています。もう何年も、会っていません」"] },
    ],
    chests: [],
    signs: [],
  };
})();
