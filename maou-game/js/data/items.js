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

    // ---- 武器（atk：攻撃力に足す）。名前は古事記から（ユーザー決定）。中の名前（id）は前のまま ----
    old_dagger:   { name: '石椎',   type: 'weapon', atk: 3,  who: ['oonamuchi'], desc: '石を頭につけた、古い打ち物。（古事記・神武の段の歌「石椎いもち」）' },
    copper_knife: { name: '頭椎の大刀',   type: 'weapon', atk: 6,  who: ['oonamuchi'], desc: '柄の頭が槌のように丸い大刀。（古事記・神武の段の歌「頭椎い」）' },
    iron_sword:   { name: '十拳剣',     type: 'weapon', atk: 11, who: ['oonamuchi'], desc: '拳十個ぶんの長さの剣。古事記の神々が佩いた剣。' },

    // ---- 防具（def：守備力に足す）----
    patched_cloak: { name: '継ぎ当ての外套', type: 'armor', def: 1, who: ['oonamuchi'], desc: '何度も継ぎを当てた外套。（小説で、オオナムチが着ている外套）' },
    leather_armor: { name: '鹿革の短甲',     type: 'armor', def: 4, who: ['oonamuchi'], desc: '鹿の革を重ねた、軽い短甲。' },
    chain_mail:    { name: '鉄の短甲',         type: 'armor', def: 8, who: ['oonamuchi'], desc: '鉄の板を綴じた、丈夫な短甲。' },

    // ---- 装飾 ----
    // ---- ダンジョンの寄り道で見つかる品（js/data/maps/hijiri_deep.js など）----
    hagane_ken:      { name: '天之尾羽張',       type: 'weapon',    atk: 16, who: ['oonamuchi'], desc: 'イザナギが火の神を斬った剣の名を持つ。坑道の炉に眠っていた。（古事記）' },
    yomiishi_ken:    { name: '草那芸之大刀',   type: 'weapon',    atk: 38, who: ['oonamuchi'], desc: '大蛇の尾から出た大刀の名を持つ。大穴の黒い石の奥に眠っていた。（古事記）' },
    morimori_gaitou: { name: '真賢木の衣', type: 'armor',     def: 5, wis: 3, who: ['oonamuchi'], desc: '天石屋戸の前に立てられた真賢木（まさかき）の名を持つ衣。苔の匂いがして、心が静まる。（古事記）' },
    kazekiri_gaitou: { name: '志那都比古の衣', type: 'armor',     def: 7, agi: 5, who: ['oonamuchi'], desc: '風の神・志那都比古神の名を持つ衣。風を受け流す。（古事記）' },
    akatsuki_yoroi:  { name: '天石屋戸の鎧',       type: 'armor',     def: 18, wis: 4, who: ['oonamuchi'], desc: '天照大御神が隠れた天石屋戸の名を持つ鎧。夜明けの光の色をしている。（古事記）' },
    kotonoha_juzu:   { name: '五百津之御統', type: 'accessory', wis: 5, who: ['oonamuchi'], desc: '天照大御神が身につけた、たくさんの玉を連ねた御統（みすまる）の名を持つ。言葉の力が増す。（古事記）' },
    hoshimi_magatama:{ name: '八尺瓊勾玉',   type: 'accessory', wis: 12, def: 3, who: ['oonamuchi'], desc: '天石屋戸の前の真賢木に掛けられた、長い緒の勾玉。（古事記）' },

    mamori_ishi: { name: '守りの玉',   type: 'accessory', def: 2, who: ['oonamuchi'], desc: '身を守るという、丸い玉。' },
    hayate_obi:  { name: '速風の帯', type: 'accessory', agi: 3, who: ['oonamuchi'], desc: '体が軽くなる帯。' },

    // ---- 大事なもの ----
    // ---- 武器・防具・装飾（増やした品。名前：宝・番人のごほうび・終盤の品は古事記から、店の品は古代の言葉の雰囲気で。値段は balance.js の PRICES、置き場所は shops.js と各マップの宝箱）----
    // 特別な効き目：hp／mp（最大の体力・MPに足す）、resist（{ poison: 0 } など状態異常の効きやすさの倍率）、
    // crit（会心の出やすさに足す）、perk（firstStrike 先手を取りやすい／expBoost 経験値が増える／copperBoost 銅貨が増える）
    kashi_tsue:      { name: '衝立船戸の杖',       type: 'weapon',    atk: 4, wis: 4, who: ['oonamuchi'], desc: 'イザナギが黄泉から戻るとき投げた杖の名を持つ。言葉が通りやすい。（古事記）' },
    seirei_tsue:     { name: '木花の杖',   type: 'weapon',    atk: 7, wis: 9, who: ['oonamuchi'], desc: '木花之佐久夜毘売の名を持つ、花の咲く枝の杖。（古事記）' },
    kaze_tanto:      { name: '八千矛',     type: 'weapon',    atk: 13, agi: 6, who: ['oonamuchi'], desc: '大国主の別名「八千矛神」にちなむ矛。軽く、すばやく突ける。（古事記）' },
    iwakurai_kiba:   { name: '石析の剣', type: 'weapon',    atk: 22, crit: 0.08, who: ['oonamuchi'], desc: '岩を裂く神・石析神の名を持つ。岩喰らいの牙から削った刃で、急所をとらえやすい。（古事記）' },
    kurogane_katana: { name: '樋速日の刀',     type: 'weapon',    atk: 24, crit: 0.06, who: ['oonamuchi'], desc: '剣の血から生まれた神・樋速日神の名を持つ、無骨な刀。急所をとらえやすい。（古事記）' },
    shirogane_ken:   { name: '甕速日の剣',     type: 'weapon',    atk: 26, who: ['oonamuchi'], desc: '剣の血から生まれた神・甕速日神の名を持つ、王都の白い剣。（古事記）' },
    kotodama_tsue:   { name: '天沼矛',     type: 'weapon',    atk: 14, wis: 18, who: ['oonamuchi'], desc: 'イザナギとイザナミが国を生んだ矛の名を持つ。言葉を紡ぐ者のための矛。（古事記）' },
    onigane_tachi:   { name: '伊都之尾羽張',   type: 'weapon',    atk: 34, who: ['oonamuchi'], desc: '天之尾羽張の別の名を持つ、鬼族の鍛えた重い大刀。（古事記）' },
    akatsuki_ken:    { name: '生大刀',   type: 'weapon',    atk: 48, wis: 10, who: ['oonamuchi'], desc: '大穴牟遅がスサノオのもとから持ち帰った大刀。オオナムチのための剣。（古事記）' },

    mori_koromo:     { name: '木綿の衣',       type: 'armor',     def: 6, wis: 2, who: ['oonamuchi'], desc: 'エルフが木の皮の糸（ゆう）で織った、軽い衣。' },
    kumoginu:        { name: '呉公蜂の比礼',   type: 'armor',     def: 7, resist: { poison: 0 }, who: ['oonamuchi'], desc: 'スセリビメがオオナムチに渡し、呉公と蜂の室から守った比礼。毒を通さない。（古事記）' },
    hagane_doumaru:  { name: 'くろがねの挂甲',     type: 'armor',     def: 12, who: ['oonamuchi'], desc: '炉ヶ岳の職人が鉄の小札を綴じた挂甲（けいこう）。' },
    juuhi_dougi:     { name: '熊皮の衣',   type: 'armor',     def: 10, agi: 3, who: ['oonamuchi'], desc: '獣ノ原の獣の皮をなめした、動きやすい衣。' },
    tsugihagi_kawa:  { name: '継ぎ接ぎの短甲', type: 'armor',   def: 9, who: ['oonamuchi'], desc: '何度も直された短甲。見た目より丈夫だ。' },
    shirogane_yoroi: { name: '白銀の挂甲',     type: 'armor',     def: 17, who: ['oonamuchi'], desc: '王都の兵と同じ造りの、白い挂甲。' },
    inori_houi:      { name: '祝の衣',   type: 'armor',     def: 11, wis: 8, mp: 20, who: ['oonamuchi'], desc: '祝（はふり）が祈りのときにまとう衣。祈りの言葉が縫い込まれている。' },
    onigane_yoroi:   { name: '鬼鋼の挂甲',     type: 'armor',     def: 24, who: ['oonamuchi'], desc: '鬼族の鍛冶が鍛えた、重い挂甲。' },

    dokuyoke:        { name: '毒除けの比礼', type: 'accessory', resist: { poison: 0 }, who: ['oonamuchi'], desc: '肩にかける細い布。身につけていると、毒にかからない。' },
    mezame_suzu:     { name: '目覚めの鈴釧',   type: 'accessory', resist: { sleep: 0 }, who: ['oonamuchi'], desc: '鈴のついた腕輪（すずくしろ）。澄んだ音が、眠りを払う。' },
    // 目覚めさせた人の数で届く品（balance.js の AWAKEN.REWARDS）。古事記の「言向け和す」（言葉で向き合い、和らげる）から
    kotomuke_tama:   { name: '言向けの勾玉', type: 'accessory', wis: 4, mp: 10, who: ['oonamuchi'], desc: '目を覚ました人たちから託された勾玉。古事記の「言向け和す」（刃ではなく言葉で和らげる）の名を持つ。' },
    nagomi_hire:     { name: '和しの比礼',   type: 'accessory', resist: { confuse: 0, sleep: 0.5 }, def: 3, who: ['oonamuchi'], desc: '心を和らげる比礼。惑わしにかからず、眠りにもかかりにくい。' },
    kotomuke_kagami: { name: '言向け和す鏡', type: 'accessory', wis: 10, mp: 30, def: 4, who: ['oonamuchi'], desc: '三十人の目を覚ました言葉が、澄んだ鏡になった。古事記の「言向け和す」から。' },
    nanori_magatama: { name: '名告りの勾玉', type: 'accessory', wis: 8, mp: 20, resist: { confuse: 0 }, who: ['oonamuchi'], desc: '名を取り戻した二十四人の思いが宿る勾玉。古事記で、名を告げること（名告り）は、自らを明かすこと。惑わしにかからない。' },
    tama_no_o:       { name: '魂の緒',       type: 'accessory', mp: 20, who: ['oonamuchi'], desc: '言葉の力を蓄える、細い組紐。' },
    chikara_ude:     { name: '力の釧',     type: 'accessory', atk: 5, who: ['oonamuchi'], desc: '鉱山の里で作られた、太い腕輪（くしろ）。' },
    inochi_ishi:     { name: '命の勾玉',       type: 'accessory', hp: 30, who: ['oonamuchi'], desc: '握ると、体の奥が温かくなる勾玉。' },
    kokoro_kagami:   { name: '真澄の鏡',       type: 'accessory', wis: 2, resist: { confuse: 0 }, who: ['oonamuchi'], desc: '曇りのない小さな鏡（まそみのかがみ）。惑わされなくなる。' },
    owashi_hane:     { name: '八咫烏の羽', type: 'accessory', agi: 10, perk: 'firstStrike', who: ['oonamuchi'], desc: '道に迷った者を導いた八咫烏の名を持つ羽。敵より先に動きやすくなる。（古事記）' },
    fuku_suzu:       { name: '福の鈴',       type: 'accessory', perk: 'copperBoost', who: ['oonamuchi'], desc: '鳴らすと、銅貨が集まるという鈴。' },
    tsukikage_obi:   { name: '月読の帯',     type: 'accessory', wis: 8, agi: 4, who: ['oonamuchi'], desc: '月の光を染めた帯。' },
    hyoumon_hitai:   { name: '蛇の比礼',   type: 'accessory', def: 10, resist: { sleep: 0, confuse: 0 }, who: ['oonamuchi'], desc: 'スセリビメがオオナムチに渡し、蛇の室で眠らせなかった比礼。眠りと惑わしを払う。（古事記）' },
    kogane_inaho:    { name: '大宜都比売の稲穂',   type: 'accessory', perk: 'expBoost', who: ['oonamuchi'], desc: '体から稲や粟を生んだ女神・大宜都比売の稲穂。戦いから得るものが多くなる。（古事記）' },
    nushi_shinzou:   { name: '天詔琴',   type: 'accessory', hp: 200, mp: 100, wis: 15, who: ['oonamuchi'], desc: '大穴牟遅がスサノオのもとから、生大刀・生弓矢とともに持ち帰った琴。（古事記）' },

    koudou_kagi:  { name: '坑道の鍵', type: 'key', desc: '古い坑道の、鉄の扉の鍵。' },
    iwamizo_kagi: { name: '岩溝の鍵', type: 'key', desc: '風の岩溝の、岩の扉の鍵。' },
    // 寄り道の頼みごと（js/data/quests.js）で預かる品
    magane_tegami:  { name: '坑夫の母の手紙', type: 'key', desc: 'マガネの坑夫の母から、ヤチマタの宿で働く息子へ。' },
    ukihashi_fumi:  { name: '関所の書付', type: 'key', desc: 'ウキハシの関所から、イナサの網元へ宛てた書付。' },
    yata_hanefumi:  { name: '鴉の羽文', type: 'key', desc: 'ヤタの断崖の伝令から、イワヤトに住む妹へ。黒い羽に結んだ文。' },
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
