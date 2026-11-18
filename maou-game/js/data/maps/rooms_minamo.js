// このファイルの役目：港町ミナモの建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.minamo_r1 = {
    name: 'ミナモ　網元の家',
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
      { x: 5, y: 8, to: 'minamo', tx: 23, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: 'minamo', tx: 23, ty: 9, dir: 'down' },
    ],
    npcs: [
      { id: 'minamo_r1_p1', look: 'villager', x: 8, y: 4, dir: 'left', move: 'still', talk: ["「網の繕いは、夜のうちに済ませておくんだ」", "「港の朝は、早いからね」"] },
    ],
    chests: [{ id: 'room', x: 1, y: 7, item: 'kizugusuri' }],
    signs: [],
  };

  G.DATA.maps.minamo_r2 = {
    name: 'ミナモ　隠居の家',
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
      { x: 5, y: 8, to: 'minamo', tx: 6, ty: 16, dir: 'down' },
      { x: 6, y: 8, to: 'minamo', tx: 6, ty: 16, dir: 'down' },
    ],
    npcs: [
      { id: 'minamo_r2_p1', look: 'elder', x: 8, y: 4, dir: 'left', move: 'still', talk: ["「若いころは、わしも船に乗っておった」", "「今は、こうして波の音を聞くだけじゃ」"] },
    ],
    chests: [],
    signs: [],
  };

})();
