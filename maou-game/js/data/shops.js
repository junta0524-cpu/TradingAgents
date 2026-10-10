// このファイルの役目：お店の品ぞろえ。値段は js/data/balance.js の PRICES。
// 町の人のデータに shop: 'お店の名前' と書くと、話しかけたあとにお店が開く。
(function () {
  const G = window.GAME = window.GAME || {};
  G.DATA = G.DATA || {};

  G.DATA.shops = {
    minamo: {
      name: 'ミナモの道具屋',
      items: ['kizugusuri', 'hoshiii', 'copper_knife', 'leather_armor', 'mamori_ishi', 'hayate_obi'],
    },
  };
})();
