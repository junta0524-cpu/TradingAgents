// このファイルの役目：歩数で敵と出会う（エンカウント）しくみ。
// マップの encounter に「何歩ごとか（steps）」と「出る敵の組（groups）」を書く。encounter がないマップでは出ない。
// 町・桟橋など（noEncounter のマス）では数えない。道（road）は半分だけ、草むらでは多めに数える。
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

  function groupsFor(enc, chOver) {
    if (!enc.byChapter) return enc.groups;
    const ch = chOver || G.state.chapter || 1;
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
  function moreFor(mapId, chOver) {
    const ch = chOver || G.state.chapter || 1;
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

  // 寄り道クエストのあいだだけ出る敵（js/data/sidequests/encounters.js）。あればマップの encounter の代わりに使う
  function sqEnc(mapId) {
    const q = G.sq && G.sq.active(), e = q && ((G.DATA.sqEncounters || {})[q] || {})[mapId];
    if (!e) return null;
    if (e.notWith && G.party.active().some(m => e.notWith.includes(m.id))) return { steps: e.steps, groups: [] };
    return e;
  }
  // エリア（js/data/areas.js）：いる所に一番近い印のエリアと、いまの章との差 gap（先のエリアほど大きい）。4〜9章と魔界の11章だけ
  function areaAt(mapId, x, y) {
    const list = (G.DATA.areas || {})[mapId], ch = G.state.chapter || 1;
    if (!list || x == null || ch >= 13 || ch === 10 || (mapId === 'world_ningen' && (ch < 4 || ch > 9)) || (mapId === 'world_makai' && ch !== 11)) return null;
    let best = null, bd = 1e9;
    list.forEach(a => { const d = (a.x - x) * (a.x - x) + (a.y - y) * (a.y - y); if (d < bd) { bd = d; best = a; } });
    if (!best) return null;
    return { area: best, gap: best.danger ? 3 : (best.tier || 0) - ch };
  }
  // エリアに合わせた組。先のエリアは、その章の強い敵。低いエリアは、いまの章の組に昔の敵も混ぜる
  function areaGroups(enc, mapId, ar) {
    const ch = G.state.chapter || 1, a = ar.area;
    let base;
    if (ar.gap >= 1 && a.tier) base = groupsFor(enc, a.tier) || [];
    else {
      // 章が進んでも、前の土地の敵の顔ぶれは変わらない（いまの章の組は、1つ前の土地までだけ混ぜる）
      base = a.tier && ar.gap < -1 ? (groupsFor(enc, a.tier) || []).slice() : (groupsFor(enc) || []).concat(a.tier && a.tier < ch ? (groupsFor(enc, a.tier) || []) : []);
    }
    let out = base.concat(moreFor(mapId, a.tier && ar.gap >= 1 ? a.tier : null), a.add || []);
    if (ar.gap >= 3 && a.risky) out = out.concat(a.risky, a.risky);   // 辺境は、桁違いの組が半分ほど
    return out;
  }
  const encOf = map => sqEnc(G.state.mapId) || map.encounter;

  G.encounter = {
    moreFor, rareFor, encOf, areaAt,
    enabled: true,   // デバッグで切り替える

    // マップに入ったとき：歩数を決め直す
    reset(map) {
      const enc = encOf(map);
      G.state.encounterSteps = enc ? nextSteps(enc) : null;
    },

    // 1歩歩いたとき：敵が出るなら、出る敵の組（id の配列）を返す
    step(map, tile, x, y) {
      const enc = encOf(map), sq = enc && enc !== map.encounter;
      if (!enc || !G.encounter.enabled || G.state.noEnc || (tile && tile.noEncounter)) return null;   // noEnc：寄り道クエストで敵を出さないとき
      // 結界張り：決まった歩数のあいだ、敵に出会わない
      if (G.state.barrier > 0) { G.state.barrier--; return null; }
      if (G.state.encounterSteps == null) G.state.encounterSteps = nextSteps(enc);
      G.state.encounterSteps -= (tile && tile.tallGrass) ? G.DATA.balance.TALL_GRASS_STEPS : (tile && tile.road) ? G.DATA.balance.ROAD_STEPS : 1;
      if (G.state.encounterSteps > 0) return null;
      G.state.encounterSteps = nextSteps(enc);
      const base = groupsFor(enc);
      if (!base || !base.length) return null;   // 敵の出ない章（10章の人間界など）は、足した敵も出さない
      if (sq) return base[G.rng.int(0, base.length - 1)].slice();   // 寄り道クエストの組は、そのまま（足す敵・めったに出ない敵は混ぜない）
      const rare = rareFor(G.state.mapId);
      if (rare) return rare.slice();
      const ar = areaAt(G.state.mapId, x, y);
      const groups = ar ? areaGroups(enc, G.state.mapId, ar) : base.concat(moreFor(G.state.mapId));
      return groups[G.rng.int(0, groups.length - 1)].slice();
    },
  };
})();
