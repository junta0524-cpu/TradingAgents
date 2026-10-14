// このファイルの役目：拠点「オハバリ城」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 鬼族の古い城。ミカヅチの兵たちが鍛錬に使う。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.ohabari = {
    name: "オハバリ城",
    outside: "#1a0e10",
    start: { x: 11, y: 14, dir: "up" },
    detection: 1,
    rows: [
      "GGGGGGGGGGGGGGGGGGGGGGGG",
      "GffffffGGGGGGGGGGffffffG",
      "GffffffGGGGGGGGGGffffffG",
      "GffffffGGGGGGGGGGffffffG",
      "GffffffGGGGDDGGGGffffffG",
      "GffffffffffccffffffffffG",
      "GfGGGGffPffccffPffGGGGfG",
      "GfGGDGfffffccfffffGGDGfG",
      "GffffffffffccffffffffffG",
      "GfffffffPffccffPfffffffG",
      "GffffffffffccffffffffffG",
      "GfGGGGfffffccffffffffffG",
      "GfGGDGffPffccffPffKKfffG",
      "GffffffffffccfffffffKffG",
      "GffffffffffccffffffffffG",
      "GGGGGGGGGGGccGGGGGGGGGGG",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 11, y: 4, to: "ohabari_hall", tx: 5, ty: 7, dir: 'up' },
      { x: 12, y: 4, to: "ohabari_hall", tx: 5, ty: 7, dir: 'up' },
      { x: 4, y: 7, to: "ohabari_barracks", tx: 5, ty: 7, dir: 'up' },
      { x: 20, y: 7, to: "ohabari_smithy", tx: 5, ty: 7, dir: 'up' },
      { x: 4, y: 12, to: "ohabari_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 11, y: 15, to: "world_makai", tx: 6, ty: 6, dir: "down" },
      { x: 12, y: 15, to: "world_makai", tx: 6, ty: 6, dir: "down" },
    ],
    npcs: [
      { id: "ohabari_oni1", look: "oni", x: 10, y: 6, dir: "down", move: "still", talk: ["「オハバリの城は、角ヶ原より古い。昔の鬼の王が建てたそうだ」"] },
      { id: "ohabari_oni2", look: "oni", x: 14, y: 11, dir: "left", move: "wander", talk: ["「鍛錬だ、鍛錬！　……人間の冒険者か。おまえも、ひと汗かいていくか？」"] },
    ],
    chests: [],
    signs: [
    ],
  };

  G.DATA.maps.ohabari_hall = {
    name: "オハバリ城　オハバリ城の大広間",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " PfffccfffP ",
      " ffffccffff ",
      " PfffccfffP ",
      " ffffccffff ",
      " PfffccfffP ",
      " ffffccffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ohabari", tx: 11, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: "ohabari", tx: 11, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: "ohabari_hall_elder", look: "oni", x: 5, y: 2, dir: "down", move: "still", talk: ["「この広間で、昔の鬼の王は、宴を開いたそうだ」", "「今は、鍛錬のあとの寝床になっておる」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ohabari_barracks = {
    name: "オハバリ城　鬼の兵舎",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " ]]]fff}f[f ",
      " ffffffff[f ",
      " fkkffffkkf ",
      " ffffffffff ",
      " *****fffff ",
      " ffffffffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ohabari", tx: 4, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: "ohabari", tx: 4, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: "ohabari_barracks_sergeant", look: "oni", x: 7, y: 5, dir: "left", move: "still", quest: "ohabari_kusuri", talk: ["「鍛錬で傷をこしらえる若い衆が、多くてな」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ohabari_smithy = {
    name: "オハバリ城　鬼の鍛冶場",
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      " GGGGGGGGGG ",
      " GGGGGGGGGG ",
      " ZZff]]ff|f ",
      " ffffffffff ",
      " fkkffffkkf ",
      " ffffffffff ",
      " ooffffffff ",
      " ffffffffff ",
      "     EE     ",
    ],
    warps: [
      { x: 5, y: 8, to: "ohabari", tx: 20, ty: 8, dir: 'down' },
      { x: 6, y: 8, to: "ohabari", tx: 20, ty: 8, dir: 'down' },
    ],
    npcs: [
      { id: "ohabari_smithy_shop", look: "oni", x: 4, y: 5, dir: "right", move: "still", shop: "ohabari", talk: ["「鬼の鉄で打った品だ。重いが、折れん」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ohabari_inn = {
    name: "オハバリ城　兵の休み所",
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
      { x: 5, y: 8, to: "ohabari", tx: 4, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: "ohabari", tx: 4, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: "ohabari_inn_inn", look: "oni", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「寝ていけ。鬼の寝床は、硬いぞ」"] },
    ],
    chests: [],
    signs: [],
  };
})();
