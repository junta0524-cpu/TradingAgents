// このファイルの役目：言霊と道具の「効き目」を実際に起こす（戦闘でも移動中でも同じ処理を使う）。
// 効き目の書き方は js/data/kotodama.js の先頭を見る。起きたことは「出来事（events）」の配列で返す。
(function () {
  const G = window.GAME = window.GAME || {};

  const charOf = m => G.DATA.characters[m.id] || {};

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

  // 効き目を起こす。user：使う人、targets：相手の配列
  function apply(effect, user, targets, st) {
    const ev = [];
    const B = G.DATA.balance;
    targets.forEach(t => {
      if (effect.kind === 'heal') {
        if (t.hp <= 0) { ev.push({ type: 'msg', text: `${t.name}には効かなかった。` }); return; }
        const amount = effect.full ? t.maxHp : G.rng.int(effect.power[0], effect.power[1]);
        const before = t.hp;
        t.hp = Math.min(t.maxHp, t.hp + amount);
        ev.push({ type: 'heal', target: t, amount: t.hp - before });
        ev.push({ type: 'msg', text: t.hp === t.maxHp && effect.full ? `${t.name}の体力がすべて戻った。` : `${t.name}の体力が ${t.hp - before} 戻った。` });
      } else if (effect.kind === 'damage') {
        if (t.hp <= 0) return;
        const bonus = Math.floor((user.atk || 0) * B.KOTODAMA_ATK_BONUS);
        let dmg = G.rng.int(effect.power[0], effect.power[1]) + bonus;
        const d = t.side === 'enemy' ? G.DATA.enemies[t.id] : null;
        const resist = d && d.resist && effect.element && d.resist[effect.element] != null ? d.resist[effect.element] : 1;
        dmg = Math.floor(dmg * resist);
        if (st && st.showCalc) ev.push({ type: 'calc', text: `（幅${effect.power[0]}〜${effect.power[1]}＋攻×${B.KOTODAMA_ATK_BONUS}=${bonus}　耐性×${resist} → ${dmg}）` });
        if (t.guard > 0) dmg = 0;
        G.battle.applyDamage(st, t, dmg);
        ev.push({ type: 'damage', target: t, amount: dmg });
        ev.push({ type: 'msg', text: resist === 0 ? `${t.name}には効かない！` : (dmg > 0 ? `${t.name}に ${dmg} のダメージ。` : `${t.name}は傷を負わなかった。`) });
        if (t.hp === 0) {
          ev.push({ type: 'ko', target: t });
          ev.push({ type: 'msg', text: t.side === 'enemy' ? `${t.name}を倒した。` : `${t.name}は倒れた……。` });
        }
      } else if (effect.kind === 'buff') {
        if (t.hp <= 0) return;
        t.buffs = t.buffs || {};
        const stats = effect.stat === 'both' ? ['atk', 'def'] : [effect.stat];
        stats.forEach(s => { t.buffs[s] = { mult: effect.mult, turns: effect.turns }; });
        const word = effect.stat === 'atk' ? '力がみなぎった' : effect.stat === 'def' ? '守りが堅くなった' : '力と守りが高まった';
        ev.push({ type: 'msg', text: `${t.name}の${word}。` });
      } else if (effect.kind === 'guard') {
        if (t.hp <= 0) return;
        t.guard = effect.turns;
        ev.push({ type: 'msg', text: `${t.name}は岩戸に包まれた。` });
      } else if (effect.kind === 'scan') {
        ev.push({ type: 'msg', text: `${t.name}：HP ${t.hp}/${t.maxHp}　攻撃${t.atk}　守備${t.def}　素早さ${t.agi}` });
      }
    });
    return ev;
  }

  // 言霊の相手を決める（戦闘の中で）
  function resolveTargets(targetType, user, chosen, st) {
    const aliveE = st ? st.enemies.filter(e => e.hp > 0) : [];
    const aliveP = (st ? st.party : G.state.party).filter(p => p.hp > 0);
    switch (targetType) {
      case 'self': return [user];
      case 'ally': return [chosen && chosen.hp > 0 ? chosen : user];
      case 'allies': return aliveP;
      case 'enemy': return [chosen && chosen.hp > 0 ? chosen : aliveE[0]].filter(Boolean);
      case 'enemies': return aliveE;
      default: return [];
    }
  }

  // 言霊を唱える（MPを使う）。戦闘でも移動中でも使う
  function cast(user, id, chosen, st) {
    const k = G.DATA.kotodama[id];
    if (user.mp < k.mp) return [{ type: 'msg', text: `${user.name}は${k.name}を唱えようとした。しかし、MPが足りない！` }];
    user.mp -= k.mp;
    const ev = [{ type: 'msg', text: `${user.name}は${k.name}を唱えた！` }];
    return ev.concat(apply(k.effect, user, resolveTargets(k.target, user, chosen, st), st));
  }

  // 道具を使う（持ち物から1つ減る）
  function useItem(user, id, chosen, st) {
    const it = G.DATA.items[id];
    if (!G.party.removeItem(id)) return [{ type: 'msg', text: `${it.name}は、もう持っていない。` }];
    const ev = [{ type: 'msg', text: `${user.name}は${it.name}を使った！` }];
    return ev.concat(apply(it.effect, user, resolveTargets(it.target, user, chosen, st), st));
  }

  // 1ラウンドの終わり：強化の残りターンを減らす
  function endRound(units) {
    const ev = [];
    units.forEach(u => {
      if (u.hp <= 0) return;
      if (u.buffs) Object.keys(u.buffs).forEach(s => {
        if (--u.buffs[s].turns <= 0) {
          delete u.buffs[s];
          ev.push({ type: 'msg', text: `${u.name}の${s === 'atk' ? '力' : '守り'}が元に戻った。` });
        }
      });
      if (u.guard > 0 && --u.guard === 0) ev.push({ type: 'msg', text: `${u.name}を包む岩戸が消えた。` });
    });
    return ev;
  }

  // 戦闘が終わったら、強化を消す
  function clearBattleState(m) {
    delete m.side; delete m.defending; delete m.buffs; delete m.guard;
  }

  G.kotodama = { implemented, usableIn, buffMult, apply, resolveTargets, cast, useItem, endRound, clearBattleState, charOf };
})();
