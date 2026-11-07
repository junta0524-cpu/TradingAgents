// このファイルの役目：マップ「ミナモの道具屋」のデータ。
// 店の主人に台越しに話しかけると、お店が開く（品ぞろえは js/data/shops.js）。セリフは仮。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo_shop = {
    name: 'ミナモの道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' __________ ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' k________k ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'minamo', tx: 25, ty: 16, dir: 'down' },
      { x: 6, y: 8, to: 'minamo', tx: 25, ty: 16, dir: 'down' },
    ],
    npcs: [
      { id: 'shopkeeper', look: 'merchant', x: 5, y: 2, dir: 'down', move: 'still', shop: 'minamo',
        talk: ['（仮）いらっしゃい。港に着いたばかりの品もあるよ。'] },
    ],
    chests: [],
    signs: [],
  };
})();
