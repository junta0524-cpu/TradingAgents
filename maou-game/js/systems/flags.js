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
  };
})();
