// このファイルの役目：お店の品ぞろえ。値段は js/data/balance.js の PRICES。
// 町の人のデータに shop: 'お店の名前' と書くと、話しかけたあとにお店が開く。品は id か { id, from: 章 }（その章から並ぶ）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.shops = {
    minamo: { name: 'ミナモの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi'] },
    minamo_bugu: { name: 'ミナモの武具屋', items: ['copper_knife', 'kashi_tsue', 'leather_armor', 'mamori_ishi', 'hayate_obi', 'dokuyoke'] },   // 道具屋と武具屋を分けた（ユーザー決定B）
    hijiri: { name: '聖の森の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi'] },
    hijiri_bugu: { name: '聖の森の武具屋', items: ['seirei_tsue', 'copper_knife', 'mori_koromo', 'leather_armor', 'mezame_suzu', 'tama_no_o'] },   // 道具屋と武具屋を分けた（ユーザー決定B）
    ro: { name: '炉ヶ岳の工房', items: ['iron_sword', 'chain_mail', 'hagane_doumaru', 'chikara_ude', 'inochi_ishi', 'hayate_obi'] },
    ro_dougu: { name: '炉ヶ岳の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi'] },   // 道具屋と武具屋を分けた（ユーザー決定B）
    kuzu: { name: '葛の里の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi'] },
    kuzu_bugu: { name: '葛の里の武具屋', items: ['kaze_tanto', 'juuhi_dougi', 'chain_mail', 'kokoro_kagami', 'hayate_obi'] },   // 道具屋と武具屋を分けた（ユーザー決定B）
    amatsu: { name: '天津京の武具屋', items: ['shirogane_ken', 'kotodama_tsue', 'shirogane_yoroi', 'inori_houi', 'kokoro_kagami', 'fuku_suzu'] },
    amatsu_dougu: { name: '天津京の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi'] },   // 道具屋と武具屋を分けた（ユーザー決定B）
    slum:   { name: '貧民区の繕い屋', items: ['kizugusuri', 'hoshiii', 'kurogane_katana', 'tsugihagi_kawa', 'dokuyoke', 'mezame_suzu'] },
    // 寄り道の拠点（js/data/maps/base_*.js）の店
    magane:    { name: 'マガネの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'iron_sword', 'hagane_ken', 'chain_mail', 'chikara_ude'] },
    iwakura:   { name: '城下の武具屋', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'hagane_ken', 'kurogane_katana', 'hagane_doumaru', 'kumoginu', 'kokoro_kagami'] },
    yachimata: { name: 'ヤチマタの茶屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'copper_knife', 'leather_armor', 'mamori_ishi', 'hayate_obi'] },
    kukunochi: { name: '森の薬屋', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'kashi_tsue', 'seirei_tsue', 'mori_koromo', 'dokuyoke', 'tama_no_o'] },
    ukihashi:  { name: '関所の店', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'iron_sword', 'leather_armor', 'chain_mail', 'mamori_ishi', 'mezame_suzu'] },
    inasa:     { name: 'イナサの店', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'kaze_tanto', 'juuhi_dougi', 'tsugihagi_kawa', 'hayate_obi'] },
    mizuho:    { name: '離宮の出入りの商人', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'shirogane_ken', 'kotodama_tsue', 'inori_houi', 'fuku_suzu'] },
    yata:      { name: '鴉族の市', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'tsukikage_obi', 'owashi_hane', 'kokoro_kagami'] },
    ohabari:   { name: '鬼の鍛冶場', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'onigane_tachi', 'onigane_yoroi', 'chikara_ude', 'inochi_ishi'] },
    // 魔界の市場：from の章からだけ並ぶ品がある（11章で戻ってきたとき）
    yomi:   { name: '魔界の市場', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'hoshiii', 'iron_sword', 'chain_mail', 'mamori_ishi', 'hayate_obi',
      { id: 'onigane_tachi', from: 11 }, { id: 'onigane_yoroi', from: 11 }, { id: 'tsukikage_obi', from: 11 }] },
  };
})();
