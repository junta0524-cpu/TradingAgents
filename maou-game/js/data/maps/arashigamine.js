// このファイルの役目：マップ「嵐ヶ峰の演武場」のデータ。11章、スサノとの手合わせ（先読みと四すくみ）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.arashigamine = {
    name: '嵐ヶ峰の演武場',
    outside: '#2a1014',
    start: { x: 8, y: 10, dir: 'up' },
    tint: 'rgba(120,0,0,0.12)',
    rows: [
      'mmmmmmmmggmmmmmmmm',
      'mggggggggggggggggm',
      'mggggggggggggggggm',
      'mgggRggggggggRgggm',
      'mggggggggggggggggm',
      'mggggggggggggggggm',
      'mggggggggggggggggm',
      'mggggggggggggggggm',
      'mgggRggggggggRgggm',
      'mggggggggggggggggm',
      'mggggggggggggggggm',
      'mmmmmmmmggmmmmmmmm',
    ],
    warps: [
      // クリア後：北の口はツクヨミの社へ
      { x: 8, y: 0, to: 'tsukuyomi_yashiro', tx: 10, ty: 14, dir: 'up', requires: { chapter: 13 }, blockedText: '岩の奥に、細い道が続いている。' },
      { x: 9, y: 0, to: 'tsukuyomi_yashiro', tx: 11, ty: 14, dir: 'up', requires: { chapter: 13 }, blockedText: '岩の奥に、細い道が続いている。' },
      { x: 8, y: 11, to: 'yomi_market', tx: 22, ty: 9, dir: 'left' },
      { x: 9, y: 11, to: 'yomi_market', tx: 22, ty: 10, dir: 'left' },
    ],
    npcs: [
      { id: 'susa13', look: 'susano', x: 8, y: 4, dir: 'down', move: 'still', chapter: 13,
        talk: [{ name: 'スサノ', text: '「やるじゃねえか。獣の速さは、読まれると、脆い」' }, '（北の岩の奥に、ツクヨミの社へ続く道がある）'] },
      { id: 'susa', look: 'susano', x: 8, y: 4, dir: 'down', move: 'still', chapter: 11, event: 'ch11_susa', doneFlag: 'train_susa',
        talk: [{ name: 'スサノ', text: '「やるじゃねえか。獣の速さは、読まれると、脆い」' }] },
    ],
    chests: [],
    signs: [],
  };
})();
