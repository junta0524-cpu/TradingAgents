// このファイルの役目：マップ「森の奥の洞窟」のデータ。5章で、エルフの結界の中に匿われた魔族たちがいる。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  const HIDDEN = { move: 'still', chapter: 5, unless: 'ch5_done' };
  G.DATA.maps.hijiri_cave = {
    name: '森の奥の洞窟',
    outside: '#000',
    start: { x: 8, y: 6, dir: 'up' },
    rows: [
      'RRRRRRRRRRRRRRRRRR',
      'RzzzzzzzzzzzzzzzzR',
      'RzllzzllzzzllzzllR',
      'RzzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzR',
      'RRRRRRRzzzzRRRRRRR',
      'RRRRRRRRzzRRRRRRRR',
      '        OO        ',
    ],
    warps: [
      { x: 8, y: 7, to: 'hijiri_path', tx: 27, ty: 6, dir: 'left' },
      { x: 9, y: 7, to: 'hijiri_path', tx: 27, ty: 6, dir: 'left' },
    ],
    onEnter: [{ event: 'ch5_cave', chapter: 5, if: 'ch5_hall', unless: 'ch5_cave' }],
    npcs: [
      Object.assign({ id: 'oni1', look: 'oni', x: 2, y: 3, dir: 'down', talk: ['警戒の目。怯えの目。'] }, HIDDEN),
      Object.assign({ id: 'crowwoman', look: 'crow', x: 9, y: 3, dir: 'down',
        talk: [{ name: '鴉族の女', text: '「ここの方々が、よくしてくださっています」' }] }, HIDDEN),
      Object.assign({ id: 'wolf1', look: 'wolfkid', x: 13, y: 4, dir: 'left', talk: ['傷に包帯を巻かれ、疲れ切った顔で、息を潜めている。'] }, HIDDEN),
      Object.assign({ id: 'oni2', look: 'oni', x: 15, y: 3, dir: 'down', talk: ['……。'] }, HIDDEN),
    ],
    chests: [],
    signs: [],
  };
})();
