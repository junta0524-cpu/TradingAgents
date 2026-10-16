// このファイルの役目：言霊（ことだま）の一覧。仕様書 第5章の全部の言霊を、系統ごとに並べる。
// 新しい言霊は、ここに1つ足すだけで増やせる。消費MPと威力の数字もここに書く。
//
// sys：系統（yama=オオヤマツミ／hono=ホノカグツチ／iza=イザナギ／tsuku=ツクヨミ／ame=アメノミナカヌシ）
// target：self（自分）／ally（味方1人）／allies（味方全員）／enemy（敵1体）／enemies（敵全員）
// use：battle（戦闘だけ）／both（戦闘と移動中）／field（移動中だけ）
// effect：
//   { kind: 'heal', power: [最小, 最大] } または { kind: 'heal', full: true }  … 体力を戻す
//   { kind: 'damage', power: [最小, 最大], element: 'fire' など }            … 傷を与える
//   { kind: 'buff', stat: 'atk'|'def'|'both', mult: 倍率, turns: ターン数 }   … 強くする
//   { kind: 'guard', turns: ターン数 }                                        … 傷を受けない
//   { kind: 'scan' }                                                           … 敵の強さを見る
//   { kind: 'status', status: 'sleep' など, chance: 確率 }                     … 状態異常にする（耐性で下がる）
//   { kind: 'cure', statuses: [...] }                                          … 状態異常を治す
//   { kind: 'mind', turns }（心鎮め）／{ kind: 'reflect', turns }（返し鏡）／{ kind: 'cover', turns }（身代わり）
//   { kind: 'foresee' }（先読み）／{ kind: 'barrier' }（結界張り：敵に出会いにくくなる）
//   { kind: 'revive', ratio }（倒れた仲間を起こす。クリア後だけ意味がある）。target: 'fallen'（倒れた1人）／'fallen_all'（倒れた全員）
// phase：その数字のフェーズで使えるようになる（今はまだ使えない言霊）
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.kotodamaSystems = {
    yama:  { name: 'オオヤマツミ',     short: '山', color: '#b8a070', desc: '守護・強化' },
    hono:  { name: 'ホノカグツチ',     short: '火', color: '#f08050', desc: '攻撃' },
    iza:   { name: 'イザナギ',         short: '生', color: '#80d890', desc: '回復・蘇生' },
    tsuku: { name: 'ツクヨミ',         short: '月', color: '#a0a8f0', desc: '幻惑・封印・見破り' },
    ame:   { name: 'アメノミナカヌシ', short: '和', color: '#f0e8a0', desc: '調和' },
  };

  const K = {
    // ---- オオヤマツミ（山・守）----
    katame:         { name: '堅め',         sys: 'yama', mp: 2,  target: 'ally',    use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 1.5, turns: 5 } },
    katame_ren:     { name: '堅め連',       sys: 'yama', mp: 5,  target: 'allies',  use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 1.5, turns: 5 } },
    kaeshikagami:   { name: '返し鏡',       sys: 'yama', mp: 6,  target: 'ally',    use: 'battle', effect: { kind: 'reflect', turns: 3 } },
    iwato:          { name: '岩戸',         sys: 'yama', mp: 8,  target: 'ally',    use: 'battle', effect: { kind: 'guard', turns: 2 } },
    kokoroshizume:  { name: '心鎮め',       sys: 'yama', mp: 3,  target: 'ally',    use: 'battle', effect: { kind: 'mind', turns: 5 }, awaken: true },   // awaken：揺らいでいる人の敵にも唱えられ、目を覚まさせる
    migawari:       { name: '身代わり',     sys: 'yama', mp: 5,  target: 'ally',    use: 'battle', effect: { kind: 'cover', turns: 3 } },
    kekkai:         { name: '結界張り',     sys: 'yama', mp: 6,  target: 'self',    use: 'field',  effect: { kind: 'barrier' } },
    katame_jin:     { name: '堅めの陣',     sys: 'yama', mp: 9,  target: 'allies',  use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 1.75, turns: 5 } },
    iwagaki:        { name: '岩垣',         sys: 'yama', mp: 12, target: 'allies',  use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 2, turns: 3 } },
    hanekaeshi_mai: { name: '跳ね返しの舞', sys: 'yama', mp: 14, target: 'allies',  use: 'battle', effect: { kind: 'reflect', turns: 3 } },
    yamamori_omi:   { name: '山守の大御',   sys: 'yama', mp: 24, target: 'allies',  use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 2.5, turns: 5 } },
    kokoroshizume_omi: { name: '心鎮めの大御', sys: 'yama', mp: 20, target: 'allies', use: 'battle', effect: { kind: 'mind', turns: 8 } },

    // ---- ホノカグツチ（火・攻）----
    takeri:         { name: '猛り',         sys: 'hono', mp: 3,  target: 'ally',    use: 'battle', effect: { kind: 'buff', stat: 'atk', mult: 1.5, turns: 5 } },
    hidane:         { name: '火種',         sys: 'hono', mp: 2,  target: 'enemy',   use: 'battle', effect: { kind: 'damage', power: [8, 12], element: 'fire' } },
    kaen:           { name: '火焔',         sys: 'hono', mp: 5,  target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [10, 16], element: 'fire' } },
    kaen_omi:       { name: '火焔の大御',   sys: 'hono', mp: 18, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [40, 55], element: 'fire' } },
    hibashiri:      { name: '火走り',       sys: 'hono', mp: 7,  target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [12, 18], element: 'fire' } },
    ikazuchi:       { name: '雷',           sys: 'hono', mp: 8,  target: 'enemy',   use: 'battle', effect: { kind: 'damage', power: [25, 35], element: 'thunder' } },
    haze:           { name: '爆ぜ',         sys: 'hono', mp: 12, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [30, 40], element: 'fire' } },
    hibashiri_mai:  { name: '火走りの舞',   sys: 'hono', mp: 11, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [24, 32], element: 'fire' } },
    ikazuchi_jin:   { name: '雷の陣',       sys: 'hono', mp: 14, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [35, 45], element: 'thunder' } },
    takeri_jin:     { name: '猛りの陣',     sys: 'hono', mp: 8,  target: 'allies',  use: 'battle', effect: { kind: 'buff', stat: 'atk', mult: 1.5, turns: 5 } },
    haze_omi:       { name: '爆ぜの大御',   sys: 'hono', mp: 24, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [70, 90], element: 'fire' } },
    ikazuchi_omi:   { name: '雷の大御',     sys: 'hono', mp: 22, target: 'enemy',   use: 'battle', effect: { kind: 'damage', power: [120, 150], element: 'thunder' } },
    ikari_omi:      { name: '怒りの大御',   sys: 'hono', mp: 30, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [100, 130], element: 'fire' } },

    // ---- イザナギ（創造・再生）----
    iyashi:         { name: '癒やし',       sys: 'iza', mp: 3,  target: 'ally',    use: 'both',   effect: { kind: 'heal', power: [12, 18] } },
    iyashi_ren:     { name: '癒やし連',     sys: 'iza', mp: 7,  target: 'allies',  use: 'both',   effect: { kind: 'heal', power: [12, 18] } },
    michi_iyashi:   { name: '満ち癒やし',   sys: 'iza', mp: 8,  target: 'ally',    use: 'both',   effect: { kind: 'heal', full: true } },
    dokubarai:      { name: '毒払い',       sys: 'iza', mp: 2,  target: 'ally',    use: 'both',   effect: { kind: 'cure', statuses: ['poison', 'venom'] } },
    mezame:         { name: '目覚め',       sys: 'iza', mp: 2,  target: 'ally',    use: 'battle', effect: { kind: 'cure', statuses: ['sleep', 'bind'] } },
    nayobi:         { name: '名呼び',       sys: 'iza', mp: 0,  target: 'enemy',   use: 'battle', effect: { kind: 'awaken' }, awaken: true },   // 12章で覚える。揺らいでいる人の敵の目を覚まさせる（物語の名呼びは場面で起きる）
    ikikaeshi:      { name: '生き返し',     sys: 'iza', mp: 20, target: 'fallen',  use: 'battle', effect: { kind: 'revive', ratio: 0.5 } },
    musuhi:         { name: '産霊',         sys: 'iza', mp: 30, target: 'fallen_all', use: 'battle', effect: { kind: 'revive', ratio: 0.3 } },
    iyashi_mai:     { name: '癒やしの舞',   sys: 'iza', mp: 6,  target: 'ally',    use: 'both',   effect: { kind: 'heal', power: [50, 70] } },
    kiyome:         { name: '清め',         sys: 'iza', mp: 5,  target: 'allies',  use: 'both',   effect: { kind: 'cure', statuses: ['sleep', 'confuse', 'silence', 'bind', 'poison', 'venom', 'oboro'] } },
    nayobi_jin:     { name: '名呼びの陣',   sys: 'iza', mp: 0,  target: 'allies',  use: 'battle', phase: 12, special: true },
    michi_iyashi_omi: { name: '満ち癒やしの大御', sys: 'iza', mp: 30, target: 'allies', use: 'both', effect: { kind: 'heal', full: true } },
    musuhi_omi:     { name: '産霊の大御',   sys: 'iza', mp: 60, target: 'fallen_all', use: 'battle', effect: { kind: 'revive', ratio: 1 } },

    // ---- ツクヨミ（静・知）----
    kotozute:       { name: '言伝',         sys: 'tsuku', mp: 0,  target: 'self',    use: 'field',  effect: { kind: 'story' } },   // 声を風に乗せて届ける（物語の場面で使う）
    nemurigasumi:   { name: '眠り霞',       sys: 'tsuku', mp: 3,  target: 'enemy',   use: 'battle', effect: { kind: 'status', status: 'sleep', chance: 0.75 } },
    madowashi:      { name: '惑わし',       sys: 'tsuku', mp: 4,  target: 'enemy',   use: 'battle', effect: { kind: 'status', status: 'confuse', chance: 0.6 } },
    oboro:          { name: '朧',           sys: 'tsuku', mp: 3,  target: 'enemy',   use: 'battle', effect: { kind: 'status', status: 'oboro', chance: 0.8 } },
    kuchifuuji:     { name: '口封じ',       sys: 'tsuku', mp: 3,  target: 'enemy',   use: 'battle', effect: { kind: 'status', status: 'silence', chance: 0.7 } },
    miyaburi:       { name: '見破り',       sys: 'tsuku', mp: 1,  target: 'enemy',   use: 'battle', effect: { kind: 'scan' } },
    naabaki:        { name: '名暴き',       sys: 'tsuku', mp: 6,  target: 'enemy',   use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 0.6, turns: 5 } },   // 偽りの名を剥がし、守りを下げる
    shibari:        { name: '縛り',         sys: 'tsuku', mp: 4,  target: 'enemy',   use: 'battle', effect: { kind: 'status', status: 'bind', chance: 0.6 } },
    nemurigasumi_mai: { name: '眠り霞の舞', sys: 'tsuku', mp: 8,  target: 'enemies', use: 'battle', effect: { kind: 'status', status: 'sleep', chance: 0.65 } },
    oboro_jin:      { name: '朧の陣',       sys: 'tsuku', mp: 8,  target: 'enemies', use: 'battle', effect: { kind: 'status', status: 'oboro', chance: 0.7 } },
    kuchifuuji_mai: { name: '口封じの舞',   sys: 'tsuku', mp: 8,  target: 'enemies', use: 'battle', effect: { kind: 'status', status: 'silence', chance: 0.6 } },
    sakiyomi:       { name: '先読み',       sys: 'tsuku', mp: 2,  target: 'self',    use: 'battle', effect: { kind: 'foresee' } },
    naabaki_omi:    { name: '名暴きの大御', sys: 'tsuku', mp: 20, target: 'enemies', use: 'battle', effect: { kind: 'buff', stat: 'def', mult: 0.6, turns: 5 } },
    shibari_omi:    { name: '縛りの大御',   sys: 'tsuku', mp: 20, target: 'enemies', use: 'battle', effect: { kind: 'status', status: 'bind', chance: 0.7 } },

    // ---- アメノミナカヌシ（根源・調和）----
    chouwa:         { name: '調和の光',     sys: 'ame', mp: 20, target: 'allies',  use: 'battle', effect: { kind: 'buff', stat: 'both', mult: 1.3, turns: 5 } },
    makoto:         { name: 'まことの名',   sys: 'ame', mp: 50, target: 'enemies', use: 'battle', effect: { kind: 'damage', power: [200, 250], element: 'none' } },
  };

  // 敵だけが使う言霊（刷り込み・甘言は心を惑わす。心鎮めで防げる）
  const ENEMY_ONLY = {
    na_no_hakudatsu: { name: '名の剥奪',     sys: 'enemy', phase: 12 },
    surikomi:        { name: '刷り込み',     sys: 'enemy', target: 'enemy',   effect: { kind: 'status', status: 'confuse', chance: 0.5 } },
    kangen:          { name: '甘言',         sys: 'enemy', target: 'enemies', effect: { kind: 'status', status: 'confuse', chance: 0.3 } },
    shihai_uwagaki:  { name: '支配の上書き', sys: 'enemy', phase: 12 },
    // 獣の技（敵用）
    doku_rinpun:     { name: '毒の鱗粉',     sys: 'enemy', target: 'enemies', effect: { kind: 'status', status: 'poison', chance: 0.4 } },
    mayoi_bi:        { name: '迷い火',       sys: 'enemy', target: 'enemy',   effect: { kind: 'status', status: 'sleep', chance: 0.5 } },
  };

  G.DATA.kotodama = K;
  G.DATA.kotodamaEnemy = ENEMY_ONLY;
})();
