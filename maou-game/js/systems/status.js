// このファイルの役目：状態異常（眠り・混乱・口封じ・縛り・毒・猛毒・朧）のしくみ。
// かかる・治る・ターンごとに減る・行動の前に止められる、をここでまとめて扱う。
// 名前や文は js/data/status.js、ターン数や確率は balance.js の STATUS。
(function () {
  const G = window.GAME = window.GAME || {};
  const S = () => G.DATA.balance.STATUS;
  const D = id => G.DATA.status[id];

  function has(u, id) { return !!(u.status && u.status[id]); }
  function list(u) { return u.status ? Object.keys(u.status) : []; }

  // 効きやすさ（敵の resist。味方は心鎮めで混乱を防ぐ）
  function resistOf(u, id) {
    if (u.side === 'enemy') {
      const d = G.DATA.enemies[u.id];
      if (d && d.resist && d.resist[id] != null) return d.resist[id];
    }
    return 1;
  }

  // 状態異常にする（chance は 0〜1）。起きたことを返す
  function inflict(u, id, chance) {
    const ev = [];
    if (u.hp <= 0) return ev;
    if (u.mind > 0 && S().MIND_GUARD.includes(id)) {
      ev.push({ type: 'msg', text: `${u.name}は心を鎮めていて、惑わされなかった。` });
      return ev;
    }
    const p = chance * resistOf(u, id);
    if (has(u, id) || !G.rng.chance(p)) {
      ev.push({ type: 'msg', text: `${u.name}には効かなかった。` });
      return ev;
    }
    u.status = u.status || {};
    if (id === 'poison') u.status.poison = true;
    else {
      const t = S().TURNS[id];
      u.status[id] = G.rng.int(t[0], t[1]);
    }
    if (id === 'venom') delete u.status.poison;
    ev.push({ type: 'status', target: u, status: id });
    ev.push({ type: 'msg', text: u.name + D(id).on });
    return ev;
  }

  // 治す
  function cure(u, ids) {
    const ev = [];
    let any = false;
    ids.forEach(id => {
      if (!has(u, id)) return;
      delete u.status[id];
      any = true;
      ev.push({ type: 'msg', text: u.name + D(id).off });
    });
    if (!any) ev.push({ type: 'msg', text: `${u.name}には、治すものがなかった。` });
    return ev;
  }

  // 行動の前：眠り・縛りなら動けない。混乱なら勝手に動く
  function beforeAct(u) {
    if (has(u, 'sleep')) return { skip: true, ev: [{ type: 'msg', text: u.name + D('sleep').still }] };
    if (has(u, 'bind')) return { skip: true, ev: [{ type: 'msg', text: u.name + D('bind').still }] };
    if (has(u, 'confuse')) return { confused: true, ev: [{ type: 'msg', text: u.name + D('confuse').still }] };
    return { ev: [] };
  }

  // 打たれたとき：眠っていたら、目が覚めることがある
  function onPhysicalHit(u) {
    if (!has(u, 'sleep') || u.hp <= 0) return [];
    const p = S().WAKE_ON_HIT[u.side === 'party' ? 'party' : 'enemy'];
    if (!G.rng.chance(p)) return [];
    delete u.status.sleep;
    return [{ type: 'msg', text: u.name + D('sleep').off }];
  }

  // ラウンドの終わり：猛毒のダメージ、残りターンを減らす
  function tickRound(u, st) {
    const ev = [];
    if (u.hp <= 0 || !u.status) return ev;
    if (has(u, 'venom')) {
      const dmg = Math.max(1, Math.floor(u.maxHp * S().VENOM_RATE));
      const saved = G.battle.applyDamage(st, u, dmg);
      ev.push({ type: 'damage', target: u, amount: dmg });
      ev.push({ type: 'msg', text: `猛毒が${u.name}を蝕む。${dmg} のダメージ。` });
      if (saved) ev.push({ type: 'msg', text: saved }, { type: 'inhibit' });
      if (u.hp === 0) {
        ev.push({ type: 'ko', target: u });
        ev.push({ type: 'msg', text: u.side === 'enemy' ? `${u.name}を倒した。` : `${u.name}は倒れた……。` });
        return ev;
      }
    }
    Object.keys(u.status).forEach(id => {
      if (id === 'poison' || id === 'venom') return;
      if (--u.status[id] <= 0) {
        delete u.status[id];
        ev.push({ type: 'msg', text: u.name + D(id).off });
      }
    });
    return ev;
  }

  // 戦いが終わったら：毒だけ残す（猛毒は毒になる）
  function afterBattle(m) {
    if (!m.status) return;
    const poisoned = m.status.poison || m.status.venom;
    m.status = poisoned ? { poison: true } : {};
    if (!poisoned) delete m.status;
  }

  // 移動中の1歩：毒ならHPが減る（1より下にはならない）。減った人の名前を返す
  function fieldStep() {
    const hurt = [];
    G.state.party.forEach(m => {
      if (!has(m, 'poison') || m.hp <= 1) return;
      m.hp = Math.max(1, m.hp - S().POISON_STEP_DAMAGE);
      hurt.push(m);
    });
    return hurt;
  }

  // 画面に出す、状態異常の印（例：「眠毒」）
  function tags(u) { return list(u).map(id => D(id).tag).join(''); }

  G.status = { has, list, inflict, cure, beforeAct, onPhysicalHit, tickRound, afterBattle, fieldStep, tags, resistOf };
})();
