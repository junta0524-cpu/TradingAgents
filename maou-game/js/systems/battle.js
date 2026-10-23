// このファイルの役目：戦闘の「計算」だけを受け持つ（画面は js/scenes/battle.js）。
// ダメージ・会心・行動順・逃走・狙われ率は、仕様書 第6章の式どおり。数字は balance.js の BATTLE。
// 画面と切り離してあるので、デバッグの「自動で100回戦闘」でもそのまま使える。
// 目覚めさせる：人の敵（敵データの awaken）は、弱ると「揺」になり、心鎮め・名呼びで目を覚まして去る（balance.js の AWAKEN）。
(function () {
  const G = window.GAME = window.GAME || {};

  const B = () => G.DATA.balance.BATTLE;
  const LETTERS = 'ＡＢＣＤＥＦ';

  // 物理ダメージ。基本＝(攻撃力−守備力/2)/2、乱数幅＝基本/16+1、基本が2未満なら0〜1
  function calcPhysical(atk, def, opts) {
    opts = opts || {};
    const rng = G.rng;
    const crit = !opts.noCrit && rng.chance(B().CRIT_RATE + (opts.critBonus || 0));
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
    enemyIds = enemyIds.slice(0, B().MAX_ENEMIES);
    const counts = {};
    enemyIds.forEach(id => { counts[id] = (counts[id] || 0) + 1; });
    const seen = {};
    const enemies = enemyIds.map((id, i) => {
      const d = G.DATA.enemies[id];
      seen[id] = (seen[id] || 0) + 1;
      const suffix = counts[id] > 1 ? LETTERS[seen[id] - 1] : '';
      return {
        key: 'e' + i, id, side: 'enemy', name: d.name + suffix,
        koText: opts.erase ? `${d.name + suffix}は、消えた。` : null,   // 2章：血を描かず「消える」
        hp: d.hp, maxHp: d.hp, atk: d.atk, def: d.def, agi: d.agi, wis: d.wis, defending: false,
      };
    });
    const party = partyMembers.map(m => Object.assign(m, { side: 'party', defending: false, stance: null }));
    return {
      party, enemies, escapeTries: 0, boss: !!opts.boss,
      showCalc: !!opts.showCalc, lastKilled: null, turn: 0, plans: {},
      spare: !!opts.spare,   // 寄り道クエストの耐える戦い：どの敵も体力1から下がらない
      protectLeft: G.DATA.balance.INHIBIT.PROTECT_PER_BATTLE,   // ベルが致命傷を止められる残り回数
    };
  }

  // 敵の行動をラウンドの最初に決めておく（先読みで見えるように）
  function planEnemies(st) {
    st.plans = {};
    st.enemies.filter(e => e.hp > 0).forEach(e => {
      const acts = G.DATA.enemies[e.id].actions || [{ w: 1, type: 'attack' }];
      const total = acts.reduce((s, a) => s + a.w, 0);
      let r = G.rng.random() * total, pick = acts[0];
      for (const a of acts) { r -= a.w; if (r < 0) { pick = a; break; } }
      st.plans[e.key] = pick.type === 'kotodama' ? { type: 'kotodama', id: pick.id }
        : pick.type === 'flee' ? { type: 'flee' }   // 逃げる（白兎など）
        : (pick.type === 'call' || pick.type === 'buff' || pick.type === 'heal') && helpUseful(st, e, pick) ? { type: pick.type, act: pick }
        : { type: 'attack', target: pickPartyTarget(st.party) };
    });
  }

  // ---- 仲間を助ける敵の行動（残党軍）：call 仲間呼び／buff 仲間を強くする／heal 仲間の傷を手当て ----
  // 行動のデータ：{ w, type: 'call', ids: [{ id, w }] }（敵データに unique があれば、その戦いに1体まで）
  //               { w, type: 'buff', stat: 'atk', mult, turns, text }／{ w, type: 'heal', rate, text }
  // 役に立たないとき（もう6体いる・みな強くなっている・傷ついた仲間がいない）は、ふつうに攻撃する
  const callable = (st, act) => (act.ids || []).filter(c => !((G.DATA.enemies[c.id] || {}).unique && st.enemies.some(e => e.id === c.id)));
  const wounded = (st, self) => aliveEnemies(st).filter(e => e.hp < e.maxHp * B().ENEMY_HEAL_BELOW).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp);
  function helpUseful(st, e, act) {
    if (act.type === 'call') return st.enemies.length < B().MAX_ENEMIES && callable(st, act).length > 0;
    if (act.type === 'buff') return aliveEnemies(st).some(u => !(u.buffs && u.buffs[act.stat]));
    return wounded(st, e).length > 0;
  }
  // 戦いの途中で敵を加える（名前の Ａ・Ｂ… も付け直す）
  function addEnemy(st, id) {
    const d = G.DATA.enemies[id];
    const same = st.enemies.filter(e => e.id === id);
    if (same.length === 1 && same[0].name === d.name) same[0].name = d.name + LETTERS[0];
    const e = {
      key: 'e' + st.enemies.length, id, side: 'enemy', name: d.name + (same.length ? LETTERS[same.length] : ''), koText: null,
      hp: d.hp, maxHp: d.hp, atk: d.atk, def: d.def, agi: d.agi, wis: d.wis, defending: false, called: true,
    };
    st.enemies.push(e);
    if (G.kenbun) G.kenbun.meet([id]);
    return e;
  }
  function enemyHelp(st, actor, plan) {
    const a = plan.act;
    if (a.type === 'call') {
      const list = callable(st, a);
      if (st.enemies.length >= B().MAX_ENEMIES || !list.length) return [{ type: 'msg', text: `${actor.name}は仲間を呼んだ！` }, { type: 'msg', text: 'しかし、だれも来なかった。' }];
      let r = G.rng.random() * list.reduce((n, c) => n + c.w, 0), pick = list[0];
      for (const c of list) { r -= c.w; if (r < 0) { pick = c; break; } }
      const e = addEnemy(st, pick.id);
      return [{ type: 'msg', text: `${actor.name}は仲間を呼んだ！` }, { type: 'msg', text: `${e.name}が現れた！` }];
    }
    if (a.type === 'buff') {
      const ev = [{ type: 'msg', text: `${actor.name}は${a.text || '仲間を鼓舞した！'}` }];
      aliveEnemies(st).forEach(u => { u.buffs = u.buffs || {}; u.buffs[a.stat] = { mult: a.mult, turns: a.turns }; });
      ev.push({ type: 'msg', text: `敵の${a.stat === 'atk' ? '力' : '守り'}が上がった！` });
      return ev;
    }
    const t = wounded(st, actor)[0];
    if (!t) return [{ type: 'msg', text: `${actor.name}の攻撃！` }].concat(attack(st, actor, pickPartyTarget(st.party), []).slice(1));
    const amount = Math.min(t.maxHp - t.hp, Math.floor(t.maxHp * (a.rate || 0.3)));
    t.hp += amount;
    return [{ type: 'msg', text: `${actor.name}は${a.text || '傷の手当てをした。'}` }, { type: 'heal', target: t, amount }, { type: 'msg', text: `${t.name}の体力が ${amount} 戻った。` }];
  }

  // 混乱：敵味方の区別なく、だれかを打つ
  function confusedTarget(st, actor) {
    const all = st.party.concat(st.enemies).filter(u => u.hp > 0 && u !== actor);
    return all[G.rng.int(0, all.length - 1)];
  }

  // 仲間の得意（ウズメの先手など）と、装備の効き目（大鷲の羽飾り・黄金の稲穂・福の鈴）
  const hasPerk = (st, perk) => st.party.some(p => p.hp > 0 && (charOf(p).perk === perk || (p.perks || []).includes(perk)));

  const aliveEnemies = st => st.enemies.filter(e => e.hp > 0);
  const isHard = t => t.side === 'enemy' && !!(G.DATA.enemies[t.id] || {}).hard;
  const charOf = m => G.DATA.characters[m.id] || {};

  // ベルが、仲間への致命の一撃を止められるか（守り手のしくみ・仕様書 7-2）
  function canProtect(st, target) {
    if (!st || target.side !== 'party' || charOf(target).isBell || st.protectLeft <= 0) return false;
    const bell = st.party.find(p => charOf(p).isBell);
    if (!bell || bell.hp <= 0 || G.status.has(bell, 'sleep') || G.status.has(bell, 'bind')) return false;
    return G.inhibit.value() >= G.DATA.balance.INHIBIT.PROTECT;
  }

  // ダメージを与える。ベルは倒れない（HPは1で止まる）。
  // 仲間が倒れそうなとき、ベルが止めたら「止めた」という文を返す（なければ null）
  function applyDamage(st, target, amount) {
    let hp = target.hp - amount;
    if (target.side === 'party' && charOf(target).isBell && hp < 1) hp = 1;
    if (target.side === 'enemy' && ((G.DATA.enemies[target.id] || {}).spare || st.spare) && hp < 1) hp = 1;   // 倒れない敵（2章のタケル・寄り道クエストの耐える戦い）
    let saved = null;
    if (hp <= 0 && amount > 0 && canProtect(st, target)) {
      hp = 1;
      st.protectLeft--;
      G.inhibit.drain(G.DATA.balance.INHIBIT.PROTECT);
      saved = `ベルが割って入り、${target.name}への致命の一撃を止めた。`;
    }
    target.hp = Math.max(0, hp);
    if (target.hp === 0 && target.side === 'enemy' && st) st.lastKilled = target;
    return saved;
  }

  // 1人ぶんの行動を行い、起きたこと（events）を返す
  // cmd：{ type: 'attack', target } / { type: 'defend' } / { type: 'kotodama', id, target } / { type: 'item', id, target }
  function act(st, actor, cmd) {
    let ev = [];
    if (actor.hp <= 0) return ev;

    // 状態異常：眠り・縛りは動けない。混乱はだれかを打つ
    const pre = G.status.beforeAct(actor);
    ev = ev.concat(pre.ev);
    if (pre.skip) return ev;
    if (pre.confused) {
      const t = confusedTarget(st, actor);
      return t ? attack(st, actor, t, ev) : ev;
    }

    if (actor.side === 'enemy') {
      const plan = st.plans[actor.key] || { type: 'attack' };
      if (plan.type === 'kotodama') return ev.concat(G.kotodama.castEnemy(actor, plan.id, null, st));
      // 逃げる：戦いからいなくなる（倒したことにはならず、経験値ももらえない）
      if (plan.type === 'flee') { actor.hp = 0; actor.fled = true; return ev.concat([{ type: 'msg', text: `${actor.name}は、逃げ出した！` }, { type: 'ko', target: actor }]); }
      if (plan.type === 'call' || plan.type === 'buff' || plan.type === 'heal') return ev.concat(enemyHelp(st, actor, plan));
      // hits：1ターンに何回打つか（2章のタケルは2回）
      const hits = (G.DATA.enemies[actor.id] || {}).hits || 1;
      for (let h = 0; h < hits; h++) {
        let target = plan.target;
        if (!target || target.hp <= 0) target = pickPartyTarget(st.party);
        if (!target) break;
        ev = attack(st, actor, target, ev);
      }
      return ev;
    }
    if (cmd.type === 'defend') {
      ev.push({ type: 'msg', text: `${actor.name}は身を守っている。` });
      return ev;
    }
    if (cmd.type === 'kotodama') {
      // 唱えた言霊の系統で構えが変わる（四すくみ。js/systems/affinity.js）
      const stance = (actor.mp >= (G.DATA.kotodama[cmd.id] || {}).mp) ? G.affinity.setStance(actor, cmd.id) : null;
      if (stance) ev.push({ type: 'msg', text: stance });
      const out = G.kotodama.cast(actor, cmd.id, cmd.target, st);
      // 唱えた言霊の覚え（寄り道クエストの hook が「堅めを唱えたか」などを見る）。唱えられたときだけ
      if (out.some(e => e.type === 'msg' && e.text.endsWith('を唱えた！'))) (st.casts = st.casts || []).push({ who: actor.id, id: cmd.id, round: st.hookRound || 0 });
      // ベルが言霊を唱えると、阻害ゲージが大きく減る
      if (charOf(actor).isBell && out.some(e => e.type === 'msg' && e.text.endsWith('を唱えた！'))) {
        G.inhibit.drain(G.inhibit.kotodamaCost(G.DATA.kotodama[cmd.id]));
        out.push({ type: 'inhibit' });
      }
      return ev.concat(out);
    }
    if (cmd.type === 'fullpower') return ev.concat(fullPower(st, actor, cmd.target));
    if (cmd.type === 'item') return ev.concat(G.kotodama.useItem(actor, cmd.id, cmd.target, st));
    // 2章だけの特別：魔王ベルイザナの攻撃は、敵全体へ2回（ユーザー決定。ほかの章はふつうの1回攻撃）
    if (charOf(actor).isBell && G.state.chapter === G.DATA.balance.BELL_TRUE_HITS_CHAPTER) {
      for (let h = 0; h < G.DATA.balance.BELL_TRUE_HITS; h++) {
        const foes = aliveEnemies(st);
        if (!foes.length) break;
        ev.push({ type: 'msg', text: `${actor.name}の攻撃！（敵全体）` });
        foes.forEach(t => { ev = attack(st, actor, t, ev, true); });
      }
      return ev;
    }
    // 攻撃：狙った敵が倒れていたら、別の敵へ
    let target = cmd.target;
    if (!target || target.hp <= 0) target = aliveEnemies(st)[0];
    if (!target) return ev;
    return attack(st, actor, target, ev);
  }

  function attack(st, actor, target, ev, quiet) {
    if (!quiet) ev.push({ type: 'msg', text: `${actor.name}の攻撃！` });
    // 身代わり：守られている味方への打撃は、守り手が受ける
    if (target.coveredBy && target.coveredBy.hp > 0 && target.coveredBy !== actor && target.side !== actor.side) {
      ev.push({ type: 'msg', text: `${target.coveredBy.name}が、${target.name}の身代わりになった！` });
      target = target.coveredBy;
    }
    // 朧：目がかすんで外れることがある
    if (G.status.has(actor, 'oboro') && G.rng.chance(G.DATA.balance.STATUS.OBORO_MISS)) {
      ev.push({ type: 'msg', text: 'しかし、攻撃は外れた！' });
      return ev;
    }
    const atk = Math.floor(actor.atk * G.kotodama.buffMult(actor, 'atk'));
    const def = Math.floor(target.def * G.kotodama.buffMult(target, 'def'));
    const r = calcPhysical(atk, def, { noCrit: quiet, critBonus: actor.crit || 0 });   // 敵全体への攻撃では会心が出ない（仕様書 第6章）
    let dmg = r.dmg;
    const aff = G.affinity.mult(actor, target);
    dmg = Math.floor(dmg * aff);
    if (target.defending) dmg = Math.floor(dmg * B().DEFEND_RATE);
    if (target.guard > 0) dmg = 0;
    if (isHard(target)) dmg = r.crit ? G.DATA.balance.RARE.HARD_CRIT : G.rng.int(0, G.DATA.balance.RARE.HARD_MAX);   // 白兎：打撃がほとんど効かない
    if (r.crit) ev.push({ type: 'msg', text: '会心の一撃！' });
    if (G.affinity.note(aff, actor)) ev.push({ type: 'msg', text: G.affinity.note(aff, actor) });
    if (st.showCalc) {
      const detail = r.crit
        ? `会心：攻${r.atk} 幅±${r.width}`
        : `攻${r.atk} 守${r.def} → 基本${r.base.toFixed(1)} 幅±${r.width}`;
      ev.push({ type: 'calc', text: `（${detail}${aff !== 1 ? ' 相性×' + aff : ''}${target.defending ? ' 防御½' : ''}${target.guard > 0 ? ' 岩戸' : ''} → ${dmg}）` });
    }
    const saved = applyDamage(st, target, dmg);
    ev.push({ type: 'damage', target, amount: dmg });
    ev.push({ type: 'msg', text: dmg > 0 ? `${target.name}に ${dmg} のダメージ。` : `${target.name}は傷を負わなかった。` });
    if (saved) ev.push({ type: 'msg', text: saved }, { type: 'inhibit' });
    if (target.hp === 0) {
      ev.push({ type: 'ko', target });
      ev.push({ type: 'msg', text: target.side === 'enemy' ? (target.koText || `${target.name}を倒した。`) : `${target.name}は倒れた……。` });
      return ev;
    }
    if (dmg > 0) {
      G.status.onPhysicalHit(target).forEach(e => ev.push(e));
      // 敵の打撃に毒などがついている
      const hit = actor.side === 'enemy' && G.DATA.enemies[actor.id].onHit;
      if (hit && G.rng.chance(hit.chance)) G.status.inflict(target, hit.status, 1).filter(e => e.type !== 'msg' || !e.text.endsWith('効かなかった。')).forEach(e => ev.push(e));
    }
    return ev;
  }

  // ベルの「本気」：守備力を無視した重い一撃。阻害ゲージが大きく減る
  function fullPower(st, actor, target) {
    const I = G.DATA.balance.INHIBIT;
    if (!target || target.hp <= 0) target = aliveEnemies(st)[0];
    if (!target) return [];
    const ev = [{ type: 'msg', text: `${actor.name}は、抑えていた力をほんの少し解いた。` }];
    const dmg = isHard(target) ? G.DATA.balance.RARE.HARD_CRIT : Math.floor(actor.atk * I.FULL_POWER_MULT) + G.rng.int(0, Math.floor(actor.atk / 2));
    G.inhibit.drain(I.FULL_POWER);
    applyDamage(st, target, dmg);
    ev.push({ type: 'inhibit' }, { type: 'damage', target, amount: dmg });
    ev.push({ type: 'msg', text: `${target.name}に ${dmg} のダメージ。` });
    if (target.hp === 0) ev.push({ type: 'ko', target }, { type: 'msg', text: `${target.name}を倒した。` });
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
    return G.kotodama.endRound(st.party.concat(st.enemies), st);
  }

  // 先手：ウズメがいると、ときどき敵より先に動ける（最初のラウンドは敵が動かない）
  function rollFirstStrike(st) {
    return hasPerk(st, 'firstStrike') && G.rng.chance(G.DATA.balance.FIRST_STRIKE);
  }

  // ---- 目覚めさせる ----
  const AW = () => G.DATA.balance.AWAKEN;
  // 揺らいでいるか（洗脳された人の敵で、体力が少ない）
  function wavering(e) {
    const d = e && e.side === 'enemy' && G.DATA.enemies[e.id];
    return !!(d && d.awaken && e.hp > 0 && e.hp <= e.maxHp * AW().HP_RATE);
  }
  // 心鎮め・名呼びが敵に届いたとき
  function tryAwaken(st, t) {
    const d = G.DATA.enemies[t.id] || {};
    if (!d.awaken) return [{ type: 'msg', text: `${t.name}には、言葉が届かない。` }];
    if (!wavering(t)) return [{ type: 'msg', text: `（${t.name}の目は、まだ虚ろだ。もっと弱らせてから）` }];
    t.hp = 0;
    t.awakened = true;
    G.state.awakened = (G.state.awakened || 0) + 1;
    const ev = [{ type: 'awaken', target: t }, { type: 'msg', text: d.awakenText || `（${t.name}は、武器を下ろした）` }];
    if (G.state.disguised && G.inhibit.on()) { G.inhibit.set(Math.min(G.DATA.balance.INHIBIT.MAX, G.inhibit.value() + AW().INHIBIT)); ev.push({ type: 'inhibit' }); }
    return ev;
  }
  // 目覚めさせた人の数で届く品（まだもらっていないものを、もらったことにして返す）
  function awakenRewards() {
    const n = G.state.awakened || 0, got = [];
    G.state.vars = G.state.vars || {};
    AW().REWARDS.forEach(r => {
      if (n >= r.n && !G.state.vars['awaken_reward_' + r.n]) { G.state.vars['awaken_reward_' + r.n] = true; G.party.addItem(r.item); got.push(r); }
    });
    return got;
  }

  // 4〜9章は経験値を増やす（物語の道だけでも推奨レベルに近づくように。balance.js の CHAPTER_EXP）
  function chapterExpRate() {
    const c = G.DATA.balance.CHAPTER_EXP, ch = (G.state && G.state.chapter) || 1;
    return c && ch >= c.FROM && ch <= c.TO ? c.RATE : 1;
  }

  // 勝ったときのごほうび（経験値は、レベルの上がる仲間で分ける。目覚めさせた敵は AWAKEN.EXP_RATE 倍）
  function rewards(st) {
    const b = B();
    const won = st.enemies.filter(e => !e.fled);   // 逃げた敵の分はもらえない
    const exp = Math.floor(won.reduce((s, e) => s + G.DATA.enemies[e.id].exp * (e.awakened ? AW().EXP_RATE : 1), 0) * (hasPerk(st, 'expBoost') ? G.DATA.balance.EXP_BOOST : 1) * chapterExpRate());
    const copper = Math.floor(won.reduce((s, e) => s + G.DATA.enemies[e.id].copper, 0) * (hasPerk(st, 'copperBoost') ? G.DATA.balance.COPPER_BOOST : 1));
    const alive = st.party.filter(p => p.hp > 0 && !charOf(p).fixed);
    const each = b.EXP_SPLIT ? Math.ceil(exp / Math.max(1, alive.length)) : exp;
    // 落とし物は、最後に倒した敵1体だけが判定
    let drop = null;
    const last = st.lastKilled && G.DATA.enemies[st.lastKilled.id].drop;
    const boost = hasPerk(st, 'dropBoost') ? G.DATA.balance.DROP_BOOST : 1;   // コトシロがいると増える
    if (last && G.rng.chance((b.DROP_RATE[last.rank] || 0) * boost)) drop = last.item;
    return { exp, each, copper, drop, alive };
  }

  // 自動戦闘（デバッグ用）：味方は全員「うまくやって」、敵はランダムに選んだ組で n 回戦う
  function simulate(n, groups) {
    const result = { wins: 0, loses: 0, crits: 0, attacks: 0, turns: 0, damageTaken: 0 };
    const inhibitWas = G.state.inhibit;   // 試しの戦いで、本物の阻害ゲージを減らさない
    for (let i = 0; i < n; i++) {
      const members = G.party.freshMembers();
      const group = groups[G.rng.int(0, groups.length - 1)];
      const st = create(members, group);
      let out = null, turns = 0;
      while (!out && turns < 100) {
        turns++;
        st.party.forEach(p => { p.defending = false; });
        planEnemies(st);
        for (const a of turnOrder(st.party.concat(st.enemies))) {
          const hpBefore = st.party.reduce((s, p) => s + p.hp, 0);
          const ev = act(st, a, a.side === 'party' ? G.ai.decide(st, a) : null);
          ev.forEach(e => { if (e.type === 'msg' && e.text === '会心の一撃！') result.crits++; });
          if (a.side === 'party' && ev.length) result.attacks++;
          result.damageTaken += hpBefore - st.party.reduce((s, p) => s + p.hp, 0);
          out = outcome(st);
          if (out) break;
        }
        if (!out) { endRound(st); out = outcome(st); }
      }
      result.turns += turns;
      if (out === 'win') result.wins++; else result.loses++;
      G.state.inhibit = inhibitWas;
    }
    return result;
  }

  G.battle = { chapterExpRate, calcPhysical, turnOrder, pickPartyTarget, escapeChance, create, act, tryEscape, outcome, rewards, simulate, aliveEnemies, applyDamage, endRound, planEnemies, rollFirstStrike, wavering, tryAwaken, awakenRewards, isHard };
})();
