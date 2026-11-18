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
    // 寄り道の拠点（js/data/maps/base_*.js）の店。どの拠点にも道具屋と武具屋があり、最後の品がその拠点だけの品（ユーザー依頼）
    // 新しく足した店の部屋は js/data/maps/rooms_shops3.js
    // 人間界
    magane:         { name: 'マガネの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'hiuchi_tsubute'] },
    magane_bugu:    { name: 'マガネの武具屋', items: ['iron_sword', 'hagane_ken', 'chain_mail', 'chikara_ude', 'tsuruhashi'] },
    iwakura_dougu:  { name: '城下の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'hyourougan'] },
    iwakura:        { name: '城下の武具屋', items: ['hagane_ken', 'kurogane_katana', 'hagane_doumaru', 'kumoginu', 'kokoro_kagami', 'ooshitate'] },
    yachimata:      { name: 'ヤチマタの茶屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'yado_nigiri'] },
    yachimata_bugu: { name: 'ヤチマタの武具屋', items: ['copper_knife', 'leather_armor', 'mamori_ishi', 'hayate_obi', 'kyahan'] },
    kukunochi:      { name: '森の薬屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'mori_reiyaku'] },
    kukunochi_bugu: { name: 'ククノチの武具屋', items: ['kashi_tsue', 'seirei_tsue', 'mori_koromo', 'dokuyoke', 'tama_no_o', 'kusu_tsue'] },
    ukihashi_dougu: { name: 'ウキハシの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'kiduke'] },
    ukihashi:       { name: 'ウキハシの武具屋', items: ['iron_sword', 'leather_armor', 'chain_mail', 'mamori_ishi', 'mezame_suzu', 'sekimori_kote'] },
    inasa_dougu:    { name: 'イナサの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'miru_shiru'] },
    inasa:          { name: 'イナサの武具屋', items: ['kaze_tanto', 'juuhi_dougi', 'tsugihagi_kawa', 'hayate_obi', 'samekawa'] },
    takama_dougu:   { name: 'タカマの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'kiyome_shio'] },
    takama_bugu:    { name: 'タカマの武具屋', items: ['shirogane_ken', 'shirogane_yoroi', 'kokoro_kagami', 'mezame_suzu', 'yashiromori_hire'] },
    mizuho_dougu:   { name: '離宮の道具商人', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'kanro'] },
    mizuho:         { name: '離宮の武具商人', items: ['shirogane_ken', 'kotodama_tsue', 'inori_houi', 'fuku_suzu', 'tamakazura'] },
    // 魔界
    yata_dougu:     { name: '鴉族の道具市', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'nemuri_hane'] },
    yata:           { name: '鴉族の武具市', items: ['tsukikage_obi', 'owashi_hane', 'kokoro_kagami', 'karasuba'] },
    ohabari_dougu:  { name: 'オハバリの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'oni_sake'] },
    ohabari:        { name: '鬼の鍛冶場', items: ['onigane_tachi', 'onigane_yoroi', 'chikara_ude', 'inochi_ishi', 'kanasai'] },
    hirasaka_dougu: { name: 'ヒラサカの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'oho_momo'] },
    hirasaka_bugu:  { name: 'ヒラサカの武具屋', items: ['onigane_tachi', 'onigane_yoroi', 'inori_houi', 'momo_bokutou'] },
    nezumi_dougu:   { name: '抜け穴の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'hora_tsuchi'] },
    nezumi_bugu:    { name: '抜け穴の武具屋', items: ['kurogane_katana', 'tsugihagi_kawa', 'owashi_hane', 'dokuyoke', 'narikabura'] },
    chibiki_dougu:  { name: 'チビキ岩の道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'chibiki_ishiko'] },
    chibiki_bugu:   { name: 'チビキ岩の武具屋', items: ['onigane_tachi', 'onigane_yoroi', 'inochi_ishi', 'chibiki_yoroi'] },
    yominohara_dougu: { name: 'ヨミノハラの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'yomi_izumi'] },
    yominohara_bugu:  { name: 'ヨミノハラの武具屋', items: ['kotodama_tsue', 'inori_houi', 'tsukikage_obi', 'yomi_kushiro'] },
    iwayato_dougu:  { name: 'イワヤトの道具屋', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'iwaya_akari'] },
    iwayato_bugu:   { name: 'イワヤトの武具屋', items: ['onigane_tachi', 'onigane_yoroi', 'tsukikage_obi', 'iwaya_kagami'] },
    // 魔界の市場：from の章からだけ並ぶ品がある（11章で戻ってきたとき）
    yomi:   { name: '魔界の市場', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'hoshiii', 'iron_sword', 'chain_mail', 'mamori_ishi', 'hayate_obi',
      { id: 'onigane_tachi', from: 11 }, { id: 'onigane_yoroi', from: 11 }, { id: 'tsukikage_obi', from: 11 }] },
  };
})();
