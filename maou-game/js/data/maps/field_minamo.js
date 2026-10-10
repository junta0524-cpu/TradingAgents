// このファイルの役目：マップ「ミナモ周辺の野原」のデータ。
// 北の町の印に乗ると、港町ミナモへ戻る。道以外を歩くと敵に出会う（草むらは出会いやすい）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.field_minamo = {
    name: 'ミナモ周辺の野原',
    outside: '#1f5a24',
    // 遭遇：steps 歩ごと（この範囲でランダム）に、groups のどれかの組が出る
    encounter: {
      steps: [14, 26],
      groups: [['dog'], ['dog', 'dog'], ['dog', 'dog', 'dog'], ['boar'], ['centipede'], ['dog', 'centipede'], ['moth', 'dog'], ['fox']],
    },
    start: { x: 20, y: 3, dir: 'down' },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~T',
      'T...................M..................T',
      'T.TTTTTTT...........-..................T',
      'T.TTTTTTT...........-.........TTTTTTTT.T',
      'T.TTTTTTT...,,,,,...-.........TTTTTTTT.T',
      'T.TTTTTTT...,,,,,...-...F.....TTTTTTTT.T',
      'T.TTTTTTT...,,,,,F..-.........TTTTTTTT.T',
      'T.TTTTTTT...........-.........TTTTTTTT.T',
      'T...................-..................T',
      'T...................-....mmmmm.........T',
      'T........mmmm.......-....mmmmm.........T',
      'T........mmmm.......-....mmmmm.........T',
      'T...................-..................T',
      'T...................-..................T',
      'T...................-..................T',
      'T~~~~~~~~~~~~~~~~~~~=~~~~~~~~~~~~~~~~~~T',
      'T...................-..................T',
      'T...................-............mmmm..T',
      'T...................-.,,,,,,.....mmmm..T',
      'T..TTTTTT...........-.,,,,,,...........T',
      'T..TTTTTT...........-.,,,,,,...........T',
      'T..TTTTTT..,,,,,....-.,,,,,,...TTTTTT..T',
      'T..TTTTTT..,,,,,....-..........TTTTTT..T',
      'T..TTTTTT..,,,,,....-..........TTTTTT..T',
      'T..TTTTTT......F....-..........TTTTTT..T',
      'T...................----------.TTTTTT..T',
      'T......................................T',
      'T......................................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      { x: 20, y: 2, to: 'minamo', tx: 15, ty: 22, dir: 'up' },
    ],
    npcs: [],
    chests: [
      { id: 'grove', x: 9, y: 9, copper: 30 },
      { id: 'riverside', x: 35, y: 15, item: 'kizugusuri' },
    ],
    signs: [
      { x: 21, y: 4, text: '北　港町ミナモ' },
      { x: 30, y: 26, text: '東　ひなた野（この先は、まだ通れない）' },
    ],
  };
})();
