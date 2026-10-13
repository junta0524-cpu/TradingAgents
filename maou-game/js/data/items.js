// このファイルの役目：道具と装備の一覧（名前・説明・効き目・装備できる人）。
// 値段は js/data/balance.js の PRICES にある（数字は balance.js に集める決まり）。
// type：use（使う道具）／weapon（武器）／armor（防具）／accessory（装飾）／key（大事なもの。売れない。read の行を読める）
// use の effect は言霊と同じ書き方（js/data/kotodama.js の先頭を見る）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.items = {
    // ---- 使う道具 ----
    kizugusuri: { name: '傷薬',   type: 'use', target: 'ally', use: 'both', effect: { kind: 'heal', power: [20, 25] }, desc: '傷に塗る薬。体力が少し戻る。' },
    hoshiii:    { name: '干し飯', type: 'use', target: 'ally', use: 'both', effect: { kind: 'heal', power: [8, 12] },  desc: '旅の保存食。わずかに体力が戻る。' },
    dokukeshi:  { name: '毒消し草', type: 'use', target: 'ally', use: 'both', effect: { kind: 'cure', statuses: ['poison', 'venom'] }, desc: '苦い草。毒を消す。' },
    mezamashi:  { name: '目覚まし香', type: 'use', target: 'ally', use: 'battle', effect: { kind: 'cure', statuses: ['sleep', 'confuse'] }, desc: '鼻に抜ける香り。眠りと混乱を払う。' },

    // ---- 武器（atk：攻撃力に足す）----
    old_dagger:   { name: '古い短剣',   type: 'weapon', atk: 3,  who: ['oonamuchi'], desc: '使い古した短剣。' },
    copper_knife: { name: '銅の短刀',   type: 'weapon', atk: 6,  who: ['oonamuchi'], desc: '銅を打った短い刀。' },
    iron_sword:   { name: '鉄の剣',     type: 'weapon', atk: 11, who: ['oonamuchi'], desc: '炉ヶ岳の職人が打った剣。' },

    // ---- 防具（def：守備力に足す）----
    patched_cloak: { name: '継ぎ当ての外套', type: 'armor', def: 1, who: ['oonamuchi'], desc: '何度も継ぎを当てた外套。' },
    leather_armor: { name: '旅人の革鎧',     type: 'armor', def: 4, who: ['oonamuchi'], desc: '軽くて丈夫な革の鎧。' },
    chain_mail:    { name: '鎖帷子',         type: 'armor', def: 8, who: ['oonamuchi'], desc: '細い鎖を編んだ帷子。' },

    // ---- 装飾 ----
    // ---- ダンジョンの寄り道で見つかる品（js/data/maps/hijiri_deep.js など）----
    hagane_ken:      { name: '鋼の剣',       type: 'weapon',    atk: 16, who: ['oonamuchi'], desc: '古い坑道に眠っていた、よく鍛えられた剣。' },
    yomiishi_ken:    { name: '黄泉石の剣',   type: 'weapon',    atk: 32, who: ['oonamuchi'], desc: '大穴の黒い石を削り出した剣。ひやりと重い。' },
    morimori_gaitou: { name: '森守りの外套', type: 'armor',     def: 5, wis: 3, who: ['oonamuchi'], desc: '苔の匂いのする外套。心が静まる。' },
    kazekiri_gaitou: { name: '風切りの外套', type: 'armor',     def: 7, agi: 5, who: ['oonamuchi'], desc: '風を受け流す、軽い外套。' },
    akatsuki_yoroi:  { name: '暁の鎧',       type: 'armor',     def: 18, wis: 4, who: ['oonamuchi'], desc: '夜明けの色をした鎧。' },
    kotonoha_juzu:   { name: '言の葉の数珠', type: 'accessory', wis: 5, who: ['oonamuchi'], desc: '言葉を紡ぐ者が身につけた、古い数珠。' },
    hoshimi_magatama:{ name: '星見の勾玉',   type: 'accessory', wis: 12, def: 3, who: ['oonamuchi'], desc: '夜空の光を閉じこめた勾玉。' },

    mamori_ishi: { name: '守り石',   type: 'accessory', def: 2, who: ['oonamuchi'], desc: '身を守るという丸い石。' },
    hayate_obi:  { name: '疾風の帯', type: 'accessory', agi: 3, who: ['oonamuchi'], desc: '体が軽くなる帯。' },

    // ---- 大事なもの ----
    // ---- 武器・防具・装飾（増やした品。値段は balance.js の PRICES、置き場所は shops.js と各マップの宝箱）----
    // 特別な効き目：hp／mp（最大の体力・MPに足す）、resist（{ poison: 0 } など状態異常の効きやすさの倍率）、
    // crit（会心の出やすさに足す）、perk（firstStrike 先手を取りやすい／expBoost 経験値が増える／copperBoost 銅貨が増える）
    kashi_tsue:      { name: '樫の杖',       type: 'weapon',    atk: 4, wis: 4, who: ['oonamuchi'], desc: '堅い樫を削った杖。言葉が、通りやすくなる。' },
    seirei_tsue:     { name: '精霊樹の杖',   type: 'weapon',    atk: 7, wis: 9, who: ['oonamuchi'], desc: '聖の森の古木の枝。かすかに温かい。' },
    kaze_tanto:      { name: '風の短刀',     type: 'weapon',    atk: 13, agi: 6, who: ['oonamuchi'], desc: '軽く、振ると風を切る音がする短刀。' },
    iwakurai_kiba:   { name: '岩喰らいの牙', type: 'weapon',    atk: 22, crit: 0.08, who: ['oonamuchi'], desc: '岩喰らいの牙を削った刃。急所をとらえやすい。' },
    kurogane_katana: { name: '黒鉄の刀',     type: 'weapon',    atk: 24, crit: 0.06, who: ['oonamuchi'], desc: '貧民区の鍛冶が打った、無骨な刀。' },
    shirogane_ken:   { name: '白銀の剣',     type: 'weapon',    atk: 26, who: ['oonamuchi'], desc: '王都の工房の、白く光る剣。' },
    kotodama_tsue:   { name: '言霊の杖',     type: 'weapon',    atk: 14, wis: 18, who: ['oonamuchi'], desc: '言葉を紡ぐ者のための杖。' },
    onigane_tachi:   { name: '鬼鋼の大刀',   type: 'weapon',    atk: 34, who: ['oonamuchi'], desc: '鬼族の鍛冶が鍛えた、重い大刀。' },
    akatsuki_ken:    { name: '夜明けの剣',   type: 'weapon',    atk: 48, wis: 10, who: ['oonamuchi'], desc: '大穴の最深部に眠っていた剣。夜明けの色に光る。' },

    mori_koromo:     { name: '森の衣',       type: 'armor',     def: 6, wis: 2, who: ['oonamuchi'], desc: 'エルフが織った、軽い衣。' },
    kumoginu:        { name: '蜘蛛絹の衣',   type: 'armor',     def: 7, resist: { poison: 0 }, who: ['oonamuchi'], desc: '大蜘蛛の糸で織った衣。毒を通さない。' },
    hagane_doumaru:  { name: '鋼の胴丸',     type: 'armor',     def: 12, who: ['oonamuchi'], desc: '炉ヶ岳の職人が打った胴丸。' },
    juuhi_dougi:     { name: '獣皮の胴着',   type: 'armor',     def: 10, agi: 3, who: ['oonamuchi'], desc: '獣ノ原の獣の皮をなめした胴着。' },
    tsugihagi_kawa:  { name: '継ぎ接ぎの革鎧', type: 'armor',   def: 9, who: ['oonamuchi'], desc: '何度も直された革鎧。見た目より丈夫だ。' },
    shirogane_yoroi: { name: '白銀の鎧',     type: 'armor',     def: 17, who: ['oonamuchi'], desc: '王都の兵と同じ造りの、白い鎧。' },
    inori_houi:      { name: '祈りの法衣',   type: 'armor',     def: 11, wis: 8, mp: 20, who: ['oonamuchi'], desc: '祈りの言葉が縫い込まれた法衣。' },
    onigane_yoroi:   { name: '鬼鋼の鎧',     type: 'armor',     def: 24, who: ['oonamuchi'], desc: '鬼族の鍛冶が鍛えた、重い鎧。' },

    dokuyoke:        { name: '毒除けのお守り', type: 'accessory', resist: { poison: 0 }, who: ['oonamuchi'], desc: '身につけていると、毒にかからない。' },
    mezame_suzu:     { name: '目覚めの鈴',   type: 'accessory', resist: { sleep: 0 }, who: ['oonamuchi'], desc: '澄んだ音で、眠りを払う鈴。' },
    tama_no_o:       { name: '魂の緒',       type: 'accessory', mp: 20, who: ['oonamuchi'], desc: '言葉の力を蓄える、細い組紐。' },
    chikara_ude:     { name: '力の腕輪',     type: 'accessory', atk: 5, who: ['oonamuchi'], desc: '鉱山の里で作られた、太い腕輪。' },
    inochi_ishi:     { name: '命の石',       type: 'accessory', hp: 30, who: ['oonamuchi'], desc: '握ると、体の奥が温かくなる石。' },
    kokoro_kagami:   { name: '心の鏡',       type: 'accessory', wis: 2, resist: { confuse: 0 }, who: ['oonamuchi'], desc: '心を映す小さな鏡。惑わされなくなる。' },
    owashi_hane:     { name: '大鷲の羽飾り', type: 'accessory', agi: 10, perk: 'firstStrike', who: ['oonamuchi'], desc: '風の大鷲の羽。敵より先に動きやすくなる。' },
    fuku_suzu:       { name: '福の鈴',       type: 'accessory', perk: 'copperBoost', who: ['oonamuchi'], desc: '鳴らすと、銅貨が集まるという鈴。' },
    tsukikage_obi:   { name: '月影の帯',     type: 'accessory', wis: 8, agi: 4, who: ['oonamuchi'], desc: '月の光を染めた帯。' },
    hyoumon_hitai:   { name: '氷の額当て',   type: 'accessory', def: 10, resist: { sleep: 0, confuse: 0 }, who: ['oonamuchi'], desc: '氷門の番人の額当て。心も体も冷えて冴える。' },
    kogane_inaho:    { name: '黄金の稲穂',   type: 'accessory', perk: 'expBoost', who: ['oonamuchi'], desc: '実りの稲穂。戦いから得るものが多くなる。' },
    nushi_shinzou:   { name: '主の心臓石',   type: 'accessory', hp: 200, mp: 100, wis: 15, who: ['oonamuchi'], desc: '大穴の主の胸にあった石。脈打っている。' },

    koudou_kagi:  { name: '坑道の鍵', type: 'key', desc: '古い坑道の、鉄の扉の鍵。' },
    iwamizo_kagi: { name: '岩溝の鍵', type: 'key', desc: '風の岩溝の、岩の扉の鍵。' },
    kakikake_tegami: { name: '書きかけの手紙', type: 'key', desc: '兵の懐にあった、書きかけの手紙。', read: () => G.DATA.rampage.ch2.letter },
  };

  // 装備の能力を短く（一覧の右に出す）：攻+6 賢+4 など。特別な効き目は短い印
  const SPECIAL = { poison: '毒', sleep: '眠', confuse: '惑' };
  G.equipNote = it => [['atk', '攻'], ['def', '守'], ['agi', '速'], ['wis', '賢'], ['hp', 'HP'], ['mp', 'MP']]
    .filter(([k]) => it[k]).map(([k, n]) => `${n}+${it[k]}`)
    .concat(Object.keys(it.resist || {}).map(k => `${SPECIAL[k] || k}防`))
    .concat(it.crit ? ['会心+'] : [], it.perk ? [{ firstStrike: '先手', expBoost: '経験', copperBoost: '銅貨' }[it.perk]] : [])
    .slice(0, 3).join(' ');
  // 特別な効き目を文で（装備を選ぶ窓の下）
  G.equipEffects = it => [
    ...Object.entries(it.resist || {}).map(([k, v]) => `${{ poison: '毒', sleep: '眠り', confuse: '惑わし' }[k] || k}${v === 0 ? 'にかからない' : 'にかかりにくい'}`),
    it.crit ? '会心の一撃が出やすい' : '',
    { firstStrike: '敵より先に動きやすい', expBoost: '経験値が多くもらえる', copperBoost: '銅貨が多くもらえる' }[it.perk] || '',
  ].filter(Boolean).join('・');
})();
