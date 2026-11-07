// このファイルの役目：四すくみの相性の計算。構え（オオナムチが最後に唱えた言霊の系統の種族）と、敵の種族（enemies の tribe）で倍率を決める。
// 相性が見えるのは、11章でスサノから四すくみを教わったあと（フラグ train_susa）。倍率そのものは、いつでも働く。
(function () {
  const G = window.GAME = window.GAME || {};
  const T = () => G.DATA.tribes;

  function tribeOfSys(sys) { return Object.keys(T()).find(k => T()[k].sys === sys) || null; }
  function tribeOf(unit) {
    if (!unit) return null;
    if (unit.side === 'enemy') return (G.DATA.enemies[unit.id] || {}).tribe || null;
    return unit.stance || null;
  }

  G.affinity = {
    known: () => !!G.flags.get('train_susa'),
    tribeOf,
    // その敵の弱点（その種族に強い種族）
    weakTo(tribe) { return Object.keys(T()).find(k => T()[k].beats === tribe) || null; },
    // 攻める側と受ける側の倍率
    mult(actor, target) {
      const a = tribeOf(actor), d = tribeOf(target);
      if (!a || !d || actor.side === target.side) return 1;
      const A = G.DATA.balance.AFFINITY;
      if (T()[a].beats === d) return A.STRONG;
      if (T()[d].beats === a) return A.WEAK;
      return 1;
    },
    // 言霊を唱えたとき：ベル以外の仲間は、その系統の構えになる。変わったら文を返す
    setStance(actor, kotodamaId) {
      const d = G.DATA.kotodama[kotodamaId];
      const ch = G.DATA.characters[actor.id];
      if (!d || actor.side !== 'party' || (ch && ch.isBell)) return null;
      const t = tribeOfSys(d.sys);
      if (!t || actor.stance === t) return null;
      actor.stance = t;
      return G.affinity.known() ? `${actor.name}は${T()[t].short}の構えになった。` : null;
    },
    // 倍率がかかったときの一言（構えは受けるときにも効く）
    note(m, actor) {
      if (!G.affinity.known() || m === 1) return null;
      if (actor && actor.side === 'enemy') return m > 1 ? '構えの相性が悪く、深く入った！' : '構えの相性で、受け流した。';
      return m > 1 ? '相性が良い！' : '相性が悪い……';
    },
  };
})();
