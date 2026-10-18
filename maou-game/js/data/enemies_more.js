// このファイルの役目：あとから増やした敵（土地ごとの新しい敵・ダンジョンにだけ出る敵・クリア後の上位の敵・めったに出ない白兎）。書き方は js/data/enemies.js と同じ。
// 絵の型紙は、今ある敵の型紙を色を変えて使う（Gemini の絵が届いたら js/data/art.js の絵に替わる）。encounterMore：今のマップの出る敵に足す組。rares：めったに出ない敵。
// 白兎・月の兎（hard）：打撃はほとんど効かず（balance.js の RARE）、言霊は効かない。すぐ逃げる（actions の flee）。倒すと経験値が大きい。由来は古事記の因幡の白兎（大穴牟遅が助けた兎）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};
  const E = G.DATA.enemies, S = id => E[id].sprite;

  // 白兎の型紙（耳の長い小さな兎）
  const RABBIT = [
    '................',
    '....KK...KK.....',
    '...KWWK.KWWK....',
    '...KWHK.KWHK....',
    '...KWHK.KWHK....',
    '...KWHKKKWHK....',
    '..KHHHHHHHHHK...',
    '.KHHEHHHHEHHHK..',
    '.KHHHHHWHHHHHK..',
    '.KHHHHDDDHHHHK..',
    '..KHHHHHHHHHHK..',
    '..KHHHHHHHHHHHK.',
    '..KHHHHHHHHHHHK.',
    '...KHHKKKKHHKK..',
    '....KK....KK....',
    '................',
  ];
  const P = (H, D, E2, W, K) => ({ K: K || '#140e14', H, D, E: E2, W });

  Object.assign(E, {
    // ---- ミナモの南の野原（4章〜）----
    ookaeru: { name: '大蛙', hp: 14, atk: 9, def: 5, agi: 4, wis: 3, exp: 6, copper: 4, drop: { item: 'hoshiii', rank: 'C' },
      palette: P('#5a8a3a', '#3a5a24', '#f0d040', '#c8e0a0'), sprite: S('boar') },
    kobachi: { name: '小鬼蜂', hp: 9, atk: 9, def: 3, agi: 13, wis: 4, exp: 5, copper: 3, drop: { item: 'dokukeshi', rank: 'C' },
      onHit: { status: 'poison', chance: 0.2 }, palette: P('#d8a830', '#6a4a1a', '#ff4030', '#f8e8a0'), sprite: S('moth') },
    // ---- 聖の森の道（5章〜）----
    kodama_ko: { name: '木霊の子', hp: 16, atk: 10, def: 6, agi: 10, wis: 16, exp: 10, copper: 7, drop: { item: 'mezamashi', rank: 'C' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }], palette: P('#a8d8a0', '#5a8a5a', '#ffffff', '#e8f8e0'), sprite: S('onibi') },
    koke_inoshishi: { name: '苔猪', hp: 26, atk: 14, def: 10, agi: 4, wis: 3, exp: 12, copper: 8, drop: { item: 'hoshiii', rank: 'B' },
      palette: P('#6a7a3a', '#3a4a1e', '#f0e040', '#c8d890'), sprite: S('boar') },
    // ---- 炉ヶ岳の山道（6章〜）----
    sumikui: { name: '炭喰い虫', hp: 30, atk: 17, def: 18, agi: 6, wis: 4, exp: 18, copper: 10, drop: { item: 'kizugusuri', rank: 'B' },
      resist: { fire: 0.5 }, palette: P('#3a3030', '#1a1414', '#ff8020', '#a08070'), sprite: S('centipede') },
    susukemuri: { name: '煤けむり', hp: 22, atk: 15, def: 8, agi: 15, wis: 18, exp: 17, copper: 9, drop: { item: 'mezamashi', rank: 'B' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'surikomi' }], palette: P('#6a6a70', '#3a3a40', '#ffb040', '#b0b0b8'), sprite: S('onibi') },
    // ---- 獣ノ原（7章〜）----
    sajin_hebi: { name: '砂塵蛇', hp: 38, atk: 22, def: 14, agi: 12, wis: 6, exp: 26, copper: 14, drop: { item: 'dokukeshi', rank: 'B' },
      onHit: { status: 'poison', chance: 0.25 }, palette: P('#c8a868', '#8a6a3a', '#3a1a10', '#f0e0b0'), sprite: S('centipede') },
    hagetaka: { name: '荒野の禿鷹', hp: 34, atk: 23, def: 12, agi: 20, wis: 8, exp: 25, copper: 13, drop: { item: 'kizugusuri', rank: 'B' },
      palette: P('#5a4a3a', '#2e241a', '#f0c040', '#e8d8c8'), sprite: S('yamagarasu') },
    arano_ushi: { name: '荒野の大角', hp: 60, atk: 26, def: 22, agi: 5, wis: 4, exp: 32, copper: 18, drop: { item: 'hoshiii', rank: 'A' },
      palette: P('#7a4a2a', '#4a2a14', '#f0e0c0', '#e8e0d0'), sprite: S('boar') },
    // ---- 王都のまわり（8・9章）：操られた人 ----
    wansho_jutsu: { name: '腕章の術師', counter: '人', awaken: true, hp: 40, atk: 16, def: 12, agi: 11, wis: 30, exp: 36, copper: 0,
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'kangen' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }],
      palette: P('#d8b088', '#e8e8f0', '#2a2a2a', '#9a9ab0'), sprite: S('otte') },
    wansho_kihei: { name: '腕章の騎兵', counter: '人', awaken: true, hp: 50, atk: 26, def: 16, agi: 22, wis: 12, exp: 40, copper: 0,
      palette: P('#d8b088', '#c8ccd8', '#2a2a2a', '#f0f0f8'), sprite: S('otte') },
    // ---- 魔界の野（11章）：黄泉の獣 ----
    yomotsu_inu: { name: 'よもつ犬', hp: 56, atk: 30, def: 16, agi: 16, wis: 8, exp: 40, copper: 20, drop: { item: 'kizugusuri', rank: 'B' },
      palette: P('#6a2a2a', '#3a1414', '#ffd040', '#e0a0a0', '#0a0606'), sprite: S('dog') },
    hainezumi: { name: '灰鼠', hp: 44, atk: 28, def: 14, agi: 22, wis: 10, exp: 36, copper: 18, drop: { item: 'hoshiii', rank: 'B' },
      palette: P('#8a8580', '#4a4540', '#ff4040', '#d8d0c8'), sprite: S('hinezumi') },
    yakeno_onibi: { name: '焼け野の怨火', hp: 40, atk: 26, def: 12, agi: 18, wis: 28, exp: 42, copper: 20, drop: { item: 'mezamashi', rank: 'B' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'surikomi' }], resist: { fire: 0 },
      palette: P('#e04020', '#8a1a10', '#ffe080', '#ffb080', '#1a0606'), sprite: S('onibi') },
    // ---- ダンジョンにだけ出る敵 ----
    kokedama: { name: '苔玉', hp: 28, atk: 12, def: 12, agi: 3, wis: 8, exp: 14, copper: 9, drop: { item: 'dokukeshi', rank: 'B' },   // 苔むした地下道
      actions: [{ w: 3, type: 'attack' }, { w: 1, type: 'kotodama', id: 'doku_rinpun' }], palette: P('#4a8a3a', '#2a5a1e', '#ff6060', '#a8d890'), sprite: S('tsuta') },
    doukutsu_koumori: { name: '洞窟の蝙蝠', hp: 18, atk: 12, def: 6, agi: 18, wis: 6, exp: 12, copper: 7, drop: { item: 'kizugusuri', rank: 'C' },
      palette: P('#3a2a4a', '#1e1428', '#ff4060', '#8a7aa0'), sprite: S('yamagarasu') },
    oomogura: { name: '大土竜', hp: 40, atk: 19, def: 14, agi: 5, wis: 4, exp: 22, copper: 12, drop: { item: 'hoshiii', rank: 'B' },   // 古い坑道
      palette: P('#5a4a40', '#2e241e', '#ffb0b0', '#e0c8b8'), sprite: S('hinezumi') },
    tetsukui: { name: '鉄喰い', hp: 30, atk: 16, def: 26, agi: 6, wis: 5, exp: 24, copper: 16, drop: { item: 'kizugusuri', rank: 'B' },
      palette: P('#7a8088', '#40454a', '#ff7030', '#c8d0d8'), sprite: S('iwatokage') },
    kaze_itachi: { name: '風鼬', hp: 30, atk: 24, def: 10, agi: 26, wis: 10, exp: 28, copper: 15, drop: { item: 'kizugusuri', rank: 'B' },   // 風の岩溝
      palette: P('#b8b8a8', '#6a6a5a', '#2a2a2a', '#f0f0e8'), sprite: S('fox') },
    tsukikage_kitsune: { name: '月影狐', hp: 90, atk: 34, def: 24, agi: 30, wis: 40, exp: 80, copper: 35, drop: { item: 'mezamashi', rank: 'A' },   // ツクヨミの社
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }], palette: P('#c8c8e0', '#6a6a9a', '#ffe060', '#f8f8ff', '#0a0a14'), sprite: S('fox') },
    hyourei: { name: '氷霊', hp: 100, atk: 36, def: 30, agi: 16, wis: 36, exp: 85, copper: 36, drop: { item: 'mezamashi', rank: 'A' },   // 大穴
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'mayoi_bi' }], resist: { fire: 1.5 },
      palette: P('#a0d8f0', '#4a8ab0', '#ffffff', '#e8f8ff', '#06101a'), sprite: S('onibi') },
    yami_hitome: { name: '闇の一つ目', hp: 120, atk: 40, def: 28, agi: 18, wis: 44, exp: 95, copper: 40, drop: { item: 'kizugusuri', rank: 'A' },
      actions: [{ w: 2, type: 'attack' }, { w: 1, type: 'kotodama', id: 'kangen' }], palette: P('#4a2a5a', '#24142e', '#ff3030', '#c8a0d8', '#06040a'), sprite: S('onibi') },
    // ---- クリア後の上位の敵（人間界の地図）----
    ookami_kashira: { name: '狼の頭', hp: 110, atk: 40, def: 24, agi: 22, wis: 10, exp: 90, copper: 40, drop: { item: 'kizugusuri', rank: 'A' },
      palette: P('#4a4a5a', '#24242e', '#ff4040', '#d0d0e0', '#06060a'), sprite: S('arano_ookami') },
    doku_ookumo: { name: '毒の大蜘蛛', hp: 100, atk: 38, def: 22, agi: 16, wis: 12, exp: 85, copper: 36, drop: { item: 'dokukeshi', rank: 'A' },
      onHit: { status: 'venom', chance: 0.25 }, palette: P('#6a3a8a', '#3a1a4a', '#a0ff40', '#d0a0e8', '#0a060e'), sprite: S('morigumo') },
    kurogane_tokage: { name: '黒鉄蜥蜴', hp: 380, atk: 100, def: 110, agi: 30, wis: 30, exp: 520, copper: 110, drop: { item: 'kizugusuri', rank: 'A' },
      palette: P('#2a2a30', '#141418', '#ff5020', '#8a8a98', '#040406'), sprite: S('iwatokage') },
    // ---- めったに出ない（倒せば経験値が大きい）----
    shirousagi: { name: '白兎', hp: 3, atk: 6, def: 0, agi: 90, wis: 20, exp: 120, copper: 30, hard: true, drop: { item: 'mezamashi', rank: 'A' },
      actions: [{ w: 1, type: 'attack' }, { w: 3, type: 'flee' }], resist: { sleep: 0, confuse: 0, poison: 0, venom: 0 },
      palette: P('#f4f4f0', '#c8c0b8', '#e02030', '#ffffff'), sprite: RABBIT },
    tsuki_usagi: { name: '月の兎', hp: 6, atk: 30, def: 0, agi: 220, wis: 120, exp: 4000, copper: 300, hard: true, drop: { item: 'fuku_suzu', rank: 'S' },
      actions: [{ w: 1, type: 'attack' }, { w: 3, type: 'flee' }], resist: { sleep: 0, confuse: 0, poison: 0, venom: 0 },
      palette: P('#e8e0a0', '#a89860', '#4060ff', '#fffff0', '#10100a'), sprite: RABBIT },
  });

  // 今のマップに足す敵の組。from／to：その章のあいだ（書かなければいつも）。lv：オオナムチのレベルがこれ以上（クリア後の上位）
  G.DATA.encounterMore = {
    field_minamo: [{ groups: [['ookaeru'], ['ookaeru', 'dog'], ['kobachi', 'kobachi'], ['kobachi', 'moth']] }],
    hijiri_path: [{ groups: [['kodama_ko'], ['kodama_ko', 'morigumo'], ['koke_inoshishi'], ['koke_inoshishi', 'tsuta']] }],
    ro_path: [{ groups: [['sumikui'], ['sumikui', 'hinezumi'], ['susukemuri'], ['susukemuri', 'yamagarasu']] }],
    kemono_field: [{ groups: [['sajin_hebi'], ['hagetaka'], ['hagetaka', 'hagetaka'], ['arano_ushi'], ['sajin_hebi', 'arano_ookami']] }],
    kemono_ravine: [{ groups: [['kaze_itachi'], ['kaze_itachi', 'kaze_itachi'], ['kaze_itachi', 'hagetaka'], ['sajin_hebi', 'kaze_itachi']] }],
    hijiri_deep: [{ groups: [['kokedama'], ['kokedama', 'kokedama'], ['doukutsu_koumori', 'doukutsu_koumori'], ['doukutsu_koumori', 'kokedama', 'doukutsu_koumori']] }],
    ro_mine: [{ groups: [['oomogura'], ['tetsukui'], ['oomogura', 'tetsukui'], ['tetsukui', 'tetsukui']] }],
    tsukuyomi_yashiro: [{ groups: [['tsukikage_kitsune'], ['tsukikage_kitsune', 'na_kui'], ['tsukikage_kitsune', 'tsukikage_kitsune']] }],
    oana_jou: [{ groups: [['hyourei'], ['hyourei', 'hyourei'], ['yami_hitome'], ['hyourei', 'kage_oni']] }],
    oana_chuu: [{ groups: [['yami_hitome'], ['yami_hitome', 'hyourei'], ['yami_hitome', 'yami_hitome']] }],
    world_ningen: [
      { from: 5, to: 5, groups: [['kodama_ko'], ['koke_inoshishi']] },
      { from: 6, to: 6, groups: [['sumikui'], ['susukemuri']] },
      { from: 7, to: 9, groups: [['sajin_hebi'], ['hagetaka'], ['arano_ushi']] },
      { from: 8, to: 9, groups: [['wansho_jutsu', 'junkai'], ['wansho_kihei'], ['wansho_kihei', 'wansho_jutsu']] },
      { from: 13, groups: [['ookami_kashira'], ['doku_ookumo'], ['ookami_kashira', 'doku_ookumo']] },
      { from: 13, lv: 35, groups: [['kurogane_tokage'], ['kurogane_tokage', 'zantou']] },
    ],
    world_makai: [
      { from: 11, to: 11, groups: [['yomotsu_inu'], ['yomotsu_inu', 'yomotsu_inu'], ['hainezumi', 'hainezumi'], ['yakeno_onibi'], ['yakeno_onibi', 'yomotsu_inu'], ['hainezumi', 'yakeno_onibi', 'hainezumi']] },
      { from: 13, groups: [['yomotsu_inu', 'kage_oni'], ['yakeno_onibi', 'na_kui']] },
    ],
  };

  // めったに出ない敵：そのマップで敵に出会うとき、chance の確率でこの組になる（from：その章から）
  const HUMAN_FIELDS = ['field_minamo', 'hijiri_path', 'ro_path', 'kemono_field', 'world_ningen'];
  G.DATA.rares = [
    { maps: HUMAN_FIELDS, from: 4, chance: 0.03, groups: [['shirousagi'], ['shirousagi', 'shirousagi']] },
    { maps: ['world_makai', 'oana_jou', 'oana_chuu', 'oana_soko', 'tsukuyomi_yashiro'], from: 13, chance: 0.03, groups: [['tsuki_usagi']] },
  ];
})();
