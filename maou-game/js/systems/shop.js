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

  // 並べる品（{ id, from } はその章から）
  const stock = shop => shop.items.filter(e => typeof e === 'string' || (G.state.chapter || 1) >= (e.from || 0)).map(e => (typeof e === 'string' ? e : e.id));
  function buyList(shop) {
    return stock(shop).map(id => ({
      label: G.DATA.items[id].name,
      note: `${price(id)}枚`,
      disabled: G.state.copper < price(id),
    }));
  }
  function sellList() {
    return G.state.items.map(s => {
      const key = G.DATA.items[s.id].type === 'key';
      return { label: `${G.DATA.items[s.id].name} ×${s.count}`, note: key ? '売れない' : `${sellPrice(s.id)}枚`, disabled: key };
    });
  }

  // 選んでいる品の説明（装備なら、能力と、オオナムチがいま着けている物）
  function drawInfo(id) {
    const it = G.DATA.items[id], r = G.renderer;
    if (!it) return;
    G.ui.drawWindow(8, 232, 464, 80);
    const equip = G.party.SLOTS.includes(it.type);
    const o = G.party.member('oonamuchi');
    const head = equip ? `${G.equipNote(it)}${o && o.equip[it.type] ? `　（いま：${G.DATA.items[o.equip[it.type]].name}）` : ''}` : '';
    const lines = [head, [equip ? G.equipEffects(it) : '', it.desc].filter(Boolean).join('　')].filter(Boolean);
    lines.flatMap(l => r.wrap(l, 440)).slice(0, 3).forEach((l, i) => r.text(l, 20, 242 + i * 20, i === 0 && equip ? '#ffd866' : '#fff'));
  }

  function openBuy(shop) {
    G.ui.choose(buyList(shop), {
      x: 8, y: 8, w: 300, title: '何を買いますか', stay: true, name: 'お店：買う', rows: 10,
      refresh: () => buyList(shop),
      extra: menu => { drawCopper(); drawInfo(stock(shop)[menu.index]); },
      onDisabled: () => G.message.show('銅貨が足りない。'),
    }, i => {
      const id = stock(shop)[i];
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
      onDisabled: () => G.message.show('これは手放せない。'),
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
          G.inhibit.rest();
          G.save.write('auto');
          G.message.show('ぐっすり休んだ。体の疲れがすっかり取れた。\n（自動で記録しました）');
        });
      });
    },
  };
})();
