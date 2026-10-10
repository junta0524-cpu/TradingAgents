// このファイルの役目：プレイヤー側の「いまの状態」（いる場所・仲間の体力・持ち物・銅貨）を持つ。
// 「直前の記録」もここ。ゲームオーバーになると、この記録まで戻る。
// （本格的なセーブはフェーズ3。それまでは町や建物に入るたびに、自動で記録する）
(function () {
  const G = window.GAME = window.GAME || {};

  const clone = o => JSON.parse(JSON.stringify(o));

  // 仲間1人ぶんの、最初の状態
  function makeMember(stats) {
    const c = G.DATA.characters[stats.id];
    return {
      id: stats.id, name: c.name,
      hp: stats.hp, maxHp: stats.hp, mp: stats.mp, maxMp: stats.mp,
      atk: stats.atk, def: stats.def, agi: stats.agi, exp: 0,
    };
  }

  let record = null;

  G.party = {
    newGame() {
      const B = G.DATA.balance;
      const start = B.START;
      G.state = {
        mapId: start.map,
        x: start.x, y: start.y, dir: start.dir,
        copper: start.copper,
        items: [],        // [{ id, count }]
        party: B.PARTY.map(makeMember),
        encounterSteps: null,
      };
      G.flags.reset();
      G.party.saveRecord();
    },
    // 自動戦闘などで使う、満タンの仲間
    freshMembers() {
      return G.state.party.map(m => Object.assign(clone(m), { hp: m.maxHp, mp: m.maxMp }));
    },
    addItem(id, count) {
      count = count || 1;
      const slot = G.state.items.find(s => s.id === id);
      if (slot) slot.count += count;
      else G.state.items.push({ id, count });
    },
    addCopper(n) { G.state.copper += n; },
    healAll() {
      G.state.party.forEach(m => { m.hp = m.maxHp; m.mp = m.maxMp; });
    },

    // ---- 直前の記録 ----
    saveRecord() {
      record = { state: clone(G.state), flags: clone(G.flags.data) };
    },
    hasRecord() { return !!record; },
    // 記録まで戻る（遊びやすさのため、体力は満タンにして戻す）
    loadRecord() {
      G.state = clone(record.state);
      G.flags.data = clone(record.flags);
      G.party.healAll();
    },
  };
})();
