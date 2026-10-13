// このファイルの役目：天津京の建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.amatsu_hall = {
    name: '円議堂',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' P_||cc||_P ',
      ' ____cc____ ',
      ' kkk_cc_kkk ',
      ' ____cc____ ',
      ' kkk_cc_kkk ',
      ' P___cc___P ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu', tx: 15, ty: 6, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu', tx: 16, ty: 6, dir: 'down' },
    ],
    npcs: [
      { id: 'amatsu_hall_p1', look: 'kanri', x: 9, y: 3, dir: 'left', move: 'still', talk: ["「議事の記録は、すべてここに納められます」", "「念のため、写しも取ってあります」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.amatsu_inn = {
    name: '天津京の宿',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]______]] ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' [________[ ',
      ' [________[ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu', tx: 4, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu', tx: 4, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: 'inn', look: 'elder', x: 5, y: 2, dir: 'down', move: 'still', inn: true, unless: 'ch8_meet', talk: ['「いらっしゃい」'] },
      { id: 'inn_wait', look: 'elder', x: 5, y: 2, dir: 'down', move: 'still', chapter: 8, if: 'ch8_meet', event: 'ch8_wait' },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.amatsu_r1 = {
    name: '天津京　白い家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]__{}__[_ ',
      ' ________[_ ',
      ' __kk______ ',
      ' __kk______ ',
      ' __________ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu', tx: 4, ty: 16, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu', tx: 4, ty: 16, dir: 'down' },
    ],
    npcs: [
      { id: 'amatsu_r1_p1', look: 'villager', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「通りの白は、毎朝みんなで磨くんです」", "「汚れていると、念のため、と言われますから」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.amatsu_r2 = {
    name: '天津京　白い家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ||||__|||| ',
      ' __________ ',
      ' __kkkk____ ',
      ' __________ ',
      ' [_______}_ ',
      ' [_________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'amatsu', tx: 26, ty: 16, dir: 'down' },
      { x: 6, y: 8, to: 'amatsu', tx: 26, ty: 16, dir: 'down' },
    ],
    npcs: [
      { id: 'amatsu_r2_p1', look: 'oldwoman', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「このごろは、夜に出歩く人もいなくなりました」", "「静かで、よいことです」"] },
    ],
    chests: [],
    signs: [],
  };

})();
