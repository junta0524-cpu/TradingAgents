// このファイルの役目：寄り道クエスト（グループB：四・五〜七・五章）のための新しいマップ。
// ほかのマップと同じ書き方（rows・npcs・warps など）。うろの家（五・五章）は、森の奥の洞窟の壁の根の穴から入る（js/data/sidequests/ch05_5.js）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  // 五・五章：森の語り部ユズリハの、うろの家（倒れかけた古木の根もと。落ち葉の床と古い紙の棚）
  G.DATA.maps.hijiri_uro = {
    name: 'うろの家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    tint: 'rgba(30,20,0,0.25)',
    rows: [
      ' UUUUUUUUUU ',
      ' UUUUUUUUUU ',
      ' ||+****+|| ',
      ' ++******++ ',
      ' +++****+++ ',
      ' ++++++++++ ',
      ' ++++++++++ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'hijiri_cave', tx: 14, ty: 2, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_cave', tx: 14, ty: 2, dir: 'down' },
    ],
    npcs: [
      { id: 'sq55_yuzuriha', look: 'elf2', x: 5, y: 3, dir: 'down', move: 'still', if: 'sq_ch05_5_5', unless: 'sq_ch05_5_hani', event: 'sq_ch05_5_uro' },
    ],
    chests: [],
    signs: [],
  };
})();
