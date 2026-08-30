// ストーリー進行管理 ― 全16章(序章+第一〜十四章+終章)の章・ステージ進行を統括する
var Game = window.Game || {};
Game.Story = (function () {
  var chapterIndex = 0;
  var stageIndex = 0;
  var finished = false;
  var openedChests = {}; // "mapId:x,y" -> true
  var onModeChange = null; // 'field' | 'battle' への切り替えを Core に伝える

  // いまのステージの達成状況。ステージが変わるたびに作り直す。
  var progress = { talked: {}, defeated: 0, lit: 0 };
  // 分かれ道で選んだ結果。章をまたいで持ち回り、終章の描写に効く。
  var flags = {};

  // 物語を終えたあとは章もステージも存在しない。null を返して、
  // 呼ぶ側が「もう進行は無い」と分かるようにしておく。
  function chapter() { return Game.Data.Chapters[chapterIndex] || null; }
  function stage() {
    var ch = chapter();
    return ch ? ch.stages[stageIndex] || null : null;
  }
  function hasFlag(name) { return !!flags[name]; }

  // ---- ステージの達成条件 ----
  // require: { talk: [npcId...], defeat: 体数 }
  function talkLeft(st) {
    var need = (st.require && st.require.talk) || [];
    return need.filter(function (id) { return !progress.talked[id]; });
  }
  function defeatLeft(st) {
    var need = (st.require && st.require.defeat) || 0;
    return Math.max(0, need - progress.defeated);
  }
  // 制限つきの段。決められた歩数のうちに片づけないと、被害が広がる。
  // 歩数で数えるのは、この作品に「時間」が歩くこと以外に無いため。
  var stageStartStep = 0;
  var overrunTold = false;
  function stepsLeft(st) {
    var limit = st && st.require && st.require.withinSteps;
    if (!limit) return null;
    return Math.max(0, limit - (Game.Field.stepCount() - stageStartStep));
  }

  function litLeft(st) {
    var need = (st.require && st.require.light) || 0;
    return Math.max(0, need - progress.lit);
  }
  function requirementsMet(st) {
    return talkLeft(st).length === 0 && defeatLeft(st) === 0 && litLeft(st) === 0;
  }

  // 画面の隅に出す「いま何をすべきか」。残りの数もここで見せる。
  function currentGoal() {
    if (finished) return null;
    var st = stage();
    if (!st) return null;
    var parts = [];
    var tl = talkLeft(st);
    if (tl.length) parts.push('あと ' + tl.length + '人と 話す');
    var dl = defeatLeft(st);
    if (dl) parts.push('魔物を あと ' + dl + '体');
    var ll = litLeft(st);
    if (ll) parts.push((st.lightWord || '灯') + 'が あと ' + ll + 'つ');
    var sl = stepsLeft(st);
    if (sl !== null && !requirementsMet(st)) {
      parts.push(sl > 0 ? 'のこり ' + sl + '歩' : '手遅れ');
    }
    var base = st.goal || (st.type === 'boss' ? '最奥の敵を たおす' : '出口をめざす');
    return parts.length ? base + '  (' + parts.join(' / ') + ')' : base;
  }
  function isFinished() { return finished; }
  function currentTitle() {
    var ch = chapter();
    return (finished || !ch) ? '― ロトの継承 完 ―' : ch.title;
  }

  function begin(modeChangeCb) {
    onModeChange = modeChangeCb;
    chapterIndex = 0; stageIndex = 0; finished = false;
    openedChests = {};
    progress = { talked: {}, defeated: 0, lit: 0 };
    flags = {};
    enterChapter();
  }

  // ---- セーブ/ロード ----
  function serialize() {
    return {
      chapterIndex: chapterIndex, stageIndex: stageIndex, finished: finished,
      openedChests: openedChests, progress: progress, flags: flags,
    };
  }

  // 記録した地点から再開する。章の導入は流し直さず、褒賞や仲間加入も
  // 二重に適用しないよう、マップの読み込みだけをやり直す。
  function resume(data, modeChangeCb) {
    onModeChange = modeChangeCb;
    chapterIndex = Math.min(data.chapterIndex || 0, Game.Data.Chapters.length - 1);
    finished = !!data.finished;
    openedChests = data.openedChests || {};
    progress = data.progress || { talked: {}, defeated: 0, lit: 0 };
    progress.talked = progress.talked || {};
    flags = data.flags || {};
    var ch = chapter();
    if (!ch) { finished = true; return null; }
    stageIndex = Math.min(data.stageIndex || 0, ch.stages.length - 1);
    var st = stage();
    if (st) Game.Field.load(st.map, fieldCallbacksFor(st));
    return st;
  }

  function enterChapter() {
    var ch = chapter();
    // 章の切り替わりでも全快はさせない。全回復してしまうと、宿屋も道具も
    // 使う理由が一度も来なくなるため(通しプレイでHPの減りが中央値0%だった)。
    // 倒れた仲間だけは、物語が続かなくなるので立ち上がってもらう。
    Game.Party.reviveFallen();
    // 章タイトルと導入を読んでいる間、背後にこれから進む舞台を映しておく
    // (先にマップを読み込まないと、導入の間ずっと真っ暗な画面になってしまう)
    Game.Field.load(ch.stages[0].map, fieldCallbacksFor(ch.stages[0]));
    Game.Dialogue.show(ch.title, function () {
      showLines(ch.intro.slice(), function () { loadStage(); });
    });
  }

  function showLines(lines, done) {
    if (lines.length === 0) { done(); return; }
    var l = lines.shift();
    Game.Dialogue.show(l, function () { showLines(lines, done); });
  }

  // そのステージ用のフィールドイベント一式。enterChapter の先読みと loadStage で共用する
  function fieldCallbacksFor(st) {
    return {
      onEncounter: function (monsterIds) {
        Game.Core.setBossFight(false);
        onModeChange && onModeChange('battle');
        Game.Battle.start(monsterIds, handleRandomBattleEnd);
      },
      onGate: function () {
        if (st.type !== 'gate') return;
        if (!requirementsMet(st)) { sayBlocked(st); return; }
        handleStageClear();
      },
      onBoss: function (bossId) {
        if (st.type !== 'boss' || bossId !== st.bossId) return;
        if (!requirementsMet(st)) { sayBlocked(st); return; }
        Game.Core.setBossFight(true);
        onModeChange && onModeChange('battle');
        Game.Battle.start([bossId], handleBossBattleEnd);
      },
      onShop: function (shopKind, mapId) {
        onModeChange && onModeChange('shop');
        Game.Shop.open(shopKind, mapId, function () { onModeChange && onModeChange('field'); });
      },
      onChest: function (chestId, mapId, pos) { openChest(chestId, mapId, pos); },
      onNpc: function (npcId, map) { talkTo(npcId, map); },
      onSwitch: function (x, y) { lightUp(st, x, y); },
      onStep: function () { checkOverrun(st); },
    };
  }

  // まだ条件を満たしていないときに、何が足りないのかを伝える
  function sayBlocked(st) {
    var tl = talkLeft(st);
    var dl = defeatLeft(st);
    if (st.blocked) { Game.Dialogue.show(st.blocked); return; }
    if (tl.length) {
      Game.Dialogue.show('まだ 話していない者が ' + tl.length + '人 いる。');
      return;
    }
    if (dl) { Game.Dialogue.show('まだ 魔物が ' + dl + '体 残っている。'); return; }
    Game.Dialogue.show('まだ ' + (st.lightWord || '灯') + 'が ' + litLeft(st) + 'つ 残っている。');
  }

  // 開けた宝箱は覚えておき、二度目からは空にする(セーブにも含める)
  function openChest(chestId, mapId, pos) {
    var key = mapId + ':' + pos;
    if (openedChests[key]) {
      Game.Dialogue.show('宝箱は 空っぽだ。');
      return;
    }
    openedChests[key] = true;
    Game.Audio.play('chest');
    Game.Dialogue.show('宝箱を 開けた!', function () {
      Game.Dialogue.show(Game.Data.openTreasure(chestId));
    });
  }

  // 話しかけられた相手の、いまの章に合った台詞を流す。
  // その章専用の台詞が無ければ default に落ちる。
  function talkTo(npcId, map) {
    if (!stage()) return;
    var npc = npcId && Game.Data.Npcs[npcId];
    if (!npc) {
      Game.Dialogue.show(map.name + 'の 住人「ロトさま、道中お気をつけて」');
      return;
    }
    // まだ仲間になっていない人物は、その場に居ないことにする
    if (npc.requires && !Game.Party.get(npc.requires)) {
      Game.Dialogue.show(map.name + 'の 住人「その方なら、まだこの街には……」');
      return;
    }
    var st = stage();
    var counted = st && !progress.talked[npcId] &&
      ((st.require && st.require.talk) || []).indexOf(npcId) !== -1;
    var lines = npc.lines[chapterIndex] || npc.lines.default || [];
    showLines(lines.slice(), function () {
      if (!counted) return;
      progress.talked[npcId] = true;
      var left = talkLeft(st).length;
      Game.Dialogue.show(left
        ? '(あと ' + left + '人と 話しておこう)'
        : '(みなと 話し終えた。先へ進もう)');
    });
  }

  // 仕掛けを踏んだ。点けて、残りを伝える。
  // 数えるのは「その段が仕掛けを求めているとき」だけで、
  // それ以外の階では ただの明かりとして点く。
  function lightUp(st, x, y) {
    if (!Game.Field.lightSwitch(x, y)) return;
    Game.Audio.play('chest');
    var word = (st && st.lightWord) || '灯';
    if (!st || !st.require || !st.require.light) {
      Game.Dialogue.show(word + 'に 火が ともった。');
      return;
    }
    progress.lit += 1;
    var left = litLeft(st);
    Game.Dialogue.show(left
      ? word + 'に 火が ともった。(あと ' + left + 'つ)'
      : word + 'に 火が ともった。……最後の ひとつだ。');
  }

  // 制限を超えた瞬間に一度だけ告げる。そこで詰みにはせず、
  // 「間に合わなかった」という事実だけを章に残す(旗は終章まで持ち回る)
  function checkOverrun(st) {
    if (overrunTold) return;
    var sl = stepsLeft(st);
    if (sl === null || sl > 0 || requirementsMet(st)) return;
    overrunTold = true;
    if (st.overrunFlag) flags[st.overrunFlag] = true;
    Game.Audio.play('wipe');
    Game.Dialogue.show(st.overrun || '……間に合わなかった。');
  }

  function loadStage() {
    var st = stage();
    progress = { talked: {}, defeated: 0, lit: 0 };
    overrunTold = false;
    // 同じ階へ入り直したら、仕掛けは消えた状態からやり直す
    Game.Data.resetSwitches(Game.Data.Maps[st.map]);
    applyOnComplete(st.onEnter);
    var proceed = function () {
      Game.Fx.fade(11, 6);   // 舞台が変わる。一拍 暗くしてから次の場所へ
      Game.Field.load(st.map, fieldCallbacksFor(st));
      // 歩数の起点は、マップを読み込んだあとに取る。
      // load は歩数を0に戻すので、先に取ると前の舞台の歩数が起点になり、
      // 制限が実際より長くなってしまう(残り227歩/上限220歩 が出ていた)
      stageStartStep = Game.Field.stepCount();
      Game.Core.updateBgm();   // 町に入ったのか、野へ出たのかで曲を変える
      // 節目ごとに自動で記録しておく(長丁場なので、事故で最初からになるのを防ぐ)
      Game.Save.save();
    };
    if (st.intro) {
      // ステージ導入の間も、その舞台を背景に出しておく
      Game.Field.load(st.map, fieldCallbacksFor(st));
      showLines(st.intro.slice(), proceed);
    } else {
      proceed();
    }
  }

  function handleRandomBattleEnd(result, defeatedIds) {
    onModeChange && onModeChange('field');
    if (result === 'lost') { Game.Core.onPartyWiped(); return; }
    if (result !== 'won') return;
    var st = stage();
    if (!st || !st.require || !st.require.defeat) return;
    var before = defeatLeft(st);
    progress.defeated += (defeatedIds || []).length;
    var left = defeatLeft(st);
    if (before > 0 && left === 0) Game.Dialogue.show('(このあたりの魔物は 片づいた。先へ進もう)');
  }

  function handleBossBattleEnd(result) {
    Game.Core.setBossFight(false);
    onModeChange && onModeChange('field');
    if (result === 'lost') { Game.Core.onPartyWiped(); return; }
    if (result === 'won') handleStageClear();
    // 'fled' はそのまま同じダンジョンへ戻り、再挑戦できる
  }

  function handleStageClear() {
    var st = stage();
    if (st && st.afterClear && !st.__asked) {
      st.__asked = true;   // 同じステージで二度は訊かない
      // afterClear は一つでも、続けて訊く並びでもよい。
      // 「三人の弟子に何を伝えるか」のように、選択が連なる章のために。
      var defs = [].concat(st.afterClear);
      askChoiceSeries(defs.slice(), function () { st.__asked = false; advanceStage(); });
      return;
    }
    advanceStage();
  }

  function askChoiceSeries(defs, done) {
    if (defs.length === 0) { done(); return; }
    var def = defs.shift();
    askChoice(def, function () { askChoiceSeries(defs, done); });
  }

  // 分かれ道を出し、選ばれた枝の台詞と褒賞を適用してから先へ進む
  function askChoice(def, done) {
    Game.Choice.open(def.prompt, def.options.map(function (o) {
      return { label: o.label, note: o.note };
    }), function (i) {
      var opt = def.options[i];
      if (opt.flag) flags[opt.flag] = true;
      showLines((opt.lines || []).slice(), function () {
        applyOnComplete(opt.result);
        done();
      });
    });
  }

  function advanceStage() {
    stageIndex += 1;
    if (stageIndex < chapter().stages.length) { loadStage(); return; }

    var ch = chapter();
    var outro = (ch.outro || []).slice();
    // 分かれ道で選んだ結果を、章の締めに反映する
    (ch.outroIf || []).forEach(function (rule) {
      // flag を持たない行は、選択に関わらず必ず出す
      if (!rule.flag || hasFlag(rule.flag)) outro = outro.concat(rule.lines);
    });
    showLines(outro, function () {
      applyOnComplete(ch.onComplete);
      chapterIndex += 1;
      stageIndex = 0;
      if (chapterIndex >= Game.Data.Chapters.length) {
        finished = true;
      } else {
        enterChapter();
      }
    });
  }

  function applyOnComplete(onComplete) {
    if (!onComplete) return;
    if (onComplete.recruit) {
      Game.Party.recruit(onComplete.recruit);
      var m = Game.Party.get(onComplete.recruit);
      Game.Dialogue.show(m.name + 'が なかまに なった!');
    }
    // 物語の褒賞として受け取る装備(店には並ばない品)
    (onComplete.gear || []).forEach(function (gearId) {
      Game.Party.grantGear(gearId);
      Game.Dialogue.show(Game.Data.Equipment[gearId].name + 'を 手に入れた! (メニューで そうびできる)');
    });
    // 道具での褒賞。「教えた側が受け取るもの」を表すのに使う
    (onComplete.items || []).forEach(function (entry) {
      Game.Party.grantItem(entry.id, entry.count || 1);
      Game.Dialogue.show(Game.Data.Items[entry.id].name + 'を ' + (entry.count || 1) + 'つ 受け取った');
    });
    if (onComplete.gold) {
      Game.Party.addGold(onComplete.gold);
      Game.Dialogue.show(onComplete.gold + 'ゴールドを 受け取った');
    }
  }

  return {
    begin: begin, resume: resume, serialize: serialize,
    isFinished: isFinished, currentTitle: currentTitle,
    currentGoal: currentGoal, hasFlag: hasFlag,
    // 検証用
    __state: function () { return { progress: progress, flags: flags, stage: stage(), finished: finished }; },
    __needTalk: function () { return finished ? [] : talkLeft(stage()); },
    __needDefeat: function () { return finished ? 0 : defeatLeft(stage()); },
    __needLight: function () { return finished ? 0 : litLeft(stage()); },
  };
})();
