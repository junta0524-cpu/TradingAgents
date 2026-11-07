// このファイルの役目：マップ「大穴の最深部」のデータ（クリア後）。強い敵が出る。いちばん奥に「試練の扉」がある。
// 扉を調べると、天の声が問う（js/data/story/postgame.js）。クナドの案内で来られる。南西の隅の石段は、さらに下の黄泉の深淵へ。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.oana_soko = {
    name: '大穴の最深部',
    outside: '#000',
    start: { x: 12, y: 20, dir: 'up' },
    battleBg: 'night',
    tint: 'rgba(40,0,60,0.25)',
    encounter: {
      steps: [10, 18],
      groups: [['kage_oni'], ['yomi_hebi'], ['na_kui', 'na_kui'], ['kage_oni', 'na_kui'], ['yomi_hebi', 'kage_oni']],
    },
    rows: [
      'RRRRRRRRRRRRRRRRRRRRRRRRRR',
      'RzzzzzzzzzzRRRRzzzzzzzzzzR',
      'RzzzzzzzzzzR00RzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzzzzzzzzzR',
      'RzzRRRRRzzzzzzzzzRRRRRRzzR',
      'RzzRRRRRzzzzzzzzzRRRRRRzzR',
      'RzzRRRRRzzzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzRRRRRzzzzzR',
      'RzzzzzRRRRzzzzzRRRRRzzzzzR',
      'RzzzzzRRRRzzzzzRRRRRzzzzzR',
      'RzzzzzRRRRzzzzzzzzzzzzzzzR',
      'RzzzzzRRRRzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzzzzzzzzzR',
      'RzzzzzzzzzzzzzzzzzRRRRzzzR',
      'RzzRRRRRRzzzzzzzzzRRRRzzzR',
      'RzzRRRRRRzzzzzzzzzRRRRzzzR',
      'RzzzzzzzzzzzzzzzzzzzzRRRRR',
      'Rzzzzzzzzzzzzzzzzzzzz門zzzR',
      'RSzzzzzzzzzzzzzzzzzzzRzzzR',
      'RRRRRRRRRRRRzzRRRRRRRRRRRR',
    ],
    warps: [
      { x: 12, y: 21, to: 'yomi_hani', tx: 9, ty: 12, dir: 'down' },
      { x: 13, y: 21, to: 'yomi_hani', tx: 9, ty: 12, dir: 'down' },
      { x: 1, y: 20, to: 'yomi_fuchi1', tx: 12, ty: 2, dir: 'down' },   // 南西の石段：黄泉の深淵へ（クリア後の寄り道）
    ],
    flagTiles: [{ x: 21, y: 19, ch: 'z', if: 'soko_vault' }],   // レバーで開く南東の蔵
    spots: [
      { x: 12, y: 2, event: 'post_door', unless: 'ame_lit' },
      { x: 13, y: 2, event: 'post_door', unless: 'ame_lit' },
      { x: 12, y: 2, text: '扉は、静かに開いている。五つ目の窪みの光が、奥で、瞬いている。' },
      { x: 13, y: 2, text: '扉は、静かに開いている。五つ目の窪みの光が、奥で、瞬いている。' },
    ],
    npcs: [
      { id: 'kunado', look: 'kunado', x: 15, y: 3, dir: 'left', move: 'still', talk: [{ name: 'クナド', text: '「お通りください」' }] },
    ],
    // しかけ（js/systems/gimmick.js）：北東の隅のレバーで、南東の蔵の門が開く
    gimmicks: [
      {'type': 'lever', 'id': 'vault', 'x': 24, 'y': 1, 'flag': 'soko_vault', 'once': true, 'text': '岩に埋もれたレバーを倒した。遠く南のほうで、門の上がる音がした。', 'doneText': 'レバーは、倒れたままだ。'},
    ],
    chests: [
      { id: 'deep1', x: 2, y: 2, item: 'akatsuki_ken' },
      { id: 'deep2', x: 23, y: 19, copper: 500 },
    ],
    signs: [],
  };
})();
