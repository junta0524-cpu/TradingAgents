// このファイルの役目：マップ「やすらぎの院　大部屋」のデータ。名を削られた人々が、窓の方を向いて座っている（9章）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const STILL = { move: 'still', chapter: 9, unless: 'ch9_temple' };
  G.DATA.maps.yasuragi_ward = {
    name: 'やすらぎの院　大部屋',
    outside: '#000',
    start: { x: 8, y: 8, dir: 'up' },
    detection: 3,
    rows: [
      ' IIIIIIIIIIIIIIII ',
      ' IIIIIIIIIIIIIIII ',
      ' ________________ ',
      ' _k__k__k__k__k__ ',
      ' ________________ ',
      ' ________________ ',
      ' _k__k__k__k__k__ ',
      ' ________________ ',
      ' ________________ ',
      '        EE        ',
    ],
    warps: [
      { x: 8, y: 9, to: 'yasuragi', tx: 6, ty: 3, dir: 'down' },
      { x: 9, y: 9, to: 'yasuragi', tx: 6, ty: 3, dir: 'down' },
    ],
    onEnter: [{ event: 'ch9_ward', chapter: 9, unless: 'ch9_ward' }],
    npcs: [
      Object.assign({ id: 'p1', look: 'elder', x: 2, y: 4, dir: 'up', talk: [{ name: '老人', text: '「ずっと、呼ばれていないから」' }] }, STILL),
      Object.assign({ id: 'p2', look: 'kanri', x: 5, y: 4, dir: 'up', talk: ['……。'] }, STILL),
      Object.assign({ id: 'p3', look: 'villager', x: 8, y: 7, dir: 'up', talk: ['……。'] }, STILL),
      Object.assign({ id: 'p4', look: 'oldwoman', x: 11, y: 4, dir: 'up', talk: ['……。'] }, STILL),
      Object.assign({ id: 'kazumi', look: 'kazumi', x: 14, y: 7, dir: 'up', talk: [{ name: '痩せた男', text: '「ヒナ……」' }] }, STILL),
    ],
    chests: [],
    signs: [],
  };
})();
