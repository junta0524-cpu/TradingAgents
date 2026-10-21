// このファイルの役目：寄り道クエスト（グループA：一・五・二・五・三・五・四天王編）のための新しいマップ。
// 根の洲の丘陵 nenosu／嵐ヶ峰の北の斜面 sq_mine／宮の厨 yomi_kuriya と牢 sq_rou／比良坂の光の道 hirasaka_michi／比良坂からミナモへの街道 kaidou。
// どれもクエストの場面（goto）か、クエストのあいだだけ開く戸から入る。出るのもクエストの場面から（人・調べる所は js/data/sidequests/ の G.sq.add）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  G.DATA.maps = G.DATA.maps || {};
  const RED = 'rgba(120,0,0,0.12)';   // 魔界は赤みがかった色

  // ---- 根の洲の丘陵（一・五章のミカヅチ、二・五章のヒサメ）。西は丘と稜線、東は焼けた村 ----
  G.DATA.maps.nenosu = {
    name: '根の洲の丘陵',
    outside: '#1a0c0c',
    start: { x: 8, y: 2, dir: 'down' },
    // 燃える村（一・五章の五）／夜（五の終わり・八）／火の消えた黒い土（二・五章）
    tint: () => G.flags.get('sq_nenosu_fire') ? 'rgba(230,90,20,0.28)'
      : G.flags.get('sq_nenosu_night') ? 'rgba(10,10,50,0.45)' : 'rgba(60,40,40,0.22)',
    battleBg: 'wild',
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
      'mmmmmmm!!!!!mmmmmmmmmmmmmmmmmm',
      'mmmmm!!!!!!!!!mmmmmmmmmmmmmmmm',
      'mmmm!!!t!!!!!!!mmmmmeeeeeeeeem',
      'mmm!!!!!!!!t!!!!!!eeeAAeeAAeem',
      'mm!!!t!!!!!!!!!!!!eeeAAeeAAeem',
      'm!!!!!!!!!!!!!!!!!eeeeeeeeeeem',
      'm!!!!!!!!!!!!!!!!!eeeeeeweeeem',
      'm!!t!!!!!!!!!!!!!!eeeeeeeeeeem',
      '!!!!!!!!!!!!!!!!!!eeAAeee穴穴穴em',
      '!!!!!!!!t!!!!!!!!!eeAAeeeeeeem',
      'm!!!!!!!!!!!!!!!!!eeeeeeeeeeem',
      'm!!!!t!!!!!!!!!!!!!eeeeeeeeeem',
      'mm!!!!!!!!!!!!t!!!!!!!!!!!!!!m',
      'mmm!!!!!!!!!!!!!!!!!!!!!!!!!!m',
      'mmmmm!!!!!!t!!!!!!!!!!!t!!!!mm',
      'mmmmmmmmmmmmmmmmmmmmmmmmmmmmmm',
    ],
    warps: [],
    npcs: [],
    chests: [],
    signs: [],
  };

  // ---- 嵐ヶ峰の北の斜面（一・五章のスサノ。夜の峰道を北東へ）----
  G.DATA.maps.sq_mine = {
    name: '嵐ヶ峰の北の斜面',
    outside: '#0c0c18',
    start: { x: 2, y: 10, dir: 'right' },
    tint: 'rgba(10,10,60,0.42)',
    battleBg: 'night',
    rows: [
      'mmmmmmmmmmmmmmmmmmmmmmmmmm',
      'mmmmmmmmmmmmmmmmmmmRRRRmmm',
      'mmmmmmmmmmmmmmmmm&&&&&&Rmm',
      'mmmmmmmmmmmmmmm&&&&&&&&&mm',
      'mmmmmmmmmmmm&&&&&&R&&&mmmm',
      'mmmmmmmmm&&&&&&&&&&&&mmmmm',
      'mmmmmmm&&&&&R&&&&&&mmmmmmm',
      'mmmmm&&&&&&&&&&&&mmmmmmmmm',
      'mmm&&&&&R&&&&&&mmmmmmmmmmm',
      'mm&&&&&&&&&&&mmmmmmmmmmmmm',
      'm&&&&&&&&&&mmmmmmmmmmmmmmm',
      'mmmmmmmmmmmmmmmmmmmmmmmmmm',
    ],
    warps: [],
    npcs: [],
    chests: [],
    signs: [],
  };

  // ---- 黄泉津の宮　厨（牢番の詰め所。二・五章）。上の戸は牢、下の敷物は王の広間の西の壁の戸へ ----
  G.DATA.maps.yomi_kuriya = {
    name: '黄泉津の宮　厨',
    outside: '#000',
    start: { x: 5, y: 7, dir: 'up' },
    tint: RED,
    rows: [
      ' GGGGGGGGGG ',
      ' GGGGGGGGGG ',
      ' {{ff]]ff}H ',
      ' ffffffffff ',
      ' fkkfffffff ',
      ' ffffffffff ',
      ' ffffffkfff ',
      ' ffffffffff ',
      '     EE     ',
    ],
    warps: [
      { x: 10, y: 2, to: 'sq_rou', tx: 12, ty: 5, dir: 'left' },
      { x: 5, y: 8, to: 'yomi_palace', tx: 1, ty: 9, dir: 'right' },
      { x: 6, y: 8, to: 'yomi_palace', tx: 1, ty: 9, dir: 'right' },
    ],
    npcs: [],
    chests: [],
    signs: [],
  };

  // ---- 黄泉津の宮　牢（二・五章。左の牢に勇者、右の牢に五人。右の戸は厨へ）----
  G.DATA.maps.sq_rou = {
    name: '黄泉津の宮　牢',
    outside: '#000',
    start: { x: 12, y: 5, dir: 'left' },
    tint: RED,
    rows: [
      'GGGGGGGGGGGGGG',
      'GffffGGffffGGG',
      'GffffGGffffGGG',
      'GbbbbGGbbbbGGG',
      'GffffffffffffG',
      'GffffffffffffH',
      'GffffffffffffG',
      'GGGGGGGGGGGGGG',
    ],
    warps: [
      { x: 13, y: 5, to: 'yomi_kuriya', tx: 10, ty: 3, dir: 'down' },
    ],
    npcs: [],
    chests: [],
    signs: [],
  };

  // ---- 比良坂の光の道（三・五章。大穴の縁から、光の筋の道を折り返して下りる。敵なし）----
  G.DATA.maps.hirasaka_michi = {
    name: '比良坂の大穴　光の道',
    outside: '#04040a',
    start: { x: 1, y: 1, dir: 'right' },
    tint: 'rgba(0,0,30,0.25)',
    rows: [
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
      '黒闇闇闇台台台台台台台台台台台黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒台黒',
      '黒台台台台台台台台台台台台台台黒',
      '黒台黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
      '黒台台台台台台台台台台台台台台黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒台黒',
      '黒台台台台台台台台台台台台台台黒',
      '黒台黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
      '黒台台台台台台台台台台台台台台黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒台黒',
      '黒闇闇闇闇闇闇闇闇闇闇闇闇闇台黒',
      '黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒黒',
    ],
    warps: [],
    npcs: [],
    chests: [],
    signs: [],
  };

  // ---- 比良坂からミナモへの街道（三・五章）。西から：林・小さな宿場（茶屋・宿・井戸）・分かれ道・ミナモの見える丘 ----
  G.DATA.maps.kaidou = {
    name: 'ミナモへの街道',
    outside: '#0a140a',
    start: { x: 1, y: 8, dir: 'right' },
    // 夕暮れ／夜／朝（三・五章の場面のフラグ sq_ch03_5_dusk／sq_ch03_5_night で変わる）
    tint: () => G.flags.get('sq_ch03_5_night') ? 'rgba(10,10,60,0.45)'
      : G.flags.get('sq_ch03_5_dusk') ? 'rgba(220,100,30,0.22)' : null,
    battleBg: 'field',
    encounter: {
      steps: [16, 28],
      groups: [['dog'], ['dog', 'dog'], ['moth', 'dog'], ['fox']],
    },
    rows: [
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
      'T......TTTTTTTTTTTT.^^^^^..^^^^^..T.R..T',
      'T......TTT.....TTTT.#dW##..##dW#..T.-..T',
      'T,.....TTT.....TTTT..............,T.-..T',
      'T......TTT..i..TTTT...............T.-..T',
      'T,.....TTT.....TTTT.......,.......T.-..T',
      'T......TTTTT.TTTTTT...............T.-..T',
      'T............................,......-..T',
      '----------------------------------------',
      'T.......,,,,.................,.........T',
      'T......,,,,,,......^^^^^.^^^^^.........T',
      'T.......,,,,.......#dW##.##dW#.....i...T',
      'T........................w.............T',
      'T,,,...................................T',
      'T.....,,,..............................T',
      'TTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTT',
    ],
    warps: [],
    npcs: [],
    chests: [],
    signs: [],
  };
})();
