// このファイルの役目：お店と宿屋の「やりとり」（買う・売る・泊まる）。
// 品ぞろえは js/data/shops.js、値段は balance.js の PRICES と INN_PRICE。
(function () {
  const G = window.GAME = window.GAME || {};
  const B = () => G.DATA.balance;

  const price = id => B().PRICES[id] || 0;
  const sellPrice = id => Math.floor(price(id) * B().SELL_RATE);

  // 所持金の窓
  function drawCopper() {
    G.ui.drawWindow(352, 8, 120, 28);
    G.renderer.text(`銅貨 ${G.state.copper}枚`, 462, 16, '#fff', 'right');
  }

  function buyList(shop) {
    return shop.items.map(id => ({
      label: G.DATA.items[id].name,
      note: `${price(id)}枚`,
      disabled: G.state.copper < price(id),
    }));
  }
  function sellList() {
    return G.state.items.map(s => ({ label: `${G.DATA.items[s.id].name} ×${s.count}`, note: `${sellPrice(s.id)}枚` }));
  }

  function openBuy(shop) {
    G.ui.choose(buyList(shop), {
      x: 8, y: 8, w: 300, title: '何を買いますか', stay: true, name: 'お店：買う',
      refresh: () => buyList(shop),
      extra: drawCopper,
      onDisabled: () => G.message.show('銅貨が足りない。'),
    }, i => {
      const id = shop.items[i];
      G.state.copper -= price(id);
      G.party.addItem(id);
      G.message.show(`${G.DATA.items[id].name}を買った。`);
    });
  }
  function openSell() {
    if (!G.state.items.length) { G.message.show('売れる物を持っていない。'); return; }
    G.ui.choose(sellList(), {
      x: 8, y: 8, w: 300, title: '何を売りますか', stay: true, name: 'お店：売る', rows: 12,
      refresh: sellList,
      extra: drawCopper,
    }, i => {
      const s = G.state.items[i];
      if (!s) return;
      const name = G.DATA.items[s.id].name, got = sellPrice(s.id);
      G.party.removeItem(s.id);
      G.party.addCopper(got);
      G.message.show(`${name}を銅貨${got}枚で売った。`);
      if (!G.state.items.length) G.scene.pop();
    });
  }

  G.shop = {
    price, sellPrice,
    open(shopId) {
      const shop = G.DATA.shops[shopId];
      G.ui.choose([{ label: '買う' }, { label: '売る' }, { label: 'やめる' }], {
        x: 8, y: 8, w: 120, title: shop.name, stay: true, name: 'お店', extra: drawCopper,
      }, i => {
        if (i === 0) openBuy(shop);
        else if (i === 1) openSell();
        else G.scene.pop();
      });
    },
    // 宿屋：泊まると全員の体力とMPが戻り、自動で記録する
    inn(onSleep) {
      const cost = B().INN_PRICE;
      G.ui.confirm(`一晩、銅貨${cost}枚です。泊まりますか？`, () => {
        if (G.state.copper < cost) { G.message.show('銅貨が足りないようですね。'); return; }
        G.state.copper -= cost;
        if (onSleep) onSleep(() => {
          G.party.healAll();
          G.save.write('auto');
          G.message.show('ぐっすり休んだ。体の疲れがすっかり取れた。\n（自動で記録しました）');
        });
      });
    },
  };
})();
