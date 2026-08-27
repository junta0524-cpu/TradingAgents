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
      onEnd: onEnd,
      log: [],
    };
    clearGuards();
    var names = state.enemies.map(function (e) { return e.name; }).join('と');
    Game.Dialogue.show(names + 'が あらわれた!', function () { beginTurn(); });
  }

  function isActive() { return !!state; }
  function aliveEnemies() { return state.enemies.filter(function (e) { return e.curHp > 0; }); }
  function currentActor() { return Game.Party.get(state.turnOrder[state.turnIndex]); }

  function commandList() {
    return [
      { id: 'attack', label: 'たたかう' },
      { id: 'skill', label: 'じゅもん' },
      { id: 'item', label: 'どうぐ' },
      { id: 'flee', label: 'にげる' },
    ];
  }

  function usableSkills(actor) {
    return actor.skills
      .map(function (sid) { return Game.Data.Skills[sid]; })
      .filter(function (s) { return s.mp <= actor.mp; });
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

  function damageOf(atk, def) {
    var base = Math.max(1, atk - Math.floor(def * 0.6));
    var variance = Math.floor(base * 0.2);
    return base + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
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
    var dmg = damageOf(actor.atk, target.def);
    if (isEnemy) {
      target.curHp = Math.max(0, target.curHp - dmg);
      state.log.push(actor.name + 'の こうげき! ' + target.name + 'に ' + dmg + ' の ダメージ');
      if (target.curHp <= 0) state.log.push(target.name + 'を たおした!');
    } else {
      hurt(target, dmg);
      state.log.push(actor.name + 'は なかまの ' + target.name + 'を 殴ってしまった! ' + dmg + ' の ダメージ');
    }
  }

  // 手番の開始処理。眠っていたり混乱していたら、コマンドを出さずに解決する。
  function beginTurn() {
    var actor = currentActor();
    if (!actor || actor.hp <= 0) { advanceTurn(); return; }
    var canAct = resolveTurnStatus(actor);
    var statusDef = Game.Party.statusOf(actor);
    if (!canAct) {
      state.phase = 'resolving';
      flushLog(advanceTurn);
      return;
    }
    if (statusDef && statusDef.randomTarget) {
      actConfused(actor);
      state.phase = 'resolving';
      flushLog(advanceTurn);
      return;
    }
    state.phase = 'command';
    state.menu = 'main';
    state.cursor = 0;
  }

  function advanceTurn() {
    state.turnIndex += 1;
    // 敵が全滅していたら、残りの行動者の手番は飛ばして即ラウンドを終える
    // (放っておくと「たたかう」を選んでも対象がいない target メニューで入力を待ち続けてしまう)
    if (aliveEnemies().length === 0) { endPlayerPhase(); return; }
    if (state.turnIndex < state.turnOrder.length) beginTurn();
    else endPlayerPhase();
  }

  function endPlayerPhase() {
    checkEnemiesDefeated(function (over) {
      if (over) return;
      queueEnemyTurns();
      flushLog(function () {
        if (Game.Party.isWiped()) {
          endBattle('lost');
        } else {
          clearGuards(); // 防御の効果はこのラウンドの敵の攻撃までで切れる
          tickPoison();
          flushLog(function () {
            if (Game.Party.isWiped()) { endBattle('lost'); return; }
            state.turnOrder = Game.Party.aliveList().map(function (m) { return m.id; });
            state.turnIndex = 0;
            beginTurn();
          });
        }
      });
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

  function queueEnemyTurns() {
    aliveEnemies().forEach(function (enemy) {
      var alive = Game.Party.aliveList();
      if (alive.length === 0) return;
      var useSkill = enemy.boss && enemy.bossSkills && Math.random() < 0.35;
      if (useSkill) {
        var skill = enemy.bossSkills[Math.floor(Math.random() * enemy.bossSkills.length)];
        if (skill.target === 'all_party') {
          alive.forEach(function (member) {
            var dmg = hurt(member, Math.round(damageOf(enemy.atk, member.def) * skill.power));
            state.log.push(enemy.name + 'の ' + skill.name + '! ' + member.name + 'に ' + dmg + ' の ダメージ');
          });
          return;
        }
      }
      var target = alive[Math.floor(Math.random() * alive.length)];
      var dmg2 = hurt(target, damageOf(enemy.atk, target.def));
      state.log.push(enemy.name + 'の こうげき! ' + target.name + 'に ' + dmg2 + ' の ダメージ');
      // 状態異常を持つ魔物は、攻撃に乗せて仕掛けてくる
      if (enemy.inflict && target.hp > 0 && Math.random() < enemy.inflict.chance) {
        var msg = Game.Party.inflict(target, enemy.inflict.status);
        if (msg) state.log.push(msg);
      }
    });
  }

  function checkEnemiesDefeated(cb) {
    if (aliveEnemies().length > 0) { cb(false); return; }
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

  function doAttack(target) {
    var actor = currentActor();
    var dmg = damageOf(actor.atk, target.def);
    target.curHp = Math.max(0, target.curHp - dmg);
    state.log.push(actor.name + 'の こうげき! ' + target.name + 'に ' + dmg + ' の ダメージ');
    if (target.curHp <= 0) state.log.push(target.name + 'を たおした!');
    state.phase = 'resolving';
    flushLog(advanceTurn);
  }

  function doSkill(skill, target) {
    var actor = currentActor();
    actor.mp -= skill.mp;
    if (skill.kind === 'guard') {
      actor.guarding = skill.reduction || 0.5;
      state.log.push(actor.name + 'は ' + skill.name + 'の かまえを とった!');
    } else if (skill.kind === 'heal') {
      target.hp = Math.min(target.maxHp, target.hp + skill.power);
      state.log.push(actor.name + 'は ' + skill.name + 'を となえた! ' + target.name + 'の HPが かいふくした');
    } else if (skill.kind === 'attack') {
      var targets = skill.target === 'all_enemies' ? aliveEnemies() : [target];
      targets.forEach(function (t) {
        var dmg = Math.round(damageOf(actor.atk, t.def) * (skill.power || 1));
        t.curHp = Math.max(0, t.curHp - dmg);
        state.log.push(actor.name + 'の ' + skill.name + '! ' + t.name + 'に ' + dmg + ' の ダメージ');
        if (t.curHp <= 0) state.log.push(t.name + 'を たおした!');
      });
    }
    state.phase = 'resolving';
    flushLog(advanceTurn);
  }

  function doItem(itemEntry, target) {
    var actor = currentActor();
    var def = Game.Data.Items[itemEntry.id];
    var resultMsg = Game.Party.useItem(itemEntry.id, target.id);
    state.log.push(actor.name + 'は ' + def.name + 'を つかった! ' + (resultMsg || ''));
    state.phase = 'resolving';
    flushLog(advanceTurn);
  }

  function doFlee() {
    var actor = currentActor();
    var avgEnemySpd = state.enemies.reduce(function (s, e) { return s + e.spd; }, 0) / state.enemies.length;
    var success = Math.random() < (0.5 + (actor.spd - avgEnemySpd) * 0.03);
    if (success) {
      Game.Dialogue.show('うまく にげきれた!', function () { endBattle('fled'); });
    } else {
      state.log.push('にげられなかった!');
      state.phase = 'resolving';
      flushLog(endPlayerPhase);
    }
  }

  function currentMenuList() {
    var actor = currentActor();
    if (state.menu === 'main') return commandList();
    if (state.menu === 'skill') return usableSkills(actor);
    if (state.menu === 'item') return usableItems();
    if (state.menu === 'target') return aliveEnemies();
    if (state.menu === 'allytarget') {
      if (state.pendingSkill) return allyTargetsFor('heal');
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
      else if (cmd === 'flee') { doFlee(); }
    } else if (state.menu === 'skill') {
      var chosen = list[state.cursor];
      if (isSelfSkill(chosen)) {
        // 自分にかける技は対象選択を挟まず即発動する
        state.pendingSkill = null;
        doSkill(chosen, currentActor());
        return;
      }
      state.pendingSkill = chosen;
      state.menu = isHealKind(chosen.kind) ? 'allytarget' : 'target';
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
      Game.Renderer.drawText(ctx, e.name, x, y + (e.boss ? 68 : 60), { align: 'center', size: 12 });
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

  return { start: start, isActive: isActive, update: update, draw: draw };
})();
