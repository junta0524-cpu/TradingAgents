// このファイルの役目：戦闘の「計算」だけを受け持つ（画面は js/scenes/battle.js）。
// ダメージ・会心・行動順・逃走・狙われ率は、仕様書 第6章の式どおり。数字は balance.js の BATTLE。
// 画面と切り離してあるので、デバッグの「自動で100回戦闘」でもそのまま使える。
(function () {
  const G = window.GAME = window.GAME || {};

  const B = () => G.DATA.balance.BATTLE;
  const LETTERS = 'ＡＢＣＤＥ';

  // 物理ダメージ。基本＝(攻撃力−守備力/2)/2、乱数幅＝基本/16+1、基本が2未満なら0〜1
  function calcPhysical(atk, def, opts) {
    opts = opts || {};
    const rng = G.rng;
    const crit = !opts.noCrit && rng.chance(B().CRIT_RATE);
    let base, width, dmg;
    if (crit) {
      // 会心：守備力を無視して攻撃力相当
      base = atk;
      width = Math.floor(atk / 16) + 1;
      dmg = base + rng.int(-width, width);
    } else {
      base = (atk - def / 2) / 2;
      if (base < 2) {
        width = 0;
        dmg = rng.int(0, 1);
      } else {
        width = Math.floor(base / 16) + 1;
        dmg = Math.floor(base) + rng.int(-width, width);
      }
    }
    dmg = Math.max(0, dmg);
    return { dmg, crit, base, width, atk, def };
  }

  // 行動順：素早さ×乱数。大きい順、同じなら味方が先
  function turnOrder(actors) {
    const b = B();
    return actors
      .filter(a => a.hp > 0)
      .map(a => ({ a, v: a.agi * G.rng.range(b.ORDER_RAND_MIN, b.ORDER_RAND_MAX) }))
      .sort((x, y) => (y.v - x.v) || ((x.a.side === 'party' ? 0 : 1) - (y.a.side === 'party' ? 0 : 1)))
      .map(o => o.a);
  }

  // 敵が狙う味方を選ぶ（前列ほど狙われやすい）
  function pickPartyTarget(party) {
    const alive = party.filter(p => p.hp > 0);
    const w = B().TARGET_WEIGHTS.slice(0, alive.length);
    const total = w.reduce((s, x) => s + x, 0);
    let r = G.rng.random() * total;
    for (let i = 0; i < alive.length; i++) { r -= w[i]; if (r < 0) return alive[i]; }
    return alive[alive.length - 1];
  }

  function escapeChance(tries) {
    const t = B().ESCAPE_CHANCE;
    return t[Math.min(tries, t.length - 1)];
  }

  // 戦闘の状態を作る。party は G.state.party の仲間（HPはそのまま書き換える）
  function create(partyMembers, enemyIds, opts) {
    opts = opts || {};
    const counts = {};
    enemyIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const seen = {};
    const enemies = enemyIds.map((id, i) => {
      const d = G.DATA.enemies[id];
      seen[id] = (seen[id] || 0) + 1;
      const suffix = counts[id] > 1 ? LETTERS[seen[id] - 1] : '';
      return {
        key: 'e' + i, id, side: 'enemy', name: d.name + suffix,
        hp: d.hp, maxHp: d.hp, atk: d.atk, def: d.def, agi: d.agi, defending: false,
      };
    });
    const party = partyMembers.map(m => Object.assign(m, { side: 'party', defending: false }));
    return {
      party, enemies, escapeTries: 0, boss: !!opts.boss,
      showCalc: !!opts.showCalc, lastKilled: null, turn: 0,
    };
  }

  const aliveEnemies = st => st.enemies.filter(e => e.hp > 0);
  const charOf = m => G.DATA.characters[m.id] || {};

  // ダメージを与える。ベルは倒れない（HPは1で止まる）
  function applyDamage(st, target, amount) {
    let hp = target.hp - amount;
    if (target.side === 'party' && charOf(target).isBell && hp < 1) hp = 1;
    target.hp = Math.max(0, hp);
    if (target.hp === 0 && target.side === 'enemy' && st) st.lastKilled = target;
  }

  // 1人ぶんの行動を行い、起きたこと（events）を返す
  // cmd：{ type: 'attack', target } / { type: 'defend' } / { type: 'kotodama', id, target } / { type: 'item', id, target }
  function act(st, actor, cmd) {
    const ev = [];
    if (actor.hp <= 0) return ev;

    if (actor.side === 'enemy') {
      const target = pickPartyTarget(st.party);
      if (!target) return ev;
      return attack(st, actor, target, ev);
    }
    if (cmd.type === 'defend') {
      ev.push({ type: 'msg', text: `${actor.name}は身を守っている。` });
      return ev;
    }
    if (cmd.type === 'kotodama') return G.kotodama.cast(actor, cmd.id, cmd.target, st);
    if (cmd.type === 'item') return G.kotodama.useItem(actor, cmd.id, cmd.target, st);
    // 攻撃：狙った敵が倒れていたら、別の敵へ
    let target = cmd.target;
    if (!target || target.hp <= 0) target = aliveEnemies(st)[0];
    if (!target) return ev;
    return attack(st, actor, target, ev);
  }

  function attack(st, actor, target, ev) {
    ev.push({ type: 'msg', text: `${actor.name}の攻撃！` });
    const atk = Math.floor(actor.atk * G.kotodama.buffMult(actor, 'atk'));
    const def = Math.floor(target.def * G.kotodama.buffMult(target, 'def'));
    const r = calcPhysical(atk, def);
    let dmg = r.dmg;
    if (target.defending) dmg = Math.floor(dmg * B().DEFEND_RATE);
    if (target.guard > 0) dmg = 0;
    if (r.crit) ev.push({ type: 'msg', text: '会心の一撃！' });
    if (st.showCalc) {
      const detail = r.crit
        ? `会心：攻${r.atk} 幅±${r.width}`
        : `攻${r.atk} 守${r.def} → 基本${r.base.toFixed(1)} 幅±${r.width}`;
      ev.push({ type: 'calc', text: `（${detail}${target.defending ? ' 防御½' : ''}${target.guard > 0 ? ' 岩戸' : ''} → ${dmg}）` });
    }
    applyDamage(st, target, dmg);
    ev.push({ type: 'damage', target, amount: dmg });
    ev.push({ type: 'msg', text: dmg > 0 ? `${target.name}に ${dmg} のダメージ。` : `${target.name}は傷を負わなかった。` });
    if (target.hp === 0) {
      ev.push({ type: 'ko', target });
      ev.push({ type: 'msg', text: target.side === 'enemy' ? `${target.name}を倒した。` : `${target.name}は倒れた……。` });
    }
    return ev;
  }

  // 逃げる（ボス戦・イベント戦はできない）
  function tryEscape(st) {
    if (st.boss) return { ok: false, blocked: true };
    const ok = G.rng.chance(escapeChance(st.escapeTries));
    st.escapeTries++;
    return { ok };
  }

  // 勝敗：'win'（敵全滅）/ 'lose'（ベル以外の仲間が倒れた）/ null（続く）
  function outcome(st) {
    if (st.party.some(p => p.hp <= 0 && !charOf(p).isBell)) return 'lose';
    if (aliveEnemies(st).length === 0) return 'win';
    return null;
  }

  // 1ラウンドの終わり（強化の残りを減らす）
  function endRound(st) {
    return G.kotodama.endRound(st.party.concat(st.enemies));
  }

  // 勝ったときのごほうび（経験値は、レベルの上がる仲間で分ける）
  function rewards(st) {
    const b = B();
    const exp = st.enemies.reduce((s, e) => s + G.DATA.enemies[e.id].exp, 0);
    const copper = st.enemies.reduce((s, e) => s + G.DATA.enemies[e.id].copper, 0);
    const alive = st.party.filter(p => p.hp > 0 && !charOf(p).fixed);
    const each = b.EXP_SPLIT ? Math.ceil(exp / Math.max(1, alive.length)) : exp;
    // 落とし物は、最後に倒した敵1体だけが判定
    let drop = null;
    const last = st.lastKilled && G.DATA.enemies[st.lastKilled.id].drop;
    if (last && G.rng.chance(b.DROP_RATE[last.rank] || 0)) drop = last.item;
    return { exp, each, copper, drop, alive };
  }

  // 自動戦闘（デバッグ用）：味方は全員「こうげき」、敵はランダムに選んだ組で n 回戦う
  function simulate(n, groups) {
    const result = { wins: 0, loses: 0, crits: 0, attacks: 0, turns: 0, damageTaken: 0 };
    for (let i = 0; i < n; i++) {
      const members = G.party.freshMembers();
      const group = groups[G.rng.int(0, groups.length - 1)];
      const st = create(members, group);
      let out = null, turns = 0;
      while (!out && turns < 100) {
        turns++;
        st.party.forEach(p => { p.defending = false; });
        for (const a of turnOrder(st.party.concat(st.enemies))) {
          const hpBefore = st.party.reduce((s, p) => s + p.hp, 0);
          const ev = act(st, a, { type: 'attack', target: aliveEnemies(st)[0] });
          ev.forEach(e => { if (e.type === 'msg' && e.text === '会心の一撃！') result.crits++; });
          if (a.side === 'party' && ev.length) result.attacks++;
          result.damageTaken += hpBefore - st.party.reduce((s, p) => s + p.hp, 0);
          out = outcome(st);
          if (out) break;
        }
      }
      result.turns += turns;
      if (out === 'win') result.wins++; else result.loses++;
    }
    return result;
  }

  G.battle = { calcPhysical, turnOrder, pickPartyTarget, escapeChance, create, act, tryEscape, outcome, rewards, simulate, aliveEnemies, applyDamage, endRound };
})();
