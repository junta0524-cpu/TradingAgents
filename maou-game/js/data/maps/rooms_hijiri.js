// このファイルの役目：聖の森の集落の建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hijiri_inn = {
    name: '聖の森の宿',
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
      { x: 5, y: 8, to: 'hijiri_village', tx: 5, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_village', tx: 5, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: 'inn', look: 'elf', x: 5, y: 2, dir: 'down', move: 'still', inn: true, talk: ['……。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hijiri_shop = {
    name: '聖の森の道具屋',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]]]__]]]] ',
      ' __CCCCCC__ ',
      ' __________ ',
      ' }_______o_ ',
      ' }_______o_ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'hijiri_village', tx: 23, ty: 5, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_village', tx: 23, ty: 5, dir: 'down' },
    ],
    npcs: [
      { id: 'shop', look: 'elf2', x: 5, y: 2, dir: 'down', move: 'still', shop: 'hijiri',
        talk: ['取引は、ただ、そこにあるだけだ。'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hijiri_r1 = {
    name: '聖の森　木の洞の家',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' ]]]___}_[_ ',
      ' ________[_ ',
      ' _kk____kk_ ',
      ' __________ ',
      ' *****_____ ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'hijiri_village', tx: 5, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_village', tx: 5, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: 'hijiri_r1_p1', look: 'elf', x: 8, y: 5, dir: 'left', move: 'still', talk: ["エルフは、こちらを一度だけ見て、また手元の木の器に目を落とした。"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hijiri_r2 = {
    name: '聖の森　木の洞の家',
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
      { x: 5, y: 8, to: 'hijiri_village', tx: 21, ty: 11, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_village', tx: 21, ty: 11, dir: 'down' },
    ],
    npcs: [
      { id: 'hijiri_r2_p1', look: 'elf2', x: 2, y: 4, dir: 'right', move: 'still', talk: ["「……」", "何も言わず、ただ静かに壁際へ寄って、道を空けた。"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.hijiri_r3 = {
    name: '聖の森　端の小さな家',
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
      { x: 5, y: 8, to: 'hijiri_village', tx: 26, ty: 12, dir: 'down' },
      { x: 6, y: 8, to: 'hijiri_village', tx: 26, ty: 12, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [{ id: 'room', x: 1, y: 7, item: 'kizugusuri' }],
    signs: [],
    // 壁を調べると読める
    spots: [{ x: 3, y: 1, text: '壁に、よく手入れされた弓の弦が、何本も掛けてある。' }],
  };

})();
