// このファイルの役目：作戦（AI）。「うまくやって」の仲間が、自分の番に何をするか決める。
// 仕様書どおり、AIは道具を使わない。言霊は覚えていてMPが足りるものだけ。
// 作戦の一覧は TACTICS。作戦ごとの違いは STYLE（回復する体力の目安、攻めの言霊を使うか、MPを惜しむか）。
(function () {
  const G = window.GAME = window.GAME || {};

  const TACTICS = [
    { id: 'auto',    name: 'うまくやって' },
    { id: 'manual',  name: 'ぜんぶ指示する' },
    { id: 'attack',  name: 'どんどん攻めて' },
    { id: 'heal',    name: '回復まかせた' },
    { id: 'save',    name: 'MP節約で' },
    { id: 'life',    name: 'いのち優先' },
  ];
  // low：この割合より体力が少ない仲間を回復する／damage：攻めの言霊を使う／aoeMp：全体攻撃はMPがこの割合より多いとき
  // cheap：回復は安い言霊から／guard：自分が危ないとき、回復できなければ身を守る
  const STYLE = {
    auto:   { low: 0.35, damage: true,  aoeMp: 0.4, cure: true },
    attack: { low: 0.2,  damage: true,  aoeMp: 0.1, cure: false, strong: true },
    heal:   { low: 0.7,  damage: false, aoeMp: 1.1, cure: true },
    save:   { low: 0.25, damage: false, aoeMp: 1.1, cure: false, cheap: true },
    life:   { low: 0.5,  damage: true,  aoeMp: 0.5, cure: true, guard: true },
  };
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
    // ベルは自分からは力を使わない（阻害ゲージを守る）。抑えた打撃だけ
    if ((G.DATA.characters[actor.id] || {}).isBell) {
      // クリア後：倒れた仲間がいれば、生き返しで起こす
      const down = st.party.find(p => p.hp <= 0);
      if (G.state && G.state.cleared && down) {
        const rv = usable(actor, k => k.effect.kind === 'revive' && k.target === 'fallen');
        if (rv.length) return { type: 'kotodama', id: rv[0].id, target: down };
      }
      return { type: 'attack', target: foes.slice().sort((a, b) => a.hp - b.hp)[0] };
    }

    const sty = STYLE[actor.tactic] || STYLE.auto;
    // 1) 危ない仲間がいれば回復（複数なら全体回復を優先）
    const weak = allies.filter(p => p.hp / p.maxHp < sty.low).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
    if (weak.length) {
      const heals = usable(actor, k => k.effect.kind === 'heal');
      const group = heals.filter(o => o.k.target === 'allies');
      if (weak.length >= 2 && group.length) return { type: 'kotodama', id: group[0].id };
      const single = heals.filter(o => o.k.target === 'ally')
        .sort((a, b) => healAmount(a.k) - healAmount(b.k));
      const need = weak[0].maxHp - weak[0].hp;
      const pick = sty.cheap ? single[0] : (single.find(o => healAmount(o.k) >= need) || single[single.length - 1]);
      if (pick) return { type: 'kotodama', id: pick.id, target: weak[0] };
    }

    // いのち優先：自分が危なく、回復もできなければ身を守る
    if (sty.guard && actor.hp / actor.maxHp < 0.3) return { type: 'defend' };

    // 2) 状態異常の仲間を治す
    for (const p of (sty.cure ? allies : [])) {
      const bad = BAD.filter(s => G.status.has(p, s));
      if (!bad.length) continue;
      const cure = usable(actor, k => k.effect.kind === 'cure' && bad.some(s => k.effect.statuses.includes(s)));
      if (cure.length) return { type: 'kotodama', id: cure[0].id, target: p };
      const calm = bad.includes('confuse') && usable(actor, k => k.effect.kind === 'mind');
      if (calm && calm.length) return { type: 'kotodama', id: calm[0].id, target: p };
    }

    // 3) 敵が多いときは、MPに余裕があれば全体攻撃の言霊
    if (sty.damage && foes.length >= 2 && actor.mp > actor.maxMp * sty.aoeMp) {
      const aoe = usable(actor, k => k.effect.kind === 'damage' && k.target === 'enemies');
      if (aoe.length) return { type: 'kotodama', id: aoe[0].id };
    }
    // どんどん攻めて：一番強い単体の攻めの言霊
    if (sty.strong) {
      const single = usable(actor, k => k.effect.kind === 'damage' && k.target === 'enemy')
        .sort((a, b) => b.k.effect.power[1] - a.k.effect.power[1]);
      if (single.length) return { type: 'kotodama', id: single[0].id, target: foes.slice().sort((a, b) => a.hp - b.hp)[0] };
    }

    // 4) いちばん弱っている敵を打つ
    const target = foes.slice().sort((a, b) => a.hp - b.hp)[0];
    return { type: 'attack', target };
  }

  G.ai = { TACTICS, STYLE, decide };
})();
