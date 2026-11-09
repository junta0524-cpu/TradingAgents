// このファイルの役目：ひなた野の建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hinatano_r1 = {
    name: 'ひなた野　農家',
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
      { x: 5, y: 8, to: 'hinatano', tx: 4, ty: 3, dir: 'down' },
      { x: 6, y: 8, to: 'hinatano', tx: 4, ty: 3, dir: 'down' },
    ],
    npcs: [
      { id: 'hinatano_r1_p1', look: 'villager', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「今年の芋は、粒がそろっていい」", "「冬を越す分は、もう蔵に入れたよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hinatano_r2 = {
    name: 'ひなた野　機織りの家',
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
      { x: 5, y: 8, to: 'hinatano', tx: 12, ty: 3, dir: 'down' },
      { x: 6, y: 8, to: 'hinatano', tx: 12, ty: 3, dir: 'down' },
    ],
    npcs: [
      { id: 'hinatano_r2_p1', look: 'oldwoman', x: 3, y: 5, dir: 'right', move: 'still', talk: ["「糸はね、急ぐと切れるのさ」", "「ゆっくりでいい。布は、ちゃんと仕上がる」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hinatano_r3 = {
    name: 'ひなた野　若い夫婦の家',
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
      { x: 5, y: 8, to: 'hinatano', tx: 20, ty: 3, dir: 'down' },
      { x: 6, y: 8, to: 'hinatano', tx: 20, ty: 3, dir: 'down' },
    ],
    npcs: [
      { id: 'hinatano_r3_p1', look: 'villager', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「丘の陰だから、ここは風が弱いんだ」"] },
      { id: 'hinatano_r3_p2', look: 'child', x: 2, y: 6, dir: 'right', move: 'still', talk: ["「きょうね、ひよこが三羽うまれたの」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hinatano_r4 = {
    name: 'ひなた野　母子の家',
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
      { x: 5, y: 8, to: 'hinatano', tx: 19, ty: 9, dir: 'down' },
      { x: 6, y: 8, to: 'hinatano', tx: 19, ty: 9, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [{ id: 'room', x: 1, y: 7, item: 'hoshiii' }],
    signs: [],
  };

  G.DATA.maps.hinatano_r5 = {
    name: 'ひなた野　物置',
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
      { x: 5, y: 8, to: 'hinatano', tx: 4, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'hinatano', tx: 4, ty: 12, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [{ id: 'room', x: 2, y: 5, item: 'dokukeshi' }],
    signs: [],
  };

})();
