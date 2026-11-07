// このファイルの役目：炉ヶ岳　鉱山の里の建物の中（部屋）のマップ。扉から入り、下の敷物から外へ出る。
// 住む人のひとことは物語に関わらない暮らしの声（ユーザー決定：短い生活の一言を足してよい）。店と宿の主人は台の向こう。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.ro_r1 = {
    name: '鉱山の里　大工房',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' Z_]]__]]_Z ',
      ' __________ ',
      ' _kk____kk_ ',
      ' __________ ',
      ' oo______}} ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'ro_village', tx: 4, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 4, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'ro_r1_p1', look: 'dwarf', x: 3, y: 5, dir: 'right', move: 'still', talk: ["「炉の火は、毎朝ひと息で起こすんだ」", "「炉の機嫌がいい日は、槌も軽い」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ro_r2 = {
    name: '鉱山の里　鍛冶の工房',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' Z_]]__]]_Z ',
      ' __________ ',
      ' _kk____kk_ ',
      ' __________ ',
      ' oo______}} ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'ro_village', tx: 21, ty: 4, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 21, ty: 4, dir: 'down' },
    ],
    npcs: [
      { id: 'ro_r2_p1', look: 'dwarf2', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「槌の音を聞けば、腕の良し悪しは分かる」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ro_r3 = {
    name: '鉱山の里　坑夫の家',
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
      { x: 5, y: 8, to: 'ro_village', tx: 7, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 7, ty: 7, dir: 'down' },
    ],
    npcs: [
      { id: 'ro_r3_p1', look: 'dwarf', x: 8, y: 5, dir: 'left', move: 'still', talk: ["「山の奥は、昼でも夜みたいに暗い」", "「灯りを持たずに入るなよ」"] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ro_r4 = {
    name: '鉱山の里　納品の蔵',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    rows: [
      ' IIIIIIIIII ',
      ' IIIIIIIIII ',
      ' oooo__oooo ',
      ' o________o ',
      ' __}}__}}__ ',
      ' __________ ',
      ' oo______oo ',
      ' __________ ',
      '     EE     ',
    ],
    warps: [
      { x: 5, y: 8, to: 'ro_village', tx: 18, ty: 7, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 18, ty: 7, dir: 'down' },
    ],
    npcs: [
    ],
    chests: [{ id: 'room', x: 1, y: 5, item: 'kizugusuri' }],
    signs: [],
  };

  G.DATA.maps.ro_inn = {
    name: '鉱山の里の宿',
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
      { x: 5, y: 8, to: 'ro_village', tx: 5, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 5, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: 'inn', look: 'dwarf2', x: 5, y: 2, dir: 'down', move: 'still', inn: true, talk: ['「山の夜は冷える」'] },
    ],
    chests: [],
    signs: [],
  };

  G.DATA.maps.ro_shop = {
    name: '鉱山の里の道具屋',
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
      { x: 5, y: 8, to: 'ro_village', tx: 20, ty: 13, dir: 'down' },
      { x: 6, y: 8, to: 'ro_village', tx: 20, ty: 13, dir: 'down' },
    ],
    npcs: [
      { id: 'shop', look: 'dwarf', x: 5, y: 2, dir: 'down', move: 'still', shop: 'ro', talk: ['……。'] },
    ],
    chests: [],
    signs: [],
  };

})();
