// このファイルの役目：歩数で敵と出会う（エンカウント）しくみ。
// マップの encounter に「何歩ごとか（steps）」と「出る敵の組（groups）」を書く。encounter がないマップでは出ない。
// 道（noEncounter のマス）では数えない。草むらでは多めに数える。
// byChapter：章ごとに出る組を変える（{ 4: [...], 7: [...] } なら 4〜6章は4の組、7章からは7の組。空の配列なら出ない）。
(function () {
  const G = window.GAME = window.GAME || {};

  function nextSteps(enc) {
    const B = G.DATA.balance;
    let n = G.rng.int(enc.steps[0], enc.steps[1]);
    if (G.settings.encounter === 'low') n *= B.ENCOUNTER_LOW_MULT;
    return n;
  }

  function groupsFor(enc) {
    if (!enc.byChapter) return enc.groups;
    const ch = G.state.chapter || 1;
    const key = Object.keys(enc.byChapter).map(Number).filter(k => k <= ch).sort((a, b) => b - a)[0];
    return key != null ? enc.byChapter[key] : enc.groups;
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
      // 結界張り：決まった歩数のあいだ、敵に出会わない
      if (G.state.barrier > 0) { G.state.barrier--; return null; }
      if (G.state.encounterSteps == null) G.state.encounterSteps = nextSteps(enc);
      G.state.encounterSteps -= (tile && tile.tallGrass) ? G.DATA.balance.TALL_GRASS_STEPS : 1;
      if (G.state.encounterSteps > 0) return null;
      G.state.encounterSteps = nextSteps(enc);
      const groups = groupsFor(enc);
      if (!groups || !groups.length) return null;
      return groups[G.rng.int(0, groups.length - 1)].slice();
    },
  };
})();
