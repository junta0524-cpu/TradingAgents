// このファイルの役目：マップ「クシナダの館」（大樹の洞の広間）のデータ。5章で使者ミナトが来る場所。
// 1回目に入ると使者の来訪、洞窟から戻ると使者との対決（心を保つ選択と心鎮めの習得）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hijiri_hall = {
    name: 'クシナダの館',
    outside: '#000',
    start: { x: 8, y: 8, dir: 'up' },
    detection: 1,
    rows: [
      ' IIIIIIIIIIIIIIII ',
      ' IIIIIIIQQIIIIIII ',
      ' ______cccc______ ',
      ' ______cccc______ ',
      ' __k____cc____k__ ',
      ' _______cc_______ ',
      ' _______cc_______ ',
      ' _______cc_______ ',
      ' _______cc_______ ',
      '        EE        ',
    ],
    warps: [
      { x: 8, y: 9, to: 'hijiri_village', tx: 14, ty: 3, dir: 'down' },
      { x: 9, y: 9, to: 'hijiri_village', tx: 14, ty: 3, dir: 'down' },
    ],
    onEnter: [
      { event: 'ch5_hall', chapter: 5, if: 'ch5_konoha', unless: 'ch5_hall' },
      { event: 'ch5_minato', chapter: 5, if: 'ch5_cave', unless: 'ch5_minato' },
    ],
    npcs: [
      { id: 'kushinada', look: 'kushinada', x: 8, y: 2, dir: 'down', move: 'still',
        talk: [{ name: 'クシナダ', text: '「ですが、中立とは、何もしないことではない。助けを求める者を、拒まないことです。この森は、今後も、そうあります」' }] },
      { id: 'minato', look: 'minato', x: 9, y: 5, dir: 'up', move: 'still', chapter: 5, if: 'ch5_konoha', unless: 'ch5_minato' },
      { id: 'attend_a', look: 'elf', x: 3, y: 3, dir: 'right', move: 'still', talk: ['……。'] },
      { id: 'attend_b', look: 'elf2', x: 14, y: 3, dir: 'left', move: 'still', talk: ['……。'] },
    ],
    chests: [],
    signs: [],
  };
})();
