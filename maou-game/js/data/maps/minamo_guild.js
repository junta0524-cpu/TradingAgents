// このファイルの役目：マップ「ミナモのギルド（建物の中）」のデータ。
// 受付は台の向こうにいるが、台越しに話しかけられる。セリフは仮。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo_guild = {
    name: '冒険者ギルド',
    outside: '#000',
    start: { x: 7, y: 9, dir: 'up' },
    rows: [
      ' IIIIIIIIIIIIII ',
      ' IIIIIIIIIIIIII ',
      ' ______________ ',
      ' __CCCCCCCCCC__ ',
      ' ______________ ',
      ' ______________ ',
      ' __k________k__ ',
      ' ______________ ',
      ' ______________ ',
      ' ______________ ',
      '       EE       ',
    ],
    warps: [
      { x: 7, y: 10, to: 'minamo', tx: 13, ty: 9, dir: 'down' },
      { x: 8, y: 10, to: 'minamo', tx: 14, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: 'clerk', look: 'clerk', x: 7, y: 2, dir: 'down', move: 'still',
        talk: ['（仮）ようこそ、冒険者ギルドへ。', '（仮）登録はこちらで受け付けています。依頼の掲示は、もう少しお待ちください。'] },
      { id: 'adventurer', look: 'guard', x: 12, y: 7, dir: 'left', move: 'wander',
        talk: ['（仮）新顔か。ここじゃ腕より、まず信用だぜ。'] },
    ],
    chests: [
      { id: 'corner', x: 2, y: 8, item: 'hoshiii' },
    ],
    signs: [],
  };
})();
