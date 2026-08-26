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

  function enterChapter() {
    var ch = chapter();
    Game.Dialogue.show(ch.title, function () {
      showLines(ch.intro.slice(), function () { loadStage(); });
    });
  }

  function showLines(lines, done) {
    if (lines.length === 0) { done(); return; }
    var l = lines.shift();
    Game.Dialogue.show(l, function () { showLines(lines, done); });
  }

  function loadStage() {
    var st = stage();
    applyOnComplete(st.onEnter);
    var proceed = function () {
      Game.Field.load(st.map, {
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
        onNpc: function (map) {
          Game.Dialogue.show(map.name + 'の 住人「ロトさま、道中お気をつけて」');
        },
      });
    };
    if (st.intro) showLines(st.intro.slice(), proceed); else proceed();
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
  }

  return { begin: begin, isFinished: isFinished, currentTitle: currentTitle };
})();
