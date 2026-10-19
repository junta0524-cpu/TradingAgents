// このファイルの役目：拠点「タカマの丘」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 空に近い丘。頂に、古い立ち石が二つ並んでいる。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.takama = {
    name: "タカマの丘",
    outside: "#2a5a30",
    start: { x: 10, y: 13, dir: "up" },
    detection: 1,
    rows: [
      "TTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTT",
      "TTTTTTTTTTTTTTTTTTTTTT",
      "T......FFFFFFFF......T",
      "T..,,,.FFFRRFFF..,,,.T",
      "T......FFFFFFFF......T",
      "TYYY...FFFFFFFF...YYYT",
      "T#D#......--......#D#T",
      "T..^^^^...--...YYY...T",
      "T..##D#...--...#D#...T",
      "T.........--.........T",
      "T.........--.........T",
      "T...FF....--...FF....T",
      "T.........--.........T",
      "TTTTTTTTTT--TTTTTTTTTT",
    ],
    warps: [
      { x: 2, y: 7, to: "takama_dougu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      { x: 19, y: 7, to: "takama_bugu", tx: 5, ty: 7, dir: 'up' },   // 道具屋と武具屋（tools/dungeon_design/base_shops.py）
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 9, to: "takama_shrine", tx: 5, ty: 7, dir: 'up' },
      { x: 16, y: 9, to: "takama_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 10, y: 14, to: "world_ningen", tx: 94, ty: 43, dir: "down" },
      { x: 11, y: 14, to: "world_ningen", tx: 94, ty: 43, dir: "down" },
    ],
    npcs: [
      { id: "takama_shepherd", look: "villager", x: 15, y: 11, dir: "up", move: "still", quest: "takama_ookami", talk: ["「羊を連れて上ってくると、遠くに王都の塔が見える」"] },
      { id: "takama_child", look: "kid_ear", x: 8, y: 9, dir: "right", move: "wander", talk: ["「夜になると、星がすぐそこにあるみたいなんだよ」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.takama_shrine = {
    name: "タカマの丘　丘の社",
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
      { x: 5, y: 8, to: "takama", tx: 5, ty: 10, dir: 'down' },
      { x: 6, y: 8, to: "takama", tx: 5, ty: 10, dir: 'down' },
    ],
    npcs: [
      { id: "takama_shrine_priest", look: "elder", x: 5, y: 2, dir: "down", move: "still", quest: "takama_hoshi", talk: ["「この丘は、天に一番近い場所だと言われておった」", "「社の紋は、王都の役人に削られた。それでも、空を仰ぐことまでは、止められん」"], talkAfter: ["「削られた紋を、村の者たちと少しずつ彫り直しておる」", "「五つ目の紋の形だけは、誰も覚えておらなんだ。……それでも、空は、ちゃんと見ておられる」"], talkWhen: [{ chapter: 13, knows: 'chouwa', talk: ["「ある朝、五つ目の窪みに、ひとりでに光が差してな」", "「その形をなぞって、ようやく、五つすべて彫り直せた。……長生きは、するものだ」"] }] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.takama_r1 = {
    name: "タカマの丘　羊飼いの小屋",
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
      { x: 5, y: 8, to: "takama", tx: 16, ty: 10, dir: 'down' },
      { x: 6, y: 8, to: "takama", tx: 16, ty: 10, dir: 'down' },
    ],
    npcs: [
      { id: "takama_r1_wife", look: "oldwoman", x: 8, y: 5, dir: "left", move: "still", inn: true, talk: ["「羊の毛を紡いで、冬の衣にするんだよ」"] },
    ],
    chests: [],
    signs: [],
  };
})();
