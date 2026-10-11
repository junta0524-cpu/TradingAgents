// このファイルの役目：お店の品ぞろえ。値段は js/data/balance.js の PRICES。
// 町の人のデータに shop: 'お店の名前' と書くと、話しかけたあとにお店が開く。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.shops = {
    minamo: {
      name: 'ミナモの道具屋',
      items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'copper_knife', 'leather_armor', 'mamori_ishi', 'hayate_obi'],
    },
    hijiri: { name: '森の市', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'copper_knife', 'leather_armor', 'mamori_ishi'] },
    ro:     { name: '炉ヶ岳の工房', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'iron_sword', 'chain_mail', 'hayate_obi'] },
    yomi:   { name: '魔界の市場', items: ['kizugusuri', 'dokukeshi', 'mezamashi', 'hoshiii', 'iron_sword', 'chain_mail', 'mamori_ishi', 'hayate_obi'] },
    kuzu:   { name: '葛の里の店', items: ['kizugusuri', 'hoshiii', 'dokukeshi', 'mezamashi', 'chain_mail', 'hayate_obi'] },
  };
})();
