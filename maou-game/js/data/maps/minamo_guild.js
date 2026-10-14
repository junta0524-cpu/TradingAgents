// このファイルの役目：マップ「ミナモのギルド（建物の中）」のデータ。
// 受付は台の向こうにいるが、台越しに話しかけられる。セリフは仮。
// 奥の壁の掲示板で寄り道の依頼を受け（5章から）、受付に話すと済んだ依頼を報告できる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo_guild = {
    name: '冒険者ギルド',
    outside: '#000',
    start: { x: 7, y: 9, dir: 'up' },
    detection: 1,
    // 4章：初めて入ると、オオナムチとの出会いの場面
    onEnter: [{ event: 'ch4_guild', chapter: 4, unless: 'ch4_guild' }],
    // 依頼の掲示板（奥の壁）
    spots: [
      { x: 12, y: 1, text: '一枚だけ、何日も残っている紙があった。端が黄ばんで、角が丸まっている。\n『ひなた野への届け物。薬と日用品。報酬、銅貨十枚』', chapter: 4, unless: 'ch4_guild' },
      // 5章から：寄り道の依頼を受けられる（js/data/requests.js。画面は js/scenes/requestboard.js）
      { x: 12, y: 1, board: true, chapterFrom: 5 },
      { x: 12, y: 1, text: '人気の討伐依頼や護衛の仕事は、朝のうちに剥がされる。残るのは、報酬の安い、手間のかかる依頼だけだ。' },
    ],
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
        talk: [{ name: '受付の女', text: '「次の方」' }], requestDesk: true },   // 話すと、済んだ寄り道の依頼を報告する
      { id: 'oonamuchi', look: 'oonamuchi', x: 5, y: 4, dir: 'up', move: 'still', chapter: 4, unless: 'ch4_guild' },
      { id: 'adventurer', look: 'guard', x: 12, y: 7, dir: 'left', move: 'wander',
        talk: ['（仮）新顔か。ここじゃ腕より、まず信用だぜ。'] },
    ],
    chests: [
      { id: 'corner', x: 2, y: 8, item: 'hoshiii' },
    ],
    signs: [],
  };
})();
