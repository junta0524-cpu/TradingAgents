// このファイルの役目：マップ「ミナモの宿屋」のデータ。
// 宿の主人に台越しに話しかけると、泊まれる（js/systems/shop.js の inn）。セリフは仮。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo_inn = {
    name: 'ミナモの宿屋',
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
      { x: 5, y: 8, to: 'minamo', tx: 4, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: 'minamo', tx: 4, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: 'innkeeper', look: 'elder', x: 5, y: 2, dir: 'down', move: 'still', inn: true,
        talk: ['（仮）いらっしゃい。旅の疲れは、ここで落としていきな。'] },
    ],
    chests: [],
    signs: [],
  };
})();
