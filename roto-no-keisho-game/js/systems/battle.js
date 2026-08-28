// 戦闘システム ― パーティ全員が順番にコマンドを選ぶターン制バトル
var Game = window.Game || {};
Game.Battle = (function () {
  var state = null;

  function cloneMonster(id) {
    var def = Game.Data.Monsters[id];
    var m = JSON.parse(JSON.stringify(def));
    m.curHp = m.hp;
    return m;
  }

  function start(monsterIds, onEnd) {
    state = {
      phase: 'intro',
      enemies: monsterIds.map(cloneMonster),
      turnOrder: Game.Party.aliveList().map(function (m) { return m.id; }),
      turnIndex: 0,
      menu: 'main',
      cursor: 0,
      pendingSkill: null,
      pendingItem: null,
      actions: [],   // このラウンドに予約された味方の行動
      onEnd: onEnd,
      log: [],
    };
    labelEnemies(state.enemies);
    clearGuards();
    clearBattleMul();
    Game.Dialogue.show(encounterLine(state.enemies), function () { beginTurn(); });
  }

  // 「スライムが 2ひき あらわれた!」のように、同じ魔物はまとめて数える
  function encounterLine(enemies) {
    var order = [], counts = {};
    enemies.forEach(function (e) {
      if (counts[e.name] === undefined) { counts[e.name] = 0; order.push(e.name); }
      counts[e.name] += 1;
    });
    var parts = order.map(function (name) {
      return counts[name] > 1 ? name + ' ' + counts[name] + 'ひき' : name;
    });
    return parts.join('と') + 'が あらわれた!';
  }

  // 同じ名前が並ぶと区別できないので、2体目からは A/B/C を添える
  function labelEnemies(enemies) {
    var seen = {};
    enemies.forEach(function (e) { seen[e.name] = (seen[e.name] || 0) + 1; });
    var used = {};
    enemies.forEach(function (e) {
      if (seen[e.name] < 2) { e.label = e.name; return; }
      used[e.name] = (used[e.name] || 0) + 1;
      e.label = e.name + ' ' + String.fromCharCode(64 + used[e.name]); // A, B, C...
    });
  }

  function isActive() { return !!state; }
  function aliveEnemies() { return state.enemies.filter(function (e) { return e.curHp > 0; }); }
  function currentActor() { return Game.Party.get(state.turnOrder[state.turnIndex]); }

  function commandList() {
    return [
      { id: 'attack', label: 'たたかう' },
      { id: 'skill', label: 'じゅもん' },
      { id: 'guard', label: 'ぼうぎょ' },
      { id: 'item', label: 'どうぐ' },
      { id: 'flee', label: 'にげる' },
    ];
  }

  function usableSkills(actor) {
    // 覚えている技のうち、いまのMPで唱えられて、戦闘中に意味のあるものだけ
    return Game.Party.learnedSkills(actor).filter(function (s) {
      if (s.fieldOnly) return false;
      if (s.kind === 'revive' && allyTargetsFor('revive').length === 0) return false;
      return s.mp <= actor.mp;
    });
  }

  function usableItems() {
    return Game.Party.inventory().filter(function (it) {
      if (it.count <= 0) return false;
      var def = Game.Data.Items[it.id];
      if (def.kind === 'return') return false; // 帰還アイテムは戦闘中は使えない
      // 蘇生アイテムは、倒れている仲間がいない間は候補から外す
      // (出すと対象ゼロの選択画面になり、行き止まりに見えてしまう)
      if (def.kind === 'revive' && allyTargetsFor('revive').length === 0) return false;
      return true;
    });
  }

  function isHealKind(kind) {
    return kind === 'heal_hp' || kind === 'heal_mp' || kind === 'revive' ||
      kind === 'cure' || kind === 'cure_undead' || kind === 'ward';
  }

  // 味方に向ける技かどうか(呪文の kind で判断する)
  function targetsAlly(skill) {
    return skill.kind === 'heal' || skill.kind === 'cure' ||
           skill.kind === 'revive' || skill.kind === 'buff';
  }

  // 対象を選ばずそのまま発動する技(全体がけ・自分がけ)
  function needsNoTarget(skill) {
    return skill.target === 'all_enemies' || skill.target === 'all_allies' ||
           skill.target === 'self' || skill.kind === 'guard';
  }

  // 自分にかける技(受け流しなど)は、味方も敵も選ばせずそのまま発動する
  function isSelfSkill(skill) { return skill.kind === 'guard' || skill.target === 'self'; }

  // 新しいラウンドに入ったら、前ラウンドの「防御中」状態を解除する
  function clearGuards() {
    Game.Party.list().forEach(function (m) { m.guarding = false; });
  }

  function allyTargetsFor(kind) {
    var list = Game.Party.list();
    if (kind === 'revive') return list.filter(function (m) { return m.hp <= 0; });
    return list.filter(function (m) { return m.hp > 0; });
  }

  // 補助・弱体は「戦闘のあいだだけ効く倍率」として持たせる。
  // 味方も魔物も同じ形なので、実効値はこの3つを通して読む。
  function mul(unit, key) {
    var m = unit.battleMul && unit.battleMul[key];
    return m ? m : 1;
  }
  function effAtk(u) { return Math.round((u.atk || 0) * mul(u, 'atk')); }
  function effDef(u) { return Math.round((u.def || 0) * mul(u, 'def')); }
  function effSpd(u) { return Math.round((u.spd || 0) * mul(u, 'spd')); }
  function effMag(u) { return Math.round((u.mag || u.atk || 0) * mul(u, 'atk')); }

  function applyMul(unit, key, factor) {
    unit.battleMul = unit.battleMul || {};
    // 重ねがけは効くが、際限なく伸びないよう上下に頭を打たせる
    var next = mul(unit, key) * factor;
    unit.battleMul[key] = Math.max(0.35, Math.min(2.5, next));
  }
  function clearBattleMul() {
    Game.Party.list().forEach(function (m) { m.battleMul = null; });
    state.enemies.forEach(function (e) { e.battleMul = null; e.status = null; });
  }

  function damageOf(atk, def) {
    var base = Math.max(1, atk - Math.floor(def * 0.6));
    var variance = Math.floor(base * 0.2);
    return base + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  }

  // 技の威力のもとになる値。呪文(stat: 'mag')はまりょく、武技はこうげき力。
  // 魔物はまりょくを持たないので、その場合はこうげき力で代用する。
  function powerStat(actor, skill) {
    if (skill && skill.stat === 'mag') return effMag(actor);
    return effAtk(actor);
  }

  // かいしんの一撃。うんのよさが高いほど出やすい(上限12%)。守備を無視して大きく入る。
  function isCritical(actor) {
    return Math.random() < Math.min(0.12, (actor.luck || 0) * 0.004);
  }

  function flushLog(next) {
    if (state.log.length === 0) { next(); return; }
    var msg = state.log.shift();
    Game.Dialogue.show(msg, function () { flushLog(next); });
  }

  // 手番が回ってきたキャラの状態異常を処理する。
  // 行動できないなら false を返し、その手番は飛ばす。
  function resolveTurnStatus(actor) {
    var def = Game.Party.statusOf(actor);
    if (!def) return true;

    if (def.skipsTurn) {
      if (Math.random() < def.wakeChance) {
        state.log.push(Game.Party.cure(actor, [def.id]));
        return true;
      }
      state.log.push(actor.name + def.onTick);
      return false;
    }
    if (def.randomTarget && Math.random() < def.recoverChance) {
      state.log.push(Game.Party.cure(actor, [def.id]));
    }
    return true;
  }

  // 混乱中は対象を選ばせず、敵味方の中からでたらめに殴る
  function actConfused(actor) {
    var pool = aliveEnemies().concat(Game.Party.aliveList().filter(function (m) { return m.id !== actor.id; }));
    var target = pool[Math.floor(Math.random() * pool.length)];
    state.log.push(actor.name + Game.Party.statusOf(actor).onTick);
    if (!target) { state.log.push(actor.name + 'は あたりを 殴りつけた!'); return; }
    var isEnemy = target.curHp !== undefined;
    var dmg = damageOf(effAtk(actor), effDef(target));
    if (isEnemy) {
      target.curHp = Math.max(0, target.curHp - dmg);
      state.log.push(actor.name + 'の こうげき! ' + target.label + 'に ' + dmg + ' の ダメージ');
      if (target.curHp <= 0) state.log.push(target.label + 'を たおした!');
    } else {
      hurt(target, dmg);
      state.log.push(actor.name + 'は なかまの ' + target.name + 'を 殴ってしまった! ' + dmg + ' の ダメージ');
    }
  }

  // 手番の開始処理。眠っていたり混乱していたら、コマンドを出さずに解決する。
  function beginTurn() {
    var actor = currentActor();
    if (!actor || actor.hp <= 0) { advanceTurn(); return; }
    var pre = state.log.length;
    var canAct = resolveTurnStatus(actor);
    var statusDef = Game.Party.statusOf(actor);
    if (!canAct) {
      // 眠っているなどで動けない。その旨だけをこのラウンドの解決に載せる
      var msg = state.log.splice(pre).join(' ');
      queueAction({ kind: 'skip', message: msg });
      return;
    }
    if (statusDef && statusDef.randomTarget) {
      queueAction({ kind: 'confused' });
      return;
    }
    state.phase = 'command';
    state.menu = 'main';
    state.cursor = 0;
  }

  // 選んだ行動をこのラウンドの予約に積み、次の仲間へ回す。
  // ドラクエと同じで、全員のコマンドを決めてからまとめて解決する。
  function queueAction(action) {
    var actor = currentActor();
    action.actorId = actor.id;
    state.actions.push(action);
    advanceTurn();
  }

  function advanceTurn() {
    state.turnIndex += 1;
    // 敵が全滅していたら、残りの行動者の手番は飛ばして即ラウンドを終える
    if (aliveEnemies().length === 0) { resolveRound(); return; }
    if (state.turnIndex < state.turnOrder.length) beginTurn();
    else resolveRound();
  }

  // すばやさの高い者から動く。同じ値でも毎回きっちり同じ順にならないよう揺らす。
  function initiative(spd) { return (spd || 1) * (0.75 + Math.random() * 0.5); }

  function resolveRound() {
    var queue = state.actions.slice();
    state.actions = [];
    aliveEnemies().forEach(function (e) { queue.push({ kind: 'enemy', enemy: e }); });
    queue.forEach(function (a) {
      var actor = a.kind === 'enemy' ? a.enemy : Game.Party.get(a.actorId);
      a.order = initiative(actor && effSpd(actor));
    });
    queue.sort(function (a, b) { return b.order - a.order; });
    state.phase = 'resolving';
    // 「かまえをとった」などの、行動前に出ている文を先に流す
    flushLog(function () { runQueue(queue, 0); });
  }

  function runQueue(queue, i) {
    if (!state) return;
    if (Game.Party.isWiped()) { endBattle('lost'); return; }
    if (aliveEnemies().length === 0) { checkEnemiesDefeated(function () {}); return; }
    if (i >= queue.length) { endRound(); return; }

    var a = queue[i];
    var next = function () { runQueue(queue, i + 1); };
    if (a.kind === 'enemy') {
      // 逃げたり倒れたりした魔物は飛ばす
      if (a.enemy.curHp <= 0 || state.enemies.indexOf(a.enemy) < 0) { next(); return; }
      enemyAct(a.enemy);
    } else {
      var actor = Game.Party.get(a.actorId);
      if (!actor || actor.hp <= 0) { next(); return; }  // 先に倒された仲間の行動は消える
      performAction(a, actor);
      if (!state) return;               // にげるが成功して戦闘が終わった場合
      if (a.kind === 'flee' && a.fled) return;
    }
    flushLog(next);
  }

  function endRound() {
    clearGuards(); // 防御のかまえはこのラウンドまで
    tickPoison();
    flushLog(function () {
      if (Game.Party.isWiped()) { endBattle('lost'); return; }
      if (aliveEnemies().length === 0) { checkEnemiesDefeated(function () {}); return; }
      state.turnOrder = Game.Party.aliveList().map(function (m) { return m.id; });
      state.turnIndex = 0;
      beginTurn();
    });
  }

  // 防御中(受け流し)なら被ダメージを軽減して適用し、実際に与えたダメージを返す
  function hurt(member, rawDmg) {
    var dmg = member.guarding ? Math.max(1, Math.round(rawDmg * (1 - member.guarding))) : rawDmg;
    member.hp = Math.max(0, member.hp - dmg);
    return dmg;
  }

  // ラウンドの終わりに、毒に侵されている仲間を削る
  function tickPoison() {
    Game.Party.aliveList().forEach(function (m) {
      var def = Game.Party.statusOf(m);
      if (!def || !def.poisonDamage) return;
      m.hp = Math.max(0, m.hp - def.poisonDamage);
      state.log.push(m.name + def.onTick + ' ' + def.poisonDamage + ' の ダメージ');
    });
  }

  // 手負いの雑魚は逃げ出すことがある。最後の1匹は逃げない(戦闘が空振りに終わるため)
  function maybeFlee(enemy) {
    if (enemy.boss || aliveEnemies().length <= 1) return false;
    if (enemy.curHp > enemy.hp * 0.3) return false;
    if (Math.random() > 0.3) return false;
    state.log.push(enemy.label + 'は にげだした!');
    var i = state.enemies.indexOf(enemy);
    if (i >= 0) state.enemies.splice(i, 1);
    return true;
  }

  // 魔物にかかった状態異常を処理する。動けないなら false。
  function enemyStatus(enemy) {
    if (!enemy.status) return true;
    if (enemy.status === 'sleep') {
      if (Math.random() < 0.3) { enemy.status = null; state.log.push(enemy.label + 'は 目をさました!'); return true; }
      state.log.push(enemy.label + 'は ねむっている。');
      return false;
    }
    if (enemy.status === 'confuse') {
      if (Math.random() < 0.25) { enemy.status = null; state.log.push(enemy.label + 'は 正気にもどった!'); return true; }
      var others = aliveEnemies().filter(function (e) { return e !== enemy; });
      if (others.length) {
        var pal = others[Math.floor(Math.random() * others.length)];
        var d = damageOf(effAtk(enemy), effDef(pal));
        pal.curHp = Math.max(0, pal.curHp - d);
        state.log.push(enemy.label + 'は こんらんして ' + pal.label + 'を 攻撃した! ' + d + ' の ダメージ');
        if (pal.curHp <= 0) state.log.push(pal.label + 'は たおれた!');
      } else {
        state.log.push(enemy.label + 'は こんらんして あたりを 殴っている。');
      }
      return false;
    }
    return true;  // blind は行動はできる(命中が落ちる)
  }

  function enemyAct(enemy) {
    var alive = Game.Party.aliveList();
    if (alive.length === 0) return;
    if (maybeFlee(enemy)) return;
    if (!enemyStatus(enemy)) return;

    var useSkill = enemy.boss && enemy.bossSkills && Math.random() < 0.35;
    if (useSkill) {
      var skill = enemy.bossSkills[Math.floor(Math.random() * enemy.bossSkills.length)];
      if (skill.target === 'all_party') {
        alive.forEach(function (member) {
          var dmg = hurt(member, Math.round(damageOf(effAtk(enemy), effDef(member)) * skill.power));
          state.log.push(enemy.label + 'の ' + skill.name + '! ' + member.name + 'に ' + dmg + ' の ダメージ');
        });
        return;
      }
    }
    var target = alive[Math.floor(Math.random() * alive.length)];
    if (enemy.status === 'blind' && Math.random() < 0.6) {
      state.log.push(enemy.label + 'の こうげき! しかし 攻撃は はずれた!');
      return;
    }
    var dmg2 = hurt(target, damageOf(effAtk(enemy), effDef(target)));
    state.log.push(enemy.label + 'の こうげき! ' + target.name + 'に ' + dmg2 + ' の ダメージ');
    if (target.hp <= 0) state.log.push(target.name + 'は たおれてしまった!');
    // 状態異常を持つ魔物は、攻撃に乗せて仕掛けてくる
    if (enemy.inflict && target.hp > 0 && Math.random() < enemy.inflict.chance) {
      var msg = Game.Party.inflict(target, enemy.inflict.status);
      if (msg) state.log.push(msg);
    }
  }

  function checkEnemiesDefeated(cb) {
    if (aliveEnemies().length > 0) { cb(false); return; }
    if (state.enemies.length === 0) {
      // 全部逃げていった。取り分は無し
      Game.Dialogue.show('魔物たちは にげさっていった。', function () { endBattle('won'); });
      cb(true);
      return;
    }
    var exp = state.enemies.reduce(function (s, e) { return s + e.exp; }, 0);
    var gold = state.enemies.reduce(function (s, e) { return s + e.gold; }, 0);
    Game.Party.addGold(gold);
    var levelMsgs = Game.Party.addExp(exp);
    var msg = 'せんとうに かちどきをあげた! ' + exp + 'の けいけんちと ' + gold + 'ゴールドを てにいれた';
    Game.Dialogue.show(msg, function () {
      flushArray(levelMsgs, function () { endBattle('won'); });
    });
    cb(true);
  }

  function flushArray(msgs, done) {
    if (!msgs || msgs.length === 0) { done(); return; }
    var m = msgs.shift();
    Game.Dialogue.show(m, function () { flushArray(msgs, done); });
  }

  function endBattle(result) {
    var cb = state.onEnd;
    var defeatedIds = state.enemies.map(function (e) { return e.id; });
    // 眠りと混乱は戦闘が終われば解ける。毒だけは持ち越す。
    Game.Party.clearTemporaryStatuses();
    state = null;
    if (cb) cb(result, defeatedIds);
  }

  // ---- 予約(コマンドを選んだ瞬間に呼ばれる) ----
  function doAttack(target) { queueAction({ kind: 'attack', target: target }); }
  function doItem(itemEntry, target) { queueAction({ kind: 'item', item: itemEntry, target: target }); }

  // ぼうぎょ と 受け流し は「かまえ」なので、選んだ時点で効き始める。
  // 順番が回ってくる前に殴られても守れるようにしておく。
  function doGuard() {
    var actor = currentActor();
    actor.guarding = 0.5;
    state.log.push(actor.name + 'は みをまもっている。');
    queueAction({ kind: 'guarded' });
  }

  function doSkill(skill, target) {
    var actor = currentActor();
    if (skill.kind === 'guard') {
      actor.mp -= skill.mp;
      actor.guarding = skill.reduction || 0.5;
      state.log.push(actor.name + 'は ' + skill.name + 'の かまえを とった!');
      queueAction({ kind: 'guarded' });
      return;
    }
    queueAction({ kind: 'skill', skill: skill, target: target });
  }

  function doFlee() { queueAction({ kind: 'flee' }); }

  // ---- 解決(すばやさ順に呼ばれる) ----
  function performAction(a, actor) {
    if (a.kind === 'attack') return resolveAttack(actor, a.target);
    if (a.kind === 'skill') return resolveSkill(actor, a.skill, a.target);
    if (a.kind === 'item') return resolveItem(actor, a.item, a.target);
    if (a.kind === 'flee') return resolveFlee(a, actor);
    if (a.kind === 'skip') { state.log.push(a.message); return; }
    if (a.kind === 'confused') return actConfused(actor);
    // 'guarded' は選んだ時点で効いているので、ここでは何もしない
  }

  function resolveAttack(actor, target) {
    if (!target || target.curHp <= 0 || state.enemies.indexOf(target) < 0) {
      target = aliveEnemies()[0];   // 狙っていた相手が先に倒れていたら、残りへ振り替える
      if (!target) return;
    }
    var crit = isCritical(actor);
    // かいしんの一撃は守備力を無視するので、damageOf に def:0 を渡す
    var dmg = crit ? Math.round(damageOf(effAtk(actor), 0) * 1.4) : damageOf(effAtk(actor), effDef(target));
    target.curHp = Math.max(0, target.curHp - dmg);
    if (crit) state.log.push('かいしんの いちげき!!');
    state.log.push(actor.name + 'の こうげき! ' + target.label + 'に ' + dmg + ' の ダメージ');
    if (target.curHp <= 0) state.log.push(target.label + 'を たおした!');
  }

  function resolveItem(actor, itemEntry, target) {
    var def = Game.Data.Items[itemEntry.id];
    var resultMsg = Game.Party.useItem(itemEntry.id, target.id);
    if (resultMsg === null) {
      state.log.push(actor.name + 'は ' + def.name + 'を つかおうとしたが、もう もっていない!');
      return;
    }
    state.log.push(actor.name + 'は ' + def.name + 'を つかった! ' + (resultMsg || ''));
  }

  function resolveFlee(a, actor) {
    var alive = aliveEnemies();
    var avgEnemySpd = alive.reduce(function (s, e) { return s + e.spd; }, 0) / Math.max(1, alive.length);
    var success = Math.random() < (0.5 + (actor.spd - avgEnemySpd) * 0.03);
    if (success) {
      a.fled = true;
      Game.Dialogue.show(actor.name + 'たちは にげだした!', function () { endBattle('fled'); });
      return;
    }
    state.log.push('しかし まわりこまれてしまった!');
  }

  function resolveSkill(actor, skill, target) {
    if (actor.mp < skill.mp) { state.log.push(actor.name + 'は MPが たりない!'); return; }
    actor.mp -= skill.mp;
    var say = actor.name + 'は ' + skill.name + 'を となえた!';

    if (skill.kind === 'heal') {
      var targets = skill.target === 'all_allies' ? Game.Party.aliveList() : [target];
      state.log.push(say);
      targets.forEach(function (t) {
        if (!t || t.hp <= 0) return;
        var heal = skill.power + Math.floor(powerStat(actor, skill) * 0.5);
        var before = t.hp;
        t.hp = Math.min(t.maxHp, t.hp + heal);
        state.log.push(t.name + 'の HPが ' + (t.hp - before) + ' かいふくした');
      });
      return;
    }

    if (skill.kind === 'cure') {
      state.log.push(say);
      var msg = Game.Party.cure(target, skill.cures || []);
      state.log.push(msg || 'しかし なにも おこらなかった');
      return;
    }

    if (skill.kind === 'revive') {
      state.log.push(say);
      if (!target || target.hp > 0) { state.log.push('しかし なにも おこらなかった'); return; }
      if (Math.random() > (skill.chance || 0.5)) { state.log.push('しかし ' + target.name + 'は 生きかえらなかった'); return; }
      target.hp = Math.max(1, Math.round(target.maxHp * (skill.power || 0.5)));
      target.status = null;
      state.log.push(target.name + 'は 生きかえった!');
      return;
    }

    if (skill.kind === 'buff') {
      var allies = skill.target === 'all_allies' ? Game.Party.aliveList() : [target];
      state.log.push(say);
      allies.forEach(function (t) {
        if (!t || t.hp <= 0) return;
        applyMul(t, skill.stat_key, skill.mul);
        state.log.push(t.name + 'の ' + STAT_LABEL[skill.stat_key] + 'が あがった!');
      });
      return;
    }

    if (skill.kind === 'debuff') {
      var foes = skill.target === 'all_enemies' ? aliveEnemies() : [target];
      state.log.push(say);
      foes.forEach(function (t) {
        if (!t || t.curHp <= 0) return;
        applyMul(t, skill.stat_key, skill.mul);
        state.log.push(t.label + 'の ' + STAT_LABEL[skill.stat_key] + 'が さがった!');
      });
      return;
    }

    if (skill.kind === 'ailment') {
      state.log.push(say);
      if (!target || target.curHp <= 0) { state.log.push('しかし なにも おこらなかった'); return; }
      if (target.boss) {
        // ボスには効きにくい。まったく効かないと弱体呪文が死に技になるので、確率を下げるだけ
        if (Math.random() > (skill.chance || 0.5) * 0.35) { state.log.push(target.label + 'には きかなかった!'); return; }
      } else if (Math.random() > (skill.chance || 0.5)) {
        state.log.push(target.label + 'には きかなかった!'); return;
      }
      target.status = skill.ailment;
      state.log.push(target.label + AILMENT_LINE[skill.ailment]);
      return;
    }

    if (skill.kind === 'attack') {
      var list = skill.target === 'all_enemies' ? aliveEnemies() : [target];
      if (skill.target !== 'all_enemies' && (!target || target.curHp <= 0)) list = aliveEnemies().slice(0, 1);
      list.forEach(function (t) {
        var dmg = Math.round(damageOf(powerStat(actor, skill), effDef(t)) * (skill.power || 1));
        t.curHp = Math.max(0, t.curHp - dmg);
        state.log.push(actor.name + 'の ' + skill.name + '! ' + t.label + 'に ' + dmg + ' の ダメージ');
        if (t.curHp <= 0) state.log.push(t.label + 'を たおした!');
      });
    }
  }

  var STAT_LABEL = { atk: 'こうげき力', def: 'しゅび力', spd: 'すばやさ' };
  var AILMENT_LINE = {
    sleep: 'は ねむってしまった!',
    blind: 'は まわりが 見えなくなった!',
    confuse: 'は こんらんした!',
  };

  function currentMenuList() {
    var actor = currentActor();
    if (state.menu === 'main') return commandList();
    if (state.menu === 'skill') return usableSkills(actor);
    if (state.menu === 'item') return usableItems();
    if (state.menu === 'target') return aliveEnemies();
    if (state.menu === 'allytarget') {
      if (state.pendingSkill) {
        return allyTargetsFor(state.pendingSkill.kind === 'revive' ? 'revive' : 'heal');
      }
      if (state.pendingItem) return allyTargetsFor(Game.Data.Items[state.pendingItem.id].kind);
      return []; // 対象が確定していない状態で来ることは本来ないが、落ちないようにしておく
    }
    return [];
  }

  function update() {
    if (!state) return;
    var dialogueWasActive = Game.Dialogue.isActive();
    Game.Dialogue.update();
    if (!state) return; // ダイアログのコールバックで戦闘が終わっている場合がある
    // ダイアログを閉じたのと同じフレームの confirm 入力を、コマンド選択に二重に使わない
    if (dialogueWasActive) return;
    if (Game.Dialogue.isActive() || state.phase === 'resolving' || state.phase === 'intro') return;
    if (state.phase !== 'command') return;

    var list = currentMenuList();

    if (Game.Input.wasPressed('down')) state.cursor = (list.length === 0) ? 0 : (state.cursor + 1) % list.length;
    if (Game.Input.wasPressed('up')) state.cursor = (list.length === 0) ? 0 : (state.cursor - 1 + list.length) % list.length;

    if (Game.Input.wasPressed('cancel')) {
      if (state.menu === 'target' || state.menu === 'allytarget') { state.menu = state.pendingSkill ? 'skill' : (state.pendingItem ? 'item' : 'main'); state.pendingSkill = null; state.pendingItem = null; state.cursor = 0; }
      else if (state.menu !== 'main') { state.menu = 'main'; state.cursor = 0; }
      return;
    }

    if (!Game.Input.wasPressed('confirm') || list.length === 0) return;

    if (state.menu === 'main') {
      var cmd = list[state.cursor].id;
      if (cmd === 'attack') { state.menu = 'target'; state.cursor = 0; }
      else if (cmd === 'skill') { state.menu = 'skill'; state.cursor = 0; }
      else if (cmd === 'item') { state.menu = 'item'; state.cursor = 0; }
      else if (cmd === 'guard') { doGuard(); }
      else if (cmd === 'flee') { doFlee(); }
    } else if (state.menu === 'skill') {
      var chosen = list[state.cursor];
      if (needsNoTarget(chosen)) {
        // 全体がけ・自分がけは対象選択を挟まず即発動する
        state.pendingSkill = null;
        doSkill(chosen, currentActor());
        return;
      }
      state.pendingSkill = chosen;
      state.menu = targetsAlly(chosen) ? 'allytarget' : 'target';
      state.cursor = 0;
    } else if (state.menu === 'item') {
      state.pendingItem = list[state.cursor];
      state.menu = 'allytarget';
      state.cursor = 0;
    } else if (state.menu === 'target') {
      var enemyTarget = list[state.cursor];
      if (state.pendingSkill) { var sk = state.pendingSkill; state.pendingSkill = null; doSkill(sk, enemyTarget); }
      else { doAttack(enemyTarget); }
    } else if (state.menu === 'allytarget') {
      var allyTarget = list[state.cursor];
      if (state.pendingSkill) { var sk2 = state.pendingSkill; state.pendingSkill = null; doSkill(sk2, allyTarget); }
      else { var it = state.pendingItem; state.pendingItem = null; doItem(it, allyTarget); }
    }
  }

  function draw(ctx, W, H) {
    if (!state) return;
    ctx.fillStyle = '#171b2b';
    ctx.fillRect(0, 0, W, H);

    var enemies = state.enemies;
    var startX = W / 2 - (enemies.length - 1) * 70;
    enemies.forEach(function (e, i) {
      var x = startX + i * 140, y = 130;
      ctx.fillStyle = e.curHp > 0 ? (e.boss ? '#8a3230' : '#96702a') : '#333b57';
      ctx.beginPath(); ctx.arc(x, y, e.boss ? 42 : 34, 0, Math.PI * 2); ctx.fill();
      Game.Renderer.drawText(ctx, e.label || e.name, x, y + (e.boss ? 68 : 60), { align: 'center', size: 12 });
      if (e.curHp > 0) Game.Renderer.drawBar(ctx, x - 40, y + (e.boss ? 76 : 68), 80, 7, e.curHp / e.hp, '#8a3230');
      if (state.menu === 'target' && aliveEnemies()[state.cursor] === e) {
        Game.Renderer.drawText(ctx, '▼', x, y - (e.boss ? 54 : 46), { align: 'center', size: 18, color: '#d4af5a' });
      }
    });

    // パーティ全員のステータス(横一列、人数に応じて幅を自動調整)
    var party = Game.Party.list();
    // 会話ウィンドウ(下から110px)と重ならない高さに置く
    var statusY = H - 190, statusH = 68, gap = 6;
    var cardW = (W - 16 - (party.length - 1) * gap) / party.length;
    party.forEach(function (m, i) {
      var x = 8 + i * (cardW + gap), y = statusY;
      var isCurrent = state.phase === 'command' && m.id === state.turnOrder[state.turnIndex];
      Game.Renderer.drawPanel(ctx, x, y, cardW, statusH);
      Game.Renderer.drawText(ctx, (isCurrent ? '▶' : '') + m.name, x + 8, y + 18, { size: 11, color: m.hp <= 0 ? '#6b6354' : (isCurrent ? '#d4af5a' : '#ece7da') });
      var st = Game.Party.statusOf(m);
      if (st) Game.Renderer.drawText(ctx, st.short, x + cardW - 8, y + 18, { size: 11, align: 'right', color: st.color });
      Game.Renderer.drawBar(ctx, x + 8, y + 26, cardW - 16, 7, m.hp / m.maxHp, '#5fae5f');
      Game.Renderer.drawText(ctx, m.hp + '/' + m.maxHp, x + cardW - 8, y + 39, { size: 9, align: 'right', color: '#a49b86' });
      if (m.maxMp > 0) {
        Game.Renderer.drawBar(ctx, x + 8, y + 44, cardW - 16, 7, m.mp / m.maxMp, '#5c8ecf');
        Game.Renderer.drawText(ctx, m.mp + '/' + m.maxMp, x + cardW - 8, y + 57, { size: 9, align: 'right', color: '#a49b86' });
      }
    });

    // コマンドメニュー(下段・横いっぱい、現在の行動者ぶんのみ)
    var menuY = H - 84, menuH = 76;
    if (state.phase === 'command' && state.menu !== 'target' && state.menu !== 'allytarget') {
      var list = currentMenuList();
      Game.Renderer.drawPanel(ctx, 8, menuY, W - 16, menuH);
      if (list.length === 0) {
        Game.Renderer.drawText(ctx, '(つかえるものが ない)', 20, menuY + 24, { size: 12, color: '#a49b86' });
      }
      var cols = list.length > 4 ? 2 : 1;
      var colW = (W - 32) / cols;
      list.forEach(function (item, i) {
        var label = item.label
          || (item.name && item.name + (item.mp > 0 ? '  MP' + item.mp : ''))
          || (Game.Data.Items[item.id] && Game.Data.Items[item.id].name + ' x' + item.count);
        var prefix = i === state.cursor ? '▶ ' : '　';
        var col = Math.floor(i / Math.ceil(list.length / cols));
        var row = i % Math.ceil(list.length / cols);
        Game.Renderer.drawText(ctx, prefix + label, 20 + col * colW, menuY + 20 + row * 18, { size: 12 });
      });
    } else if (state.phase === 'command' && state.menu === 'allytarget') {
      Game.Renderer.drawPanel(ctx, 8, menuY, W - 16, menuH);
      Game.Renderer.drawText(ctx, 'だれに つかう?', 20, menuY + 18, { size: 12, color: '#a49b86' });
      currentMenuList().forEach(function (m, i) {
        var prefix = i === state.cursor ? '▶ ' : '　';
        Game.Renderer.drawText(ctx, prefix + m.name, 20 + (i % 2) * (W / 2 - 20), menuY + 38 + Math.floor(i / 2) * 18, { size: 12 });
      });
    }

    Game.Dialogue.draw(ctx, W, H);
  }

  return { __commands: commandList, start: start, isActive: isActive, update: update, draw: draw };
})();
