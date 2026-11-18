// このファイルの役目：拠点「ネズミの抜け穴」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 細い岩の抜け穴。小さな獣人たちが、身を寄せ合って暮らしている。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.nezumi = {
    name: "ネズミの抜け穴",
    outside: "#100c10",
    start: { x: 9, y: 12, dir: "up" },
    detection: 1,
    rows: [
      "黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒",
      "黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒",
      "黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒",
      "黒黒黒z黒黒黒黒D黒黒D黒黒黒黒z黒黒黒",
      "黒黒黒z黒D黒zzzzzz黒D黒z黒黒黒",
      "黒黒黒zzzRRRzzzzzzzz黒黒黒",
      "黒黒黒zzzRRRzzzzzzzz黒黒黒",
      "黒黒黒zzzzzzzzzzzzzz黒黒黒",
      "黒黒黒zzzzzzzzzRRRzz黒黒黒",
      "黒黒黒zzzzzzzzzRRRzz黒黒黒",
      "黒黒黒zlzzzzzzzzzzzz黒黒黒",
      "黒黒黒zzzzzzzzzzzzll黒黒黒",
      "黒黒黒zzzzzzzzzzzzzz黒黒黒",
      "黒黒黒黒黒黒黒黒黒zz黒黒黒黒黒黒黒黒黒",
    ],
    warps: [
      { x: 8, y: 3, to: "nezumi_dougu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      { x: 11, y: 3, to: "nezumi_bugu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 4, to: "nezumi_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 14, y: 4, to: "nezumi_r2", tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 13, to: "world_makai", tx: 38, ty: 27, dir: "down" },
      { x: 10, y: 13, to: "world_makai", tx: 38, ty: 27, dir: "down" },
    ],
    npcs: [
      { id: "nezumi_kid", look: "kid_tail", x: 9, y: 7, dir: "down", move: "still", quest: "nezumi_ana", talk: ["「ここはね、人間の兵が野に火を放ったとき、みんなが逃げこんだ穴なんだって」"] },
      { id: "nezumi_elder", look: "tsuchi", x: 5, y: 9, dir: "right", move: "still", talk: ["「狭いが、雨も火も入ってこん。いい穴だ」"] },
    ],
    chests: [],
    signs: [
      { x: 13, y: 9, text: "岩の隙間が、奥へ続いている。暗くて、よく見えない。" },
    ],
  };

  G.DATA.maps.nezumi_r1 = {
    name: "抜け穴　穴の奥の住まい",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " 黒黒黒黒黒黒黒黒黒黒 ",
      " 黒黒黒黒黒黒黒黒黒黒 ",
      " ]]zz{}zz[z ",
      " zzzzzzzz[z ",
      " zzkkzzzzzz ",
      " zzkkzzzzzz ",
      " zzzzzzzzzz ",
      " zzzzzzzzzz ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "nezumi", tx: 5, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "nezumi", tx: 5, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "nezumi_r1_mother", look: "beastwoman", x: 8, y: 5, dir: "left", move: "still", inn: true, talk: ["「子どもたちには、穴の外はまだ危ないって言ってるんだけどね」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.nezumi_r2 = {
    name: "抜け穴　貯えの穴",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " 黒黒黒黒黒黒黒黒黒黒 ",
      " 黒黒黒黒黒黒黒黒黒黒 ",
      " ZZzz]]zz|z ",
      " zzzzzzzzzz ",
      " zkkzzzzkkz ",
      " zzzzzzzzzz ",
      " oozzzzzzzz ",
      " zzzzzzzzzz ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "nezumi", tx: 14, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "nezumi", tx: 14, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "nezumi_r2_keeper", look: "tsuchi", x: 4, y: 5, dir: "right", move: "still", talk: ["「木の実と干し肉を、冬の分だけ貯えておる」"] },
    ],
    chests: [],
    signs: [],
  };
})();
