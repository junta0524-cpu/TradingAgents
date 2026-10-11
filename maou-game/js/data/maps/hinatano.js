// このファイルの役目：マップ「ひなた野」（丘の陰の小さな集落）のデータ。4章の届け物の行き先。
// 着くと届け物の場面が流れ、そのまま帰り道（夕焼け）の場面から5章へ進む。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.hinatano = {
    name: 'ひなた野',
    outside: '#1f5a24',
    start: { x: 1, y: 8, dir: 'right' },
    detection: 1,
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTT',
      'T..YYY.....YYY.....YYY.T',
      'T..#d#.....#d#.....#d#.T',
      'T......................T',
      'T..vvvv..........vvvv..T',
      'T..vvvv..........vvvv..T',
      'T......................T',
      'T.................YYY..T',
      '-.................#d#..T',
      'T......................T',
      'T..YYY.....vvvvv.......T',
      'T..#d#.....vvvvv.......T',
      'T......................T',
      'TTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 0, y: 8, to: 'field_minamo', tx: 38, ty: 27, dir: 'left' },
    ],
    onEnter: [
      { event: 'ch4_hinata', chapter: 4, if: 'ch4_dogs', unless: 'ch4_delivered' },
    ],
    npcs: [
      { id: 'granny', look: 'oldwoman', x: 9, y: 7, dir: 'left', move: 'still', chapter: 4,
        talk: [{ name: '老婆', text: '「遅いものか。ありがたい。薬が、もう切れておって」' }] },
      { id: 'hal', look: 'hal', x: 12, y: 8, dir: 'left', move: 'still', chapter: 4,
        talk: [{ name: 'ハル', text: '「兄ちゃんの字だ」' }] },
      { id: 'kid1', look: 'kid_ear', x: 5, y: 6, dir: 'down', move: 'wander', chapter: 4,
        talk: [{ name: '子ども', text: '「冒険者だ」' }] },
      { id: 'kid2', look: 'kid_tail', x: 15, y: 3, dir: 'down', move: 'wander', chapter: 4,
        talk: [{ name: '子ども', text: '「本当に来た」' }] },
      { id: 'mother', look: 'villager', x: 19, y: 9, dir: 'left', move: 'still', chapter: 4,
        talk: ['「本当に、ありがとう」'] },
    ],
    chests: [],
    signs: [],
  };
})();
