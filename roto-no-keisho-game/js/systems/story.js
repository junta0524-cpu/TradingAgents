// ストーリー進行管理 ― 全16章(序章+第一〜十四章+終章)の章・ステージ進行を統括する
var Game = window.Game || {};
Game.Story = (function () {
  var chapterIndex = 0;
  var stageIndex = 0;
  var finished = false;
  var onModeChange = null; // 'field' | 'battle' への切り替えを Core に伝える

  function chapter() { return Game.Data.Chapters[chapterIndex]; }
  function stage() { return chapter().stages[stageIndex]; }
  function isFinished() { return finished; }
  function currentTitle() { return finished ? '― ロトの継承 完 ―' : chapter().title; }

  function begin(modeChangeCb) {
    onModeChange = modeChangeCb;
    chapterIndex = 0; stageIndex = 0; finished = false;
    enterChapter();
  }

  // ---- セーブ/ロード ----
  function serialize() {
    return { chapterIndex: chapterIndex, stageIndex: stageIndex, finished: finished };
  }

  // 記録した地点から再開する。章の導入は流し直さず、褒賞や仲間加入も
  // 二重に適用しないよう、マップの読み込みだけをやり直す。
  function resume(data, modeChangeCb) {
    onModeChange = modeChangeCb;
    chapterIndex = Math.min(data.chapterIndex || 0, Game.Data.Chapters.length - 1);
    finished = !!data.finished;
    var stages = chapter().stages;
    stageIndex = Math.min(data.stageIndex || 0, stages.length - 1);
    var st = stage();
    Game.Field.load(st.map, fieldCallbacksFor(st));
    return st;
  }

  function enterChapter() {
    var ch = chapter();
    // 章の切り替わりは旅の区切り。ここで全員を休ませる(倒れた仲間もここで復帰する)
    Game.Party.restAll();
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
      onEncounter: function (monsterId) {
        onModeChange && onModeChange('battle');
        Game.Battle.start([monsterId], handleRandomBattleEnd);
      },
      onGate: function () { if (st.type === 'gate') handleStageClear(); },
      onBoss: function (bossId) {
        if (st.type === 'boss' && bossId === st.bossId) {
          onModeChange && onModeChange('battle');
          Game.Battle.start([bossId], handleBossBattleEnd);
        }
      },
      onShop: function (shopKind, mapId) {
        onModeChange && onModeChange('shop');
        Game.Shop.open(shopKind, mapId, function () { onModeChange && onModeChange('field'); });
      },
      onNpc: function (map) {
        Game.Dialogue.show(map.name + 'の 住人「ロトさま、道中お気をつけて」');
      },
    };
  }

  function loadStage() {
    var st = stage();
    applyOnComplete(st.onEnter);
    var proceed = function () {
      Game.Field.load(st.map, fieldCallbacksFor(st));
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

  function handleRandomBattleEnd(result) {
    onModeChange && onModeChange('field');
    if (result === 'lost') Game.Core.onPartyWiped();
  }

  function handleBossBattleEnd(result) {
    onModeChange && onModeChange('field');
    if (result === 'lost') { Game.Core.onPartyWiped(); return; }
    if (result === 'won') handleStageClear();
    // 'fled' はそのまま同じダンジョンへ戻り、再挑戦できる
  }

  function handleStageClear() {
    stageIndex += 1;
    if (stageIndex < chapter().stages.length) { loadStage(); return; }

    var ch = chapter();
    showLines((ch.outro || []).slice(), function () {
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
    if (onComplete.gold) {
      Game.Party.addGold(onComplete.gold);
      Game.Dialogue.show(onComplete.gold + 'ゴールドを 受け取った');
    }
  }

  return {
    begin: begin, resume: resume, serialize: serialize,
    isFinished: isFinished, currentTitle: currentTitle,
  };
})();
