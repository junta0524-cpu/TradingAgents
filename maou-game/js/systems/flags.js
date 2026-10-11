// このファイルの役目：「フラグ」（宝箱を開けたか、イベントを見たか、などの覚え書き）を管理する。
// 名前を付けて ON/OFF を記録する。セーブ（フェーズ3）でこの中身をそのまま保存する。
(function () {
  const G = window.GAME = window.GAME || {};

  G.flags = {
    data: {},
    get(name) { return !!G.flags.data[name]; },
    set(name, on) {
      if (on === false) delete G.flags.data[name];
      else G.flags.data[name] = true;
    },
    toggle(name) { G.flags.set(name, !G.flags.get(name)); },
    reset() { G.flags.data = {}; },
    // 宝箱のフラグ名（マップ名＋宝箱の名前）
    chestKey(mapId, chestId) { return `chest:${mapId}:${chestId}`; },
    // 条件を満たすか（if：立っていること／unless：立っていないこと／chapter：その章のときだけ。数か配列）
    check(o) {
      if (!o) return true;
      if (o.if && !G.flags.get(o.if)) return false;
      if (o.unless && G.flags.get(o.unless)) return false;
      if (o.all && !o.all.every(f => G.flags.get(f))) return false;
      if (o.knows) {   // オオナムチがその言霊を覚えていること
        const m = G.state && G.state.party.find(p => p.id === 'oonamuchi');
        if (!m || !m.kotodama.includes(o.knows)) return false;
      }
      if (o.member && !(G.state && G.state.party.some(m => m.id === o.member))) return false;
      if (o.chapter != null) {
        const ch = (G.state && G.state.chapter) || 1;
        if (!([].concat(o.chapter)).includes(ch)) return false;
      }
      return true;
    },
  };
})();
