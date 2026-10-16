// このファイルの役目：拠点「鉱夫村マガネ」（人間界の地図の寄り道の場所）の外のマップと、建物の中（部屋）のマップ。
// 炉ヶ岳のふもとの坑夫の村。古い竪坑は板でふさがれている。住む人のひと言は暮らしの声（ユーザー決定）。quest のある人は寄り道の頼みごと（js/data/quests.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.magane = {
    name: "鉱夫村マガネ",
    outside: "#2a2420",
    start: { x: 11, y: 13, dir: "up" },
    detection: 1,
    rows: [
      "mmmmmmm:mmmmmmmmmmmmmmmm",
      "mmmmmmm:m杭杭杭杭杭mmmmmmmmmm",
      "meXXXXeee杭杭R杭杭eeeeXXXXem",
      "meXXDXeeeee::eeeeeXXDXem",
      "meeeeeeeeee::eeeeeeeeeem",
      "meeeeeooeee::eeeZeeeeeem",
      "meReeeeeeee::eeeeeeeReem",
      "meeeeeeeeee::eeeeeeeeeem",
      "mee::::::::::::::::::eem",
      "meeeeeeeeee::eeeeeeeeeem",
      "meeXXXXeeee::eeeeXXXXeem",
      "meeXXDXeeee::eeeeXXDXeem",
      "meeeeeeoeee::eeeeeeeeeem",
      "meeeeeeeeee::eeeeeeeeeem",
      "mmmmmmmmmmm::mmmmmmmmmmm",
    ],
    warps: [
      // 建物の中（このファイルの下）と、外の地図への出口
      { x: 4, y: 3, to: "magane_r1", tx: 5, ty: 7, dir: 'up' },
      { x: 20, y: 3, to: "magane_inn", tx: 5, ty: 7, dir: 'up' },
      { x: 5, y: 11, to: "magane_shop", tx: 5, ty: 7, dir: 'up' },
      { x: 19, y: 11, to: "magane_r2", tx: 5, ty: 7, dir: 'up' },
      { x: 11, y: 14, to: "world_ningen", tx: 8, ty: 10, dir: "down" },
      { x: 12, y: 14, to: "world_ningen", tx: 8, ty: 10, dir: "down" },
      { x: 7, y: 0, to: "world_ningen", tx: 8, ty: 8, dir: "up" },
    ],
    npcs: [
      { id: "magane_miner", look: "dwarf", x: 14, y: 4, dir: "left", move: "still", quest: "magane_tokage", talk: ["「竪坑は、もう二十年も前に閉じた。鉄は出るが、人が出てこられなくなってな」"] },
      { id: "magane_kid", look: "kid_ear", x: 8, y: 6, dir: "down", move: "wander", talk: ["「ぼく、大きくなったら坑夫になるんだ」", "「父ちゃんの手、ごつごつで、あったかいんだよ」"] },
      { id: "magane_woman", look: "villager", x: 15, y: 9, dir: "up", move: "still", talk: ["「炉ヶ岳の里へ鉄を運ぶ荷車が、朝早くに出ていくの」", "「王都に納める数が、年ごとに増えてね。坑夫たちは、夜も掘っているのよ」"], talkAfter: ["「王都に納める数の触れが、取り消されたの」", "「坑夫たちも、夜は家に帰って眠れるようになったわ」"] },
    ],
    chests: [],
    signs: [
      { x: 11, y: 2, text: "古い竪坑の口だ。板が何枚も打ちつけられ、隙間から冷たい風が吹き上げてくる。" },
    ],
  };

  G.DATA.maps.magane_r1 = {
    name: "マガネ　坑夫の家",
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
      { x: 5, y: 8, to: "magane", tx: 4, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: "magane", tx: 4, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: "magane_r1_mother", look: "oldwoman", x: 8, y: 5, dir: "left", move: "still", quest: "magane_fumi", talk: ["「息子は、ヤチマタの宿場へ働きに出たきりでねえ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.magane_inn = {
    name: "マガネ　坑夫の宿",
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
      { x: 5, y: 8, to: "magane", tx: 20, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: "magane", tx: 20, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: "magane_inn_inn", look: "dwarf2", x: 5, y: 2, dir: "down", move: "still", inn: true, talk: ["「坑夫の宿だ。寝床は固いが、よく眠れる」"] },
      { id: "magane_inn_guest", look: "dwarf", x: 8, y: 6, dir: "left", move: "still", talk: ["「一日、岩を掘ったあとの湯は、たまらんぞ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.magane_shop = {
    name: "マガネ　道具屋",
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
      { x: 5, y: 8, to: "magane", tx: 5, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: "magane", tx: 5, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: "magane_shop_shop", look: "merchant", x: 5, y: 2, dir: "down", move: "still", shop: "magane", talk: ["「鶴嘴から傷薬まで。坑夫の村の店だよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.magane_r2 = {
    name: "マガネ　鍛冶小屋",
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
      { x: 5, y: 8, to: "magane", tx: 19, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: "magane", tx: 19, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: "magane_r2_smith", look: "dwarf", x: 4, y: 5, dir: "right", move: "still", talk: ["「炉ヶ岳の工房ほどじゃないが、鍬や鎌なら、ここで打つ」", "「刃物は、研いでやると長持ちする。人と同じだ」"] },
    ],
    chests: [],
    signs: [],
  };
})();
