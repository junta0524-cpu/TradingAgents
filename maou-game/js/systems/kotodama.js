// このファイルの役目：言霊と道具の「効き目」を実際に起こす（戦闘でも移動中でも同じ処理を使う）。
// 効き目の書き方は js/data/kotodama.js の先頭を見る。起きたことは「出来事（events）」の配列で返す。
// 敵が唱える言霊も、同じ処理を使う（敵から見た「敵」は味方になる）。
(function () {
  const G = window.GAME = window.GAME || {};

  const charOf = m => G.DATA.characters[m.id] || {};
  const OFFENSIVE = ['damage', 'status'];

  // いま使える言霊か（まだ作っていないフェーズのものや、特別なものは使えない）
  function implemented(k) {
    return k && k.effect && !(k.phase && k.phase > G.debug.CURRENT_PHASE);
  }
  function usableIn(k, where) {
    if (!implemented(k)) return false;
    return k.use === 'both' || k.use === where;
  }

  // 強くなっている分の倍率
  function buffMult(unit, stat) {
    const b = unit.buffs && unit.buffs[stat];
    return b ? b.mult : 1;
  }

  function koEvents(t) {
    return [{ type: 'ko', target: t }, { type: 'msg', text: t.side === 'enemy' ? `${t.name}を倒した。` : `${t.name}は倒れた……。` }];
  }

  // 効き目を起こす。user：使う人、targets：相手の配列
  function apply(effect, user, targets, st) {
    let ev = [];
    const B = G.DATA.balance;
    targets.forEach(t => {
      switch (effect.kind) {
        case 'heal': {
          if (t.hp <= 0) { ev.push({ type: 'msg', text: `${t.name}には効かなかった。` }); return; }
          const amount = effect.full ? t.maxHp : G.rng.int(effect.power[0], effect.power[1]);
          const before = t.hp;
          t.hp = Math.min(t.maxHp, t.hp + amount);
          ev.push({ type: 'heal', target: t, amount: t.hp - before });
          ev.push({ type: 'msg', text: t.hp === t.maxHp && effect.full ? `${t.name}の体力がすべて戻った。` : `${t.name}の体力が ${t.hp - before} 戻った。` });
          return;
        }
        case 'revive': {
          if (t.hp > 0) { ev.push({ type: 'msg', text: `${t.name}は、倒れていない。` }); return; }
          t.hp = Math.max(1, Math.floor(t.maxHp * effect.ratio));
          ev.push({ type: 'heal', target: t, amount: t.hp });
          ev.push({ type: 'msg', text: `${t.name}が、起き上がった！` });
          return;
        }
        case 'damage': {
          if (t.hp <= 0) return;
          const bonus = Math.floor((user.atk || 0) * B.KOTODAMA_ATK_BONUS);
          let dmg = G.rng.int(effect.power[0], effect.power[1]) + bonus;
          const resist = effect.element ? G.status.resistOf(t, effect.element) : 1;
          dmg = Math.floor(dmg * resist);
          const aff = st ? G.affinity.mult(user, t) : 1;   // 四すくみ
          dmg = Math.floor(dmg * aff);
          if (G.affinity.note(aff, user)) ev.push({ type: 'msg', text: G.affinity.note(aff, user) });
          if (st && st.showCalc) ev.push({ type: 'calc', text: `（幅${effect.power[0]}〜${effect.power[1]}＋攻×${B.KOTODAMA_ATK_BONUS}=${bonus}　耐性×${resist}${aff !== 1 ? ' 相性×' + aff : ''} → ${dmg}）` });
          if (t.guard > 0) dmg = 0;
          const saved = G.battle.applyDamage(st, t, dmg);
          ev.push({ type: 'damage', target: t, amount: dmg });
          ev.push({ type: 'msg', text: resist === 0 ? `${t.name}には効かない！` : (dmg > 0 ? `${t.name}に ${dmg} のダメージ。` : `${t.name}は傷を負わなかった。`) });
          if (saved) ev.push({ type: 'msg', text: saved }, { type: 'inhibit' });
          if (t.hp === 0) ev = ev.concat(koEvents(t));
          return;
        }
        case 'buff': {
          if (t.hp <= 0) return;
          t.buffs = t.buffs || {};
          const stats = effect.stat === 'both' ? ['atk', 'def'] : [effect.stat];
          stats.forEach(s => { t.buffs[s] = { mult: effect.mult, turns: effect.turns }; });
          const word = effect.stat === 'atk' ? '力がみなぎった' : effect.stat === 'def' ? '守りが堅くなった' : '力と守りが高まった';
          ev.push({ type: 'msg', text: `${t.name}の${word}。` });
          return;
        }
        case 'guard':
          if (t.hp <= 0) return;
          t.guard = effect.turns;
          ev.push({ type: 'msg', text: `${t.name}は岩戸に包まれた。` });
          return;
        case 'scan': {
          const st2 = G.status.tags(t);
          ev.push({ type: 'msg', text: `${t.name}：HP ${t.hp}/${t.maxHp}　攻撃${t.atk}　守備${t.def}　素早さ${t.agi}${st2 ? '　〔' + st2 + '〕' : ''}` });
          return;
        }
        case 'status':
          ev = ev.concat(G.status.inflict(t, effect.status, effect.chance));
          return;
        case 'cure':
          if (t.hp <= 0) return;
          ev = ev.concat(G.status.cure(t, effect.statuses));
          return;
        case 'mind':
          if (t.hp <= 0) return;
          t.mind = effect.turns;
          if (G.status.has(t, 'confuse')) ev = ev.concat(G.status.cure(t, ['confuse']));
          ev.push({ type: 'msg', text: `${t.name}の心が静かに澄んだ。` });
          return;
        case 'reflect':
          if (t.hp <= 0) return;
          t.reflect = effect.turns;
          ev.push({ type: 'msg', text: `${t.name}の前に、言霊を返す鏡が立った。` });
          return;
        case 'cover':
          if (t.hp <= 0 || t === user) { ev.push({ type: 'msg', text: 'しかし、身代わりになれる相手がいない。' }); return; }
          t.coveredBy = user;
          t.coverTurns = effect.turns;
          ev.push({ type: 'msg', text: `${user.name}は${t.name}の身代わりになる構えを取った。` });
          return;
        case 'foresee':
          if (!st) return;
          st.enemies.filter(e => e.hp > 0).forEach(e => {
            const p = st.plans && st.plans[e.key];
            const what = !p ? '様子をうかがっている' : p.type === 'kotodama' ? `${G.DATA.kotodamaEnemy[p.id].name}を唱えようとしている`
              : p.target ? `${p.target.name}を狙っている` : '攻撃しようとしている';
            ev.push({ type: 'msg', text: `${e.name}は${what}。` });
          });
          return;
        case 'barrier':
          G.state.barrier = B.BARRIER_STEPS;
          ev.push({ type: 'msg', text: 'あたりに結界が張られた。しばらく獣が寄りつかない。' });
          return;
        default:
          return;
      }
    });
    return ev;
  }

  // 言霊の相手を決める。敵が唱えるときは、敵味方を入れ替えて考える
  function resolveTargets(targetType, user, chosen, st) {
    const enemiesOfUser = st ? (user.side === 'enemy' ? st.party : st.enemies).filter(e => e.hp > 0) : [];
    const friendsOfUser = (st ? (user.side === 'enemy' ? st.enemies : st.party) : G.state.party).filter(p => p.hp > 0);
    switch (targetType) {
      case 'self': return [user];
      case 'ally': return [chosen && chosen.hp > 0 ? chosen : user];
      case 'allies': return friendsOfUser;
      case 'enemy': {
        if (chosen && chosen.hp > 0) return [chosen];
        if (user.side === 'enemy' && st) return [G.battle.pickPartyTarget(st.party)].filter(Boolean);
        return enemiesOfUser.slice(0, 1);
      }
      case 'enemies': return enemiesOfUser;
      // 倒れた仲間（生き返し）
      case 'fallen': {
        const all = st ? (user.side === 'enemy' ? st.enemies : st.party) : G.state.party;
        if (chosen && chosen.hp <= 0) return [chosen];
        return all.filter(p => p.hp <= 0).slice(0, 1);
      }
      case 'fallen_all': return (st ? (user.side === 'enemy' ? st.enemies : st.party) : G.state.party).filter(p => p.hp <= 0);
      default: return [];
    }
  }

  // 返し鏡：相手を攻める言霊は、鏡を立てた相手から跳ね返る
  function withReflect(k, user, targets) {
    if (!OFFENSIVE.includes(k.effect.kind)) return { targets, ev: [] };
    const ev = [];
    const out = targets.map(t => {
      if (t.reflect > 0 && t.side !== user.side) {
        ev.push({ type: 'msg', text: `返し鏡が、${k.name}を跳ね返した！` });
        return user;
      }
      return t;
    });
    return { targets: out, ev };
  }

  function castWith(k, user, chosen, st, firstMsg) {
    if (G.status.has(user, 'silence')) {
      return [{ type: 'msg', text: `${user.name}は${k.name}を唱えようとした。しかし、言霊が封じられている！` }];
    }
    const ev = [{ type: 'msg', text: firstMsg }];
    const r = withReflect(k, user, resolveTargets(k.target, user, chosen, st));
    return ev.concat(r.ev, apply(k.effect, user, r.targets, st));
  }

  // 言霊を唱える（MPを使う）。戦闘でも移動中でも使う
  function cast(user, id, chosen, st) {
    const k = G.DATA.kotodama[id];
    if (user.mp < k.mp) return [{ type: 'msg', text: `${user.name}は${k.name}を唱えようとした。しかし、MPが足りない！` }];
    if (G.status.has(user, 'silence')) return castWith(k, user, chosen, st, '');
    user.mp -= k.mp;
    return castWith(k, user, chosen, st, `${user.name}は${k.name}を唱えた！`);
  }

  // 敵が唱える（MPは使わない）
  function castEnemy(user, id, chosen, st) {
    const k = G.DATA.kotodamaEnemy[id] || G.DATA.kotodama[id];
    return castWith(k, user, chosen, st, `${user.name}は${k.name}を放った！`);
  }

  // 道具を使う（持ち物から1つ減る）
  function useItem(user, id, chosen, st) {
    const it = G.DATA.items[id];
    if (!G.party.removeItem(id)) return [{ type: 'msg', text: `${it.name}は、もう持っていない。` }];
    const ev = [{ type: 'msg', text: `${user.name}は${it.name}を使った！` }];
    return ev.concat(apply(it.effect, user, resolveTargets(it.target, user, chosen, st), st));
  }

  // 1ラウンドの終わり：強化や状態異常の残りターンを減らす
  function endRound(units, st) {
    let ev = [];
    units.forEach(u => {
      if (u.hp <= 0) return;
      ev = ev.concat(G.status.tickRound(u, st));
      if (u.hp <= 0) return;
      if (u.buffs) Object.keys(u.buffs).forEach(s => {
        if (--u.buffs[s].turns <= 0) {
          delete u.buffs[s];
          ev.push({ type: 'msg', text: `${u.name}の${s === 'atk' ? '力' : '守り'}が元に戻った。` });
        }
      });
      if (u.guard > 0 && --u.guard === 0) ev.push({ type: 'msg', text: `${u.name}を包む岩戸が消えた。` });
      if (u.mind > 0) u.mind--;
      if (u.reflect > 0 && --u.reflect === 0) ev.push({ type: 'msg', text: `${u.name}の前の鏡が消えた。` });
      if (u.coverTurns > 0 && --u.coverTurns === 0) delete u.coveredBy;
    });
    return ev;
  }

  // 戦闘が終わったら、強化を消す（毒は残る）
  function clearBattleState(m) {
    ['side', 'defending', 'buffs', 'guard', 'mind', 'reflect', 'coveredBy', 'coverTurns'].forEach(k => delete m[k]);
    G.status.afterBattle(m);
  }

  G.kotodama = { implemented, usableIn, buffMult, apply, resolveTargets, cast, castEnemy, useItem, endRound, clearBattleState, charOf };
})();
