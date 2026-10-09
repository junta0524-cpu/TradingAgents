// このファイルの役目：プレイヤー側の「いまの状態」（いるマップ・位置・持ち物・お金）を持つ。
// 仲間の能力値や隊列はフェーズ2〜4でここに足していく。
(function () {
  const G = window.GAME = window.GAME || {};

  G.party = {
    newGame() {
      const start = G.DATA.balance.START;
      G.state = {
        mapId: start.map,
        x: start.x, y: start.y, dir: start.dir,
        gold: start.gold,
        items: [],        // [{ id, count }]
      };
      G.flags.reset();
    },
    addItem(id, count) {
      count = count || 1;
      const slot = G.state.items.find(s => s.id === id);
      if (slot) slot.count += count;
      else G.state.items.push({ id, count });
    },
    addGold(n) { G.state.gold += n; },
  };
})();
