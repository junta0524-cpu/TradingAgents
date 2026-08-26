// 戦闘システム ― コマンド選択式のターン制バトル(たたかう/じゅもん/どうぐ/にげる)
var Game = window.Game || {};
Game.Battle = (function () {
  var R = null; // renderer は init 時に注入
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
      actorId: Game.Data.PARTY_ORDER[0],
      menu: 'main',
      cursor: 0,
      targetCursor: 0,
      onEnd: onEnd,
      log: [],
    };
    var names = state.enemies.map(function (e) { return e.name; }).join('と');
    Game.Dialogue.show(names + 'が あらわれた!', function () {
      state.phase = 'command';
    });
  }

  function isActive() { return !!state; }

  function aliveEnemies() { return state.enemies.filter(function (e) { return e.curHp > 0; }); }

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
    return Game.Party.inventory().filter(function (it) { return it.count > 0; });
  }

  function damageOf(atk, def) {
    var base = Math.max(1, atk - Math.floor(def * 0.6));
    var variance = Math.floor(base * 0.2);
    return base + Math.floor(Math.random() * (variance * 2 + 1)) - variance;
  }

  function queueEnemyTurns() {
    aliveEnemies().forEach(function (enemy) {
      var target = Game.Party.get(state.actorId);
      if (target.hp <= 0) return;
      var dmg = damageOf(enemy.atk, target.def);
      target.hp = Math.max(0, target.hp - dmg);
      state.log.push(enemy.name + 'の こうげき! ' + target.name + 'に ' + dmg + ' の ダメージ');
    });
  }

  function flushLog(next) {
    if (state.log.length === 0) { next(); return; }
    var msg = state.log.shift();
    Game.Dialogue.show(msg, function () { flushLog(next); });
  }

  function afterPlayerAction() {
    checkEnemiesDefeated(function (over) {
      if (over) return;
      queueEnemyTurns();
      flushLog(function () {
        var actor = Game.Party.get(state.actorId);
        if (actor.hp <= 0) {
          endBattle('lost');
        } else {
          state.phase = 'command';
          state.menu = 'main';
          state.cursor = 0;
        }
      });
    });
  }

  function checkEnemiesDefeated(cb) {
    if (aliveEnemies().length > 0) { cb(false); return; }
    var exp = state.enemies.reduce(function (s, e) { return s + e.exp; }, 0);
    var gold = state.enemies.reduce(function (s, e) { return s + e.gold; }, 0);
    Game.Party.addGold(gold);
    var leveled = Game.Party.addExp(state.actorId, exp);
    var msg = 'せんとうに かちどきをあげた! ' + exp + 'の けいけんちと ' + gold + 'ゴールドを てにいれた';
    Game.Dialogue.show(msg, function () {
      if (leveled) {
        var actor = Game.Party.get(state.actorId);
        Game.Dialogue.show(actor.name + ' は レベル' + actor.level + ' に あがった!', function () { endBattle('won'); });
      } else {
        endBattle('won');
      }
    });
    cb(true);
  }

  function endBattle(result) {
    var cb = state.onEnd;
    state = null;
    if (cb) cb(result);
  }

  function doAttack(target) {
    var actor = Game.Party.get(state.actorId);
    var dmg = damageOf(actor.atk, target.def);
    target.curHp = Math.max(0, target.curHp - dmg);
    state.log.push(actor.name + 'の こうげき! ' + target.name + 'に ' + dmg + ' の ダメージ');
    if (target.curHp <= 0) state.log.push(target.name + 'を たおした!');
    state.phase = 'resolving';
    flushLog(afterPlayerAction);
  }

  function doSkill(skill, target) {
    var actor = Game.Party.get(state.actorId);
    actor.mp -= skill.mp;
    if (skill.kind === 'heal') {
      actor.hp = Math.min(actor.maxHp, actor.hp + skill.power);
      state.log.push(actor.name + 'は ' + skill.name + 'を となえた! HPが かいふくした');
    } else if (skill.kind === 'attack') {
      var targets = skill.target === 'all_enemies' ? aliveEnemies() : [target];
      targets.forEach(function (t) {
        var dmg = Math.round(damageOf(actor.atk, t.def) * (skill.power || 1));
        t.curHp = Math.max(0, t.curHp - dmg);
        state.log.push(actor.name + 'の ' + skill.name + '! ' + t.name + 'に ' + dmg + ' の ダメージ');
      });
    }
    state.phase = 'resolving';
    flushLog(afterPlayerAction);
  }

  function doItem(itemEntry) {
    var actor = Game.Party.get(state.actorId);
    Game.Party.useItem(itemEntry.id, state.actorId);
    var def = Game.Data.Items[itemEntry.id];
    state.log.push(actor.name + 'は ' + def.name + 'を つかった!');
    state.phase = 'resolving';
    flushLog(afterPlayerAction);
  }

  function doFlee() {
    var actor = Game.Party.get(state.actorId);
    var avgEnemySpd = state.enemies.reduce(function (s, e) { return s + e.spd; }, 0) / state.enemies.length;
    var success = Math.random() < (0.5 + (actor.spd - avgEnemySpd) * 0.03);
    if (success) {
      Game.Dialogue.show('うまく にげきれた!', function () { endBattle('fled'); });
    } else {
      state.log.push('にげられなかった!');
      state.phase = 'resolving';
      flushLog(afterPlayerAction);
    }
  }

  function update() {
    if (!state) return;
    Game.Dialogue.update();
    // Dialogue.update() 内のコールバックで endBattle() が同期的に呼ばれ、
    // state がここで null になっている場合があるため再チェックする
    if (!state) return;
    if (Game.Dialogue.isActive() || state.phase === 'resolving' || state.phase === 'intro') return;

    if (state.phase === 'command') {
      var list = state.menu === 'main' ? commandList()
        : state.menu === 'skill' ? usableSkills(Game.Party.get(state.actorId))
        : state.menu === 'item' ? usableItems() : [];

      if (Game.Input.wasPressed('down')) state.cursor = (state.cursor + 1) % Math.max(1, list.length);
      if (Game.Input.wasPressed('up')) state.cursor = (state.cursor - 1 + list.length) % Math.max(1, list.length);

      if (Game.Input.wasPressed('cancel') && state.menu !== 'main') { state.menu = 'main'; state.cursor = 0; return; }

      if (Game.Input.wasPressed('confirm')) {
        if (state.menu === 'main') {
          var cmd = list[state.cursor].id;
          if (cmd === 'attack') { state.menu = 'target'; state.cursor = 0; }
          else if (cmd === 'skill') { state.menu = 'skill'; state.cursor = 0; }
          else if (cmd === 'item') { state.menu = 'item'; state.cursor = 0; }
          else if (cmd === 'flee') { doFlee(); }
        } else if (state.menu === 'skill') {
          if (list.length === 0) return;
          state.pendingSkill = list[state.cursor];
          if (state.pendingSkill.kind === 'heal') { doSkill(state.pendingSkill, null); }
          else { state.menu = 'target'; state.cursor = 0; }
        } else if (state.menu === 'item') {
          if (list.length === 0) return;
          doItem(list[state.cursor]);
        } else if (state.menu === 'target') {
          var enemies = aliveEnemies();
          var target = enemies[state.cursor];
          if (!target) return;
          if (state.pendingSkill) { doSkill(state.pendingSkill, target); state.pendingSkill = null; }
          else { doAttack(target); }
        }
      }
    }
  }

  function draw(ctx, W, H) {
    if (!state) return;
    ctx.fillStyle = '#171b2b';
    ctx.fillRect(0, 0, W, H);

    // enemies
    var enemies = state.enemies;
    var startX = W / 2 - (enemies.length - 1) * 70;
    enemies.forEach(function (e, i) {
      var x = startX + i * 140, y = 150;
      ctx.fillStyle = e.curHp > 0 ? (e.boss ? '#8a3230' : '#96702a') : '#333b57';
      ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
      Game.Renderer.drawText(ctx, e.name, x, y + 60, { align: 'center', size: 13 });
      if (e.curHp > 0) Game.Renderer.drawBar(ctx, x - 40, y + 68, 80, 8, e.curHp / e.hp, '#8a3230');
      if (state.menu === 'target' && aliveEnemies()[state.cursor] === e) {
        Game.Renderer.drawText(ctx, '▼', x, y - 46, { align: 'center', size: 18, color: '#d4af5a' });
      }
    });

    // party status
    var actor = Game.Party.get(state.actorId);
    Game.Renderer.drawPanel(ctx, 16, H - 150, 220, 90);
    Game.Renderer.drawText(ctx, actor.name + '  Lv' + actor.level, 30, H - 124, { size: 14 });
    Game.Renderer.drawText(ctx, 'HP', 30, H - 100, { size: 12, color: '#a49b86' });
    Game.Renderer.drawBar(ctx, 60, H - 108, 150, 10, actor.hp / actor.maxHp, '#5fae5f');
    Game.Renderer.drawText(ctx, actor.hp + '/' + actor.maxHp, 218, H - 100, { size: 11, align: 'right', color: '#a49b86' });
    Game.Renderer.drawText(ctx, 'MP', 30, H - 80, { size: 12, color: '#a49b86' });
    Game.Renderer.drawBar(ctx, 60, H - 88, 150, 10, actor.maxMp ? actor.mp / actor.maxMp : 0, '#5c8ecf');
    Game.Renderer.drawText(ctx, actor.mp + '/' + actor.maxMp, 218, H - 80, { size: 11, align: 'right', color: '#a49b86' });

    // command menu
    if (state.phase === 'command' && state.menu !== 'target') {
      var list = state.menu === 'main' ? commandList()
        : state.menu === 'skill' ? usableSkills(actor)
        : usableItems();
      var x = 260, y = H - 150, w = W - 276, h = 90;
      Game.Renderer.drawPanel(ctx, x, y, w, h);
      if (list.length === 0) {
        Game.Renderer.drawText(ctx, '(つかえるものが ない)', x + 16, y + 30, { size: 13, color: '#a49b86' });
      }
      list.forEach(function (item, i) {
        var label = item.label || item.name || (Game.Data.Items[item.id] && Game.Data.Items[item.id].name + ' x' + item.count);
        var prefix = i === state.cursor ? '▶ ' : '　';
        Game.Renderer.drawText(ctx, prefix + label, x + 16, y + 26 + i * 20, { size: 14 });
      });
    }

    Game.Dialogue.draw(ctx, W, H);
  }

  return { start: start, isActive: isActive, update: update, draw: draw };
})();
