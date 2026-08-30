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
    Game.Fx.clear();   // 前の戦いの揺れや点滅を持ち越さない
    Game.Assets.preloadMonsters(monsterIds);
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
      surprise: 0,   // 1=こちらの先制 / -1=不意打ちされた / 0=ふつう
      // このラウンドで すでに手配ずみのもの。方針で動くとき、
      // 1個しかない品を二人が同時に選ぶ「むだうち」を減らすために見る
      booked: { items: {}, revive: {} },
    };
    labelEnemies(state.enemies);
    clearGuards();
    clearBattleMul();
    state.surprise = rollSurprise();
    Game.Audio.play('encounter');   // 出くわした合図。文より先に鳴る
    Game.Fx.fade(9, 4);             // 一拍 暗くしてから戦闘画面へ
    Game.Dialogue.show(encounterLine(state.enemies), function () {
      if (state.surprise === 0) { beginTurn(); return; }
      Game.Dialogue.show(state.surprise > 0
        ? '魔物は こちらに 気づいていない!'
        : '魔物に 先手を とられた!', function () {
        if (state.surprise > 0) { beginTurn(); return; }
        // 不意打ち。こちらのコマンドを飛ばして、魔物だけが動く一巡を先に置く
        state.phase = 'resolving';
        var q = aliveEnemies().map(function (e) { return { kind: 'enemy', enemy: e }; });
        runQueue(q, 0);
      });
    });
  }

  // 先手をどちらが取るか。すばやさの差で決め、極端には振れないようにする。
  // すばやいパーティは不意打ちを受けにくく、鈍いパーティは受けやすい。
  function rollSurprise() {
    var ours = Game.Party.aliveList().reduce(function (n, m) { return n + effSpd(m); }, 0) /
               Math.max(1, Game.Party.aliveList().length);
    var theirs = state.enemies.reduce(function (n, e) { return n + effSpd(e); }, 0) /
                 Math.max(1, state.enemies.length);
    var edge = (ours - theirs) / Math.max(4, ours + theirs);   // おおむね -0.5〜0.5
    if (Math.random() < 0.16 + edge * 0.2) return 1;
    if (Math.random() < 0.12 - edge * 0.2) return -1;
    return 0;
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
  function aliveEnemies() {
    return state.enemies.filter(function (e) { return e.curHp > 0 && !e.fled; });
  }
  function currentActor() { return Game.Party.get(state.turnOrder[state.turnIndex]); }

  function commandList(actor) {
    var rows = [
      { id: 'attack', label: 'たたかう' },
      { id: 'skill', label: 'じゅもん' },
    ];
    // 猛りが満ちている者だけ、そのひとの一撃を選べる
    if (actor && isFuming(actor) && actor.limit) rows.push({ id: 'rage', label: 'たける' });
    rows.push({ id: 'guard', label: 'ぼうぎょ' });
    rows.push({ id: 'item', label: 'どうぐ' });
    rows.push({ id: 'flee', label: 'にげる' });
    rows.push({ id: 'tactic', label: 'さくせん' });
    return rows;
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
    state.enemies.forEach(function (e) {
      e.battleMul = null; e.status = null; e.echo = 0; e.echoHeld = false;
    });
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

  // ---- 呼応 ----
  // 弱点を続けて突くと、その相手のなかで手応えが積み上がっていく。
  // 魔物図鑑には9系統×5属性の耐性表が組んであるのに、
  // 一番強い呪文を1発撃てば終わり、では その表が遊びに出てこない。
  // 「同じ弱点で押し続ける」ことに意味を持たせて、属性を選ぶ判断をつくる。
  var ECHO_MAX = 4;
  function echoMul(target) { return 1 + 0.22 * Math.min(target.echo || 0, ECHO_MAX); }

  // 種族ごとの効き方をダメージに乗せ、手応えを一言で添える。
  // 弱点を突けているかどうかが、遊んでいて分かるようにしておく。
  function applyResistance(target, element, dmg) {
    var r = Game.Data.resistanceOf(target, element);
    var weak = r >= 1.4;
    // 弱点なら呼応が伸び、外せば途切れる
    var before = target.echo || 0;
    target.echo = weak ? Math.min(ECHO_MAX, before + 1) : 0;
    target.echoHeld = true;   // このラウンドは維持された

    var out = Math.max(0, Math.round(dmg * r * echoMul(target)));
    var note = '';
    if (r === 0) { note = ' ' + target.label + 'には きかない!'; }
    else if (weak) {
      note = ' 弱点を ついた!';
      if (target.echo > before && target.echo > 1) note += ' 呼応が 高まる!';
    }
    else if (r <= 0.7) { note = ' しかし 効果は うすい……'; }
    if (!weak && before > 1) note += ' ' + target.label + 'の 呼応が とぎれた……';
    return { dmg: out, note: note };
  }

  // かいしんの一撃。うんのよさが高いほど出やすい(上限12%)。守備を無視して大きく入る。
  function isCritical(actor) {
    return Math.random() < Math.min(0.12, (actor.luck || 0) * 0.004);
  }

  // ログの一行に演出を添える。文章が出るのと同時に、画面のほうも反応させたい。
  // (ラウンドはまとめて解決してからログを流すので、解決時に演出を出すと
  //  文章より先に画面だけが暴れることになる)
  function say(text, fx) { state.log.push(fx ? { t: text, fx: fx } : text); }

  function flushLog(next) {
    if (state.log.length === 0) { next(); return; }
    var msg = state.log.shift();
    var text = (typeof msg === 'string') ? msg : msg.t;
    if (msg && msg.fx) msg.fx();
    Game.Dialogue.show(text, function () { flushLog(next); });
  }

  // 仲間が受けた一撃。減ったぶんが大きいほど強く揺れる
  function fxPartyHurt(member, dmg) {
    return function () { Game.Fx.partyHurt(dmg / Math.max(1, member.maxHp)); };
  }
  // 魔物が受けた一撃。半分以上持っていったなら画面も少し揺らす
  function fxEnemyHurt(enemy, dmg) {
    var key = state.enemies.indexOf(enemy);
    var big = dmg >= enemy.hp * 0.35;
    return function () { Game.Fx.enemyHurt(key, big); };
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
      say(actor.name + 'の こうげき! ' + target.label + 'に ' + dmg + ' の ダメージ', fxEnemyHurt(target, dmg));
      if (target.curHp <= 0) say(target.label + 'を たおした!', vanish(target));
    } else {
      hurt(target, dmg);
      say(actor.name + 'は なかまの ' + target.name + 'を 殴ってしまった! ' + dmg + ' の ダメージ', fxPartyHurt(target, dmg));
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
    // 方針が決まっているなら、コマンドを出さずに自分で動く
    if (Game.Party.tactic() !== 'manual') { queueAction(aiAction(actor)); return; }
    state.phase = 'command';
    state.menu = 'main';
    state.cursor = 0;
  }

  // ---- さくせん ----
  // 方針だけ決めてあるときは、コマンドを出さずに自分で選ぶ。
  // どれを選んだかは、解決のときに文章として出るので、見ていれば分かる。

  // いちばん傷ついている仲間。回復の相手を決めるのに使う
  function weakestAlly() {
    var list = Game.Party.aliveList();
    if (list.length === 0) return null;
    return list.slice().sort(function (a, b) {
      return (a.hp / a.maxHp) - (b.hp / b.maxHp);
    })[0];
  }
  function hurtRatio(m) { return m ? m.hp / m.maxHp : 1; }

  // 唱えられる技のうち、条件に合うものから いちばん威力の高いものを選ぶ
  function bestSkill(actor, pick) {
    var found = null;
    usableSkills(actor).forEach(function (sk) {
      if (!pick(sk)) return;
      if (!found || (sk.power || 0) > (found.power || 0)) found = sk;
    });
    return found;
  }

  // このラウンドで まだ手配されていない品を返す。
  // 所持数から、すでに誰かが選んだ分を引いて考える。
  function spareItem(kind) {
    return usableItems().filter(function (it) {
      if (Game.Data.Items[it.id].kind !== kind) return false;
      return it.count - (state.booked.items[it.id] || 0) > 0;
    })[0] || null;
  }
  function bookItem(entry, target) {
    state.booked.items[entry.id] = (state.booked.items[entry.id] || 0) + 1;
    return { kind: 'item', item: entry, target: target };
  }

  function aiAction(actor) {
    var tactic = Game.Party.tactic();
    var foes = aliveEnemies();
    var mpLeft = actor.maxMp ? actor.mp / actor.maxMp : 0;

    // どの方針でも、倒れた仲間がいるなら まず起こす。
    // 呪文が無くても、フェニックスの雫のような品があればそれを使う。
    var fallen = Game.Party.deadList().filter(function (m) { return !state.booked.revive[m.id]; })[0];
    if (fallen) {
      var revive = tactic === 'nomagic'
        ? null : bestSkill(actor, function (sk) { return sk.kind === 'revive'; });
      if (revive) { state.booked.revive[fallen.id] = true; return { kind: 'skill', skill: revive, target: fallen }; }
      var elixir = spareItem('revive');
      if (elixir) {
        state.booked.revive[fallen.id] = true;
        return bookItem(elixir, fallen);
      }
    }

    // 猛りが満ちているなら叩きつける。ここを書かないと、
    // 「めいれいさせろ」以外の方針では一生使われない機能になる。
    // 「いのちだいじに」は、まず仲間の傷を診てからにする。
    if (isFuming(actor) && actor.limit && foes.length && tactic !== 'careful') {
      return { kind: 'rage', target: foes[0] };
    }

    // 手当て。「いのちだいじに」は早めに、「ガンガン」は瀕死のときだけ
    var hurtLine = tactic === 'careful' ? 0.6 : 0.28;
    var weak = weakestAlly();
    if (tactic !== 'nomagic' && weak && hurtRatio(weak) <= hurtLine) {
      var heal = bestSkill(actor, function (sk) { return sk.kind === 'heal'; });
      if (heal) return { kind: 'skill', skill: heal, target: weak };
      // 唱えられないなら薬草で
      var potion = spareItem('heal_hp');
      if (potion) return bookItem(potion, weak);
    }

    // 相手が はぐれ者ばかりなら、技も呪文も通らない。
    // 硬い体を破れるのは かいしんの一撃だけなので、素直に殴りにいく。
    var allMetal = foes.length > 0 && foes.every(function (e) { return e.metal; });

    // 攻めの技。魔物が2体以上なら全体がけを優先する
    if (!allMetal && tactic !== 'nomagic' && foes.length > 0) {
      var wantAll = foes.length >= 2;
      var atk = bestSkill(actor, function (sk) {
        if (sk.kind !== 'attack') return false;
        if (wantAll) return sk.target === 'all_enemies';
        return sk.target !== 'all_enemies';
      }) || bestSkill(actor, function (sk) { return sk.kind === 'attack'; });
      // MPを使い切らないよう、「いのちだいじに」は残り半分を切ったら唱えない
      var spare = tactic === 'careful' ? mpLeft > 0.5 : mpLeft > 0.15;
      if (atk && spare) return { kind: 'skill', skill: atk, target: foes[0] };
    }

    return { kind: 'attack', target: foes[0] };
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
    state.booked = { items: {}, revive: {} };   // 次のラウンドのために手配を白紙に戻す
    // 先制を取った最初のラウンドだけ、魔物は行動しない
    if (state.surprise > 0) state.surprise = 0;
    else aliveEnemies().forEach(function (e) { queue.push({ kind: 'enemy', enemy: e }); });
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
    if (state.surprise < 0) state.surprise = 0;   // 不意打ちの一巡はここで終わり
    // 1ラウンドまるごと弱点を突けなければ、呼応は一段ゆるむ。
    // ボスは二段ゆるむので、押し切るには手数がいる
    state.enemies.forEach(function (e) {
      if (!e.echoHeld && e.echo) e.echo = Math.max(0, e.echo - (e.boss ? 2 : 1));
      e.echoHeld = false;
    });
    tickPoison();
    autoHerb();
    flushLog(function () {
      if (Game.Party.isWiped()) { endBattle('lost'); return; }
      if (aliveEnemies().length === 0) { checkEnemiesDefeated(function () {}); return; }
      state.turnOrder = Game.Party.aliveList().map(function (m) { return m.id; });
      state.turnIndex = 0;
      beginTurn();
    });
  }

  // 防御中(受け流し)なら被ダメージを軽減して適用し、実際に与えたダメージを返す
  // ---- 猛り ----
  // 押し込まれている側に「あと一手」を持たせる。
  // いままで、負けているときの選択肢は 回復して耐える しかなかった。
  // 殴られたからこそ返せる、という軸をひとつ足す。
  var RAGE_FULL = 100;
  function isFuming(m) { return (m.rage || 0) >= RAGE_FULL; }

  // element を渡すと、装備の銘による属性の弾きが乗る。
  // 物理の打撃には 'physical' を渡す ―― 棘の胸当てがここを見て打ち返す。
  function hurt(member, rawDmg, element) {
    var traits = Game.Party.traitsOf(member);
    var r = element && traits.resist[element];
    var dmg = r === undefined || r === null ? rawDmg : Math.max(1, Math.round(rawDmg * r));
    if (member.guarding) dmg = Math.max(1, Math.round(dmg * (1 - member.guarding)));
    member.hp = Math.max(0, member.hp - dmg);
    // 最大HPの7割ぶんを持っていかれると満ちる
    member.rage = Math.min(RAGE_FULL, (member.rage || 0) + Math.round(dmg / member.maxHp * 140));
    if (member.hp <= 0) {
      // 仲間が倒れると、残った者の猛りが跳ねる
      Game.Party.aliveList().forEach(function (o) {
        o.rage = Math.min(RAGE_FULL, (o.rage || 0) + 25);
      });
    }
    return dmg;
  }

  // 癒しの首飾り。深手を負っている者が、袋の薬草をひとりでに使う。
  // 銘のある者だけ、しかも袋に薬草があるときだけ働く。
  function autoHerb() {
    Game.Party.aliveList().forEach(function (m) {
      if (!Game.Party.traitsOf(m).autoHerb) return;
      if (m.hp > m.maxHp * 0.25) return;
      // 効きの弱いものから使う。上級の薬草を無駄打ちしない
      var herb = Game.Party.inventory().filter(function (it) {
        var d = Game.Data.Items[it.id];
        return d && d.kind === 'heal_hp' && it.count > 0;
      }).sort(function (a, b) {
        return (Game.Data.Items[a.id].power || 0) - (Game.Data.Items[b.id].power || 0);
      })[0];
      if (!herb) return;
      var def = Game.Data.Items[herb.id];
      Game.Party.consumeItem(herb.id);
      var healed = Math.min(def.power || 20, m.maxHp - m.hp);
      m.hp += healed;
      say(m.name + 'の 首飾りが 光り、' + def.name + 'が ひとりでに つかわれた! ' +
          healed + ' 回復した', function () { Game.Audio.play('heal'); });
    });
  }

  // ラウンドの終わりに、毒に侵されている仲間を削る
  function tickPoison() {
    Game.Party.aliveList().forEach(function (m) {
      var def = Game.Party.statusOf(m);
      if (!def || !def.poisonDamage) return;
      m.hp = Math.max(0, m.hp - def.poisonDamage);
      say(m.name + def.onTick + ' ' + def.poisonDamage + ' の ダメージ', fxPartyHurt(m, def.poisonDamage));
    });
  }

  // 手負いの雑魚は逃げ出すことがある。最後の1匹は逃げない(戦闘が空振りに終わるため)
  function maybeFlee(enemy) {
    if (enemy.boss) return false;
    // はぐれ者は無傷でも逃げる。最後の一匹でも逃げるので、取り逃がすことがある
    if (enemy.metal) {
      if (Math.random() > 0.45) return false;
      enemy.fled = true;   // 取り分から外れる。絵が消えるのは文を送ったとき
      say(enemy.label + 'は すばやく にげさった!', vanish(enemy, true));
      return true;
    }
    if (aliveEnemies().length <= 1) return false;
    if (enemy.curHp > enemy.hp * 0.3) return false;
    if (Math.random() > 0.3) return false;
    enemy.fled = true;
    say(enemy.label + 'は にげだした!', vanish(enemy, true));
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
        say(enemy.label + 'は こんらんして ' + pal.label + 'を 攻撃した! ' + d + ' の ダメージ', fxEnemyHurt(pal, d));
        if (pal.curHp <= 0) say(pal.label + 'は たおれた!', vanish(pal));
      } else {
        state.log.push(enemy.label + 'は こんらんして あたりを 殴っている。');
      }
      return false;
    }
    // 目つぶしは、そのうち解ける。解けないままだと1回当てただけで戦いが終わる
    if (enemy.status === 'blind' && Math.random() < 0.25) {
      state.log.push(enemy.label + 'の 目が 見えるように なった!');
      enemy.status = null;
    }
    return true;  // blind は行動はできる(命中が落ちる)
  }

  // 前に立つ者ほど狙われる。ドラクエの隊列と同じで、
  // 並び順そのものが「誰に矢面へ立ってもらうか」という判断になる。
  var ROW_WEIGHT = [10, 6, 3, 2];
  function pickPartyTarget(alive) {
    var weights = alive.map(function (m, i) { return ROW_WEIGHT[i] || 1; });
    var total = weights.reduce(function (a, b) { return a + b; }, 0);
    var r = Math.random() * total;
    for (var i = 0; i < alive.length; i++) {
      r -= weights[i];
      if (r <= 0) return alive[i];
    }
    return alive[alive.length - 1];
  }

  // ボスの大技。全体攻撃だけでなく、痛恨の一撃と 状態異常も持てるようにする。
  // 「まだ余裕がある」と思っていたところへ痛恨が入る ―― あの怖さが山場を作る。
  // ボスも雑魚も、同じ仕組みで技を使う。
  // 「呪術師もどき」が殴るだけ、という状態を無くすためにここを共通化した。
  function skillPool(enemy) { return enemy.bossSkills || enemy.skills || null; }

  function useEnemySkill(enemy, alive) {
    var pool = skillPool(enemy);
    var skill = pool[Math.floor(Math.random() * pool.length)];

    // 息と呪文は しゅび力を通さない。鎧を固めても軽くならない
    if (skill.kind === 'breath' || skill.kind === 'spell') {
      var targets = skill.target === 'all_party' ? alive : [pickPartyTarget(alive)];
      say(enemy.label + 'は ' + skill.name + 'を はなった!',
          function () { Game.Audio.play(skill.kind === 'spell' ? 'spell' : 'hit'); });
      targets.forEach(function (member) {
        var d = hurt(member, Math.round(damageOf(effAtk(enemy), 0) * (skill.power || 1)), skill.element);
        say(member.name + 'に ' + d + ' の ダメージ', fxPartyHurt(member, d));
        if (member.hp <= 0) say(member.name + 'は たおれてしまった!', function () { Game.Audio.play('downed'); });
      });
      return true;
    }

    // 自分か、いちばん傷ついた仲間を癒す
    if (skill.kind === 'heal') {
      var hurtOnes = aliveEnemies().filter(function (e) { return e.curHp < e.hp; });
      if (hurtOnes.length === 0) return false;   // 全員無傷なら、殴りに回る
      hurtOnes.sort(function (a2, b2) { return (a2.curHp / a2.hp) - (b2.curHp / b2.hp); });
      var patient = hurtOnes[0];
      var amount = Math.round((skill.power || 20));
      patient.curHp = Math.min(patient.hp, patient.curHp + amount);
      say(enemy.label + 'は ' + skill.name + 'を となえた!', function () { Game.Audio.play('heal'); });
      say(patient.label + 'の きずが 回復した!');
      return true;
    }

    if (skill.kind === 'crit') {
      // 痛恨は守備を通さない。堅い者を前に置いていても、これだけは効く
      var t = pickPartyTarget(alive);
      var raw = Math.round(damageOf(effAtk(enemy), 0) * (skill.power || 1.5));
      var dmg = hurt(t, raw);
      say(enemy.label + 'の ' + skill.name + '!', function () { Game.Fx.critical(); });
      say(t.name + 'に ' + dmg + ' の ダメージ!', fxPartyHurt(t, dmg));
      if (t.hp <= 0) say(t.name + 'は たおれてしまった!', function () { Game.Audio.play('downed'); });
      return true;
    }

    if (skill.kind === 'ailment') {
      var victim = pickPartyTarget(alive);
      say(enemy.label + 'の ' + skill.name + '!', function () { Game.Audio.play('spell'); });
      var msg = Game.Party.inflict(victim, skill.ailment);
      state.log.push(msg || victim.name + 'には 効かなかった。');
      return true;
    }

    if (skill.target === 'all_party') {
      alive.forEach(function (member) {
        var d = hurt(member, Math.round(damageOf(effAtk(enemy), effDef(member)) * skill.power), skill.element);
        say(enemy.label + 'の ' + skill.name + '! ' + member.name + 'に ' + d + ' の ダメージ', fxPartyHurt(member, d));
      });
      return true;
    }
    return false;
  }

  function enemyAct(enemy) {
    var alive = Game.Party.aliveList();
    if (alive.length === 0) return;
    if (maybeFlee(enemy)) return;
    if (!enemyStatus(enemy)) return;

    // 技を持っている魔物は、確率で技を選ぶ。ボスほど頻繁ではない
    var pool = skillPool(enemy);
    if (pool && pool.length && Math.random() < (enemy.skillRate || (enemy.boss ? 0.4 : 0.3))) {
      if (useEnemySkill(enemy, alive)) return;
    }
    var target = pickPartyTarget(alive);
    if (enemy.status === 'blind' && Math.random() < 0.6) {
      state.log.push(enemy.label + 'の こうげき! しかし 攻撃は はずれた!');
      return;
    }
    var dmg2 = hurt(target, damageOf(effAtk(enemy), effDef(target)), 'physical');
    say(enemy.label + 'の こうげき! ' + target.name + 'に ' + dmg2 + ' の ダメージ', fxPartyHurt(target, dmg2));
    if (target.hp <= 0) say(target.name + 'は たおれてしまった!', function () { Game.Audio.play('downed'); });
    // 棘の胸当て。受けた打撃の一部が、殴った相手へ返る
    var thorns = Game.Party.traitsOf(target).thorns;
    if (thorns > 0 && dmg2 > 0 && enemy.curHp > 0) {
      var back = Math.max(1, Math.round(dmg2 * thorns));
      enemy.curHp = Math.max(0, enemy.curHp - back);
      say(enemy.label + 'に ' + back + ' の 反撃の ダメージ', fxEnemyHurt(enemy, back));
      if (enemy.curHp <= 0) say(enemy.label + 'を たおした!', vanish(enemy));
    }
    // 状態異常を持つ魔物は、攻撃に乗せて仕掛けてくる
    if (enemy.inflict && target.hp > 0 && Math.random() < enemy.inflict.chance) {
      var msg = Game.Party.inflict(target, enemy.inflict.status);
      if (msg) state.log.push(msg);
    }
  }

  function checkEnemiesDefeated(cb) {
    if (aliveEnemies().length > 0) { cb(false); return; }
    if (state.enemies.every(function (e) { return e.fled; })) {
      // 全部逃げていった。取り分は無し
      Game.Dialogue.show('魔物たちは にげさっていった。', function () { endBattle('won'); });
      cb(true);
      return;
    }
    var beaten = state.enemies.filter(function (e) { return !e.fled; });
    var exp = beaten.reduce(function (s, e) { return s + e.exp; }, 0);
    var gold = beaten.reduce(function (s, e) { return s + e.gold; }, 0);
    Game.Party.addGold(gold);
    var levelMsgs = Game.Party.addExp(exp);
    var msg = 'せんとうに かちどきをあげた! ' + exp + 'の けいけんちと ' + gold + 'ゴールドを てにいれた';
    Game.Audio.play('victory');
    Game.Dialogue.show(msg, function () {
      // レベルが上がったなら、勝利のジングルのあとに上昇の音を重ねる
      if (levelMsgs && levelMsgs.length) Game.Audio.play('levelup');
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
    Game.Fx.clear();   // 揺れたままフィールドへ戻らない
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
      say(actor.name + 'は ' + skill.name + 'の かまえを とった!', function () { Game.Audio.play('spell'); });
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
    if (a.kind === 'rage') return resolveRage(actor, a.target);
    // 'guarded' は選んだ時点で効いているので、ここでは何もしない
  }

  // 溜まった猛りを叩きつける。守備は通さない ―― 耐えて返す一撃なので
  function resolveRage(actor, target) {
    var lim = actor.limit;
    if (!lim) return;
    actor.rage = 0;
    var all = lim.target === 'all_enemies';
    var list = all ? aliveEnemies() : [target];
    if (!all && (!target || target.curHp <= 0)) list = aliveEnemies().slice(0, 1);
    say(actor.name + 'の ' + lim.name + '!!', function () { Game.Fx.critical(); });
    list.forEach(function (t) {
      if (!t || t.curHp <= 0) return;
      var raw = Math.round(damageOf(powerStat(actor, lim), 0) * (lim.power || 2.6));
      var hit = applyResistance(t, lim.element || 'physical', raw);
      t.curHp = Math.max(0, t.curHp - hit.dmg);
      say(t.label + 'に ' + hit.dmg + ' の ダメージ' + hit.note, fxEnemyHurt(t, hit.dmg));
      if (t.curHp <= 0) say(t.label + 'を たおした!', vanish(t));
    });
  }

  function resolveAttack(actor, target) {
    if (!target || target.curHp <= 0 || state.enemies.indexOf(target) < 0) {
      target = aliveEnemies()[0];   // 狙っていた相手が先に倒れていたら、残りへ振り替える
      if (!target) return;
    }
    var crit = isCritical(actor);
    // かいしんの一撃は守備力を無視するので、damageOf に def:0 を渡す
    var raw = crit ? Math.round(damageOf(effAtk(actor), 0) * 1.4) : damageOf(effAtk(actor), effDef(target));
    // はぐれ者は何を当てても通らないが、かいしんの一撃だけは別。
    // ドラクエでメタルを狩るのが「会心待ち」になるのは、この一行のため。
    var hit = (crit && target.metal)
      ? { dmg: raw, note: ' 硬い体を 貫いた!' }
      : applyResistance(target, 'physical', raw);
    var dmg = hit.dmg;
    target.curHp = Math.max(0, target.curHp - dmg);
    if (crit) say('かいしんの いちげき!!', function () { Game.Fx.critical(); });
    say(actor.name + 'の こうげき! ' + target.label + 'に ' + dmg + ' の ダメージ' + hit.note, fxEnemyHurt(target, dmg));
    if (target.curHp <= 0) say(target.label + 'を たおした!', vanish(target));
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
    // 章の主からは逃げられない。逃げ場が無いことが山場をつくる
    if (alive.some(function (e) { return e.boss; })) {
      state.log.push('しかし にげられない!');
      return;
    }
    var avgEnemySpd = alive.reduce(function (s, e) { return s + e.spd; }, 0) / Math.max(1, alive.length);
    // 素早さは装備とピオリム/ボミオスを込みで見る(ここだけ生の値を読んでいた)
    var success = Math.random() < (0.5 + (effSpd(actor) - avgEnemySpd) * 0.03);
    if (success) {
      a.fled = true;
      Game.Audio.play('escape');
      Game.Dialogue.show(actor.name + 'たちは にげだした!', function () { endBattle('fled'); });
      return;
    }
    state.log.push('しかし まわりこまれてしまった!');
  }

  function resolveSkill(actor, skill, target) {
    if (actor.mp < skill.mp) { state.log.push(actor.name + 'は MPが たりない!'); return; }
    actor.mp -= skill.mp;
    // 唱えた、という宣言の一行。say() と紛らわしくならないよう名前を分ける
    var chant = actor.name + 'は ' + skill.name + 'を となえた!';

    if (skill.kind === 'heal') {
      var targets = skill.target === 'all_allies' ? Game.Party.aliveList() : [target];
      state.log.push(chant);
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
      state.log.push(chant);
      var msg = Game.Party.cure(target, skill.cures || []);
      state.log.push(msg || 'しかし なにも おこらなかった');
      return;
    }

    if (skill.kind === 'revive') {
      state.log.push(chant);
      if (!target || target.hp > 0) { state.log.push('しかし なにも おこらなかった'); return; }
      if (Math.random() > (skill.chance || 0.5)) { state.log.push('しかし ' + target.name + 'は 生きかえらなかった'); return; }
      target.hp = Math.max(1, Math.round(target.maxHp * (skill.power || 0.5)));
      target.status = null;
      state.log.push(target.name + 'は 生きかえった!');
      return;
    }

    if (skill.kind === 'buff') {
      var allies = skill.target === 'all_allies' ? Game.Party.aliveList() : [target];
      state.log.push(chant);
      allies.forEach(function (t) {
        if (!t || t.hp <= 0) return;
        applyMul(t, skill.stat_key, skill.mul);
        state.log.push(t.name + 'の ' + STAT_LABEL[skill.stat_key] + 'が あがった!');
      });
      return;
    }

    if (skill.kind === 'debuff') {
      var foes = skill.target === 'all_enemies' ? aliveEnemies() : [target];
      state.log.push(chant);
      foes.forEach(function (t) {
        if (!t || t.curHp <= 0) return;
        // 状態異常と同じで、弱体にも耐性がある。ボスは弾きやすい。
        // これが無いと、ルカニを2回唱えるだけで どのボスも守備が底に張りついた。
        var odds = (skill.chance || 0.75) * Game.Data.resistanceOf(t, 'ailment');
        if (t.boss) odds *= 0.5;
        if (Math.random() > odds) { state.log.push(t.label + 'には きかなかった!'); return; }
        applyMul(t, skill.stat_key, skill.mul);
        state.log.push(t.label + 'の ' + STAT_LABEL[skill.stat_key] + 'が さがった!');
      });
      return;
    }

    if (skill.kind === 'ailment') {
      state.log.push(chant);
      if (!target || target.curHp <= 0) { state.log.push('しかし なにも おこらなかった'); return; }
      // 種族ごとの強さを掛ける。アンデッドは眠らず、石像はほとんど効かない。
      var odds = (skill.chance || 0.5) * Game.Data.resistanceOf(target, 'ailment');
      if (target.boss) odds *= 0.35;   // ボスは効きにくいが、無効ではない
      if (Math.random() > odds) { state.log.push(target.label + 'には きかなかった!'); return; }
      target.status = skill.ailment;
      state.log.push(target.label + AILMENT_LINE[skill.ailment]);
      return;
    }

    if (skill.kind === 'attack') {
      var list = skill.target === 'all_enemies' ? aliveEnemies() : [target];
      if (skill.target !== 'all_enemies' && (!target || target.curHp <= 0)) list = aliveEnemies().slice(0, 1);
      list.forEach(function (t) {
        // 呪文は しゅび力で減らない。だから「硬い相手には呪文」という役割分担が立つ。
        // ちから基準の武技は、いままでどおり守備に阻まれる。
        var pierces = (skill.stat || 'mag') === 'mag';
        var raw2 = Math.round(damageOf(powerStat(actor, skill), pierces ? 0 : effDef(t)) * (skill.power || 1));
        var hit2 = applyResistance(t, skill.element || 'physical', raw2);
        t.curHp = Math.max(0, t.curHp - hit2.dmg);
        say(actor.name + 'の ' + skill.name + '! ' + t.label + 'に ' + hit2.dmg + ' の ダメージ' + hit2.note, fxEnemyHurt(t, hit2.dmg));
        if (t.curHp <= 0) say(t.label + 'を たおした!', vanish(t));
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
    if (state.menu === 'main') return commandList(actor);
    if (state.menu === 'skill') return usableSkills(actor);
    if (state.menu === 'item') return usableItems();
    if (state.menu === 'tactic') return Game.Data.Tactics;
    if (state.menu === 'target' || state.menu === 'ragetarget') return aliveEnemies();
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
      if (state.menu === 'ragetarget') { state.menu = 'main'; state.cursor = 0; }
      else if (state.menu === 'target' || state.menu === 'allytarget') { state.menu = state.pendingSkill ? 'skill' : (state.pendingItem ? 'item' : 'main'); state.pendingSkill = null; state.pendingItem = null; state.cursor = 0; }
      else if (state.menu !== 'main') { state.menu = 'main'; state.cursor = 0; }
      return;
    }

    if (!Game.Input.wasPressed('confirm') || list.length === 0) return;

    if (state.menu === 'main') {
      var cmd = list[state.cursor].id;
      if (cmd === 'attack') { state.menu = 'target'; state.cursor = 0; }
      else if (cmd === 'skill') { state.menu = 'skill'; state.cursor = 0; }
      else if (cmd === 'item') { state.menu = 'item'; state.cursor = 0; }
      else if (cmd === 'tactic') { state.menu = 'tactic'; state.cursor = 0; }
      else if (cmd === 'guard') { doGuard(); }
      else if (cmd === 'flee') { doFlee(); }
      else if (cmd === 'rage') {
        var lim = currentActor().limit;
        if (lim && lim.target === 'all_enemies') { queueAction({ kind: 'rage' }); }
        else { state.menu = 'ragetarget'; state.cursor = 0; }
      }
    } else if (state.menu === 'tactic') {
      var t = list[state.cursor];
      Game.Party.setTactic(t.id);
      state.menu = 'main';
      state.cursor = 0;
      state.log.push('さくせんを 「' + t.name + '」に した。');
      // 指図しない方針を選んだなら、この手番からもう自分で動いてもらう
      if (t.id !== 'manual') { flushLog(function () { beginTurn(); }); }
      return;
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
    } else if (state.menu === 'ragetarget') {
      queueAction({ kind: 'rage', target: list[state.cursor] });
    } else if (state.menu === 'allytarget') {
      var allyTarget = list[state.cursor];
      if (state.pendingSkill) { var sk2 = state.pendingSkill; state.pendingSkill = null; doSkill(sk2, allyTarget); }
      else { var it = state.pendingItem; state.pendingItem = null; doItem(it, allyTarget); }
    }
  }

  // 「たおした!」の行を送った瞬間に、魔物を画面から退場させる
  function vanish(enemy, quiet) {
    return function () {
      enemy.vanished = true;
      if (!quiet) Game.Audio.play('downed');
    };
  }

  // 白く光らせた魔物の絵を作って取っておく。毎フレーム作り直すと重いので1体1枚。
  var flashCache = {};
  function flashed(img) {
    var key = img.src;
    if (!flashCache[key]) {
      var c = document.createElement('canvas');
      c.width = img.width; c.height = img.height;
      var g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = 'source-atop';   // 絵のある所だけを白く塗る
      g.fillStyle = '#ece7da';
      g.fillRect(0, 0, c.width, c.height);
      flashCache[key] = c;
    }
    return flashCache[key];
  }

  // 魔物の並び。ドラクエと同じで、みんな同じ地面の線に足を揃えて立たせる。
  var GROUND_Y = 226;           // この高さに足元が来る(下の窓と重ならない位置)
  var MOB_H = 96, BOSS_H = 160; // 素材のドット数(絵が無いときは丸の直径として使う)

  function drawEnemies(ctx, W, H) {
    var enemies = state.enemies;
    // HPが0になった瞬間に消すと、「〜を たおした!」の文より絵が先に進んでしまう。
    // 文を送ったところで vanished が立ち、そこで初めて画面から消える。
    var shown = enemies.map(function (e, i) { return { e: e, i: i }; })
                       .filter(function (o) { return !o.e.vanished; });
    if (shown.length === 0) return;

    // 幅が足りないときは、全員そろえて縮める(1体だけ小さくならないように)
    var natural = shown.reduce(function (sum, o) {
      return sum + (o.e.boss ? BOSS_H : MOB_H);
    }, 0) + (shown.length - 1) * 16;
    var scale = Math.min(1, (W - 48) / natural);

    var totalW = natural * scale;
    var x = (W - totalW) / 2;
    shown.forEach(function (o) {
      var e = o.e;
      var size = (e.boss ? BOSS_H : MOB_H) * scale;
      var flash = Game.Fx.enemyFlash(o.i);
      // 殴られた相手はのけぞる
      var dx = flash > 0 ? Math.round(flash * 10) * (o.i % 2 ? -1 : 1) : 0;
      var cx = x + size / 2 + dx;
      var img = Game.Assets.monster(e.id);

      if (img) {
        var top = GROUND_Y - size;
        ctx.drawImage(img, x + dx, top, size, size);
        if (flash > 0) {
          ctx.save();
          ctx.globalAlpha = flash * 0.85;
          ctx.drawImage(flashed(img), x + dx, top, size, size);
          ctx.restore();
        }
      } else {
        // まだ絵が無い魔物。いままでどおり色の丸で立たせる
        var r = size * 0.36;
        var cy = GROUND_Y - r;
        ctx.fillStyle = e.boss ? '#8a3230' : '#96702a';
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        if (flash > 0) {
          ctx.save();
          ctx.globalAlpha = flash * 0.85;
          ctx.fillStyle = '#ece7da';
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
          ctx.restore();
        }
      }

      Game.Renderer.drawText(ctx, e.label || e.name, cx, GROUND_Y + 17, { align: 'center', size: 11 });
      // 魔物の残りHPは見せない。「あと何発で倒せるか」が分からないことが
      // ドラクエの戦闘の緊張そのものなので、ここは数えさせる。
      if ((state.menu === 'target' || state.menu === 'ragetarget') && aliveEnemies()[state.cursor] === e) {
        Game.Renderer.drawText(ctx, '▼', cx, GROUND_Y - size - 6, { align: 'center', size: 18, color: '#d4af5a' });
      }
      x += size + 16 * scale;
    });
  }

  function draw(ctx, W, H) {
    if (!state) return;
    ctx.fillStyle = '#171b2b';
    ctx.fillRect(0, 0, W, H);

    // 戦っている場所の背景。まだ絵が無い場所は、いままでどおり色面のまま。
    var map = Game.Field.currentMap();
    var bg = map && Game.Assets.battleBg(map.id);
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
      // 魔物の名前とHPバーが背景に埋もれないよう、上半分だけ薄く沈める
      var veil = ctx.createLinearGradient(0, 0, 0, H * 0.55);
      veil.addColorStop(0, 'rgba(23,27,43,0.42)');
      veil.addColorStop(1, 'rgba(23,27,43,0.05)');
      ctx.fillStyle = veil;
      ctx.fillRect(0, 0, W, H * 0.55);
    }

    drawEnemies(ctx, W, H);

    // パーティ全員のステータス(横一列、人数に応じて幅を自動調整)
    var party = Game.Party.list();
    // 会話ウィンドウ(下から110px)と重ならない高さに置く
    var statusY = H - 218, statusH = 68, gap = 6;
    var cardW = (W - 16 - (party.length - 1) * gap) / party.length;
    party.forEach(function (m, i) {
      var x = 8 + i * (cardW + gap), y = statusY;
      var isCurrent = state.phase === 'command' && m.id === state.turnOrder[state.turnIndex];
      Game.Renderer.drawPanel(ctx, x, y, cardW, statusH);
      Game.Renderer.drawText(ctx, (isCurrent ? '▶' : '') + m.name, x + 8, y + 18, { size: 11, color: m.hp <= 0 ? '#6b6354' : (isCurrent ? '#d4af5a' : '#ece7da') });
      var st = Game.Party.statusOf(m);
      if (st) Game.Renderer.drawText(ctx, st.short, x + cardW - 8, y + 18, { size: 11, align: 'right', color: st.color });
      // 猛りが満ちた者に「猛」の一文字。数字も棒も出さない
      else if (isFuming(m)) Game.Renderer.drawText(ctx, '猛', x + cardW - 8, y + 18, { size: 12, align: 'right', color: '#d4af5a' });
      // ドラクエは棒グラフを使わない。数字だけを並べる。
      // 残りが「あと何発ぶんか」を自分で数えることが、緊張のもとになっている。
      var low = m.hp <= m.maxHp * 0.25;
      Game.Renderer.drawText(ctx, 'HP', x + 10, y + 42, { size: 12, color: '#a49b86' });
      Game.Renderer.drawText(ctx, m.hp + '/' + m.maxHp, x + cardW - 10, y + 42,
        { size: 13, align: 'right', color: low ? '#d3807d' : '#ece7da' });
      if (m.maxMp > 0) {
        Game.Renderer.drawText(ctx, 'MP', x + 10, y + 60, { size: 12, color: '#a49b86' });
        Game.Renderer.drawText(ctx, m.mp + '/' + m.maxMp, x + cardW - 10, y + 60,
          { size: 13, align: 'right', color: '#ece7da' });
      }
    });

    // いまの さくせん。方針で動いているときは、それが見えていないと
    // 「なぜ勝手に動くのか」が分からなくなる
    var tac = Game.Data.tacticOf(Game.Party.tactic());
    Game.Renderer.drawText(ctx, 'さくせん ' + tac.name, W - 12, 20,
      { size: 11, align: 'right', color: tac.id === 'manual' ? '#6b6354' : '#d4af5a' });

    // コマンドメニュー(現在の行動者ぶんのみ)
    var menuY = H - 84, menuH = 76;
    if (state.phase === 'command' && state.menu === 'main') {
      // ドラクエの戦闘コマンドは、左下の小さな窓に縦一列。
      // 横いっぱいの帯に2列で並べていたので、左右キーが要るうえ間延びしていた。
      var mainList = currentMenuList();
      var mw = 150, mh = 22 + mainList.length * 19;
      var mx = 8, my = Math.max(H - 6 - mh, statusY + statusH + 6);
      Game.Renderer.drawPanel(ctx, mx, my, mw, mh);
      mainList.forEach(function (item, i) {
        var sel = i === state.cursor;
        Game.Renderer.drawText(ctx, (sel ? '▶' : '　') + item.label,
          mx + 12, my + 26 + i * 19,
          { size: 13, color: sel ? '#d4af5a' : '#ece7da' });
      });
      Game.Dialogue.draw(ctx, W, H);
      return;
    }
    if (state.phase === 'command' && state.menu !== 'target' && state.menu !== 'ragetarget' && state.menu !== 'allytarget') {
      var list = currentMenuList();
      Game.Renderer.drawPanel(ctx, 8, menuY, W - 16, menuH);
      if (list.length === 0) {
        Game.Renderer.drawText(ctx, '(つかえるものが ない)', 20, menuY + 24, { size: 12, color: '#a49b86' });
      }
      if (state.menu === 'tactic') {
        var now = Game.Party.tactic();
        list.forEach(function (t, i) {
          var sel = i === state.cursor;
          Game.Renderer.drawText(ctx, (sel ? '▶ ' : '　') + (t.id === now ? '● ' : '　') + t.name,
            20, menuY + 20 + i * 18, { size: 12, color: sel ? '#d4af5a' : '#ece7da' });
          Game.Renderer.drawText(ctx, t.note, W - 20, menuY + 20 + i * 18,
            { size: 11, align: 'right', color: '#a49b86' });
        });
        Game.Dialogue.draw(ctx, W, H);
        return;
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

  return { __commands: commandList, start: start, isActive: isActive, update: update, draw: draw,
           // 検証用: いまの戦闘の中身と、逃走判定
           __state: function () { return state; },
           __resolveFlee: resolveFlee, __resolveSkill: resolveSkill, __enemyAct: enemyAct,
           __hurt: hurt, __resolveRage: resolveRage, __autoHerb: autoHerb };
})();
