// このファイルの役目：お店の品ぞろえ。値段は js/data/balance.js の PRICES。
// 町の人のデータに shop: 'お店の名前' と書くと、話しかけたあとにお店が開く。品は id か { id, from: 章 }（その章から並ぶ）。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.shops = {
    minamo: {
      name: 'ミナモの道具屋',
      items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'copper_knife', 'kashi_tsue', 'leather_armor', 'mamori_ishi', 'hayate_obi', 'dokuyoke'],
    },
    hijiri: { name: '森の市', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'seirei_tsue', 'copper_knife', 'mori_koromo', 'leather_armor', 'mezame_suzu', 'tama_no_o'] },
    ro:     { name: '炉ヶ岳の工房', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'iron_sword', 'chain_mail', 'hagane_doumaru', 'chikara_ude', 'inochi_ishi', 'hayate_obi'] },
    kuzu:   { name: '葛の里の店', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'kaze_tanto', 'juuhi_dougi', 'chain_mail', 'kokoro_kagami', 'hayate_obi'] },
    amatsu: { name: '天津京の武具屋', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'shirogane_ken', 'kotodama_tsue', 'shirogane_yoroi', 'inori_houi', 'kokoro_kagami', 'fuku_suzu'] },
    slum:   { name: '貧民区の繕い屋', items: ['kizugusuri', 'hoshiii', 'kurogane_katana', 'tsugihagi_kawa', 'dokuyoke', 'mezame_suzu'] },
    // 魔界の市場：from の章からだけ並ぶ品がある（11章で戻ってきたとき）
    yomi:   { name: '魔界の市場', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'hoshiii', 'iron_sword', 'chain_mail', 'mamori_ishi', 'hayate_obi',
      { id: 'onigane_tachi', from: 11 }, { id: 'onigane_yoroi', from: 11 }, { id: 'tsukikage_obi', from: 11 }] },
  };
})();
