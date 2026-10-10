// このファイルの役目：作戦（AI）。「うまくやって」の仲間が、自分の番に何をするか決める。
// 仕様書どおり、AIは道具を使わない。言霊は覚えていてMPが足りるものだけ。
// 作戦の一覧は TACTICS。今動くのは「うまくやって」と「ぜんぶ指示する」（ほかはフェーズ10で作る）。
(function () {
  const G = window.GAME = window.GAME || {};

  const TACTICS = [
    { id: 'auto',    name: 'うまくやって' },
    { id: 'manual',  name: 'ぜんぶ指示する' },
    { id: 'attack',  name: 'どんどん攻めて',  later: true },
    { id: 'heal',    name: '回復まかせた',    later: true },
    { id: 'save',    name: 'MP節約で',        later: true },
    { id: 'life',    name: 'いのち優先',      later: true },
  ];
  const LOW_HP = 0.35;        // この割合より体力が少ない仲間を「危ない」とみなす
  const BAD = ['sleep', 'bind', 'confuse', 'venom', 'poison', 'silence'];

  // その人が今使える言霊で、条件に合うもの
  function usable(actor, test) {
    if (G.status.has(actor, 'silence')) return [];
    return (actor.kotodama || [])
      .map(id => ({ id, k: G.DATA.kotodama[id] }))
      .filter(o => G.kotodama.usableIn(o.k, 'battle') && actor.mp >= o.k.mp && test(o.k));
  }
  const healAmount = k => (k.effect.full ? 999 : (k.effect.power[0] + k.effect.power[1]) / 2);

  function decide(st, actor) {
    const allies = st.party.filter(p => p.hp > 0);
    const foes = st.enemies.filter(e => e.hp > 0);
    if (!foes.length) return { type: 'defend' };

    // 1) 危ない仲間がいれば回復（複数なら全体回復を優先）
    const weak = allies.filter(p => p.hp / p.maxHp < LOW_HP).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    if (weak.length) {
      const heals = usable(actor, k => k.effect.kind === 'heal');
      const group = heals.filter(o => o.k.target === 'allies');
      if (weak.length >= 2 && group.length) return { type: 'kotodama', id: group[0].id };
      const single = heals.filter(o => o.k.target === 'ally')
        .sort((a, b) => healAmount(a.k) - healAmount(b.k));
      const need = weak[0].maxHp - weak[0].hp;
      const pick = single.find(o => healAmount(o.k) >= need) || single[single.length - 1];
      if (pick) return { type: 'kotodama', id: pick.id, target: weak[0] };
    }

    // 2) 状態異常の仲間を治す
    for (const p of allies) {
      const bad = BAD.filter(s => G.status.has(p, s));
      if (!bad.length) continue;
      const cure = usable(actor, k => k.effect.kind === 'cure' && bad.some(s => k.effect.statuses.includes(s)));
      if (cure.length) return { type: 'kotodama', id: cure[0].id, target: p };
      const calm = bad.includes('confuse') && usable(actor, k => k.effect.kind === 'mind');
      if (calm && calm.length) return { type: 'kotodama', id: calm[0].id, target: p };
    }

    // 3) 敵が多いときは、MPに余裕があれば全体攻撃の言霊
    if (foes.length >= 2 && actor.mp > actor.maxMp * 0.4) {
      const aoe = usable(actor, k => k.effect.kind === 'damage' && k.target === 'enemies');
      if (aoe.length) return { type: 'kotodama', id: aoe[0].id };
    }

    // 4) いちばん弱っている敵を打つ
    const target = foes.slice().sort((a, b) => a.hp - b.hp)[0];
    return { type: 'attack', target };
  }

  G.ai = { TACTICS, decide };
})();
