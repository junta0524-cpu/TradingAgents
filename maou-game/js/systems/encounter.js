// このファイルの役目：歩数で敵と出会う（エンカウント）しくみ。
// マップの encounter に「何歩ごとか（steps）」と「出る敵の組（groups）」を書く。encounter がないマップでは出ない。
// 道（noEncounter のマス）では数えない。草むらでは多めに数える。
(function () {
  const G = window.GAME = window.GAME || {};

  function nextSteps(enc) {
    const B = G.DATA.balance;
    let n = G.rng.int(enc.steps[0], enc.steps[1]);
    if (G.settings.encounter === 'low') n *= B.ENCOUNTER_LOW_MULT;
    return n;
  }

  G.encounter = {
    enabled: true,   // デバッグで切り替える

    // マップに入ったとき：歩数を決め直す
    reset(map) {
      G.state.encounterSteps = map.encounter ? nextSteps(map.encounter) : null;
    },

    // 1歩歩いたとき：敵が出るなら、出る敵の組（id の配列）を返す
    step(map, tile) {
      const enc = map.encounter;
      if (!enc || !G.encounter.enabled || (tile && tile.noEncounter)) return null;
      if (G.state.encounterSteps == null) G.state.encounterSteps = nextSteps(enc);
      G.state.encounterSteps -= (tile && tile.tallGrass) ? G.DATA.balance.TALL_GRASS_STEPS : 1;
      if (G.state.encounterSteps > 0) return null;
      G.state.encounterSteps = nextSteps(enc);
      return enc.groups[G.rng.int(0, enc.groups.length - 1)].slice();
    },
  };
})();
