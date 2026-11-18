// このファイルの役目：本編の行き先の光（ユーザー依頼：遊びやすく）。いまの目的（js/data/objectives.js）の unless のフラグを
// 立てる人・調べる所・踏む所をマップから探し、光らせる相手にする（目的の一覧に場所を書き足さなくてよい）。
// 光らせる描き方は寄り道クエストと同じ（js/systems/sidequest.js の G.sq.marks／draw）。寄り道クエストのあいだはそちらを使う。
(function () {
  const G = window.GAME = window.GAME || {};
  const cache = {};   // フラグ → { objs: Set（マップの人・調べる所・踏む所）, enter: [{ map, o }]（入ったときの場面） }

  // 場面（名前か命令の並び）が、そのフラグを立てるか（call・if・choice の中もたどる）
  function sets(ev, flag, seen) {
    if (typeof ev === 'string') {
      if (seen.has(ev)) return false;
      seen.add(ev);
      ev = (G.DATA.events || {})[ev];
    }
    if (!Array.isArray(ev)) return false;
    return ev.some(c => c && typeof c === 'object' && (
      (c.t === 'flag' && c.set === flag && c.value !== false) ||
      (c.t === 'call' && sets(c.id, flag, seen)) ||
      sets(c.then, flag, seen) || sets(c.else, flag, seen) ||
      (c.options || []).some(o => sets(o.then, flag, seen))));
  }
  function find(flag) {
    if (cache[flag]) return cache[flag];
    const r = { objs: new Set(), enter: [] };
    Object.entries(G.DATA.maps).forEach(([id, m]) => {
      ['npcs', 'spots', 'triggers'].forEach(k => (m[k] || []).forEach(o => {
        if (o.sqMark) return;
        if (o.doneFlag === flag || (o.event && sets(o.event, flag, new Set()))) r.objs.add(o);
      }));
      (m.onEnter || []).forEach(o => { if (o.event && sets(o.event, flag, new Set())) r.enter.push({ map: id, o }); });
    });
    // 言伝（ことだまから唱えると流れる場面）：唱える場所のマップを行き先にする
    (G.DATA.kotozute || []).forEach(k => { if (k.map && k.event && sets(k.event, flag, new Set())) r.enter.push({ map: k.map, o: k }); });
    return (cache[flag] = r);
  }
  // いまの本編の目的の光らせる相手（なければ null）
  // 1コマに1度だけ探す（マップの描画で何度も呼ばれるため）
  let curKey = null, cur = null;
  function current() {
    if (!G.state || G.state.sq || !G.objectiveRow) return null;
    if (curKey === G.frame) return cur;
    curKey = G.frame;
    const row = G.objectiveRow();
    return (cur = row && row.unless && row.guide !== false ? find(row.unless) : null);   // guide: false の行は光らせない
  }

  G.guide = {
    // 光の案内を出すとき（寄り道クエストのあいだ、または本編の目的に行き先があるとき）
    active: () => !!(G.settings.guide !== false && (G.sq.active() || current())),   // 設定「行き先の光」
    // その人・調べる所・踏む所が、いまの行き先か
    isGoal(o) {
      if (G.sq.active()) return !!o.sqMark;
      const c = current();
      return !!(c && c.objs.has(o));
    },
    // そのマップに入ること自体が行き先か（入ったときの場面で目的が済む）
    mapIsGoal(mapId) {
      const c = !G.sq.active() && current();
      return !!(c && c.enter.some(e => e.map === mapId && G.flags.check(e.o)));
    },
  };
})();
