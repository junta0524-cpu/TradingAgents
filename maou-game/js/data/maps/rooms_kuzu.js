// このファイルの役目：葛の里の建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.kuzu_inn = {
    name: '葛の里の宿',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]++++++]] ',
      ' ++CCCCCC++ ',
      ' ++++++++++ ',
      ' [++++++++[ ',
      ' [++++++++[ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 4, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 4, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'inn', look: 'villager', x: 5, y: 2, dir: 'down', move: 'still', inn: true, talk: ['……。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_shop = {
    name: '葛の里の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]]]++]]]] ',
      ' ++CCCCCC++ ',
      ' ++++++++++ ',
      ' }+++++++o+ ',
      ' }+++++++o+ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 11, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 11, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'shop', look: 'kid_tail', x: 5, y: 2, dir: 'down', move: 'still', shop: 'kuzu', talk: ['……。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_r1 = {
    name: '葛の里　粉挽きの家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]++{}++[+ ',
      ' ++++++++[+ ',
      ' ++kk++++++ ',
      ' ++kk++++++ ',
      ' ++++++++++ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 19, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 19, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'kuzu_r1_p1', look: 'villager', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「近ごろは、日が落ちる前に戸を閉めるようになった」", "「何事もなければ、それでいいんだけどね」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_r2 = {
    name: '葛の里　薬草干しの家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]]+++}+[+ ',
      ' ++++++++[+ ',
      ' +kk++++kk+ ',
      ' ++++++++++ ',
      ' *****+++++ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 5, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 5, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: 'kuzu_r2_p1', look: 'oldwoman', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「干した薬草はね、湿らせちゃいけないよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_r3 = {
    name: '葛の里　猟師の家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]++{}++[+ ',
      ' ++++++++[+ ',
      ' ++kk++++++ ',
      ' ++kk++++++ ',
      ' ++++++++++ ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 17, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 17, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: 'kuzu_r3_p1', look: 'villager', x: 2, y: 5, dir: 'right', move: 'still', talk: ["「獣ノ原の獣も、このところ気が立ってる」", "「里の外へ出るなら、気をつけな」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_r4 = {
    name: '葛の里　子だくさんの家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' +}+++++[[+ ',
      ' +++++++[[+ ',
      ' ++*****+++ ',
      ' ++*****+++ ',
      ' o++++++++} ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 5, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 5, ty: 12, dir: 'down' },
    ],
    npcs: [
      { id: 'kuzu_r4_p1', look: 'kid_tail', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「きょうはね、お手伝いで水を三回くんだよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.kuzu_r5 = {
    name: '葛の里　物置',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' oooo++oooo ',
      ' o++++++++o ',
      ' ++}}++}}++ ',
      ' ++++++++++ ',
      ' oo++++++oo ',
      ' ++++++++++ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'kuzu_village', tx: 17, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'kuzu_village', tx: 17, ty: 12, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [{ id: 'room', x: 2, y: 5, item: 'hoshiii' }],
    signs: [],
  };

})();
