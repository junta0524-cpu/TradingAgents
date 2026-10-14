// このファイルの役目：拠点「チビキ岩の見張り台」（魔界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 大岩のそばの見張り台。昔、この岩で道がふさがれたという。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.chibiki = {
    name: "チビキ岩の見張り台",
    outside: "#2a1418",
    start: { x: 9, y: 12, dir: "up" },
    detection: 1,
    rows: [
      "((((((((((((((((((((",
      "((((((((((((((((((((",
      "($$$$$$巌巌巌巌巌巌$$$$$$(",
      "($$$$$$巌巌巌巌巌巌$$$$$$(",
      "($$nnnn$$uu$$$$$$$$(",
      "($$GGGG$$uu$$$GGG$$(",
      "($$GGDG$$uu$$$GDG$$(",
      "($$$$$$$$uu$$$$$$$$(",
      "($$$$$$$$uu$$$$$$$$(",
      "($$$$$$$$uu$$$$$$$$(",
      "($$$t$$$$uu$$$$$$$$(",
      "($$$$$$$$uu$$$$tt$$(",
      "($$$$$$$$uu$$$$$$$$(",
      "(((((((((uu(((((((((",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 5, y: 6, to: "chibiki_tower", tx: 5, ty: 7, dir: 'up' },
      { x: 15, y: 6, to: "chibiki_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 9, y: 13, to: "world_makai", tx: 18, ty: 14, dir: "down" },
      { x: 10, y: 13, to: "world_makai", tx: 18, ty: 14, dir: "down" },
    ],
    npcs: [
      { id: "chibiki_watch", look: "wolfkid", x: 11, y: 6, dir: "left", move: "still", talk: ["「見張りの番だ。……あ、ベルさまのお客人か。どうぞどうぞ」"] },
      { id: "chibiki_watch2", look: "oni", x: 8, y: 4, dir: "up", move: "still", quest: "chibiki_kage", talk: ["「この大岩を、千人がかりで引いてきたって話だ。本当かは、知らんがな」"] },
    ],
    chests: [],
    signs: [
      { x: 9, y: 3, text: "見上げるほどの大岩だ。表に、古い引き綱の跡が、いくすじも残っている。" },
    ],
  };

  G.DATA.maps.chibiki_tower = {
    name: "チビキ岩の見張り台　見張り台の詰所",
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
      { x: 5, y: 8, to: "chibiki", tx: 5, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: "chibiki", tx: 5, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: "chibiki_tower_captain", look: "wolfkid", x: 7, y: 5, dir: "left", move: "still", talk: ["「嵐狼族と鬼族が、交代でここを見張っている。仲がいいわけじゃないが、仕事は仕事さ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.chibiki_r1 = {
    name: "チビキ岩の見張り台　見張りの寝床",
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
      { x: 5, y: 8, to: "chibiki", tx: 15, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: "chibiki", tx: 15, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: "chibiki_r1_inn", look: "wolfkid", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「交代で寝る。空いてる寝床を使っていいよ」"] },
    ],
    chests: [],
    signs: [],
  };
})();
