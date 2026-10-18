// このファイルの役目：歩数で敵と出会う（エンカウント）しくみ。
// マップの encounter に「何歩ごとか（steps）」と「出る敵の組（groups）」を書く。encounter がないマップでは出ない。
// 道（noEncounter のマス）では数えない。草むらでは多めに数える。
// byChapter：章ごとに出る組を変える（{ 4: [...], 7: [...] } なら 4〜6章は4の組、7章からは7の組。空の配列なら出ない）。
// その章の値を { byLevel: [{ from, groups }] } にすると、オオナムチのレベルで組が変わる（クリア後のやりこみ）。
// あとから増やした敵（js/data/enemies_more.js）：encounterMore の組をマップの組に足し、rares（白兎など）はその確率で先に選ぶ。
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
    const g = key != null ? enc.byChapter[key] : enc.groups;
    // { byLevel: [{ from: レベル, groups }] }：オオナムチのレベルで組を変える（クリア後のやりこみ）
    if (g && g.byLevel) {
      const m = G.party.member('oonamuchi'), lv = (m && m.lv) || 1;
      const tier = g.byLevel.filter(t => t.from <= lv).sort((a, b) => b.from - a.from)[0];
      return tier ? tier.groups : null;
    }
    return g;
  }

  const oonaLv = () => { const m = G.party.member('oonamuchi'); return (m && m.lv) || 1; };
  // あとから増やした敵の組（from／to：章、lv：オオナムチのレベル）
  function moreFor(mapId) {
    const ch = G.state.chapter || 1;
    return ((G.DATA.encounterMore || {})[mapId] || [])
      .filter(o => (o.from == null || ch >= o.from) && (o.to == null || ch <= o.to) && (o.lv == null || oonaLv() >= o.lv))
      .reduce((a, o) => a.concat(o.groups), []);
  }
  // めったに出ない敵（白兎など）：出会うたびに chance の確率
  function rareFor(mapId) {
    const ch = G.state.chapter || 1;
    const r = (G.DATA.rares || []).find(o => o.maps.includes(mapId) && ch >= (o.from || 1) && G.rng.chance(o.chance));
    return r ? r.groups[G.rng.int(0, r.groups.length - 1)] : null;
  }

  G.encounter = {
    moreFor, rareFor,
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
      const base = groupsFor(enc);
      if (!base || !base.length) return null;   // 敵の出ない章（10章の人間界など）は、足した敵も出さない
      const rare = rareFor(G.state.mapId);
      if (rare) return rare.slice();
      const groups = base.concat(moreFor(G.state.mapId));
      return groups[G.rng.int(0, groups.length - 1)].slice();
    },
  };
})();
