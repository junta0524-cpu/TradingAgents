// このファイルの役目：マップ「黄泉の深淵　上の淵」のデータ（クリア後の寄り道。大穴の最深部の南西の石段から）。暗闇と燭台・穴を岩で埋める通路・焼けた岩の部屋のレバー。
// 東の部屋のレバーで南の門が開き、その先の石段を黄泉の大蛇（番人）が守る。西の小部屋の宝箱に、下の階の蔵の鍵（深淵の鍵）。
// しかけ（gimmicks）の動きは js/systems/gimmick.js。解き方の確かめは tools/dungeons.js。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.yomi_fuchi1 = {
    name: '黄泉の深淵　上の淵',
    outside: '#000',
    start: { x: 12, y: 2, dir: 'down' },
    battleBg: 'night',
    bgm: 'abyss',
    dark: true,
    encounter: { steps: [12, 20], groups: [['kage_oni', 'kage_oni'], ['yomi_hebi', 'na_kui', 'na_kui'], ['kage_oni', 'yomi_hebi'], ['na_kui', 'na_kui', 'na_kui']] },
    rows: [
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
      '黒闇闇闇闇闇黒黒黒闇闇闇S闇闇闇黒黒闇闇闇闇闇黒',
      '黒闇闇闇闇闇黒黒黒闇闇闇闇闇闇闇黒黒熱熱熱闇闇黒',
      '黒闇闇闇闇闇闇穴闇闇闇闇闇闇闇闇闇闇闇闇熱熱闇黒',
      '黒闇闇闇闇闇黒黒黒闇闇闇闇闇闇闇黒黒熱熱熱闇闇黒',
      '黒闇闇闇闇闇黒黒黒黒黒黒闇黒黒黒黒黒闇闇闇闇闇黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒',
      '黒黒黒闇闇闇闇闇闇黒闇闇闇闇闇闇闇闇闇闇闇黒黒黒',
      '黒黒黒闇闇闇黒闇闇闇闇闇闇闇闇闇闇黒闇闇闇黒黒黒',
      '黒黒黒闇闇闇闇闇闇闇闇闇闇闇黒闇闇闇闇闇闇黒黒黒',
      '黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒門黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒S黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
    ],
    flagTiles: [
      { x: 12, y: 15, ch: '闇', if: 'gm:yomi_fuchi1:lever' },   // 東の部屋のレバーで開く南の門
    ],
    warps: [
      { x: 12, y: 1, to: 'oana_soko', tx: 2, ty: 20, dir: 'right' },
      { x: 12, y: 16, to: 'yomi_fuchi2', tx: 12, ty: 16, dir: 'up' },
    ],
    gimmicks: [
      { type: 'boulder', id: 'b1', x: 9, y: 3 },
      { type: 'lever', id: 'lever', x: 22, y: 1, once: true, text: '焼けた岩の奥のレバーを倒した。遠く南のほうで、門の上がる音がした。', doneText: 'レバーは、もう動かない。' },
      { type: 'guardian', id: 'nushi', rec: 75, x: 12, y: 16, enemies: ['orochi'], reward: 'yashiori_kame', text: '石段の前で、何かがとぐろを巻いている。いくつもの脚が、闇の中でざわめいた。', win: '黄泉の大蛇は、闇の底へ沈むように消えた。' },
      { type: 'torch', id: 't1', x: 9, y: 1 },
      { type: 'torch', id: 't2', x: 15, y: 1 },
      { type: 'torch', id: 't3', x: 3, y: 8 },
      { type: 'torch', id: 't4', x: 20, y: 8 },
      { type: 'torch', id: 't5', x: 1, y: 5 },
    ],
    chests: [
      { id: 'key', x: 1, y: 1, item: 'fuchi_kagi' },
      { id: 'hall', x: 3, y: 12, item: 'inochi_ishi' },
      { id: 'east', x: 22, y: 5, copper: 1500 },
    ],
    signs: [
      { x: 10, y: 4, text: '石碑がある。\n「這う者は、焼けた岩の奥の鍵を恐れる。門は、そこから開く」' },
    ],
    spots: [],
    npcs: [],
  };
})();
