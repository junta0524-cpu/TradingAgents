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
      groups: [['dog'], ['dog', 'dog'], ['dog', 'dog', 'dog'], ['boar'], ['centipede'], ['dog', 'centipede'], ['moth', 'dog'], ['fox'], ['dog', 'dog', 'dog', 'dog']],
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
      '-...................-..................T',
      'T...................-..................T',
      'T~~~~~~~~~~~~~~~~~~~=~~~~~~~~~~~~~~~~~~T',
      'T...................-..................T',
      'T...................-............mmmm..T',
      'T...................-.,,,,,,.....mmmm..T',
      'T..TTTTTT...........-.,,,,,,...........T',
      'T..T.T..T...........-.,,,,,,...........T',
      'T..T穴...T..,,,,,....-.,,,,,,...TTTTTT..T',
      'T..T....T..,,,,,....-..........TTTTTT..T',
      'T..T....T..,,,,,....-..........TTTTTT..T',
      'T..TTTT.T......F....-..........TTTTTT..T',
      'T...................----------.TTTTTT..T',
      'T............................-----------',
      'T......................................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [
      // 西の端：人間界のフィールドへ,
      { x: 0, y: 14, to: 'world_ningen', tx: 15, ty: 13, dir: 'left' },
      { x: 20, y: 2, to: 'minamo', tx: 15, ty: 22, dir: 'up' },
      // 東の端：ひなた野へ（4章で届け物を受けてから）
      { x: 39, y: 27, to: 'hinatano', tx: 1, ty: 8, dir: 'right', requires: { if: 'ch4_guild' }, blockedText: '（ひなた野への道。ギルドで届け物の依頼を受けてから行こう）' },
    ],
    // 4章：ひなた野への荒れ地で、野犬に出会う（オオナムチが堅め・癒やしを覚える）
    triggers: [29, 30, 31, 32, 33, 34, 35, 36, 37, 38].map(x => ({ x, y: 27, event: 'ch4_dogs', chapter: 4, if: 'ch4_guild', unless: 'ch4_dogs' })),
    npcs: [],
    fillCh: '.',   // 岩で埋めた穴は草地になる
    // しかけ（js/systems/gimmick.js）：南西の木立の奥。岩を穴へ押し込むと、宝箱へ届く
    gimmicks: [
      {'type': 'boulder', 'id': 'grove_rock', 'x': 6, 'y': 22},
    ],
    chests: [
      {'id': 'stones', 'x': 4, 'y': 21, 'item': 'mamori_ishi'},
      { id: 'grove', x: 9, y: 9, copper: 30 },
      { id: 'riverside', x: 35, y: 15, item: 'kizugusuri' },
    ],
    signs: [
      {'x': 8, 'y': 26, 'text': '木立の奥に、大きな岩が見える。押せば動きそうだ。'},
      { x: 21, y: 4, text: '北　港町ミナモ' },
      { x: 30, y: 26, text: '東　ひなた野' },
    ],
  };
})();
