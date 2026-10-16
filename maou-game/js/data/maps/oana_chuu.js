// このファイルの役目：マップ「大穴　中層」のデータ。大穴の中層（クリア後の寄り道）。暗闇と燭台・二つの重しの床と岩・見破りで消える偽の壁・雷で砕く大岩。
// 二つの床に岩を乗せると、南の門が開いて最深部への石段へ。上層のひびの床から落ちると、ここの真ん中に落ちる。
// しかけ（gimmicks）の動きは js/systems/gimmick.js。設計と解き方の確かめは tools/check.js。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};

  G.DATA.maps.oana_chuu = {
    name: '大穴　中層',
    outside: '#000',
    start: {'x': 12, 'y': 2, 'dir': 'down'},
    battleBg: 'night',
    dark: true,
    encounter: {'steps': [12, 20], 'groups': [['kage_oni'], ['yomi_hebi', 'na_kui'], ['kage_oni', 'kage_oni'], ['yomi_hebi'], ['orochi']]},
    rows: [
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
      '黒闇闇闇闇黒闇闇闇闇闇闇S闇闇闇闇闇闇黒闇闇闇黒',
      '黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒',
      '黒闇闇闇闇黒闇闇闇闇闇闇闇闇闇闇闇闇闇黒闇闇闇黒',
      '黒闇闇闇闇黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒闇闇闇黒',
      '黒闇闇闇闇黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒闇闇闇黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒闇黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒黒',
      '黒黒黒黒闇闇闇闇闇闇黒闇闇黒闇闇闇闇闇闇黒黒黒黒',
      '黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒黒',
      '黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒黒',
      '黒黒黒黒闇闇闇闇闇闇闇黒闇闇闇闇闇闇闇闇黒黒黒黒',
      '黒黒黒黒闇闇闇闇黒闇闇闇闇闇闇闇黒闇闇闇黒黒黒黒',
      '黒黒黒黒黒闇闇闇闇闇闇闇闇闇闇闇闇闇闇黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒門黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒S黒黒黒黒黒黒黒黒黒黒黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
    ],
    flagTiles: [
      {'x': 12, 'y': 15, 'ch': '闇', 'all': ['gm:oana_chuu:p1', 'gm:oana_chuu:p2']},
    ],
    warps: [
      {'x': 12, 'y': 1, 'to': 'oana_jou', 'tx': 16, 'ty': 2, 'dir': 'down'},
      {'x': 12, 'y': 16, 'to': 'oana_soko', 'tx': 12, 'ty': 19, 'dir': 'up'},
    ],
    gimmicks: [
      {'type': 'boulder', 'id': 'b1', 'x': 9, 'y': 11},
      {'type': 'boulder', 'id': 'b2', 'x': 14, 'y': 12},
      {'type': 'plate', 'id': 'p1', 'x': 6, 'y': 9},
      {'type': 'plate', 'id': 'p2', 'x': 17, 'y': 9},
      {'type': 'seal', 'id': 'illusion', 'x': 5, 'y': 2, 'ch': '幻', 'need': 'miyaburi', 'text': '黒い岩壁だ。……ほかの壁と、どこか手ざわりがちがう気がする。', 'done': '偽りの壁が、霧のようにほどけて消えた。'},
      {'type': 'seal', 'id': 'crag', 'x': 19, 'y': 2, 'ch': '巌', 'need': 'ikazuchi', 'text': '道をふさぐ大岩だ。強い雷でも落とせば、砕けるかもしれない。', 'done': '雷が落ち、大岩は粉々に砕け散った。'},
      {'type': 'guardian', 'id': 'nushi', 'x': 12, 'y': 16, 'enemies': ['oana_nushi'], 'reward': 'nushi_shinzou', 'text': '大穴の底の闇が、ひとつの形を取った。最深部への石段を、何かが守っている。', 'win': '大穴の主は、闇の中へ溶けるように消えた。'},
      {'type': 'torch', 'id': 't1', 'x': 8, 'y': 1},
      {'type': 'torch', 'id': 't2', 'x': 16, 'y': 1},
      {'type': 'torch', 'id': 't3', 'x': 4, 'y': 9},
      {'type': 'torch', 'id': 't4', 'x': 19, 'y': 9},
      {'type': 'torch', 'id': 't5', 'x': 9, 'y': 14},
      {'type': 'torch', 'id': 't6', 'x': 15, 'y': 14},
    ],
    chests: [
      {'id': 'illusion', 'x': 1, 'y': 1, 'item': 'yomiishi_ken'},
      {'id': 'crag', 'x': 22, 'y': 5, 'item': 'akatsuki_yoroi'},
    ],
    signs: [
      {'x': 7, 'y': 2, 'text': '石碑がある。\n「二つの床に、重い岩を。岩が動かなくなったら、いちど上の階へ」'},
    ],
    spots: [],
    npcs: [],
  };
})();
