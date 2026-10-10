// このファイルの役目：道具と装備の一覧（名前・説明・効き目・装備できる人）。
// 値段は js/data/balance.js の PRICES にある（数字は balance.js に集める決まり）。
// type：use（使う道具）／weapon（武器）／armor（防具）／accessory（装飾）
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
    mamori_ishi: { name: '守り石',   type: 'accessory', def: 2, who: ['oonamuchi'], desc: '身を守るという丸い石。' },
    hayate_obi:  { name: '疾風の帯', type: 'accessory', agi: 3, who: ['oonamuchi'], desc: '体が軽くなる帯。' },
  };
})();
