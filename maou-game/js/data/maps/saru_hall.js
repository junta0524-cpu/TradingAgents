// このファイルの役目：マップ「サルタヒコの岩屋」のデータ。獣ノ原の王サルタヒコの広間（7章）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.saru_hall = {
    name: 'サルタヒコの岩屋',
    outside: '#000',
    start: { x: 7, y: 6, dir: 'up' },
    rows: [
      'RRRRRRRRRRRRRRRR',
      'RRRRRRRQRRRRRRRR',
      'RzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzR',
      'RRRRRRRzzRRRRRRR',
      '       OO       ',
    ],
    warps: [
      { x: 7, y: 7, to: 'kuzu_village', tx: 23, ty: 3, dir: 'down' },
      { x: 8, y: 7, to: 'kuzu_village', tx: 23, ty: 3, dir: 'down' },
    ],
    onEnter: [{ event: 'ch7_saru', chapter: 7, if: 'ch7_kuzu', unless: 'ch7_saru' }],
    npcs: [
      { id: 'saru', look: 'sarutahiko', x: 7, y: 2, dir: 'down', move: 'still', chapter: 7, unless: 'ch7_morning',
        talk: [{ name: 'サルタヒコ', text: '「俺たちは、誰の手下でもない。それが、獣ノ原の流儀だ」' }] },
    ],
    chests: [],
    signs: [],
  };
})();
